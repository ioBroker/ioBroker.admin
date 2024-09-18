import React, { createRef, Component, type JSX } from 'react';

import { Grid2, Toolbar, Button, Paper, Box } from '@mui/material';

import { Public as IconCloud, Language as IconCloudPro, Check as IconCheck } from '@mui/icons-material';

import { withWidth, type IobTheme, type Translate } from '@iobroker/adapter-react-v5';

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
        marginBottom: 16,
    },
    grow: {
        flexGrow: 1,
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
        lineHeight: `${TOOLBAR_HEIGHT}px`,
    },
    text: {
        fontSize: 16,
    },

    error: {
        fontSize: 24,
        color: '#c61f1f',
    },
    warning: {
        fontSize: 20,
        color: '#c6891f',
    },
    information: {
        fontSize: 18,
        color: '#429c1b',
    },
    button: {
        marginRight: 16,
    },
};

interface WizardPortForwardingProps {
    auth: boolean;
    secure: boolean;
    t: Translate;
    onDone: () => void;
}

interface WizardPortForwardingState {
    auth: boolean;
    secure: boolean;
}

class WizardPortForwarding extends Component<WizardPortForwardingProps, WizardPortForwardingState> {
    private readonly focusRef: React.RefObject<HTMLInputElement>;

    constructor(props: WizardPortForwardingProps) {
        super(props);

        this.focusRef = createRef();
    }

    componentDidMount(): void {
        this.focusRef.current?.focus();
    }

    render(): JSX.Element {
        return (
            <Paper style={styles.paper}>
                <form
                    style={styles.form}
                    noValidate
                    autoComplete="off"
                >
                    <Grid2
                        container
                        direction="column"
                    >
                        <Grid2>
                            <Box
                                component="h2"
                                sx={styles.title}
                            >
                                {this.props.t('Important information about port forwarding')}
                            </Box>
                        </Grid2>
                        <Grid2>
                            {!this.props.auth ? <div style={styles.error}>{this.props.t('Warning!')}</div> : null}
                            {this.props.auth && !this.props.secure ? (
                                <div style={styles.warning}>{this.props.t('Be aware!')}</div>
                            ) : null}
                            {this.props.auth && this.props.secure ? (
                                <div style={styles.information}>{this.props.t('Information')}</div>
                            ) : null}

                            <div style={styles.text}>
                                {this.props.t(
                                    'Do not expose iobroker Admin or Web interfaces to the internet directly via the port forwarding!',
                                )}
                            </div>
                        </Grid2>
                        <Grid2 style={{ marginTop: 16 }}>
                            <div style={styles.text}>
                                {this.props.t(
                                    'The Cloud services from iobroker.net/pro can help here to do that securely:',
                                )}
                            </div>
                        </Grid2>
                        <Grid2 style={{ marginTop: 16 }}>
                            <Button
                                style={styles.button}
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
                        </Grid2>
                    </Grid2>
                </form>
                <Toolbar style={styles.toolbar}>
                    <div style={styles.grow} />
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={() => this.props.onDone()}
                        startIcon={<IconCheck />}
                    >
                        {this.props.t('Understand')}
                    </Button>
                </Toolbar>
            </Paper>
        );
    }
}

export default withWidth()(WizardPortForwarding);
