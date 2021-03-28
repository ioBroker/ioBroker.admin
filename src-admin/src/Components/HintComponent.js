import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ClickAwayListener, Fab, makeStyles, Tooltip } from '@material-ui/core';
import HelpOutlineOutlinedIcon from '@material-ui/icons/HelpOutlineOutlined';
import I18n from '@iobroker/adapter-react/i18n';

const useStyles = makeStyles(({ name }) => ({
    colorTheme: {
        color: name === 'dark' ? '#a2a2a2;' : '#c0c0c0',
        backgroundColor: name === 'dark' ? '#ffffff00' : '#ffffff'
    }
}));

const HintComponent = ({ children, openLink, style }) => {
    const [open, setOpen] = useState(false);
    const classes = useStyles();
    return (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Tooltip
                arrow
                placement="top"
                title={I18n.t(children)}
                interactive
                open={open}
                onOpen={() => setOpen(true)}
            >
                <Fab
                    className={classes.colorTheme}
                    style={Object.assign({
                        boxShadow: 'none',
                        marginLeft: 10,
                        width: 20,
                        height: 20,
                        minHeight: 20,
                    }, style)}
                    size="small" aria-label="like"
                    onClick={() => {
                        setOpen(!open);
                        openLink();
                    }}
                >
                    <HelpOutlineOutlinedIcon />
                </Fab>
            </Tooltip>
        </ClickAwayListener>
    )
}

HintComponent.propTypes = {
    children: PropTypes.string,
    openLink: PropTypes.func,
    style: PropTypes.object
};

HintComponent.defaultProps = {
    children: 'link',
    openLink: () => { },
    style: {}
};

export default HintComponent;