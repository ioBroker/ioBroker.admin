import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import clsx from 'clsx';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { AppBar, Box, Paper, Typography } from '@mui/material';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';

import I18n from '@iobroker/adapter-react-v5/i18n';

import ConfigPanel from '../components/JsonConfigComponent/ConfigPanel';
import CheckIcon from '@mui/icons-material/Check';

let node = null;

const useStyles = makeStyles(theme => ({
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
const GenerateInputsModal = ({ themeType, themeName, socket, newInstances, onApplyModal, onCloseModal, theme }) => {
    const classes = useStyles();

    const [open, setOpen] = useState(true);
    const [error, setError] = useState({});

    const onClose = () => {
        setOpen(false);
        if (node) {
            try {
                window.document.body.removeChild(node);
            } catch (e) {
                // ignore
            }
            node = null;
        }
    }

    const isError = () => Object.keys(error).find(attr => error[attr]);

    // const black = themeType === 'dark';

    const [schema, setSchema] = useState({
        items: {}
    });

    const [schemaData, setSchemaData] = useState({});

    useEffect(() => {
        const obj = {};
        let objValue = {};
        if (newInstances) {
            newInstances.comment.add.forEach((text, idx) =>
                obj[idx] = { type: 'header', text });

            newInstances.comment.inputs.forEach((el, idx) => {
                obj[idx + 1] = {
                    ...el, type: types[el.type], label: el.title, text: el.def, href: el.def,
                    'sm': 6,
                    'newLine': true,
                };

                if (el.type === 'link') {
                    obj[idx + 1].button = true;
                    obj[idx + 1].variant = "contained";
                    obj[idx + 1].href = el.def;
                    obj[idx + 1].text = el.title;
                    obj[idx + 1].icon = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTExLjk5IDJDNi40NyAyIDIgNi40OCAyIDEyczQuNDcgMTAgOS45OSAxMEMxNy41MiAyMiAyMiAxNy41MiAyMiAxMlMxNy41MiAyIDExLjk5IDJ6bTYuOTMgNmgtMi45NWMtLjMyLTEuMjUtLjc4LTIuNDUtMS4zOC0zLjU2IDEuODQuNjMgMy4zNyAxLjkxIDQuMzMgMy41NnpNMTIgNC4wNGMuODMgMS4yIDEuNDggMi41MyAxLjkxIDMuOTZoLTMuODJjLjQzLTEuNDMgMS4wOC0yLjc2IDEuOTEtMy45NnpNNC4yNiAxNEM0LjEgMTMuMzYgNCAxMi42OSA0IDEycy4xLTEuMzYuMjYtMmgzLjM4Yy0uMDguNjYtLjE0IDEuMzItLjE0IDIgMCAuNjguMDYgMS4zNC4xNCAySDQuMjZ6bS44MiAyaDIuOTVjLjMyIDEuMjUuNzggMi40NSAxLjM4IDMuNTYtMS44NC0uNjMtMy4zNy0xLjktNC4zMy0zLjU2em0yLjk1LThINS4wOGMuOTYtMS42NiAyLjQ5LTIuOTMgNC4zMy0zLjU2QzguODEgNS41NSA4LjM1IDYuNzUgOC4wMyA4ek0xMiAxOS45NmMtLjgzLTEuMi0xLjQ4LTIuNTMtMS45MS0zLjk2aDMuODJjLS40MyAxLjQzLTEuMDggMi43Ni0xLjkxIDMuOTZ6TTE0LjM0IDE0SDkuNjZjLS4wOS0uNjYtLjE2LTEuMzItLjE2LTIgMC0uNjguMDctMS4zNS4xNi0yaDQuNjhjLjA5LjY1LjE2IDEuMzIuMTYgMiAwIC42OC0uMDcgMS4zNC0uMTYgMnptLjI1IDUuNTZjLjYtMS4xMSAxLjA2LTIuMzEgMS4zOC0zLjU2aDIuOTVjLS45NiAxLjY1LTIuNDkgMi45My00LjMzIDMuNTZ6TTE2LjM2IDE0Yy4wOC0uNjYuMTQtMS4zMi4xNC0yIDAtLjY4LS4wNi0xLjM0LS4xNC0yaDMuMzhjLjE2LjY0LjI2IDEuMzEuMjYgMnMtLjEgMS4zNi0uMjYgMmgtMy4zOHoiPjwvcGF0aD48L3N2Zz4='
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

    return <ThemeProvider theme={theme}>
        <Dialog
            onClose={onClose}
            open={open}
            classes={{ paper: classes.paper }}
        >
            <h2 className={classes.heading}>
                <SettingsIcon style={{
                    color: 'rgb(77 171 245)',
                    fontSize: 36,
                    marginLeft: 25,
                    marginRight: 10
                }} />
                {I18n.t('Instance parameters for %s', newInstances._id.replace('system.adapter.', ''))}</h2>
            <DialogContent className={clsx(classes.flex, classes.overflowHidden)} dividers>
                <div className={classes.root}>
                    <TabPanel
                        value={1}
                        index={1}
                        custom
                        title={I18n.t('Test')}
                    >
                        <Paper className={classes.paperTable}>
                            <ConfigPanel
                                data={schemaData}
                                socket={socket}
                                themeType={themeType}
                                themeName={themeName}
                                onChange={setSchemaData}
                                schema={schema}
                                onError={(attr, _error) => setError({...error, [attr]: _error})}
                            />
                        </Paper>
                    </TabPanel>
                </div>
            </DialogContent >
            <DialogActions>
                <Button
                    variant="contained"
                    autoFocus
                    disabled= {isError()}
                    onClick={() => {
                        let obj = {};
                        let error = false;
                        Object.keys(schema.items).forEach(key => {
                            if (schema.items[key].required) {
                                if (!schemaData[key] && schema.items[key].type !== "checkbox") {
                                    error = true;
                                    alert(`no data ${schema.items[key].label}`);
                                } else {
                                    obj = generateObj(obj, schema.items[key].name, schemaData[key]);
                                }
                            } else if (schema.items[key].name) {
                                error = false;
                                obj = generateObj(obj, schema.items[key].name, schemaData[key]);
                            }
                        })
                        if (!error) {
                            onApplyModal(obj);
                            onClose();
                        }
                    }}
                    color="primary"
                    startIcon={<CheckIcon/>}
                >
                    {I18n.t('Apply')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        onClose();
                        setTimeout(() => onCloseModal(), 0);
                    }}
                    color="grey"
                    startIcon={<CloseIcon />}
                >
                    {I18n.t('Close')}
                </Button>
            </DialogActions>
        </Dialog >
    </ThemeProvider >;
}

export const generateInputsFunc = (themeType, themeName, socket, newInstances, theme, onCloseModal, onApplyModal) => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderDiscoveryModal';
        document.body.appendChild(node);
    }
    const root = createRoot(node);

    return root.render(<StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
            <GenerateInputsModal onCloseModal={onCloseModal} newInstances={newInstances} onApplyModal={onApplyModal} themeName={themeName} themeType={themeType} theme={theme} socket={socket} />
        </ThemeProvider>
    </StyledEngineProvider>);
}
