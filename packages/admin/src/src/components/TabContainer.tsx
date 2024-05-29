// please do not delete React, as without it other projects could not be compiled: ReferenceError: React is not defined
import React from 'react';
import { withStyles } from '@mui/styles';

import { Grid, Paper } from '@mui/material';

import { Utils } from '@iobroker/adapter-react-v5';

const styles = {
    root: {
        width: '100%',
        height: '100%',
    },
    overflowHidden: {
        overflow: 'hidden',
    },
    container: {
        height: '100%',
    },
} as const;

interface TabContainerProps {
    /** The content of the component. */
    children: React.JSX.Element | React.JSX.Element[];
    /** The elevation of the tab container. */
    elevation?: number;
    /** Set to 'visible' show the overflow. */
    overflow?: string;
    className?: string;
    /** Additional css classes */
    classes: { [key in keyof typeof styles]: string};
}

class TabContainer extends React.Component<TabContainerProps> {
    render() {
        const { classes } = this.props;

        return <Paper
            elevation={!Number.isNaN(this.props.elevation) ? this.props.elevation : 1}
            className={Utils.clsx(classes.root, { [classes.overflowHidden]: this.props.overflow !== 'visible' }, this.props.className)}
        >
            <Grid
                container
                direction="column"
                wrap="nowrap"
                className={classes.container}
            >
                {this.props.children}
            </Grid>
        </Paper>;
    }
}

export default withStyles(styles)(TabContainer);
