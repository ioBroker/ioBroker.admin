import React from 'react';

import { createSvgIcon } from '@mui/material/utils';

/**
 * Update of all adapters at once: the circular arrow of the MUI `Update` icon around four tiles.
 *
 * The arrow is taken over unchanged, because the button sits right next to the "filter adapters with
 * updates" button, which shows the `Update` icon. Only the clock hands are replaced - by the tiles that
 * stand for "all adapters". Earlier two `Update` icons were stacked on top of each other, which the
 * users took for a rendering bug.
 *
 * The tiles are 2.9 units wide with a 1-unit gap. Smaller tiles melt into a blob at 24px on a
 * display without scaling.
 */
export const IconUpdateAll = createSvgIcon(
    <>
        <path d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1-2.73 2.71-2.73 7.08 0 9.79s7.15 2.71 9.88 0C18.32 15.65 19 14.08 19 12.1h2c0 1.98-.88 4.55-2.64 6.29-3.51 3.48-9.21 3.48-12.72 0-3.5-3.47-3.53-9.11-.02-12.58s9.14-3.47 12.65 0L21 3z" />
        <path d="M8.6 8.7h2.9v2.9H8.6zM12.5 8.7h2.9v2.9h-2.9zM8.6 12.6h2.9v2.9H8.6zM12.5 12.6h2.9v2.9h-2.9z" />
    </>,
    'UpdateAll',
);

export default IconUpdateAll;
