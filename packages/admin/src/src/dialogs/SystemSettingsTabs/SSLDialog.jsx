// SSLDialog.js
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import {
    Grid,
    FormControl,
    TextField,
    Paper,
    InputAdornment,
    IconButton,
} from '@mui/material';

import { Close as CloseIcon } from '@mui/icons-material';

import { withWidth } from '@iobroker/adapter-react-v5';

const styles = theme => ({
    tabPanel: {
        width: '100%',
        height: '100% ',
        overflow: 'auto',
        overflowX: 'hidden',
        padding: 15,
        // backgroundColor: blueGrey[ 50 ]
    },
    buttonPanel: {
        paddingBottom: 50,
        display: 'flex',
    },
    descriptionPanel: {
        width: '100%',
        backgroundColor: 'transparent',
        marginLeft: 40,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        '& a': {
            paddingLeft: 3,
            color: theme.palette.mode === 'dark' ? '#EEE' : '#111',
        },
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: '100%',
    },
});

class SSLDialog extends Component {
    render() {
        const { classes, data } = this.props;
        const { letsEncrypt } = data.native || {};
        return <div className={classes.tabPanel}>
            <div
                style={{
                    width: '100%',
                    // height: '100% ',
                    overflow: 'auto',
                    overflowX: 'hidden',
                    padding: 15,
                    fontSize: 20,
                    color: '#ff4949',
                }}
            >
                {this.props.t('ra_Use iobroker.acme adapter for letsencrypt certificates')}
            </div>
            <div className={classes.buttonPanel}>
                <Paper
                    variant="outlined"
                    className={classes.descriptionPanel}
                    dangerouslySetInnerHTML={{ __html: this.props.t('letsnecrypt_help') }}
                />
            </div>
            <Grid container spacing={6}>
                <Grid item md={3} xs={12}>
                    <FormControl variant="standard" className={classes.formControl}>
                        <TextField
                            variant="standard"
                            id="email"
                            disabled={this.props.saving}
                            label={this.props.t('Email for account:')}
                            value={letsEncrypt?.email || ''}
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, 'email')}
                            InputProps={{
                                readOnly: false,
                                endAdornment: letsEncrypt?.email ? <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => this.onChangeText({ target: { value: '' } }, 'email')}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </InputAdornment> : null,
                            }}
                        />
                    </FormControl>
                </Grid>
                <Grid item md={3} xs={12}>
                    <FormControl variant="standard" className={classes.formControl}>
                        <TextField
                            disabled={this.props.saving}
                            variant="standard"
                            id="domains"
                            label={this.props.t('Domains:')}
                            value={letsEncrypt?.domains || ''}
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, 'domains')}
                            InputProps={{
                                readOnly: false,
                                endAdornment: letsEncrypt?.domains ? <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => this.onChangeText({ target: { value: '' } }, 'domains')}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </InputAdornment> : null,
                            }}
                        />
                    </FormControl>
                </Grid>
                <Grid item md={3} xs={12}>
                    <FormControl variant="standard" className={classes.formControl}>
                        <TextField
                            variant="standard"
                            id="path"
                            disabled={this.props.saving}
                            label={this.props.t('Path to storage:')}
                            value={letsEncrypt?.path || ''}
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, 'path')}
                            InputProps={{
                                readOnly: false,
                                endAdornment: letsEncrypt?.path ? <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => this.onChangeText({ target: { value: '' } }, 'path')}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </InputAdornment> : null,
                            }}
                        />
                    </FormControl>
                </Grid>
            </Grid>
        </div>;
    }

    onChangeText = (evt, id) => {
        const value = evt.target.value;
        this.doChange(id, value);
    };

    doChange = (name, value) => {
        const newData = JSON.parse(JSON.stringify(this.props.data));
        newData.native.letsEncrypt = newData.native.letsEncrypt || {};
        newData.native.letsEncrypt[name] = value;
        this.props.onChange(newData);
    };
}

SSLDialog.propTypes = {
    t: PropTypes.func,
    data: PropTypes.object,
    onChange: PropTypes.func,
    saving: PropTypes.bool,
};

export default withWidth()(withStyles(styles)(SSLDialog));
