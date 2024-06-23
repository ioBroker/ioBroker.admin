import React, { Component } from 'react';

import {
    Backdrop, Box,
    Button, Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle, FormControl,
    FormControlLabel,
    Grid, IconButton, Input,
    InputAdornment, InputLabel,
    LinearProgress, MenuItem,
    Select, Slider,
    Snackbar, TextField, Typography,
} from '@mui/material';

import { Close, Check } from '@mui/icons-material';

import type {
    Connection, AdminConnection,
    ThemeName, ThemeType, IobTheme
} from '@iobroker/adapter-react-v5';
import { type ConfigItemPanel } from '@iobroker/json-config';
import type { ActionBase } from '@iobroker/dm-utils/build/types/api';
import type { ControlBase, ControlState } from '@iobroker/dm-utils/build/types/base';
import type { DeviceRefresh } from '@iobroker/dm-utils/build/types';

import { getTranslation } from './Utils';
import JsonConfig from './JsonConfig';

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        grey: true;
    }
}

export type CommunicationProps = {
    /* socket object */
    socket: Connection;
    /* Instance to communicate with device-manager backend, like `adapterName.X` */
    selectedInstance: string; // adapterName.X
    registerHandler?: (handler: null | ((command: string) => void)) => void;
    themeName: ThemeName;
    themeType: ThemeType;
    theme: IobTheme;
    isFloatComma: boolean;
    dateFormat: string;
}

interface CommunicationForm {
    title?: string | null | undefined;
    schema?: ConfigItemPanel;
    data?: Record<string, any>;
    handleClose?: (data?: Record<string, any>) => void;
}

export type CommunicationState = {
    showSpinner: boolean;
    showToast: string | null;
    message: {
        message: string;
        handleClose: () => void;
    } | null;
    confirm: {
        message: string;
        handleClose: (confirmation?: boolean) => void;
    } | null;
    form: CommunicationForm | null;
    progress: {
        open: boolean;
        progress: number;
    } | null;
    showConfirmation: ActionBase | null;
    showInput: ActionBase | null;
    inputValue: string | boolean | number | null;
}

interface DmResponse {
    /* Type of message */
    type: 'message' | 'confirm' | 'progress' | 'result' | 'form';
    /* Origin */
    origin: string;
}

interface DmControlResponse extends DmResponse {
    result: {
        error?: {
            code: number;
            message: string;
        };
        state?: ioBroker.State;
        deviceId: string;
        controlId: string;
    };
}

interface DmActionResponse extends DmResponse {
    result: {
        refresh?: DeviceRefresh;
        error?: {
            code: number;
            message: string;
        };
    };
    message?: string;
    confirm?: string;
    form?: any;
    progress?: {
        open: boolean;
        progress: number;
    };
}

/**
 * Device List Component
 */
class Communication<P extends CommunicationProps, S extends CommunicationState> extends Component<P, S> {
    // eslint-disable-next-line react/no-unused-class-component-methods
    instanceHandler: (action: ActionBase) => () => void;

    // eslint-disable-next-line react/no-unused-class-component-methods
    deviceHandler: (deviceId: string, action: ActionBase, refresh: () => void) => () => void;

    // eslint-disable-next-line react/no-unused-class-component-methods
    controlHandler: (deviceId: string, control: ControlBase, state: ControlState) => () => Promise<ioBroker.State | null>;

    // eslint-disable-next-line react/no-unused-class-component-methods
    controlStateHandler: (deviceId: string, control: ControlBase) => () => Promise<ioBroker.State | null>;

    constructor(props: P) {
        super(props);

        this.state = {
            showSpinner: false,
            showToast: null,
            message: null,
            confirm: null,
            form: null,
            progress: null,
            showConfirmation: null,
            showInput: null,
            inputValue: null,
        } as S;

        // eslint-disable-next-line react/no-unused-class-component-methods
        this.instanceHandler = action => () => {
            if (action.confirmation) {
                return this.setState({ showConfirmation: action });
            }
            if (action.inputBefore) {
                this.setState({ showInput: action });
                return;
            }

            return this.sendActionToInstance('dm:instanceAction', { actionId: action.id });
        }

        // eslint-disable-next-line react/no-unused-class-component-methods
        this.deviceHandler = (deviceId, action, refresh) => () => {
            if (action.confirmation) {
                this.setState({ showConfirmation: action });
                return;
            }
            if (action.inputBefore) {
                this.setState({ showInput: action, inputValue: action.inputBefore.defaultValue || '' });
                return;
            }

            return this.sendActionToInstance('dm:deviceAction', { deviceId, actionId: action.id }, refresh);
        }

        // eslint-disable-next-line react/no-unused-class-component-methods
        this.controlHandler = (deviceId, control, state) => () => this.sendControlToInstance('dm:deviceControl', { deviceId, controlId: control.id, state });

        // eslint-disable-next-line react/no-unused-class-component-methods
        this.controlStateHandler = (deviceId, control) => () => this.sendControlToInstance('dm:deviceControlState', { deviceId, controlId: control.id });

        this.props.registerHandler && this.props.registerHandler(() => this.loadData());
    }

    // eslint-disable-next-line class-methods-use-this
    loadData(): void {
        console.error('loadData not implemented');
    }

    sendActionToInstance = (command: string, messageToSend: any, refresh?: () => void) => {
        const send = async () => {
            this.setState({ showSpinner: true });
            const response: DmActionResponse = await this.props.socket.sendTo(this.props.selectedInstance, command, messageToSend);

            const type: string = response.type;
            console.log(`Response: ${response.type}`);
            switch (type) {
                case 'message':
                    console.log(`Message received: ${response.message}`);
                    if (response.message) {
                        this.setState({
                            message: {
                                message: response.message,
                                handleClose: () => this.setState({ message: null }, () =>
                                    this.sendActionToInstance('dm:actionProgress', { origin: response.origin })),
                            },
                        });
                    }
                    break;

                case 'confirm':
                    console.log(`Confirm received: ${response.confirm}`);
                    if (response.confirm) {
                        this.setState({
                            confirm: {
                                message: response.confirm,
                                handleClose: (confirm?: boolean) => this.setState({ confirm: null }, () =>
                                    this.sendActionToInstance('dm:actionProgress', {
                                        origin: response.origin,
                                        confirm,
                                    })),
                            },
                        });
                    }
                    break;

                case 'form':
                    console.log('Form received');
                    if (response.form) {
                        this.setState({
                            form: {
                                ...response.form,
                                handleClose: (data: any) => this.setState({ form: null }, () => {
                                    console.log(`Form ${JSON.stringify(data)}`);
                                    this.sendActionToInstance('dm:actionProgress', {
                                        origin: response.origin,
                                        data,
                                    });
                                }),
                            },
                        });
                    }
                    break;

                case 'progress':
                    if (response.progress) {
                        if (this.state.progress) {
                            const progress = { ...this.state.progress, ...response.progress };
                            this.setState({ progress });
                        } else {
                            this.setState({ progress: response.progress });
                        }
                    }
                    this.sendActionToInstance('dm:actionProgress', { origin: response.origin });
                    break;

                case 'result':
                    console.log('Response content', response.result);
                    if (response.result.refresh) {
                        if (response.result.refresh === true) {
                            this.loadData();
                            console.log('Refreshing all');
                        } else if (response.result.refresh === 'instance') {
                            console.log(`Refreshing instance infos: ${this.props.selectedInstance}`);
                        } else if (response.result.refresh === 'device') {
                            if (refresh) {
                                console.log(`Refreshing device infos: ${this.props.selectedInstance}`);
                                refresh();
                            }
                        } else {
                            console.log('Not refreshing anything');
                        }
                    }
                    if (response.result.error) {
                        console.error(`Error: ${response.result.error}`);
                        this.setState({ showToast: response.result.error.message });
                    }
                    this.setState({ showSpinner: false });
                    break;

                default:
                    console.log(`Unknown response type: ${type}`);
                    this.setState({ showSpinner: false });
                    break;
            }
        };

        send().catch(console.error);
    };

    sendControlToInstance = async (command: string, messageToSend: { deviceId: string; controlId: string; state?: ControlState }) => {
        const response: DmControlResponse = await this.props.socket.sendTo(this.props.selectedInstance, command, messageToSend);
        const type = response.type;
        console.log(`Response: ${response.type}`);
        if (response.type === 'result') {
            console.log('Response content', response.result);
            if (response.result.error) {
                console.error(`Error: ${response.result.error}`);
                this.setState({ showToast: response.result.error.message });
            } else if (response.result.state !== undefined) {
                return response.result.state;
            }
        } else {
            console.warn('Unexpected response type', type);
        }

        return null;
    };

    // eslint-disable-next-line react/no-unused-class-component-methods
    loadDevices() {
        return this.props.socket.sendTo(this.props.selectedInstance, 'dm:listDevices');
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    loadInstanceInfos() {
        return this.props.socket.sendTo(this.props.selectedInstance, 'dm:instanceInfo');
    }

    renderMessageDialog(): React.JSX.Element | null {
        if (!this.state.message) {
            return null;
        }

        return <Dialog
            open={!0}
            onClose={() => this.state.message?.handleClose()}
            hideBackdrop
            aria-describedby="message-dialog-description"
        >
            <DialogContent>
                <DialogContentText id="message-dialog-description">{this.state.message?.message}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    color="primary"
                    onClick={() => this.state.message?.handleClose()}
                    variant="contained"
                    autoFocus
                >
                    {getTranslation('okButtonText')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderConfirmDialog() {
        if (!this.state.confirm) {
            return null;
        }

        return <Dialog
            open={!0}
            onClose={() => this.state.confirm?.handleClose()}
            hideBackdrop
            aria-describedby="confirm-dialog-description"
        >
            <DialogContent>
                <DialogContentText id="confirm-dialog-description">
                    {getTranslation(this.state.confirm?.message)}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => this.state.confirm?.handleClose(true)}
                    autoFocus
                >
                    {getTranslation('yesButtonText')}
                </Button>
                <Button
                    variant="contained"
                    color="grey"
                    onClick={() => this.state.confirm?.handleClose(false)}
                    autoFocus
                >
                    {getTranslation('noButtonText')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderSnackbar() {
        return <Snackbar
            open={!!this.state.showToast}
            autoHideDuration={6000}
            onClose={() => this.setState({ showToast: null })}
            message={this.state.showToast}
        />;
    }

    renderFormDialog() {
        if (!this.state.form || !this.state.form.schema || !this.state.form.data) {
            return null;
        }
        return <Dialog open={!0} onClose={() => this.state.form?.handleClose && this.state.form.handleClose()} hideBackdrop>
            {this.state.form?.title ? <DialogTitle>{getTranslation(this.state.form?.title)}</DialogTitle> : null}
            <DialogContent>
                <JsonConfig
                    instanceId={this.props.selectedInstance}
                    schema={this.state.form.schema}
                    data={this.state.form.data}
                    socket={this.props.socket as AdminConnection}
                    onChange={(data: Record<string, any>) => {
                        console.log('handleFormChange', { data });
                        const form: CommunicationForm | null | undefined = { ...this.state.form };
                        if (form) {
                            form.data = data;
                            this.setState({ form });
                        }
                    }}
                    themeName={this.props.themeName}
                    themeType={this.props.themeType}
                    theme={this.props.theme}
                    isFloatComma={this.props.isFloatComma}
                    dateFormat={this.props.dateFormat}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => this.state.form?.handleClose && this.state.form.handleClose(this.state.form?.data)}
                    autoFocus
                >
                    {getTranslation('okButtonText')}
                </Button>
                <Button
                    variant="contained"
                    color="grey"
                    onClick={() => this.state.form?.handleClose && this.state.form.handleClose()}
                >
                    {getTranslation('cancelButtonText')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderProgressDialog() {
        if (!this.state.progress?.open) {
            return null;
        }

        return <Dialog
            open={!0}
            onClose={() => {}}
            hideBackdrop
        >
            <LinearProgress variant="determinate" value={this.state.progress?.progress || 0} />
        </Dialog>;
    }

    // eslint-disable-next-line class-methods-use-this
    renderContent(): React.JSX.Element | React.JSX.Element[] | null {
        return null;
    }

    renderSpinner() {
        if (!this.state.showSpinner && !this.state.progress?.open && !this.state.message && !this.state.confirm && !this.state.form) {
            return null;
        }
        return <Backdrop style={{ zIndex: 1000 }} open={!0}>
            <CircularProgress />
        </Backdrop>;
    }

    renderConfirmationDialog() {
        if (!this.state.showConfirmation) {
            return null;
        }
        return <Dialog
            open={!0}
            onClose={() => this.setState({ showConfirmation: null })}
        >
            <DialogTitle>{getTranslation(this.state.showConfirmation.confirmation === true ? getTranslation('areYouSureText') : getTranslation(this.state.showConfirmation.confirmation as ioBroker.StringOrTranslated))}</DialogTitle>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        this.setState({ showConfirmation: null }, () =>
                            this.sendActionToInstance('dm:instanceAction', { actionId: this.state.showConfirmation.id }));
                    }}
                    autoFocus
                    startIcon={<Check />}
                >
                    {getTranslation('yesButtonText')}
                </Button>
                <Button
                    variant="contained"
                    color="grey"
                    onClick={() => this.setState({ showConfirmation: null })}
                    startIcon={<Close />}
                >
                    {getTranslation('cancelButtonText')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderInputDialog() {
        if (!this.state.showInput || !this.state.showInput.inputBefore) {
            return null;
        }
        let okDisabled = false;
        if (!this.state.showInput.inputBefore.allowEmptyValue && this.state.showInput.inputBefore.type !== 'checkbox') {
            if (this.state.showInput.inputBefore.type === 'number' || this.state.showInput.inputBefore.type === 'slider') {
                okDisabled = this.state.inputValue === '' || this.state.inputValue === null || !window.isFinite(this.state.inputValue as number);
            } else {
                okDisabled = !this.state.inputValue;
            }
        }

        return <Dialog
            open={!0}
            onClose={() => this.setState({ showInput: null })}
        >
            <DialogTitle>{getTranslation('pleaseEnterValueText')}</DialogTitle>
            <DialogContent>
                {this.state.showInput.inputBefore.type === 'text' || this.state.showInput.inputBefore.type === 'number' || !this.state.showInput.inputBefore.type ? <TextField
                    autoFocus
                    margin="dense"
                    label={getTranslation(this.state.showInput.inputBefore.label)}
                    inputProps={this.state.showInput.inputBefore.type === 'number' ? {
                        min: this.state.showInput.inputBefore.min,
                        max: this.state.showInput.inputBefore.max,
                        step: this.state.showInput.inputBefore.step,
                    } : undefined}
                    type={this.state.showInput.inputBefore.type === 'number' ? 'number' : 'text'}
                    fullWidth
                    value={this.state.inputValue}
                    onChange={e => this.setState({ inputValue: e.target.value })}
                    InputProps={{
                        endAdornment: this.state.inputValue ? <InputAdornment position="end">
                            <IconButton
                                size="small"
                                onClick={() => this.setState({ inputValue: '' })}
                            >
                                <Close />
                            </IconButton>
                        </InputAdornment> : null,
                    }}
                /> : null}
                {this.state.showInput.inputBefore.type === 'checkbox' ? <FormControlLabel
                    control={<Checkbox
                        checked={!!this.state.inputValue}
                        autoFocus
                        onChange={e => this.setState({ inputValue: e.target.checked })}
                    />}
                    label={getTranslation(this.state.showInput.inputBefore.label)}
                /> : null}
                {this.state.showInput.inputBefore.type === 'select' ? <FormControl fullWidth>
                    <InputLabel>{getTranslation(this.state.showInput.inputBefore.label)}</InputLabel>
                    <Select
                        value={this.state.inputValue}
                        onChange={e => this.setState({ inputValue: e.target.value })}
                    >
                        {this.state.showInput.inputBefore.options.map(item =>
                            <MenuItem value={item.value}>{getTranslation(item.label)}</MenuItem>)}
                    </Select>
                </FormControl> : null}
                {this.state.showInput.inputBefore.type === 'slider' ? <Box sx={{ width: '100%' }}>
                    <Typography gutterBottom>
                        {getTranslation(this.state.showInput.inputBefore.label)}
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs>
                            <Slider
                                value={typeof this.state.inputValue === 'number' ? this.state.inputValue : 0}
                                onChange={(event: Event, newValue: number) => this.setState({ inputValue: newValue })}
                            />
                        </Grid>
                        <Grid item>
                            <Input
                                value={this.state.inputValue}
                                size="small"
                                onChange={e => this.setState({ inputValue: e.target.value === '' ? 0 : Number(e.target.value) })}
                                onBlur={() => {
                                    const min = this.state.showInput.inputBefore.min === undefined ? 0 : this.state.showInput.inputBefore.min;
                                    const max = this.state.showInput.inputBefore.max === undefined ? 100 : this.state.showInput.inputBefore.max;

                                    if ((this.state.inputValue as number) < min) {
                                        this.setState({ inputValue: min });
                                    } else if ((this.state.inputValue as number) > max) {
                                        this.setState({ inputValue: max });
                                    }
                                }}
                                inputProps={{
                                    step: this.state.showInput.inputBefore.step,
                                    min: this.state.showInput.inputBefore.min === undefined ? 0 : this.state.showInput.inputBefore.min,
                                    max: this.state.showInput.inputBefore.max === undefined ? 100 : this.state.showInput.inputBefore.max,
                                    type: 'number',
                                }}
                            />
                        </Grid>
                    </Grid>
                </Box> : null}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={okDisabled}
                    color="primary"
                    onClick={() => this.setState({ showInput: null }, () =>
                        this.sendActionToInstance('dm:instanceAction', {
                            actionId: this.state.showInput.id,
                            value: this.state.showInput.inputBefore.type === 'checkbox' ? !!this.state.inputValue : (this.state.showInput.inputBefore.type === 'number' ? parseFloat(this.state.inputValue as string) || 0 : this.state.inputValue),
                        }))}
                    startIcon={<Check />}
                >
                    {getTranslation('yesButtonText')}
                </Button>
                <Button
                    variant="contained"
                    color="grey"
                    onClick={() => this.setState({ showInput: null })}
                    startIcon={<Close />}
                >
                    {getTranslation('cancelButtonText')}
                </Button>
            </DialogActions>
        </Dialog>
    }

    render() {
        return <>
            {this.renderSnackbar()}
            {this.renderContent()}
            {this.renderSpinner()}
            {this.renderConfirmDialog()}
            {this.renderMessageDialog()}
            {this.renderFormDialog()}
            {this.renderProgressDialog()}
            {this.renderConfirmationDialog()}
            {this.renderInputDialog()}
        </>;
    }
}

export default Communication;
