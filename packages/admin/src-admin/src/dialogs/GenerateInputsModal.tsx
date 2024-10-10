import React, { useEffect, useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, Paper, Typography, Box, AppBar } from '@mui/material';

import { Settings as SettingsIcon, Close as CloseIcon, Check as CheckIcon } from '@mui/icons-material';

import { I18n, type AdminConnection, type ThemeName, type ThemeType, type IobTheme } from '@iobroker/react-components';

import { type ConfigItemPanel, ConfigPanel } from '@iobroker/json-config';

const styles: Record<string, React.CSSProperties> = {
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
    heading: {
        display: 'flex',
        alignItems: 'center',
    },
    headerBlock: {
        backgroundColor: '#272727',
        padding: 13,
        fontSize: 16,
    },
    paperTable: {
        width: '100%',
        marginBottom: 16,
    },
};

interface TabPanelProps {
    children: JSX.Element;
    value: number;
    index: number;
    title: string;
    custom?: boolean;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, title, custom, ...props }) => {
    if (custom) {
        return <div {...props}>{value === index && children}</div>;
    }

    return (
        <div {...props}>
            {value === index && (
                <>
                    <AppBar
                        position="static"
                        color="default"
                    >
                        <div style={styles.headerBlock}>{title}</div>
                    </AppBar>
                    <Box p={3}>
                        <Typography component="div">{children}</Typography>
                    </Box>
                </>
            )}
        </div>
    );
};
type InputType = 'password' | 'checkbox' | 'select' | 'link' | 'comment' | 'text' | 'name' | 'title';
type InputControlType = 'password' | 'checkbox' | 'select' | 'text' | 'staticText' | 'header';

const types: Record<InputType, InputControlType> = {
    password: 'password',
    checkbox: 'checkbox',
    select: 'select',
    link: 'staticText',
    comment: 'staticText',
    text: 'text',
    name: 'staticText',
    title: 'staticText',
};

interface DiscoveryInstanceCommentInput {
    /** Link to attribute, like: 'native.user' */
    name: string;
    def: string | boolean | number;
    type: InputType;
    title: string;
    options: Record<string, string | boolean | number>;
}

export interface DiscoveryInstanceComment {
    add?: boolean | string | number | string[];
    changed?: boolean | string | number | string[];
    extended?: boolean | string | number | string[];
    text?: string;
    ack?: boolean;
    inputs?: DiscoveryInstanceCommentInput[];
    license?: string;
}

export interface DiscoveryInstance {
    /** Adapter instance ID, like system.adapter.tr-064.0 */
    _id: `system.adapter.${string}.${number}`;
    common: {
        name: string;
        title?: string;
        licenseUrl?: ioBroker.StringOrTranslated;
    };
    comment: DiscoveryInstanceComment;
    native: Record<string, any>;
}

interface DiscoveryDevice {
    _addr: string;
    _name: string;
    _ping: {
        alive: boolean;
        ms: number;
    };
    _source: 'ping';
    _type: 'ip' | 'once';
    _dns?: {
        /** "fritz.box", "www.fritz.box" */
        hostnames: string[];
    };
}

export interface DiscoveryObject {
    _id: 'system.discovery';
    common: {
        name: ioBroker.StringOrTranslated;
    };
    type: 'config';
    native: {
        lastScan: string;
        newInstances: DiscoveryInstance[];
        devices: DiscoveryDevice[];
    };
}

function _setValueInObj(obj: Record<string, any>, path: string[], value: string | number | boolean): void {
    const attr = path.unshift();
    if (!path.length) {
        obj[attr] = value;
    } else {
        obj[attr] = obj[attr] || {};
        _setValueInObj(obj[attr], path, value);
    }
}

function setValueInObj(obj: Record<string, any>, path: string, value: string | number | boolean): void {
    const pathArray = path.split('.');

    _setValueInObj(obj, pathArray, value);
}

interface SchemaItem {
    type: InputControlType;
    label: string;
    text: string;
    href: string;
    sm: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    newLine: boolean;
    button: boolean;
    variant: 'contained';
    icon: string;
    repeat: boolean;
    required: boolean;
    name: string;
}

interface GenerateInputsModalProps {
    themeType: ThemeType;
    themeName: ThemeName;
    theme: IobTheme;
    socket: AdminConnection;
    newInstance: DiscoveryInstance;
    /** The result looks like { native: { attr1: value }} */
    onClose: (obj?: { native: Record<string, any> }) => void;
}

const GenerateInputsModal: React.FC<GenerateInputsModalProps> = ({
    theme,
    themeType,
    themeName,
    socket,
    newInstance,
    onClose,
}) => {
    const [error, setError] = useState<Record<string, string>>({});

    const [schema, setSchema] = useState<{ type: 'panel'; items: Record<string, Partial<SchemaItem>> }>({
        type: 'panel',
        items: {},
    });

    const [schemaData, setSchemaData] = useState<Record<string, string | boolean | number>>({});

    useEffect(() => {
        const objSchema: {
            [key: string]: Partial<SchemaItem>;
        } = {};
        const objValue: {
            [key: string]: string | boolean | number;
        } = {};
        if (newInstance?.comment?.add && Array.isArray(newInstance?.comment?.add)) {
            newInstance.comment.add.forEach((text: string, idx: number) => (objSchema[idx] = { type: 'header', text }));

            newInstance.comment.inputs.forEach((el, idx) => {
                objSchema[idx + 1] = {
                    ...el,
                    type: types[el.type],
                    label: el.title,
                    text: el.def ? el.def.toString() : '',
                    href: el.def ? el.def.toString() : '',
                    sm: 6,
                    newLine: true,
                };

                if (el.type === 'link') {
                    objSchema[idx + 1].button = true;
                    objSchema[idx + 1].variant = 'contained';
                    objSchema[idx + 1].href = el.def ? el.def.toString() : '';
                    objSchema[idx + 1].text = el.title;
                    objSchema[idx + 1].icon =
                        'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTExLjk5IDJDNi40NyAyIDIgNi40OCAyIDEyczQuNDcgMTAgOS45OSAxMEMxNy41MiAyMiAyMiAxNy41MiAyMiAxMlMxNy41MiAyIDExLjk5IDJ6bTYuOTMgNmgtMi45NWMtLjMyLTEuMjUtLjc4LTIuNDUtMS4zOC0zLjU2IDEuODQuNjMgMy4zNyAxLjkxIDQuMzMgMy41NnpNMTIgNC4wNGMuODMgMS4yIDEuNDggMi41MyAxLjkxIDMuOTZoLTMuODJjLjQzLTEuNDMgMS4wOC0yLjc2IDEuOTEtMy45NnpNNC4yNiAxNEM0LjEgMTMuMzYgNCAxMi42OSA0IDEycy4xLTEuMzYuMjYtMmgzLjM4Yy0uMDguNjYtLjE0IDEuMzItLjE0IDIgMCAuNjguMDYgMS4zNC4xNCAySDQuMjZ6bS44MiAyaDIuOTVjLjMyIDEuMjUuNzggMi40NSAxLjM4IDMuNTYtMS44NC0uNjMtMy4zNy0xLjktNC4zMy0zLjU2em0yLjk1LThINS4wOGMuOTYtMS42NiAyLjQ5LTIuOTMgNC4zMy0zLjU2QzguODEgNS41NSA4LjM1IDYuNzUgOC4wMyA4ek0xMiAxOS45NmMtLjgzLTEuMi0xLjQ4LTIuNTMtMS45MS0zLjk2aDMuODJjLS40MyAxLjQzLTEuMDggMi43Ni0xLjkxIDMuOTZ6TTE0LjM0IDE0SDkuNjZjLS4wOS0uNjYtLjE2LTEuMzItLjE2LTIgMC0uNjguMDctMS4zNS4xNi0yaDQuNjhjLjA5LjY1LjE2IDEuMzIuMTYgMiAwIC42OC0uMDcgMS4zNC0uMTYgMnptLjI1IDUuNTZjLjYtMS4xMSAxLjA2LTIuMzEgMS4zOC0zLjU2aDIuOTVjLS45NiAxLjY1LTIuNDkgMi45My00LjMzIDMuNTZ6TTE2LjM2IDE0Yy4wOC0uNjYuMTQtMS4zMi4xNC0yIDAtLjY4LS4wNi0xLjM0LS4xNC0yaDMuMzhjLjE2LjY0LjI2IDEuMzEuMjYgMnMtLjEgMS4zNi0uMjYgMmgtMy4zOHoiPjwvcGF0aD48L3N2Zz4=';
                }

                if (el.type === 'password') {
                    objSchema[idx + 1].repeat = true;
                }

                if (el.def !== undefined) {
                    objValue[idx + 1] = '';
                }

                if (el.type === 'checkbox') {
                    objValue[idx + 1] = false;
                }
            });
            setSchemaData(objValue);
            setSchema({ type: 'panel', items: objSchema });
        }
    }, [newInstance]);

    return (
        <Dialog
            onClose={onClose}
            open={!0}
            sx={{ '& .MuiDialog-paper': styles.paper }}
        >
            <h2 style={styles.heading}>
                <SettingsIcon
                    style={{
                        color: 'rgb(77 171 245)',
                        fontSize: 36,
                        marginLeft: 25,
                        marginRight: 10,
                    }}
                />
                {I18n.t('Instance parameters for %s', newInstance._id.replace('system.adapter.', ''))}
            </h2>
            <DialogContent
                style={{ ...styles.flex, ...styles.overflowHidden }}
                dividers
            >
                <div style={styles.root}>
                    <TabPanel
                        value={1}
                        index={1}
                        custom
                        title={I18n.t('Test')}
                    >
                        <Paper style={styles.paperTable}>
                            <ConfigPanel
                                data={schemaData}
                                socket={socket}
                                themeType={themeType}
                                themeName={themeName}
                                theme={theme}
                                onChange={setSchemaData}
                                schema={schema as unknown as ConfigItemPanel}
                                onError={(attr: string, _error?: string): void =>
                                    setError({ ...error, [attr]: _error })
                                }
                                // all unused properties
                                isFloatComma
                                instance={0}
                                alive
                                dateFormat="YYYY.MM.DD"
                                forceUpdate={() => {}}
                                onCommandRunning={() => {}}
                                changed={false}
                                adapterName="dummy"
                                originalData={schemaData}
                                common={{}}
                            />
                        </Paper>
                    </TabPanel>
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    id="inputs-modal-dialog-apply"
                    variant="contained"
                    autoFocus
                    disabled={!!Object.keys(error).find(attr => error[attr])}
                    onClick={() => {
                        const obj: { native: Record<string, any> } = { native: {} };
                        let err = false;
                        Object.keys(schema.items).forEach((key: string) => {
                            if (schema.items[key].required) {
                                if (!schemaData[key] && schema.items[key].type !== 'checkbox') {
                                    err = true;
                                    alert(`no data ${schema.items[key].label}`);
                                } else {
                                    setValueInObj(obj, schema.items[key].name, schemaData[key]);
                                }
                            } else if (schema.items[key].name) {
                                err = false;
                                setValueInObj(obj, schema.items[key].name, schemaData[key]);
                            }
                        });
                        if (!err) {
                            onClose(obj);
                        }
                    }}
                    color="primary"
                    startIcon={<CheckIcon />}
                >
                    {I18n.t('Apply')}
                </Button>
                <Button
                    id="inputs-modal-dialog-close"
                    variant="contained"
                    onClick={() => onClose()}
                    color="grey"
                    startIcon={<CloseIcon />}
                >
                    {I18n.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GenerateInputsModal;
