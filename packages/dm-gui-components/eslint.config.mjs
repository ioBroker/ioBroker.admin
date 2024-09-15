import config, { reactConfig } from '@iobroker/eslint-config';

// disable temporary the rule 'jsdoc/require-param' and enable 'jsdoc/require-jsdoc'
config.forEach(rule => {
    if (rule?.plugins?.jsdoc) {
        rule.rules['jsdoc/require-jsdoc'] = 'off';
        rule.rules['jsdoc/require-param'] = 'off';
    }
});

export default [...config, ...reactConfig];
