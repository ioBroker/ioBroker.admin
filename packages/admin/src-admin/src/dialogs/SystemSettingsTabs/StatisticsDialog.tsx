import React from 'react';

import {
    Grid2,
    Paper,
    Card,
    Typography,
    MenuItem,
    FormControl,
    Select,
    InputLabel,
    type SelectChangeEvent,
} from '@mui/material';

import blueGrey from '@mui/material/colors/blueGrey';

import { withWidth, type Translate, type ThemeType } from '@iobroker/adapter-react-v5';
import AdminUtils from '@/AdminUtils';
import Editor from '../../components/Editor';
import BaseSystemSettingsDialog from './BaseSystemSettingsDialog';

// eslint-disable-next-line no-undef
(window as any).ace.config.set('basePath', 'lib/js/ace');

const styles: Record<string, React.CSSProperties> = {
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
        margin: 8,
        minWidth: '100%',
    },
    descriptionPanel: {
        width: '100%',
        backgroundColor: 'transparent',
        border: 'none',
        overflow: 'auto',
    },
    selectEmpty: {
        marginTop: 16,
    },
};

interface StatisticsDialogProps {
    t: Translate;
    data: ioBroker.SystemConfigObject;
    dataAux: Record<string, any> | null;
    themeType: ThemeType;
    onChange: (data: ioBroker.SystemConfigObject) => void;
    saving: boolean;
    handle: (type: string) => void;
}

class StatisticsDialog extends BaseSystemSettingsDialog<StatisticsDialogProps> {
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
        const { common } = this.props.data;

        const items = StatisticsDialog.getTypes().map((elem, index) => (
            <MenuItem value={elem.title} key={index}>
                {this.props.t(elem.title)}
            </MenuItem>
        ));

        return (
            <FormControl variant="standard" style={styles.formControl}>
                <InputLabel shrink id="statistics-label">
                    {this.props.t('Statistics')}
                </InputLabel>
                <Select
                    disabled={this.props.saving}
                    variant="standard"
                    style={styles.formControl}
                    id="statistics"
                    value={common.diag}
                    displayEmpty
                    onChange={(e: SelectChangeEvent<'none' | 'normal' | 'no-city' | 'extended'>) =>
                        this.handleChangeType(e.target.value as 'none' | 'normal' | 'no-city' | 'extended')
                    }
                >
                    {items}
                </Select>
            </FormControl>
        );
    }

    doChange(name: string, value: string) {
        const newData = AdminUtils.clone(this.props.data);
        (newData.common as Record<string, any>)[name] = value;
        this.props.onChange(newData);
    }

    handleChangeType = (value: 'none' | 'normal' | 'no-city' | 'extended') => {
        this.doChange('diag', value);
        if (this.props.handle) {
            this.props.handle(value);
        }
    };

    render() {
        return (
            <div style={{ ...styles.tabPanel, height: '100%' }}>
                <Grid2 container spacing={3} className="sendData-grid" style={{ height: '100%' }}>
                    <Grid2 size={{ lg: 4, md: 4, xs: 12 }} style={{ display: 'flex', flexDirection: 'column' }}>
                        <Card style={styles.note}>
                            <Typography gutterBottom variant="h6" component="div">
                                {this.props.t('Note:')}
                            </Typography>
                            <Typography
                                variant="body2"
                                component="div"
                                dangerouslySetInnerHTML={{ __html: this.props.t('diag-note') }}
                            />
                        </Card>
                        {this.getTypesSelector()}
                        {this.props.dataAux ? (
                            <Paper variant="outlined" style={styles.descriptionPanel}>
                                <ul>
                                    {Object.keys(this.props.dataAux).map(key => (
                                        <li key={key}>{key}</li>
                                    ))}
                                </ul>
                            </Paper>
                        ) : null}
                    </Grid2>
                    <Grid2
                        size={{ lg: 8, md: 4, xs: 12 }}
                        className="sendData-grid"
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                        <Paper style={styles.sentData}>
                            <Typography gutterBottom variant="h6" component="div">
                                {this.props.t('Sent data:')}
                            </Typography>
                        </Paper>
                        <Editor
                            editValueMode
                            themeType={this.props.themeType}
                            value={JSON.stringify(this.props.dataAux, null, 2)}
                        />
                    </Grid2>
                </Grid2>
            </div>
        );
    }
}

export default withWidth()(StatisticsDialog);
