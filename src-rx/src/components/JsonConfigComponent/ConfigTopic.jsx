import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import ConfigGeneric from './ConfigGeneric';
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
        if (!value && this.props.customObj && this.props.customObj._id) {
            let topic = convertID2Topic(this.props.customObj._id, null, this.props.adapterName + '.' + this.props.instance);
            this.setState({value: topic});
        } else {
            this.setState({value: value || ''});
        }
    }

    renderItem(error, disabled, defaultValue) {
        return <TextField
            fullWidth
            inputProps={{maxLength: this.props.schema.maxLength || this.props.schema.max || undefined}}
            value={this.state.value}
            error={!!error}
            disabled={disabled}
            placeholder={this.getText(this.props.schema.placeholder)}
            label={this.getText(this.props.schema.label)}
            helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
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