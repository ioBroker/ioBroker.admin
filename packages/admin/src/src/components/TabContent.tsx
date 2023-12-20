import { withStyles } from '@mui/styles';
import { Grid } from '@mui/material';
import { Utils } from '@iobroker/adapter-react-v5';
import React from 'react';

const styles = {
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
}

class TabContent extends React.Component<TabContentProps> {
    render(): React.JSX.Element {
        const { classes } = this.props;

        return <Grid
            item
            className={Utils.clsx(classes.root, { [classes.overflowAuto]: this.props.overflow === 'auto' })}
        >
            {this.props.children}
        </Grid>;
    }
}

export default withStyles(styles)(TabContent);
