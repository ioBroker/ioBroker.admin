import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { Tooltip, AppBar, Avatar, Box, Checkbox, CircularProgress, LinearProgress, makeStyles, Paper, Step, StepLabel, Stepper, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, ThemeProvider, Typography, Select, MenuItem } from '@material-ui/core';

import VisibilityIcon from '@material-ui/icons/Visibility';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';
import LibraryAddIcon from '@material-ui/icons/LibraryAdd';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import ReportProblemIcon from '@material-ui/icons/ReportProblem';

import I18n from '@iobroker/adapter-react/i18n';
import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';

import Command from '../components/Command';
import { licenseDialogFunc } from './LicenseDialog';
import { GenereteInputsFunc } from './GenereteInputsModal';
import { useStateLocal } from '../helpers/hooks/useStateLocal';

let node = null;

const useStyles = makeStyles((theme) => ({
    root: {
        // backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
        borderRadius: 4,
        flexDirection: 'column'
    },
    paper: {
        maxWidth: 1000,
        width: '100%',
        maxHeight: 800,
        height: 'calc(100% - 32px)',

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
        padding: 5,
        fontSize: 16,
        display: 'flex',
        margin: 2,
        border: '1px solid #c0c0c045',
        borderRadius: 4,
        alignItems: 'center',
        transition: 'background .5s, color .5s'
    },
    activeBlock: {
        background: '#c0c0c021',
        border: '1px solid #4dabf5'
    },
    pointer: {
        cursor: 'pointer'
    },
    hover: {
        '&:hover': {
            background: '#c0c0c021',
        }
    },
    installSuccess: {
        opacity: 0.7,
        color: '#5ef05e'
    },
    installError: {
        opacity: 0.7,
        color: '#ffc14f'
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
    },
    wrapperSwitch: {
        display: 'flex',
        margin: 10
    },
    divSwitch: {
        display: 'flex',
        margin: 10,
        alignItems: 'center',
        fontSize: 10,
        marginLeft: 0,
        color: 'silver'
    },
    marginLeft: {
        marginLeft: 40
    },
    stepper: {
        padding: 0,
        background: 'inherit'
    },
    instanceIcon: {
        width: 30,
        height: 30,
        margin: 3
    },
    instanceId: {
        marginLeft: 10
    },
    instanceWrapper: {
        display: 'flex',
        alignItems: 'center'
    }
}));

const TabPanel = ({ classes, children, value, index, title, custom, boxHeight, black, ...props }) => {
    if (custom) {
        return <div
            {...props}
        >{value === index && children}</div>
    }
    if (value === index) {
        return <div {...props}>
            <AppBar position="static" color="default">
                <div style={!black ? { color: 'white' } : null} className={classes.headerBlock}>
                    {title}
                </div>
            </AppBar>
            <Box style={boxHeight ? { height: 'calc(100% - 45px)' } : null} p={3}>
                <Typography style={boxHeight ? { height: '100%' } : null} component="div">
                    {children}
                </Typography>
            </Box>
        </div>;
    }
    return null;
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

    return <TableHead>
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
                >
                    <TableSortLabel
                        onClick={createSortHandler(headCell.id)}
                    >
                        {headCell.label}

                    </TableSortLabel>
                </TableCell>
            ))}
        </TableRow>
    </TableHead>;
}

const buildComment = (comment, t) => {
    if (!comment) {
        return 'new';
    }
    if (typeof comment === 'string') {
        return comment;
    }
    let text = '';

    if (comment.add) {
        text += t('new');
        if (Array.isArray(comment.add) && comment.add.length) {
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
        if (Array.isArray(comment.changed === 'object') && comment.changed.length) {
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
        if (Array.isArray(comment.extended) && comment.extended.length) {
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

const DiscoveryDialog = ({ themeType, themeName, socket, dateFormat, currentHost, defaultLogLevel, repository, hosts }) => {
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
        dataDiscovery !== undefined && setDiscoveryData(dataDiscovery);
    }, [socket]);

    const [aliveHosts, setAliveHosts] = useState({});
    const [checkSelectHosts, setCheckSelectHosts] = useState(false);
    const [hostInstances, setHostInstances] = useState({});

    useEffect(() => {
        hosts.forEach(async ({ _id }) => {
            let aliveValue = await socket.getState(`${_id}.alive`);
            setAliveHosts(prev => ({ ...prev, [_id]: !aliveValue || aliveValue.val === null ? false : !!aliveValue.val }));
        });
        if (Object.keys(aliveHosts).filter(key => aliveHosts[key]).length > 1) {
            setCheckSelectHosts(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hosts, socket]);

    const [devicesFound, setDevicesFound] = useState(0);
    const [devicesProgress, setDevicesProgress] = useState(0);
    const [instancesFound, setInstancesFound] = useState(0);
    const [scanRunning, setScanRunning] = useState(false);
    const [servicesProgress, setServicesProgress] = useState(0);
    const [selected, setSelected] = useState([]);

    const handlerInstall = (name, value) => {
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
                return value !== undefined && setDiscoveryData(value);
            default:
                return;
        }
    };

    useEffect(() => {
        socket.subscribeObject('system.discovery', handlerInstall);
        // socket.get
        socket.subscribeState('discovery.0.devicesFound', handlerInstall);
        socket.subscribeState('discovery.0.devicesProgress', handlerInstall);
        socket.subscribeState('discovery.0.instancesFound', handlerInstall);
        socket.subscribeState('discovery.0.scanRunning', handlerInstall);
        socket.subscribeState('discovery.0.servicesProgress', handlerInstall);

        return () => {
            socket.unsubscribeState('discovery.0.devicesFound', handlerInstall);
            socket.unsubscribeState('discovery.0.devicesProgress', handlerInstall);
            socket.unsubscribeState('discovery.0.instancesFound', handlerInstall);
            socket.unsubscribeState('discovery.0.scanRunning', handlerInstall);
            socket.unsubscribeState('discovery.0.servicesProgress', handlerInstall);
        }
    }, [socket]);

    const stepUp = () => setValue(value + 1);

    const stepDown = () => setValue(value - 1);

    const extendObject = (id, data) => {
        socket.extendObject(id, data, error =>
            error && window.alert(error));
    };

    const discoverScanner = async () => {
        setDisableScanner(true);
        let dataArray = Object.keys(checkboxChecked).filter(key => checkboxChecked[key]);
        const resultList = await socket.sendTo('system.adapter.discovery.0', 'browse', dataArray);
        setDisableScanner(false);
        if (resultList.error) {
            window.alert(resultList.error)
        } else {
            setValue(1);
        }
    };

    const onClose = () => {
        setOpen(false);
        if (node) {
            document.body.removeChild(node);
            node = null;
        }
    };

    const handleSelectAllClick = event => {
        if (event.target.checked) {
            const newSelected = discoveryData?.native?.newInstances?.map(n => n._id);
            setSelected(newSelected);
            return;
        }
        setSelected([]);
    };

    const isSelected = (name, arr) => arr.includes(name);

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

    const checkLicenseAndInputs = (objName, cb) => {
        const obj = JSON.parse(JSON.stringify(discoveryData?.native?.newInstances.find(obj => obj._id === objName)));
        let license = true;
        if (obj && obj.comment && obj.comment.license && obj.comment.license !== 'MIT') {
            license = false;
            if (!obj.common.licenseUrl) {
                obj.common.licenseUrl = 'https://raw.githubusercontent.com/ioBroker/ioBroker.' + obj.common.name + '/master/LICENSE'
            }
            if (typeof obj.common.licenseUrl === 'object') {
                obj.common.licenseUrl = obj.common.licenseUrl[I18n.getLanguage()] || obj.common.licenseUrl.en;
            }
            if (obj.common.licenseUrl.indexOf('github.com') !== -1) {
                obj.common.licenseUrl = obj.common.licenseUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
            }
        }

        licenseDialogFunc(license, () => {
            if (obj.comment?.inputs) {
                GenereteInputsFunc(themeType, themeName, socket, obj, () => {
                    const index = selected.indexOf(obj._id) + 1;
                    setInstallStatus((status) => Object.assign({ ...status }, { [index]: 'error' }));
                    if (selected.length > index) {
                        checkLicenseAndInputs(selected[index], () => {
                            setCurrentInstall(index + 1);
                            setCmdName('install');
                            setInstallProgress(true);
                        });
                    } else {
                        setFinishInstall(true)
                    }
                }, (params) => {
                    setInstancesInputsParams(params);
                    cb();
                })
            } else {
                cb();
            }
        }, obj?.common?.licenseUrl);
    };

    const [installProgress, setInstallProgress] = useState(false);
    const [currentInstall, setCurrentInstall] = useState(1);
    const [installStatus, setInstallStatus] = useState({});
    const [cmdName, setCmdName] = useState('install');

    const resetStateBack = () => {
        setSelected([]);
        setInstallProgress(false);
        setFinishInstall(false);
        setCurrentInstall(1);
        setCmdName('install');
        setInstallStatus({});
    };

    const checkInstall = async () => {
        checkLicenseAndInputs(selected[0], () => {
            setCurrentInstall(1);
            setInstallProgress(true);
        });
    };

    const [suggested, setSuggested] = useStateLocal(true, 'discovery.suggested');
    const [showAll, setShowAll] = useStateLocal(true, 'discovery.showAll');

    const black = themeType === 'dark';

    const [instancesInputsParams, setInstancesInputsParams] = useState({});
    const steps = ['Select methods', 'Create instances', 'Installation process'];
    const [logs, setLogs] = useState({});
    const [finishInstall, setFinishInstall] = useState(false);
    const [selectLogsIndex, setSelectLogsIndex] = useState(1);

    return <ThemeProvider theme={theme(themeName)}>
        <Dialog
            onClose={onClose}
            open={open}
            classes={{ paper: classes.paper }}
        >
            <h2 className={classes.heading}>
                <VisibilityIcon style={{
                    color: 'rgb(77 171 245)',
                    fontSize: 36,
                    marginLeft: 25,
                    marginRight: 10
                }} />
                {I18n.t('Adapter configuration discover')}
            </h2>
            <Stepper className={classes.stepper} alternativeLabel activeStep={value}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{I18n.t(label)}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            <DialogContent className={clsx(classes.flex, classes.overflowHidden)} dividers>
                <div className={classes.root}>
                    {disableScanner && <LinearProgress variant="determinate" value={devicesProgress >= 99 ? servicesProgress : devicesProgress} />}
                    <TabPanel
                        className={classes.overflowAuto}
                        style={black ? { color: 'white' } : null}
                        value={value}
                        index={0}
                        black={black}
                        classes={classes}
                        title={I18n.t('Discover all possible devices')}
                    >
                        <div className={classes.headerText}>
                            {I18n.t(`Press "Discover" to find devices in your network (Turn off network firewalls/traffic analyze systems before!)
                            or "Next" to use devices from previous discovery process`)}
                        </div>
                        {discoveryData?.native?.lastScan && <div className={classes.descriptionHeaderText}>
                            {I18n.t('Last scan on %s', Utils.formatDate(new Date(discoveryData.native.lastScan), dateFormat))}
                        </div>}
                        <div
                            style={!black ? { color: 'white' } : null}
                            className={classes.headerBlock}>
                            {I18n.t('Use following methods:')}

                        </div>
                        {Object.keys(listMethods).map(key => <div key={key}><Checkbox
                            checked={checkboxChecked[key]}
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
                        value={value}
                        index={1}
                        classes={classes}
                        title={discoveryData?.native?.lastScan ?
                            I18n.t('Create instances automatically - Last scan on %s', Utils.formatDate(new Date(discoveryData.native.lastScan), dateFormat))
                            : I18n.t('Create instances automatically')
                        }
                    >
                        <div className={classes.wrapperSwitch}>
                            <div className={classes.divSwitch}>
                                <div style={!showAll ? { color: 'green' } : null}>{I18n.t('hide ignored')}</div>
                                <Switch
                                    checked={showAll}
                                    onChange={e => setShowAll(e.target.checked)}
                                    color="primary"
                                />
                                <div style={showAll ? { color: 'green' } : null}>{I18n.t('show ignored')}</div>
                            </div>
                            <div className={clsx(classes.divSwitch, classes.marginLeft)}>
                                <div style={!suggested ? { color: 'green' } : null}>{I18n.t('hide suggested')}</div>
                                <Switch
                                    checked={suggested}
                                    onChange={e => setSuggested(e.target.checked)}
                                    color="primary"
                                />
                                <div style={suggested ? { color: 'green' } : null}>{I18n.t('show suggested')}</div>
                            </div>
                        </div>
                        <Paper className={classes.paperTable}>
                            <TableContainer>
                                <Table
                                    className={classes.table}
                                    size="small"
                                >
                                    <EnhancedTableHead
                                        classes={classes}
                                        numSelected={selected.length}
                                        onSelectAllClick={handleSelectAllClick}
                                        rowCount={discoveryData?.native?.newInstances?.length || 0}
                                    />
                                    <TableBody>
                                        {discoveryData?.native?.newInstances?.filter(el => {
                                            if (!suggested) {
                                                return !el.comment?.advice;
                                            }
                                            if (!showAll) {
                                                return !el?.comment?.ack;
                                            }
                                            return true;
                                        }).map((obj, idx) => <TableRow
                                            hover
                                            role="checkbox"
                                            key={obj._id}
                                            selected={obj.comment?.advice}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={isSelected(obj._id, selected)}
                                                    onClick={e => handleClick(e, obj._id, selected, setSelected)}
                                                />
                                            </TableCell>
                                            <TableCell component="th" scope="row" padding="none">
                                                <div className={classes.instanceWrapper}>
                                                    <Avatar
                                                        variant="square"
                                                        alt={obj._id.replace('system.adapter.', '')}
                                                        src={repository[obj.common.name].icon}
                                                        className={classes.instanceIcon}
                                                    />
                                                    <div className={classes.instanceId}>
                                                        {obj._id.replace('system.adapter.', '')}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell align="left">{checkSelectHosts ?
                                                <Select
                                                    labelId="demo-simple-select-label"
                                                    id="demo-simple-select"
                                                    value={hostInstances[obj._id] || currentHost}
                                                    onChange={el => {
                                                        setHostInstances(Object.assign({ ...hostInstances }, { [obj._id]: el.target.value }));
                                                    }}
                                                >
                                                    {Object.keys(aliveHosts).map(name => <MenuItem key={name} value={name}>{name.replace('system.host.', '')}</MenuItem>)}
                                                </Select> :
                                                '_'}</TableCell>
                                            <TableCell align="left">{buildComment(obj.comment, I18n.t)}</TableCell>
                                            <TableCell align="right" padding="checkbox">
                                                <Checkbox
                                                    checked={!!obj?.comment?.ack}
                                                    onClick={e => {
                                                        const newInstances = JSON.parse(JSON.stringify(discoveryData?.native.newInstances));
                                                        newInstances[idx].comment = { ...newInstances[idx].comment, 'ack': !newInstances[idx].comment.ack };
                                                        extendObject('system.discovery', { native: { newInstances } });
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>)}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </TabPanel>
                    <TabPanel
                        className={classes.overflowAuto}
                        value={value}
                        index={2}
                        style={{ height: '100%' }}
                        boxHeight
                        classes={classes}
                        title={I18n.t('Install adapters')}
                    >
                        <div style={{ display: 'flex', height: '100%' }}>
                            <div>
                                {selected.map((el, idx) => <div
                                    key={el}
                                    onClick={finishInstall ? () => setSelectLogsIndex(idx) : null}
                                    className={clsx(classes.headerBlockDisplayItem,
                                        finishInstall && classes.pointer,
                                        finishInstall && classes.hover,
                                        finishInstall && selectLogsIndex === idx && classes.activeBlock)}>
                                    <div className={classes.width200}>
                                        <div className={classes.instanceWrapper}>
                                            <Avatar
                                                variant="square"
                                                alt={el.replace('system.adapter.', '')}
                                                src={repository[el.replace('system.adapter.', '').split('.')[0]].icon}
                                                className={classes.instanceIcon}
                                            />
                                            <div className={classes.instanceId}>
                                                {el.replace('system.adapter.', '')}
                                            </div>
                                        </div></div>
                                    {currentInstall === idx + 1 && !installStatus[idx + 1] && <CircularProgress size={20} />}
                                    {installStatus[idx + 1] === 'error' ? <ReportProblemIcon className={classes.installError} /> : installStatus[idx + 1] === 'success' ? <AssignmentTurnedInIcon className={classes.installSuccess} /> : null}
                                </div>)}
                            </div>
                            {currentInstall && (installProgress || finishInstall) && <div style={{ overflow: 'hidden', width: 'calc(100% - 260px)' }}>
                                <Command
                                    noSpacing
                                    key={`${currentInstall}-${cmdName}`}
                                    ready
                                    currentHost={currentHost}
                                    logsRead={finishInstall ? logs[selected[selectLogsIndex]] || ['scipped'] : null}
                                    showElement={!finishInstall}
                                    socket={socket}
                                    t={I18n.t}
                                    cmd={finishInstall ? '' : `${cmdName} ${selected[currentInstall - 1].replace('system.adapter.', '').split('.')[0]}`}
                                    onFinished={(_, logsSuccess) => {
                                        const initObj = {
                                            type: 'instance',
                                            protectedNative: [],
                                            encryptedNative: [],
                                            notifications: [],
                                            instanceObjects: [],
                                            objects: [],
                                        };

                                        let data = JSON.parse(JSON.stringify(discoveryData?.native.newInstances.find(obj =>
                                            obj._id === selected[currentInstall - 1])));
                                        delete data.comment;
                                        data = Object.assign(initObj, data);

                                        // set log level
                                        if (defaultLogLevel) {
                                            data.common.logLevel = defaultLogLevel;
                                        }
                                        data.common.logLevel = data.common.logLevel || 'info';

                                        extendObject(selected[currentInstall - 1], data);
                                        if (Object.keys(instancesInputsParams).length) {
                                            extendObject(selected[currentInstall - 1], instancesInputsParams);
                                            setInstancesInputsParams({});
                                        }
                                        if (checkSelectHosts && hostInstances[selected[currentInstall - 1]]) {
                                            extendObject(selected[currentInstall - 1], { common: { host: hostInstances[selected[currentInstall - 1]] } });
                                        }
                                        if (selected.length > currentInstall) {
                                            checkLicenseAndInputs(selected[currentInstall], () => {
                                                setCurrentInstall(currentInstall + 1);
                                                setCmdName('install');
                                            });
                                            setLogs({ ...logs, [selected[currentInstall - 1]]: logsSuccess });
                                            setInstallStatus(Object.assign({ ...installStatus }, { [currentInstall]: 'success' }));
                                        } else {
                                            setLogs({ ...logs, [selected[currentInstall - 1]]: logsSuccess });
                                            setInstallStatus(Object.assign({ ...installStatus }, { [currentInstall]: 'success' }));
                                            setSelectLogsIndex(currentInstall - 1);
                                            let dataDiscovery = JSON.parse(JSON.stringify(discoveryData));
                                            if (dataDiscovery) {
                                                dataDiscovery.native.newInstances = dataDiscovery.native.newInstances.filter(({ _id }) => {
                                                    const find = selected.find(el => el === _id);
                                                    if (!find) {
                                                        return true;
                                                    }
                                                    return installStatus[selected.indexOf(find) + 1] !== 'success';
                                                });
                                                socket.setObject('system.discovery', dataDiscovery);
                                            }
                                            setFinishInstall(true);
                                            window.alert(I18n.t('Finished'));
                                        }
                                    }}
                                    errorFunc={(el, logsError) => {
                                        if (el === 51 && cmdName === 'install') {
                                            return setCmdName('upload');
                                        }
                                        if (selected.length > currentInstall && cmdName === 'upload') {
                                            checkLicenseAndInputs(selected[currentInstall], () => {
                                                setCurrentInstall(currentInstall + 1);
                                            });
                                            setInstallStatus(Object.assign({ ...installStatus }, { [currentInstall]: 'error' }));
                                        } else {
                                            if (selected.length > currentInstall) {
                                                setInstallStatus(Object.assign({ ...installStatus }, { [currentInstall]: 'error' }));
                                                checkLicenseAndInputs(selected[currentInstall], () =>
                                                    setCurrentInstall(currentInstall + 1));
                                                setCmdName('install');
                                                setLogs({ ...logs, [selected[currentInstall - 1]]: logsError });
                                            } else {
                                                setInstallStatus(Object.assign({ ...installStatus }, { [currentInstall]: 'error' }));
                                                setLogs({ ...logs, [selected[currentInstall - 1]]: logsError });
                                                setFinishInstall(true);
                                                setSelectLogsIndex(currentInstall - 1);
                                                let dataDiscovery = JSON.parse(JSON.stringify(discoveryData));
                                                if (dataDiscovery) {
                                                    dataDiscovery.native.newInstances = dataDiscovery.native.newInstances.filter(({ _id }) => {
                                                        const find = selected.find(el => el === _id);
                                                        if (!find) {
                                                            return true;
                                                        }
                                                        return installStatus[selected.indexOf(find) + 1] !== 'success';
                                                    });
                                                    socket.setObject('system.discovery', dataDiscovery);
                                                }
                                            }
                                            window.alert(`error ${selected[currentInstall - 1]}`);
                                        }
                                    }}
                                />
                            </div>}
                        </div>
                    </TabPanel>
                </div>
            </DialogContent >
            <DialogActions>
                {value > 0 && value !== 4 && <Button
                    variant="contained"
                    autoFocus
                    disabled={value === 0}
                    onClick={() => {
                        if (value === 2) {
                            resetStateBack();
                        }
                        stepDown();
                    }}
                    color="default">
                    <NavigateBeforeIcon />
                    {I18n.t('Back')}
                </Button>
                }
                {value === 0 && <Button
                    variant="contained"
                    autoFocus
                    disabled={disableScanner}
                    onClick={discoverScanner}
                    color="primary">
                    <SearchIcon />
                    {I18n.t('Discover')}
                </Button>}
                {value !== 2 && value !== 4 &&
                    <Tooltip title={value === 0 ? I18n.t('Skip discovery process and go to install with last scan results') : ''}>
                        <Button
                            variant="contained"
                            autoFocus
                            disabled={!discoveryData || !discoveryData?.native?.lastScan || value === 2 || disableScanner || (value === 1 && !selected.length)}
                            onClick={() => {
                                stepUp();
                                if (value === 1) {
                                    checkInstall();
                                }
                            }}
                            color={value === 1 ? 'primary' : 'default'}>
                            {value === 1 ? <LibraryAddIcon /> : <NavigateNextIcon />}
                            {I18n.t(value === 1 ? 'Create instances' : 'Use last scan')}
                        </Button>
                    </Tooltip>
                }
                <Button
                    variant="contained"
                    autoFocus
                    onClick={() => {
                        onClose();
                    }}
                    color={value === 2 ? 'primary' : 'default'}>
                    <CloseIcon />
                    {I18n.t(value === 2 ? 'Finish' : 'Close')}
                </Button>
            </DialogActions>
        </Dialog>
    </ThemeProvider >;
}

export const discoveryDialogFunc = (themeType, themeName, socket, dateFormat, currentHost, defaultLogLevel, repository, hosts) => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderDiscoveryModal';
        document.body.appendChild(node);
    }
    return ReactDOM.render(<DiscoveryDialog hosts={hosts} repository={repository} currentHost={currentHost} defaultLogLevel={defaultLogLevel} dateFormat={dateFormat} themeName={themeName} themeType={themeType} socket={socket} />, node);
}