// those constants are based on https://www.rubydoc.info/gems/semantic_range/3.0.0/SemanticRange#BUILDIDENTIFIER-constant
const buildIdentifier = '[0-9A-Za-z-]+';
const build = `(?:\\+(${buildIdentifier}(?:\\.${buildIdentifier})*))`;
const numericIdentifier = '0|[1-9]\\d*';
const numericIdentifierLoose = '[0-9]+';
const nonNumericIdentifier = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';
const preReleaseIdentifierLoose = `(?:${numericIdentifierLoose}|${nonNumericIdentifier})`;
const preReleaseLoose = `(?:-?(${preReleaseIdentifierLoose}(?:\\.${preReleaseIdentifierLoose})*))`;
const preReleaseIdentifier = `(?:${numericIdentifier}|${nonNumericIdentifier})`;
const preRelease = `(?:-(${preReleaseIdentifier}(?:\\.${preReleaseIdentifier})*))`;
const xRangeIdentifier = `${numericIdentifier}|x|X|\\*`;
const xRangePlain = `[v=\\s]*(${xRangeIdentifier})(?:\\.(${xRangeIdentifier})(?:\\.(${xRangeIdentifier})(?:${preRelease})?${build}?)?)?`;
const hyphenRange = `^\\s*(${xRangePlain})\\s+-\\s+(${xRangePlain})\\s*$`;
const mainVersionLoose = `(${numericIdentifierLoose})\\.(${numericIdentifierLoose})\\.(${numericIdentifierLoose})`;
const loosePlain = `[v=\\s]*${mainVersionLoose}${preReleaseLoose}?${build}?`;
const gtlt = '((?:<|>)?=?)';
const comparatorTrim = `(\\s*)${gtlt}\\s*(${loosePlain}|${xRangePlain})`;
const loneTilde = '(?:~>?)';
const tildeTrim = `(\\s*)${loneTilde}\\s+`;
const loneCaret = '(?:\\^)';
const caretTrim = `(\\s*)${loneCaret}\\s+`;
const star = '(<|>)?=?\\s*\\*';
const caret = `^${loneCaret}${xRangePlain}$`;
const mainVersion = `(${numericIdentifier})\\.(${numericIdentifier})\\.(${numericIdentifier})`;
const fullPlain = `v?${mainVersion}${preRelease}?${build}?`;
const tilde = `^${loneTilde}${xRangePlain}$`;
const xRange = `^${gtlt}\\s*${xRangePlain}$`;
const comparator = `^${gtlt}\\s*(${fullPlain})$|^$`;
// copy from semver package
const gte0 = '^\\s*>=\\s*0.0.0\\s*$';

function parseRegex(source) {
    return new RegExp(source);
}
function isXVersion(version) {
    return !version || version.toLowerCase() === 'x' || version === '*';
}
function pipe(...fns) {
    return (x) => {
        return fns.reduce((v, f) => f(v), x);
    };
}
function extractComparator(comparatorString) {
    return comparatorString.match(parseRegex(comparator));
}
function combineVersion(major, minor, patch, preRelease) {
    const mainVersion = `${major}.${minor}.${patch}`;
    if (preRelease) {
        return `${mainVersion}-${preRelease}`;
    }
    return mainVersion;
}

function parseHyphen(range) {
    return range.replace(parseRegex(hyphenRange), (_range, from, fromMajor, fromMinor, fromPatch, _fromPreRelease, _fromBuild, to, toMajor, toMinor, toPatch, toPreRelease) => {
        if (isXVersion(fromMajor)) {
            from = '';
        }
        else if (isXVersion(fromMinor)) {
            from = `>=${fromMajor}.0.0`;
        }
        else if (isXVersion(fromPatch)) {
            from = `>=${fromMajor}.${fromMinor}.0`;
        }
        else {
            from = `>=${from}`;
        }
        if (isXVersion(toMajor)) {
            to = '';
        }
        else if (isXVersion(toMinor)) {
            to = `<${+toMajor + 1}.0.0-0`;
        }
        else if (isXVersion(toPatch)) {
            to = `<${toMajor}.${+toMinor + 1}.0-0`;
        }
        else if (toPreRelease) {
            to = `<=${toMajor}.${toMinor}.${toPatch}-${toPreRelease}`;
        }
        else {
            to = `<=${to}`;
        }
        return `${from} ${to}`.trim();
    });
}
function parseComparatorTrim(range) {
    return range.replace(parseRegex(comparatorTrim), '$1$2$3');
}
function parseTildeTrim(range) {
    return range.replace(parseRegex(tildeTrim), '$1~');
}
function parseCaretTrim(range) {
    return range.replace(parseRegex(caretTrim), '$1^');
}
function parseCarets(range) {
    return range
        .trim()
        .split(/\s+/)
        .map((rangeVersion) => {
        return rangeVersion.replace(parseRegex(caret), (_, major, minor, patch, preRelease) => {
            if (isXVersion(major)) {
                return '';
            }
            else if (isXVersion(minor)) {
                return `>=${major}.0.0 <${+major + 1}.0.0-0`;
            }
            else if (isXVersion(patch)) {
                if (major === '0') {
                    return `>=${major}.${minor}.0 <${major}.${+minor + 1}.0-0`;
                }
                else {
                    return `>=${major}.${minor}.0 <${+major + 1}.0.0-0`;
                }
            }
            else if (preRelease) {
                if (major === '0') {
                    if (minor === '0') {
                        return `>=${major}.${minor}.${patch}-${preRelease} <${major}.${minor}.${+patch + 1}-0`;
                    }
                    else {
                        return `>=${major}.${minor}.${patch}-${preRelease} <${major}.${+minor + 1}.0-0`;
                    }
                }
                else {
                    return `>=${major}.${minor}.${patch}-${preRelease} <${+major + 1}.0.0-0`;
                }
            }
            else {
                if (major === '0') {
                    if (minor === '0') {
                        return `>=${major}.${minor}.${patch} <${major}.${minor}.${+patch + 1}-0`;
                    }
                    else {
                        return `>=${major}.${minor}.${patch} <${major}.${+minor + 1}.0-0`;
                    }
                }
                return `>=${major}.${minor}.${patch} <${+major + 1}.0.0-0`;
            }
        });
    })
        .join(' ');
}
function parseTildes(range) {
    return range
        .trim()
        .split(/\s+/)
        .map((rangeVersion) => {
        return rangeVersion.replace(parseRegex(tilde), (_, major, minor, patch, preRelease) => {
            if (isXVersion(major)) {
                return '';
            }
            else if (isXVersion(minor)) {
                return `>=${major}.0.0 <${+major + 1}.0.0-0`;
            }
            else if (isXVersion(patch)) {
                return `>=${major}.${minor}.0 <${major}.${+minor + 1}.0-0`;
            }
            else if (preRelease) {
                return `>=${major}.${minor}.${patch}-${preRelease} <${major}.${+minor + 1}.0-0`;
            }
            return `>=${major}.${minor}.${patch} <${major}.${+minor + 1}.0-0`;
        });
    })
        .join(' ');
}
function parseXRanges(range) {
    return range
        .split(/\s+/)
        .map((rangeVersion) => {
        return rangeVersion
            .trim()
            .replace(parseRegex(xRange), (ret, gtlt, major, minor, patch, preRelease) => {
            const isXMajor = isXVersion(major);
            const isXMinor = isXMajor || isXVersion(minor);
            const isXPatch = isXMinor || isXVersion(patch);
            if (gtlt === '=' && isXPatch) {
                gtlt = '';
            }
            preRelease = '';
            if (isXMajor) {
                if (gtlt === '>' || gtlt === '<') {
                    // nothing is allowed
                    return '<0.0.0-0';
                }
                else {
                    // nothing is forbidden
                    return '*';
                }
            }
            else if (gtlt && isXPatch) {
                // replace X with 0
                if (isXMinor) {
                    minor = 0;
                }
                patch = 0;
                if (gtlt === '>') {
                    // >1 => >=2.0.0
                    // >1.2 => >=1.3.0
                    gtlt = '>=';
                    if (isXMinor) {
                        major = +major + 1;
                        minor = 0;
                        patch = 0;
                    }
                    else {
                        minor = +minor + 1;
                        patch = 0;
                    }
                }
                else if (gtlt === '<=') {
                    // <=0.7.x is actually <0.8.0, since any 0.7.x should pass
                    // Similarly, <=7.x is actually <8.0.0, etc.
                    gtlt = '<';
                    if (isXMinor) {
                        major = +major + 1;
                    }
                    else {
                        minor = +minor + 1;
                    }
                }
                if (gtlt === '<') {
                    preRelease = '-0';
                }
                return `${gtlt + major}.${minor}.${patch}${preRelease}`;
            }
            else if (isXMinor) {
                return `>=${major}.0.0${preRelease} <${+major + 1}.0.0-0`;
            }
            else if (isXPatch) {
                return `>=${major}.${minor}.0${preRelease} <${major}.${+minor + 1}.0-0`;
            }
            return ret;
        });
    })
        .join(' ');
}
function parseStar(range) {
    return range.trim().replace(parseRegex(star), '');
}
function parseGTE0(comparatorString) {
    return comparatorString.trim().replace(parseRegex(gte0), '');
}

function compareAtom(rangeAtom, versionAtom) {
    rangeAtom = +rangeAtom || rangeAtom;
    versionAtom = +versionAtom || versionAtom;
    if (rangeAtom > versionAtom) {
        return 1;
    }
    if (rangeAtom === versionAtom) {
        return 0;
    }
    return -1;
}
function comparePreRelease(rangeAtom, versionAtom) {
    const { preRelease: rangePreRelease } = rangeAtom;
    const { preRelease: versionPreRelease } = versionAtom;
    if (rangePreRelease === undefined && !!versionPreRelease) {
        return 1;
    }
    if (!!rangePreRelease && versionPreRelease === undefined) {
        return -1;
    }
    if (rangePreRelease === undefined && versionPreRelease === undefined) {
        return 0;
    }
    for (let i = 0, n = rangePreRelease.length; i <= n; i++) {
        const rangeElement = rangePreRelease[i];
        const versionElement = versionPreRelease[i];
        if (rangeElement === versionElement) {
            continue;
        }
        if (rangeElement === undefined && versionElement === undefined) {
            return 0;
        }
        if (!rangeElement) {
            return 1;
        }
        if (!versionElement) {
            return -1;
        }
        return compareAtom(rangeElement, versionElement);
    }
    return 0;
}
function compareVersion(rangeAtom, versionAtom) {
    return (compareAtom(rangeAtom.major, versionAtom.major) ||
        compareAtom(rangeAtom.minor, versionAtom.minor) ||
        compareAtom(rangeAtom.patch, versionAtom.patch) ||
        comparePreRelease(rangeAtom, versionAtom));
}
function eq(rangeAtom, versionAtom) {
    return rangeAtom.version === versionAtom.version;
}
function compare(rangeAtom, versionAtom) {
    switch (rangeAtom.operator) {
        case '':
        case '=':
            return eq(rangeAtom, versionAtom);
        case '>':
            return compareVersion(rangeAtom, versionAtom) < 0;
        case '>=':
            return (eq(rangeAtom, versionAtom) || compareVersion(rangeAtom, versionAtom) < 0);
        case '<':
            return compareVersion(rangeAtom, versionAtom) > 0;
        case '<=':
            return (eq(rangeAtom, versionAtom) || compareVersion(rangeAtom, versionAtom) > 0);
        case undefined: {
            // mean * or x -> all versions
            return true;
        }
        default:
            return false;
    }
}

function parseComparatorString(range) {
    return pipe(
    // handle caret
    // ^ --> * (any, kinda silly)
    // ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
    // ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
    // ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
    // ^1.2.3 --> >=1.2.3 <2.0.0-0
    // ^1.2.0 --> >=1.2.0 <2.0.0-0
    parseCarets, 
    // handle tilde
    // ~, ~> --> * (any, kinda silly)
    // ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
    // ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
    // ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
    // ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
    // ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
    parseTildes, parseXRanges, parseStar)(range);
}
function parseRange(range) {
    return pipe(
    // handle hyphenRange
    // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
    parseHyphen, 
    // handle trim comparator
    // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
    parseComparatorTrim, 
    // handle trim tilde
    // `~ 1.2.3` => `~1.2.3`
    parseTildeTrim, 
    // handle trim caret
    // `^ 1.2.3` => `^1.2.3`
    parseCaretTrim)(range.trim())
        .split(/\s+/)
        .join(' ');
}
function satisfy(version, range) {
    if (!version) {
        return false;
    }
    const parsedRange = parseRange(range);
    const parsedComparator = parsedRange
        .split(' ')
        .map((rangeVersion) => parseComparatorString(rangeVersion))
        .join(' ');
    const comparators = parsedComparator
        .split(/\s+/)
        .map((comparator) => parseGTE0(comparator));
    const extractedVersion = extractComparator(version);
    if (!extractedVersion) {
        return false;
    }
    const [, versionOperator, , versionMajor, versionMinor, versionPatch, versionPreRelease] = extractedVersion;
    const versionAtom = {
        operator: versionOperator,
        version: combineVersion(versionMajor, versionMinor, versionPatch, versionPreRelease),
        major: versionMajor,
        minor: versionMinor,
        patch: versionPatch,
        preRelease: versionPreRelease === null || versionPreRelease === void 0 ? void 0 : versionPreRelease.split('.')
    };
    for (const comparator of comparators) {
        const extractedComparator = extractComparator(comparator);
        if (!extractedComparator) {
            return false;
        }
        const [, rangeOperator, , rangeMajor, rangeMinor, rangePatch, rangePreRelease] = extractedComparator;
        const rangeAtom = {
            operator: rangeOperator,
            version: combineVersion(rangeMajor, rangeMinor, rangePatch, rangePreRelease),
            major: rangeMajor,
            minor: rangeMinor,
            patch: rangePatch,
            preRelease: rangePreRelease === null || rangePreRelease === void 0 ? void 0 : rangePreRelease.split('.')
        };
        if (!compare(rangeAtom, versionAtom)) {
            return false; // early return
        }
    }
    return true;
}

export { satisfy };
