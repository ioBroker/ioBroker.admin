import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

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
import ConfigCertificateSelect from './ConfigCertificateSelect';
import ConfigImageUpload from './ConfigImageUpload';
import ConfigInstanceSelect from './ConfigInstanceSelect';
import ConfigTable from './ConfigTable';
import ConfigSendto from './ConfigSendto';
import ConfigObjectId from './ConfigObjectId';
import ConfigLanguage from './ConfigLanguage';
import ConfigChip from './ConfigChip';
import ConfigPassword from './ConfigPassword';
import ConfigStaticHeader from './ConfigStaticHeader';
import ConfigStaticDivider from './ConfigStaticDivider';
import ConfigSetState from './ConfigSetState';
import ConfigJsonEditor from './ConfigJsonEditor';

//import ConfigTabs from "./ConfigTabs";
// import { Paper } from '@material-ui/core';

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
    certificate: ConfigCertificateSelect,
    objectId: ConfigObjectId,
    language: ConfigLanguage,
    chip: ConfigChip,
    image: ConfigImageUpload,
    instance: ConfigInstanceSelect,
    table: ConfigTable,
    sendto: ConfigSendto,
    sendTo: ConfigSendto,
    password: ConfigPassword,
    header: ConfigStaticHeader,
    divider: ConfigStaticDivider,
    setState: ConfigSetState,
    jsonEditor: ConfigJsonEditor
};

const styles = theme => ({
    fullWidth: {
        width: '100%',
        //height: '100%',
    },
    paper: {
        margin: 10,
        height: 'calc(100vh - 230px) !important',
        width: 'auto !important',
        overflowY: 'auto',

    },
    padding: {
        padding: 10,
    }
});

class ConfigPanel extends ConfigGeneric {
    renderItems(items) {
        return Object.keys(items).map(attr => {
            const type = items[attr].type || 'panel';
            let ItemComponent;
            if (type === 'custom') {
                if (this.props.customs && this.props.customs[items[attr].component]) {
                    ItemComponent = this.props.customs[items[attr].component];
                } else {
                    console.error('Cannot find custom component: ' + items[attr].component);
                    ItemComponent = ConfigGeneric;
                }
            } else {
                ItemComponent = components[type] || ConfigGeneric;
            }

            return <ItemComponent
                key={attr}
                onCommandRunning={this.props.onCommandRunning}
                commandRunning={this.props.commandRunning}
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
                customs={this.props.customs}

                customObj={this.props.customObj}
                instanceObj={this.props.instanceObj}
                custom={this.props.custom}

                attr={attr}
                schema={items[attr]}
            />;
        });
    }

    render() {
        const items = this.props.schema.items;
        if (this.props.table) {
            return this.renderItems(items);
        }
        if (this.props.custom) {
            return <Grid container className={this.props.classes.fullWidth} spacing={2}>
                {this.renderItems(items)}
            </Grid>;
        } else {
            return <div className={(this.props.className || '') + ' ' + this.props.classes.paper}>
                <Grid container className={this.props.classes.fullWidth + " " + this.props.classes.padding} spacing={2}>
                    {this.renderItems(items)}
                </Grid>
            </div>;
        }
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
    customs: PropTypes.object,
    alive: PropTypes.bool,
    systemConfig: PropTypes.object,
    adapterName: PropTypes.string,
    instance: PropTypes.number,
    commandRunning: PropTypes.bool,
    onCommandRunning: PropTypes.func,

    customObj: PropTypes.object,
    instanceObj: PropTypes.object,
    custom: PropTypes.bool,

    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(ConfigPanel);