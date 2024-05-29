import React from 'react';
import {
    Button,
    Dialog, DialogActions, DialogContent,
    DialogTitle, MenuItem, Select, Typography,
} from '@mui/material';
import {
    AdminConnection, I18n, IconCopy as SaveIcon,
} from '@iobroker/adapter-react-v5';
import { Close as CloseIcon } from '@mui/icons-material';
import IsVisible from '@/components/IsVisible';

interface AutoUpgradeConfigDialogProps {
    /** Called when user closes dialog */
    onClose: () => void;
    /** The socket connection */
    socket: AdminConnection;
    /** The host id of the host to upgrade node.js on */
    hostId: string;
    /** Name of the adapter */
    adapter: string;
}

/** All possible auto upgrade settings */
const AUTO_UPGRADE_SETTINGS: ioBroker.AutoUpgradePolicy[] = ['none', 'patch', 'minor', 'major'];

interface AutoUpgradeConfigDialogState {
    /** The current configured auto upgrade policy */
    policy: ioBroker.AutoUpgradePolicy;
    /** The repositories the config applies for */
    repositories: string[];
}

export default class AutoUpgradeConfigDialog extends React.Component<AutoUpgradeConfigDialogProps, AutoUpgradeConfigDialogState> {
    constructor(props: AutoUpgradeConfigDialogProps) {
        super(props);

        this.state = {
            policy: 'none',
            repositories: [],
        };
    }

    /**
     * Lifecycle hook called if component is mounted
     */
    async componentDidMount(): Promise<void> {
        console.log(this.getAdapterId());
        await this.getConfiguredRepositories();
        await this.getCurrentAutoUpgradeSetting();
    }

    async getConfiguredRepositories(): Promise<void> {
        const sysConfig = await this.props.socket.getObject('system.config');

        if (!sysConfig?.common?.adapterAutoUpgrade) {
            return;
        }

        const activeRepos = Object.entries(sysConfig.common.adapterAutoUpgrade.repositories).filter(([repoName, active]) => active).map(([repoName]) => repoName);

        this.setState({ repositories: activeRepos });
    }

    /**
     * Render the element
     */
    render(): React.JSX.Element {
        console.log(this.state.policy);
        return (
            <Dialog open={!0} maxWidth="lg" fullWidth>
                <DialogTitle>{I18n.t('Auto upgrade policy for %s', this.props.adapter)}</DialogTitle>
                <DialogContent style={{ height: 150, padding: '0 20px', overflow: 'hidden' }}>
                    <Typography>{I18n.t('Allow only the following upgrades to be performed automatically:')}</Typography>
                    <Select sx={{ height: 40 }} value={this.state.policy} onChange={e => this.setState({ policy: e.target.value as ioBroker.AutoUpgradePolicy })}>
                        {AUTO_UPGRADE_SETTINGS.map(
                            option => <MenuItem value={option}>{option}</MenuItem>,
                        )}
                    </Select>
                    <IsVisible value={this.state.repositories.includes('beta') && this.state.policy !== 'none'}>
                        <Typography sx={{ color: 'red' }}>{I18n.t('You have configured to run automatic upgrades for the "beta" repository, be aware that if the beta repository is active this adapter will pull in beta updates automatically according to this configuration!')}</Typography>
                    </IsVisible>
                    <IsVisible value={this.state.policy === 'major'}>
                        <Typography sx={{ color: 'red' }}>{I18n.t('This will allow to automatically pull in breaking changes of this adapter!')}</Typography>
                    </IsVisible>
                </DialogContent>
                <DialogActions>
                    <Button
                        color="primary"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => this.save()}
                    >
                        {I18n.t('Save')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            this.props.onClose();
                        }}
                        color="primary"
                        startIcon={<CloseIcon />}
                    >
                        {I18n.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    /**
     * Get id of the adapter object
     */
    private getAdapterId(): string {
        return `${this.props.hostId}.adapter.${this.props.adapter}`;
    }

    /**
     * Get the current auto upgrade setting
     */
    async getCurrentAutoUpgradeSetting(): Promise<void> {
        const obj = await this.props.socket.getObject(this.getAdapterId()) as ioBroker.AdapterObject;

        if (!obj) {
            throw new Error('no adapter object existing');
        }

        this.setState({ policy: obj.common.automaticUpgrade });
    }

    /**
     * Save the current setting to the adapter object
     */
    async save(): Promise<void> {
        const obj = await this.props.socket.getObject(this.getAdapterId()) as ioBroker.AdapterObject;

        if (!obj) {
            throw new Error('no adapter object existing');
        }

        obj.common.automaticUpgrade = this.state.policy;
        await this.props.socket.setObject(this.getAdapterId(), obj);
    }
}
