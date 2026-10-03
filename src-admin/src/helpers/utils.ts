/** Url where controller changelog is reachable */
export const CONTROLLER_CHANGELOG_URL = 'https://github.com/ioBroker/ioBroker.js-controller/blob/master/CHANGELOG.md';

/** All possible auto upgrade settings */
export const AUTO_UPGRADE_SETTINGS: ioBroker.AutoUpgradePolicy[] = ['none', 'patch', 'minor', 'major'];

/** Mapping to make it more understandable which upgrades are allowed */
export const AUTO_UPGRADE_OPTIONS_MAPPING: Record<ioBroker.AutoUpgradePolicy, string> = {
    none: 'none',
    patch: 'patch',
    minor: 'patch & minor',
    major: 'patch, minor & major',
};

function ip2int(ip: string): number {
    return ip.split('.').reduce((ipInt, octet) => (ipInt << 8) + parseInt(octet, 10), 0) >>> 0;
}

function findNetworkAddressOfHost(obj: ioBroker.HostObject, localIp: string): null | string {
    const networkInterfaces = obj?.native?.hardware?.networkInterfaces;
    if (!networkInterfaces) {
        return null;
    }

    let hostIp: string | null = null;
    for (const networkInterface of Object.values(networkInterfaces)) {
        if (!networkInterface) {
            continue;
        }
        for (let i = 0; i < networkInterface.length; i++) {
            const ip = networkInterface[i];
            if (ip.internal) {
                continue;
            }
            if (localIp.includes(':') && ip.family !== 'IPv6') {
                continue;
            }
            if (localIp.includes('.') && !localIp.match(/[^.\d]/) && ip.family !== 'IPv4') {
                continue;
            }
            if (localIp === '127.0.0.0' || localIp === 'localhost' || localIp.match(/[^.\d]/)) {
                // if DNS name
                hostIp = ip.address;
            } else if (
                ip.family === 'IPv4' &&
                localIp.includes('.') &&
                (ip2int(localIp) & ip2int(ip.netmask)) === (ip2int(ip.address) & ip2int(ip.netmask))
            ) {
                hostIp = ip.address;
            }
        }
    }

    if (!hostIp) {
        for (const networkInterface of Object.values(networkInterfaces)) {
            if (!networkInterface) {
                continue;
            }
            for (let i = 0; i < networkInterface.length; i++) {
                const ip = networkInterface[i];
                if (ip.internal) {
                    continue;
                }
                if (localIp.includes(':') && ip.family !== 'IPv6') {
                    continue;
                }
                if (localIp.includes('.') && !localIp.match(/[^.\d]/) && ip.family !== 'IPv4') {
                    continue;
                }
                if (localIp === '127.0.0.0' || localIp === 'localhost' || localIp.match(/[^.\d]/)) {
                    // if DNS name
                    hostIp = ip.address;
                }
            }
        }
    }

    if (!hostIp) {
        for (const networkInterface of Object.values(networkInterfaces)) {
            if (!networkInterface) {
                continue;
            }
            for (let i = 0; i < networkInterface.length; i++) {
                const ip = networkInterface[i];
                if (ip.internal) {
                    continue;
                }
                hostIp = ip.address;
            }
        }
    }

    return hostIp;
}

function getHostname(
    instanceObj: ioBroker.InstanceObject,
    objects: Record<string, ioBroker.InstanceObject>,
    hosts: Record<string, ioBroker.HostObject>,
    currentHostname: string,
    adminInstance: string,
): string | null {
    if (!instanceObj?.common) {
        return null;
    }

    let hostname;
    // check if the adapter from the same host as admin
    const adminHost = objects[`system.adapter.${adminInstance}`]?.common?.host;
    if (instanceObj.common.host !== adminHost) {
        // find IP address
        const host = hosts[`system.host.${instanceObj.common.host}`];
        if (host) {
            const ip = findNetworkAddressOfHost(host, currentHostname);
            if (ip) {
                hostname = ip;
            } else {
                console.warn(`Cannot find suitable IP in host ${instanceObj.common.host} for ${instanceObj._id}`);
                return null;
            }
        } else {
            console.warn(`Cannot find host ${instanceObj.common.host} for ${instanceObj._id}`);
            return null;
        }
    } else {
        hostname = currentHostname;
    }

    return hostname;
}

/**
 * Split a link template into its origin and the rest.
 *
 * `%web_protocol%://%ip%:%web_port%/adapter/index.html?instance=%instance%` becomes
 * `{ origin: '%web_protocol%://%ip%:%web_port%', path: 'adapter/index.html?instance=%instance%' }`.
 * A link without an origin (`adapter/index.html`) gives `origin: null`.
 *
 * @param link pattern for link
 */
function splitLink(link: string): { origin: string | null; path: string } {
    const match = link.match(/^[^/]*:\/\/[^/]*/);

    if (!match) {
        return { origin: null, path: link.replace(/^\//, '') };
    }

    return { origin: match[0], path: link.substring(match[0].length).replace(/^\//, '') };
}

/** How the remote access of ioBroker Cloud/Pro publishes the instances of this installation */
export interface RemoteAccessInfo {
    /** Origin the browser is talking to, e.g. `https://iobroker.pro` */
    origin: string;
    /** Port of the instance that is published under `/`, normally a web instance */
    webPort?: number;
    /** Port of the instance that is published under `/admin/` */
    adminPort?: number;
    /** Port of the instance that is published under `/lovelace/` */
    lovelacePort?: number;
}

/**
 * Host of an address that is not necessarily a complete URL, e.g. `iobroker.pro` for
 * `https://iobroker.pro:10656` and for `iobroker.pro:10656`.
 *
 * @param address address from a configuration
 */
function getHostOfAddress(address: string): string {
    if (!address) {
        return '';
    }
    try {
        return new URL(address.includes('://') ? address : `https://${address}`).hostname;
    } catch {
        return '';
    }
}

/**
 * Detect that this admin was not opened locally, but through the remote access of ioBroker Cloud/Pro.
 *
 * Both the `cloud` and the `iot` adapter publish the installation under fixed paths: the web instance
 * at `/`, the admin instance at `/admin/` and lovelace at `/lovelace/`. Which instances those are is
 * part of their own configuration, so nothing has to be guessed from the URL.
 *
 * @param instances Object with all instances
 * @param location location of the browser (`window.location`)
 * @param location.origin origin the page was loaded from
 * @param location.hostname host the page was loaded from
 * @param location.pathname path the page was loaded from
 * @returns what the remote access publishes, or null if this admin was opened directly
 */
export function detectRemoteAccess(
    instances: Record<string, ioBroker.InstanceObject>,
    location: { origin: string; hostname: string; pathname: string },
): RemoteAccessInfo | null {
    // The remote access always serves the admin under `/admin/`
    if (location.pathname !== '/admin' && !location.pathname.startsWith('/admin/')) {
        return null;
    }

    const portOf = (id: string | undefined): number | undefined => {
        if (!id) {
            return undefined;
        }
        const obj = instances[id.startsWith('system.adapter.') ? id : `system.adapter.${id}`];
        const port = obj?.native?.port;
        return typeof port === 'number' ? port : undefined;
    };

    for (const id of Object.keys(instances)) {
        const obj = instances[id];
        if (!obj?.common?.enabled) {
            continue;
        }

        if (obj.common.name === 'cloud') {
            // `cloudUrl` is the address of the service, e.g. `https://iobroker.pro:10656`
            if (getHostOfAddress(obj.native?.cloudUrl as string) === location.hostname) {
                return {
                    origin: location.origin,
                    webPort: portOf(obj.native.instance as string),
                    adminPort: portOf(obj.native.allowAdmin as string),
                    lovelacePort: portOf(obj.native.lovelace as string),
                };
            }
        } else if (obj.common.name === 'iot' && obj.native?.remote) {
            // The remote access of `iot` runs over iobroker.pro, its own `cloudUrl` points to the
            // AWS endpoint and says nothing about the address the browser uses.
            if (location.hostname === 'iobroker.pro' || location.hostname.endsWith('.iobroker.pro')) {
                return {
                    origin: location.origin,
                    webPort: portOf(obj.native.remoteWebInstance as string),
                    adminPort: portOf(obj.native.remoteAdminInstance as string),
                };
            }
        }
    }

    return null;
}

/**
 * Rewrite a link for the remote access of ioBroker Cloud/Pro.
 *
 * The links are built for the local network (`http://192.168.1.5:8082/vis/index.html`) and are of no
 * use to somebody who opened the admin through the cloud. The same page is published there under the
 * origin of the service (`https://iobroker.pro/vis/index.html`), so only origin and prefix change.
 *
 * @param link the link as it was built for the local network
 * @param port port of the instance that serves the link, undefined for a link that addresses no instance
 * @param remote what the remote access publishes
 * @returns the link for the remote access, or null if that page is not published there at all
 */
export function applyRemoteAccessToLink(
    link: string,
    port: number | undefined,
    remote: RemoteAccessInfo,
): string | null {
    // A link that addresses no instance of this installation (the documentation of an adapter, for
    // example) is just as reachable from outside as from inside
    if (!link || port === undefined) {
        return link;
    }

    let prefix: string | null = null;
    if (remote.webPort !== undefined && port === remote.webPort) {
        prefix = '';
    } else if (remote.adminPort !== undefined && port === remote.adminPort) {
        prefix = '/admin';
    } else if (remote.lovelacePort !== undefined && port === remote.lovelacePort) {
        prefix = '/lovelace';
    }

    if (prefix === null) {
        // the remote access does not publish this instance
        return null;
    }

    return `${remote.origin}${prefix}/${splitLink(link).path}`;
}

/**
 * The adapter that serves the page behind a link.
 *
 * The web server publishes the pages of an adapter under `/<adapterName>/`, so the first segment of
 * the path names the adapter: `vis-2` for `http://host:8082/vis-2/index.html`.
 *
 * @param link absolute or relative link
 * @returns the adapter name, or an empty string if the link has no path
 */
export function getLinkPageOwner(link: string): string {
    if (!link) {
        return '';
    }

    return splitLink(link).path.split(/[/?#]/)[0] || '';
}

/**
 * Decide whether a newly built quick-access card must take the place of one that already points to
 * the same link.
 *
 * The same page can be registered by several adapters: every vis-2 widget adapter links to the vis-2
 * runtime, and an adapter can register its own page as `localLink` and in `welcomeScreen` at once.
 * Only one card is shown per link, and it has to belong to the adapter that serves the page.
 * Otherwise the card carries the name, the icon and the color of whichever adapter happened to be
 * processed first - which is decided by the alphabetical order of the instance IDs.
 *
 * @param link the link both cards point to
 * @param newAdapter adapter name of the card that was just built
 * @param existingAdapter adapter name of the card that is already in the list
 * @returns true if the new card must replace the existing one
 */
export function replacesExistingLink(link: string, newAdapter: string, existingAdapter: string): boolean {
    if (!newAdapter || newAdapter === existingAdapter) {
        return false;
    }

    return getLinkPageOwner(link) === newAdapter;
}

/**
 * Build the link(s) for an adapter that runs as a web-extension.
 *
 * Such adapters have no own web-server and therefore no reachable own port.
 * They are served by their host web instance(s), so the origin of the link is taken from the web
 * instance. Everything the adapter placed after the origin - path, file name, query - is kept, and
 * only a link without a path of its own falls back to `/<adapterName>/`.
 * `native.webInstance` contains the target web instance (e.g. `web.0`) or `*` for all web instances.
 *
 * @param adapter adapter name (e.g. `rest-api`)
 * @param instanceObj the web-extension instance object
 * @param link pattern for link, its path is kept
 * @param context Context object
 * @param context.instances Object with all instances
 * @param context.hostname Actual host name
 * @param context.adminInstance Actual admin instance
 * @param context.hosts Object with all hosts
 */
function getWebExtensionLinks(
    adapter: string,
    instanceObj: ioBroker.InstanceObject,
    link: string,
    context: {
        instances: Record<string, ioBroker.InstanceObject>;
        hostname: string;
        adminInstance: string;
        hosts: Record<string, ioBroker.HostObject>;
    },
): { url: string; port: number | undefined; instance?: string }[] {
    const webInstance: string = instanceObj.native.webInstance;
    // Placeholders that are still in the path are resolved by the caller
    const path: string = splitLink(link).path || `${adapter}/`;

    // Determine which web instance(s) serve this extension
    let webInstanceIds: string[];
    if (webInstance === '*') {
        webInstanceIds = Object.keys(context.instances)
            .filter(id => id.startsWith('system.adapter.web.') && context.instances[id].common.enabled)
            .map(id => id.substring('system.adapter.'.length));
        // fall back to disabled web instances if none is enabled
        if (!webInstanceIds.length) {
            webInstanceIds = Object.keys(context.instances)
                .filter(id => id.startsWith('system.adapter.web.'))
                .map(id => id.substring('system.adapter.'.length));
        }
    } else {
        webInstanceIds = [webInstance];
    }

    const urls: { url: string; port: number | undefined; instance?: string }[] = [];

    for (const webId of webInstanceIds) {
        const webObj = context.instances[`system.adapter.${webId}`];
        const webNative = webObj?.native;
        if (!webNative) {
            continue;
        }

        const protocolVal: string | boolean = webNative.secure === undefined ? webNative.protocol : webNative.secure;
        const protocol: 'http' | 'https' = protocolVal === true || protocolVal === 'true' ? 'https' : 'http';

        let ip: string | null = webNative.bind || webNative.ip;
        if (!ip || ip === '0.0.0.0') {
            ip = getHostname(webObj, context.instances, context.hosts, context.hostname, context.adminInstance);
        }

        const port: number | undefined = webNative.port;

        urls.push({
            url: `${protocol}://${ip || ''}${port ? `:${port}` : ''}/${path}`,
            port,
            instance: webId,
        });
    }

    return urls;
}

// internal use
function _replaceLink(
    link: string,
    objects: Record<string, ioBroker.InstanceObject>,
    adapterInstance: string,
    attr: string,
    placeholder: string,
    hosts: Record<string, ioBroker.HostObject>,
    hostname: string,
    adminInstance: string,
): string {
    if (attr === 'protocol') {
        attr = 'secure';
    }

    try {
        const object = objects[`system.adapter.${adapterInstance}`];

        if (link && object) {
            if (attr === 'secure') {
                link = link.replace(`%${placeholder}%`, object.native[attr] ? 'https' : 'http');
            } else {
                let value = object.native[attr];
                // workaround for port
                if ((attr === 'webinterfacePort' || attr === 'port') && (!value || value === '0')) {
                    if (object.native.secure === true) {
                        value = 443;
                    } else {
                        value = 80;
                    }
                }

                if (attr === 'bind' || attr === 'ip') {
                    let ip = object.native.bind || object.native.ip;
                    if (ip === '0.0.0.0') {
                        ip = getHostname(object, objects, hosts, hostname, adminInstance);
                    }
                    if (!link.includes(`%${placeholder}%`)) {
                        link = link.replace(`%native_${placeholder}%`, ip || '');
                    } else {
                        link = link.replace(`%${placeholder}%`, ip || '');
                    }
                } else if (!link.includes(`%${placeholder}%`)) {
                    link = link.replace(`%native_${placeholder}%`, value);
                } else {
                    link = link.replace(`%${placeholder}%`, value);
                }
            }
        } else {
            console.log(`Cannot get link ${attr}`);
            link = link.replace(`%${placeholder}%`, '');
        }
    } catch (error) {
        console.log(error);
    }
    return link;
}

/**
 * Convert the template link to string
 *
 * Possible placeholders:
 * `%ip%` - `native.bind` or `native.ip` of this adapter. If it is '0.0.0.0', we are trying to find the host IP that is reachable from the current browser.
 * `%protocol%` - `native.protocol` or `native.secure` of this adapter. The result is 'http' or 'https'.
 * `%s%` - `native.protocol` or `native.secure` of this adapter. The result is '' or 's'. The idea is to use the pattern like "http%s%://..."
 * `%instance%` - instance number
 * `%adapterName_nativeAttr%` - Takes the native value `nativeAttr` of all instances of adapterName. This generates many links if more than one instance installed
 * `%adapterName.x_nativeAttr%` - Takes the native value `nativeAttr` of adapterName.x instance
 *
 * @param link pattern for link
 * @param adapter adapter name
 * @param instance adapter instance number
 * @param context Context object
 * @param context.instances Object with all instances
 * @param context.hostname Actual host name
 * @param context.adminInstance Actual admin instance
 * @param context.hosts Object with all hosts
 */
export function replaceLink(
    link: string,
    adapter: string,
    instance: number,
    context: {
        instances: Record<string, ioBroker.InstanceObject>;
        hostname: string;
        adminInstance: string;
        hosts: Record<string, ioBroker.HostObject>;
    },
): {
    url: string;
    port: number | undefined;
    instance?: string;
}[] {
    const _urls: {
        url: string;
        port: number | undefined;
        instance?: string;
    }[] = [];
    let port: number | undefined;

    if (link) {
        const instanceObj = context.instances[`system.adapter.${adapter}.${instance}`];
        const native = instanceObj?.native || {};

        // Adapters running as web-extension have no own web-server / port. They are served by their
        // host web instance(s), so the origin of the link has to be taken from the web instance.
        // The links are only pre-filled here: the placeholders that are left in their path are
        // resolved below, together with the ones of a normal link.
        // A link with a hard-coded origin (e.g. to the documentation of the adapter) points exactly
        // where it says and is left alone.
        if (instanceObj?.common.webExtension && native.webInstance) {
            const origin = splitLink(link).origin;
            if (origin === null || origin.includes('%')) {
                _urls.push(...getWebExtensionLinks(adapter, instanceObj, link, context));
            }
        }
        // `native.webInstance` already decided which web instances serve this extension,
        // so no further link may be added below
        const fixedUrls = _urls.length > 0;

        const placeholders = link.match(/%(\w+)%/g);

        if (placeholders) {
            for (let p = 0; p < placeholders.length; p++) {
                let placeholder = placeholders[p];

                if (placeholder === '%ip%') {
                    let ip: string | null = (native.bind || native.ip) as string;
                    if (!ip || ip === '0.0.0.0') {
                        // Check host
                        ip = getHostname(
                            instanceObj,
                            context.instances,
                            context.hosts,
                            context.hostname,
                            context.adminInstance,
                        );
                    }

                    if (_urls.length) {
                        _urls.forEach(item => (item.url = item.url.replace('%ip%', ip || '')));
                    } else {
                        link = link.replace('%ip%', ip || '');
                    }
                } else if (placeholder === '%protocol%') {
                    const protocolVal: string | boolean = native.secure === undefined ? native.protocol : native.secure;
                    let protocol: 'http' | 'https';
                    if (protocolVal === true || protocolVal === 'true') {
                        protocol = 'https';
                    } else if (protocolVal === false || protocolVal === 'false' || !protocolVal) {
                        protocol = 'http';
                    } else {
                        protocol = protocolVal.toString().replace(/:$/, '') as 'http' | 'https';
                    }

                    if (_urls.length) {
                        _urls.forEach(item => (item.url = item.url.replace('%protocol%', protocol)));
                    } else {
                        link = link.replace('%protocol%', protocol);
                    }
                } else if (placeholder === '%s%') {
                    const protocolVal: string | boolean = native.secure === undefined ? native.protocol : native.secure;
                    let protocol: '' | 's';
                    if (protocolVal === true || protocolVal === 'true') {
                        protocol = 's';
                    } else if (protocolVal === false || protocolVal === 'false' || !protocolVal) {
                        protocol = '';
                    } else {
                        protocol = protocolVal.toString().replace(/:$/, '') as '' | 's';
                    }

                    if (_urls.length) {
                        _urls.forEach(item => (item.url = item.url.replace('%s%', protocol)));
                    } else {
                        link = link.replace('%s%', protocol);
                    }
                } else if (placeholder === '%instance%') {
                    link = link.replace('%instance%', instance.toString());
                    if (_urls.length) {
                        _urls.forEach(item => (item.url = item.url.replace('%instance%', instance.toString())));
                    } else {
                        link = link.replace('%instance%', instance.toString());
                    }
                } else {
                    // remove %%
                    placeholder = placeholder.replace(/%/g, '');

                    if (placeholder.startsWith('native_')) {
                        placeholder = placeholder.substring(7);
                    }

                    // like web.0_port or web_protocol
                    if (!placeholder.includes('_')) {
                        // if only one instance
                        const adapterInstance = `${adapter}.${instance}`;
                        if (_urls.length) {
                            _urls.forEach(
                                item =>
                                    (item.url = _replaceLink(
                                        item.url,
                                        context.instances,
                                        adapterInstance,
                                        placeholder,
                                        placeholder,
                                        context.hosts,
                                        context.hostname,
                                        context.adminInstance,
                                    )),
                            );
                        } else {
                            link = _replaceLink(
                                link,
                                context.instances,
                                adapterInstance,
                                placeholder,
                                placeholder,
                                context.hosts,
                                context.hostname,
                                context.adminInstance,
                            );
                            port = context.instances[`system.adapter.${adapterInstance}`]?.native?.port;
                        }
                    } else {
                        const [adapterInstance, attr] = placeholder.split('_');

                        // if instance number not found
                        if (!adapterInstance.match(/\.[0-9]+$/)) {
                            // list all possible instances
                            let ids: string[];
                            if (adapter === adapterInstance) {
                                // take only this one instance and that's all
                                ids = [`${adapter}.${instance}`];
                            } else {
                                ids = Object.keys(context.instances)
                                    .filter(
                                        id =>
                                            id.startsWith(`system.adapter.${adapterInstance}.`) &&
                                            context.instances[id].common.enabled,
                                    )
                                    .map(id => id.substring(15));

                                // try to get disabled instances
                                if (!ids.length) {
                                    ids = Object.keys(context.instances)
                                        .filter(id => id.startsWith(`system.adapter.${adapterInstance}.`))
                                        .map(id => id.substring(15));
                                }
                            }

                            for (const id of ids) {
                                if (_urls.length) {
                                    const item = _urls.find(t => t.instance === id);
                                    if (item) {
                                        item.url = _replaceLink(
                                            item.url,
                                            context.instances,
                                            id,
                                            attr,
                                            placeholder,
                                            context.hosts,
                                            context.hostname,
                                            context.adminInstance,
                                        );
                                    } else if (fixedUrls) {
                                        // The instance does not serve this web-extension. Only resolve
                                        // a placeholder that is still left in the existing links.
                                        _urls.forEach(
                                            entry =>
                                                (entry.url = _replaceLink(
                                                    entry.url,
                                                    context.instances,
                                                    id,
                                                    attr,
                                                    placeholder,
                                                    context.hosts,
                                                    context.hostname,
                                                    context.adminInstance,
                                                )),
                                        );
                                    } else {
                                        // add new
                                        const _link = _replaceLink(
                                            link,
                                            context.instances,
                                            id,
                                            attr,
                                            placeholder,
                                            context.hosts,
                                            context.hostname,
                                            context.adminInstance,
                                        );
                                        const _port: number = context.instances[`system.adapter.${id}`]?.native
                                            ?.port as number;

                                        _urls.push({ url: _link, port: _port, instance: id });
                                    }
                                } else {
                                    const _link = _replaceLink(
                                        link,
                                        context.instances,
                                        id,
                                        attr,
                                        placeholder,
                                        context.hosts,
                                        context.hostname,
                                        context.adminInstance,
                                    );

                                    const _port: number = context.instances[`system.adapter.${id}`]?.native
                                        ?.port as number;
                                    _urls.push({ url: _link, port: _port, instance: id });
                                }
                            }
                        } else {
                            link = _replaceLink(
                                link,
                                context.instances,
                                adapterInstance,
                                attr,
                                placeholder,
                                context.hosts,
                                context.hostname,
                                context.adminInstance,
                            );

                            port = context.instances[`system.adapter.${adapterInstance}`]?.native?.port as number;
                        }
                    }
                }
            }
        }
    }

    if (_urls.length) {
        return _urls;
    }
    return [{ url: link, port }];
}

export interface ReverseProxyItem {
    globalPath: string;
    paths: { path: string; instance: string }[];
}

/**
 * Public path of this admin instance from the reverse-proxy table.
 * Looks up `admin.0` and joins it with `globalPath`.
 * Returns `/` when the instance is not listed.
 */
export function getAdminPublicPath(reverseProxy: ReverseProxyItem[] | undefined | null, adminInstance: string): string {
    if (!reverseProxy?.length) {
        return '/';
    }
    for (const group of reverseProxy) {
        const entry = group.paths?.find(item => item.instance === adminInstance);
        if (entry) {
            // The paths are typed by hand, so normalize them: exactly one leading and one trailing slash
            return `/${group.globalPath || ''}/${entry.path || ''}/`.replace(/\/+/g, '/');
        }
    }
    return '/';
}

/**
 * `adminHref('oauth/token')` → `/admin/oauth/token` when the public path of this admin instance is `/admin/`.
 * The public path is delivered by the server as `socketPath` (index.html and `_socket/info.js`),
 * the same global that `@iobroker/socket-client` uses to build the web-socket URL.
 */
export function adminHref(path: string): string {
    // allow / don't modify absolute URLs f.e. CustomTab href from adminTab.link
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // `globalThis` and not `window`, because this file is used by the back-end too.
    // In the dev mode (vite) the '@@socketPath@@' placeholder is not replaced, so ignore it.
    const publicPath = (globalThis as unknown as { socketPath?: string }).socketPath;
    return (publicPath && !publicPath.startsWith('@@') ? publicPath : '/') + path.replace(/^\//, '');
}

// New util returning rewritten link (used by Intro & Instances simplified usage)
export function applyReverseProxyToLink(
    link: string | undefined,
    instanceId: string,
    instances: Record<string, ioBroker.InstanceObject>,
    webReverseProxyPath: ReverseProxyItem | null,
): string | undefined {
    if (!link || !webReverseProxyPath) {
        return link;
    }
    webReverseProxyPath.paths.forEach(item => {
        if (item.instance === instanceId) {
            link = item.path;
        } else if (item.instance.startsWith('web.')) {
            const webObj = instances[`system.adapter.${item.instance}`];
            if (webObj?.native?.port && link?.includes(`:${webObj.native.port}`)) {
                const regExp = new RegExp(`^.*:${webObj.native.port}/`);
                link = link.replace(regExp, item.path);
            }
        }
    });
    return link;
}

/** The adapters that are really installed, per host name (`system.host.` prefix removed) */
export type InstalledAdaptersPerHost = Record<string, Set<string>>;

/** The part of the socket that {@link getInstalledAdaptersPerHost} needs */
interface InstalledAdaptersReader {
    getState: (id: string) => Promise<ioBroker.State | null | undefined>;
    getCompactInstalled: (
        host: string,
        update?: boolean,
        cmdTimeout?: number,
    ) => Promise<Record<string, { version: string }>>;
}

/**
 * Asks every host which adapters are really installed on it.
 *
 * Only the host itself knows that, because it reads its `node_modules`. The objects of an adapter
 * (`system.adapter.<name>` and `system.host.<host>.adapter.<name>`) say nothing about it: a restored
 * backup brings them back even if the code could not be installed afterwards - because the adapter
 * has left the repository, for example - and the instance then never starts.
 *
 * A host that does not run is left out instead of being reported as having nothing installed: it
 * cannot answer, and a wrong "not installed" on every one of its instances would be worse than no
 * answer at all. The same holds for a host that answers with an error.
 *
 * The answers are cached per host by the socket, and the current host has been asked already while
 * the repository was read, so a single host system pays nothing for this.
 */
export async function getInstalledAdaptersPerHost(
    socket: InstalledAdaptersReader,
    hosts: { _id: string }[],
    options?: { update?: boolean; cmdTimeout?: number },
): Promise<InstalledAdaptersPerHost> {
    const result: InstalledAdaptersPerHost = {};

    await Promise.all(
        hosts.map(async host => {
            try {
                const alive = await socket.getState(`${host._id}.alive`);
                if (!alive?.val) {
                    return;
                }
                const installed = await socket.getCompactInstalled(host._id, options?.update, options?.cmdTimeout);
                result[host._id.replace(/^system\.host\./, '')] = new Set(Object.keys(installed || {}));
            } catch (e) {
                console.warn(`Cannot read the installed adapters of "${host._id}": ${e as Error}`);
            }
        }),
    );

    return result;
}

/**
 * Is the adapter of this instance missing on the host the instance is assigned to?
 *
 * `false` as long as nothing is known about the host - it does not run, it did not answer, or the
 * instance names a host that is not there any more.
 */
export function isAdapterMissing(obj: ioBroker.InstanceObject, installedPerHost: InstalledAdaptersPerHost): boolean {
    const host = obj?.common?.host;
    const adapterName = obj?.common?.name;
    if (!host || !adapterName) {
        return false;
    }
    const installed = installedPerHost[host];

    return !!installed && !installed.has(adapterName);
}
