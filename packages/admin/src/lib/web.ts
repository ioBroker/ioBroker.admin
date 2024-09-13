import * as utils from '@iobroker/adapter-core';
import * as IoBWebServer from '@iobroker/webserver';
import * as express from 'express';
import * as fs from 'node:fs';
import * as util from 'util';
import * as path from 'node:path';
import * as stream from 'node:stream';
import * as compression from 'compression';
import * as mime from 'mime';
import * as zlib from 'node:zlib';
import * as archiver from 'archiver';
import axios from 'axios';
import * as Ajv from 'ajv';
import * as JSON5 from 'json5';
import * as passport from 'passport';
import * as fileUpload from 'express-fileupload';
import { Strategy } from 'passport-local';

import type { Store } from 'express-session';
import * as session from 'express-session';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { RequestHandler } from 'express';

interface IConnectFlashOptions {
    unsafe?: boolean | undefined;
}

export interface AdminAdapterConfig extends ioBroker.AdapterConfig {
    accessAllowedConfigs: string[];
    accessAllowedTabs: string[];
    accessApplyRights: boolean;
    accessLimit: boolean;
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
let flash: ((options?: IConnectFlashOptions) => RequestHandler) | undefined;
/** Content of a socket-io file */
let socketIoFile: false | string;
/** UUID of the installation */
let uuid: string;
const page404 = fs.readFileSync(`${__dirname}/../../public/404.html`).toString('utf8');
const logTemplate = fs.readFileSync(`${__dirname}/../../public/logTemplate.html`).toString('utf8');
// const FORBIDDEN_CHARS = /[\]\[*,;'"`<>\\\s?]/g; // with space
const ONE_MONTH_SEC = 30 * 24 * 3_600;

// copied from here: https://github.com/component/escape-html/blob/master/index.js
const matchHtmlRegExp = /["'&<>]/;
function escapeHtml(string: string): string {
    const str = '' + string;
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
    url: string
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
                    file: Buffer.from(file.file, 'utf-8'),
                });
            }
        } else {
            filesOfDir.push(...(await readFolderRecursive(adapter, adapterName, `${url}/${fileMeta.file}`)));
        }
    }

    return filesOfDir;
}

function MemoryWriteStream(): void {
    stream.Transform.call(this);
    this._chunks = [];
    this._transform = (chunk: unknown, enc: unknown, cb: () => void) => {
        this._chunks.push(chunk);
        cb();
    };
    this.collect = () => {
        const result = Buffer.concat(this._chunks);
        this._chunks = [];
        return result;
    };
}
util.inherits(MemoryWriteStream, stream.Transform);

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
    server: { app: null | ReturnType<typeof express>; server: null | import('http').Server } = {
        app: null,
        server: null,
    };

    // todo delete after react will be main
    private readonly LOGIN_PAGE = '/index.html?login';

    /** URL to the JSON config schema */
    private readonly JSON_CONFIG_SCHEMA_URL =
        'https://raw.githubusercontent.com/ioBroker/adapter-react-v5/main/schemas/jsonConfig.json';

    private bruteForce: Record<string, { errors: number; time?: number }> = {};
    private store: unknown = null;
    private indexHTML: string;
    baseDir = path.join(__dirname, '..', '..');
    dirName = path.normalize(`${this.baseDir}/admin/`.replace(/\\/g, '/')).replace(/\\/g, '/');
    private unprotectedFiles: { name: string; isDir: boolean }[];
    systemConfig: Partial<ioBroker.SystemConfigObject>;

    // todo delete after React will be main
    wwwDir = path.join(this.baseDir, 'adminWww');

    private settings: AdminAdapterConfig;
    private readonly adapter: AdminAdapter;
    private options: WebOptions;
    private readonly onReady: (server: unknown, store: unknown, adapter: AdminAdapter) => void;
    private systemLanguage: ioBroker.Languages;
    private checkTimeout: ioBroker.Timeout;

    /**
     * Create a new instance of Web
     *
     * @param settings
     * @param adapter
     * @param onReady
     * @param options
     */
    constructor(
        settings: AdminAdapterConfig,
        adapter: AdminAdapter,
        onReady: (server: unknown, store: unknown, adapter: AdminAdapter) => void,
        options: WebOptions
    ) {
        this.settings = settings;
        this.adapter = adapter;
        this.onReady = onReady;
        this.options = options;

        this.systemLanguage = this.options?.systemLanguage || 'en';

        this.#init();
    }

    decorateLogFile(filename: string, text?: string): string {
        const log = text || fs.readFileSync(filename).toString();
        return logTemplate.replace('@@title@@', path.parse(filename).name).replace('@@body@@', log);
    }

    setLanguage(lang: ioBroker.Languages): void {
        this.systemLanguage = lang;
    }

    close(): void {
        if (this.checkTimeout) {
            this.adapter.clearTimeout(this.checkTimeout);
            this.checkTimeout = null;
        }

        this.adapter.setState('info.connection', false, true);
        this.server.server?.close();
    }

    prepareIndex(): string {
        let template = fs.readFileSync(path.join(this.wwwDir, 'index.html')).toString('utf8');
        const m = template.match(/(["']?@@\w+@@["']?)/g);
        m.forEach(pattern => {
            pattern = pattern.replace(/@/g, '').replace(/'/g, '').replace(/"/g, '');
            if (pattern === 'disableDataReporting') {
                template = template.replace(
                    /['"]@@disableDataReporting@@["']/g,
                    // @ts-expect-error this is not used on instance objects use system.adapter.xy.plugins.sentry.enabled
                    this.adapter.common?.disableDataReporting ? 'true' : 'false'
                );
            } else if (pattern === 'loginBackgroundImage') {
                if (this.adapter.config.loginBackgroundImage) {
                    template = template.replace(
                        '@@loginBackgroundImage@@',
                        `files/${this.adapter.namespace}/login-bg.png`
                    );
                } else {
                    template = template.replace('@@loginBackgroundImage@@', '');
                }
            } else if (pattern === 'loginBackgroundColor') {
                template = template.replace(
                    '@@loginBackgroundColor@@',
                    this.adapter.config.loginBackgroundColor || 'inherit'
                );
            } else if (pattern === 'loadingBackgroundImage') {
                if (this.adapter.config.loadingBackgroundImage) {
                    template = template.replace(
                        '@@loadingBackgroundImage@@',
                        `files/${this.adapter.namespace}/loading-bg.png`
                    );
                } else {
                    template = template.replace('@@loadingBackgroundImage@@', '');
                }
            } else if (pattern === 'loadingBackgroundColor') {
                template = template.replace(
                    '@@loadingBackgroundColor@@',
                    this.adapter.config.loadingBackgroundColor || ''
                );
            } else if (pattern === 'vendorPrefix') {
                template = template.replace(
                    `@@vendorPrefix@@`,
                    this.systemConfig.native.vendor.uuidPrefix || (uuid.length > 36 ? uuid.substring(0, 2) : '')
                );
            } else if (pattern === 'loginMotto') {
                template = template.replace(
                    `@@loginMotto@@`,
                    this.systemConfig.native.vendor.admin.login.motto || this.adapter.config.loginMotto || ''
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
                    this.adapter.config[pattern] !== undefined ? this.adapter.config[pattern] : ''
                );
            }
        });

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
            } else if (origin.startsWith('/?login')) {
                return this.LOGIN_PAGE + origin.substring(7);
            } else if (origin.startsWith(this.LOGIN_PAGE)) {
                return origin;
            } else {
                return this.LOGIN_PAGE + origin;
            }
        } else {
            return `${this.LOGIN_PAGE}?error`;
        }
    }

    /**
     * Validate, al JSON configs from alla adapters against the current schema
     *
     * @param adapterName name of the adapter
     */
    async validateJsonConfig(adapterName: string): Promise<void> {
        let schema;

        try {
            const schemaRes = await axios.get(this.JSON_CONFIG_SCHEMA_URL);
            schema = schemaRes.data;
        } catch (e) {
            this.adapter.log.debug(`Could not get jsonConfig schema: ${e.message}`);
            return;
        }

        const res = await this.adapter.getForeignObjectAsync(`system.adapter.${adapterName}`);

        // @ts-expect-error check later
        if (res?.common.adminUI?.config === 'json') {
            try {
                const ajv = new Ajv.Ajv({
                    allErrors: false,
                    strict: 'log',
                });

                const adapterPath = path.dirname(require.resolve(`iobroker.${adapterName}/package.json`));

                const jsonConfPath = path.join(adapterPath, 'admin', 'jsonConfig.json');
                const json5ConfPath = path.join(adapterPath, 'admin', 'jsonConfig.json5');
                let jsonConf;

                if (fs.existsSync(jsonConfPath)) {
                    jsonConf = fs.readFileSync(jsonConfPath, {
                        encoding: 'utf-8',
                    });
                } else {
                    jsonConf = fs.readFileSync(json5ConfPath, {
                        encoding: 'utf-8',
                    });
                }

                const validate = ajv.compile(schema);
                const valid = validate(JSON5.parse(jsonConf));

                if (!valid) {
                    this.adapter.log.warn(
                        `${adapterName} has an invalid jsonConfig: ${JSON.stringify(validate.errors)}`
                    );
                }
            } catch (e) {
                this.adapter.log.debug(`Error validating schema of ${adapterName}: ${e.message}`);
            }
        }
    }

    unzipFile(filename: string, data: string, res: express.Response): void {
        // extract the file
        try {
            const text = zlib.gunzipSync(data).toString('utf8');
            if (text.length > 2 * 1024 * 1024) {
                res.header('Content-Type', 'text/plain');
                res.send(text);
            } else {
                res.header('Content-Type', 'text/html');
                res.send(this.decorateLogFile(filename, text));
            }
        } catch (e) {
            res.header('Content-Type', 'application/gzip');
            res.send(data);
            this.adapter.log.error(`Cannot extract file ${filename}: ${e}`);
        }
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
            this.server.app.get('/*', (req, res, next) => {
                res.header('X-Frame-Options', 'SAMEORIGIN');
                next(); // http://expressjs.com/guide.html#passing-route control
            });

            // ONLY for DEBUG
            /*server.app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                next();
            });*/

            this.server.app.get('/version', (req, res) => {
                res.status(200).send(this.adapter.version);
            });

            // replace socket.io
            this.server.app.use((req, res, next) => {
                // return favicon always
                if (req.url.endsWith('favicon.ico')) {
                    res.set('Content-Type', 'image/x-icon');
                    if (this.systemConfig.native.vendor.ico) {
                        // convert base64 to ico
                        const text = this.systemConfig.native.vendor.ico.split(',')[1];
                        return res.send(Buffer.from(text, 'base64'));
                    } else {
                        return res.send(fs.readFileSync(path.join(this.wwwDir, 'favicon.ico')));
                    }
                } else if (
                    socketIoFile !== false &&
                    (req.url.startsWith('socket.io.js') || req.url.match(/\/socket\.io\.js(\?.*)?$/))
                ) {
                    if (socketIoFile) {
                        res.contentType('text/javascript');
                        return res.status(200).send(socketIoFile);
                    } else {
                        socketIoFile = fs.readFileSync(path.join(this.wwwDir, 'lib', 'js', 'socket.io.js'), {
                            encoding: 'utf-8',
                        });
                        if (socketIoFile) {
                            res.contentType('text/javascript');
                            return res.status(200).send(socketIoFile);
                        } else {
                            socketIoFile = false;
                            return res.status(404).send(get404Page());
                        }
                    }
                }
                next();
            });

            this.server.app.get('*/_socket/info.js', (req, res) => {
                res.set('Content-Type', 'application/javascript');
                res.status(200).send(this.getInfoJs());
            });

            if (this.settings.auth) {
                AdapterStore = utils.commonTools.session(session, this.settings.ttl);
                flash = await import('connect-flash');
                this.store = new AdapterStore({ adapter: this.adapter });

                passport.use(
                    new Strategy((username, password, done) => {
                        username = (username || '').toString();

                        if (this.bruteForce[username] && this.bruteForce[username].errors > 4) {
                            let minutes = new Date().getTime() - this.bruteForce[username].time;
                            if (this.bruteForce[username].errors < 7) {
                                if (new Date().getTime() - this.bruteForce[username].time < 60_000) {
                                    minutes = 1;
                                } else {
                                    minutes = 0;
                                }
                            } else if (this.bruteForce[username].errors < 10) {
                                if (new Date().getTime() - this.bruteForce[username].time < 180_000) {
                                    minutes = Math.ceil((180_000 - minutes) / 60000);
                                } else {
                                    minutes = 0;
                                }
                            } else if (this.bruteForce[username].errors < 15) {
                                if (new Date().getTime() - this.bruteForce[username].time < 600_000) {
                                    minutes = Math.ceil((60_0000 - minutes) / 60_000);
                                } else {
                                    minutes = 0;
                                }
                            } else if (new Date().getTime() - this.bruteForce[username].time < 3_600_000) {
                                minutes = Math.ceil((3_600_000 - minutes) / 60_000);
                            } else {
                                minutes = 0;
                            }

                            if (minutes) {
                                return done(
                                    `Too many errors. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
                                    false
                                );
                            }
                        }

                        this.adapter.checkPassword(username, password, (res, user) => {
                            if (!res) {
                                this.bruteForce[username] = this.bruteForce[username] || { errors: 0 };
                                this.bruteForce[username].time = new Date().getTime();
                                this.bruteForce[username].errors++;
                            } else if (this.bruteForce[username]) {
                                delete this.bruteForce[username];
                            }

                            if (res) {
                                return done(null, (user || username).replace(/^system\.user\./, ''));
                            } else {
                                return done(null, false);
                            }
                        });
                    })
                );

                passport.serializeUser((user, done) => done(null, user));

                passport.deserializeUser((user, done) => done(null, user));

                this.server.app.use(cookieParser());
                this.server.app.use(bodyParser.urlencoded({ extended: true }));
                this.server.app.use(bodyParser.json());
                this.server.app.use(
                    session({
                        secret: this.adapter.secret,
                        saveUninitialized: true,
                        resave: true,
                        cookie: { maxAge: this.settings.ttl * 1000 },
                        // rolling: true, // The expiration is reset to the original maxAge, resetting the expiration countdown.
                        store: this.store as Store,
                    })
                );
                this.server.app.use(passport.initialize());
                this.server.app.use(passport.session());
                this.server.app.use(flash());

                this.server.app.post('/login', (req, res, next) => {
                    let redirect = '/';
                    req.body = req.body || {};
                    const isDev = req.url.includes('?dev&');

                    const origin = req.body.origin || '?href=%2F';
                    if (origin) {
                        const parts = origin.match(/href=(.+)$/);
                        if (parts && parts.length > 1 && parts[1]) {
                            redirect = decodeURIComponent(parts[1]);
                            // if some invalid characters in redirect
                            if (redirect.match(/[^-_a-zA-Z0-9&%?./]/)) {
                                redirect = '/';
                            }
                        } else {
                            // extract pathname
                            redirect = origin.split('?')[0] || '/';
                        }
                    }
                    req.body.password = (req.body.password || '').toString();
                    req.body.username = (req.body.username || '').toString();
                    req.body.stayLoggedIn =
                        req.body.stayloggedin === 'true' ||
                        req.body.stayloggedin === true ||
                        req.body.stayloggedin === 'on';

                    passport.authenticate('local', (err: Error | null, user: string) => {
                        if (err) {
                            this.adapter.log.warn(`Cannot login user: ${err}`);
                            return res.redirect(this.getErrorRedirect(origin));
                        }
                        if (!user) {
                            return res.redirect(this.getErrorRedirect(origin));
                        }
                        req.logIn(user, err => {
                            if (err) {
                                this.adapter.log.warn(`Cannot login user: ${err}`);
                                return res.redirect(this.getErrorRedirect(origin));
                            }

                            if (req.body.stayLoggedIn) {
                                req.session.cookie.httpOnly = true;
                                // https://www.npmjs.com/package/express-session#cookiemaxage-1
                                // Interval in ms
                                req.session.cookie.maxAge =
                                    (this.settings.ttl > ONE_MONTH_SEC ? this.settings.ttl : ONE_MONTH_SEC) * 1000;
                            } else {
                                req.session.cookie.httpOnly = true;
                                // https://www.npmjs.com/package/express-session#cookiemaxage-1
                                // Interval in ms
                                req.session.cookie.maxAge = this.settings.ttl * 1000;
                            }

                            if (isDev) {
                                return res.redirect(`http://127.0.0.1:3000${redirect}`);
                            } else {
                                return res.redirect(redirect);
                            }
                        });
                    })(req, res, next);
                });

                this.server.app.get('/session', (req, res) =>
                    res.json({ expireInSec: Math.round(req.session.cookie.maxAge / 1_000) })
                );

                this.server.app.get('/logout', (req, res) => {
                    const isDev = req.url.includes('?dev');
                    let origin = req.url.split('origin=')[1];
                    if (origin) {
                        const pos = origin.lastIndexOf('/');
                        if (pos !== -1) {
                            origin = origin.substring(0, pos);
                        }
                    }

                    req.logout(() => {
                        if (isDev) {
                            res.redirect('http://127.0.0.1:3000/index.html?login');
                        } else {
                            res.redirect(origin ? origin + this.LOGIN_PAGE : this.LOGIN_PAGE);
                        }
                    });
                });

                // route middleware to make sure a user is logged in
                this.server.app.use((req, res, next) => {
                    // return favicon always
                    if (req.originalUrl.endsWith('favicon.ico')) {
                        res.set('Content-Type', 'image/x-icon');
                        if (this.systemConfig.native.vendor.ico) {
                            // convert base64 to ico
                            const text = this.systemConfig.native.vendor.ico.split(',')[1];
                            return res.send(Buffer.from(text, 'base64'));
                        } else {
                            return res.send(fs.readFileSync(path.join(this.wwwDir, 'favicon.ico')));
                        }
                    } else if (/admin\.\d+\/login-bg\.png(\?.*)?$/.test(req.originalUrl)) {
                        // Read the names of files for gong
                        return this.adapter.readFile(this.adapter.namespace, 'login-bg.png', null, (err, file) => {
                            if (!err && file) {
                                res.set('Content-Type', 'image/png');
                                res.status(200).send(file);
                            } else {
                                res.status(404).send(get404Page());
                            }
                        });
                    } else if (!req.isAuthenticated()) {
                        if (/^\/login\//.test(req.originalUrl) || /\.ico(\?.*)?$/.test(req.originalUrl)) {
                            return next();
                        } else {
                            const pathName = req.url.split('?')[0];
                            // protect all paths except
                            this.unprotectedFiles =
                                this.unprotectedFiles ||
                                fs.readdirSync(this.wwwDir).map(file => {
                                    const stat = fs.lstatSync(path.join(this.wwwDir, file));
                                    return { name: file, isDir: stat.isDirectory() };
                                });
                            if (
                                pathName &&
                                pathName !== '/' &&
                                !this.unprotectedFiles.find(file =>
                                    file.isDir ? pathName.startsWith(`/${file.name}/`) : `/${file.name}` === pathName
                                )
                            ) {
                                res.redirect(`${this.LOGIN_PAGE}&href=${encodeURIComponent(req.originalUrl)}`);
                            } else {
                                return next();
                            }
                        }
                    } else {
                        return next();
                    }
                });
            } else {
                this.server.app.get('/logout', (req, res) => res.redirect('/'));
            }

            this.server.app.get('/iobroker_check.html', (req, res) => res.send('ioBroker'));

            this.server.app.get('/validate_config/*', async (req, res) => {
                const adapterName = req.url.split('/').pop();

                await this.validateJsonConfig(adapterName.toLowerCase());

                res.status(200).send('validated');
            });

            this.server.app.get('/zip/*', (req, res) => {
                const parts = req.url.split('/');
                const filename = parts.pop();
                let hostname = parts.pop();
                // backwards compatibility with JavaScript < 3.5.5
                if (hostname === 'zip') {
                    hostname = `system.host.${this.adapter.host}`;
                }

                // @ts-expect-error TODO: binary states have been removed
                if (this.adapter.getBinaryState) {
                    // @ts-expect-error TODO: binary states have been removed
                    this.adapter.getBinaryState(`${hostname}.zip.${filename}`, (err, buff) => {
                        if (err) {
                            res.status(500).send(escapeHtml(typeof err === 'string' ? err : JSON.stringify(err)));
                        } else {
                            if (!buff) {
                                res.status(404).send(get404Page(escapeHtml(`File ${filename}.zip not found`)));
                            } else {
                                // remove file
                                // @ts-expect-error TODO: binary states have been removed
                                if (this.adapter.delBinaryState) {
                                    // @ts-expect-error TODO: binary states have been removed
                                    this.adapter.delBinaryState(`system.host.${this.adapter.host}.zip.${filename}`);
                                }
                                res.set('Content-Type', 'application/zip');
                                res.send(buff);
                            }
                        }
                    });
                } else {
                    res.status(501).send('Cannot get binary states');
                }
            });

            // send log files
            this.server.app.get('/log/*', (req, res) => {
                let parts = decodeURIComponent(req.url).split('/');
                if (parts.length === 5) {
                    parts.shift();
                    parts.shift();
                    const [host, transport] = parts;
                    parts = parts.splice(2);
                    const filename = parts.join('/');
                    this.adapter.sendToHost(`system.host.${host}`, 'getLogFile', { filename, transport }, result => {
                        // @ts-expect-error fix later
                        if (!result || result.error) {
                            res.status(404).send(get404Page(`File ${escapeHtml(filename)} not found`));
                        } else {
                            // @ts-expect-error fix later
                            if (result.gz) {
                                // @ts-expect-error fix later
                                if (result.size > 1024 * 1024) {
                                    res.header('Content-Type', 'application/gzip');
                                    // @ts-expect-error fix later
                                    res.send(result.data);
                                } else {
                                    try {
                                        // @ts-expect-error fix later
                                        this.unzipFile(filename, result.data, res);
                                    } catch (e) {
                                        res.header('Content-Type', 'application/gzip');
                                        // @ts-expect-error fix later
                                        res.send(result.data);
                                        this.adapter.log.error(`Cannot extract file ${filename}: ${e}`);
                                    }
                                }
                                // @ts-expect-error fix later
                            } else if (result.data === undefined || result.data === null) {
                                res.status(404).send(get404Page(`File ${escapeHtml(filename)} not found`));
                                // @ts-expect-error fix later
                            } else if (result.size > 2 * 1024 * 1024) {
                                res.header('Content-Type', 'text/plain');
                                // @ts-expect-error fix later
                                res.send(result.data);
                            } else {
                                res.header('Content-Type', 'text/html');
                                // @ts-expect-error fix later
                                res.send(this.decorateLogFile(filename, result.data));
                            }
                        }
                    });
                } else {
                    parts = parts.splice(2);
                    const transport = parts.shift();
                    let filename = parts.join('/');
                    const config = this.adapter.systemConfig;

                    // detect file log
                    if (transport && config?.log?.transport) {
                        if (transport in config.log.transport && config.log.transport[transport].type === 'file') {
                            let logFolder;
                            if (config.log.transport[transport].filename) {
                                parts = config.log.transport[transport].filename.replace(/\\/g, '/').split('/');
                                parts.pop();
                                logFolder = path.normalize(parts.join('/'));
                            } else {
                                logFolder = path.join(process.cwd(), 'log');
                            }

                            if (logFolder[0] !== '/' && logFolder[0] !== '\\' && !logFolder.match(/^[a-zA-Z]:/)) {
                                const _logFolder = path
                                    .normalize(path.join(`${this.baseDir}/../../`, logFolder).replace(/\\/g, '/'))
                                    .replace(/\\/g, '/');
                                if (!fs.existsSync(_logFolder)) {
                                    logFolder = path
                                        .normalize(path.join(`${this.baseDir}/../`, logFolder).replace(/\\/g, '/'))
                                        .replace(/\\/g, '/');
                                } else {
                                    logFolder = _logFolder;
                                }
                            }

                            filename = path
                                .normalize(path.join(logFolder, filename).replace(/\\/g, '/'))
                                .replace(/\\/g, '/');

                            if (filename.startsWith(logFolder) && fs.existsSync(filename)) {
                                const stat = fs.lstatSync(filename);
                                // if file is archive
                                if (filename.toLowerCase().endsWith('.gz')) {
                                    // try to not process to big files
                                    if (stat.size > 1024 * 1024 /* || !fs.existsSync('/dev/null')*/) {
                                        res.header('Content-Type', 'application/gzip');
                                        res.sendFile(filename);
                                    } else {
                                        try {
                                            this.unzipFile(
                                                filename,
                                                fs.readFileSync(filename, { encoding: 'utf-8' }),
                                                res
                                            );
                                        } catch (e) {
                                            res.header('Content-Type', 'application/gzip');
                                            res.sendFile(filename);
                                            this.adapter.log.error(`Cannot extract file ${filename}: ${e}`);
                                        }
                                    }
                                } else if (stat.size > 2 * 1024 * 1024) {
                                    res.header('Content-Type', 'text/plain');
                                    res.sendFile(filename);
                                } else {
                                    res.header('Content-Type', 'text/html');
                                    res.send(this.decorateLogFile(filename));
                                }

                                return;
                            }
                        }
                    }

                    res.status(404).send(get404Page(`File ${escapeHtml(filename)} not found`));
                }
            });

            const appOptions: Record<string, unknown> = {};
            if (this.settings.cache) {
                appOptions.maxAge = 30_758_400_000;
            }

            if (this.settings.tmpPathAllow && this.settings.tmpPath) {
                this.server.app.use('/tmp/', express.static(this.settings.tmpPath, { maxAge: 0 }));
                this.server.app.use(
                    fileUpload({
                        useTempFiles: true,
                        tempFileDir: this.settings.tmpPath,
                    })
                );
                this.server.app.post('/upload', (req, res) => {
                    if (!req.files) {
                        return res.status(400).send('No files were uploaded.');
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
                            return res.status(500).send('File is too big. (Max 600MB)');
                        }
                        // Use the mv() method to place the file somewhere on your server
                        myFile.mv(`${this.settings.tmpPath}/restore.iob`, err => {
                            if (err) {
                                res.status(500).send(escapeHtml(typeof err === 'string' ? err : JSON.stringify(err)));
                            } else {
                                res.send('File uploaded!');
                            }
                        });
                    } else {
                        return res.status(500).send('File not uploaded');
                    }
                });
            }

            if (!fs.existsSync(this.wwwDir)) {
                this.server.app.use('/', (req, res) =>
                    res.send(
                        'This adapter cannot be installed directly from GitHub.<br>You must install it from npm.<br>Write for that <i>"npm install iobroker.admin"</i> in according directory.'
                    )
                );
            } else {
                this.server.app.get('/empty.html', (req, res) => res.send(''));

                this.server.app.get('/index.html', (req, res) => {
                    this.indexHTML = this.indexHTML || this.prepareIndex();
                    res.header('Content-Type', 'text/html');
                    res.status(200).send(this.indexHTML);
                });
                this.server.app.get('/', (req, res) => {
                    this.indexHTML = this.indexHTML || this.prepareIndex();
                    res.header('Content-Type', 'text/html');
                    res.status(200).send(this.indexHTML);
                });

                this.server.app.use('/', express.static(this.wwwDir, appOptions));
            }

            // reverse proxy with url rewrite for couchdb attachments in <adapter-name>.admin
            this.server.app.use('/adapter/', (req, res) => {
                // Example: /example/?0&attr=1
                let url;
                try {
                    url = decodeURIComponent(req.url);
                } catch {
                    // ignore
                    url = req.url;
                }

                // add index.html
                url = url.replace(/\/($|\?|#)/, '/index.html$1');

                // Read config files for admin from /adapters/admin/admin/...
                if (url.startsWith(`/${this.adapter.name}/`)) {
                    url = url.replace(`/${this.adapter.name}/`, this.dirName);
                    // important: Linux does not normalize "\" but fs.readFile accepts it as '/'
                    url = path.normalize(url.replace(/\?.*/, '').replace(/\\/g, '/')).replace(/\\/g, '/');

                    if (url.startsWith(this.dirName)) {
                        try {
                            if (fs.existsSync(url)) {
                                // @ts-expect-error types may be wrong
                                res.contentType(mime.getType(url) || 'text/javascript');
                                fs.createReadStream(url).pipe(res);
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

                url = url.split('/');
                // Skip first /
                url.shift();
                // Get ID
                const adapterName = url.shift();
                const id = `${adapterName}.admin`;
                url = url.join('/');
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
                            return res.status(403).send('You are not allowed to access this page');
                        }
                    }
                    if (url === 'tab.html' || url === 'tab_m.html') {
                        const anyTabs = this.settings.accessAllowedTabs.includes(`${adapterName}.${_instance}`);
                        if (!anyTabs) {
                            res.contentType('text/html');
                            return res.status(403).send('You are not allowed to access this page');
                        }
                    }
                }

                // this.adapter.readFile is sanitized
                this.adapter.readFile(id, url, null, (err, buffer, mimeType) => {
                    if (!buffer || err) {
                        res.contentType('text/html');
                        res.status(404).send(get404Page(`File ${escapeHtml(url)} not found`));
                    } else {
                        if (mimeType) {
                            res.contentType(mimeType['content-type'] || mimeType);
                        } else {
                            try {
                                // @ts-expect-error types might be wrong
                                const _mimeType = mime.getType(url);
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
            this.server.app.use('/files/', async (req, res) => {
                // Example: /vis.0/main/img/image.png
                let url;
                try {
                    url = decodeURIComponent(req.url);
                } catch {
                    // ignore
                    url = req.url;
                }

                // add index.html
                url = url.replace(/\/($|\?|#)/, '/index.html$1');

                url = url.split('/');
                // Skip first /files
                url.shift();
                // Get ID
                const adapterName = url.shift();
                url = url.join('/');
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
                            return res.status(403).send('You are not allowed to access this page');
                        }
                    }
                    if (url === 'tab.html' || url === 'tab_m.html') {
                        const anyTabs = this.settings.accessAllowedTabs.includes(`${adapterName}.${_instance}`);
                        if (!anyTabs) {
                            res.contentType('text/html');
                            return res.status(403).send('You are not allowed to access this page');
                        }
                    }
                }

                try {
                    if (await this.adapter.fileExists(adapterName, url)) {
                        const { mimeType, file } = await this.adapter.readFileAsync(adapterName, url);

                        if (mimeType) {
                            res.contentType(mimeType['content-type'] || mimeType);
                        } else {
                            res.contentType('text/javascript');
                        }

                        if (adapterName === this.adapter.namespace && url.startsWith('zip/')) {
                            // special files, that can be read-only one time
                            this.adapter.unlink(adapterName, url, () => {});
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
            this.server.app.use('/oauth2_callbacks/', (req, res) => {
                // extract instance from "http://localhost:8081/oauth2_callbacks/netatmo.0/?state=ABC&code=CDE"
                const [_instance, params] = req.url.split('?');
                const instance = _instance.replace(/^\//, '').replace(/\/$/, ''); // remove last and first "/" in "/netatmo.0/"
                const query: Record<string, unknown> = {};
                params.split('&').forEach(param => {
                    const [key, value] = param.split('=');
                    query[key] = value === undefined ? true : value;
                    if (Number.isFinite(query[key])) {
                        // @ts-expect-error fix later
                        query[key] = parseFloat(query[key]);
                    } else if (query[key] === 'true') {
                        query[key] = true;
                    } else if (query[key] === 'false') {
                        query[key] = false;
                    }
                });

                if ((query.timeout as number) > 30_000) {
                    query.timeout = 30_000;
                }

                /** @type {NodeJS.Timeout | null} */
                let timeout = setTimeout(
                    () => {
                        if (timeout) {
                            timeout = null;
                            let text = fs.readFileSync(`${this.baseDir}/public/oauthError.html`).toString('utf8');
                            text = text.replace('%LANGUAGE%', this.systemLanguage);
                            text = text.replace('%ERROR%', 'TIMEOUT');
                            res.setHeader('Content-Type', 'text/html');
                            res.status(408).send(text);
                        }
                    },
                    (query.timeout as number) || 5_000
                );

                this.adapter.sendTo(instance, 'oauth2Callback', query, result => {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                        // @ts-expect-error fix later
                        if (result?.error) {
                            let text = fs.readFileSync(`${this.baseDir}/public/oauthError.html`).toString('utf8');
                            text = text.replace('%LANGUAGE%', this.systemLanguage);
                            // @ts-expect-error fix later
                            text = text.replace('%ERROR%', result.error);
                            res.setHeader('Content-Type', 'text/html');
                            res.status(500).send(text);
                        } else {
                            let text = fs.readFileSync(`${this.baseDir}/public/oauthSuccess.html`).toString('utf8');
                            text = text.replace('%LANGUAGE%', this.systemLanguage);
                            // @ts-expect-error fix later
                            text = text.replace('%MESSAGE%', result ? result.result || '' : '');
                            res.setHeader('Content-Type', 'text/html');
                            res.status(200).send(text);
                        }
                    }
                });
            });

            // 404 handler
            this.server.app.use((req, res) =>
                res.status(404).send(get404Page(`File ${escapeHtml(req.url)} not found`))
            );

            try {
                const webserver = new IoBWebServer.WebServer({
                    app: this.server.app,
                    adapter: this.adapter,
                    secure: this.settings.secure,
                });
                this.server.server = await webserver.init();
            } catch (err) {
                this.adapter.log.error(`Cannot create web-server: ${err}`);
                if (this.adapter.terminate) {
                    this.adapter.terminate(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                } else {
                    process.exit(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                }
                return;
            }
            if (!this.server.server) {
                this.adapter.log.error(`Cannot create web-server`);
                if (this.adapter.terminate) {
                    this.adapter.terminate(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                } else {
                    process.exit(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                }
                return;
            }

            // @ts-expect-error fix later
            this.server.server.__server = this.server;
        } else {
            this.adapter.log.error('port missing');
            if (this.adapter.terminate) {
                this.adapter.terminate('port missing', utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
            } else {
                process.exit(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
            }
        }

        this.adapter
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
                                    `You can call in shell following scrip to allow it for node.js: "iobroker fix"`
                            );
                        } else {
                            this.adapter.log.error(
                                `Cannot start server on ${this.settings.bind || '0.0.0.0'}:${serverPort}: ${e}`
                            );
                        }

                        if (!serverListening) {
                            if (this.adapter.terminate) {
                                this.adapter.terminate(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                            } else {
                                process.exit(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
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
                                () => {
                                    this.adapter.setState('info.connection', true, true);
                                    serverListening = true;
                                    this.adapter.log.info(
                                        `http${this.settings.secure ? 's' : ''} server listening on port ${port}`
                                    );
                                    this.adapter.log.info(
                                        `Use link "http${
                                            this.settings.secure ? 's' : ''
                                        }://127.0.0.1:${port}" to configure.`
                                    );

                                    if (!this.adapter.config.doNotCheckPublicIP && !this.adapter.config.auth) {
                                        this.checkTimeout = this.adapter.setTimeout(async () => {
                                            this.checkTimeout = null;
                                            try {
                                                await IoBWebServer.checkPublicIP(
                                                    this.settings.port,
                                                    'ioBroker',
                                                    '/iobroker_check.html'
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
                                                    (/* result */) => {
                                                        /* ignore */
                                                    }
                                                );

                                                this.adapter.log.error(e.toString());
                                            }
                                        }, 1000);
                                    }
                                }
                            );

                            if (typeof this.onReady === 'function') {
                                this.onReady(this.server.server, this.store, this.adapter);
                            }
                        }
                    );
                }
            });
    }
}

export default Web;
