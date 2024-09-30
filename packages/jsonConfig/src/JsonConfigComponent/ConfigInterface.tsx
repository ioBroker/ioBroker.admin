import React, { type JSX } from 'react';

import { InputLabel, TextField, FormHelperText, MenuItem, FormControl, Select } from '@mui/material';

import type { ConfigItemInterface } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface NetworkInterfaceBase {
    address: string;
    netmask: string;
    mac: string;
    internal: boolean;
    cidr: string | null;
}
interface NetworkInterfaceInfoIPv4 extends NetworkInterfaceBase {
    family: 'IPv4';
    scopeid?: undefined;
}
interface NetworkInterfaceInfoIPv6 extends NetworkInterfaceBase {
    family: 'IPv6';
    scopeid: number;
}
type NetworkInterfaceInfo = NetworkInterfaceInfoIPv4 | NetworkInterfaceInfoIPv6;

const styles: Record<string, React.CSSProperties> = {
    address: {
        fontSize: 'smaller',
        opacity: 0.5,
        marginLeft: 8,
    },
};

interface ConfigInterfaceProps extends ConfigGenericProps {
    schema: ConfigItemInterface;
}

interface ConfigInterfaceState extends ConfigGenericState {
    interfaces?: { value: string; address: string }[];
}

class ConfigInterface extends ConfigGeneric<ConfigInterfaceProps, ConfigInterfaceState> {
    componentDidMount(): void {
        super.componentDidMount();
        this.props.socket
            .getObject(`system.host.${this.props.common.host}`)
            .then(obj => {
                const interfaces: { value: string; address: string }[] = [];
                if (obj?.native?.hardware?.networkInterfaces) {
                    const list = obj.native.hardware.networkInterfaces;
                    Object.keys(list).forEach(inter => {
                        if (this.props.schema.ignoreInternal && !list[inter].find(_ip => !_ip.internal)) {
                            return;
                        }
                        if (
                            this.props.schema.ignoreLoopback &&
                            list[inter].find(_ip => _ip.address === '127.0.0.1' || _ip.address === '::1')
                        ) {
                            return;
                        }

                        // find ipv4 address
                        let ip: NetworkInterfaceInfo = list[inter].find(_ip => _ip.family === 'IPv4');
                        ip = ip || list[inter].find(_ip => _ip.family === 'IPv6');
                        interfaces.push({ value: inter, address: ip.address });
                    });
                }

                this.setState({ interfaces });
            })
            .catch(e => window.alert(`Cannot read interfaces: ${e}`));
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */): JSX.Element {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        const item = this.state.interfaces?.find(it => it.value === value);

        return (
            <FormControl
                fullWidth
                variant="standard"
            >
                {this.state.interfaces?.length && this.props.schema.label ? (
                    <InputLabel>{this.getText(this.props.schema.label)}</InputLabel>
                ) : null}
                {!this.state.interfaces?.length ? (
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
                        renderValue={val => {
                            if (item) {
                                return (
                                    <span>
                                        {item.value}
                                        <span style={styles.address}>{item.address}</span>
                                    </span>
                                );
                            }
                            return val;
                        }}
                        onChange={e => this.onChange(this.props.attr, e.target.value)}
                    >
                        {this.state.interfaces.map((it, i) => (
                            <MenuItem
                                key={i}
                                value={it.value}
                            >
                                <span>
                                    {it.value}
                                    <span style={styles.address}>{it.address}</span>
                                </span>
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

export default ConfigInterface;
