import React from 'react';

import { createSvgIcon } from '@mui/material/utils';

/**
 * Categories (enums): a house for the rooms and a bulb for the functions.
 *
 * Both halves are needed - an enum is either a room or a function, and no ready-made icon says that.
 * `Category` (triangle plus square) would be correct but tells the user nothing.
 *
 * The bulb sits in the lower right corner and is scaled so that it does not touch the house, which
 * follows the same rule as [IconInstance]: main shape upper left, marker lower right, upper right
 * quadrant free for the badge.
 */
export const IconCategories = createSvgIcon(
    <>
        <g transform="translate(-1 -1.4) scale(0.78)">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </g>
        <g transform="translate(14.5 13.5) scale(0.42)">
            <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7" />
        </g>
    </>,
    'Categories',
);

export default IconCategories;
