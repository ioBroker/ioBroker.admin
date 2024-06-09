import React, { Component } from 'react';
import { type Styles, withStyles } from '@mui/styles';

import { Paper } from '@mui/material';

import {
    Utils, withWidth,
    type IobTheme,
    type ThemeType,
} from '@iobroker/adapter-react-v5';

import Editor from '../Editor';

const styles: Styles<any, any> = (theme: IobTheme) => ({
    paper: {
        height:    '100%',
        maxHeight: '100%',
        maxWidth:  '100%',
        overflow:  'auto',
        padding:   theme.spacing(1),
    },
    title: {
        width: '100%',
        height: 32,
    },
    divWithoutTitle: {
        width: '100%',
        height: `calc(100% - ${32}px)`,
        border: '2px solid #00000000',
    },
    error: {
        border: '2px solid #FF0000',
    },
});

export interface PluginsSettings {
    [key: string]: any;
}

interface BaseSettingsPluginsProps {
    t: (text: string) => string;
    onChange: (settings: PluginsSettings) => void;
    settings: PluginsSettings;
    classes: Record<string, any>;
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
        return <Paper className={this.props.classes.paper}>
            <div className={this.props.classes.title}>{this.props.t('For future use')}</div>
            <div className={Utils.clsx(this.props.classes.divWithoutTitle, this.state.error && this.props.classes.error)}>
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

export default withWidth()(withStyles(styles)(BaseSettingsPlugins));
