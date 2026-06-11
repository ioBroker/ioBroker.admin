import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Drawer,
    Fab,
    FormControlLabel,
    IconButton,
    Paper,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    AutoAwesome as AssistantIcon,
    Block as BlockIcon,
    Build as BuildIcon,
    CheckCircle as CheckIcon,
    Close as CloseIcon,
    ErrorOutline as ErrorIcon,
    ExpandMore as ExpandMoreIcon,
    PlayArrow as PlayArrowIcon,
    Send as SendIcon,
    Settings as SettingsIcon,
    Terminal as TerminalIcon,
    ViewSidebar as DockIcon,
    WebAsset as OverlayIcon,
} from '@mui/icons-material';
import { I18n, type AdminConnection, type IobTheme, type ThemeType } from '@iobroker/adapter-react-v5';

import ChatSettings from './ChatSettings';
import {
    chatSettingsReady,
    clampChatWidth,
    clearChatHistory,
    loadAutoApprove,
    loadChatDisplayMode,
    loadChatHistory,
    loadChatMode,
    loadChatOpen,
    loadChatSettings,
    loadChatWidth,
    saveAutoApprove,
    saveChatDisplayMode,
    saveChatHistory,
    saveChatMode,
    saveChatOpen,
    saveChatSettings,
    saveChatWidth,
    type ApiMessage,
    type ChatDisplayMode,
    type ChatMode,
    type ChatSendResponse,
    type ChatSettingsValue,
    type ClientAction,
    type DisplayItem,
    type PendingAction,
} from './chatTypes';

interface ChatPanelProps {
    socket: AdminConnection;
    /** Admin instance id, e.g. `admin.0`. */
    instance: string;
    theme: IobTheme;
    themeType: ThemeType;
    /** Currently selected host id (e.g. `system.host.xxx`) — used for adapter installation. */
    host: string;
    /** Open the command dialog to run a CLI command (used to install adapters). */
    executeCommand: (cmd: string, host?: string, callback?: (exitCode: number) => void) => void;
    /** Navigate the admin UI to a tab. */
    onNavigate: (tab: string, instance?: string) => void;
    /** Reports how many px to reserve on the right so admin content isn't hidden (0 = overlay/closed). */
    onDockWidthChange?: (width: number) => void;
}

/** Distribute `Omit` over the union so each variant keeps its own extra fields (steps/actions). */
type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
type NewDisplayItem = DistributiveOmit<DisplayItem, 'id'>;

/** Stringify an unknown argument value safely (never produces "[object Object]"). */
function asStr(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Renders a markdown link. Internal admin routes (e.g. `#tab-instances`, `/#tab-objects/edit/<id>`)
 * navigate the SPA via the hash (no page reload); external links open in a new tab.
 */
function ChatLink({ href, children }: { href?: string; children?: React.ReactNode }): React.JSX.Element {
    const url = href || '';
    const hashAt = url.indexOf('#');
    const internal = hashAt >= 0 && (url[0] === '#' || url.startsWith('/#') || url.includes('#tab-'));
    if (internal) {
        return (
            <a
                href={url}
                onClick={e => {
                    e.preventDefault();
                    window.location.hash = url.substring(hashAt);
                }}
            >
                {children}
            </a>
        );
    }
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
        >
            {children}
        </a>
    );
}

/** A short, human-readable description of a proposed action for the confirmation card. */
function describeAction(action: PendingAction): string {
    const args = action.args || {};
    switch (action.tool) {
        case 'create_user_state':
            return `${I18n.t('Create state')}: ${asStr(args.id)}`;
        case 'set_state':
            return `${I18n.t('Set state')}: ${asStr(args.id)} = ${asStr(args.value)}`;
        case 'set_states':
            return I18n.t('Set multiple states');
        case 'extend_object':
            return `${I18n.t('Update object')}: ${asStr(args.id)}`;
        case 'install_adapter':
            return `${I18n.t('Install adapter')}: ${asStr(args.adapter)}`;
        case 'run_command':
            return `${I18n.t('Run command')}: iobroker ${asStr(args.command)}`;
        case 'navigate_admin_ui':
            return `${I18n.t('Open in admin')}: ${asStr(args.hash)}`;
        default:
            return `${action.tool}: ${JSON.stringify(args)}`;
    }
}

/**
 * Global chat helper: a floating button that opens a right-side drawer. The user chats with the
 * ioBroker assistant; the backend drives the LLM ↔ MCP tool loop and this panel renders the answer,
 * the tool steps, and confirmation cards for any write/action the assistant proposes.
 */
export default function ChatPanel(props: ChatPanelProps): React.JSX.Element {
    // Restore the conversation + actions toggle from localStorage (kept until "new chat").
    // The lazy initializer runs only once, so localStorage is parsed once, not on every render.
    const [restored] = useState(() => loadChatHistory());

    const [open, setOpen] = useState(() => loadChatOpen());
    const [settings, setSettings] = useState<ChatSettingsValue>(() => loadChatSettings());
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [mode, setMode] = useState<ChatMode>(() => loadChatMode());
    const [items, setItems] = useState<DisplayItem[]>(restored.items);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [width, setWidth] = useState<number>(() => loadChatWidth());
    const [displayMode, setDisplayMode] = useState<ChatDisplayMode>(() => loadChatDisplayMode());
    const [autoApprove, setAutoApprove] = useState<string[]>(() => loadAutoApprove());

    const apiMessagesRef = useRef<ApiMessage[]>(restored.apiMessages);
    const nextIdRef = useRef(restored.items.reduce((max, item) => Math.max(max, item.id), -1) + 1);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [items, loading]);

    // Persist the conversation whenever it changes (apiMessagesRef is updated together with items).
    useEffect(() => {
        saveChatHistory({ items, apiMessages: apiMessagesRef.current });
    }, [items]);

    // Persist the actions toggle.
    useEffect(() => {
        saveChatMode(mode);
    }, [mode]);

    // Persist the overlay/docked choice.
    useEffect(() => {
        saveChatDisplayMode(displayMode);
    }, [displayMode]);

    // Persist whether the panel is open (restored on the next admin load).
    useEffect(() => {
        saveChatOpen(open);
    }, [open]);

    // Persist the blanket "don't ask again" approvals.
    useEffect(() => {
        saveAutoApprove(autoApprove);
    }, [autoApprove]);

    // Tell the app how much room to reserve on the right (only when docked AND open).
    useEffect(() => {
        props.onDockWidthChange?.(displayMode === 'docked' && open ? width : 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayMode, open, width]);

    // Release the reserved room when the panel unmounts (e.g. on disconnect).
    useEffect(
        () => () => props.onDockWidthChange?.(0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const ready = chatSettingsReady(settings);
    const dark = props.themeType === 'dark';

    // Drag the left edge of the drawer to resize it; the chosen width is persisted.
    const startResize = (e: React.MouseEvent): void => {
        e.preventDefault();
        let latest = width;
        const onMove = (ev: MouseEvent): void => {
            latest = clampChatWidth(window.innerWidth - ev.clientX);
            setWidth(latest);
        };
        const onUp = (): void => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            document.body.style.userSelect = '';
            saveChatWidth(latest);
        };
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const addItem = (item: NewDisplayItem): void =>
        setItems(prev => [...prev, { ...item, id: nextIdRef.current++ } as DisplayItem]);

    /** Run an `iobroker <command>` on the current host and stream its output live into the chat. */
    const runCliCommand = (command: string): void => {
        const itemId = nextIdRef.current++;
        const host = props.host?.startsWith('system.host.') ? props.host : `system.host.${props.host}`;
        const activeCmdId = Math.floor(Math.random() * 0xffffffe) + 1;

        setItems(prev => [
            ...prev,
            { id: itemId, role: 'command', command, lines: [`$ iobroker ${command}`], running: true },
        ]);

        const appendLine = (text: string): void =>
            setItems(prev =>
                prev.map(it =>
                    it.id === itemId && it.role === 'command' ? { ...it, lines: [...it.lines, text] } : it,
                ),
            );

        // The socket fires the handlers for every running command; we filter by our command id.
        // (`id` is typed as string in the socket-client typings but is the numeric cmd id at runtime.)
        const onStdout = (id: string, text: string): void => {
            if (Number(id) === activeCmdId) {
                appendLine(text);
            }
        };
        const onStderr = (id: string, text: string): void => {
            if (Number(id) === activeCmdId) {
                appendLine(text);
            }
        };
        // unregisterCmd*Handler clears the single handler slot (it takes no arguments).
        const unregister = (): void => {
            props.socket.unregisterCmdStdoutHandler();
            props.socket.unregisterCmdStderrHandler();
            props.socket.unregisterCmdExitHandler();
        };
        const onExit = (id: string, exitCode: number): void => {
            if (Number(id) !== activeCmdId) {
                return;
            }
            unregister();
            const tail = `${exitCode ? 'ERROR: ' : ''}${I18n.t('Process exited with code %s', String(exitCode))}`;
            setItems(prev =>
                prev.map(it =>
                    it.id === itemId && it.role === 'command'
                        ? { ...it, running: false, exitCode, lines: [...it.lines, tail] }
                        : it,
                ),
            );
        };

        props.socket.registerCmdStdoutHandler(onStdout);
        props.socket.registerCmdStderrHandler(onStderr);
        props.socket.registerCmdExitHandler(onExit);

        props.socket.cmdExec(host, command, activeCmdId).catch(e => {
            unregister();
            appendLine(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
            setItems(prev =>
                prev.map(it =>
                    it.id === itemId && it.role === 'command' ? { ...it, running: false, exitCode: 1 } : it,
                ),
            );
        });
    };

    const performClientAction = (action: ClientAction): void => {
        if (action.type === 'install') {
            props.executeCommand(`install ${action.adapter}`, props.host);
            addItem({ role: 'assistant', text: I18n.t('Started installation of %s.', action.adapter), steps: [] });
        } else if (action.type === 'navigate') {
            // The assistant navigates the admin UI itself by setting the URL hash.
            window.location.hash = action.hash.startsWith('#') ? action.hash : `#${action.hash}`;
        } else if (action.type === 'command') {
            runCliCommand(action.command);
        }
    };

    const runTurn = async (
        approvals?: Record<string, boolean>,
        autoApproveList: string[] = autoApprove,
    ): Promise<void> => {
        setLoading(true);
        try {
            const result = await props.socket.sendTo<ChatSendResponse>(props.instance, 'chat:send', {
                messages: apiMessagesRef.current,
                provider: settings.provider,
                model: settings.model,
                credentialId: settings.credentialId || undefined,
                baseUrl: settings.baseUrl || undefined,
                allowSelfSignedCerts: settings.allowSelfSignedCerts,
                mode,
                approvals,
                autoApprove: autoApproveList,
                // Tell the assistant where the user currently is in the admin UI.
                uiContext: { hash: window.location.hash },
            });

            if (!result || result.error) {
                addItem({ role: 'error', text: result?.error || I18n.t('No response from the assistant') });
                return;
            }

            apiMessagesRef.current = [...apiMessagesRef.current, ...(result.newMessages || [])];

            if (result.status === 'confirm') {
                if (result.content) {
                    addItem({ role: 'assistant', text: result.content, steps: result.steps || [] });
                }
                addItem({ role: 'confirm', text: '', actions: result.pendingActions || [] });
            } else {
                addItem({ role: 'assistant', text: result.content || '', steps: result.steps || [] });
                (result.clientActions || []).forEach(performClientAction);
            }
        } catch (e) {
            addItem({ role: 'error', text: e instanceof Error ? e.message : String(e) });
        } finally {
            setLoading(false);
        }
    };

    const onSend = (): void => {
        const text = input.trim();
        if (!text || loading) {
            return;
        }
        if (!ready) {
            setSettingsOpen(true);
            return;
        }
        addItem({ role: 'user', text });
        apiMessagesRef.current = [...apiMessagesRef.current, { role: 'user', content: text }];
        setInput('');
        void runTurn();
    };

    const onDecision = (item: Extract<DisplayItem, { role: 'confirm' }>, approve: boolean, remember: boolean): void => {
        setItems(prev =>
            prev.map(it =>
                it.id === item.id && it.role === 'confirm' ? { ...it, decided: approve ? 'approved' : 'declined' } : it,
            ),
        );
        // "Don't ask again": grant blanket approval for the tools in this card.
        let list = autoApprove;
        if (approve && remember) {
            const tools = item.actions.map(action => action.tool);
            list = Array.from(new Set([...autoApprove, ...tools]));
            setAutoApprove(list);
        }
        const approvals: Record<string, boolean> = {};
        item.actions.forEach(action => (approvals[action.id] = approve));
        void runTurn(approvals, list);
    };

    const onNewChat = (): void => {
        apiMessagesRef.current = [];
        nextIdRef.current = 0;
        clearChatHistory();
        setItems([]);
    };

    /** Feed a finished command's output back to the assistant as a follow-up turn for interpretation. */
    const interpretCommand = (command: string, output: string): void => {
        if (loading) {
            return;
        }
        addItem({ role: 'user', text: I18n.t('Please interpret the output of: %s', `iobroker ${command}`) });
        // Cap very long output (keep the tail) to bound token usage.
        const tail = output.length > 6000 ? `…${output.slice(-6000)}` : output;
        apiMessagesRef.current = [
            ...apiMessagesRef.current,
            {
                role: 'user',
                content:
                    `The command \`iobroker ${command}\` finished. Its output was:\n` +
                    `\`\`\`\n${tail}\n\`\`\`\n` +
                    'Interpret it briefly and point out anything that needs attention.',
            },
        ];
        void runTurn();
    };

    const onCloseSettings = (value?: ChatSettingsValue): void => {
        setSettingsOpen(false);
        if (value) {
            setSettings(value);
            saveChatSettings(value);
        }
    };

    const panelBody = (
        <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {/* Draggable handle on the left edge to resize the drawer (width is persisted). */}
            <Box
                onMouseDown={startResize}
                sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    cursor: 'ew-resize',
                    zIndex: 2,
                    '&:hover': { bgcolor: 'primary.main', opacity: 0.4 },
                }}
            />
            {/* Header */}
            <Box
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 8 }}
                sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
            >
                <AssistantIcon color="primary" />
                <Typography style={{ flex: 1, fontWeight: 600 }}>{I18n.t('ioBroker assistant')}</Typography>
                <Tooltip title={I18n.t('Allow actions (write/install)')}>
                    <FormControlLabel
                        style={{ marginRight: 0 }}
                        control={
                            <Switch
                                size="small"
                                checked={mode === 'act'}
                                onChange={e => setMode(e.target.checked ? 'act' : 'read')}
                            />
                        }
                        label={<Typography variant="caption">{I18n.t('Actions')}</Typography>}
                    />
                </Tooltip>
                <Tooltip title={displayMode === 'docked' ? I18n.t('Show as overlay') : I18n.t('Dock to the side')}>
                    <IconButton onClick={() => setDisplayMode(displayMode === 'docked' ? 'overlay' : 'docked')}>
                        {displayMode === 'docked' ? <OverlayIcon /> : <DockIcon />}
                    </IconButton>
                </Tooltip>
                <Tooltip title={I18n.t('New chat')}>
                    <IconButton onClick={onNewChat}>
                        <AddIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={I18n.t('Settings')}>
                    <IconButton onClick={() => setSettingsOpen(true)}>
                        <SettingsIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={I18n.t('Close')}>
                    <IconButton onClick={() => setOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Messages */}
            <Box style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                {!ready ? (
                    <Alert
                        severity="info"
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={() => setSettingsOpen(true)}
                            >
                                {I18n.t('Settings')}
                            </Button>
                        }
                    >
                        {I18n.t('Please configure the AI provider, credential and model first.')}
                    </Alert>
                ) : null}

                {!items.length && ready ? (
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        style={{ padding: 8 }}
                    >
                        {I18n.t(
                            'Ask me about your ioBroker system, e.g. "Which lights do I have in the living room?" or "Which adapter do I need for my Philips Hue?"',
                        )}
                    </Typography>
                ) : null}

                {items.map(item => (
                    <ChatItemView
                        key={item.id}
                        item={item}
                        dark={dark}
                        disabled={loading}
                        onDecision={onDecision}
                        onInterpretCommand={interpretCommand}
                    />
                ))}

                {loading ? (
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8 }}>
                        <CircularProgress size={16} />
                        <Typography
                            variant="caption"
                            color="textSecondary"
                        >
                            {I18n.t('Thinking…')}
                        </Typography>
                    </Box>
                ) : null}
                <div ref={endRef} />
            </Box>

            {/* Input */}
            <Box
                style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: 8 }}
                sx={{ borderTop: theme => `1px solid ${theme.palette.divider}` }}
            >
                <TextField
                    variant="outlined"
                    size="small"
                    fullWidth
                    multiline
                    maxRows={6}
                    placeholder={I18n.t('Ask the assistant…')}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                />
                <Tooltip title={I18n.t('Send')}>
                    <span>
                        <IconButton
                            color="primary"
                            disabled={loading || !input.trim()}
                            onClick={onSend}
                        >
                            <SendIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <>
            {!open ? (
                <Tooltip title={I18n.t('ioBroker assistant')}>
                    <Fab
                        color="primary"
                        size="medium"
                        onClick={() => setOpen(true)}
                        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}
                    >
                        <AssistantIcon />
                    </Fab>
                </Tooltip>
            ) : null}

            {displayMode === 'docked' ? (
                open ? (
                    <Paper
                        square
                        elevation={8}
                        sx={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width,
                            maxWidth: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: theme => theme.zIndex.appBar + 2,
                            borderLeft: theme => `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        {panelBody}
                    </Paper>
                ) : null
            ) : (
                <Drawer
                    anchor="right"
                    open={open}
                    onClose={() => setOpen(false)}
                    // disableScrollLock prevents the underlying page from shifting (scrollbar
                    // compensation) when the drawer opens/closes — that was the width "jumping".
                    ModalProps={{ disableScrollLock: true }}
                    PaperProps={{ style: { width, maxWidth: '100%' } }}
                >
                    {panelBody}
                </Drawer>
            )}

            {settingsOpen ? (
                <ChatSettings
                    socket={props.socket}
                    instance={props.instance}
                    value={settings}
                    autoApprove={autoApprove}
                    onChangeAutoApprove={setAutoApprove}
                    onClose={onCloseSettings}
                />
            ) : null}
        </>
    );
}

interface ChatItemViewProps {
    item: DisplayItem;
    dark: boolean;
    disabled: boolean;
    onDecision: (item: Extract<DisplayItem, { role: 'confirm' }>, approve: boolean, remember: boolean) => void;
    /** Ask the assistant to interpret a finished command's output. */
    onInterpretCommand: (command: string, output: string) => void;
}

/** Render a single conversation entry (user / assistant / confirmation / error). */
function ChatItemView({
    item,
    dark,
    disabled,
    onDecision,
    onInterpretCommand,
}: ChatItemViewProps): React.JSX.Element | null {
    // "Don't ask again" choice for a confirmation card (local to that card).
    const [remember, setRemember] = useState(false);
    if (item.role === 'user') {
        return (
            <Box style={{ display: 'flex', justifyContent: 'flex-end', margin: '6px 0' }}>
                <Box
                    sx={{
                        maxWidth: '85%',
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.75,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}
                >
                    {item.text}
                </Box>
            </Box>
        );
    }

    if (item.role === 'error') {
        return (
            <Alert
                severity="error"
                icon={<ErrorIcon />}
                style={{ margin: '6px 0' }}
            >
                {item.text}
            </Alert>
        );
    }

    if (item.role === 'command') {
        return (
            <Box sx={{ my: 1 }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <TerminalIcon fontSize="small" />
                    <Typography
                        variant="caption"
                        style={{ flex: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}
                    >
                        {`iobroker ${item.command}`}
                    </Typography>
                    {item.running ? (
                        <CircularProgress size={14} />
                    ) : item.exitCode === 0 ? (
                        <CheckIcon
                            color="success"
                            fontSize="small"
                        />
                    ) : (
                        <ErrorIcon
                            color="error"
                            fontSize="small"
                        />
                    )}
                </Box>
                <Box
                    component="pre"
                    sx={{
                        m: 0,
                        p: 1,
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: 320,
                        overflow: 'auto',
                        bgcolor: dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)',
                    }}
                >
                    {item.lines.join('\n')}
                </Box>
                {!item.running ? (
                    <Button
                        size="small"
                        startIcon={<AssistantIcon />}
                        disabled={disabled}
                        onClick={() => onInterpretCommand(item.command, item.lines.join('\n'))}
                        style={{ marginTop: 4 }}
                    >
                        {I18n.t('Interpret output')}
                    </Button>
                ) : null}
            </Box>
        );
    }

    if (item.role === 'confirm') {
        return (
            <Card
                variant="outlined"
                sx={{ my: 1, borderColor: 'warning.main' }}
            >
                <CardContent>
                    <Typography
                        variant="subtitle2"
                        gutterBottom
                    >
                        {I18n.t('The assistant wants to perform the following action(s):')}
                    </Typography>
                    {item.actions.map(action => (
                        <Box
                            key={action.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}
                        >
                            <BuildIcon fontSize="small" />
                            <Typography variant="body2">{describeAction(action)}</Typography>
                        </Box>
                    ))}
                    {item.decided ? (
                        <Typography
                            variant="caption"
                            color={item.decided === 'approved' ? 'success.main' : 'text.secondary'}
                        >
                            {item.decided === 'approved' ? I18n.t('Approved') : I18n.t('Declined')}
                        </Typography>
                    ) : (
                        <>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={remember}
                                        onChange={e => setRemember(e.target.checked)}
                                    />
                                }
                                label={
                                    <Typography variant="caption">
                                        {I18n.t("Don't ask again for such operations")}
                                    </Typography>
                                }
                            />
                            <Box style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    startIcon={<PlayArrowIcon />}
                                    disabled={disabled}
                                    onClick={() => onDecision(item, true, remember)}
                                >
                                    {I18n.t('Execute')}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    size="small"
                                    startIcon={<BlockIcon />}
                                    disabled={disabled}
                                    onClick={() => onDecision(item, false, false)}
                                >
                                    {I18n.t('Decline')}
                                </Button>
                            </Box>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    }

    // assistant
    return (
        <Box style={{ margin: '6px 0' }}>
            <Box
                sx={{
                    bgcolor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                    wordBreak: 'break-word',
                    '& p': { my: 0.5 },
                    '& ul, & ol': { my: 0.5, pl: 2.5 },
                    '& pre': {
                        m: 0,
                        p: 1,
                        borderRadius: 1,
                        overflowX: 'auto',
                        bgcolor: dark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)',
                    },
                    '& code': { fontFamily: 'monospace' },
                    '& table': { borderCollapse: 'collapse' },
                    '& th, & td': { border: '1px solid', borderColor: 'divider', px: 0.75, py: 0.25 },
                }}
            >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{ a: ChatLink }}
                >
                    {item.text || ''}
                </ReactMarkdown>
            </Box>
            {item.steps.length ? (
                <Accordion
                    disableGutters
                    elevation={0}
                    sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography
                            variant="caption"
                            color="textSecondary"
                        >
                            {I18n.t('%s tool call(s)', String(item.steps.length))}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails style={{ paddingTop: 0 }}>
                        {item.steps.map((step, i) => (
                            <Box
                                key={i}
                                style={{ marginBottom: 6 }}
                            >
                                <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {step.ok ? (
                                        <CheckIcon
                                            color="success"
                                            fontSize="small"
                                        />
                                    ) : (
                                        <ErrorIcon
                                            color="error"
                                            fontSize="small"
                                        />
                                    )}
                                    <Chip
                                        size="small"
                                        label={step.tool}
                                    />
                                    <Typography
                                        variant="caption"
                                        color="textSecondary"
                                        style={{ wordBreak: 'break-all' }}
                                    >
                                        {JSON.stringify(step.args)}
                                    </Typography>
                                </Box>
                                <Typography
                                    component="pre"
                                    variant="caption"
                                    sx={{
                                        m: 0,
                                        mt: 0.5,
                                        p: 0.5,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        color: 'text.secondary',
                                        maxHeight: 160,
                                        overflow: 'auto',
                                    }}
                                >
                                    {step.result}
                                </Typography>
                            </Box>
                        ))}
                    </AccordionDetails>
                </Accordion>
            ) : null}
        </Box>
    );
}
