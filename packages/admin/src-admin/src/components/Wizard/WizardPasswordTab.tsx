import React, { createRef, Component } from 'react';
import { withStyles } from '@mui/styles';

import {
    TextField,
    Grid,
    Toolbar,
    Button,
    Paper, Box,
} from '@mui/material';

import {
    Check as IconCheck,
} from '@mui/icons-material';

import {type IobTheme, type Translate, withWidth} from '@iobroker/adapter-react-v5';

import AdminUtils from '../../Utils';

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
    onDone: (password: string) => void;
}

interface WizardPasswordTabState {
    password: string;
    passwordRepeat: string;
    errorPassword: boolean | string;
    errorPasswordRepeat: boolean | string;
}

class WizardPasswordTab extends Component<WizardPasswordTabProps, WizardPasswordTabState> {
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

    componentDidMount() {
        this.focusRef.current && this.focusRef.current.focus();
    }

    render() {
        return <Paper style={styles.paper}>
            <form style={styles.form} noValidate autoComplete="off">
                <Grid container direction="column">
                    <Grid item>
                        <Box component="h2" sx={styles.title}>{ this.props.t('You must set the administrator password') }</Box>
                    </Grid>
                    <Grid item>
                        <TextField
                            variant="standard"
                            disabled
                            style={styles.input}
                            label={this.props.t('Administrator name')}
                            value="admin"
                            InputProps={{ readOnly: true }}
                            helperText={this.props.t('Administrator name cannot be changed')}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            variant="standard"
                            inputProps={{
                                autoComplete: 'new-password',
                                form: {
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
                                const errorPasswordRepeat = AdminUtils.checkPassword(e.target.value, this.state.passwordRepeat);
                                this.setState({
                                    password: e.target.value,
                                    errorPassword: errorPassword ? this.props.t(errorPassword) : false,
                                    errorPasswordRepeat: errorPasswordRepeat ? this.props.t(errorPasswordRepeat) : false,
                                });
                            }}
                            helperText={this.props.t('Password must be at least 8 characters long and have numbers, upper and lower case letters')}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            variant="standard"
                            inputProps={{
                                autoComplete: 'new-password',
                                form: { autoComplete: 'off' },
                                id: 'admin_password',
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && this.state.password && !this.state.errorPassword && !this.state.errorPasswordRepeat) {
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
                                const errorPasswordRepeat = AdminUtils.checkPassword(this.state.password, e.target.value);
                                this.setState({
                                    passwordRepeat: e.target.value,
                                    errorPasswordRepeat: errorPasswordRepeat ? this.props.t(errorPasswordRepeat) : false,
                                });
                            }}
                            helperText={this.state.errorPasswordRepeat || ''}
                        />
                    </Grid>
                </Grid>
            </form>
            <Toolbar style={styles.toolbar}>
                <div style={styles.grow} />
                <Button
                    color="primary"
                    variant="contained"
                    onClick={() => this.props.onDone(this.state.password)}
                    disabled={!this.state.passwordRepeat || !!this.state.errorPasswordRepeat || !!this.state.errorPassword}
                    startIcon={<IconCheck />}
                >
                    {this.props.t('Set administrator password')}
                </Button>
            </Toolbar>
        </Paper>;
    }
}

export default withWidth()(withStyles(styles)(WizardPasswordTab));
