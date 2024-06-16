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

interface ConfigInstanceSelectProps extends ConfigGenericProps {
    schema: ConfigItemStaticText;
}

class ConfigStaticText extends ConfigGeneric<ConfigInstanceSelectProps, ConfigGenericState> {
    renderItem(error: string, disabled: boolean /* , defaultValue */) {
        if (this.props.schema.button) {
            const icon = this.getIcon();
            return <Button
                variant={this.props.schema.variant || undefined}
                color={this.props.schema.color || 'grey'}
                style={styles.fullWidth}
                disabled={disabled}
                startIcon={icon}
                onClick={this.props.schema.href ? () => {
                    // calculate one more time just before call
                    const href = this.props.schema.href ? this.getText(this.props.schema.href, true) : null;
                    href && window.open(href, '_blank');
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
            sx={this.props.schema.href ? styles.link : undefined}
            onClick={this.props.schema.href ? () => {
                // calculate one more time just before call
                const href = this.props.schema.href ? this.getText(this.props.schema.href, true) : null;
                href && window.open(href, '_blank');
            } : null}
        >
            {text}
        </Box>;
    }
}

export default ConfigStaticText;
