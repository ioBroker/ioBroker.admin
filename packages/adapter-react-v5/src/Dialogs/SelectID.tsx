/**
 * Copyright 2018-2023 Denis Haev (bluefox) <dogafox@gmail.com>
 *
 * MIT License
 *
 */
import React, { Component, type JSX } from 'react';

import { Button, DialogTitle, DialogContent, DialogActions, Dialog } from '@mui/material';

import { Cancel as IconCancel, Check as IconOk } from '@mui/icons-material';

import type { Connection } from '../Connection';

import { I18n } from '../i18n';
import {
    ObjectBrowser,
    type ObjectBrowserFilter,
    type ObjectBrowserColumn,
    type ObjectBrowserCustomFilter,
} from '../Components/ObjectBrowser';
import type { IobTheme } from '../types';

export interface SelectIDFilters {
    id?: string;
    name?: string;
    room?: string;
    func?: string;
    role?: string;
    type?: string;
    custom?: string;
}

interface DialogSelectIDProps {
    /** The internal name of the dialog; default: "default". Used to store settings in local storage */
    dialogName?: string;
    /** The dialog title; default: Please select object ID... (translated) */
    title?: string;
    /** Set to true to allow the selection of multiple IDs. */
    multiSelect?: boolean;
    /** Show folders before any leaves. */
    foldersFirst?: boolean;
    /** Path prefix for images (default: '.') */
    imagePrefix?: string;
    /** @deprecated same as imagePrefix */
    prefix?: string;
    /** Show the expert button */
    showExpertButton?: boolean;
    /** Force expert mode */
    expertMode?: boolean;
    /** optional ['name', 'type', 'role', 'room', 'func', 'val', 'buttons'] */
    columns?: ObjectBrowserColumn[];
    /**  Object types to show; default: 'state' only */
    types?: ioBroker.ObjectType | ioBroker.ObjectType[];
    /** The language. */
    lang?: ioBroker.Languages;
    /** The socket connection. */
    socket: Connection;
    /** Can't objects be edited? (default: true) */
    notEditable?: boolean;
    /** Theme name. */
    themeName?: string;
    /** Theme type: dark or light */
    themeType?: string;
    /** The theme object */
    theme: IobTheme;
    /** The date format for the date columns */
    dateFormat?: string;
    /** Is use comma or point for displaying of float numbers */
    isFloatComma?: boolean;
    /** Custom filter. */
    customFilter?: ObjectBrowserCustomFilter;
    /** The selected IDs. */
    selected?: string | string[];
    /** The ok button text; default: OK (translated) */
    ok?: string;
    /** The cancel button text; default: Cancel (translated) */
    cancel?: string;
    /** Close handler that is always called when the dialog is closed. */
    onClose: () => void;
    /** Handler that is called when the user presses OK. */
    onOk: (selected: string | string[] | undefined, name: string | null) => void;
    /**
     * Function to filter out all unnecessary objects. Can be string or function.
     * It cannot be used together with "types".
     * Example for function: `obj => obj.common?.type === 'boolean'` to show only boolean states
     * In case of string, it must look like `obj.common && obj.common.type === 'boolean'`
     */
    filterFunc?: string | ((obj: ioBroker.Object) => boolean);
    /** predefined filter fields, like {"id":"","name":"","room":"","func":"","role":"level","type":"","custom":""} */
    filters?: SelectIDFilters;
    /** Show elements only of this root ID */
    root?: string;
    /** Allow selection of non-objects (virtual branches) */
    allowNonObjects?: boolean;
    /** Will be called by selection, so the decision could be done if the OK button is available or not */
    onSelectConfirm?: (
        selected: string | string[],
        objects: Record<string, ioBroker.Object | null | undefined>,
    ) => Promise<boolean>;
}

interface DialogSelectIDState {
    selected: string[];
    name: string | null;
    selectionBlocked: boolean;
}

export class DialogSelectID extends Component<DialogSelectIDProps, DialogSelectIDState> {
    private readonly dialogName: string;

    private filters: ObjectBrowserFilter;

    private readonly filterFunc?: (obj: ioBroker.Object) => boolean;

    constructor(props: DialogSelectIDProps) {
        super(props);
        this.dialogName = this.props.dialogName || 'default';
        this.dialogName = `SelectID.${this.dialogName}`;

        const filters: string = ((window as any)._localStorage || window.localStorage).getItem(this.dialogName) || '{}';

        try {
            this.filters = JSON.parse(filters);
        } catch {
            this.filters = {};
        }

        if (props.filters) {
            this.filters = { ...this.filters, ...(props.filters || {}) };
        }

        let selected = this.props.selected || [];
        if (!Array.isArray(selected)) {
            selected = [selected];
        }
        selected = selected.filter(id => id);

        if (props.filterFunc) {
            if (typeof props.filterFunc === 'string') {
                try {
                    this.filterFunc = new Function('obj', props.filterFunc) as (obj: ioBroker.Object) => boolean;
                } catch {
                    console.error(`Cannot parse filter function: "obj => ${props.filterFunc}"`);
                    this.filterFunc = undefined;
                }
            } else {
                this.filterFunc = props.filterFunc;
            }
        }

        this.state = {
            selected,
            name: '',
            selectionBlocked: false,
        };
    }

    handleCancel(): void {
        this.props.onClose();
    }

    handleOk(): void {
        this.props.onOk(this.props.multiSelect ? this.state.selected : this.state.selected[0] || '', this.state.name);
        this.props.onClose();
    }

    render(): JSX.Element {
        let title;
        if (this.state.name || this.state.selected.length) {
            if (this.state.selected.length === 1) {
                title = [
                    <span key="selected">
                        {I18n.t('ra_Selected')}
                        &nbsp;
                    </span>,
                    <span
                        key="id"
                        style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                    >
                        {(this.state.name || this.state.selected[0]) +
                            (this.state.name ? ` [${this.state.selected[0]}]` : '')}
                    </span>,
                ];
            } else {
                title = [
                    <span key="selected">
                        {I18n.t('ra_Selected')}
                        &nbsp;
                    </span>,
                    <span
                        key="id"
                        style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                    >
                        {I18n.t('%s items', this.state.selected.length.toString())}
                    </span>,
                ];
            }
        } else {
            title = this.props.title || I18n.t('ra_Please select object ID...');
        }

        return (
            <Dialog
                onClose={() => {}}
                maxWidth={false}
                sx={{
                    '& .MuiDialog-paper': {
                        height: '95%',
                        p: '4px',
                        width: '100%',
                        maxWidth: '100%',
                        maxHeight: 'calc(100% - 16px)',
                    },
                }}
                fullWidth
                open={!0}
                aria-labelledby="ar_dialog_selectid_title"
            >
                <DialogTitle
                    id="ar_dialog_selectid_title"
                    style={{
                        whiteSpace: 'nowrap',
                        width: 'calc(100% - 72px)',
                        overflow: 'hidden',
                        display: 'inline-block',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {title}
                </DialogTitle>
                <DialogContent
                    style={{
                        height: '100%',
                        overflow: 'hidden',
                        padding: '8px 4px',
                    }}
                >
                    <ObjectBrowser
                        foldersFirst={this.props.foldersFirst}
                        imagePrefix={this.props.imagePrefix || this.props.prefix} // prefix is for back compatibility
                        dateFormat={this.props.dateFormat}
                        defaultFilters={this.filters}
                        dialogName={this.dialogName}
                        isFloatComma={this.props.isFloatComma}
                        showExpertButton={
                            this.props.showExpertButton !== undefined ? this.props.showExpertButton : true
                        }
                        expertMode={this.props.expertMode}
                        // style={{ width: '100%', height: '100%' }}
                        columns={this.props.columns || ['name', 'type', 'role', 'room', 'func', 'val']}
                        types={
                            this.props.types
                                ? Array.isArray(this.props.types)
                                    ? this.props.types
                                    : [this.props.types]
                                : ['state']
                        }
                        root={this.props.root}
                        t={I18n.t}
                        lang={this.props.lang || I18n.getLanguage()}
                        socket={this.props.socket}
                        selected={this.state.selected}
                        multiSelect={this.props.multiSelect}
                        notEditable={this.props.notEditable === undefined ? true : this.props.notEditable}
                        // name={this.state.name}
                        themeName={this.props.themeName}
                        themeType={this.props.themeType}
                        theme={this.props.theme}
                        customFilter={this.props.customFilter}
                        allowNonObjects={this.props.allowNonObjects}
                        onFilterChanged={(filterConfig: ObjectBrowserFilter) => {
                            this.filters = filterConfig;
                            ((window as any)._localStorage || window.localStorage).setItem(
                                this.dialogName,
                                JSON.stringify(filterConfig),
                            );
                        }}
                        onSelect={async (
                            _selected: string | string[],
                            name: string | null,
                            isDouble?: boolean,
                        ): Promise<void> => {
                            let selected: string[];
                            if (!Array.isArray(_selected)) {
                                selected = [_selected];
                            } else {
                                selected = _selected;
                            }

                            if (JSON.stringify(selected) !== JSON.stringify(this.state.selected)) {
                                let selectionAllowed = true;
                                if (this.props.onSelectConfirm) {
                                    const objects: Record<string, ioBroker.Object | null | undefined> = {};
                                    for (const id of selected) {
                                        try {
                                            objects[id] = await this.props.socket.getObject(id);
                                        } catch {
                                            // ignore
                                        }
                                    }

                                    selectionAllowed = await this.props.onSelectConfirm(selected, objects);
                                }

                                this.setState(
                                    { selected, name, selectionBlocked: !selectionAllowed },
                                    () => isDouble && this.handleOk(),
                                );
                            } else if (isDouble) {
                                this.handleOk();
                            }
                        }}
                        filterFunc={this.filterFunc}
                        title=""
                        classes={{}}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        id={`ar_dialog_selectid_ok_${this.props.dialogName || ''}`}
                        variant="contained"
                        onClick={() => this.handleOk()}
                        startIcon={<IconOk />}
                        disabled={!this.state.selected.length || this.state.selectionBlocked}
                        color="primary"
                    >
                        {this.props.ok || I18n.t('ra_Ok')}
                    </Button>
                    <Button
                        id={`ar_dialog_selectid_cancel_${this.props.dialogName || ''}`}
                        color="grey"
                        variant="contained"
                        onClick={() => this.handleCancel()}
                        startIcon={<IconCancel />}
                    >
                        {this.props.cancel || I18n.t('ra_Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
