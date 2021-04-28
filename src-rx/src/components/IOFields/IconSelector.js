import React, { Component } from 'react';
import PropTypes from 'prop-types';

import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';

import CloseIcon from '@material-ui/icons/Close';

class IconSelector extends Component {
    constructor(props) {
        super(props);
        this.state = {
            opened: false,
        }
    }

    static getSvg(url) {
        return fetch(url)
            .then(response => response.blob())
            .then(blob => {
                return new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = function() {
                        resolve(this.result);
                    };
                    reader.readAsDataURL(blob);
                });
            }) ;
    }

    render() {
        if (!this.props.icons) {
            return null;
        }

        return <>
            <Button
                variant="outlined"
                title={this.props.t('Select predefined icon')}
                onClick={() => this.setState({opened: true})} style={{minWidth: 40, marginRight: 8}}
            >...</Button>
            {this.state.opened ? <Dialog onClose={() => this.setState({opened: false})} open={true}>
                <DialogTitle>{this.props.t('Select predefined icon')}</DialogTitle>
                <DialogContent>
                    <div style={{width: 340}}>
                        {this.props.icons.map((href, i) => (
                            <IconButton
                                key={i}
                                onClick={e =>
                                    this.setState({opened: false}, () =>
                                        IconSelector.getSvg(href)
                                            .then(base64 => this.props.onSelect(base64)))}
                            >
                                <img src={href} alt={i} style={{width: 32, height: 32, borderRadius: 5}}/>
                            </IconButton>
                        ))}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setState({opened: false})} color="primary" autoFocus>
                        <CloseIcon style={{marginRight: 8}}/>{this.props.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog> : null}
        </>
    }
}

IconSelector.propTypes = {
    icons: PropTypes.array,
    onSelect: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};

export default IconSelector;