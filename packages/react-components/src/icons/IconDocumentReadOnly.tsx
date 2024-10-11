import React from 'react';
import { type IconProps } from './IconProps';

// Icon copied from https://github.com/FortAwesome/Font-Awesome/blob/0d1f27efb836eb2ab994ba37221849ed64a73e5c/svgs/regular/
export const IconDocumentReadOnly = (props: IconProps): React.JSX.Element => (
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
            d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48z"
        />
        <path
            fill="currentColor"
            stroke="null"
            d="m261,270l-12,0l0,-24c0,-33.12 -26.88,-60 -60,-60s-60,26.88 -60,60l0,24l-12,0c-13.2,0 -24,10.8 -24,24l0,120c0,13.2 10.8,24 24,24l144,0c13.2,0 24,-10.8 24,-24l0,-120c0,-13.2 -10.8,-24 -24,-24zm-72,108c-13.2,0 -24,-10.8 -24,-24s10.8,-24 24,-24s24,10.8 24,24s-10.8,24 -24,24zm37.2,-108l-74.4,0l0,-24c0,-20.52 16.68,-37.2 37.2,-37.2c20.52,0 37.2,16.68 37.2,37.2l0,24z"
        />
    </svg>
);
