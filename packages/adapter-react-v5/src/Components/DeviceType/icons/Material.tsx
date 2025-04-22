import React from 'react';
import type { IconPropsSVG } from './types';

export function Material(props: IconPropsSVG): React.JSX.Element {
    return (
        <svg
            viewBox="0 0 230 230"
            {...props}
        >
            <ellipse
                fill="#2979ff"
                stroke="#2979ff"
                strokeWidth="1.5"
                cx="112.9"
                cy="114"
                rx="112"
                ry="112"
            />
            <ellipse
                fill="#40c4ff"
                strokeWidth="1.5"
                cx="112.900006"
                cy="113.999995"
                rx="73.684216"
                ry="73.684216"
                stroke="#40c4ff"
            />
            <ellipse
                fill="#ffffff"
                strokeWidth="1.5"
                cx="112.900003"
                cy="114"
                rx="33.578948"
                ry="33.578948"
                stroke="#ffffff"
            />
        </svg>
    );
}
