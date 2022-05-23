import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import ConfigGeneric from './ConfigGeneric';

import I18n from '@iobroker/adapter-react/i18n';
import Utils from '@iobroker/adapter-react/Components/Utils';

const styles = theme => ({
    root: {
        width: '100%',
    },
    notAlive: {
        color: '#a30000'
    }
});

class ConfigAlive extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();

        const instance = this.getInstance();

        this.props.socket.getState(instance + '.alive')
            .then(state => this.setState({alive: !!(state && state.val), instance}));
    }

    getInstance() {
        let instance = this.props.schema.instance || (this.props.adapterName + '.' + this.props.instance);
        if (instance.includes('${')) {
            instance = this.getPattern(instance);
        }
        if (instance && !instance.startsWith('system.adapter.')) {
            instance = 'system.adapter.' + instance;
        }
        return instance;
    }

    renderItem() {
        if (this.getInstance() !== this.state.instance) {
            setTimeout(() => {
                const instance = this.getInstance();
                if (instance) {
                    this.props.socket.getState(instance + '.alive')
                        .then(state => this.setState({alive: !!(state && state.val), instance}));
                } else {
                    this.setState({alive: null, instance})
                }
            }, 200);
        }

        if (this.state.alive !== false && this.state.alive !== true) {
            return null;
        }

        const instance = this.state.instance.replace(/^system.adapter./, '');
        return <div className={Utils.clsx(this.props.classes.root, !this.state.alive && this.props.classes.notAlive)}>
            {this.state.alive ?
                this.props.schema.textAlive !== undefined ? (this.props.schema.textAlive ? I18n.t(this.props.schema.textAlive, instance) : '') : I18n.t('Instance %s is alive', instance)
                :
                this.props.schema.textNotAlive !== undefined ? (this.props.schema.textNotAlive ? I18n.t(this.props.schema.textNotAlive, instance) : '') : I18n.t('Instance %s is not alive', instance)
            }
        </div>;
    }
}

ConfigAlive.propTypes = {
    socket: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    adapterName: PropTypes.string,
    instance: PropTypes.number,
};

export default withStyles(styles)(ConfigAlive);