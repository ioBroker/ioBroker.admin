import React from 'react';

import { Box } from '@mui/material';

import type { IobTheme } from '@iobroker/adapter-react-v5';

import type { ConfigItemStaticHeader } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, any> = {
    header: (theme: IobTheme) => ({
        width: '100%',
        background: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        padding: '4px !important',
        borderRadius: 3,
        marginBlockEnd: 0,
        marginBlockStart: 0,
    }),
};

interface ConfigInstanceSelectProps extends ConfigGenericProps {
    schema: ConfigItemStaticHeader;
}

class ConfigStaticHeader extends ConfigGeneric<ConfigInstanceSelectProps, ConfigGenericState> {
    renderItem(/* error: string, disabled: boolean, defaultValue */) {
        switch ((this.props.schema.size || 5).toString()) {
            case '1':
                return <Box component="h1" sx={styles.header}>
                    {this.getText(this.props.schema.text, this.props.schema.noTranslation)}
                </Box>;

            case '2':
                return <Box component="h2" sx={styles.header}>
                    {this.getText(this.props.schema.text, this.props.schema.noTranslation)}
                </Box>;

            case '3':
                return <Box component="h3" sx={styles.header}>
                    {this.getText(this.props.schema.text, this.props.schema.noTranslation)}
                </Box>;

            case '4':
                return <Box component="h4" sx={styles.header}>
                    {this.getText(this.props.schema.text, this.props.schema.noTranslation)}
                </Box>;

            case '5':
            default:
                return <Box component="h5" sx={styles.header}>
                    {this.getText(this.props.schema.text, this.props.schema.noTranslation)}
                </Box>;
        }
    }
}

export default ConfigStaticHeader;
