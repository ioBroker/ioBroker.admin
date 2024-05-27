import React, { createRef, Component } from 'react';
import { type Styles, withStyles } from '@mui/styles';

import {
    Grid,
    InputLabel,
    FormControlLabel,
    Checkbox,
    Select,
    Tooltip,
    TextField,
    FormGroup,
    MenuItem,
    FormHelperText,
    FormControl,
    Paper,
    Switch,
    LinearProgress,
    type Theme,
} from '@mui/material';

import { Utils, withWidth, Confirm as DialogConfirm } from '@iobroker/adapter-react-v5';
import { type AdminConnection } from '@iobroker/socket-client';

const styles: Styles<any, any> = (theme: Theme) => ({
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'auto',
        padding: theme.spacing(1),
    },
    controlItem: {
        width: 400,
        marginBottom: theme.spacing(2),
        marginRight: theme.spacing(1),
        marginLeft: theme.spacing(1),
    },
    dangerZone: {
        backgroundColor: 'rgba(255, 165, 0, 0.05)',
        border: '2px solid rgba(255, 165, 0)',
        marginBottom: theme.spacing(1),
    },
    dangerZoneHeader: {
        background: 'rgba(255, 165, 0)',
        color: '#FFF',
        paddingLeft: theme.spacing(2),
        paddingTop: 4,
        paddingBottom: 4,
        marginTop: -1,
        marginLeft: -1,
    },
    warning: {
        padding: 8,
        fontSize: 14,
        color: theme.palette.mode === 'dark' ? '#ffa500' : '#b17200',
    },
});

const DEFAULT_JSONL_OPTIONS = {
    autoCompress: {
        sizeFactor: 2,
        sizeFactorMinimumSize: 25000,
    },
    throttleFS: {
        intervalMs: 60000,
        maxBufferedCommands: 1000,
    },
};

export interface SettingsObjects {
    type?: 'file' | 'jsonl' | 'redis';
    host?: string;
    port?: number;
    pass?: string;
    connectTimeout?: number;
    writeFileInterval?: number;
    dataDir?: string;
    options?: {
        auth_pass: string;
        retry_max_delay: number;
        retry_max_count: number;
        db: number;
        family: number;
    };
    backup?: {
        disabled: boolean;
        files: number;
        hours: number;
        period: number;
        path: string;
    };
    jsonlOptions?: {
        autoCompress: {
            sizeFactor: number;
            sizeFactorMinimumSize: number;
        };
        throttleFS: {
            intervalMs: number;
            maxBufferedCommands: number;
        };
    };
    noFileCache?: boolean;
}

interface BaseSettingsObjectsProps {
    t: (text: string) => string;
    onChange: (settings: SettingsObjects) => void;
    settings: SettingsObjects;
    currentHost: string;
    socket: AdminConnection;
    classes: Record<string, string>;
}

interface BaseSettingsObjectsState {
    type: 'file' | 'jsonl' | 'redis';
    host: string;
    port: number | string;
    connectTimeout: number | string;
    writeFileInterval: number | string;
    dataDir: string;
    options_auth_pass: string;
    options_retry_max_delay: number | string;
    options_retry_max_count: number | string;
    options_db: number | string;
    options_family: number | string;
    backup_disabled: boolean;
    backup_files: number | string;
    backup_hours: number | string;
    backup_period: number | string;
    backup_path: string;
    jsonlOptions_autoCompress_sizeFactor: number | string;
    jsonlOptions_autoCompress_sizeFactorMinimumSize: number | string;
    jsonlOptions_throttleFS_intervalMs: number | string;
    jsonlOptions_throttleFS_maxBufferedCommands: number | string;
    textIP: boolean;
    IPs: string[];
    loading: boolean;
    showWarningDialog: boolean;
    toConfirmType: '' | 'file' | 'jsonl' | 'redis';
    originalDBType: 'file' | 'jsonl' | 'redis';
    noFileCache: boolean;
}

class BaseSettingsObjects extends Component<BaseSettingsObjectsProps, BaseSettingsObjectsState> {
    private focusRef: React.RefObject<HTMLInputElement>;

    constructor(props: BaseSettingsObjectsProps) {
        super(props);

        const settings: SettingsObjects   = this.props.settings || {};
        settings.options = settings.options || {
            auth_pass: '',
            retry_max_delay: 2000,
            retry_max_count: 19,
            db: 0,
            family: 0,
        };
        settings.backup  = settings.backup || {
            disabled: false,
            files: 24,
            hours: 48,
            period: 120,
            path: '',
        };
        settings.jsonlOptions = settings.jsonlOptions || DEFAULT_JSONL_OPTIONS;
        settings.jsonlOptions.autoCompress = settings.jsonlOptions.autoCompress || DEFAULT_JSONL_OPTIONS.autoCompress;
        settings.jsonlOptions.throttleFS = settings.jsonlOptions.throttleFS || DEFAULT_JSONL_OPTIONS.throttleFS;

        this.state = {
            type:                    settings.type                    || 'file',
            host:                    Array.isArray(settings.host) ? settings.host.join(',') : (settings.host || '127.0.0.1'),
            port:                    settings.port                    || 9001,
            noFileCache:             settings.noFileCache             || false,
            dataDir:                 settings.dataDir                 || '',
            connectTimeout:          settings.connectTimeout          || 2000,
            writeFileInterval:       settings.writeFileInterval       || 5000,
            options_auth_pass:       settings.options.auth_pass       || settings.pass || '',
            options_retry_max_delay: settings.options.retry_max_delay || 2000,
            options_retry_max_count: settings.options.retry_max_count || 19,
            options_db:              settings.options.db              || 0,
            options_family:          settings.options.family          || 0,
            backup_disabled:         settings.backup.disabled         || false,
            backup_files:            settings.backup.files            || 24,
            backup_hours:            settings.backup.hours            || 48,
            backup_period:           settings.backup.period           || 120,
            backup_path:             settings.backup.path             || '',
            jsonlOptions_autoCompress_sizeFactor: settings.jsonlOptions.autoCompress.sizeFactor || 2,
            jsonlOptions_autoCompress_sizeFactorMinimumSize: settings.jsonlOptions.autoCompress.sizeFactorMinimumSize || 25000,
            jsonlOptions_throttleFS_intervalMs: settings.jsonlOptions.throttleFS.intervalMs || 60000,
            jsonlOptions_throttleFS_maxBufferedCommands: settings.jsonlOptions.throttleFS.maxBufferedCommands || 100,
            textIP:                  Array.isArray(settings.host) || !!(settings.host || '').match(/[^.\d]/) || (settings.host || '').includes(','),

            IPs:                     ['0.0.0.0', '127.0.0.1'],
            loading:                 true,
            showWarningDialog:       false,
            toConfirmType:           '',
            originalDBType:          settings.type                    || 'file',
        };

        this.focusRef = createRef();
    }

    componentDidMount() {
        this.props.socket.getIpAddresses(this.props.currentHost)
            .then(_IPs => {
                const IPs = [..._IPs];
                !IPs.includes('0.0.0.0') && IPs.push('0.0.0.0');
                !IPs.includes('127.0.0.1') && IPs.push('127.0.0.1');
                let textIP: boolean = !!this.state.host.match(/[^.\d]/) || (this.state.host || '').includes(',');
                if (!textIP && !IPs.includes(this.state.host)) {
                    textIP = true;
                }
                this.setState({ IPs, loading: false, textIP }, () =>
                    this.focusRef.current && this.focusRef.current.focus());
            });
    }

    onChange() {
        const settings = {
            type:                this.state.type,
            host:                this.state.host,
            port:                parseInt(this.state.port as string, 10),
            noFileCache:         this.state.noFileCache,
            connectTimeout:      parseInt(this.state.connectTimeout as string, 10),
            writeFileInterval:   parseInt(this.state.writeFileInterval as string, 10),
            dataDir:             this.state.dataDir,
            options: {
                auth_pass:       this.state.options_auth_pass || null,
                retry_max_delay: parseInt(this.state.options_retry_max_delay as string, 10),
                retry_max_count: parseInt(this.state.options_retry_max_count as string, 10),
                db:              parseInt(this.state.options_db as string, 10),
                family:          parseInt(this.state.options_family as string, 10),
            },
            backup: {
                disabled:        this.state.backup_disabled,
                files:           parseInt(this.state.backup_files as string, 10),
                hours:           parseInt(this.state.backup_hours as string, 10),
                period:          parseInt(this.state.backup_period as string, 10),
                path:            this.state.backup_path,
            },
            jsonlOptions: {
                autoCompress: {
                    sizeFactor: parseInt(this.state.jsonlOptions_autoCompress_sizeFactor as string, 10),
                    sizeFactorMinimumSize: parseInt(this.state.jsonlOptions_autoCompress_sizeFactorMinimumSize as string, 10),
                },
                throttleFS: {
                    intervalMs: parseInt(this.state.jsonlOptions_throttleFS_intervalMs as string, 10),
                    maxBufferedCommands: parseInt(this.state.jsonlOptions_throttleFS_maxBufferedCommands as string, 10),
                },
            },
        };

        if (settings.jsonlOptions.autoCompress.sizeFactor < 2) {
            settings.jsonlOptions.autoCompress.sizeFactor = 2;
        }

        if (settings.jsonlOptions.autoCompress.sizeFactorMinimumSize < 0) {
            settings.jsonlOptions.autoCompress.sizeFactorMinimumSize = 0;
        }

        if (settings.jsonlOptions.throttleFS.intervalMs < 0) {
            settings.jsonlOptions.throttleFS.intervalMs = 0;
        }

        if (settings.jsonlOptions.throttleFS.maxBufferedCommands < 0) {
            settings.jsonlOptions.throttleFS.maxBufferedCommands = 0;
        }

        this.props.onChange(settings);
    }

    renderWarning() {
        if (this.state.showWarningDialog) {
            return <DialogConfirm
                title={this.props.t('Please confirm')}
                text={this.props.t('switch_db_note')}
                onClose={result => {
                    if (result) {
                        let port;

                        if (this.state.toConfirmType === 'redis') {
                            port = 6379;
                        } else {
                            port = 9001;
                        }
                        this.setState(
                            { type: this.state.toConfirmType || 'file', showWarningDialog: false, port },
                            () => this.onChange(),
                        );
                    } else {
                        this.setState({ showWarningDialog: false });
                    }
                }}
            />;
        }
        return null;
    }

    render() {
        return <Paper className={this.props.classes.paper}>
            {this.state.loading ? <LinearProgress /> : null}
            {this.renderWarning()}
            <Grid item className={Utils.clsx(this.props.classes.gridSettings, this.props.classes.dangerZone)}>
                <h3 className={this.props.classes.dangerZoneHeader} title={this.props.t('Invalid settings in these fields could lead to dead host')}>{this.props.t('Danger zone')}</h3>
                <p className={this.props.classes.warning}>{this.props.t('base_settings_hint')}</p>
                <Grid container direction="column">
                    <Grid item>
                        <Tooltip title={this.props.t('switch_db_note')}>
                            <FormControl className={this.props.classes.controlItem} variant="standard">
                                <InputLabel>{this.props.t('Type')}</InputLabel>
                                <Select
                                    variant="standard"
                                    value={this.state.type}
                                    onChange={e => {
                                        if (e.target.value !== this.state.originalDBType) {
                                            this.setState({ toConfirmType: e.target.value as '' | 'file' | 'jsonl' | 'redis', showWarningDialog: true });
                                        } else {
                                            let port;

                                            if (e.target.value === 'redis') {
                                                port = 6379;
                                            } else {
                                                port = 9001;
                                            }
                                            this.setState(
                                                { type: e.target.value, port },
                                                () => this.onChange(),
                                            );
                                        }
                                    }}
                                >
                                    <MenuItem value="jsonl">JSON Lines</MenuItem>
                                    <MenuItem value="file">{this.props.t('File')}</MenuItem>
                                    <MenuItem value="redis">Redis</MenuItem>
                                </Select>
                            </FormControl>
                        </Tooltip>
                    </Grid>

                    <Grid item style={{ paddingLeft: 8 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={this.state.textIP}
                                    onChange={e => this.setState({ textIP: e.target.checked }, () => this.onChange())}
                                />
                            }
                            label={this.props.t('IP is domain or more than one address')}
                        />
                    </Grid>

                    <Grid item>
                        {this.state.textIP ?
                            <TextField
                                variant="standard"
                                className={this.props.classes.controlItem}
                                value={this.state.host}
                                type="text"
                                onChange={e => this.setState({ host: e.target.value }, () => this.onChange())}
                                label={this.props.t('Bind IP address')}
                                helperText={this.props.t('You can enter more than one address divided by comma')}
                            />
                            :
                            <FormControl className={this.props.classes.controlItem} variant="standard">
                                <InputLabel>{this.props.t('Bind IP address')}</InputLabel>
                                <Select
                                    variant="standard"
                                    value={this.state.host}
                                    onChange={e => this.setState({ host: e.target.value }, () => this.onChange())}
                                >
                                    { this.state.IPs.map(ip => <MenuItem key={ip} value={ip}>{ip === '0.0.0.0' ? `0.0.0.0 [${this.props.t('All addresses')}]` : ip}</MenuItem>) }
                                </Select>
                            </FormControl>}
                    </Grid>

                    <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.port}
                            type="number"
                            InputProps={{ inputProps: { min: 1, max: 65535 } }}
                            onChange={e => this.setState({ port: e.target.value }, () => this.onChange())}
                            label={this.props.t('Port')}
                        />
                    </Grid>

                    {this.state.type === 'file' || this.state.type === 'jsonl' ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.dataDir}
                            helperText={this.props.t('Optional. Always relative to iobroker.js-controller/')}
                            onChange={e => this.setState({ dataDir: e.target.value }, () => this.onChange())}
                            label={this.props.t('Directory path')}
                        />
                    </Grid> : null}

                    <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.options_auth_pass}
                            type="password"
                            helperText={this.props.t('Optional')}
                            inputProps={{
                                autoComplete: 'new-password',
                                form: {
                                    autoComplete: 'off',
                                },
                            }}
                            autoComplete="off"
                            onChange={e => this.setState({ options_auth_pass: e.target.value }, () => this.onChange())}
                            label={this.state.type === 'redis' ? this.props.t('Redis password') : this.props.t('Connection password')}
                        />
                    </Grid>
                </Grid>
            </Grid>
            <Grid item className={this.props.classes.gridSettings}>
                <Grid container direction="column">
                    {this.state.type === 'file' || this.state.type === 'jsonl' ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.connectTimeout}
                            helperText={this.props.t('ms')}
                            type="number"
                            InputProps={{ inputProps: { min: 200 } }}
                            onChange={e => this.setState({ connectTimeout: e.target.value }, () => this.onChange())}
                            label={this.props.t('Connect timeout')}
                        />
                    </Grid> : null}

                    { this.state.type === 'file' || this.state.type === 'jsonl' ? <Grid item>
                        <FormControl component="fieldset" variant="standard" className={this.props.classes.controlItem}>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={this.state.noFileCache}
                                            onChange={e => this.setState({ noFileCache: e.target.checked }, () => this.onChange())}
                                        />
                                    }
                                    label={this.props.t('No file cache')}
                                />
                            </FormGroup>
                            <FormHelperText>{this.props.t('Always read files from disk and do not cache them in RAM. Used for debugging.')}</FormHelperText>
                        </FormControl>
                    </Grid> : null}

                    {this.state.type === 'file' ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.writeFileInterval}
                            helperText={this.props.t('How often the data from RAM will be saved on disk in ms')}
                            type="number"
                            InputProps={{ inputProps: { min: 200 } }}
                            onChange={e => this.setState({ writeFileInterval: e.target.value }, () => this.onChange())}
                            label={this.props.t('Store file interval')}
                        />
                    </Grid> : null }

                    { this.state.type === 'redis' ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.options_retry_max_delay}
                            type="number"
                            helperText={this.props.t('Maximum delay between connection attempts')}
                            onChange={e => this.setState({ options_retry_max_delay: e.target.value }, () => this.onChange())}
                            label={this.props.t('Retry maximum delay')}
                        />
                    </Grid> : null }

                    { this.state.type === 'redis' ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.options_retry_max_count}
                            type="number"
                            helperText={this.props.t('Maximum number of connection retries')}
                            onChange={e => this.setState({ options_retry_max_count: e.target.value }, () => this.onChange())}
                            label={this.props.t('Retry maximum count')}
                        />
                    </Grid> : null }

                    { this.state.type === 'redis' ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.options_db}
                            type="number"
                            helperText={this.props.t('Used for sentinels')}
                            onChange={e => this.setState({ options_db: e.target.value }, () => this.onChange())}
                            label={this.props.t('DB number')}
                        />
                    </Grid> : null }

                    { this.state.type === 'redis' ? <Grid item>
                        <FormControl className={this.props.classes.controlItem} variant="standard">
                            <InputLabel>{this.props.t('Family number')}</InputLabel>
                            <Select
                                variant="standard"
                                value={this.state.options_family}
                                onChange={e => this.setState({ options_family: e.target.value }, () => this.onChange())}
                            >
                                <MenuItem value={0}>auto</MenuItem>
                                <MenuItem value={4}>IPv4</MenuItem>
                                <MenuItem value={6}>IPv6</MenuItem>
                            </Select>
                            <FormHelperText>{this.props.t('Used for sentinels')}</FormHelperText>
                        </FormControl>
                    </Grid> : null }

                    {this.state.type === 'jsonl' ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.jsonlOptions_autoCompress_sizeFactor}
                            type="number"
                            inputProps={{ min: 2 }}
                            helperText={this.props.t('The JSONL DB is append-only and will contain unnecessary entries after a while.')}
                            onChange={e => this.setState({ jsonlOptions_autoCompress_sizeFactor: e.target.value }, () => this.onChange())}
                            label={this.props.t('Auto-compress size factor')}
                        />
                    </Grid> : null}

                    {this.state.type === 'jsonl' ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.jsonlOptions_autoCompress_sizeFactorMinimumSize}
                            type="number"
                            inputProps={{ min: 0 }}
                            helperText={this.props.t('It will be compressed when the uncompressed size is >= size * sizeFactor AND >= sizeFactorMinimumSize')}
                            onChange={e => this.setState({ jsonlOptions_autoCompress_sizeFactorMinimumSize: e.target.value }, () => this.onChange())}
                            label={this.props.t('Auto-compress size factor minimum size')}
                        />
                    </Grid> : null}

                    {this.state.type === 'jsonl' ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.jsonlOptions_throttleFS_intervalMs}
                            type="number"
                            inputProps={{ min: 0 }}
                            helperText={this.props.t('Write to the database file no more than every X milliseconds')}
                            onChange={e => this.setState({ jsonlOptions_throttleFS_intervalMs: e.target.value }, () => this.onChange())}
                            label={this.props.t('Minimal write interval')}
                        />
                    </Grid> : null}

                    {this.state.type === 'jsonl' ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.jsonlOptions_throttleFS_maxBufferedCommands}
                            type="number"
                            inputProps={{ min: 0 }}
                            helperText={this.props.t('Force writing after this many changes have been buffered. This reduces memory consumption and data loss in case of a crash')}
                            onChange={e => this.setState({ jsonlOptions_throttleFS_maxBufferedCommands: e.target.value }, () => this.onChange())}
                            label={this.props.t('Maximum changes before write')}
                        />
                    </Grid> : null}

                    {this.state.type === 'file' || this.state.type === 'jsonl' ? <Grid item>
                        <FormControl component="fieldset" variant="standard" className={this.props.classes.controlItem}>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={this.state.backup_disabled}
                                            onChange={e => this.setState({ backup_disabled: e.target.checked }, () => this.onChange())}
                                        />
                                    }
                                    label={this.props.t('No on-the-fly backup')}
                                />
                            </FormGroup>
                            <FormHelperText>{this.props.t('By every write the backup of object.json will be created.')}</FormHelperText>
                        </FormControl>
                    </Grid> : null}

                    {(this.state.type === 'file' || this.state.type === 'jsonl') && !this.state.backup_disabled ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.backup_files}
                            type="number"
                            helperText={this.props.t('Minimal number of backup files, after the deletion will be executed according to the backup time settings')}
                            onChange={e => this.setState({ backup_files: e.target.value }, () => this.onChange())}
                            label={this.props.t('Number of files')}
                        />
                    </Grid> : null}

                    {(this.state.type === 'file' || this.state.type === 'jsonl') && !this.state.backup_disabled ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.backup_hours}
                            type="number"
                            helperText={this.props.t('All backups older than these hours will be deleted, but only if the number of files is greater than of the files number')}
                            onChange={e => this.setState({ backup_hours: e.target.value }, () => this.onChange())}
                            label={this.props.t('Backup hours')}
                        />
                    </Grid> : null}

                    {(this.state.type === 'file' || this.state.type === 'jsonl') && !this.state.backup_disabled ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.backup_period}
                            type="number"
                            helperText={this.props.t('By default the backup is every 2 hours. Time is in minutes. To disable backup set the value to 0')}
                            onChange={e => this.setState({ backup_period: e.target.value }, () => this.onChange())}
                            label={this.props.t('How often')}
                        />
                    </Grid> : null}

                    {(this.state.type === 'file' || this.state.type === 'jsonl') && !this.state.backup_disabled ? <Grid item>
                        <TextField
                            variant="standard"
                            className={this.props.classes.controlItem}
                            value={this.state.backup_path}
                            helperText={this.props.t('Absolute path to backup directory or empty to backup in data directory. Leave it empty for default storage place.')}
                            onChange={e => this.setState({ backup_path: e.target.value }, () => this.onChange())}
                            label={this.props.t('Path')}
                        />
                    </Grid> : null}
                </Grid>
            </Grid>
        </Paper>;
    }
}

export default withWidth()(withStyles(styles)(BaseSettingsObjects));
