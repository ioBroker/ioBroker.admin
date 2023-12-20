import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import {
    InputLabel,
    FormHelperText,
    FormControl,
} from '@mui/material';

import UploadImage from './wrapper/Components/UploadImage';
import I18n from './wrapper/i18n';

import ConfigGeneric from './ConfigGeneric';

const styles = () => ({
    fullWidth: {
        width: '100%',
    },
    image: {
        width: 100,
    },
});

class ConfigImageUpload extends ConfigGeneric {
    constructor(props) {
        super(props);
        this.index = Date.now();
    }

    async componentDidMount() {
        super.componentDidMount();

        if (this.props.schema.base64) {
            const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
            this.setState({ value });
        } else {
            this.props.socket.fileExists(`${this.props.adapterName}.${this.props.instance}`, this.props.attr)
                .then(exist => exist && this.loadImage());
        }
    }

    _getUrl(update) {
        if (update) {
            this.index = Date.now();
        }
        let url = `files/${this.props.adapterName}.${this.props.instance}/${this.props.attr}?t=${this.index}`;
        if (window.location.port === '3000') {
            url = `${window.location.protocol}//${window.location.hostname}:8081/${url}`;
        }

        return url;
    }

    loadImage() {
        fetch(this._getUrl())
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onload = () => {
                    this.setState({ value: reader.result });
                };
                reader.readAsDataURL(blob);
            })
            .catch(e => console.error(e));
    }

    renderItem(error, disabled /* , defaultValue */) {
        // eslint-disable-next-line
        return <FormControl className={this.props.classes.fullWidth} variant="standard">
            {this.props.schema.label ? <InputLabel shrink>{this.getText(this.props.schema.label)}</InputLabel> : null}
            <UploadImage
                error={!!error}
                disabled={disabled}
                accept={this.props.schema.accept}
                crop={this.props.schema.crop}
                maxSize={this.props.schema.maxSize || 256 * 1024}
                icon={this.state.value || undefined}
                removeIconFunc={() => this.setState({ value: null }, () => {
                    if (this.props.schema.base64) {
                        this.onChange(this.props.attr, this.state.value);
                    } else {
                        // delete file to /instance/attr
                        this.props.socket.deleteFile(`${this.props.adapterName}.${this.props.instance}`, this.props.attr);
                    }
                })}
                onChange={base64 => this.setState({ value: base64 }, () => {
                    if (this.props.schema.base64) {
                        this.onChange(this.props.attr, this.state.value);
                    } else if (base64.startsWith('data')) {
                        base64 = base64.split(',')[1];
                    }
                    // upload file to /instance/attr
                    this.props.socket.writeFile64(`${this.props.adapterName}.${this.props.instance}`, this.props.attr, base64);
                })}
                t={I18n.t}
            />
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

ConfigImageUpload.propTypes = {
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

export default withStyles(styles)(ConfigImageUpload);
