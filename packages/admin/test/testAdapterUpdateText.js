const expect = require('chai').expect;
const { getAdapterUpdateText } = require('../build-backend/lib/translations');

describe('Test getAdapterUpdateText function', function () {
    it('should use "Adapter" prefix for regular adapters', function () {
        const result = getAdapterUpdateText({
            lang: 'en',
            adapter: 'admin',
            installedVersion: '7.0.0',
            newVersion: '7.1.0'
        });

        expect(result).to.equal('Adapter admin can be updated from 7.0.0 to 7.1.0.');
    });

    it('should use "The" prefix for js-controller', function () {
        const result = getAdapterUpdateText({
            lang: 'en',
            adapter: 'js-controller',
            installedVersion: '6.0.8',
            newVersion: '6.0.9'
        });

        expect(result).to.equal('The js-controller can be updated from 6.0.8 to 6.0.9.');
    });

    it('should work with different languages for regular adapters', function () {
        const result = getAdapterUpdateText({
            lang: 'de',
            adapter: 'ping',
            installedVersion: '1.0.0',
            newVersion: '1.1.0'
        });

        expect(result).to.equal('Adapter ping kann von 1.0.0 auf 1.1.0 aktualisiert werden.');
    });

    it('should work with different languages for js-controller', function () {
        const result = getAdapterUpdateText({
            lang: 'de',
            adapter: 'js-controller',
            installedVersion: '6.0.8',
            newVersion: '6.0.9'
        });

        expect(result).to.equal('Der js-controller kann von 6.0.8 auf 6.0.9 aktualisiert werden.');
    });

    it('should handle all supported languages for js-controller', function () {
        const languages = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];
        
        languages.forEach(lang => {
            const result = getAdapterUpdateText({
                lang,
                adapter: 'js-controller',
                installedVersion: '6.0.8',
                newVersion: '6.0.9'
            });

            // Should not contain "Adapter" prefix for js-controller
            expect(result).to.not.match(/^Adapter\s/);
            // Should contain the version information
            expect(result).to.include('6.0.8');
            expect(result).to.include('6.0.9');
            expect(result).to.include('js-controller');
        });
    });

    it('should handle all supported languages for regular adapters', function () {
        const languages = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];
        
        languages.forEach(lang => {
            const result = getAdapterUpdateText({
                lang,
                adapter: 'admin',
                installedVersion: '7.0.0',
                newVersion: '7.1.0'
            });

            // Should contain "Adapter" prefix for regular adapters (or equivalent in other languages)
            // We'll check more generally that it contains the necessary information
            expect(result).to.include('7.0.0');
            expect(result).to.include('7.1.0');
            expect(result).to.include('admin');
        });
    });
});