import React from 'react';
import { type IconsIconProps } from './types';

// Icon copied from https://github.com/FortAwesome/Font-Awesome/blob/0d1f27efb836eb2ab994ba37221849ed64a73e5c/svgs/regular/
export function IconAdapter(props: IconsIconProps): React.JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            onClick={e => props.onClick && props.onClick(e)}
            viewBox="0 0 512 512"
            width={props.width || (props.fontSize === 'small' ? 16 : 20)}
            height={props.height || props.width || (props.fontSize === 'small' ? 16 : 20)}
            className={props.className}
            style={props.style}
        >
            <path
                fill="currentColor"
                d="M448 0L320 96v62.06l-83.03 83.03c6.79 4.25 13.27 9.06 19.07 14.87 5.8 5.8 10.62 12.28 14.87 19.07L353.94 192H416l96-128-64-64zM128 278.59L10.92 395.67c-14.55 14.55-14.55 38.15 0 52.71l52.7 52.7c14.56 14.56 38.15 14.56 52.71 0L233.41 384c29.11-29.11 29.11-76.3 0-105.41s-76.3-29.11-105.41 0z"
            />
        </svg>
    );
}
