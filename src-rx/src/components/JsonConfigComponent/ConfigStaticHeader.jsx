import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import {Typography} from '@material-ui/core';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    header: {
        width: '100%',
        background: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        padding: 4,
        borderRadius: 3
    },
});

class ConfigStaticHeader extends ConfigGeneric {
    renderItem() {
        return <Typography
            className={this.props.classes.header}
            component={this.props.schema.size ? 'h' + this.props.schema.size : 'h5'}
        >
            {this.getText(this.props.schema.text, this.props.schema.noTranslation)}
        </Typography>;
    }
}

ConfigStaticHeader.propTypes = {
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

export default withStyles(styles)(ConfigStaticHeader);