import React, { Component } from 'react';

export const MOBILE_WIDTH = 800;

interface MobileDialogProps {
}

interface MobileDialogState {
    mobile: boolean;
}

class MobileDialog<TProps extends MobileDialogProps = MobileDialogProps, TState extends MobileDialogState = MobileDialogState> extends Component<TProps, TState> {
    private _resizeHandlerInstalled: boolean;

    private _timerOnResize: ReturnType<typeof setTimeout> = null;

    static isMobile() {
        return window.innerWidth < MOBILE_WIDTH;
    }

    componentDidMount() {
        if (this.state.mobile !== MobileDialog.isMobile()) {
            this.setState({ mobile: MobileDialog.isMobile() });
        }
        if (!this._resizeHandlerInstalled) {
            this._resizeHandlerInstalled = true;
            window.addEventListener('resize', this.__onResize, false);
        }
    }

    componentWillUnmount() {
        this._timerOnResize && clearTimeout(this._timerOnResize);
        this._timerOnResize = null;
        if (this._resizeHandlerInstalled) {
            window.removeEventListener('resize', this.__onResize, false);
        }
    }

    __onResize = () => {
        this._timerOnResize && clearTimeout(this._timerOnResize);
        this._timerOnResize = setTimeout(() => {
            this._timerOnResize = null;
            if (this.state.mobile !== MobileDialog.isMobile()) {
                this.setState({ mobile: MobileDialog.isMobile() });
            }
        }, 200);
    };

    // eslint-disable-next-line react/no-unused-class-component-methods
    getButtonTitle(
        icon: React.JSX.Element,
        text: string,
        moreMobileIcon?: React.JSX.Element,
    ): string | React.JSX.Element | null {
        if (icon && text) {
            if (this.state.mobile) {
                if (moreMobileIcon) {
                    return <>
                        {icon}
                        {' '}
&
                        {' '}
                        {moreMobileIcon}
                    </>;
                }
                return icon;
            }
            return <>
                {icon}
                <span style={{ marginLeft: 4 }}>{text}</span>
            </>;
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
