import React, { Component } from 'react';

import {
    Grid,
    Toolbar,
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    TextField,
    Fab,
    Button,
    Paper,
    InputAdornment,
    IconButton,
    Autocomplete, Box,
} from '@mui/material';

import {
    Close as CloseIcon,
    Check as IconCheck,
} from '@mui/icons-material';

import 'ol/ol.css';
import { Map, View, Feature } from 'ol';
import { Tile, Vector as LayerVector } from 'ol/layer';
import { Icon, Style } from 'ol/style';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Point } from 'ol/geom';
import { toLonLat, fromLonLat } from 'ol/proj';

import {
    type AdminConnection, type IobTheme,
    type Translate, withWidth,
} from '@iobroker/adapter-react-v5';

// Icons
import { FaCrosshairs as GeoIcon } from 'react-icons/fa';
import PinSVG from '../../assets/pin.svg';

const TOOLBAR_HEIGHT = 64;
const SETTINGS_WIDTH = 300;

const styles: Record<string, any> = {
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
    title: (theme: IobTheme) => ({
        color: theme.palette.secondary.main,
    }),
    mainGrid: {
        height: `calc(100% - ${TOOLBAR_HEIGHT}px)`,
        overflow: 'auto',
    },
    grow: {
        flexGrow: 1,
    },
    mapGrid: {
        height: '100%',
        width: `calc(100% - ${SETTINGS_WIDTH + 32}px)`,
        overflow: 'hidden',
    },
    map: {
        height: '100%',
        width: '100%',
        overflow: 'hidden',
    },
    controlItem: {
        width: SETTINGS_WIDTH,
        marginBottom: 8,
    },
    controlItemAddress: {
        width: (SETTINGS_WIDTH - 40),
        marginBottom: 8,
    },
    gridSettings: {
        width: SETTINGS_WIDTH + 16,
        marginRight: 8,
        marginLeft: 8,
        textAlign: 'left',
        height: '100%',
        overflow: 'auto',
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
        lineHeight: `${TOOLBAR_HEIGHT}px`,
    },
    settingsGrid: {
        width: '100%',
        height: 'calc(100% - 54px)',
    },
};

const CURRENCY: { id: string; title: string }[] = [
    {
        id: '€',
        title: '€',
    },
    {
        id: '$',
        title: '$',
    },
    {
        id: '₽',
        title: '₽',
    },
    {
        id: '₤',
        title: '₤',
    },
    {
        id: 'CHF',
        title: 'CHF',
    },
];

interface WizardSettingsTabProps {
    t: Translate;
    socket: AdminConnection;
    theme: IobTheme;
    onDone: (settings: {
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
    }) => void;
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
}

class WizardSettingsTab extends Component<WizardSettingsTabProps, WizardSettingsTabState> {
    private OSM: {
        markerSource?: VectorSource;
        markerStyle?: Style;
        oMap?: Map;
        marker?: Feature;
    } | null = null;

    constructor(props: WizardSettingsTabProps) {
        super(props);

        this.state = {
            tempUnit: '°C',
            currency: '€',
            dateFormat: 'DD.MM.YYYY',
            isFloatComma: true,
            country: '',
            city: '',
            address: '',
            longitude: 0,
            latitude: 0,
            firstDayOfWeek: 'monday',
        };

        this.props.socket.getCompactSystemConfig(true)
            .then(obj => this.setState(
                {
                    tempUnit: obj.common.tempUnit,
                    currency: obj.common.currency,
                    dateFormat: obj.common.dateFormat,
                    isFloatComma: obj.common.isFloatComma,
                    country: obj.common.country,
                    city: obj.common.city,
                    address: '',
                    longitude: obj.common.longitude,
                    latitude: obj.common.latitude,
                    firstDayOfWeek: obj.common.firstDayOfWeek || 'monday',
                },
                () => this.updateMap(),
            ));
    }

    positionReady(position: { coords: { latitude: number; longitude: number } }) {
        this.setState(
            {
                latitude: parseFloat(position.coords.latitude.toFixed(8)),
                longitude: parseFloat(position.coords.longitude.toFixed(8)),
            },
            () => this.updateMap(),
        );
    }

    getPositionForAddress() {
        window
            .fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${this.state.country} ${this.state.city} ${this.state.address}`)}`,
            )
            .then(data => data.json())
            .then(data => {
                let changed = false;

                if (!data || !data[0]) {
                    window.alert(this.props.t('Nothing found'));
                    return;
                }

                let latitude = parseFloat(this.state.latitude as any as string);
                if (latitude !== parseFloat(data[0].lat)) {
                    latitude = parseFloat(data[0].lat);
                    changed = true;
                }
                let longitude = parseFloat(this.state.longitude as any as string);
                if (longitude !== parseFloat(data[0].lon)) {
                    longitude = parseFloat(data[0].lon);
                    changed = true;
                }
                changed && this.setState({ longitude, latitude }, () => this.updateMap());
            })
            .catch(e => window.alert(this.props.t('Cannot fetch address %s', e)));
    }

    updateMap() {
        // OPEN STREET MAPS
        if (window.navigator.geolocation && (!this.state.longitude || !this.state.latitude)) {
            window.navigator.geolocation.getCurrentPosition(position => this.positionReady(position));
        }

        const center = fromLonLat([
            parseFloat((this.state.longitude as any as string) || '0'),
            parseFloat((this.state.latitude as any as string) || '0'),
        ]);

        if (!this.OSM) {
            // get the coordinates from the browser

            this.OSM = {};
            this.OSM.markerSource = new VectorSource();

            this.OSM.markerStyle = new Style({
                image: new Icon({
                    anchor: [0.5, 49],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    opacity: 0.75,
                    src: PinSVG,
                }),
            });

            this.OSM.oMap = new Map({
                target: 'map',
                layers: [
                    new Tile({ source: new OSM() }),
                    new LayerVector({
                        source: this.OSM.markerSource,
                        style: this.OSM.markerStyle,
                    }),
                ],
                view: new View({ center, zoom: 17 }),
            });

            this.OSM.marker = new Feature({
                geometry: new Point(center),
                name: this.props.t('Your home'),
            });

            this.OSM.markerSource.addFeature(this.OSM.marker);

            this.OSM.oMap.on('singleclick', event => {
                const lonLat = toLonLat(event.coordinate);
                this.setState({ longitude: lonLat[0], latitude: lonLat[1] }, () => this.updateMap());
            });
        }

        const zoom = this.OSM.oMap.getView().getZoom();
        this.OSM.marker.setGeometry(new Point(center));
        this.OSM.oMap.setView(new View({ center, zoom }));
    }

    componentDidMount() {
        this.updateMap();
    }

    render() {
        return <Paper style={styles.paper}>
            <Grid container direction="column" style={styles.mainGrid}>
                <Grid item style={styles.gridSettings}>
                    <Grid container direction="column" style={{ width: 'calc(100% - 16px)' }}>
                        <Grid item>
                            <Box component="h2" sx={styles.title}>
                                {this.props.t('Important main settings')}
                            </Box>
                        </Grid>
                        <Grid container direction="column" style={styles.settingsGrid}>
                            <Grid item style={{ textAlign: 'left' }}>
                                <FormControl variant="standard" style={styles.controlItem}>
                                    <InputLabel>{this.props.t('Temperature unit')}</InputLabel>
                                    <Select
                                        variant="standard"
                                        value={this.state.tempUnit}
                                        onChange={e => this.setState({ tempUnit: e.target.value as '°C' | '°F' })}
                                    >
                                        <MenuItem value="°C">°C</MenuItem>
                                        <MenuItem value="°F">°F</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item>
                                <Autocomplete
                                    freeSolo
                                    options={CURRENCY}
                                    inputValue={this.state.currency}
                                    onChange={(event, newValue: { id: string; title: string }) =>
                                        this.setState({ currency: newValue ? newValue.id : '' })}
                                    onInputChange={(event, currency) => this.setState({ currency })}
                                    getOptionLabel={(option: { id: string; title: string }) => option.title}
                                    renderOption={(props, option: { id: string; title: string }) => (
                                        <li {...props}>{option.title}</li>
                                    )}
                                    renderInput={params => (
                                        <TextField
                                            {...params}
                                            variant="standard"
                                            label={this.props.t('Currency')}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item style={{ textAlign: 'left' }}>
                                <FormControl variant="standard" style={styles.controlItem}>
                                    <InputLabel>{this.props.t('Date format')}</InputLabel>
                                    <Select
                                        variant="standard"
                                        value={this.state.dateFormat}
                                        onChange={e => this.setState({ dateFormat: e.target.value })}
                                    >
                                        <MenuItem value="DD.MM.YYYY">DD.MM.YYYY</MenuItem>
                                        <MenuItem value="YYYY.MM.DD">YYYY.MM.DD</MenuItem>
                                        <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item style={{ textAlign: 'left' }}>
                                <FormControl variant="standard" style={styles.controlItem}>
                                    <InputLabel>{this.props.t('Float divider')}</InputLabel>
                                    <Select
                                        variant="standard"
                                        value={this.state.isFloatComma ? 'true' : 'false'}
                                        onChange={e => this.setState({ isFloatComma: e.target.value === 'true' })}
                                    >
                                        <MenuItem value="true">
                                            {this.props.t('comma')}
                                            <span style={{ marginLeft: 5 }}>- 3,14</span>
                                        </MenuItem>
                                        <MenuItem value="false">
                                            {this.props.t('point')}
                                            <span style={{ marginLeft: 5 }}>- 3.14</span>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item style={{ textAlign: 'left' }}>
                                <FormControl variant="standard" style={styles.controlItem}>
                                    <InputLabel>{this.props.t('Country')}</InputLabel>
                                    <Select
                                        variant="standard"
                                        value={this.state.country || ''}
                                        onChange={e => this.setState({ country: e.target.value })}
                                    >
                                        <MenuItem value="">{this.props.t('Please select country')}</MenuItem>
                                        <MenuItem value="Germany">{this.props.t('Germany')}</MenuItem>
                                        <MenuItem value="Austria">{this.props.t('Austria')}</MenuItem>
                                        <MenuItem value="Switzerland">{this.props.t('Switzerland')}</MenuItem>
                                        <MenuItem value="Russian Federation">
                                            {this.props.t('Russian Federation')}
                                        </MenuItem>
                                        <MenuItem value="France">{this.props.t('France')}</MenuItem>
                                        <MenuItem value="Netherlands">{this.props.t('Netherlands')}</MenuItem>
                                        <MenuItem value="Italy">{this.props.t('Italy')}</MenuItem>
                                        <MenuItem value="United Kingdom">{this.props.t('United Kingdom')}</MenuItem>
                                        <MenuItem value="United States">{this.props.t('United States')}</MenuItem>
                                        <MenuItem value="China">{this.props.t('China')}</MenuItem>

                                        <MenuItem value="Afghanistan">{this.props.t('Afghanistan')}</MenuItem>
                                        <MenuItem value="Albania">{this.props.t('Albania')}</MenuItem>
                                        <MenuItem value="Algeria">{this.props.t('Algeria')}</MenuItem>
                                        <MenuItem value="American Samoa">{this.props.t('American Samoa')}</MenuItem>
                                        <MenuItem value="Andorra">{this.props.t('Andorra')}</MenuItem>
                                        <MenuItem value="Angola">{this.props.t('Angola')}</MenuItem>
                                        <MenuItem value="Anguilla">{this.props.t('Anguilla')}</MenuItem>
                                        <MenuItem value="Antarctica">{this.props.t('Antarctica')}</MenuItem>
                                        <MenuItem value="Antigua and Barbuda">
                                            {this.props.t('Antigua and Barbuda')}
                                        </MenuItem>
                                        <MenuItem value="Argentina">{this.props.t('Argentina')}</MenuItem>
                                        <MenuItem value="Armenia">{this.props.t('Armenia')}</MenuItem>
                                        <MenuItem value="Aruba">{this.props.t('Aruba')}</MenuItem>
                                        <MenuItem value="Australia">{this.props.t('Australia')}</MenuItem>
                                        <MenuItem value="Azerbaijan">{this.props.t('Azerbaijan')}</MenuItem>
                                        <MenuItem value="Bahamas">{this.props.t('Bahamas')}</MenuItem>
                                        <MenuItem value="Bahrain">{this.props.t('Bahrain')}</MenuItem>
                                        <MenuItem value="Bangladesh">{this.props.t('Bangladesh')}</MenuItem>
                                        <MenuItem value="Barbados">{this.props.t('Barbados')}</MenuItem>
                                        <MenuItem value="Belarus">{this.props.t('Belarus')}</MenuItem>
                                        <MenuItem value="Belgium">{this.props.t('Belgium')}</MenuItem>
                                        <MenuItem value="Belize">{this.props.t('Belize')}</MenuItem>
                                        <MenuItem value="Benin">{this.props.t('Benin')}</MenuItem>
                                        <MenuItem value="Bermuda">{this.props.t('Bermuda')}</MenuItem>
                                        <MenuItem value="Bhutan">{this.props.t('Bhutan')}</MenuItem>
                                        <MenuItem value="Bolivia">{this.props.t('Bolivia')}</MenuItem>
                                        <MenuItem value="Bosnia and Herzegovina">
                                            {this.props.t('Bosnia and Herzegovina')}
                                        </MenuItem>
                                        <MenuItem value="Botswana">{this.props.t('Botswana')}</MenuItem>
                                        <MenuItem value="Bouvet Island">{this.props.t('Bouvet Island')}</MenuItem>
                                        <MenuItem value="Brazil">{this.props.t('Brazil')}</MenuItem>
                                        <MenuItem value="British Indian Ocean Territory">
                                            {this.props.t('British Indian Ocean Territory')}
                                        </MenuItem>
                                        <MenuItem value="Brunei Darussalam">
                                            {this.props.t('Brunei Darussalam')}
                                        </MenuItem>
                                        <MenuItem value="Bulgaria">{this.props.t('Bulgaria')}</MenuItem>
                                        <MenuItem value="Burkina Faso">{this.props.t('Burkina Faso')}</MenuItem>
                                        <MenuItem value="Burundi">{this.props.t('Burundi')}</MenuItem>
                                        <MenuItem value="Cambodia">{this.props.t('Cambodia')}</MenuItem>
                                        <MenuItem value="Cameroon">{this.props.t('Cameroon')}</MenuItem>
                                        <MenuItem value="Canada">{this.props.t('Canada')}</MenuItem>
                                        <MenuItem value="Cape Verde">{this.props.t('Cape Verde')}</MenuItem>
                                        <MenuItem value="Cayman Islands">{this.props.t('Cayman Islands')}</MenuItem>
                                        <MenuItem value="Central African Republic">
                                            {this.props.t('Central African Republic')}
                                        </MenuItem>
                                        <MenuItem value="Chad">{this.props.t('Chad')}</MenuItem>
                                        <MenuItem value="Chile">{this.props.t('Chile')}</MenuItem>
                                        <MenuItem value="Christmas Island">
                                            {this.props.t('Christmas Island')}
                                        </MenuItem>
                                        <MenuItem value="Cocos Islands">{this.props.t('Cocos Islands')}</MenuItem>
                                        <MenuItem value="Colombia">{this.props.t('Colombia')}</MenuItem>
                                        <MenuItem value="Comoros">{this.props.t('Comoros')}</MenuItem>
                                        <MenuItem value="Congo">{this.props.t('Congo')}</MenuItem>
                                        <MenuItem value="Cook Islands">{this.props.t('Cook Islands')}</MenuItem>
                                        <MenuItem value="Costa Rica">{this.props.t('Costa Rica')}</MenuItem>
                                        <MenuItem value="Croatia">{this.props.t('Croatia')}</MenuItem>
                                        <MenuItem value="Cuba">{this.props.t('Cuba')}</MenuItem>
                                        <MenuItem value="Cyprus">{this.props.t('Cyprus')}</MenuItem>
                                        <MenuItem value="Czech Republic">{this.props.t('Czech Republic')}</MenuItem>
                                        <MenuItem value="Denmark">{this.props.t('Denmark')}</MenuItem>
                                        <MenuItem value="Djibouti">{this.props.t('Djibouti')}</MenuItem>
                                        <MenuItem value="Dominica">{this.props.t('Dominica')}</MenuItem>
                                        <MenuItem value="Dominican Republic">
                                            {this.props.t('Dominican Republic')}
                                        </MenuItem>
                                        <MenuItem value="East Timor">{this.props.t('East Timor')}</MenuItem>
                                        <MenuItem value="Ecuador">{this.props.t('Ecuador')}</MenuItem>
                                        <MenuItem value="Egypt">{this.props.t('Egypt')}</MenuItem>
                                        <MenuItem value="El Salvador">{this.props.t('El Salvador')}</MenuItem>
                                        <MenuItem value="Equatorial Guinea">
                                            {this.props.t('Equatorial Guinea')}
                                        </MenuItem>
                                        <MenuItem value="Eritrea">{this.props.t('Eritrea')}</MenuItem>
                                        <MenuItem value="Estonia">{this.props.t('Estonia')}</MenuItem>
                                        <MenuItem value="Ethiopia">{this.props.t('Ethiopia')}</MenuItem>
                                        <MenuItem value="Falkland Islands (Malvinas)">
                                            {this.props.t('Falkland Islands (Malvinas)')}
                                        </MenuItem>
                                        <MenuItem value="Faroe Islands">{this.props.t('Faroe Islands')}</MenuItem>
                                        <MenuItem value="Fiji">{this.props.t('Fiji')}</MenuItem>
                                        <MenuItem value="Finland">{this.props.t('Finland')}</MenuItem>
                                        <MenuItem value="French Guiana">{this.props.t('French Guiana')}</MenuItem>
                                        <MenuItem value="French Polynesia">
                                            {this.props.t('French Polynesia')}
                                        </MenuItem>
                                        <MenuItem value="French Southern Territories">
                                            {this.props.t('French Southern Territories')}
                                        </MenuItem>
                                        <MenuItem value="Gabon">{this.props.t('Gabon')}</MenuItem>
                                        <MenuItem value="Gambia">{this.props.t('Gambia')}</MenuItem>
                                        <MenuItem value="Georgia">{this.props.t('Georgia')}</MenuItem>
                                        <MenuItem value="Ghana">{this.props.t('Ghana')}</MenuItem>
                                        <MenuItem value="Gibraltar">{this.props.t('Gibraltar')}</MenuItem>
                                        <MenuItem value="Guernsey">{this.props.t('Guernsey')}</MenuItem>
                                        <MenuItem value="Greece">{this.props.t('Greece')}</MenuItem>
                                        <MenuItem value="Greenland">{this.props.t('Greenland')}</MenuItem>
                                        <MenuItem value="Grenada">{this.props.t('Grenada')}</MenuItem>
                                        <MenuItem value="Guadeloupe">{this.props.t('Guadeloupe')}</MenuItem>
                                        <MenuItem value="Guam">{this.props.t('Guam')}</MenuItem>
                                        <MenuItem value="Guatemala">{this.props.t('Guatemala')}</MenuItem>
                                        <MenuItem value="Guinea">{this.props.t('Guinea')}</MenuItem>
                                        <MenuItem value="Guinea-Bissau">{this.props.t('Guinea-Bissau')}</MenuItem>
                                        <MenuItem value="Guyana">{this.props.t('Guyana')}</MenuItem>
                                        <MenuItem value="Haiti">{this.props.t('Haiti')}</MenuItem>
                                        <MenuItem value="Heard and Mc Donald Islands">
                                            {this.props.t('Heard and Mc Donald Islands')}
                                        </MenuItem>
                                        <MenuItem value="Honduras">{this.props.t('Honduras')}</MenuItem>
                                        <MenuItem value="Hong Kong">{this.props.t('Hong Kong')}</MenuItem>
                                        <MenuItem value="Hungary">{this.props.t('Hungary')}</MenuItem>
                                        <MenuItem value="Iceland">{this.props.t('Iceland')}</MenuItem>
                                        <MenuItem value="India">{this.props.t('India')}</MenuItem>
                                        <MenuItem value="Isle of Man">{this.props.t('Isle of Man')}</MenuItem>
                                        <MenuItem value="Indonesia">{this.props.t('Indonesia')}</MenuItem>
                                        <MenuItem value="Iran">{this.props.t('Iran')}</MenuItem>
                                        <MenuItem value="Iraq">{this.props.t('Iraq')}</MenuItem>
                                        <MenuItem value="Ireland">{this.props.t('Ireland')}</MenuItem>
                                        <MenuItem value="Israel">{this.props.t('Israel')}</MenuItem>
                                        <MenuItem value="Ivory Coast">{this.props.t('Ivory Coast')}</MenuItem>
                                        <MenuItem value="Jersey">{this.props.t('Jersey')}</MenuItem>
                                        <MenuItem value="Jamaica">{this.props.t('Jamaica')}</MenuItem>
                                        <MenuItem value="Japan">{this.props.t('Japan')}</MenuItem>
                                        <MenuItem value="Jordan">{this.props.t('Jordan')}</MenuItem>
                                        <MenuItem value="Kazakhstan">{this.props.t('Kazakhstan')}</MenuItem>
                                        <MenuItem value="Kenya">{this.props.t('Kenya')}</MenuItem>
                                        <MenuItem value="Kiribati">{this.props.t('Kiribati')}</MenuItem>
                                        <MenuItem value="Korea">{this.props.t('Korea')}</MenuItem>
                                        <MenuItem value="Kosovo">{this.props.t('Kosovo')}</MenuItem>
                                        <MenuItem value="Kuwait">{this.props.t('Kuwait')}</MenuItem>
                                        <MenuItem value="Kyrgyzstan">{this.props.t('Kyrgyzstan')}</MenuItem>
                                        <MenuItem value="Lao People's Democratic Republic">
                                            {this.props.t("Lao People's Democratic Republic")}
                                        </MenuItem>
                                        <MenuItem value="Latvia">{this.props.t('Latvia')}</MenuItem>
                                        <MenuItem value="Lebanon">{this.props.t('Lebanon')}</MenuItem>
                                        <MenuItem value="Lesotho">{this.props.t('Lesotho')}</MenuItem>
                                        <MenuItem value="Liberia">{this.props.t('Liberia')}</MenuItem>
                                        <MenuItem value="Libyan Arab Jamahiriya">
                                            {this.props.t('Libyan Arab Jamahiriya')}
                                        </MenuItem>
                                        <MenuItem value="Liechtenstein">{this.props.t('Liechtenstein')}</MenuItem>
                                        <MenuItem value="Lithuania">{this.props.t('Lithuania')}</MenuItem>
                                        <MenuItem value="Luxembourg">{this.props.t('Luxembourg')}</MenuItem>
                                        <MenuItem value="Macau">{this.props.t('Macau')}</MenuItem>
                                        <MenuItem value="Macedonia">{this.props.t('Macedonia')}</MenuItem>
                                        <MenuItem value="Madagascar">{this.props.t('Madagascar')}</MenuItem>
                                        <MenuItem value="Malawi">{this.props.t('Malawi')}</MenuItem>
                                        <MenuItem value="Malaysia">{this.props.t('Malaysia')}</MenuItem>
                                        <MenuItem value="Maldives">{this.props.t('Maldives')}</MenuItem>
                                        <MenuItem value="Mali">{this.props.t('Mali')}</MenuItem>
                                        <MenuItem value="Malta">{this.props.t('Malta')}</MenuItem>
                                        <MenuItem value="Marshall Islands">
                                            {this.props.t('Marshall Islands')}
                                        </MenuItem>
                                        <MenuItem value="Martinique">{this.props.t('Martinique')}</MenuItem>
                                        <MenuItem value="Mauritania">{this.props.t('Mauritania')}</MenuItem>
                                        <MenuItem value="Mauritius">{this.props.t('Mauritius')}</MenuItem>
                                        <MenuItem value="Mayotte">{this.props.t('Mayotte')}</MenuItem>
                                        <MenuItem value="Mexico">{this.props.t('Mexico')}</MenuItem>
                                        <MenuItem value="Micronesia">{this.props.t('Micronesia')}</MenuItem>
                                        <MenuItem value="Moldova">{this.props.t('Moldova')}</MenuItem>
                                        <MenuItem value="Monaco">{this.props.t('Monaco')}</MenuItem>
                                        <MenuItem value="Mongolia">{this.props.t('Mongolia')}</MenuItem>
                                        <MenuItem value="Montenegro">{this.props.t('Montenegro')}</MenuItem>
                                        <MenuItem value="Montserrat">{this.props.t('Montserrat')}</MenuItem>
                                        <MenuItem value="Morocco">{this.props.t('Morocco')}</MenuItem>
                                        <MenuItem value="Mozambique">{this.props.t('Mozambique')}</MenuItem>
                                        <MenuItem value="Myanmar">{this.props.t('Myanmar')}</MenuItem>
                                        <MenuItem value="Namibia">{this.props.t('Namibia')}</MenuItem>
                                        <MenuItem value="Nauru">{this.props.t('Nauru')}</MenuItem>
                                        <MenuItem value="Nepal">{this.props.t('Nepal')}</MenuItem>
                                        <MenuItem value="Netherlands Antilles">
                                            {this.props.t('Netherlands Antilles')}
                                        </MenuItem>
                                        <MenuItem value="New Caledonia">{this.props.t('New Caledonia')}</MenuItem>
                                        <MenuItem value="New Zealand">{this.props.t('New Zealand')}</MenuItem>
                                        <MenuItem value="Nicaragua">{this.props.t('Nicaragua')}</MenuItem>
                                        <MenuItem value="Niger">{this.props.t('Niger')}</MenuItem>
                                        <MenuItem value="Nigeria">{this.props.t('Nigeria')}</MenuItem>
                                        <MenuItem value="Niue">{this.props.t('Niue')}</MenuItem>
                                        <MenuItem value="Norfolk Island">{this.props.t('Norfolk Island')}</MenuItem>
                                        <MenuItem value="Northern Mariana Islands">
                                            {this.props.t('Northern Mariana Islands')}
                                        </MenuItem>
                                        <MenuItem value="Norway">{this.props.t('Norway')}</MenuItem>
                                        <MenuItem value="Oman">{this.props.t('Oman')}</MenuItem>
                                        <MenuItem value="Pakistan">{this.props.t('Pakistan')}</MenuItem>
                                        <MenuItem value="Palau">{this.props.t('Palau')}</MenuItem>
                                        <MenuItem value="Palestine">{this.props.t('Palestine')}</MenuItem>
                                        <MenuItem value="Panama">{this.props.t('Panama')}</MenuItem>
                                        <MenuItem value="Papua New Guinea">
                                            {this.props.t('Papua New Guinea')}
                                        </MenuItem>
                                        <MenuItem value="Paraguay">{this.props.t('Paraguay')}</MenuItem>
                                        <MenuItem value="Peru">{this.props.t('Peru')}</MenuItem>
                                        <MenuItem value="Philippines">{this.props.t('Philippines')}</MenuItem>
                                        <MenuItem value="Pitcairn">{this.props.t('Pitcairn')}</MenuItem>
                                        <MenuItem value="Poland">{this.props.t('Poland')}</MenuItem>
                                        <MenuItem value="Portugal">{this.props.t('Portugal')}</MenuItem>
                                        <MenuItem value="Puerto Rico">{this.props.t('Puerto Rico')}</MenuItem>
                                        <MenuItem value="Qatar">{this.props.t('Qatar')}</MenuItem>
                                        <MenuItem value="Reunion">{this.props.t('Reunion')}</MenuItem>
                                        <MenuItem value="Romania">{this.props.t('Romania')}</MenuItem>
                                        <MenuItem value="Rwanda">{this.props.t('Rwanda')}</MenuItem>
                                        <MenuItem value="Saint Kitts and Nevis">
                                            {this.props.t('Saint Kitts and Nevis')}
                                        </MenuItem>
                                        <MenuItem value="Saint Lucia">{this.props.t('Saint Lucia')}</MenuItem>
                                        <MenuItem value="Saint Vincent and the Grenadines">
                                            {this.props.t('Saint Vincent and the Grenadines')}
                                        </MenuItem>
                                        <MenuItem value="Samoa">{this.props.t('Samoa')}</MenuItem>
                                        <MenuItem value="San Marino">{this.props.t('San Marino')}</MenuItem>
                                        <MenuItem value="Sao Tome and Principe">
                                            {this.props.t('Sao Tome and Principe')}
                                        </MenuItem>
                                        <MenuItem value="Saudi Arabia">{this.props.t('Saudi Arabia')}</MenuItem>
                                        <MenuItem value="Senegal">{this.props.t('Senegal')}</MenuItem>
                                        <MenuItem value="Serbia">{this.props.t('Serbia')}</MenuItem>
                                        <MenuItem value="Seychelles">{this.props.t('Seychelles')}</MenuItem>
                                        <MenuItem value="Sierra Leone">{this.props.t('Sierra Leone')}</MenuItem>
                                        <MenuItem value="Singapore">{this.props.t('Singapore')}</MenuItem>
                                        <MenuItem value="Slovakia">{this.props.t('Slovakia')}</MenuItem>
                                        <MenuItem value="Slovenia">{this.props.t('Slovenia')}</MenuItem>
                                        <MenuItem value="Solomon Islands">
                                            {this.props.t('Solomon Islands')}
                                        </MenuItem>
                                        <MenuItem value="Somalia">{this.props.t('Somalia')}</MenuItem>
                                        <MenuItem value="South Africa">{this.props.t('South Africa')}</MenuItem>
                                        <MenuItem value="South Georgia South Sandwich Islands">
                                            {this.props.t('South Georgia South Sandwich Islands')}
                                        </MenuItem>
                                        <MenuItem value="Spain">{this.props.t('Spain')}</MenuItem>
                                        <MenuItem value="Sri Lanka">{this.props.t('Sri Lanka')}</MenuItem>
                                        <MenuItem value="St. Helena">{this.props.t('St. Helena')}</MenuItem>
                                        <MenuItem value="St. Pierre and Miquelon">
                                            {this.props.t('St. Pierre and Miquelon')}
                                        </MenuItem>
                                        <MenuItem value="Sudan">{this.props.t('Sudan')}</MenuItem>
                                        <MenuItem value="Suriname">{this.props.t('Suriname')}</MenuItem>
                                        <MenuItem value="Svalbard and Jan Mayen Islands">
                                            {this.props.t('Svalbard and Jan Mayen Islands')}
                                        </MenuItem>
                                        <MenuItem value="Swaziland">{this.props.t('Swaziland')}</MenuItem>
                                        <MenuItem value="Sweden">{this.props.t('Sweden')}</MenuItem>
                                        <MenuItem value="Syrian Arab Republic">
                                            {this.props.t('Syrian Arab Republic')}
                                        </MenuItem>
                                        <MenuItem value="Taiwan">{this.props.t('Taiwan')}</MenuItem>
                                        <MenuItem value="Tajikistan">{this.props.t('Tajikistan')}</MenuItem>
                                        <MenuItem value="Tanzania">{this.props.t('Tanzania')}</MenuItem>
                                        <MenuItem value="Thailand">{this.props.t('Thailand')}</MenuItem>
                                        <MenuItem value="Togo">{this.props.t('Togo')}</MenuItem>
                                        <MenuItem value="Tokelau">{this.props.t('Tokelau')}</MenuItem>
                                        <MenuItem value="Tonga">{this.props.t('Tonga')}</MenuItem>
                                        <MenuItem value="Trinidad and Tobago">
                                            {this.props.t('Trinidad and Tobago')}
                                        </MenuItem>
                                        <MenuItem value="Tunisia">{this.props.t('Tunisia')}</MenuItem>
                                        <MenuItem value="Turkey">{this.props.t('Turkey')}</MenuItem>
                                        <MenuItem value="Turkmenistan">{this.props.t('Turkmenistan')}</MenuItem>
                                        <MenuItem value="Turks and Caicos Islands">
                                            {this.props.t('Turks and Caicos Islands')}
                                        </MenuItem>
                                        <MenuItem value="Tuvalu">{this.props.t('Tuvalu')}</MenuItem>
                                        <MenuItem value="Uganda">{this.props.t('Uganda')}</MenuItem>
                                        <MenuItem value="Ukraine">{this.props.t('Ukraine')}</MenuItem>
                                        <MenuItem value="United Arab Emirates">
                                            {this.props.t('United Arab Emirates')}
                                        </MenuItem>
                                        <MenuItem value="United States minor outlying islands">
                                            {this.props.t('United States minor outlying islands')}
                                        </MenuItem>
                                        <MenuItem value="Uruguay">{this.props.t('Uruguay')}</MenuItem>
                                        <MenuItem value="Uzbekistan">{this.props.t('Uzbekistan')}</MenuItem>
                                        <MenuItem value="Vanuatu">{this.props.t('Vanuatu')}</MenuItem>
                                        <MenuItem value="Vatican City State">
                                            {this.props.t('Vatican City State')}
                                        </MenuItem>
                                        <MenuItem value="Venezuela">{this.props.t('Venezuela')}</MenuItem>
                                        <MenuItem value="Vietnam">{this.props.t('Vietnam')}</MenuItem>
                                        <MenuItem value="Virgin Islands (British)">
                                            {this.props.t('Virgin Islands (British)')}
                                        </MenuItem>
                                        <MenuItem value="Virgin Islands (U.S.)">
                                            {this.props.t('Virgin Islands (U.S.)')}
                                        </MenuItem>
                                        <MenuItem value="Wallis and Futuna Islands">
                                            {this.props.t('Wallis and Futuna Islands')}
                                        </MenuItem>
                                        <MenuItem value="Western Sahara">{this.props.t('Western Sahara')}</MenuItem>
                                        <MenuItem value="Yemen">{this.props.t('Yemen')}</MenuItem>
                                        <MenuItem value="Zaire">{this.props.t('Zaire')}</MenuItem>
                                        <MenuItem value="Zambia">{this.props.t('Zambia')}</MenuItem>
                                        <MenuItem value="Zimbabwe">{this.props.t('Zimbabwe')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item>
                                <TextField
                                    variant="standard"
                                    label={this.props.t('City')}
                                    style={styles.controlItem}
                                    value={this.state.city}
                                    onChange={e => this.setState({ city: e.target.value })}
                                    InputProps={{
                                        endAdornment: this.state.city ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => this.setState({ city: '' })}
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    }}
                                />
                            </Grid>
                            <Grid item>
                                <TextField
                                    variant="standard"
                                    label={this.props.t('Address')}
                                    style={styles.controlItemAddress}
                                    value={this.state.address}
                                    onKeyUp={e => e.key === 'Enter' && this.getPositionForAddress()}
                                    onChange={e => this.setState({ address: e.target.value })}
                                    helperText={this.props.t('Used only to calculate position.')}
                                    InputProps={{
                                        endAdornment: this.state.address ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => this.setState({ address: '' })}
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    }}
                                />
                                <Fab size="small" onClick={() => this.getPositionForAddress()}>
                                    <GeoIcon />
                                </Fab>
                            </Grid>
                            <Grid item>
                                <TextField
                                    variant="standard"
                                    label={this.props.t('Longitude')}
                                    style={styles.controlItem}
                                    value={this.state.longitude}
                                    onChange={e =>
                                        this.setState({ longitude: parseFloat(e.target.value.replace(',', '.')) })}
                                    InputProps={{
                                        endAdornment: this.state.longitude ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => this.setState({ longitude: '' })}
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    }}
                                />
                            </Grid>
                            <Grid item>
                                <TextField
                                    variant="standard"
                                    label={this.props.t('Latitude')}
                                    style={styles.controlItem}
                                    value={this.state.latitude}
                                    onChange={e =>
                                        this.setState({ latitude: parseFloat(e.target.value.replace(',', '.')) })}
                                    InputProps={{
                                        endAdornment: this.state.latitude ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => this.setState({ latitude: '' })}
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    }}
                                />
                            </Grid>
                            <Grid item style={{ textAlign: 'left' }}>
                                <FormControl variant="standard" style={styles.controlItem}>
                                    <InputLabel>{this.props.t('Week starts with')}</InputLabel>
                                    <Select
                                        variant="standard"
                                        value={this.state.firstDayOfWeek}
                                        onChange={e =>
                                            this.setState({ firstDayOfWeek: e.target.value as 'sunday' | 'monday' })}
                                    >
                                        <MenuItem value="monday">{this.props.t('monday')}</MenuItem>
                                        <MenuItem value="sunday">{this.props.t('sunday')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item style={styles.mapGrid}>
                    <div id="map" style={styles.map} />
                </Grid>
            </Grid>
            <Toolbar style={styles.toolbar}>
                <div style={styles.grow} />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => this.props.onDone({
                        tempUnit: this.state.tempUnit,
                        currency: this.state.currency,
                        dateFormat: this.state.dateFormat,
                        isFloatComma: this.state.isFloatComma,
                        address: this.state.address,
                        firstDayOfWeek: this.state.firstDayOfWeek,
                        country: this.state.country,
                        city: this.state.city,
                        longitude: parseFloat(this.state.longitude as string),
                        latitude: parseFloat(this.state.latitude as string),
                    })}
                    startIcon={<IconCheck />}
                >
                    {this.props.t('Save')}
                </Button>
                <div style={styles.grow} />
            </Toolbar>
        </Paper>;
    }
}

export default withWidth()(WizardSettingsTab);
