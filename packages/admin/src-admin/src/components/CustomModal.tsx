import React, { type Component, useEffect, useState } from 'react';
import { withStyles } from '@mui/styles';

import {
    Dialog, DialogActions, DialogContent,
    DialogTitle, IconButton, TextField, Button, InputAdornment, type Breakpoint,
} from '@mui/material';

import {
    Check as CheckIcon,
    Close as CloseIcon,
    Language as LanguageIcon,
} from '@mui/icons-material';

import { Utils, I18n, type IobTheme } from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = (theme: IobTheme) => ({
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
        top: theme.spacing(1),
    },
    languageButtonActive: {
        color: theme.palette.primary.main,
    },
});

interface CustomModalProps {
    icon?: Component;
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
    classes: Record<string, string>;
    textInput?: boolean;
    defaultValue?: string | number;
    progress?: boolean;
    disableApply?: boolean;
}

const CustomModal = ({
    toggleTranslation, noTranslation, title, fullWidth,
    help, maxWidth, progress, icon, disableApplyIfNotChanged, applyButton,
    classes, onClose, children, titleButtonApply, titleButtonClose,
    onApply, textInput, defaultValue, overflowHidden, disableApply,
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
        classes={{ paper: classes.modalDialog /* paper: classes.background */ }}
    >
        {title && <DialogTitle>
            {icon ?
                // @ts-expect-error How to solve it?
                <Icon className={classes.titleIcon} />
                : null}
            {title}
            {I18n.getLanguage() !== 'en' && toggleTranslation ? <IconButton
                size="large"
                className={Utils.clsx(classes.languageButton, noTranslation && classes.languageButtonActive)}
                onClick={() => toggleTranslation()}
                title={I18n.t('Disable/Enable translation')}
            >
                <LanguageIcon />
            </IconButton> : null}
        </DialogTitle>}
        <DialogContent
            className={Utils.clsx(overflowHidden ? classes.overflowHidden : null, classes.content)}
            style={{ paddingTop: 8 }}
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

export default withStyles(styles)(CustomModal);
