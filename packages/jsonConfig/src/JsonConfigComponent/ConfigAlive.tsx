import React, { type JSX } from 'react';

import { I18n } from '@iobroker/adapter-react-v5';
import type { ConfigItemAlive } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    root: {
        width: '100%',
    },
    notAlive: {
        color: '#a30000',
    },
};

interface ConfigAliveProps extends ConfigGenericProps {
    schema: ConfigItemAlive;
}

interface ConfigAliveState extends ConfigGenericState {
    alive?: boolean | null;
    instance?: string;
}

class ConfigAlive extends ConfigGeneric<ConfigAliveProps, ConfigAliveState> {
    componentDidMount(): void {
        super.componentDidMount();

        const instance = this.getInstance();

        void this.props.oContext.socket
            .getState(`${instance}.alive`)
            .then(state => this.setState({ alive: !!(state && state.val), instance }));
    }

    getInstance(): string {
        let instance =
            this.props.schema.instance || `${this.props.oContext.adapterName}.${this.props.oContext.instance}`;
        if (instance.includes('${')) {
            instance = this.getPattern(instance, null, true);
        }
        if (instance && !instance.startsWith('system.adapter.')) {
            instance = `system.adapter.${instance}`;
        }
        return instance;
    }

    renderItem(): JSX.Element | null {
        if (this.getInstance() !== this.state.instance) {
            setTimeout(() => {
                const instance = this.getInstance();
                if (instance) {
                    void this.props.oContext.socket
                        .getState(`${instance}.alive`)
                        .then(state => this.setState({ alive: !!(state && state.val), instance }));
                } else {
                    this.setState({ alive: null, instance });
                }
            }, 200);
        }

        if (this.state.alive !== false && this.state.alive !== true) {
            return null;
        }

        const instance = this.state.instance.replace(/^system.adapter./, '');
        return (
            <div style={{ ...styles.root, ...(!this.state.alive ? styles.notAlive : undefined) }}>
                {this.state.alive
                    ? this.props.schema.textAlive !== undefined
                        ? this.props.schema.textAlive
                            ? I18n.t(this.props.schema.textAlive, instance)
                            : ''
                        : I18n.t('ra_Instance %s is alive', instance)
                    : this.props.schema.textNotAlive !== undefined
                      ? this.props.schema.textNotAlive
                          ? I18n.t(this.props.schema.textNotAlive, instance)
                          : ''
                      : I18n.t('ra_Instance %s is not alive', instance)}
            </div>
        );
    }
}

export default ConfigAlive;
