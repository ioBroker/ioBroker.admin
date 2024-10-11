/**
 * Print the ioBroker welcome screen to the developer console.
 */
export function printPrompt(): void {
    const prompt = `
██╗ ██████╗ ██████╗ ██████╗  ██████╗ ██╗  ██╗███████╗██████╗ 
██║██╔═══██╗██╔══██╗██╔══██╗██╔═══██╗██║ ██╔╝██╔════╝██╔══██╗
██║██║   ██║██████╔╝██████╔╝██║   ██║█████╔╝ █████╗  ██████╔╝
██║██║   ██║██╔══██╗██╔══██╗██║   ██║██╔═██╗ ██╔══╝  ██╔══██╗
██║╚██████╔╝██████╔╝██║  ██║╚██████╔╝██║  ██╗███████╗██║  ██║
╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
`;

    console.log(prompt);
    console.log(
        'Nice to see you here! :) Join our dev community here https://github.com/ioBroker/ioBroker or here https://github.com/iobroker-community-adapters',
    );
    console.log('Help us to create open source project with reactJS!');
    console.log('See you :)');
}

export default printPrompt;
