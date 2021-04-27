import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';
import clsx from 'clsx';

import {
    Avatar,
    CardMedia,
    Grid,
    IconButton,
    TableCell,
    TableRow,
    Tooltip,
    Typography
} from '@material-ui/core';
import { Rating } from '@material-ui/lab';

import AddIcon from '@material-ui/icons/Add';
import AddToPhotosIcon from '@material-ui/icons/AddToPhotos';
import BuildIcon from '@material-ui/icons/RotateRight';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CloudIcon from '@material-ui/icons/Cloud';
import CloudOffIcon from '@material-ui/icons/CloudOff';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import GitHubIcon from '@material-ui/icons/GitHub';
import HelpIcon from '@material-ui/icons/Help';
import PublishIcon from '@material-ui/icons/Publish';
import RefreshIcon from '@material-ui/icons/Refresh';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import RemoveIcon from '@material-ui/icons/Remove';
import sentryIcon from '../../assets/sentry.svg';

import {
    amber,
    blue,
    green,
    red
} from '@material-ui/core/colors';

import MaterialDynamicIcon from '../../helpers/MaterialDynamicIcon';


const styles = theme => ({
    smallAvatar: {
        width: theme.spacing(4),
        height: theme.spacing(4)
    },
    paddingNone: {
        padding: '0 !important'
    },
    hidden: {
        visibility: 'hidden'
    },
    name: {
        flexWrap: 'nowrap',
        width: 300
    },
    nameDiv: {
        display: 'flex',
        alignItems: 'center',
    },
    categoryName: {
        fontWeight: 'bold',
    },
    green: {
        color: green[500]
    },
    blue: {
        color: blue[700]
    },
    category: {
        backgroundColor: theme.palette.background.default,
    },
    updateAvailable: {
        color: green[700]
    },
    wrongDependencies: {
        color: red[700]
    },
    grow: {
        flexGrow: 1
    },
    displayNone: {
        display: 'none'
    },
    sentryIcon: {
        fontSize: '1.2rem'
    },
    versionWarn: {
        color: amber[500]
    },
    buttonUpdate: {
        border: '1px solid',
        padding: '0px 7px',
        borderRadius: 5,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background 0.5s',
        '&:hover': {
            background: '#00800026'
        }
    },
    buttonUpdateIcon: {
        height: 20,
        width: 20,
        marginRight: 10
    },
    classPoll: {
        color: 'orange'
    },
    classPush: {
        color: 'green'
    },
    classAssumption: {
        color: 'red',
        transform: 'rotate(90deg)'
    },
    marginLeft5: {
        marginLeft: 5
    },
    marginRight5: {
        marginRight: 5
    },
    flex: {
        display: 'flex'
    },
    sentry: {
        width: 21,
        height: 21,
        marginTop: 3,
        objectFit: 'fill',
        filter: 'invert(0%) sepia(90%) saturate(1267%) hue-rotate(-260deg) brightness(99%) contrast(97%)'
    },
    rating: {
        cursor: 'pointer'
    }
});

class AdapterRow extends Component {
    renderVersion() {
        const {
            classes,
            enabledCount,
            installedCount,
            installedFrom,
            installedVersion,
            t
        } = this.props;

        return <Grid
            container
            wrap="nowrap"
            alignItems="center"
            spacing={1}
        >

            <Grid item>
                {installedVersion +
                    (installedCount ? ` (${installedCount}${installedCount !== enabledCount ? '~' : ''})` : '')
                }
            </Grid>
            {installedFrom &&
                <Grid item container>
                    <Tooltip title={t('Non-NPM-Version: ') + installedFrom}>
                        <GitHubIcon
                            fontSize="small"
                            className={classes.versionWarn}
                        />
                    </Tooltip>
                </Grid>
            }
        </Grid>;
    }

    render() {
        const isCategory = this.props.category;

        const {
            classes,
            connectionType,
            installedCount,
            installedVersion,
            updateAvailable,
            commandRunning,
            name,
            rightDependencies,
            rightOs,
            sentry,
            categoryName,
            openInstallVersionDialog,
            dataSource,
            descHidden,
            adapter,
            versionDate,
            onSetRating,
            rating
        } = this.props;

        if (isCategory) {
            return <TableRow
                hover={false}
                className={clsx(classes.category, this.props.hidden && classes.displayNone)}
            >
                <TableCell>
                    <Grid container spacing={1} alignItems="center" className={classes.name}>
                        <Grid item>
                            <IconButton
                                size="small"
                                onClick={this.props.onToggle}
                            >
                                {this.props.expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                            </IconButton>
                        </Grid>
                        {!isCategory && <Grid item>{name}</Grid>}
                    </Grid>
                </TableCell>
                <TableCell>
                    <div className={clsx(classes.nameDiv, isCategory && classes.categoryName)}>
                        <MaterialDynamicIcon objIconBool iconName={categoryName} className={classes.marginRight5} />
                        {name}
                    </div>
                </TableCell>
                <TableCell colSpan={descHidden ? 5 : 6}>
                    <Typography component="span" variant="body2" className={classes.green}>
                        {installedCount}
                    </Typography>
                    {` ${this.props.t('of')} `}
                    <Typography component="span" variant="body2" className={classes.blue}>
                        {this.props.count}
                    </Typography>
                    {` ${this.props.t('Adapters from this Group installed')}`}
                </TableCell>
            </TableRow>;
        } else {
            return <TableRow
                hover={true}
                className={this.props.hidden ? classes.displayNone : ''}
            >
                <TableCell />
                <TableCell>
                    <Grid container spacing={1} alignItems="center" className={classes.name}>
                        <Grid item className={classes.paddingNone}>
                            <Avatar
                                variant="square"
                                alt={name}
                                src={this.props.image}
                                className={classes.smallAvatar}
                            />
                        </Grid>
                        {/* <Grid item>{name}</Grid> */}
                        <Grid item><div>{name}</div>
                            {!versionDate ? <div
                                onClick={onSetRating ? () => onSetRating() : undefined}
                                className={clsx(classes.rating, onSetRating && classes.ratingSet)}
                                title={rating?.title}
                            >
                                <Rating
                                    name={adapter}
                                    precision={0.5}
                                    size="small"
                                    readOnly
                                    value={rating?.rating ? rating.rating.r : 0}
                                />
                            </div> : null}
                        </Grid>
                    </Grid>
                </TableCell>
                {!descHidden && <TableCell>{this.props.description}</TableCell>}
                <TableCell>
                    <div className={classes.flex}>
                        {connectionType === 'cloud' ?
                            <Tooltip title={this.props.t('Adapter requires the specific cloud access for these devices/service')}><CloudIcon /></Tooltip> :
                            (connectionType === 'local' ?
                                <Tooltip title={this.props.t('Adapter does not use the cloud for these devices/service')}><CloudOffIcon /></Tooltip> : null)
                        }
                        {dataSource && <div className={classes.marginLeft5}>{(
                            dataSource === 'poll' ?
                                <Tooltip title={this.props.t('The device or service will be periodically asked')}>
                                    <ArrowUpwardIcon className={classes.classPoll} />
                                </Tooltip> :
                                dataSource === 'push' ?
                                    <Tooltip title={this.props.t('The device or service delivers the new state actively')}>
                                        <ArrowDownwardIcon className={classes.classPush} />
                                    </Tooltip> :
                                    dataSource === 'assumption' ?
                                        <Tooltip title={this.props.t('Adapter cannot request the exactly device status and the status will be guessed on the last sent command')}>
                                            <RemoveIcon className={classes.classAssumption} /></Tooltip> : null
                        )}
                        </div>}
                        {sentry && <div className={classes.marginLeft5}>
                            <Tooltip title="sentry">
                                <CardMedia
                                    className={classes.sentry}
                                    component="img"
                                    image={sentryIcon}
                                />
                            </Tooltip>
                        </div>}
                    </div>
                </TableCell>
                <TableCell>{installedVersion && this.renderVersion()}</TableCell>
                <TableCell className={clsx({
                    [classes.updateAvailable]: updateAvailable && rightDependencies,
                    [classes.wrongDependencies]: !rightDependencies
                })}>
                    <Grid
                        container
                        alignItems="center"
                    >
                        {!commandRunning && updateAvailable ?
                            <Tooltip title={this.props.t('Update')}>
                                <div
                                    onClick={this.props.onUpdate}
                                    className={classes.buttonUpdate}>
                                    <IconButton
                                        className={classes.buttonUpdateIcon}
                                        size="small"
                                    >
                                        <RefreshIcon />
                                    </IconButton>{this.props.version}
                                </div>
                            </Tooltip>
                            :
                            this.props.version
                        }
                    </Grid>
                </TableCell>
                <TableCell>{this.props.license}</TableCell>
                <TableCell>
                    <Tooltip title={this.props.t('Add instance')}>
                        <IconButton
                            size="small"
                            className={!rightOs ? classes.hidden : ''}
                            onClick={rightOs ? this.props.onAddInstance : null}
                        >
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={this.props.t('Readme')}>
                        <IconButton
                            size="small"
                            onClick={this.props.onInfo}
                        >
                            <HelpIcon />
                        </IconButton>
                    </Tooltip>
                    {this.props.expertMode &&
                        <Tooltip title={this.props.t('Upload')}>
                            <IconButton
                                size="small"
                                disabled={commandRunning}
                                className={!installedVersion ? classes.hidden : ''}
                                onClick={this.props.onUpload}
                            >
                                <PublishIcon />
                            </IconButton>
                        </Tooltip>
                    }
                    <Tooltip title={this.props.t('Delete adapter')}>
                        <IconButton
                            size="small"
                            disabled={commandRunning}
                            className={!installedVersion ? classes.hidden : ''}
                            onClick={this.props.onDeletion}
                        >
                            <DeleteForeverIcon />
                        </IconButton>
                    </Tooltip>
                    {this.props.expertMode &&
                        <Tooltip title={this.props.t('Install a specific version')}>
                            <IconButton
                                size="small"
                                disabled={commandRunning}
                                className={!installedVersion ? classes.hidden : ''}
                                onClick={openInstallVersionDialog}
                            >
                                <AddToPhotosIcon />
                            </IconButton>
                        </Tooltip>
                    }
                    {this.props.rebuild && this.props.expertMode &&
                        <Tooltip title={this.props.t('Rebuild')}>
                            <IconButton
                                size="small"
                                disabled={commandRunning}
                                className={!installedVersion ? classes.hidden : ''}
                                onClick={this.props.onRebuild}
                            >
                                <BuildIcon />
                            </IconButton>
                        </Tooltip>
                    }
                </TableCell>
            </TableRow>;
        }
    }
}

AdapterRow.propTypes = {
    category: PropTypes.bool,
    connectionType: PropTypes.string,
    count: PropTypes.number,
    description: PropTypes.string,
    enabledCount: PropTypes.number,
    expanded: PropTypes.bool,
    expertMode: PropTypes.bool,
    hidden: PropTypes.bool,
    image: PropTypes.string,
    installedCount: PropTypes.number,
    installedFrom: PropTypes.string,
    installedVersion: PropTypes.string,
    keywords: PropTypes.array,
    name: PropTypes.string,
    license: PropTypes.string,
    onAddInstance: PropTypes.func,
    onDeletion: PropTypes.func,
    onRebuild: PropTypes.func,
    onToggle: PropTypes.func,
    onUpdate: PropTypes.func,
    onUpload: PropTypes.func,
    rebuild: PropTypes.bool,
    rightDependencies: PropTypes.bool,
    rightOs: PropTypes.bool,
    sentry: PropTypes.bool,
    t: PropTypes.func,
    descHidden: PropTypes.bool,
    updateAvailable: PropTypes.bool,
    version: PropTypes.string,
    commandRunning: PropTypes.bool,
    rating: PropTypes.object,
    onSetRating: PropTypes.func,
};

export default withStyles(styles)(AdapterRow);