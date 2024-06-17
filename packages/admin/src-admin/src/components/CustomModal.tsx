import React, { useEffect, useState } from 'react';

import {
    Dialog, DialogActions, DialogContent,
    DialogTitle, IconButton, TextField,
    Button, InputAdornment, type Breakpoint,
} from '@mui/material';

import {
    Check as CheckIcon,
    Close as CloseIcon,
    Language as LanguageIcon,
} from '@mui/icons-material';

import { I18n, type IobTheme } from '@iobroker/adapter-react-v5';

import LocalUtils from './Utils';

const styles: Record<string, any> = {
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
    languageButtonActive: (theme: IobTheme) => ({
        color: theme.palette.primary.main,
    }),
};

interface CustomModalProps {
    icon?: React.FC<{ style?: React.CSSProperties }>;
    onClose: () => void;
    children?: React.JSX.Element | React.JSX.Element [];
    title?: string;
    titleButtonClose?: string;
    titleButtonApply?: string;
    onApply?: (value: string | number) => void;
    fullWidth?: boolean;
    maxWidth?: Breakpoint;
    applyButton?: boolean;
    disableApplyIfNotChanged?: boolean;
    overflowHidden?: boolean;
    help?: string;
    noTranslation?: boolean;
    toggleTranslation?: () => void;
    textInput?: boolean;
    defaultValue?: string | number;
    progress?: boolean;
    disableApply?: boolean;
    theme: IobTheme;
}

const CustomModal = ({
    toggleTranslation, noTranslation, title, fullWidth,
    help, maxWidth, progress, icon, disableApplyIfNotChanged, applyButton,
    onClose, children, titleButtonApply, titleButtonClose,
    onApply, textInput, defaultValue, overflowHidden, disableApply,
    theme,
}: CustomModalProps) => {
    const [value, setValue] = useState(defaultValue);
    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    let Icon: React.FC<{ style?: React.CSSProperties }> | null = null;

    if (icon) {
        Icon = icon;
    }

    // todo: replace later LocalUtils with Utils
    const languageButtonActive = LocalUtils.getStyle(theme, styles.languageButtonActive);

    return <Dialog
        open={!0}
        maxWidth={maxWidth || 'md'}
        fullWidth={!!fullWidth}
        disableEscapeKeyDown={false}
        onClose={onClose}
        sx={{ '& .MuiPaper-root': styles.modalDialog /* paper: classes.background */ }}
    >
        {title && <DialogTitle>
            {icon ?
                <Icon style={styles.titleIcon} />
                : null}
            {title}
            {I18n.getLanguage() !== 'en' && toggleTranslation ? <IconButton
                size="large"
                style={{ ...styles.languageButton, ...(noTranslation ? languageButtonActive : undefined) }}
                onClick={() => toggleTranslation()}
                title={I18n.t('Disable/Enable translation')}
            >
                <LanguageIcon />
            </IconButton> : null}
        </DialogTitle>}
        <DialogContent
            style={{ ...styles.overflowHidden, ...styles.content, paddingTop: 8 }}
        >
            {textInput && <TextField
                // className={className}
                autoComplete="off"
                fullWidth
                autoFocus
                variant="standard"
                size="medium"
                // rows={10}
                multiline
                value={value}
                onChange={e => setValue(e.target.value)}
                InputProps={{
                    endAdornment: value ? <InputAdornment position="end">
                        <IconButton
                            size="small"
                            onClick={() => setValue('')}
                        >
                            <CloseIcon />
                        </IconButton>
                    </InputAdornment> : null,
                }}
                // customValue
            />}
            {children}
            {help ? <div>{help}</div> : null}
        </DialogContent>
        <DialogActions>
            {(applyButton === undefined || applyButton) && <Button
                startIcon={<CheckIcon />}
                disabled={disableApply || progress || (disableApplyIfNotChanged && defaultValue === value)}
                onClick={() => onApply && onApply(textInput ? value : '')}
                variant="contained"
                color="primary"
            >
                {I18n.t(titleButtonApply || 'Ok')}
            </Button>}
            <Button
                color="grey"
                onClick={onClose}
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
