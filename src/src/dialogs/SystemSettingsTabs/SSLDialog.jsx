// SSLDialog.js
import { Component } from 'react';
import PropTypes from 'prop-types';

class SSLDialog extends Component {
    render() {
        return <div
            style={{
                width: '100%',
                height: '100% ',
                overflow: 'auto',
                overflowX: 'hidden',
                padding: 15,
                fontSize: 20,
            }}
        >
            {this.props.t('ra_Use iobroker.acme adapter for letsencrypt certificates')}
        </div>;
    }
}

SSLDialog.propTypes = {
    t: PropTypes.func,
};

export default SSLDialog;



