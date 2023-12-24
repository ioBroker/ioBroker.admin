import React from 'react';
import {
    IconButton, InputAdornment, TextField,
    Toolbar, Tooltip, LinearProgress,
} from '@mui/material';

import { Clear, Refresh } from '@mui/icons-material';

import { I18n } from '@iobroker/adapter-react-v5';
import { DeviceInfo, InstanceDetails } from '@iobroker/dm-utils';

import DeviceCard from './DeviceCard';
import { getTranslation } from './Utils';
import Communication, { CommunicationProps, CommunicationState } from './Communication';
import InstanceActionButton from './InstanceActionButton';

import de from './i18n/de.json';
import en from './i18n/en.json';
import ru from './i18n/ru.json';
import pt from './i18n/pt.json';
import nl from './i18n/nl.json';
import fr from './i18n/fr.json';
import it from './i18n/it.json';
import es from './i18n/es.json';
import pl from './i18n/pl.json';
import uk from './i18n/uk.json';
import zhCn from './i18n/zh-cn.json';

interface DeviceListProps extends CommunicationProps {
    /* Instance to upload images to, like `adapterName.X` */
    uploadImagesToInstance?: string;
    /* Filter devices with this string */
    filter?: string;
    /* If this component is used in GUI with own toolbar. `false` if this list is used with multiple instances and true if only with one (in this case, it will monitor alive itself */
    embedded?: boolean;
    /* If embedded, this text is shown in the toolbar */
    title?: string;
    /* Style of a component that displays all devices */
    style?: React.CSSProperties;
    /* Use small cards for devices */
    smallCards?: boolean;
}

interface DeviceListState extends CommunicationState {
    devices: DeviceInfo[];
    filteredDevices: DeviceInfo[];
    filter: string;
    instanceInfo: InstanceDetails;
    loading: boolean;
    alive: boolean | null;
}

/**
 * Device List Component
 * @param {object} params - Component parameters
 * @param {object} params.socket - socket object
 * @param {string} params.selectedInstance - Selected instance
 * @param {string} params.uploadImagesToInstance - Instance to upload images to
 * @param {string} params.filter - Filter
 * @param {string} params.empbedded - true if this list used with multiple instances and false if only with one
 * @param {string} params.title - Title in appbar (only in non-embedded mode)
 * @param {string} params.style - Style of devices list
 * @returns {*[]} - Array of device cards
 */
export default class DeviceList extends Communication<DeviceListProps, DeviceListState> {
    static i18nInitialized = false;

    private lastPropsFilter: string | undefined;

    private lastInstance: string;

    private filterTimeout: ReturnType<typeof setTimeout> | null;

    private readonly language: ioBroker.Languages;

    constructor(props: DeviceListProps) {
        super(props);

        if (!DeviceList.i18nInitialized) {
            DeviceList.i18nInitialized = true;
            // @ts-expect-error
            I18n.extendTranslations({
                en,
                de,
                ru,
                pt,
                nl,
                fr,
                it,
                es,
                pl,
                uk,
                'zh-cn': zhCn,
            });
        }

        Object.assign(this.state, {
            devices: [],
            filteredDevices: [],
            filter: '',
            instanceInfo: null,
            loading: null,
            alive: null,
        });

        this.lastPropsFilter = this.props.filter;
        this.lastInstance = this.props.selectedInstance;
        this.filterTimeout = null;
        this.language = I18n.getLanguage();
    }

    async componentDidMount() {
        let alive = false;
        if (this.state.alive === null) {
            try {
                // check if instance is alive
                const stateAlive = await this.props.socket.getState(`system.adapter.${this.props.selectedInstance}.alive`);
                if (stateAlive?.val) {
                    alive = true;
                }
            } catch (error) {
                console.error(error);
            }
            this.setState({ alive }, () => this.props.socket.subscribeState(`system.adapter.${this.props.selectedInstance}.alive`, this.aliveHandler));
            if (!alive) {
                return;
            }
        } else {
            alive = this.state.alive;
        }

        if (!this.props.embedded && alive) {
            try {
                const instanceInfo = await this.loadInstanceInfos();
                this.setState({ instanceInfo });
            } catch (error) {
                console.error(error);
            }
        }
        if (alive) {
            this.loadData();
        }
    }

    componentWillUnmount() {
        this.props.socket.unsubscribeState(`system.adapter.${this.props.selectedInstance}.alive`, this.aliveHandler);
    }

    aliveHandler: ioBroker.StateChangeHandler = (id: string, state: ioBroker.State | null | undefined) => {
        if (id === `system.adapter.${this.props.selectedInstance}.alive`) {
            const alive = !!state?.val;
            if (alive !== this.state.alive) {
                this.setState({ alive }, () => {
                    if (alive) {
                        this.componentDidMount().catch(console.error);
                    }
                });
            }
        }
    };

    /**
    * Load devices
    */
    loadData(): void {
        this.setState({ loading: true }, async () => {
            console.log(`Loading devices for ${this.props.selectedInstance}...`);
            let devices;
            try {
                devices = await this.loadDevices();

                if (!devices || !Array.isArray(devices)) {
                    console.error(
                        `Message returned from sendTo() doesn't look like one from DeviceManagement, did you accidentally handle the message in your adapter? ${JSON.stringify(
                            devices,
                        )}`,
                    );
                    devices = [];
                }
            } catch (error) {
                console.error(error);
                devices = [];
            }

            this.setState({ devices, loading: false }, () =>
                this.applyFilter());
        });
    }

    getText(text: ioBroker.StringOrTranslated): string {
        if (typeof text === 'object') {
            return text[this.language] || text.en;
        }

        return text;
    }

    applyFilter() {
        const filter = this.props.embedded ? this.props.filter : this.state.filter;

        // filter devices name
        if (filter) {
            const filteredDevices = this.state.devices.filter(device =>
                this.getText(device.name).toLowerCase().includes(filter.toLowerCase()));
            this.setState({ filteredDevices });
        } else {
            this.setState({ filteredDevices: this.state.devices });
        }
    }

    handleFilterChange(filter: string) {
        this.setState({ filter }, () => {
            this.filterTimeout && clearTimeout(this.filterTimeout);
            this.filterTimeout = setTimeout(() => {
                this.filterTimeout = null;
                this.applyFilter();
            }, 250);
        });
    }

    renderContent(): React.JSX.Element | React.JSX.Element[] | null {
        /** @type {object} */
        const emptyStyle = {
            padding: 25,
        };

        if (this.props.embedded && this.lastPropsFilter !== this.props.filter) {
            this.lastPropsFilter = this.props.filter;
            setTimeout(() => this.applyFilter(), 50);
        }
        if (this.props.embedded && this.lastInstance !== this.props.selectedInstance) {
            this.lastInstance = this.props.selectedInstance;
            setTimeout(() => this.loadData(), 50);
        }

        let list;
        if (!this.props.embedded && !this.state.alive) {
            list = <div style={emptyStyle}>
                <span>{getTranslation('instanceNotAlive')}</span>
            </div>;
        } else if (!this.state.devices.length && this.props.selectedInstance) {
            list = <div style={emptyStyle}>
                <span>{getTranslation('noDevicesFoundText')}</span>
            </div>;
        } else if (this.state.devices.length && !this.state.filteredDevices.length) {
            list = <div style={emptyStyle}>
                <span>{getTranslation('allDevicesFilteredOut')}</span>
            </div>;
        } else {
            list = this.state.filteredDevices.map(device => <DeviceCard
                alive={!!this.state.alive}
                key={device.id}
                id={device.id}
                title={this.getText(device.name)}
                device={device}
                instanceId={this.props.selectedInstance}
                uploadImagesToInstance={this.props.uploadImagesToInstance}
                deviceHandler={this.deviceHandler}
                controlHandler={this.controlHandler}
                controlStateHandler={this.controlStateHandler}
                socket={this.props.socket}
            />);
        }

        if (this.props.embedded) {
            return <>
                {this.state.loading ? <LinearProgress style={{ width: '100%' }} /> : null}
                {list}
            </>;
        }

        return <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <Toolbar variant="dense" style={{ backgroundColor: '#777', display: 'flex' }}>
                {this.props.title}
                {this.props.selectedInstance ? <Tooltip title={getTranslation('refreshTooltip')}>
                    <span>
                        <IconButton
                            onClick={() => this.loadData()}
                            disabled={!this.state.alive}
                            size="small"
                        >
                            <Refresh />
                        </IconButton>
                    </span>
                </Tooltip> : null}
                {this.state.alive && this.state.instanceInfo?.actions?.length ? <div style={{ marginLeft: 20 }}>
                    {this.state.instanceInfo.actions.map(action =>
                        <InstanceActionButton
                            key={action.id}
                            action={action}
                            instanceHandler={this.instanceHandler}
                        />)}
                </div> : null}

                <div style={{ flexGrow: 1 }} />

                {this.state.alive ? <TextField
                    variant="standard"
                    style={{ width: 200 }}
                    size="small"
                    label={getTranslation('filterLabelText')}
                    onChange={e => this.handleFilterChange(e.target.value)}
                    value={this.state.filter}
                    autoComplete="off"
                    inputProps={{
                        autoComplete: 'new-password',
                        form: { autoComplete: 'off' },
                    }}
                    // eslint-disable-next-line react/jsx-no-duplicate-props
                    InputProps={{
                        endAdornment: this.state.filter ? <InputAdornment position="end">
                            <IconButton
                                onClick={() => this.handleFilterChange('')}
                                edge="end"
                            >
                                <Clear />
                            </IconButton>
                        </InputAdornment> : null,
                    }}
                /> : null}
            </Toolbar>
            <div
                style={{
                    width: '100%',
                    height: 'calc(100% - 56px)',
                    marginTop: 8,
                    overflow: 'auto',
                    // justifyContent: 'center',
                    // alignItems: 'stretch',
                    // display: 'grid',
                    // columnGap: 8,
                    // rowGap: 8,
                    ...this.props.style,
                }}
            >
                {this.state.loading ? <LinearProgress style={{ width: '100%' }} /> : null}
                {list}
            </div>
        </div>;
    }
}
