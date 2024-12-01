import React, { type JSX } from 'react';

import { Tabs, Tab } from '@mui/material';

import type { ConfigItemTabs } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';
import ConfigPanel from './ConfigPanel';

const styles: Record<string, React.CSSProperties> = {
    tabs: {
        height: '100%',
        width: '100%',
    },
    panel: {
        width: '100%',
        display: 'block',
    },
    panelWithIcons: {
        height: 'calc(100% - 72px)',
    },
    panelWithoutIcons: {
        height: 'calc(100% - 48px)',
    },
};

interface ConfigTabsProps extends ConfigGenericProps {
    schema: ConfigItemTabs;
    dialogName?: string;
}

interface ConfigTabsState extends ConfigGenericState {
    tab?: string;
}

class ConfigTabs extends ConfigGeneric<ConfigTabsProps, ConfigTabsState> {
    constructor(props: ConfigTabsProps) {
        super(props);
        let tab: string | undefined;

        if (this.props.root) {
            // read the path from hash
            // #tab-instances/config/system.adapter.ping.0/<TAB-NAME-OR-INDEX>
            const hash = (window.location.hash || '').replace(/^#/, '').split('/');
            if (hash.length >= 3 && hash[1] === 'config') {
                const tabS = hash[3];
                const tabN = parseInt(tabS, 10);
                if (tabS && tabN.toString() === tabS) {
                    if (tabN >= 0 && tabN < Object.keys(this.props.schema.items).length) {
                        tab = Object.keys(this.props.schema.items)[tabN];
                    }
                } else if (tabS && Object.keys(this.props.schema.items).includes(tabS)) {
                    tab = tabS;
                }

                // install on hash change handler
                window.addEventListener('hashchange', this.onHashTabsChanged, false);
            }
        }

        if (tab === undefined) {
            tab =
                (((window as any)._localStorage as Storage) || window.localStorage).getItem(
                    `${this.props.dialogName || 'App'}.${this.props.oContext.adapterName}`,
                ) || Object.keys(this.props.schema.items)[0];
            if (!Object.keys(this.props.schema.items).includes(tab)) {
                tab = Object.keys(this.props.schema.items)[0];
            }
        }

        Object.assign(this.state, { tab });
    }

    componentWillUnmount(): void {
        window.removeEventListener('hashchange', this.onHashTabsChanged, false);
        super.componentWillUnmount();
    }

    onHashTabsChanged = (): void => {
        const hash = (window.location.hash || '').replace(/^#/, '').split('/');
        if (hash.length > 3 && hash[1] === 'config') {
            const tabS = hash[3];
            const tabN = parseInt(tabS, 10);
            let tab;
            if (tabN.toString() === tabS) {
                if (tabN >= 0 && tabN < Object.keys(this.props.schema.items).length) {
                    tab = Object.keys(this.props.schema.items)[tabN];
                }
            } else if (Object.keys(this.props.schema.items).includes(tabS)) {
                tab = tabS;
            }
            if (tab !== undefined && tab !== this.state.tab) {
                (((window as any)._localStorage as Storage) || window.localStorage).setItem(
                    `${this.props.dialogName || 'App'}.${this.props.oContext.adapterName}`,
                    tab,
                );
                this.setState({ tab });
            }
        }
    };

    render(): JSX.Element {
        const items = this.props.schema.items;
        let withIcons = false;

        return (
            <div style={styles.tabs}>
                <Tabs
                    variant="scrollable"
                    scrollButtons="auto"
                    style={this.props.schema.tabsStyle}
                    value={this.state.tab}
                    onChange={(e, tab) => {
                        (((window as any)._localStorage as Storage) || window.localStorage).setItem(
                            `${this.props.dialogName || 'App'}.${this.props.oContext.adapterName}`,
                            tab,
                        );
                        this.setState({ tab }, () => {
                            if (this.props.root) {
                                const hash = (window.location.hash || '').split('/');
                                if (hash.length >= 3 && hash[1] === 'config') {
                                    hash[3] = this.state.tab;
                                    window.location.hash = hash.join('/');
                                }
                            }
                        });
                    }}
                >
                    {Object.keys(items).map(name => {
                        let disabled: boolean;
                        if (this.props.custom) {
                            const hidden = this.executeCustom(
                                items[name].hidden,
                                this.props.data,
                                this.props.customObj,
                                this.props.oContext.instanceObj,
                                this.props.index,
                                this.props.globalData,
                            );
                            if (hidden) {
                                return null;
                            }
                            disabled = this.executeCustom(
                                items[name].disabled,
                                this.props.data,
                                this.props.customObj,
                                this.props.oContext.instanceObj,
                                this.props.index,
                                this.props.globalData,
                            ) as boolean;
                        } else {
                            const hidden: boolean = this.execute(
                                items[name].hidden,
                                false,
                                this.props.data,
                                this.props.index,
                                this.props.globalData,
                            ) as boolean;
                            if (hidden) {
                                return null;
                            }
                            disabled = this.execute(
                                items[name].disabled,
                                false,
                                this.props.data,
                                this.props.index,
                                this.props.globalData,
                            ) as boolean;
                        }
                        const icon = this.getIcon(items[name].icon);
                        withIcons = withIcons || !!icon;

                        return (
                            <Tab
                                id={name}
                                wrapped
                                disabled={disabled}
                                key={name}
                                value={name}
                                iconPosition={this.props.schema.iconPosition || 'start'}
                                icon={icon}
                                label={this.getText(items[name].label)}
                            />
                        );
                    })}
                </Tabs>
                <ConfigPanel
                    oContext={this.props.oContext}
                    isParentTab
                    changed={this.props.changed}
                    key={this.state.tab}
                    index={1001}
                    arrayIndex={this.props.arrayIndex}
                    globalData={this.props.globalData}
                    commandRunning={this.props.commandRunning}
                    style={{
                        ...styles.panel,
                        ...(withIcons ? styles.panelWithIcons : styles.panelWithoutIcons),
                    }}
                    common={this.props.common}
                    alive={this.props.alive}
                    themeName={this.props.themeName}
                    data={this.props.data}
                    originalData={this.props.originalData}
                    onChange={this.props.onChange}
                    onError={this.props.onError}
                    customObj={this.props.customObj}
                    custom={this.props.custom}
                    schema={items[this.state.tab]}
                    table={this.props.table}
                    withIcons={withIcons}
                />
            </div>
        );
    }
}

export default ConfigTabs;
