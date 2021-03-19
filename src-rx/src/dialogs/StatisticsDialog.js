//StatisticsDialog.js


import { Component } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/ext-language_tools'

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
        //backgroundColor: blueGrey[ 50 ]
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
        //console.log(this.state)
        const {common} = this.props;
        const {classes} = this.props;
        return <div className={ classes.tabPanel } style={{height:100}}>
            <Grid container spacing={3}  className="sendData-grid">
                <Grid item lg={4}>
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
                <Grid item lg={8} className="sendData-grid" style={{height:100}}>
                    <Paper className={classes.statis} >
                        <Typography gutterBottom variant="h6" component="div">
                            {this.props.t("Sent data:")}
                        </Typography>                       
                    </Paper>
                    <AceEditor
                        mode="json"
                        width="100%"
                        height="100%"
                        showPrintMargin={true}
                        showGutter={true}
                        highlightActiveLine={true}
                        theme={ this.props.themeName === 'dark' || this.props.themeName === 'blue' ? 'clouds_midnight' : 'chrome' }
                        value={ JSON.stringify(this.state.data2, null, 2) }
                        onChange={ newValue => this.onChange(newValue) }
                        name="UNIQUE_ID_OF_DIV"
                        fontSize={14}
                        setOptions={{ 
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                            enableSnippets: true,
                            showLineNumbers: true,
                            tabSize: 2,
                        }}
                        editorProps={{ $blockScrolling: true }}
                    />  
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
        const {common} = this.state;
        const items = this.getTypes().map((elem, index) =>
        {
            return <MenuItem value={elem.title} key={index}>
                { this.props.t(elem.title) }
            </MenuItem> 
        })
        return <FormControl className={classes.formControl}>
            <InputLabel shrink id={"statistics-label"}>
                { this.props.t("Statistics")}
            </InputLabel>
            <Select
                className={classes.formControl}
                id={"statistics"}
                value={ this.state.common.diag }
                onChange={ this.handleChangeStatistics }
                displayEmpty 
                inputProps={{ 'aria-label': 'Without label' }}
            > 
                {items}
            </Select> 
        </FormControl> 
    }
	
    handleChangeStatistics = evt =>
    {
        console.log( evt.target.value );
        this.setState({
            common: {...this.state.common, diag:evt.target.value }
        })
        
    }
	
}


export default withWidth()
(
    withStyles(styles)(
        StatisticsDialog
    )
);

