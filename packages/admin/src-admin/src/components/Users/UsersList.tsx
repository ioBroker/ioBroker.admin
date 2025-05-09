import React, { Component, type JSX } from 'react';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { usePreview } from 'react-dnd-preview';

import { LinearProgress, Grid2, Typography, Fab, Box } from '@mui/material';

import { PersonAdd as PersonAddIcon, GroupAdd as GroupAddIcon } from '@mui/icons-material';

import { Utils, type AdminConnection, type Translate, type IobTheme, type ThemeType } from '@iobroker/adapter-react-v5';

import AdminUtils from '@/helpers/AdminUtils';
import UserBlock from './UserBlock';
import GroupBlock from './GroupBlock';
import UserEditDialog from './UserEditDialog';
import GroupEditDialog from './GroupEditDialog';
import UserDeleteDialog from './UserDeleteDialog';
import GroupDeleteDialog from './GroupDeleteDialog';

const PASSWORD_SET = '***********';

const boxShadowHover = '0 1px 1px 0 rgba(0, 0, 0, .4),0 6px 6px 0 rgba(0, 0, 0, .2)';
const styles: Record<string, any> = {
    mainGridCont: {
        height: 'calc(100% - 55px)',
        overflowY: 'auto',
    },
    childGridCont: {
        display: 'flex',
        flexDirection: 'column',
    },
    childGridContWide: {
        height: '100%',
    },
    canDrop: (theme: IobTheme) => ({
        backgroundColor: theme.palette.background.default,
    }),
    headContainer: {
        margin: 10,
    },
    blocksContainer: {
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    userGroupCard2: (theme: IobTheme) => ({
        border: '1px solid #FFF',
        borderColor: theme.palette.divider,
        m: '10px',
        minHeight: 150,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: 'all 200ms ease-out',
        opacity: 1,
        overflow: 'hidden',
        '&:hover': {
            overflowY: 'auto',
            boxShadow: boxShadowHover,
        },
    }),
    userGroupCardSecondary: (theme: IobTheme) => ({
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.success.light,
    }),
    permHeaders: (theme: IobTheme) => ({
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.primary.main,
        p: '4px',
        borderRadius: '2px',
        color: '#EEE',
    }),
    userCardContent: {
        height: '100%',
        opacity: 1,
    },
    userGroupTitle: {
        display: 'inline-flex',
        alignItems: 'center',
    },
    userGroupUserName: {
        fontWeight: 900,
        padding: 5,
    },
    userGroupUserID: {
        opacity: 0.7,
        padding: 5,
    },
    description: {
        fontSize: 10,
        fontStyle: 'italic',
        marginLeft: 5,
        opacity: 0.7,
    },
    userGroupMember: (theme: IobTheme) => ({
        display: 'inline-flex',
        m: '4px',
        p: '4px',
        backgroundColor: '#00000010',
        border: '1px solid #FFF',
        borderColor: theme.palette.text.primary,
        color: theme.palette.text.primary,
        alignItems: 'center',
    }),
    icon: {
        height: 32,
        width: 32,
        marginRight: 5,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    },
    right: {
        float: 'right',
    },
    left: {
        float: 'left',
        marginRight: 10,
    },
    dialog: {
        // padding: 10,
        // maxWidth: '100vw',
        // maxHeight: '100vh',
        // overflowY: 'hidden',
        // overflowX: 'hidden',
        // padding: 0
    },
    flex: {
        display: 'flex',
    },
    formControl: {
        display: 'flex',
        padding: 24,
        flexGrow: 1000,
    },
    formContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    formIcon: {
        margin: 10,
        opacity: 0.6,
    },
    descriptionPanel: (theme: IobTheme) => ({
        width: '100%',
        backgroundColor: 'transparent',
        mb: '20px',
        mt: '20px',
        ml: '20px',
        opacity: 0.75,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        '& a': {
            pl: '3px',
            color: theme.palette.mode === 'dark' ? '#EEE' : '#111',
        },
    }),
    dialogTitle: {
        borderBottom: '1px solid #00000020',
        padding: 0,
        width: '100%',
    },
    dialogActions: {
        borderTop: '1px solid #00000020',
        width: '100%',
    },
    dialogPaper: {
        overflowY: 'initial',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: 'calc(100% - 100px)',
        height: 'calc(100% - 100px)',
        maxWidth: 800,
        maxHeight: '100%',
    },
    dialogPaperMini: {
        maxHeight: 300,
    },
    colorPicker: {
        // position:'absolute'
    },
    iconPreview: {
        height: 40,
        width: 40,
    },
    mainDescription: {
        fontSize: '200%',
    },
    deleteDialog: {
        padding: 20,
    },
    narrowContent: {
        padding: '8px 8px 8px 8px',
    },
};

const DndPreview = (): JSX.Element | null => {
    const preview = usePreview<{ preview: React.ReactNode }>();
    if (!preview.display) {
        return null;
    }

    return <div style={preview.style}>{preview.item.preview}</div>;
};

declare global {
    interface Navigator {
        msMaxTouchPoints: number;
    }
}

const USER_TEMPLATE: ioBroker.UserObject = {
    _id: 'system.user.',
    type: 'user',
    common: {
        name: '',
        password: '',
        enabled: true,
        color: '',
        desc: '',
    },
    native: {},
    enums: {},
};

const GROUP_TEMPLATE: ioBroker.GroupObject = {
    _id: undefined,
    native: {},
    type: 'group',
    common: {
        name: '',
        desc: '',
        members: [],
        dontDelete: undefined,
        acl: {
            object: {
                list: false,
                read: false,
                write: false,
                delete: false,
                create: undefined,
            },
            state: {
                list: false,
                read: false,
                write: false,
                create: false,
                delete: false,
            },
            users: {
                list: false,
                read: false,
                write: false,
                create: false,
                delete: false,
            },
            other: {
                execute: false,
                http: false,
                sendto: false,
            },
            file: {
                list: false,
                read: false,
                write: false,
                create: false,
                delete: false,
            },
        },
        icon: '',
        color: '',
    },
};

interface UsersListProps {
    t: Translate;
    lang: ioBroker.Languages;
    socket: AdminConnection;
    ready: boolean;
    expertMode: boolean;
    themeType: ThemeType;
    theme: IobTheme;
}

interface UsersListState {
    innerWidth: number;
    users: ioBroker.UserObject[];
    groups: ioBroker.GroupObject[];
    userEditDialog: ioBroker.UserObject | false;
    userEditDialogNew: boolean;
    groupEditDialog: ioBroker.GroupObject | false;
    groupEditDialogNew: boolean;
    userDeleteDialog: ioBroker.UserObject | false;
    groupDeleteDialog: ioBroker.GroupObject | false;
}

class UsersList extends Component<UsersListProps, UsersListState> {
    constructor(props: UsersListProps) {
        super(props);

        this.state = {
            users: null,
            groups: null,
            userEditDialog: false,
            userEditDialogNew: null,
            groupEditDialog: false,
            groupEditDialogNew: null,
            userDeleteDialog: false,
            groupDeleteDialog: false,
            innerWidth: 0,
        };
    }

    componentDidMount(): void {
        this.setState({ innerWidth: window.innerWidth }, () => this.updateData());
    }

    componentDidUpdate(/* prevProps, prevState, snapshot */): void {
        if (window.innerWidth !== this.state.innerWidth) {
            setTimeout(() => this.setState({ innerWidth: window.innerWidth }), 100);
        }
    }

    getText = (name: ioBroker.StringOrTranslated): string =>
        (name && (typeof name === 'object' ? name[this.props.lang] || name.en || '' : name || '')) || '';

    showUserEditDialog = (user: ioBroker.UserObject, isNew: boolean): void => {
        user = Utils.clone(user) as ioBroker.UserObject;
        user.common.password = user.common.password ? PASSWORD_SET : '';
        this.setState({ userEditDialog: user, userEditDialogNew: isNew });
    };

    showGroupEditDialog = (group: ioBroker.GroupObject, isNew: boolean): void => {
        group = Utils.clone(group) as ioBroker.GroupObject;
        this.setState({ groupEditDialog: group, groupEditDialogNew: isNew });
    };

    updateData = (): Promise<void> => {
        let users: ioBroker.UserObject[];
        return this.props.socket
            .getForeignObjects('system.user.*', 'user')
            .then(_users => {
                users = Object.values(_users).sort((o1, o2) => (o1._id > o2._id ? 1 : -1));
                // remove deprecated field "description"
                users.forEach(user => {
                    if (user.common && (user.common as any).description) {
                        if (!user.common.desc) {
                            user.common.desc = (user.common as any).description;
                        }
                        delete (user.common as any).description;
                    }
                });
                return this.props.socket.getForeignObjects('system.group.*', 'group');
            })
            .then(groups => {
                const groupsArray = Object.values(groups).sort((o1, o2) => (o1._id > o2._id ? 1 : -1));
                // remove deprecated field "description"
                groupsArray.forEach(group => {
                    if (group.common && (group.common as any).description) {
                        if (!group.common.desc) {
                            group.common.desc = (group.common as any).description;
                        }
                        delete (group.common as any).description;
                    }
                });
                console.log('data updated');
                this.setState({ groups: groupsArray, users });
            });
    };

    changeUserFormData = (user: ioBroker.UserObject): void => this.setState({ userEditDialog: user });

    changeGroupFormData = (group: ioBroker.GroupObject): void => this.setState({ groupEditDialog: group });

    saveUser = async (originalId: ioBroker.ObjectIDs.User): Promise<void> => {
        const user: ioBroker.UserObject = Utils.clone(
            this.state.userEditDialog as ioBroker.UserObject,
        ) as ioBroker.UserObject;
        const originalUser = this.state.users.find(element => element._id === user._id);
        const newPassword = user.common.password && user.common.password !== PASSWORD_SET ? user.common.password : '';

        if (originalUser) {
            user.common.password = originalUser.common.password;
        } else {
            user.common.password = '';
        }

        await this.props.socket.setObject(user._id, user);
        if (
            typeof this.state.userEditDialog === 'object' &&
            originalId &&
            originalId !== this.state.userEditDialog._id
        ) {
            try {
                await this.props.socket.delObject(originalId);
                for (let i = 0; i < this.state.groups.length; i++) {
                    const group = this.state.groups[i];
                    if (group.common.members.includes(originalId)) {
                        const groupChanged: ioBroker.GroupObject = Utils.clone(group) as ioBroker.GroupObject;
                        groupChanged.common.members[groupChanged.common.members.indexOf(originalId)] = user._id;
                        await this.props.socket.setObject(groupChanged._id, groupChanged);
                    }
                }
            } catch (e) {
                window.alert(`Cannot delete user: ${e}`);
            }
        }
        if (newPassword) {
            try {
                await this.props.socket.changePassword(user._id, newPassword);
            } catch (e) {
                window.alert(`Cannot change password: ${e}`);
            }
        }
        this.setState({ userEditDialog: false }, () => this.updateData());
    };

    saveGroup = async (originalId: string): Promise<void> => {
        if (typeof this.state.groupEditDialog === 'object') {
            await this.props.socket.setObject(this.state.groupEditDialog._id, this.state.groupEditDialog);
            if (originalId && originalId !== this.state.groupEditDialog._id) {
                try {
                    await this.props.socket.delObject(originalId);
                } catch (e) {
                    window.alert(`Cannot delete user: ${e}`);
                }
            }
            this.setState({ groupEditDialog: false }, () => this.updateData());
        }
    };

    showUserDeleteDialog = (user: ioBroker.UserObject): void => this.setState({ userDeleteDialog: user });

    showGroupDeleteDialog = (group: ioBroker.GroupObject): void => this.setState({ groupDeleteDialog: group });

    deleteUser = (userId: ioBroker.ObjectIDs.User): void => {
        void this.props.socket
            .delObject(userId)
            .then(() =>
                Promise.all(
                    this.state.groups.map(group => {
                        if (group.common.members.includes(userId)) {
                            const groupChanged: ioBroker.GroupObject = Utils.clone(group) as ioBroker.GroupObject;
                            groupChanged.common.members.splice(groupChanged.common.members.indexOf(userId), 1);
                            return this.props.socket.setObject(groupChanged._id, groupChanged);
                        }
                        return Promise.resolve(null);
                    }),
                ),
            )
            .catch(e => window.alert(`Cannot delete user: ${e}`))
            .then(() => {
                this.setState({ userDeleteDialog: false }, () => this.updateData());
            });
    };

    deleteGroup = (groupId: string): Promise<void> =>
        this.props.socket
            .delObject(groupId)
            .then(() => this.setState({ groupDeleteDialog: false }, () => this.updateData()))
            .catch(e => window.alert(`Cannot delete user: ${e}`));

    addUserToGroup = (userId: ioBroker.ObjectIDs.User, groupId: string): void => {
        const group = this.state.groups.find(g => g._id === groupId);
        const members = group.common.members;
        if (!members.includes(userId)) {
            members.push(userId);
            this.props.socket
                .setObject(group._id, group)
                .then(() => this.updateData())
                .catch(e => window.alert(`Cannot delete user: ${e}`));
        }
    };

    removeUserFromGroup = (userId: ioBroker.ObjectIDs.User, groupId: string): void => {
        const group = this.state.groups.find(g => g._id === groupId);
        const members = group.common.members;
        if (members.includes(userId)) {
            members.splice(members.indexOf(userId), 1);
            void this.props.socket.setObject(group._id, group).then(() => this.updateData());
        }
    };

    static _isUniqueName(list: ioBroker.Object[], word: string, i: number): boolean {
        return !list.find(
            item => item._id === `system.user.${word.toLowerCase()}_${i}` || item.common.name === `${word} ${i}`,
        );
    }

    static findNewUniqueName(isGroup: boolean, list: ioBroker.Object[], word: string): { _id: string; name: string } {
        let i = 1;
        while (!UsersList._isUniqueName(list, word, i)) {
            i++;
        }
        return { _id: `system.${isGroup ? 'group' : 'user'}.${word.toLowerCase()}_${i}`, name: `${word} ${i}` };
    }

    render(): JSX.Element {
        if (!this.state.users || !this.state.groups) {
            return <LinearProgress />;
        }

        return (
            <DndProvider backend={AdminUtils.isTouchDevice() ? TouchBackend : HTML5Backend}>
                <DndPreview />
                <Box
                    component="div"
                    sx={styles.descriptionPanel}
                >
                    {this.props.t('You can drag users to groups.')}
                </Box>
                <Grid2
                    container
                    spacing={2}
                    style={styles.mainGridCont}
                >
                    <Grid2
                        size={{ xs: 12, md: 6 }}
                        style={{
                            ...styles.childGridCont,
                            ...(this.state.innerWidth > 600 ? styles.childGridContWide : undefined),
                        }}
                    >
                        <div style={styles.headContainer}>
                            <Fab
                                size="small"
                                style={styles.right}
                                onClick={() => {
                                    const { _id, name } = UsersList.findNewUniqueName(
                                        true,
                                        this.state.groups,
                                        this.props.t('Group'),
                                    );
                                    const template: ioBroker.GroupObject = Utils.clone(
                                        GROUP_TEMPLATE,
                                    ) as ioBroker.GroupObject;
                                    template._id = _id as ioBroker.ObjectIDs.Group;
                                    template.common.name = name;
                                    this.showGroupEditDialog(template, true);
                                }}
                            >
                                <GroupAddIcon />
                            </Fab>
                            <Typography
                                gutterBottom
                                variant="h4"
                                component="h4"
                            >
                                {this.props.t('Groups')}
                            </Typography>
                        </div>
                        <div style={styles.blocksContainer}>
                            {this.state.groups
                                .sort((a, b) => {
                                    const _a = (this.getText(a?.common?.name) || a._id).toLowerCase();
                                    const _b = (this.getText(b?.common?.name) || b._id).toLowerCase();
                                    if (_a > _b) {
                                        return 1;
                                    }
                                    if (_a < _b) {
                                        return -1;
                                    }
                                    return 0;
                                })
                                .map(group => (
                                    <GroupBlock
                                        themeType={this.props.themeType}
                                        group={group}
                                        key={group._id}
                                        users={this.state.users}
                                        showGroupEditDialog={this.showGroupEditDialog}
                                        showGroupDeleteDialog={this.showGroupDeleteDialog}
                                        removeUserFromGroup={this.removeUserFromGroup}
                                        getText={this.getText}
                                        styles={styles}
                                        {...this.props}
                                    />
                                ))}
                        </div>
                    </Grid2>
                    <Grid2
                        size={{ xs: 12, md: 6 }}
                        style={{
                            ...styles.childGridCont,
                            ...(this.state.innerWidth > 600 ? styles.childGridContWide : undefined),
                        }}
                    >
                        <div style={styles.headContainer}>
                            <Fab
                                size="small"
                                style={styles.right}
                                onClick={() => {
                                    const { _id, name } = UsersList.findNewUniqueName(
                                        false,
                                        this.state.users,
                                        this.props.t('User'),
                                    );
                                    const template: ioBroker.UserObject = Utils.clone(
                                        USER_TEMPLATE,
                                    ) as ioBroker.UserObject;
                                    template._id = _id as ioBroker.ObjectIDs.User;
                                    template.common.name = name;
                                    this.showUserEditDialog(template, true);
                                }}
                            >
                                <PersonAddIcon />
                            </Fab>
                            <Typography
                                gutterBottom
                                variant="h4"
                                component="h4"
                            >
                                {this.props.t('Users')}
                            </Typography>
                        </div>
                        <div style={styles.blocksContainer}>
                            {this.state.users
                                .sort((a, b) => {
                                    const _a = (this.getText(a?.common?.name) || a._id).toLowerCase();
                                    const _b = (this.getText(b?.common?.name) || b._id).toLowerCase();
                                    if (_a > _b) {
                                        return 1;
                                    }
                                    if (_a < _b) {
                                        return -1;
                                    }
                                    return 0;
                                })
                                .map(user => (
                                    <UserBlock
                                        themeType={this.props.themeType}
                                        user={user}
                                        key={user._id}
                                        groups={this.state.groups}
                                        showUserEditDialog={this.showUserEditDialog}
                                        showUserDeleteDialog={this.showUserDeleteDialog}
                                        updateData={this.updateData}
                                        addUserToGroup={this.addUserToGroup}
                                        removeUserFromGroup={this.removeUserFromGroup}
                                        getText={this.getText}
                                        styles={styles}
                                        {...this.props}
                                    />
                                ))}
                        </div>
                    </Grid2>
                </Grid2>
                {this.state.userEditDialog ? (
                    <UserEditDialog
                        onClose={() => this.setState({ userEditDialog: false })}
                        users={this.state.users}
                        user={this.state.userEditDialog}
                        isNew={this.state.userEditDialogNew}
                        t={this.props.t}
                        getText={this.getText}
                        styles={styles}
                        onChange={this.changeUserFormData}
                        saveData={this.saveUser}
                        innerWidth={this.state.innerWidth}
                        socket={this.props.socket}
                    />
                ) : null}
                {this.state.groupEditDialog ? (
                    <GroupEditDialog
                        onClose={() => this.setState({ groupEditDialog: false })}
                        groups={this.state.groups}
                        group={this.state.groupEditDialog}
                        isNew={this.state.groupEditDialogNew}
                        t={this.props.t}
                        getText={this.getText}
                        styles={styles}
                        onChange={this.changeGroupFormData}
                        innerWidth={this.state.innerWidth}
                        saveData={this.saveGroup}
                    />
                ) : null}
                {this.state.userDeleteDialog ? (
                    <UserDeleteDialog
                        getText={this.getText}
                        onClose={() => this.setState({ userDeleteDialog: false })}
                        user={this.state.userDeleteDialog}
                        t={this.props.t}
                        deleteUser={this.deleteUser}
                    />
                ) : null}
                {this.state.groupDeleteDialog ? (
                    <GroupDeleteDialog
                        getText={this.getText}
                        onClose={() => this.setState({ groupDeleteDialog: false })}
                        group={this.state.groupDeleteDialog}
                        t={this.props.t}
                        styles={styles}
                        deleteGroup={this.deleteGroup}
                    />
                ) : null}
            </DndProvider>
        );
    }
}

export default UsersList;
