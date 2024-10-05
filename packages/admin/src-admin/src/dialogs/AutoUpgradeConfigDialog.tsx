import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select, Typography } from '@mui/material';

import {
    Close as CloseIcon,
    HorizontalRule,
    KeyboardDoubleArrowUp,
    North,
    VerticalAlignTop,
} from '@mui/icons-material';

import { type AdminConnection, I18n, IconCopy as SaveIcon } from '@iobroker/adapter-react-v5';
import { InfoBox } from '@foxriver76/iob-component-lib';
import IsVisible from '@/components/IsVisible';
import { AUTO_UPGRADE_OPTIONS_MAPPING, AUTO_UPGRADE_SETTINGS } from '@/helpers/utils';

export const ICONS: Record<string, React.JSX.Element> = {
    none: <HorizontalRule />,
    patch: <KeyboardDoubleArrowUp style={{ color: 'green' }} />,
    minor: <North style={{ color: 'orange' }} />,
    major: <VerticalAlignTop style={{ color: 'red' }} />,
};

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

interface AutoUpgradeConfigDialogState {
    /** Auto upgrade policy which is currently saved */
    currentSavedPolicy: ioBroker.AutoUpgradePolicy;
    /** The current configured auto upgrade policy */
    policy: ioBroker.AutoUpgradePolicy;
    /** The repositories the config apply for */
    repositories: string[];
    /** If the feature is supported */
    supported: boolean;
}

export default class AutoUpgradeConfigDialog extends React.Component<
    AutoUpgradeConfigDialogProps,
    AutoUpgradeConfigDialogState
> {
    constructor(props: AutoUpgradeConfigDialogProps) {
        super(props);

        this.state = {
            currentSavedPolicy: 'none',
            policy: 'none',
            repositories: [],
            supported: true,
        };
    }

    /**
     * Lifecycle hook called if component is mounted
     */
    async componentDidMount(): Promise<void> {
        await this.getConfiguredRepositories();
        await this.getCurrentAutoUpgradeSetting();
    }

    async getConfiguredRepositories(): Promise<void> {
        const sysConfig = await this.props.socket.getObject('system.config');

        if (!sysConfig?.common?.adapterAutoUpgrade) {
            return;
        }

        const activeRepos = Object.entries(sysConfig.common.adapterAutoUpgrade.repositories)
            .filter(([, active]) => active)
            .map(([repoName]) => repoName);

        this.setState({ repositories: activeRepos });
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
        const obj = (await this.props.socket.getObject(this.getAdapterId())) as ioBroker.AdapterObject;

        if (!obj) {
            console.error('no adapter object existing');
            this.setState({ supported: false });
            return;
        }

        this.setState({
            policy: obj.common.automaticUpgrade || 'none',
            currentSavedPolicy: obj.common.automaticUpgrade || 'none',
        });
    }

    /**
     * Save the current setting to the adapter object
     */
    async save(): Promise<void> {
        const obj = (await this.props.socket.getObject(this.getAdapterId())) as ioBroker.AdapterObject;

        if (!obj) {
            console.error('no adapter object existing');
            this.setState({ supported: false });
            return;
        }

        obj.common.automaticUpgrade = this.state.policy;
        await this.props.socket.setObject(this.getAdapterId(), obj);
        this.setState({ currentSavedPolicy: this.state.policy }, () => this.props.onClose());
    }

    /**
     * Render the element
     */
    render(): React.JSX.Element {
        return (
            <Dialog
                open={!0}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>{I18n.t('Auto upgrade policy for %s', this.props.adapter)}</DialogTitle>
                <DialogContent style={{ padding: '0 20px', overflow: 'hidden' }}>
                    <IsVisible value={!this.state.supported}>
                        <Typography>
                            {I18n.t('This feature is supported up from js-controller Kiera (Version 6)!')}
                        </Typography>
                    </IsVisible>
                    <IsVisible value={this.state.supported}>
                        <Typography>
                            {I18n.t('Allow only the following upgrades to be performed automatically:')}
                        </Typography>
                        <Select
                            variant="standard"
                            style={{
                                marginTop: 20,
                                minWidth: 150,
                                marginBottom: 8,
                            }}
                            value={this.state.policy}
                            onChange={e => this.setState({ policy: e.target.value as ioBroker.AutoUpgradePolicy })}
                        >
                            {AUTO_UPGRADE_SETTINGS.map(option => (
                                <MenuItem
                                    key={option}
                                    value={option}
                                >
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {ICONS[option]}
                                        {AUTO_UPGRADE_OPTIONS_MAPPING[option]}
                                    </div>
                                </MenuItem>
                            ))}
                        </Select>
                        <IsVisible value={this.state.repositories.includes('beta') && this.state.policy !== 'none'}>
                            <InfoBox type="warning">{I18n.t('repo_update_hint')}</InfoBox>
                        </IsVisible>
                        <IsVisible value={this.state.policy === 'major'}>
                            <InfoBox type="warning">
                                {I18n.t(
                                    'The current selected configuration will allow to automatically pull in incompatible changes of this adapter!',
                                )}
                            </InfoBox>
                        </IsVisible>
                    </IsVisible>
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={this.state.currentSavedPolicy === this.state.policy}
                        color="primary"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => this.save()}
                    >
                        {I18n.t('Save')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => this.props.onClose()}
                        color="grey"
                        startIcon={<CloseIcon />}
                    >
                        {I18n.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
