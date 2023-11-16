import React from 'react';
import { withStyles } from '@mui/styles';

import {
    InputLabel,
    MenuItem,
    FormHelperText,
    FormControl,
    Select,
} from '@mui/material';

// @ts-expect-error optimize export of socket-client types
import type { SystemConfig } from '@iobroker/socket-client';
import I18n from './wrapper/i18n';

import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles = () => ({
    fullWidth: {
        width: '100%',
    },
});

const LANGUAGES = [
    {
        value: 'en',
        label: 'English',
    },
    {
        value: 'de',
        label: 'Deutsch',
    },
    {
        value: 'ru',
        label: 'русский',
    },
    {
        value: 'pt',
        label: 'Portugues',
    },
    {
        value: 'nl',
        label: 'Nederlands',
    },
    {
        value: 'fr',
        label: 'français',
    },
    {
        value: 'it',
        label: 'Italiano',
    },
    {
        value: 'es',
        label: 'Espanol',
    },
    {
        value: 'pl',
        label: 'Polski',
    },
    {
        value: 'uk',
        label: 'Український',
    },
    {
        value: 'zh-ch',
        label: '简体中文',
    },
] as const;

interface LanguageSelectOption {
    /** Value to save */
    value: string;
    /** Label to show */
    label: string;
}

interface ConfigLanguageProps extends ConfigGenericProps {
    changeLanguage: () => void;
}

interface ConfigLanguageState extends ConfigGenericState {
    selectOptions: LanguageSelectOption[];
}

class ConfigLanguage extends ConfigGeneric<ConfigLanguageProps, ConfigLanguageState> {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        const languages: LanguageSelectOption[] = [...LANGUAGES];
        if (this.props.schema.system) {
            languages.unshift({ value: '', label: I18n.t('ra_System language') });
        }

        this.setState({ value: this.props.schema.system ? (value || '') : (value || I18n.getLanguage()), selectOptions: languages });
    }

    renderItem(error: unknown, disabled: boolean): React.JSX.Element | null {
        if (!this.state.selectOptions) {
            return null;
        }

        const item = this.state.selectOptions?.find(it => it.value === this.state.value || (!it.value && !this.state.value));

        return <FormControl className={this.props.classes.fullWidth} variant="standard">
            {this.props.schema.label ? <InputLabel>{this.getText(this.props.schema.label)}</InputLabel> : null}
            <Select
                variant="standard"
                error={!!error}
                disabled={disabled}
                value={this.state.value || '_'}
                renderValue={() => this.getText(item?.label, this.props.schema.noTranslation)}
                onChange={e => {
                    const { value } = e.target;
                    this.setState({ value }, () => {
                        this.onChange(this.props.attr, value);
                        if (this.props.schema.changeGuiLanguage) {
                            if (value) {
                                if (value === I18n.getLanguage()) {
                                    return;
                                }
                                I18n.setLanguage(value);
                                this.props.changeLanguage && this.props.changeLanguage();
                            } else {
                                this.props.socket.getSystemConfig()
                                    .then((systemConfig: SystemConfig) => {
                                        if (systemConfig.common.language === I18n.getLanguage()) {
                                            return;
                                        }
                                        if (systemConfig.common.language) {
                                            I18n.setLanguage(systemConfig.common.language);
                                            this.props.changeLanguage && this.props.changeLanguage();
                                        }
                                    });
                            }
                        }
                    });
                }}
            >
                {this.state.selectOptions?.map(it =>
                    <MenuItem key={it.value} value={it.value}>{it.label}</MenuItem>)}
            </Select>
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

export default withStyles(styles)(ConfigLanguage);
