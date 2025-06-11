# Migration from v5 to v6

The main change is that the `withStyles` was removed. So you have to replace all `withStyles` with `sx` or `style` properties.

You can read more about sx [here](https://mui.com/system/getting-started/the-sx-prop/).

-   Remove at start of the file `import { withStyles } from '@mui/styles';`
-   Replace it at the very end of the file `export default withStyles(styles)(MyComponent);` with `export default MyComponent;`
-   Modify `const styles`:
    Before:

```typescript jsx
const styles: Record<string, any> = (theme: IobTheme) => ({
   dialog: {
      height: `calc(100% - ${theme.mixins.toolbar.minHeight}px)`,
      padding: theme.spacing(1),
      margin: theme.spacing(2),
      gap: 5,
      borderRadius: 5,
      marginLeft: 10, // marginTop, marginRight, marginBottom
      paddingLeft: 10, // paddingTop, paddingRight, paddingBottom
   },
   ...
});
```

After:

```typescript jsx
const styles: Record<string, any> = {
    dialog: (theme: IobTheme) => ({
        height: `calc(100% - ${theme => theme.mixins.toolbar.minHeight}px)`,
        p: 1, // or 8px, padding is OK too
        m: '16px', // or 2, margin is OK too
        gap: '5px',
        borderRadius: '5px',
        ml: '10px', // mt, mr, mb, but marginLeft, marginRight, marginBottom is OK too
        pl: '10px', // pt, pr, pb, but paddingTop, paddingRight, paddingBottom is OK too
    }),
};
```

-   Modify `className`:
    Before: `<div className={this.props.classes.box}>`

After: `<Box sx={styles.box}>`

Before: `<span className={Utils.clsx(this.props.classes.box1, condition && this.props.classes.box2)}>`

After: `<Box component="span" sx={Utils.getStyle(this.props.theme, this.props.classes.box1, condition && this.props.classes.box2)}>`
Or if no one style is a function: `<Box component="div" sx={{ ...this.props.classes.box1, ...(condition ? this.props.classes.box2 : undefined) }}>`

Do not use `sx` if the style is not dynamic (not a function). Use `style` instead.

Be aware, that all paddings and margins are now in `theme.spacing(1)` format.
So you have to replace all `padding: 8` with `padding: 1` or with `padding: '8px'`.

The best practice is to replace `padding` with `p` and `margin` with `m`, so you will see immediately that it is a padding or margin for `sx` property.

-   Modify `classes`:
    Before: `<Dialog classes={{ scrollPaper: this.props.classes.dialog, paper: this.props.classes.paper }}>`
    After: `<Dialog sx={{ '&.MuiDialog-scrollPaper': styles.dialog, '& .MuiDialog-paper': styles.paper }}>`,

    Before: `<Dialog classes={{ scrollPaper: this.props.classes.dialog, paper: this.props.classes.paper }}>`
    After: `<Dialog sx={{ '&.MuiDialog-scrollPaper': styles.dialog, '& .MuiDialog-paper': styles.paper }}>`

    Before: `<ListItem classes={{ root: this.props.classes.listItem }} >`,
    After: `<ListItem sx={{ '&.MuiListItem-root': styles.listItem }} >`

    Before: `<ListItemText classes={{ primary: this.props.classes.listPrimary, secondary: this.props.classes.listSecondary }} >`,
    After: `<ListItemText sx={{ '& .MuiListItemText-primary': styles.listPrimary, '& .MuiListItemText-secondary': styles.listSecondary }} >`

    Before: `<FormControlLabel classes={{ label: this.props.classes.checkBoxLabel }} >`,
    After: `<FormControlLabel sx={{ '& .MuiFormControlLabel-label': styles.checkBoxLabel }} >`

    Before: `<Typography component="h2" variant="h6" classes={{ root: this.props.classes.typography }}>`,
    After: `<Typography component="h2" variant="h6" sx={{ '&.MuiTypography-root': styles.typography }}>`

    Before: `<Badge classes={{ 'badge': this.props.classes.expertBadge }}>`,
    After: `<Badge sx={{ '& .MuiBadge-badge': styles.expertBadge }}>`

    Before: `<Tab classes={{ selected: this.props.classes..selected }} />`,
    After: `<Tab sx={{ '&.Mui-selected': styles.selected }} />`

    Before: `<Tabs classes={{ indicator: this.props.classes.indicator }} />`,
    After: `<Tabs sx={{ '& .MuiTabs-indicator': styles.indicator }} />`

    Before: `<Tooltip title={this.props.t('ra_Refresh tree')} classes={{ popper: this.props.classes.tooltip }}>`,
    After: `<Tooltip title={this.props.t('ra_Refresh tree')} componentsProps={{ popper: { sx: { pointerEvents: 'none' } } }}>`,
    Or: `<Tooltip title={this.props.t('ra_Refresh tree')} componentsProps={{ popper: { sx: styles.tooltip } }}>`

    Before. `<AccordionSummary classes={{ root: this.props.classes.rootStyle, content: this.props.classes.content }}>`,
    After. `<AccordionSummary sx={{ '&.MuiAccordionSummary-root': styles.rootStyle, '& .MuiAccordionSummary-content': styles.content }}>`

    Before. `<Drawer classes={{ paper: this.props.classes.paperStyle }}>`,
    After. `<Drawer sx={{ '& .MuiDrawer-paper': styles.paperStyle }}>`
