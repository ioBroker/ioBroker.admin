import React, { Component, type JSX } from 'react';

import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    TextField,
} from '@mui/material';

// Icons
import { Close, Check } from '@mui/icons-material';

import { type Translate, Utils, type IobTheme, type Connection, SelectID } from '@iobroker/adapter-react-v5';

interface ObjectEditDialogProps {
    expertMode: boolean;
    socket: Connection;
    childrenIds: string[];
    t: Translate;
    theme: IobTheme;
    id: string;
    objectType: ioBroker.ObjectType | undefined;
    onClose: () => void;
}

interface ObjectEditDialogState {
    name: string;
    parentId: string;
    renameAllChildren: boolean;
    copy: boolean;
    newExists: boolean;
    showParentDialog: boolean;
    showHistoryWarning: boolean;
    withHistory: string[];
}

class ObjectMoveRenameDialog extends Component<ObjectEditDialogProps, ObjectEditDialogState> {
    private checkTimer: ReturnType<typeof setTimeout> | null = null;
    private objects: Record<string, ioBroker.Object> = {};

    constructor(props: ObjectEditDialogProps) {
        super(props);

        const parts = this.props.id.split('.');
        const name = parts.pop() || '';

        this.state = {
            name,
            parentId: parts.join('.'),
            renameAllChildren: true,
            copy: window.localStorage.getItem('objects.copyMoveRename') === 'true',
            newExists: true,
            showParentDialog: false,
            showHistoryWarning: false,
            withHistory: [],
        };
    }

    componentWillUnmount(): void {
        if (this.checkTimer) {
            clearTimeout(this.checkTimer);
            this.checkTimer = null;
        }
    }

    static calculateNewId(oldId: string, newId: string, id: string): string {
        // find common name
        const oldParts = oldId.split('.');
        const newParts = newId.split('.');
        let i = 0;
        while (oldParts[i] === newParts[i]) {
            i++;
        }
        const parts = id.split('.');
        parts.splice(0, i + 1);
        return `${newId}.${parts.join('.')}`;
    }

    async getInstancesWithHistory(): Promise<string[]> {
        const instances = await this.props.socket.getAdapterInstances();
        return instances?.filter(obj => obj.common.getHistory).map(obj => obj._id.replace('system.adapter.', ''));
    }

    async checkHistory(): Promise<boolean> {
        // Read all objects
        this.objects = {};
        const instances = await this.getInstancesWithHistory();
        const withHistory: string[] = [];
        try {
            const obj = await this.props.socket.getObject(this.props.id);
            if (obj) {
                this.objects[obj._id] = obj;
            }
        } catch {
            // ignore
        }
        for (const id of this.props.childrenIds) {
            try {
                const obj = await this.props.socket.getObject(id);
                if (obj) {
                    this.objects[obj._id] = obj;
                }
            } catch {
                // ignore
            }
        }

        Object.values(this.objects).forEach((obj: ioBroker.Object): void => {
            if (obj.common?.custom) {
                const found = Object.keys(obj.common.custom).find(key => {
                    // Normally we should try to find all instances with common.getHistory flag
                    if (instances.includes(key)) {
                        if (!obj.common.custom[key].aliasId) {
                            return true;
                        }
                    }
                });
                if (found) {
                    withHistory.push(obj._id);
                }
            }
        });
        if (withHistory.length) {
            this.setState({ showHistoryWarning: true, withHistory });
            return false;
        }
        return true;
    }

    showHistoryWarning(): React.JSX.Element | null {
        if (!this.state.showHistoryWarning) {
            return null;
        }
        return (
            <Dialog
                open={!0}
                onClose={() => this.setState({ showHistoryWarning: false })}
            >
                <DialogTitle>{this.props.t('Found states with history')}</DialogTitle>
                <DialogContent>
                    {this.state.withHistory.length > 2
                        ? this.props.t('You want to move %s states with enabled history', this.state.withHistory.length)
                        : `${this.props.t('Following states have history enabled')}: ${this.state.withHistory.join(', ')}`}
                    <div>{this.props.t('move_states_with_history_warning')}</div>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                            const newID = `${this.state.parentId}.${this.state.name}`;
                            await this.renameCopyObject(
                                this.props.id,
                                newID,
                                this.props.childrenIds.length && this.state.renameAllChildren,
                                false,
                            );
                            this.props.onClose();
                        }}
                        startIcon={<Check />}
                    >
                        {this.props.t('Confirm')}
                    </Button>
                    <Button
                        color="grey"
                        variant="contained"
                        startIcon={<Close />}
                        onClick={() => this.setState({ showHistoryWarning: false })}
                    >
                        {this.props.t('ra_Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    async renameCopyObject(oldId: string, newId: string, withChildren: boolean, copy: boolean): Promise<void> {
        if (oldId === newId) {
            return;
        }
        let obj;
        try {
            obj = this.objects?.[oldId] || (await this.props.socket.getObject(oldId));
        } catch {
            // ignore
        }
        let state: ioBroker.State | undefined;
        if (obj?.type === 'state') {
            state = await this.props.socket.getState(oldId);
        }
        if (withChildren) {
            for (const id of this.props.childrenIds) {
                const nid = ObjectMoveRenameDialog.calculateNewId(oldId, newId, id);
                // calculate new id
                await this.renameCopyObject(id, nid, false, copy);
            }
        }

        if (obj) {
            await this.props.socket.setObject(newId, obj);
            if (state) {
                await this.props.socket.setState(newId, state);
            }
            if (!copy) {
                await this.props.socket.delObject(oldId);
            }
        }
    }

    checkIfNewExists(): void {
        const newID = `${this.state.parentId}.${this.state.name}`;
        if (this.checkTimer) {
            clearTimeout(this.checkTimer);
            this.checkTimer = null;
        }
        if (this.props.id === newID) {
            if (!this.state.newExists) {
                this.checkTimer = setTimeout(() => {
                    this.checkTimer = null;
                    this.setState({ newExists: true });
                }, 50);
            }
        } else {
            this.checkTimer = setTimeout(async () => {
                this.checkTimer = null;
                try {
                    const obj = await this.props.socket.getObject(newID);
                    if (obj && !this.state.newExists) {
                        this.setState({ newExists: true });
                    } else if (!obj && this.state.newExists) {
                        this.setState({ newExists: false });
                    }
                } catch {
                    if (this.state.newExists) {
                        this.setState({ newExists: false });
                    }
                }
            }, 300);
        }
    }

    renderParentSelectorDialog(): React.JSX.Element | null {
        if (!this.state.showParentDialog) {
            return null;
        }
        return (
            <SelectID
                foldersFirst
                imagePrefix="../.."
                expertMode={this.props.expertMode}
                socket={this.props.socket}
                columns={['name', 'type', 'role', 'room', 'func']}
                types={['folder', 'channel', 'device', 'meta']}
                notEditable
                selected={this.state.parentId}
                allowNonObjects
                filterFunc={(obj: ioBroker.Object) => {
                    if (this.props.expertMode) {
                        return true;
                    }
                    return obj._id.startsWith('0_userdata.0') || obj._id.startsWith('javascript.');
                }}
                theme={this.props.theme}
                onSelectConfirm={(
                    _id: string | string[],
                    objects: Record<string, ioBroker.Object | null | undefined>,
                ): Promise<boolean> => {
                    let id: string;
                    if (Array.isArray(_id)) {
                        id = _id[0];
                    } else {
                        id = _id;
                    }
                    if (id.split('.').length <= 1) {
                        return Promise.resolve(false);
                    }
                    if (!objects[id]) {
                        return Promise.resolve(true);
                    }
                    if (objects[id].type === 'state') {
                        return Promise.resolve(false);
                    }
                    if (id.startsWith('system.')) {
                        return Promise.resolve(false);
                    }
                    return Promise.resolve(true);
                }}
                onClose={() => this.setState({ showParentDialog: false })}
                onOk={(_id: string[] | string) => {
                    let parentId: string;
                    if (Array.isArray(_id)) {
                        parentId = _id[0];
                    } else {
                        parentId = _id;
                    }
                    if (parentId && parentId.split('.').length > 1) {
                        this.setState({ parentId });
                    }
                }}
            />
        );
    }

    render(): JSX.Element {
        const newID = `${this.state.parentId}.${this.state.name}`;

        return (
            <Dialog
                open={!0}
                maxWidth="md"
                fullWidth
                onClose={() => this.props.onClose()}
            >
                {this.renderParentSelectorDialog()}
                {this.showHistoryWarning()}
                <DialogTitle>
                    <span style={{ opacity: 0.6, marginRight: 8 }}>{this.props.t('Rename or copy object')} -</span>
                    <span style={{ fontWeight: 'bold' }}>{this.props.id}</span>
                </DialogTitle>
                <DialogContent>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'end', opacity: 0.7 }}>
                        <TextField
                            fullWidth
                            variant="standard"
                            label={this.props.t('Parent ID')}
                            value={`${this.state.parentId}.`}
                            slotProps={{
                                input: {
                                    readOnly: true,
                                },
                            }}
                        />
                        <Button
                            variant="outlined"
                            style={{ maxWidth: 40, width: 40, height: 32 }}
                            onClick={() => this.setState({ showParentDialog: true })}
                        >
                            ...
                        </Button>
                    </div>
                    <TextField
                        value={this.state.name}
                        onChange={e => {
                            const name = e.target.value
                                .replace(Utils.FORBIDDEN_CHARS, '_')
                                .replace(/\./g, '_')
                                .replace(/\s/g, '_')
                                .replace(/,/g, '_')
                                .replace(/__/g, '_')
                                .replace(/__/g, '_');

                            this.setState({ name }, () => this.checkIfNewExists());
                        }}
                        style={{ marginTop: 20 }}
                        autoFocus
                        variant="standard"
                        fullWidth
                        label={this.props.t('New object ID')}
                    />
                    {this.props.childrenIds.length ? (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={this.state.renameAllChildren}
                                    onChange={() => {
                                        this.setState({ renameAllChildren: !this.state.renameAllChildren });
                                    }}
                                />
                            }
                            label={this.props.t('Rename all children')}
                        />
                    ) : null}
                    <div>
                        <span style={{ opacity: 0.6, marginRight: 8, fontSize: 16 }}>
                            {this.props.t('New object ID')}:
                        </span>
                        <span style={{ fontWeight: 'bold', fontSize: 16 }}>{newID}</span>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={!this.state.name || newID === this.props.id}
                        color="primary"
                        variant="outlined"
                        onClick={async () => {
                            await this.renameCopyObject(
                                this.props.id,
                                newID,
                                this.props.childrenIds.length && this.state.renameAllChildren,
                                true,
                            );
                            this.props.onClose();
                        }}
                    >
                        {this.props.t('Create a copy')}
                    </Button>
                    <Button
                        disabled={!this.state.name || newID === this.props.id}
                        color="primary"
                        variant="contained"
                        onClick={async () => {
                            if (await this.checkHistory()) {
                                await this.renameCopyObject(
                                    this.props.id,
                                    newID,
                                    this.props.childrenIds.length && this.state.renameAllChildren,
                                    false,
                                );
                                this.props.onClose();
                            }
                        }}
                    >
                        {newID !== this.props.id && this.state.newExists
                            ? this.props.t('Replace')
                            : this.props.t('Rename')}
                    </Button>
                    <Button
                        variant="contained"
                        color="grey"
                        onClick={() => this.props.onClose()}
                        startIcon={<Close />}
                    >
                        {this.props.t('ra_Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default ObjectMoveRenameDialog;
