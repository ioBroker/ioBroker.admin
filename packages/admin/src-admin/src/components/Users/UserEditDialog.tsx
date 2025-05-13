import React, { Component } from 'react';

import { Dialog, DialogTitle, DialogContent, DialogActions, Grid2, Button } from '@mui/material';
import {
    TextFields as TextFieldsIcon,
    LocalOffer as LocalOfferIcon,
    Description as DescriptionIcon,
    Pageview as PageviewIcon,
    Person as PersonIcon,
    VpnKey as VpnKeyIcon,
    ColorLens as ColorLensIcon,
    Image as ImageIcon,
    Close as IconCancel,
    Check as IconCheck,
    PersonOff as PersonOffIcon,
} from '@mui/icons-material';

import { Utils, IconPicker, type Translate } from '@iobroker/adapter-react-v5';

import { IOTextField, IOColorPicker } from '../IOFields/Fields';
import AdminUtils from '../../helpers/AdminUtils';

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
import type { AdminConnection } from '@iobroker/socket-client';

const USER_ICONS = [User1, User2, User3, User4, User5, User6, User7, User8, User9, User10, User11, User12];

const styles: Record<string, React.CSSProperties> = {
    contentRoot: {
        padding: '16px 24px',
    },
};

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
    styles: Record<string, React.CSSProperties>;
    socket: AdminConnection;
}

interface UserEditDialogState {
    originalId: string | null;
    passwordRepeat: string;
}

class UserEditDialog extends Component<UserEditDialogProps, UserEditDialogState> {
    constructor(props: UserEditDialogProps) {
        super(props);
        this.state = {
            originalId: props.user._id,
            passwordRepeat: props.user.common.password,
        };
    }

    componentDidMount(): void {
        if (this.props.isNew) {
            const icon = USER_ICONS[Math.round(Math.random() * (USER_ICONS.length - 1))];

            if (icon) {
                void Utils.getSvg(icon).then((fileBlob: string) => {
                    const newData: ioBroker.UserObject = Utils.clone(this.props.user) as ioBroker.UserObject;
                    newData.common.icon = fileBlob;
                    this.props.onChange(newData);
                });
            }
        }
    }

    render(): React.JSX.Element {
        const idExists = this.props.users.find(user => user._id === this.props.user._id);
        const idChanged = this.props.user._id !== this.state.originalId;

        const getShortId = (_id: string): string => _id.split('.').pop();

        const name2Id = (name: string): string =>
            name
                .replace(Utils.FORBIDDEN_CHARS, '_')
                .replace(/\s/g, '_')
                .replace(/\./g, '_')
                .replace(/,/g, '_')
                .replace(/__/g, '_')
                .replace(/__/g, '_')
                .toLowerCase();

        const changeShortId = (_id: string, short: string): string => {
            const idArray = _id.split('.');
            idArray[idArray.length - 1] = short;
            return idArray.join('.');
        };

        const description = this.props.getText(this.props.user.common.desc);
        const name = this.props.getText(this.props.user.common.name);

        const errorPassword = AdminUtils.checkPassword((this.props.user.common as any).password);
        const errorPasswordRepeat = AdminUtils.checkPassword(
            (this.props.user.common as any).password,
            this.state.passwordRepeat,
        );

        let canSave = this.props.user._id !== 'system.user.' && !errorPassword && !errorPasswordRepeat;

        if (this.props.isNew && idExists) {
            canSave = false;
        } else if (idExists && idChanged) {
            canSave = false;
        }

        return (
            <Dialog
                fullWidth={this.props.innerWidth < 500}
                open={!0}
                onClose={(_event, reason) => {
                    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                        this.props.onClose();
                    }
                }}
            >
                <DialogTitle style={{ ...this.props.styles.dialogTitle, padding: 12 }}>
                    {this.props.t('User parameters')}
                </DialogTitle>
                <DialogContent
                    sx={{
                        '&.MuiDialogContent-root': {
                            ...(this.props.innerWidth < 500 ? this.props.styles.narrowContent : undefined),
                            ...styles.contentRoot,
                        },
                    }}
                >
                    <Grid2
                        container
                        spacing={this.props.innerWidth < 500 ? 1 : 4}
                        style={this.props.styles.dialog}
                    >
                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <IOTextField
                                label="Name"
                                t={this.props.t}
                                value={name}
                                onChange={value => {
                                    const newData: ioBroker.UserObject = Utils.clone(
                                        this.props.user,
                                    ) as ioBroker.UserObject;
                                    if (
                                        !this.props.user.common.dontDelete &&
                                        name2Id(this.props.getText(newData.common.name)) === getShortId(newData._id)
                                    ) {
                                        newData._id = changeShortId(
                                            newData._id,
                                            name2Id(value),
                                        ) as ioBroker.ObjectIDs.User;
                                    }
                                    newData.common.name = value;
                                    this.props.onChange(newData);
                                }}
                                autoComplete="new-password"
                                icon={TextFieldsIcon}
                                styles={this.props.styles}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <IOTextField
                                label="ID edit"
                                t={this.props.t}
                                disabled={this.props.user.common.dontDelete}
                                value={this.props.user._id.split('.')[this.props.user._id.split('.').length - 1]}
                                onChange={value => {
                                    const newData: ioBroker.UserObject = Utils.clone(
                                        this.props.user,
                                    ) as ioBroker.UserObject;
                                    newData._id = changeShortId(newData._id, name2Id(value)) as ioBroker.ObjectIDs.User;
                                    this.props.onChange(newData);
                                }}
                                icon={LocalOfferIcon}
                                styles={this.props.styles}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <IOTextField
                                label="ID preview"
                                t={this.props.t}
                                disabled
                                value={this.props.user._id}
                                icon={PageviewIcon}
                                styles={this.props.styles}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <IOTextField
                                label="Description"
                                t={this.props.t}
                                value={description}
                                onChange={value => {
                                    const newData: ioBroker.UserObject = Utils.clone(
                                        this.props.user,
                                    ) as ioBroker.UserObject;
                                    newData.common.desc = value;
                                    this.props.onChange(newData);
                                }}
                                icon={DescriptionIcon}
                                styles={this.props.styles}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <IOTextField
                                label="Password"
                                t={this.props.t}
                                value={this.props.user.common.password}
                                error={errorPassword ? this.props.t(errorPassword) : undefined}
                                onChange={value => {
                                    const newData: ioBroker.UserObject = Utils.clone(
                                        this.props.user,
                                    ) as ioBroker.UserObject;
                                    newData.common.password = value;
                                    this.props.onChange(newData);
                                }}
                                type="password"
                                autoComplete="new-password"
                                icon={VpnKeyIcon}
                                styles={this.props.styles}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <IOTextField
                                label="Password repeat"
                                t={this.props.t}
                                value={this.state.passwordRepeat}
                                error={errorPasswordRepeat ? this.props.t(errorPasswordRepeat) : undefined}
                                onChange={value => this.setState({ passwordRepeat: value })}
                                type="password"
                                autoComplete="new-password"
                                icon={VpnKeyIcon}
                                styles={this.props.styles}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <IconPicker
                                icons={USER_ICONS}
                                label="Icon"
                                // t={this.props.t}
                                // lang={this.props.lang}
                                value={this.props.user.common.icon}
                                onChange={fileBlob => {
                                    const newData: ioBroker.UserObject = Utils.clone(
                                        this.props.user,
                                    ) as ioBroker.UserObject;
                                    newData.common.icon = fileBlob;
                                    this.props.onChange(newData);
                                }}
                                previewStyle={this.props.styles.iconPreview}
                                icon={ImageIcon}
                                // classes={this.props.classes}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <IOColorPicker
                                label="Color"
                                t={this.props.t}
                                value={this.props.user.common.color}
                                previewStyle={this.props.styles.iconPreview}
                                onChange={color => {
                                    const newData: ioBroker.UserObject = Utils.clone(
                                        this.props.user,
                                    ) as ioBroker.UserObject;
                                    newData.common.color = color;
                                    this.props.onChange(newData);
                                }}
                                icon={ColorLensIcon}
                                style={this.props.styles.colorPicker}
                                styles={this.props.styles}
                            />
                        </Grid2>
                    </Grid2>
                    {/* @ts-expect-error needs to be added to types */}
                    {!this.props.user.common.externalAuthentication.oidc ? (
                        <Button
                            variant="contained"
                            color="secondary"
                            fullWidth
                            onClick={() => {
                                window.location.href = `/sso?redirectUrl=${encodeURIComponent(`${window.origin}/#tab-users`)}&method=register&user=${this.props.getText(this.props.user.common.name)}`;
                            }}
                            startIcon={<PersonIcon />}
                            sx={{ marginTop: 2 }}
                        >
                            {/*TODO: translate*/}
                            {this.props.t('Add Single-Sign On')}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="secondary"
                            fullWidth
                            startIcon={<PersonOffIcon />}
                            sx={{ marginTop: 2 }}
                            onClick={async () => {
                                const userObj = await this.props.socket.getObject(this.props.user._id);
                                // @ts-expect-error needs types
                                delete userObj.common.externalAuthentication.oidc;
                                await this.props.socket.setObject(this.props.user._id, userObj);
                                userObj.common.password = this.props.user.common.password;
                                this.props.onChange(userObj);
                            }}
                        >
                            {/*TODO: translate*/}
                            {this.props.t('Disconnect Single-Sign On')}
                        </Button>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button
                        variant="contained"
                        color="primary"
                        autoFocus
                        onClick={() => this.props.saveData(this.props.isNew ? null : this.state.originalId)}
                        disabled={!canSave}
                        startIcon={<IconCheck />}
                    >
                        {this.props.t('Save')}
                    </Button>
                    <Button
                        variant="contained"
                        color="grey"
                        onClick={this.props.onClose}
                        startIcon={<IconCancel />}
                    >
                        {this.props.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default UserEditDialog;
