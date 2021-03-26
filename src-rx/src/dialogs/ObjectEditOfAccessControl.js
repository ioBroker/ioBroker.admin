import React, { useEffect, useState } from 'react';
import { Checkbox, FormControl, InputLabel, MenuItem, Select, Switch } from '@material-ui/core';
import CustomModal from '../components/CustomModal';

const readWriteArray = [
    {
        Owner: [
            { name: 'read', value: 0x400, valueNum: 1024, title: 'read owner' },
            { name: 'write', value: 0x200, valueNum: 512, title: 'write owner' }
        ]
    },
    {
        Group: [
            { name: 'read', value: 0x40, valueNum: 64, title: 'read group' },
            { name: 'write', value: 0x20, valueNum: 32, title: 'write group' }
        ]
    },
    {
        Everyone: [
            { name: 'read', value: 0x4, valueNum: 4, title: 'read everyone' },
            { name: 'write', value: 0x2, valueNum: 2, title: 'write everyone' }
        ]
    },
]

const ObjectRights = ({ value, setValue, t }) => {
    let newselected = value;
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
                        if (newselected - obj.valueNum >= 0) {
                            newselected = newselected - obj.valueNum;
                            bool = true;
                        }
                        return <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            alignItems: 'center',
                            borderRight: idx === 0 ? '1px solid' : 0
                        }} key={obj.value}>
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
                                    onChange={(e) => {
                                        let newValue = value;
                                        if (!e.target.checked) {
                                            newValue -= obj.valueNum;
                                        } else {
                                            newValue += obj.valueNum;
                                        }
                                        setValue(newValue);
                                    }}
                                    inputProps={{ 'aria-label': 'primary checkbox' }}
                                /></div>
                        </div>
                    })}
                </div>
            </div>
        })}
    </div >
}


const ObjectEditOfAccessControl = ({ onClose, onApply, open, selected, extendObject, objects, t }) => {
    const [stateOwnerUser, setStateOwnerUser] = useState(objects[selected].acl.owner);
    const [stateOwnerGroup, setStateOwnerGroup] = useState(objects[selected].acl.ownerGroup);
    const [ownerUser, setOwnerUser] = useState([]);
    const [ownerGroup, setOwnerGroup] = useState([]);
    const [switchBool, setSwitchBool] = useState(false);
    const [checkState, setCheckState] = useState(false);
    const [count, setCount] = useState(0);
    const [valueObjectAccessControl, setValueObjectAccessControl] = useState(objects[selected].acl.object);
    const [valueStateAccessControl, setValueStateAccessControl] = useState(objects[selected].acl.state ? objects[selected].acl.state : objects['system.config'].common.defaultNewAcl.state);
    useEffect(() => {
        Object.keys(objects).forEach(key => {
            if (!key.search(selected)) {
                setCount((el) => el + 1);
                if (objects[key].type === 'state') {
                    if (!checkState) {
                        setCheckState(true);
                    }
                }
            }
            if (!key.search('system.group')) {
                setOwnerGroup(el => ([...el, {
                    name: key.replace('system.group.', ''),
                    value: key
                }]))
                console.log(1, key.replace('system.group.', ''))
            }
            if (!key.search('system.user')) {
                setOwnerUser(el => ([...el, {
                    name: key.replace('system.user.', ''),
                    value: key
                }]))
                console.log(2, key.replace('system.user.', ''))

            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [objects, selected]);
    return (
        <CustomModal
            open={open}
            titleButtonApply="apply"
            // applyDisabled={!name}
            onClose={onClose}
            onApply={() => {
                if (!switchBool) {
                    let newObj = objects[selected].acl;
                    newObj.object = valueObjectAccessControl;
                    newObj.owner = stateOwnerUser;
                    newObj.ownerGroup = stateOwnerGroup;
                    if (objects[selected].type === 'state') {
                        newObj.state = valueStateAccessControl;
                    }
                    extendObject(selected, { acl: newObj });
                }
                else {
                    let newObj = objects[selected].acl;
                    newObj.object = valueObjectAccessControl;
                    Object.keys(objects).forEach(async key => {
                        if (!key.search(selected)) {
                            let newObj = objects[key].acl;
                            newObj.object = valueObjectAccessControl;
                            newObj.owner = stateOwnerUser;
                            newObj.ownerGroup = stateOwnerGroup;
                            if (objects[key].type === 'state') {
                                newObj.state = valueStateAccessControl;
                            }
                            await extendObject(key, { acl: newObj });
                        }
                    })
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
                        <InputLabel id="demo-simple-select-helper-label">{t('Owner user')}</InputLabel>
                        <Select
                            labelId="demo-simple-select-helper-label"
                            id="demo-simple-select-helper"
                            value={stateOwnerUser}
                            onChange={(el) => setStateOwnerUser(el.target.value)}
                        >
                            {ownerUser.map(el => <MenuItem key={el.value} value={el.value}>{t(el.name)}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-helper-label">{t('Owner group')}</InputLabel>
                        <Select
                            labelId="demo-simple-select-helper-label"
                            id="demo-simple-select-helper"
                            value={stateOwnerGroup}
                            onChange={(el) => setStateOwnerGroup(el.target.value)}
                        >
                            {ownerGroup.map(el => <MenuItem key={el.value} value={el.value}>{t(el.name)}</MenuItem>)}
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
                    <div style={!switchBool ? { color: 'green' } : null}>{t('to apply one item')}</div>
                    <Switch
                        disabled={count === 1}
                        checked={switchBool}
                        onChange={(e) => setSwitchBool(e.target.checked)}
                        color="primary"
                        name="checkedB"
                        inputProps={{ 'aria-label': 'primary checkbox' }}
                    />
                    <div style={switchBool ? { color: 'green' } : null}>{t('to apply with children')}</div>
                </div>
                <div>

                    <div>
                        <h2>{t('Object rights')}</h2>
                        <ObjectRights t={t} setValue={setValueObjectAccessControl} value={valueObjectAccessControl} />
                    </div>
                    {((switchBool && checkState) || objects[selected].type === 'state') && <div>
                        <h2>{t('States rights')}</h2>
                        <ObjectRights t={t} setValue={setValueStateAccessControl} value={valueStateAccessControl} />
                    </div>}

                </div>
            </div>
        </CustomModal >
    )
}

export default ObjectEditOfAccessControl;