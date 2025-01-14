import React from 'react';
import { IconButton, Tooltip } from '@mui/material';

import {
    Link as LinkIcon,
    LinkOff as LinkOffIcon,
    NetworkCheck as NetworkCheckIcon,
    Battery20 as Battery20Icon,
    Battery30 as Battery30Icon,
    Battery50 as Battery50Icon,
    Battery60 as Battery60Icon,
    Battery80 as Battery80Icon,
    Battery90 as Battery90Icon,
    BatteryFull as BatteryFullIcon,
    BatteryAlert as BatteryAlertIcon,
    Warning as WarningIcon,
    BatteryCharging50 as BatteryCharging50Icon,
    Cable as IconConnectionLan,
    Wifi as IconConnectionWifi,
    WifiOff as IconConnectionNoWifi,
    Bluetooth as IconConnectionBluetooth,
    BluetoothDisabled as IconConnectionNoBluetooth,
} from '@mui/icons-material';

import type { DeviceStatus, DeviceAction, ActionBase, ConfigConnectionType } from '@iobroker/dm-utils';
import { Icon, type IobTheme } from '@iobroker/adapter-react-v5';

import ZWaveIcon from './assets/z-wave.svg';
import ZigBeeIcon from './assets/zigbee.svg';
import ThreadIcon from './assets/thread.svg';

import { getTranslation } from './Utils';
import Switch from './Switch';

export const ACTIONS = {
    STATUS: 'status',
    DISABLE: 'disable',
    ENABLE: 'enable',
};

const styles: Record<string, React.CSSProperties> = {
    tooltip: {
        pointerEvents: 'none',
    },
};

interface DeviceStatusProps {
    status: DeviceStatus | null;
    deviceId: string;
    connectionType?: ConfigConnectionType;
    statusAction?: DeviceAction;
    enabled?: boolean;
    disableEnableAction?: DeviceAction;
    deviceHandler: (deviceId: string, action: ActionBase, refresh: () => void) => () => void;
    refresh: () => void;
    theme: IobTheme;
}
/**
 * Device Status component
 *
 * @param props - Parameters
 * @param props.status - Status object, e.g. { connection: 'connected', battery: 100, rssi: -50 }
 */
export default function DeviceStatus(props: DeviceStatusProps): React.JSX.Element | null {
    if (!props.status) {
        return null;
    }

    let status: DeviceStatus;

    if (typeof props.status === 'string') {
        status = {
            connection: props.status,
        };
    } else {
        status = props.status;
    }

    const iconStyleOK = {
        fill: '#00ac00',
    };
    const iconStyleNotOK = {
        fill: '#ff0000',
    };
    const iconStyleWarning = {
        fill: '#ff9900',
    };
    const iconStyleUnknown = {
        fill: '#8a8a8a',
    };

    let batteryIconTooltip: React.ReactNode = null;
    if (typeof status.battery === 'number') {
        if (status.battery >= 96 && status.battery <= 100) {
            batteryIconTooltip = <BatteryFullIcon style={iconStyleOK} />;
        } else if (status.battery >= 90 && status.battery <= 95) {
            batteryIconTooltip = <Battery90Icon style={iconStyleOK} />;
        } else if (status.battery >= 80 && status.battery <= 89) {
            batteryIconTooltip = <Battery80Icon style={iconStyleOK} />;
        } else if (status.battery >= 60 && status.battery <= 79) {
            batteryIconTooltip = <Battery60Icon style={iconStyleOK} />;
        } else if (status.battery >= 50 && status.battery <= 59) {
            batteryIconTooltip = <Battery50Icon style={iconStyleOK} />;
        } else if (status.battery >= 30 && status.battery <= 49) {
            batteryIconTooltip = <Battery30Icon style={iconStyleOK} />;
        } else if (status.battery >= 20 && status.battery <= 29) {
            batteryIconTooltip = <Battery20Icon style={iconStyleNotOK} />;
        } else {
            batteryIconTooltip = <BatteryAlertIcon style={iconStyleNotOK} />;
        }
    }

    const disability =
        typeof props.enabled === 'boolean' ? (
            <>
                <div style={{ flexGrow: 1 }} />
                {
                    <Tooltip
                        title={
                            props.enabled ? getTranslation('disableIconTooltip') : getTranslation('enableIconTooltip')
                        }
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                                size="small"
                                checked={props.enabled}
                                disabled={!props.disableEnableAction}
                                onChange={() =>
                                    props.disableEnableAction &&
                                    props.deviceHandler(props.deviceId, props.disableEnableAction, props.refresh)()
                                }
                                theme={props.theme}
                            />
                        </div>
                    </Tooltip>
                }
            </>
        ) : null;
    let connectionSymbol: React.JSX.Element | null;
    if (props.connectionType === 'wifi') {
        connectionSymbol =
            status.connection === 'connected' ? (
                <IconConnectionWifi style={iconStyleOK} />
            ) : status.connection === 'disconnected' ? (
                <IconConnectionNoWifi style={iconStyleNotOK} />
            ) : (
                <IconConnectionWifi style={iconStyleUnknown} />
            );
    } else if (props.connectionType === 'bluetooth') {
        connectionSymbol =
            status.connection === 'connected' ? (
                <IconConnectionBluetooth style={iconStyleOK} />
            ) : status.connection === 'disconnected' ? (
                <IconConnectionNoBluetooth style={iconStyleNotOK} />
            ) : (
                <IconConnectionBluetooth style={iconStyleUnknown} />
            );
    } else if (props.connectionType === 'lan') {
        connectionSymbol =
            status.connection === 'connected' ? (
                <IconConnectionLan style={iconStyleOK} />
            ) : status.connection === 'disconnected' ? (
                <IconConnectionLan style={iconStyleNotOK} />
            ) : (
                <IconConnectionLan style={iconStyleUnknown} />
            );
    } else if (props.connectionType === 'thread') {
        connectionSymbol =
            status.connection === 'connected' ? (
                <Icon
                    src={ThreadIcon}
                    style={iconStyleOK}
                />
            ) : status.connection === 'disconnected' ? (
                <Icon
                    src={ThreadIcon}
                    style={iconStyleNotOK}
                />
            ) : (
                <Icon
                    src={ThreadIcon}
                    style={iconStyleUnknown}
                />
            );
    } else if (props.connectionType === 'z-wave') {
        connectionSymbol =
            status.connection === 'connected' ? (
                <Icon
                    src={ZWaveIcon}
                    style={iconStyleOK}
                />
            ) : status.connection === 'disconnected' ? (
                <Icon
                    src={ZWaveIcon}
                    style={iconStyleNotOK}
                />
            ) : (
                <Icon
                    src={ZWaveIcon}
                    style={iconStyleUnknown}
                />
            );
    } else if (props.connectionType === 'zigbee') {
        connectionSymbol =
            status.connection === 'connected' ? (
                <Icon
                    src={ZigBeeIcon}
                    style={iconStyleOK}
                />
            ) : status.connection === 'disconnected' ? (
                <Icon
                    src={ZigBeeIcon}
                    style={iconStyleNotOK}
                />
            ) : (
                <Icon
                    src={ZigBeeIcon}
                    style={iconStyleUnknown}
                />
            );
    } else {
        connectionSymbol =
            status.connection === 'connected' ? (
                <LinkIcon style={iconStyleOK} />
            ) : status.connection === 'disconnected' ? (
                <LinkOffIcon style={iconStyleNotOK} />
            ) : null;
    }

    const connectionIcon =
        status.connection === 'connected' || status.connection === 'disconnected' ? (
            <Tooltip
                title={
                    (status.connection === 'connected'
                        ? getTranslation('connectedIconTooltip')
                        : getTranslation('disconnectedIconTooltip')) +
                    (props.statusAction
                        ? `. ${getTranslation(props.statusAction.description || 'moreInformation')}`
                        : '')
                }
                slotProps={{ popper: { sx: styles.tooltip } }}
            >
                {props.statusAction ? (
                    <IconButton
                        onClick={e => {
                            if (props.statusAction) {
                                e.stopPropagation();
                                props.deviceHandler(props.deviceId, props.statusAction, props.refresh)();
                            }
                        }}
                    >
                        {connectionSymbol}
                        <div style={{ position: 'absolute', top: 0, left: 0, color: 'grey' }}>*</div>
                    </IconButton>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {connectionSymbol}
                    </div>
                )}
            </Tooltip>
        ) : (
            connectionSymbol
        );

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                cursor: props.statusAction ? 'pointer' : undefined,
                width: props.disableEnableAction ? '100%' : undefined,
                gap: 8,
            }}
        >
            {connectionIcon}

            {status.rssi && (
                <Tooltip
                    title="RSSI"
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <NetworkCheckIcon />
                        <p style={{ fontSize: 'small', margin: 0 }}>{status.rssi}</p>
                    </div>
                </Tooltip>
            )}

            {typeof status.battery === 'number' && (
                <Tooltip
                    title={getTranslation('batteryTooltip')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {batteryIconTooltip}
                        <p style={{ fontSize: 'small', margin: 0 }}>{status.battery}%</p>
                    </div>
                </Tooltip>
            )}

            {typeof status.battery === 'string' && (
                <Tooltip
                    title={getTranslation('batteryTooltip')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {status.battery === 'charging' ? <BatteryCharging50Icon /> : <BatteryFullIcon />}
                        {status.battery !== 'charging' ? (
                            status.battery.includes('V') || status.battery.includes('mV') ? (
                                <p style={{ fontSize: 'small', margin: 0 }}>{status.battery}</p>
                            ) : (
                                <p style={{ fontSize: 'small', margin: 0 }}>
                                    <span style={{ marginRight: 4 }}>{status.battery}</span>
                                    mV
                                </p>
                            )
                        ) : null}
                    </div>
                </Tooltip>
            )}

            {typeof status.battery === 'boolean' && (
                <Tooltip
                    title={getTranslation('batteryTooltip')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {status.battery ? (
                            <BatteryFullIcon style={iconStyleOK} />
                        ) : (
                            <BatteryAlertIcon style={iconStyleNotOK} />
                        )}
                    </div>
                </Tooltip>
            )}

            {status.warning ? (
                typeof status.warning === 'string' || typeof status.warning === 'object' ? (
                    <Tooltip
                        title={getTranslation(status.warning)}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <WarningIcon style={iconStyleWarning} />
                        </div>
                    </Tooltip>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <WarningIcon style={iconStyleWarning} />
                    </div>
                )
            ) : null}

            {disability}
        </div>
    );
}
