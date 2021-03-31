# ioBroker JSON Config

```
const schema = {
    type: 'tabs',
    items: {
        options1: {
            type: 'panel', // could be ommited, as only elements with type "panel" could be children of items
            label: {en: "Tab1"}, // If only one TAB, label could be ommited as no TAB header will be schown
            icon: 'base64 svg', // optional
            items: {
                myPort: {
                    type: 'number',
                    min: 1,
                    max: 65565,
                    label: {en: "Name"},
                    width: 100, // px, or sm
                    sm: 6, // 1 - 12
                    validator: '!!data.name', // else error
                    hidden: 'myType === 1', // hidden if myType is 1 
                    disabled: 'myType === 2' // disabled if myType is 2
                },
                'options.myType': { // name could support more than one levelhelperText
                    newLine: true, // must start from new row
                    type: 'select',
                    label: {en: "Type"},
                    width: 100, // px, or sm
                    sm: 6, // 1 - 12
                    options: [
                        {label: {en: "option 1"}, value: 1},
                        {label: {en: "option 2"}, value: 2}
                    ] 
                },
                myBool: {
                    type: 'checkbox',
                    label: {en: "My checkbox"},
                },
                
                // all labels, texts, helps can be multilanguage or just strings
                
                // all types could have:
                //  !- sm - width in 1/12 of screen on small screen
                //  !- md - width in 1/12 of screen on middle screens
                //  !- lg - width in 1/12 of screen on large screens
                //  !- xs - width in 1/12 of screen on very small screens
                //  - width - width in px (if number) or string (%, rem, em) 
                //  !- newLine - should be shown from new line
                //  - label - String or object like {en: 'Name', ru: 'Имя'}
                //  !- hidden - JS function that could use native.attributes for calculation
                //  !- disabled - JS function that could use native.attributes for calculation
                //  - helpLink - href to help
                //  - help - help text (multi-language)
                //  - icon - base64 svg
                //  - encrypted - is value encrypted or not (of course only for texts)
                //    - if encrypted, use __encrypted__ value for show and if was changed, encrypt it with socket.encrypt 
                //  !- style - css style (default)
                //  - darkStyle - css style for dark mode
                //  !- validator - JS function: true no error, false - error
                //  !- tooltip - optional tooltip
                //  - default - default value
                //  - placeholder - placeholder (for text mostly)
                //  - confirm
                //     - condition - JS function: true show confirm dialog
                //     - text
                //     - title
                //     - ok - Text for OK button
                //     - cancel - Text for cancel button
                
                // possible types:
                // - tabs
                
                // - tab
                
                // - text*
                
                // - number* (min, max)
                
                // - color*
                
                // - checkbox**
                
                // - slider               
                //   - min (default 0)
                //   - max (default 100)
                //   - step (default 1)
                
                // - ip - bind address
                //   - listenOnAllPorts - add 0.0.0.0 to option
                //   - onlyIp4 - show only IP4 addresses
                //   - onlyIp6 - show only IP6 addresses
                
                // - user - Select user from system.user. (With color and icon)
                
                // - room - Select room from enum.room (With color and icon)
                
                // - func - Select function from enum.func (With color and icon)
                
                // - select* 
                //   - options - [{label: {en: "option 1"}, value: 1}, ...]
                
                // - icon - base64
                //   - maxSize
                //   - maxWidth
                //   - maxHeight
                //   - crop - if true, allow user to crop the image (only for non svg)
                //   - square - width must be equal to height or crop must allow only square as shape 
                
                // - image - saves image as file of adapter.0 object
                //   - filename - name of file is structure name 
                     ```
                     "login-bg.png": {
                          "type": "image",
                          "accept": "image/*",
                          "label": {
                            "en": "Upload image"
                          },
                          "crop": true
                        }
                     ```
                     login-bg.png is file name for writeFile('myAdapter.INSTANCE', 'login-bg.png')   
                //   - accept - html accept attribute, like "image/*,.pdf"
                //   - maxSize
                //   - maxWidth
                //   - maxHeight
                //   - crop - if true, allow user to crop the image
                //   - square - width must be equal to height or crop must allow only square as shape
                
                // - file - saves file (not image) as file of adapter.0 object
                //   - filename - name of file
                
                // - oid - object ID - show it with name, color and icon
                //   - types: ['channel', 'device', ...] (only "state" by default)
                
                // - password (repeat - if repeat password must be shown with the same width settings)
                //   - repeat password must be compared with password
                
                // - instance (adapter - name of adapter)
                
                // - chips - user can enter word and it will be added (see cloud => services => White list)
                
                // - alive - just indication if the instance is alive and it could be used in "hidden" and "disabled" (will not be saved in config)
                
                // - pattern - read only field with pattern like 'https://${data.ip}:${data.port}' (will not be saved in config)                

                // - sendto - button that sends request to instance (https://github.com/iobroker-community-adapters/ioBroker.email/blob/master/admin/index_m.html#L128)
                //    - command - (Default 'send')
                //    - data: {subject1: '${data.subject}, options1: {host: '${data.host}'}}
                //    - result: {result1: {en: 'A'}, result2: {en: 'B'}}
                //    - error: {error1: {en: 'E'}, error2: {en: 'E2'}}

                // - setState - button that set instance's state
                //    - id - 'info.test'
                //    - ack: false (default false)
                //    - val: '${data.myText}_test' or number. Type must be detected automatically and convertaion done too

                // - staticText - static text like description
                //    - text - multi-language text
                
                // - staticLink - static link
                //    - text - multi-language text
                //    - href - link
                
                // - staticImage - static image
                //    - href - optional HTTP link
                //    - src - name of picture (from admin directory)
                
                // - coordinates ?
                
                // - table - table with items that could be deleted, added, movedUP, moved Down
                //   - items: [{type: see above, width: px or %, title: {en: 'header'}, attr: 'name', filter: true}]
                //   - noDelete: boolean if delete or add disabled
                
                // - json - json editor 
                //   - height in px or % or em
                
                // - language 
                //   - system (use system from system.config as default)
                
                // - instances
                //   - filter: ?? (not yet clear)
                
                // - certificate
                //   - certType: public, private, chained
                
                // - invisible
                //  - this element is invisible for user and not editable
                
                // - custom
                //  - component - Component name that will be provided via props, like componentInstancesEditor
                
                // - divider - horizontal line
  
                // - header
                //   - text
              
            }
        },
        tab2: {
            name: {en: "Tab2"},
            disabled: 'myType === 1',
            hidden: 'myType === 2',
        }
    },    
}
```

Types with * must support autocomplete to allow selection of options. 
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

Boolean must support intermediate if value is [false, true]

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
- boolean => checkbox
- text => text input
- number => number
- name "bind" => ip
- name "port" => number, min=1, max=0xFFFF
- name "timeout" => number, helpText="ms"

If element has no attribute `type`, assume it has default type 'panel'.


## JS Functions
JS functions is:
```
const myValidator = "_alive === true && data.options.myType == 2";

const func = new Function('data', '_system', '_alive', '_common', '_socket', myValidator.includes('return') ? myValidator : 'return ' + myValidator); // e.g. "_alive === true"

const isValid = func(data. systemConfig.common, instanceAlive, adapter.common, this.props.socket);

```
If alive status changes, so all fields must be updated, validated, disabled, hidden anew.

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
