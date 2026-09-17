export const CONFIG_MANAGER_PINS_STORAGE_KEY = 'App.configManagerPinnedInstances';
export const CONFIG_MANAGER_PINS_CHANGED_EVENT = 'config-manager-pins-changed';

function getStorage(): Storage {
    return window._localStorage || window.localStorage;
}

export function getPinnedConfigManagerInstances(): string[] {
    try {
        const value = JSON.parse(getStorage().getItem(CONFIG_MANAGER_PINS_STORAGE_KEY) || '[]');
        return Array.isArray(value)
            ? value.filter((instance, index) => typeof instance === 'string' && value.indexOf(instance) === index)
            : [];
    } catch {
        return [];
    }
}

export function setPinnedConfigManagerInstances(instances: string[]): void {
    getStorage().setItem(CONFIG_MANAGER_PINS_STORAGE_KEY, JSON.stringify([...new Set(instances)]));
    window.dispatchEvent(new CustomEvent(CONFIG_MANAGER_PINS_CHANGED_EVENT));
}

export function isConfigManagerInstancePinned(instance: string): boolean {
    return getPinnedConfigManagerInstances().includes(instance);
}

export function setConfigManagerInstancePinned(instance: string, pinned: boolean): void {
    const instances = getPinnedConfigManagerInstances().filter(item => item !== instance);
    if (pinned) {
        instances.push(instance);
    }
    setPinnedConfigManagerInstances(instances);
}
