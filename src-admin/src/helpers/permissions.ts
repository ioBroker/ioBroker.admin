import type { Connection, SocketPermissionOperation, SocketPermissionType } from '@iobroker/socket-client';

export { isPermissionError } from '@iobroker/socket-client';

/**
 * Which tab needs which right, so that admin can say in advance that a tab cannot be used, instead
 * of a loader that never ends and a `permissionError` popping up.
 *
 * The check itself is `hasPermission` of the socket client: it answers from the rights read right
 * after connecting, and an administrator passes at once. The server checks every command again -
 * this is only for the display.
 */

/** Translation function, `%s` in the text is replaced with the arguments */
type Translate = (word: string, ...args: string[]) => string;

/** One right, e.g. `{ type: 'other', operation: 'sendto' }` */
export type Permission = {
    [T in SocketPermissionType]: { type: T; operation: SocketPermissionOperation<T> };
}[SocketPermissionType];

/** Repository, installed versions, host information and the log history all come from the host via `sendToHost` */
export const SEND_TO_HOST: Permission = { type: 'other', operation: 'sendto' };
/** Change an object: start/stop and settings of instances, enums, system settings, ... */
export const OBJECT_WRITE: Permission = { type: 'object', operation: 'write' };
/** Set the value of a state */
export const STATE_WRITE: Permission = { type: 'state', operation: 'write' };
/** Delete an object */
export const OBJECT_DELETE: Permission = { type: 'object', operation: 'delete' };
/** Commands on the host, e.g. `iobroker del` to delete an instance */
export const EXECUTE: Permission = { type: 'other', operation: 'execute' };
/**
 * Users and groups: js-controller checks these rights in addition to the object rights, see
 * `checkObjectRights` for `system.user.*` and `system.group.*`
 */
export const USERS_CREATE: Permission = { type: 'users', operation: 'create' };
export const USERS_WRITE: Permission = { type: 'users', operation: 'write' };
export const USERS_DELETE: Permission = { type: 'users', operation: 'delete' };
/** Files: upload, edit, new folder, rename and the access rights all need `write` */
export const FILE_WRITE: Permission = { type: 'file', operation: 'write' };
export const FILE_DELETE: Permission = { type: 'file', operation: 'delete' };

/**
 * What a tab needs before it can show anything at all. A tab without an entry needs nothing special.
 * The rights are those the server checks for the commands the tab cannot do without.
 */
const TAB_PERMISSIONS: Record<string, Permission[]> = {
    // repository and installed versions: `getCompactRepository`, `getCompactInstalled`
    'tab-adapters': [SEND_TO_HOST],
    // repository and host information
    'tab-hosts': [SEND_TO_HOST],
    // the log history: `getLogs`
    'tab-logs': [SEND_TO_HOST],
    // every device of the config manager is asked for by `sendTo` to its instance
    'tab-devicemanager': [SEND_TO_HOST],
    // `readDir`
    'tab-files': [{ type: 'file', operation: 'list' }],
    // `getObjectView` - objects, enums, users and groups
    'tab-objects': [{ type: 'object', operation: 'list' }],
    'tab-enums': [{ type: 'object', operation: 'list' }],
    'tab-users': [{ type: 'object', operation: 'list' }],
};

/**
 * May the logged-in user do this? Without known rights the answer is yes and the server decides.
 *
 * @param socket connection to admin (`AdminConnection` too)
 * @param permission the right
 */
export function hasPermission(socket: Connection | null | undefined, permission: Permission): boolean {
    // TypeScript cannot follow that `operation` belongs to `type` in the union - the type above ensures it
    return !socket || socket.hasPermission(permission.type, permission.operation as never);
}

/**
 * The rights the user lacks for a tab - empty if the tab can be used
 *
 * @param socket connection to admin
 * @param tab name of the tab, e.g. `tab-adapters`
 */
export function missingTabPermissions(socket: Connection | null | undefined, tab: string): Permission[] {
    // an administrator may everything: no need to look at the table
    if (!socket || socket.isAdministrator()) {
        return [];
    }
    return (TAB_PERMISSIONS[tab] || []).filter(permission => !hasPermission(socket, permission));
}

/**
 * The name of a right with the words of the group dialog (Users → group → Permissions), so that it
 * can be found there, e.g. "Other permissions: sendTo"
 *
 * @param permission the right
 * @param t translation function
 */
export function permissionLabel(permission: Permission, t: Translate): string {
    return `${t(`group_acl_${permission.type}`)}: ${t(`group_acl_${permission.operation}`)}`;
}

/**
 * Why a control is locked, for its tooltip - `null` if the user may use it.
 * E.g. "No permission (Object permissions: write)"
 *
 * @param socket connection to admin
 * @param required the rights the control needs
 * @param t translation function
 */
export function lockedText(socket: Connection | null | undefined, required: Permission[], t: Translate): string | null {
    if (!socket || socket.isAdministrator()) {
        return null;
    }
    const missing = required.filter(permission => !hasPermission(socket, permission));
    return missing.length
        ? `${t('No permission')} (${missing.map(permission => permissionLabel(permission, t)).join(', ')})`
        : null;
}

/**
 * Why the user may not change this object, for a tooltip - `null` if he may. First the rights of
 * the group (`required`), then the rights of the object itself (`obj.acl`): objects belong to
 * `admin` and the group `administrator` by default, everybody else may only read them.
 * E.g. "No permission (Rights of this object - owner: admin, group: administrator)"
 *
 * @param socket connection to admin
 * @param obj the object to change
 * @param required the rights of the group the change needs, e.g. `[OBJECT_WRITE]`
 * @param t translation function
 * @param operation `delete` to delete the object
 * @param part `state` to set the value of a state
 */
export function objectLockedText(
    socket: Connection | null | undefined,
    obj: ioBroker.Object | null | undefined,
    required: Permission[],
    t: Translate,
    operation: 'write' | 'delete' = 'write',
    part: 'object' | 'state' = 'object',
): string | null {
    const locked = lockedText(socket, required, t);
    if (locked || !socket || !obj?.acl || socket.hasObjectPermission(obj, operation, part)) {
        return locked;
    }
    const owner = (obj.acl.owner || '').replace(/^system\.user\./, '');
    const ownerGroup = (obj.acl.ownerGroup || '').replace(/^system\.group\./, '');
    return `${t('No permission')} (${t('Rights of this object - owner: %s, group: %s', owner, ownerGroup)})`;
}
