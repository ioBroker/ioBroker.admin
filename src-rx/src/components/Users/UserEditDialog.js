import {useState, useEffect} from 'react';

import Dialog from '@material-ui/core/Dialog';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

import TextFieldsIcon from '@material-ui/icons/TextFields';
import DescriptionIcon from '@material-ui/icons/Description';
import LocalOfferIcon from '@material-ui/icons/LocalOffer';
import PageviewIcon from '@material-ui/icons/Pageview';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import ColorLensIcon from '@material-ui/icons/ColorLens';
import ImageIcon from '@material-ui/icons/Image';

import {UsersTextField, UsersColorPicker, UsersFileInput} from './Fields';
import Utils from '../Utils';

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

    const getShortId = _id => {
        return _id.split('.').pop();
    };

    const name2Id = name =>
        name.replace(Utils.FORBIDDEN_CHARS, '_').replace(/\s/g, '_').replace(/\./g, '_').toLowerCase();

    return <Dialog PaperProps={{className: props.classes.dialogPaper}} open={props.open} onClose={props.onClose}>
        <Box className={props.classes.dialog}>
            <UsersTextField
                label="Name"
                t={props.t}
                value={ props.user.common.name }
                onChange={e=>{
                    let newData = JSON.parse(JSON.stringify(props.user));
                    // sync data
                    if (newData._id.split('.').pop() === name2Id(newData.common.name)) {
                        const idArray = props.user._id.split('.');
                        idArray[idArray.length - 1] = name2Id(e.target.value);
                        newData._id = idArray.join('.');
                    }

                    newData.common.name = e.target.value;
                    props.change(newData);
                }}
                autoComplete="off"
                icon={TextFieldsIcon}
                classes={props.classes}
            />
            <UsersTextField
                label="ID edit"
                t={props.t}
                disabled={props.user.common.dontDelete}
                value={ props.user._id.split('.').pop() }
                onChange={e => {
                    let newData = JSON.parse(JSON.stringify(props.user));
                    const idArray = props.user._id.split('.');
                    idArray[idArray.length - 1] = name2Id(e.target.value);
                    newData._id = idArray.join('.');
                    props.change(newData);
                }}
                icon={LocalOfferIcon}
                classes={props.classes}
            />
            <UsersTextField
                label="ID preview"
                t={props.t}
                disabled
                value={ props.user._id }
                icon={PageviewIcon}
                classes={props.classes}
            />
            <UsersTextField
                label="Description"
                t={props.t}
                value={ props.user.common.desc }
                onChange={e=>{
                    let newData = JSON.parse(JSON.stringify(props.user));
                    newData.common.desc = e.target.value;
                    props.change(newData);
                }}
                icon={DescriptionIcon}
                classes={props.classes}
            />
            <UsersTextField
                label="Password"
                t={props.t}
                value={ props.user.common.password }
                onChange={e=>{
                    let newData = JSON.parse(JSON.stringify(props.user));
                    newData.common.password = e.target.value;
                    props.change(newData);
                }}
                type="password"
                autoComplete="off"
                icon={VpnKeyIcon}
                classes={props.classes}
            />
            <UsersTextField
                label="Password repeat"
                t={props.t}
                value={ props.user.common.passwordRepeat }
                onChange={e=>{
                    let newData = JSON.parse(JSON.stringify(props.user));
                    newData.common.passwordRepeat = e.target.value;
                    props.change(newData);
                }}
                type="password"
                autoComplete="off"
                icon={VpnKeyIcon}
                classes={props.classes}
            />
            <UsersFileInput
                label="Icon"
                t={props.t}
                value={ props.user.common.icon }
                onChange={fileblob=>{
                    let newData = JSON.parse(JSON.stringify(props.user));
                    newData.common.icon = fileblob;
                    props.change(newData);
                }}
                previewClassName={props.classes.iconPreview}
                icon={ImageIcon}
                classes={props.classes}
            />
            <UsersColorPicker
                label="Color"
                t={props.t}
                value={ props.user.common.color }
                previewClassName={props.classes.iconPreview}
                onChange={color=>{
                    let newData = JSON.parse(JSON.stringify(props.user));
                    newData.common.color = color;
                    props.change(newData);
                }}
                icon={ColorLensIcon}
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