/* eslint-disable react/jsx-no-target-blank */
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import IconCopy from '@iobroker/adapter-react-v5/icons/IconCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Card, DialogTitle, IconButton } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';

import I18n from '@iobroker/adapter-react-v5/i18n';
import theme from '@iobroker/adapter-react-v5/Theme';
import Utils from '@iobroker/adapter-react-v5/Components/Utils';

let node = null;

const useStyles = makeStyles((theme) => ({
    root: {
        // backgroundColor: theme.palette.background.paper,
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
    // pre: {
    //     overflow: 'auto',
    //     whiteSpace: 'pre-wrap',
    //     margin: 0
    // },
    h1: {
        fontWeight: 500,
        fontSize: 35,
        margin: '10px 0'
    },
    h2: {
        padding: '10px 7px',
        fontSize: 25,
        fontWeight: 300,
        borderRadius: 3,
        background: '#4dabf5',
        color: theme.palette.mode === 'dark' ? 'black' : 'white'
    },
    h22: {
        padding: 0,
        margin:0,
        fontSize: 25,
        fontWeight: 300,
        borderRadius: 3,
        background: '#4dabf5',
        color: theme.palette.mode === 'dark' ? 'black' : 'white'
    },
    standardText: {
        fontSize: 15,
        margin: '10px 0',
        '& > a': {
            textDecoration: 'none',
            color: '#1e88e5'
        }
    },
    standardTextSmall: {
        fontSize: 12,
        color: 'black'
    },
    standardTextSmall2: {
        fontSize: 12
    },
    silver: {
        color: 'silver',
        '& > a': {
            textDecoration: 'none',
            color: '#1e88e5'
        }
    },
    pre: {
        whiteSpace: 'pre-wrap',
        background: '#e4e3e3',
        padding: 10,
        borderRadius: 3,
        position: 'relative'
    },
    copyButton: {
        color: 'black',
        position: 'absolute',
        right: 10,
        top: 4
    },
    comment: {
        color: '#00000078'
    },
    accordionSummary:{
        background: '#4dabf5',
        borderRadius: 3,
        '& .MuiAccordionSummary-content':{
            margin:0
        }

    },
    accordionDetails:{
        display: 'flex',
        flexDirection: 'column'

    }
}));

const JsControllerDialog = ({ socket, hostId }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);
    const [location, setLocation] = useState('');
    const [os, setOS] = useState('');

    socket.getHostInfoShort(hostId)
        .then(data => {
            data.location && setLocation(data.location);
            setOS(data.os); // win32, linux, darwin, freebsd, android
        })
        .catch(e =>
            window.alert(`Cannot get information about host "${hostId}": ${e}`));

    const onClose = () => {
        setOpen(false);
        if (node) {
            try {
                window.document.body.removeChild(node);
            } catch (e) {
                // ignore
            }
            node = null;
        }
    };

    const fallbackCopyTextToClipboard = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            const msg = successful ? 'successful' : 'unsuccessful';
            console.log('Fallback: Copying text command was ' + msg);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }

        try {
            window.document.body.removeChild(textArea);
        } catch (e) {
            // ignore
        }
    }
    const copyTextToClipboard = (text) => {
        if (!navigator.clipboard) {
            fallbackCopyTextToClipboard(text);
            return;
        }
        navigator.clipboard.writeText(text).then(function () {
            console.log('Async: Copying to clipboard was successful!');
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
    }
    return <ThemeProvider theme={theme(Utils.getThemeName())}>
        <Dialog
            onClose={onClose}
            open={open}
            classes={{ paper: classes.paper }}
        >
            <DialogTitle>{I18n.t('js-controller upgrade instructions')}</DialogTitle>
            <DialogContent className={classes.overflowHidden} dividers>
                <Card style={
                    // Utils.getThemeName() === 'dark' ||
                    //     Utils.getThemeName() === 'blue' ?
                    //     { color: 'black' } :
                    null} className={classes.root}>

                    <div className={classes.standardText}>{I18n.t('Due to the different hardware and platforms under which ioBroker runs, the js-controller has to be updated manually. Further details can be found in the appropriate section.')}</div>

                    <h2 className={classes.h2}>{I18n.t('General information for all platforms')}</h2>
                    <div className={classes.standardText}>{I18n.t('For an update from js-controller 1.x to 2.x please always read the information at')} <a href="https://forum.iobroker.net/topic/26759/js-controller-2-jetzt-f%C3%BCr-alle-im-stable" target="_blank">forum</a>.
</div>
                    <div className={classes.standardText}>{I18n.t('Otherwise please update the slaves first with an update of master-slave systems and the master last!')}
                    </div>
                    {os !== 'win32' && <><h2 className={classes.h2}>{I18n.t('Linux/macOS (new installer)')}</h2>
                        <div className={classes.standardText}>{I18n.t('This is the recommended option')}</div>

                        <div className={classes.standardText}>{I18n.t('Please execute the following commands in an SSH shell (console):')}</div>
                        <pre className={classes.pre}>
                            <IconButton size="small" onClick={() => {
                                window.alert(I18n.t('Copied'))
                                copyTextToClipboard(
                                    `iob backup
iob stop
iob update
iob upgrade self
iob start`
                                );
                            }} className={classes.copyButton}>
                                <IconCopy />
                            </IconButton>
                            <div className={classes.standardTextSmall}>iob backup</div>
                            <div className={classes.standardTextSmall}>iob stop</div>
                            <div className={classes.standardTextSmall}>iob update</div>
                            <div className={classes.standardTextSmall}>iob fix</div>
                            <div className={classes.standardTextSmall}>iob upgrade self</div>
                            <div className={classes.standardTextSmall}>iob start</div>
                        </pre>
                            <div className={clsx(classes.standardTextSmall2)}>{I18n.t('or reboot server, then ioBroker should restart and you can be sure that all old processes were finished.')}</div>
                            <div className={clsx(classes.standardTextSmall2)}>{I18n.t('If the upgrade command displays Access Rights / Permission errors, then please use the install fixer')}</div>
                            <pre className={classes.pre}>
                            <IconButton size="small" onClick={() => {
                                window.alert(I18n.t('Copied'))
                                copyTextToClipboard(`curl -sL https://iobroker.net/fix.sh | bash -`);
                            }} className={classes.copyButton}>
                                <IconCopy />
                            </IconButton>
                            <div className={classes.standardTextSmall}>curl -sL https://iobroker.net/fix.sh | bash -</div>
                        </pre>
                        <div className={clsx(classes.standardTextSmall2)}>{I18n.t('to fix these issues and upgrade command run again.')}</div>

                        <h2 className={classes.h2}>{I18n.t('Linux/macOS (manually installed)')}</h2>
                        <div className={classes.standardText}>{I18n.t('A manual installation usually takes place under root as user and therefore a "sudo" is necessary before the commands.')}</div>

                        <div className={classes.standardText}>{I18n.t('Please execute the following commands in an SSH shell (console):')}</div>
                        <pre className={classes.pre}>
                            <IconButton size="small" onClick={() => {
                                window.alert(I18n.t('Copied'))
                                copyTextToClipboard(
                                    `cd ${location || '/opt/iobroker'}
iob backup
iob stop
iob update
iob fix
iob upgrade self
iob start
`
                                );
                            }} className={classes.copyButton}>
                                <IconCopy />
                            </IconButton>
                            <div className={classes.standardTextSmall}>cd {location || '/opt/iobroker'}</div>
                            <div className={classes.standardTextSmall}>iob backup</div>
                            <div className={classes.standardTextSmall}>iob stop</div>
                            <div className={classes.standardTextSmall}>iob fix</div>
                            <div className={classes.standardTextSmall}>iob update</div>
                            <div className={classes.standardTextSmall}>iob upgrade self</div>
                            <div className={classes.standardTextSmall}>iob start</div>
                        </pre>

                        <div className={clsx(classes.standardTextSmall2)}>{I18n.t('or reboot server, then ioBroker should restart and you can be sure that all old processes were finished.')}</div>
                        <div className={clsx(classes.standardTextSmall2)}>{I18n.t('If the upgrade command displays permissions / permissions errors, fix them. Sometimes "sudo" is not enough and you have to run the installation as a real root (previously simply sudo su -).')}</div>
                    </>}
                    {os === 'win32' && <><h2 className={classes.h2}>{I18n.t('Windows')}</h2>
                        <div className={classes.standardText}>{I18n.t('For updating ioBroker on Windows, download the appropriate installer with the desired js-controller version from the download page ')}<a href="https://www.iobroker.net/#en/download" target="_blank">https://www.iobroker.net/#en/download</a>{I18n.t(' and make the update with it. With the Windows Installer, previously manually installed servers or installations from other operating systems can be migrated to Windows and updated.')}</div>

                        <h2 className={classes.h2}>{I18n.t('Windows (manually installed)')}</h2>
                        <div className={classes.standardText}>{I18n.t('A manual installation is done with administrator rights. Please start a cmd.exe command line window as an administrator (right-click on cmd.exe and execute as administrator) and execute the following commands:')}</div>
                        <pre className={classes.pre}>
                            <IconButton size="small" onClick={() => {
                                window.alert(I18n.t('Copied'))
                                copyTextToClipboard(
                                    `cd ${(location || 'C:\\iobroker').replace(/\//g, '\\')}
iob backup
iob stop
iob status
iob update
iob upgrade self
`
                                );
                            }} className={classes.copyButton}>
                                <IconCopy />
                            </IconButton>
                            <div className={classes.standardTextSmall}>cd {(location || 'C:\\iobroker').replace(/\//g, '\\')} {!location ? I18n.t('(or where ioBroker was installed)') : null}</div>
                            <div className={classes.standardTextSmall}>iob backup</div>
                            <div className={classes.standardTextSmall}>iob stop {I18n.t('to stop the ioBroker service')}</div>
                            <div className={classes.standardTextSmall}>iob status {I18n.t('to check if ioBroker has finished')}</div>
                            <div className={classes.standardTextSmall}>iob update</div>
                            <div className={classes.standardTextSmall}>iob upgrade self</div>
                        </pre>
                        <div className={clsx(classes.standardTextSmall2)}>{I18n.t('Start ioBroker service or reboot computer, then ioBroker should restart and you can be sure that all the old processes were finished.')}</div>
                    </>}
                    <Accordion style={{paddingTop:14}}>
                        <AccordionSummary
                        className={classes.accordionSummary}
                            expandIcon={<ExpandMoreIcon />}
                        >
                            <h2 className={classes.h22}>{I18n.t('Emergency Linux / macOS / Windows')}</h2>
                        </AccordionSummary>
                        <AccordionDetails
                        className={classes.accordionDetails}>
                            <div className={classes.standardText}>{I18n.t('(manual reinstallation, if somehow nothing works after the update)')}</div>
                            <div className={classes.standardText}>{I18n.t('On Windows first please call in the start menu under "ioBroker" the command line of the relevant ioBroker instance. The correct directory is then set automatically. On Linux or macOS please go to the ioBroker directory.')}</div>

                            <div className={classes.standardText}>{I18n.t('Run npm install iobroker.js-controller there. A specific version can be installed using npm install iobroker.js-controller@x.y.z (replace x.y.z with the desired version).')}</div>

                            <div className={classes.standardText}>{I18n.t('If there are problems with access rights when running on Linux the command has to be changed slightly:')}</div>

                            <div className={classes.standardTextSmall2}>{I18n.t('For systems created with the new Linux installer:')}</div>
                            <pre className={classes.pre}>
                                <IconButton size="small" onClick={() => {
                                    window.alert(I18n.t('Copied'))
                                    copyTextToClipboard(
                                        `cd ${os === 'win32' ? (location || 'C:\\iobroker').replace(/\//g, '\\') : (location || '/opt/iobroker')}
sudo -u iobroker -H npm install iobroker.js-controller`
                                    );
                                }} className={classes.copyButton}>
                                    <IconCopy />
                                </IconButton>
                                <div className={classes.standardTextSmall}>cd {os === 'win32' ? (location || 'C:\\iobroker').replace(/\//g, '\\') : (location || '/opt/iobroker')}</div>
                                <div className={classes.standardTextSmall}>sudo -u iobroker -H npm install iobroker.js-controller</div>
                            </pre>
                            <div className={classes.standardTextSmall2}>{I18n.t('For systems installed manually under Linux, prefix sudo or run as root.')}</div>
                            <div className={classes.standardText}>{I18n.t('This way is only necessary in very few cases and please consult the forum beforehand!')}</div>
                        </AccordionDetails>
                    </Accordion>

                </Card>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    onClick={() => {
                        window.open('https://github.com/ioBroker/ioBroker.js-controller/blob/master/CHANGELOG.md', '_blank')
                        onClose();
                    }}
                    color="grey"
                    startIcon={<DescriptionIcon />}
                >
                    {I18n.t('Show whole changelog')}
                </Button>
                <Button
                    variant="contained"
                    onClick={onClose}
                    color="primary"
                    startIcon={<CloseIcon />}
                >
                    {I18n.t('Ok')}
                </Button>
            </DialogActions>
        </Dialog>
    </ThemeProvider>;
}

export const JsControllerDialogFunc = (socket, hostId) => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderModal';
        document.body.appendChild(node);
    }
    return ReactDOM.render(<JsControllerDialog hostId={hostId} socket={socket} />, node);
}