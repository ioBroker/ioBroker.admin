import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';

import clsx from 'clsx';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';

import NoImage from "../assets/no-image.png";
import Utils from "../Utils";

const styles = theme => ({
    textarea: {
        width: '100%',
        height: '100%',
    }
});

const EXTENSIONS = {
    images: ['png', 'jpg', 'svg', 'jpeg'],
    code: ['js', 'json'],
    txt: ['log', 'txt', 'html', 'css', 'xml'],
};

class FileViewer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            text: null,
            code: null,
        };

        this.ext = Utils.getFileExtension(this.props.href);

        if (EXTENSIONS.code.includes(this.ext) || EXTENSIONS.txt.includes(this.ext)) {
            fetch(this.props.href)
                .then(response => response.json())
                .then(data => {
                    if (EXTENSIONS.txt.includes(this.ext)) {
                        this.setState({text: data});
                    } else if (EXTENSIONS.code.includes(this.ext)) {
                        this.setState({code: data});
                    }
                });
        }
    }

    getContent() {
        if (EXTENSIONS.images.includes(this.ext)) {
            return <img
                onError={e => {
                    e.target.onerror = null;
                    e.target.src = NoImage
                }}
                className={this.props.classes['itemImage' + this.state.viewType]}
                src={ this.props.href } alt={ this.props.href }/>;
        } else if (this.state.code !== null) {
            return <TextField
                className={ this.props.classes.textarea }
                multiline
                readOnly={true}>{ this.state.code }</TextField>;
        } else  if (this.state.text !== null) {
            return <TextField
                className={ this.props.classes.textarea }
                multiline
                readOnly={true}>{ this.state.text }</TextField>;
        }
    }

    render() {
        return <Dialog
            open={this.props.href}
            onClose={() => this.props.onClose()}
            fullWidth={true}
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">{this.props.t('View: %s', this.href)}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    { this.getContent() }
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => this.props.onClose()} color="primary">{this.props.t('Close')}</Button>
            </DialogActions>
        </Dialog>;
    }
}

FileViewer.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    onClose: PropTypes.func,
    href: PropTypes.string.isRequired
};

export default withWidth()(withStyles(styles)(FileViewer));
