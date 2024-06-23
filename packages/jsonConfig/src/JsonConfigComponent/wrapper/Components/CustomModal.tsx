import React, { useEffect, useState } from 'react';

import {
    Dialog, DialogActions, DialogContent,
    DialogTitle, IconButton, TextField, Button,
} from '@mui/material';

import {
    Check as CheckIcon,
    Close as CloseIcon,
    Language as LanguageIcon,
} from '@mui/icons-material';

import { I18n } from '@iobroker/adapter-react-v5';

const styles: Record<string, React.CSSProperties> = {
    modalDialog: {
        minWidth: 400,
        maxWidth: 800,
    },
    overflowHidden: {
        display: 'flex',
        overflow: 'hidden',
    },
    titleIcon: {
        marginRight: 5,
    },
    content: {
        fontSize: 16,
    },
    languageButton: {
        position: 'absolute',
        right: 8,
        top: 8,
    },
    languageButtonActive: {
        color: 'primary.main',
    },
};

interface CustomModalProps {
    toggleTranslation?: () => void;
    noTranslation?: boolean;
    title: string;
    fullWidth?: boolean;
    help?: string;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
    progress?: boolean;
    icon?: any;
    applyDisabled?: boolean;
    applyButton?: boolean;
    onClose: () => void;
    children: React.JSX.Element | React.JSX.Element[] | string | string[] | undefined | null;
    titleButtonApply?: string;
    titleButtonClose?: string;
    onApply: (value: string) => void;
    textInput?: boolean;
    defaultValue?: string;
    overflowHidden?: boolean;
}

const CustomModal = ({
    toggleTranslation, noTranslation, title, fullWidth, help, maxWidth, progress, icon, applyDisabled, applyButton, onClose, children, titleButtonApply, titleButtonClose, onApply, textInput, defaultValue, overflowHidden,
}: CustomModalProps) => {
    const [value, setValue] = useState(defaultValue);
    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    let Icon = null;

    if (icon) {
        Icon = icon;
    }

    return <Dialog
        open={!0}
        maxWidth={maxWidth || 'md'}
        fullWidth={!!fullWidth}
        disableEscapeKeyDown={false}
        onClose={onClose}
        sx={{ '& .MuiPaper-root': styles.modalDialog /* paper: classes.background */ }}
    >
        {title && <DialogTitle>
            {icon ? <Icon style={styles.titleIcon} /> : null}
            {title}
            {I18n.getLanguage() !== 'en' && toggleTranslation ? <IconButton
                size="large"
                style={{ ...styles.languageButton, ...(noTranslation ? styles.languageButtonActive : {}) }}
                onClick={() => toggleTranslation()}
                title={I18n.t('Disable/Enable translation')}
            >
                <LanguageIcon />
            </IconButton> : null}
        </DialogTitle>}
        <DialogContent sx={{ ...(overflowHidden ? styles.overflowHidden : {}), ...styles.content }} style={{ paddingTop: 8 }}>
            {textInput && <TextField
                // className={className}
                autoComplete="off"
                fullWidth
                autoFocus
                variant="outlined"
                size="medium"
                // rows={10}
                multiline
                value={value}
                onChange={e => setValue(e.target.value)}
                // customValue
            />}
            {children}
            {help ? <div>{help}</div> : null}
        </DialogContent>
        <DialogActions>
            {applyButton !== false && <Button
                startIcon={<CheckIcon />}
                disabled={progress || (applyDisabled && defaultValue === value)}
                onClick={() => onApply && onApply(textInput ? value : '')}
                variant="contained"
                color="primary"
            >
                {I18n.t(titleButtonApply || 'Ok')}
            </Button>}
            <Button
                color="grey"
                onClick={() => onClose && onClose()}
                disabled={progress}
                variant="contained"
                startIcon={<CloseIcon />}
            >
                {I18n.t(titleButtonClose || 'Cancel')}
            </Button>
        </DialogActions>
    </Dialog>;
};

export default CustomModal;
