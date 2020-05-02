import React from 'react';

import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Alert from '@material-ui/lab/Alert';

function Copyright() {
    return (
        <Typography variant="body2" color="textSecondary" align="center">
            { window.loginMotto || 'Discover awesome.' }
            <Link color="inherit" href="https://www.iobroker.net/">
                ioBroker
            </Link>
        </Typography>
    );
}

const useStyles = makeStyles(theme => ({
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
        width: 100,
        height: 100,
    },
    avatarImg: {
        width: '100%',
        background: 'white',
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
}));

export default function Login(props) {
    const classes = useStyles();

    const action = `${window.location.port === '3000' ? window.location.protocol + '//' + window.location.hostname + ':8081' : ''}/login?${window.location.port === '3000' ? 'dev&' : ''}href=${window.location.hash}`;

    if (window.login !== 'true') {
        debugger;
        window.location = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    }

    return (
        <Container component="main" maxWidth="xs" className="root">
            <CssBaseline />
            <div className={classes.paper}>
                {!window.loginHideLogo ? (<Avatar className={classes.avatar}>
                    <img src="img/logo.png" className={classes.avatarImg} alt="logo"/>
                </Avatar>) : null}
                <Typography component="h1" variant="h5">
                    { props.t('loginTitle') }
                </Typography>
                { window.location.search.indexOf('error') !== -1 &&
                    <Alert severity="error">
                        { props.t('wrongPassword') }
                    </Alert>
                }
                <form className={classes.form} action={action} method="post">
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label={ props.t('enterLogin') }
                        name="username"
                        autoComplete="username"
                        autoFocus
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label={ props.t('enterPassword') }
                        type="password"
                        id="password"
                        autoComplete="current-password"
                    />
                    <FormControlLabel
                        control={<Checkbox id="stayloggedin" name="stayloggedin" value="on" color="primary" />}
                        label={ props.t('Stay signed in') }
                    />
                    <input id="origin" type="hidden" name="origin" value={ window.location.search.replace('&error', '') }/>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                    >
                        { props.t('login') }
                    </Button>
                </form>
            </div>
            <Box mt={8}>
                <Copyright />
            </Box>
        </Container>
    );
}
