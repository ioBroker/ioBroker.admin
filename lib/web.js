/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint -W061 */
'use strict';
var Stream 		= require('stream');
var utils 		= require(__dirname + '/utils'); // Get common adapter utils
var LE 			= require(utils.controllerDir + '/lib/letsencrypt.js');
var express 	= require('express');
var fs          = require('fs');
var path; // will be loaded later

var session;
var bodyParser;
var AdapterStore;
var password;
var passport;
var LocalStrategy;
var flash;
var cookieParser;
var fileUpload;

function Web(settings, adapter, onReady) {
    if (!(this instanceof Web)) return new Web(settings, adapter, onReady);
    var server = {
        app:       null,
        server:    null
    };
    var bruteForce  = {};
    var store       = null;
    this.server = server;

    this.close = function () {
        if (server.server) {
            server.server.close();
        }
    };

    function decorateLogFile(filename) {
        var prefix = '<html><head>' +
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
        var suffix = '</body></html>';
        var log = fs.readFileSync(filename).toString();
        return prefix + log + suffix;
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
            if (settings.auth) {
                session =           require('express-session');
                cookieParser =      require('cookie-parser');
                bodyParser =        require('body-parser');
                AdapterStore =      require(utils.controllerDir + '/lib/session.js')(session, adapter.config.ttl);
                password =          require(utils.controllerDir + '/lib/password.js');
                passport =          require('passport');
                LocalStrategy =     require('passport-local').Strategy;
                flash =             require('connect-flash'); // TODO report error to user

                store = new AdapterStore({adapter: adapter});

                passport.use(new LocalStrategy(
                    function (username, password, done) {
                        if (bruteForce[username] && bruteForce[username].errors > 4) {
                            var minutes = (new Date().getTime() - bruteForce[username].time);
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
                        adapter.checkPassword(username, password, function (res) {
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
                passport.serializeUser(function (user, done) {
                    done(null, user);
                });

                passport.deserializeUser(function (user, done) {
                    done(null, user);
                });

                server.app.use(cookieParser());
                server.app.use(bodyParser.urlencoded({
                    extended: true
                }));
                server.app.use(bodyParser.json());
                server.app.use(session({
                    secret: settings.secret,
                    saveUninitialized: true,
                    resave: true,
                    store:  store
                }));
                server.app.use(passport.initialize());
                server.app.use(passport.session());
                server.app.use(flash());

                server.app.post('/login', function (req, res, next) {
                    var redirect = '/';
                    if (req.body.origin) {
                        var parts = req.body.origin.split('=');
                        if (parts[1]) {
                            redirect = decodeURIComponent(parts[1]);
                        }
                    }
                    passport.authenticate('local', {
                        successRedirect: redirect,
                        failureRedirect: '/login/index.html' + req.body.origin + (req.body.origin ? '&error' : '?error'),
                        failureFlash:    'Invalid username or password.'
                    })(req, res, next);
                });

                server.app.get('/logout', function (req, res) {
                    req.logout();
                    res.redirect('/login/index.html');
                });

                // route middleware to make sure a user is logged in
                server.app.use(function (req, res, next) {
                    if (req.isAuthenticated() ||
                        /^\/login\//.test(req.originalUrl) ||
                        /\.ico$/.test(req.originalUrl)
                    ) {
                        return next();
                    }
                    res.redirect('/login/index.html?href=' + encodeURIComponent(req.originalUrl));
                });
            } else {
                server.app.get('/login', function (req, res) {
                    res.redirect('/');
                });
                server.app.get('/logout', function (req, res) {
                    res.redirect('/');
                });
            }

            // send log files
            server.app.get('/log/*', function (req, res) {
                var parts = req.url.split('/');
                parts = parts.splice(2);
                var transport = parts.shift();
                var filename = parts.join('/');
                var config = adapter.systemConfig;
                // detect file log
                if (config && config.log && config.log.transport) {
                    if (config.log.transport.hasOwnProperty(transport) && config.log.transport[transport].type === 'file') {
                        path = path || require('path');

                        if (config.log.transport[transport].filename) {
                            parts = config.log.transport[transport].filename.replace(/\\/g, '/').split('/');
                            parts.pop();
                            filename = path.join(parts.join('/'), filename);
                        } else {
                            filename = path.join('log/', filename) ;
                        }

                        if (filename[0] !== '/' && !filename.match(/^\W:/)) {
                            filename = path.normalize(__dirname + '/../../../') + filename;
                        }

                        if (fs.existsSync(filename)) {
                            var stat = fs.lstatSync(filename);
                            if (stat.size > 2 * 1024 * 1024) {
                                res.sendFile(filename);
                            } else {
                                res.send(decorateLogFile(filename));
                            }

                            return;
                        }
                    }
                }
                res.status(404).send('File ' + filename + ' not found');
            });
            var appOptions = {};
            if (settings.cache) {
                appOptions.maxAge = 30758400000;
            }

            if (settings.tmpPathAllow && settings.tmpPath) {
                server.app.use('/tmp/', express.static(settings.tmpPath, {maxAge: 0}));
                fileUpload = fileUpload || require('express-fileupload');
                server.app.use(fileUpload());
                server.app.post('/upload', function (req, res) {
                    if (!req.files) {
                        return res.status(400).send('No files were uploaded.');
                    }

                    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
                    var myFile;
                    for (var name in req.files) {
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
                        myFile.mv(settings.tmpPath + '/restore.iob', function (err) {
                            if (err)
                                return res.status(500).send(err);

                            res.send('File uploaded!');
                        });
                    } else {
                        return res.status(500).send('File not uploaded');
                    }
                });
            }

            if (!fs.existsSync(__dirname + '/../www')) {
                server.app.use('/', function (req, res) {
                    res.send('This adapter cannot be installed directly from github.<br>You must install it from npm.<br>Write for that <i>"npm install iobroker.admin"</i> in according directory.');
                });
            } else {
                server.app.use('/', express.static(__dirname + '/../www', appOptions));
            }

            // reverse proxy with url rewrite for couchdb attachments in <adapter-name>.admin
            server.app.use('/adapter/', function (req, res) {

                // Example: /example/?0
                var url = req.url;

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
                            var ss = new Stream();
                            ss.pipe = function (dest) {
                                dest.write('File not found');
                            };

                            ss.pipe(res);
                        }
                    } catch (e) {
                        var s = new Stream();
                        s.pipe = function (dest) {
                            dest.write('File not found: ' + e);
                        };

                        s.pipe(res);
                    }
                    return;
                }
                url = url.split('/');
                // Skip first /
                url.shift();
                // Get ID
                var id = url.shift() + '.admin';
                url = url.join('/');
                var pos = url.indexOf('?');
                if (pos !== -1) {
                    url = url.substring(0, pos);
                }
                adapter.readFile(id, url, null, function (err, buffer, mimeType) {
                    if (!buffer || err) {
                        res.contentType('text/html');
                        res.status(404).send('File ' + url + ' not found');
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
            process.exit(1);
        }

        if (server.server) {
            settings.port = parseInt(settings.port, 10);

            adapter.getPort(settings.port, function (port) {
                if (port !== settings.port && !adapter.config.findNextPort) {
                    adapter.log.error('port ' + settings.port + ' already in use');
                    process.exit(1);
                }
                server.server.listen(port, settings.bind);

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
