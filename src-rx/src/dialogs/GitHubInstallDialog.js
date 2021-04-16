import React, { useCallback, useState } from 'react';

import SmsIcon from '@material-ui/icons/Sms';
import CloseIcon from "@material-ui/icons/Close";
import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';

import I18n from '@iobroker/adapter-react/i18n';
import { AppBar, Box, Checkbox, FormControlLabel, IconButton, InputAdornment, makeStyles, Tab, Tabs, TextField, useTheme } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`full-width-tabpanel-${index}`}
            aria-labelledby={`full-width-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box style={{ paddingTop: 10 }} p={3}>
                    <Typography component="div">{children}</Typography>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

function a11yProps(index) {
    return {
        id: `full-width-tab-${index}`,
        'aria-controls': `full-width-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: '100%'
    },
    paper: {
        maxWidth: 1000
    }
}));

const GitHubInstallDialog = ({ categories, repository, onClose, open, addInstance, t }) => {
    if (!t) {
        t = I18n.t
    }
    const classes = useStyles();
    const theme = useTheme();
    const [autocompleteValue, setAutocompleteValue] = useState(null);
    const [debug, setDebug] = useState(false);
    const [url, setUrl] = useState('');
    const [value, setValue] = useState(0);
    // eslint-disable-next-line array-callback-return
    const array = useCallback(() => categories.map(category => category.adapters).sort().flat().map(el => {
        const adapter = repository[el]
        if (!adapter?.controller) {
            return ({
                value: el, name: `${adapter?.name} [${(adapter.meta || '')
                    .replace('https://raw.githubusercontent.com/', '')
                    .substr(0, (adapter.meta || '').replace('https://raw.githubusercontent.com/', '')
                        .indexOf('/'))}]`
            });
        }
    }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0), [categories, repository]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const closeInit = () => {
        setAutocompleteValue(null);
        setDebug(false);
        setValue(0);
        setUrl('')
    };

    return <Dialog
        onClose={onClose}
        open={open}
        classes={{ paper: classes.paper }}
    >
        <DialogContent dividers>
            <div className={classes.root}>
                <AppBar position="static" color="default">
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        variant="fullWidth"
                        aria-label="full width tabs example"
                    >
                        <Tab label="From github" {...a11yProps(0)} />
                        <Tab label="Custom" {...a11yProps(1)} />
                    </Tabs>
                </AppBar>
                <div style={{
                    marginTop: 10,
                    padding: 7,
                    fontSize: 18,
                }}>{value === 0 ?
                    t('Install or update the adapter from Github') :
                    t('Install or update the adapter from URL')}
                </div>
                <TabPanel value={value} index={0} dir={theme.direction}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={debug}
                                    onChange={(e) => setDebug(e.target.checked)} />}
                            label={t('Debug outputs')}
                        />
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-end'
                    }}>
                        <SmsIcon style={{ marginRight: 10 }} />
                        <Autocomplete
                            fullWidth
                            value={autocompleteValue}
                            getOptionSelected={(option, value) => option.name === value.name}
                            onChange={(_, e) => setAutocompleteValue(e)}
                            options={array()}
                            getOptionLabel={(option) => option.name}
                            renderInput={(params) => <TextField {...params} label={I18n.t('Select adapter')} />}
                        /></div>
                    <div style={{
                        fontSize: 40,
                        fontWeight: 'bold'
                    }}>{t('Warning!')}</div>
                    <div style={{ color: '#f53939' }}>
                        {t(`Don't install adapters from GitHub unless asked to by a developer or if you are 100 %sure what you are doing! Adapters on GitHub may not work like they should (they are still under development). Only install them if you are participating in a test! Please wait for an official release!`)}
                    </div>
                </TabPanel>
                <TabPanel value={value} index={1} dir={theme.direction}>
                    <div>
                        <TextField
                            fullWidth
                            label={t('URL')}
                            helperText={t('URL or file path')}
                            value={url}
                            onChange={event => setUrl(event.target.value)}
                            InputProps={{
                                endAdornment: (
                                    url ? <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setUrl('')}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </InputAdornment> : null
                                ),
                            }}
                        />
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={debug}
                                    onChange={(e) => setDebug(e.target.checked)} />}
                            label={t('Debug outputs')}
                        />
                    </div>
                    <div style={{
                        fontSize: 40,
                        fontWeight: 'bold'
                    }}>{t('Warning!')}</div>
                    <div style={{ color: '#f53939' }}>
                        {t(`Don't install adapters from GitHub unless asked to by a developer or if you are 100 %sure what you are doing! Adapters on GitHub may not work like they should (they are still under development). Only install them if you are participating in a test! Please wait for an official release!`)}
                    </div>
                </TabPanel>
            </div>
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                disabled={(value === 0 && !autocompleteValue) || (value === 1 && !url)}
                autoFocus
                onClick={() => {
                    if (value === 0) {
                        addInstance(autocompleteValue.value, debug, false);
                    } else {
                        addInstance(url, debug, true);
                    }
                    onClose();
                    closeInit();
                }}
                color="primary">
                {t('Install')}
            </Button>
            <Button
                variant="contained"
                onClick={() => {
                    onClose();
                    closeInit();
                }}
                color="default">
                {t('Close')}
            </Button>
        </DialogActions>
    </Dialog>
}

export default GitHubInstallDialog;