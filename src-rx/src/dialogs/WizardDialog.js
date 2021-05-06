import { Component } from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import clsx from 'clsx';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';

import ToggleThemeMenu from '../components/ToggleThemeMenu';

// Icons
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CheckIcon from '@material-ui/icons/Check';

import WizardPasswordTab from '../components/Wizard/WizardPasswordTab';
import WizardLicenseTab from '../components/Wizard/WizardLicenseTab';
import WizardFinishImage from '../assets/wizard-finish.jpg';
import WizardWelcomeImage from '../assets/wizard-welcome.jpg';
import WizardSettingsTab from '../components/Wizard/WizardSettingsTab';
import WizardAuthSSLTab from '../components/Wizard/WizardAuthSSLTab';
import WizardPortForwarding from '../components/Wizard/WizardPortForwarding';
import Logo from '../assets/logo.png';
import LongLogo from '../assets/longLogo.svg';
import Router from "@iobroker/adapter-react/Components/Router";

const TOOLBAR_HEIGHT = 64;

const styles = theme => ({
    dialog: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
    },
    paper: {
        width: '100%',
        height: '100%',
        overflow: 'hidden'
    },
    content: {
        textAlign: 'center',
    },
    tabPanel: {
        width: '100%',
        overflow: 'hidden',
        height: 'calc(100% - ' + 72 + 'px)',
    },
    fullHeightWithoutToolbar: {
        height: 'calc(100% - ' + TOOLBAR_HEIGHT + 'px)',
        width: '100%',
        overflow: 'auto',
    },
    finishBackground: {
        backgroundImage: 'url(' + WizardFinishImage + ')',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    },
    welcomeBackground: {
        backgroundImage: 'url(' + WizardWelcomeImage + ')',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    },
    grow: {
        flexGrow: 1,
    },
    playIcon: {
        marginLeft: theme.spacing(1),
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
    },
    logo: {
        width: 32,
        height: 32,
        float: 'right',
        borderRadius: '50%',
        background: 'white',
    },
    themeButton: {
        float: 'right',
        display: 'inline-block',
        marginTop: -1,
        marginRight: theme.spacing(1)
    },

    finalText: {
        fontSize: 48,
        marginTop: 80,
        color: '#265063',
        fontWeight: 'bold'
    },
    finalLongLogo: {
        width: 500,
    }
});

class WizardDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            exitAvailable: false,
            activeStep: 0,
            auth: false,
            secure: false,
        };
        this.adminInstance = null;

        this.password = '';

        this.lastPage = 1;
    }

    componentDidMount() {
        this.props.socket.getCurrentInstance()
            .then(namespace =>
                this.props.socket.getObject('system.adapter.' + namespace)
                    .then(obj => {
                        this.adminInstance = obj;
                        this.setState({auth: obj.native.auth, secure: obj.native.secure})
                    }));
    }

    renderWelcome() {
        // shutterstock Standard commercial license on ioBroker GmbH: https://www.shutterstock.com/de/image-vector/welcome-neon-text-vector-sign-design-1186433386
        return <div className={ clsx(this.props.classes.paper, this.props.classes.welcomeBackground) }>
            <div className={ this.props.classes.fullHeightWithoutToolbar }>

            </div>
            <Toolbar className={ this.props.classes.toolbar }>
                <div className={ this.props.classes.grow }/>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={ () =>
                        this.props.socket.getCompactSystemConfig(true)
                            .then(obj =>
                                this.setState( {activeStep: this.state.activeStep + 1 + (obj.common.licenseConfirmed ? 0 : 0) }))
                    }>
                    { this.props.t('Start wizard') } <PlayArrowIcon className={ this.props.classes.playIcon }/></Button>
                <div  className={ this.props.classes.grow }/>
            </Toolbar>
        </div>;
    }

    renderLicense() {
        return <WizardLicenseTab
            t={ this.props.t }
            socket={ this.props.socket }
            themeName={ this.props.themeName }
            onDone={ () => {
                this.props.socket.getSystemConfig(true)
                    .then(obj => {
                        obj.common.licenseConfirmed = true;
                        return this.props.socket.setSystemConfig(obj);
                    })
                    .then(() => this.setState( {activeStep: this.state.activeStep + 1 }));
            } }
        />;
    }

    renderPassword() {
        return <WizardPasswordTab
            t={ this.props.t }
            socket={ this.props.socket }
            themeName={ this.props.themeName }
            onDone={ pass =>
                this.props.socket.changePassword('admin', pass)
                    .then(() =>
                        this.setState( {activeStep: this.state.activeStep + 1 }))}
        />;
    }

    renderSettings() {
        return <WizardSettingsTab
            t={ this.props.t }
            socket={ this.props.socket }
            themeName={ this.props.themeName }
            onDone={settings =>
                this.props.socket.getSystemConfig(true)
                    .then(obj => {
                        Object.assign(obj.common, settings);
                        return this.props.socket.setSystemConfig(obj);
                    })
                    .then(() => this.setState({activeStep: this.state.activeStep + 1}))
            }
        />;
    }

    renderAuthentication() {
        return <WizardAuthSSLTab
            t={ this.props.t }
            auth={this.state.auth}
            secure={this.state.secure}
            socket={ this.props.socket }
            themeName={ this.props.themeName }
            onDone={settings =>
                this.setState(settings, () => this.setState({activeStep: this.state.activeStep + 1}))}
        />;
    }

    renderPortForwarding() {
        return <WizardPortForwarding
            t={ this.props.t }
            socket={ this.props.socket }
            themeName={ this.props.themeName }
            auth={this.state.auth}
            secure={this.state.secure}
            onDone={() =>
                this.setState({activeStep: this.state.activeStep + 1})}
        />;
    }

    async onClose() {
        // read if discovery is available
        const discovery = await this.props.socket.getState('system.adapter.discovery.0.alive');

        if (this.adminInstance) {
            let certPublic;
            let certPrivate;
            if (this.adminInstance.native.secure !== this.state.secure || this.adminInstance.native.auth !== this.state.auth) {
                if (this.state.secure && (!this.adminInstance.certPublic || !!this.adminInstance.certPrivate)) {
                    // get certificates
                    try {
                        const certs = await this.props.socket.getCertificates();
                        certPublic  = certs && certs.find(c => c.type === 'public');
                        certPrivate = certs && certs.find(c => c.type === 'private');
                    } catch (e) {
                        window.alert('Cannot read certificates: ' + e);
                    }
                }
                this.adminInstance.native.auth = this.state.auth;

                if (this.state.secure) {
                    if (!(this.adminInstance.native.certPublic  || certPublic) ||
                        !(this.adminInstance.native.certPrivate || certPrivate))
                    {
                        window.alert(this.props.t('Cannot enable authentication as no certificates found!'));
                        this.adminInstance.native.secure = false;

                        await this.props.socket.setObject(this.adminInstance._id, this.adminInstance);
                        setTimeout(() => window.location = `http://${window.location.host}/#tab-adapters${discovery ? '/discovery' : ''}`, 1000);
                        return this.props.onClose();
                    } else {
                        this.adminInstance.native.secure      = this.state.secure;
                        this.adminInstance.native.certPublic  = this.adminInstance.native.certPublic  || certPublic.name;
                        this.adminInstance.native.certPrivate = this.adminInstance.native.certPrivate || certPrivate.name;
                    }
                }

                await this.props.socket.setObject(this.adminInstance._id, this.adminInstance);

                // redirect to https or http
                setTimeout(() => {
                    if (this.adminInstance.native.secure) {
                        window.location = `https://${window.location.host}/#tab-adapters${discovery ? '/discovery' : ''}`;
                    } else {
                        window.location = `http://${window.location.host}/#tab-adapters${discovery ? '/discovery' : ''}`;
                    }
                }, 1000);

                this.props.onClose();
            } else {
                Router.doNavigate('tab-adapters', discovery ? 'discovery' : undefined);
                this.props.onClose();
            }
        } else {
            Router.doNavigate('tab-adapters', discovery ? 'discovery' : undefined);
            this.props.onClose();
        }
    }

    renderFinish() {
        // Free Image license: https://pixabay.com/illustrations/road-sky-mountains-clouds-black-908176/
        return <div className={ clsx(this.props.classes.paper, this.props.classes.finishBackground) }>
            <div className={ this.props.classes.fullHeightWithoutToolbar }>
                <div className={this.props.classes.finalText}>{this.props.t('Have fun automating your home with')}</div>
                <img src={LongLogo} alt="ioBroker" className={this.props.classes.finalLongLogo}/>
            </div>
            <Toolbar className={ this.props.classes.toolbar }>
                <div className={ this.props.classes.grow }/>
                <Button variant="contained" color="primary" onClick={ async () => await this.onClose() }><CheckIcon/>{ this.props.t('Finish') }</Button>
                <div className={ this.props.classes.grow }/>
            </Toolbar>
        </div>;
    }

    render() {
        return <Dialog
            className={ this.props.classes.dialog }
            open={ true }
            onClose={ () => {} }
            fullWidth={ true }
            fullScreen={ true }
            aria-labelledby="wizard-dialog-title"
        >
            <DialogTitle id="wizard-dialog-title">{ this.props.t('Initial ioBroker setup') } <img src={Logo} className={this.props.classes.logo} alt="logo"/><ToggleThemeMenu className={this.props.classes.themeButton} t={this.props.t} toggleTheme={this.props.toggleTheme} themeName={this.props.themeName} size="small"/></DialogTitle>
            <DialogContent className={ this.props.classes.content }>
                <AppBar position="static">
                    <Stepper activeStep={ this.state.activeStep }>
                        <Step><StepLabel>{ this.props.t('Welcome') }</StepLabel></Step>
                        <Step><StepLabel>{ this.props.t('License agreement') }</StepLabel></Step>
                        <Step><StepLabel>{ this.props.t('Password') }</StepLabel></Step>
                        <Step><StepLabel>{ this.props.t('Authentication') }</StepLabel></Step>
                        <Step><StepLabel>{ this.props.t('Port forwarding') }</StepLabel></Step>
                        <Step><StepLabel>{ this.props.t('Settings') }</StepLabel></Step>
                        <Step><StepLabel>{ this.props.t('Finish') }</StepLabel></Step>
                    </Stepper>
                </AppBar>
                {this.state.activeStep === 0 ? <div className={ this.props.classes.tabPanel }>{ this.renderWelcome()        }</div> : null }
                {this.state.activeStep === 1 ? <div className={ this.props.classes.tabPanel }>{ this.renderLicense()        }</div> : null }
                {this.state.activeStep === 2 ? <div className={ this.props.classes.tabPanel }>{ this.renderPassword()       }</div> : null }
                {this.state.activeStep === 3 ? <div className={ this.props.classes.tabPanel }>{ this.renderAuthentication() }</div> : null }
                {this.state.activeStep === 4 ? <div className={ this.props.classes.tabPanel }>{ this.renderPortForwarding() }</div> : null }
                {this.state.activeStep === 5 ? <div className={ this.props.classes.tabPanel }>{ this.renderSettings()       }</div> : null }
                {this.state.activeStep === 6 ? <div className={ this.props.classes.tabPanel }>{ this.renderFinish()         }</div> : null }
            </DialogContent>
        </Dialog>;
    }
}

WizardDialog.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    onClose: PropTypes.func,
    toggleTheme: PropTypes.func,
    themeName: PropTypes.string,
};

export default withWidth()(withStyles(styles)(WizardDialog));
