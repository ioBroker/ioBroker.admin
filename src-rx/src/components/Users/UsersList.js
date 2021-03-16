import { Component } from 'react';

import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';

import {withStyles} from '@material-ui/core/styles';

import ClearIcon from '@material-ui/icons/Clear';
import GroupIcon from '@material-ui/icons/Group';
import PersonIcon from '@material-ui/icons/Person';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

const styles = theme => ({
    userGroupCard: {
        margin:    10,
    },
    userGroupTitle: {
        display: 'inline-flex',
        alignItems: 'center',
    },
    userGroupMember: {
        display: 'inline-flex',
        margin: 4,
        padding: 4,
        backgroundColor: 'lightgray',
        alignItems: 'center',
    },
    icon: {
        maxHeight: 42,
        maxWidth: 42,
    },
});

function UserBlock(props) {
    return <Card raised className={props.classes.userGroupCard}>
        <IconButton size="small"><EditIcon/></IconButton>
        <IconButton size="small"><DeleteIcon/></IconButton>
        <CardContent>
            <Typography gutterBottom variant="h5" component="h5" className={props.classes.userGroupTitle}>
                {props.user.common.icon ? <img class={props.classes.icon} src={props.user.common.icon} alt=""/> : <PersonIcon/>} 
                <span>{typeof(props.user.common.name) === 'object' ? props.user.common.name.en : props.user.common.name}</span>
            </Typography>
            <div>
                {props.groups.map(group => 
                    group.common.members && group.common.members.includes(props.user._id) ? 
                    <Card className={props.classes.userGroupMember}>
                        {group._id} 
                        <IconButton size="small"><ClearIcon/></IconButton>
                    </Card> : 
                    null
                )}
            </div>
        </CardContent>
    </Card>
}

function GroupBlock(props) {
    return <Card raised className={props.classes.userGroupCard}>
        <IconButton size="small"><EditIcon/></IconButton>
        <IconButton size="small"><DeleteIcon/></IconButton>
        <CardContent>
            <Typography gutterBottom variant="h5" component="h5" className={props.classes.userGroupTitle}>
                {props.group.common.icon ? <img class={props.classes.icon} src={props.group.common.icon} alt=""/> : <GroupIcon/>} 
                <span>{typeof(props.group.common.name) === 'object' ? props.group.common.name.en : props.group.common.name}</span>
            </Typography>
            <div>
                {props.group.common.members.map(member => 
                    <Card className={props.classes.userGroupMember}>
                        {member} 
                        <IconButton size="small"><ClearIcon/></IconButton>
                    </Card>
                )}
            </div>
        </CardContent>
    </Card>
}

class UsersList extends Component {

    constructor(props) {
        super(props);

        this.state = {
            users: null,
            groups: null,
        };
    }

    componentDidMount() {
        this.props.socket.getForeignObjects('system.user.*', 'user').then(users => 
            this.setState({users: Object.values(users).sort((o1, o2) => o1._id > o2._id ? 1 : -1)})
        );
        this.props.socket.getForeignObjects('system.group.*', 'group').then(groups => 
            this.setState({groups: Object.values(groups).sort((o1, o2) => o1._id > o2._id ? 1 : -1)})
        );
    }

    render() {
        if (!this.state.users || !this.state.groups) {
            return 'loading';
        }
        return <>
            <Grid container spacing={2}>
                <Grid item xs={12} lg={6}>
                    <Typography gutterBottom variant="h4" component="h4">{this.props.t('Groups')}</Typography>
                    {
                        this.state.groups.map(group => <GroupBlock group={group} users={this.state.users} {...this.props}/>)
                    }
                </Grid>
                <Grid item xs={12} lg={6}>
                    <Typography gutterBottom variant="h4" component="h4">{this.props.t('Users')}</Typography>
                    {
                        this.state.users.map(user => <UserBlock user={user} groups={this.state.groups} {...this.props}/>)
                    }
                </Grid>
            </Grid>
            <pre>{JSON.stringify(this.state, null, 2)}</pre>
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