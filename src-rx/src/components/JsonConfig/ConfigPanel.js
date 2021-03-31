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
                {...this.props}
                attr={attr}
                schema={items[attr]}
            />;
        });
    }

    render() {
        const items = this.props.schema.items;
        return <Paper className={(this.props.className || '') + ' ' + this.props.classes.paper}>
            <Grid container className={this.props.classes.fullWidth}>
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
    onError: PropTypes.func,
    onChanged: PropTypes.func,
};

export default withStyles(styles)(ConfigPanel);