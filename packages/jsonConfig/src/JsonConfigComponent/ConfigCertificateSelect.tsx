import React from 'react';

import {
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    FormHelperText,
} from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';
import type { ConfigItemCertificateSelect } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigCertificateSelectProps extends ConfigGenericProps {
    schema: ConfigItemCertificateSelect;
}

interface ConfigCertificateSelectState extends ConfigGenericState {
    selectOptions?: { label: string; value: string }[];
}

class ConfigCertificateSelect extends ConfigGeneric<ConfigCertificateSelectProps, ConfigCertificateSelectState> {
    async componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        // Important: getCertificates is only available in AdminConnection
        const certificates = await this.props.socket.getCertificates();

        const selectOptions: { label: string; value: string }[] = certificates
            .filter(el => {
                const name = this.props.attr.toLowerCase();

                if (name.includes(el.type)) {
                    return true;
                }
                if (el.type === 'public' && name.includes('cert')) {
                    return true;
                }
                if (el.type === 'private' && (name.includes('priv') || name.includes('key'))) {
                    return true;
                }
                return !!(el.type === 'chained' && (name.includes('chain') || name.includes('ca')));
            })
            .map(el => ({ label: el.name, value: el.name }));

        selectOptions.unshift({ label: I18n.t(ConfigGeneric.NONE_LABEL), value: ConfigGeneric.NONE_VALUE });

        this.setState({ value, selectOptions });
    }

    renderItem(error: unknown, disabled: boolean /* , defaultValue */) {
        if (!this.state.selectOptions) {
            return null;
        }

        const item = this.state.selectOptions?.find(item => item.value === this.state.value);

        return <FormControl style={{ width: '100%' }} variant="standard">
            {this.props.schema.label ? <InputLabel shrink>{this.getText(this.props.schema.label)}</InputLabel> : null}
            <Select
                variant="standard"
                error={!!error}
                displayEmpty
                disabled={!!disabled}
                value={this.state.value}
                renderValue={() => this.getText(item?.label, this.props.schema.noTranslation !== false)}
                onChange={e =>
                    this.setState({ value: e.target.value }, () =>
                        this.onChange(this.props.attr, this.state.value))}
            >
                {this.state.selectOptions?.map(item_ =>
                    <MenuItem
                        key={item_.value}
                        value={item_.value}
                        style={item_.value === ConfigGeneric.NONE_VALUE ? { opacity: 0.5 } : {}}
                    >
                        {this.getText(item_.label, this.props.schema.noTranslation !== false)}
                    </MenuItem>)}
            </Select>
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

export default ConfigCertificateSelect;
