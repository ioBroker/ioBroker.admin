import { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import LinearProgress from '@material-ui/core/LinearProgress';

import SaveCloseButtons from '@iobroker/adapter-react/Components/SaveCloseButtons';
import theme from '@iobroker/adapter-react/Theme';
import JsonConfig from './JsonConfig';

const styles = {
    scroll: {
        height: 'calc(100% - 48px - 48px)',
        overflowY: 'auto'
    }
};

class JsonSchemaConfig extends Component {
    constructor(props) {
        super(props);

        this.state = {
            schema: undefined,
            data: undefined,
            common: undefined,
            changed: false,
            theme: theme(props.themeName), // buttons requires special theme
        };

        this.getInstanceObject()
            .then(obj => {
                return this.getConfigFile()
                    .then(schema => this.setState({schema, data: obj.native, common: obj.common}));
            });
    }

    getConfigFile() {
        return this.props.socket.readFile(this.props.adapter + '.admin', 'jsonConfig.json')
            .then(data => {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    window.alert('Cannot parse json config!');
                }
            });
    }

    getInstanceObject() {
        return this.props.socket.getObject(`system.adapter.${this.props.adapter}.${this.props.instance}`);
    }

    setInstanceObject(newObj) {
        return this.props.socket.setObject(`system.adapter.${this.props.adapter}.${this.props.instance}`, newObj);
    }

    async closeDialog(doSave) {
        if (doSave) {
            const obj = await this.getInstanceObject();

            console.log('save', this.state.data);

            for (const a in this.state.data) {
                if (this.state.data.hasOwnProperty(a)) {
                    obj.native[a] = this.state.data[a];
                }
            }
            await this.setInstanceObject(obj);
        }
    }

    render() {
        const { classes } = this.props;

        if (!this.state.data || !this.state.schema) {
            return <LinearProgress />;
        }

        return <>
            <JsonConfig
                className={ classes.scroll }
                {...this.props}
                schema={this.state.schema}
                common={this.state.common}
                data={this.state.data}
                onError={error => this.setState({error})}
                onChange={(data, changed) => this.setState({data, changed})}
            />
            <SaveCloseButtons
                dense={true}
                paddingLeft={this.props.menuPadding}
                theme={this.state.theme}
                noTextOnButtons={this.props.width === 'xs' || this.props.width === 'sm' || this.props.width === 'md'}
                changed={!this.state.error && this.state.changed}
                error={this.state.error}
                onSave={() => this.closeDialog(true)}
                onClose={() => this.closeDialog(false)}
            />
        </>;
    }
}

JsonSchemaConfig.propTypes = {
    menuPadding: PropTypes.number,
    adapter: PropTypes.string,
    instance: PropTypes.number,

    socket: PropTypes.object,

    theme: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
};

export default withStyles(styles)(JsonSchemaConfig);