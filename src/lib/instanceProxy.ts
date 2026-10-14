import http, { type IncomingHttpHeaders, type IncomingMessage, type OutgoingHttpHeaders, type Server } from 'node:http';
import https from 'node:https';
import type { Duplex } from 'node:stream';
import type { NextFunction, Request, Response } from 'express';

/**
 * Proxy for the web servers of adapter instances: `/proxy/xterm.0/…` is passed on to the own port of `xterm.0`.
 *
 * A tab like the one of xterm or node-red is served by the adapter itself, on its own port. Without the proxy, that
 * port has to be reachable from the browser - opened in a firewall, reachable through the remote access of the cloud,
 * and with HTTPS for admin also on HTTPS, or the browser blocks the frame as mixed content. Through the proxy the tab
 * lives on the address of admin and is protected by its login.
 *
 * Only instances that ask for it with `common.adminTab.proxy: true` are proxied, else admin would be an open door to
 * every port that is configured somewhere in a `native`. The target is `native.bind`, `native.port` and
 * `native.secure` of the instance, as these are the names all adapters with an own web server use.
 *
 * As such a tab is usually a shell or a code editor, only members of `system.group.administrator` may pass.
 */

/** First segment of the proxied URLs, below the public path of admin */
const PROXY_SEGMENT = 'proxy';

/** `/proxy/<adapter>.<instance>` and the rest of the path */
const PROXY_PATH = /^\/proxy\/([a-z0-9][a-z0-9_-]*\.\d+)(\/[^?]*)?(\?.*)?$/i;

/** How long resolved targets, the administrators and checked tokens are reused */
const CACHE_MS = 10_000;

/** Headers of one connection, which are never passed on (RFC 9110, 7.6.1) */
const HOP_BY_HOP_HEADERS = [
    'connection',
    'keep-alive',
    'proxy-connection',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'http2-settings',
];

interface ProxyTarget {
    protocol: 'http:' | 'https:';
    host: string;
    port: number;
}

type ProxyAdapter = Omit<ioBroker.Adapter, 'config'> & {
    config: { auth: boolean; defaultUser: string; secure: boolean };
};

interface ParsedProxyUrl {
    /** `xterm.0` */
    instance: string;
    /** Path on the target with the query, `/` at least. Null if the URL ends with the instance */
    path: string | null;
    query: string;
}

/** Answer an upgrade request that is not passed on and close the connection */
function rejectUpgrade(socket: Duplex, status: number, text: string): void {
    if (socket.writable) {
        socket.end(`HTTP/1.1 ${status} ${text}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
    } else {
        socket.destroy();
    }
}

/** Status line and headers of an answer to an upgrade request, as they go back to the browser */
function createHeaderBlock(statusLine: string, rawHeaders: string[]): string {
    const lines = [statusLine];
    for (let i = 0; i < rawHeaders.length; i += 2) {
        lines.push(`${rawHeaders[i]}: ${rawHeaders[i + 1]}`);
    }
    return `${lines.join('\r\n')}\r\n\r\n`;
}

/** `Authorization` header of a proxied request, hidden from the login of admin */
const HIDDEN_AUTHORIZATION = Symbol('authorization');

/**
 * Read the `access_token` cookie of admin.
 *
 * Only the cookie: an `Authorization` header of a proxied request belongs to the target, e.g., the Bearer token of
 * the own login of node-red or the Basic login of xterm.
 */
function getAccessToken(headers: IncomingHttpHeaders): string | null {
    const cookie = headers.cookie
        ?.split(';')
        .map(part => part.trim())
        .find(part => part.startsWith('access_token='));
    return cookie?.substring('access_token='.length) || null;
}

/** Proxy from admin to the web servers of adapter instances */
export class InstanceProxy {
    private readonly adapter: ProxyAdapter;

    /** Public path of admin, `/` or `/admin/` */
    private readonly publicPath: string;

    private readonly targets = new Map<string, { ts: number; target: ProxyTarget | null }>();

    private administrators: { ts: number; members: string[] } | null = null;

    private readonly tokens = new Map<string, { ts: number; user: string | null; aExp: number }>();

    /**
     * @param adapter admin adapter
     * @param publicPath public path of admin, `/` or `/admin/`
     */
    constructor(adapter: ProxyAdapter, publicPath: string) {
        this.adapter = adapter;
        this.publicPath = publicPath;
    }

    /**
     * Split a URL into the instance and the path on the target, or null if it is no proxy URL.
     *
     * @param url URL of the request, with or without the public path of admin
     */
    private parse(url: string | undefined): ParsedProxyUrl | null {
        if (!url) {
            return null;
        }
        if (this.publicPath !== '/' && url.startsWith(this.publicPath)) {
            url = url.substring(this.publicPath.length - 1);
        }
        const match = url.match(PROXY_PATH);
        if (!match) {
            return null;
        }
        return { instance: match[1].toLowerCase(), path: match[2] || null, query: match[3] || '' };
    }

    /**
     * True if the URL belongs to the proxy, so other middlewares - body parsers, compression - leave it alone
     *
     * @param url URL of the request, with or without the public path of admin
     */
    matches(url: string | undefined): boolean {
        return !!url && url.includes(`/${PROXY_SEGMENT}/`) && !!this.parse(url);
    }

    /** Public prefix of an instance as the browser sees it, without a trailing slash: `/admin/proxy/xterm.0` */
    private getPrefix(instance: string): string {
        return `${this.publicPath}${PROXY_SEGMENT}/${instance}`;
    }

    /**
     * Find the user of a request. With the login of admin switched off, it is the default user.
     *
     * Only a token of the login itself counts: one that was issued to an OAuth client for a certain resource
     * (`aud`), e.g., to an MCP client, must not open a shell.
     *
     * @param headers headers of the request
     */
    private async getUser(headers: IncomingHttpHeaders): Promise<string | null> {
        if (!this.adapter.config.auth) {
            return this.adapter.config.defaultUser || 'system.user.admin';
        }
        const token = getAccessToken(headers);
        if (!token) {
            return null;
        }

        const now = Date.now();
        const cached = this.tokens.get(token);
        if (cached && now - cached.ts < CACHE_MS) {
            return cached.aExp > now ? cached.user : null;
        }

        const session = await new Promise<Record<string, any> | null>(resolve =>
            this.adapter.getSession(`a:${token}`, obj => resolve((obj as Record<string, any>) || null)),
        );
        let user: string | null = null;
        if (session?.user && !session.aud && !session.clientId) {
            user = session.user.startsWith('system.user.') ? session.user : `system.user.${session.user}`;
        }

        if (this.tokens.size > 100) {
            for (const [key, value] of this.tokens) {
                if (now - value.ts >= CACHE_MS) {
                    this.tokens.delete(key);
                }
            }
        }
        this.tokens.set(token, { ts: now, user, aExp: session?.aExp || 0 });

        return session?.aExp > now ? user : null;
    }

    /**
     * True if the user is a member of the administrators
     *
     * @param user ID of the user, `system.user.admin`
     */
    private async isAdministrator(user: string): Promise<boolean> {
        if (!this.administrators || Date.now() - this.administrators.ts >= CACHE_MS) {
            const group = await this.adapter.getForeignObjectAsync('system.group.administrator');
            this.administrators = { ts: Date.now(), members: group?.common?.members || [] };
        }
        return this.administrators.members.includes(user);
    }

    /**
     * Address of the web server of an instance, or null if the instance does not exist or does not want to be proxied
     *
     * @param instance `xterm.0`
     */
    private async getTarget(instance: string): Promise<ProxyTarget | null> {
        const cached = this.targets.get(instance);
        if (cached && Date.now() - cached.ts < CACHE_MS) {
            return cached.target;
        }

        let target: ProxyTarget | null = null;
        const obj = (await this.adapter.getForeignObjectAsync(`system.adapter.${instance}`)) as
            ioBroker.InstanceObject | null | undefined;
        const adminTab = obj?.common?.adminTab as { proxy?: boolean } | undefined;
        const port = parseInt(obj?.native?.port, 10);

        if (obj?.type === 'instance' && adminTab?.proxy === true && port > 0 && port < 65536) {
            const bind: string = obj.native.bind || '';
            let host: string | null = null;
            if (bind && bind !== '0.0.0.0' && bind !== '::') {
                host = bind;
            } else if (obj.common.host === this.adapter.host) {
                host = '127.0.0.1';
            } else {
                host = await this.getHostAddress(obj.common.host);
            }

            if (host) {
                target = { protocol: obj.native.secure ? 'https:' : 'http:', host, port };
            } else {
                this.adapter.log.warn(`Cannot find an address of host "${obj.common.host}" to reach ${instance}`);
            }
        }

        this.targets.set(instance, { ts: Date.now(), target });
        return target;
    }

    /**
     * First external IPv4 address of another ioBroker host
     *
     * @param hostname name of the host
     */
    private async getHostAddress(hostname: string): Promise<string | null> {
        const hostObj = await this.adapter.getForeignObjectAsync(`system.host.${hostname}`);
        const interfaces = hostObj?.native?.hardware?.networkInterfaces || {};
        for (const addresses of Object.values(interfaces)) {
            const address = addresses?.find(item => !item.internal && item.family === 'IPv4');
            if (address) {
                return address.address;
            }
        }
        return hostObj?.common?.address?.[0] || null;
    }

    /**
     * Headers for the request to the target.
     *
     * The original `Host` stays, so a target that compares it with the `Origin` - as many web socket servers do - still
     * sees a request of its own page. Where the request really came from is in the `X-Forwarded-*` headers.
     *
     * @param req request of the browser
     * @param prefix public prefix of the instance
     */
    private getRequestHeaders(req: IncomingMessage, prefix: string): OutgoingHttpHeaders {
        const headers: OutgoingHttpHeaders = {};
        for (const [name, value] of Object.entries(req.headers)) {
            // `:authority`, `:path` and the other pseudo-headers of HTTP/2
            if (value !== undefined && !name.startsWith(':') && !HOP_BY_HOP_HEADERS.includes(name)) {
                headers[name] = value;
            }
        }
        const hiddenAuthorization = (req as IncomingMessage & { [HIDDEN_AUTHORIZATION]?: string })[
            HIDDEN_AUTHORIZATION
        ];
        if (hiddenAuthorization) {
            headers.authorization = hiddenAuthorization;
        }
        const host = req.headers.host || (req.headers[':authority'] as string | undefined);
        if (host) {
            headers.host = host;
        }
        const remoteAddress = req.socket?.remoteAddress;
        if (remoteAddress) {
            headers['x-forwarded-for'] = req.headers['x-forwarded-for']
                ? `${req.headers['x-forwarded-for'] as string}, ${remoteAddress}`
                : remoteAddress;
        }
        headers['x-forwarded-proto'] ||= this.adapter.config.secure ? 'https' : 'http';
        if (host) {
            headers['x-forwarded-host'] ||= host;
        }
        headers['x-forwarded-prefix'] = prefix;
        return headers;
    }

    /**
     * A redirect of the target to `/login` must end up below the prefix, not on the start page of admin
     *
     * @param location `Location` header of the target
     * @param prefix public prefix of the instance
     * @param target target of the request
     * @param host `Host` of the request
     */
    private static rewriteLocation(location: string, prefix: string, target: ProxyTarget, host: string): string {
        if (location.startsWith('/') && !location.startsWith('//')) {
            return location.startsWith(`${prefix}/`) ? location : `${prefix}${location}`;
        }
        try {
            const url = new URL(location);
            if (
                url.host === `${target.host}:${target.port}` ||
                (url.host === host && !url.pathname.startsWith(`${prefix}/`))
            ) {
                return `${prefix}${url.pathname}${url.search}${url.hash}`;
            }
        } catch {
            // a relative location is resolved by the browser below the prefix anyway
        }
        return location;
    }

    /**
     * A cookie of the target with `Path=/` would belong to the whole admin. It is moved below the prefix.
     *
     * @param cookie `Set-Cookie` header of the target
     * @param prefix public prefix of the instance
     */
    private static rewriteCookie(cookie: string, prefix: string): string {
        return cookie.replace(/;\s*path=([^;]*)/i, (_match, path: string) => {
            const trimmed = path.trim();
            return `; Path=${trimmed.startsWith(`${prefix}/`) ? trimmed : `${prefix}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`}`;
        });
    }

    /**
     * Check user and target. Answers itself if the request may not be passed on.
     *
     * @param headers headers of the request
     * @param instance `xterm.0`
     * @param deny answer for a refused request
     */
    private async authorize(
        headers: IncomingHttpHeaders,
        instance: string,
        deny: (status: number, text: string) => void,
    ): Promise<ProxyTarget | null> {
        const user = await this.getUser(headers);
        if (!user) {
            deny(401, 'Unauthorized');
            return null;
        }
        if (!(await this.isAdministrator(user))) {
            this.adapter.log.warn(`${user} is not an administrator and may not open ${instance} through admin`);
            deny(403, 'Forbidden');
            return null;
        }
        const target = await this.getTarget(instance);
        if (!target) {
            deny(404, 'Not Found');
            return null;
        }
        return target;
    }

    /**
     * Express middleware in front of the login of admin: it takes the `Authorization` header from a proxied request and
     * keeps it for the target.
     *
     * The login of admin checks a Bearer or Basic `Authorization` header before the cookie, and answers itself with 401
     * if it does not know it. The editor of node-red sends its own token so with every request, and would never reach
     * node-red.
     */
    hideAuthorization = (req: Request, _res: Response, next: NextFunction): void => {
        if (req.headers.authorization && this.matches(req.url)) {
            (req as Request & { [HIDDEN_AUTHORIZATION]?: string })[HIDDEN_AUTHORIZATION] = req.headers.authorization;
            delete req.headers.authorization;
        }
        next();
    };

    /** Express middleware for the HTTP requests */
    handleRequest = (req: Request, res: Response, next: NextFunction): void => {
        const parsed = this.parse(req.url);
        if (!parsed) {
            next();
            return;
        }
        const prefix = this.getPrefix(parsed.instance);
        if (!parsed.path) {
            // Without the trailing slash, the browser resolves the relative URLs of the page next to the prefix
            res.redirect(301, `${prefix}/${parsed.query}`);
            return;
        }

        void this.authorize(req.headers, parsed.instance, (status, text) => {
            res.status(status).send(text);
        }).then(target => {
            if (!target) {
                return;
            }
            const host = (req.headers.host || req.headers[':authority'] || '') as string;

            const proxyReq = (target.protocol === 'https:' ? https : http).request({
                protocol: target.protocol,
                host: target.host,
                port: target.port,
                method: req.method,
                path: `${parsed.path}${parsed.query}`,
                headers: this.getRequestHeaders(req, prefix),
                // The instance uses the same certificate as admin, often a self-signed one
                rejectUnauthorized: false,
            });

            proxyReq.on('response', proxyRes => {
                const headers: OutgoingHttpHeaders = {};
                for (const [name, value] of Object.entries(proxyRes.headers)) {
                    if (value === undefined || HOP_BY_HOP_HEADERS.includes(name)) {
                        continue;
                    }
                    if (name === 'location' && typeof value === 'string') {
                        headers[name] = InstanceProxy.rewriteLocation(value, prefix, target, host);
                    } else if (name === 'set-cookie' && Array.isArray(value)) {
                        headers[name] = value.map(cookie => InstanceProxy.rewriteCookie(cookie, prefix));
                    } else {
                        headers[name] = value;
                    }
                }
                res.writeHead(proxyRes.statusCode || 502, headers);
                proxyRes.pipe(res);
            });

            proxyReq.on('error', err => {
                this.adapter.log.debug(`Proxy request to ${parsed.instance} failed: ${err.message}`);
                if (!res.headersSent) {
                    res.status(502).send(`${parsed.instance} is not reachable`);
                } else {
                    res.destroy();
                }
            });

            // A closed browser tab must not leave a long-polling request to the target behind
            res.on('close', () => {
                if (!res.writableFinished) {
                    proxyReq.destroy();
                }
            });

            req.pipe(proxyReq);
        });
    };

    /**
     * Pass a web socket connection on to the instance
     *
     * @param req upgrade request
     * @param socket connection to the browser
     * @param head first data of the connection
     * @param parsed instance and path
     */
    private async handleUpgrade(
        req: IncomingMessage,
        socket: Duplex,
        head: Buffer,
        parsed: ParsedProxyUrl,
    ): Promise<void> {
        socket.on('error', err => this.adapter.log.debug(`Proxy socket error: ${err.message}`));

        if (!parsed.path) {
            rejectUpgrade(socket, 404, 'Not Found');
            return;
        }

        const target = await this.authorize(req.headers, parsed.instance, (status, text) =>
            rejectUpgrade(socket, status, text),
        );
        if (!target) {
            return;
        }

        const headers = this.getRequestHeaders(req, this.getPrefix(parsed.instance));
        headers.connection = 'Upgrade';
        headers.upgrade = req.headers.upgrade;

        const proxyReq = (target.protocol === 'https:' ? https : http).request({
            protocol: target.protocol,
            host: target.host,
            port: target.port,
            method: req.method,
            path: `${parsed.path}${parsed.query}`,
            headers,
            rejectUnauthorized: false,
        });

        proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
            proxySocket.on('error', () => socket.destroy());
            socket.on('error', () => proxySocket.destroy());
            proxySocket.on('close', () => socket.destroy());
            socket.on('close', () => proxySocket.destroy());

            if (proxyHead?.length) {
                proxySocket.unshift(proxyHead);
            }
            socket.write(createHeaderBlock('HTTP/1.1 101 Switching Protocols', proxyRes.rawHeaders));
            proxySocket.pipe(socket).pipe(proxySocket);
        });

        // The target refused the upgrade: its answer goes back to the browser as it is
        proxyReq.on('response', proxyRes => {
            socket.write(
                createHeaderBlock(`HTTP/1.1 ${proxyRes.statusCode} ${proxyRes.statusMessage}`, proxyRes.rawHeaders),
            );
            proxyRes.pipe(socket);
        });

        proxyReq.on('error', err => {
            this.adapter.log.debug(`Proxy web socket to ${parsed.instance} failed: ${err.message}`);
            rejectUpgrade(socket, 502, 'Bad Gateway');
        });

        if (head?.length) {
            socket.unshift(head);
        }
        proxyReq.end();
    }

    /**
     * Take the upgrade requests of the proxy before anybody else sees them.
     *
     * The web socket server of admin is attached to the same server without a path and takes every upgrade
     * request. Listeners of an event are all called, so another `upgrade` listener cannot keep it away - the request
     * is taken out of `emit` instead, which also covers listeners that are attached later.
     *
     * @param server web server of admin
     */
    attach(server: Server): void {
        const emit = server.emit;
        server.emit = ((event: string | symbol, ...args: any[]): boolean => {
            if (event === 'upgrade') {
                const parsed = this.parse((args[0] as IncomingMessage).url);
                if (parsed) {
                    void this.handleUpgrade(args[0], args[1], args[2], parsed);
                    return true;
                }
            }
            return emit.apply(server, [event, ...args] as Parameters<typeof emit>);
        }) as typeof server.emit;

        // Node.js emits `upgrade` only if somebody listens to it. Without a listener, a web socket request would arrive
        // as a plain request, and the proxy would pass it on without the upgrade headers.
        server.on('upgrade', (_req: IncomingMessage, socket: Duplex): void => {
            if (server.listenerCount('upgrade') === 1) {
                socket.destroy();
            }
        });
    }
}
