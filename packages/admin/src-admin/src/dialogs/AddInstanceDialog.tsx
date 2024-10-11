import React, { Component, type JSX } from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid2,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    type SelectChangeEvent,
    Box,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Public as IconWeb, Language as LanguageIcon } from '@mui/icons-material';

import { type AdminConnection, I18n, Utils, type IobTheme, type Translate } from '@iobroker/react-components';

import type HostsWorker from '@/Workers/HostsWorker';
import type InstancesWorker from '@/Workers/InstancesWorker';
import { checkCondition, type CompactInstanceInfo, type Message } from '@/dialogs/AdapterUpdateDialog';
import HostSelectors from '@/components/HostSelectors';

const styles: Record<string, any> = {
    formControl: {
        marginTop: 24,
        width: 100,
    },
    closeButton: (theme: IobTheme) => ({
        position: 'absolute',
        right: 8,
        top: 8,
        color: theme.palette.grey[500],
    }),
    languageButton: {
        position: 'absolute',
        right: 52 + 8,
        top: 8,
    },
    languageButtonActive: (theme: IobTheme) => ({
        color: theme.palette.primary.main,
    }),
    paper: {
        // minWidth: 600
    },
    typography: {
        pr: '30px',
    },
    messageText: {},
    messageColor_warn: {
        color: '#cb7642',
    },
    messageColor_error: {
        color: '#f5614d',
    },
    messageColor_info: {
        color: '#5abd29',
    },
    messageTitle_warn: (theme: IobTheme) => ({
        background: '#cb7642',
        borderRadius: '3px',
        pl: '10px',
        fontWeight: 'bold',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    }),
    messageTitle_error: (theme: IobTheme) => ({
        background: '#f5614d',
        borderRadius: '3px',
        pl: '10px',
        fontWeight: 'bold',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    }),
    messageTitle_info: (theme: IobTheme) => ({
        background: '#5abd29',
        borderRadius: '3px',
        pl: '10px',
        fontWeight: 'bold',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    }),
    deps: (theme: IobTheme) => ({
        m: '10px',
        fontSize: 16,
        color: theme.palette.mode === 'dark' ? '#e70000' : '#840101',
    }),
};

export interface AdapterDependencies {
    name: string;
    version: string | null;
    installed: boolean;
    installedVersion: string;
    rightVersion: boolean;
}

interface AddInstanceDialogProps {
    adapter: string;
    instancesWorker: InstancesWorker;
    socket: AdminConnection;
    currentHost: string;
    currentInstance: string;
    t: Translate;
    onClose: (result: boolean) => void;
    onHostChange: (host: string) => void;
    onInstanceChange: (event: SelectChangeEvent<string>) => void;
    instances: Record<string, CompactInstanceInfo>;
    adapterObject: ioBroker.AdapterCommon;
    dependencies: AdapterDependencies[];
    hostsWorker: InstanceType<typeof HostsWorker>;
    noTranslation: boolean;
    toggleTranslation: () => void;
    expertMode: boolean;
    theme: IobTheme;
}

interface AddInstanceDialogState {
    instanceNumbers: string[];
}

class AddInstanceDialog extends Component<AddInstanceDialogProps, AddInstanceDialogState> {
    private readonly t: Translate;

    private readonly messages: Message[] | null = null;

    private readonly lang: string;

    constructor(props: AddInstanceDialogProps) {
        super(props);
        this.state = {
            instanceNumbers: [],
        };
        this.t = props.t;
        this.lang = I18n.getLanguage();

        this.messages = checkCondition(
            props.adapterObject.messages,
            null,
            props.adapterObject.version,
            props.instances,
        );
    }

    componentDidMount(): void {
        void this.props.instancesWorker.getObjects().then((instances: Record<string, ioBroker.InstanceObject>) => {
            const instanceNumbers = Object.keys(instances)
                .filter(id => instances[id]?.common?.name === this.props.adapter)
                .map(id => id.substring(id.lastIndexOf('.') + 1));

            this.setState({ instanceNumbers });
        });
    }

    getAvailableInstances(): JSX.Element[] {
        const result = [];
        result.push(
            <MenuItem
                value="auto"
                key="auto"
            >
                {this.t('auto')}
            </MenuItem>,
        );

        for (let i = 0; i <= 100; i++) {
            if (!this.state.instanceNumbers.includes(i.toString())) {
                result.push(
                    <MenuItem
                        value={i.toString()}
                        key={i}
                    >
                        {i}
                    </MenuItem>,
                );
            }
            if (result.length > 11) {
                break;
            }
        }

        return result;
    }

    checkDependencies(dependencies = this.props.dependencies): string | JSX.Element[] {
        if (!dependencies) {
            return '';
        }
        const array = [];
        for (const adapter of dependencies) {
            if (!adapter.installedVersion) {
                array.push(this.props.t('No version of %s', adapter.name, adapter.name));
            } else if (!adapter.rightVersion) {
                array.push(
                    `${this.props.t('Invalid version of %s. Required %s. Current ', adapter.name, adapter.version)}${adapter.installedVersion}`,
                );
            }
        }
        return array.length ? array.map(el => <div key={el}>{el}</div>) : '';
    }

    getText(text: string | { [lang: string]: string }, noTranslation?: boolean): string {
        if (text && typeof text === 'object') {
            if (noTranslation) {
                return text.en;
            }
            return text[this.lang] || text.en;
        }
        return typeof text === 'object' ? '' : text;
    }

    renderOneMessage(message: Message, index: number): JSX.Element {
        return (
            <Grid2 key={index}>
                <Typography sx={styles[`messageTitle_${message.level || 'warn'}`]}>
                    {this.getText(message.title, this.props.noTranslation) || ''}
                </Typography>
                <Typography
                    component="div"
                    variant="body2"
                    style={styles.messageText}
                >
                    {this.getText(message.text, this.props.noTranslation) || ''}
                </Typography>
                {message.link ? (
                    <Button
                        onClick={() => {
                            const w = window.open(message.link, '_blank');
                            w.focus();
                        }}
                        startIcon={<IconWeb />}
                        variant="contained"
                        color="grey"
                    >
                        {this.getText(message.linkText, this.props.noTranslation) || this.props.t('More info')}
                    </Button>
                ) : null}
            </Grid2>
        );
    }

    renderMessages(): JSX.Element | null {
        if (this.messages) {
            return (
                <Grid2
                    container
                    spacing={2}
                    direction="column"
                    wrap="nowrap"
                    sx={{ marginBottom: 1 }}
                >
                    {this.messages.map((message, i) => this.renderOneMessage(message, i))}
                </Grid2>
            );
        }
        return null;
    }

    render(): JSX.Element {
        const checkDeps = this.checkDependencies();

        return (
            <Dialog
                onClose={() => {}}
                open={!0}
                sx={{ '& .MuiDialog-paper': styles.paper }}
            >
                <DialogTitle>
                    <Typography
                        component="h2"
                        variant="h6"
                        sx={{ '&.MuiTypography-root': styles.typography }}
                    >
                        {this.t('You are going to add new instance:')} {this.props.adapter}
                        <IconButton
                            size="large"
                            sx={styles.closeButton}
                            onClick={() => this.props.onClose(false)}
                        >
                            <CloseIcon />
                        </IconButton>
                        {this.messages && this.lang !== 'en' && this.props.toggleTranslation ? (
                            <IconButton
                                size="large"
                                style={Utils.getStyle(
                                    this.props.theme,
                                    styles.languageButton,
                                    this.props.noTranslation && styles.languageButtonActive,
                                )}
                                onClick={this.props.toggleTranslation}
                                title={I18n.t('Disable/Enable translation')}
                            >
                                <LanguageIcon />
                            </IconButton>
                        ) : null}
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    {this.renderMessages()}
                    {!checkDeps && this.props.expertMode ? (
                        <Grid2
                            container
                            direction="column"
                        >
                            <HostSelectors
                                tooltip={this.t('Select host to add the instance')}
                                expertMode
                                socket={this.props.socket}
                                hostsWorker={this.props.hostsWorker}
                                currentHost={this.props.currentHost}
                                setCurrentHost={(hostName, hostId) =>
                                    this.props.onHostChange(hostId.replace(/^system\.host\./, ''))
                                }
                            />
                            <FormControl
                                variant="standard"
                                style={styles.formControl}
                            >
                                <InputLabel id="instance-label">{this.t('Instance')}</InputLabel>
                                <Select
                                    variant="standard"
                                    labelId="instance-label"
                                    value={this.props.currentInstance}
                                    onChange={this.props.onInstanceChange}
                                >
                                    {this.getAvailableInstances()}
                                </Select>
                            </FormControl>
                        </Grid2>
                    ) : null}
                    <Box
                        component="div"
                        sx={styles.deps}
                    >
                        {checkDeps}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        id="instance-add-dialog-ok"
                        variant="contained"
                        autoFocus
                        disabled={!!checkDeps}
                        onClick={() => this.props.onClose(true)}
                        color="primary"
                        startIcon={<AddIcon />}
                    >
                        {this.t('Add')}
                    </Button>
                    <Button
                        id="instance-add-dialog-cancel"
                        variant="contained"
                        onClick={() => this.props.onClose(false)}
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

export default AddInstanceDialog;
