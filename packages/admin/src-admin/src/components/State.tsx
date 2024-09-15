import React, { type JSX } from 'react';

import { Grid2, Typography } from '@mui/material';

import { CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from '@mui/icons-material';

import { green, red } from '@mui/material/colors';

const styles: Record<string, any> = {
    checkIcon: {
        color: green[700],
    },
    cancelIcon: {
        color: red[700],
    },
    wrapperContent: {
        display: 'flex',
        flexFlow: 'nowrap',
        alignItems: 'inherit',
    },
};

interface StateProps {
    state: boolean;
    children: React.JSX.Element | React.JSX.Element[] | string | string[];
}

function State(props: StateProps): JSX.Element {
    return (
        <Grid2
            container
            style={styles.wrapperContent}
            alignItems="center"
            direction="row"
            spacing={1}
        >
            <Grid2>
                {props.state ? <CheckCircleIcon style={styles.checkIcon} /> : <CancelIcon style={styles.cancelIcon} />}
            </Grid2>
            <Grid2>
                <Typography>{props.children}</Typography>
            </Grid2>
        </Grid2>
    );
}

export default State;
