import React, { useEffect, useState, type JSX } from 'react';
import { Box, Chip, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import {
    Bluetooth as BluetoothIcon,
    Cable as SerialIcon,
    DeviceHub as OtherIcon,
    ExpandMore as ExpandMoreIcon,
    Lan as PortIcon,
    Memory as GpioIcon,
    Usb as UsbIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';

import type { AdminConnection, Translate } from '@iobroker/gui-components';

import { adminHref } from '@/helpers/utils';
import {
    collectUsedResources,
    describeUsedResource,
    readUsedResourceStates,
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
 * The registered resources of one host, kept up to date. `null` while nothing has been read, and also
 * when the host has no such state at all - a js-controller before 8.0 does not keep them
 *
 * @param socket the connection
 * @param hostId the host, e.g. `system.host.MSI`
 */
export function useUsedResources(socket: AdminConnection, hostId: string): HostUsedResource[] | null {
    const [resources, setResources] = useState<HostUsedResource[] | null>(null);

    useEffect(() => {
        const pattern = `${hostId}.usedResources.*`;
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

        void readUsedResourceStates(socket, [hostId]).then(result => {
            // what already arrived through the subscription is newer than the read
            states = { ...result, ...states };
            update();
        });
        void socket.subscribeState(pattern, onChange);

        return () => {
            active = false;
            socket.unsubscribeState(pattern, onChange);
        };
    }, [socket, hostId]);

    return resources;
}

/** The icon of an adapter is the same in every row and every table, so it is read only once */
const ADAPTER_ICON_CACHE: Record<string, Promise<string>> = {};

/**
 * The icon of the adapter an instance belongs to. An adapter that brings no icon keeps the place free,
 * so the instance names stay under each other
 *
 * @param props the connection and the instance, e.g. `mqtt.0`
 */
function InstanceIcon(props: { socket: AdminConnection; instance: string }): JSX.Element {
    const adapter = props.instance.split('.')[0];
    const [icon, setIcon] = useState('');

    useEffect(() => {
        let active = true;
        ADAPTER_ICON_CACHE[adapter] ||= props.socket
            .getObject(`system.adapter.${adapter}`)
            .then(obj => (obj?.common?.icon ? adminHref(`adapter/${adapter}/${obj.common.icon}`) : ''))
            .catch(() => '');

        void ADAPTER_ICON_CACHE[adapter].then(url => {
            if (active) {
                setIcon(url);
            }
        });

        return () => {
            active = false;
        };
    }, [props.socket, adapter]);

    return (
        <Box sx={{ width: 20, height: 20, flexShrink: 0 }}>
            {icon ? (
                <img
                    src={icon}
                    alt=""
                    style={{ width: 20, height: 20, objectFit: 'contain' }}
                />
            ) : null}
        </Box>
    );
}

interface UsedResourcesTableProps {
    socket: AdminConnection;
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
                            {props.hideInstance ? null : (
                                <TableCell>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <InstanceIcon
                                            socket={props.socket}
                                            instance={resource.instance}
                                        />
                                        {resource.instance}
                                    </Box>
                                </TableCell>
                            )}
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
                                        color={resource.isBlocked ? 'success' : 'info'}
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
 * The block "Used resources" of a host: a line that tells how many resources are registered and opens
 * the table when it is clicked. A host whose controller does not keep the registry (before
 * js-controller 8.0) shows nothing at all
 */
export function HostUsedResources(props: HostUsedResourcesProps): JSX.Element | null {
    const resources = useUsedResources(props.socket, props.hostId);
    const [open, setOpen] = useState(false);

    if (!resources) {
        return null;
    }

    const conflicts = resources.filter(resource => resource.conflicts.length);

    return (
        <Box
            sx={{ width: '100%', px: 2, pb: 1 }}
            onClick={e => e.stopPropagation()}
        >
            <Box
                sx={theme => ({
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.5,
                    pl: 0.5,
                    pr: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.action.hover,
                    '&:hover': { backgroundColor: theme.palette.action.selected },
                })}
                onClick={() => setOpen(!open)}
            >
                <ExpandMoreIcon
                    fontSize="small"
                    sx={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : undefined }}
                />
                <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 'bold' }}
                >
                    {props.t('Used resources')}
                </Typography>
                <Chip
                    size="small"
                    label={resources.length}
                />
                {conflicts.length ? (
                    <Tooltip
                        title={
                            <span style={{ whiteSpace: 'pre-line' }}>
                                {conflicts
                                    .map(
                                        resource =>
                                            `${describeUsedResource(resource)}: ${usedResourceConflictText(resource, props.t)}`,
                                    )
                                    .join('\n')}
                            </span>
                        }
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'warning.main' }}>
                            <WarningIcon
                                fontSize="small"
                                color="warning"
                            />
                            {conflicts.length}
                        </Box>
                    </Tooltip>
                ) : null}
            </Box>
            {open ? (
                <Box sx={{ mt: 1, maxHeight: 400, overflowY: 'auto' }}>
                    {resources.length ? (
                        <UsedResourcesTable
                            socket={props.socket}
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
            ) : null}
        </Box>
    );
}
