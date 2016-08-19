function createServer(app, settings, certificates, leSettings, log) {
    var server;

    if (settings.secure) {
        if ((!leSettings.email || !leSettings.email) && settings.leEnabled) {
            log.error('Please specify the email address and domains to use Let\'s Encrypt certificates!');
        }

        if (leSettings.email && leSettings.domains && settings.leEnabled) {
            var lex = require('letsencrypt-express');

            // prepare domains
            if (typeof leSettings.domains === 'string') {
                leSettings.domains = leSettings.domains.split(',');
                for (var d = leSettings.domains.length - 1; d >= 0; d++) {
                    leSettings.domains[d] = leSettings.domains[d].trim();
                    if (!leSettings.domains[d]) leSettings.domainss.splice(d, 1);
                }
            }

            if (settings.leUpdate) {
                // handles acme-challenge and redirects to https
                require('http').createServer(le.middleware()).listen(settings.leCheckPort || 80, function () {
                    console.log("Listening for ACME http-01 challenges on", this.address());
                });
            }

            server = require('https').createServer(certificates, app);

        } else {
            server = require('https').createServer(certificates, app);
        }
    } else {
        server = require('http').createServer(app);
    }

    return server;
}

exports.createServer = createServer;