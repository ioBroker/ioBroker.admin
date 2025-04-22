import React from 'react';
import type { IconPropsSVG } from './types';

export function ThermometerSimple(props: IconPropsSVG): React.JSX.Element {
    return (
        <svg
            viewBox="0 0 512 512"
            {...props}
        >
            <path
                fill="currentColor"
                d="M341.333 288.593V85.333C341.333 38.205 303.128 0 256 0s-85.333 38.205-85.333 85.333v203.259C144.48 312.03 128 346.091 128 384c0 70.693 57.308 128 128 128s128-57.307 128-128c0-37.909-16.48-71.97-42.667-95.407zM256 469.333c-47.128 0-85.333-38.205-85.333-85.333 0-24.637 10.441-47.492 28.455-63.615l14.212-12.72V85.333c0-23.564 19.103-42.667 42.667-42.667s42.667 19.102 42.667 42.667v222.332l14.212 12.72c18.014 16.123 28.455 38.977 28.455 63.615-.002 47.128-38.207 85.333-85.335 85.333z"
            />
            <path
                fill="currentColor"
                d="M234.667 170.667h42.667v256h-42.667z"
            />
            <circle
                fill="currentColor"
                cx={256}
                cy={384}
                r={64}
            />
        </svg>
    );
}
