import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import { InputLabel, TextField, FormHelperText, MenuItem, FormControl, Select, } from '@mui/material';
import ConfigGeneric from './ConfigGeneric';
const styles = () => ({
    fullWidth: {
        width: '100%',
    },
    address: {
        fontSize: 'smaller',
        opacity: 0.5,
        marginLeft: 8,
    },
});
class ConfigInterface extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        this.props.socket.getObject(`system.host.${this.props.common.host}`)
            .then(obj => {
            const interfaces = [];
            if (obj?.native?.hardware?.networkInterfaces) {
                const list = obj.native.hardware.networkInterfaces;
                Object.keys(list).forEach(inter => {
                    if (this.props.schema.ignoreInternal && !list[inter].find(_ip => !_ip.internal)) {
                        return;
                    }
                    if (this.props.schema.ignoreLoopback && list[inter].find(_ip => _ip.address === '127.0.0.1' || _ip.address === '::1')) {
                        return;
                    }
                    // find ipv4 address
                    let ip = list[inter].find(_ip => _ip.family === 'IPv4');
                    ip = ip || list[inter].find(_ip => _ip.family === 'IPv6');
                    interfaces.push({ value: inter, address: ip.address });
                });
            }
            this.setState({ interfaces });
        })
            .catch(e => window.alert(`Cannot read interfaces: ${e}`));
    }
    renderItem(error, disabled /* , defaultValue */) {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        const item = this.state.interfaces?.find(it => it.value === value);
        return React.createElement(FormControl, { className: this.props.classes.fullWidth, variant: "standard" },
            this.state.interfaces?.length && this.props.schema.label ? React.createElement(InputLabel, null, this.getText(this.props.schema.label)) : null,
            !this.state.interfaces?.length ?
                React.createElement(TextField, { fullWidth: true, variant: "standard", error: !!error, disabled: !!disabled, value: value, onChange: e => this.onChange(this.props.attr, e.target.value), label: this.getText(this.props.schema.label) }) :
                React.createElement(Select, { variant: "standard", error: !!error, disabled: !!disabled, value: value, renderValue: val => {
                        if (item) {
                            return React.createElement("span", null,
                                item.value,
                                React.createElement("span", { className: this.props.classes.address }, item.address));
                        }
                        return val;
                    }, onChange: e => this.onChange(this.props.attr, e.target.value) }, this.state.interfaces.map((it, i) => React.createElement(MenuItem, { key: i, value: it.value },
                    React.createElement("span", null,
                        it.value,
                        React.createElement("span", { className: this.props.classes.address }, it.address))))),
            this.props.schema.help ? React.createElement(FormHelperText, null, this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)) : null);
    }
}
ConfigInterface.propTypes = {
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
export default withStyles(styles)(ConfigInterface);
//# sourceMappingURL=ConfigInterface.js.map