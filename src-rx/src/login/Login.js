import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

import Avatar from '@material-ui/core/Avatar';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Container from '@material-ui/core/Container';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import Alert from '@material-ui/lab/Alert';

function Copyright() {
    return (
        <Typography
            variant="body2"
            color="textSecondary"
            align="center"
        >
            { (window.loginMotto || 'Discover awesome.') + ' ' }
            <Link
                color="inherit"
                href="https://www.iobroker.net/"
                rel="noreferrer"
                target="_blank"
            >
                ioBroker
            </Link>
        </Typography>
    );
}

const useStyles = makeStyles(theme => ({
    root:{
        padding: 0,
        marginTop: theme.spacing(8)
    },
    paper: {
        background: theme.palette.background.paper + (theme.palette.background.paper.length < 7 ? 'd' : 'dd'),
        padding: theme.spacing(3)
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: '#fff',
        width: 100,
        height: 100,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
    alert: {
        marginTop: theme.spacing(2)
    }
}));

export default function Login(props) {

    const classes = useStyles();

    const action = `${window.location.port === '3000' ? window.location.protocol + '//' + window.location.hostname + ':8081' : ''}/login?${window.location.port === '3000' ? 'dev&' : ''}href=${window.location.hash}`;

    if (window.login !== 'true') {
        debugger;
        window.location = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    }
    
    return (
        <Container component="main" maxWidth="xs" className={ classes.root }>
            <Paper className={ classes.paper }>
                <Grid
                    container
                    direction="column"
                    alignItems="center"  
                >
                    { !window.loginHideLogo &&
                        <Avatar className={ classes.avatar } src="img/logo.png" />
                    }
                    <Typography component="h1" variant="h5">
                        { props.t('loginTitle') }
                    </Typography>
                    { window.location.search.indexOf('error') !== -1 &&
                        <Alert
                            severity="error"
                            className={ classes.alert }
                        >
                            { props.t('wrongPassword') }
                        </Alert>
                    }
                    <form
                        className={ classes.form }
                        action={ action }
                        method="post"
                    >
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
                            control={ <Checkbox id="stayloggedin" name="stayloggedin" value="on" color="primary" /> }
                            label={ props.t('Stay signed in') }
                        />
                        <input id="origin" type="hidden" name="origin" value={ window.location.search.replace('&error', '') }/>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={ classes.submit }
                        >
                            { props.t('login') }
                        </Button>
                    </form>
                </Grid>
                <Box mt={ 8 }>
                    <Copyright />
                </Box>
            </Paper>
        </Container>
    );
}
