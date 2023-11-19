import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import { InputLabel, TextField, MenuItem, FormHelperText, FormControl, Select, } from '@mui/material';
import Icon from './wrapper/Components/Icon';
import I18n from './wrapper/i18n';
import Utils from './wrapper/Components/Utils';
import ConfigGeneric from './ConfigGeneric';
const styles = () => ({
    fullWidth: {
        width: '100%',
    },
    icon: {
        width: 16,
        height: 16,
        marginRight: 8,
    },
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
                    name: Utils.getObjectNameFromObj(user, lang),
                });
            }
            else {
                users.forEach(user => _users[user._id.replace(/^system\.user\./, '')] = {
                    color: user.common?.color,
                    icon: user.common?.icon,
                    name: Utils.getObjectNameFromObj(user, lang),
                });
            }
            this.setState({ users: _users });
        });
    }
    renderItem(error, disabled /* , defaultValue */) {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        return React.createElement(FormControl, { variant: "standard", className: this.props.classes.fullWidth },
            this.state.users && this.props.schema.label ? React.createElement(InputLabel, null, this.getText(this.props.schema.label)) : null,
            !this.state.users ?
                React.createElement(TextField, { variant: "standard", error: !!error, disabled: !!disabled, value: value, onChange: e => this.onChange(this.props.attr, e.target.value), label: this.getText(this.props.schema.label) })
                :
                    React.createElement(Select, { variant: "standard", error: !!error, disabled: !!disabled, value: value, renderValue: val => React.createElement("span", null,
                            this.state.users && this.state.users[val]?.icon ? React.createElement(Icon, { src: this.state.users && this.state.users[val]?.icon, className: this.props.classes.icon }) : null,
                            (this.state.users && this.state.users[val]?.name) || val || ''), style: { color: (this.state.users && this.state.users[value]?.color) || undefined, backgroundColor: Utils.getInvertedColor(this.state.users && this.state.users[value]?.color, this.props.themeType) }, onChange: e => this.onChange(this.props.attr, e.target.value) }, this.state.users && Object.keys(this.state.users).map(id => React.createElement(MenuItem, { style: { color: this.state.users[id].color || undefined, backgroundColor: Utils.getInvertedColor(this.state.users[id].color, this.props.themeType) }, key: id, value: id },
                        this.state.users[id].icon ? React.createElement(Icon, { src: this.state.users[id].icon, className: this.props.classes.icon }) : null,
                        this.state.users[id].name))),
            this.props.schema.help ? React.createElement(FormHelperText, null, this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)) : null);
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
//# sourceMappingURL=ConfigUser.js.map