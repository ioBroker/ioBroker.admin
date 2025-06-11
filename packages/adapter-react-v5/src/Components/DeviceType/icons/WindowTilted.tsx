import React from 'react';
import type { IconPropsSVG } from './types';

export function WindowTilted(props: IconPropsSVG): React.JSX.Element {
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
                d="M267.826 103.208c0 2.485-2.711 4.5-6.053 4.5l-159.88.021c-3.342 0-6.052-2.015-6.052-4.5v-9c0-2.485 2.71-4.5 6.052-4.5l159.88-.021c3.342 0 6.053 2.015 6.053 4.5v9zM265.732 265.178c.584 2.887-1.629 5.228-4.942 5.228H103.457c-3.313 0-6.474-2.341-7.058-5.228L75.24 130.633c-.584-2.887 1.628-5.228 4.942-5.228h157.333c3.313 0 6.474 2.34 7.058 5.228l21.159 134.545z"
                fill="none"
                stroke="currentColor"
                strokeWidth={10}
                strokeMiterlimit={10}
            />
            <path
                d="M247.194 199.667h6.639c2.726 0 5-2.274 5-5s-2.274-5-5-5h-6.639c-2.726 0-5 2.274-5 5s2.275 5 5 5z"
                fill="currentColor"
            />
        </svg>
    );
}
