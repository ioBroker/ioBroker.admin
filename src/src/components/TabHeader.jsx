import PropTypes from 'prop-types';

import { Grid } from '@mui/material';

const TabHeader = props => <Grid
    item
    container
    alignItems="center"
>
    { props.children }
</Grid>;

TabHeader.propTypes = {
    /**
     * The content of the component.
     */
    children: PropTypes.node,
};

export default TabHeader;
