import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';

import Avatar from '@material-ui/core/Avatar';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';

const boxShadow = '0 4px 7px 5px rgb(0 0 0 / 14%), 0 3px 1px 1px rgb(0 0 0 / 12%), 0 1px 5px 0 rgb(0 0 0 / 20%)';

const styles = theme => ({
    root: {
        padding: 10,
        margin: 'auto',
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        borderRadius: 0,
        justifyContent: 'center',
    },
    paper: {
        background: theme.palette.background.paper + (theme.palette.background.paper.length < 7 ? 'd' : 'dd'),
        padding: theme.spacing(3),
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: 500,
        maxWidth: 380,
        boxShadow
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: '#fff',
        width: 100,
        height: 100,
    },
    avatarImg: {
        width: 'calc(100% - 4px)',
        height: 'calc(100% - 4px)',
        padding: 2
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
    },
    progress: {
        textAlign: 'center'
    }
});

class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            inProcess: false,
        };

        this.formRef = React.createRef();
    }

    render() {
        const classes = this.props.classes;
        const action = `${window.location.port === '3000' ? `${window.location.protocol}//${window.location.hostname}:8081` : ''}/login?${window.location.port === '3000' ? 'dev&' : ''}href=${window.location.hash}`;

        const link  = window.loginLink  && window.loginLink  !== '@@loginLink@@'  ? window.loginLink  : 'https://www.iobroker.net/';
        const motto = window.loginMotto && window.loginMotto !== '@@loginMotto@@' ? window.loginMotto : ('Discover awesome. ');

        if (window.login !== 'true') {
            debugger;
            window.location = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        }
        const style = window.loginBackgroundColor ? {background: '#00000000'} : {};

        return <Paper component="main" className={classes.root} style={style}>
            <Paper className={classes.paper}>
                <Grid
                    container
                    direction="column"
                    alignItems="center"
                >
                    {window.loginLogo && window.loginLogo !== '@@loginLogo@@' ?
                        <div style={{
                            height: 50,
                            withWidth: 102,
                            lineHeight: '50px',
                            background: 'white',
                            borderRadius: 5,
                            padding: 5}}
                        ><img src={window.loginLogo} alt="logo"
                              style={{maxWidth: '100%', maxHeight: '100%'}}/></div>
                        :
                        window.loginHideLogo === 'false' &&
                        <Avatar className={classes.avatar} src="img/logo.png" classes={{img: classes.avatarImg}} />}
                    <Typography component="h1" variant="h5">
                        {window.loginTitle && window.loginTitle !== '@@loginTitle@@' ? window.loginTitle : this.props.t('loginTitle')}
                    </Typography>
                    {window.location.search.includes('error') &&
                        <div className={classes.alert}>
                            {this.props.t('wrongPassword')}
                        </div>
                    }
                    <form
                        ref={this.formRef}
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
                        {<Button
                            type="submit"
                            disabled={this.state.inProcess}
                            onClick={() => {
                                this.formRef.current.submit();
                                // give time to firefox to send the data
                                setTimeout(() =>
                                    this.setState({ inProcess: true }), 50);
                            }}
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                        >
                            {this.state.inProcess ? <CircularProgress size={24}/> : this.props.t('login')}
                        </Button>}
                    </form>
                </Grid>
                <Box className={classes.marginTop}>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        align="center"
                    >
                        {window.loginLink && window.loginLink !== '@@loginLink@@' ?
                            <Link
                                className={classes.ioBrokerLink}
                                color="inherit"
                                href={link}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                {motto}
                            </Link> : null
                        }
                        {!window.loginLink || window.loginLink === '@@loginLink@@' ? motto : null}
                        {!window.loginLink || window.loginLink === '@@loginLink@@' ? <Link
                            className={classes.ioBrokerLink}
                            color="inherit"
                            href={link}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            ioBroker
                        </Link> : null}
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

