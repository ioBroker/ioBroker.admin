import React from 'react';
import { Tooltip } from '@mui/material';

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
} from '@mui/icons-material';

import type { DeviceStatus } from '@iobroker/dm-utils';

import { getTranslation } from './Utils';

const styles: Record<string, React.CSSProperties> = {
    tooltip: {
        pointerEvents: 'none',
    },
};

interface DeviceStatusProps {
    status: DeviceStatus | null;
}
/**
 * Device Status component
 *
 * @param params - Parameters
 * @param params.status - Status object, e.g. { connection: 'connected', battery: 100, rssi: -50 }
 */
export default function DeviceStatus(params: DeviceStatusProps): React.JSX.Element | null {
    if (!params.status) {
        return null;
    }

    let status: DeviceStatus;

    if (typeof params.status === 'string') {
        status = {
            connection: params.status,
        };
    } else {
        status = params.status;
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

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            {status.connection === 'connected' && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip
                        title={getTranslation('connectedIconTooltip')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <LinkIcon style={iconStyleOK} />
                        </div>
                    </Tooltip>
                </div>
            )}

            {status.connection === 'disconnected' && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip
                        title={getTranslation('disconnectedIconTooltip')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <LinkOffIcon style={iconStyleNotOK} />
                        </div>
                    </Tooltip>
                </div>
            )}

            {status.rssi && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip
                        title="RSSI"
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <NetworkCheckIcon />
                            <p style={{ fontSize: 'small', margin: 0 }}>{status.rssi}</p>
                        </div>
                    </Tooltip>
                </div>
            )}

            {typeof status.battery === 'number' && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip
                        title={getTranslation('batteryTooltip')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {batteryIconTooltip}
                            <p style={{ fontSize: 'small', margin: 0 }}>{status.battery}%</p>
                        </div>
                    </Tooltip>
                </div>
            )}

            {typeof status.battery === 'string' && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
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
                </div>
            )}

            {typeof status.battery === 'boolean' && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
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
                </div>
            )}

            {status.warning && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {typeof status.warning === 'string' || typeof status.warning === 'object' ? (
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
                    )}
                </div>
            )}
        </div>
    );
}
