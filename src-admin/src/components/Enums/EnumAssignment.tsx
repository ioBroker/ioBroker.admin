import React, { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import ChannelDetectorModule, { Types } from '@iobroker/type-detector';

import {
    Box,
    Button,
    Checkbox,
    Chip,
    FormControlLabel,
    IconButton,
    LinearProgress,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Select,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';

import {
    Add as IconAdd,
    AutoFixHigh as IconSuggestions,
    Check as IconCheck,
    Clear as IconClear,
    Refresh as IconRefresh,
} from '@mui/icons-material';

import {
    DeviceTypeIcon,
    Icon,
    IconChannel,
    IconDevice,
    extendDeviceTypeTranslation,
    getSelectIdIcon,
    type AdminConnection,
    type IobTheme,
    type Translate,
} from '@iobroker/gui-components';

import type { MemberChanges } from './types';

/**
 * The package is CommonJS: depending on the bundler, the default import is the class itself
 * or the module object with the class as `default`
 */
const ChannelDetector: typeof ChannelDetectorModule =
    (ChannelDetectorModule as unknown as { default?: typeof ChannelDetectorModule }).default || ChannelDetectorModule;

const ROOMS = 'enum.rooms.';
const FUNCTIONS = 'enum.functions.';

/** Stored setting: show only the detected devices */
const ONLY_DEVICES_KEY = 'enumsAssignmentOnlyDevices';

function getStorage(): Storage {
    return ((window as any)._localStorage as Storage) || window.localStorage;
}

/** Objects below these roots are never assigned to rooms or functions */
const EXCLUDED_ROOTS = ['system', '_design', 'enum', 'script'];

const LIGHT = ['beleuchtung', 'lighting', 'licht', 'light', 'lampe', 'lamp'];
const BLIND = ['beschattung', 'shading', 'rollladen', 'rolladen', 'jalousie', 'shutter', 'blind', 'rollo'];
const HEATING = ['heizung', 'heating', 'thermostat', 'klima', 'climate'];
const CLIMATE = ['klima', 'climate', 'lüftung', 'ventilation', 'heizung', 'heating'];
const TEMPERATURE = ['temperatur', 'temperature', 'klima', 'climate', 'wetter', 'weather'];
const SECURITY = ['sicherheit', 'security', 'alarm'];
const SOCKET = ['steckdose', 'socket', 'schalter', 'switch'];
const MEDIA = ['multimedia', 'media', 'musik', 'music', 'audio', 'unterhaltung', 'entertainment'];
const BUTTON = ['taster', 'button', 'schalter', 'switch'];

/**
 * Words, which are searched in the IDs and names of the function enums to find a function for a detected device type.
 * The first word with a matching enum wins.
 */
const TYPE_FUNCTION_WORDS: Partial<Record<Types, string[]>> = {
    [Types.light]: LIGHT,
    [Types.dimmer]: LIGHT,
    [Types.ct]: LIGHT,
    [Types.rgb]: LIGHT,
    [Types.rgbSingle]: LIGHT,
    [Types.rgbwSingle]: LIGHT,
    [Types.hue]: LIGHT,
    [Types.cie]: LIGHT,
    [Types.blind]: BLIND,
    [Types.blindButtons]: BLIND,
    [Types.thermostat]: HEATING,
    [Types.airCondition]: CLIMATE,
    [Types.airPurifier]: CLIMATE,
    [Types.airQuality]: CLIMATE,
    [Types.fan]: CLIMATE,
    [Types.temperature]: TEMPERATURE,
    [Types.humidity]: TEMPERATURE,
    [Types.socket]: SOCKET,
    [Types.window]: ['fenster', 'window'],
    [Types.windowTilt]: ['fenster', 'window'],
    [Types.door]: ['tür', 'door'],
    [Types.gate]: ['garagentor', 'gate', 'garage'],
    [Types.lock]: ['schloss', 'lock', ...SECURITY],
    [Types.motion]: SECURITY,
    [Types.fireAlarm]: SECURITY,
    [Types.floodAlarm]: SECURITY,
    [Types.coAlarm]: SECURITY,
    [Types.camera]: ['kamera', 'camera', ...SECURITY],
    [Types.media]: MEDIA,
    [Types.volume]: MEDIA,
    [Types.volumeGroup]: MEDIA,
    [Types.vacuumCleaner]: ['staubsauger', 'vacuum', 'reinigung', 'cleaning'],
    [Types.electricity]: ['energie', 'energy', 'strom', 'verbrauch', 'consumption'],
    [Types.weatherCurrent]: ['wetter', 'weather'],
    [Types.weatherForecast]: ['wetter', 'weather'],
    [Types.pump]: ['pumpe', 'pump', 'bewässerung', 'irrigation'],
    [Types.button]: BUTTON,
    [Types.buttonSensor]: BUTTON,
    [Types.illuminance]: ['helligkeit', 'brightness', ...LIGHT],
};

const styles: Record<string, any> = {
    root: {
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        minWidth: 0,
        height: '100%',
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1.5,
        px: 2,
        py: 1,
    },
    search: {
        minWidth: 200,
    },
    instance: {
        minWidth: 160,
    },
    filter: {
        '& .MuiToggleButton-root': {
            textTransform: 'none',
            py: 0.25,
        },
    },
    bulkBar: (theme: IobTheme) => ({
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
        px: 2,
        py: 0.75,
        backgroundColor: theme.palette.action.selected,
    }),
    table: {
        flexGrow: 1,
        overflow: 'auto',
    },
    headerCell: (theme: IobTheme) => ({
        backgroundColor: theme.palette.background.paper,
        whiteSpace: 'nowrap',
    }),
    nameBox: {
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        minWidth: 220,
    },
    nameText: {
        minWidth: 0,
    },
    icon: {
        width: 24,
        height: 24,
        flexShrink: 0,
    },
    mono: {
        fontFamily: 'monospace',
        opacity: 0.6,
        display: 'block',
    },
    type: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        whiteSpace: 'nowrap',
    },
    typeIcon: {
        width: 20,
        height: 20,
    },
    cell: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.5,
        minWidth: 180,
    },
    chipIcon: {
        width: 16,
        height: 16,
    },
    partialChip: {
        opacity: 0.6,
    },
    suggestionChip: {
        borderStyle: 'dashed',
        // a suggestion must be clearly weaker than a real assignment
        opacity: 0.7,
    },
    menuIcon: {
        width: 20,
        height: 20,
    },
    empty: {
        p: 4,
        textAlign: 'center',
        opacity: 0.6,
    },
};

interface AssignmentRow {
    id: string;
    obj: ioBroker.Object;
    /** Adapter instance like "hm-rpc.0", "alias.0" or "0_userdata.0" */
    instance: string;
    /** 1 for the channels of a device */
    level: number;
    name: string;
}

interface Assignment {
    /** Enums, which have the object itself as member */
    direct: string[];
    /** Enums, which have a parent of the object as member */
    inherited: string[];
    /** Enums, which have some children of the object as member */
    partial: string[];
}

interface MemberIndex {
    direct: Map<string, string[]>;
    /** Enums of the members below an ID */
    children: Map<string, Set<string>>;
}

type Filter = 'all' | 'noRoom' | 'noFunction';

interface MenuState {
    anchor: HTMLElement;
    prefix: string;
    /** toggle: switch one enum of one row, set: replace the enums of all selected rows */
    mode: 'toggle' | 'set';
    rowId?: string;
}

function buildRows(
    objects: Record<string, ioBroker.Object>,
    sortedKeys: string[],
    getName: (name: ioBroker.StringOrTranslated | undefined) => string,
): AssignmentRow[] {
    const withChildren = new Set<string>();
    for (const id of sortedKeys) {
        withChildren.add(id.substring(0, id.lastIndexOf('.')));
    }

    const rows: AssignmentRow[] = [];
    for (const id of sortedKeys) {
        const obj = objects[id];
        if (obj?.type !== 'device' && obj?.type !== 'channel') {
            continue;
        }
        const parts = id.split('.');
        // only objects with something below them can be used in rooms and functions
        if (
            parts.length < 3 ||
            EXCLUDED_ROOTS.includes(parts[0]) ||
            parts[parts.length - 1] === 'info' ||
            !withChildren.has(id)
        ) {
            continue;
        }
        const parentId = parts.slice(0, -1).join('.');
        rows.push({
            id,
            obj,
            instance: `${parts[0]}.${parts[1]}`,
            level: objects[parentId]?.type === 'device' ? 1 : 0,
            name: getName(obj.common?.name) || parts[parts.length - 1],
        });
    }
    return rows;
}

function buildIndex(enums: Record<string, ioBroker.EnumObject>, prefix: string): MemberIndex {
    const direct = new Map<string, string[]>();
    const children = new Map<string, Set<string>>();
    for (const enumObj of Object.values(enums)) {
        if (!enumObj._id.startsWith(prefix)) {
            continue;
        }
        for (const memberId of enumObj.common?.members || []) {
            const list = direct.get(memberId);
            if (!list) {
                direct.set(memberId, [enumObj._id]);
            } else if (!list.includes(enumObj._id)) {
                list.push(enumObj._id);
            }
            const parts = memberId.split('.');
            for (let i = 2; i < parts.length; i++) {
                const ancestorId = parts.slice(0, i).join('.');
                let set = children.get(ancestorId);
                if (!set) {
                    set = new Set();
                    children.set(ancestorId, set);
                }
                set.add(enumObj._id);
            }
        }
    }
    return { direct, children };
}

function getAssignment(id: string, index: MemberIndex): Assignment {
    const direct = index.direct.get(id) || [];
    const inherited: string[] = [];
    const parts = id.split('.');
    for (let i = 2; i < parts.length; i++) {
        for (const enumId of index.direct.get(parts.slice(0, i).join('.')) || []) {
            if (!direct.includes(enumId) && !inherited.includes(enumId)) {
                inherited.push(enumId);
            }
        }
    }
    const partial = [...(index.children.get(id) || [])].filter(
        enumId => !direct.includes(enumId) && !inherited.includes(enumId),
    );
    return { direct, inherited, partial };
}

const isAssigned = (assignment: Assignment): boolean =>
    !!(assignment.direct.length || assignment.inherited.length || assignment.partial.length);

function normalize(text: string): string {
    return text.toLowerCase().replace(/[\s_.-]/g, '');
}

function findFunctionEnum(type: Types | null, functionEnums: ioBroker.EnumObject[]): ioBroker.EnumObject | null {
    const words = type ? TYPE_FUNCTION_WORDS[type] : undefined;
    if (!words) {
        return null;
    }
    for (const word of words) {
        const found = functionEnums.find(enumObj => {
            const texts = [enumObj._id.split('.').pop() || ''];
            const name = enumObj.common?.name;
            if (typeof name === 'string') {
                texts.push(name);
            } else if (name) {
                texts.push(...Object.values(name).filter((text): text is string => typeof text === 'string'));
            }
            return texts.some(text => normalize(text).includes(word));
        });
        if (found) {
            return found;
        }
    }
    return null;
}

function addChange(changes: MemberChanges, enumId: string, kind: 'add' | 'remove', id: string): void {
    changes[enumId] ||= {};
    (changes[enumId][kind] ||= []).push(id);
}

interface AssignmentCellProps {
    assignment: Assignment;
    suggestion?: ioBroker.EnumObject | null;
    enums: Record<string, ioBroker.EnumObject>;
    getLabel: (enumId: string) => string;
    t: Translate;
    onRemove: (enumId: string) => void;
    onAccept: (enumId: string) => void;
    onOpenEnum?: (enumId: string) => void;
    onOpenMenu: (anchor: HTMLElement) => void;
}

function AssignmentCell(props: AssignmentCellProps): JSX.Element {
    const { assignment, t } = props;
    const chipIcon = (enumId: string): JSX.Element | undefined =>
        props.enums[enumId]?.common?.icon ? (
            <Icon
                src={props.enums[enumId].common.icon}
                style={styles.chipIcon}
            />
        ) : undefined;

    return (
        <Box sx={styles.cell}>
            {assignment.direct.map(enumId => (
                <Chip
                    key={enumId}
                    size="small"
                    label={props.getLabel(enumId)}
                    icon={chipIcon(enumId)}
                    onClick={props.onOpenEnum ? () => props.onOpenEnum?.(enumId) : undefined}
                    onDelete={() => props.onRemove(enumId)}
                />
            ))}
            {assignment.inherited.map(enumId => (
                <Tooltip
                    key={enumId}
                    title={t('Assigned via the device')}
                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                >
                    <Chip
                        size="small"
                        variant="outlined"
                        color="primary"
                        label={props.getLabel(enumId)}
                        icon={chipIcon(enumId)}
                        onClick={props.onOpenEnum ? () => props.onOpenEnum?.(enumId) : undefined}
                    />
                </Tooltip>
            ))}
            {assignment.partial.map(enumId => (
                <Tooltip
                    key={enumId}
                    title={t('Assigned via single states')}
                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                >
                    <Chip
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={styles.partialChip}
                        label={props.getLabel(enumId)}
                        icon={chipIcon(enumId)}
                        onClick={props.onOpenEnum ? () => props.onOpenEnum?.(enumId) : undefined}
                    />
                </Tooltip>
            ))}
            {props.suggestion ? (
                <Tooltip
                    title={t('Suggestion from the detected device type')}
                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                >
                    <Chip
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={styles.suggestionChip}
                        icon={<IconAdd />}
                        label={props.getLabel(props.suggestion._id)}
                        onClick={() => props.suggestion && props.onAccept(props.suggestion._id)}
                    />
                </Tooltip>
            ) : null}
            <IconButton
                size="small"
                onClick={e => props.onOpenMenu(e.currentTarget)}
            >
                <IconAdd fontSize="small" />
            </IconButton>
        </Box>
    );
}

interface EnumAssignmentProps {
    socket: AdminConnection;
    enums: Record<string, ioBroker.EnumObject>;
    t: Translate;
    theme: IobTheme;
    getName: (name: ioBroker.StringOrTranslated | undefined) => string;
    onChangeMembers: (changes: MemberChanges) => Promise<void>;
    /** Show the enum in the categories view. Without it, the chips cannot be clicked */
    onOpenEnum?: (enumId: string) => void;
    /** Filter shown first */
    initialFilter?: Filter;
}

export default function EnumAssignment(props: EnumAssignmentProps): JSX.Element {
    const { t, enums, getName } = props;

    const [objects, setObjects] = useState<Record<string, ioBroker.Object> | null>(null);
    const [reload, setReload] = useState(0);
    const [search, setSearch] = useState('');
    const [instance, setInstance] = useState('');
    const [filter, setFilter] = useState<Filter>(props.initialFilter || 'all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [selected, setSelected] = useState<string[]>([]);
    const [menu, setMenu] = useState<MenuState | null>(null);
    const [onlyDevices, setOnlyDevices] = useState(() => getStorage().getItem(ONLY_DEVICES_KEY) !== 'false');

    const detector = useMemo(() => new ChannelDetector(), []);
    /** Detected device type of every row, computed on demand */
    const detected = useRef(new Map<string, Types | null>());

    useEffect(() => {
        extendDeviceTypeTranslation();
    }, []);

    useEffect(() => {
        setTimeout(() => {
            setObjects(null);
            // the local cache of the connection holds only the objects read one by one, so always read all objects
            props.socket
                .getObjects(true, true)
                .then(result => {
                    detected.current.clear();
                    setObjects(result);
                })
                .catch((e: unknown) => {
                    console.error('Cannot read the objects:', e);
                    setObjects({});
                });
        }, 0);
    }, [props.socket, reload]);

    const sortedKeys = useMemo(() => (objects ? Object.keys(objects).sort() : []), [objects]);
    const rows = useMemo(
        () => (objects ? buildRows(objects, sortedKeys, getName) : []),
        [objects, sortedKeys, getName],
    );
    const instances = useMemo(() => [...new Set(rows.map(row => row.instance))].sort(), [rows]);

    const roomIndex = useMemo(() => buildIndex(enums, ROOMS), [enums]);
    const functionIndex = useMemo(() => buildIndex(enums, FUNCTIONS), [enums]);

    const getLabel = (enumId: string): string => {
        const parts = enumId.split('.');
        const names: string[] = [];
        for (let i = 3; i <= parts.length; i++) {
            const id = parts.slice(0, i).join('.');
            names.push(getName(enums[id]?.common?.name) || parts[i - 1]);
        }
        return names.join(' / ');
    };

    const sortedEnums = (prefix: string): ioBroker.EnumObject[] =>
        Object.values(enums)
            .filter(enumObj => enumObj._id.startsWith(prefix))
            .sort((a, b) => getLabel(a._id).localeCompare(getLabel(b._id)));
    const functionEnums = useMemo(
        () => Object.values(enums).filter(enumObj => enumObj._id.startsWith(FUNCTIONS)),
        [enums],
    );

    const detectType = (id: string): Types | null => {
        if (!objects) {
            return null;
        }
        if (detected.current.has(id)) {
            return detected.current.get(id) || null;
        }
        let type: Types | null = null;
        try {
            const controls = detector.detect({
                objects,
                id,
                _keysOptional: sortedKeys,
                _keysOptionalSorted: true,
                _usedIdsOptional: [],
                ignoreIndicators: ['UNREACH_STICKY'],
                // these types describe no device, which belongs to a room or a function
                excludedTypes: [
                    Types.info,
                    Types.instance,
                    Types.chart,
                    Types.image,
                    Types.location,
                    Types.locationOne,
                ],
            });
            type = controls?.[0]?.type || null;
        } catch (e) {
            console.warn(`Cannot detect the type of "${id}":`, e);
        }
        detected.current.set(id, type);
        return type;
    };

    const getSuggestion = (id: string): ioBroker.EnumObject | null =>
        isAssigned(getAssignment(id, functionIndex)) ? null : findFunctionEnum(detectType(id), functionEnums);

    // The detected types are cached, so the rows are filtered on every render without a noticeable delay
    const searchText = search.trim().toLowerCase();
    const filteredRows = rows.filter(
        row =>
            (!instance || row.instance === instance) &&
            (!searchText || row.name.toLowerCase().includes(searchText) || row.id.toLowerCase().includes(searchText)) &&
            (!onlyDevices ||
                !!detectType(row.id) ||
                isAssigned(getAssignment(row.id, roomIndex)) ||
                isAssigned(getAssignment(row.id, functionIndex))),
    );
    const withoutRoom = filteredRows.filter(row => !isAssigned(getAssignment(row.id, roomIndex)));
    const withoutFunction = filteredRows.filter(row => !isAssigned(getAssignment(row.id, functionIndex)));
    const shownRows = filter === 'noRoom' ? withoutRoom : filter === 'noFunction' ? withoutFunction : filteredRows;
    const maxPage = Math.max(0, Math.ceil(shownRows.length / rowsPerPage) - 1);
    const currentPage = Math.min(page, maxPage);
    const pageRows = shownRows.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

    const toggleMember = (rowId: string, enumId: string): void => {
        const changes: MemberChanges = {};
        const index = enumId.startsWith(ROOMS) ? roomIndex : functionIndex;
        addChange(changes, enumId, getAssignment(rowId, index).direct.includes(enumId) ? 'remove' : 'add', rowId);
        void props.onChangeMembers(changes);
    };

    /** Replace the direct rooms or functions of the selected rows with the given enum, or remove them all */
    const setForSelected = (prefix: string, enumId: string | null): void => {
        const index = prefix === ROOMS ? roomIndex : functionIndex;
        const changes: MemberChanges = {};
        for (const rowId of selected) {
            const direct = getAssignment(rowId, index).direct;
            direct.filter(id => id !== enumId).forEach(id => addChange(changes, id, 'remove', rowId));
            if (enumId && !direct.includes(enumId)) {
                addChange(changes, enumId, 'add', rowId);
            }
        }
        void props.onChangeMembers(changes);
    };

    const acceptSuggestions = (rowIds: string[]): void => {
        const changes: MemberChanges = {};
        for (const rowId of rowIds) {
            const suggestion = getSuggestion(rowId);
            if (suggestion) {
                addChange(changes, suggestion._id, 'add', rowId);
            }
        }
        void props.onChangeMembers(changes);
    };

    const renderMenu = (): JSX.Element | null => {
        if (!menu) {
            return null;
        }
        const index = menu.prefix === ROOMS ? roomIndex : functionIndex;
        const direct = menu.rowId ? getAssignment(menu.rowId, index).direct : [];
        const close = (): void => setMenu(null);

        return (
            <Menu
                open
                anchorEl={menu.anchor}
                onClose={close}
            >
                {menu.mode === 'set' ? (
                    <MenuItem
                        onClick={() => {
                            close();
                            setForSelected(menu.prefix, null);
                        }}
                    >
                        <ListItemIcon>
                            <IconClear fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>{t(menu.prefix === ROOMS ? 'No room' : 'No function')}</ListItemText>
                    </MenuItem>
                ) : null}
                {sortedEnums(menu.prefix).map(enumObj => (
                    <MenuItem
                        key={enumObj._id}
                        onClick={() => {
                            close();
                            if (menu.mode === 'set') {
                                setForSelected(menu.prefix, enumObj._id);
                            } else if (menu.rowId) {
                                toggleMember(menu.rowId, enumObj._id);
                            }
                        }}
                    >
                        <ListItemIcon>
                            {direct.includes(enumObj._id) ? (
                                <IconCheck fontSize="small" />
                            ) : enumObj.common?.icon ? (
                                <Icon
                                    src={enumObj.common.icon}
                                    style={styles.menuIcon}
                                />
                            ) : null}
                        </ListItemIcon>
                        <ListItemText>{getLabel(enumObj._id)}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        );
    };

    const renderRow = (row: AssignmentRow): JSX.Element => {
        const iconSrc = getSelectIdIcon(row.obj);
        const type = detectType(row.id);
        const isSelected = selected.includes(row.id);

        return (
            <TableRow
                key={row.id}
                hover
                selected={isSelected}
            >
                <TableCell padding="checkbox">
                    <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() =>
                            setSelected(isSelected ? selected.filter(id => id !== row.id) : [...selected, row.id])
                        }
                    />
                </TableCell>
                <TableCell>
                    <Box
                        sx={styles.nameBox}
                        style={{ paddingLeft: row.level * 24 }}
                    >
                        {iconSrc ? (
                            <Icon
                                src={iconSrc}
                                style={styles.icon}
                            />
                        ) : row.obj.type === 'device' ? (
                            <IconDevice style={styles.icon} />
                        ) : (
                            <IconChannel style={styles.icon} />
                        )}
                        <Box sx={styles.nameText}>
                            <Typography
                                variant="body2"
                                noWrap
                            >
                                {row.name}
                            </Typography>
                            <Typography
                                variant="caption"
                                component="div"
                                noWrap
                                sx={styles.mono}
                            >
                                {row.id}
                            </Typography>
                        </Box>
                    </Box>
                </TableCell>
                <TableCell>
                    {type ? (
                        <Box sx={styles.type}>
                            <DeviceTypeIcon
                                type={type}
                                style={styles.typeIcon}
                            />
                            <Typography variant="body2">{t(`type-${type}`)}</Typography>
                        </Box>
                    ) : (
                        '–'
                    )}
                </TableCell>
                <TableCell>
                    <AssignmentCell
                        assignment={getAssignment(row.id, roomIndex)}
                        enums={enums}
                        getLabel={getLabel}
                        t={t}
                        onRemove={enumId => toggleMember(row.id, enumId)}
                        onAccept={enumId => toggleMember(row.id, enumId)}
                        onOpenEnum={props.onOpenEnum}
                        onOpenMenu={anchor => setMenu({ anchor, prefix: ROOMS, mode: 'toggle', rowId: row.id })}
                    />
                </TableCell>
                <TableCell>
                    <AssignmentCell
                        assignment={getAssignment(row.id, functionIndex)}
                        suggestion={getSuggestion(row.id)}
                        enums={enums}
                        getLabel={getLabel}
                        t={t}
                        onRemove={enumId => toggleMember(row.id, enumId)}
                        onAccept={enumId => toggleMember(row.id, enumId)}
                        onOpenEnum={props.onOpenEnum}
                        onOpenMenu={anchor => setMenu({ anchor, prefix: FUNCTIONS, mode: 'toggle', rowId: row.id })}
                    />
                </TableCell>
            </TableRow>
        );
    };

    const allShownSelected = !!shownRows.length && shownRows.every(row => selected.includes(row.id));

    return (
        <Box sx={styles.root}>
            <Box sx={styles.toolbar}>
                <TextField
                    variant="standard"
                    placeholder={t('Filter')}
                    sx={styles.search}
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        setPage(0);
                    }}
                    slotProps={{
                        input: {
                            endAdornment: search ? (
                                <IconButton
                                    tabIndex={-1}
                                    size="small"
                                    onClick={() => setSearch('')}
                                >
                                    <IconClear />
                                </IconButton>
                            ) : null,
                        },
                    }}
                />
                <Select
                    variant="standard"
                    displayEmpty
                    sx={styles.instance}
                    value={instance}
                    onChange={e => {
                        setInstance(e.target.value);
                        setPage(0);
                    }}
                >
                    <MenuItem value="">{t('All instances')}</MenuItem>
                    {instances.map(item => (
                        <MenuItem
                            key={item}
                            value={item}
                        >
                            {item}
                        </MenuItem>
                    ))}
                </Select>
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    sx={styles.filter}
                    value={filter}
                    onChange={(_e, value: Filter | null) => {
                        if (value) {
                            setFilter(value);
                            setPage(0);
                        }
                    }}
                >
                    <ToggleButton value="all">
                        {t('All')} ({filteredRows.length})
                    </ToggleButton>
                    <ToggleButton value="noRoom">
                        {t('Without room')} ({withoutRoom.length})
                    </ToggleButton>
                    <ToggleButton value="noFunction">
                        {t('Without function')} ({withoutFunction.length})
                    </ToggleButton>
                </ToggleButtonGroup>
                <Tooltip
                    title={t(
                        'Show only objects, which were detected as a device or which already have a room or a function',
                    )}
                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                >
                    <FormControlLabel
                        label={t('Only detected devices')}
                        control={
                            <Switch
                                size="small"
                                checked={onlyDevices}
                                onChange={e => {
                                    setOnlyDevices(e.target.checked);
                                    getStorage().setItem(ONLY_DEVICES_KEY, e.target.checked ? 'true' : 'false');
                                    setPage(0);
                                }}
                            />
                        }
                    />
                </Tooltip>
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip
                    title={t('Reload')}
                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                >
                    <IconButton onClick={() => setReload(reload + 1)}>
                        <IconRefresh />
                    </IconButton>
                </Tooltip>
            </Box>
            {selected.length ? (
                <Box sx={styles.bulkBar}>
                    <Typography variant="body2">{t('%s selected', selected.length)}</Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={e => setMenu({ anchor: e.currentTarget, prefix: ROOMS, mode: 'set' })}
                    >
                        {t('Set room')}
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={e => setMenu({ anchor: e.currentTarget, prefix: FUNCTIONS, mode: 'set' })}
                    >
                        {t('Set function')}
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<IconSuggestions />}
                        onClick={() => acceptSuggestions(selected)}
                    >
                        {t('Accept suggestions')}
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        size="small"
                        color="grey"
                        onClick={() => setSelected([])}
                    >
                        {t('Clear selection')}
                    </Button>
                </Box>
            ) : null}
            {!objects ? <LinearProgress /> : null}
            <TableContainer sx={styles.table}>
                <Table
                    size="small"
                    stickyHeader
                >
                    <TableHead>
                        <TableRow>
                            <TableCell
                                padding="checkbox"
                                sx={styles.headerCell}
                            >
                                <Checkbox
                                    size="small"
                                    checked={allShownSelected}
                                    indeterminate={!allShownSelected && !!selected.length}
                                    onChange={() => setSelected(allShownSelected ? [] : shownRows.map(row => row.id))}
                                />
                            </TableCell>
                            <TableCell sx={styles.headerCell}>{t('Device or channel')}</TableCell>
                            <TableCell sx={styles.headerCell}>{t('Detected type')}</TableCell>
                            <TableCell sx={styles.headerCell}>{t('Rooms')}</TableCell>
                            <TableCell sx={styles.headerCell}>{t('Functions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>{pageRows.map(row => renderRow(row))}</TableBody>
                </Table>
                {objects && !shownRows.length ? <Box sx={styles.empty}>{t('No devices or channels found')}</Box> : null}
            </TableContainer>
            <TablePagination
                component="div"
                count={shownRows.length}
                page={currentPage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[25, 50, 100]}
                onPageChange={(_e, newPage) => setPage(newPage)}
                onRowsPerPageChange={e => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                }}
            />
            {renderMenu()}
        </Box>
    );
}
