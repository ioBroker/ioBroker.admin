import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';

import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import CreateIcon from '@material-ui/icons/Create';

import blue from '@material-ui/core/colors/blue';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';

import IntroCard from '../components/IntroCard';

const styles = {
    root: {
        color: 'red'
    },
    button: {
        color: '#ffffff',
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
        boxShadow: '0 2px 2px 0 rgba(0,0,0,.14),0 3px 1px -2px rgba(0,0,0,.12),0 1px 5px 0 rgba(0,0,0,.2)'
    },
    save: {
        backgroundColor: red[500],
        right: '5rem',
        '&:hover': {
            backgroundColor: red[300]
        },
        '&:focus': {
            backgroundColor: red[500]
        }
    },
    close: {
        backgroundColor: grey[500],
        '&:hover': {
            backgroundColor: grey[300]
        },
        '&:focus': {
            backgroundColor: grey[500]
        }
    },
    edit: {
        backgroundColor: blue[500],
        opacity: '.7',
        '&:hover': {
            backgroundColor: blue[300]
        },
        '&:focus': {
            backgroundColor: blue[500]
        }
    }
};

class Intro extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            instances: [],
            edit: false
        };
    }

    static getDerivedStateFromProps(props) {

        const derived = {};

        if(props.instances) derived.instances = props.instances;

        return derived;
    }

    activateEditMode() {
        this.setState({
            edit: true
        });
    }

    deactivateEditMode() {

        const instances = this.state.instances.slice();

        for(const index in instances) {
            instances[index].editActive = instances[index].active;
        }

        this.setState({
            instances: instances,
            edit: false
        });
    }

    toggleCard(id) {

        const instances = this.state.instances.slice();

        if(!instances) return;

        for(const index in instances) {
            if(instances[index].id === id) {
                instances[index].editActive = !instances[index].editActive;
                break;
            }
        }

        this.setState({
            instances: instances
        });
    }

    saveCards() {
        const instances = this.state.instances.slice();

        for (const index in instances) {
            instances[index].active = instances[index].editActive;
        }

        this.setState({
            instances: instances,
            edit: false
        });

        this.props.updateIntro(instances);
    }

    getCards() {

        const cards = this.state.instances.map((instance, index) => {

            if ((!this.state.edit && instance.active) || this.state.edit) {

                let linkText = (instance.link) ? instance.link.replace(/^https?:\/\//, '') : '';
                const pos = linkText.indexOf('/');
                if (pos !== -1) {
                    linkText = linkText.substring(0, pos);
                }

                return (
                    <IntroCard
                        key={ index }
                        image={ instance.image }
                        title={ instance.name }
                        action={{link: instance.link, text: linkText }}
                        color={ instance.color }
                        reveal={ instance.info }
                        edit={ this.state.edit }
                        enabled={ (this.state.edit) ? instance.editActive : instance.active }
                        toggleActivation={ () => this.toggleCard(instance.id) }
                    >
                        { instance.description }
                    </IntroCard>
                );
            } else {
                return null;
            }
        });

        return cards;
    }

    getButtons(classes) {

        const buttons = [];

        if (this.state.edit) {
            buttons.push(
                <IconButton
                    key="save"
                    className={ classes.button + ' ' + classes.save }
                    onClick={ () => this.saveCards() }
                >
                    <CheckIcon />
                </IconButton>
            );

            buttons.push(
                <IconButton
                    key="close"
                    className={ classes.button + ' ' + classes.close }
                    onClick={ () => this.deactivateEditMode() }
                >
                    <CloseIcon />
                </IconButton>
            )
        } else {
            buttons.push(
                <IconButton
                    key="edit"
                    className={ classes.button + ' ' + classes.edit }
                    onClick={ () => this.activateEditMode() }
                >
                    <CreateIcon />
                </IconButton>
            );
        }

        return buttons;
    }

    render() {

        const { classes } = this.props;

        return(
            <div className={ classes.root }>
                <Grid
                    container
                    spacing={ 2 }
                >
                    { this.getCards() }
                </Grid>
                { this.getButtons(classes) }
            </div>
        );
    }
}

export default withStyles(styles)(Intro);