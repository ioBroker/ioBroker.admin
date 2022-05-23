import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';

import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import I18n from '@iobroker/adapter-react/i18n';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%',
        display: 'inline-block'
    },
    halfWidth1: {
        width: 'calc(50% - ' + theme.spacing(1) / 2 + 'px)',
        display: 'inline-block',
        marginRight: theme.spacing(1),
    },
    halfWidth2: {
        width: 'calc(50% - ' + theme.spacing(1) / 2 + 'px)',
        display: 'inline-block'
    }
});

const PASSWORD_PLACEHOLDER = '____ppp____';

class ConfigPassword extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({
            _repeat: value ? PASSWORD_PLACEHOLDER : '',
            _visible: false,
            value: value ? PASSWORD_PLACEHOLDER : '',
            _notEqual: false
        });
    }

    onChangePassword(password, repeatPassword) {
        if (password === undefined) {
            password = this.state.value;
        }
        if (repeatPassword === undefined) {
            repeatPassword = this.state._repeat;
        }
        const _notEqual = this.props.schema.repeat && repeatPassword !== password;
        this.setState({value: password, _repeat: repeatPassword, _notEqual}, () => {
            if (_notEqual) {
                this.onError(this.props.attr, I18n.t('Passwords are not equal!'));
            } else {
                this.onError(this.props.attr); // clear error
                this.onChange(this.props.attr, password);
            }
        });
    }

    renderItem(error, disabled, defaultValue) {
        if (this.state._notEqual === undefined) {
            return null;
        }

        const password = <TextField
            fullWidth
            type={this.state._visible && this.state.value !== PASSWORD_PLACEHOLDER ? 'text' : 'password'}
            value={this.state.value}
            error={!!error || this.state._notEqual}
            disabled={!!disabled}
            onChange={e => this.onChangePassword(e.target.value)}
            label={this.getText(this.props.schema.label)}
            inputProps={{
                autoComplete: 'new-password',
                form: {autoComplete: 'off'},
                maxLength: this.props.schema.maxLength || this.props.schema.max || undefined
            }}
            helperText={this.state._notEqual ? I18n.t('Passwords are not equal!') : this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
            InputProps={{endAdornment: this.state.value && this.state.value !== PASSWORD_PLACEHOLDER ? <InputAdornment position='end'>
                    <IconButton
                        tabIndex={-1}
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            this.setState({_visible: !this.state._visible});
                        }}
                        edge='end'
                    >
                        {this.state._visible ? <VisibilityOff/> : <Visibility/>}
                    </IconButton>
                </InputAdornment> : undefined
            }}
        />;

        if (this.props.schema.repeat) {
            const passwordRepeat = <TextField
                fullWidth
                type={this.state._visible && this.state._repeat !== PASSWORD_PLACEHOLDER ? 'text' : 'password'}
                value={this.state._repeat}
                error={!!error || this.state._notEqual}
                disabled={!!disabled}
                onChange={e => this.onChangePassword(undefined, e.target.value)}
                label={`${this.getText(this.props.schema.label)} (${I18n.t('repeat')})`}
                inputProps={{
                    autoComplete: 'new-password',
                    form: {autoComplete: 'off'},
                    maxLength: this.props.schema.maxLength || this.props.schema.max || undefined
                }}
                helperText={this.state._notEqual ? I18n.t('Passwords are not equal!') : this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
                InputProps={{endAdornment: this.state._repeat && this.state._repeat !== PASSWORD_PLACEHOLDER ? <InputAdornment position='end'>
                        <IconButton
                            tabIndex={-1}
                            onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                this.setState({_visible: !this.state._visible});
                            }}
                            edge='end'
                        >
                            {this.state._visible ? <VisibilityOff/> : <Visibility/>}
                        </IconButton>
                    </InputAdornment> : undefined
                }}
            />;

            return <div className={this.props.classes.fullWidth}>
                <div className={this.props.classes.halfWidth1}>{password}</div>
                <div className={this.props.classes.halfWidth2}>{passwordRepeat}</div>
            </div>;
        } else {
            return password;
        }
    }
}

ConfigPassword.propTypes = {
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

export default withStyles(styles)(ConfigPassword);