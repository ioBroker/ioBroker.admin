import React from 'react';

import { Grid } from '@material-ui/core';

class TabHeader extends React.Component {

    render() {
        return (
            <Grid
                item
                container
                alignItems="center"
            >
                { this.props.children }
            </Grid>
        );
    }
}

export default TabHeader;