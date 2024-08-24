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
    obj?: ioBroker.Object | null;
}

class ConfigState extends ConfigGeneric<ConfigStateProps, ConfigStateState> {
    controlTimeout: ReturnType<typeof setTimeout> | null = null;

    delayedUpdate: { timer: ReturnType<typeof setTimeout> | null, value: string | boolean | number | null } = { timer: null, value: null };

    getObjectID() {
        return `${this.props.schema.system ? 'system.adapter.' : ''}${this.props.adapterName}.${this.props.instance}.${this.props.schema.oid}`;
    }

    async componentDidMount() {
        super.componentDidMount();
        const obj: ioBroker.StateObject = await this.props.socket.getObject(this.getObjectID()) as ioBroker.StateObject;
        const controlType = this.props.schema.control || await this.detectType(obj);

        const state = await this.props.socket.getState(this.getObjectID());

        this.setState({ stateValue: state ? state.val : null, controlType, obj }, async () => {
            await this.props.socket.subscribeState(this.getObjectID(), this.onStateChanged);
        });
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.props.socket.unsubscribeState(this.getObjectID(), this.onStateChanged);
        if (this.delayedUpdate.timer) {
            clearTimeout(this.delayedUpdate.timer);
            this.delayedUpdate.timer = null;
        }

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
            if (this.state.stateValue !== val) {
                this.setState({ stateValue: val });
            }
        } else if (val !== null && (this.state.controlType === 'slider' || this.state.controlType === 'number')) {
            val = parseFloat(val as unknown as string);
            console.log(`${Date.now()} Received new value: ${val}`);
            if (val !== this.state.stateValue) {
                if (this.delayedUpdate.timer) {
                    clearTimeout(this.delayedUpdate.timer);
                    this.delayedUpdate.timer = null;
                }
                this.delayedUpdate.value = val;
                this.delayedUpdate.timer = setTimeout(() => {
                    this.setState({ stateValue: this.delayedUpdate.value });
                }, 500);
            } else if (this.delayedUpdate.timer) {
                clearTimeout(this.delayedUpdate.timer);
                this.delayedUpdate.timer = null;
            }
        } else if (this.state.stateValue.toString() !== val.toString()) {
            this.setState({ stateValue: val });
        }
    };

    async detectType(obj: ioBroker.StateObject) {
        obj = obj || {} as ioBroker.StateObject;
        obj.common = obj.common || {} as ioBroker.StateCommon;

        // read object
        if (obj.common.type === 'boolean') {
            if (this.props.schema.controlled !== false) {
                if (obj.common.read === false || this.props.schema.controlled === true) {
                    return 'button';
                }
                if (obj.common.write || this.props.schema.controlled === true) {
                    return 'switch';
                }
            }

            return 'text';
        }

        if (obj.common.type === 'number' && this.props.schema.controlled !== false) {
            if (obj.common.write || this.props.schema.controlled === true) {
                if (obj.common.max !== undefined) {
                    return 'slider';
                }
                return 'input';
            }
            return 'text';
        }

        if (obj.common.write && this.props.schema.controlled !== false) {
            return 'input';
        }

        return 'text';
    }

    renderItem(/* error, disabled, defaultValue */) {
        if (!this.state.obj) {
            return null;
        }

        let content: React.JSX.Element;

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
                    variant={this.props.schema.variant || 'contained'}
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
                content = <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
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
                content = <div style={{ display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
                    <span style={{ marginRight: 8 }}>{label}</span>
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

            const min = this.props.schema.min === undefined ? this.state.obj.common.min || 0 : this.props.schema.min;
            const max = this.props.schema.max === undefined ? (this.state.obj.common.max === undefined ? 100 : this.state.obj.common.max) : this.props.schema.max;
            const step = this.props.schema.step === undefined ? this.state.obj.common.step || 1 : this.props.schema.step;

            content = <Slider
                style={{ width: '100%', flexGrow: 1 }}
                min={min}
                max={max}
                step={step}
                value={this.state.stateValue as number}
                valueLabelDisplay="auto"
                valueLabelFormat={(value: number) => `${value}${this.getText(this.props.schema.unit, this.props.schema.noTranslation) || this.state.obj.common.unit || ''}`}
                onChange={(_e: Event, value: number) => {
                    this.setState({ stateValue: value }, async () => {
                        if (this.controlTimeout) {
                            clearTimeout(this.controlTimeout);
                        }
                        this.controlTimeout = setTimeout(async () => {
                            console.log(`${Date.now()} Send new value: ${this.state.stateValue}`);
                            this.controlTimeout = null;
                            await this.props.socket.setState(this.getObjectID(), this.state.stateValue, false);
                        }, this.props.schema.controlDelay || 0);
                    });
                }}
            />;

            if (textFalse ||
                iconFalse ||
                textTrue ||
                iconTrue
            ) {
                content = <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        flexGrow: 1,
                        alignItems: 'center',
                    }}
                >
                    <span style={{ marginRight: 16, ...this.props.schema.falseTextStyle }}>
                        {textFalse}
                        {iconFalse}
                    </span>
                    {content}
                    <span style={{ marginLeft: 16, ...this.props.schema.trueTextStyle }}>
                        {iconTrue}
                        {textTrue}
                    </span>
                </div>;
            }
            const label = this.getText(this.props.schema.label, this.props.schema.noTranslation);
            if (label) {
                content = <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                    <span style={{ whiteSpace: 'nowrap', marginRight: 8, fontSize: '1rem' }}>{label}</span>
                    {content}
                </div>;
            }
        } else if (this.state.controlType === 'input') {
            content = <TextField
                style={{ width: '100%' }}
                value={this.state.stateValue}
                variant="standard"
                InputProps={{
                    endAdornment: this.getText(this.props.schema.unit, this.props.schema.noTranslation) || this.state.obj.common.unit || undefined,
                }}
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
        } else if (this.state.obj.common.type === 'number') {
            const min = this.props.schema.min === undefined ? this.state.obj.common.min || 0 : this.props.schema.min;
            const max = this.props.schema.max === undefined ? (this.state.obj.common.max === undefined ? 100 : this.state.obj.common.max) : this.props.schema.max;
            const step = this.props.schema.step === undefined ? this.state.obj.common.step || 1 : this.props.schema.step;

            content = <TextField
                variant="standard"
                style={{ width: '100%' }}
                value={this.state.stateValue}
                type="number"
                inputProps={{ min, max, step }}
                // eslint-disable-next-line react/jsx-no-duplicate-props
                InputProps={{
                    endAdornment: this.getText(this.props.schema.unit, this.props.schema.noTranslation) || this.state.obj.common.unit || undefined,
                }}
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
        } else if (this.state.obj.common.type === 'boolean') {
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
            content = <div style={{ fontSize: '1rem', ...style }}>
                {label}
                {label ? <span style={{ marginRight: 8 }}>:</span> : null}
                {icon}
                {text || (this.state.stateValue ? I18n.t('ra_true') : I18n.t('ra_false'))}
            </div>;
        } else {
            // text or html
            const label = this.getText(this.props.schema.label, this.props.schema.noTranslation);
            const unit = this.getText(this.props.schema.unit, this.props.schema.noTranslation) || this.state.obj.common.unit;
            let value;
            if (this.state.controlType === 'html') {
                // eslint-disable-next-line react/no-danger
                value = <span dangerouslySetInnerHTML={{ __html: this.state.stateValue as string }} />;
            } else if (this.state.stateValue === null) {
                value = 'null';
            } else if (this.state.stateValue === undefined) {
                value = 'undefined';
            } else {
                value = this.state.stateValue;
            }

            content = <div style={{ fontSize: '1rem' }}>
                {label}
                {label ? <span style={{ marginRight: 8 }}>:</span> : null}
                {value}
                {unit ? <span style={{ opacity: 0.7 }}>{unit}</span> : null}
            </div>;
        }

        return content;
    }
}

export default ConfigState;
