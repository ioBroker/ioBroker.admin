import React from 'react';
import { type IconsIconProps } from './types';

// Copyright Bluefox
export function IconButtonImage(props: IconsIconProps): React.JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            onClick={e => props.onClick && props.onClick(e)}
            viewBox="0 0 436 436"
            width={props.width || (props.fontSize === 'small' ? 16 : 20)}
            height={props.height || props.width || (props.fontSize === 'small' ? 16 : 20)}
            className={props.className}
            style={props.style}
        >
            <g fill="currentColor">
                <path d="m195.23077,24.30769c-36,3 -67,12 -96,26c-49,24 -82,61 -93,104l-3,11l-1,50c0,46 0,49 2,59l5,20c21,58 84,103 165,116c16,3 53,4 70,2c60,-6 111,-28 147,-64c21,-21 36,-49 40,-74a866,866 0 0 0 1,-104c-3,-18 -6,-28 -13,-43c-26,-52 -87,-90 -162,-101c-16,-2 -48,-3 -63,-2l1,0zm60,23c36,5 70,18 95,35c31,20 51,47 59,77c2,7 2,11 2,25c1,15 0,18 -2,26c-19,69 -104,117 -200,114c-47,-2 -90,-15 -124,-38c-31,-20 -51,-47 -59,-77c-3,-11 -4,-32 -2,-43c8,-42 41,-78 91,-101a260,260 0 0 1 140,-19l0,1zm-221,222c21,26 57,49 95,62c81,27 174,14 239,-32c14,-10 31,-27 41,-41c2,-2 2,-2 2,7c-1,23 -16,50 -38,72c-78,74 -233,74 -311,-1a121,121 0 0 1 -39,-76l0,-6l3,4l8,11z" />
                <path d="m201.23077,47.30769c-40,3 -79,19 -104,44c-55,55 -38,133 37,171c52,26 122,24 172,-5c30,-17 51,-42 58,-71c3,-11 3,-34 0,-45c-6,-23 -21,-44 -40,-60l-27,-16a184,184 0 0 0 -96,-18zm30,21c56,5 100,35 112,75c4,11 4,30 0,41c-8,25 -26,45 -54,59a166,166 0 0 1 -160,-8a98,98 0 0 1 -41,-53c-5,-18 -2,-39 8,-57c23,-39 79,-62 135,-57z" />
            </g>
        </svg>
    );
}
