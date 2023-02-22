// RepositoriesDialog
import { Component} from 'react';
import clsx from 'clsx';
import { withStyles } from '@mui/styles';
import PropTypes from 'prop-types';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';

import Checkbox from '@mui/material/Checkbox';
import Fab from '@mui/material/Fab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/Menu';
import RestoreIcon from '@mui/icons-material/SettingsBackupRestore';

import I18n from '@iobroker/adapter-react-v5/i18n';
import ConfirmDialog from '@iobroker/adapter-react-v5/Dialogs/Confirm';
import withWidth from '@iobroker/adapter-react-v5/Components/withWidth';
import Utils from '../../Utils';

const styles = theme => ({
    tabPanel: {
        width: '100%',
        height: '100% ',
        overflow: 'auto',
        overflowX: 'hidden',
        padding: 15,
        //backgroundColor: blueGrey[ 50 ]
    },
    table: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
    },
    buttonPanel: {
        paddingBottom: 40,
        display: 'flex'
    },
    descriptionPanel: {
        width: '100%',
        backgroundColor: 'transparent',
        marginLeft: 40,
        border: 'none',
        display: 'flex',
        alignItems: 'center'
    },
    dragColumn: {
        width: 32
    },
    enableColumn: {
        width: 110
    },
    stableColumn: {
        width: 80
    },
    buttonColumn: {
        width: 80
    },
    nameRow: {
        width: 220
    },
    input: {
        width: '100%'
    },
    checkboxError: {
        '& span:first-child': {
            border: '2px solid #FF0000',
            borderRadius: 4
        }
    },
    fabButton: {
        marginRight: theme.spacing(1),
        width: 44,
    },
});

function repoToArray(repos) {
    return Utils.objectMap(repos, (repo, name) => ({
        title: name,
        link: repo.link,
    }));
}

function arrayToRepo(array) {
    let result = {};
    for (let k in array) {
        result[array[k].title] = { link: array[k].link };
    }

    return result;
}

const DragHandle = SortableHandle(({ t }) => <DragHandleIcon style={{ marginTop: 8, marginRight: 0, cursor: 'handle' }} />);

const SortableItem = SortableElement(({
  item,
  classes,
  _index,
  repositories,
  multipleRepos,
  adminGuiConfig,
  error,
  t,
  dataAux,
  onDelete,
  onValueChanged,
  onChangeActiveRepo,
  repoInfo,
}) => <TableRow className="float_row">
    <TableCell className={clsx(classes.dragColumn, 'float_cell')} title={t('Drag and drop to reorder')}>
        <DragHandle t={t} />
    </TableCell>
    <TableCell className={clsx(classes.enableColumn, 'float_cell')}>
        {_index + 1}
        {multipleRepos ? <Checkbox
            disabled={adminGuiConfig.admin.settings.activeRepo === false}
            className={error ? classes.checkboxError : ''}
            title={error ? I18n.t('At least one repo must be selected') : ''}
            checked={typeof dataAux.common.activeRepo === 'string' ? dataAux.common.activeRepo === item.title : dataAux.common.activeRepo.includes(item.title)}
            onChange={() => {
                let showWarning = false;
                let newData = JSON.parse(JSON.stringify(dataAux));
                if (typeof newData.common.activeRepo === 'string') {
                    newData.common.activeRepo = [newData.common.activeRepo];
                }
                let pos = newData.common.activeRepo.indexOf(item.title);
                if (pos === -1) {
                    newData.common.activeRepo.push(item.title);
                    // newData.common.activeRepo.sort();
                    // sort repos according to order of repos
                    const arr = repoToArray(repositories);
                    newData.common.activeRepo.sort((a, b) => {
                        const indexA = arr.findIndex(item => item.title === a);
                        const indexB = arr.findIndex(item => item.title === b);
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

                const error = !newData.common.activeRepo.length;
                onChangeActiveRepo(newData, error, showWarning);
            }}
        /> : null}
    </TableCell>
    <TableCell className={clsx(classes.stableColumn, 'float_cell')}>
        <Tooltip title={I18n.t('Flag will be automatically detected as repository will be read for the first time')}>
            <span>
                <Checkbox
                    disabled
                    checked={repoInfo[item.title]?.stable}
                    indeterminate={!repoInfo[item.title]}
                />
            </span>
        </Tooltip>
    </TableCell>
    <TableCell className={clsx(classes.nameRow, 'float_cell')}>
        <TextField
            variant="standard"
            value={item.title}
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: false }}
            className={clsx(classes.input, 'xs-centered')}
            onChange={evt => onValueChanged(evt.target.value, item.title, 'title')}
        />
    </TableCell>
    <TableCell className={clsx('grow_cell', 'float_cell')}>
        <TextField
            variant="standard"
            id={'default_' + _index}
            value={item.link}
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: false }}
            className={clsx(classes.input, 'xs-centered')}
            onChange={evt => onValueChanged(evt.target.value, item.title, 'link')}
        />
    </TableCell>
    <TableCell className={clsx(classes.buttonColumn, 'float_cell')}>
        <Fab
            size="small"
            color="secondary"
            aria-label="add"
            onClick={() => onDelete(item.title)}
        >
            <DeleteIcon />
        </Fab>
    </TableCell>
</TableRow>);

const SortableList = SortableContainer(({
    items,
    classes,
    multipleRepos,
    t,
    error,
    adminGuiConfig,
    dataAux,
    onDelete,
    onValueChanged,
    onChangeActiveRepo,
    repositories,
    repoInfo,
}) => {
    return <Table className={classes.table}>
        <TableHead>
            <TableRow className="float_row">
                <TableCell className={clsx(classes.dragColumn, 'float_cell')} />
                <TableCell className={clsx(classes.enableColumn, 'float_cell')}>{multipleRepos ? I18n.t('Active') : ''}</TableCell>
                <TableCell className={clsx(classes.stableColumn, 'float_cell')}>{I18n.t('Stable')}</TableCell>
                <TableCell className={clsx(classes.nameRow, 'float_cell')}>
                    {t('name')}
                </TableCell>
                <TableCell className="grow_cell float_cell">
                    {t('link')}
                </TableCell>
                <TableCell className={clsx(classes.buttonColumn, 'float_cell')}> </TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {items.map((item, index) =>
                <SortableItem
                    key={`item-${index}`}
                    index={index}
                    _index={index}
                    item={item}
                    t={t}
                    classes={classes}
                    multipleRepos={multipleRepos}
                    adminGuiConfig={adminGuiConfig}
                    error={error}
                    dataAux={dataAux}
                    repoInfo={repoInfo}
                    repositories={repositories}
                    onDelete={onDelete}
                    onValueChanged={onValueChanged}
                    onChangeActiveRepo={onChangeActiveRepo}
                />)}
        </TableBody>
    </Table>;
});

class RepositoriesDialog extends Component {
    constructor(props) {
        super(props);
        const repos = (typeof this.props.dataAux.common.activeRepo === 'string' ? [this.props.dataAux.common.activeRepo] : this.props.dataAux.common.activeRepo).filter(r => r);

        this.state = {
            error: !repos.length,
            confirm: false,
            confirmValue: null
        };
    }

    onValueChanged = (value, id, name) => {
        let newData = JSON.parse(JSON.stringify(this.props.data))
        let array = repoToArray(newData.native.repositories);
        const item = array.find(element => element.title === id);
        const oldTitle = item.title;
        item[name] = value;
        newData.native.repositories = arrayToRepo(array);

        let newConfig;
        if (((typeof this.props.dataAux.common.activeRepo === 'string' && this.props.dataAux.common.activeRepo === id) ||
                (typeof this.props.dataAux.common.activeRepo !== 'string' && this.props.dataAux.common.activeRepo.includes(id))) &&
            name === 'title') {
            newConfig = this.getUpdateDefaultRepo(value, newData, oldTitle, value);
        }

        this.props.onChange(newData, newConfig);
    };

    onDelete = id => {
        let newData = JSON.parse(JSON.stringify(this.props.data))
        let array = repoToArray(newData.native.repositories);
        let index = array.findIndex(element => element.title === id);
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
    };

    onAdd = () => {
        let newData = JSON.parse(JSON.stringify(this.props.data))
        let array = repoToArray(newData.native.repositories);
        array.push({
            title: '__',
            link: ''
        });
        newData.native.repositories = arrayToRepo(array);
        this.props.onChange(newData);
    };

    onRestore = () => {
        let newData = JSON.parse(JSON.stringify(this.props.data))
        newData.native.repositories = {
            stable: {
                link: 'http://download.iobroker.net/sources-dist.json',
            },
            beta: {
                link: 'http://download.iobroker.net/sources-dist-latest.json',
            }
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

        let newConfig = JSON.parse(JSON.stringify(this.props.dataAux));
        if (!this.props.multipleRepos) {
            newConfig.common.activeRepo = 'stable';
            return newConfig;
        } else {
            newConfig.common.activeRepo = ['stable'];
        }

        this.props.onChange(newData, newConfig);
    };

    getUpdateDefaultRepo = (newRepo, newData, oldTitle, newTitle) => {
        let newConfig = JSON.parse(JSON.stringify(this.props.dataAux));
        if (!this.props.multipleRepos) {
            newConfig.common.activeRepo = newRepo;
            return newConfig;
        } else {
            newData = newData || JSON.parse(JSON.stringify(this.props.data));
            if (oldTitle !== undefined) {
                const pos = newConfig.common.activeRepo.indexOf(oldTitle);
                if (pos !== -1) {
                    newConfig.common.activeRepo[pos] = newTitle;
                }
            }

            if (typeof newConfig.common.activeRepo === 'string' && newConfig.common.activeRepo) {
                newConfig.common.activeRepo = [newConfig.common.activeRepo];
            }
            newConfig.common.activeRepo = newConfig.common.activeRepo || [];
            if (!newConfig.common.activeRepo.includes(newRepo)) {
                // sort activeRepo anew
                const items = repoToArray(newData.native.repositories);
                newConfig.common.activeRepo.sort((a, b) => {
                    const indexA = items.findIndex(item => item.title === a);
                    const indexB = items.findIndex(item => item.title === b);
                    return indexA - indexB;
                });
            }

            return newConfig;
        }
    };

    onSortEnd = ({oldIndex, newIndex}) => {
        console.log(oldIndex, newIndex);
        let newData = JSON.parse(JSON.stringify(this.props.data))
        let items = repoToArray(newData.native.repositories);
        const item = items[oldIndex];
        items.splice(oldIndex, 1);
        items.splice(newIndex, 0, item);
        newData.native.repositories = arrayToRepo(items);

        let newConfig = JSON.parse(JSON.stringify(this.props.dataAux));

        if (typeof newConfig.common.activeRepo === 'string') {
            newConfig.common.activeRepo = [newConfig.common.activeRepo];
        }

        // sort activeRepo anew
        newConfig.common.activeRepo.sort((a, b) => {
            const indexA = items.findIndex(item => item.title === a);
            const indexB = items.findIndex(item => item.title === b);
            return indexA - indexB;
        });

        this.props.onChange(newData, newConfig);
    };

    onChangeActiveRepo = (newData, error, showWarning) => {
        if (showWarning) {
            this.setState({ confirm: true, confirmValue: {newData, error}});
        } else {
            this.setState({error}, () => this.props.onChange(null, newData));
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
                            this.setState({error: value.error}, () => this.props.onChange(null, value.newData));
                        }
                    });
                }}
            />;
        } else {
            return null;
        }
    }

    render() {
        const {classes} = this.props;
        const items = repoToArray(this.props.data.native.repositories);

        return <div className={classes.tabPanel}>
            {this.renderConfirmDialog()}
            <div className={classes.buttonPanel}>
                <Fab
                    size="small"
                    color="primary"
                    aria-label="add"
                    onClick={this.onAdd}
                    className={classes.fabButton}
                    title={this.props.t('Add new line to the repository list')}
                >
                    <AddIcon />
                </Fab>
                <Fab
                    size="small"
                    onClick={this.onRestore}
                    className={classes.fabButton}
                    title={this.props.t('Restore repository list to default')}
                >
                    <RestoreIcon />
                </Fab>
                <Paper variant="outlined" className={classes.descriptionPanel} />
            </div>
            <TableContainer>
                <SortableList
                    helperClass="draggable-item"
                    useDragHandle
                    lockAxis="y"
                    items={items}
                    onSortEnd={this.onSortEnd}
                    error={this.state.error}
                    classes={this.props.classes}
                    multipleRepos={this.props.multipleRepos}
                    t={this.props.t}
                    adminGuiConfig={this.props.adminGuiConfig}
                    dataAux={this.props.dataAux}
                    repoInfo={this.props.repoInfo}
                    repositories={this.props.data.native.repositories}
                    onDelete={this.onDelete}
                    onValueChanged={this.onValueChanged}
                    onChangeActiveRepo={this.onChangeActiveRepo}
                />
            </TableContainer>
        </div>;
    }
}

RepositoriesDialog.propTypes = {
    t: PropTypes.func,
    data: PropTypes.object,
    dataAux: PropTypes.object,
    multipleRepos: PropTypes.bool,
    repoInfo: PropTypes.object,
};

export default withWidth()(withStyles(styles)(RepositoriesDialog));
