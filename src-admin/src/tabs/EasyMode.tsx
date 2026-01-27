import React, { Component, type JSX } from 'react';

import { AppBar, CardMedia, CircularProgress, IconButton, Paper, Toolbar } from '@mui/material';

import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

import {
    ToggleThemeMenu,
    type IobTheme,
    type AdminConnection,
    type ThemeType,
    type ThemeName,
    type Translate,
} from '@iobroker/adapter-react-v5';

import Config from './Config';
import EasyModeCard from '../components/EasyModeCard';

const styles: Record<string, any> = {
    appBar: (theme: IobTheme) => ({
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    }),
    wrapperEasyMode: {
        height: '100%',
        borderRadius: 0,
    },
    wrapperCard: {
        padding: '80px 20px 20px',
        height: '100%',
        overflowY: 'auto',
    },
    controlHeight: {
        display: 'flex',
        flexFlow: 'wrap',
        justifyContent: 'center',
    },
    img: {
        width: 60,
        height: 60,
        position: 'relative',
        borderRadius: 60,
    },
    logoWhite: {
        background: 'white',
    },
    wrapperHeader: {
        display: 'flex',
        alignItems: 'center',
    },
    headerName: {
        fontSize: 24,
        marginLeft: 10,
    },
    toolBar: {
        justifyContent: 'space-between',
        margin: '5px 0',
    },
    paper: {
        height: '100%',
        paddingTop: 80,
    },
    iframe: {
        height: '100%',
        width: '100%',
        background: '#FFF',
        color: '#000',
        borderRadius: 5,
        border: '1px solid #888',
    },
    IconButtons: {
        display: 'flex',
    },
    logoPointer: {
        cursor: 'pointer',
    },
};

export interface InstanceConfig {
    id: string;
    title: ioBroker.StringOrTranslated;
    desc: ioBroker.StringOrTranslated;
    color: string;
    url: string;
    icon: string;
    materialize: boolean;
    jsonConfig: boolean;
    version: string;
    tab?: boolean;
    config?: boolean;
}

interface EasyModeConfig {
    strict: boolean;
    configs: InstanceConfig[];
}

interface EasyModeProps {
    themeName: ThemeName;
    toggleTheme: () => void;
    t: Translate;
    lang: ioBroker.Languages;
    navigate: (tab: string | undefined | null, dialog?: string | null, id?: string | null, arg?: string | null) => void;
    location: {
        tab: string;
        dialog?: string;
        id?: string;
        arg?: string;
    };
    socket: AdminConnection;
    themeType: ThemeType;
    theme: IobTheme;
    width: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    isFloatComma: boolean;
    dateFormat: string;
    configStored: (changed: boolean) => void;
    getLocation: () => {
        tab: string;
        dialog: string;
        id: string;
        arg: string;
    };
    onRegisterIframeRef: (ref: HTMLIFrameElement) => void;
    onUnregisterIframeRef: (ref: HTMLIFrameElement) => void;
    configs?: InstanceConfig[];
    adminInstance: string;
    handleNavigation: (tab: string, subTab?: string, param?: string) => void;
}

interface EasyModeState {
    configs: InstanceConfig[];
    strictMode: boolean;
}

class EasyMode extends Component<EasyModeProps, EasyModeState> {
    constructor(props: EasyModeProps) {
        super(props);
        this.state = {
            configs: this.props.configs,
            strictMode: !this.props.configs,
        };
    }

    componentDidMount(): void {
        if (!this.props.configs) {
            void this.props.socket
                .getEasyMode()
                .then((config: EasyModeConfig) => this.setState({ configs: config.configs }));
        }
    }

    render(): JSX.Element {
        const {
            t,
            themeName,
            toggleTheme,
            navigate,
            location,
            socket,
            themeType,
            theme,
            width,
            isFloatComma,
            dateFormat,
            configStored,
            getLocation,
            adminInstance,
        } = this.props;

        const { configs, strictMode } = this.state;
        if (!configs) {
            return <CircularProgress />;
        }

        const tab = location.id;
        const currentInstance = configs.find(({ id }) => id === tab);
        return (
            <Paper style={styles.wrapperEasyMode}>
                <AppBar
                    color="default"
                    position="fixed"
                    sx={styles.appBar}
                >
                    <Toolbar style={styles.toolBar}>
                        <div style={styles.wrapperHeader}>
                            <CardMedia
                                onClick={
                                    (strictMode && !getLocation().dialog) || currentInstance?.tab
                                        ? () => navigate(currentInstance?.tab ? 'easy' : 'tab-intro')
                                        : null
                                }
                                style={{
                                    ...styles.img,
                                    ...(themeName === 'colored' ? styles.logoWhite : undefined),
                                    ...((strictMode && !getLocation().dialog) || currentInstance?.tab
                                        ? styles.logoPointer
                                        : undefined),
                                }}
                                component="img"
                                image="img/no-image.svg"
                            />
                            <div style={styles.headerName}>{t('Easy Admin')}</div>
                        </div>
                        <div style={styles.IconButtons}>
                            {((strictMode && !getLocation().dialog) || currentInstance?.tab) && (
                                <IconButton
                                    size="large"
                                    onClick={() => navigate(currentInstance?.tab ? 'easy' : 'tab-intro')}
                                >
                                    <ArrowBackIcon />
                                </IconButton>
                            )}
                            <ToggleThemeMenu
                                t={t}
                                toggleTheme={toggleTheme}
                                themeName={themeName as 'dark' | 'blue' | 'colored' | 'light'}
                                size="large"
                            />
                        </div>
                    </Toolbar>
                </AppBar>
                {currentInstance ? (
                    <Paper style={styles.paper}>
                        <Config
                            expertMode
                            style={styles.iframe}
                            adapter={currentInstance.id.split('.')[0]}
                            instance={parseInt(currentInstance.id.split('.')[1], 10)}
                            jsonConfig={currentInstance.jsonConfig}
                            materialize={currentInstance.materialize}
                            tab={currentInstance?.tab}
                            socket={socket}
                            easyMode
                            themeName={themeName}
                            themeType={themeType}
                            theme={theme}
                            width={width}
                            t={t}
                            lang={this.props.lang}
                            icon={currentInstance.icon}
                            adminInstance={adminInstance}
                            configStored={configStored}
                            dateFormat={dateFormat}
                            isFloatComma={isFloatComma}
                            // version={currentInstance.version} We don't need a version in easy mode
                            onRegisterIframeRef={(ref: HTMLIFrameElement) => this.props.onRegisterIframeRef(ref)}
                            onUnregisterIframeRef={(ref: HTMLIFrameElement) => this.props.onUnregisterIframeRef(ref)}
                            handleNavigation={this.props.handleNavigation}
                        />
                    </Paper>
                ) : (
                    <div style={styles.wrapperCard}>
                        <div style={styles.controlHeight}>
                            {configs
                                .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
                                .map(el => (
                                    <EasyModeCard
                                        key={el.id}
                                        lang={this.props.lang}
                                        navigate={() => navigate(null, 'config', el.id)}
                                        {...el}
                                    />
                                ))}
                        </div>
                    </div>
                )}
            </Paper>
        );
    }
}

export default EasyMode;
