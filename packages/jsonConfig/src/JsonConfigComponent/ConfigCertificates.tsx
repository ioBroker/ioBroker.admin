import React, { type JSX } from 'react';

import { InputLabel, MenuItem, FormControl, Select } from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';
import type { ConfigItemCertificates } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    fullWidth: {
        width: '100%',
    },
    leWidth: {
        width: 620,
        marginBottom: 10,
    },
    certWidth: {
        width: 200,
        marginRight: 10,
    },
};

interface ConfigCertificatesProps extends ConfigGenericProps {
    schema: ConfigItemCertificates;
}

interface ConfigCertificatesState extends ConfigGenericState {
    certsPublicOptions?: { label: string; value: string }[];
    certsChainOptions?: { label: string; value: string }[];
    certsPrivateOptions?: { label: string; value: string }[];
    collectionsOptions?: string[];
}

class ConfigCertificates extends ConfigGeneric<ConfigCertificatesProps, ConfigCertificatesState> {
    async componentDidMount(): Promise<void> {
        super.componentDidMount();
        // Important: getCertificates is only available in AdminConnection
        const certificates = await this.props.oContext.socket.getCertificates();
        const certsPublicOptions: { label: string; value: string }[] = [];
        const certsPrivateOptions: { label: string; value: string }[] = [];
        const certsChainOptions: { label: string; value: string }[] = [];

        let collectionsOptions: string[] | null = [];
        const collectionsOptionsObj = await this.props.oContext.socket.getObject('system.certificates');
        if (collectionsOptionsObj?.native?.collections) {
            collectionsOptions = Object.keys(collectionsOptionsObj.native.collections);
        } else {
            collectionsOptions = null;
        }

        certificates.forEach(el => {
            if (el.type === 'public') {
                certsPublicOptions.push({ label: el.name, value: el.name });
            } else if (el.type === 'private') {
                certsPrivateOptions.push({ label: el.name, value: el.name });
            } else if (el.type === 'chained') {
                certsChainOptions.push({ label: el.name, value: el.name });
            } else {
                certsPublicOptions.push({ label: el.name, value: el.name });
                certsPrivateOptions.push({ label: el.name, value: el.name });
                certsChainOptions.push({ label: el.name, value: el.name });
            }
        });

        certsPublicOptions.unshift({ label: I18n.t(ConfigGeneric.NONE_LABEL), value: ConfigGeneric.NONE_VALUE });
        certsPrivateOptions.unshift({ label: I18n.t(ConfigGeneric.NONE_LABEL), value: ConfigGeneric.NONE_VALUE });
        certsChainOptions.unshift({ label: I18n.t(ConfigGeneric.NONE_LABEL), value: ConfigGeneric.NONE_VALUE });

        this.setState({
            certsPublicOptions,
            certsChainOptions,
            certsPrivateOptions,
            collectionsOptions,
        });
    }

    renderItem(error: unknown, disabled: boolean /* , defaultValue */): JSX.Element | null {
        if (!this.state.certsPublicOptions || !this.state.certsPrivateOptions || !this.state.certsChainOptions) {
            return null;
        }
        const leCollection = (
            ConfigGeneric.getValue(this.props.data, this.props.schema.leCollectionName || 'leCollection') || 'false'
        ).toString();
        const certPublic = ConfigGeneric.getValue(this.props.data, this.props.schema.certPublicName || 'certPublic');
        const certPrivate = ConfigGeneric.getValue(this.props.data, this.props.schema.certPrivateName || 'certPrivate');
        const certChained = ConfigGeneric.getValue(this.props.data, this.props.schema.certChainedName || 'certChained');

        const itemCertPublic = this.state.certsPublicOptions?.find(item => item.value === certPublic);
        const itemCertPrivate = this.state.certsPrivateOptions?.find(item => item.value === certPrivate);
        const itemCertChained = this.state.certsChainOptions?.find(item => item.value === certChained);

        return (
            <div style={styles.fullWidth}>
                {this.state.collectionsOptions ? (
                    <FormControl
                        style={styles.leWidth}
                        variant="standard"
                    >
                        <InputLabel shrink>Let&apos;s encrypt</InputLabel>
                        <Select
                            variant="standard"
                            error={!!error}
                            displayEmpty
                            disabled={!!disabled}
                            value={leCollection}
                            onChange={e =>
                                this.onChange(
                                    this.props.schema.leCollectionName || 'leCollection',
                                    e.target.value === 'false'
                                        ? false
                                        : e.target.value === 'true'
                                          ? true
                                          : e.target.value,
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
                    </FormControl>
                ) : null}
                {this.state.collectionsOptions ? <br /> : null}
                {this.state.collectionsOptions && leCollection !== 'false' ? (
                    <div>{I18n.t('ra_Fallback custom certificates')}</div>
                ) : null}
                <FormControl
                    style={styles.certWidth}
                    variant="standard"
                >
                    <InputLabel shrink>{I18n.t('ra_Public certificate')}</InputLabel>
                    <Select
                        variant="standard"
                        error={!!error}
                        displayEmpty
                        disabled={!!disabled}
                        value={certPublic || ''}
                        renderValue={() => this.getText(itemCertPublic?.label, true)}
                        onChange={e => this.onChange(this.props.schema.certPublicName || 'certPublic', e.target.value)}
                    >
                        {this.state.certsPublicOptions?.map((item, i) => (
                            <MenuItem
                                key={`${item.value}_${i}`}
                                value={item.value}
                                style={item.value === ConfigGeneric.NONE_VALUE ? { opacity: 0.5 } : {}}
                            >
                                {this.getText(item.label, true)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl
                    style={styles.certWidth}
                    variant="standard"
                >
                    <InputLabel shrink>{I18n.t('ra_Private certificate')}</InputLabel>
                    <Select
                        variant="standard"
                        error={!!error}
                        displayEmpty
                        disabled={!!disabled}
                        value={certPrivate || ''}
                        renderValue={() => this.getText(itemCertPrivate?.label, true)}
                        onChange={e =>
                            this.onChange(this.props.schema.certPrivateName || 'certPrivate', e.target.value)
                        }
                    >
                        {this.state.certsPrivateOptions?.map((item, i) => (
                            <MenuItem
                                key={`${item.value}_${i}`}
                                value={item.value}
                                style={item.value === ConfigGeneric.NONE_VALUE ? { opacity: 0.5 } : {}}
                            >
                                {this.getText(item.label, true)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl
                    style={styles.certWidth}
                    variant="standard"
                >
                    <InputLabel shrink>{I18n.t('ra_Chained certificate')}</InputLabel>
                    <Select
                        variant="standard"
                        error={!!error}
                        displayEmpty
                        disabled={!!disabled}
                        value={certChained || ''}
                        renderValue={() => this.getText(itemCertChained?.label, true)}
                        onChange={e =>
                            this.onChange(this.props.schema.certChainedName || 'certChained', e.target.value)
                        }
                    >
                        {this.state.certsChainOptions?.map((item, i) => (
                            <MenuItem
                                key={`${item.value}_${i}`}
                                value={item.value}
                                style={item.value === ConfigGeneric.NONE_VALUE ? { opacity: 0.5 } : {}}
                            >
                                {this.getText(item.label, true)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>
        );
    }
}

export default ConfigCertificates;
