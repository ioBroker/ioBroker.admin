import React from "react";
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';

import I18n from '@iobroker/adapter-react/i18n';
import Icon from '@iobroker/adapter-react/Components/Icon';

import ConfigGeneric from './ConfigGeneric';
import IconWarning from "@material-ui/icons/Warning";
import IconError from "@material-ui/icons/Error";
import IconInfo from "@material-ui/icons/Info";
import ConfirmDialog from "@iobroker/adapter-react/Dialogs/Confirm";

const styles = theme => ({
    fullWidth: {
        width: '100%'
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: 4
    }
});

class ConfigSetState extends ConfigGeneric {
    async _onClick() {
        let val = this.props.schema.val;
        if (typeof val === 'string' && val.includes('${')) {
            val = this.getPattern(val);
            const obj = await this.props.socket.getObject(this.props.schema.id);
            if (obj?.common?.type === 'number') {
                val = parseFloat(val);
            } else if (obj?.common?.type === 'boolean') {
                val = val === 'true' || val === true || val === '1' || val === 1;
            }
        }

        try {
            await this.props.socket.setState(this.props.schema.id, {val, ack: !!this.props.schema.ack});
            this.props.schema.okText && window.alert(this.getText(this.props.schema.okText));
        } catch (e) {
            if (this.props.schema.error && this.props.schema.error[e.toString()]) {
                window.alert(this.getText(this.props.schema.error[e.toString()]));
            } else {
                window.alert(I18n.t(e.toString()) || I18n.t('Error'));
            }
        }
    }

    renderConfirmDialog() {
        if (!this.state.confirmDialog) {
            return null;
        }
        const confirm = this.state.confirmData || this.props.schema.confirm;
        let icon = null;
        if (confirm.type === 'warning') {
            icon = <IconWarning />;
        } else if (confirm.type === 'error') {
            icon = <IconError />;
        } else if (confirm.type === 'info') {
            icon = <IconInfo />;
        }

        return <ConfirmDialog
            title={ this.getText(confirm.title) || I18n.t('Please confirm') }
            text={ this.getText(confirm.text) }
            ok={ this.getText(confirm.ok) || I18n.t('Ok') }
            cancel={ this.getText(confirm.cancel) || I18n.t('Cancel') }
            icon={icon}
            onClose={isOk =>
                this.setState({ confirmDialog: false}, async () =>
                    isOk && (await this._onClick()))
            }
        />;
    }

    renderItem(error, disabled, defaultValue) {
        return <Button
            variant={this.props.schema.variant || undefined}
            color={this.props.schema.color || undefined}
            className={this.props.classes.fullWidth}
            disabled={disabled}
            onClick={async () => {
                if (this.props.schema.confirm) {
                    this.setState({confirmDialog: true});
                } else {
                    await this._onClick();
                }
            }}
        >
            {this.props.schema.icon ? <Icon src={this.props.schema.icon} className={this.props.classes.icon}/> : null}
            {this.getText(this.props.schema.label, this.props.schema.noTranslation)}
        </Button>;
    }
}

ConfigSetState.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
    adapterName: PropTypes.string,
    instance: PropTypes.number,
    commandRunning: PropTypes.bool,
    onCommandRunning: PropTypes.func,
};

export default withStyles(styles)(ConfigSetState);