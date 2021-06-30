import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';

import I18n from '@iobroker/adapter-react/i18n';
import Icon from '@iobroker/adapter-react/Components/Icon';
import DialogError from '@iobroker/adapter-react/Dialogs/Error';
import DialogMessage from '@iobroker/adapter-react/Dialogs/Message';

import ConfigGeneric from './ConfigGeneric';
import IconWarning from '@material-ui/icons/Warning';
import IconError from '@material-ui/icons/Error';
import IconInfo from '@material-ui/icons/Info';
import ConfirmDialog from '@iobroker/adapter-react/Dialogs/Confirm';

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

class ConfigSendto extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();

        this.setState( {_error: '', _message: ''});
    }

    renderErrorDialog() {
        if (this.state._error) {
            return <DialogError text={this.state._error} classes={undefined} onClose={() => this.setState({_error: ''})} />;
        } else {
            return null;
        }
    }

    renderMessageDialog() {
        if (this.state._message) {
            return <DialogMessage text={this.state._message} classes={undefined} onClose={() => this.setState({_error: ''})} />;
        } else {
            return null;
        }
    }

    _onClick() {
        this.props.onCommandRunning(true);

        let data = this.props.schema.data;
        if (data === undefined && this.props.schema.jsonData) {
            data = this.getPattern(this.props.schema.jsonData, {}, this.props.data);
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error('Cannot parse json data: ' + data);
            }
        }
        if (data === undefined) {
            data = null;
        }

        this.props.socket.sendTo(
            this.props.adapterName + '.' + this.props.instance,
            this.props.schema.command || 'send',
            data
        )
            .then(response => {
                if (response?.error) {
                    if (this.props.schema.error && this.props.schema.error[response.error]) {
                        let error = this.getText(this.props.schema.error[response.error]);
                        if (response.args) {
                            response.args.forEach(arg => error = error.replace('%s', arg));
                        }
                        this.setState({_error: error});
                    } else {
                        this.setState({_error: response.error ? I18n.t(response.error) : I18n.t('Error')});
                    }
                } else {
                    if (response?.result && this.props.schema.result && this.props.schema.result[response.result]) {
                        let text = this.getText(this.props.schema.result[response.result]);
                        if (response.args) {
                            response.args.forEach(arg => text = text.replace('%s', arg));
                        }
                        window.alert(text);
                    } else {
                        if (response?.result) {
                            window.alert(typeof response.result === 'object' ? JSON.stringify(response.result) : response.result);
                        } else {
                            window.alert(I18n.t('Ok'));
                        }
                    }
                }
            })
            .catch(e => {
                if (this.props.schema.error && this.props.schema.error[e.toString()]) {
                    this.setState({_error: this.getText(this.props.schema.error[e.toString()])});
                } else {
                    this.setState({_error: I18n.t(e.toString()) || I18n.t('Error')});
                }
            })
            .then(() => this.props.onCommandRunning(false))
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
                this.setState({ confirmDialog: false}, () =>
                    isOk && this._onClick())
            }
        />;
    }

    renderItem(error, disabled, defaultValue) {
        return <div className={this.props.classes.fullWidth}>
            <Button
                variant={this.props.schema.variant || undefined}
                color={this.props.schema.color || undefined}
                className={this.props.classes.fullWidth}
                disabled={disabled}
                onClick={() => {
                    if (this.props.schema.confirm) {
                        this.setState({confirmDialog: true});
                    } else {
                        this._onClick();
                    }
                }}
            >
                {this.props.schema.icon ? <Icon src={this.props.schema.icon} className={this.props.classes.icon}/> : null}
                {this.getText(this.props.schema.label, this.props.schema.noTranslation)}
            </Button>
            {this.renderErrorDialog()}
            {this.renderMessageDialog()}
        </div>;
    }
}

ConfigSendto.propTypes = {
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

export default withStyles(styles)(ConfigSendto);