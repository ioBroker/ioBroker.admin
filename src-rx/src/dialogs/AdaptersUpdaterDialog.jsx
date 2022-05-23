import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Checkbox from '@material-ui/core/Checkbox';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import Grid from '@material-ui/core/Grid';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Toolbar from '@material-ui/core/Toolbar';
import { Tooltip } from '@material-ui/core';

import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';

import AdaptersUpdater from '../components/Adapters/AdaptersUpdater';
import Command from '../components/Command';

const styles = theme => {
    return ({
        dialogRoot: {
            height: 'calc(100% - 64px)',
        },
        wrapperHead: {
            justifyContent: 'space-between',
            display: 'flex'
        },
        checkbox: {
            marginRight: 10
        },
        appBar: {
            flexWrap: 'wrap',
            position: 'sticky',
            bottom: -10,
            background: theme.name === "blue" ? '#3e454a' : theme.name === "dark" ? '#3b3b3b' : 'white'
        },
        container:{
            overflow: 'hidden',
            height: 'calc(100% - 48px)'
        },
        '@media screen and (max-width: 602px)': {
            container: {
                height: 'auto'
            }
        },
        '@media screen and (max-width: 500px)': {
            content: {
                padding: 8
            }
        },
    })
};

class AdaptersUpdaterDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selected: [],
            inProcess: false,
            finished: false,
            current: '',
            updated: [],
            stoppedOnError: false,
            debug: window.localStorage.getItem('AdaptersUpdaterDialog.debug') === 'true',
            stopOnError: window.localStorage.getItem('AdaptersUpdaterDialog.stopOnError') !== 'false',
            closeOnFinished: window.localStorage.getItem('AdaptersUpdaterDialog.closeOnFinished') === 'true',
        };

        this.updateAvailable = [];
    }

    updateAdapter(adapter, version, cb) {
        this.onAdapterFinished = cb;
        this.setState({ current: adapter, currentVersion: version });
    }

    onStartUpdate() {
        this.setState({ inProcess: true }, () => {
            this.props.onSetCommandRunning(true);
            this.processList = [...this.state.selected];
            this.processList = this.processList.map(adapter => ({adapter, version: this.props.repository[adapter]?.version}));

            this.updateAdapters(() => {
                this.setState({ inProcess: false, finished: true }, () => {
                    this.props.onSetCommandRunning(false);
                    if (this.state.closeOnFinished) {
                        this.props.onClose(!!this.state.updated.length);
                    } else {
                        // update adapters and so on
                    }
                });
            });
        });
    }

    updateAdapters(cb) {
        if (!this.processList || !this.processList.length) {
            cb && cb();
        } else {
            const {adapter, version} = this.processList.shift();

            this.updateAdapter(adapter, version, () => {
                const updated = [...this.state.updated];
                updated.push(adapter);
                this.setState({ updated }, () =>
                    setTimeout(() => this.updateAdapters(cb), 200));
            });
        }
    }

    render() {
        return <Dialog
            open={true}
            maxWidth="lg"
            fullWidth={!!this.state.current}
            onClose={() => this.props.onClose(!!this.state.updated.length)}
            aria-labelledby="update-dialog-title"
            aria-describedby="update-dialog-description"
            classes={{ paper: this.props.classes.dialogRoot }}
            scroll="paper"
        >
            <DialogTitle id="update-dialog-title">
                <div className={this.props.classes.wrapperHead}>
                    {this.props.t('Update %s adapter(s)', this.state.selected.length)}
                    {!this.state.finished && !this.state.inProcess && <Tooltip title={this.props.t('Select/Unselect all')}><Checkbox
                        checked={this.state.selected.length === this.updateAvailable.length}
                        className={this.props.classes.checkbox}
                        tabIndex={-1}
                        indeterminate={this.state.selected.length !== this.updateAvailable.length && this.state.selected.length !== 0}
                        disableRipple
                        onClick={() => {
                            let selected = [];
                            if (this.state.selected.length !== this.updateAvailable.length) {
                                selected = [...this.updateAvailable];
                            }
                            this.setState({ selected });
                        }}
                    /></Tooltip>}
                </div>
            </DialogTitle>
            <DialogContent classes={{ root: this.props.classes.content }} style={{ height: '100%' }}>
                <Grid container direction="row" className={this.props.classes.container}>
                    <Grid item style={{ height: '100%', overflow: 'hidden', width: this.state.current ? 250 : '100%' }}>
                        <div style={{ height: '100%', overflow: 'auto' }}>
                            <AdaptersUpdater
                                t={this.props.t}
                                finished={this.state.finished}
                                inProcess={this.state.inProcess}
                                selected={this.state.selected}
                                current={this.state.current}
                                stoppedOnError={this.state.stoppedOnError}
                                updated={this.state.updated}
                                lang={this.props.lang}
                                socket={this.props.socket}
                                installed={this.props.installed}
                                repository={this.props.repository}
                                onUpdateSelected={(selected, updateAvailable) => {
                                    if (updateAvailable) {
                                        this.updateAvailable = updateAvailable;
                                    }
                                    this.setState({ selected });
                                }} />
                        </div>
                    </Grid>
                    {!!this.state.current && <Grid item style={{ height: '100%', overflow: 'hidden', width: 'calc(100% - 260px)', minWidth: 240 }}>
                        <Command
                            noSpacing={true}
                            key={this.state.current}
                            ready={true}
                            currentHost={this.props.currentHost}
                            socket={this.props.socket}
                            t={this.props.t}
                            cmd={'upgrade ' + this.state.current + '@' + this.state.currentVersion + (this.state.debug ? ' --debug' : '')}
                            onFinished={() => this.onAdapterFinished()}
                            errorFunc={() => {
                                if (this.state.stopOnError) {
                                    this.setState({ stoppedOnError: true, finished: true });
                                    this.onAdapterFinished = null;
                                    this.props.onSetCommandRunning(false);
                                } else {
                                    this.onAdapterFinished();
                                }
                            }}
                        />
                    </Grid>}
                </Grid>
                <Toolbar variant="dense" disableGutters className={this.props.classes.appBar}>
                    <FormControlLabel
                        control={<Checkbox
                            disabled={this.state.finished}
                            checked={this.state.stopOnError}
                            onChange={() => {
                                window.localStorage.setItem('AdaptersUpdaterDialog.stopOnError', this.state.stopOnError ? 'false' : 'true');
                                this.setState({ stopOnError: !this.state.stopOnError });
                            }}
                        />}
                        label={this.props.t('Stop on error')}
                    />
                    <FormControlLabel
                        control={<Checkbox
                            disabled={this.state.finished}
                            checked={this.state.closeOnFinished}
                            onChange={() => {
                                window.localStorage.setItem('AdaptersUpdaterDialog.closeOnFinished', this.state.closeOnFinished ? 'false' : 'true');
                                this.setState({ closeOnFinished: !this.state.closeOnFinished });
                            }} />}
                        label={this.props.t('Close on finished')}
                    />
                    <FormControlLabel
                        control={<Checkbox
                            disabled={this.state.finished || this.state.inProcess}
                            checked={this.state.debug}
                            onChange={() => {
                                window.localStorage.setItem('AdaptersUpdaterDialog.debug', this.state.debug ? 'false' : 'true');
                                this.setState({ debug: !this.state.debug });
                            }} />}
                        label={this.props.t('Debug info')}
                    />
                </Toolbar>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={this.state.stoppedOnError || this.state.inProcess || this.state.finished || !this.state.selected.length}
                    onClick={() => this.onStartUpdate()}
                    color="primary"
                    autoFocus
                    startIcon={<CheckIcon/>}
                >
                    {this.props.t('Update')}
                </Button>
                <Button variant="contained" onClick={() => this.props.onClose(!!this.state.updated.length)} disabled={this.state.inProcess}
                        startIcon={<CloseIcon />}>
                    {this.props.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

AdaptersUpdaterDialog.propTypes = {
    currentHost: PropTypes.string.isRequired,
    lang: PropTypes.string.isRequired,
    t: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    repository: PropTypes.object.isRequired,
    installed: PropTypes.object.isRequired,
    onSetCommandRunning: PropTypes.func.isRequired,
}

export default withStyles(styles)(AdaptersUpdaterDialog);
