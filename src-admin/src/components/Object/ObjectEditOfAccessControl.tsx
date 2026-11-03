import React, { useMemo, useState, type JSX } from 'react';
import { Checkbox, FormControl, InputLabel, LinearProgress, MenuItem, Select, Switch } from '@mui/material';

import { I18n, Icon, type IobTheme, type ThemeType, type Translate, Utils } from '@iobroker/gui-components';

import CustomModal from '@/components/CustomModal';

const readWriteArray: { name: string; bits: { name: string; bit: number }[] }[] = [
    {
        name: 'Owner',
        bits: [
            { name: 'read', bit: 0x400 },
            { name: 'write', bit: 0x200 },
        ],
    },
    {
        name: 'Group',
        bits: [
            { name: 'read', bit: 0x40 },
            { name: 'write', bit: 0x20 },
        ],
    },
    {
        name: 'Everyone',
        bits: [
            { name: 'read', bit: 0x4 },
            { name: 'write', bit: 0x2 },
        ],
    },
];

/** Pseudo owner/group shown if the objects to change have different owners or groups */
const DIFFERENT = 'different';

interface OwnerItem {
    name: string;
    value: string;
    icon?: string;
    color?: string;
}

/** Everything the dialog needs to know about the ACLs of the object and its children */
interface AclSummary {
    /** The object itself and all its children */
    ids: string[];
    users: OwnerItem[];
    groups: OwnerItem[];
    /** Values of the object itself (or of the first child that has them) */
    owner: string;
    ownerGroup: string;
    object: number;
    state: number;
    /** The object itself is a state */
    isState: boolean;
    /** At least one of the objects is a state */
    hasStates: boolean;
    differentOwner: boolean;
    differentGroup: boolean;
    /** Bits of the object rights that are not the same for all objects */
    differentObjectBits: number;
    /** Bits of the state rights that are not the same for all states */
    differentStateBits: number;
}

/**
 * Take the bits that are set in `mask` from `newValue` and keep all other bits of `value`.
 */
function newValueAccessControl(value: number, newValue: number, mask: number): number {
    value |= newValue & mask;
    value &= newValue | (~mask & 0xffff);
    return value;
}

function toOwnerItem(id: string, obj: ioBroker.Object, prefix: string, lang: ioBroker.Languages): OwnerItem {
    return {
        name: Utils.getObjectNameFromObj(obj, lang).replace(prefix, ''),
        value: id,
        icon: obj.common?.icon,
        color: obj.common?.color,
    };
}

function summarizeAcl(objects: Record<string, ioBroker.Object>, id: string): AclSummary {
    const lang = I18n.getLanguage();
    const defaultAcl = (objects['system.config'] as ioBroker.SystemConfigObject | undefined)?.common?.defaultNewAcl;
    const idWithDot = `${id}.`;

    const users: OwnerItem[] = [];
    const groups: OwnerItem[] = [];
    let owner: string | undefined;
    let ownerGroup: string | undefined;
    let object: number | undefined;
    let state: number | undefined;
    let differentOwner = false;
    let differentGroup = false;
    let differentObjectBits = 0;
    let differentStateBits = 0;
    let hasStates = false;

    const addObject = (obj: ioBroker.Object): void => {
        if (obj.type === 'state') {
            hasStates = true;
        }
        const acl = obj.acl as Partial<ioBroker.StateACL> | undefined;
        if (!acl) {
            return;
        }
        if (acl.owner !== undefined) {
            if (owner === undefined) {
                owner = acl.owner;
            } else if (owner !== acl.owner) {
                differentOwner = true;
            }
        }
        if (acl.ownerGroup !== undefined) {
            if (ownerGroup === undefined) {
                ownerGroup = acl.ownerGroup;
            } else if (ownerGroup !== acl.ownerGroup) {
                differentGroup = true;
            }
        }
        if (acl.object !== undefined) {
            if (object === undefined) {
                object = acl.object;
            } else {
                differentObjectBits |= object ^ acl.object;
            }
        }
        if (acl.state !== undefined) {
            if (state === undefined) {
                state = acl.state;
            } else {
                differentStateBits |= state ^ acl.state;
            }
        }
    };

    // The object itself comes first, so its values are the ones shown
    const ids: string[] = [];
    if (objects[id]) {
        ids.push(id);
        addObject(objects[id]);
    }

    for (const key of Object.keys(objects)) {
        const obj = objects[key];
        if (!obj) {
            continue;
        }
        if (key.startsWith(idWithDot)) {
            ids.push(key);
            addObject(obj);
        }
        if (obj.type === 'group' && key.startsWith('system.group.')) {
            groups.push(toOwnerItem(key, obj, 'system.group.', lang));
        } else if (obj.type === 'user' && key.startsWith('system.user.')) {
            users.push(toOwnerItem(key, obj, 'system.user.', lang));
        }
    }

    owner = owner || defaultAcl?.owner || 'system.user.admin';
    ownerGroup = ownerGroup || defaultAcl?.ownerGroup || 'system.group.administrator';

    // Keep an owner or group that no longer exists selectable, so it is shown and not replaced silently
    if (!users.find(item => item.value === owner)) {
        users.push({ name: owner.replace('system.user.', ''), value: owner });
    }
    if (!groups.find(item => item.value === ownerGroup)) {
        groups.push({ name: ownerGroup.replace('system.group.', ''), value: ownerGroup });
    }
    users.sort((a, b) => a.value.localeCompare(b.value));
    groups.sort((a, b) => a.value.localeCompare(b.value));

    return {
        ids,
        users,
        groups,
        owner,
        ownerGroup,
        object: object ?? defaultAcl?.object ?? 0x664,
        state: state ?? defaultAcl?.state ?? 0x664,
        isState: objects[id]?.type === 'state',
        hasStates,
        differentOwner,
        differentGroup,
        differentObjectBits,
        differentStateBits,
    };
}

interface ObjectRightsProps {
    value: number;
    /** Bits that are different for the objects and stay as they are, if not touched */
    mask: number;
    onChange: (value: number, mask: number) => void;
    t: Translate;
    disabled: boolean;
}

function ObjectRights({ value, mask, onChange, t, disabled }: ObjectRightsProps): JSX.Element {
    return (
        <div
            style={{
                display: 'flex',
                width: 'fit-content',
                margin: 20,
                border: '1px solid',
                borderLeft: 0,
            }}
        >
            {readWriteArray.map(el => (
                <div
                    style={{
                        width: 150,
                        height: 150,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderLeft: '1px solid',
                    }}
                    key={el.name}
                >
                    <div
                        style={{
                            height: 50,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: 18,
                            borderBottom: '1px solid silver',
                            width: '100%',
                            justifyContent: 'center',
                        }}
                    >
                        {t(el.name)}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            width: '100%',
                        }}
                    >
                        {el.bits.map((item, idx) => {
                            const masked = !!(mask & item.bit);
                            return (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        flex: 1,
                                        alignItems: 'center',
                                        borderRight: idx === 0 ? '1px solid' : 0,
                                    }}
                                    key={item.bit}
                                >
                                    <div
                                        style={{
                                            height: 50,
                                            borderBottom: '1px solid',
                                            width: '100%',
                                            justifyContent: 'center',
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: 'silver',
                                        }}
                                    >
                                        {t(item.name)}
                                    </div>
                                    <div style={{ height: 50, display: 'flex' }}>
                                        <Checkbox
                                            disabled={disabled}
                                            checked={!!(value & item.bit)}
                                            color={masked ? 'primary' : 'secondary'}
                                            indeterminate={masked}
                                            style={masked ? { opacity: 0.5 } : undefined}
                                            onChange={e => {
                                                // A "different" bit becomes set for all objects on the first click
                                                const set = masked || e.target.checked;
                                                onChange(
                                                    set ? value | item.bit : value & ~item.bit & 0xffff,
                                                    mask & ~item.bit & 0xffff,
                                                );
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

interface ObjectEditOfAccessControlProps {
    onClose: () => void;
    onApply: () => void;
    /** ID of the object to edit (empty if the object is virtual) */
    selected: string;
    extendObject: (id: string, obj: Partial<ioBroker.Object>) => void;
    objects: Record<string, ioBroker.Object>;
    t: Translate;
    /** ID of a virtual object (folder without object): only its children can be changed */
    modalEmptyId: string;
    themeType: ThemeType;
    theme: IobTheme;
}

const ObjectEditOfAccessControl: React.FC<ObjectEditOfAccessControlProps> = ({
    onClose,
    onApply,
    selected,
    extendObject,
    objects,
    t,
    modalEmptyId,
    themeType,
    theme,
}) => {
    const id = selected || modalEmptyId;
    // All values are derived once from the objects. The editable values below are only changed by the user,
    // so updates of the objects while the dialog is open do not reset the selection.
    const summary = useMemo(() => summarizeAcl(objects, id), [objects, id]);

    // A virtual object has no ACL itself, so the changes can only be applied to its children
    const [applyToChildren, setApplyToChildren] = useState(!!modalEmptyId);
    const [owner, setOwner] = useState(() => (modalEmptyId && summary.differentOwner ? DIFFERENT : summary.owner));
    const [ownerGroup, setOwnerGroup] = useState(() =>
        modalEmptyId && summary.differentGroup ? DIFFERENT : summary.ownerGroup,
    );
    const [valueObject, setValueObject] = useState(summary.object);
    const [valueState, setValueState] = useState(summary.state);
    const [maskObject, setMaskObject] = useState(() => (modalEmptyId ? summary.differentObjectBits : 0));
    const [maskState, setMaskState] = useState(() => (modalEmptyId ? summary.differentStateBits : 0));
    const [changed, setChanged] = useState(false);
    const [progress, setProgress] = useState(false);

    if (!summary.ids.length) {
        return <LinearProgress />;
    }

    const differentItem: OwnerItem = { name: t('different'), value: DIFFERENT };
    const users = applyToChildren && summary.differentOwner ? [differentItem, ...summary.users] : summary.users;
    const groups = applyToChildren && summary.differentGroup ? [differentItem, ...summary.groups] : summary.groups;
    const showStateRights = applyToChildren ? summary.hasStates : summary.isState;

    const toggleChildren = (checked: boolean): void => {
        setApplyToChildren(checked);
        setChanged(true);
        if (checked) {
            // Show "different" only if the user did not choose an owner or group explicitly
            if (summary.differentOwner && owner === summary.owner) {
                setOwner(DIFFERENT);
            }
            if (summary.differentGroup && ownerGroup === summary.ownerGroup) {
                setOwnerGroup(DIFFERENT);
            }
            // Bits already changed by the user are applied to all objects
            setMaskObject(summary.differentObjectBits & ~(valueObject ^ summary.object) & 0xffff);
            setMaskState(summary.differentStateBits & ~(valueState ^ summary.state) & 0xffff);
        } else {
            if (owner === DIFFERENT) {
                setOwner(summary.owner);
            }
            if (ownerGroup === DIFFERENT) {
                setOwnerGroup(summary.ownerGroup);
            }
            setMaskObject(0);
            setMaskState(0);
        }
    };

    const apply = (): void => {
        setProgress(true);
        setTimeout((): void => {
            // Bits that are still different keep the value of each object
            const objectMask = ~maskObject & 0xffff;
            const stateMask = ~maskState & 0xffff;
            const ids = applyToChildren ? summary.ids : [id];

            for (const key of ids) {
                const obj = objects[key];
                if (!obj) {
                    continue;
                }
                const oldAcl = obj.acl as Partial<ioBroker.StateACL> | undefined;
                const newAcl: Partial<ioBroker.StateACL> = Utils.clone(oldAcl || {});
                newAcl.object = newValueAccessControl(oldAcl?.object ?? 0, valueObject, objectMask);
                if (owner !== DIFFERENT) {
                    newAcl.owner = owner;
                }
                if (ownerGroup !== DIFFERENT) {
                    newAcl.ownerGroup = ownerGroup;
                }
                if (obj.type === 'state') {
                    newAcl.state = newValueAccessControl(oldAcl?.state ?? 0, valueState, stateMask);
                }
                extendObject(key, { acl: newAcl } as Partial<ioBroker.Object>);
            }

            setProgress(false);
            onApply();
        }, 200);
    };

    const renderOwnerSelect = (
        label: string,
        value: string,
        items: OwnerItem[],
        onChange: (value: string) => void,
        style?: React.CSSProperties,
    ): JSX.Element => {
        const item = items.find(it => it.value === value);
        return (
            <FormControl
                variant="standard"
                fullWidth
                style={style}
            >
                <InputLabel>{t(label)}</InputLabel>
                <Select
                    variant="standard"
                    disabled={progress}
                    value={item ? value : ''}
                    renderValue={() => (
                        <span>
                            {item?.icon ? (
                                <Icon
                                    src={item.icon}
                                    style={{ width: 16, height: 16, marginRight: 8 }}
                                />
                            ) : null}
                            {item?.name || ''}
                        </span>
                    )}
                    style={
                        value === DIFFERENT
                            ? { opacity: 0.5 }
                            : {
                                  color: item?.color || undefined,
                                  backgroundColor: Utils.getInvertedColor(item?.color, themeType),
                              }
                    }
                    onChange={e => {
                        onChange(e.target.value);
                        setChanged(true);
                    }}
                >
                    {items.map(el => (
                        <MenuItem
                            style={
                                el.value === DIFFERENT
                                    ? { opacity: 0.5 }
                                    : {
                                          color: el.color || undefined,
                                          backgroundColor: Utils.getInvertedColor(el.color, themeType),
                                      }
                            }
                            key={el.value}
                            value={el.value}
                        >
                            {el.icon ? (
                                <Icon
                                    src={el.icon}
                                    style={{ width: 16, height: 16, marginRight: 8 }}
                                />
                            ) : null}
                            {el.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    };

    return (
        <CustomModal
            theme={theme}
            titleButtonApply="apply"
            overflowHidden
            disableApply={!changed}
            progress={progress}
            onClose={onClose}
            onApply={apply}
        >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                    style={{
                        margin: 10,
                        fontSize: 20,
                    }}
                >
                    {t('Access control list: %s', id)}
                </div>
                <div style={{ display: 'flex' }}>
                    {renderOwnerSelect('Owner user', owner, users, setOwner, { marginRight: 10 })}
                    {renderOwnerSelect('Owner group', ownerGroup, groups, setOwnerGroup)}
                </div>

                <div
                    style={{
                        display: 'flex',
                        margin: 10,
                        alignItems: 'center',
                        fontSize: 10,
                        marginLeft: 0,
                        color: 'silver',
                    }}
                >
                    <div style={!applyToChildren ? { color: 'green' } : undefined}>{t('to apply one item')}</div>
                    <Switch
                        disabled={progress || !!modalEmptyId || summary.ids.length === 1}
                        checked={applyToChildren}
                        onChange={e => toggleChildren(e.target.checked)}
                        color="primary"
                    />
                    <div style={applyToChildren ? { color: 'green' } : undefined}>
                        {t('to apply with children')}{' '}
                        {modalEmptyId || summary.ids.length > 1 ? `(${summary.ids.length} ${t('object(s)')})` : ''}
                    </div>
                </div>

                {progress && <LinearProgress />}

                <div style={{ overflowY: 'auto' }}>
                    <div>
                        <h2>{t('Object rights')}</h2>
                        <ObjectRights
                            value={valueObject}
                            mask={maskObject}
                            disabled={progress}
                            t={t}
                            onChange={(value, mask) => {
                                setValueObject(value);
                                setMaskObject(mask);
                                setChanged(true);
                            }}
                        />
                    </div>
                    {showStateRights && (
                        <div>
                            <h2>{t('States rights')}</h2>
                            <ObjectRights
                                value={valueState}
                                mask={maskState}
                                disabled={progress}
                                t={t}
                                onChange={(value, mask) => {
                                    setValueState(value);
                                    setMaskState(mask);
                                    setChanged(true);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </CustomModal>
    );
};

export default ObjectEditOfAccessControl;
