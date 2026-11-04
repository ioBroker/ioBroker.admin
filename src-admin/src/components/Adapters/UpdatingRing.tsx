import React, { type JSX } from 'react';
import { CircularProgress } from '@mui/material';

interface UpdatingRingProps {
    /** Size of the adapter icon in px */
    size: number;
    style?: React.CSSProperties;
}

/**
 * A turning ring around the icon of an adapter, while a command installs or updates it.
 * The parent must be positioned; the ring is centered on the point given by `style` (`left`, `top`).
 */
export default function UpdatingRing({ size, style }: UpdatingRingProps): JSX.Element {
    const ring = size + 8;
    return (
        <CircularProgress
            size={ring}
            thickness={3}
            style={{
                position: 'absolute',
                marginLeft: -ring / 2,
                marginTop: -ring / 2,
                pointerEvents: 'none',
                zIndex: 3,
                ...style,
            }}
        />
    );
}
