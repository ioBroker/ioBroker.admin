import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
    Accordion, AccordionDetails, AccordionSummary,
} from '@material-ui/core';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import MaterialDynamicIcon from '../../helpers/MaterialDynamicIcon';

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

const styles = theme => ({
    root: {
        position: 'relative',
        margin: 10,
        width: 300,
        minHeight: 200,
        background: theme.palette.background.default,
        boxShadow,
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.5s',
        '&:hover': {
            boxShadow: boxShadowHover
        }
    },
    row: {
        paddingLeft: 8,
        flexDirection: 'row-reverse',
        minHeight: '48px !important',
        height: 48
    },
    iconStyle: {
        marginRight: 10
    },
    wrapperName: {
        margin: '0 10px',
        display: 'flex',
        alignItems: 'center'
    },
    wrapperChildren: {
        width: '100%'
    },
    accordionDetails: {
        padding: 0
    },
    accordion: {
        margin: '1px 0 !important'
    }
});

const InstanceCategory = ({
    name,
    key,
    children,
    classes,
    folderOpen,
    rebuild
}) => {
    useEffect(() => {
        if (folderOpen !== open) {
            setOpen(folderOpen);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [folderOpen, rebuild])
    const [open, setOpen] = useState(folderOpen);
    return <Accordion
        defaultExpanded={folderOpen}
        expanded={open} onChange={() => setOpen(!open)}
        classes={{ root: classes.accordion }} key={key} square>
        <AccordionSummary
            classes={{ root: classes.row }}
            expandIcon={<ExpandMoreIcon />}>
            <div className={classes.wrapperName}>
                <MaterialDynamicIcon objIconBool iconName={name} className={classes.iconStyle} />{name}
            </div>
        </AccordionSummary>
        <AccordionDetails className={classes.accordionDetails}>
            <div className={classes.wrapperChildren}>
                {children}
            </div>
        </AccordionDetails>
    </Accordion >;
}

InstanceCategory.propTypes = {
    t: PropTypes.func,
    themeType: PropTypes.string,
    adminInstance: PropTypes.string,
    hosts: PropTypes.array,
    setHost: PropTypes.func,
    host: PropTypes.string,
    instanceId: PropTypes.string,
};


export default withStyles(styles)(InstanceCategory);