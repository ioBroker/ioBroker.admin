const engineHelper = require('./engineHelper');
const guiHelper = require('./guiHelper');

let gPage;

async function screenshot(page, fileName) {
    page = page || gPage;
    await page.screenshot({path: `${__dirname}/../tmp/screenshots/${fileName}.png`});
}

describe('admin-gui', () => {
    before(async function () {
        this.timeout(240_000);

        // install js-controller, web and vis-2-beta
        await engineHelper.startIoBroker();
        const { page } = await guiHelper.startBrowser(process.env.CI === 'true');
        gPage = page;
    });

    it('Check all widgets', async function () {
        this.timeout(120_000);
        await gPage.waitForSelector('a[href="/#easy"]', { timeout: 120_000 });
        await screenshot(gPage, '00_started');
    });

    after(async function () {
        this.timeout(5_000);
        await guiHelper.stopBrowser();
        console.log('BROWSER stopped');
        await engineHelper.stopIoBroker();
        console.log('ioBroker stopped');
    });
});
