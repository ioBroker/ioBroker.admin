import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Icon from '@iobroker/adapter-react/Components/Icon';
import Utils from '@iobroker/adapter-react/Components/Utils';

const styles = theme => ({
    div: {
        borderRadius: 3,
        padding: '0 3px',
        lineHeight: '20px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center'
    },
    icon: {
        width: 16,
        height: 16,
        marginRight: 8,
        verticalAlign: 'middle',
        // marginTop: -2
    },
    text: {
        display: 'inline-block',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    }
});

const TextWithIcon = props => {
    let item = props.value;
    let prefix = props.removePrefix || '';

    if (typeof item === 'string') {
        if (props.list) {
            if (Array.isArray(props.list)) {
                const _item = props.list.find(obj => obj._id === prefix + item)
                if (_item) {
                    item = {
                        name: Utils.getObjectNameFromObj(_item, props.lang).replace('system.group.', ''),
                        value: _item._id,
                        icon: _item.common?.icon,
                        color: _item.common?.color,
                    };
                } else {
                    item = {
                        name: item,
                        value: prefix + item,
                    };
                }
            } else if (props.list[prefix + item]) {
                item = {
                    name: Utils.getObjectNameFromObj(props.list[prefix + item], props.lang).replace('system.group.', ''),
                    value: props.list[prefix + item]._id,
                    icon: props.list[prefix + item].common?.icon,
                    color: props.list[prefix + item].common?.color,
                };
            } else {
                item = {
                    name: item,
                    value: prefix + item,
                };
            }
        } else {
            item = {
                name: item,
                value: prefix + item,
            };
        }
    } else if (!item || typeof item !== 'object') {
        item = {
            name: '',
            value: '',
        };
    } else {
        item = {
            name: Utils.getObjectNameFromObj(item, props.lang).replace('system.group.', ''),
            value: item._id,
            icon: item.common?.icon,
            color: item.common?.color,
        };
    }
    
    const style = { border:`1px solid ${Utils.invertColor(item?.color)}`, color: Utils.getInvertedColor(item?.color, props.themeType) || undefined, backgroundColor: item?.color };

    return <div style={Object.assign({}, props.style, style)} className={Utils.clsx(props.className, props.classes.div, props.moreClasses?.root)} title={props.title || item.value}>
        {item?.icon ? <Icon src={item?.icon} className={Utils.clsx(props.classes.icon, props.moreClasses?.icon)} /> : null}<div className={Utils.clsx(props.classes.text, props.moreClasses?.text)}>{item?.name}</div>
    </div>;
}

TextWithIcon.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    themeType: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    list: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    className: PropTypes.string,
    style: PropTypes.object,
    title: PropTypes.string,
    removePrefix: PropTypes.string,
    moreClasses: PropTypes.object,
};

export default withStyles(styles)(TextWithIcon);