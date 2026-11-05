import React, { type JSX } from 'react';

import { alpha, Box, Chip, Tooltip, Typography } from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';

import type { Translate } from '@iobroker/gui-components';

import { permissionLabel, type Permission } from '@/helpers/permissions';

interface NoPermissionProps {
    t: Translate;
    /** The rights the user lacks for this tab */
    missing: Permission[];
}

/**
 * Takes the place of the buttons of something the user may look at, but not change. The tooltip
 * names the missing right.
 *
 * @param props properties
 * @param props.t translation function
 * @param props.reason text of the tooltip, see `lockedText`
 */
export function ReadOnlyChip(props: { t: Translate; reason: string }): JSX.Element {
    return (
        <Tooltip title={props.reason}>
            <Chip
                icon={<LockIcon />}
                label={props.t('Read-only')}
                size="small"
                variant="outlined"
                color="warning"
            />
        </Tooltip>
    );
}

/**
 * Takes the place of a tab the user may not use. It names the missing rights with the words of the
 * group dialog, so that an administrator finds them there.
 */
export default function NoPermission(props: NoPermissionProps): JSX.Element {
    const { t, missing } = props;

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            <Box
                sx={{
                    maxWidth: 460,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    textAlign: 'center',
                }}
            >
                <Box
                    sx={theme => ({
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.palette.warning.main,
                        backgroundColor: alpha(theme.palette.warning.main, 0.12),
                    })}
                >
                    <LockIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography variant="h6">{t('No permission')}</Typography>
                <Typography color="text.secondary">{t('Your user group lacks this permission:')}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
                    {missing.map(permission => (
                        <Chip
                            key={`${permission.type}.${permission.operation}`}
                            label={permissionLabel(permission, t)}
                            variant="outlined"
                            color="warning"
                        />
                    ))}
                </Box>
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {t('An administrator can grant it in the tab "Users": edit the group, then "Permissions".')}
                </Typography>
            </Box>
        </Box>
    );
}
