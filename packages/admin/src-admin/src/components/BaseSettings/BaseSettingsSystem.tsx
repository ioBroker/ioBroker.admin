import React, { createRef, Component, type JSX } from 'react';

import { Grid2, FormControlLabel, Checkbox, TextField, Paper } from '@mui/material';

import { withWidth, type Translate } from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = {
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'auto',
        padding: 8,
    },
    controlItem: {
        width: 'calc(100% - 16px)',
        marginBottom: 16,
        marginRight: 8,
        marginLeft: 8,
    },
    RAM: {
        width: 400,
        marginRight: 8,
    },
};

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
    t: Translate;
    onChange: (settings: SystemSettings) => void;
    settings: SystemSettings;
    currentHost: string;
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
            memoryLimitMB: settings.memoryLimitMB || 0,
            hostname: settings.hostname || '',
            statisticsInterval: settings.statisticsInterval || 15_000,
            checkDiskInterval: settings.checkDiskInterval || 300_000,
            instanceStartInterval: settings.instanceStartInterval || 2_000,
            compact: settings.compact || false,
            allowShellCommands: settings.allowShellCommands || false,
            memLimitWarn: settings.memLimitWarn || 100,
            memLimitError: settings.memLimitError || 50,
            noChmod: settings.noChmod || false,
        };

        this.focusRef = createRef();
    }

    componentDidMount(): void {
        this.focusRef.current?.focus();
    }

    onChange(): void {
        this.props.onChange({
            memoryLimitMB: this.state.memoryLimitMB,
            hostname: this.state.hostname,
            statisticsInterval: this.state.statisticsInterval,
            checkDiskInterval: this.state.checkDiskInterval,
            noChmod: this.state.noChmod,
            instanceStartInterval: this.state.instanceStartInterval,
            compact: this.state.compact,
            allowShellCommands: this.state.allowShellCommands,
            memLimitWarn: this.state.memLimitWarn,
            memLimitError: this.state.memLimitError,
        });
    }

    render(): JSX.Element {
        return (
            <Paper style={styles.paper}>
                <Grid2 style={styles.gridSettings}>
                    <Grid2
                        container
                        direction="column"
                    >
                        <Grid2>
                            <TextField
                                variant="standard"
                                label={this.props.t('Host name')}
                                style={styles.controlItem}
                                value={this.state.hostname || this.props.currentHost.replace('system.host.', '')}
                                onChange={e => this.setState({ hostname: e.target.value }, () => this.onChange())}
                                helperText={this.props.t(
                                    'You can change the host name, but be aware, that all instances must be assigned anew',
                                )}
                            />
                        </Grid2>
                        <Grid2>
                            <TextField
                                variant="standard"
                                label={this.props.t('Check disk space interval')}
                                style={styles.controlItem}
                                value={this.state.checkDiskInterval}
                                type="number"
                                slotProps={{ htmlInput: { min: 1000 } }}
                                onChange={e =>
                                    this.setState({ checkDiskInterval: parseInt(e.target.value, 10) }, () =>
                                        this.onChange(),
                                    )
                                }
                                helperText={this.props.t(
                                    'How oft the disk will be checked. Do not set it to low, because it can affect system performance. Value is in ms',
                                )}
                            />
                        </Grid2>
                        <Grid2>
                            <TextField
                                variant="standard"
                                label={this.props.t('Instance statistics update interval')}
                                style={styles.controlItem}
                                value={this.state.statisticsInterval}
                                type="number"
                                slotProps={{ htmlInput: { min: 5000 } }}
                                onChange={e =>
                                    this.setState({ statisticsInterval: parseInt(e.target.value, 10) }, () =>
                                        this.onChange(),
                                    )
                                }
                                helperText={this.props.t(
                                    'How oft the instance statistics will be updated. Used RAM, CPU and so on. Value is in ms',
                                )}
                            />
                        </Grid2>
                        <Grid2 style={styles.controlItem}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={this.state.compact}
                                        onChange={e =>
                                            this.setState({ compact: e.target.checked }, () => this.onChange())
                                        }
                                    />
                                }
                                label={this.props.t('Compact mode')}
                            />
                            <div>
                                {this.props.t(
                                    'When enabled adapter instances can run in one or few processes to save RAM usage.',
                                )}
                            </div>
                        </Grid2>
                        <Grid2 style={styles.controlItem}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={this.state.allowShellCommands}
                                        onChange={e =>
                                            this.setState({ allowShellCommands: e.target.checked }, () =>
                                                this.onChange(),
                                            )
                                        }
                                    />
                                }
                                label={this.props.t("Allow shell's commands")}
                            />
                            <div>{this.props.t('Allow execution of sendToHost("shell", "cli command")')}</div>
                        </Grid2>
                        <Grid2>
                            <TextField
                                variant="standard"
                                label={this.props.t('Limit RAM size for controller')}
                                style={styles.controlItem}
                                value={this.state.memoryLimitMB}
                                type="number"
                                onChange={e =>
                                    this.setState({ memoryLimitMB: parseInt(e.target.value, 10) }, () =>
                                        this.onChange(),
                                    )
                                }
                                helperText={this.props.t('MB')}
                            />
                        </Grid2>
                        <Grid2>
                            <Grid2
                                container
                                direction="row"
                                style={styles.controlItem}
                            >
                                <Grid2>
                                    <TextField
                                        variant="standard"
                                        label={this.props.t('Show warning im log if RAM less than')}
                                        style={styles.RAM}
                                        value={this.state.memLimitWarn}
                                        type="number"
                                        onChange={e =>
                                            this.setState({ memLimitWarn: parseInt(e.target.value, 10) }, () =>
                                                this.onChange(),
                                            )
                                        }
                                        helperText={this.props.t('MB')}
                                    />
                                </Grid2>
                                <Grid2>
                                    <TextField
                                        variant="standard"
                                        label={this.props.t('Show error in log if RAM less than')}
                                        style={styles.RAM}
                                        value={this.state.memLimitError}
                                        type="number"
                                        onChange={e =>
                                            this.setState({ memLimitError: parseInt(e.target.value, 10) }, () =>
                                                this.onChange(),
                                            )
                                        }
                                        helperText={this.props.t('MB')}
                                    />
                                </Grid2>
                            </Grid2>
                        </Grid2>
                    </Grid2>
                </Grid2>
            </Paper>
        );
    }
}

export default withWidth()(BaseSettingsSystem);
