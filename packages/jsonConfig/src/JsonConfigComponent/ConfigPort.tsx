import React, { type JSX } from 'react';

import { TextField } from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemPort } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, any> = {
    warning: {
        '& .Mui-error': {
            color: 'orange',
        },
    },
};

interface Port {
    name: string;
    port: number;
    bind: string;
    v6bind: string;
    enabled: boolean;
}

interface ConfigPortProps extends ConfigGenericProps {
    schema: ConfigItemPort;
}

interface ConfigPortState extends ConfigGenericState {
    _value: string;
    oldValue: string | null;
    ports: Port[];
}

class ConfigPort extends ConfigGeneric<ConfigPortProps, ConfigPortState> {
    private updateTimeout?: ReturnType<typeof setTimeout>;

    async componentDidMount(): Promise<void> {
        super.componentDidMount();
        let _value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        if (_value === null || _value === undefined) {
            _value = '';
        }
        this.setState({ _value: _value.toString(), oldValue: _value.toString() });

        // read all instances
        const instances: ioBroker.InstanceObject[] = await this.props.socket.getAdapterInstances();

        const ownId = `system.adapter.${this.props.adapterName}.${this.props.instance}`;
        const instanceObj: ioBroker.InstanceObject = (await this.props.socket.getObject(
            ownId,
        )) as ioBroker.InstanceObject;
        const ownHostname = instanceObj?.common.host;

        const ports: Port[] = [];
        instances.forEach(instance => {
            // ignore own instance and instances on another host
            if (!instance || instance._id === ownId || instance.common.host !== ownHostname) {
                return;
            }
            // check port only if bind attribute is present too
            if (!instance.native?.bind) {
                return;
            }

            // if let's encrypt is enabled and update is enabled, then add port to check
            if (instance?.native && instance.native.secure && instance.native.leEnabled && instance.native.leUpdate) {
                const port = parseInt(instance.native.leCheckPort || instance.native.lePort, 10);
                if (port) {
                    ports.push({
                        name: `${instance._id.replace('system.adapter.', '')} (LE)`,
                        port,
                        v6bind: instance.native.bind.includes(':') ? instance.native.bind : instance.native.v6bind,
                        bind: instance.native.bind,
                        enabled: !!instance.common?.enabled,
                    });
                }
            }

            const port = parseInt(instance?.native?.port, 10);
            if (port) {
                ports.push({
                    name: instance._id.replace('system.adapter.', ''),
                    bind: instance.native.bind,
                    v6bind: instance.native.bind.includes(':') ? instance.native.bind : instance.native.v6bind,
                    port,
                    enabled: !!instance.common?.enabled,
                });
            }
        });
        this.setState({ ports });
    }

    static getDerivedStateFromProps(props: ConfigPortProps, state: ConfigPortState): Partial<ConfigPortState> | null {
        const _value = ConfigGeneric.getValue(props.data, props.attr);
        if (
            _value === null ||
            _value === undefined ||
            state.oldValue === null ||
            state.oldValue === undefined ||
            (_value.toString() !== parseInt(state._value, 10).toString() &&
                _value.toString() !== state.oldValue.toString())
        ) {
            return { _value };
        }

        return null;
    }

    checkValue(value: string): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        const min = this.props.schema.min === undefined ? 20 : this.props.schema.min;
        const max = this.props.schema.max || 0xffff;

        value = value.toString().trim();
        const f = value === '' ? 0 : parseInt(value, 10);

        if (value !== '' && Number.isNaN(f)) {
            return 'ra_Not a number';
        }

        if (value !== '' && window.isFinite(Number(value))) {
            if (f < min) {
                return 'ra_Too small';
            }
            if (f > max) {
                return 'ra_Too big';
            }
            if (value === '' || value === '-' || Number.isNaN(f)) {
                return 'ra_Not a number';
            }

            return null;
        }

        return 'ra_Not a number';
    }

    renderItem(error: unknown, disabled: boolean): JSX.Element {
        if (this.state.oldValue !== null && this.state.oldValue !== undefined) {
            if (this.updateTimeout) {
                clearTimeout(this.updateTimeout);
            }
            this.updateTimeout = setTimeout(() => {
                this.updateTimeout = undefined;
                this.setState({ oldValue: null });
            }, 30);
        } else if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = undefined;
        }

        const min = this.props.schema.min === undefined ? 20 : this.props.schema.min;
        const max = this.props.schema.max || 0xffff;

        let warning;
        if (this.state.ports) {
            const num = parseInt(this.state._value, 10);

            if (num) {
                // filter ports only with the same bind address
                // todo: IPv6 (v6bind or '::/0')
                const ports = this.state.ports.filter(
                    item =>
                        !this.props.data.bind ||
                        this.props.data.bind === item.bind ||
                        this.props.data.bind === '0.0.0.0' ||
                        item.bind === '0.0.0.0',
                );

                let idx = ports.findIndex(item => item.port === num && item.enabled);
                if (idx !== -1) {
                    error = I18n.t('ra_Port is already used by %s', this.state.ports[idx].name);
                } else {
                    idx = ports.findIndex(item => item.port === num && !item.enabled);
                    if (idx !== -1) {
                        warning = true;
                        error = I18n.t('ra_Port could be used by %s', this.state.ports[idx].name);
                    }
                }
            }
        }

        if (!error && this.state._value !== null && this.state._value !== undefined) {
            error = this.checkValue(this.state._value);
            if (typeof error === 'string') {
                error = I18n.t(error);
            }
        }

        return (
            <TextField
                variant="standard"
                type="number"
                fullWidth
                slotProps={{
                    htmlInput: {
                        min,
                        max,
                        readOnly: this.props.schema.readOnly || false,
                    },
                }}
                value={this.state._value === null || this.state._value === undefined ? '' : this.state._value}
                error={!!error}
                disabled={!!disabled}
                sx={warning ? styles.warning : undefined}
                onChange={e => {
                    const _value = Number(e.target.value.toString().replace(/[^0-9]/g, '')).toString();
                    const _error = this.checkValue(_value);
                    if (_error) {
                        this.onError(this.props.attr, I18n.t(_error));
                    } else {
                        this.onError(this.props.attr); // clear error
                    }

                    this.setState({ _value, oldValue: this.state._value }, () => {
                        if (_value.trim() === parseInt(_value, 10).toString()) {
                            const maybePromise = this.onChange(this.props.attr, parseInt(_value, 10) || 0);
                            if (maybePromise instanceof Promise) {
                                maybePromise.catch(err => {
                                    console.error(`Cannot set value for ${this.props.attr}: ${err}`);
                                });
                            }
                        }
                    });
                }}
                placeholder={this.getText(this.props.schema.placeholder)}
                label={this.getText(this.props.schema.label)}
                helperText={
                    error && typeof error === 'string'
                        ? error
                        : this.renderHelp(
                              this.props.schema.help,
                              this.props.schema.helpLink,
                              this.props.schema.noTranslation,
                          )
                }
            />
        );
    }
}

export default ConfigPort;
