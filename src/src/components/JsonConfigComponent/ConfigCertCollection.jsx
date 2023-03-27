import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import {
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    FormHelperText,
} from '@mui/material';

import ConfigGeneric from './ConfigGeneric';
import I18n from './wrapper/i18n';

const styles = () => ({
    fullWidth: {
        width: '100%',
    },
});

class ConfigCertCollection extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();

        let collectionsOptions = await this.props.socket.getObject('system.certificates');
        if (collectionsOptions?.native?.collections) {
            collectionsOptions = Object.keys(collectionsOptions.native.collections);
        } else {
            collectionsOptions = [];
        }
        this.setState({ collectionsOptions });
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.collectionsOptions) {
            return null;
        }
        const leCollection = (ConfigGeneric.getValue(this.props.data, this.props.schema.leCollectionName || 'leCollection') || 'false').toString();

        return <FormControl className={this.props.classes.fullWidth} variant="standard">
                {this.props.schema.label ? <InputLabel shrink>{this.getText(this.props.schema.label)}</InputLabel> : null}
                <Select
                    variant="standard"
                    error={!!error}
                    displayEmpty
                    disabled={!!disabled}
                    value={leCollection}
                    onChange={e => this.onChange(
                        this.props.schema.attr,
                        e.target.value === 'false' ? false : (e.target.value === 'true' ? true: e.target.value)
                    )}
                >
                    <MenuItem
                        key="_false"
                        value="false"
                        style={{ fontWeight: 'bold' }}
                    >
                        {I18n.t('ra_Do not use let\'s encrypt')}
                    </MenuItem>
                    <MenuItem
                        key="_true"
                        value="true"
                        style={{ fontWeight: 'bold' }}
                    >
                        {I18n.t('ra_Use all available let\'s encrypt certificates')}
                    </MenuItem>
                    {this.state.collectionsOptions?.map(item =>
                        <MenuItem
                            key={item}
                            value={item}
                        >
                            {item}
                        </MenuItem>)}
                </Select>
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

ConfigCertCollection.propTypes = {
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

export default withStyles(styles)(ConfigCertCollection);