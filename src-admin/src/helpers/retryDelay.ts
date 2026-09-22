/**
 * Pauses before the next attempt after a request failed at admin start: 2 s, 5 s, then every 10 s.
 *
 * A host that is busy right after the admin was opened (it reads the package.json of every installed
 * adapter for `getInstalled`, in the same process that serves the object database) can miss the
 * five-second command timeout of the socket client. The first attempts follow quickly, because the
 * host is usually free again after a few seconds; later ones stay at ten seconds so that a host that
 * is down for longer is not flooded.
 */
export const RETRY_DELAYS_MS = [2_000, 5_000, 10_000];

/**
 * The pause before the next attempt
 *
 * @param failures how many attempts failed in a row
 */
export function retryDelay(failures: number): number {
    return RETRY_DELAYS_MS[Math.min(Math.max(failures, 0), RETRY_DELAYS_MS.length - 1)];
}

/** Is the error a missing permission? Such an error does not go away by asking again */
export function isPermissionError(error: unknown): boolean {
    const text = error instanceof Error ? error.message : String(error);
    return text.includes('permissionError');
}
