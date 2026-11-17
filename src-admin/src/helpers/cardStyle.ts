import { darken, lighten } from '@mui/material/styles';
import type { IobTheme } from '@iobroker/gui-components';

/**
 * Look of a card that lies on the `paper` colored panel of a tab - the tiles of the quick access and
 * the panels of the overview. With the plain `paper` color of a `Card` they melted into the panel,
 * so they get a tone of their own.
 */
export function raisedCardStyle(theme: IobTheme): Record<string, any> {
    return {
        backgroundColor:
            theme.palette.mode === 'dark'
                ? lighten(theme.palette.background.paper, 0.08)
                : darken(theme.palette.background.paper, 0.03),
        // the modern themes draw the card border themselves, the older ones only have a shadow
        border: '1px solid',
        borderColor: theme.palette.divider,
        // the elevation overlay of the dark themes would lighten the cards on top of the tone
        backgroundImage: 'none',
    };
}
