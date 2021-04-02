import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

import ConfigGeneric from './ConfigGeneric';
import ConfigText from './ConfigText';
import ConfigCheckbox from './ConfigCheckbox';
import ConfigStaticImage from './ConfigStaticImage';
import ConfigNumber from './ConfigNumber';
import ConfigColor from './ConfigColor';
import ConfigIP from './ConfigIP';
import ConfigSelect from './ConfigSelect';
import ConfigUser from './ConfigUser';
import ConfigStaticText from './ConfigStaticText';
import ConfigPattern from './ConfigPattern';

const components = {
    text: ConfigText,
    checkbox: ConfigCheckbox,
    staticImage: ConfigStaticImage,
    staticText: ConfigStaticText,
    staticLink: ConfigStaticText,
    number: ConfigNumber,
    color: ConfigColor,
    ip: ConfigIP,
    select: ConfigSelect,
    user: ConfigUser,
    pattern: ConfigPattern,
};

const styles = theme => ({
    fullWidth: {
        width: '100%',
        //height: '100%',
    },
    paper: {
        width: 'calc(100% - ' + theme.spacing(2) + 'px)',
        height: 'calc(100% - ' + theme.spacing(2) + 'px)',
        padding: theme.spacing(1)
    }
});

class ConfigPanel extends ConfigGeneric {
    renderItems(items) {
        return Object.keys(items).map(attr => {
            const type = items[attr].type || 'panel';
            const ItemComponent = components[type] || ConfigGeneric;

            return <ItemComponent
                key={attr}
                className={this.props.classes.panel}
                socket={this.props.socket}
                adapterName={this.props.adapterName}
                instance={this.props.instance}
                common={this.props.common}
                alive={this.props.alive}
                themeType={this.props.themeType}
                themeName={this.props.themeName}
                data={this.props.data}
                systemConfig={this.props.systemConfig}
                onError={this.props.onError}
                onChange={this.props.onChange}
                attr={attr}
                schema={items[attr]}
            />;
        });
    }

    render() {
        const items = this.props.schema.items;
        return <Paper className={(this.props.className || '') + ' ' + this.props.classes.paper}>
            <Grid container className={this.props.classes.fullWidth} spacing={2}>
                {this.renderItems(items)}
            </Grid>
        </Paper>;
    }
}

ConfigPanel.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    alive: PropTypes.bool,
    systemConfig: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(ConfigPanel);