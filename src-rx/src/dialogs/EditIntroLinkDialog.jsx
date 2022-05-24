import React, { Component } from 'react';

import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Slider from '@mui/material/Slider';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import CloseIcon from '@mui/icons-material/Close';

// icons
import IntroCard from '../components/IntroCard';
import UploadImage from '../components/UploadImage';
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";


const styles = theme => ({
    formControl: {
        marginTop: theme.spacing(4)
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
    labelSlider: {
        marginTop: theme.spacing(2),
        fontSize: '1rem',
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

class EditIntroLinkDialog extends Component {

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
            camera: 'text',
            cameraList: []
        }, props.link);

        this.state = state;
    }

    componentDidMount() {
        this.getCamerasInstances();
    }

    getCamerasInstances() {
        this.props.socket.getAdapterInstances('cameras', true)
            .then(list => {

                const cameraList = [];
                const promises = [];
                list.forEach(obj => {
                    const instance = obj._id.replace('system.adapter.', '');

                    if (obj.common && obj.common.enabled) {
                        promises.push(
                            // if instance is alive
                            this.props.socket.getState(obj._id + '.alive')
                                // get the list of cameras
                                .then(state => state && state.val && this.props.socket.sendTo(instance, 'list', null))
                                .then(result =>
                                    result && result.list && result.list.forEach(cam =>
                                        cameraList.push({ id: cam.id, name: `${cam.desc} [${instance}/${cam.name}]` }))));

                    }
                });

                Promise.all(promises)
                    .then(() =>
                        this.setState({ cameraList }));
            });
    }

    getLinkNameFromLink(link) {
        const m = link.trim().match(/^https?:\/\/([^/:]+)(:\d+)?/);
        if (m) {
            return m[1] + (m[2] || '');
        }
    }

    render() {
        const { classes } = this.props;

        return (
            <Dialog
                onClose={() => this.props.onClose()}
                open={this.props.open}
                maxWidth="md"
                fullWidth={true}
                classes={{ paper: classes.paper }}
            >
                <DialogTitle disableTypography={true}>
                    <Typography component="h2" variant="h6" classes={{ root: classes.typography }}>
                        {this.props.isNew ? this.props.t('Add new link: ') : this.props.t('Edit link')}
                        <IconButton size="large" className={classes.closeButton} onClick={() => this.props.onClose()}>
                            <CloseIcon />
                        </IconButton>
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>

                    <Grid
                        className={this.props.classes.rootGrid}
                        container
                        direction="row"
                    >
                        <Grid item
                            xs={12}
                            sm={6}
                            md={8}
                            lg={9}>
                            <Grid
                                container
                                direction="column"
                            >
                                <FormControl variant="standard" className={classes.formControl}>
                                    <InputLabel id="select-helper-label">{this.props.t('Link type')}</InputLabel>
                                    <Select
                                        variant="standard"
                                        labelId="select-helper-label"
                                        value={this.state.camera}
                                        onChange={e => this.setState({ camera: e.target.value })}
                                    >
                                        <MenuItem value="text" key="desc"><em>{this.props.t('Description')}</em></MenuItem>
                                        {this.state.cameraList.map(cam => <MenuItem key={cam.id} value={cam.id}>{cam.name}</MenuItem>)}
                                        <MenuItem value="custom" key="custom">{this.props.t('Custom camera URL')}</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    variant="standard"
                                    label={this.props.t('URL')}
                                    value={this.state.link}
                                    className={this.props.classes.editItem}
                                    onChange={e => {
                                        const oldLinkName = this.getLinkNameFromLink(this.state.link);
                                        if (oldLinkName && (!this.state.linkName || oldLinkName === this.state.linkName)) {
                                            this.setState({ link: e.target.value, linkName: this.getLinkNameFromLink(e.target.value) });
                                        } else {
                                            this.setState({ link: e.target.value });
                                        }
                                    }}
                                />

                                <TextField
                                    variant="standard"
                                    className={this.props.classes.editItem}
                                    label={this.props.t('Name')}
                                    value={this.state.name || ''}
                                    onChange={e => this.setState({ name: e.target.value })}
                                />

                                {this.state.link ? <TextField variant="standard" className={this.props.classes.editItem} label={this.props.t('Link name')} value={this.state.linkName || ''} onChange={e => this.setState({ linkName: e.target.value })} /> : null}

                                {this.state.camera === 'custom' || this.state.camera === 'text' ? <TextField variant="standard" className={this.props.classes.editItem} label={this.state.camera === 'custom' ? this.props.t('Camera URL') : this.props.t('Description')} value={this.state.desc || ''} onChange={e => this.setState({ desc: e.target.value })} /> : null}

                                {this.state.camera === 'custom' ? <FormControlLabel className={this.props.classes.editItem}
                                    control={<Checkbox checked={this.state.addTs} onChange={e => this.setState({ addTs: e.target.checked })} />}
                                    label={this.props.t('Add timestamp to URL')}
                                /> : null}

                                {this.state.camera !== 'text' ? <Typography className={this.props.classes.labelSlider} gutterBottom>
                                    Polling interval in ms
                                    </Typography> : null}
                                {this.state.camera !== 'text' ? <Slider
                                    className={this.props.classes.editItemSlider}
                                    value={this.state.interval}
                                    getAriaValueText={() => this.state.interval + 'ms'}
                                    onChange={(e, interval) => this.setState({ interval })}
                                    step={100}
                                    min={500}
                                    max={60000}
                                    valueLabelDisplay="on"
                                /> : null}

                                <div style={{ width: 50 }} className={this.props.classes.editItem}>
                                    <TextField variant="standard" fullWidth={true} label={this.props.t('Color')} className={this.props.editColor} type="color" value={this.state.color} onChange={e => this.setState({ color: e.target.value })} />
                                </div>
                                <UploadImage
                                    disabled={false}
                                    crop
                                    maxSize={256 * 1024}
                                    icon={this.state.image}
                                    removeIconFunc={() => this.setState({ image: '' })}
                                    onChange={(base64) => this.setState({ image: base64 })}
                                    t={this.props.t}
                                />
                            </Grid>
                        </Grid>
                        <IntroCard
                            interval={this.state.interval}
                            camera={this.state.camera}
                            addTs={this.state.addTs}
                            image={this.state.image}
                            title={this.state.name}
                            socket={this.props.socket}
                            action={{ link: this.state.link, text: this.state.linkName }}
                            t={this.props.t}
                            color={this.state.color}
                            enabled={true}
                        >
                            {this.state.desc || ''}
                        </IntroCard>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        autoFocus
                        onClick={() => {
                            this.props.onClose({
                                link: this.state.link,
                                name: this.state.name,
                                desc: this.state.desc,
                                linkName: this.state.linkName,
                                color: this.state.color,
                                image: this.state.image,
                                addTs: this.state.addTs,
                                camera: this.state.camera,
                                interval: this.state.interval,
                            });
                        }}
                        color="primary"
                        startIcon={this.props.isNew ? <AddIcon/> : <CheckIcon/>}
                    >
                        {this.props.isNew ? this.props.t('Add') : this.props.t('Save')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => this.props.onClose()}
                        color="grey"
                        startIcon={<CloseIcon />}
                    >
                        {this.props.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

EditIntroLinkDialog.propTypes = {
    t: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    link: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    isNew: PropTypes.bool,
};

export default withStyles(styles)(EditIntroLinkDialog);