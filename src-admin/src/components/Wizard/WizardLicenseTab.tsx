import React, { Component, type JSX } from 'react';

import {
    MenuItem,
    Select,
    FormControlLabel,
    Checkbox,
    Button,
    FormControl,
    InputLabel,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    LinearProgress,
    Paper,
    Box,
    Typography,
} from '@mui/material';

import { Language as IconWorld, Close as IconCancel, Check as IconCheck, Close } from '@mui/icons-material';

import { type AdminConnection, type ThemeType, type Translate } from '@iobroker/gui-components';

import Editor from '@/components/Editor';
import LicenseTexts from '../LicenseTexts';
import WizardStepFrame from './WizardStepFrame';

const LANGUAGES: { id: ioBroker.Languages; title: string }[] = [
    { id: 'en', title: 'English' },
    { id: 'de', title: 'Deutsch' },
    { id: 'ru', title: 'русский' },
    { id: 'pt', title: 'Portugues' },
    { id: 'nl', title: 'Nederlands' },
    { id: 'fr', title: 'français' },
    { id: 'it', title: 'Italiano' },
    { id: 'es', title: 'Espanol' },
    { id: 'pl', title: 'Polski' },
    { id: 'uk', title: 'Українська' },
    { id: 'zh-cn', title: '简体中文' },
];

interface WizardLicenseTabProps {
    t: Translate;
    onDone: (config: { lang: ioBroker.Languages }) => void;
    /** The confirmation is currently written to the server */
    saving: boolean;
    /** Go one step back */
    onBack?: () => void;
    /** Selected language */
    lang: ioBroker.Languages;
    /** Called if the user changes the language, so the whole wizard can be re-rendered */
    onLanguageChange: (lang: ioBroker.Languages) => void;
    socket: AdminConnection;
    themeType: ThemeType;
}

interface WizardLicenseTabState {
    statisticsAccepted: boolean;
    notAgree: boolean;
    showStatisticsDialog: boolean;
    requesting: boolean;
    diagData: Record<string, any> | null;
}

export default class WizardLicenseTab extends Component<WizardLicenseTabProps, WizardLicenseTabState> {
    constructor(props: WizardLicenseTabProps) {
        super(props);

        this.state = {
            statisticsAccepted: false,
            notAgree: false,
            diagData: null,
            requesting: false,
            showStatisticsDialog: false,
        };
    }

    async readStatistics(): Promise<void> {
        try {
            // Get current host
            const instance = await this.props.socket.getCurrentInstance();
            // read settings of current instance
            const settings = (await this.props.socket.getObject(
                `system.adapter.${instance}`,
            )) as unknown as ioBroker.InstanceObject;

            const diagData = await this.props.socket.getDiagData(settings.common.host, 'extended');

            this.setState({ diagData, requesting: false });
        } catch (e) {
            this.setState({ diagData: { error: (e as Error).message || (e as string).toString() }, requesting: false });
        }
    }

    renderStatisticsDialog(): JSX.Element | null {
        if (!this.state.showStatisticsDialog) {
            return null;
        }
        return (
            <Dialog
                open={!0}
                maxWidth="lg"
                fullWidth
                sx={{ '& .MuiDialog-paper': { maxHeight: 'calc(100% - 96px)', height: 'calc(100% - 96px)' } }}
                onClose={() => this.setState({ showStatisticsDialog: false })}
            >
                <DialogTitle>{this.props.t('Sent data:')}</DialogTitle>
                <DialogContent>
                    {this.state.requesting ? (
                        <>
                            <LinearProgress />
                            <div>{this.props.t('Requesting data...')}</div>
                        </>
                    ) : (
                        <>
                            <Typography
                                variant="body2"
                                sx={{ mb: 1, color: 'text.secondary' }}
                            >
                                {this.props.t(
                                    'The sent data will only be processed by ioBroker GmbH for statistical purposes and will not be shared with any third parties.',
                                )}
                            </Typography>
                            <Editor
                                style={{ height: 'calc(100% - 41px)' }}
                                editValueMode
                                themeType={this.props.themeType}
                                value={JSON.stringify(this.state.diagData, null, 2)}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => this.setState({ showStatisticsDialog: false })}
                        color="primary"
                        autoFocus
                        startIcon={<Close />}
                    >
                        {this.props.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    renderNotAgree(): JSX.Element | null {
        if (!this.state.notAgree) {
            return null;
        }
        return (
            <Dialog
                open={!0}
                onClose={() => this.setState({ notAgree: false })}
            >
                <DialogTitle>{this.props.t('Message')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <span
                            role="img"
                            aria-label="unhappy"
                        >
                            😒
                        </span>{' '}
                        {this.props.t('Sorry, you cannot use ioBroker.')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => this.setState({ notAgree: false })}
                        color="primary"
                        startIcon={<IconCheck />}
                    >
                        {this.props.t('Understand')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    renderLicenseText(): JSX.Element {
        const text = LicenseTexts[this.props.lang] || LicenseTexts.en;

        return (
            <Paper
                variant="outlined"
                sx={{
                    height: '100%',
                    minHeight: 120,
                    overflow: 'auto',
                    p: 2,
                    backgroundColor: 'action.hover',
                }}
            >
                {text.split('\n').map((line, i) => (
                    <Typography
                        key={i}
                        variant="body2"
                        sx={{ mb: 1.5 }}
                    >
                        {line}
                    </Typography>
                ))}
            </Paper>
        );
    }

    render(): JSX.Element {
        return (
            <WizardStepFrame
                title={this.props.t('License terms')}
                onBack={this.props.onBack}
                busy={this.props.saving}
                actions={
                    <>
                        <Button
                            variant="outlined"
                            color="grey"
                            disabled={this.props.saving}
                            onClick={() => this.setState({ notAgree: true })}
                            startIcon={<IconCancel />}
                        >
                            {this.props.t('Not agree')}
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            loading={this.props.saving}
                            disabled={!this.state.statisticsAccepted}
                            onClick={() => this.props.onDone({ lang: this.props.lang })}
                            startIcon={<IconCheck />}
                        >
                            {this.props.t('Agree')}
                        </Button>
                    </>
                }
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl
                        size="small"
                        disabled={this.props.saving}
                        sx={{ minWidth: 220 }}
                    >
                        <InputLabel id="wizard-language-label">{this.props.t('Language')}</InputLabel>
                        <Select
                            labelId="wizard-language-label"
                            label={this.props.t('Language')}
                            value={this.props.lang}
                            startAdornment={
                                <IconWorld
                                    fontSize="small"
                                    sx={{ mr: 1, color: 'text.secondary' }}
                                />
                            }
                            onChange={e => this.props.onLanguageChange(e.target.value)}
                        >
                            {LANGUAGES.map(language => (
                                <MenuItem
                                    key={language.id}
                                    value={language.id}
                                >
                                    {language.title}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ flex: 1, minHeight: 100 }}>{this.renderLicenseText()}</Box>

                    <Paper
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 2 }}
                    >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    autoFocus
                                    disabled={this.props.saving}
                                    checked={this.state.statisticsAccepted}
                                    onChange={e => this.setState({ statisticsAccepted: e.target.checked })}
                                />
                            }
                            label={this.props.t('I agree with the collection of anonymous statistics.')}
                        />
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 2,
                                ml: { xs: 0, sm: 4 },
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary' }}
                            >
                                {this.props.t('(This can be disabled later in settings)')}
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() =>
                                    this.setState({ showStatisticsDialog: true, requesting: true }, () =>
                                        this.readStatistics(),
                                    )
                                }
                            >
                                {this.props.t('Show sent statistics data')}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
                {this.renderNotAgree()}
                {this.renderStatisticsDialog()}
            </WizardStepFrame>
        );
    }
}
