import React from 'react';
import type { IconPropsSVG } from './types';

export function HeatValve(props: IconPropsSVG): React.JSX.Element {
    return (
        <svg
            viewBox="0 0 512 512"
            {...props}
        >
            <path
                fill="currentColor"
                d="M391,362h77.417L440.989,58.467C438.075,26.229,409.37,0,377,0H135c-32.37,0-61.075,26.229-63.989,58.467L43.583,362H121v30  H91v120h330V392h-30V362z M135,30h242c16.963,0,32.584,14.273,34.11,31.167L416.427,120H95.573l5.316-58.833  C102.416,44.273,118.037,30,135,30z M92.862,150h326.275l16.446,182H76.416L92.862,150z M151,362h210v30H151V362z M241,422v60h-45  v-60H241z M271,422h45v60h-45V422z M121,422h45v60h-45V422z M391,482h-45v-60h45V482z"
            />
        </svg>
    );
}
