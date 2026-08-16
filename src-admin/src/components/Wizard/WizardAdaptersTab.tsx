import React, { type JSX } from 'react';
import {
    Button,
    Accordion,
    Box,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    Typography,
    LinearProgress,
} from '@mui/material';
import { Check as IconCheck, ExpandMore as ExpandMoreIcon, ArrowForward as IconNext } from '@mui/icons-material';

import { type AdminConnection, I18n } from '@iobroker/gui-components';
import type { Repository } from '@/types';

import WizardStepFrame from './WizardStepFrame';

/** Adapters, which are offered in the wizard, grouped by category */
const CATEGORIES: { name: string; description: string; adapters: string[] }[] = [
    { name: 'Cloud', description: 'cloud wizard category', adapters: ['iot', 'cloud'] },
    { name: 'Logic', description: 'logic wizard category', adapters: ['javascript', 'scenes'] },
    {
        name: 'Notifications',
        description: 'notifications wizard category',
        adapters: ['notification-manager', 'telegram', 'email', 'pushover', 'signal-cmb'],
    },
    { name: 'History data', description: 'history wizard category', adapters: ['history', 'sql'] },
    { name: 'Weather', description: 'weather wizard category', adapters: ['weatherunderground'] },
    { name: 'Visualization', description: 'visualization wizard category', adapters: ['vis-2'] },
];

interface WizardAdaptersTabProps {
    /** Function to call if wizard step finishes */
    onDone: (selectedAdapters: string[]) => void;
    /** Go one step back */
    onBack?: () => void;
    /** The socket connection */
    socket: AdminConnection;
    /** The host name */
    host: string;
    /** Already selected adapters, so the step can be visited again */
    adapters: string[];
    /** Execute command on given host */
    executeCommand: (cmd: string, host: string, cb: () => void) => void;
}

interface WizardAdaptersTabState {
    /** The repository */
    repository: Repository;
    /** True while the repository is read */
    loading: boolean;
    /** Adapters, which should be installed */
    selectedAdapters: string[];
}

export default class WizardAdaptersTab extends React.Component<WizardAdaptersTabProps, WizardAdaptersTabState> {
    constructor(props: WizardAdaptersTabProps) {
        super(props);

        this.state = {
            repository: {},
            loading: true,
            selectedAdapters: [...props.adapters],
        };
    }

    /**
     * Lifecycle hook called if component is mounted
     */
    async componentDidMount(): Promise<void> {
        try {
            const repository = await this.props.socket.getRepository(this.props.host, {
                repo: this.props.socket.systemConfig?.common.activeRepo,
            });

            this.setState({ repository, loading: false });
        } catch (e) {
            this.setState({ loading: false });
            console.error(`Could not read repository: ${(e as Error).message}`);
        }
    }

    /**
     * Install adapters if the next button is called
     */
    async onDone(): Promise<void> {
        const { selectedAdapters } = this.state;

        this.props.onDone(selectedAdapters);

        // after calling onDone we install in the background
        for (const adapter of selectedAdapters) {
            await new Promise<void>(resolve => {
                this.props.executeCommand(`add ${adapter}`, this.props.host, resolve);
            });
        }
    }

    toggleAdapter(name: string): void {
        const selectedAdapters = [...this.state.selectedAdapters];
        const idx = selectedAdapters.indexOf(name);

        if (idx === -1) {
            selectedAdapters.push(name);
        } else {
            selectedAdapters.splice(idx, 1);
        }

        this.setState({ selectedAdapters });
    }

    /**
     * Render one adapter with its description
     *
     * @param name Adapter name
     */
    renderAdapter(name: string): JSX.Element | null {
        const adapter = this.state.repository[name];

        if (!adapter) {
            return null;
        }

        const lang = this.props.socket.systemLang;
        const title = adapter.titleLang?.[lang] || adapter.titleLang?.en || name;
        const selected = this.state.selectedAdapters.includes(name);

        return (
            <Accordion
                key={name}
                disableGutters
                elevation={0}
                sx={{
                    border: '1px solid',
                    borderColor: selected ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    '&::before': { display: 'none' },
                    '&:not(:last-child)': { mb: 1 },
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`${name}-content`}
                    id={`${name}-header`}
                    sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1, my: 1 } }}
                >
                    <Checkbox
                        checked={selected}
                        onClick={e => e.stopPropagation()}
                        onChange={() => this.toggleAdapter(name)}
                        slotProps={{ input: { 'aria-label': title } }}
                    />
                    <Box
                        component="img"
                        alt=""
                        src={adapter.extIcon}
                        sx={{ width: 40, height: 40, objectFit: 'contain' }}
                    />
                    <Typography sx={{ fontWeight: 500 }}>{title}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: 'action.hover' }}>
                    <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-wrap' }}
                    >
                        {I18n.t(`${name} wizard description`)}
                    </Typography>
                </AccordionDetails>
            </Accordion>
        );
    }

    /**
     * Render the actual content
     */
    renderContent(): JSX.Element {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {CATEGORIES.map(category => {
                    const adapters = category.adapters
                        .map(name => this.renderAdapter(name))
                        .filter(adapter => adapter !== null);

                    if (!adapters.length) {
                        return null;
                    }

                    return (
                        <Box key={category.name}>
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: 600 }}
                            >
                                {I18n.t(category.name)}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary', mb: 1.5 }}
                            >
                                {I18n.t(category.description)}
                            </Typography>
                            {adapters}
                        </Box>
                    );
                })}
            </Box>
        );
    }

    /**
     * Render the component
     */
    render(): JSX.Element {
        const { selectedAdapters } = this.state;

        return (
            <WizardStepFrame
                title={I18n.t('Adapters')}
                description={I18n.t('wizard adapter general description')}
                onBack={this.props.onBack}
                actions={
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={() => this.onDone()}
                        startIcon={selectedAdapters.length ? <IconCheck /> : <IconNext />}
                    >
                        {selectedAdapters.length
                            ? `${I18n.t('Install selected adapters')} (${selectedAdapters.length})`
                            : I18n.t('Next')}
                    </Button>
                }
            >
                {this.state.loading ? <LinearProgress /> : this.renderContent()}
            </WizardStepFrame>
        );
    }
}
