import React, { useEffect, useState } from 'react';
import { Checkbox, FormControl, InputLabel, MenuItem, Select, Switch } from '@material-ui/core';
import CustomModal from '../components/CustomModal';

const readWriteArray = [
    {
        Owner: [
            { name: 'read', value: '0x400', valueNum: 1024, title: 'read owner' },
            { name: 'write', value: '0x200', valueNum: 512, title: 'write owner' }
        ]
    },
    {
        Group: [
            { name: 'read', value: '0x40', valueNum: 64, title: 'read group' },
            { name: 'write', value: '0x20', valueNum: 32, title: 'write group' }
        ]
    },
    {
        Everyone: [
            { name: 'read', value: '0x4', valueNum: 4, title: 'read everyone' },
            { name: 'write', value: '0x2', valueNum: 2, title: 'write everyone' }
        ]
    },
]
const check = [
    { value: '0x400', valueNum: 1024 },
    { value: '0x200', valueNum: 512 },
    { value: '0x40', valueNum: 64 },
    { value: '0x20', valueNum: 32 },
    { value: '0x4', valueNum: 4 },
    { value: '0x2', valueNum: 2 }
];
const defaulHex = {
    '0x400': false,
    '0x200': false,
    '0x40': false,
    '0x20': false,
    '0x4': false,
    '0x2': false
}
const newValueAccessControl = (value, newValue, objectHex) => {
    let different = newValue;
    let currentValue = value;
    let result = 1638;
    check.forEach(el => {
        if (different - el.valueNum >= 0) {
            different -= el.valueNum;
            if (currentValue - el.valueNum >= 0) {
                currentValue -= el.valueNum;
            } else {
                result = objectHex[el.value] ? result - el.valueNum : result;
            }
        } else {
            if (currentValue - el.valueNum >= 0) {
                currentValue -= el.valueNum;
                result = objectHex[el.value] ? result : result - el.valueNum;
            } else {
                result -= el.valueNum;
            }
        }
    });
    return result;
}
const ObjectRights = ({ value, setValue, t, differentValue, switchBool, checkDifferent, setCheckDifferent }) => {
    useEffect(() => {
        if (switchBool) {
            differentValue.forEach(el => {
                let different = el;
                let currentValue = value;
                check.forEach(val => {
                    if (different - val.valueNum >= 0) {
                        different -= val.valueNum;
                        if (currentValue - val.valueNum < 0) {
                            setCheckDifferent(check => !check[val.value] ? ({ ...check, [val.value]: true }) : check)
                        } else {
                            currentValue -= val.valueNum;
                        }
                    } else {
                        if (currentValue - val.valueNum >= 0) {
                            currentValue -= val.valueNum;
                            setCheckDifferent(check => !check[val.value] ? ({ ...check, [val.value]: true }) : check)
                        }
                    }
                })
            })
        } else {
            setCheckDifferent(defaulHex)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [differentValue, switchBool]);
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
                                    color={checkDifferent[obj.value] ? "primary" : "secondary"}
                                    indeterminate={checkDifferent[obj.value]}
                                    style={checkDifferent[obj.value] ? { opacity: 0.5 } : null}
                                    onChange={e => {
                                        if (checkDifferent[obj.value]) {
                                            setCheckDifferent(check => ({ ...check, [obj.value]: false }))
                                        }
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


const ObjectEditOfAccessControl = ({ onClose, onApply, open, selected, extendObject, objects, t, modalEmptyId }) => {
    const [stateOwnerUser, setStateOwnerUser] = useState(objects[selected]?.acl.owner || objects['system.config'].common.defaultNewAcl.owner);
    const [stateOwnerGroup, setStateOwnerGroup] = useState(objects[selected]?.acl.ownerGroup || objects['system.config'].common.defaultNewAcl.ownerGroup);
    const [ownerUser, setOwnerUser] = useState([]);
    const [ownerGroup, setOwnerGroup] = useState([]);
    const [switchBool, setSwitchBool] = useState(false);
    const [checkState, setCheckState] = useState(false);
    const [count, setCount] = useState(modalEmptyId ? 1 : 0);
    const [valueObjectAccessControl, setValueObjectAccessControl] = useState(objects[selected]?.acl.object || objects['system.config'].common.defaultNewAcl.object);
    const [valueStateAccessControl, setValueStateAccessControl] = useState(objects[selected]?.acl.state ? objects[selected].acl.state : objects['system.config'].common.defaultNewAcl.state);
    const [differentOwner, setDifferentOwner] = useState(false);
    const [differentGroup, setDifferentGroup] = useState(false);
    const [differentState, setDifferentState] = useState([]);
    const [differentObject, setDifferentObject] = useState([]);
    const [differentHexState, setDifferentHexState] = useState(defaulHex);
    const [differentHexObject, setDifferentHexObject] = useState(defaulHex);

    const [disabledButton, setDisabledButton] = useState(true);
    useEffect(() => {
        let modalEmpty = false;
        Object.keys(objects).forEach(key => {
            if (!key.search(selected || modalEmptyId)) {
                let different = true;
                if (!modalEmptyId) {
                    setCount((el) => el + 1);
                }///
                if (!modalEmpty && modalEmptyId) {
                    setValueObjectAccessControl(objects[key].acl.object);
                    setStateOwnerUser(objects[key].acl.owner);
                    setStateOwnerGroup(objects[key].acl.ownerGroup);
                    modalEmpty = true;
                    different = false;
                }
                if (modalEmptyId) {
                    if (objects[key].acl.state) {
                        setValueStateAccessControl(objects[key].acl.state);
                    }
                }///
                if (!differentOwner && stateOwnerUser !== objects[key].acl.owner && different) {
                    setDifferentOwner(true);
                }
                if (!differentGroup && stateOwnerGroup !== objects[key].acl.ownerGroup && different) {
                    setDifferentGroup(true);
                }
                if (objects[key].acl.state) {
                    if (valueStateAccessControl !== objects[key].acl.state) {
                        setDifferentState(el => el.indexOf(objects[key].acl.state) === -1 ? ([...el, objects[key].acl.state]) : el)
                    }
                    if (!checkState) {
                        setCheckState(true);
                    }
                }
                if (valueObjectAccessControl !== objects[key].acl.object) {
                    setDifferentObject(el => el.indexOf(objects[key].acl.object) === -1 ? ([...el, objects[key].acl.object]) : el)
                }

            }
            if (!key.search('system.group')) {
                setOwnerGroup(el => ([...el, {
                    name: key.replace('system.group.', ''),
                    value: key
                }]))
            }
            if (!key.search('system.user')) {
                setOwnerUser(el => ([...el, {
                    name: key.replace('system.user.', ''),
                    value: key
                }]))
            }
            if (modalEmptyId) {
                setSwitchBool(true)
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [objects, selected]);
    useEffect(() => {
        if (switchBool) {
            if (differentGroup) {
                setStateOwnerGroup('different');
                setOwnerGroup(el => ([{
                    name: 'different',
                    value: 'different'
                }, ...el]));
            }
            if (differentOwner) {
                setStateOwnerUser('different');
                setOwnerUser(el => ([{
                    name: 'different',
                    value: 'different'
                }, ...el]));
            }
        } else {
            if (stateOwnerUser === 'different') {
                setStateOwnerUser(objects[selected].acl.owner);
            }
            if (stateOwnerGroup === 'different') {
                setStateOwnerGroup(objects[selected].acl.ownerGroup);
            }
            setOwnerGroup(el => el.filter(({ name }) => name !== 'different'));
            setOwnerUser(el => el.filter(({ name }) => name !== 'different'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [switchBool])
    return (
        <CustomModal
            open={open}
            titleButtonApply="apply"
            overflowHidden
            applyDisabled={disabledButton}
            onClose={onClose}
            onApply={() => {
                if (!switchBool) {
                    let newObj = objects[selected].acl;
                    newObj.object = valueObjectAccessControl;
                    newObj.owner = stateOwnerUser;
                    newObj.ownerGroup = stateOwnerGroup;
                    if (objects[selected].acl.state) {
                        newObj.state = valueStateAccessControl;
                    }
                    extendObject(selected, { acl: newObj });
                }
                else {
                    let newObj = objects[selected]?.acl || {};
                    newObj.object = valueObjectAccessControl;
                    Object.keys(objects).forEach(async key => {
                        if (!key.search(selected || modalEmptyId)) {
                            let newObj = objects[key].acl;
                            newObj.object = newValueAccessControl(objects[key].acl.object, valueObjectAccessControl, differentHexObject);
                            if (stateOwnerUser !== 'different') {
                                newObj.owner = stateOwnerUser;
                            }
                            if (stateOwnerGroup !== 'different') {
                                newObj.ownerGroup = stateOwnerGroup;
                            }
                            if (objects[key].acl.state) {
                                newObj.state = newValueAccessControl(objects[key].acl.state, valueStateAccessControl, differentHexState);
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
                }}>{t('Access control list: %s', selected || modalEmptyId)}</div>
                <div style={{ display: 'flex' }}>
                    <FormControl fullWidth style={{ marginRight: 10 }}>
                        <InputLabel id="demo-simple-select-helper-label">{t('Owner user')}</InputLabel>
                        <Select
                            labelId="demo-simple-select-helper-label"
                            id="demo-simple-select-helper"
                            value={stateOwnerUser}
                            style={stateOwnerUser === 'different' ? { opacity: 0.5 } : null}
                            onChange={el => {
                                setStateOwnerUser(el.target.value);
                                setDisabledButton(false);
                            }}
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
                            style={stateOwnerGroup === 'different' ? { opacity: 0.5 } : null}
                            onChange={el => {
                                setStateOwnerGroup(el.target.value);
                                setDisabledButton(false);
                            }}
                        >
                            {ownerGroup.map(el => <MenuItem style={el.value === 'different' ? { opacity: 0.5 } : null} key={el.value} value={el.value}>{t(el.name)}</MenuItem>)}
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
                        onChange={e => {
                            setSwitchBool(e.target.checked);
                            setDisabledButton(false);
                        }}
                        color="primary"
                        name="checkedB"
                        inputProps={{ 'aria-label': 'primary checkbox' }}
                    />
                    <div style={switchBool ? { color: 'green' } : null}>{t('to apply with children')}</div>
                </div>
                <div style={{ overflowY: 'auto' }}>
                    <div>
                        <h2>{t('Object rights')}</h2>
                        <ObjectRights
                            checkDifferent={differentHexObject}
                            setCheckDifferent={setDifferentHexObject}
                            switchBool={switchBool}
                            differentValue={differentObject}
                            t={t}
                            setValue={e => {
                                setValueObjectAccessControl(e);
                                setDisabledButton(false);
                            }}
                            value={valueObjectAccessControl} />
                    </div>
                    {((switchBool && checkState) || objects[selected]?.acl.state) && <div>
                        <h2>{t('States rights')}</h2>
                        <ObjectRights
                            checkDifferent={differentHexState}
                            setCheckDifferent={setDifferentHexState}
                            switchBool={switchBool}
                            differentValue={switchBool ? differentState : []}
                            t={t}
                            setValue={e => {
                                setValueStateAccessControl(e);
                                setDisabledButton(false);
                            }}
                            value={valueStateAccessControl} />
                    </div>}

                </div>
            </div>
        </CustomModal >
    )
}

export default ObjectEditOfAccessControl;