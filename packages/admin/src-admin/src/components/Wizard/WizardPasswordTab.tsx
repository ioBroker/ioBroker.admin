import React, { createRef, Component, type JSX } from 'react';

import { TextField, Grid2, Toolbar, Button, Paper, Box, Tooltip } from '@mui/material';

import { Check as IconCheck } from '@mui/icons-material';

import { type IobTheme, type Translate } from '@iobroker/adapter-react-v5';

import AdminUtils from '../../helpers/AdminUtils';

import backItUpIcon from '../../assets/backitup.png';

const TOOLBAR_HEIGHT = 64;

const styles: Record<string, any> = {
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
    title: (theme: IobTheme) => ({
        color: theme.palette.secondary.main,
    }),
    form: {
        height: `calc(100% - ${TOOLBAR_HEIGHT + 8}px)`,
        overflow: 'auto',
    },
    input: {
        width: 400,
        marginBottom: 16,
    },
    grow: {
        flexGrow: 1,
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
        lineHeight: `${TOOLBAR_HEIGHT}px`,
    },
};

interface WizardPasswordTabProps {
    t: Translate;
    onDone: (password: string, goToBackItUp?: boolean) => void;
}

interface WizardPasswordTabState {
    password: string;
    passwordRepeat: string;
    errorPassword: boolean | string;
    errorPasswordRepeat: boolean | string;
}

export default class WizardPasswordTab extends Component<WizardPasswordTabProps, WizardPasswordTabState> {
    private readonly focusRef: React.RefObject<HTMLInputElement>;

    constructor(props: WizardPasswordTabProps) {
        super(props);

        this.state = {
            password: '',
            passwordRepeat: '',
            errorPassword: true,
            errorPasswordRepeat: false,
        };

        this.focusRef = createRef();
    }

    componentDidMount(): void {
        this.focusRef.current?.focus();
    }

    render(): JSX.Element {
        return (
            <Paper style={styles.paper}>
                <form
                    style={styles.form}
                    noValidate
                    autoComplete="off"
                >
                    <Grid2
                        container
                        direction="column"
                    >
                        <Grid2>
                            <Box
                                component="h2"
                                sx={styles.title}
                            >
                                {this.props.t('You must set the administrator password')}
                            </Box>
                        </Grid2>
                        <Grid2>
                            <TextField
                                variant="standard"
                                disabled
                                style={styles.input}
                                label={this.props.t('Administrator name')}
                                value="admin"
                                slotProps={{
                                    input: { readOnly: true },
                                }}
                                helperText={this.props.t('Administrator name cannot be changed')}
                            />
                        </Grid2>
                        <Grid2>
                            <TextField
                                variant="standard"
                                slotProps={{
                                    input: {
                                        autoComplete: 'new-password',
                                    },
                                    htmlInput: {
                                        autoComplete: 'off',
                                    },
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && this.state.password && !this.state.errorPassword) {
                                        const el = window.document.getElementById('admin_password');
                                        if (el) {
                                            el.focus();
                                        }
                                    }
                                }}
                                autoComplete="off"
                                style={styles.input}
                                ref={this.focusRef}
                                label={this.props.t('Administrator password')}
                                type="password"
                                value={this.state.password}
                                error={!!this.state.errorPassword}
                                onChange={e => {
                                    const errorPassword = AdminUtils.checkPassword(e.target.value);
                                    const errorPasswordRepeat = AdminUtils.checkPassword(
                                        e.target.value,
                                        this.state.passwordRepeat,
                                    );
                                    this.setState({
                                        password: e.target.value,
                                        errorPassword: errorPassword ? this.props.t(errorPassword) : false,
                                        errorPasswordRepeat: errorPasswordRepeat
                                            ? this.props.t(errorPasswordRepeat)
                                            : false,
                                    });
                                }}
                                helperText={this.props.t(
                                    'Password must be at least 8 characters long and have numbers, upper and lower case letters',
                                )}
                            />
                        </Grid2>
                        <Grid2>
                            <TextField
                                variant="standard"
                                slotProps={{
                                    input: {
                                        autoComplete: 'new-password',
                                    },
                                    htmlInput: {
                                        autoComplete: 'off',
                                        id: 'admin_password',
                                    },
                                }}
                                onKeyDown={e => {
                                    if (
                                        e.key === 'Enter' &&
                                        this.state.password &&
                                        !this.state.errorPassword &&
                                        !this.state.errorPasswordRepeat
                                    ) {
                                        this.props.onDone(this.state.password);
                                    }
                                }}
                                autoComplete="off"
                                style={styles.input}
                                label={this.props.t('Repeat administrator password')}
                                value={this.state.passwordRepeat}
                                type="password"
                                error={!!this.state.errorPasswordRepeat}
                                onChange={e => {
                                    const errorPasswordRepeat = AdminUtils.checkPassword(
                                        this.state.password,
                                        e.target.value,
                                    );
                                    this.setState({
                                        passwordRepeat: e.target.value,
                                        errorPasswordRepeat: errorPasswordRepeat
                                            ? this.props.t(errorPasswordRepeat)
                                            : false,
                                    });
                                }}
                                helperText={this.state.errorPasswordRepeat || ''}
                            />
                        </Grid2>
                    </Grid2>
                </form>
                <Toolbar
                    style={{
                        height: TOOLBAR_HEIGHT,
                        lineHeight: `${TOOLBAR_HEIGHT}px`,
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <Tooltip
                        title={this.props.t(
                            'If you just want to restore from backup, you can skip the following wizard steps. You will be redirected to BackItUp tab.',
                        )}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <span>
                            <Button
                                variant="contained"
                                color="primary"
                                style={{ opacity: 0.4 }}
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
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={() => this.props.onDone(this.state.password)}
                        disabled={
                            !this.state.passwordRepeat || !!this.state.errorPasswordRepeat || !!this.state.errorPassword
                        }
                        startIcon={<IconCheck />}
                    >
                        {this.props.t('Set administrator password')}
                    </Button>
                </Toolbar>
                <Toolbar style={styles.toolbar}>
                    <div style={styles.grow} />
                </Toolbar>
            </Paper>
        );
    }
}
