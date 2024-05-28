import React, { useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Paper,
    Typography,
    Box,
    AppBar,
} from '@mui/material';

import {
    Settings as SettingsIcon,
    Close as CloseIcon,
    Check as CheckIcon,
} from '@mui/icons-material';

import type { AdminConnection } from '@iobroker/adapter-react-v5';
import { I18n, Utils } from '@iobroker/adapter-react-v5';

import { ConfigPanel } from '@iobroker/json-config';
import type { Theme, ThemeName, ThemeType } from '@iobroker/adapter-react-v5/types';

const useStyles = makeStyles<Theme>(theme => ({
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
    pre: {
        overflow: 'auto',
        margin: 20,
        '& p': {
            fontSize: 18,
        },
    },
    blockInfo: {
        right: 20,
        top: 10,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        color: 'silver',
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
        },
    },
    message: {
        justifyContent: 'space-between',
        display: 'flex',
        width: '100%',
        alignItems: 'center',
    },
    column: {
        flexDirection: 'column',
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    descriptionHeaderText: {
        margin: '10px 0',
    },
    silver: {
        color: 'silver',
    },
    button: {
        paddingTop: 18,
        paddingBottom: 5,
        position: 'sticky',
        bottom: 0,
        background: 'white',
        zIndex: 3,
    },
    terminal: {
        fontFamily: 'monospace',
        fontSize: 14,
        marginLeft: 20,
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
        },
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
    headerBlockDisplay: {
        backgroundColor: '#272727',
        padding: 13,
        fontSize: 16,
        display: 'flex',
    },
    headerBlockDisplayItem: {
        padding: 13,
        fontSize: 16,
        display: 'flex',
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
        marginBottom: theme.spacing(2),
    },
}));

interface TabPanelProps {
    classes: Record<string, string>;
    children: React.JSX.Element;
    value: number;
    index: number;
    title: string;
    custom?: boolean;
}

const TabPanel: React.FC<TabPanelProps> = ({
    classes, children, value, index, title, custom, ...props
}) => {
    if (custom) {
        return <div
            {...props}
        >
            {value === index && children}
        </div>;
    }

    return (
        <div
            {...props}
        >
            {value === index &&
            <>
                <AppBar position="static" color="default">
                    <div className={classes.headerBlock}>
                        {title}
                    </div>
                </AppBar>
                <Box p={3}>
                    <Typography component="div">{children}</Typography>
                </Box>
            </>}
        </div>
    );
};

const types = {
    password: 'password',
    checkbox: 'checkbox',
    select: 'select',
    link: 'staticLink',
    comment: 'staticText',
    text: 'text',
    name: 'staticText',
    title: 'staticText',
};

const generateObj = <T, >(obj: Record<string, Record<string, T>>, path: string, value: T) => {
    const pathArray = path.split('.');
    pathArray.forEach((element, idx) => {
        if (idx === path.length - 1) {
            if (!obj[path[idx - 1]]) {
                obj[path[idx - 1]] = {};
            }
            obj[path[idx - 1]][element] = value;
        }
    });
    return obj;
};

interface SchemaItem {
    type: string;
    label: string;
    text: string;
    href: string;
    sm: number;
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
    socket: AdminConnection;
    newInstances: {
        _id: string;
        comment: {
            add: string[];
            inputs: {
                type: keyof typeof types;
                title: string;
                def: string;
            }[];
        };
    };
    onClose: (obj?: Record<string, Record<string, string | boolean | SchemaItem>>) => void;
}

const GenerateInputsModal: React.FC<GenerateInputsModalProps> = ({
    themeType, themeName, socket, newInstances, onClose,
}) => {
    const classes = useStyles();
    const [error, setError] = useState<Record<string, string>>({});

    const [schema, setSchema] = useState<{items:
        Record<string, Partial<SchemaItem>>;
}>({
    items: {},
});

    const [schemaData, setSchemaData] = useState<Record<string, SchemaItem | string | boolean>>({});

    useEffect(() => {
        const obj: {
            [key: number]: Partial<SchemaItem>;
        } = {};
        const objValue: {
            [key: string]: SchemaItem | string | boolean;
        } = {};
        if (newInstances) {
            newInstances.comment.add.forEach((text: string, idx: number) =>
                obj[idx] = { type: 'header', text });

            newInstances.comment.inputs.forEach((el: {
                type: keyof typeof types;
                title: string;
                def: string;
            }, idx: number) => {
                obj[idx + 1] = {
                    ...el,
                    type: types[el.type],
                    label: el.title,
                    text: el.def,
                    href: el.def,
                    sm: 6,
                    newLine: true,
                };

                if (el.type === 'link') {
                    obj[idx + 1].button = true;
                    obj[idx + 1].variant = 'contained';
                    obj[idx + 1].href = el.def;
                    obj[idx + 1].text = el.title;
                    obj[idx + 1].icon = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTExLjk5IDJDNi40NyAyIDIgNi40OCAyIDEyczQuNDcgMTAgOS45OSAxMEMxNy41MiAyMiAyMiAxNy41MiAyMiAxMlMxNy41MiAyIDExLjk5IDJ6bTYuOTMgNmgtMi45NWMtLjMyLTEuMjUtLjc4LTIuNDUtMS4zOC0zLjU2IDEuODQuNjMgMy4zNyAxLjkxIDQuMzMgMy41NnpNMTIgNC4wNGMuODMgMS4yIDEuNDggMi41MyAxLjkxIDMuOTZoLTMuODJjLjQzLTEuNDMgMS4wOC0yLjc2IDEuOTEtMy45NnpNNC4yNiAxNEM0LjEgMTMuMzYgNCAxMi42OSA0IDEycy4xLTEuMzYuMjYtMmgzLjM4Yy0uMDguNjYtLjE0IDEuMzItLjE0IDIgMCAuNjguMDYgMS4zNC4xNCAySDQuMjZ6bS44MiAyaDIuOTVjLjMyIDEuMjUuNzggMi40NSAxLjM4IDMuNTYtMS44NC0uNjMtMy4zNy0xLjktNC4zMy0zLjU2em0yLjk1LThINS4wOGMuOTYtMS42NiAyLjQ5LTIuOTMgNC4zMy0zLjU2QzguODEgNS41NSA4LjM1IDYuNzUgOC4wMyA4ek0xMiAxOS45NmMtLjgzLTEuMi0xLjQ4LTIuNTMtMS45MS0zLjk2aDMuODJjLS40MyAxLjQzLTEuMDggMi43Ni0xLjkxIDMuOTZ6TTE0LjM0IDE0SDkuNjZjLS4wOS0uNjYtLjE2LTEuMzItLjE2LTIgMC0uNjguMDctMS4zNS4xNi0yaDQuNjhjLjA5LjY1LjE2IDEuMzIuMTYgMiAwIC42OC0uMDcgMS4zNC0uMTYgMnptLjI1IDUuNTZjLjYtMS4xMSAxLjA2LTIuMzEgMS4zOC0zLjU2aDIuOTVjLS45NiAxLjY1LTIuNDkgMi45My00LjMzIDMuNTZ6TTE2LjM2IDE0Yy4wOC0uNjYuMTQtMS4zMi4xNC0yIDAtLjY4LS4wNi0xLjM0LS4xNC0yaDMuMzhjLjE2LjY0LjI2IDEuMzEuMjYgMnMtLjEgMS4zNi0uMjYgMmgtMy4zOHoiPjwvcGF0aD48L3N2Zz4=';
                }

                if (el.type === 'password') {
                    obj[idx + 1].repeat = true;
                }

                if (el.def !== undefined) {
                    objValue[idx + 1] = '';
                }

                if (el.type === 'checkbox') {
                    objValue[idx + 1] = false;
                }
            });
            setSchemaData(objValue);
            setSchema({ items: obj });
        }
    }, [newInstances]);

    return <Dialog
        onClose={onClose}
        open={!0}
        classes={{ paper: classes.paper }}
    >
        <h2 className={classes.heading}>
            <SettingsIcon style={{
                color: 'rgb(77 171 245)',
                fontSize: 36,
                marginLeft: 25,
                marginRight: 10,
            }}
            />
            {I18n.t('Instance parameters for %s', newInstances._id.replace('system.adapter.', ''))}
        </h2>
        <DialogContent className={Utils.clsx(classes.flex, classes.overflowHidden)} dividers>
            <div className={classes.root}>
                <TabPanel
                    value={1}
                    index={1}
                    custom
                    title={I18n.t('Test')}
                    classes={classes}
                >
                    <Paper className={classes.paperTable}>
                        {/*
                            @ts-expect-error missing param */}
                        <ConfigPanel
                            data={schemaData}
                            socket={socket}
                            themeType={themeType}
                            themeName={themeName}
                            onChange={setSchemaData}
                            schema={schema}
                            onError={(attr, _error) => setError({ ...error, [attr]: _error })}
                        />
                    </Paper>
                </TabPanel>
            </div>
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                autoFocus
                disabled={!!Object.keys(error).find(attr => error[attr])}
                onClick={() => {
                    let obj: Record<string, Record<string, string | boolean | SchemaItem>> = {};
                    let err = false;
                    Object.keys(schema.items).forEach((key: string) => {
                        if (schema.items[key].required) {
                            if (!schemaData[key] && schema.items[key].type !== 'checkbox') {
                                err = true;
                                alert(`no data ${schema.items[key].label}`);
                            } else {
                                obj = generateObj(obj, schema.items[key].name, schemaData[key]);
                            }
                        } else if (schema.items[key].name) {
                            err = false;
                            obj = generateObj(obj, schema.items[key].name, schemaData[key]);
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
                variant="contained"
                onClick={() => onClose()}
                color="grey"
                startIcon={<CloseIcon />}
            >
                {I18n.t('Close')}
            </Button>
        </DialogActions>
    </Dialog>;
};

export default GenerateInputsModal;
