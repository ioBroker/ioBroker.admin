import React, { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

export default function HostSelectors({ disabled, socket, currentHostName }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [hosts, setHosts] = useState([]);
    const [alive, setAlive] = useState({})
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {
        let hostsArray = await socket.getHosts('');
        hostsArray.forEach(async ({ _id, common: { name } }) => {
            let aliveValue = await socket.getState(`${_id}.alive`);
            setAlive((prev) => ({ ...prev, [name]: aliveValue.val === null ? false : aliveValue.val }))
        });
        setHosts(hostsArray);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div>
            <Button disabled={disabled} aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
                {currentHostName}
            </Button>
            <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {hosts.map(({ common: { name } }) => <MenuItem key={name} disabled={!alive[name]} selected={name === currentHostName} onClick={handleClose}>{name}</MenuItem>)}
            </Menu>
        </div>
    );
}