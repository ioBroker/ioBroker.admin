import PropTypes from 'prop-types';

import { Grid } from '@material-ui/core';

const TabHeader = props => {
    return (
        <Grid
            item
            container
            alignItems="center"
        >
            { props.children }
        </Grid>
    );
}

TabHeader.propTypes = {
    /**
     * The content of the component.
     */
    children: PropTypes.node
};

export default TabHeader;