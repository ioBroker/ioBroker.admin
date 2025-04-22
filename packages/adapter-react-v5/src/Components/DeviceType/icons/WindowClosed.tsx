import React from 'react';
import type { IconPropsSVG } from './types';

export function WindowClosed(props: IconPropsSVG): React.JSX.Element {
    return (
        <svg
            width={361}
            height={361}
            viewBox="0 0 361 361"
            {...props}
        >
            <path
                d="M267.826 263.303c0 3.91-3.156 7.082-7.05 7.082l-157.885.021c-3.894 0-7.05-3.171-7.05-7.083v-157.5c0-3.911 3.156-7.083 7.05-7.083l157.885-.021c3.894 0 7.05 3.172 7.05 7.083v157.501z"
                fill="none"
                stroke="currentColor"
                strokeWidth={10}
                strokeMiterlimit={10}
            />
            <path
                d="M258.5 185.584h6.639c2.726 0 5-2.274 5-5s-2.274-5-5-5H258.5c-2.726 0-5 2.274-5 5s2.274 5 5 5z"
                fill="currentColor"
            />
            <path
                d="M267.826 103.208c0 2.485-2.711 4.5-6.053 4.5l-159.88.021c-3.342 0-6.052-2.015-6.052-4.5v-9c0-2.485 2.71-4.5 6.052-4.5l159.88-.021c3.342 0 6.053 2.015 6.053 4.5v9z"
                fill="none"
                stroke="currentColor"
                strokeWidth={10}
                strokeMiterlimit={10}
            />
        </svg>
    );
}
