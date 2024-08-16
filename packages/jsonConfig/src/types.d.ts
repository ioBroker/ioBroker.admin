import React from 'react';
import type { ObjectBrowserCustomFilter, ObjectBrowserType } from '@iobroker/adapter-react-v5';

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        grey: true;
    }
}

type CustomCSSProperties = React.CSSProperties;

export type ConfigItemType = 'tabs' | 'panel' | 'text' | 'number' | 'color' | 'checkbox' | 'slider' | 'ip' | 'user' | 'room' | 'func' | 'select' |
    'autocomplete' | 'image' | 'objectId' | 'password' | 'instance' | 'chips' | 'alive' | 'pattern' | 'sendto' | 'setState' |
    'staticText' | 'staticLink' | 'staticImage' | 'table' | 'accordion' | 'jsonEditor' | 'language' | 'certificate' |
    'certificates' | 'certCollection' | 'custom' | 'datePicker' | 'timePicker' | 'divider' | 'header' | 'cron' |
    'fileSelector' | 'file' | 'imageSendTo' | 'selectSendTo' | 'autocompleteSendTo' | 'textSendTo' | 'coordinates' | 'interface' | 'license' |
    'checkLicense' | 'uuid' | 'port' | 'deviceManager' | 'topic' | 'qrCode';

type ConfigIconType = 'edit' | 'auth' | 'send' | 'web' | 'warning' | 'error' | 'info' | 'search' | 'book' | 'help' | 'upload' | 'user' | 'group' | 'delete' | 'refresh' | 'add' | 'unpair' | 'pair' | string;

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
    style?: CustomCSSProperties;
    darkStyle?: CustomCSSProperties;
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
    icon?: ConfigIconType;
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
    /** check if the instance is alive. If not defined, it will be used current instance. You can use `${data.number}` pattern in the text. */
    instance?: string;
    /** default text is `Instance %s is alive`, where %s will be replaced by `ADAPTER.0`. The translation must exist in i18n files. */
    textAlive?: string;
    /** default text is `Instance %s is not alive`, where %s will be replaced by `ADAPTER.0`. The translation must exist in i18n files. */
    textNotAlive?: string;
}

export interface ConfigItemSelectOption {
    /** Label of option */
    label: ioBroker.StringOrTranslated;
    /** Value of option */
    value: number | string;
    /** Formula or boolean value to show or hide the option */
    hidden?: string | boolean;
}

export interface ConfigItemPanel extends ConfigItem {
    type: 'panel' | never;
    /** Label of tab */
    label?: ioBroker.StringOrTranslated;
    // eslint-disable-next-line no-use-before-define
    items: Record<string, ConfigItemAny>;
    /** only possible as not part of tabs */
    collapsable?: boolean;
    /** color of collapsable header `primary` or `secondary` or nothing */
    color?: 'primary' | 'secondary';
    /** CSS Styles in React format (`marginLeft` and not `margin-left`) for the Panel component */
    innerStyle?: CustomCSSProperties;
    /** i18n definitions: true - load from a file, string - name of subdirectory, object - translations */
    i18n?: boolean | string | Record<string, Record<ioBroker.Languages, string>>;
}

export interface ConfigItemPattern extends ConfigItem {
    type: 'pattern';
    /** if true - show copy button */
    copyToClipboard?: boolean;
    /** pattern like 'https://${data.ip}:${data.port}' */
    pattern: string;
}

export interface ConfigItemChip extends ConfigItem {
    type: 'chips';
    /** if it is defined, so the option will be stored as string with delimiter instead of an array. E.g., by `delimiter=;` you will get `a;b;c` instead of `['a', 'b', 'c']` */
    delimiter?: string;
}

export interface ConfigItemTabs extends ConfigItem {
    type: 'tabs';
    /** Object with panels `{"tab1": {}, "tab2": {}...}` */
    items: Record<string, ConfigItemPanel>;
    /** `bottom`, `end`, `start` or `top`. Only for panels that has `icon` attribute. Default: `start` */
    iconPosition?: 'bottom' | 'end' | 'start' | 'top';
    /** CSS Styles in React format (`marginLeft` and not `margin-left`) for the Mui-Tabs component */
    tabsStyle?: CustomCSSProperties;
    /** i18n definitions: true - load from a file, string - name of subdirectory, object - translations */
    i18n?: boolean | string | Record<string, Record<ioBroker.Languages, string>>;
}

export interface ConfigItemText extends ConfigItem {
    type: 'text';
    /** max length of the text in field */
    maxLength?: number;
    /** @deprecated use maxLength */
    max?: number;
    /** read-only field */
    readOnly?: boolean;
    /** default is true. Set this attribute to `false` if trim is not desired. */
    trim?: boolean;
    /** default is 1. Set this attribute to `2` or more if you want to have a textarea with more than one row. */
    minRows?: number;
    /** max rows of textarea. Used only if `minRows` > 1. */
    maxRows?: number;
    /** if true, the clear button will not be shown */
    noClearButton?: boolean;
    /** if true, the text will be validated as JSON */
    validateJson?: boolean;
    /** if true, the JSON will be validated only if the value is not empty */
    allowEmpty?: boolean;
    /** the value is time in ms or a string. Used only with readOnly flag */
    time?: boolean;
}

export interface ConfigItemColor extends ConfigItem {
    type: 'color';
    /** if true, the clear button will not be shown */
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

export interface ConfigItemQrCode extends ConfigItem {
    type: 'qrCode';
    /** Data to show in the QR code */
    data: string;
    /** Size of the QR code */
    size?: number;
    /** Foreground color */
    fgColor?: string;
    /** Background color */
    bgColor?: string;
    /** QR code level */
    level?: 'L' | 'M' | 'Q' | 'H';
}

export interface ConfigItemPassword extends ConfigItem {
    type: 'password';
    /** repeat password must be compared with password */
    repeat?: boolean;
    /** true if allow viewing the password by toggling the view button (only for a new password while entering) */
    visible?: boolean;
    /** The read-only flag. Visible is automatically true if readOnly is true */
    readOnly?: boolean;
    /** max length of the text in field */
    maxLength?: number;
    /** @deprecated use maxLength */
    max?: number;
}

export interface ConfigItemObjectId extends ConfigItem {
    type: 'objectId';
    /** Desired type: `channel`, `device`, ... (has only `state` by default). It is plural, because `type` is already occupied. */
    types?: ObjectBrowserType | ObjectBrowserType[];
    /** Show only this root object and its children */
    root?: string;
    /** Cannot be used together with `type` settings. It is an object and not a JSON string. Examples
     *  - `{common: {custom: true}}` - show only objects with some custom settings
     *  - `{common: {custom: 'sql.0'}}` - show only objects with sql.0 custom settings (only of the specific instance)
     *  - `{common: {custom: '_dataSources'}}` - show only objects of adapters `influxdb` or `sql` or `history`
     *  - `{common: {custom: 'adapterName.'}}` - show only objects of custom settings of specific adapter (all instances)
     *  - `{type: 'channel'}` - show only channels
     *  - `{type: ['channel', 'device']}` - show only channels and devices
     *  - `{common: {type: 'number'}` - show only states of type 'number
     *  - `{common: {type: ['number', 'string']}` - show only states of type 'number and string
     *  - `{common: {role: 'switch'}` - show only states with roles starting from switch
     *  - `{common: {role: ['switch', 'button']}` - show only states with roles starting from `switch` and `button`
     */
    customFilter?: ObjectBrowserCustomFilter;
    /** some predefined search filters */
    filters?: {
        id?: string;
        name?: string;
        room?: string;
        func?: string;
        role?: string;
        type?: string;
        custom?: string;
    };
    /** Cannot be used together with `type` settings. It is a function that will be called for every object and must return true or false. Example: `obj.common.type === 'number'` */
    filterFunc?: (obj: ioBroker.Object) => boolean;
}

export interface ConfigItemSlider extends ConfigItem {
    type: 'slider';
    min?: number;
    max?: number;
    step?: number;
    /** Unit of slider */
    unit?: string;
}

export interface ConfigItemTopic extends ConfigItem {
    type: 'topic';
    /** max length of the text in field */
    maxLength?: number;
    /** @deprecated use maxLength */
    max?: number;
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
    /** without "system.user." */
    short?: boolean;
}

export interface ConfigItemStaticDivider extends ConfigItem {
    type: 'divider';
    color?: 'primary' | 'secondary' | string;
    height?: string | number;
}

export interface ConfigItemStaticHeader extends ConfigItem {
    type: 'header';
    size?: 1 | 2 | 3 | 4 | 5;
    text: ioBroker.StringOrTranslated;
    noTranslation?: boolean;
}

export interface ConfigItemStaticImage extends ConfigItem {
    type: 'staticImage';
    /** name of picture (from admin directory) */
    src: string;
    /** optional HTTP link */
    href?: string;
}

export interface ConfigItemStaticText extends Omit<ConfigItem, 'button'> {
    type: 'staticText';
    /** multi-language text */
    text: string;
    /** @deprecated use text */
    label?: ioBroker.StringOrTranslated;
    /** link. Link could be dynamic like `#tab-objects/customs/${data.parentId} */
    href?: string;
    /** show a link as button */
    button?: boolean;
    /** type of button (`outlined`, `contained`, `text`) */
    variant?: 'contained' | 'outlined' | 'text';
    /** color of button (e.g. `primary`) */
    color?: 'primary' | 'secondary' | 'grey';
    /** if icon should be shown: `auth`, `send`, `web`, `warning`, `error`, `info`, `search`, `book`, `help`, `upload`. You can use `base64` icons (it starts with `data:image/svg+xml;base64,...`) or `jpg/png` images (ends with `.png`) . (Request via issue if you need more icons) */
    icon?: ConfigIconType;
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
    /** `[{label: {en: "option 1"}, value: 1}, ...]` or
     `[{"items": [{"label": "Val1", "value": 1}, {"label": "Val2", value: "2}], "name": "group1"}, {"items": [{"label": "Val3", "value": 3}, {"label": "Val4", value: "4}], "name": "group2"}, {"label": "Val5", "value": 5}]`
    */
     options: (ConfigItemSelectOption | {
        items: ConfigItemSelectOption[];
        label: ioBroker.StringOrTranslated;
        value?: number | string;
        hidden?: string | boolean;
    })[];
    attr?: string;
}

export interface ConfigItemAutocomplete extends ConfigItem {
    type: 'autocomplete';
    options: (string | ConfigItemSelectOption)[];
    freeSolo?: boolean;
}

export interface ConfigItemSetState extends ConfigItem {
    type: 'setState';
    /** `system.adapter.myAdapter.%INSTANCE%.test`, you can use the placeholder `%INSTANCE%` to replace it with the current instance name */
    id: string;
    /** false (default false) */
    ack?: boolean;
    /** '${data.myText}_test' or number. Type will be detected automatically from the state type and converting done too */
    val: ioBroker.StateValue;
    /** Alert which will be shown by pressing the button */
    okText?: ioBroker.StringOrTranslated;
    variant?: 'contained' | 'outlined';
    color?: 'primary' | 'secondary' | 'grey';
    /** Error translations */
    error?: { [error: string]: ioBroker.StringOrTranslated };
}

export interface ConfigItemAutocompleteSendTo extends Omit<ConfigItem, 'data'> {
    type: 'autocompleteSendTo';
    command?: string;
    jsonData?: string;
    options?: (string | ConfigItemSelectOption)[];
    data?: Record<string, any>;
    freeSolo?: boolean;
    /** max length of the text in field */
    maxLength?: number;
    /** @deprecated use maxLength */
    max?: string;
    alsoDependsOn?: string[];
}

export interface ConfigItemAccordion extends ConfigItem {
    type: 'accordion';
    /** Title shown on the accordion */
    titleAttr?: string;
    /** If delete or add disabled, If noDelete is false, add, delete and move up/down should work */
    noDelete?: boolean;
    /** If clone button should be shown. If true, the clone button will be shown. If attribute name, this name will be unique. */
    clone?: boolean | string;
    /** Items of accordion */
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
    /** divider between latitude and longitude. Default "," (Used if longitudeName and latitudeName are not defined) */
    divider?: string;
    /** init field with current coordinates if empty */
    autoInit?: boolean;
    /** if defined, the longitude will be stored in this attribute, divider will be ignored */
    longitudeName?: string;
    /** if defined, the latitude will be stored in this attribute, divider will be ignored */
    latitudeName?: string;
    /** if defined, the checkbox with "Use system settings" will be shown and latitude, longitude will be read from system.config, a boolean will be saved to the given name */
    useSystemName?: string;
    /** max length of the text in field */
    maxLength?: number;
    /** @deprecated use maxLength */
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
    /** max length of the text in field */
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

export interface ConfigItemImageSendTo extends Omit<ConfigItem, 'data'> {
    type: 'imageSendTo';
    command?: string;
    alsoDependsOn?: string[];
    height?: number | string;
    data?: Record<string, any>;
}

export interface ConfigItemSendTo extends Omit<ConfigItem, 'data'> {
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
    icon?: ConfigIconType;
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

export interface ConfigItemTextSendTo extends Omit<ConfigItem, 'data'> {
    type: 'textSendTo';
    container?: 'text' | 'div';
    /** if true - show copy to clipboard button */
    copyToClipboard?: boolean;
    /** by change of which attributes, the command must be resent */
    alsoDependsOn?: string[];
    /** sendTo command */
    command?: string;
    /** string - `{"subject1": "${data.subject}", "options1": {"host": "${data.host}"}}`. This data will be sent to the backend */
    jsonData?: string;
    /** object - `{"subject1": 1, "data": "static"}`. You can specify jsonData or data, but not both. This data will be sent to the backend if jsonData is not defined. */
    data?: Record<string, any>;
}

export interface ConfigItemSelectSendTo extends Omit<ConfigItem, 'data'> {
    type: 'selectSendTo';
    /** allow manual editing. Without drop-down menu (if instance is offline). Default `true`. */
    manual?: boolean;
    /** Multiple choice select */
    multiple?: boolean;
    /** show item even if no label was found for it (by multiple), default=`true` */
    showAllValues?: boolean;
    /** if true, the clear button will not be shown */
    noClearButton?: boolean;
    /** sendTo command */
    command?: string;
    /** string - `{"subject1": "${data.subject}", "options1": {"host": "${data.host}"}}`. This data will be sent to the backend */
    jsonData?: string;
    /** object - `{"subject1": 1, "data": "static"}`. You can specify jsonData or data, but not both. This data will be sent to the backend if jsonData is not defined. */
    data?: Record<string, any>;
    /** by change of which attributes, the command must be resent */
    alsoDependsOn?: string[];
}

export interface ConfigItemTable extends ConfigItem {
    type: 'table';
    items?: ConfigItemTableIndexed[];
    /** If delete or add disabled, If noDelete is false, add, delete and move up/down should work */
    noDelete?: boolean;
    /** @deprecated don't use */
    objKeyName?: string;
    /** @deprecated don't use */
    objValueName?: string;
    /** If add allowed even if filter is set */
    allowAddByFilter?: boolean;
    /** The number of lines from which the second add button at the bottom of the table will be shown. Default 5 */
    showSecondAddAt?: number;
    /** Show first plus button on top of the first column and not on the left. */
    showFirstAddOnTop?: boolean;
    /** If clone button should be shown. If true, the clone button will be shown. If attribute name, this name will be unique. */
    clone?: boolean | string;
    /** If export button should be shown. Export as csv file. */
    export?: boolean;
    /** If import button should be shown. Import from csv file. */
    import?: boolean;
    /** Show table in compact mode */
    compact?: boolean;
    /** Specify the 'attr' name of columns which need to be unique */
    uniqueColumns?: string[];
    /** These items will be encrypted before saving with simple (not SHA) encryption method */
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

export interface ConfigItemCRON extends ConfigItem {
    type: 'cron';
    /** show CRON with "minutes", "seconds" and so on */
    complex?: boolean;
    /** show simple CRON settings */
    simple?: boolean;
}

export interface ConfigItemCertificateSelect extends ConfigItem {
    type: 'certificate';
}

export interface ConfigItemLicense extends ConfigItem {
    type: 'license';
    /** array of paragraphs with texts, which will be shown each as a separate paragraph */
    texts?: string[];
    /** URL to the license file (e.g. https://raw.githubusercontent.com/ioBroker/ioBroker.docs/master/LICENSE) */
    licenseUrl?: string;
    /** Title of the license dialog */
    title?: string;
    /** Text of the agreed button */
    agreeText?: string;
    /** If defined, the checkbox with the given name will be shown. If checked, the agreed button will be enabled. */
    checkBox?: string;
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

export interface ConfigItemJsonEditor extends ConfigItem {
    type: 'jsonEditor';
    /** if false, the text will be not validated as JSON */
    validateJson?: boolean;
    /** if true, the JSON will be validated only if the value is not empty */
    allowEmpty?: boolean;
}

export interface ConfigItemInterface extends ConfigItem {
    type: 'interface';
    /** do not show loopback interface (127.0.0.1) */
    ignoreLoopback?: boolean;
    /** do not show internal interfaces (normally it is 127.0.0.1 too) */
    ignoreInternal?: boolean;
}

export interface ConfigItemImageUpload extends ConfigItem {
    type: 'image';
    /** name of file is structure name. In the below example `login-bg.png` is file name for `writeFile("myAdapter.INSTANCE", "login-bg.png")` */
    filename?: string;
    /** html accept attribute, like `{ 'image/**': [], 'application/pdf': ['.pdf'] }`, default `{ 'image/*': [] }` */
    accept?: Record<string, string[]>;
    /** maximal size of file to upload */
    maxSize?: number;
    /** if true, the image will be saved as data-url in attribute, elsewise as binary in file storage */
    base64?: boolean;
    /** if true, allow user to crop the image */
    crop?: boolean;
}

export interface ConfigItemInstanceSelect extends ConfigItem {
    type: 'instance';
    /** name of adapter. With special name `_dataSources` you can get all adapters with flag `common.getHistory`. */
    adapter?: string;
    /** optional list of adapters, that should be shown. If not defined, all adapters will be shown. Only active if `adapter` attribute is not defined. */
    adapters?: string[];
    /** if true. Additional option "deactivate" is shown */
    allowDeactivate?: boolean;
    /** if true. Only enabled instances will be shown */
    onlyEnabled?: boolean;
    /** value will look like `system.adapter.ADAPTER.0` and not `ADAPTER.0` */
    long?: boolean;
    /** value will look like `0` and not `ADAPTER.0` */
    short?: boolean;
    /** Add to the options "all" option with value `*` */
    all?: boolean;
}

export interface ConfigItemFile extends ConfigItem {
    type: 'file';
    /** if a user can manually enter the file name and not only through select dialog */
    disableEdit?: boolean;
    /** limit selection to one specific object of type `meta` and the following path (not mandatory) */
    limitPath?: string;
    /** like `['png', 'svg', 'bmp', 'jpg', 'jpeg', 'gif']` */
    filterFiles?: string[];
    /** allowed upload of files */
    allowUpload?: boolean;
    /** allowed download of files (default true) */
    allowDownload?: boolean;
    /** allowed creation of folders */
    allowCreateFolder?: boolean;
    /** allowed tile view (default true) */
    allowView?: boolean;
    /** show toolbar (default true) */
    showToolbar?: boolean;
    /** user can select only folders (e.g., for uploading path) */
    selectOnlyFolders?: boolean;
    /** trim the filename */
    trim?: boolean;
    /** max length of the file name */
    maxLength?: number;
    /** @deprecated use maxLength */
    max?: number;
}

export interface ConfigItemFileSelector extends ConfigItem {
    type: 'fileSelector';
    /** File extension pattern. Allowed `**\/*.ext` to show all files from subfolders too, `*.ext` to show from root folder or `folderName\/*.ext` to show all files in sub-folder `folderName`. Default `**\/*.*`. */
    pattern: string;
    /** type of files: `audio`, `image`, `text` */
    fileTypes?: 'audio' | 'image' | 'text';
    /** Object ID of type `meta`. You can use special placeholder `%INSTANCE%`: like `myAdapter.%INSTANCE%.files` */
    objectID?: string;
    /** path, where the uploaded files will be stored. Like `folderName`. If not defined, no upload field will be shown. To upload in the root, set this field to `/`. */
    upload?: string;
    /** Show refresh button near the select. */
    refresh?: boolean;
    /** max file size (default 2MB) */
    maxSize?: number;
    /** show folder name even if all files in the same folder */
    withFolder?: boolean;
    /** Allow deletion of files */
    delete?: boolean;
    /** Do not show `none` option */
    noNone?: boolean;
    /** Do not show the size of files */
    noSize?: boolean;
}

export type ConfigItemAny = ConfigItemAlive | ConfigItemAutocomplete |
    ConfigItemAutocompleteSendTo | ConfigItemPanel |
    ConfigItemTabs | ConfigItemText |
    ConfigItemNumber | ConfigItemColor | ConfigItemCheckbox |
    ConfigItemSlider | ConfigItemIP | ConfigItemUser | ConfigItemRoom | ConfigItemFunc |
    ConfigItemSelect | ConfigItemAccordion | ConfigItemCoordinates |
    ConfigItemDivider | ConfigItemHeader | ConfigItemCustom | ConfigItemDatePicker |
    ConfigItemDeviceManager | ConfigItemLanguage | ConfigItemPort | ConfigItemSendTo |
    ConfigItemTable | ConfigItemTimePicker | ConfigItemTextSendTo | ConfigItemSelectSendTo |
    ConfigItemCertCollection | ConfigItemCertificateSelect | ConfigItemCertificates | ConfigItemUUID |
    ConfigItemCheckLicense | ConfigItemPattern | ConfigItemChip | ConfigItemCRON | ConfigItemFile |
    ConfigItemFileSelector | ConfigItemImageSendTo | ConfigItemInstanceSelect | ConfigItemImageUpload |
    ConfigItemInterface | ConfigItemJsonEditor | ConfigItemLicense | ConfigItemPassword |
    ConfigItemSetState | ConfigItemStaticDivider | ConfigItemStaticHeader |
    ConfigItemStaticImage | ConfigItemStaticText | ConfigItemTopic |
    ConfigItemObjectId | ConfigItemQrCode;
