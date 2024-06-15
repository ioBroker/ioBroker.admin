import React, { createRef, Component } from 'react';
import { type Styles, withStyles } from '@mui/styles';

import {
    Grid,
    FormControlLabel,
    Checkbox,
    TextField,
    Paper,
} from '@mui/material';

import { withWidth, type IobTheme } from '@iobroker/adapter-react-v5';

const styles: Styles<any, any> = (theme: IobTheme) => ({
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'auto',
        padding: theme.spacing(1),
    },
    controlItem: {
        width: `calc(100% - ${theme.spacing(2)})`,
        marginBottom: theme.spacing(2),
        marginRight: theme.spacing(1),
        marginLeft: theme.spacing(1),
    },
    RAM: {
        width: 400,
        marginRight: theme.spacing(1),
    },
});

export interface SystemSettings {
    memoryLimitMB?: number;
    hostname?: string;
    statisticsInterval?: number;
    checkDiskInterval?: number;
    instanceStartInterval?: number;
    compact?: boolean;
    allowShellCommands?: boolean;
    memLimitWarn?: number;
    memLimitError?: number;
    noChmod?: boolean;
}

interface BaseSettingsSystemProps {
    t: (text: string) => string;
    onChange: (settings: SystemSettings) => void;
    settings: SystemSettings;
    currentHost: string;
    classes: Record<string, any>;
}

interface BaseSettingsSystemState {
    memoryLimitMB: number;
    hostname: string;
    statisticsInterval: number;
    checkDiskInterval: number;
    instanceStartInterval: number;
    compact: boolean;
    allowShellCommands: boolean;
    memLimitWarn: number;
    memLimitError: number;
    noChmod: boolean;
}

class BaseSettingsSystem extends Component<BaseSettingsSystemProps, BaseSettingsSystemState> {
    private focusRef: React.RefObject<HTMLInputElement>;

    constructor(props: BaseSettingsSystemProps) {
        super(props);

        const settings: SystemSettings = this.props.settings || {};

        this.state = {
            memoryLimitMB:         settings.memoryLimitMB         || 0,
            hostname:              settings.hostname              || '',
            statisticsInterval:    settings.statisticsInterval    || 15_000,
            checkDiskInterval:     settings.checkDiskInterval     || 300_000,
            instanceStartInterval: settings.instanceStartInterval || 2_000,
            compact:               settings.compact               || false,
            allowShellCommands:    settings.allowShellCommands    || false,
            memLimitWarn:          settings.memLimitWarn          || 100,
            memLimitError:         settings.memLimitError         || 50,
            noChmod:               settings.noChmod               || false,
        };

        this.focusRef = createRef();
    }

    componentDidMount() {
        this.focusRef.current && this.focusRef.current.focus();
    }

    onChange() {
        this.props.onChange({
            memoryLimitMB:         this.state.memoryLimitMB,
            hostname:              this.state.hostname,
            statisticsInterval:    this.state.statisticsInterval,
            checkDiskInterval:     this.state.checkDiskInterval,
            noChmod:               this.state.noChmod,
            instanceStartInterval: this.state.instanceStartInterval,
            compact:               this.state.compact,
            allowShellCommands:    this.state.allowShellCommands,
            memLimitWarn:          this.state.memLimitWarn,
            memLimitError:         this.state.memLimitError,
        });
    }

    render() {
        return <Paper className={this.props.classes.paper}>
            <Grid item className={this.props.classes.gridSettings}>
                <Grid container direction="column">
                    <Grid item>
                        <TextField
                            variant="standard"
                            label={this.props.t('Host name')}
                            className={this.props.classes.controlItem}
                            value={this.state.hostname || this.props.currentHost.replace('system.host.', '')}
                            onChange={e => this.setState({ hostname: e.target.value }, () => this.onChange())}
                            helperText={this.props.t('You can change the host name, but be aware, that all instances must be assigned anew')}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            variant="standard"
                            label={this.props.t('Check disk space interval')}
                            className={this.props.classes.controlItem}
                            value={this.state.checkDiskInterval}
                            type="number"
                            InputProps={{ inputProps: { min: 1000 } }}
                            onChange={e => this.setState({ checkDiskInterval: parseInt(e.target.value, 10) }, () => this.onChange())}
                            helperText={this.props.t('How oft the disk will be checked. Do not set it to low, because it can affect system performance. Value is in ms')}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            variant="standard"
                            label={this.props.t('Instance statistics update interval')}
                            className={this.props.classes.controlItem}
                            value={this.state.statisticsInterval}
                            type="number"
                            InputProps={{ inputProps: { min: 5000 } }}
                            onChange={e => this.setState({ statisticsInterval: parseInt(e.target.value, 10) }, () => this.onChange())}
                            helperText={this.props.t('How oft the instance statistics will be updated. Used RAM, CPU and so on. Value is in ms')}
                        />
                    </Grid>
                    <Grid item className={this.props.classes.controlItem}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={this.state.compact}
                                    onChange={e => this.setState({ compact: e.target.checked }, () => this.onChange())}
                                />
                            }
                            label={this.props.t('Compact mode')}
                        />
                        <div>{ this.props.t('When enabled adapter instances can run in one or few processes to save RAM usage.') }</div>
                    </Grid>
                    <Grid item className={this.props.classes.controlItem}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={this.state.allowShellCommands}
                                    onChange={e => this.setState({ allowShellCommands: e.target.checked }, () => this.onChange())}
                                />
                            }
                            label={this.props.t('Allow shell\'s commands')}
                        />
                        <div>{ this.props.t('Allow execution of sendToHost("shell", "cli command")') }</div>
                    </Grid>
                    <Grid item>
                        <TextField
                            variant="standard"
                            label={this.props.t('Limit RAM size for controller')}
                            className={this.props.classes.controlItem}
                            value={this.state.memoryLimitMB}
                            type="number"
                            onChange={e => this.setState({ memoryLimitMB: parseInt(e.target.value, 10) }, () => this.onChange())}
                            helperText={this.props.t('MB')}
                        />
                    </Grid>
                    <Grid item>
                        <Grid container direction="row" className={this.props.classes.controlItem}>
                            <Grid item>
                                <TextField
                                    variant="standard"
                                    label={this.props.t('Show warning im log if RAM less than')}
                                    className={this.props.classes.RAM}
                                    value={this.state.memLimitWarn}
                                    type="number"
                                    onChange={e => this.setState({ memLimitWarn: parseInt(e.target.value, 10) }, () => this.onChange())}
                                    helperText={this.props.t('MB')}
                                />
                            </Grid>
                            <Grid item>
                                <TextField
                                    variant="standard"
                                    label={this.props.t('Show error in log if RAM less than')}
                                    className={this.props.classes.RAM}
                                    value={this.state.memLimitError}
                                    type="number"
                                    onChange={e => this.setState({ memLimitError: parseInt(e.target.value, 10) }, () => this.onChange())}
                                    helperText={this.props.t('MB')}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>;
    }
}

export default withWidth()(withStyles(styles)(BaseSettingsSystem));
