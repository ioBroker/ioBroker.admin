import { Component } from 'react';

import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

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
};

class TabContainer extends Component {
    render() {
        const { classes } = this.props;

        return <Paper
            elevation={!Number.isNaN(this.props.elevation) ? this.props.elevation : 1}
            className={Utils.clsx(classes.root, { [classes.overflowHidden]: this.props.overflow !== 'visible' }, this.props.className)}
            onKeyDown={this.props.onKeyDown}
            tabIndex={this.props.tabIndex}
        >
            <Grid
                container
                direction="column"
                wrap="nowrap"
                className={classes.container}
            >
                { this.props.children }
            </Grid>
        </Paper>;
    }
}

TabContainer.propTypes = {
    elevation: PropTypes.number,
    overflow: PropTypes.string,
    className: PropTypes.string,
    onKeyDown: PropTypes.func,
    tabIndex: PropTypes.number,
};

export default withStyles(styles)(TabContainer);
