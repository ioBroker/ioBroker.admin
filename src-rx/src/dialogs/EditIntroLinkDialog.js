import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Dropzone from 'react-dropzone'
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Slider from '@material-ui/core/Slider';

import CloseIcon from '@material-ui/icons/Close';
import clsx from "clsx";

// icons
import {FaFileUpload as UploadIcon} from 'react-icons/fa';

import IntroCard from '../components/IntroCard';


const styles = theme => ({
    formControl: {
        marginTop: theme.spacing(3)
    },
    rootGrid: {
        flexGrow: 1,
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
    paper: {
        //minWidth: 600
    },
    typography: {
        paddingRight: 30
    },
    editItem: {
        marginTop: theme.spacing(1),
    },
    editItemSlider: {
        marginTop: theme.spacing(3),
    },
    editColor: {
        width: '100%',
    },
    dropZone: {
        width: '100%',
        height: 100,
        position: 'relative',
    },
    dropZoneEmpty: {

    },
    image: {
        height: '100%',
        width: 'auto',
        objectFir: 'contain'
    },

    uploadDiv: {
        position: 'relative',
        width: '100%',
        height: 100,
        opacity: 0.9,
    },
    uploadDivDragging: {
        opacity: 1,
    },

    uploadCenterDiv: {
        margin: 5,
        border: '3px dashed grey',
        borderRadius: 5,
        width: 'calc(100% - 10px)',
        height: 'calc(100% - 10px)',
        position: 'relative',
    },
    uploadCenterIcon: {
        paddingTop: 10,
        width: 48,
        height: 48,
    },
    uploadCenterText: {
        fontSize: 16,
    },
    uploadCenterTextAndIcon: {
        textAlign: 'center',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    }
});

class EditIntroLinkDialog extends React.Component {

    constructor(props) {
        super(props);

        let state = Object.assign({
            image: '',
            name: props.t('New link'),
            link: 'http://',
            linkName: '',
            color: '',
            desc: '',
            enabled: true,
            addTs: true,
            interval: 5000,
            camera: false,
        }, props.link);

        this.state = state;
    }

    getLinkNameFromLink(link) {
        const m = link.trim().match(/^https?:\/\/([^/:]+)(:\d+)?/);
        if (m) {
            return m[1] + (m[2] || '');
        }
    }

    onDrop(acceptedFiles) {
        const file = acceptedFiles[0];
        const reader = new FileReader();

        reader.onabort = () => console.log('file reading was aborted');
        reader.onerror = () => console.log('file reading has failed');
        reader.onload  = () => {
            let ext = 'image/' + file.name.split('.').pop().toLowerCase();
            if (ext === 'image/jpg') {
                ext = 'image/jpeg';
            } else if (ext === 'image/svg') {
                ext = 'image/svg+xml';
            }

            const base64 = 'data:' + ext + ';base64,'  + btoa(
                new Uint8Array(reader.result)
                    .reduce((data, byte) => data + String.fromCharCode(byte), ''));

            this.setState({ image: base64 });
        };
        reader.readAsArrayBuffer(file);
    }

    render() {
        const { classes } = this.props;

        return (
            <Dialog
                onClose={ () => this.props.onClose() }
                open={ this.props.open }
                maxWidth="md"
                fullWidth={ true }
                classes={{ paper: classes.paper }}
            >
                <DialogTitle disableTypography={ true }>
                    <Typography component="h2" variant="h6" classes={{ root: classes.typography }}>
                        { this.props.isNew ? this.props.t('Add new link: ') : this.props.t('Edit link') }
                        <IconButton className={ classes.closeButton } onClick={ () => this.props.onClose() }>
                            <CloseIcon />
                        </IconButton>
                    </Typography>
                </DialogTitle>
                    <DialogContent dividers>

                        <Grid
                            className={ this.props.classes.rootGrid }
                            container
                            direction="row"
                        >
                            <Grid item
                                  xs={ 12 }
                                  sm={ 6 }
                                  md={ 8 }
                                  lg={ 9 }>
                                <Grid
                                    container
                                    direction="column"
                                >
                                    <TextField
                                        label={ this.props.t('URL')}
                                        value={ this.state.link }
                                        className={ this.props.classes.editItem }
                                        onChange={ e => {
                                            const oldLinkName = this.getLinkNameFromLink(this.state.link);
                                            if (oldLinkName && (!this.state.linkName || oldLinkName === this.state.linkName)) {
                                                this.setState({ link: e.target.value, linkName: this.getLinkNameFromLink(e.target.value) });
                                            } else {
                                                this.setState({ link: e.target.value });
                                            }
                                        } }
                                    />
                                    <TextField className={ this.props.classes.editItem } label={ this.props.t('Name')}      value={ this.state.name     || ''}  onChange={ e => this.setState({ name:     e.target.value }) } />
                                    <TextField className={ this.props.classes.editItem } label={ this.props.t('Link name')} value={ this.state.linkName || '' } onChange={ e => this.setState({ linkName: e.target.value }) } />
                                    {/*<FormControlLabel className={ this.props.classes.editItem }
                                        control={<Checkbox checked={ this.state.camera } onChange={ e => this.setState({ camera: e.target.checked }) } />}
                                        label={ this.props.t('Camera')}
                                    />*/}
                                    <TextField className={ this.props.classes.editItem } label={ this.state.camera ? this.props.t('Camera URL') : this.props.t('Description') } value={ this.state.desc   || '' } onChange={ e => this.setState({ desc: e.target.value }) } />
                                    { this.state.camera ? <FormControlLabel className={ this.props.classes.editItem }
                                                      control={<Checkbox checked={ this.state.addTs } onChange={ e => this.setState({ addTs: e.target.checked }) } />}
                                                      label={ this.props.t('Add timestamp to URL')}
                                    /> : null }
                                    { this.state.camera ? <Typography id="disabled-slider" gutterBottom>
                                        Polling interval in ms
                                    </Typography> : null }
                                    { this.state.camera ? <Slider
                                        className={ this.props.classes.editItemSlider }
                                        value={ this.state.interval }
                                        getAriaValueText={ () => this.state.interval + 'ms' }
                                        onChange={ (e, interval) => this.setState({ interval }) }
                                        step={ 200 }
                                        min={ 500 }
                                        max={ 60000 }
                                        valueLabelDisplay="on"
                                    /> : null }
                                    <div style={{ width: 50 }} className={ this.props.classes.editItem }>
                                        <TextField fullWidth={ true } label={ this.props.t('Color')}     className={ this.props.editColor } type="color" value={ this.state.color }    onChange={ e => this.setState({ color:    e.target.value }) } />
                                    </div>

                                    <Dropzone
                                        key="dropzone"
                                        multiple={ false }
                                        accept="image/svg+xml,image/png,image/jpeg"
                                        maxSize={ 256 * 1024 }
                                        onDragEnter={() => this.setState({uploadFile: 'dragging'})}
                                        onDragLeave={() => this.setState({uploadFile: true})}
                                        onDrop={acceptedFiles => this.onDrop(acceptedFiles) }
                                    >
                                        {({ getRootProps, getInputProps }) => (
                                            <div className={ clsx(
                                                this.props.classes.uploadDiv,
                                                this.state.uploadFile === 'dragging' && this.props.classes.uploadDivDragging,
                                                this.props.classes.dropZone,
                                                !this.state.image && this.props.classes.dropZoneEmpty
                                            )}
                                                 {...getRootProps()}>
                                                <input {...getInputProps()} />
                                                <div className={this.props.classes.uploadCenterDiv}>
                                                    <div className={this.props.classes.uploadCenterTextAndIcon}>
                                                        <UploadIcon className={this.props.classes.uploadCenterIcon}/>
                                                        <div className={this.props.classes.uploadCenterText}>{
                                                            this.state.uploadFile === 'dragging' ? this.props.t('Drop file here') :
                                                                this.props.t('Place your files here or click here to open the browse dialog')}</div>
                                                    </div>
                                                    {this.state.image ? <img src={ this.state.image } className={ this.props.classes.image} alt="icon" /> : null }
                                                </div>

                                            </div>)}
                                    </Dropzone>
                                </Grid>
                            </Grid>
                            <IntroCard
                                interval={ this.state.interval }
                                camera={ this.state.camera }
                                addTs={ this.state.addTs }
                                image={ this.state.image }
                                title={ this.state.name }
                                action={{ link: this.state.link, text: this.state.linkName }}
                                t={ this.props.t }
                                color={ this.state.color }
                                enabled={ true }
                            >
                                { this.state.desc ||'' }
                            </IntroCard>
                        </Grid>
                    </DialogContent>
                <DialogActions>
                    {/*<Button
                        onClick={ () => {
                            this.props.onClose();
                        }}
                        color="primary">
                        { this.props.t('Cancel') }
                    </Button>*/}
                    <Button
                        autoFocus
                        onClick={ () => {
                            this.props.onClose({
                                link:     this.state.link,
                                name:     this.state.name,
                                desc:     this.state.desc,
                                linkName: this.state.linkName,
                                color:    this.state.color,
                                image:    this.state.image,
                                addTs:    this.state.addTs,
                                camera:   this.state.camera,
                                interval: this.state.interval,
                            });
                        }}
                        color="primary">
                        { this.props.isNew ? this.props.t('Add') : this.props.t('Save')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

EditIntroLinkDialog.propTypes = {
    t: PropTypes.func.isRequired,
    lang: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    link: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    isNew: PropTypes.bool,
};

export default withStyles(styles)(EditIntroLinkDialog);