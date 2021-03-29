```
const schema = {
    tabs: [
        {
            title: {en: "Tab1"}, // If only one TAB, title could be ommited as no TAB header will be schown
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
                myType: {
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
                //  - encrypted - is value encrypted or not 
                //    - if encrypted, use __encrypted__ value for show and if was changed, encrypt it with sochet.encrypt 
                //  - style - css style 
                
                // possible types:
                // - text
                
                // - number (min, max)
                
                // - color
                
                // - boolean
                
                // - slider               
                //   - min (default 0)
                //   - max (default 100)
                //   - step (default 1)
                
                // - ip - bind address
                //   - listenOnAllPorts - add 0.0.0.0 to option
                //   - onlyIp4 - show only IP4 addresses
                //   - onlyIp6 - show only IP6 addresses
                
                // - user
                
                // - select 
                //   - options - [{title: {en: "option 1"}, value: 1}, ...]
                
                // - icon - base64
                //   - maxSize
                
                // - image - saves image as file of adapter.0 object
                //   - filename - name of file
                
                // - file - saves file (not image) as file of adapter.0 object
                //   - filename - name of file
                
                // - oid - object ID (show it with name, color and icon)
                //   - types: ['channel', 'device', ...] (only state by default)
                
                // - password (repeat - if repeat password must be shown with the same width settings)
                //   - repeat password must be compared with password
                
                // - instance (adapter - name of adapter)
                
                // - chips - user can enter word and it will be added (see cloud => services => White list)
                
                // - _activity - just indication if the instance is active and it could be used in "hidden" and "disabled" (will not be saved in config)
                // - _pattern - read only field with pattern like 'https://${ip}:${port}' (will not be saved in config)                

                // - _sendto - button that sends request to instance (https://github.com/iobroker-community-adapters/ioBroker.email/blob/master/admin/index_m.html#L128)
                //    - command - (Default 'send')
                //    - data: {subject1: '${subject}, options1: {host: '${host}'}}
                //    - result: {result1: {en: 'A'}, result2: {en: 'B'}}
                //    - error: {error1: {en: 'E'}, error2: {en: 'E2'}}

                // - _setState - button that set instance's state
                //    - id - 'info.test'
                //    - ack: false (default false)
                //    - val: '${myText}_test' or number. Type must be detected automatically and convertaion done too

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
                //  - filter: {
            }
        },
        {
            name: {en: "Tab2"},
            disabled: 'myType === 1',
            hidden: 'myType === 2',
        }
    ],    
}
```

Component must look like
```
<SchemaEditor
    style={customStyle}
    className={classes.myClass}
    schema={schema}
    data={common.native}
    onChanged={isChanged => console.log('Changed ' + isChanged)}
/>
```