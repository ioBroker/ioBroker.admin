import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import Icon from './wrapper/Components/Icon';
import I18n from './wrapper/i18n';
import Utils from './wrapper/Components/Utils';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    },
    icon: {
        width: 16,
        height: 16,
        marginRight: 8
    }
});

class ConfigUser extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        this.props.socket.getUsers()
            .then(users => {
                const _users = {};
                const lang = I18n.getLanguage();

                if (this.props.schema.short) {
                    users.forEach(user => _users[user._id] = {
                        color: user.common?.color,
                        icon: user.common?.icon,
                        name: Utils.getObjectNameFromObj(user, lang)
                    });
                } else {
                    users.forEach(user => _users[user._id.replace(/^system\.user\./, '')] = {
                        color: user.common?.color,
                        icon: user.common?.icon,
                        name: Utils.getObjectNameFromObj(user, lang)
                    });
                }

                this.setState({users: _users});
            });
    }

    renderItem(error, disabled, defaultValue) {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        return <FormControl variant="standard" className={this.props.classes.fullWidth}>
            <InputLabel>{this.getText(this.props.schema.label)}</InputLabel>
            <Select
                variant="standard"
                error={!!error}
                disabled={!!disabled}
                value={value}
                renderValue={val => <span>{this.state.users && this.state.users[val]?.icon ? <Icon src={this.state.users && this.state.users[val]?.icon} className={this.props.classes.icon} /> : null}{(this.state.users && this.state.users[val]?.name) || val || ''}</span>}
                style={{ color: (this.state.users && this.state.users[value]?.color) || undefined, backgroundColor: Utils.getInvertedColor(this.state.users && this.state.users[value]?.color, this.props.themeType) }}
                onChange={e => this.onChange(this.props.attr, e.target.value)}
            >
                {this.state.users && Object.keys(this.state.users).map(id => <MenuItem style={{ color: this.state.users[id].color || undefined, backgroundColor: Utils.getInvertedColor(this.state.users[id].color, this.props.themeType) }} key={id} value={id}>
                    {this.state.users[id].icon ? <Icon src={this.state.users[id].icon} className={this.props.classes.icon} /> : null}
                    {this.state.users[id].name}
                </MenuItem>)}
            </Select>
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

ConfigUser.propTypes = {
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

export default withStyles(styles)(ConfigUser);