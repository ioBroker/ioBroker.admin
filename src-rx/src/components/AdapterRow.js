import { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';
import clsx from 'clsx';

import {
    Avatar,
    Badge,
    Grid,
    IconButton,
    TableCell,
    TableRow,
    Tooltip,
    Typography
} from '@material-ui/core';

import AddIcon from '@material-ui/icons/Add';
import AddToPhotosIcon from '@material-ui/icons/AddToPhotos';
import BugReportIcon from '@material-ui/icons/BugReport';
import BuildIcon from '@material-ui/icons/Build';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CloudIcon from '@material-ui/icons/Cloud';
import CloudOffIcon from '@material-ui/icons/CloudOff';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import GitHubIcon from '@material-ui/icons/GitHub';
import HelpIcon from '@material-ui/icons/Help';
import PublishIcon from '@material-ui/icons/Publish';
import RefreshIcon from '@material-ui/icons/Refresh';

import {
    amber,
    blue,
    green,
    red
} from '@material-ui/core/colors';
import MaterialDynamicIcon from '../helpers/MaterialDynamicIcon';

const styles = theme => ({
    smallAvatar: {
        width: theme.spacing(3),
        height: theme.spacing(3)
    },
    hidden: {
        visibility: 'hidden'
    },
    name: {
        flexWrap: 'nowrap',
        width: 300
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
    }
});

class AdapterRow extends Component {

    renderVersion() {

        const {
            classes,
            enabledCount,
            installedCount,
            installedFrom,
            installedVersion
        } = this.props;

        return (
            <Grid
                container
                wrap="nowrap"
                alignItems="center"
                spacing={1}
            >
                { installedFrom &&
                    <Grid
                        item
                        container
                    >
                        <Tooltip title={'Non-NPM-Version: ' + installedFrom}>
                            <GitHubIcon
                                fontSize="small"
                                className={classes.versionWarn}
                            />
                        </Tooltip>
                    </Grid>
                }
                <Grid item>
                    {installedVersion +
                        (installedCount ? ` (${installedCount}${installedCount !== enabledCount ? '~' : ''})` : '')
                    }
                </Grid>
            </Grid>
        )
    }

    render() {

        const isCategory = this.props.category;

        const {
            classes,
            connectionType,
            installedCount,
            installedVersion,
            updateAvailable,
            name,
            rightDependencies,
            rightOs,
            sentry,
            categoryName
        } = this.props;

        return (
            <TableRow
                hover={!isCategory}
                className={clsx({ [classes.category]: isCategory, [classes.displayNone]: this.props.hidden })}
            >
                {!isCategory && <TableCell colSpan={1}></TableCell>}
                <TableCell>
                    <Grid container spacing={1} alignItems="center" className={classes.name}>
                        <Grid item>
                            {isCategory ?
                                <IconButton
                                    size="small"
                                    onClick={this.props.onToggle}
                                >
                                    {this.props.expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                </IconButton>
                                :
                                <Badge badgeContent={sentry && <BugReportIcon classes={{ root: classes.sentryIcon }} />}>
                                    <Avatar
                                        variant="square"
                                        alt={name}
                                        src={this.props.image}
                                        className={classes.smallAvatar}
                                    />
                                </Badge>
                            }
                        </Grid>
                        {!isCategory && <Grid item>
                            {name}
                        </Grid>}
                    </Grid>
                </TableCell>
                {isCategory && <TableCell colSpan={1}><div style={{
                    display: 'flex',
                    alignItems: 'center'
                }}><MaterialDynamicIcon objIconBool iconName={categoryName} style={{ marginRight: 5 }} />{name}</div></TableCell>}
                { isCategory ?
                    <TableCell>
                        <Typography component="span" variant="body2" className={classes.green}>
                            {installedCount}
                        </Typography>
                        {` ${this.props.t('of')} `}
                        <Typography component="span" variant="body2" className={classes.blue}>
                            {this.props.count}
                        </Typography>
                        {` ${this.props.t('Adapters from this Group installed')}`}
                    </TableCell>
                    :
                    <TableCell>
                        {this.props.description}
                    </TableCell>
                }
                <TableCell>
                    {!isCategory && this.props.keywords && this.props.keywords.join(' ')}
                </TableCell>
                <TableCell>
                    {!isCategory &&
                        (connectionType === 'cloud' ? <CloudIcon /> :
                            connectionType === 'local' ? <CloudOffIcon /> : connectionType)
                    }
                </TableCell>
                <TableCell>
                    {!isCategory && installedVersion && this.renderVersion()}
                </TableCell>
                <TableCell className={clsx({
                    [classes.updateAvailable]: !isCategory && updateAvailable && rightDependencies,
                    [classes.wrongDependencies]: !rightDependencies
                })}>
                    <Grid
                        container
                        alignItems="center"
                    >
                        {!isCategory && this.props.version}
                        <div className={classes.grow} />
                        {!isCategory && updateAvailable &&
                            <IconButton
                                size="small"
                                onClick={this.props.onUpdate}
                            >
                                <RefreshIcon />
                            </IconButton>
                        }
                    </Grid>
                </TableCell>
                <TableCell>
                    {!isCategory && this.props.license}
                </TableCell>
                { isCategory ?
                    <TableCell />
                    :
                    <TableCell>
                        <IconButton
                            size="small"
                            className={!rightOs ? classes.hidden : ''}
                            onClick={rightOs ? this.props.onAddInstance : null}
                        >
                            <AddIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={this.props.onInfo}
                        >
                            <HelpIcon />
                        </IconButton>
                        {this.props.expertMode &&
                            <IconButton
                                size="small"
                                className={!installedVersion ? classes.hidden : ''}
                                onClick={this.props.onUpload}
                            >
                                <PublishIcon />
                            </IconButton>
                        }
                        <IconButton
                            size="small"
                            className={!installedVersion ? classes.hidden : ''}
                            onClick={this.props.onDeletion}
                        >
                            <DeleteForeverIcon />
                        </IconButton>
                        {this.props.expertMode &&
                            <IconButton size="small" className={!installedVersion ? classes.hidden : ''}>
                                <AddToPhotosIcon />
                            </IconButton>
                        }
                        {this.props.rebuild && this.props.expertMode &&
                            <IconButton
                                size="small"
                                className={!installedVersion ? classes.hidden : ''}
                                onClick={this.props.onRebuild}
                            >
                                <BuildIcon />
                            </IconButton>
                        }
                    </TableCell>
                }
            </TableRow>
        );
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
    updateAvailable: PropTypes.bool,
    version: PropTypes.string
};

export default withStyles(styles)(AdapterRow);