import React, { type JSX } from 'react';

import { Button, DialogTitle, DialogContent, DialogActions, Dialog } from '@mui/material';

import { Check as IconOk, Cancel as IconCancel, Delete as IconClear } from '@mui/icons-material';

import { ComplexCron } from '../Components/ComplexCron';
import { DialogConfirm } from '../Dialogs/Confirm';

import { I18n } from '../i18n';

// Generate cron expression
const styles: Record<string, React.CSSProperties> = {
    headerID: {
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    radio: {
        display: 'inline-block',
    },
    dialogPaper: {
        height: 'calc(100% - 96px)',
    },
};

interface DialogCronProps {
    onClose: () => void;
    onOk: (cron: string | false) => void;
    title?: string;
    cron?: string;
    cancel?: string;
    ok?: string;
    clear?: string;
    clearButton?: boolean;
}

interface DialogCronState {
    cron: string;
    showWarning: '' | 'everySecond' | 'everyMinute';
}

export class DialogComplexCron extends React.Component<DialogCronProps, DialogCronState> {
    constructor(props: DialogCronProps) {
        super(props);
        let cron;
        if (this.props.cron && typeof this.props.cron === 'string' && this.props.cron.replace(/^["']/, '')[0] !== '{') {
            cron = this.props.cron.replace(/['"]/g, '').trim();
        } else {
            cron = this.props.cron || '{}';
            if (typeof cron === 'string') {
                cron = cron.replace(/^["']/, '').replace(/["']\n?$/, '');
            }
        }

        this.state = {
            showWarning: '',
            cron,
        };
    }

    handleCancel(): void {
        this.props.onClose();
    }

    handleOk(ignoreCheck?: boolean): void {
        if (!ignoreCheck) {
            // Check if the CRON will be executed every second or every minute and warn about it
            const cron = ComplexCron.cron2state(this.state.cron);
            if (cron.seconds === '*' || cron.seconds === '*/1') {
                this.setState({ showWarning: 'everySecond' });
                return;
            }
            if (cron.minutes === '*' || cron.minutes === '*/1') {
                this.setState({ showWarning: 'everyMinute' });
                return;
            }
        }

        this.props.onOk(this.state.cron);
        this.props.onClose();
    }

    renderWarningDialog(): JSX.Element | null {
        if (!this.state.showWarning) {
            return null;
        }
        return (
            <DialogConfirm
                title={I18n.t('ra_Please confirm')}
                text={I18n.t(
                    this.state.showWarning === 'everySecond'
                        ? 'ra_The schedule will be executed every second. Are you sure?'
                        : 'ra_The schedule will be executed every minute. Are you sure?',
                )}
                onClose={(ok: boolean) =>
                    this.setState({ showWarning: '' }, () => {
                        if (ok) {
                            this.handleOk(true);
                        }
                    })
                }
            />
        );
    }

    handleClear(): void {
        this.props.onOk(false);
        this.props.onClose();
    }

    render(): JSX.Element {
        return (
            <Dialog
                onClose={() => {}}
                maxWidth="md"
                fullWidth
                sx={{ '& .MuiDialog-paper': styles.dialogPaper }}
                open={!0}
                aria-labelledby="cron-dialog-title"
            >
                {this.renderWarningDialog()}
                <DialogTitle id="cron-dialog-title">{this.props.title || I18n.t('ra_Define schedule...')}</DialogTitle>
                <DialogContent style={{ height: '100%', overflow: 'hidden' }}>
                    <ComplexCron
                        cronExpression={this.state.cron}
                        onChange={cron => this.setState({ cron })}
                        language={I18n.getLanguage()}
                    />
                </DialogContent>
                <DialogActions>
                    {!!this.props.clearButton && (
                        <Button
                            color="grey"
                            variant="contained"
                            onClick={() => this.handleClear()}
                            startIcon={<IconClear />}
                        >
                            {this.props.clear || I18n.t('ra_Clear')}
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        onClick={() => this.handleOk()}
                        color="primary"
                        startIcon={<IconOk />}
                    >
                        {this.props.ok || I18n.t('ra_Ok')}
                    </Button>
                    <Button
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
