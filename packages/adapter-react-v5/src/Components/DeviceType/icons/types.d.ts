import type { CSSProperties, MouseEvent } from 'react';

export interface IconPropsSVG {
    onClick?: (e: MouseEvent) => void;
    /** Class name */
    className?: string;
    /** Style for image */
    style?: CSSProperties;
    /** Styles for mui */
    sx?: Record<string, any>;
    /** Tooltip */
    title?: string;
}
