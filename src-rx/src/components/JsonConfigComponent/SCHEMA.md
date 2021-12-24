# ioBroker JSON Config
**Note: attributes or controls marked with "!", are not yet implemented.**

All labels, texts, help texts can be multi-language or just strings.

*If the attribute name starts with "_" it will not be saved in the object.*

## Possible control types
Possible types:

- `tabs` - Tabs with items
  - `items` - Object with panels `{"tab1": {}, "tab2": {}...}`
  
- `panel` - Tab with items
  - `icon` - tab can have icon (base64)
  - `label` - Label of tab
  - `items` - Object `{"attr1": {}, "attr2": {}}...`
  - `collapsable` - only possible as not part of tabs
  - `color` - color of collapsable header `primary` or `secondary` or nothing

- `text` - Text component
  - `maxLength` - max length of text in field
  - `readOnly` - read only field

- `number`
  - `min` - minimal value
  - `max` - maximal value
  - `step` - step

- `color`

- `checkbox`

- `!slider`               
  - `min` - (default 0)
  - `max` - (default 100)
  - `step` - (default 1)

- `ip` - bind address
  - `listenOnAllPorts` - add 0.0.0.0 to option
  - `onlyIp4` - show only IP4 addresses
  - `onlyIp6` - show only IP6 addresses

- `user` - Select user from system.user. (With color and icon)
  - `short` - no system.user.

- `!room` - Select room from enum.room (With color and icon)
  - `short` - no system.room.

- `!func` - Select function from enum.func (With color and icon)
  - `short` - no system.func.

- `select` 
  - `options` - `[{label: {en: "option 1"}, value: 1}, ...]`

- `autocomplete`
  - `options` - `["value1", "value2", ...]` or `[{"value": "value", "label": "Value1"}, "value2", ...]`
  - `freeSolo` - Set freeSolo to true so the textbox can contain any arbitrary value.
  - `maxLength` - max length of text in field

- `!icon` - base64 icon
  - `maxSize`
  - `maxWidth`
  - `maxHeight`
  - `crop` - if true, allow user to crop the image (only for non svg)
  - `square` - width must be equal to height or crop must allow only square as shape 

- `image` - saves image as file of adapter.X object or as base64 in attribute
  - `filename` - name of file is structure name 
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
```
  `login-bg.png` is file name for writeFile('myAdapter.INSTANCE', 'login-bg.png')   
  - `accept` - html accept attribute, like "image/*,.pdf"
  - `maxSize` - 
  - `base64` - if true the image will be saved as data-url in attribute, elsewise as binary in file storage
  - `!maxWidth`
  - `!maxHeight`
  - `!crop` - if true, allow user to crop the image
  - `!square` - width must be equal to height or crop must allow only square as shape

- `!file` - saves file (not image) as file of adapter.0 object
  - `filename` - name of file

- `objectId` - object ID - show it with name, color and icon
  - `types` - Array of possible types: ['channel', 'device', ...] (has only `state` by default)

- `password` (repeat - if repeat password must be shown with the same width settings)
  - `repeat` password must be compared with password
  - `visible` - true if allow to view the password by toggling the view button
  - `maxLength` - max length of text in field

- `instance`
 - `adapter` - name of adapter
 - `allowDeactivate` - if true. Additional option "deactivate" is shown
 - `long` - value will look like `system.adapter.ADAPTER.0` and not `ADAPTER.0`
 - `short` - value will look like `0` and not `ADAPTER.0`

- `chips` - user can enter the word, and it will be added (see cloud => services => White list)

- `alive` - just indication if the instance is alive, and it could be used in "hidden" and "disabled" (will not be saved in config)
  - `instance` - check if the instance is alive. If not defined, it will be used current instance. You can use `${data.number}` pattern in the text.
  - `textAlive` - default text is `Instance %s is alive`, where %s will be replaced by `ADAPTER.0`.
  - `textNotAlive` - default text is `Instance %s is not alive`, where %s will be replaced by `ADAPTER.0`.
  
  Just text: Instance is running, Instance is not running

- `pattern` - read only field with pattern like 'https://${data.ip}:${data.port}' (will not be saved in config)                
  - `copyToClipboard` - if true - show button
  - `pattern` - my pattern
  
  Text input with read only flag, that shows pattern.

- `sendto` - button that sends request to instance (https://github.com/iobroker-community-adapters/ioBroker.email/blob/master/admin/index_m.html#L128)
  - `command` - (Default 'send')
  - `jsonData` - string - `{"subject1": "${data.subject}", "options1": {"host": "${data.host}"}}`  
  - `data` - object - `{"subject1": 1, "data": "static"}`. You can specify jsonData or data, but not both.
  - `result` - `{result1: {en: 'A'}, result2: {en: 'B'}}`
  - `error` - `{error1: {en: 'E'}, error2: {en: 'E2'}}`
  - `variant` - `contained`, `outlined`, ''
    
    `this.props.socket.sendTo(adapterName.instance, command || 'send', data, result => {});`

- `setState` - button that set instance's state
  - `id` - 'info.test'
  - `ack` - false (default false)
  - `val` - '${data.myText}_test' or number. Type will be detected automatically from state type and converting done too
  - `okText` - Alert which will be shown by pressing the button
  - `variant` - `contained`, `outlined`, ''

- `staticText` - static text like description
   - `label` - multi-language text
   - `text` - same as label

- `staticLink` - static link
   - `label` - multi-language text
   - `href` - link. Link could be dynamic like `#tab-objects/customs/${data.parentId}`
   - `button` - show link as button
   - `icon` - icon for button

- `staticImage` - static image
   - `href` - optional HTTP link
   - `src` - name of picture (from admin directory)

- `table` - table with items that could be deleted, added, movedUP, moved Down
  - `items` - [{"type": see above, "width": px or %, "title": {"en": "header"}, "attr": "name", "filter": false, "sort": true, "default": ""}]
  - `noDelete` - boolean if delete or add disabled, If noDelete is false, add, delete and move up/down should work
  - `objKeyName` - (legacy setting, don't use!) - name of the key in `{"192.168.1.1": {delay: 1000, enabled: true}, "192.168.1.2": {delay: 2000, enabled: false}}`
  - `objValueName` - (legacy setting, don't use!) - name of the value in `{"192.168.1.1": "value1", "192.168.1.2": "value2"}`

- `json` - json editor 

- `language` 
  - `system` - allow the usage of the system language from system.config as default

- `certificate`
  - `certType` - on of: `public`, `private`, `chained`
             
- `custom`
 - `component` - Component name that will be provided via props, like componentInstancesEditor

- `divider` - horizontal line
  - `height` - optional height
  - `color` - optional divider color or `primary`, `secondary`

- `header`
  - `text`
  - `size` - 1-5 => h1-h5

- `cron`
  - `complex` - show CRON with "minutes", "seconds" and so on 
  - `simple` - show simple CRON settings

- `selectSendTo`
  Shows drop down menu with the given from the instance values. 
  - `command` - sendTo command
  - `jsonData` - string - `{"subject1": "${data.subject}", "options1": {"host": "${data.host}"}}`. This data will be sent to backend
  - `data` - object - `{"subject1": 1, "data": "static"}`. You can specify jsonData or data, but not both. This data will be sent to backend if jsonData is not defined.
  - `!manual` - allow manual editing. Without drop down  
  - `noTranslation` - do not translate label of selects  
    To use this option, your adapter must implement message handler:
    The result of command must be an array in form `[{"value": 1, "label": "one"}, ...]`
```
adapter.on('message', obj => {
   if (obj) {
       switch (obj.command) {
           case 'command':
               if (obj.callback) {
                   try {
                       const serialport = require('serialport');
                       if (serialport) {
                           // read all found serial ports
                           serialport.list()
                               .then(ports => {
                                   adapter.log.info('List of port: ' + JSON.stringify(ports));
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
  - `jsonData` - string - `{"subject1": "${data.subject}", "options1": {"host": "${data.host}"}}`. This data will be sent to backend
  - `data` - object - `{"subject1": 1, "data": "static"}`. You can specify jsonData or data, but not both. This data will be sent to backend if jsonData is not defined.
  - `freeSolo` - Set freeSolo to true so the textbox can contain any arbitrary value.
  - `maxLength` - max length of text in field

  To use this option, your adapter must implement message handler:
    The result of command must be an array in form `["value1", {"value": "value2", "label": "Value2"}, ...]`
    See `selectSendTo` for handler example 

- `textSendTo`
  Shows readonly control with the given from the instance values.
  - `container` - div, text
  - `copyToClipboard` - if true - show button
  - `alsoDependsOn` - by change of which attributes, the command must be resent
  - `command` - sendTo command
  - `jsonData` - string - `{"subject1": "${data.subject}", "options1": {"host": "${data.host}"}}`. This data will be sent to backend
  - `data` - object - `{"subject1": 1, "data": "static"}`. You can specify jsonData or data, but not both. This data will be sent to backend if jsonData is not defined.
 
  To use this option, your adapter must implement message handler:
    The result of command must be an array in form `"text"`
    See `selectSendTo` for handler example

- `coordinates`
  Determines current location and used system.config coordinates if not possible in form "latitude,longitude"
  - `divider` - divider between latitude and longitude. Default ","
  - `autoInit` - init field with current coordinates if empty

## Common attributes of controls
All types could have:
- `sm` - width in 1/12 of screen on small screen
- `md` - width in 1/12 of screen on middle screens
- `lg` - width in 1/12 of screen on large screens
- `xs` - width in 1/12 of screen on very small screens
- `newLine` - should be shown from new line
- `label` - String or object like {en: 'Name', ru: 'Имя'}
- `hidden` - JS function that could use `native.attribute` for calculation
- `hideOnlyControl` - if hidden the place will be shown, but no control
- `disabled` - JS function that could use `native.attribute` for calculation
- `help` - help text (multi-language)
- `helpLink` - href to help (could be used only together with `help`)
- `icon` - base64 svg
- `!encrypted` - is value encrypted or not (of course only for texts)
  - if encrypted, use `__encrypted__` value for show and if was changed, encrypt it with socket.encrypt
- `style` - css style in react notation: `radiusBorder` and not `radius-border`.
- `darkStyle` - css style for dark mode
- `validator` - JS function: true no error, false - error
- `validatorErrorText` - Text to show if validator fails
- `validatorNoSaveOnError` - disable save button if error   
- `tooltip` - optional tooltip
- `default` - default value
- `defaultFunc` - JS function to calculate default value  
- `placeholder` - placeholder (for text control)
- `noTranslation` - do not translate selects or other options (not for help, label or placeholder)  
- `onChange` - Structure in form `{"alsoDependsOn": ["attr1", "attr2], "calculateFunc": "attr1 + attr2", "ignoreOwnChanges": true}`
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
                        {"label": "option 1", value: 1},
                        {"label": "option 2", value: 2}
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
In this case the value will be provided as array of all possible values.

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
In this case input must be text, where shown `__different__`, with autocomplete option of 3 possible values. User can select from dropdown 1000, 2000 or 3000 or input own new value, e.g. 500.

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

If no schema provided, the schema must be created automatically from data.
- `boolean` => checkbox
- `text` => text input
- `number` => number
- name `bind` => ip
- name `port` => number, min=1, max=0xFFFF
- name `timeout` => number, help="ms"

If element has no attribute `type`, assume it has default type 'panel'.

## i18n
1. User can provide translations directly in label like: 
```
{
   "type": "text",
   "label: {
        "en": "Label",
        "de": "Taxt"
    }
}
```

2. User can provide texts from files.

On the top level of structure set `i18n: true` and provide files in admin:
- admin/i18n/de/translations.json
- admin/i18n/en/translations.json
- ...

or 
- admin/i18n/de.json
- admin/i18n/en.json
- ...

Additionally, user can provide the path to i18n files, `i18n: "customI18n"`and provide files in admin:
- admin/customI18n/de/translations.json
- admin/customI18n/en/translations.json
- ...

or
- admin/customI18n/de.json
- admin/customI18n/en.json
- ...

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

We suggest to use variant 2, as it will be possible to process the texts with weblate.

## JS Functions
### Configuration dialog
JS functions is:
```
const myValidator = "_alive === true && data.options.myType == 2";

const func = new Function('data', '_system', '_alive', '_common', '_socket', myValidator.includes('return') ? myValidator : 'return ' + myValidator); // e.g. "_alive === true"

const isValid = func(data, systemConfig.common, instanceAlive, adapter.common, this.props.socket);

```
If alive status changes, so all fields must be updated, validated, disabled, hidden anew.

Following variables are available in JS function in custom settings:
- data - native settings for this instance
- _system - system configuration
- _alive - is instance is alive
- _common - common settings for this instance
- _socket - socket

### Custom settings dialog
JS functions is:
```
const myValidator = "customObj.common.type === 'boolean' && data.options.myType == 2";

const func = new Function('data', 'originalData', '_system', 'instanceObj', 'customObj', '_socket', myValidator.includes('return') ? myValidator : 'return ' + myValidator); // e.g. "_alive === true"

const isValid = func(data || this.props.data, this.props.originalData, this.props.systemConfig, instanceObj, customObj, this.props.socket);
```

Following variables are available in JS function in custom settings:
- data - current custom settings
- originalData - Unchanged data
- _system - system configuration
- instanceObj - adapter instance object
- customObj - current object itself
- _socket - socket

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
````
