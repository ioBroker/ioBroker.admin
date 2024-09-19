import React, { type JSX } from 'react';

import type QRCode from 'react-qr-code';
import type { ConfigItemQrCode } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigQrCodeProps extends ConfigGenericProps {
    schema: ConfigItemQrCode;
}

interface ConfigQrCodeState extends ConfigGenericState {
    QRCode: typeof QRCode | null;
}

class ConfigQrCode extends ConfigGeneric<ConfigQrCodeProps, ConfigQrCodeState> {
    async componentDidMount(): Promise<void> {
        super.componentDidMount();
        // lazy load of qrcode
        const module = await import('react-qr-code');
        this.setState({ QRCode: module.default });
    }

    renderItem(): JSX.Element | null {
        const QRCodeComponent = this.state.QRCode;
        if (!QRCodeComponent) {
            return null;
        }
        return (
            <QRCodeComponent
                value={this.props.schema.data}
                size={this.props.schema.size}
                fgColor={this.props.schema.fgColor}
                bgColor={this.props.schema.bgColor}
                level={this.props.schema.level}
            />
        );
    }
}

export default ConfigQrCode;
