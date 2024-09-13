import React, { createRef } from 'react';

import { Grid2, Skeleton } from '@mui/material';

import { Error as ErrorIcon } from '@mui/icons-material';

import { type AdminConnection } from '@iobroker/adapter-react-v5';

import IntroCard, { type IntroCardProps, type IntroCardState } from '@/components/Intro/IntroCard';
import CameraIntroDialog from './CameraIntroDialog';

const styles: Record<string, any> = {
    cameraImg: {
        width: '100%',
        height: '100%',
        maxWidth: 200,
        maxHeight: 200,
        objectFit: 'contain',
    },
    imgContainer: {
        height: '100%',
    },
    hidden: {
        display: 'none',
    },
    imgSkeleton: {
        transform: 'initial',
    },
};

interface IntroCardCameraProps extends IntroCardProps {
    camera?: string;
    addTs?: boolean;
    interval?: number;
    cameraUrl?: string;
    socket: AdminConnection;
}

interface IntroCardCameraState extends IntroCardState {
    error: boolean;
    dialog: boolean;
    loaded: boolean;
}

class IntroCardCamera extends IntroCard<IntroCardCameraProps, IntroCardCameraState> {
    private readonly cameraRef: React.RefObject<HTMLImageElement>;

    private cameraUpdateTimer: ReturnType<typeof setTimeout> | null;

    private interval: number;

    constructor(props: IntroCardCameraProps) {
        super(props);

        Object.assign(this.state, {
            error: false,
            dialog: false,
            loaded: false,
        });

        this.cameraRef = createRef<HTMLImageElement>();
        this.cameraUpdateTimer = null;

        this.interval = props.interval;
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
                    .then((result: { data?: string }) => {
                        if (result?.data && this.cameraRef.current) {
                            this.cameraRef.current.src = `data:image/jpeg;base64,${result.data}`;
                        }
                    })
                    .catch((e: string) => window.alert(`Cannot send to instance: ${e}`));
            }
        }
    }

    componentDidMount() {
        if (this.props.camera && this.props.camera !== 'text') {
            this.cameraUpdateTimer = setInterval(
                () => this.updateCamera(),
                Math.max(parseInt(this.props.interval as any as string, 10), 500)
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

    renderDialogs() {
        if (!this.state.dialog) {
            return null;
        }
        return (
            <CameraIntroDialog
                socket={this.props.socket}
                camera={this.props.camera}
                name={this.props.title}
                t={this.props.t}
                onClose={() => {
                    if (this.props.camera && this.props.camera !== 'text') {
                        if (this.cameraUpdateTimer) {
                            clearInterval(this.cameraUpdateTimer);
                        }
                        this.cameraUpdateTimer = setInterval(
                            () => this.updateCamera(),
                            Math.max(parseInt(this.props.interval as any as string, 10), 500)
                        );
                        this.updateCamera();
                    }

                    this.setState({ dialog: false });
                }}
                cameraUrl={this.props.cameraUrl}
            />
        );
    }

    handleImageLoad() {
        if (!this.state.loaded) {
            this.setState({
                loaded: true,
                error: false,
            });
        }
    }

    handleImageError() {
        if (!this.state.error) {
            this.setState({
                loaded: false,
                error: true,
            });
        }
    }

    renderContent() {
        if (this.props.camera === 'custom') {
            let url = this.props.cameraUrl;

            if (this.props.addTs) {
                if (url.includes('?')) {
                    url += `&ts=${Date.now()}`;
                } else {
                    url += `?ts=${Date.now()}`;
                }
            }

            return (
                <Grid2 container style={styles.imgContainer} justifyContent="center" alignItems="center">
                    <img
                        ref={this.cameraRef}
                        src={url}
                        alt="Camera"
                        style={this.state.loaded && !this.state.error ? styles.cameraImg : styles.hidden}
                        onLoad={() => this.handleImageLoad()}
                        onError={() => this.handleImageError()}
                    />
                    {!this.state.loaded && !this.state.error && (
                        <Skeleton height="100%" width="100%" animation="wave" style={styles.imgSkeleton} />
                    )}
                    {this.state.error && <ErrorIcon fontSize="large" />}
                </Grid2>
            );
        }

        if (this.props.camera.startsWith('cameras.')) {
            return <img ref={this.cameraRef} src="" alt="camera" style={styles.cameraImg} />;
        }

        return null;
    }

    render() {
        if (this.props.camera && this.props.camera !== 'text') {
            if (this.interval !== this.props.interval) {
                this.interval = this.props.interval;
                if (this.cameraUpdateTimer) {
                    clearInterval(this.cameraUpdateTimer);
                }
                this.cameraUpdateTimer = setInterval(
                    () => this.updateCamera(),
                    Math.max(parseInt(this.props.interval as any as string, 10), 500)
                );
            }
        } else if (this.cameraUpdateTimer) {
            clearInterval(this.cameraUpdateTimer);
            this.cameraUpdateTimer = null;
        }

        return super.render();
    }
}

export default IntroCardCamera;
