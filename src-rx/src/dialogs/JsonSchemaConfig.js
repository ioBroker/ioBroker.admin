import { Component, Fragment } from 'react';

import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import Toolbar from '@material-ui/core/Toolbar';

import Form from '@rjsf/material-ui';
const toJsonSchema = require('to-json-schema');

const styles = {
    scroll: {
        height: '100%',
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
            hasChanges: false
        };
    }
    
    async componentDidMount() {
        const obj = await this.getInstanceObject();
        const schema = obj.native['$schema'] || toJsonSchema(obj.native);
        const uiSchema = obj.native['$uiSchema'] || {};
        delete obj.native['$schema'];
        delete obj.native['$uiSchema'];

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

        const { classes, t } = this.props;

        if (!this.state.data) {
            return (
                <LinearProgress />
            );
        }

        const errors = (this.state.form && this.state.form.errors) || [];

        return (
            <>
                <Box p={ 3 } className={ classes.scroll }>
                    <Form
                        schema={this.state.schema}
                        uiSchema={this.state.uiSchema}
                        formData={this.state.data}
                        liveValidate
                        onChange={(change) => this.handleChange(change)}
                    >
                        <Fragment />
                    </Form>
                </Box>
                <AppBar color="default" position="static">
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
                </AppBar>
            </>
        );
    }
}


JsonSchemaConfig.propTypes = {
    adapter: PropTypes.string,
    instance: PropTypes.number,
    socket: PropTypes.object,
    themeName: PropTypes.string,
    t: PropTypes.func
};

export default withStyles(styles)(JsonSchemaConfig);