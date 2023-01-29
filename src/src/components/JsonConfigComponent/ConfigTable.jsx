import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import { /*lighten,*/ withStyles } from '@mui/styles';
import clsx from 'clsx';

import FormHelperText from '@mui/material/FormHelperText';
import { IconButton, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, Toolbar, Tooltip, Typography } from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import UpIcon from '@mui/icons-material/ArrowUpward';
import DownIcon from '@mui/icons-material/ArrowDownward';
import IconFilterOn from '@mui/icons-material/FilterAlt';
import IconFilterOff from '@mui/icons-material/FilterAltOff';

import I18n from './wrapper/i18n';

import ConfigGeneric from './ConfigGeneric';
import ConfigPanel from './ConfigPanel';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    },
    root: {
        width: '100%',
    },
    paper: {
        width: '100%',
        marginBottom: theme.spacing(2),
        backgroundColor: `rgba(255, 255, 255, 0.1)`,
    },
    headerText: {
        width: '100%'
    },
    table: {
        minWidth: 750,
    },
    visuallyHidden: {
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: 1,
        margin: -1,
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        top: 20,
        width: 1,
    },
    addIcon: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    highlight:
        theme.palette.mode === 'light'
            ? {
                color: theme.palette.secondary.main,
                // backgroundColor: lighten(theme.palette.secondary.light, 0.85),
            }
            : {
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.secondary.dark,
            },
    title: {
        flex: '1 1 100%',
    },
    rootTool: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(1),
    },
    silver: {
        opacity: 0.2
    },
    flex: {
        display: 'flex',
        alignItems: 'baseline',
    },
    filteredOut: {
        padding: 10,
        display: 'flex',
        textAlign: 'center'
    },
    buttonEmpty: {
        width: 34,
        display: 'inline-block'
    },
    buttonCell: {
        whiteSpace: 'nowrap',
    }
});

function objectToArray(object, nameOfFirstAttr, nameOfSecondAttr) {
    nameOfFirstAttr  = nameOfFirstAttr || 'key';

    const array = [];
    Object.keys(object).forEach(key => {
        const item = {};
        item[nameOfFirstAttr] = key;

        if (nameOfSecondAttr) {
            item[nameOfSecondAttr] = object[key]
            array.push(item);
        } else {
            array.push(Object.assign(item, object[key]));
        }
    });

    return array;
}

function arrayToObject(array, nameOfFirstAttr, nameOfSecondAttr) {
    nameOfFirstAttr  = nameOfFirstAttr  || 'key';

    const object = {};

    array.forEach(row => {
        let key = row[nameOfFirstAttr];
        if (key === null || key === undefined) {
            key = '';
        }
        delete row[nameOfFirstAttr];

        if (nameOfSecondAttr) {
            object[key] = row[nameOfSecondAttr];
        } else {
            object[key] = row;
        }
    });

    return object;
}

class ConfigTable extends ConfigGeneric {
    constructor(props) {
        super(props)
        this.filterRefs = {};
        this.props.schema.items = this.props.schema.items || [];
        this.props.schema.items.forEach(el => {
            if (el.filter) {
                this.filterRefs[el.attr] = createRef();
            }
        });
    }

    async componentDidMount() {
        super.componentDidMount();
        let value = ConfigGeneric.getValue(this.props.data, this.props.attr) || [];

        // if the list is given as an object
        if (this.props.schema.objKeyName) {
            value = objectToArray(value, this.props.schema.objKeyName, this.props.schema.objValueName);
        }

        if (!Array.isArray(value)) {
            value = [];
        }

        this.setState({
            value,
            visibleValue: null,
            orderBy: /*this.props.schema.items.length ? this.props.schema.items[0].attr : */'',
            order: 'asc',
            iteration: 0,
            filterOn: [],
        });
    }

    componentWillUnmount() {
        this.typingTimer && clearTimeout(this.typingTimer)
        this.typingTimer = null;
        super.componentWillUnmount();
    }

    itemTable(attrItem, data, idx) {
        const { value } = this.state;
        const { schema } = this.props;
        const schemaForAttribute = schema.items && schema.items.find(el => el.attr === attrItem);

        if (!schemaForAttribute) {
            return null;
        }

        const schemaItem = {
            items: {
                [attrItem]: schemaForAttribute
            }
        };

        return <ConfigPanel
            index={idx + this.state.iteration}
            arrayIndex={idx}
            globalData={this.props.data}
            socket={this.props.socket}
            adapterName={this.props.adapterName}
            instance={this.props.instance}
            common={this.props.common}
            alive={this.props.alive}
            themeType={this.props.themeType}
            themeName={this.props.themeName}
            data={data}
            table
            custom
            schema={schemaItem}
            systemConfig={this.props.systemConfig}
            originalData={this.props.originalData}
            customs={this.props.customs}
            onChange={(attr, valueChange) => {
                const newObj = JSON.parse(JSON.stringify(value));
                newObj[idx][attr] = valueChange;
                this.setState({ value: newObj }, () =>
                    this.onChangeWrapper(newObj,true));
            }}
            onError={(error, attr) => this.onError(error, attr)}
        />;
    }

    static descendingComparator(a, b, orderBy) {
        if (b[orderBy] < a[orderBy]) {
            return -1;
        } else
            if (b[orderBy] > a[orderBy]) {
                return 1;
            } else {
                return 0;
            }
    }

    static getComparator(order, orderBy) {
        return order === 'desc'
            ? (a, b) =>  ConfigTable.descendingComparator(a, b, orderBy)
            : (a, b) => -ConfigTable.descendingComparator(a, b, orderBy);
    }

    handleRequestSort = (property, orderCheck = false) => {
        const { order, orderBy } = this.state;
        if (orderBy) {
            const isAsc = orderBy === property && order === 'asc';
            const newOrder = orderCheck ? order : (isAsc ? 'desc' : 'asc');
            const newValue = this.stableSort(newOrder, property);
            this.setState({ order: newOrder, orderBy: property, iteration: this.state.iteration + 10000 }, () =>
                this.applyFilter(false, newValue));
        }
    }

    stableSort = (order, orderBy) => {
        const { value } = this.state;
        const comparator = ConfigTable.getComparator(order, orderBy);
        const stabilizedThis = value.map((el, index) => [el, index]);

        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) {
                return order;
            } else {
                return a[1] - b[1];
            }
        });

        return stabilizedThis.map(el => el[0]);
    }

    enhancedTableHead(buttonsWidth, doAnyFilterSet) {
        const { schema, classes } = this.props;
        const { order, orderBy } = this.state;
        return <TableHead>
            <TableRow>
                {schema.items && schema.items.map((headCell, i) =>
                    <TableCell
                        style={{ width: typeof headCell.width === 'string' && headCell.width.endsWith('%') ? headCell.width : headCell.width }}
                        key={headCell.attr + '_' + i}
                        align="left"
                        sortDirection={orderBy === headCell.attr ? order : false}
                    >
                        <div className={classes.flex}>
                            {!i && !schema.noDelete ? <Tooltip title={doAnyFilterSet ? I18n.t('ra_Cannot add items with set filter') : I18n.t('ra_Add row')}>
                                <span>
                                    <IconButton size="small" color="primary" disabled={!!doAnyFilterSet && !this.props.schema.allowAddByFilter} onClick={this.onAdd}>
                                        <AddIcon />
                                    </IconButton>
                                </span>
                            </Tooltip> : null}
                            {headCell.sort && <TableSortLabel
                                active
                                className={clsx(orderBy !== headCell.attr && classes.silver)}
                                direction={orderBy === headCell.attr ? order : 'asc'}
                                onClick={() => this.handleRequestSort(headCell.attr)}
                            />}
                            {headCell.filter && this.state.filterOn.includes(headCell.attr) ?
                                <TextField
                                    variant="standard"
                                    ref={this.filterRefs[headCell.attr]}
                                    onChange={() => this.applyFilter()}
                                    title={I18n.t('ra_You can filter entries by entering here some text')}
                                    InputProps={{
                                        endAdornment: this.filterRefs[headCell.attr]?.current?.children[0]?.children[0]?.value && <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    this.filterRefs[headCell.attr].current.children[0].children[0].value = '';
                                                    this.applyFilter();
                                                }}
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        </InputAdornment>,
                                    }}
                                    fullWidth
                                    placeholder={this.getText(headCell.title)}
                                />
                                : <span className={this.props.classes.headerText}>{this.getText(headCell.title)}</span>}
                            { headCell.filter ? <IconButton
                                title={I18n.t('ra_Show/hide filter input')}
                                size="small"
                                onClick={() => {
                                    const filterOn = [...this.state.filterOn];
                                    const pos = this.state.filterOn.indexOf(headCell.attr);
                                    if (pos === -1) {
                                        filterOn.push(headCell.attr);
                                    } else {
                                        filterOn.splice(pos, 1);
                                    }
                                    this.setState({ filterOn }, () => {
                                        if (pos && this.filterRefs[headCell.attr].current.children[0].children[0].value) {
                                            this.filterRefs[headCell.attr].current.children[0].children[0].value = '';
                                            this.applyFilter();
                                        }
                                    });
                                }}
                            >{this.state.filterOn.includes(headCell.attr) ? <IconFilterOff /> : <IconFilterOn />}</IconButton> : null}
                        </div>
                    </TableCell>
                )}
                {!schema.noDelete && <TableCell style={{ paddingLeft: 20, paddingRight: 20, width: buttonsWidth, textAlign: 'right' }} padding="checkbox">
                    <IconButton disabled size="small">
                        <DeleteIcon />
                    </IconButton>
                </TableCell>}
            </TableRow>
        </TableHead>;
    }

    onDelete = index => () => {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        newValue.splice(index, 1);

        this.setState({ value: newValue, iteration: this.state.iteration + 10000 }, () =>
            this.applyFilter(false, null, () =>
                this.onChangeWrapper(newValue)));
    };

    onChangeWrapper = (newValue, updateVisible = false) => {
        this.typingTimer && clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout((value, updateVisible) => {
            this.typingTimer = null;

            if (this.props.schema.objKeyName) {
                const objValue = arrayToObject(JSON.parse(JSON.stringify(value)), this.props.schema.objKeyName, this.props.schema.objValueName);
                this.onChange(this.props.attr, objValue);
            } else {
                this.onChange(this.props.attr, value);
            }

            if (updateVisible) {
                this.applyFilter(false, value);
                this.handleRequestSort(this.state.orderBy, true);
            }
        }, 300, newValue, updateVisible);
    }

    onAdd = () => {
        const { schema } = this.props;
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const newItem = schema.items && schema.items.reduce((accumulator, currentValue) => {
            let defaultValue;
            if (currentValue.defaultFunc) {
                if (this.props.custom) {
                    defaultValue = currentValue.defaultFunc ? this.executeCustom(currentValue.defaultFunc, this.props.schema.default, this.props.data, this.props.instanceObj, newValue.length, this.props.data) : this.props.schema.default;
                } else {
                    defaultValue = currentValue.defaultFunc ? this.execute(currentValue.defaultFunc, this.props.schema.default, this.props.data, newValue.length, this.props.data) : this.props.schema.default;
                }
            } else {
                defaultValue = currentValue.default === undefined ? null : currentValue.default;
            }

            accumulator[currentValue.attr] = defaultValue;
            return accumulator;
        }, {});

        newValue.push(newItem);

        this.setState({ value: newValue }, () =>
            this.applyFilter(false, null, () =>
                this.onChangeWrapper(newValue)));
    }

    isAnyFilterSet() {
        return Object.keys(this.filterRefs).find(attr => this.filterRefs[attr].current?.children[0].children[0].value);
    }

    applyFilter = (clear, value, cb) => {
        value = value || this.state.value;
        let visibleValue = value.map((_, i) => i);
        Object.keys(this.filterRefs).forEach(attr => {
            let valueInputRef = this.filterRefs[attr].current?.children[0].children[0].value;
            if (!clear && valueInputRef) {
                valueInputRef = valueInputRef.toLowerCase();
                visibleValue = visibleValue.filter(idx => value[idx] && value[idx][attr] && value[idx][attr].toLowerCase().includes(valueInputRef));
            } else if (this.filterRefs[attr].current) {
                this.filterRefs[attr].current.children[0].children[0].value = '';
            }
        });

        if (visibleValue.length === value.length) {
            visibleValue = null;
        }

        if (visibleValue === null && this.state.visibleValue === null) {
            cb && cb();
            return;
        }

        if (JSON.stringify(visibleValue) !== JSON.stringify(this.state.visibleValue)) {
            this.setState({ visibleValue }, () => cb && cb());
        } else {
            cb && cb();
        }
    }

    onMoveUp(idx) {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const item = newValue[idx];
        newValue.splice(idx, 1);
        newValue.splice(idx - 1, 0, item);
        this.setState({ value: newValue, iteration: this.state.iteration + 10000 }, () =>
            this.applyFilter(false, null, () =>
                this.onChangeWrapper(newValue)));
    }

    onMoveDown(idx) {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const item = newValue[idx];
        newValue.splice(idx, 1);
        newValue.splice(idx + 1, 0, item);
        this.setState({ value: newValue, iteration: this.state.iteration + 10000 }, () =>
            this.applyFilter(false, null, () =>
                this.onChangeWrapper(newValue)));
    }

    renderItem(error, disabled, defaultValue) {
        const { classes, schema } = this.props;
        let { value, visibleValue } = this.state;

        if (!value) {
            return null;
        }

        visibleValue = visibleValue || value.map((_, i) => i);

        const doAnyFilterSet = this.isAnyFilterSet();

        return <Paper className={classes.paper}>
            <div className={classes.addIcon}>
                {schema.label ? <Toolbar
                    variant="dense"
                    className={classes.rootTool}
                >
                    <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
                        {this.getText(schema.label)}
                    </Typography>
                </Toolbar> : null}
            </div>
            <TableContainer>
                <Table className={classes.table} size="small">
                    {this.enhancedTableHead(!doAnyFilterSet && !this.state.orderBy ? 120 : 64, doAnyFilterSet)}
                    <TableBody>
                        {visibleValue.map((idx, i) =>
                            <TableRow
                                hover
                                key={`${idx}_${i}`}
                            >
                                {schema.items && schema.items.map(headCell =>
                                    <TableCell key={`${headCell.attr}_${idx}`} align="left">
                                        {this.itemTable(headCell.attr, value[idx], idx)}
                                    </TableCell>
                                )}
                                {!schema.noDelete && <TableCell align="left" className={classes.buttonCell}>
                                    {!doAnyFilterSet && !this.state.orderBy ? (i ? <Tooltip title={I18n.t('ra_Move up')}>
                                        <IconButton size="small" onClick={() => this.onMoveUp(idx)}>
                                            <UpIcon />
                                        </IconButton>
                                    </Tooltip> : <div className={classes.buttonEmpty}/>) : null}
                                    {!doAnyFilterSet && !this.state.orderBy ? (i < visibleValue.length - 1 ? <Tooltip title={I18n.t('ra_Move down')}>
                                        <IconButton size="small" onClick={() => this.onMoveDown(idx)}>
                                            <DownIcon />
                                        </IconButton>
                                    </Tooltip> : <div className={classes.buttonEmpty}/> ) : null}
                                    <Tooltip title={I18n.t('ra_Delete current row')}>
                                        <IconButton size="small" onClick={this.onDelete(idx)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>}
                            </TableRow>)}
                        {!schema.noDelete && visibleValue.length >= (schema.showSecondAddAt || 5) ?
                            <TableRow>
                                <TableCell colSpan={schema.items.length + 1}>
                                    <Tooltip title={doAnyFilterSet ? I18n.t('ra_Cannot add items with set filter') : I18n.t('ra_Add row')}>
                                        <span>
                                            <IconButton size="small" color="primary" disabled={!!doAnyFilterSet && !this.props.schema.allowAddByFilter} onClick={this.onAdd}>
                                                <AddIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </TableCell>
                            </TableRow> : null}
                    </TableBody>
                </Table>
                {!visibleValue.length && value.length ?
                    <div className={classes.filteredOut}>
                        <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
                            {I18n.t('ra_All items are filtered out')}
                            <IconButton
                                size="small"
                                onClick={e => this.applyFilter(true)}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Typography>
                    </div> : null}
            </TableContainer>
            {schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </Paper>;
    }
}

ConfigTable.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(ConfigTable);
