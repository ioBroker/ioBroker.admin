import React from 'react';
import PropTypes from 'prop-types';
import { ChromePicker } from 'react-color';

import {
    IconButton,
    TextField,
    Dialog,
} from '@mui/material';

import { Close as ClearIcon } from '@mui/icons-material';

import Utils from './wrapper/Components/Utils';
import ColorPicker from './wrapper/Components/ColorPicker';

import ConfigGeneric from './ConfigGeneric';

class ConfigColor extends ConfigGeneric {
    renderColorDialog() {
        return !!this.state.showColorDialog && <Dialog
            onClose={() => this.setState({ showColorDialog: false })}
            open={this.state.showColorDialog}
        >
            <ChromePicker
                color={this.state.colorDialogValue}
                onChange={value =>
                    this.setState({ colorDialogValue: value }, () =>
                        this.onChange(this.props.attr, ColorPicker.getColor(this.state.colorDialogValue, true)))}
            />
        </Dialog>;
    }

    renderItem(error, disabled /* , defaultValue */) {
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
                    endAdornment: value ?
                        <IconButton
                            disabled={!!this.props.onPaste}
                            size="small"
                            onClick={e => {
                                e.stopPropagation();
                                this.onChange(this.props.attr, '');
                            }}
                        >
                            <ClearIcon />
                        </IconButton>
                        : undefined,
                }}
                InputLabelProps={{ shrink: true }}
            />
        </>;
    }
}

ConfigColor.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default ConfigColor;
