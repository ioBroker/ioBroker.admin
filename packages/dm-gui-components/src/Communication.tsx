import React, { Component } from 'react';

import {
    Backdrop,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid2,
    IconButton,
    Input,
    InputAdornment,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Slider,
    Snackbar,
    TextField,
    Typography,
} from '@mui/material';

import { Close, Check, ContentCopy } from '@mui/icons-material';

import {
    type Connection,
    type AdminConnection,
    type ThemeName,
    type ThemeType,
    type IobTheme,
    I18n,
    Icon,
    Utils,
} from '@iobroker/adapter-react-v5';
import type {
    ActionBase,
    ControlBase,
    ControlState,
    DeviceInfo,
    DeviceRefresh,
    InstanceDetails,
    JsonFormSchema,
    ActionButton,
} from '@iobroker/dm-utils';
import type { ConfigItemPanel, ConfigItemTabs } from '@iobroker/json-config';

import { getTranslation } from './Utils';
import JsonConfig from './JsonConfig';

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        grey: true;
    }
}

export type CommunicationProps = {
    /** Socket connection */
    socket: Connection;
    /** Instance to communicate with device-manager backend, like `adapterName.X` */
    selectedInstance: string; // adapterName.X
    registerHandler?: (handler: null | ((command: string) => void)) => void;
    themeName: ThemeName;
    themeType: ThemeType;
    theme: IobTheme;
    isFloatComma: boolean;
    dateFormat: string;
};

interface CommunicationForm {
    title?: ioBroker.StringOrTranslated | null | undefined;
    label?: ioBroker.StringOrTranslated | null | undefined; // same as title
    noTranslation?: boolean; // Do not translate title/label
    schema: JsonFormSchema;
    data?: Record<string, any>;
    buttons?: (ActionButton | 'apply' | 'cancel' | 'close')[];
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Minimal width of the dialog */
    minWidth?: number;
}

interface CommunicationFormInState extends CommunicationForm {
    handleClose?: (data?: Record<string, any>) => void;
    originalData: string;
    changed: boolean;
}

interface InputAction extends ActionBase {
    /** If it is a device action */
    deviceId?: string;
    /** Optional refresh function to execute */
    refresh?: () => void;
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
    form: CommunicationFormInState | null;
    progress: {
        open: boolean;
        progress: number;
    } | null;
    showConfirmation: InputAction | null;
    showInput: InputAction | null;
    inputValue: string | boolean | number | null;
};

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

interface Message {
    actionId?: string;
    deviceId?: string;
    value?: unknown;
    origin?: string;
    confirm?: boolean;
    data?: any;
    /** Inform backend, how long the frontend will wait for an answer */
    timeout?: number;
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
    form?: CommunicationForm;
    progress?: {
        open: boolean;
        progress: number;
    };
}

/**
 * Device List Component
 */
class Communication<P extends CommunicationProps, S extends CommunicationState> extends Component<P, S> {
    private responseTimeout: ReturnType<typeof setTimeout> | null = null;

    // eslint-disable-next-line react/no-unused-class-component-methods
    instanceHandler: (action: ActionBase) => () => void;

    // eslint-disable-next-line react/no-unused-class-component-methods
    deviceHandler: (deviceId: string, action: ActionBase, refresh: () => void) => () => void;

    // eslint-disable-next-line react/no-unused-class-component-methods
    controlHandler: (
        deviceId: string,
        control: ControlBase,
        state: ControlState,
    ) => () => Promise<ioBroker.State | null>;

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
                this.setState({ showConfirmation: action });
                return;
            }
            if (action.inputBefore) {
                this.setState({ showInput: action });
                return;
            }

            this.sendActionToInstance('dm:instanceAction', { actionId: action.id, timeout: action.timeout });
        };

        // eslint-disable-next-line react/no-unused-class-component-methods
        this.deviceHandler = (deviceId, action, refresh) => () => {
            if (action.confirmation) {
                this.setState({ showConfirmation: { ...action, deviceId, refresh } });
                return;
            }
            if (action.inputBefore) {
                this.setState({
                    showInput: { ...action, deviceId, refresh },
                    inputValue: action.inputBefore.defaultValue || '',
                });
                return;
            }

            this.sendActionToInstance(
                'dm:deviceAction',
                { deviceId, actionId: action.id, timeout: action.timeout },
                refresh,
            );
        };

        // eslint-disable-next-line react/no-unused-class-component-methods
        this.controlHandler = (deviceId, control, state) => () =>
            this.sendControlToInstance('dm:deviceControl', { deviceId, controlId: control.id, state });

        // eslint-disable-next-line react/no-unused-class-component-methods
        this.controlStateHandler = (deviceId, control) => () =>
            this.sendControlToInstance('dm:deviceControlState', { deviceId, controlId: control.id });

        if (this.props.registerHandler) {
            this.props.registerHandler(() => this.loadData());
        }
    }

    componentWillUnmount(): void {
        if (this.responseTimeout) {
            clearTimeout(this.responseTimeout);
            this.responseTimeout = null;
        }
    }

    // eslint-disable-next-line class-methods-use-this
    loadData(): void {
        console.error('loadData not implemented');
    }

    sendActionToInstance = (command: `dm:${string}`, messageToSend: Message, refresh?: () => void): void => {
        const send = async (): Promise<void> => {
            this.setState({ showSpinner: true });
            this.responseTimeout = setTimeout(() => {
                this.setState({ showSpinner: false });
                window.alert(I18n.t('ra_No response from the backend'));
            }, messageToSend.timeout || 5000);

            const response: DmActionResponse = await this.props.socket.sendTo(
                this.props.selectedInstance,
                command,
                messageToSend,
            );

            if (this.responseTimeout) {
                clearTimeout(this.responseTimeout);
                this.responseTimeout = null;
            }

            const type: string = response.type;
            console.log(`Response: ${response.type}`);
            switch (type) {
                case 'message':
                    console.log(`Message received: ${response.message}`);
                    if (response.message) {
                        this.setState({
                            message: {
                                message: response.message,
                                handleClose: () =>
                                    this.setState({ message: null }, () =>
                                        this.sendActionToInstance(
                                            'dm:actionProgress',
                                            { origin: response.origin },
                                            refresh,
                                        ),
                                    ),
                            },
                            showSpinner: false,
                        });
                    }
                    break;

                case 'confirm':
                    console.log(`Confirm received: ${response.confirm}`);
                    if (response.confirm) {
                        this.setState({
                            confirm: {
                                message: response.confirm,
                                handleClose: (confirm?: boolean) =>
                                    this.setState({ confirm: null }, () =>
                                        this.sendActionToInstance(
                                            'dm:actionProgress',
                                            {
                                                origin: response.origin,
                                                confirm,
                                            },
                                            refresh,
                                        ),
                                    ),
                            },
                            showSpinner: false,
                        });
                    }
                    break;

                case 'form':
                    console.log('Form received');
                    if (response.form) {
                        const data: Record<string, any> | undefined = response.form.data;
                        const originalData: Record<string, any> = {};
                        if (data) {
                            Object.keys(data).forEach(key => {
                                if (data[key] !== undefined) {
                                    originalData[key] = data[key];
                                }
                            });
                        }
                        response.form.data = JSON.parse(JSON.stringify(originalData)) as Record<string, any>;

                        this.setState({
                            form: {
                                ...response.form,
                                changed: false,
                                originalData: JSON.stringify(originalData),
                                handleClose: (data: any) =>
                                    this.setState({ form: null }, () => {
                                        console.log(`Form ${JSON.stringify(data)}`);
                                        this.sendActionToInstance(
                                            'dm:actionProgress',
                                            {
                                                origin: response.origin,
                                                data,
                                            },
                                            refresh,
                                        );
                                    }),
                            },
                            showSpinner: false,
                        });
                    }
                    break;

                case 'progress':
                    if (response.progress) {
                        if (this.state.progress) {
                            const progress = { ...this.state.progress, ...response.progress };
                            this.setState({ progress, showSpinner: false });
                        } else {
                            this.setState({ progress: response.progress, showSpinner: false });
                        }
                    }
                    this.sendActionToInstance('dm:actionProgress', { origin: response.origin }, refresh);
                    break;

                case 'result':
                    console.log('Response content', response.result);
                    if (response.result.refresh) {
                        if (response.result.refresh === true) {
                            console.log('Refreshing all');
                            this.loadData();
                        } else if (response.result.refresh === 'instance') {
                            console.log(`Refreshing instance infos: ${this.props.selectedInstance}`);
                        } else if (response.result.refresh === 'device') {
                            if (!refresh) {
                                console.log('No refresh function provided to refresh "device"');
                            } else {
                                console.log(`Refreshing device infos: ${this.props.selectedInstance}`);
                                refresh();
                            }
                        } else {
                            console.log('Not refreshing anything');
                        }
                    }
                    if (response.result.error) {
                        console.error(`Error: ${response.result.error.message}`);
                        this.setState({ showToast: response.result.error.message, showSpinner: false });
                    } else {
                        this.setState({ showSpinner: false });
                    }
                    break;

                default:
                    console.log(`Unknown response type: ${type}`);
                    this.setState({ showSpinner: false });
                    break;
            }
        };

        void send().catch(console.error);
    };

    sendControlToInstance = async (
        command: string,
        messageToSend: { deviceId: string; controlId: string; state?: ControlState },
    ): Promise<null | ioBroker.State> => {
        const response: DmControlResponse = await this.props.socket.sendTo(
            this.props.selectedInstance,
            command,
            messageToSend,
        );
        const type = response.type;
        console.log(`Response: ${response.type}`);
        if (response.type === 'result') {
            console.log('Response content', response.result);
            if (response.result.error) {
                console.error(`Error: ${response.result.error.message}`);
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
    loadDevices(): Promise<DeviceInfo[]> {
        return this.props.socket.sendTo(this.props.selectedInstance, 'dm:listDevices');
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    loadInstanceInfos(): Promise<InstanceDetails> {
        return this.props.socket.sendTo(this.props.selectedInstance, 'dm:instanceInfo');
    }

    renderMessageDialog(): React.JSX.Element | null {
        if (!this.state.message) {
            return null;
        }

        return (
            <Dialog
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
            </Dialog>
        );
    }

    renderConfirmDialog(): React.JSX.Element | null {
        if (!this.state.confirm) {
            return null;
        }

        return (
            <Dialog
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
            </Dialog>
        );
    }

    renderSnackbar(): React.JSX.Element {
        return (
            <Snackbar
                open={!!this.state.showToast}
                autoHideDuration={6_000}
                onClose={() => this.setState({ showToast: null })}
                message={this.state.showToast}
            />
        );
    }

    getOkButton(button?: ActionButton | 'apply' | 'cancel' | 'close'): React.JSX.Element {
        if (typeof button === 'string') {
            button = undefined;
        }
        return (
            <Button
                key="apply"
                disabled={!this.state.form?.changed}
                variant={button?.variant || 'contained'}
                color={
                    button?.color === 'primary' ? 'primary' : button?.color === 'secondary' ? 'secondary' : 'primary'
                }
                style={{
                    backgroundColor:
                        button?.color && button?.color !== 'primary' && button?.color !== 'secondary'
                            ? button?.color
                            : undefined,
                    ...(button?.style || undefined),
                }}
                onClick={() => this.state.form?.handleClose && this.state.form.handleClose(this.state.form?.data)}
                startIcon={button?.icon ? <Icon src={button?.icon} /> : undefined}
            >
                {getTranslation(button?.label || 'okButtonText', button?.noTranslation)}
            </Button>
        );
    }

    getCancelButton(button?: ActionButton | 'apply' | 'cancel' | 'close'): React.JSX.Element {
        let isClose = false;
        if (typeof button === 'string') {
            isClose = button === 'close';
            button = undefined;
        }
        return (
            <Button
                key="cancel"
                variant={button?.variant || 'contained'}
                color={button?.color === 'primary' ? 'primary' : button?.color === 'secondary' ? 'secondary' : 'grey'}
                style={{
                    backgroundColor:
                        button?.color && button?.color !== 'primary' && button?.color !== 'secondary'
                            ? button?.color
                            : undefined,
                    ...(button?.style || undefined),
                }}
                onClick={() => this.state.form?.handleClose && this.state.form.handleClose()}
                startIcon={isClose ? <Close /> : button?.icon ? <Icon src={button?.icon} /> : undefined}
            >
                {getTranslation(button?.label || 'cancelButtonText', button?.noTranslation)}
            </Button>
        );
    }

    renderFormDialog(): React.JSX.Element | null {
        if (!this.state.form || !this.state.form.schema) {
            return null;
        }
        let buttons: React.JSX.Element[];
        if (this.state.form.buttons) {
            buttons = [];
            this.state.form.buttons.forEach((button: ActionButton | 'apply' | 'cancel' | 'close'): void => {
                if (typeof button === 'object' && button.type === 'copyToClipboard') {
                    buttons.push(
                        <Button
                            key="copyToClipboard"
                            variant={button.variant || 'outlined'}
                            color={
                                button.color === 'primary'
                                    ? 'primary'
                                    : button.color === 'secondary'
                                      ? 'secondary'
                                      : undefined
                            }
                            style={{
                                backgroundColor:
                                    button.color && button.color !== 'primary' && button.color !== 'secondary'
                                        ? button.color
                                        : undefined,
                                ...(button.style || undefined),
                            }}
                            onClick={() => {
                                if (button.copyToClipboardAttr && this.state.form!.data) {
                                    const val = this.state.form!.data[button.copyToClipboardAttr];
                                    if (typeof val === 'string') {
                                        Utils.copyToClipboard(val);
                                    } else {
                                        Utils.copyToClipboard(JSON.stringify(val, null, 2));
                                    }
                                    window.alert(I18n.t('copied'));
                                } else if (this.state.form?.data) {
                                    Utils.copyToClipboard(JSON.stringify(this.state.form.data, null, 2));
                                    window.alert(I18n.t('copied'));
                                } else {
                                    window.alert(I18n.t('nothingToCopy'));
                                }
                            }}
                            startIcon={button?.icon ? <Icon src={button?.icon} /> : <ContentCopy />}
                        >
                            {getTranslation(button?.label || 'ctcButtonText', button?.noTranslation)}
                        </Button>,
                    );
                } else if (button === 'apply' || (button as ActionButton).type === 'apply') {
                    buttons.push(this.getOkButton(button));
                } else {
                    buttons.push(this.getCancelButton(button));
                }
            });
        } else {
            buttons = [this.getOkButton(), this.getCancelButton()];
        }

        return (
            <Dialog
                open={!0}
                onClose={() => this.state.form!.handleClose && this.state.form!.handleClose()}
                hideBackdrop
                fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        minWidth: this.state.form.minWidth || undefined,
                    },
                }}
                maxWidth={this.state.form.maxWidth || 'md'}
            >
                {this.state.form?.title ? (
                    <DialogTitle>
                        {getTranslation(
                            this.state.form?.label || this.state.form?.title,
                            this.state.form.noTranslation,
                        )}
                    </DialogTitle>
                ) : null}
                <DialogContent>
                    <JsonConfig
                        instanceId={this.props.selectedInstance}
                        schema={this.state.form.schema as ConfigItemPanel | ConfigItemTabs}
                        data={this.state.form.data || {}}
                        socket={this.props.socket as AdminConnection}
                        onChange={(data: Record<string, any>) => {
                            console.log('handleFormChange', { data });
                            const form: CommunicationFormInState = {
                                ...(this.state.form as CommunicationFormInState),
                            };
                            if (form) {
                                form.data = data;
                                form.changed = JSON.stringify(data) !== form.originalData;
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
                <DialogActions>{buttons}</DialogActions>
            </Dialog>
        );
    }

    renderProgressDialog(): React.JSX.Element | null {
        if (!this.state.progress?.open) {
            return null;
        }

        return (
            <Dialog
                open={!0}
                onClose={() => {}}
                hideBackdrop
            >
                <LinearProgress
                    variant="determinate"
                    value={this.state.progress?.progress || 0}
                />
            </Dialog>
        );
    }

    // eslint-disable-next-line class-methods-use-this
    renderContent(): React.JSX.Element | React.JSX.Element[] | null {
        return null;
    }

    renderSpinner(): React.JSX.Element | null {
        if (!this.state.showSpinner) {
            return null;
        }
        return (
            <Backdrop
                style={{ zIndex: 1000 }}
                open={!0}
            >
                <CircularProgress />
            </Backdrop>
        );
    }

    renderConfirmationDialog(): React.JSX.Element | null {
        if (!this.state.showConfirmation) {
            return null;
        }
        return (
            <Dialog
                open={!0}
                onClose={() => this.setState({ showConfirmation: null })}
            >
                <DialogTitle>
                    {getTranslation(
                        this.state.showConfirmation.confirmation === true
                            ? getTranslation('areYouSureText')
                            : getTranslation(this.state.showConfirmation.confirmation as ioBroker.StringOrTranslated),
                    )}
                </DialogTitle>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            if (!this.state.showConfirmation) {
                                return;
                            }

                            const showConfirmation = this.state.showConfirmation;
                            this.setState({ showConfirmation: null }, () => {
                                if (showConfirmation.deviceId) {
                                    this.sendActionToInstance(
                                        'dm:deviceAction',
                                        {
                                            actionId: showConfirmation.id,
                                            deviceId: showConfirmation.deviceId,
                                            timeout: showConfirmation.timeout,
                                        },
                                        showConfirmation.refresh,
                                    );
                                } else {
                                    this.sendActionToInstance('dm:instanceAction', {
                                        actionId: showConfirmation.id,
                                        timeout: showConfirmation.timeout,
                                    });
                                }
                            });
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
            </Dialog>
        );
    }

    onShowInputOk(): void {
        if (!this.state.showInput) {
            return;
        }

        const showInput = this.state.showInput;
        this.setState({ showInput: null }, () => {
            if (showInput.deviceId) {
                this.sendActionToInstance(
                    'dm:deviceAction',
                    {
                        actionId: showInput.id,
                        deviceId: showInput.deviceId,
                        timeout: showInput.timeout,
                        value:
                            showInput.inputBefore?.type === 'checkbox'
                                ? !!this.state.inputValue
                                : showInput.inputBefore?.type === 'number'
                                  ? parseFloat(this.state.inputValue as string) || 0
                                  : this.state.inputValue,
                    },
                    showInput.refresh,
                );
            } else {
                this.sendActionToInstance('dm:instanceAction', {
                    actionId: showInput.id,
                    timeout: showInput.timeout,
                    value:
                        showInput.inputBefore?.type === 'checkbox'
                            ? !!this.state.inputValue
                            : showInput.inputBefore?.type === 'number'
                              ? parseFloat(this.state.inputValue as string) || 0
                              : this.state.inputValue,
                });
            }
        });
    }

    renderInputDialog(): React.JSX.Element | null {
        if (!this.state.showInput || !this.state.showInput.inputBefore) {
            return null;
        }
        let okDisabled = false;
        if (!this.state.showInput.inputBefore.allowEmptyValue && this.state.showInput.inputBefore.type !== 'checkbox') {
            if (
                this.state.showInput.inputBefore.type === 'number' ||
                this.state.showInput.inputBefore.type === 'slider'
            ) {
                okDisabled =
                    this.state.inputValue === '' ||
                    this.state.inputValue === null ||
                    !window.isFinite(this.state.inputValue as number);
            } else {
                okDisabled = !this.state.inputValue;
            }
        }

        return (
            <Dialog
                open={!0}
                onClose={() => this.setState({ showInput: null })}
            >
                <DialogTitle>{getTranslation('pleaseEnterValueText')}</DialogTitle>
                <DialogContent>
                    {this.state.showInput.inputBefore.type === 'text' ||
                    this.state.showInput.inputBefore.type === 'number' ||
                    !this.state.showInput.inputBefore.type ? (
                        <TextField
                            autoFocus
                            margin="dense"
                            label={getTranslation(this.state.showInput.inputBefore.label)}
                            slotProps={{
                                htmlInput:
                                    this.state.showInput.inputBefore.type === 'number'
                                        ? {
                                              min: this.state.showInput.inputBefore.min,
                                              max: this.state.showInput.inputBefore.max,
                                              step: this.state.showInput.inputBefore.step,
                                          }
                                        : undefined,
                                input: {
                                    endAdornment: this.state.inputValue ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                tabIndex={-1}
                                                size="small"
                                                onClick={() => this.setState({ inputValue: '' })}
                                            >
                                                <Close />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,
                                },
                            }}
                            type={this.state.showInput.inputBefore.type === 'number' ? 'number' : 'text'}
                            fullWidth
                            value={this.state.inputValue}
                            onChange={e => this.setState({ inputValue: e.target.value })}
                            onKeyUp={(e: React.KeyboardEvent) => {
                                if (e.key === 'Enter') {
                                    this.onShowInputOk();
                                }
                            }}
                        />
                    ) : null}
                    {this.state.showInput.inputBefore.type === 'checkbox' ? (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!!this.state.inputValue}
                                    autoFocus
                                    onChange={e => this.setState({ inputValue: e.target.checked })}
                                />
                            }
                            label={getTranslation(this.state.showInput.inputBefore.label)}
                        />
                    ) : null}
                    {this.state.showInput.inputBefore.type === 'select' ? (
                        <FormControl fullWidth>
                            <InputLabel>{getTranslation(this.state.showInput.inputBefore.label)}</InputLabel>
                            <Select
                                variant="standard"
                                value={this.state.inputValue}
                                onChange={e => this.setState({ inputValue: e.target.value })}
                            >
                                {this.state.showInput.inputBefore.options?.map(item => (
                                    <MenuItem
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {getTranslation(item.label)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ) : null}
                    {this.state.showInput.inputBefore.type === 'slider' ? (
                        <Box sx={{ width: '100%' }}>
                            <Typography gutterBottom>
                                {getTranslation(this.state.showInput.inputBefore.label)}
                            </Typography>
                            <Grid2
                                container
                                spacing={2}
                                alignItems="center"
                            >
                                <Grid2>
                                    <Slider
                                        value={typeof this.state.inputValue === 'number' ? this.state.inputValue : 0}
                                        onChange={(_event: Event, newValue: number) =>
                                            this.setState({ inputValue: newValue })
                                        }
                                    />
                                </Grid2>
                                <Grid2>
                                    <Input
                                        value={this.state.inputValue}
                                        size="small"
                                        onChange={e =>
                                            this.setState({
                                                inputValue: e.target.value === '' ? 0 : Number(e.target.value),
                                            })
                                        }
                                        onBlur={() => {
                                            if (!this.state.showInput) {
                                                return;
                                            }

                                            const min =
                                                this.state.showInput.inputBefore?.min === undefined
                                                    ? 0
                                                    : this.state.showInput.inputBefore.min;
                                            const max =
                                                this.state.showInput.inputBefore?.max === undefined
                                                    ? 100
                                                    : this.state.showInput.inputBefore.max;

                                            if ((this.state.inputValue as number) < min) {
                                                this.setState({ inputValue: min });
                                            } else if ((this.state.inputValue as number) > max) {
                                                this.setState({ inputValue: max });
                                            }
                                        }}
                                        inputProps={{
                                            step: this.state.showInput.inputBefore.step,
                                            min:
                                                this.state.showInput.inputBefore.min === undefined
                                                    ? 0
                                                    : this.state.showInput.inputBefore.min,
                                            max:
                                                this.state.showInput.inputBefore.max === undefined
                                                    ? 100
                                                    : this.state.showInput.inputBefore.max,
                                            type: 'number',
                                        }}
                                    />
                                </Grid2>
                            </Grid2>
                        </Box>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        disabled={okDisabled}
                        color="primary"
                        onClick={() => this.onShowInputOk()}
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
        );
    }

    render(): React.JSX.Element {
        return (
            <>
                {this.renderSnackbar()}
                {this.renderContent()}
                {this.renderConfirmDialog()}
                {this.renderMessageDialog()}
                {this.renderFormDialog()}
                {this.renderProgressDialog()}
                {this.renderConfirmationDialog()}
                {this.renderInputDialog()}
                {this.renderSpinner()}
            </>
        );
    }
}

export default Communication;
