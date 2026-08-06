import React, { Component, type JSX } from 'react';

import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Autocomplete } from '@mui/material';

import { Close as IconCancel, Check as IconCheck } from '@mui/icons-material';
import type { AdminConnection, Translate } from '@iobroker/gui-components';
import { DEFAULT_ROLES } from '@/components/Object/ObjectBrowserEditObject';

interface ObjectBrowserEditRoleProps {
    roleArray: { role: string; type: ioBroker.CommonType }[];
    id: string;
    socket: AdminConnection;
    onClose: (obj?: ioBroker.Object) => void;
    t: Translate;
    commonType: ioBroker.CommonType;
}

interface ObjectBrowserEditRoleState {
    role: string | null;
    initRole: string | null;
    roleInput: string | null;
}

class ObjectBrowserEditRole extends Component<ObjectBrowserEditRoleProps, ObjectBrowserEditRoleState> {
    private object: ioBroker.Object | null = null;

    constructor(props: ObjectBrowserEditRoleProps) {
        super(props);

        this.state = {
            role: null,
            initRole: null,
            roleInput: null,
        };
    }

    componentDidMount(): void {
        void this.props.socket
            .getObject(this.props.id)
            .then(obj => {
                this.object = (obj as ioBroker.Object) || null;
                const value = obj?.common?.role || '';
                this.setState({ role: value, initRole: value, roleInput: value });
            })
            .catch((e: string) => console.error(e));
    }

    onUpdate(): void {
        const object = this.object;
        if (!object) {
            return;
        }
        object.common = object.common || ({} as ioBroker.ObjectCommon);
        object.common.role = this.state.roleInput || undefined;
        void this.props.socket.setObject(object._id, object).then(() => this.props.onClose(object));
    }

    static filterRoles(roleArray: { role: string; type: ioBroker.CommonType }[], type: ioBroker.CommonType): string[] {
        const bigRoleArray: string[] = [];
        roleArray.forEach(
            role =>
                (role.type === 'mixed' || role.type) === type &&
                !bigRoleArray.includes(role.role) &&
                bigRoleArray.push(role.role),
        );
        DEFAULT_ROLES.forEach(
            role =>
                (role.type === 'mixed' || role.type) === type &&
                !bigRoleArray.includes(role.role) &&
                bigRoleArray.push(role.role),
        );
        bigRoleArray.sort();
        return bigRoleArray;
    }

    render(): JSX.Element {
        return (
            <Dialog
                key="objectBrowserEditRole"
                open={!0}
                maxWidth="sm"
                fullWidth
                onClose={() => this.props.onClose()}
                aria-labelledby="edit-role-dialog-title"
                aria-describedby="edit-role-dialog-description"
            >
                <DialogTitle id="edit-role-dialog-title">
                    {this.object ? this.props.t('Update role for %s', this.object._id) : null}
                </DialogTitle>
                <DialogContent>
                    <Autocomplete
                        freeSolo
                        options={ObjectBrowserEditRole.filterRoles(this.props.roleArray, this.props.commonType)}
                        style={{ width: '100%' }}
                        value={this.state.role}
                        onChange={(event, role) => this.setState({ role, roleInput: role })}
                        onInputChange={(event, role) => this.setState({ roleInput: role })}
                        renderInput={params => (
                            <TextField
                                variant="standard"
                                {...params}
                                label={this.props.t('Role')}
                            />
                        )}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={this.state.initRole === this.state.roleInput}
                        variant="contained"
                        onClick={() => this.onUpdate()}
                        color="primary"
                        startIcon={<IconCheck />}
                    >
                        {this.props.t('Apply')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => this.props.onClose()}
                        color="grey"
                        startIcon={<IconCancel />}
                    >
                        {this.props.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default ObjectBrowserEditRole;
