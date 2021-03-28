import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import Security from '@material-ui/icons/Security';

import Logo from '@iobroker/adapter-react/Components/Logo';
import I18n from '@iobroker/adapter-react/i18n';

import CustomSelect from '../Components/CustomSelect';
import CustomInput from '../Components/CustomInput';
import CustomCheckbox from '../Components/CustomCheckbox';
import CustomModal from '../Components/CustomModal';
import Toast from '../Components/Toast';

const styles = theme => ({
    blockWrapper: {
        display: 'flex',
        flexDirection: 'column',
        marginRight: 20,
        '@media screen and (max-width: 360px)': {
            marginRight: 0
        }
    },
    displayNone: {
        display: 'none !important'
    },
    tab: {
        width: '100%',
        minHeight: '100%'
    },
    column: {
        display: 'inline-block',
        verticalAlign: 'top',
        marginRight: 20
    },
    columnSettings: {
        width: 'calc(100% - 10px)',
    },
    blockWrapperCheckbox: {
        display: 'flex',
        flexFlow: 'wrap'
    },
    ipInputStyle: {
        marginTop: 10,
        width: 900,
        marginRight: 20,
        '@media screen and (max-width: 940px)': {
            width: '100%'
        }
    },
    blockWarning: {
        background: '#2196f3',
        color: '#fff',
        margin: '20px 2px',
        padding: 8,
        fontSize: 20
    },
    blockWarningContent: {
        marginBottom: 200,
        flexFlow: 'wrap',
        display: 'flex',
        alignItems: 'flex-end'
    }
});

class Options extends Component {
    constructor(props) {
        super(props);
        this.state = {
            toast: '',
            ipAddressOptions: [],
            certificatesOptions: [],
            usersOptions: [],
            openModal: false
        };
    }

    componentDidMount() {
        const { socket, common: { host } } = this.props;

        socket.getRawSocket().emit('getHostByIp', host, (err, data) => {
            if (data) {
                let IPs4 = [{ title: `[IPv4] 0.0.0.0 - ${I18n.t('open_ip')}`, value: '0.0.0.0', family: 'ipv4' }];
                let IPs6 = [{ title: '[IPv6] ::', value: '::', family: 'ipv6' }];
                if (data.native.hardware && data.native.hardware.networkInterfaces) {
                    for (let eth in data.native.hardware.networkInterfaces) {
                        if (!data.native.hardware.networkInterfaces.hasOwnProperty(eth)) {
                            continue;
                        }
                        for (let num = 0; num < data.native.hardware.networkInterfaces[eth].length; num++) {
                            if (data.native.hardware.networkInterfaces[eth][num].family !== 'IPv6') {
                                IPs4.push({ title: `[${data.native.hardware.networkInterfaces[eth][num].family}] ${data.native.hardware.networkInterfaces[eth][num].address} - ${eth}`, value: data.native.hardware.networkInterfaces[eth][num].address, family: 'ipv4' });
                            } else {
                                IPs6.push({ title: `[${data.native.hardware.networkInterfaces[eth][num].family}] ${data.native.hardware.networkInterfaces[eth][num].address} - ${eth}`, value: data.native.hardware.networkInterfaces[eth][num].address, family: 'ipv6' });
                            }
                        }
                    }
                }
                for (let i = 0; i < IPs6.length; i++) {
                    IPs4.push(IPs6[i]);
                }
                this.setState({ ipAddressOptions: IPs4 });
            }
        })

        socket.getCertificates()
            .then(list =>
                this.setState({ certificatesOptions: list }));

        socket.getUsers()
            .then(list =>
                this.setState({ usersOptions: list }));
    }

    componentDidUpdate(prevProps) {
        const { native: { auth, secure } } = prevProps;
        if (!this.props.native.secure && this.props.native.auth && !this.state.openModal && ((auth !== this.props.native.auth) || (secure !== this.props.native.secure))) {
            this.setState({ openModal: true });
        }
    }

    renderConfirmDialog() {
        return <CustomModal
            open={this.state.openModal}
            buttonClick={() => {
                this.props.onChange('auth', false, () =>
                    this.setState({ openModal: false, toast: 'Authentication was deactivated' }));
            }}
            close={() => this.setState({ openModal: false })}
            titleOk={I18n.t('Disable authentication')}
            titleCancel={I18n.t('Ignore warning')}>
            <div className={classes.blockWarning}>{I18n.t('Warning!')}</div>
            <div className={classes.blockWarningContent}><Security style={{ width: 100, height: 100 }} />{I18n.t('Unsecure_Auth')}</div>
        </CustomModal>;
    }

    render() {
        const { instance, common, classes, native, onLoad, onChange } = this.props;
        const { certificatesOptions, ipAddressOptions, usersOptions, toast } = this.state;
        let newCommon = JSON.parse(JSON.stringify(common));

        newCommon.icon = newCommon.extIcon;

        return <form className={classes.tab}>
            <Toast message={toast} onClose={() => this.setState({ toast: '' })} />
            {this.renderConfirmDialog()}
            <Logo
                instance={instance}
                classes={undefined}
                common={newCommon}
                native={native}
                onError={text => this.setState({ errorText: text })}
                onLoad={onLoad}
            />
            <div className={`${classes.column} ${classes.columnSettings}`}>
                <div>
                    <CustomSelect
                        title='IP'
                        attr='bind'
                        className={classes.ipInputStyle}
                        options={ipAddressOptions}
                        native={native}
                        onChange={onChange}
                    />
                    <CustomInput
                        title='Port'
                        attr='port'
                        type='number'
                        style={{ marginTop: 5 }}
                        native={native}
                        onChange={onChange}
                    />
                </div>
                <div className={classes.blockWrapperCheckbox}>
                    <div className={classes.blockWrapper}>
                        <CustomCheckbox
                            title='Secure(HTTPS)'
                            attr='secure'
                            style={{ marginTop: 10 }}
                            native={native}
                            onChange={onChange}
                        />
                        <CustomCheckbox
                            title='Authentication'
                            attr='auth'
                            style={{ marginTop: 10 }}
                            native={native}
                            onChange={onChange}
                        />
                    </div>
                    <div className={classes.blockWrapper}>
                        <div className={`${classes.blockWrapperCheckbox} ${native['secure'] ? null : classes.displayNone}`} >
                            <CustomSelect
                                title='Public certificate'
                                attr='certPublic'
                                options={[
                                    { title: I18n.t('nothing'), value: '' }, ...certificatesOptions.filter(({ type }) => type === 'public').map(({ name }) => ({ title: name, value: name }))
                                ]}
                                style={{ marginTop: 10, marginRight: 20 }}
                                native={native}
                                onChange={onChange}
                            />
                            <CustomSelect
                                title='Private certificate'
                                attr='certPrivate'
                                options={[
                                    { title: I18n.t('nothing'), value: '' }, ...certificatesOptions.filter(({ type }) => type === 'private').map(({ name }) => ({ title: name, value: name }))
                                ]}
                                style={{ marginTop: 10, marginRight: 20 }}
                                native={native}
                                onChange={onChange}
                            />
                            <CustomSelect
                                title='Chained certificate'
                                attr='certChained'
                                options={[
                                    { title: I18n.t('nothing'), value: '' }, ...certificatesOptions.filter(({ type }) => type === 'chained').map(({ name }) => ({ title: name, value: name }))
                                ]}
                                style={{ marginTop: 10 }}
                                native={native}
                                onChange={onChange}
                            />
                        </div>
                        <CustomSelect
                            className={!native['auth'] ? null : classes.displayNone}
                            title='Run as'
                            attr='defaultUser'
                            options={usersOptions.map(({ _id, common: { name } }) => ({ title: name, value: _id.replace('system.user.', '') }))}
                            style={{ marginTop: 10, width: 300 }}
                            native={native}
                            onChange={onChange}
                        />
                        <CustomInput
                            className={native['auth'] ? null : classes.displayNone}
                            title='Login timeout(sec)'
                            attr='ttl'
                            type='number'
                            style={{ marginTop: -1, width: 300 }}
                            native={native}
                            onChange={onChange}
                        />
                    </div>
                    <div className={classes.blockWrapper}>
                        <CustomSelect
                            title='Auto update'
                            attr='autoUpdate'
                            style={{ marginTop: 10 }}
                            native={native}
                            options={[
                                {value: 0, title: 'manually'},
                                {value: 12, title: 'every 12 hours'},
                                {value: 24, title: 'every day'},
                                {value: 48, title: 'every 2 days'},
                                {value: 72, title: 'every 3 days'},
                                {value: 168, title: 'every week'},
                                {value: 336, title: 'every 2 weeks'},
                                {value: 720, title: 'monthly'},
                            ]}
                            onChange={onChange}
                        />
                        <CustomInput
                            title='Events threshold value'
                            attr='thresholdValue'
                            style={{ marginTop: 10 }}
                            native={native}
                            onChange={onChange}
                        />
                    </div>
                </div>
            </div>
        </form>;
    }
}

Options.propTypes = {
    common: PropTypes.object.isRequired,
    native: PropTypes.object.isRequired,
    instance: PropTypes.number.isRequired,
    adapterName: PropTypes.string.isRequired,
    onError: PropTypes.func,
    onLoad: PropTypes.func,
    onChange: PropTypes.func,
    changed: PropTypes.bool,
    socket: PropTypes.object.isRequired,
};

export default withStyles(styles)(Options);