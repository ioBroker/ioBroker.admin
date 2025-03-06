import React, { type JSX } from 'react';

import { InputLabel, MenuItem, FormControl, Select, FormHelperText } from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';
import type { ConfigItemCertCollection } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigCertCollectionProps extends ConfigGenericProps {
    schema: ConfigItemCertCollection;
}

interface ConfigCertCollectionState extends ConfigGenericState {
    collectionsOptions?: string[];
}

interface CertCollection {
    /** Source of the certificate */
    from: string;
    key: string;
    cert: string;
    chain: string[];
    domains: string[];
    staging?: boolean;
    tsExpires?: number;
}

class ConfigCertCollection extends ConfigGeneric<ConfigCertCollectionProps, ConfigCertCollectionState> {
    async componentDidMount(): Promise<void> {
        super.componentDidMount();

        let collectionsOptions: string[];
        const collectionsOptionsObj = await this.props.oContext.socket.getObject('system.certificates');
        if (collectionsOptionsObj?.native?.collections) {
            collectionsOptions = Object.keys(
                collectionsOptionsObj.native.collections as Record<string, CertCollection>,
            );
        } else {
            collectionsOptions = [];
        }
        this.setState({ collectionsOptions });
    }

    renderItem(error: unknown, disabled: boolean /* , defaultValue */): JSX.Element {
        if (!this.state.collectionsOptions) {
            return null;
        }
        const leCollection = (
            ConfigGeneric.getValue(this.props.data, this.props.schema.leCollectionName || 'leCollection') || 'false'
        ).toString();

        return (
            <FormControl
                style={{ width: '100%' }}
                variant="standard"
            >
                {this.props.schema.label ? (
                    <InputLabel shrink>{this.getText(this.props.schema.label)}</InputLabel>
                ) : null}
                <Select
                    variant="standard"
                    error={!!error}
                    displayEmpty
                    disabled={!!disabled}
                    value={leCollection}
                    onChange={e =>
                        this.onChange(
                            this.props.schema.leCollectionName || 'leCollection',
                            e.target.value === 'false' ? false : e.target.value === 'true' ? true : e.target.value,
                        )
                    }
                >
                    <MenuItem
                        key="_false"
                        value="false"
                        style={{ fontWeight: 'bold' }}
                    >
                        {I18n.t("ra_Do not use let's encrypt")}
                    </MenuItem>
                    <MenuItem
                        key="_true"
                        value="true"
                        style={{ fontWeight: 'bold' }}
                    >
                        {I18n.t("ra_Use all available let's encrypt certificates")}
                    </MenuItem>
                    {this.state.collectionsOptions?.map(item => (
                        <MenuItem
                            key={item}
                            value={item}
                        >
                            {item}
                        </MenuItem>
                    ))}
                </Select>
                {this.props.schema.help ? (
                    <FormHelperText>
                        {this.renderHelp(
                            this.props.schema.help,
                            this.props.schema.helpLink,
                            this.props.schema.noTranslation,
                        )}
                    </FormHelperText>
                ) : null}
            </FormControl>
        );
    }
}

export default ConfigCertCollection;
