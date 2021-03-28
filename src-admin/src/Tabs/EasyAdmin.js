import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';



const styles = theme => ({
    tab: {
        width: '100%',
        minHeight: '100%'
    },
});

class EasyAdmin extends Component {
    constructor(props) {
        super(props);

        this.state = {

        };
    }

    render() {
        return <form className={this.props.classes.tab}>
            <div>{I18n.t('explain_access_instance')}</div>
            <div></div>
        </form>;
    }
}

EasyAdmin.propTypes = {
    common: PropTypes.object.isRequired,
    native: PropTypes.object.isRequired,
    instance: PropTypes.number.isRequired,
    adapterName: PropTypes.string.isRequired,
    onError: PropTypes.func,
    onLoad: PropTypes.func,
    onChange: PropTypes.func,
    socket: PropTypes.object.isRequired,
    onShowError: PropTypes.func,
};

export default withStyles(styles)(EasyAdmin);
