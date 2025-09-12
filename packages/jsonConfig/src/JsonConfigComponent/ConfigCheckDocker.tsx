import React, { type JSX } from 'react';

import { FormControlLabel, Checkbox, FormHelperText, FormControl, CircularProgress } from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemCheckDocker } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigCheckDockerState extends ConfigGenericState {
    version: string;
    errorDocker: string;
    requesting: boolean;
}

interface ConfigCheckDockerProps extends ConfigGenericProps {
    schema: ConfigItemCheckDocker;
}

// Send to admin message to check if the docker available and if available, show checkbox, else show warning if specified in the schema
class ConfigCheckDocker extends ConfigGeneric<ConfigCheckDockerProps, ConfigCheckDockerState> {
    async componentDidMount(): Promise<void> {
        super.componentDidMount();
        const id = await this.props.oContext.socket.getCurrentInstance();
        this.setState({ requesting: true }, async () => {
            const result: {
                version?: string;
                daemonRunning?: boolean;
            } = await this.props.oContext.socket.sendTo(id, 'checkDocker', null);
            this.setState({
                requesting: false,
                version: result?.version || '',
                errorDocker: result
                    ? !result.daemonRunning
                        ? I18n.t('ra_Docker is not installed or not running')
                        : ''
                    : I18n.t('ra_No response from admin'),
            });
        });
    }

    renderItem(error: unknown, disabled: boolean): JSX.Element {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        if (this.state.requesting) {
            return <CircularProgress />;
        }
        if (this.state.errorDocker && !value) {
            return (
                <FormHelperText style={{ color: 'orange' }}>
                    {I18n.t('ra_Docker is not available')}:&nbsp;
                    {I18n.t(`ra_${this.state.errorDocker}`).replace(/^ra_/, '')}
                </FormHelperText>
            );
        }
        return (
            <FormControl
                style={{ width: '100%' }}
                variant="standard"
            >
                <FormControlLabel
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!disabled) {
                            const mayByPromise = this.onChange(this.props.attr, !value);
                            if (mayByPromise instanceof Promise) {
                                void mayByPromise.catch(e => console.error(`Cannot set value: ${e}`));
                            }
                        }
                    }}
                    control={
                        <Checkbox
                            checked={!!value}
                            onChange={e => {
                                void this.onChange(this.props.attr, e.target.checked);
                            }}
                            disabled={disabled || (!!this.state.errorDocker && !value)}
                        />
                    }
                    label={this.getText(this.props.schema.label)}
                />
                <FormHelperText>
                    {this.state.errorDocker
                        ? this.state.errorDocker
                        : I18n.t('ra_Docker version %s', this.state.version || 'unknown')}
                </FormHelperText>
                {this.props.schema.help ? (
                    <FormHelperText>
                        {this.renderHelp(
                            this.props.schema.help,
                            this.props.schema.helpLink,
                            this.props.schema.noTranslation,
                        )}
                    </FormHelperText>
                ) : null}
            </FormControl>
        );
    }
}

export default ConfigCheckDocker;
