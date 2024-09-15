/**
 * Tests whether the given variable is a real object and not an Array
 *
 * @param it The variable to test
 * @returns true if it is Record<string, any>
 */
export function isObject(it: any): it is Record<string, any> {
    // This is necessary because:
    // typeof null === 'object'
    // typeof [] === 'object'
    // [] instanceof Object === true
    return Object.prototype.toString.call(it) === '[object Object]'; // this code is 25% faster than below one
    // return it && typeof it === 'object' && !(it instanceof Array);
}

/** Url where controller changelog is reachable */
export const CONTROLLER_CHANGELOG_URL = 'https://github.com/ioBroker/ioBroker.js-controller/blob/master/CHANGELOG.md';

/** All possible auto upgrade settings */
export const AUTO_UPGRADE_SETTINGS: ioBroker.AutoUpgradePolicy[] = ['none', 'patch', 'minor', 'major'];

/** Mapping to make it more understandable which upgrades are allowed */
export const AUTO_UPGRADE_OPTIONS_MAPPING: Record<ioBroker.AutoUpgradePolicy, string> = {
    none: 'none',
    patch: 'patch',
    minor: 'patch & minor',
    major: 'patch, minor & major',
};
