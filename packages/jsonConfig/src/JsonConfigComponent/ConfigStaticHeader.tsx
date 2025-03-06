import React, { type JSX } from 'react';

import { Box } from '@mui/material';

import type { IobTheme } from '@iobroker/adapter-react-v5';

import type { ConfigItemStaticHeader } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, any> = {
    header: (theme: IobTheme): React.CSSProperties => ({
        width: '100%',
        background: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        padding: '4px !important',
        borderRadius: '3px',
        marginBlockEnd: 0,
        marginBlockStart: 0,
    }),
};

interface ConfigInstanceSelectProps extends ConfigGenericProps {
    schema: ConfigItemStaticHeader;
}

class ConfigStaticHeader extends ConfigGeneric<ConfigInstanceSelectProps, ConfigGenericState> {
    renderItem(/* error: string, disabled: boolean, defaultValue */): JSX.Element {
        let component: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' = 'h5';
        switch ((this.props.schema.size || 5).toString()) {
            case '1':
                component = 'h1';
                break;

            case '2':
                component = 'h2';
                break;

            case '3':
                component = 'h3';
                break;

            case '4':
                component = 'h4';
                break;

            case '5':
            default:
                component = 'h5';
                break;
        }
        return (
            <Box
                component={component}
                sx={styles.header}
            >
                {this.getText(this.props.schema.label || this.props.schema.text, this.props.schema.noTranslation)}
            </Box>
        );
    }
}

export default ConfigStaticHeader;
