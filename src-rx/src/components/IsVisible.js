import PropTypes from 'prop-types';

function getAttr(obj, attr) {
    if (!obj) {
        return null;
    }
    if (typeof attr !== 'object') {
        attr = attr.split('.');
    }
    const att = attr.shift();
    let val = obj[att];
    if (!attr.length) {
        return val;
    } else if (typeof val === 'object') {
        return getAttr(val, attr);
    } else {
        return null;
    }
}

function IsVisible(props) {
    const { config, children, name } = props;

    if (!config) {
        return children;
    } else if (getAttr(config, name) !== false) {
        return children;
    } else {
        return null;
    }
}

IsVisible.propTypes = {
    name: PropTypes.string,
    config: PropTypes.object,
};

export default IsVisible;