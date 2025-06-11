import React from 'react';
import { type IconsIconProps } from './types';

// Copyright Apache 2.0 https://raw.githubusercontent.com/material-icons/material-icons/master/svg/filter_alt/baseline.svg
// https://github.com/material-icons/material-icons/blob/master/LICENSE
export function IconClearFilter(props: IconsIconProps): React.JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            onClick={e => props.onClick && props.onClick(e)}
            viewBox="0 0 24 24"
            width={props.width || (props.fontSize === 'small' ? 16 : 20)}
            height={props.height || props.width || (props.fontSize === 'small' ? 16 : 20)}
            className={props.className}
            style={props.style}
        >
            <path
                fill="currentColor"
                stroke="currentColor"
                d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04c-.83 0-1.3.95-.79 1.61z"
            />
        </svg>
    );
}
