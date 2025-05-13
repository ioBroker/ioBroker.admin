import { commonTools, EXIT_CODES } from '@iobroker/adapter-core';
import { checkPublicIP, WebServer, createOAuth2Server, type OAuth2Model } from '@iobroker/webserver';
import * as express from 'express';
import type { Express, Response, Request, NextFunction } from 'express';
import type { Server } from 'node:http';
import { readFileSync, existsSync, createReadStream, readdirSync, lstatSync } from 'node:fs';
import { inherits } from 'util';
import { join, normalize, parse, dirname } from 'node:path';
import { Transform } from 'node:stream';
import * as compression from 'compression';
import { getType } from 'mime';
import { gunzipSync } from 'node:zlib';
import * as archiver from 'archiver';
import axios from 'axios';
import { Ajv } from 'ajv';
import { parse as JSON5 } from 'json5';
import * as fileUpload from 'express-fileupload';
import { verify, type JwtHeader, type SigningKeyCallback, type JwtPayload } from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

import type { Store } from 'express-session';
import * as session from 'express-session';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import type { InternalStorageToken } from '@iobroker/socket-classes';

interface SsoCallbackQuery {
    /** Code to exchange for token */
    code: string;
    /** Username in admin */
    state: string;
}

interface OidcTokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: 'Bearer';
    id_token: string;
    'not-before-policy': number;
    session_state: string;
    scope: string;
}

type SsoBaseState = { redirectUrl: string };

type SsoState = SsoBaseState &
    (
        | {
              method: 'register';
              user: string;
          }
        | {
              method: 'login';
          }
    );

interface JwtFullPayload extends Required<JwtPayload> {
    auth_time: number;
    typ: string;
    azp: string;
    sid: string;
    at_hash: string;
    acr: string;
    email_verified: boolean;
    name: string;
    preferred_username: string;
    given_name: string;
    family_name: string;
    email: string;
}

interface IobrokerOauthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    refresh_token_expires_in: number;
}

export interface AdminAdapterConfig extends ioBroker.AdapterConfig {
    accessAllowedConfigs: string[];
    accessAllowedTabs: string[];
    accessApplyRights: boolean;
    accessLimit: boolean;
    allowInternalAccess?: { [adapterName: string]: string }; // adapterName: UserName (without system.user)
    auth: boolean;
    autoUpdate: number;
    bind: string;
    cache: boolean;
    certChained: string;
    certPrivate: string;
    certPublic: string;
    defaultUser: string;
    doNotCheckPublicIP: boolean;
    language: ioBroker.Languages;
    leCollection: boolean;
    loadingBackgroundColor: string;
    loadingBackgroundImage: boolean;
    loadingHideLogo: boolean;
    loginBackgroundColor: string;
    loginBackgroundImage: boolean;
    loginHideLogo: boolean;
    loginMotto: string;
    noBasicAuth: boolean;
    port: number;
    secure: boolean;
    thresholdValue: number;
    tmpPath: string;
    tmpPathAllow: boolean;
    ttl: number;
    reverseProxy: {
        globalPath: string;
        paths: { path: string; instance: string }[];
    }[];
}

let AdapterStore;
/** Content of a socket-io file */
let socketIoFile: false | string;
/** UUID of the installation */
let uuid: string;
const page404 = readFileSync(`${__dirname}/../../public/404.html`).toString('utf8');
const logTemplate = readFileSync(`${__dirname}/../../public/logTemplate.html`).toString('utf8');
// const FORBIDDEN_CHARS = /[\]\[*,;'"`<>\\\s?]/g; // with space

const KEYCLOAK_ISSUER = 'https://keycloak.heusinger-it.duckdns.org/realms/iobroker-local';
const KEYCLOAK_CLIENT_ID = 'iobroker-local-auth';

const jwksClient = new JwksClient({
    jwksUri: `${KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
    cache: true,
    rateLimit: true,
});

// copied from here: https://github.com/component/escape-html/blob/master/index.js
const matchHtmlRegExp = /["'&<>]/;
function escapeHtml(string: string): string {
    const str = `${string}`;
    const match = matchHtmlRegExp.exec(str);

    if (!match) {
        return str;
    }

    let escape;
    let html = '';
    let index;
    let lastIndex = 0;

    for (index = match.index; index < str.length; index++) {
        switch (str.charCodeAt(index)) {
            case 34: // "
                escape = '&quot;';
                break;
            case 38: // &
                escape = '&amp;';
                break;
            case 39: // '
                escape = '&#39;';
                break;
            case 60: // <
                escape = '&lt;';
                break;
            case 62: // >
                escape = '&gt;';
                break;
            default:
                continue;
        }

        if (lastIndex !== index) {
            html += str.substring(lastIndex, index);
        }

        lastIndex = index + 1;
        html += escape;
    }

    return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
}

function get404Page(customText?: string): string {
    if (customText) {
        return page404.replace('<div class="custom-message"></div>', `<div class="custom-message">${customText}</div>`);
    }

    return page404;
}

/**
 * Read folder recursive
 *
 * @param adapter the adapter instance
 * @param adapterName name of the adapter or dir
 * @param url url of the specific file or directory
 */
async function readFolderRecursive(
    adapter: AdminAdapter,
    adapterName: string,
    url: string,
): Promise<{ name: string; file: Buffer }[]> {
    const filesOfDir = [];
    const fileMetas = await adapter.readDirAsync(adapterName, url);
    for (const fileMeta of fileMetas) {
        if (!fileMeta.isDir) {
            const file = await adapter.readFileAsync(adapterName, `${url}/${fileMeta.file}`);

            if (file.file instanceof Buffer) {
                filesOfDir.push({ name: url ? `${url}/${fileMeta.file}` : fileMeta.file, file: file.file });
            } else {
                filesOfDir.push({
                    name: url ? `${url}/${fileMeta.file}` : fileMeta.file,
                    file: Buffer.from(file.file.toString(), 'utf-8'),
                });
            }
        } else {
            filesOfDir.push(...(await readFolderRecursive(adapter, adapterName, `${url}/${fileMeta.file}`)));
        }
    }

    return filesOfDir;
}

function MemoryWriteStream(): void {
    Transform.call(this);
    this._chunks = [];
    this._transform = (chunk: Buffer, _enc: string, cb: () => void): void => {
        this._chunks.push(chunk);
        cb();
    };
    this.collect = (): Buffer<ArrayBuffer> => {
        const result = Buffer.concat(this._chunks);
        this._chunks = [];
        return result;
    };
}
inherits(MemoryWriteStream, Transform);

interface WebOptions {
    systemLanguage: ioBroker.Languages;
}

interface AdminAdapter extends ioBroker.Adapter {
    secret: string;
    config: AdminAdapterConfig;
}

/**
 * Webserver class
 */
class Web {
    server: {
        app: null | Express;
        server: null | (Server & { __server: { app: null | Express; server: null | Server } });
    } = {
        app: null,
        server: null,
    };

    private readonly LOGIN_PAGE = '/index.html?login';

    /** URL to the JSON config schema */
    private readonly JSON_CONFIG_SCHEMA_URL =
        'https://raw.githubusercontent.com/ioBroker/ioBroker.admin/master/packages/jsonConfig/schemas/jsonConfig.json';
    // 'https://raw.githubusercontent.com/ioBroker/adapter-react-v5/main/schemas/jsonConfig.json';

    private store: Store | null = null;
    private indexHTML: string;
    baseDir = join(__dirname, '..', '..');
    dirName = normalize(`${this.baseDir}/admin/`.replace(/\\/g, '/')).replace(/\\/g, '/');
    private unprotectedFiles: { name: string; isDir: boolean }[];
    systemConfig: Partial<ioBroker.SystemConfigObject>;

    // todo delete after React will be main
    wwwDir = join(this.baseDir, 'adminWww');

    private settings: AdminAdapterConfig;
    private readonly adapter: AdminAdapter;
    private options: WebOptions;
    private readonly onReady: (
        server: Server & { __server: { app: null | Express; server: null | Server } },
        store: Store,
        adapter: AdminAdapter,
    ) => void;
    private systemLanguage: ioBroker.Languages;
    private checkTimeout: ioBroker.Timeout;
    private oauth2Model: OAuth2Model;

    /**
     * Create a new instance of Web
     *
     * @param settings settings of the adapter
     * @param adapter instance of the adapter
     * @param onReady callback when the server is ready
     * @param options options for the webserver
     */
    constructor(
        settings: AdminAdapterConfig,
        adapter: AdminAdapter,
        onReady: (
            server: Server & { __server: { app: null | Express; server: null | Server } },
            store: Store,
            adapter: AdminAdapter,
        ) => void,
        options: WebOptions,
    ) {
        this.settings = settings;
        this.adapter = adapter;
        this.onReady = onReady;
        this.options = options;

        this.systemLanguage = this.options?.systemLanguage || 'en';

        void this.#init();
    }

    decorateLogFile(fileName: string, text?: string): string {
        const log = text || readFileSync(fileName).toString();
        return logTemplate.replace('@@title@@', parse(fileName).name).replace('@@body@@', log);
    }

    setLanguage(lang: ioBroker.Languages): void {
        this.systemLanguage = lang;
    }

    close(): void {
        if (this.checkTimeout) {
            this.adapter.clearTimeout(this.checkTimeout);
            this.checkTimeout = null;
        }

        void this.adapter.setState('info.connection', false, true);
        this.server.server?.close();
    }

    processMessage(msg: ioBroker.Message): boolean {
        return this.oauth2Model?.processMessage(msg);
    }

    async prepareIndex(): Promise<string> {
        let template = readFileSync(join(this.wwwDir, 'index.html')).toString('utf8');
        const m = template.match(/(["']?@@\w+@@["']?)/g);
        for (let pattern of m) {
            pattern = pattern.replace(/@/g, '').replace(/'/g, '').replace(/"/g, '');
            if (pattern === 'disableDataReporting') {
                // read sentry state
                const state = await this.adapter.getStateAsync(
                    `system.adapter.${this.adapter.namespace}.plugins.sentry.enabled`,
                );
                template = template.replace(/['"]@@disableDataReporting@@["']/g, state?.val ? 'true' : 'false');
            } else if (pattern === 'loginBackgroundImage') {
                if (this.adapter.config.loginBackgroundImage) {
                    template = template.replace(
                        '@@loginBackgroundImage@@',
                        `files/${this.adapter.namespace}/login-bg.png`,
                    );
                } else {
                    template = template.replace('@@loginBackgroundImage@@', '');
                }
            } else if (pattern === 'loginBackgroundColor') {
                template = template.replace(
                    '@@loginBackgroundColor@@',
                    this.adapter.config.loginBackgroundColor || 'inherit',
                );
            } else if (pattern === 'loadingBackgroundImage') {
                if (this.adapter.config.loadingBackgroundImage) {
                    template = template.replace(
                        '@@loadingBackgroundImage@@',
                        `files/${this.adapter.namespace}/loading-bg.png`,
                    );
                } else {
                    template = template.replace('@@loadingBackgroundImage@@', '');
                }
            } else if (pattern === 'loadingBackgroundColor') {
                template = template.replace(
                    '@@loadingBackgroundColor@@',
                    this.adapter.config.loadingBackgroundColor || '',
                );
            } else if (pattern === 'vendorPrefix') {
                template = template.replace(
                    `@@vendorPrefix@@`,
                    this.systemConfig.native.vendor.uuidPrefix || (uuid.length > 36 ? uuid.substring(0, 2) : ''),
                );
            } else if (pattern === 'loginMotto') {
                template = template.replace(
                    `@@loginMotto@@`,
                    this.systemConfig.native.vendor.admin.login.motto || this.adapter.config.loginMotto || '',
                );
            } else if (pattern === 'loginLogo') {
                template = template.replace(`@@loginLogo@@`, this.systemConfig.native.vendor.icon || '');
            } else if (pattern === 'loginLink') {
                template = template.replace(`@@loginLink@@`, this.systemConfig.native.vendor.admin.login.link || '');
            } else if (pattern === 'loginTitle') {
                template = template.replace(`@@loginTitle@@`, this.systemConfig.native.vendor.admin.login.title || '');
            } else {
                template = template.replace(
                    `@@${pattern}@@`,
                    (this.adapter.config as Record<string, any>)[pattern] !== undefined
                        ? (this.adapter.config as Record<string, any>)[pattern]
                        : '',
                );
            }
        }

        return template;
    }

    getInfoJs(): string {
        const result = [`window.sysLang = "${this.systemLanguage}";`];

        return result.join('\n');
    }

    getErrorRedirect(origin: string): string {
        // LOGIN_PAGE /index.html?login
        // origin can be "?login&href=" -
        // or "/?login&href=" -
        //
        if (origin) {
            const parts = origin.split('&');
            if (!parts.includes('error')) {
                parts.splice(1, 0, 'error');
                origin = parts.join('&');
            }
            if (origin.startsWith('?login')) {
                return this.LOGIN_PAGE + origin.substring(6);
            }
            if (origin.startsWith('/?login')) {
                return this.LOGIN_PAGE + origin.substring(7);
            }
            if (origin.startsWith(this.LOGIN_PAGE)) {
                return origin;
            }
            return this.LOGIN_PAGE + origin;
        }
        return `${this.LOGIN_PAGE}?error`;
    }

    /**
     * Validate, al JSON configs from alla adapters against the current schema
     *
     * @param adapterName name of the adapter
     */
    async validateJsonConfig(adapterName: string): Promise<void> {
        let schema: Record<string, any> | null = null;

        try {
            this.adapter.log.debug(`retrieving json schema from ${this.JSON_CONFIG_SCHEMA_URL}`);
            const schemaRes = await axios.get(this.JSON_CONFIG_SCHEMA_URL);
            schema = schemaRes.data as Record<string, any>;
        } catch (e) {
            this.adapter.log.debug(`Could not get jsonConfig schema: ${e.message}`);
            return;
        }

        const res: ioBroker.AdapterObject | null = await this.adapter.getForeignObjectAsync<`system.adapter.${string}`>(
            `system.adapter.${adapterName}`,
        );

        if (res?.common.adminUI?.config === 'json') {
            try {
                const ajv = new Ajv({
                    allErrors: false,
                    strict: 'log',
                });

                const adapterPath = dirname(require.resolve(`iobroker.${adapterName}/package.json`));

                const jsonConfPath = join(adapterPath, 'admin', 'jsonConfig.json');
                const json5ConfPath = join(adapterPath, 'admin', 'jsonConfig.json5');
                let jsonConf: string;

                if (existsSync(jsonConfPath)) {
                    jsonConf = readFileSync(jsonConfPath, {
                        encoding: 'utf-8',
                    });
                } else {
                    jsonConf = readFileSync(json5ConfPath, {
                        encoding: 'utf-8',
                    });
                }

                const validate = ajv.compile(schema);
                const valid = validate(JSON5(jsonConf));

                if (!valid) {
                    this.adapter.log.warn(
                        `${adapterName} has an invalid jsonConfig: ${JSON.stringify(validate.errors)}`,
                    );
                }
            } catch (e) {
                this.adapter.log.debug(`Error validating schema of ${adapterName}: ${e.message}`);
            }
        }
    }

    unzipFile(fileName: string, data: string, res: Response): void {
        // extract the file
        try {
            const text = gunzipSync(data).toString('utf8');
            if (text.length > 2 * 1024 * 1024) {
                res.header('Content-Type', 'text/plain');
                res.send(text);
            } else {
                res.header('Content-Type', 'text/html');
                res.send(this.decorateLogFile(fileName, text));
            }
        } catch (e) {
            res.header('Content-Type', 'application/gzip');
            res.send(data);
            this.adapter.log.error(`Cannot extract file ${fileName}: ${e}`);
        }
    }

    resetIndexHtml(): void {
        this.indexHTML = '';
    }

    /**
     * Initialize the server
     */
    async #init(): Promise<void> {
        if (this.settings.port) {
            this.server.app = express();
            this.server.app.use(compression());

            this.settings.ttl = Math.round(this.settings.ttl) || 3_600;
            this.settings.accessAllowedConfigs = this.settings.accessAllowedConfigs || [];
            this.settings.accessAllowedTabs = this.settings.accessAllowedTabs || [];

            this.server.app.disable('x-powered-by');

            // enable use of i-frames together with HTTPS
            this.server.app.get('/*', (_req: Request, res: Response, next: NextFunction): void => {
                res.header('X-Frame-Options', 'SAMEORIGIN');
                next(); // http://expressjs.com/guide.html#passing-route control
            });

            // ONLY for DEBUG
            /*server.app.use((req: Request, res: Response, next: NextFunction): void => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                next();
            });*/

            this.server.app.get('/version', (_req: Request, res: Response): void => {
                res.status(200).send(this.adapter.version);
            });

            this.server.app.get('/sso', (req: Request<any, any, any, SsoState>, res: Response): void => {
                const scope = 'openid email';
                const { redirectUrl, method } = req.query;

                let user = '';

                if (req.query.method === 'register') {
                    user = req.query.user;
                }

                const redirectUri = `${req.protocol}://${req.get('host')}/sso-callback`;
                const authUrl = `${KEYCLOAK_ISSUER}/protocol/openid-connect/auth?client_id=${KEYCLOAK_CLIENT_ID}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${encodeURIComponent(JSON.stringify({ method, redirectUrl, user }))}`;

                res.status(200).redirect(authUrl);
            });

            this.server.app.get(
                '/sso-callback',
                async (req: Request<any, any, any, SsoCallbackQuery>, res: Response): Promise<void> => {
                    // TODO: this needs to be moved in the oauth websever
                    const { code, state } = req.query;

                    const thisHost = `${req.protocol}://${req.get('host')}`;
                    const stateObj: SsoState = JSON.parse(decodeURIComponent(state));

                    /**
                     * Get key from Keycloak
                     *
                     * @param header JWT header
                     * @param callback the callback function
                     */
                    const getKey = (header: JwtHeader, callback: SigningKeyCallback): void => {
                        jwksClient.getSigningKey(header.kid, (err, key) => {
                            if (err) {
                                return callback(err);
                            }
                            const signingKey = key.getPublicKey();
                            callback(null, signingKey);
                        });
                    };

                    /**
                     * Verify the given JWT token
                     *
                     * @param idToken the jwt token to verify
                     */
                    const verifyIdToken = async (idToken: string): Promise<JwtFullPayload> => {
                        return new Promise((resolve, reject) => {
                            verify(
                                idToken,
                                getKey,
                                {
                                    algorithms: ['RS256'],
                                    issuer: KEYCLOAK_ISSUER,
                                    audience: KEYCLOAK_CLIENT_ID,
                                },
                                (err, decoded) => {
                                    if (err) {
                                        return reject(new Error(`Token verification failed: ${err.message}`));
                                    }
                                    resolve(decoded as JwtFullPayload);
                                },
                            );
                        });
                    };

                    const tokenUrl = `${KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

                    let tokenData: OidcTokenResponse;
                    let jwtVerifiedPayload: JwtFullPayload;

                    try {
                        const tokenResponse = await fetch(tokenUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                grant_type: 'authorization_code',
                                code,
                                redirect_uri: `${thisHost}/sso-callback`,
                                client_id: KEYCLOAK_CLIENT_ID,
                            }),
                        });

                        tokenData = await tokenResponse.json();
                        jwtVerifiedPayload = await verifyIdToken(tokenData.id_token);

                        this.adapter.log.debug(JSON.stringify(jwtVerifiedPayload));
                    } catch (e) {
                        this.adapter.log.error(`Error getting token: ${e.message}`);
                        return res.status(200).redirect(`${stateObj.redirectUrl}/#tab-users`);
                    }

                    if (stateObj.method === 'login') {
                        const objView = await this.adapter.getObjectViewAsync('system', 'user', {
                            startkey: 'system.user.',
                            endkey: 'system.user.\u9999',
                        });

                        const item = objView.rows.find(
                            // @ts-expect-error needs to be allowed explicitly
                            item => item.value.common?.externalAuthentication?.oidc?.sub === jwtVerifiedPayload.sub,
                        );

                        const username = item.id;
                        // TODO: password is hashed find another way to authenticate at oauth token endpoint
                        const password = 'xxx'; // item.value.common.password;

                        this.adapter.log.debug(`Login as ${username} via SSO`);

                        try {
                            const result = await fetch(`${thisHost}/oauth/token`, {
                                method: 'POST',
                                credentials: 'include',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                                body: new URLSearchParams({
                                    grant_type: 'password',
                                    username,
                                    password,
                                    stayloggedin: 'false',
                                    client_id: 'ioBroker',
                                }),
                            });

                            const resultBody: IobrokerOauthResponse = await result.json();

                            const redirectUrl = new URL(stateObj.redirectUrl);
                            redirectUrl.search = new URLSearchParams({
                                ssoLoginResponse: JSON.stringify(resultBody),
                            }).toString();

                            return void res
                                .status(200)
                                .cookie('access_token', resultBody.access_token)
                                .redirect(redirectUrl.toString());
                        } catch (e) {
                            this.adapter.log.error(`Could not get oauth token: ${e.message}`);
                        }

                        return res.status(200).redirect(stateObj.redirectUrl);
                    }

                    // user connection flow
                    const userObj = await this.adapter.getForeignObjectAsync(`system.user.${stateObj.user}`);
                    // @ts-expect-error needs to be allowed explicitly
                    userObj.common.externalAuthentication ??= {};
                    // @ts-expect-error needs to be allowed explicitly
                    userObj.common.externalAuthentication.oidc = { sub: jwtVerifiedPayload.sub };
                    await this.adapter.extendForeignObjectAsync(`system.user.${stateObj.user}`, userObj);

                    const redirectUrl = new URL(stateObj.redirectUrl);
                    redirectUrl.search = `id_token=${tokenData.id_token}`;
                    res.status(200).redirect(redirectUrl.toString());
                },
            );

            // replace socket.io
            this.server.app.use((req: Request, res: Response, next: NextFunction): void => {
                const url = req.url.split('?')[0];
                // return favicon always
                if (url === '/auth') {
                    // User can ask server if authentication enabled
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ auth: this.settings.auth });
                } else if (url === '/favicon.ico') {
                    res.set('Content-Type', 'image/x-icon');
                    if (this.systemConfig.native.vendor.ico) {
                        // convert base64 to ico
                        const text = this.systemConfig.native.vendor.ico.split(',')[1];
                        res.send(Buffer.from(text, 'base64'));
                        return;
                    }

                    res.send(readFileSync(join(this.wwwDir, 'favicon.ico')));
                    return;
                } else if (socketIoFile !== false && url.includes('socket.io.js')) {
                    if (socketIoFile) {
                        res.contentType('text/javascript');
                        res.status(200).send(socketIoFile);
                        return;
                    }
                    socketIoFile = readFileSync(join(this.wwwDir, 'lib', 'js', 'socket.io.js'), {
                        encoding: 'utf-8',
                    });
                    if (socketIoFile) {
                        res.contentType('text/javascript');
                        res.status(200).send(socketIoFile);
                        return;
                    }
                    socketIoFile = false;
                    res.status(404).send(get404Page());
                    return;
                }
                next();
            });

            this.server.app.get('*/_socket/info.js', (_req: Request, res: Response): void => {
                res.set('Content-Type', 'application/javascript');
                res.status(200).send(this.getInfoJs());
            });

            if (this.settings.auth) {
                AdapterStore = commonTools.session(session, this.settings.ttl);
                this.store = new AdapterStore({ adapter: this.adapter });

                this.server.app.use(cookieParser());
                this.server.app.use(bodyParser.urlencoded({ extended: true }));
                this.server.app.use(bodyParser.json());

                this.oauth2Model = createOAuth2Server(this.adapter, {
                    app: this.server.app,
                    secure: this.settings.secure,
                    accessLifetime: this.settings.ttl,
                    refreshLifetime: 60 * 60 * 24 * 7, // 1 week (Maybe adjustable?)
                    noBasicAuth: this.settings.noBasicAuth,
                    loginPage: (req: Request): string => {
                        const isDev = req.url.includes('?dev');
                        let origin = req.url.split('origin=')[1];
                        if (origin) {
                            const pos = origin.lastIndexOf('/');
                            if (pos !== -1) {
                                origin = origin.substring(0, pos);
                            }
                        }

                        if (isDev) {
                            return 'http://127.0.0.1:3000/index.html?login';
                        }

                        return origin ? origin + this.LOGIN_PAGE : this.LOGIN_PAGE;
                    },
                });

                this.server.app.get('/session', (req: Request, res: Response): void => {
                    if (req.headers.cookie) {
                        const cookies = req.headers.cookie.split(';').find(c => c.trim().startsWith('access_token='));
                        let tokenCookie = cookies?.split('=')[1];
                        if (!tokenCookie && req.headers.authorization?.startsWith('Bearer ')) {
                            tokenCookie = req.headers.authorization.split(' ')[1];
                        } else if (!tokenCookie && req.query?.token) {
                            tokenCookie = req.query.token as string;
                        }

                        if (tokenCookie) {
                            void this.adapter.getSession(`a:${tokenCookie[1]}`, (token: InternalStorageToken): void => {
                                if (!token?.user) {
                                    res.json({ expireInSec: 0 });
                                } else {
                                    res.json({ expireInSec: Math.round((token.aExp - Date.now()) / 1000) });
                                }
                            });
                            return;
                        }
                    }

                    res.json({ error: 'Cannot find session' });
                });

                this.server.app.get('/logout', (req: Request, res: Response): void => {
                    const isDev = req.url.includes('?dev');
                    let origin = req.url.split('origin=')[1];
                    if (origin) {
                        const pos = origin.lastIndexOf('/');
                        if (pos !== -1) {
                            origin = origin.substring(0, pos);
                        }
                    }

                    if (isDev) {
                        res.redirect('http://127.0.0.1:3000/index.html?login');
                    } else {
                        res.redirect(origin ? origin + this.LOGIN_PAGE : this.LOGIN_PAGE);
                    }
                });

                // route middleware to make sure a user is logged in
                this.server.app.use((req: Request, res: Response, next: NextFunction): void => {
                    // return favicon always
                    if (req.url === '/favicon.ico') {
                        res.set('Content-Type', 'image/x-icon');
                        if (this.systemConfig.native.vendor.ico) {
                            // convert base64 to ico
                            const text = this.systemConfig.native.vendor.ico.split(',')[1];
                            res.send(Buffer.from(text, 'base64'));
                            return;
                        }
                        res.send(readFileSync(join(this.wwwDir, 'favicon.ico')));
                        return;
                    }
                    if (/admin\.\d+\/login-bg\.png(\?.*)?$/.test(req.originalUrl)) {
                        // Read the names of files for gong
                        this.adapter.readFile(this.adapter.namespace, 'login-bg.png', null, (err, file): void => {
                            if (!err && file) {
                                res.set('Content-Type', 'image/png');
                                res.status(200).send(file);
                            } else {
                                res.status(404).send(get404Page());
                            }
                        });
                        return;
                    }
                    if ((req.isAuthenticated && !req.isAuthenticated()) || (!req.isAuthenticated && !req.user)) {
                        const pathName = req.url.split('?')[0];
                        if (
                            pathName.startsWith('/login/') ||
                            pathName.endsWith('.ico') ||
                            pathName.endsWith('manifest.json')
                        ) {
                            return next();
                        }
                        // protect all paths except
                        this.unprotectedFiles ||= readdirSync(this.wwwDir).map(file => {
                            const stat = lstatSync(join(this.wwwDir, file));
                            return { name: file, isDir: stat.isDirectory() };
                        });
                        if (
                            pathName &&
                            pathName !== '/' &&
                            !this.unprotectedFiles.find(file =>
                                file.isDir ? pathName.startsWith(`/${file.name}/`) : `/${file.name}` === pathName,
                            )
                        ) {
                            res.redirect(`${this.LOGIN_PAGE}&href=${encodeURIComponent(req.originalUrl)}`);
                        } else {
                            next();
                            return;
                        }
                    } else {
                        next();
                        return;
                    }
                });
            } else {
                this.server.app.get('/logout', (_req: Request, res: Response): void => res.redirect('/'));
            }

            this.server.app.get('/iobroker_check.html', (_req: Request, res: Response): void => {
                res.status(200).send('ioBroker');
            });

            this.server.app.get('/validate_config/*', async (req: Request, res: Response): Promise<void> => {
                const adapterName = req.url.split('/').pop();

                await this.validateJsonConfig(adapterName.toLowerCase());

                res.status(200).send('validated');
            });

            // send log files
            this.server.app.get('/log/*', (req: Request, res: Response): void => {
                let parts = decodeURIComponent(req.url).split('/');
                if (parts.length === 5) {
                    // remove first "/"
                    parts.shift();
                    // remove "log"
                    parts.shift();
                    const [host, transport] = parts;
                    parts = parts.splice(2);
                    const fileName = parts.join('/');
                    if (fileName.includes('..')) {
                        res.status(404).send(
                            get404Page(`File ${escapeHtml(fileName)} not found. Do not use relative paths!`),
                        );
                        return;
                    }

                    this.adapter.sendToHost(
                        `system.host.${host}`,
                        'getLogFile',
                        { filename: fileName, transport },
                        result => {
                            const _result = result as { error?: string; data?: string; size?: number; gz?: boolean };
                            if (!_result || _result.error) {
                                if (_result.error) {
                                    this.adapter.log.warn(`Cannot read log file ${fileName}: ${_result.error}`);
                                }
                                res.status(404).send(get404Page(`File ${escapeHtml(fileName)} not found`));
                            } else {
                                if (_result.gz) {
                                    if (_result.size > 1024 * 1024) {
                                        res.header('Content-Type', 'application/gzip');
                                        res.send(_result.data);
                                    } else {
                                        try {
                                            this.unzipFile(fileName, _result.data, res);
                                        } catch (e) {
                                            res.header('Content-Type', 'application/gzip');
                                            res.send(_result.data);
                                            this.adapter.log.error(`Cannot extract file ${fileName}: ${e}`);
                                        }
                                    }
                                } else if (_result.data === undefined || _result.data === null) {
                                    res.status(404).send(get404Page(`File ${escapeHtml(fileName)} not found`));
                                } else if (_result.size > 2 * 1024 * 1024) {
                                    res.header('Content-Type', 'text/plain');
                                    res.send(_result.data);
                                } else {
                                    res.header('Content-Type', 'text/html');
                                    res.send(this.decorateLogFile(fileName, _result.data));
                                }
                            }
                        },
                    );
                } else {
                    parts = parts.splice(2);
                    const transport = parts.shift();
                    let fileName = parts.join('/');
                    const config = this.adapter.systemConfig;

                    // detect file log
                    if (transport && config?.log?.transport) {
                        if (transport in config.log.transport && config.log.transport[transport].type === 'file') {
                            let logFolder;
                            if (config.log.transport[transport].filename) {
                                parts = config.log.transport[transport].filename.replace(/\\/g, '/').split('/');
                                parts.pop();
                                logFolder = normalize(parts.join('/'));
                            } else {
                                logFolder = join(process.cwd(), 'log');
                            }

                            if (logFolder[0] !== '/' && logFolder[0] !== '\\' && !logFolder.match(/^[a-zA-Z]:/)) {
                                const _logFolder = normalize(
                                    join(`${this.baseDir}/../../`, logFolder).replace(/\\/g, '/'),
                                ).replace(/\\/g, '/');
                                if (!existsSync(_logFolder)) {
                                    logFolder = normalize(
                                        join(`${this.baseDir}/../`, logFolder).replace(/\\/g, '/'),
                                    ).replace(/\\/g, '/');
                                } else {
                                    logFolder = _logFolder;
                                }
                            }

                            fileName = normalize(join(logFolder, fileName).replace(/\\/g, '/')).replace(/\\/g, '/');

                            if (fileName.startsWith(logFolder) && existsSync(fileName)) {
                                const stat = lstatSync(fileName);
                                // if a file is an archive
                                if (fileName.toLowerCase().endsWith('.gz')) {
                                    // try to not process to big files
                                    if (stat.size > 1024 * 1024 /* || !existsSync('/dev/null')*/) {
                                        res.header('Content-Type', 'application/gzip');
                                        res.sendFile(fileName);
                                    } else {
                                        try {
                                            this.unzipFile(
                                                fileName,
                                                readFileSync(fileName, { encoding: 'utf-8' }),
                                                res,
                                            );
                                        } catch (e) {
                                            res.header('Content-Type', 'application/gzip');
                                            res.sendFile(fileName);
                                            this.adapter.log.error(`Cannot extract file ${fileName}: ${e}`);
                                        }
                                    }
                                } else if (stat.size > 2 * 1024 * 1024) {
                                    res.header('Content-Type', 'text/plain');
                                    res.sendFile(fileName);
                                } else {
                                    res.header('Content-Type', 'text/html');
                                    res.send(this.decorateLogFile(fileName));
                                }

                                return;
                            }
                        }
                    }

                    res.status(404).send(get404Page(`File ${escapeHtml(fileName)} not found`));
                }
            });

            const appOptions: { maxAge?: number } = {};
            if (this.settings.cache) {
                appOptions.maxAge = 30_758_400_000;
            }

            if (this.settings.tmpPathAllow && this.settings.tmpPath) {
                this.server.app.use('/tmp/', express.static(this.settings.tmpPath, { maxAge: 0 }));
                this.server.app.use(
                    fileUpload({
                        useTempFiles: true,
                        tempFileDir: this.settings.tmpPath,
                    }),
                );
                this.server.app.post('/upload', (req: Request, res: Response): void => {
                    if (!req.files) {
                        res.status(400).send('No files were uploaded.');
                        return;
                    }

                    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
                    let myFile: fileUpload.UploadedFile;
                    // take the first non-empty file
                    for (const file of Object.values(req.files)) {
                        if (file) {
                            myFile = file as fileUpload.UploadedFile;
                            break;
                        }
                    }

                    if (myFile) {
                        if (myFile.data && myFile.data.length > 600 * 1024 * 1024) {
                            res.header('Content-Type', 'text/plain');
                            res.status(500).send('File is too big. (Max 600MB)');
                            return;
                        }
                        // Use the mv() method to place the file somewhere on your server
                        myFile.mv(`${this.settings.tmpPath}/restore.iob`, err => {
                            if (err) {
                                res.status(500).send(escapeHtml(typeof err === 'string' ? err : JSON.stringify(err)));
                            } else {
                                res.header('Content-Type', 'text/plain');
                                res.status(200).send('File uploaded!');
                            }
                        });
                    } else {
                        res.header('Content-Type', 'text/plain');
                        res.status(500).send('File not uploaded');
                    }
                });
            }

            if (!existsSync(this.wwwDir)) {
                this.server.app.use('/', (_req: Request, res: Response): void => {
                    res.header('Content-Type', 'text/plain');
                    res.status(404).send(
                        'This adapter cannot be installed directly from GitHub.<br>You must install it from npm.<br>Write for that <i>"npm install iobroker.admin"</i> in according directory.',
                    );
                });
            } else {
                this.server.app.get('/empty.html', (_req: Request, res: Response): void => {
                    res.status(200).send('');
                });

                this.server.app.get('/index.html', async (_req: Request, res: Response): Promise<void> => {
                    this.indexHTML = this.indexHTML || (await this.prepareIndex());
                    res.header('Content-Type', 'text/html');
                    res.status(200).send(this.indexHTML);
                });

                this.server.app.get('/', async (_req: Request, res: Response): Promise<void> => {
                    this.indexHTML = this.indexHTML || (await this.prepareIndex());
                    res.header('Content-Type', 'text/html');
                    res.status(200).send(this.indexHTML);
                });

                this.server.app.use('/', express.static(this.wwwDir, appOptions));
            }

            // reverse proxy with url rewrite for couchdb attachments in <adapter-name>.admin
            this.server.app.use('/adapter/', (req: Request, res: Response): void => {
                // Example: /example/?0&attr=1
                let url: string;
                try {
                    url = decodeURIComponent(req.url);
                } catch {
                    // ignore
                    url = req.url;
                }

                // sanitize url

                // add index.html
                url = url.replace(/\/($|\?|#)/, '/index.html$1');

                // Read config files for admin from /adapters/admin/admin/...
                if (url.startsWith(`/${this.adapter.name}/`)) {
                    url = url.replace(`/${this.adapter.name}/`, this.dirName);
                    // important: Linux does not normalize "\" but readFile accepts it as '/'
                    url = normalize(url.replace(/\?.*/, '').replace(/\\/g, '/')).replace(/\\/g, '/');

                    if (url.startsWith(this.dirName)) {
                        try {
                            if (existsSync(url)) {
                                res.contentType(getType(url) || 'text/javascript');
                                createReadStream(url).pipe(res);
                            } else {
                                res.status(404).send(get404Page(`File not found`));
                            }
                        } catch (e) {
                            res.status(404).send(get404Page(`File not found: ${escapeHtml(JSON.stringify(e))}`));
                        }
                    } else {
                        res.status(404).send(get404Page(`File ${escapeHtml(url)} not found`));
                    }
                    return;
                }

                const parts = url.split('/');
                // Skip first /
                parts.shift();
                // Get ID
                const adapterName = parts.shift();
                const id = `${adapterName}.admin`;
                url = parts.join('/');
                const pos = url.indexOf('?');
                let _instance = 0;
                if (pos !== -1) {
                    _instance = parseInt(url.substring(pos + 1), 10) || 0;
                    url = url.substring(0, pos);
                }

                if (this.settings.accessLimit) {
                    if (url === 'index.html' || url === 'index_m.html') {
                        const anyConfig = this.settings.accessAllowedConfigs.includes(`${adapterName}.${_instance}`);
                        if (!anyConfig) {
                            res.contentType('text/html');
                            res.status(403).send('You are not allowed to access this page');
                            return;
                        }
                    }
                    if (url === 'tab.html' || url === 'tab_m.html') {
                        const anyTabs = this.settings.accessAllowedTabs.includes(`${adapterName}.${_instance}`);
                        if (!anyTabs) {
                            res.contentType('text/html');
                            res.status(403).send('You are not allowed to access this page');
                            return;
                        }
                    }
                }

                // this.adapter.readFile is sanitized
                this.adapter.readFile(id, url, null, (err, buffer, mimeType): void => {
                    if (!buffer || err) {
                        res.contentType('text/html');
                        res.status(404).send(get404Page(`File ${escapeHtml(url)} not found`));
                    } else {
                        if (mimeType) {
                            res.contentType(mimeType);
                        } else {
                            try {
                                const _mimeType = getType(url);
                                res.contentType(_mimeType || 'text/javascript');
                            } catch {
                                res.contentType('text/javascript');
                            }
                        }
                        res.send(buffer);
                    }
                });
            });

            // reverse proxy with url rewrite for couchdb attachments in <adapter-name>
            this.server.app.use('/files/', async (req: Request, res: Response): Promise<void> => {
                // Example: /vis.0/main/img/image.png
                let url: string;
                try {
                    url = decodeURIComponent(req.url);
                } catch {
                    // ignore
                    url = req.url;
                }

                // add index.html
                url = url.replace(/\/($|\?|#)/, '/index.html$1');

                const parts = url.split('/');
                // Skip first /files
                parts.shift();
                // Get ID
                const adapterName = parts.shift();
                url = parts.join('/');
                const pos = url.indexOf('?');
                let _instance = 0;
                if (pos !== -1) {
                    _instance = parseInt(url.substring(pos + 1), 10) || 0;
                    url = url.substring(0, pos);
                }

                if (this.settings.accessLimit) {
                    if (url === 'index.html' || url === 'index_m.html') {
                        const anyConfig = this.settings.accessAllowedConfigs.includes(`${adapterName}.${_instance}`);
                        if (!anyConfig) {
                            res.contentType('text/html');
                            res.status(403).send('You are not allowed to access this page');
                            return;
                        }
                    }
                    if (url === 'tab.html' || url === 'tab_m.html') {
                        const anyTabs = this.settings.accessAllowedTabs.includes(`${adapterName}.${_instance}`);
                        if (!anyTabs) {
                            res.contentType('text/html');
                            res.status(403).send('You are not allowed to access this page');
                            return;
                        }
                    }
                }

                try {
                    if (await this.adapter.fileExists(adapterName, url)) {
                        const { mimeType, file } = await this.adapter.readFileAsync(adapterName, url);

                        // special case for svg stored into logo.png
                        if (url.endsWith('.png') && file.length < 30000) {
                            const str = file.toString('utf8');
                            if (str.startsWith('<svg') || str.startsWith('<xml') || str.startsWith('<?xml')) {
                                // it is svg
                                res.contentType('image/svg+xml');
                                res.send(str);
                                return;
                            }
                            res.contentType('image/png');
                        } else {
                            res.contentType(mimeType || 'text/javascript');
                        }

                        if (adapterName === this.adapter.namespace && url.startsWith('zip/')) {
                            // special files, that can be read-only one time
                            this.adapter.unlink(adapterName, url, (): void => {});
                        }

                        res.send(file);
                    } else {
                        const filesOfDir = await readFolderRecursive(this.adapter, adapterName, url);

                        const archive = archiver('zip', {
                            zlib: { level: 9 },
                        });

                        for (const file of filesOfDir) {
                            archive.append(file.file, { name: file.name });
                        }

                        const zip: Buffer[] = [];

                        archive.on('data', chunk => zip.push(chunk));

                        await archive.finalize();

                        res.contentType('application/zip');
                        res.send(Buffer.concat(zip));
                    }
                } catch (e) {
                    this.adapter.log.warn(`Cannot read file ("${adapterName}"/"${url}"): ${e.message}`);
                    res.contentType('text/html');
                    res.status(404).send(get404Page(`File ${escapeHtml(url)} not found`));
                }
            });

            // handler for oauth2 redirects
            this.server.app.use('/oauth2_callbacks/', (req: Request, res: Response): void => {
                // extract instance from "http://localhost:8081/oauth2_callbacks/netatmo.0/?state=ABC&code=CDE"
                const [_instance, params] = req.url.split('?');
                const instance = _instance.replace(/^\//, '').replace(/\/$/, ''); // remove last and first "/" in "/netatmo.0/"
                const query: Record<string, string | boolean | number> = {};
                params.split('&').forEach(param => {
                    const [key, value] = param.split('=');
                    query[key] = value === undefined ? true : value;
                    if (Number.isFinite(query[key])) {
                        query[key] = parseFloat(query[key] as string);
                    } else if (query[key] === 'true') {
                        query[key] = true;
                    } else if (query[key] === 'false') {
                        query[key] = false;
                    }
                });

                if ((query.timeout as number) > 30_000) {
                    query.timeout = 30_000;
                }

                let timeout: NodeJS.Timeout = setTimeout(
                    (): void => {
                        if (timeout) {
                            timeout = null;
                            let text = readFileSync(`${this.baseDir}/public/oauthError.html`).toString('utf8');
                            text = text.replace('%LANGUAGE%', this.systemLanguage);
                            text = text.replace('%ERROR%', 'TIMEOUT');
                            res.setHeader('Content-Type', 'text/html');
                            res.status(408).send(text);
                        }
                    },
                    (query.timeout as number) || 5_000,
                );

                this.adapter.sendTo(instance, 'oauth2Callback', query, result => {
                    const _result = result as { error?: string; result?: string };
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                        if (_result?.error) {
                            let text = readFileSync(`${this.baseDir}/public/oauthError.html`).toString('utf8');
                            text = text.replace('%LANGUAGE%', this.systemLanguage);
                            text = text.replace('%ERROR%', _result.error);
                            res.setHeader('Content-Type', 'text/html');
                            res.status(500).send(text);
                        } else {
                            let text = readFileSync(`${this.baseDir}/public/oauthSuccess.html`).toString('utf8');
                            text = text.replace('%LANGUAGE%', this.systemLanguage);
                            text = text.replace('%MESSAGE%', _result?.result || '');
                            res.setHeader('Content-Type', 'text/html');
                            res.status(200).send(text);
                        }
                    }
                });
            });

            // 404 handler
            this.server.app.use((req: Request, res: Response): void => {
                res.status(404).send(get404Page(`File ${escapeHtml(req.url)} not found`));
            });

            try {
                const webserver = new WebServer({
                    app: this.server.app,
                    adapter: this.adapter,
                    secure: this.settings.secure,
                });
                this.server.server = await webserver.init();
            } catch (err) {
                this.adapter.log.error(`Cannot create web-server: ${err}`);
                if (this.adapter.terminate) {
                    this.adapter.terminate(EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                } else {
                    process.exit(EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                }
                return;
            }
            if (!this.server.server) {
                this.adapter.log.error(`Cannot create web-server`);
                if (this.adapter.terminate) {
                    this.adapter.terminate(EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                } else {
                    process.exit(EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                }
                return;
            }

            this.server.server.__server = this.server;
        } else {
            this.adapter.log.error('port missing');
            if (this.adapter.terminate) {
                this.adapter.terminate('port missing', EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
            } else {
                process.exit(EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
            }
        }

        void this.adapter
            .getForeignObjectAsync('system.config')
            .then(obj => {
                this.systemConfig = obj || {};
                this.systemConfig.native = this.systemConfig.native || {};
                this.systemConfig.native.vendor = this.systemConfig.native.vendor || {};
                this.systemConfig.native.vendor.admin = this.systemConfig.native.vendor.admin || {};
                this.systemConfig.native.vendor.admin.login = this.systemConfig.native.vendor.admin.login || {};

                return this.adapter.getForeignObjectAsync('system.meta.uuid');
            })
            .then(obj => {
                if (obj && obj.native) {
                    uuid = obj.native.uuid;
                }

                if (this.server.server) {
                    let serverListening = false;
                    let serverPort: number;
                    this.server.server.on('error', e => {
                        if (e.toString().includes('EACCES') && serverPort <= 1024) {
                            this.adapter.log.error(
                                `node.js process has no rights to start server on the port ${serverPort}.\n` +
                                    `Do you know that on linux you need special permissions for ports under 1024?\n` +
                                    `You can call in shell following scrip to allow it for node.js: "iobroker fix"`,
                            );
                        } else {
                            this.adapter.log.error(
                                `Cannot start server on ${this.settings.bind || '0.0.0.0'}:${serverPort}: ${e.toString()}`,
                            );
                        }

                        if (!serverListening) {
                            if (this.adapter.terminate) {
                                this.adapter.terminate(EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                            } else {
                                process.exit(EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                            }
                        }
                    });

                    this.settings.port = parseInt(this.settings.port as unknown as string, 10) || 8081;
                    serverPort = this.settings.port;

                    this.adapter.getPort(
                        this.settings.port,
                        !this.settings.bind || this.settings.bind === '0.0.0.0'
                            ? undefined
                            : this.settings.bind || undefined,
                        port => {
                            serverPort = port;

                            // Start the web server
                            this.server.server.listen(
                                port,
                                !this.settings.bind || this.settings.bind === '0.0.0.0'
                                    ? undefined
                                    : this.settings.bind || undefined,
                                (): void => {
                                    void this.adapter.setState('info.connection', true, true);

                                    serverListening = true;
                                    this.adapter.log.info(
                                        `http${this.settings.secure ? 's' : ''} server listening on port ${port}`,
                                    );
                                    this.adapter.log.info(
                                        `Use link "http${
                                            this.settings.secure ? 's' : ''
                                        }://127.0.0.1:${port}" to configure.`,
                                    );

                                    if (!this.adapter.config.doNotCheckPublicIP && !this.adapter.config.auth) {
                                        this.checkTimeout = this.adapter.setTimeout(async (): Promise<void> => {
                                            this.checkTimeout = null;
                                            try {
                                                await checkPublicIP(
                                                    this.settings.port,
                                                    'ioBroker',
                                                    '/iobroker_check.html',
                                                );
                                            } catch (e) {
                                                // this supported first from js-controller 5.0.
                                                this.adapter.sendToHost(
                                                    `system.host.${this.adapter.host}`,
                                                    'addNotification',
                                                    {
                                                        scope: 'system',
                                                        category: 'securityIssues',
                                                        message:
                                                            'Your admin instance is accessible from the internet without any protection. ' +
                                                            'Please enable authentication or disable the access from the internet.',
                                                        instance: `system.adapter.${this.adapter.namespace}`,
                                                    },
                                                    (/* result */): void => {
                                                        /* ignore */
                                                    },
                                                );

                                                this.adapter.log.error(e.toString());
                                            }
                                        }, 1000);
                                    }
                                },
                            );

                            if (typeof this.onReady === 'function') {
                                this.onReady(this.server.server, this.store, this.adapter);
                            }
                        },
                    );
                }
            });
    }
}

export default Web;
