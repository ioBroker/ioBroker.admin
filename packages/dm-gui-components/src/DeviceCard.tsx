import React, { Component, type JSX } from 'react';

import {
    Button,
    Typography,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    Fab,
    DialogTitle,
    Card,
    CardActions,
    CardHeader,
    CardContent,
    Paper,
    Box,
} from '@mui/material';

import { MoreVert as MoreVertIcon, VideogameAsset as ControlIcon, Close as CloseIcon } from '@mui/icons-material';

import {
    Utils,
    type Connection,
    I18n,
    type ThemeName,
    type ThemeType,
    type IobTheme,
    IconDeviceType,
} from '@iobroker/adapter-react-v5';
import type { DeviceDetails, DeviceInfo, ActionBase, ControlBase, ControlState } from '@iobroker/dm-utils';

import DeviceActionButton from './DeviceActionButton';
import DeviceControlComponent from './DeviceControl';
import DeviceStatusComponent from './DeviceStatus';
import JsonConfig from './JsonConfig';
import DeviceImageUpload from './DeviceImageUpload';
import { getTranslation } from './Utils';
import type { ConfigItemPanel, ConfigItemTabs } from '@iobroker/json-config';

function NoImageIcon(props: { style?: React.CSSProperties; className?: string }): JSX.Element {
    return (
        <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            style={props.style}
            className={props.className}
        >
            <path
                fill="currentColor"
                d="M21.9,21.9l-8.49-8.49l0,0L3.59,3.59l0,0L2.1,2.1L0.69,3.51L3,5.83V19c0,1.1,0.9,2,2,2h13.17l2.31,2.31L21.9,21.9z M5,18 l3.5-4.5l2.5,3.01L12.17,15l3,3H5z M21,18.17L5.83,3H19c1.1,0,2,0.9,2,2V18.17z"
            />
        </svg>
    );
}

interface DeviceCardProps {
    title?: string;
    /* Device ID */
    id: string;
    device: DeviceInfo;
    instanceId: string;
    socket: Connection;
    /* Instance, where the images should be uploaded to */
    uploadImagesToInstance?: string;
    deviceHandler: (deviceId: string, action: ActionBase, refresh: () => void) => () => void;
    controlHandler: (
        deviceId: string,
        control: ControlBase,
        state: ControlState,
    ) => () => Promise<ioBroker.State | null>;
    controlStateHandler: (deviceId: string, control: ControlBase) => () => Promise<ioBroker.State | null>;
    smallCards?: boolean;
    alive: boolean;
    themeName: ThemeName;
    themeType: ThemeType;
    theme: IobTheme;
    isFloatComma: boolean;
    dateFormat: string;
}

function getText(text: ioBroker.StringOrTranslated | undefined): string | undefined {
    if (typeof text === 'object') {
        return text[I18n.getLanguage()] || text.en;
    }

    return text;
}

interface DeviceCardState {
    open: boolean;
    details: DeviceDetails | null;
    data: Record<string, any>;
    icon: string | undefined;
    showControlDialog: boolean;
}

/**
 * Device Card Component
 */
class DeviceCard extends Component<DeviceCardProps, DeviceCardState> {
    constructor(props: DeviceCardProps) {
        super(props);

        this.state = {
            open: false,
            details: null,
            data: {},
            icon: props.device.icon,
            showControlDialog: false,
        };
    }

    async fetchIcon(): Promise<void> {
        if (!this.props.device.icon) {
            const lang = I18n.getLanguage();
            const manufacturer =
                this.props.device.manufacturer && typeof this.props.device.manufacturer === 'object'
                    ? this.props.device.manufacturer[lang] || this.props.device.manufacturer.en
                    : this.props.device.manufacturer;
            const model =
                this.props.device.model && typeof this.props.device.model === 'object'
                    ? this.props.device.model[lang] || this.props.device.model.en
                    : this.props.device.model;

            // try to load the icon from file storage
            const fileName = `${manufacturer ? `${manufacturer}_` : ''}${model || this.props.device.id}`;

            try {
                const file = await this.props.socket.readFile(
                    this.props.instanceId.replace('system.adapter.', ''),
                    `${fileName}.webp`,
                    true,
                );
                if (file) {
                    this.setState({ icon: `data:image/${file.mimeType},${file.file}` });
                } else {
                    this.setState({ icon: '' });
                }
                // const response = await fetch(url);
                // if (response.ok) {
                //     const blob = await response.blob();
                //     const reader = new FileReader();
                //     reader.onloadend = () => {
                //         setIcon(reader.result);
                //     };
                //     reader.readAsDataURL(blob);
                // } else {
                //     throw new Error('Response not ok');
                // }
            } catch {
                if (this.state.icon) {
                    this.setState({ icon: '' });
                }
            }
        }
    }

    componentDidMount(): void {
        this.fetchIcon().catch(e => console.error(e));
    }

    /**
     * Load the device details
     */
    async loadDetails(): Promise<void> {
        console.log(`Loading device details for ${this.props.device.id}... from ${this.props.instanceId}`);
        const details: DeviceDetails | null = await this.props.socket.sendTo(
            this.props.instanceId,
            'dm:deviceDetails',
            this.props.device.id,
        );
        console.log(`Got device details for ${this.props.device.id}:`, details);
        this.setState({ details, data: details?.data || {} });
    }

    /**
     * Refresh the device details
     */
    refresh = (): void => {
        this.setState({ details: null });
        this.loadDetails().catch(console.error);
    };

    /**
     * Copy the device ID to the clipboard
     */
    copyToClipboard = (): void => {
        const textToCopy = this.props.device.id;
        Utils.copyToClipboard(textToCopy);
        alert(`${getTranslation('copied')} ${textToCopy} ${getTranslation('toClipboard')}!`);
    };

    renderDialog(): JSX.Element | null {
        if (!this.state.open || !this.state.details) {
            return null;
        }

        return (
            <Dialog
                open={!0}
                maxWidth="md"
                onClose={() => this.setState({ open: false })}
            >
                <DialogContent>
                    <JsonConfig
                        instanceId={this.props.instanceId}
                        socket={this.props.socket}
                        schema={this.state.details.schema as ConfigItemPanel | ConfigItemTabs}
                        data={this.state.data}
                        onChange={(data: Record<string, any>) => this.setState({ data })}
                        themeName={this.props.themeName}
                        themeType={this.props.themeType}
                        theme={this.props.theme}
                        isFloatComma={this.props.isFloatComma}
                        dateFormat={this.props.dateFormat}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={!this.props.alive}
                        variant="contained"
                        color="primary"
                        onClick={() => this.setState({ open: false })}
                        autoFocus
                    >
                        {getTranslation('closeButtonText')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    renderControlDialog(): JSX.Element | null {
        if (!this.state.showControlDialog || !this.props.alive) {
            return null;
        }
        const colors = { primary: '#111', secondary: '#888' };
        return (
            <Dialog
                open={!0}
                onClose={() => this.setState({ showControlDialog: false })}
            >
                <DialogTitle>
                    {this.props.title}
                    <IconButton
                        style={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            zIndex: 10,
                        }}
                        onClick={() => this.setState({ showControlDialog: false })}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
                    {this.props.device.controls?.map(control => (
                        <DeviceControlComponent
                            disabled={false}
                            key={control.id}
                            control={control}
                            socket={this.props.socket}
                            colors={colors}
                            deviceId={this.props.device.id}
                            controlHandler={this.props.controlHandler}
                            controlStateHandler={this.props.controlStateHandler}
                        />
                    ))}
                </DialogContent>
            </Dialog>
        );
    }

    renderControls(): JSX.Element | null {
        const colors = { primary: '#111', secondary: '#888' };
        const firstControl = this.props.device.controls?.[0];
        if (
            this.props.device.controls?.length === 1 &&
            firstControl &&
            (firstControl.type === 'icon' || firstControl.type === 'switch') &&
            !firstControl.label
        ) {
            // control can be placed in button icon
            return (
                <DeviceControlComponent
                    disabled={!this.props.alive}
                    control={firstControl}
                    colors={colors}
                    socket={this.props.socket}
                    deviceId={this.props.device.id}
                    controlHandler={this.props.controlHandler}
                    controlStateHandler={this.props.controlStateHandler}
                />
            );
        }

        if (this.props.device.controls?.length) {
            // place button and show controls dialog
            return (
                <Fab
                    size="small"
                    disabled={!this.props.alive}
                    onClick={() => this.setState({ showControlDialog: true })}
                >
                    <ControlIcon />
                </Fab>
            );
        }
        return null;
    }

    renderActions(): JSX.Element[] | null {
        return this.props.device.actions?.length
            ? this.props.device.actions.map(a => (
                  <DeviceActionButton
                      disabled={!this.props.alive}
                      key={a.id}
                      deviceId={this.props.device.id}
                      action={a}
                      deviceHandler={this.props.deviceHandler}
                      refresh={this.refresh}
                  />
              ))
            : null;
    }

    renderSmall(): JSX.Element {
        const hasDetails = this.props.device.hasDetails;
        const status = !this.props.device.status
            ? []
            : Array.isArray(this.props.device.status)
              ? this.props.device.status
              : [this.props.device.status];

        const icon = this.state.icon ? <IconDeviceType src={this.state.icon} /> : <NoImageIcon />;

        return (
            <Card
                sx={{
                    maxWidth: 345,
                    minWidth: 200,
                }}
            >
                <CardHeader
                    sx={theme => ({
                        backgroundColor: this.props.device.color || theme.palette.secondary.main,
                        color: this.props.device.color
                            ? Utils.invertColor(this.props.device.color, true)
                            : theme.palette.secondary.contrastText,
                        maxWidth: 345,
                    })}
                    avatar={
                        <div>
                            {this.props.uploadImagesToInstance ? (
                                <DeviceImageUpload
                                    uploadImagesToInstance={this.props.uploadImagesToInstance}
                                    deviceId={this.props.device.id}
                                    manufacturer={getText(this.props.device.manufacturer)}
                                    model={getText(this.props.device.model)}
                                    onImageSelect={(imageData: string): void => {
                                        if (imageData) {
                                            this.setState({ icon: imageData });
                                        }
                                    }}
                                    socket={this.props.socket}
                                />
                            ) : null}
                            {icon}
                        </div>
                    }
                    action={
                        hasDetails ? (
                            <IconButton
                                aria-label="settings"
                                onClick={() => {
                                    if (!this.state.open) {
                                        this.loadDetails().catch(console.error);
                                        this.setState({ open: true });
                                    }
                                }}
                            >
                                <MoreVertIcon />
                            </IconButton>
                        ) : null
                    }
                    title={this.props.title}
                    subheader={
                        this.props.device.manufacturer ? (
                            <span>
                                <b style={{ marginRight: 4 }}>{getTranslation('manufacturer')}:</b>
                                {getText(this.props.device.manufacturer)}
                            </span>
                        ) : null
                    }
                />
                <CardContent style={{ position: 'relative' }}>
                    {status?.length ? (
                        <div
                            style={{
                                display: 'flex',
                                position: 'absolute',
                                top: -11,
                                background: '#88888880',
                                padding: '0 8px',
                                borderRadius: 5,
                                width: 'calc(100% - 46px)',
                            }}
                        >
                            {status.map((s, i) => (
                                <DeviceStatusComponent
                                    key={i}
                                    status={s}
                                />
                            ))}
                        </div>
                    ) : null}
                    <div>
                        <Typography variant="body1">
                            <div
                                onClick={this.copyToClipboard}
                                style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
                            >
                                <b>ID:</b>
                                <span style={{ marginLeft: 4 }}>{this.props.device.id.replace(/.*\.\d\./, '')}</span>
                            </div>
                            {this.props.device.manufacturer ? (
                                <div>
                                    <b style={{ marginRight: 4 }}>{getTranslation('manufacturer')}:</b>
                                    {getText(this.props.device.manufacturer)}
                                </div>
                            ) : null}
                            {this.props.device.model ? (
                                <div>
                                    <b style={{ marginRight: 4 }}>{getTranslation('model')}:</b>
                                    {getText(this.props.device.model)}
                                </div>
                            ) : null}
                        </Typography>
                    </div>
                </CardContent>
                <CardActions disableSpacing>
                    {this.renderActions()}
                    <div style={{ flexGrow: 1 }} />
                    {this.renderControls()}
                </CardActions>
                {this.renderDialog()}
                {this.renderControlDialog()}
            </Card>
        );
    }

    renderBig(): JSX.Element {
        const cardStyle: React.CSSProperties = {
            width: 300,
            minHeight: 280,
            margin: 10,
            overflow: 'hidden',
            display: 'inline-block',
        };
        const headerStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 8,
            position: 'relative',
            minHeight: 60,
            color: '#000',
        };
        const imgAreaStyle: React.CSSProperties = {
            height: 45,
            width: 45,
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
        };
        const imgStyle: React.CSSProperties = {
            zIndex: 2,
            maxWidth: '100%',
            maxHeight: '100%',
            color: '#FFF',
        };
        const titleStyle: React.CSSProperties = {
            fontSize: 16,
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        };
        const detailsButtonStyle: React.CSSProperties = {
            right: 20,
            bottom: -20,
            position: 'absolute',
        };
        const bodyStyle: React.CSSProperties = {
            height: 'calc(100% - 116px)',
        };
        const deviceInfoStyle: React.CSSProperties = {
            padding: '20px 16px 0 16px',
            height: 133,
        };
        const statusStyle: React.CSSProperties = {
            padding: '15px 15px 0 15px',
            height: 41,
        };
        const status = !this.props.device.status
            ? []
            : Array.isArray(this.props.device.status)
              ? this.props.device.status
              : [this.props.device.status];

        const icon = this.state.icon ? (
            <IconDeviceType
                src={this.state.icon}
                style={imgStyle}
            />
        ) : (
            <NoImageIcon style={imgStyle} />
        );

        const title: string = this.state.details?.data?.name || this.props.title || '';

        return (
            <Paper
                style={cardStyle}
                key={this.props.id}
            >
                <Box
                    sx={theme => ({ backgroundColor: theme.palette.secondary.main })}
                    style={headerStyle}
                >
                    <div style={imgAreaStyle}>
                        {this.props.uploadImagesToInstance ? (
                            <DeviceImageUpload
                                uploadImagesToInstance={this.props.uploadImagesToInstance}
                                deviceId={this.props.device.id}
                                manufacturer={getText(this.props.device.manufacturer)}
                                model={getText(this.props.device.model)}
                                onImageSelect={(imageData: string): void => {
                                    if (imageData) {
                                        this.setState({ icon: imageData });
                                    }
                                }}
                                socket={this.props.socket}
                            />
                        ) : null}
                        {icon}
                    </div>
                    <Box
                        style={titleStyle}
                        title={title.length > 20 ? title : undefined}
                        sx={theme => ({ color: theme.palette.secondary.contrastText })}
                    >
                        {this.state.details?.data?.name || this.props.title}
                    </Box>
                    {this.props.device.hasDetails ? (
                        <Fab
                            disabled={!this.props.alive}
                            size="small"
                            style={detailsButtonStyle}
                            onClick={() => {
                                if (!this.state.open) {
                                    this.loadDetails().catch(console.error);
                                    this.setState({ open: true });
                                }
                            }}
                            color="primary"
                        >
                            <MoreVertIcon />
                        </Fab>
                    ) : null}
                </Box>
                <div style={statusStyle}>
                    {status.map((s, i) => (
                        <DeviceStatusComponent
                            key={i}
                            status={s}
                        />
                    ))}
                </div>
                <div style={bodyStyle}>
                    <Typography
                        variant="body1"
                        style={deviceInfoStyle}
                    >
                        <div onClick={this.copyToClipboard}>
                            <b style={{ marginRight: 4 }}>ID:</b>
                            {this.props.device.id.replace(/.*\.\d\./, '')}
                        </div>
                        {this.props.device.manufacturer ? (
                            <div>
                                <b style={{ marginRight: 4 }}>{getTranslation('manufacturer')}:</b>
                                {getText(this.props.device.manufacturer)}
                            </div>
                        ) : null}
                        {this.props.device.model ? (
                            <div>
                                <b style={{ marginRight: 4 }}>{getTranslation('model')}:</b>
                                {getText(this.props.device.model)}
                            </div>
                        ) : null}
                    </Typography>
                    {!!this.props.device.actions?.length && (
                        <div
                            style={{
                                flex: 1,
                                position: 'relative',
                                display: 'flex',
                                gap: 8,
                                paddingBottom: 5,
                                height: 34,
                                paddingLeft: 10,
                                paddingRight: 10,
                            }}
                        >
                            {this.renderActions()}
                            <div style={{ flexGrow: 1 }} />
                            {this.renderControls()}
                        </div>
                    )}
                </div>
                {this.renderDialog()}
                {this.renderControlDialog()}
            </Paper>
        );
    }

    render(): JSX.Element {
        if (this.props.smallCards) {
            return this.renderSmall();
        }

        return this.renderBig();
    }
}

export default DeviceCard;
