import type { CSSProperties, MouseEvent } from 'react';

export interface IconsIconProps {
    /**  The width in pixels or percentage of the icon. */
    width?: number | string;
    /**  The height in pixels or percentage of the icon. */
    height?: number | string;
    /** Click handler. */
    onClick?: (e: MouseEvent) => void;
    /** The class name for the SVG element. */
    className?: string;
    /** Styles for the SVG element. */
    style?: CSSProperties;
    /** The font size of the icon. */
    fontSize?: 'small';
}
