import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import { Box, Typography, Slider } from '@mui/material';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%',
    },
    slider: {
        marginLeft: 10,
        marginRight: 10,
        width: 'calc(100% - 20px)',
    }
});

class ConfigSlider extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const _value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ _value });
    }

    static getDerivedStateFromProps(props, state) {
        if ((props.schema.min !== undefined && props.schema.min < 0) ||
            (props.schema.max !== undefined && props.schema.max < 0)
        ) {
            return null;
        }
        const _value = ConfigGeneric.getValue(props.data, props.attr);
        if (_value === null || _value === undefined || _value.toString() !== parseFloat(state._value).toString()) {
            return { _value };
        } else {
            return null;
        }
    }

    renderItem(error, disabled, defaultValue) {
        const min  = this.props.schema.min  || 0;
        const max  = this.props.schema.max  || 100;
        const unit = this.props.schema.unit || '';

        const marks = [
            { value: min, label: min + unit},
            { value: max, label: max + unit}
        ];

        return <Box className={this.props.classes.fullWidth}>
            {this.props.schema.label ? <Typography gutterBottom>
                {this.getText(this.props.schema.label)}
            </Typography> : null}
            <Slider
                className={this.props.classes.slider}
                value={this.state._value}
                getAriaValueText={value => value + unit}
                step={this.props.schema.step || ((max - min) / 100)}
                valueLabelDisplay="auto"
                marks={marks}
                disabled={!!disabled}
                error={error || ''}
                onChange={e => {
                    const _value = e.target.value;
                    this.setState({ _value }, () =>
                        this.onChange(this.props.attr, _value));
                }}
            />
            {this.props.schema.help ? <Typography>
                {this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
            </Typography> : null}
        </Box>;
    }
}

ConfigSlider.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(ConfigSlider);