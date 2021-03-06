import withWidth from '@material-ui/core/withWidth';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {withStyles} from '@material-ui/core/styles';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContentText from '@material-ui/core/DialogContentText';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
//import Checkbox from '@material-ui/core/Checkbox';
//import FormControlLabel from '@material-ui/core/FormControlLabel';

// icons
import IconCancel from '@material-ui/icons/Close';
import IconDeleteOne from '@material-ui/icons/Delete';
import IconDeleteAll from '@material-ui/icons/Delete';

import ObjectBrowser from '../components/ObjectBrowser';
import ObjectCustomDialog from '../dialogs/ObjectCustomDialog';
import Router from '@iobroker/adapter-react/Components/Router';
import ObjectBrowserValue from '../components/ObjectBrowserValue';
import ObjectBrowserEditObject from '../components/ObjectBrowserEditObject';
import ObjectBrowserEditRole from '../components/ObjectBrowserEditRole';

const styles = theme => ({
    buttonIcon: {
        marginRight: 4,
    },
    buttonAll: {
        color: '#FF0000',
    },
    id: {
        fontStyle: 'italic',
    }
});
class Objects extends Component {

    constructor(props) {

        super(props);

        this.filters = window.localStorage.getItem(this.dialogName) || '{}';

        try {
            this.filters = JSON.parse(this.filters);
        } catch (e) {
            this.filters = {};
        }

        this.state =  {
            selected: this.props.selected || '',
            name:     '',
            toast:    '',
            deleteObjectShow: null,
            //suppressDeleteConfirm: false,
        };
    }

    onDelete(withChildren) {
        const id = this.state.deleteObjectShow.id;
        if (withChildren) {
            this.props.socket.delObjects(id)
                .then(() => this.setState({toast: this.props.t('All deleted')}));

            this.setState({deleteObjectShow: null});
        } else {
            this.props.socket.delObject(id)
                .then(() => this.setState({deleteObjectShow: null}));
        }
    }

    renderToast() {
        return <Snackbar
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            open={!!this.state.toast}
            autoHideDuration={3000}
            onClose={() => this.setState({toast: ''})}
            message={this.state.toast}
            action={
                <React.Fragment>
                    <IconButton size="small" aria-label="close" color="inherit" onClick={() => this.setState({toast: ''})}>
                        <IconCancel fontSize="small" />
                    </IconButton>
                </React.Fragment>
            }
        />;
    }

    renderDeleteDialog() {
        if (!this.state.deleteObjectShow) {
            return null;
        } else {
            return <Dialog
                key="delete"
                open={ true }
                onClose={ () => this.setState({deleteObjectShow: null}) }
                aria-labelledby="delete-object-dialog-title"
                aria-describedby="delete-object-dialog-description"
            >
                <DialogTitle id="delete-object-dialog-title">{ this.state.deleteObjectShow.hasChildren ? this.props.t('Delete object(s): ') : this.props.t('Delete object: ') } <span className={ this.props.classes.id }>{ this.state.deleteObjectShow.id }</span></DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {this.props.t('Are you sure?')}
                        {/*<FormControlLabel
                            control={<Checkbox
                                checked={this.state.suppressDeleteConfirm}
                                onChange={() => {
                                    this.setState({suppressDeleteConfirm: true});

                                }}
                                name="checkedA" />
                            }
                            label="Secondary"
                        />*/}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setState({deleteObjectShow: null})}><IconCancel className={this.props.classes.buttonIcon}/>{this.props.t('ra_Cancel')}</Button>
                    {this.state.deleteObjectShow.hasChildren ? <Button onClick={() => this.onDelete(true)}><IconDeleteAll className={clsx(this.props.classes.buttonAll, this.props.classes.buttonIcon)}/>{this.props.t('Delete with children')}</Button> : null}
                    {this.state.deleteObjectShow.exists      ? <Button onClick={() => this.onDelete(false)} color="primary"><IconDeleteOne className={this.props.classes.buttonIcon}/>{this.props.t('Delete one item')}</Button> : null}
                </DialogActions>
            </Dialog>
        }
    }

    render() {
        return [
            <ObjectBrowser
                key="browser"
                prefix={ this.props.prefix }
                defaultFilters={ this.filters }
                statesOnly={ this.props.statesOnly }
                style={ {width: '100%', height: '100%'} }
                socket={ this.props.socket }
                selected={ this.state.selected }
                name={ this.state.name }
                expertMode={ this.props.expertMode }
                t={ this.props.t }
                lang={ this.props.lang }
                themeName={ this.props.themeName }
                objectCustomDialog={ ObjectCustomDialog }
                objectBrowserValue={ ObjectBrowserValue }
                objectBrowserEditObject={ ObjectBrowserEditObject }
                objectBrowserEditRole={ ObjectBrowserEditRole }
                enableStateValueEdit={true}
                onObjectDelete={(id, hasChildren, exists) => this.setState({deleteObjectShow: {id, hasChildren, exists}})}
                router={ Router }
                onFilterChanged={ filterConfig => {
                    this.filters = filterConfig;
                    window.localStorage.setItem(this.dialogName, JSON.stringify(filterConfig));
                }}
            />,
            this.renderDeleteDialog()
        ];
    }
}

Objects.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    themeName: PropTypes.string,
    expertMode: PropTypes.bool,
};

/** @type {typeof Objects} */
const _export = withWidth()(withStyles(styles)(Objects));
export default _export;