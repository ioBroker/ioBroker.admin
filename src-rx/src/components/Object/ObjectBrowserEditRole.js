import React, { Component } from 'react';
import {withStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Autocomplete from '@material-ui/lab/Autocomplete';
import LinearProgress from '@material-ui/core/LinearProgress';

import IconCancel from '@material-ui/icons/Close';
import IconCheck from '@material-ui/icons/Check';

const styles = theme => ({
    input: {
        marginBottom: theme.spacing(2),
    },
    inputText: {
        width: 400,
        height: 300,
        marginBottom: theme.spacing(2),
    },
    formControl: {
        marginBottom: theme.spacing(2),
        minWidth: 150,
    },
    quality: {
        width: '100%'
    }
});

class ObjectBrowserEditRole extends Component {
    constructor(props) {
        super(props);

        this.state = {
            role: null,
        };
    }

    componentDidMount() {
        this.props.socket.getObject(this.props.id)
            .then(obj => {
                this.object = obj;
                this.setState({role: obj?.common?.role || ''});
            })
            .catch(e => console.error(e));
    }

    onUpdate() {
        this.object.common = this.object.common || {};
        this.object.common.role = this.state.role;
        this.props.socket.setObject(this.object._id, this.object)
            .then(() => this.props.onClose(this.object));
    }

    render() {
        return <Dialog
            key="objectBrowserEditRole"
            open={ true }
            maxWidth="sm"
            fullWidth={true}
            onClose={ () => this.props.onClose() }
            aria-labelledby="edit-role-dialog-title"
            aria-describedby="edit-role-dialog-description"
        >
            <DialogTitle id="edit-role-dialog-title">{ this.object ? this.props.t('Update role for %s', this.object._id) : null}</DialogTitle>
            <DialogContent>
                {this.state.role === null ? <LinearProgress/> :
                <Autocomplete
                    freeSolo
                    options={this.props.roles}
                    //getOptionLabel={option => option.title}
                    style={{ width: '100%' }}
                    value={this.state.role}
                    onChange={(event, role) => this.setState({role})}
                    renderInput={params => <TextField
                        {...params}
                        label={this.props.t('Role')}
                        variant="outlined"
                    />}
                />}
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={ () => this.onUpdate() }      color="primary"><IconCheck/>{   this.props.t('Apply') }</Button>
                <Button variant="contained" onClick={ () => this.props.onClose() } color="default"><IconCancel/>{ this.props.t('Cancel') }</Button>
            </DialogActions>
        </Dialog>;
    }
}

ObjectBrowserEditRole.propTypes = {
    classes: PropTypes.object,
    roles: PropTypes.array,
    id: PropTypes.string,
    socket: PropTypes.object,
    onClose: PropTypes.func.isRequired,

    t: PropTypes.func,
};

export default withStyles(styles)(ObjectBrowserEditRole);
