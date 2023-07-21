import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import I18n from './wrapper/i18n';

import ConfigGeneric from './ConfigGeneric';

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
];

class ConfigLanguage extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        const languages = [...LANGUAGES];
        if (this.props.schema.system) {
            languages.unshift({ value: '_', label: I18n.t('ra_System language') });
        }

        this.setState({ value: this.props.schema.system ? (value || '') : (value || I18n.getLanguage()), selectOptions: languages });
    }

    renderItem(error, disabled /* , defaultValue */) {
        if (!this.state.selectOptions) {
            return null;
        }

        const item = this.state.selectOptions?.find(it => it.value === this.state.value || (!it.value && !this.state.value));

        return <FormControl className={this.props.classes.fullWidth} variant="standard">
            {this.props.schema.label ? <InputLabel>{this.getText(this.props.schema.label)}</InputLabel> : null}
            <Select
                variant="standard"
                error={!!error}
                disabled={!!disabled}
                value={this.state.value || '_'}
                renderValue={() => this.getText(item?.label, this.props.schema.noTranslation)}
                onChange={e => {
                    const value = e.target.value === '_' ? '' : e.target.value;
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
                                    .then(systemConfig => {
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

ConfigLanguage.propTypes = {
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

export default withStyles(styles)(ConfigLanguage);
