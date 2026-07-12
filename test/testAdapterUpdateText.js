const assert = require('node:assert');
const { getAdapterUpdateText } = require('../build/lib/translations');

describe('Test getAdapterUpdateText function', function () {
    it('should use "Adapter" prefix for regular adapters', function () {
        const result = getAdapterUpdateText({
            lang: 'en',
            adapter: 'admin',
            installedVersion: '7.0.0',
            newVersion: '7.1.0',
        });

        assert.strictEqual(result, 'Adapter admin can be updated from 7.0.0 to 7.1.0.');
    });

    it('should use "The" prefix for js-controller', function () {
        const result = getAdapterUpdateText({
            lang: 'en',
            adapter: 'js-controller',
            installedVersion: '6.0.8',
            newVersion: '6.0.9',
        });

        assert.strictEqual(result, 'The js-controller can be updated from 6.0.8 to 6.0.9.');
    });

    it('should work with different languages for regular adapters', function () {
        const result = getAdapterUpdateText({
            lang: 'de',
            adapter: 'ping',
            installedVersion: '1.0.0',
            newVersion: '1.1.0',
        });

        assert.strictEqual(result, 'Adapter ping kann von 1.0.0 auf 1.1.0 aktualisiert werden.');
    });

    it('should work with different languages for js-controller', function () {
        const result = getAdapterUpdateText({
            lang: 'de',
            adapter: 'js-controller',
            installedVersion: '6.0.8',
            newVersion: '6.0.9',
        });

        assert.strictEqual(result, 'Der js-controller kann von 6.0.8 auf 6.0.9 aktualisiert werden.');
    });

    it('should handle all supported languages for js-controller', function () {
        const languages = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];

        languages.forEach(lang => {
            const result = getAdapterUpdateText({
                lang,
                adapter: 'js-controller',
                installedVersion: '6.0.8',
                newVersion: '6.0.9',
            });

            // Should not contain "Adapter" prefix for js-controller
            assert.doesNotMatch(result, /^Adapter\s/);
            // Should contain the version information
            assert.ok(result.includes('6.0.8'), `Expected "${result}" to include "6.0.8"`);
            assert.ok(result.includes('6.0.9'), `Expected "${result}" to include "6.0.9"`);
            assert.ok(result.includes('js-controller'), `Expected "${result}" to include "js-controller"`);
        });
    });

    it('should handle all supported languages for regular adapters', function () {
        const languages = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];

        languages.forEach(lang => {
            const result = getAdapterUpdateText({
                lang,
                adapter: 'admin',
                installedVersion: '7.0.0',
                newVersion: '7.1.0',
            });

            // Should contain "Adapter" prefix for regular adapters (or equivalent in other languages)
            // We'll check more generally that it contains the necessary information
            assert.ok(result.includes('7.0.0'), `Expected "${result}" to include "7.0.0"`);
            assert.ok(result.includes('7.1.0'), `Expected "${result}" to include "7.1.0"`);
            assert.ok(result.includes('admin'), `Expected "${result}" to include "admin"`);
        });
    });
});
