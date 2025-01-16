import React from 'react';

import {
    InputLabel,
    MenuItem,
    Select,
    TextField,
    FormControl,
    FormControlLabel,
    Checkbox,
    type Theme,
} from '@mui/material';

import { convertCronToText } from './cronText';

import { I18n } from '../../i18n';

const styles: Record<string, React.CSSProperties> = {
    mainDiv: {
        width: '100%',
        height: '100%',
        overflow: 'auto',
    },
    formControl: {
        margin: 0,
        minWidth: 120,
    },
    formControlMarginRight: {
        marginRight: 5,
    },
    formControlPaddingTop: {
        paddingTop: 6.2,
    },
};

type SimpleCronType = 'once' | 'interval' | 'intervalBetween' | 'specific';
const PERIODIC = {
    once: 'once',
    interval: 'interval',
    intervalBetween: 'intervalBetween',
    specific: 'specific',
};
const PERIODIC_TYPES = {
    seconds: 'seconds',
    minutes: 'minutes',
    // hours: 'hours',
};
const WEEKDAYS = [
    'ra_Sunday',
    'ra_Monday',
    'ra_Tuesday',
    'ra_Wednesday',
    'ra_Thursday',
    'ra_Friday',
    'ra_Saturday',
    'ra_Sunday',
];

function padding(num: number): string {
    if (num < 10) {
        return `0${num}`;
    }

    return `${num}`;
}
const DEFAULT_STATE = {
    mode: 'interval',
    interval: {
        period: 1,
        unit: PERIODIC_TYPES.minutes,
    },
};

interface SimpleCronProps {
    cronExpression?: string;
    onChange: (cron: string) => void;
    language: ioBroker.Languages;
}

interface SimpleCronState {
    extended: boolean;
    cron: string;
    mode: SimpleCronType;
    once: {
        time: string;
        date: string;
        // weekdays?: number[];
    };
    interval: {
        period: number;
        unit: string;
        minutes?: number; // if extended
        hours?: number; // if extended
    };
    intervalBetween: {
        period: number;
        unit: string;
        timeFrom: number;
        timeTo: number;
        weekdays: number[];
        minutes?: number; // if extended
        hours?: number; // if extended
    };
    specific: {
        time: string;
        weekdays: number[];
    };
}

interface CronStructure {
    seconds: string | null;
    minutes: string;
    hours: string;
    date: string;
    months: string;
    dow: string;
}

function text2weekdays(text: string): number[] {
    if (text === '*') {
        return [0, 1, 2, 3, 4, 5, 6];
    }

    const parts = text.split(',');
    const list: number[] = [];
    parts.forEach(part => {
        const _parts = part.split('-');
        if (_parts.length === 2) {
            const start = parseInt(_parts[0], 10);
            const end = parseInt(_parts[1], 10);
            for (let day = start; day <= end; day++) {
                if (!list.includes(day === 7 ? 0 : day)) {
                    list.push(day === 7 ? 0 : day);
                }
            }
        } else {
            if (part === '7') {
                part = '0';
            }
            const numPart = parseInt(part, 10);
            if (!list.includes(numPart)) {
                list.push(numPart);
            }
        }
    });
    list.sort();
    return list;
}

export function cron2state(cron: string, force?: boolean): Partial<SimpleCronState> | null {
    cron = cron.replace(/['"]/g, '').trim();
    const cronParts = cron.split(' ');
    let options: CronStructure;
    let state: Partial<SimpleCronState> | null = null;

    if (cronParts.length === 6) {
        options = {
            seconds: cronParts[0] || '*',
            minutes: cronParts[1] || '*',
            hours: cronParts[2] || '*',
            date: cronParts[3] || '*',
            months: cronParts[4] || '*',
            dow: cronParts[5] || '*',
        };
    } else {
        options = {
            seconds: null,
            minutes: cronParts[0] || '*',
            hours: cronParts[1] || '*',
            date: cronParts[2] || '*',
            months: cronParts[3] || '*',
            dow: cronParts[4] || '*',
        };
    }

    // * * * * *
    if (
        options.seconds === null &&
        options.minutes === '*' &&
        options.hours === '*' &&
        options.date === '*' &&
        options.months === '*' &&
        (options.dow === '*' || force)
    ) {
        state = {
            mode: 'interval',
            interval: {
                period: 1,
                unit: PERIODIC_TYPES.minutes,
            },
        };
    } // * * * * * *

    if (
        options.seconds === '*' &&
        options.minutes === '*' &&
        options.hours === '*' &&
        options.date === '*' &&
        options.months === '*' &&
        (options.dow === '*' || force)
    ) {
        state = {
            mode: 'interval',
            interval: {
                period: 1,
                unit: PERIODIC_TYPES.seconds,
            },
        };
    } else if (
        options.seconds === null &&
        options.minutes.includes('/') &&
        options.hours === '*' &&
        options.date === '*' &&
        options.months === '*' &&
        (options.dow === '*' || force)
    ) {
        // */n * * * *
        state = {
            mode: 'interval',
            interval: {
                period: parseInt(options.minutes.split('/')[1], 10),
                unit: PERIODIC_TYPES.minutes,
            },
        };
    } else if (
        options.seconds !== null &&
        options.seconds.includes('/') &&
        options.minutes === '*' &&
        options.hours === '*' &&
        options.date === '*' &&
        options.months === '*' &&
        (options.dow === '*' || force)
    ) {
        // */n * * * * *
        state = {
            mode: 'interval',
            interval: {
                period: parseInt(options.seconds.split('/')[1], 10),
                unit: PERIODIC_TYPES.seconds,
            },
        };
    } else if (
        options.seconds !== null &&
        options.seconds.includes('/') &&
        options.minutes === '*' &&
        options.hours.includes('-') &&
        options.date === '*' &&
        options.months === '*' &&
        (options.dow === '*' || force)
    ) {
        // */n * 0-23 * * 1-7 or  */n * 0-23 * * *
        state = {
            mode: 'intervalBetween',
            intervalBetween: {
                period: parseInt(options.seconds.split('/')[1], 10),
                unit: PERIODIC_TYPES.seconds,
                timeFrom: parseInt(options.hours.split('-')[0], 10),
                timeTo: parseInt(options.hours.split('-')[1], 10),
                weekdays: text2weekdays(options.dow),
            },
        };
    } else if (
        options.seconds === null &&
        options.minutes.includes('/') &&
        options.hours.includes('-') &&
        options.date === '*' &&
        options.months === '*' &&
        (options.dow === '*' || force)
    ) {
        // */n 0-23 * * 1-7 or  */n 0-23 * * *
        state = {
            mode: 'intervalBetween',
            intervalBetween: {
                period: parseInt(options.minutes.split('/')[1], 10),
                unit: PERIODIC_TYPES.minutes,
                timeFrom: parseInt(options.hours.split('-')[0], 10),
                timeTo: parseInt(options.hours.split('-')[1], 10),
                weekdays: text2weekdays(options.dow),
            },
        };
    } else if (
        options.seconds === null &&
        parseInt(options.minutes, 10).toString() === options.minutes &&
        parseInt(options.hours, 10).toString() === options.hours &&
        options.date === '*' &&
        options.months === '*' &&
        (options.dow === '*' || force)
    ) {
        // m h * * 1-7 or m h * * *
        state = {
            mode: 'specific',
            specific: {
                time: `${padding(parseInt(options.hours, 10))}:${padding(parseInt(options.minutes, 10))}`,
                weekdays: text2weekdays(options.dow),
            },
        };
    } else if (
        options.seconds === null &&
        parseInt(options.minutes, 10).toString() === options.minutes &&
        parseInt(options.hours, 10).toString() === options.hours &&
        parseInt(options.date, 10).toString() === options.date &&
        parseInt(options.months, 10).toString() === options.months &&
        (options.dow === '*' || force)
    ) {
        // m h d M *
        state = {
            mode: 'once',
            once: {
                time: `${padding(parseInt(options.hours, 10))}:${padding(parseInt(options.minutes, 10))}`,
                date: `${padding(parseInt(options.date, 10))}.${padding(parseInt(options.months, 10))}`,
            },
        };
    }

    return state;
}

export class SimpleCron extends React.Component<SimpleCronProps, SimpleCronState> {
    constructor(props: SimpleCronProps) {
        super(props);
        let cron =
            typeof props.cronExpression === 'string'
                ? props.cronExpression.replace(/^["']/, '').replace(/["']\n?$/, '')
                : '';
        if (cron[0] === '{') {
            cron = '';
        }
        const state = cron2state(cron || '* * * * *', true) || DEFAULT_STATE;

        this.state = {
            extended: false,
            cron: SimpleCron.state2cron(state as SimpleCronState),
            mode: 'interval',
            once: {
                time: '00:00',
                date: '',
            },
            interval: {
                period: 1,
                unit: PERIODIC_TYPES.minutes,
            },
            intervalBetween: {
                period: 1,
                unit: PERIODIC_TYPES.minutes,
                timeFrom: 0,
                timeTo: 23,
                weekdays: [0, 1, 2, 3, 4, 5, 6],
            },
            specific: {
                time: '00:00',
                weekdays: [0, 1, 2, 3, 4, 5, 6],
            },
        };
        Object.assign(this.state, state);

        if (this.state.cron !== props.cronExpression) {
            setTimeout(() => props.onChange && props.onChange(this.state.cron), 100);
        }
    }

    static periodArray2text(list: number[], max: number = 7): string {
        max = max || 7;
        if (list.length === max) {
            return '*';
        }
        const text = [];
        let start = null;
        let end = null;
        if (!list.length) {
            return '_';
        }
        for (let i = 0; i < list.length; i++) {
            if (start === null) {
                start = list[i];
                end = list[i];
            } else if (list[i - 1] + 1 === list[i]) {
                end = list[i];
            } else {
                if (start !== end) {
                    text.push(`${start}-${end}`);
                } else {
                    text.push(start);
                }
                start = list[i];
                end = list[i];
            }
        }
        if (start !== end) {
            text.push(`${start}-${end}`);
        } else {
            text.push(start);
        }
        return text.join(',');
    }

    static text2weekdays(text: string): number[] {
        return text2weekdays(text);
    }

    static state2cron(state: Partial<SimpleCronState>): string {
        let cron = '* * * * *';
        if (state.mode === 'interval') {
            const settings = state.interval || {
                period: 1,
                unit: PERIODIC_TYPES.minutes,
            };
            if (settings.period !== undefined && settings.period > 60) {
                settings.period = 60;
            }
            if (settings.period !== undefined && settings.period < 1) {
                settings.period = 1;
            }

            if (settings.minutes !== undefined && settings.minutes !== null && settings.minutes > 60) {
                settings.minutes = 60;
            }
            if (settings.minutes !== undefined && settings.minutes !== null && settings.minutes < 1) {
                settings.minutes = 1;
            }

            if (settings.hours !== undefined && settings.hours !== null && settings.hours > 24) {
                settings.hours = 24;
            }
            if (settings.hours !== undefined && settings.hours !== null && settings.hours < 1) {
                settings.hours = 1;
            }

            if (state.extended) {
                cron = `${settings.minutes !== undefined && settings.minutes !== null && settings.minutes > 1 ? `*/${settings.minutes}` : '*'} ${settings.hours !== undefined && settings.hours !== null && settings.hours > 1 ? `*/${settings.hours}` : '*'} * * *`;
            } else {
                switch (settings.unit) {
                    case PERIODIC_TYPES.seconds:
                        cron = `${settings.period > 1 ? `*/${settings.period}` : '*'} * * * * *`;
                        break;
                    case PERIODIC_TYPES.minutes:
                        cron = `${settings.period > 1 ? `*/${settings.period}` : '*'} * * * *`;
                        break;
                    default:
                        break;
                }
            }
        } else if (state.mode === 'intervalBetween') {
            const settings = state.intervalBetween || {
                period: 1,
                unit: PERIODIC_TYPES.minutes,
                timeFrom: 0,
                timeTo: 24,
                weekdays: [0, 1, 2, 3, 4, 5, 6],
            };
            let hours;
            settings.timeFrom = settings.timeFrom || 0;
            settings.timeTo = settings.timeTo === undefined ? 24 : settings.timeTo;
            if (settings.timeFrom !== 0 && settings.timeTo === 24) {
                settings.timeTo = 23;
            }
            if (settings.timeFrom === 0 && settings.timeTo === 24) {
                hours = '*';
            } else {
                hours = settings.timeFrom !== settings.timeTo ? `${settings.timeFrom}-${settings.timeTo}` : '*';
            }
            if (settings.period > 60) {
                settings.period = 60;
            }
            if (settings.period < 1) {
                settings.period = 1;
            }
            settings.unit = settings.unit || PERIODIC_TYPES.minutes;
            switch (settings.unit) {
                case PERIODIC_TYPES.seconds:
                    cron = `${settings.period > 1 ? `*/${settings.period}` : '*'} * ${hours} * * ${this.periodArray2text(settings.weekdays)}`;
                    break;
                case PERIODIC_TYPES.minutes:
                    cron = `${settings.period > 1 ? `*/${settings.period}` : '*'} ${hours} * * ${this.periodArray2text(settings.weekdays)}`;
                    break;
                default:
                    break;
            }
        } else if (state.mode === 'specific') {
            const settings = state.specific || {
                time: '00:00',
                weekdays: [0, 1, 2, 3, 4, 5, 6],
            };
            const parts = (settings.time || '00:00').split(':');
            let minutes = parseInt(parts[1], 10) || 0;
            if (minutes > 59) {
                minutes = 59;
            }
            if (minutes < 0) {
                minutes = 0;
            }
            let hours = parseInt(parts[0], 10) || 0;
            if (hours > 23) {
                hours = 59;
            }
            if (hours < 0) {
                hours = 0;
            }

            cron = `${minutes} ${hours} * * ${this.periodArray2text(settings.weekdays || [])}`;
        } else if (state.mode === 'once') {
            const settings = state.once || {
                time: '00:00',
                date: '',
            };
            if (!settings.date) {
                settings.date = `${new Date().getDate()}.${padding(new Date().getMonth() + 1)}`;
            }
            const parts = (settings.time || '00:00').split(':');
            const partsDate = settings.date.split('.');
            let minutes = parseInt(parts[1], 10) || 0;
            if (minutes > 59) {
                minutes = 59;
            }
            if (minutes < 0) {
                minutes = 0;
            }
            let hours = parseInt(parts[0], 10) || 0;
            if (hours > 23) {
                hours = 59;
            }
            if (hours < 0) {
                hours = 0;
            }
            let date = parseInt(partsDate[0], 10) || 1;
            if (date > 31) {
                date = 31;
            }
            if (date < 1) {
                hours = 1;
            }
            let month = parseInt(partsDate[1], 10) || 1;
            if (month > 12) {
                month = 12;
            }
            if (month < 1) {
                month = 1;
            }

            cron = `${minutes} ${hours} ${date} ${month} *`;
        }
        return cron;
    }

    recalcCron(): void {
        this.onChange(SimpleCron.state2cron(this.state));
    }

    getControlsWeekdaysElements(type: 'intervalBetween' | 'specific'): React.JSX.Element {
        const settings = type === 'intervalBetween' ? this.state.intervalBetween : this.state.specific;
        return (
            <div
                key="weekdays"
                style={{ paddingLeft: 8, width: 'calc(100% - 8px)', maxWidth: 600 }}
            >
                <h5>{I18n.t('ra_On weekdays')}</h5>
                {[1, 2, 3, 4, 5, 6, 0].map(day => (
                    <FormControlLabel
                        key={WEEKDAYS[day]}
                        control={
                            <Checkbox
                                checked={settings.weekdays.includes(day)}
                                onChange={e => {
                                    const _settings = JSON.parse(JSON.stringify(this.state[type]));
                                    const pos = _settings.weekdays.indexOf(day);
                                    if (e.target.checked) {
                                        if (pos === -1) {
                                            _settings.weekdays.push(day);
                                        }
                                    } else {
                                        if (pos !== -1) {
                                            _settings.weekdays.splice(pos, 1);
                                        }
                                    }
                                    _settings.weekdays.sort();
                                    if (type === 'intervalBetween') {
                                        this.setState({ intervalBetween: _settings }, () => this.recalcCron());
                                    } else {
                                        this.setState({ specific: _settings }, () => this.recalcCron());
                                    }
                                }}
                                value={day.toString()}
                            />
                        }
                        label={I18n.t(WEEKDAYS[day])}
                    />
                ))}
            </div>
        );
    }

    getControlsPeriodElements(type: 'interval' | 'intervalBetween'): React.JSX.Element {
        const settings = type === 'interval' ? this.state.interval : this.state.intervalBetween;

        if (this.state.extended) {
            return (
                <div
                    key="period"
                    style={{ paddingLeft: 8, display: 'inline-block' }}
                >
                    <h5 style={{ marginBottom: 5 }}>{I18n.t('sc_period')}</h5>
                    <TextField
                        variant="standard"
                        style={{ marginTop: 0, marginBottom: 0, verticalAlign: 'bottom' }}
                        key="value"
                        label={I18n.t('sc_minutes')}
                        value={settings.minutes}
                        onChange={e => {
                            const _settings = JSON.parse(JSON.stringify(this.state[type]));
                            _settings.minutes = parseInt(e.target.value, 10);
                            if (_settings.minutes < 1) {
                                _settings.minutes = 1;
                            }
                            if (type === 'interval') {
                                this.setState({ interval: _settings }, () => this.recalcCron());
                            } else {
                                this.setState({ intervalBetween: _settings }, () => this.recalcCron());
                            }
                        }}
                        slotProps={{
                            htmlInput: {
                                min: 1,
                                max: 60,
                            },
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        type="number"
                        margin="normal"
                    />
                    <TextField
                        variant="standard"
                        style={{ marginTop: 0, marginBottom: 0, verticalAlign: 'bottom' }}
                        key="value"
                        label={I18n.t('sc_hours')}
                        value={settings.hours}
                        onChange={e => {
                            const _settings = JSON.parse(JSON.stringify(this.state[type]));
                            _settings.hours = parseInt(e.target.value, 10);
                            if (_settings.hours < 1) {
                                _settings.hours = 1;
                            }
                            if (type === 'interval') {
                                this.setState({ interval: _settings }, () => this.recalcCron());
                            } else {
                                this.setState({ intervalBetween: _settings }, () => this.recalcCron());
                            }
                        }}
                        slotProps={{
                            htmlInput: {
                                min: 1,
                                max: 24,
                            },
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        type="number"
                        margin="normal"
                    />
                </div>
            );
        }

        return (
            <div
                key="period"
                style={{ paddingLeft: 8, display: 'inline-block' }}
            >
                <h5 style={{ marginBottom: 5 }}>{I18n.t('sc_period')}</h5>
                <TextField
                    variant="standard"
                    style={{ marginTop: 0, marginBottom: 0, verticalAlign: 'bottom' }}
                    key="value"
                    label={I18n.t('sc_every')}
                    value={settings.period}
                    onChange={e => {
                        const _settings = JSON.parse(JSON.stringify(this.state[type]));
                        _settings.period = parseInt(e.target.value, 10);
                        if (_settings.period < 1) {
                            _settings.period = 1;
                        }
                        if (type === 'interval') {
                            this.setState({ interval: _settings }, () => this.recalcCron());
                        } else {
                            this.setState({ intervalBetween: _settings }, () => this.recalcCron());
                        }
                    }}
                    slotProps={{
                        htmlInput: {
                            min: 1,
                            max: 60,
                        },
                        inputLabel: {
                            shrink: true,
                        },
                    }}
                    type="number"
                    margin="normal"
                />
                <Select
                    variant="standard"
                    style={{ verticalAlign: 'bottom' }}
                    value={settings.unit}
                    onChange={e => {
                        const _settings = JSON.parse(JSON.stringify(this.state[type]));
                        _settings.unit = e.target.value;
                        if (type === 'interval') {
                            this.setState({ interval: _settings }, () => this.recalcCron());
                        } else {
                            this.setState({ intervalBetween: _settings }, () => this.recalcCron());
                        }
                    }}
                >
                    <MenuItem value="seconds">{I18n.t('sc_seconds')}</MenuItem>)
                    <MenuItem value="minutes">{I18n.t('sc_minutes')}</MenuItem>)
                </Select>
            </div>
        );
    }

    getControlsTime(type: 'once' | 'specific'): React.JSX.Element {
        const settings = type === 'once' ? this.state.once : this.state.specific;
        return (
            <FormControl
                variant="standard"
                sx={{
                    ...styles.formControl,
                    '&.MuiFormControl-root': styles.formControlMarginRight,
                }}
            >
                <TextField
                    variant="standard"
                    key="at"
                    label={I18n.t('sc_time')}
                    value={settings.time}
                    type="time"
                    sx={(theme: Theme) => ({
                        '& input[type="time"]::-webkit-calendar-picker-indicator': {
                            filter: theme.palette.mode === 'dark' ? 'invert(80%)' : undefined,
                        },
                    })}
                    onChange={e => {
                        const _settings = JSON.parse(JSON.stringify(this.state[type]));
                        _settings.time = e.target.value;
                        if (type === 'once') {
                            this.setState({ once: _settings }, () => this.recalcCron());
                        } else {
                            this.setState({ specific: _settings }, () => this.recalcCron());
                        }
                    }}
                    slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                    }}
                    margin="normal"
                />
            </FormControl>
        );
    }

    getControlsDate(): React.JSX.Element {
        const settings = this.state.once;

        if (!settings.date) {
            const d = new Date();
            settings.date = `${d.getDate()}.${padding(d.getMonth() + 1)}`;
        }

        // <InputLabel htmlFor="formatted-text-mask-input">{I18n.t('sc_at')}</InputLabel>
        return (
            <FormControl
                variant="standard"
                style={styles.formControl}
            >
                <TextField
                    variant="standard"
                    key="date"
                    label={I18n.t('sc_date')}
                    value={settings.date}
                    type="text"
                    slotProps={{
                        htmlInput: {
                            style: styles.formControlPaddingTop,
                        },
                        inputLabel: {
                            shrink: true,
                        },
                    }}
                    onChange={e => {
                        const _settings = JSON.parse(JSON.stringify(this.state.once));
                        _settings.date = e.target.value;
                        this.setState({ once: _settings }, () => this.recalcCron());
                    }}
                    margin="normal"
                />
            </FormControl>
        );
    }

    getOnceElements(): React.JSX.Element {
        return (
            <div style={{ marginLeft: 8 }}>
                {this.getControlsTime('once')}
                {this.getControlsDate()}
            </div>
        );
    }

    getIntervalElements(): React.JSX.Element {
        return this.getControlsPeriodElements('interval');
    }

    getIntervalBetweenElements(): React.JSX.Element[] {
        const settings = this.state.intervalBetween;
        return [
            this.getControlsPeriodElements('intervalBetween'),
            <div
                key="between"
                style={{ paddingLeft: 8, display: 'inline-block', verticalAlign: 'top' }}
            >
                <h5 style={{ marginBottom: 5 }}>{I18n.t('sc_hours')}</h5>
                <FormControl
                    variant="standard"
                    style={styles.formControl}
                >
                    <InputLabel
                        shrink
                        htmlFor="age-label-placeholder"
                    >
                        {I18n.t('sc_from')}
                    </InputLabel>
                    <Select
                        variant="standard"
                        style={{ width: 100 }}
                        value={settings.timeFrom}
                        onChange={e => {
                            const _settings = JSON.parse(JSON.stringify(this.state.intervalBetween));
                            _settings.timeFrom = parseInt(e.target.value as string, 10);
                            if (_settings.timeTo === 24) {
                                _settings.timeTo = 23;
                            }
                            this.setState({ intervalBetween: _settings }, () => this.recalcCron());
                        }}
                    >
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(
                            hour => (
                                <MenuItem
                                    key={`B_${hour}`}
                                    value={hour}
                                >
                                    {`${padding(hour)}:00`}
                                </MenuItem>
                            ),
                        )}
                    </Select>
                </FormControl>
                <FormControl
                    variant="standard"
                    style={styles.formControl}
                >
                    <InputLabel
                        shrink
                        htmlFor="age-label-placeholder"
                    >
                        {I18n.t('sc_to')}
                    </InputLabel>
                    <Select
                        variant="standard"
                        style={{ width: 100 }}
                        value={settings.timeTo}
                        onChange={e => {
                            const _settings = JSON.parse(JSON.stringify(this.state.intervalBetween));
                            _settings.timeTo = parseInt(e.target.value as string, 10);
                            this.setState({ intervalBetween: _settings }, () => this.recalcCron());
                        }}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(
                            hour => (
                                <MenuItem
                                    key={`A_${hour}`}
                                    value={hour}
                                >
                                    {`${padding(hour)}:00`}
                                </MenuItem>
                            ),
                        )}
                        {!settings.timeFrom && <MenuItem value={24}>00:00</MenuItem>}
                    </Select>
                </FormControl>
            </div>,
            this.getControlsWeekdaysElements('intervalBetween'),
        ];
    }

    getSpecificTimeElements(): React.JSX.Element[] {
        return [
            <div
                key="time"
                style={{ marginLeft: 8 }}
            >
                {this.getControlsTime('specific')}
            </div>,
            this.getControlsWeekdaysElements('specific'),
        ];
    }

    onModeChange(mode: 'once' | 'interval' | 'intervalBetween' | 'specific'): void {
        if (mode !== this.state.mode) {
            this.setState({ mode }, () => this.recalcCron());
        }
    }

    onChange(cron: string): void {
        if (cron !== this.state.cron) {
            this.setState({ cron });
            this.props.onChange && this.props.onChange(cron);
        }
    }

    render(): React.JSX.Element {
        return (
            <div style={styles.mainDiv}>
                <div style={{ paddingLeft: 8, width: 'calc(100% - 8px)' }}>
                    <TextField
                        variant="standard"
                        style={{ width: '100%' }}
                        value={this.state.cron}
                        disabled
                        error={this.state.cron.includes('_')}
                    />
                </div>
                <div style={{ paddingLeft: 8, width: 'calc(100% - 8px)', height: 60 }}>
                    {this.state.cron.includes('_')
                        ? I18n.t('sc_invalid_cron')
                        : convertCronToText(this.state.cron, this.props.language || 'en')}
                </div>
                <div>
                    <FormControl
                        variant="standard"
                        style={{ ...styles.formControl, marginLeft: 8, marginTop: 8 }}
                    >
                        <InputLabel>{I18n.t('ra_Repeat')}</InputLabel>
                        <Select
                            variant="standard"
                            value={this.state.mode}
                            onChange={e => this.onModeChange(e.target.value as SimpleCronType)}
                            inputProps={{ name: 'mode', id: 'mode' }}
                        >
                            <MenuItem value="once">{I18n.t('sc_once')}</MenuItem>
                            <MenuItem value="interval">{I18n.t('sc_interval')}</MenuItem>
                            <MenuItem value="intervalBetween">{I18n.t('sc_intervalBetween')}</MenuItem>
                            <MenuItem value="specific">{I18n.t('sc_specific')}</MenuItem>
                        </Select>
                    </FormControl>
                </div>
                {this.state.mode === PERIODIC.once && this.getOnceElements()}
                {this.state.mode === 'interval' && this.getIntervalElements()}
                {this.state.mode === 'intervalBetween' && this.getIntervalBetweenElements()}
                {this.state.mode === 'specific' && this.getSpecificTimeElements()}
            </div>
        );
    }
}
