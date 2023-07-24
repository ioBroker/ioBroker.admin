import React, { Component } from 'react';

import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

import HostSelectors from '../components/HostSelectors';

const styles = theme => ({
    formControl: {
        marginTop: theme.spacing(3),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
    paper: {
        // minWidth: 600
    },
    typography: {
        paddingRight: 30,
    },
});

class AddInstanceDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            instanceNumbers: [],
        };
        this.t = props.t;
    }

    componentDidMount() {
        this.props.instancesWorker.getInstances()
            .then(instances => {
                const instanceNumbers = Object.keys(instances)
                    .filter(id => instances[id]?.common?.name === this.props.adapter)
                    .map(id => id.substring(id.lastIndexOf('.') + 1));

                this.setState({ instanceNumbers });
            });
    }

    getAvailableInstances() {
        const result = [];
        result.push(<MenuItem value="auto" key="auto">{this.t('auto')}</MenuItem>);

        for (let i = 0; i <= 10; i++) {
            if (!this.state.instanceNumbers.includes(i)) {
                result.push(<MenuItem value={`${i}`} key={i}>{i}</MenuItem>);
            }
        }

        return result;
    }

    checkDependencies = (dependencies = this.props.dependencies) => {
        if (!dependencies) {
            return '';
        }
        const array = [];
        for (const adapter of dependencies) {
            if (!adapter.installedVersion) {
                array.push(this.props.t('Latest available version of "%s" is required, but nothing installed. Please install first "%s" and then retry.', adapter.name, adapter.name));
            } else if (!adapter.rightVersion) {
                array.push(`${this.props.t('Invalid version of %s. Required %s. Current ', adapter.name, adapter.version)}${adapter.installedVersion}`);
            }
        }
        return array.length ? array.map(el => <div key={el}>{el}</div>) : '';
    };

    render() {
        const { classes } = this.props;

        const checkDeps = this.checkDependencies();

        return <Dialog
            onClose={this.props.onClose}
            open={!0}
            classes={{ paper: classes.paper }}
        >
            <DialogTitle>
                <Typography component="h2" variant="h6" classes={{ root: classes.typography }}>
                    {this.t('You are going to add new instance:')}
                    {' '}
                    {this.props.adapter}
                    <IconButton size="large" className={classes.closeButton} onClick={this.props.onClose}>
                        <CloseIcon />
                    </IconButton>
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {!checkDeps ? <Grid
                    container
                    direction="column"
                >
                    <HostSelectors
                        tooltip={this.t('Select host to add the instance')}
                        expertMode
                        socket={this.props.socket}
                        hostsWorker={this.props.hostsWorker}
                        currentHost={this.props.currentHost}
                        setCurrentHost={(hostName, hostId) =>
                            this.props.onHostChange(hostId.replace(/^system\.host\./, ''))}
                    />
                    <FormControl variant="standard" className={classes.formControl}>
                        <InputLabel id="instance-label">{this.t('Instance')}</InputLabel>
                        <Select
                            variant="standard"
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
                    color: this.props.themeType === 'dark' ? '#e70000' : '#840101',
                }}
                >
                    {checkDeps}
                </div>
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
                    color="primary"
                    startIcon={<AddIcon />}
                >
                    {this.t('Add')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => this.props.onClose()}
                    color="grey"
                    startIcon={<CloseIcon />}
                >
                    {this.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

AddInstanceDialog.propTypes = {
    themeType: PropTypes.string,
    adapter: PropTypes.string.isRequired,
    instancesWorker: PropTypes.object.isRequired,
    socket: PropTypes.object,
    currentHost: PropTypes.string.isRequired,
    currentInstance: PropTypes.string.isRequired,
    t: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onHostChange: PropTypes.func.isRequired,
    onInstanceChange: PropTypes.func.isRequired,
};

export default withStyles(styles)(AddInstanceDialog);
