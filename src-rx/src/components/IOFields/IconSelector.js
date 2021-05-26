import React, { Component } from 'react';
import PropTypes from 'prop-types';

import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';

import CloseIcon from '@material-ui/icons/Close';

import Icon from '@iobroker/adapter-react/Components/Icon';

import Utils from '../Utils';
import {TextField} from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";

class IconSelector extends Component {
    constructor(props) {
        super(props);
        this.state = {
            opened: false,
            names: [],
            filter: ''
        };
    }

    componentDidMount() {
        this.setState({loading: true}, () => {
            const icons = [];
            const names = [];

            const promises = this.props.icons ? this.props.icons.map((item, i) => {
                let href;
                if (typeof item === 'object') {
                    href = item.icon || item.src || item.href;
                    names[i] = typeof item.name === 'object' ? item.name[this.props.lang] || item.name.en || item._id : item.name;
                    if (!names[i]) {
                        const parts = href.split('.');
                        parts.pop();
                        names[i] = parts[parts.length - 1];
                    }
                } else {
                    href = item;
                }

                if (href) {
                    if (href.startsWith('data:')) {
                        icons[i] = href;
                        return Promise.resolve();
                    } else {
                        return Utils.getSvg(href)
                            .then(icon =>
                                icons[i] = icon);
                    }
                } else {
                    return Promise.resolve();
                }
            }) : [];

            Promise.all(promises)
                .then(() =>
                    this.setState({icons, loading: false, names, isAnyName: names.find(i => i)}));
        });
    }

    render() {
        if (!this.props.icons) {
            return null;
        }
        if (this.state.loading) {
            return <LinearProgress />;
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
                    {this.state.isAnyName ? <TextField
                            value={this.state.filter}
                            onChange={e => this.setState({filter: e.target.value.toLowerCase()})}
                            label={this.props.t('Filter')}
                            InputProps={{
                                endAdornment: this.state.filter
                                    ?
                                    <IconButton
                                        size="small"
                                        onClick={() => this.setState({filter: ''})}>
                                        <ClearIcon />
                                    </IconButton>
                                    :
                                    undefined,
                            }}
                        /> : null}
                    <div style={{width: 340}}>
                        {this.state.icons.map((icon, i) => {
                            if (!this.state.filter || (this.state.names[i] && this.state.names[i].toLowerCase().includes(this.state.filter))) {
                                return <IconButton
                                    title={this.state.names[i] || ''}
                                    key={i}
                                    onClick={e =>
                                        this.setState({opened: false}, () =>
                                            this.props.onSelect(icon))}
                                >
                                    <Icon src={icon} alt={i} style={{width: 32, height: 32, borderRadius: 5}}/>
                                </IconButton>
                            } else {
                                return null;
                            }
                        })}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setState({opened: false})} color="primary" autoFocus
                            startIcon={<CloseIcon />}
                    >
                        {this.props.t('Close')}
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
    lang: PropTypes.string.isRequired,
};

export default IconSelector;