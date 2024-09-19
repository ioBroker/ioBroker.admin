import React, { type JSX } from 'react';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

import {
    Grid2,
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    TextField,
    Autocomplete,
    FormHelperText,
    InputAdornment,
    IconButton,
    type SelectChangeEvent,
} from '@mui/material';

import { Close as CloseIcon } from '@mui/icons-material';

import { Marker } from 'leaflet';
import type { DragEndEvent, LatLngTuple, Map } from 'leaflet';

import { Confirm as ConfirmDialog, withWidth, I18n, type Translate } from '@iobroker/adapter-react-v5';
import { type AdminGuiConfig } from '@/types';

import AdminUtils from '../../AdminUtils';
import countries from '../../assets/json/countries.json';
import BaseSystemSettingsDialog from './BaseSystemSettingsDialog';

const styles: Record<string, React.CSSProperties> = {
    tabPanel: {
        width: '100%',
        height: '100% ',
        overflow: 'auto',
        overflowX: 'hidden',
        padding: 15,
        // backgroundColor: blueGrey[ 50 ]
    },
    formControl: {
        marginRight: 8,
        minWidth: '100%',
    },
    selectEmpty: {
        marginTop: 16,
    },
    map: {
        borderRadius: 5,
    },
};

const MyMapComponent: React.FC<{ addMap: (map: any) => any }> = props => {
    const map = useMap();
    if (props.addMap) {
        props.addMap(map);
    }
    return null;
};

interface Setting {
    id: string;
    title: string;
    translate?: boolean;
    values: { id: string | boolean; title: string }[];
    allowText?: boolean;
    autocomplete?: boolean;
    help?: string;
}

interface Props {
    t: Translate;
    data: ioBroker.SystemConfigObject;
    dataAux: ioBroker.SystemConfigObject;
    adminGuiConfig: AdminGuiConfig;
    saving: boolean;
    onChange: (data: any, dataAux: any, cb?: () => void) => void;
    histories: string[];
    multipleRepos: boolean;
}

interface State {
    zoom: number;
    confirm: boolean;
    confirmValue: string;
}

class MainSettingsDialog extends BaseSystemSettingsDialog<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            zoom: 14,
            confirm: false,
            confirmValue: '',
        };
    }

    marker: Marker;

    map: Map;

    cityTimer: ReturnType<typeof setTimeout>;

    latLongTimer: ReturnType<typeof setTimeout>;

    getSettings(): Setting[] {
        return [
            {
                id: 'language',
                title: 'System language:',
                translate: false,
                values: [
                    {
                        id: 'en',
                        title: 'English',
                    },
                    {
                        id: 'de',
                        title: 'Deutsch',
                    },
                    {
                        id: 'ru',
                        title: 'русский',
                    },
                    {
                        id: 'uk',
                        title: 'український',
                    },
                    {
                        id: 'pt',
                        title: 'Portugues',
                    },
                    {
                        id: 'nl',
                        title: 'Nederlands',
                    },
                    {
                        id: 'fr',
                        title: 'français',
                    },
                    {
                        id: 'it',
                        title: 'Italiano',
                    },
                    {
                        id: 'es',
                        title: 'Espanol',
                    },
                    {
                        id: 'pl',
                        title: 'Polski',
                    },
                    {
                        id: 'zh-ch',
                        title: '简体中文',
                    },
                ],
            },
            {
                id: 'tempUnit',
                title: 'Temperature units',
                translate: false,
                values: [
                    {
                        id: '°C',
                        title: '°C',
                    },
                    {
                        id: '°F',
                        title: '°F',
                    },
                ],
            },
            {
                id: 'currency',
                title: 'Currency sign',
                translate: false,
                allowText: true,
                autocomplete: true,
                values: [
                    {
                        id: '€',
                        title: '€',
                    },
                    {
                        id: '$',
                        title: '$',
                    },
                    {
                        id: '₽',
                        title: '₽',
                    },
                    {
                        id: '₤',
                        title: '₤',
                    },
                    {
                        id: 'CHF',
                        title: 'CHF',
                    },
                ],
            },
            {
                id: 'dateFormat',
                title: 'Date format',
                translate: true,
                values: [
                    {
                        id: 'DD.MM.YYYY',
                        title: 'DD.MM.YYYY',
                    },
                    {
                        id: 'YYYY.MM.DD',
                        title: 'YYYY.MM.DD',
                    },
                    {
                        id: 'MM/DD/YYYY',
                        title: 'MM/DD/YYYY',
                    },
                ],
            },
            {
                id: 'isFloatComma',
                title: 'Float divider sign',
                translate: true,
                values: [
                    {
                        id: true,
                        title: 'comma',
                    },
                    {
                        id: false,
                        title: 'point',
                    },
                ],
            },
            {
                id: 'defaultHistory',
                title: 'Default History',
                values: [
                    { id: '', title: this.props.t('None') },
                    ...this.props.histories.map(history => ({
                        id: history,
                        title: history,
                    })),
                ],
            },
            {
                id: 'activeRepo',
                title: 'Default Repository',
                translate: false,
                values: AdminUtils.objectMap(this.props.dataAux.native.repositories, (_repo, name) => ({
                    id: name,
                    title: name,
                })),
            },
            {
                id: 'expertMode',
                title: 'Expert mode',
                values: [
                    { id: true, title: 'on' },
                    { id: false, title: 'off (default)' },
                ],
            },
            {
                id: 'defaultLogLevel',
                title: 'Default log level',
                help: 'for new instances',
                translate: false,
                values: [
                    { id: 'debug', title: 'debug' },
                    { id: 'info', title: 'info' },
                    { id: 'warn', title: 'warn' },
                    { id: 'error', title: 'error' },
                ],
            },
            {
                id: 'firstDayOfWeek',
                title: 'First day of week',
                translate: true,
                values: [
                    { id: 'monday', title: 'Monday' },
                    { id: 'sunday', title: 'Sunday' },
                ],
            },
        ];
    }

    onMap = (map: Map): void => {
        if (this.props.saving) {
            return;
        }
        if (!this.map || this.map !== map) {
            this.map = map;
            const center: LatLngTuple = [
                parseFloat(
                    this.props.data.common.latitude !== undefined
                        ? (this.props.data.common.latitude as any as string)
                        : '50',
                ) || 0,
                parseFloat(
                    this.props.data.common.longitude !== undefined
                        ? (this.props.data.common.longitude as any as string)
                        : '10',
                ) || 0,
            ];

            this.marker = new Marker(center, {
                draggable: true,
                title: I18n.t('Resource location'),
                alt: I18n.t('Resource Location'),
                riseOnHover: true,
            })
                .addTo(map)
                .bindPopup('Popup for any custom information.')
                .on({ dragend: (evt: DragEndEvent) => this.onMarkerDragend(evt) });
        }
    };

    getSelect(e: Setting, i: number): JSX.Element | null {
        let value = (this.props.data.common as Record<string, any>)[e.id];

        if (e.id === 'defaultLogLevel' && !value) {
            value = 'info';
        }

        if (e.id === 'activeRepo' && this.props.multipleRepos) {
            return null;
        }

        // if disabled by vendor settings
        if (this.props.adminGuiConfig.admin.settings && this.props.adminGuiConfig.admin.settings[e.id] === false) {
            return null;
        }

        if (e.autocomplete && e.values) {
            return (
                <Grid2
                    size={{ sm: 6, xs: 12 }}
                    key={i}
                >
                    <Autocomplete<Setting['values'][0], false, false, true>
                        // variant="standard"
                        freeSolo
                        disabled={this.props.saving}
                        options={e.values}
                        inputValue={value.toString()}
                        onChange={(_evt, newValue) => {
                            const id = this.getSettings()[i].id;
                            if (typeof newValue === 'string') {
                                this.doChange(id, newValue);
                                return;
                            }
                            this.doChange(id, newValue ? newValue.id : '');
                        }}
                        onInputChange={(_event, newValue) => {
                            const id = this.getSettings()[i].id;
                            this.doChange(id, newValue);
                        }}
                        getOptionLabel={option => {
                            if (typeof option === 'string') {
                                return option;
                            }
                            if (e.translate) {
                                return this.props.t(option.title || option.id.toString());
                            }
                            return option.title || option.id.toString();
                        }}
                        renderOption={(props, option) => (
                            <li {...props}>
                                {e.translate
                                    ? this.props.t(option.title || option.id.toString())
                                    : option.title || option.id}
                            </li>
                        )}
                        renderInput={params => (
                            <TextField
                                {...params}
                                variant="standard"
                                label={this.props.t(e.title)}
                            />
                        )}
                    />
                </Grid2>
            );
        }

        // If value is not in known values, show text input
        if (e.allowText && value && !e.values.find(elem => elem.id === value)) {
            return (
                <Grid2
                    size={{ sm: 6, xs: 12 }}
                    key={i}
                >
                    <FormControl
                        style={styles.formControl}
                        variant="standard"
                    >
                        <InputLabel
                            shrink
                            id={`${e.id}-label`}
                        >
                            {this.props.t(e.title)}
                        </InputLabel>
                        <TextField
                            disabled={this.props.saving}
                            variant="standard"
                            id={e.id}
                            value={value.toString()}
                            onChange={evt => this.handleChange(evt, i)}
                            helperText={e.help ? this.props.t(e.help) : ''}
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                                input: {
                                    readOnly: false,
                                    endAdornment: value.toString() ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={() => this.handleChange({ target: { value: '' } }, i)}
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,
                                },
                            }}
                        />
                    </FormControl>
                </Grid2>
            );
        }

        const items = e.values.map((elem, index) => (
            <MenuItem
                value={elem.id as string}
                key={index}
            >
                {e.translate ? this.props.t(elem.title || elem.id.toString()) : elem.title || elem.id}
            </MenuItem>
        ));

        return (
            <Grid2
                size={{ sm: 6, xs: 12 }}
                key={i}
            >
                <FormControl
                    style={styles.formControl}
                    variant="standard"
                >
                    <InputLabel
                        shrink
                        id={`${e.id}-label`}
                    >
                        {this.props.t(e.title)}
                    </InputLabel>
                    <Select
                        disabled={this.props.saving}
                        variant="standard"
                        style={styles.formControl}
                        id={e.id}
                        value={value === undefined ? false : value}
                        onChange={evt => this.handleChange(evt, i)}
                        displayEmpty
                    >
                        {items}
                    </Select>
                    {e.help ? <FormHelperText>{this.props.t(e.help)}</FormHelperText> : null}
                </FormControl>
            </Grid2>
        );
    }

    renderConfirmDialog(): JSX.Element | null {
        if (this.state.confirm) {
            return (
                <ConfirmDialog
                    text={this.props.t('confirm_change_repo')}
                    onClose={result => {
                        const value = this.state.confirmValue;
                        this.setState({ confirm: false, confirmValue: null }, () => {
                            if (result) {
                                this.doChange('activeRepo', value);
                            }
                        });
                    }}
                />
            );
        }

        return null;
    }

    getCounters = (): JSX.Element => {
        const items = countries.map((elem, index) => (
            <MenuItem
                value={elem.name}
                key={index}
            >
                {this.props.t(elem.name)}
            </MenuItem>
        ));

        return (
            <FormControl
                style={styles.formControl}
                variant="standard"
            >
                <InputLabel
                    shrink
                    id="country-label"
                >
                    {this.props.t('Country:')}
                </InputLabel>
                <Select
                    disabled={this.props.saving}
                    variant="standard"
                    style={styles.formControl}
                    id="country"
                    value={this.props.data.common.country}
                    onChange={this.handleChangeCountry}
                    displayEmpty
                >
                    {items}
                </Select>
            </FormControl>
        );
    };

    handleChangeCountry = (evt: SelectChangeEvent<string>): void => {
        const value = evt.target.value;
        const id = 'country';
        this.doChange(id, value);
    };

    onChangeText = (evt: { target: { value: string } }, id: string): void => {
        const value = evt.target.value;
        this.onChangeInput(value, id);

        if (id === 'longitude' || id === 'latitude') {
            if (this.latLongTimer) {
                clearTimeout(this.latLongTimer);
            }
            this.latLongTimer = setTimeout(() => {
                this.latLongTimer = null;
                this.map.flyTo([
                    parseFloat(this.props.data.common.latitude as any as string),
                    parseFloat(this.props.data.common.longitude as any as string),
                ]);
                this.marker.setLatLng([
                    parseFloat(this.props.data.common.latitude as any as string),
                    parseFloat(this.props.data.common.longitude as any as string),
                ]);
            }, 500);
        }
    };

    onChangeInput = (value: any, id: string, cb?: () => void): void => this.doChange(id, value, cb);

    onChangeCity = (evt: { target: { value: string } }): void => {
        this.onChangeText(evt, 'city');

        if (this.cityTimer) {
            clearTimeout(this.cityTimer);
        }

        this.cityTimer = setTimeout(() => {
            this.cityTimer = null;
            const provider = new OpenStreetMapProvider();

            void provider.search({ query: evt.target.value }).then(results => {
                if (results[0]) {
                    setTimeout(
                        () =>
                            this.onChangeInput(results[0].y, 'latitude', () =>
                                this.onChangeInput(results[0].x, 'longitude', () =>
                                    this.onChangeInput(23, 'zoom', () => {
                                        this.map.flyTo([results[0].y, results[0].x]);
                                        this.marker.setLatLng([results[0].y, results[0].x]);
                                    }),
                                ),
                            ),
                        1200,
                    );
                }
            });
        }, 500);
    };

    handleChange = (evt: { target: { value: string } }, selectId: number): void => {
        const value = evt.target.value;
        const id = this.getSettings()[selectId].id;

        if (
            id === 'activeRepo' &&
            !value.toLowerCase().startsWith('stable') &&
            !value.toLowerCase().includes('default')
        ) {
            this.setState({ confirm: true, confirmValue: value });
        } else {
            this.doChange(id, value);
        }
    };

    doChange = (name: string, value: any, cb?: () => void): void => {
        const newData = AdminUtils.clone(this.props.data);
        (newData.common as Record<string, any>)[name] = value;
        this.props.onChange(newData, null, () => cb && cb());
    };

    onMarkerDragend = (evt: DragEndEvent): void => {
        const ll = JSON.parse(JSON.stringify(evt.target._latlng));
        this.doChange('latitude', ll.lat, () => this.doChange('longitude', ll.lng));
    };

    render(): JSX.Element {
        const selectors = this.getSettings().map((e, i) => this.getSelect(e, i));

        const center: LatLngTuple = [
            parseFloat(
                this.props.data.common.latitude !== undefined
                    ? (this.props.data.common.latitude as any as string)
                    : '50',
            ) || 0,
            parseFloat(
                this.props.data.common.longitude !== undefined
                    ? (this.props.data.common.longitude as any as string)
                    : '10',
            ) || 0,
        ];

        const { zoom } = this.state;

        return (
            <div style={styles.tabPanel}>
                {this.renderConfirmDialog()}
                <Grid2
                    container
                    spacing={3}
                >
                    <Grid2 size={{ lg: 6, md: 12 }}>
                        <Grid2
                            container
                            spacing={3}
                        >
                            <Grid2 size={{ xs: 12 }}>
                                <TextField
                                    disabled={this.props.saving}
                                    fullWidth
                                    variant="standard"
                                    id="siteName"
                                    label={this.props.t('Site name')}
                                    // @ts-expect-error will be fixed in js-controller
                                    value={this.props.data.common.siteName || ''}
                                    onChange={e => this.doChange('siteName', e.target.value)}
                                    helperText={this.props.t(
                                        "This name will be shown in admin's header. Just to identify the whole installation",
                                    )}
                                    slotProps={{
                                        input: {
                                            // @ts-expect-error will be fixed in js-controller
                                            endAdornment: this.props.data.common.siteName ? (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => this.doChange('siteName', '')}
                                                    >
                                                        <CloseIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            ) : null,
                                        },
                                    }}
                                />
                            </Grid2>
                            {selectors}
                        </Grid2>
                    </Grid2>
                    <Grid2 size={{ lg: 6, md: 12 }}>
                        <MapContainer
                            style={styles.map}
                            center={center}
                            zoom={zoom}
                            maxZoom={18}
                            attributionControl
                            zoomControl
                            doubleClickZoom
                            scrollWheelZoom
                            dragging
                            // animate
                            easeLinearity={0.35}
                        >
                            <TileLayer url="https://{s}.tile.osm.org/{z}/{x}/{y}.png" />
                            <MyMapComponent addMap={map => this.onMap(map)} />
                        </MapContainer>
                    </Grid2>
                </Grid2>
                <Grid2
                    container
                    spacing={6}
                >
                    <Grid2 size={{ sm: 6, xs: 12, md: 3 }}>{this.getCounters()}</Grid2>
                    <Grid2 size={{ sm: 6, xs: 12, md: 3 }}>
                        <FormControl
                            style={styles.formControl}
                            variant="standard"
                        >
                            <InputLabel
                                shrink
                                id="city-label"
                            >
                                {this.props.t('City:')}
                            </InputLabel>
                            <TextField
                                disabled={this.props.saving}
                                variant="standard"
                                id="city"
                                label={this.props.t('City:')}
                                value={this.props.data.common.city}
                                onChange={evt => this.onChangeCity(evt)}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        readOnly: false,
                                        endAdornment: this.props.data.common.city ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => this.onChangeCity({ target: { value: '' } })}
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    },
                                }}
                            />
                        </FormControl>
                    </Grid2>
                    <Grid2 size={{ sm: 6, xs: 12, md: 3 }}>
                        <FormControl
                            style={styles.formControl}
                            variant="standard"
                        >
                            <InputLabel
                                shrink
                                id="latitude-label"
                            >
                                {this.props.t('Latitude:')}
                            </InputLabel>
                            <TextField
                                disabled={this.props.saving}
                                variant="standard"
                                id="latitude"
                                label={this.props.t('Latitude:')}
                                value={this.props.data.common.latitude || 0}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        readOnly: false,
                                    },
                                }}
                                onChange={evt => this.onChangeText(evt, 'latitude')}
                            />
                        </FormControl>
                    </Grid2>
                    <Grid2 size={{ sm: 6, xs: 12, md: 3 }}>
                        <FormControl
                            style={styles.formControl}
                            variant="standard"
                        >
                            <InputLabel
                                shrink
                                id="longitude-label"
                            >
                                {this.props.t('Longitude:')}
                            </InputLabel>
                            <TextField
                                disabled={this.props.saving}
                                variant="standard"
                                id="longitude"
                                label={this.props.t('Longitude:')}
                                value={this.props.data.common.longitude || 0}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        readOnly: false,
                                    },
                                }}
                                onChange={evt => this.onChangeText(evt, 'longitude')}
                            />
                        </FormControl>
                    </Grid2>
                </Grid2>
            </div>
        );
    }
}

export default withWidth()(MainSettingsDialog);
