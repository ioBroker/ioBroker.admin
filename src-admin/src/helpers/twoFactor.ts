import { Connection } from '@iobroker/gui-components';

import { adminHref } from '@/helpers/utils';

/** Answer of `GET 2fa/status` of `@iobroker/webserver` */
export interface TwoFactorStatus {
    enabled: boolean;
    /** Backup codes that are not used yet */
    backupCodes: number;
    /** When it was switched on */
    created?: number;
}

export class TwoFactorError extends Error {
    constructor(
        message: string,
        public readonly status: number,
    ) {
        super(message);
    }
}

/**
 * Call one of the `2fa/*` routes of `@iobroker/webserver`. The browser sends the `access_token` cookie anyway;
 * the token is sent in the header too, because after a single sign-on there may be no cookie.
 *
 * @param path route after `2fa/`, e.g. `status?user=bob`
 * @param body JSON body; with it the request is a POST
 */
export async function twoFactorRequest<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    const headers: Record<string, string> = {};
    const tokens = Connection.readTokens();
    if (tokens?.access_token) {
        headers.Authorization = `Bearer ${tokens.access_token}`;
    }
    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(adminHref(`2fa/${path}`), {
        method: body ? 'POST' : 'GET',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'same-origin',
    });

    let data: Record<string, unknown> = {};
    try {
        data = await response.json();
    } catch {
        // e.g. 404 of an admin with an older web server: no JSON
    }
    if (!response.ok) {
        throw new TwoFactorError((data.error as string) || response.statusText, response.status);
    }
    return data as T;
}
