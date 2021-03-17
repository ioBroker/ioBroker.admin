import Dialog from '@material-ui/core/Dialog';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

import {UsersTextField} from './Fields';

function GroupEditDialog(props) {
    return props.open ? <Dialog open={props.open} onClose={props.onClose}>
        <Box className={props.classes.dialog}>
            <UsersTextField 
                label="Name" 
                t={props.t} 
                value={ props.group.common.name }
                onChange={e=>{
                    let newData = props.group;
                    newData.common.name = e.target.value;
                    props.change(newData);
                }}
                classes={props.classes}
            />
            <UsersTextField 
                label="ID" 
                t={props.t} 
                value={ props.group.common._id }
                classes={props.classes}
            />
            <UsersTextField 
                label="Description" 
                t={props.t} 
                value={ props.group.common.desc }
                onChange={e=>{
                    let newData = props.group;
                    newData.common.desc = e.target.value;
                    props.change(newData);
                }}
                classes={props.classes}
            />
            <UsersTextField 
                label="Icon" 
                t={props.t} 
                value={ props.group.common.icon }
                onChange={e=>{
                    let newData = props.group;
                    newData.common.icon = e.target.value;
                    props.change(newData);
                }}
                classes={props.classes}
            />
            <UsersTextField 
                label="Color" 
                t={props.t} 
                value={ props.group.common.color }
                onChange={e=>{
                    let newData = props.group;
                    newData.common.color = e.target.value;
                    props.change(newData);
                }}
                classes={props.classes}
            />
            <Button onClick={props.saveData}>Save</Button>
        </Box>
    </Dialog> : null;
}

export default GroupEditDialog;