import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import LinearProgress from '@material-ui/core/LinearProgress';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';


import clsx from 'clsx';

import Button from '@material-ui/core/Button';
import Paper from  '@material-ui/core/Paper';

const styles = theme => ({
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
});

const NO_CHANGE = '__NO_CHANGE__';

class WizardPasswordTab extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            password: NO_CHANGE,
            passwordRepeat: NO_CHANGE,
            errorPassword: false,
            errorPasswordRepeat: false,
        };
    }

    checkPassword(password, passwordRepeat) {
        if (password !== null && password !== undefined) {
            return password.length < 8 || !password.match(/\d/) || !password.match(/[a-z]/) || !password.match(/[A-Z]/);
        } else {
            if (passwordRepeat.length < 8 || !passwordRepeat.match(/\d/) || !passwordRepeat.match(/[a-z]/) || !passwordRepeat.match(/[A-Z]/)) {
                return this.props.t('Password must be at least 8 characters long and have numbers, upper and lower case letters');
            } else if (password !== passwordRepeat) {
                return this.props.t('Passwords are not equal');
            } else {
                return false;
            }
        }
    }

    render() {
        return <Paper className={ this.props.classes.paper }>
            <form className={ this.props.classes.paper} noValidate autoComplete="off">
                <Grid container>
                    <Grid item>
                        <TextField
                            label="Administrator password"
                            value={ this.state.password }
                            error={ this.state.errorPassword }
                            onChange={ e => this.setState({ password: e.target.value, errorPassword: this.checkPassword(e.target.value)}) }
                            helperText={ this.props.t('Password must be at least 8 characters long and have numbers, upper and lower case letters') }
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            label={ this.props.t('Repeat administrator password') }
                            value={ this.state.passwordRepeat }
                            error={ !!this.state.errorPasswordRepeat }
                            onChange={ e => this.setState({ password: e.target.value, errorPassword: this.checkPassword(e.target.value)}) }
                            helperText={ this.state.errorPasswordRepeat ? this.state.errorPasswordRepeat : this.props.t('Password must be at least 8 characters long and have numbers, upper and lower case letters') }
                        />
                    </Grid>
                    <Grid item>
                        <Button onClick={ () => this.props.onDone() } disabled={ !!this.state.errorPasswordRepeat || this.state.errorPassword }>{ this.props.t('Set administrator password') }</Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>;
    }
}

WizardPasswordTab.propTypes = {
    t: PropTypes.func,
    socket: PropTypes.object,
    onDone: PropTypes.string.isRequired,
};

export default withWidth()(withStyles(styles)(WizardPasswordTab));
