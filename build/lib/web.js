"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_core_1 = require("@iobroker/adapter-core");
const webserver_1 = require("@iobroker/webserver");
const express = require("express");
const node_fs_1 = require("node:fs");
const node_util_1 = require("node:util");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const node_stream_1 = require("node:stream");
const compression = require("compression");
const mime_1 = require("mime");
const node_zlib_1 = require("node:zlib");
const archiver = require("archiver");
const axios_1 = require("axios");
const ajv_1 = require("ajv");
const json5_1 = require("json5");
const fileUpload = require("express-fileupload");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const iobroker_mcp_1 = require("iobroker.mcp");
let AdapterStore;
/** Content of a socket-io file */
let socketIoFile;
/** UUID of the installation */
let uuid;
const page404 = (0, node_fs_1.readFileSync)(`${__dirname}/../../public/404.html`).toString('utf8');
const logTemplate = (0, node_fs_1.readFileSync)(`${__dirname}/../../public/logTemplate.html`).toString('utf8');
// const FORBIDDEN_CHARS = /[\]\[*,;'"`<>\\\s?]/g; // with space
// copied from here: https://github.com/component/escape-html/blob/master/index.js
const matchHtmlRegExp = /["'&<>]/;
function escapeHtml(string) {
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
function get404Page(customText) {
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
async function readFolderRecursive(adapter, adapterName, url) {
    const filesOfDir = [];
    const fileMetas = await adapter.readDirAsync(adapterName, url);
    for (const fileMeta of fileMetas) {
        if (!fileMeta.isDir) {
            const file = await adapter.readFileAsync(adapterName, `${url}/${fileMeta.file}`);
            if (file.file instanceof Buffer) {
                filesOfDir.push({ name: url ? `${url}/${fileMeta.file}` : fileMeta.file, file: file.file });
            }
            else {
                filesOfDir.push({
                    name: url ? `${url}/${fileMeta.file}` : fileMeta.file,
                    file: Buffer.from(file.file.toString(), 'utf-8'),
                });
            }
        }
        else {
            filesOfDir.push(...(await readFolderRecursive(adapter, adapterName, `${url}/${fileMeta.file}`)));
        }
    }
    return filesOfDir;
}
function MemoryWriteStream() {
    node_stream_1.Transform.call(this);
    this._chunks = [];
    this._transform = (chunk, _enc, cb) => {
        this._chunks.push(chunk);
        cb();
    };
    this.collect = () => {
        const result = Buffer.concat(this._chunks);
        this._chunks = [];
        return result;
    };
}
(0, node_util_1.inherits)(MemoryWriteStream, node_stream_1.Transform);
/** Webserver class */
class Web {
    server = {
        app: null,
        server: null,
    };
    LOGIN_PAGE = '/index.html?login';
    /** URL to the JSON config schema */
    JSON_CONFIG_SCHEMA_URL = 
    // 'https://raw.githubusercontent.com/ioBroker/ioBroker.admin/master/packages/jsonConfig/schemas/jsonConfig.json';
    'https://raw.githubusercontent.com/ioBroker/json-config/main/schemas/jsonConfig.json';
    store = null;
    indexHTML;
    baseDir = (0, node_path_1.join)(__dirname, '..', '..');
    dirName = (0, node_path_1.normalize)(`${this.baseDir}/admin/`.replace(/\\/g, '/')).replace(/\\/g, '/');
    unprotectedFiles;
    systemConfig;
    // todo delete after React will be main
    wwwDir = (0, node_path_1.join)(this.baseDir, 'adminWww');
    settings;
    adapter;
    options;
    onReady;
    systemLanguage;
    checkTimeout;
    oauth2Model;
    mcpServer = null;
    /**
     * Create a new instance of Web
     *
     * @param settings settings of the adapter
     * @param adapter instance of the adapter
     * @param onReady callback when the server is ready
     * @param options options for the webserver
     */
    constructor(settings, adapter, onReady, options) {
        this.settings = settings;
        this.adapter = adapter;
        this.onReady = onReady;
        this.options = options;
        this.systemLanguage = this.options?.systemLanguage || 'en';
        void this.#init();
    }
    decorateLogFile(fileName, text) {
        const log = text || (0, node_fs_1.readFileSync)(fileName).toString();
        return logTemplate.replace('@@title@@', (0, node_path_1.parse)(fileName).name).replace('@@body@@', log);
    }
    setLanguage(lang) {
        this.systemLanguage = lang;
    }
    close() {
        if (this.checkTimeout) {
            this.adapter.clearTimeout(this.checkTimeout);
            this.checkTimeout = null;
        }
        this.mcpServer?.unload();
        void this.adapter.setState('info.connection', false, true);
        this.server.server?.close();
    }
    processMessage(msg) {
        return this.oauth2Model?.processMessage(msg);
    }
    async prepareIndex(index) {
        let template = (0, node_fs_1.readFileSync)((0, node_path_1.join)(this.wwwDir, index)).toString('utf8');
        const m = template.match(/(["']?@@\w+@@["']?)/g);
        for (let pattern of m) {
            pattern = pattern.replace(/@/g, '').replace(/'/g, '').replace(/"/g, '');
            if (pattern === 'disableDataReporting') {
                // read sentry state
                const state = await this.adapter.getStateAsync(`system.adapter.${this.adapter.namespace}.plugins.sentry.enabled`);
                template = template.replace(/['"]@@disableDataReporting@@["']/g, state?.val ? 'true' : 'false');
            }
            else if (pattern === 'loginBackgroundImage') {
                if (this.adapter.config.loginBackgroundImage) {
                    template = template.replace('@@loginBackgroundImage@@', `files/${this.adapter.namespace}/login-bg.png`);
                }
                else {
                    template = template.replace('@@loginBackgroundImage@@', '');
                }
            }
            else if (pattern === 'loginBackgroundColor') {
                template = template.replace('@@loginBackgroundColor@@', this.adapter.config.loginBackgroundColor || 'inherit');
            }
            else if (pattern === 'loadingBackgroundImage') {
                if (this.adapter.config.loadingBackgroundImage) {
                    template = template.replace('@@loadingBackgroundImage@@', `files/${this.adapter.namespace}/loading-bg.png`);
                }
                else {
                    template = template.replace('@@loadingBackgroundImage@@', '');
                }
            }
            else if (pattern === 'loadingBackgroundColor') {
                template = template.replace('@@loadingBackgroundColor@@', this.adapter.config.loadingBackgroundColor || '');
            }
            else if (pattern === 'vendorPrefix') {
                template = template.replace(`@@vendorPrefix@@`, this.systemConfig.native.vendor.uuidPrefix || (uuid.length > 36 ? uuid.substring(0, 2) : ''));
            }
            else if (pattern === 'loginMotto') {
                template = template.replace(`@@loginMotto@@`, this.systemConfig.native.vendor.admin.login.motto || this.adapter.config.loginMotto || '');
            }
            else if (pattern === 'loginLogo') {
                template = template.replace(`@@loginLogo@@`, this.systemConfig.native.vendor.icon || '');
            }
            else if (pattern === 'loginLink') {
                template = template.replace(`@@loginLink@@`, this.systemConfig.native.vendor.admin.login.link || '');
            }
            else if (pattern === 'loginTitle') {
                template = template.replace(`@@loginTitle@@`, this.systemConfig.native.vendor.admin.login.title || '');
            }
            else {
                template = template.replace(`@@${pattern}@@`, this.adapter.config[pattern] !== undefined
                    ? this.adapter.config[pattern]
                    : '');
            }
        }
        return template;
    }
    getInfoJs() {
        const result = [`window.sysLang = "${this.systemLanguage}";`];
        if (uuid?.length === 38) {
            result.push(`window.vendorPrefix = "${uuid.substring(0, 2)}";`);
        }
        if (this.adapter.config.loadingBackgroundColor) {
            result.push(`window.loadingBackgroundColor = "${this.adapter.config.loadingBackgroundColor}";`);
        }
        if (this.adapter.config.loadingBackgroundImage) {
            result.push(`window.loadingBackgroundImage = "${this.adapter.config.loadingBackgroundImage}";`);
        }
        return result.join('\n');
    }
    getErrorRedirect(origin) {
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
    async validateJsonConfig(adapterName) {
        let schema = null;
        try {
            this.adapter.log.debug(`retrieving json schema from ${this.JSON_CONFIG_SCHEMA_URL}`);
            const schemaRes = await axios_1.default.get(this.JSON_CONFIG_SCHEMA_URL);
            schema = schemaRes.data;
        }
        catch (e) {
            this.adapter.log.debug(`Could not get jsonConfig schema: ${e.message}`);
            return;
        }
        const res = await this.adapter.getForeignObjectAsync(`system.adapter.${adapterName}`);
        if (res?.common.adminUI?.config === 'json') {
            try {
                const ajv = new ajv_1.Ajv({
                    allErrors: false,
                    strict: 'log',
                });
                const adapterPath = (0, node_path_1.dirname)(require.resolve(`iobroker.${adapterName}/package.json`));
                const jsonConfPath = (0, node_path_1.join)(adapterPath, 'admin', 'jsonConfig.json');
                const json5ConfPath = (0, node_path_1.join)(adapterPath, 'admin', 'jsonConfig.json5');
                let jsonConf;
                if ((0, node_fs_1.existsSync)(jsonConfPath)) {
                    jsonConf = (0, node_fs_1.readFileSync)(jsonConfPath, {
                        encoding: 'utf-8',
                    });
                }
                else {
                    jsonConf = (0, node_fs_1.readFileSync)(json5ConfPath, {
                        encoding: 'utf-8',
                    });
                }
                const validate = ajv.compile(schema);
                const valid = validate((0, json5_1.parse)(jsonConf));
                if (!valid) {
                    this.adapter.log.warn(`${adapterName} has an invalid jsonConfig: ${JSON.stringify(validate.errors)}`);
                }
            }
            catch (e) {
                this.adapter.log.debug(`Error validating schema of ${adapterName}: ${e.message}`);
            }
        }
    }
    unzipFile(fileName, data, res) {
        // extract the file
        try {
            const text = (0, node_zlib_1.gunzipSync)(data).toString('utf8');
            if (text.length > 2 * 1024 * 1024) {
                res.header('Content-Type', 'text/plain');
                res.send(text);
            }
            else {
                res.header('Content-Type', 'text/html');
                res.send(this.decorateLogFile(fileName, text));
            }
        }
        catch (e) {
            res.header('Content-Type', 'application/gzip');
            res.send(data);
            this.adapter.log.error(`Cannot extract file ${fileName}: ${e}`);
        }
    }
    resetIndexHtml() {
        this.indexHTML = '';
    }
    /**
     * Initialize the server
     */
    async #init() {
        if (this.settings.port) {
            this.server.app = express();
            this.server.app.use(compression());
            this.settings.ttl = Math.round(this.settings.ttl) || 3_600;
            this.settings.accessAllowedConfigs ||= [];
            this.settings.accessAllowedTabs ||= [];
            this.server.app.disable('x-powered-by');
            // enable use of i-frames together with HTTPS
            this.server.app.get('/*any', (_req, res, next) => {
                res.header('X-Frame-Options', 'SAMEORIGIN');
                next(); // http://expressjs.com/guide.html#passing-route control
            });
            // ONLY for DEBUG
            /*server.app.use((req: Request, res: Response, next: NextFunction): void => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                next();
            });*/
            this.server.app.get('/version', (_req, res) => {
                res.status(200).send(this.adapter.version);
            });
            // replace socket.io
            this.server.app.use((req, res, next) => {
                const url = req.url.split('?')[0];
                // return favicon always
                if (url === '/auth') {
                    // User can ask server if authentication enabled
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ auth: this.settings.auth });
                }
                else if (url === '/favicon.ico') {
                    res.set('Content-Type', 'image/x-icon');
                    if (this.systemConfig.native.vendor.ico) {
                        // convert base64 to ico
                        const text = this.systemConfig.native.vendor.ico.split(',')[1];
                        res.send(Buffer.from(text, 'base64'));
                        return;
                    }
                    res.send((0, node_fs_1.readFileSync)((0, node_path_1.join)(this.wwwDir, 'favicon.ico')));
                    return;
                }
                else if (socketIoFile !== false && url.includes('socket.io.js')) {
                    if (socketIoFile) {
                        res.contentType('text/javascript');
                        res.status(200).send(socketIoFile);
                        return;
                    }
                    socketIoFile = (0, node_fs_1.readFileSync)((0, node_path_1.join)(this.wwwDir, 'lib', 'js', 'socket.io.js'), {
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
            this.server.app.get(/.*\/_socket\/info\.js/, (_req, res) => {
                res.set('Content-Type', 'application/javascript');
                res.status(200).send(this.getInfoJs());
            });
            if (this.settings.auth) {
                AdapterStore = adapter_core_1.commonTools.session(session, this.settings.ttl);
                this.store = new AdapterStore({ adapter: this.adapter });
                this.server.app.use(cookieParser());
                this.server.app.use(bodyParser.urlencoded({ extended: true }));
                this.server.app.use(bodyParser.json());
                this.oauth2Model = (0, webserver_1.createOAuth2Server)(this.adapter, {
                    app: this.server.app,
                    secure: this.settings.secure,
                    accessLifetime: this.settings.ttl,
                    refreshLifetime: 60 * 60 * 24 * 7, // 1 week (Maybe adjustable?)
                    noBasicAuth: this.settings.noBasicAuth,
                    loginPage: (req) => {
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
                this.server.app.get('/session', (req, res) => {
                    if (req.headers.cookie) {
                        const cookies = req.headers.cookie.split(';').find(c => c.trim().startsWith('access_token='));
                        let tokenCookie = cookies?.split('=')[1];
                        if (!tokenCookie && req.headers.authorization?.startsWith('Bearer ')) {
                            tokenCookie = req.headers.authorization.split(' ')[1];
                        }
                        else if (!tokenCookie && req.query?.token) {
                            tokenCookie = req.query.token;
                        }
                        if (tokenCookie) {
                            void this.adapter.getSession(`a:${tokenCookie[1]}`, (token) => {
                                if (!token?.user) {
                                    res.json({ expireInSec: 0 });
                                }
                                else {
                                    res.json({ expireInSec: Math.round((token.aExp - Date.now()) / 1000) });
                                }
                            });
                            return;
                        }
                    }
                    res.json({ error: 'Cannot find session' });
                });
                this.server.app.get('/logout', (req, res) => {
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
                    }
                    else {
                        res.redirect(origin ? origin + this.LOGIN_PAGE : this.LOGIN_PAGE);
                    }
                });
                // route middleware to make sure a user is logged in
                this.server.app.use((req, res, next) => {
                    // return favicon always
                    if (req.url === '/favicon.ico') {
                        res.set('Content-Type', 'image/x-icon');
                        if (this.systemConfig.native.vendor.ico) {
                            // convert base64 to ico
                            const text = this.systemConfig.native.vendor.ico.split(',')[1];
                            res.send(Buffer.from(text, 'base64'));
                            return;
                        }
                        res.send((0, node_fs_1.readFileSync)((0, node_path_1.join)(this.wwwDir, 'favicon.ico')));
                        return;
                    }
                    if (/admin\.\d+\/login-bg\.png(\?.*)?$/.test(req.originalUrl)) {
                        // Read the names of files for gong
                        this.adapter.readFile(this.adapter.namespace, 'login-bg.png', null, (err, file) => {
                            if (!err && file) {
                                res.set('Content-Type', 'image/png');
                                res.status(200).send(file);
                            }
                            else {
                                res.status(404).send(get404Page());
                            }
                        });
                        return;
                    }
                    if ((req.isAuthenticated && !req.isAuthenticated()) || (!req.isAuthenticated && !req.user)) {
                        const pathName = req.url.split('?')[0];
                        if (pathName.startsWith('/login/') ||
                            pathName.endsWith('.ico') ||
                            pathName.endsWith('manifest.json')) {
                            return next();
                        }
                        // protect all paths except
                        this.unprotectedFiles ||= (0, node_fs_1.readdirSync)(this.wwwDir).map(file => {
                            const stat = (0, node_fs_1.lstatSync)((0, node_path_1.join)(this.wwwDir, file));
                            return { name: file, isDir: stat.isDirectory() };
                        });
                        if (pathName &&
                            pathName !== '/' &&
                            !this.unprotectedFiles.find(file => file.isDir ? pathName.startsWith(`/${file.name}/`) : `/${file.name}` === pathName)) {
                            res.redirect(`${this.LOGIN_PAGE}&href=${encodeURIComponent(req.originalUrl)}`);
                        }
                        else {
                            next();
                            return;
                        }
                    }
                    else {
                        next();
                        return;
                    }
                });
            }
            else {
                this.server.app.get('/logout', (_req, res) => res.redirect('/'));
            }
            this.server.app.get('/iobroker_check.html', (_req, res) => {
                res.status(200).send('ioBroker');
            });
            this.server.app.get('/validate_config/*any', async (req, res) => {
                const adapterName = req.url.split('/').pop();
                await this.validateJsonConfig(adapterName.toLowerCase());
                res.status(200).send('validated');
            });
            // send log files
            this.server.app.get('/log/*any', (req, res) => {
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
                        res.status(404).send(get404Page(`File ${escapeHtml(fileName)} not found. Do not use relative paths!`));
                        return;
                    }
                    this.adapter.sendToHost(`system.host.${host}`, 'getLogFile', { filename: fileName, transport }, result => {
                        const _result = result;
                        if (!_result || _result.error) {
                            if (_result.error) {
                                this.adapter.log.warn(`Cannot read log file ${fileName}: ${_result.error}`);
                            }
                            res.status(404).send(get404Page(`File ${escapeHtml(fileName)} not found`));
                        }
                        else {
                            if (_result.gz) {
                                if (_result.size > 1024 * 1024) {
                                    res.header('Content-Type', 'application/gzip');
                                    res.send(_result.data);
                                }
                                else {
                                    try {
                                        this.unzipFile(fileName, _result.data, res);
                                    }
                                    catch (e) {
                                        res.header('Content-Type', 'application/gzip');
                                        res.send(_result.data);
                                        this.adapter.log.error(`Cannot extract file ${fileName}: ${e}`);
                                    }
                                }
                            }
                            else if (_result.data === undefined || _result.data === null) {
                                res.status(404).send(get404Page(`File ${escapeHtml(fileName)} not found`));
                            }
                            else if (_result.size > 2 * 1024 * 1024) {
                                res.header('Content-Type', 'text/plain');
                                res.send(_result.data);
                            }
                            else {
                                res.header('Content-Type', 'text/html');
                                res.send(this.decorateLogFile(fileName, _result.data));
                            }
                        }
                    });
                }
                else {
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
                                logFolder = (0, node_path_1.normalize)(parts.join('/'));
                            }
                            else {
                                logFolder = (0, node_path_1.join)(process.cwd(), 'log');
                            }
                            if (logFolder[0] !== '/' && logFolder[0] !== '\\' && !logFolder.match(/^[a-zA-Z]:/)) {
                                const _logFolder = (0, node_path_1.normalize)((0, node_path_1.join)(`${this.baseDir}/../../`, logFolder).replace(/\\/g, '/')).replace(/\\/g, '/');
                                if (!(0, node_fs_1.existsSync)(_logFolder)) {
                                    logFolder = (0, node_path_1.normalize)((0, node_path_1.join)(`${this.baseDir}/../`, logFolder).replace(/\\/g, '/')).replace(/\\/g, '/');
                                }
                                else {
                                    logFolder = _logFolder;
                                }
                            }
                            fileName = (0, node_path_1.normalize)((0, node_path_1.join)(logFolder, fileName).replace(/\\/g, '/')).replace(/\\/g, '/');
                            if (fileName.startsWith(logFolder) && (0, node_fs_1.existsSync)(fileName)) {
                                const stat = (0, node_fs_1.lstatSync)(fileName);
                                // if a file is an archive
                                if (fileName.toLowerCase().endsWith('.gz')) {
                                    // try to not process to big files
                                    if (stat.size > 1024 * 1024 /* || !existsSync('/dev/null')*/) {
                                        res.header('Content-Type', 'application/gzip');
                                        res.sendFile(fileName);
                                    }
                                    else {
                                        try {
                                            this.unzipFile(fileName, (0, node_fs_1.readFileSync)(fileName, { encoding: 'utf-8' }), res);
                                        }
                                        catch (e) {
                                            res.header('Content-Type', 'application/gzip');
                                            res.sendFile(fileName);
                                            this.adapter.log.error(`Cannot extract file ${fileName}: ${e}`);
                                        }
                                    }
                                }
                                else if (stat.size > 2 * 1024 * 1024) {
                                    res.header('Content-Type', 'text/plain');
                                    res.sendFile(fileName);
                                }
                                else {
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
            const appOptions = {};
            if (this.settings.cache) {
                appOptions.maxAge = 30_758_400_000;
            }
            if (this.settings.tmpPathAllow && this.settings.tmpPath) {
                this.server.app.use('/tmp/', express.static(this.settings.tmpPath, { maxAge: 0 }));
                this.server.app.use(fileUpload({
                    useTempFiles: true,
                    tempFileDir: this.settings.tmpPath,
                }));
                this.server.app.post('/upload', (req, res) => {
                    if (!req.files) {
                        res.status(400).send('No files were uploaded.');
                        return;
                    }
                    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
                    let myFile;
                    // take the first non-empty file
                    for (const file of Object.values(req.files)) {
                        if (file) {
                            myFile = file;
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
                            }
                            else {
                                res.header('Content-Type', 'text/plain');
                                res.status(200).send('File uploaded!');
                            }
                        });
                    }
                    else {
                        res.header('Content-Type', 'text/plain');
                        res.status(500).send('File not uploaded');
                    }
                });
            }
            // Endpoint to upload adapter .tgz files for installation
            const adapterUploadTmpDir = this.settings.tmpPath || (0, node_os_1.tmpdir)();
            this.server.app.post('/upload-adapter', fileUpload({ useTempFiles: true, tempFileDir: adapterUploadTmpDir }), (req, res) => {
                if (!req.files) {
                    res.status(400).json({ error: 'No files were uploaded.' });
                    return;
                }
                let myFile;
                for (const file of Object.values(req.files)) {
                    if (file) {
                        myFile = file;
                        break;
                    }
                }
                if (!myFile) {
                    res.status(400).json({ error: 'File not uploaded' });
                    return;
                }
                if (myFile.data && myFile.data.length > 600 * 1024 * 1024) {
                    res.status(413).json({ error: 'File is too big. (Max 600MB)' });
                    return;
                }
                const originalName = myFile.name || 'adapter.tgz';
                if (!originalName.toLowerCase().endsWith('.tgz')) {
                    res.status(400).json({ error: 'Only .tgz files are allowed' });
                    return;
                }
                // Sanitize filename to prevent path traversal
                const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
                const targetPath = `${adapterUploadTmpDir}/${sanitizedName}`;
                myFile.mv(targetPath, err => {
                    if (err) {
                        res.status(500).json({
                            error: escapeHtml(typeof err === 'string' ? err : JSON.stringify(err)),
                        });
                    }
                    else {
                        res.json({ filePath: targetPath, fileName: sanitizedName });
                    }
                });
            });
            if (!(0, node_fs_1.existsSync)(this.wwwDir)) {
                this.server.app.use('/', (_req, res) => {
                    res.header('Content-Type', 'text/plain');
                    res.status(404).send('This adapter cannot be installed directly from GitHub.<br>You must install it from npm.<br>Write for that <i>"npm install iobroker.admin"</i> in according directory.');
                });
            }
            else {
                this.server.app.get('/empty.html', (_req, res) => {
                    res.status(200).send('');
                });
                this.server.app.get('/index.html', async (_req, res) => {
                    this.indexHTML ||= await this.prepareIndex('/index.html');
                    res.header('Content-Type', 'text/html');
                    res.header('Cache-Control', 'no-cache');
                    res.status(200).send(this.indexHTML);
                });
                this.server.app.get('/', async (_req, res) => {
                    this.indexHTML ||= await this.prepareIndex('/index.html');
                    res.header('Content-Type', 'text/html');
                    res.header('Cache-Control', 'no-cache');
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
                }
                catch {
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
                    url = (0, node_path_1.normalize)(url.replace(/\?.*/, '').replace(/\\/g, '/')).replace(/\\/g, '/');
                    if (url.startsWith(this.dirName)) {
                        try {
                            if ((0, node_fs_1.existsSync)(url)) {
                                res.contentType((0, mime_1.getType)(url) || 'text/javascript');
                                (0, node_fs_1.createReadStream)(url).pipe(res);
                            }
                            else {
                                res.status(404).send(get404Page(`File not found`));
                            }
                        }
                        catch (e) {
                            res.status(404).send(get404Page(`File not found: ${escapeHtml(JSON.stringify(e))}`));
                        }
                    }
                    else {
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
                this.adapter.readFile(id, url, null, (err, buffer, mimeType) => {
                    if (!buffer || err) {
                        res.contentType('text/html');
                        res.status(404).send(get404Page(`File ${escapeHtml(url)} not found`));
                    }
                    else {
                        if (mimeType) {
                            res.contentType(mimeType);
                        }
                        else {
                            try {
                                const _mimeType = (0, mime_1.getType)(url);
                                res.contentType(_mimeType || 'text/javascript');
                            }
                            catch {
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
                }
                catch {
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
                        }
                        else {
                            res.contentType(mimeType || 'text/javascript');
                        }
                        if (adapterName === this.adapter.namespace && url.startsWith('zip/')) {
                            // special files, that can be read-only one time
                            this.adapter.unlink(adapterName, url, () => { });
                        }
                        res.send(file);
                    }
                    else {
                        const filesOfDir = await readFolderRecursive(this.adapter, adapterName, url);
                        const archive = archiver('zip', {
                            zlib: { level: 9 },
                        });
                        for (const file of filesOfDir) {
                            archive.append(file.file, { name: file.name });
                        }
                        const zip = [];
                        archive.on('data', chunk => zip.push(chunk));
                        await archive.finalize();
                        res.contentType('application/zip');
                        res.send(Buffer.concat(zip));
                    }
                }
                catch (e) {
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
                const query = {};
                params.split('&').forEach(param => {
                    const [key, value] = param.split('=');
                    query[key] = value === undefined ? true : value;
                    if (Number.isFinite(query[key])) {
                        query[key] = parseFloat(query[key]);
                    }
                    else if (query[key] === 'true') {
                        query[key] = true;
                    }
                    else if (query[key] === 'false') {
                        query[key] = false;
                    }
                });
                if (query.timeout > 30_000) {
                    query.timeout = 30_000;
                }
                let timeout = setTimeout(() => {
                    if (timeout) {
                        timeout = null;
                        let text = (0, node_fs_1.readFileSync)(`${this.baseDir}/public/oauthError.html`).toString('utf8');
                        text = text.replace('%LANGUAGE%', this.systemLanguage);
                        text = text.replace('%ERROR%', 'TIMEOUT');
                        res.setHeader('Content-Type', 'text/html');
                        res.status(408).send(text);
                    }
                }, query.timeout || 5_000);
                this.adapter.sendTo(instance, 'oauth2Callback', query, result => {
                    const _result = result;
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                        if (_result?.error) {
                            let text = (0, node_fs_1.readFileSync)(`${this.baseDir}/public/oauthError.html`).toString('utf8');
                            text = text.replace('%LANGUAGE%', this.systemLanguage);
                            text = text.replace('%ERROR%', _result.error);
                            res.setHeader('Content-Type', 'text/html');
                            res.status(500).send(text);
                        }
                        else {
                            let text = (0, node_fs_1.readFileSync)(`${this.baseDir}/public/oauthSuccess.html`).toString('utf8');
                            text = text.replace('%LANGUAGE%', this.systemLanguage);
                            text = text.replace('%MESSAGE%', _result?.result || '');
                            res.setHeader('Content-Type', 'text/html');
                            res.status(200).send(text);
                        }
                    }
                });
            });
            // 404 handler
            this.server.app.use((req, res) => {
                res.status(404).send(get404Page(`File ${escapeHtml(req.url)} not found`));
            });
            try {
                const webserver = new webserver_1.WebServer({
                    app: this.server.app,
                    adapter: this.adapter,
                    secure: this.settings.secure,
                });
                // @ts-expect-error tbd
                this.server.server = await webserver.init();
            }
            catch (err) {
                this.adapter.log.error(`Cannot create web-server: ${err}`);
                if (this.adapter.terminate) {
                    this.adapter.terminate(adapter_core_1.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                }
                else {
                    process.exit(adapter_core_1.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                }
                return;
            }
            if (!this.server.server) {
                this.adapter.log.error(`Cannot create web-server`);
                if (this.adapter.terminate) {
                    this.adapter.terminate(adapter_core_1.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                }
                else {
                    process.exit(adapter_core_1.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                }
                return;
            }
            this.server.server.__server = this.server;
        }
        else {
            this.adapter.log.error('port missing');
            if (this.adapter.terminate) {
                this.adapter.terminate('port missing', adapter_core_1.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
            }
            else {
                process.exit(adapter_core_1.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
            }
        }
        const systemConfig = await this.adapter.getForeignObjectAsync('system.config');
        this.systemConfig = systemConfig || {};
        this.systemConfig.native ||= {};
        this.systemConfig.native.vendor ||= {};
        this.systemConfig.native.vendor.admin ||= {};
        this.systemConfig.native.vendor.admin.login ||= {};
        const uuidObj = await this.adapter.getForeignObjectAsync('system.meta.uuid');
        if (uuidObj?.native) {
            uuid = uuidObj.native.uuid;
        }
        if (this.server.server) {
            let serverListening = false;
            let serverPort;
            this.server.server.on('error', e => {
                if (e.toString().includes('EACCES') && serverPort <= 1024) {
                    this.adapter.log.error(`node.js process has no rights to start server on the port ${serverPort}.\n` +
                        `Do you know that on linux you need special permissions for ports under 1024?\n` +
                        `You can call in shell following scrip to allow it for node.js: "iobroker fix"`);
                }
                else {
                    this.adapter.log.error(`Cannot start server on ${this.settings.bind || '0.0.0.0'}:${serverPort}: ${e.toString()}`);
                }
                if (!serverListening) {
                    if (this.adapter.terminate) {
                        this.adapter.terminate(adapter_core_1.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                    }
                    else {
                        process.exit(adapter_core_1.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                    }
                }
            });
            this.settings.port = parseInt(this.settings.port, 10) || 8081;
            serverPort = this.settings.port;
            if (!this.settings.disableMcp) {
                // Start MCP server
                this.mcpServer = new iobroker_mcp_1.McpServer(this.server.server, {
                    defaultUser: this.settings.defaultUser,
                    auth: false,
                    language: systemConfig.common.language,
                }, this.adapter, 
                // Run as a web extension on admin's own web server: a minimal instance object puts
                // the MCP routes under `/mcp/` and feeds the config via `native` (see McpServer).
                {
                    _id: 'system.adapter.mcp',
                    native: {
                        defaultUser: this.settings.defaultUser,
                        auth: false,
                        language: systemConfig.common.language,
                    },
                }, this.server.app);
            }
            this.adapter.getPort(this.settings.port, !this.settings.bind || this.settings.bind === '0.0.0.0' ? undefined : this.settings.bind || undefined, port => {
                serverPort = port;
                // Start the web server
                this.server.server.listen(port, !this.settings.bind || this.settings.bind === '0.0.0.0'
                    ? undefined
                    : this.settings.bind || undefined, () => {
                    void this.adapter.setState('info.connection', true, true);
                    serverListening = true;
                    this.adapter.log.info(`http${this.settings.secure ? 's' : ''} server listening on port ${port}`);
                    this.adapter.log.info(`Use link "http${this.settings.secure ? 's' : ''}://127.0.0.1:${port}" to configure.`);
                    if (!this.adapter.config.doNotCheckPublicIP && !this.adapter.config.auth) {
                        this.checkTimeout = this.adapter.setTimeout(async () => {
                            this.checkTimeout = null;
                            try {
                                await (0, webserver_1.checkPublicIP)(this.settings.port, 'ioBroker', '/iobroker_check.html');
                            }
                            catch (e) {
                                // this supported first from js-controller 5.0.
                                this.adapter.sendToHost(`system.host.${this.adapter.host}`, 'addNotification', {
                                    scope: 'system',
                                    category: 'securityIssues',
                                    message: 'Your admin instance is accessible from the internet without any protection. ' +
                                        'Please enable authentication or disable the access from the internet.',
                                    instance: `system.adapter.${this.adapter.namespace}`,
                                }, ( /* result */) => {
                                    /* ignore */
                                });
                                this.adapter.log.error(e.toString());
                            }
                        }, 1000);
                    }
                });
                if (typeof this.onReady === 'function') {
                    this.onReady(this.server.server, this.store, this.adapter);
                }
            });
        }
    }
}
exports.default = Web;
//# sourceMappingURL=web.js.map