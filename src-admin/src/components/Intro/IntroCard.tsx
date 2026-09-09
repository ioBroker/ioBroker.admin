import React, { Component, type JSX } from 'react';

import { Box, Button, Card, Collapse, Grid, IconButton, Link, Tooltip, Typography } from '@mui/material';
import { alpha, darken, lighten } from '@mui/material/styles';

import {
    Check as CheckIcon,
    Create as EditIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
    OpenInNew as OpenInNewIcon,
    InfoOutlined as InfoIcon,
} from '@mui/icons-material';

import { Utils, IconCopy as SaveIcon, type IobTheme, type Translate } from '@iobroker/gui-components';

import AdminUtils from '../../helpers/AdminUtils';

/** Height floor of a card. All cards of a row are stretched to the highest one of the row. */
const CARD_MIN_HEIGHT = 168;

/**
 * `alpha()` throws on every color notation it cannot parse, and the card colors are written by the
 * adapter authors - anything can end up in there.
 *
 * @param color the color to make transparent
 * @param opacity the resulting opacity
 */
function tint(color: string | undefined, opacity: number): string | undefined {
    if (!color) {
        return undefined;
    }
    try {
        return alpha(color, opacity);
    } catch {
        return undefined;
    }
}

export const styles: Record<string, any> = {
    root: {
        display: 'flex',
        maxWidth: 460,
    },
    link: (theme: IobTheme) => ({
        display: 'flex',
        width: '100%',
        color: 'inherit',
        borderRadius: '12px',
        '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px',
        },
    }),
    card: (theme: IobTheme) => ({
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        p: '16px',
        position: 'relative',
        overflow: 'hidden',
        // the cards lie on a `paper` colored panel, so they need a tone of their own to stand out
        backgroundColor:
            theme.palette.mode === 'dark'
                ? lighten(theme.palette.background.paper, 0.08)
                : darken(theme.palette.background.paper, 0.03),
        // the modern themes draw the card border themselves, the older ones only have a shadow
        border: '1px solid',
        borderColor: theme.palette.divider,
        backgroundImage: 'none',
        transition: 'border-color 0.15s, background-color 0.15s',
        '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
        },
    }),
    cardClickable: {
        cursor: 'pointer',
        '&:hover .intro-card-launch': {
            opacity: 1,
        },
    },
    /** A card that is switched off and therefore only visible in the edit mode */
    cardOff: (theme: IobTheme) => ({
        opacity: 0.45,
        borderStyle: 'dashed',
        borderColor: theme.palette.text.disabled,
    }),
    head: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
    },
    icon: {
        width: 56,
        height: 56,
        flex: '0 0 auto',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    iconOffline: {
        filter: 'grayscale(1)',
        opacity: 0.5,
    },
    img: {
        width: 40,
        height: 40,
        objectFit: 'contain',
    },
    headText: {
        minWidth: 0,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        // keep the corner free for the launch icon
        pr: '20px',
    },
    title: {
        fontSize: '0.98rem',
        fontWeight: 600,
        lineHeight: 1.25,
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: 2,
        overflow: 'hidden',
        wordBreak: 'break-word',
    },
    meta: (theme: IobTheme) => ({
        fontSize: '0.78rem',
        lineHeight: 1.35,
        color: theme.palette.text.secondary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    }),
    warning: (theme: IobTheme) => ({
        fontSize: 17,
        ml: '4px',
        verticalAlign: '-3px',
        color: theme.palette.warning.main,
    }),
    corner: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    launch: (theme: IobTheme) => ({
        fontSize: 17,
        opacity: 0,
        color: theme.palette.text.secondary,
        transition: 'opacity 0.15s',
        '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
        },
    }),
    lamp: {
        width: 10,
        height: 10,
        borderRadius: '50%',
        flex: '0 0 auto',
    },
    lampOnline: (theme: IobTheme) => ({
        backgroundColor: theme.palette.success.main,
        boxShadow: `0 0 0 3px ${alpha(theme.palette.success.main, 0.2)}`,
    }),
    lampOffline: (theme: IobTheme) => ({
        backgroundColor: theme.palette.error.main,
        boxShadow: `0 0 0 3px ${alpha(theme.palette.error.main, 0.2)}`,
    }),
    lampUnknown: (theme: IobTheme) => ({
        backgroundColor: theme.palette.text.disabled,
    }),
    content: (theme: IobTheme) => ({
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        fontSize: '0.82rem',
        lineHeight: 1.5,
        color: theme.palette.text.secondary,
    }),
    /** A plain text description is cut off after three lines instead of being scrolled */
    contentClamped: {
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: 3,
    },
    infoButton: {
        alignSelf: 'flex-start',
        ml: '-6px',
        fontSize: '0.78rem',
        minHeight: 0,
        py: '2px',
    },
    editBar: (theme: IobTheme) => ({
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 3,
        display: 'flex',
        gap: '2px',
        borderRadius: '10px',
        p: '2px',
        backgroundColor: alpha(theme.palette.background.paper, 0.85),
        backdropFilter: 'blur(3px)',
    }),
    tooltip: {
        pointerEvents: 'none',
    },
    overlay: (theme: IobTheme) => ({
        position: 'absolute',
        inset: 0,
        zIndex: 4,
        backgroundColor: theme.palette.background.paper,
        '& .MuiCollapse-wrapper, & .MuiCollapse-wrapperInner': {
            height: '100%',
        },
    }),
    overlayInner: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    overlayHead: (theme: IobTheme) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        p: '8px 8px 8px 16px',
        borderBottom: `1px solid ${theme.palette.divider}`,
    }),
    overlayBody: {
        flex: 1,
        overflowY: 'auto',
        p: '12px 16px',
        fontSize: '0.82rem',
    },
};

export interface IntroCardProps {
    disabled?: boolean;
    onEdit?: () => void;
    offline?: boolean;
    t: Translate;
    lang: ioBroker.Languages;
    /** Shows a warning on the card with given text if configured */
    warning?: string;
    edit?: boolean;
    toggleActivation?: () => void;
    enabled: boolean;
    onRemove?: () => void;
    action: {
        text: ioBroker.StringOrTranslated;
        link: string;
    };
    color: string;
    image: string;
    children?: JSX.Element | JSX.Element[] | string | string[] | null | undefined;
    title: string | JSX.Element;
    showInfo?: boolean;
    /** Hosts show a lamp with their state. Everything else leaves this undefined. */
    status?: 'online' | 'offline' | 'unknown';
    getHostDescriptionAll?: () => { el: JSX.Element; text: string };
    openSnackBarFunc?: () => void;
    style?: React.CSSProperties;
    theme: IobTheme;
}

export interface IntroCardState {
    expanded: boolean;
}

class IntroCard<TProps extends IntroCardProps, TState extends IntroCardState> extends Component<TProps, TState> {
    constructor(props: TProps) {
        super(props);

        this.state = {
            expanded: false,
        } as TState;
    }

    static getDerivedStateFromProps(props: IntroCardProps): Partial<IntroCardState> | null {
        if (props.edit) {
            return { expanded: false };
        }
        return null;
    }

    handleExpandClick(): void {
        this.setState({ expanded: !this.state.expanded });
    }

    renderContent(): JSX.Element | JSX.Element[] | string | string[] | null | undefined {
        return this.props.children;
    }

    // eslint-disable-next-line class-methods-use-this
    openDialog(): void {
        // do nothing
    }

    // eslint-disable-next-line class-methods-use-this
    renderDialogs(): JSX.Element | null {
        return null;
    }

    /** A flat gradient of the accent color, layered over the card color on hover */
    hoverTint(accent: string): string | undefined {
        const color = tint(accent, this.props.theme.palette.mode === 'dark' ? 0.12 : 0.07);
        return color ? `linear-gradient(${color}, ${color})` : undefined;
    }

    /** Height floor of this card. A camera picture needs more room than a description. */
    // eslint-disable-next-line class-methods-use-this
    cardMinHeight(): number {
        return CARD_MIN_HEIGHT;
    }

    /** The card is wrapped in a link, so every button on it must keep the click for itself */
    static swallow(e: React.MouseEvent, cb?: () => void): void {
        e.preventDefault();
        e.stopPropagation();
        cb?.();
    }

    /** The buttons that are only shown while the intro page is in the edit mode */
    renderEditBar(): JSX.Element | null {
        if (!this.props.edit) {
            return null;
        }

        return (
            <Box sx={styles.editBar}>
                {this.props.toggleActivation ? (
                    <Tooltip
                        title={this.props.t('show/hide item')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <IconButton
                            size="small"
                            color={this.props.enabled ? 'primary' : 'default'}
                            onClick={e => IntroCard.swallow(e, this.props.toggleActivation)}
                        >
                            <CheckIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                ) : null}
                {this.props.onEdit ? (
                    <Tooltip
                        title={this.props.t('Edit')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <IconButton
                            size="small"
                            onClick={e => IntroCard.swallow(e, this.props.onEdit)}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                ) : null}
                {this.props.onRemove ? (
                    <Tooltip
                        title={this.props.t('Delete')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <IconButton
                            size="small"
                            color="error"
                            onClick={e => IntroCard.swallow(e, this.props.onRemove)}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                ) : null}
            </Box>
        );
    }

    /** The complete host information, shown over the card */
    renderInfoOverlay(): JSX.Element | null {
        if (!this.props.showInfo) {
            return null;
        }

        return (
            <Collapse
                sx={styles.overlay}
                in={this.state.expanded}
                timeout="auto"
                unmountOnExit
            >
                <Box sx={styles.overlayInner}>
                    <Box sx={styles.overlayHead}>
                        <Typography
                            component="div"
                            sx={styles.title}
                        >
                            {this.props.t('Info')}
                        </Typography>
                        <Box sx={{ display: 'flex' }}>
                            <IconButton
                                size="small"
                                title={this.props.t('Copy to clipboard')}
                                onClick={e =>
                                    IntroCard.swallow(e, () => {
                                        if (this.props.getHostDescriptionAll) {
                                            Utils.copyToClipboard(this.props.getHostDescriptionAll().text);
                                        }
                                        this.props.openSnackBarFunc?.();
                                    })
                                }
                            >
                                <SaveIcon />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={e => IntroCard.swallow(e, () => this.handleExpandClick())}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>
                    <Box sx={styles.overlayBody}>{this.props.getHostDescriptionAll?.().el}</Box>
                </Box>
            </Collapse>
        );
    }

    render(): JSX.Element {
        const { theme } = this.props;
        const accent = this.props.color || theme.palette.primary.main;
        const clickable = !this.props.edit && !!this.props.action?.link;

        // for an instance this is the "host:port" of its web interface, for a link the name the user gave it
        const meta = AdminUtils.getText(this.props.action?.text, this.props.lang);
        // the line only has room for the host, so the whole target goes into the tooltip
        let fullLink = '';
        if (this.props.action?.link) {
            try {
                fullLink = new URL(this.props.action.link, window.location.href).href;
            } catch {
                fullLink = this.props.action.link;
            }
        }

        return (
            <Grid
                size={{
                    xs: 12,
                    sm: 6,
                    md: 4,
                    lg: 3,
                    xl: 2,
                }}
                sx={Utils.getStyle(theme, styles.root, this.props.style)}
            >
                <Link
                    href={clickable ? this.props.action.link : undefined}
                    underline="none"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={Utils.getStyle(theme, styles.link)}
                >
                    <Card
                        sx={Utils.getStyle(
                            theme,
                            styles.card,
                            { minHeight: this.cardMinHeight() },
                            clickable && styles.cardClickable,
                            clickable && {
                                '&:hover': {
                                    borderColor: tint(accent, 0.7) || accent,
                                    backgroundImage: this.hoverTint(accent),
                                },
                            },
                            this.props.edit && !this.props.enabled && styles.cardOff,
                        )}
                        onClick={e => {
                            e.stopPropagation();
                            this.openDialog();
                        }}
                    >
                        <Box sx={styles.head}>
                            <Box
                                sx={Utils.getStyle(
                                    theme,
                                    styles.icon,
                                    { backgroundColor: this.props.color || tint(theme.palette.text.primary, 0.07) },
                                    this.props.offline && styles.iconOffline,
                                )}
                            >
                                <Box
                                    component="img"
                                    src={this.props.image}
                                    alt=""
                                    sx={styles.img}
                                />
                            </Box>
                            <Box sx={styles.headText}>
                                <Typography
                                    component="div"
                                    sx={styles.title}
                                >
                                    {this.props.title}
                                    {this.props.warning ? (
                                        <Tooltip
                                            title={this.props.warning}
                                            slotProps={{ popper: { sx: styles.tooltip } }}
                                        >
                                            <WarningIcon sx={styles.warning} />
                                        </Tooltip>
                                    ) : null}
                                </Typography>
                                {meta ? (
                                    <Typography
                                        component="div"
                                        sx={styles.meta}
                                        title={fullLink || meta}
                                    >
                                        {meta}
                                    </Typography>
                                ) : null}
                            </Box>
                        </Box>

                        {clickable || this.props.status ? (
                            <Box sx={styles.corner}>
                                {clickable ? (
                                    <OpenInNewIcon
                                        className="intro-card-launch"
                                        sx={styles.launch}
                                    />
                                ) : null}
                                {this.props.status ? (
                                    <Tooltip
                                        title={this.props.t(
                                            this.props.status === 'unknown' ? 'unknown' : this.props.status,
                                        )}
                                        slotProps={{ popper: { sx: styles.tooltip } }}
                                    >
                                        <Box
                                            sx={Utils.getStyle(
                                                theme,
                                                styles.lamp,
                                                this.props.status === 'online' && styles.lampOnline,
                                                this.props.status === 'offline' && styles.lampOffline,
                                                this.props.status === 'unknown' && styles.lampUnknown,
                                            )}
                                        />
                                    </Tooltip>
                                ) : null}
                            </Box>
                        ) : null}

                        <Box
                            sx={Utils.getStyle(
                                theme,
                                styles.content,
                                typeof this.props.children === 'string' && styles.contentClamped,
                            )}
                        >
                            {this.renderContent()}
                        </Box>

                        {this.props.showInfo && !this.props.offline ? (
                            <Button
                                sx={styles.infoButton}
                                size="small"
                                color="inherit"
                                startIcon={<InfoIcon fontSize="small" />}
                                disabled={this.props.disabled}
                                onClick={e => IntroCard.swallow(e, () => this.handleExpandClick())}
                            >
                                {this.props.t('Info')}
                            </Button>
                        ) : null}

                        {this.renderInfoOverlay()}
                        {this.renderEditBar()}
                        {this.renderDialogs()}
                    </Card>
                </Link>
            </Grid>
        );
    }
}

export default IntroCard;
