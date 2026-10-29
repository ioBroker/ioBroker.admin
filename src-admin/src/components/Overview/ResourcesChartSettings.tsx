import React, { useEffect, useState } from 'react';

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    List as ListIcon,
    RestartAlt as ResetIcon,
} from '@mui/icons-material';

import {
    ColorPicker,
    DialogSelectID,
    type AdminConnection,
    type IobTheme,
    type ThemeType,
    type Translate,
} from '@iobroker/gui-components';

import { getDefaultSeries, getHistoryInstances, SERIES_PALETTE, type ChartSeriesConfig } from './ResourcesChart';

interface ResourcesChartSettingsProps {
    socket: AdminConnection;
    /** e.g. `system.host.MSI` */
    currentHost: string;
    /** Data points shown now - `null` for CPU and RAM of the host */
    series: ChartSeriesConfig[] | null;
    theme: IobTheme;
    themeType: ThemeType;
    lang: ioBroker.Languages;
    t: Translate;
    /** Called with the new data points, `null` for the default (CPU and RAM) */
    onSave: (series: ChartSeriesConfig[] | null) => void;
    onClose: () => void;
}

/** Whether the list says nothing more than the default does - then the default is stored */
function isDefault(series: ChartSeriesConfig[], host: string): boolean {
    const defaults = getDefaultSeries(host);
    return (
        series.length === defaults.length &&
        series.every((s, i) => s.id === defaults[i].id && !s.name && !s.color && !s.instance)
    );
}

/**
 * Chooses the data points of the "Resource usage" chart: any recorded state, with its own name,
 * color and history instance. Without a choice the chart shows CPU and RAM of the host.
 */
export default function ResourcesChartSettings(props: ResourcesChartSettingsProps): React.JSX.Element {
    const { t } = props;
    const [series, setSeries] = useState<ChartSeriesConfig[]>(() =>
        (props.series || getDefaultSeries(props.currentHost)).map(s => ({ ...s })),
    );
    const [instances, setInstances] = useState<string[]>([]);
    /** Index of the row the object browser is open for */
    const [selectFor, setSelectFor] = useState<number | null>(null);

    useEffect(() => {
        getHistoryInstances(props.socket)
            .then(list => setInstances(list.map(i => i.id)))
            .catch(e => console.warn(`Cannot read the history instances: ${(e as Error).message}`));
    }, [props.socket]);

    // always on the latest list: the object browser calls `onOk` and `onClose` right after another
    const update = (index: number, changes: Partial<ChartSeriesConfig>): void => {
        setSeries(list => list.map((s, i) => (i === index ? { ...s, ...changes } : s)));
    };

    const canSave = series.length > 0 && series.every(s => s.id.trim());

    const save = (): void => {
        // empty fields are left out, so they keep following the defaults
        const cleaned = series.map(s => {
            const entry: ChartSeriesConfig = { id: s.id.trim() };
            if (s.name?.trim()) {
                entry.name = s.name.trim();
            }
            if (s.color) {
                entry.color = s.color;
            }
            if (s.instance) {
                entry.instance = s.instance;
            }
            return entry;
        });
        props.onSave(isDefault(cleaned, props.currentHost) ? null : cleaned);
    };

    const defaultColor = (index: number): string =>
        index === 0
            ? props.theme.palette.primary.main
            : index === 1
              ? props.theme.palette.secondary.main
              : SERIES_PALETTE[index % SERIES_PALETTE.length] || SERIES_PALETTE[2];

    return (
        <Dialog
            open
            maxWidth="md"
            fullWidth
            onClose={props.onClose}
        >
            <DialogTitle>{t('Data points of the chart')}</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {t('Any recorded data point can be shown, e.g. one recorded by InfluxDB or SQL.')}
                </Typography>
                {series.map((s, i) => (
                    <Box
                        // the rows have no id of their own, an empty new row neither
                        key={i}
                        sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, flexWrap: 'wrap' }}
                    >
                        <ColorPicker
                            value={s.color || defaultColor(i)}
                            noInputField
                            theme={props.theme}
                            onChange={color => update(i, { color })}
                        />
                        <TextField
                            variant="standard"
                            label={t('ID')}
                            value={s.id}
                            error={!s.id.trim()}
                            sx={{ flex: '2 1 240px' }}
                            slotProps={{
                                inputLabel: { shrink: true },
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                title={t('Select ID')}
                                                aria-label={t('Select ID')}
                                                onClick={() => setSelectFor(i)}
                                            >
                                                <ListIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            onChange={e => update(i, { id: e.target.value })}
                        />
                        <TextField
                            variant="standard"
                            label={t('Name')}
                            value={s.name || ''}
                            placeholder={t('auto')}
                            sx={{ flex: '1 1 140px' }}
                            slotProps={{ inputLabel: { shrink: true } }}
                            onChange={e => update(i, { name: e.target.value })}
                        />
                        <FormControl
                            variant="standard"
                            sx={{ flex: '1 1 120px' }}
                        >
                            <InputLabel shrink>{t('History instance')}</InputLabel>
                            <Select
                                variant="standard"
                                value={s.instance || ''}
                                displayEmpty
                                onChange={e => update(i, { instance: e.target.value })}
                            >
                                <MenuItem value="">{t('auto')}</MenuItem>
                                {/* a configured instance that is gone must still be shown */}
                                {(s.instance && !instances.includes(s.instance)
                                    ? [...instances, s.instance]
                                    : instances
                                ).map(instance => (
                                    <MenuItem
                                        key={instance}
                                        value={instance}
                                    >
                                        {instance}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Tooltip title={t('Delete')}>
                            <IconButton
                                size="small"
                                aria-label={t('Delete')}
                                onClick={() => setSeries(list => list.filter((_s, j) => j !== i))}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ))}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setSeries(list => [...list, { id: '' }]);
                            // most of the time the ID is picked from the object browser anyway
                            setSelectFor(series.length);
                        }}
                    >
                        {t('Add data point')}
                    </Button>
                    <Button
                        variant="outlined"
                        color="grey"
                        startIcon={<ResetIcon />}
                        onClick={() => setSeries(getDefaultSeries(props.currentHost))}
                    >
                        {t('Reset to CPU and RAM')}
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={!canSave}
                    startIcon={<CheckIcon />}
                    onClick={save}
                >
                    {t('Save')}
                </Button>
                <Button
                    color="grey"
                    startIcon={<CloseIcon />}
                    onClick={props.onClose}
                >
                    {t('Cancel')}
                </Button>
            </DialogActions>
            {selectFor !== null ? (
                <DialogSelectID
                    dialogName="overviewChart"
                    title={t('Select ID')}
                    types={['state']}
                    socket={props.socket}
                    lang={props.lang}
                    theme={props.theme}
                    themeName={props.theme.name}
                    themeType={props.themeType}
                    selected={series[selectFor]?.id || ''}
                    onClose={() => {
                        // a new row left without an ID would only be in the way
                        setSeries(list => list.filter((s, j) => j !== selectFor || s.id));
                        setSelectFor(null);
                    }}
                    onOk={selected => {
                        const id = Array.isArray(selected) ? selected[0] : selected;
                        if (id) {
                            update(selectFor, { id });
                        }
                    }}
                />
            ) : null}
        </Dialog>
    );
}
