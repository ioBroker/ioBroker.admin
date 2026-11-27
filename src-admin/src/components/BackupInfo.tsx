import React, { useEffect, useState, type JSX } from 'react';

import { Box, Button, CircularProgress, Tooltip, Typography } from '@mui/material';
import { Backup as BackupIcon } from '@mui/icons-material';

import { I18n, type AdminConnection, type Translate } from '@iobroker/gui-components';

import {
    BACKUP_MAX_AGE_MS,
    backupStateIds,
    formatBackupAge,
    parseBackupHistory,
    readBackupStatus,
    startBackup,
    type BackupStatus,
} from '@/helpers/backup';

/** So long BackItUp may take to take over the request of a backup */
const BACKUP_START_TIMEOUT_MS = 15_000;
/** "6 hours ago" is computed again so often */
const AGE_REFRESH_MS = 60_000;

interface BackupState {
    /** null while it is read */
    status: BackupStatus | null;
    /** The last line BackItUp writes while it makes a backup */
    output: string;
    /** If the last backup was successful (`history.iobrokerSuccess`) */
    success: boolean | null;
    /** The current time, refreshed every minute: the render must not read the clock itself */
    now: number;
}

/**
 * Reads the last backup of BackItUp and follows its states, so a backup made meanwhile is shown at once
 *
 * @param socket connection to the server
 */
function useBackupStatus(socket: AdminConnection): BackupState {
    const [state, setState] = useState<BackupState>(() => ({
        status: null,
        output: '',
        success: null,
        now: Date.now(),
    }));

    useEffect(() => {
        const timer = setInterval(() => setState(s => ({ ...s, now: Date.now() })), AGE_REFRESH_MS);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let active = true;
        let subscribed: string[] | null = null;
        let ids: ReturnType<typeof backupStateIds> | null = null;

        const onChange = (id: string, value: ioBroker.State | null | undefined): void => {
            if (!active || !ids) {
                return;
            }
            if (id === ids.history) {
                const last = parseBackupHistory(value?.val);
                if (last) {
                    setState(s =>
                        s.status
                            ? { ...s, now: Date.now(), status: { ...s.status, lastTs: last.ts, storage: last.storage } }
                            : s,
                    );
                }
            } else if (id === ids.oneClick) {
                setState(s => (s.status ? { ...s, status: { ...s.status, running: value?.val === true } } : s));
            } else if (id === ids.alive) {
                setState(s => (s.status ? { ...s, status: { ...s.status, alive: !!value?.val } } : s));
            } else if (id === ids.success) {
                setState(s => ({ ...s, success: typeof value?.val === 'boolean' ? value.val : null }));
            } else if (id === ids.output) {
                setState(s => ({
                    ...s,
                    output: value?.val === null || value?.val === undefined ? '' : String(value.val),
                }));
            }
        };

        void readBackupStatus(socket).then(status => {
            if (!active) {
                return;
            }
            setState(s => ({ ...s, status, now: Date.now() }));
            if (status.instance) {
                ids = backupStateIds(status.instance);
                subscribed = [ids.history, ids.oneClick, ids.alive, ids.success, ids.output];
                void socket.subscribeState(subscribed, onChange);
            }
        });

        return () => {
            active = false;
            if (subscribed) {
                socket.unsubscribeState(subscribed, onChange);
            }
        };
    }, [socket]);

    return state;
}

/** Text and warning of the last backup, e.g. "Last backup: 6 hours ago (Google Drive)" */
function describeBackup(
    status: BackupStatus,
    t: Translate,
    now: number,
): { text: string; tooltip: string; warning: boolean } {
    if (!status.instance) {
        return { text: t('No backup found: BackItUp is not installed'), tooltip: '', warning: true };
    }
    if (!status.lastTs) {
        return { text: t('Last backup: none'), tooltip: '', warning: true };
    }
    const age = formatBackupAge(status.lastTs, I18n.getLanguage(), now);
    return {
        text: status.storage ? t('Last backup: %s (%s)', age, status.storage) : t('Last backup: %s', age),
        tooltip: new Date(status.lastTs).toLocaleString(),
        warning: now - status.lastTs > BACKUP_MAX_AGE_MS,
    };
}

interface BackupInfoProps {
    socket: AdminConnection;
    t: Translate;
}

/**
 * The last backup above an update, with a button to make one now (#3750). Nothing is mandatory:
 * the update can be started without it.
 */
export function BackupInfo(props: BackupInfoProps): JSX.Element | null {
    const { socket, t } = props;
    const { status, output, success, now } = useBackupStatus(socket);
    /** When the backup was started from here, 0 if not */
    const [startedAt, setStartedAt] = useState(0);
    /** The backup started from here: requested, running or through */
    const [phase, setPhase] = useState<'idle' | 'starting' | 'running' | 'done'>('idle');
    const [error, setError] = useState('');
    const running = !!status?.running;

    useEffect(() => {
        if (phase === 'starting' && running) {
            setPhase('running');
        } else if (phase === 'running' && !running) {
            setPhase('done');
        }
    }, [phase, running]);

    useEffect(() => {
        if (phase !== 'starting') {
            return undefined;
        }
        // BackItUp sets `oneClick.iobroker` at once, if it does not, it will not make the backup
        const timer = setTimeout(() => {
            setPhase('idle');
            setError(t('BackItUp did not start the backup'));
        }, BACKUP_START_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [phase, t]);

    if (!status) {
        return null;
    }
    const { text, tooltip, warning } = describeBackup(status, t, now);
    const starting = phase === 'starting' && !status.running;
    // started here, through and no new backup in the history
    const failed = phase === 'done' && status.lastTs < startedAt && success === false;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                mb: 2,
            }}
        >
            <BackupIcon
                fontSize="small"
                color={warning ? 'warning' : 'success'}
            />
            <Tooltip title={tooltip}>
                <Typography
                    variant="body2"
                    sx={{ color: warning ? 'warning.main' : 'text.secondary' }}
                >
                    {text}
                </Typography>
            </Tooltip>
            {!status.instance ? (
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {t('Make a backup before the update, e.g. with "iob backup" on the host')}
                </Typography>
            ) : null}
            {status.instance && !status.alive && !status.running ? (
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {t('%s is not running', status.instance)}
                </Typography>
            ) : null}
            {status.instance && status.alive && !status.running && !starting ? (
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<BackupIcon />}
                    onClick={() => {
                        setError('');
                        setStartedAt(Date.now());
                        setPhase('starting');
                        startBackup(socket, status.instance).catch((e: unknown) => {
                            setPhase('idle');
                            setError(e instanceof Error ? e.message : String(e));
                        });
                    }}
                >
                    {t('Create backup now')}
                </Button>
            ) : null}
            {status.running || starting ? (
                <>
                    <CircularProgress size={16} />
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }}
                    >
                        {t('Backup is running...')}
                        {status.running && output ? ` ${output}` : ''}
                    </Typography>
                </>
            ) : null}
            {failed || error ? (
                <Typography
                    variant="caption"
                    color="error"
                >
                    {error || t('The backup failed, see the log of %s', status.instance)}
                </Typography>
            ) : null}
        </Box>
    );
}

/** The last backup as a short value for the overview, e.g. "6 hours ago (Google Drive)" */
export function LastBackupValue(props: BackupInfoProps): JSX.Element {
    const { status, now } = useBackupStatus(props.socket);
    if (!status) {
        return <span>--</span>;
    }
    const { t } = props;
    let text: string;
    if (!status.instance) {
        text = t('BackItUp is not installed');
    } else if (!status.lastTs) {
        text = t('none');
    } else {
        const age = formatBackupAge(status.lastTs, I18n.getLanguage(), now);
        text = status.storage ? `${age} (${status.storage})` : age;
    }
    const warning = !status.lastTs || now - status.lastTs > BACKUP_MAX_AGE_MS;

    return (
        <Tooltip title={status.lastTs ? new Date(status.lastTs).toLocaleString() : ''}>
            <Box
                component="span"
                sx={{ color: warning ? 'warning.main' : undefined }}
            >
                {status.running ? t('Backup is running...') : text}
            </Box>
        </Tooltip>
    );
}
