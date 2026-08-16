import React, { Component, type JSX } from 'react';

import { Button, Box, Alert, AlertTitle, Typography } from '@mui/material';

import { Public as IconCloud, Language as IconCloudPro, Check as IconCheck } from '@mui/icons-material';

import { type Translate } from '@iobroker/gui-components';

import WizardStepFrame from './WizardStepFrame';

interface WizardPortForwardingProps {
    auth: boolean;
    secure: boolean;
    t: Translate;
    /** Go one step back */
    onBack?: () => void;
    onDone: () => void;
}

export default class WizardPortForwarding extends Component<WizardPortForwardingProps> {
    render(): JSX.Element {
        // The less protected the installation is, the louder the warning
        let severity: 'error' | 'warning' | 'info';
        let title: string;
        if (!this.props.auth) {
            severity = 'error';
            title = this.props.t('Warning!');
        } else if (!this.props.secure) {
            severity = 'warning';
            title = this.props.t('Be aware!');
        } else {
            severity = 'info';
            title = this.props.t('Information');
        }

        return (
            <WizardStepFrame
                title={this.props.t('Important information about port forwarding')}
                onBack={this.props.onBack}
                actions={
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={() => this.props.onDone()}
                        startIcon={<IconCheck />}
                    >
                        {this.props.t('Understand')}
                    </Button>
                }
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 700 }}>
                    <Alert severity={severity}>
                        <AlertTitle>{title}</AlertTitle>
                        {this.props.t(
                            'Do not expose iobroker Admin or Web interfaces to the internet directly via the port forwarding!',
                        )}
                    </Alert>

                    <Box>
                        <Typography sx={{ mb: 2 }}>
                            {this.props.t(
                                'The Cloud services from iobroker.net/pro can help here to do that securely:',
                            )}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                color="secondary"
                                variant="contained"
                                onClick={() => window.open('https://iobroker.pro', 'help')}
                                startIcon={<IconCloudPro />}
                            >
                                ioBroker.pro
                            </Button>
                            <Button
                                color="secondary"
                                variant="contained"
                                onClick={() => window.open('https://iobroker.net', 'help')}
                                startIcon={<IconCloud />}
                            >
                                ioBroker.net
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </WizardStepFrame>
        );
    }
}
