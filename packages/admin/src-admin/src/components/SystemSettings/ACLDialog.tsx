import React, { Fragment, type JSX } from 'react';

import {
    Grid2,
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
} from '@mui/material';

import { I18n, type Translate } from '@iobroker/adapter-react-v5';

import { type ioBrokerObject } from '@/types';
import AdminUtils from '@/helpers/AdminUtils';
import BaseSystemSettingsDialog, { type BaseSystemSettingsDialogProps } from './BaseSystemSettingsDialog';

const styles: Record<string, React.CSSProperties> = {
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
        margin: 8,
        minWidth: '100%',
    },
    tableCell: {
        textAlign: 'center',
        border: '1px solid #AAA',
        paddingLeft: 0,
        paddingRight: 0,
    },
};

type ACLOwners = {
    owner: ioBroker.ObjectIDs.User;
    ownerGroup: ioBroker.ObjectIDs.Group;
};

type ACLRights = {
    object: number;
    state: number;
    file: number;
};

type ACLObject = ioBrokerObject<object, { defaultNewAcl: ACLOwners & ACLRights }>;

interface ACLObjectProps extends BaseSystemSettingsDialogProps {
    t: Translate;
    data: ACLObject;
    users: ioBroker.UserObject[];
    groups: ioBroker.GroupObject[];
    onChange: (data: ACLObject) => void;
    saving: boolean;
}

export default class ACLDialog extends BaseSystemSettingsDialog<ACLObjectProps> {
    private static permBits: [number, number][] = [
        [0x400, 0x200],
        [0x40, 0x20],
        [0x4, 0x2],
    ];

    static getTypes(): { type: keyof ACLRights; title: string }[] {
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

    getRights(type: keyof ACLRights): number[][] {
        const rts = this.props.data.common.defaultNewAcl[type];
        return ACLDialog.permBits.map(bitGroup => bitGroup.map(bit => rts & bit));
    }

    getTable(owner: keyof ACLRights): JSX.Element {
        const checks = this.getRights(owner);
        const checkboxes = checks.map((elem, index) => (
            <Fragment key={index}>
                <TableCell style={styles.tableCell}>
                    <Checkbox
                        disabled={this.props.saving}
                        checked={!!elem[0]}
                        color="primary"
                        onChange={() => this.handleCheck(owner, index, 0)}
                    />
                </TableCell>
                <TableCell style={styles.tableCell}>
                    <Checkbox
                        disabled={this.props.saving}
                        checked={!!elem[1]}
                        color="primary"
                        onChange={() => this.handleCheck(owner, index, 1)}
                    />
                </TableCell>
            </Fragment>
        ));

        return (
            <TableContainer>
                <Table
                    style={styles.table}
                    aria-label="customized table"
                >
                    <TableHead>
                        <TableRow>
                            <TableCell
                                colSpan={2}
                                style={styles.tableCell}
                            >
                                {this.props.t('Owner')}
                            </TableCell>
                            <TableCell
                                colSpan={2}
                                style={styles.tableCell}
                            >
                                {this.props.t('Group')}
                            </TableCell>
                            <TableCell
                                colSpan={2}
                                style={styles.tableCell}
                            >
                                {this.props.t('Everyone')}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell style={styles.tableCell}>{this.props.t('read')}</TableCell>
                            <TableCell style={styles.tableCell}>{this.props.t('write')}</TableCell>
                            <TableCell style={styles.tableCell}>{this.props.t('read')}</TableCell>
                            <TableCell style={styles.tableCell}>{this.props.t('write')}</TableCell>
                            <TableCell style={styles.tableCell}>{this.props.t('read')}</TableCell>
                            <TableCell style={styles.tableCell}>{this.props.t('write')}</TableCell>
                        </TableRow>
                        <TableRow>{checkboxes}</TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }

    doChange(name: keyof ACLOwners, value: string): void {
        const newData = AdminUtils.clone(this.props.data);
        if (name === 'owner') {
            newData.common.defaultNewAcl.owner = value as ioBroker.ObjectIDs.User;
        } else if (name === 'ownerGroup') {
            newData.common.defaultNewAcl.ownerGroup = value as ioBroker.ObjectIDs.Group;
        }
        this.props.onChange(newData);
    }

    handleCheck(ownerType: keyof ACLRights, elemNum: number, num: number): void {
        const newData = AdminUtils.clone(this.props.data);
        newData.common.defaultNewAcl[ownerType] ^= ACLDialog.permBits[elemNum][num];
        this.props.onChange(newData);
    }

    static getText(word: ioBroker.StringOrTranslated, lang: ioBroker.Languages): string {
        if (typeof word === 'object') {
            return word[lang] || word.en || '';
        }
        return word || '';
    }

    render(): JSX.Element {
        const lang = I18n.getLanguage();
        const users = this.props.users.map((elem, index) => (
            <MenuItem
                value={elem._id}
                key={index}
            >
                {ACLDialog.getText(elem.common.name, lang)}
            </MenuItem>
        ));

        const groups = this.props.groups.map((elem, index) => (
            <MenuItem
                value={elem._id}
                key={index}
            >
                {ACLDialog.getText(elem.common.name, lang)}
            </MenuItem>
        ));

        const objectRights = ACLDialog.getTypes().map((ee, ii) => (
            <Grid2
                size={{ lg: 4, xs: 12, md: 6 }}
                key={ii}
            >
                <Typography
                    variant="h6"
                    component="div"
                >
                    {this.props.t(ee.title)}
                </Typography>
                {this.getTable(ee.type)}
            </Grid2>
        ));

        return (
            <div style={styles.tabPanel}>
                <Typography
                    variant="h5"
                    component="div"
                >
                    {this.props.t('Access control list')}
                </Typography>
                <Grid2
                    container
                    spacing={3}
                >
                    <Grid2 size={{ lg: 3, xs: 12, md: 6 }}>
                        <FormControl
                            variant="standard"
                            style={styles.formControl}
                        >
                            <InputLabel
                                shrink
                                id="owner-label"
                            >
                                {this.props.t('Owner user')}
                            </InputLabel>
                            <Select
                                disabled={this.props.saving}
                                variant="standard"
                                style={styles.formControl}
                                id="owner"
                                value={this.props.data.common.defaultNewAcl.owner}
                                onChange={evt => this.doChange('owner', evt.target.value)}
                                displayEmpty
                                inputProps={{ 'aria-label': 'users' }}
                            >
                                {users}
                            </Select>
                        </FormControl>
                    </Grid2>
                    <Grid2 size={{ lg: 3, xs: 12, md: 6 }}>
                        <FormControl
                            variant="standard"
                            style={styles.formControl}
                        >
                            <InputLabel
                                shrink
                                id="ownerGroup-label"
                            >
                                {this.props.t('Owner group')}
                            </InputLabel>
                            <Select
                                disabled={this.props.saving}
                                variant="standard"
                                style={styles.formControl}
                                id="ownerGroup"
                                value={this.props.data.common.defaultNewAcl.ownerGroup}
                                onChange={evt => this.doChange('ownerGroup', evt.target.value)}
                                displayEmpty
                                inputProps={{ 'aria-label': 'ownerGroup' }}
                            >
                                {groups}
                            </Select>
                        </FormControl>
                    </Grid2>
                </Grid2>
                <Grid2
                    container
                    spacing={3}
                >
                    {objectRights}
                </Grid2>
            </div>
        );
    }
}
