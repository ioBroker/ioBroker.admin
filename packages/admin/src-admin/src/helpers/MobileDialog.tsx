import React, { Component, type JSX } from 'react';

export const MOBILE_WIDTH = 800;

interface MobileDialogState {
    mobile: boolean;
}

class MobileDialog<TProps, TState extends MobileDialogState = MobileDialogState> extends Component<TProps, TState> {
    private _resizeHandlerInstalled: boolean;

    private _timerOnResize: ReturnType<typeof setTimeout> = null;

    static isMobile(): boolean {
        return window.innerWidth < MOBILE_WIDTH;
    }

    componentDidMount(): void {
        if (this.state.mobile !== MobileDialog.isMobile()) {
            this.setState({ mobile: MobileDialog.isMobile() });
        }
        if (!this._resizeHandlerInstalled) {
            this._resizeHandlerInstalled = true;
            window.addEventListener('resize', this.__onResize, false);
        }
    }

    componentWillUnmount(): void {
        if (this._timerOnResize) {
            clearTimeout(this._timerOnResize);
            this._timerOnResize = null;
        }
        if (this._resizeHandlerInstalled) {
            window.removeEventListener('resize', this.__onResize, false);
        }
    }

    __onResize = (): void => {
        if (this._timerOnResize) {
            clearTimeout(this._timerOnResize);
        }
        this._timerOnResize = setTimeout(() => {
            this._timerOnResize = null;
            if (this.state.mobile !== MobileDialog.isMobile()) {
                this.setState({ mobile: MobileDialog.isMobile() });
            }
        }, 200);
    };

    // eslint-disable-next-line react/no-unused-class-component-methods
    getButtonTitle(icon: JSX.Element, text: string, moreMobileIcon?: JSX.Element): string | JSX.Element | null {
        if (icon && text) {
            if (this.state.mobile) {
                if (moreMobileIcon) {
                    return (
                        <>
                            {icon} & {moreMobileIcon}
                        </>
                    );
                }
                return icon;
            }
            return (
                <>
                    {icon}
                    <span style={{ marginLeft: 4 }}>{text}</span>
                </>
            );
        }
        if (icon) {
            return icon;
        }
        if (text) {
            return text;
        }
        return null;
    }
}

export default MobileDialog;
