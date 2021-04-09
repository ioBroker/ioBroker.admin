import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';

import I18n from '@iobroker/adapter-react/i18n';
import Icon from '@iobroker/adapter-react/Components/Icon';
import DialogError from '@iobroker/adapter-react/Dialogs/Error';
import DialogMessage from '@iobroker/adapter-react/Dialogs/Message';

import ConfigGeneric from './ConfigGeneric';

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
            .then(result => {
                if (result?.error) {
                    this.setState({_error: result.error ? I18n.t(result.error) : I18n.t('Error')});
                } else {
                    window.alert(result?.result || I18n.t('Ok'));
                }
            })
            .catch(e => {
                this.setState({_error: I18n.t(e) || I18n.t('Error')});
            })
            .then(() => this.props.onCommandRunning(false))
    }

    renderItem(error, disabled, defaultValue) {
        return <div className={this.props.classes.fullWidth}>
            <Button
                variant={this.props.schema.variant || undefined}
                color={this.props.schema.color || undefined}
                className={this.props.classes.fullWidth}
                disabled={disabled || this.props.commandRunning}
                onClick={() => {
                    this._onClick()
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