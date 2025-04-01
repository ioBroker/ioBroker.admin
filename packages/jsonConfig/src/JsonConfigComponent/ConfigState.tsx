import React, { type JSX } from 'react';

import { TextField, IconButton, Button, Switch, Slider, Box } from '@mui/material';

import { I18n, Icon, type IobTheme } from '@iobroker/adapter-react-v5';

import type { ConfigItemState } from '../types';
import getIconByName from './Icons';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

function valueBlinkOnce(theme: IobTheme, color?: string | boolean): any {
    if (typeof color === 'string') {
        return {
            '@keyframes newStateAnimationOnceColor': {
                '0%': {
                    color,
                },
                '100%': {
                    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                },
            },
            animation: 'newStateAnimationOnceColor 2s ease-in-out',
        };
    }
    return {
        '@keyframes newStateAnimationOnce': {
            '0%': {
                color: '#00f900',
            },
            '80%': {
                color: theme.palette.mode === 'dark' ? '#518851' : '#008000',
            },
            '100%': {
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            },
        },
        animation: 'newStateAnimationOnce 2s ease-in-out',
    };
}

interface ConfigStateProps extends ConfigGenericProps {
    schema: ConfigItemState;
}

interface ConfigStateState extends ConfigGenericState {
    stateValue?: string | number | boolean | null;
    controlType?: 'text' | 'html' | 'input' | 'slider' | 'select' | 'button' | 'switch' | 'number';
    obj?: ioBroker.Object | null;
}

class ConfigState extends ConfigGeneric<ConfigStateProps, ConfigStateState> {
    controlTimeout: ReturnType<typeof setTimeout> | null = null;

    delayedUpdate: { timer: ReturnType<typeof setTimeout> | null; value: string | boolean | number | null } = {
        timer: null,
        value: null,
    };

    getObjectID(): string {
        let oid = this.props.schema.oid;
        if (oid.includes('${')) {
            oid = this.getPattern(oid, null, true);
        }

        if (this.props.schema.foreign) {
            return oid;
        }

        return `${this.props.schema.system ? 'system.adapter.' : ''}${this.props.oContext.adapterName}.${this.props.oContext.instance || 0}.${oid}`;
    }

    async componentDidMount(): Promise<void> {
        super.componentDidMount();
        const obj: ioBroker.StateObject = (await this.props.oContext.socket.getObject(
            this.getObjectID(),
        )) as ioBroker.StateObject;
        const controlType = this.props.schema.control || this.detectType(obj);

        try {
            const state = await this.props.oContext.socket.getState(this.getObjectID());

            this.setState({ stateValue: state ? state.val : null, controlType, obj }, async () => {
                await this.props.oContext.socket.subscribeState(this.getObjectID(), this.onStateChanged);
            });
        } catch (e) {
            console.error(`Cannot get state ${this.getObjectID()}: ${e}`);
            this.setState({ controlType, obj });
        }
    }

    componentWillUnmount(): void {
        super.componentWillUnmount();
        this.props.oContext.socket.unsubscribeState(this.getObjectID(), this.onStateChanged);
        if (this.delayedUpdate.timer) {
            clearTimeout(this.delayedUpdate.timer);
            this.delayedUpdate.timer = null;
        }

        if (this.controlTimeout) {
            clearTimeout(this.controlTimeout);
            this.controlTimeout = null;
            this.props.oContext.socket
                .setState(this.getObjectID(), this.state.stateValue, false)
                .catch((e: Error) => console.error(`Cannot control value: ${e.toString()}`));
        }
    }

    onStateChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        let val = state ? state.val : null;
        if (this.state.controlType === 'button' || this.state.controlType === 'switch') {
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

    detectType(obj: ioBroker.StateObject): 'button' | 'switch' | 'slider' | 'input' | 'text' {
        obj = obj || ({} as ioBroker.StateObject);
        obj.common = obj.common || ({} as ioBroker.StateCommon);

        // read an object
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

    renderItem(_error: string, disabled: boolean /*, defaultValue */): JSX.Element {
        if (!this.state.obj) {
            return null;
        }

        let content: JSX.Element;

        if (
            this.state.controlType === 'button' ||
            (!this.state.controlType &&
                this.state.obj.common.type === 'boolean' &&
                ((this.state.obj.common.write && this.state.obj.common.read === false) ||
                    this.state.obj.common.role?.includes('button')))
        ) {
            let icon: JSX.Element | null = null;
            if (this.props.schema.falseImage) {
                icon = getIconByName(this.props.schema.falseImage);
            }

            const text = this.getText(
                this.props.schema.falseText || this.props.schema.label,
                this.props.schema.noTranslation,
            );

            if (!text && icon) {
                content = (
                    <IconButton
                        style={this.props.schema.falseTextStyle}
                        disabled={!!this.props.schema.readOnly}
                        onClick={async () => {
                            if (this.props.schema.confirm) {
                                this.setState({
                                    confirmDialog: true,
                                    confirmCallback: async (result: boolean) => {
                                        if (result) {
                                            await this.props.oContext.socket.setState(
                                                this.getObjectID(),
                                                this.props.schema.buttonValue !== undefined
                                                    ? this.props.schema.buttonValue
                                                    : true,
                                                false,
                                            );
                                        }
                                    },
                                });
                            } else {
                                await this.props.oContext.socket.setState(
                                    this.getObjectID(),
                                    this.props.schema.buttonValue !== undefined ? this.props.schema.buttonValue : true,
                                    false,
                                );
                            }
                        }}
                    >
                        {icon}
                    </IconButton>
                );
            } else {
                content = (
                    <Button
                        variant={this.props.schema.variant || 'contained'}
                        startIcon={icon}
                        style={this.props.schema.falseTextStyle}
                        disabled={disabled || !!this.props.schema.readOnly}
                        onClick={async () => {
                            if (this.props.schema.confirm) {
                                this.setState({
                                    confirmDialog: true,
                                    confirmCallback: async (result: boolean) => {
                                        if (result) {
                                            await this.props.oContext.socket.setState(
                                                this.getObjectID(),
                                                this.props.schema.buttonValue !== undefined
                                                    ? this.props.schema.buttonValue
                                                    : true,
                                                false,
                                            );
                                        }
                                    },
                                });
                            } else {
                                await this.props.oContext.socket.setState(
                                    this.getObjectID(),
                                    this.props.schema.buttonValue !== undefined ? this.props.schema.buttonValue : true,
                                    false,
                                );
                            }
                        }}
                    >
                        {text || this.getObjectID().split('.').pop()}
                    </Button>
                );
            }
        } else if (
            this.state.controlType === 'input' ||
            (!this.state.controlType && this.state.obj.common.write && this.state.obj.common.type === 'string')
        ) {
            content = (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'baseline' }}>
                    <TextField
                        style={{ flex: 1 }}
                        value={this.state.stateValue}
                        variant="standard"
                        slotProps={{
                            input: {
                                endAdornment:
                                    this.getText(this.props.schema.unit, this.props.schema.noTranslation) ||
                                    this.state.obj.common.unit ||
                                    undefined,
                            },
                            htmlInput: {
                                readOnly: !!this.props.schema.readOnly,
                            },
                        }}
                        onKeyUp={e => {
                            if (this.props.schema.setOnEnterKey && e.key === 'Enter') {
                                void this.props.oContext.socket.setState(
                                    this.getObjectID(),
                                    this.state.stateValue,
                                    false,
                                );
                            }
                        }}
                        onChange={e => {
                            this.setState({ stateValue: e.target.value }, (): void => {
                                if (this.props.schema.setOnEnterKey || this.props.schema.showEnterButton) {
                                    return;
                                }
                                if (this.controlTimeout) {
                                    clearTimeout(this.controlTimeout);
                                }
                                this.controlTimeout = setTimeout(async () => {
                                    this.controlTimeout = null;
                                    await this.props.oContext.socket.setState(
                                        this.getObjectID(),
                                        this.state.stateValue,
                                        false,
                                    );
                                }, this.props.schema.controlDelay || 0);
                            });
                        }}
                        label={this.getText(this.props.schema.label)}
                        helperText={this.renderHelp(
                            this.props.schema.help,
                            this.props.schema.helpLink,
                            this.props.schema.noTranslation,
                        )}
                    />
                    {this.props.schema.showEnterButton && (
                        <Button
                            variant="outlined"
                            onClick={() => {
                                void this.props.oContext.socket.setState(
                                    this.getObjectID(),
                                    this.state.stateValue,
                                    false,
                                );
                            }}
                        >
                            {this.getText(
                                typeof this.props.schema.showEnterButton === 'string'
                                    ? this.props.schema.showEnterButton
                                    : 'Set',
                            )}
                        </Button>
                    )}
                </div>
            );
        } else {
            let fontSize: number | undefined;
            if (this.props.schema.size === 'normal') {
                fontSize = 16;
            } else if (this.props.schema.size === 'large') {
                fontSize = 20;
            } else if (typeof this.props.schema.size === 'number') {
                fontSize = this.props.schema.size;
            }
            let label = this.getText(this.props.schema.label, this.props.schema.noTranslation);

            const divStyle: React.CSSProperties = {
                display: 'flex',
                alignItems: 'center',
                fontSize: fontSize || '1rem',
                gap: 8,
            };

            if (!this.props.schema.narrow) {
                divStyle.width = '100%';
                divStyle.justifyContent = 'space-between';
            }

            if (label.trim()) {
                if (!label.trim().endsWith(':') && this.props.schema.addColon) {
                    label = `${label.trim()}:`;
                }
            }

            let blinkStyle: React.CSSProperties | undefined;
            if (this.props.schema.blinkOnUpdate) {
                blinkStyle = valueBlinkOnce(this.props.oContext.theme, this.props.schema.blinkOnUpdate);
            }

            let labelIcon: React.JSX.Element | undefined;
            if (this.props.schema.labelIcon) {
                labelIcon = (
                    <Icon
                        src={this.props.schema.labelIcon}
                        style={{ marginRight: 4 }}
                    />
                );
            }

            let labelControl: React.JSX.Element | undefined;
            if (label && labelIcon) {
                labelControl = (
                    <div style={{ whiteSpace: 'nowrap' }}>
                        {labelIcon}
                        {label}
                    </div>
                );
            } else if (label) {
                labelControl = <div style={{ whiteSpace: 'nowrap' }}>{label}</div>;
            } else if (labelIcon) {
                labelControl = labelIcon;
            }

            if (
                this.state.controlType === 'switch' ||
                (!this.state.controlType &&
                    this.state.obj.common.type === 'boolean' &&
                    ((this.state.obj.common.write && this.state.obj.common.read !== false) ||
                        this.state.obj.common.role?.includes('switch')))
            ) {
                let iconFalse: JSX.Element | null = null;
                const textFalse = this.getText(this.props.schema.falseText, this.props.schema.noTranslation);
                if (this.props.schema.falseImage) {
                    iconFalse = getIconByName(this.props.schema.falseImage, textFalse ? { marginLeft: 8 } : undefined);
                }
                let iconTrue: JSX.Element | null = null;
                const textTrue = this.getText(this.props.schema.trueText, this.props.schema.noTranslation);
                if (this.props.schema.trueImage) {
                    iconTrue = getIconByName(this.props.schema.trueImage, textTrue ? { marginRight: 8 } : undefined);
                }

                content = (
                    <Switch
                        checked={!!this.state.stateValue}
                        disabled={!!this.props.schema.readOnly}
                        onChange={async () => {
                            if (this.props.schema.confirm) {
                                this.setState({
                                    confirmDialog: true,
                                    confirmCallback: async (result: boolean) => {
                                        if (result) {
                                            await this.props.oContext.socket.setState(
                                                this.getObjectID(),
                                                !this.state.stateValue,
                                                false,
                                            );
                                        }
                                    },
                                });
                            } else {
                                await this.props.oContext.socket.setState(
                                    this.getObjectID(),
                                    !this.state.stateValue,
                                    false,
                                );
                            }
                        }}
                    />
                );

                if (textFalse || iconFalse || textTrue || iconTrue) {
                    content = (
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                            <span style={this.props.schema.falseTextStyle}>
                                {textFalse}
                                {iconFalse}
                            </span>
                            {content}
                            <span style={this.props.schema.trueTextStyle}>
                                {iconTrue}
                                {textTrue}
                            </span>
                        </div>
                    );
                }

                if (labelControl) {
                    content = (
                        <div style={divStyle}>
                            {labelControl}
                            {content}
                        </div>
                    );
                }
            } else if (
                this.state.controlType === 'slider' ||
                (!this.state.controlType &&
                    this.state.obj.common.type === 'number' &&
                    ((this.state.obj.common.write &&
                        (this.state.obj.common.max !== undefined || this.state.obj.common.unit === '%')) ||
                        this.state.obj.common.role?.includes('slider') ||
                        this.state.obj.common.role?.includes('dimmer') ||
                        this.state.obj.common.role?.includes('blind')))
            ) {
                let iconFalse: JSX.Element | null = null;
                const textFalse = this.getText(this.props.schema.falseText, this.props.schema.noTranslation);
                if (this.props.schema.falseImage) {
                    iconFalse = getIconByName(this.props.schema.falseImage, textFalse ? { marginLeft: 8 } : undefined);
                }
                let iconTrue: JSX.Element | null = null;
                const textTrue = this.getText(this.props.schema.trueText, this.props.schema.noTranslation);
                if (this.props.schema.trueImage) {
                    iconTrue = getIconByName(this.props.schema.trueImage, textTrue ? { marginRight: 8 } : undefined);
                }

                const min =
                    this.props.schema.min === undefined ? this.state.obj.common.min || 0 : this.props.schema.min;
                const max =
                    this.props.schema.max === undefined
                        ? this.state.obj.common.max === undefined
                            ? 100
                            : this.state.obj.common.max
                        : this.props.schema.max;
                const step =
                    this.props.schema.step === undefined ? this.state.obj.common.step || 1 : this.props.schema.step;

                content = (
                    <Slider
                        style={{ width: '100%', flexGrow: 1 }}
                        min={min}
                        max={max}
                        disabled={!!this.props.schema.readOnly}
                        step={step}
                        value={this.state.stateValue as number}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value: number) =>
                            `${value}${this.getText(this.props.schema.unit, this.props.schema.noTranslation) || this.state.obj.common.unit || ''}`
                        }
                        onChange={(_e: Event, value: number) => {
                            this.setState({ stateValue: value }, (): void => {
                                if (this.controlTimeout) {
                                    clearTimeout(this.controlTimeout);
                                }
                                this.controlTimeout = setTimeout(async () => {
                                    console.log(`${Date.now()} Send new value: ${this.state.stateValue}`);
                                    this.controlTimeout = null;
                                    await this.props.oContext.socket.setState(
                                        this.getObjectID(),
                                        this.state.stateValue,
                                        false,
                                    );
                                }, this.props.schema.controlDelay || 0);
                            });
                        }}
                    />
                );

                if (textFalse || iconFalse || textTrue || iconTrue) {
                    content = (
                        <div
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
                        </div>
                    );
                }
                if (labelControl) {
                    content = (
                        <div style={divStyle}>
                            {labelControl}
                            {content}
                        </div>
                    );
                }
            } else if (this.state.obj.common.type === 'number' && this.state.obj.common.write) {
                // Auto-detection of the type
                const min =
                    this.props.schema.min === undefined
                        ? this.state.obj.common.min === undefined
                            ? undefined
                            : this.state.obj.common.min
                        : this.props.schema.min;
                const max =
                    this.props.schema.max === undefined
                        ? this.state.obj.common.max === undefined
                            ? undefined
                            : this.state.obj.common.max
                        : this.props.schema.max;
                const step =
                    this.props.schema.step === undefined
                        ? this.state.obj.common.step === undefined
                            ? undefined
                            : this.state.obj.common.step
                        : this.props.schema.step;

                content = (
                    <TextField
                        variant="standard"
                        style={{ width: '100%' }}
                        value={this.state.stateValue}
                        type="number"
                        slotProps={{
                            htmlInput: { min, max, step, readOnly: !!this.props.schema.readOnly },
                            input: {
                                endAdornment:
                                    this.getText(this.props.schema.unit, this.props.schema.noTranslation) ||
                                    this.state.obj.common.unit ||
                                    undefined,
                            },
                        }}
                        onChange={e => {
                            this.setState({ stateValue: e.target.value }, (): void => {
                                if (this.controlTimeout) {
                                    clearTimeout(this.controlTimeout);
                                }
                                this.controlTimeout = setTimeout(async () => {
                                    this.controlTimeout = null;
                                    const val = parseFloat(this.state.stateValue as unknown as string);
                                    await this.props.oContext.socket.setState(this.getObjectID(), val, false);
                                }, this.props.schema.controlDelay || 0);
                            });
                        }}
                        label={this.getText(this.props.schema.label, this.props.schema.noTranslation)}
                        helperText={this.renderHelp(
                            this.props.schema.help,
                            this.props.schema.helpLink,
                            this.props.schema.noTranslation,
                        )}
                    />
                );
            } else if (this.state.obj.common.type === 'boolean') {
                let icon: JSX.Element | null = null;
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
                style = Object.assign(divStyle, style);

                content = (
                    <div style={style}>
                        {labelControl}
                        <Box
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            sx={blinkStyle}
                            key={this.props.schema.blinkOnUpdate ? text : undefined}
                        >
                            {icon}
                            {text || (this.state.stateValue ? I18n.t('ra_true') : I18n.t('ra_false'))}
                        </Box>
                    </div>
                );
            } else {
                // text or HTML
                const unit =
                    this.getText(this.props.schema.unit, this.props.schema.noTranslation) || this.state.obj.common.unit;

                let value;
                let key: string;
                if (this.state.controlType === 'html') {
                    key = (this.state.stateValue || '').toString();
                    value = <span dangerouslySetInnerHTML={{ __html: this.state.stateValue as string }} />;
                } else if (this.state.stateValue === null) {
                    value = 'null';
                    key = value;
                } else if (this.state.stateValue === undefined) {
                    value = 'undefined';
                    key = value;
                } else {
                    value = this.state.stateValue.toString();
                    key = value;
                }

                content = (
                    <div style={divStyle}>
                        {labelControl}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <Box
                                sx={blinkStyle}
                                key={this.props.schema.blinkOnUpdate ? key : undefined}
                            >
                                {value}
                            </Box>
                            {unit ? <span style={{ opacity: 0.7, fontSize: 'smaller' }}>{unit}</span> : null}
                        </div>
                    </div>
                );
            }
        }

        return content;
    }
}

export default ConfigState;
