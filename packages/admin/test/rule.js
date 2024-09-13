const expect = require('chai').expect;
const semver = require('semver');

function checkCondition(objMessages, oldVersion, newVersion, instances) {
    let messages = null;

    if (objMessages) {
        // const messages = {
        //     "condition": {
        //         "operand": "and",
        //         "rules": [
        //             "oldVersion<=1.0.44",
        //             "newVersion>=1.0.45"
        //         ]
        //     },
        //     "title": {
        //         "en": "Important notice",
        //     },
        //     "text": {
        //         "en": "Main text",
        //     },
        //     "link": "https://iobroker.net/www/pricing",
        //     "buttons": ["agree", "cancel", "ok"],
        //     "linkText" {
        //          "en": "More info",
        //     },
        //     "level": "warn"
        // };

        objMessages.forEach(message => {
            let show = !message.condition || !message.condition.rules;
            if (message.condition && message.condition.rules) {
                const results = (
                    Array.isArray(message.condition.rules) ? message.condition.rules : [message.condition.rules]
                ).map(rule => {
                    // Possible rules:
                    // - "oldVersion<=1.0.44"
                    // - "newVersion>=1.0.45"
                    // - "installed" - any version, same as 'oldVersion>=0.0.0'
                    // - "not-installed" - if adapter is not installed, same as '!'
                    // - "vis-2>=1.0.0"
                    // - "vis"
                    // - "!vis-2"
                    let version;
                    let op;
                    let ver;

                    if (rule.includes('oldVersion')) {
                        version = oldVersion;
                        rule = rule.substring('newVersion'.length);
                    } else if (rule.includes('newVersion')) {
                        version = newVersion;
                        rule = rule.substring('newVersion'.length);
                    } else {
                        if (rule === 'installed') {
                            return !!oldVersion;
                        }
                        if (rule === '!' || rule === 'not-installed') {
                            return !oldVersion;
                        }

                        if (instances) {
                            // it could be the name of required adapter, like vis-2
                            const split = rule.match(/([a-z][-a-z_0-9]+)([!=<>]+)([.\d]+)/);
                            if (split) {
                                // Check that adapter is installed in desired version
                                const instId = Object.keys(instances).find(
                                    id => instances[id]?.common?.name === split[1]
                                );
                                if (instId) {
                                    version = instances[instId].common.version;
                                    op = split[2];
                                    ver = split[3];
                                    try {
                                        if (op === '==') {
                                            return semver.eq(version, ver);
                                        }
                                        if (op === '>') {
                                            return semver.gt(version, ver);
                                        }
                                        if (op === '<') {
                                            return semver.lt(version, ver);
                                        }
                                        if (op === '>=') {
                                            return semver.gte(version, ver);
                                        }
                                        if (op === '<=') {
                                            return semver.lte(version, ver);
                                        }
                                        if (op === '!=') {
                                            return semver.neq(version, ver);
                                        }
                                        console.warn(`Unknown rule ${version}${rule}`);
                                        return false;
                                    } catch (e) {
                                        console.warn(`Cannot compare ${version}${rule}`);
                                        return false;
                                    }
                                }
                            } else if (!rule.match(/^[!=<>]+/)) {
                                // Check if adapter is installed
                                if (Object.keys(instances).find(id => instances[id]?.common?.name === rule)) {
                                    return true;
                                }
                            } else if (rule.startsWith('!')) {
                                // Check if adapter is not installed
                                const adapter = rule.substring(1);
                                if (!Object.keys(instances).find(id => instances[id]?.common?.name === adapter)) {
                                    return true;
                                }
                            }
                            // unknown rule
                            return false;
                        }
                    }

                    // If first character is '>' or '<'
                    if (rule[1] >= '0' && rule[1] <= '9') {
                        op = rule[0];
                        ver = rule.substring(1);
                    } else {
                        // First 2 characters are '>=' or '<=' or '!=' or '=='
                        op = rule.substring(0, 2);
                        ver = rule.substring(2);
                    }
                    try {
                        if (op === '==') {
                            return semver.eq(version, ver);
                        }
                        if (op === '>') {
                            return semver.gt(version, ver);
                        }
                        if (op === '<') {
                            return semver.lt(version, ver);
                        }
                        if (op === '>=') {
                            return semver.gte(version, ver);
                        }
                        if (op === '<=') {
                            return semver.lte(version, ver);
                        }
                        if (op === '!=') {
                            return semver.neq(version, ver);
                        }
                        console.warn(`Unknown rule ${version}${rule}`);
                    } catch (e) {
                        console.warn(`Cannot compare ${version}${rule}`);
                    }
                    return false;
                });

                if (message.condition.operand === 'or') {
                    show = results.find(res => res);
                } else {
                    show = results.findIndex(res => !res) === -1;
                }
            }

            if (show) {
                messages = messages || [];
                messages.push({
                    title: message.title,
                    text: message.text,
                    link: message.link,
                    buttons: message.buttons,
                    level: message.level,
                });
            }
        });
    }

    return messages;
}

describe('GUI', () => {
    it('check messages', done => {
        const conditions = [
            {
                condition: {
                    operand: 'and',
                    rules: ['oldVersion<5.5.0', 'newVersion>=5.5.0'],
                },
            },
        ];

        let messages = checkCondition(conditions, '5.5.4', '5.6.0');
        expect(messages).to.be.equal(null);

        messages = checkCondition(conditions, '5.4.1', '5.6.0');
        expect(messages.length).to.be.equal(1);

        done();
    });

    it('check messages with instances', done => {
        const conditions = [
            {
                condition: {
                    operand: 'and',
                    rules: ['!vis', '!vis-2'],
                },
            },
        ];
        const instances = {
            'system.adapter.vis.0': {
                common: {
                    name: 'vis',
                    version: '1.0.0',
                },
            },
            'system.adapter.vis-2.0': {
                common: {
                    name: 'vis-2',
                    version: '1.0.0',
                },
            },
        };

        let messages = checkCondition(conditions, null, null, {});
        expect(messages.length).to.be.equal(1);

        messages = checkCondition(conditions, null, null, instances);
        expect(messages).to.be.equal(null);

        done();
    });
});
