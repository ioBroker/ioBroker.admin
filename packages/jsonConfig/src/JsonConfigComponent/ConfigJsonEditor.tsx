import React, { type JSX } from 'react';

import { FormHelperText, FormControl, Button } from '@mui/material';

import { I18n } from '@iobroker/react-components';
import type { ConfigItemJsonEditor } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';
import CustomModal from './wrapper/Components/CustomModal';
import Editor from './wrapper/Components/Editor';

const styles: Record<string, React.CSSProperties> = {
    fullWidth: {
        width: '100%',
    },
    flex: {
        display: 'flex',
    },
    button: {
        height: 48,
        // marginLeft: 4,
        minWidth: 48,
    },
    wrapper: {
        width: 'calc(100vw - 40px)',
        height: 'calc(100vh - 188px)',
    },
};

interface ConfigJsonEditorProps extends ConfigGenericProps {
    schema: ConfigItemJsonEditor;
}

interface ConfigJsonEditorState extends ConfigGenericState {
    initialized?: boolean;
    showSelectId?: boolean;
    jsonError?: boolean;
}

class ConfigJsonEditor extends ConfigGeneric<ConfigJsonEditorProps, ConfigJsonEditorState> {
    componentDidMount(): void {
        super.componentDidMount();
        const { data, attr } = this.props;
        const value = ConfigGeneric.getValue(data, attr) || {};
        this.setState({ value, initialized: true, jsonError: this.validateJson(value) });
    }

    validateJson(value: string | null | undefined): boolean {
        let jsonError = false;
        if (this.props.schema.validateJson !== false) {
            if (value || !this.props.schema.allowEmpty) {
                try {
                    JSON.parse(value);
                } catch (err: unknown) {
                    console.log('Error in JSON', err);
                    jsonError = true;
                }
            }
        }

        return jsonError;
    }

    renderItem(/* _error: string, _disabled: boolean, defaultValue */): JSX.Element | null {
        if (!this.state.initialized) {
            return null;
        }

        const { schema, data, attr } = this.props;
        const { value, showSelectId } = this.state;

        return (
            <FormControl
                fullWidth
                variant="standard"
            >
                <div style={styles.flex}>
                    <Button
                        color="grey"
                        style={styles.button}
                        size="small"
                        variant="outlined"
                        onClick={() => this.setState({ showSelectId: true })}
                    >
                        {I18n.t('ra_JSON editor')}
                    </Button>
                </div>
                {showSelectId ? (
                    <CustomModal
                        title={this.getText(schema.label)}
                        overflowHidden
                        onClose={() =>
                            this.setState({ showSelectId: false, value: ConfigGeneric.getValue(data, attr) || {} })
                        }
                        onApply={() => this.setState({ showSelectId: false }, () => this.onChange(attr, value))}
                    >
                        <div style={{ ...styles.wrapper, ...(this.state.jsonError ? {} : undefined) }}>
                            <Editor
                                value={typeof value === 'object' ? JSON.stringify(value) : value}
                                onChange={newValue =>
                                    this.setState({ value: newValue, jsonError: this.validateJson(newValue) })
                                }
                                name="ConfigJsonEditor"
                                themeType={this.props.themeType}
                            />
                        </div>
                    </CustomModal>
                ) : null}
                {schema.help || this.state.jsonError ? (
                    <FormHelperText>
                        {this.state.jsonError
                            ? I18n.t('ra_Invalid JSON')
                            : this.renderHelp(
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

export default ConfigJsonEditor;
