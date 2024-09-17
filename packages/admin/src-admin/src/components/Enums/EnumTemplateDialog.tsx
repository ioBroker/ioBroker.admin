import React, { Component, type JSX } from 'react';

import {
    Dialog,
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    LinearProgress,
    IconButton,
} from '@mui/material';

import { Clear as ClearIcon, Brush as CustomGroup, Close as CloseIcon } from '@mui/icons-material';

import { Icon, type Translate, Utils } from '@iobroker/adapter-react-v5';

import devices from '../../assets/devices/list.json';
import rooms from '../../assets/rooms/list.json';

import AdminUtils from '../../AdminUtils';

interface EnumIcon {
    _id: string;
    name: ioBroker.StringOrTranslated;
    icon: string;
}

const styles: Record<string, React.CSSProperties> = {
    icon: {
        width: 32,
        height: 32,
    },
    customGroupButton: {},
    enumTemplateButton: {
        // width: '100%',
        justifyContent: 'end',
        margin: 4,
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
        maxHeight: 900,
    },
    filter: {
        marginLeft: 16,
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
    },
};

interface EnumTemplateDialogProps {
    prefix: string;
    t: Translate;
    lang: ioBroker.Languages;
    enums: Record<string, ioBroker.EnumObject>;
    onClose: () => void;
    createEnumTemplate: (prefix: string, template: ioBroker.EnumObject) => void;
    showEnumEditDialog: (template: ioBroker.EnumObject, isNew: boolean) => void;
    getEnumTemplate: (prefix: string) => ioBroker.EnumObject;
}

interface EnumTemplateDialogState {
    icons: string[];
    loading: boolean;
    filter: string;
}

class EnumTemplateDialog extends Component<EnumTemplateDialogProps, EnumTemplateDialogState> {
    constructor(props: EnumTemplateDialogProps) {
        super(props);

        this.state = {
            icons: [],
            loading: true,
            filter: '',
        };
    }

    componentDidMount() {
        this.setState({ loading: true }, () => {
            const templates: EnumIcon[] = this.props.prefix.startsWith('enum.functions') ? devices : rooms;
            const icons: string[] = [];

            const promises = templates.map(async (template, i) => {
                try {
                    const image: Promise<{ default: string }> = import(
                        `../../assets/${this.props.prefix.startsWith('enum.functions') ? 'devices' : 'rooms'}/${template.icon}.svg`
                    );
                    const im = await image;
                    const icon = await Utils.getSvg(im.default);
                    return (icons[i] = icon);
                } catch {
                    return null;
                }
            });

            Promise.all(promises).then(() => this.setState({ icons, loading: false }));
        });
    }

    render() {
        const templates = this.props.prefix.startsWith('enum.functions') ? devices : rooms;

        return (
            <Dialog
                maxWidth="md"
                fullWidth
                sx={{ '& .MuiPaper-root': styles.fullHeight }}
                open={!0}
                onClose={this.props.onClose}
            >
                <DialogTitle>
                    {this.props.t(
                        this.props.prefix.startsWith('enum.functions') ? 'Create new function' : 'Create new room',
                    )}
                    <TextField
                        variant="standard"
                        style={styles.filter}
                        value={this.state.filter}
                        onChange={e => this.setState({ filter: e.target.value.toLowerCase() })}
                        placeholder={this.props.t('Filter')}
                        margin="dense"
                        slotProps={{
                            input: {
                                endAdornment: this.state.filter ? (
                                    <IconButton
                                        size="small"
                                        onClick={() => this.setState({ filter: '' })}
                                    >
                                        <ClearIcon />
                                    </IconButton>
                                ) : null,
                            },
                        }}
                    />
                </DialogTitle>
                <DialogContent style={{ textAlign: 'center' }}>
                    {this.state.loading && <LinearProgress />}
                    <div style={styles.content}>
                        {templates.map((template, i) => {
                            const name = AdminUtils.getText(template.name, this.props.lang) || template._id;

                            if (this.props.enums[`${this.props.prefix}.${template._id}`]) {
                                return null;
                            }
                            if (!this.state.filter || name.toLowerCase().includes(this.state.filter)) {
                                return (
                                    <Button
                                        color="grey"
                                        key={i}
                                        variant="outlined"
                                        onClick={() => {
                                            this.props.onClose();
                                            this.props.createEnumTemplate(this.props.prefix, {
                                                _id: `${this.props.prefix}.${template._id}`,
                                                type: 'enum',
                                                common: {
                                                    name: template.name,
                                                    icon: this.state.icons[i],
                                                },
                                                native: {},
                                            });
                                        }}
                                        // startIcon={<Icon src={this.state.icons[i]} style={styles.icon}/>}
                                        style={styles.enumTemplateButton}
                                        startIcon={
                                            <Icon
                                                src={this.state.icons[i]}
                                                style={styles.icon}
                                            />
                                        }
                                    >
                                        <span style={styles.enumTemplateLabel}>
                                            {AdminUtils.getText(template.name, this.props.lang) || template._id}
                                        </span>
                                    </Button>
                                );
                            }
                            return null;
                        })}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="primary"
                        style={styles.customGroupButton}
                        onClick={() => {
                            this.props.onClose();
                            this.props.showEnumEditDialog(this.props.getEnumTemplate(this.props.prefix), true);
                        }}
                        startIcon={<CustomGroup />}
                    >
                        {this.props.prefix === 'enum.rooms'
                            ? this.props.t('Custom room')
                            : this.props.prefix === 'enum.functions'
                              ? this.props.t('Custom function')
                              : this.props.t('Custom enumeration')}
                    </Button>
                    <Button
                        color="grey"
                        variant="contained"
                        onClick={this.props.onClose}
                        startIcon={<CloseIcon />}
                    >
                        {this.props.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default EnumTemplateDialog;
