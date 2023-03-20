import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import ConfigGeneric from './ConfigGeneric';
import I18n from './wrapper/i18n';
import FormHelperText from "@mui/material/FormHelperText";

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
        const itemLeCollection = this.state.collectionsOptions?.find(item => item.value === leCollection);

        return <FormControl className={this.props.classes.fullWidth} variant="standard">
                {this.props.schema.label ? <InputLabel shrink>{this.getText(this.props.schema.label)}</InputLabel> : null}
                <Select
                    variant="standard"
                    error={!!error}
                    displayEmpty
                    disabled={!!disabled}
                    value={leCollection}
                    renderValue={() => this.getText(itemLeCollection?.label)}
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
                            key={item.value}
                            value={item.value}
                            style={item.value === ConfigGeneric.NONE_VALUE ? { opacity: 0.5 } : {}}
                        >
                            {item.label}
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