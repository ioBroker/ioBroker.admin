import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import {LinearProgress} from '@material-ui/core';

import CustomGroup from '@material-ui/icons/Brush';

import Icon from '@iobroker/adapter-react/Components/Icon';

import devices from '../../assets/devices/list.json';
import rooms from '../../assets/rooms/list.json';

import Utils from '../../Utils';

const styles = theme => ({
    icon: {
        width: 32,
        height: 32,
        marginRight: theme.spacing(1),
    },
    customGroupButton: {

    },
    enumTemplateButton: {
        width: '100%',
        justifyContent: 'end'
    },
    enumTemplateLabel: {
        textAlign: 'left'
    },
});

class EnumTemplateDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            icons: [],
            loading: true,
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

    render() {
        let templates = this.props.prefix.startsWith('enum.functions') ? devices : rooms;

        return <Dialog
            maxWidth="md"
            fullWidth
            //PaperProps={{className: this.props.classesParent.dialogPaper}}
            open={true}
            onClose={this.props.onClose}
        >
            <DialogTitle>{this.props.t(this.props.prefix.startsWith('enum.functions') ? 'Create new function' : 'Create new room')}</DialogTitle>
            <DialogContent style={{textAlign: 'center'}}>
                {this.state.loading && <LinearProgress/>}
                {templates.map((template, i) => {
                    if (this.props.enums[`${this.props.prefix}.${template._id}`]) {
                        return null;
                    } else {
                        return <div key={i} className={this.props.classesParent.enumTemplate}>
                            <Button onClick={() => {
                                this.props.onClose();
                                this.props.createEnumTemplate(this.props.prefix, {
                                    _id: `${this.props.prefix}.${template._id}`,
                                    common: {
                                        name: template.name,
                                        icon: this.state.icons[i]
                                    }
                                });
                            }}
                                    startIcon={<Icon src={this.state.icons[i]} className={this.props.classes.icon}/>}
                                    className={this.props.classes.enumTemplateButton}
                            >
                                <span className={this.props.classes.enumTemplateLabel}>{this.props.t(template.name)}</span>
                            </Button>
                        </div>;
                    }
                })}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    className={this.props.classes.customGroupButton} onClick={() => {
                    this.props.onClose();
                    this.props.showEnumEditDialog(this.props.getEnumTemplate(this.props.prefix), true);
                }}>
                    <CustomGroup style={{marginRight: 8}}/>
                    {this.props.t('Custom group')}
                </Button>
                <Button variant="contained" onClick={this.props.onClose}>{this.props.t('Cancel')}</Button>
            </DialogActions>
        </Dialog>;
    }
}

EnumTemplateDialog.propTypes = {
    prefix: PropTypes.string,
    t: PropTypes.func,
    getEnumTemplate: PropTypes.func,
    onClose: PropTypes.func,
    classesParent: PropTypes.object,
};

export default withStyles(styles)(EnumTemplateDialog);
