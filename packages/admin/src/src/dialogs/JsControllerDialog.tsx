/* eslint-disable react/jsx-no-target-blank */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { makeStyles } from '@mui/styles';

import {
    Accordion, AccordionDetails, AccordionSummary,
    Card, DialogTitle, IconButton,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
} from '@mui/material';

import {
    ExpandMore as ExpandMoreIcon,
    Description as DescriptionIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

import { I18n, Utils, IconCopy } from '@iobroker/adapter-react-v5';
import type { Theme } from '@iobroker/adapter-react-v5/types';

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        // backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        padding: 10,
    },
    paper: {
        maxWidth: 1000,
    },
    overflowHidden: {
        display: 'flex',
        overflow: 'hidden',
    },
    // pre: {
    //     overflow: 'auto',
    //     whiteSpace: 'pre-wrap',
    //     margin: 0
    // },
    h1: {
        fontWeight: 500,
        fontSize: 35,
        margin: '10px 0',
    },
    h2: {
        padding: '10px 7px',
        fontSize: 25,
        fontWeight: 300,
        borderRadius: 3,
        background: '#4dabf5',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    },
    h22: {
        padding: 0,
        margin:0,
        fontSize: 25,
        fontWeight: 300,
        borderRadius: 3,
        background: '#4dabf5',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    },
    standardText: {
        fontSize: 15,
        margin: '10px 0',
        '& > a': {
            textDecoration: 'none',
            color: '#1e88e5',
        },
    },
    standardTextSmall: {
        fontSize: 12,
        color: 'black',
    },
    standardTextSmall2: {
        fontSize: 12,
    },
    silver: {
        color: 'silver',
        '& > a': {
            textDecoration: 'none',
            color: '#1e88e5',
        },
    },
    pre: {
        whiteSpace: 'pre-wrap',
        background: '#e4e3e3',
        padding: 10,
        borderRadius: 3,
        position: 'relative',
    },
    copyButton: {
        color: 'black',
        position: 'absolute',
        right: 10,
        top: 4,
    },
    comment: {
        color: '#00000078',
    },
    accordionSummary:{
        background: '#4dabf5',
        borderRadius: 3,
        '& .MuiAccordionSummary-content': {
            margin: 0,
        },
    },
    accordionDetails:{
        display: 'flex',
        flexDirection: 'column',
    },
    code: {
        backgroundColor: theme.palette.mode === 'dark' ? '#123456' : '#93bbe7',
        padding: '0 3px 0 3px',
    },
    copyButtonSmall: {
        width: 31,
        height: 16,
    },
}));

function removeChapter(text: string, remove: string, mustContain: string): string {
    const lines = text.split('\n');
    const newLines = [];
    let found = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.startsWith('##')) {
            found = line.includes(remove.toLowerCase()) && (!mustContain || !line.includes(mustContain.toLowerCase()));
        }

        if (!found) {
            newLines.push(lines[i]);
        }
    }

    return newLines.join('\n');
}

interface HostInfoShort {
    location: string;
    os: string;
}

interface JsControllerDialogProps {
    socket: any;
    hostId: string;
    version: string;
    onClose: () => void;
}

const JsControllerDialog = ({
    socket, hostId, version, onClose,
}: JsControllerDialogProps) => {
    const classes = useStyles();
    const [readme, setReadme] = useState<(string | React.JSX.Element)[] | null>(null);
    const [location, setLocation] = useState('');
    const [os, setOS] = useState('');

    const copyTextToClipboard = (text: string) => {
        Utils.copyToClipboard(text);
        window.alert(I18n.t('Copied'));
    };

    useEffect(() => {
        if (!hostId || typeof hostId !== 'string') {
            console.error(`Invalid hostId: "${hostId}" with type ${typeof hostId}`);
        }

        (!location || !os) && hostId && typeof hostId === 'string' && socket.getHostInfoShort(hostId)
            .then((data: HostInfoShort) => {
                data.location && data.location !== location && setLocation(data.location);
                data.os && data.os !== os && setOS(data.os); // win32, linux, darwin, freebsd, android

                fetch(`https://raw.githubusercontent.com/ioBroker/ioBroker.docs/master/admin/${I18n.getLanguage()}/controller-upgrade.md`)
                    .then(response => response.text())
                    .then(_readme => {
                        const _os = data.os || os;
                        const _location = (data.location || location).replace(/\\/g, '/');
                        if (_os === 'win32') {
                            _readme = removeChapter(_readme, 'linux', 'windows');
                        } else {
                            _readme = removeChapter(_readme, 'windows', 'linux');
                        }
                        _readme = _readme.replace(/cd \/opt\/iobroker/g, `cd ${_location}`);
                        _readme = _readme.replace(/cd C:\\iobroker/g, `cd ${_location}`);
                        _readme = _readme.replace(/x\.y\.z/g, version);
                        const readmeLines = _readme.split('<!-- copy');

                        const parts: (string | React.JSX.Element)[] = [];
                        readmeLines.forEach(chapter => {
                            if (chapter.includes('-->')) {
                                const parts_ = chapter.split('-->');
                                let button = parts_[0];
                                const text = parts_[1];
                                let small = false;
                                if (button.startsWith(' small')) {
                                    button = button.replace(/^ {2}small /, '');
                                    small = true;
                                }
                                button = button.replace(/^\n\r/, '').replace(/^\n/, '');
                                if (small) {
                                    parts.push(<IconButton
                                        key={`b${parts.length}`}
                                        onClick={() => copyTextToClipboard(button)}
                                    >
                                        <IconCopy />
                                    </IconButton>);
                                } else {
                                    parts.push(<Button
                                        key={`b${parts.length}`}
                                        variant="contained"
                                        onClick={() => copyTextToClipboard(button)}
                                        startIcon={<IconCopy />}
                                    >
                                        {I18n.t('Copy to clipboard')}
                                    </Button>);
                                }
                                parts.push(text);
                            } else {
                                parts.push(chapter);
                            }
                        });

                        setReadme(parts);
                    });
            })
            .catch((e: string) =>
                window.alert(`Cannot get information about host "${hostId}": ${e}`));
    }, [location, os, socket, version, hostId]);

    const renderReadme = () => <>
        {readme.map((text, i) => (typeof text === 'object' ? text : <ReactMarkdown
            key={`t_${i}`}
            components={{
                // eslint-disable-next-line react/no-unstable-nested-components,@typescript-eslint/no-unused-vars
                em: ({ ...props }) => <IconButton
                    className={classes.copyButtonSmall}
                    onClick={() => copyTextToClipboard((props.children as string[])[0].toString())}
                >
                    <IconCopy />
                </IconButton>,
                // eslint-disable-next-line react/no-unstable-nested-components,@typescript-eslint/no-unused-vars
                a: ({ children, ...props }) =>
                    <a style={{ color: 'inherit' }} {...props}>{children}</a>,
                // eslint-disable-next-line react/no-unstable-nested-components,@typescript-eslint/no-unused-vars
                code: ({
                    children, ...props
                }) => <code className={classes.code} {...props}>{children}</code>,
            }}
        >
            {text}
        </ReactMarkdown>))}
    </>;

    const renderText = () => <Card className={classes.root}>
        <div className={classes.standardText}>{I18n.t('Due to the different hardware and platforms under which ioBroker runs, the js-controller has to be updated manually. Further details can be found in the appropriate section.')}</div>

        <h2 className={classes.h2}>{I18n.t('General information for all platforms')}</h2>
        <div className={classes.standardText}>
            {I18n.t('For an update from js-controller 1.x to 2.x please always read the information at')}
            {' '}
            <a href="https://forum.iobroker.net/topic/26759/js-controller-2-jetzt-f%C3%BCr-alle-im-stable" target="_blank">forum</a>
.
        </div>
        <div className={classes.standardText}>{I18n.t('Otherwise please update the slaves first with an update of master-slave systems and the master last!')}</div>
        {os !== 'win32' && <>
            <h2 className={classes.h2}>{I18n.t('Linux/macOS (new installer)')}</h2>
            <div className={classes.standardText}>{I18n.t('This is the recommended option')}</div>

            <div className={classes.standardText}>{I18n.t('Please execute the following commands in an SSH shell (console):')}</div>
            <pre className={classes.pre}>
                <IconButton
                    size="small"
                    onClick={() => {
                        window.alert(I18n.t('Copied'));
                        copyTextToClipboard(
                            `iob backup
iob stop
iob update
iob upgrade self
iob start`,
                        );
                    }}
                    className={classes.copyButton}
                >
                    <IconCopy />
                </IconButton>
                <div className={classes.standardTextSmall}>iob backup</div>
                <div className={classes.standardTextSmall}>iob stop</div>
                <div className={classes.standardTextSmall}>iob update</div>
                <div className={classes.standardTextSmall}>iob fix</div>
                <div className={classes.standardTextSmall}>iob upgrade self</div>
                <div className={classes.standardTextSmall}>iob start</div>
            </pre>
            <div className={Utils.clsx(classes.standardTextSmall2)}>{I18n.t('or reboot server, then ioBroker should restart and you can be sure that all old processes were finished.')}</div>
            <div className={Utils.clsx(classes.standardTextSmall2)}>{I18n.t('If the upgrade command displays Access Rights / Permission errors, then please use the install fixer')}</div>
            <pre className={classes.pre}>
                <IconButton
                    size="small"
                    onClick={() => {
                        window.alert(I18n.t('Copied'));
                        copyTextToClipboard('curl -sL https://iobroker.net/fix.sh | bash -');
                    }}
                    className={classes.copyButton}
                >
                    <IconCopy />
                </IconButton>
                <div className={classes.standardTextSmall}>curl -sL https://iobroker.net/fix.sh | bash -</div>
            </pre>
            <div className={Utils.clsx(classes.standardTextSmall2)}>{I18n.t('to fix these issues and upgrade command run again.')}</div>

            <h2 className={classes.h2}>{I18n.t('Linux/macOS (manually installed)')}</h2>
            <div className={classes.standardText}>{I18n.t('A manual installation usually takes place under root as user and therefore a "sudo" is necessary before the commands.')}</div>

            <div className={classes.standardText}>{I18n.t('Please execute the following commands in an SSH shell (console):')}</div>
            <pre className={classes.pre}>
                <IconButton
                    size="small"
                    onClick={() => {
                        window.alert(I18n.t('Copied'));
                        copyTextToClipboard(
                            `cd ${location || '/opt/iobroker'}
iob backup
iob stop
iob update
iob fix
iob upgrade self
iob start
`,
                        );
                    }}
                    className={classes.copyButton}
                >
                    <IconCopy />
                </IconButton>
                <div className={classes.standardTextSmall}>
cd
                    {location || '/opt/iobroker'}
                </div>
                <div className={classes.standardTextSmall}>iob backup</div>
                <div className={classes.standardTextSmall}>iob stop</div>
                <div className={classes.standardTextSmall}>iob fix</div>
                <div className={classes.standardTextSmall}>iob update</div>
                <div className={classes.standardTextSmall}>iob upgrade self</div>
                <div className={classes.standardTextSmall}>iob start</div>
            </pre>

            <div className={Utils.clsx(classes.standardTextSmall2)}>{I18n.t('or reboot server, then ioBroker should restart and you can be sure that all old processes were finished.')}</div>
            <div className={Utils.clsx(classes.standardTextSmall2)}>{I18n.t('If the upgrade command displays permissions / permissions errors, fix them. Sometimes "sudo" is not enough and you have to run the installation as a real root (previously simply sudo su -).')}</div>
        </>}
        {os === 'win32' && <>
            <h2 className={classes.h2}>{I18n.t('Windows')}</h2>
            <div className={classes.standardText}>
                {I18n.t('For updating ioBroker on Windows, download the appropriate installer with the desired js-controller version from the download page ')}
                <a href="https://www.iobroker.net/#en/download" target="_blank">https://www.iobroker.net/#en/download</a>
                {I18n.t(' and make the update with it. With the Windows Installer, previously manually installed servers or installations from other operating systems can be migrated to Windows and updated.')}
            </div>

            <h2 className={classes.h2}>{I18n.t('Windows (manually installed)')}</h2>
            <div className={classes.standardText}>{I18n.t('A manual installation is done with administrator rights. Please start a cmd.exe command line window as an administrator (right-click on cmd.exe and execute as administrator) and execute the following commands:')}</div>
            <pre className={classes.pre}>
                <IconButton
                    size="small"
                    onClick={() => {
                        window.alert(I18n.t('Copied'));
                        copyTextToClipboard(
                            `cd ${(location || 'C:\\iobroker').replace(/\//g, '\\')}
iob backup
iob stop
iob status
iob update
iob upgrade self
`,
                        );
                    }}
                    className={classes.copyButton}
                >
                    <IconCopy />
                </IconButton>
                <div className={classes.standardTextSmall}>
cd
                    {(location || 'C:\\iobroker').replace(/\//g, '\\')}
                    {' '}
                    {!location ? I18n.t('(or where ioBroker was installed)') : null}
                </div>
                <div className={classes.standardTextSmall}>iob backup</div>
                <div className={classes.standardTextSmall}>
iob stop
                    {I18n.t('to stop the ioBroker service')}
                </div>
                <div className={classes.standardTextSmall}>
iob status
                    {I18n.t('to check if ioBroker has finished')}
                </div>
                <div className={classes.standardTextSmall}>iob update</div>
                <div className={classes.standardTextSmall}>iob upgrade self</div>
            </pre>
            <div className={Utils.clsx(classes.standardTextSmall2)}>{I18n.t('Start ioBroker service or reboot computer, then ioBroker should restart and you can be sure that all the old processes were finished.')}</div>
        </>}
        <Accordion style={{ paddingTop: 14 }}>
            <AccordionSummary
                className={classes.accordionSummary}
                expandIcon={<ExpandMoreIcon />}
            >
                <h2 className={classes.h22}>{I18n.t('Emergency Linux / macOS / Windows')}</h2>
            </AccordionSummary>
            <AccordionDetails
                className={classes.accordionDetails}
            >
                <div className={classes.standardText}>{I18n.t('(manual reinstallation, if somehow nothing works after the update)')}</div>
                <div className={classes.standardText}>{I18n.t('On Windows first please call in the start menu under "ioBroker" the command line of the relevant ioBroker instance. The correct directory is then set automatically. On Linux or macOS please go to the ioBroker directory.')}</div>

                <div className={classes.standardText}>{I18n.t('Run npm install iobroker.js-controller there. A specific version can be installed using npm install iobroker.js-controller@x.y.z (replace x.y.z with the desired version).')}</div>

                <div className={classes.standardText}>{I18n.t('If there are problems with access rights when running on Linux the command has to be changed slightly:')}</div>

                <div className={classes.standardTextSmall2}>{I18n.t('For systems created with the new Linux installer:')}</div>
                <pre className={classes.pre}>
                    <IconButton
                        size="small"
                        onClick={() => {
                            window.alert(I18n.t('Copied'));
                            copyTextToClipboard(
                                `cd ${os === 'win32' ? (location || 'C:\\iobroker').replace(/\//g, '\\') : (location || '/opt/iobroker')}
sudo -u iobroker -H npm install iobroker.js-controller`,
                            );
                        }}
                        className={classes.copyButton}
                    >
                        <IconCopy />
                    </IconButton>
                    <div className={classes.standardTextSmall}>
cd
                        {os === 'win32' ? (location || 'C:\\iobroker').replace(/\//g, '\\') : (location || '/opt/iobroker')}
                    </div>
                    <div className={classes.standardTextSmall}>sudo -u iobroker -H npm install iobroker.js-controller</div>
                </pre>
                <div className={classes.standardTextSmall2}>{I18n.t('For systems installed manually under Linux, prefix sudo or run as root.')}</div>
                <div className={classes.standardText}>{I18n.t('This way is only necessary in very few cases and please consult the forum beforehand!')}</div>
            </AccordionDetails>
        </Accordion>
    </Card>;

    return <Dialog
        onClose={() => onClose()}
        open={!0}
        classes={{ paper: classes.paper }}
    >
        <DialogTitle>{I18n.t('js-controller upgrade instructions')}</DialogTitle>
        <DialogContent className={readme ? null : classes.overflowHidden} dividers>
            {readme ? renderReadme() : renderText()}
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                onClick={() => {
                    window.open('https://github.com/ioBroker/ioBroker.js-controller/blob/master/CHANGELOG.md', '_blank');
                    onClose();
                }}
                // @ts-expect-error grey is valid color
                color="grey"
                startIcon={<DescriptionIcon />}
            >
                {I18n.t('Show whole changelog')}
            </Button>
            <Button
                variant="contained"
                onClick={() => onClose()}
                color="primary"
                startIcon={<CloseIcon />}
            >
                {I18n.t('Ok')}
            </Button>
        </DialogActions>
    </Dialog>;
};

JsControllerDialog.propTypes = {
    socket: PropTypes.object,
    hostId: PropTypes.string,
    theme: PropTypes.object,
    version: PropTypes.string,
    onClose: PropTypes.func,
};

export default JsControllerDialog;
