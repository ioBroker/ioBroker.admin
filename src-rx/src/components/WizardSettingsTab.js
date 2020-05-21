import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import Button from '@material-ui/core/Button';
import Paper from  '@material-ui/core/Paper';

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
        height: 'calc(100% - ' + (theme.mixins.toolbar.minHeight + theme.spacing(1)) + 'px)',
        overflow: 'auto',
    },
    input: {
        width: 400,
        marginBottom: theme.spacing(2)
    },
    grow: {
        flexGrow: 1,
    },
    controlItem: {
        width: 200,
    }
});

class WizardSettingsTab extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            password: '',
            passwordRepeat: '',
            errorPassword: false,
            errorPasswordRepeat: false,
        };

        this.focusRef = React.createRef();

        this.props.socket.getSystemConfig(true)
            .then(obj => {
                    this.setState({
                        tempUnit: obj.common.tempUnit,
                        currency: obj.common.currency,
                        dateFormat: obj.common.dateFormat,
                        isFloatComma: obj.common.isFloatComma,
                        country: obj.common.country,
                        city: obj.common.city,
                        street: '',
                        longitude: obj.common.longitude,
                        latitude: obj.common.latitude,
                    })
                })

    }

    componentDidMount() {
        this.focusRef.current && this.focusRef.current.focus();
    }

    render() {
        return <Paper className={ this.props.classes.paper }>
            <form className={ this.props.classes.form } noValidate autoComplete="off">
                <Grid container direction="column">
                    <Grid item>
                        <h2 className={ this.props.classes.title }>{ this.props.t('Important main settings') }</h2>
                    </Grid>
                    <Grid item>
                        <FormControl className={ this.props.classes.controlItem }>
                            <InputLabel>{ this.props.t('Temperature unit') }</InputLabel>
                            <Select
                                value={ this.state.tempUnit }
                                onChange={e => this.setState({tempUnit: e.target.value}) }
                            >
                                <MenuItem value="°C">°C</MenuItem>
                                <MenuItem value="°F">°F</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </form>
            <Toolbar>
                <div className={ this.props.classes.grow }/>
                <Button variant={"contained"} onClick={ () => this.props.onDone(this.state.password) }>{ this.props.t('Save') }</Button>
            </Toolbar>
        </Paper>;
    }
}

WizardSettingsTab.propTypes = {
    t: PropTypes.func,
    socket: PropTypes.object,
    onDone: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(WizardSettingsTab));
