import React, { useState } from 'react';
import ReactDOM from 'react-dom';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { Avatar, Card, Checkbox, DialogTitle, FormControlLabel, makeStyles, MenuItem, Select, ThemeProvider } from '@material-ui/core';

import WarningIcon from '@material-ui/icons/Warning';
import ScheduleIcon from '@material-ui/icons/Schedule';
import SettingsIcon from '@material-ui/icons/Lens';
import IconCheck from '@material-ui/icons/Check';
import IconClose from '@material-ui/icons/Close';

import { green, grey, orange, red } from '@material-ui/core/colors';

import I18n from '@iobroker/adapter-react/i18n';
import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';

import filterIcon from '../../assets/filter.svg';

let node = null;

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        padding: 10
    },
    paper: {
        // maxWidth: 1000,
        width: '100%',
        maxHeight: 800,
        // height: 'calc(100% - 32px)',
    },
    overflowHidden: {
        display: 'flex',
        overflow: 'hidden'
    },
    pre: {
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        margin: 0
    },
    rowBlock: {
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        margin: '10px 0'
    },
    select: {
        minWidth: 200
    },
    checkbox: {
        minWidth: 160
    },
    statusIcon_1: { // circle
        border: '2px solid grey',
        borderRadius: 20,
        color: 'grey'
    },
    statusIcon_2: { // square
        border: '2px solid grey',
        borderRadius: 20,
        color: '#d32f2f'
    },
    statusIcon_3: { // triangle
        border: 0,
        borderRadius: 0,
        color: '#ffa726'
    },
    statusIcon_4: { // watch
        border: '2px solid grey',
        borderRadius: 20,
        color: '#0055a9'
    },
    statusIcon_5: { // circle ?
        border: '2px solid grey',
        borderRadius: 20,
    },
    statusIcon_6: { // circle ?
        border: '2px solid grey',
        borderRadius: 20,
    },
    menuWrapper: {
        display: 'flex',
        alignItems: 'center'
    },
    iconWrapper: {
        marginRight: 10
    },
    textWrapper: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    square: {
        width: 24,
        height: 24,
        marginRight: 10,
        filter: 'invert(0%) sepia(90%) saturate(300%) hue-rotate(-537deg) brightness(99%) contrast(97%)'
    },
    statusIcon_green: { // square
        border: '2px solid grey',
        borderRadius: 2,
    },
    statusIcon_red: { // circle
        border: '2px solid grey',
        borderRadius: 20,
    },
    statusIcon_orange: { // triangle
        border: 0,
        borderRadius: 0,
    },
    statusIcon_orangeDevice: { // triangle
        border: 0,
        borderRadius: 0,
    },
    statusIcon_blue: { // watch
        border: '2px solid grey',
        borderRadius: 20,
    },
    statusIcon_gray: { // circle ?
        border: '2px solid grey',
        borderRadius: 20,
    },
    statusIcon_grey: { // circle ?
        border: '2px solid grey',
        borderRadius: 20,
    },
    green: {
        color: green[700]
    },
    red: {
        color: red[700]
    },
    grey: {
        color: grey[700]
    },
    blue: {
        color: '#0055a9'
    },
    orange: {
        color: orange[400],
    },
    orangeDevice: {
        color: orange[300],
    },
    icon: {
        width: 18,
        height: 18,
        marginRight: theme.spacing(1),
        display: 'inline-block'
    },
    menuValue: {
        whiteSpace: 'nowrap'
    }
}));

const modeArray = ['none', 'daemon', 'schedule', 'once'];
// const statusArray = [
//     'none',
//     'disabled',
//     'enabled, but not alive',
//     'enabled, alive, but not connected to controller',
//     'enabled, alive, connected, but not connected to device or service',
//     'enabled and OK'
// ];

const getModeIcon = (idx, className) => {
    if (idx === 1) {
        return <SettingsIcon className={className} />;
    } else if (idx === 2) {
        return <SettingsIcon className={className} />;
    } else if (idx === 3) {
        return <WarningIcon className={className} />;
    } else if (idx === 4) {
        return <ScheduleIcon className={className} />
    } else if (idx === 5) {
        return <div style={{
            width: 20,
            height: 20,
            margin: 2,
            borderRadius: 2,
        }} className={className}><div style={{
            width: 'calc(100% - 2px)',
            height: 'calc(100% - 2px)',
            borderRadius: 2,
            margin: 1,
            backgroundColor: '#66bb6a',
        }} /></div>;
    }
    return null;
}

const statusArray = {
    none: { text: 'none', _class: '', status: '' },
    disabled: { text: 'disabled', _class: 'statusIcon_grey', status: 'grey' },
    not_alive: { text: 'enabled, but not alive', _class: 'statusIcon_red', status: 'red' },
    alive_not_connected: { text: 'enabled, alive, but not connected to controller', _class: 'statusIcon_orange', status: 'orange' },
    alive_no_device: { text: 'enabled, alive, but not connected to device or service', _class: 'statusIcon_orangeDevice', status: 'orange' },
    ok: { text: 'enabled and OK', _class: 'statusIcon_green', status: 'green' }
};

const InstanceFilterDialog = ({ cb, filterMode, filterStatus }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);

    const [modeCheck, setModeCheck] = useState(filterMode);
    const [statusCheck, setStatusCheck] = useState(filterStatus);

    const onClose = () => {
        setOpen(false);
        if (node) {
            document.body.removeChild(node);
            node = null;
        }
    }

    return <ThemeProvider theme={theme(Utils.getThemeName())}>
        <Dialog
            onClose={onClose}
            open={open}
            classes={{ paper: classes.paper }}
        >
            <DialogTitle style={{ display: 'flex' }}>
                <div style={{ display: 'flex' }}>
                    <Avatar variant="square" className={classes.square} src={filterIcon} />
                    {I18n.t('Filter instances')}
                </div>
            </DialogTitle>
            <DialogContent className={classes.overflowHidden} dividers>
                <Card className={classes.root}>
                    <div className={classes.rowBlock}>
                        <FormControlLabel
                            className={classes.checkbox}
                            control={
                                <Checkbox
                                    checked={!!modeCheck}
                                    onChange={(e) => e.target.checked ? setModeCheck('daemon') : setModeCheck(null)}
                                />
                            }
                            label={I18n.t('Filter by mode')}
                        />
                        <Select
                            disabled={!modeCheck}
                            variant="standard"
                            value={modeCheck || 'none'}
                            className={classes.select}
                            onChange={el => {
                                if (el.target.value === 'none') {
                                    setModeCheck(null);
                                } else {
                                    setModeCheck(el.target.value);
                                }
                            }}
                        >
                            {modeArray.map(el => <MenuItem key={el} value={el}>
                                {I18n.t(el)}
                            </MenuItem>)}
                        </Select>
                    </div>
                    <div className={classes.rowBlock}>
                        <FormControlLabel
                            className={classes.checkbox}
                            control={
                                <Checkbox
                                    checked={!!statusCheck}
                                    onChange={e => e.target.checked ? setStatusCheck('ok') : setStatusCheck(null)}
                                />
                            }
                            label={I18n.t('Filter by status')}
                        />
                        <Select
                            disabled={!statusCheck}
                            variant="standard"
                            value={statusCheck || 'none'}
                            className={classes.select}
                            onChange={el => {
                                if (el.target.value === 'none') {
                                    setStatusCheck(null);
                                } else {
                                    setStatusCheck(el.target.value);
                                }
                            }}
                        >
                            {Object.keys(statusArray).map((name, idx) => <MenuItem key={name} value={name}>
                                <div className={classes.menuWrapper}>
                                    {statusArray[name].status ? <div className={classes.iconWrapper}>{getModeIcon(idx, classes[`statusIcon_${idx}`])}</div> : null}
                                    <div className={classes.textWrapper}>{I18n.t(statusArray[name].text)}</div>
                                </div>
                            </MenuItem>)}
                        </Select>
                    </div>
                </Card>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    autoFocus
                    disabled={modeCheck === filterMode && filterStatus === statusCheck}
                    onClick={() => {
                        onClose();
                        cb && cb({
                            filterMode: modeCheck,
                            filterStatus: statusCheck
                        });
                    }}
                    color="primary"
                    startIcon={<IconCheck />}
                >
                    {I18n.t('Apply')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        onClose();
                        cb && cb(false);
                    }}
                    startIcon={<IconClose />}
                >
                    {I18n.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>
    </ThemeProvider>;
}

export const instanceFilterDialogCallback = (cb, filterMode, filterStatus, getModeIcon) => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderModal';
        document.body.appendChild(node);
    }
    return ReactDOM.render(<InstanceFilterDialog cb={cb} getModeIcon={getModeIcon} filterMode={filterMode} filterStatus={filterStatus} />, node);
}