import React from 'react';

import { Icon } from './Icon';
import { Utils } from './Utils';
import type { ThemeType } from '../types';

const styles: Record<string, React.CSSProperties> = {
    div: {
        borderRadius: 3,
        padding: '0 3px',
        lineHeight: '20px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
    },
    icon: {
        width: 16,
        height: 16,
        marginRight: 8,
        verticalAlign: 'middle',
    },
    text: {
        display: 'inline-block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
};

interface TextWithIconProps {
    lang: ioBroker.Languages;
    themeType?: ThemeType;
    value: string | Record<string, any>;
    list?: ioBroker.Object[] | Record<string, ioBroker.Object>;
    options?: Record<string, any>;
    className?: string;
    style?: React.CSSProperties;
    title?: string;
    removePrefix?: string;
    moreClasses?: {
        root?: string;
        icon?: string;
        text?: string;
    };
    icon?: string;
    color?: string;
}

interface TextWithIconItem {
    name: string;
    value: string;
    icon?: string;
    color?: string;
}

export function TextWithIcon(props: TextWithIconProps): React.JSX.Element {
    const value = props.value;
    let item: TextWithIconItem;
    const prefix = props.removePrefix || '';

    if (typeof value === 'string') {
        const list = props.list || props.options;
        if (list) {
            // if a list is array, then it is list of ioBroker.Object
            if (Array.isArray(list)) {
                const _item: ioBroker.Object = list.find((obj: ioBroker.Object) => obj._id === prefix + value);
                if (_item) {
                    item = {
                        name: Utils.getObjectNameFromObj(_item, props.lang).replace('system.group.', ''),
                        value: _item._id,
                        icon: props.icon || _item.common?.icon,
                        color: props.color || _item.common?.color,
                    };
                } else {
                    item = {
                        name: value,
                        value: prefix + value,
                    };
                }
            } else if (list[prefix + value]) {
                // List is object with key-value pairs: {'enum.rooms.1': {common: {name: 'Room 1'}}}
                const obj: ioBroker.Object = list[prefix + value];
                item = {
                    name: Utils.getObjectNameFromObj(obj, props.lang).replace('system.group.', ''),
                    value: obj._id,
                    icon: props.icon || obj.common?.icon,
                    color: props.color || obj.common?.color,
                };
            } else {
                // value is a string, ignore list
                item = {
                    name: value,
                    value: prefix + value,
                    icon: props.icon,
                    color: props.color,
                };
            }
        } else {
            item = {
                name: value,
                value: prefix + value,
                icon: props.icon,
                color: props.color,
            };
        }
    } else if (!value || typeof value !== 'object') {
        item = {
            name: '',
            value: '',
            icon: props.icon,
            color: props.color,
        };
    } else {
        // Item is an ioBroker.Object
        const obj: ioBroker.Object = value as ioBroker.Object;
        item = {
            name: Utils.getObjectNameFromObj(obj, props.lang)
                .replace('system.group.', '')
                .replace('system.user.', '')
                .replace('enum.rooms.', '')
                .replace('enum.functions.', ''),
            value: obj._id,
            icon: props.icon || obj.common?.icon,
            color: props.color || obj.common?.color,
        };
    }

    const style = item?.color
        ? {
              border: `1px solid ${Utils.invertColor(item?.color)}`,
              color: Utils.getInvertedColor(item?.color, props.themeType || 'light', true) || undefined,
              backgroundColor: item?.color,
          }
        : {};

    return (
        <div
            style={{ ...(props.style || undefined), ...styles.div, ...(style || undefined) }}
            className={Utils.clsx(props.className, props.moreClasses?.root)}
            title={props.title || item.value}
        >
            {item?.icon ? (
                <Icon
                    src={item?.icon}
                    className={props.moreClasses?.icon}
                    style={styles.icon}
                />
            ) : null}
            <div
                style={styles.text}
                className={props.moreClasses?.text}
            >
                {item?.name}
            </div>
        </div>
    );
};
