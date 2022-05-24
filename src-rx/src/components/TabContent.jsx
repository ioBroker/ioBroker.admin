import PropTypes from 'prop-types';
import clsx from 'clsx';

import { withStyles } from '@mui/styles';

import { Grid } from '@mui/material';

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

    return <Grid
        item
        className={ clsx(classes.root, {[classes.overflowAuto]: props.overflow === 'auto'}) }
    >
        { props.children }
    </Grid>;
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