import { createRef, Component } from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Grid';

import Button from '@material-ui/core/Button';
import Paper from  '@material-ui/core/Paper';

const TOOLBAR_HEIGHT = 64;

const styles = theme => ({
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
    title: {
        color: theme.palette.secondary.main,
    },
    form: {
        height: 'calc(100% - ' + (TOOLBAR_HEIGHT + theme.spacing(1)) + 'px)',
        overflow: 'auto',
    },
    input: {
        width: 400,
        marginBottom: theme.spacing(2)
    },
    grow: {
        flexGrow: 1,
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
        lineHeight: TOOLBAR_HEIGHT + 'px',
    }
});

class WizardPasswordTab extends Component {
    constructor(props) {
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

    checkPassword(password, passwordRepeat) {
        if (password !== null && password !== undefined) {
            return password.length < 8 || !password.match(/\d/) || !password.match(/[a-z]/) || !password.match(/[A-Z]/);
        } else {
            if (passwordRepeat.length < 8 || !passwordRepeat.match(/\d/) || !passwordRepeat.match(/[a-z]/) || !passwordRepeat.match(/[A-Z]/)) {
                return this.props.t('Password must be at least 8 characters long and have numbers, upper and lower case letters');
            } else if (this.state.password !== passwordRepeat) {
                return this.props.t('Passwords are not equal');
            } else {
                return false;
            }
        }
    }

    render() {
        return <Paper className={ this.props.classes.paper }>
            <form className={ this.props.classes.form} noValidate autoComplete="off">
                <Grid container direction="column">
                    <Grid item>
                        <h2 className={ this.props.classes.title }>{ this.props.t('You must set the administrator password') }</h2>
                    </Grid>
                    <Grid item>
                        <TextField
                            inputProps={{
                                autoComplete: 'new-password',
                                form: {
                                    autoComplete: 'off',
                                },
                            }}
                            autoComplete="off"
                            className={ this.props.classes.input }
                            ref={ this.focusRef }
                            label={this.props.t('Administrator password')}
                            type="password"
                            value={ this.state.password }
                            error={ this.state.errorPassword }
                            onChange={ e => this.setState({ password: e.target.value, errorPassword: this.checkPassword(e.target.value), errorPasswordRepeat: this.checkPassword(null, this.state.passwordRepeat)}) }
                            helperText={ this.props.t('Password must be at least 8 characters long and have numbers, upper and lower case letters') }
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            inputProps={{
                                autoComplete: 'new-password',
                                form: {
                                    autoComplete: 'off',
                                },
                            }}
                            autoComplete="off"
                            className={ this.props.classes.input }
                            label={ this.props.t('Repeat administrator password') }
                            value={ this.state.passwordRepeat }
                            type="password"
                            error={ !!this.state.errorPasswordRepeat }
                            onChange={ e => this.setState({ passwordRepeat: e.target.value, errorPasswordRepeat: this.checkPassword(null, e.target.value), errorPassword: this.checkPassword(this.state.password)}) }
                            helperText={ this.state.errorPasswordRepeat || '' }
                        />
                    </Grid>
                </Grid>
            </form>
            <Toolbar className={ this.props.classes.toolbar }>
                <div className={ this.props.classes.grow }/>
                <Button  color="primary" variant={"contained"} onClick={ () => this.props.onDone(this.state.password) } disabled={ !!this.state.errorPasswordRepeat || this.state.errorPassword }>{ this.props.t('Set administrator password') }</Button>
            </Toolbar>
        </Paper>;
    }
}

WizardPasswordTab.propTypes = {
    t: PropTypes.func,
    socket: PropTypes.object,
    onDone: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(WizardPasswordTab));
