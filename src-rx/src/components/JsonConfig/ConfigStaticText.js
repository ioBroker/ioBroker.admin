import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        height: '100%',
        width: '100%',
    }
});

class ConfigStaticText extends ConfigGeneric {
    renderItem() {
        return <span
            onClick={this.props.schema.href ? () => this.props.schema.href && window.open(this.props.schema.href, '_blank') : null}
        >{this.getText(this.props.schema.text)}</span>;
    }
}

ConfigStaticText.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChanged: PropTypes.func,
};

export default withStyles(styles)(ConfigStaticText);