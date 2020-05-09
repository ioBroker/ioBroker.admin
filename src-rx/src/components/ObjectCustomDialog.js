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
import ObjectCustomEditor from './ObjectCustomEditor';
import ObjectChart from './ObjectChart';

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

export const EXTENSIONS = {
    images: ['png', 'jpg', 'svg', 'jpeg'],
    code:   ['js', 'json'],
    txt:    ['log', 'txt', 'html', 'css', 'xml'],
};

class ObjectCustomDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            allSaved: true,
            currentTab: 0,
        };

        if (this.props.objectIDs.length > 1) {
            Router.doNavigate('tab-objects', 'customs')
        } else {
            Router.doNavigate('tab-objects', 'customs', this.props.objectIDs[0]);
        }

        this.chartAvailable = this.isChartAvailable();
    }

    isChartAvailable() {
        let chartAvailable = this.props.objectIDs.length === 1;
        if (chartAvailable) {
            const id = this.props.objectIDs[0];
            if (this.props.objects[id] && this.props.objects[id].common && this.props.objects[id].common.custom && this.props.objects[id].common.custom) {
                chartAvailable = Object.keys(this.props.objects[id].common.custom).find(inst => {
                    const obj = this.props.objects['system.adapter.' + inst];
                    return obj && obj.common && obj.common.getHistory;
                });
            } else {
                chartAvailable = false;
            }
        }
        return chartAvailable;
    }

    renderCharts() {
        return <ObjectChart
            id={'chart-tabpanel' }
            t={ this.props.t }
            lang={ this.props.lang }
            expertMode={ this.props.expertMode }
            socket={ this.props.socket }
            obj={ this.props.objects[this.props.objectIDs[0]] }
            customsInstances={ this.props.customsInstances }
            theme={ this.props.theme }
            objects={ this.props.objects }
        />;
    }

    renderCustomEditor() {
        return <ObjectCustomEditor
            id={ 'custom-settings-tabpanel' }
            t={ this.props.t }
            lang={ this.props.lang }
            expertMode={ this.props.expertMode }
            socket={ this.props.socket }
            objectIDs={ this.props.objectIDs }
            customsInstances={ this.props.customsInstances }
            objects={ this.props.objects }
            onChange={ haveChanges => this.setState({ allSaved: !haveChanges }) }
        />;
    }

    render() {
        return <Dialog
            className={ this.props.classes.dialog }
            open={ true }
            onClose={ () => this.props.onClose() }
            fullWidth={ true }
            fullScreen={ true }
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">{
                this.props.objectIDs.length > 1 ?
                    this.props.t('Edit config for %s states', this.props.objectIDs.length) :
                    this.props.t('Edit config: %s', this.props.objectIDs[0])
            }</DialogTitle>
            <DialogContent className={ this.props.classes.content }>
                <AppBar position="static">
                    <Tabs value={ this.state.currentTab } onChange={(event, newTab) => this.setState({ currentTab: newTab })} aria-label="simple tabs example">
                        <Tab label={ this.props.t('Custom settings') } id={ 'custom-settings-tab' } aria-controls={ 'simple-tabpanel-0' } />
                        {this.chartAvailable ? <Tab label={ this.props.t('History data') }   id={ 'history-data-tab' } aria-controls={ 'simple-tabpanel-1' } /> : null}
                        {this.chartAvailable ? <Tab label={ this.props.t('Chart') } id={ 'chart-tab' } aria-controls={ 'simple-tabpanel-2' } /> : null}
                    </Tabs>
                </AppBar>
                {this.state.currentTab === 0 ? <div className={ this.props.classes.tabPanel }>{ this.renderCustomEditor() }</div>: null }
                {this.chartAvailable && this.state.currentTab === 2 ? <div className={ this.props.classes.tabPanel }>{ this.renderCharts() }</div>: null }
            </DialogContent>
            <DialogActions>
                <Button disabled={ !this.state.allSaved } onClick={() => this.props.onClose()} ><CloseIcon />{ this.props.t('Close') }</Button>
            </DialogActions>
        </Dialog>;
    }
}

ObjectCustomDialog.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    objects: PropTypes.object,
    socket: PropTypes.object,
    customsInstances: PropTypes.array,
    objectIDs: PropTypes.array,
    onClose: PropTypes.func,
};

export default withWidth()(withStyles(styles)(ObjectCustomDialog));
