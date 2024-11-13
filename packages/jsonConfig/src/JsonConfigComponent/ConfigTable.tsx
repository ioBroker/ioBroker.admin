import React, { createRef, type JSX, type RefObject } from 'react';
import Dropzone from 'react-dropzone';

import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Card,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid2,
    IconButton,
    InputAdornment,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Toolbar,
    Tooltip,
    Typography,
    FormHelperText,
} from '@mui/material';

import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    ArrowUpward as UpIcon,
    ArrowDownward as DownIcon,
    FilterAlt as IconFilterOn,
    FilterAltOff as IconFilterOff,
    ContentCopy as CopyContentIcon,
    Download as ExportIcon,
    Warning as ErrorIcon,
    UploadFile as ImportIcon,
    Close as IconClose,
    ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemTableIndexed, ConfigItemPanel, ConfigItemTable } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';
import ConfigPanel from './ConfigPanel';

const MAX_SIZE = 1024 * 1024; // 1MB

const styles: Record<string, React.CSSProperties> = {
    fullWidth: {
        width: '100%',
    },
    root: {
        width: '100%',
    },
    paper: {
        width: '100%',
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerText: {
        width: '100%',
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
    label: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    // highlight: (theme: IobTheme) => (theme.palette.mode === 'light'
    //     ? {
    //         color: theme.palette.secondary.main,
    //         // backgroundColor: lighten(theme.palette.secondary.light, 0.85),
    //     }
    //     : {
    //         color: theme.palette.text.primary,
    //         backgroundColor: theme.palette.secondary.dark,
    //     }),
    title: {
        flex: '1 1 100%',
    },
    rootTool: {
        paddingLeft: 16,
        paddingRight: 8,
    },
    silver: {
        opacity: 0.2,
    },
    flex: {
        display: 'flex',
        alignItems: 'baseline',
    },
    filteredOut: {
        padding: 10,
        display: 'flex',
        textAlign: 'center',
    },
    buttonEmpty: {
        width: 34,
        display: 'inline-block',
    },
    buttonCell: {
        whiteSpace: 'nowrap',
    },

    dropZone: {
        width: '100%',
        height: 100,
        position: 'relative',
    },
    dropZoneEmpty: {},
    uploadDiv: {
        position: 'relative',
        width: '100%',
        minHeight: 300,
        opacity: 0.9,
        marginTop: 30,
        cursor: 'pointer',
        outline: 'none',
    },
    uploadDivDragging: {
        opacity: 1,
        background: 'rgba(128,255,128,0.1)',
    },
    image: {
        objectFit: 'contain',
        margin: 'auto',
        display: 'flex',
        width: '100%',
        height: '100%',
    },
    uploadCenterDiv: {
        margin: 5,
        border: '3px dashed grey',
        borderRadius: 5,
        width: 'calc(100% - 10px)',
        height: 'calc(100% - 10px)',
        minHeight: 300,
        position: 'relative',
        display: 'flex',
    },
    uploadCenterIcon: {
        paddingTop: 10,
        width: 48,
        height: 48,
    },
    uploadCenterText: {
        fontSize: 16,
    },
    uploadCenterTextAndIcon: {
        textAlign: 'center',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonRemoveWrapper: {
        position: 'absolute',
        zIndex: 222,
        right: 0,
    },
    error: {
        border: '2px solid red',
        boxSizing: 'border-box',
    },
    tooltip: {
        pointerEvents: 'none',
    },
};

function objectToArray(
    object: Record<string, any>,
    nameOfFirstAttr: string,
    nameOfSecondAttr?: string,
): Record<string, any>[] {
    nameOfFirstAttr = nameOfFirstAttr || 'key';

    const array: Record<string, any>[] = [];
    Object.keys(object).forEach(key => {
        const item: Record<string, any> = {};
        item[nameOfFirstAttr] = key;

        if (nameOfSecondAttr) {
            item[nameOfSecondAttr] = object[key];
            array.push(item);
        } else {
            array.push(Object.assign(item, object[key]));
        }
    });

    return array;
}

function arrayToObject(
    array: Record<string, any>[],
    nameOfFirstAttr: string,
    nameOfSecondAttr?: string,
): Record<string, any> {
    nameOfFirstAttr = nameOfFirstAttr || 'key';

    const object: Record<string, any> = {};

    array.forEach((row: Record<string, any>) => {
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

interface ConfigTableProps extends ConfigGenericProps {
    schema: ConfigItemTable;
}

interface ConfigTableState extends ConfigGenericState {
    value: Record<string, any>[];
    visibleValue: number[] | null;
    orderBy: string;
    order: 'asc' | 'desc';
    iteration: number;
    filterOn: string[];
    errorMessage: string;
    showImportDialog: boolean;
    showTypeOfImportDialog: Record<string, any>[] | false;
    instanceObj: ioBroker.InstanceObject;
    customObj: Record<string, any>;
    uploadFile: boolean | 'dragging';
    icon: boolean;
}

function encrypt(secret: string, value: string): string {
    let result = '';
    for (let i = 0; i < value.length; i++) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ value.charCodeAt(i));
    }
    return result;
}
function decrypt(secret: string, value: string): string {
    let result = '';
    for (let i = 0; i < value.length; i++) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ value.charCodeAt(i));
    }
    return result;
}

class ConfigTable extends ConfigGeneric<ConfigTableProps, ConfigTableState> {
    private readonly filterRefs: Record<string, RefObject<HTMLInputElement>>;

    private typingTimer: ReturnType<typeof setTimeout> | null = null;

    private secret: string = 'Zgfr56gFe87jJOM';

    constructor(props: ConfigTableProps) {
        super(props);
        this.filterRefs = {};
        this.props.schema.items = this.props.schema.items || [];
        this.props.schema.items.forEach((el: ConfigItemTableIndexed) => {
            if (el.filter) {
                this.filterRefs[el.attr] = createRef();
            }
        });
    }

    /**
     * React lifecycle hook, called once as component is mounted
     */
    async componentDidMount(): Promise<void> {
        super.componentDidMount();
        const _value: Record<string, any>[] | Record<string, any> =
            ConfigGeneric.getValue(this.props.data, this.props.attr) || [];
        let value: Record<string, any>[];

        // if the list is given as an object
        if (this.props.schema.objKeyName) {
            value = objectToArray(
                _value as Record<string, any>,
                this.props.schema.objKeyName,
                this.props.schema.objValueName,
            );
        } else {
            value = _value as Record<string, any>[];
        }

        if (!Array.isArray(value)) {
            value = [];
        }

        if (this.props.schema.encryptedAttributes) {
            const systemConfig = await this.props.socket.getCompactSystemConfig();
            this.secret = systemConfig?.native.secret || this.secret;

            _value.forEach((el: Record<string, any>) => {
                this.props.schema.encryptedAttributes.forEach((attr: string) => {
                    if (el[attr]) {
                        el[attr] = decrypt(this.secret, el[attr]);
                    }
                });
            });
        }

        this.setState(
            {
                value,
                visibleValue: null,
                orderBy: /* this.props.schema.items.length ? this.props.schema.items[0].attr : */ '',
                order: 'asc',
                iteration: 0,
                filterOn: [],
            },
            () => this.validateUniqueProps(),
        );
    }

    componentWillUnmount(): void {
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
        super.componentWillUnmount();
    }

    itemTable(attrItem: string, data: Record<string, any>, idx: number): JSX.Element | null {
        const { schema } = this.props;
        const schemaForAttribute =
            schema.items && schema.items.find((el: ConfigItemTableIndexed) => el.attr === attrItem);

        if (!schemaForAttribute) {
            return null;
        }

        const schemaItem = {
            items: {
                [attrItem]: schemaForAttribute,
            },
        };

        return (
            <ConfigPanel
                index={idx + this.state.iteration}
                arrayIndex={idx}
                changed={this.props.changed}
                globalData={this.props.data}
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
                schema={schemaItem as ConfigItemPanel}
                systemConfig={this.props.systemConfig}
                dateFormat={this.props.dateFormat}
                isFloatComma={this.props.isFloatComma}
                imagePrefix={this.props.imagePrefix}
                onCommandRunning={this.props.onCommandRunning}
                forceUpdate={this.props.forceUpdate}
                originalData={this.props.originalData}
                customs={this.props.customs}
                theme={this.props.theme}
                DeviceManager={this.props.DeviceManager}
                onChange={(attr: string, valueChange: any) => {
                    const newObj: Record<string, any>[] = JSON.parse(JSON.stringify(this.state.value));
                    newObj[idx][attr] = valueChange;
                    this.setState({ value: newObj }, () => {
                        this.validateUniqueProps();
                        this.onChangeWrapper(newObj, true);
                    });
                }}
                onError={(error: string, attr?: string) => this.onError(error, attr)}
                onBackEndCommand={this.props.onBackEndCommand}
            />
        );
    }

    /**
     * Validate that columns configured in `uniqueColumns` have unique values
     */
    validateUniqueProps(): void {
        if (!this.props.schema.uniqueColumns) {
            return;
        }

        for (const uniqueCol of this.props.schema.uniqueColumns) {
            const allVals: (string | number)[] = [];
            const found = this.state.value.find(entry => {
                const val = entry[uniqueCol];
                if (allVals.includes(val)) {
                    this.onError(uniqueCol, 'is not unique');
                    this.setState({
                        errorMessage: I18n.t('Non-allowed duplicate entry "%s" in column "%s"', val, uniqueCol),
                    });
                    return true;
                }
                allVals.push(val);
                return false;
            });

            if (!found) {
                this.onError(uniqueCol, null);
                this.setState({ errorMessage: '' });
            }
        }
    }

    static descendingComparator(a: Record<string, any>, b: Record<string, any>, orderBy: string): number {
        if (b[orderBy] < a[orderBy]) {
            return -1;
        }
        if (b[orderBy] > a[orderBy]) {
            return 1;
        }
        return 0;
    }

    static getComparator(
        order: 'desc' | 'asc',
        orderBy: string,
    ): (a: Record<string, any>, b: Record<string, any>) => number {
        return order === 'desc'
            ? (a: Record<string, any>, b: Record<string, any>) => ConfigTable.descendingComparator(a, b, orderBy)
            : (a: Record<string, any>, b: Record<string, any>) => -ConfigTable.descendingComparator(a, b, orderBy);
    }

    static getFilterValue(el: React.RefObject<HTMLInputElement>): string {
        return (el?.current?.children[0]?.children[0] as HTMLInputElement)?.value;
    }

    static setFilterValue(el: React.RefObject<HTMLInputElement>, filterValue: string): string {
        return ((el.current.children[0].children[0] as HTMLInputElement).value = filterValue);
    }

    handleRequestSort = (property: string, orderCheck: boolean = false): void => {
        const { order, orderBy } = this.state;
        //if (orderBy || 'asc') {
        const isAsc = orderBy === property && order === 'asc';
        const newOrder = orderCheck ? order : isAsc ? 'desc' : 'asc';
        const newValue = this.stableSort(newOrder, property);
        this.setState(
            { value: newValue, order: newOrder, orderBy: property, iteration: this.state.iteration + 10000 },
            () => this.applyFilter(false, newValue),
        );
        //}
    };

    stableSort = (order: 'desc' | 'asc', orderBy: string): Record<string, any>[] => {
        const { value } = this.state;
        const comparator = ConfigTable.getComparator(order, orderBy);
        const stabilizedThis = value.map((el, index) => ({ el, index }));

        stabilizedThis.sort((a, b) => {
            const order_ = comparator(a.el, b.el);
            if (order_ !== 0) {
                return order_;
            }
            return a.index - b.index;
        });

        return stabilizedThis.map(el => el.el);
    };

    enhancedTableHead(buttonsWidth: number, doAnyFilterSet: boolean): JSX.Element {
        const { schema } = this.props;
        const { order, orderBy } = this.state;
        return (
            <TableHead>
                <TableRow>
                    {schema.items &&
                        schema.items.map((headCell: ConfigItemTableIndexed, i: number) => (
                            <TableCell
                                style={{
                                    width:
                                        typeof headCell.width === 'string' && headCell.width.endsWith('%')
                                            ? headCell.width
                                            : headCell.width,
                                }}
                                key={`${headCell.attr}_${i}`}
                                align="left"
                                sortDirection={orderBy === headCell.attr ? order : false}
                            >
                                <div
                                    style={{
                                        ...styles.flex,
                                        ...(schema.showFirstAddOnTop ? { flexDirection: 'column' } : undefined),
                                    }}
                                >
                                    {!i && !schema.noDelete ? (
                                        <Tooltip
                                            title={
                                                doAnyFilterSet
                                                    ? I18n.t('ra_Cannot add items with set filter')
                                                    : I18n.t('ra_Add row')
                                            }
                                            slotProps={{ popper: { sx: styles.tooltip } }}
                                        >
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    disabled={!!doAnyFilterSet && !this.props.schema.allowAddByFilter}
                                                    onClick={this.onAdd}
                                                >
                                                    <AddIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    ) : null}
                                    {headCell.sort && (
                                        <TableSortLabel
                                            active
                                            style={orderBy !== headCell.attr ? styles.silver : undefined}
                                            direction={orderBy === headCell.attr ? order : 'asc'}
                                            onClick={() => this.handleRequestSort(headCell.attr)}
                                        />
                                    )}
                                    {headCell.filter && this.state.filterOn.includes(headCell.attr) ? (
                                        <TextField
                                            variant="standard"
                                            ref={this.filterRefs[headCell.attr]}
                                            onChange={() => this.applyFilter()}
                                            title={I18n.t('ra_You can filter entries by entering here some text')}
                                            slotProps={{
                                                input: {
                                                    endAdornment: ConfigTable.getFilterValue(
                                                        this.filterRefs[headCell.attr],
                                                    ) && (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    ConfigTable.setFilterValue(
                                                                        this.filterRefs[headCell.attr],
                                                                        '',
                                                                    );
                                                                    this.applyFilter();
                                                                }}
                                                            >
                                                                <CloseIcon />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                },
                                            }}
                                            fullWidth
                                            placeholder={this.getText(headCell.title)}
                                        />
                                    ) : (
                                        <span style={styles.headerText}>{this.getText(headCell.title)}</span>
                                    )}
                                    {headCell.filter ? (
                                        <IconButton
                                            title={I18n.t('ra_Show/hide filter input')}
                                            size="small"
                                            onClick={() => {
                                                const filterOn = [...this.state.filterOn];
                                                const pos = this.state.filterOn.indexOf(headCell.attr);
                                                if (pos === -1) {
                                                    filterOn.push(headCell.attr);
                                                } else {
                                                    filterOn.splice(pos, 1);
                                                }
                                                this.setState({ filterOn }, () => {
                                                    if (
                                                        pos &&
                                                        ConfigTable.getFilterValue(this.filterRefs[headCell.attr])
                                                    ) {
                                                        ConfigTable.setFilterValue(this.filterRefs[headCell.attr], '');
                                                        this.applyFilter();
                                                    }
                                                });
                                            }}
                                        >
                                            {this.state.filterOn.includes(headCell.attr) ? (
                                                <IconFilterOff />
                                            ) : (
                                                <IconFilterOn />
                                            )}
                                        </IconButton>
                                    ) : null}
                                </div>
                            </TableCell>
                        ))}
                    {!schema.noDelete && (
                        <TableCell
                            style={{
                                paddingLeft: 20,
                                paddingRight: 20,
                                width: buttonsWidth,
                                textAlign: 'right',
                            }}
                            padding="checkbox"
                        >
                            {schema.import ? (
                                <IconButton
                                    style={{ marginRight: 10 }}
                                    size="small"
                                    onClick={() => this.setState({ showImportDialog: true })}
                                    title={I18n.t('ra_import data from %s file', 'CSV')}
                                >
                                    <ImportIcon />
                                </IconButton>
                            ) : null}
                            {schema.export ? (
                                <IconButton
                                    style={{ marginRight: 10 }}
                                    size="small"
                                    onClick={() => this.onExport()}
                                    title={I18n.t('ra_Export data to %s file', 'CSV')}
                                >
                                    <ExportIcon />
                                </IconButton>
                            ) : null}
                            <IconButton
                                disabled
                                size="small"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </TableCell>
                    )}
                </TableRow>
            </TableHead>
        );
    }

    onDelete = (index: number) => (): void => {
        const newValue: Record<string, any>[] = JSON.parse(JSON.stringify(this.state.value));
        newValue.splice(index, 1);

        this.setState({ value: newValue, iteration: this.state.iteration + 10_000 }, () =>
            this.applyFilter(false, null, () => this.onChangeWrapper(newValue)),
        );
    };

    onExport(): void {
        const { schema } = this.props;
        const { value } = this.state;
        const cols = schema.items.map((it: ConfigItemTableIndexed) => it.attr);
        const lines = [cols.join(';')];
        value.forEach(row => {
            const line: string[] = [];
            schema.items.forEach((it: ConfigItemTableIndexed) => {
                if (row[it.attr]?.includes(';')) {
                    line.push(`"${row[it.attr]}"`);
                } else {
                    line.push(row[it.attr] === undefined || row[it.attr] === null ? '' : row[it.attr]);
                }
            });
            lines.push(line.join(';'));
        });
        const el = document.createElement('a');
        el.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(lines.join('\n'))}`);
        const now = new Date();
        el.setAttribute(
            'download',
            `${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getDate().toString().padStart(2, '0')}_${this.props.adapterName}.${this.props.instance}_${this.props.attr}.csv`,
        );

        el.style.display = 'none';
        document.body.appendChild(el);

        el.click();

        document.body.removeChild(el);
    }

    onImport(text: string): void {
        const lines = text.split('\n').map((line: string) => line.replace('\r', '').trim());
        // the first line is header
        const { schema } = this.props;

        const header = lines
            .shift()
            .split(';')
            .filter(it => it && schema.items.find((it2: ConfigItemTableIndexed) => it2.attr === it));

        const values: Record<string, any>[] = [];
        lines.forEach((line: string) => {
            const parts: string[] = line.split(';');
            const obj: Record<string, string | number | boolean> = {};
            for (let p = 0; p < parts.length; p++) {
                let value = parts[p];
                if (value.startsWith('"')) {
                    value = value.substring(1);
                    while (p < parts.length && !value.endsWith('"')) {
                        value += `;${parts[++p]}`;
                    }
                    value = value.substring(0, value.length - 1);
                }

                let val: string | number | boolean = value;

                if (value === 'true') {
                    val = true;
                } else if (value === 'false') {
                    val = false;
                } else if (window.isFinite(value as any as number)) {
                    const attr = this.props.schema.items.find((it: ConfigItemTableIndexed) => it.attr === header[p]);
                    if (attr && attr.type === 'number') {
                        // if a type of attribute is a "number"
                        val = parseFloat(value);
                    } else {
                        val = value;
                    }
                } else {
                    val = value;
                }

                obj[header[p]] = val;
            }
            values.push(obj);
        });

        if (values.length) {
            if (this.state.value?.length) {
                this.setState({ showTypeOfImportDialog: values, showImportDialog: false });
            } else {
                this.setState({ value: values, showImportDialog: false });
            }
        } else {
            window.alert('ra_No data found in file');
        }
    }

    onClone = (index: number) => (): void => {
        const newValue: Record<string, any>[] = JSON.parse(JSON.stringify(this.state.value));
        const cloned: Record<string, any> = JSON.parse(JSON.stringify(newValue[index]));
        if (typeof this.props.schema.clone === 'string' && typeof cloned[this.props.schema.clone] === 'string') {
            let i = 1;
            let text = cloned[this.props.schema.clone];
            const pattern = text.match(/(\d+)$/);
            if (pattern) {
                text = text.replace(pattern[0], '');
                i = parseInt(pattern[0], 10) + 1;
            } else {
                text += '_';
            }
            while (
                newValue.find(
                    (it: Record<string, any>) => it[this.props.schema.clone as string] === text + i.toString(),
                )
            ) {
                i++;
            }
            cloned[this.props.schema.clone] = `${cloned[this.props.schema.clone]}_${i}`;
        }

        newValue.splice(index, 0, cloned);

        this.setState({ value: newValue, iteration: this.state.iteration + 10000 }, () =>
            this.applyFilter(false, null, () => this.onChangeWrapper(newValue)),
        );
    };

    onChangeWrapper = (newValue: Record<string, any>[], updateVisible?: boolean): void => {
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }

        this.typingTimer = setTimeout(
            (value, _updateVisible) => {
                this.typingTimer = null;

                let mayBePromise: Promise<void> | void;
                if (this.props.schema.encryptedAttributes) {
                    const _value = JSON.parse(JSON.stringify(value));
                    _value.forEach((el: Record<string, any>) => {
                        this.props.schema.encryptedAttributes.forEach((attr: string) => {
                            if (el[attr]) {
                                el[attr] = encrypt(this.secret, el[attr]);
                            }
                        });
                    });

                    if (this.props.schema.objKeyName) {
                        const objValue = arrayToObject(
                            _value,
                            this.props.schema.objKeyName,
                            this.props.schema.objValueName,
                        );
                        mayBePromise = this.onChange(this.props.attr, objValue);
                    } else {
                        mayBePromise = this.onChange(this.props.attr, _value);
                    }
                } else if (this.props.schema.objKeyName) {
                    const objValue = arrayToObject(
                        JSON.parse(JSON.stringify(value)),
                        this.props.schema.objKeyName,
                        this.props.schema.objValueName,
                    );
                    mayBePromise = this.onChange(this.props.attr, objValue);
                } else {
                    mayBePromise = this.onChange(this.props.attr, value);
                }
                if (mayBePromise instanceof Promise) {
                    mayBePromise.catch(e => console.error(`Cannot save: ${e}`));
                }
                if (_updateVisible) {
                    this.applyFilter(false, value);
                    this.handleRequestSort(this.state.orderBy, true);
                }
            },
            300,
            newValue,
            updateVisible,
        );
    };

    onAdd = (): void => {
        const { schema } = this.props;
        const newValue: Record<string, any>[] = JSON.parse(JSON.stringify(this.state.value));
        const newItem = schema.items?.reduce(
            (accumulator: Record<string, any>, currentValue: ConfigItemTableIndexed) => {
                let defaultValue;
                if (currentValue.defaultFunc) {
                    if (this.props.custom) {
                        defaultValue = currentValue.defaultFunc
                            ? this.executeCustom(
                                  currentValue.defaultFunc,
                                  this.props.data,
                                  this.props.customObj,
                                  this.props.instanceObj,
                                  newValue.length,
                                  this.props.data,
                              )
                            : this.props.schema.default;
                    } else {
                        defaultValue = currentValue.defaultFunc
                            ? this.execute(
                                  currentValue.defaultFunc,
                                  this.props.schema.default,
                                  this.props.data,
                                  newValue.length,
                                  this.props.data,
                              )
                            : this.props.schema.default;
                    }
                } else {
                    defaultValue = currentValue.default === undefined ? null : currentValue.default;
                }

                accumulator[currentValue.attr] = defaultValue;
                return accumulator;
            },
            {},
        );

        newValue.push(newItem);

        this.setState({ value: newValue }, () => this.applyFilter(false, null, () => this.onChangeWrapper(newValue)));
    };

    isAnyFilterSet(): boolean {
        return !!Object.keys(this.filterRefs).find(attr => ConfigTable.getFilterValue(this.filterRefs[attr]));
    }

    applyFilter = (clear?: boolean, value?: Record<string, any>[], cb?: () => void): void => {
        value = value || this.state.value;
        let visibleValue = value.map((_, i) => i);
        Object.keys(this.filterRefs).forEach(attr => {
            let valueInputRef = ConfigTable.getFilterValue(this.filterRefs[attr]);
            if (!clear && valueInputRef) {
                valueInputRef = valueInputRef.toLowerCase();
                visibleValue = visibleValue.filter(
                    idx => value[idx] && value[idx][attr] && value[idx][attr].toLowerCase().includes(valueInputRef),
                );
            } else if (this.filterRefs[attr].current) {
                ConfigTable.setFilterValue(this.filterRefs[attr], '');
            }
        });

        if (visibleValue.length === value.length) {
            visibleValue = null;
        }

        if (visibleValue === null && this.state.visibleValue === null) {
            if (cb) {
                cb();
            }
            return;
        }

        if (JSON.stringify(visibleValue) !== JSON.stringify(this.state.visibleValue)) {
            this.setState({ visibleValue }, () => cb && cb());
        } else if (cb) {
            cb();
        }
    };

    onMoveUp(idx: number): void {
        const newValue: Record<string, any>[] = JSON.parse(JSON.stringify(this.state.value));
        const item = newValue[idx];
        newValue.splice(idx, 1);
        newValue.splice(idx - 1, 0, item);
        this.setState({ value: newValue, iteration: this.state.iteration + 10000 }, () =>
            this.applyFilter(false, null, () => this.onChangeWrapper(newValue)),
        );
    }

    onMoveDown(idx: number): void {
        const newValue: Record<string, any>[] = JSON.parse(JSON.stringify(this.state.value));
        const item = newValue[idx];
        newValue.splice(idx, 1);
        newValue.splice(idx + 1, 0, item);
        this.setState({ value: newValue, iteration: this.state.iteration + 10000 }, () =>
            this.applyFilter(false, null, () => this.onChangeWrapper(newValue)),
        );
    }

    onDrop(acceptedFiles: File[]): void {
        const file = acceptedFiles[0];
        const reader = new FileReader();

        reader.onabort = () => console.log('file reading was aborted');
        reader.onerror = () => console.log('file reading has failed');
        reader.onload = () => {
            if (file.size > MAX_SIZE) {
                window.alert(I18n.t('ra_File is too big. Max %sk allowed. Try use SVG.', Math.round(MAX_SIZE / 1024)));
                return;
            }
            const text = new Uint8Array(reader.result as ArrayBufferLike).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                '',
            );

            this.onImport(text);
        };
        reader.readAsArrayBuffer(file);
    }

    showTypeOfImportDialog(): JSX.Element | null {
        if (!this.state.showTypeOfImportDialog) {
            return null;
        }
        return (
            <Dialog
                open={!0}
                onClose={() => this.setState({ showTypeOfImportDialog: false })}
                maxWidth="md"
            >
                <DialogTitle>{I18n.t('ra_Append or replace?')}</DialogTitle>
                <DialogContent>
                    {I18n.t('ra_Append %s entries or replace existing?', this.state.showTypeOfImportDialog.length)}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="primary"
                        autoFocus
                        onClick={() => {
                            const value: Record<string, any>[] = JSON.parse(JSON.stringify(this.state.value));

                            (this.state.showTypeOfImportDialog as Record<string, any>[]).forEach(
                                (obj: Record<string, any>) => value.push(obj),
                            );

                            this.setState(
                                {
                                    value,
                                    iteration: this.state.iteration + 10000,
                                    showTypeOfImportDialog: false,
                                },
                                () => this.applyFilter(false, null, () => this.onChangeWrapper(value)),
                            );
                        }}
                    >
                        {I18n.t('ra_Append')}
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        autoFocus
                        onClick={() => {
                            const value: Record<string, any>[] = this.state.showTypeOfImportDialog as Record<
                                string,
                                any
                            >[];
                            this.setState(
                                {
                                    value,
                                    iteration: this.state.iteration + 10000,
                                    showTypeOfImportDialog: false,
                                },
                                () => this.applyFilter(false, null, () => this.onChangeWrapper(value)),
                            );
                        }}
                    >
                        {I18n.t('ra_Replace')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    showImportDialog(): JSX.Element | null {
        if (!this.state.showImportDialog) {
            return null;
        }
        return (
            <Dialog
                open={!0}
                onClose={() => this.setState({ showImportDialog: false })}
                sx={{
                    '& .MuiDialog-paper': {
                        minHeight: 500,
                    },
                }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>{I18n.t('ra_Import from %s', 'CSV')}</DialogTitle>
                <DialogContent>
                    <Dropzone
                        multiple={false}
                        accept={{ 'text/csv': ['.csv'] }}
                        maxSize={MAX_SIZE}
                        onDragEnter={() => this.setState({ uploadFile: 'dragging' })}
                        onDragLeave={() => this.setState({ uploadFile: true })}
                        onDrop={(acceptedFiles, errors) => {
                            this.setState({ uploadFile: false });
                            if (!acceptedFiles.length) {
                                window.alert(
                                    (errors &&
                                        errors[0] &&
                                        errors[0].errors &&
                                        errors[0].errors[0] &&
                                        errors[0].errors[0].message) ||
                                        I18n.t('ra_Cannot upload'),
                                );
                            } else {
                                this.onDrop(acceptedFiles);
                            }
                        }}
                    >
                        {({ getRootProps, getInputProps }) => (
                            <div
                                style={{
                                    ...styles.uploadDiv,
                                    ...(this.state.uploadFile === 'dragging' ? styles.uploadDivDragging : undefined),
                                    ...styles.dropZone,
                                    ...(!this.state.icon ? styles.dropZoneEmpty : undefined),
                                }}
                                {...getRootProps()}
                            >
                                <input {...getInputProps()} />
                                <div style={styles.uploadCenterDiv}>
                                    <div style={styles.uploadCenterTextAndIcon}>
                                        <ImportIcon style={styles.uploadCenterIcon} />
                                        <div style={styles.uploadCenterText}>
                                            {this.state.uploadFile === 'dragging'
                                                ? I18n.t('ra_Drop file here')
                                                : I18n.t(
                                                      'ra_Place your files here or click here to open the browse dialog',
                                                  )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Dropzone>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => this.setState({ showImportDialog: false })}
                        color="primary"
                        startIcon={<IconClose />}
                    >
                        {I18n.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
    iobUseMediaQuery(key: any): boolean {
        let query = this.props.theme.breakpoints.only(key);
        query = query.replace(/^@media( ?)/m, '');
        return window.matchMedia(query).matches;
    }
    enhancedFilterCard(/* buttonsWidth: number, doAnyFilterSet: boolean */): JSX.Element {
        const { schema } = this.props;
        const { order, orderBy } = this.state;
        let tdStyle: React.CSSProperties | undefined;
        if (this.props.schema.compact) {
            tdStyle = { paddingTop: 1, paddingBottom: 1 };
        }
        return (
            <Grid2
                /* key={`filterkey`} */
                size={{
                    xs: schema.xs || 12, // if xs is not defined, take the full width
                    sm: schema.sm || undefined,
                    md: schema.md || undefined,
                    lg: schema.lg || undefined,
                    xl: schema.xl || undefined,
                }}
            >
                <Card>
                    <Paper style={styles.paper}>
                        <Accordion style={styles.paper}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1-content"
                                id="panel1-header"
                            >
                                <Typography>Filter and Data Actions</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Table>
                                    <TableBody>
                                        {schema.items &&
                                            schema.items.map((headCell: ConfigItemTableIndexed, i: number) => (
                                                <TableRow key={`${headCell.attr}_${i}`}>
                                                    <TableCell
                                                        style={tdStyle}
                                                        align="left"
                                                        sortDirection={orderBy === headCell.attr ? order : false}
                                                    >
                                                        <div
                                                            style={{
                                                                ...styles.flex,
                                                                ...(schema.showFirstAddOnTop
                                                                    ? { flexDirection: 'column' }
                                                                    : undefined),
                                                            }}
                                                        >
                                                            {headCell.sort && (
                                                                <TableSortLabel
                                                                    active
                                                                    style={
                                                                        orderBy !== headCell.attr
                                                                            ? styles.silver
                                                                            : undefined
                                                                    }
                                                                    direction={
                                                                        orderBy === headCell.attr ? order : 'asc'
                                                                    }
                                                                    onClick={() =>
                                                                        this.handleRequestSort(headCell.attr)
                                                                    }
                                                                />
                                                            )}
                                                            {headCell.filter &&
                                                            this.state.filterOn.includes(headCell.attr) ? (
                                                                <TextField
                                                                    variant="standard"
                                                                    ref={this.filterRefs[headCell.attr]}
                                                                    onChange={() => this.applyFilter()}
                                                                    title={I18n.t(
                                                                        'ra_You can filter entries by entering here some text',
                                                                    )}
                                                                    slotProps={{
                                                                        input: {
                                                                            endAdornment: ConfigTable.getFilterValue(
                                                                                this.filterRefs[headCell.attr],
                                                                            ) && (
                                                                                <InputAdornment position="end">
                                                                                    <IconButton
                                                                                        size="small"
                                                                                        onClick={() => {
                                                                                            ConfigTable.setFilterValue(
                                                                                                this.filterRefs[
                                                                                                    headCell.attr
                                                                                                ],
                                                                                                '',
                                                                                            );
                                                                                            this.applyFilter();
                                                                                        }}
                                                                                    >
                                                                                        <CloseIcon />
                                                                                    </IconButton>
                                                                                </InputAdornment>
                                                                            ),
                                                                        },
                                                                    }}
                                                                    fullWidth
                                                                    placeholder={this.getText(headCell.title)}
                                                                />
                                                            ) : (
                                                                <span style={styles.headerText}>
                                                                    {this.getText(headCell.title)}
                                                                </span>
                                                            )}
                                                            {headCell.filter ? (
                                                                <IconButton
                                                                    title={I18n.t('ra_Show/hide filter input')}
                                                                    size="small"
                                                                    onClick={() => {
                                                                        const filterOn = [...this.state.filterOn];
                                                                        const pos = this.state.filterOn.indexOf(
                                                                            headCell.attr,
                                                                        );
                                                                        if (pos === -1) {
                                                                            filterOn.push(headCell.attr);
                                                                        } else {
                                                                            filterOn.splice(pos, 1);
                                                                        }
                                                                        this.setState({ filterOn }, () => {
                                                                            if (
                                                                                pos &&
                                                                                ConfigTable.getFilterValue(
                                                                                    this.filterRefs[headCell.attr],
                                                                                )
                                                                            ) {
                                                                                ConfigTable.setFilterValue(
                                                                                    this.filterRefs[headCell.attr],
                                                                                    '',
                                                                                );
                                                                                this.applyFilter();
                                                                            }
                                                                        });
                                                                    }}
                                                                >
                                                                    {this.state.filterOn.includes(headCell.attr) ? (
                                                                        <IconFilterOff />
                                                                    ) : (
                                                                        <IconFilterOn />
                                                                    )}
                                                                </IconButton>
                                                            ) : null}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        <TableRow key={`filter_actionsrow`}>
                                            <TableCell
                                                key={`actionshead_filter`}
                                                align="left"
                                                style={tdStyle}
                                            >
                                                <span style={styles.headerText}>{this.getText('Actions')}</span>
                                            </TableCell>
                                            <TableCell style={tdStyle}>
                                                {!schema.noDelete && schema.import ? (
                                                    <Tooltip
                                                        title={I18n.t('Import data from %s file', 'CSV')}
                                                        slotProps={{ popper: { sx: styles.tooltip } }}
                                                    >
                                                        <IconButton
                                                            /* style={{ marginRight: 10 }} */
                                                            size="small"
                                                            onClick={() => this.setState({ showImportDialog: true })}
                                                            /* title={I18n.t('ra_import data from %s file', 'CSV')} */
                                                        >
                                                            <ImportIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : null}
                                                {schema.export ? (
                                                    <Tooltip
                                                        title={I18n.t('ra_Export data to %s file', 'CSV')}
                                                        slotProps={{ popper: { sx: styles.tooltip } }}
                                                    >
                                                        <IconButton
                                                            /* style={{ marginRight: 10 }} */
                                                            size="small"
                                                            onClick={() => this.onExport()}
                                                            /* title={I18n.t('ra_Export data to %s file', 'CSV')} */
                                                        >
                                                            <ExportIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : null}
                                                <IconButton
                                                    disabled
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </AccordionDetails>
                        </Accordion>
                    </Paper>
                </Card>
            </Grid2>
        );
    }
    enhancedBottomCard(): JSX.Element {
        const { schema } = this.props;
        let tdStyle: React.CSSProperties | undefined;
        if (this.props.schema.compact) {
            tdStyle = { paddingTop: 1, paddingBottom: 1 };
        }
        const doAnyFilterSet = this.isAnyFilterSet();
        return (
            <Grid2
                key={`filterkey`}
                size={{
                    xs: schema.xs || 12, // if xs is not defined, take the full width
                    sm: schema.sm || undefined,
                    md: schema.md || undefined,
                    lg: schema.lg || undefined,
                    xl: schema.xl || undefined,
                }}
            >
                <Card>
                    <Paper style={styles.paper}>
                        <Table>
                            <TableBody>
                                <TableRow key={`filter_actionsrow`}>
                                    <TableCell
                                        colSpan={schema.items.length + 1}
                                        style={tdStyle}
                                    >
                                        <Tooltip
                                            title={
                                                doAnyFilterSet
                                                    ? I18n.t('ra_Cannot add items with set filter')
                                                    : I18n.t('ra_Add row')
                                            }
                                            slotProps={{ popper: { sx: styles.tooltip } }}
                                        >
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    disabled={!!doAnyFilterSet && !this.props.schema.allowAddByFilter}
                                                    onClick={this.onAdd}
                                                >
                                                    <AddIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Paper>
                </Card>
            </Grid2>
        );
    }
    renderCard(): JSX.Element | null {
        const { schema } = this.props;
        let { visibleValue } = this.state;
        let tdStyle: React.CSSProperties | undefined;
        if (this.props.schema.compact) {
            tdStyle = { paddingTop: 1, paddingBottom: 1 };
        }
        visibleValue = visibleValue || this.state.value.map((_, i) => i);

        const doAnyFilterSet = this.isAnyFilterSet();

        return (
            <Grid2 container>
                {this.showImportDialog()}
                {this.showTypeOfImportDialog()}
                {this.enhancedFilterCard(/* 0, doAnyFilterSet */)}
                {visibleValue.map((idx, i) => (
                    <Grid2
                        key={`${idx}_${i}`}
                        size={{
                            xs: schema.xs || 12, // if xs is not defined, take the full width
                            sm: schema.sm || undefined,
                            md: schema.md || undefined,
                            lg: schema.lg || undefined,
                            xl: schema.xl || undefined,
                        }}
                    >
                        <Card>
                            <Paper style={styles.paper}>
                                <Table>
                                    <TableBody>
                                        {schema.items &&
                                            schema.items.map((headCell: ConfigItemTableIndexed) => (
                                                <TableRow key={`${headCell.attr}_${idx}`}>
                                                    <TableCell
                                                        align="left"
                                                        style={tdStyle}
                                                    >
                                                        <span style={styles.headerText}>
                                                            {this.getText(headCell.title)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell
                                                        align="left"
                                                        style={tdStyle}
                                                    >
                                                        {this.itemTable(headCell.attr, this.state.value[idx], idx)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        <TableRow key={`${idx}_actionsrow`}>
                                            <TableCell
                                                key={`actionshead_${idx}`}
                                                align="left"
                                                style={tdStyle}
                                            >
                                                <span style={styles.headerText}>{this.getText('Actions')}</span>
                                            </TableCell>
                                            <TableCell
                                                key={`actionscontent_${idx}`}
                                                align="left"
                                                style={tdStyle}
                                            >
                                                {!doAnyFilterSet && !this.state.orderBy ? (
                                                    <Tooltip
                                                        title={I18n.t('ra_Move up')}
                                                        slotProps={{ popper: { sx: styles.tooltip } }}
                                                    >
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => this.onMoveUp(idx)}
                                                                disabled={i === 0}
                                                            >
                                                                <UpIcon />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                ) : null}
                                                {!doAnyFilterSet && !this.state.orderBy ? (
                                                    <Tooltip
                                                        title={I18n.t('ra_Move down')}
                                                        slotProps={{ popper: { sx: styles.tooltip } }}
                                                    >
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => this.onMoveDown(idx)}
                                                                disabled={i === visibleValue.length - 1}
                                                            >
                                                                <DownIcon />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                ) : null}
                                                <Tooltip
                                                    title={I18n.t('ra_Delete current row')}
                                                    slotProps={{ popper: { sx: styles.tooltip } }}
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={this.onDelete(idx)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                {this.props.schema.clone ? (
                                                    <Tooltip
                                                        title={I18n.t('ra_Clone current row')}
                                                        slotProps={{ popper: { sx: styles.tooltip } }}
                                                    >
                                                        <IconButton
                                                            size="small"
                                                            onClick={this.onClone(idx)}
                                                        >
                                                            <CopyContentIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : null}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Paper>
                        </Card>
                    </Grid2>
                ))}
                {this.enhancedBottomCard()}
            </Grid2>
        );
    }
    renderTable(): JSX.Element | null {
        const { schema } = this.props;
        let { visibleValue } = this.state;

        visibleValue = visibleValue || this.state.value.map((_, i) => i);

        const doAnyFilterSet = this.isAnyFilterSet();

        let tdStyle: React.CSSProperties | undefined;
        if (this.props.schema.compact) {
            tdStyle = { paddingTop: 1, paddingBottom: 1 };
        }

        return (
            <Paper style={styles.paper}>
                {this.showImportDialog()}
                {this.showTypeOfImportDialog()}
                {schema.label ? (
                    <div style={styles.label}>
                        <Toolbar
                            variant="dense"
                            style={styles.rootTool}
                        >
                            <Typography
                                style={styles.title}
                                variant="h6"
                                id="tableTitle"
                                component="div"
                            >
                                {this.getText(schema.label)}
                            </Typography>
                        </Toolbar>
                    </div>
                ) : null}
                <TableContainer>
                    <Table
                        style={styles.table}
                        size="small"
                    >
                        {this.enhancedTableHead(!doAnyFilterSet && !this.state.orderBy ? 120 : 64, doAnyFilterSet)}
                        <TableBody>
                            {visibleValue.map((idx, i) => (
                                <TableRow
                                    hover
                                    key={`${idx}_${i}`}
                                >
                                    {schema.items &&
                                        schema.items.map((headCell: ConfigItemTableIndexed) => (
                                            <TableCell
                                                key={`${headCell.attr}_${idx}`}
                                                align="left"
                                                style={tdStyle}
                                            >
                                                {this.itemTable(headCell.attr, this.state.value[idx], idx)}
                                            </TableCell>
                                        ))}
                                    {!schema.noDelete && (
                                        <TableCell
                                            align="left"
                                            style={{ ...tdStyle, ...styles.buttonCell }}
                                        >
                                            {!doAnyFilterSet && !this.state.orderBy ? (
                                                i ? (
                                                    <Tooltip
                                                        title={I18n.t('ra_Move up')}
                                                        slotProps={{ popper: { sx: styles.tooltip } }}
                                                    >
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => this.onMoveUp(idx)}
                                                        >
                                                            <UpIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <div style={styles.buttonEmpty} />
                                                )
                                            ) : null}
                                            {!doAnyFilterSet && !this.state.orderBy ? (
                                                i < visibleValue.length - 1 ? (
                                                    <Tooltip
                                                        title={I18n.t('ra_Move down')}
                                                        slotProps={{ popper: { sx: styles.tooltip } }}
                                                    >
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => this.onMoveDown(idx)}
                                                        >
                                                            <DownIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <div style={styles.buttonEmpty} />
                                                )
                                            ) : null}
                                            <Tooltip
                                                title={I18n.t('ra_Delete current row')}
                                                slotProps={{ popper: { sx: styles.tooltip } }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={this.onDelete(idx)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                            {this.props.schema.clone ? (
                                                <Tooltip
                                                    title={I18n.t('ra_Clone current row')}
                                                    slotProps={{ popper: { sx: styles.tooltip } }}
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={this.onClone(idx)}
                                                    >
                                                        <CopyContentIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : null}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                            {!schema.noDelete && visibleValue.length >= (schema.showSecondAddAt || 5) ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={schema.items.length + 1}
                                        style={{ ...tdStyle }}
                                    >
                                        <Tooltip
                                            title={
                                                doAnyFilterSet
                                                    ? I18n.t('ra_Cannot add items with set filter')
                                                    : I18n.t('ra_Add row')
                                            }
                                            slotProps={{ popper: { sx: styles.tooltip } }}
                                        >
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    disabled={!!doAnyFilterSet && !this.props.schema.allowAddByFilter}
                                                    onClick={this.onAdd}
                                                >
                                                    <AddIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ) : null}
                        </TableBody>
                    </Table>
                    {!visibleValue.length && this.state.value.length ? (
                        <div style={styles.filteredOut}>
                            <Typography
                                style={styles.title}
                                variant="h6"
                                id="tableTitle"
                                component="div"
                            >
                                {I18n.t('ra_All items are filtered out')}
                                <IconButton
                                    size="small"
                                    onClick={() => this.applyFilter(true)}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Typography>
                        </div>
                    ) : null}
                </TableContainer>
                {schema.help ? (
                    <FormHelperText>
                        {this.renderHelp(
                            this.props.schema.help,
                            this.props.schema.helpLink,
                            this.props.schema.noTranslation,
                        )}
                    </FormHelperText>
                ) : null}
                {this.state.errorMessage ? (
                    <div style={{ display: 'flex', padding: '5px' }}>
                        <ErrorIcon color="error" />
                        <span style={{ color: 'red', alignSelf: 'center' }}>{this.state.errorMessage}</span>
                    </div>
                ) : null}
            </Paper>
        );
    }
    renderItem(/* error, disabled, defaultValue */): JSX.Element | null {
        const { schema } = this.props;

        if (!this.state.value || !Array.isArray(this.state.value)) {
            return null;
        }

        const isBreakpoint = this.iobUseMediaQuery('xs')
            ? 'XS'
            : this.iobUseMediaQuery('sm')
              ? 'SM'
              : this.iobUseMediaQuery('md')
                ? 'MD'
                : this.iobUseMediaQuery('lg')
                  ? 'LG'
                  : this.iobUseMediaQuery('xl')
                    ? 'XL'
                    : '';

        if (schema.usecardfor && schema.usecardfor.map(el => el.toUpperCase()).includes(isBreakpoint)) {
            return this.renderCard();
        }
        return this.renderTable();
    }
}

export default ConfigTable;
