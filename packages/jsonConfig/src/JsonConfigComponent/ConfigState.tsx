import React from 'react';

import {
    TextField,
    IconButton, Button, Switch, Slider,
} from '@mui/material';

import {
    I18n,
} from '@iobroker/adapter-react-v5';

import type { ConfigItemState } from '#JC/types';
import getIconByName from './Icons';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigStateProps extends ConfigGenericProps {
    schema: ConfigItemState;
}

interface ConfigStateState extends ConfigGenericState {
    stateValue?: string | number | boolean | null;
    controlType?: string;
}

class ConfigState extends ConfigGeneric<ConfigStateProps, ConfigStateState> {
    obj: ioBroker.Object | null = null;

    controlTimeout: ReturnType<typeof setTimeout> | null = null;

    getObjectID() {
        return `${this.props.schema.system ? 'system.adapter.' : ''}${this.props.adapterName}.${this.props.instance}.${this.props.schema.oid}`;
    }

    async componentDidMount() {
        super.componentDidMount();
        this.obj = await this.props.socket.getObject(this.getObjectID());
        const controlType = this.props.schema.control || await this.detectType();

        const state = await this.props.socket.getState(this.getObjectID());

        this.setState({ stateValue: state ? state.val : null, controlType }, async () => {
            await this.props.socket.subscribeState(this.getObjectID(), this.onStateChanged);
        });
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.props.socket.unsubscribeState(this.getObjectID(), this.onStateChanged);
        if (this.controlTimeout) {
            clearTimeout(this.controlTimeout);
            this.controlTimeout = null;
            this.props.socket.setState(this.getObjectID(), this.state.stateValue, false)
                .catch(e => console.error(`Cannot control value: ${e}`));
        }
    }

    onStateChanged = (_id: string, state: ioBroker.State | null | undefined) => {
        let val = state ? state.val : null;
        if (this.state.controlType === 'button' ||
            this.state.controlType === 'switch'
        ) {
            val = !!val;
        } else if (val !== null && (this.state.controlType === 'slider' || this.state.controlType === 'number')) {
            val = parseFloat(val as unknown as string);
        }

        this.setState({ stateValue: val });
    };

    async detectType() {
        // read object
        if (this.obj.common.type === 'boolean') {
            if (this.obj.common.read === false) {
                return 'button';
            }
            if (this.obj.common.write) {
                return 'switch';
            }

            return 'text';
        }

        if (this.obj.common.type === 'number') {
            if (this.obj.common.write) {
                if (this.obj.common.max !== undefined) {
                    return 'slider';
                }
                return 'input';
            }
            return 'text';
        }

        if (this.obj.common.write) {
            return 'input';
        }

        return 'text';
    }

    renderItem(/* error, disabled, defaultValue */) {
        let content: React.JSX.Element | null = null;

        if (this.state.controlType === 'button') {
            let icon: React.JSX.Element | null = null;
            if (this.props.schema.falseImage) {
                icon = getIconByName(this.props.schema.falseImage);
            }

            const text = this.getText(this.props.schema.falseText, this.props.schema.noTranslation) || this.getText(this.props.schema.label, this.props.schema.noTranslation);
            if (!text && icon) {
                content = <IconButton>
                    {icon}
                </IconButton>;
            } else {
                content = <Button
                    startIcon={icon}
                    style={this.props.schema.falseTextStyle}
                >
                    {text || this.getObjectID().split('.').pop()}
                </Button>;
            }
        } else if (this.state.controlType === 'switch') {
            let iconFalse: React.JSX.Element | null = null;
            const textFalse = this.getText(this.props.schema.falseText, this.props.schema.noTranslation);
            if (this.props.schema.falseImage) {
                iconFalse = getIconByName(this.props.schema.falseImage, textFalse ? { marginLeft: 8 } : undefined);
            }
            let iconTrue: React.JSX.Element | null = null;
            const textTrue = this.getText(this.props.schema.trueText, this.props.schema.noTranslation);
            if (this.props.schema.trueImage) {
                iconTrue = getIconByName(this.props.schema.trueImage, textTrue ? { marginRight: 8 } : undefined);
            }

            content = <Switch
                checked={!!this.state.stateValue}
                onChange={async () => {
                    await this.props.socket.setState(this.getObjectID(), !this.state.stateValue, false);
                }}
            />;

            if (textFalse ||
                iconFalse ||
                textTrue ||
                iconTrue
            ) {
                content = <div style={{ display: 'flex' }}>
                    <span style={this.props.schema.falseTextStyle}>
                        {textFalse}
                        {iconFalse}
                    </span>
                    {content}
                    <span style={this.props.schema.trueTextStyle}>
                        {iconTrue}
                        {textTrue}
                    </span>
                </div>;
            }

            const label = this.getText(this.props.schema.label, this.props.schema.noTranslation);
            if (label) {
                content = <div style={{ display: 'flex' }}>
                    {label}
                    {content}
                </div>;
            }
        } else if (this.state.controlType === 'slider') {
            let iconFalse: React.JSX.Element | null = null;
            const textFalse = this.getText(this.props.schema.falseText, this.props.schema.noTranslation);
            if (this.props.schema.falseImage) {
                iconFalse = getIconByName(this.props.schema.falseImage, textFalse ? { marginLeft: 8 } : undefined);
            }
            let iconTrue: React.JSX.Element | null = null;
            const textTrue = this.getText(this.props.schema.trueText, this.props.schema.noTranslation);
            if (this.props.schema.trueImage) {
                iconTrue = getIconByName(this.props.schema.trueImage, textTrue ? { marginRight: 8 } : undefined);
            }

            const min = this.props.schema.min === undefined ? this.obj.common.min || 0 : this.props.schema.min;
            const max = this.props.schema.max === undefined ? (this.obj.common.max === undefined ? 100 : this.obj.common.max) : this.props.schema.max;
            const step = this.props.schema.step === undefined ? this.obj.common.step || 1 : this.props.schema.step;

            content = <Slider
                style={{ width: '100%', flexGrow: 1 }}
                min={min}
                max={max}
                step={step}
                value={this.state.stateValue as number}
                onChange={(e: Event, value: number) => {
                    this.setState({ stateValue: value }, async () => {
                        if (this.controlTimeout) {
                            clearTimeout(this.controlTimeout);
                        }
                        this.controlTimeout = setTimeout(async () => {
                            this.controlTimeout = null;
                            await this.props.socket.setState(this.getObjectID(), value, false);
                        }, this.props.schema.controlDelay || 0);
                    });
                }}
            />;

            if (textFalse ||
                iconFalse ||
                textTrue ||
                iconTrue
            ) {
                content = <div style={{ display: 'flex', width: '100%', flexGrow: 1 }}>
                    <span style={this.props.schema.falseTextStyle}>
                        {textFalse}
                        {iconFalse}
                    </span>
                    {content}
                    <span style={this.props.schema.trueTextStyle}>
                        {iconTrue}
                        {textTrue}
                    </span>
                </div>;
            }
            const label = this.getText(this.props.schema.label, this.props.schema.noTranslation);
            if (label) {
                content = <div style={{ display: 'flex', width: '100%' }}>
                    {label}
                    {content}
                </div>;
            }
        } else if (this.state.controlType === 'input') {
            content = <TextField
                style={{ width: '100%' }}
                value={this.state.stateValue}
                onChange={e => {
                    this.setState({ stateValue: e.target.value }, async () => {
                        if (this.controlTimeout) {
                            clearTimeout(this.controlTimeout);
                        }
                        this.controlTimeout = setTimeout(async () => {
                            this.controlTimeout = null;
                            await this.props.socket.setState(this.getObjectID(), this.state.stateValue, false);
                        }, this.props.schema.controlDelay || 0);
                    });
                }}
                label={this.getText(this.props.schema.label)}
                helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
            />;
        } else if (this.obj.common.type === 'number') {
            const min = this.props.schema.min === undefined ? this.obj.common.min || 0 : this.props.schema.min;
            const max = this.props.schema.max === undefined ? (this.obj.common.max === undefined ? 100 : this.obj.common.max) : this.props.schema.max;
            const step = this.props.schema.step === undefined ? this.obj.common.step || 1 : this.props.schema.step;

            content = <TextField
                style={{ width: '100%' }}
                value={this.state.stateValue}
                type="number"
                inputProps={{ min, max, step }}
                onChange={e => {
                    this.setState({ stateValue: e.target.value }, async () => {
                        if (this.controlTimeout) {
                            clearTimeout(this.controlTimeout);
                        }
                        this.controlTimeout = setTimeout(async () => {
                            this.controlTimeout = null;
                            const val = parseFloat(this.state.stateValue as unknown as string);
                            await this.props.socket.setState(this.getObjectID(), val, false);
                        }, this.props.schema.controlDelay || 0);
                    });
                }}
                label={this.getText(this.props.schema.label)}
                helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
            />;
        } else if (this.obj.common.type === 'boolean') {
            let icon: React.JSX.Element | null = null;
            let text: string;
            let style: React.CSSProperties | undefined;
            if (!this.state.stateValue) {
                text = this.getText(this.props.schema.falseText, this.props.schema.noTranslation);
                if (this.props.schema.falseImage) {
                    icon = getIconByName(this.props.schema.falseImage, text ? { marginLeft: 8 } : undefined);
                }
                style = this.props.schema.falseTextStyle;
            } else {
                text = this.getText(this.props.schema.trueText, this.props.schema.noTranslation);
                if (this.props.schema.trueImage) {
                    icon = getIconByName(this.props.schema.falseImage, text ? { marginRight: 8 } : undefined);
                }
                style = this.props.schema.trueTextStyle;
            }
            const label = this.getText(this.props.schema.label, this.props.schema.noTranslation);
            content = <div style={style}>
                {label}
                {label ? <span style={{ marginRight: 8 }}>:</span> : null}
                {icon}
                {text || (this.state.stateValue ? I18n.t('ra_true') : I18n.t('ra_false'))}
            </div>;
        } else {
            const label = this.getText(this.props.schema.label, this.props.schema.noTranslation);
            const unit = this.getText(this.props.schema.unit, this.props.schema.noTranslation) || this.obj.common.unit;
            content = <div>
                {label}
                {label ? <span style={{ marginRight: 8 }}>:</span> : null}
                {this.state.stateValue}
                {unit ? <span style={{ opacity: 0.7 }}>{unit}</span> : null}
            </div>;
        }

        return content;
    }
}

export default ConfigState;
