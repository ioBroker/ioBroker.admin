# ioBroker JSON Config
Admin (from version 6) supports JSON configuration for adapters.
It is possible to define the configuration in JSON file and then use it in Admin.

Example of `jsonConfig.json` file with multiple tabs can be found here: https://github.com/ioBroker/ioBroker.admin/blob/master/admin/jsonConfig.json5
and example with just one panel here: https://github.com/ioBroker/ioBroker.dwd/blob/master/admin/jsonConfig.json

You can define the settings in JSON or in JSON5 format. JSON5 is more human-readable and supports comments.

Additionally, to the JSON file, you must define in the `io-package.json` in `common` part:
```json
{
  "common": {
    "adminUI": {
      "config": "json"
    }
  }
}
```
to say that the adapter supports JSON configuration.

You can see almost all components in action if you test this adapter: https://github.com/mcm4iob/ioBroker.jsonconfig-demo.
You can install it via GitHub icon in admin by entering `iobroker.jsonconfig-demo` on the npm tab.

The schema for JSON config file is defined here: https://github.com/ioBroker/adapter-react-v5/blob/main/schemas/jsonConfig.json

All labels, texts, help texts can be multi-language or just strings.

*If the attribute name starts with "_" it will not be saved in the object.*

## Includes
Requires admin 6.17.1 or newer.

To write complex JSON files, you can include other JSON files.
The included file must be in the same directory as the main file.

```json5
{
    "tabs": {
        "tab1": {
            "type": "panel", // data will be combined with the content of "tab1.json". If the same attribute is defined in both files, the value from the included file will be used.
            "#include": "tab1.json"
        }
    }
}
```

## Possible control types
Possible types:

- `tabs` - Tabs with items
  - `items` - Object with panels `{"tab1": {}, "tab2": {}...}`
  - `iconPosition` - `bottom`, `end`, `start` or `top`. Only for panels that has `icon` attribute. Default: `start`
  - `tabsStyle` - CSS Styles in React format (`marginLeft` and not `margin-left`) for the Mui-Tabs component
  
- `panel` - Tab with items
  - `icon` - tab can have icon (base64 like `data:image/svg+xml;base64,...`) or `jpg/png` images (ends with `.png`)
  - `label` - Label of tab
  - `items` - Object `{"attr1": {}, "attr2": {}}...`
  - `collapsable` - only possible as not part of tabs[jsonConfig.json](..%2F..%2F..%2F..%2F..%2FioBroker.ring%2Fadmin%2FjsonConfig.json)
  - `color` - color of collapsable header `primary` or `secondary` or nothing
  - `innerStyle` - CSS Styles for inner div in React format (`marginLeft` and not `margin-left`) for the Panel component. Not used for collapsable panels.

- `text` - Text component
  - `maxLength` - max length of the text in field
  - `readOnly` - read-only field
  - `trim` - default is true. Set this attribute to `false` if trim is not desired.
  - `minRows` - default is 1. Set this attribute to `2` or more if you want to have a textarea with more than one row.  
  - `maxRows` - max rows of textarea. Used only if `minRows` > 1.
  - `noClearButton` - if true, the clear button will not be shown (admin >= 6.17.13)
  - `validateJson` - if true, the text will be validated as JSON
  - `allowEmpty` - if true, the JSON will be validated only if the value is not empty
  - `time` - the value is time in ms or a string. Used only with readOnly flag

- `number`
  - `min` - minimal value
  - `max` - maximal value
  - `step` - step

- `color` - color picker
  - `noClearButton` - if true, the clear button will not be shown (admin >= 6.17.13)

- `checkbox` - show checkbox

- `slider` - show slider (only Admin6)              
  - `min` - (default 0)
  - `max` - (default 100)
  - `step` - (default `(max - min) / 100`)
  - `unit` - Unit of slider

- `qrCode` - show data in a QR Code (up from Admin 7)
  - `data` - the data to be encoded in the QR Code
  - `size` - size of the QR code
  - `fgColor` - Foreground color
  - `bgColor` - Background color
  - `level` - QR code level (`L` `M` `Q` `H`)

- `ip` - bind address
  - `listenOnAllPorts` - add 0.0.0.0 to option
  - `onlyIp4` - show only IP4 addresses
  - `onlyIp6` - show only IP6 addresses
  - `noInternal` - do not show internal IP addresses

- `user` - Select user from system.user. (With color and icon)
  - `short` - no system.user.

- `room` - Select room from `enum.room` (With color and icon) - (only Admin6)
  - `short` - no `enum.rooms.`
  - `allowDeactivate` - allow letting room empty

- `func` - Select function from `enum.func` (With color and icon) - (only Admin6)
  - `short` - no `enum.func.`
  - `allowDeactivate` - allow letting functionality empty

- `select` 
  - `options` - `[{label: {en: "option 1"}, value: 1}, ...]` or
                `[{"items": [{"label": "Val1", "value": 1}, {"label": "Val2", value: "2}], "name": "group1"}, {"items": [{"label": "Val3", "value": 3}, {"label": "Val4", value: "4}], "name": "group2"}, {"label": "Val5", "value": 5}]`

- `autocomplete`
  - `options` - `["value1", "value2", ...]` or `[{"value": "value", "label": "Value1"}, "value2", ...]` (keys must be unique)
  - `freeSolo` - Set `freeSolo` to `true`, so the textbox can contain any arbitrary value.

- `image` - saves image as file of the `adapter.X` object or as base64 in attribute
  - `filename` - name of file is structure name. In the below example `login-bg.png` is file name for `writeFile("myAdapter.INSTANCE", "login-bg.png")`
  - `accept` - html accept attribute, like `{ 'image/**': [], 'application/pdf': ['.pdf'] }`, default `{ 'image/*': [] }`
  - `maxSize` - maximal size of file to upload
  - `base64` - if true the image will be saved as data-url in attribute, elsewise as binary in file storage
  - `crop` - if true, allow user to crop the image
  - `!maxWidth`
  - `!maxHeight`
  - `!square` - width must be equal to height, or crop must allow only square as shape
```
  "login-bg.png": {
       "type": "image",
       "accept": "image/png",
       "label": {
         "en": "Upload image"
       },
       "crop": true
     },
     "picture": {
       "type": "image",
       "base64": true,
       "accept": "image/*",
       "label": {
         "en": "Upload image"
       },
       "crop": true
     }
  }
```

- `objectId` - object ID: show it with name, color and icon
    - `types` - Desired type: `channel`, `device`, ... (has only `state` by default). It is plural, because `type` is already occupied.
    - `root` - [optional] Show only this root object and its children
    - `customFilter` - [optional] Cannot be used together with `type` settings. It is an object and not a JSON string. Examples
       - `{common: {custom: true}}` - show only objects with some custom settings
       - `{common: {custom: 'sql.0'}}` - show only objects with sql.0 custom settings (only of the specific instance)
       - `{common: {custom: '_dataSources'}}` - show only objects of adapters `influxdb` or `sql` or `history`
       - `{common: {custom: 'adapterName.'}}` - show only objects of custom settings of specific adapter (all instances)
       - `{type: 'channel'}` - show only channels
       - `{type: ['channel', 'device']}` - show only channels and devices
       - `{common: {type: 'number'}` - show only states of type 'number
       - `{common: {type: ['number', 'string']}` - show only states of type 'number and string
       - `{common: {role: 'switch'}` - show only states with roles starting from switch
       - `{common: {role: ['switch', 'button']}` - show only states with roles starting from `switch` and `button`
    - `filterFunc` - [optional] Cannot be used together with `type` settings. It is a function that will be called for every object and must return true or false. Example: `obj.common.type === 'number'`

- `password` - password field
  This field-type just have an effect in the UI.
  Passwords and other sensitive data should be stored encrypted!
  To do this, the key must be provided in the io-package.json under [nativeEncrypted](https://github.com/ioBroker/ioBroker.js-controller#automatically-encryptdecrypt-configuration-fields).
  Additionally, you can protect this property from being served to other adapters but `admin` and `cloud` by adding it to `protectedNative` in `io-package.json` file.
    - `repeat` - repeat password must be compared with password
    - `visible` - true if allow viewing the password by toggling the view button (only for a new password while entering)
    - `readOnly` - the read-only flag. Visible is automatically true if readOnly is true
    - `maxLength` - max length of the text in field

- `instance`
    - `adapter` - name of adapter. With special name `_dataSources` you can get all adapters with flag `common.getHistory`.
    - `adapters` - optional list of adapters, that should be shown. If not defined, all adapters will be shown. Only active if `adapter` attribute is not defined.
    - `allowDeactivate` - if true. Additional option "deactivate" is shown
    - `onlyEnabled` - if true. Only enabled instances will be shown
    - `long` - value will look like `system.adapter.ADAPTER.0` and not `ADAPTER.0`
    - `short` - value will look like `0` and not `ADAPTER.0`
    - `all` - Add to the options "all" option with value `*`

- `chips` - user can enter the word, and it will be added (see cloud => services => White list). Output is an array if no `delimiter` defined.
    - `delimiter` - if it is defined, so the option will be stored as string with delimiter instead of an array. E.g., by `delimiter=;` you will get `a;b;c` instead of `['a', 'b', 'c']`

- `alive` - just indication if the instance is alive, and it could be used in "hidden" and "disabled" (will not be saved in config)
  Just text: Instance is running, Instance is not running
    - `instance` - check if the instance is alive. If not defined, it will be used current instance. You can use `${data.number}` pattern in the text.
    - `textAlive` - default text is `Instance %s is alive`, where %s will be replaced by `ADAPTER.0`. The translation must exist in i18n files
    - `textNotAlive` - default text is `Instance %s is not alive`, where %s will be replaced by `ADAPTER.0`. The translation must exist in i18n files

- `pattern` - read-only field with pattern like 'https://${data.ip}:${data.port}' (will not be saved in config)
  Text input with the read-only flag, that shows a pattern.
    - `copyToClipboard` - if true - show button
    - `pattern` - my pattern

- `sendto` - button that sends request to instance (https://github.com/iobroker-community-adapters/ioBroker.email/blob/master/admin/index_m.html#L128)
    - `command` - (Default `send`)
    - `jsonData` - string - `"{\"subject1\": \"${data.subject}\", \"options1\": {\"host\": \"${data.host}\"}}"`. You can use special variables `data._origin` and `data._originIp` to send to instance the caller URL, like `http://127.0.0.1:8081/admin`.
    - `data` - object - `{"subject1": 1, "data": "static"}`. You can specify jsonData or data, but not both.
    - `result` - `{result1: {en: 'A'}, result2: {en: 'B'}}`
    - `error` - `{error1: {en: 'E'}, error2: {en: 'E2'}}`
    - `variant` - `contained`, `outlined` or nothing
    - `openUrl` - if true - open URL in new tab, if response contains attribute `openUrl`, like `{"openUrl": "http://1.2.3.4:80/aaa", "window": "_blank", "saveConfig": true}`. If `saveConfig` is true, the user will be requested to save the configuration.
    - `reloadBrowser` - if true - reload the current browser window, if response contains attribute `reloadBrowser`, like `{"reloadBrowser": true}`.
    - `window` - if `openUrl` is true, this is a name of the new window. Could be overwritten if response consist `window` attribute.
      `this.props.socket.sendTo(adapterName.instance, command || 'send', data, result => {});`
    - `icon` - if icon should be shown: `auth`, `send`, `web`, `warning`, `error`, `info`, `search`. You can use `base64` icons (like `data:image/svg+xml;base64,...`) or `jpg/png` images (ends with `.png`). (Request via issue if you need more icons)
    - `useNative` - if adapter returns a result with `native` attribute it will be used for configuration. If `saveConfig` is true, the user will be requested to save the configuration.
    - `showProcess` - Show spinner while request is in progress
    - `timeout` - timeout for request in ms. Default: none.
    - `onLoaded` - execute the button logic once initially

- `setState` - button that set instance's state
    - `id` - `system.adapter.myAdapter.%INSTANCE%.test`, you can use the placeholder `%INSTANCE%` to replace it with the current instance name
    - `ack` - false (default false)
    - `val` - '${data.myText}_test' or number. Type will be detected automatically from the state type and converting done too
    - `okText` - Alert which will be shown by pressing the button
    - `variant` - `contained`, `outlined`, ''

- `staticText` - static text like description
    - `label` - multi-language text
    - `text` - same as label

- `staticLink` - static link
    - `label` - multi-language text
    - `href` - link. Link could be dynamic like `#tab-objects/customs/${data.parentId}`
    - `target` - `_blank` or `_self` or window name
    - `close` - if true, the GUI will be closed (used not for JsonConfig in admin, but for dynamic GUI)
    - `button` - show a link as button
    - `variant` - type of button (`outlined`, `contained`, `text`)
    - `color` - color of button (e.g. `primary`)
    - `icon` - if icon should be shown: `auth`, `send`, `web`, `warning`, `error`, `info`, `search`, `book`, `help`, `upload`. You can use `base64` icons (it starts with `data:image/svg+xml;base64,...`) or `jpg/png` images (ends with `.png`) . (Request via issue if you need more icons)

- `staticImage` - static image
    - `href` - optional HTTP link
    - `src` - name of picture (from admin directory)

- `table` - table with items that could be deleted, added, moved up, moved down
    - `items` - `[{"type": see above, "width": px or %, "title": {"en": "header"}, "attr": "name", "filter": false, "sort": true, "default": ""}]`
    - `noDelete` - boolean if delete or add disabled, If `noDelete` is false, add, delete and move up/down should work
    - `objKeyName` - (legacy setting, don't use!) - name of the key in `{"192.168.1.1": {delay: 1000, enabled: true}, "192.168.1.2": {delay: 2000, enabled: false}}`
    - `objValueName` - (legacy setting, don't use!) - name of the value in `{"192.168.1.1": "value1", "192.168.1.2": "value2"}`
    - `allowAddByFilter` - if add allowed even if filter is set
    - `showSecondAddAt` - Number of lines from which the second add button at the bottom of the table will be shown. Default 5
    - `showFirstAddOnTop` - Show first plus button on top of the first column and not on the left.
    - `clone` - [optional] - if clone button should be shown. If true, the clone button will be shown. If attribute name, this name will be unique.
    - `export` - [optional] - if export button should be shown. Export as csv file.
    - `import` - [optional] - if import button should be shown. Import from csv file.
    - `uniqueColumns` - [optional] - specify an array of columns, which need to have unique entries
    - `encryptedAttributes` - [optional] - specify an array of columns, which should be encrypted
    - `compact` - [optional] - if true, the table will be shown in a compact mode

- `accordion` - accordion with items that could be deleted, added, moved up, moved down (Admin 6.6.0 and newer)
    - `items` - `[{"type": see above, "attr": "name", "default": ""}]` - items can be placed like on a `panel` (xs, sm, md, lg and newLine)
    - `titleAttr` - key of the item's list which should be used as name
    - `noDelete` - boolean if delete or add disabled, If `noDelete` is false, add, delete and move up/down should work
    - `clone` - [optional] - if clone button should be shown. If true, the clone button will be shown. If attribute name, this name will be unique.

- `jsonEditor` - json editor
    - `validateJson` - if false, the text will be not validated as JSON
    - `allowEmpty` - if true, the JSON will be validated only if the value is not empty

- `language` - select language
    - `system` - allow the usage of the system language from `system.config` as default (will have an empty string value if selected)

- `certificate`
    - `certType` - on of: `public`, `private`, `chained`. But from 6.4.0 you can use `certificates` type.

- `certificates` - it is a universal type that manages `certPublic`, `certPrivate`, `certChained` and `leCollection` attributes for you.
  Example:
```json
{
   "_certs": {
       "type": "certificates",
       "newLine": true,
       "hidden": "!data.secure",
       "sm": 12
   }
}
  ```

- `certCollection` - select certificate collection or just use all collections or don't use let's encrypt at all.
    - `leCollectionName` - name of the certificate collection

- `custom` (only Admin6)
    - `name` - Component name that will be provided via props, like ComponentInstancesEditor
    - `url` - Location of the component
        - `custom/customComponents.js`: in this case the files will be loaded from `/adapter/ADAPTER_NAME/custom/customComponents.js`
        - `https://URL/myComponent`: direct from URL
        - `./adapter/ADAPTER_NAME/custom/customComponent.js`: in this case the files will be loaded from `/adapter/ADAPTER_NAME/custom/customComponents.js`
    - `i18n` - true if `i18n/xx.json` files are located in the same directory as component, or translation object `{"text1": {"en": Text1"}}`

- `datePicker` - allow the user to select a date input the UI format comes from the configured `dateFormat` in the users' installation. The
component returns a parseable date string.

- `timePicker` - allow the user to select a date input the returned string is a parseable date string or of format `HH:mm:ss`
    - `format` - format passed to the date picker defaults to `HH:mm:ss`
    - `views`  - Configure which views should be shown to the users. Defaults to `['hours', 'minutes', 'seconds']`
    - `timeSteps` - Represent the available time steps for each view. Defaults to `{ hours: 1, minutes: 5, seconds: 5 }`
    - `returnFormat` - `fullDate` or `HH:mm:ss`. Defaults to full date for backward compatibility reasons.

- `divider` - horizontal line
    - `height` - optional height
    - `color` - optional divider color or `primary`, `secondary`

- `header`
    - `text`
    - `size` - 1-5 => h1-h5

- `cron`
    - `complex` - show CRON with "minutes", "seconds" and so on
    - `simple` - show simple CRON settings

- `fileSelector` (only Admin6)
    - `pattern` - File extension pattern. Allowed `**/*.ext` to show all files from subfolders too, `*.ext` to show from root folder or `folderName/*.ext` to show all files in sub-folder `folderName`. Default `**/*.*`.
    - `fileTypes` - [optional] type of files: `audio`, `image`, `text`
    - `objectID` - Object ID of type `meta`. You can use special placeholder `%INSTANCE%`: like `myAdapter.%INSTANCE%.files`
    - `upload` - path, where the uploaded files will be stored. Like `folderName`. If not defined, no upload field will be shown. To upload in the root, set this field to `/`.
    - `refresh` - Show refresh button near the select.
    - `maxSize` - max file size (default 2MB)
    - `withFolder` - show folder name even if all files in same folder
    - `delete` - Allow deletion of files
    - `noNone` - Do not show `none` option
    - `noSize` - Do not show size of files

- `file` (only Admin6)
  Input field with file selector
    - `disableEdit` - if user can manually enter the file name and not only through select dialog
    - `limitPath` - limit selection to one specific object of type `meta` and following path (not mandatory)
    - `filterFiles` - like `['png', 'svg', 'bmp', 'jpg', 'jpeg', 'gif']`
    - `allowUpload` - allowed upload of files
    - `allowDownload` - allowed download of files (default true)
    - `allowCreateFolder` - allowed creation of folders
    - `allowView` - allowed tile view (default true)
    - `showToolbar` - show toolbar (default true)
    - `selectOnlyFolders` - user can select only folders (e.g. for upload path)
    - `trim` - trim the file name

- `imageSendTo` - shows image, that was received from backend as base64 string
    - `width` - width of QR code in px
    - `height` - height of QR code in px
    - `command` - sendTo command
    - `jsonData` - string - `{"subject1": "${data.subject}", "options1": {"host": "${data.host}"}}`. This data will be sent to backend
    - `data` - object - `{"subject1": 1, "data": "static"}`. You can specify jsonData or data, but not both. This data will be sent to backend if jsonData is not defined.
  Example of code in back-end:
```
adapter.on('message', obj => {
    if (obj.command === 'send') {
        const QRCode = require('qrcode');
        QRCode.toDataURL('3ca4234a-fd81-fdb8-5584-08c732f70e4d', (err, url) =>
            obj.callback && adapter.sendTo(obj.from, obj.command, url, obj.callback));
    }
});
```  

- `selectSendTo`
  Shows the drop-down menu with the given from the instance values.
    - `command` - sendTo command
    - `jsonData` - string - `{"subject1": "${data.subject}", "options1": {"host": "${data.host}"}}`. This data will be sent to the backend
    - `data` - object - `{"subject1": 1, "data": "static"}`. You can specify jsonData or data, but not both. This data will be sent to the backend if jsonData is not defined.
    - `manual` - allow manual editing. Without drop-down menu (if instance is offline). Default `true`.
    - `multiple` - Multiple choice select
    - `showAllValues` - show item even if no label was found for it (by multiple), default=`true`
    - `noTranslation` - do not translate label of selects  
      To use this option, your adapter must implement message handler:
      The result of command must be an array in form `[{"value": 1, "label": "one"}, ...]`
    - `alsoDependsOn` - by change of which attributes, the command must be resent
```
adapter.on('message', obj => {
   if (obj) {
       switch (obj.command) {
           case 'command':
               if (obj.callback) {
                   try {
                       const { SerialPort } = require('serialport');
                       if (SerialPort) {
                           // read all found serial ports
                           SerialPort.list()
                               .then(ports => {
                                   adapter.log.info(`List of port: ${JSON.stringify(ports)}`);
                                   adapter.sendTo(obj.from, obj.command, ports.map(item => ({label: item.path, value: item.path})), obj.callback);
                               })
                               .catch(e => {
                                   adapter.sendTo(obj.from, obj.command, [], obj.callback);
                                   adapter.log.error(e)
                               });
                       } else {
                           adapter.log.warn('Module serialport is not available');
                           adapter.sendTo(obj.from, obj.command, [{label: 'Not available', value: ''}], obj.callback);
                       }
                   } catch (e) {
                       adapter.sendTo(obj.from, obj.command, [{label: 'Not available', value: ''}], obj.callback);
                   }
               }

               break;
       }
   }
});
```

- `autocompleteSendTo`
  Shows autocomplete control with the given from the instance values.
  - `command` - sendTo command
  - `jsonData` - string - `{"subject1": "${data.subject}", "options1": {"host": "${data.host}"}}`. This data will be sent to the backend
  - `data` - object - `{"subject1": 1, "data": "static"}`. You can specify jsonData or data, but not both. This data will be sent to the backend if jsonData is not defined.
  - `freeSolo` - Set `freeSolo` to `true`, so the textbox can contain any arbitrary value.
  - `alsoDependsOn` - by change of which attributes, the command must be resent
  - `maxLength` - max length of the text in field
    
  To use this option, your adapter must implement message handler:
    The result of command must be an array in form `["value1", {"value": "value2", "label": "Value2"}, ...]` (keys must be unique)
    See `selectSendTo` for handler example

- `textSendTo`
  Shows readonly control with the given from the instance values.
  - `container` - div, text, html
  - `copyToClipboard` - if true - show button
  - `alsoDependsOn` - by change of which attributes, the command must be resent
  - `command` - sendTo command
  - `jsonData` - string - `{"subject1": "${data.subject}", "options1": {"host": "${data.host}"}}`. This data will be sent to the backend
  - `data` - object - `{"subject1": 1, "data": "static"}`. You can specify jsonData or data, but not both. This data will be sent to the backend if jsonData is not defined.
  To use this option, your adapter must implement a message handler:
    The result of command must be a string or object with the following parameters:
```
{
    text: 'text to show',  // mandatory
    style: {color: 'red'}, // optional
    icon: 'search',        // optional. It could be base64 or link to image in the same folder as jsonConfig.json file
                           // possible predefined names: edit, rename, delete, refresh, add, search, unpair, pair, identify, play, stop, puase, forward, backward, next, previous, lamp, backlight, dimmer, socket, settings, group, user, qrcode, connection, no-connection, visible
    iconStyle: {width: 30} // optional
}
```

Example:
```
adapter.on('message', obj => {
    if (obj) {
      switch (obj.command) {
        case 'command':
          obj.callback && adapter.sendTo(obj.from, obj.command, 'Received ' + JSON.stringify(obj.message), obj.callback);
          // or with style
          obj.callback && adapter.sendTo(obj.from, obj.command, { text: 'Received ' + JSON.stringify(obj.message), style: { color: 'red' }, icon: 'search', iconStyle: { width: 30 }}, obj.callback);
          // or as html
          obj.callback && adapter.sendTo(obj.from, obj.command, `<div style="color: green">${JSON.stringify(obj.message)}</div>`, obj.callback);
          break;
      }
    }
});
```

- `coordinates`
  Determines current location and used `system.config` coordinates if not possible in form "latitude,longitude"
  - `divider` - divider between latitude and longitude. Default "," (Used if longitudeName and latitudeName are not defined)
  - `autoInit` - init field with current coordinates if empty
  - `longitudeName` - if defined, the longitude will be stored in this attribute, divider will be ignored
  - `latitudeName` - if defined, the latitude will be stored in this attribute, divider will be ignored
  - `useSystemName` - if defined, the checkbox with "Use system settings" will be shown and latitude, longitude will be read from `system.config`, a boolean will be saved to the given name

- `interface`
  Selects the interface from of the host, where the instance runs
  - `ignoreLoopback` - do not show loopback interface (127.0.0.1) 
  - `ignoreInternal` - do not show internal interfaces (normally it is 127.0.0.1 too) 

- `license` - shows the license information if not already accepted. One of attributes `texts` or `licenseUrl` must be defined. When the license is accepted, the defined configuration attribute will be set to `true`.
  - `texts` - array of paragraphs with texts, which will be shown each as a separate paragraph
  - `licenseUrl` - URL to the license file (e.g. https://raw.githubusercontent.com/ioBroker/ioBroker.docs/master/LICENSE)
  - `title` - Title of the license dialog
  - `agreeText` - Text of the agreed button
  - `checkBox` - If defined, the checkbox with the given name will be shown. If checked, the agreed button will be enabled.

- `checkLicense` - Very special component to check the license online. It's required exactly `license` and `useLicenseManager` properties in native.
  - `uuid` - Check UUID
  - `version` - Check version

- `uuid` - Show iobroker UUID

- `port` - Special input for ports. It checks automatically if port is used by other instances and shows a warning
  - `min` - minimal allowed port number. It could be 0. And if the value is then zero, the check if the port is occupied will not happen. 
- 
- `state` - Show control or information from the state
  - `oid` - Which object ID should be taken for the controlling. The ID is without "adapter.X." prefix
  - `system` - If true, the state will be taken from system.adapter.XX.I. and not from XX.I
  - `control` - How the value of the state should be shown: `text`, `html`, `input`, `slider`, `select`, `button`, `switch`, `number`
  - `controlled` - If true, the state will be shown as switch, select, button, slider or text input. Used only if no control property is defined
  - `unit` - Add unit to the value
  - `trueText` - this text will be shown if the value is true
  - `trueTextStyle` - Style of the text if the value is true
  - `falseText` - this text will be shown if the value is false or if the control is a "button"
  - `falseTextStyle` - Style of the text if the value is false or if the control is a "button"
  - `trueImage` - This image will be shown if the value is true
  - `falseImage` - This image will be shown if the value is false or if the control is a "button"
  - `min` - Minimum value for control type slider or number
  - `max` - Maximum value for control type slider or number
  - `step` - Step value for control type slider or number
  - `controlDelay` - delay in ms for slider or number
  - `variant` - Variant of button: `contained`, `outlined`, `text`

- `deviceManager` - show device manager. For that, the adapter must support device manager protocol. See iobroker/dm-utils.
  Here is an example of how to show device manager in a tab:
```
"_deviceManager": {
  "type": "panel",
  "label": "Device manager",
  "items": {
    "_dm": {
      "type": "deviceManager",
      "sm": 12,
      "style": {
        "width": "100%",
        "height": "100%",
        "overflow": "hidden"
      }
    }
  },
  "style": {
    "width": "100%",
    "height": "100%",
    "overflow": "hidden"
  },
  "innerStyle": {
    "width": "100%",
    "height": "100%",
    "overflow": "hidden"
  }
}
```

## Common attributes of controls
All types could have:
- `sm` - width in 1/12 of screen on small screen
- `md` - width in 1/12 of screen on middle screens
- `lg` - width in 1/12 of screen on large screens
- `xs` - width in 1/12 of screen on tiny screens
- `newLine` - should be shown from new line
- `label` - String or object like {en: 'Name', ru: 'Имя'}
- `hidden` - JS function that could use `native.attribute` for calculation
- `hideOnlyControl` - if hidden the place will be shown, but no control
- `disabled` - JS function that could use `native.attribute` for calculation
- `help` - help text (multi-language)
- `helpLink` - href to help (could be used only together with `help`)
- `style` - css style in ReactJS notation: `radiusBorder` and not `radius-border`.
- `darkStyle` - css style for dark mode
- `validator` - JS function: true no error, false - error
- `validatorErrorText` - Text to show if validator fails
- `validatorNoSaveOnError` - disable save button if error
- `tooltip` - optional tooltip
- `default` - default value
- `defaultFunc` - JS function to calculate default value
- `defaultSendTo` - command to request initial value from running instance, example: `"myInstance": {"type": "text", "defaultSendTo": "fill"}`
  - `data` - static data
  - `jsonData` - static data
  - if no `data` and `jsonData` defined, the following info will be sent `{"attr": "<attribute name>", "value": "<current value>"}`
  - `button` - button label to re-trigger request from instance
  - `buttonTooltip` - Button tooltip (default: `Request data by instance`)
  - `buttonTooltipNoTranslation` - Do not translate button tooltip
  - `allowSaveWithError` - Allow saving of configuration even if the instance is offline
- `placeholder` - placeholder (for text control)
- `noTranslation` - do not translate selects or other options (not for help, label or placeholder)
- `onChange` - Structure in form `{"alsoDependsOn": ["attr1", "attr2"], "calculateFunc": "data.attr1 + data.attr2", "ignoreOwnChanges": true}`
- `doNotSave` - Do not save this attribute as used only for internal calculations
- `noMultiEdit` - if this flag set to true, this field will not be shown if user selected more than one object for edit.
- `confirm`
  - `condition` - JS function: true show confirm dialog
  - `text` - text of confirmation dialog
  - `title` - title of confirmation dialog
  - `ok` - Text for OK button
  - `cancel` - Text for Cancel button
  - `type` - One of: `info`, `warning`, `error`, `none`
  - `alsoDependsOn` - array with attributes, to check the condition by these attributes too

```
{
    "type": "tabs",
    "items": {
        "options1": {
            "type": "panel",
            "label": "Tab1",
            "icon": "base64 svg", // optional
            "items": {
                myPort: {
                    "type": "number",
                    "min": 1,
                    "max": 65565,
                    "label": "Number",
                    "sm": 6, // 1 - 12
                    "validator": "'"!!data.name"'", // else error
                    "hidden": "data.myType === 1", // hidden if myType is 1 
                    "disabled": "data.myType === 2" // disabled if myType is 2
                },
                "options.myType": { // name could support more than one levelhelperText
                    "newLine": true, // must start from new row
                    "type": "select",
                    "label": "Type",
                    "sm": 6, // 1 - 12
                    "options": [
                        {"label": "option 1", "value": 1},
                        {"label": "option 2", "value": 2}
                    ] 
                },
                "myBool": {
                    "type": "checkbox",
                    "label": "My checkbox",
                }
            }
        },
        "tab2": {
            "label": "Tab2",
            "disabled": "data.myType === 1",
            "hidden": "data.myType === 2",
        }
    },    
}
```

`Number`, `text`, `checkbox`, `select` support autocomplete to allow selection of options if used as custom settings.
In this case, the value will be provided as an array of all possible values.

Example:
```
...
   "timeout": {
      "type": "number",
      "label": "Timeout"
   }
...

data: {
   timeout: [1000, 2000, 3000]
}
```
In this case input must be text, where shown `__different__`, with the autocomplete option of three possible values.
Users can select from dropdown 1000, 2000 or 3000 or input their own new value, e.g., 500.

Boolean must support indeterminate if value is [false, true]

For non changed `__different__` the value different must be returned:

```
Input:
data: {
   timeout: [1000, 2000, 3000]
}

Output if timeout was not changed:
newData: {
   timeout: "__different__"
}
```

Value `__different__` is reserved and no one text input may accept it from user.

Component must look like
```
<SchemaEditor
    style={customStyle}
    className={classes.myClass}
    schema={schema}
    customInstancesEditor={CustomInstancesEditor}
    data={common.native}
    onError={(error, attribute) => error can be true/false or text. Attribute is optional}
    onChanged={(newData, isChanged) => console.log('Changed ' + isChanged)}
/>
```

If no schema is provided, the schema must be created automatically from data.
- `boolean` => checkbox
- `text` => text input
- `number` => number
- name `bind` => ip
- name `port` => number, min=1, max=0xFFFF
- name `timeout` => number, help="ms"

If element has no attribute `type`, assume it has default type 'panel'.

## Panel style
You can provide style for panels too. Here is an example with panel background:
```json
{
  "i18n": true,
  "type": "panel",
  "style": {
    "backgroundImage": "url(adapter/mpd/background.png)",
    "backgroundPosition": "top",
    "backgroundRepeat": "no-repeat",
    "backgroundSize": "cover"
  },
  "items": {
    "...": {}
  }
}
```

## i18n
There are several options to provide the translations.
Only the first one is compatible with our Community Translation Tool Weblate, so it should be favored over the others!

1. Users can provide texts from files.

On the top level of structure set `i18n: true` and provide files in admin:
- `admin/i18n/de/translations.json`
- `admin/i18n/en/translations.json`
- ...

or
- `admin/i18n/de.json`
- `admin/i18n/en.json`
- ...

Additionally, user can provide the path to i18n files, `i18n: "customI18n"`and provide files in admin:
- `admin/customI18n/de/translations.json`
- `admin/customI18n/en/translations.json`
- ...

or
- `admin/customI18n/de.json`
- `admin/customI18n/en.json`
- ...

2. User can provide translations directly in label like:
```
{
   "type": "text",
   "label: {
        "en": "Label",
        "de": "Taxt"
    }
}
```

3. User can provide translations in i18n attribute:
```
{
    "18n": {
        "My Text: {
            "en": "My Text",
            "de": "Mein Text"
        },
        "My Text2: {
            "en": "My Text2",
            "de": "Mein Text2"
        },
    },
    "type": "panel",
    ...
}
```

We suggest using variant 1 whenever possible, as it will be possible to process the texts with Weblate.

## JS Functions
### Configuration dialog
JS function is:
```
const myValidator = "_alive === true && data.options.myType == 2";

const func = new Function(
  'data',          // actual obj.native or obj.common.custom['adapter.X'] object
                   // If table, so data is current line in the table
  'originalData',  // data before changes
  '_system',       // system config => 'system.config'=>common
  '_alive',        // If instance is alive
  '_common',       // common part of instance = 'system.config.ADAPTER.X' => common 
  '_socket',       // socket connection
  '_instance',     // instance number
  'arrayIndex',    // filled only by table and represents the row index
  'globalData',    // filled only by table and represents the obj.native or obj.common.custom['adapter.X'] object
  '_changed'       // indicator if some data was changed and must be saved
  myValidator.includes('return') ? myValidator : 'return ' + myValidator); // e.g. "_alive === true"

const isValid = func(data, systemConfig.common, instanceAlive, adapter.common, this.props.socket);

```
If the `alive` status changes, so all fields must be updated, validated, disabled, hidden anew.

The following variables are available in JS function in adapter settings:
- `data` - native settings for this instance or current line in the table (to access all settings use globalData)
- `_system` - system configuration
- `_alive` - is instance being alive
- `_common` - common settings for this instance
- `_socket` - socket
- `_instance` - instance number
- `arrayIndex` - used only in table and represent current line in an array
- `globalData` - used only in table for all settings and not only one table line

### Custom settings dialog
JS function is:
```
const myValidator = "customObj.common.type === 'boolean' && data.options.myType == 2";

const func = new Function(
  'data',
  'originalData',
  '_system',
  'instanceObj',
  'customObj',
  '_socket',
  arrayIndex,
  myValidator.includes('return') ? myValidator : 'return ' + myValidator); // e.g. "_alive === true"

const isValid = func(data || this.props.data, this.props.originalData, this.props.systemConfig, instanceObj, customObj, this.props.socket);
```

The following variables are available in JS function in custom settings:
- `data` - current custom settings or current line in the table (to access all settings use globalData)
- `originalData` - Unchanged data
- `_system` - system configuration
- `instanceObj` - adapter instance object
- `customObj` - current object itself
- `_socket` - socket
- `arrayIndex` - used only in table and represent current line in an array
- `globalData` - used only in table for all settings and not only one table line

## Custom component
```
<CustomInstancesEditor
    common={common data}
    alive={isInstanceAlive}
    data={data}
    socket={this.props.socket}
    themeName={this.props.themeName}
    themeType={this.props.themeType}
    theme={this.props.theme}
    name="accessAllowedConfigs"
    onChange={(newData, isChanged) => {}} 
    onError={error => error can be true/false or text}
/>
```
You can find examples in [`telegram`](https://github.com/iobroker-community-adapters/ioBroker.telegram/tree/master/src-admin) or in [`pushbullet`](https://github.com/Jens1809/ioBroker.pushbullet/tree/master/src-admin) adapter.

## Schema
Schema is [here](https://github.com/ioBroker/adapter-react-v5/tree/master/schemas)
