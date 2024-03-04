import React from 'react';
import {
    Paper, Toolbar, Button, Accordion, Box, AccordionSummary, AccordionDetails, Checkbox,
} from '@mui/material';
import { Check as IconCheck, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { I18n } from '@iobroker/adapter-react-v5';

interface WizardAdaptersTabProps {
    /** Function to call if wizard step finishes */
    onDone: () => void;
}

interface AdapterOptions {
    /** Adapter name */
    name: string;
    /** Adapter description */
    description: string;
}

export default class WizardAdaptersTab extends React.Component<WizardAdaptersTabProps> {
    /** Height of the toolbar */
    private readonly TOOLBAR_HEIGHT = 64;

    /**
     * Render Accordion for given adapter
     *
     * @param options Adapter specific information
     */
    renderAdapterAccordion(options: AdapterOptions): React.ReactNode {
        const { name, description } = options;

        return <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Checkbox />
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
                    {name}
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
                    name: 'IoT',
                    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse\n' +
                        '                malesuada lacus ex, sit amet blandit leo lobortis eget.',
                })}
                {this.renderAdapterAccordion({ name: 'Cloud', description: 'TODO' })}
                <h2>{I18n.t('Logic')}</h2>
                {this.renderAdapterAccordion({ name: 'Javascript', description: 'TODO' })}
                {this.renderAdapterAccordion({ name: 'Scenes', description: 'TODO' })}
                <h2>{I18n.t('Notifications')}</h2>
                {this.renderAdapterAccordion({ name: 'Notification Manager', description: 'TODO' })}
                {this.renderAdapterAccordion({ name: 'Telegram', description: 'TODO' })}
                {this.renderAdapterAccordion({ name: 'E-Mail', description: 'TODO' })}
                {this.renderAdapterAccordion({ name: 'Pushover', description: 'TODO' })}
                {this.renderAdapterAccordion({ name: 'Signal', description: 'TODO' })}
                <h2>{I18n.t('History')}</h2>
                {this.renderAdapterAccordion({ name: 'History', description: 'TODO' })}
                {this.renderAdapterAccordion({ name: 'SQL', description: 'TODO' })}
                <h2>{I18n.t('Weather')}</h2>
                {this.renderAdapterAccordion({ name: 'Weatherunderground', description: 'TODO' })}
                <h2>{I18n.t('Visualization')}</h2>
                {this.renderAdapterAccordion({ name: 'vis 2', description: 'TODO' })}
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
                    onClick={() => this.props.onDone()}
                    startIcon={<IconCheck />}
                >
                    {I18n.t('Apply')}
                </Button>
            </Toolbar>
        </Paper>;
    }
}
