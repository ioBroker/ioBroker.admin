import React from 'react';
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
import clsx from 'clsx';


import I18n from '@iobroker/adapter-react/i18n';

const styles = theme => ({
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        padding: theme.spacing(2),
    },
    gridDiv: {
        height: 'calc(100% - ' + (theme.mixins.toolbar.minHeight + theme.spacing(1)) + 'px)',
        width: '100%',
        overflow: 'hidden',
        padding: theme.spacing(2),
    },
    languageSelect: {
        minWidth: 200,
        marginRight: theme.spacing(3),
    },
    licenseDiv: {
        width: '100%',
        height: 'calc(100% - ' + (theme.mixins.toolbar.minHeight + theme.spacing(1) + 70) + 'px)',
        overflow: 'auto'
    },
    statAccept: {
        marginTop: 10,
    },
    statAcceptDiv: {
        display: 'inline-block',
    },
    statAcceptNote: {
        textAlign: 'left',
        marginLeft: 32,
    }
});

class WizardLicenseTab extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            statisticsAccepted: false,
            lang: this.props.lang,
            notAgree: false,
        };
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
                    😒 { this.props.t('Sorry, you cannot use ioBroker.')}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => this.setState({ notAgree: false }) } color="primary">
                    { I18n.t('Understand') }
                </Button>
            </DialogActions>
        </Dialog>
    }

    render() {
        return <Paper className={ this.props.classes.paper }>
            <Grid container className={ this.props.classes.gridDiv }>
                <Grid item>
                    <FormControl className={ this.props.classes.languageSelect }>
                        <InputLabel>{ this.props.t('Language') }</InputLabel>
                        <Select
                            value={ I18n.getLanguage() }
                            onChange={e => {
                            I18n.setLanguage(e.target.value);
                            this.setState( { lang: e.target.value });
                        }}>
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
                            control={<Checkbox checked={ this.state.statisticsAccepted } onChange={e => this.setState({statisticsAccepted: e.target.checked }) } />}
                            label={ this.props.t('I agree with the collection of anonymous statistics.') }
                        />
                        <div className={ this.props.classes.statAcceptNote }>{ this.props.t('(This can be disabled later in settings)') }</div>
                    </div>
                </Grid>
                <Grid item className={ this.props.classes.licenseDiv }>
                    This is a very long license
                </Grid>
            </Grid>
            <Toolbar>
                <Button disabled={ !this.props.statisticsAccepted } onClick={ () => this.props.onDone() }>{ this.props.t('Agree') }</Button>
                <Button onClick={ () => this.setState({notAgree: true}) }>{ this.props.t('Not agree') }</Button>
            </Toolbar>
        </Paper>;
    }
}

WizardLicenseTab.propTypes = {
    t: PropTypes.func,
    socket: PropTypes.object,
    onDone: PropTypes.string.isRequired,
};

export default withWidth()(withStyles(styles)(WizardLicenseTab));
