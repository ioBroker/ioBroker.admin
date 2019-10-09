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
let path        = require('path');

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

function Web(settings, adapter, onReady) {
    if (!(this instanceof Web)) return new Web(settings, adapter, onReady);
    const server = {
        app:       null,
        server:    null
    };
    const bruteForce  = {};
    let store       = null;
    let loginPage;
    this.server = server;

    this.close = () => server.server && server.server.close();

    function decorateLogFile(filename) {
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
        const log = fs.readFileSync(filename).toString();
        return prefix + log + suffix;
    }

    function prepareLoginTemplate() {
        let def = 'background: #64b5f6;\n';
        let template = fs.readFileSync(__dirname + '/../www/login/index.html').toString('utf8');
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

            server.app.disable('x-powered-by');

            // enable use of i-frames together with HTTPS
            server.app.get('/*', (req, res, next) => {
                res.header('X-Frame-Options', 'SAMEORIGIN');
                next(); // http://expressjs.com/guide.html#passing-route control
            });

            if (settings.auth) {
                session =           require('express-session');
                cookieParser =      require('cookie-parser');
                bodyParser =        require('body-parser');
                AdapterStore =      require(utils.controllerDir + '/lib/session.js')(session, settings.ttl);
                password =          require(utils.controllerDir + '/lib/password.js');
                passport =          require('passport');
                LocalStrategy =     require('passport-local').Strategy;
                flash =             require('connect-flash'); // TODO report error to user

                store = new AdapterStore({adapter: adapter});

                passport.use(new LocalStrategy(
                    (username, password, done) => {
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

                    }
                ));
                passport.serializeUser((user, done) => done(null, user));

                passport.deserializeUser((user, done) => done(null, user));

                server.app.use(cookieParser());
                server.app.use(bodyParser.urlencoded({
                    extended: true
                }));
                server.app.use(bodyParser.json());
                server.app.use(session({
                    secret:             settings.secret,
                    saveUninitialized:  true,
                    resave:             true,
                    cookie:             {
                        maxAge: adapter.config.ttl * 1000
                    },
                    store:  store
                }));
                server.app.use(passport.initialize());
                server.app.use(passport.session());
                server.app.use(flash());

                server.app.post('/login', (req, res, next) => {
                    let redirect = '/';
                    const origin = (req.body && req.body.origin) || '?href=%2F';
                    if (origin) {
                        const parts = origin.match(/href=(.+)$/);
                        if (parts && parts[1]) {
                            redirect = decodeURIComponent(parts[1]);
                            // if some invalid characters in redirect
                            if (redirect.match(/[^-_a-zA-Z0-9&%?.]/)) {
                                redirect = '/';
                            }
                        }
                    }
                    req.body.password = ((req.body && req.body.password) || '').toString();
                    req.body.username = ((req.body && req.body.username) || '').toString();

                    passport.authenticate('local', {
                        successRedirect: redirect,
                        failureRedirect: '/login/index.html' + origin + (origin ? '&error' : '?error'),
                        failureFlash:    'Invalid username or password.'
                    })(req, res, next);
                });

                server.app.get('/logout', (req, res) => {
                    req.logout();
                    res.redirect('/login/index.html');
                });

                server.app.get('/login/index.html', (req, res) => {
                    loginPage = loginPage || prepareLoginTemplate();
                    res.contentType('text/html');
                    res.status(200).send(loginPage);
                });

                // route middleware to make sure a user is logged in
                server.app.use((req, res, next) => {
                    if (!req.isAuthenticated()) {
                        if (/admin\.\d+\/login-bg\.png(\?.*)?$/.test(req.originalUrl)) {
                            // Read names of files for gong
                            adapter.objects.readFile(adapter.namespace, 'login-bg.png', null, (err, file) => {
                                if (!err && file) {
                                    res.set('Content-Type', 'image/png');
                                    res.status(200).send(file);
                                } else {
                                   res.status(404).send();
                                }
                            });
                        } else if (/^\/login\//.test(req.originalUrl) ||
                                   /\.ico(\?.*)?$/.test(req.originalUrl)) {
                            return next();
                        } else {
                            res.redirect('/login/index.html?href=' + encodeURIComponent(req.originalUrl));
                        }
                    } else {
                        // special solution for socket.io
                        if (socketIoFile !== false && (req.url.startsWith('socket.io.js') || req.url.match(/\/socket\.io\.js(\?.*)?$/))) {
                            if (socketIoFile) {
                                res.contentType('text/javascript');
                                res.status(200).send(socketIoFile);
                                return
                            } else {
                                try {
                                    const dir = require.resolve('socket.io-client');
                                    const fileDir = path.join(path.dirname(dir), '../dist/');
                                    if (fs.existsSync(fileDir + 'socket.io.min.js')) {
                                        socketIoFile = fs.readFileSync(fileDir + 'socket.io.min.js');
                                    } else {
                                        socketIoFile = fs.readFileSync(fileDir + 'socket.io.js');
                                    }
                                } catch (e) {
                                    try {
                                        socketIoFile = fs.readFileSync(path.join(__dirname, '../www/lib/js/socket.io.js'));
                                    } catch (e) {
                                        adapter.log.error('Cannot read socket.io.js: ' + e);
                                        socketIoFile = false;
                                    }
                                }
                                if (socketIoFile) {
                                    res.contentType('text/javascript');
                                    res.status(200).send(socketIoFile);
                                    return
                                }
                            }
                        }

                        return next();
                    }
                });
            } else {
                server.app.get('/login', (req, res) => {
                    res.redirect('/');
                });
                server.app.get('/logout', (req, res) => {
                    res.redirect('/');
                });
            }

            server.app.get('/zip/*', (req, res) => {
                let parts = req.url.split('/');
                let filename = parts.pop();

                adapter.getBinaryState('system.host.' + adapter.host + '.zip.' + filename, (err, buff) => {
                    if (err) {
                        res.status(500).send(escapeHtml(typeof err === 'string' ? err : JSON.stringify(err)));
                    } else {
                        if (!buff) {
                            res.status(404).send('File package.zip not found');
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
                            logFolder = path.normalize(path.join(__dirname + '/../../../', logFolder));
                        }

                        filename = path.normalize(path.join(logFolder, filename));

                        if (filename.startsWith(logFolder) && fs.existsSync(filename)) {
                            const stat = fs.lstatSync(filename);
                            if (stat.size > 2 * 1024 * 1024) {
                                res.sendFile(filename);
                            } else {
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

            if (!fs.existsSync(__dirname + '/../www')) {
                server.app.use('/', (req, res) => {
                    res.send('This adapter cannot be installed directly from github.<br>You must install it from npm.<br>Write for that <i>"npm install iobroker.admin"</i> in according directory.');
                });
            } else {
                server.app.use('/', express.static(__dirname + '/../www', appOptions));
            }

            // reverse proxy with url rewrite for couchdb attachments in <adapter-name>.admin
            server.app.use('/adapter/', (req, res) => {
                // Example: /example/?0
                let url = req.url;

                // add index.html
                url = url.replace(/\/($|\?|#)/, '/index.html$1');

                // Read config files for admin from /adapters/admin/admin/...
                if (url.substring(0, '/' + adapter.name + '/'.length) === '/' + adapter.name + '/') {
                    url = url.replace('/' + adapter.name + '/', __dirname + '/../admin/');
                    url = url.replace(/\?[0-9]*/, '');

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
                        s.pipe = dest => dest.write('File not found: ' + e);

                        s.pipe(res);
                    }
                    return;
                }
                url = url.split('/');
                // Skip first /
                url.shift();
                // Get ID
                const id = url.shift() + '.admin';
                url = url.join('/');
                const pos = url.indexOf('?');
                if (pos !== -1) {
                    url = url.substring(0, pos);
                }
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

            server.server = LE.createServer(server.app, settings, adapter.config.certificates, adapter.config.leConfig, adapter.log);
            server.server.__server = server;
        } else {
            adapter.log.error('port missing');
            adapter.terminate ? adapter.terminate('port missing', 1) : process.exit(1);
        }

        if (server.server) {
            settings.port = parseInt(settings.port, 10);

            adapter.getPort(settings.port, port => {
                if (port !== settings.port && !adapter.config.findNextPort) {
                    adapter.log.error('port ' + settings.port + ' already in use');
                    adapter.terminate ? adapter.terminate('port ' + settings.port + ' already in use', 1) : process.exit(1);
                }
                server.server.listen(port, (!settings.bind || settings.bind === '0.0.0.0') ? undefined : settings.bind || undefined);

                adapter.log.info('http' + (settings.secure ? 's' : '') + ' server listening on port ' + port);
                adapter.log.info('Use link "http' + (settings.secure ? 's' : '') + '://localhost:' + port + '" to configure.');

                if (typeof onReady === 'function') {
                    onReady(server.server, store);
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
