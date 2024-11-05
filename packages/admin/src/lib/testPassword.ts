import { createInterface } from 'node:readline';
import { setLinuxPassword, checkWellKnownPasswords } from './checkLinuxPass';
import { Writable } from 'node:stream';

let maskOutput = false;
// this file is used for test on different locales
// node /opt/iobroker/node_modules/iobroker.admin/build-backend/lib/testPassword
const mutableStdout = new Writable({
    write: (_chunk, _encoding, callback) => {
        if (maskOutput) {
            process.stdout.write('*');
        } else {
            process.stdout.write(_chunk, _encoding);
        }
        callback();
    },
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
checkWellKnownPasswords().then(found => {
    if (found) {
        console.log(`Found well-known password: ${JSON.stringify(found)}`);
        // enter new password
        const rl = createInterface({
            input: process.stdin,
            output: mutableStdout,
            terminal: true,
        });
        rl.question(`Enter new password for "${found.login} (min 6 chars): `, (password: string) => {
            maskOutput = false;
            password = password.replace(/\r/g, '').replace(/\n/g, '');
            if (password.length < 6) {
                console.error('password is too short');
                process.exit(1);
            }
            rl.question(`Repeat new password for "${found.login}: `, (passwordRepeat: string) => {
                maskOutput = false;
                passwordRepeat = passwordRepeat.replace(/\r/g, '').replace(/\n/g, '');
                if (password !== passwordRepeat) {
                    console.error('passwords are not equal');
                    process.exit(1);
                }
                rl.close();
                void setLinuxPassword(found.login, found.password, password).then(result => {
                    console.log(`Result: ${JSON.stringify(result)}`);
                });
            });
            maskOutput = true;
        });
        maskOutput = true;
    } else {
        console.log(`No well known passwords found`);
        process.exit(0);
    }
});
