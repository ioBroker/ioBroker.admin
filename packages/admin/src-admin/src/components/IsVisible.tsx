import { type JSX } from 'react';

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
    children: JSX.Element | JSX.Element[] | string;
}

function IsVisible(props: IsVisibleProps): JSX.Element | JSX.Element[] | string {
    const { config, children, name, value } = props;

    if (value !== undefined) {
        return value === false ? null : children;
    }
    if (!config) {
        return children;
    }
    if (getAttr(config, name) !== false) {
        return children;
    }
    return null;
}

export default IsVisible;
