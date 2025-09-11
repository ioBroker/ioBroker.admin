import React, { useState } from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    Box,
    Accordion,
    AccordionDetails,
    AccordionSummary,
    List,
    ListItem,
    ListItemText,
    Alert,
    AlertTitle,
    Checkbox,
    FormControlLabel,
} from '@mui/material';

import {
    Warning as WarningIcon,
    Schedule as ScheduleIcon,
    ExpandMore as ExpandMoreIcon,
    Computer as ComputerIcon,
    Storage as StorageIcon,
} from '@mui/icons-material';

import { I18n, type IobTheme } from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = {
    root: (theme: IobTheme) => ({
        backgroundColor: theme.palette.background.paper,
    }),
    paper: {
        maxWidth: 800,
        width: '100%',
    },
    warningIcon: {
        marginRight: 8,
        color: '#ff9800',
    },
    timezoneInfo: {
        padding: 16,
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderRadius: 4,
        margin: '16px 0',
    },
    timezoneRow: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 8,
    },
    instructions: {
        marginTop: 16,
    },
    instructionItem: {
        fontFamily: 'monospace',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        padding: 4,
        borderRadius: 2,
    },
};

export interface TimezoneWarningDialogProps {
    /** If the dialog is open */
    open: boolean;
    /** Called when dialog should be closed */
    onClose: (dismissed: boolean) => void;
    /** Client timezone information */
    clientTimezone: string;
    /** Server timezone information */
    serverTimezone: string;
    /** Timezone offset difference in hours */
    offsetDifferenceHours: number;
    /** Theme for styling */
    theme: IobTheme;
    /** Current language */
    lang: ioBroker.Languages;
}

const TimezoneWarningDialog: React.FC<TimezoneWarningDialogProps> = ({
    open,
    onClose,
    clientTimezone,
    serverTimezone,
    offsetDifferenceHours,
}) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleClose = (dismissed: boolean): void => {
        onClose(dismissed);
    };

    const getOsInstructions = (): {
        windows: string[];
        linux: string[];
        macos: string[];
    } => {
        const instructions = {
            windows: [
                I18n.t('timezone_fix_windows_1'),
                I18n.t('timezone_fix_windows_2'),
                I18n.t('timezone_fix_windows_3'),
                I18n.t('timezone_fix_windows_4'),
            ],
            linux: [I18n.t('timezone_fix_linux_1'), I18n.t('timezone_fix_linux_2'), I18n.t('timezone_fix_linux_3')],
            macos: [I18n.t('timezone_fix_macos_1'), I18n.t('timezone_fix_macos_2'), I18n.t('timezone_fix_macos_3')],
        };
        return instructions;
    };

    const renderInstructions = (osType: string, instructions: string[]): React.JSX.Element => (
        <Accordion key={osType}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{I18n.t(`timezone_fix_${osType}_title`)}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <List dense>
                    {instructions.map((instruction, index) => (
                        <ListItem key={index}>
                            <ListItemText
                                primary={`${index + 1}. ${instruction}`}
                                primaryTypographyProps={{
                                    style:
                                        instruction.includes('sudo') || instruction.includes('timedatectl')
                                            ? styles.instructionItem
                                            : undefined,
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
            </AccordionDetails>
        </Accordion>
    );

    const osInstructions = getOsInstructions();

    return (
        <Dialog
            open={open}
            onClose={() => handleClose(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{ style: styles.paper }}
        >
            <DialogTitle>
                <Box
                    display="flex"
                    alignItems="center"
                >
                    <WarningIcon style={styles.warningIcon} />
                    <Typography variant="h6">{I18n.t('timezone_warning_title')}</Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Alert
                    severity="warning"
                    sx={{ mb: 2 }}
                >
                    <AlertTitle>{I18n.t('timezone_warning_alert_title')}</AlertTitle>
                    {I18n.t('timezone_warning_description')}
                </Alert>

                <Box style={styles.timezoneInfo}>
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        {I18n.t('timezone_current_settings')}
                    </Typography>

                    <Box style={styles.timezoneRow}>
                        <ComputerIcon style={{ marginRight: 8 }} />
                        <Typography>
                            <strong>{I18n.t('timezone_client')}:</strong> {clientTimezone}
                        </Typography>
                    </Box>

                    <Box style={styles.timezoneRow}>
                        <StorageIcon style={{ marginRight: 8 }} />
                        <Typography>
                            <strong>{I18n.t('timezone_server')}:</strong> {serverTimezone}
                        </Typography>
                    </Box>

                    <Box style={styles.timezoneRow}>
                        <ScheduleIcon style={{ marginRight: 8 }} />
                        <Typography>
                            <strong>{I18n.t('timezone_difference')}:</strong> {Math.abs(offsetDifferenceHours)}{' '}
                            {I18n.t('hours')}
                        </Typography>
                    </Box>
                </Box>

                <Typography
                    variant="body1"
                    gutterBottom
                >
                    {I18n.t('timezone_impact_description')}
                </Typography>

                <Box style={styles.instructions}>
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        {I18n.t('timezone_fix_instructions_title')}
                    </Typography>

                    {Object.entries(osInstructions).map(([osType, instructions]) =>
                        renderInstructions(osType, instructions),
                    )}
                </Box>

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={dontShowAgain}
                            onChange={e => setDontShowAgain(e.target.checked)}
                        />
                    }
                    label={I18n.t('timezone_dont_show_again')}
                    style={{ marginTop: 16 }}
                />
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={() => handleClose(false)}
                    variant="outlined"
                >
                    {I18n.t('timezone_remind_later')}
                </Button>
                <Button
                    onClick={() => {
                        if (dontShowAgain) {
                            // Store the dismissal preference
                            localStorage.setItem('App.timezoneWarningDismissed', 'true');
                        }
                        handleClose(true);
                    }}
                    variant="contained"
                >
                    {dontShowAgain ? I18n.t('timezone_dismiss_permanently') : I18n.t('timezone_understood')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TimezoneWarningDialog;
