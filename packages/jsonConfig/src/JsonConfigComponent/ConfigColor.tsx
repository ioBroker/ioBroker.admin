import React from 'react';
import { ChromePicker, type ColorResult, type RGBColor } from 'react-color';

import {
    IconButton,
    TextField,
    Dialog,
} from '@mui/material';

import { Close as ClearIcon } from '@mui/icons-material';

import { Utils } from '@iobroker/adapter-react-v5';

import type { ConfigItemText } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigColorProps extends ConfigGenericProps {
    schema: ConfigItemText;
}

interface ConfigColorState extends ConfigGenericState {
    showColorDialog?: boolean;
    colorDialogValue?: string;
}

class ConfigColor extends ConfigGeneric<ConfigColorProps, ConfigColorState> {
    renderColorDialog() {
        return !!this.state.showColorDialog && <Dialog
            onClose={() => this.setState({ showColorDialog: false })}
            open={this.state.showColorDialog}
        >
            <ChromePicker
                color={this.state.colorDialogValue}
                onChange={(color: ColorResult) =>
                    this.setState({ colorDialogValue: color.hex }, () =>
                        this.onChange(this.props.attr, this.state.colorDialogValue))}
            />
        </Dialog>;
    }

    renderItem(_error: unknown, disabled: boolean /* , defaultValue */) {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        let textColor = Utils.isUseBright(value, null);
        if (textColor === null) {
            textColor = undefined;
        }
        return <>
            {this.renderColorDialog()}
            <TextField
                variant="standard"
                disabled={!!disabled}
                style={{ minWidth: 100, width: 'calc(100% - 8px)' }}
                label={this.getText(this.props.schema.label)}
                value={value || ''}
                onClick={() => !this.props.schema.readOnly && this.setState({ showColorDialog: true, colorDialogValue: value || '' })}
                onChange={e => {
                    const color = e.target.value;
                    this.onChange(this.props.attr, color);
                }}
                inputProps={{
                    style: {
                        // paddingLeft: noPadding ? 0 : 8,
                        backgroundColor: value,
                        color: textColor ? '#FFF' : '#000',
                    },
                    readOnly: this.props.schema.readOnly || false,
                }}
                // eslint-disable-next-line react/jsx-no-duplicate-props
                InputProps={{
                    endAdornment: value && !this.props.schema.noClearButton ? <IconButton
                        size="small"
                        onClick={e => {
                            e.stopPropagation();
                            this.onChange(this.props.attr, '');
                        }}
                    >
                        <ClearIcon />
                    </IconButton> : undefined,
                }}
                InputLabelProps={{ shrink: true }}
            />
        </>;
    }
}

export default ConfigColor;
