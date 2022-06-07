import React, { Component } from 'react';

import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

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
                    <IconButton size="large" className={classes.closeButton} onClick={this.props.onClose}>
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
                    color="grey"
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
