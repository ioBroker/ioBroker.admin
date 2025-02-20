import React, { type CSSProperties, type MouseEvent } from 'react';
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
import type { IobTheme, ThemeType } from '@iobroker/adapter-react-v5';

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

export interface IconProps {
    /**  The width in pixels or percentage of the icon. */
    width?: number | string;
    /**  The height in pixels or percentage of the icon. */
    height?: number | string;
    /** Click handler. */
    onClick?: (e: MouseEvent) => void;
    /** The class name for the SVG element. */
    className?: string;
    /** Styles for the SVG element. */
    style?: CSSProperties;
    /** The font size of the icon. */
    fontSize?: 'small';
}

function ThreadIcon(props: IconProps): React.JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            onClick={e => props.onClick && props.onClick(e)}
            viewBox="0 0 165 165"
            width={props.width || (props.fontSize === 'small' ? 16 : 20)}
            height={props.height || props.width || (props.fontSize === 'small' ? 16 : 20)}
            className={props.className}
            style={props.style}
        >
            <path
                fill="currentColor"
                d="M82.498,0C37.008,0,0,37.008,0,82.496c0,45.181,36.51,81.977,81.573,82.476V82.569l-27.002-0.002  c-8.023,0-14.554,6.53-14.554,14.561c0,8.023,6.531,14.551,14.554,14.551v17.98c-17.939,0-32.534-14.595-32.534-32.531  c0-17.944,14.595-32.543,32.534-32.543l27.002,0.004v-9.096c0-14.932,12.146-27.08,27.075-27.08  c14.932,0,27.082,12.148,27.082,27.08c0,14.931-12.15,27.08-27.082,27.08l-9.097-0.001v80.641  C136.889,155.333,165,122.14,165,82.496C165,37.008,127.99,0,82.498,0z"
            />
            <path
                fill="currentColor"
                d="M117.748,55.493c0-5.016-4.082-9.098-9.1-9.098c-5.015,0-9.097,4.082-9.097,9.098v9.097l9.097,0.001  C113.666,64.591,117.748,60.51,117.748,55.493z"
            />
        </svg>
    );
}

function ZWaveIcon(props: IconProps): React.JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            onClick={e => props.onClick && props.onClick(e)}
            viewBox="0 0 1073 1068"
            width={props.width || (props.fontSize === 'small' ? 16 : 20)}
            height={props.height || props.width || (props.fontSize === 'small' ? 16 : 20)}
            className={props.className}
            style={props.style}
        >
            <path
                fill="currentColor"
                d="M716 1.1C632.9 5.3 549.8 23.7 472 55c-66.4 26.7-132.6 65.5-188.5 110.4-43.8 35.1-85.2 76.7-120.1 120.6C72.4 400.4 16.7 539.8 3.5 686 1.8 705.1-.1 754.7.7 758c.5 2 1 2 49.7 1.8l49.1-.3.7-20c2.4-64.6 13.4-126 33.2-186 80.8-243.9 297-419.9 552.1-449.4 20.2-2.4 44.2-4.1 56.6-4.1h8.9V50 0l-9.7.1c-5.4.1-16.8.6-25.3 1zm-.8 208c-78.5 4.7-158 27.4-226.5 64.5-68.7 37.3-126.4 86.3-175.2 148.9-11 14-33.2 47.3-42.3 63.5-44 77.8-68.6 164.9-70.9 251.2l-.6 22.8h49.5 49.4l1.2-19c6.3-98.7 40-185.8 102.2-263.3 12.7-15.9 41.2-45.2 57-58.7 66.1-56.3 142.1-91.8 226-105.5 18.9-3 44.1-5.5 56.7-5.5h9.3v-50-50l-11.2.1c-6.2.1-17.3.6-24.6 1zm17.8 251c-104.5 9.2-195.2 69.7-243.6 162.4-43.9 84-45.5 184.2-4.5 270 60.3 125.9 198.1 194.2 334.9 166 46.6-9.7 89.5-29.7 127.2-59.6 13.5-10.7 37.3-34.5 48-47.9 34.2-43.1 55.2-92 63.7-148.6 2.2-15.1 2.5-62.7.5-77.4-3.6-25.2-10.1-51.4-17.8-71.2-10.1-26.2-29.4-59.7-47-81.8-9.7-12.1-35-37.2-47.4-47-47.8-37.9-104.5-60.1-165.4-65-14.7-1.1-34.7-1.1-48.6.1zm174.7 138.6c-.3.5-30.9 49.2-68.1 108.3L772 814.5l67.9.5 68 .5-30.1 48.8-30 48.7h-131c-104.4 0-130.9-.3-130.5-1.3.2-.6 32.7-51.1 72.1-112.1L730 687.9c0-.5-29.5-1-66.5-1.1l-66.6-.3 27.7-44.3 27.6-44.2h128l127.5.7z"
            />
        </svg>
    );
}

function ZigBeeIcon(props: IconProps): React.JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            onClick={e => props.onClick && props.onClick(e)}
            viewBox="0 0 48 48"
            width={props.width || (props.fontSize === 'small' ? 16 : 20)}
            height={props.height || props.width || (props.fontSize === 'small' ? 16 : 20)}
            className={props.className}
            style={props.style}
        >
            <path
                fill="currentColor"
                d="M32.042,9.792c4.595,1.238,4.88,3.165,5.524,5.048C34.841,17.664,17.35,35.7,17.35,35.7 s10.901,1.177,23.487-1.003c-0.001,0.029-0.002,0.048-0.003,0.076C42.829,31.661,44,27.97,44,24c0-11.046-8.954-20-20-20 c-5.634,0-10.715,2.338-14.35,6.087C15.489,9.124,26.89,8.403,32.042,9.792z"
            />
            <path
                fill="currentColor"
                d="M14.724,37.285c-1.982-0.347-4.212-2.131-4.707-5.302c1.437-1.239,19.994-20.507,19.994-20.507 c-7.008-0.424-14.569-0.465-22.237,0.864C5.408,15.625,4,19.644,4,24c0,11.046,8.954,20,20,20c6.173,0,11.689-2.8,15.358-7.195 C35.486,37.33,23.257,38.769,14.724,37.285z"
            />
        </svg>
    );
}

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

function rssiColor(signal: number, themeType: ThemeType): string {
    if (signal < -80) {
        return themeType === 'dark' ? '#ff5c5c' : '#aa0000';
    }
    if (signal < -60) {
        return themeType === 'dark' ? '#fa8547' : '#ae5c00';
    }
    if (signal < -50) {
        return themeType === 'dark' ? '#cdff4f' : '#7b9500';
    }

    return themeType === 'dark' ? '#5cff5c' : '#008500';
}

const iconStyleOK = {
    fill: '#00ac00',
    color: '#00ac00',
};
const iconStyleNotOK = {
    fill: '#ff0000',
    color: '#ff0000',
};
const iconStyleWarning = {
    fill: '#da8200',
    color: '#da8200',
};
const iconStyleUnknown = {
    fill: '#8a8a8a',
    color: '#8a8a8a',
};
const iconStylePreWarning = {
    fill: '#ffcc00',
    color: '#ffcc00',
};

function getBatteryIcon(battery: number): React.ReactNode {
    if (battery > 95) {
        return <BatteryFullIcon style={iconStyleOK} />;
    }
    if (battery > 85 && battery <= 95) {
        return <Battery90Icon style={iconStyleOK} />;
    }
    if (battery > 70 && battery <= 85) {
        return <Battery80Icon style={iconStyleOK} />;
    }
    if (battery > 55 && battery <= 70) {
        return <Battery60Icon style={iconStyleOK} />;
    }
    if (battery > 40 && battery <= 55) {
        return <Battery50Icon style={iconStylePreWarning} />;
    }
    if (battery > 25 && battery <= 40) {
        return <Battery30Icon style={iconStylePreWarning} />;
    }
    if (battery > 10 && battery <= 25) {
        return <Battery20Icon style={iconStyleWarning} />;
    }

    return <BatteryAlertIcon style={iconStyleNotOK} />;
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

    let batteryIconTooltip: React.ReactNode = null;
    if (typeof status.battery === 'number') {
        batteryIconTooltip = getBatteryIcon(status.battery);
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
                <ThreadIcon style={iconStyleOK} />
            ) : status.connection === 'disconnected' ? (
                <ThreadIcon style={iconStyleNotOK} />
            ) : (
                <ThreadIcon style={iconStyleUnknown} />
            );
    } else if (props.connectionType === 'z-wave') {
        connectionSymbol =
            status.connection === 'connected' ? (
                <ZWaveIcon style={iconStyleOK} />
            ) : status.connection === 'disconnected' ? (
                <ZWaveIcon style={iconStyleNotOK} />
            ) : (
                <ZWaveIcon style={iconStyleUnknown} />
            );
    } else if (props.connectionType === 'zigbee') {
        connectionSymbol =
            status.connection === 'connected' ? (
                <ZigBeeIcon style={iconStyleOK} />
            ) : status.connection === 'disconnected' ? (
                <ZigBeeIcon style={iconStyleNotOK} />
            ) : (
                <ZigBeeIcon style={iconStyleUnknown} />
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
                alignItems: 'baseline',
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
                        <NetworkCheckIcon style={{ color: rssiColor(status.rssi, props.theme.palette.mode) }} />
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
