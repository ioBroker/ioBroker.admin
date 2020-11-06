import { ICON_SIZE } from '.';

const IconState = props => {
    return (
        <svg viewBox="0 0 320 320" width={ICON_SIZE} height={ICON_SIZE} xmlns="http://www.w3.org/2000/svg" className={ props.className }>
            <g>
                <rect rx="32" id="svg_1" height="272" width="267" y="25" x="25" strokeWidth="15" stroke="currentColor" fill="none"/>
                <ellipse ry="54" rx="54" id="svg_2" cy="160" cx="160" fillOpacity="null" strokeOpacity="null" strokeWidth="15" stroke="currentColor" fill="#fff"/>
            </g>
        </svg>
    );
}

export default IconState;