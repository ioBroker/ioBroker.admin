import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import BuildIcon from '@mui/icons-material/Build';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';

import I18n from '@iobroker/adapter-react-v5/i18n';
import { DialogTitle, IconButton, Typography } from '@mui/material';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

import ExpertIcon from '@iobroker/adapter-react-v5/icons/IconExpert';
import CheckIcon from '@mui/icons-material/Check';

let node = null;

const useStyles = makeStyles(theme => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
        borderRadius: 4,
        fontSize: 16,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
    },
    paper: {
        maxWidth: 800,
    },
    overflowHidden: {
        display: 'flex',
    },
    pre: {
        overflow: 'auto',
        margin: 20,
    },
    text: {
        fontSize: 16
    },
    textBold: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    width100: {
        width: '100%'
    }
}));

const ExpertModeDialog = ({ boolSettings, func, buttonIcon }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);
    const [doNotShow, setDoNotShow] = useState(false);

    const onClose = () => {
        if (doNotShow) {
            (window._sessionStorage || window.sessionStorage).setItem('App.doNotShowExpertDialog', 'true');
        }

        setOpen(false);
        func();
        try {
            node && window.document.body.removeChild(node);
        } catch (e) {
            // ignore
        }

        node = null;
    };

    return <Dialog
            onClose={onClose}
            open={open}
            classes={{ paper: classes.paper }}
        >
            <DialogTitle>
                <ExpertIcon style={{ marginRight: 8 }} />
                {I18n.t('Expert mode')}
            </DialogTitle>
            <DialogContent className={classes.overflowHidden} dividers>
                <Grid container>
                    <Grid item className={classes.width100}>
                        <div className={classes.root}>
                            <div className={classes.pre}>
                                <Typography
                                    className={classes.text}
                                    variant="body2"
                                    component="p">
                                    {boolSettings ? I18n.t('Now the expert mode will be deactivated only during this browser session.') : I18n.t('Now the expert mode will be active only during this browser session.')}
                                </Typography>
                                {!boolSettings ? <Typography
                                    className={classes.textBold}
                                    variant="body2"
                                    component="p">
                                    {I18n.t('The expert mode allows you to view and edit system internal details.')}
                                </Typography> : null}
                                {!boolSettings ? <Typography
                                    className={classes.textBold}
                                    variant="body2"
                                    component="p">
                                    {I18n.t('Please make sure you know what you are doing!')}
                                </Typography> : null}
                                <Typography
                                    className={classes.text}
                                    variant="body2"
                                    component="p">
                                    {I18n.t('If you need to save the mode all the time, you can do this in the system settings.')}
                                </Typography>
                                {I18n.t('Use this button:')}
                                <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => {
                                        onClose();
                                        buttonIcon();
                                    }}>
                                    <BuildIcon />
                                </IconButton>
                            </div>
                        </div>
                    </Grid>
                    <Grid item>
                        <FormControlLabel
                            control={<Checkbox checked={doNotShow} onChange={e => setDoNotShow(e.target.checked)} />}
                            label={I18n.t('Do not show this dialog in this browser session any more')}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    autoFocus
                    onClick={onClose}
                    color="primary"
                    startIcon={<CheckIcon />}
                >
                    {I18n.t('Ok')}
                </Button>
            </DialogActions>
        </Dialog>;
}

export const expertModeDialogFunc = (boolSettings, themeType, theme, func, buttonIcon) => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderModal';
        document.body.appendChild(node);
    }
    const root = createRoot(node);
    console.log('Create expert')

    return root.render(<StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
            <ExpertModeDialog
                themeType={themeType}
                buttonIcon={buttonIcon}
                boolSettings={boolSettings}
                func={func}
            />
        </ThemeProvider>
    </StyledEngineProvider>);
}