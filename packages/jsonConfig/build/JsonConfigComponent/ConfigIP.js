import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import { InputLabel, TextField, FormHelperText, MenuItem, FormControl, Select, } from '@mui/material';
import I18n from './wrapper/i18n';
import ConfigGeneric from './ConfigGeneric';
const styles = () => ({
    fullWidth: {
        width: '100%',
    },
});
class ConfigIP extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        this.props.socket.getHostByIp(this.props.common.host)
            .then(ips => {
            // [{name, address, family}]
            if (!this.props.schema.listenOnAllPorts) {
                ips = ips.filter(item => item.address !== '0.0.0.0' && item.address !== '::');
            }
            if (this.props.schema.onlyIp4) {
                ips = ips.filter(item => item.family === 'ipv4');
            }
            else if (this.props.schema.onlyIp6) {
                ips = ips.filter(item => item.family === 'ipv6');
            }
            if (this.props.schema.noInternal) {
                ips = ips.filter(item => !item.internal);
            }
            ips.forEach(item => {
                if (item.address === '0.0.0.0') {
                    item.name = `[IPv4] 0.0.0.0 - ${I18n.t('ra_Listen on all IPs')}`;
                }
                else if (item.address === '::') {
                    item.name = `[IPv6] :: - ${I18n.t('ra_Listen on all IPs')}`;
                }
            });
            this.setState({ ips });
        });
    }
    renderItem(error, disabled /* , defaultValue */) {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        const item = this.state.ips?.find(it => it.address === value);
        return React.createElement(FormControl, { className: this.props.classes.fullWidth, variant: "standard" },
            this.state.ips && this.props.schema.label ? React.createElement(InputLabel, null, this.getText(this.props.schema.label)) : null,
            !this.state.ips ?
                React.createElement(TextField, { fullWidth: true, variant: "standard", error: !!error, disabled: !!disabled, value: value, onChange: e => this.onChange(this.props.attr, e.target.value), label: this.getText(this.props.schema.label) }) :
                React.createElement(Select, { variant: "standard", error: !!error, disabled: !!disabled, value: value, renderValue: val => item?.name || val, onChange: e => this.onChange(this.props.attr, e.target.value) }, this.state.ips?.map((it, i) => React.createElement(MenuItem, { key: i, value: it.address }, it.name))),
            this.props.schema.help ? React.createElement(FormHelperText, null, this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)) : null);
    }
}
ConfigIP.propTypes = {
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
export default withStyles(styles)(ConfigIP);
//# sourceMappingURL=ConfigIP.js.map