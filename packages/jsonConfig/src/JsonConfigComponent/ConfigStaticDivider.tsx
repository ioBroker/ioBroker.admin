import React from 'react';

import { Box } from '@mui/material';

import { type IobTheme } from '@iobroker/adapter-react-v5';

import type { ConfigItemStaticDivider } from '#JC/types';
import Utils from '#JC/Utils';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, any> = {
    fullWidth: (theme: IobTheme) => ({
        width: '100%',
        backgroundColor: theme.palette.mode === 'dark' ? '#FFF' : '#000',
        borderStyle: 'hidden',
    }),
    primary: (theme: IobTheme) => ({
        backgroundColor: theme.palette.primary.main,
    }),
    secondary: (theme: IobTheme) => ({
        backgroundColor: theme.palette.secondary.main,
    }),
};

interface ConfigInstanceSelectProps extends ConfigGenericProps {
    schema: ConfigItemStaticDivider;
}

class ConfigStaticDivider extends ConfigGeneric<ConfigInstanceSelectProps, ConfigGenericState> {
    renderItem(/* error: string, disabled: boolean , defaultValue */) {
        return <Box
            component="hr"
            sx={Utils.getStyle(
                this.props.theme,
                styles.fullWidth,
                this.props.schema.color === 'primary' ? styles.primary : (this.props.schema.color === 'secondary' && styles.secondary),
                {
                    height: this.props.schema.color ? this.props.schema.height || 2 : this.props.schema.height || 1,
                    backgroundColor: this.props.schema.color !== 'primary' && this.props.schema.color !== 'secondary' && this.props.schema.color ? this.props.schema.color : undefined,
                },
            )}
        />;
    }
}

export default ConfigStaticDivider;
