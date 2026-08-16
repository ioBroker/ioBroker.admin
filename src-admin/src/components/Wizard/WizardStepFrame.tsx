import React, { type JSX, type ReactNode } from 'react';

import { Box, Button, Divider, Paper, Typography } from '@mui/material';

import { ArrowBack as IconBack } from '@mui/icons-material';

import { I18n } from '@iobroker/gui-components';

interface WizardStepFrameProps {
    /** Headline of the step */
    title?: ReactNode;
    /** Short explanation shown under the headline */
    description?: ReactNode;
    /** Content of the step */
    children: ReactNode;
    /** Buttons on the right side of the footer, normally the primary action */
    actions?: ReactNode;
    /** Buttons on the left side of the footer, after the "Back" button */
    secondaryActions?: ReactNode;
    /** If defined, the "Back" button is shown */
    onBack?: () => void;
    /** The step writes its data to the server right now, so the navigation back is not possible */
    busy?: boolean;
    /** Do not limit the content width. Used by the step with the map */
    wide?: boolean;
    /** Do not add paddings around the content. Used by the step with the map */
    noPadding?: boolean;
}

/**
 * Common frame of all wizard steps: scrollable content with headline and a sticky footer with the actions.
 * It keeps every step visually identical, so only the content differs.
 */
export default function WizardStepFrame(props: WizardStepFrameProps): JSX.Element {
    const { title, description, children, actions, secondaryActions, onBack, busy, wide, noPadding } = props;

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 2,
            }}
        >
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflow: noPadding ? 'hidden' : 'auto',
                    px: noPadding ? 0 : { xs: 2, md: 3 },
                    py: noPadding ? 0 : { xs: 2, md: 3 },
                }}
            >
                <Box
                    sx={{
                        height: '100%',
                        maxWidth: wide ? '100%' : 900,
                        mx: 'auto',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {title ? (
                        <Typography
                            variant="h5"
                            component="h2"
                            sx={{ fontWeight: 600, mb: description ? 0.5 : 2 }}
                        >
                            {title}
                        </Typography>
                    ) : null}
                    {description ? (
                        <Typography
                            variant="body2"
                            component="div"
                            sx={{ color: 'text.secondary', mb: 2, whiteSpace: 'pre-wrap' }}
                        >
                            {description}
                        </Typography>
                    ) : null}
                    <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
                </Box>
            </Box>
            <Divider />
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                    px: { xs: 1.5, md: 2 },
                    py: 1.5,
                }}
            >
                {onBack ? (
                    <Button
                        color="grey"
                        disabled={busy}
                        onClick={onBack}
                        startIcon={<IconBack />}
                    >
                        {I18n.t('Back')}
                    </Button>
                ) : null}
                {secondaryActions}
                <Box sx={{ flexGrow: 1 }} />
                {actions}
            </Box>
        </Paper>
    );
}
