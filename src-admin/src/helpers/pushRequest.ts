/**
 * Requests whose answer is pushed instead of returned in the callback.
 *
 * Why this exists:
 *
 * `@iobroker/ws` answers every socket callback with the string "timeout" after 30 seconds
 * (socket.io.js: `callbacks.push({ ..., ts: Date.now() + 30_000 })`). A turn of the AI assistant - the
 * LLM plus its tool rounds - and a search through the log files of another host regularly need longer
 * than that, so the answer used to land in a callback that no longer existed: an empty chat bubble or
 * a search that never ends, no error, and nothing in any log because the backend had done its job.
 *
 * So the page subscribes to an instance message and the backend pushes the finished answer there. The
 * `sendTo` callback only carries the immediate acknowledgement, well inside the 30 s. A backend that
 * does not know this protocol answers the old way and is handled unchanged.
 */
import { I18n, type AdminConnection } from '@iobroker/gui-components';

/** Instance-message type for pushed answers. Shared verbatim with `src/main.ts`. */
const PUSH_MESSAGE_TYPE = 'pushedAnswer';

/** How long to wait for a pushed answer when the caller names no budget. */
export const DEFAULT_PUSH_TIMEOUT_MS = 600_000;

interface PushChannel {
    /**
     * The secret the backend handed out for this session when it accepted the subscription.
     *
     * It is not ours to invent: the backend recorded the ioBroker user of this connection under it and
     * authorizes a request by it, so a page can only ever name the session it was given.
     */
    session: string;
    /** Requests that are out, by their id */
    pending: Map<string, (result: unknown) => void>;
}

/** One channel per instance we talk to - normally only the admin instance serving this page. */
const channels = new Map<string, PushChannel>();
/** Guards against two requests subscribing to the same instance at the same time */
const channelPromises = new Map<string, Promise<PushChannel | null>>();
let requestCounter = 0;

/** Drop every channel so the next request subscribes again (after a reconnect, or a failed push). */
export function resetPushChannels(): void {
    channels.clear();
    channelPromises.clear();
}

/**
 * Subscribe this page for pushed answers of one instance, once.
 *
 * Returns `null` when the backend does not accept the subscription - an older admin, for instance.
 * The caller then falls back to the plain request/response round trip.
 *
 * @param socket the admin connection
 * @param instance the instance to talk to, e.g. `admin.0`
 */
async function ensurePushChannel(socket: AdminConnection, instance: string): Promise<PushChannel | null> {
    const existing = channels.get(instance);
    if (existing) {
        return existing;
    }
    let promise = channelPromises.get(instance);
    if (!promise) {
        promise = (async (): Promise<PushChannel | null> => {
            const channel: PushChannel = { session: '', pending: new Map() };
            try {
                const result = await socket.subscribeOnInstance(instance, PUSH_MESSAGE_TYPE, null, (data: unknown) => {
                    const answer = data as { requestId?: string } | undefined;
                    if (!answer?.requestId) {
                        return;
                    }
                    const resolve = channel.pending.get(answer.requestId);
                    if (resolve) {
                        channel.pending.delete(answer.requestId);
                        resolve(answer);
                    }
                });
                // the cast goes away with the next @iobroker/socket-client: `subscribeOnInstance` takes
                // the shape of the fields the instance adds as a type parameter there
                channel.session = (result as { session?: string }).session || '';
                // Without the secret of the session there is no channel: the backend would not be able
                // to attribute a request to this page, and an answer could not be pushed back to it.
                if (!result?.accepted || !channel.session) {
                    return null;
                }
                // A reconnect gives the socket a new id, which makes the backend's handler for this
                // session dead. Without this the next request would wait out its full budget before
                // anyone noticed; dropping the channel makes it subscribe again instead.
                socket.registerConnectionHandler(function onConnectionChange(connected: boolean): void {
                    if (!connected) {
                        socket.unregisterConnectionHandler(onConnectionChange);
                        resetPushChannels();
                    }
                });
                channels.set(instance, channel);
                return channel;
            } catch (e) {
                console.warn('[push] cannot subscribe for pushed answers, falling back to the callback', e);
                return null;
            } finally {
                channelPromises.delete(instance);
            }
        })();
        channelPromises.set(instance, promise);
    }
    return promise;
}

/**
 * Send one request and wait for its answer - pushed as an instance message when the backend supports
 * it for that command, through the socket callback otherwise.
 *
 * @param socket the admin connection
 * @param instance the instance to talk to, e.g. `admin.0`
 * @param command the message command, e.g. `chat:send` or `admin:searchLogs`
 * @param message the message payload (the session token and the request id are added here)
 * @param timeout how long to wait for the answer, in ms
 */
export async function sendPushRequest<T>(
    socket: AdminConnection,
    instance: string,
    command: string,
    message: Record<string, any>,
    timeout: number = DEFAULT_PUSH_TIMEOUT_MS,
): Promise<T> {
    const channel = await ensurePushChannel(socket, instance);
    const requestId = channel ? `req-${++requestCounter}-${Date.now().toString(36)}` : '';

    const result: unknown = await socket.sendTo(instance, command, {
        ...message,
        timeout,
        ...(channel ? { uiSession: channel.session, requestId } : {}),
    });

    // Old backend, or one that did not take the push route: it already answered in full.
    if (!channel || !(result as { accepted?: boolean } | null | undefined)?.accepted) {
        return result as T;
    }

    return new Promise<T>(resolve => {
        const timer = setTimeout(() => {
            channel.pending.delete(requestId);
            // The backend accepted the request and then never pushed - most likely admin was
            // restarted. Subscribing again on the next try is the cheapest recovery.
            resetPushChannels();
            resolve({
                error: I18n.t('No answer within %s s', String(Math.round(timeout / 1000))),
            } as T);
        }, timeout);

        channel.pending.set(requestId, answer => {
            clearTimeout(timer);
            resolve(answer as T);
        });
    });
}
