import {Component} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';

const styles = theme => ({

});

class EasyMode extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return 'Take it easy!';
    }
}

EasyMode.propTypes = {
    configs: PropTypes.object,
    socket: PropTypes.object,
    t: PropTypes.func,
};
export default withStyles(styles)(EasyMode);