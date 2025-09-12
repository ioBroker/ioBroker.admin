import React, { useEffect, useState } from 'react';

import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Button, useMediaQuery, useTheme } from '@mui/material';

import { Check as CheckIcon, Close as CloseIcon, Language as LanguageIcon } from '@mui/icons-material';

import { I18n } from '../i18n';
import type { IobTheme } from '../types';
import { Utils } from './Utils';

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
    icon?: any;
    open: boolean;
    onClose: () => void;
    children: React.JSX.Element | null;
    titleButtonClose?: string;
    titleButtonApply?: string;
    onApply: (result: string) => void;
    fullWidth?: boolean;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    applyButton?: boolean;
    applyDisabled?: boolean;
    overflowHidden?: boolean;
    help?: string;
    noTranslation?: boolean;
    toggleTranslation?: () => void;
    title?: string;
    progress?: boolean;
    textInput?: boolean;
    defaultValue?: string;
    theme: IobTheme;
}

export function CustomModal(props: CustomModalProps): React.JSX.Element {
    const {
        open,
        toggleTranslation,
        noTranslation,
        title,
        fullWidth,
        help,
        maxWidth,
        progress,
        icon,
        applyDisabled,
        applyButton,
        onClose,
        children,
        titleButtonApply,
        titleButtonClose,
        onApply,
        textInput,
        defaultValue,
        overflowHidden,
    } = props;

    const [value, setValue] = useState<string>(defaultValue || '');

    useEffect(() => {
        setValue(defaultValue || '');
    }, [defaultValue]);

    const muiTheme = useTheme();
    const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down('md'));

    let Icon = null;

    if (icon) {
        Icon = icon;
    }

    return (
        <Dialog
            open={open}
            maxWidth={isSmallScreen ? false : maxWidth || 'md'}
            fullWidth={!!fullWidth}
            fullScreen={isSmallScreen}
            disableEscapeKeyDown={false}
            onClose={onClose}
            sx={{ '& .MuiDialog-paper': isSmallScreen ? {} : styles.modalDialog }}
        >
            {title && (
                <DialogTitle>
                    {icon ? <Icon style={styles.titleIcon} /> : null}
                    {title}
                    {I18n.getLanguage() !== 'en' && toggleTranslation ? (
                        <IconButton
                            size="large"
                            sx={Utils.getStyle(
                                props.theme,
                                styles.languageButton,
                                noTranslation && styles.languageButtonActive,
                            )}
                            onClick={() => toggleTranslation()}
                            title={I18n.t('Disable/Enable translation')}
                        >
                            <LanguageIcon />
                        </IconButton>
                    ) : null}
                </DialogTitle>
            )}
            <DialogContent
                style={{ ...styles.content, ...(overflowHidden ? styles.overflowHidden : undefined), paddingTop: 8 }}
            >
                {textInput && (
                    <TextField
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
                    />
                )}
                {children}
                {help ? <div>{help}</div> : null}
            </DialogContent>
            <DialogActions>
                {applyButton !== false && (
                    <Button
                        startIcon={<CheckIcon />}
                        disabled={progress || (applyDisabled && defaultValue === value)}
                        onClick={() => onApply(textInput ? value : '')}
                        variant="contained"
                        color="primary"
                    >
                        {I18n.t(titleButtonApply || 'ra_Ok')}
                    </Button>
                )}
                <Button
                    color="grey"
                    onClick={onClose}
                    disabled={progress}
                    variant="contained"
                    startIcon={<CloseIcon />}
                >
                    {I18n.t(titleButtonClose || 'ra_Cancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
