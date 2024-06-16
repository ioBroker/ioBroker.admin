import React, { Component } from 'react';
import { type Styles, withStyles } from '@mui/styles';

import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    AppBar,
    Toolbar,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';

// Icons
import {
    PlayArrow as PlayArrowIcon,
    Check as CheckIcon,
} from '@mui/icons-material';

import {
    withWidth, Utils,
    Router, ToggleThemeMenu, I18n,
    type AdminConnection,
    type IobTheme,
    type ThemeName,
} from '@iobroker/adapter-react-v5';

import WizardPasswordTab from '@/components/Wizard/WizardPasswordTab';
import WizardLicenseTab from '@/components/Wizard/WizardLicenseTab';
import WizardFinishImage from '@/assets/wizard-finish.jpg';
import WizardWelcomeImage from '@/assets/wizard-welcome.jpg';
import WizardSettingsTab from '@/components/Wizard/WizardSettingsTab';
import WizardAuthSSLTab from '@/components/Wizard/WizardAuthSSLTab';
import WizardPortForwarding from '@/components/Wizard/WizardPortForwarding';
import WizardAdaptersTab from '@/components/Wizard/WizardAdaptersTab';
import Logo from '@/assets/logo.png';
import LongLogo from '@/assets/longLogo.svg';

const TOOLBAR_HEIGHT = 64;

const styles = (theme: IobTheme) => ({
    dialog: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
    },
    paper: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    content: {
        textAlign: 'center',
    },
    tabPanel: {
        width: '100%',
        overflow: 'hidden',
        height: 'calc(100% - 72px)',
    },
    fullHeightWithoutToolbar: {
        height: `calc(100% - ${TOOLBAR_HEIGHT}px)`,
        width: '100%',
        overflow: 'auto',
    },
    finishBackground: {
        backgroundImage: `url(${WizardFinishImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    },
    welcomeBackground: {
        backgroundImage: `url(${WizardWelcomeImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    },
    grow: {
        flexGrow: 1,
    },
    playIcon: {
        marginLeft: 8,
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
    },
    logo: {
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'white',
        marginRight: 8,
        verticalAlign: 'middle',
    },
    themeButton: {
        float: 'right',
        display: 'inline-block',
        marginTop: -1,
        marginRight: 8,
    },

    finalText: {
        fontSize: 48,
        marginTop: 80,
        color: '#265063',
        fontWeight: 'bold',
    },
    finalLongLogo: {
        width: 500,
    },
}) satisfies Styles<any, any>;

interface WizardDialogProps {
    socket: AdminConnection;
    onClose: (redirect?: string) => void;
    toggleTheme: () => void;
    themeName: ThemeName;
    classes: Record<string, any>;
    /** Active host name */
    host: string;
    /** Execute command on given host */
    executeCommand: (cmd: string, host: string, cb: () => void) => void;
}

interface WizardDialogState {
    activeStep: number;
    auth: boolean;
    secure: boolean;
}

class WizardDialog extends Component<WizardDialogProps, WizardDialogState> {
    private adminInstance: null | ioBroker.AdapterObject = null;

    constructor(props: WizardDialogProps) {
        super(props);

        this.state = {
            activeStep: 0,
            auth: false,
            secure: false,
        };
    }

    componentDidMount() {
        this.props.socket.getCurrentInstance()
            .then((namespace: string) =>
                this.props.socket.getObject(`system.adapter.${namespace}`)
                    .then(obj => {
                        this.adminInstance = obj;
                        this.setState({ auth: obj.native.auth, secure: obj.native.secure });
                    }));
    }

    renderWelcome() {
        // shutterstock Standard commercial license on ioBroker GmbH: https://www.shutterstock.com/de/image-vector/welcome-neon-text-vector-sign-design-1186433386
        return <div className={Utils.clsx(this.props.classes.paper, this.props.classes.welcomeBackground)}>
            <div className={this.props.classes.fullHeightWithoutToolbar}>

            </div>
            <Toolbar className={this.props.classes.toolbar}>
                <div className={this.props.classes.grow} />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() =>
                        this.props.socket.getCompactSystemConfig(true)
                            .then(obj =>
                                this.setState({ activeStep: this.state.activeStep + 1 + (obj.common.licenseConfirmed ? 0 : 0) }))}
                >
                    {I18n.t('Start wizard')}
                    {' '}
                    <PlayArrowIcon className={this.props.classes.playIcon} />
                </Button>
                <div className={this.props.classes.grow} />
            </Toolbar>
        </div>;
    }

    renderLicense() {
        return <WizardLicenseTab
            t={I18n.t}
            socket={this.props.socket}
            themeName={this.props.themeName}
            onDone={(settings: any) => {
                this.props.socket.getSystemConfig(true)
                    .then(obj => {
                        obj.common.licenseConfirmed = true;
                        if (settings?.lang) {
                            obj.common.language = settings.lang;
                        }
                        return this.props.socket.setSystemConfig(obj);
                    })
                    .then(() => this.setState({ activeStep: this.state.activeStep + 1 }));
            }}
        />;
    }

    renderPassword() {
        return <WizardPasswordTab
            t={I18n.t}
            socket={this.props.socket}
            themeName={this.props.themeName}
            onDone={(pass: string) =>
                this.props.socket.changePassword('admin', pass)
                    .then(() =>
                        this.setState({ activeStep: this.state.activeStep + 1 }))}
        />;
    }

    renderSettings() {
        return <WizardSettingsTab
            t={I18n.t}
            socket={this.props.socket}
            themeName={this.props.themeName}
            onDone={(settings: any) =>
                this.props.socket.getSystemConfig(true)
                    .then(obj => {
                        Object.assign(obj.common, settings);
                        return this.props.socket.setSystemConfig(obj);
                    })
                    .then(() =>
                        this.setState({ activeStep: this.state.activeStep + 1 }))}
        />;
    }

    renderAuthentication() {
        return <WizardAuthSSLTab
            t={I18n.t}
            auth={this.state.auth}
            secure={this.state.secure}
            socket={this.props.socket}
            themeName={this.props.themeName}
            onDone={(settings: any) =>
                this.setState(settings, () => this.setState({ activeStep: this.state.activeStep + 1 }))}
        />;
    }

    renderPortForwarding() {
        return <WizardPortForwarding
            t={I18n.t}
            socket={this.props.socket}
            themeName={this.props.themeName}
            auth={this.state.auth}
            secure={this.state.secure}
            onDone={() =>
                this.setState({ activeStep: this.state.activeStep + 1 })}
        />;
    }

    /**
     * Render the adapters selection wizard tab
     */
    renderAdapters() {
        return <WizardAdaptersTab
            host={this.props.host}
            socket={this.props.socket}
            executeCommand={this.props.executeCommand}
            onDone={() => this.setState({ activeStep: this.state.activeStep + 1 })}
        />;
    }

    async onClose() {
        // read if discovery is available
        const discovery = await this.props.socket.getState('system.adapter.discovery.0.alive');

        if (this.adminInstance) {
            let certPublic;
            let certPrivate;
            if (this.adminInstance.native.secure !== this.state.secure || this.adminInstance.native.auth !== this.state.auth) {
                if (this.state.secure && (!this.adminInstance.native.certPublic || !!this.adminInstance.native.certPrivate)) {
                    // get certificates
                    try {
                        const certs = await this.props.socket.getCertificates();
                        certPublic  = certs && certs.find(c => c.type === 'public');
                        certPrivate = certs && certs.find(c => c.type === 'private');
                    } catch (e) {
                        window.alert(`Cannot read certificates: ${e}`);
                    }
                }
                this.adminInstance.native.auth = this.state.auth;

                if (this.state.secure) {
                    if (!(this.adminInstance.native.certPublic  || certPublic) ||
                        !(this.adminInstance.native.certPrivate || certPrivate)) {
                        window.alert(I18n.t('Cannot enable authentication as no certificates found!'));
                        this.adminInstance.native.secure = false;

                        await this.props.socket.setObject(this.adminInstance._id, this.adminInstance);
                        // @ts-expect-error check later
                        setTimeout(() => window.location = `http://${window.location.host}/#tab-adapters${discovery?.val ? '/discovery' : ''}`, 1000);
                        this.props.onClose();
                        return;
                    }
                    this.adminInstance.native.secure      = this.state.secure;
                    this.adminInstance.native.certPublic  = this.adminInstance.native.certPublic  || certPublic.name;
                    this.adminInstance.native.certPrivate = this.adminInstance.native.certPrivate || certPrivate.name;
                }

                await this.props.socket.setObject(this.adminInstance._id, this.adminInstance);

                // redirect to https or http
                let redirect;
                if (this.adminInstance.native.secure) {
                    redirect = `https://${window.location.host}/#tab-adapters${discovery?.val ? '/discovery' : ''}`;
                } else {
                    redirect = `http://${window.location.host}/#tab-adapters${discovery?.val ? '/discovery' : ''}`;
                }

                this.props.onClose(redirect);
            } else {
                Router.doNavigate('tab-adapters', discovery?.val ? 'discovery' : undefined);
                this.props.onClose();
            }
        } else {
            Router.doNavigate('tab-adapters', discovery?.val ? 'discovery' : undefined);
            this.props.onClose();
        }
    }

    renderFinish() {
        // Free Image license: https://pixabay.com/illustrations/road-sky-mountains-clouds-black-908176/
        return <div className={Utils.clsx(this.props.classes.paper, this.props.classes.finishBackground)}>
            <div className={this.props.classes.fullHeightWithoutToolbar}>
                <div className={this.props.classes.finalText}>{I18n.t('Have fun automating your home with')}</div>
                <img src={LongLogo} alt="ioBroker" className={this.props.classes.finalLongLogo} />
            </div>
            <Toolbar className={this.props.classes.toolbar}>
                <div className={this.props.classes.grow} />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => this.onClose()}
                    startIcon={<CheckIcon />}
                >
                    {I18n.t('Finish')}
                </Button>
                <div className={this.props.classes.grow} />
            </Toolbar>
        </div>;
    }

    render() {
        return <Dialog
            className={this.props.classes.dialog}
            open={!0}
            onClose={() => {
                // ignore
                // This dialog can be closed only by button
            }}
            fullWidth
            fullScreen
            aria-labelledby="wizard-dialog-title"
        >
            <DialogTitle id="wizard-dialog-title">
                <img src={Logo} className={this.props.classes.logo} alt="logo" />
                {I18n.t('Initial ioBroker setup')}
                {' '}
                <ToggleThemeMenu className={this.props.classes.themeButton} t={I18n.t} toggleTheme={this.props.toggleTheme} themeName={this.props.themeName as any} size="small" />
            </DialogTitle>
            <DialogContent className={this.props.classes.content}>
                <AppBar position="static">
                    <Toolbar>
                        <Stepper activeStep={this.state.activeStep}>
                            <Step><StepLabel>{I18n.t('Welcome')}</StepLabel></Step>
                            <Step><StepLabel>{I18n.t('License agreement')}</StepLabel></Step>
                            <Step><StepLabel>{I18n.t('Password')}</StepLabel></Step>
                            <Step><StepLabel>{I18n.t('Authentication')}</StepLabel></Step>
                            <Step><StepLabel>{I18n.t('Port forwarding')}</StepLabel></Step>
                            <Step><StepLabel>{I18n.t('Settings')}</StepLabel></Step>
                            <Step><StepLabel>{I18n.t('Adapters')}</StepLabel></Step>
                            <Step><StepLabel>{I18n.t('Finish')}</StepLabel></Step>
                        </Stepper>
                    </Toolbar>
                </AppBar>
                {this.state.activeStep === 0 ? <div className={this.props.classes.tabPanel}>{this.renderWelcome()}</div> : null}
                {this.state.activeStep === 1 ? <div className={this.props.classes.tabPanel}>{this.renderLicense()}</div> : null}
                {this.state.activeStep === 2 ? <div className={this.props.classes.tabPanel}>{this.renderPassword()}</div> : null}
                {this.state.activeStep === 3 ? <div className={this.props.classes.tabPanel}>{this.renderAuthentication()}</div> : null}
                {this.state.activeStep === 4 ? <div className={this.props.classes.tabPanel}>{this.renderPortForwarding()}</div> : null}
                {this.state.activeStep === 5 ? <div className={this.props.classes.tabPanel}>{this.renderSettings()}</div> : null}
                {this.state.activeStep === 6 ? <div className={this.props.classes.tabPanel}>{this.renderAdapters()}</div> : null}
                {this.state.activeStep === 7 ? <div className={this.props.classes.tabPanel}>{this.renderFinish()}</div> : null}
            </DialogContent>
        </Dialog>;
    }
}

export default withWidth()(withStyles(styles)(WizardDialog));
