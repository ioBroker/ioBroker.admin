const engineHelper = require('./engineHelper');
const guiHelper = require('@iobroker/legacy-testing/guiHelper');

let gPage;
const rootDir = `${__dirname}/../`;

describe('admin-gui', () => {
    before(async function () {
        this.timeout(240_000);

        // install js-controller, web and vis-2-beta
        await engineHelper.startIoBroker();
        const { page } = await guiHelper.startBrowser(null, rootDir, process.env.CI === 'true', '/');
        gPage = page;
    });

    it('Check all widgets', async function () {
        this.timeout(120_000);
        await gPage.waitForSelector('a[href="/#easy"]', { timeout: 120_000 });
        await guiHelper.screenshot(rootDir, gPage, '01_started');
    });

    after(async function () {
        this.timeout(5_000);
        await guiHelper.stopBrowser();
        console.log('BROWSER stopped');
        await engineHelper.stopIoBroker();
        console.log('ioBroker stopped');
    });
});
