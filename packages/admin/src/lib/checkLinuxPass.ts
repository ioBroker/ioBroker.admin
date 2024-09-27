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
];

// Function to execute 'su' command and provide password
export default function checkLinuxPassword(login: string, password: string): Promise<boolean> {
    // Check the os
    if (process.platform !== 'linux') {
        console.error('This function is only available on Linux');
        return Promise.resolve(false);
    }

    if (login === 'Password:' || login === 'failure') {
        console.error('This function requires a login name');
        return Promise.resolve(false);
    }

    return new Promise(resolve => {
        const su = spawn('su', [login]);
        let result = false;
        let responseTimeout = setTimeout(() => {
            responseTimeout = null;
            su.kill();
        }, 3000);

        function _checkPassword(data: string): void {
            if (data.toLowerCase().includes('password')) {
                su.stdin.write(`${password}\n`);
                if (data === login) {
                    result = true;
                    su.kill();
                }
            }
            if (data.toLowerCase().includes('failure')) {
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

/** Check if the system has well-known passwords */
export async function checkWellKnownPasswords(): Promise<string | null> {
    // Check the os
    if (process.platform !== 'linux') {
        console.error('This function is only available on Linux');
        throw new Error('This function is only available on Linux');
    }
    for (const [login, password] of WELL_KNOWN_CREDENTIALS) {
        if (await checkLinuxPassword(login, password)) {
            return password;
        }
    }
    return null;
}
