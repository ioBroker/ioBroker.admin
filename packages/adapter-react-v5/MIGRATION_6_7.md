# Migration from adapter-react-v5@6.x to adapter-react-v5@7.x

Only MUI library was updated from v5 to v6.

## No `withStyles` at all

`withStyles` was removed completely. So you have to replace all `withStyles` with `sx` or `style` properties.

## slotProps

`inputProps` and `InputProps` are now in `slotProps`

Examples:
Before:

```jsx
<TextField
    inputProps={{ readOnly: true }}
    InputProps={{ endAdornment: <IconButton /> }}
/>
```

```jsx
<TextField
    slotProps={{
        htmlInput: {
            readOnly: true,
        },
        input: {
            endAdornment: <IconButton />,
        },
    }}
/>
```

## SelectID dialog

`SelectID` dialog now requires `theme` property. Without this property, the dialog will crash.

## Grid => Grid2

Replace all `Grid` with `Grid2` component and remove `item` property as it not needed anymore.

Attributes xs, sm, md, lg, xl are now in `size` property.

Before:

```jsx
<Grid item xs={6} sm={4} md={3}>
<Grid/>
```

```jsx
<Grid2 size={{ xs: 6, sm: 4, md: 3 }}>
<Grid2/>
```
