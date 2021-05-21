import { createRef, Component } from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Paper from  '@material-ui/core/Paper';

import IconCloud from '@material-ui/icons/Public';
import IconCloudPro from '@material-ui/icons/Language';
import IconCheck from "@material-ui/icons/Check";

const TOOLBAR_HEIGHT = 64;

const styles = theme => ({
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
    title: {
        color: theme.palette.secondary.main,
    },
    form: {
        height: 'calc(100% - ' + (TOOLBAR_HEIGHT + theme.spacing(1)) + 'px)',
        overflow: 'auto',
    },
    input: {
        width: 400,
        marginBottom: theme.spacing(2)
    },
    grow: {
        flexGrow: 1,
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
        lineHeight: TOOLBAR_HEIGHT + 'px',
    },
    text: {
        fontSize: 16,
    },

    error: {
        fontSize: 24,
        color: '#c61f1f'
    },
    warning: {
        fontSize: 20,
        color: '#c6891f'
    },
    information: {
        fontSize: 18,
        color: '#429c1b'
    },
    button: {
        marginRight: theme.spacing(2),
    },
});

class WizardPortForwarding extends Component {
    constructor(props) {
        super(props);

        this.state = {
            auth: true,
            secure: false
        };

        this.focusRef = createRef();
    }

    componentDidMount() {
        this.focusRef.current && this.focusRef.current.focus();
    }

    render() {
        return <Paper className={ this.props.classes.paper }>
            <form className={ this.props.classes.form} noValidate autoComplete="off">
                <Grid container direction="column">
                    <Grid item>
                        <h2 className={ this.props.classes.title }>{ this.props.t('Important information about port forwarding') }</h2>
                    </Grid>
                    <Grid item>
                        {!this.props.auth ? <div className={this.props.classes.error}>{this.props.t('Warning!')}</div> : null}
                        {this.props.auth && !this.props.secure ? <div className={this.props.classes.warning}>{this.props.t('Be aware!')}</div> : null}
                        {this.props.auth && this.props.secure ? <div className={this.props.classes.information}>{this.props.t('Information')}</div> : null}

                        <div className={this.props.classes.text}>{this.props.t('Do not expose iobroker Admin or Web interfaces to the internet directly via the port forwarding!')}</div>
                    </Grid>
                    <Grid item style={{marginTop: 16}}>
                        <div className={this.props.classes.text}>{this.props.t('The Cloud services from iobroker.net/pro can help here to do that securely:')}</div>
                    </Grid>
                    <Grid item style={{marginTop: 16}}>
                        <Button
                            className={this.props.classes.button}
                            color="secondary"
                            variant="contained"
                            onClick={ () => window.open('https://iobroker.pro', 'help') }
                            startIcon={<IconCloudPro />}
                        >ioBroker.pro</Button>
                        <Button
                            color="secondary"
                            variant="contained"
                            onClick={ () => window.open('https://iobroker.net', 'help') }
                            startIcon={<IconCloud />}
                        >ioBroker.net</Button>
                    </Grid>
                </Grid>
            </form>
            <Toolbar className={ this.props.classes.toolbar }>
                <div className={ this.props.classes.grow }/>
                <Button color="primary" variant="contained" onClick={ () => this.props.onDone(this.state.password) } startIcon={<IconCheck/>}>{ this.props.t('Understand') }</Button>
            </Toolbar>
        </Paper>;
    }
}

WizardPortForwarding.propTypes = {
    auth: PropTypes.bool,
    secure: PropTypes.bool,
    t: PropTypes.func,
    socket: PropTypes.object,
    onDone: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(WizardPortForwarding));
