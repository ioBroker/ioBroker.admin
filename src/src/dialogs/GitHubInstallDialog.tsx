import React from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Paper from '@mui/material/Paper';
import {
    AppBar,
    Box,
    Checkbox,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Tab,
    Tabs,
    TextField,
    Autocomplete,
} from '@mui/material';
import { Styles, withStyles } from '@mui/styles';

import { FaGithub as GithubIcon } from 'react-icons/fa';
import UrlIcon from '@mui/icons-material/Language';
import SmsIcon from '@mui/icons-material/Sms';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

import { I18n, Icon } from '@iobroker/adapter-react-v5';

// @ts-expect-error adapt tsconfig
import npmIcon from '../assets/npm.png';

function a11yProps(index: number): {id: string; 'aria-controls': string} {
    return {
        id: `full-width-tab-${index}`,
        'aria-controls': `full-width-tabpanel-${index}`,
    };
}

const styles = ((theme: Record<string, any>) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: '100%',
    },
    paper: {
        maxWidth: 1000,
    },
    tabPaper: {
        padding: theme.spacing(2),
    },
    title: {
        marginTop: 10,
        padding: theme.spacing(1),
        marginLeft: theme.spacing(1),
        fontSize: 18,
        color: theme.palette.primary.main,
    },
    warningText: {
        color: '#f53939',
    },
    noteText: {
        marginTop: theme.spacing(2),
    },
    errorTextNoGit: {
        fontSize: 13,
        color: '#ff1616',
    },
    listIcon: {
        width: 24,
        height: 24,
    },
    listIconWithMargin: {
        width: 24,
        height: 24,
        marginRight: 8,
    },
    tabSelected: {
        color: theme.palette.mode === 'dark' ? theme.palette.secondary.contrastText : '#FFFFFF !important',
    },
} satisfies Styles<any, any>));

// some older browsers do not have `flat`
if (!Array.prototype.flat) {
    // eslint-disable-next-line
    Object.defineProperty(Array.prototype, 'flat', {
        configurable: true,
        value: function flat() {
            // eslint-disable-next-line
            const depth = Number.isNaN(arguments[0]) ? 1 : Number(arguments[0]);

            return depth ? Array.prototype.reduce.call(this, (acc: any, cur) => {
                if (Array.isArray(cur)) {
                    // @ts-expect-error fix later
                    // eslint-disable-next-line prefer-spread
                    acc.push.apply(acc, flat.call(cur, depth - 1));
                } else {
                    acc.push(cur);
                }

                return acc;
            }, []) : Array.prototype.slice.call(this);
        },
        writable: true,
    });
}

interface GitHubInstallDialogProps {
    categories: Record<string, any>[];
    repository: Record<string, any>;
    onClose: () => void;
    t: typeof I18n.t;
    /** Method to install adapter */
    installFromUrl: (adapter: string, debug: boolean, customUrl: boolean) => void;
    classes: Record<string, any>;
}

interface AutoCompleteValue {
    value: string;
    nogit: boolean;
    name: string;
    icon: string;
    title: string;
}

interface GitHubInstallDialogState {
    autoCompleteValue: AutoCompleteValue | null;
    /** If debug output is desired */
    debug: boolean;
    /** The selected url */
    url: string;
    /** Name of the current tab */
    currentTab: string;
}

class GitHubInstallDialog extends React.Component<GitHubInstallDialogProps, GitHubInstallDialogState> {
    constructor(props: GitHubInstallDialogProps) {
        super(props);

        this.state = {
            // @ts-expect-error check later
            autoCompleteValue: (window._localStorage || window.localStorage).getItem('App.autocomplete') || null,
            debug: (window._localStorage || window.localStorage).getItem('App.gitDebug') === 'true',
            url: (window._localStorage || window.localStorage).getItem('App.userUrl') || '',
            currentTab: (window._localStorage || window.localStorage).getItem('App.gitTab') || 'npm',
        };
    }

    render(): React.JSX.Element {
        // eslint-disable-next-line array-callback-return
        const list = (() => {
            const adapters = this.props.categories
                .map(category => category.adapters)
                .flat()
                .sort();

            return adapters
                .map((el, i) => {
                    if (i && adapters[i - 1] === el) {
                        return null;
                    }
                    const adapter = this.props.repository[el];
                    if (!adapter?.controller) {
                        const parts = (adapter.extIcon || adapter.meta || adapter.readme || '').toString().split('/');

                        let name = adapter?.name;
                        if (!name) {
                            name = adapter.titleLang;
                            if (name && typeof name === 'object') {
                                name = name[I18n.getLanguage()] || name.en;
                            } else {
                                name = adapter.title || el;
                            }
                        }

                        return {
                            value: `${el}/${parts[3]}`,
                            name: `${name} [${parts[3]}]`,
                            icon: adapter.extIcon || adapter.icon,
                            nogit: !!adapter.nogit,
                            title: el,
                        };
                    }
                    return null;
                })
                .filter(it => it)
                .sort((a: any, b: any) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
        });

        const closeInit = () => {
            this.setState({ autoCompleteValue: null, url: '' });
        };

        const _list = this.state.currentTab !== 'URL' ? list() : null;

        return <Dialog
            onClose={() => this.props.onClose()}
            open={!0}
            classes={{ paper: this.props.classes.paper }}
        >
            <DialogContent dividers>
                <div className={this.props.classes.root}>
                    <AppBar position="static" color="default">
                        <Tabs
                            value={this.state.currentTab}
                            onChange={(_e, newTab) => {
                                (window._localStorage || window.localStorage).setItem('App.gitTab', newTab);
                                this.setState({ currentTab: newTab });
                            }}
                            variant="fullWidth"
                            indicatorColor="secondary"
                        >
                            <Tab
                                label={this.props.t('From npm')}
                                wrapped
                                classes={{ selected: this.props.classes.tabSelected }}
                                icon={<img src={npmIcon} alt="npm" width={24} height={24} />}
                                {...a11yProps(0)}
                                value="npm"
                            />
                            <Tab
                                label={this.props.t('From github')}
                                wrapped
                                classes={{ selected: this.props.classes.tabSelected }}
                                icon={<GithubIcon style={{ width: 24, height: 24 }} width={24} height={24} />}
                                {...a11yProps(0)}
                                value="GitHub"
                            />
                            <Tab
                                label={this.props.t('Custom')}
                                wrapped
                                classes={{ selected: this.props.classes.tabSelected }}
                                icon={<UrlIcon width={24} height={24} />}
                                {...a11yProps(1)}
                                value="URL"
                            />
                        </Tabs>
                    </AppBar>
                    <div className={this.props.classes.title}>
                        {this.props.t('Install or update the adapter from %s', this.state.currentTab || 'npm')}
                    </div>
                    {this.state.currentTab === 'npm' ? <Paper className={this.props.classes.tabPaper}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={this.state.debug}
                                        onChange={e => {
                                            (window._localStorage || window.localStorage).setItem('App.gitDebug', e.target.checked ? 'true' : 'false');
                                            this.setState({ debug: e.target.checked });
                                        }}
                                    />
                                }
                                label={this.props.t('Debug outputs')}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <SmsIcon style={{ marginRight: 10 }} />
                            <Autocomplete
                                fullWidth
                                value={this.state.autoCompleteValue}
                                onChange={(_, newValue) => {
                                    // @ts-expect-error check later
                                    (window._localStorage || window.localStorage).setItem('App.autocomplete', newValue);
                                    this.setState({ autoCompleteValue: newValue });
                                }}
                                // @ts-expect-error check later
                                options={_list}
                                getOptionLabel={option => option?.name ?? ''}
                                renderInput={params => {
                                    const _params = { ...params };
                                    _params.InputProps = _params.InputProps || {};
                                    _params.InputProps.startAdornment = <InputAdornment position="start">
                                        <Icon src={this.state.autoCompleteValue?.icon || ''} className={this.props.classes.listIcon} />
                                    </InputAdornment>;

                                    return <TextField
                                        variant="standard"
                                        {...params}
                                        label={I18n.t('Select adapter')}
                                    />;
                                }}
                                renderOption={(props, option) =>
                                    <Box
                                        component="li"
                                        sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                                        {...props}
                                    >
                                        <Icon src={option?.icon || ''} className={this.props.classes.listIconWithMargin} />
                                        {option?.name ?? ''}
                                    </Box>}
                            />
                        </div>
                        <div style={{
                            fontSize: 24,
                            fontWeight: 'bold',
                            marginTop: 40,
                        }}
                        >
                            {this.props.t('Warning!')}
                        </div>
                        <div className={this.props.classes.warningText}>
                            {this.props.t('npm_warning', 'NPM', 'NPM')}
                        </div>
                        <div className={this.props.classes.noteText}>
                            {this.props.t('github_note')}
                        </div>
                    </Paper> : null}
                    {this.state.currentTab === 'GitHub' ? <Paper className={this.props.classes.tabPaper}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={this.state.debug}
                                        onChange={e => {
                                            (window._localStorage || window.localStorage).setItem('App.gitDebug', e.target.checked ? 'true' : 'false');
                                            this.setState({ debug: e.target.checked });
                                        }}
                                    />
                                }
                                label={this.props.t('Debug outputs')}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <SmsIcon style={{ marginRight: 10 }} />
                            <Autocomplete
                                fullWidth
                                value={this.state.autoCompleteValue}
                                getOptionDisabled={option => !!option?.nogit}
                                renderOption={(props, option) =>
                                    <Box
                                        component="li"
                                        sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                                        {...props}
                                    >
                                        <Icon src={option?.icon || ''} className={this.props.classes.listIconWithMargin} />
                                        {option?.name ?? ''}
                                        {option?.nogit && <div
                                            className={this.props.classes.errorTextNoGit}
                                        >
                                            {I18n.t('This adapter cannot be installed from git as must be built before installation.')}
                                        </div>}
                                    </Box>}
                                onChange={(_, newValue) => {
                                    // @ts-expect-error check later
                                    (window._localStorage || window.localStorage).setItem('App.autocomplete', newValue);
                                    this.setState({ autoCompleteValue: newValue });
                                }}
                                // @ts-expect-error check later
                                options={_list}
                                getOptionLabel={option => option?.name ?? ''}
                                renderInput={params => {
                                    const _params = { ...params };
                                    _params.InputProps = _params.InputProps || {};
                                    _params.InputProps.startAdornment = <InputAdornment position="start">
                                        <Icon
                                            src={this.state.autoCompleteValue?.icon || ''}
                                            className={this.props.classes.listIconWithMargin}
                                        />
                                    </InputAdornment>;

                                    return <TextField
                                        variant="standard"
                                        {...params}
                                        label={I18n.t('Select adapter')}
                                    />;
                                }}
                            />
                        </div>
                        <div style={{
                            fontSize: 24,
                            fontWeight: 'bold',
                            marginTop: 40,
                        }}
                        >
                            {this.props.t('Warning!')}
                        </div>
                        <div className={this.props.classes.warningText}>
                            {this.props.t('github_warning', 'GitHub', 'GitHub')}
                        </div>
                        <div className={this.props.classes.noteText}>
                            {this.props.t('github_note')}
                        </div>
                    </Paper> : null}
                    {this.state.currentTab === 'URL' ? <Paper className={this.props.classes.tabPaper}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <TextField
                                variant="standard"
                                fullWidth
                                label={this.props.t('URL')}
                                helperText={this.props.t('URL or file path')}
                                value={this.state.url}
                                onChange={event => {
                                    (window._localStorage || window.localStorage).setItem('App.userUrl', event.target.value);
                                    this.setState({ url: event.target.value });
                                }}
                                onKeyUp={event => {
                                    if (event.keyCode === 13 && this.state.url) {
                                        if (!this.state.url.includes('.')) {
                                            this.props.installFromUrl(`iobroker.${this.state.url}`, this.state.debug, true);
                                        } else {
                                            this.props.installFromUrl(this.state.url, this.state.debug, true);
                                        }
                                    }
                                }}
                                InputProps={{
                                    endAdornment: this.state.url ? <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => this.setState({ url: '' })}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </InputAdornment> : null,
                                }}
                            />
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        >
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={this.state.debug}
                                        onChange={e => {
                                            (window._localStorage || window.localStorage).setItem('App.gitDebug', e.target.checked ? 'true' : 'false');
                                            this.setState({ debug: e.target.checked });
                                        }}
                                    />
                                }
                                label={this.props.t('Debug outputs')}
                            />
                        </div>
                        <div
                            style={{
                                fontSize: 24,
                                fontWeight: 'bold',
                                marginTop: 40,
                            }}
                        >
                            {this.props.t('Warning!')}
                        </div>
                        <div className={this.props.classes.warningText}>
                            {this.props.t('github_warning', 'URL', 'URL')}
                        </div>
                        <div className={this.props.classes.noteText}>
                            {this.props.t('github_note')}
                        </div>
                    </Paper> : null}
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={((this.state.currentTab === 'GitHub' || this.state.currentTab === 'npm') && !this.state.autoCompleteValue?.value) || (this.state.currentTab === 'URL' && !this.state.url)}
                    autoFocus
                    onClick={() => {
                        if (this.state.currentTab === 'GitHub') {
                            const parts = (this.state.autoCompleteValue?.value || '').split('/');
                            const _url = `${parts[1]}/ioBroker.${parts[0]}`;
                            this.props.installFromUrl(_url, this.state.debug, true);
                        } else if (this.state.currentTab === 'URL') {
                            if (!this.state.url.includes('.')) {
                                this.props.installFromUrl(`iobroker.${this.state.url}`, this.state.debug, true);
                            } else {
                                this.props.installFromUrl(this.state.url, this.state.debug, true);
                            }
                        } else if (this.state.currentTab === 'npm') {
                            const parts = (this.state.autoCompleteValue?.value || '').split('/');
                            if (!parts[0].includes('.')) {
                                this.props.installFromUrl(`iobroker.${parts[0]}@latest`, this.state.debug, true);
                            } else {
                                this.props.installFromUrl(`${parts[0]}@latest`, this.state.debug, true);
                            }
                        }
                        this.props.onClose();
                        closeInit();
                    }}
                    color="primary"
                    startIcon={<CheckIcon />}
                >
                    {this.props.t('Install')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        this.props.onClose();
                        closeInit();
                    }}
                    // @ts-expect-error color is valid
                    color="grey"
                    startIcon={<CloseIcon />}
                >
                    {this.props.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

export default withStyles(styles)(GitHubInstallDialog);
