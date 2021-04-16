import { makeStyles, withStyles } from '@material-ui/core/styles';

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
import CircularProgress from '@material-ui/core/CircularProgress';
import { Component, createRef } from "react";
import withWidth from "@material-ui/core/withWidth";
import PropTypes from "prop-types";

function Copyright() {
    return <Typography
        variant="body2"
        color="textSecondary"
        align="center"
    >
        {(window.loginMotto || 'Discover awesome.') + ' '}
        <Link
            color="inherit"
            href="https://www.iobroker.net/"
            rel="noopener noreferrer"
            target="_blank"
        >
            ioBroker
        </Link>
    </Typography>;
}
const boxShadow = '0 4px 7px 5px rgb(0 0 0 / 14%), 0 3px 1px 1px rgb(0 0 0 / 12%), 0 1px 5px 0 rgb(0 0 0 / 20%)';

const styles = theme => ({
    root: {
        padding: 10,
        margin: 'auto',
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        borderRadius: 0,
        justifyContent: 'center'
    },
    paper: {
        background: theme.palette.background.paper + (theme.palette.background.paper.length < 7 ? 'd' : 'dd'),
        padding: theme.spacing(3),
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: 400,
        maxWidth: 380,
        boxShadow
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
        margin: theme.spacing(1, 0, 2),
    },
    alert: {
        marginTop: theme.spacing(2),
        backgroundColor: '#f44336',
        padding: 8,
        color: '#fff',
        borderRadius: 4,
        fontSize: 16,
    },
    ioBrokerLink: {
        textTransform: 'inherit'
    },
    marginTop: {
        marginTop: 'auto'
    }
});

class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            inProcess: false,
        };
    }

    render() {
        const classes = this.props.classes;
        const action = `${window.location.port === '3000' ? `${window.location.protocol}//${window.location.hostname}:8081` : ''}/login?${window.location.port === '3000' ? 'dev&' : ''}href=${window.location.hash}`;

        if (window.login !== 'true') {
            debugger;
            window.location = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        }

        return <Paper component="main" className={classes.root}>
            <Paper className={classes.paper}>
                <Grid
                    container
                    direction="column"
                    alignItems="center"
                >
                    {window.loginHideLogo && window.loginHideLogo === 'false' &&
                        <Avatar className={classes.avatar} src="img/logo.png" />
                    }
                    <Typography component="h1" variant="h5">
                        {this.props.t('loginTitle')}
                    </Typography>
                    {window.location.search.includes('error') &&
                        <div className={classes.alert}>
                            {this.props.t('wrongPassword')}
                        </div>
                    }
                    <form
                        className={classes.form}
                        action={action}
                        method="post"
                    >
                        <TextField
                            variant="outlined"
                            margin="normal"
                            disabled={this.state.inProcess}
                            required
                            fullWidth
                            size="small"
                            id="username"
                            label={this.props.t('enterLogin')}
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
                            size="small"
                            name="password"
                            label={this.props.t('enterPassword')}
                            type="password"
                            id="password"
                            autoComplete="current-password"
                        />
                        <FormControlLabel
                            control={<Checkbox
                                id="stayloggedin"
                                name="stayloggedin"
                                value="on"
                                color="primary"
                                disabled={this.state.inProcess}
                            />}
                            label={this.props.t('Stay signed in')}
                        />
                        <input id="origin" type="hidden" name="origin" value={window.location.search.replace('&error', '')} />
                        {this.state.inProcess ? <CircularProgress /> : <Button
                            type="submit"
                            onClick={() => this.setState({ inProcess: true })}
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                        >
                            {this.props.t('login')}
                        </Button>}
                    </form>
                </Grid>
                <Box className={classes.marginTop}>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        align="center"
                    >
                        {(window.loginMotto || 'Discover awesome.') + ' '}
                        <Link
                            className={classes.ioBrokerLink}
                            color="inherit"
                            href="https://www.iobroker.net/"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            ioBroker
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Paper>;
    }
}

Login.propTypes = {
    t: PropTypes.func,
};

export default withWidth()(withStyles(styles)(Login));

