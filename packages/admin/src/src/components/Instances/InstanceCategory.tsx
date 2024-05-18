import React from 'react';
import { withStyles } from '@mui/styles';
import {
    Accordion, AccordionDetails, AccordionSummary,
    type Theme,
} from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MaterialDynamicIcon from '../../helpers/MaterialDynamicIcon';

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

const styles: Record<string, any> = (theme: Theme) => ({
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
            boxShadow: boxShadowHover,
        },
    },
    row: {
        paddingLeft: 8,
        flexDirection: 'row-reverse',
        minHeight: '48px !important',
        height: 48,
        fontWeight: 'bold',
        fontSize: 16,
    },
    iconStyle: {
        marginRight: 10,
    },
    wrapperName: {
        margin: '0 10px',
        display: 'flex',
        alignItems: 'center',
    },
    wrapperChildren: {
        width: '100%',
    },
    accordionDetails: {
        padding: 0,
    },
    accordion: {
        margin: '1px 0 !important',
    },
});

interface InstanceCategoryProps {
    name: string;
    key: string;
    children: React.JSX.Element[] | React.JSX.Element;
    classes: Record<string, string>;
    expanded: boolean;
    onExpand: (expanded: boolean) => void;
}

const InstanceCategory = ({
    name,
    key,
    children,
    classes,
    expanded,
    onExpand,
}: InstanceCategoryProps) => <Accordion
    expanded={!!expanded}
    onChange={() => onExpand(!expanded)}
    classes={{ root: classes.accordion }}
    key={key}
    square
>
    <AccordionSummary
        classes={{ root: classes.row }}
        expandIcon={<ExpandMoreIcon />}
    >
        <div className={classes.wrapperName}>
            <MaterialDynamicIcon
                objIconBool
                iconName={name}
                className={classes.iconStyle}
            />
            {name}
        </div>
    </AccordionSummary>
    <AccordionDetails className={classes.accordionDetails}>
        <div className={classes.wrapperChildren}>
            {children}
        </div>
    </AccordionDetails>
</Accordion>;

InstanceCategory.propTypes = {
};

export default withStyles(styles)(InstanceCategory);
