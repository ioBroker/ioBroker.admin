import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import CloseIcon from '@material-ui/icons/Close';
import CheckIcon from "@material-ui/icons/Check";

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
    typography: {
        paddingRight: 30
    }
});

class AdapterDeletionDialog extends Component {

    constructor(props) {
        super(props);

        this.state = {
            deleteCustom: false,
            deleteCustomSupported: false,
        };
        this.t = props.t;
    }

    componentDidMount() {
        this.props.socket.checkFeatureSupported('DEL_INSTANCE_CUSTOM')
            .then(deleteCustomSupported => {
                deleteCustomSupported && this.props.socket.getObject('system.adapter.' + this.props.adapter)
                    .then(obj => {
                        if (obj && obj.common) {
                            obj.common.supportCustoms && this.setState({deleteCustomSupported: obj.common.supportCustoms})
                        } else {
                            this.setState({deleteCustomSupported: true});
                        }
                    });
            });
    }

    render() {

        const { classes } = this.props;

        return <Dialog
            onClose={this.props.onClose}
            open={this.props.open}
        >
            <DialogTitle disableTypography={true}>
                <Typography component="h2" variant="h6" classes={{ root: classes.typography }}>
                    {this.t('Please confirm')}
                    <IconButton className={classes.closeButton} onClick={this.props.onClose}>
                        <CloseIcon />
                    </IconButton>
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                <Typography gutterBottom>
                    {this.t('Are you sure you want to delete adapter %s?', this.props.adapter)}
                </Typography>
                {this.state.deleteCustomSupported && <FormControlLabel
                    control={<Checkbox checked={this.state.deleteCustom} onChange={e => this.setState({deleteCustom: e.target.checked})} />}
                    label={this.t('Delete all custom object settings of this adapter too')}
                />}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    autoFocus
                    onClick={() => {
                        this.props.onClick(this.state.deleteCustom);
                        this.props.onClose();
                    }}
                    color="primary"
                    startIcon={<CheckIcon/>}
                >
                    {this.t('Ok')}
                </Button>
                <Button
                    variant="contained"
                    autoFocus
                    onClick={() => this.props.onClose()}
                    color="default"
                    startIcon={<CloseIcon />}
                >
                    {this.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

AdapterDeletionDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    adapter: PropTypes.string.isRequired,
    t: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
}

export default withStyles(styles)(AdapterDeletionDialog);
