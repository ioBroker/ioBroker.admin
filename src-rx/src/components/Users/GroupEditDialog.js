import { useState, useEffect, Fragment } from 'react'

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import TextFieldsIcon from '@material-ui/icons/TextFields';
import DescriptionIcon from '@material-ui/icons/Description';
import LocalOfferIcon from '@material-ui/icons/LocalOffer';
import PageviewIcon from '@material-ui/icons/Pageview';
import ColorLensIcon from '@material-ui/icons/ColorLens';
import ImageIcon from '@material-ui/icons/Image';

import {IOTextField, IOFileInput, IOColorPicker} from '../IOFields/Fields';

import Utils from '../Utils';

function PermsTab(props) {
    let mapObject = function(object, mapFunction) {
        return Object.values(object).map((value, index) => {
            let key = Object.keys(object)[index];
            return mapFunction(value, key);
        });
    }

    return <Grid  container spacing={4} className={props.classes.dialog} key="PermsTab">
        {
            mapObject(props.group.common.acl, (block, blockKey) =>
                <Grid item xs={12} md={12} key={blockKey}>
                    <h2 className={props.classes.permHeaders}>{props.t(blockKey)}</h2>
                    {mapObject(block, (perm, permKey) =>
                        <FormControlLabel
                            key={permKey}
                            control={<Checkbox
                                disabled={props.group.common.dontDelete}
                                checked={perm}
                                onChange={e=>{
                                    let newData = props.group;
                                    newData.common.acl[blockKey][permKey] = e.target.checked;
                                    props.change(newData);
                                }}
                            />}
                            label={props.t(permKey)}
                            labelPlacement="top"
                        />
                    )}
                </Grid>
            )
        }
    </Grid>
}

function GroupEditDialog(props) {
    const [tab, setTab] = useState(0);

    let [originalId, setOriginalId] = useState(null);
    useEffect(()=>{
        setOriginalId(props.group._id);
    }, [props.open]);

    if (!props.open) {
        return null;
    }

    let idExists = props.groups.find(group => group._id == props.group._id);
    let idChanged = props.group._id !== originalId;

    let canSave = props.group._id !== 'system.group.' &&
        props.group.common.password === props.group.common.passwordRepeat;

    const getShortId = _id => {
        return _id.split('.').pop();
    };

    const name2Id = name =>
        name.replace(Utils.FORBIDDEN_CHARS, '_').replace(/\s/g, '_').replace(/\./g, '_').toLowerCase();
    
    const changeShortId = (_id, short) => {
        let idArray = _id.split('.');
        idArray[idArray.length-1] = short;
        return idArray.join('.');
    }

    if (props.isNew) {
        if (idExists) {
            canSave = false;
        }
    } else {
        if (idExists && idChanged) {
            canSave = false;
        }
    }
    
    let description = props.group.common.description[ props.lang ]
        ?
        props.group.common.description[ props.lang ]
        :
        props.group.common.description;
    let name = props.group.common.name[ props.lang ]
        ?
        props.group.common.name[ props.lang ]
        :
        props.group.common.name;
    let mainTab = <Grid  container spacing={4} className={props.classes.dialog}>
        <Grid item xs={12} md={6}>
            <IOTextField
                label="Name"
                t={props.t}
                value={ name }
                onChange={e=>{
                    let newData = props.group;
                    if (!props.group.common.dontDelete && name2Id(newData.common.name) === getShortId(newData._id)) {
                        newData._id = changeShortId(newData._id, name2Id(e.target.value));
                    }
                    newData.common.name = e.target.value;
                    props.change(newData);
                }}
                autoComplete="off"
                icon={TextFieldsIcon}
                classes={props.classes}
            />
        </Grid>
         <Grid item xs={12} md={6}>
            <IOTextField
                label="ID edit"
                t={props.t}
                disabled={props.group.common.dontDelete}
                value={ props.group._id.split('.')[props.group._id.split('.').length-1] }
                onChange={e=>{
                    let newData = props.group;
                    newData._id = changeShortId(newData._id, name2Id(e.target.value));
                    props.change(newData);
                }}
                icon={LocalOfferIcon}
                classes={props.classes}
            />
        </Grid>
        <Grid item xs={12} md={6}>
            <IOTextField
                label="ID preview"
                t={props.t}
                disabled
                value={ props.group._id }
                icon={PageviewIcon}
                classes={props.classes}
        />
        </Grid>
        <Grid item xs={12} md={6}>
            <IOTextField
                label="Description"
                t={props.t}
                value={ description }
                onChange={e=>{
                    let newData = props.group;
                    newData.common.description = e.target.value;
                    props.change(newData);
                }}
                icon={DescriptionIcon}
                classes={props.classes}
            />
        </Grid>
        <Grid item xs={12} md={6}>
            <IOFileInput
                label="Icon"
                t={props.t}
                value={ props.group.common.icon }
                onChange={fileblob=>{
                    let newData = props.group;
                    newData.common.icon = fileblob;
                    props.change(newData);
                }}
                previewClassName={props.classes.iconPreview}
                icon={ImageIcon}
                classes={props.classes}
            />
        </Grid>
        <Grid item xs={12} md={6}>
            <IOColorPicker
                label="Color"
                t={props.t}
                value={ props.group.common.color }
                previewClassName={props.classes.iconPreview}
                onChange={color=>{
                    let newData = props.group;
                    newData.common.color = color;
                    props.change(newData);
                }}
                icon={ColorLensIcon}
                className={props.classes.colorPicker}
                classes={props.classes}
            />
        </Grid>
    </Grid>;

    let selectedTab = [mainTab, PermsTab(props)][tab];

    return <Dialog PaperProps={{className: props.classes.dialogPaper}} open={props.open} onClose={props.onClose}>
        <DialogTitle className={props.classes.dialogTitle}>
            <Tabs
                variant="fullWidth"
                value={tab}
                onChange={(e, newTab) => setTab(newTab)}
            >
                <Tab label={props.t('Main')} value={0} />
                <Tab label={props.t('Permissions')} value={1} />
            </Tabs>
        </DialogTitle>
        <DialogContent>

            { selectedTab }
            <div>

            </div>
        </DialogContent>
        <DialogActions className={props.classes.dialogActions} >
            <Button onClick={()=>props.saveData(props.isNew ? null : originalId)} disabled={!canSave}>{props.t('Save')}</Button>
            <Button onClick={props.onClose}>{props.t('Cancel')}</Button>
        </DialogActions>
    </Dialog>;
}

export default GroupEditDialog;