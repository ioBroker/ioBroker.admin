import { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import {LinearProgress} from "@material-ui/core";

import ConfigTabs from './ConfigTabs';

const styles = theme => ({
    root: {
        width: '100%',
        height: '100%'
    }
});

class JsonConfig extends Component {
    constructor(props) {
        super(props);

        this.state = {
            originalData: JSON.stringify(this.props.data),
            changed: false,
            errors: {

            },
            systemConfig: null,
            alive: false,
        };

        this.readData();
    }

    readSettings() {
        if (this.props.common && this.props.data) {
            return Promise.resolve();
        } else {
            this.props.socket.getObject(`system.adapter.${this.props.adapterName}.${this.props.instance}`)
                .then(obj => this.setState({common: obj.common, data: this.props.data || obj.native}));
        }
    }

    readData() {
        this.readSettings()
            .then(() => this.props.socket.getSystemConfig())
            .then(systemConfig => {
                const state = {systemConfig: systemConfig.common};
                this.setState(state, () =>
                    this.props.socket.subscribeState(`system.adapter.${this.props.adapterName}.${this.props.instance}.alive`, this.onAlive));
            });
    }

    onAlive = (id, state) => {
        if ((state?.val || false) !== this.state.alive) {
            this.setState({alive: state?.val || false});
        }
    }

    onChange(data) {
        const state = {data};
        state.changed = JSON.stringify(data) !== this.state.originalData;

        this.setState({state}, () =>
            this.props.onChange(data, state.changed));
    }

    onError(error, attr) {
        const _error = JSON.parse(JSON.stringify(this.state.error));
        if (error) {
            _error[attr] = error;
        } else {
            delete _error[attr];
        }
        if (JSON.stringify(_error) !== JSON.parse(JSON.stringify(this.state.error))) {
            this.setState({error: _error}, () =>
                this.props.onError(!!Object.keys(this.state.error).length));
        }
    }

    renderItem(item) {
        if (item.type === 'tabs') {
            return <ConfigTabs
                {...this.props}
                onChange={data => this.onChange(data)}
                onError={(error, attr) => this.onError(error, attr)}
                systemConfig={this.state.systemConfig}
                common={this.state.common || this.props.common}
                alive={this.state.alive}
            />
        }
    }

    render() {
        if (!this.state.systemConfig) {
            return <LinearProgress />;
        }

        return <div className={this.props.classes.root}>
            {this.renderItem(this.props.schema)}
        </div>;
    }
}

JsonConfig.propTypes = {
    socket: PropTypes.object.isRequired,

    adapterName: PropTypes.string.isRequired,
    instance: PropTypes.number.isRequired,
    common: PropTypes.object,

    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(JsonConfig);