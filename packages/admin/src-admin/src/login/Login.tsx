import React, { Component, type JSX } from 'react';

import {
    Avatar,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    Grid2,
    IconButton,
    Link,
    Paper,
    TextField,
    Typography,
} from '@mui/material';

import { Visibility } from '@mui/icons-material';

import { type IobTheme, I18n } from '@iobroker/adapter-react-v5';

const boxShadow = '0 4px 7px 5px rgb(0 0 0 / 14%), 0 3px 1px 1px rgb(0 0 0 / 12%), 0 1px 5px 0 rgb(0 0 0 / 20%)';

const styles: Record<string, any> = {
    root: {
        padding: 10,
        margin: 'auto',
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        borderRadius: 0,
        justifyContent: 'center',
    },
    paper: (theme: IobTheme) => ({
        backgroundColor: theme.palette.background.paper + (theme.palette.background.paper.length < 7 ? 'd' : 'dd'),
        p: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: 500,
        maxWidth: 380,
        boxShadow,
    }),
    avatar: {
        margin: 8,
        backgroundColor: '#fff',
        width: 100,
        height: 100,
    },
    avatarImg: {
        width: 'calc(100% - 4px)',
        height: 'calc(100% - 4px)',
        padding: 2,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: 8,
    },
    submit: {
        margin: 8,
    },
    alert: {
        marginTop: 16,
        backgroundColor: '#f44336',
        padding: 8,
        color: '#fff',
        borderRadius: 4,
        fontSize: 16,
    },
    ioBrokerLink: {
        textTransform: 'inherit',
    },
    marginTop: {
        marginTop: 'auto',
    },
    progress: {
        textAlign: 'center',
    },
};

declare global {
    interface Window {
        loginBackgroundColor: string;
        loginBackgroundImage: string;
        loginLink: string;
        loginMotto: string;
        login: string;
        loginLogo: string;
        loginHideLogo: string;
        loginTitle: string;
    }
}

interface LoginProps {}

interface LoginState {
    inProcess: boolean;
    username: string;
    password: string;
    stayLoggedIn: boolean;
    showPassword: boolean;
    error: string;
    loggingIn: boolean;
}

class Login extends Component<LoginProps, LoginState> {
    private readonly formRef: React.RefObject<HTMLFormElement>;
    private readonly passwordRef: React.RefObject<HTMLInputElement>;

    constructor(props: LoginProps) {
        super(props);

        const loggingIn = window.USE_OAUTH2 ? this.authenticateWithRefreshToken() : false;

        this.state = {
            inProcess: false,
            stayLoggedIn: false,
            showPassword: false,
            username: '',
            password: '',
            error: '',
            loggingIn,
        };

        this.formRef = React.createRef();

        // apply image
        const body = window.document.body;
        body.style.backgroundColor = window.loginBackgroundColor;
        body.style.backgroundImage = window.loginBackgroundImage;
        body.style.backgroundSize = 'cover';
        this.passwordRef = React.createRef();
    }

    private authenticateWithRefreshToken(): boolean {
        let refreshToken: string = window.sessionStorage.getItem('refresh_token');
        let refreshTokenExp: string;
        let stayLoggedIn = false;
        if (refreshToken) {
            refreshTokenExp = window.sessionStorage.getItem('refresh_token_exp');
        } else {
            refreshToken = window.localStorage.getItem('refresh_token');
            if (refreshToken) {
                stayLoggedIn = true;
                refreshTokenExp = window.localStorage.getItem('refresh_token_exp');
            }
        }

        if (refreshToken && refreshTokenExp) {
            const exp = new Date(refreshTokenExp);
            if (exp.getTime() > Date.now()) {
                void fetch('../oauth/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `grant_type=refresh_token&refresh_token=${refreshToken}&stayloggedin=${stayLoggedIn}&client_id=ioBroker`,
                })
                    .then(async response => {
                        if (response.ok) {
                            const data = await response.json();
                            if (data.accessToken) {
                                // Save expiration time of access token and refresh token
                                if (stayLoggedIn) {
                                    sessionStorage.removeItem('refresh_token_exp');
                                    sessionStorage.removeItem('access_token_exp');
                                    sessionStorage.removeItem('refresh_token');
                                    localStorage.setItem('access_token_exp', data.accessTokenExpiresAt);
                                    localStorage.setItem('refresh_token_exp', data.refreshTokenExpiresAt);
                                    localStorage.setItem('refresh_token', data.refreshToken);
                                } else {
                                    localStorage.removeItem('access_token_exp');
                                    localStorage.removeItem('refresh_token_exp');
                                    localStorage.removeItem('refresh_token');
                                    sessionStorage.setItem('refresh_token_exp', data.refreshTokenExpiresAt);
                                    sessionStorage.setItem('access_token_exp', data.accessTokenExpiresAt);
                                    sessionStorage.setItem('refresh_token', data.refreshToken);
                                }
                                // Get href from origin
                                const parts = window.location.href.split('&');
                                const href = parts.find(part => part.startsWith('href='));
                                let origin = window.location.pathname + window.location.search.replace('&error', '');
                                if (href) {
                                    origin = href.substring(5) || './';
                                    if (origin.startsWith('#')) {
                                        origin = `./${origin}`;
                                    }
                                } else {
                                    origin = './';
                                }
                                window.location.href = origin;
                                return;
                            }
                            sessionStorage.removeItem('refresh_token_exp');
                            sessionStorage.removeItem('access_token_exp');
                            sessionStorage.removeItem('refresh_token');
                            localStorage.removeItem('access_token_exp');
                            localStorage.removeItem('refresh_token_exp');
                            localStorage.removeItem('refresh_token');
                        }
                        this.setState({
                            inProcess: false,
                            loggingIn: false,
                        });
                    })
                    .catch(error => {
                        console.error(`Cannot fetch access token: ${error}`);
                        this.setState({
                            inProcess: false,
                            loggingIn: false,
                        });
                    });
                return true;
            }
        }

        return false;
    }

    render(): JSX.Element {
        const action = `${window.location.port === '3000' ? `${window.location.protocol}//${window.location.hostname}:8081/` : ''}login?${window.location.port === '3000' ? 'dev&' : ''}href=${window.location.hash}`;

        const link =
            window.loginLink && window.loginLink !== '@@loginLink@@' ? window.loginLink : 'https://www.iobroker.net/';
        const motto =
            window.loginMotto && window.loginMotto !== '@@loginMotto@@' ? window.loginMotto : 'Discover awesome. ';

        if (window.login !== 'true') {
            // eslint-disable-next-line no-debugger
            debugger;
            window.location.href = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        }
        const style =
            (window.loginBackgroundColor && window.loginBackgroundColor !== 'inherit') || window.loginBackgroundImage
                ? { background: '#00000000' }
                : {};

        let content: React.JSX.Element;
        if (this.state.loggingIn) {
            content = (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    ...
                </div>
            );
        } else {
            content = (
                <Paper sx={styles.paper}>
                    <Grid2
                        container
                        direction="column"
                        alignItems="center"
                    >
                        {window.loginLogo && window.loginLogo !== '@@loginLogo@@' ? (
                            <Box
                                sx={{
                                    height: 50,
                                    width: 102,
                                    lineHeight: '50px',
                                    backgroundColor: (theme: IobTheme) =>
                                        theme.palette.mode === 'dark' ? '#000' : '#fff',
                                    borderRadius: 5,
                                    padding: 5,
                                }}
                            >
                                <img
                                    src={window.loginLogo}
                                    alt="logo"
                                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                                />
                            </Box>
                        ) : (
                            window.loginHideLogo === 'false' && (
                                <Avatar
                                    style={styles.avatar}
                                    src="img/admin.svg"
                                    sx={{ '& .MuiAvatar-img': styles.avatarImg }}
                                />
                            )
                        )}
                        <Typography
                            component="h1"
                            variant="h5"
                        >
                            {window.loginTitle && window.loginTitle !== '@@loginTitle@@'
                                ? window.loginTitle
                                : I18n.t('loginTitle')}
                        </Typography>
                        {window.location.search.includes('error') || this.state.error ? (
                            <div style={styles.alert}>{this.state.error || I18n.t('wrongPassword')}</div>
                        ) : null}
                        <form
                            ref={this.formRef}
                            style={styles.form}
                            action={action}
                            method="post"
                        >
                            <TextField
                                variant="outlined"
                                margin="normal"
                                disabled={this.state.inProcess}
                                required
                                value={this.state.username}
                                onChange={e => this.setState({ username: e.target.value })}
                                fullWidth
                                size="small"
                                id="username"
                                label={I18n.t('enterLogin')}
                                name="username"
                                autoComplete="username"
                                autoFocus
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                disabled={this.state.inProcess}
                                required
                                fullWidth
                                ref={this.passwordRef}
                                value={this.state.password}
                                onChange={e => this.setState({ password: e.target.value })}
                                slotProps={{
                                    input: {
                                        endAdornment: this.state.password ? (
                                            <IconButton
                                                tabIndex={-1}
                                                aria-label="toggle password visibility"
                                            >
                                                <Visibility
                                                    onMouseDown={() => this.setState({ showPassword: true })}
                                                    onMouseUp={() => {
                                                        this.setState({ showPassword: false }, () => {
                                                            setTimeout(() => this.passwordRef.current?.focus(), 50);
                                                        });
                                                    }}
                                                />
                                            </IconButton>
                                        ) : null,
                                    },
                                }}
                                size="small"
                                name="password"
                                label={I18n.t('enterPassword')}
                                type={this.state.showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="current-password"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        id="stayloggedin"
                                        name="stayloggedin"
                                        value="on"
                                        checked={this.state.stayLoggedIn}
                                        onChange={e => this.setState({ stayLoggedIn: e.target.checked })}
                                        color="primary"
                                        disabled={this.state.inProcess}
                                    />
                                }
                                label={I18n.t('Stay signed in')}
                            />
                            <input
                                id="origin"
                                type="hidden"
                                name="origin"
                                value={window.location.pathname + window.location.search.replace('&error', '')}
                            />
                            {
                                <Button
                                    type="submit"
                                    disabled={this.state.inProcess || !this.state.username || !this.state.password}
                                    onClick={() => {
                                        if (!window.USE_OAUTH2) {
                                            this.formRef.current.submit();
                                            // give time to firefox to send the data
                                            setTimeout(() => this.setState({ inProcess: true }), 50);
                                        } else {
                                            this.setState({ inProcess: true, error: '' }, async () => {
                                                const response = await fetch('../oauth/token', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/x-www-form-urlencoded',
                                                    },
                                                    body: `grant_type=password&username=${this.state.username}&password=${this.state.password}&stayloggedin=${this.state.stayLoggedIn}&origin=${origin}&client_id=ioBroker`,
                                                });
                                                if (response.ok) {
                                                    const data = await response.json();
                                                    if (data.accessToken) {
                                                        // Save expiration time of access token and refresh token
                                                        if (this.state.stayLoggedIn) {
                                                            sessionStorage.removeItem('refresh_token_exp');
                                                            sessionStorage.removeItem('access_token_exp');
                                                            sessionStorage.removeItem('refresh_token');
                                                            localStorage.setItem(
                                                                'access_token_exp',
                                                                data.accessTokenExpiresAt,
                                                            );
                                                            localStorage.setItem(
                                                                'refresh_token_exp',
                                                                data.refreshTokenExpiresAt,
                                                            );
                                                            localStorage.setItem('refresh_token', data.refreshToken);
                                                        } else {
                                                            localStorage.removeItem('access_token_exp');
                                                            localStorage.removeItem('refresh_token_exp');
                                                            localStorage.removeItem('refresh_token');
                                                            sessionStorage.setItem(
                                                                'refresh_token_exp',
                                                                data.refreshTokenExpiresAt,
                                                            );
                                                            sessionStorage.setItem(
                                                                'access_token_exp',
                                                                data.accessTokenExpiresAt,
                                                            );
                                                            sessionStorage.setItem('refresh_token', data.refreshToken);
                                                        }
                                                        // Get href from origin
                                                        const parts = window.location.href.split('&');
                                                        const href = parts.find(part => part.startsWith('href='));
                                                        let origin =
                                                            window.location.pathname +
                                                            window.location.search.replace('&error', '');

                                                        if (href) {
                                                            origin = href.substring(5) || './';
                                                            if (origin.startsWith('#')) {
                                                                origin = `./${origin}`;
                                                            }
                                                        } else {
                                                            origin = './';
                                                        }
                                                        window.location.href = decodeURIComponent(origin);
                                                    } else {
                                                        this.setState({
                                                            inProcess: false,
                                                            error: I18n.t('cannotGetAccessToken'),
                                                        });
                                                    }
                                                } else {
                                                    this.setState({
                                                        inProcess: false,
                                                        error: I18n.t('wrongPassword'),
                                                    });
                                                }
                                            });
                                        }
                                    }}
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    style={styles.submit}
                                >
                                    {this.state.inProcess ? <CircularProgress size={24} /> : I18n.t('login')}
                                </Button>
                            }
                        </form>
                    </Grid2>
                    <Box style={styles.marginTop}>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            align="center"
                        >
                            {window.loginLink && window.loginLink !== '@@loginLink@@' ? (
                                <Link
                                    style={styles.ioBrokerLink}
                                    color="inherit"
                                    href={link}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    {motto}
                                </Link>
                            ) : null}
                            {!window.loginLink || window.loginLink === '@@loginLink@@' ? motto : null}
                            {!window.loginLink || window.loginLink === '@@loginLink@@' ? (
                                <Link
                                    style={styles.ioBrokerLink}
                                    color="inherit"
                                    href={link}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    ioBroker
                                </Link>
                            ) : null}
                        </Typography>
                    </Box>
                </Paper>
            );
        }

        return (
            <Paper
                component="main"
                style={{ ...styles.root, ...style }}
            >
                {content}
            </Paper>
        );
    }
}

export default Login;
