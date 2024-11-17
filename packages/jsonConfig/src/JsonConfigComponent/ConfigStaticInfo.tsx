import React, { type JSX } from 'react';

import { Box } from '@mui/material';

import { Icon, Utils } from '@iobroker/adapter-react-v5';

import type { ConfigItemStaticInfo } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    label: {
        fontWeight: 'bold',
    },
    valueImage: {
        maxHeight: '100%',
    },
    valueAndUnit: {
        display: 'flex',
        gap: 4,
        alignItems: 'center',
    },
    value: {},
    unit: {
        fontSize: 'smaller',
        opacity: 0.7,
    },
};

interface ConfigStaticInfoProps extends ConfigGenericProps {
    schema: ConfigItemStaticInfo;
}

class ConfigStaticInfo extends ConfigGeneric<ConfigStaticInfoProps, ConfigGenericState> {
    renderItem(_error: string): JSX.Element {
        let label: string | JSX.Element | JSX.Element[] = this.getText(
            this.props.schema.text || this.props.schema.label,
            this.props.schema.noTranslation,
        );
        if (this.props.schema.addColon && typeof label === 'string' && !label.trim().endsWith(':')) {
            label = `${label.trim()}:`;
        }

        if (
            label &&
            (label.includes('<a ') || label.includes('<br') || label.includes('<b>') || label.includes('<i>'))
        ) {
            label = Utils.renderTextWithA(label);
        }
        const divStyle: React.CSSProperties = {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
        };

        if (this.props.schema.narrow) {
            divStyle.gap = 8;
        } else {
            divStyle.justifyContent = 'space-between';
        }

        let value: React.JSX.Element;
        let valueTxt: string;
        if (this.props.schema.data && typeof this.props.schema.data === 'object' && this.props.schema.data.en) {
            valueTxt = this.getText(this.props.schema.data);
        } else if (
            typeof this.props.schema.data === 'object' ||
            this.props.schema.data === undefined ||
            this.props.schema.data === null
        ) {
            valueTxt = JSON.stringify(this.props.schema.data);
        } else if (typeof this.props.schema.data === 'number') {
            valueTxt = this.props.schema.data.toString();
        } else {
            valueTxt = this.props.schema.data.toString();
        }
        if (valueTxt.startsWith('data:image/')) {
            value = (
                <div style={{ ...styles.value, ...styles.valueImage, ...(this.props.schema.styleValue || undefined) }}>
                    <Icon src={valueTxt} />
                </div>
            );
        } else {
            value = <div style={{ ...styles.value, ...(this.props.schema.styleValue || undefined) }}>{valueTxt}</div>;
        }
        if (this.props.schema.unit) {
            value = (
                <div style={styles.valueAndUnit}>
                    {value}
                    <div style={{ ...styles.unit, ...(this.props.schema.styleUnit || undefined) }}>
                        {this.getText(this.props.schema.unit)}
                    </div>
                </div>
            );
        }

        let labelIcon: React.JSX.Element | undefined;
        if (this.props.schema.labelIcon) {
            labelIcon = (
                <Icon
                    src={this.props.schema.labelIcon}
                    style={{ marginRight: 4 }}
                />
            );
        }

        return (
            <Box
                component="div"
                style={divStyle}
            >
                <div style={{ ...styles.label, ...(this.props.schema.styleLabel || undefined) }}>
                    {labelIcon}
                    {label}
                </div>
                {value}
            </Box>
        );
    }
}

export default ConfigStaticInfo;
