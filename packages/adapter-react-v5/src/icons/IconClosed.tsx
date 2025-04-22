import React from 'react';
import { type IconsIconProps } from './types';

// Icon copied from https://github.com/FortAwesome/Font-Awesome/blob/0d1f27efb836eb2ab994ba37221849ed64a73e5c/svgs/regular/
export function IconClosed(props: IconsIconProps): React.JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            onClick={e => props.onClick && props.onClick(e)}
            viewBox="0 0 650 512"
            width={props.width || (props.fontSize === 'small' ? 16 : 20)}
            height={props.height || props.width || (props.fontSize === 'small' ? 16 : 20)}
            className={props.className}
            style={props.style}
        >
            <path
                fill="currentColor"
                d="m524,128l-192,0l-64,-64l-160,0c-26.51,0 -48,21.49 -48,48l0,288c0,26.51 21.49,48 48,48l416,0c26.51,0 48,-21.49 48,-48l0,-224c0,-26.51 -21.49,-48 -48,-48z"
            />
        </svg>
    );
}
