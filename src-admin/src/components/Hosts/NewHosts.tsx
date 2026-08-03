import React, { Component, type JSX } from 'react';

import {
    Box,
    Button,
    Card,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import { Refresh as RefreshIcon, Link as JoinIcon, Close as DeclineIcon } from '@mui/icons-material';

import { CardTitle, type AdminConnection, type IobTheme, type Translate } from '@iobroker/gui-components';

/** One host found on the network that does not belong to any system yet */
interface UnclaimedHost {
    ip: string;
    hostname?: string;
    info?: { node?: string; ostype?: string; arch?: string };
}

interface NewHostsProps {
    socket: AdminConnection;
    /** e.g. `system.host.MSI` - the host that performs the search */
    currentHost: string;
    t: Translate;
    theme: IobTheme;
}

interface NewHostsState {
    hosts: UnclaimedHost[];
    searching: boolean;
    /** IP of the host a command is currently running for */
    busy: string;
    /** Host the confirmation dialog is open for */
    confirm: UnclaimedHost | null;
    error: string;
}

/**
 * Lists hosts on the network that belong to no system yet and offers to attach them.
 *
 * The controller does the actual work: `multihostBrowse` searches, `multihostPair` sends `join` or
 * `decline` over UDP 50005. That detour is necessary because a host which is not attached yet has
 * no connection to the states database and cannot be reached the usual way.
 */
export default class NewHosts extends Component<NewHostsProps, NewHostsState> {
    private mounted = false;

    constructor(props: NewHostsProps) {
        super(props);
        this.state = { hosts: [], searching: false, busy: '', confirm: null, error: '' };
    }

    componentDidMount(): void {
        this.mounted = true;
        void this.search();
    }

    componentWillUnmount(): void {
        this.mounted = false;
    }

    /**
     * Send a command to the controller of the searching host.
     *
     * `socket.getRawSocket()` on purpose: `AdminConnection` has typed wrappers for a few fixed host
     * commands only, and none for an arbitrary one.
     *
     * @param command name of the controller message
     * @param data payload of the message
     */
    private sendToHost<T>(command: string, data: Record<string, unknown>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('timeout')), 10_000);
            try {
                this.props.socket
                    .getRawSocket()
                    .emit('sendToHost', this.props.currentHost, command, data, (result: T) => {
                        clearTimeout(timer);
                        resolve(result);
                    });
            } catch (e) {
                clearTimeout(timer);
                reject(e as Error);
            }
        });
    }

    async search(): Promise<void> {
        this.setState({ searching: true, error: '' });
        try {
            const answer = await this.sendToHost<{ result: boolean; hosts?: any[]; error?: string }>(
                'multihostBrowse',
                { timeout: 2_000 },
            );
            if (!this.mounted) {
                return;
            }
            if (!answer?.result) {
                this.setState({ searching: false, error: answer?.error || this.props.t('Cannot search for hosts') });
                return;
            }
            // only hosts that do not belong to a system: everything else is already in the list below
            const hosts: UnclaimedHost[] = (answer.hosts || [])
                .filter(host => host.unclaimed && host.ip)
                .map(host => ({ ip: host.ip, hostname: host.hostname, info: host.info }));

            this.setState({ hosts, searching: false });
        } catch (e) {
            if (this.mounted) {
                this.setState({ searching: false, error: (e as Error).message });
            }
        }
    }

    /**
     * @param host the target host
     * @param cmd `join` attaches it, `decline` makes it ignore this master
     */
    async pair(host: UnclaimedHost, cmd: 'join' | 'decline'): Promise<void> {
        this.setState({ busy: host.ip, confirm: null, error: '' });
        try {
            const answer = await this.sendToHost<{ result: boolean; answer?: string; error?: string }>(
                'multihostPair',
                { ip: host.ip, cmd },
            );
            if (!this.mounted) {
                return;
            }
            if (answer?.result) {
                // Both ways the host disappears from this list: it either joins us or ignores us
                this.setState(state => ({ busy: '', hosts: state.hosts.filter(h => h.ip !== host.ip) }));
            } else {
                this.setState({ busy: '', error: answer?.error || answer?.answer || 'error' });
            }
        } catch (e) {
            if (this.mounted) {
                this.setState({ busy: '', error: (e as Error).message });
            }
        }
    }

    renderConfirmDialog(): JSX.Element | null {
        const host = this.state.confirm;
        if (!host) {
            return null;
        }
        const { t } = this.props;

        return (
            <Dialog
                open={!0}
                onClose={() => this.setState({ confirm: null })}
            >
                <DialogTitle>{t('Attach host')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('The host %s will be attached to this system.', host.hostname || host.ip)}
                    </DialogContentText>
                    <DialogContentText sx={{ mt: 2, fontWeight: 600 }}>
                        {t('Its own configuration and objects will be discarded.')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => void this.pair(host, 'join')}
                    >
                        {t('Attach')}
                    </Button>
                    <Button
                        variant="contained"
                        color="grey"
                        onClick={() => this.setState({ confirm: null })}
                    >
                        {t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    render(): JSX.Element | null {
        const { t } = this.props;

        // Nothing found and nothing to report: do not take up space in the tab
        if (!this.state.hosts.length && !this.state.searching && !this.state.error) {
            return null;
        }

        return (
            <Card sx={{ p: 2.5, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <CardTitle title={t('New hosts found')} />
                    </Box>
                    <Tooltip title={t('Search again')}>
                        <IconButton
                            size="small"
                            disabled={this.state.searching}
                            onClick={() => void this.search()}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                {this.state.error ? (
                    <Typography
                        variant="body2"
                        color="error"
                        sx={{ mb: 1 }}
                    >
                        {this.state.error}
                    </Typography>
                ) : null}

                {this.state.searching && !this.state.hosts.length ? <CircularProgress size={24} /> : null}

                {this.state.hosts.map(host => (
                    <Box
                        key={host.ip}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            py: 1,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2">{host.hostname || host.ip}</Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {[host.ip, host.info?.ostype, host.info?.node].filter(t => t).join(' · ')}
                            </Typography>
                        </Box>
                        {this.state.busy === host.ip ? (
                            <CircularProgress size={20} />
                        ) : (
                            <>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<JoinIcon />}
                                    onClick={() => this.setState({ confirm: host })}
                                >
                                    {t('Attach')}
                                </Button>
                                <Tooltip title={t('Do not show this host again')}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        color="grey"
                                        startIcon={<DeclineIcon />}
                                        onClick={() => void this.pair(host, 'decline')}
                                    >
                                        {t('Ignore')}
                                    </Button>
                                </Tooltip>
                            </>
                        )}
                    </Box>
                ))}

                {this.renderConfirmDialog()}
            </Card>
        );
    }
}
