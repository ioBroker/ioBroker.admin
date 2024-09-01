import React, { Component } from 'react';

import {
    Box,
    Button,
    Menu,
    MenuItem,
    Tooltip,
} from '@mui/material';

import {
    type AdminConnection, I18n, Icon, Utils,
} from '@iobroker/adapter-react-v5';
import type { CompactHost } from '@/types';
import type HostsWorker from '@/Workers/HostsWorker';
import { type HostEvent, type HostAliveEvent } from '@/Workers/HostsWorker';

const styles: Record<string, any> = {
    imgDiv: {
        '& svg:after': {
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
        },
        '& img:after': {
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
        },
        '@media screen and (max-width: 710px)': {
            '& img,svg': {
                marginRight: 0,
            },
        },
    },
    img: {
        width: 30,
        height: 30,
        margin: 'auto 0',
        position: 'relative',
        marginRight: 10,
        borderRadius: 3,
        background: '#FFFFFF',
        padding: 2,
    },
    notAlive: {
        opacity: 0.3,
    },
    button: {
        maxWidth: 300,
    },
    name: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        '@media screen and (max-width: 710px)': {
            display: 'none',
        },
    },
    width: {
        width: '100%',
        '@media screen and (max-width: 710px)': {
            width: 'auto',
        },
    },
    selector: {
        width: 15,
        display: 'inline-block',
    },
    tooltip: {
        pointerEvents: 'none',
    },
};

interface HostSelectorsProps {
    disabled?: boolean;
    socket: AdminConnection;
    currentHost: string;
    hostsWorker: InstanceType<typeof HostsWorker>;
    expertMode: boolean;
    setCurrentHost: (hostname: string, aliveHost: string) => void;
    tooltip: string;
    themeType?: string;
}

interface HostSelectorsState {
    anchorEl: any;
    alive: Record<string, boolean>;
    hosts: CompactHost[];
}

class HostSelectors extends Component<HostSelectorsProps, HostSelectorsState> {
    constructor(props: HostSelectorsProps) {
        super(props);

        this.state = {
            anchorEl: null,
            alive: {},
            hosts: [],
        };
    }

    componentDidMount() {
        this.props.socket
            .getCompactHosts(true)
            .then((hosts: CompactHost[]) => {
                this.setState({ hosts }, async () => {
                    // request for all host the "alive" status
                    const alive: Record<string, boolean> = {};
                    for (let h = 0; h < hosts.length; h++) {
                        const state = await this.props.socket.getState(`${hosts[h]._id}.alive`);
                        if (state) {
                            alive[hosts[h]._id] = !!state.val;
                        } else {
                            alive[hosts[h]._id] = false;
                        }
                    }

                    // if the current host is not alive, find the first alive host and set it as current
                    if (!alive[this.props.currentHost]) {
                        const aliveHost = Object.keys(alive).find(id => alive[id]);
                        if (aliveHost) {
                            setTimeout(() => {
                                const obj = this.state.hosts.find(ob => ob._id === aliveHost);
                                if (obj) {
                                    this.props.setCurrentHost(
                                        obj.common?.name || aliveHost.replace('system.host.', ''),
                                        aliveHost,
                                    );
                                } else {
                                    this.props.setCurrentHost(aliveHost.replace('system.host.', ''), aliveHost);
                                }
                            }, 100);
                        }
                    }

                    this.setState({ alive }, () => {
                        this.props.hostsWorker.registerHandler(this.onHostsObjectChange);
                        this.props.hostsWorker.registerAliveHandler(this.onAliveChanged);
                    });
                });
            })
            .catch((e: any) => {
                window.alert(`Cannot get hosts: ${e}`);
            });
    }

    componentWillUnmount() {
        this.props.hostsWorker.unregisterHandler(this.onHostsObjectChange);
        this.props.hostsWorker.unregisterAliveHandler(this.onAliveChanged);
    }

    onAliveChanged = (events: HostAliveEvent[]) => {
        const alive: Record<string, boolean> = JSON.parse(JSON.stringify(this.state.alive));
        let changed = false;
        events.forEach(event => {
            if (event.type === 'deleted') {
                if (alive[event.id] !== undefined) {
                    delete alive[event.id];
                    changed = true;
                }
            } else if (!!alive[event.id] !== !!event.alive) {
                alive[event.id] = event.alive;
                changed = true;
            }
        });

        if (changed) {
            this.setState({ alive }, () => {
                if (!alive[this.props.currentHost]) {
                    const aliveHost = Object.keys(alive).find(id => alive[id]);
                    if (aliveHost) {
                        const obj = this.state.hosts.find(ob => ob._id === aliveHost);
                        if (obj) {
                            this.props.setCurrentHost(
                                obj.common?.name || aliveHost.replace('system.host.', ''),
                                aliveHost,
                            );
                        } else {
                            this.props.setCurrentHost(aliveHost.replace('system.host.', ''), aliveHost);
                        }
                    }
                }
            });
        }
    };

    onHostsObjectChange = (events: HostEvent[]) => {
        const hosts: CompactHost[] = JSON.parse(JSON.stringify(this.state.hosts));
        const alive: Record<string, boolean> = JSON.parse(JSON.stringify(this.state.alive));
        let changed = false;

        Promise.all(
            events.map(async event => {
                const host = hosts.find(it => it._id === event.id);

                if (event.type === 'deleted' || !event.obj) {
                    if (host) {
                        const pos = hosts.indexOf(host);
                        if (pos !== -1) {
                            delete alive[event.id];
                            hosts.splice(pos);
                            changed = true;
                        }
                    }
                } else if (host) {
                    if (host.common.name !== event.obj.common?.name) {
                        host.common.name = event.obj.common?.name || '';
                        changed = true;
                    }
                    if (host.common.color !== event.obj.common?.color) {
                        host.common.color = event.obj.common?.color || '';
                        changed = true;
                    }
                    if (host.common.icon !== event.obj.common?.icon) {
                        host.common.icon = event.obj.common?.icon || '';
                        changed = true;
                    }
                } else {
                    // new host detected
                    changed = true;
                    hosts.push({
                        _id: event.id as ioBroker.ObjectIDs.Host,
                        common: {
                            name: event.obj.common?.name || '',
                            color: event.obj.common?.color || '',
                            icon: event.obj.common?.icon || '',
                            installedVersion: 'ignored',
                        },
                        native: {
                            hardware: {
                                networkInterfaces: {},
                            },
                        },
                    });

                    const state = await this.props.socket.getState(`${event.id}.alive`);
                    alive[event.id] = !!state?.val;
                }
            }),
        )
            .then(() => {
                if (changed) {
                    this.setState({ hosts, alive }, () => {
                        if (!alive[this.props.currentHost]) {
                            const aliveHost = Object.keys(alive).find(id => alive[id]);
                            if (aliveHost) {
                                const obj = this.state.hosts.find(ob => ob._id === aliveHost);
                                if (obj) {
                                    this.props.setCurrentHost(
                                        obj.common?.name || aliveHost.replace('system.host.', ''),
                                        aliveHost,
                                    );
                                } else {
                                    this.props.setCurrentHost(aliveHost.replace('system.host.', ''), aliveHost);
                                }
                            }
                        }
                    });
                }
            });
    };

    render() {
        if (!this.props.expertMode && this.state.hosts.length < 2) {
            return null;
        }
        let selectedHostObj;
        if (this.state.hosts.length) {
            selectedHostObj = this.state.hosts.find(
                host => host._id === this.props.currentHost || host._id === `system.host.${this.props.currentHost}`,
            );
        }

        return <Box>
            <Tooltip
                title={this.props.tooltip || I18n.t('Change current host')}
                slotProps={{ popper: { sx: styles.tooltip } }}
            >
                <span>
                    <Button
                        color={this.props.themeType === 'dark' ? 'primary' : 'secondary'}
                        style={{
                            ...styles.button,
                            background: selectedHostObj?.common?.color || 'none',
                            borderColor: selectedHostObj?.common?.color
                                ? Utils.invertColor(selectedHostObj.common.color, false)
                                : 'none',
                        }}
                        variant={this.props.disabled || this.state.hosts.length < 2 ? 'text' : 'outlined'}
                        disabled={!!this.props.disabled || this.state.hosts.length < 2}
                        aria-haspopup="true"
                        onClick={e => this.setState({ anchorEl: e.currentTarget })}
                    >
                        <Box
                            component="div"
                            sx={{
                                ...styles.width,
                                ...(!this.state.alive[this.props.currentHost] ? styles.notAlive : undefined),
                                ...styles.imgDiv,
                            }}
                            style={{
                                display: 'flex',
                                color: selectedHostObj?.common?.color
                                    ? Utils.invertColor(selectedHostObj.common.color, true)
                                    : 'none',
                                alignItems: 'center',
                            }}
                        >
                            <Icon
                                style={styles.img}
                                src={selectedHostObj?.common?.icon || 'img/no-image.png'}
                            />
                            <Box component="div" sx={styles.name}>{selectedHostObj?.common?.name}</Box>
                        </Box>
                    </Button>
                </span>
            </Tooltip>
            <Menu
                anchorEl={this.state.anchorEl}
                keepMounted
                open={!!this.state.anchorEl}
                onClose={() => this.setState({ anchorEl: null })}
            >
                {this.state.hosts.map(({ _id, common: { name, icon, color } }, idx) => <MenuItem
                    key={_id}
                    // button
                    disabled={!this.state.alive[_id]}
                    selected={_id === this.props.currentHost}
                    style={{ background: color || 'inherit' }}
                    onClick={() => {
                        if (this.props.currentHost !== this.state.hosts[idx]._id) {
                            this.props.setCurrentHost(
                                this.state.hosts[idx].common.name,
                                this.state.hosts[idx]._id,
                            );
                        }
                        this.setState({ anchorEl: null });
                    }}
                >
                    <Box
                        component="div"
                        sx={styles.imgDiv}
                        style={{
                            display: 'flex',
                            color: (color && Utils.invertColor(color, true)) || 'inherit',
                            alignItems: 'center',
                        }}
                    >
                        <div style={styles.selector}>
                            {_id === this.props.currentHost ? 'ᐅ' : ''}
                        </div>
                        <Icon style={styles.img} src={icon || 'img/no-image.png'} />
                        {name}
                    </Box>
                </MenuItem>)}
            </Menu>
        </Box>;
    }
}

export default HostSelectors;
