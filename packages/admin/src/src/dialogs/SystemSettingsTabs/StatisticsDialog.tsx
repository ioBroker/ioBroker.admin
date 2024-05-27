// StatisticsDialog.js

import React, { Component } from 'react';
import { type Styles, withStyles } from '@mui/styles';

import {
    Grid, Paper, Card, Typography, MenuItem,
    FormControl, Select, InputLabel,
} from '@mui/material';

import blueGrey from '@mui/material/colors/blueGrey';

import { withWidth } from '@iobroker/adapter-react-v5';
import { type Theme, type Translator } from '@iobroker/adapter-react-v5/types';
import type { ioBrokerObject } from '@/types';
import Utils from '@/Utils';
import Editor from '../../components/Editor';

// eslint-disable-next-line no-undef
(window as any).ace.config.set('basePath', 'lib/js/ace');

const styles: Styles<Theme, any> = theme => ({
    tabPanel: {
        width: '100%',
        height: '100% ',
        overflow: 'auto',
        padding: 15,
        // backgroundColor: blueGrey[ 50 ]
    },
    note: {
        padding: 15,
        backgroundColor: blueGrey[500],
        color: '#FFF',
        overflow: 'auto',
        flex: 'none',
    },
    sentData: {
        padding: 15,
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: '100%',
    },
    descriptionPanel: {
        width: '100%',
        backgroundColor: 'transparent',
        border: 'none',
        overflow: 'auto',
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
});

interface StatisticsDialogProps {
    t: Translator;
    data: ioBrokerObject<object, {diag: string}>;
    dataAux: ioBrokerObject;
    themeType: string;
    onChange: (data: ioBrokerObject<object, {diag: string}>) => void;
    saving: boolean;
    handle: (type: string) => void;
    classes: Record<string, string>;
}

class StatisticsDialog extends Component<StatisticsDialogProps> {
    static getTypes() {
        return [
            {
                id: 'none',
                title: 'none',
            },
            {
                id: 'normal',
                title: 'normal',
            },
            {
                id: 'no-city',
                title: 'no-city',
            },
            {
                id: 'extended',
                title: 'extended',
            },
        ];
    }

    getTypesSelector() {
        const { classes } = this.props;
        const { common } = this.props.data;
        const items = StatisticsDialog.getTypes().map((elem, index) =>
            <MenuItem value={elem.title} key={index}>
                {this.props.t(elem.title)}
            </MenuItem>);

        return <FormControl variant="standard" className={classes.formControl}>
            <InputLabel shrink id="statistics-label">
                {this.props.t('Statistics')}
            </InputLabel>
            <Select
                disabled={this.props.saving}
                variant="standard"
                className={classes.formControl}
                id="statistics"
                value={common.diag}
                displayEmpty
                onChange={this.handleChangeType}
            >
                {items}
            </Select>
        </FormControl>;
    }

    doChange(name: string, value: string) {
        const newData = Utils.clone(this.props.data);
        newData.common[name] = value;
        this.props.onChange(newData);
    }

    handleChangeType = (evt: { target: { value: string } }) => {
        this.doChange('diag', evt.target.value);
        if (this.props.handle) {
            this.props.handle(evt.target.value);
        }
    };

    render() {
        const { classes } = this.props;
        return <div className={classes.tabPanel} style={{ height: '100%' }}>
            <Grid container spacing={3} className="sendData-grid" style={{ height: '100%' }}>
                <Grid item lg={4} md={4} xs={12} style={{ display: 'flex', flexDirection: 'column' }}>
                    <Card className={classes.note}>
                        <Typography gutterBottom variant="h6" component="div">
                            {this.props.t('Note:')}
                        </Typography>
                        <Typography
                            paragraph
                            variant="body2"
                            component="div"
                            dangerouslySetInnerHTML={{ __html: this.props.t('diag-note') }}
                        />
                    </Card>
                    {this.getTypesSelector()}
                    {this.props.dataAux ? <Paper
                        variant="outlined"
                        className={classes.descriptionPanel}
                    >
                        <ul>
                            {Object.keys(this.props.dataAux).map(key => <li key={key}>{key}</li>)}
                        </ul>
                    </Paper> : null}
                </Grid>
                <Grid
                    item
                    lg={8}
                    md={4}
                    xs={12}
                    className="sendData-grid"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                    <Paper className={classes.sentData}>
                        <Typography gutterBottom variant="h6" component="div">
                            {this.props.t('Sent data:')}
                        </Typography>
                    </Paper>
                    <Editor
                        editValueMode
                        themeType={this.props.themeType}
                        value={JSON.stringify(this.props.dataAux, null, 2)}
                    />
                </Grid>
            </Grid>
        </div>;
    }
}

export default withWidth()(withStyles(styles)(StatisticsDialog));
