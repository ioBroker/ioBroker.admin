import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';

import { Button } from '@material-ui/core';
import { Dialog } from '@material-ui/core';
import { DialogActions } from '@material-ui/core';
import { DialogContent } from '@material-ui/core';
import { DialogTitle } from '@material-ui/core';
import { Grid } from '@material-ui/core';
import { IconButton } from '@material-ui/core';
import { Typography } from '@material-ui/core';

import CloseIcon from '@material-ui/icons/Close';

import State from '../components/State';

const styles = theme => ({
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
    typography: {
        paddingRight: 30
    }
});

class AdapterUpdateDialog extends React.Component {

    constructor(props) {
        super(props);

        this.t = props.t;
    }

    getDependencies() {

        const result = [];

        this.props.dependencies && this.props.dependencies.forEach(dependency => {
            result.push(
                <State
                    key={ dependency.name }
                    state={ dependency.rightVersion }
                >
                    { `${dependency.name}${dependency.version ? ` (${dependency.version})` : ''}: ${dependency.installed ? dependency.installedVersion : '-'}`}
                </State>
            );
        });

        return result;
    }

    getNews() {

        const result = [];

        this.props.news && this.props.news.forEach(entry => {

            const news = entry.news.split('\n');

            result.push(
                <Grid item key={ entry.version }>
                    <Typography>
                        { entry.version + ':'}
                    </Typography>
                    { news.map((value, index)=> {
                        return (
                            <Typography key={ `${entry.version}-${index}` } component="div" variant="body2">
                                { '• ' + value }
                            </Typography>
                        );
                    })}
                </Grid>
            );
        });

        return result;
    }

    render() {

        const { classes } = this.props;

        return (
            <Dialog
                onClose={ this.props.onClose }
                open={ this.props.open }
            >
                <DialogTitle disableTypography={ true }>
                    <Typography component="h2" variant="h6" classes={{ root: classes.typography }}>
                        { this.t('Please confirm') }
                        <IconButton className={ classes.closeButton } onClick={ this.props.onClose }>
                            <CloseIcon />
                        </IconButton>
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={ 2 }>
                        { this.props.dependencies && this.props.dependencies.length > 0 &&
                            <Grid item>
                                <Typography variant="h6" gutterBottom>
                                    { this.t('Dependencies') }
                                </Typography>
                                { this.getDependencies() }
                            </Grid>
                        }
                        <Grid item>
                            <Typography variant="h6" gutterBottom>
                                { this.t('News') }
                            </Typography>
                            <Grid container spacing={ 2 }>
                                { this.getNews() }
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        autoFocus
                        disabled={ !this.props.rightDependencies }
                        onClick={ () => {
                            this.props.onClick();
                            this.props.onClose();
                        }}
                        color="primary"
                    >
                        { this.t('Update') }
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

AdapterUpdateDialog.propTypes = {
    adapter: PropTypes.string.isRequired,
    dependencies: PropTypes.array,
    news: PropTypes.array,
    onClick: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    rightDependencies: PropTypes.bool,
    t: PropTypes.func.isRequired
}

export default withStyles(styles)(AdapterUpdateDialog);