import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import {LinearProgress} from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';

import ClearIcon from '@material-ui/icons/Clear';
import CustomGroup from '@material-ui/icons/Brush';
import CloseIcon from '@material-ui/icons/Close';

import Icon from '@iobroker/adapter-react/Components/Icon';

import devices from '../../assets/devices/list.json';
import rooms from '../../assets/rooms/list.json';

import Utils from '../Utils';

const styles = theme => ({
    icon: {
        width: 32,
        height: 32,
    },
    customGroupButton: {

    },
    enumTemplateButton: {
        //width: '100%',
        justifyContent: 'end',
        margin: theme.spacing(0.5),
        padding: '4px 8px',
    },
    enumTemplateLabel: {
        textAlign: 'right',
        opacity: 0.4,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flexGrow: 1,
    },
    fullHeight: {
        height: 'calc(100% - 32px)',
        maxHeight: 900
    },
    filter: {
        marginLeft: theme.spacing(2),
        marginTop: 0,
        marginBottom: 0,
    },
    content: {
        display: 'grid',
        width: '100%',
        gridTemplateColumns: 'repeat(4,1fr)',
    },
    title: {
        lineHeight: '45px',
        verticalAlign: 'middle',
        display: 'inline-block',
    }
});

class EnumTemplateDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            icons: [],
            loading: true,
            filter: '',
        };
    }

    componentDidMount() {
        this.setState({loading: true}, () => {
            let templates = this.props.prefix.startsWith('enum.functions') ? devices : rooms;
            const icons = [];

            const promises = templates.map((template, i) => {
                let image;
                try {
                    image = require(`../../assets/${this.props.prefix.startsWith('enum.functions') ? 'devices' : 'rooms'}/${template.icon}`);
                } catch (e) {
                    return Promise.resolve(null);
                }

                return Utils.getSvg(image.default)
                    .then(icon =>
                        icons[i] = icon);
            });

            Promise.all(promises)
                .then(() =>
                    this.setState({icons, loading: false}));
        });
    }

    getName(item) {
        if (typeof item.name === 'object' && item.name) {
            return item.name[this.props.lang] || item.name.en || item._id || '';
        } else {
            return item.name || item._id || '';
        }
    }

    render() {
        let templates = this.props.prefix.startsWith('enum.functions') ? devices : rooms;

        return <Dialog
            maxWidth="md"
            fullWidth
            classes={{root: this.props.classes.fullHeight}}
            open={true}
            onClose={this.props.onClose}
        >
            <DialogTitle>
                    {this.props.t(this.props.prefix.startsWith('enum.functions') ? 'Create new function' : 'Create new room')}
                <TextField
                    className={this.props.classes.filter}
                    value={this.state.filter}
                    onChange={e => this.setState({filter: e.target.value.toLowerCase()})}
                    placeholder={this.props.t('Filter')}
                    margin="dense"
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
                />
            </DialogTitle>
            <DialogContent style={{textAlign: 'center'}}>
                {this.state.loading && <LinearProgress/>}
                <div className={this.props.classes.content}>
                    {templates.map((template, i) => {
                    const name = this.getName(template);

                    if (this.props.enums[`${this.props.prefix}.${template._id}`]) {
                        return null;
                    } else if (!this.state.filter || name.toLowerCase().includes(this.state.filter)) {
                        return <Button
                                key={i}
                                variant="outlined"
                                onClick={() => {
                                    this.props.onClose();
                                    this.props.createEnumTemplate(this.props.prefix, {
                                        _id: `${this.props.prefix}.${template._id}`,
                                        common: {
                                            name: template.name,
                                            icon: this.state.icons[i]
                                        }
                                    });
                                }}
                                //startIcon={<Icon src={this.state.icons[i]} className={this.props.classes.icon}/>}
                                className={this.props.classes.enumTemplateButton}
                                startIcon={<Icon src={this.state.icons[i]} className={this.props.classes.icon}/>}
                            >
                                <span className={this.props.classes.enumTemplateLabel}>{this.getName(template)}</span>
                            </Button>;
                    } else {
                        return null;
                    }
                })}
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    className={this.props.classes.customGroupButton}
                    onClick={() => {
                        this.props.onClose();
                        this.props.showEnumEditDialog(this.props.getEnumTemplate(this.props.prefix), true);
                    }}
                    startIcon={<CustomGroup />}
                >
                    {this.props.prefix === 'enum.rooms' ? this.props.t('Custom room') : (this.props.prefix === 'enum.functions' ? this.props.t('Custom function') : this.props.t('Custom enumeration'))}
                </Button>
                <Button variant="contained" onClick={this.props.onClose} startIcon={<CloseIcon />}>{this.props.t('Cancel')}</Button>
            </DialogActions>
        </Dialog>;
    }
}

EnumTemplateDialog.propTypes = {
    prefix: PropTypes.string,
    t: PropTypes.func,
    lang: PropTypes.string,
    getEnumTemplate: PropTypes.func,
    onClose: PropTypes.func,
    classesParent: PropTypes.object,
};

export default withStyles(styles)(EnumTemplateDialog);
