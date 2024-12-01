import React, { type JSX } from 'react';

import { InputLabel, MenuItem, FormHelperText, FormControl, Select } from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';
import type { ConfigItemInstanceSelect } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    icon: {
        width: 20,
        height: 20,
        marginRight: 4,
    },
};

interface ConfigInstanceSelectProps extends ConfigGenericProps {
    schema: ConfigItemInstanceSelect;
}

interface ConfigInstanceSelectState extends ConfigGenericState {
    selectOptions?: { label: string; value: string; icon?: string }[];
}

class ConfigInstanceSelect extends ConfigGeneric<ConfigInstanceSelectProps, ConfigInstanceSelectState> {
    componentDidMount(): void {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        let adapter = this.props.schema.adapter;
        if (adapter === '_dataSources') {
            adapter = undefined;
        }

        void this.props.oContext.socket
            .getAdapterInstances(adapter, true)
            .then(async instances => {
                if (this.props.schema.adapter === '_dataSources') {
                    // get only "data-sources", like history, sql, influx
                    instances = instances.filter(instance => instance?.common?.getHistory);
                } else if (this.props.schema.adapter) {
                    instances = instances.filter(instance =>
                        instance?._id.startsWith(`system.adapter.${this.props.schema.adapter}.`),
                    );
                } else if (this.props.schema.adapters && Array.isArray(this.props.schema.adapters)) {
                    instances = instances.filter(instance =>
                        this.props.schema.adapters.includes(instance?.common?.name),
                    );
                }

                if (this.props.schema.onlyEnabled) {
                    instances = instances.filter(instance => instance?.common?.enabled);
                }

                const selectOptions: { label: string; value: string; icon?: string }[] = instances.map(instance => ({
                    value: this.props.schema.long
                        ? instance._id
                        : this.props.schema.short
                          ? instance._id.split('.').pop()
                          : instance._id.replace(/^system\.adapter\./, ''),
                    label: `${instance.common.name} [${instance._id.replace(/^system\.adapter\./, '')}]`,
                    icon: `adapter/${instance.common.name}/${instance.common.icon}`,
                }));

                selectOptions.sort((a, b) => {
                    if (a.value > b.value) {
                        return 1;
                    }
                    if (a.value < b.value) {
                        return -1;
                    }
                    return 0;
                });

                if (this.props.schema.allowDeactivate !== false) {
                    selectOptions.unshift({ label: I18n.t(ConfigGeneric.NONE_LABEL), value: ConfigGeneric.NONE_VALUE });
                }
                if (this.props.schema.all) {
                    selectOptions.unshift({ label: I18n.t('sch_all'), value: '*' });
                }

                this.setState({ value: value || '', selectOptions });

                await this.props.oContext.socket.subscribeObject(
                    `system.adapter.${adapter ? `${adapter}.` : ''}*`,
                    this.onInstancesUpdate,
                );
            })
            .catch(e => console.error(`Cannot get instances: ${e}`));
    }

    componentWillUnmount(): void {
        void this.props.oContext.socket.unsubscribeObject('system.adapter.*', this.onInstancesUpdate).then(() => {});
        super.componentWillUnmount();
    }

    onInstancesUpdate = (id: string, obj?: ioBroker.Object | null): void => {
        if (!id.match(/^system\.adapter\.[-_a-z\d]+\.\d+$/)) {
            return;
        }
        const _id = this.props.schema.long
            ? id
            : this.props.schema.short
              ? id.split('.').pop()
              : id.replace(/^system\.adapter\./, '');
        const index = this.state.selectOptions.findIndex(item => item.value === _id);
        if (!obj) {
            // deleted
            if (index !== -1) {
                const selectOptions: { label: string; value: string; icon?: string }[] = JSON.parse(
                    JSON.stringify(this.state.selectOptions),
                );

                const newState: Partial<ConfigInstanceSelectState> = {};
                if (this.state.value === selectOptions[index].value) {
                    newState.value = ConfigGeneric.NONE_VALUE;
                }
                selectOptions.splice(index, 1);
                newState.selectOptions = selectOptions;

                this.setState(newState as ConfigInstanceSelectState);
            }
        } else {
            if (this.props.schema.adapter === '_dataSources' && (!obj.common || !obj.common.getHistory)) {
                return;
            }

            if (index === -1) {
                const selectOptions: { label: string; value: string; icon?: string }[] = JSON.parse(
                    JSON.stringify(this.state.selectOptions),
                );
                const name =
                    typeof obj.common.name === 'object'
                        ? obj.common.name[I18n.getLanguage()] || obj.common.name.en
                        : obj.common.name;
                selectOptions.push({
                    value: this.props.schema.long
                        ? obj._id
                        : this.props.schema.short
                          ? obj._id.split('.').pop()
                          : obj._id.replace(/^system\.adapter\./, ''),
                    label: `${name} [${obj._id.replace(/^system\.adapter\./, '')}]`,
                    icon: `adapter/${name}/${obj.common.icon}`,
                });
                selectOptions.sort((a, b) => (a.label > b.label ? 1 : a.label < b.label ? -1 : 0));
                this.setState({ selectOptions });
            }
        }
    };

    renderItem(error: string, disabled: boolean /* , defaultValue */): JSX.Element {
        if (!this.state.selectOptions) {
            return null;
        }

        const item = this.state.selectOptions?.find(it => it.value === this.state.value);

        return (
            <FormControl
                fullWidth
                key={this.props.attr}
                variant="standard"
            >
                {this.props.schema.label ? (
                    <InputLabel shrink>{this.getText(this.props.schema.label)}</InputLabel>
                ) : null}
                <Select
                    variant="standard"
                    error={!!error}
                    displayEmpty
                    disabled={!!disabled}
                    value={this.state.value}
                    renderValue={() => (
                        <span style={{ display: 'flex' }}>
                            {item?.icon ? (
                                <img
                                    src={`./${item.icon}`}
                                    alt={item.value}
                                    style={styles.icon}
                                />
                            ) : null}
                            {this.getText(item?.label, true)}
                        </span>
                    )}
                    onChange={e =>
                        this.setState({ value: e.target.value }, () => this.onChange(this.props.attr, this.state.value))
                    }
                >
                    {this.state.selectOptions.map(it => (
                        <MenuItem
                            key={it.value}
                            value={it.value}
                            style={it.value === ConfigGeneric.NONE_VALUE ? { opacity: 0.5 } : {}}
                        >
                            {it.icon ? (
                                <img
                                    src={`./${it.icon}`}
                                    alt={it.value}
                                    style={styles.icon}
                                />
                            ) : null}
                            {this.getText(it.label, true)}
                        </MenuItem>
                    ))}
                </Select>
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

export default ConfigInstanceSelect;
