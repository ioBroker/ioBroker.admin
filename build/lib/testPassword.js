"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_readline_1 = require("node:readline");
const checkLinuxPass_1 = require("./checkLinuxPass");
const node_stream_1 = require("node:stream");
let maskOutput = false;
// this file is used for test on different locales
// node /opt/iobroker/node_modules/iobroker.admin/build/lib/testPassword
const mutableStdout = new node_stream_1.Writable({
    write: (_chunk, _encoding, callback) => {
        if (maskOutput) {
            process.stdout.write('*');
        }
        else {
            process.stdout.write(_chunk, _encoding);
        }
        callback();
    },
});
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(0, checkLinuxPass_1.checkWellKnownPasswords)().then(found => {
    if (found) {
        console.log(`Found well-known password: ${JSON.stringify(found)}`);
        // enter new password
        const rl = (0, node_readline_1.createInterface)({
            input: process.stdin,
            output: mutableStdout,
            terminal: true,
        });
        rl.question(`Enter new password for "${found.login} (min 6 chars): `, (password) => {
            maskOutput = false;
            password = password.replace(/\r/g, '').replace(/\n/g, '');
            if (password.length < 6) {
                console.error('password is too short');
                process.exit(1);
            }
            rl.question(`Repeat new password for "${found.login}: `, (passwordRepeat) => {
                maskOutput = false;
                passwordRepeat = passwordRepeat.replace(/\r/g, '').replace(/\n/g, '');
                if (password !== passwordRepeat) {
                    console.error('passwords are not equal');
                    process.exit(1);
                }
                rl.close();
                void (0, checkLinuxPass_1.setLinuxPassword)(found.login, found.password, password).then(result => {
                    console.log(`Result: ${JSON.stringify(result)}`);
                });
            });
            maskOutput = true;
        });
        maskOutput = true;
    }
    else {
        console.log(`No well known passwords found`);
        process.exit(0);
    }
});
//# sourceMappingURL=testPassword.js.map