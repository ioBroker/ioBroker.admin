import { Component } from 'react';

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

const styles = theme => {
    return ({
        closeButton: {
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: theme.palette.grey[500],
        },
        typography: {
            paddingRight: 30
        },
        version: {
            background: '#4dabf5',
            borderRadius: 3,
            paddingLeft: 10,
            color: theme.palette.type === 'dark' ? 'black' : 'white'
        },
        wrapperButton: {
        },
        '@media screen and (max-width: 465px)': {
            wrapperButton: {
                '& *': {
                    fontSize: 10
                }
            },
        },
        '@media screen and (max-width: 380px)': {
            wrapperButton: {
                '& *': {
                    fontSize: 9
                }
            },
        },
    })
};

class AdapterUpdateDialog extends Component {

    constructor(props) {
        super(props);

        this.t = props.t;
    }

    getDependencies() {

        const result = [];

        this.props.dependencies && this.props.dependencies.forEach(dependency => {
            result.push(
                <State
                    key={dependency.name}
                    state={dependency.rightVersion}
                >
                    {`${dependency.name}${dependency.version ? ` (${dependency.version})` : ''}: ${dependency.installed ? dependency.installedVersion : '-'}`}
                </State>
            );
        });

        return result;
    }

    getNews() {
        const result = [];

        this.props.news && this.props.news.forEach(entry => {
            const news = entry.news ? entry.news.split('\n') : [];

            result.push(
                <Grid item key={entry.version}>
                    <Typography className={this.props.classes.version}>
                        {entry.version + ':'}
                    </Typography>
                    {news.map((value, index) => {
                        return (
                            <Typography key={`${entry.version}-${index}`} component="div" variant="body2">
                                { '• ' + value}
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

        const version = this.props.news && this.props.news[0]?.version;

        return <Dialog
            onClose={this.props.onClose}
            open={this.props.open}
        >
            <DialogTitle disableTypography={true}>
                <Typography component="h2" variant="h6" classes={{ root: classes.typography }}>
                    {this.t('Please confirm')}
                    <IconButton className={classes.closeButton} onClick={this.props.onClose}>
                        <CloseIcon />
                    </IconButton>
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                <Grid
                    container
                    direction="column"
                    spacing={2}
                    wrap="nowrap"
                >
                    {this.props.dependencies && this.props.dependencies.length > 0 &&
                        this.props.dependencies.find(dependency => !dependency.rightVersion) &&
                        <Grid item>
                            <Typography variant="h6" gutterBottom>{this.t('Dependencies')}</Typography>
                            {this.getDependencies()}
                        </Grid>
                    }
                    <Grid item>
                        <Typography variant="h6" gutterBottom>{this.t('News')}</Typography>
                        <Grid
                            container
                            spacing={2}
                            direction="column"
                            wrap="nowrap"
                        >
                            {this.getNews()}
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions className={classes.wrapperButton}>
                {!!this.props.rightDependencies && this.props.onIgnore && <Button
                    onClick={() =>
                        this.props.onIgnore(version)}
                    color="primary"
                >
                    {this.t('Ignore version %s', version)}
                </Button>}
                <Button
                    variant="contained"
                    autoFocus
                    disabled={!this.props.rightDependencies}
                    onClick={() => this.props.onUpdate()}
                    color="primary"
                >
                    {this.t('Update')}
                </Button>
                <Button
                    variant="contained"
                    autoFocus
                    onClick={() => this.props.onClose()}
                    color="default"
                >
                    {this.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

AdapterUpdateDialog.propTypes = {
    adapter: PropTypes.string.isRequired,
    dependencies: PropTypes.array,
    news: PropTypes.array,
    onUpdate: PropTypes.func.isRequired,
    onIgnore: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    rightDependencies: PropTypes.bool,
    t: PropTypes.func.isRequired
}

export default withStyles(styles)(AdapterUpdateDialog);