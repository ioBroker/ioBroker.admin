import React from 'react';
import {
    Grid,
    Tooltip,
    Typography,
} from '@mui/material';

const styles: Record<string, React.CSSProperties> = {
    nowrap: {
        flexFlow: 'nowrap',
        overflow: 'hidden',
    },
    width: {
        width:'100%',
        overflow: 'hidden',
    },
    tooltip: {
        pointerEvents: 'none',
    },
};

interface InstanceInfoProps {
    children: (React.JSX.Element | string)[] | React.JSX.Element | string;
    icon?: React.JSX.Element;
    tooltip?: string;
    style?: React.CSSProperties;
}

const InstanceInfo = (props: InstanceInfoProps) => <Grid
    item
    container
    title={props.icon ? '' : props.tooltip || ''}
    alignItems="center"
    direction="row"
    spacing={1}
    style={styles.nowrap}
>
    {props.icon && <Grid item>
        <Tooltip title={props.tooltip || ''} componentsProps={{ popper: { sx: styles.tooltip } }}>
            {props.icon}
        </Tooltip>
    </Grid>}
    <Grid
        style={styles.width}
        item
    >
        <Tooltip title={props.tooltip || ''} componentsProps={{ popper: { sx: styles.tooltip } }}>
            <Typography component="div" style={props.style}>
                {props.children}
            </Typography>
        </Tooltip>
    </Grid>
</Grid>;

export default InstanceInfo;
