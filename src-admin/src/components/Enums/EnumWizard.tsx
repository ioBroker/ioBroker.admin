import React, { useMemo, useState, type JSX } from 'react';

import {
    Box,
    Button,
    ButtonBase,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Step,
    StepLabel,
    Stepper,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';

import {
    Add as IconAdd,
    ArrowBack as IconBack,
    ArrowForward as IconNext,
    Check as IconFinish,
    CheckCircle as IconSelected,
    Close as IconCancel,
    List as IconList,
} from '@mui/icons-material';

import {
    Icon,
    Utils,
    getClassicIconTemplates,
    type AdminConnection,
    type ClassicIconTemplate,
    type IobTheme,
    type Translate,
} from '@iobroker/gui-components';

import EnumAssignment from './EnumAssignment';
import type { MemberChanges } from './types';

/** Classic room templates, which are offered as floors */
const FLOOR_TEMPLATES = ['cellar', 'basement', 'ground_floor', 'upstairs', 'second_floor', 'attic', 'outdoors'];

/** Rooms shown before "Show more" is pressed */
const COMMON_ROOMS = [
    'living_room',
    'kitchen',
    'dining_room',
    'bedroom',
    'nursery',
    'guest_room',
    'bathroom',
    'wc',
    'office',
    'corridor',
    'laundry_room',
    'storeroom',
    'garage',
    'garden',
    'terrace',
    'balcony',
];

/** Rooms selected by default, if there are no rooms yet */
const PRESELECTED_ROOMS = ['living_room', 'kitchen', 'bedroom', 'bathroom'];

/** Floors selected by default, if there are no floors yet */
const PRESELECTED_FLOORS = ['ground_floor', 'upstairs'];

/** Functions shown before "Show more" is pressed */
const COMMON_FUNCTIONS = [
    'lighting',
    'shading',
    'heating',
    'climate',
    'socket',
    'window',
    'door',
    'security',
    'smoke_detector',
    'music',
    'weather',
    'temperature_sensor',
    'consumption',
];

/** Functions selected by default, if there are no functions yet */
const PRESELECTED_FUNCTIONS = ['lighting', 'shading', 'heating', 'socket', 'window', 'door'];

const STEPS = ['Floors', 'Rooms', 'Functions', 'Assign devices', 'Overview'];

const ROOT_NAMES: Record<string, ioBroker.Translated> = {
    'enum.rooms': {
        en: 'Rooms',
        de: 'Räume',
        ru: 'Комнаты',
        pt: 'Divisões',
        nl: 'Kamers',
        fr: 'Pièces',
        it: 'Stanze',
        es: 'Habitaciones',
        pl: 'Pomieszczenia',
        uk: 'Кімнати',
        'zh-cn': '房间',
    },
    'enum.functions': {
        en: 'Functions',
        de: 'Funktionen',
        ru: 'Функции',
        pt: 'Funções',
        nl: 'Functies',
        fr: 'Fonctions',
        it: 'Funzioni',
        es: 'Funciones',
        pl: 'Funkcje',
        uk: 'Функції',
        'zh-cn': '功能',
    },
};

const styles: Record<string, any> = {
    dialogPaper: {
        height: '85vh',
    },
    stepper: {
        px: 3,
        pb: 2,
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    assignment: {
        display: 'flex',
        height: '100%',
        minHeight: 0,
        p: 0,
    },
    hint: {
        opacity: 0.8,
    },
    group: {
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
    },
    groupTitle: {
        fontWeight: 600,
    },
    tiles: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: 1,
    },
    tile: (theme: IobTheme) => ({
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 0.5,
        p: 1,
        height: 110,
        borderRadius: '8px',
        border: `2px solid ${theme.palette.divider}`,
        transition: 'border-color 0.2s, background-color 0.2s',
        '&:hover': {
            borderColor: theme.palette.text.disabled,
        },
    }),
    tileSelected: (theme: IobTheme) => ({
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.action.selected,
        '&:hover': {
            borderColor: theme.palette.primary.main,
        },
    }),
    tileLocked: {
        opacity: 0.6,
    },
    tileCheck: {
        position: 'absolute',
        top: 6,
        right: 6,
        fontSize: 20,
    },
    tileIcon: {
        width: 40,
        height: 40,
    },
    tileName: {
        textAlign: 'center',
        lineHeight: 1.2,
    },
    addRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
    },
    summary: {
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
    },
};

interface Entry {
    id: string;
    name: ioBroker.StringOrTranslated;
    icon?: string;
}

interface ExistingEnums {
    floors: string[];
    /** Room IDs by floor, '' for the rooms without a floor */
    rooms: Record<string, string[]>;
    functions: string[];
}

function findExisting(enums: Record<string, ioBroker.EnumObject>): ExistingEnums {
    const roomIds = Object.keys(enums).filter(id => id.startsWith('enum.rooms.'));
    const floors = new Set<string>();
    for (const id of roomIds) {
        const parts = id.split('.');
        // a room with rooms inside or a room named like a floor template is a floor
        if (parts.length > 3 || FLOOR_TEMPLATES.includes(parts[2])) {
            floors.add(parts[2]);
        }
    }
    const rooms: Record<string, string[]> = {};
    for (const id of roomIds) {
        const parts = id.split('.');
        if (parts.length === 4) {
            (rooms[parts[2]] ||= []).push(parts[3]);
        } else if (parts.length === 3 && !floors.has(parts[2])) {
            (rooms[''] ||= []).push(parts[2]);
        }
    }
    const functions = Object.keys(enums)
        .filter(id => id.startsWith('enum.functions.') && id.split('.').length === 3)
        .map(id => id.split('.')[2]);

    return { floors: [...floors], rooms, functions };
}

function nameToId(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(Utils.FORBIDDEN_CHARS, '_')
        .replace(/[\s.,]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

function uniqueTemplates(templates: ClassicIconTemplate[]): ClassicIconTemplate[] {
    return templates.filter((template, i) => templates.findIndex(item => item._id === template._id) === i);
}

const toggle = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter(item => item !== id) : [...list, id];

function Tile(props: {
    name: string;
    icon?: string;
    selected: boolean;
    locked?: boolean;
    lockedText?: string;
    theme: IobTheme;
    onClick: () => void;
}): JSX.Element {
    return (
        <ButtonBase
            disabled={props.locked}
            onClick={props.onClick}
            sx={Utils.getStyle(
                props.theme,
                styles.tile,
                props.selected && styles.tileSelected,
                props.locked && styles.tileLocked,
            )}
        >
            {props.selected ? (
                <IconSelected
                    color="primary"
                    sx={styles.tileCheck}
                />
            ) : null}
            {props.icon ? (
                <Icon
                    src={props.icon}
                    style={styles.tileIcon}
                />
            ) : (
                <IconList style={styles.tileIcon} />
            )}
            <Typography
                variant="body2"
                sx={styles.tileName}
            >
                {props.name}
            </Typography>
            {props.locked && props.lockedText ? (
                <Typography
                    variant="caption"
                    sx={styles.hint}
                >
                    {props.lockedText}
                </Typography>
            ) : null}
        </ButtonBase>
    );
}

function AddCustom(props: {
    t: Translate;
    placeholder: string;
    usedIds: string[];
    onAdd: (entry: Entry) => void;
}): JSX.Element {
    const [name, setName] = useState('');
    const id = nameToId(name);
    const valid = !!id && !props.usedIds.includes(id);
    const add = (): void => {
        if (valid) {
            props.onAdd({ id, name: name.trim() });
            setName('');
        }
    };

    return (
        <Box sx={styles.addRow}>
            <TextField
                variant="standard"
                placeholder={props.placeholder}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        add();
                    }
                }}
            />
            <Button
                size="small"
                startIcon={<IconAdd />}
                disabled={!valid}
                onClick={add}
            >
                {props.t('Add')}
            </Button>
        </Box>
    );
}

interface EnumWizardProps {
    socket: AdminConnection;
    enums: Record<string, ioBroker.EnumObject>;
    t: Translate;
    theme: IobTheme;
    getName: (name: ioBroker.StringOrTranslated | undefined) => string;
    /** Show the wizard over the whole screen */
    fullScreen: boolean;
    onCreateEnums: (enums: ioBroker.EnumObject[]) => Promise<void>;
    onChangeMembers: (changes: MemberChanges) => Promise<void>;
    onClose: () => void;
}

export default function EnumWizard(props: EnumWizardProps): JSX.Element {
    const { t, enums, getName } = props;

    const roomTemplates = useMemo(() => uniqueTemplates(getClassicIconTemplates('rooms')), []);
    const functionTemplates = useMemo(() => uniqueTemplates(getClassicIconTemplates('devices')), []);

    const [existing, setExisting] = useState<ExistingEnums>(() => findExisting(enums));
    const [step, setStep] = useState(0);
    const [useFloors, setUseFloors] = useState(() => existing.floors.length > 0);
    const [floors, setFloors] = useState<string[]>(() => (existing.floors.length ? [] : [...PRESELECTED_FLOORS]));
    const [customFloors, setCustomFloors] = useState<Entry[]>([]);
    const [rooms, setRooms] = useState<Record<string, string[]>>((): Record<string, string[]> =>
        !existing.floors.length && !existing.rooms['']?.length ? { '': [...PRESELECTED_ROOMS] } : {},
    );
    const [customRooms, setCustomRooms] = useState<Record<string, Entry[]>>({});
    const [functions, setFunctions] = useState<string[]>(() =>
        existing.functions.length ? [] : [...PRESELECTED_FUNCTIONS],
    );
    const [customFunctions, setCustomFunctions] = useState<Entry[]>([]);
    const [showAllRooms, setShowAllRooms] = useState(false);
    const [showAllFunctions, setShowAllFunctions] = useState(false);
    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState({ floors: 0, rooms: 0, functions: 0 });

    const nameOf = (entry: Entry): string => getName(entry.name) || entry.id;
    const fromTemplate = (template: ClassicIconTemplate): Entry => ({
        id: template._id,
        name: template.name,
        icon: template.icon,
    });
    const fromEnum = (enumId: string, id: string): Entry => ({
        id,
        name: enums[enumId]?.common?.name || id,
        icon: enums[enumId]?.common?.icon,
    });

    // ----- floors -----
    const floorEntries: Entry[] = [
        ...FLOOR_TEMPLATES.map(id => roomTemplates.find(template => template._id === id))
            .filter((template): template is ClassicIconTemplate => !!template)
            .map(fromTemplate),
        ...existing.floors.filter(id => !FLOOR_TEMPLATES.includes(id)).map(id => fromEnum(`enum.rooms.${id}`, id)),
        ...customFloors,
    ];
    const isFloorSelected = (id: string): boolean => existing.floors.includes(id) || floors.includes(id);
    const groups: Entry[] = useFloors
        ? floorEntries.filter(entry => isFloorSelected(entry.id))
        : [{ id: '', name: '' }];

    // ----- rooms -----
    const roomEnumId = (group: string, id: string): string =>
        group ? `enum.rooms.${group}.${id}` : `enum.rooms.${id}`;
    const isRoomExisting = (group: string, id: string): boolean => !!existing.rooms[group]?.includes(id);
    const isRoomSelected = (group: string, id: string): boolean =>
        isRoomExisting(group, id) || !!rooms[group]?.includes(id);
    /** Names of existing enums in lower case: a template with the same name would only create a duplicate */
    const existingNames = (enumIds: string[]): string[] =>
        enumIds.map(enumId => getName(enums[enumId]?.common?.name).trim().toLowerCase()).filter(name => name);
    const allRoomEntries = (group: string): Entry[] => {
        const names = existingNames((existing.rooms[group] || []).map(id => roomEnumId(group, id)));
        return [
            ...roomTemplates
                .filter(
                    template =>
                        !FLOOR_TEMPLATES.includes(template._id) &&
                        (isRoomExisting(group, template._id) ||
                            !names.includes(getName(template.name).trim().toLowerCase())),
                )
                .map(fromTemplate),
            ...(existing.rooms[group] || [])
                .filter(id => !roomTemplates.find(template => template._id === id))
                .map(id => fromEnum(roomEnumId(group, id), id)),
            ...(customRooms[group] || []),
        ];
    };
    const shownRoomEntries = (group: string): Entry[] => {
        const entries = allRoomEntries(group).filter(
            entry =>
                showAllRooms ||
                COMMON_ROOMS.includes(entry.id) ||
                isRoomSelected(group, entry.id) ||
                !roomTemplates.find(template => template._id === entry.id),
        );
        const order = (entry: Entry): number => {
            const pos = COMMON_ROOMS.indexOf(entry.id);
            return pos === -1 ? COMMON_ROOMS.length : pos;
        };
        return entries.sort((a, b) => order(a) - order(b) || nameOf(a).localeCompare(nameOf(b)));
    };

    // ----- functions -----
    const isFunctionExisting = (id: string): boolean => existing.functions.includes(id);
    const isFunctionSelected = (id: string): boolean => isFunctionExisting(id) || functions.includes(id);
    const functionNames = existingNames(existing.functions.map(id => `enum.functions.${id}`));
    const allFunctionEntries: Entry[] = [
        ...functionTemplates
            .filter(
                template =>
                    isFunctionExisting(template._id) ||
                    !functionNames.includes(getName(template.name).trim().toLowerCase()),
            )
            .map(fromTemplate),
        ...existing.functions
            .filter(id => !functionTemplates.find(template => template._id === id))
            .map(id => fromEnum(`enum.functions.${id}`, id)),
        ...customFunctions,
    ];
    const shownFunctionEntries = allFunctionEntries
        .filter(
            entry =>
                showAllFunctions ||
                COMMON_FUNCTIONS.includes(entry.id) ||
                isFunctionSelected(entry.id) ||
                !functionTemplates.find(template => template._id === entry.id),
        )
        .sort((a, b) => {
            const order = (entry: Entry): number => {
                const pos = COMMON_FUNCTIONS.indexOf(entry.id);
                return pos === -1 ? COMMON_FUNCTIONS.length : pos;
            };
            return order(a) - order(b) || nameOf(a).localeCompare(nameOf(b));
        });

    // ----- creation -----
    const buildNewEnums = (): { list: ioBroker.EnumObject[]; floors: number; rooms: number; functions: number } => {
        const list: ioBroker.EnumObject[] = [];
        const add = (id: string, name: ioBroker.StringOrTranslated, icon?: string): void => {
            if (!enums[id] && !list.find(item => item._id === id)) {
                list.push({ _id: id, type: 'enum', common: { name, icon, members: [] }, native: {} });
            }
        };
        const addRoot = (id: string): void => {
            if (!enums[id] && !list.find(item => item._id === id)) {
                list.push({
                    _id: id,
                    type: 'enum',
                    common: { name: ROOT_NAMES[id], members: [], dontDelete: true },
                    native: {},
                });
            }
        };
        let floorCount = 0;
        let roomCount = 0;
        let functionCount = 0;

        if (useFloors) {
            for (const entry of floorEntries) {
                if (floors.includes(entry.id) && !existing.floors.includes(entry.id)) {
                    addRoot('enum.rooms');
                    add(`enum.rooms.${entry.id}`, entry.name, entry.icon);
                    floorCount++;
                }
            }
        }
        for (const group of groups) {
            for (const id of rooms[group.id] || []) {
                const entry = allRoomEntries(group.id).find(item => item.id === id);
                if (entry && !isRoomExisting(group.id, id)) {
                    addRoot('enum.rooms');
                    add(roomEnumId(group.id, id), entry.name, entry.icon);
                    roomCount++;
                }
            }
        }
        for (const id of functions) {
            const entry = allFunctionEntries.find(item => item.id === id);
            if (entry && !isFunctionExisting(id)) {
                addRoot('enum.functions');
                add(`enum.functions.${id}`, entry.name, entry.icon);
                functionCount++;
            }
        }
        return { list, floors: floorCount, rooms: roomCount, functions: functionCount };
    };

    const newEnums = buildNewEnums();

    const createAndContinue = async (): Promise<void> => {
        if (newEnums.list.length) {
            setCreating(true);
            await props.onCreateEnums(newEnums.list);
            setCreating(false);
            setCreated({
                floors: created.floors + newEnums.floors,
                rooms: created.rooms + newEnums.rooms,
                functions: created.functions + newEnums.functions,
            });
            // the created entries count as existing, so going back does not create them again
            const all = { ...enums };
            newEnums.list.forEach(enumObj => (all[enumObj._id] = enumObj));
            setExisting(findExisting(all));
            setFloors([]);
            setRooms({});
            setFunctions([]);
        }
        setStep(3);
    };

    // ----- rendering -----
    const renderFloors = (): JSX.Element => (
        <Box sx={styles.content}>
            <ToggleButtonGroup
                size="small"
                exclusive
                value={useFloors ? 'floors' : 'flat'}
                onChange={(_e, value: string | null) => value && setUseFloors(value === 'floors')}
            >
                <ToggleButton value="floors">{t('With floors')}</ToggleButton>
                <ToggleButton value="flat">{t('Without floors')}</ToggleButton>
            </ToggleButtonGroup>
            <Typography
                variant="body2"
                sx={styles.hint}
            >
                {t(
                    useFloors
                        ? 'Every floor becomes a room, which contains the rooms of this floor'
                        : 'Without floors, all rooms are on the same level',
                )}
            </Typography>
            {useFloors ? (
                <>
                    <Box sx={styles.tiles}>
                        {floorEntries.map(entry => (
                            <Tile
                                key={entry.id}
                                name={nameOf(entry)}
                                icon={entry.icon}
                                selected={isFloorSelected(entry.id)}
                                locked={existing.floors.includes(entry.id)}
                                lockedText={t('Already exists')}
                                theme={props.theme}
                                onClick={() => setFloors(toggle(floors, entry.id))}
                            />
                        ))}
                    </Box>
                    <AddCustom
                        t={t}
                        placeholder={t('Custom floor')}
                        usedIds={roomTemplates.map(template => template._id).concat(floorEntries.map(e => e.id))}
                        onAdd={entry => {
                            setCustomFloors([...customFloors, entry]);
                            setFloors([...floors, entry.id]);
                        }}
                    />
                </>
            ) : null}
        </Box>
    );

    const renderRooms = (): JSX.Element => (
        <Box sx={styles.content}>
            <Typography
                variant="body2"
                sx={styles.hint}
            >
                {t(
                    useFloors
                        ? 'Select the rooms of every floor. Rooms that already exist stay unchanged'
                        : 'Select the rooms. Rooms that already exist stay unchanged',
                )}
            </Typography>
            {!groups.length ? <Typography>{t('Select at least one floor')}</Typography> : null}
            {groups.map(group => (
                <Box
                    key={group.id}
                    sx={styles.group}
                >
                    {useFloors ? (
                        <Typography
                            variant="subtitle1"
                            sx={styles.groupTitle}
                        >
                            {nameOf(group)}
                        </Typography>
                    ) : null}
                    <Box sx={styles.tiles}>
                        {shownRoomEntries(group.id).map(entry => (
                            <Tile
                                key={entry.id}
                                name={nameOf(entry)}
                                icon={entry.icon}
                                selected={isRoomSelected(group.id, entry.id)}
                                locked={isRoomExisting(group.id, entry.id)}
                                lockedText={t('Already exists')}
                                theme={props.theme}
                                onClick={() =>
                                    setRooms({ ...rooms, [group.id]: toggle(rooms[group.id] || [], entry.id) })
                                }
                            />
                        ))}
                    </Box>
                    <AddCustom
                        t={t}
                        placeholder={t('Custom room')}
                        usedIds={allRoomEntries(group.id)
                            .map(entry => entry.id)
                            .concat(FLOOR_TEMPLATES)}
                        onAdd={entry => {
                            setCustomRooms({ ...customRooms, [group.id]: [...(customRooms[group.id] || []), entry] });
                            setRooms({ ...rooms, [group.id]: [...(rooms[group.id] || []), entry.id] });
                        }}
                    />
                </Box>
            ))}
            {useFloors && existing.rooms['']?.length ? (
                <Box sx={styles.group}>
                    <Typography
                        variant="subtitle1"
                        sx={styles.groupTitle}
                    >
                        {t('Rooms without floor')}
                    </Typography>
                    <Box sx={styles.tiles}>
                        {existing.rooms[''].map(id => (
                            <Tile
                                key={id}
                                name={getName(enums[`enum.rooms.${id}`]?.common?.name) || id}
                                icon={enums[`enum.rooms.${id}`]?.common?.icon}
                                selected
                                locked
                                lockedText={t('Already exists')}
                                theme={props.theme}
                                onClick={() => undefined}
                            />
                        ))}
                    </Box>
                </Box>
            ) : null}
            <Box>
                <Button
                    size="small"
                    onClick={() => setShowAllRooms(!showAllRooms)}
                >
                    {t(showAllRooms ? 'Show less' : 'Show more')}
                </Button>
            </Box>
        </Box>
    );

    const renderFunctions = (): JSX.Element => (
        <Box sx={styles.content}>
            <Typography
                variant="body2"
                sx={styles.hint}
            >
                {t('Select the functions of your devices. Functions that already exist stay unchanged')}
            </Typography>
            <Box sx={styles.tiles}>
                {shownFunctionEntries.map(entry => (
                    <Tile
                        key={entry.id}
                        name={nameOf(entry)}
                        icon={entry.icon}
                        selected={isFunctionSelected(entry.id)}
                        locked={isFunctionExisting(entry.id)}
                        lockedText={t('Already exists')}
                        theme={props.theme}
                        onClick={() => setFunctions(toggle(functions, entry.id))}
                    />
                ))}
            </Box>
            <AddCustom
                t={t}
                placeholder={t('Custom function')}
                usedIds={allFunctionEntries.map(entry => entry.id)}
                onAdd={entry => {
                    setCustomFunctions([...customFunctions, entry]);
                    setFunctions([...functions, entry.id]);
                }}
            />
            <Box>
                <Button
                    size="small"
                    onClick={() => setShowAllFunctions(!showAllFunctions)}
                >
                    {t(showAllFunctions ? 'Show less' : 'Show more')}
                </Button>
            </Box>
        </Box>
    );

    const renderOverview = (): JSX.Element => {
        const inRoom = new Set<string>();
        const withFunction = new Set<string>();
        for (const enumObj of Object.values(enums)) {
            if (enumObj._id.startsWith('enum.rooms.')) {
                enumObj.common?.members?.forEach(id => inRoom.add(id));
            } else if (enumObj._id.startsWith('enum.functions.')) {
                enumObj.common?.members?.forEach(id => withFunction.add(id));
            }
        }
        return (
            <Box sx={styles.summary}>
                <Typography variant="h6">{t('The rooms and functions are ready')}</Typography>
                <Typography>
                    {t('Created: %s floors, %s rooms, %s functions', created.floors, created.rooms, created.functions)}
                </Typography>
                <Typography>{t('%s objects are in a room', inRoom.size)}</Typography>
                <Typography>{t('%s objects have a function', withFunction.size)}</Typography>
                <Typography
                    variant="body2"
                    sx={styles.hint}
                >
                    {t('You can change everything at any time in the categories view or in the assignment view')}
                </Typography>
            </Box>
        );
    };

    return (
        <Dialog
            open={!0}
            fullWidth
            maxWidth="lg"
            fullScreen={props.fullScreen}
            onClose={(_e, reason) => {
                if (reason !== 'backdropClick') {
                    props.onClose();
                }
            }}
            sx={{ '& .MuiDialog-paper': props.fullScreen ? undefined : styles.dialogPaper }}
        >
            <DialogTitle>{t('Set up rooms and functions')}</DialogTitle>
            <Box sx={styles.stepper}>
                <Stepper
                    activeStep={step}
                    alternativeLabel
                >
                    {STEPS.map(label => (
                        <Step key={label}>
                            <StepLabel>{t(label)}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>
            <DialogContent
                dividers
                sx={step === 3 ? styles.assignment : undefined}
            >
                {step === 0 ? renderFloors() : null}
                {step === 1 ? renderRooms() : null}
                {step === 2 ? renderFunctions() : null}
                {step === 3 ? (
                    <EnumAssignment
                        socket={props.socket}
                        enums={enums}
                        t={t}
                        theme={props.theme}
                        getName={getName}
                        initialFilter="noRoom"
                        onChangeMembers={props.onChangeMembers}
                    />
                ) : null}
                {step === 4 ? renderOverview() : null}
            </DialogContent>
            <DialogActions>
                {step < 4 ? (
                    <Button
                        color="grey"
                        disabled={creating}
                        startIcon={<IconCancel />}
                        onClick={props.onClose}
                    >
                        {t('Cancel')}
                    </Button>
                ) : null}
                <Box sx={{ flexGrow: 1 }} />
                {step > 0 && step < 4 ? (
                    <Button
                        color="grey"
                        variant="outlined"
                        disabled={creating}
                        startIcon={<IconBack />}
                        onClick={() => setStep(step - 1)}
                    >
                        {t('Back')}
                    </Button>
                ) : null}
                {step < 2 ? (
                    <Button
                        variant="contained"
                        endIcon={<IconNext />}
                        disabled={step === 1 && !groups.length}
                        onClick={() => setStep(step + 1)}
                    >
                        {t('Next')}
                    </Button>
                ) : null}
                {step === 2 ? (
                    <Button
                        variant="contained"
                        loading={creating}
                        endIcon={<IconNext />}
                        onClick={() => void createAndContinue()}
                    >
                        {t(newEnums.list.length ? 'Create and continue' : 'Next')}
                    </Button>
                ) : null}
                {step === 3 ? (
                    <Button
                        variant="contained"
                        endIcon={<IconNext />}
                        onClick={() => setStep(4)}
                    >
                        {t('Next')}
                    </Button>
                ) : null}
                {step === 4 ? (
                    <Button
                        variant="contained"
                        startIcon={<IconFinish />}
                        onClick={props.onClose}
                    >
                        {t('Finish')}
                    </Button>
                ) : null}
            </DialogActions>
        </Dialog>
    );
}
