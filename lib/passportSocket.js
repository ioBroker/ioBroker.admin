// Originally taken from here: https://github.com/jfromaniello/passport.socketio/blob/master/lib/index.js
// Copyright Licensed under the MIT-License. 2012-2013 José F. Romaniello.

function parseCookie(auth, cookieHeader) {
    const cookieParser = auth.cookieParser(auth.secret);
    const req = {
        headers: {
            cookie: cookieHeader
        }
    };

    let result;

    cookieParser(req, {}, err => {
        if (err) {
            throw err;
        }
        result = req.signedCookies || req.cookies;
    });

    return result;
}

function getQuery(url) {
    const query = url.split('?')[1] || '';
    const parts = query.split('&');
    const result = {};
    for (let p = 0; p < parts.length; p++) {
        const parts1 = parts[p].split('=');
        result[parts1[0]] = parts1[1];
    }
    return result;
}

function authorize(options) {
    const defaults = {
        key:          'connect.sid',
        secret:       null,
        store:        null,
        userProperty: 'user'
    };

    const auth = Object.assign({}, defaults, options);

    if (!auth.passport) {
        throw new Error('passport is required to use require(\'passport\'), please install passport');
    }

    if (!auth.cookieParser) {
        throw new Error('cookieParser is required use require(\'cookie-parser\'), connect.cookieParser or express.cookieParser');
    }

    return function (data, accept) {
        data.query = getQuery(data.url);

        if (options.checkUser && data.query.user && data.query.pass) {
            return options.checkUser(data.query.user, data.query.pass, (error, result) => {
                if (error) {
                    return auth.fail(data, 'Cannot check user', false, accept);
                } else if (!result) {
                    return auth.fail(data, 'User not found', false, accept);
                } else {
                    data[auth.userProperty] = result;
                    data[auth.userProperty].logged_in = true;
                    auth.success(data, accept);
                }
            });
        }

        data.cookie = parseCookie(auth, data.headers.cookie || '');
        data.sessionID = data.cookie[auth.key] || '';
        data[auth.userProperty] = {
            logged_in: false
        };

        auth.store.get(data.sessionID, (err, session) => {
            if (err) {
                return auth.fail(data, 'Error in session store:\n' + err.message, true, accept);
            } else
            if (!session) {
                return auth.fail(data, 'No session found', false, accept);
            } else
            if (!session[auth.passport._key]) {
                return auth.fail(data, 'Passport was not initialized', true, accept);
            }

            const userKey = session[auth.passport._key].user;

            if (typeof userKey === 'undefined') {
                return auth.fail(data, 'User not authorized through passport. (User Property not found)', false, accept);
            }

            data[auth.userProperty] = userKey;
            data[auth.userProperty].logged_in = true;
            auth.success(data, accept);
        });
    };
}

exports.authorize = authorize;
