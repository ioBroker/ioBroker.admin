const engineHelper = require('./engineHelper');
const guiHelper = require('./guiHelper');

let gPage;

describe('admin-gui', () => {
    before(async function (){
        this.timeout(180000);

        // install js-controller, web and vis-2-beta
        await engineHelper.startIoBroker();
        const { page } = await guiHelper.startBrowser(process.env.CI === 'true');
        gPage = page;
    });

    it('Check all widgets', async function (){
        this.timeout(500000);
        await gPage.waitForSelector('a[href="/#easy"]', { timeout: 500000 });
    });

    after(async function () {
        this.timeout(5000);
        await guiHelper.stopBrowser();
        console.log('BROWSER stopped');
        await engineHelper.stopIoBroker();
        console.log('ioBroker stopped');
    });
});