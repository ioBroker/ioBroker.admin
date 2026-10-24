const assert = require('node:assert');

// Utils.ts of the frontend has no runtime imports, so Node can load it directly by stripping the types
describe('Test license URLs of an adapter', function () {
    let extractLicenseTextUrl;
    let extractUrlLink;

    before(async function () {
        if (!process.features.typescript) {
            this.skip();
        }
        ({ extractLicenseTextUrl, extractUrlLink } = await import('../src-admin/src/components/Adapters/Utils.ts'));
    });

    const commercial = {
        name: 'vis-2',
        extIcon:
            'https://raw.githubusercontent.com/ioBroker/ioBroker.vis-2/master/packages/iobroker.vis-2/admin/vis-2.png',
        licenseInformation: {
            type: 'commercial',
            license: 'CC-BY-NC-4.0',
            link: 'https://iobroker.net/www/pricing',
        },
    };

    it('should load the license text from the repository, not from licenseInformation.link', function () {
        assert.strictEqual(
            extractLicenseTextUrl(commercial),
            'https://raw.githubusercontent.com/ioBroker/ioBroker.vis-2/master/LICENSE',
        );
    });

    it('should link the license icon to licenseInformation.link', function () {
        assert.strictEqual(extractUrlLink(commercial), 'https://iobroker.net/www/pricing');
    });

    it('should link the license icon to the license text without licenseInformation.link', function () {
        const adapter = { ...commercial, licenseInformation: { type: 'free', license: 'MIT' } };
        assert.strictEqual(extractUrlLink(adapter), extractLicenseTextUrl(adapter));
    });

    it('should use the deprecated licenseUrl if it names the raw LICENSE', function () {
        const licenseUrl = 'https://raw.githubusercontent.com/someone/ioBroker.x/main/LICENSE';
        assert.strictEqual(extractLicenseTextUrl({ ...commercial, licenseUrl }), licenseUrl);
    });

    it('should derive the LICENSE from the readme without extIcon', function () {
        assert.strictEqual(
            extractLicenseTextUrl({ name: 'x', readme: 'https://github.com/someone/ioBroker.x/blob/main/README.md' }),
            'https://raw.githubusercontent.com/someone/ioBroker.x/main/LICENSE',
        );
    });

    it('should return an empty string if there is nothing to derive the LICENSE from', function () {
        assert.strictEqual(extractLicenseTextUrl(undefined), '');
        assert.strictEqual(extractUrlLink(undefined), '');
        assert.strictEqual(extractLicenseTextUrl({ name: 'x', licenseInformation: commercial.licenseInformation }), '');
        assert.strictEqual(extractLicenseTextUrl({ name: 'x', extIcon: 'https://example.com/x.png' }), '');
    });
});
