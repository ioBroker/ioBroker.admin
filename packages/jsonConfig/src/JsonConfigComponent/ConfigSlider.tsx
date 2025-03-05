import React, { type JSX } from 'react';

import { Box, Typography, Slider } from '@mui/material';

import type { ConfigItemSlider } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    fullWidth: {
        width: '100%',
    },
    slider: {
        marginLeft: 10,
        marginRight: 10,
        width: 'calc(100% - 20px)',
    },
};

interface ConfigSliderProps extends ConfigGenericProps {
    schema: ConfigItemSlider;
}

interface ConfigSliderState extends ConfigGenericState {
    _value: number;
}

class ConfigSlider extends ConfigGeneric<ConfigSliderProps, ConfigSliderState> {
    componentDidMount(): void {
        super.componentDidMount();
        const _value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ _value });
    }

    static getDerivedStateFromProps(
        props: ConfigSliderProps,
        state: ConfigSliderState,
    ): Partial<ConfigSliderState> | null {
        if (
            (props.schema.min !== undefined && props.schema.min < 0) ||
            (props.schema.max !== undefined && props.schema.max < 0)
        ) {
            return null;
        }
        const _value = ConfigGeneric.getValue(props.data, props.attr);
        if (
            _value === null ||
            _value === undefined ||
            _value.toString() !== parseFloat(state._value as any as string).toString()
        ) {
            return { _value };
        }

        return null;
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */): JSX.Element {
        const min = this.props.schema.min || 0;
        const max = this.props.schema.max || 100;
        const unit = this.props.schema.unit
            ? this.getText(this.props.schema.unit, this.props.schema.noTranslation)
            : '';

        const marks = [
            { value: min, label: min + unit },
            { value: max, label: max + unit },
        ];

        return (
            <Box style={styles.fullWidth}>
                {this.props.schema.label ? (
                    <Typography gutterBottom>{this.getText(this.props.schema.label)}</Typography>
                ) : null}
                <Slider
                    style={styles.slider}
                    value={this.state._value}
                    getAriaValueText={value => value + unit}
                    step={this.props.schema.step || (max - min) / 100}
                    valueLabelDisplay="auto"
                    marks={marks}
                    min={min}
                    max={max}
                    disabled={!!disabled}
                    onChange={e => {
                        const _value = (e.target as HTMLInputElement).value as any as number;
                        this.setState({ _value }, () => this.onChange(this.props.attr, _value));
                    }}
                />
                {this.props.schema.help ? (
                    <Typography>
                        {this.renderHelp(
                            this.props.schema.help,
                            this.props.schema.helpLink,
                            this.props.schema.noTranslation,
                        )}
                    </Typography>
                ) : null}
            </Box>
        );
    }
}

export default ConfigSlider;
