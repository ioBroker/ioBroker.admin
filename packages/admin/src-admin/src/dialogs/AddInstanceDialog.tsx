import React, { Component } from 'react';

import { withStyles } from '@mui/styles';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    type SelectChangeEvent,
} from '@mui/material';
import {
    Close as CloseIcon,
    Add as AddIcon,
    Public as IconWeb,
    Language as LanguageIcon,
} from '@mui/icons-material';

import {
    type AdminConnection,
    I18n, Utils,
    type IobTheme,
} from '@iobroker/adapter-react-v5';

import type HostsWorker from '@/Workers/HostsWorker';
import type InstancesWorker from '@/Workers/InstancesWorker';
import { checkCondition, type CompactInstanceInfo, type Message } from '@/dialogs/AdapterUpdateDialog';
import HostSelectors from '@/components/HostSelectors';

const styles: Record<string, any> = (theme: IobTheme) => ({
    formControl: {
        marginTop: theme.spacing(3),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
    languageButton: {
        position: 'absolute',
        right: 52 + parseInt(theme.spacing(1), 10),
        top: theme.spacing(1),
    },
    languageButtonActive: {
        color: theme.palette.primary.main,
    },
    paper: {
        // minWidth: 600
    },
    typography: {
        paddingRight: 30,
    },
    messageText: {

    },
    messageColor_warn: {
        color: '#cb7642',
    },
    messageColor_error: {
        color: '#f5614d',
    },
    messageColor_info: {
        color: '#5abd29',
    },
    messageTitle_warn: {
        background: '#cb7642',
        borderRadius: 3,
        paddingLeft: 10,
        fontWeight: 'bold',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    },
    messageTitle_error: {
        background: '#f5614d',
        borderRadius: 3,
        paddingLeft: 10,
        fontWeight: 'bold',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    },
    messageTitle_info: {
        background: '#5abd29',
        borderRadius: 3,
        paddingLeft: 10,
        fontWeight: 'bold',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    },
    deps: {
        margin: 10,
        fontSize: 16,
        color: theme.palette.mode === 'dark' ? '#e70000' : '#840101',
    },
});

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
    t: (text: string, arg1?: any, arg?: any) => string;
    onClick: () => void;
    onClose: () => void;
    onHostChange: (host: string) => void;
    onInstanceChange: (event: SelectChangeEvent<string>) => void;
    instances: Record<string, CompactInstanceInfo>;
    adapterObject: ioBroker.AdapterCommon;
    classes: Record<string, any>;
    dependencies: AdapterDependencies[];
    hostsWorker: InstanceType<typeof HostsWorker>;
    noTranslation: boolean;
    toggleTranslation: () => void;
    expertMode: boolean;
}

interface AddInstanceDialogState {
    instanceNumbers: string[];
}

class AddInstanceDialog extends Component<AddInstanceDialogProps, AddInstanceDialogState> {
    private readonly t: (text: string, arg1?: any, arg?: any) => string;

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

    componentDidMount() {
        this.props.instancesWorker.getInstances()
            .then((instances: Record<string, ioBroker.InstanceObject>) => {
                const instanceNumbers = Object.keys(instances)
                    .filter(id => instances[id]?.common?.name === this.props.adapter)
                    .map(id => id.substring(id.lastIndexOf('.') + 1));

                this.setState({ instanceNumbers });
            });
    }

    getAvailableInstances() {
        const result = [];
        result.push(<MenuItem value="auto" key="auto">{this.t('auto')}</MenuItem>);

        for (let i = 0; i <= 10; i++) {
            if (!this.state.instanceNumbers.includes(i.toString())) {
                result.push(<MenuItem value={i} key={i}>{i}</MenuItem>);
            }
        }

        return result;
    }

    checkDependencies(dependencies = this.props.dependencies) {
        if (!dependencies) {
            return '';
        }
        const array = [];
        for (const adapter of dependencies) {
            if (!adapter.installedVersion) {
                array.push(this.props.t('Latest available version of "%s" is required, but nothing installed. Please install first "%s" and then retry.', adapter.name, adapter.name));
            } else if (!adapter.rightVersion) {
                array.push(`${this.props.t('Invalid version of %s. Required %s. Current ', adapter.name, adapter.version)}${adapter.installedVersion}`);
            }
        }
        return array.length ? array.map(el => <div key={el}>{el}</div>) : '';
    }

    getText(text: string | {[lang: string]: string}, noTranslation?: boolean): string {
        if (text && typeof text === 'object') {
            if (noTranslation) {
                return text.en;
            }
            return text[this.lang] || text.en;
        }
        return typeof text === 'object' ? '' : text;
    }

    renderOneMessage(message: Message, index: number) {
        return <Grid item key={index}>
            <Typography className={this.props.classes[`messageTitle_${message.level || 'warn'}`]}>
                {this.getText(message.title, this.props.noTranslation) || ''}
            </Typography>
            <Typography component="div" variant="body2" className={this.props.classes.messageText}>
                {this.getText(message.text, this.props.noTranslation) || ''}
            </Typography>
            {message.link ?
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
                : null}
        </Grid>;
    }

    renderMessages() {
        if (this.messages) {
            return <Grid
                container
                spacing={2}
                direction="column"
                wrap="nowrap"
                sx={{ marginBottom: 1 }}
            >
                {this.messages.map((message, i) => this.renderOneMessage(message, i))}
            </Grid>;
        }
        return null;
    }

    render() {
        const { classes } = this.props;

        const checkDeps = this.checkDependencies();

        return <Dialog
            onClose={this.props.onClose}
            open={!0}
            classes={{ paper: classes.paper }}
        >
            <DialogTitle>
                <Typography component="h2" variant="h6" classes={{ root: classes.typography }}>
                    {this.t('You are going to add new instance:')}
                    {' '}
                    {this.props.adapter}
                    <IconButton size="large" className={classes.closeButton} onClick={this.props.onClose}>
                        <CloseIcon />
                    </IconButton>
                    {this.messages && this.lang !== 'en' && this.props.toggleTranslation ? <IconButton
                        size="large"
                        className={Utils.clsx(classes.languageButton, this.props.noTranslation && classes.languageButtonActive)}
                        onClick={this.props.toggleTranslation}
                        title={I18n.t('Disable/Enable translation')}
                    >
                        <LanguageIcon />
                    </IconButton> : null}
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {this.renderMessages()}
                {!checkDeps && this.props.expertMode ? <Grid
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
                            this.props.onHostChange(hostId.replace(/^system\.host\./, ''))}
                    />
                    <FormControl variant="standard" className={classes.formControl}>
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
                </Grid> : null}
                <div className={classes.deps}>
                    {checkDeps}
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    autoFocus
                    disabled={!!checkDeps}
                    onClick={() => {
                        this.props.onClick();
                        this.props.onClose();
                    }}
                    color="primary"
                    startIcon={<AddIcon />}
                >
                    {this.t('Add')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => this.props.onClose()}
                    color="grey"
                    startIcon={<CloseIcon />}
                >
                    {this.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

export default withStyles(styles)(AddInstanceDialog);
