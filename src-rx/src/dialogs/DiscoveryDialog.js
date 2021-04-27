import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { AppBar, Box, Checkbox, LinearProgress, makeStyles, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, ThemeProvider, Typography } from '@material-ui/core';

import VisibilityIcon from '@material-ui/icons/Visibility';

import I18n from '@iobroker/adapter-react/i18n';

import theme from '@iobroker/adapter-react/Theme';



let node = null;

const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
        borderRadius: 4,
        flexDirection: 'column'
    },
    paper: {
        maxWidth: 1000,
        width: '100%'
    },
    flex: {
        display: 'flex',
    },
    overflowHidden: {
        overflow: 'hidden'
    },
    overflowAuto: {
        overflowY: 'auto'
    },
    pre: {
        overflow: 'auto',
        margin: 20,
        '& p': {
            fontSize: 18,
        }
    },
    blockInfo: {
        right: 20,
        top: 10,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        color: 'silver'
    },
    img: {
        marginLeft: 10,
        width: 45,
        height: 45,
        margin: 'auto 0',
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            zIndex: 2,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'url("img/no-image.png") 100% 100% no-repeat',
            backgroundSize: 'cover',
            backgroundColor: '#fff',
        }
    },
    message: {
        justifyContent: 'space-between',
        display: 'flex',
        width: '100%',
        alignItems: 'center'
    },
    column: {
        flexDirection: 'column'
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 15
    },
    descriptionHeaderText: {
        margin: '10px 0'
    },
    silver: {
        color: 'silver'
    },
    button: {
        paddingTop: 18,
        paddingBottom: 5,
        position: 'sticky',
        bottom: 0,
        background: 'white',
        zIndex: 3
    },
    terminal: {
        fontFamily: 'monospace',
        fontSize: 14,
        marginLeft: 20
    },
    img2: {
        width: 25,
        height: 25,
        marginRight: 10,
        margin: 'auto 0',
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            zIndex: 2,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'url("img/no-image.png") 100% 100% no-repeat',
            backgroundSize: 'cover',
            backgroundColor: '#fff',
        }
    },
    heading: {
        display: 'flex',
        alignItems: 'center'
    },
    headerBlock: {
        backgroundColor: '#272727',
        padding: 13,
        fontSize: 16
    },
    headerBlockDisplay: {
        backgroundColor: '#272727',
        padding: 13,
        fontSize: 16,
        display: 'flex'
    },
    headerBlockDisplayItem: {
        padding: 13,
        fontSize: 16,
        display: 'flex'
    },
    width200: {
        width: 200
    },
    table: {
        // '& *': {
        //     color: 'black'
        // }
    },
    paperTable: {
        width: '100%',
        marginBottom: theme.spacing(2),
    }
}));

const TabPanel = ({ classes, children, value, index, title, ...props }) => {
    return (
        <div
            {...props}
        >{value === index &&
            <>
                <AppBar position="static" color="default">
                    <div className={classes.headerBlock}>
                        {title}
                    </div>
                </AppBar>
                <Box p={3}>
                    <Typography component="div">{children}</Typography>
                </Box>
            </>
            }
        </div>
    );
}

const headCells = [
    { id: 'instance', numeric: false, disablePadding: true, label: 'Instance' },
    { id: 'host', numeric: true, disablePadding: false, label: 'Host' },
    { id: 'description', numeric: true, disablePadding: false, label: 'Description' },
    { id: 'ignore', numeric: false, disablePadding: false, label: 'Ignore' },
];

function EnhancedTableHead(props) {
    // const { classes } = props;
    const createSortHandler = (property) => (event) => {
        //   onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox
                        //   indeterminate={numSelected > 0 && numSelected < rowCount}
                        //   checked={rowCount > 0 && numSelected === rowCount}
                        //   onChange={onSelectAllClick}
                        inputProps={{ 'aria-label': 'select all desserts' }}
                    />
                </TableCell>
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'right' : 'left'}
                        padding={headCell.disablePadding ? 'none' : 'default'}
                    //   sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            // active={orderBy === headCell.id}
                            // direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
                        >
                            {headCell.label}
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

const DiscoveryDialog = ({ themeType, themeName, socket }) => {
    const classes = useStyles();

    const [open, setOpen] = useState(true);
    const [value, setValue] = useState(0);
    const [listMethods, setListMethods] = useState({});
    const [checkboxChecked, setCheckboxChecked] = useState({});
    const [disableScanner, setDisableScanner] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {
        const resultList = await socket.sendTo('system.adapter.discovery.0', 'listMethods', null);
        let listChecked = {};
        Object.keys(resultList).forEach(key => {
            listChecked[key] = key !== 'serial'
        });
        setCheckboxChecked(listChecked);
        setListMethods(resultList);
    }, [socket])

    const stepUp = () => setValue(value + 1);

    const stepDown = () => setValue(value - 1);

    const discoverScaner = async () => {
        setDisableScanner(true);
        let dataArray = Object.keys(checkboxChecked).filter(key=>checkboxChecked[key]);
        const resultList = await socket.sendTo('system.adapter.discovery.0', 'browse', dataArray);
        setDisableScanner(false);
        console.log(resultList)

    }

    const onClose = () => {
        setOpen(false);
        if (node) {
            document.body.removeChild(node);
            node = null;
        }
    }

    const black = themeType === 'dark';
    console.log(checkboxChecked)
    return <ThemeProvider theme={theme(themeName)}>
        <Dialog
            onClose={onClose}
            open={open}
            classes={{ paper: classes.paper }}
        >
            <h2 className={classes.heading}><VisibilityIcon style={{
                color: 'rgb(77 171 245)',
                fontSize: 36,
                marginLeft: 25,
                marginRight: 10
            }} />{I18n.t("Adapter configuration discover")}</h2>
            <DialogContent className={clsx(classes.flex, classes.overflowHidden)} dividers>
                <div className={classes.root}>
                {disableScanner && <LinearProgress />}
                    <TabPanel
                        className={classes.overflowAuto}
                        style={black ? { color: 'black' } : null}
                        value={value}
                        index={0}
                        classes={classes}
                        title={I18n.t('Discover all possible devices')}
                    >
                        <div className={classes.headerText}>
                            Press "Discover" to find devices in your network (Turn off network firewalls/traffic analyze systems before!)
                            or "Next" to use devices from previous discovery process
                        </div>
                        <div className={classes.descriptionHeaderText}>
                            Last scan on 2021-04-27 15:00:23
                        </div>
                        <div
                            style={black ? { color: 'white' } : null} className={classes.headerBlock}>
                            Use following methods:

                        </div>
                        {Object.keys(listMethods).map(key => <div key={key}><Checkbox
                            checked={checkboxChecked[key]}
                            style={black ? { color: '#436a93' } : null}
                            disabled={disableScanner}
                            onChange={(_, value) => {
                                const newCheckboxChecked = JSON.parse(JSON.stringify(checkboxChecked));
                                newCheckboxChecked[key] = value;
                                setCheckboxChecked(newCheckboxChecked)
                            }}
                        />{key}</div>)}
                    </TabPanel>
                    <TabPanel
                        className={classes.overflowAuto}
                        style={black ? { color: 'black' } : null}
                        value={value}
                        index={1}
                        classes={classes}
                        title={I18n.t('Create instances automatically - Last scan on 2021-04-27 16:03:10')}
                    >
                        <Paper className={classes.paperTable}>
                            <TableContainer>
                                <Table
                                    className={classes.table}
                                    aria-labelledby="tableTitle"
                                    size="small"
                                    aria-label="enhanced table"
                                >
                                    <EnhancedTableHead
                                        classes={classes}
                                    //   numSelected={selected.length}
                                    //   order={order}
                                    //   orderBy={orderBy}
                                    //   onSelectAllClick={handleSelectAllClick}
                                    //   onRequestSort={handleRequestSort}
                                    //   rowCount={rows.length}
                                    />
                                    <TableBody>
                                        <TableRow
                                            hover
                                            //   onClick={(event) => handleClick(event, row.name)}
                                            role="checkbox"
                                            //   aria-checked={isItemSelected}
                                            tabIndex={-1}
                                        //   key={row.name}
                                        //   selected={isItemSelected}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked
                                                //   inputProps={{ 'aria-labelledby': labelId }}
                                                />
                                            </TableCell>
                                            <TableCell component="th" scope="row" padding="none">
                                                ssss
                      </TableCell>
                                            <TableCell align="right">aaaa</TableCell>
                                            <TableCell align="right">ssss</TableCell>
                                            <TableCell align="center" padding="checkbox">
                                                <Checkbox

                                                //   inputProps={{ 'aria-labelledby': labelId }}
                                                />
                                            </TableCell>
                                        </TableRow>

                                        {/* {emptyRows > 0 && (
                <TableRow style={{ height: (dense ? 33 : 53) * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )} */}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </TabPanel>
                    <TabPanel
                        className={classes.overflowAuto}
                        style={black ? { color: 'black' } : null}
                        value={value}
                        index={2}
                        classes={classes}
                        title={I18n.t('Install adapters')}
                    >
                        <div
                            style={black ? { color: 'white' } : null}
                            className={classes.headerBlockDisplay}>
                            <div className={classes.width200}>Instance</div>
                            <div>Progress</div>
                        </div>
                        <div
                            // style={black ? { color: 'white' } : null}
                            className={classes.headerBlockDisplayItem}>
                            <div className={classes.width200}>flot.0</div>
                            <div>started</div>
                        </div>
                    </TabPanel>
                </div>
            </DialogContent >
            <DialogActions>
                <Button
                    variant="contained"
                    autoFocus
                    disabled={value === 0}
                    onClick={stepDown}
                    color="primary">
                    {I18n.t('Back')}
                </Button>
                {value === 0 && <Button
                    variant="contained"
                    autoFocus
                    disabled={disableScanner}
                    onClick={discoverScaner}
                    color="primary">
                    {I18n.t('Discover')}
                </Button>}
                {value !== 2 && <Button
                    variant="contained"
                    autoFocus
                    disabled={value === 2 || disableScanner}
                    onClick={stepUp}
                    color="primary">
                    {I18n.t(value === 1 ? 'Create instances' : 'Next')}
                </Button>}
                <Button
                    variant="contained"
                    autoFocus
                    onClick={onClose}
                    color="primary">
                    {I18n.t(value === 2 ? 'Finish' : 'Close')}
                </Button>
            </DialogActions>
        </Dialog >
    </ThemeProvider >;
}

export const discoveryDialogFunc = (themeType, themeName, socket) => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderDiscoveryModal';
        document.body.appendChild(node);
    }
    return ReactDOM.render(<DiscoveryDialog themeName={themeName} themeType={themeType} socket={socket} />, node);
}