import PropTypes from 'prop-types';

import { withStyles } from '@mui/styles';

import { Grid } from '@mui/material';

import { Utils } from '@iobroker/adapter-react-v5';

const styles = {
    root: {
        height: '100%',
        overflow: 'hidden',
    },
    overflowAuto: {
        overflow: 'auto',
    },
};

const TabContent = props => {
    const { classes } = props;

    return <Grid
        item
        className={Utils.clsx(classes.root, { [classes.overflowAuto]: props.overflow === 'auto' })}
    >
        {props.children}
    </Grid>;
};

TabContent.propTypes = {
    /**
     * The content of the component.
     */
    children: PropTypes.node,
    /**
     * Overflow behavior
     */
    overflow: PropTypes.string,
};

export default withStyles(styles)(TabContent);
