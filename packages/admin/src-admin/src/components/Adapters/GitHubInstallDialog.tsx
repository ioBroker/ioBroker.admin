import React, { type JSX } from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Paper,
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

import { FaGithub as GithubIcon } from 'react-icons/fa';
import {
    Language as UrlIcon,
    Sms as SmsIcon,
    Close as CloseIcon,
    Check as CheckIcon,
    Delete,
} from '@mui/icons-material';

import { I18n, Icon, type IobTheme } from '@iobroker/adapter-react-v5';

import type { RepoAdapterObject } from '@/components/Adapters/Utils';
import type { AdapterRatingInfo, InstalledInfo } from '@/components/Adapters/AdapterInstallDialog';

import npmIcon from '../../assets/npm.svg';

function a11yProps(name: string): { id: string; 'aria-controls': string } {
    return {
        id: `github-install-dialog-tab-${name}`,
        'aria-controls': `github-install-dialog-panel-${name}`,
    };
}

const styles: Record<string, any> = {
    root: (theme: IobTheme) => ({
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: '100%',
    }),
    paper: {
        maxWidth: 1000,
    },
    tabPaper: {
        padding: 16,
    },
    title: (theme: IobTheme) => ({
        mt: '10px',
        p: 1,
        ml: 1,
        fontSize: 18,
        color: theme.palette.primary.main,
    }),
    warningText: {
        color: '#f53939',
    },
    noteText: {
        marginTop: 16,
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
    tabSelected: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? theme.palette.secondary.contrastText : '#222 !important',
    }),
};

// some older browsers do not have `flat`
function arrayFlat(arr: (string[] | string)[]): string[] {
    const result: string[] = [];
    for (let i = 0; i < arr.length; i++) {
        if (typeof arr[i] === 'object') {
            (arr[i] as string[]).forEach((item: string) => result.push(item));
        } else {
            result.push(arr[i] as string);
        }
    }
    return result;
}

interface GitHubInstallDialogProps {
    categories: {
        name: string;
        translation: string;
        count: number;
        installed: number;
        adapters: string[];
    }[];
    repository: Record<string, RepoAdapterObject & { rating?: AdapterRatingInfo }>;
    installed: InstalledInfo;
    onClose: () => void;
    t: typeof I18n.t;
    /** Method to install adapter */
    installFromUrl: (adapter: string, debug: boolean, customUrl: boolean) => Promise<void>;
    /** Upload the adapter */
    upload: (adapter: string) => void;
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
    /** History of custom commands */
    customHistory: string[];
}

const MAX_HISTORY_LENGTH = 10;

class GitHubInstallDialog extends React.Component<GitHubInstallDialogProps, GitHubInstallDialogState> {
    constructor(props: GitHubInstallDialogProps) {
        super(props);

        let customHistory = [];
        const customHistoryStr = ((window as any)._localstorage || window.localStorage).getItem('App.npmHistory');
        if (customHistoryStr) {
            try {
                customHistory = JSON.parse(customHistoryStr);
            } catch {
                // ignore
            }
        }
        this.state = {
            autoCompleteValue:
                ((window as any)._localstorage || window.localStorage).getItem('App.autocomplete') || null,
            debug: ((window as any)._localstorage || window.localStorage).getItem('App.gitDebug') === 'true',
            url: ((window as any)._localstorage || window.localStorage).getItem('App.userUrl') || '',
            currentTab: ((window as any)._localstorage || window.localStorage).getItem('App.gitTab') || 'npm',
            customHistory,
        };
    }

    renderNpm(): JSX.Element | null {
        return this.state.currentTab === 'npm' ? (
            <Paper
                style={styles.tabPaper}
                id="github-install-dialog-panel-npm"
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={this.state.debug}
                                onChange={e => {
                                    ((window as any)._localstorage || window.localStorage).setItem(
                                        'App.gitDebug',
                                        e.target.checked ? 'true' : 'false',
                                    );
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
                            ((window as any)._localstorage || window.localStorage).setItem(
                                'App.autocomplete',
                                newValue,
                            );
                            this.setState({ autoCompleteValue: newValue });
                        }}
                        options={this.getList()}
                        getOptionLabel={option => option?.name ?? ''}
                        renderInput={params => {
                            const _params = { ...params };
                            _params.InputProps = _params.InputProps || ({} as any);
                            _params.InputProps.startAdornment = (
                                <InputAdornment position="start">
                                    <Icon
                                        src={this.state.autoCompleteValue?.icon || ''}
                                        style={styles.listIcon}
                                    />
                                </InputAdornment>
                            );

                            return (
                                <TextField
                                    variant="standard"
                                    {...params}
                                    label={I18n.t('Select adapter')}
                                />
                            );
                        }}
                        renderOption={(props, option) => (
                            <Box
                                component="li"
                                sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                                {...props}
                            >
                                <Icon
                                    src={option?.icon || ''}
                                    style={styles.listIconWithMargin}
                                />
                                {option?.name ?? ''}
                            </Box>
                        )}
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
                <div style={styles.warningText}>{this.props.t('npm_warning', 'NPM', 'NPM')}</div>
                <div style={styles.noteText}>{this.props.t('github_note')}</div>
            </Paper>
        ) : null;
    }

    renderGitHub(): JSX.Element | null {
        return this.state.currentTab === 'GitHub' ? (
            <Paper
                style={styles.tabPaper}
                id="github-install-dialog-panel-github"
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={this.state.debug}
                                onChange={e => {
                                    ((window as any)._localstorage || window.localStorage).setItem(
                                        'App.gitDebug',
                                        e.target.checked ? 'true' : 'false',
                                    );
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
                        renderOption={(props, option) => (
                            <Box
                                component="li"
                                sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                                {...props}
                            >
                                <Icon
                                    src={option?.icon || ''}
                                    style={styles.listIconWithMargin}
                                />
                                {option?.name ?? ''}
                                {option?.nogit && (
                                    <div style={styles.errorTextNoGit}>
                                        {I18n.t(
                                            'This adapter cannot be installed from git as must be built before installation.',
                                        )}
                                    </div>
                                )}
                            </Box>
                        )}
                        onChange={(_, newValue) => {
                            ((window as any)._localstorage || window.localStorage).setItem(
                                'App.autocomplete',
                                newValue,
                            );
                            this.setState({ autoCompleteValue: newValue });
                        }}
                        options={this.getList()}
                        getOptionLabel={option => option?.name ?? ''}
                        renderInput={params => {
                            const _params = { ...params };
                            _params.InputProps = _params.InputProps || ({} as any);
                            _params.InputProps.startAdornment = (
                                <InputAdornment position="start">
                                    <Icon
                                        src={this.state.autoCompleteValue?.icon || ''}
                                        style={styles.listIconWithMargin}
                                    />
                                </InputAdornment>
                            );

                            return (
                                <TextField
                                    variant="standard"
                                    {...params}
                                    label={I18n.t('Select adapter')}
                                />
                            );
                        }}
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
                <div style={styles.warningText}>{this.props.t('github_warning', 'GitHub', 'GitHub')}</div>
                <div style={styles.noteText}>{this.props.t('github_note')}</div>
            </Paper>
        ) : null;
    }

    renderCustom(): JSX.Element | null {
        return this.state.currentTab === 'URL' ? (
            <Paper
                style={styles.tabPaper}
                id="github-install-dialog-panel-custom"
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={this.state.debug}
                                onChange={e => {
                                    ((window as any)._localstorage || window.localStorage).setItem(
                                        'App.gitDebug',
                                        e.target.checked ? 'true' : 'false',
                                    );
                                    this.setState({ debug: e.target.checked });
                                }}
                            />
                        }
                        label={this.props.t('Debug outputs')}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Autocomplete
                        fullWidth
                        value={this.state.url || ''}
                        onInputChange={(_, newValue) => {
                            ((window as any)._localstorage || window.localStorage).setItem(
                                'App.userUrl',
                                newValue || '',
                            );
                            this.setState({ url: newValue });
                        }}
                        onChange={(_, newValue) => {
                            ((window as any)._localstorage || window.localStorage).setItem(
                                'App.userUrl',
                                newValue || '',
                            );
                            this.setState({ url: newValue });
                        }}
                        renderOption={(props, option) => (
                            <Box
                                component="li"
                                {...props}
                                style={{ display: 'flex', alignItems: 'left' }}
                            >
                                {option}
                                <div style={{ flexGrow: 1 }} />
                                <IconButton
                                    size="small"
                                    onClick={e => {
                                        e.stopPropagation();
                                        const customHistory = this.state.customHistory.filter(it => it !== option);
                                        ((window as any)._localstorage || window.localStorage).setItem(
                                            'App.npmHistory',
                                            JSON.stringify(customHistory),
                                        );
                                        this.setState({ customHistory });
                                    }}
                                >
                                    <Delete />
                                </IconButton>
                            </Box>
                        )}
                        freeSolo
                        options={this.state.customHistory}
                        renderInput={params => (
                            <TextField
                                variant="standard"
                                {...params}
                                onKeyUp={event => {
                                    if (event.key === 'Enter' && this.state.url) {
                                        const customHistory = this.state.customHistory.filter(url => url !== this.state.url);
                                        customHistory.unshift(this.state.url);
                                        if (customHistory.length > MAX_HISTORY_LENGTH) {
                                            customHistory.pop();
                                        }
                                        ((window as any)._localstorage || window.localStorage).setItem(
                                            'App.npmHistory',
                                            JSON.stringify(customHistory),
                                        );

                                        if (!this.state.url.includes('.')) {
                                            void this.props.installFromUrl(
                                                `iobroker.${this.state.url}`,
                                                this.state.debug,
                                                true,
                                            );
                                        } else {
                                            void this.props.installFromUrl(this.state.url, this.state.debug, true);
                                        }
                                        this.setState({ autoCompleteValue: null, url: '' });
                                        this.props.onClose();
                                    }
                                }}
                                helperText={this.props.t('URL or file path')}
                                label={this.props.t('URL')}
                            />
                        )}
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
                <div style={styles.warningText}>{this.props.t('github_warning', 'URL', 'URL')}</div>
                <div style={styles.noteText}>{this.props.t('github_note')}</div>
            </Paper>
        ) : null;
    }

    getList(): ({ value: string; name: string; icon: string; nogit: boolean; title: string } | null)[] {
        const adaptersArrays: string[][] = this.props.categories.map(category => category.adapters);
        const adapters: string[] = arrayFlat(adaptersArrays);
        adapters.sort();

        return adapters
            .map((el, i) => {
                if (i && adapters[i - 1] === el) {
                    return null;
                }
                const adapter = this.props.repository[el];
                if (!adapter?.controller) {
                    // @ts-expect-error meta / readme
                    const parts = (adapter.extIcon || adapter.meta || adapter.readme || '').toString().split('/');

                    let name: ioBroker.StringOrTranslated = adapter?.name;
                    if (!name) {
                        name = adapter.titleLang;
                        if (name && typeof name === 'object') {
                            name = name[I18n.getLanguage()] || name.en;
                        } else {
                            name = adapter.title || el;
                        }
                    }

                    const item = {
                        value: `${el}/${parts[3]}`,
                        name: `${name} [${parts[3]}]`,
                        icon: adapter.extIcon || adapter.icon,
                        nogit: !!adapter.nogit,
                        title: el,
                    };

                    // If installed, take the icon from local web server
                    if (this.props.installed[name] && name !== 'admin') {
                        item.icon = `/adapter/${el}/${adapter.icon.split('/admin/').pop()}`;
                    }

                    return item;
                }
                return null;
            })
            .filter(it => it)
            .sort((a: any, b: any) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    }

    render(): JSX.Element {
        const closeInit = (): void => this.setState({ autoCompleteValue: null, url: '' });

        return (
            <Dialog
                onClose={() => this.props.onClose()}
                open={!0}
                sx={{ '& .MuiDialog-paper': styles.paper }}
            >
                <DialogContent dividers>
                    <Box
                        component="div"
                        sx={styles.root}
                    >
                        <AppBar
                            position="static"
                            color="default"
                        >
                            <Tabs
                                value={this.state.currentTab}
                                onChange={(_e, newTab) => {
                                    ((window as any)._localstorage || window.localStorage).setItem(
                                        'App.gitTab',
                                        newTab,
                                    );
                                    this.setState({ currentTab: newTab });
                                }}
                                variant="fullWidth"
                                indicatorColor="secondary"
                            >
                                <Tab
                                    label={this.props.t('From npm')}
                                    wrapped
                                    sx={{ '&.Mui-selected': styles.tabSelected }}
                                    icon={
                                        <img
                                            src={npmIcon}
                                            alt="npm"
                                            width={24}
                                            height={24}
                                        />
                                    }
                                    {...a11yProps('npm')}
                                    value="npm"
                                />
                                <Tab
                                    label={this.props.t('From github')}
                                    wrapped
                                    sx={{ '&.Mui-selected': styles.tabSelected }}
                                    icon={
                                        <GithubIcon
                                            style={{ width: 24, height: 24 }}
                                            width={24}
                                            height={24}
                                        />
                                    }
                                    {...a11yProps('github')}
                                    value="GitHub"
                                />
                                <Tab
                                    label={this.props.t('Custom')}
                                    wrapped
                                    sx={{ '&.Mui-selected': styles.tabSelected }}
                                    icon={
                                        <UrlIcon
                                            width={24}
                                            height={24}
                                        />
                                    }
                                    {...a11yProps('custom')}
                                    value="URL"
                                />
                            </Tabs>
                        </AppBar>
                        <Box
                            component="div"
                            sx={styles.title}
                        >
                            {this.props.t('Install or update the adapter from %s', this.state.currentTab || 'npm')}
                        </Box>
                        {this.renderNpm()}
                        {this.renderGitHub()}
                        {this.renderCustom()}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        id="github-install-dialog-ok"
                        variant="contained"
                        disabled={
                            ((this.state.currentTab === 'GitHub' || this.state.currentTab === 'npm') &&
                                !this.state.autoCompleteValue?.value) ||
                            (this.state.currentTab === 'URL' && !this.state.url)
                        }
                        autoFocus
                        onClick={async () => {
                            if (this.state.currentTab === 'GitHub') {
                                const parts = (this.state.autoCompleteValue?.value || '').split('/');
                                const _url = `${parts[1]}/ioBroker.${parts[0]}`;
                                void this.props.installFromUrl(_url, this.state.debug, true);
                            } else if (this.state.currentTab === 'URL') {
                                const customHistory = this.state.customHistory.filter(url => url !== this.state.url);
                                customHistory.unshift(this.state.url);
                                if (customHistory.length > MAX_HISTORY_LENGTH) {
                                    customHistory.pop();
                                }
                                ((window as any)._localstorage || window.localStorage).setItem(
                                    'App.npmHistory',
                                    JSON.stringify(customHistory),
                                );

                                if (!this.state.url.includes('.')) {
                                    void this.props.installFromUrl(
                                        `iobroker.${this.state.url}`,
                                        this.state.debug,
                                        true,
                                    );
                                } else {
                                    void this.props.installFromUrl(this.state.url, this.state.debug, true);
                                }
                            } else if (this.state.currentTab === 'npm') {
                                const fullAdapterName = (this.state.autoCompleteValue?.value || '').split('/')[0];
                                const adapterName = fullAdapterName.includes('.')
                                    ? fullAdapterName.split('.')[1]
                                    : fullAdapterName;

                                try {
                                    await this.props.installFromUrl(
                                        `iobroker.${adapterName}@latest`,
                                        this.state.debug,
                                        true,
                                    );
                                    // on npm installations we want to perform an additional upload
                                    this.props.upload(adapterName);
                                } catch (e) {
                                    console.error(`Installation from url failed: ${e.message}`);
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
                        id="github-install-dialog-close"
                        variant="contained"
                        onClick={() => {
                            this.props.onClose();
                            closeInit();
                        }}
                        color="grey"
                        startIcon={<CloseIcon />}
                    >
                        {this.props.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default GitHubInstallDialog;
