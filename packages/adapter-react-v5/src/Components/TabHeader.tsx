import React from 'react';

import { Grid2 } from '@mui/material';

interface TabHeaderProps {
    children: React.ReactNode;
}

export function TabHeader(props: TabHeaderProps): React.JSX.Element {
    return (
        <Grid2
            container
            alignItems="center"
        >
            {props.children}
        </Grid2>
    );
}
