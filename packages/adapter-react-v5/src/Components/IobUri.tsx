import type { Connection } from '@/index';

export type IobUri = string;
export type IobUriType = 'object' | 'state' | 'file' | 'http' | 'base64';

export type IobUriParsed = { type: IobUriType; address: string; path?: string };

export function iobUriToString(uri: IobUriParsed): IobUri {
    if (uri.type === 'object') {
        return `iobobject://${uri.address}/${uri.path || ''}`;
    }
    if (uri.type === 'state') {
        return `iobstate://${uri.address}`;
    }
    if (uri.type === 'file') {
        return `iobfile://${uri.address}/${uri.path || ''}`;
    }
    if (uri.type === 'http') {
        return uri.address;
    }
    if (uri.path?.includes('/')) {
        return `iobfile://${uri.address}/${uri.path}`;
    }
    if (uri.path) {
        return `iobobject://${uri.address}/${uri.path}`;
    }
    return `iobstate://${uri.address}`;
}

/** Parse ioBroker URI */
export function iobUriParse(uri: string): IobUriParsed {
    const result: IobUriParsed = {
        type: 'object',
        address: '',
    };
    if (uri.startsWith('iobobject://')) {
        result.type = 'object';
        uri = uri.replace('iobobject://', '');
        const parts = uri.split('/');
        result.address = parts[0];
        result.path = parts[1]; // native.schemas.myObject
    } else if (uri.startsWith('iobstate://')) {
        result.type = 'state';
        uri = uri.replace('iobstate://', '');
        const parts = uri.split('/');
        result.address = parts[0];
        result.path = parts[1]; // val, ts, lc, from, q, ...
    } else if (uri.startsWith('iobfile://')) {
        result.type = 'file';
        uri = uri.replace('iobfile://', '');
        const parts = uri.split('/');
        result.address = parts.shift();
        result.path = parts.join('/'); // main/img/hello.png
    } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
        result.type = 'http';
        result.address = uri; // https://googlw.com/path/uri?lakds=7889
    } else if (uri.startsWith('data:')) {
        // data:image/jpeg;base64,
        result.type = 'base64';
        result.address = uri; // data:image/jpeg;base64,...
    } else {
        // no protocol provided
        const parts = uri.split('/');
        if (parts.length === 2) {
            result.address = parts[0];
            result.path = parts[1];
            if (result.path.includes('.')) {
                result.type = 'object';
            } else if (result.path) {
                if (
                    result.path === 'val' ||
                    result.path === 'q' ||
                    result.path === 'ack' ||
                    result.path === 'ts' ||
                    result.path === 'lc' ||
                    result.path === 'from' ||
                    result.path === 'user' ||
                    result.path === 'expire' ||
                    result.path === 'c'
                ) {
                    result.type = 'state';
                } else if (
                    result.path === 'common' ||
                    result.path === 'native' ||
                    result.path === 'from' ||
                    result.path === 'acl' ||
                    result.path === 'type'
                ) {
                    result.type = 'object';
                } else {
                    throw new Error(`Unknown path: ${result.path}`);
                }
            } else {
                result.type = 'state';
            }
        } else if (parts.length === 1) {
            result.address = parts[0];
            result.type = 'state';
        } else {
            // it is a file
            result.address = parts.shift();
            result.type = 'file';
            result.path = parts.join('/');
        }
    }
    return result;
}

export function getAttrInObject(
    obj: Record<string, any> | null | undefined,
    path: string[] | undefined,
    _position?: number,
): any {
    _position = _position || 0;
    if (obj === undefined || obj === null || !path) {
        return obj;
    }
    if (path.length - 1 === _position) {
        return obj[path[_position]];
    }
    if (typeof obj === 'object') {
        return getAttrInObject(obj[path[_position]], path, _position + 1);
    }
    return undefined;
}

export function setAttrInObject(
    obj: Record<string, any> | null | undefined,
    path: string[] | undefined,
    value: any,
    _position?: number,
): any {
    _position = _position || 0;
    if (obj === undefined || obj === null || !path) {
        return value;
    }
    if (path.length - 1 === _position) {
        obj[path[_position]] = value;
        return obj;
    }
    if (typeof obj === 'object') {
        return setAttrInObject(obj[path[_position]], path, value, _position + 1);
    }
}

export async function iobUriRead(uri: IobUri | IobUriParsed, socket: Connection): Promise<any> {
    if (typeof uri === 'string') {
        uri = iobUriParse(uri);
    }
    if (uri.type === 'object') {
        const obj: ioBroker.Object | null | undefined = await socket.getObject(uri.address);
        return getAttrInObject(obj, uri.path?.split('.'));
    }
    if (uri.type === 'state') {
        const state: ioBroker.State | null | undefined = await socket.getState(uri.address);
        if (!uri.path) {
            return state;
        }
        return (state as Record<string, any>)?.[uri.path];
    }
    if (uri.type === 'file') {
        return await socket.readFile(uri.address, uri.path, true);
    }
    if (uri.type === 'http') {
        return fetch(uri.address)
            .then(response => response.text())
            .then(text => {
                if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
                    try {
                        return JSON.parse(text);
                    } catch {
                        // ignore
                    }
                }
                return text;
            });
    }
    throw new Error(`Unknown type: ${uri.type}`);
}
