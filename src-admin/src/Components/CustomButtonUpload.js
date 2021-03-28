import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { TextField } from '@material-ui/core';
import I18n from '@iobroker/adapter-react/i18n';

const useStyles = makeStyles(theme => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
        },
    },
    input: {
        display: 'none',
    },
}));

const CustomButtonUpload = ({ title, onChange }) => {
    const classes = useStyles();
    const [valueFileUpload, setValueFileUpload] = useState('');
    return <div className={classes.root}>
        <input
            accept="image/*"
            className={classes.input || ''}
            id="contained-button-file"
            multiple
            type="file"
            onChange={(e) => {
                onChange(e.target.files[0] || e.dataTransfer.files[0], name =>
                    setValueFileUpload(name));
            }}
        />
        <label htmlFor="contained-button-file">
            <Button variant="contained" color="primary" component="span">
                {I18n.t(title)}
            </Button>
            <TextField style={{ marginLeft: 20 }} value={valueFileUpload} />
        </label>
    </div>;
}

export default CustomButtonUpload;