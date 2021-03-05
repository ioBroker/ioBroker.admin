import { createRef, Component } from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import Toolbar from '@material-ui/core/Toolbar';
import MenuItem from '@material-ui/core/MenuItem';
import Grid from '@material-ui/core/Grid';
import Select from '@material-ui/core/Select';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import IconWorld from '@material-ui/icons/Language';
import IconCheck from '@material-ui/icons/Check';
import IconCancel from '@material-ui/icons/Close';

import I18n from '@iobroker/adapter-react/i18n';
import LicenseTexts from './LicenseTexts';

const TOOLBAR_HEIGHT = 64;

const styles = theme => ({
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
    gridDiv: {
        height: 'calc(100% - ' + TOOLBAR_HEIGHT + 'px)',
        width: '100%',
        overflow: 'hidden',
        padding: theme.spacing(2),
        textAlign: 'center'
    },
    languageSelect: {
        minWidth: 200,
        marginRight: theme.spacing(3),
    },
    licenseDiv: {
        width: '100%',
        height: 'calc(100% - ' + (theme.mixins.toolbar.minHeight + theme.spacing(1) + 70) + 'px)',
        overflow: 'auto',
    },
    grow: {
        flexGrow: 1,
    },
    statAccept: {
        marginTop: 10,
        color: '#ff636e',
    },
    statAcceptDiv: {
        display: 'inline-block',
    },
    statAcceptNote: {
        textAlign: 'left',
        marginLeft: 32,
    },
    greenButton: {
        marginRight: theme.spacing(1),
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
        lineHeight: TOOLBAR_HEIGHT + 'px',
    },
    licenseTextDiv: {
        width: '100%',
        maxWidth: 600,
        textAlign: 'left',
    },
    licenseText: {
        marginBottom: 15,
    }
});

class WizardLicenseTab extends Component {
    constructor(props) {
        super(props);

        this.state = {
            statisticsAccepted: false,
            lang: this.props.lang,
            notAgree: false,
        };
        this.focusRef = createRef();
    }

    componentDidMount() {
        this.focusRef.current && this.focusRef.current.focus();
    }

    renderNotAgree() {
        if (!this.state.notAgree) {
            return null;
        }
        return <Dialog
            open={true}
            onClose={() => this.setState({ notAgree: false }) }
        >
            <DialogTitle >{ this.props.t('Message') }</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    <span role="img" aria-label="unhappy">😒</span> { this.props.t('Sorry, you cannot use ioBroker.')}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => this.setState({ notAgree: false }) } color="primary">
                    { I18n.t('Understand') }
                </Button>
            </DialogActions>
        </Dialog>
    }

    renderLicenseText() {
        let lines = LicenseTexts[I18n.getLanguage()] || LicenseTexts.en;
        lines = lines.split('\n');
        return <div className={this.props.classes.licenseTextDiv}>{lines.map((line, i) => <div className={this.props.classes.licenseText} key={i}>{line}</div>)}</div>;
    }

    render() {
        return <Paper className={ this.props.classes.paper }>
            <Grid container className={ this.props.classes.gridDiv } direction="column">
                <Grid item>
                    <FormControl className={ this.props.classes.languageSelect }>
                        <InputLabel><IconWorld/>{ this.props.t('Language') }</InputLabel>
                        <Select
                            value={ I18n.getLanguage() }
                            onChange={e => {
                                I18n.setLanguage(e.target.value);
                                this.setState( { lang: e.target.value });
                            }}
                        >
                            <MenuItem value="en">English</MenuItem>
                            <MenuItem value="de">Deutsch</MenuItem>
                            <MenuItem value="ru">русский</MenuItem>
                            <MenuItem value="pt">Portugues</MenuItem>
                            <MenuItem value="nl">Nederlands</MenuItem>
                            <MenuItem value="fr">français</MenuItem>
                            <MenuItem value="it">Italiano</MenuItem>
                            <MenuItem value="es">Espanol</MenuItem>
                            <MenuItem value="pl">Polski</MenuItem>
                            <MenuItem value="zh-cn">简体中文</MenuItem>
                        </Select>
                    </FormControl>
                    <div className={ this.props.classes.statAcceptDiv }>
                        <FormControlLabel
                            className={ this.props.classes.statAccept }
                            control={<Checkbox ref={ this.focusRef } checked={ this.state.statisticsAccepted } onChange={e => this.setState({statisticsAccepted: e.target.checked }) } />}
                            label={ this.props.t('I agree with the collection of anonymous statistics.') }
                        />
                        <div className={ this.props.classes.statAcceptNote }>{ this.props.t('(This can be disabled later in settings)') }</div>
                    </div>
                </Grid>
                <Grid item>
                    <h1>{ this.props.t('License terms') }</h1>
                </Grid>
                <Grid item className={ this.props.classes.licenseDiv }>
                    {this.renderLicenseText()}
                </Grid>
            </Grid>
            <Toolbar className={ this.props.classes.toolbar }>
                <div className={ this.props.classes.grow }/>
                <Button variant="contained" color="secondary" className={ this.props.classes.greenButton } disabled={ !this.state.statisticsAccepted } onClick={ () => this.props.onDone() }><IconCheck/>{ this.props.t('Agree') }</Button>
                <Button variant="contained" onClick={ () => this.setState({notAgree: true}) }><IconCancel/>{ this.props.t('Not agree') }</Button>
                <div className={ this.props.classes.grow }/>
            </Toolbar>
            { this.renderNotAgree() }
        </Paper>;
    }
}

WizardLicenseTab.propTypes = {
    t: PropTypes.func,
    socket: PropTypes.object,
    onDone: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(WizardLicenseTab));
