import React, { Component, type JSX } from 'react';

import {
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    DialogContentText,
    Button,
    Checkbox,
    FormControlLabel,
    Box,
} from '@mui/material';

import {
    Check as CheckIcon,
    NavigateBefore as PreviousIcon,
    NavigateNext as NextIcon,
    Lightbulb as TipIcon,
} from '@mui/icons-material';

import type { Translate } from '@iobroker/gui-components';

import { TIPS, getTipText } from '@/helpers/tips';

interface TipsDialogProps {
    t: Translate;
    /** Language of the user interface */
    lang: ioBroker.Languages;
    /** Name of the tip that was shown the last time, so the user sees a different one on the next start */
    lastTipId?: string | null;
    /**
     * The dialog was closed.
     *
     * @param dontShowAgain the user does not want to see the dialog at the next start
     * @param lastTipId name of the tip that was open as the dialog was closed
     */
    onClose: (dontShowAgain: boolean, lastTipId: string) => void;
}

interface TipsDialogState {
    index: number;
    dontShowAgain: boolean;
}

/** "Did you know ...?" - shows one tip about the admin, with the possibility to leaf through them */
export default class TipsDialog extends Component<TipsDialogProps, TipsDialogState> {
    constructor(props: TipsDialogProps) {
        super(props);

        // Start with the tip that follows the one of the last visit
        const lastIndex = props.lastTipId ? TIPS.indexOf(props.lastTipId) : -1;

        this.state = {
            index: TIPS.length ? (lastIndex + 1) % TIPS.length : 0,
            dontShowAgain: false,
        };
    }

    /** Show the previous or the next tip. The list is a ring, so the buttons never lead to a dead end */
    move(delta: number): void {
        this.setState({ index: (this.state.index + delta + TIPS.length) % TIPS.length });
    }

    render(): JSX.Element | null {
        const tip: string | undefined = TIPS[this.state.index];
        if (!tip) {
            return null;
        }

        return (
            <Dialog
                open={!0}
                maxWidth="sm"
                fullWidth
                onClose={() => this.props.onClose(this.state.dontShowAgain, tip)}
                aria-labelledby="tips-dialog-title"
            >
                <DialogTitle id="tips-dialog-title">
                    <Box
                        component="span"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                        <TipIcon color="primary" />
                        {this.props.t('Did you know?')}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText
                        id="tips-dialog-text"
                        sx={{ minHeight: 90 }}
                    >
                        {getTipText(tip, this.props.lang)}
                    </DialogContentText>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={this.state.dontShowAgain}
                                onChange={e => this.setState({ dontShowAgain: e.target.checked })}
                            />
                        }
                        label={this.props.t('Do not show these tips at start')}
                    />
                </DialogContent>
                <DialogActions>
                    <Box
                        component="span"
                        sx={{ flexGrow: 1, opacity: 0.7, ml: 1 }}
                    >
                        {`${this.state.index + 1} / ${TIPS.length}`}
                    </Box>
                    <Button
                        id="tips-dialog-previous"
                        variant="outlined"
                        color="grey"
                        disabled={TIPS.length < 2}
                        onClick={() => this.move(-1)}
                        startIcon={<PreviousIcon />}
                    >
                        {this.props.t('Previous')}
                    </Button>
                    <Button
                        id="tips-dialog-next"
                        variant="outlined"
                        color="grey"
                        disabled={TIPS.length < 2}
                        onClick={() => this.move(1)}
                        startIcon={<NextIcon />}
                    >
                        {this.props.t('Next')}
                    </Button>
                    <Button
                        id="tips-dialog-ok"
                        variant="contained"
                        color="primary"
                        autoFocus
                        onClick={() => this.props.onClose(this.state.dontShowAgain, tip)}
                        startIcon={<CheckIcon />}
                    >
                        {this.props.t('Ok')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
