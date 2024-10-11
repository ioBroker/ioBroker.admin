import React, { Component, type JSX } from 'react';
import { Button, Fab, Switch } from '@mui/material';

import type { Connection } from '@iobroker/react-components';
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
        };
    }

    async componentDidMount(): Promise<void> {
        if (this.props.control.stateId) {
            const mayBePromise = this.props.socket.subscribeState(this.props.control.stateId, this.stateHandler);
            if (mayBePromise instanceof Promise) {
                await mayBePromise;
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

    // TODO: implement the following render methods
    // eslint-disable-next-line react/no-unused-class-component-methods,class-methods-use-this
    renderSelect(): JSX.Element | null {
        return null;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods,class-methods-use-this
    renderSlider(): JSX.Element | null {
        return null;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods,class-methods-use-this
    renderColor(): JSX.Element | null {
        return null;
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

        return <div style={{ color: 'red' }}>{this.props.control.type}</div>;
    }
}
