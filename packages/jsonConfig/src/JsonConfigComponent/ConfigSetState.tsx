import React, { type JSX } from 'react';

import { Button } from '@mui/material';

import { Warning as IconWarning, Error as IconError, Info as IconInfo } from '@mui/icons-material';

import { DialogConfirm, Icon, I18n } from '@iobroker/adapter-react-v5';
import type { ConfigItemSetState } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    fullWidth: {
        width: '100%',
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: 4,
    },
};

interface ConfigInstanceSelectProps extends ConfigGenericProps {
    schema: ConfigItemSetState;
}

class ConfigSetState extends ConfigGeneric<ConfigInstanceSelectProps, ConfigGenericState> {
    async _onClick(): Promise<void> {
        let val = this.props.schema.val;
        if (typeof val === 'string' && val.includes('${')) {
            val = this.getPattern(val);
            const obj = await this.props.socket.getObject(this.props.schema.id);
            if (obj?.common?.type === 'number') {
                val = parseFloat(val);
            } else if (obj?.common?.type === 'boolean') {
                // @ts-expect-error val could be anything
                val = val === 'true' || val === true || val === '1' || val === 1;
            }
        }

        const id = (this.props.schema.id || '').replace(/%INSTANCE%/g, (this.props.instance || 0).toString());

        try {
            await this.props.socket.setState(id, { val, ack: !!this.props.schema.ack });
            if (this.props.schema.okText) {
                window.alert(this.getText(this.props.schema.okText));
            }
        } catch (e) {
            if (this.props.schema.error && this.props.schema.error[e.toString()]) {
                window.alert(this.getText(this.props.schema.error[e.toString()]));
            } else {
                window.alert(I18n.t(e.toString()) || I18n.t('ra_Error'));
            }
        }
    }

    renderDialogConfirm(): JSX.Element | null {
        if (!this.state.confirmDialog) {
            return null;
        }
        const confirm = this.state.confirmData || this.props.schema.confirm;
        let icon = null;
        if (confirm.type === 'warning') {
            icon = <IconWarning />;
        } else if (confirm.type === 'error') {
            icon = <IconError />;
        } else if (confirm.type === 'info') {
            icon = <IconInfo />;
        }

        return (
            <DialogConfirm
                title={this.getText(confirm.title) || I18n.t('ra_Please confirm')}
                text={this.getText(confirm.text)}
                ok={this.getText(confirm.ok) || I18n.t('ra_Ok')}
                cancel={this.getText(confirm.cancel) || I18n.t('ra_Cancel')}
                icon={icon}
                onClose={isOk => this.setState({ confirmDialog: false }, () => isOk && this._onClick())}
            />
        );
    }

    renderItem(_error: string, disabled: boolean /* , defaultValue */): JSX.Element | null {
        return (
            <Button
                variant={this.props.schema.variant || undefined}
                color={this.props.schema.color || 'grey'}
                style={styles.fullWidth}
                disabled={disabled}
                onClick={async () => {
                    if (this.props.schema.confirm) {
                        this.setState({ confirmDialog: true });
                    } else {
                        await this._onClick();
                    }
                }}
            >
                {this.props.schema.icon ? (
                    <Icon
                        src={this.props.schema.icon}
                        style={styles.icon}
                    />
                ) : null}
                {this.getText(this.props.schema.label, this.props.schema.noTranslation)}
            </Button>
        );
    }
}

export default ConfigSetState;
