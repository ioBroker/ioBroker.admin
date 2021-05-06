import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import {FormControl, InputLabel, MenuItem, Select} from '@material-ui/core';

import Icon from '@iobroker/adapter-react/Components/Icon';
import Utils from '@iobroker/adapter-react/Components/Utils';

const styles = theme => ({
    different: {
        opacity: 0.5
    },
    icon: {
        width: 16,
        height: 16,
        marginRight: 8
    }
});

class SelectWithIcon extends Component {
    constructor(props) {
        super(props);

        if (this.props.different) {
            this.wordDifferent = this.props.t(this.props.different);
        }

        let list = [];
        if (Array.isArray(this.props.list)) {
            list = this.props.list.map(obj => ({
                name: Utils.getObjectNameFromObj(obj, this.props.lang).replace('system.group.', ''),
                value: obj._id,
                icon: obj.common?.icon,
                color: obj.common?.color,
            }))
        } else {
            Object.values(this.props.list).map(obj => ({
                name: Utils.getObjectNameFromObj(obj, this.props.lang).replace('system.group.', ''),
                value: obj._id,
                icon: obj.common?.icon,
                color: obj.common?.color,
            }));
        }

        if (this.props.different && this.props.value === this.props.different) {
            list.unshift({value: this.props.different, name: this.wordDifferent});
        }

        this.state = {
            list
        };
    }

    render() {
        const item = this.state.list.find(it => it.value === this.props.value || (this.props.removePrefix && it.value.replace(this.props.removePrefix, '') === this.props.value));

        const style = this.props.value === this.props.different ? {} :
            {
                color: item?.color || undefined,
                backgroundColor: Utils.getInvertedColor(item?.color, this.props.themeType)
            };

        return <FormControl fullWidth={!!this.props.fullWidth} style={this.props.style} className={this.props.className}>
            <InputLabel>{this.props.label}</InputLabel>
            <Select
                disabled={this.props.disabled}
                value={this.props.value}
                renderValue={value => <span>{item?.icon ? <Icon src={item?.icon} className={this.props.classes.icon} /> : null}{item?.name}</span>}
                classes={{root: this.props.value === this.props.different ? this.props.classes.different : ''}}
                style={style}
                onChange={el => {
                    if (this.props.different && el.target.value !== this.props.different) {
                        let pos = null;
                        for (let i = 0; i < this.state.list.length; i++) {
                            if (this.state.list[i].value === this.props.different) {
                                pos = i;
                                break;
                            }
                        }
                        if (pos !== null) {
                            const list = Utils.clone(this.state.list);
                            list.splice(pos, 1);
                            return this.setState({list}, () => this.props.onChange(el.target.value));
                        }
                    }

                    this.props.onChange(this.props.removePrefix ? el.target.value.replace(this.props.removePrefix, '') : el.target.value);
                }}
            >
                {this.state.list.map(el => <MenuItem
                    className={this.props.different && el.value === this.props.different ? this.props.classes.different : ''}
                    style={this.props.different && el.value === this.props.different ? {} : { color: el.color || undefined, backgroundColor: Utils.getInvertedColor(el.color, this.props.themeType) }}
                    key={el.value}
                    value={el.value}
                >
                    {el.icon ? <Icon src={el.icon} className={this.props.classes.icon} /> : null}
                    {el.name}
                </MenuItem>)}
            </Select>
        </FormControl>;
    }
}

SelectWithIcon.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    themeType: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    list: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    label: PropTypes.string,
    different: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    fullWidth: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    removePrefix: PropTypes.string,
};

export default withStyles(styles)(SelectWithIcon);