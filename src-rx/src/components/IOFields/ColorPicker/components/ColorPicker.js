import React, {useRef} from 'react';
import PropTypes from 'prop-types';
import compose from 'recompose/compose';
import withState from 'recompose/withState';

import TextField from '@material-ui/core/TextField';

import {DEFAULT_CONVERTER, converters} from '../transformers';
import PickerDialog from './PickerDialog';
import Popover from '@material-ui/core/Popover';

const ColorPicker =
    ({
         // ColorPicker
         onChange,
         convert,

         // Text field
         name,
         id,
         hintText,
         placeholder,
         floatingLabelText,
         label,
         TextFieldProps,
         value,

         // State
         showPicker,
         setShowPicker,
         internalValue,
         setValue,
         pickerClassName,

         ...custom
     }) => {
     const fieldRef = useRef();
     return <>
        <TextField
            name={name}
            ref={fieldRef}
            id={id}
            label={floatingLabelText || label}
            placeholder={hintText || placeholder}
            onClick={() => setShowPicker(true)}
            onChange={e => {
                setValue(e.target.value)
                onChange(e.target.value)
            }}
            InputProps={{style: {color: value === undefined ? internalValue : value}}}
            {...TextFieldProps}
            {...custom}
        />
        <Popover
            open={showPicker}
            onClose={() => setShowPicker(false)}
            anchorEl={()=>fieldRef.current}
            anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        >
            <PickerDialog
                value={value === undefined ? internalValue : value}
                onChange={c => {
                    const newValue = converters[convert](c)
                    setValue(newValue)
                    onChange(newValue)
                }}
                className={pickerClassName}
            />
        </Popover>
    </>};

ColorPicker.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    convert: PropTypes.oneOf(Object.keys(converters)),
    name: PropTypes.string,
    id: PropTypes.string,
    hintText: PropTypes.string,
    placeholder: PropTypes.string,
    label: PropTypes.string,
    floatingLabelText: PropTypes.string,
    TextFieldProps: PropTypes.shape(TextField.propTypes),
    showPicker: PropTypes.bool,
    setShowPicker: PropTypes.func,
    internalValue: PropTypes.string,
    setValue: PropTypes.func,
    pickerClassName: PropTypes.any
};

ColorPicker.defaultProps = {
    convert: DEFAULT_CONVERTER
};

const makeColorPicker = compose(
    withState('showPicker', 'setShowPicker', false),
    withState('internalValue', 'setValue', ({defaultValue}) => defaultValue)
);

const MadenColorPicker = makeColorPicker(ColorPicker);

export const ColorPickerField = ({input: {value, onChange, ...restInput}, meta: {touched, error}, ...restProps}) =>
    <MadenColorPicker
        value={value}
        onChange={onChange}
        errorText={touched && error}
        {...restInput}
        {...restProps}
    />;

ColorPickerField.propTypes = {
    input: PropTypes.object,
    meta: PropTypes.object
};

export default MadenColorPicker;
