import React from 'react';

import { createSvgIcon } from '@mui/material/utils';

/**
 * An instance: the same puzzle piece that stands for an adapter, plus a status dot.
 *
 * The relation is deliberate - an instance is a running copy of an adapter, so it uses the identical
 * silhouette and adds only the dot. Two details are not accidental:
 * - the piece is scaled to 0.8 so that the dot does not touch it. At the full size the dot merges
 *   with the lower right arm and the icon turns into a blob below ~24px.
 * - the dot sits in the lower right corner, not the upper right one, because that is where the
 *   drawer places its badges.
 */
export const IconInstance = createSvgIcon(
    <>
        <g transform="translate(-1.4 -1) scale(0.8)">
            <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11" />
        </g>
        <circle
            cx="19.2"
            cy="19.2"
            r="4.4"
        />
    </>,
    'Instance',
);

export default IconInstance;
