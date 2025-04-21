import React, { type JSX } from 'react';
import { type IconsIconProps } from './types';

export function IconState(props: IconsIconProps): JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            onClick={e => props.onClick && props.onClick(e)}
            viewBox="0 0 320 320"
            width={props.width || (props.fontSize === 'small' ? 16 : 20)}
            height={props.height || props.width || (props.fontSize === 'small' ? 16 : 20)}
            className={props.className}
            style={props.style}
        >
            <rect
                fill="none"
                rx="32"
                height="272"
                width="267"
                y="25"
                x="25"
                strokeWidth="15"
                stroke="currentColor"
            />
            <ellipse
                fill="none"
                ry="54"
                rx="54"
                cy="160"
                cx="160"
                fillOpacity="null"
                strokeOpacity="null"
                strokeWidth="15"
                stroke="currentColor"
            />
        </svg>
    );
}
