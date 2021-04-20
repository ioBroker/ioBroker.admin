import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import I18n from '@iobroker/adapter-react/i18n';
import Utils from '@iobroker/adapter-react/Components/Utils';

import ConfigGeneric from './ConfigGeneric';
import Icon from "@iobroker/adapter-react/Components/Icon";
import React from "react";
import {TextField} from "@material-ui/core";

const styles = theme => ({
    fullWidth: {
        width: '100%'
    },
    icon: {
        width: 16,
        height: 16,
        marginRight: 8
    }
});

function convertID2Topic(id, prefix, namespace) {
    let topic;
    if (namespace && id.substring(0, namespace.length) === namespace) {
        topic = id.substring(namespace.length + 1);
    } else {
        topic = id;
    }
    topic = topic.replace(/\./g, '/').replace(/_/g, ' ');
    return topic;
}

class ConfigTopic extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        if (!value && this.props.customObj) {
            let topic = convertID2Topic(this.props.customObj._id, null, this.props.adapterName + '.' + this.props.instance);
            this.setState({value: topic});
        } else {
            this.setState({value: value || ''});
        }
    }

    renderItem(error, disabled, defaultValue) {
        return <TextField
            fullWidth
            value={this.state.value}
            error={!!error}
            disabled={disabled}
            placeholder={this.getText(this.props.schema.placeholder)}
            label={this.getText(this.props.schema.label)}
            helperText={this.getText(this.props.schema.help)}
            onChange={e => {
                const value = e.target.value;
                this.setState({ value }, () =>
                    this.onChange(this.props.attr, value));
            }}
        />;
    }
}

ConfigTopic.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
    adapterName: PropTypes.string,
    instance: PropTypes.number,
    customObj: PropTypes.object,
};

export default withStyles(styles)(ConfigTopic);