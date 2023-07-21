import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import Button from '@mui/material/Button';

import IconAuth from '@mui/icons-material/Key';
import IconSend from '@mui/icons-material/Send';
import IconWeb from '@mui/icons-material/Public';
import IconWarning from '@mui/icons-material/Warning';
import IconError from '@mui/icons-material/Error';
import IconInfo from '@mui/icons-material/Info';
import IconSearch from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HelpIcon from '@mui/icons-material/Help';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import Icon from './wrapper/Components/Icon';
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
    getIcon() {
        let icon = null;
        if (this.props.schema.icon === 'auth') {
            icon = <IconAuth />;
        } else if (this.props.schema.icon === 'send') {
            icon = <IconSend />;
        } else if (this.props.schema.icon === 'web') {
            icon = <IconWeb />;
        } else if (this.props.schema.icon === 'warning') {
            icon = <IconWarning />;
        } else if (this.props.schema.icon === 'error') {
            icon = <IconError />;
        } else if (this.props.schema.icon === 'info') {
            icon = <IconInfo />;
        } else if (this.props.schema.icon === 'search') {
            icon = <IconSearch />;
        } else if (this.props.schema.icon === 'book') {
            icon = <MenuBookIcon />;
        } else if (this.props.schema.icon === 'help') {
            icon = <HelpIcon />;
        } else if (this.props.schema.icon === 'upload') {
            icon = <UploadFileIcon />;
        } else if (this.props.schema.icon) {
            icon = <Icon src={this.props.schema.icon} />;
        }

        return icon;
    }

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
        let text = this.getText(this.props.schema.text || this.props.schema.label);
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
