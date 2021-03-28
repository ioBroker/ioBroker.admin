import { FormControl, FormHelperText, TextField, withStyles } from '@material-ui/core';
import React from 'react';
import I18n from '@iobroker/adapter-react/i18n';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const styles = theme => ({
    input: {
        minWidth: 300
    },
    inputNumber: {
        minWidth: 150
    },
    heightInput: {
        height: 30
    }
});

const CustomInput = ({ styleComponentBlock, component, size, variant, table, value, title, attr, type, style, classes, native, onChange, className }) => {
    const error = false;
    return <FormControl
        className={clsx(type === 'number' ? classes.inputNumber : classes.input + ' ' + classes.controlElement, className)}
        style={Object.assign({ paddingTop: 5 }, style)}
    >
        <TextField
            error={!!error}
            variant={variant}
            value={table ? value : native[attr]}
            type={type}
            helperText={error || ''}
            style={style}
            className={classes.heightInput}
            onChange={e => {
                if (table) {
                    onChange(e.target.value);
                } else {
                    onChange(attr, e.target.value);
                }
            }}
            margin="normal"
            size={size}
        />
        <div style={styleComponentBlock}>
            <FormHelperText style={{ marginTop: -3 }}>{I18n.t(title)}</FormHelperText>
            {component}
        </div>
    </FormControl>;
}

CustomInput.defaultProps = {
    value: '',
    type: 'text',
    className: null,
    table: false,
    native: {},
    variant: 'standard',
    size: 'medium',
    component: null,
    styleComponentBlock: null
};

CustomInput.propTypes = {
    title: PropTypes.string,
    attr: PropTypes.string,
    type: PropTypes.string,
    style: PropTypes.object,
    native: PropTypes.object,
    onChange: PropTypes.func,
    component: PropTypes.object,
    styleComponentBlock: PropTypes.object
};

export default withStyles(styles)(CustomInput);