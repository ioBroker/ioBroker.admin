import React, { Component, type JSX } from 'react';

import { TextField, Button, Box, Tooltip, IconButton, InputAdornment, Alert } from '@mui/material';

import {
    Check as IconCheck,
    Visibility as IconVisibility,
    VisibilityOff as IconVisibilityOff,
} from '@mui/icons-material';

import { type Translate } from '@iobroker/gui-components';

import AdminUtils from '../../helpers/AdminUtils';

import backItUpIcon from '../../assets/backitup.png';
import WizardStepFrame from './WizardStepFrame';

const PASSWORD_INPUT_ID = 'admin_password_repeat';

interface WizardPasswordTabProps {
    t: Translate;
    /** Already entered password, so the step can be visited again */
    password: string;
    /** The password is currently written to the server */
    requesting: boolean;
    /** Go one step back */
    onBack?: () => void;
    onDone: (password: string, goToBackItUp?: boolean) => void;
}

interface WizardPasswordTabState {
    password: string;
    passwordRepeat: string;
    errorPassword: string;
    errorPasswordRepeat: string;
    showPassword: boolean;
}

export default class WizardPasswordTab extends Component<WizardPasswordTabProps, WizardPasswordTabState> {
    constructor(props: WizardPasswordTabProps) {
        super(props);

        this.state = {
            password: props.password,
            passwordRepeat: props.password,
            errorPassword: '',
            errorPasswordRepeat: '',
            showPassword: false,
        };
    }

    /**
     * Validate the password. An empty field is not shown as an error, as the user did not type anything yet
     *
     * @param password the entered password
     * @param passwordRepeat the repeated password
     */
    checkPassword(password: string, passwordRepeat?: string): string {
        if (!password && !passwordRepeat) {
            return '';
        }
        const error = AdminUtils.checkPassword(password, passwordRepeat);
        return error ? this.props.t(error) : '';
    }

    /** True if the entered passwords are valid and can be saved */
    isValid(): boolean {
        return (
            !!this.state.password &&
            this.state.password === this.state.passwordRepeat &&
            !this.state.errorPassword &&
            !this.state.errorPasswordRepeat
        );
    }

    renderVisibilityButton(): JSX.Element {
        return (
            <InputAdornment position="end">
                <IconButton
                    tabIndex={-1}
                    size="small"
                    edge="end"
                    disabled={this.props.requesting}
                    aria-label={this.props.t('Show password')}
                    onClick={() => this.setState({ showPassword: !this.state.showPassword })}
                >
                    {this.state.showPassword ? <IconVisibilityOff /> : <IconVisibility />}
                </IconButton>
            </InputAdornment>
        );
    }

    render(): JSX.Element {
        const type = this.state.showPassword ? 'text' : 'password';

        return (
            <WizardStepFrame
                title={this.props.t('You must set the administrator password')}
                onBack={this.props.onBack}
                busy={this.props.requesting}
                secondaryActions={
                    <Tooltip
                        title={this.props.t(
                            'If you just want to restore from backup, you can skip the following wizard steps. You will be redirected to BackItUp tab.',
                        )}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <span>
                            <Button
                                variant="outlined"
                                color="grey"
                                disabled={this.props.requesting}
                                onClick={() => this.props.onDone('', true)}
                                startIcon={
                                    <img
                                        src={backItUpIcon}
                                        style={{ width: 22 }}
                                        alt="BackItUp"
                                    />
                                }
                            >
                                {this.props.t('Restore from backup')}
                            </Button>
                        </span>
                    </Tooltip>
                }
                actions={
                    <Button
                        color="primary"
                        variant="contained"
                        loading={this.props.requesting}
                        onClick={() => this.props.onDone(this.state.password)}
                        disabled={!this.isValid()}
                        startIcon={<IconCheck />}
                    >
                        {this.props.t('Set administrator password')}
                    </Button>
                }
            >
                <Box
                    component="form"
                    noValidate
                    autoComplete="off"
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 440 }}
                >
                    <Alert
                        severity="info"
                        variant="outlined"
                    >
                        {this.props.t(
                            'Password must be at least 8 characters long and have numbers, upper and lower case letters',
                        )}
                    </Alert>
                    <TextField
                        disabled
                        label={this.props.t('Administrator name')}
                        value="admin"
                        slotProps={{ input: { readOnly: true } }}
                        helperText={this.props.t('Administrator name cannot be changed')}
                    />
                    <TextField
                        autoFocus
                        disabled={this.props.requesting}
                        label={this.props.t('Administrator password')}
                        type={type}
                        value={this.state.password}
                        error={!!this.state.errorPassword}
                        helperText={this.state.errorPassword || ' '}
                        slotProps={{
                            input: {
                                autoComplete: 'new-password',
                                endAdornment: this.renderVisibilityButton(),
                            },
                            htmlInput: { autoComplete: 'off' },
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && this.state.password && !this.state.errorPassword) {
                                window.document.getElementById(PASSWORD_INPUT_ID)?.focus();
                            }
                        }}
                        onChange={e =>
                            this.setState({
                                password: e.target.value,
                                errorPassword: this.checkPassword(e.target.value),
                                errorPasswordRepeat: this.checkPassword(e.target.value, this.state.passwordRepeat),
                            })
                        }
                    />
                    <TextField
                        disabled={this.props.requesting}
                        label={this.props.t('Repeat administrator password')}
                        type={type}
                        value={this.state.passwordRepeat}
                        error={!!this.state.errorPasswordRepeat}
                        helperText={this.state.errorPasswordRepeat || ' '}
                        slotProps={{
                            input: {
                                autoComplete: 'new-password',
                                endAdornment: this.renderVisibilityButton(),
                            },
                            htmlInput: { autoComplete: 'off', id: PASSWORD_INPUT_ID },
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && this.isValid()) {
                                this.props.onDone(this.state.password);
                            }
                        }}
                        onChange={e =>
                            this.setState({
                                passwordRepeat: e.target.value,
                                errorPasswordRepeat: this.checkPassword(this.state.password, e.target.value),
                            })
                        }
                    />
                </Box>
            </WizardStepFrame>
        );
    }
}
