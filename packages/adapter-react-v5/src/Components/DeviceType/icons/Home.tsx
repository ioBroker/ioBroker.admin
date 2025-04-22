import React from 'react';
import type { IconPropsSVG } from './types';

export function Home(props: IconPropsSVG): React.JSX.Element {
    return (
        <svg
            width={170}
            height={170}
            viewBox="-20 -20 190 190"
            {...props}
        >
            <path
                className="path stOff"
                d="M0 109v36.3c0 5.3 3.7 9.7 8.3 9.7h50.1v-23h37v23H153V84H0l28.4-29V13h18.1v24l30-37 66.2 69"
                fill="none"
            />
        </svg>
    );
}
