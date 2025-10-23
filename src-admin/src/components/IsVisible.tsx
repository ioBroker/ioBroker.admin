import { type ReactElement, type JSX } from 'react';

function getAttr(obj: Record<any, any>, attr: string | string[]): boolean {
    if (!obj) {
        return null;
    }
    if (typeof attr !== 'object') {
        attr = attr.split('.');
    }
    const att = attr.shift();
    const val = obj[att];
    if (!attr.length) {
        return val;
    }
    if (typeof val === 'object') {
        return getAttr(val, attr);
    }
    return null;
}

interface IsVisibleProps {
    name?: string;
    config?: Record<string, any>;
    value?: boolean;
    children: JSX.Element | JSX.Element[];
}

function IsVisible(props: IsVisibleProps): ReactElement<any, any> {
    const { config, children, name, value } = props;

    if (value !== undefined) {
        return value === false ? null : (children as ReactElement<any, any>);
    }
    if (!config) {
        return children as ReactElement<any, any>;
    }
    if (getAttr(config, name) !== false) {
        return children as ReactElement<any, any>;
    }
    return null;
}

export default IsVisible;
