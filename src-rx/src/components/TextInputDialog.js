import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import withWidth from "@material-ui/core/withWidth";
import {withStyles} from "@material-ui/core/styles";
import PropTypes from "prop-types";

const styles = {

};

class TextInputDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            text: this.props.input || '',
            error: ''
        }
    }
    render() {
        return <Dialog open={true} onClose={() => this.props.onClose(null)} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">{this.props.titleText}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {this.props.promptText}
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    error={!!this.state.error}
                    title={this.state.error}
                    value={this.state.text}
                    label={this.props.labelText || ''}
                    type={this.props.type || 'text'}
                    onKeyPress={e => e.charCode === 13 && this.state.text && this.props.onClose(this.state.text)}
                    onChange={e => {
                        let error = '';
                        if (this.props.verify) {
                            error = !this.props.verify(e.target.value);
                        }

                        if (this.props.rule) {
                            this.setState({text: this.props.rule(e.target.value), error});
                        } else {
                            this.setState({text: e.target.value, error});
                        }
                    }}
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => this.props.onClose(null)} >{this.props.cancelText}</Button>
                <Button disabled={!this.state.text || this.state.error} onClick={() => this.props.onClose(this.state.text)}
                        color="primary">{this.props.applyText}</Button>
            </DialogActions>
        </Dialog>;
    }
}

TextInputDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    titleText: PropTypes.string.isRequired,
    promptText: PropTypes.string,
    labelText: PropTypes.string,
    cancelText: PropTypes.string.isRequired,
    applyText: PropTypes.string.isRequired,
    verify: PropTypes.func,
    replace: PropTypes.func,
    type: PropTypes.string, // text, number, password, email
    input: PropTypes.string,
};

export default withWidth()(withStyles(styles)(TextInputDialog));