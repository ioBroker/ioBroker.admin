import React from 'react';

export type ConfigItemType = 'tabs' | 'panel' | 'text' | 'number' | 'color' | 'checkbox' | 'slider' | 'ip' | 'user' | 'room' | 'func' | 'select' |
    'autocomplete' | 'image' | 'objectId' | 'password' | 'instance' | 'chips' | 'alive' | 'pattern' | 'sendto' | 'setState' |
    'staticText' | 'staticLink' | 'staticImage' | 'table' | 'accordion' | 'jsonEditor' | 'language' | 'certificate' |
    'certificates' | 'certCollection' | 'custom' | 'datePicker' | 'timePicker' | 'divider' | 'header' | 'cron' |
    'fileSelector' | 'file' | 'imageSendTo' | 'selectSendTo' | 'autocompleteSendTo' | 'textSendTo' | 'coordinates' | 'interface' | 'license' |
    'checkLicense' | 'uuid' | 'port' | 'deviceManager';

export interface ConfigItemConfirmData {
    condition: string;
    text?: ioBroker.StringOrTranslated;
    title?: ioBroker.StringOrTranslated;
    ok?: ioBroker.StringOrTranslated;
    cancel?: ioBroker.StringOrTranslated;
    type?: 'info' | 'warning' | 'error' | 'none';
    alsoDependsOn?: string[];
}

export interface ConfigItem {
    type: ConfigItemType;
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    xs?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    newLine?: boolean;
    label?: ioBroker.StringOrTranslated;
    /** @deprecated use label */
    text?: ioBroker.StringOrTranslated;
    hidden?: string | boolean;
    hideOnlyControl?: boolean;
    disabled?: string | boolean;
    help?: ioBroker.StringOrTranslated;
    helpLink?: string;
    style?: React.CSSProperties;
    darkStyle?: React.CSSProperties;
    validator?: string;
    validatorErrorText?: string;
    validatorNoSaveOnError?: boolean;
    tooltip?: ioBroker.StringOrTranslated;
    default?: boolean | number | string;
    defaultFunc?: string;
    defaultSendTo?: string;
    data?: string | number | boolean;
    jsonData?: string;
    button?: ioBroker.StringOrTranslated;
    buttonTooltip?: ioBroker.StringOrTranslated;
    buttonTooltipNoTranslation?: boolean;
    placeholder?: ioBroker.StringOrTranslated;
    noTranslation?: boolean;
    onChange?: {
        alsoDependsOn: string[];
        calculateFunc: string;
        ignoreOwnChanges?: boolean;
    };
    doNotSave?: boolean;
    noMultiEdit?: boolean;
    confirm?: ConfigItemConfirmData;
    icon?: 'auth' | 'send' | 'web' | 'warning' | 'error' | 'info' | 'search' | 'book' | 'help' | 'upload' | string;
    width?: string | number;

    // generated from alsoDependsOn
    // eslint-disable-next-line no-use-before-define
    confirmDependsOn?: ConfigItemIndexed[];
    // eslint-disable-next-line no-use-before-define
    onChangeDependsOn?: ConfigItemIndexed[];
    // eslint-disable-next-line no-use-before-define
    hiddenDependsOn?: ConfigItemIndexed[];
    // eslint-disable-next-line no-use-before-define
    labelDependsOn?: ConfigItemIndexed[];
    // eslint-disable-next-line no-use-before-define
    helpDependsOn?: ConfigItemIndexed[];
}

interface ConfigItemIndexed extends ConfigItem {
    attr?: string;
}

interface ConfigItemTableIndexed extends ConfigItem {
    attr?: string;
    /** show filter options in the header of table */
    filter?: boolean;
    /** show sorting options in the header of table */
    sort?: boolean;
    /** tooltip in the header of table */
    title?: string;
}

export interface ConfigItemAlive extends ConfigItem {
    type: 'alive';
    instance?: string;
    textAlive?: string;
    textNotAlive?: string;
}

export interface ConfigItemSelectOption {
    label: string;
    value: boolean | number | string;
}

export interface ConfigItemPanel extends ConfigItem {
    type: 'panel' | never;
    label?: ioBroker.StringOrTranslated;
    items: Record<string, ConfigItem>;
    collapsable?: boolean;
    color?: 'primary' | 'secondary';
    innerStyle?: React.CSSProperties;
    i18n?: boolean | string | Record<string, Record<ioBroker.Languages, string>>;
}

export interface ConfigItemTabs extends ConfigItem {
    type: 'tabs';
    items: Record<string, ConfigItemPanel>;
    iconPosition?: 'bottom' | 'end' | 'start' | 'top';
    tabsStyle?: React.CSSProperties;
    i18n?: boolean | string | Record<string, Record<ioBroker.Languages, string>>;
}

export interface ConfigItemText extends ConfigItem {
    type: 'text';
    maxLength?: number;
    /** @deprecated use maxLength */
    max?: number;
    readOnly?: boolean;
    trim?: boolean;
    minRows?: number;
    maxRows?: number;
    noClearButton?: boolean;
}

export interface ConfigItemColor extends ConfigItem {
    type: 'color';
    noClearButton?: boolean;
}

export interface ConfigItemCheckbox extends ConfigItem {
    type: 'checkbox';
}

export interface ConfigItemNumber extends ConfigItem {
    type: 'number';
    min?: number;
    max?: number;
    step?: number;
    readOnly?: boolean;
}

export interface ConfigItemSlider extends ConfigItem {
    type: 'slider';
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
}

export interface ConfigItemIP extends ConfigItem {
    type: 'ip';
    listenOnAllPorts?: boolean;
    onlyIp4?: boolean;
    onlyIp6?: boolean;
    noInternal?: boolean;
}

export interface ConfigItemUser extends ConfigItem {
    type: 'user';
    short?: boolean;
}

export interface ConfigItemRoom extends ConfigItem {
    type: 'room';
    short?: boolean;
    allowDeactivate?: boolean;
}

export interface ConfigItemFunc extends ConfigItem {
    type: 'func';
    short?: boolean;
    allowDeactivate?: boolean;
}

export interface ConfigItemSelect extends ConfigItem {
    type: 'select';
    options: ConfigItemSelectOption[] | { items: ConfigItemSelectOption[]; name: ioBroker.StringOrTranslated }[];
}

export interface ConfigItemAutocomplete extends ConfigItem {
    type: 'autocomplete';
    options: (string | ConfigItemSelectOption)[];
    freeSolo?: boolean;
}

export interface ConfigItemAutocompleteSendTo extends ConfigItem {
    type: 'autocompleteSendTo';
    command?: string;
    jsonData?: string;
    options?: (string | ConfigItemSelectOption)[];
    data?: Record<string, any>;
    freeSolo?: boolean;
    maxLength?: number;
    /** @deprecated use maxLength */
    max?: string;
    alsoDependsOn?: string[];
}

export interface ConfigItemAccordion extends ConfigItem {
    type: 'accordion';
    titleAttr?: string;
    noDelete?: boolean;
    clone?: boolean | string;
    items: ConfigItemIndexed[];
}

export interface ConfigItemDivider extends ConfigItem {
    type: 'divider';
    color?: 'primary' | 'secondary' | string;
    height?: string | number;
}
export interface ConfigItemHeader extends ConfigItem {
    type: 'header';
    text?: ioBroker.StringOrTranslated;
    size?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ConfigItemCoordinates extends ConfigItem {
    type: 'coordinates';
    divider?: string;
    autoInit?: boolean;
    longitudeName?: string;
    latitudeName?: string;
    useSystemName?: string;
    maxLength?: number;
    max?: number;
}

export interface ConfigItemCustom extends ConfigItem {
    type: 'custom';
    /** location of Widget, like "custom/customComponents.js" */
    url: string;
    /** Component name, like "ConfigCustomBackItUpSet/Components/AdapterExist" */
    name: string;
    /** i18n */
    i18n: boolean | Record<string, string>;
    /** custom properties */
    [prop: string]: any;
}

export interface ConfigItemDatePicker extends ConfigItem {
    type: 'datePicker';
    maxLength?: number;
    /** @deprecated use maxLength */
    max?: number;
}

export interface ConfigItemDeviceManager extends ConfigItem {
    type: 'deviceManager';
}

export interface ConfigItemLanguage extends ConfigItem {
    type: 'language';
    system?: boolean;
    changeGuiLanguage?: boolean;
}

export interface ConfigItemPort extends ConfigItem {
    type: 'port';
    min?: number;
    max?: number;
    readOnly?: boolean;
}

export interface ConfigItemSendTo extends ConfigItem {
    type: 'sendto';
    command?: string;
    jsonData?: string;
    data?: Record<string, any>;
    result?: string;
    error?: string;
    variant?: 'contained' | 'outlined';
    openUrl?: boolean;
    reloadBrowser?: boolean;
    window?: string;
    icon?: 'auth' | 'send' | 'web' | 'warning' | 'error' | 'info' | 'search' | 'book' | 'help' | 'upload' | string;
    useNative?: boolean;
    showProcess?: boolean;
    timeout?: number;
    onLoaded?: boolean;
    color?: 'primary' | 'secondary';
    /** button tooltip */
    title?: ioBroker.StringOrTranslated;
    alsoDependsOn?: string[];
    container?: 'text' | 'div';
    copyToClipboard?: boolean;
}

export interface ConfigItemTextSendTo extends ConfigItem {
    type: 'textSendTo';
    container?: 'text' | 'div';
    copyToClipboard?: boolean;
    alsoDependsOn?: string[];
    command?: string;
    jsonData?: string;
    data?: Record<string, any>;
}

export interface ConfigItemSelectSendTo extends ConfigItem {
    type: 'selectSendTo';
    manual?: boolean;
    multiple?: boolean;
    showAllValues?: boolean;
    noClearButton?: boolean;
    command?: string;
    jsonData?: string;
    data?: Record<string, any>;
    alsoDependsOn?: string[];
}

export interface ConfigItemTable extends ConfigItem {
    type: 'table';
    items?: ConfigItemTableIndexed[];
    noDelete?: boolean;
    /** @deprecated don't use */
    objKeyName?: string;
    /** @deprecated don't use */
    objValueName?: string;
    allowAddByFilter?: boolean;
    showSecondAddAt?: number;
    showFirstAddOnTop?: boolean;
    clone?: boolean | string;
    export?: boolean;
    import?: boolean;
    uniqueColumns?: string[];
    encryptedAttributes?: string[];
}

export interface ConfigItemTimePicker extends ConfigItem {
    type: 'timePicker';
    /** format passed to the date picker defaults to `HH:mm:ss` */
    format?: string;
    views?: ('hours' | 'minutes' | 'seconds')[];
    /** Represent the available time steps for each view. Defaults to `{ hours: 1, minutes: 5, seconds: 5 }` */
    timeSteps?: { hours?: number; minutes?: number; seconds?: number };
    /** @deprecated use timeSteps */
    timesteps?: { hours?: number; minutes?: number; seconds?: number };
    /**  `fullDate` or `HH:mm:ss`. Defaults to full date for backward compatibility reasons */
    returnFormat?: string;
}

export interface ConfigItemCertCollection extends ConfigItem {
    type: 'certCollection';
    leCollectionName?: string;
}

export interface ConfigItemCertificateSelect extends ConfigItem {
    type: 'certificate';
}

export interface ConfigItemCertificates extends ConfigItem {
    type: 'certificates';
    leCollectionName?: string;
    certPublicName?: string;
    certPrivateName?: string;
    certChainedName?: string;
}
export interface ConfigItemCheckLicense extends ConfigItem {
    type: 'checkLicense';
    /** Check UUID */
    uuid?: boolean;
    /** Check version */
    version?: boolean;
    variant?: 'text' | 'outlined' | 'contained';
    color?: 'primary' | 'secondary';
}

export interface ConfigItemUUID extends ConfigItem {
    type: 'uuid';
}

export type ConfigItemAny = ConfigItemAlive | ConfigItemAutocomplete  | ConfigItemAutocompleteSendTo | ConfigItemPanel |
    ConfigItemTabs | ConfigItemText |
    ConfigItemNumber | ConfigItemColor | ConfigItemCheckbox |
    ConfigItemSlider | ConfigItemIP | ConfigItemUser | ConfigItemRoom | ConfigItemFunc |
    ConfigItemSelect | ConfigItemAccordion | ConfigItemCoordinates |
    ConfigItemDivider | ConfigItemHeader | ConfigItemCustom | ConfigItemDatePicker |
    ConfigItemDeviceManager | ConfigItemLanguage | ConfigItemPort | ConfigItemSendTo |
    ConfigItemTable | ConfigItemTimePicker | ConfigItemTextSendTo | ConfigItemSelectSendTo |
    ConfigItemCertCollection | ConfigItemCertificateSelect | ConfigItemCertificates | ConfigItemUUID |
    ConfigItemCheckLicense;
