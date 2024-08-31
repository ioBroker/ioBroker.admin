import React from 'react';

import { Box, Button } from '@mui/material';

import { type IobTheme, Utils } from '@iobroker/adapter-react-v5';

import type { ConfigItemStaticText } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, any> = {
    fullWidth: {
        height: '100%',
        width: '100%',
    },
    link: (theme: IobTheme) => ({
        textDecoration: 'underline',
        color: theme.palette.mode === 'dark' ? '#4dabf5' : '#254e72',
        cursor: 'pointer',
    }),
};

function onLink(
    href: string,
    target: '_blank' | '_self' | string,
    instanceId: string,
) {
    let _target;
    let url = '';
    if (!href) {
        url = `#tab-instances/config/${instanceId}`;
        _target = target || '_self';
    } else if (href.toString().startsWith('#')) {
        _target = target || '_self';
        url = href;
    } else if (href.toString().startsWith('/')) {
        _target = target || '_self';
        url = href;
    } else if (href.startsWith('http://') || href.startsWith('https://')) {
        _target = target || '_blank';
        url = href;
    } else {
        url = `#tab-instances/config/${instanceId}/${href}`;
        _target = target || '_self';
    }
    if (_target === '_self') {
        // close dialog
        setTimeout(
            (_url: string) => {
                if (_url.startsWith('#')) {
                    window.location.hash = _url;
                } else if (_url.startsWith('/')) {
                    url = `${window.location.protocol}:${window.location.host}${url}`;
                } else if (_url.startsWith('http://') || _url.startsWith('https://')) {
                    window.location.href = _url;
                }
            },
            100,
            url,
        );
    } else {
        if (url.startsWith('#')) {
            url = `${window.location.protocol}:${window.location.host}${window.location.pathname}${url}`;
        } else if (url.startsWith('/')) {
            url = `${window.location.protocol}:${window.location.host}${url}`;
        }

        window.open(url, _target);
    }
}

interface ConfigInstanceSelectProps extends ConfigGenericProps {
    schema: ConfigItemStaticText;
}

class ConfigStaticText extends ConfigGeneric<ConfigInstanceSelectProps, ConfigGenericState> {
    renderItem(_error: string, disabled: boolean /* , defaultValue */) {
        if (this.props.schema.button) {
            const icon = this.getIcon();
            return <Button
                variant={this.props.schema.variant || undefined}
                color={this.props.schema.color || 'grey'}
                style={{ ...styles.fullWidth, ...(this.props.schema.controlStyle || undefined) }}
                disabled={disabled}
                startIcon={icon}
                onClick={this.props.schema.href ? () => {
                    // calculate one more time just before call
                    const href = this.props.schema.href ? this.getText(this.props.schema.href, true) : null;
                    if (href) {
                        if (this.props.onBackEndCommand) {
                            this.props.onBackEndCommand({
                                command: 'link',
                                url: href,
                                target: this.props.schema.target,
                                close: this.props.schema.close,
                            });
                        } else {
                            onLink(href, this.props.schema.target, `${this.props.adapterName}.${this.props.instance}`);
                        }
                    }
                } : null}
            >
                {this.getText(this.props.schema.text || this.props.schema.label, this.props.schema.noTranslation)}
            </Button>;
        }
        let text: string | React.JSX.Element | React.JSX.Element[] = this.getText(this.props.schema.text || this.props.schema.label, this.props.schema.noTranslation);
        if (text && (text.includes('<a ') || text.includes('<br') || text.includes('<b>') || text.includes('<i>'))) {
            text = Utils.renderTextWithA(text);
        }

        return <Box
            component="span"
            style={{ ...(this.props.schema.controlStyle || undefined) }}
            sx={this.props.schema.href ? styles.link : undefined}
            onClick={this.props.schema.href ? () => {
                // calculate one more time just before call
                const href = this.props.schema.href ? this.getText(this.props.schema.href, true) : null;
                if (href) {
                    if (this.props.onBackEndCommand) {
                        this.props.onBackEndCommand({
                            command: 'link',
                            url: href,
                            target: this.props.schema.target || '_blank',
                            close: this.props.schema.close,
                        });
                    } else {
                        onLink(href, this.props.schema.target || '_blank', `${this.props.adapterName}.${this.props.instance}`);
                    }
                }
            } : null}
        >
            {text}
        </Box>;
    }
}

export default ConfigStaticText;
