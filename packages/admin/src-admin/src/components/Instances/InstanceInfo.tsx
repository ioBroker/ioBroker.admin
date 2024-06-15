import React from 'react';
import { withStyles } from '@mui/styles';
import {
    Grid,
    Tooltip,
    Typography,
} from '@mui/material';

const styles = () => ({
    nowrap: {
        flexFlow: 'nowrap',
        overflow: 'hidden',
    },
    width: {
        width:'100%',
        overflow: 'hidden',
    },
});

interface InstanceInfoProps {
    children: (React.JSX.Element | string)[] | React.JSX.Element | string;
    icon?: React.JSX.Element;
    tooltip?: string;
    classes: Record<string, string>;
    className?: string;
}

const InstanceInfo = (props: InstanceInfoProps) => <Grid
    item
    container
    title={props.icon ? '' : props.tooltip || ''}
    alignItems="center"
    direction="row"
    spacing={1}
    className={props.classes.nowrap}
>
    <Grid item>
        {props.icon &&
            <Tooltip title={props.tooltip || ''}>
                {props.icon}
            </Tooltip>}
    </Grid>
    <Grid
        className={props.classes.width}
        item
    >
        <Tooltip title={props.tooltip || ''}>
            <Typography component="div" className={props.className}>
                {props.children}
            </Typography>
        </Tooltip>
    </Grid>
</Grid>;

export default withStyles(styles)(InstanceInfo);
