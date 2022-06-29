import React, { Component } from 'react';
import { withStyles } from '@mui/styles';
import PropTypes from 'prop-types';

import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Checkbox from '@mui/material/Checkbox';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid';
import FormControlLabel from '@mui/material/FormControlLabel';
import Toolbar from '@mui/material/Toolbar';
import {IconButton, Tooltip} from '@mui/material';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import AdaptersUpdater from '../components/Adapters/AdaptersUpdater';
import Command from '../components/Command';
import I18n from "@iobroker/adapter-react-v5/i18n";
import Utils from "@iobroker/adapter-react-v5/Components/Utils";
import LanguageIcon from "@mui/icons-material/Language";

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
            paddingLeft: theme.spacing(1),
            background: theme.name === 'blue' ? '#5d6467' : (theme.name === 'dark' ? '#5b5b5b' : '#FFF'),
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
        languageButton: {
            position: 'absolute',
            right: 73,
            top: 11
        },
        languageButtonActive: {
            color: theme.palette.primary.main
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
            debug: (window._localStorage || window.localStorage).getItem('AdaptersUpdaterDialog.debug') === 'true',
            stopOnError: (window._localStorage || window.localStorage).getItem('AdaptersUpdaterDialog.stopOnError') !== 'false',
            closeOnFinished: (window._localStorage || window.localStorage).getItem('AdaptersUpdaterDialog.closeOnFinished') === 'true',
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
                    {I18n.getLanguage() !== 'en' && this.props.toggleTranslation ? <IconButton
                        size="large"
                        className={Utils.clsx(this.props.classes.languageButton, this.props.noTranslation && this.props.classes.languageButtonActive)}
                        onClick={() => this.props.toggleTranslation()}
                        title={I18n.t('Disable/Enable translation')}
                    >
                        <LanguageIcon />
                    </IconButton> : null}
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
                                noTranslation={this.props.noTranslation}
                                onUpdateSelected={(selected, updateAvailable) => {
                                    if (updateAvailable) {
                                        this.updateAvailable = updateAvailable;
                                    }
                                    this.setState({ selected });
                                }}
                            />
                        </div>
                    </Grid>
                    {!!this.state.current && <Grid item style={{ height: '100%', overflow: 'hidden', width: 'calc(100% - 260px)', minWidth: 240 }}>
                        <Command
                            noSpacing
                            key={this.state.current}
                            ready
                            host={this.props.currentHost}
                            socket={this.props.socket}
                            t={this.props.t}
                            cmd={`upgrade ${this.state.current}@${this.state.currentVersion}${this.state.debug ? ' --debug' : ''}`}
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
                                (window._localStorage || window.localStorage).setItem('AdaptersUpdaterDialog.stopOnError', this.state.stopOnError ? 'false' : 'true');
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
                                (window._localStorage || window.localStorage).setItem('AdaptersUpdaterDialog.closeOnFinished', this.state.closeOnFinished ? 'false' : 'true');
                                this.setState({ closeOnFinished: !this.state.closeOnFinished });
                            }} />}
                        label={this.props.t('Close on finished')}
                    />
                    <FormControlLabel
                        control={<Checkbox
                            disabled={this.state.finished || this.state.inProcess}
                            checked={this.state.debug}
                            onChange={() => {
                                (window._localStorage || window.localStorage).setItem('AdaptersUpdaterDialog.debug', this.state.debug ? 'false' : 'true');
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
                <Button
                    variant="contained"
                    onClick={() => this.props.onClose(!!this.state.updated.length)}
                    disabled={this.state.inProcess}
                    color="grey"
                    startIcon={<CloseIcon />}
                >
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
    noTranslation: PropTypes.bool,
    toggleTranslation: PropTypes.func,
}

export default withStyles(styles)(AdaptersUpdaterDialog);
