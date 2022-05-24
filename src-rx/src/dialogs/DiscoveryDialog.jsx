import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Tooltip, AppBar, Avatar, Box, Checkbox, CircularProgress, LinearProgress, Paper, Step, StepLabel, Stepper, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Typography, } from '@mui/material';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

import VisibilityIcon from '@mui/icons-material/Visibility';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

import I18n from '@iobroker/adapter-react-v5/i18n';
import theme from '@iobroker/adapter-react-v5/Theme';
import Utils from '@iobroker/adapter-react-v5/Components/Utils';

import Command from '../components/Command';
import SelectWithIcon from '@iobroker/adapter-react-v5/Components/SelectWithIcon';
import { licenseDialogFunc } from './LicenseDialog';
import { GenerateInputsFunc } from './GenereteInputsModal';
import { useStateLocal } from '../helpers/hooks/useStateLocal';

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
        margin: 10,
        marginTop: 0
    },
    divSwitch: {
        display: 'flex',
        // margin: 10,
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
    const createSortHandler = property => event => {
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
                    padding={headCell.disablePadding ? 'none' : 'normal'}
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

const DiscoveryDialog = ({ themeType, themeName, socket, dateFormat, currentHost, defaultLogLevel, repository, hosts, onClose }) => {
    const classes = useStyles();

    const [step, setStep] = useState(0);
    const [listMethods, setListMethods] = useState({});
    const [checkboxChecked, setCheckboxChecked] = useState({});
    const [disableScanner, setDisableScanner] = useState(false);
    const [discoveryData, setDiscoveryData] = useState({});

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {
        const resultList = await socket.sendTo('system.adapter.discovery.0', 'listMethods', null);
        let listChecked = {};
        let lastSelection = window.localStorage.getItem('App.discoveryLastSelection') || null;
        if (lastSelection) {
            try {
                lastSelection = JSON.parse(lastSelection);
            } catch (e) {
                lastSelection = null;
            }
        }

        Object.keys(resultList).forEach(key => {
            if (lastSelection) {
                listChecked[key] = lastSelection[key];
            } else {
                listChecked[key] = key !== 'serial';
            }
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
        if (!value) {
            return;
        }
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
                return setDiscoveryData(value);
            default:
                return;
        }
    };

    useEffect(() => {
        socket.subscribeObject('system.discovery', handlerInstall);
        socket.subscribeState('discovery.0.devicesFound', handlerInstall);
        socket.subscribeState('discovery.0.devicesProgress', handlerInstall);
        socket.subscribeState('discovery.0.instancesFound', handlerInstall);
        socket.subscribeState('discovery.0.scanRunning', handlerInstall);
        socket.subscribeState('discovery.0.servicesProgress', handlerInstall);

        return () => {
            socket.unsubscribeObject('system.discovery', handlerInstall);
            socket.unsubscribeState('discovery.0.devicesFound', handlerInstall);
            socket.unsubscribeState('discovery.0.devicesProgress', handlerInstall);
            socket.unsubscribeState('discovery.0.instancesFound', handlerInstall);
            socket.unsubscribeState('discovery.0.scanRunning', handlerInstall);
            socket.unsubscribeState('discovery.0.servicesProgress', handlerInstall);
        }
    }, [socket]);

    const stepUp = () => setStep(step + 1);

    const stepDown = () => setStep(step - 1);

    const extendObject = (id, data) =>
        socket.extendObject(id, data)
            .catch(error => window.alert(error));

    const discoverScanner = async () => {
        setDisableScanner(true);
        let dataArray = Object.keys(checkboxChecked).filter(key => checkboxChecked[key]);
        const resultList = await socket.sendTo('system.adapter.discovery.0', 'browse', dataArray);
        setDisableScanner(false);
        if (resultList.error) {
            window.alert(resultList.error)
        } else {
            setStep(1);
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
            if (obj.common.licenseUrl.includes('github.com')) {
                obj.common.licenseUrl = obj.common.licenseUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
            }
        }

        licenseDialogFunc(license, result => {
            if (!result) {
                // license not accepted, go to the next instance
                const index = selected.indexOf(obj._id) + 1;
                setInstallStatus(status => Object.assign({ ...status }, { [index]: 'error' }));

                setLogs((logsEl) => Object.assign({ ...logsEl }, { [selected[index - 1]]: [I18n.t('Error: license not accepted')] }));

                if (selected.length > index) {
                    setTimeout(() =>
                        checkLicenseAndInputs(selected[index], () => {
                            setCurrentInstall(index + 1);
                            setCmdName('install');
                            setInstallProgress(true);
                        })
                        , 100);
                } else {
                    setFinishInstall(true);
                }
            } else
                if (obj.comment?.inputs) {
                    GenerateInputsFunc(themeType, themeName, socket, obj, () => {
                        const index = selected.indexOf(obj._id) + 1;
                        setInstallStatus(status => Object.assign({ ...status }, { [index]: 'error' }));

                        setLogs(logsEl => Object.assign({ ...logsEl }, { [selected[index - 1]]: [I18n.t('Error: configuration dialog canceled')] }));

                        if (selected.length > index) {
                            setTimeout(() =>
                                checkLicenseAndInputs(selected[index], () => {
                                    setCurrentInstall(index + 1);
                                    setCmdName('install');
                                    setInstallProgress(true);
                                })
                                , 100);
                        } else {
                            setFinishInstall(true);
                        }
                    }, params => {
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

    const checkInstall = () => {
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
            onClose={(event, reason) => {
                if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                    onClose();
                }
            }}
            open={true}
            disableBackdropClick
            disableEscapeKeyDown
            classes={{ paper: classes.paper }}
        >
            <h2 className={classes.heading}>
                <VisibilityIcon style={{
                    color: 'rgb(77 171 245)',
                    fontSize: 36,
                    marginLeft: 25,
                    marginRight: 10
                }} />
                {I18n.t('Find devices and services')}
            </h2>
            <Stepper className={classes.stepper} alternativeLabel activeStep={step}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{I18n.t(label)}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            <DialogContent className={clsx(classes.flex, classes.overflowHidden)} dividers>
                <div className={classes.root}>
                    <TabPanel
                        className={classes.overflowAuto}
                        style={black ? { color: 'white' } : null}
                        value={step}
                        index={0}
                        black={black}
                        classes={classes}
                        title={I18n.t('Discover all possible devices')}
                    >
                        {!disableScanner ? <> <div className={classes.headerText}>
                            {I18n.t(`press_discover`)}
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
                                    window.localStorage.setItem('App.discoveryLastSelection', JSON.stringify(newCheckboxChecked));
                                    setCheckboxChecked(newCheckboxChecked)
                                }}
                            />{key}</div>)}</>
                            : (scanRunning && <div>
                                {devicesProgress >= 99 ? `Lookup services - ${servicesProgress}%` : `Lookup devices - ${devicesProgress}%`}
                                {disableScanner && <LinearProgress variant="determinate" value={devicesProgress >= 99 ? servicesProgress : devicesProgress} />}
                                {devicesProgress >= 99 ? `${instancesFound} service(s) found` : `${devicesFound} device(s) found`}
                            </div>)
                        }
                    </TabPanel>
                    <TabPanel
                        className={classes.overflowAuto}
                        value={step}
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
                                                        src={repository[obj.common.name]?.icon}
                                                        className={classes.instanceIcon}
                                                    />
                                                    <div className={classes.instanceId}>
                                                        {obj._id.replace('system.adapter.', '')}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell align="left">{checkSelectHosts ?
                                                <SelectWithIcon
                                                    fullWidth
                                                    lang={I18n.getLanguage()}
                                                    list={hosts}
                                                    t={I18n.t}
                                                    value={hostInstances[obj._id] || currentHost}
                                                    themeType={themeType}
                                                    onChange={val =>
                                                        setHostInstances(Object.assign({ ...hostInstances }, { [obj._id]: val }))}
                                                />
                                                :
                                                '_'}</TableCell>
                                            <TableCell align="left">{buildComment(obj.comment, I18n.t)}</TableCell>
                                            <TableCell align="right" padding="checkbox">
                                                <Checkbox
                                                    checked={!!obj?.comment?.ack}
                                                    onClick={e => {
                                                        const newInstances = JSON.parse(JSON.stringify(discoveryData?.native.newInstances));
                                                        newInstances[idx].comment = { ...newInstances[idx].comment, ack: !newInstances[idx].comment.ack };
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
                        value={step}
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
                                                src={repository[el.replace('system.adapter.', '').split('.')[0]]?.icon}
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
                                    logsRead={finishInstall ? logs[selected[selectLogsIndex]] || ['skipped'] : null}
                                    showElement={!finishInstall}
                                    socket={socket}
                                    t={I18n.t}
                                    cmd={finishInstall ? '' : `${cmdName} ${selected[currentInstall - 1].replace('system.adapter.', '').split('.')[0]}`}
                                    onFinished={(_, logsSuccess) => {
                                        let data = JSON.parse(JSON.stringify(discoveryData?.native.newInstances.find(obj =>
                                            obj._id === selected[currentInstall - 1])));
                                        delete data.comment;

                                        let adapterId = data._id.split('.');
                                        adapterId.pop();
                                        adapterId = adapterId.join('.');
                                        socket.getObject(adapterId)
                                            .then(obj => {
                                                data = Object.assign({}, obj, data);
                                                data.common = Object.assign(obj.common, data.common);
                                                data.native = Object.assign(obj.native, data.native);
                                                data.type = 'instance';

                                                // set log level
                                                if (defaultLogLevel) {
                                                    data.common.logLevel = defaultLogLevel;
                                                }
                                                data.common.logLevel = data.common.logLevel || 'info';

                                                if (instancesInputsParams.native && Object.keys(instancesInputsParams.native).length) {
                                                    Object.assign(data.native, instancesInputsParams.native);
                                                    setInstancesInputsParams({});
                                                }
                                                if (checkSelectHosts && hostInstances[data._id]) {
                                                    data.common.host = hostInstances[data._id];
                                                }

                                                // write created instance
                                                extendObject(data._id, data)
                                                    .then(() => {
                                                        if (currentInstall < selected.length) {
                                                            // install next
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
                                                    });
                                            });
                                    }}
                                    errorFunc={(el, logsError) => {
                                        if (el === 51 && cmdName === 'install') {
                                            return setCmdName('upload');
                                        }
                                        if (selected.length > currentInstall && cmdName === 'upload') {
                                            checkLicenseAndInputs(selected[currentInstall], () =>
                                                setCurrentInstall(currentInstall + 1));
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
                {step > 0 && step !== 4 && <Button
                    variant="contained"
                    disabled={step === 0}
                    onClick={() => {
                        if (step === 2) {
                            resetStateBack();
                        }
                        stepDown();
                    }}
                    color="grey"
                    startIcon={<NavigateBeforeIcon />}
                >
                    {I18n.t('Back')}
                </Button>
                }
                {step === 0 && <Button
                    variant="contained"
                    autoFocus
                    disabled={disableScanner}
                    onClick={discoverScanner}
                    color="primary"
                    startIcon={<SearchIcon />}
                >
                    {I18n.t('Discover')}
                </Button>}
                {step !== 2 && step !== 4 &&
                    <Tooltip title={step === 0 ? I18n.t('Skip discovery process and go to install with last scan results') : ''}>
                        <Button
                            variant="contained"
                            disabled={!discoveryData || !discoveryData?.native?.lastScan || step === 2 || disableScanner || (step === 1 && !selected.length)}
                            onClick={() => {
                                stepUp();
                                if (step === 1) {
                                    checkInstall();
                                }
                            }}
                            color={step === 1 ? 'primary' : 'grey'}
                            startIcon={step === 1 ? <LibraryAddIcon /> : <NavigateNextIcon />}
                        >
                            {I18n.t(step === 1 ? 'Create instances' : 'Use last scan')}
                        </Button>
                    </Tooltip>
                }
                <Button
                    variant="contained"
                    disabled={disableScanner}
                    onClick={() => onClose()}
                    color={step === 2 ? 'primary' : 'grey'}
                    startIcon={<CloseIcon />}
                >
                    {I18n.t(step === 2 ? 'Finish' : 'Close')}
                </Button>
            </DialogActions>
        </Dialog>
    </ThemeProvider >;
}

export default DiscoveryDialog;
