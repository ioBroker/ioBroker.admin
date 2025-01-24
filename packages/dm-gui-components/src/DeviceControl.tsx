import React, { Component, type JSX } from 'react';
import {
    Button,
    Fab,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    Stack,
    Slider,
    TextField,
    InputAdornment,
} from '@mui/material';

import { type Connection, Icon } from '@iobroker/adapter-react-v5';
import type { ControlBase, ControlState, DeviceControl } from '@iobroker/dm-utils';

import { renderControlIcon, getTranslation } from './Utils';

interface DeviceControlProps {
    deviceId: string;
    /** Control object */
    control: DeviceControl;
    socket: Connection;
    /** Control handler to set the state */
    controlHandler: (
        deviceId: string,
        control: ControlBase,
        state: ControlState,
    ) => () => Promise<ioBroker.State | null>;
    /** Control handler to read the state */
    controlStateHandler: (deviceId: string, control: ControlBase) => () => Promise<ioBroker.State | null>;
    colors: { primary: string; secondary: string };
    disabled?: boolean;
}

interface DeviceControlState {
    value?: ControlState;
    ts?: number;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: { label: string; value: ControlState; icon?: string; color?: string }[];
}

/**
 * Device Control component
 */
export default class DeviceControlComponent extends Component<DeviceControlProps, DeviceControlState> {
    constructor(props: DeviceControlProps) {
        super(props);
        this.state = {
            value: props.control.state?.val,
            ts: props.control.state?.ts,
            unit: props.control.unit || '',
        };
    }

    async componentDidMount(): Promise<void> {
        if (this.props.control.stateId) {
            const mayBePromise = this.props.socket.subscribeState(this.props.control.stateId, this.stateHandler);
            if (mayBePromise instanceof Promise) {
                await mayBePromise;
            }
            if (this.props.control.type === 'slider' || this.props.control.type === 'number') {
                if (this.props.control.min === undefined && this.props.control.max === undefined) {
                    // read an object to get min and max
                    void this.props.socket.getObject(this.props.control.stateId).then(obj => {
                        if (obj?.common) {
                            let min: number | undefined = this.props.control.min;
                            if (min === undefined) {
                                min = obj.common.min;
                            }
                            if (min === undefined) {
                                min = 0;
                            }
                            let max: number | undefined = this.props.control.max;
                            if (max === undefined) {
                                min = obj.common.max;
                            }
                            if (min === undefined) {
                                max = 100;
                            }
                            let step: number | undefined = this.props.control.step;
                            if (step === undefined) {
                                step = obj.common.step;
                            }
                            if (step === undefined) {
                                step = (max! - min!) / 100;
                            }
                            let unit: string | undefined = this.props.control.unit;
                            if (unit === undefined) {
                                unit = obj.common.unit;
                            }

                            this.setState({
                                min,
                                max,
                                step,
                                unit,
                            });
                        }
                    });
                } else {
                    const min = this.props.control.min === undefined ? 0 : this.props.control.min;
                    const max = this.props.control.max === undefined ? 100 : this.props.control.max;

                    this.setState({
                        min,
                        max,
                        step: this.props.control.step === undefined ? (max - min) / 100 : this.props.control.step,
                        unit: this.props.control.unit || '',
                    });
                }
            } else if (this.props.control.type === 'select') {
                if (!this.props.control.options?.length) {
                    // read an object to get options
                    void this.props.socket.getObject(this.props.control.stateId).then(obj => {
                        if (obj?.common?.states) {
                            let options: { label: string; value: ControlState }[] | undefined;
                            if (typeof obj.common.states === 'string') {
                                const pairs = obj.common.states.split(';');
                                options = pairs.map(pair => {
                                    const parts = pair.split(':');
                                    return {
                                        value: parts[0],
                                        label: parts[1],
                                    };
                                });
                            } else if (Array.isArray(obj.common.states)) {
                                options = obj.common.states.map((label: string) => ({ label, value: label }));
                            } else {
                                options = Object.keys(obj.common.states).map(label => ({
                                    label,
                                    value: obj.common.states[label],
                                }));
                            }

                            this.setState({
                                options,
                            });
                        }
                    });
                } else {
                    this.setState({
                        options: this.props.control.options.map(item => ({
                            label: getTranslation(item.label),
                            value: item.value,
                            icon: item.icon,
                            color: item.color,
                        })),
                    });
                }
            } else if (this.props.control.type === 'info') {
                if (!this.props.control.unit) {
                    // read an object to get unit
                    void this.props.socket.getObject(this.props.control.stateId).then(obj => {
                        if (obj?.common?.unit) {
                            this.setState({
                                unit: obj.common.unit,
                            });
                        }
                    });
                }
            }
        }
    }

    stateHandler = async (id: string, state: ioBroker.State): Promise<void> => {
        if (id === this.props.control.stateId && state) {
            // request new state
            const newState: ioBroker.State | null = await this.props.controlStateHandler(
                this.props.deviceId,
                this.props.control,
            )();
            if (newState?.ts && (!this.state.ts || newState.ts > this.state.ts)) {
                this.setState({
                    value: newState.val,
                    ts: newState.ts,
                });
            }
        }
    };

    componentWillUnmount(): void {
        if (this.props.control.stateId) {
            this.props.socket.unsubscribeState(this.props.control.stateId, this.stateHandler);
        }
    }

    static getDerivedStateFromProps(
        props: DeviceControlProps,
        state: DeviceControlState,
    ): Partial<DeviceControlState> | null {
        if (props.control.state?.ts && (!state.ts || props.control.state?.ts > state.ts)) {
            return {
                value: props.control.state.val,
                ts: props.control.state.ts,
            };
        }

        return null;
    }

    async sendControl(deviceId: string, control: ControlBase, value: ControlState): Promise<void> {
        const result = await this.props.controlHandler(deviceId, control, value)();
        if (result?.ts && (!this.state.ts || result?.ts > this.state.ts)) {
            this.setState({
                value: result.val,
                ts: result.ts,
            });
        }
    }

    renderButton(): JSX.Element {
        const tooltip = getTranslation(this.props.control.description ?? '');
        const icon = renderControlIcon(this.props.control, this.props.colors, this.state.value);

        if (!this.props.control.label) {
            return (
                <Fab
                    size="small"
                    disabled={this.props.disabled}
                    title={tooltip}
                    onClick={() => this.sendControl(this.props.deviceId, this.props.control, true)}
                >
                    {icon}
                </Fab>
            );
        }
        return (
            <Button
                disabled={this.props.disabled}
                title={tooltip}
                onClick={() => this.sendControl(this.props.deviceId, this.props.control, true)}
                startIcon={icon}
            >
                {getTranslation(this.props.control.label)}
            </Button>
        );
    }

    renderSwitch(): JSX.Element {
        const tooltip = getTranslation(this.props.control.description ?? '');
        // const icon = renderIcon(this.props.control, this.props.colors, this.state.value);

        return (
            <Switch
                disabled={this.props.disabled}
                title={tooltip}
                checked={!!this.state.value}
                onChange={e => this.sendControl(this.props.deviceId, this.props.control, e.target.checked)}
            />
        );
    }

    getColor(): string | undefined {
        let color: string | undefined;
        if (this.state.value) {
            color = this.props.control.colorOn || 'primary';
        } else if (this.props.control.type === 'switch') {
            color = this.props.control.color;
        }
        if (color === 'primary') {
            return this.props.colors.primary;
        }
        if (color === 'secondary') {
            return this.props.colors.secondary;
        }
        return color;
    }

    renderSelect(): JSX.Element {
        const anyIcons = this.state.options?.some(option => !!option.icon);

        return (
            <FormControl
                fullWidth
                variant="standard"
            >
                {this.props.control.label ? <InputLabel>{getTranslation(this.props.control.label)}</InputLabel> : null}
                <Select
                    variant="standard"
                    value={this.state.value}
                    onChange={(e): Promise<void> =>
                        this.sendControl(this.props.deviceId, this.props.control, e.target.value)
                    }
                >
                    {this.state.options?.map((option, i) => (
                        <MenuItem
                            key={i.toString()}
                            value={typeof option.value === 'boolean' ? option.value.toString() : option.value!}
                            style={{ color: option.color }}
                        >
                            {anyIcons ? (
                                <Icon
                                    src={option.icon}
                                    style={{ width: 24, height: 24 }}
                                />
                            ) : null}
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    }

    renderSlider(): JSX.Element {
        if (this.state.min === undefined || this.state.max === undefined) {
            return <div style={{ width: '100%' }}>...</div>;
        }
        return (
            <Stack
                spacing={2}
                direction="row"
                sx={{ alignItems: 'center', mb: 1, width: '100%' }}
            >
                {this.props.control.label ? (
                    <InputLabel style={{ color: this.props.control.color }}>
                        {getTranslation(this.props.control.label)}
                    </InputLabel>
                ) : null}
                {this.props.control.icon ? (
                    <Icon
                        style={{ color: this.props.control.color }}
                        src={this.props.control.icon}
                    />
                ) : null}
                <Slider
                    value={parseFloat((this.state.value as string) || '0')}
                    min={this.state.min}
                    max={this.state.max}
                    step={this.state.step}
                    valueLabelDisplay="auto"
                    onChange={(_e, value) => this.sendControl(this.props.deviceId, this.props.control, value as number)}
                />
                {this.props.control.iconOn ? (
                    <Icon
                        style={{ color: this.props.control.colorOn }}
                        src={this.props.control.iconOn}
                    />
                ) : null}
                {this.props.control.labelOn ? (
                    <InputLabel style={{ color: this.props.control.colorOn }}>
                        {getTranslation(this.props.control.labelOn)}
                    </InputLabel>
                ) : null}
            </Stack>
        );
    }

    renderColor(): JSX.Element {
        return (
            <TextField
                fullWidth
                label={this.props.control.label ? getTranslation(this.props.control.label) : undefined}
                type="color"
                value={this.state.value as string}
                onChange={(e): Promise<void> =>
                    this.sendControl(this.props.deviceId, this.props.control, e.target.value)
                }
                variant="standard"
            />
        );
    }

    renderText(): JSX.Element {
        return (
            <TextField
                fullWidth
                label={this.props.control.label ? getTranslation(this.props.control.label) : undefined}
                value={this.state.value as string}
                onChange={(e): Promise<void> =>
                    this.sendControl(this.props.deviceId, this.props.control, e.target.value)
                }
                variant="standard"
            />
        );
    }

    renderNumber(): JSX.Element {
        return (
            <TextField
                fullWidth
                type="number"
                label={this.props.control.label ? getTranslation(this.props.control.label) : undefined}
                value={this.state.value as number}
                onChange={(e): Promise<void> => {
                    if (isNaN(parseFloat(e.target.value))) {
                        return Promise.resolve();
                    }
                    return this.sendControl(this.props.deviceId, this.props.control, parseFloat(e.target.value));
                }}
                slotProps={{
                    htmlInput: { min: this.state.min, max: this.state.max, step: this.state.step },
                    input: {
                        endAdornment: this.state.unit ? (
                            <InputAdornment position="end">{this.state.unit}</InputAdornment>
                        ) : undefined,
                    },
                }}
                variant="standard"
            />
        );
    }

    renderIcon(): JSX.Element {
        const tooltip = getTranslation(this.props.control.description ?? '');
        const icon = renderControlIcon(this.props.control, this.props.colors, this.state.value);
        const color = this.getColor();
        const style: React.CSSProperties | undefined =
            color === this.props.colors.primary || color === this.props.colors.secondary ? {} : { color };
        const colorProps =
            color === this.props.colors.primary
                ? 'primary'
                : color === this.props.colors.secondary
                  ? 'secondary'
                  : undefined;

        if (!this.props.control.label) {
            style.width = 34;
            style.height = 34;
            style.minHeight = 34;

            return (
                <Fab
                    disabled={this.props.disabled}
                    size="small"
                    title={tooltip}
                    color={colorProps}
                    style={style}
                    onClick={() => this.sendControl(this.props.deviceId, this.props.control, !this.state.value)}
                >
                    {icon}
                </Fab>
            );
        }
        return (
            <Button
                disabled={this.props.disabled}
                title={tooltip}
                color={colorProps}
                style={style}
                onClick={() => this.sendControl(this.props.deviceId, this.props.control, !this.state.value)}
                startIcon={icon}
            >
                {getTranslation(this.props.control.label)}
            </Button>
        );
    }

    renderInfo(): JSX.Element {
        return (
            <div>
                {this.props.control.label ? <InputLabel>{getTranslation(this.props.control.label)}</InputLabel> : null}
                <span>
                    {this.state.value}
                    <span style={{ fontSize: 'smaller', opacity: 0.7, marginLeft: this.state.unit ? 4 : 0 }}>
                        {this.state.unit}
                    </span>
                </span>
            </div>
        );
    }

    render(): JSX.Element {
        if (this.props.control.type === 'button') {
            return this.renderButton();
        }

        if (this.props.control.type === 'icon') {
            return this.renderIcon();
        }

        if (this.props.control.type === 'switch') {
            return this.renderSwitch();
        }

        if (this.props.control.type === 'select') {
            return this.renderSelect();
        }

        if (this.props.control.type === 'slider') {
            return this.renderSlider();
        }

        if (this.props.control.type === 'color') {
            return this.renderColor();
        }

        if (this.props.control.type === 'text') {
            return this.renderText();
        }

        if (this.props.control.type === 'number') {
            return this.renderNumber();
        }

        if (this.props.control.type === 'info') {
            return this.renderInfo();
        }

        return <div style={{ color: 'red' }}>{this.props.control.type}</div>;
    }
}
