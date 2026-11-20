import React, { Component, Fragment, type JSX } from 'react';

import {
    Box,
    Button,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';

import { Update as UpdateIcon } from '@mui/icons-material';

import { TabContent, InfoBox, Router } from '@iobroker/gui-components';

import type { AdaptersContext } from '@/components/Adapters/AdapterInstallDialog';
import AdapterCategoryRow from '@/components/Adapters/AdapterCategoryRow';
import AdapterTile from '@/components/Adapters/AdapterTile';
import AdapterRow from '@/components/Adapters/AdapterRow';
import type { AdapterCacheEntry } from '@/components/Adapters/AdapterGeneric';

const BUTTONS_WIDTH = 34 * 7 + 8;
export const WIDTHS: Record<string, number> = {
    emptyBlock: 50,
    name: 300,
    connectionType: 120,
    installed: 120,
    available: 120,
    update: 40,
    license: 80,
    install: BUTTONS_WIDTH,
};

export const SUM = Object.keys(WIDTHS).reduce((s, i) => s + WIDTHS[i], 0);

const styles: Record<string, any> = {
    container: {
        height: '100%',
        width: '100%',
    },
    containerNotFullHeight: {
        height: 'calc(100% - 50px)',
    },
    containerTwoNotes: {
        height: 'calc(100% - 100px)',
    },
    containerFullHeight: {
        height: '100%',
    },
    table: {
        width: '100%',
        tableLayout: 'fixed',
        minWidth: 960,
        '& td': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pt: '2px',
            pb: '2px',
            pr: '4px',
            pl: '4px',
        },
        '& th': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pt: '2px',
            pb: '2px',
            pr: '4px',
            pl: '4px',
        },
    },
    name: {
        flexWrap: 'nowrap',
        width: WIDTHS.name,
    },
    emptyBlock: {
        flexWrap: 'nowrap',
        width: WIDTHS.emptyBlock,
    },
    description: {
        width: `calc(100% - ${SUM + 2}px)`,
    },
    connectionType: {
        width: WIDTHS.connectionType,
    },
    installed: {
        width: WIDTHS.installed,
    },
    available: {
        width: WIDTHS.available,
        paddingRight: 6,
    },
    update: {
        width: WIDTHS.update,
        padding: 0,
    },
    license: {
        width: WIDTHS.license,
    },
    install: {
        width: WIDTHS.install,
    },
    viewModeDiv: {
        display: 'flex',
        flexFlow: 'wrap',
        overflow: 'auto',
        justifyContent: 'center',
    },
};

interface AdaptersListProps {
    stableRepo: boolean;
    repoName: string;
    /** Active repositories that are not configured (any more): nothing of them can be shown */
    missingRepos: string[];
    context: AdaptersContext;
    systemConfig: ioBroker.SystemConfigObject;
    tableViewMode: boolean;
    listOfVisibleAdapter: string[] | null;
    categoriesExpanded: Record<string, boolean>;
    oneListView: boolean;
    cachedAdapters: { [adapterName: string]: AdapterCacheEntry } | null;
    categories: {
        name: string;
        translation: string;
        count: number;
        installed: number;
        adapters: string[];
    }[];
    toggleCategory: (category: string) => void;
    clearAllFilters: (onlyUpdate?: boolean) => void;
    update: boolean;
    descWidth: number;
    sortByName: boolean;
    sortPopularFirst: boolean;
    sortRecentlyUpdated: boolean;
    sortRecentlyCreated: boolean;
    commandRunning: boolean;
    updateListFilter: boolean;
    /** Filter as string */
    searchFilter: string;
    /** Filter: show only installed */
    installedListFilter: number;
    noTranslation: boolean;
}

interface AdaptersListState {
    descWidth: number;
    repoName: string;
    missingRepos: string;
    systemConfig: boolean;
    tableViewMode: boolean;
    oneListView: boolean;
    categoriesExpanded: string;
    cachedAdapters: number;
    listOfVisibleAdapter: string;
    update: boolean;
    sortByName: boolean;
    sortPopularFirst: boolean;
    sortRecentlyUpdated: boolean;
    sortRecentlyCreated: boolean;
    renderCounter: number;
    expertMode: boolean;
    commandRunning: boolean;
    /** The adapter that the running command installs or updates: its icon gets a turning ring */
    updatingAdapter: string | null;
    noTranslation: boolean;
}

class AdaptersList extends Component<AdaptersListProps, AdaptersListState> {
    private lastRenderCounter: number = -1;

    /** The list was shown at least once, so only the very first load shows the progress bar instead of it */
    private listShown: boolean = false;

    constructor(props: AdaptersListProps) {
        super(props);

        this.state = {
            descWidth: props.descWidth,
            repoName: props.repoName,
            missingRepos: props.missingRepos.join(','),
            systemConfig: !!props.systemConfig,
            tableViewMode: props.tableViewMode,
            oneListView: props.oneListView,
            categoriesExpanded: JSON.stringify(props.categoriesExpanded),
            cachedAdapters: props.cachedAdapters ? Object.keys(props.cachedAdapters).length : 0,
            update: props.update,
            sortByName: props.sortByName,
            sortPopularFirst: props.sortPopularFirst,
            sortRecentlyUpdated: props.sortRecentlyUpdated,
            sortRecentlyCreated: props.sortRecentlyCreated,
            renderCounter: 0,
            listOfVisibleAdapter: JSON.stringify(props.listOfVisibleAdapter),
            expertMode: props.context.expertMode,
            commandRunning: props.commandRunning,
            updatingAdapter: props.context.updatingAdapter,
            noTranslation: props.noTranslation,
        };
    }

    getRow(adapterName: string, context: AdaptersContext): JSX.Element | null {
        const cached = this.props.cachedAdapters?.[adapterName];
        if (cached) {
            return (
                <AdapterRow
                    context={context}
                    key={`adapter-${adapterName}`}
                    adapterName={adapterName}
                    cached={cached}
                    commandRunning={this.state.commandRunning}
                    noTranslation={this.state.noTranslation}
                />
            );
        }
        return null;
    }

    getRows(context: AdaptersContext): JSX.Element | (JSX.Element | null)[] | null {
        if (!this.props.listOfVisibleAdapter) {
            return (
                <TableRow>
                    <TableCell colSpan={8}>
                        <LinearProgress />
                    </TableCell>
                </TableRow>
            );
        }

        let count = 0;

        let rows: (JSX.Element | null)[] = [];

        if (this.props.oneListView) {
            for (let i = 0; i < this.props.listOfVisibleAdapter.length; i++) {
                const adapterName = this.props.listOfVisibleAdapter[i];

                if (rows.length > 50 && !this.props.context.installed[adapterName]?.version) {
                    continue;
                }
                const row = this.getRow(adapterName, context);
                if (row) {
                    rows.push(row);
                }
            }
            count = rows.length;

            if (count && this.props.listOfVisibleAdapter.length > rows.length) {
                const rest = this.props.listOfVisibleAdapter.length - rows.length;
                const text =
                    rest === 1
                        ? this.props.context.t('Filter adapters to see others. There is %s more', 1)
                        : this.props.context.t('Filter adapters to see others. There are %s more', rest);

                rows.push(
                    <TableRow key="more">
                        <TableCell
                            colSpan={8}
                            style={{ fontSize: 20, padding: 20, textAlign: 'center' }}
                        >
                            {text}
                        </TableCell>
                    </TableRow>,
                );
            }
        } else {
            rows = this.props.categories.map(category => {
                const showCategory = category.adapters.find(adapterName =>
                    this.props.listOfVisibleAdapter?.includes(adapterName),
                );
                if (!showCategory) {
                    return null;
                }
                const categoryName = category.name;
                const expanded = this.props.categoriesExpanded[categoryName];
                count++;

                return (
                    <Fragment key={`category-${categoryName} ${category.adapters.length}`}>
                        <AdapterCategoryRow
                            key={`category-${categoryName}${1}`}
                            categoryName={categoryName}
                            count={category.count}
                            expanded={expanded}
                            installedCount={category.installed}
                            name={category.translation}
                            descHidden={context.descHidden}
                            onToggle={() => this.props.toggleCategory(categoryName)}
                            t={this.props.context.t}
                        />

                        {expanded &&
                            category.adapters.map(adapterName => {
                                const item = this.getRow(adapterName, context);
                                if (item) {
                                    count++;
                                }
                                return item;
                            })}
                    </Fragment>
                );
            });
        }

        if (!count) {
            return !this.props.update ? (
                <tr>
                    <td
                        colSpan={8}
                        style={{ textAlign: 'center' }}
                    >
                        {this.props.searchFilter || this.props.installedListFilter ? (
                            <Button
                                variant="outlined"
                                title={this.props.context.t('Click to clear all filters')}
                                onClick={() => this.props.clearAllFilters()}
                            >
                                {this.props.context.t('all items are filtered out')}
                            </Button>
                        ) : null}
                        {this.props.updateListFilter && (this.props.searchFilter || this.props.installedListFilter) ? (
                            <br />
                        ) : null}
                        {this.props.updateListFilter ? (
                            <Button
                                style={{ marginTop: 16 }}
                                variant="outlined"
                                onClick={() => this.props.clearAllFilters(true)}
                                startIcon={<UpdateIcon />}
                            >
                                {this.props.context.t('Remove filter for updatable adapters')}
                            </Button>
                        ) : null}
                    </td>
                </tr>
            ) : null;
        }

        return rows;
    }

    getTiles(context: AdaptersContext): JSX.Element | JSX.Element[] | null {
        if (!this.props.listOfVisibleAdapter) {
            return <LinearProgress />;
        }

        if (!this.props.listOfVisibleAdapter.length) {
            return !this.props.update ? (
                <div
                    style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 16,
                    }}
                >
                    {this.props.searchFilter || this.props.installedListFilter ? (
                        <Tooltip
                            title={this.props.context.t('Click to clear all filters')}
                            slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                        >
                            <Button
                                variant="outlined"
                                onClick={() => this.props.clearAllFilters()}
                            >
                                {this.props.context.t('all items are filtered out')}
                            </Button>
                        </Tooltip>
                    ) : null}
                    {this.props.updateListFilter ? (
                        <Button
                            variant="outlined"
                            onClick={() => this.props.clearAllFilters(true)}
                            startIcon={<UpdateIcon />}
                        >
                            {this.props.context.t('Remove filter for updatable adapters')}
                        </Button>
                    ) : null}
                </div>
            ) : null;
        }
        const items: JSX.Element[] = [];

        for (let i = 0; i < this.props.listOfVisibleAdapter.length; i++) {
            const adapterName = this.props.listOfVisibleAdapter[i];
            const cached = this.props.cachedAdapters?.[adapterName];

            if (items.length > 50 && !this.props.context.installed[adapterName]?.version) {
                continue;
            }
            if (!cached) {
                continue;
            }
            items.push(
                <AdapterTile
                    key={`adapter-${adapterName}`}
                    context={context}
                    adapterName={adapterName}
                    cached={cached}
                    commandRunning={this.state.commandRunning}
                    noTranslation={this.state.noTranslation}
                />,
            );
        }
        if (this.props.listOfVisibleAdapter.length > items.length) {
            items.push(
                <div
                    key="newLine"
                    style={{
                        flexBasis: '100%',
                        height: 0,
                    }}
                />,
            );
            items.push(
                <div
                    key="more"
                    style={{ fontSize: 20, margin: 20 }}
                >
                    {this.props.context.t(
                        'Filter adapters to see others. There is %s more',
                        this.props.listOfVisibleAdapter.length - items.length,
                    )}
                </div>,
            );
        }

        return items;
    }

    /**
     * The notes above the list: an active repository that does not exist, and a repository that is not the stable one.
     *
     * @param stableRepo all active repositories are stable ones
     * @param repoName names of the active repositories that are not stable
     */
    renderRepoNotes(stableRepo: boolean, repoName: string): JSX.Element | null {
        const missing = this.props.missingRepos;
        if (stableRepo && !missing.length) {
            return null;
        }
        return (
            <Box sx={{ marginX: 2, marginTop: 1, width: 'calc(100% - 32px)' }}>
                {missing.length ? (
                    // Otherwise every adapter is just "not maintained", and nothing tells why
                    <InfoBox type="error">
                        {[
                            this.props.context.t(
                                missing.length === 1
                                    ? 'The active repository "%s" does not exist'
                                    : 'The active repositories "%s" do not exist',
                                missing.join('", "'),
                            ),
                            <Button
                                key="settings"
                                size="small"
                                variant="contained"
                                style={{ marginLeft: 16 }}
                                onClick={() => Router.doNavigate(null, 'system', 'tabRepositories')}
                            >
                                {this.props.context.t('Select repository')}
                            </Button>,
                        ]}
                    </InfoBox>
                ) : null}
                {!stableRepo && repoName ? (
                    <InfoBox type="warning">{this.props.context.t('Active repo is "%s"', repoName)}</InfoBox>
                ) : null}
            </Box>
        );
    }

    renderTileView(stableRepo: boolean, repoName: string, context: AdaptersContext): JSX.Element {
        return (
            <>
                {this.renderRepoNotes(stableRepo, repoName)}
                <div style={styles.viewModeDiv}>{this.getTiles(context)}</div>
            </>
        );
    }

    renderTableView(stableRepo: boolean, repoName: string, context: AdaptersContext): JSX.Element {
        return (
            <TabContent>
                {this.renderRepoNotes(stableRepo, repoName)}
                <TableContainer
                    style={{
                        ...styles.container,
                        ...(!stableRepo && this.props.missingRepos.length
                            ? styles.containerTwoNotes
                            : !stableRepo || this.props.missingRepos.length
                              ? styles.containerNotFullHeight
                              : styles.containerFullHeight),
                    }}
                >
                    <Table
                        stickyHeader
                        size="small"
                        sx={styles.table}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell style={styles.emptyBlock}></TableCell>
                                <TableCell style={styles.name}>
                                    <Typography>{this.props.context.t('Name')}</Typography>
                                </TableCell>
                                {!context.descHidden && (
                                    <TableCell style={{ ...styles.description, width: this.props.descWidth }}>
                                        <Typography>{this.props.context.t('Description')}</Typography>
                                    </TableCell>
                                )}
                                <TableCell style={styles.connectionType} />
                                <TableCell style={styles.installed}>
                                    <Typography>{this.props.context.t('Installed')}</Typography>
                                </TableCell>
                                <TableCell style={styles.available}>
                                    <Typography>{this.props.context.t('Available')}</Typography>
                                </TableCell>
                                <TableCell style={styles.license}>
                                    <Typography>{this.props.context.t('License')}</Typography>
                                </TableCell>
                                <TableCell
                                    style={{
                                        ...styles.install,
                                        width: this.state.expertMode ? BUTTONS_WIDTH : BUTTONS_WIDTH - 34 * 2,
                                    }}
                                >
                                    <Typography>{this.props.context.t('Install')}</Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>{this.getRows(context)}</TableBody>
                    </Table>
                </TableContainer>
            </TabContent>
        );
    }

    static getDerivedStateFromProps(
        props: AdaptersListProps,
        state: AdaptersListState,
    ): Partial<AdaptersListState> | null {
        let changed = false;
        // rewrite only if view mode changed, count of adapters in the list
        if (props.descWidth !== state.descWidth) {
            console.log('Render because of descWidth');
            changed = true;
        }
        if (props.repoName !== state.repoName) {
            console.log('Render because of repoName');
            changed = true;
        }
        const missingRepos = props.missingRepos.join(',');
        if (missingRepos !== state.missingRepos) {
            console.log('Render because of missingRepos');
            changed = true;
        }
        if (!!props.systemConfig !== state.systemConfig) {
            console.log('Render because of systemConfig');
            changed = true;
        }
        if (props.tableViewMode !== state.tableViewMode) {
            console.log('Render because of tableViewMode');
            changed = true;
        }
        if (props.oneListView !== state.oneListView) {
            console.log('Render because of oneListView');
            changed = true;
        }
        const categoriesExpanded = JSON.stringify(props.categoriesExpanded);
        if (categoriesExpanded !== state.categoriesExpanded) {
            console.log('Render because of categoriesExpanded');
            changed = true;
        }
        const cachedAdapters = props.cachedAdapters ? Object.keys(props.cachedAdapters).length : 0;
        if (cachedAdapters !== state.cachedAdapters) {
            console.log(`Render because of cachedAdapters ${cachedAdapters} <> ${state.cachedAdapters}`);
            changed = true;
        }
        if (props.update !== state.update) {
            console.log('Render because of update');
            changed = true;
        }
        if (props.sortByName !== state.sortByName) {
            console.log('Render because of sortByName');
            changed = true;
        }
        if (props.sortPopularFirst !== state.sortPopularFirst) {
            console.log('Render because of sortPopularFirst');
            changed = true;
        }
        if (props.sortRecentlyUpdated !== state.sortRecentlyUpdated) {
            console.log('Render because of sortRecentlyUpdated');
            changed = true;
        }
        if (props.sortRecentlyCreated !== state.sortRecentlyCreated) {
            console.log('Render because of sortRecentlyCreated');
            changed = true;
        }
        if (props.context.expertMode !== state.expertMode) {
            console.log('Render because of expertMode');
            changed = true;
        }
        const listOfVisibleAdapter = JSON.stringify(props.listOfVisibleAdapter);
        if (listOfVisibleAdapter !== state.listOfVisibleAdapter) {
            console.log('Render because of listOfVisibleAdapter');
            changed = true;
        }
        if (props.commandRunning !== state.commandRunning) {
            console.log('Render because of commandRunning');
            changed = true;
        }
        if (props.context.updatingAdapter !== state.updatingAdapter) {
            changed = true;
        }
        if (props.noTranslation !== state.noTranslation) {
            console.log('Render because of commandRunning');
            changed = true;
        }
        if (changed) {
            return {
                descWidth: props.descWidth,
                repoName: props.repoName,
                missingRepos,
                systemConfig: !!props.systemConfig,
                tableViewMode: props.tableViewMode,
                oneListView: props.oneListView,
                categoriesExpanded,
                cachedAdapters,
                update: props.update,
                sortByName: props.sortByName,
                sortPopularFirst: props.sortPopularFirst,
                sortRecentlyUpdated: props.sortRecentlyUpdated,
                sortRecentlyCreated: props.sortRecentlyCreated,
                listOfVisibleAdapter,
                renderCounter: state.renderCounter + 1,
                expertMode: props.context.expertMode,
                commandRunning: props.commandRunning,
                updatingAdapter: props.context.updatingAdapter,
                noTranslation: props.noTranslation,
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps: Readonly<AdaptersListProps>, nextState: Readonly<AdaptersListState>): boolean {
        // No list means it is being rebuilt, what takes one tick (e.g. an adapter was installed). The rows stay till
        // then: with only the progress bar the table got so short that the browser scrolled it to the top
        if (!nextProps.listOfVisibleAdapter && this.listShown) {
            return false;
        }
        if (this.lastRenderCounter !== nextState.renderCounter) {
            this.lastRenderCounter = nextState.renderCounter;
            return true;
        }

        return false;
    }

    render(): JSX.Element {
        if (!this.props.systemConfig?.common?.activeRepo) {
            return <LinearProgress />;
        }

        this.listShown ||= !!this.props.listOfVisibleAdapter;

        if (this.props.tableViewMode) {
            return this.renderTableView(this.props.stableRepo, this.props.repoName, this.props.context);
        }
        return this.renderTileView(this.props.stableRepo, this.props.repoName, this.props.context);
    }
}

export default AdaptersList;
