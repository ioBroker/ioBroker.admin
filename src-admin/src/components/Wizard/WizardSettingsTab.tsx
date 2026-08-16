import React, { Component, type JSX } from 'react';

import { MapContainer, TileLayer } from 'react-leaflet';
import { Marker, type DragEndEvent, type LatLngTuple, type Map } from 'leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

import {
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Autocomplete,
    Box,
    Paper,
    Tooltip,
} from '@mui/material';

import { Close as CloseIcon, ArrowForward as IconNext, GpsFixed, MyLocation } from '@mui/icons-material';

import { type AdminConnection, I18n, type Translate } from '@iobroker/gui-components';

import WizardStepFrame from './WizardStepFrame';

/** Countries, which are shown at the top of the list */
const TOP_COUNTRIES: string[] = [
    'Germany',
    'Austria',
    'Switzerland',
    'Russian Federation',
    'France',
    'Netherlands',
    'Italy',
    'United Kingdom',
    'United States',
    'China',
];

/** All other countries in alphabetical order (English names, they are translated for the display) */
// prettier-ignore
const COUNTRIES: string[] = [
    'Afghanistan', 'Albania', 'Algeria', 'American Samoa', 'Andorra', 'Angola', 'Anguilla', 'Antarctica',
    'Antigua and Barbuda', 'Argentina', 'Armenia', 'Aruba', 'Australia', 'Azerbaijan', 'Bahamas', 'Bahrain',
    'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bermuda', 'Bhutan', 'Bolivia',
    'Bosnia and Herzegovina', 'Botswana', 'Bouvet Island', 'Brazil', 'British Indian Ocean Territory',
    'Brunei Darussalam', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
    'Cayman Islands', 'Central African Republic', 'Chad', 'Chile', 'Christmas Island', 'Cocos Islands',
    'Colombia', 'Comoros', 'Congo', 'Cook Islands', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador',
    'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Falkland Islands (Malvinas)', 'Faroe Islands',
    'Fiji', 'Finland', 'French Guiana', 'French Polynesia', 'French Southern Territories', 'Gabon', 'Gambia',
    'Georgia', 'Ghana', 'Gibraltar', 'Guernsey', 'Greece', 'Greenland', 'Grenada', 'Guadeloupe', 'Guam',
    'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Heard and Mc Donald Islands', 'Honduras',
    'Hong Kong', 'Hungary', 'Iceland', 'India', 'Isle of Man', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
    'Ivory Coast', 'Jersey', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea', 'Kosovo',
    'Kuwait', 'Kyrgyzstan', "Lao People's Democratic Republic", 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
    'Libyan Arab Jamahiriya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macau', 'Macedonia', 'Madagascar',
    'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Martinique', 'Mauritania',
    'Mauritius', 'Mayotte', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Montserrat',
    'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands Antilles', 'New Caledonia',
    'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'Niue', 'Norfolk Island', 'Northern Mariana Islands',
    'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
    'Philippines', 'Pitcairn', 'Poland', 'Portugal', 'Puerto Rico', 'Qatar', 'Reunion', 'Romania', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
    'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
    'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Georgia South Sandwich Islands',
    'Spain', 'Sri Lanka', 'St. Helena', 'St. Pierre and Miquelon', 'Sudan', 'Suriname',
    'Svalbard and Jan Mayen Islands', 'Swaziland', 'Sweden', 'Syrian Arab Republic', 'Taiwan', 'Tajikistan',
    'Tanzania', 'Thailand', 'Togo', 'Tokelau', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
    'Turkmenistan', 'Turks and Caicos Islands', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
    'United States minor outlying islands', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City State',
    'Venezuela', 'Vietnam', 'Virgin Islands (British)', 'Virgin Islands (U.S.)', 'Wallis and Futuna Islands',
    'Western Sahara', 'Yemen', 'Zaire', 'Zambia', 'Zimbabwe',
];

const CURRENCY: string[] = ['€', '$', '₽', '₤', 'CHF'];

const MAX_ZOOM = 18;

/** Button to clear the content of a text field */
function renderClearButton(value: string, onClear: () => void): JSX.Element | null {
    if (!value) {
        return null;
    }
    return (
        <InputAdornment position="end">
            <IconButton
                tabIndex={-1}
                size="small"
                onClick={onClear}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </InputAdornment>
    );
}

/** Settings, which are written into the system configuration */
export interface WizardSettings {
    tempUnit: '°C' | '°F';
    currency: string;
    dateFormat: string;
    isFloatComma: boolean;
    country: string;
    city: string;
    address: string;
    longitude: number;
    latitude: number;
    firstDayOfWeek: 'sunday' | 'monday';
}

interface WizardSettingsTabProps {
    t: Translate;
    socket: AdminConnection;
    /** Already entered settings, so the step can be visited again */
    settings: WizardSettings | null;
    /** The settings are currently written to the server */
    requesting: boolean;
    /** Go one step back */
    onBack?: () => void;
    onDone: (settings: WizardSettings) => void;
}

interface WizardSettingsTabState {
    tempUnit: '°C' | '°F';
    currency: string;
    dateFormat: string;
    isFloatComma: boolean;
    country: string;
    city: string;
    address: string;
    longitude: number | string;
    latitude: number | string;
    firstDayOfWeek: 'sunday' | 'monday';
    zoom: number;
}

export default class WizardSettingsTab extends Component<WizardSettingsTabProps, WizardSettingsTabState> {
    private marker: Marker | null = null;

    private map: Map | null = null;

    private cityTimer: ReturnType<typeof setTimeout> | null = null;

    private latLongTimer: ReturnType<typeof setTimeout> | null = null;

    private positionTimer: ReturnType<typeof setTimeout> | null = null;

    /** Counter of the address requests, so only the answer of the last one is used */
    private addressRequestId = 0;

    /** Countries in the order they are shown: the most used ones first, the rest sorted by the translated name */
    private readonly countries: string[];

    constructor(props: WizardSettingsTabProps) {
        super(props);

        this.state = {
            tempUnit: props.settings?.tempUnit || '°C',
            currency: props.settings?.currency || '€',
            dateFormat: props.settings?.dateFormat || 'DD.MM.YYYY',
            isFloatComma: props.settings?.isFloatComma ?? true,
            country: props.settings?.country || '',
            city: props.settings?.city || '',
            address: props.settings?.address || '',
            longitude: props.settings?.longitude ?? '',
            latitude: props.settings?.latitude ?? '',
            firstDayOfWeek: props.settings?.firstDayOfWeek || 'monday',
            zoom: 14,
        };

        this.countries = TOP_COUNTRIES.concat(
            [...COUNTRIES].sort((a, b) => props.t(a).localeCompare(props.t(b), I18n.getLanguage())),
        );
    }

    async componentDidMount(): Promise<void> {
        // If the user was already on this step, the values are given by the parent
        if (!this.props.settings) {
            try {
                const systemConfig = await this.props.socket.getCompactSystemConfig(true);
                this.setState(
                    {
                        tempUnit: systemConfig.common.tempUnit || '°C',
                        currency: systemConfig.common.currency || '€',
                        dateFormat: systemConfig.common.dateFormat || 'DD.MM.YYYY',
                        isFloatComma: systemConfig.common.isFloatComma ?? true,
                        country: systemConfig.common.country || '',
                        city: systemConfig.common.city || '',
                        longitude: systemConfig.common.longitude ?? '',
                        latitude: systemConfig.common.latitude ?? '',
                        firstDayOfWeek: systemConfig.common.firstDayOfWeek || 'monday',
                    },
                    () => this.getBrowserCoordinates(),
                );
                return;
            } catch (e) {
                console.error(`Cannot read system configuration: ${(e as Error).message}`);
            }
        }

        this.changeMapPosition(true);
    }

    componentDidUpdate(prevProps: WizardSettingsTabProps): void {
        if (prevProps.requesting !== this.props.requesting) {
            // The marker is a control too, so it must not be movable while the settings are written to the server
            if (this.props.requesting) {
                this.marker?.dragging?.disable();
            } else {
                this.marker?.dragging?.enable();
            }
        }
    }

    componentWillUnmount(): void {
        if (this.cityTimer) {
            clearTimeout(this.cityTimer);
            this.cityTimer = null;
        }
        if (this.latLongTimer) {
            clearTimeout(this.latLongTimer);
            this.latLongTimer = null;
        }
        if (this.positionTimer) {
            clearTimeout(this.positionTimer);
            this.positionTimer = null;
        }
        this.marker?.remove();
        this.marker = null;
        this.map = null;
    }

    /** Ask the browser for the current position if no coordinates are known yet */
    getBrowserCoordinates(): void {
        if (window.navigator.geolocation && (!this.state.longitude || !this.state.latitude)) {
            window.navigator.geolocation.getCurrentPosition(
                position => {
                    const latitude = parseFloat(position.coords.latitude.toFixed(8));
                    const longitude = parseFloat(position.coords.longitude.toFixed(8));

                    this.setState(
                        {
                            latitude: isNaN(latitude) ? '' : latitude,
                            longitude: isNaN(longitude) ? '' : longitude,
                        },
                        () => this.changeMapPosition(),
                    );
                },
                error => console.warn(`Cannot detect the position: ${error.message}`),
            );
        } else {
            this.changeMapPosition();
        }
    }

    onMap = (map: Map | null): void => {
        if (!map || this.map === map) {
            return;
        }
        this.map = map;

        this.marker = new Marker(this.getPosition(), {
            draggable: true,
            title: I18n.t('ioBroker location'),
            alt: I18n.t('ioBroker location'),
            riseOnHover: true,
        })
            .addTo(map)
            .on({
                dragend: (evt: DragEndEvent) => {
                    const position = (evt.target as Marker).getLatLng();
                    this.setState({ latitude: position.lat, longitude: position.lng });
                },
            });

        // The dialog animates its size, so the map must be informed about the final size
        this.positionTimer = setTimeout(() => {
            this.positionTimer = null;
            map.invalidateSize();
            this.changeMapPosition(true);
        }, 300);
    };

    /** Current position as leaflet expects it */
    getPosition(): LatLngTuple {
        const latitude = parseFloat(this.state.latitude as string);
        const longitude = parseFloat(this.state.longitude as string);

        return [isNaN(latitude) ? 50 : latitude, isNaN(longitude) ? 10 : longitude];
    }

    /**
     * Move the map and the marker to the entered position
     *
     * @param noWait if the position must be applied immediately and not after the user stopped typing
     */
    changeMapPosition(noWait?: boolean): void {
        if (this.latLongTimer) {
            clearTimeout(this.latLongTimer);
        }
        this.latLongTimer = setTimeout(
            () => {
                this.latLongTimer = null;
                const position = this.getPosition();
                this.map?.flyTo(position, Math.min(this.state.zoom, MAX_ZOOM));
                this.marker?.setLatLng(position);
            },
            noWait ? 0 : 500,
        );
    }

    onChangePosition(value: string, id: 'latitude' | 'longitude'): void {
        if (id === 'latitude') {
            this.setState({ latitude: value }, () => this.changeMapPosition());
        } else {
            this.setState({ longitude: value }, () => this.changeMapPosition());
        }
    }

    /**
     * Detect the coordinates of the entered address
     *
     * @param noWait if the address must be searched immediately and not after the user stopped typing
     */
    addressToPosition(noWait?: boolean): void {
        if (this.cityTimer) {
            clearTimeout(this.cityTimer);
        }

        this.cityTimer = setTimeout(
            () => {
                this.cityTimer = null;
                const query = `${this.state.country} ${this.state.city}, ${this.state.address}`.trim();
                if (query === ',') {
                    return;
                }
                // Only the answer for the last request is used
                const requestId = ++this.addressRequestId;

                void new OpenStreetMapProvider()
                    .search({ query })
                    .then(results => {
                        if (results[0] && requestId === this.addressRequestId) {
                            this.setState({ latitude: results[0].y, longitude: results[0].x, zoom: MAX_ZOOM }, () =>
                                this.changeMapPosition(true),
                            );
                        }
                    })
                    .catch(e => console.warn(`Cannot detect the position: ${e}`));
            },
            noWait ? 0 : 800,
        );
    }

    onChangeAddress(value: string, id: 'city' | 'address' | 'country'): void {
        if (id === 'city') {
            this.setState({ city: value }, () => this.addressToPosition());
        } else if (id === 'address') {
            this.setState({ address: value }, () => this.addressToPosition());
        } else {
            this.setState({ country: value }, () => this.addressToPosition());
        }
    }

    renderSettings(): JSX.Element {
        // While the settings are written to the server, nothing may be changed anymore
        const disabled = this.props.requesting;

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl
                    fullWidth
                    size="small"
                    disabled={disabled}
                >
                    <InputLabel id="wizard-temp-unit">{this.props.t('Temperature unit')}</InputLabel>
                    <Select
                        labelId="wizard-temp-unit"
                        label={this.props.t('Temperature unit')}
                        value={this.state.tempUnit}
                        onChange={e => this.setState({ tempUnit: e.target.value })}
                    >
                        <MenuItem value="°C">°C</MenuItem>
                        <MenuItem value="°F">°F</MenuItem>
                    </Select>
                </FormControl>

                <Autocomplete
                    freeSolo
                    size="small"
                    disabled={disabled}
                    options={CURRENCY}
                    inputValue={this.state.currency}
                    onInputChange={(_event, currency) => this.setState({ currency })}
                    renderInput={params => (
                        <TextField
                            {...params}
                            label={this.props.t('Currency')}
                        />
                    )}
                />

                <FormControl
                    fullWidth
                    size="small"
                    disabled={disabled}
                >
                    <InputLabel id="wizard-date-format">{this.props.t('Date format')}</InputLabel>
                    <Select
                        labelId="wizard-date-format"
                        label={this.props.t('Date format')}
                        value={this.state.dateFormat}
                        onChange={e => this.setState({ dateFormat: e.target.value })}
                    >
                        <MenuItem value="DD.MM.YYYY">DD.MM.YYYY</MenuItem>
                        <MenuItem value="YYYY.MM.DD">YYYY.MM.DD</MenuItem>
                        <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    </Select>
                </FormControl>

                <FormControl
                    fullWidth
                    size="small"
                    disabled={disabled}
                >
                    <InputLabel id="wizard-float-divider">{this.props.t('Float divider')}</InputLabel>
                    <Select
                        labelId="wizard-float-divider"
                        label={this.props.t('Float divider')}
                        value={this.state.isFloatComma ? 'true' : 'false'}
                        onChange={e => this.setState({ isFloatComma: e.target.value === 'true' })}
                    >
                        <MenuItem value="true">{`${this.props.t('comma')} - 3,14`}</MenuItem>
                        <MenuItem value="false">{`${this.props.t('point')} - 3.14`}</MenuItem>
                    </Select>
                </FormControl>

                <FormControl
                    fullWidth
                    size="small"
                    disabled={disabled}
                >
                    <InputLabel id="wizard-first-day">{this.props.t('Week starts with')}</InputLabel>
                    <Select
                        labelId="wizard-first-day"
                        label={this.props.t('Week starts with')}
                        value={this.state.firstDayOfWeek}
                        onChange={e => this.setState({ firstDayOfWeek: e.target.value })}
                    >
                        <MenuItem value="monday">{this.props.t('monday')}</MenuItem>
                        <MenuItem value="sunday">{this.props.t('sunday')}</MenuItem>
                    </Select>
                </FormControl>
            </Box>
        );
    }

    renderLocation(): JSX.Element {
        // While the settings are written to the server, nothing may be changed anymore
        const disabled = this.props.requesting;

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Autocomplete
                    size="small"
                    disabled={disabled}
                    options={this.countries}
                    value={this.state.country || null}
                    getOptionLabel={(country: string) => this.props.t(country)}
                    onChange={(_e, country) => this.onChangeAddress(country || '', 'country')}
                    renderInput={params => (
                        <TextField
                            {...params}
                            label={this.props.t('Country')}
                        />
                    )}
                />

                <TextField
                    size="small"
                    disabled={disabled}
                    label={this.props.t('City')}
                    value={this.state.city}
                    onChange={e => this.onChangeAddress(e.target.value, 'city')}
                    slotProps={{
                        input: {
                            endAdornment: disabled
                                ? null
                                : renderClearButton(this.state.city, () => this.setState({ city: '' })),
                        },
                    }}
                />

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <TextField
                        size="small"
                        fullWidth
                        disabled={disabled}
                        label={this.props.t('Address')}
                        value={this.state.address}
                        onChange={e => this.onChangeAddress(e.target.value, 'address')}
                        helperText={this.props.t('Used only to calculate position.')}
                        slotProps={{
                            input: {
                                endAdornment: disabled
                                    ? null
                                    : renderClearButton(this.state.address, () => this.setState({ address: '' })),
                            },
                        }}
                    />
                    <Tooltip
                        title={this.props.t('Used only to calculate position.')}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <span>
                            <IconButton
                                color="primary"
                                disabled={disabled}
                                onClick={() => this.addressToPosition(true)}
                            >
                                <GpsFixed />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <TextField
                        size="small"
                        fullWidth
                        disabled={disabled}
                        label={this.props.t('Longitude')}
                        value={this.state.longitude ?? ''}
                        onChange={e => this.onChangePosition(e.target.value, 'longitude')}
                    />
                    <TextField
                        size="small"
                        fullWidth
                        disabled={disabled}
                        label={this.props.t('Latitude')}
                        value={this.state.latitude ?? ''}
                        onChange={e => this.onChangePosition(e.target.value, 'latitude')}
                    />
                    <Tooltip
                        title={this.props.t('ioBroker location')}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <span>
                            <IconButton
                                color="primary"
                                disabled={disabled}
                                onClick={() =>
                                    this.setState({ latitude: '', longitude: '' }, () => this.getBrowserCoordinates())
                                }
                            >
                                <MyLocation />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Box>
        );
    }

    render(): JSX.Element {
        return (
            <WizardStepFrame
                wide
                title={this.props.t('Important main settings')}
                onBack={this.props.onBack}
                busy={this.props.requesting}
                actions={
                    <Button
                        variant="contained"
                        color="primary"
                        loading={this.props.requesting}
                        onClick={() =>
                            this.props.onDone({
                                tempUnit: this.state.tempUnit,
                                currency: this.state.currency,
                                dateFormat: this.state.dateFormat,
                                isFloatComma: this.state.isFloatComma,
                                address: this.state.address,
                                firstDayOfWeek: this.state.firstDayOfWeek,
                                country: this.state.country,
                                city: this.state.city,
                                longitude: parseFloat(this.state.longitude as string) || 0,
                                latitude: parseFloat(this.state.latitude as string) || 0,
                            })
                        }
                        startIcon={<IconNext />}
                    >
                        {this.props.t('Next')}
                    </Button>
                }
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                        height: { xs: 'auto', md: '100%' },
                    }}
                >
                    <Box
                        sx={{
                            width: { xs: '100%', md: 360 },
                            flexShrink: 0,
                            overflow: { xs: 'visible', md: 'auto' },
                            pr: { xs: 0, md: 1 },
                            pt: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                        }}
                    >
                        {this.renderSettings()}
                        {this.renderLocation()}
                    </Box>
                    <Paper
                        variant="outlined"
                        sx={{
                            flexGrow: 1,
                            height: { xs: 320, md: '100%' },
                            minHeight: 240,
                            overflow: 'hidden',
                            borderRadius: 2,
                        }}
                    >
                        <MapContainer
                            style={{ height: '100%', width: '100%' }}
                            center={this.getPosition()}
                            zoom={this.state.zoom}
                            maxZoom={MAX_ZOOM}
                            attributionControl
                            zoomControl
                            doubleClickZoom
                            scrollWheelZoom
                            dragging
                            easeLinearity={0.35}
                            ref={this.onMap}
                        >
                            <TileLayer url="https://{s}.tile.osm.org/{z}/{x}/{y}.png" />
                        </MapContainer>
                    </Paper>
                </Box>
            </WizardStepFrame>
        );
    }
}
