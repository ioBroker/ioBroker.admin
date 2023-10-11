const https = require('https');
const http = require('http');
const { URL } = require('url');

function _getPublicIP() {
    return new Promise((resolve, reject) => {
        https
            .get('https://ip.iobroker.in', res => {
                const data = [];

                res.on('data', chunk => data.push(chunk));

                res.on('end', () => resolve(Buffer.concat(data).toString()));
            })
            .on('error', err => reject(err.message));
    });
}

function _checkURL(url) {
    return new Promise((resolve, reject) => {
        const oldState = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        const urlParsed = new URL(url);

        const options = {
            host: urlParsed.hostname, // server uses this
            port: urlParsed.port, // server uses this

            method: 'GET', // client uses this
            path: urlParsed.pathname, // client uses this
            timeout: 2000, // timeout in 2 seconds if the server does not respond in time
        };

        const req = (url.startsWith('https') ? https : http).get(options, res => {
            const data = [];

            console.log('Status Code:', res.statusCode);

            res.on('data', chunk => data.push(chunk));

            res.on('end', () => {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = oldState;
                if (res.statusCode === 200) {
                    reject(new Error(`The URL ${url} reachable from internet without any protection!`));
                } else {
                    resolve(null);
                }
            });
        });
        req.on('timeout', () => {
            // Source: https://github.com/nodejs/node/blob/master/test/parallel/test-http-client-timeout-option.js#L27
            req.destroy();
            resolve(null);
        });

        req.on('error', () => {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = oldState;
            resolve(null);
        });
    });
}

async function checkPublicIP(port) {
    let publicIP;
    // we check the public ip address of the server
    try {
        publicIP = await _getPublicIP();
    } catch (e) {
        // Ignore. We just don't know the public IP
    }

    if (publicIP) {
        // check http://publicIP:port
        await _checkURL(`http://${publicIP}:${port}`);

        // check https://publicIP:port
        await _checkURL(`https://${publicIP}:${port}`);

        // check http://publicIP:80
        if (port !== 80) {
            await _checkURL(`http://${publicIP}:80`);
        }
        if (port !== 443) {
            await _checkURL(`https://${publicIP}:443`);
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = { checkPublicIP };
} else {
    // otherwise start the instance directly
    checkPublicIP(8081).catch(e => console.error(e));
}
