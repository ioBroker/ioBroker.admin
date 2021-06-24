import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import Grid from '@material-ui/core/Grid';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import ConfigGeneric from './ConfigGeneric';
import ConfigText from './ConfigText';
import ConfigCheckbox from './ConfigCheckbox';
import ConfigStaticImage from './ConfigStaticImage';
import ConfigNumber from './ConfigNumber';
import ConfigColor from './ConfigColor';
import ConfigIP from './ConfigIP';
import ConfigSelect from './ConfigSelect';
import ConfigUser from './ConfigUser';
import ConfigStaticText from './ConfigStaticText';
import ConfigPattern from './ConfigPattern';
import ConfigCertificateSelect from './ConfigCertificateSelect';
import ConfigImageUpload from './ConfigImageUpload';
import ConfigInstanceSelect from './ConfigInstanceSelect';
import ConfigTable from './ConfigTable';
import ConfigSendto from './ConfigSendto';
import ConfigObjectId from './ConfigObjectId';
import ConfigLanguage from './ConfigLanguage';
import ConfigChip from './ConfigChip';
import ConfigPassword from './ConfigPassword';
import ConfigStaticHeader from './ConfigStaticHeader';
import ConfigStaticDivider from './ConfigStaticDivider';
import ConfigSetState from './ConfigSetState';
import ConfigJsonEditor from './ConfigJsonEditor';
import ConfigSelectSendTo from './ConfigSelectSendTo';
import ConfigTopic from './ConfigTopic';
import ConfigAutocomplete from './ConfigAutocomplete';
import ConfigAutocompleteSendTo from './ConfigAutocompleteSendTo';
import ConfigTimePicker from './ConfigTimePicker';
import ConfigDatePicker from './ConfigDatePicker';
import ConfigCRON from './ConfigCRON';
import ConfigAlive from './ConfigAlive';
import ConfigTextSendTo from './ConfigTextSendTo';

const components = {
    alive: ConfigAlive,
    autocomplete: ConfigAutocomplete,
    autocompleteSendTo: ConfigAutocompleteSendTo,
    certificate: ConfigCertificateSelect,
    checkbox: ConfigCheckbox,
    chip: ConfigChip,
    color: ConfigColor,
    cron: ConfigCRON,
    datePicker: ConfigDatePicker,
    divider: ConfigStaticDivider,
    header: ConfigStaticHeader,
    image: ConfigImageUpload,
    instance: ConfigInstanceSelect,
    ip: ConfigIP,
    jsonEditor: ConfigJsonEditor,
    language: ConfigLanguage,
    number: ConfigNumber,
    objectId: ConfigObjectId,
    password: ConfigPassword,
    pattern: ConfigPattern,
    select: ConfigSelect,
    selectSendTo: ConfigSelectSendTo,
    sendTo: ConfigSendto,
    sendto: ConfigSendto,
    setState: ConfigSetState,
    staticImage: ConfigStaticImage,
    staticLink: ConfigStaticText,
    staticText: ConfigStaticText,
    table: ConfigTable,
    text: ConfigText,
    textSendTo: ConfigTextSendTo,
    timePicker: ConfigTimePicker,
    topic: ConfigTopic,
    user: ConfigUser,
};

const styles = theme => ({
    fullWidth: {
        width: '100%',
        //height: '100%',
    },
    paper: {
        margin: 10,
        height: 'calc(100vh - 235px) !important',
        width: 'auto !important',
        overflowY: 'auto',
        paddingBottom: theme.spacing(1)
    },
    padding: {
        padding: 10,
    },
    heading: {

    },
    primary: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.type === 'dark' ? 'inherit' : '#FFF'
    },
    secondary: {
        backgroundColor: theme.palette.secondary.main,
    }
});

class ConfigPanel extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        if (this.props.schema.collapsable) {
            this.setState({expanded: window.localStorage.getItem(this.props.adapterName + '.' + this.props.attr) === 'true'});
        }
    }

    renderItems(items, disabled) {
        const classes = this.props.classes || {};

        return Object.keys(items).map(attr => {
            if (this.props.multiEdit && items[attr].noMultiEdit) {
                return null;
            }

            const type = items[attr].type || 'panel';
            let ItemComponent;
            if (type === 'custom') {
                if (this.props.customs && this.props.customs[items[attr].component]) {
                    ItemComponent = this.props.customs[items[attr].component];
                } else {
                    console.error('Cannot find custom component: ' + items[attr].component);
                    ItemComponent = ConfigGeneric;
                }
            } else if (type === 'panel') {
                ItemComponent = ConfigPanelStyled;
            } else {
                ItemComponent = components[type] || ConfigGeneric;
            }

            return <ItemComponent
                key={attr}
                onCommandRunning={this.props.onCommandRunning}
                commandRunning={this.props.commandRunning}
                className={classes.panel}
                socket={this.props.socket}
                adapterName={this.props.adapterName}
                instance={this.props.instance}
                common={this.props.common}
                alive={this.props.alive}
                themeType={this.props.themeType}
                themeName={this.props.themeName}
                data={this.props.data}
                systemConfig={this.props.systemConfig}
                onError={this.props.onError}
                onChange={this.props.onChange}
                customs={this.props.customs}
                dateFormat={this.props.dateFormat}
                isFloatComma={this.props.isFloatComma}
                disabled={disabled}

                registerOnForceUpdate={this.props.registerOnForceUpdate}
                forceUpdate={this.props.forceUpdate}

                customObj={this.props.customObj}
                instanceObj={this.props.instanceObj}
                custom={this.props.custom}

                attr={attr}
                schema={items[attr]}
            />;
        });
    }

    render() {
        const {disabled, hidden} = this.calculate(this.props.schema);

        const items   = this.props.schema.items;
        const classes = this.props.classes || {};
        const schema  = this.props.schema;

        if (hidden) {
            if (schema.hideOnlyControl) {
                const item = <Grid
                    item
                    xs={schema.xs || undefined}
                    lg={schema.lg || undefined}
                    md={schema.md || undefined}
                    sm={schema.sm || undefined}
                    style={Object.assign(
                        {},
                        {marginBottom: 0, /*marginRight: 8, */textAlign: 'left'},
                        schema.style,
                        this.props.themaType === 'dark' ? schema.darkStyle : {}
                    )}
                />;

                if (schema.newLine) {
                    return <>
                        <div style={{flexBasis: '100%', height: 0}} />
                        {item}
                    </>
                } else {
                    return item;
                }
            } else {
                return null;
            }
        } else
        if (this.props.table) {
            return this.renderItems(items, disabled);
        } else
        if (this.props.custom) {
            return <Grid
                key={this.props.attr}
                container
                className={classes.fullWidth}
                spacing={2}
            >
                {this.renderItems(items, disabled)}
            </Grid>;
        } else {
            let content;
            if (schema.collapsable) {
                content = <Accordion
                    key={this.props.attr}
                    className={classes.fullWidth}
                    expanded={!!this.state.expanded}
                    onChange={() => {
                        window.localStorage.setItem(this.props.adapterName + '.' + this.props.attr, this.state.expanded ? 'false' : 'true');
                        this.setState({expanded: !this.state.expanded});
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        style={Object.assign({}, schema.style, this.props.themeType ? schema.darkStyle : {})}
                        className={clsx(classes.fullWidth, schema.color === 'primary' && classes.primary, schema.color === 'secondary' && classes.secondary)}
                    >
                        <Typography className={classes.heading}>{this.getText(schema.label)}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container className={classes.fullWidth + ' ' + classes.padding} spacing={2}>
                            {this.renderItems(items, disabled)}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            } else {
                content = <div
                    key={this.props.attr}
                    className={clsx(this.props.className, this.props.isParentTab && classes.paper, classes.fullWidth)}
                >
                    <Grid container className={clsx(classes.fullWidth, this.props.isParentTab && classes.padding)} spacing={2}>
                        {this.renderItems(items, disabled)}
                    </Grid>
                </div>;
            }

            if (!this.props.isParentTab) {
                const item = <Grid
                    item
                    title={this.getText(schema.tooltip)}
                    xs={schema.xs || undefined}
                    lg={schema.lg || undefined}
                    md={schema.md || undefined}
                    sm={schema.sm || undefined}
                    style={Object.assign({}, {marginBottom: 0, /*marginRight: 8, */textAlign: 'left'}, schema.style)}>
                    {content}
                </Grid>;

                if (schema.newLine) {
                    return <>
                        <div style={{flexBasis: '100%', height: 0}} />
                        {item}
                    </>
                } else {
                    return item;
                }
            } else {
                return content;
            }
        }
    }
}

ConfigPanel.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    customs: PropTypes.object,
    alive: PropTypes.bool,
    systemConfig: PropTypes.object,
    adapterName: PropTypes.string,
    instance: PropTypes.number,
    commandRunning: PropTypes.bool,
    onCommandRunning: PropTypes.func,
    dateFormat: PropTypes.string,
    isFloatComma: PropTypes.bool,
    multiEdit: PropTypes.bool,
    isParentTab: PropTypes.bool,

    customObj: PropTypes.object,
    instanceObj: PropTypes.object,
    custom: PropTypes.bool,

    onError: PropTypes.func,
    onChange: PropTypes.func,
    onForceUpdate: PropTypes.func,
    registerOnForceUpdate: PropTypes.func,
};

const ConfigPanelStyled = withStyles(styles)(ConfigPanel);

export default ConfigPanelStyled;