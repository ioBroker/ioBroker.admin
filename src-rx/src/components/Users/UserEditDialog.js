import {useState, useEffect} from 'react';

import Dialog from '@material-ui/core/Dialog';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

import {UsersTextField, UsersColorPicker, UsersFileInput} from './Fields';

function UserEditDialog(props) {
    let [originalId, setOriginalId] = useState(null);
    useEffect(()=>{
        setOriginalId(props.user._id);
    }, [props.open]);

    if (!props.open) {
        return null;
    }

    let idExists = props.users.find(user => user._id == props.user._id);
    let idChanged = props.user._id !== originalId;

    let canSave = props.user._id !== 'system.user.' &&
        props.user.common.password === props.user.common.passwordRepeat;

    if (props.isNew) {
        if (idExists) {
            canSave = false;
        }
    } else {
        if (idExists && idChanged) {
            canSave = false;
        }
    }

    return <Dialog PaperProps={{className: props.classes.dialogPaper}} open={props.open} onClose={props.onClose}>
        <Box className={props.classes.dialog}>
            <UsersTextField 
                label="Name" 
                t={props.t} 
                value={ props.user.common.name }
                onChange={e=>{
                    let newData = props.user;
                    newData.common.name = e.target.value;
                    props.change(newData);
                }}
                autoComplete="off"
                classes={props.classes}
            />
            <UsersTextField 
                label="ID edit" 
                t={props.t} 
                disabled={props.user.common.dontDelete}
                value={ props.user._id.split('.')[props.user._id.split('.').length-1] }
                onChange={e=>{
                    let newData = props.user;
                    let idArray = props.user._id.split('.');
                    idArray[idArray.length-1] = e.target.value.replaceAll('.', '_');
                    newData._id = idArray.join('.');
                    props.change(newData);
                }}
                classes={props.classes}
            />
            <UsersTextField 
                label="ID preview" 
                t={props.t} 
                disabled
                value={ props.user._id }
                classes={props.classes}
            />
            <UsersTextField 
                label="Description" 
                t={props.t} 
                value={ props.user.common.desc }
                onChange={e=>{
                    let newData = props.user;
                    newData.common.desc = e.target.value;
                    props.change(newData);
                }}
                classes={props.classes}
            />
            <UsersTextField 
                label="Password" 
                t={props.t} 
                value={ props.user.common.password }
                onChange={e=>{
                    let newData = props.user;
                    newData.common.password = e.target.value;
                    props.change(newData);
                }}
                type="password"
                autoComplete="off"
                classes={props.classes}
            />
            <UsersTextField 
                label="Password repeat" 
                t={props.t} 
                value={ props.user.common.passwordRepeat }
                onChange={e=>{
                    let newData = props.user;
                    newData.common.passwordRepeat = e.target.value;
                    props.change(newData);
                }}
                type="password"
                autoComplete="off"
                classes={props.classes}
            />
            <UsersFileInput 
                label="Icon" 
                t={props.t} 
                value={ props.user.common.icon }
                onChange={fileblob=>{
                    let newData = props.user;
                    newData.common.icon = fileblob;
                    props.change(newData);
                }}
                previewClassName={props.classes.iconPreview}
                classes={props.classes}
            />
            <UsersColorPicker 
                label="Color" 
                t={props.t} 
                value={ props.user.common.color }
                previewClassName={props.classes.iconPreview}
                onChange={color=>{
                    let newData = props.user;
                    newData.common.color = color;
                    props.change(newData);
                }}
                className={props.classes.colorPicker}
            />
            <div>
                <Button onClick={()=>props.saveData(props.isNew ? null : originalId)} disabled={!canSave}>Save</Button>
                <Button onClick={props.onClose}>Cancel</Button>
            </div>
        </Box>
    </Dialog>;
}

export default UserEditDialog;