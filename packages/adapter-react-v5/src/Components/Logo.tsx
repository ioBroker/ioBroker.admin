import React from 'react';
import { Fab } from '@mui/material';

import {
    Help as IconHelp,
    VerticalAlignTop as IconUpload,
    VerticalAlignBottom as IconDownload,
} from '@mui/icons-material';

import { I18n } from '../i18n';
import { Icon } from './Icon';

interface LogoProps {
    /* Adapter common configuration from io-package.json */
    common: any;
    /* Adapter native data from io-package.json */
    native: any;
    /* Adapter instance number. */
    instance: number;
    /* on Load handler */
    onLoad?: (contents: any) => void;
    /* on Error handler */
    onError?: (error: string) => void;
    className?: string;
    style?: Record<string, any>;
}

export class Logo extends React.Component<LogoProps> {
    static generateFile(fileName: string, obj: any): void {
        const el = window.document.createElement('a');
        el.setAttribute(
            'href',
            `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(obj, null, 2))}`,
        );
        el.setAttribute('download', fileName);

        el.style.display = 'none';
        window.document.body.appendChild(el);

        el.click();

        window.document.body.removeChild(el);
    }

    handleFileSelect = (evt: Event): void => {
        const target = evt.target as HTMLInputElement;
        const files = target?.files;
        if (!files || !files.length) {
            console.error('No files found. Please report to developers');
            return;
        }
        const f = files[0];

        if (f) {
            const reader = new window.FileReader();
            reader.onload = () => {
                const contents: string = reader.result?.toString() || '';
                try {
                    const json = JSON.parse(contents);
                    if (json.native && json.common) {
                        if (json.common.name !== this.props.common.name) {
                            this.props.onError && this.props.onError(I18n.t('ra_otherConfig', json.common.name));
                        } else {
                            this.props.onLoad && this.props.onLoad(json.native);
                        }
                    } else {
                        this.props.onError && this.props.onError(I18n.t('ra_invalidConfig'));
                    }
                } catch (err: any) {
                    this.props.onError && this.props.onError(err?.toString());
                }
            };
            reader.readAsText(f);
        } else {
            alert('Failed to open JSON File');
        }
    };

    download(): void {
        const result = {
            _id: `system.adapter.${this.props.common.name}.${this.props.instance}`,
            common: JSON.parse(JSON.stringify(this.props.common)),
            native: this.props.native,
        };
        // remove unimportant information
        if (result.common.news) {
            delete result.common.news;
        }
        if (result.common.titleLang) {
            delete result.common.titleLang;
        }
        if (result.common.desc) {
            delete result.common.desc;
        }

        // window.open('data:application/iobroker; content-disposition=attachment; filename=' + result._id + '.json,' + JSON.stringify(result, null, 2));
        Logo.generateFile(`${result._id}.json`, result);
    }

    upload(): void {
        const input = window.document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('id', 'files');
        input.setAttribute('opacity', '0');
        input.addEventListener('change', this.handleFileSelect, false);
        input.click();
    }

    render(): React.JSX.Element {
        return (
            <div
                className={this.props.className}
                style={this.props.style}
            >
                {this.props.common.icon ? (
                    <Icon
                        src={this.props.common.icon}
                        style={{
                            padding: 8,
                            width: 64,
                        }}
                        alt="logo"
                    />
                ) : null}
                {this.props.common.readme ? (
                    <Fab
                        size="small"
                        color="primary"
                        aria-label="Help"
                        style={{
                            marginRight: 5,
                            marginTop: 5,
                            float: 'right',
                        }}
                        onClick={() => {
                            const win = window.open(this.props.common.readme, '_blank');
                            win?.focus();
                        }}
                    >
                        <IconHelp />
                    </Fab>
                ) : null}
                <Fab
                    size="small"
                    color="primary"
                    aria-label="Load config"
                    style={{
                        marginRight: 5,
                        marginTop: 5,
                        float: 'right',
                    }}
                    title={I18n.t('ra_Load configuration from file')}
                    onClick={() => this.upload()}
                >
                    <IconUpload />
                </Fab>
                <Fab
                    size="small"
                    color="primary"
                    aria-label="Save config"
                    style={{
                        marginRight: 5,
                        marginTop: 5,
                        float: 'right',
                    }}
                    title={I18n.t('ra_Save configuration to file')}
                    onClick={() => this.download()}
                >
                    <IconDownload />
                </Fab>
            </div>
        );
    }
}
