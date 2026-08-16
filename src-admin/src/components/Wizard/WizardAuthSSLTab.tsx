import React, { Component, type JSX } from 'react';

import {
    FormControlLabel,
    Switch,
    Button,
    InputLabel,
    MenuItem,
    FormHelperText,
    FormControl,
    Select,
    Box,
    Paper,
} from '@mui/material';

import { ArrowForward as IconNext } from '@mui/icons-material';

import { type Translate } from '@iobroker/gui-components';

import WizardStepFrame from './WizardStepFrame';

interface WizardAuthSSLTabProps {
    auth: boolean;
    secure: boolean;
    t: Translate;
    /** Go one step back */
    onBack?: () => void;
    onDone: (config: { auth: boolean; secure: boolean }) => void;
}

interface WizardAuthSSLTabState {
    auth: boolean;
    secure: boolean;
}

export default class WizardAuthSSLTab extends Component<WizardAuthSSLTabProps, WizardAuthSSLTabState> {
    constructor(props: WizardAuthSSLTabProps) {
        super(props);

        this.state = {
            auth: !!props.auth,
            secure: !!props.secure,
        };
    }

    render(): JSX.Element {
        return (
            <WizardStepFrame
                title={this.props.t('It is suggested to enable the authentication in admin')}
                onBack={this.props.onBack}
                actions={
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={() => this.props.onDone({ auth: this.state.auth, secure: this.state.secure })}
                        startIcon={<IconNext />}
                    >
                        {this.props.t('Next')}
                    </Button>
                }
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 560 }}>
                    <Paper
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 2 }}
                    >
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={this.state.auth}
                                    onChange={() => this.setState({ auth: !this.state.auth })}
                                />
                            }
                            label={this.props.t('Authentication in Admin')}
                        />
                        <FormHelperText>
                            {this.props.t(
                                'Activate the check of password in admin if you plan to access your ioBroker is not in "Demilitarized Zone"',
                            )}
                        </FormHelperText>
                    </Paper>

                    <Paper
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 2 }}
                    >
                        <FormControl
                            fullWidth
                            size="small"
                        >
                            <InputLabel id="wizard-certificates-label">{this.props.t('Certificates')}</InputLabel>
                            <Select
                                labelId="wizard-certificates-label"
                                label={this.props.t('Certificates')}
                                value={this.state.secure ? 'true' : 'false'}
                                onChange={e => this.setState({ secure: e.target.value === 'true' })}
                            >
                                <MenuItem value="false">{this.props.t('No SSL')}</MenuItem>
                                <MenuItem value="true">{this.props.t('Use self signed certificates')}</MenuItem>
                            </Select>
                            <FormHelperText>
                                {this.state.secure
                                    ? this.props.t(
                                          'Browsers will inform you about the problem with self-signed certificates, but the communication is encrypted.',
                                      )
                                    : this.props.t('Your communication with admin is not encrypted')}
                            </FormHelperText>
                        </FormControl>
                    </Paper>
                </Box>
            </WizardStepFrame>
        );
    }
}
