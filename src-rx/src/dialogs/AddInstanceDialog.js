import { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';

const styles = theme => ({
    formControl: {
        marginTop: theme.spacing(3)
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
    paper: {
        //minWidth: 600
    },
    typography: {
        paddingRight: 30
    }
});

class AddInstanceDialog extends Component {

    constructor(props) {
        super(props);

        this.t = props.t;
    }

    getHosts() {
        return this.props.hosts.map(host => {
            return <MenuItem value={host.common.name} key={host._id}>{host.common.name}</MenuItem>
        });
    }

    getAvailableInstances() {

        const result = [];
        const instanceNumber = {};

        if (!this.props.instances) {
            return null;
        }

        for (let i = 0; i < this.props.instances.length; i++) {

            const instance = this.props.instances[i];

            if (instance.common && instance.common.name === this.props.adapter) {
                const id = instance._id.substring(instance._id.lastIndexOf('.') + 1);

                instanceNumber[id] = true;
            }
        }

        result.push(<MenuItem value="auto" key="auto">{this.t('auto')}</MenuItem>);

        for (let i = 0; i <= 10; i++) {
            if (!instanceNumber[i]) {
                result.push(<MenuItem value={`${i}`} key={i}>{i}</MenuItem>);
            }
        }

        return result;
    }

    checkDependencies = (dependencies = this.props.dependencies) => {
        if (!dependencies) {
            return '';
        }
        for (let adapter of dependencies) {
            if (adapter.name === 'js-controller') {
                if (!adapter.rightVersion) {
                    return this.props.t('Invalid version of %s. Required %s', adapter.name, adapter.version);
                }
            } else {
                if (!adapter.installedVersion) {
                    return this.props.t('No version of %s', adapter.name);
                }
                if (!adapter.rightVersion) {
                    return this.props.t('Invalid version of %s', adapter.name);
                }
            }
        }
        return '';
    }

    render() {

        const { classes } = this.props;

        const checkDeps = this.checkDependencies();

        return (
            <Dialog
                onClose={this.props.onClose}
                open={this.props.open}
                classes={{ paper: classes.paper }}
            >
                <DialogTitle disableTypography={true}>
                    <Typography component="h2" variant="h6" classes={{ root: classes.typography }}>
                        {this.t('You are going to add new instance: ')} {this.props.adapter}
                        <IconButton className={classes.closeButton} onClick={this.props.onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    {!checkDeps ? <Grid
                        container
                        direction="column"
                    >
                        <FormControl
                            disabled={this.props.hosts && this.props.hosts.length <= 1 ? true : false}
                        >
                            <InputLabel id="host-label">{this.t('Host')}</InputLabel>
                            <Select
                                labelId="host-label"
                                value={this.props.currentHost}
                                onChange={this.props.onHostChange}
                            >
                                {this.getHosts()}
                            </Select>
                        </FormControl>
                        <FormControl
                            className={classes.formControl}
                        >
                            <InputLabel id="instance-label">{this.t('Instance')}</InputLabel>
                            <Select
                                labelId="instance-label"
                                value={this.props.currentInstance}
                                onChange={this.props.onInstanceChange}
                            >
                                {this.getAvailableInstances()}
                            </Select>
                        </FormControl>
                    </Grid> : null}
                    <div style={{
                        margin: 10,
                        fontSize: 16,
                        color: '#840101'
                    }}>{checkDeps}</div>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        autoFocus
                        disabled={!!checkDeps}
                        onClick={() => {
                            this.props.onClick();
                            this.props.onClose();
                        }}
                        color="primary">
                        {this.t('Add')}
                    </Button>
                    <Button
                        variant="contained"
                        autoFocus
                        onClick={() => {
                            this.props.onClose();
                        }}
                        color="default">
                        {this.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

AddInstanceDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    adapter: PropTypes.string.isRequired,
    hosts: PropTypes.array.isRequired,
    instances: PropTypes.array.isRequired,
    currentHost: PropTypes.string.isRequired,
    currentInstance: PropTypes.string.isRequired,
    t: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onHostChange: PropTypes.func.isRequired,
    onInstanceChange: PropTypes.func.isRequired
}

export default withStyles(styles)(AddInstanceDialog);