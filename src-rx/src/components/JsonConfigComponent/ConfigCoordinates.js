import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import TextField from '@material-ui/core/TextField';
import Fab from '@material-ui/core/Fab';

import IconGpsFixed from '@material-ui/icons/GpsFixed';

import I18n from '@iobroker/adapter-react/i18n';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    width: {
        width: 'calc(100% - 40px)',
    }
});

class ConfigCoordinates extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        if (!value && this.props.schema.autoInit) {
            setTimeout(() => this.getCoordinates(), 300);
        }
    }

    getSystemCoordinates() {
        return this.props.socket.getSystemConfig()
            .then(obj => {
                if (obj && obj.common && (obj.common.longitude || obj.common.latitude)) {
                    window.alert(I18n.t('Used system settings'));
                    this.setState({value: obj.common.latitude + (this.props.schema.divider || ',') + obj.common.longitude});
                } else {
                    window.alert(I18n.t('Cannot determine position: System settings are empty and GPS detection is disabled in browser'));
                }
            });
    }

    getCoordinates() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    if (position && position.coords) {
                        this.setState({value: position.coords.latitude +  (this.props.schema.divider || ',') + position.coords.longitude});
                    } else {
                        this.getSystemCoordinates();
                    }
                },
                error => {
                    this.getSystemCoordinates();
                }
            );
        } else {
            this.getSystemCoordinates();
        }
    }

    renderItem(error, disabled, defaultValue) {
        return <>
            <TextField
                className={this.props.classes.width}
                value={this.state.value === null || this.state.value === undefined ? '' : this.state.value}
                error={!!error}
                disabled={!!disabled}
                inputProps={{maxLength: this.props.schema.maxLength || this.props.schema.max || undefined}}
                onChange={e => {
                    const value = e.target.value;
                    this.setState({value}, () =>
                        this.onChange(this.props.attr, (value || '').trim()));
                }}
                placeholder={this.getText(this.props.schema.placeholder)}
                label={this.getText(this.props.schema.label)}
                helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
            />
            <Fab size="small" onClick={() => this.getCoordinates()}><IconGpsFixed /></Fab>
        </>;
    }
}

ConfigCoordinates.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(ConfigCoordinates);