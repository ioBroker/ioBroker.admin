import React, { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import I18n from '@iobroker/adapter-react/i18n';
import { CardMedia, withStyles } from '@material-ui/core';

const styles = theme => ({
    img: {
        width: 30,
        height: 30,
        margin: 'auto 0',
        position: 'relative',
        marginRight: 10,
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
})

export default withStyles(styles)(function HostSelectors({ classes, disabled, socket, currentHostName, currentHost, setCurrentHost }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [hosts, setHosts] = useState([]);
    const [alive, setAlive] = useState({})
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleCloseItem = (_, idx) => {
        if (currentHost !== hosts[idx]._id) {
            setCurrentHost(hosts[idx].common.name, hosts[idx]._id)
        }
        setAnchorEl(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {
        let hostsArray = await socket.getHosts('');
        hostsArray.forEach(async ({ _id }) => {
            let aliveValue = await socket.getState(`${_id}.alive`);
            setAlive((prev) => ({ ...prev, [_id]: aliveValue.val === null ? false : aliveValue.val }))
        });
        setHosts(hostsArray);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div>
            <Button title={I18n.t("Host selection")} variant={disabled || hosts.length < 2 ? "text" : "outlined"} disabled={disabled || hosts.length < 2} aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
                {hosts.filter(el => el._id === currentHost).map(({ common: { name, icon, color } }) => <div style={{
                    display: 'flex',
                    color: color || 'none',
                    alignItems: 'center',
                }}>
                    <CardMedia
                        className={classes.img}
                        component="img"
                        image={icon || 'img/no-image.png'}
                    />
                    {name}
                </div>)}
            </Button>
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
                        onClick={(el) => handleCloseItem(el, idx)}>
                        <div style={{
                            display: 'flex',
                            color: color || 'none',
                            alignItems: 'center',
                        }}>
                            <CardMedia
                                className={classes.img}
                                component="img"
                                image={icon || 'img/no-image.png'}
                            />
                            {name}
                        </div>
                    </MenuItem>
                )}
            </Menu>
        </div>
    );
})