import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import ConfigGeneric from './ConfigGeneric';
const styles = theme => ({
    header: {
        width: '100%',
        background: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        padding: '4px !important',
        borderRadius: 3,
        marginBlockEnd: 0,
        marginBlockStart: 0,
    },
});
class ConfigStaticHeader extends ConfigGeneric {
    renderItem() {
        switch ((this.props.schema.size || 5).toString()) {
            case '1':
                return React.createElement("h1", { className: this.props.classes.header }, this.getText(this.props.schema.text, this.props.schema.noTranslation));
            case '2':
                return React.createElement("h2", { className: this.props.classes.header }, this.getText(this.props.schema.text, this.props.schema.noTranslation));
            case '3':
                return React.createElement("h3", { className: this.props.classes.header }, this.getText(this.props.schema.text, this.props.schema.noTranslation));
            case '4':
                return React.createElement("h4", { className: this.props.classes.header }, this.getText(this.props.schema.text, this.props.schema.noTranslation));
            case '5':
            default:
                return React.createElement("h5", { className: this.props.classes.header }, this.getText(this.props.schema.text, this.props.schema.noTranslation));
        }
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
//# sourceMappingURL=ConfigStaticHeader.js.map