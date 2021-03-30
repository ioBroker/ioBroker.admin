import { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
//import Form from '@rjsf/material-ui';
//import toJsonSchema from 'to-json-schema';

import Box from '@material-ui/core/Box';
import LinearProgress from '@material-ui/core/LinearProgress';

import I18n from '@iobroker/adapter-react/i18n';
// import SaveCloseButtons from '@iobroker/adapter-react/Components/SaveCloseButtons';
import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';

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
            uiSchema: undefined,
            data: undefined,
            oldDataStr: '',
            form: {},
            hasChanges: false,
            theme: theme(Utils.getThemeName(this.props.themeName))
        };
    }

    async componentDidMount() {
        const obj = await this.getInstanceObject();
        // Translate schema
        const lang = I18n.getLanguage();
        const schema = {};//obj.common['$schema'] === true ? toJsonSchema(obj.native) : obj.common['$schema'];
        const uiSchema = obj.common['$uiSchema'] || {};

        Object.keys(schema).forEach(name => {
            const item = schema[name];

            if (typeof item.title === 'object') {
                item.title = item.title[lang] || item.title.en;
            }

            if (item.type === 'number') {
                obj.native[item.name] = parseFloat(obj.native[item.name]);
            }

            if (item.type === 'ip') {
                item.type = 'string';
                item.enum = [1, 2, 3];
                item.enumNames = ["one", "two", "three"];
            }

            if (item.type === 'password') {
                uiSchema[name] = {'ui:widget': 'password'};
                delete item['ui:widget'];
            }

            if (item['ui:widget']) {
                uiSchema[name] = {'ui:widget': item['ui:widget']};
                delete item['ui:widget'];
            }
        });

        this.setState({ schema, uiSchema, data: obj.native, oldDataStr: JSON.stringify(obj.native) });
    }

    getInstanceObject() {
        return this.props.socket.getObject(`system.adapter.${this.props.adapter}.${this.props.instance}`);
    }

    setInstanceObject(newObj) {
        return this.props.socket.setObject(`system.adapter.${this.props.adapter}.${this.props.instance}`, newObj);
    }

    async closeDialog(doSave) {
        if (doSave) {
            const data = {
                ...this.state.data
            };

            const obj = await this.getInstanceObject();
            if (obj.native['$schema']) {
                data['$schema'] = obj.native['$schema'];
            } else {
                delete data['$schema'];
            }
            if (obj.native['$uiSchema']) {
                data['$uiSchema'] = obj.native['$uiSchema'];
            } else {
                delete data['$uiSchema'];
            }

            console.log('save', data);

            for (const a in data) {
                if (data.hasOwnProperty(a)) {
                    obj.native[a] = data[a];
                }
            }
            await this.setInstanceObject(obj);
        }

        window.postMessage('close', '*');
    }

    handleChange(change) {
        console.log('change', change);
        this.setState({
            form: change,
            data: change.formData,
            hasChanges: JSON.stringify(change.formData) !== this.state.oldDataStr
        },
        () => window.postMessage(this.state.hasChanges ? 'nochange' : 'change', '*'));
    }

    render() {
        const { classes } = this.props;

        if (!this.state.data) {
            return <LinearProgress />;
        }

        const errors = (this.state.form && this.state.form.errors) || [];

        return <>
            <Box p={ 3 } className={ classes.scroll }>
                {/*<Form
                    schema={this.state.schema}
                    uiSchema={this.state.uiSchema}
                    formData={this.state.data}
                    liveValidate
                    onChange={(change) => this.handleChange(change)}
                >
                    <Fragment />
                </Form>*/}
            </Box>
            {/* <SaveCloseButtons
                dense={true}
                paddingLeft={this.props.menuPadding}
                theme={this.state.theme}
                noTextOnButtons={this.props.width === 'xs' || this.props.width === 'sm' || this.props.width === 'md'}
                changed={!errors.length && this.state.hasChanges}
                onSave={() => this.closeDialog(true)}
                onClose={() => this.closeDialog(false)}
            /> */}

            {/*<AppBar color="default" position="static">
                <Toolbar>
                    <Grid container spacing={ 1 }>
                        <Grid item>
                            <Button
                                variant="contained"
                                color="primary"
                                disabled={ errors.length > 0 || !this.state.hasChanges }
                                onClick={ () => this.closeDialog(true) }
                            >
                                { t('Save') }
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={ () => this.closeDialog(false) }
                            >
                                { t('Close') }
                            </Button>
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>*/}
        </>;
    }
}

JsonSchemaConfig.propTypes = {
    menuPadding: PropTypes.number,
    theme: PropTypes.object,
    adapter: PropTypes.string,
    instance: PropTypes.number,
    socket: PropTypes.object,
    themeName: PropTypes.string,
};

export default withStyles(styles)(JsonSchemaConfig);