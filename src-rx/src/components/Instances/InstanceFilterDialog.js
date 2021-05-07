import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FilterListIcon from '@material-ui/icons/FilterList';

import I18n from '@iobroker/adapter-react/i18n';
import { Card, Checkbox, DialogTitle, FormControlLabel, makeStyles, MenuItem, Select, ThemeProvider } from '@material-ui/core';

import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';

let node = null;

const useStyles = makeStyles((theme) => ({
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
    slect: {
        minWidth: 200
    },
    checkbox:{
        minWidth:130
    }
}));

const modeArray = ['none', 'daemon', 'schedule', 'once'];
const statusArray = [
    'none',
    'disabled',
    'enabled, but not alive',
    'enabled, alive, but not connected to controller',
    'enabled, alive, connected, but not connected to device or service',
    'enabled and OK'
]

const InstanceFilterDialog = ({ cb, mode, status }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);

    const [modeCheck, setModeCheck] = useState(mode);
    const [statusCheck, setStatusCheck] = useState(status);


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
            <DialogTitle style={{ display: 'flex' }}><FilterListIcon style={{ marginRight: 5 }} color="primary" />{I18n.t('Filter instances')}</DialogTitle>
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
                            label={I18n.t('By mode')}
                        />
                        <Select
                            disabled={!modeCheck}
                            variant="standard"
                            value={modeCheck || 'none'}
                            className={classes.slect}
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
                                    onChange={(e) => e.target.checked ? setStatusCheck(1) : setStatusCheck(null)}
                                />
                            }
                            label={I18n.t('By status')}
                        />
                        <Select
                            disabled={!statusCheck}
                            variant="standard"
                            value={statusCheck || 0}
                            className={classes.slect}
                            onChange={el => {
                                if (statusArray[el.target.value] === 'none') {
                                    setStatusCheck(null);
                                } else {
                                    setStatusCheck(el.target.value);
                                }
                            }}
                        >
                            {statusArray.map((el,idx) => <MenuItem key={el} value={idx}>
                                {I18n.t(el)}
                            </MenuItem>)}
                        </Select>
                    </div>
                </Card>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    autoFocus
                    disabled={modeCheck === mode && status === statusCheck}
                    onClick={() => {
                        onClose();
                        cb && cb({
                            mode: modeCheck,
                            status: statusCheck
                        });
                    }}
                    color="primary">
                    {I18n.t('Apply')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        onClose();
                        cb && cb(false);
                    }}
                    color="default">
                    {I18n.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>
    </ThemeProvider>;
}

export const instanceFilterDialogCallback = (cb, mode, status) => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderModal';
        document.body.appendChild(node);
    }
    return ReactDOM.render(<InstanceFilterDialog cb={cb} mode={mode} status={status} />, node);
}