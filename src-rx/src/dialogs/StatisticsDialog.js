//StatisticsDialog.js


import { Component } from 'react';

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

import blueGrey from '@material-ui/core/colors/blueGrey'
import { Paper, Card, Typography, MenuItem, FormControl, Select, InputLabel  } from '@material-ui/core'; 


// icons

const styles = theme => ({
    tabPanel: {
        width:      '100%',
        height:     '100% ',
        overflow:   'auto',
        padding:    15,
        backgroundColor: blueGrey[ 50 ]
    },
    note:
    {
        padding:15,
        backgroundColor: blueGrey[ 500 ],
        color:"#FFF"
    },
    statis:
    {
        padding:15
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

class StatisticsDialog extends Component 
{
    constructor(props)
    {
        super(props); 
        this.state={
            ...props 
        }

    }
    render()
    {
        const {classes} = this.props;
        return <div className={ classes.tabPanel }>
            <Grid container spacing={3}>
                <Grid item xs={4}>
                    <Card  className={classes.note} >
                        <Typography gutterBottom variant="h6" component="div">
                            {this.props.t("Note:")} 
                        </Typography> 
                        <Typography 
                            paragraph 
                            variant="body2"
                            component="div"
                            dangerouslySetInnerHTML={{__html: this.props.t("diag-note")}}
                        />     
                     </Card >
                    { this.getTypesSelector() }
                </Grid>
                <Grid item xs={8}>
                    <Paper className={classes.statis} >
                        <Typography gutterBottom variant="h6" component="div">
                            {this.props.t("Sent data:")}
                        </Typography>                       
                    </Paper>
                </Grid>
            </Grid>
        </div>

    }
    getTypes()
    {
        return [
            {
                id: "none",
                title: "none"
            },
            {
                id: "standart",
                title: "standart"
            },
            {
                id: "without_city",
                title: "without city"
            },
            {
                id: "extended",
                title: "extended"
            }
        ]
    }
    getTypesSelector = () =>
    {
        const {classes} = this.props;
        const items = this.getTypes().map((elem, index) =>
        {
            return <MenuItem value={elem.title} key={index}>
                { this.props.t(elem.title) }
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
}


export default withWidth()
(
    withStyles(styles)(
        StatisticsDialog
    )
);

