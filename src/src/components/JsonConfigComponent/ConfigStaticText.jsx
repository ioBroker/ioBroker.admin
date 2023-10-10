import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import { Button } from '@mui/material';

import Utils from './wrapper/Components/Utils';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        height: '100%',
        width: '100%',
    },
    link: {
        textDecoration: 'underline',
        color: theme.palette.mode === 'dark' ? '#4dabf5' : '#254e72',
        cursor: 'pointer',
    },
});

class ConfigStaticText extends ConfigGeneric {
    renderItem(error, disabled) {
        if (this.props.schema.button) {
            const icon = this.getIcon();
            return <Button
                variant={this.props.schema.variant || undefined}
                color={this.props.schema.color || 'grey'}
                className={this.props.classes.fullWidth}
                disabled={disabled}
                startIcon={icon}
                onClick={this.props.schema.href ? () => {
                    // calculate one more time just before call
                    const href = this.props.schema.href ? this.getText(this.props.schema.href, true) : null;
                    href && window.open(href, '_blank');
                } : null}
            >
                {this.getText(this.props.schema.text || this.props.schema.label, this.props.schema.noTranslation)}
            </Button>;
        }
        let text = this.getText(this.props.schema.text || this.props.schema.label, this.props.schema.noTranslation);
        if (text && (text.includes('<a ') || text.includes('<br') || text.includes('<b>') || text.includes('<i>'))) {
            text = Utils.renderTextWithA(text);
        }

        return <span
            className={this.props.schema.href ? this.props.classes.link : ''}
            onClick={this.props.schema.href ? () => {
                // calculate one more time just before call
                const href = this.props.schema.href ? this.getText(this.props.schema.href, true) : null;
                href && window.open(href, '_blank');
            } : null}
        >
            {text}
        </span>;
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
