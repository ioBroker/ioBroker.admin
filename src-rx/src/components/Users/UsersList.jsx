import { Component } from 'react';
import {withStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { usePreview } from 'react-dnd-preview';

import LinearProgress from '@material-ui/core/LinearProgress';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Fab from '@material-ui/core/Fab';

import PersonAddIcon from '@material-ui/icons/PersonAdd';
import GroupAddIcon from '@material-ui/icons/GroupAdd';

import UserBlock from './UserBlock';
import GroupBlock from './GroupBlock';
import UserEditDialog from './UserEditDialog';
import GroupEditDialog from './GroupEditDialog';
import UserDeleteDialog from './UserDeleteDialog';
import GroupDeleteDialog from './GroupDeleteDialog';

const PASSWORD_SET = '***********';

const boxShadowHover = '0 1px 1px 0 rgba(0, 0, 0, .4),0 6px 6px 0 rgba(0, 0, 0, .2)';
const styles = theme => ({
    mainGridCont: {
        height: 'calc(100% - 55px)',
        overflowY:'auto'
    },
    childGridCont: {
        display: 'flex',
        flexDirection: 'column'
    },
    childGridContWide: {
        height: '100%',
    },
    canDrop: {
        backgroundColor:theme.palette.background.default
    },
    headContainer: {
        margin: 10
    },
    blocksContainer: {
        overflowY: 'auto',
        overflowX: 'hidden'
    },
    userGroupCard2: {
        border: '1px solid #FFF',
        borderColor: theme.palette.divider,
        margin:    10,
        minHeight: 150,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: 'all 200ms ease-out',
        opacity:1,
        overflow: 'hidden',
        '&:hover': {
            overflowY: 'auto',
            boxShadow: boxShadowHover
        }
    },
    userGroupCardSecondary: {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.success.light
    },
    permHeaders: {
        backgroundColor: theme.palette.type === 'dark' ? theme.palette.background.default : theme.palette.primary.main,
        padding: 4,
        borderRadius: 2,
        color:'#EEE'
    },
    userCardContent: {
        height:'100%',
        opacity:1
    },
    userGroupTitle: {
        display: 'inline-flex',
        alignItems: 'center',
    },
    userGroupUserName: {
        fontWeight: 900,
        padding: 5
    },
    userGroupUserID: {
        opacity:0.7,
        padding: 5
    },
    description: {
        fontSize: 10,
        fontStyle: 'italic',
        marginLeft: 5,
        opacity: 0.7
    },
    userGroupMember: {
        display: 'inline-flex',
        margin: 4,
        padding: 4,
        backgroundColor: '#00000010',
        border: '1px solid #FFF',
        borderColor: theme.palette.text.hint,
        color: theme.palette.text.primary,
        alignItems: 'center',
    },
    icon: {
        height: 32,
        width: 32,
        marginRight:5,
        backgroundSize: 'cover',
        backgroundPosition:'center'
    },
    right: {
        float: 'right',
    },
    left: {
        float: 'left',
        marginRight:10
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
        display: 'flex'
    },
    formControl: {
        display: 'flex',
        padding: 24,
        flexGrow: 1000
    },
    formContainer: {
        display: 'flex',
        justifyContent:'center',
        alignItems:'center'
    },
    formIcon: {
        margin: 10,
        opacity: 0.6
    },
    descriptionPanel: {
        width: '100%',
        backgroundColor: 'transparent',
        marginBottom: 20,
        marginTop: 20,
        marginLeft: 20,
        opacity: .75,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        '& a': {
            paddingLeft: 3,
            color: theme.palette.type === 'dark' ? '#EEE' : '#111',
        }
    },
    dialogTitle: {
        borderBottom: '1px solid #00000020',
        padding : 0,
        width:'100%'
    },
    dialogActions: {
        borderTop: '1px solid #00000020',
        width:'100%'
    },
    dialogPaper: {
        overflowY: 'initial',
        display:'flex',
        flexDirection:'column',
        justifyContent:'center',
        alignItems:'center',
        width: 'calc(100% - 100px)',
        height: 'calc(100% - 100px)',
        maxWidth: 800,
        maxHeight:  '100%'
    },
    dialogPaperMini: {
        maxHeight: 300
    },
    colorPicker: {
        // position:'absolute'
    },
    iconPreview: {
        height: 40,
        width: 40,
    },
    mainDescription: {
        fontSize: '200%'
    },
    deleteDialog: {
        padding: 20
    },
    narrowContent: {
        padding: '8px 8px 8px 8px',
    }
});

const DndPreview = () => {
    const {display/*, itemType*/, item, style} = usePreview();
    if (!display) {
        return null;
    }
    return <div style={style}>{item.preview}</div>;
}

function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

const USER_TEMPLATE = {
    type: 'user',
    common: {
        name: '',
        password: '',
        dontDelete: false,
        enabled: true,
        color: false,
        desc: ''
    },
    native: {},
    enums: {}
};

const GROUP_TEMPLATE = {
    type: 'group',
    common: {
        name: '',
        desc: '',
        members: [],
        dontDelete: false,
        acl: {
            object: {
                list: false,
                read: false,
                write: false,
                'delete': false
            },
            state: {
                list: false,
                read: false,
                write: false,
                create: false,
                'delete': false
            },
            users: {
                list: false,
                read: false,
                write: false,
                create: false,
                'delete': false
            },
            other: {
                execute: false,
                http: false,
                sendto: false
            },
            file: {
                list: false,
                read: false,
                write: false,
                create: false,
                'delete': false
            }
        },
        icon: '',
        color: false
    }
};

class UsersList extends Component {
    constructor(props) {
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
        };
    }

    componentDidMount() {
        this.setState({innerWidth: window.innerWidth}, () =>
            this.updateData());
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (!window.innerWidth !== this.state.innerWidth) {
            setTimeout(() => this.setState({innerWidth: window.innerWidth}), 100);
        }
    }

    getText = name =>
        name && typeof name === 'object' ? name[this.props.lang] || name.en || '' : name || '';

    showUserEditDialog = (user, isNew) => {
        user = JSON.parse(JSON.stringify(user));
        user.common.password       = user.common.password ? PASSWORD_SET : '';
        user.common.passwordRepeat = user.common.password;
        this.setState({userEditDialog: user, userEditDialogNew: isNew});
    }

    showGroupEditDialog = (group, isNew) => {
        group = JSON.parse(JSON.stringify(group));
        this.setState({groupEditDialog: group, groupEditDialogNew: isNew});
    }

    updateData = () => {
        let users;
        return this.props.socket.getForeignObjects('system.user.*', 'user')
            .then(_users => {
                users = Object.values(_users).sort((o1, o2) => o1._id > o2._id ? 1 : -1);
                // remove deprecated field "description"
                users.forEach(user => {
                    if (user.common && user.common.description) {
                        if (!user.common.desc) {
                            user.common.desc = user.common.description;
                        }
                        delete user.common.description;
                    }
                });
                return this.props.socket.getForeignObjects('system.group.*', 'group');
            })
            .then(groups => {
                groups = Object.values(groups).sort((o1, o2) => o1._id > o2._id ? 1 : -1);
                // remove deprecated field "description"
                groups.forEach(group => {
                    if (group.common && group.common.description) {
                        if (!group.common.desc) {
                            group.common.desc = group.common.description;
                        }
                        delete group.common.description;
                    }
                });
                this.setState({groups, users});
            });
    }

    changeUserFormData = user =>
        this.setState({userEditDialog: user});

    changeGroupFormData = group =>
        this.setState({groupEditDialog: group});

    saveUser = originalId => {
        let user = JSON.parse(JSON.stringify(this.state.userEditDialog));
        let originalUser = this.state.users.find(element => element._id === user._id);
        let newPassword = user.common.password && user.common.password !== PASSWORD_SET ? user.common.password : '';

        if (originalUser) {
            user.common.password = originalUser.common.password;
        } else {
            user.common.password = '';
        }

        delete user.common.passwordRepeat;

        this.props.socket.setObject(user._id, user)
            .then(() => {
                if (originalId && originalId !== this.state.userEditDialog._id) {
                    return this.props.socket.delObject(originalId)
                        .then(() => Promise.all(this.state.groups.map(group => {
                            if (group.common.members.includes(originalId)) {
                                let groupChanged = JSON.parse(JSON.stringify(group));
                                groupChanged.common.members[groupChanged.common.members.indexOf(originalId)] = user._id;
                                return this.props.socket.setObject(groupChanged._id, groupChanged);
                            } else {
                                return Promise.resolve(null);
                            }
                        })))
                        .catch(e => window.alert('Cannot delete user: ' + e));
                }
            })
            .then(() => {
                if (newPassword) {
                    return this.props.socket.changePassword(user._id, newPassword)
                        .catch(e => window.alert('Cannot change password: ' + e));
                }
            })
            .then(() =>
                this.setState({userEditDialog: false}, () =>
                    this.updateData()));
    }

    saveGroup = originalId => {
        this.props.socket.setObject(this.state.groupEditDialog._id, this.state.groupEditDialog)
            .then(() => {
                if (originalId && originalId !== this.state.groupEditDialog._id) {
                    return this.props.socket.delObject(originalId)
                        .catch(e => window.alert('Cannot delete user: ' + e));
                }
            })
            .then(() =>
                this.setState({groupEditDialog: false}, () => this.updateData()));
    }

    showUserDeleteDialog = user =>
        this.setState({userDeleteDialog: user});

    showGroupDeleteDialog = group =>
        this.setState({groupDeleteDialog: group});

    deleteUser = userId => {
        this.props.socket.delObject(userId)
            .then(() => Promise.all(this.state.groups.map(group => {
                if (group.common.members.includes(userId)) {
                    let groupChanged = JSON.parse(JSON.stringify(group));
                    groupChanged.common.members.splice(groupChanged.common.members.indexOf(userId), 1);
                    return this.props.socket.setObject(groupChanged._id, groupChanged);
                } else {
                    return Promise.resolve(null);
                }
            })))
            .catch(e => window.alert('Cannot delete user: ' + e))
            .then(() => {
                this.setState({userDeleteDialog: false}, () =>
                    this.updateData());
            });
    };

    deleteGroup = groupId =>
        this.props.socket.delObject(groupId)
            .then(() => this.setState({groupDeleteDialog: false}, () =>
                this.updateData()))
            .catch(e => window.alert('Cannot delete user: ' + e));

    addUserToGroup = (userId, groupId) => {
        let group = this.state.groups.find(group => group._id === groupId);
        let members = group.common.members;
        if (!members.includes(userId)) {
            members.push(userId);
            this.props.socket.setObject(group._id, group)
                .then(() =>
                    this.updateData())
                .catch(e => window.alert('Cannot delete user: ' + e));
        }
    };

    removeUserFromGroup = (userId, groupId) => {
        let group = this.state.groups.find(group => group._id === groupId);
        let members = group.common.members;
        if (members.includes(userId)) {
            members.splice(members.indexOf(userId), 1);
            this.props.socket.setObject(group._id, group).then(() =>
                this.updateData());
        }
    };

    static _isUniqueName(list, word, i) {
        return !list.find(item =>
            item._id === (`system.user.${word.toLowerCase()}_${i}`) ||
            item.common.name === word + ' ' + i
        );
    }

    static findNewUniqueName(isGroup, list, word) {
        let i = 1;
        while (!UsersList._isUniqueName(list,  word, i)) {
            i++;
        }
        return {_id: `system.${isGroup ? 'group' : 'user'}.${word.toLowerCase()}_${i}`, name: word + ' ' + i};
    }

    render() {
        if (!this.state.users || !this.state.groups) {
            return <LinearProgress />;
        }

        return <>
            <DndProvider backend={isTouchDevice() ? TouchBackend : HTML5Backend}>
                <DndPreview />
                <div className={this.props.classes.descriptionPanel}>
                    {this.props.t('You can drag users to groups.')}
                </div>
                <Grid container spacing={2} className={this.props.classes.mainGridCont}>
                    <Grid item xs={12} md={6} className={clsx(this.props.classes.childGridCont, this.state.innerWidth > 600 && this.props.classes.childGridContWide)}>
                        <div className={this.props.classes.headContainer}>
                            <Fab
                                size="small"
                                className={this.props.classes.right}
                                onClick={() => {
                                    const {_id, name} = UsersList.findNewUniqueName(true, this.state.groups, this.props.t('Group'));
                                    const template = JSON.parse(JSON.stringify(GROUP_TEMPLATE));
                                    template._id = _id;
                                    template.common.name = name;
                                    this.showGroupEditDialog(template, true);
                                }}
                            >
                                <GroupAddIcon/>
                            </Fab>
                            <Typography gutterBottom variant="h4" component="h4">{this.props.t('Groups')}</Typography>
                        </div>
                        <div className={this.props.classes.blocksContainer}>{
                            this.state.groups
                                .sort((a, b) => {
                                    const _a = (this.getText(a?.common?.name) || a._id).toLowerCase();
                                    const _b = (this.getText(b?.common?.name) || b._id).toLowerCase();
                                    if (_a > _b) {
                                        return 1;
                                    } else if (_a < _b) {
                                        return -1;
                                    } else {
                                        return 0;
                                    }
                                }).map(group => <GroupBlock
                                    themeType={this.props.themeType}
                                    group={group}
                                    key={group._id}
                                    users={this.state.users}
                                    showGroupEditDialog={this.showGroupEditDialog}
                                    showGroupDeleteDialog={this.showGroupDeleteDialog}
                                    removeUserFromGroup={this.removeUserFromGroup}
                                    getText={this.getText}
                                    {...this.props}
                                />)
                        }</div>
                    </Grid>
                    <Grid item xs={12} md={6} className={clsx(this.props.classes.childGridCont, this.state.innerWidth > 600 && this.props.classes.childGridContWide)}>
                        <div className={this.props.classes.headContainer}>
                            <Fab
                                size="small"
                                className={this.props.classes.right}
                                onClick={() => {
                                    const {_id, name} = UsersList.findNewUniqueName(false,  this.state.users, this.props.t('User'));
                                    const template = JSON.parse(JSON.stringify(USER_TEMPLATE));
                                    template._id = _id;
                                    template.common.name = name;
                                    this.showUserEditDialog(template, true);
                                }}
                            >
                                <PersonAddIcon/>
                            </Fab>
                            <Typography
                                gutterBottom
                                variant="h4"
                                component="h4"
                            >
                                {this.props.t('Users')}
                            </Typography>
                        </div>
                        <div className={this.props.classes.blocksContainer}>{
                            this.state.users
                                .sort((a, b) => {
                                    const _a = (this.getText(a?.common?.name) || a._id).toLowerCase();
                                    const _b = (this.getText(b?.common?.name) || b._id).toLowerCase();
                                    if (_a > _b) {
                                        return 1;
                                    } else if (_a < _b) {
                                        return -1;
                                    } else {
                                        return 0;
                                    }
                                })
                                .map(user => <UserBlock
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
                                    {...this.props}
                                />)
                        }</div>
                    </Grid>
                </Grid>
                {this.state.userEditDialog ? <UserEditDialog
                    open={true}
                    onClose={() => this.setState({userEditDialog: false})}
                    users={this.state.users}
                    user={this.state.userEditDialog}
                    isNew={this.state.userEditDialogNew}
                    t={this.props.t}
                    lang={this.props.lang}
                    getText={this.getText}
                    classes={this.props.classes}
                    onChange={this.changeUserFormData}
                    saveData={this.saveUser}
                    innerWidth={this.state.innerWidth}
                /> : null}
                {this.state.groupEditDialog ? <GroupEditDialog
                    open={true}
                    onClose={() => this.setState({groupEditDialog: false})}
                    groups={this.state.groups}
                    group={this.state.groupEditDialog}
                    isNew={this.state.groupEditDialogNew}
                    t={this.props.t}
                    lang={this.props.lang}
                    getText={this.getText}
                    classes={this.props.classes}
                    onChange={this.changeGroupFormData}
                    innerWidth={this.state.innerWidth}
                    saveData={this.saveGroup}
                /> : null}
                {this.state.userDeleteDialog ? <UserDeleteDialog
                    open={true}
                    onClose={() => this.setState({userDeleteDialog: false})}
                    user={this.state.userDeleteDialog}
                    t={this.props.t}
                    classes={this.props.classes}
                    deleteUser={this.deleteUser}
                /> : null}
                {this.state.groupDeleteDialog ? <GroupDeleteDialog
                    open={true}
                    onClose={() => this.setState({groupDeleteDialog: false})}
                    group={this.state.groupDeleteDialog}
                    t={this.props.t}
                    classes={this.props.classes}
                    deleteGroup={this.deleteGroup}
                /> : null}
            </DndProvider>
        </>;
    }
}

UsersList.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    ready: PropTypes.bool,
    expertMode: PropTypes.bool,
    themeType: PropTypes.string,
};

export default withStyles(styles)(UsersList);
