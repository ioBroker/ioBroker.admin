import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

import Utils from "../Utils";

// Icons
import {FaCheck as ApplyIcon} from 'react-icons/fa';
import CloseIcon from '@material-ui/icons/Close';
import ObjectCustomsEditor from "./ObjectCustomsEditor";

const styles = theme => ({
    dialog: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
    },
    content: {
        textAlign: 'center',
    },
    textarea: {
        width: '100%',
        height: '100%',
    },
    img: {
        width: 'auto',
        height: 'calc(100% - 5px)',
        objectFit: 'contain',
    }
});

export const EXTENSIONS = {
    images: ['png', 'jpg', 'svg', 'jpeg'],
    code:   ['js', 'json'],
    txt:    ['log', 'txt', 'html', 'css', 'xml'],
};

class ObjectCustomDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {

        };
    }

    getContent() {
        return <ObjectCustomsEditor { ...this.props }/>;
    }

    onSave() {

    }

    render() {
        return <Dialog
            className={ this.props.classes.dialog }
            open={ true }
            onClose={ () => this.props.onClose() }
            fullWidth={ true }
            fullScreen={ true }
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">{
                this.props.objectIDs.length > 1 ?
                    this.props.t('Edit config for %s states', this.props.objectIDs.length) :
                    this.props.t('Edit config: %s', this.props.objectIDs[0])
            }</DialogTitle>
            <DialogContent className={ this.props.classes.content }>
                { this.getContent() }
            </DialogContent>
            <DialogActions>
                <Button onClick={() => this.props.onSave()}  color="primary"><ApplyIcon />{ this.props.t('Save') }</Button>
                <Button onClick={() => this.props.onClose()} ><CloseIcon />{ this.props.t('Close') }</Button>
            </DialogActions>
        </Dialog>;
    }
}

ObjectCustomDialog.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    objects: PropTypes.object,
    socket: PropTypes.object,
    customsInstances: PropTypes.array,
    objectIDs: PropTypes.array,
    onClose: PropTypes.func,
};

export default withWidth()(withStyles(styles)(ObjectCustomDialog));
