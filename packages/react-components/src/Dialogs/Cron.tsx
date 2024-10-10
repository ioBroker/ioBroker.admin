import React, { type JSX } from 'react';

import { Button, DialogTitle, DialogContent, DialogActions, Dialog, Radio } from '@mui/material';

import { Check as IconOk, Cancel as IconCancel } from '@mui/icons-material';

import { ComplexCron } from '../Components/ComplexCron';
import { SimpleCron, cron2state } from '../Components/SimpleCron';
import { Schedule } from '../Components/Schedule';

import { I18n } from '../i18n';
import type { IobTheme } from '../types';

// Generate cron expression

const styles: Record<string, React.CSSProperties> = {
    dialogPaper: {
        height: 'calc(100% - 96px)',
    },
};

interface DialogCronProps {
    onClose: () => void;
    onOk: (cron: string) => void;
    title?: string;
    cron?: string;
    cancel?: string;
    ok?: string;
    /** show only simple configuration */
    simple?: boolean;
    /** show only complex configuration */
    complex?: boolean;
    /** do not show wizard */
    noWizard?: boolean;
    theme: IobTheme;
}

interface DialogCronState {
    cron: string;
    mode: 'simple' | 'complex' | 'wizard';
}

export class DialogCron extends React.Component<DialogCronProps, DialogCronState> {
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
            cron,
            mode: this.props.simple
                ? 'simple'
                : this.props.complex
                  ? 'complex'
                  : (typeof cron === 'object' || cron[0] === '{') && !this.props.noWizard
                    ? 'wizard'
                    : cron2state(this.props.cron || '* * * * *')
                      ? 'simple'
                      : 'complex',
        };
    }

    handleCancel(): void {
        this.props.onClose();
    }

    handleOk(): void {
        this.props.onOk(this.state.cron);
        this.props.onClose();
    }

    setMode(mode: 'simple' | 'complex' | 'wizard'): void {
        this.setState({ mode });
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
                <DialogTitle id="cron-dialog-title">{this.props.title || I18n.t('ra_Define schedule...')}</DialogTitle>
                <DialogContent style={{ height: '100%', overflow: 'hidden' }}>
                    {(this.props.simple && this.props.complex) || (!this.props.simple && !this.props.complex) ? (
                        <div>
                            {!this.props.simple && !this.props.complex && !this.props.noWizard && (
                                <>
                                    <Radio
                                        key="wizard"
                                        checked={this.state.mode === 'wizard'}
                                        onChange={() => this.setMode('wizard')}
                                    />
                                    <label
                                        onClick={() => this.setMode('wizard')}
                                        style={this.state.mode !== 'wizard' ? { color: 'lightgrey' } : {}}
                                    >
                                        {I18n.t('sc_wizard')}
                                    </label>
                                </>
                            )}

                            {((!this.props.simple && !this.props.complex) || this.props.simple) && (
                                <>
                                    <Radio
                                        key="simple"
                                        checked={this.state.mode === 'simple'}
                                        onChange={() => this.setMode('simple')}
                                    />
                                    <label
                                        onClick={() => this.setMode('simple')}
                                        style={this.state.mode !== 'simple' ? { color: 'lightgrey' } : {}}
                                    >
                                        {I18n.t('sc_simple')}
                                    </label>
                                </>
                            )}

                            {((!this.props.simple && !this.props.complex) || this.props.complex) && (
                                <>
                                    <Radio
                                        key="complex"
                                        checked={this.state.mode === 'complex'}
                                        onChange={() => this.setMode('complex')}
                                    />
                                    <label
                                        onClick={() => this.setMode('complex')}
                                        style={this.state.mode !== 'complex' ? { color: 'lightgrey' } : {}}
                                    >
                                        {I18n.t('sc_cron')}
                                    </label>
                                </>
                            )}
                        </div>
                    ) : null}

                    {this.state.mode === 'simple' && (
                        <SimpleCron
                            cronExpression={this.state.cron}
                            onChange={cron => this.setState({ cron })}
                            language={I18n.getLanguage()}
                        />
                    )}
                    {this.state.mode === 'wizard' && (
                        <Schedule
                            theme={this.props.theme}
                            schedule={this.state.cron}
                            onChange={(cron: string) => this.setState({ cron })}
                        />
                    )}
                    {this.state.mode === 'complex' && (
                        <ComplexCron
                            cronExpression={this.state.cron}
                            onChange={cron => this.setState({ cron })}
                            language={I18n.getLanguage()}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => this.handleOk()}
                        color="primary"
                        startIcon={<IconOk />}
                    >
                        {this.props.ok || I18n.t('ra_Ok')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => this.handleCancel()}
                        color="grey"
                        startIcon={<IconCancel />}
                    >
                        {this.props.cancel || I18n.t('ra_Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
