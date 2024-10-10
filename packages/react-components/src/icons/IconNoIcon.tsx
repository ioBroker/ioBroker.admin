import React from 'react';
import { type IconProps } from './IconProps';

export const IconNoIcon = (props: IconProps): React.JSX.Element => (
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
            fill="#EE3333"
            d="M256,0C114.844,0,0,114.844,0,256s114.844,256,256,256s256-114.844,256-256S397.156,0,256,0z M256,448 c-105.865,0-192-86.135-192-192c0-40.406,12.25-78.604,35.542-111.198l267.656,267.656C334.604,435.75,296.406,448,256,448z M412.458,367.198L144.802,99.542C177.396,76.25,215.594,64,256,64c105.865,0,192,86.135,192,192 C448,296.406,435.75,334.604,412.458,367.198z"
        />
    </svg>
);
