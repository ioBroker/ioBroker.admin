import React from 'react';

import { Grid2, FormControl, TextField, Paper, InputAdornment, IconButton } from '@mui/material';

import { Close as CloseIcon } from '@mui/icons-material';

import { withWidth, type Translate, type IobTheme } from '@iobroker/adapter-react-v5';
import type { ioBrokerObject } from '@/types';
import AdminUtils from '@/AdminUtils';
import BaseSystemSettingsDialog from './BaseSystemSettingsDialog';

const styles: Record<string, any> = {
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
    descriptionPanel: (theme: IobTheme) => ({
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
    }),
    formControl: {
        margin: 8,
        minWidth: '100%',
    },
};

interface SSLDialogProps {
    t: Translate;
    data: ioBrokerObject<{ letsEncrypt: { email?: string; domains?: string; path?: string } }>;
    onChange: (data: Record<string, any>) => void;
    saving: boolean;
}

class SSLDialog extends BaseSystemSettingsDialog<SSLDialogProps> {
    render() {
        const { data } = this.props;
        const { letsEncrypt } = data.native || {};
        return (
            <div style={styles.tabPanel}>
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
                <div style={styles.buttonPanel}>
                    <Paper
                        variant="outlined"
                        sx={styles.descriptionPanel}
                        dangerouslySetInnerHTML={{ __html: this.props.t('letsnecrypt_help') }}
                    />
                </div>
                <Grid2
                    container
                    spacing={6}
                >
                    <Grid2 size={{ md: 3, xs: 12 }}>
                        <FormControl
                            variant="standard"
                            style={styles.formControl}
                        >
                            <TextField
                                variant="standard"
                                id="email"
                                disabled={this.props.saving}
                                label={this.props.t('Email for account:')}
                                value={letsEncrypt?.email || ''}
                                onChange={evt => this.onChangeText(evt, 'email')}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        readOnly: false,
                                        endAdornment: letsEncrypt?.email ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        this.onChangeText({ target: { value: '' } }, 'email')
                                                    }
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    },
                                }}
                            />
                        </FormControl>
                    </Grid2>
                    <Grid2 size={{ md: 3, xs: 12 }}>
                        <FormControl
                            variant="standard"
                            style={styles.formControl}
                        >
                            <TextField
                                disabled={this.props.saving}
                                variant="standard"
                                id="domains"
                                label={this.props.t('Domains:')}
                                value={letsEncrypt?.domains || ''}
                                onChange={evt => this.onChangeText(evt, 'domains')}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        readOnly: false,
                                        endAdornment: letsEncrypt?.domains ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        this.onChangeText({ target: { value: '' } }, 'domains')
                                                    }
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    },
                                }}
                            />
                        </FormControl>
                    </Grid2>
                    <Grid2 size={{ md: 3, xs: 12 }}>
                        <FormControl
                            variant="standard"
                            style={styles.formControl}
                        >
                            <TextField
                                variant="standard"
                                id="path"
                                disabled={this.props.saving}
                                label={this.props.t('Path to storage:')}
                                value={letsEncrypt?.path || ''}
                                onChange={evt => this.onChangeText(evt, 'path')}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        readOnly: false,
                                        endAdornment: letsEncrypt?.path ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => this.onChangeText({ target: { value: '' } }, 'path')}
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    },
                                }}
                            />
                        </FormControl>
                    </Grid2>
                </Grid2>
            </div>
        );
    }

    onChangeText(evt: { target: { value: string } }, id: 'email' | 'domains' | 'path') {
        const value = evt.target.value;
        this.doChange(id, value);
    }

    doChange(name: 'email' | 'domains' | 'path', value: string) {
        const newData = AdminUtils.clone(this.props.data);
        newData.native.letsEncrypt = newData.native.letsEncrypt || {};
        newData.native.letsEncrypt[name] = value;
        this.props.onChange(newData);
    }
}

export default withWidth()(SSLDialog);
