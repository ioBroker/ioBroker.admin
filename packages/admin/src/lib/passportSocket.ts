// Originally taken from here: https://github.com/jfromaniello/passport.socketio/blob/master/lib/index.js
// Copyright Licensed under the MIT-License. 2012-2013 José F. Romaniello.

function parseCookie(
    auth: {
        cookieParser: (secret: string) => (req: any, options: Record<string, any>, cb: (err: string) => void) => void;
        secret: string;
    },
    cookieHeader: string,
): Record<string, string> {
    const cookieParser = auth.cookieParser(auth.secret);
    const req: {
        signedCookies?: Record<string, string>;
        cookies?: Record<string, string>;
        headers: {
            cookie: string;
        };
    } = {
        headers: {
            cookie: cookieHeader,
        },
    };

    let result;

    cookieParser(req, {}, err => {
        if (err) {
            throw new Error(err);
        }
        result = req.signedCookies || req.cookies;
    });

    return result;
}

function getQuery(url: string): Record<string, string> {
    const query = url.split('?')[1] || '';
    const parts = query.split('&');
    const result: Record<string, string> = {};
    for (let p = 0; p < parts.length; p++) {
        const parts1 = parts[p].split('=');
        result[parts1[0]] = parts1[1];
    }
    return result;
}

function authorize(options: {
    passport: { _key: string };
    cookieParser: (secret: string) => (req: any, options: Record<string, any>, cb: (err: string) => void) => void;
    checkUser?: (user: string, pass: string, cb: (error: Error | null, result: Record<string, any>) => void) => void;
    fail: (data: any, message: string, critical: boolean, accept: (err: Error | null) => void) => void;
    success: (data: any, accept: (err: Error | null) => void) => void;
}) {
    const defaults: { key: string; secret: null | string; store: any; userProperty: 'user' } = {
        key: 'connect.sid',
        secret: null,
        store: null,
        userProperty: 'user',
    };

    const auth = Object.assign({}, defaults, options);

    if (!auth.passport) {
        throw new Error("passport is required to use require('passport'), please install passport");
    }

    if (!auth.cookieParser) {
        throw new Error(
            "cookieParser is required use require('cookie-parser'), connect.cookieParser or express.cookieParser",
        );
    }

    return function (
        data: {
            headers: {
                cookie: string;
            };
            url: string;
            query: Record<string, string>;
            cookie: Record<string, string>;
            sessionID: string;
            user: { logged_in: boolean };
        },
        accept: (err: Error | null) => void,
    ) {
        data.query = getQuery(data.url);

        if (options.checkUser && data.query.user && data.query.pass) {
            return options.checkUser(
                data.query.user,
                data.query.pass,
                (error: Error | null, result?: { logged_in: boolean }) => {
                    if (error) {
                        return auth.fail(data, 'Cannot check user', false, accept);
                    }
                    if (!result) {
                        return auth.fail(data, 'User not found', false, accept);
                    }

                    data[auth.userProperty] = result;
                    data[auth.userProperty].logged_in = true;
                    auth.success(data, accept);
                },
            );
        }

        data.cookie = parseCookie(auth, data.headers.cookie || '');
        data.sessionID = data.cookie[auth.key] || '';
        data[auth.userProperty] = {
            logged_in: false,
        };

        auth.store.get(data.sessionID, (err: Error, session: Record<string, { user: { logged_in: boolean } }>) => {
            if (err) {
                return auth.fail(data, `Error in session store:\n${err.message}`, true, accept);
            }
            if (!session) {
                return auth.fail(data, 'No session found', false, accept);
            }
            if (!session[auth.passport._key]) {
                return auth.fail(data, 'Passport was not initialized', true, accept);
            }

            const userKey = session[auth.passport._key].user;

            if (typeof userKey === 'undefined') {
                return auth.fail(
                    data,
                    'User not authorized through passport. (User Property not found)',
                    false,
                    accept,
                );
            }

            data[auth.userProperty] = userKey;
            data[auth.userProperty].logged_in = true;
            auth.success(data, accept);
        });
    };
}

exports.authorize = authorize;
