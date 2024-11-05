import React, { type JSX } from 'react';

import { Grid2, Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';

import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

import { type IobTheme } from '@iobroker/adapter-react-v5';
import type { ConfigItemPanel } from '#JC/types';
import Utils from '#JC/Utils';

import ConfigGeneric, { type ConfigGenericState, type ConfigGenericProps } from './ConfigGeneric';
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
import ConfigSendTo from './ConfigSendto';
import ConfigSetState from './ConfigSetState';
import ConfigSlider from './ConfigSlider';
import ConfigState from './ConfigState';
import ConfigStaticDivider from './ConfigStaticDivider';
import ConfigStaticHeader from './ConfigStaticHeader';
import ConfigStaticImage from './ConfigStaticImage';
import ConfigStaticText from './ConfigStaticText';
import ConfigTable from './ConfigTable';
import ConfigText from './ConfigText';
import ConfigTextSendTo from './ConfigTextSendTo';
import ConfigTimePicker from './ConfigTimePicker';
import ConfigTopic from './ConfigTopic';
import ConfigUUID from './ConfigUUID';
import ConfigUser from './ConfigUser';
import ConfigQrCode from './ConfigQrCode';

const components: Record<string, typeof ConfigGeneric<any, any>> = {
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
    qrCode: ConfigQrCode,
    room: ConfigRoom,
    select: ConfigSelect,
    selectSendTo: ConfigSelectSendTo,
    // @deprecated Use "sendTo"
    sendto: ConfigSendTo,
    sendTo: ConfigSendTo,
    setState: ConfigSetState,
    slider: ConfigSlider,
    state: ConfigState,
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

const styles: Record<string, any> = {
    fullWidth: {
        width: '100%',
        // height: '100%',
    },
    paper: {
        margin: 1,
        width: 'auto !important',
        overflowY: 'auto',
        paddingBottom: 1,
    },
    paperWithIcons: {
        height: 'calc(100vh - 259px) !important',
    },
    paperWithoutIcons: {
        height: 'calc(100vh - 235px) !important',
    },
    padding: {
        padding: '10px',
    },
    heading: {},
    primary: (theme: IobTheme) => ({
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.mode === 'dark' ? 'inherit' : '#FFF',
    }),
    secondary: (theme: IobTheme) => ({
        backgroundColor: theme.palette.secondary.main,
    }),
};

interface ConfigPanelProps extends ConfigGenericProps {
    schema: ConfigItemPanel;
    withIcons?: boolean;
}
interface ConfigPanelState extends ConfigGenericState {
    expanded?: boolean;
}

class ConfigPanel extends ConfigGeneric<ConfigPanelProps, ConfigPanelState> {
    componentDidMount(): void {
        super.componentDidMount();
        if (this.props.schema && this.props.schema.collapsable) {
            this.setState({
                expanded:
                    (((window as any)._localStorage as Storage) || window.localStorage).getItem(
                        `${this.props.adapterName}.${this.props.attr}`,
                    ) === 'true',
            });
        }
    }

    renderItems(items: Record<string, any>, disabled: boolean): JSX.Element[] | null {
        return items
            ? Object.keys(items).map(attr => {
                  if (this.props.multiEdit && items[attr].noMultiEdit) {
                      return null;
                  }

                  const type = items[attr].type || 'panel';
                  let ItemComponent: typeof ConfigGeneric<any, any>;
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
                      ItemComponent = ConfigPanel;
                  } else {
                      ItemComponent = components[type] || ConfigGeneric;
                  }

                  return (
                      <ItemComponent
                          key={`${attr}_${this.props.index === undefined ? '' : this.props.index}`}
                          index={this.props.index}
                          changed={this.props.changed}
                          arrayIndex={this.props.arrayIndex}
                          globalData={this.props.globalData}
                          onCommandRunning={this.props.onCommandRunning}
                          commandRunning={this.props.commandRunning}
                          style={styles.panel}
                          socket={this.props.socket}
                          adapterName={this.props.adapterName}
                          instance={this.props.instance}
                          common={this.props.common}
                          customs={this.props.customs}
                          alive={this.props.alive}
                          themeType={this.props.themeType}
                          themeName={this.props.themeName}
                          theme={this.props.theme}
                          data={this.props.data}
                          originalData={this.props.originalData}
                          systemConfig={this.props.systemConfig}
                          onError={this.props.onError}
                          onChange={this.props.onChange}
                          onBackEndCommand={this.props.onBackEndCommand}
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
                          DeviceManager={this.props.DeviceManager}
                          attr={attr}
                          table={this.props.table}
                      />
                  );
              })
            : null;
    }

    render(): JSX.Element | null {
        const schema = this.props.schema;

        if (!schema) {
            return null;
        }

        const { disabled, hidden } = this.calculate(schema);

        const items = this.props.schema.items;
        const schemaStyle = this.props.schema.style || {};

        if (hidden) {
            if (schema.hideOnlyControl) {
                const item = (
                    <Grid2
                        size={{
                            xs: schema.xs || undefined,
                            sm: schema.sm || undefined,
                            md: schema.md || undefined,
                            lg: schema.lg || undefined,
                            xl: schema.xl || undefined,
                        }}
                        sx={Utils.getStyle(
                            this.props.theme,
                            { marginBottom: 0, textAlign: 'left' /* marginRight: 8, */ },
                            schemaStyle,
                            this.props.themeType === 'dark' && schema.darkStyle,
                        )}
                    />
                );

                if (schema.newLine) {
                    return (
                        <>
                            <div style={{ flexBasis: '100%', height: 0 }} />
                            {item}
                        </>
                    );
                }
                return item;
            }
            return null;
        }

        if (this.props.table) {
            return this.renderItems(items, disabled) as any as JSX.Element;
        }

        if (this.props.custom) {
            return (
                <Grid2
                    key={`${this.props.attr}_${this.props.index}`}
                    container
                    style={styles.fullWidth}
                    columnSpacing={2}
                    rowSpacing={1}
                    sx={schemaStyle}
                >
                    {this.renderItems(items, disabled)}
                </Grid2>
            );
        }

        let content;
        if (schema.collapsable) {
            content = (
                <Accordion
                    key={`${this.props.attr}_${this.props.index}`}
                    style={styles.fullWidth}
                    expanded={!!this.state.expanded}
                    onChange={() => {
                        (((window as any)._localStorage as Storage) || window.localStorage).setItem(
                            `${this.props.adapterName}.${this.props.attr}`,
                            this.state.expanded ? 'false' : 'true',
                        );
                        this.setState({ expanded: !this.state.expanded });
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={Utils.getStyle(
                            this.props.theme,
                            schemaStyle,
                            this.props.themeType && schema.darkStyle,
                            schema.color === 'primary'
                                ? styles.primary
                                : schema.color === 'secondary' && styles.secondary,
                            { width: '100%' },
                        )}
                    >
                        <Typography style={styles.heading}>{this.getText(schema.label)}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid2
                            container
                            columnSpacing={2}
                            rowSpacing={1}
                            sx={{ ...schemaStyle, width: '100%', padding: '10px' }}
                        >
                            {this.renderItems(items, disabled)}
                        </Grid2>
                    </AccordionDetails>
                </Accordion>
            );
        } else {
            content = (
                <Box
                    component="div"
                    key={`${this.props.attr}_${this.props.index}`}
                    className={this.props.className}
                    sx={Utils.getStyle(
                        this.props.theme,
                        this.props.style,
                        schemaStyle,
                        { width: '100%' },
                        this.props.isParentTab && styles.paper,
                        this.props.isParentTab &&
                            (this.props.withIcons ? styles.paperWithIcons : styles.paperWithoutIcons),
                    )}
                >
                    <Grid2
                        container
                        columnSpacing={2}
                        rowSpacing={1}
                        sx={Utils.getStyle(
                            this.props.theme,
                            { width: '100%' },
                            this.props.isParentTab && styles.padding,
                            this.props.schema.innerStyle,
                        )}
                    >
                        {this.renderItems(items, disabled)}
                    </Grid2>
                </Box>
            );
        }

        if (!this.props.isParentTab) {
            const item = (
                <Grid2
                    title={this.getText(schema.tooltip)}
                    size={{
                        xs: schema.xs || undefined,
                        sm: schema.sm || undefined,
                        md: schema.md || undefined,
                        lg: schema.lg || undefined,
                        xl: schema.xl || undefined,
                    }}
                    sx={{ marginBottom: 0, /* marginRight: 8, */ textAlign: 'left', ...schemaStyle }}
                >
                    {content}
                </Grid2>
            );

            if (schema.newLine) {
                return (
                    <>
                        <div style={{ flexBasis: '100%', height: 0 }} />
                        {item}
                    </>
                );
            }
            return item;
        }
        return content;
    }
}

export default ConfigPanel;
