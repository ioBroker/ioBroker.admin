import React from 'react';
import PropTypes from 'prop-types';
import {ChromePicker} from 'react-color';

const PickerDialog =
    ({
         value,
         onClick,
         onChange,
         className
     }) => 
            <ChromePicker
                color={value}
                onChange={onChange}
                className={className}
            />


PickerDialog.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    onClick: PropTypes.func,
    className: PropTypes.any
};

export default PickerDialog;
