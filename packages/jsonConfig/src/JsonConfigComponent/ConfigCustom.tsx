import React, { type JSX } from 'react';
import { Grid2, LinearProgress } from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';
import type { ConfigItemCustom } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from '#JC/JsonConfigComponent/ConfigGeneric';
import { registerRemotes, loadRemote } from '@module-federation/runtime';

interface ConfigCustomProps extends ConfigGenericProps {
    schema: ConfigItemCustom;
}

interface ConfigCustomState extends ConfigGenericState {
    Component: React.FC<ConfigGenericProps> | null;
    error: string;
}

export default class ConfigCustom extends ConfigGeneric<ConfigCustomProps, ConfigCustomState> {
    static runningLoads: Record<string, Promise<{ default: Record<string, React.FC<ConfigGenericProps>> }>> = {};

    constructor(props: ConfigCustomProps) {
        super(props);
        // schema.url - location of Widget
        // schema.name - Component name
        // schema.i18n - i18n

        Object.assign(this.state, {
            Component: null,
            error: '',
        });
    }

    // load component dynamically
    async componentDidMount(): Promise<void> {
        if (!this.props.schema.url) {
            console.error('URL is empty. Cannot load custom component!');
            this.setState({ error: 'URL is empty. Cannot load custom component!' });
            return;
        }

        let url;
        /*
        if (this.props.schema.url.startsWith('http:') || this.props.schema.url.startsWith('https:')) {
            url = this.props.schema.url;
        } else
        */
        if (this.props.schema.url.startsWith('./')) {
            url = `${window.location.protocol}//${window.location.host}${this.props.schema.url.replace(/^\./, '')}`;
        } else {
            url = `${window.location.protocol}//${window.location.host}/adapter/${this.props.oContext.adapterName}/${this.props.schema.url}`;
        }
        const [uniqueName, fileToLoad, ...componentNameParts] = this.props.schema.name.split('/');
        const componentName = componentNameParts.join('/');
        if (!url) {
            console.error(
                'Cannot find URL for custom component! Please define "url" as "custom/customComponents.js" in the schema',
            );
            return;
        }
        if (!uniqueName || !fileToLoad || !componentName) {
            console.error(
                'Invalid format of "name"! Please define "name" as "ConfigCustomBackItUpSet/Components/AdapterExist" in the schema',
            );
            return;
        }
        let setPromise: Promise<{ default: Record<string, React.FC<ConfigGenericProps>> }> | undefined =
            ConfigCustom.runningLoads[`${url}!${fileToLoad}`];

        if (!(setPromise instanceof Promise)) {
            let i18nPromise: Promise<void> | undefined;
            if (this.props.schema.i18n === true) {
                // load i18n from files
                const pos = url.lastIndexOf('/');
                let i18nURL: string;
                if (pos !== -1) {
                    i18nURL = url.substring(0, pos);
                } else {
                    i18nURL = url;
                }
                const lang = I18n.getLanguage();
                const file = `${i18nURL}/i18n/${lang}.json`;

                i18nPromise = fetch(file)
                    .then(data => data.json())
                    .then(json => I18n.extendTranslations(json, lang))
                    .catch(error => {
                        if (lang !== 'en') {
                            // try to load English
                            fetch(`${i18nURL}/i18n/en.json`)
                                .then(data => data.json())
                                .then(json => I18n.extendTranslations(json, lang))
                                .catch(err => console.log(`Cannot load i18n "${file}": ${err}`));
                            return;
                        }
                        console.log(`Cannot load i18n "${file}": ${error}`);
                    });
            } else if (this.props.schema.i18n && typeof this.props.schema.i18n === 'object') {
                try {
                    I18n.extendTranslations(this.props.schema.i18n);
                } catch (error) {
                    console.error(`Cannot import i18n: ${error}`);
                }
            }
            try {
                console.log(url, uniqueName, fileToLoad, componentName);

                registerRemotes(
                    [
                        {
                            name: uniqueName,
                            entry: url,
                            type: this.props.schema.bundlerType || undefined,
                        },
                    ],
                    // force: true // may be needed to side-load remotes after the fact.
                );
                setPromise = loadRemote(`${uniqueName}/${fileToLoad}`);
                if (i18nPromise instanceof Promise) {
                    setPromise = Promise.all([setPromise, i18nPromise]).then(result => result[0]);
                }
                // remember promise
                ConfigCustom.runningLoads[`${url}!${fileToLoad}`] = setPromise;
            } catch (error) {
                console.error(error);
                this.setState({ error: `Cannot import from ${this.props.schema.url}: ${error}` });
            }
        }

        try {
            const component: Record<string, React.FC<ConfigGenericProps>> = (await setPromise).default;

            if (!component?.[componentName]) {
                const keys = Object.keys(component || {});
                console.error('URL is empty. Cannot load custom component!');
                this.setState({
                    error: `Component ${this.props.schema.name} not found in ${this.props.schema.url}. Found: ${keys.join(', ')}`,
                });
            } else {
                const _Component = component[componentName];
                setTimeout(() => this.setState({ Component: _Component }), 2000);
            }
        } catch (error) {
            console.error(error);
            this.setState({ error: `Cannot import from ${this.props.schema.url}: ${error}` });
        }
    }

    render(): JSX.Element {
        const CustomComponent: React.FC<ConfigGenericProps> = this.state.Component;
        const schema = this.props.schema || ({} as ConfigItemCustom);

        let item = CustomComponent ? (
            <CustomComponent
                {...this.props}
                // @ts-expect-error BF (2024-12-18) Remove after the 7.4 will be mainstream. All following lines
                socket={this.props.oContext.socket}
                theme={this.props.oContext.theme}
                themeType={this.props.oContext.themeType}
                instance={this.props.oContext.instance}
                adapterName={this.props.oContext.adapterName}
                systemConfig={this.props.oContext.systemConfig}
                forceUpdate={this.props.oContext.forceUpdate}
            />
        ) : this.state.error ? (
            <div>{this.state.error}</div>
        ) : (
            <LinearProgress />
        );

        if (schema.newLine) {
            return (
                <>
                    <div style={{ flexBasis: '100%', height: 0 }} />
                    {item}
                </>
            );
        }

        return item;
    }
}
