import React from 'react';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';

import {
    Checkbox,
    Fab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    InputAdornment,
    IconButton,
    Select,
    MenuItem,
    Typography,
} from '@mui/material';

import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Menu as DragHandleIcon,
    SettingsBackupRestore as RestoreIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

import { I18n, withWidth, DialogConfirm, type Translate, type ThemeType } from '@iobroker/adapter-react-v5';
import { InfoBox } from '@foxriver76/iob-component-lib';

import type { AdminGuiConfig, ioBrokerObject } from '@/types';
import IsVisible from '@/components/IsVisible';
import { AUTO_UPGRADE_OPTIONS_MAPPING, AUTO_UPGRADE_SETTINGS } from '@/helpers/utils';
import AdminUtils from '../../helpers/AdminUtils';
import BaseSystemSettingsDialog from './BaseSystemSettingsDialog';

const styles: Record<string, any> = {
    tabPanel: {
        width: '100%',
        height: '100% ',
        overflow: 'auto',
        overflowX: 'hidden',
        padding: 15,
        // backgroundColor: blueGrey[ 50 ]
    },
    table: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
    },
    buttonPanel: {
        paddingBottom: 20,
        display: 'flex',
    },
    descriptionPanel: {
        width: '100%',
        backgroundColor: 'transparent',
        marginLeft: 40,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
    },
    dragColumn: {
        width: 32,
    },
    enableColumn: {
        width: 110,
    },
    stableColumn: {
        width: 80,
    },
    upgradePolicyColumn: {
        width: 190,
        textAlign: 'center',
    },
    buttonColumn: {
        width: 80,
    },
    nameRow: {
        width: 220,
    },
    input: {
        width: '100%',
    },
    checkboxError: {
        '& span:first-child': {
            border: '2px solid #FF0000',
            borderRadius: 4,
        },
    },
    fabButton: {
        marginRight: 8,
        width: 44,
        height: 44,
    },
    tooltip: {
        pointerEvents: 'none',
    },
};

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type Repository = Record<string, ioBroker.RepositoryInformation>;

type RepositoryArray = Array<{ title: string; link: string }>;

function repoToArray(repos: Repository): RepositoryArray {
    return AdminUtils.objectMap(repos, (repo, name) => ({
        title: name,
        link: repo.link,
    }));
}

function arrayToRepo(array: RepositoryArray): Repository {
    const result: Repository = {};
    for (const item of array) {
        // @ts-expect-error will be fixed in js-controller
        result[item.title] = { link: item.link };
    }

    return result;
}

const DragHandle = SortableHandle(() => <DragHandleIcon style={{ marginTop: 8, marginRight: 0, cursor: 'handle' }} />);

interface RepositoriesDialogProps {
    t: Translate;
    data: ioBrokerObject<{ repositories: Repository }>;
    dataAux: ioBrokerObject<object, { activeRepo: string | string[] }>;
    multipleRepos: boolean;
    repoInfo: Repository;
    saving: boolean;
    onChange: (
        data: ioBrokerObject<{ repositories: Repository }>,
        dataAux?: ioBrokerObject<object, { activeRepo: string | string[] }>,
    ) => void;
    adminGuiConfig: AdminGuiConfig;
    themeType: ThemeType;
}

interface RepositoriesDialogState {
    error: boolean;
    confirm: boolean;
    confirmValue: {
        newData: ioBrokerObject<object, { activeRepo: string | string[] }>;
        error: boolean;
    } | null;
}

const SortableList = SortableContainer<{ value: any }>(({ value }: { value: any }) => value);
const SortableItem = SortableElement<{ value: any }>(({ value }: { value: any }) => value);

class RepositoriesDialog extends BaseSystemSettingsDialog<RepositoriesDialogProps, RepositoriesDialogState> {
    constructor(props: RepositoriesDialogProps) {
        super(props);
        const repos = (
            typeof this.props.dataAux.common.activeRepo === 'string'
                ? [this.props.dataAux.common.activeRepo]
                : this.props.dataAux.common.activeRepo
        ).filter(r => r);

        this.state = {
            error: !repos.length,
            confirm: false,
            confirmValue: null,
        };
    }

    onValueChanged(value: any, id: string, name: 'title' | 'link'): void {
        const newData = AdminUtils.clone(this.props.data);
        const array = repoToArray(newData.native.repositories);
        const item = array.find(element => element.title === id);
        const oldTitle = item.title;
        item[name] = value;
        newData.native.repositories = arrayToRepo(array);

        let newConfig;
        if (
            ((typeof this.props.dataAux.common.activeRepo === 'string' &&
                this.props.dataAux.common.activeRepo === id) ||
                (typeof this.props.dataAux.common.activeRepo !== 'string' &&
                    this.props.dataAux.common.activeRepo.includes(id))) &&
            name === 'title'
        ) {
            newConfig = this.getUpdateDefaultRepo(value, newData, oldTitle, value);
        }

        this.props.onChange(newData, newConfig);
    }

    onDelete(id: string): void {
        const newData = AdminUtils.clone(this.props.data);
        const array = repoToArray(newData.native.repositories);
        const index = array.findIndex(element => element.title === id);
        array.splice(index, 1);
        newData.native.repositories = arrayToRepo(array);
        if (this.props.dataAux.common.activeRepo === id) {
            if (Object.keys(newData.native.repositories).length) {
                // set first repo as active
                this.props.onChange(newData, this.getUpdateDefaultRepo(Object.keys(newData.native.repositories)[0]));
            } else {
                this.props.onChange(newData, this.getUpdateDefaultRepo(''));
            }
        } else {
            this.props.onChange(newData);
        }
    }

    onAdd = (): void => {
        const newData = AdminUtils.clone(this.props.data);
        const array = repoToArray(newData.native.repositories);
        array.push({
            title: '__',
            link: '',
        });
        newData.native.repositories = arrayToRepo(array);
        this.props.onChange(newData);
    };

    onRestore = (): void => {
        const newData = AdminUtils.clone(this.props.data);
        newData.native.repositories = {
            // @ts-expect-error will be fixed in js-controller
            stable: {
                link: 'http://download.iobroker.net/sources-dist.json',
            },
            // @ts-expect-error will be fixed in js-controller
            beta: {
                link: 'http://download.iobroker.net/sources-dist-latest.json',
            },
        };
        // Store old information if already read
        const oldStable = Object.keys(this.props.data.native.repositories).find(
            name => this.props.data.native.repositories[name].link === newData.native.repositories.stable.link,
        );
        if (oldStable) {
            if (newData.native.repositories.stable.json) {
                newData.native.repositories.stable.json = this.props.data.native.repositories[oldStable].json;
            }
            if (newData.native.repositories.stable.hash) {
                newData.native.repositories.stable.hash = this.props.data.native.repositories[oldStable].hash;
            }
            if (newData.native.repositories.stable.time) {
                newData.native.repositories.stable.time = this.props.data.native.repositories[oldStable].time;
            }
        }
        const oldBeta = Object.keys(this.props.data.native.repositories).find(
            name => this.props.data.native.repositories[name].link === newData.native.repositories.beta.link,
        );
        if (oldBeta) {
            if (newData.native.repositories.beta.json) {
                newData.native.repositories.beta.json = this.props.data.native.repositories[oldBeta].json;
            }
            if (newData.native.repositories.beta.hash) {
                newData.native.repositories.beta.hash = this.props.data.native.repositories[oldBeta].hash;
            }
            if (newData.native.repositories.beta.time) {
                newData.native.repositories.beta.time = this.props.data.native.repositories[oldBeta].time;
            }
        }

        const newConfig: ioBrokerObject<Record<string, unknown>, { activeRepo: string | string[] }> = AdminUtils.clone(
            this.props.dataAux,
        );
        if (!this.props.multipleRepos) {
            newConfig.common.activeRepo = 'stable';
            this.props.onChange(newData, newConfig);
            return;
        }
        newConfig.common.activeRepo = ['stable'];
        newConfig.common.adapterAutoUpgrade = { repositories: {}, defaultPolicy: 'none' };

        this.props.onChange(newData, newConfig);
        return null;
    };

    getUpdateDefaultRepo = (
        newRepo: string,
        newData?: ioBrokerObject<{ repositories: Repository }>,
        oldTitle?: string,
        newTitle?: string,
    ): ioBrokerObject<object, { activeRepo: string | string[] }> => {
        const newConfig = AdminUtils.clone(this.props.dataAux);
        if (!this.props.multipleRepos) {
            newConfig.common.activeRepo = newRepo;
            return newConfig;
        }
        newData = newData || AdminUtils.clone(this.props.data);
        if (oldTitle !== undefined && typeof newConfig.common.activeRepo !== 'string') {
            const pos = newConfig.common.activeRepo.indexOf(oldTitle);
            if (pos !== -1) {
                newConfig.common.activeRepo[pos] = newTitle;
            }
        }

        if (typeof newConfig.common.activeRepo === 'string' && newConfig.common.activeRepo) {
            newConfig.common.activeRepo = [newConfig.common.activeRepo];
        }
        newConfig.common.activeRepo = newConfig.common.activeRepo || [];
        if (typeof newConfig.common.activeRepo !== 'string') {
            if (!newConfig.common.activeRepo.includes(newRepo)) {
                // sort activeRepo anew
                const items = repoToArray(newData.native.repositories);
                newConfig.common.activeRepo.sort((a, b) => {
                    const indexA = items.findIndex(item => item.title === a);
                    const indexB = items.findIndex(item => item.title === b);
                    return indexA - indexB;
                });
            }
        }

        return newConfig;
    };

    onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }): void => {
        console.log(oldIndex, newIndex);
        const newData = AdminUtils.clone(this.props.data);
        const items = repoToArray(newData.native.repositories);
        const item = items[oldIndex];
        items.splice(oldIndex, 1);
        items.splice(newIndex, 0, item);
        newData.native.repositories = arrayToRepo(items);

        const newConfig = AdminUtils.clone(this.props.dataAux);

        if (typeof newConfig.common.activeRepo === 'string') {
            newConfig.common.activeRepo = [newConfig.common.activeRepo];
        }

        // sort activeRepo anew
        newConfig.common.activeRepo.sort((a, b) => {
            const indexA = items.findIndex(it => it.title === a);
            const indexB = items.findIndex(it => it.title === b);
            return indexA - indexB;
        });

        this.props.onChange(newData, newConfig);
    };

    onChangeActiveRepo(
        newData: ioBrokerObject<object, { activeRepo: string | string[] }>,
        error: boolean,
        showWarning: boolean,
    ): void {
        if (showWarning) {
            this.setState({ confirm: true, confirmValue: { newData, error } });
        } else {
            this.setState({ error }, () => this.props.onChange(null, newData));
        }
    }

    renderDialogConfirm(): React.JSX.Element {
        if (this.state.confirm) {
            return (
                <DialogConfirm
                    text={this.props.t('confirm_change_repo')}
                    onClose={result => {
                        const value = this.state.confirmValue;
                        this.setState({ confirm: false, confirmValue: null }, () => {
                            if (result) {
                                this.setState({ error: value.error }, () => this.props.onChange(null, value.newData));
                            }
                        });
                    }}
                />
            );
        }
        return null;
    }

    renderSortableItem(item: RepositoryArray[number], index: number): React.JSX.Element {
        const errorName =
            !item.title ||
            item.title.trimStart() !== item.title ||
            (item.title.length < 3 && !!item.title.match(/^\d+$/));

        const result = (
            <TableRow className="float_row">
                <TableCell
                    style={styles.dragColumn}
                    className="float_cell"
                    title={this.props.t('Drag and drop to reorder')}
                >
                    <DragHandle />
                </TableCell>
                <TableCell
                    style={styles.enableColumn}
                    className="float_cell"
                >
                    {index + 1}
                    {this.props.multipleRepos ? (
                        <Checkbox
                            disabled={
                                this.props.adminGuiConfig.admin.settings.activeRepo === false || this.props.saving
                            }
                            sx={this.state.error ? styles.checkboxError : undefined}
                            title={this.state.error ? I18n.t('At least one repo must be selected') : ''}
                            checked={
                                typeof this.props.dataAux.common.activeRepo === 'string'
                                    ? this.props.dataAux.common.activeRepo === item.title
                                    : this.props.dataAux.common.activeRepo.includes(item.title)
                            }
                            onChange={() => {
                                let showWarning = false;
                                const newData = AdminUtils.clone(this.props.dataAux);
                                if (typeof newData.common.activeRepo === 'string') {
                                    newData.common.activeRepo = [newData.common.activeRepo];
                                }
                                let pos = newData.common.activeRepo.indexOf(item.title);
                                if (pos === -1) {
                                    newData.common.activeRepo.push(item.title);
                                    // newData.common.activeRepo.sort();
                                    // sort repos according to order of repos
                                    const arr = repoToArray(this.props.data.native.repositories);
                                    newData.common.activeRepo.sort((a, b) => {
                                        const indexA = arr.findIndex(it => it.title === a);
                                        const indexB = arr.findIndex(it => it.title === b);
                                        return indexA - indexB;
                                    });

                                    showWarning = item.title.toLowerCase().startsWith('beta');
                                } else {
                                    newData.common.activeRepo.splice(pos, 1);
                                }

                                if (
                                    item.title.toLowerCase().startsWith('beta') &&
                                    newData.common.activeRepo.find(r => r.toLowerCase().startsWith('stable'))
                                ) {
                                    pos = newData.common.activeRepo.findIndex(r =>
                                        r.toLowerCase().startsWith('stable'),
                                    );
                                    newData.common.activeRepo.splice(pos, 1);
                                } else if (
                                    item.title.toLowerCase().startsWith('stable') &&
                                    newData.common.activeRepo.find(r => r.toLowerCase().startsWith('beta'))
                                ) {
                                    pos = newData.common.activeRepo.findIndex(r => r.toLowerCase().startsWith('beta'));
                                    newData.common.activeRepo.splice(pos, 1);
                                }

                                const _error = !newData.common.activeRepo.length;
                                this.onChangeActiveRepo(newData, _error, showWarning);
                            }}
                        />
                    ) : null}
                </TableCell>
                <TableCell
                    style={styles.stableColumn}
                    className="float_cell"
                >
                    <Tooltip
                        title={I18n.t(
                            'Flag will be automatically detected as repository will be read for the first time',
                        )}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <span>
                            <Checkbox
                                disabled
                                // @ts-expect-error will be fixed in js-controller 7
                                checked={this.props.repoInfo[item.title]?.stable}
                                indeterminate={!this.props.repoInfo[item.title]}
                            />
                        </span>
                    </Tooltip>
                </TableCell>
                <TableCell
                    style={styles.upgradePolicyColumn}
                    className="float_cell"
                >
                    <Tooltip
                        title={I18n.t('Allow automatic adapter upgrades for this repository')}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <span>
                            <Checkbox
                                disabled={this.props.saving}
                                checked={this.props.dataAux.common?.adapterAutoUpgrade?.repositories[item.title]}
                                onChange={e => {
                                    const sysConfig = AdminUtils.clone(this.props.dataAux);

                                    if (!sysConfig.common.adapterAutoUpgrade) {
                                        sysConfig.common.adapterAutoUpgrade = {
                                            repositories: {},
                                            defaultPolicy: 'none',
                                        };
                                    }

                                    sysConfig.common.adapterAutoUpgrade.repositories[item.title] = e.target.checked;

                                    this.props.onChange(this.props.data, sysConfig);
                                }}
                            />
                        </span>
                    </Tooltip>
                </TableCell>
                <TableCell
                    style={styles.nameRow}
                    className="float_cell"
                >
                    <TextField
                        variant="standard"
                        disabled={this.props.saving}
                        value={item.title}
                        style={styles.input}
                        className="xs-centered"
                        onChange={evt => this.onValueChanged(evt.target.value, item.title, 'title')}
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                            input: {
                                endAdornment: item.title ? (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => this.onValueChanged('', item.title, 'title')}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                        error={errorName}
                        helperText={errorName ? I18n.t('Invalid name') : undefined}
                    />
                </TableCell>
                <TableCell className="grow_cell float_cell">
                    <TextField
                        disabled={this.props.saving}
                        variant="standard"
                        id={`default_${index}`}
                        value={item.link}
                        style={styles.input}
                        className="xs-centered"
                        onChange={evt => this.onValueChanged(evt.target.value, item.title, 'link')}
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                            input: {
                                readOnly: false,
                                endAdornment: item.link ? (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => this.onValueChanged('', item.title, 'link')}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                    />
                </TableCell>
                <TableCell
                    style={styles.buttonColumn}
                    className="float_cell"
                >
                    <Fab
                        disabled={this.props.saving}
                        size="small"
                        color="secondary"
                        aria-label="add"
                        onClick={() => this.onDelete(item.title)}
                    >
                        <DeleteIcon />
                    </Fab>
                </TableCell>
            </TableRow>
        );

        return (
            <SortableItem
                key={index}
                index={index}
                value={result}
            />
        );
    }

    renderSortableList(items: RepositoryArray): React.JSX.Element {
        const result = (
            <Table style={styles.table}>
                <TableHead>
                    <TableRow className="float_row">
                        <TableCell
                            style={styles.dragColumn}
                            className="float_cell"
                        />
                        <TableCell
                            style={styles.enableColumn}
                            className="float_cell"
                        >
                            {this.props.multipleRepos ? I18n.t('Active') : ''}
                        </TableCell>
                        <TableCell
                            style={styles.stableColumn}
                            className="float_cell"
                        >
                            {I18n.t('Stable')}
                        </TableCell>
                        <TableCell
                            style={styles.upgradePolicyColumn}
                            className="float_cell"
                        >
                            {I18n.t('Auto-Upgrade')}
                        </TableCell>
                        <TableCell
                            style={styles.nameRow}
                            className="float_cell"
                        >
                            {this.props.t('name')}
                        </TableCell>
                        <TableCell className="grow_cell float_cell">{this.props.t('link')}</TableCell>
                        <TableCell
                            style={styles.buttonColumn}
                            className="float_cell"
                        >
                            {' '}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>{items.map((item, index) => this.renderSortableItem(item, index))}</TableBody>
            </Table>
        );

        return (
            <SortableList
                helperClass="draggable-item"
                useDragHandle
                lockAxis="y"
                onSortEnd={this.onSortEnd}
                value={result}
            />
        );
    }

    /**
     * Render the auto upgrade policy
     */
    renderAutoUpgradePolicy(): React.JSX.Element {
        const policy: ioBroker.AutoUpgradePolicy =
            this.props.dataAux.common.adapterAutoUpgrade?.defaultPolicy || 'none';
        const activatedRepos = this.props.dataAux.common.adapterAutoUpgrade?.repositories || {};

        return (
            <div style={{ display: 'flex', marginLeft: 20, flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Typography>
                        {I18n.t('Allow only the following upgrades to be performed automatically:')}
                    </Typography>
                    <Select
                        variant="standard"
                        sx={{ marginLeft: 1, marginBottom: 1 }}
                        value={policy}
                        onChange={e => {
                            const sysConfig = AdminUtils.clone(this.props.dataAux);

                            if (!sysConfig.common.adapterAutoUpgrade) {
                                sysConfig.common.adapterAutoUpgrade = { repositories: {}, defaultPolicy: 'none' };
                            }

                            sysConfig.common.adapterAutoUpgrade.defaultPolicy = e.target.value;

                            this.props.onChange(this.props.data, sysConfig);
                        }}
                    >
                        {AUTO_UPGRADE_SETTINGS.map(option => (
                            <MenuItem
                                value={option}
                                key={option}
                            >
                                {AUTO_UPGRADE_OPTIONS_MAPPING[option]}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
                <IsVisible value={!!(activatedRepos.beta || activatedRepos['Beta (latest)']) && policy !== 'none'}>
                    <InfoBox type="warning">{I18n.t('repo_update_hint')}</InfoBox>
                </IsVisible>
                <IsVisible value={policy === 'major'}>
                    <InfoBox type="warning">
                        {I18n.t(
                            'The current selected configuration will allow to automatically pull in incompatible changes of this adapter!',
                        )}
                    </InfoBox>
                </IsVisible>
            </div>
        );
    }

    render(): React.JSX.Element {
        const items = repoToArray(this.props.data.native.repositories);

        return (
            <div style={styles.tabPanel}>
                {this.renderDialogConfirm()}
                <div style={styles.buttonPanel}>
                    <Fab
                        size="small"
                        color="primary"
                        disabled={this.props.saving}
                        aria-label="add"
                        onClick={this.onAdd}
                        style={styles.fabButton}
                        title={this.props.t('Add new line to the repository list')}
                    >
                        <AddIcon />
                    </Fab>
                    <Fab
                        size="small"
                        disabled={this.props.saving}
                        onClick={this.onRestore}
                        style={styles.fabButton}
                        title={this.props.t('Restore repository list to default')}
                    >
                        <RestoreIcon />
                    </Fab>
                    {this.renderAutoUpgradePolicy()}
                </div>
                <TableContainer>{this.renderSortableList(items)}</TableContainer>
            </div>
        );
    }
}

export default withWidth()(RepositoriesDialog);
