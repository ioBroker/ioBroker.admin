import { createRef, Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import copy from '@iobroker/adapter-react-v5/Components/copy-to-clipboard';

import { Button } from '@mui/material';
import { Card } from '@mui/material';
import { CardActions } from '@mui/material';
import { CardContent } from '@mui/material';
import { CardMedia } from '@mui/material';
import { Collapse } from '@mui/material';
import { Divider } from '@mui/material';
import { Grid } from '@mui/material';
import { IconButton } from '@mui/material';
import { Link } from '@mui/material';
import { Typography } from '@mui/material';
import { Skeleton } from '@mui/material';

import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Create';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@iobroker/adapter-react-v5/icons/IconCopy';

import blue from '@mui/material/colors/blue';
import grey from '@mui/material/colors/grey';
import { red } from '@mui/material/colors';

import CameraIntroDialog from '../dialogs/CameraIntroDialog';

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

const styles = theme => ({
    root: {
        padding: '.75rem',
        [theme.breakpoints.up('xl')]: {
            flex: '0 1 20%'
        }
    },
    card: {
        display: 'flex',
        minHeight: '235px',
        position: 'relative',
        overflow: 'hidden',
        maxHeight: '235p',
        '&:hover': {
            overflowY: 'auto',
            boxShadow: boxShadowHover
        }
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
            boxShadow: boxShadowHover
        }
    },
    cardInfoHead: {
        position: 'sticky',
        top: 0,
        background: theme.palette.background.default,
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        padding: '5px 5px 0px 5px'
    },
    edit: {
        opacity: '.6',
        userSelect: 'none',
        pointerEvents: 'none'
    },
    media: {
        backgroundColor: '#e2e2e2',
        maxWidth: '30%'
    },
    img: {
        width: '120px',
        height: 'auto',
        padding: '2rem .5rem',
        maxWidth: '100%'
    },
    contentContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    content: {
        height: '170px',
        flexGrow: 1,
        overflowY: 'hidden'
    },
    action: {
        minHeight: '49px',
        padding: '16px 24px'
    },
    expand: {
        position: 'absolute',
        right: '10px',
        bottom: '10px'
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
        right: '10px'
    },
    save: {
        right: '50px'
    },
    enabled: {
        color: '#ffffff',
        backgroundColor: blue[500],
        position: 'absolute',
        top: theme.spacing(1),
        right: theme.spacing(1),
        boxShadow,
        '&:hover': {
            backgroundColor: blue[300]
        },
        '&:focus': {
            backgroundColor: blue[500]
        }
    },
    disabled: {
        color: '#ffffff',
        backgroundColor: grey[500],
        position: 'absolute',
        top: theme.spacing(1),
        right: theme.spacing(1),
        boxShadow,
        '&:hover': {
            backgroundColor: grey[300]
        },
        '&:focus': {
            backgroundColor: grey[500]
        }
    },
    editButton: {
        color: '#ffffff',
        backgroundColor: grey[500],
        position: 'absolute',
        top: parseInt(theme.spacing(2), 10) + 48, // 48 is the height of button
        right: theme.spacing(1),
        boxShadow,
        '&:hover': {
            backgroundColor: grey[300]
        },
        '&:focus': {
            backgroundColor: grey[500]
        }
    },
    deleteButton: {
        color: '#ffffff',
        backgroundColor: red[500],
        position: 'absolute',
        top: parseInt(theme.spacing(3), 10) + 48 + 48, // 48 is the height of button
        right: theme.spacing(1),
        boxShadow,
        '&:hover': {
            backgroundColor: red[300]
        },
        '&:focus': {
            backgroundColor: red[500]
        }

    },
    cameraImg: {
        width: '100%',
        height: '100%',
        maxWidth: 200,
        maxHeight: 200,
        objectFit: 'contain',
    },
    imgContainer: {
        height: '100%'
    },
    hidden: {
        display: 'none'
    },
    contentGrid: {
        height: '100%'
    },
    imgSkeleton: {
        transform: 'initial'
    },
    colorOrange: {
        color: '#ffcc80'
    }
});

class IntroCard extends Component {
    constructor(props) {
        super(props);

        this.state = {
            error: false,
            expanded: false,
            dialog: false,
            loaded: false
        };

        this.cameraRef = createRef();
        this.cameraUpdateTimer = null;

        this.interval = this.props.interval;
        this.camera = this.props.camera;
        this.t = props.t;
    }

    updateCamera() {
        if (this.cameraRef.current) {
            if (this.props.camera === 'custom') {
                let url = this.props.children;
                if (this.props.addTs) {
                    if (url.includes('?')) {
                        url += '&ts=' + Date.now();
                    } else {
                        url += '?ts=' + Date.now();
                    }
                }
                this.cameraRef.current.src = url;
            } else {
                const parts = this.props.camera.split('.');
                const adapter = parts.shift();
                const instance = parts.shift();
                this.props.socket.sendTo(adapter + '.' + instance, 'image', { name: parts.pop(), width: this.cameraRef.current.width })
                    .then(result => {
                        if (result && result.data && this.cameraRef.current) {
                            this.cameraRef.current.src = 'data:image/jpeg;base64,' + result.data;
                        }
                    })
                    .catch(e => window.alert('Cannot send to instance: ' + e));
            }
        }
    }

    componentDidMount() {
        if (this.props.camera && this.props.camera !== 'text') {
            this.cameraUpdateTimer = setInterval(() => this.updateCamera(), Math.max(parseInt(this.props.interval, 10), 500));
            this.updateCamera();
        }
    }

    componentWillUnmount() {
        this.cameraUpdateTimer && clearInterval(this.cameraUpdateTimer);
        this.cameraUpdateTimer = null;
    }

    renderCameraDialog() {
        if (!this.state.dialog) {
            return null;
        } else {
            return <CameraIntroDialog
                socket={this.props.socket}
                camera={this.props.camera}
                name={this.props.title}
                t={this.props.t}
                onClose={() => {
                    if (this.props.camera && this.props.camera !== 'text') {
                        this.cameraUpdateTimer && clearInterval(this.cameraUpdateTimer);
                        this.cameraUpdateTimer = setInterval(() => this.updateCamera(), Math.max(parseInt(this.props.interval, 10), 500));
                        this.updateCamera();
                    }

                    this.setState({ dialog: false });
                }}
            >
                {this.props.children}
            </CameraIntroDialog>;
        }
    }

    static getDerivedStateFromProps(props) {
        if (props.edit) {
            return { expanded: false };
        } else {
            return null;
        }
    }

    handleExpandClick() {
        this.setState({ expanded: !this.state.expanded });
    }

    handleImageLoad() {
        if (!this.state.loaded) {
            this.setState({
                loaded: true,
                error: false
            });
        }
    }

    handleImageError() {
        if (!this.state.error) {
            this.setState({
                loaded: false,
                error: true
            });
        }
    }

    renderContent() {
        const { classes } = this.props;

        if (!this.props.camera || this.props.camera === 'text') {
            return this.props.children
        } else if (this.props.camera === 'custom') {

            let url = this.props.children;

            if (this.props.addTs) {
                if (url.includes('?')) {
                    url += '&ts=' + Date.now();
                } else {
                    url += '?ts=' + Date.now();
                }
            }

            return <Grid
                item
                container
                className={classes.imgContainer}
                justifyContent="center"
                alignItems="center"
            >
                <img
                    ref={this.cameraRef}
                    src={url}
                    alt="Camera"
                    className={this.state.loaded && !this.state.error ? classes.cameraImg : classes.hidden}
                    onLoad={() => this.handleImageLoad()}
                    onError={() => this.handleImageError()}
                />
                {!this.state.loaded && !this.state.error &&
                    <Skeleton
                        height="100%"
                        width="100%"
                        animation="wave"
                        className={classes.imgSkeleton}
                    />
                }
                {this.state.error &&
                    <ErrorIcon fontSize="large" />
                }
            </Grid>;
        } else if (this.props.camera.startsWith('cameras.')) {
            return <img ref={this.cameraRef} src="" alt="camera" className={this.props.classes.cameraImg} />;
        }
    }

    render() {
        const { classes } = this.props;
        const editClass = this.props.edit ? ' ' + classes.edit : '';

        if (this.props.camera && this.props.camera !== 'text') {
            if (this.interval !== this.props.interval) {
                this.interval = this.props.interval;
                this.cameraUpdateTimer && clearInterval(this.cameraUpdateTimer);
                this.cameraUpdateTimer = setInterval(() => this.updateCamera(), Math.max(parseInt(this.props.interval, 10), 500));
            }
        } else if (this.cameraUpdateTimer) {
            clearInterval(this.cameraUpdateTimer);
            this.cameraUpdateTimer = null;
        }

        let buttonTitle = this.props.action.text || this.props.t('Link');
        if (typeof buttonTitle === 'object') {
            buttonTitle = buttonTitle[this.props.lang] || buttonTitle.en;
        }

        return <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={3}
            className={classes.root}
        >
            <Link
                href={!this.props.edit && this.props.action && this.props.action.link ? this.props.action.link : null}
                underline="none"
                target="_blank"
                rel="noopener noreferrer"
            >
                <Card
                    className={classes.card}
                    onClick={e => {
                        e.stopPropagation();
                        if (!this.props.edit && this.props.camera && this.props.camera !== 'text') {
                            this.cameraUpdateTimer && clearInterval(this.cameraUpdateTimer);
                            this.cameraUpdateTimer = null;
                            this.setState({ dialog: true });
                        }
                    }}
                >
                    {
                        this.props.reveal && !this.props.offline &&
                        <Button
                            className={classes.expand + editClass}
                            variant="contained"
                            size="small"
                            disabled={this.props.disabled}
                            onClick={() => this.handleExpandClick()}
                            color="primary"
                        >
                            {this.props.t('Info')}
                        </Button>
                    }
                    <div className={classes.media + editClass} style={{ backgroundColor: this.props.color }}>
                        <CardMedia
                            className={classes.img}
                            component="img"
                            image={this.props.image}
                        />
                    </div>
                    <div className={classes.contentContainer + editClass}>
                        <CardContent className={classes.content}>
                            <Grid
                                container
                                direction="column"
                                wrap="nowrap"
                                className={classes.contentGrid}
                            >
                                <Typography gutterBottom variant="h5" component="h5">
                                    {this.props.title}
                                </Typography>
                                {this.renderContent()}
                            </Grid>
                        </CardContent>
                        {
                            this.props.action && this.props.action.link &&
                            <Divider />
                        }
                        {
                            this.props.action && this.props.action.link &&
                            <CardActions className={classes.action}>
                                <div className={classes.colorOrange}>
                                    {buttonTitle}
                                </div>
                            </CardActions>
                        }
                    </div>
                    {
                        this.props.reveal &&
                        <Collapse
                            className={classes.collapse}
                            in={this.state.expanded}
                            timeout="auto"
                            unmountOnExit
                        >
                            <Card className={classes.cardInfo}>
                                <div className={classes.cardInfoHead}>
                                    <Typography gutterBottom variant="h5" component="h5">
                                        {this.props.t('Info')}
                                    </Typography>
                                    <div>
                                        <IconButton size="small" onClick={() => {
                                            copy(this.props.getHostDescriptionAll()[1], {
                                                format: 'text/plain'
                                            });
                                            this.props.openSnackBarFunc();
                                        }}>
                                            <SaveIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => this.handleExpandClick()}>
                                            <CloseIcon />
                                        </IconButton>
                                    </div>
                                </div>
                                <CardContent >
                                    {this.props.getHostDescriptionAll()[0]}
                                    {/* { this.props.reveal } */}
                                </CardContent>
                            </Card>
                        </Collapse>
                    }
                    {
                        this.props.edit && this.props.toggleActivation &&
                        <IconButton size="large" className={this.props.enabled ? classes.enabled : classes.disabled} onClick={() => this.props.toggleActivation()}>
                            <CheckIcon />
                        </IconButton>
                    }
                    {
                        this.props.edit && this.props.onEdit &&
                        <IconButton size="large" className={classes.editButton} onClick={() => this.props.onEdit()}>
                            <EditIcon />
                        </IconButton>
                    }
                    {
                        this.props.edit && this.props.onRemove &&
                        <IconButton size="large" className={classes.deleteButton} onClick={() => this.props.onRemove()}>
                            <DeleteIcon />
                        </IconButton>
                    }
                    {this.renderCameraDialog()}
                </Card>
            </Link>
        </Grid>;
    }
}

IntroCard.propTypes = {
    camera: PropTypes.string,
    addTs: PropTypes.bool,
    interval: PropTypes.number,
    ready: PropTypes.bool,
    instances: PropTypes.object,
    updateIntro: PropTypes.string,
    openLinksInNewWindow: PropTypes.bool,
    onEdit: PropTypes.func,
    socket: PropTypes.object,
    offline: PropTypes.bool,
    t: PropTypes.func,
    lang: PropTypes.string,
};

export default withStyles(styles)(IntroCard);