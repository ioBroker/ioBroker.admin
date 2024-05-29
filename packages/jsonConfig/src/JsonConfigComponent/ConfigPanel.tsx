import React, { type JSXElementConstructor } from 'react';
import { withStyles } from '@mui/styles';

import {
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
} from '@mui/material';

import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

import { Utils, type IobTheme } from '@iobroker/adapter-react-v5';
import type { ConfigItemPanel } from '#JC/types';

import ConfigGeneric, { type ConfigGenericState, type ConfigGenericProps } from './ConfigGeneric';
// eslint-disable-next-line import/no-cycle
import ConfigAccordion from './ConfigAccordion';
import ConfigAlive from './ConfigAlive';
import ConfigAutocomplete from './ConfigAutocomplete';
import ConfigAutocompleteSendTo from './ConfigAutocompleteSendTo';
import ConfigCRON from './ConfigCRON';
import ConfigCertificateSelect from './ConfigCertificateSelect';
import ConfigCertificates from './ConfigCertificates';
import ConfigCertCollection from './ConfigCertCollection';
import ConfigCheckLicense from './ConfigCheckLicense';
import ConfigCheckbox from './ConfigCheckbox';
import ConfigChip from './ConfigChip';
import ConfigColor from './ConfigColor';
import ConfigCoordinates from './ConfigCoordinates';
import ConfigCustom from './ConfigCustom';
import ConfigDatePicker from './ConfigDatePicker';
import ConfigDeviceManager from './ConfigDeviceManager';
import ConfigFile from './ConfigFile';
import ConfigFileSelector from './ConfigFileSelector';
import ConfigFunc from './ConfigFunc';
import ConfigIP from './ConfigIP';
import ConfigImageSendTo from './ConfigImageSendTo';
import ConfigImageUpload from './ConfigImageUpload';
import ConfigInstanceSelect from './ConfigInstanceSelect';
import ConfigInterface from './ConfigInterface';
import ConfigJsonEditor from './ConfigJsonEditor';
import ConfigLanguage from './ConfigLanguage';
import ConfigLicense from './ConfigLicense';
import ConfigNumber from './ConfigNumber';
import ConfigObjectId from './ConfigObjectId';
import ConfigPassword from './ConfigPassword';
import ConfigPattern from './ConfigPattern';
import ConfigPort from './ConfigPort';
import ConfigRoom from './ConfigRoom';
import ConfigSelect from './ConfigSelect';
import ConfigSelectSendTo from './ConfigSelectSendTo';
import ConfigSendto from './ConfigSendto';
import ConfigSetState from './ConfigSetState';
import ConfigSlider from './ConfigSlider';
import ConfigStaticDivider from './ConfigStaticDivider';
import ConfigStaticHeader from './ConfigStaticHeader';
import ConfigStaticImage from './ConfigStaticImage';
import ConfigStaticText from './ConfigStaticText';
// eslint-disable-next-line import/no-cycle
import ConfigTable from './ConfigTable';
import ConfigText from './ConfigText';
import ConfigTextSendTo from './ConfigTextSendTo';
import ConfigTimePicker from './ConfigTimePicker';
import ConfigTopic from './ConfigTopic';
import ConfigUUID from './ConfigUUID';
import ConfigUser from './ConfigUser';

const components = {
    accordion: ConfigAccordion,
    alive: ConfigAlive,
    autocomplete: ConfigAutocomplete,
    autocompleteSendTo: ConfigAutocompleteSendTo,
    certCollection: ConfigCertCollection,
    certificate: ConfigCertificateSelect,
    certificates: ConfigCertificates,
    checkbox: ConfigCheckbox,
    checkLicense: ConfigCheckLicense,
    chip: ConfigChip, // deprecated. Use "chips"
    chips: ConfigChip,
    color: ConfigColor,
    coordinates: ConfigCoordinates,
    cron: ConfigCRON,
    custom: ConfigCustom,
    datePicker: ConfigDatePicker,
    deviceManager: ConfigDeviceManager,
    divider: ConfigStaticDivider,
    file: ConfigFile,
    fileSelector: ConfigFileSelector,
    func: ConfigFunc,
    header: ConfigStaticHeader,
    image: ConfigImageUpload,
    imageSendTo: ConfigImageSendTo,
    instance: ConfigInstanceSelect,
    interface: ConfigInterface,
    ip: ConfigIP,
    jsonEditor: ConfigJsonEditor,
    language: ConfigLanguage,
    license: ConfigLicense,
    number: ConfigNumber,
    objectId: ConfigObjectId,
    password: ConfigPassword,
    pattern: ConfigPattern,
    port: ConfigPort,
    room: ConfigRoom,
    select: ConfigSelect,
    selectSendTo: ConfigSelectSendTo,
    sendto: ConfigSendto,
    sendTo: ConfigSendto,
    setState: ConfigSetState,
    slider: ConfigSlider,
    staticImage: ConfigStaticImage,
    staticLink: ConfigStaticText,
    staticText: ConfigStaticText,
    table: ConfigTable,
    text: ConfigText,
    textSendTo: ConfigTextSendTo,
    timePicker: ConfigTimePicker,
    topic: ConfigTopic,
    uuid: ConfigUUID,
    user: ConfigUser,
};

const styles: Record<string, any> = (theme: IobTheme) => ({
    fullWidth: {
        width: '100%',
        // height: '100%',
    },
    paper: {
        margin: 10,
        height: 'calc(100vh - 235px) !important',
        width: 'auto !important',
        overflowY: 'auto',
        paddingBottom: theme.spacing(1),
    },
    padding: {
        padding: 10,
    },
    heading: {

    },
    primary: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.mode === 'dark' ? 'inherit' : '#FFF',
    },
    secondary: {
        backgroundColor: theme.palette.secondary.main,
    },
});

interface ConfigPanelProps extends ConfigGenericProps {
    schema: ConfigItemPanel;
}
interface ConfigPanelState extends ConfigGenericState {
    expanded?: boolean;
}

class ConfigPanel extends ConfigGeneric<ConfigPanelProps, ConfigPanelState> {
    componentDidMount() {
        super.componentDidMount();
        if (this.props.schema && this.props.schema.collapsable) {
            this.setState({ expanded: ((window as any)._localStorage as Storage || window.localStorage).getItem(`${this.props.adapterName}.${this.props.attr}`) === 'true' });
        }
    }

    renderItems(items: Record<string, any>, disabled: boolean) {
        const classes = this.props.classes || {};

        return items ? Object.keys(items).map(attr => {
            if (this.props.multiEdit && items[attr].noMultiEdit) {
                return null;
            }

            const type = items[attr].type || 'panel';
            let ItemComponent;
            if (type === 'custom') {
                // name
                // url
                if (items[attr].url) {
                    ItemComponent = ConfigCustom;
                } else if (this.props.customs && this.props.customs[items[attr].component]) {
                    ItemComponent = this.props.customs[items[attr].component];
                } else {
                    console.error(`Cannot find custom component: ${items[attr].component}`);
                    ItemComponent = ConfigGeneric;
                }
            } else if (type === 'panel') {
                // eslint-disable-next-line no-use-before-define
                ItemComponent = ConfigPanelStyled;
            } else {
                ItemComponent = (components as Record<string, JSXElementConstructor<any>>)[type] || ConfigGeneric;
            }

            // @ts-expect-error how to solve it?
            return <ItemComponent
                key={`${attr}_${this.props.index === undefined ? '' : this.props.index}`}
                index={this.props.index}
                changed={this.props.changed}
                arrayIndex={this.props.arrayIndex}
                globalData={this.props.globalData}
                onCommandRunning={this.props.onCommandRunning}
                commandRunning={this.props.commandRunning}
                className={classes.panel}
                socket={this.props.socket}
                adapterName={this.props.adapterName}
                instance={this.props.instance}
                common={this.props.common}
                customs={this.props.customs}
                alive={this.props.alive}
                themeType={this.props.themeType}
                themeName={this.props.themeName}
                data={this.props.data}
                originalData={this.props.originalData}
                systemConfig={this.props.systemConfig}
                onError={this.props.onError}
                onChange={this.props.onChange}
                multiEdit={this.props.multiEdit}
                dateFormat={this.props.dateFormat}
                isFloatComma={this.props.isFloatComma}
                disabled={disabled}
                imagePrefix={this.props.imagePrefix}
                changeLanguage={this.props.changeLanguage}
                forceUpdate={this.props.forceUpdate}
                registerOnForceUpdate={this.props.registerOnForceUpdate}
                customObj={this.props.customObj}
                instanceObj={this.props.instanceObj}
                custom={this.props.custom}
                schema={items[attr]}
                attr={attr}
                table={this.props.table}
            />;
        }) : null;
    }

    render(): React.JSX.Element | null {
        const schema = this.props.schema;

        if (!schema) {
            return null;
        }

        const { disabled, hidden } = this.calculate(schema);

        const items   = this.props.schema.items;
        const classes = this.props.classes || {};
        const style = this.props.schema.style || {};

        if (hidden) {
            if (schema.hideOnlyControl) {
                const item = <Grid
                    item
                    xs={schema.xs || undefined}
                    lg={schema.lg || undefined}
                    md={schema.md || undefined}
                    sm={schema.sm || undefined}
                    style={({
                        marginBottom: 0, /* marginRight: 8, */
                        textAlign: 'left',
                        ...schema.style,
                        ...(this.props.themeType === 'dark' ? schema.darkStyle : {}),
                    })}
                />;

                if (schema.newLine) {
                    return <>
                        <div style={{ flexBasis: '100%', height: 0 }} />
                        {item}
                    </>;
                }
                return item;
            }
            return null;
        }

        if (this.props.table) {
            return this.renderItems(items, disabled) as any as React.JSX.Element;
        }

        if (this.props.custom) {
            return <Grid
                key={`${this.props.attr}_${this.props.index}`}
                container
                className={classes.fullWidth}
                spacing={2}
                style={style}
            >
                {this.renderItems(items, disabled)}
            </Grid>;
        }

        let content;
        if (schema.collapsable) {
            content = <Accordion
                key={`${this.props.attr}_${this.props.index}`}
                className={classes.fullWidth}
                expanded={!!this.state.expanded}
                onChange={() => {
                    ((window as any)._localStorage as Storage || window.localStorage).setItem(`${this.props.adapterName}.${this.props.attr}`, this.state.expanded ? 'false' : 'true');
                    this.setState({ expanded: !this.state.expanded });
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    style={({ ...schema.style, ...(this.props.themeType ? schema.darkStyle : {}) })}
                    className={Utils.clsx(classes.fullWidth, schema.color === 'primary' && classes.primary, schema.color === 'secondary' && classes.secondary)}
                >
                    <Typography className={classes.heading}>{this.getText(schema.label)}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container className={`${classes.fullWidth} ${classes.padding}`} spacing={2} style={style}>
                        {this.renderItems(items, disabled)}
                    </Grid>
                </AccordionDetails>
            </Accordion>;
        } else {
            content = <div
                key={`${this.props.attr}_${this.props.index}`}
                className={Utils.clsx(this.props.className, this.props.isParentTab && classes.paper, classes.fullWidth)}
                style={style}
            >
                <Grid
                    container
                    className={Utils.clsx(classes.fullWidth, this.props.isParentTab && classes.padding)}
                    spacing={2}
                    style={this.props.schema.innerStyle}
                >
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
                style={({ marginBottom: 0, /* marginRight: 8, */textAlign: 'left', ...schema.style })}
            >
                {content}
            </Grid>;

            if (schema.newLine) {
                return <>
                    <div style={{ flexBasis: '100%', height: 0 }} />
                    {item}
                </>;
            }
            return item;
        }
        return content;
    }
}

const ConfigPanelStyled = withStyles(styles)(ConfigPanel);

export default ConfigPanelStyled;
