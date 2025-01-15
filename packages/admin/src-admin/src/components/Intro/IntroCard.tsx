import React, { Component, type JSX } from 'react';

import {
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Collapse,
    Divider,
    Grid2,
    IconButton,
    Link,
    Typography,
    Tooltip,
    Box,
} from '@mui/material';

import {
    Check as CheckIcon,
    Create as EditIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';

import { blue, grey, red } from '@mui/material/colors';

import { Utils, IconCopy as SaveIcon, type IobTheme, type Translate } from '@iobroker/adapter-react-v5';

import AdminUtils from '../../helpers/AdminUtils';

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

export const styles: Record<string, any> = {
    root: (theme: IobTheme) => ({
        padding: '.75rem',
        [theme.breakpoints.up('xl')]: {
            flex: '0 1 20%',
        },
    }),
    card: {
        display: 'flex',
        minHeight: '235px',
        position: 'relative',
        overflow: 'hidden',
        maxHeight: '235p',
        '&:hover': {
            overflowY: 'auto',
            boxShadow: boxShadowHover,
        },
    },
    cardInfo: {
        display: 'flex',
        minHeight: '235px',
        position: 'relative',
        overflow: 'initial',
        maxHeight: '235p',
        flexDirection: 'column',
        '&:hover': {
            // overflowY: 'auto',
            boxShadow: boxShadowHover,
        },
    },
    cardInfoHead: (theme: IobTheme) => ({
        position: 'sticky',
        top: 0,
        background: theme.palette.background.default,
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        padding: '5px 5px 0px 5px',
    }),
    edit: {
        opacity: 0.6,
        userSelect: 'none',
        pointerEvents: 'none',
    },
    media: (theme: IobTheme) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#535353' : '#e2e2e2',
        maxWidth: '30%',
    }),
    img: {
        width: 120,
        height: 'auto',
        padding: '2rem .5rem',
        maxWidth: '100%',
    },
    contentContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
    },
    content: {
        height: '170px',
        flexGrow: 1,
        overflowY: 'hidden',
    },
    action: {
        minHeight: '49px',
        padding: '16px 24px',
    },
    expand: {
        position: 'absolute',
        right: '10px',
        bottom: '10px',
    },
    collapse: {
        minHeight: '100%',
        backgroundColor: '#ffffff',
        position: 'absolute',
        width: '100%',
        // '& button': {
        //     position: 'absolute',
        //     top: '10px',
        //     color: '#000000',
        //     '&:focus': {
        //         color: '#ffffff',
        //         backgroundColor: blue[500]
        //     }
        // }
    },
    close: {
        right: '10px',
    },
    save: {
        right: '50px',
    },
    enabled: {
        color: '#ffffff',
        backgroundColor: blue[500],
        position: 'absolute',
        top: 8,
        right: 8,
        boxShadow,
        '&:hover': {
            backgroundColor: blue[300],
        },
        '&:focus': {
            backgroundColor: blue[500],
        },
    },
    disabled: {
        color: '#ffffff',
        backgroundColor: grey[500],
        position: 'absolute',
        top: 8,
        right: 8,
        boxShadow,
        '&:hover': {
            backgroundColor: grey[300],
        },
        '&:focus': {
            backgroundColor: grey[500],
        },
    },
    editButton: {
        color: '#ffffff',
        backgroundColor: grey[500],
        position: 'absolute',
        top: 16 + 48, // 48 is the height of button
        right: 8,
        boxShadow,
        '&:hover': {
            backgroundColor: grey[300],
        },
        '&:focus': {
            backgroundColor: grey[500],
        },
    },
    deleteButton: {
        color: '#ffffff',
        backgroundColor: red[500],
        position: 'absolute',
        top: 24 + 48 + 48, // 48 is the height of button
        right: 8,
        boxShadow,
        '&:hover': {
            backgroundColor: red[300],
        },
        '&:focus': {
            backgroundColor: red[500],
        },
    },
    contentGrid: {
        height: '100%',
    },
    colorOrange: {
        color: '#ffcc80',
    },
    tooltip: {
        pointerEvents: 'none',
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

    render(): JSX.Element {
        const editClass = this.props.edit ? styles.edit : undefined;

        let buttonTitle: ioBroker.StringOrTranslated = this.props.action.text || this.props.t('Link');
        if (typeof buttonTitle === 'object') {
            buttonTitle = buttonTitle[this.props.lang] || buttonTitle.en;
        }

        return (
            <Grid2
                size={{
                    xs: 12,
                    sm: 6,
                    md: 4,
                    lg: 3,
                    xl: 2,
                }}
                sx={Utils.getStyle(this.props.theme, styles.root, this.props.style)}
                style={{ maxWidth: 500 }}
            >
                <Link
                    href={
                        !this.props.edit && this.props.action && this.props.action.link ? this.props.action.link : null
                    }
                    underline="none"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Card
                        sx={styles.card}
                        onClick={e => {
                            e.stopPropagation();
                            this.openDialog();
                        }}
                    >
                        {this.props.showInfo && !this.props.offline && (
                            <Button
                                style={{ ...styles.expand, ...editClass }}
                                variant="contained"
                                size="small"
                                disabled={this.props.disabled}
                                onClick={() => this.handleExpandClick()}
                                color="primary"
                            >
                                {this.props.t('Info')}
                            </Button>
                        )}
                        <Box
                            component="div"
                            sx={Utils.getStyle(
                                this.props.theme,
                                styles.media,
                                editClass,
                                this.props.color && { backgroundColor: this.props.color },
                                { display: 'flex', flexDirection: 'column' },
                            )}
                        >
                            <CardMedia
                                style={styles.img}
                                component="img"
                                image={this.props.image}
                            ></CardMedia>
                            <div
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    paddingBottom: '5px',
                                    paddingLeft: '5px',
                                }}
                            >
                                {this.props.warning ? (
                                    <Tooltip
                                        title={this.props.warning}
                                        slotProps={{ popper: { sx: styles.tooltip } }}
                                    >
                                        <WarningIcon
                                            style={{
                                                alignSelf: 'end',
                                                fontSize: 36,
                                            }}
                                        />
                                    </Tooltip>
                                ) : null}
                            </div>
                        </Box>
                        <div style={{ ...styles.contentContainer, ...editClass }}>
                            <CardContent style={styles.content}>
                                <Grid2
                                    container
                                    direction="column"
                                    wrap="nowrap"
                                    style={styles.contentGrid}
                                >
                                    <Typography
                                        gutterBottom
                                        variant="h5"
                                        component="h5"
                                    >
                                        {this.props.title}
                                    </Typography>
                                    {this.renderContent()}
                                </Grid2>
                            </CardContent>
                            {this.props.action?.link && <Divider />}
                            {this.props.action?.link && (
                                <CardActions style={styles.action}>
                                    <div style={styles.colorOrange}>
                                        {AdminUtils.getText(buttonTitle, this.props.lang)}
                                    </div>
                                </CardActions>
                            )}
                        </div>
                        {this.props.showInfo && (
                            <Collapse
                                style={styles.collapse}
                                in={this.state.expanded}
                                timeout="auto"
                                unmountOnExit
                            >
                                <Card sx={styles.cardInfo}>
                                    <Box
                                        component="div"
                                        sx={styles.cardInfoHead}
                                    >
                                        <Typography
                                            gutterBottom
                                            variant="h5"
                                            component="h5"
                                        >
                                            {this.props.t('Info')}
                                        </Typography>
                                        <div>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    if (this.props.getHostDescriptionAll) {
                                                        Utils.copyToClipboard(this.props.getHostDescriptionAll().text);
                                                    }
                                                    if (this.props.openSnackBarFunc) {
                                                        this.props.openSnackBarFunc();
                                                    }
                                                }}
                                            >
                                                <SaveIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => this.handleExpandClick()}
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        </div>
                                    </Box>
                                    <CardContent>{this.props.getHostDescriptionAll().el}</CardContent>
                                </Card>
                            </Collapse>
                        )}
                        {this.props.edit && this.props.toggleActivation && (
                            <IconButton
                                size="large"
                                sx={this.props.enabled ? styles.enabled : styles.disabled}
                                onClick={() => this.props.toggleActivation()}
                            >
                                <CheckIcon />
                            </IconButton>
                        )}
                        {this.props.edit && this.props.onEdit && (
                            <IconButton
                                size="large"
                                sx={styles.editButton}
                                onClick={() => this.props.onEdit()}
                            >
                                <EditIcon />
                            </IconButton>
                        )}
                        {this.props.edit && this.props.onRemove && (
                            <IconButton
                                size="large"
                                sx={styles.deleteButton}
                                onClick={() => this.props.onRemove()}
                            >
                                <DeleteIcon />
                            </IconButton>
                        )}
                        {this.renderDialogs()}
                    </Card>
                </Link>
            </Grid2>
        );
    }
}

export default IntroCard;
