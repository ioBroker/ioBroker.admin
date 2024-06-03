import React, { useState } from 'react';

import {
    Button,
    FormControl, InputLabel,
    MenuItem,
    Select, TextField,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent, InputAdornment,
    IconButton,
} from '@mui/material';

import {
    Check as CheckIcon,
    Close as CloseIcon,
    AddBox as AddIcon,
} from '@mui/icons-material';

import { I18n } from '@iobroker/adapter-react-v5';
import type { ioBrokerObject } from '@/types';
import Utils from '../components/Utils';

const stateTypeArray = [
    'array',
    'boolean',
    'file',
    'json',
    'mixed',
    'number',
    'object',
    'string',
];

const stateDefValues = {
    boolean: false,
    string: '',
    number: 0,
};

const TYPES = {
    state:   { name: 'State', value: 'state' },
    channel: { name: 'Channel', value: 'channel' },
    device:  { name: 'Device', value: 'device' },
    folder:  { name: 'Folder', value: 'folder' },
};

interface ObjectAddNewObjectProps {
    onClose: () => void;
    onApply: () => void;
    selected: string;
    setObject: (id: string, obj: ioBrokerObject) => Promise<void>;
    objects: Record<string, ioBrokerObject>;
    expertMode: boolean;
    initialType?: ioBrokerObject['type'] | '';
    initialStateType?: string;
}

const ObjectAddNewObject: React.FC<ObjectAddNewObjectProps> = ({
    onClose, onApply, selected, setObject, objects,
    expertMode, initialType, initialStateType,
}) => {
    const names: Record<string, string> = {
        state:   I18n.t('New state'),
        channel: I18n.t('New channel'),
        device:  I18n.t('New device'),
        folder:  I18n.t('New folder'),
    };

    const types = [];

    // analyse possible types
    const parentType = objects[selected]?.type;
    if (objects[selected]) {
        if (parentType === 'channel') {
            types.push(TYPES.state);
            initialType = initialType || 'state';
        } else if (parentType === 'device') {
            initialType = initialType || 'channel';
            types.push(TYPES.state);
            types.push(TYPES.channel);
        } else if (parentType === 'state') {
            initialType = initialType || '';
        } else {
            types.push(TYPES.state);
            types.push(TYPES.channel);
            types.push(TYPES.device);

            if (selected.startsWith('0_userdata.') ||
                selected.startsWith('alias.0.') ||
                selected === '0_userdata' ||
                selected === 'alias.0'
            ) {
                types.push(TYPES.folder);
                initialType = initialType || 'folder';
            } else {
                initialType = initialType || 'state';
            }
        }
    } else {
        types.push(TYPES.folder);
        initialType = initialType || 'folder';

        if (expertMode && (selected.startsWith('mqtt.') || selected.startsWith('javascript.'))) {
            types.push(TYPES.state);
            types.push(TYPES.channel);
            types.push(TYPES.device);
        }
    }

    const storedType = (window._localStorage || window.localStorage).getItem('App.lastObjectType') as ioBrokerObject['type'];
    if (storedType && types.find(item => item.value === storedType)) {
        initialType = storedType;
    }

    function buildId(_name: string) {
        return `${selected}.${_name.toString().replace(Utils.FORBIDDEN_CHARS, '_').replace(/\s/g, '_').replace(/\./g, '_')}`;
    }

    const [type, setType] = useState<ioBrokerObject['type'] | ''>(initialType);
    const [name, setName] = useState<string>(names[initialType]);
    const [stateType, setStateType] = useState<keyof typeof stateDefValues>(
        (initialStateType || (window._localStorage || window.localStorage).getItem('App.lastStateType') || 'string') as keyof typeof stateDefValues,
    );
    const [unique, setUnique] = useState<boolean>(!objects[buildId(names.state)]);

    const onLocalApply = () => {
        const newObj: ioBrokerObject = {
            common: {
                name,
                desc: I18n.t('Manually created'),
            },
            type,
        } as ioBrokerObject;

        if (type === 'state') {
            newObj.common = {
                ...newObj.common,
                role: 'state',
                type: stateType,
                read: true,
                write: true,
                def: stateDefValues[stateType],
            };
            newObj.native = {};
        } else if (type !== 'folder') {
            newObj.common = {
                ...newObj.common,
                role: '',
                icon: '',
            };
        } else {
            delete newObj.common.desc;
        }

        setObject(`${selected}.${name.split(' ').join('_')}`, newObj)
            .then(() => onApply());
    };

    const lang = I18n.getLanguage();

    return <Dialog
        open={!0}
        fullWidth
        maxWidth="md"
        disableEscapeKeyDown={false}
        // titleButtonApply="add"
        onClose={onClose}
        // onApply={() => onLocalApply()}
    >
        <DialogTitle>
            <div
                style={{
                    margin: 10,
                    fontSize: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <AddIcon />
                {I18n.t('Add new object:')}
                <span style={{ fontStyle: 'italic' }}>
                    {selected}
                    .
                    {name}
                </span>
            </div>
        </DialogTitle>
        <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <TextField
                    variant="standard"
                    label={I18n.t('Parent')}
                    style={{ margin: '5px 0' }}
                    disabled
                    value={selected}
                />
                <FormControl variant="standard" style={{ marginTop: 10, marginBottom: 16 }}>
                    <InputLabel>{I18n.t('Type')}</InputLabel>
                    <Select
                        variant="standard"
                        value={type}
                        onChange={el => {
                            (window._localStorage || window.localStorage).setItem('App.lastObjectType', el.target.value);

                            if (name === names[type]) {
                                setName(names[el.target.value]);
                                setUnique(!!objects[buildId(names[el.target.value])]);
                            }

                            setType(el.target.value as ioBrokerObject['type']);
                        }}
                    >
                        {types.map(el => <MenuItem key={el.value} value={el.value}>
                            {I18n.t(el.name)}
                            {lang !== 'en' && <span style={{ fontSize: 'smaller', opacity: 0.6, marginLeft: 4 }}>
                                (
                                {el.value}
                                )
                            </span>}
                        </MenuItem>)}
                    </Select>
                </FormControl>
                {type === 'state' && <FormControl style={{ marginTop: 10, marginBottom: 16 }}>
                    <InputLabel style={{ left: -14 }}>{I18n.t('State type')}</InputLabel>
                    <Select
                        style={{ marginTop: 6 }}
                        variant="standard"
                        value={stateType}
                        onChange={el => {
                            (window._localStorage || window.localStorage).setItem('App.lastStateType', el.target.value);
                            setStateType(el.target.value as keyof typeof stateDefValues);
                        }}
                    >
                        {stateTypeArray.map(el => <MenuItem key={el} value={el}>
                            {I18n.t(el)}
                            {lang !== 'en' && I18n.t(el) !== el && <span style={{ fontSize: 'smaller', opacity: 0.6, marginLeft: 4 }}>
                                (
                                {el}
                                )
                            </span>}
                        </MenuItem>)}
                    </Select>
                </FormControl>}
                <TextField
                    variant="standard"
                    label={I18n.t('Name')}
                    style={{ margin: '5px 0' }}
                    autoFocus
                    value={name}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            name && onLocalApply();
                        }
                    }}
                    InputProps={{
                        endAdornment: name ? <InputAdornment position="end">
                            <IconButton
                                size="small"
                                onClick={() => setName('')}
                            >
                                <CloseIcon />
                            </IconButton>
                        </InputAdornment> : null,
                    }}
                    onChange={el => {
                        setUnique(!objects[buildId(el.target.value)]);
                        setName(el.target.value);
                    }}
                />
            </div>
        </DialogContent>
        <DialogActions>
            <Button
                startIcon={<CheckIcon />}
                disabled={!name || !type || !unique || (type === 'state' && !stateType)}
                onClick={() => onLocalApply()}
                variant="contained"
                color="primary"
            >
                {I18n.t('add')}
            </Button>
            <Button
                color="grey"
                onClick={onClose}
                variant="contained"
                startIcon={<CloseIcon />}
            >
                {I18n.t('ra_Cancel')}
            </Button>
        </DialogActions>
    </Dialog>;
};

export default ObjectAddNewObject;
