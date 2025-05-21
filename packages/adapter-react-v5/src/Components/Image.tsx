import React, { type JSX, Component } from 'react';

import { Box, type SxProps } from '@mui/material';

import { IconNoIcon } from '../icons/IconNoIcon';

function getElementFromSource(src: string): HTMLElement | null {
    const svgContainer = document.createElement('div');
    svgContainer.innerHTML = src;
    const svg: HTMLElement = svgContainer.firstElementChild as HTMLElement;
    if (svg?.remove) {
        svg.remove();
    } else if (svg) {
        svgContainer.removeChild(svg);
    }

    svgContainer.remove();
    return svg;
}

function serializeAttrs(map?: NamedNodeMap): Record<string, string> {
    const ret: Record<string, string> = {};
    if (!map) {
        return ret;
    }
    for (let prop, i = 0; i < map.length; i++) {
        const key = map[i].name;
        if (key === 'class') {
            prop = 'className';
        } else if (!key.startsWith('data-')) {
            prop = key.replace(/[-|:]([a-z])/g, g => g[1].toUpperCase());
        } else {
            prop = key;
        }

        ret[prop] = map[i].value;
    }
    return ret;
}

interface ImageProps {
    /* The color */
    color?: string;
    /* The source of the image */
    src?: string;
    /* The image prefix (default: './files/') */
    imagePrefix?: string;
    /* The CSS class name */
    className?: string;
    /* Show image errors (or just show no image)? */
    showError?: boolean;
    sx?: SxProps;
}

interface ImageState {
    svg?: boolean;
    created?: boolean;
    color?: string;
    src?: string;
    imgError?: boolean;
    showError?: boolean;
}

/**
 * A component for displaying an image.
 */
export class Image extends Component<ImageProps, ImageState> {
    private svg: JSX.Element | null;

    static REMOTE_SERVER: boolean = window.location.hostname.includes('iobroker.in');

    static REMOTE_PREFIX: string = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);

    constructor(props: ImageProps) {
        super(props);
        this.state = {
            svg: !!this.props.src?.startsWith('data:'),
            created: true,
            color: this.props.color || '',
            src: this.props.src || '',
            imgError: false,
            showError: !!this.props.showError,
        };

        this.svg = this.state.svg && this.state.src ? this.getSvgFromData(this.state.src) : null;
    }

    static getDerivedStateFromProps(props: ImageProps, state: ImageState): Partial<ImageState> | null {
        const newState: ImageState = {};
        let changed = false;

        if (props && state && props.src !== state.src) {
            newState.src = props.src;
            newState.svg = props.src?.startsWith('data:');
            newState.created = false;
            changed = true;
        }

        if (props && state && props.color !== state.color) {
            newState.color = props.color;
            newState.created = false;
            changed = true;
        }

        if (props && state && props.showError !== state.showError) {
            newState.showError = props.showError;
            changed = true;
        }

        return changed ? newState : null;
    }

    getSvgFromData(src: string): JSX.Element | null {
        const len = 'data:image/svg+xml;base64,';
        if (!src.startsWith(len)) {
            return null;
        }
        src = src.substring(len.length);
        try {
            src = atob(src);
            const svg: HTMLElement = getElementFromSource(src);
            const inner = svg.innerHTML;
            const svgProps = serializeAttrs(svg.attributes);

            svg.remove();

            return (
                <Box
                    component="svg"
                    sx={this.props.sx}
                    className={this.props.className}
                    style={this.state.color ? { color: this.state.color } : undefined}
                    {...svgProps}
                    dangerouslySetInnerHTML={{ __html: inner }}
                />
            );
        } catch {
            // ignore
        }
        return null;
    }

    render(): JSX.Element | null {
        if (this.state.svg) {
            if (!this.state.created) {
                setTimeout(() => {
                    this.svg = this.state.src ? this.getSvgFromData(this.state.src) : null;
                    this.setState({ created: true });
                }, 50);
            }

            return this.svg;
        }
        if (this.state.src) {
            if (this.state.imgError || !this.state.src) {
                return <IconNoIcon className={this.props.className} />;
            }
            if (
                Image.REMOTE_SERVER &&
                !this.state.src.startsWith('http://') &&
                !this.state.src.startsWith('https://')
            ) {
                let src = (this.props.imagePrefix || '') + this.state.src;
                if (src.startsWith('./')) {
                    src = Image.REMOTE_PREFIX + src.substring(2);
                } else if (!src.startsWith('/')) {
                    src = Image.REMOTE_PREFIX + src;
                }
                return (
                    <Box
                        component="img"
                        sx={this.props.sx}
                        className={this.props.className}
                        src={`https://remote-files.iobroker.in${src}`}
                        alt=""
                        onError={() =>
                            this.props.showError ? this.setState({ imgError: true }) : this.setState({ src: '' })
                        }
                    />
                );
            }

            return (
                <Box
                    component="img"
                    sx={this.props.sx}
                    className={this.props.className}
                    src={(this.props.imagePrefix || '') + this.state.src}
                    alt=""
                    onError={() =>
                        this.props.showError ? this.setState({ imgError: true }) : this.setState({ src: '' })
                    }
                />
            );
        }

        return null;
    }
}
