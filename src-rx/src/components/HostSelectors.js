import React, { Component } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import { Tooltip, withStyles } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import I18n from '@iobroker/adapter-react/i18n';
import Icon from '@iobroker/adapter-react/Components/Icon';
import Utils from '@iobroker/adapter-react/Components/Utils';

const styles = theme => ({
    img: {
        width: 30,
        height: 30,
        margin: 'auto 0',
        position: 'relative',
        marginRight: 10,
        borderRadius: 3,
        background: '#FFFFFF',
        padding: 2,
        '&:after': {
            content: '""',
            position: 'absolute',
            zIndex: 2,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'url("img/no-image.png") 100% 100% no-repeat',
            backgroundSize: 'cover',
            backgroundColor: '#fff',
        }
    },
    notAlive: {
        opacity: 0.3
    },
    button: {
        maxWidth: 300,
    },
    name: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    width: {
        width: '100%'
    },
    '@media screen and (max-width: 710px)': {
        name: {
            display: 'none'
        },
        width: {
            width: 'auto'
        },
        imgButton: {
            marginRight: 0,
        }
    },
});

class HostSelectors extends Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null,
            alive: {},
            hosts: [],
        };
    }

    componentDidMount() {
        this.props.socket.getCompactHosts()
            .then(hosts => {
                this.setState({hosts}, () => {
                    this.props.hostsWorker.registerHandler(this.onHostsObjectChange);
                    this.props.hostsWorker.registerAliveHandler(this.onAliveChanged);
                });
            })
            .catch(e => {
                window.alert('Cannot get hosts: ' + e);
            });
    }

    componentWillUnmount() {
        this.props.hostsWorker.unregisterHandler(this.onHostsObjectChange);
        this.props.hostsWorker.unregisterAliveHandler(this.onAliveChanged);
    }

    onAliveChanged = events => {
        const alive = JSON.parse(JSON.stringify(this.state.alive));
        let changed = false;
        events.forEach(event => {
            if (event.type === 'delete') {
                if (alive[event.id] !== undefined) {
                    delete alive[event.id];
                    changed = true;
                }
            } else if ((!!alive[event.id]) !== (!!event.alive)) {
                alive[event.id] = event.alive;
                changed = true;
            }
        });

        changed && this.setState({alive});
    };

    onHostsObjectChange = events => {
        const hosts = JSON.parse(JSON.stringify(this.state.hosts));
        let changed = false;
        events.forEach(event => {
            const host = hosts.find(it => it._id === event.id);
            if (event.type === 'delete' || !event.obj) {
                if (host) {
                    const pos = hosts.indexOf(host);
                    hosts.splice(pos);
                    changed = true;
                }
            } else {
                if (host) {
                    if (host.common.name !== event.obj.common?.name) {
                        host.common.name  = event.obj.common?.name  || '';
                        changed = true;
                    }
                    if (host.common.color !== event.obj.common?.color) {
                        host.common.color  = event.obj.common?.color  || '';
                        changed = true;
                    }
                    if (host.common.icon !== event.obj.common?.icon) {
                        host.common.icon  = event.obj.common?.icon  || '';
                        changed = true;
                    }
                } else {
                    changed = true;
                    hosts.push({
                        _id: event.id,
                        common: {
                            name: event.obj.common?.name   || '',
                            color: event.obj.common?.color || '',
                            icon: event.obj.common?.icon   || '',
                        }
                    });
                }
            }
        });
        changed && this.setState({hosts});
    };

    render() {
        if (!this.props.expertMode && this.state.hosts.length < 2) {
            return null;
        }
        let selectedHostObj;
        if (this.state.hosts.length) {
            selectedHostObj = this.state.hosts.find(host => host._id === this.props.currentHost);
        }

        return <div>
            <Tooltip title={I18n.t('Change current host')}>
                <div>
                    <Button
                        className={this.props.classes.button}
                        style={{
                            background: selectedHostObj?.common?.color || 'none',
                            borderColor: selectedHostObj?.common?.color ? Utils.invertColor(selectedHostObj.common.color) : 'none'
                        }}
                        variant={this.props.disabled || this.state.hosts.length < 2 ? 'text' : 'outlined'}
                        disabled={this.props.disabled || this.state.hosts.length < 2}
                        aria-haspopup="true"
                        onClick={e => this.setState({anchorEl: e.currentTarget})}
                    >
                        <div
                            className={clsx(this.props.classes.width, !this.state.alive[this.props.currentHost] && this.props.classes.notAlive)}
                            style={{
                                display: 'flex',
                                color: selectedHostObj?.common?.color ? Utils.invertColor(selectedHostObj.common.color, true) : 'none',
                                alignItems: 'center',
                            }}>
                            <Icon
                                className={clsx(this.props.classes.img, this.props.classes.imgButton)}
                                src={selectedHostObj?.common?.icon || 'img/no-image.png'}
                            />
                            <div className={this.props.classes.name}>{selectedHostObj?.common?.name}</div>

                        </div>
                    </Button>
                </div>
            </Tooltip>
            <Menu
                anchorEl={this.state.anchorEl}
                keepMounted
                open={!!this.state.anchorEl}
                onClose={() => this.setState({anchorEl: null})}
            >
                {this.state.hosts.map(({ _id, common: { name, icon, color } }, idx) =>
                    <MenuItem
                        key={_id}
                        button
                        disabled={!this.state.alive[_id]}
                        selected={_id === this.props.currentHost}
                        style={{ background: color || 'inherit' }}
                        onClick={el => {
                            if (this.props.currentHost !== this.state.hosts[idx]._id) {
                                this.props.setCurrentHost(this.state.hosts[idx].common.name, this.state.hosts[idx]._id);
                            }
                            this.setState({anchorEl: null});
                        }}>
                        <div style={{
                            display: 'flex',
                            color: (color && Utils.invertColor(color, true)) || 'inherit',
                            alignItems: 'center',
                        }}>
                            <Icon
                                className={this.props.classes.img}
                                src={icon || 'img/no-image.png'}
                            />
                            {name}
                        </div>
                    </MenuItem>
                )}
            </Menu>
        </div>;
    }
}

HostSelectors.propTypes = {
    disabled: PropTypes.bool,
    socket: PropTypes.object,
    currentHost: PropTypes.string.isRequired,
    hostsWorker: PropTypes.object,
    expertMode: PropTypes.bool,
    setCurrentHost: PropTypes.func.isRequired,
    t: PropTypes.func,
    lang: PropTypes.string,
};

export default withStyles(styles)(HostSelectors);