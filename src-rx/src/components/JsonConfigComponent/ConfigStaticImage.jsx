import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        height: '100%',
        width: '100%',
    }
});

class ConfigStaticImage extends ConfigGeneric {
    renderItem() {
        let src = this.props.schema.src;
        if (src && !src.startsWith('.') && !src.startsWith('http')) {
            src = `adapter/${this.props.adapterName}/${src}`;
        }

        return <img
            className={this.props.classes.fullWidth}
            src={src}
            onClick={this.props.schema.href ? () => this.props.schema.href && window.open(this.props.schema.href, '_blank') : null}
            alt=""
        />;
    }
}

ConfigStaticImage.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(ConfigStaticImage);