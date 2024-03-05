import React from 'react';
import {
    Paper, Toolbar, Button, Accordion, Box, AccordionSummary, AccordionDetails, Checkbox,
} from '@mui/material';
import { Check as IconCheck, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { type AdminConnection, I18n } from '@iobroker/adapter-react-v5';
import type { Repository } from '@/types';

interface WizardAdaptersTabProps {
    /** Function to call if wizard step finishes */
    onDone: () => void;
    /** The socket connection */
    socket: AdminConnection;
    /** The host name */
    host: string;
    /** Execute command on given host */
    executeCommand: (cmd: string, host: string, cb: () => void) => void;
}

interface WizardAdaptersTabState {
    /** The repository */
    repository: Repository;
    /** Adapters which should be installed */
    selectedAdapters: string[];
}

interface AdapterOptions {
    /** Adapter name */
    name: string;
    /** Adapter description */
    description: string;
}

export default class WizardAdaptersTab extends React.Component<WizardAdaptersTabProps, WizardAdaptersTabState> {
    /** Height of the toolbar */
    private readonly TOOLBAR_HEIGHT = 64;

    constructor(props: WizardAdaptersTabProps) {
        super(props);

        this.state = {
            repository: {},
            selectedAdapters: [],
        };
    }

    /**
     * Lifecycle hook called if component is mounted
     */
    async componentDidMount(): Promise<void> {
        try {
            const repository = await this.props.socket
                .getRepository(
                    this.props.host,
                    { repo: this.props.socket.systemConfig.common.activeRepo },
                );

            this.setState({ repository });
        } catch (e) {
            console.error(`Could not read repository: ${e.message}`);
        }
    }

    /**
     * Install adapters if next button is called
     */
    async onDone(): Promise<void> {
        const { selectedAdapters } = this.state;

        this.props.onDone();

        // after calling onDone we install in background
        for (const adapter of selectedAdapters) {
            console.log(`install ${adapter}`);
            await new Promise<void>(resolve => {
                this.props.executeCommand(`add ${adapter}`, this.props.host, resolve);
            });
        }
    }

    /**
     * Render Accordion for given adapter
     *
     * @param options Adapter specific information
     */
    renderAdapterAccordion(options: AdapterOptions): React.ReactNode {
        const { name, description } = options;

        const adapter = this.state.repository[name];

        if (!adapter) {
            return null;
        }

        const lang = this.props.socket.systemLang;

        const title = adapter.titleLang[lang];

        return <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Accordion sx={{
                borderColor: 'background.paper', borderWidth: '1px', borderStyle: 'solid', width: '100%',
            }}
            >
                <AccordionSummary
                    sx={{
                        backgroundColor: 'primary.main',
                        fontWeight: 'bold',
                    }}
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                            sx={{ color: 'text.primary', '&.Mui-checked': { color: 'text.primary' } }}
                            onClick={e => e.stopPropagation()}
                            onChange={() => {
                                const { selectedAdapters } = this.state;

                                if (selectedAdapters.includes(name)) {
                                    const idx = selectedAdapters.indexOf(name);
                                    selectedAdapters.splice(idx, 1);
                                } else {
                                    selectedAdapters.push(name);
                                }

                                this.setState({ selectedAdapters });
                            }}
                        />
                        <img alt={title} src={adapter.extIcon} style={{ width: 45, height: 45 }} />
                        {title}
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: 'background.appbar' }}>
                    {description}
                </AccordionDetails>
            </Accordion>
        </Box>;
    }

    /**
     * Render the component
     */
    render(): React.ReactNode {
        return <Paper sx={{
            height: '100%',
            maxHeight: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}
        >
            <Box sx={{
                height: `calc(100% - ${this.TOOLBAR_HEIGHT}px)`,
                width: '90%',
                overflow: 'auto',
                '-ms-overflow-style': 'none',
                'scrollbar-width': 'none',
                '&::-webkit-scrollbar': {
                    display: 'none',
                },
            }}
            >
                <h2>{I18n.t('Cloud')}</h2>
                {this.renderAdapterAccordion({
                    name: 'iot',
                    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse\n' +
                        '                malesuada lacus ex, sit amet blandit leo lobortis eget.',
                })}
                {this.renderAdapterAccordion({ name: 'cloud', description: 'TODO' })}
                <h2>{I18n.t('Logic')}</h2>
                {this.renderAdapterAccordion({ name: 'javascript', description: 'TODO' })}
                {this.renderAdapterAccordion({ name: 'scenes', description: 'TODO' })}
                <h2>{I18n.t('Notifications')}</h2>
                {this.renderAdapterAccordion({ name: 'notification-manager', description: 'TODO' })}
                {this.renderAdapterAccordion({ name: 'telegram', description: 'TODO' })}
                {this.renderAdapterAccordion({ name: 'email', description: 'TODO' })}
                {this.renderAdapterAccordion({ name: 'pushover', description: 'TODO' })}
                {this.renderAdapterAccordion({ name: 'signal-cmb', description: 'TODO' })}
                <h2>{I18n.t('History data')}</h2>
                {this.renderAdapterAccordion({ name: 'history', description: 'TODO' })}
                {this.renderAdapterAccordion({ name: 'sql', description: 'TODO' })}
                <h2>{I18n.t('Weather')}</h2>
                {this.renderAdapterAccordion({ name: 'weatherunderground', description: 'TODO' })}
                <h2>{I18n.t('Visualization')}</h2>
                {this.renderAdapterAccordion({ name: 'vis-2', description: 'TODO' })}
            </Box>
            <Toolbar sx={{
                height: this.TOOLBAR_HEIGHT,
                lineHeight: `${this.TOOLBAR_HEIGHT}px`,
                width: '100%',
            }}
            >
                <div style={{ flexGrow: 1 }} />
                <Button
                    color="primary"
                    variant="contained"
                    onClick={() => this.onDone()}
                    startIcon={<IconCheck />}
                >
                    {I18n.t('Apply')}
                </Button>
            </Toolbar>
        </Paper>;
    }
}
