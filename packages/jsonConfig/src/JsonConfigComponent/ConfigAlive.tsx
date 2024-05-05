import React from 'react';
import { withStyles } from '@mui/styles';

import { Utils, I18n } from '@iobroker/adapter-react-v5';
import type { ConfigItemAlive } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, any> = {
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
    componentDidMount() {
        super.componentDidMount();

        const instance = this.getInstance();

        this.props.socket.getState(`${instance}.alive`)
            .then(state => this.setState({ alive: !!(state && state.val), instance }));
    }

    getInstance() {
        let instance = this.props.schema.instance || (`${this.props.adapterName}.${this.props.instance}`);
        if (instance.includes('${')) {
            instance = this.getPattern(instance);
        }
        if (instance && !instance.startsWith('system.adapter.')) {
            instance = `system.adapter.${instance}`;
        }
        return instance;
    }

    renderItem() {
        if (this.getInstance() !== this.state.instance) {
            setTimeout(() => {
                const instance = this.getInstance();
                if (instance) {
                    this.props.socket.getState(`${instance}.alive`)
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
        return <div className={Utils.clsx(this.props.classes.root, !this.state.alive && this.props.classes.notAlive)}>
            {this.state.alive ?
                this.props.schema.textAlive !== undefined ? (this.props.schema.textAlive ? I18n.t(this.props.schema.textAlive, instance) : '') : I18n.t('ra_Instance %s is alive', instance)
                :
                this.props.schema.textNotAlive !== undefined ? (this.props.schema.textNotAlive ? I18n.t(this.props.schema.textNotAlive, instance) : '') : I18n.t('ra_Instance %s is not alive', instance)}
        </div>;
    }
}

export default withStyles(styles)(ConfigAlive);
