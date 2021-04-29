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
import { licenseDialogFunc } from '../dialogs/LicenseDialog';
import ConfigPanelStyled from '../components/JsonConfigComponent/ConfigPanel';



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

const TabPanel = ({ classes, children, value, index, title, custom, ...props }) => {
    if (custom) {
        return <div
            {...props}
        >{value === index && children}</div>
    }

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

// Types of parameters:
//          - type=password, def=default value
//          - type=checkbox, def=default value
//          - type=select, options={value1: TextValule1, value2=TextValue2}
//          - type=link, def = URL
//          - type=comment, style="CSS style", def=text
//          - type=text
//          - name = Name of attribute like "native.ip" or "native.port"
//          - title = Title of input

const types = {
    "password": "password",
    "checkbox": "checkbox",
    "select": "select",
    "link": "staticLink",
    "comment": "staticText",
    "text": "text",
    "name": "staticText",
    "title": "staticText",
};

const generateObj = (obj, path, value) => {
    path = path.split('.');
    path.forEach((element, idx) => {
        if (idx === path.length - 1) {
            if (!obj[path[idx - 1]]) {
                obj[path[idx - 1]] = {};
            }
            obj[path[idx - 1]][element] = value;
        }
    });
    return obj;
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

    const extendObject = (id, data) => {
        socket.extendObject(id, data, error =>
            error && window.alert(error));
    }

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


    const checkLicense = (objName, cb) => {
        const obj = JSON.parse(JSON.stringify(discoveryData.newInstances.find(obj => obj._id === objName)));
        let license = true;
        if (obj && obj.comment && obj.comment.license && obj.comment.license !== 'MIT') {
            license = false;
            if (!obj.common.licenseUrl) {
                obj.common.licenseUrl = 'https://raw.githubusercontent.com/ioBroker/ioBroker.' + obj.common.name + '/master/LICENSE'
            }
            if (typeof obj.common.licenseUrl === 'object') {
                obj.common.licenseUrl = obj.common.licenseUrl[I18n.getLanguage()] || obj.common.licenseUrl.en;
            }
            // Workaround
            // https://github.com/ioBroker/ioBroker.vis/blob/master/LICENSE =>
            // https://raw.githubusercontent.com/ioBroker/ioBroker.vis/master/LICENSE
            if (obj.common.licenseUrl.indexOf('github.com') !== -1) {
                obj.common.licenseUrl = obj.common.licenseUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
            }
        }
        licenseDialogFunc(license, cb, obj?.common?.licenseUrl);
    }

    const [installProgress, setInstallProgress] = useState(false);
    const [currentInstall, setCurrentInstall] = useState(null);
    const [cmdName, setCmdName] = useState('install');
    const checkInstall = async () => {
        setInstallProgress(true);
        checkLicense(selected[0], () => setCurrentInstall(1));
    }

    const [suggested, setSuggested] = useState(true);
    const [showAll, setShowAll] = useState(true);

    const black = themeType === 'dark';

    const [schema, setSchema] = useState({
        items: {
            enabled: {
                attr: "enabled",
                filter: false,
                sort: false,
                label: "55555",
                type: "checkbox",
                width: 50
            },
            "autoComplete": {
                "newLine": true,
                "sm": 4,
                "type": "autocomplete",
                label: "55555",
                "freeSolo": true,
                "options": [{
                    "label": "A",
                    "value": "a"
                }, "B"]
            },
        }
    });
    const [schemaData, setSchemaData] = useState({ enabled: false, autoComplete: 'B' });

    useEffect(() => {
        const obj = {};
        const objValue = {};
        if (value === 4 && discoveryData && discoveryData.newInstances) {
            console.log(discoveryData.newInstances[0])

            discoveryData.newInstances[0].comment.add.forEach((text, idx) => {
                obj[idx] = { type: 'header', text }
            })
            discoveryData.newInstances[0].comment.inputs.forEach((el, idx) => {
                obj[idx + 1] = {
                    ...el, type: types[el.type], label: el.title, text: el.def, href: el.def,
                    "newLine": true
                }
                if (el.def !== undefined) {
                    objValue[idx + 1] = el.def;
                }
            });
            setSchemaData(objValue);
            setSchema({ items: obj });
        }
    }, [discoveryData.newInstances, value])
    console.log(schemaData, schema)
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
                        // style={black ? { color: 'black' } : null}
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
                            // style={black ? { color: 'white' } : null} 
                            className={classes.headerBlock}>
                            Use following methods:

                        </div>
                        {Object.keys(listMethods).map(key => <div key={key}><Checkbox
                            checked={checkboxChecked[key]}
                            // style={black ? { color: '#436a93' } : null}
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
                        // style={black ? { color: 'black' } : null}
                        value={value}
                        index={1}
                        classes={classes}
                        title={discoveryData?.lastScan ?
                            I18n.t('Create instances automatically - Last scan on %s', Utils.formatDate(new Date(discoveryData.lastScan), dateFormat))
                            : I18n.t('Create instances automatically')
                        }
                    >
                        <Paper className={classes.paperTable}>
                            <Button
                                variant="contained"
                                autoFocus
                                onClick={() => setShowAll(!showAll)}
                                color={showAll ? "primary" : "default"}>
                                {I18n.t('Show all')}
                            </Button>
                            <Button
                                variant="contained"
                                autoFocus
                                onClick={() => setSuggested(!suggested)}
                                color={suggested ? "primary" : "default"}>
                                {I18n.t('Suggested')}
                            </Button>
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
                                        onSelectAllClick={handleSelectAllClick}
                                        rowCount={discoveryData?.newInstances?.length || 0}
                                    />
                                    <TableBody>
                                        {discoveryData?.newInstances?.filter(el => {
                                            if (!suggested) {
                                                return !el.comment?.advice;
                                            }
                                            if (!showAll) {
                                                return !el?.comment?.ack;
                                            }
                                            return true;
                                        }).map((obj, idx) => (<TableRow
                                            hover
                                            role="checkbox"
                                            key={obj._id}
                                            selected={obj.comment?.advice}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={isSelected(obj._id, selected)}
                                                    onClick={(e) => handleClick(e, obj._id, selected, setSelected)}
                                                />
                                            </TableCell>
                                            <TableCell component="th" scope="row" padding="none">
                                                {obj._id.replace('system.adapter.', '')}
                                            </TableCell>
                                            <TableCell align="left">_</TableCell>
                                            <TableCell align="left">{buildComment(obj.comment, I18n.t)}</TableCell>
                                            <TableCell align="right" padding="checkbox">
                                                <Checkbox
                                                    checked={!!obj?.comment?.ack}
                                                    onClick={(e) => {
                                                        const newInstances = JSON.parse(JSON.stringify(discoveryData.newInstances));
                                                        newInstances[idx].comment = { ...newInstances[idx].comment, 'ack': newInstances[idx].comment.ack ? false : true };
                                                        extendObject('system.discovery', {
                                                            native: {
                                                                newInstances
                                                            }
                                                        })
                                                    }}
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
                        {currentInstall && installProgress && <div item style={{ height: 500, overflow: 'hidden', width: 'calc(100% - 260px)' }}><Command
                            noSpacing={true}
                            key={`${currentInstall}-${cmdName}`}
                            ready={true}
                            currentHost={currentHost}
                            socket={socket}
                            t={I18n.t}
                            cmd={`${cmdName} ${discoveryData?.newInstances?.find(obj => obj._id === selected[currentInstall - 1])?.common.name}`}
                            onFinished={(el) => {
                                const initObj = {
                                    "type": "instance",
                                    "protectedNative": [],
                                    "encryptedNative": [],
                                    "notifications": [],
                                    "instanceObjects": [],
                                    "objects": [],
                                }
                                let data = JSON.parse(JSON.stringify(discoveryData.newInstances.find(obj => obj._id === selected[currentInstall - 1])));
                                delete data.comment;
                                data = Object.assign(initObj, data);
                                console.log(data);
                                extendObject(selected[currentInstall - 1], data);
                                if (selected.length > currentInstall) {
                                    checkLicense(selected[currentInstall], () => {
                                        setCurrentInstall(currentInstall + 1);
                                        setCmdName('install');
                                    });
                                } else {
                                    alert('Finish');
                                }
                            }}
                            errorFunc={(el) => {
                                console.log('error', el)
                                if (el === 51 && cmdName === 'install') {
                                    setCmdName('upload');
                                }
                                if (selected.length > currentInstall && cmdName === 'upload') {
                                    checkLicense(selected[currentInstall], () => {
                                        setCurrentInstall(currentInstall + 1);
                                    });
                                } else {
                                    alert(`error ${selected[currentInstall - 1]}`);
                                }
                            }}
                        /></div>}
                    </TabPanel>
                    <TabPanel
                        // className={classes.overflowAuto}
                        // style={black ? { color: 'black' } : null}
                        value={value}
                        index={4}
                        // classes={classes}
                        custom
                        title={I18n.t('Test')}
                    >
                        <Paper className={classes.paperTable}>
                            <ConfigPanelStyled
                                data={schemaData}
                                socket={socket}
                                themeType={themeType}
                                themeName={themeName}
                                onChange={setSchemaData}
                                schema={schema}
                            />
                        </Paper>
                    </TabPanel>
                </div>
            </DialogContent >
            <DialogActions>
                {value > 0 && value !== 4 && <Button
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
                {value !== 2 && value !== 4 && <Button
                    variant="contained"
                    autoFocus
                    disabled={!discoveryData || value === 2 || disableScanner || (value === 1 && !selected.length)}
                    onClick={() => {
                        stepUp();
                        if (value === 1) {
                            checkInstall();
                        }
                    }}
                    color="primary">
                    {value === 1 ? <LibraryAddIcon /> : <NavigateNextIcon />}
                    {I18n.t(value === 1 ? 'Create instances' : 'Next')}
                </Button>}
                {value === 4 && <Button
                    variant="contained"
                    autoFocus
                    onClick={() => {
                        let obj = {};
                        let error = false;
                        Object.keys(schema.items).forEach(key => {
                            if (schema.items[key].required) {
                                if (!schemaData[key]) {
                                    alert(`no data ${schema.items[key].label}`);
                                } else {
                                    obj = generateObj(obj, schema.items[key].name, schemaData[key]);
                                }
                            } else if (schema.items[key].name) {
                                obj = generateObj(obj, schema.items[key].name, schemaData[key]);
                            }
                        })
                        if (!error) {
                            // setValue(2);
                        }
                        console.log(obj);
                    }}
                    color="primary">
                    {I18n.t('Apply')}
                </Button>}
                <Button
                    variant="contained"
                    autoFocus
                    onClick={() => {
                        if (value === 4) {
                            return checkLicense(selected[currentInstall], () => {
                                setCurrentInstall(currentInstall + 1);
                                setCmdName('install');
                            });
                        }
                        onClose();
                    }}
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