import React from 'react';

import { Grid } from '@mui/material';

interface TabHeaderProps {
    /** The content of the component. */
    children: React.JSX.Element | React.JSX.Element[] | string;
}

const TabHeader = (props: TabHeaderProps) => <Grid
    item
    container
    alignItems="center"
>
    {props.children}
</Grid>;

export default TabHeader;
