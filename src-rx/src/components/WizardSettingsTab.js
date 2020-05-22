import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import {Tile, Vector as LayerVector } from 'ol/layer';
import { Icon, Style } from 'ol/style';
import {OSM, Vector as VectorSource} from 'ol/source';
import { Point } from 'ol/geom';
import { toLonLat, fromLonLat } from 'ol/proj';

import Button from '@material-ui/core/Button';
import Paper from  '@material-ui/core/Paper';

import PinSVG from '../assets/pin.svg';

const styles = theme => ({
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        padding: theme.spacing(2),
    },
    title: {
        color: theme.palette.secondary.main,
    },
    mainGrid: {
        height: 'calc(100% - ' + (theme.mixins.toolbar.minHeight + theme.spacing(1)) + 'px)',
        overflow: 'auto',
    },
    input: {
        width: 400,
        marginBottom: theme.spacing(2)
    },
    grow: {
        flexGrow: 1,
    },
    mapGrid: {
        height: '100%',
        width: 'calc(100% - ' + (400 + theme.spacing(1)) + 'px)',
        overflow: 'hidden',
    },
    map: {
        height: 'calc(100% - ' + theme.spacing(2) + 'px)',
        width: 'calc(100% - ' + theme.spacing(2) + 'px)',
        padding: theme.spacing(1),
        overflow: 'hidden',
    },
    controlItem: {
        width: 200,
    },
    gridSettings: {
        width: 400,
        marginRight: theme.spacing(1),
    }
});

class WizardSettingsTab extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            password: '',
            passwordRepeat: '',
            errorPassword: false,
            errorPasswordRepeat: false,
        };

        this.focusRef = React.createRef();

        this.props.socket.getSystemConfig(true)
            .then(obj => {
                    this.setState({
                        tempUnit: obj.common.tempUnit,
                        currency: obj.common.currency,
                        dateFormat: obj.common.dateFormat,
                        isFloatComma: obj.common.isFloatComma,
                        country: obj.common.country,
                        city: obj.common.city,
                        street: '',
                        longitude: obj.common.longitude,
                        latitude: obj.common.latitude,
                    })
                });
    }

    positionReady(position) {
        this.setState({
            latitude: position.coords.latitude.toFixed(8),
            longitude: position.coords.longitude.toFixed(8)
        }, () => this.updateMap());
    }

    updateMap() {
        // OPEN STREET MAPS
        if (window.navigator.geolocation && (!this.state.longitude || !this.state.latitude)) {
            window.navigator.geolocation.getCurrentPosition(position => this.positionReady(position));
        }

        const center = fromLonLat([parseFloat(this.state.longitude || 0), parseFloat(this.state.latitude || 0)]);

        if (!this.OSM) {
            // get the coordinates from browser

            this.OSM = {};
            this.OSM.markerSource = new VectorSource();

            this.OSM.markerStyle = new Style({
                image: new Icon(/** @type {olx.style.IconOptions} */ ({
                    anchor: [0.5, 49],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    opacity: 0.75,
                    src: PinSVG
                }))
            });

            this.OSM.oMap = new Map({
                target: 'map',
                layers: [
                    new Tile({source: new OSM()}),
                    new LayerVector({
                        source: this.OSM.markerSource,
                        style: this.OSM.markerStyle,
                    })
                ],
                view: new View({center, zoom: 17})
            });

            this.OSM.marker = new Feature({
                geometry: new Point(center),
                name: this.props.t('Your home')
            });

            this.OSM.markerSource.addFeature(this.OSM.marker);

            this.OSM.oMap.on('singleclick', event => {
                const lonLat = toLonLat(event.coordinate);
                this.setState( {longitude: lonLat[0], latitude: lonLat[1]}, () => this.updateMap());
            });
        }

        const zoom = this.OSM.oMap.getView().getZoom();
        this.OSM.marker.setGeometry(new Point(center));
        this.OSM.oMap.setView(new View({center, zoom}));
    }

    componentDidMount() {
        this.focusRef.current && this.focusRef.current.focus();
        this.updateMap();
    }

    render() {
        return <Paper className={ this.props.classes.paper }>
                <Grid container direction="column" className={ this.props.classes.mainGrid }>
                    <Grid item className={ this.props.classes.gridSettings }>
                        <Grid container direction="column">
                            <form className={ this.props.classes.form } noValidate autoComplete="off">
                                <Grid item>
                                    <h2 className={ this.props.classes.title }>{ this.props.t('Important main settings') }</h2>
                                </Grid>
                                <Grid item>
                                    <FormControl className={ this.props.classes.controlItem }>
                                        <InputLabel>{ this.props.t('Temperature unit') }</InputLabel>
                                        <Select
                                            value={ this.state.tempUnit }
                                            onChange={e => this.setState({tempUnit: e.target.value}) }
                                        >
                                            <MenuItem value="°C">°C</MenuItem>
                                            <MenuItem value="°F">°F</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl className={ this.props.classes.controlItem }>
                                        <InputLabel>{ this.props.t('Date format') }</InputLabel>
                                        <Select
                                            value={ this.state.dateFormat }
                                            onChange={e => this.setState({dateFormat: e.target.value}) }
                                        >
                                            <MenuItem value="°C">°C</MenuItem>
                                            <MenuItem value="°F">°F</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </form>
                        </Grid>
                    </Grid>
                    <Grid item className={ this.props.classes.mapGrid }>
                        <div id="map" className={ this.props.classes.map }/>
                    </Grid>
                </Grid>
            <Toolbar>
                <div className={ this.props.classes.grow }/>
                <Button variant={"contained"} onClick={ () => this.props.onDone(this.state.password) }>{ this.props.t('Save') }</Button>
            </Toolbar>
        </Paper>;
    }
}

WizardSettingsTab.propTypes = {
    t: PropTypes.func,
    socket: PropTypes.object,
    onDone: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(WizardSettingsTab));
