import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import ConfigGeneric from './ConfigGeneric';
import ConfigPanel from './ConfigPanel';

const styles = theme => ({
    tabs: {
        height: '100%',
        width: '100%',
    },
    panel: {
        height: 'calc(100% - 48px)',
        width: '100%',
        display: 'block'
    }
});

class ConfigTabs extends ConfigGeneric {
    constructor(props) {
        super(props);

        this.state = {
            tab: window.localStorage.getItem((this.props.dialogName || 'App') + '.' + this.props.adapterName) || Object.keys(this.props.schema.items)[0],
        };
    }

    render() {
        const items = this.props.schema.items;
        return <div className={this.props.classes.tabs}>
            <Tabs value={this.state.tab} onChange={(e, tab) => {
                window.localStorage.setItem((this.props.dialogName || 'App') + '.' + this.props.adapterName, tab);
                this.setState({tab});
            }}>
                {Object.keys(items).map(name =>
                    <Tab value={name} label={this.getText(items[name].label)} />)}
            </Tabs>
            {<ConfigPanel
                key={this.state.tab}
                className={this.props.classes.panel}
                {...this.props}
                schema={items[this.state.tab]}
            />}
        </div>;
    }
}

ConfigTabs.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChanged: PropTypes.func,

    systemConfig: PropTypes.object,
    alive: PropTypes.bool,
    common: PropTypes.object,
};

export default withStyles(styles)(ConfigTabs);