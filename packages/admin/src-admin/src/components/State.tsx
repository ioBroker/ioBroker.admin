import React, { type JSX } from 'react';

import { Grid, Typography } from '@mui/material';

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
    children: JSX.Element | JSX.Element[] | string | string[];
}

function State(props: StateProps): JSX.Element {
    return (
        <Grid
            container
            style={styles.wrapperContent}
            alignItems="center"
            direction="row"
            spacing={1}
        >
            <Grid>
                {props.state ? <CheckCircleIcon style={styles.checkIcon} /> : <CancelIcon style={styles.cancelIcon} />}
            </Grid>
            <Grid>
                <Typography>{props.children}</Typography>
            </Grid>
        </Grid>
    );
}

export default State;
