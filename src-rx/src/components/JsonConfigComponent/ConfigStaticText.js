import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';

import Icon from '@iobroker/adapter-react/Components/Icon';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        height: '100%',
        width: '100%',
    }
});

class ConfigStaticText extends ConfigGeneric {
    renderItem(error, disabled) {

        if (this.props.schema.button) {
            return <Button
                variant={this.props.schema.variant || undefined}
                color={this.props.schema.color || undefined}
                className={this.props.classes.fullWidth}
                disabled={disabled}
                onClick={this.props.schema.href ? () => {
                    // calculate one more time just before call
                    const href = this.props.schema.href ? this.getText(this.props.schema.href, true) : null;
                    href && window.open(href, '_blank');
                } : null}
            >
                {this.props.schema.icon ? <Icon src={this.props.schema.icon} className={this.props.classes.icon}/> : null}
                {this.getText(this.props.schema.text || this.props.schema.label, this.props.schema.noTranslation)}
            </Button>
        } else {

            return <span onClick={this.props.schema.href ? () => {
                // calculate one more time just before call
                const href = this.props.schema.href ? this.getText(this.props.schema.href, true) : null;
                href && window.open(href, '_blank');
            } : null}>
                {this.getText(this.props.schema.text || this.props.schema.label)}
            </span>;
        }
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
    onChange: PropTypes.func,
};

export default withStyles(styles)(ConfigStaticText);
