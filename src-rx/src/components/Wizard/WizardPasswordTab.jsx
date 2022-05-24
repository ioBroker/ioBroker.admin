import { createRef, Component } from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Grid';

import Button from '@material-ui/core/Button';
import Paper from  '@material-ui/core/Paper';
import IconCheck from '@material-ui/icons/Check';

import AdminUtils from '../../Utils';

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
        height: `calc(100% - ${TOOLBAR_HEIGHT + theme.spacing(1)}px)`,
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
                            onKeyDown={e => {
                                if (e.keyCode === 13 && this.state.password && !this.state.errorPassword) {
                                    const el = window.document.getElementById('admin_password');
                                    if (el) {
                                        el.focus();
                                    }
                                }
                            }}
                            autoComplete="off"
                            className={ this.props.classes.input }
                            ref={ this.focusRef }
                            label={this.props.t('Administrator password')}
                            type="password"
                            value={ this.state.password }
                            error={ this.state.errorPassword }
                            onChange={ e => {
                                const errorPassword = AdminUtils.checkPassword(e.target.value);
                                const errorPasswordRepeat = AdminUtils.checkPassword(e.target.value, this.state.passwordRepeat);
                                this.setState({
                                    password: e.target.value,
                                    errorPassword: errorPassword ? this.props.t(errorPassword) : false,
                                    errorPasswordRepeat: errorPasswordRepeat ? this.props.t(errorPasswordRepeat) : false
                                });
                            } }
                            helperText={ this.props.t('Password must be at least 8 characters long and have numbers, upper and lower case letters') }
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            inputProps={{
                                autoComplete: 'new-password',
                                form: {autoComplete: 'off'},
                                id: 'admin_password'
                            }}
                            onKeyDown={e => {
                                if (e.keyCode === 13 && this.state.password && !this.state.errorPassword && !this.state.errorPasswordRepeat) {
                                    this.props.onDone(this.state.password);
                                }
                            } }
                            autoComplete="off"
                            className={ this.props.classes.input }
                            label={ this.props.t('Repeat administrator password') }
                            value={ this.state.passwordRepeat }
                            type="password"
                            error={ !!this.state.errorPasswordRepeat }
                            onChange={ e => {
                                const errorPasswordRepeat = AdminUtils.checkPassword(this.state.password, e.target.value);
                                this.setState({
                                    passwordRepeat: e.target.value,
                                    errorPasswordRepeat: errorPasswordRepeat ? this.props.t(errorPasswordRepeat) : false
                                });
                            } }
                            helperText={ this.state.errorPasswordRepeat || '' }
                        />
                    </Grid>
                </Grid>
            </form>
            <Toolbar className={ this.props.classes.toolbar }>
                <div className={ this.props.classes.grow }/>
                <Button  color="primary" variant={"contained"} onClick={ () => this.props.onDone(this.state.password) } disabled={ !!this.state.errorPasswordRepeat || this.state.errorPassword } startIcon={<IconCheck/>}>{ this.props.t('Set administrator password') }</Button>
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
