import { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import { MapContainer, TileLayer } from 'react-leaflet';
import { useMap } from 'react-leaflet/hooks';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import FormHelperText from '@mui/material/FormHelperText';

import ConfirmDialog from '@iobroker/adapter-react-v5/Dialogs/Confirm';
import withWidth from '@iobroker/adapter-react-v5/Components/withWidth';

import Utils from '../../Utils';
import countries from '../../assets/json/countries';

const styles = theme => ({
    tabPanel: {
        width: '100%',
        height: '100% ',
        overflow: 'auto',
        overflowX: 'hidden',
        padding: 15,
        // backgroundColor: blueGrey[ 50 ]
    },
    formControl: {
        marginRight: theme.spacing(1),
        minWidth: '100%',
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
    map: {
        borderRadius: 5
    }
});

function MyMapComponent(props) {
    const map = useMap();
    props.addMap && props.addMap(map);
    return null;
}

class MainSettingsDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [],
            data: {},
            zoom: 14
        };
    }

    getSettings() {
        return [
            {
                id: 'language',
                title: 'System language:',
                translate: false,
                values: [
                    {
                        id: 'en',
                        title: 'English'
                    },
                    {
                        id: 'de',
                        title: 'Deutsch'
                    },
                    {
                        id: 'ru',
                        title: 'русский'
                    },
                    {
                        id: 'uk',
                        title: 'український'
                    },
                    {
                        id: 'pt',
                        title: 'Portugues'
                    },
                    {
                        id: 'nl',
                        title: 'Nederlands'
                    },
                    {
                        id: 'fr',
                        title: 'français'
                    },
                    {
                        id: 'it',
                        title: 'Italiano'
                    },
                    {
                        id: 'es',
                        title: 'Espanol'
                    },
                    {
                        id: 'pl',
                        title: 'Polski'
                    },
                    {
                        id: 'zh-ch',
                        title: '简体中文'
                    }
                ]
            },
            {
                id: 'tempUnit',
                title: 'Temperature units',
                translate: false,
                values: [
                    {
                        id: '°C',
                        title: '°C'
                    },
                    {
                        id: '°F',
                        title: '°F'
                    }
                ]
            },
            {
                id: 'currency',
                title: 'Currency sign',
                translate: false,
                allowText: true,
                autocomplete: true,
                values: [
                    {
                        id: '€',
                        title: '€'
                    },
                    {
                        id: '$',
                        title: '$'
                    },
                    {
                        id: '₽',
                        title: '₽'
                    },
                    {
                        id: '₤',
                        title: '₤'
                    },
                    {
                        id: 'CHF',
                        title: 'CHF'
                    }
                ]
            },
            {
                id: 'dateFormat',
                title: 'Date format',
                translate: true,
                values: [
                    {
                        id: 'DD.MM.YYYY',
                        title: 'DD.MM.YYYY'
                    },
                    {
                        id: 'YYYY.MM.DD',
                        title: 'YYYY.MM.DD'
                    },
                    {
                        id: 'MM/DD/YYYY',
                        title: 'MM/DD/YYYY'
                    }
                ]
            },
            {
                id: 'isFloatComma',
                title: 'Float divider sign',
                translate: true,
                values: [
                    {
                        id: true,
                        title: 'comma'
                    },
                    {
                        id: false,
                        title: 'point'
                    }
                ]
            },
            {
                id: 'defaultHistory',
                title: 'Default History',
                values: [{ id: '', title: this.props.t('None') }, ...this.props.histories.map(history => {
                    return {
                        id: history,
                        title: history
                    }
                })]
            },
            {
                id: 'activeRepo',
                title: 'Default Repository',
                translate: false,
                values: Utils.objectMap(this.props.dataAux.native.repositories, (repo, name) =>
                    ({
                        id: name,
                        title: name
                    }))
            },
            {
                id: 'expertMode',
                title: 'Expert mode',
                values: [{ id: true, title: 'on' }, { id: false, title: 'off (default)' }]
            },
            {
                id: 'defaultLogLevel',
                title: 'Default log level',
                help: 'for new instances',
                translate: false,
                values: [{ id: 'debug', title: 'debug' }, { id: 'info', title: 'info' }, { id: 'warn', title: 'warn' }, { id: 'error', title: 'error' }]
            },
            {
                id: 'firstDayOfWeek',
                title: 'First day of week',
                translate: true,
                values: [{ id: 'monday', title: 'Monday' }, { id: 'sunday', title: 'Sunday' }]
            }
        ];
    }

    onMap = map => {
        if (!this.map || this.map !== map) {
            this.map = map;
            const center = [
                parseFloat(this.props.data.common.latitude  !== undefined ? this.props.data.common.latitude  : 50) || 0,
                parseFloat(this.props.data.common.longitude !== undefined ? this.props.data.common.longitude : 10) || 0
            ];

            this.marker = window.L.marker(
                center,
                {
                    draggable: true,
                    title: 'Resource location',
                    alt: 'Resource Location',
                    riseOnHover: true
                }
            )
                .addTo(map)
                .bindPopup('Popup for any custom information.')
                .on({ dragend: evt => this.onMarkerDragend(evt) });
        }
    }

    getSelect(e, i) {
        const { classes } = this.props;
        let value = this.props.data.common[e.id];

        if (e.id === 'defaultLogLevel' && !value) {
            value = 'info';
        }

        if (e.id === 'activeRepo' && this.props.multipleRepos) {
            return null;
        }

        // if disabled by vendor settings
        if (this.props.adminGuiConfig.admin.settings && this.props.adminGuiConfig.admin.settings[e.id] === false) {
            return null;
        }

        if (e.autocomplete && e.values) {
            return <Grid item sm={6} xs={12} key={i}>
                <Autocomplete
                    variant="standard"
                    freeSolo
                    options={e.values}
                    inputValue={value.toString()}
                    onChange={(evt, newValue) => {
                        const id = this.getSettings()[i].id;
                        this.doChange(id, newValue ? newValue.id : '');
                    }}
                    onInputChange={(event, newValue) => {
                        const id = this.getSettings()[i].id;
                        this.doChange(id, newValue);
                    }}
                    getOptionLabel={option =>
                        e.translate ? this.props.t(option.title || option.id) : option.title || option.id}
                    renderOption={(props, option) => <li {...props}>{e.translate ? this.props.t(option.title || option.id) : option.title || option.id}</li>}
                    renderInput={params =>
                        <TextField {...params} variant="standard" label={this.props.t(e.title)} />}
                />
            </Grid>;
        }

        // If value is not in known values, show text input
        if (e.allowText && value && !e.values.find(elem => elem.id === value)) {
            return <Grid item sm={6} xs={12} key={i}>
                <FormControl className={classes.formControl} variant="standard">
                    <InputLabel shrink id={e.id + '-label'}>
                        {this.props.t(e.title)}
                    </InputLabel>
                    <TextField
                        variant="standard"
                        id={e.id}
                        value={value.toString()}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ readOnly: false }}
                        onChange={evt => this.handleChange(evt, i)}
                        helperText={e.help ? this.props.t(e.help) : ''}
                    />
                </FormControl>
            </Grid>;
        }

        const items = e.values.map((elem, index) => <MenuItem value={elem.id} key={index}>
            {e.translate ? this.props.t(elem.title || elem.id) : elem.title || elem.id}
        </MenuItem>);

        return <Grid item sm={6} xs={12} key={i}>
            <FormControl className={classes.formControl} variant="standard">
                <InputLabel shrink id={e.id + '-label'}>
                    {this.props.t(e.title)}
                </InputLabel>
                <Select
                    variant="standard"
                    className={classes.formControl}
                    id={e.id}
                    value={value === undefined ? false : value}
                    onChange={evt => this.handleChange(evt, i)}
                    displayEmpty
                >
                    {items}
                </Select>
                {e.help ? <FormHelperText>{this.props.t(e.help)}</FormHelperText> : null}
            </FormControl>
        </Grid>;
    }

    renderConfirmDialog() {
        if (this.state.confirm) {
            return <ConfirmDialog
                text={this.props.t('confirm_change_repo')}
                onClose={result => {
                    const value = this.state.confirmValue;
                    this.setState({ confirm: false, confirmValue: null }, () => {
                        if (result) {
                            this.doChange('activeRepo', value);
                        }
                    });
                }}
            />;
        } else {
            return null;
        }
    }

    getCounters = () => {
        const { classes } = this.props;
        const items = countries.map((elem, index) => <MenuItem value={elem.name} key={index}>
            {this.props.t(elem.name)}
        </MenuItem>);

        return <FormControl className={classes.formControl} variant="standard">
            <InputLabel shrink id={'country-label'}>
                {this.props.t('Country:')}
            </InputLabel>
            <Select
                variant="standard"
                className={classes.formControl}
                id={'country'}
                value={this.props.data.common.country}
                onChange={this.handleChangeCountry}
                displayEmpty
            >
                {items}
            </Select>
        </FormControl>;
    }

    handleChangeCountry = evt => {
        const value = evt.target.value;
        const id = 'country';
        this.doChange(id, value);
    }

    onChangeText = (evt, id) => {
        const value = evt.target.value;
        this.onChangeInput(value, id);

        if (id === 'longitude' || id === 'latitude') {
            this.latLongTimer && clearTimeout(this.latLongTimer);
            this.latLongTimer = setTimeout(() => {
                this.latLongTimer = null;
                this.map.flyTo([this.props.data.common.latitude, this.props.data.common.longitude]);
                this.marker.setLatLng([this.props.data.common.latitude, this.props.data.common.longitude]);
            }, 500);
        }
    }

    onChangeInput = (value, id, cb) =>
        this.doChange(id, value, cb);

    onChangeCity = evt => {
        this.onChangeText(evt, 'city');

        this.cityTimer && clearTimeout(this.cityTimer);

        this.cityTimer = setTimeout(() => {
            this.cityTimer = null;
            const provider = new OpenStreetMapProvider();

            provider.search({ query: evt.target.value })
                .then(results => {
                    if (results[0]) {
                        setTimeout(() =>
                            this.onChangeInput(results[0].y, 'latitude', () =>
                                this.onChangeInput(results[0].x, 'longitude', () =>
                                    this.onChangeInput(23, 'zoom', () => {
                                        this.map.flyTo([results[0].y, results[0].x]);
                                        this.marker.setLatLng([results[0].y, results[0].x]);
                                    })
                                )
                            ), 1200);
                    }
                });
        }, 500);
    }

    handleChange = (evt, selectId) => {
        const value = evt.target.value;
        const id = this.getSettings()[selectId].id;

        if (id === 'activeRepo' && !value.toLowerCase().startsWith('stable') && !value.toLowerCase().includes('default')) {
            this.setState({ confirm: true, confirmValue: value });
        } else {
            this.doChange(id, value);
        }
    }

    doChange = (name, value, cb) => {
        let newData = JSON.parse(JSON.stringify(this.props.data))
        newData.common[name] = value;
        this.props.onChange(newData, null, () =>
            cb && cb());
    }

    onMarkerDragend = evt => {
        const ll = JSON.parse(JSON.stringify(evt.target._latlng));
        this.doChange('latitude',  ll.lat, () =>
            this.doChange('longitude', ll.lng));
    }

    render() {
        const { classes } = this.props;
        const selectors = this.getSettings().map((e, i) => this.getSelect(e, i));

        const center = [
            parseFloat(this.props.data.common.latitude  !== undefined ? this.props.data.common.latitude  : 50) || 0,
            parseFloat(this.props.data.common.longitude !== undefined ? this.props.data.common.longitude : 10) || 0
        ];

        const { zoom } = this.state;

        return <div className={classes.tabPanel}>
            {this.renderConfirmDialog()}
            <Grid container spacing={3}>
                <Grid item lg={6} md={12}>
                    <Grid container spacing={3}>
                        {selectors}
                    </Grid>
                </Grid>
                <Grid item lg={6} md={12} style={{ width: '100%' }}>
                    <MapContainer
                        className={classes.map}
                        center={center}
                        zoom={zoom}
                        maxZoom={18}
                        attributionControl={true}
                        zoomControl={true}
                        doubleClickZoom={true}
                        scrollWheelZoom={true}
                        dragging={true}
                        animate={true}
                        easeLinearity={0.35}
                    >
                        <TileLayer url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"/>
                        <MyMapComponent addMap={map => this.onMap(map)}/>
                    </MapContainer>
                </Grid>
            </Grid>
            <Grid container spacing={6}>
                <Grid item md={3} sm={6} xs={12}>
                    {this.getCounters()}
                </Grid>
                <Grid item md={3} sm={6} xs={12}>
                    <FormControl className={classes.formControl} variant="standard">
                        <InputLabel shrink id={'city-label'}>
                            {this.props.t('City:')}
                        </InputLabel>
                        <TextField
                            variant="standard"
                            id="city"
                            label={this.props.t('City:')}
                            value={this.props.data.common.city}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ readOnly: false }}
                            onChange={evt => this.onChangeCity(evt)}
                        />
                    </FormControl>
                </Grid>
                <Grid item md={3} sm={6} xs={12}>
                    <FormControl className={classes.formControl} variant="standard">
                        <InputLabel shrink id="latitude-label">
                            {this.props.t('Latitude:')}
                        </InputLabel>
                        <TextField
                            variant="standard"
                            id="latitude"
                            label={this.props.t('Latitude:')}
                            value={this.props.data.common.latitude || 0}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ readOnly: false }}
                            onChange={evt => this.onChangeText(evt, 'latitude')}
                        />
                    </FormControl>
                </Grid>
                <Grid item md={3} sm={6} xs={12}>
                    <FormControl className={classes.formControl} variant="standard">
                        <InputLabel shrink id="longitude-label">
                            {this.props.t('Longitude:')}
                        </InputLabel>
                        <TextField
                            variant="standard"
                            id="longitude"
                            label={this.props.t('Longitude:')}
                            value={this.props.data.common.longitude || 0}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ readOnly: false }}
                            onChange={evt => this.onChangeText(evt, 'longitude')}
                        />
                    </FormControl>
                </Grid>
            </Grid>
        </div>;
    }
}

MainSettingsDialog.propTypes = {
    t: PropTypes.func,
    data: PropTypes.object,
    dataAux: PropTypes.object,
    adminGuiConfig: PropTypes.object,
};

export default withWidth()(withStyles(styles)(MainSettingsDialog));
