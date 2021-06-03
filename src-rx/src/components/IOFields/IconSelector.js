import React, { Component } from 'react';
import PropTypes from 'prop-types';

import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';

import CloseIcon from '@material-ui/icons/Close';
import ClearIcon from '@material-ui/icons/Clear';

import Icon from '@iobroker/adapter-react/Components/Icon';

import Utils from '../Utils';

import devices from '../../assets/devices/list.json';
import rooms from '../../assets/rooms/list.json';

class IconSelector extends Component {
    constructor(props) {
        super(props);
        this.state = {
            opened: false,
            names: [],
            filter: '',
            icons: props.icons || null,
        };
    }

    loadAllIcons() {
        if (this.state.loading || this.state.icons) {
            return;
        }
        this.setState({loading: true}, () => {
            const icons = [];
            const names = [];

            if (!this.props.icons) {
                let templates = this.props.onlyRooms || (this.props.onlyRooms === undefined && this.props.onlyDevices === undefined) ? rooms : null;

                const promises = [];
                if (templates) {
                    templates.forEach(item => {
                        if (item.name && typeof item.name === 'object') {
                            item.name = item.name[this.props.lang] || item.name.en || item._id;
                        }
                        item.name = item.name || item._id;
                    });

                    templates = templates.filter((item, i) => !templates.find((_item, _i) => i !== _i && _item.icon === item.icon && _item.name === item.name));

                    templates.forEach((template, i) => {
                        let image;
                        try {
                            image = require(`../../assets/rooms/${template.icon}`);
                        } catch (e) {
                            return Promise.resolve(null);
                        }

                        names[i] = template.name;

                        promises.push(Utils.getSvg(image.default)
                            .then(icon =>
                                icons[i] = icon));
                    });
                }

                templates = this.props.onlyDevices || (this.props.onlyRooms === undefined && this.props.onlyDevices === undefined) ? devices : null;
                if (templates) {
                    const offset = promises.length;
                    templates && templates.forEach(item => {
                        if (item.name && typeof item.name === 'object') {
                            item.name = item.name[this.props.lang] || item.name.en || item._id;
                        }
                        item.name = item.name || item._id;
                    });

                    templates = templates.filter((item, i) => !templates.find((_item, _i) => i !== _i && _item.icon === item.icon && _item.name === item.name));

                    templates.forEach((template, i) => {
                        let image;
                        try {
                            image = require(`../../assets/devices/${template.icon}`);
                        } catch (e) {
                            return Promise.resolve(null);
                        }

                        names[i + offset] = template.name;

                        promises.push(Utils.getSvg(image.default)
                            .then(icon =>
                                icons[i + offset] = icon));
                    });
                }
                Promise.all(promises)
                    .then(() =>
                        this.setState({icons, loading: false, names, isAnyName: names.find(i => i)}));
            } else {
                const promises = this.props.icons.map((item, i) => {
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
                });

                Promise.all(promises)
                    .then(() =>
                        this.setState({icons, loading: false, names, isAnyName: names.find(i => i)}));
            }
        });
    }

    render() {
        if (this.state.loading) {
            return <CircularProgress />;
        }

        return <>
            <Button
                variant="outlined"
                title={this.props.t('Select predefined icon')}
                onClick={() => this.setState({opened: true}, () => this.loadAllIcons())} style={{minWidth: 40, marginRight: 8}}
            >...</Button>
            {this.state.opened ? <Dialog onClose={() => this.setState({opened: false})} open={true}>
                <DialogTitle>{this.props.t('Select predefined icon')}
                        {this.state.isAnyName ? <TextField
                            margin="dense"
                            style={{marginLeft: 20}}
                            value={this.state.filter}
                            onChange={e => this.setState({filter: e.target.value.toLowerCase()})}
                            placeholder={this.props.t('Filter')}
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
                </DialogTitle>
                <DialogContent>
                    <div style={{width: '100%', textAlign: 'center'}}>
                        {this.state.icons && this.state.icons.map((icon, i) => {
                            if (!this.state.filter || (this.state.names[i] && this.state.names[i].toLowerCase().includes(this.state.filter))) {
                                return <Tooltip title={this.state.names[i] || ''} key={i}><IconButton
                                    onClick={() =>
                                        this.setState({opened: false}, () =>
                                            this.props.onSelect(icon))}
                                >
                                    <Icon src={icon} alt={i} style={{width: 32, height: 32, borderRadius: 5}}/>
                                </IconButton></Tooltip>;
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
    onlyRooms: PropTypes.bool,
    onlyDevices: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    lang: PropTypes.string.isRequired,
};

export default IconSelector;