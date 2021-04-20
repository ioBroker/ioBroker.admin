import PropTypes from 'prop-types';

import {
    Grid,
    Tooltip,
    Typography
} from '@material-ui/core';

const InstanceInfo = props => {
    return <Grid
        item
        container
        alignItems="center"
        direction="row"
        spacing={ 1 }
    >
        <Grid item>
            { props.icon &&
                <Tooltip title={ props.tooltip || '' }>
                    { props.icon }
                </Tooltip>
            }
        </Grid>
        <Grid item>
            <Typography component="div">
                { props.children }
            </Typography>
        </Grid>
    </Grid>;
}

InstanceInfo.propTypes = {
    children: PropTypes.node,
    icon: PropTypes.node,
    tooltip: PropTypes.string
};

export default InstanceInfo;