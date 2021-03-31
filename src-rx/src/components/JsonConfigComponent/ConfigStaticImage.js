import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        height: '100%',
        width: '100%',
    }
});

class ConfigStaticImage extends ConfigGeneric {
    renderItem() {
        return <img
            className={this.props.classes.fullWidth}
            src={this.props.schema.src}
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