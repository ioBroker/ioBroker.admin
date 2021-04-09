import PropTypes from 'prop-types';
import { lighten, withStyles } from '@material-ui/core/styles';

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import ConfigGeneric from './ConfigGeneric';
import ConfigPanel from './ConfigPanel';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Typography } from '@material-ui/core';

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
    //   root: {
    //     paddingLeft: theme.spacing(2),
    //     paddingRight: theme.spacing(1),
    //   },
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
});

class ConfigTable extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ value: value });
    }

    itemTable(schema, data, idx) {
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
            schema={schema}
            systemConfig={this.state.systemConfig}
            customs={this.props.customs}
            onChange={(attr, valueChange) => {
                this.typingTimer && clearTimeout(this.typingTimer);
                const newObj = JSON.parse(JSON.stringify(this.state.value));
                newObj[idx][attr] = valueChange;
                this.setState({ value: newObj });
                this.typingTimer = setTimeout(value => {
                    this.typingTimer = null;
                    this.onChange(this.props.attr, value);
                }, 300, newObj);
            }}
            onError={(error, attr) => this.onError(error, attr)}
        />
    }


    EnhancedTableHead(props) {
        return (
            <TableHead>
                <TableRow>
                    {this.props.schema.items.map((headCell) => (
                        <TableCell
                            // width={headCell.width}
                            key={headCell.id}
                            align={headCell.numeric ? 'right' : 'left'}
                            padding={headCell.disablePadding ? 'none' : 'default'}
                        //   sortDirection={orderBy === headCell.id ? order : false}
                        >
                            <TableSortLabel
                                // active={headCell.filter}
                                disabled={!headCell.sort}
                            // direction={orderBy === headCell.id ? order : 'asc'}
                            // onClick={createSortHandler(headCell.id)}
                            >
                                {headCell.title}
                                {/* {orderBy === headCell.id ? (
                      <span className={classes.visuallyHidden}>
                        {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                      </span>
                    ) : null} */}
                            </TableSortLabel>
                        </TableCell>
                    ))}
                </TableRow>
            </TableHead>
        );
    }

    renderItem(error, disabled, defaultValue) {
        // eslint-disable-next-line

        if (!this.state.value) {
            return null;
        }
        const { classes, schema } = this.props;
        return <Paper className={classes.paper}>
        {/* <FormControl className={classes.fullWidth}> */}
        <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
        {this.getText(schema.label)}
        </Typography>
            {/* <InputLabel shrink>{this.getText(schema.label)}</InputLabel> */}
            <TableContainer>
                <Table
                    className={classes.table}
                    aria-labelledby="tableTitle"
                    size={'small'}
                    aria-label="enhanced table"
                >
                    {this.EnhancedTableHead()}
                    <TableBody>
                        {this.state.value.map((el, idx) => {
                            return <TableRow
                                hover
                                // onClick={(event) => handleClick(event, row.name)}
                                role="checkbox"
                                // aria-checked={isItemSelected}
                                tabIndex={-1}
                            // key={row.name}
                            // selected={isItemSelected}
                            >
                                {Object.keys(el).map(attr => {
                                    console.log(attr, this.props.schema.items.find(el => el.attr === attr))
                                    return <TableCell align="left">{this.itemTable({ items: { [attr]: this.props.schema.items.find(el => el.attr === attr) } }, el, idx)}</TableCell>
                                })}
                            </TableRow>
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            {schema.help ? <FormHelperText>{this.getText(schema.help)}</FormHelperText> : null}
        {/* </FormControl> */}
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