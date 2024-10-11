import React, { useState, type JSX, useEffect } from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Accordion,
    AccordionDetails,
    AccordionSummary,
    AppBar,
    Box,
    CardMedia,
    Tab,
    Tabs,
    Typography,
    Tooltip,
} from '@mui/material';

import {
    Warning as WarningIcon,
    Notifications as BellIcon,
    Info as InfoIcon,
    ExpandMore as ExpandMoreIcon,
    Check as CheckIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

import { I18n, type ThemeType, type IobTheme, type AdminConnection, type ThemeName } from '@iobroker/react-components';

import NotificationMessage, { type Message, type Severity } from '../components/NotificationMessage';
import type { BackEndCommandGeneric } from '#JC/types';

export interface BackEndCommandOpenLink extends BackEndCommandGeneric {
    command: 'link';
    /** Link url. Could be relative ('#blabla') or absolute ('https://blabla') */
    url: string;
    /** Target of the link. Default is `_self` for relative and '_blank' for absolute links */
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    target?: '_self' | '_blank' | string;
    /** If GUI should be closed after the link was opened (Only for target='_self') */
    close?: boolean;
}

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
    button: {
        paddingTop: 5,
        paddingBottom: 5,
        position: 'sticky',
        bottom: 0,
        // background: 'white',
        zIndex: 3,
    },
    img2: {
        width: 25,
        height: 25,
        margin: 'auto 0',
        mr: '10px',
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
        width: '100%',
    },
    headingTop: {
        display: 'flex',
        alignItems: 'center',
    },
    classNameBox: {
        p: '8px',
        '@media screen and (max-width: 550px)': {
            p: '4px',
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

interface StatusOptions {
    /** Severity of the message */
    severity?: Severity;
    /** If dark mode enabled */
    isDark: boolean;
}

function Status({ severity, isDark, ...props }: StatusOptions): JSX.Element {
    if (severity === 'notify') {
        return (
            <BellIcon
                color={isDark ? 'primary' : 'secondary'}
                {...props}
            />
        );
    }

    if (severity === 'info') {
        return (
            <InfoIcon
                color="info"
                {...props}
            />
        );
    }

    return (
        <WarningIcon
            style={{ color: '#ffca00' }}
            {...props}
        />
    );
}

function a11yProps(index: number): { id: string; 'aria-controls': string } {
    return {
        id: `scrollable-force-tab-${index}`,
        'aria-controls': `scrollable-force-tabpanel-${index}`,
    };
}

interface TabPanelOptions {
    index: string;
    style: React.CSSProperties;
    sxBox: Record<string, any>;
    children: JSX.Element[];
}

const TabPanel = ({ children, index, sxBox, style }: TabPanelOptions): JSX.Element => (
    <div
        role="tabpanel"
        id={`scrollable-force-tabpanel-${index}`}
        aria-labelledby={`scrollable-force-tab-${index}`}
        style={style}
    >
        <Box sx={sxBox}>
            <Typography component="div">{children}</Typography>
        </Box>
    </div>
);

interface NotificationDialogOptions {
    notifications: {
        [host: string]: {
            result: {
                [scope: string]: {
                    categories: {
                        [category: string]: Message;
                    };
                    description: ioBroker.Translated;
                    name: ioBroker.Translated;
                };
            };
        };
    };
    onClose: () => void;
    ackCallback: (host: string, name: string) => void;
    dateFormat: string;
    isFloatComma: boolean;
    themeType: ThemeType;
    themeName: ThemeName;
    theme: IobTheme;
    instances: Record<string, ioBroker.InstanceObject>;
    socket: AdminConnection;
}

interface MessagesPerScope {
    [scope: string]: Record<string, Message & { host: string }>;
}

function onLink(linkCommand: BackEndCommandOpenLink, instanceId: string, onClose: () => void): void {
    let target;
    let url = '';
    if (!linkCommand.url) {
        url = `#tab-instances/config/${instanceId}`;
        target = linkCommand.target || '_self';
    } else if (linkCommand.url.toString().startsWith('#')) {
        target = linkCommand.target || '_self';
        url = linkCommand.url;
    } else if (linkCommand.url.toString().startsWith('/')) {
        target = linkCommand.target || '_self';
        url = linkCommand.url;
    } else if (linkCommand.url.startsWith('http://') || linkCommand.url.startsWith('https://')) {
        target = linkCommand.target || '_blank';
        url = linkCommand.url;
    } else {
        url = `#tab-instances/config/${instanceId}/${linkCommand.url}`;
        target = linkCommand.target || '_self';
    }
    if (target === '_self') {
        // close dialog
        setTimeout(
            (_url: string) => {
                if (_url.startsWith('#')) {
                    window.location.hash = _url;
                } else if (_url.startsWith('/')) {
                    url = `${window.location.protocol}:${window.location.host}${url}`;
                } else if (_url.startsWith('http://') || _url.startsWith('https://')) {
                    window.location.href = _url;
                }
            },
            100,
            url,
        );

        if (linkCommand.close && typeof onClose === 'function') {
            onClose();
        }
    } else {
        if (url.startsWith('#')) {
            url = `${window.location.protocol}:${window.location.host}${window.location.pathname}${url}`;
        } else if (url.startsWith('/')) {
            url = `${window.location.protocol}:${window.location.host}${url}`;
        }

        window.open(url, target);
    }
}

const NotificationsDialog = ({
    notifications,
    onClose,
    ackCallback,
    dateFormat,
    themeType,
    instances,
    themeName,
    theme,
    isFloatComma,
    socket,
}: NotificationDialogOptions): JSX.Element => {
    const [panel, setPanel] = useState('');
    const [disabled, setDisabled] = useState<string[]>([]);
    const [expanded, setExpanded] = useState('');
    const [autoCollapse, setAutoCollapse] = useState(true);
    const [messages, setMessages] = useState<MessagesPerScope>({});

    const handleChange = (_event: React.SyntheticEvent, newValue: string): void => {
        setAutoCollapse(true);
        setPanel(newValue);
        setExpanded('');
    };

    const handleChangeAccordion = (panelName: string) => (_event: unknown, isExpanded: boolean) =>
        setExpanded(isExpanded ? panelName : '');

    const black = themeType === 'dark';

    const notificationManagerInstalled = !!Object.values(instances).find(
        instance => instance.common.name === 'notification-manager',
    );

    useEffect(() => {
        const _messages: MessagesPerScope = {};
        let firstKey = '';

        for (const [host, hostDetails] of Object.entries(notifications)) {
            for (const [scope, scopeDetails] of Object.entries(hostDetails.result)) {
                if (scope === 'system') {
                    continue;
                }

                for (const [category, categoryDetails] of Object.entries(scopeDetails.categories)) {
                    _messages[scope] = _messages[scope] || {};
                    _messages[scope][category] = { ...categoryDetails, host };
                }
            }
        }

        Object.keys(_messages).map(scope =>
            Object.keys(_messages[scope]).map(name => (firstKey = firstKey || `${scope}--${name}`)),
        );

        // if a panel does not exist, set it to the first one
        if (panel) {
            const [scope, name] = panel.split('--');
            if (!_messages[scope]) {
                setPanel(firstKey);
            } else if (!_messages[scope][name]) {
                // take the first message in this scope
                const key = Object.keys(_messages[scope])[0];
                if (key) {
                    setPanel(`${scope}--${key}`);
                } else {
                    setPanel(firstKey);
                }
            }
        } else {
            setPanel(firstKey);
        }
        setMessages(_messages);
    }, [instances, notifications, panel]);

    const [currentScope, currentName] = panel.split('--');
    const entry: (Message & { host: string }) | null =
        currentScope && currentName ? messages[currentScope][currentName] : null;

    return (
        <Dialog
            onClose={() => onClose()}
            open={!0}
            sx={{ '& .MuiDialog-paper': styles.paper }}
        >
            <h2 style={styles.headingTop}>
                <BellIcon
                    sx={{ color: 'primary.main' }}
                    style={{
                        fontSize: 36,
                        marginLeft: 25,
                        marginRight: 10,
                    }}
                />
                {I18n.t('Notifications')}

                {!notificationManagerInstalled ? (
                    <Tooltip
                        sx={{ position: 'absolute', right: 24, color: 'text.primary' }}
                        title={I18n.t(
                            'Tip: Use the "notification-manager" adapter to receive notifications automatically via messaging adapters.',
                        )}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <InfoIcon />
                    </Tooltip>
                ) : null}
            </h2>
            <DialogContent
                style={{ ...styles.flex, ...styles.overflowHidden }}
                dividers
            >
                <Box
                    component="div"
                    sx={styles.root}
                >
                    <AppBar
                        position="static"
                        color="default"
                    >
                        <Tabs
                            value={panel}
                            onChange={handleChange}
                            variant="scrollable"
                            scrollButtons
                            indicatorColor={black ? 'primary' : 'secondary'}
                            textColor={black ? 'primary' : 'secondary'}
                        >
                            {Object.keys(messages).map(scope =>
                                Object.keys(messages[scope]).map((name, idx) => {
                                    const entry = messages[scope][name];
                                    const key = `${scope}--${name}`;

                                    return (
                                        <Tab
                                            disabled={disabled.includes(key)}
                                            key={key}
                                            value={key}
                                            label={`${entry.name[I18n.getLanguage()]}`}
                                            icon={
                                                <Status
                                                    severity={entry.severity}
                                                    isDark={black}
                                                />
                                            }
                                            {...a11yProps(idx)}
                                        />
                                    );
                                }),
                            )}
                        </Tabs>
                    </AppBar>
                    {entry ? (
                        <TabPanel
                            sxBox={styles.classNameBox}
                            key={`tabPanel-${currentName}`}
                            style={{ ...styles.overflowAuto, color: black ? 'black' : undefined }}
                            index={panel}
                        >
                            <Box
                                component="div"
                                sx={styles.headerText}
                                style={{ fontWeight: 'bold' }}
                            >
                                {entry.name[I18n.getLanguage()]}
                            </Box>
                            <Box
                                component="div"
                                sx={styles.descriptionHeaderText}
                            >
                                {entry.description[I18n.getLanguage()]}
                            </Box>
                            <div>
                                {entry.instances
                                    ? Object.keys(entry.instances).map(nameInst => {
                                          const accKey = `${panel}--${nameInst}`;
                                          if (autoCollapse) {
                                              handleChangeAccordion(accKey)('', true);
                                              setAutoCollapse(false);
                                          }

                                          const currentInstance = instances && instances[nameInst];
                                          let icon = 'img/no-image.png';
                                          if (currentInstance?.common?.icon && currentInstance?.common?.name) {
                                              icon = `adapter/${currentInstance.common.name}/${currentInstance.common.icon}`;
                                          }

                                          return (
                                              <Accordion
                                                  style={black ? undefined : { backgroundColor: '#c0c0c052' }}
                                                  key={accKey}
                                                  expanded={expanded === accKey}
                                                  onChange={handleChangeAccordion(accKey)}
                                              >
                                                  <AccordionSummary
                                                      expandIcon={<ExpandMoreIcon />}
                                                      sx={{
                                                          '& .MuiAccordionSummary-content': styles.content,
                                                      }}
                                                      aria-controls="panel1bh-content"
                                                      id="panel1bh-header"
                                                  >
                                                      <Typography style={styles.heading}>
                                                          <CardMedia
                                                              sx={styles.img2}
                                                              component="img"
                                                              image={icon}
                                                          />
                                                          <Box
                                                              component="div"
                                                              sx={styles.textStyle}
                                                          >
                                                              {nameInst.replace(/^system\.adapter\./, '')}
                                                          </Box>
                                                      </Typography>
                                                  </AccordionSummary>
                                                  <AccordionDetails style={styles.column}>
                                                      {entry.instances[nameInst].messages.map((msg, i) => (
                                                          <NotificationMessage
                                                              key={i}
                                                              message={msg}
                                                              dateFormat={dateFormat}
                                                              // entry={entry}
                                                              instanceId={nameInst}
                                                              socket={socket}
                                                              themeType={themeType}
                                                              themeName={themeName}
                                                              theme={theme}
                                                              isFloatComma={isFloatComma}
                                                              // onClose={onClose}
                                                              onLink={(linkCommand: BackEndCommandOpenLink) =>
                                                                  onLink(linkCommand, nameInst, onClose)
                                                              }
                                                          />
                                                      ))}
                                                  </AccordionDetails>
                                              </Accordion>
                                          );
                                      })
                                    : null}
                            </div>
                        </TabPanel>
                    ) : null}
                </Box>
            </DialogContent>
            <DialogActions>
                {currentScope && currentName ? (
                    <Button
                        variant="contained"
                        autoFocus={Object.keys(messages[currentScope]).length !== 1}
                        disabled={disabled.includes(currentName)}
                        style={disabled.includes(currentName) ? { backgroundColor: 'silver' } : undefined}
                        sx={styles.buttonStyle}
                        onClick={() => {
                            ackCallback(messages[currentScope][currentName].host, currentName);
                            setDisabled([...disabled, currentName]);
                        }}
                        color={Object.keys(messages[currentScope]).length !== 1 ? 'primary' : 'grey'}
                        startIcon={<CheckIcon />}
                    >
                        {I18n.t('Acknowledge')}
                    </Button>
                ) : null}
                {currentScope && currentName && Object.keys(messages[currentScope]).length === 1 && (
                    <Button
                        variant="contained"
                        disabled={disabled.includes(currentName)}
                        sx={styles.buttonStyle}
                        style={disabled.includes(currentName) ? { backgroundColor: 'silver' } : undefined}
                        onClick={() => {
                            setDisabled([...disabled, currentName]);
                            ackCallback(messages[currentScope][currentName].host, currentName);
                            onClose();
                        }}
                        startIcon={
                            <>
                                <CheckIcon />
                                <CloseIcon />
                            </>
                        }
                        color="primary"
                    >
                        {I18n.t('Acknowledge & close')}
                    </Button>
                )}
                <div style={{ flexGrow: 1 }} />
                <Button
                    id="notifications-dialog-close"
                    variant="contained"
                    onClick={() => onClose()}
                    startIcon={<CloseIcon />}
                    color="grey"
                >
                    {I18n.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NotificationsDialog;
