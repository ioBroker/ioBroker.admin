import { createRef, Component } from 'react';
import { withStyles } from '@mui/styles';
import PropTypes from 'prop-types';

import Grid from '@mui/material/Grid';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Paper from  '@mui/material/Paper';

import IconCloud from '@mui/icons-material/Public';
import IconCloudPro from '@mui/icons-material/Language';
import IconCheck from '@mui/icons-material/Check';

import withWidth from '@iobroker/adapter-react-v5/Components/withWidth';

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
        height: `calc(100% - ${TOOLBAR_HEIGHT + parseInt(theme.spacing(1), 10)}px)`,
        overflow: 'auto',
    },
    input: {
        width: 400,
        marginBottom: theme.spacing(2),
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
        marginRight: theme.spacing(2),
    },
});

class WizardPortForwarding extends Component {
    constructor(props) {
        super(props);

        this.focusRef = createRef();
    }

    componentDidMount() {
        this.focusRef.current && this.focusRef.current.focus();
    }

    render() {
        return <Paper className={this.props.classes.paper}>
            <form className={this.props.classes.form} noValidate autoComplete="off">
                <Grid container direction="column">
                    <Grid item>
                        <h2 className={this.props.classes.title}>{this.props.t('Important information about port forwarding')}</h2>
                    </Grid>
                    <Grid item>
                        {!this.props.auth ? <div className={this.props.classes.error}>{this.props.t('Warning!')}</div> : null}
                        {this.props.auth && !this.props.secure ? <div className={this.props.classes.warning}>{this.props.t('Be aware!')}</div> : null}
                        {this.props.auth && this.props.secure ? <div className={this.props.classes.information}>{this.props.t('Information')}</div> : null}

                        <div className={this.props.classes.text}>{this.props.t('Do not expose iobroker Admin or Web interfaces to the internet directly via the port forwarding!')}</div>
                    </Grid>
                    <Grid item style={{ marginTop: 16 }}>
                        <div className={this.props.classes.text}>{this.props.t('The Cloud services from iobroker.net/pro can help here to do that securely:')}</div>
                    </Grid>
                    <Grid item style={{ marginTop: 16 }}>
                        <Button
                            className={this.props.classes.button}
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
                    </Grid>
                </Grid>
            </form>
            <Toolbar className={this.props.classes.toolbar}>
                <div className={this.props.classes.grow} />
                <Button
                    color="primary"
                    variant="contained"
                    onClick={() => this.props.onDone()}
                    startIcon={<IconCheck />}
                >
                    {this.props.t('Understand')}
                </Button>
            </Toolbar>
        </Paper>;
    }
}

WizardPortForwarding.propTypes = {
    auth: PropTypes.bool,
    secure: PropTypes.bool,
    t: PropTypes.func,
    onDone: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(WizardPortForwarding));
