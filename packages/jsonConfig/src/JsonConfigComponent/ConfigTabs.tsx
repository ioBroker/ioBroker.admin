import React from 'react';
import { withStyles } from '@mui/styles';

import { Tabs, Tab } from '@mui/material';

import type { ConfigItemTabs } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';
import ConfigPanel from './ConfigPanel';

const styles: Record<string, any> = {
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

        let tab = ((window as any)._localStorage as Storage || window.localStorage).getItem(`${this.props.dialogName || 'App'}.${this.props.adapterName}`) || Object.keys(this.props.schema.items)[0];
        if (!Object.keys(this.props.schema.items).includes(tab)) {
            tab = Object.keys(this.props.schema.items)[0];
        }
        Object.assign(this.state, { tab });
    }

    render() {
        const items = this.props.schema.items;
        let withIcons = false;

        return <div className={this.props.classes.tabs}>
            <Tabs
                variant="scrollable"
                scrollButtons="auto"
                style={this.props.schema.tabsStyle}
                value={this.state.tab}
                onChange={(e, tab) => {
                    ((window as any)._localStorage as Storage || window.localStorage).setItem(`${this.props.dialogName || 'App'}.${this.props.adapterName}`, tab);
                    this.setState({ tab });
                }}
            >
                {Object.keys(items).map(name => {
                    let disabled: boolean;
                    if (this.props.custom) {
                        const hidden = this.executeCustom(
                            items[name].hidden,
                            this.props.data,
                            this.props.customObj,
                            this.props.instanceObj,
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
                            this.props.instanceObj,
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

                    return <Tab
                        wrapped
                        disabled={disabled}
                        key={name}
                        value={name}
                        iconPosition={this.props.schema.iconPosition || 'start'}
                        icon={icon}
                        label={this.getText(items[name].label)}
                    />;
                })}
            </Tabs>
            <ConfigPanel
                isParentTab
                changed={this.props.changed}
                key={this.state.tab}
                index={1001}
                arrayIndex={this.props.arrayIndex}
                globalData={this.props.globalData}
                onCommandRunning={this.props.onCommandRunning}
                commandRunning={this.props.commandRunning}
                className={`${this.props.classes.panel} ${withIcons ? this.props.classes.panelWithIcons : this.props.classes.panelWithoutIcons}`}
                socket={this.props.socket}
                adapterName={this.props.adapterName}
                instance={this.props.instance}
                common={this.props.common}
                customs={this.props.customs}
                alive={this.props.alive}
                themeType={this.props.themeType}
                themeName={this.props.themeName}
                data={this.props.data}
                originalData={this.props.originalData}
                systemConfig={this.props.systemConfig}
                onError={this.props.onError}
                onChange={this.props.onChange}
                multiEdit={this.props.multiEdit}
                dateFormat={this.props.dateFormat}
                isFloatComma={this.props.isFloatComma}
                // disabled={disabled}
                imagePrefix={this.props.imagePrefix}
                changeLanguage={this.props.changeLanguage}
                forceUpdate={this.props.forceUpdate}
                registerOnForceUpdate={this.props.registerOnForceUpdate}
                customObj={this.props.customObj}
                instanceObj={this.props.instanceObj}
                custom={this.props.custom}
                schema={items[this.state.tab]}
                table={this.props.table}
                withIcons={withIcons}
            />
        </div>;
    }
}

export default withStyles(styles)(ConfigTabs);
