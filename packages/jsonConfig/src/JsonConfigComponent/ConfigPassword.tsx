import React, { type JSX } from 'react';

import { TextField, IconButton, InputAdornment } from '@mui/material';

import { Visibility, VisibilityOff } from '@mui/icons-material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemPassword } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    fullWidth: {
        width: '100%',
        display: 'inline-block',
    },
    halfWidth1: {
        width: 'calc(50% - 5px)',
        display: 'inline-block',
        marginRight: 8,
    },
    halfWidth2: {
        width: 'calc(50% - 5px)',
        display: 'inline-block',
    },
};

const PASSWORD_PLACEHOLDER = '____ppp____';

interface ConfigPasswordProps extends ConfigGenericProps {
    schema: ConfigItemPassword;
}

interface ConfigPasswordState extends ConfigGenericState {
    _notEqual?: boolean;
    _repeat?: string;
    _visible?: boolean;
}

class ConfigPassword extends ConfigGeneric<ConfigPasswordProps, ConfigPasswordState> {
    componentDidMount(): void {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({
            _repeat: value ? PASSWORD_PLACEHOLDER : '',
            _visible: false,
            value: value ? PASSWORD_PLACEHOLDER : '',
            _notEqual: false,
        });
    }

    onChangePassword(password?: string, repeatPassword?: string): void {
        if (password === undefined) {
            password = this.state.value;
        }
        if (repeatPassword === undefined) {
            repeatPassword = this.state._repeat;
        }
        const _notEqual = !!this.props.schema.repeat && repeatPassword !== password;
        this.setState({ value: password, _repeat: repeatPassword, _notEqual }, () => {
            if (_notEqual) {
                this.onError(this.props.attr, I18n.t('ra_Passwords are not equal!'));
            } else {
                this.onError(this.props.attr); // clear error
                const mayBePromise = this.onChange(this.props.attr, password);
                if (mayBePromise instanceof Promise) {
                    mayBePromise.catch(e => this.onError(this.props.attr, e));
                }
            }
        });
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */): JSX.Element {
        if (this.state._notEqual === undefined) {
            return null;
        }

        const password = (
            <TextField
                variant="standard"
                fullWidth
                type={this.state._visible && this.state.value !== PASSWORD_PLACEHOLDER ? 'text' : 'password'}
                value={this.state.value}
                error={!!error || this.state._notEqual}
                disabled={!!disabled}
                onChange={e => this.onChangePassword(e.target.value)}
                label={this.getText(this.props.schema.label)}
                slotProps={{
                    input: {
                        autoComplete: 'new-password',
                        endAdornment:
                            this.state.value &&
                            this.state.value !== PASSWORD_PLACEHOLDER &&
                            this.props.schema.visible &&
                            !disabled &&
                            !this.props.schema.readOnly ? (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="large"
                                        tabIndex={-1}
                                        onClick={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            this.setState({ _visible: !this.state._visible });
                                        }}
                                        edge="end"
                                    >
                                        {this.state._visible ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ) : undefined,
                    },
                    htmlInput: {
                        autoComplete: 'new-password',
                        form: { autoComplete: 'off' },
                        maxLength: this.props.schema.maxLength || this.props.schema.max || undefined,
                        readOnly: this.props.schema.readOnly || false,
                    },
                }}
                helperText={
                    this.state._notEqual
                        ? I18n.t('ra_Passwords are not equal!')
                        : this.renderHelp(
                              this.props.schema.help,
                              this.props.schema.helpLink,
                              this.props.schema.noTranslation,
                          )
                }
            />
        );

        if (this.props.schema.repeat && !this.props.schema.readOnly) {
            const passwordRepeat = !this.state._visible ? (
                <TextField
                    variant="standard"
                    fullWidth
                    type="password"
                    value={this.state._repeat}
                    error={!!error || this.state._notEqual}
                    disabled={!!disabled}
                    onChange={e => this.onChangePassword(undefined, e.target.value)}
                    label={`${this.getText(this.props.schema.label)} (${I18n.t('ra_repeat')})`}
                    slotProps={{
                        input: {
                            autoComplete: 'new-password',
                        },
                        htmlInput: {
                            autoComplete: 'new-password',
                            form: { autoComplete: 'off' },
                            maxLength: this.props.schema.maxLength || this.props.schema.max || undefined,
                        },
                    }}
                    helperText={
                        this.state._notEqual
                            ? I18n.t('ra_Passwords are not equal!')
                            : this.renderHelp(
                                  this.props.schema.help,
                                  this.props.schema.helpLink,
                                  this.props.schema.noTranslation,
                              )
                    }
                />
            ) : null;

            return (
                <div style={styles.fullWidth}>
                    <div style={styles.halfWidth1}>{password}</div>
                    <div style={styles.halfWidth2}>{passwordRepeat}</div>
                </div>
            );
        }
        return password;
    }
}

export default ConfigPassword;
