# Migration from adapter-react to adapter-react-v5

## In src/package.json => dependencies

-   `"@iobroker/adapter-react": "^2.0.22",` => `"@iobroker/adapter-react-v5": "^3.1.34",`
-   `"@material-ui/core": "^4.12.3",` => `"@mui/material": "^5.10.9",`
-   `"@material-ui/icons": "^4.11.2",` => `"@mui/icons-material": "^5.10.9",`
-   Add `"@mui/styles": "^5.10.9",`
-   Add `"babel-eslint": "^10.1.0",`

## In Source files

-   All `@iobroker/adapter-react/...` => `@iobroker/adapter-react-v5/...`
-   All `@material-ui/icons/...` => `@mui/icons-material/...`
-   Change `import { withStyles } from '@material-ui/core/styles';` => `import { withStyles } from '@mui/styles';`
-   Change `import { makeStyles } from '@mui/material/styles';` => `import { makeStyles } from '@mui/styles';`
-   Change `import withWidth from '@material-ui/core/withWidth';` => `import { withWidth } from '@iobroker/adapter-react-v5';`
-   All `@material-ui/core...` => `@mui/material...`
-   Change `import { MuiThemeProvider } from '@material-ui/core/styles';` => `import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';`
-   Change all `<MuiThemeProvider theme={this.state.theme}>` to `<StyledEngineProvider injectFirst><ThemeProvider theme={this.state.theme}>`
-   Rename in styles `theme.palette.type` => `theme.palette.mode`
-   Add to all `TextField`, `Select`, `FormControl` the property `variant="standard"`
-   Add to all `Button` that do not have `color` property: `color="grey"`
-   Replace by `TextField` the `readOnly` attribute (if exists) with `InputProps={{readOnly: true}}`
-   Remove px by all `theme.spacing`: `calc(100% - ${theme.spacing(4)}px)` => `calc(100% - ${theme.spacing(4)})`
-   Replace `this.selectTab(e.target.parentNode.dataset.name, index)` => `this.selectTab(e.target.dataset.name, index)`

If you still have questions, try to find an answer [here](https://mui.com/guides/migration-v4/).

# Migration from adapter-react-v5@3.x to adapter-react-v5@4.x

-   Look for getObjectView socket requests and replace `socket.getObjectView('startKey', 'endKey', 'instance')` to `socket.getObjectViewSystem('instance', 'startKey', 'endKey')`
-   Look for calls of custom like

```jsx
this.props.socket._socket.emit('getObjectView', 'system', 'custom', { startKey: '', endKey: '\u9999' }, (err, objs) => {
    (objs?.rows || []).forEach(item => console.log(item.id, item.value));
});
```

to

```jsx
socket.getObjectViewCustom('custom', 'state', 'startKey', 'endKey').then(objects => {
    Object.keys(objects).forEach(obj => console.log(obj._id));
});
```

-   Replace all `socket.log.error('text')` to `socket.log('text', 'error')`
-   Add to App.js `import { AdminConnection } from '@iobroker/adapter-react-v5';` and `super(props, { Connection: AdminConnection });` if run in admin

# Migration from adapter-react-v5@4.x to adapter-react-v5@5.x

-   `Theme` is renamed to IobTheme. It is an object with classes inside. `Theme` is still inside and it same as mui `createTheme`.
-   adapter-react-v5 has all types exported. So you can use `import { type IobTheme, Theme } from '@iobroker/adapter-react-v5';` and `const theme: IobTheme = Theme('light');`
-   Json-Config is now an external package and must be included as dependency separately.
-   Use type `Translate` for `t(word: string, ...args: any[]) => string`
-   All components for admin JsonConfig must be changed:
    Before `adapter-react-v5@5.x`:

```jsx
import { ConfigGeneric, I18n } from '@iobroker/adapter-react-v5';
class JsonComponent extends ConfigGeneric {
    // ...
}
```

With `adapter-react-v5@5.x`:

```jsx
import { I18n } from '@iobroker/adapter-react-v5';
import { ConfigGeneric } from '@iobroker/json-config';
class JsonComponent extends ConfigGeneric {
    // ...
}
```
