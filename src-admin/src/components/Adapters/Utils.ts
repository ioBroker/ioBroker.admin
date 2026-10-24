export interface RepoInfo {
    stable?: boolean;
    name?: ioBroker.Translated;
    repoTime: string;
    recommendedVersions?: {
        nodeJsAccepted: number[];
        nodeJsRecommended: number;
        npmRecommended: number;
    };
}

export interface RepoAdapterObject extends ioBroker.AdapterCommon {
    versionDate: string;
    published?: string;
    controller?: boolean;
    stat?: number;
    node?: string;
    allowAdapterInstall?: boolean;
    allowAdapterUpdate?: boolean;
    allowAdapterDelete?: boolean;
    allowAdapterReadme?: boolean;
    allowAdapterRating?: boolean;
    stable?: string;
    latestVersion?: string;
}

/** Link for the license icon: the page with the license information (prices, where to buy), else the license text */
export function extractUrlLink(adapterRepo: RepoAdapterObject): string {
    return adapterRepo?.licenseInformation?.link || extractLicenseTextUrl(adapterRepo);
}

/**
 * URL of the license text that the license dialog loads.
 *
 * Not `licenseInformation.link`: that one names the page with the license information - prices, where to buy - which is
 * often an HTML page that the browser may not read from another origin (CORS). The license text itself comes from the
 * repository of the adapter, like for an adapter without `licenseInformation`.
 */
export function extractLicenseTextUrl(adapterRepo: RepoAdapterObject): string {
    if (!adapterRepo) {
        return '';
    }

    // Check for deprecated licenseUrl
    // @ts-expect-error licenseUrl is deprecated
    let url = adapterRepo.licenseUrl;

    if (!url || !url.includes('/LICENSE') || !url.includes('raw.githubusercontent.com')) {
        url = adapterRepo.extIcon;
        if (!url) {
            url = adapterRepo.readme;
            if (!url) {
                console.error(`No extIcon for ${adapterRepo.name || JSON.stringify(adapterRepo)}`);
                return '';
            }
            url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
            if (url.includes('/main')) {
                url = `${url.split('/main')[0]}/main/LICENSE`;
            } else if (url.includes('/master')) {
                url = `${url.split('/master')[0]}/master/LICENSE`;
            }
        }
        if (url.includes('/main')) {
            url = `${url.split('/main')[0]}/main/LICENSE`;
        } else if (url.includes('/master')) {
            url = `${url.split('/master')[0]}/master/LICENSE`;
        } else {
            return '';
        }
    }

    return url;
}

/**
 * Extract the pure adapter name from an installation source.
 *
 * The js-controller accepts very different sources for the `url` command, so the adapter name must be
 * guessed to be able to create an instance afterwards:
 * `xyz`, `iobroker.xyz`, `iobroker.xyz@1.2.3`, `Author/ioBroker.xyz`,
 * `https://github.com/Author/ioBroker.xyz/tarball/main`, `/opt/iobroker/ioBroker.xyz-1.2.3.tgz`
 *
 * @param source URL, npm package name or file path the adapter was installed from
 * @returns the adapter name in lower case or null if it cannot be determined
 */
export function extractAdapterName(source: string): string | null {
    if (!source) {
        return null;
    }

    // cut off the query string and the anchor, like in `.../ioBroker.xyz/tarball/main?token=1`
    const url = source.trim().split('?')[0].split('#')[0];

    // packed adapter, like `/opt/iobroker/ioBroker.spotify-premium-1.6.0.tgz`
    const packed = url.match(/iobroker\.([a-z\d][a-z\d_-]*?)-\d+\.\d+\.\d+[^/\\]*\.tgz$/i);
    if (packed) {
        return packed[1].toLowerCase();
    }

    const named = url.match(/iobroker\.([a-z\d][a-z\d_-]*)/i);
    if (named) {
        return named[1].toLowerCase();
    }

    // the pure adapter name, as it can be entered in the "Custom" tab
    if (/^[a-z\d][a-z\d_-]*$/i.test(url)) {
        return url.toLowerCase();
    }

    return null;
}
