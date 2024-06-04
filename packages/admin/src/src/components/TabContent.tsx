import React from 'react';
import { withStyles } from '@mui/styles';
import { Grid } from '@mui/material';

import { Utils } from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = {
    root: {
        height: '100%',
        overflow: 'hidden',
    },
    overflowAuto: {
        overflow: 'auto',
    },
} as const;

interface TabContentProps {
    /** The content of the component. */
    children: React.JSX.Element | (React.JSX.Element | null | React.JSX.Element[])[];
    /** Overflow behavior */
    overflow?: 'auto';
    /** Additional css classes */
    classes: { [key in keyof typeof styles]: string};

    style?: React.CSSProperties;
}

function TabContent(props: TabContentProps): React.JSX.Element {
    return <Grid
        item
        style={props.style}
        className={Utils.clsx(props.classes.root, { [props.classes.overflowAuto]: props.overflow === 'auto' })}
    >
        {props.children}
    </Grid>;
}

export default withStyles(styles)(TabContent);
