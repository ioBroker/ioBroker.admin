import React, { type JSX } from 'react';
import { type IconsIconProps } from './types';

// Icon copied from https://github.com/FortAwesome/Font-Awesome/blob/0d1f27efb836eb2ab994ba37221849ed64a73e5c/svgs/regular/
export function IconOpen(props: IconsIconProps): JSX.Element {
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
                d="m631.75617,292.093l-72.424,124.155a63.997,63.997 0 0 1 -55.281,31.752l-399.964,0c-18.523,0 -30.064,-20.093 -20.731,-36.093l72.424,-124.155a64,64 0 0 1 55.282,-31.752l399.964,0c18.523,0 30.064,20.093 20.73,36.093zm-420.694,-68.093l328,0l0,-48c0,-26.51 -21.49,-48 -48,-48l-160,0l-64,-64l-160,0c-26.51,0 -48,21.49 -48,48l0,278.046l69.077,-118.418c17.137,-29.378 48.912,-47.628 82.923,-47.628z"
            />
        </svg>
    );
}
