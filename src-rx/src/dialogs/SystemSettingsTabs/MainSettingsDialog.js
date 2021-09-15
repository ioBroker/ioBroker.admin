import { Component } from 'react';
import PropTypes from 'prop-types';

import { MapContainer as LeafletMap, TileLayer } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import {FormHelperText} from '@material-ui/core';

import Utils from '../../Utils';
import countries from '../../assets/json/countries';

import ConfirmDialog from '@iobroker/adapter-react/Dialogs/Confirm';

const styles = theme => ({
    tabPanel: {
        width: '100%',
        height: '100% ',
        overflow: 'auto',
        overflowX: 'hidden',
        padding: 15,
        //backgroundColor: blueGrey[ 50 ]
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
                values: Utils.objectMap(this.props.dataAux.native.repositories, (repo, name) => {
                    return {
                        id: name,
                        title: name
                    }
                })
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
                values: [{ id: 'debug', title: 'debug' }, { id: 'info', title: 'info1' }, { id: 'warn', title: 'warn' }, { id: 'error', title: 'error' }]
            },
            {
                id: 'firstDayOfWeek',
                title: 'First day of week',
                translate: false,
                values: [{ id: 'monday', title: 'Monday' }, { id: 'sunday', title: 'Sunday' }]
            }
        ];
    }

    onMap = map => {
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
            .on({
                dragend: evt => this.onMarkerDragend(evt)
            });
    }

    getSelect(e, i) {
        const { classes } = this.props;
        let value = this.props.data.common[e.id];

        if (e.id === 'defaultLogLevel' && !value) {
            value = 'info';
        }

        // if disabled by vendor settings
        if (this.props.adminGuiConfig.admin.settings && this.props.adminGuiConfig.admin.settings[e.id] === false) {
            return null;
        }

        // If value is not in known values, show text input
        if (e.allowText && value && !e.values.find(elem => elem.id === value)) {
            return <Grid item sm={6} xs={12} key={i}>
                <FormControl className={classes.formControl}>
                    <InputLabel shrink id={e.id + '-label'}>
                        {this.props.t(e.title)}
                    </InputLabel>
                    <TextField
                        id={e.id}
                        value={value.toString()}
                        InputLabelProps={{readOnly: false, shrink: true}}
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
            <FormControl className={classes.formControl}>
                <InputLabel shrink id={e.id + '-label'}>
                    {this.props.t(e.title)}
                </InputLabel>
                <Select
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

        return <FormControl className={classes.formControl}>
            <InputLabel shrink id={'country-label'}>
                {this.props.t('Country:')}
            </InputLabel>
            <Select
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
    }

    onChangeInput = (value, id) => {
        this.doChange(id, value);
    }

    onChangeCity = (evt) => {
        this.onChangeText(evt, 'city');
        const provider = new OpenStreetMapProvider();

        provider.search({ query: evt.target.value })
            .then(results => {
                if (results[0]) {
                    setTimeout(() => {
                        this.onChangeInput(results[0].y, 'latitude');
                        this.onChangeInput(results[0].x, 'longitude');
                        this.onChangeInput(23, 'zoom');
                        this.map.flyTo(
                            [results[0].y, results[0].x]
                        );
                        this.marker.setLatLng([results[0].y, results[0].x]);
                    }, 1200);
                }
            });
    }

    handleChange = (evt, selectId) => {
        const value = evt.target.value;
        const id = this.getSettings()[selectId].id;

        if (id === 'activeRepo' && value !== 'stable' && value !== 'default') {
            this.setState({ confirm: true, confirmValue: value });
        } else {
            this.doChange(id, value);
        }
    }

    doChange = (name, value) => {
        let newData = JSON.parse(JSON.stringify(this.props.data))
        newData.common[name] = value;
        this.props.onChange(newData);
    }

    onMarkerDragend = evt => {
        const ll = evt.target._latlng;
        this.doChange('latitude',  ll.lat);
        this.doChange('longitude', ll.lng);
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
                    <LeafletMap
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
                        whenCreated={this.onMap}
                    >
                        <TileLayer
                            url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
                        />
                    </LeafletMap>
                </Grid>
            </Grid>
            <Grid container spacing={6}>
                <Grid item md={3} sm={6} xs={12}>
                    {this.getCounters()}
                </Grid>
                <Grid item md={3} sm={6} xs={12}>
                    <FormControl className={classes.formControl}>
                        <InputLabel shrink id={'city-label'}>
                            {this.props.t('City:')}
                        </InputLabel>
                        <TextField
                            id="city"
                            label={this.props.t('City:')}
                            value={this.props.data.common.city}
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeCity(evt)}
                        />
                    </FormControl>
                </Grid>
                <Grid item md={3} sm={6} xs={12}>
                    <FormControl className={classes.formControl}>
                        <InputLabel shrink id="latitude-label">
                            {this.props.t('Latitude:')}
                        </InputLabel>
                        <TextField
                            id="latitude"
                            label={this.props.t('Latitude:')}
                            value={this.props.data.common.latitude || 0}
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, 'latitude')}
                        />
                    </FormControl>
                </Grid>
                <Grid item md={3} sm={6} xs={12}>
                    <FormControl className={classes.formControl}>
                        <InputLabel shrink id="longitude-label">
                            {this.props.t('Longitude:')}
                        </InputLabel>
                        <TextField
                            id="longitude"
                            label={this.props.t('Longitude:')}
                            value={this.props.data.common.longitude || 0}
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
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
