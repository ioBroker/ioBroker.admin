import React, {useState} from 'react';

import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';

import AddIcon from '@mui/icons-material/AddBox';

import I18n from '@iobroker/adapter-react-v5/i18n';
import Utils from '../components/Utils'; // @iobroker/adapter-react-v5/i18n

import CustomModal from '../components/CustomModal';

const stateTypeArray = [
    'boolean',
    'string',
    'number',
    'array',
    'json',
    'object',
    'mixed'
];

const stateDefValues = {
    boolean: false,
    string: '',
    number: 0,
};

const TYPES = {
    state:   {name: 'Datapoint', value: 'state'},
    channel: {name: 'Channel', value: 'channel'},
    device:  {name: 'Device', value: 'device'},
    folder:  {name: 'Folder', value: 'folder'}
};

const ObjectAddNewObject = ({ onClose, onApply, open, selected, setObject, objects, expertMode }) => {
    const names = {
        state:   I18n.t('New state'),
        channel: I18n.t('New channel'),
        device:  I18n.t('New device'),
        folder:  I18n.t('New folder'),
    };

    const types = [];

    // analyse possible types
    const parentType = objects[selected]?.type;
    let initialType = '';
    if (objects[selected]) {
        if (parentType === 'channel') {
            types.push(TYPES.state);
            initialType = 'state';
        } else if (parentType === 'device') {
            initialType = 'channel';
            types.push(TYPES.state);
            types.push(TYPES.channel);
        } else if (parentType === 'state') {
            initialType = '';
        } else {
            types.push(TYPES.state);
            types.push(TYPES.channel);
            types.push(TYPES.device);

            if (selected.startsWith('0_userdata.') ||
                selected.startsWith('alias.0.') ||
                selected === '0_userdata' ||
                selected === 'alias.0') {
                types.push(TYPES.folder);
                initialType = 'folder';
            } else {
                initialType = 'state';
            }
        }
    } else {
        types.push(TYPES.folder);
        initialType = 'folder';

        if (expertMode && (selected.startsWith('mqtt.') || selected.startsWith('javascript.'))) {
            types.push(TYPES.state);
            types.push(TYPES.channel);
            types.push(TYPES.device);
        }
    }

    const storedType = (window._localStorage || window.localStorage).getItem('App.lastObjectType');
    if (storedType && types.find(item => item.value === storedType)) {
        initialType = storedType;
    }

    const [type, setType] = useState(initialType);
    const [name, setName] = useState(names[initialType]);
    const [stateType, setStateType] = useState((window._localStorage || window.localStorage).getItem('App.lastStateType') || 'string');
    const [unique, setUnique] = useState(!objects[buildId(names.state)]);

    function buildId(name) {
        return selected + '.' + name.toString().replace(Utils.FORBIDDEN_CHARS, '_').replace(/\s/g, '_').replace(/\./g, '_');
    }

    const onLocalApply = () => {
        const newObj = {
            common: {
                name,
                desc: I18n.t('Manually created'),
            },
            type
        };

        if (type === 'state') {
            newObj.common = {
                ...newObj.common,
                role: 'state',
                type: stateType,
                read: true,
                write: true,
                def: stateDefValues[stateType]
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
    }

    return open ? <CustomModal
        open
        fullWidth
        maxWidth="lg"
        titleButtonApply="add"
        applyDisabled={!name || !unique || !types.length}
        onClose={onClose}
        onApply={() => onLocalApply()}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ margin: 10, fontSize: 20 }}>
                <AddIcon />
                {I18n.t('Add new object:')}
                <span style={{ fontStyle: 'italic' }}>{selected}.{name}</span>
            </div>
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
                    onChange={(el) => {
                        (window._localStorage || window.localStorage).setItem('App.lastObjectType', el.target.value);

                        if (name === names[type]) {
                            setName(names[el.target.value]);
                            setUnique(objects[buildId(names[el.target.value])]);
                        }

                        setType(el.target.value);
                    }}
                >
                    {types.map(el => <MenuItem key={el.value} value={el.value}>{I18n.t(el.name)}</MenuItem>)}
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
                        setStateType(el.target.value);
                    }}
                >
                    {stateTypeArray.map(el => <MenuItem key={el} value={el}>{el}</MenuItem>)}
                </Select>
            </FormControl>}
            <TextField
                variant="standard"
                label={I18n.t('Name')}
                style={{ margin: '5px 0' }}
                autoFocus
                value={name}
                onKeyDown={e => {
                    if (e.keyCode === 13) {
                        e.preventDefault();
                        name && onLocalApply();
                    }
                }}
                onChange={el => {
                    setUnique(!objects[buildId(el.target.value)]);
                    setName(el.target.value);
                }}
            />
        </div>
    </CustomModal> : null;
}

export default ObjectAddNewObject;
