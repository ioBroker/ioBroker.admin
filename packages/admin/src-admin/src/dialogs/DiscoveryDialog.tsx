import React, { useEffect, useState } from 'react';

import {
    DialogActions,
    DialogContent,
    Button,
    Dialog,
    Tooltip,
    AppBar,
    Avatar,
    Box,
    Checkbox,
    CircularProgress,
    LinearProgress,
    Paper,
    Step,
    StepLabel,
    Stepper,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Typography,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import {
    Visibility as VisibilityIcon,
    NavigateNext as NavigateNextIcon,
    NavigateBefore as NavigateBeforeIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    LibraryAdd as LibraryAddIcon,
    AssignmentTurnedIn as AssignmentTurnedInIcon,
    ReportProblem as ReportProblemIcon,
} from '@mui/icons-material';

import {
    I18n,
    Utils,
    SelectWithIcon,
    type IobTheme,
    type AdminConnection,
    type ThemeType,
    type ThemeName,
} from '@iobroker/adapter-react-v5';
import type { CompactHost } from '@/types';

import Command from '../components/Command';
import LicenseDialog from './LicenseDialog';
import GenerateInputsModal, {
    type DiscoveryInstance,
    type DiscoveryInstanceComment,
    type DiscoveryObject,
} from './GenerateInputsModal';
import useStateLocal from '../helpers/hooks/useStateLocal';

const styles: Record<string, any> = {
    root: {
        // backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
        borderRadius: 4,
        flexDirection: 'column',
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
        overflow: 'hidden',
    },
    overflowAuto: {
        overflowY: 'auto',
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    descriptionHeaderText: {
        margin: '10px 0',
    },
    heading: {
        display: 'flex',
        alignItems: 'center',
    },
    headerBlock: {
        backgroundColor: '#272727',
        padding: 13,
        fontSize: 16,
    },
    headerBlockDisplayItem: {
        p: '5px',
        fontSize: 16,
        display: 'flex',
        m: '2px',
        border: '1px solid #c0c0c045',
        borderRadius: '4px',
        alignItems: 'center',
        transition: 'background .5s, color .5s',
    },
    activeBlock: {
        backgroundColor: '#c0c0c021',
        border: '1px solid #4dabf5',
    },
    pointer: {
        cursor: 'pointer',
    },
    hover: {
        '&:hover': {
            backgroundColor: '#c0c0c021',
        },
    },
    installSuccess: {
        opacity: 0.7,
        color: '#5ef05e',
    },
    installError: {
        opacity: 0.7,
        color: '#ffc14f',
    },
    width200: {
        width: 200,
    },
    table: {
        // '& *': {
        //     color: 'black'
        // }
    },
    paperTable: {
        width: '100%',
        marginBottom: 16,
    },
    wrapperSwitch: {
        display: 'flex',
        margin: 10,
        marginTop: 0,
    },
    divSwitch: {
        display: 'flex',
        // margin: 10,
        alignItems: 'center',
        fontSize: 10,
        marginLeft: 0,
        color: 'silver',
    },
    marginLeft: {
        marginLeft: 40,
    },
    stepper: {
        padding: 0,
        background: 'inherit',
    },
    instanceIcon: {
        width: 30,
        height: 30,
        margin: 3,
    },
    instanceId: {
        marginLeft: 10,
    },
    instanceWrapper: {
        display: 'flex',
        alignItems: 'center',
    },
};

type CompactRepository = Record<
    string,
    {
        icon: ioBroker.AdapterCommon['icon'];
        version: string;
    }
>;

interface TabPanelProps {
    children: JSX.Element | JSX.Element[];
    value: number;
    index: number;
    title: string;
    custom?: boolean;
    boxHeight?: boolean;
    black?: boolean;
    [other: string]: unknown;
}

function TabPanel({
    style,
    children,
    value,
    index,
    title,
    custom,
    boxHeight,
    black,
    ...props
}: TabPanelProps): JSX.Element | null {
    if (custom) {
        return <div {...props}>{value === index && children}</div>;
    }
    if (value === index) {
        return (
            <div
                {...props}
                style={style}
            >
                <AppBar
                    position="static"
                    color="default"
                >
                    <div style={{ ...styles.headerBlock, color: !black ? 'white' : undefined }}>{title}</div>
                </AppBar>
                <Box
                    style={boxHeight ? { height: 'calc(100% - 45px)' } : undefined}
                    p={3}
                >
                    <Typography
                        style={boxHeight ? { height: '100%' } : undefined}
                        component="div"
                    >
                        {children}
                    </Typography>
                </Box>
            </div>
        );
    }
    return null;
}

const headCells = [
    {
        id: 'instance',
        numeric: false,
        disablePadding: true,
        label: 'Instance',
    },
    {
        id: 'host',
        numeric: false,
        disablePadding: false,
        label: 'Host',
    },
    {
        id: 'description',
        numeric: false,
        disablePadding: false,
        label: 'Description',
    },
    {
        id: 'ignore',
        numeric: true,
        disablePadding: false,
        label: 'Ignore',
    },
];

interface EnhancedTableHeadProps {
    numSelected: number;
    onSelectAllClick: (event: React.ChangeEvent) => void;
    rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableHeadProps): JSX.Element {
    const { numSelected, rowCount, onSelectAllClick } = props;

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={(event: React.ChangeEvent) => onSelectAllClick(event)}
                        inputProps={{ 'aria-label': 'select all desserts' }}
                    />
                </TableCell>
                {headCells.map(headCell => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'right' : 'left'}
                        padding={headCell.disablePadding ? 'none' : 'normal'}
                    >
                        <TableSortLabel>{headCell.label}</TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

function buildComment(comment: DiscoveryInstanceComment): string {
    if (!comment) {
        return 'new';
    }
    if (typeof comment === 'string') {
        return comment;
    }
    let text = '';

    if (comment.add) {
        text += I18n.t('new');
        if (Array.isArray(comment.add) && comment.add.length) {
            text += ': ';
            if (comment.add.length <= 5) {
                text += comment.add.join(', ');
            } else {
                text += I18n.t('%s devices', comment.add.length);
            }
        } else if (typeof comment.add === 'string' || typeof comment.add === 'number') {
            text += ': ';
            text += comment.add;
        }
    }

    if (comment.changed) {
        text += (text ? ', ' : '') + I18n.t('changed');
        if (Array.isArray(comment.changed) && comment.changed.length) {
            text += ': ';
            if (comment.changed.length <= 5) {
                text += comment.changed.join(', ');
            } else {
                text += I18n.t('%s devices', comment.changed.length);
            }
        } else if (typeof comment.changed === 'string' || typeof comment.changed === 'number') {
            text += ': ';
            text += comment.changed;
        }
    }

    if (comment.extended) {
        text += (text ? ', ' : '') + I18n.t('extended');
        if (Array.isArray(comment.extended) && comment.extended.length) {
            text += ': ';
            if (comment.extended.length <= 5) {
                text += comment.extended.join(', ');
            } else {
                text += I18n.t('%s devices', comment.extended.length);
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

interface DiscoveryDialogProps {
    themeType: ThemeType;
    themeName: ThemeName;
    socket: AdminConnection;
    dateFormat: string;
    currentHost: string;
    defaultLogLevel: ioBroker.LogLevel;
    repository: CompactRepository;
    hosts: CompactHost[];
    onClose: () => void;
    theme: IobTheme;
}

function DiscoveryDialog({
    themeType,
    themeName,
    socket,
    dateFormat,
    currentHost,
    defaultLogLevel,
    repository,
    hosts,
    onClose,
    theme,
}: DiscoveryDialogProps): JSX.Element {
    const [step, setStep] = useState<number>(0);
    const [listMethods, setListMethods] = useState<Record<string, { type: string; source: string; timeout?: number }>>(
        {},
    );
    const [checkboxChecked, setCheckboxChecked] = useState<Record<string, boolean>>({});
    const [disableScanner, setDisableScanner] = useState<boolean>(false);
    const [discoveryData, setDiscoveryData] = useState<DiscoveryObject | null>(null);

    useEffect(() => {
        async function fetchData(): Promise<void> {
            const resultList: Record<string, { type: string; source: string; timeout?: number }> = await socket.sendTo(
                'system.adapter.discovery.0',
                'listMethods',
                null,
            );
            const listChecked: Record<string, boolean> = {};
            const lastSelectionStr =
                (((window as any)._localStorage as Storage) || window.localStorage).getItem(
                    'App.discoveryLastSelection',
                ) || null;
            let lastSelection: null | Record<string, boolean>;
            if (lastSelectionStr) {
                try {
                    lastSelection = JSON.parse(lastSelectionStr) as Record<string, boolean>;
                } catch {
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
        }

        void fetchData().catch(e => console.warn(`Cannot read listMethods: ${e}`));
    }, [socket]);

    useEffect(() => {
        async function readOldData(): Promise<void> {
            const dataDiscovery = await socket.getObject('system.discovery');
            if (dataDiscovery !== undefined) {
                setDiscoveryData(dataDiscovery as unknown as DiscoveryObject);
            }
        }

        readOldData().catch(e => console.warn(`Cannot read system.discovery: ${e}`));
    }, [socket]);

    const [aliveHosts, setAliveHosts] = useState<Record<string, boolean>>({});
    const [checkSelectHosts, setCheckSelectHosts] = useState(false);
    const [hostInstances, setHostInstances] = useState<Record<string, string>>({});

    useEffect(() => {
        hosts.forEach(async ({ _id }: { _id: string }) => {
            const aliveValue = await socket.getState(`${_id}.alive`);

            setAliveHosts(prev => ({
                ...prev,
                [_id]: !aliveValue || aliveValue.val === null ? false : !!aliveValue.val,
            }));
        });

        if (Object.keys(aliveHosts).filter(key => aliveHosts[key]).length > 1) {
            setCheckSelectHosts(true);
        }
    }, [hosts, socket, aliveHosts]);

    const [devicesFound, setDevicesFound] = useState(0);
    const [devicesProgress, setDevicesProgress] = useState(0);
    const [instancesFound, setInstancesFound] = useState(0);
    const [scanRunning, setScanRunning] = useState(false);
    const [servicesProgress, setServicesProgress] = useState(0);
    const [selected, setSelected] = useState<string[]>([]);
    const [installProgress, setInstallProgress] = useState(false);
    const [currentInstall, setCurrentInstall] = useState(1);
    const [installStatus, setInstallStatus] = useState<Record<string, 'error' | 'success'>>({});
    const [cmdName, setCmdName] = useState('install');
    const [suggested, setSuggested] = useStateLocal(true, 'discovery.suggested');
    const [showAll, setShowAll] = useStateLocal(true, 'discovery.showAll');
    const [showLicenseDialog, setShowLicenseDialog] = useState<{ obj: DiscoveryInstance; cb: () => void } | null>(null);
    const [showInputsDialog, setShowInputsDialog] = useState<{ obj: DiscoveryInstance; cb: () => void } | null>(null);

    const black = themeType === 'dark';

    const [instancesInputsParams, setInstancesInputsParams] = useState<{ native: Record<string, any> }>({ native: {} });
    const steps = ['Select methods', 'Create instances', 'Installation process'];
    const [logs, setLogs] = useState<Record<string, any>>({});
    const [finishInstall, setFinishInstall] = useState(false);
    const [selectLogsIndex, setSelectLogsIndex] = useState(1);

    const handlerInstall = (name: string, value: ioBroker.State | null | undefined): void => {
        if (!value) {
            return;
        }
        switch (name) {
            case 'discovery.0.devicesFound':
                setDevicesFound(value.val as number);
                break;
            case 'discovery.0.devicesProgress':
                setDevicesProgress(value.val as number);
                break;
            case 'discovery.0.instancesFound':
                setInstancesFound(value.val as number);
                break;
            case 'discovery.0.scanRunning':
                setScanRunning(value.val as boolean);
                break;
            case 'discovery.0.servicesProgress':
                setServicesProgress(value.val as number);
                break;
            default:
                break;
        }
    };
    const onSystemDiscoveryChanged = (id: string, obj: ioBroker.Object | null | undefined): void => {
        if (!obj) {
            return;
        }
        if (id === 'system.discovery') {
            setDiscoveryData(obj as unknown as DiscoveryObject);
        }
    };
    useEffect(() => {
        void socket.subscribeObject('system.discovery', onSystemDiscoveryChanged);
        void socket.subscribeState('discovery.0.devicesFound', handlerInstall);
        void socket.subscribeState('discovery.0.devicesProgress', handlerInstall);
        void socket.subscribeState('discovery.0.instancesFound', handlerInstall);
        void socket.subscribeState('discovery.0.scanRunning', handlerInstall);
        void socket.subscribeState('discovery.0.servicesProgress', handlerInstall);

        return () => {
            void socket.unsubscribeObject('system.discovery', onSystemDiscoveryChanged);
            void socket.unsubscribeState('discovery.0.devicesFound', handlerInstall);
            void socket.unsubscribeState('discovery.0.devicesProgress', handlerInstall);
            void socket.unsubscribeState('discovery.0.instancesFound', handlerInstall);
            void socket.unsubscribeState('discovery.0.scanRunning', handlerInstall);
            void socket.unsubscribeState('discovery.0.servicesProgress', handlerInstall);
        };
    }, [socket]);

    const stepUp = (): void => setStep(step + 1);

    const stepDown = (): void => setStep(step - 1);

    const extendObject = (id: string, data: Record<string, any>): Promise<void> =>
        socket.extendObject(id, data).catch((error: any) => window.alert(error));

    const discoverScanner = async (): Promise<void> => {
        setDisableScanner(true);
        const dataArray = Object.keys(checkboxChecked).filter(key => checkboxChecked[key]);
        const resultList = await socket.sendTo('system.adapter.discovery.0', 'browse', dataArray);
        setDisableScanner(false);
        if (resultList.error) {
            window.alert(resultList.error);
        } else {
            setStep(1);
        }
    };

    const handleSelectAllClick = (event: any): void => {
        if (event.target.checked) {
            const newSelected = discoveryData?.native?.newInstances?.map(n => n._id);
            setSelected(newSelected);
            return;
        }
        setSelected([]);
    };

    const isSelected = (name: string, arr: string[]): boolean => arr.includes(name);

    const handleClick = (_event: any, name: string, arr: string[], func: (newSelected: any) => void): void => {
        const selectedIndex = arr.indexOf(name);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(arr, name);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(arr.slice(1));
        } else if (selectedIndex === arr.length - 1) {
            newSelected = newSelected.concat(arr.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(arr.slice(0, selectedIndex), arr.slice(selectedIndex + 1));
        }

        func(newSelected);
    };

    const checkLicenseAndInputs = (objName: string, cb: () => void): void => {
        const instanceObj: DiscoveryInstance | null = discoveryData?.native?.newInstances.find(
            ob => ob._id === objName,
        );
        const obj: DiscoveryInstance | null = instanceObj ? JSON.parse(JSON.stringify(instanceObj)) : null;
        let license = true;
        if (obj?.comment?.license && obj.comment.license !== 'MIT') {
            license = false;
            if (!obj.common.licenseUrl) {
                obj.common.licenseUrl = `https://raw.githubusercontent.com/ioBroker/ioBroker.${obj.common.name}/master/LICENSE`;
            }
            if (obj.common.licenseUrl && typeof obj.common.licenseUrl === 'object') {
                obj.common.licenseUrl = obj.common.licenseUrl[I18n.getLanguage()] || obj.common.licenseUrl.en;
            }
            if ((obj.common.licenseUrl as string).includes('github.com')) {
                obj.common.licenseUrl = (obj.common.licenseUrl as string)
                    .replace('github.com', 'raw.githubusercontent.com')
                    .replace('/blob/', '/');
            }
        }

        if (license) {
            if (obj.comment?.inputs) {
                setShowInputsDialog({ cb, obj });
            } else {
                cb();
            }
        } else {
            setShowLicenseDialog({ cb, obj });
        }
    };

    const goToNextInstance = (id: string, reason: string): void => {
        const index = selected.indexOf(id) + 1;
        setInstallStatus(status => ({ ...status, [index]: 'error' }));

        if (reason) {
            setLogs(logsEl => ({ ...logsEl, [selected[index - 1]]: [I18n.t(reason)] }));
        }

        if (selected.length > index) {
            setTimeout(
                () =>
                    checkLicenseAndInputs(selected[index], () => {
                        setCurrentInstall(index + 1);
                        setCmdName('install');
                        setInstallProgress(true);
                    }),
                100,
            );
        } else {
            setFinishInstall(true);
        }
    };

    const inputsDialog = showInputsDialog ? (
        <GenerateInputsModal
            socket={socket}
            theme={theme}
            themeType={themeType}
            themeName={themeName}
            newInstance={showInputsDialog.obj}
            onClose={params => {
                const { cb } = showInputsDialog;
                const { obj } = showInputsDialog;
                setShowInputsDialog(null);

                if (params) {
                    setInstancesInputsParams(params);
                    cb();
                } else {
                    goToNextInstance(obj._id, 'Error: configuration dialog canceled');
                }
            }}
        />
    ) : null;

    const resetStateBack = (): void => {
        setSelected([]);
        setInstallProgress(false);
        setFinishInstall(false);
        setCurrentInstall(1);
        setCmdName('install');
        setInstallStatus({});
    };

    const checkInstall = (): void => {
        checkLicenseAndInputs(selected[0], () => {
            setCurrentInstall(1);
            setInstallProgress(true);
        });
    };

    const licenseDialog = showLicenseDialog ? (
        <LicenseDialog
            licenseType={showLicenseDialog.obj.comment.license}
            url={showLicenseDialog.obj.common.licenseUrl as string}
            onClose={result => {
                const { cb, obj } = showLicenseDialog;
                setShowLicenseDialog(null);
                if (!result) {
                    // license isn't accepted, go to the next instance
                    goToNextInstance(obj._id, 'Error: license not accepted');
                } else if (obj.comment?.inputs) {
                    setShowInputsDialog({ cb, obj });
                } else {
                    cb();
                }
            }}
        />
    ) : null;

    return (
        <ThemeProvider theme={theme}>
            {licenseDialog}
            {inputsDialog}
            <Dialog
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                        onClose();
                    }
                }}
                open={!0}
                sx={{ '& .MuiDialog-paper': styles.paper }}
            >
                <h2 style={styles.heading}>
                    <VisibilityIcon
                        style={{
                            color: 'rgb(77 171 245)',
                            fontSize: 36,
                            marginLeft: 25,
                            marginRight: 10,
                        }}
                    />
                    {I18n.t('Find devices and services')}
                </h2>
                <Stepper
                    style={styles.stepper}
                    alternativeLabel
                    activeStep={step}
                >
                    {steps.map(label => (
                        <Step key={label}>
                            <StepLabel>{I18n.t(label)}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                <DialogContent
                    style={{ ...styles.flex, ...styles.overflowHidden }}
                    dividers
                >
                    <div style={styles.root}>
                        <TabPanel
                            style={{ ...styles.overflowAuto, color: black ? 'white' : undefined }}
                            value={step}
                            index={0}
                            black={black}
                            title={I18n.t('Discover all possible devices')}
                        >
                            {!disableScanner ? (
                                <>
                                    {' '}
                                    <div style={styles.headerText}>{I18n.t('press_discover')}</div>
                                    {discoveryData?.native?.lastScan && (
                                        <div style={styles.descriptionHeaderText}>
                                            {I18n.t(
                                                'Last scan on %s',
                                                Utils.formatDate(new Date(discoveryData.native.lastScan), dateFormat),
                                            )}
                                        </div>
                                    )}
                                    <div style={{ ...styles.headerBlock, color: !black ? 'white' : undefined }}>
                                        {I18n.t('Use following methods:')}
                                    </div>
                                    {Object.keys(listMethods).map(key => (
                                        <div key={key}>
                                            <Checkbox
                                                checked={checkboxChecked[key]}
                                                disabled={disableScanner}
                                                onChange={(_, value) => {
                                                    const newCheckboxChecked = JSON.parse(
                                                        JSON.stringify(checkboxChecked),
                                                    );
                                                    newCheckboxChecked[key] = value;
                                                    ((window as any)._localStorage || window.localStorage).setItem(
                                                        'App.discoveryLastSelection',
                                                        JSON.stringify(newCheckboxChecked),
                                                    );
                                                    setCheckboxChecked(newCheckboxChecked);
                                                }}
                                            />
                                            {key}
                                        </div>
                                    ))}
                                </>
                            ) : (
                                scanRunning && (
                                    <div>
                                        {devicesProgress >= 99
                                            ? `Lookup services - ${servicesProgress}%`
                                            : `Lookup devices - ${devicesProgress}%`}
                                        {disableScanner && (
                                            <LinearProgress
                                                variant="determinate"
                                                value={devicesProgress >= 99 ? servicesProgress : devicesProgress}
                                            />
                                        )}
                                        {devicesProgress >= 99
                                            ? `${instancesFound} service(s) found`
                                            : `${devicesFound} device(s) found`}
                                    </div>
                                )
                            )}
                        </TabPanel>
                        <TabPanel
                            style={styles.overflowAuto}
                            value={step}
                            index={1}
                            title={
                                discoveryData?.native?.lastScan
                                    ? I18n.t(
                                          'Create instances automatically - Last scan on %s',
                                          Utils.formatDate(new Date(discoveryData.native.lastScan), dateFormat),
                                      )
                                    : I18n.t('Create instances automatically')
                            }
                        >
                            <div style={styles.wrapperSwitch}>
                                <div style={styles.divSwitch}>
                                    <div style={!showAll ? { color: 'green' } : undefined}>
                                        {I18n.t('hide ignored')}
                                    </div>
                                    <Switch
                                        checked={showAll}
                                        onChange={e => setShowAll(e.target.checked)}
                                        color="primary"
                                    />
                                    <div style={showAll ? { color: 'green' } : undefined}>{I18n.t('show ignored')}</div>
                                </div>
                                <div style={{ ...styles.divSwitch, ...styles.marginLeft }}>
                                    <div style={!suggested ? { color: 'green' } : undefined}>
                                        {I18n.t('hide suggested')}
                                    </div>
                                    <Switch
                                        checked={suggested}
                                        onChange={e => setSuggested(e.target.checked)}
                                        color="primary"
                                    />
                                    <div style={suggested ? { color: 'green' } : undefined}>
                                        {I18n.t('show suggested')}
                                    </div>
                                </div>
                            </div>
                            <Paper style={styles.paperTable}>
                                <TableContainer>
                                    <Table
                                        style={styles.table}
                                        size="small"
                                    >
                                        <EnhancedTableHead
                                            numSelected={selected.length}
                                            onSelectAllClick={handleSelectAllClick}
                                            rowCount={discoveryData?.native?.newInstances?.length || 0}
                                        />
                                        <TableBody>
                                            {discoveryData?.native?.newInstances
                                                ?.filter((el: any) => {
                                                    if (!suggested) {
                                                        return !el.comment?.advice;
                                                    }
                                                    if (!showAll) {
                                                        return !el?.comment?.ack;
                                                    }
                                                    return true;
                                                })
                                                .map((obj: any, idx: number) => (
                                                    <TableRow
                                                        hover
                                                        role="checkbox"
                                                        key={obj._id}
                                                        selected={obj.comment?.advice}
                                                    >
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                checked={isSelected(obj._id, selected)}
                                                                onClick={e =>
                                                                    handleClick(e, obj._id, selected, setSelected)
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell
                                                            component="th"
                                                            scope="row"
                                                            padding="none"
                                                        >
                                                            <div style={styles.instanceWrapper}>
                                                                <Avatar
                                                                    variant="square"
                                                                    alt={obj._id.replace('system.adapter.', '')}
                                                                    src={repository[obj.common.name]?.icon}
                                                                    style={styles.instanceIcon}
                                                                />
                                                                <div style={styles.instanceId}>
                                                                    {obj._id.replace('system.adapter.', '')}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell align="left">
                                                            {checkSelectHosts ? (
                                                                <SelectWithIcon
                                                                    fullWidth
                                                                    lang={I18n.getLanguage()}
                                                                    list={hosts as ioBroker.Object[]}
                                                                    t={I18n.t}
                                                                    value={hostInstances[obj._id] || currentHost}
                                                                    themeType={themeType}
                                                                    onChange={val =>
                                                                        setHostInstances({
                                                                            ...hostInstances,
                                                                            [obj._id]: val,
                                                                        })
                                                                    }
                                                                />
                                                            ) : (
                                                                '_'
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="left">{buildComment(obj.comment)}</TableCell>
                                                        <TableCell
                                                            align="right"
                                                            padding="checkbox"
                                                        >
                                                            <Checkbox
                                                                checked={!!obj?.comment?.ack}
                                                                onClick={() => {
                                                                    const newInstances = JSON.parse(
                                                                        JSON.stringify(
                                                                            discoveryData?.native.newInstances,
                                                                        ),
                                                                    );

                                                                    newInstances[idx].comment = {
                                                                        ...newInstances[idx].comment,
                                                                        ack: !newInstances[idx].comment.ack,
                                                                    };

                                                                    void extendObject('system.discovery', {
                                                                        native: { newInstances },
                                                                    });
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </TabPanel>
                        <TabPanel
                            value={step}
                            index={2}
                            style={{ ...styles.overflowAuto, height: '100%' }}
                            boxHeight
                            title={I18n.t('Install adapters')}
                        >
                            <div style={{ display: 'flex', height: '100%' }}>
                                <div>
                                    {selected.map((el, idx) => (
                                        <Box
                                            component="div"
                                            key={el}
                                            onClick={finishInstall ? () => setSelectLogsIndex(idx) : undefined}
                                            sx={{
                                                ...styles.headerBlockDisplayItem,
                                                ...(finishInstall ? styles.pointer : undefined),
                                                ...(finishInstall ? styles.hover : undefined),
                                                ...(finishInstall && selectLogsIndex === idx
                                                    ? styles.activeBlock
                                                    : undefined),
                                            }}
                                        >
                                            <div style={styles.width200}>
                                                <div style={styles.instanceWrapper}>
                                                    <Avatar
                                                        variant="square"
                                                        alt={el.replace('system.adapter.', '')}
                                                        src={
                                                            repository[el.replace('system.adapter.', '').split('.')[0]]
                                                                ?.icon
                                                        }
                                                        style={styles.instanceIcon}
                                                    />
                                                    <div style={styles.instanceId}>
                                                        {el.replace('system.adapter.', '')}
                                                    </div>
                                                </div>
                                            </div>
                                            {currentInstall === idx + 1 && !installStatus[idx + 1] && (
                                                <CircularProgress size={20} />
                                            )}
                                            {installStatus[idx + 1] === 'error' ? (
                                                <ReportProblemIcon style={styles.installError} />
                                            ) : installStatus[idx + 1] === 'success' ? (
                                                <AssignmentTurnedInIcon style={styles.installSuccess} />
                                            ) : null}
                                        </Box>
                                    ))}
                                </div>
                                {currentInstall && (installProgress || finishInstall) && (
                                    <div style={{ overflow: 'hidden', width: 'calc(100% - 260px)' }}>
                                        <Command
                                            noSpacing
                                            key={`${currentInstall}-${cmdName}`}
                                            ready
                                            host={currentHost}
                                            logsRead={
                                                finishInstall ? logs[selected[selectLogsIndex]] || ['skipped'] : null
                                            }
                                            showElement={!finishInstall}
                                            socket={socket}
                                            t={I18n.t}
                                            cmd={
                                                finishInstall
                                                    ? ''
                                                    : `${cmdName} ${
                                                          selected[currentInstall - 1]
                                                              .replace('system.adapter.', '')
                                                              .split('.')[0]
                                                      }`
                                            }
                                            onFinished={(_, logsSuccess) => {
                                                let data = JSON.parse(
                                                    JSON.stringify(
                                                        discoveryData?.native.newInstances.find(
                                                            (obj: any) => obj._id === selected[currentInstall - 1],
                                                        ),
                                                    ),
                                                );
                                                delete data.comment;

                                                let adapterId = data._id.split('.');
                                                adapterId.pop();
                                                adapterId = adapterId.join('.');
                                                void socket.getObject(adapterId).then((obj: ioBroker.AdapterObject) => {
                                                    data = { ...obj, ...data };
                                                    data.common = Object.assign(obj.common, data.common);
                                                    data.native = Object.assign(obj.native, data.native);
                                                    data.type = 'instance';

                                                    // set log level
                                                    if (defaultLogLevel) {
                                                        data.common.logLevel = defaultLogLevel;
                                                    }
                                                    data.common.logLevel = data.common.logLevel || 'info';

                                                    if (
                                                        instancesInputsParams.native &&
                                                        Object.keys(instancesInputsParams.native).length
                                                    ) {
                                                        Object.assign(data.native, instancesInputsParams.native);
                                                        setInstancesInputsParams({ native: {} });
                                                    }
                                                    if (checkSelectHosts && hostInstances[data._id]) {
                                                        data.common.host = hostInstances[data._id];
                                                    }

                                                    // write created instance
                                                    void extendObject(data._id, data).then(() => {
                                                        if (currentInstall < selected.length) {
                                                            // install next
                                                            checkLicenseAndInputs(selected[currentInstall], () => {
                                                                setCurrentInstall(currentInstall + 1);
                                                                setCmdName('install');
                                                            });
                                                            setLogs({
                                                                ...logs,
                                                                [selected[currentInstall - 1]]: logsSuccess,
                                                            });
                                                            setInstallStatus({
                                                                ...installStatus,
                                                                [currentInstall]: 'success',
                                                            });
                                                        } else {
                                                            setLogs({
                                                                ...logs,
                                                                [selected[currentInstall - 1]]: logsSuccess,
                                                            });
                                                            setInstallStatus({
                                                                ...installStatus,
                                                                [currentInstall]: 'success',
                                                            });
                                                            setSelectLogsIndex(currentInstall - 1);
                                                            const dataDiscovery = JSON.parse(
                                                                JSON.stringify(discoveryData),
                                                            );
                                                            if (dataDiscovery) {
                                                                dataDiscovery.native.newInstances =
                                                                    dataDiscovery.native.newInstances.filter(
                                                                        ({ _id }: { _id: string }) => {
                                                                            const find = selected.find(
                                                                                el => el === _id,
                                                                            );
                                                                            if (!find) {
                                                                                return true;
                                                                            }
                                                                            return (
                                                                                installStatus[
                                                                                    selected.indexOf(find) + 1
                                                                                ] !== 'success'
                                                                            );
                                                                        },
                                                                    );
                                                                void socket.setObject(
                                                                    'system.discovery',
                                                                    dataDiscovery,
                                                                );
                                                            }
                                                            setFinishInstall(true);
                                                            window.alert(I18n.t('Finished'));
                                                        }
                                                    });
                                                });
                                            }}
                                            errorFunc={(el, logsError) => {
                                                if (el === 51 && cmdName === 'install') {
                                                    setCmdName('upload');
                                                    return;
                                                }
                                                if (selected.length > currentInstall && cmdName === 'upload') {
                                                    checkLicenseAndInputs(selected[currentInstall], () =>
                                                        setCurrentInstall(currentInstall + 1),
                                                    );
                                                    setInstallStatus({ ...installStatus, [currentInstall]: 'error' });
                                                } else {
                                                    if (selected.length > currentInstall) {
                                                        setInstallStatus({
                                                            ...installStatus,
                                                            [currentInstall]: 'error',
                                                        });
                                                        checkLicenseAndInputs(selected[currentInstall], () =>
                                                            setCurrentInstall(currentInstall + 1),
                                                        );
                                                        setCmdName('install');
                                                        setLogs({ ...logs, [selected[currentInstall - 1]]: logsError });
                                                    } else {
                                                        setInstallStatus({
                                                            ...installStatus,
                                                            [currentInstall]: 'error',
                                                        });
                                                        setLogs({ ...logs, [selected[currentInstall - 1]]: logsError });
                                                        setFinishInstall(true);
                                                        setSelectLogsIndex(currentInstall - 1);
                                                        const dataDiscovery = JSON.parse(JSON.stringify(discoveryData));
                                                        if (dataDiscovery) {
                                                            dataDiscovery.native.newInstances =
                                                                dataDiscovery.native.newInstances.filter(
                                                                    ({ _id }: { _id: string }) => {
                                                                        const find = selected.find(ele => ele === _id);
                                                                        if (!find) {
                                                                            return true;
                                                                        }
                                                                        return (
                                                                            installStatus[
                                                                                selected.indexOf(find) + 1
                                                                            ] !== 'success'
                                                                        );
                                                                    },
                                                                );
                                                            void socket.setObject('system.discovery', dataDiscovery);
                                                        }
                                                    }
                                                    window.alert(`error ${selected[currentInstall - 1]}`);
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </TabPanel>
                    </div>
                </DialogContent>
                <DialogActions>
                    {step > 0 && step !== 4 && (
                        <Button
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
                    )}
                    {step === 0 && (
                        <Button
                            variant="contained"
                            autoFocus
                            disabled={disableScanner}
                            onClick={discoverScanner}
                            color="primary"
                            startIcon={<SearchIcon />}
                        >
                            {I18n.t('Discover')}
                        </Button>
                    )}
                    {step !== 2 && step !== 4 && (
                        <Tooltip
                            slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                            title={
                                step === 0
                                    ? I18n.t('Skip discovery process and go to install with last scan results')
                                    : ''
                            }
                        >
                            <span style={{ marginLeft: 8 }}>
                                <Button
                                    variant="contained"
                                    disabled={
                                        !discoveryData ||
                                        !discoveryData?.native?.lastScan ||
                                        step === 2 ||
                                        disableScanner ||
                                        (step === 1 && !selected.length)
                                    }
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
                            </span>
                        </Tooltip>
                    )}
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
        </ThemeProvider>
    );
}

export default DiscoveryDialog;
