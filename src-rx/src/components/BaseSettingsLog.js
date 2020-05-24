import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import Toolbar from '@material-ui/core/Toolbar';
import FormControl from '@material-ui/core/FormControl';
import Paper from  '@material-ui/core/Paper';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import Fab from '@material-ui/core/Fab';

//Icons
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import IconPlus from '@material-ui/icons/Add';
import IconDelete from '@material-ui/icons/Delete';

const styles = theme => ({
    paper: {
        height:    '100%',
        maxHeight: '100%',
        maxWidth:  '100%',
        overflow:  'hidden',
        padding:   theme.spacing(1),
    },
    gridSettings: {
        height: 'calc(100% - ' + theme.mixins.toolbar.minHeight + 'px)',
        width: '100%',
        overflow: 'auto'
    },
    controlItem: {
        width: 400,
        marginBottom: theme.spacing(2),
        marginRight: theme.spacing(1),
        marginLeft: theme.spacing(1),
    },
    delButton: {
        position: 'absolute',
        top: 2,
        right: theme.spacing(6),
    },
    addButton: {
        marginRight: theme.spacing(1),
    }
});

class BaseSettingsLog extends React.Component {
    constructor(props) {
        super(props);

        const settings   = this.props.settings || {};
        settings.transport = settings.transport    || {};
        Object.keys(settings.transport).forEach(id => {
            if (settings.transport[id].type === 'file') {
                settings.transport[id].maxSize    = settings.transport[id].maxSize || 0;
                settings.transport[id].maxFiles   = settings.transport[id].maxFiles || 0;
            } else if (settings.transport[id].type === 'syslog') {
                settings.transport[id].host       = settings.transport[id].host || '';
                settings.transport[id].port       = settings.transport[id].port || 0;
                settings.transport[id].path       = settings.transport[id].path || '';
                settings.transport[id].facility   = settings.transport[id].facility || '';
                settings.transport[id].sysLogType = settings.transport[id].sysLogType || '';
                settings.transport[id].app_name   = settings.transport[id].app_name || '';
                settings.transport[id].eol        = settings.transport[id].eol || '';
            } else if (settings.transport[id].type === 'http') {
                settings.transport[id].host       = settings.transport[id].host || '';
                settings.transport[id].port       = settings.transport[id].port || 0;
                settings.transport[id].path       = settings.transport[id].path || '/';
                settings.transport[id].auth       = settings.transport[id].auth || 'None';
                settings.transport[id].ssl        = settings.transport[id].ssl || false;
            } else if (settings.transport[id].type === 'stream') {
                settings.transport[id].stream     = settings.transport[id].stream || '';
                settings.transport[id].level      = settings.transport[id].level  || 'info';
                settings.transport[id].silent     = settings.transport[id].silent || false;
                settings.transport[id].eol        = settings.transport[id].eol    || '';
            }
        });

        this.state = {
            level:     settings.level                    || 'info',
            maxDays:   settings.maxDays                  || 7,
            noStdout:  settings.noStdout                 || true,
            transport: settings.transport                || {},
            expanded:  [],
        };

        this.focusRef = React.createRef();
    }

    componentDidMount() {
        this.focusRef.current && this.focusRef.current.focus();
    }

    onChange() {
        const settings = {
            level:                this.state.level,
            maxDays:              parseInt(this.state.maxDays, 10),
            noStdout:             this.state.noStdout,
            transport: {}
        };

        Object.keys(this.state.transport).forEach(id => {
            settings.transport[id] = JSON.parse(JSON.stringify(this.state.transport[id]));

            if (this.state.transport[id].type === 'file') {
                settings.transport[id].maxSize  = parseInt(settings.transport[id].maxSize, 10)  || null;
                if (settings.transport[id].maxSize) {
                    settings.transport[id].maxSize += 'MB';
                }
                settings.transport[id].maxFiles = parseInt(settings.transport[id].maxFiles, 10) || null;
            } else if (this.state.transport[id].type === 'syslog') {
                !settings.transport[id].port       && delete settings.transport[id].port;
                !settings.transport[id].path       && delete settings.transport[id].path;
                !settings.transport[id].sysLogType && delete settings.transport[id].sysLogType;
                !settings.transport[id].app_name   && delete settings.transport[id].app_name;
                !settings.transport[id].eol        && delete settings.transport[id].eol;
            } else if (this.state.transport[id].type === 'http') {
                settings.transport[id].host       = settings.transport[id].host || '';
                settings.transport[id].port       = parseInt(settings.transport[id].port, 10) || 80;
                settings.transport[id].path       = settings.transport[id].path || '/';
                settings.transport[id].auth       = settings.transport[id].auth || '';
                settings.transport[id].ssl        = settings.transport[id].ssl  || false;
            } else if (this.state.transport[id].type === 'stream') {
                settings.transport[id].stream     = settings.transport[id].stream || '';
                settings.transport[id].level      = settings.transport[id].level  || 'info';
                settings.transport[id].silent     = settings.transport[id].silent || false;
                settings.transport[id].eol        = settings.transport[id].eol    || '';
            }
        });

        this.props.onChange(settings);
    }

    onDelete(id) {
        const transport = JSON.parse(JSON.stringify(this.state.transport));
        delete transport[id];
        this.setState({ transport });
    }

    renderSyslog(name) {
        return <ExpansionPanel expanded={this.state.expanded.includes(name)} onChange={() => {
            const expanded = [...this.state.expanded];
            const pos = expanded.indexOf(name);
            if (pos === -1) {
                expanded.push(name);
            } else {
                expanded.splice(pos, 1);
            }

            this.setState({ expanded });
        }}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} style={{ position: 'relative' }}>
                <Typography className={ this.props.classes.heading }>{ name }</Typography>
                <Fab size="small" className={ this.props.classes.delButton }  onClick={() => this.onDelete(name)}><IconDelete/></Fab>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <Grid container direction="column">
                    <Grid item>
                        <FormControlLabel
                            className={ this.props.classes.controlItem }
                            control={
                                <Checkbox
                                    checked={ this.state.transport[name].enabled }
                                    onChange={ e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].enabled = e.target.checked;
                                        this.setState( { transport }, () => this.onChange())
                                    } }
                                />
                            }
                            label={ this.props.t(`Enabled`) }
                        />
                    </Grid>
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].host }
                            helperText={ this.props.t('The host running syslogd, defaults to localhost')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].host = e.target.value;
                                this.setState( { transport }, () => this.onChange())
                            } }
                            label={ this.props.t('File name') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].port }
                            type="number"
                            helperText={ this.props.t('The port on the host that syslog is running on, defaults to syslogd\'s default port(514/UDP).')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].port = e.target.value;
                                this.setState( { transport }, () => this.onChange());
                            } }
                            label={ this.props.t('Port') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <FormControl className={this.props.classes.controlItem}>
                            <InputLabel>{ this.props.t('Protocol') }</InputLabel>
                            <Select
                                value={ this.state.transport[name].protocol }
                                onChange={ e => {
                                    const transport = JSON.parse(JSON.stringify(this.state.transport));
                                    transport[name].protocol = e.target.value;
                                    this.setState( { transport }, () => this.onChange());
                                }}
                            >
                                <MenuItem value="udp4">udp4</MenuItem>
                                <MenuItem value="tcp4">tcp4</MenuItem>
                                <MenuItem value="unix">unix</MenuItem>
                                <MenuItem value="unix-connect">unix-connect</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].path }
                            helperText={ this.props.t('The path to the syslog dgram socket (i.e. /dev/log or /var/run/syslog for OS X).') }
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].path = e.target.value;
                                this.setState( { transport }, () => this.onChange())
                            } }
                            label={ this.props.t('Path') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].facility }
                            helperText={ this.props.t('Syslog facility to use (Default: local0).')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].facility = e.target.value;
                                this.setState( { transport }, () => this.onChange());
                            } }
                            label={ this.props.t('Facility') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].localhost }
                            helperText={ this.props.t('Host to indicate that log messages are coming from (Default: localhost).')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].localhost = e.target.value;
                                this.setState( { transport }, () => this.onChange());
                            } }
                            label={ this.props.t('Log name') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].sysLogType }
                            helperText={ this.props.t('The type of the syslog protocol to use (Default: BSD).')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].sysLogType = e.target.value;
                                this.setState( { transport }, () => this.onChange());
                            } }
                            label={ this.props.t('SysLog Type') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].app_name }
                            helperText={ this.props.t('The name of the application (Default: process.title).')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].app_name = e.target.value;
                                this.setState( { transport }, () => this.onChange());
                            } }
                            label={ this.props.t('Application name') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].eol }
                            helperText={ this.props.t('The end of line character to be added to the end of the message (Default: Message without modifications).')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].eol = e.target.value;
                                this.setState( { transport }, () => this.onChange());
                            } }
                            label={ this.props.t('End of line char') }
                        />
                    </Grid> : null }
                </Grid>
            </ExpansionPanelDetails>
        </ExpansionPanel>
    }

    renderFile(name) {
        return <ExpansionPanel expanded={this.state.expanded.includes(name)} onChange={() => {
            const expanded = [...this.state.expanded];
            const pos = expanded.indexOf(name);
            if (pos === -1) {
                expanded.push(name);
            } else {
                expanded.splice(pos, 1);
            }

            this.setState({ expanded });
        }}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <Typography className={ this.props.classes.heading }>{ name }</Typography>
                <Fab size="small" className={ this.props.classes.delButton } onClick={() => this.onDelete(name)}><IconDelete/></Fab>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <Grid container direction="column">
                    <Grid item>
                        <FormControlLabel
                            className={ this.props.classes.controlItem }
                            control={
                                <Checkbox
                                    checked={ this.state.transport[name].enabled }
                                    onChange={ e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].enabled = e.target.checked;
                                        this.setState( { transport }, () => this.onChange());
                                    } }
                                />
                            }
                            label={ this.props.t(`Enabled`) }
                        />
                    </Grid>
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].filename }
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].filename = e.target.value;
                                this.setState( { transport }, () => this.onChange())
                            } }
                            label={ this.props.t('File name') }
                        />
                    </Grid> : null }

                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].fileext }
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].fileext = e.target.value;
                                this.setState( { transport }, () => this.onChange())
                            } }
                            label={ this.props.t('File extension') }
                        />
                    </Grid> : null }

                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].maxSize }
                            type="number"
                            helperText={ this.props.t('MB') }
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].maxSize = e.target.value;
                                this.setState( { transport }, () => this.onChange())
                            } }
                            label={ this.props.t('Maximal size of one file') }
                        />
                    </Grid> : null }

                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].maxFiles }
                            type="number"
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].maxFiles = e.target.value;
                                this.setState( { transport }, () => this.onChange())
                            } }
                            label={ this.props.t('Maximal number of files') }
                        />
                    </Grid> : null }
                </Grid>
            </ExpansionPanelDetails>
        </ExpansionPanel>
    }

    renderHttp(name) {
        return <ExpansionPanel expanded={this.state.expanded.includes(name)} onChange={() => {
            const expanded = [...this.state.expanded];
            const pos = expanded.indexOf(name);
            if (pos === -1) {
                expanded.push(name);
            } else {
                expanded.splice(pos, 1);
            }

            this.setState({ expanded });
        }}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} style={{ position: 'relative' }}>
                <Typography className={ this.props.classes.heading }>{ name }</Typography>
                <Fab size="small" className={ this.props.classes.delButton }  onClick={() => this.onDelete(name)}><IconDelete/></Fab>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <Grid container direction="column">
                    <Grid item>
                        <FormControlLabel
                            className={ this.props.classes.controlItem }
                            control={
                                <Checkbox
                                    checked={ this.state.transport[name].enabled }
                                    onChange={ e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].enabled = e.target.checked;
                                        this.setState( { transport }, () => this.onChange())
                                    } }
                                />
                            }
                            label={ this.props.t(`Enabled`) }
                        />
                    </Grid>
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].host }
                            helperText={ this.props.t('Remote host of the HTTP logging endpoint')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].host = e.target.value;
                                this.setState( { transport }, () => this.onChange())
                            } }
                            label={ this.props.t('Host') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].port }
                            type="number"
                            helperText={ this.props.t('Remote port of the HTTP logging endpoint')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].port = e.target.value;
                                this.setState( { transport }, () => this.onChange());
                            } }
                            label={ this.props.t('Port') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].path }
                            helperText={ this.props.t('Remote URI of the HTTP logging endpoint')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].path = e.target.value;
                                this.setState( { transport }, () => this.onChange());
                            } }
                            label={ this.props.t('Path') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].auth }
                            helperText={ this.props.t('An object representing the username and password for HTTP Basic Auth')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].auth = e.target.value;
                                this.setState( { transport }, () => this.onChange());
                            } }
                            label={ this.props.t('Auth') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <FormControlLabel
                            className={ this.props.classes.controlItem }
                            control={
                                <Checkbox
                                    checked={ this.state.transport[name].ssl }
                                    onChange={ e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].ssl = e.target.checked;
                                        this.setState( { transport }, () => this.onChange())
                                    } }
                                />
                            }
                            label={ this.props.t(`SSL`) }
                        />
                    </Grid> : null }
                </Grid>
            </ExpansionPanelDetails>
        </ExpansionPanel>
    }

    renderStream(name) {
        return <ExpansionPanel expanded={this.state.expanded.includes(name)} onChange={() => {
            const expanded = [...this.state.expanded];
            const pos = expanded.indexOf(name);
            if (pos === -1) {
                expanded.push(name);
            } else {
                expanded.splice(pos, 1);
            }

            this.setState({ expanded });
        }}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} style={{ position: 'relative' }}>
                <Typography className={ this.props.classes.heading }>{ name }</Typography>
                <Fab size="small" className={ this.props.classes.delButton }  onClick={() => this.onDelete(name)}><IconDelete/></Fab>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <Grid container direction="column">
                    <Grid item>
                        <FormControlLabel
                            className={ this.props.classes.controlItem }
                            control={
                                <Checkbox
                                    checked={ this.state.transport[name].enabled }
                                    onChange={ e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].enabled = e.target.checked;
                                        this.setState( { transport }, () => this.onChange())
                                    } }
                                />
                            }
                            label={ this.props.t(`Enabled`) }
                        />
                    </Grid>
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].stream }
                            helperText={ this.props.t('any Node.js stream. If an objectMode stream is provided then the entire info object will be written. Otherwise info[MESSAGE] will be written')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].stream = e.target.value;
                                this.setState( { transport }, () => this.onChange())
                            } }
                            label={ this.props.t('File name') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].level }
                            helperText={ this.props.t('Level of messages that this transport should log (default: level set on parent logger)')}
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].level = e.target.value;
                                this.setState( { transport }, () => this.onChange());
                            } }
                            label={ this.props.t('Level') }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <FormControlLabel
                            className={ this.props.classes.controlItem }
                            control={
                                <Checkbox
                                    checked={ this.state.transport[name].silent }
                                    onChange={ e => {
                                        const transport = JSON.parse(JSON.stringify(this.state.transport));
                                        transport[name].silent = e.target.checked;
                                        this.setState( { transport }, () => this.onChange())
                                    } }
                                />
                            }
                            label={ this.props.t(`Silent`) }
                        />
                    </Grid> : null }
                    { this.state.transport[name].enabled ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.transport[name].eol }
                            helperText={ this.props.t('Line-ending character to use. (default: os.EOL).)') }
                            onChange={ e => {
                                const transport = JSON.parse(JSON.stringify(this.state.transport));
                                transport[name].eol = e.target.value;
                                this.setState( { transport }, () => this.onChange())
                            } }
                            label={ this.props.t('EOL') }
                        />
                    </Grid> : null }
                </Grid>
            </ExpansionPanelDetails>
        </ExpansionPanel>
    }

    add(type) {
        if (type === 'file') {
            let i = 1;
            while (Object.keys(this.state.transport).find(id => id === type + i)) {
                i++;
            }
            const name = type + i;
            const transport = JSON.parse(JSON.stringify(this.state.transport));
            transport[name] = {
                type,
                enabled: true,
                filename: 'log/iobroker',
                fileext: '.log',
                maxSize:  0,
                maxFiles: 0
            };
            this.setState( { transport }, () => this.onChange());
        } else if (type === 'syslog') {
            let i = 1;
            while (Object.keys(this.state.transport).find(id => id === type + i)) {
                i++;
            }
            const name = type + i;
            const transport = JSON.parse(JSON.stringify(this.state.transport));
            transport[name] = {
                type,
                enabled:              true,

                host:                 'localhost',
                port:                 0,
                protocol:             'udp4',
                path:                 '',
                facility:             '',
                localhost:            'iobroker',
                sysLogType:           '',
                app_name:             '',
                eol:                  ''
            };
            this.setState( { transport }, () => this.onChange())
        } else if (type === 'http') {
            let i = 1;
            while (Object.keys(this.state.transport).find(id => id === type + i)) {
                i++;
            }
            const name = type + i;
            const transport = JSON.parse(JSON.stringify(this.state.transport));
            transport[name] = {
                type,
                enabled:              true,

                host:                 'localhost',
                port:                 80,
                path:                 '/',
                auth:                 'None',
                ssl:                  false,
            };
            this.setState( { transport }, () => this.onChange())
        } else if (type === 'stream') {
            let i = 1;
            while (Object.keys(this.state.transport).find(id => id === type + i)) {
                i++;
            }
            const name = type + i;
            const transport = JSON.parse(JSON.stringify(this.state.transport));
            transport[name] = {
                type,
                enabled:              true,

                stream:              '/dev/null',
                level:               'info',
                silent:              false,
                eol:                 '',
            };
            this.setState( { transport }, () => this.onChange())
        }
    }

    render() {
        return <Paper className={ this.props.classes.paper }>
            <Toolbar>
                <Button className={ this.props.classes.addButton } variant="contained" onClick={ () => this.add('file') }><IconPlus/>{ this.props.t('File log') }</Button>
                <Button className={ this.props.classes.addButton } variant="contained" onClick={ () => this.add('syslog') }><IconPlus/>{ this.props.t('Syslog') }</Button>
                <Button className={ this.props.classes.addButton } variant="contained" onClick={ () => this.add('http') }><IconPlus/>{ this.props.t('HTTP log') }</Button>
                <Button className={ this.props.classes.addButton } variant="contained" onClick={ () => this.add('stream') }><IconPlus/>{ this.props.t('Stream log') }</Button>
            </Toolbar>
            <Grid item className={ this.props.classes.gridSettings }>
                <Grid container direction="column">
                    <Grid item>
                        <FormControl className={this.props.classes.controlItem}>
                            <InputLabel>{ this.props.t('Type') }</InputLabel>
                            <Select
                                value={ this.state.type }
                                onChange={ e => this.setState( { level: e.target.value }, () => this.onChange()) }
                            >
                                <MenuItem value="silly">silly</MenuItem>
                                <MenuItem value="debug">debug</MenuItem>
                                <MenuItem value="info">info</MenuItem>
                                <MenuItem value="warn">warn</MenuItem>
                                <MenuItem value="error">error</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.maxDays }
                            helperText={ this.props.t('Every day one file') }
                            type="number"
                            onChange={ e => this.setState({ maxDays: e.target.value }, () => this.onChange())}
                            label={ this.props.t('Maximum number of days') }
                        />
                    </Grid>
                    <Grid item>
                        <FormControlLabel
                            className={ this.props.classes.controlItem }
                            control={
                                <Checkbox
                                    checked={ this.state.noStdout }
                                    onChange={ e => this.setState( { noStdout: e.target.checked }, () => this.onChange()) }
                                />
                            }
                            label={ this.props.t(`No stdout outputs`) }
                        />
                    </Grid>
                    { Object.keys(this.state.transport).map(id => {
                        switch (this.state.transport[id].type) {
                            case 'syslog':
                                return this.renderSyslog(id);

                            case 'file':
                                return this.renderFile(id);

                            case 'http':
                                return this.renderHttp(id);

                            case 'stream':
                                return this.renderStream(id);

                            default:
                                return null;
                        }
                    }) }
                </Grid>
            </Grid>
        </Paper>;
    }
}

BaseSettingsLog.propTypes = {
    t: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired,
    currentHost: PropTypes.string,
};

export default withWidth()(withStyles(styles)(BaseSettingsLog));
