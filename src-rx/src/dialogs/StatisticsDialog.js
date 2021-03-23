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
    descrPanel:
    {
        width:"100%",
        backgroundColor:"transparent",
        marginLeft:40,
        border:"none",
        display:'flex',
        alignItems:"center"
    },
    selectEmpty: 
    {
        marginTop: theme.spacing(2),
    },
});

class StatisticsDialog extends Component {
    constructor(props) {
        super(props); 
        //console.log(props); 
        this.state={
            ...props 
        }

    }
    componentWillUpdate(nextProps, nextState)
    {
        if(nextProps.common !== this.state.common)
        {
            this.setState({common: nextProps.common});
        }
        if(nextProps.data2 !== this.state.data2)
        {
            this.setState({data2: nextProps.data2});
        }
    }
    getTypes()  {
        return [
            {
                id: "none",
                title: "none"
            },
            {
                id: "normal",
                title: "normal"
            },
            {
                id: "no-city",
                title: "no-city"
            },
            {
                id: "extended",
                title: "extended"
            }
        ]
    }
	
    getTypesSelector = () => {
        const {classes} = this.props;
        const {common} = this.state;
        const items = this.getTypes().map((elem, index) =>
        {
            return <MenuItem value={elem.title} key={index} >
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
                displayEmpty 
                inputProps={{ 'aria-label': 'Without label' }}
                onChange={this.handleChangeType}
            > 
                {items}
            </Select> 
        </FormControl> 
    }
	handleChangeType = evt => {
        //console.log( evt.target.value, this.props.handle );
        this.setState({
            common: {...this.state.common, diag : evt.target.value }
        })
        if(this.props.handle)    
        {
            this.props.handle( evt.target.value );
        }
    }
    render() {
       // console.log(this.state.data2) 
        const {classes} = this.props;
        return <div className={ classes.tabPanel } style={{ height: 'calc(100% - 0px)' }}>
            <Grid container spacing={3}  className="sendData-grid" style={{ height: '100%', overflow: "hidden" }}>
                <Grid item lg={4} md={4} xs={12}>
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
                    <Paper 
                        variant="outlined" 
                        className={ classes.descrPanel } 
                        dangerouslySetInnerHTML={{__html: this.props.t("diag-type-note-" + this.state.common.diag)}}
                    />  
                      
                </Grid>
                <Grid item lg={8} md={4} xs={12} className="sendData-grid" style={{ height:'100%', display: "flex", flexDirection: "column" }}>
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
	
}


export default withWidth()
(
    withStyles(styles)(
        StatisticsDialog
    )
);

