import React, { Component } from 'react';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid2,
    Button,
    Checkbox,
    FormControlLabel,
    Tabs,
    Tab,
    Box,
} from '@mui/material';

import {
    TextFields as TextFieldsIcon,
    Description as DescriptionIcon,
    LocalOffer as LocalOfferIcon,
    Pageview as PageviewIcon,
    ColorLens as ColorLensIcon,
    Image as ImageIcon,
    Close as IconCancel,
    Check as IconCheck,
} from '@mui/icons-material';

import { Utils, IconPicker, type Translate } from '@iobroker/react-components';
import { IOTextField, IOColorPicker } from '../IOFields/Fields';

import Group1 from '../../assets/groups/group1.svg';
import Group2 from '../../assets/groups/group2.svg';
import Group3 from '../../assets/groups/group3.svg';
import Group4 from '../../assets/groups/group4.svg';
import Group5 from '../../assets/groups/group5.svg';
import Group6 from '../../assets/groups/group6.svg';
import Group7 from '../../assets/groups/group7.svg';
import Group8 from '../../assets/groups/group8.svg';
import Group9 from '../../assets/groups/group9.svg';
import Group10 from '../../assets/groups/group10.svg';

const GROUPS_ICONS = [Group1, Group2, Group3, Group4, Group5, Group6, Group7, Group8, Group9, Group10];

interface PermissionsTabProps {
    t: Translate;
    group: ioBroker.GroupObject;
    onChange: (group: ioBroker.GroupObject) => void;
    styles: Record<string, React.CSSProperties>;
    innerWidth: number;
}

function PermissionsTab(props: PermissionsTabProps): React.JSX.Element {
    const mapObject = <T, Result>(object: Record<string, T>, mapFunction: (item: T, key: string) => Result): Result[] =>
        Object.values(object).map((value, index) => {
            const key = Object.keys(object)[index];
            return mapFunction(value, key);
        });

    let acl = props.group.common.acl;

    // Initialize ACL if not exists or is invalid
    acl = acl || ({} as ioBroker.GroupObject['common']['acl']);

    acl.object = acl.object || {
        read: true,
        list: true,
        write: true,
        delete: false,
        create: undefined,
    };
    acl.object = {
        read: true,
        list: true,
        write: true,
        delete: false,
        ...acl.object,
    };

    acl.state = acl.state || {
        read: true,
        list: true,
        write: true,
        delete: false,
        create: undefined,
    };
    acl.state = {
        read: true,
        list: true,
        write: true,
        delete: false,
        ...acl.state,
    };

    acl.users = acl.users || {
        write: false,
        delete: false,
        create: false,
        list: undefined,
        read: undefined,
    };
    acl.users = {
        write: false,
        delete: false,
        create: false,
        ...acl.users,
    };

    acl.other = acl.other || {
        http: false,
        execute: false,
        sendto: true,
    };
    acl.other = {
        http: false,
        execute: false,
        sendto: true,
        ...acl.other,
    };

    acl.file = acl.file || {
        read: true,
        list: true,
        write: false,
        delete: false,
        create: false,
    };

    acl.file = {
        read: true,
        list: true,
        write: false,
        delete: false,
        create: false,
        ...acl.file,
    };

    return (
        <Grid2
            container
            spacing={props.innerWidth < 500 ? 1 : 4}
            style={props.styles.dialog}
            key="PermissionsTab"
        >
            {mapObject(props.group.common.acl || {}, (block, blockKey) => (
                <Grid2
                    size={{ xs: 12, md: 12 }}
                    key={blockKey}
                >
                    <Box
                        component="h2"
                        sx={props.styles.permHeaders}
                    >
                        {props.t(`group_acl_${blockKey}`)}
                    </Box>
                    {mapObject(block as Record<string, boolean>, (perm, permKey) => (
                        <FormControlLabel
                            key={permKey}
                            control={
                                <Checkbox
                                    disabled={props.group._id === 'system.group.administrator'}
                                    checked={perm}
                                    onChange={e => {
                                        const newData: ioBroker.GroupObject = Utils.clone(
                                            props.group,
                                        ) as ioBroker.GroupObject;
                                        (newData.common.acl as any as Record<string, Record<string, boolean>>)[
                                            blockKey
                                        ][permKey] = e.target.checked;
                                        props.onChange(newData);
                                    }}
                                />
                            }
                            label={props.t(`group_acl_${permKey}`)}
                            labelPlacement="top"
                        />
                    ))}
                </Grid2>
            ))}
        </Grid2>
    );
}

const styles: Record<string, React.CSSProperties> = {
    contentRoot: {
        padding: '16px 24px',
    },
};

interface GroupEditDialogProps extends PermissionsTabProps {
    onClose: () => void;
    groups: ioBroker.GroupObject[];
    isNew: boolean;
    onChange: (group: ioBroker.GroupObject) => void;
    saveData: (originalId: string | null) => void;
    getText: (text: ioBroker.StringOrTranslated) => string;
    group: ioBroker.GroupObject;
    styles: Record<string, React.CSSProperties>;
}

interface GroupEditDialogState {
    tab: 0;
    originalId: string;
}

class GroupEditDialog extends Component<GroupEditDialogProps, GroupEditDialogState> {
    constructor(props: GroupEditDialogProps) {
        super(props);
        this.state = {
            tab: 0,
            originalId: props.group._id,
        };
    }

    componentDidMount(): void {
        if (this.props.isNew) {
            const icon = GROUPS_ICONS[Math.round(Math.random() * (GROUPS_ICONS.length - 1))];

            if (icon) {
                void Utils.getSvg(icon).then((fileBlob: string) => {
                    const newData: ioBroker.GroupObject = Utils.clone(this.props.group) as ioBroker.GroupObject;
                    newData.common.icon = fileBlob;
                    this.props.onChange(newData);
                });
            }
        }
    }

    render(): React.JSX.Element {
        const idExists = this.props.groups.find(group => group._id === this.props.group._id);
        const idChanged = this.props.group._id !== this.state.originalId;

        let canSave =
            this.props.group._id !== 'system.group.' &&
            (this.props.group.common as any).password === (this.props.group.common as any).passwordRepeat;

        const getShortId = (_id: string): string => _id.split('.').pop();

        const name2Id = (name: string): string =>
            name.replace(Utils.FORBIDDEN_CHARS, '_').replace(/\s/g, '_').replace(/\./g, '_').toLowerCase();

        const changeShortId = (_id: string, short: string): string => {
            const idArray = _id.split('.');
            idArray[idArray.length - 1] = short;
            return idArray.join('.');
        };

        if (this.props.isNew) {
            if (idExists) {
                canSave = false;
            }
        } else if (idExists && idChanged) {
            canSave = false;
        }

        const description = this.props.getText(this.props.group.common.desc);
        const name = this.props.getText(this.props.group.common.name);

        const mainTab = (
            <Grid2
                container
                spacing={this.props.innerWidth < 500 ? 1 : 4}
                style={this.props.styles.dialog}
            >
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <IOTextField
                        label="Name"
                        t={this.props.t}
                        value={name}
                        onChange={value => {
                            const newData: ioBroker.GroupObject = Utils.clone(this.props.group) as ioBroker.GroupObject;
                            if (
                                !this.props.group.common.dontDelete &&
                                name2Id(this.props.getText(newData.common.name)) === getShortId(newData._id)
                            ) {
                                newData._id = changeShortId(newData._id, name2Id(value)) as ioBroker.ObjectIDs.Group;
                            }
                            newData.common.name = value;
                            this.props.onChange(newData);
                        }}
                        autoComplete="off"
                        icon={TextFieldsIcon}
                        styles={this.props.styles}
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <IOTextField
                        label="ID edit"
                        t={this.props.t}
                        disabled={this.props.group.common.dontDelete}
                        value={this.props.group._id.split('.')[this.props.group._id.split('.').length - 1]}
                        onChange={value => {
                            const newData: ioBroker.GroupObject = Utils.clone(this.props.group) as ioBroker.GroupObject;
                            newData._id = changeShortId(newData._id, name2Id(value)) as ioBroker.ObjectIDs.Group;
                            this.props.onChange(newData);
                        }}
                        icon={LocalOfferIcon}
                        styles={this.props.styles}
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <IOTextField
                        label="ID preview"
                        t={this.props.t}
                        disabled
                        value={this.props.group._id}
                        icon={PageviewIcon}
                        styles={this.props.styles}
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <IOTextField
                        label="Description"
                        t={this.props.t}
                        value={description}
                        onChange={value => {
                            const newData: ioBroker.GroupObject = Utils.clone(this.props.group) as ioBroker.GroupObject;
                            newData.common.desc = value;
                            this.props.onChange(newData);
                        }}
                        icon={DescriptionIcon}
                        styles={this.props.styles}
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <IconPicker
                        label="Icon"
                        icons={GROUPS_ICONS}
                        // t={this.props.t}
                        // lang={this.props.lang}
                        value={this.props.group.common.icon}
                        onChange={fileBlob => {
                            const newData: ioBroker.GroupObject = Utils.clone(this.props.group) as ioBroker.GroupObject;
                            newData.common.icon = fileBlob;
                            this.props.onChange(newData);
                        }}
                        previewStyle={this.props.styles.iconPreview}
                        icon={ImageIcon}
                        // classes={this.props.classes}
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <IOColorPicker
                        label="Color"
                        t={this.props.t}
                        value={this.props.group.common.color}
                        previewStyle={this.props.styles.iconPreview}
                        onChange={color => {
                            const newData: ioBroker.GroupObject = Utils.clone(this.props.group) as ioBroker.GroupObject;
                            newData.common.color = color;
                            this.props.onChange(newData);
                        }}
                        icon={ColorLensIcon}
                        style={this.props.styles.colorPicker}
                        styles={this.props.styles}
                    />
                </Grid2>
            </Grid2>
        );

        const selectedTab = [mainTab, PermissionsTab(this.props)][this.state.tab];

        return (
            <Dialog
                open={!0}
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                        this.props.onClose();
                    }
                }}
                fullWidth={this.props.innerWidth < 500}
            >
                <DialogTitle style={this.props.styles.dialogTitle}>
                    <Tabs
                        variant="fullWidth"
                        value={this.state.tab}
                        onChange={(e, newTab) => this.setState({ tab: newTab })}
                    >
                        <Tab
                            label={this.props.t('Main')}
                            value={0}
                        />
                        <Tab
                            label={this.props.t('Permissions')}
                            value={1}
                        />
                    </Tabs>
                </DialogTitle>
                <DialogContent
                    sx={{
                        '&.MuiDialogContent-root': {
                            ...(this.props.innerWidth < 500 ? this.props.styles.narrowContent : undefined),
                            ...styles.contentRoot,
                        },
                    }}
                >
                    {selectedTab}
                </DialogContent>
                <DialogActions style={this.props.styles.dialogActions}>
                    <Button
                        variant="contained"
                        color="primary"
                        autoFocus
                        onClick={() => this.props.saveData(this.props.isNew ? null : this.state.originalId)}
                        disabled={!canSave}
                        startIcon={<IconCheck />}
                    >
                        {this.props.t('Save')}
                    </Button>
                    <Button
                        variant="contained"
                        color="grey"
                        onClick={this.props.onClose}
                        startIcon={<IconCancel />}
                    >
                        {this.props.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default GroupEditDialog;
