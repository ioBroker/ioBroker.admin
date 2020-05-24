import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Paper from  '@material-ui/core/Paper';

//Icons

const styles = theme => ({
    paper: {
        height:    '100%',
        maxHeight: '100%',
        maxWidth:  '100%',
        overflow:  'auto',
        padding:   theme.spacing(1),
    },
    controlItem: {
        width: 400,
        marginBottom: theme.spacing(2),
        marginRight: theme.spacing(1),
        marginLeft: theme.spacing(1),
    },
});

class BaseSettingsObjects extends React.Component {
    constructor(props) {
        super(props);

        const settings   = this.props.settings || {};
        settings.options = settings.options || {};
        settings.backup  = settings.backup || {};

        this.state = {
            type:                    settings.type              || 'file',
            host:                    settings.host              || '127.0.0.1',
            port:                    settings.port              || 9001,
            user:                    settings.user              || '',
            pass:                    settings.pass              || '',
            noFileCache:             settings.noFileCache       || false,
            connectTimeout:          settings.connectTimeout    || 2000,
            writeFileInterval:       settings.writeFileInterval || 5000,
            options_auth_pass:       settings.options.auth_pass       || null,
            options_retry_max_delay: settings.options.retry_max_delay || 2000,
            options_retry_max_count: settings.options.retry_max_count || 19,
            options_db:              settings.options.db        || 0,
            options_family:          settings.options.family    || 0,
            backup_disabled:         settings.backup.disabled   || false,
            backup_files:            settings.backup.files      || 24,
            backup_hours:            settings.backup.hours      || 48,
            backup_period:           settings.backup.period     || 120,
            backup_path:             settings.backup.path       || '',

            IPs:          ['0.0.0.0', '127.0.0.1'],
            loading:      true,
        };

        this.focusRef = React.createRef();

        this.props.socket.getIpAddresses(this.props.currentHost)
            .then(_IPs => {
                const IPs = [..._IPs];
                !IPs.includes('0.0.0.0') && IPs.push('0.0.0.0');
                !IPs.includes('127.0.0.1') && IPs.push('127.0.0.1');
                this.setState({ IPs, loading: false });
            })
    }

    componentDidMount() {
        this.focusRef.current && this.focusRef.current.focus();
    }

    onChange() {
        this.props.onChange({
            type:                this.state.type,
            host:                this.state.host,
            port:                this.state.port,
            user:                this.state.user,
            pass:                this.state.pass,
            noFileCache:         this.state.noFileCache,
            connectTimeout:      this.state.connectTimeout,
            writeFileInterval:   this.state.writeFileInterval,
            options: {
                auth_pass:       this.state.options_auth_pass,
                retry_max_delay: this.state.options_retry_max_delay,
                retry_max_count: this.state.options_retry_max_count,
                db:              this.state.options.db,
                family:          this.state.options.family,
            },
            backup: {
                disabled:        this.state.backup_disabled,
                files:           this.state.backup_files,
                hours:           this.state.backup_hours,
                period:          this.state.backup_period,
                path:            this.state.backup_path,
            },
        });
    }

    render() {
        return <Paper className={ this.props.classes.paper }>
            <Grid item className={ this.props.classes.gridSettings }>
                <Grid container direction="column">
                    <Grid item>
                        <FormControl className={this.props.classes.controlItem}>
                            <InputLabel>{ this.props.t('Type') }</InputLabel>
                            <Select
                                value={ this.state.type }
                                onChange={ e => {
                                    let port;
                                    if (e.target.value === 'redis') {
                                        port = 6379;
                                    } else if (e.target.value === 'redis') {
                                        port = 9001;
                                    }
                                    this.setState({ type: e.target.value, port});
                                }}
                            >
                                <MenuItem value="file">{ this.props.t('File') }</MenuItem>
                                <MenuItem value="redis">Redis</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>


                    <Grid item>
                        <FormControl className={this.props.classes.controlItem}>
                            <InputLabel>{ this.props.t('Bind IP address') }</InputLabel>
                            <Select
                                value={ this.state.host }
                                onChange={ e => this.setState({ host: e.target.value })}
                            >
                                { this.state.IPs.map(ip => <MenuItem key={ ip } value={ ip }>{ ip === '0.0.0.0' ? `0.0.0.0 [${ this.props.t('All addresses') }]` : ip }</MenuItem>) }
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.port }
                            type="number"
                            min={ 1 }
                            max={ 65535 }
                            onChange={ e => this.setState({ port: parseInt(e.target.value, 10) })}
                            label={ this.props.t('Port') }
                        />
                    </Grid>

                    { this.state.type === 'file' ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.pass }
                            type="password"
                            helperText={ this.props.t('Optional') }
                            inputProps={{
                                autoComplete: 'new-password',
                                form: {
                                    autoComplete: 'off',
                                },
                            }}
                            autoComplete="off"
                            onChange={ e => this.setState({ pass: e.target.value })}
                            label={ this.props.t('Password') }
                        />
                    </Grid> : null }

                    { this.state.type === 'file' ? <Grid item>
                        <FormControlLabel
                            className={ this.props.classes.controlItem }
                            control={
                                <Checkbox
                                    checked={ this.state.noFileCache }
                                    onChange={ e => this.setState( { noFileCache: e.target.checked }, () => this.onChange()) }
                                />
                            }
                            label={ this.props.t(`No file cache`) }
                        />
                        <div>{ this.props.t('Always read files from disk and do not cache them in RAM. Used for debugging.') }</div>
                    </Grid> : null }

                    { this.state.type === 'file' ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.connectTimeout }
                            helperText={ this.props.t('ms') }
                            type="number"
                            min={ 200 }
                            onChange={ e => this.setState({ connectTimeout: e.target.value })}
                            label={ this.props.t('Connect timeout') }
                        />
                        <div>{ this.props.t('Always read files from disk and do not cache them in RAM. Used for debugging.') }</div>
                    </Grid> : null }

                    { this.state.type === 'file' ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.writeFileInterval }
                            helperText={ this.props.t('ms') }
                            type="number"
                            min={ 200 }
                            onChange={ e => this.setState({ writeFileInterval: e.target.value })}
                            label={ this.props.t('Store file interval') }
                        />
                        <div>{ this.props.t('How often the data from RAM will be saved on disk.') }</div>
                    </Grid> : null }

                    { this.state.type === 'redis' ? <Grid item>
                        <TextField
                            className={ this.props.classes.controlItem }
                            value={ this.state.options_auth_pass }
                            type="password"
                            helperText={ this.props.t('Optional') }
                            inputProps={{
                                autoComplete: 'new-password',
                                form: {
                                    autoComplete: 'off',
                                },
                            }}
                            autoComplete="off"
                            onChange={ e => this.setState({ options_auth_pass: e.target.value })}
                            label={ this.props.t('Redis password') }
                        />
                    </Grid> : null }
                </Grid>
            </Grid>
        </Paper>;
    }
}

BaseSettingsObjects.propTypes = {
    t: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired,
    currentHost: PropTypes.string,
};

export default withWidth()(withStyles(styles)(BaseSettingsObjects));
