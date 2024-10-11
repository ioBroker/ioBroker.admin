import React, { type JSX } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, AppBar, Tabs, Tab, Box } from '@mui/material';

import {
    I18n,
    DialogConfirm,
    Router,
    type AdminConnection,
    type IobTheme,
    type ThemeType,
    type ThemeName,
    type Translate,
} from '@iobroker/adapter-react-v5';

// Icons
import { Close as CloseIcon, Save as SaveIcon } from '@mui/icons-material';

import ObjectCustomEditor from '../components/Object/ObjectCustomEditor';
import ObjectHistoryData from '../components/Object/ObjectHistoryData';
import ObjectChart from '../components/Object/ObjectChart';
import MobileDialog from '../helpers/MobileDialog';

const styles: Record<string, any> = {
    dialog: {
        height: '100%',
    },
    paper: {
        height: 'calc(100% - 64px)',
    },
    content: {
        textAlign: 'center',
        overflow: 'hidden',
    },
    tabPanel: (theme: IobTheme) => ({
        width: '100%',
        overflow: 'hidden',
        height: `calc(100% - ${theme.mixins.toolbar.minHeight}px)`,
    }),
    tabSelected: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? theme.palette.secondary.contrastText : '#FFFFFF !important',
    }),
    tabsIndicator: (theme: IobTheme) => ({
        backgroundColor: theme.palette.secondary.main,
    }),
};

interface ObjectCustomDialogProps {
    t: Translate;
    lang: ioBroker.Languages;
    expertMode?: boolean;
    objects: Record<string, ioBroker.Object>;
    socket: AdminConnection;
    theme: IobTheme;
    themeName: ThemeName;
    themeType: ThemeType;
    customsInstances: string[];
    objectIDs: string[];
    onClose: () => void;
    reportChangedIds: (ids: string[]) => void;
    isFloatComma: boolean;
    allVisibleObjects: boolean;
    systemConfig: ioBroker.SystemConfigObject;
}

interface ObjectCustomDialogState {
    hasChanges: boolean;
    currentTab: number;
    confirmDialog: boolean;
    mobile: boolean;
    progressRunning: boolean;
    showWarning: boolean;
}

class ObjectCustomDialog extends MobileDialog<ObjectCustomDialogProps, ObjectCustomDialogState> {
    private chartAvailable: boolean;

    private saveFunc: ((cb?: (error?: boolean) => void) => void) | null = null;

    constructor(props: ObjectCustomDialogProps) {
        super(props);

        let currentTab = parseInt(
            (((window as any)._localStorage as Storage) || window.localStorage).getItem('App.objectCustomTab') || '0',
            10,
        );

        this.chartAvailable = this.isChartAvailable();

        if (this.chartAvailable) {
            const location = Router.getLocation();
            if (location.arg === 'chart') {
                currentTab = 2;
            } else if (location.arg === 'table') {
                currentTab = 1;
            }
        } else {
            currentTab = 0;
        }

        this.state = {
            hasChanges: false,
            currentTab,
            confirmDialog: false,
            mobile: MobileDialog.isMobile(),
            progressRunning: false,
            showWarning: this.props.allVisibleObjects,
        };
    }

    isChartAvailable(): boolean {
        let chartAvailable = this.props.objectIDs.length === 1;
        if (chartAvailable) {
            const id = this.props.objectIDs[0];
            if (this.props.objects[id]?.common?.custom) {
                chartAvailable = !!Object.keys(this.props.objects[id].common.custom).find(inst => {
                    const obj = this.props.objects[`system.adapter.${inst}`];
                    return obj && obj.common && obj.common.getHistory;
                });
            } else {
                chartAvailable = false;
            }
        }
        return chartAvailable;
    }

    renderCharts(): JSX.Element {
        return (
            <ObjectChart
                id="custom-tabpanel-chart"
                isFloatComma={this.props.isFloatComma}
                showJumpToEchart
                t={this.props.t}
                lang={this.props.lang}
                expertMode={this.props.expertMode}
                socket={this.props.socket}
                obj={this.props.objects[this.props.objectIDs[0]]}
                customsInstances={this.props.customsInstances}
                themeType={this.props.themeType}
                theme={this.props.theme}
                objects={this.props.objects}
            />
        );
    }

    renderTable(): JSX.Element {
        return (
            <ObjectHistoryData
                id="custom-tabpanel-history"
                t={this.props.t}
                isFloatComma={this.props.isFloatComma}
                lang={this.props.lang}
                expertMode={this.props.expertMode}
                socket={this.props.socket}
                obj={this.props.objects[this.props.objectIDs[0]]}
                customsInstances={this.props.customsInstances}
                themeName={this.props.themeName}
                objects={this.props.objects}
            />
        );
    }

    renderCustomEditor(): JSX.Element {
        return (
            <ObjectCustomEditor
                id="custom-tabpanel-settings"
                registerSaveFunc={(func: (cb?: (error?: boolean) => void) => void) => (this.saveFunc = func)}
                t={this.props.t}
                allVisibleObjects={this.props.allVisibleObjects}
                lang={this.props.lang}
                expertMode={this.props.expertMode}
                socket={this.props.socket}
                objectIDs={this.props.objectIDs}
                customsInstances={this.props.customsInstances}
                objects={this.props.objects}
                onProgress={(progressRunning: boolean) => this.setState({ progressRunning })}
                reportChangedIds={this.props.reportChangedIds}
                onChange={(hasChanges: boolean, update: boolean) => {
                    this.setState({ hasChanges }, () => {
                        if (update) {
                            const chartAvailable = this.isChartAvailable();
                            if (chartAvailable !== this.chartAvailable) {
                                this.chartAvailable = chartAvailable;
                                this.forceUpdate();
                            }
                        }
                    });
                }}
                theme={this.props.theme}
                themeName={this.props.themeName}
                themeType={this.props.themeType}
                systemConfig={this.props.systemConfig}
            />
        );
    }

    renderDialogConfirm(): JSX.Element | null {
        if (!this.state.confirmDialog) {
            return null;
        }
        return (
            <DialogConfirm
                title={I18n.t('You have unsaved changes')}
                text={I18n.t('Discard?')}
                ok={I18n.t('Yes')}
                cancel={I18n.t('Cancel')}
                onClose={isYes => this.setState({ confirmDialog: false }, () => isYes && this.props.onClose())}
            />
        );
    }

    onClose(): void {
        if (this.state.hasChanges) {
            this.setState({ confirmDialog: true });
        } else {
            this.props.onClose();
        }
    }

    renderWarningDialog(): JSX.Element | null {
        if (!this.state.showWarning) {
            return null;
        }
        return (
            <DialogConfirm
                text={
                    <div style={{ color: '#F00' }}>
                        {this.props.t('Your are intend to edit ALL objects. Are you sure?')}
                    </div>
                }
                ok={this.props.t('Yes')}
                onClose={result => {
                    this.setState({ showWarning: false });
                    if (!result) {
                        this.onClose();
                    }
                }}
            />
        );
    }

    render(): JSX.Element {
        const varType = this.props.objects[this.props.objectIDs[0]]?.common?.type;

        return (
            <Dialog
                sx={{ '&.MuiDialog-scrollPaper': styles.dialog, '& .MuiDialog-paper': styles.paper }}
                scroll="paper"
                open={!0}
                onClose={() => this.props.onClose()}
                fullWidth
                maxWidth="xl"
                aria-labelledby="form-dialog-title"
            >
                {this.renderDialogConfirm()}
                {this.renderWarningDialog()}
                <DialogTitle>
                    {this.props.objectIDs.length > 1
                        ? this.props.t('Edit config for %s states', this.props.objectIDs.length)
                        : this.props.t('Edit config: %s', this.props.objectIDs[0])}
                </DialogTitle>
                <DialogContent style={styles.content}>
                    <AppBar position="static">
                        <Tabs
                            value={this.state.currentTab}
                            onChange={(_event, newTab) => {
                                Router.doNavigate(
                                    null,
                                    null,
                                    null,
                                    newTab === 1 ? 'table' : newTab === 2 ? 'chart' : 'config',
                                );
                                this.setState({ currentTab: newTab });
                                (((window as any)._localStorage as Storage) || window.localStorage).setItem(
                                    'App.objectCustomTab',
                                    newTab,
                                );
                            }}
                            sx={{ '& .MuiTabs-indicator': styles.tabsIndicator }}
                            indicatorColor="secondary"
                        >
                            <Tab
                                disabled={this.state.progressRunning}
                                label={this.props.t('Custom settings')}
                                id="custom-settings-tab"
                                aria-controls="custom-tabpanel-settings"
                                sx={{ '&.Mui-selected': styles.tabSelected }}
                            />
                            {this.props.objectIDs.length === 1 && this.chartAvailable ? (
                                <Tab
                                    disabled={this.state.progressRunning}
                                    label={this.props.t('History data')}
                                    id="history-data-tab"
                                    aria-controls="custom-tabpanel-history"
                                    sx={{ '&.Mui-selected': styles.tabSelected }}
                                />
                            ) : null}
                            {(varType === 'number' || varType === 'boolean') &&
                            this.props.objectIDs.length === 1 &&
                            this.chartAvailable ? (
                                <Tab
                                    disabled={this.state.progressRunning}
                                    label={this.props.t('Chart')}
                                    id="chart-tab"
                                    aria-controls="custom-tabpanel-chart"
                                    sx={{ '&.Mui-selected': styles.tabSelected }}
                                />
                            ) : null}
                        </Tabs>
                    </AppBar>
                    {this.state.currentTab === 0 ? (
                        <Box
                            component="div"
                            sx={styles.tabPanel}
                        >
                            {this.renderCustomEditor()}
                        </Box>
                    ) : null}
                    {this.props.objectIDs.length === 1 && this.chartAvailable && this.state.currentTab === 1 ? (
                        <Box
                            component="div"
                            sx={styles.tabPanel}
                        >
                            {this.renderTable()}
                        </Box>
                    ) : null}
                    {(varType === 'number' || varType === 'boolean') &&
                    this.props.objectIDs.length === 1 &&
                    this.chartAvailable &&
                    this.state.currentTab === 2 ? (
                        <Box
                            component="div"
                            sx={styles.tabPanel}
                        >
                            {this.renderCharts()}
                        </Box>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    {this.state.currentTab === 0 && (
                        <Button
                            id="object-custom-dialog-save"
                            variant="contained"
                            color="primary"
                            disabled={!this.state.hasChanges || this.state.progressRunning}
                            onClick={() => this.saveFunc && this.saveFunc()}
                        >
                            {this.getButtonTitle(<SaveIcon />, this.props.t('Save'))}
                        </Button>
                    )}
                    {this.state.currentTab === 0 && (
                        <Button
                            id="object-custom-dialog-save-close"
                            variant="contained"
                            color="primary"
                            disabled={!this.state.hasChanges || this.state.progressRunning}
                            onClick={() => {
                                if (this.saveFunc) {
                                    this.saveFunc(error => !error && this.onClose());
                                } else {
                                    this.onClose();
                                }
                            }}
                        >
                            {this.getButtonTitle(<SaveIcon />, this.props.t('Save & close'), <CloseIcon />)}
                        </Button>
                    )}
                    <Button
                        id="object-custom-dialog-close"
                        disabled={this.state.progressRunning}
                        variant="contained"
                        onClick={() => this.onClose()}
                        color="grey"
                    >
                        {this.getButtonTitle(<CloseIcon />, this.props.t('Close'))}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default ObjectCustomDialog;
