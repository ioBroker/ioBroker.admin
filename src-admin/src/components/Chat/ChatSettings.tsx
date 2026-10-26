import React, { useState } from 'react';
import {
    Alert,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Switch,
    Typography,
} from '@mui/material';
import {
    Check as CheckIcon,
    Close as CloseIcon,
    Settings as SettingsIcon,
    Tune as TuneIcon,
} from '@mui/icons-material';
import { I18n, Icon } from '@iobroker/gui-components';

import { getAiProviderInfo, openAiSettings } from '../SystemSettings/aiProviders';
import { chatSettingsReady, type ChatSettingsValue } from './chatTypes';

interface ChatSettingsProps {
    value: ChatSettingsValue;
    /** Tool names the user granted blanket approval for ("don't ask again"). */
    autoApprove: string[];
    /** Update the blanket-approval list (applied immediately, persisted by the panel). */
    onChangeAutoApprove: (tools: string[]) => void;
    /** Called with the new value on save, or `undefined` on cancel. */
    onClose: (value?: ChatSettingsValue) => void;
}

/**
 * Settings dialog of the assistant. Provider, key and model are the ones of the system (`system.ai`)
 * and are set up in the system settings - shown here only, with the way to get there.
 */
export default function ChatSettings(props: ChatSettingsProps): React.JSX.Element {
    const [value, setValue] = useState<ChatSettingsValue>({ ...props.value });
    const providerInfo = getAiProviderInfo(value.provider);
    const ready = chatSettingsReady(value) && !!providerInfo;

    return (
        <Dialog
            open
            onClose={() => props.onClose()}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>{I18n.t('AI assistant settings')}</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
                {ready && providerInfo ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px' }}>
                        <Typography color="textSecondary">{I18n.t('Provider')}</Typography>
                        <Typography
                            component="div"
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            {providerInfo.icon ? (
                                <Icon
                                    src={providerInfo.icon}
                                    style={{ width: 20, height: 20 }}
                                />
                            ) : (
                                <TuneIcon style={{ width: 20, height: 20 }} />
                            )}
                            {providerInfo.label}
                        </Typography>
                        <Typography color="textSecondary">{I18n.t('Model')}</Typography>
                        <Typography style={{ wordBreak: 'break-all' }}>{value.model}</Typography>
                    </div>
                ) : (
                    <Alert severity="info">
                        {I18n.t('Please configure the AI provider, credential and model first.')}
                    </Alert>
                )}
                <div>
                    <Button
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => {
                            props.onClose();
                            openAiSettings();
                        }}
                    >
                        {I18n.t('Go to the AI settings')}
                    </Button>
                </div>

                <div>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={value.hideFab}
                                onChange={e => setValue({ ...value, hideFab: e.target.checked })}
                            />
                        }
                        label={I18n.t('Hide assistant button')}
                    />
                    <Typography
                        variant="caption"
                        color="textSecondary"
                        component="div"
                        style={{ marginLeft: 14 }}
                    >
                        {I18n.t('When hidden, move the mouse to the bottom-right corner to reveal it.')}
                    </Typography>
                </div>

                {props.autoApprove.length ? (
                    <div>
                        <Typography
                            variant="caption"
                            color="textSecondary"
                        >
                            {I18n.t('Operations approved without asking (click to revoke):')}
                        </Typography>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                            {props.autoApprove.map(tool => (
                                <Chip
                                    key={tool}
                                    label={tool}
                                    size="small"
                                    onDelete={() =>
                                        props.onChangeAutoApprove(props.autoApprove.filter(entry => entry !== tool))
                                    }
                                />
                            ))}
                        </div>
                    </div>
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckIcon />}
                    disabled={value.hideFab === props.value.hideFab}
                    onClick={() => props.onClose(value)}
                >
                    {I18n.t('Save')}
                </Button>
                <Button
                    color="grey"
                    startIcon={<CloseIcon />}
                    onClick={() => props.onClose()}
                >
                    {I18n.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
