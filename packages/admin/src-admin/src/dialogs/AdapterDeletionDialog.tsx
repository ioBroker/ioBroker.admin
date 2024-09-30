import React, { Component, type JSX } from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
    FormControlLabel,
    Checkbox,
} from '@mui/material';

import { Close as CloseIcon, Check as CheckIcon } from '@mui/icons-material';

import type { AdminConnection, IobTheme, Translate } from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = {
    formControl: {
        marginTop: 24,
    },
    closeButton: (theme: IobTheme) => ({
        position: 'absolute',
        right: 8,
        top: 8,
        color: theme.palette.grey[500],
    }),
    typography: {
        paddingRight: 30,
    },
};

interface AdapterDeletionDialogProps {
    adapter: string;
    socket: AdminConnection;
    t: Translate;
    onClose: () => void;
    onClick: (deleteCustom: boolean) => void;
}

interface AdapterDeletionDialogState {
    deleteCustom: boolean;
    deleteCustomSupported: boolean;
}

class AdapterDeletionDialog extends Component<AdapterDeletionDialogProps, AdapterDeletionDialogState> {
    private readonly t: Translate;

    constructor(props: AdapterDeletionDialogProps) {
        super(props);

        this.state = {
            deleteCustom: false,
            deleteCustomSupported: false,
        };
        this.t = props.t;
    }

    componentDidMount(): void {
        void this.props.socket.checkFeatureSupported('DEL_INSTANCE_CUSTOM').then(deleteCustomSupported => {
            if (deleteCustomSupported) {
                return this.props.socket.getObject(`system.adapter.${this.props.adapter}`).then(obj => {
                    if (obj?.common) {
                        if (obj.common.supportCustoms) {
                            this.setState({ deleteCustomSupported: obj.common.supportCustoms });
                        }
                    } else {
                        this.setState({ deleteCustomSupported: true });
                    }
                });
            }
        });
    }

    render(): JSX.Element {
        return (
            <Dialog
                onClose={this.props.onClose}
                open={!0}
            >
                <DialogTitle>
                    <Typography
                        component="h2"
                        variant="h6"
                        sx={{ '&.MuiTypography-root': styles.typography }}
                    >
                        {this.t('Please confirm')}
                        <IconButton
                            size="large"
                            sx={styles.closeButton}
                            onClick={this.props.onClose}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>
                        {this.t('Are you sure you want to delete adapter %s?', this.props.adapter)}
                    </Typography>
                    {this.state.deleteCustomSupported && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={this.state.deleteCustom}
                                    onChange={e => this.setState({ deleteCustom: e.target.checked })}
                                />
                            }
                            label={this.t('Delete all custom object settings of this adapter too')}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        id="adapter-delete-dialog-ok"
                        variant="contained"
                        autoFocus
                        onClick={() => {
                            this.props.onClick(this.state.deleteCustom);
                            this.props.onClose();
                        }}
                        color="primary"
                        startIcon={<CheckIcon />}
                    >
                        {this.t('Ok')}
                    </Button>
                    <Button
                        id="adapter-delete-dialog-cancel"
                        variant="contained"
                        autoFocus
                        onClick={() => this.props.onClose()}
                        color="grey"
                        startIcon={<CloseIcon />}
                    >
                        {this.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default AdapterDeletionDialog;
