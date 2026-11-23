interface AdapterUpdateOptions {
    /** Language to translate text to */
    lang: ioBroker.Languages;
    /** The adapter to update */
    adapter: string;
    /** The installed version */
    installedVersion: string;
    /** The new available version */
    newVersion: string;
}

const updateText: Record<ioBroker.Languages, string> = {
    en: 'Adapter %adapter can be updated from %installedVersion to %newVersion.',
    de: 'Adapter %adapter kann von %installedVersion auf %newVersion aktualisiert werden.',
    ru: 'Адаптер %adapter может быть обновлен с %installedVersion до %newVersion.',
    pt: 'O adaptador %adapter pode ser atualizado de %installedVersion para %newVersion.',
    nl: 'Adapter %adapter kan worden bijgewerkt van %installedVersion naar %newVersion.',
    fr: "L'adaptateur %adapter peut être mis à jour de %installedVersion à %newVersion.",
    it: "L'adattatore %adapter può essere aggiornato da %installedVersion a %newVersion.",
    es: 'El adaptador %adapter puede actualizarse de %installedVersion a %newVersion.',
    pl: 'Adapter %adapter może zostać zaktualizowany z %installedVersion do %newVersion.',
    uk: 'Адаптер %adapter можна оновити з %installedVersion до %newVersion.',
    'zh-cn': '适配器 %adapter 可以从 %installedVersion 升级到 %newVersion。',
};

const controllerUpdateText: Record<ioBroker.Languages, string> = {
    en: 'The %adapter can be updated from %installedVersion to %newVersion.',
    de: 'Der %adapter kann von %installedVersion auf %newVersion aktualisiert werden.',
    ru: '%adapter может быть обновлен с %installedVersion до %newVersion.',
    pt: 'O %adapter pode ser atualizado de %installedVersion para %newVersion.',
    nl: 'De %adapter kan worden bijgewerkt van %installedVersion naar %newVersion.',
    fr: 'Le %adapter peut être mis à jour de %installedVersion à %newVersion.',
    it: 'Il %adapter può essere aggiornato da %installedVersion a %newVersion.',
    es: 'El %adapter puede actualizarse de %installedVersion a %newVersion.',
    pl: '%adapter może zostać zaktualizowany z %installedVersion do %newVersion.',
    uk: '%adapter можна оновити з %installedVersion до %newVersion.',
    'zh-cn': '%adapter 可以从 %installedVersion 升级到 %newVersion。',
};

const nodeNotRecommendedText: Record<ioBroker.Languages, string> = {
    en: 'Node.js %current is installed on host %host, recommended is Node.js %recommended.',
    de: 'Auf dem Host %host ist Node.js %current installiert, empfohlen ist Node.js %recommended.',
    ru: 'На хосте %host установлен Node.js %current, рекомендуется Node.js %recommended.',
    pt: 'O Node.js %current está instalado no host %host, o recomendado é o Node.js %recommended.',
    nl: 'Op host %host is Node.js %current geïnstalleerd, aanbevolen is Node.js %recommended.',
    fr: "Node.js %current est installé sur l'hôte %host, la version recommandée est Node.js %recommended.",
    it: "Sull'host %host è installato Node.js %current, è consigliato Node.js %recommended.",
    es: 'En el host %host está instalado Node.js %current, se recomienda Node.js %recommended.',
    pl: 'Na hoście %host zainstalowano Node.js %current, zalecany jest Node.js %recommended.',
    uk: 'На хості %host встановлено Node.js %current, рекомендовано Node.js %recommended.',
    'zh-cn': '主机 %host 上安装的是 Node.js %current，推荐使用 Node.js %recommended。',
};

const nodeUpdateDockerText: Record<ioBroker.Languages, string> = {
    en: 'Please update to a newer ioBroker Docker image with Node.js %recommended.',
    de: 'Bitte aktualisiere auf ein neueres ioBroker-Docker-Image mit Node.js %recommended.',
    ru: 'Пожалуйста, обновитесь до более нового Docker-образа ioBroker с Node.js %recommended.',
    pt: 'Atualize para uma imagem Docker do ioBroker mais recente com Node.js %recommended.',
    nl: 'Werk bij naar een nieuwere ioBroker Docker-image met Node.js %recommended.',
    fr: 'Veuillez passer à une image Docker ioBroker plus récente avec Node.js %recommended.',
    it: "Aggiorna a un'immagine Docker di ioBroker più recente con Node.js %recommended.",
    es: 'Actualice a una imagen Docker de ioBroker más reciente con Node.js %recommended.',
    pl: 'Zaktualizuj do nowszego obrazu Docker ioBroker z Node.js %recommended.',
    uk: 'Будь ласка, оновіться до новішого Docker-образу ioBroker з Node.js %recommended.',
    'zh-cn': '请更新到包含 Node.js %recommended 的较新 ioBroker Docker 镜像。',
};

const nodeUpdateCommandText: Record<ioBroker.Languages, string> = {
    en: 'You can update it with "iobroker nodejs-update %recommended".',
    de: 'Du kannst es mit "iobroker nodejs-update %recommended" aktualisieren.',
    ru: 'Обновить можно командой "iobroker nodejs-update %recommended".',
    pt: 'Pode atualizá-lo com "iobroker nodejs-update %recommended".',
    nl: 'Je kunt het bijwerken met "iobroker nodejs-update %recommended".',
    fr: 'Vous pouvez le mettre à jour avec "iobroker nodejs-update %recommended".',
    it: 'Puoi aggiornarlo con "iobroker nodejs-update %recommended".',
    es: 'Puede actualizarlo con "iobroker nodejs-update %recommended".',
    pl: 'Możesz go zaktualizować poleceniem "iobroker nodejs-update %recommended".',
    uk: 'Оновити можна командою "iobroker nodejs-update %recommended".',
    'zh-cn': '可以使用 "iobroker nodejs-update %recommended" 进行更新。',
};

/**
 * Get text for a message that the installed Node.js major is lower than the recommended one
 */
export function getNodeNotRecommendedText(options: {
    /** Language to translate text to */
    lang: ioBroker.Languages;
    /** The host with the old Node.js */
    host: string;
    /** The installed major */
    current: number;
    /** The recommended major */
    recommended: number;
    /** If the host runs in Docker */
    docker: boolean;
}): string {
    const { lang, host, current, recommended, docker } = options;
    const hint = docker ? nodeUpdateDockerText : nodeUpdateCommandText;
    const text = `${nodeNotRecommendedText[lang] || nodeNotRecommendedText.en} ${hint[lang] || hint.en}`;

    return text
        .replace('%host', host)
        .replace('%current', current.toString())
        .replace(/%recommended/g, recommended.toString());
}

/**
 * Get text for a message about adapter update in given language
 */
export function getAdapterUpdateText(options: AdapterUpdateOptions): string {
    const { lang, adapter, installedVersion, newVersion } = options;

    // Use different text template for js-controller updates
    const textTemplate = adapter === 'js-controller' ? controllerUpdateText[lang] : updateText[lang];

    return textTemplate
        .replace('%adapter', adapter)
        .replace('%installedVersion', installedVersion)
        .replace('%newVersion', newVersion);
}
