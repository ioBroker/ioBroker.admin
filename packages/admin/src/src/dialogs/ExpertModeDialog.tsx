import React, { useState } from 'react';
import { makeStyles } from '@mui/styles';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    FormControlLabel,
    Checkbox,
    Grid,
    DialogTitle, IconButton, Typography,
} from '@mui/material';
import {
    Build as BuildIcon,
    Check as CheckIcon,
} from '@mui/icons-material';

import { I18n, IconExpert } from '@iobroker/adapter-react-v5';
import type { Theme } from '@iobroker/adapter-react-v5/types';

const useStyles = makeStyles<Theme>(theme => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
        borderRadius: 4,
        fontSize: 16,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
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
        fontSize: 16,
    },
    textBold: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    width100: {
        width: '100%',
    },
}));

interface ExpertModeDialogProps {
    expertMode: boolean;
    onClose: (result?: string | boolean) => void;
}

const ExpertModeDialog: React.FC<ExpertModeDialogProps> = ({ expertMode, onClose }) => {
    const classes = useStyles();
    const [doNotShow, setDoNotShow] = useState(false);

    return <Dialog
        onClose={() => onClose()}
        open={!0}
        classes={{ paper: classes.paper }}
    >
        <DialogTitle>
            <IconExpert style={{ marginRight: 8 }} />
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
                                component="p"
                            >
                                {expertMode ? I18n.t('Now the expert mode will be deactivated only during this browser session.') : I18n.t('Now the expert mode will be active only during this browser session.')}
                            </Typography>
                            {!expertMode ? <Typography
                                className={classes.textBold}
                                variant="body2"
                                component="p"
                            >
                                {I18n.t('The expert mode allows you to view and edit system internal details.')}
                            </Typography> : null}
                            {!expertMode ? <Typography
                                className={classes.textBold}
                                variant="body2"
                                component="p"
                            >
                                {I18n.t('Please make sure you know what you are doing!')}
                            </Typography> : null}
                            <Typography
                                className={classes.text}
                                variant="body2"
                                component="p"
                            >
                                {I18n.t('If you need to save the mode all the time, you can do this in the system settings.')}
                            </Typography>
                            {I18n.t('Use this button:')}
                            <IconButton
                                color="primary"
                                size="small"
                                onClick={() => onClose('openSettings')}
                            >
                                <BuildIcon />
                            </IconButton>
                        </div>
                    </div>
                </Grid>
                <Grid item>
                    <FormControlLabel
                        control={<Checkbox
                            checked={doNotShow}
                            onChange={e => setDoNotShow(e.target.checked)}
                        />}
                        label={I18n.t('Do not show this dialog in this browser session any more')}
                    />
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                autoFocus
                onClick={() => {
                    if (doNotShow) {
                        (window._sessionStorage || window.sessionStorage).setItem('App.doNotShowExpertDialog', 'true');
                    }
                    onClose(true);
                }}
                color="primary"
                startIcon={<CheckIcon />}
            >
                {I18n.t('Ok')}
            </Button>
        </DialogActions>
    </Dialog>;
};

export default ExpertModeDialog;
