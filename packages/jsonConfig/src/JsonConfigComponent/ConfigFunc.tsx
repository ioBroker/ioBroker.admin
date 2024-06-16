import React from 'react';

import {
    InputLabel,
    MenuItem,
    FormHelperText,
    FormControl,
    Select,
} from '@mui/material';

import { TextWithIcon, I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemFunc } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigFuncProps extends ConfigGenericProps {
    schema: ConfigItemFunc;
}

interface ConfigFuncState extends ConfigGenericState {
    selectOptions?: { value: string; label: string; obj?: ioBroker.EnumObject }[];
}

class ConfigFunc extends ConfigGeneric<ConfigFuncProps, ConfigFuncState> {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        this.props.socket.getEnums('functions')
            .then(enums => {
                const selectOptions: { value: string; label: string }[] = Object.keys(enums)
                    .map(id => ({
                        value: this.props.schema.short ? id.replace('enum.functions.', '') : id,
                        label: this.getText(enums[id].common.name),
                        obj: enums[id],
                    }));

                if (this.props.schema.allowDeactivate !== false) {
                    selectOptions.unshift({ label: I18n.t(ConfigGeneric.NONE_LABEL), value: ConfigGeneric.NONE_VALUE });
                }

                this.setState({ value, selectOptions });
            });
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */) {
        if (!this.state.selectOptions) {
            return null;
        }

        const item = this.state.selectOptions.find(it => it.value === this.state.value);

        return <FormControl
            variant="standard"
            fullWidth
        >
            {this.props.schema.label ? <InputLabel>{this.getText(this.props.schema.label)}</InputLabel> : null}
            <Select
                variant="standard"
                error={!!error}
                disabled={!!disabled}
                value={this.state.value || '_'}
                renderValue={() => (item ? (item.obj ? <TextWithIcon value={item.obj} themeType={this.props.themeType} lang={I18n.getLanguage()} /> : item.label) : '')}
                onChange={e => {
                    this.setState({ value: e.target.value === '_' ? '' : e.target.value }, () =>
                        this.onChange(this.props.attr, this.state.value));
                }}
            >
                {this.state.selectOptions.map(it =>
                    <MenuItem key={it.value} value={it.value} style={it.value === ConfigGeneric.DIFFERENT_VALUE ? { opacity: 0.5 } : {}}>
                        {it.obj ? <TextWithIcon value={it.obj} themeType={this.props.themeType} lang={I18n.getLanguage()} /> : it.label}
                    </MenuItem>)}
            </Select>
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

export default ConfigFunc;
