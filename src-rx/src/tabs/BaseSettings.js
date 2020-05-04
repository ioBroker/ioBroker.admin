import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';

const styles = theme => ({
    root: {
        width: 'calc(100% - 10px)',
        height: 'calc(100% - 10px)',
        overflow: 'hidden',
        position: 'relative',
        marginTop: 0,
        marginBottom: theme.spacing(2),
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),

    },
});

class BaseSettings extends React.Component {

    constructor(props) {

        super(props);

        this.filters = window.localStorage.getItem(this.dialogName) || '{}';

        try {
            this.filters = JSON.parse(this.filters);
        } catch (e) {
            this.filters = {};
        }

        this.state =  {
            selected: this.props.selected || '',
            name:     ''
        };
    }

    render() {
        return (
            <Paper className={ this.props.classes.root }>

            </Paper>
        );
    }
}

BaseSettings.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    themeName: PropTypes.string,
    expertMode: PropTypes.bool,
};

export default withWidth()(withStyles(styles)(BaseSettings));