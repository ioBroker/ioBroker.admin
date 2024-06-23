import React from 'react';

import {
    InputLabel,
    FormHelperText,
    FormControl,
} from '@mui/material';

import { UploadImage } from '@iobroker/adapter-react-v5';

import type { ConfigItemImageUpload } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigImageUploadProps extends ConfigGenericProps {
    schema: ConfigItemImageUpload;
}

interface ConfigImageUploadState extends ConfigGenericState {
    image?: string;
    context?: string;
}

class ConfigImageUpload extends ConfigGeneric<ConfigImageUploadProps, ConfigImageUploadState> {
    private index: number;

    constructor(props: ConfigImageUploadProps) {
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

    _getUrl(update?: boolean) {
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

    renderItem(error: string, disabled: boolean /* , defaultValue */) {
        return <FormControl fullWidth variant="standard">
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
            />
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

export default ConfigImageUpload;
