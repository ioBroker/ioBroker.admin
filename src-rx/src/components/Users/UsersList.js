import { Component } from 'react';

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Fab from '@material-ui/core/Fab';

import {withStyles} from '@material-ui/core/styles';

import UserBlock from './UserBlock';
import GroupBlock from './GroupBlock';
import UserEditDialog from './UserEditDialog';
import GroupEditDialog from './GroupEditDialog';
import UserDeleteDialog from './UserDeleteDialog';
import GroupDeleteDialog from './GroupDeleteDialog';

import PersonAddIcon from '@material-ui/icons/PersonAdd';
import GroupAddIcon from '@material-ui/icons/GroupAdd';

const styles = theme => ({
    userGroupCard: {
        margin:    10,
        height: 140,
    },
    userGroupTitle: {
        display: 'inline-flex',
        alignItems: 'center',
    },
    userGroupMember: {
        display: 'inline-flex',
        margin: 4,
        padding: 4,
        backgroundColor: theme.palette.grey[200],
        color: 'black',
        alignItems: 'center',
    },
    icon: {
        maxHeight: 42,
        maxWidth: 42,
    },
    right: {
        float: 'right',
    },
    left: {
        float: 'left',
    },
    dialog: {
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        height: 600,
        width: 400,
        maxWidth: '100vw',
        maxHeight: '100vh',
        overflow: 'auto',
    },
    dialogPaper: {
        overflowY: 'initial'
    },
    colorPicker: {
        
    }, 
    iconPreview: {
        maxHeight: 40,
        maxWidth: 40,
    },
    mainDescription: {
        fontSize: '200%'
    }
});

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

    userTemplate = {
        "type": "user",
        "common": {
          "name": "",
          "password": "",
          "dontDelete": false,
          "enabled": true,
          "color": false,
          "desc": ""
        },
        "native": {},
        "_id": "system.user.new",
        "enums": {}
      };
    
    groupTemplate = {
        "_id": "system.group.new",
        "type": "group",
        "common": {
          "name": "",
          "description": "",
          "members": [
            
          ],
          "dontDelete": false,
          "acl": {
            "object": {
              "list": false,
              "read": false,
              "write": false,
              "delete": false
            },
            "state": {
              "list": false,
              "read": false,
              "write": false,
              "create": false,
              "delete": false
            },
            "users": {
              "list": false,
              "read": false,
              "write": false,
              "create": false,
              "delete": false
            },
            "other": {
              "execute": false,
              "http": false,
              "sendto": false
            },
            "file": {
              "list": false,
              "read": false,
              "write": false,
              "create": false,
              "delete": false
            }
          },
          "icon": "",
          "color": false,
          "desc": ""
        }
      };

    componentDidMount() {
        this.updateData();
    }

    getName(name) {
        return typeof(name) === 'object' ? name.en : name;
    }

    showUserEditDialog = (user, isNew) => {
        user = JSON.parse(JSON.stringify(user));
        user.common.password = '';
        user.common.passwordRepeat = '';
        this.setState({userEditDialog: user, userEditDialogNew: isNew});
    }

    showGroupEditDialog = (group, isNew) => {
        group = JSON.parse(JSON.stringify(group));
        this.setState({groupEditDialog: group, groupEditDialogNew: isNew});
    }

    updateData = () => {
        this.props.socket.getForeignObjects('system.user.*', 'user').then(users => {
            users = Object.values(users).sort((o1, o2) => o1._id > o2._id ? 1 : -1);
            this.setState({users: users})
        });
        this.props.socket.getForeignObjects('system.group.*', 'group').then(groups => {
            groups = Object.values(groups).sort((o1, o2) => o1._id > o2._id ? 1 : -1);
            this.setState({groups: groups})
        });
    }

    changeUserFormData = (user) => {
        this.setState({userEditDialog: user})
    }

    changeGroupFormData = (group) => {
        this.setState({groupEditDialog: group})
    }

    saveUser = (originalId) => {
        let user = JSON.parse(JSON.stringify(this.state.userEditDialog));
        let originalUser = this.state.users.find(element => element._id == user._id);
        let newPassword = user.common.password;
        if (originalUser) {
            user.common.password = originalUser.common.password;
        } else {
            user.common.password = '';
        }
        delete user.common.passwordRepeat;
        this.props.socket.setObject(user._id, user)
        .then(()=>{
            if (originalId && originalId !== this.state.userEditDialog._id) {
                return this.props.socket.delObject(originalId).then(()=>{
                    return Promise.all(this.state.groups.map(group => {
                        if (group.common.members.includes(originalId)) {
                            let groupChanged = JSON.parse(JSON.stringify(group));
                            groupChanged.common.members[groupChanged.common.members.indexOf(originalId)] = user._id;
                            return this.props.socket.setObject(groupChanged._id, groupChanged)
                        }
                    }));
                })
            }
        })
        .then(()=>{
            if (newPassword !== '') {
                return this.props.socket.changePassword(user._id, newPassword);
            }
        })
        .then(()=>{
            this.updateData();
            this.setState({userEditDialog: false});
        });
    }

    saveGroup = (originalId) => {
        this.props.socket.setObject(this.state.groupEditDialog._id, this.state.groupEditDialog)
        .then(()=>{
            if (originalId && originalId !== this.state.groupEditDialog._id) {
                return this.props.socket.delObject(originalId);
            }
        })
        .then(()=>{
            this.updateData();
            this.setState({groupEditDialog: false});
        });
    }

    showUserDeleteDialog = (user) => {
        this.setState({userDeleteDialog: user})
    }

    showGroupDeleteDialog = (group) => {
        this.setState({groupDeleteDialog: group})
    }

    deleteUser = (userId) => {
        this.props.socket.delObject(userId).then(()=>{
            return Promise.all(this.state.groups.map(group => {
                if (group.common.members.includes(userId)) {
                    let groupChanged = JSON.parse(JSON.stringify(group));
                    groupChanged.common.members.splice(groupChanged.common.members.indexOf(userId), 1);
                    return this.props.socket.setObject(groupChanged._id, groupChanged)
                }
            }));
        }).then(()=>{
            this.updateData();
            this.setState({userDeleteDialog: false});
        });
    }

    deleteGroup = (groupId) => {
        this.props.socket.delObject(groupId).then(()=>{
            this.updateData();
            this.setState({groupDeleteDialog: false});
        });
    }

    addUserToGroup = (userId, groupId) => {
        let group = this.state.groups.find(group => group._id === groupId);
        let members = group.common.members;
        if (!members.includes(userId)) {
            members.push(userId);
            this.props.socket.setObject(group._id, group).then(() => {
                this.updateData();
            });
        }
    }

    removeUserFromGroup = (userId, groupId) => {
        let group = this.state.groups.find(group => group._id === groupId);
        let members = group.common.members;
        if (members.includes(userId)) {
            members.splice(members.indexOf(userId), 1);
            this.props.socket.setObject(group._id, group).then(() => {
                this.updateData();
            });
        }
    }

    render() {
        if (!this.state.users || !this.state.groups) {
            return 'loading';
        }
        return <>
            <DndProvider backend={HTML5Backend}>
                <div className={this.props.classes.mainDescription}>{this.props.t('You can drag users to groups.')}</div>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Fab size="small" className={this.props.classes.left} onClick={()=>this.showGroupEditDialog(this.groupTemplate, true)}>
                            <GroupAddIcon/>
                        </Fab>
                        <Typography gutterBottom variant="h4" component="h4">{this.props.t('Groups')}</Typography>
                        {
                            this.state.groups.map(group => <GroupBlock 
                                group={group} 
                                key={group._id}
                                users={this.state.users} 
                                showGroupEditDialog={this.showGroupEditDialog}
                                showGroupDeleteDialog={this.showGroupDeleteDialog}
                                removeUserFromGroup={this.removeUserFromGroup}
                                getName={this.getName}
                                {...this.props}
                            />)
                        }
                    </Grid>
                    <Grid item xs={12} md={6}>
                    <Fab size="small" className={this.props.classes.left} onClick={()=>this.showUserEditDialog(this.userTemplate, true)}>
                            <PersonAddIcon/>
                        </Fab>
                        <Typography gutterBottom variant="h4" component="h4">{this.props.t('Users')}</Typography>
                        {
                            this.state.users.map(user => <UserBlock 
                                user={user} 
                                key={user._id}
                                groups={this.state.groups} 
                                showUserEditDialog={this.showUserEditDialog}
                                showUserDeleteDialog={this.showUserDeleteDialog}
                                updateData={this.updateData}
                                addUserToGroup={this.addUserToGroup}
                                removeUserFromGroup={this.removeUserFromGroup}
                                getName={this.getName}
                                {...this.props}
                            />)
                        }
                    </Grid>
                </Grid>
                <UserEditDialog 
                    open={!!this.state.userEditDialog} 
                    onClose={()=>this.setState({userEditDialog: false})}
                    users={this.state.users}
                    user={this.state.userEditDialog}
                    isNew={this.state.userEditDialogNew}
                    t={this.props.t}
                    classes={this.props.classes}
                    change={this.changeUserFormData}
                    saveData={this.saveUser}
                />
                <GroupEditDialog 
                    open={!!this.state.groupEditDialog} 
                    onClose={()=>this.setState({groupEditDialog: false})}
                    groups={this.state.groups}
                    group={this.state.groupEditDialog}
                    isNew={this.state.groupEditDialogNew}
                    t={this.props.t}
                    classes={this.props.classes}
                    change={this.changeGroupFormData}
                    saveData={this.saveGroup}
                />
                <UserDeleteDialog 
                    open={!!this.state.userDeleteDialog} 
                    onClose={()=>this.setState({userDeleteDialog: false})}
                    user={this.state.userDeleteDialog}
                    t={this.props.t}
                    classes={this.props.classes}
                    deleteUser={this.deleteUser}
                />
                <GroupDeleteDialog 
                    open={!!this.state.groupDeleteDialog} 
                    onClose={()=>this.setState({groupDeleteDialog: false})}
                    group={this.state.groupDeleteDialog}
                    t={this.props.t}
                    classes={this.props.classes}
                    deleteGroup={this.deleteGroup}
                />
                {/* <pre>{JSON.stringify(this.state, null, 2)}</pre> */}
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
};

export default withStyles(styles)(UsersList);