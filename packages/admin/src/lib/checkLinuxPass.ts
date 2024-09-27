import { spawn } from 'child_process';

const WELL_KNOWN_CREDENTIALS = [
    ['root', 'root'],
    ['admin', 'admin'],
    ['admin', 'default'],
    ['root', 'default'],
    ['iob', '2024=smart!'],
    ['pi', 'pi'],
    ['pi', 'raspberry'],
    ['pi', 'default'],
    ['pi', 'pi12345'],
];

// Function to execute 'su' command and provide password
function checkLinuxPassword(login: string, password: string): Promise<boolean> {
    // Check the os
    if (process.platform !== 'linux') {
        console.error('This function is only available on Linux');
        return Promise.resolve(false);
    }

    if (login === 'Password:' || login === 'failure') {
        console.error('This function requires a login name');
        return Promise.resolve(false);
    }
    console.log(`\n[LOG] -------- Check ${login}/${password}`);

    return new Promise(resolve => {
        const su = spawn('su', [login]);
        let result = false;
        let responseTimeout = setTimeout(() => {
            responseTimeout = null;
            su.kill();
        }, 3000);

        function _checkPassword(data: string): void {
            data = data.replace(/\r/g, ' ').replace(/\n/g, ' ').trim();
            console.log(`[STDX] "${data}"`);
            if (data.endsWith(':')) {
                su.stdin.write(`${password}\n`);
                setTimeout(() => {
                    console.log(`[LOG] write whoami`);
                    su.stdin.write(`whoami\n`);
                }, 50);
            } else if (data === login) {
                result = true;
                su.kill();
                // todo: add ru, uk, pt,....
            } else if (data.toLowerCase().includes('failure') || data.toLowerCase().includes('fehler')) {
                su.kill();
            }
        }

        // Listen for data on stdout
        su.stdout.on('data', data => _checkPassword(data.toString()));

        // Listen for data on stderr
        su.stderr.on('data', data => _checkPassword(data.toString()));

        // Listen for the close event
        su.on('close', () => {
            console.log(`[LOG] -------- closed with result: ${result}\n`);
            responseTimeout && clearTimeout(responseTimeout);
            responseTimeout = null;
            resolve(result);
        });
    });
}

/** Check if the system has well-known passwords */
export async function checkWellKnownPasswords(): Promise<{ login: string; password: string } | null> {
    // Check the os
    if (process.platform !== 'linux') {
        console.error('This function is only available on Linux');
        throw new Error('This function is only available on Linux');
    }
    for (const [login, password] of WELL_KNOWN_CREDENTIALS) {
        if (await checkLinuxPassword(login, password)) {
            return { login, password };
        }
    }
    return null;
}

/*
pi@NanoPi-R5S:/opt$ su pi
Password: [OLD PASSWORD]\n

pi@NanoPi-R5S:/opt$ passwd
Changing password for pi.
Current password: [OLD PASSWORD]\n

New password: [NEW PASSWORD]\n

Retype new password: [NEW PASSWORD]\n

The password has not been changed.

New password:
Retype new password:

You must choose a longer password.

New password:
Retype new password:

passwd: password updated successfully
pi@NanoPi-R5S:/opt$ exit
*/

/*
Ändern des Passworts für pi.
Geben Sie das aktuelle Passwort ein:
passwd: Fehler beim Ändern des Authentifizierungstoken
passwd: Passwort nicht geändert
pi@NanoPi-R5S:~$ passwd pi
Ändern des Passworts für pi.
Geben Sie das aktuelle Passwort ein:
Geben Sie ein neues Passwort ein:
Geben Sie das neue Passwort erneut ein:
passwd: Passwort erfolgreich geändert

 */
const STATES = {
    S_0_SU_WAIT_PROMPT: 0,
    S_1_PASSWD_WAIT_PROMPT_CURRENT_PASSWORD: 1,
    S_2_PASSWD_WAIT_PROMPT_NEW_PASSWORD: 2,
    S_3_PASSWD_WAIT_PROMPT_RETYPE_NEW_PASSWORD: 3,
    S_4_PASSWD_WAIT_RESPONSE: 4,
};

export function setLinuxPassword(login: string, oldPassword: string, newPassword: string): Promise<true | string> {
    return new Promise(resolve => {
        if (WELL_KNOWN_CREDENTIALS.find(item => item[0] === newPassword || item[1] === newPassword)) {
            resolve('New password is well-known too');
            return;
        }

        const su = spawn('su', [login]);
        let result: true | string = 'Cannot change password';
        let responseTimeout = setTimeout(() => {
            responseTimeout = null;
            result = 'Timeout';
            su.kill();
        }, 3000);

        let state = STATES.S_0_SU_WAIT_PROMPT;

        function _checkPassword(data: string): void {
            data = data.replace(/\r/g, ' ').replace(/\n/g, ' ').trim();
            console.log(`[STDX]: ${data}`);
            if (state === STATES.S_0_SU_WAIT_PROMPT) {
                // Password: [OLD PASSWORD]\n
                if (data.endsWith(':')) {
                    console.log(`[LOG]: received request to enter old password`);
                    su.stdin.write(`${oldPassword}\n`);
                    setTimeout(() => {
                        state = STATES.S_1_PASSWD_WAIT_PROMPT_CURRENT_PASSWORD;
                        su.stdin.write(`passwd\n`);
                    }, 50);
                    // todo: add ru, uk, pt,....
                } else if (data.toLowerCase().includes('failure') || data.toLowerCase().includes('fehler')) {
                    console.log(`[LOG]: received failure message`);
                    result = 'Old password not accepted';
                    su.kill();
                }
            } else if (state === STATES.S_1_PASSWD_WAIT_PROMPT_CURRENT_PASSWORD) {
                // Changing password for pi.
                // Current password: [OLD PASSWORD]\n
                if (data.endsWith(':')) {
                    console.log(`[LOG]: received request to enter new password`);
                    state = STATES.S_2_PASSWD_WAIT_PROMPT_NEW_PASSWORD;
                    su.stdin.write(`${oldPassword}\n`);
                }
            } else if (state === STATES.S_2_PASSWD_WAIT_PROMPT_NEW_PASSWORD) {
                // New password: [NEW PASSWORD]\n
                if (data.endsWith(':')) {
                    console.log(`[LOG]: received request to enter new password`);
                    state = STATES.S_3_PASSWD_WAIT_PROMPT_RETYPE_NEW_PASSWORD;
                    su.stdin.write(`${newPassword}\n`);
                }
            } else if (state === STATES.S_3_PASSWD_WAIT_PROMPT_RETYPE_NEW_PASSWORD) {
                // Retype new password: [NEW PASSWORD]\n
                if (data.endsWith(':')) {
                    console.log(`[LOG]: received request to repeat new password`);
                    state = STATES.S_4_PASSWD_WAIT_RESPONSE;
                    su.stdin.write(`${newPassword}\n`);
                }
            } else if (state === STATES.S_4_PASSWD_WAIT_RESPONSE) {
                // todo: add ru, uk, pt,....
                if (data.toLowerCase().includes('successfully') || data.toLowerCase().includes('erfolgreich')) {
                    result = true;
                } else {
                    // failure
                    result = data;
                }
                su.kill();
            }
        }

        // Listen for data on stdout
        su.stdout.on('data', data => _checkPassword(data.toString()));

        // Listen for data on stderr
        su.stderr.on('data', data => _checkPassword(data.toString()));

        // Listen for the close event
        su.on('close', () => {
            responseTimeout && clearTimeout(responseTimeout);
            responseTimeout = null;
            resolve(result);
        });
    });
}
