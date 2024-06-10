import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {type Styles, withStyles} from '@mui/styles';

import {
    Dialog, DialogActions, DialogContent,
    DialogTitle, IconButton, TextField, Button,
} from '@mui/material';

import {
    Check as CheckIcon,
    Close as CloseIcon,
    Language as LanguageIcon,
} from '@mui/icons-material';

import { Utils, I18n, type IobTheme } from '@iobroker/adapter-react-v5';

const styles: Styles<IobTheme, any> = theme => ({
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
        right: theme.spacing(1),
        top: theme.spacing(1),
    },
    languageButtonActive: {
        color: theme.palette.primary.main,
    },
});

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
    classes: Record<string, string>;
    onClose: () => void;
    children: any;
    titleButtonApply: string;
    titleButtonClose: string;
    onApply: (value: string) => void;
    textInput?: boolean;
    defaultValue: string;
    overflowHidden?: boolean;
}

const CustomModal = ({
    toggleTranslation, noTranslation, title, fullWidth, help, maxWidth, progress, icon, applyDisabled, applyButton, classes, onClose, children, titleButtonApply, titleButtonClose, onApply, textInput, defaultValue, overflowHidden,
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
            {icon ? <Icon className={classes.titleIcon} /> : null}
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
        <DialogContent className={Utils.clsx(overflowHidden ? classes.overflowHidden : null, classes.content)} style={{ paddingTop: 8 }}>
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
            {applyButton && <Button
                startIcon={<CheckIcon />}
                disabled={progress || (applyDisabled && defaultValue === value)}
                onClick={() => onApply(textInput ? value : '')}
                variant="contained"
                color="primary"
            >
                {I18n.t(titleButtonApply)}
            </Button>}
            <Button
                color="grey"
                onClick={onClose}
                disabled={progress}
                variant="contained"
                startIcon={<CloseIcon />}
            >
                {I18n.t(titleButtonClose)}
            </Button>
        </DialogActions>
    </Dialog>;
};

CustomModal.defaultProps = {
    onApply: () => { },
    onClose: () => { },
    applyButton: true,
    applyDisabled: false,
    titleButtonClose: 'Cancel',
    titleButtonApply: 'Ok',
    overflowHidden: false,
    help: '',
};

CustomModal.propTypes = {
    icon: PropTypes.object,
    onClose: PropTypes.func,
    children: PropTypes.any,
    titleButtonClose: PropTypes.string,
    titleButtonApply: PropTypes.string,
    onApply: PropTypes.func,
    fullWidth: PropTypes.bool,
    maxWidth: PropTypes.string,
    applyButton: PropTypes.bool,
    applyDisabled: PropTypes.bool,
    overflowHidden: PropTypes.bool,
    help: PropTypes.string,
    noTranslation: PropTypes.bool,
    toggleTranslation: PropTypes.func,
};

export default withStyles(styles)(CustomModal);
