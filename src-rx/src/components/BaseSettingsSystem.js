import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Fab from '@material-ui/core/Fab';

import Paper from  '@material-ui/core/Paper';

//Icons

const styles = theme => ({
    paper: {
        height:    '100%',
        maxHeight: '100%',
        maxWidth:  '100%',
        overflow:  'auto',
    },
});

class BaseSettingsSystem extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            memoryLimitMB:         this.props.settings.memoryLimitMB         || 0,
            hostname:              this.props.settings.hostname              || '',
            statisticsInterval:    this.props.settings.statisticsInterval    || 15000,
            checkDiskInterval:     this.props.settings.checkDiskInterval     || 300000,
            noChmod:               this.props.settings.noChmod               || false,
            instanceStartInterval: this.props.settings.instanceStartInterval || 2000,
            compact:               this.props.settings.compact               || false,
            allowShellCommands:    this.props.settings.allowShellCommands    || false,
            memLimitWarn:          this.props.settings.memLimitWarn          || 100,
            memLimitError:         this.props.settings.memLimitError         || 50,
        };

        this.focusRef = React.createRef();
    }

    componentDidMount() {
        this.focusRef.current && this.focusRef.current.focus();
    }

    onChange() {
        this.props.onChange({
            memoryLimitMB:         this.state.settings.memoryLimitMB,
            hostname:              this.state.hostname,
            statisticsInterval:    this.state.statisticsInterval,
            checkDiskInterval:     this.state.checkDiskInterval,
            noChmod:               this.state.noChmod,
            instanceStartInterval: this.state.instanceStartInterval,
            compact:               this.state.compact,
            allowShellCommands:    this.state.allowShellCommands,
            memLimitWarn:          this.state.memLimitWarn,
            memLimitError:         this.state.memLimitError,
        });
    }

    render() {
        return <Paper className={ this.props.classes.paper }>
            <Grid item className={ this.props.classes.gridSettings }>
                <Grid container direction="column">
                    <Grid item>
                        <TextField
                            label={ this.props.t('Host name') }
                            className={ this.props.classes.controlItem }
                            value={ this.state.hostname }
                            onChange={ e => this.setState( {hostname: e.target.value }, () => this.onChange())}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Paper>;
    }
}

BaseSettingsSystem.propTypes = {
    t: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired,
};

export default withWidth()(withStyles(styles)(BaseSettingsSystem));
