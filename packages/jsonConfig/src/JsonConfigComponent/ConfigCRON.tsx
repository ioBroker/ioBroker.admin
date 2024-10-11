import React, { type JSX } from 'react';

import { InputLabel, FormControl, Button, TextField } from '@mui/material';

import { DialogCron, I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemCRON } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    fullWidth: {
        width: '100%',
    },
    flex: {
        display: 'flex',
    },
    button: {
        height: 48,
        marginLeft: 4,
        minWidth: 48,
    },
};

interface ConfigCRONProps extends ConfigGenericProps {
    schema: ConfigItemCRON;
}

interface ConfigCRONState extends ConfigGenericState {
    showDialog?: boolean;
}

class ConfigCRON extends ConfigGeneric<ConfigCRONProps, ConfigCRONState> {
    componentDidMount(): void {
        super.componentDidMount();
        const { data, attr } = this.props;
        const value = ConfigGeneric.getValue(data, attr) || '';
        this.setState({ value, showDialog: false });
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */): JSX.Element {
        const { schema, attr } = this.props;
        const { value, showDialog } = this.state;

        return (
            <FormControl
                style={styles.fullWidth}
                variant="standard"
            >
                {schema.label ? <InputLabel shrink>{this.getText(schema.label)}</InputLabel> : null}
                <div style={styles.flex}>
                    <TextField
                        variant="standard"
                        fullWidth
                        value={value ?? ''}
                        error={!!error}
                        disabled={disabled}
                        placeholder={this.getText(schema.placeholder)}
                        label={this.getText(schema.label)}
                        helperText={this.renderHelp(schema.help, schema.helpLink, schema.noTranslation)}
                        onChange={e => {
                            const value_ = e.target.value;
                            this.setState({ value: value_ }, () => this.onChange(attr, value_));
                        }}
                    />
                    <Button
                        color="grey"
                        style={styles.button}
                        size="small"
                        variant="outlined"
                        onClick={() => this.setState({ showDialog: true })}
                    >
                        ...
                    </Button>
                </div>
                {showDialog ? (
                    <DialogCron
                        title={I18n.t('ra_Define schedule')}
                        simple={schema.simple}
                        complex={schema.complex}
                        cron={value}
                        onClose={() => this.setState({ showDialog: false })}
                        cancel={I18n.t('ra_Cancel')}
                        ok={I18n.t('ra_Ok')}
                        theme={this.props.theme}
                        onOk={value_ =>
                            this.setState({ showDialog: false, value: value_ }, () => this.onChange(attr, value_))
                        }
                    />
                ) : null}
            </FormControl>
        );
    }
}

export default ConfigCRON;
