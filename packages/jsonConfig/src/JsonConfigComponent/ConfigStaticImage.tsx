import React, { type JSX } from 'react';

import type { ConfigItemStaticImage } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigInstanceSelectProps extends ConfigGenericProps {
    schema: ConfigItemStaticImage;
}

class ConfigStaticImage extends ConfigGeneric<ConfigInstanceSelectProps, ConfigGenericState> {
    renderItem(/* error: string, disabled: boolean, defaultValue */): JSX.Element {
        let src = this.props.schema.src;
        if (
            src &&
            !src.startsWith('.') &&
            !src.startsWith('http') &&
            !src.startsWith(`adapter/${this.props.oContext.adapterName}/`) &&
            !src.startsWith(`./adapter/${this.props.oContext.adapterName}/`)
        ) {
            src = `adapter/${this.props.oContext.adapterName}/${src}`;
        }

        return (
            <img
                src={src}
                style={{ cursor: this.props.schema.href ? 'pointer' : undefined, width: '100%', height: '100%' }}
                onClick={
                    this.props.schema.href
                        ? () => this.props.schema.href && window.open(this.props.schema.href, '_blank')
                        : null
                }
                alt=""
            />
        );
    }
}

export default ConfigStaticImage;
