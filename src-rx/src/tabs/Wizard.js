import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import Router from '@iobroker/adapter-react/Components/Router';

// Icons
import CloseIcon from '@material-ui/icons/Close';
import WizardPasswordTab from '../components/WizardPasswordTab';
import WizardLicenseTab from '../components/WizardLicenseTab';

const styles = theme => ({
    dialog: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
    },
    content: {
        textAlign: 'center',
    },
    tabPanel: {
        width: '100%',
        overflow: 'hidden',
        height: 'calc(100% - ' + theme.mixins.toolbar.minHeight + 'px)',
    }
});

class Wizard extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            exitAvailable: false,
            currentTab: 0,
        };

        this.password = '';

        this.lastPage = 1;
    }

    renderPassword() {
        return <WizardPasswordTab
            id={'wizard-password-tabpanel' }
            t={ this.props.t }
            socket={ this.props.socket }
            themeName={ this.props.themeName }
            onPasswordChange={ pass => this.password = pass }
        />;
    }
    renderLicense() {
        return <WizardLicenseTab
            id={'wizard-license-tabpanel' }
            t={ this.props.t }
            socket={ this.props.socket }
            themeName={ this.props.themeName }
            onAccept={ () => this.setState( {currentTab: this.setState.currentTab + 1 }) }
        />;
    }

    render() {
        return <Dialog
            className={ this.props.classes.dialog }
            open={ true }
            onClose={ () => this.props.onClose() }
            fullWidth={ true }
            fullScreen={ true }
            aria-labelledby="wizard-dialog-title"
        >
            <DialogTitle id="wizard-dialog-title">{ this.props.t('Initial setup') }</DialogTitle>
            <DialogContent className={ this.props.classes.content }>
                <AppBar position="static">
                    <Tabs value={ this.state.currentTab } onChange={(event, newTab) => {
                        Router.doNavigate(null, null, null, newTab === 1 ? 'wizard-1' : '');
                        this.setState({ currentTab: newTab });
                    }} >
                        <Tab label={ this.props.t('License')  } id={ 'wizard-license-tab'  } />
                        <Tab label={ this.props.t('Password') } id={ 'wizard-password-tab' } />
                    </Tabs>
                </AppBar>
                {this.state.currentTab === 0 ? <div className={ this.props.classes.tabPanel }>{ this.renderLicense()  }</div>: null }
                {this.state.currentTab === 1 ? <div className={ this.props.classes.tabPanel }>{ this.renderPassword() }</div>: null }
            </DialogContent>
            <DialogActions>
                { this.state.currentTab !== this.lastPage ? <Button disabled={ !this.state.allSaved } onClick={() => this.props.onClose()} ><CloseIcon />{ this.props.t('Next') }</Button> : null }
                { this.state.currentTab !== 0 ? <Button disabled={ !this.state.allSaved } onClick={() => this.props.onClose()} ><CloseIcon />{ this.props.t('Previous') }</Button> : null }
                <Button disabled={ this.state.currentTab !== this.lastPage } onClick={() => this.props.onClose()} ><CloseIcon />{ this.props.t('Finish') }</Button>
            </DialogActions>
        </Dialog>;
    }
}

Wizard.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    onClose: PropTypes.func,
};

export default withWidth()(withStyles(styles)(Wizard));
