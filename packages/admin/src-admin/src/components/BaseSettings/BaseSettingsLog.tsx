import React, { createRef, Component, type JSX } from 'react';

import {
    Grid,
    InputLabel,
    FormControlLabel,
    Checkbox,
    Select,
    TextField,
    FormHelperText,
    Button,
    MenuItem,
    Toolbar,
    FormControl,
    Paper,
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Typography,
    Fab,
} from '@mui/material';

// Icons
import {
    ExpandMore as ExpandMoreIcon,
    Add as IconPlus,
    Delete as IconDelete,
    Language as IconHttp,
    InsertDriveFile as IconFile,
    Computer as IconSyslog,
    Send as IconStream,
} from '@mui/icons-material';
import { withWidth, type IobTheme, type Translate } from '@iobroker/adapter-react-v5';
import IconSeq from '../../assets/seq.png';

const styles: Record<string, any> = {
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        padding: 8,
    },
    gridSettings: (theme: IobTheme) => ({
        height: `calc(100% - ${theme.mixins.toolbar.minHeight}px)`,
        width: '100%',
        overflow: 'auto',
    }),
    controlItem: {
        width: 400,
        marginBottom: 16,
        marginRight: 8,
        marginLeft: 8,
    },
    delButton: {
        position: 'absolute',
        top: 2,
        right: 48,
    },
    addButton: {
        marginRight: 8,
    },
    buttonIcon: {
        height: 24,
    },
    headingIcon: {
        height: 24,
        marginRight: 8,
    },
};

interface TransportSettings {
    type: string;
    enabled: boolean;
    level?: string;
    host?: string;
    port?: number | string;
    protocol?: string;
    path?: string;
    facility?: string;
    localhost?: string;
    sysLogType?: string;
    app_name?: string;
    eol?: string;
    filename?: string;
    fileext?: string;
    maxSize?: number | string;
    maxFiles?: number | string;
    stream?: string;
    silent?: boolean;
    serverUrl?: string;
    apiKey?: string;
    auth?: string;
    ssl?: boolean;
}

export interface SettingsLog {
    transport?: Record<string, TransportSettings>;
    level?: string;
    maxDays?: number;
    noStdout?: boolean;
}

interface BaseSettingsLogProps {
    t: Translate;
    onChange: (settings: SettingsLog) => void;
    settings: SettingsLog;
}

interface BaseSettingsLogState {
    level: string;
    maxDays: number | string;
    noStdout: boolean;
    transport: Record<string, TransportSettings>;
    expanded: string[];
}

class BaseSettingsLog extends Component<BaseSettingsLogProps, BaseSettingsLogState> {
    private focusRef: React.RefObject<HTMLInputElement>;

    constructor(props: BaseSettingsLogProps) {
        super(props);

        const settings: SettingsLog = this.props.settings || {};
        settings.transport ||= {};
        Object.keys(settings.transport).forEach(id => {
            if (settings.transport[id].type === 'file') {
                const maxSize = settings.transport[id].maxSize;
                const multiplier =
                    typeof maxSize === 'string' ? (maxSize.includes('k') ? 0.1 : maxSize.includes('g') ? 10 : 1) : 1;
                settings.transport[id].maxSize =
                    (parseInt(settings.transport[id].maxSize as string, 10) || 0) * multiplier;
                settings.transport[id].level = settings.transport[id].level || '';
                settings.transport[id].maxFiles = settings.transport[id].maxFiles || 0;
            } else if (settings.transport[id].type === 'syslog') {
                settings.transport[id].level = settings.transport[id].level || '';
                settings.transport[id].host = settings.transport[id].host || '';
                settings.transport[id].port = settings.transport[id].port || 0;
                settings.transport[id].path = settings.transport[id].path || '';
                settings.transport[id].facility = settings.transport[id].facility || '';
                settings.transport[id].sysLogType = settings.transport[id].sysLogType || '';
                settings.transport[id].app_name = settings.transport[id].app_name || '';
                settings.transport[id].eol = settings.transport[id].eol || '';
            } else if (settings.transport[id].type === 'http') {
                settings.transport[id].level = settings.transport[id].level || '';
                settings.transport[id].host = settings.transport[id].host || '';
                settings.transport[id].port = settings.transport[id].port || 0;
                settings.transport[id].path = settings.transport[id].path || '/';
                settings.transport[id].auth = settings.transport[id].auth || 'None';
                settings.transport[id].ssl = settings.transport[id].ssl || false;
            } else if (settings.transport[id].type === 'stream') {
                settings.transport[id].stream = settings.transport[id].stream || '';
                settings.transport[id].level = settings.transport[id].level || '';
                settings.transport[id].silent = settings.transport[id].silent || false;
                settings.transport[id].eol = settings.transport[id].eol || '';
            } else if (settings.transport[id].type === 'seq') {
                settings.transport[id].level = settings.transport[id].level || '';
                settings.transport[id].serverUrl = settings.transport[id].serverUrl || '';
                settings.transport[id].apiKey = settings.transport[id].apiKey || '';
                settings.transport[id].eol = settings.transport[id].eol || '';
            }
        });

        this.state = {
            level: settings.level || 'info',
            maxDays: settings.maxDays || 7,
            noStdout: settings.noStdout || true,
            transport: settings.transport || {},
            expanded: [],
        };

        this.focusRef = createRef();
    }

    componentDidMount(): void {
        this.focusRef.current?.focus();
    }

    onChange(): void {
        const settings: SettingsLog = {
            level: this.state.level,
            maxDays: parseInt(this.state.maxDays as string, 10),
            noStdout: this.state.noStdout,
            transport: {},
        };

        Object.keys(this.state.transport).forEach(id => {
            settings.transport[id] = JSON.parse(JSON.stringify(this.state.transport[id])) as TransportSettings;

            if (this.state.transport[id].type === 'file') {
                settings.transport[id].maxSize = parseInt(settings.transport[id].maxSize as string, 10) || null;
                if (settings.transport[id].maxSize) {
                    // 'k', 'm', or 'g'
                    settings.transport[id].maxSize = `${settings.transport[id].maxSize.toString()}m`;
                }
                settings.transport[id].maxFiles = parseInt(settings.transport[id].maxFiles as string, 10) || null;
            } else if (this.state.transport[id].type === 'syslog') {
                if (!settings.transport[id].port) {
                    delete settings.transport[id].port;
                }
                if (!settings.transport[id].path) {
                    delete settings.transport[id].path;
                }
                if (!settings.transport[id].sysLogType) {
                    delete settings.transport[id].sysLogType;
                }
                if (!settings.transport[id].app_name) {
                    delete settings.transport[id].app_name;
                }
                if (!settings.transport[id].eol) {
                    delete settings.transport[id].eol;
                }
            } else if (this.state.transport[id].type === 'http') {
                settings.transport[id].host = settings.transport[id].host || '';
                settings.transport[id].port = parseInt(settings.transport[id].port as string, 10) || 80;
                settings.transport[id].path = settings.transport[id].path || '/';
                settings.transport[id].auth = settings.transport[id].auth || '';
                settings.transport[id].ssl = settings.transport[id].ssl || false;
            } else if (this.state.transport[id].type === 'stream') {
                settings.transport[id].stream = settings.transport[id].stream || '';
                settings.transport[id].level = settings.transport[id].level || 'info';
                settings.transport[id].silent = settings.transport[id].silent || false;
                settings.transport[id].eol = settings.transport[id].eol || '';
            }
        });

        this.props.onChange(settings);
    }

    onDelete(id: string): void {
        const transport = JSON.parse(JSON.stringify(this.state.transport));
        delete transport[id];
        this.setState({ transport }, () => this.onChange());
    }

    renderEnabled(name: string): JSX.Element {
        return (
            <Grid>
                <FormControlLabel
                    style={styles.controlItem}
                    control={
                        <Checkbox
                            checked={this.state.transport[name].enabled}
                            onChange={e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].enabled = e.target.checked;
                                this.setState({ transport }, () => this.onChange());
                            }}
                        />
                    }
                    label={this.props.t('Enabled')}
                />
            </Grid>
        );
    }

    renderLogLevel(name: string): JSX.Element | null {
        return this.state.transport[name].enabled ? (
            <Grid>
                <FormControl
                    style={styles.controlItem}
                    variant="standard"
                >
                    <InputLabel>{this.props.t('Level')}</InputLabel>
                    <Select
                        variant="standard"
                        value={this.state.transport[name].level || '_'}
                        renderValue={() => this.state.transport[name].level || this.props.t('default')}
                        onChange={e => {
                            const transport = JSON.parse(JSON.stringify(this.state.transport));
                            transport[name].level = e.target.value === '_' ? '' : e.target.value;
                            this.setState({ transport }, () => this.onChange());
                        }}
                    >
                        <MenuItem value="_">{this.props.t('default')}</MenuItem>
                        <MenuItem value="silly">silly</MenuItem>
                        <MenuItem value="debug">debug</MenuItem>
                        <MenuItem value="info">info</MenuItem>
                        <MenuItem value="warn">warn</MenuItem>
                        <MenuItem value="error">error</MenuItem>
                    </Select>
                    <FormHelperText>
                        {this.props.t(
                            'Level of messages that this transport should log (default: level set on parent logger)',
                        )}
                    </FormHelperText>
                </FormControl>
            </Grid>
        ) : null;
    }

    renderSyslog(name: string): JSX.Element {
        return (
            <Accordion
                key={name}
                expanded={this.state.expanded.includes(name)}
                onChange={() => {
                    const expanded = [...this.state.expanded];
                    const pos = expanded.indexOf(name);
                    if (pos === -1) {
                        expanded.push(name);
                    } else {
                        expanded.splice(pos, 1);
                    }

                    this.setState({ expanded });
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    style={{ position: 'relative', background: 'rgba(128, 128, 128, 0.3)' }}
                >
                    <IconSyslog style={styles.headingIcon} />
                    <Typography style={styles.heading}>{name}</Typography>
                    <Fab
                        size="small"
                        style={styles.delButton}
                        onClick={() => this.onDelete(name)}
                    >
                        <IconDelete />
                    </Fab>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid
                        container
                        direction="column"
                    >
                        {this.renderEnabled(name)}
                        {this.renderLogLevel(name)}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].host}
                                    helperText={this.props.t('The host running syslogd, defaults to localhost')}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].host = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('File name')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].port}
                                    type="number"
                                    helperText={this.props.t(
                                        "The port on the host that syslog is running on, defaults to syslogd's default port(514/UDP).",
                                    )}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].port = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('Port')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <FormControl
                                    style={styles.controlItem}
                                    variant="standard"
                                >
                                    <InputLabel>{this.props.t('Protocol')}</InputLabel>
                                    <Select
                                        variant="standard"
                                        value={this.state.transport[name].protocol}
                                        onChange={e => {
                                            const transport = JSON.parse(JSON.stringify(this.state.transport));
                                            transport[name].protocol = e.target.value;
                                            this.setState({ transport }, () => this.onChange());
                                        }}
                                    >
                                        <MenuItem value="udp4">udp4</MenuItem>
                                        <MenuItem value="tcp4">tcp4</MenuItem>
                                        <MenuItem value="unix">unix</MenuItem>
                                        <MenuItem value="unix-connect">unix-connect</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].path}
                                    helperText={this.props.t(
                                        'The path to the syslog dgram socket (i.e. /dev/log or /var/run/syslog for OS X).',
                                    )}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].path = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('Path')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].facility}
                                    helperText={this.props.t('Syslog facility to use (Default: local0).')}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].facility = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('Facility')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].localhost}
                                    helperText={this.props.t(
                                        'Host to indicate that log messages are coming from (Default: localhost).',
                                    )}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].localhost = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('Log name')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].sysLogType}
                                    helperText={this.props.t('The type of the syslog protocol to use (Default: BSD).')}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].sysLogType = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('SysLog Type')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].app_name}
                                    helperText={this.props.t('The name of the application (Default: process.title).')}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].app_name = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('Application name')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].eol}
                                    helperText={this.props.t(
                                        'The end of line character to be added to the end of the message (Default: Message without modifications).',
                                    )}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].eol = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('End of line char')}
                                />
                            </Grid>
                        ) : null}
                    </Grid>
                </AccordionDetails>
            </Accordion>
        );
    }

    renderFile(name: string): JSX.Element {
        return (
            <Accordion
                key={name}
                expanded={this.state.expanded.includes(name)}
                onChange={() => {
                    const expanded = [...this.state.expanded];
                    const pos = expanded.indexOf(name);
                    if (pos === -1) {
                        expanded.push(name);
                    } else {
                        expanded.splice(pos, 1);
                    }

                    this.setState({ expanded });
                }}
            >
                <AccordionSummary
                    style={{ background: 'rgba(128, 128, 128, 0.3)' }}
                    expandIcon={<ExpandMoreIcon />}
                >
                    <IconFile style={styles.headingIcon} />
                    <Typography style={styles.heading}>{name}</Typography>
                    <Fab
                        size="small"
                        style={styles.delButton}
                        onClick={() => this.onDelete(name)}
                    >
                        <IconDelete />
                    </Fab>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid
                        container
                        direction="column"
                    >
                        {this.renderEnabled(name)}
                        {this.renderLogLevel(name)}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].filename}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].filename = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('File name')}
                                />
                            </Grid>
                        ) : null}

                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].fileext}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].fileext = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('File extension')}
                                />
                            </Grid>
                        ) : null}

                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].maxSize}
                                    type="number"
                                    helperText={this.props.t('MB')}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].maxSize = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('Maximal size of one file')}
                                />
                            </Grid>
                        ) : null}

                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].maxFiles}
                                    type="number"
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].maxFiles = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('Maximal number of files')}
                                />
                            </Grid>
                        ) : null}
                    </Grid>
                </AccordionDetails>
            </Accordion>
        );
    }

    renderHttp(name: string): JSX.Element {
        return (
            <Accordion
                key={name}
                expanded={this.state.expanded.includes(name)}
                onChange={() => {
                    const expanded = [...this.state.expanded];
                    const pos = expanded.indexOf(name);
                    if (pos === -1) {
                        expanded.push(name);
                    } else {
                        expanded.splice(pos, 1);
                    }

                    this.setState({ expanded });
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    style={{ position: 'relative', background: 'rgba(128, 128, 128, 0.3)' }}
                >
                    <IconHttp style={styles.headingIcon} />
                    <Typography style={styles.heading}>{name}</Typography>
                    <Fab
                        size="small"
                        style={styles.delButton}
                        onClick={() => this.onDelete(name)}
                    >
                        <IconDelete />
                    </Fab>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid
                        container
                        direction="column"
                    >
                        {this.renderEnabled(name)}
                        {this.renderLogLevel(name)}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].host}
                                    helperText={this.props.t('Remote host of the HTTP logging endpoint')}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].host = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('Host')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].port}
                                    type="number"
                                    helperText={this.props.t('Remote port of the HTTP logging endpoint')}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].port = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('Port')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].path}
                                    helperText={this.props.t('Remote URI of the HTTP logging endpoint')}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].path = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('Path')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].auth}
                                    helperText={this.props.t(
                                        'An object representing the username and password for HTTP Basic Auth',
                                    )}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].auth = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('Auth')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <FormControlLabel
                                    style={styles.controlItem}
                                    control={
                                        <Checkbox
                                            checked={this.state.transport[name].ssl}
                                            onChange={e => {
                                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                                transport[name].ssl = e.target.checked;
                                                this.setState({ transport }, () => this.onChange());
                                            }}
                                        />
                                    }
                                    label={this.props.t('SSL')}
                                />
                            </Grid>
                        ) : null}
                    </Grid>
                </AccordionDetails>
            </Accordion>
        );
    }

    renderStream(name: string): JSX.Element {
        return (
            <Accordion
                key={name}
                expanded={this.state.expanded.includes(name)}
                onChange={() => {
                    const expanded = [...this.state.expanded];
                    const pos = expanded.indexOf(name);
                    if (pos === -1) {
                        expanded.push(name);
                    } else {
                        expanded.splice(pos, 1);
                    }

                    this.setState({ expanded });
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    style={{ position: 'relative', background: 'rgba(128, 128, 128, 0.3)' }}
                >
                    <IconStream style={styles.headingIcon} />
                    <Typography style={styles.heading}>{name}</Typography>
                    <Fab
                        size="small"
                        style={styles.delButton}
                        onClick={() => this.onDelete(name)}
                    >
                        <IconDelete />
                    </Fab>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid
                        container
                        direction="column"
                    >
                        {this.renderEnabled(name)}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].stream}
                                    helperText={this.props.t(
                                        'any Node.js stream. If an objectMode stream is provided then the entire info object will be written. Otherwise info[MESSAGE] will be written',
                                    )}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].stream = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('File name')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <FormControlLabel
                                    style={styles.controlItem}
                                    control={
                                        <Checkbox
                                            checked={this.state.transport[name].silent}
                                            onChange={e => {
                                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                                transport[name].silent = e.target.checked;
                                                this.setState({ transport }, () => this.onChange());
                                            }}
                                        />
                                    }
                                    label={this.props.t('Silent')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].eol}
                                    helperText={this.props.t('Line-ending character to use. (default: os.EOL).)')}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].eol = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('EOL')}
                                />
                            </Grid>
                        ) : null}
                    </Grid>
                </AccordionDetails>
            </Accordion>
        );
    }

    renderSEQ(name: string): JSX.Element {
        return (
            <Accordion
                key={name}
                expanded={this.state.expanded.includes(name)}
                onChange={() => {
                    const expanded = [...this.state.expanded];
                    const pos = expanded.indexOf(name);
                    if (pos === -1) {
                        expanded.push(name);
                    } else {
                        expanded.splice(pos, 1);
                    }

                    this.setState({ expanded });
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    style={{ position: 'relative', background: 'rgba(128, 128, 128, 0.3)' }}
                >
                    <img
                        style={styles.headingIcon}
                        src={IconSeq}
                        alt="seq"
                    />
                    <Typography style={styles.heading}>{name}</Typography>
                    <Fab
                        size="small"
                        style={styles.delButton}
                        onClick={() => this.onDelete(name)}
                    >
                        <IconDelete />
                    </Fab>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid
                        container
                        direction="column"
                    >
                        {this.renderEnabled(name)}
                        {this.renderLogLevel(name)}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].serverUrl}
                                    helperText={this.props.t(
                                        'The http(s) URL including port of the seq server. If you use HTTPS a real certificate is needed; self signed certs are ot accepted.',
                                    )}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].serverUrl = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('Server URL')}
                                />
                            </Grid>
                        ) : null}
                        {this.state.transport[name].enabled ? (
                            <Grid>
                                <TextField
                                    variant="standard"
                                    style={styles.controlItem}
                                    value={this.state.transport[name].apiKey}
                                    helperText={this.props.t('The apiKey of the seq system')}
                                    onChange={e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].apiKey = e.target.value;
                                        this.setState({ transport }, () => this.onChange());
                                    }}
                                    label={this.props.t('API key')}
                                />
                            </Grid>
                        ) : null}
                    </Grid>
                </AccordionDetails>
            </Accordion>
        );
    }

    findFreeName(type: string): string {
        for (let i = 1; ; i++) {
            if (!Object.keys(this.state.transport).find(id => id === type + i)) {
                return type + i;
            }
        }
    }

    add(type: string): void {
        if (type === 'file') {
            const name = this.findFreeName(type);
            const transport = JSON.parse(JSON.stringify(this.state.transport));
            transport[name] = {
                type,
                enabled: true,
                filename: 'log/iobroker',
                fileext: '.log',
                maxSize: 0,
                maxFiles: 0,
            };
            this.setState({ transport }, () => this.onChange());
        } else if (type === 'syslog') {
            const name = this.findFreeName(type);
            const transport = JSON.parse(JSON.stringify(this.state.transport));
            transport[name] = {
                type,
                enabled: true,

                host: '127.0.0.1',
                port: 0,
                protocol: 'udp4',
                path: '',
                facility: '',
                localhost: 'iobroker',
                sysLogType: '',
                app_name: '',
                eol: '',
            };
            this.setState({ transport }, () => this.onChange());
        } else if (type === 'http') {
            const name = this.findFreeName(type);
            const transport = JSON.parse(JSON.stringify(this.state.transport));
            transport[name] = {
                type,
                enabled: true,

                host: '127.0.0.1',
                port: 80,
                path: '/',
                auth: 'None',
                ssl: false,
            };
            this.setState({ transport }, () => this.onChange());
        } else if (type === 'stream') {
            const name = this.findFreeName(type);
            const transport = JSON.parse(JSON.stringify(this.state.transport));
            transport[name] = {
                type,
                enabled: true,

                stream: '/dev/null',
                level: 'info',
                silent: false,
                eol: '',
            };
            this.setState({ transport }, () => this.onChange());
        } else if (type === 'seq') {
            const name = this.findFreeName(type);
            const transport = JSON.parse(JSON.stringify(this.state.transport));
            transport[name] = {
                type,
                enabled: true,

                level: 'info',
                serverUrl: 'http://IP:PORT',
                apiKey: '',
            };
            this.setState({ transport }, () => this.onChange());
        }
    }

    render(): JSX.Element {
        return (
            <Paper style={styles.paper}>
                <Grid sx={styles.gridSettings}>
                    <Grid
                        container
                        direction="column"
                    >
                        <Grid>
                            <FormControl
                                style={styles.controlItem}
                                variant="standard"
                            >
                                <InputLabel>{this.props.t('Level')}</InputLabel>
                                <Select
                                    variant="standard"
                                    value={this.state.level}
                                    onChange={e => this.setState({ level: e.target.value }, () => this.onChange())}
                                >
                                    <MenuItem value="silly">silly</MenuItem>
                                    <MenuItem value="debug">debug</MenuItem>
                                    <MenuItem value="info">info</MenuItem>
                                    <MenuItem value="warn">warn</MenuItem>
                                    <MenuItem value="error">error</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid>
                            <TextField
                                variant="standard"
                                style={styles.controlItem}
                                value={this.state.maxDays}
                                helperText={this.props.t('Every day one file')}
                                type="number"
                                onChange={e => this.setState({ maxDays: e.target.value }, () => this.onChange())}
                                label={this.props.t('Maximum number of days')}
                            />
                        </Grid>
                        <Grid>
                            <FormControlLabel
                                style={styles.controlItem}
                                control={
                                    <Checkbox
                                        checked={this.state.noStdout}
                                        onChange={e =>
                                            this.setState({ noStdout: e.target.checked }, () => this.onChange())
                                        }
                                    />
                                }
                                label={this.props.t('No stdout outputs')}
                            />
                        </Grid>
                        {Object.keys(this.state.transport).map(id => {
                            switch (this.state.transport[id].type) {
                                case 'syslog':
                                    return this.renderSyslog(id);

                                case 'file':
                                    return this.renderFile(id);

                                case 'http':
                                    return this.renderHttp(id);

                                case 'stream':
                                    return this.renderStream(id);

                                case 'seq':
                                    return this.renderSEQ(id);

                                default:
                                    return null;
                            }
                        })}
                    </Grid>
                </Grid>
                <Toolbar>
                    <Button
                        color="grey"
                        style={styles.addButton}
                        variant="contained"
                        onClick={() => this.add('file')}
                        startIcon={<IconPlus />}
                    >
                        <IconFile style={styles.buttonIcon} />
                        {this.props.t('File log')}
                    </Button>
                    <Button
                        color="grey"
                        style={styles.addButton}
                        variant="contained"
                        onClick={() => this.add('syslog')}
                        startIcon={<IconPlus />}
                    >
                        <IconSyslog style={styles.buttonIcon} />
                        {this.props.t('Syslog')}
                    </Button>
                    <Button
                        color="grey"
                        style={styles.addButton}
                        variant="contained"
                        onClick={() => this.add('http')}
                        startIcon={<IconPlus />}
                    >
                        <IconHttp style={styles.buttonIcon} />
                        {this.props.t('HTTP log')}
                    </Button>
                    <Button
                        color="grey"
                        style={styles.addButton}
                        variant="contained"
                        onClick={() => this.add('stream')}
                        startIcon={<IconPlus />}
                    >
                        <IconStream style={styles.buttonIcon} />
                        {this.props.t('Stream log')}
                    </Button>
                    <Button
                        color="grey"
                        style={styles.addButton}
                        variant="contained"
                        onClick={() => this.add('seq')}
                        startIcon={<IconPlus />}
                    >
                        <img
                            src={IconSeq}
                            style={styles.buttonIcon}
                            alt="seq"
                        />
                        {this.props.t('SEQ log')}
                    </Button>
                </Toolbar>
            </Paper>
        );
    }
}

export default withWidth()(BaseSettingsLog);
