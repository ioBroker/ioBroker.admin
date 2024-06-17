import React, { Component } from 'react';

import { Paper } from '@mui/material';

import {
    withWidth,
    type ThemeType,
} from '@iobroker/adapter-react-v5';

import Editor from '../Editor';

const styles: Record<string, any> = {
    paper: {
        height:    '100%',
        maxHeight: '100%',
        maxWidth:  '100%',
        overflow:  'auto',
        padding:   8,
    },
    title: {
        width: '100%',
        height: 32,
    },
    divWithoutTitle: {
        width: '100%',
        height: 'calc(100% - 32px)',
        border: '2px solid #00000000',
    },
    error: {
        border: '2px solid #FF0000',
    },
};

export interface PluginsSettings {
    [key: string]: any;
}

interface BaseSettingsPluginsProps {
    t: (text: string) => string;
    onChange: (settings: PluginsSettings) => void;
    settings: PluginsSettings;
    themeType: ThemeType;
}
interface BaseSettingsPluginsState {
    settings: string;
    error?: boolean;
}

class BaseSettingsPlugins extends Component<BaseSettingsPluginsProps, BaseSettingsPluginsState> {
    constructor(props: BaseSettingsPluginsProps) {
        super(props);

        this.state = {
            settings: JSON.stringify(this.props.settings || {}, null, 2),
            error: false,
        };
    }

    onChange(value: string) {
        const newState: BaseSettingsPluginsState = { settings: value };
        try {
            const settings = JSON.parse(value);

            if (this.state.error) {
                newState.error = false;
            }

            this.setState(newState, () => this.props.onChange(settings));
        } catch (e) {
            newState.error = true;
            this.setState(newState);
        }
    }

    render() {
        return <Paper style={styles.paper}>
            <div style={styles.title}>{this.props.t('For future use')}</div>
            <div style={{ ...styles.divWithoutTitle, ...(this.state.error ? styles.error : undefined) }}>
                <Editor
                    // mode="json"
                    themeType={this.props.themeType}
                    value={this.state.settings}
                    onChange={newValue => this.onChange(newValue)}
                />
            </div>
        </Paper>;
    }
}

export default withWidth()(BaseSettingsPlugins);
