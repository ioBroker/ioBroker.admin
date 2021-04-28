import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { AppBar, Box, Checkbox, LinearProgress, makeStyles, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, ThemeProvider, Typography } from '@material-ui/core';

import VisibilityIcon from '@material-ui/icons/Visibility';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';
import LibraryAddIcon from '@material-ui/icons/LibraryAdd';

import I18n from '@iobroker/adapter-react/i18n';

import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';
import Command from '../components/Command';

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
    { id: 'host', numeric: false, disablePadding: false, label: 'Host' },
    { id: 'description', numeric: false, disablePadding: false, label: 'Description' },
    { id: 'ignore', numeric: true, disablePadding: false, label: 'Ignore' },
];

function EnhancedTableHead(props) {
    const { numSelected, rowCount, onSelectAllClick } = props;
    const createSortHandler = (property) => (event) => {
        //   onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
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

const buildComment = (comment, t) => {
    if (!comment) {
        return 'new';
    }
    if (typeof comment === 'string') return comment;
    var text = '';
    if (comment.add) {
        text += t('new');
        if (typeof comment.add === 'object' && + comment.add.length !== undefined) {
            text += ': ';
            if (comment.add.length <= 5) {
                text += comment.add.join(', ');
            } else {
                text += t('%s devices', comment.add.length);
            }
        } else if (typeof comment.add === 'string' || typeof comment.add === 'number') {
            text += ': ';
            text += comment.add;
        }
    }
    if (comment.changed) {
        text += (text ? ', ' : '') + t('changed');
        if (typeof comment.changed === 'object' && + comment.changed.length !== undefined) {
            text += ': ';
            if (comment.changed.length <= 5) {
                text += comment.changed.join(', ');
            } else {
                text += t('%s devices', comment.changed.length);
            }
        } else if (typeof comment.changed === 'string' || typeof comment.changed === 'number') {
            text += ': ';
            text += comment.changed;
        }
    }
    if (comment.extended) {
        text += (text ? ', ' : '') + t('extended');
        if (typeof comment.extended === 'object' && + comment.extended.length !== undefined) {
            text += ': ';
            if (comment.extended.length <= 5) {
                text += comment.extended.join(', ');
            } else {
                text += t('%s devices', comment.extended.length);
            }
        } else if (typeof comment.extended === 'string' || typeof comment.extended === 'number') {
            text += ': ';
            text += comment.extended;
        }
    }
    if (comment.text) {
        text += (text ? ', ' : '') + comment.text;
    }
    return text;
}

const DiscoveryDialog = ({ themeType, themeName, socket, dateFormat, currentHost }) => {
    const classes = useStyles();

    const [open, setOpen] = useState(true);
    const [value, setValue] = useState(0);
    const [listMethods, setListMethods] = useState({});
    const [checkboxChecked, setCheckboxChecked] = useState({});
    const [disableScanner, setDisableScanner] = useState(false);
    const [discoveryData, setDiscoveryData] = useState({});

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {
        const resultList = await socket.sendTo('system.adapter.discovery.0', 'listMethods', null);
        let listChecked = {};
        Object.keys(resultList).forEach(key => {
            listChecked[key] = key !== 'serial'
        });
        setCheckboxChecked(listChecked);
        setListMethods(resultList);
    }, [socket]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {
        const dataDiscovery = await socket.getObject('system.discovery');
        console.log(dataDiscovery)
        dataDiscovery !== undefined && setDiscoveryData(dataDiscovery?.native);
    }, [socket]);

    const [devicesFound, setDevicesFound] = useState(0);
    const [devicesProgress, setDevicesProgress] = useState(0);
    const [instancesFound, setInstancesFound] = useState(0);
    const [scanRunning, setScanRunning] = useState(false);
    const [servicesProgress, setServicesProgress] = useState(0);
    const [selected, setSelected] = useState([]);
    const [selectedIgnore, setSelectedIgnore] = useState([]);

    const handlerInstal = (name, value) => {
        // console.log(33333, name, value)
        switch (name) {
            case 'discovery.0.devicesFound':
                return setDevicesFound(value.val);
            case 'discovery.0.devicesProgress':
                return setDevicesProgress(value.val);
            case 'discovery.0.instancesFound':
                return setInstancesFound(value.val);
            case 'discovery.0.scanRunning':
                return setScanRunning(value.val);
            case 'discovery.0.servicesProgress':
                return setServicesProgress(value.val);
            case 'system.discovery':
                return value !== undefined && setDiscoveryData(value?.native);
            default:
                return;
        }
    }

    useEffect(() => {
        socket.subscribeObject('system.discovery', handlerInstal);
        // socket.get
        socket.subscribeState('discovery.0.devicesFound', handlerInstal);
        socket.subscribeState('discovery.0.devicesProgress', handlerInstal);
        socket.subscribeState('discovery.0.instancesFound', handlerInstal);
        socket.subscribeState('discovery.0.scanRunning', handlerInstal);
        socket.subscribeState('discovery.0.servicesProgress', handlerInstal);
        return () => {
            socket.unsubscribeState('discovery.0.devicesFound', handlerInstal);
            socket.unsubscribeState('discovery.0.devicesProgress', handlerInstal);
            socket.unsubscribeState('discovery.0.instancesFound', handlerInstal);
            socket.unsubscribeState('discovery.0.scanRunning', handlerInstal);
            socket.unsubscribeState('discovery.0.servicesProgress', handlerInstal);

        }
    }, [socket]);

    const stepUp = () => setValue(value + 1);

    const stepDown = () => setValue(value - 1);

    const discoverScaner = async () => {
        setDisableScanner(true);
        let dataArray = Object.keys(checkboxChecked).filter(key => checkboxChecked[key]);
        const resultList = await socket.sendTo('system.adapter.discovery.0', 'browse', dataArray);
        setDisableScanner(false);
        if (resultList.error) {
            alert(resultList.error)
        } else {
            setValue(1);
        }
    }

    const onClose = () => {
        setOpen(false);
        if (node) {
            document.body.removeChild(node);
            node = null;
        }
    }

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = discoveryData?.newInstances?.map((n) => n._id);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const isSelected = (name, arr) => arr.indexOf(name) !== -1;

    const handleClick = (event, name, arr, func) => {
        const selectedIndex = arr.indexOf(name);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(arr, name);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(arr.slice(1));
        } else if (selectedIndex === arr.length - 1) {
            newSelected = newSelected.concat(arr.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                arr.slice(0, selectedIndex),
                arr.slice(selectedIndex + 1),
            );
        }

        func(newSelected);
    };
    const [installInstances, setInstallInstances] = useState([]);
    const [installProgress, setInstallProgress] = useState(false);
    const checkInstall = async () => {
        let checkArray = [];
        selected.forEach(async (id, idx) => {
            console.log(12, id)
            let obj = await socket.getObject(id.replace('system.adapter.', ''));
            console.log(222222, obj)
            if (obj) {
                checkArray.push(id);
            }
            if (idx === selected.length - 1) {
                setInstallInstances(checkArray);
                setInstallProgress(true);
            }
        })
    }

    const black = themeType === 'dark';
    console.log(discoveryData)
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
                    {disableScanner && <LinearProgress variant="determinate" value={devicesProgress >= 99 ? servicesProgress : devicesProgress} />}
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
                        {discoveryData?.lastScan && <div className={classes.descriptionHeaderText}>
                            Last scan on {Utils.formatDate(new Date(discoveryData.lastScan), dateFormat)}
                        </div>}
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

                        {scanRunning && <div>
                            {devicesProgress >= 99 ? `Lookup services - ${servicesProgress}%` : `Lookup devices - ${devicesProgress}%`}
                            {disableScanner && <LinearProgress variant="determinate" value={devicesProgress >= 99 ? servicesProgress : devicesProgress} />}
                            {devicesProgress >= 99 ? `${instancesFound} service(s) found` : `${devicesFound} device(s) found`}
                        </div>}

                    </TabPanel>
                    <TabPanel
                        className={classes.overflowAuto}
                        style={black ? { color: 'black' } : null}
                        value={value}
                        index={1}
                        classes={classes}
                        title={discoveryData?.lastScan ?
                            I18n.t('Create instances automatically - Last scan on %s', Utils.formatDate(new Date(discoveryData.lastScan), dateFormat))
                            : I18n.t('Create instances automatically')
                        }
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
                                        numSelected={selected.length}
                                        //   order={order}
                                        //   orderBy={orderBy}
                                        onSelectAllClick={handleSelectAllClick}
                                        //   onRequestSort={handleRequestSort}
                                        rowCount={discoveryData?.newInstances?.length || 0}
                                    />
                                    <TableBody>
                                        {discoveryData?.newInstances?.map(obj => (<TableRow
                                            hover
                                            //   onClick={(event) => handleClick(event, row.name)}
                                            role="checkbox"
                                            // tabIndex={-1}
                                            key={obj._id}
                                            selected={obj.comment?.advice}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={isSelected(obj._id, selected)}
                                                    onClick={(e) => handleClick(e, obj._id, selected, setSelected)}
                                                //   inputProps={{ 'aria-labelledby': labelId }}
                                                />
                                            </TableCell>
                                            <TableCell component="th" scope="row" padding="none">
                                                {obj._id.replace('system.adapter.', '')}
                                            </TableCell>
                                            <TableCell align="left">_</TableCell>
                                            <TableCell align="left">{buildComment(obj.comment, I18n.t)}</TableCell>
                                            <TableCell align="right" padding="checkbox">
                                                <Checkbox
                                                    checked={isSelected(obj._id, selectedIgnore)}
                                                    onClick={(e) => handleClick(e, obj._id, selectedIgnore, setSelectedIgnore)}
                                                />
                                            </TableCell>
                                        </TableRow>))}
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
                        {selected.map(el => <div
                            key={el}
                            // style={black ? { color: 'white' } : null}
                            className={classes.headerBlockDisplayItem}>
                            <div className={classes.width200}>{el.replace('system.adapter.', '')}</div>
                            <div>started</div>
                        </div>)}
                        {installProgress && <Command
                            noSpacing={true}
                            key={selected[0]}
                            ready={true}
                            currentHost={currentHost}
                            socket={socket}
                            t={I18n.t}
                            cmd={`${installInstances.find(installName => installName === selected[0]) ? 'upgrade' : 'install'} ${discoveryData?.newInstances?.find(obj => {
                                console.log(obj)
                                return obj._id === selected[0]
                            })?.common.name}`}
                            onFinished={(el) => console.log('finish', el)}
                            errorFunc={(el) => {
                                console.log('error', el)
                                // if (this.state.stopOnError) {
                                //     this.setState({ stoppedOnError: true, finished: true });
                                //     this.onAdapterFinished = null;
                                //     this.props.onSetCommandRunning(false);
                                // } else {
                                //     this.onAdapterFinished();
                                // }
                            }}
                        />}
                    </TabPanel>
                </div>
            </DialogContent >
            <DialogActions>
                {value > 0 && <Button
                    variant="contained"
                    autoFocus
                    disabled={value === 0}
                    onClick={stepDown}
                    color="primary">
                    <NavigateBeforeIcon />
                    {I18n.t('Back')}
                </Button>
                }
                {value === 0 && <Button
                    variant="contained"
                    autoFocus
                    disabled={disableScanner}
                    onClick={discoverScaner}
                    color="primary">
                    <SearchIcon />
                    {I18n.t('Discover')}
                </Button>}
                {value !== 2 && <Button
                    variant="contained"
                    autoFocus
                    disabled={!discoveryData || value === 2 || disableScanner || (value === 1 && !selected.length)}
                    onClick={() => {
                        stepUp();
                        checkInstall();
                    }}
                    color="primary">
                    {value === 1 ? <LibraryAddIcon /> : <NavigateNextIcon />}
                    {I18n.t(value === 1 ? 'Create instances' : 'Next')}
                </Button>}
                <Button
                    variant="contained"
                    autoFocus
                    onClick={onClose}
                    color="primary">
                    <CloseIcon />
                    {I18n.t(value === 2 ? 'Finish' : 'Close')}
                </Button>
            </DialogActions>
        </Dialog >
    </ThemeProvider >;
}

export const discoveryDialogFunc = (themeType, themeName, socket, dateFormat, currentHost) => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderDiscoveryModal';
        document.body.appendChild(node);
    }
    return ReactDOM.render(<DiscoveryDialog currentHost={currentHost} dateFormat={dateFormat} themeName={themeName} themeType={themeType} socket={socket} />, node);
}