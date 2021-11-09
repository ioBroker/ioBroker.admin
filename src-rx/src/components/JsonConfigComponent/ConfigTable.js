import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import { lighten, withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import FormHelperText from '@material-ui/core/FormHelperText';
import { IconButton, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, Toolbar, Tooltip, Typography } from '@material-ui/core';

import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import CloseIcon from '@material-ui/icons/Close';
import UpIcon from '@material-ui/icons/ArrowUpward';
import DownIcon from '@material-ui/icons/ArrowDownward';

import I18n from '@iobroker/adapter-react/i18n';

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
        theme.palette.type === 'light'
            ? {
                color: theme.palette.secondary.main,
                backgroundColor: lighten(theme.palette.secondary.light, 0.85),
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
        display: 'flex'
    },
    filteredOut: {
        padding: 10,
        display: 'flex',
        textAlign: 'center'
    },
    buttonEmpty: {
        width: 30,
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

        const visibleValue = value.map((_, i) => i);

        this.setState({ value, visibleValue, orderBy: /*this.props.schema.items.length ? this.props.schema.items[0].attr : */'', order: 'asc' });
    }

    componentWillUnmount() {
        this.typingTimer && clearTimeout(this.typingTimer)
        this.typingTimer = null;
        super.componentWillUnmount();
    }

    itemTable(attrItem, data, idx) {
        const { value, systemConfig } = this.state;
        const { schema } = this.props;
        const schemaFind = schema.items.find(el => el.attr === attrItem);

        if (!schemaFind) {
            return null;
        }

        const schemaItem = {
            items: {
                [attrItem]: schemaFind
            }
        };

        return <ConfigPanel
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
            systemConfig={systemConfig}
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
            this.setState({ order: newOrder, orderBy: property }, () =>
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

    enhancedTableHead(buttonsWidth) {
        const { schema, classes } = this.props;
        const { order, orderBy } = this.state;
        return <TableHead>
            <TableRow>
                {schema.items.map(headCell => (
                    <TableCell
                        style={{ width: typeof headCell.width === 'string' && headCell.width.endsWith('%') ? 'auto' : headCell.width }}
                        key={headCell.attr}
                        align="left"
                        sortDirection={orderBy === headCell.attr ? order : false}
                    >
                        <div className={classes.flex}>
                            {headCell.sort && <TableSortLabel
                                active
                                className={clsx(orderBy !== headCell.attr && classes.silver)}
                                direction={orderBy === headCell.attr ? order : 'asc'}
                                onClick={() => this.handleRequestSort(headCell.attr)}
                            />}
                            {headCell.filter ?
                                <TextField
                                    ref={this.filterRefs[headCell.attr]}
                                    onChange={el => this.applyFilter()}
                                    InputProps={{
                                        endAdornment: (
                                            this.filterRefs[headCell.attr]?.current?.children[0]?.children[0]?.value && <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        this.filterRefs[headCell.attr].current.children[0].children[0].value = '';
                                                        this.applyFilter();
                                                    }}
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }} fullWidth placeholder={this.getText(headCell.title)} />
                                : this.getText(headCell.title)}
                        </div>
                    </TableCell>
                ))}
                {!schema.noDelete && <TableCell style={{ paddingLeft: 20, width: buttonsWidth }} padding="checkbox">
                    <IconButton disabled size="small">
                        <DeleteIcon />
                    </IconButton>
                </TableCell>}
            </TableRow>
        </TableHead>;
    }

    onDelete = index =>
        () => {
            const newValue = JSON.parse(JSON.stringify(this.state.value));
            let visibleValue = JSON.parse(JSON.stringify(this.state.visibleValue));
            newValue.splice(index, 1);
            const pos = visibleValue.indexOf(index);
            if (pos !== -1) {
                visibleValue.splice(pos, 1);
                visibleValue = visibleValue.map(i => i > index ? i - 1 : i);
            }

            this.setState({ value: newValue, visibleValue }, () =>
                this.onChangeWrapper(newValue));
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
        const visibleValue = JSON.parse(JSON.stringify(this.state.visibleValue));

        const newItem = schema.items.reduce((accumulator, currentValue) => {
            accumulator[currentValue.attr] = currentValue.default === undefined ? null : currentValue.default;
            return accumulator;
        }, {});

        newValue.push(newItem);
        visibleValue.push(newValue.length - 1);

        this.setState({ value: newValue, visibleValue }, () =>
            this.onChangeWrapper(newValue));
    }

    isAnyFilterSet() {
        return Object.keys(this.filterRefs).find(attr => this.filterRefs[attr].current?.children[0].children[0].value);
    }

    applyFilter = (clear = false, value = this.state.value) => {
        let visibleValue = value.map((_, i) => i);
        Object.keys(this.filterRefs).forEach(attr => {
            let valueInputRef = this.filterRefs[attr].current.children[0].children[0].value;
            if (!clear && valueInputRef) {
                valueInputRef = valueInputRef.toLowerCase();
                visibleValue = visibleValue.filter(idx => value[idx] && value[idx][attr] && value[idx][attr].toLowerCase().includes(valueInputRef));
            } else {
                this.filterRefs[attr].current.children[0].children[0].value = '';
            }
        });

        if (JSON.stringify(visibleValue) !== JSON.stringify(this.state.visibleValue)) {
            this.setState({ visibleValue });
        }
    }

    onMoveUp(idx) {
        const value = JSON.parse(JSON.stringify(this.state.value));
        const item = value[idx];
        value.splice(idx, 1);
        value.splice(idx - 1, 0, item);
        this.setState({ value }, () =>
            this.onChangeWrapper(value));
    }

    onMoveDown(idx) {
        const value = JSON.parse(JSON.stringify(this.state.value));
        const item = value[idx];
        value.splice(idx, 1);
        value.splice(idx + 1, 0, item);
        this.setState({ value }, () =>
            this.onChangeWrapper(value));
    }

    renderItem(error, disabled, defaultValue) {
        const { classes, schema } = this.props;
        const { value, visibleValue } = this.state;

        if (!value) {
            return null;
        }

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
                {!schema.noDelete && !doAnyFilterSet ? <Tooltip title={I18n.t('Add row')}>
                    <IconButton onClick={this.onAdd}>
                        <AddIcon />
                    </IconButton>
                </Tooltip> : null}
            </div>
            <TableContainer>
                <Table className={classes.table} size="small">
                    {this.enhancedTableHead(!doAnyFilterSet && !this.state.orderBy ? 120 : 64)}
                    <TableBody>
                        {visibleValue.map((idx, i) =>
                            <TableRow
                                hover
                                key={idx}
                            >
                                {schema.items.map(headCell =>
                                    <TableCell key={headCell.attr + idx} align="left">
                                        {this.itemTable(headCell.attr, value[idx], idx)}
                                    </TableCell>
                                )}
                                {!schema.noDelete && <TableCell align="left" className={classes.buttonCell}>
                                    {!doAnyFilterSet && !this.state.orderBy ? (i ? <Tooltip title={I18n.t('Move up')}>
                                        <IconButton size="small" onClick={() => this.onMoveUp(idx)}>
                                            <UpIcon />
                                        </IconButton>
                                    </Tooltip> : <div className={classes.buttonEmpty}/> ) : null}
                                    {!doAnyFilterSet && !this.state.orderBy ? (i < visibleValue.length - 1 ? <Tooltip title={I18n.t('Move down')}>
                                        <IconButton size="small" onClick={() => this.onMoveDown(idx)}>
                                            <DownIcon />
                                        </IconButton>
                                    </Tooltip> : <div className={classes.buttonEmpty}/> ) : null}
                                    <Tooltip title={I18n.t('Delete current row')}>
                                        <IconButton size="small" onClick={this.onDelete(idx)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>}
                            </TableRow>)}
                    </TableBody>
                </Table>
                {!visibleValue.length && value.length ?
                    <div className={classes.filteredOut}>
                        <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
                            {I18n.t('All items are filtered out')}
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
