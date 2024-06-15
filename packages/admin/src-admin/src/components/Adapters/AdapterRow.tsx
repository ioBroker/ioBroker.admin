import React from 'react';

import { withStyles } from '@mui/styles';

import {
    Avatar,
    Grid,
    TableCell,
    TableRow,
    Tooltip,
} from '@mui/material';

import { type IobTheme } from '@iobroker/adapter-react-v5';

import AdapterGeneric, {
    type AdapterGenericProps,
    type AdapterGenericState,
    genericStyle,
} from '@/components/Adapters/AdapterGeneric';

const styles: Record<string, any> = (theme: IobTheme) => ({
    ...genericStyle(theme),
    smallAvatar: {
        width: theme.spacing(4),
        height: theme.spacing(4),
        marginLeft: 4,
    },
    paddingNone: {
        padding: '0 !important',
    },
    name: {
        flexWrap: 'nowrap',
        width: 300,
        marginTop: 0,
    },
    flex: {
        display: 'flex',
    },
    nameCell: {
        paddingTop: '0 !important',
        paddingBottom: '0 !important',
    },
});

class AdapterRow extends AdapterGeneric<AdapterGenericProps, AdapterGenericState> {
    render() {
        const classes = this.props.classes;
        const adapter = this.props.context.repository[this.props.adapterName];

        const allowAdapterRating = adapter ? adapter.allowAdapterRating : true;

        this.installedVersion = this.props.context.installed[this.props.adapterName]?.version;

        return <TableRow hover>
            <TableCell />
            <TableCell>
                <Grid container spacing={1} alignItems="center" className={classes.name}>
                    <Tooltip title={this.props.adapterName}>
                        <Grid item className={classes.paddingNone}>
                            <Avatar
                                variant="square"
                                alt={this.props.cached.title}
                                src={this.props.cached.image}
                                className={classes.smallAvatar}
                            />
                        </Grid>
                    </Tooltip>
                    {allowAdapterRating !== false ?
                        <Grid item className={classes.nameCell}>
                            <div>{this.props.cached.title}</div>
                            {this.renderRating()}
                        </Grid>
                        :
                        <Grid item>{this.props.cached.title}</Grid>}
                </Grid>
            </TableCell>
            {!this.props.context.descHidden &&
                <TableCell title={this.props.cached.desc} sx={{ width: 20, wordWrap: 'break-word' }}>{this.props.cached.desc}</TableCell>}
            <TableCell>
                <div className={classes.flex}>
                    {this.renderConnectionType()}
                    {this.renderDataSource()}
                    <div>{this.renderLicenseInfo()}</div>
                    {this.renderSentryInfo()}
                </div>
            </TableCell>
            <TableCell>{this.renderInstalledVersion(true)}</TableCell>
            <TableCell>
                <Grid
                    container
                    alignItems="center"
                >
                    {this.renderVersion()}
                </Grid>
            </TableCell>
            <TableCell>{adapter?.licenseInformation?.license || adapter?.license}</TableCell>
            <TableCell>
                {this.renderAddInstanceButton()}
                {this.renderAutoUpgradeButton()}
                {this.renderReadmeButton()}
                {this.renderUploadButton()}
                {this.renderDeleteButton()}
                {this.renderInstallSpecificVersionButton()}
                {this.renderRebuildButton()}
            </TableCell>
            {this.renderDialogs()}
        </TableRow>;
    }
}

export default withStyles(styles)(AdapterRow);
