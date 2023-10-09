import PropTypes from 'prop-types';

function getAttr(obj, attr) {
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
    } if (typeof val === 'object') {
        return getAttr(val, attr);
    }
    return null;
}

function IsVisible(props) {
    const {
        config, children, name, value,
    } = props;

    if (value !== undefined) {
        return value === false ? null : children;
    } if (!config) {
        return children;
    } if (getAttr(config, name) !== false) {
        return children;
    }
    return null;
}

IsVisible.propTypes = {
    name: PropTypes.string,
    config: PropTypes.object,
    value: PropTypes.bool,
    children: PropTypes.any,
};

export default IsVisible;
