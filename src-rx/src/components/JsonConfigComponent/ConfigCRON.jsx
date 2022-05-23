import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import { Button, TextField } from '@material-ui/core';

import DialogCron from '@iobroker/adapter-react/Dialogs/Cron';
import I18n from '@iobroker/adapter-react/i18n';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    },
    flex: {
        display: 'flex'
    },
    button: {
        height: 48,
        marginLeft: 4,
        minWidth: 48,
    }
});

class ConfigCRON extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        const { data, attr } = this.props;
        const value = ConfigGeneric.getValue(data, attr) || '';
        this.setState({ value});
    }

    renderItem(error, disabled, defaultValue) {
        const { classes, schema, attr } = this.props;
        const { value, showDialog } = this.state;

        return <FormControl className={classes.fullWidth}>
            <InputLabel shrink>{this.getText(schema.label)}</InputLabel>
            <div className={classes.flex}>
                <TextField
                    fullWidth
                    value={value}
                    error={!!error}
                    disabled={disabled}
                    placeholder={this.getText(schema.placeholder)}
                    label={this.getText(schema.label)}
                    helperText={this.renderHelp(schema.help, schema.helpLink, schema.noTranslation)}
                    onChange={e => {
                        const value = e.target.value;
                        this.setState({ value }, () =>
                            this.onChange(attr, value))
                    }}
                />
                <Button
                    className={this.props.classes.button}
                    size="small"
                    variant="outlined"
                    onClick={() => this.setState({ showDialog: true })}
                >...</Button>
            </div>
            {showDialog ? <DialogCron
                title={I18n.t('Define schedule')}
                simple={schema.simple}
                complex={schema.complex}
                cron={value}
                language={I18n.getLanguage()}
                onClose={() => this.setState({ showDialog: false })}
                cancel={I18n.t('Cancel')}
                ok={I18n.t('Ok')}
                onOk={value =>
                    this.setState({ showDialog: false, value }, () =>
                        this.onChange(attr, value))}
            /> : null}
        </FormControl>;
    }
}

ConfigCRON.propTypes = {
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
    dateFormat: PropTypes.string,
    isFloatComma: PropTypes.bool,
};

export default withStyles(styles)(ConfigCRON);