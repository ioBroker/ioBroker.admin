import PropTypes from 'prop-types';
import { lighten, withStyles } from '@material-ui/core/styles';

import FormHelperText from '@material-ui/core/FormHelperText';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import ConfigGeneric from './ConfigGeneric';
import ConfigPanel from './ConfigPanel';
import CloseIcon from '@material-ui/icons/Close';
import { IconButton, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, Toolbar, Tooltip, Typography } from '@material-ui/core';
import clsx from 'clsx';
import { createRef } from 'react';
import I18n from '@iobroker/adapter-react/i18n';

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
        const key = row[nameOfFirstAttr];
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

        this.setState({ value, visibleValue: value, orderBy: value.length ? Object.keys(value[0])[0] : '', order: 'asc' });
    }

    itemTable(attrItem, data, idx) {
        const { value, systemConfig, visibleValue } = this.state;
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
                const newVisibleValue = JSON.parse(JSON.stringify(visibleValue));
                newObj[idx][attr] = valueChange;
                newVisibleValue[idx][attr] = valueChange;
                this.setState({ value: newObj, visibleValue: newVisibleValue });
                this.onChangeWrapper(newObj,true);
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
            ? (a, b) => ConfigTable.descendingComparator(a, b, orderBy)
            : (a, b) => -ConfigTable.descendingComparator(a, b, orderBy);
    }

    handleRequestSort = (property, orderCheck = false) => {
        const { order, orderBy } = this.state;
        const isAsc = orderBy === property && order === 'asc';
        const newOrder = orderCheck ? order : isAsc ? 'desc' : 'asc';
        const newValue = this.stableSort(newOrder, property);
        this.setState({ order: newOrder, orderBy: property, visibleValue: newValue });
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

    enhancedTableHead() {
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
                                    onChange={(el) => this.onFilter()}
                                    InputProps={{
                                        endAdornment: (
                                            this.filterRefs[headCell.attr]?.current?.children[0]?.children[0]?.value && <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        this.filterRefs[headCell.attr].current.children[0].children[0].value = '';
                                                        this.onFilter()
                                                    }}
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }} fullWidth placeholder={headCell.title} />
                                : headCell.title}
                        </div>
                    </TableCell>
                ))}
                {!schema.noDelete && <TableCell style={{ paddingLeft: 20 }} padding="checkbox">
                    <IconButton disabled size="small">
                        <DeleteIcon />
                    </IconButton>
                </TableCell>}
            </TableRow>
        </TableHead>;
    }

    onDelete = index =>
        () => {
            const { value, orderBy } = this.state;
            const newObj = JSON.parse(JSON.stringify(value));
            newObj.splice(index, 1);
            this.setState({ value: newObj }, () => {
                this.onFilter(false, newObj);
                this.handleRequestSort(orderBy, true);
            });
            this.onChangeWrapper(newObj);
        };

    onChangeWrapper = (newValue, updateVisible = false) => {
        const { orderBy } = this.state;
        this.typingTimer && clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout(value => {
            this.typingTimer = null;

            if (this.props.schema.objKeyName) {
                const objValue = arrayToObject(value, this.props.schema.objKeyName, this.props.schema.objValueName);
                this.onChange(this.props.attr, objValue);
            } else {
                this.onChange(this.props.attr, value);
            }

            if (updateVisible) {
                this.onFilter(false, value);
                this.handleRequestSort(orderBy, true);
            }
        }, 300, newValue);
    }

    onAdd = () => {
        const { schema } = this.props;
        const { value, orderBy } = this.state;
        const newObj = JSON.parse(JSON.stringify(value));
        const newEl = schema.items.reduce((accumulator, currentValue) => {
            accumulator[currentValue.attr] = null;
            return accumulator;
        }, {});
        newObj.push(newEl);
        this.setState({ value: newObj }, () => {
            this.onFilter(false, newObj);
            this.handleRequestSort(orderBy, true);
        });
        this.onChangeWrapper(newObj);

    }

    onFilter = (clear = false, value = this.state.value) => {
        let newValue = JSON.parse(JSON.stringify(value));
        Object.keys(this.filterRefs).forEach(key => {
            const valueInputRef = this.filterRefs[key].current.children[0].children[0].value;
            if (!clear && valueInputRef) {
                newValue = newValue.filter(el => el[key]?.toLowerCase().includes(valueInputRef?.toLowerCase()));
            } else {
                this.filterRefs[key].current.children[0].children[0].value = '';
            }
        });
        this.setState({ visibleValue: newValue })
    }

    renderItem(error, disabled, defaultValue) {
        const { classes, schema } = this.props;
        const { value, visibleValue } = this.state;
        if (!value) {
            return null;
        }
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
                <Tooltip title={I18n.t('Add row')}>
                    <IconButton onClick={this.onAdd}>
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            </div>
            <TableContainer>
                <Table
                    className={classes.table}
                    aria-labelledby="tableTitle"
                    size="small"
                    aria-label="enhanced table"
                >
                    {this.enhancedTableHead()}
                    <TableBody>
                        {visibleValue.map((keys, idx) =>
                            <TableRow
                                hover
                                key={idx}
                            >
                                {Object.keys(keys).map(attr =>
                                    <TableCell key={attr + idx} align="left">
                                        {this.itemTable(attr, keys, idx)}
                                    </TableCell>
                                )}
                                {!schema.noDelete && <TableCell align="left">
                                    <Tooltip title={I18n.t('Remove current row')}>
                                        <IconButton size="small" onClick={this.onDelete(idx)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>}
                            </TableRow>)}
                    </TableBody>
                </Table>
                {!visibleValue.length &&
                    <div className={classes.filteredOut}>
                        <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
                            {I18n.t('All items are filtered out')}
                            <IconButton
                                size="small"
                                onClick={(e) => this.onFilter(true)}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Typography>
                    </div>}
            </TableContainer>
            {schema.help ? <FormHelperText>{this.getText(schema.help)}</FormHelperText> : null}
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