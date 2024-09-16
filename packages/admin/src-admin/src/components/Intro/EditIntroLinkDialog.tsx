import React, { Component, type JSX } from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Grid2,
    IconButton,
    Typography,
    FormControlLabel,
    Checkbox,
    Slider,
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    InputAdornment,
} from '@mui/material';

// icons
import { Add as AddIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';

import { UploadImage, type AdminConnection, type IobTheme, type Translate } from '@iobroker/adapter-react-v5';

import IntroCardCamera from '@/components/Intro/IntroCardCamera';
import IntroCard from './IntroCard';

const styles: Record<string, any> = {
    formControl: {
        marginTop: 32,
    },
    rootGrid: {
        flexGrow: 1,
    },
    closeButton: (theme: IobTheme) => ({
        position: 'absolute',
        right: 8,
        top: 8,
        color: theme.palette.grey[500],
    }),
    paper: {
        // minWidth: 600
    },
    typography: {
        paddingRight: 30,
    },
    editItem: {
        marginTop: 8,
    },
    editItemSlider: {
        marginTop: 24,
    },
    labelSlider: {
        marginTop: 16,
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
    dropZoneEmpty: {},
    image: {
        height: '100%',
        width: 'auto',
        objectFir: 'contain',
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
    },
};

interface EditIntroLinkDialogProps {
    t: Translate;
    lang: ioBroker.Languages;
    socket: AdminConnection;
    link: Record<string, any>;
    onClose: (link?: Record<string, any>) => void;
    isNew: boolean;
    theme: IobTheme;
}

interface EditIntroLinkDialogState {
    image: string;
    name: string;
    link: string;
    linkName: string;
    color: string;
    desc: string;
    addTs: boolean;
    interval: number;
    camera: string;
    cameraList: { id: string; name: string }[];
}

class EditIntroLinkDialog extends Component<EditIntroLinkDialogProps, EditIntroLinkDialogState> {
    constructor(props: EditIntroLinkDialogProps) {
        super(props);

        this.state = {
            image: '',
            name: props.t('New link'),
            link: 'http://',
            linkName: '',
            color: '',
            desc: '',
            addTs: true,
            interval: 5000,
            camera: 'text',
            cameraList: [],
            ...props.link,
        };
    }

    componentDidMount(): void {
        this.getCamerasInstances();
    }

    getCamerasInstances(): void {
        this.props.socket.getAdapterInstances('cameras', true).then(list => {
            const cameraList: { id: string; name: string }[] = [];
            const promises: Promise<{ id: string; name: string }>[] = [];
            list.forEach(obj => {
                const instance = obj._id.replace('system.adapter.', '');

                if (obj.common && obj.common.enabled) {
                    promises.push(
                        // if instance is alive
                        this.props.socket
                            .getState(`${obj._id}.alive`)
                            // get the list of cameras
                            .then(state => state && state.val && this.props.socket.sendTo(instance, 'list', null))
                            .then(
                                result =>
                                    result &&
                                    result.list &&
                                    result.list.forEach((cam: { id: string; name: string; desc: string }) =>
                                        cameraList.push({ id: cam.id, name: `${cam.desc} [${instance}/${cam.name}]` }),
                                    ),
                            ),
                    );
                }
            });

            Promise.all(promises).then(() => this.setState({ cameraList }));
        });
    }

    static getLinkNameFromLink(link: string): string {
        const m = link.trim().match(/^https?:\/\/([^/:]+)(:\d+)?/);
        if (m) {
            return m[1] + (m[2] || '');
        }
        return '';
    }

    render(): JSX.Element {
        return (
            <Dialog
                onClose={() => this.props.onClose()}
                open={!0}
                maxWidth="md"
                fullWidth
                sx={{ '& .MuiDialog-paper': styles.paper }}
            >
                <DialogTitle>
                    <Typography
                        component="h2"
                        variant="h6"
                        sx={{ '&.MuiTypography-root': styles.typography }}
                    >
                        {this.props.isNew ? this.props.t('Add new link: ') : this.props.t('Edit link')}
                        <IconButton
                            size="large"
                            sx={styles.closeButton}
                            onClick={() => this.props.onClose()}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid2
                        style={styles.rootGrid}
                        container
                        direction="row"
                    >
                        <Grid2
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 8,
                                lg: 9,
                            }}
                        >
                            <Grid2
                                container
                                direction="column"
                            >
                                <FormControl
                                    variant="standard"
                                    style={styles.formControl}
                                >
                                    <InputLabel id="select-helper-label">{this.props.t('Link type')}</InputLabel>
                                    <Select
                                        variant="standard"
                                        labelId="select-helper-label"
                                        value={this.state.camera}
                                        onChange={e => this.setState({ camera: e.target.value })}
                                    >
                                        <MenuItem
                                            value="text"
                                            key="desc"
                                        >
                                            <em>{this.props.t('Description')}</em>
                                        </MenuItem>
                                        {this.state.cameraList.map(cam => (
                                            <MenuItem
                                                key={cam.id}
                                                value={cam.id}
                                            >
                                                {cam.name}
                                            </MenuItem>
                                        ))}
                                        <MenuItem
                                            value="custom"
                                            key="custom"
                                        >
                                            {this.props.t('Custom camera URL')}
                                        </MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    variant="standard"
                                    label={this.props.t('URL')}
                                    value={this.state.link}
                                    style={styles.editItem}
                                    onChange={e => {
                                        const oldLinkName = EditIntroLinkDialog.getLinkNameFromLink(this.state.link);
                                        if (
                                            oldLinkName &&
                                            (!this.state.linkName || oldLinkName === this.state.linkName)
                                        ) {
                                            this.setState({
                                                link: e.target.value,
                                                linkName: EditIntroLinkDialog.getLinkNameFromLink(e.target.value),
                                            });
                                        } else {
                                            this.setState({ link: e.target.value });
                                        }
                                    }}
                                    slotProps={{
                                        input: {
                                            endAdornment: this.state.link ? (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => this.setState({ link: '' })}
                                                    >
                                                        <CloseIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            ) : null,
                                        },
                                    }}
                                />

                                <TextField
                                    variant="standard"
                                    style={styles.editItem}
                                    label={this.props.t('Name')}
                                    value={this.state.name || ''}
                                    onChange={e => this.setState({ name: e.target.value })}
                                    slotProps={{
                                        input: {
                                            endAdornment: this.state.name ? (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => this.setState({ name: '' })}
                                                    >
                                                        <CloseIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            ) : null,
                                        },
                                    }}
                                />

                                {this.state.link ? (
                                    <TextField
                                        variant="standard"
                                        style={styles.editItem}
                                        label={this.props.t('Link name')}
                                        value={this.state.linkName || ''}
                                        onChange={e => this.setState({ linkName: e.target.value })}
                                        slotProps={{
                                            input: {
                                                endAdornment: this.state.linkName ? (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => this.setState({ linkName: '' })}
                                                        >
                                                            <CloseIcon />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ) : null,
                                            },
                                        }}
                                    />
                                ) : null}

                                {this.state.camera === 'custom' || this.state.camera === 'text' ? (
                                    <TextField
                                        variant="standard"
                                        style={styles.editItem}
                                        label={
                                            this.state.camera === 'custom'
                                                ? this.props.t('Camera URL')
                                                : this.props.t('Description')
                                        }
                                        value={this.state.desc || ''}
                                        onChange={e => this.setState({ desc: e.target.value })}
                                        slotProps={{
                                            input: {
                                                endAdornment: this.state.desc ? (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => this.setState({ desc: '' })}
                                                        >
                                                            <CloseIcon />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ) : null,
                                            },
                                        }}
                                    />
                                ) : null}

                                {this.state.camera === 'custom' ? (
                                    <FormControlLabel
                                        style={styles.editItem}
                                        control={
                                            <Checkbox
                                                checked={this.state.addTs}
                                                onChange={e => this.setState({ addTs: e.target.checked })}
                                            />
                                        }
                                        label={this.props.t('Add timestamp to URL')}
                                    />
                                ) : null}

                                {this.state.camera !== 'text' ? (
                                    <Typography
                                        style={styles.labelSlider}
                                        gutterBottom
                                    >
                                        Polling interval in ms
                                    </Typography>
                                ) : null}
                                {this.state.camera !== 'text' ? (
                                    <Slider
                                        style={styles.editItemSlider}
                                        value={this.state.interval}
                                        getAriaValueText={() => `${this.state.interval}ms`}
                                        onChange={(e, interval) => this.setState({ interval: interval as number })}
                                        step={100}
                                        min={500}
                                        max={60000}
                                        valueLabelDisplay="on"
                                    />
                                ) : null}

                                <div style={{ ...styles.editItem, width: 50 }}>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        label={this.props.t('Color')}
                                        style={styles.editColor}
                                        type="color"
                                        value={this.state.color}
                                        onChange={e => this.setState({ color: e.target.value })}
                                    />
                                </div>
                                <UploadImage
                                    disabled={false}
                                    crop
                                    maxSize={256 * 1024}
                                    icon={this.state.image}
                                    removeIconFunc={() => this.setState({ image: '' })}
                                    onChange={base64 => this.setState({ image: base64 })}
                                    // t={this.props.t}
                                />
                            </Grid2>
                        </Grid2>
                        <Grid2
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 4,
                                lg: 3,
                            }}
                        >
                            {this.state.camera === 'text' ? (
                                <IntroCard
                                    image={this.state.image}
                                    title={this.state.name}
                                    action={{ link: this.state.link, text: this.state.linkName }}
                                    t={this.props.t}
                                    lang={this.props.lang}
                                    style={{ width: '100% !important', maxWidth: '100% !important', marginLeft: '8px' }}
                                    color={this.state.color}
                                    enabled
                                    theme={this.props.theme}
                                >
                                    {this.state.desc}
                                </IntroCard>
                            ) : (
                                <IntroCardCamera
                                    interval={this.state.interval}
                                    camera={this.state.camera}
                                    addTs={this.state.addTs}
                                    style={{ width: '100% !important', maxWidth: '100% !important', marginLeft: '8px' }}
                                    image={this.state.image}
                                    title={this.state.name}
                                    socket={this.props.socket}
                                    action={{ link: this.state.link, text: this.state.linkName }}
                                    t={this.props.t}
                                    lang={this.props.lang}
                                    color={this.state.color}
                                    enabled
                                    cameraUrl={this.state.desc}
                                    theme={this.props.theme}
                                />
                            )}
                        </Grid2>
                    </Grid2>
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
                        startIcon={this.props.isNew ? <AddIcon /> : <CheckIcon />}
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

export default EditIntroLinkDialog;
