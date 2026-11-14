import React, { Component, type JSX } from 'react';
import QRCode from 'react-qr-code';

import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    LinearProgress,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';

import {
    Close as CloseIcon,
    ContentCopy as CopyIcon,
    Download as DownloadIcon,
    Check as CheckIcon,
} from '@mui/icons-material';

import type { Translate } from '@iobroker/gui-components';

import { twoFactorRequest, TwoFactorError, type TwoFactorStatus } from '@/helpers/twoFactor';

interface TwoFactorDialogProps {
    t: Translate;
    /** The logged-in user, e.g. `system.user.admin` */
    user: string;
    onClose: () => void;
}

interface TwoFactorDialogState {
    /** What the dialog shows */
    mode: 'loading' | 'off' | 'setup' | 'codes' | 'on' | 'unavailable';
    status: TwoFactorStatus | null;
    /** Secret and address for the QR code while setting up */
    setup: { secret: string; uri: string } | null;
    /** Backup codes, shown once after switching on or renewing */
    backupCodes: string[];
    code: string;
    error: string;
    busy: boolean;
}

/**
 * Lets the logged-in user switch the two-factor authentication with an authenticator app on and off.
 * The work is done by `@iobroker/webserver` (routes `2fa/*`); the secret never leaves the server except
 * once for the QR code.
 */
export default class TwoFactorDialog extends Component<TwoFactorDialogProps, TwoFactorDialogState> {
    constructor(props: TwoFactorDialogProps) {
        super(props);
        this.state = {
            mode: 'loading',
            status: null,
            setup: null,
            backupCodes: [],
            code: '',
            error: '',
            busy: false,
        };
    }

    componentDidMount(): void {
        void this.readStatus();
    }

    async readStatus(): Promise<void> {
        try {
            const status = await twoFactorRequest<TwoFactorStatus>('status');
            this.setState({ status, mode: status.enabled ? 'on' : 'off', error: '' });
        } catch (e) {
            // 404: the web server of this admin does not know it yet, or the authentication is off
            this.setState({
                mode: e instanceof TwoFactorError && e.status === 404 ? 'unavailable' : 'off',
                error: e instanceof TwoFactorError && e.status === 404 ? '' : (e as Error).message,
            });
        }
    }

    /**
     * Run a request and show its error
     *
     * @param action the request
     */
    async run(action: () => Promise<void>): Promise<void> {
        this.setState({ busy: true, error: '' });
        try {
            await action();
        } catch (e) {
            this.setState({
                error:
                    (e as Error).message === 'otp_invalid'
                        ? this.props.t('2fa_wrong_code')
                        : (e as Error).message || this.props.t('Unknown error'),
            });
        }
        this.setState({ busy: false });
    }

    onSetup = (): Promise<void> =>
        this.run(async () => {
            const setup = await twoFactorRequest<{ secret: string; uri: string }>('setup', {});
            this.setState({ setup, mode: 'setup', code: '' });
        });

    onEnable = (): Promise<void> =>
        this.run(async () => {
            const result = await twoFactorRequest<{ backupCodes: string[] }>('enable', { code: this.state.code });
            this.setState({ backupCodes: result.backupCodes, mode: 'codes', setup: null, code: '' });
        });

    onRenewBackupCodes = (): Promise<void> =>
        this.run(async () => {
            const result = await twoFactorRequest<{ backupCodes: string[] }>('backup-codes', {
                code: this.state.code,
            });
            this.setState({ backupCodes: result.backupCodes, mode: 'codes', code: '' });
        });

    onDisable = (): Promise<void> =>
        this.run(async () => {
            await twoFactorRequest('disable', { code: this.state.code });
            this.setState({ code: '' });
            await this.readStatus();
        });

    downloadBackupCodes(): void {
        const user = this.props.user.replace(/^system\.user\./, '');
        const text = `ioBroker - ${this.props.t('2fa_title')} - ${user}\n\n${this.state.backupCodes.join('\n')}\n`;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
        link.download = `iobroker-backup-codes-${user}.txt`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }

    renderCodeInput(onEnter: () => void): JSX.Element {
        return (
            <TextField
                variant="standard"
                autoFocus
                fullWidth
                label={this.props.t('2fa_code')}
                value={this.state.code}
                disabled={this.state.busy}
                autoComplete="one-time-code"
                onChange={e => this.setState({ code: e.target.value })}
                onKeyUp={e => e.key === 'Enter' && this.state.code.trim() && onEnter()}
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
        );
    }

    renderContent(): JSX.Element | null {
        const t = this.props.t;
        switch (this.state.mode) {
            case 'loading':
                return <LinearProgress />;

            case 'unavailable':
                return <Alert severity="info">{t('2fa_not_available')}</Alert>;

            case 'off':
                return <Typography>{t('2fa_explanation')}</Typography>;

            case 'setup':
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography>{t('2fa_scan')}</Typography>
                        {/* white frame: scanners need the light border around the code, also in the dark theme */}
                        <Box sx={{ alignSelf: 'center', background: '#fff', p: 2, borderRadius: 1, lineHeight: 0 }}>
                            <QRCode
                                value={this.state.setup?.uri || ''}
                                size={200}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                                variant="body2"
                                sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}
                            >
                                {t('2fa_key')}: {this.state.setup?.secret.replace(/(.{4})/g, '$1 ').trim()}
                            </Typography>
                            <Tooltip title={t('2fa_copy')}>
                                <IconButton
                                    size="small"
                                    onClick={() => void navigator.clipboard?.writeText(this.state.setup?.secret || '')}
                                >
                                    <CopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        {this.renderCodeInput(() => void this.onEnable())}
                    </Box>
                );

            case 'codes':
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Alert severity="warning">{t('2fa_backup_codes_info')}</Alert>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 1,
                                fontFamily: 'monospace',
                                fontSize: 16,
                                textAlign: 'center',
                            }}
                        >
                            {this.state.backupCodes.map(code => (
                                <div key={code}>{code}</div>
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                startIcon={<CopyIcon />}
                                onClick={() => void navigator.clipboard?.writeText(this.state.backupCodes.join('\n'))}
                            >
                                {t('2fa_copy')}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => this.downloadBackupCodes()}
                            >
                                {t('2fa_download')}
                            </Button>
                        </Box>
                    </Box>
                );

            case 'on':
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Alert severity="success">
                            {this.state.status?.created
                                ? t('2fa_enabled_since', new Date(this.state.status.created).toLocaleString())
                                : t('2fa_on')}
                        </Alert>
                        <Typography>{t('2fa_backup_codes_left', this.state.status?.backupCodes ?? 0)}</Typography>
                        <Typography variant="body2">{t('2fa_code_for_change')}</Typography>
                        {this.renderCodeInput(() => void this.onRenewBackupCodes())}
                    </Box>
                );

            default:
                return null;
        }
    }

    renderButtons(): JSX.Element | null {
        const t = this.props.t;
        const noCode = !this.state.code.trim() || this.state.busy;
        switch (this.state.mode) {
            case 'off':
                return (
                    <Button
                        variant="contained"
                        disabled={this.state.busy}
                        onClick={() => void this.onSetup()}
                    >
                        {t('2fa_setup')}
                    </Button>
                );
            case 'setup':
                return (
                    <Button
                        variant="contained"
                        disabled={noCode}
                        onClick={() => void this.onEnable()}
                    >
                        {t('2fa_enable')}
                    </Button>
                );
            case 'codes':
                return (
                    <Button
                        variant="contained"
                        startIcon={<CheckIcon />}
                        onClick={() => void this.readStatus()}
                    >
                        {t('2fa_done')}
                    </Button>
                );
            case 'on':
                return (
                    <>
                        <Button
                            variant="outlined"
                            disabled={noCode}
                            onClick={() => void this.onRenewBackupCodes()}
                        >
                            {t('2fa_new_backup_codes')}
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            disabled={noCode}
                            onClick={() => void this.onDisable()}
                        >
                            {t('2fa_disable')}
                        </Button>
                    </>
                );
            default:
                return null;
        }
    }

    render(): JSX.Element {
        return (
            <Dialog
                open={!0}
                maxWidth="sm"
                fullWidth
                // the backup codes are shown only once: a click beside the dialog must not close it then
                onClose={() => this.state.mode !== 'codes' && this.props.onClose()}
            >
                <DialogTitle>{this.props.t('2fa_title')}</DialogTitle>
                <DialogContent>
                    {this.renderContent()}
                    {this.state.error ? (
                        <Alert
                            severity="error"
                            sx={{ mt: 2 }}
                        >
                            {this.state.error}
                        </Alert>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    {this.renderButtons()}
                    <Button
                        variant="contained"
                        color="grey"
                        disabled={this.state.mode === 'codes'}
                        startIcon={<CloseIcon />}
                        onClick={() => this.props.onClose()}
                    >
                        {this.props.t('ra_Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
