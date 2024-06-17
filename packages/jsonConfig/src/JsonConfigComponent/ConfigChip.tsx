import React from 'react';

import {
    FormHelperText,
    FormControl,
} from '@mui/material';

import type { ConfigItemChip } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';
import ChipInput from './ChipInput';

const styles: Record<string, React.CSSProperties> = {
    fullWidth: {
        width: '100%',
    },
};
interface ConfigChipProps extends ConfigGenericProps {
    schema: ConfigItemChip;
}

class ConfigChip extends ConfigGeneric<ConfigChipProps, ConfigGenericState> {
    componentDidMount() {
        super.componentDidMount();
        const { data, attr } = this.props;
        const value = ConfigGeneric.getValue(data, attr);
        if (this.props.schema.delimiter && typeof value === 'string') {
            const parts = value.split(this.props.schema.delimiter).map(a => a.trim()).filter(a => a);
            this.setState({ value: parts });
        } else {
            this.setState({ value: value || [] });
        }
    }

    renderItem(error: string, disabled: boolean): React.JSX.Element | null {
        const { attr, schema } = this.props;
        const { value } = this.state;
        return <FormControl fullWidth variant="standard">
            <ChipInput
                value={value}
                disabled={!!disabled}
                label={this.getText(schema.label)}
                error={!!error}
                onAdd={chip => {
                    const newValue = JSON.parse(JSON.stringify(value));
                    newValue.push(chip);
                    this.setState({ value: newValue }, () => {
                        if (this.props.schema.delimiter) {
                            this.onChange(attr, newValue.join(`${this.props.schema.delimiter} `));
                        } else {
                            this.onChange(attr, newValue);
                        }
                    });
                }}
                theme={this.props.theme}
                onDelete={(chip, index) => {
                    const newValue = JSON.parse(JSON.stringify(value));
                    newValue.splice(index, 1);
                    this.setState({ value: newValue }, () => {
                        if (this.props.schema.delimiter) {
                            this.onChange(attr, newValue.join(`${this.props.schema.delimiter} `));
                        } else {
                            this.onChange(attr, newValue);
                        }
                    });
                }}
            />
            {this.props.schema.help ?
                <FormHelperText>
                    {this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
                </FormHelperText> : null}
        </FormControl>;
    }
}

export default ConfigChip;
