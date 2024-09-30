import React, { type JSX } from 'react';

import { InputLabel, TextField, FormHelperText, MenuItem, FormControl, Select } from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemIP } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigIPProps extends ConfigGenericProps {
    schema: ConfigItemIP;
}

interface ConfigIPState extends ConfigGenericState {
    ips?: { name: string; address: string; family: string; internal?: boolean }[];
}

class ConfigIP extends ConfigGeneric<ConfigIPProps, ConfigIPState> {
    componentDidMount(): void {
        super.componentDidMount();
        this.props.socket
            .getHostByIp(this.props.common.host)
            .then(ips => {
                // [{name, address, family}]
                if (!this.props.schema.listenOnAllPorts) {
                    ips = ips.filter(item => item.address !== '0.0.0.0' && item.address !== '::');
                }
                if (this.props.schema.onlyIp4) {
                    ips = ips.filter(item => item.family === 'ipv4');
                } else if (this.props.schema.onlyIp6) {
                    ips = ips.filter(item => item.family === 'ipv6');
                }
                if (this.props.schema.noInternal) {
                    ips = ips.filter(item => !item.internal);
                }
                ips.forEach(item => {
                    if (item.address === '0.0.0.0') {
                        item.name = `[IPv4] 0.0.0.0 - ${I18n.t('ra_Listen on all IPs')}`;
                    } else if (item.address === '::') {
                        item.name = `[IPv6] :: - ${I18n.t('ra_Listen on all IPs')}`;
                    }
                });
                this.setState({ ips });
            })
            .catch(e => console.error(e));
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */): JSX.Element {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        const item = this.state.ips?.find(it => it.address === value);

        return (
            <FormControl
                fullWidth
                variant="standard"
            >
                {this.state.ips && this.props.schema.label ? (
                    <InputLabel>{this.getText(this.props.schema.label)}</InputLabel>
                ) : null}
                {!this.state.ips ? (
                    <TextField
                        fullWidth
                        variant="standard"
                        error={!!error}
                        disabled={!!disabled}
                        value={value}
                        onChange={e => this.onChange(this.props.attr, e.target.value)}
                        label={this.getText(this.props.schema.label)}
                    />
                ) : (
                    <Select
                        variant="standard"
                        error={!!error}
                        disabled={!!disabled}
                        value={value}
                        renderValue={val => item?.name || val}
                        onChange={e => this.onChange(this.props.attr, e.target.value)}
                    >
                        {this.state.ips?.map((it, i) => (
                            <MenuItem
                                key={i}
                                value={it.address}
                            >
                                {it.name}
                            </MenuItem>
                        ))}
                    </Select>
                )}
                {this.props.schema.help ? (
                    <FormHelperText>
                        {this.renderHelp(
                            this.props.schema.help,
                            this.props.schema.helpLink,
                            this.props.schema.noTranslation,
                        )}
                    </FormHelperText>
                ) : null}
            </FormControl>
        );
    }
}

export default ConfigIP;
