import React, { type JSX } from 'react';

import { Box, Checkbox } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { I18n, Icon, type IobTheme, Utils } from '@iobroker/adapter-react-v5';

import type { ConfigItemStaticInfo } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

function valueBlinkOnce(theme: IobTheme, force: boolean, color?: string | boolean): any {
    if (typeof color === 'string') {
        return {
            '@keyframes newValueAnimationOnceColor': {
                '0%': {
                    color: force ? `${color} !important` : color,
                },
                '100%': {
                    color:
                        theme.palette.mode === 'dark'
                            ? force
                                ? '#fff !important'
                                : '#fff'
                            : force
                              ? '#000 !important'
                              : '#000',
                },
            },
            animation: 'newValueAnimationOnceColor 2s ease-in-out',
        };
    }
    return {
        '@keyframes newValueAnimationOnce': {
            '0%': {
                color: force ? `#00f900 !important` : '#00f900',
            },
            '80%': {
                color:
                    theme.palette.mode === 'dark'
                        ? force
                            ? `#518851 !important`
                            : '#518851'
                        : force
                          ? `#008000 !important`
                          : '#008000',
            },
            '100%': {
                color:
                    theme.palette.mode === 'dark'
                        ? force
                            ? '#fff !important'
                            : '#fff'
                        : force
                          ? '#000 !important'
                          : '#000',
            },
        },
        animation: 'newValueAnimationOnce 2s ease-in-out',
    };
}

function valueBlink(theme: IobTheme, color?: string | boolean): any {
    if (typeof color === 'string') {
        return {
            '@keyframes blinkAnimationColor': {
                '0%': {
                    color,
                },
                '100%': {
                    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                },
            },
            animation: 'blinkAnimationColor 2s ease-in-out infinite',
        };
    }
    return {
        '@keyframes blinkAnimation': {
            '0%': {
                color: '#00f900',
            },
            '80%': {
                color: theme.palette.mode === 'dark' ? '#518851' : '#008000',
            },
            '100%': {
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            },
        },
        animation: 'blinkAnimation 2s ease-in-out infinite',
    };
}

const styles: Record<string, any> = {
    label: {
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
    },
    valueImage: {
        maxHeight: '100%',
    },
    valueAndUnit: {
        display: 'flex',
        gap: 4,
        alignItems: 'baseline',
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
        let fontSize: number | undefined;
        if (this.props.schema.size === 'normal') {
            fontSize = 16;
        } else if (this.props.schema.size === 'large') {
            fontSize = 20;
        } else if (typeof this.props.schema.size === 'number') {
            fontSize = this.props.schema.size;
        }

        const divStyle: React.CSSProperties = {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            fontSize,
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
            if (this.props.oContext.isFloatComma) {
                valueTxt = valueTxt.replace('.', ',');
            }
        } else if (!this.props.schema.booleanAsCheckbox || typeof this.props.schema.data !== 'boolean') {
            valueTxt = this.props.schema.data.toString();
        }
        let multiLine = false;

        if (this.props.schema.booleanAsCheckbox && typeof this.props.schema.data === 'boolean') {
            value = (
                <Checkbox
                    checked={!!value}
                    disabled
                    size={
                        this.props.schema.size === 'small'
                            ? 'small'
                            : this.props.schema.size === 'large'
                              ? 'large'
                              : undefined
                    }
                />
            );
        } else if (valueTxt.startsWith('data:image/')) {
            value = (
                <div style={{ ...styles.value, ...styles.valueImage, ...(this.props.schema.styleValue || undefined) }}>
                    <Icon src={valueTxt} />
                </div>
            );
        } else {
            const valStyle: React.CSSProperties = { ...styles.value, ...(this.props.schema.styleValue || undefined) };
            if (this.props.schema.html) {
                value = (
                    <div
                        style={valStyle}
                        dangerouslySetInnerHTML={{ __html: valueTxt }}
                    />
                );
            } else {
                if (Array.isArray(this.props.schema.data)) {
                    multiLine = true;
                    value = (
                        <div style={valStyle}>
                            {this.props.schema.data.map((it, i) => (
                                <div key={i}>
                                    {typeof it === 'object' || it === null || it === undefined
                                        ? JSON.stringify(it)
                                        : it}
                                </div>
                            ))}
                        </div>
                    );
                } else {
                    if (valueTxt.includes('\n')) {
                        multiLine = true;
                        value = <div style={valStyle}>{Utils.renderTextWithA(valueTxt)}</div>;
                    } else {
                        value = <div style={valStyle}>{valueTxt}</div>;
                    }
                }
            }
        }

        if (this.props.schema.blinkOnUpdate && this.props.schema.blink) {
            const style1 = valueBlinkOnce(this.props.oContext.theme, true, this.props.schema.blinkOnUpdate);
            const style2 = valueBlink(this.props.oContext.theme, this.props.schema.blink);
            value = (
                <Box
                    key={valueTxt}
                    sx={{ ...style1, ...style2 }}
                >
                    {value}
                </Box>
            );
        } else if (this.props.schema.blinkOnUpdate) {
            const style = valueBlinkOnce(this.props.oContext.theme, false, this.props.schema.blinkOnUpdate);
            value = (
                <Box
                    key={valueTxt}
                    sx={style}
                >
                    {value}
                </Box>
            );
        } else if (this.props.schema.blink) {
            const style = valueBlink(this.props.oContext.theme, this.props.schema.blink);
            value = <Box sx={style}>{value}</Box>;
        }

        if (this.props.schema.unit) {
            value = (
                <div style={styles.valueAndUnit}>
                    {value}
                    <div style={{ ...styles.unit, ...(this.props.schema.styleUnit || undefined) }}>
                        {this.getText(this.props.schema.unit, this.props.schema.noTranslation)}
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
        let copyButton: React.JSX.Element | undefined;
        if (this.props.schema.copyToClipboard) {
            copyButton = (
                <ContentCopy
                    className="staticCopyButton"
                    style={{
                        position: 'absolute',
                        top: 'calc(50% - 12px)',
                        right: 0,
                        cursor: 'pointer',
                    }}
                    onClick={() => {
                        Utils.copyToClipboard(valueTxt);
                        window.alert(I18n.t('ra_Copied'));
                    }}
                />
            );
        }

        const boxStyle: Record<string, any> = {
            '& .staticCopyButton': {
                display: 'none',
            },
            '& .staticCopyButton:action': {
                transform: 'scale(0.9)',
            },
            '&:hover .staticCopyButton': {
                display: 'block',
            },
        };
        if (this.props.schema.highlight) {
            boxStyle['&:hover'] = {
                backgroundColor: this.props.oContext.themeType === 'dark' ? '#51515180' : '#b8b8b880',
            };
        }
        if (multiLine) {
            divStyle.alignItems = 'top';
        }

        return (
            <Box
                component="div"
                style={divStyle}
                sx={boxStyle}
            >
                <div style={{ ...styles.label, ...(this.props.schema.styleLabel || undefined) }}>
                    {labelIcon}
                    {label}
                </div>
                {value}
                {copyButton}
            </Box>
        );
    }
}

export default ConfigStaticInfo;
