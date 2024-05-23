// ACLDialog.js

import React, { Component, Fragment } from 'react';

import { withStyles, type Styles } from '@mui/styles';
import {
    Grid,
    Typography,
    FormControl,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    MenuItem,
    Select,
    InputLabel,
    type SelectChangeEvent,
} from '@mui/material';

import { I18n, withWidth } from '@iobroker/adapter-react-v5';
import Utils from '@/Utils';

const styles:Styles<any, any> = theme => ({
    tabPanel: {
        width: '100%',
        height: '100% ',
        overflow: 'auto',
        overflowX: 'hidden',
        padding: 15,
        // backgroundColor: blueGrey[ 50 ]
    },
    buttonPanel: {
        paddingBottom: 40,
        display: 'flex',
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: '100%',
    },
    tableCell: {
        textAlign: 'center',
        border: '1px solid #AAA',
        paddingLeft: 0,
        paddingRight: 0,
    },
});

class ACLDialog extends Component<{
    t: (text: string) => string;
    classes: Record<string, string>;
    data: ioBroker.Object;
    users: ioBroker.Object[];
    groups: ioBroker.Object[];
    onChange: (data: ioBroker.Object) => void;
    saving: boolean;
}> {
    permBits:[number, number][] = [[0x400, 0x200], [0x40, 0x20], [0x4, 0x2]];

    static getTypes(): { type: string; title: string }[] {
        return [
            {
                type: 'object',
                title: 'Object rights',
            },
            {
                type: 'state',
                title: 'States rights',
            },
            {
                type: 'file',
                title: 'File rights',
            },
        ];
    }

    getRights(type: string): number[][] {
        const rts = this.props.data.common.defaultNewAcl[type];
        // eslint-disable-next-line no-bitwise
        return this.permBits.map(bitGroup => bitGroup.map(bit => rts & bit));
    }

    getTable(owner: string): React.ReactNode {
        const checks = this.getRights(owner);
        const { classes } = this.props;
        const checkboxes = checks.map((elem, index) =>
            <Fragment key={index}>
                <TableCell className={classes.tableCell}>
                    <Checkbox
                        disabled={this.props.saving}
                        checked={!!elem[0]}
                        color="primary"
                        onChange={evt => this.handleCheck(evt, owner, index, 0)}
                    />
                </TableCell>
                <TableCell className={classes.tableCell}>
                    <Checkbox
                        disabled={this.props.saving}
                        checked={!!elem[1]}
                        color="primary"
                        onChange={evt => this.handleCheck(evt, owner, index, 1)}
                    />
                </TableCell>
            </Fragment>);

        return <TableContainer>
            <Table className={classes.table} aria-label="customized table">
                <TableHead>
                    <TableRow>
                        <TableCell colSpan={2} className={classes.tableCell}>
                            {this.props.t('Owner')}
                        </TableCell>
                        <TableCell colSpan={2} className={classes.tableCell}>
                            {this.props.t('Group')}
                        </TableCell>
                        <TableCell colSpan={2} className={classes.tableCell}>
                            {this.props.t('Everyone')}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell className={classes.tableCell}>
                            {this.props.t('read')}
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            {this.props.t('write')}
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            {this.props.t('read')}
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            {this.props.t('write')}
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            {this.props.t('read')}
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            {this.props.t('write')}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        {checkboxes}
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>;
    }

    doChange = (name: string, value: string): void => {
        const newData = Utils.clone(this.props.data);
        newData.common.defaultNewAcl[name] = value;
        this.props.onChange(newData);
    };

    handleCheck = (evt: React.ChangeEvent<HTMLInputElement>, ownerType: string, elemNum: number, num: number): void => {
        const newData = Utils.clone(this.props.data);
        // eslint-disable-next-line no-bitwise
        newData.common.defaultNewAcl[ownerType] ^= this.permBits[elemNum][num];
        this.props.onChange(newData);
    };

    handleChange = (evt: SelectChangeEvent<any>, id: string): void => this.doChange(id, evt.target.value);

    render() {
        const lang = I18n.getLanguage();
        const { classes } = this.props;
        const users = this.props.users.map((elem, index) =>
            <MenuItem value={elem._id} key={index}>
                {typeof elem.common.name === 'object' ? elem.common.name[lang] || elem.common.name.en : elem.common.name}
            </MenuItem>);

        const groups = this.props.groups.map((elem, index) =>
            <MenuItem value={elem._id} key={index}>
                {typeof elem.common.name === 'object' ? elem.common.name[lang] || elem.common.name.en : elem.common.name}
            </MenuItem>);

        const objectRights = ACLDialog.getTypes().map((ee, ii) =>
            <Grid item lg={4} xs={12} md={6} key={ii}>
                <Typography variant="h6" component="div">
                    {this.props.t(ee.title)}
                </Typography>
                {this.getTable(ee.type)}
            </Grid>);

        return <div className={classes.tabPanel}>
            <Typography variant="h5" component="div">
                {this.props.t('Access control list')}
            </Typography>
            <Grid container spacing={3}>
                <Grid item lg={3} md={6} xs={12}>
                    <FormControl variant="standard" className={classes.formControl}>
                        <InputLabel shrink id="owner-label">
                            {this.props.t('Owner user')}
                        </InputLabel>
                        <Select
                            disabled={this.props.saving}
                            variant="standard"
                            className={classes.formControl}
                            id="owner"
                            value={this.props.data.common.defaultNewAcl.owner}
                            onChange={evt => this.handleChange(evt, 'owner')}
                            displayEmpty
                            inputProps={{ 'aria-label': 'users' }}
                        >
                            {users}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item lg={3} md={6} xs={12}>
                    <FormControl variant="standard" className={classes.formControl}>
                        <InputLabel shrink id="ownerGroup-label">
                            {this.props.t('Owner group')}
                        </InputLabel>
                        <Select
                            disabled={this.props.saving}
                            variant="standard"
                            className={classes.formControl}
                            id="ownerGroup"
                            value={this.props.data.common.defaultNewAcl.ownerGroup}
                            onChange={evt => this.handleChange(evt, 'ownerGroup')}
                            displayEmpty
                            inputProps={{ 'aria-label': 'ownerGroup' }}
                        >
                            {groups}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
            <Grid container spacing={3}>
                {objectRights}
            </Grid>
        </div>;
    }
}

export default withWidth()(withStyles(styles)(ACLDialog));
