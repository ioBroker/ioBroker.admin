import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Utils from '@iobroker/adapter-react/Components/Utils';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%',
        backgroundColor: theme.palette.type === 'dark' ? '#FFF' : '#000',
        borderStyle: 'hidden',
    },
    primary: {
        backgroundColor: theme.palette.primary.main
    },
    secondary: {
        backgroundColor: theme.palette.secondary.main
    }
});

class ConfigStaticDivider extends ConfigGeneric {
    renderItem() {
        return <hr
            className={Utils.clsx(
                this.props.classes.fullWidth,
                this.props.schema.color === 'primary' && this.props.classes.primary,
                this.props.schema.color === 'secondary' && this.props.classes.secondary
            )}
            style={{
                height: this.props.schema.color ? this.props.schema.height || 2 : this.props.schema.height || 1,
                backgroundColor: this.props.schema.color !== 'primary' && this.props.schema.color !== 'secondary' && this.props.schema.color ? this.props.schema.color : undefined,
            }}
        />;
    }
}

ConfigStaticDivider.propTypes = {
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

export default withStyles(styles)(ConfigStaticDivider);