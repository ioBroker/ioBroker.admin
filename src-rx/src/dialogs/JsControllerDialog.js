/* eslint-disable react/jsx-no-target-blank */
import React, { useState } from 'react';
import ReactDOM from 'react-dom';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { DialogTitle, makeStyles, ThemeProvider } from '@material-ui/core';

import I18n from '@iobroker/adapter-react/i18n';
import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';

let node = null;

const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        padding: 10
    },
    paper: {
        maxWidth: 1000
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
    h1: {
        fontWeight: 500,
        fontSize: 35,
        margin: '10px 0'
    },
    h2: {
        fontWeight: 300,
        fontSize: 25,
        margin: '10px 0'

    },
    standartText: {
        fontSize: 15,
        margin: '10px 0',
        '& > a': {
            textDecoration: 'none',
            color: '#1e88e5'
        }
    },
    standartTextSmall: {
        fontSize: 12,

    },
    silver: {
        color: 'silver',
        '& > a': {
            textDecoration: 'none',
            color: '#1e88e5'
        }
    }
}));
const JsControllerDialog = () => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);
    const onClose = () => {
        setOpen(false);
        document.body.removeChild(node);
        node = null;
    }
    return <ThemeProvider theme={theme(Utils.getThemeName())}>
        <Dialog
            onClose={onClose}
            open={open}
            classes={{ paper: classes.paper }}
        >
            <DialogTitle>{I18n.t('js-controller upgrade')}</DialogTitle>
            <DialogContent className={classes.overflowHidden} dividers>
                <div style={
                    Utils.getThemeName() === 'dark' ||
                        Utils.getThemeName() === 'blue' ?
                        { color: 'black' } :
                        null} className={classes.root}>
                    <div className={classes.silver}>{I18n.t('You can check the changelog')} <a href="https://github.com/ioBroker/ioBroker.js-controller/blob/master/CHANGELOG.md" target="_blank">{I18n.t('here')}</a></div>

                    <h1 className={classes.h1} >{I18n.t('js-controller upgrade instructions')}</h1>
                    <div className={classes.standartText}>{I18n.t('Due to the different hardware and platforms under which ioBroker runs, the js-controller has to be updated manually. Further details can be found in the appropriate section.')}</div>

                    <h2 className={classes.h2}>{I18n.t('General information for all platforms')}</h2>
                    <div className={classes.standartText}>{I18n.t('For an update from js-controller 1.x to 2.x please always read the information at ')}<a href="https://forum.iobroker.net/topic/26759/js-controller-2-jetzt-f%C3%BCr-alle-im-stable" target="_blank">https://forum.iobroker.net/topic/26759/js-controller-2-jetzt-f%C3%BCr-alle-im-stable</a>{I18n.t(' read and note!')}
</div>
                    <div className={classes.standartText}>{I18n.t('Otherwise please update the slaves first with an update of master-slave systems and the master last!')}
</div>
                    <h2 className={classes.h2}>{I18n.t('Linux/macOS (new installer)')}</h2>
                    <div className={classes.standartText}>{I18n.t('This is the recommended option !!')}</div>

                    <div className={classes.standartText}>{I18n.t('Please execute the following commands in an SSH shell (console):')}</div>

                    <div className={classes.standartTextSmall}>{I18n.t('iobroker stop')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('iobroker update')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('iobroker upgrade self')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('iobroker start or reboot server, then ioBroker should restart and you can be sure that all old processes were finished.')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('If the upgrade command displays Access Rights / Permission errors, then please use the install fixer (curl -sL https://iobroker.net/fix.sh | bash-) to fix these issues and upgrade command run again.')}</div>

                    <h2 className={classes.h2}>{I18n.t('Linux/macOS (manually installed)')}</h2>
                    <div className={classes.standartText}>{I18n.t('A manual installation usually takes place under root as user and therefore a "sudo" is necessary before the commands.')}</div>

                    <div className={classes.standartText}>{I18n.t('Please execute the following commands in an SSH shell (console):')}</div>

                    <div className={classes.standartTextSmall}>{I18n.t('cd /opt/iobroker')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('sudo iobroker stop')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('sudo iobroker update')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('sudo iobroker upgrade self')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('sudo iobroker start or server reboot, then ioBroker should restart and you can be sure that all old processes were finished.')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('If the upgrade command displays permissions / permissions errors, fix them. Sometimes "sudo" is not enough and you have to run the installation as a real root (previously simply sudo su -).')}</div>

                    <h2 className={classes.h2}>{I18n.t('Windows')}</h2>
                    <div className={classes.standartText}>{I18n.t('For updating ioBroker on Windows, download the appropriate installer with the desired js-controller version from the download page ')}<a href="https://www.iobroker.net/#en/download" target="_blank">https://www.iobroker.net/#en/download</a>{I18n.t(' and make the update with it. With the Windows Installer, previously manually installed servers or installations from other operating systems can be migrated to Windows and updated.')}</div>

                    <h2 className={classes.h2}>{I18n.t('Windows (manually installed)')}</h2>
                    <div className={classes.standartText}>{I18n.t('A manual installation is done with administrator rights. Please start a cmd.exe command line window as an administrator (right-click on cmd.exe and execute as administrator) and execute the following commands:')}</div>

                    <div className={classes.standartTextSmall}>cd C:\iobroker {I18n.t('(or where ioBroker was installed)')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('iobroker stop to stop the ioBroker service')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('iobroker status to check if ioBroker has finished')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('iobroker update')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('iobroker upgrade self')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('Start ioBroker service or reboot computer, then ioBroker should restart and you can be sure that all the old processes were finished.')}</div>
                    <h2 className={classes.h2}>{I18n.t('Emergency Linux / macOS / Windows (manual reinstallation, if somehow nothing works after the update)')}</h2>
                    <div className={classes.standartText}>{I18n.t('On Windows first please call in the start menu under "ioBroker" the command line of the relevant ioBroker instance. The correct directory is then set automatically. On Linux or macOS please go to the ioBroker directory.')}</div>

                    <div className={classes.standartText}>{I18n.t('Run npm install iobroker.js-controller there. A specific version can be installed using npm install iobroker.js-controller@x.y.z (replace x.y.z with the desired version).')}</div>

                    <div className={classes.standartText}>{I18n.t('If there are problems with access rights when running on Linux the command has to be changed slightly:')}</div>

                    <div className={classes.standartTextSmall}>{I18n.t('For systems created with the new Linux installer: sudo -u iobroker -H npm install iobroker.js-controller')}</div>
                    <div className={classes.standartTextSmall}>{I18n.t('For systems installed manually under Linux, prefix sudo or run as root.')}</div>
                    <div className={classes.standartText}>{I18n.t('This way is only necessary in very few cases and please consult the forum beforehand!')}</div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    onClick={onClose}
                    color="default">
                    {I18n.t('Ok')}
                </Button>
            </DialogActions>
        </Dialog>
    </ThemeProvider>;
}

export const JsControllerDialogFunc = () => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderModal';
        document.body.appendChild(node);
    }
    return ReactDOM.render(<JsControllerDialog />, node);
}