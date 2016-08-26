function createServer(app, settings, certificates, leSettings, log) {
    var server;

    if (settings.secure) {
        if (leSettings && (!leSettings.email || !leSettings.email) && settings.leEnabled) {
            log.error('Please specify the email address and domains to use Let\'s Encrypt certificates!');
        }

        if (leSettings && leSettings.email && leSettings.domains && settings.leEnabled) {
            var utils = require(__dirname + '/utils'); // Get common adapter utils
            var tools = require(utils.controllerDir + '/lib/tools');
            var tls   = require('tls');
            var fs    = require('fs');
            var LEX   = require('letsencrypt-express');
            var leDir;
            var logDir;

            var configPath = tools.getConfigFileName().replace(/\\/g, '/');
            var parts = configPath.split('/');
            parts.pop();
            configPath = parts.join('/');

            logDir = configPath + '/../log';

            if (leSettings.path && (leSettings.path[0] === '/' || leSettings.path.match(/^[A-Za-z]:/))) {
                leDir = leSettings.path;
            } else {
                leDir = configPath + '/' + (leSettings.path || 'letsencrypt');
            }

            // for lex outputs
            if (!console.debug) console.debug = console.log;

            if (!fs.existsSync(leDir)) fs.mkdirSync(leDir);

            // prepare domains
            if (typeof leSettings.domains === 'string') {
                leSettings.domains = leSettings.domains.split(',');
                for (var d = leSettings.domains.length - 1; d >= 0; d--) {
                    leSettings.domains[d] = leSettings.domains[d].trim();
                    if (!leSettings.domains[d]) leSettings.domainss.splice(d, 1);
                }
            }

            var lex = LEX.create({
                debug:           true,
                configDir:       leDir,
                agreeTos:        true,
                server:          'https://acme-v01.api.letsencrypt.org/directory', //'staging',
                email:           leSettings.email,
                approvedDomains: leSettings.domains,
                log:             function (debug) {
                    if (debug) {
                        var args = Array.prototype.slice.call(arguments);
                        args.shift(); // remove debug argument
                        log.info(console, args);
                    }
                }
            });

            if (settings.leUpdate) {
                // handles acme-challenge and redirects to https
                // used for validation of requests like  http://example.com/.well-known/acme-challenge/BLABALBAL
                require('http').createServer(lex.middleware(function redirectHttps(req, res) {
                    res.setHeader('Location', 'https://' + req.headers.host + req.url);
                    res.statusCode = 302;
                    res.end('<!-- Hello Developer Person! Please use HTTPS instead -->');
                })).listen(leSettings.lePort || 80, function () {
                    log.info('LetsEncrypt challenge server is started on ' + (leSettings.lePort || 80));
                });
            }

            var options    = JSON.parse(JSON.stringify(certificates));
            var defaultTls = tls.createSecureContext(certificates);
            var hostTls;
            var running;

            options.SNICallback = function (hostname, cb) {
                if (leSettings.domains.indexOf(hostname) !== -1) {
                    if (settings.leUpdate) {
                        if (running === true) {
                            cb(null, hostTls || defaultTls);
                        } else
                        if (running) {
                            running.push(cb);
                        } else {
                            running = [cb];
                            return lex.httpsOptions.SNICallback(hostname, function (err, tls) {
                                if (tls) log.debug('Got valid certificates from letsencrypt');
                                if (err) log.error('Cannot get certificates: ' + err);
                                lex.debug = false;
                                hostTls = tls;
                                for (var r = 0; r < running.length; r++) {
                                    running[r](err, tls || defaultTls);
                                }
                                running = true;
                            });
                        }
                    } else {
                        if (!hostTls) {
                            // validate certificates
                            lex.check({domains: leSettings.domains}).then(function (certInfo) {
                                if (certInfo) {
                                    hostTls = tls.createSecureContext({
                                        key:  certInfo.privkey   || certInfo.key,      // privkey.pem
                                        cert: certInfo.fullchain || certInfo.cert,     // fullchain.pem (cert.pem + '\n' + chain.pem)
                                        ca:   certInfo.ca
                                    });
                                    cb(null, hostTls);
                                } else {
                                    log.error('No letsencrypt certificates found in "' + leDir + '"');
                                    cb(null, defaultTls);
                                    // do not register domain
                                    /*
                                    if (!running) {
                                        running = [cb];
                                        lex.letsencrypt.register({
                                            domains:    leSettings.domains,
                                            email:      leSettings.email,
                                            agreeTos:   true
                                        }, function (err, certInfo) {
                                            //log.debug("[LEX] '" + hostname + "' register completed", err && err.stack || null, certInfo);
                                            if ((!err || !err.stack) && !certInfo) {
                                                log.error((new Error('[LEX] SANITY FAIL: no error and yet no certs either')).stack);
                                            }
                                            if (certInfo) {
                                                hostTls = tls.createSecureContext({
                                                    key:  certInfo.privkey   || certInfo.key,      // privkey.pem
                                                    cert: certInfo.fullchain || certInfo.cert,     // fullchain.pem (cert.pem + '\n' + chain.pem)
                                                    ca:   certInfo.ca
                                                });
                                                for (var r = 0; r < running.length; r++) {
                                                    running[r](null, hostTls);
                                                }
                                            } else {
                                                 for (var r = 0; r < running.length; r++) {
                                                     running[r](null, defaultTls);
                                                 }
                                            }
                                            running = true;
                                        });
                                    } else {
                                        if (running === true) {
                                            cb(null, defaultTls);
                                        } else {
                                            running.push(cb);
                                        }
                                    }
                                    */
                                }
                            },
                            function (err) {
                                if (err) log.error(err);
                                cb(null, defaultTls);
                            });
                        } else {
                            cb(null, hostTls);
                        }
                    }
                } else {
                    cb(null, defaultTls);
                }
            };

            server = require('https').createServer(options, lex.middleware(app));
        } else {
            server = require('https').createServer(certificates, app);
        }
    } else {
        server = require('http').createServer(app);
    }

    return server;
}

exports.createServer = createServer;