import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import {
    TextField,
    Fab,
    FormControlLabel,
    Checkbox,
} from '@mui/material';

import {
    GpsFixed as IconGpsFixed,
    LocationOn as IconLocationOn,
} from '@mui/icons-material';

import I18n from './wrapper/i18n';

import ConfigGeneric from './ConfigGeneric';

const styles = () => ({
    width: {
        width: 'calc(100% - 85px)',
    },
    width50: {
        width: 120,
        marginRight: 5,
    },
});

class ConfigCoordinates extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();

        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ value });

        const newState = {};
        if (this.props.schema.useSystemName) {
            newState.useSystem = !!ConfigGeneric.getValue(this.props.data, this.props.schema.useSystemName);
        }
        if (this.props.schema.longitudeName && this.props.schema.latitudeName) {
            newState.longitude = ConfigGeneric.getValue(this.props.data, this.props.schema.longitudeName);
            newState.latitude = ConfigGeneric.getValue(this.props.data, this.props.schema.latitudeName);
            if (!newState.longitude && !newState.latitude && this.props.schema.autoInit) {
                setTimeout(() => this.getCoordinates(), 300);
            }
        } else {
            const value_ = ConfigGeneric.getValue(this.props.data, this.props.attr);
            if (!value_ && this.props.schema.autoInit) {
                setTimeout(() => this.getCoordinates(), 300);
            }
        }
        Object.keys(newState).length && setTimeout(() => this.setState(newState), 50);
    }

    getSystemCoordinates() {
        return this.props.socket.getSystemConfig().then(obj => {
            if (obj && obj.common && (obj.common.longitude || obj.common.latitude)) {
                window.alert(I18n.t('ra_Used system settings'));
                if (this.props.schema.longitudeName && this.props.schema.latitudeName) {
                    this.setState(
                        {
                            longitude: obj.common.longitude,
                            latitude: obj.common.latitude,
                        },
                        async () => {
                            await this.onChange(this.props.schema.longitudeName, (obj.common.longitude || '').trim());
                            await this.onChange(this.props.schema.latitudeName, (obj.common.latitude || '').trim());
                        },
                    );
                } else {
                    const value = obj.common.latitude + (this.props.schema.divider || ',') + obj.common.longitude;
                    this.setState(
                        {
                            value,
                        },
                        () => {
                            this.onChange(this.props.attr, value);
                        },
                    );
                }
            } else {
                window.alert(
                    I18n.t(
                        'ra_Cannot determine position: System settings are empty and GPS detection is disabled in browser',
                    ),
                );
            }
        });
    }

    getCoordinates() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    if (position?.coords) {
                        if (this.props.schema.longitudeName && this.props.schema.latitudeName) {
                            this.setState(
                                {
                                    longitude: position.coords.longitude,
                                    latitude: position.coords.latitude,
                                },
                                async () => {
                                    await this.onChange(
                                        this.props.schema.longitudeName,
                                        position.coords.longitude || '',
                                    );
                                    await this.onChange(this.props.schema.latitudeName, position.coords.latitude || '');
                                },
                            );
                        } else {
                            const value =
                                position.coords.latitude +
                                (this.props.schema.divider || ',') +
                                position.coords.longitude;
                            this.setState({ value }, () => {
                                this.onChange(this.props.attr, value);
                            });
                        }
                    } else {
                        this.getSystemCoordinates();
                    }
                },
                error => {
                    console.error(`Cannot determine coordinates from browser: ${error}`);
                    this.getSystemCoordinates();
                },
            );
        } else {
            this.getSystemCoordinates();
        }
    }

    renderItem(error, disabled /* , defaultValue */) {
        return (
            <>
                {this.props.schema.useSystemName ? (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!this.state.useSystem}
                                onChange={e => {
                                    const useSystem = e.target.checked;
                                    if (useSystem) {
                                        this.getSystemCoordinates();
                                    }
                                    this.setState({ useSystem }, () =>
                                        this.onChange(this.props.schema.useSystemName, useSystem));
                                }}
                            />
                        }
                        label={I18n.t('ra_Use system settings for position')}
                    />
                ) : null}
                {this.props.schema.longitudeName && this.props.schema.latitudeName ? (
                    <TextField
                        variant="standard"
                        className={this.props.classes.width50}
                        value={this.state.longitude ?? ''}
                        error={!!error}
                        disabled={this.state.useSystem || !!disabled}
                        onChange={e => {
                            const longitude = e.target.value;
                            this.setState({ longitude }, () => {
                                this.onChange(this.props.schema.longitudeName, (longitude || '').trim());
                            });
                        }}
                        label={I18n.t('ra_Longitude')}
                    />
                ) : null}
                {this.props.schema.longitudeName && this.props.schema.latitudeName ? (
                    <TextField
                        variant="standard"
                        className={this.props.classes.width50}
                        value={this.state.latitude ?? ''}
                        error={!!error}
                        disabled={this.state.useSystem || !!disabled}
                        onChange={e => {
                            const latitude = e.target.value;
                            this.setState({ latitude }, () =>
                                this.onChange(this.props.schema.latitudeName, (latitude || '').trim()));
                        }}
                        label={I18n.t('ra_Latitude')}
                    />
                ) : null}
                {!this.props.schema.longitudeName || !this.props.schema.latitudeName ? (
                    <TextField
                        variant="standard"
                        className={this.props.classes.width}
                        value={this.state.value === null || this.state.value === undefined ? '' : this.state.value}
                        error={!!error}
                        readOnly={this.state.useSystem}
                        disabled={!!disabled}
                        inputProps={{ maxLength: this.props.schema.maxLength || this.props.schema.max || undefined }}
                        onChange={e => {
                            const value = e.target.value;
                            this.setState({ value }, () => this.onChange(this.props.attr, (value || '').trim()));
                        }}
                        placeholder={this.getText(this.props.schema.placeholder)}
                        label={this.getText(this.props.schema.label)}
                        helperText={this.renderHelp(
                            this.props.schema.help,
                            this.props.schema.helpLink,
                            this.props.schema.noTranslation,
                        )}
                    />
                ) : null}
                {!this.state.useSystem ? (
                    <Fab
                        size="small"
                        onClick={() => this.getCoordinates()}
                        title={I18n.t('ra_Take browser position')}
                        style={{ marginRight: 4 }}
                    >
                        <IconLocationOn />
                    </Fab>
                ) : null}
                {!this.state.useSystem ? (
                    <Fab
                        size="small"
                        onClick={() => this.getSystemCoordinates()}
                        title={I18n.t('ra_Take position from system settings')}
                    >
                        <IconGpsFixed />
                    </Fab>
                ) : null}
            </>
        );
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
