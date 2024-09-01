import React, { Component } from 'react';

import {
    Grid2,
    Toolbar,
    FormControlLabel,
    Checkbox,
    Button,
    Paper,
    InputLabel,
    MenuItem,
    FormHelperText,
    FormControl,
    Select,
    FormGroup, Box,
} from '@mui/material';

import { Check as IconCheck } from '@mui/icons-material';

import { type IobTheme, type Translate, withWidth } from '@iobroker/adapter-react-v5';

const TOOLBAR_HEIGHT = 64;

const styles: Record<string, any> = {
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
    title: (theme: IobTheme) => ({
        color: theme.palette.secondary.main,
    }),
    form: {
        height: `calc(100% - ${TOOLBAR_HEIGHT + 8}px)`,
        overflow: 'auto',
    },
    input: {
        width: 400,
        textAlign: 'left',
    },
    inputLine: {
        width: 400,
        margin: 'auto',
        marginBottom: 50,
    },
    grow: {
        flexGrow: 1,
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
        lineHeight: `${TOOLBAR_HEIGHT}px`,
    },
};

interface WizardAuthSSLTabProps {
    auth: boolean;
    secure: boolean;
    t: Translate;
    onDone: (config: { auth: boolean; secure: boolean }) => void;
}

interface WizardAuthSSLTabState {
    auth: boolean;
    secure: boolean;
}

class WizardAuthSSLTab extends Component<WizardAuthSSLTabProps, WizardAuthSSLTabState> {
    constructor(props: WizardAuthSSLTabProps) {
        super(props);

        this.state = {
            auth: !!this.props.auth,
            secure: !!this.props.secure,
        };
    }

    render() {
        return <Paper style={styles.paper}>
            <form style={styles.form} noValidate autoComplete="off">
                <Grid2 container direction="column">
                    <Grid2>
                        <Box component="h2" sx={styles.title}>{this.props.t('It is suggested to enable the authentication in admin')}</Box>
                    </Grid2>
                    <Grid2 style={styles.inputLine}>
                        <FormGroup>
                            <FormControlLabel
                                style={styles.input}
                                control={
                                    <Checkbox
                                        checked={this.state.auth}
                                        onChange={() => this.setState({ auth: !this.state.auth })}
                                    />
                                }
                                label={this.props.t('Authentication in Admin')}
                            />
                            <FormHelperText>{this.props.t('Activate the check of password in admin if you plan to access your ioBroker is not in "Demilitarized Zone"')}</FormHelperText>
                        </FormGroup>
                    </Grid2>
                    <Grid2>
                        <FormControl variant="standard" style={styles.input}>
                            <InputLabel>{this.props.t('Certificates')}</InputLabel>
                            <Select
                                variant="standard"
                                value={this.state.secure ? 'true' : 'false'}
                                onChange={e => this.setState({ secure: e.target.value === 'true' })}
                            >
                                <MenuItem value="false">{this.props.t('No SSL')}</MenuItem>
                                <MenuItem value="true">{this.props.t('Use self signed certificates')}</MenuItem>
                            </Select>
                            <FormHelperText>
                                {this.state.secure ?
                                    this.props.t('Browsers will inform you about the problem with self-signed certificates, but the communication is encrypted.') :
                                    this.props.t('Your communication with admin is not encrypted')}
                            </FormHelperText>
                        </FormControl>
                    </Grid2>
                </Grid2>
            </form>
            <Toolbar style={styles.toolbar}>
                <div style={styles.grow} />
                <Button
                    color="primary"
                    variant="contained"
                    onClick={() => this.props.onDone({ auth: this.state.auth, secure: this.state.secure })}
                    startIcon={<IconCheck />}
                >
                    {this.props.t('Apply')}
                </Button>
            </Toolbar>
        </Paper>;
    }
}

export default withWidth()(WizardAuthSSLTab);
