import React, { type JSX } from 'react';

import { TextField, Fab, FormControlLabel, Checkbox } from '@mui/material';

import { GpsFixed as IconGpsFixed, LocationOn as IconLocationOn } from '@mui/icons-material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemCoordinates } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    width: {
        width: 'calc(100% - 85px)',
    },
    width50: {
        width: 120,
        marginRight: 5,
    },
};

interface ConfigCoordinatesProps extends ConfigGenericProps {
    schema: ConfigItemCoordinates;
}

interface ConfigCoordinatesState extends ConfigGenericState {
    useSystem?: boolean;
    longitude?: string | number;
    latitude?: string | number;
}

class ConfigCoordinates extends ConfigGeneric<ConfigCoordinatesProps, ConfigCoordinatesState> {
    componentDidMount(): void {
        super.componentDidMount();

        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ value });

        const newState: Partial<ConfigCoordinatesState> = {};
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
        if (Object.keys(newState).length) {
            setTimeout(() => this.setState(newState as ConfigCoordinatesState), 50);
        }
    }

    async getSystemCoordinates(): Promise<void> {
        const obj = await this.props.oContext.socket.getCompactSystemConfig();
        if (obj?.common && (obj.common.longitude || obj.common.latitude)) {
            window.alert(I18n.t('ra_Used system settings'));
            if (this.props.schema.longitudeName && this.props.schema.latitudeName) {
                this.setState(
                    {
                        longitude: obj.common.longitude,
                        latitude: obj.common.latitude,
                    },
                    async () => {
                        await this.onChange(this.props.schema.longitudeName, obj.common.longitude);
                        await this.onChange(this.props.schema.latitudeName, obj.common.latitude);
                    },
                );
            } else {
                const value = obj.common.latitude + (this.props.schema.divider || ',') + obj.common.longitude;
                this.setState(
                    {
                        value,
                    },
                    () => {
                        const mayByPromise = this.onChange(this.props.attr, value);
                        if (mayByPromise instanceof Promise) {
                            mayByPromise.catch(e => console.error(`Cannot set value: ${e}`));
                        }
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
    }

    getCoordinates(): void {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position: GeolocationPosition): Promise<void> => {
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
                                const mayByPromise = this.onChange(this.props.attr, value);
                                if (mayByPromise instanceof Promise) {
                                    mayByPromise.catch(e => console.error(`Cannot set value: ${e}`));
                                }
                            });
                        }
                    } else {
                        await this.getSystemCoordinates();
                    }
                },
                async (error: GeolocationPositionError): Promise<void> => {
                    console.error(`Cannot determine coordinates from browser: ${error.message}`);
                    await this.getSystemCoordinates();
                },
            );
        } else {
            void this.getSystemCoordinates().catch(e => {
                console.error(`Cannot determine coordinates: ${e}`);
            });
        }
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */): JSX.Element {
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
                                        void this.getSystemCoordinates().catch(e =>
                                            console.error(`Cannot determine coordinates: ${e}`),
                                        );
                                    }
                                    this.setState({ useSystem }, () =>
                                        this.onChange(this.props.schema.useSystemName, useSystem),
                                    );
                                }}
                            />
                        }
                        label={I18n.t('ra_Use system settings for position')}
                    />
                ) : null}
                {this.props.schema.longitudeName && this.props.schema.latitudeName ? (
                    <TextField
                        variant="standard"
                        style={styles.width50}
                        value={this.state.longitude ?? ''}
                        error={!!error}
                        disabled={this.state.useSystem || !!disabled}
                        onChange={e => {
                            const longitude = e.target.value;
                            this.setState({ longitude }, () => {
                                const mayBePromise = this.onChange(
                                    this.props.schema.longitudeName,
                                    (longitude || '').trim(),
                                );
                                if (mayBePromise instanceof Promise) {
                                    mayBePromise.catch(e => console.error(`Cannot set value: ${e}`));
                                }
                            });
                        }}
                        label={I18n.t('ra_Longitude')}
                    />
                ) : null}
                {this.props.schema.longitudeName && this.props.schema.latitudeName ? (
                    <TextField
                        variant="standard"
                        style={styles.width50}
                        value={this.state.latitude ?? ''}
                        error={!!error}
                        disabled={this.state.useSystem || !!disabled}
                        onChange={e => {
                            const latitude = e.target.value;
                            this.setState({ latitude }, () =>
                                this.onChange(this.props.schema.latitudeName, (latitude || '').trim()),
                            );
                        }}
                        label={I18n.t('ra_Latitude')}
                    />
                ) : null}
                {!this.props.schema.longitudeName || !this.props.schema.latitudeName ? (
                    <TextField
                        variant="standard"
                        style={styles.width}
                        value={this.state.value === null || this.state.value === undefined ? '' : this.state.value}
                        error={!!error}
                        disabled={!!disabled}
                        slotProps={{
                            htmlInput: {
                                maxLength: this.props.schema.maxLength || this.props.schema.max || undefined,
                                readOnly: this.state.useSystem,
                            },
                        }}
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

export default ConfigCoordinates;
