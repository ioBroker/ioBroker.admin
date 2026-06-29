import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Link,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { I18n, type AdminConnection, type ThemeType } from '@iobroker/adapter-react-v5';

import { type ChatMcpInfoResponse, type ChatMode, type McpEndpoint } from './chatTypes';

interface ChatMcpInfoDialogProps {
    socket: AdminConnection;
    /** Admin instance id, e.g. `admin.0`. */
    instance: string;
    themeType: ThemeType;
    /** Pre-select which prompt (read-only / actions) is shown first. */
    mode: ChatMode;
    onClose: () => void;
}

/** The MCP adapter the user installs to expose ioBroker to an external AI client. */
const MCP_ADAPTER = 'mcp';

/** Build the full `…/mcp` URL of an endpoint as seen from this browser. */
function endpointUrl(ep: McpEndpoint): string {
    // The admin instance embeds MCP on its OWN web server → reuse the current origin (this also keeps
    // a reverse proxy / custom port correct). Other instances are reached on their own port.
    if (ep.kind === 'admin') {
        return `${window.location.origin}/mcp`;
    }
    return `${ep.secure ? 'https' : 'http'}://${window.location.hostname}:${ep.port}/mcp`;
}

/** Short, human-readable description of how an endpoint is exposed. */
function endpointDescription(ep: McpEndpoint): string {
    switch (ep.kind) {
        case 'admin':
            return I18n.t('built-in MCP server of admin');
        case 'web':
            return I18n.t('MCP as a web extension');
        default:
            return I18n.t('standalone MCP adapter');
    }
}

/** A small inline "copy to clipboard" button that briefly shows a check mark after copying. */
function CopyButton({ text }: { text: string }): React.JSX.Element {
    const [copied, setCopied] = useState(false);
    return (
        <Tooltip title={copied ? I18n.t('Copied') : I18n.t('Copy')}>
            <IconButton
                size="small"
                onClick={() => {
                    try {
                        void navigator.clipboard?.writeText(text);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                    } catch {
                        // clipboard may be unavailable (insecure context) — ignore
                    }
                }}
            >
                {copied ? (
                    <CheckIcon
                        fontSize="small"
                        color="success"
                    />
                ) : (
                    <CopyIcon fontSize="small" />
                )}
            </IconButton>
        </Tooltip>
    );
}

/**
 * Help dialog: how to use the ioBroker assistant from an EXTERNAL AI client (Claude / Codex / Gemini /…)
 * without configuring an AI provider here. It walks the user through installing the MCP adapter, wiring
 * the MCP URL into their client, and copying the exact system prompt the built-in assistant uses.
 */
export default function ChatMcpInfoDialog(props: ChatMcpInfoDialogProps): React.JSX.Element {
    const dark = props.themeType === 'dark';
    const [info, setInfo] = useState<ChatMcpInfoResponse | null>(null);
    const [error, setError] = useState<string>('');
    const [promptMode, setPromptMode] = useState<ChatMode>(props.mode);

    useEffect(() => {
        let cancelled = false;
        props.socket
            .sendTo<ChatMcpInfoResponse>(props.instance, 'chat:getMcpInfo', {})
            .then(result => {
                if (cancelled) {
                    return;
                }
                if (!result || result.error) {
                    setError(result?.error || I18n.t('No response from the assistant'));
                } else {
                    setInfo(result);
                }
            })
            .catch(e => !cancelled && setError(e instanceof Error ? e.message : String(e)));
        return () => {
            cancelled = true;
        };
    }, [props.socket, props.instance]);

    const endpoints = info?.endpoints || [];
    const prompt = (promptMode === 'act' ? info?.promptAct : info?.promptRead) || '';

    const codeBoxSx = {
        m: 0,
        p: 1,
        borderRadius: 1,
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        whiteSpace: 'pre-wrap' as const,
        wordBreak: 'break-word' as const,
        bgcolor: dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)',
    };

    return (
        <Dialog
            open
            onClose={props.onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>{I18n.t('Use the assistant without an API key')}</DialogTitle>
            <DialogContent dividers>
                <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                >
                    {I18n.t(
                        'You can drive the ioBroker assistant from an external AI client (Claude, Codex, Gemini, …) without configuring an AI provider here. The client connects directly to ioBroker through the MCP server.',
                    )}
                </Typography>

                {error ? <Alert severity="error">{error}</Alert> : null}
                {!info && !error ? (
                    <Box style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                        <CircularProgress />
                    </Box>
                ) : null}

                {info ? (
                    <>
                        {/* Step 1 — install the MCP adapter */}
                        <Typography
                            variant="subtitle1"
                            style={{ marginTop: 8, fontWeight: 600 }}
                        >
                            {I18n.t('1. Install the MCP server')}
                        </Typography>
                        <Typography variant="body2">
                            {I18n.t(
                                'Install the %s adapter — ideally as a web extension of your web (or admin) instance. It exposes ioBroker’s tools to any MCP-compatible AI client.',
                                `iobroker.${MCP_ADAPTER}`,
                            )}{' '}
                            <Link
                                href="#tab-adapters"
                                onClick={e => {
                                    e.preventDefault();
                                    window.location.hash = '#tab-adapters';
                                    props.onClose();
                                }}
                            >
                                {I18n.t('Open the Adapters tab')}
                            </Link>
                        </Typography>
                        <Alert
                            severity={info.mcpInstalled ? 'success' : 'info'}
                            style={{ marginTop: 4 }}
                        >
                            {info.mcpInstalled
                                ? I18n.t('The %s adapter is installed.', `iobroker.${MCP_ADAPTER}`)
                                : I18n.t(
                                      'The %s adapter does not seem to be installed yet.',
                                      `iobroker.${MCP_ADAPTER}`,
                                  )}
                        </Alert>
                        <Alert
                            severity={info.adminMcpEnabled ? 'success' : 'warning'}
                            style={{ marginTop: 4 }}
                        >
                            {info.adminMcpEnabled
                                ? I18n.t(
                                      'This admin already provides a built-in MCP endpoint (listed below) — no extra adapter is required for it.',
                                  )
                                : I18n.t('MCP is disabled in this admin’s settings (native.disableMcp).')}
                        </Alert>

                        {/* Step 2 — register the MCP URL in the AI client */}
                        <Typography
                            variant="subtitle1"
                            style={{ marginTop: 16, fontWeight: 600 }}
                        >
                            {I18n.t('2. Add the MCP server in your AI client')}
                        </Typography>
                        <Typography
                            variant="body2"
                            gutterBottom
                        >
                            {I18n.t(
                                'In your AI client (Claude Desktop, Codex, Gemini CLI, …) add a new MCP server with this URL:',
                            )}
                        </Typography>
                        {endpoints.length ? (
                            endpoints.map(ep => {
                                const url = endpointUrl(ep);
                                return (
                                    <Box
                                        key={ep.id}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
                                    >
                                        <Box
                                            component="code"
                                            sx={{ ...codeBoxSx, flex: 1 }}
                                        >
                                            {url}
                                        </Box>
                                        <Typography
                                            variant="caption"
                                            color="textSecondary"
                                            style={{ whiteSpace: 'nowrap' }}
                                            title={ep.id}
                                        >
                                            {`${ep.id} · ${endpointDescription(ep)}`}
                                        </Typography>
                                        <CopyButton text={url} />
                                    </Box>
                                );
                            })
                        ) : (
                            <Alert severity="warning">
                                {I18n.t(
                                    'No reachable MCP endpoint found. Enable MCP in this admin’s settings, or install and start the %s adapter — either as a web extension on a web instance, or standalone with its own port.',
                                    `iobroker.${MCP_ADAPTER}`,
                                )}
                            </Alert>
                        )}

                        {/* Step 3 — the system prompt */}
                        <Box
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: 16,
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                style={{ fontWeight: 600 }}
                            >
                                {I18n.t('3. Assistant system prompt')}
                            </Typography>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ToggleButtonGroup
                                    size="small"
                                    exclusive
                                    value={promptMode}
                                    onChange={(_e, value: ChatMode | null) => value && setPromptMode(value)}
                                >
                                    <ToggleButton value="read">{I18n.t('Read-only')}</ToggleButton>
                                    <ToggleButton value="act">{I18n.t('Actions')}</ToggleButton>
                                </ToggleButtonGroup>
                                <CopyButton text={prompt} />
                            </Box>
                        </Box>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            gutterBottom
                        >
                            {I18n.t(
                                'This is the exact prompt the built-in assistant uses. Paste it as the system / instructions prompt in your AI client to get the same behaviour.',
                            )}
                        </Typography>
                        <Box
                            component="pre"
                            sx={{ ...codeBoxSx, maxHeight: 320, overflow: 'auto' }}
                        >
                            {prompt}
                        </Box>
                    </>
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button
                    color="grey"
                    startIcon={<CloseIcon />}
                    onClick={props.onClose}
                >
                    {I18n.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
