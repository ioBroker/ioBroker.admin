import React, { useState } from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Accordion, AccordionDetails, AccordionSummary,
    AppBar, Box, CardMedia,
    Tab, Tabs, Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    Update as UpdateIcon,
    SettingsRemote as SettingsRemoteIcon,
    Cancel as CancelIcon,
    CancelPresentation as CancelPresentationIcon,
    PermDeviceInformation as PermDeviceInformationIcon,
    ImportExport as ImportExportIcon,
    Warning as WarningIcon,
    Notifications as BellIcon,
    Info as InfoIcon,
    Memory as MemoryIcon,
    ExpandMore as ExpandMoreIcon,
    Check as CheckIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

import { I18n, Utils, type ThemeType } from '@iobroker/adapter-react-v5';

const useStyles = makeStyles(theme => ({
    root: {
        // @ts-expect-error probably needs better types
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
        borderRadius: 4,
        flexDirection: 'column',
    },
    paper: {
        maxWidth: 1000,
        width: '100%',
    },
    flex: {
        display: 'flex',
    },
    overflowHidden: {
        overflow: 'hidden',
    },
    overflowAuto: {
        overflowY: 'auto',
    },
    pre: {
        overflow: 'auto',
        margin: 20,
        '& p': {
            fontSize: 18,
        },
    },
    blockInfo: {
        right: 20,
        top: 10,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        color: 'silver',
    },
    img: {
        marginLeft: 10,
        width: 45,
        height: 45,
        margin: 'auto 0',
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            zIndex: 2,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'url("img/no-image.png") 100% 100% no-repeat',
            backgroundSize: 'cover',
            backgroundColor: '#fff',
        },
    },
    message: {
        justifyContent: 'space-between',
        display: 'flex',
        width: '100%',
        alignItems: 'center',
    },
    column: {
        flexDirection: 'column',
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 20,
        // @ts-expect-error probably needs better types
        color: theme.palette.mode === 'dark' ? '#DDD' : '#111',
    },
    descriptionHeaderText: {
        margin: '18px 0',
        // @ts-expect-error probably needs better types
        color: theme.palette.mode === 'dark' ? '#CCC' : '#222',
    },
    silver: {
        color: 'silver',
    },
    button: {
        paddingTop: 18,
        paddingBottom: 5,
        position: 'sticky',
        bottom: 0,
        background: 'white',
        zIndex: 3,
    },
    terminal: {
        fontFamily: 'monospace',
        fontSize: 14,
        marginLeft: 20,
        whiteSpace: 'pre-wrap',
    },
    img2: {
        width: 25,
        height: 25,
        marginRight: 10,
        margin: 'auto 0',
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            zIndex: 2,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'url("img/no-image.png") 100% 100% no-repeat',
            backgroundSize: 'cover',
            backgroundColor: '#fff',
        },
    },
    heading: {
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
    },
    headingTop: {
        display: 'flex',
        alignItems: 'center',
    },
    classNameBox: {
        padding: 24,
    },
    textStyle: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    content: {
        overflow: 'hidden',
    },
    buttonStyle: {
        margin: 3,
    },
    '@media screen and (max-width: 550px)': {
        classNameBox: {
            padding: 10,
        },
        message: {
            flexWrap: 'wrap',
        },
        textStyle: {
            fontSize: '2.9vw',
        },
        terminal: {
            fontSize: '2.9vw',
            marginLeft: 0,
        },
        silver: {
            fontSize: '2.9vw',
        },
        buttonStyle: {
            fontSize: '2.9vw',
        },
    },
}));

/** Possible message severities */
type Severity = 'notify' | 'info' | 'alert';

interface StatusOptions {
    /** Id of the message */
    name: string;
    /** Severity of the message */
    severity?: Severity;
}

const Status = ({ name, severity, ...props }: StatusOptions) => {
    switch (name) {
        case 'restartLoop':
            return <UpdateIcon style={{ color: '#ffca00' }} {...props} />;
        case 'memIssues':
            return <MemoryIcon style={{ color: '#ffca00' }} {...props} />;
        case 'fsIoErrors':
            return <ImportExportIcon style={{ color: '#ffca00' }} {...props} />;
        case 'noDiskSpace':
            return <PermDeviceInformationIcon style={{ color: '#ffca00' }} {...props} />;
        case 'accessErrors':
            return <CancelPresentationIcon style={{ color: '#ffca00' }} {...props} />;
        case 'nonExistingFileErrors':
            return <CancelIcon style={{ color: '#ffca00' }} {...props} />;
        case 'remoteHostErrors':
            return <SettingsRemoteIcon style={{ color: '#ffca00' }} {...props} />;
        case 'heading':
            return <WarningIcon
                style={{
                    color: '#ffca00',
                    fontSize: 36,
                    marginLeft: 25,
                    marginRight: 10,
                }}
                {...props}
            />;

        default:
            if (severity === 'notify') {
                return <BellIcon color="primary" {...props} />;
            }

            if (severity === 'info') {
                return <InfoIcon color="info" {...props} />;
            }

            return <WarningIcon style={{ color: '#ffca00' }} {...props} />;
    }
};

const a11yProps = (index: number) => ({
    id: `scrollable-force-tab-${index}`,
    'aria-controls': `scrollable-force-tabpanel-${index}`,
});

interface TabPanelOptions {
    value: number;
    index: number;
    classNameBox: string;
    children: React.JSX.Element;
}

const TabPanel = ({
    children, value, index, classNameBox, ...other
}: TabPanelOptions) => <div
    role="tabpanel"
    hidden={value !== index}
    id={`scrollable-force-tabpanel-${index}`}
    aria-labelledby={`scrollable-force-tab-${index}`}
    {...other}
>
    { value === index &&
            <Box className={classNameBox}>
                <Typography component="div">{children}</Typography>
            </Box>}
</div>;

interface InstanceMessage {
    messages: {
        message: string;
        ts: number;
    }[];
}

interface Message {
    name: ioBroker.Translated;
    severity: Severity;
    description: ioBroker.Translated;
    instances: Record<string, InstanceMessage>;
}

interface HostWarningDialogOptions {
    messages: Record<string, Message>;
    onClose: () => void;
    ackCallback: (name: string) => void;
    dateFormat: string;
    themeType: ThemeType;
    instances: any;
}

const HostWarningDialog = ({
    messages, onClose, ackCallback, dateFormat, themeType, instances,
}: HostWarningDialogOptions) => {
    const classes = useStyles();

    const [value, setValue] = useState(0);
    const [disabled, setDisabled] = useState<string[]>([]);
    const [expanded, setExpanded] = useState('');
    const [autoCollapse, setAutoCollapse] = useState(true);

    const handleChange = (event: unknown, newValue: number) => {
        setAutoCollapse(true);
        setValue(newValue);
        setExpanded('');
    };

    const handleChangeAccordion = (panel: string) => (_event: unknown, isExpanded: boolean) =>
        setExpanded(isExpanded ? panel : '');

    const dark = themeType === 'dark';

    return <Dialog
        onClose={() => onClose()}
        open={!0}
        classes={{ paper: classes.paper }}
    >
        <h2 className={classes.headingTop}>
            <Status name="heading" />
            {I18n.t('Adapter warnings')}
        </h2>
        <DialogContent className={Utils.clsx(classes.flex, classes.overflowHidden)} dividers>
            <div className={classes.root}>
                <AppBar position="static" color="default">
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        variant="scrollable"
                        scrollButtons
                        indicatorColor={dark ? 'primary' : 'secondary'}
                        textColor="primary"
                    >
                        {Object.entries(messages).map(([name, entry], idx) => <Tab
                            style={dark ? { color: 'white' } : { color: 'black' }}
                            disabled={disabled.includes(name)}
                            key={name}
                            label={entry.name[I18n.getLanguage()]}
                            icon={<Status name={name} severity={entry.severity} />}
                            {...a11yProps(idx)}
                        />)}
                    </Tabs>
                </AppBar>
                {Object.keys(messages).map((name, idx) => <TabPanel
                    // @ts-expect-error probably needs better types
                    classes={{ root: classes.overflowAuto }}
                    classNameBox={classes.classNameBox}
                    key={`tabPanel-${name}`}
                    style={dark ? { color: 'black' } : null}
                    value={value}
                    index={idx}
                >
                    <div>
                        <div className={classes.headerText} style={{ fontWeight: 'bold' }}>
                            {messages[name].name[I18n.getLanguage()]}
                        </div>
                        <div className={classes.descriptionHeaderText}>
                            {messages[name].description[I18n.getLanguage()]}
                        </div>
                        <div>
                            {messages[name].instances ? Object.keys(messages[name].instances).map(nameInst => {
                                const index = Object.keys(messages).indexOf(name);

                                if (autoCollapse && value === index) {
                                    handleChangeAccordion(`${name}-${nameInst}`)('', true);
                                    setAutoCollapse(false);
                                }

                                const currentInstance = instances && instances[nameInst];
                                let icon = 'img/no-image.png';
                                if (currentInstance?.common?.icon && currentInstance?.common?.name) {
                                    icon = `adapter/${currentInstance.common.name}/${currentInstance.common.icon}`;
                                }
                                return <Accordion
                                    style={dark ? undefined : { background: '#c0c0c052' }}
                                    key={nameInst}
                                    expanded={expanded === `${name}-${nameInst}`}
                                    onChange={handleChangeAccordion(`${name}-${nameInst}`)}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        classes={{ content: classes.content }}
                                        aria-controls="panel1bh-content"
                                        id="panel1bh-header"
                                    >
                                        <Typography className={classes.heading}>
                                            <CardMedia className={classes.img2} component="img" image={icon} />
                                            <div className={classes.textStyle}>
                                                {nameInst.replace(/^system\.adapter\./, '')}
                                            </div>
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails className={classes.column}>
                                        {messages[name].instances[nameInst].messages.map(msg =>
                                            <Typography key={msg.ts} component="div" className={classes.message}>
                                                <div className={classes.terminal}>{msg.message}</div>
                                                <div className={classes.silver}>{Utils.formatDate(new Date(msg.ts), dateFormat)}</div>
                                            </Typography>)}
                                    </AccordionDetails>
                                </Accordion>;
                            }) : null}
                        </div>
                        <div className={classes.button}>
                            <Button
                                variant="contained"
                                autoFocus={Object.keys(messages).length !== 1}
                                disabled={disabled.includes(name)}
                                style={disabled.includes(name) ? { background: 'silver' } : undefined}
                                className={classes.buttonStyle}
                                onClick={() => {
                                    ackCallback(name);
                                    setDisabled([...disabled, name]);
                                }}
                                color={Object.keys(messages).length !== 1 ? 'primary' : 'grey'}
                                startIcon={<CheckIcon />}
                            >
                                {I18n.t('Acknowledge')}
                            </Button>
                            {Object.keys(messages).length === 1 && <Button
                                variant="contained"
                                disabled={disabled.includes(name)}
                                className={classes.buttonStyle}
                                style={disabled.includes(name) ? { background: 'silver' } : undefined}
                                onClick={() => {
                                    setDisabled([...disabled, name]);
                                    ackCallback(name);
                                    onClose();
                                }}
                                startIcon={<>
                                    <CheckIcon />
                                    <CloseIcon />
                                </>}
                                color="primary"
                            >
                                {I18n.t('Acknowledge & close')}
                            </Button>}
                        </div>
                    </div>
                </TabPanel>)}
            </div>
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                onClick={() => onClose()}
                startIcon={<CloseIcon />}
                color="grey"
            >
                {I18n.t('Ok')}
            </Button>
        </DialogActions>
    </Dialog>;
};

export default HostWarningDialog;
