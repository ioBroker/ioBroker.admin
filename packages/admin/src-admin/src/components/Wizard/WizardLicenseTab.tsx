import React, { createRef, Component } from 'react';

import {
    Toolbar,
    MenuItem,
    Grid,
    Select,
    FormControlLabel,
    Checkbox,
    Button,
    FormControl,
    InputLabel,
    Paper,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle, LinearProgress,
} from '@mui/material';

import {
    Language as IconWorld,
    Close as IconCancel,
    Check as IconCheck, Close,
} from '@mui/icons-material';

import {
    type AdminConnection,
    I18n, type ThemeType,
    type Translate, withWidth,
} from '@iobroker/adapter-react-v5';

import Editor from '@/components/Editor';
import LicenseTexts from '../LicenseTexts';

const TOOLBAR_HEIGHT = 64;

const styles: Record<string, any> = {
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
    gridDiv: {
        height: `calc(100% - ${TOOLBAR_HEIGHT}px)`,
        width: '100%',
        overflow: 'hidden',
        padding: 16,
        textAlign: 'center',
    },
    languageSelect: {
        minWidth: 200,
        marginRight: 24,
    },
    licenseDiv: {
        width: '100%',
        height: `calc(100% - ${65 + 88}px)`,
        overflow: 'auto',
    },
    grow: {
        flexGrow: 1,
    },
    statAccept: {
        marginTop: 10,
        color: '#ff636e',
    },
    statAcceptDiv: {
        display: 'inline-block',
    },
    statAcceptNote: {
        textAlign: 'left',
        marginLeft: 32,
    },
    greenButton: {
        marginLeft: 8,
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
        lineHeight: `${TOOLBAR_HEIGHT}px`,
    },
    licenseTextDiv: {
        width: '100%',
        maxWidth: 600,
        textAlign: 'left',
        margin: 'auto',
    },
    licenseText: {
        marginBottom: 15,
    },
};

interface WizardLicenseTabProps {
    t: Translate;
    onDone: (config: { lang: ioBroker.Languages }) => void;
    lang?: ioBroker.Languages;
    socket: AdminConnection;
    themeType: ThemeType;
}

interface WizardLicenseTabState {
    statisticsAccepted: boolean;
    lang: ioBroker.Languages;
    notAgree: boolean;
    showStatisticsDialog: boolean;
    requesting: boolean;
    diagData: Record<string, any> | null;
}

class WizardLicenseTab extends Component<WizardLicenseTabProps, WizardLicenseTabState> {
    private readonly focusRef: React.RefObject<HTMLButtonElement>;

    constructor(props: WizardLicenseTabProps) {
        super(props);

        this.state = {
            statisticsAccepted: false,
            lang: this.props.lang || I18n.getLanguage(),
            notAgree: false,
            diagData: null,
            requesting: false,
            showStatisticsDialog: false,
        };

        this.focusRef = createRef();
    }

    componentDidMount() {
        this.focusRef.current?.focus();
    }

    async readStatistics() {
        // Get current host
        const instance = await this.props.socket.getCurrentInstance();
        // read settings of current instance
        const settings: ioBroker.InstanceObject = (await this.props.socket.getObject(`system.adapter.${instance}`)) as any as ioBroker.InstanceObject;

        const diagData = await this.props.socket.getDiagData(settings.common.host, 'extended');

        this.setState({ diagData, requesting: false });
    }

    renderStatisticsDialog() {
        if (!this.state.showStatisticsDialog) {
            return null;
        }
        return <Dialog
            open={!0}
            maxWidth="lg"
            fullWidth
            sx={{ '& .MuiDialog-paper': { maxHeight: 'calc(100% - 96px)', height: 'calc(100% - 96px)' } }}
            onClose={() => this.setState({ showStatisticsDialog: false })}
        >
            <DialogTitle>{this.props.t('Sent data:')}</DialogTitle>
            <DialogContent>
                {this.state.requesting && <LinearProgress />}
                {this.state.requesting && <div>{this.props.t('Requesting data...')}</div>}
                {!this.state.requesting && <div style={{ fontSize: 14, marginBottom: 8 }}>{this.props.t('The sent data will only be processed by ioBroker GmbH for statistical purposes and will not be shared with any third parties.')}</div>}
                {!this.state.requesting && <Editor
                    style={{ height: 'calc(100% - 41px)' }}
                    editValueMode
                    themeType={this.props.themeType}
                    value={JSON.stringify(this.state.diagData, null, 2)}
                />}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    onClick={() => this.setState({ showStatisticsDialog: false })}
                    color="primary"
                    autoFocus
                    startIcon={<Close />}
                >
                    {I18n.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderNotAgree() {
        if (!this.state.notAgree) {
            return null;
        }
        return <Dialog
            open={!0}
            onClose={() => this.setState({ notAgree: false })}
        >
            <DialogTitle>{this.props.t('Message')}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    <span role="img" aria-label="unhappy">😒</span>
                    {' '}
                    {this.props.t('Sorry, you cannot use ioBroker.')}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    onClick={() => this.setState({ notAgree: false })}
                    color="primary"
                    startIcon={<IconCheck />}
                >
                    {I18n.t('Understand')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderLicenseText() {
        const text = LicenseTexts[I18n.getLanguage()] || LicenseTexts.en;
        const lines = text.split('\n');
        return <div style={styles.licenseTextDiv}>
            {lines.map((line, i) =>
                <div style={styles.licenseText} key={i}>{line}</div>)}
        </div>;
    }

    render() {
        return <Paper style={styles.paper}>
            <Grid container style={styles.gridDiv} direction="column">
                <Grid item>
                    <FormControl variant="standard" style={styles.languageSelect}>
                        <InputLabel>
                            <IconWorld />
                            {this.props.t('Language')}
                        </InputLabel>
                        <Select
                            variant="standard"
                            value={I18n.getLanguage()}
                            onChange={e => {
                                I18n.setLanguage(e.target.value as ioBroker.Languages);
                                this.setState({ lang: e.target.value as ioBroker.Languages });
                            }}
                        >
                            <MenuItem value="en">English</MenuItem>
                            <MenuItem value="de">Deutsch</MenuItem>
                            <MenuItem value="ru">русский</MenuItem>
                            <MenuItem value="pt">Portugues</MenuItem>
                            <MenuItem value="nl">Nederlands</MenuItem>
                            <MenuItem value="fr">français</MenuItem>
                            <MenuItem value="it">Italiano</MenuItem>
                            <MenuItem value="es">Espanol</MenuItem>
                            <MenuItem value="pl">Polski</MenuItem>
                            <MenuItem value="uk">Українська</MenuItem>
                            <MenuItem value="zh-cn">简体中文</MenuItem>
                        </Select>
                    </FormControl>
                    <div style={styles.statAcceptDiv}>
                        <FormControlLabel
                            style={styles.statAccept}
                            control={<Checkbox ref={this.focusRef} checked={this.state.statisticsAccepted} onChange={e => this.setState({ statisticsAccepted: e.target.checked })} />}
                            label={this.props.t('I agree with the collection of anonymous statistics.')}
                        />
                        <div style={styles.statAcceptNote}>
                            {this.props.t('(This can be disabled later in settings)')}
                            <Button
                                variant="outlined"
                                style={{ marginLeft: 16 }}
                                onClick={() =>
                                    this.setState({ showStatisticsDialog: true, requesting: true }, () =>
                                        this.readStatistics())}
                            >
                                {this.props.t('Show sent statistics data')}
                            </Button>
                        </div>
                    </div>
                </Grid>
                <Grid item>
                    <h1>{this.props.t('License terms')}</h1>
                </Grid>
                <Grid item style={styles.licenseDiv}>
                    {this.renderLicenseText()}
                </Grid>
            </Grid>
            <Toolbar style={styles.toolbar}>
                <div style={styles.grow} />
                <Button
                    variant="contained"
                    color="grey"
                    onClick={() => this.setState({ notAgree: true })}
                    startIcon={<IconCancel />}
                >
                    {this.props.t('Not agree')}
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    style={styles.greenButton}
                    disabled={!this.state.statisticsAccepted}
                    onClick={() => this.props.onDone({ lang: this.state.lang })}
                    startIcon={<IconCheck />}
                >
                    {this.props.t('Agree')}
                </Button>
                <div style={styles.grow} />
            </Toolbar>
            {this.renderNotAgree()}
            {this.renderStatisticsDialog()}
        </Paper>;
    }
}

export default withWidth()(WizardLicenseTab);
