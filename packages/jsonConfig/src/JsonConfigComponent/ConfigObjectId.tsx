import React, { type JSX } from 'react';

import { InputLabel, FormControl, Button, TextField } from '@mui/material';

import { DialogSelectID } from '@iobroker/react-components';

import type { ConfigItemObjectId } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    flex: {
        display: 'flex',
    },
    button: {
        height: 48,
        marginLeft: 4,
        minWidth: 48,
    },
};

interface ConfigObjectIdProps extends ConfigGenericProps {
    schema: ConfigItemObjectId;
}

interface ConfigObjectIdState extends ConfigGenericState {
    showSelectId?: boolean;
    initialized?: boolean;
}

class ConfigObjectId extends ConfigGeneric<ConfigObjectIdProps, ConfigObjectIdState> {
    componentDidMount(): void {
        super.componentDidMount();
        const { data, attr } = this.props;
        const value = ConfigGeneric.getValue(data, attr) || '';
        this.setState({ value, initialized: true });
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */): JSX.Element {
        if (!this.state.initialized) {
            return null;
        }
        const { schema, socket, attr } = this.props;
        const { value, showSelectId } = this.state;

        return (
            <FormControl
                fullWidth
                variant="standard"
            >
                {schema.label ? <InputLabel shrink>{this.getText(schema.label)}</InputLabel> : null}
                <div style={styles.flex}>
                    <TextField
                        variant="standard"
                        fullWidth
                        value={value}
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
                        onClick={() => this.setState({ showSelectId: true })}
                    >
                        ...
                    </Button>
                </div>
                {showSelectId ? (
                    <DialogSelectID
                        imagePrefix={this.props.imagePrefix === undefined ? '../..' : this.props.imagePrefix}
                        dialogName={`admin.${this.props.adapterName}`}
                        filterFunc={schema.filterFunc}
                        themeType={this.props.themeType}
                        theme={this.props.theme}
                        types={schema.types ? (Array.isArray(schema.types) ? schema.types : [schema.types]) : undefined}
                        customFilter={schema.customFilter}
                        filters={schema.filters}
                        socket={socket}
                        selected={value}
                        root={schema.root}
                        onClose={() => this.setState({ showSelectId: false })}
                        onOk={value_ =>
                            this.setState({ showSelectId: false, value: value_ }, () => this.onChange(attr, value_))
                        }
                    />
                ) : null}
            </FormControl>
        );
    }
}

export default ConfigObjectId;
