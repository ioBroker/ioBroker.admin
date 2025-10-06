import React, { type JSX } from 'react';

import { Avatar, Grid, TableCell, TableRow, Tooltip } from '@mui/material';

import AdapterGeneric, {
    type AdapterGenericProps,
    type AdapterGenericState,
    genericStyles,
} from '@/components/Adapters/AdapterGeneric';

const styles: Record<string, any> = {
    ...genericStyles,
    type: {
        color: 'line',
    },
    smallAvatar: {
        width: 32,
        height: 32,
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
};

class AdapterRow extends AdapterGeneric<AdapterGenericProps, AdapterGenericState> {
    protected styles: Record<string, any> = styles;

    render(): JSX.Element {
        const adapter = this.props.context.repository[this.props.adapterName];

        const allowAdapterRating = adapter ? adapter.allowAdapterRating : true;

        this.installedVersion = this.props.context.installed[this.props.adapterName]?.version;

        return (
            <TableRow hover>
                <TableCell />
                <TableCell>
                    <Grid
                        container
                        spacing={1}
                        alignItems="center"
                        style={this.styles.name}
                    >
                        <Tooltip
                            title={this.props.adapterName}
                            slotProps={{ popper: { sx: this.styles.tooltip } }}
                        >
                            <Grid style={this.styles.paddingNone}>
                                <Avatar
                                    variant="square"
                                    alt={this.props.cached.title}
                                    src={this.props.cached.image}
                                    style={this.styles.smallAvatar}
                                />
                            </Grid>
                        </Tooltip>
                        {allowAdapterRating !== false ? (
                            <Grid style={this.styles.nameCell}>
                                <div>{this.props.cached.title}</div>
                                {this.renderRating()}
                            </Grid>
                        ) : (
                            <Grid>{this.props.cached.title}</Grid>
                        )}
                    </Grid>
                </TableCell>
                {!this.props.context.descHidden && (
                    <TableCell
                        title={this.props.cached.desc}
                        style={{ width: 20, wordWrap: 'break-word' }}
                    >
                        {this.props.cached.desc}
                    </TableCell>
                )}
                <TableCell>
                    <div style={this.styles.flex}>
                        {this.renderConnectionType() || <div style={{ marginLeft: 5, width: 24, height: 24 }} />}
                        {this.renderDataSource() || <div style={{ width: 24, height: 24 }} />}
                        {this.renderSentryInfo() || <div style={{ width: 24, height: 24 }} />}
                        {this.renderLicenseInfo(true)}
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
                <TableCell style={{ fontSize: 'smaller' }}>
                    {adapter?.licenseInformation?.license || adapter?.license}
                </TableCell>
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
            </TableRow>
        );
    }
}

export default AdapterRow;
