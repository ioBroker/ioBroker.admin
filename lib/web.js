/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint -W061 */
'use strict';
const Stream 	= require('stream');
const utils 	= require('@iobroker/adapter-core'); // Get common adapter utils
const LE 	    = require(utils.controllerDir + '/lib/letsencrypt.js');
const express 	= require('express');
const fs        = require('fs');
const util      = require('util');
const path      = require('path');
const stream    = require('stream');

let zlib         = null;

let session;
let bodyParser;
let AdapterStore;
let password;
let passport;
let LocalStrategy;
let flash;
let cookieParser;
let fileUpload;
let socketIoFile;
const FORBIDDEN_CHARS = /[\]\[*,;'"`<>\\\s?]/g; // with space
const ONE_MONTH_SEC = 30 * 24 * 3600;

// copied from here: https://github.com/component/escape-html/blob/master/index.js
const matchHtmlRegExp = /["'&<>]/;
function escapeHtml (string) {
    const str = '' + string;
    const match = matchHtmlRegExp.exec(str);

    if (!match) {
        return str;
    }

    let escape;
    let html = '';
    let index = 0;
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

    return lastIndex !== index
        ? html + str.substring(lastIndex, index)
        : html;
}

function MemoryWriteStream() {
    stream.Transform.call(this);
    this._chunks = [];
    this._transform = (chunk, enc, cb) => {
        this._chunks.push(chunk);
        cb();
    };
    this.collect = () => {
        const result = Buffer.concat(this._chunks);
        this._chunks = []; return result;
    }
}
util.inherits(MemoryWriteStream, stream.Transform);

function Web(settings, adapter, onReady) {
    if (!(this instanceof Web)) {
        return new Web(settings, adapter, onReady);
    }

    // todo delete after react will be main
    let LOGIN_PAGE = adapter.config.react ? '/index.html?login' : '/login/index.html';

    const server = {
        app:       null,
        server:    null
    };
    const bruteForce = {};
    let store        = null;
    let loginPage;
    let indexHTML;
    let dirName = path.normalize((__dirname + '/../admin/').replace(/\\/g, '/')).replace(/\\/g, '/');
    let unprotectedFiles;
    this.server = server;

    // todo delete after react will be main
    let wwwDir = adapter.config.react ? 'www-react' : 'www';

    this.close = () => server.server && server.server.close();

    function decorateLogFile(filename, text) {
        const prefix = '<html><head>' +
        '<style>\n' +
        '   table {' +
        '       font-family: monospace;\n' +
        '       font-size: 14px;\n' +
        '   }\n' +
        '   .info {\n' +
        '       background: white;' +
        '   }\n' +
        '   .type {\n' +
        '       font-weight: bold;' +
        '   }\n' +
        '   .silly {\n' +
        '       background: #b3b3b3;' +
        '   }\n' +
        '   .debug {\n' +
        '       background: lightgray;' +
        '   }\n' +
        '   .warn {\n' +
        '       background: #ffdb75;' +
        '       color: white;' +
        '   }\n' +
        '   .error {\n' +
        '       background: #ff6a5b;' +
        '   }\n' +
        '</style>\n' +
            '<script>\n' +
            'function decorate (line) {\n' +
            '   var className = "info";\n' +
            '   line = line.replace(/\\x1B\\[39m/g, "</span>");\n' +
            '   if (line.indexOf("[32m") !== -1) {\n' +
            '       className = "info";\n'+
            '       line = line.replace(/\\x1B\\[32m/g, "<span class=\\"type\\">");\n' +
            '   } else \n' +
            '   if (line.indexOf("[34m") !== -1) {\n' +
            '       className = "debug";\n'+
            '       line = line.replace(/\\x1B\\[34m/g, "<span class=\\"type\\">");\n' +
            '   } else \n' +
            '   if (line.indexOf("[33m") !== -1) {\n' +
            '       className = "warn";\n'+
            '       line = line.replace(/\\x1B\\[33m/g, "<span class=\\"type\\">");\n' +
            '   } else \n' +
            '   if (line.indexOf("[31m") !== -1) {\n' +
            '       className = "error";\n'+
            '       line = line.replace(/\\x1B\\[31m/g, "<span class=\\"type\\">");\n' +
            '   } else \n' +
            '   if (line.indexOf("[35m") !== -1) {\n' +
            '       className = "silly";\n'+
            '       line = line.replace(/\\x1B\\[35m/g, "<span class=\\"type\\">");\n' +
            '   } else {\n' +
            '   }\n' +
            '   return "<tr class=\\"" + className + "\\"><td>" + line + "</td></tr>";\n'+
            '}\n' +
            'document.addEventListener("DOMContentLoaded", function () { \n' +
            '  var text = document.body.innerHTML;\n' +
            '  var lines = text.split("\\n");\n' +
            '  text = "<table>";\n' +
            '  for (var i = 0; i < lines.length; i++) {\n' +
            '       if (lines[i]) text += decorate(lines[i]);\n' +
            '  }\n' +
            '  text += "</table>";\n' +
            '  document.body.innerHTML = text;\n' +
            '  window.scrollTo(0,document.body.scrollHeight);\n' +
            '});\n' +
            '</script>\n</head>\n<body>\n';
        const suffix = '</body></html>';
        const log = text || fs.readFileSync(filename).toString();
        return prefix + log + suffix;
    }

    function prepareIndex() {
        let template = fs.readFileSync(`${__dirname}/../${wwwDir}/index.html`).toString('utf8');
        const m = template.match(/(["']?@@\w+@@["']?)/g);
        m.forEach(pattern => {
            pattern = pattern.replace(/@/g, '').replace(/'/g, '').replace(/"/g, '');
            if (pattern === 'loginBackgroundImage') {
                if (adapter.config[pattern]) {
                    template = template.replace('@@' + pattern + '@@', adapter.namespace + '/login-bg.png');
                } else {
                    template = template.replace('@@' + pattern + '@@', '');
                }
            } else if (pattern === 'loginBackgroundColor') {
                template = template.replace('\'@@' + pattern + '@@\'', adapter.config[pattern]);
            } else {
                template = template.replace('@@' + pattern + '@@', adapter.config[pattern] !== undefined ? adapter.config[pattern] :  '');
            }
        });
        return template;
    }

    function prepareLoginTemplate() {
        let def = 'background: #64b5f6;\n';
        let template = fs.readFileSync(`${__dirname}/../${wwwDir}/login/index.html`).toString('utf8');
        if (adapter.config.loginBackgroundColor) {
            def = 'background-color: ' + adapter.config.loginBackgroundColor + ';\n'
        }
        if (adapter.config.loginBackgroundImage) {
            def += '            background-image: url(../' + adapter.namespace + '/login-bg.png);\n';
        }
        if (adapter.config.loginHideLogo) {
            template = template.replace('.logo { display: block }', '.logo { display: none }');
        }
        if (adapter.config.loginMotto) {
            template = template.replace('Discover awesome. <a href="http://iobroker.net/" target="_blank">ioBroker</a>', adapter.config.loginMotto);
        }
        return template.replace('background: #64b5f6;', def);
    }

    function readInstanceConfig(id, user, isTab, configs) {
        return new Promise(resolve =>
            adapter.getForeignObject('system.adapter.' + id, {user}, (err, obj) => {
                if (obj && obj.common) {
                    const instance = id.split('.').pop();
                    const config = {
                        id,
                        title: obj.common.titleLang || obj.common.title,
                        desc: obj.common.desc,
                        color: obj.common.color,
                        url: '/adapter/' + obj.common.name + '/' + (isTab ? 'tab' : 'index') + (!isTab && obj.common.materialize ? '_m' : '') + '.html' + (instance ? '?' + instance : ''),
                        icon: obj.common.icon
                    };
                    if (isTab) {
                        config.tab = true;
                    } else {
                        config.config = true;
                    }
                    if (typeof config.title === 'object') {
                        config.title = config.title[adapter.systemConfig.language] || config.title.en;
                    }
                    if (typeof config.desc === 'object') {
                        config.desc = config.desc[adapter.systemConfig.language] || config.desc.en;
                    }
                    configs.push(config);
                }
                resolve();
            }));
    }

    let CONFIG_TEMPLATE;
    function generateConfigPage(req, res) {
        CONFIG_TEMPLATE = CONFIG_TEMPLATE || (fs.existsSync(__dirname + '/../src/configs.html') ?
                fs.readFileSync(__dirname + '/../src/configs.html').toString('utf8') :
                fs.readFileSync(__dirname + '/../www/configs.html').toString('utf8'));

        let user = 'admin';
        if (settings.auth) {
            user = req.user;
            if (!user.startsWith('system.user.')) {
                user = 'system.user.' + user;
            }
        } else {
            user = settings.defaultUser;
        }

        if (settings.accessLimit) {
            const configs = [];
            const promises = [];
            settings.accessAllowedConfigs.forEach(id => promises.push(readInstanceConfig(id, user, false, configs)));
            settings.accessAllowedTabs.forEach(id    => promises.push(readInstanceConfig(id, user, true, configs)));

            Promise.all(promises)
                .then(() =>
                    res.send(CONFIG_TEMPLATE.replace('%%CONFIG%%', JSON.stringify(configs))));
        } else {
            adapter.getObjectView('system', 'instance', {startkey: 'system.adapter.', endkey: 'system.adapter.\u9999'}, {user}, (err, doc) => {
                const promises = [];
                const configs = [];
                if (!err && doc.rows.length) {
                    for (var i = 0; i < doc.rows.length; i++) {
                        const obj = doc.rows[i].value;
                        if (obj.common.noConfig && !obj.common.adminTab) {
                            continue;
                        }
                        if (!obj.common.enabled) {
                            continue;
                        }
                        if (!obj.common.noConfig) {
                            promises.push(readInstanceConfig(obj._id.substring('system.adapter.'.length), user, false, configs));
                        }
                    }
                }
                Promise.all(promises)
                    .then(() =>
                        res.send(CONFIG_TEMPLATE.replace('%%CONFIG%%', JSON.stringify(configs))));
            });
        }
    }

    //settings: {
    //    "port":   8080,
    //    "auth":   false,
    //    "secure": false,
    //    "bind":   "0.0.0.0", // "::"
    //    "cache":  false
    //}
    (function __construct () {
        if (settings.port) {
            server.app = express();

            settings.ttl                  = parseInt(settings.ttl, 10) || 3600;
            settings.accessAllowedConfigs = settings.accessAllowedConfigs || [];
            settings.accessAllowedTabs    = settings.accessAllowedTabs || [];

            server.app.disable('x-powered-by');

            // enable use of i-frames together with HTTPS
            server.app.get('/*', (req, res, next) => {
                res.header('X-Frame-Options', 'SAMEORIGIN');
                next(); // http://expressjs.com/guide.html#passing-route control
            });

            // ONLY for DEBUG
            server.app.use(function(req, res, next) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                next();
            });

            // replace socket.io
            server.app.use((req, res, next) => {
                if (socketIoFile !== false && (req.url.startsWith('socket.io.js') || req.url.match(/\/socket\.io\.js(\?.*)?$/))) {
                    if (socketIoFile) {
                        res.contentType('text/javascript');
                        return res.status(200).send(socketIoFile);
                    } else {
                        socketIoFile = fs.readFileSync(path.join(__dirname, '../www-react/lib/js/socket.io.js'));
                        if (socketIoFile) {
                            res.contentType('text/javascript');
                            return res.status(200).send(socketIoFile);
                        } else {
                            socketIoFile = false;
                            return res.status(404).end();
                        }
                    }
                }
                next();
            });

            if (settings.auth) {
                session       = require('express-session');
                cookieParser  = require('cookie-parser');
                bodyParser    = require('body-parser');
                AdapterStore  = require(utils.controllerDir + '/lib/session.js')(session, settings.ttl);
                password      = require(utils.controllerDir + '/lib/password.js');
                passport      = require('passport');
                LocalStrategy = require('passport-local').Strategy;
                flash         = require('connect-flash'); // TODO report error to user

                store = new AdapterStore({adapter: adapter});

                passport.use(new LocalStrategy((username, password, done) => {
                    username = (username || '').toString().replace(FORBIDDEN_CHARS, '_').replace(/\s/g, '_').replace(/\./g, '_').toLowerCase();

                    if (bruteForce[username] && bruteForce[username].errors > 4) {
                        let minutes = (new Date().getTime() - bruteForce[username].time);
                        if (bruteForce[username].errors < 7) {
                            if ((new Date().getTime() - bruteForce[username].time) < 60000) {
                                minutes = 1;
                            } else {
                                minutes = 0;
                            }
                        } else
                        if (bruteForce[username].errors < 10) {
                            if ((new Date().getTime() - bruteForce[username].time) < 180000) {
                                minutes = Math.ceil((180000 - minutes) / 60000);
                            } else {
                                minutes = 0;
                            }
                        } else
                        if (bruteForce[username].errors < 15) {
                            if ((new Date().getTime() - bruteForce[username].time) < 600000) {
                                minutes = Math.ceil((600000 - minutes) / 60000);
                            } else {
                                minutes = 0;
                            }
                        } else
                        if ((new Date().getTime() - bruteForce[username].time) < 3600000) {
                            minutes = Math.ceil((3600000 - minutes) / 60000);
                        } else {
                            minutes = 0;
                        }

                        if (minutes) {
                            return done('Too many errors. Try again in ' + minutes + ' ' + (minutes === 1 ? 'minute' : 'minutes') + '.', false);
                        }
                    }

                    adapter.checkPassword(username, password, res => {
                        if (!res) {
                            bruteForce[username] = bruteForce[username] || {errors: 0};
                            bruteForce[username].time = new Date().getTime();
                            bruteForce[username].errors++;
                        } else if (bruteForce[username]) {
                            delete bruteForce[username];
                        }

                        if (res) {
                            return done(null, username);
                        } else {
                            return done(null, false);
                        }
                    });
                }));

                passport.serializeUser((user, done) => done(null, user));

                passport.deserializeUser((user, done) => done(null, user));

                server.app.use(cookieParser());
                server.app.use(bodyParser.urlencoded({ extended: true }));
                server.app.use(bodyParser.json());
                server.app.use(session({
                    secret:             settings.secret,
                    saveUninitialized:  true,
                    resave:             true,
                    cookie:             {maxAge: settings.ttl * 1000},
                    store:  store
                }));
                server.app.use(passport.initialize());
                server.app.use(passport.session());
                server.app.use(flash());

                server.app.post('/login', (req, res, next) => {
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
                        }
                    }
                    req.body.password = (req.body.password || '').toString();
                    req.body.username = (req.body.username || '').toString();
                    req.body.stayLoggedIn = req.body.stayloggedin === 'true' || req.body.stayloggedin === true || req.body.stayloggedin === 'on';

                    passport.authenticate('local', (err, user, info) => {
                        if (err) {
                            adapter.log.warn('Cannot login user: ' + err);
                            return res.redirect(LOGIN_PAGE + origin + (origin ? '&error' : '?error'));
                        }
                        if (!user) {
                            return res.redirect(LOGIN_PAGE + origin + (origin ? '&error' : '?error'));
                        }
                        req.logIn(user, err => {
                            if (err) {
                                adapter.log.warn('Cannot login user: ' + err);
                                return res.redirect(LOGIN_PAGE + origin + (origin ? '&error' : '?error'));
                            }
                            if (req.body.stayLoggedIn) {
                                req.session.cookie.maxAge = settings.ttl > ONE_MONTH_SEC ? settings.ttl * 1000 : ONE_MONTH_SEC * 1000;
                            } else {
                                req.session.cookie.maxAge = settings.ttl * 1000;
                            }
                            if (isDev) {
                                return res.redirect('http://localhost:3000' + redirect);
                            } else {
                                return res.redirect(redirect);
                            }
                        });
                    }/*{
                        successRedirect: redirect,
                        failureRedirect: LOGIN_PAGE + origin + (origin ? '&error' : '?error'),
                        failureFlash:    'Invalid username or password.'
                    }*/)(req, res, next);
                });

                server.app.get('/logout', (req, res) => {
                    const isDev = req.url.includes('?dev');
                    req.logout();
                    if (isDev) {
                        res.redirect('http://localhost:3000/index.html?login');
                    } else {
                        res.redirect(LOGIN_PAGE);
                    }
                });

                server.app.get('/login/index.html', (req, res) => {
                    if (LOGIN_PAGE !== '/login/index.html') {
                        res.redirect(LOGIN_PAGE);
                    } else {
                        loginPage = loginPage || prepareLoginTemplate(wwwDir);
                        res.contentType('text/html');
                        res.status(200).send(loginPage);
                    }
                });

                // route middleware to make sure a user is logged in
                server.app.use((req, res, next) => {
                    // return favicon always
                    if (req.originalUrl.startsWith('/login/favicon.ico')) {
                        res.set('Content-Type', 'image/x-icon');
                        return res.send(fs.readFileSync(`${__dirname}/../${wwwDir}/favicon.ico`));
                    } else
                    if (/admin\.\d+\/login-bg\.png(\?.*)?$/.test(req.originalUrl)) {
                        // Read names of files for gong
                        return adapter.readFile(adapter.namespace, 'login-bg.png', null, (err, file) => {
                            if (!err && file) {
                                res.set('Content-Type', 'image/png');
                                res.status(200).send(file);
                            } else {
                                res.status(404).send();
                            }
                        });
                    } else
                    if (!req.isAuthenticated()) {
                        if (/^\/login\//.test(req.originalUrl) ||
                            /\.ico(\?.*)?$/.test(req.originalUrl)) {
                            return next();
                        } else {
                            if (adapter.config.react) {
                                const pathName = req.url.split('?')[0];
                                // protect all paths except
                                unprotectedFiles = unprotectedFiles || fs.readdirSync(path.join(__dirname, '../www-react/')).map(file => {
                                    const stat = fs.lstatSync(path.join(__dirname, '../www-react/', file));
                                    return {name: file, isDir: stat.isDirectory()};
                                });
                                if (pathName && pathName !== '/' && !unprotectedFiles.find(file => file.isDir ? pathName.startsWith('/' + file.name + '/') : '/' + file.name === pathName)) {
                                    res.redirect(LOGIN_PAGE + '&href=' + encodeURIComponent(req.originalUrl));
                                } else {
                                    return next();
                                }
                            } else {
                                // todo delete after react will be main
                                res.redirect(LOGIN_PAGE + '?href=' + encodeURIComponent(req.originalUrl));
                            }
                        }
                    } else {
                        return next();
                    }
                });
            } else {
                server.app.get('/login',  (req, res) => res.redirect('/'));
                server.app.get('/logout', (req, res) => res.redirect('/'));
            }

            server.app.get('/zip/*', (req, res) => {
                let parts = req.url.split('/');
                const filename = parts.pop();
                let hostname = parts.pop();
                // backwards compatibility with javascript < 3.5.5
                if (hostname === 'zip') {
                    hostname = 'system.host.' + adapter.host;
                }

                adapter.getBinaryState(hostname + '.zip.' + filename, (err, buff) => {
                    if (err) {
                        res.status(500).send(escapeHtml(typeof err === 'string' ? err : JSON.stringify(err)));
                    } else {
                        if (!buff) {
                            res.status(404).send(escapeHtml('File ' + filename + '.zip not found'));
                        } else {
                            // remove file
                            adapter.delBinaryState && adapter.delBinaryState('system.host.' + adapter.host + '.zip.' + filename);
                            res.set('Content-Type', 'application/zip');
                            res.send(buff);
                        }
                    }
                });
            });

            // send log files
            server.app.get('/log/*', (req, res) => {
                let parts = decodeURIComponent(req.url).split('/');
                parts = parts.splice(2);
                const transport = parts.shift();
                let filename = parts.join('/');
                const config = adapter.systemConfig;
                // detect file log
                if (config && config.log && config.log.transport) {
                    if (config.log.transport.hasOwnProperty(transport) && config.log.transport[transport].type === 'file') {
                        let logFolder;
                        if (config.log.transport[transport].filename) {
                            parts = config.log.transport[transport].filename.replace(/\\/g, '/').split('/');
                            parts.pop();
                            logFolder = path.normalize(parts.join('/'));
                        } else {
                            logFolder = path.join(process.cwd(), 'log');
                        }

                        if (logFolder[0] !== '/' && logFolder[0] !== '\\' && !logFolder.match(/^[a-zA-Z]:/)) {
                            const _logFolder = path.normalize(path.join(__dirname + '/../../../', logFolder).replace(/\\/g, '/')).replace(/\\/g, '/');
                            if (!fs.existsSync(_logFolder)) {
                                logFolder = path.normalize(path.join(__dirname + '/../../', logFolder).replace(/\\/g, '/')).replace(/\\/g, '/');
                            } else {
                                logFolder = _logFolder;
                            }
                        }

                        filename = path.normalize(path.join(logFolder, filename).replace(/\\/g, '/')).replace(/\\/g, '/');

                        if (filename.startsWith(logFolder) && fs.existsSync(filename)) {
                            const stat = fs.lstatSync(filename);
                            // if file is archive
                            if (filename.toLowerCase().endsWith('.gz')) {
                                // try to not process to big files
                                if (stat.size > 1024 * 1024/* || !fs.existsSync('/dev/null')*/) {
                                    res.header('Content-Type', 'application/gzip');
                                    res.sendFile(filename);
                                } else {
                                    zlib = zlib || require('zlib');

                                    // extract the file
                                    try {
                                        const text = zlib.gunzipSync(fs.readFileSync(filename)).toString('utf8');
                                        if (text.length > 2 * 1024 * 1024) {
                                            res.header('Content-Type', 'text/plain');
                                            res.send(text);
                                        } else {
                                            res.header('Content-Type', 'text/html');
                                            res.send(decorateLogFile(null, text));
                                        }
                                    } catch (e) {
                                        res.sendFile(filename);
                                        adapter.log.error(`Cannot extract file ${filename}: ${e}`);
                                    }
                                }
                            } else if (stat.size > 2 * 1024 * 1024) {
                                res.header('Content-Type', 'text/plain');
                                res.sendFile(filename);
                            } else {
                                res.header('Content-Type', 'text/html');
                                res.send(decorateLogFile(filename));
                            }

                            return;
                        }
                    }
                }
                res.status(404).send('File ' + escapeHtml(filename) + ' not found');
            });

            const appOptions = {};
            if (settings.cache) {
                appOptions.maxAge = 30758400000;
            }

            if (settings.tmpPathAllow && settings.tmpPath) {
                server.app.use('/tmp/', express.static(settings.tmpPath, {maxAge: 0}));
                fileUpload = fileUpload || require('express-fileupload');
                server.app.use(fileUpload({
                    useTempFiles: true,
                    tempFileDir: settings.tmpPath
                }));
                server.app.post('/upload', (req, res) => {
                    if (!req.files) {
                        return res.status(400).send('No files were uploaded.');
                    }

                    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
                    let myFile;
                    // take first non empty file
                    for (const name in req.files) {
                        if (req.files.hasOwnProperty(name)) {
                            myFile = req.files[name];
                            break;
                        }
                    }

                    if (myFile) {
                        if (myFile.data && myFile.data.length > 600 * 1024 * 1024) {
                            return res.status(500).send('File is too big. (Max 600MB)');
                        }
                        // Use the mv() method to place the file somewhere on your server
                        myFile.mv(settings.tmpPath + '/restore.iob', err =>  {
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

            if (!fs.existsSync(__dirname + '/../' + wwwDir)) {
                server.app.use('/', (req, res) =>
                    res.send('This adapter cannot be installed directly from github.<br>You must install it from npm.<br>Write for that <i>"npm install iobroker.admin"</i> in according directory.'));
            } else {
                server.app.get('/empty.html', (req, res) => res.send(''));

                if (settings.accessLimit) {
                    // redirect index.html
                    server.app.get('/index.html', generateConfigPage);
                    server.app.get('/', generateConfigPage);
                } else {
                    server.app.get('/configs.html', generateConfigPage);
                }

                if (settings.react) {
                    server.app.get('/index.html', (req, res) => {
                        indexHTML = indexHTML || prepareIndex();
                        res.header('Content-Type', 'text/html');
                        res.status(200).send(indexHTML);
                    });
                    server.app.get('/', (req, res) => {
                        indexHTML = indexHTML || prepareIndex();
                        res.header('Content-Type', 'text/html');
                        res.status(200).send(indexHTML);
                    });
                }

                server.app.use('/', express.static(__dirname + '/../' + wwwDir, appOptions));
            }

            // reverse proxy with url rewrite for couchdb attachments in <adapter-name>.admin
            server.app.use('/adapter/', (req, res) => {
                // Example: /example/?0&attr=1
                let url = req.url;

                // add index.html
                url = url.replace(/\/($|\?|#)/, '/index.html$1');

                // Read config files for admin from /adapters/admin/admin/...
                if (url.startsWith('/' + adapter.name + '/')) {
                    url = url.replace('/' + adapter.name + '/', dirName);
                    // important: Linux does not normalize "\" but fs.readFile accepts it as '/'
                    url = path.normalize(url.replace(/\?.*/, '').replace(/\\/g, '/')).replace(/\\/g, '/');

                    if (url.startsWith(dirName)) {
                        try {
                            if (fs.existsSync(url)) {
                                fs.createReadStream(url).pipe(res);
                            } else {
                                const ss = new Stream();
                                ss.pipe = dest => dest.write('File not found');

                                ss.pipe(res);
                            }
                        } catch (e) {
                            const s = new Stream();
                            s.pipe = dest => dest.write('File not found: ' + escapeHtml(JSON.stringify(e)));

                            s.pipe(res);
                        }
                    } else {
                        res.status(404).send('File ' + escapeHtml(url) + ' not found');
                    }
                    return;
                }

                url = url.split('/');
                // Skip first /
                url.shift();
                // Get ID
                const adapterName = url.shift();
                const id = adapterName + '.admin';
                url = url.join('/');
                const pos = url.indexOf('?');
                let _instance = 0;
                if (pos !== -1) {
                    _instance = parseInt(url.substring(pos + 1), 10) || 0;
                    url = url.substring(0, pos);
                }

                if (settings.accessLimit) {
                    if (url === 'index.html' || url === 'index_m.html') {
                        const anyConfig = settings.accessAllowedConfigs.includes(adapterName + '.' + _instance);
                        if (!anyConfig) {
                            res.contentType('text/html');
                            return res.status(403).send('You are not allowed to access this page');
                        }
                    }
                    if (url === 'tab.html' || url === 'tab_m.html') {
                        const anyTabs = settings.accessAllowedTabs.includes(adapterName + '.' + _instance);
                        if (!anyTabs) {
                            res.contentType('text/html');
                            return res.status(403).send('You are not allowed to access this page');
                        }
                    }
                }

                // adapter.readFile is sanitized
                adapter.readFile(id, url, null, (err, buffer, mimeType) => {
                    if (!buffer || err) {
                        res.contentType('text/html');
                        res.status(404).send('File ' + escapeHtml(url) + ' not found');
                    } else {
                        if (mimeType) {
                            res.contentType(mimeType['content-type'] || mimeType);
                        } else {
                            res.contentType('text/javascript');
                        }
                        res.send(buffer);
                    }
                });
            });

            // reverse proxy with url rewrite for couchdb attachments in <adapter-name>
            server.app.use('/files/', (req, res) => {
                // Example: /vis.0/main/img/image.png
                let url = req.url;

                // add index.html
                url = url.replace(/\/($|\?|#)/, '/index.html$1');

                url = url.split('/');
                // Skip first /files
                url.shift();
                // Get ID
                const adapterName = url.shift();
                url = url.join('/');
                const pos = url.indexOf('?');
                if (pos !== -1) {
                    url = url.substring(0, pos);
                }

                if (settings.accessLimit) {
                    if (url === 'index.html' || url === 'index_m.html') {
                        const anyConfig = settings.accessAllowedConfigs.includes(adapterName + '.' + _instance);
                        if (!anyConfig) {
                            res.contentType('text/html');
                            return res.status(403).send('You are not allowed to access this page');
                        }
                    }
                    if (url === 'tab.html' || url === 'tab_m.html') {
                        const anyTabs = settings.accessAllowedTabs.includes(adapterName + '.' + _instance);
                        if (!anyTabs) {
                            res.contentType('text/html');
                            return res.status(403).send('You are not allowed to access this page');
                        }
                    }
                }

                // adapter.readFile is sanitized
                adapter.readFile(adapterName, url, null, (err, buffer, mimeType) => {
                    if (err) {
                        res.contentType('text/html');
                        res.status(404).send('File ' + escapeHtml(url) + ' not found');
                    } else {
                        if (mimeType) {
                            res.contentType(mimeType['content-type'] || mimeType);
                        } else {
                            res.contentType('text/javascript');
                        }
                        res.send(buffer);
                    }
                });
            });

            let exceptionLog = false;
            try {
                server.server = LE.createServer(server.app, settings, adapter.config.certificates, adapter.config.leConfig, adapter.log);
            } catch (err) {
                adapter.log.error(`Cannot create webserver: ${err}`);
                exceptionLog = true;
            }
            if (!server.server) {
                !exceptionLog && adapter.log.error(`Cannot create webserver`);
                adapter.terminate ? adapter.terminate(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION) : process.exit(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                return;
            }

            server.server.__server = server;
        } else {
            adapter.log.error('port missing');
            adapter.terminate ? adapter.terminate('port missing', utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION) : process.exit(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
        }

        if (server.server) {
            let serverListening = false;
            let serverPort;
            server.server.on('error', e => {
                if (e.toString().includes('EACCES') && serverPort <= 1024) {
                    adapter.log.error(`node.js process has no rights to start server on the port ${serverPort}.\n` +
                        `Do you know that on linux you need special permissions for ports under 1024?\n` +
                        `You can call in shell following scrip to allow it for node.js: "iobroker fix"`
                    );
                } else {
                    adapter.log.error(`Cannot start server on ${settings.bind || '0.0.0.0'}:${serverPort}: ${e}`);
                }

                if (!serverListening) {
                    adapter.terminate ? adapter.terminate(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION) : process.exit(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                }
            });

            settings.port = parseInt(settings.port, 10);
            serverPort = settings.port;

            adapter.getPort(settings.port, port => {
                if (port !== settings.port && !adapter.config.findNextPort) {
                    adapter.log.error('port ' + settings.port + ' already in use');
                    return adapter.terminate ? adapter.terminate('port ' + settings.port + ' already in use', utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION) : process.exit(utils.EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
                }
                serverPort = port;

                // Start the web server
                server.server.listen(port, (!settings.bind || settings.bind === '0.0.0.0') ? undefined : settings.bind || undefined, () => {
                    serverListening = true;
                });

                adapter.log.info('http' + (settings.secure ? 's' : '') + ' server listening on port ' + port);
                adapter.log.info('Use link "http' + (settings.secure ? 's' : '') + '://localhost:' + port + '" to configure.');

                if (typeof onReady === 'function') {
                    onReady(server.server, store, adapter);
                }
            });
        }

        if (server.server) {
            return server;
        } else {
            return null;
        }
    })();

    return this;
}

module.exports = Web;
