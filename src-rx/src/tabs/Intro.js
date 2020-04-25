import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import LinearProgress from '@material-ui/core/LinearProgress';
import Fab from '@material-ui/core/Fab';
import Grid from '@material-ui/core/Grid';

import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import CreateIcon from '@material-ui/icons/Create';

import IntroCard from '../components/IntroCard';

const styles = theme => ({
    button: {
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
    save: {
        backgroundColor: theme.palette.success.main,
        right: theme.spacing(10),
        '&:hover': {
            backgroundColor: theme.palette.success.dark
        }
    },
    close: {
        backgroundColor: theme.palette.error.main,
        '&:hover': {
            backgroundColor: theme.palette.error.dark
        }
    }
});

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
                        action={{ link: instance.link, text: linkText }}
                        color={ instance.color }
                        reveal={ instance.info }
                        edit={ this.state.edit }
                        enabled={ this.state.edit ? instance.editActive : instance.active }
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
                <Fab
                    key="save"
                    color="primary"
                    className={ classes.button + ' ' + classes.save }
                    onClick={ () => this.saveCards() }
                >
                    <CheckIcon />
                </Fab>
            );

            buttons.push(
                <Fab
                    key="close"
                    color="primary"
                    className={ classes.button + ' ' + classes.close }
                    onClick={ () => this.deactivateEditMode() }
                >
                    <CloseIcon />
                </Fab>
            )
        } else {
            buttons.push(
                <Fab
                    color="primary"
                    key="edit"
                    className={ classes.button}
                    onClick={ () => this.activateEditMode() }
                >
                    <CreateIcon />
                </Fab>
            );
        }

        return buttons;
    }

    render() {

        if(!this.props.ready) {
            return(
                <LinearProgress />
            );
        }

        const { classes } = this.props;

        return(
            <div>
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