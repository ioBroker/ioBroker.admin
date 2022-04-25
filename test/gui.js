const expect = require('chai').expect;
const semver = require('semver');

function checkCondition(objMessages, oldVersion, newVersion) {
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
        //     "buttons": ["agree", "cancel", "ok],
        //     "linkText" {
        //          "en": "More info",
        //     },
        //     "level": "warn"
        // };

        objMessages.forEach(message => {
            let show = !message.condition || !message.condition.rules;
            if (message.condition && message.condition.rules) {
                const results = (Array.isArray(message.condition.rules) ? message.condition.rules : [message.condition.rules])
                    .map(rule => {
                        // oldVersion<=1.0.44
                        let version;
                        if (rule.includes('oldVersion')) {
                            version = oldVersion;
                            rule = rule.substring('newVersion'.length);
                        } else if (rule.includes('newVersion')) {
                            version = newVersion;
                            rule = rule.substring('newVersion'.length);
                        } else {
                            // unknown rule
                            return false;
                        }
                        let op;
                        let ver;
                        if (rule[1] >= '0' && rule[1] <= '9') {
                            op = rule[0];
                            ver = rule.substring(1);
                        } else {
                            op = rule.substring(0, 2);
                            ver = rule.substring(2);
                        }


                        let result = false;
                        try {
                            if (op === '==') {
                                result = semver.eq(version, ver);
                            } else if (op === '>') {
                                result = semver.gt(version, ver);
                            } else if (op === '<') {
                                result = semver.lt(version, ver);
                            } else if (op === '>=') {
                                result = semver.gte(version, ver);
                            } else if (op === '<=') {
                                result = semver.lte(version, ver);
                            } else if (op === '!=') {
                                result = semver.neq(version, ver);
                            } else {
                                console.warn(`Unknown rule ${version}${rule}`);
                            }
                        } catch (e) {
                            console.warn(`Cannot compare ${version}${rule}`);
                        }
                        // console.log(`${version} ${op} ${ver} => ${result}`);
                        return result;
                    });


                if (message.condition.operand === 'or') {
                    show = results.find(res => res);
                } else {
                    show = results.findIndex(res => !res) === -1;
                }
            }

            if (show) {
                messages = messages || [];
                messages.push({title: message.title, text: message.text, link: message.link, buttons: message.buttons, level: message.level});
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
                    rules: [
                        'oldVersion<5.5.0',
                        'newVersion>=5.5.0'
                    ]
                }
            },
        ]

        let messages = checkCondition(conditions, '5.5.4', '5.6.0');
        expect(messages).to.be.equal(null);

        messages = checkCondition(conditions, '5.4.1', '5.6.0');
        expect(messages.length).to.be.equal(1);

        done();
    }) ;
});