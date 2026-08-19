import React, { Component, type JSX } from 'react';

import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogContent,
    LinearProgress,
    Snackbar,
    Step,
    StepButton,
    StepLabel,
    Stepper,
    Typography,
} from '@mui/material';

// Icons
import { PlayArrow as PlayArrowIcon, Check as CheckIcon } from '@mui/icons-material';

import {
    Router,
    ToggleThemeMenu,
    I18n,
    type AdminConnection,
    type ThemeName,
    type ThemeType,
} from '@iobroker/gui-components';

import WizardPasswordTab from '@/components/Wizard/WizardPasswordTab';
import WizardLicenseTab from '@/components/Wizard/WizardLicenseTab';
import WizardFinishImage from '@/assets/wizard-finish.jpg';
import WizardWelcomeImage from '@/assets/wizard-welcome.jpg';
import Logo from '@/assets/logo.svg';
import LongLogo from '@/assets/longLogo.svg';
import WizardSettingsTab, { type WizardSettings } from '@/components/Wizard/WizardSettingsTab';
import WizardAuthSSLTab from '@/components/Wizard/WizardAuthSSLTab';
import WizardPortForwarding from '@/components/Wizard/WizardPortForwarding';
import WizardAdaptersTab from '@/components/Wizard/WizardAdaptersTab';
import WizardRoomsTab from '@/components/Wizard/WizardRoomsTab';
import { adminHref } from '@/helpers/utils';

/** All steps of the wizard in their order */
const ALL_STEPS = [
    'welcome',
    'license',
    'password',
    'auth',
    'forwarding',
    'settings',
    'rooms',
    'adapters',
    'finish',
] as const;

type WizardStep = (typeof ALL_STEPS)[number];

/** Translation key of every step, used for the stepper */
const STEP_NAMES: Record<WizardStep, string> = {
    welcome: 'Welcome',
    license: 'License agreement',
    password: 'Password',
    auth: 'Authentication',
    forwarding: 'Port forwarding',
    settings: 'Settings',
    rooms: 'Rooms',
    adapters: 'Adapters',
    finish: 'Finish',
};

interface WizardDialogProps {
    socket: AdminConnection;
    onClose: (redirect?: string) => void;
    toggleTheme: () => void;
    themeName: ThemeName;
    themeType: ThemeType;
    /** Active language */
    lang: ioBroker.Languages;
    /** Active host name */
    host: string;
    /** Execute command on given host */
    executeCommand: (cmd: string, host: string, cb: () => void) => void;
    onNavigate: (tab: string, subTab?: string, param?: string) => void;
}

interface WizardDialogState {
    /** Steps, which are shown. The license step is not shown if it was already confirmed */
    steps: WizardStep[];
    activeStep: number;
    auth: boolean;
    secure: boolean;
    /** Selected language. It can be changed on the license step */
    lang: ioBroker.Languages;
    /** Password, entered on the password step. Kept, so the step can be visited again */
    password: string;
    /** Settings of the settings step. Kept, so the step can be visited again */
    settings: WizardSettings | null;
    /** Rooms, selected on the rooms step */
    rooms: string[] | null;
    /** Adapters, selected on the adapters step */
    adapters: string[];
    /** Error text, shown as a snackbar */
    errorText: string;
    /** Indication, that some request is running */
    requesting: boolean;
}

export default class WizardDialog extends Component<WizardDialogProps, WizardDialogState> {
    private adminInstance: ioBroker.AdapterObject | null = null;

    constructor(props: WizardDialogProps) {
        super(props);

        this.state = {
            steps: [...ALL_STEPS],
            activeStep: 0,
            auth: false,
            secure: false,
            lang: props.lang || I18n.getLanguage(),
            password: '',
            settings: null,
            rooms: null,
            adapters: [],
            errorText: '',
            requesting: false,
        };
    }

    async componentDidMount(): Promise<void> {
        try {
            const namespace = await this.props.socket.getCurrentInstance();
            const obj = await this.props.socket.getObject(`system.adapter.${namespace}`);
            this.adminInstance = (obj as ioBroker.AdapterObject) || null;

            // If the license was confirmed already, do not ask for it again
            const systemConfig = await this.props.socket.getCompactSystemConfig(true);
            const steps: WizardStep[] = ALL_STEPS.filter(
                step => step !== 'license' || !systemConfig?.common?.licenseConfirmed,
            );

            this.setState(state => ({
                auth: !!obj?.native.auth,
                secure: !!obj?.native.secure,
                steps,
                // the list of steps could become shorter
                activeStep: Math.min(state.activeStep, steps.length - 1),
            }));
        } catch (e) {
            this.setState({ errorText: (e as Error).message || (e as string).toString() });
        }
    }

    /** Go to the next step */
    goNext = (): void => {
        this.setState(state => ({
            activeStep: Math.min(state.activeStep + 1, state.steps.length - 1),
            errorText: '',
        }));
    };

    /** Go one step back */
    goBack = (): void => {
        this.setState(state => ({ activeStep: Math.max(state.activeStep - 1, 0), errorText: '' }));
    };

    renderWelcome(): JSX.Element {
        // shutterstock Standard commercial license on ioBroker GmbH: https://www.shutterstock.com/de/image-vector/welcome-neon-text-vector-sign-design-1186433386
        return (
            <Box
                sx={{
                    position: 'relative',
                    height: '100%',
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    backgroundImage: `url(${WizardWelcomeImage})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* The image is dark, so a dark scrim and white text are used here independently of the theme */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0, 12, 26, 0.35) 0%, rgba(0, 12, 26, 0.85) 100%)',
                    }}
                />
                <Box
                    sx={{
                        position: 'relative',
                        m: 'auto',
                        p: { xs: 2, md: 4 },
                        maxWidth: 680,
                        textAlign: 'center',
                        color: '#fff',
                    }}
                >
                    <Box
                        component="img"
                        src={LongLogo}
                        alt="ioBroker"
                        sx={{
                            width: { xs: 200, md: 280 },
                            maxWidth: '100%',
                            // The logo is dark blue, make it white for the dark background
                            filter: 'brightness(0) invert(1)',
                            opacity: 0.95,
                        }}
                    />
                    <Typography
                        variant="body1"
                        sx={{ mt: 3, color: 'rgba(255, 255, 255, 0.85)' }}
                    >
                        {I18n.t('wizard welcome description')}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{ mt: 4 }}
                        onClick={this.goNext}
                        endIcon={<PlayArrowIcon />}
                    >
                        {I18n.t('Start wizard')}
                    </Button>
                </Box>
            </Box>
        );
    }

    renderLicense(): JSX.Element {
        return (
            <WizardLicenseTab
                t={I18n.t}
                socket={this.props.socket}
                themeType={this.props.themeType}
                lang={this.state.lang}
                onLanguageChange={(lang: ioBroker.Languages) => {
                    I18n.setLanguage(lang);
                    // re-render the whole wizard with the new language
                    this.setState({ lang });
                }}
                saving={this.state.requesting}
                onBack={this.state.activeStep ? this.goBack : undefined}
                onDone={async (settings: { lang: ioBroker.Languages }): Promise<void> => {
                    this.setState({ requesting: true });
                    try {
                        const obj = await this.props.socket.getSystemConfig(true);
                        obj.common.licenseConfirmed = true;
                        // The statistics were accepted on this step, so store this decision
                        obj.common.diag = 'extended';
                        if (settings.lang) {
                            obj.common.language = settings.lang;
                        }
                        await this.props.socket.setSystemConfig(obj);

                        this.setState(
                            { lang: settings.lang || obj.common.language || I18n.getLanguage(), requesting: false },
                            () => this.goNext(),
                        );
                    } catch (e) {
                        this.setState({
                            requesting: false,
                            errorText: (e as Error).message || (e as string).toString(),
                        });
                    }
                }}
            />
        );
    }

    renderPassword(): JSX.Element {
        return (
            <WizardPasswordTab
                t={I18n.t}
                password={this.state.password}
                requesting={this.state.requesting}
                onBack={this.state.activeStep ? this.goBack : undefined}
                onDone={async (pass: string, goToBackItUp?: boolean): Promise<void> => {
                    if (goToBackItUp) {
                        this.props.onNavigate('tab-backitup-0');
                        return;
                    }
                    this.setState({ requesting: true });
                    try {
                        await this.props.socket.changePassword('admin', pass);
                        this.setState({ password: pass, requesting: false }, () => this.goNext());
                    } catch (e) {
                        this.setState({
                            requesting: false,
                            errorText: (e as Error).message || (e as string).toString(),
                        });
                    }
                }}
            />
        );
    }

    renderSettings(): JSX.Element {
        return (
            <WizardSettingsTab
                t={I18n.t}
                socket={this.props.socket}
                settings={this.state.settings}
                requesting={this.state.requesting}
                onBack={this.goBack}
                onDone={async (settings: WizardSettings): Promise<void> => {
                    this.setState({ requesting: true });
                    try {
                        const obj = await this.props.socket.getSystemConfig(true);
                        Object.assign(obj.common, settings);
                        await this.props.socket.setSystemConfig(obj);
                        this.setState({ settings, requesting: false }, () => this.goNext());
                    } catch (e) {
                        this.setState({
                            requesting: false,
                            errorText: (e as Error).message || (e as string).toString(),
                        });
                    }
                }}
            />
        );
    }

    renderAuthentication(): JSX.Element {
        return (
            <WizardAuthSSLTab
                t={I18n.t}
                auth={this.state.auth}
                secure={this.state.secure}
                onBack={this.goBack}
                onDone={(settings: { auth: boolean; secure: boolean }) => this.setState(settings, () => this.goNext())}
            />
        );
    }

    renderPortForwarding(): JSX.Element {
        return (
            <WizardPortForwarding
                t={I18n.t}
                auth={this.state.auth}
                secure={this.state.secure}
                onBack={this.goBack}
                onDone={this.goNext}
            />
        );
    }

    /**
     * Render the room selection wizard tab
     */
    renderRooms(): JSX.Element {
        return (
            <WizardRoomsTab
                t={I18n.t}
                lang={this.state.lang}
                socket={this.props.socket}
                rooms={this.state.rooms}
                onBack={this.goBack}
                onError={(errorText: string) => this.setState({ errorText })}
                onDone={(rooms: string[]) => this.setState({ rooms }, () => this.goNext())}
            />
        );
    }

    /**
     * Render the adapter selection wizard tab
     */
    renderAdapters(): JSX.Element {
        return (
            <WizardAdaptersTab
                host={this.props.host}
                socket={this.props.socket}
                adapters={this.state.adapters}
                executeCommand={this.props.executeCommand}
                onBack={this.goBack}
                onDone={(adapters: string[]) => this.setState({ adapters }, () => this.goNext())}
            />
        );
    }

    async onClose(): Promise<void> {
        // read if discovery is available
        let discovery: ioBroker.State | null | undefined;
        try {
            discovery = await this.props.socket.getState('system.adapter.discovery.0.alive');
        } catch {
            // ignore: the wizard must be closable even if the state cannot be read
        }
        const target = `#tab-adapters${discovery?.val ? '/discovery' : ''}`;

        if (!this.adminInstance) {
            Router.doNavigate('tab-adapters', discovery?.val ? 'discovery' : undefined);
            this.props.onClose();
            return;
        }

        if (
            this.adminInstance.native.secure === this.state.secure &&
            this.adminInstance.native.auth === this.state.auth
        ) {
            // Nothing to change, so no restart of admin is required
            Router.doNavigate('tab-adapters', discovery?.val ? 'discovery' : undefined);
            this.props.onClose();
            return;
        }

        let certPublic: string | undefined;
        let certPrivate: string | undefined;

        if (this.state.secure && (!this.adminInstance.native.certPublic || !this.adminInstance.native.certPrivate)) {
            // get certificates
            try {
                const certs = await this.props.socket.getCertificates();
                certPublic = certs?.find(c => c.type === 'public')?.name;
                certPrivate = certs?.find(c => c.type === 'private')?.name;
            } catch (e) {
                this.setState({ errorText: I18n.t('Cannot read certificates: %s', (e as Error).message || e) });
                return;
            }
        }

        if (this.state.secure && (!certPublic || !certPrivate)) {
            // Let the user press "Finish" again: SSL is disabled now, so the setup can be completed without it
            this.setState({
                secure: false,
                errorText: I18n.t('Cannot enable authentication as no certificates found!'),
            });
            return;
        }

        this.adminInstance.native.auth = this.state.auth;
        this.adminInstance.native.secure = this.state.secure;
        if (this.state.secure) {
            this.adminInstance.native.certPublic = this.adminInstance.native.certPublic || certPublic;
            this.adminInstance.native.certPrivate = this.adminInstance.native.certPrivate || certPrivate;
        }

        try {
            await this.props.socket.setObject(this.adminInstance._id, this.adminInstance);
        } catch (e) {
            this.setState({ errorText: (e as Error).message || (e as string).toString() });
            return;
        }

        // redirect to https or http, as admin will be restarted
        this.props.onClose(
            `${this.adminInstance.native.secure ? 'https' : 'http'}://${window.location.host}${adminHref(target)}`,
        );
    }

    renderFinish(): JSX.Element {
        // Free Image license: https://pixabay.com/illustrations/road-sky-mountains-clouds-black-908176/
        return (
            <Box
                sx={{
                    position: 'relative',
                    height: '100%',
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    backgroundImage: `url(${WizardFinishImage})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* The image is bright, so a light scrim and dark text are used here independently of the theme */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.8) 100%)',
                    }}
                />
                <Box
                    sx={{
                        position: 'relative',
                        m: 'auto',
                        p: { xs: 2, md: 4 },
                        maxWidth: 680,
                        textAlign: 'center',
                    }}
                >
                    <Typography
                        component="div"
                        sx={{
                            fontSize: { xs: 24, sm: 32, md: 40 },
                            fontWeight: 700,
                            color: '#265063',
                        }}
                    >
                        {I18n.t('Have fun automating your home with')}
                    </Typography>
                    <Box
                        component="img"
                        src={LongLogo}
                        alt="ioBroker"
                        sx={{ width: { xs: 240, md: 380 }, maxWidth: '100%', mt: 2 }}
                    />
                    <Box>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{ mt: 2 }}
                            onClick={() => this.onClose()}
                            startIcon={<CheckIcon />}
                        >
                            {I18n.t('Finish')}
                        </Button>
                    </Box>
                </Box>
            </Box>
        );
    }

    renderStep(): JSX.Element | null {
        switch (this.state.steps[this.state.activeStep]) {
            case 'welcome':
                return this.renderWelcome();
            case 'license':
                return this.renderLicense();
            case 'password':
                return this.renderPassword();
            case 'auth':
                return this.renderAuthentication();
            case 'forwarding':
                return this.renderPortForwarding();
            case 'settings':
                return this.renderSettings();
            case 'rooms':
                return this.renderRooms();
            case 'adapters':
                return this.renderAdapters();
            case 'finish':
                return this.renderFinish();
            default:
                return null;
        }
    }

    renderHeader(): JSX.Element {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: { xs: 1.5, md: 3 },
                    py: 1.5,
                }}
            >
                <Box
                    component="img"
                    src={Logo}
                    alt="logo"
                    sx={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', p: '2px' }}
                />
                <Typography
                    variant="h6"
                    component="h1"
                    sx={{
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {I18n.t('Initial ioBroker setup')}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <ToggleThemeMenu
                    t={I18n.t}
                    toggleTheme={this.props.toggleTheme}
                    themeName={this.props.themeName}
                    size="small"
                />
            </Box>
        );
    }

    renderProgress(): JSX.Element {
        const { steps, activeStep } = this.state;

        return (
            <>
                {/* Full stepper on bigger screens */}
                <Box
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        px: 3,
                        pb: 2,
                    }}
                >
                    <Stepper
                        activeStep={activeStep}
                        alternativeLabel
                    >
                        {steps.map((step, i) => (
                            <Step
                                key={step}
                                completed={i < activeStep}
                            >
                                {i < activeStep ? (
                                    <StepButton onClick={() => this.setState({ activeStep: i, errorText: '' })}>
                                        {I18n.t(STEP_NAMES[step])}
                                    </StepButton>
                                ) : (
                                    <StepLabel>{I18n.t(STEP_NAMES[step])}</StepLabel>
                                )}
                            </Step>
                        ))}
                    </Stepper>
                </Box>
                {/* Compact progress on small screens */}
                <Box sx={{ display: { xs: 'block', md: 'none' }, px: 2, pb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                        >
                            {I18n.t(STEP_NAMES[steps[activeStep]])}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
                        >
                            {I18n.t('Step %s of %s', activeStep + 1, steps.length)}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        sx={{ mt: 0.5, borderRadius: 1 }}
                        value={(activeStep / (steps.length - 1)) * 100}
                    />
                </Box>
            </>
        );
    }

    render(): JSX.Element {
        return (
            <Dialog
                open={!0}
                onClose={() => {
                    // ignore
                    // This dialog can be closed only by button
                }}
                fullWidth
                fullScreen
                aria-labelledby="wizard-dialog-title"
                slotProps={{ paper: { sx: { backgroundColor: 'background.default', backgroundImage: 'none' } } }}
            >
                <DialogContent
                    id="wizard-dialog-title"
                    sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                >
                    {this.renderHeader()}
                    {this.renderProgress()}
                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            px: { xs: 1, md: 3 },
                            pb: { xs: 1, md: 3 },
                        }}
                    >
                        {this.renderStep()}
                    </Box>
                </DialogContent>
                <Snackbar
                    open={!!this.state.errorText}
                    autoHideDuration={10_000}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    onClose={() => this.setState({ errorText: '' })}
                >
                    <Alert
                        severity="error"
                        variant="filled"
                        onClose={() => this.setState({ errorText: '' })}
                    >
                        {this.state.errorText}
                    </Alert>
                </Snackbar>
            </Dialog>
        );
    }
}
