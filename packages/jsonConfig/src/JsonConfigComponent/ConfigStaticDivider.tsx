import React, { type JSX } from 'react';

import { Box } from '@mui/material';

import { type IobTheme, Utils } from '@iobroker/adapter-react-v5';

import type { ConfigItemStaticDivider } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: {
    fullWidth: (theme: IobTheme) => React.CSSProperties;
    primary: (theme: IobTheme) => React.CSSProperties;
    secondary: (theme: IobTheme) => React.CSSProperties;
} = {
    fullWidth: (theme: IobTheme): React.CSSProperties => ({
        width: '100%',
        backgroundColor: theme.palette.mode === 'dark' ? '#FFF' : '#000',
        borderStyle: 'hidden',
    }),
    primary: (theme: IobTheme): React.CSSProperties => ({
        backgroundColor: theme.palette.primary.main,
    }),
    secondary: (theme: IobTheme): React.CSSProperties => ({
        backgroundColor: theme.palette.secondary.main,
    }),
};

interface ConfigInstanceSelectProps extends ConfigGenericProps {
    schema: ConfigItemStaticDivider;
}

class ConfigStaticDivider extends ConfigGeneric<ConfigInstanceSelectProps, ConfigGenericState> {
    renderItem(): JSX.Element {
        return (
            <Box
                component="hr"
                sx={Utils.getStyle(
                    this.props.oContext.theme,
                    styles.fullWidth,
                    this.props.schema.color === 'primary'
                        ? styles.primary
                        : this.props.schema.color === 'secondary'
                          ? styles.secondary
                          : {
                                backgroundColor:
                                    this.props.schema.color ||
                                    (this.props.oContext.themeType === 'dark' ? '#333' : '#ddd'),
                            },
                    {
                        height: this.props.schema.color ? this.props.schema.height || 2 : this.props.schema.height || 1,
                    },
                )}
            />
        );
    }
}

export default ConfigStaticDivider;
