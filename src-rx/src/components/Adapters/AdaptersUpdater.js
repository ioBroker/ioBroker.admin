import React, {Component} from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Semver from 'semver';
import clsx from 'clsx';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import {Avatar, CircularProgress} from '@material-ui/core';

const styles = theme => ({
    smallAvatar: {
        width: theme.spacing(3),
        height: theme.spacing(3)
    },
    listItem: {
        marginBottom: 2,
        background: theme.palette.background
    },
    toVersion: {
        color: '#008100',
        fontWeight: 'bold',
    },
    updateDone: {
        background: '#5ef05e80',
        opacity: 0.7,
    }
});

class AdaptersUpdater extends Component {
    constructor(props) {
        super(props);

        this.updateAvailable = this.detectUpdates();

        this.state = {
            current: this.props.current
        };

        this.currentRef = React.createRef();

        this.props.onUpdateSelected([...this.updateAvailable], this.updateAvailable);
    }

    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        if (nextProps.current !== this.state.current) {
            this.setState({current: nextProps.current});
            setTimeout(() =>
                this.currentRef.current?.scrollIntoView(), 200);
        }
    }

    static isUpdateAvailable(oldVersion, newVersion) {
        try {
            return Semver.gt(newVersion, oldVersion) === true;
        } catch (e) {
            console.warn(`Cannot compare "${newVersion}" and "${oldVersion}"`);
            return false;
        }
    }

    detectUpdates() {
        const updateAvailable = [];
        Object.keys(this.props.repository).forEach(adapter => {
            const _installed = this.props.installed[adapter];
            // ignore js-controller in this dialog
            if (adapter === 'js-controller') {
                return;
            }
            if (_installed &&
                _installed.ignoreVersion !== this.props.repository[adapter].version &&
                AdaptersUpdater.isUpdateAvailable(_installed.version, this.props.repository[adapter].version)
            ) {
                updateAvailable.push(adapter);
            }
        });

        updateAvailable.sort();

        return updateAvailable;
    }

    getNews(value) {
        const adapter   = this.props.repository[value];
        const installed = this.props.installed[value];
        const news = [];

        if (installed && adapter && adapter.news) {
            Object.keys(adapter.news).forEach(version => {
                try {
                    if (Semver.gt(version, installed.version)) {
                        news.push({
                            version: version,
                            news: adapter.news[version][this.props.lang] || adapter.news[version].en
                        });
                    }
                } catch (e) {
                    // ignore it
                    console.warn(`Cannot compare "${version}" and "${installed.version}"`);
                }
            });
        }

        return news;
    }

    renderOneAdapter(adapter) {
        const image = this.props.installed[adapter].localIcon;
        const checked = this.props.selected.includes(adapter);
        if ((this.props.finished || this.props.inProcess) && !checked) {
            return null;
        }

        return <React.Fragment key={adapter}>
            <ListItem
                key={adapter}
                dense
                classes={{root: clsx(this.props.classes.listItem, this.props.updated.includes(adapter) && this.props.classes.updateDone)}}
                ref={this.state.current === adapter && this.currentRef}
            >
                <ListItemIcon>
                    <Avatar
                        variant="square"
                        alt={adapter}
                        src={image}
                        className={this.props.classes.smallAvatar}
                    />
                </ListItemIcon>
                <ListItemText
                    primary={adapter}
                    title={this.getNews(adapter).map(item => item.version + ': ' + item.news).join('\n')}
                    secondary={<span>{this.props.installed[adapter].version} → <span className={this.props.classes.toVersion}>{this.props.repository[adapter].version}</span></span>}
                />
                {!this.props.finished && !this.props.inProcess && <ListItemSecondaryAction>
                    <Checkbox
                        edge="end"
                        checked={checked}
                        tabIndex={-1}
                        disableRipple
                        disabled={this.props.inProcess}
                        onClick={() => {
                            const selected = [...this.props.selected];
                            const pos = selected.indexOf(adapter);
                            if (pos !== -1) {
                                selected.splice(pos, 1);
                            } else {
                                selected.push(adapter);
                                selected.sort();
                            }
                            this.props.onUpdateSelected(selected);
                        }}
                    />
                </ListItemSecondaryAction>}
                {this.state.current === adapter && !this.props.stoppedOnError && !this.props.finished && <ListItemSecondaryAction>
                    <CircularProgress/>
                </ListItemSecondaryAction>}
            </ListItem>

        </React.Fragment>;
    }

    render() {
        return <List className={this.props.classes.root}>
            {this.updateAvailable.map(adapter => this.renderOneAdapter(adapter))}
        </List>;
    }
}

AdaptersUpdater.propTypes = {
    inProcess: PropTypes.bool.isRequired,
    lang: PropTypes.string.isRequired,
    t: PropTypes.func.isRequired,
    stoppedOnError: PropTypes.bool.isRequired,
    socket: PropTypes.object.isRequired,
    repository: PropTypes.object.isRequired,
    installed: PropTypes.object.isRequired,
    onUpdateSelected: PropTypes.func.isRequired,
    selected: PropTypes.array.isRequired,
    current: PropTypes.string.isRequired,
    updated: PropTypes.array.isRequired,
    finished: PropTypes.bool.isRequired,
}

export default withStyles(styles)(AdaptersUpdater);
