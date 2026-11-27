/**
 * The last backup of BackItUp, shown before updates and on the overview (#3750).
 *
 * BackItUp writes the backups it made into `backitup.X.history.json`: a list with the time stamp, the type,
 * the storage and an error text per backup. `backitup.X.oneClick.iobroker` starts a backup of the type
 * "iobroker" and goes back to `false` when it is through.
 */
import type { AdminConnection } from '@iobroker/gui-components';

/** A backup older than this is shown as a warning */
export const BACKUP_MAX_AGE_MS = 3 * 24 * 3_600_000;

export interface BackupStatus {
    /** e.g. `backitup.0`, empty if BackItUp is not installed */
    instance: string;
    /** The instance runs, so it can make a backup */
    alive: boolean;
    /** Time of the last successful backup of the type "iobroker" in ms, 0 if there is none */
    lastTs: number;
    /** Where it was stored, e.g. "Google Drive", empty if unknown */
    storage: string;
    /** BackItUp makes a backup right now */
    running: boolean;
}

/** The ids behind the status of one instance, e.g. for `backitup.0` */
export function backupStateIds(instance: string): {
    history: string;
    lastTime: string;
    success: string;
    oneClick: string;
    output: string;
    alive: string;
} {
    return {
        history: `${instance}.history.json`,
        lastTime: `${instance}.history.iobrokerLastTime`,
        success: `${instance}.history.iobrokerSuccess`,
        oneClick: `${instance}.oneClick.iobroker`,
        output: `${instance}.output.line`,
        alive: `system.adapter.${instance}.alive`,
    };
}

/**
 * The newest successful backup of the type "iobroker" in the value of `backitup.X.history.json`.
 *
 * @param json the value of the state
 */
export function parseBackupHistory(json: ioBroker.StateValue | undefined): { ts: number; storage: string } | null {
    if (typeof json !== 'string' || !json) {
        return null;
    }
    let list: unknown;
    try {
        list = JSON.parse(json);
    } catch {
        return null;
    }
    if (!Array.isArray(list)) {
        return null;
    }
    let newest: { ts: number; storage: string } | null = null;
    for (const entry of list) {
        if (!entry || typeof entry !== 'object') {
            continue;
        }
        const { type, error, timestamp, storage } = entry as Record<string, unknown>;
        if (type !== 'iobroker' || (error && error !== 'none') || typeof timestamp !== 'number') {
            continue;
        }
        if (!newest || timestamp > newest.ts) {
            newest = { ts: timestamp, storage: typeof storage === 'string' ? storage : '' };
        }
    }
    return newest;
}

/**
 * The time of the last backup from the states of one instance.
 * Older versions of BackItUp have no `history.json`: then the time when `history.iobrokerLastTime`
 * was written, if the last backup was successful.
 */
export function lastBackupFromStates(
    instance: string,
    states: Record<string, ioBroker.State | null | undefined>,
): { ts: number; storage: string } {
    const ids = backupStateIds(instance);
    const fromHistory = parseBackupHistory(states[ids.history]?.val);
    if (fromHistory) {
        return fromHistory;
    }
    const lastTime = states[ids.lastTime];
    if (states[ids.success]?.val === true && lastTime?.ts) {
        return { ts: lastTime.ts, storage: '' };
    }
    return { ts: 0, storage: '' };
}

/** Reads the states of one instance */
async function readInstanceStates(
    socket: AdminConnection,
    instance: string,
): Promise<Record<string, ioBroker.State | null | undefined>> {
    const ids = backupStateIds(instance);
    const list = [ids.history, ids.lastTime, ids.success, ids.oneClick, ids.alive];
    const values = await Promise.all(list.map(id => socket.getState(id).catch((): null => null)));
    const states: Record<string, ioBroker.State | null | undefined> = {};
    list.forEach((id, i) => (states[id] = values[i]));
    return states;
}

/**
 * Finds the BackItUp instance with the newest backup. With several instances a running one wins,
 * if none of them has made a backup yet.
 */
export async function readBackupStatus(socket: AdminConnection): Promise<BackupStatus> {
    const instances = await socket.getAdapterInstances('backitup').catch((): ioBroker.InstanceObject[] => []);
    let best: BackupStatus | null = null;
    for (const obj of instances || []) {
        if (!obj?._id) {
            continue;
        }
        const instance = obj._id.replace('system.adapter.', '');
        const states = await readInstanceStates(socket, instance);
        const ids = backupStateIds(instance);
        const last = lastBackupFromStates(instance, states);
        const status: BackupStatus = {
            instance,
            alive: !!states[ids.alive]?.val,
            lastTs: last.ts,
            storage: last.storage,
            running: states[ids.oneClick]?.val === true,
        };
        if (!best || status.lastTs > best.lastTs || (status.lastTs === best.lastTs && status.alive && !best.alive)) {
            best = status;
        }
    }
    return best || { instance: '', alive: false, lastTs: 0, storage: '', running: false };
}

/** Starts a backup of the type "iobroker" with BackItUp */
export function startBackup(socket: AdminConnection, instance: string): Promise<void> {
    return socket.setState(backupStateIds(instance).oneClick, true);
}

/**
 * How long ago, e.g. "6 hours ago" or "yesterday", in the language of the user
 *
 * @param ts time in ms
 * @param lang language of the user
 * @param now the current time, for the tests
 */
export function formatBackupAge(ts: number, lang: string, now: number = Date.now()): string {
    const rtf = new Intl.RelativeTimeFormat(lang || 'en', { numeric: 'auto' });
    const minutes = Math.round((ts - now) / 60_000);
    if (Math.abs(minutes) < 60) {
        return rtf.format(minutes, 'minute');
    }
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 48) {
        return rtf.format(hours, 'hour');
    }
    return rtf.format(Math.round(hours / 24), 'day');
}
