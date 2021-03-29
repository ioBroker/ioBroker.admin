import React, { useState } from 'react';
import I18n from '@iobroker/adapter-react/i18n';
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@material-ui/core';
import CustomModal from '../components/CustomModal';

const stateTypeArray = [
    'boolean',
    'switch',
    'string',
    'number',
    'multistate',
    'array',
    'object',
    'mixed'
];

const typeArray = [
    { name: 'Datapoint', value: 'state' },
    { name: 'Channel', value: 'channel' },
    { name: 'Device', value: 'device' }
];

const ObjectAddNewContent = ({ onClose, onApply, open, selected, extendObject }) => {
    const [name, setName] = useState("New object");
    const [type, setType] = useState("state");
    const [stateType, setStateType] = useState("object");
    return (
        <CustomModal
            open={open}
            titleButtonApply="add"
            applyDisabled={!name}
            onClose={onClose}
            onApply={() => {
                const newObj = {
                    common: {
                        name,
                        desc: "Manually created",
                    },
                    type
                }
                if (type === 'state') {
                    newObj.common = {
                        ...newObj.common,
                        "role": "",
                        type: stateType,
                        "read": true,
                        "write": true,
                        "def": false

                    }
                } else {
                    newObj.common = {
                        ...newObj.common,
                        "role": "",
                        "icon": "",
                    }
                }
                extendObject(`${selected}.${name.split(' ').join('_')}`, newObj);
                onApply();
            }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{
                    margin: 10,
                    fontSize: 20
                }}>{I18n.t('Add new object: %s', selected)}.{name}</div>
                <TextField
                    label={I18n.t('Parent')}
                    style={{ margin: '5px 0' }}
                    disabled
                    value={selected}
                />
                <TextField
                    label={I18n.t('Name')}
                    style={{ margin: '5px 0' }}
                    value={name}
                    onChange={(el) => setName(el.target.value)}
                />
                <FormControl style={{ marginTop: 10, marginBottom: 10 }}>
                    <InputLabel id="demo-simple-select-helper-label">{I18n.t('Type')}</InputLabel>
                    <Select
                        labelId="demo-simple-select-helper-label"
                        id="demo-simple-select-helper"
                        value={type}
                        onChange={(el) => setType(el.target.value)}
                    >
                        {typeArray.map(el => <MenuItem key={el} value={el.value}>{I18n.t(el.name)}</MenuItem>)}
                        {(selected.indexOf('0_userdata') === 0 || selected.indexOf('alias.0') === 0) && <MenuItem value="folder">{I18n.t('Folder')}</MenuItem>}
                    </Select>
                </FormControl>
                {type === 'state' && <FormControl >
                    <InputLabel id="demo-simple-select-helper-label">{I18n.t('State type')}</InputLabel>
                    <Select
                        labelId="demo-simple-select-helper-label"
                        id="demo-simple-select-helper"
                        value={stateType}
                        onChange={(el) => setStateType(el.target.value)}
                    >
                        {stateTypeArray.map(el => <MenuItem key={el} value={el}>{I18n.t(el)}</MenuItem>)}
                    </Select>
                </FormControl>}
            </div>
        </CustomModal >
    )
}

export default ObjectAddNewContent;