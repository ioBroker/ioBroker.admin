import React from 'react';

import { Dialog, DialogTitle, DialogContent, DialogActions, Grid2, Button } from '@mui/material';

import {
    TextFields as TextFieldsIcon,
    Description as DescriptionIcon,
    LocalOffer as LocalOfferIcon,
    Pageview as PageviewIcon,
    ColorLens as ColorLensIcon,
    Image as ImageIcon,
    Close as CloseIcon,
    Check as CheckIcon,
} from '@mui/icons-material';

import { Utils, IconPicker, type Translate } from '@iobroker/adapter-react-v5';
import { IOTextField, IOColorPicker } from '../IOFields/Fields';
import type { EnumCommon } from './EnumBlock';

const styles: Record<string, React.CSSProperties> = {
    contentRoot: {
        // it is sx
        padding: '16px 24px',
    },
    dialogTitle: {
        borderBottom: '1px solid #00000020',
        padding: 0,
        width: '100%',
    },
    dialogActions: {
        borderTop: '1px solid #00000020',
        width: '100%',
    },
    dialog: {},
    iconPreview: {
        height: 32,
        width: 32,
    },
    colorPicker: {},
    formIcon: {
        margin: 10,
        opacity: 0.6,
    },
    formContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    formControl: {
        display: 'flex',
        padding: '0 0 24px 0',
        flexGrow: 1000,
    },
};

interface EnumEditDialogProps {
    enum: ioBroker.EnumObject;
    enums: ioBroker.EnumObject[];
    isNew: boolean;
    onChange: (newItem: ioBroker.EnumObject) => void;
    saveData: () => Promise<void>;
    onClose: () => void;
    changed: boolean;
    t: Translate;
    lang: ioBroker.Languages;
    getName: (text: ioBroker.StringOrTranslated) => string;
    innerWidth: number;
}

function EnumEditDialog(props: EnumEditDialogProps) {
    const idExists = props.enums.find(enumItem => enumItem._id === props.enum._id);

    let canSave = props.enum._id !== 'system.enum.';

    if (props.isNew && idExists) {
        canSave = false;
    }

    const getShortId = (_id: string) => _id.split('.').pop();

    const name2Id = (name: string) =>
        name
            .replace(Utils.FORBIDDEN_CHARS, '_')
            .replace(/\s/g, '_')
            .replace(/\./g, '_')
            .replace(/,/g, '_')
            .replace(/__/g, '_')
            .replace(/__/g, '_');

    const getText = (text: ioBroker.StringOrTranslated): string =>
        text && typeof text === 'object' ? text[props.lang] || text.en : (text as string) || '';

    const changeShortId = (_id: string, short: string) => {
        const idArray = _id.split('.');
        idArray[idArray.length - 1] = short;
        return idArray.join('.');
    };

    return (
        <Dialog
            fullWidth={props.innerWidth < 500}
            open={!0}
            onClose={(_event, reason) => {
                if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                    props.onClose();
                }
            }}
        >
            <DialogTitle style={{ ...styles.dialogTitle, padding: 12 }}>{props.t('Enum parameters')}</DialogTitle>
            <DialogContent sx={{ '&.MuiDialogContent-root': styles.contentRoot }}>
                <Grid2
                    container
                    spacing={2}
                    style={styles.dialog}
                >
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <IOTextField
                            label="Name"
                            t={props.t}
                            value={props.getName(props.enum.common.name)}
                            onChange={(value: string) => {
                                const newData = props.enum;
                                if (
                                    !props.enum.common.dontDelete &&
                                    name2Id(props.getName(newData.common.name)) === getShortId(newData._id)
                                ) {
                                    newData._id = changeShortId(newData._id, name2Id(value));
                                }
                                newData.common.name = value;
                                props.onChange(newData);
                            }}
                            autoComplete="off"
                            icon={TextFieldsIcon}
                            styles={styles}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <IOTextField
                            label="ID edit"
                            t={props.t}
                            disabled={props.enum.common.dontDelete}
                            value={props.enum._id.split('.')[props.enum._id.split('.').length - 1]}
                            onChange={(value: string) => {
                                const newData = JSON.parse(JSON.stringify(props.enum));
                                newData._id = changeShortId(newData._id, name2Id(value));
                                props.onChange(newData);
                            }}
                            icon={LocalOfferIcon}
                            styles={styles}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <IOTextField
                            label="ID preview"
                            t={props.t}
                            disabled
                            value={props.enum._id}
                            icon={PageviewIcon}
                            styles={styles}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <IOTextField
                            label="Description"
                            t={props.t}
                            value={getText((props.enum.common as EnumCommon).desc)}
                            onChange={(value: string) => {
                                const newData = props.enum;
                                (newData.common as EnumCommon).desc = value;
                                props.onChange(newData);
                            }}
                            icon={DescriptionIcon}
                            styles={styles}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <IconPicker
                            label="Icon"
                            onlyDevices={props.enum._id.startsWith('enum.functions.')}
                            onlyRooms={props.enum._id.startsWith('enum.rooms.')}
                            value={props.enum.common.icon}
                            onChange={(fileBlob: string) => {
                                const newData = props.enum;
                                newData.common.icon = fileBlob;
                                props.onChange(newData);
                            }}
                            previewStyle={styles.iconPreview}
                            icon={ImageIcon}
                            customStyles={styles}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <IOColorPicker
                            label="Color"
                            value={props.enum.common.color}
                            previewStyle={styles.iconPreview}
                            onChange={(color: string) => {
                                const newData = props.enum;
                                newData.common.color = color;
                                props.onChange(newData);
                            }}
                            icon={ColorLensIcon}
                            style={styles.colorPicker}
                            styles={styles}
                            t={props.t}
                        />
                    </Grid2>
                </Grid2>
            </DialogContent>
            <DialogActions style={styles.dialogActions}>
                <Button
                    variant="contained"
                    color="primary"
                    autoFocus
                    onClick={() => props.saveData()}
                    disabled={!canSave || !props.changed}
                    startIcon={<CheckIcon />}
                >
                    {props.t('Save')}
                </Button>
                <Button
                    variant="contained"
                    color="grey"
                    onClick={props.onClose}
                    startIcon={<CloseIcon />}
                >
                    {props.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default EnumEditDialog;
