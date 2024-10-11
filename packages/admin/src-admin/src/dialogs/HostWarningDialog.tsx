import React, { useState, type JSX } from 'react';

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
} from '@mui/material';

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

import { I18n, Utils, type ThemeType, type IobTheme } from '@iobroker/react-components';

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
            marginLeft: 0,
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
        margin: 8,
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
        margin: '3px',
        '@media screen and (max-width: 550px)': {
            fontSize: '2.9vw',
        },
    },
};

/** Possible message severities */
type Severity = 'notify' | 'info' | 'alert';

interface StatusOptions {
    /** Id of the message */
    name: string;
    /** Severity of the message */
    severity?: Severity;
}

const Status = ({ name, severity, ...props }: StatusOptions): JSX.Element => {
    switch (name) {
        case 'restartLoop':
            return (
                <UpdateIcon
                    style={{ color: '#ffca00' }}
                    {...props}
                />
            );
        case 'memIssues':
            return (
                <MemoryIcon
                    style={{ color: '#ffca00' }}
                    {...props}
                />
            );
        case 'fsIoErrors':
            return (
                <ImportExportIcon
                    style={{ color: '#ffca00' }}
                    {...props}
                />
            );
        case 'noDiskSpace':
            return (
                <PermDeviceInformationIcon
                    style={{ color: '#ffca00' }}
                    {...props}
                />
            );
        case 'accessErrors':
            return (
                <CancelPresentationIcon
                    style={{ color: '#ffca00' }}
                    {...props}
                />
            );
        case 'nonExistingFileErrors':
            return (
                <CancelIcon
                    style={{ color: '#ffca00' }}
                    {...props}
                />
            );
        case 'remoteHostErrors':
            return (
                <SettingsRemoteIcon
                    style={{ color: '#ffca00' }}
                    {...props}
                />
            );
        case 'heading':
            return (
                <BellIcon
                    sx={{
                        fontSize: 36,
                        marginLeft: 4,
                        marginRight: 2,
                    }}
                    {...props}
                />
            );

        default:
            if (severity === 'notify') {
                return (
                    <BellIcon
                        color="primary"
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
};

function a11yProps(index: number): { id: string; 'aria-controls': string } {
    return {
        id: `scrollable-force-tab-${index}`,
        'aria-controls': `scrollable-force-tabpanel-${index}`,
    };
}

interface TabPanelOptions {
    value: number;
    index: number;
    styleDiv: React.CSSProperties;
    sxBox: Record<string, any>;
    children: JSX.Element;
}

const TabPanel = ({ children, value, index, styleDiv, sxBox, ...other }: TabPanelOptions): JSX.Element => (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`scrollable-force-tabpanel-${index}`}
        aria-labelledby={`scrollable-force-tab-${index}`}
        style={styleDiv}
        {...other}
    >
        {value === index && (
            <Box style={sxBox}>
                <Typography component="div">{children}</Typography>
            </Box>
        )}
    </div>
);

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
    messages,
    onClose,
    ackCallback,
    dateFormat,
    themeType,
    instances,
}: HostWarningDialogOptions): JSX.Element => {
    const [value, setValue] = useState(0);
    const [disabled, setDisabled] = useState<string[]>([]);
    const [expanded, setExpanded] = useState('');
    const [autoCollapse, setAutoCollapse] = useState(true);

    const handleChange = (event: unknown, newValue: number): void => {
        setAutoCollapse(true);
        setValue(newValue);
        setExpanded('');
    };

    const handleChangeAccordion =
        (panel: string) =>
        (_event: unknown, isExpanded: boolean): void =>
            setExpanded(isExpanded ? panel : '');

    const dark = themeType === 'dark';

    return (
        <Dialog
            onClose={() => onClose()}
            open={!0}
            sx={{ '& .MuiDialog-paper': styles.paper }}
        >
            <h2 style={styles.headingTop}>
                <Status name="heading" />
                {I18n.t('Host-specific notifications')}
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
                            value={value}
                            onChange={handleChange}
                            variant="scrollable"
                            scrollButtons
                            indicatorColor={dark ? 'primary' : 'secondary'}
                            textColor="primary"
                        >
                            {Object.entries(messages).map(([name, entry], idx) => (
                                <Tab
                                    style={dark ? { color: 'white' } : { color: 'black' }}
                                    disabled={disabled.includes(name)}
                                    key={name}
                                    label={entry.name[I18n.getLanguage()]}
                                    icon={
                                        <Status
                                            name={name}
                                            severity={entry.severity}
                                        />
                                    }
                                    {...a11yProps(idx)}
                                />
                            ))}
                        </Tabs>
                    </AppBar>
                    {Object.keys(messages).map((name, idx) => (
                        <TabPanel
                            sxBox={styles.classNameBox}
                            key={`tabPanel-${name}`}
                            styleDiv={{ ...styles.overflowAuto, color: dark ? 'black' : undefined }}
                            value={value}
                            index={idx}
                        >
                            <div>
                                <Box
                                    component="div"
                                    sx={styles.headerText}
                                    style={{ fontWeight: 'bold' }}
                                >
                                    {messages[name].name[I18n.getLanguage()]}
                                </Box>
                                <Box
                                    component="div"
                                    sx={styles.descriptionHeaderText}
                                >
                                    {messages[name].description[I18n.getLanguage()]}
                                </Box>
                                <div>
                                    {messages[name].instances
                                        ? Object.keys(messages[name].instances).map(nameInst => {
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
                                              return (
                                                  <Accordion
                                                      style={dark ? undefined : { background: '#c0c0c052' }}
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
                                                          {messages[name].instances[nameInst].messages.map(msg => (
                                                              <Typography
                                                                  key={msg.ts}
                                                                  component="div"
                                                                  sx={styles.message}
                                                              >
                                                                  <Box
                                                                      component="div"
                                                                      sx={styles.terminal}
                                                                  >
                                                                      {Utils.renderTextWithA(msg.message)}
                                                                  </Box>
                                                                  <Box
                                                                      component="div"
                                                                      sx={styles.silver}
                                                                  >
                                                                      {Utils.formatDate(new Date(msg.ts), dateFormat)}
                                                                  </Box>
                                                              </Typography>
                                                          ))}
                                                      </AccordionDetails>
                                                  </Accordion>
                                              );
                                          })
                                        : null}
                                </div>
                                <div style={styles.button}>
                                    <Button
                                        variant="contained"
                                        autoFocus={Object.keys(messages).length !== 1}
                                        disabled={disabled.includes(name)}
                                        style={disabled.includes(name) ? { background: 'silver' } : undefined}
                                        sx={styles.buttonStyle}
                                        onClick={() => {
                                            ackCallback(name);
                                            setDisabled([...disabled, name]);
                                        }}
                                        color={Object.keys(messages).length !== 1 ? 'primary' : 'grey'}
                                        startIcon={<CheckIcon />}
                                    >
                                        {I18n.t('Acknowledge')}
                                    </Button>
                                    {Object.keys(messages).length === 1 && (
                                        <Button
                                            variant="contained"
                                            disabled={disabled.includes(name)}
                                            sx={styles.buttonStyle}
                                            style={disabled.includes(name) ? { background: 'silver' } : undefined}
                                            onClick={() => {
                                                setDisabled([...disabled, name]);
                                                ackCallback(name);
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
                                </div>
                            </div>
                        </TabPanel>
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    id="host-warning-dialog-ok"
                    variant="contained"
                    onClick={() => onClose()}
                    startIcon={<CloseIcon />}
                    color="grey"
                >
                    {I18n.t('Ok')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default HostWarningDialog;
