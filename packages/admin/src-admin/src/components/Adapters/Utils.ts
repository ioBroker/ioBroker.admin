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

export function extractUrlLink(adapterRepo: RepoAdapterObject): string {
    if (!adapterRepo) {
        return '';
    }

    // If licenseInformation.link is provided, use it directly for commercial license links
    if (adapterRepo.licenseInformation?.link) {
        return adapterRepo.licenseInformation.link;
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
