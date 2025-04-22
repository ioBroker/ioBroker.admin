import React from 'react';
import { Box, Typography } from '@mui/material';
import { Info, Warning, Close, Visibility, type SvgIconComponent, Check } from '@mui/icons-material';

interface InfoBoxProps {
    /** Text to display in the info box */
    children: string | (string | React.JSX.Element | null)[] | React.JSX.Element;
    /** The type determines the color and symbol */
    type: 'warning' | 'info' | 'error' | 'ok';
    /** If the Box is closeable */
    closeable?: boolean;
    /** Use together with `closeable: true`. You can specify in which variable in local storage the state of this info box could be stored */
    storeId?: string;
    /** Use together with `closeable: true`, listener called if close button clicked */
    onClose?: (desiredState: boolean) => void;
    /** Custom style */
    style?: React.CSSProperties;
    /** Icon position */
    iconPosition?: 'top' | 'middle';
    /** Use together with `closeable: true`. If the box is closed or not. In this case, it will be controlled from outside */
    closed?: boolean;
}

interface InfoBoxState {
    closed: boolean;
}
/**
 * This component can be used to show important information or warnings to the user
 */
export class InfoBox extends React.Component<InfoBoxProps, InfoBoxState> {
    private readonly refTypo: React.RefObject<HTMLDivElement>;
    private height: number;
    private width: number;

    constructor(props: InfoBoxProps) {
        super(props);
        this.state = {
            closed: this.props.storeId ? window.localStorage.getItem(this.props.storeId) === 'true' : false,
        };
        this.height = 0;
        this.width = 0;

        this.refTypo = React.createRef();
    }

    componentDidMount(): void {
        this.detectHeight();
    }

    onClick(): void {
        if (this.props.storeId && this.props.closed === undefined) {
            if (this.state.closed) {
                window.localStorage.removeItem(this.props.storeId);
            } else {
                window.localStorage.setItem(this.props.storeId, 'true');
            }
        }
        if (this.props.closed === undefined) {
            this.setState({ closed: !this.state.closed }, () => {
                // Inform about state change
                if (this.props.onClose) {
                    this.props.onClose(this.state.closed);
                }
            });
        } else if (this.props.onClose) {
            this.props.onClose(!this.props.closed);
        }
    }

    detectHeight(): void {
        const closed = this.props.closed !== undefined ? this.props.closed : this.state.closed;
        // We must get the height of the element when it is open to make transition
        if (this.props.closeable && !closed && this.refTypo.current) {
            window.requestAnimationFrame(() => {
                const closed = this.props.closed !== undefined ? this.props.closed : this.state.closed;
                if (closed) {
                    return;
                }
                if (this.refTypo.current && (!this.height || this.width !== this.refTypo.current.clientWidth)) {
                    this.height = this.refTypo.current.clientHeight;
                    this.width = this.refTypo.current.clientWidth;
                    this.forceUpdate();
                }
            });
        }
    }

    componentDidUpdate(): void {
        this.detectHeight();
    }

    render(): React.ReactNode {
        const closed = this.props.closed !== undefined ? this.props.closed : this.state.closed;

        const Icon: SvgIconComponent = closed ? Visibility : Close;

        return (
            <Box
                className="iom-info-box"
                style={{
                    whiteSpace: 'preserve',
                    display: 'flex',
                    gap: 8,
                    alignItems: closed || this.props.iconPosition === 'top' ? 'flex-start' : 'center',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    padding: 4,
                    borderRadius: 5,
                    marginBottom: 8,
                    maxWidth: '100%',
                    transition: 'height 0.5s',
                    height: this.props.closeable ? (closed ? 30 : this.height || undefined) : undefined,
                    overflow: this.props.closeable ? 'hidden' : undefined,
                    position: 'relative',
                    ...this.props.style,
                }}
                sx={{
                    borderColor: theme =>
                        this.props.type === 'ok' ? theme.palette.info.main : theme.palette[this.props.type].main,
                }}
            >
                {this.props.type === 'ok' ? (
                    <Check style={{ color: '#0F0' }} />
                ) : this.props.type === 'info' ? (
                    <Info color="primary" />
                ) : (
                    <Warning color={this.props.type} />
                )}
                <Typography ref={this.refTypo}>{this.props.children}</Typography>
                {this.props.closeable ? (
                    <Icon
                        sx={{
                            color: theme => (theme.palette.mode === 'dark' ? 'lightgray' : 'gray'),
                            // alignSelf: 'flex-start',
                            cursor: 'pointer',
                            position: 'absolute',
                            top: 4,
                            right: 4,
                        }}
                        onClick={() => this.onClick()}
                    />
                ) : null}
                {/* Reserve place for button so it will not overlap the text */}
                {this.props.closeable ? <div style={{ width: 22 }} /> : null}
                {closed ? (
                    <Box
                        // This is a shadow box at the bottom of the InfoBox when it closed
                        component="div"
                        sx={theme => {
                            const color = theme.palette[this.props.type === 'ok' ? 'info' : this.props.type].main;
                            return {
                                background: `linear-gradient(${color}00 0%, ${color}10 60%, ${color}90 100%)`,
                            };
                        }}
                        style={{
                            bottom: 0,
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: 10,
                        }}
                    />
                ) : null}
            </Box>
        );
    }
}
