import { Component } from 'react';

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

// colors
import blueGrey from '@material-ui/core/colors/blueGrey'

// icons

const styles = theme => ({
    tabPanel: 
    {
        width:      '100%',
        height:     '100% ',
        overflow:   'auto',
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
});

class MainSettingsDialog extends Component 
{
    constructor(props)
    {
        super(props);
        this.state={
            values:[]
        }

    }
    getSettings()
    {
        return [
            {
                id      : "system_language",
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
                id:"system_tempUnit",
                title:"Temperature units",
                values: [
                    {
                        id:"celcius",
                        title:"°C"
                    },
                    {
                        id:"fahrenheit",
                        title:"°F"
                    }
                ]
            },
            {
                id:"system_currency",
                title:"Currency sign",
                values: [
                    {
                        id:"euro",
                        title:"€"
                    },
                    {
                        id:"dollar",
                        title:"$"
                    },
                    {
                        id:"ruble",
                        title:"₽"
                    },
                    {
                        id:"pound",
                        title:"₤"
                    }
                ]
            },
            {
                id:"system_dateFormat",
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
                id:"system_isFloatComma",
                title:"Date Float comma sign",
                values: [
                    {
                        id:"comma",
                        title:"Comma"
                    },
                    {
                        id:"point",
                        title:"Point"
                    }
                ]
            },
            {
                id:"system_defaultHistory",
                title:"Default History",
                values: [
                   
                ]
            },
            {
                id:"system_activeRepo",
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
        return <div className={ classes.tabPanel }>
            <Grid container spacing={3}>
                <Grid item xs={6}>
                    <Grid container spacing={3}>
                        {selectors}
                    </Grid>
                </Grid>
                <Grid item xs={6}>
                     MainSettings Map
                </Grid>
                
            </Grid>
        </div>

    }
    getSelect( e, i )
    {
        const {classes} = this.props;
        const value = this.state.values[this.getSettings()[i].id];
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
                {/*
                <FormHelperText>
                    { this.props.t(this.getSettings()[i].title)  }
                </FormHelperText>
                */}
            </FormControl> 
        </Grid >

    }
    handleChange = (evt, selectId) =>
    {

    }
}


export default withWidth()
(
    withStyles(styles)(
        MainSettingsDialog
    )
);
