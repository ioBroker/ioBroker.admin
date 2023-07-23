import { Component } from 'react';

export const MOBILE_WIDTH = 800;

class MobileDialog extends Component {
    static isMobile() {
        return window.innerWidth < MOBILE_WIDTH;
    }

    componentDidMount() {
        if (this.state.mobile !== MobileDialog.isMobile()) {
            this.setState({ mobile: MobileDialog.isMobile() });
        }
        if (!this._resizeHandlerinstalled) {
            this._resizeHandlerinstalled = true;
            window.addEventListener('resize', this.__onResize, false);
        }
    }

    componentWillUnmount() {
        this._timerOnResize && clearTimeout(this._timerOnResize);
        this._timerOnResize = null;
        if (this._resizeHandlerinstalled) {
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

    getButtonTitle(icon, text, moreMobileIcon) {
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
        } if (icon) {
            return icon;
        } if (text) {
            return text;
        }
        return null;
    }
}

export default MobileDialog;
