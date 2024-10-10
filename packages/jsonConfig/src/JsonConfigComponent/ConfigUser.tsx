import React, { type JSX } from 'react';

import { InputLabel, TextField, MenuItem, FormHelperText, FormControl, Select } from '@mui/material';

import { Icon, Utils, I18n } from '@iobroker/react-components';

import type { ConfigItemUser } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    icon: {
        width: 16,
        height: 16,
        marginRight: 8,
    },
};

interface ConfigUserProps extends ConfigGenericProps {
    schema: ConfigItemUser;
}

interface ConfigUserState extends ConfigGenericState {
    users: Record<string, { color?: string; icon?: string; name: string }>;
}

class ConfigUser extends ConfigGeneric<ConfigUserProps, ConfigUserState> {
    componentDidMount(): void {
        super.componentDidMount();
        this.props.socket
            .getUsers()
            .then(users => {
                const _users: Record<string, { color?: string; icon?: string; name: string }> = {};
                const lang = I18n.getLanguage();

                if (this.props.schema.short) {
                    users.forEach(
                        user =>
                            (_users[user._id] = {
                                color: user.common?.color,
                                icon: user.common?.icon,
                                name: Utils.getObjectNameFromObj(user, lang),
                            }),
                    );
                } else {
                    users.forEach(
                        user =>
                            (_users[user._id.replace(/^system\.user\./, '')] = {
                                color: user.common?.color,
                                icon: user.common?.icon,
                                name: Utils.getObjectNameFromObj(user, lang),
                            }),
                    );
                }

                this.setState({ users: _users });
            })
            .catch(e => console.error(`Cannot get users: ${e}`));
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */): JSX.Element {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        return (
            <FormControl
                variant="standard"
                fullWidth
            >
                {this.state.users && this.props.schema.label ? (
                    <InputLabel>{this.getText(this.props.schema.label)}</InputLabel>
                ) : null}
                {!this.state.users ? (
                    <TextField
                        variant="standard"
                        error={!!error}
                        disabled={!!disabled}
                        value={value}
                        onChange={e => this.onChange(this.props.attr, e.target.value)}
                        label={this.getText(this.props.schema.label)}
                    />
                ) : (
                    <Select
                        variant="standard"
                        error={!!error}
                        disabled={!!disabled}
                        value={value}
                        renderValue={val => (
                            <span>
                                {this.state.users && this.state.users[val]?.icon ? (
                                    <Icon
                                        src={this.state.users && this.state.users[val]?.icon}
                                        style={styles.icon}
                                    />
                                ) : null}
                                {(this.state.users && this.state.users[val]?.name) || val || ''}
                            </span>
                        )}
                        style={{
                            color: (this.state.users && this.state.users[value]?.color) || undefined,
                            backgroundColor: Utils.getInvertedColor(
                                this.state.users && this.state.users[value]?.color,
                                this.props.themeType,
                            ),
                        }}
                        onChange={e => this.onChange(this.props.attr, e.target.value)}
                    >
                        {this.state.users &&
                            Object.keys(this.state.users).map(id => (
                                <MenuItem
                                    style={{
                                        color: this.state.users[id].color || undefined,
                                        backgroundColor: Utils.getInvertedColor(
                                            this.state.users[id].color,
                                            this.props.themeType,
                                        ),
                                    }}
                                    key={id}
                                    value={id}
                                >
                                    {this.state.users[id].icon ? (
                                        <Icon
                                            src={this.state.users[id].icon}
                                            style={styles.icon}
                                        />
                                    ) : null}
                                    {this.state.users[id].name}
                                </MenuItem>
                            ))}
                    </Select>
                )}
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

export default ConfigUser;
