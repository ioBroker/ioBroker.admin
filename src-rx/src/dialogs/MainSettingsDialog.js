import { Component } from 'react';

import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet';

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';

// colors
import blueGrey from '@material-ui/core/colors/blueGrey'

// icons

//data
import countries from "../assets/json/countries";

const styles = theme => ({
    tabPanel: 
    {
        width:      '100%',
        height:     '100% ',
        overflow:   'auto',
        overflowX   : "hidden",
        padding:    15,
        backgroundColor: blueGrey[ 50 ]
    } ,
    formControl: 
    {
        margin: theme.spacing(1),
        minWidth: "100%",
     },
    selectEmpty: 
    {
        marginTop: theme.spacing(2),
    },
    descrPanel:
    {
        width:"100%",
        // backgroundColor:"transparent",
        padding :16,
        // border:"none",
        display:'flex',
        alignItems:"center"
    },
});

class MainSettingsDialog extends Component 
{
    constructor(props)
    {
        super(props);
        this.state={
            values:[],
            ...props
        }

    }
    getSettings()
    {
        return [
            {
                id      : "language",
                title   : "System language:",       
                values  : [
                    {
                        id:"en",
                        title:"English"
                    },
                    {
                        id:"ge",
                        title:"Deutsch"
                    },
                    {
                        id:"ru",
                        title:"русский"
                    },
                    {
                        id:"po",
                        title:"Portugues"
                    },
                    {
                        id:"nd",
                        title:"Nederlands"
                    },
                    {
                        id:"fr",
                        title:"français"
                    },
                    {
                        id:"it",
                        title:"Italiano"
                    },
                    {
                        id:"sp",
                        title:"Espanol"
                    },
                    {
                        id:"pl",
                        title:"Polski"
                    },
                    {
                        id:"ch",
                        title:"简体中文"
                    }
                ]      
            },
            {
                id:"tempUnit",
                title:"Temperature units",
                values: [
                    {
                        id:"°C",
                        title:"°C"
                    },
                    {
                        id:"°F",
                        title:"°F"
                    }
                ]
            },
            {
                id:"currency",
                title:"Currency sign",
                values: [
                    {
                        id:"€",
                        title:"€"
                    },
                    {
                        id:"$",
                        title:"$"
                    },
                    {
                        id:"₽",
                        title:"₽"
                    },
                    {
                        id:"₤",
                        title:"₤"
                    }
                ]
            },
            {
                id:"dateFormat",
                title:"Date format",
                values: [
                    {
                        id:"DD.MM.YYYY",
                        title:"DD.MM.YYYY"
                    },
                    {
                        id:"DD.MM.YY",
                        title:"DD.MM.YY"
                    },
                    {
                        id:"DD/MM/YYYY",
                        title:"DD/MM/YYYY"
                    }
                ]
            },
            {
                id:"isFloatComma",
                title:"Date Float comma sign",
                values: [
                    {
                        id:true,
                        title:"comma"
                    },
                    {
                        id:false,
                        title:"point"
                    }
                ]
            },
            {
                id:"defaultHistory",
                title:"Default History",
                values: [
                   
                ]
            },
            {
                id:"activeRepo",
                title:"Default Repository",
                values: [
                    {
                        id:"default",
                        title:"Stable (default)"
                    },
                    {
                        id:"latest",
                        title:"Beta (latest)"
                    },
                ]
            }
        ]
    }
    render()
    {
        const {classes} = this.props;        
        const selectors = this.getSettings().map((e,i) =>
        {
            return this.getSelect( e, i )
        }) 
        const center = [
            this.state.latitude   ? this.state.latitude : 50,
            this.state.longitude  ? this.state.longitude : 10
        ]
        return <div className={ classes.tabPanel }>
            <Grid container spacing={6}>
                <Grid item xs={6}> 
                    <Paper variant="outlined" className={ classes.descrPanel }>
                        { this.props.t( "cert_path_note" ) }
                    </Paper>
                    <Grid container spacing={3}>
                        {selectors}
                    </Grid>
                </Grid>
                <Grid item xs={6}>
                    <LeafletMap
                        center={center}
                        zoom={14}
                        maxZoom={18}
                        attributionControl={true}
                        zoomControl={true}
                        doubleClickZoom={true}
                        scrollWheelZoom={true}
                        dragging={true}
                        animate={true}
                        easeLinearity={0.35}
                        onClick={this.onMap} 
                    >
                        <TileLayer
                            url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                        />
                        <Marker position={center}>
                            <Popup>
                                Popup for any custom information.
                            </Popup>
                        </Marker>
                    </LeafletMap>
                </Grid>
                
            </Grid>
            <Grid container spacing={6}>
                <Grid item xs={3}>
                    {this.getCounters()}
                </Grid>
                <Grid item xs={3}> 
                    <FormControl className={classes.formControl}>
                        <InputLabel shrink id={ "city-label"}>
                            { this.props.t("City")}
                        </InputLabel>
                        <TextField
                            id="city"
                            label="City"
                            defaultValue={ this.state.city }
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, "city") }
                        />
                    </FormControl>
                </Grid>
                <Grid item xs={3}> 
                    <FormControl className={classes.formControl}>
                        <InputLabel shrink id={ "latitude-label"}>
                            { this.props.t("Latitude")}
                        </InputLabel>
                        <TextField
                            id="latitude"
                            label="Latitude"
                            defaultValue={ this.state.latitude }
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, "latitude") }
                        />
                    </FormControl>
                </Grid>
                <Grid item xs={3}> 
                    <FormControl className={classes.formControl}>
                        <InputLabel shrink id={ "longitude-label"}>
                            { this.props.t("Longitude")}
                        </InputLabel>
                        <TextField
                            id="longitude"
                            label="Longitude"
                            defaultValue={ this.state.longitude }
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, "longitude") }
                        />
                    </FormControl>
                </Grid>
            </Grid>
        </div>

    }
    onMap = evt =>
    {
        console.log('evt');

    }
    getSelect( e, i )
    {
        const {classes} = this.props;
        const value = this.state[this.getSettings()[i].id];
        //console.log( this.getSettings()[i].id, value );
        const items = this.getSettings()[i].values.map((elem, index)=>
        {
             return <MenuItem value={elem.id} key={index}>
                 { this.props.t(elem.title) }
             </MenuItem>   
        } )
        return  <Grid item xs={6} key={i} >
             <FormControl className={classes.formControl}>
                <InputLabel shrink id={e.id + "-label"}>
                    { this.props.t(this.getSettings()[i].title)}
                </InputLabel>
                <Select
                    className={classes.formControl}
                    id={e.id}
                    value={ value }
                    onChange={ evt => this.handleChange(evt, i) }
                    displayEmpty 
                    inputProps={{ 'aria-label': 'Without label' }}
                > 
                    {items}
                </Select> 
            </FormControl> 
        </Grid >

    }
    getCounters = () =>
    {
        const {classes} = this.props;
        const items = countries.map((elem, index) =>
        {
            return <MenuItem value={elem.name} key={index}>
                { this.props.t(elem.name) }
            </MenuItem> 
        })
        return <FormControl className={classes.formControl}>
            <InputLabel shrink id={"country-label"}>
                { this.props.t("Country")}
            </InputLabel>
            <Select
                className={classes.formControl}
                id={"country"}
                value={ this.state.country }
                onChange={ this.handleChangeCountry }
                displayEmpty 
                inputProps={{ 'aria-label': 'Without label' }}
            > 
                {items}
            </Select> 
        </FormControl> 
    }
    handleChangeCountry = evt  =>
    {
        const value = evt.target.value; 
        const id = "country";
        this.props.onChange( id, value);
        console.log( id, value );
        let state = {...this.state};
        state[id] = value;
        this.setState(state);
    }
    onChangeText = (evt, id) =>
    {
        const value = evt.target.value; 
        this.props.onChange( id, value);
        console.log( id, value );
        let state = {...this.state};
        state[id] = value;
        this.setState(state);        
    }
    handleChange = (evt, selectId) =>
    {
        const value = evt.target.value; 
        const id = this.getSettings()[selectId].id;
        this.props.onChange( id, value);
        console.log( id, value );
        let state = {...this.state};
        state[id] = value;
        this.setState(state);
    }
}


export default withWidth()
(
    withStyles(styles)(
        MainSettingsDialog
    )
);
