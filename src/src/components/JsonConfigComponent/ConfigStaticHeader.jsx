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
                return <h1 className={this.props.classes.header}>
                    {this.getText(this.props.schema.text, this.props.schema.noTranslation)}
                </h1>;

            case '2':
                return <h2 className={this.props.classes.header}>
                    {this.getText(this.props.schema.text, this.props.schema.noTranslation)}
                </h2>;

            case '3':
                return <h3 className={this.props.classes.header}>
                    {this.getText(this.props.schema.text, this.props.schema.noTranslation)}
                </h3>;

            case '4':
                return <h4 className={this.props.classes.header}>
                    {this.getText(this.props.schema.text, this.props.schema.noTranslation)}
                </h4>;

            case '5':
            default:
                return <h5 className={this.props.classes.header}>
                    {this.getText(this.props.schema.text, this.props.schema.noTranslation)}
                </h5>;
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
