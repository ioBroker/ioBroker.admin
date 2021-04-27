import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import I18n from '@iobroker/adapter-react/i18n';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    }
});

const LANGUAGES =[
    {
        value: 'en',
        label: 'English'
    },
    {
        value: 'de',
        label: 'Deutsch'
    },
    {
        value: 'ru',
        label: 'русский'
    },
    {
        value: 'pt',
        label: 'Portugues'
    },
    {
        value: 'nl',
        label: 'Nederlands'
    },
    {
        value: 'fr',
        label: 'français'
    },
    {
        value: 'it',
        label: 'Italiano'
    },
    {
        value: 'es',
        label: 'Espanol'
    },
    {
        value: 'pl',
        label: 'Polski'
    },
    {
        value: 'zh-ch',
        label: '简体中文'
    }
];

class ConfigLanguage extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        const languages = [...LANGUAGES];
        if (this.props.schema.system) {
            languages.unshift({value: '', label: I18n.t('System language')});
        }

        this.setState({value: value || I18n.getLanguage(), selectOptions: languages});
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.selectOptions) {
            return null;
        }

        const item = this.state.selectOptions?.find(item => item.value === this.state.value || (!item.value && !this.state.value));

        return <FormControl className={this.props.classes.fullWidth}>
            <InputLabel>{this.getText(this.props.schema.label)}</InputLabel>
            <Select
                error={!!error}
                disabled={!!disabled}
                value={this.state.value || '_'}
                renderValue={val => this.getText(item?.label, this.props.schema.noTranslation)}
                onChange={e => {
                    const value = e.target.value === '_' ? '' : e.target.value;
                    this.setState({value}, () =>
                        this.onChange(this.props.attr, value));
                }}
            >
                {this.state.selectOptions?.map(item =>
                    <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
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