import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import IconButton  from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';

import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import SaveIcon from '@material-ui/icons/Save';

import blue from '@material-ui/core/colors/blue';
import grey from '@material-ui/core/colors/grey';

import Utils from '@iobroker/adapter-react/Components/Utils';

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

const styles = theme => ({
    root: {
        padding: '.75rem',
        [theme.breakpoints.up('xl')]: {
            flex: '0 1 20%'
        }
    },
    card: {
        display: 'flex',
        minHeight: '235px',
        position: 'relative',
        overflow: 'hidden',
        maxHeight: '235p',
        '&:hover': {
            overflowY: 'auto',
            boxShadow: boxShadowHover
        }
    },
    edit: {
        opacity: '.6',
        userSelect: 'none',
        pointerEvents: 'none'
    },
    media: {
        backgroundColor: '#e2e2e2',
        maxWidth: '30%'
    },
    img: {
        width: '120px',
        height: 'auto',
        padding: '2rem .5rem',
        maxWidth: '100%'
    },
    contentContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    content: {
        height: '170px',
        flexGrow: 1,
        overflowY: 'hidden'
    },
    action: {
        minHeight: '49px',
        padding: '16px 24px'
    },
    link: {
        color: '#ffab40',
        transition: 'color .3s ease',
        textTransform: 'uppercase',
        textDecoration: 'none',
        '&:hover': {
            color: '#ffd8a6',
            textDecoration: 'none'
        }
    },
    expand: {
        color: '#ffffff',
        backgroundColor: blue[500],
        position: 'absolute',
        right: '10px',
        bottom: '10px',
        '&:focus': {
            backgroundColor: blue[500]
        }
    },
    collapse: {
        backgroundColor: '#ffffff',
        position: 'absolute',
        width: '100%',
        '& button': {
            position: 'absolute',
            top: '10px',
            color: '#000000',
            '&:focus': {
                color: '#ffffff',
                backgroundColor: blue[500]
            }
        }
    },
    close: { 
        right: '10px'
    },
    save: {
        right: '50px'
    },
    enabled: {
        color: '#ffffff',
        backgroundColor: blue[500],
        position: 'absolute',
        top: '1rem',
        right:'1rem',
        boxShadow: boxShadow,
        '&:hover': {
            backgroundColor: blue[300]
        },
        '&:focus': {
            backgroundColor: blue[500]
        }
    },
    disabled: {
        color: '#ffffff',
        backgroundColor: grey[500],
        position: 'absolute',
        top: '1rem',
        right:'1rem',
        boxShadow: boxShadow,
        '&:hover': {
            backgroundColor: grey[300]
        },
        '&:focus': {
            backgroundColor: grey[500]
        }
    }
});

class IntroCard extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            expanded: false
        }
    }

    static getDerivedStateFromProps(props) {
        if(props.edit) return { expanded: false };
        return null;
    }

    handleExpandClick() {
        this.setState({
            expanded: !this.state.expanded
        });
    }

    render() {

        const { classes } = this.props;
        const editClass = this.props.edit ? ' ' + classes.edit : '';

        return(
            <Grid
                item
                xs={ 12 }
                sm={ 6 }
                md={ 4 }
                lg={ 3 }
                className={ classes.root }
            >
                <Card className={ classes.card }>
                    {
                        this.props.reveal &&
                        <Button
                            className={ classes.expand + editClass }
                            variant="contained"
                            size="small"
                            onClick={ () => this.handleExpandClick() }
                        >
                            INFO
                        </Button>
                    }
                    <div className={ classes.media + editClass } style={{ backgroundColor: this.props.color }}>
                        <CardMedia
                            className={ classes.img }
                            component="img"
                            image={ this.props.image }
                        />
                    </div>
                    <div className={ classes.contentContainer + editClass }>
                        <CardContent className={ classes.content }>
                            <Typography gutterBottom variant="h5" component="h5">
                                { this.props.title }
                            </Typography>
                            { this.props.children }
                        </CardContent>
                        {
                            this.props.action && this.props.action.link &&
                            <Divider />
                        }
                        {
                            this.props.action && this.props.action.link &&
                            <CardActions className={ classes.action }>
                                <Link className={ classes.link } href={ this.props.action.link }>
                                    { this.props.action.text }
                                </Link>
                            </CardActions>
                        }
                    </div>
                    {
                        this.props.reveal &&
                        <Collapse
                            className={ classes.collapse }
                            in={ this.state.expanded }
                            timeout="auto"
                            unmountOnExit
                        >
                            <IconButton className={ classes.save } size="small" onClick={ () => Utils.copyToClipboard(this.props.reveal) }>
                                <SaveIcon />
                            </IconButton>
                            <IconButton className={ classes.close } size="small" onClick={ () => this.handleExpandClick() }>
                                <CloseIcon />
                            </IconButton>
                            <CardContent>
                                <Typography gutterBottom variant="h5" component="h5">
                                    Info
                                </Typography>
                                { this.props.reveal }
                            </CardContent>
                        </Collapse>
                    }
                    {
                        this.props.edit && this.props.toggleActivation &&
                        <IconButton className={ (this.props.enabled) ? classes.enabled : classes.disabled } onClick={ () => this.props.toggleActivation() }>
                            <CheckIcon />
                        </IconButton>
                    }
                </Card>
            </Grid>
        );
    }
}

export default withStyles(styles)(IntroCard);