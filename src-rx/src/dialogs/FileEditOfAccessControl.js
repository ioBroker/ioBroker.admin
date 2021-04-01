import React, { useEffect, useState } from 'react';
import { Checkbox, FormControl, InputLabel, LinearProgress, MenuItem, Select, Switch } from '@material-ui/core';
import CustomModal from '../components/CustomModal';
import Utils from '@iobroker/adapter-react/Components/Utils';
import Icon from '@iobroker/adapter-react/Components/Icon';
import I18n from '@iobroker/adapter-react/i18n';

const readWriteArray = [
    {
        Owner: [
            { name: 'read', valueNum: 0x400, title: 'read owner' },
            { name: 'write', valueNum: 0x200, title: 'write owner' }
        ]
    },
    {
        Group: [
            { name: 'read', valueNum: 0x40, title: 'read group' },
            { name: 'write', valueNum: 0x20, title: 'write group' }
        ]
    },
    {
        Everyone: [
            { name: 'read', valueNum: 0x4, title: 'read everyone' },
            { name: 'write', valueNum: 0x2, title: 'write everyone' }
        ]
    },
];

const newValueAccessControl = (value, newValue, mask) => {
    value |= newValue & mask;
    value &= newValue | (~mask & 0xFFFF);
    return value;
}

const ObjectRights = ({ value, setValue, t, differentValues, applyToChildren, mask, setMask }) => {
    useEffect(() => {
        if (applyToChildren) {
            let _checkDifferent = 0;
            let i = 1;
            while (i < 0x1000) {
                for (let e = 0; e < differentValues.length; e++) {
                    if (value & i) {
                        if (!(differentValues[e] & i)) {
                            _checkDifferent |= i;
                        }
                    } else {
                        if (differentValues[e] & i) {
                            _checkDifferent |= i;
                        }
                    }
                }
                i = i << 1;
            }
            setMask(_checkDifferent);
        } else {
            setMask(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [differentValues, applyToChildren]);

    let newSelected = value;

    return <div style={{
        display: 'flex',
        width: 'fit-content',
        margin: 20,
        border: '1px solid',
        borderLeft: 0
    }}>
        {readWriteArray.map(el => {
            const name = Object.keys(el)[0];
            return <div style={{
                width: 150,
                height: 150,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderLeft: '1px solid'
            }} key={name} >
                <div style={{
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 18,
                    borderBottom: '1px solid silver',
                    width: '100%',
                    justifyContent: 'center'
                }}>{t(name)}</div>
                <div style={{
                    display: 'flex',
                    width: '100%'
                }}>
                    {el[name].map((obj, idx) => {
                        let bool = false;
                        if (newSelected - obj.valueNum >= 0) {
                            newSelected = newSelected - obj.valueNum;
                            bool = true;
                        }
                        return <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            alignItems: 'center',
                            borderRight: idx === 0 ? '1px solid' : 0
                        }} key={obj.valueNum}>
                            <div style={{
                                height: 50,
                                borderBottom: '1px solid',
                                width: '100%',
                                justifyContent: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'silver'
                            }}>{t(obj.name)}</div>
                            <div style={{ height: 50, display: 'flex' }}>
                                <Checkbox
                                    checked={bool}
                                    color={mask & obj.valueNum ? 'primary' : 'secondary'}
                                    indeterminate={!!(mask & obj.valueNum)}
                                    style={mask & obj.valueNum ? { opacity: 0.5 } : null}
                                    onChange={e => {
                                        if (mask & obj.valueNum) {
                                            mask &= (~obj.valueNum) & 0xFFFF;
                                            setMask(mask);
                                        }
                                        let newValue = value;
                                        if (!e.target.checked) {
                                            newValue &= (~obj.valueNum) & 0xFFFF;
                                        } else {
                                            newValue |= obj.valueNum;
                                        }
                                        setValue(newValue);
                                    }}
                                />
                            </div>
                        </div>
                    })}
                </div>
            </div>
        })}
    </div>;
}

function getBackgroundColor(textColor, themeType) {
    if (!textColor) {
        return undefined;
    } else {
        const invertedColor = Utils.invertColor(textColor, true);
        if (invertedColor === '#FFFFFF' && themeType === 'dark') {
            return '#DDD';
        }
        if (invertedColor === '#000000' && themeType === 'light') {
            return '#222';
        }
        return undefined;
    }
}

function sortFolders(a, b) {
    if (a.folder && b.folder) {
        return a.name > b.name ? 1 : (a.name < b.name ? -1 : 0);
    } else if (a.folder) {
        return -1;
    } else if (b.folder) {
        return 1;
    } else {
        return a.name > b.name ? 1 : (a.name < b.name ? -1 : 0)
    }
}

const searchFolders = async (folderId, _newFolders, socket) => {
    const parts = folderId.split('/');
    const level = parts.length;
    const adapter = parts.shift();
    const relPath = parts.join('/');
    await socket.readDir(adapter, relPath)
        .then(files => {
            files.forEach(file => {
                const item = {
                    id: folderId + '/' + file.file,
                    ext: Utils.getFileExtension(file.file),
                    folder: file.isDir,
                    name: file.file,
                    size: file.stats && file.stats.size,
                    modified: file.modifiedAt,
                    acl: file.acl,
                    level
                };
                _newFolders.push(item);
            });

            _newFolders.sort(sortFolders);
        });

    let array = []
    _newFolders.forEach(async el => {
        if (el.folder) {
            await searchFolders(el.id, array, socket);
        }
    });

    return [..._newFolders, ...array];
}
const FileEditOfAccessControl2 = ({ onClose, onApply, open, selected, extendObject, objects, t, modalEmptyId, themeType, folders, socket }) => {
    const select = selected.substring(0, selected.lastIndexOf('/')) || selected;
    const object = selected.split('/').length === 1 ? folders['/'].find(({ id }) => id === selected) : folders[select].find(({ id }) => id === selected);
    const [stateOwnerUser, setStateOwnerUser] = useState(null);
    const [stateOwnerGroup, setStateOwnerGroup] = useState(null);
    const [ownerUsers, setOwnerUsers] = useState([]);
    const [ownerGroups, setOwnerGroups] = useState([]);
    const [applyToChildren, setApplyToChildren] = useState(false);
    const [childrenCount, setChildrenCount] = useState(0);
    const [valueFileAccessControl, setValueFileAccessControl] = useState(null);
    const [differentOwner, setDifferentOwner] = useState(false);
    const [differentGroup, setDifferentGroup] = useState(false);
    const [differentObject, setDifferentObject] = useState([]);
    const [maskObject, setMaskObject] = useState(0);
    const [ids, setIds] = useState([]);
    const [newFolders, setNewFolders] = useState([]);

    const [disabledButton, setDisabledButton] = useState(true);

    const different = t('different');

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {
        let _differentObject = [];

        let id = object.id;
        let idWithDot = id + '.';
        const keys = Object.keys(folders).sort();
        const objectsKeys = Object.keys(objects).sort();
        let groups = [];
        let users = [];
        const lang = I18n.getLanguage();

        let _differentOwner = false;
        let _differentGroup = false;
        let _stateOwnerUser = null;
        let _stateOwnerGroup = null;
        let _valueObjectAccessControl = null;
        let _newFolders = [];
        const _ids = [];
        let count = 0
        if (!object.folder) {
            id = select;
        }
        for (let k = 0; k < keys.length; k++) {
            const key = keys[k];
            const foldersArray = folders[key];
            if (foldersArray && (key === id || key.startsWith(idWithDot))) {
                for (let i = 0; i < foldersArray.length; i++) {
                    const keyFolder = foldersArray[i];
                    count++;
                    _ids.push(keyFolder.id);
                    if (keyFolder.folder) {
                        await searchFolders(keyFolder.id, _newFolders, socket);
                    }
                    if (!keyFolder.acl) {
                        continue;
                    }
                    if (_valueObjectAccessControl === null && (keyFolder.acl.permissions || keyFolder.acl.file) !== undefined) {
                        _valueObjectAccessControl = keyFolder.acl.permissions || keyFolder.acl.file;
                    }
                    if (_stateOwnerUser === null && keyFolder.acl.owner !== undefined) {
                        _stateOwnerUser = keyFolder.acl.owner;
                    }
                    if (_stateOwnerGroup === null && keyFolder.acl.ownerGroup !== undefined) {
                        _stateOwnerGroup = keyFolder.acl.ownerGroup;
                    }

                    if (!differentOwner && _stateOwnerUser !== keyFolder.acl.owner && keyFolder.acl.owner !== undefined) {
                        _differentOwner = true;
                    }
                    if (!differentGroup && _stateOwnerGroup !== keyFolder.acl.ownerGroup && keyFolder.acl.ownerGroup !== undefined) {
                        _differentGroup = true;
                    }
                    if (keyFolder.acl.permissions !== undefined && _valueObjectAccessControl !== keyFolder.acl.permissions && !_differentObject.includes(keyFolder.acl.permissions)) {
                        _differentObject.push(keyFolder.acl.permissions);
                    }
                }
            }
        }
        for (let i = 0; i < _newFolders.length; i++) {
            const keyFolder = _newFolders[i];
            count++;
            _ids.push(keyFolder.id);
            if (keyFolder.folder) {
                continue;
            }
            if (!keyFolder.acl) {
                continue;
            }
            if (_valueObjectAccessControl === null && (keyFolder.acl.permissions || keyFolder.acl.file) !== undefined) {
                _valueObjectAccessControl = keyFolder.acl.permissions || keyFolder.acl.file;
            }
            if (_stateOwnerUser === null && keyFolder.acl.owner !== undefined) {
                _stateOwnerUser = keyFolder.acl.owner;
            }
            if (_stateOwnerGroup === null && keyFolder.acl.ownerGroup !== undefined) {
                _stateOwnerGroup = keyFolder.acl.ownerGroup;
            }

            if (!differentOwner && _stateOwnerUser !== keyFolder.acl.owner && keyFolder.acl.owner !== undefined) {
                _differentOwner = true;
            }
            if (!differentGroup && _stateOwnerGroup !== keyFolder.acl.ownerGroup && keyFolder.acl.ownerGroup !== undefined) {
                _differentGroup = true;
            }
            if (keyFolder.acl.permissions !== undefined && _valueObjectAccessControl !== keyFolder.acl.permissions && !_differentObject.includes(keyFolder.acl.permissions)) {
                _differentObject.push(keyFolder.acl.permissions);
            }
        }
        for (let k = 0; k < objectsKeys.length; k++) {
            const key = objectsKeys[k];
            const obj = objects[key];
            if (key.startsWith('system.group.') && obj?.type === 'group') {
                groups.push({
                    name: Utils.getObjectNameFromObj(obj, lang).replace('system.group.', ''),
                    value: key,
                    icon: obj.common?.icon,
                    color: obj.common?.color,
                });
            } else
                if (key.startsWith('system.user.') && obj?.type === 'user') {
                    users.push({
                        name: Utils.getObjectNameFromObj(obj, lang).replace('system.user.', ''),
                        value: key,
                        icon: obj.common?.icon,
                        color: obj.common?.color,
                    });
                }

        }
        _stateOwnerUser = _stateOwnerUser || objects['system.config'].common.defaultNewAcl.owner;
        _stateOwnerGroup = _stateOwnerGroup || objects['system.config'].common.defaultNewAcl.ownerGroup;
        _valueObjectAccessControl = _valueObjectAccessControl || objects['system.config'].common.defaultNewAcl.object;
        setValueFileAccessControl(_valueObjectAccessControl);

        const userItem = users.find(item => item.value === _stateOwnerUser);
        const groupItem = groups.find(item => item.value === _stateOwnerGroup);
        setStateOwnerUser(userItem);
        setStateOwnerGroup(groupItem);

        setDifferentOwner(_differentOwner);
        setDifferentGroup(_differentGroup);

        setOwnerUsers(users);
        setOwnerGroups(groups);

        object.folder && setApplyToChildren(true);
        setChildrenCount(count);

        setDifferentObject(_differentObject);

        setIds(_ids);
        setNewFolders(_newFolders)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [objects, selected]);

    useEffect(() => {
        if (applyToChildren) {
            if (differentGroup) {
                stateOwnerGroup.value !== 'different' && setStateOwnerGroup({ name: different, value: 'different' });
                if (!ownerGroups.find(item => item.value === 'different')) {
                    setOwnerGroups(el => ([{
                        name: different,
                        value: 'different'
                    }, ...el]));
                }
            }

            if (differentOwner) {
                stateOwnerUser.value !== 'different' && setStateOwnerUser({ name: different, value: 'different' });
                if (!ownerUsers.find(item => item.value === 'different')) {
                    setOwnerUsers(el => ([{
                        name: different,
                        value: 'different'
                    }, ...el]));
                }
            }
        } else {
            if (stateOwnerUser && stateOwnerUser.value === 'different') {
                setStateOwnerUser(objects[selected].acl.owner);
            }
            if (stateOwnerGroup && stateOwnerGroup.value === 'different') {
                setStateOwnerGroup(objects[selected].acl.ownerGroup);
            }
            // remove different from list
            setOwnerGroups(el => el.filter(({ value }) => value !== 'different'));
            setOwnerUsers(el => el.filter(({ value }) => value !== 'different'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applyToChildren, stateOwnerUser, stateOwnerGroup, differentOwner, differentGroup]);

    if (!ids.length) {
        return <LinearProgress />;
    } else {
        return <CustomModal
            open={open}
            titleButtonApply="apply"
            overflowHidden
            applyDisabled={disabledButton}
            onClose={onClose}
            onApply={async () => {
                const parts = select.split('/');
                const adapter = parts.shift();
                if (!applyToChildren) {
                    let newAcl = {};
                    let changed = false;
                    if (object.acl.permissions !== valueFileAccessControl) {
                        newAcl.permissions = valueFileAccessControl;
                        changed = true;
                    }
                    if (object.acl.owner !== stateOwnerUser.value) {
                        newAcl.owner = stateOwnerUser.value;
                        changed = true;
                    }
                    if (object.acl.ownerGroup !== stateOwnerGroup.value) {
                        newAcl.ownerGroup = stateOwnerUser.ownerGroup;
                        changed = true;
                    }
                    changed && extendObject(adapter, object.name, newAcl);
                }
                else {
                    let _maskObject = ~maskObject & 0xFFFF;

                    for (let i = 0; i < ids.length; i++) {
                        const key = ids[i];
                        const file = folders[adapter].find(file => file.id === key);
                        if (file) {
                            let changed = false;
                            const newAcl = {};
                            const permissions = newValueAccessControl(file.acl.permissions, valueFileAccessControl, _maskObject);
                            if (permissions !== file.acl.permissions) {
                                newAcl.permissions = permissions;
                                changed = true;
                            }
                            if (stateOwnerUser.value !== 'different' && stateOwnerUser.value !== file.acl.owner) {
                                newAcl.owner = stateOwnerUser.value;
                                changed = true;
                            }
                            if (stateOwnerGroup.value !== 'different' && stateOwnerGroup.value !== file.acl.ownerGroup) {
                                newAcl.ownerGroup = stateOwnerGroup.value;
                                changed = true;
                            }
                            changed && await extendObject(adapter, file.name, newAcl);
                        }
                    }
                }
                onApply();
            }}>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{
                    margin: 10,
                    fontSize: 20
                }}>{t('Access control list: %s', selected)}</div>
                <div style={{ display: 'flex' }}>
                    <FormControl fullWidth style={{ marginRight: 10 }}>
                        <InputLabel>{t('Owner user')}</InputLabel>
                        <Select
                            value={stateOwnerUser.value}
                            renderValue={value => <span>{stateOwnerUser.icon ? <Icon src={stateOwnerUser.icon} style={{ width: 16, height: 16, marginRight: 8 }} /> : null}{stateOwnerUser.name}</span>}
                            style={stateOwnerUser.value === 'different' ? { opacity: 0.5 } : { color: stateOwnerUser.color || undefined, backgroundColor: getBackgroundColor(stateOwnerUser.color, themeType) }}
                            onChange={el => {
                                const userItem = ownerUsers.find(item => item.value === el.target.value);
                                setStateOwnerUser(userItem);
                                setDisabledButton(false);
                            }}
                        >
                            {ownerUsers.map(el => <MenuItem style={el.value === 'different' ? { opacity: 0.5 } : { color: el.color || undefined, backgroundColor: getBackgroundColor(el.color, themeType) }} key={el.value} value={el.value}>
                                {el.icon ? <Icon src={el.icon} style={{ width: 16, height: 16, marginRight: 8 }} /> : null}
                                {el.name}
                            </MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>{t('Owner group')}</InputLabel>
                        <Select
                            value={stateOwnerGroup.value}
                            renderValue={value => <span>{stateOwnerGroup.icon ? <Icon src={stateOwnerGroup.icon} style={{ width: 16, height: 16, marginRight: 8 }} /> : null}{stateOwnerGroup.name}</span>}
                            style={stateOwnerGroup.value === 'different' ? { opacity: 0.5 } : { color: stateOwnerGroup.color || undefined, backgroundColor: getBackgroundColor(stateOwnerGroup.color, themeType) }}
                            onChange={el => {
                                const groupItem = ownerGroups.find(item => item.value === el.target.value);
                                setStateOwnerGroup(groupItem);
                                setDisabledButton(false);
                            }}
                        >
                            {ownerGroups.map(el => <MenuItem key={el.value} value={el.value} style={el.value === 'different' ? { opacity: 0.5 } : { color: el.color || undefined, backgroundColor: getBackgroundColor(el.color, themeType) }}>
                                {el.icon ? <Icon src={el.icon} style={{ width: 16, height: 16, marginRight: 8 }} /> : null}
                                {el.name}
                            </MenuItem>)}
                        </Select>
                    </FormControl>
                </div>

                <div style={{
                    display: 'flex',
                    margin: 10,
                    alignItems: 'center',
                    fontSize: 10,
                    marginLeft: 0,
                    color: 'silver'
                }}>
                    <div style={(!object.folder || !applyToChildren) ? { color: 'green' } : null}>{t('to apply one item')}</div>
                    <Switch
                        disabled={!!object.folder || childrenCount === 1}
                        checked={!!object.folder || applyToChildren}
                        onChange={e => {
                            setApplyToChildren(e.target.checked);
                            setDisabledButton(false);
                        }}
                        color="primary"
                    />
                    <div style={(object.folder || applyToChildren) ? { color: 'green' } : null}>{t('to apply with children')} {(object.folder || childrenCount > 1) ? `(${childrenCount} ${t('object(s)')})` : ''}</div>
                </div>
                <div style={{ overflowY: 'auto' }}>
                    <div>
                        <h2>{t('File rights')}</h2>
                        <ObjectRights
                            mask={maskObject}
                            setMask={setMaskObject}
                            applyToChildren={applyToChildren}
                            differentValues={differentObject}
                            t={t}
                            setValue={e => {
                                setValueFileAccessControl(e);
                                setDisabledButton(false);
                            }}
                            value={valueFileAccessControl} />
                    </div>
                </div>
            </div>
        </CustomModal>;
    }
}

export default FileEditOfAccessControl2;