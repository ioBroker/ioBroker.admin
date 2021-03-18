import { useState } from 'react'

import Dialog from '@material-ui/core/Dialog';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CheckBox from '@material-ui/core/CheckBox';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import {UsersTextField, UsersFileInput, UsersColorPicker} from './Fields';

function PermsTab(props) {
    let mapObject = function(object, mapFunction) {
        return Object.values(object).map((value, index) => {
            let key = Object.keys(object)[index];
            return mapFunction(value, key);
        });
    }

    return <>
        {mapObject(props.group.common.acl, (block, blockKey) => 
            <>
                <h4>{props.t(blockKey)}</h4>
                {mapObject(block, (perm, permKey) => 
                    <>{props.t(permKey)}: <CheckBox 
                        disabled={props.group.common.dontDelete} 
                        checked={perm}
                        onChange={e=>{
                            let newData = props.group;
                            newData.common.acl[blockKey][permKey] = e.target.checked;
                            props.change(newData);
                        }}
                    /></>
                )}
            </>
        )}
    </>
}

function GroupEditDialog(props) {
    const [tab, setTab] = useState(0);

    if (!props.open) {
        return null;
    }

    let MainTab = () => <div>
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
            value={ props.group._id }
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
        <UsersFileInput 
            label="Icon" 
            t={props.t} 
            value={ props.group.common.icon }
            onChange={fileblob=>{
                let newData = props.group;
                newData.common.icon = fileblob;
                props.change(newData);
            }}
            previewClassName={props.classes.iconPreview}
        />
        <UsersColorPicker 
            label="Color" 
            t={props.t} 
            value={ props.group.common.color }
            previewClassName={props.classes.iconPreview}
            onChange={color=>{
                let newData = props.group;
                newData.common.color = color;
                props.change(newData);
            }}
            className={props.classes.colorPicker}
        />
    </div>;

    let SelectedTab = [MainTab, PermsTab][tab];

    return <Dialog PaperProps={{className: props.classes.dialogPaper}} open={props.open} onClose={props.onClose}>
        <Box className={props.classes.dialog}>
            <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)}>
                <Tab label={props.t('Main')} value={0} />
                <Tab label={props.t('Permissions')} value={1} />
            </Tabs>
            <SelectedTab {...props}/>
            <Button onClick={props.saveData}>Save</Button>
        </Box>
    </Dialog>;
}

export default GroupEditDialog;