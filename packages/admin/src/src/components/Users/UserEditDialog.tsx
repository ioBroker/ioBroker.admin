import React, { useState, useEffect } from 'react';
import { withStyles, type Styles } from '@mui/styles';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Button,
} from '@mui/material';

import {
    TextFields as TextFieldsIcon,
    LocalOffer as LocalOfferIcon,
    Description as DescriptionIcon,
    Pageview as PageviewIcon,
    VpnKey as VpnKeyIcon,
    ColorLens as ColorLensIcon,
    Image as ImageIcon,
    Close as IconCancel,
    Check as IconCheck,
} from '@mui/icons-material';

import {
    Utils, IconPicker,
    type Translate, type IobTheme,
} from '@iobroker/adapter-react-v5';

import { IOTextField, IOColorPicker } from '../IOFields/Fields';
import AdminUtils from '../../Utils';

import User1 from '../../assets/users/user1.svg';
import User2 from '../../assets/users/user2.svg';
import User3 from '../../assets/users/user3.svg';
import User4 from '../../assets/users/user4.svg';
import User5 from '../../assets/users/user5.svg';
import User6 from '../../assets/users/user6.svg';
import User7 from '../../assets/users/user7.svg';
import User8 from '../../assets/users/user8.svg';
import User9 from '../../assets/users/user9.svg';
import User10 from '../../assets/users/user10.svg';
import User11 from '../../assets/users/user11.svg';
import User12 from '../../assets/users/user12.svg';

const USER_ICONS = [User1, User2, User3, User4, User5, User6, User7, User8, User9, User10, User11, User12];

const styles: Styles<IobTheme, any> = () => ({
    contentRoot:{
        padding: '16px 24px',
    },
});

interface UserEditDialogProps {
    t: Translate;
    onClose: () => void;
    users: ioBroker.UserObject[];
    user: ioBroker.UserObject;
    isNew: boolean;
    onChange: (user: ioBroker.UserObject) => void;
    saveData: (originalId: string) => void;
    innerWidth: number;
    getText: (text: ioBroker.StringOrTranslated) => string;
    classes: Record<string, string>;
}

const UserEditDialog: React.FC<UserEditDialogProps> = props => {
    const [originalId, setOriginalId] = useState(null);

    useEffect(() => {
        setOriginalId(props.user._id);
        if (props.isNew) {
            const icon = USER_ICONS[Math.round(Math.random() * (USER_ICONS.length - 1))];

            icon && Utils.getSvg(icon)
                .then((fileBlob: string) => {
                    const newData = Utils.clone(props.user);
                    newData.common.icon = fileBlob;
                    props.onChange(newData);
                });
        }
    }, []);

    const idExists = props.users.find(user => user._id === props.user._id);
    const idChanged = props.user._id !== originalId;

    const getShortId = (_id: string) =>
        _id.split('.').pop();

    const name2Id = (name: string) =>
        name.replace(Utils.FORBIDDEN_CHARS, '_').replace(/\s/g, '_').replace(/\./g, '_').replace(/,/g, '_')
            .replace(/__/g, '_')
            .replace(/__/g, '_')
            .toLowerCase();

    const changeShortId = (_id: string, short: string) => {
        const idArray = _id.split('.');
        idArray[idArray.length - 1] = short;
        return idArray.join('.');
    };

    const description = props.getText(props.user.common.desc);
    const name = props.getText(props.user.common.name);

    const errorPassword = AdminUtils.checkPassword((props.user.common as any).password);
    const errorPasswordRepeat = AdminUtils.checkPassword((props.user.common as any).password, (props.user.common as any).passwordRepeat);

    let canSave = props.user._id !== 'system.user.' && !errorPassword && !errorPasswordRepeat;

    if (props.isNew && idExists) {
        canSave = false;
    } else if (idExists && idChanged) {
        canSave = false;
    }

    return <Dialog
        fullWidth={props.innerWidth < 500}
        open={!0}
        onClose={(event, reason) => {
            if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                props.onClose();
            }
        }}
    >
        <DialogTitle className={props.classes.dialogTitle} style={{ padding: 12 }}>
            { props.t('User parameters') }
        </DialogTitle>
        <DialogContent classes={{ root: Utils.clsx(props.innerWidth < 500 && props.classes.narrowContent, props.classes.contentRoot) }}>
            <Grid container spacing={props.innerWidth < 500 ? 1 : 4} className={props.classes.dialog}>
                <Grid item xs={12} md={6}>
                    <IOTextField
                        label="Name"
                        t={props.t}
                        value={name}
                        onChange={value => {
                            const newData = Utils.clone(props.user);
                            if (!props.user.common.dontDelete && name2Id(newData.common.name) === getShortId(newData._id)) {
                                newData._id = changeShortId(newData._id, name2Id(value));
                            }
                            newData.common.name = value;
                            props.onChange(newData);
                        }}
                        autoComplete="new-password"
                        icon={TextFieldsIcon}
                        classes={props.classes}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <IOTextField
                        label="ID edit"
                        t={props.t}
                        disabled={props.user.common.dontDelete}
                        value={props.user._id.split('.')[props.user._id.split('.').length - 1]}
                        onChange={value => {
                            const newData = Utils.clone(props.user);
                            newData._id = changeShortId(newData._id, name2Id(value));
                            props.onChange(newData);
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
                        value={props.user._id}
                        icon={PageviewIcon}
                        classes={props.classes}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <IOTextField
                        label="Description"
                        t={props.t}
                        value={description}
                        onChange={value => {
                            const newData = Utils.clone(props.user);
                            newData.common.desc = value;
                            props.onChange(newData);
                        }}
                        icon={DescriptionIcon}
                        classes={props.classes}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <IOTextField
                        label="Password"
                        t={props.t}
                        value={props.user.common.password}
                        error={errorPassword ? props.t(errorPassword) : undefined}
                        onChange={value => {
                            const newData = Utils.clone(props.user);
                            newData.common.password = value;
                            props.onChange(newData);
                        }}
                        type="password"
                        autoComplete="new-password"
                        icon={VpnKeyIcon}
                        classes={props.classes}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <IOTextField
                        label="Password repeat"
                        t={props.t}
                        value={(props.user.common as any).passwordRepeat}
                        error={errorPasswordRepeat ? props.t(errorPasswordRepeat) : undefined}
                        onChange={value => {
                            const newData = Utils.clone(props.user);
                            newData.common.passwordRepeat = value;
                            props.onChange(newData);
                        }}
                        type="password"
                        autoComplete="new-password"
                        icon={VpnKeyIcon}
                        classes={props.classes}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <IconPicker
                        icons={USER_ICONS}
                        label="Icon"
                        // t={props.t}
                        // lang={props.lang}
                        value={props.user.common.icon}
                        onChange={fileBlob => {
                            const newData = Utils.clone(props.user);
                            newData.common.icon = fileBlob;
                            props.onChange(newData);
                        }}
                        previewClassName={props.classes.iconPreview}
                        icon={ImageIcon}
                        // classes={props.classes}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <IOColorPicker
                        label="Color"
                        t={props.t}
                        value={props.user.common.color}
                        previewClassName={props.classes.iconPreview}
                        onChange={color => {
                            const newData = Utils.clone(props.user);
                            newData.common.color = color;
                            props.onChange(newData);
                        }}
                        icon={ColorLensIcon}
                        className={props.classes.colorPicker}
                        classes={props.classes}
                    />
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions className={props.classes.dialogActions}>
            <Button
                variant="contained"
                color="primary"
                autoFocus
                onClick={() => props.saveData(props.isNew ? null : originalId)}
                disabled={!canSave}
                startIcon={<IconCheck />}
            >
                {props.t('Save')}
            </Button>
            <Button
                variant="contained"
                color="grey"
                onClick={props.onClose}
                startIcon={<IconCancel />}
            >
                {props.t('Cancel')}
            </Button>
        </DialogActions>
    </Dialog>;
};

export default withStyles(styles)(UserEditDialog);
