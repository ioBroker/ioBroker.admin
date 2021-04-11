import PropTypes from 'prop-types';
import { lighten, withStyles } from '@material-ui/core/styles';

import FormHelperText from '@material-ui/core/FormHelperText';

import ConfigGeneric from './ConfigGeneric';
import ConfigPanel from './ConfigPanel';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Toolbar, Typography } from '@material-ui/core';

const styles = theme => {
    return ({
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
    })
};

class ConfigTable extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr) || [];
        this.setState({ value, orderBy: value.length ? Object.keys(value[0])[0] : '', order: 'asc' });
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
                this.typingTimer && clearTimeout(this.typingTimer);
                const newObj = JSON.parse(JSON.stringify(value));
                newObj[idx][attr] = valueChange;
                this.setState({ value: newObj });
                this.typingTimer = setTimeout(value => {
                    this.typingTimer = null;
                    this.onChange(this.props.attr, value);
                }, 300, newObj);
            }}
            onError={(error, attr) => this.onError(error, attr)}
        />;
    }

    descendingComparator(a, b, orderBy) {
        if (b[orderBy] < a[orderBy]) {
            return -1;
        } else
        if (b[orderBy] > a[orderBy]) {
            return 1;
        } else {
            return 0;
        }
    }

    getComparator(order, orderBy) {
        return order === 'desc'
            ? (a, b) => this.descendingComparator(a, b, orderBy)
            : (a, b) => -this.descendingComparator(a, b, orderBy);
    }

    handleRequestSort = (property) => {
        const { order, orderBy } = this.state;
        const isAsc = orderBy === property && order === 'asc';
        const newOrder = isAsc ? 'desc' : 'asc';
        const newValue = this.stableSort(newOrder, property);
        this.setState({ order: newOrder, orderBy: property, value: newValue }, () =>
            this.onChange(this.props.attr, newValue));
    }

    stableSort = (order, orderBy) => {
        const { value } = this.state;
        const comparator = this.getComparator(order, orderBy);
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
        const { schema } = this.props;
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
                        <TableSortLabel
                            active={orderBy === headCell.attr}
                            disabled={!headCell.sort}
                            direction={orderBy === headCell.attr ? order : 'asc'}
                            onClick={() => this.handleRequestSort(headCell.attr)}
                        >
                            {headCell.title}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>;
    }

    renderItem(error, disabled, defaultValue) {
        const { classes, schema } = this.props;
        const { value } = this.state;
        if (!value) {
            return null;
        }
        return <Paper className={classes.paper}>
            {schema.label ? <Toolbar
                variant="dense"
                className={classes.rootTool}
            >
                <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
                    {this.getText(schema.label)}
                </Typography>
            </Toolbar> : null}
            <TableContainer>
                <Table
                    className={classes.table}
                    aria-labelledby="tableTitle"
                    size="small"
                    aria-label="enhanced table"
                >
                    {this.enhancedTableHead()}
                    <TableBody>
                        {value.map((keys, idx) =>
                            <TableRow
                                hover
                                key={idx}
                            >
                                {Object.keys(keys).map(attr =>
                                    <TableCell key={attr + idx} align="left">
                                        {this.itemTable(attr, keys, idx)}
                                    </TableCell>
                                )}
                            </TableRow>)}
                    </TableBody>
                </Table>
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