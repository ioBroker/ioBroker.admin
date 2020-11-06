import PropTypes from 'prop-types';
import clsx from 'clsx';

import { withStyles } from '@material-ui/core/styles';

import { Grid } from '@material-ui/core';

const styles = {
    root: {
        height: '100%',
        overflow: 'hidden'
    },
    overflowAuto: {
        overflow: 'auto'
    }
};

const TabContent = props => {

    const { classes } = props;

    return (
        <Grid
            item
            className={ clsx(classes.root, {[classes.overflowAuto]: props.overflow === 'auto'}) }
        >
            { props.children }
        </Grid>
    );
}

TabContent.propTypes = {
    /**
     * The content of the component.
     */
    children: PropTypes.node,
    /**
     * Overflow behavior
     */
    overflow: PropTypes.string
};

export default withStyles(styles)(TabContent);