import React, { useEffect, useState, type JSX } from 'react';
import { Box, Chip, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import {
    Bluetooth as BluetoothIcon,
    Cable as SerialIcon,
    DeviceHub as OtherIcon,
    Lan as PortIcon,
    Memory as GpioIcon,
    Usb as UsbIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';

import type { AdminConnection, Translate } from '@iobroker/gui-components';

import {
    collectUsedResources,
    describeUsedResource,
    USED_RESOURCE_TYPE_NAMES,
    type HostUsedResource,
} from '@/helpers/usedResources';

const TYPE_ICONS: Record<string, JSX.Element> = {
    serialPort: <SerialIcon fontSize="small" />,
    tcpPort: <PortIcon fontSize="small" />,
    udpPort: <PortIcon fontSize="small" />,
    usb: <UsbIcon fontSize="small" />,
    bluetooth: <BluetoothIcon fontSize="small" />,
    gpio: <GpioIcon fontSize="small" />,
};

/**
 * The icon of a resource type
 *
 * @param type the resource type
 */
export function usedResourceIcon(type: string): JSX.Element {
    return TYPE_ICONS[type] || <OtherIcon fontSize="small" />;
}

/**
 * The name of a resource type in the language of the GUI
 *
 * @param type the resource type
 * @param t the translation function
 */
export function usedResourceTypeName(type: string, t: Translate): string {
    return USED_RESOURCE_TYPE_NAMES[type] ? t(USED_RESOURCE_TYPE_NAMES[type]) : type;
}

/**
 * The text of the warning that another instance registered the same resource
 *
 * @param resource the entry
 * @param t the translation function
 */
export function usedResourceConflictText(resource: HostUsedResource, t: Translate): string {
    return t('Also registered by: %s', resource.conflicts.join(', '));
}

/**
 * The registered resources under a pattern, kept up to date. `null` while nothing has been read, and
 * also when no host has such a state at all - a js-controller before 8.0 does not keep them
 *
 * @param socket the connection
 * @param pattern e.g. `system.host.*.usedResources.*` or `system.host.MSI.usedResources.*`
 */
export function useUsedResources(socket: AdminConnection, pattern: string): HostUsedResource[] | null {
    const [resources, setResources] = useState<HostUsedResource[] | null>(null);

    useEffect(() => {
        let states: Record<string, ioBroker.State | null | undefined> = {};
        let active = true;
        const update = (): void => {
            if (active) {
                setResources(Object.keys(states).length ? collectUsedResources(states) : null);
            }
        };
        const onChange = (id: string, state: ioBroker.State | null | undefined): void => {
            states = { ...states, [id]: state };
            update();
        };

        void socket
            .getForeignStates(pattern)
            .then(result => {
                states = { ...(result || {}), ...states };
                update();
            })
            .catch(e => console.warn(`Cannot read ${pattern}: ${e}`));
        void socket.subscribeState(pattern, onChange);

        return () => {
            active = false;
            socket.unsubscribeState(pattern, onChange);
        };
    }, [socket, pattern]);

    return resources;
}

interface UsedResourcesTableProps {
    resources: HostUsedResource[];
    t: Translate;
    /** Leave the instance column out, when all entries belong to one instance */
    hideInstance?: boolean;
}

/** The registered resources as a table: type, resource, instance, whether it is held, and since when */
export function UsedResourcesTable(props: UsedResourcesTableProps): JSX.Element {
    const { t } = props;
    return (
        <Table
            size="small"
            sx={{ '& td, & th': { py: 0.5 } }}
        >
            <TableHead>
                <TableRow>
                    <TableCell>{t('Type')}</TableCell>
                    <TableCell>{t('Resource')}</TableCell>
                    {props.hideInstance ? null : <TableCell>{t('Instance')}</TableCell>}
                    <TableCell>{t('Status')}</TableCell>
                    <TableCell>{t('Registered')}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {props.resources.map(resource => {
                    const description = describeUsedResource(resource);
                    return (
                        <TableRow key={`${resource.instance}|${resource.type}|${description}`}>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
                                    {usedResourceIcon(resource.type)}
                                    {usedResourceTypeName(resource.type, t)}
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {description}
                                    {resource.conflicts.length ? (
                                        <Tooltip title={usedResourceConflictText(resource, t)}>
                                            <WarningIcon
                                                fontSize="small"
                                                color="warning"
                                            />
                                        </Tooltip>
                                    ) : null}
                                </Box>
                            </TableCell>
                            {props.hideInstance ? null : <TableCell>{resource.instance}</TableCell>}
                            <TableCell>
                                <Tooltip
                                    title={
                                        resource.isBlocked
                                            ? t('The instance runs and holds the resource')
                                            : t('The instance does not run and would take the resource when started')
                                    }
                                >
                                    <Chip
                                        size="small"
                                        variant={resource.isBlocked ? 'filled' : 'outlined'}
                                        color={resource.isBlocked ? 'success' : 'default'}
                                        label={resource.isBlocked ? t('In use') : t('Reserved')}
                                    />
                                </Tooltip>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {new Date(resource.ts).toLocaleString()}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

interface HostUsedResourcesProps {
    socket: AdminConnection;
    hostId: string;
    t: Translate;
}

/**
 * The block "Used resources" of a host. Shows nothing for a host whose controller does not keep the
 * registry (before js-controller 8.0)
 */
export function HostUsedResources(props: HostUsedResourcesProps): JSX.Element | null {
    const resources = useUsedResources(props.socket, `${props.hostId}.usedResources.*`);
    if (!resources) {
        return null;
    }
    return (
        <Box
            sx={{ width: '100%', mt: 1, px: 2 }}
            onClick={e => e.stopPropagation()}
        >
            <Typography
                variant="subtitle2"
                sx={{ fontWeight: 'bold' }}
            >
                {props.t('Used resources')}
            </Typography>
            {resources.length ? (
                <UsedResourcesTable
                    resources={resources}
                    t={props.t}
                />
            ) : (
                <Typography
                    variant="body2"
                    color="textSecondary"
                >
                    {props.t('No instance has registered a resource')}
                </Typography>
            )}
        </Box>
    );
}
