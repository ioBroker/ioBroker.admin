import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import TextWithIcon from './wrapper/Components/TextWithIcon';
import I18n from './wrapper/i18n';

import ConfigGeneric from './ConfigGeneric';

const styles = () => ({
    fullWidth: {
        width: '100%'
    }
});

class ConfigFunc extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        this.props.socket.getEnums('rooms')
            .then(enums => {
                const selectOptions = Object.keys(enums)
                    .map(id => ({ value: this.props.schema.short ? id.replace('enum.rooms.', '') : id, label: this.getText(enums[id].common.name), obj: enums[id]}));
                this.setState({ value, selectOptions });
            });
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.selectOptions) {
            return null;
        }

        const item = this.state.selectOptions.find(item => item.value === this.state.value);

        return <FormControl
            variant="standard"
            className={this.props.classes.fullWidth}
        >
            <InputLabel>{this.getText(this.props.schema.label)}</InputLabel>
            <Select
                variant="standard"
                error={!!error}
                disabled={!!disabled}
                value={this.state.value || '_'}
                renderValue={val => item ? <TextWithIcon value={item.obj} themeType={this.props.themeType} lang={I18n.getLanguage()}/> : ''}
                onChange={e => {
                    this.setState({value: e.target.value === '_' ? '' : e.target.value}, () =>
                        this.onChange(this.props.attr, this.state.value));
                }}
            >
                {this.state.selectOptions.map(item =>
                    <MenuItem key={item.value} value={item.value} style={item.value === ConfigGeneric.DIFFERENT_VALUE ? {opacity: 0.5} : {}}>
                        <TextWithIcon value={item.obj} themeType={this.props.themeType} lang={I18n.getLanguage()}/>
                    </MenuItem>)}
            </Select>
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

ConfigFunc.propTypes = {
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

export default withStyles(styles)(ConfigFunc);