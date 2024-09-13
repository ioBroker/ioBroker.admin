import React, { createRef, Component } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';

import { Close as CloseIcon } from '@mui/icons-material';

import type { IobTheme, Translate, AdminConnection } from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = {
    rootGrid: {
        flexGrow: 1,
    },
    closeButton: (theme: IobTheme) => ({
        position: 'absolute',
        right: 8,
        top: 8,
        color: theme.palette.grey[500],
    }),
    paper: {
        // minWidth: 600
    },
    typography: {
        paddingRight: 30,
    },
    img: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
};

interface CameraIntroLinkDialogProps {
    t: Translate;
    camera: string;
    socket: AdminConnection;
    interval?: string;
    onClose: () => void;
    name: string | React.JSX.Element;
    addTs?: boolean;
    cameraUrl: string;
}

class CameraIntroLinkDialog extends Component<CameraIntroLinkDialogProps> {
    cameraUpdateTimer: ReturnType<typeof setInterval>;

    cameraRef: React.RefObject<HTMLImageElement>;

    constructor(props: CameraIntroLinkDialogProps) {
        super(props);

        this.cameraUpdateTimer = null;
        this.cameraRef = createRef();
    }

    componentDidMount() {
        if (this.props.camera && this.props.camera !== 'text') {
            this.cameraUpdateTimer = setInterval(
                () => this.updateCamera(),
                Math.max(parseInt(this.props.interval, 10), 500)
            );
            this.updateCamera();
        }
    }

    componentWillUnmount() {
        if (this.cameraUpdateTimer) {
            clearInterval(this.cameraUpdateTimer);
            this.cameraUpdateTimer = null;
        }
    }

    updateCamera() {
        if (this.cameraRef.current) {
            if (this.props.camera === 'custom') {
                let url = this.props.cameraUrl;
                if (this.props.addTs) {
                    if (url.includes('?')) {
                        url += `&ts=${Date.now()}`;
                    } else {
                        url += `?ts=${Date.now()}`;
                    }
                }
                this.cameraRef.current.src = url;
            } else {
                const parts = this.props.camera.split('.');
                const adapter = parts.shift();
                const instance = parts.shift();
                this.props.socket
                    .sendTo(`${adapter}.${instance}`, 'image', {
                        name: parts.pop(),
                        width: this.cameraRef.current.width,
                    })
                    .then(result => {
                        if (result && result.data && this.cameraRef.current) {
                            this.cameraRef.current.src = `data:image/jpeg;base64,${result.data}`;
                        }
                    });
            }
        }
    }

    render() {
        return (
            <Dialog
                onClose={() => this.props.onClose()}
                open={!0}
                maxWidth="xl"
                fullWidth
                fullScreen
                sx={{ '& .MuiDialog-paper': styles.paper }}
            >
                <DialogTitle>
                    <Typography component="h2" variant="h6" sx={{ '&.MuiTypography-root': styles.typography }}>
                        {this.props.name}
                        <IconButton size="large" sx={styles.closeButton} onClick={() => this.props.onClose()}>
                            <CloseIcon />
                        </IconButton>
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <img style={styles.img} src="" alt="camera" ref={this.cameraRef} />
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        autoFocus
                        onClick={e => {
                            e.stopPropagation();
                            this.props.onClose();
                        }}
                        color="primary"
                        startIcon={<CloseIcon />}
                    >
                        {this.props.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default CameraIntroLinkDialog;
