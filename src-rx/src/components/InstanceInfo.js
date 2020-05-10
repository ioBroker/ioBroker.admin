import React from 'react';

import PropTypes from 'prop-types';

import { Grid } from '@material-ui/core';
import { Tooltip } from '@material-ui/core';
import { Typography } from '@material-ui/core';

class InstanceInfo extends React.Component {
    render() {
        return (
            <Grid
                item
                container
                alignItems="center"
                direction="row"
                spacing={ 1 }
            >
                <Grid item>
                    { this.props.icon &&
                        <Tooltip title={ this.props.tooltip || '' }>
                            { this.props.icon }
                        </Tooltip>
                    }
                </Grid>
                <Grid item>
                    <Typography>
                        { this.props.children }
                    </Typography>
                </Grid>
            </Grid>
        );
    }
}

InstanceInfo.propTypes = {
    icon: PropTypes.node,
    tooltip: PropTypes.string
};

export default InstanceInfo;