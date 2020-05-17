import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import copy from 'copy-to-clipboard';

import NoImage from "../assets/no-image.png";
import Utils from "../Utils";

// Icons
import {FaCopy as CopyIcon} from 'react-icons/fa';
import CloseIcon from '@material-ui/icons/Close';

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

class FileViewer extends React.Component {
    constructor(props) {
        super(props);

        this.ext = Utils.getFileExtension(this.props.href);

        this.state = {
            text: null,
            code: null,
            copyPossible: EXTENSIONS.code.includes(this.ext) || EXTENSIONS.txt.includes(this.ext)
        };

        if (this.state.copyPossible) {
            fetch(this.props.href)
                .then(response => response.text())
                .then(data => {
                    if (EXTENSIONS.txt.includes(this.ext)) {
                        this.setState({text: data});
                    } else if (EXTENSIONS.code.includes(this.ext)) {
                        this.setState({code: data});
                    }
                });
        }
    }

    static getDerivedStateFromProps() {

    }

    getContent() {
        if (EXTENSIONS.images.includes(this.ext)) {
            return <img
                onError={ e => {
                    e.target.onerror = null;
                    e.target.src = NoImage
                } }
                className={ this.props.classes.img }
                src={ this.props.href } alt={ this.props.href }/>;
        } else if (this.state.code !== null) {
            return <TextField
                className={ this.props.classes.textarea }
                multiline
                value={ this.state.code }
                readOnly={true}/>;
        } else  if (this.state.text !== null) {
            return <TextField
                className={ this.props.classes.textarea }
                value={ this.state.code }
                multiline
                readOnly={true}/>;
        }
    }

    render() {
        return <Dialog
            className={ this.props.classes.dialog }
            open={ this.props.href }
            onClose={ () => this.props.onClose() }
            fullWidth={ true }
            fullScreen={ true }
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">{ this.props.t('View: %s', this.props.href) }</DialogTitle>
            <DialogContent className={ this.props.classes.content }>
                    { this.getContent() }
            </DialogContent>
            <DialogActions>
                { this.state.copyPossible ? <Button onClick={() => copy(this.state.text || this.state.code) } >
                    <CopyIcon />
                    { this.props.t('Copy content') }
                </Button> : null }

                <Button onClick={() => this.props.onClose()} color="primary">
                    <CloseIcon />
                    { this.props.t('Close') }
                </Button>
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
