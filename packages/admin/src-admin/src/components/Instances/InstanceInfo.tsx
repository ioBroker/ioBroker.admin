import React from 'react';
import { Grid2, Tooltip, Typography } from '@mui/material';

const styles: Record<string, React.CSSProperties> = {
    nowrap: {
        flexFlow: 'nowrap',
        overflow: 'hidden',
    },
    width: {
        width: '100%',
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

const InstanceInfo = (props: InstanceInfoProps) => (
    <Grid2
        container
        title={props.icon ? '' : props.tooltip || ''}
        alignItems="center"
        direction="row"
        spacing={1}
        style={styles.nowrap}
    >
        {props.icon && (
            <Grid2>
                <Tooltip title={props.tooltip || ''} slotProps={{ popper: { sx: styles.tooltip } }}>
                    {props.icon}
                </Tooltip>
            </Grid2>
        )}
        <Grid2 style={styles.width}>
            <Tooltip title={props.tooltip || ''} slotProps={{ popper: { sx: styles.tooltip } }}>
                <Typography component="div" style={props.style}>
                    {props.children}
                </Typography>
            </Tooltip>
        </Grid2>
    </Grid2>
);

export default InstanceInfo;
