import React from 'react';
import { type IconProps } from './IconProps';

export const IconChannel = (props: IconProps): React.JSX.Element => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        onClick={e => props.onClick && props.onClick(e)}
        viewBox="0 0 320 320"
        width={props.width || (props.fontSize === 'small' ? 16 : 20)}
        height={props.height || props.width || (props.fontSize === 'small' ? 16 : 20)}
        className={props.className}
        style={props.style}
    >
        <g fill="currentColor">
            <rect
                rx="32"
                height="272"
                width="267"
                y="25"
                x="25"
                strokeWidth="15"
                stroke="currentColor"
                fill="none"
            />
            <ellipse
                stroke="currentColor"
                ry="26"
                rx="26"
                cy="248"
                cx="160"
                fill="none"
                strokeWidth="15"
            />
            <line
                y2="201.94531"
                x2="159.5"
                y1="46.94531"
                x1="159.5"
                fillOpacity="null"
                strokeOpacity="null"
                strokeWidth="15"
                stroke="currentColor"
                fill="none"
            />
            <rect
                height="27"
                width="50"
                y="79.7979"
                x="133.5"
                fillOpacity="null"
                strokeOpacity="null"
                strokeWidth="15"
                stroke="currentColor"
                fill="#fff"
            />
        </g>
    </svg>
);
