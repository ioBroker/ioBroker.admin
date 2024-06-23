import React, { useState } from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Accordion, AccordionDetails, AccordionSummary,
    AppBar, Box, CardMedia,
    Tab, Tabs, Typography, Tooltip,
} from '@mui/material';

import {
    Warning as WarningIcon,
    Notifications as BellIcon,
    Info as InfoIcon,
    ExpandMore as ExpandMoreIcon,
    Check as CheckIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

import {
    I18n, Utils,
    type ThemeType,
    type IobTheme,
} from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = {
    root: (theme: IobTheme) => ({
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
        borderRadius: '4px',
        flexDirection: 'column',
    }),
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
    message: {
        justifyContent: 'space-between',
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        '@media screen and (max-width: 550px)': {
            flexWrap: 'wrap',
        },
    },
    column: {
        flexDirection: 'column',
    },
    headerText: (theme: IobTheme) => ({
        fontWeight: 'bold',
        fontSize: 20,
        color: theme.palette.mode === 'dark' ? '#DDD' : '#111',
    }),
    descriptionHeaderText: (theme: IobTheme) => ({
        margin: '18px 0',
        color: theme.palette.mode === 'dark' ? '#CCC' : '#222',
    }),
    silver: {
        color: 'silver',
        '@media screen and (max-width: 550px)': {
            fontSize: '2.9vw',
        },
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
        ml: '20px',
        whiteSpace: 'pre-wrap',
        '@media screen and (max-width: 550px)': {
            fontSize: '2.9vw',
            ml: 0,
        },
    },
    img2: {
        width: 25,
        height: 25,
        mr: '10px',
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
        p: '24px',
        '@media screen and (max-width: 550px)': {
            p: '10px',
        },
    },
    textStyle: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        '@media screen and (max-width: 550px)': {
            fontSize: '2.9vw',
        },
    },
    content: {
        overflow: 'hidden',
    },
    buttonStyle: {
        m: '3px',
        '@media screen and (max-width: 550px)': {
            fontSize: '2.9vw',
        },
    },
};

/** Possible message severities */
type Severity = 'notify' | 'info' | 'alert';

interface StatusOptions {
    /** Severity of the message */
    severity?: Severity;
    /** If dark mode enabled */
    isDark: boolean;
}

const Status = ({ severity, isDark, ...props }: StatusOptions) => {
    if (severity === 'notify') {
        return <BellIcon color={isDark ? 'primary' : 'secondary'} {...props} />;
    }

    if (severity === 'info') {
        return <InfoIcon color="info" {...props} />;
    }

    return <WarningIcon style={{ color: '#ffca00' }} {...props} />;
};

const a11yProps = (index: number) => ({
    id: `scrollable-force-tab-${index}`,
    'aria-controls': `scrollable-force-tabpanel-${index}`,
});

interface TabPanelOptions {
    value: number;
    index: number;
    style: React.CSSProperties;
    sxBox: Record<string, any>;
    children: React.JSX.Element[];
}

const TabPanel = ({
    children, value, index, sxBox, style,
}: TabPanelOptions) => <div
    role="tabpanel"
    hidden={value !== index}
    id={`scrollable-force-tabpanel-${index}`}
    aria-labelledby={`scrollable-force-tab-${index}`}
    style={style}
>
    {value === index && <Box sx={sxBox}>
        <Typography component="div">{children}</Typography>
    </Box>}
</div>;

type Translated = Record<ioBroker.Languages, string>;

interface InstanceMessage {
    messages: {
        message: string;
        ts: number;
    }[];
}

interface Message {
    name: Translated;
    severity: Severity;
    description: Translated;
    instances: Record<string, InstanceMessage>;
}

interface NotificationDialogOptions {
    notifications: {
        [host: string]: {
            result: {
                [scope: string]: {
                    categories: {
                        [category: string]: Message;
                    };};
            };};
    };
    onClose: () => void;
    ackCallback: (host: string, name: string) => void;
    dateFormat: string;
    themeType: ThemeType;
    instances: Record<string, any>;
}

interface MessagesPerScope {
    [scope: string]: Record<string, Message & { host: string }>;
}

const NotificationsDialog = ({
    notifications, onClose, ackCallback, dateFormat, themeType, instances,
}: NotificationDialogOptions) => {
    const notificationManagerInstalled = !!Object.values(instances).find(instance => instance.common.name === 'notification-manager');

    const messages: MessagesPerScope = {};

    for (const [host, hostDetails] of Object.entries(notifications)) {
        for (const [scope, scopeDetails] of Object.entries(hostDetails.result)) {
            if (scope === 'system') {
                continue;
            }

            for (const [category, categoryDetails] of Object.entries(scopeDetails.categories)) {
                messages[scope] = messages[scope] || {};
                messages[scope][category] = { ...categoryDetails, host };
            }
        }
    }

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

    const black = themeType === 'dark';

    return <Dialog
        onClose={() => onClose()}
        open={!0}
        sx={{ '& .MuiDialog-paper': styles.paper }}
    >
        <h2 style={styles.headingTop}>
            <BellIcon
                sx={{
                    color: 'primary.main',
                }}
                style={{
                    fontSize: 36,
                    marginLeft: 25,
                    marginRight: 10,
                }}
            />
            {I18n.t('Notifications')}

            {!notificationManagerInstalled ? <Tooltip sx={{ position: 'absolute', right: 24, color: 'text.primary' }} title={I18n.t('Tip: Use the "notification-manager" adapter to receive notifications automatically via messaging adapters.')}>
                <InfoIcon />
            </Tooltip> : null}
        </h2>
        <DialogContent style={{ ...styles.flex, ...styles.overflowHidden }} dividers>
            <Box component="div" sx={styles.root}>
                <AppBar position="static" color="default">
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        variant="scrollable"
                        scrollButtons
                        indicatorColor={black ? 'primary' : 'secondary'}
                        textColor={black ? 'primary' : 'secondary'}
                    >
                        {Object.values(messages).map(categoryEntry => Object.entries(categoryEntry).map(([name, entry], idx) => <Tab
                            disabled={disabled.includes(name)}
                            key={name}
                            label={`${entry.name[I18n.getLanguage()]}`}
                            icon={<Status severity={entry.severity} isDark={black} />}
                            {...a11yProps(idx)}
                        />))}
                    </Tabs>
                </AppBar>
                {Object.keys(messages).map(scope => <>
                    {Object.keys(messages[scope]).map((name, idx) => <TabPanel
                        sxBox={styles.classNameBox}
                        key={`tabPanel-${name}`}
                        style={{ ...styles.overflowAuto, color: black ? 'black' : undefined }}
                        value={value}
                        index={idx}
                    >
                        <Box component="div" sx={styles.headerText} style={{ fontWeight: 'bold' }}>
                            {messages[scope][name].name[I18n.getLanguage()]}
                        </Box>
                        <Box component="div" sx={styles.descriptionHeaderText}>
                            {messages[scope][name].description[I18n.getLanguage()]}
                        </Box>
                        <div>
                            {messages[scope][name].instances ? Object.keys(messages[scope][name].instances).map(nameInst => {
                                const index = Object.keys(messages[scope]).indexOf(name);

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
                                    style={black ? undefined : { background: '#c0c0c052' }}
                                    key={nameInst}
                                    expanded={expanded === `${name}-${nameInst}`}
                                    onChange={handleChangeAccordion(`${name}-${nameInst}`)}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        sx={{ '& .MuiAccordionSummary-content': styles.content }}
                                        aria-controls="panel1bh-content"
                                        id="panel1bh-header"
                                    >
                                        <Typography style={styles.heading}>
                                            <CardMedia sx={styles.img2} component="img" image={icon} />
                                            <Box component="div" sx={styles.textStyle}>
                                                {nameInst.replace(/^system\.adapter\./, '')}
                                            </Box>
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails style={styles.column}>
                                        {messages[scope][name].instances[nameInst].messages.map(msg =>
                                            <Typography key={msg.ts} component="div" sx={styles.message}>
                                                <Box component="div" sx={styles.terminal}>{Utils.renderTextWithA(msg.message)}</Box>
                                                <Box component="div" sx={styles.silver}>{Utils.formatDate(new Date(msg.ts), dateFormat)}</Box>
                                            </Typography>)}
                                    </AccordionDetails>
                                </Accordion>;
                            }) : null}
                        </div>
                        <div style={styles.button}>
                            <Button
                                variant="contained"
                                autoFocus={Object.keys(messages[scope]).length !== 1}
                                disabled={disabled.includes(name)}
                                style={disabled.includes(name) ? { background: 'silver' } : undefined}
                                sx={styles.buttonStyle}
                                onClick={() => {
                                    ackCallback(messages[scope][name].host, name);
                                    setDisabled([...disabled, name]);
                                }}
                                color={Object.keys(messages[scope]).length !== 1 ? 'primary' : 'grey'}
                                startIcon={<CheckIcon />}
                            >
                                {I18n.t('Acknowledge')}
                            </Button>
                            {Object.keys(messages[scope]).length === 1 && <Button
                                variant="contained"
                                disabled={disabled.includes(name)}
                                sx={styles.buttonStyle}
                                style={disabled.includes(name) ? { background: 'silver' } : undefined}
                                onClick={() => {
                                    setDisabled([...disabled, name]);
                                    ackCallback(messages[scope][name].host, name);
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
                    </TabPanel>)}
                </>)}
            </Box>
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

export default NotificationsDialog;
