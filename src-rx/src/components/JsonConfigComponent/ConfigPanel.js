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

const components = {
    text: ConfigText,
    checkbox: ConfigCheckbox,
    staticImage: ConfigStaticImage,
    staticText: ConfigStaticText,
    staticLink: ConfigStaticText,
    number: ConfigNumber,
    color: ConfigColor,
    ip: ConfigIP,
    select: ConfigSelect,
    user: ConfigUser,
    pattern: ConfigPattern,
    certificate: ConfigCertificateSelect,
    objectId: ConfigObjectId,
    language: ConfigLanguage,
    chip: ConfigChip,
    image: ConfigImageUpload,
    instance: ConfigInstanceSelect,
    table: ConfigTable,
    sendto: ConfigSendto,
    sendTo: ConfigSendto,
    password: ConfigPassword,
    header: ConfigStaticHeader,
    divider: ConfigStaticDivider,
    setState: ConfigSetState,
    jsonEditor: ConfigJsonEditor,
    selectSendTo: ConfigSelectSendTo,
    topic: ConfigTopic,
    autocomplete: ConfigAutocomplete,
    autocompleteSendTo: ConfigAutocompleteSendTo,
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

    renderItems(items) {
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
        console.log(this.props)
        const items = this.props.schema.items;
        const classes = this.props.classes || {};

        if (this.props.table) {
            return this.renderItems(items);
        }
        if (this.props.custom) {
            return <Grid key={this.props.attr} container className={classes.fullWidth} spacing={2}>
                {this.renderItems(items)}
            </Grid>;
        } else {
            if (this.props.schema.collapsable) {
                return <Accordion
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
                        style={Object.assign({}, this.props.schema.style, this.props.themeType ? this.props.schema.darkStyle : {})}
                        className={clsx(classes.fullWidth, this.props.schema.color === 'primary' && classes.primary, this.props.schema.color === 'secondary' && classes.secondary)}
                    >
                        <Typography className={classes.heading}>{this.getText(this.props.schema.label)}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container className={classes.fullWidth + ' ' + classes.padding} spacing={2}>
                            {this.renderItems(items)}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            } else {
                return <div key={this.props.attr} className={(this.props.className || '') + ' ' + classes.paper}>
                    <Grid container className={classes.fullWidth + ' ' + classes.padding} spacing={2}>
                        {this.renderItems(items)}
                    </Grid>
                </div>;
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