import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { AppBar, Box, makeStyles, Paper, ThemeProvider, Typography } from '@material-ui/core';

import VisibilityIcon from '@material-ui/icons/Visibility';
import CloseIcon from '@material-ui/icons/Close';

import I18n from '@iobroker/adapter-react/i18n';

import theme from '@iobroker/adapter-react/Theme';
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
    "password": "text",
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
const GenereteInputsModal = ({ themeType, themeName, socket, newInstances, onApplyModal, onCloseModal }) => {
    const classes = useStyles();

    const [open, setOpen] = useState(true);

    const onClose = () => {
        setOpen(false);
        if (node) {
            document.body.removeChild(node);
            node = null;
        }
    }

    // const black = themeType === 'dark';

    const [schema, setSchema] = useState({
        items: {}
    });

    const [schemaData, setSchemaData] = useState({});

    useEffect(() => {
        const obj = {};
        const objValue = {};
        if (newInstances) {
            console.log(newInstances)

            newInstances.comment.add.forEach((text, idx) => {
                obj[idx] = { type: 'header', text }
            })
            newInstances.comment.inputs.forEach((el, idx) => {
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
    }, [newInstances])

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
                    <TabPanel
                        value={1}
                        index={1}
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
                <Button
                    variant="contained"
                    autoFocus
                    onClick={() => {
                        let obj = {};
                        let error = false;
                        console.log(1, schemaData)
                        console.log(2, schema)
                        console.log(3, newInstances.comment.inputs)
                        Object.keys(schema.items).forEach(key => {
                            if (schema.items[key].required) {
                                if (!schemaData[key]) {
                                    error = true;
                                    alert(`no data ${schema.items[key].label}`);
                                } else {
                                    error = false;
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
                    color="primary">
                    {I18n.t('Apply')}
                </Button>
                <Button
                    variant="contained"
                    autoFocus
                    onClick={() => {
                        onClose();
                        setTimeout(() => onCloseModal(), 0);
                    }}
                    color="default">
                    <CloseIcon />
                    {I18n.t('Close')}
                </Button>
            </DialogActions>
        </Dialog >
    </ThemeProvider >;
}

export const GenereteInputsFunc = (themeType, themeName, socket, newInstances, onCloseModal, onApplyModal) => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderDiscoveryModal';
        document.body.appendChild(node);
    }
    return ReactDOM.render(<GenereteInputsModal onCloseModal={onCloseModal} newInstances={newInstances} onApplyModal={onApplyModal} themeName={themeName} themeType={themeType} socket={socket} />, node);
}