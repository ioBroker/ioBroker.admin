# ioBroker JSON Config

```
const schema = {
    type: 'tabs',
    items: {
        options1: {
            type: 'panel', // could be ommited, as only elements with type "panel" could be children of items
            title: {en: "Tab1"}, // If only one TAB, title could be ommited as no TAB header will be schown
            icon: 'base64 svg', // optional
            items: {
                myPort: {
                    type: 'number',
                    min: 1,
                    max: 65565,
                    title: {en: "Name"},
                    width: 100, // px, or sm
                    sm: 6, // 1 - 12
                    validator: '!!name', // else error
                    hidden: 'myType === 1', // hidden if myType is 1 
                    disabled: 'myType === 2' // disabled if myType is 2
                },
                'options.myType': { // name could support more than one level
                    newLine: true, // must start from new row
                    type: 'select',
                    title: {en: "Type"},
                    width: 100, // px, or sm
                    sm: 6, // 1 - 12
                    options: [
                        {title: {en: "option 1"}, value: 1},
                        {title: {en: "option 2"}, value: 2}
                    ] 
                },
                myBool: {
                    type: 'checkbox',
                    title: {en: "My checkbox"},
                },
                
                // all titles, texts, helps can be multilanguage or just strings
                
                // all types could have:
                //  - sm - width in 1/12 of screen
                //  - width - width in px (if number) or string (%, rem, em) 
                //  - newLine - should be shown from new line
                //  - title - String or object like {en: 'Name', ru: 'Имя'}
                //  - hidden - JS function that could use native.attributes for calculation
                //  - disabled - JS function that could use native.attributes for calculation
                //  - helpLink - href to help
                //  - help - help text (multi-language)
                //  - icon - base64 svg
                //  - encrypted - is value encrypted or not (of course only for texts)
                //    - if encrypted, use __encrypted__ value for show and if was changed, encrypt it with socket.encrypt 
                //  - style - css style 
                //  - validator - JS function: true no error, false - error
                
                // possible types:
                // - tabs
                
                // - tab
                
                // - text*
                
                // - number* (min, max)
                
                // - color*
                
                // - boolean**
                
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
                //   - options - [{title: {en: "option 1"}, value: 1}, ...]
                
                // - icon - base64
                //   - maxSize
                //   - maxWidth
                //   - maxHeight
                
                // - image - saves image as file of adapter.0 object
                //   - filename - name of file
                
                // - file - saves file (not image) as file of adapter.0 object
                //   - filename - name of file
                
                // - oid - object ID - show it with name, color and icon
                //   - types: ['channel', 'device', ...] (only "state" by default)
                
                // - password (repeat - if repeat password must be shown with the same width settings)
                //   - repeat password must be compared with password
                
                // - instance (adapter - name of adapter)
                
                // - chips - user can enter word and it will be added (see cloud => services => White list)
                
                // - _alive - just indication if the instance is alive and it could be used in "hidden" and "disabled" (will not be saved in config)
                
                // - _pattern - read only field with pattern like 'https://${data.ip}:${data.port}' (will not be saved in config)                

                // - _sendto - button that sends request to instance (https://github.com/iobroker-community-adapters/ioBroker.email/blob/master/admin/index_m.html#L128)
                //    - command - (Default 'send')
                //    - data: {subject1: '${data.subject}, options1: {host: '${data.host}'}}
                //    - result: {result1: {en: 'A'}, result2: {en: 'B'}}
                //    - error: {error1: {en: 'E'}, error2: {en: 'E2'}}

                // - _setState - button that set instance's state
                //    - id - 'info.test'
                //    - ack: false (default false)
                //    - val: '${data.myText}_test' or number. Type must be detected automatically and convertaion done too

                // - staticText - static text like description
                //    - fontSize - font size 
                //    - text - multi-language text
                //    - backgroundColor - {dark: '#556677', light: '#112233'} or just '#00FF00'
                
                // - staticLink - static link
                //    - fontSize - font size 
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
                //   - type: public, private, chained
                
                
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
      "title": "Timeout"
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
const myValidator = "_alive === true";

const func = new Function('data', '_system', '_alive', '_common', myValidator.includes('return') ? myValidator : 'return ' + myValidator); // e.g. "_alive === true"

const isValid = func(data. systemConfig.common, instanceAlive, adapter.common);

```
If alive status changes, so all fields must be updated, validated, disabled, hidden anew.


