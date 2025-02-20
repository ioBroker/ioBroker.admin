import React, { type JSX } from 'react';

import { Tabs, Tab, IconButton, Toolbar, Menu, MenuItem, ListItemIcon } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

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
    width: number;
    openMenu: HTMLButtonElement | null;
}

class ConfigTabs extends ConfigGeneric<ConfigTabsProps, ConfigTabsState> {
    private resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    private readonly refDiv: React.RefObject<HTMLDivElement>;

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
        this.refDiv = React.createRef();

        Object.assign(this.state, { tab, width: 0, openMenu: null });
    }

    componentWillUnmount(): void {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
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

    getCurrentBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
        if (!this.state.width) {
            return 'md';
        }
        if (this.state.width < 600) {
            return 'xs';
        }
        if (this.state.width < 900) {
            return 'sm';
        }
        if (this.state.width < 1200) {
            return 'md';
        }
        if (this.state.width < 1536) {
            return 'lg';
        }
        return 'xl';
    }

    componentDidUpdate(): void {
        if (this.refDiv.current?.clientWidth && this.refDiv.current.clientWidth !== this.state.width) {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = setTimeout(() => {
                this.resizeTimeout = null;
                this.setState({ width: this.refDiv.current?.clientWidth });
            }, 50);
        }
    }

    onMenuChange(tab: string): void {
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
    }

    render(): JSX.Element {
        const items = this.props.schema.items;
        let withIcons = false;
        const elements: { icon: React.JSX.Element | null; label: string; name: string; disabled: boolean }[] = [];

        Object.keys(items).map(name => {
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
                    return;
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
                    return;
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
            elements.push({ icon, disabled, label: this.getText(items[name].label), name });
        });

        const currentBreakpoint = this.getCurrentBreakpoint();
        let tabs: React.JSX.Element;
        if (currentBreakpoint === 'xs' && elements.length > 2) {
            tabs = (
                <Toolbar
                    style={{
                        top: 2,
                        backgroundColor: this.props.oContext.themeType === 'dark' ? '#222' : '#DDD',
                    }}
                    variant="dense"
                >
                    <IconButton
                        onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                            this.setState({ openMenu: event.currentTarget })
                        }
                    >
                        <MenuIcon />
                    </IconButton>
                    {this.state.openMenu ? (
                        <Menu
                            open={!0}
                            anchorEl={this.state.openMenu}
                            onClose={() => this.setState({ openMenu: null })}
                        >
                            {elements.map(el => {
                                return (
                                    <MenuItem
                                        disabled={el.disabled}
                                        key={el.name}
                                        onClick={() => {
                                            this.setState({ openMenu: null }, () => this.onMenuChange(el.name));
                                        }}
                                        selected={el.name === this.state.tab}
                                    >
                                        {withIcons ? <ListItemIcon>{el.icon}</ListItemIcon> : null}
                                        {el.label}
                                    </MenuItem>
                                );
                            })}
                        </Menu>
                    ) : null}
                </Toolbar>
            );
        } else {
            tabs = (
                <Tabs
                    variant="scrollable"
                    scrollButtons="auto"
                    style={this.props.schema.tabsStyle}
                    value={this.state.tab}
                    onChange={(_e, tab: string): void => this.onMenuChange(tab)}
                >
                    {elements.map(el => {
                        return (
                            <Tab
                                id={el.name}
                                wrapped
                                disabled={el.disabled}
                                key={el.name}
                                value={el.name}
                                iconPosition={this.props.schema.iconPosition || 'start'}
                                icon={el.icon}
                                label={el.label}
                            />
                        );
                    })}
                </Tabs>
            );
        }

        return (
            <div
                style={styles.tabs}
                ref={this.refDiv}
            >
                {tabs}
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
