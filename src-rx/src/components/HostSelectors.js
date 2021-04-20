import React, { useEffect, useState } from 'react';
import { Tooltip, withStyles } from '@material-ui/core';

import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import I18n from '@iobroker/adapter-react/i18n';
import Icon from '@iobroker/adapter-react/Components/Icon';
import Utils from '@iobroker/adapter-react/Components/Utils';
import clsx from 'clsx';

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
})

export default withStyles(styles)(function HostSelectors({ classes, disabled, socket, currentHost, setCurrentHost, expertMode }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [hosts, setHosts] = useState([]);
    const [alive, setAlive] = useState({});
    const [hostSelect, setHostSelect] = useState({});

    const handleClick = event => setAnchorEl(event.currentTarget);

    const handleClose = () => setAnchorEl(null);

    const handleCloseItem = (_, idx) => {
        if (currentHost !== hosts[idx]._id) {
            setCurrentHost(hosts[idx].common.name, hosts[idx]._id);
        }
        setAnchorEl(null);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {
        let hostsArray;
        try {
            hostsArray = await socket.getHosts('');
            hostsArray.forEach(async ({ _id }) => {
                let aliveValue = await socket.getState(`${_id}.alive`);
                setAlive((prev) => ({ ...prev, [_id]: aliveValue.val === null ? false : aliveValue.val }));
            });
        } catch (e) {
            window.alert('Cannot get hosts: ' + e);
            hostsArray = [];
        }

        setHosts(hostsArray);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (hosts.length) {
            const newObj = hosts.find(({ _id }) => _id === currentHost);
            setHostSelect(newObj);
        }
    }, [currentHost, hosts]);

    if (!expertMode && hosts.length < 2) {
        return null;
    }

    return <div><Tooltip title={I18n.t('Change current host')}>
        <Button className={classes.button} style={{
            background: hostSelect?.common?.color || 'none',
            borderColor: hostSelect?.common?.color ? Utils.invertColor(hostSelect.common.color) : 'none'
        }} title={I18n.t('Host selection')} variant={disabled || hosts.length < 2 ? 'text' : 'outlined'} disabled={disabled || hosts.length < 2} aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
            <div
                className={classes.width}
                style={{
                    display: 'flex',
                    color: hostSelect?.common?.color ? Utils.invertColor(hostSelect.common.color, true) : 'none',
                    alignItems: 'center',
                }}>
                <Icon
                    className={clsx(classes.img, classes.imgButton)}
                    src={hostSelect?.common?.icon || 'img/no-image.png'}
                />
                <div className={classes.name}>{hostSelect?.common?.name}</div>

            </div>
        </Button>
    </Tooltip>
        <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
        >
            {hosts.map(({ _id, common: { name, icon, color } }, idx) =>
                <MenuItem
                    key={_id}
                    disabled={!alive[_id]}
                    selected={_id === currentHost}
                    style={{ background: color || 'inherit' }}
                    onClick={(el) => handleCloseItem(el, idx)}>
                    <div style={{
                        display: 'flex',
                        color: (color && Utils.invertColor(color, true)) || 'inherit',
                        alignItems: 'center',
                    }}>
                        <Icon
                            className={classes.img}
                            src={icon || 'img/no-image.png'}
                        />
                        {name}
                    </div>
                </MenuItem>
            )}
        </Menu>
    </div>;
})