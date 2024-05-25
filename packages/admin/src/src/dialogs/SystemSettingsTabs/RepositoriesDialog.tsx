import React, { Component } from 'react';
import { type Styles, withStyles } from '@mui/styles';
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
    Paper, InputAdornment, IconButton,
} from '@mui/material';

import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Menu as DragHandleIcon,
    SettingsBackupRestore as RestoreIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

import {
    I18n,
    Utils as UtilsCommon,
    withWidth,
    Confirm as ConfirmDialog,
} from '@iobroker/adapter-react-v5';

import { type Translator, type Theme } from '@iobroker/adapter-react-v5/types';
import type { AdminGuiConfig, ioBrokerObject } from '@/types';
import Utils from '../../Utils';

const styles: Styles<Theme, any> = theme => ({
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
        paddingBottom: 40,
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
        marginRight: theme.spacing(1),
        width: 44,
    },
});

type Repository = Record<'stable' | string, { link: string; hash?: string; time?: string; json?: object; stable?: boolean }>;

type RepositoryArray = Array<{ title: string; link: string }>;

function repoToArray(repos: Repository):RepositoryArray {
    return Utils.objectMap(repos, (repo, name) => ({
        title: name,
        link: repo.link,
    }));
}

function arrayToRepo(array: RepositoryArray): Repository {
    const result:Repository = {};
    for (const k in array) {
        result[array[k].title] = { link: array[k].link };
    }

    return result;
}

const DragHandle = SortableHandle(() => <DragHandleIcon style={{ marginTop: 8, marginRight: 0, cursor: 'handle' }} />);

interface RepositoriesDialogProps {
    t: Translator;
    classes: Record<string, string>;
    data: ioBrokerObject<{ repositories: Repository }>;
    dataAux: ioBrokerObject<object, { activeRepo: string | string[] }>;
    multipleRepos: boolean;
    repoInfo: Repository;
    saving: boolean;
    onChange: (data: ioBrokerObject<{ repositories: Repository }>, dataAux?: ioBrokerObject<object, { activeRepo: string | string[] }>) => void;
    adminGuiConfig: AdminGuiConfig;
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

class RepositoriesDialog extends Component<RepositoriesDialogProps, RepositoriesDialogState> {
    constructor(props: RepositoriesDialogProps) {
        super(props);
        const repos = (typeof this.props.dataAux.common.activeRepo === 'string' ? [this.props.dataAux.common.activeRepo] : this.props.dataAux.common.activeRepo).filter(r => r);

        this.state = {
            error: !repos.length,
            confirm: false,
            confirmValue: null,
        };
    }

    onValueChanged(value: any, id: string, name: 'title' | 'link') {
        const newData = Utils.clone(this.props.data);
        const array = repoToArray(newData.native.repositories);
        const item = array.find(element => element.title === id);
        const oldTitle = item.title;
        item[name] = value;
        newData.native.repositories = arrayToRepo(array);

        let newConfig;
        if ((
            (typeof this.props.dataAux.common.activeRepo === 'string' && this.props.dataAux.common.activeRepo === id) ||
            (typeof this.props.dataAux.common.activeRepo !== 'string' && this.props.dataAux.common.activeRepo.includes(id))
        ) &&
            name === 'title'
        ) {
            newConfig = this.getUpdateDefaultRepo(value, newData, oldTitle, value);
        }

        this.props.onChange(newData, newConfig);
    }

    onDelete(id: string) {
        const newData = Utils.clone(this.props.data);
        const array = repoToArray(newData.native.repositories);
        const index = array.findIndex(element => element.title === id);
        delete array[index];
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

    onAdd = () => {
        const newData = Utils.clone(this.props.data);
        const array = repoToArray(newData.native.repositories);
        array.push({
            title: '__',
            link: '',
        });
        newData.native.repositories = arrayToRepo(array);
        this.props.onChange(newData);
    };

    onRestore = () => {
        const newData = Utils.clone(this.props.data);
        newData.native.repositories = {
            stable: {
                link: 'http://download.iobroker.net/sources-dist.json',
            },
            beta: {
                link: 'http://download.iobroker.net/sources-dist-latest.json',
            },
        };
        // Store old information if already read
        const oldStable = Object.keys(this.props.data.native.repositories).find(name => this.props.data.native.repositories[name].link === newData.native.repositories.stable.link);
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
        const oldBeta = Object.keys(this.props.data.native.repositories).find(name => this.props.data.native.repositories[name].link === newData.native.repositories.beta.link);
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

        const newConfig = Utils.clone(this.props.dataAux);
        if (!this.props.multipleRepos) {
            newConfig.common.activeRepo = 'stable';
            return newConfig;
        }
        newConfig.common.activeRepo = ['stable'];

        this.props.onChange(newData, newConfig);
        return null;
    };

    getUpdateDefaultRepo = (newRepo: string, newData?: ioBrokerObject<{ repositories: Repository }>, oldTitle?: string, newTitle?: string) => {
        const newConfig = Utils.clone(this.props.dataAux);
        if (!this.props.multipleRepos) {
            newConfig.common.activeRepo = newRepo;
            return newConfig;
        }
        newData = newData || Utils.clone(this.props.data);
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

    onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
        console.log(oldIndex, newIndex);
        const newData = Utils.clone(this.props.data);
        const items = repoToArray(newData.native.repositories);
        const item = items[oldIndex];
        items.splice(oldIndex, 1);
        items.splice(newIndex, 0, item);
        newData.native.repositories = arrayToRepo(items);

        const newConfig = Utils.clone(this.props.dataAux);

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

    onChangeActiveRepo(newData: ioBrokerObject<object, {activeRepo: string | string[]}>, error: boolean, showWarning: boolean) {
        if (showWarning) {
            this.setState({ confirm: true, confirmValue: { newData, error } });
        } else {
            this.setState({ error }, () => this.props.onChange(null, newData));
        }
    }

    renderConfirmDialog() {
        if (this.state.confirm) {
            return <ConfirmDialog
                text={this.props.t('confirm_change_repo')}
                onClose={result => {
                    const value = this.state.confirmValue;
                    this.setState({ confirm: false, confirmValue: null }, () => {
                        if (result) {
                            this.setState({ error: value.error }, () => this.props.onChange(null, value.newData));
                        }
                    });
                }}
            />;
        }
        return null;
    }

    renderSortableItem(item: RepositoryArray[0], index: number) {
        const result = <TableRow className="float_row">
            <TableCell className={UtilsCommon.clsx(this.props.classes.dragColumn, 'float_cell')} title={this.props.t('Drag and drop to reorder')}>
                <DragHandle />
            </TableCell>
            <TableCell className={UtilsCommon.clsx(this.props.classes.enableColumn, 'float_cell')}>
                {index + 1}
                {this.props.multipleRepos ? <Checkbox
                    disabled={this.props.adminGuiConfig.admin.settings.activeRepo === false || this.props.saving}
                    className={this.state.error ? this.props.classes.checkboxError : ''}
                    title={this.state.error ? I18n.t('At least one repo must be selected') : ''}
                    checked={typeof this.props.dataAux.common.activeRepo === 'string' ? this.props.dataAux.common.activeRepo === item.title : this.props.dataAux.common.activeRepo.includes(item.title)}
                    onChange={() => {
                        let showWarning = false;
                        const newData = Utils.clone(this.props.dataAux);
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

                        if (item.title.toLowerCase().startsWith('beta') && newData.common.activeRepo.find(r => r.toLowerCase().startsWith('stable'))) {
                            pos = newData.common.activeRepo.findIndex(r => r.toLowerCase().startsWith('stable'));
                            newData.common.activeRepo.splice(pos, 1);
                        } else if (item.title.toLowerCase().startsWith('stable') && newData.common.activeRepo.find(r => r.toLowerCase().startsWith('beta'))) {
                            pos = newData.common.activeRepo.findIndex(r => r.toLowerCase().startsWith('beta'));
                            newData.common.activeRepo.splice(pos, 1);
                        }

                        const _error = !newData.common.activeRepo.length;
                        this.onChangeActiveRepo(newData, _error, showWarning);
                    }}
                /> : null}
            </TableCell>
            <TableCell className={UtilsCommon.clsx(this.props.classes.stableColumn, 'float_cell')}>
                <Tooltip title={I18n.t('Flag will be automatically detected as repository will be read for the first time')}>
                    <span>
                        <Checkbox
                            disabled
                            checked={this.props.repoInfo[item.title]?.stable}
                            indeterminate={!this.props.repoInfo[item.title]}
                        />
                    </span>
                </Tooltip>
            </TableCell>
            <TableCell className={UtilsCommon.clsx(this.props.classes.nameRow, 'float_cell')}>
                <TextField
                    variant="standard"
                    disabled={this.props.saving}
                    value={item.title}
                    InputLabelProps={{ shrink: true }}
                    className={UtilsCommon.clsx(this.props.classes.input, 'xs-centered')}
                    onChange={evt => this.onValueChanged(evt.target.value, item.title, 'title')}
                    InputProps={{
                        readOnly: false,
                        endAdornment: item.title ? <InputAdornment position="end">
                            <IconButton
                                size="small"
                                onClick={() => this.onValueChanged('', item.title, 'title')}
                            >
                                <CloseIcon />
                            </IconButton>
                        </InputAdornment> : null,
                    }}
                />
            </TableCell>
            <TableCell className={UtilsCommon.clsx('grow_cell', 'float_cell')}>
                <TextField
                    disabled={this.props.saving}
                    variant="standard"
                    id={`default_${index}`}
                    value={item.link}
                    InputLabelProps={{ shrink: true }}
                    className={UtilsCommon.clsx(this.props.classes.input, 'xs-centered')}
                    onChange={evt => this.onValueChanged(evt.target.value, item.title, 'link')}
                    InputProps={{
                        readOnly: false,
                        endAdornment: item.link ? <InputAdornment position="end">
                            <IconButton
                                size="small"
                                onClick={() => this.onValueChanged('', item.title, 'link')}
                            >
                                <CloseIcon />
                            </IconButton>
                        </InputAdornment> : null,
                    }}
                />
            </TableCell>
            <TableCell className={UtilsCommon.clsx(this.props.classes.buttonColumn, 'float_cell')}>
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
        </TableRow>;

        return <SortableItem key={index} index={index} value={result} />;
    }

    renderSortableList(items: RepositoryArray) {
        const result = <Table className={this.props.classes.table}>
            <TableHead>
                <TableRow className="float_row">
                    <TableCell className={UtilsCommon.clsx(this.props.classes.dragColumn, 'float_cell')} />
                    <TableCell className={UtilsCommon.clsx(this.props.classes.enableColumn, 'float_cell')}>{this.props.multipleRepos ? I18n.t('Active') : ''}</TableCell>
                    <TableCell className={UtilsCommon.clsx(this.props.classes.stableColumn, 'float_cell')}>{I18n.t('Stable')}</TableCell>
                    <TableCell className={UtilsCommon.clsx(this.props.classes.nameRow, 'float_cell')}>
                        {this.props.t('name')}
                    </TableCell>
                    <TableCell className="grow_cell float_cell">
                        {this.props.t('link')}
                    </TableCell>
                    <TableCell className={UtilsCommon.clsx(this.props.classes.buttonColumn, 'float_cell')}> </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {items.map((item, index) =>
                    this.renderSortableItem(item, index))}
            </TableBody>
        </Table>;

        return <SortableList
            helperClass="draggable-item"
            useDragHandle
            lockAxis="y"
            onSortEnd={this.onSortEnd}
            value={result}
        />;
    }

    render() {
        const { classes } = this.props;
        const items = repoToArray(this.props.data.native.repositories);

        return <div className={classes.tabPanel}>
            {this.renderConfirmDialog()}
            <div className={classes.buttonPanel}>
                <Fab
                    size="small"
                    color="primary"
                    disabled={this.props.saving}
                    aria-label="add"
                    onClick={this.onAdd}
                    className={classes.fabButton}
                    title={this.props.t('Add new line to the repository list')}
                >
                    <AddIcon />
                </Fab>
                <Fab
                    size="small"
                    disabled={this.props.saving}
                    onClick={this.onRestore}
                    className={classes.fabButton}
                    title={this.props.t('Restore repository list to default')}
                >
                    <RestoreIcon />
                </Fab>
                <Paper variant="outlined" className={classes.descriptionPanel} />
            </div>
            <TableContainer>
                {this.renderSortableList(items)}
                {/* <SortableList
                    helperClass="draggable-item"
                    useDragHandle
                    lockAxis="y"
                    items={items}
                    onSortEnd={this.onSortEnd}
                    repoInfo={this.props.repoInfo}
                    repositories={this.props.data.native.repositories}
                    onDelete={this.onDelete}
                    disabled={this.props.saving}
                /> */}
            </TableContainer>
        </div>;
    }
}

export default withWidth()(withStyles(styles)(RepositoriesDialog));
