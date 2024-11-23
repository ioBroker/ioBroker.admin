import React, { Component, type JSX } from 'react';

import {
    Input,
    Radio,
    FormControlLabel,
    FormGroup,
    Checkbox,
    MenuItem,
    Select,
    TextField,
    Box,
    type Theme,
} from '@mui/material';

import { I18n } from '../i18n';
import type { IobTheme } from '../types';
import { Utils } from './Utils';

const styles: Record<string, any> = {
    hr: {
        border: 0,
        borderTop: '1px solid gray',
    },
    scrollWindow: {
        width: '100%',
        overflow: 'auto',
        height: 'calc(100% - 22px)',
    },
    rowDiv: {
        width: '100%',
    },
    modeDiv: {
        width: 200,
        display: 'inline-block',
        verticalAlign: 'top',
    },
    settingsDiv: {
        display: 'inline-block',
        verticalAlign: 'top',
    },
    inputTime: {
        width: 90,
        marginTop: 0,
        marginLeft: 5,
    },
    inputDate: {
        width: 140,
        marginTop: 0,
        marginLeft: 5,
    },
    inputEvery: {
        width: 40,
        marginLeft: 5,
        marginRight: 5,
    },
    inputRadio: {
        padding: '4px 12px',
        verticalAlign: 'top',
    },
    inputGroup: {
        maxWidth: 400,
        display: 'inline-block',
    },
    inputGroupElement: {
        width: 120,
    },
    inputDateDay: {
        width: 60,
    },
    inputDateDayCheck: {
        padding: 4,
    },
    inputSmallCheck: {
        padding: 0,
    },
    rowOnce: {},
    rowDays: (theme: IobTheme) => ({
        background: theme.palette.mode !== 'dark' ? '#ddeaff' : '#4b5057',
    }),
    rowDows: (theme: IobTheme) => ({
        background: theme.palette.mode !== 'dark' ? '#DDFFDD' : '#52646c',
    }),
    rowDates: (theme: IobTheme) => ({
        background: theme.palette.mode !== 'dark' ? '#DDDDFF' : '#747a86',
    }),
    rowWeeks: (theme: IobTheme) => ({
        background: theme.palette.mode !== 'dark' ? '#DDDDFF' : '#717680',
    }),
    rowMonths: (theme: IobTheme) => ({
        background: theme.palette.mode !== 'dark' ? '#DDFFFF' : '#1f5557',
    }),
    rowMonthsDates: (theme: IobTheme) => ({
        background: theme.palette.mode !== 'dark' ? '#EEFFFF' : '#3c5737',
        maxWidth: 600,
    }),
    rowYears: (theme: IobTheme) => ({
        background: theme.palette.mode !== 'dark' ? '#fbffdd' : '#574b33',
    }),
    rowDaysDows: (theme: IobTheme) => ({
        background: theme.palette.mode !== 'dark' ? '#EEEAFF' : '#573544',
        pl: '10px',
        pb: '10px',
    }),
    rowDowsDows: (theme: IobTheme) => ({
        background: theme.palette.mode !== 'dark' ? '#EEFFEE' : '#3d4c54',
        pl: '10px',
        pb: '10px',
    }),
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
const PERIODS = {
    minutes: 'minutes',
    hours: 'hours',
};
const ASTRO = [
    'sunrise',
    'sunriseEnd',
    'goldenHourEnd',
    'solarNoon',
    'goldenHour',
    'sunsetStart',
    'sunset',
    'dusk',
    'nauticalDusk',
    'night',
    'nightEnd',
    'nauticalDawn',
    'dawn',
    'nadir',
];

function padding(num: number): string {
    if (num < 10) {
        return `0${num}`;
    }
    return `${num}`;
}

export interface ScheduleConfig {
    time: {
        exactTime: boolean;
        start: string;
        end: string;
        mode: string;
        interval: number;
    };
    period: {
        once: string;
        days: number;
        dows: string;
        dates: string;
        weeks: number;
        months: string | number;
        years: number;
        yearMonth: number;
        yearDate: number;
    };
    valid: {
        from: string;
        to?: string;
    };
}

// interface TextTimeProps {
//     inputRef: React.RefObject<HTMLInputElement>;
//     placeholder?: string;
// }

// function TextTime(props: TextTimeProps) {
//     const { inputRef, ...other } = props;
//
//     return <MaskedInput
//         {...other}
//         ref={inputRef}
//         mask={[/[0-2]/, /[0-9]/, ':', /[0-5]/, /[0-9]/]}
//         placeholderChar={props.placeholder || '00:00'}
//         showMask
//     />;
// }

// function TextDate(props: TextTimeProps) {
//     const { inputRef, ...other } = props;
//
//     return <MaskedInput
//         {...other}
//         ref={inputRef}
//         mask={[/[0-3]/, /[0-9]/, '.', /[0-1]/, /[0-9]/, '.', '2', '0', /[0-9]/, /[0-9]/]}
//         placeholderChar={props.placeholder || '01.01.2020'}
//         showMask
//     />;
// }

const DEFAULT: ScheduleConfig = {
    time: {
        exactTime: false,

        start: '00:00',
        end: '23:59',

        mode: 'hours',
        interval: 1,
    },
    period: {
        once: '',
        days: 1,
        dows: '',
        dates: '',
        weeks: 0,
        months: '',

        years: 0,
        yearMonth: 0,
        yearDate: 0,
    },
    valid: {
        from: '',
        to: '',
    },
};

function string2USdate(date: string): string {
    const parts = date.split('.');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
}

interface ScheduleProps {
    schedule: string | ScheduleConfig;
    onChange: (schedule: string, desc?: string) => void;
    theme: IobTheme;
}

interface ScheduleState {
    schedule: ScheduleConfig;
    desc: string;
}

export class Schedule extends Component<ScheduleProps, ScheduleState> {
    private readonly refFrom: React.RefObject<HTMLInputElement>;

    private readonly refTo: React.RefObject<HTMLInputElement>;

    private readonly refOnce: React.RefObject<HTMLInputElement>;

    private timerOnce: ReturnType<typeof setTimeout> | null = null;

    private timerFrom: ReturnType<typeof setTimeout> | null = null;

    private timerTo: ReturnType<typeof setTimeout> | null = null;

    constructor(props: ScheduleProps) {
        super(props);
        let schedule: ScheduleConfig | undefined;
        if (this.props.schedule && typeof this.props.schedule === 'string' && this.props.schedule[0] === '{') {
            try {
                schedule = JSON.parse(this.props.schedule);
            } catch {
                // ignore
            }
        } else if (typeof this.props.schedule === 'object') {
            schedule = this.props.schedule;
        }

        if (!schedule || !Object.keys(schedule).length) {
            setTimeout(() => this.onChange(this.state.schedule, true), 200);
            schedule = DEFAULT;
        }
        schedule = { ...DEFAULT, ...schedule };
        schedule.valid.from = schedule.valid.from || Schedule.now2string();

        this.refFrom = React.createRef();
        this.refTo = React.createRef();
        this.refOnce = React.createRef();

        this.state = {
            schedule,
            desc: Schedule.state2text(schedule),
        };

        if (JSON.stringify(schedule) !== this.props.schedule) {
            setTimeout(() => this.props.onChange && this.props.onChange(JSON.stringify(schedule)), 100);
        }
    }

    onChange(schedule: ScheduleConfig, force?: boolean): void {
        const isDiff = JSON.stringify(schedule) !== JSON.stringify(this.state.schedule);
        if (force || isDiff) {
            isDiff && this.setState({ schedule, desc: Schedule.state2text(schedule) });
            const copy = JSON.parse(JSON.stringify(schedule));
            if (copy.period.once) {
                const once = copy.period.once;
                delete copy.period;
                copy.period = { once };
                delete copy.valid;
            } else if (copy.period.days) {
                const days = copy.period.days;
                const daysOfWeek = copy.period.dows;
                delete copy.period;
                copy.period = { days };
                if (daysOfWeek && daysOfWeek !== '[]') {
                    copy.period.dows = daysOfWeek;
                }
            } else if (copy.period.weeks) {
                const weeks = copy.period.weeks;
                const daysOfWeek = copy.period.dows;
                delete copy.period;
                copy.period = { weeks };
                if (daysOfWeek && daysOfWeek !== '[]') {
                    copy.period.dows = daysOfWeek;
                }
            } else if (copy.period.months) {
                const months = copy.period.months;
                const dates = copy.period.dates;
                delete copy.period;
                copy.period = { months };
                if (dates && dates !== '[]') {
                    copy.period.dates = dates;
                }
            } else if (copy.period.years) {
                const years = copy.period.years;
                const yearMonth = copy.period.yearMonth;
                const yearDate = copy.period.yearDate;
                delete copy.period;
                copy.period = { years, yearDate };
                if (yearMonth) {
                    copy.period.yearMonth = yearMonth;
                }
            }

            if (copy.time.exactTime) {
                delete copy.time.end;
                delete copy.time.mode;
                delete copy.time.interval;
            } else {
                delete copy.time.exactTime;
            }
            if (copy.valid) {
                if (!copy.valid.to) {
                    delete copy.valid.to;
                }
                if (
                    copy.period.days === 1 ||
                    copy.period.weeks === 1 ||
                    copy.period.months === 1 ||
                    copy.period.years === 1
                ) {
                    const from = Schedule.string2date(copy.valid.from);
                    const today = new Date();
                    today.setHours(0);
                    today.setMinutes(0);
                    today.setSeconds(0);
                    today.setMilliseconds(0);
                    if (from <= today) {
                        delete copy.valid.from;
                    }
                }
                if (!copy.valid.from && !copy.valid.to) {
                    delete copy.valid;
                }
            }

            this.props.onChange && this.props.onChange(JSON.stringify(copy), Schedule.state2text(schedule));
        }
    }

    static state2text(schedule: string | ScheduleConfig): string {
        if (typeof schedule === 'string') {
            try {
                schedule = JSON.parse(schedule) as ScheduleConfig;
            } catch {
                return '';
            }
        }

        const desc = [];
        const validFrom = Schedule.string2date(schedule.valid.from);
        if (schedule.period.once) {
            // once
            const once = Schedule.string2date(schedule.period.once);
            const now = new Date();
            now.setMilliseconds(0);
            now.setSeconds(0);
            now.setMinutes(0);
            now.setHours(0);

            //
            if (once < now) {
                // will be not executed anymore, because start is in the past
                return I18n.t('sch_desc_onceInPast');
            }
            // only once
            desc.push(I18n.t('sch_desc_once_on', schedule.period.once));
        } else if (schedule.period.days) {
            if (schedule.period.days === 1) {
                if (schedule.period.dows) {
                    const daysOfWeek = JSON.parse(schedule.period.dows);
                    if (daysOfWeek.length === 2 && daysOfWeek[0] === 0 && daysOfWeek[1] === 6) {
                        // on weekends
                        desc.push(I18n.t('sch_desc_onWeekends'));
                    } else if (
                        daysOfWeek.length === 5 &&
                        daysOfWeek[0] === 1 &&
                        daysOfWeek[1] === 2 &&
                        daysOfWeek[2] === 3 &&
                        daysOfWeek[3] === 4 &&
                        daysOfWeek[4] === 5
                    ) {
                        // on workdays
                        desc.push(I18n.t('sch_desc_onWorkdays'));
                    } else {
                        const tDows = daysOfWeek.map((day: number) => I18n.t(WEEKDAYS[day]));
                        if (tDows.length === 1) {
                            // on Monday
                            desc.push(I18n.t('sch_desc_onWeekday', tDows[0]));
                        } else if (tDows.length === 7) {
                            // on every day
                            desc.push(I18n.t('sch_desc_everyDay'));
                        } else {
                            const last = tDows.pop();
                            // on Monday and Sunday
                            desc.push(I18n.t('sch_desc_onWeekdays', tDows.join(', '), last));
                        }
                    }
                } else {
                    desc.push(I18n.t('sch_desc_everyDay'));
                }
            } else {
                desc.push(I18n.t('sch_desc_everyNDay', schedule.period.days.toString()));
            }
        } else if (schedule.period.weeks) {
            if (schedule.period.weeks === 1) {
                desc.push(I18n.t('sch_desc_everyWeek'));
            } else {
                desc.push(I18n.t('sch_desc_everyNWeeks', schedule.period.weeks.toString()));
            }

            if (schedule.period.dows) {
                const daysOfWeek = JSON.parse(schedule.period.dows);
                if (daysOfWeek.length === 2 && daysOfWeek[0] === 0 && daysOfWeek[1] === 6) {
                    // on weekends
                    desc.push(I18n.t('sch_desc_onWeekends'));
                } else if (
                    daysOfWeek.length === 5 &&
                    daysOfWeek[0] === 1 &&
                    daysOfWeek[1] === 2 &&
                    daysOfWeek[2] === 3 &&
                    daysOfWeek[3] === 4 &&
                    daysOfWeek[4] === 5
                ) {
                    // on workdays
                    desc.push(I18n.t('sch_desc_onWorkdays'));
                } else {
                    const tDows = daysOfWeek.map((day: number) => I18n.t(WEEKDAYS[day]));
                    if (tDows.length === 1) {
                        // on Monday
                        desc.push(I18n.t('sch_desc_onWeekday', tDows[0]));
                    } else if (tDows.length === 7) {
                        // on every day
                        desc.push(I18n.t('sch_desc_everyDay'));
                    } else {
                        const last = tDows.pop();
                        // on Monday and Sunday
                        desc.push(I18n.t('sch_desc_onWeekdays', tDows.join(', '), last));
                    }
                }
            } else {
                return I18n.t('sch_desc_never');
            }
        } else if (schedule.period.months) {
            if (schedule.period.dates) {
                const dates = JSON.parse(schedule.period.dates);
                if (dates.length === 1) {
                    // in 1 of month
                    desc.push(I18n.t('sch_desc_onDate', dates[0]));
                } else if (dates.length === 31) {
                    desc.push(I18n.t('sch_desc_onEveryDate'));
                } else if (!dates.length) {
                    return I18n.t('sch_desc_never');
                } else {
                    const last = dates.pop();
                    // in 1 and 4 of month
                    desc.push(I18n.t('sch_desc_onDates', dates.join(', '), last));
                }
            } else {
                desc.push(I18n.t('sch_desc_onEveryDate'));
            }

            if (schedule.period.months === 1) {
                desc.push(I18n.t('sch_desc_everyMonth'));
            } else if (typeof schedule.period.months === 'number') {
                desc.push(I18n.t('sch_desc_everyNMonths', schedule.period.months.toString()));
            } else {
                const months = JSON.parse(schedule.period.months);
                const tMonths = months.map((month: number) => I18n.t(MONTHS[month - 1]));
                if (!tMonths.length) {
                    // in January
                    return I18n.t('sch_desc_never');
                }
                if (tMonths.length === 1) {
                    // in January
                    desc.push(I18n.t('sch_desc_onMonth', tMonths[0]));
                } else if (tMonths.length === 12) {
                    // every month
                    desc.push(I18n.t('sch_desc_everyMonth'));
                } else {
                    const last = tMonths.pop();
                    // in January and May
                    desc.push(I18n.t('sch_desc_onMonths', tMonths.join(', '), last));
                }
            }
        } else if (schedule.period.years) {
            if (schedule.period.years === 1) {
                desc.push(I18n.t('sch_desc_everyYear'));
            } else {
                desc.push(I18n.t('sch_desc_everyNYears', schedule.period.years.toString()));
            }
            desc.push(
                I18n.t(
                    'sch_desc_onDate',
                    schedule.period.yearDate.toString(),
                    schedule.period.yearMonth
                        ? I18n.t(MONTHS[schedule.period.yearMonth - 1])
                        : I18n.t('sch_desc_everyMonth'),
                ),
            );
        }

        // time
        if (schedule.time.exactTime) {
            if (ASTRO.includes(schedule.time.start)) {
                // at sunset
                desc.push(I18n.t('sch_desc_atTime', I18n.t(`sch_astro_${schedule.time.start}`)));
            } else {
                // at HH:MM
                desc.push(I18n.t('sch_desc_atTime', schedule.time.start));
            }
        } else {
            if (schedule.time.mode === PERIODS.minutes) {
                if (schedule.time.interval === 1) {
                    // every minute
                    desc.push(I18n.t('sch_desc_everyMinute'));
                } else {
                    // every N minute
                    desc.push(I18n.t('sch_desc_everyNMinutes', schedule.time.interval.toString()));
                }
            } else if (schedule.time.interval === 1) {
                // every minute
                desc.push(I18n.t('sch_desc_everyHour'));
            } else {
                // every N minute
                desc.push(I18n.t('sch_desc_everyNHours', schedule.time.interval.toString()));
            }

            const start =
                ASTRO.indexOf(schedule.time.start) !== -1
                    ? I18n.t(`sch_astro_${schedule.time.start}`)
                    : schedule.time.start;
            const end =
                ASTRO.indexOf(schedule.time.end) !== -1 ? I18n.t(`sch_astro_${schedule.time.end}`) : schedule.time.end;
            if (start !== '00:00' || (end !== '24:00' && end !== '23:59')) {
                // from HH:mm to HH:mm
                desc.push(I18n.t('sch_desc_intervalFromTo', start, end));
            }
        }

        if (!schedule.period.once) {
            // valid
            if (validFrom.getTime() > Date.now() && schedule.valid.to) {
                // from XXX to XXXX
                desc.push(I18n.t('sch_desc_validFromTo', schedule.valid.from, schedule.valid.to));
            } else if (validFrom.getTime() > Date.now()) {
                // from XXXX
                desc.push(I18n.t('sch_desc_validFrom', schedule.valid.from));
            } else if (schedule.valid.to) {
                // till XXXX
                desc.push(I18n.t('sch_desc_validTo', schedule.valid.to));
            }
        }
        return desc.join(' ');
    }

    getTimePeriodElements(): JSX.Element {
        const schedule = this.state.schedule;
        let wholeDay = false;
        let day = false;
        let night = false;
        let fromTo = true;
        if (schedule.time.start === '00:00' && schedule.time.end === '24:00') {
            wholeDay = true;
            fromTo = false;
        } else if (schedule.time.start === 'sunrise') {
            day = true;
            fromTo = false;
        } else if (schedule.time.start === 'sunset') {
            night = true;
            fromTo = false;
        }

        return (
            <div
                key="timePeriod"
                style={styles.rowDiv}
            >
                <div style={styles.modeDiv}>
                    <FormControlLabel
                        control={
                            <Radio
                                style={styles.inputRadio}
                                checked={!schedule.time.exactTime}
                                onClick={() => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    _schedule.time.exactTime = false;
                                    this.onChange(_schedule);
                                }}
                            />
                        }
                        label={I18n.t('sch_intervalTime')}
                    />
                </div>
                <div style={styles.settingsDiv}>
                    <div style={styles.settingsDiv}>
                        {!schedule.time.exactTime && (
                            <div>
                                <div>
                                    <FormControlLabel
                                        control={
                                            <Radio
                                                style={styles.inputRadio}
                                                checked={!!fromTo}
                                                onClick={() => {
                                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                                    _schedule.time.start = '00:00';
                                                    _schedule.time.end = '23:59';
                                                    this.onChange(_schedule);
                                                }}
                                            />
                                        }
                                        label={!fromTo ? I18n.t('sch_fromTo') : ''}
                                    />
                                    {fromTo && [
                                        <TextField
                                            variant="standard"
                                            style={{ ...styles.inputTime, marginRight: 10 }}
                                            key="exactTimeFrom"
                                            type="time"
                                            sx={(theme: Theme) => ({
                                                '& input[type="time"]::-webkit-calendar-picker-indicator': {
                                                    filter: theme.palette.mode === 'dark' ? 'invert(80%)' : undefined,
                                                },
                                            })}
                                            value={this.state.schedule.time.start}
                                            // InputProps={{inputComponent: TextTime}}
                                            onChange={e => {
                                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                                _schedule.time.start = e.target.value;
                                                this.onChange(_schedule);
                                            }}
                                            slotProps={{
                                                inputLabel: { shrink: true },
                                            }}
                                            label={I18n.t('sch_from')}
                                            margin="normal"
                                        />,
                                        <TextField
                                            variant="standard"
                                            style={styles.inputTime}
                                            key="exactTimeTo"
                                            type="time"
                                            sx={(theme: Theme) => ({
                                                '& input[type="time"]::-webkit-calendar-picker-indicator': {
                                                    filter: theme.palette.mode === 'dark' ? 'invert(80%)' : undefined,
                                                },
                                            })}
                                            value={this.state.schedule.time.end}
                                            // InputProps={{inputComponent: TextTime}}
                                            onChange={e => {
                                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                                _schedule.time.end = e.target.value;
                                                this.onChange(_schedule);
                                            }}
                                            slotProps={{
                                                inputLabel: { shrink: true },
                                            }}
                                            label={I18n.t('sch_to')}
                                            margin="normal"
                                        />,
                                    ]}
                                </div>
                            </div>
                        )}

                        {!schedule.time.exactTime && (
                            <div>
                                <FormControlLabel
                                    control={
                                        <Radio
                                            style={styles.inputRadio}
                                            checked={!!wholeDay}
                                            onClick={() => {
                                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                                _schedule.time.start = '00:00';
                                                _schedule.time.end = '24:00';
                                                this.onChange(_schedule);
                                            }}
                                        />
                                    }
                                    label={I18n.t('sch_wholeDay')}
                                />
                            </div>
                        )}

                        {!schedule.time.exactTime && (
                            <div>
                                <FormControlLabel
                                    control={
                                        <Radio
                                            style={styles.inputRadio}
                                            checked={!!day}
                                            onClick={() => {
                                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                                _schedule.time.start = 'sunrise';
                                                _schedule.time.end = 'sunset';
                                                this.onChange(_schedule);
                                            }}
                                        />
                                    }
                                    label={I18n.t('sch_astroDay')}
                                />
                            </div>
                        )}

                        {!schedule.time.exactTime && (
                            <div>
                                <FormControlLabel
                                    control={
                                        <Radio
                                            style={styles.inputRadio}
                                            checked={!!night}
                                            onClick={() => {
                                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                                _schedule.time.start = 'sunset';
                                                _schedule.time.end = 'sunrise';
                                                this.onChange(_schedule);
                                            }}
                                        />
                                    }
                                    label={I18n.t('sch_astroNight')}
                                />
                            </div>
                        )}
                    </div>
                    {!schedule.time.exactTime && this.getPeriodSettingsMinutes(fromTo)}
                </div>
            </div>
        );
    }

    getTimeExactElements(): JSX.Element {
        const isAstro = ASTRO.includes(this.state.schedule.time.start);

        return (
            <div
                key="timeExact"
                style={styles.rowDiv}
            >
                <div style={styles.modeDiv}>
                    <FormControlLabel
                        control={
                            <Radio
                                style={styles.inputRadio}
                                checked={!!this.state.schedule.time.exactTime}
                                onClick={() => {
                                    const schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    schedule.time.exactTime = true;
                                    this.onChange(schedule);
                                }}
                            />
                        }
                        label={I18n.t('sch_exactTime')}
                    />
                </div>
                {this.state.schedule.time.exactTime && (
                    <Select
                        variant="standard"
                        value={isAstro ? this.state.schedule.time.start : '00:00'}
                        onChange={e => {
                            const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                            _schedule.time.start = e.target.value;
                            this.onChange(_schedule);
                        }}
                    >
                        <MenuItem
                            key="specific"
                            value="00:00"
                        >
                            {I18n.t('sch_specificTime')}
                        </MenuItem>
                        {ASTRO.map(event => (
                            <MenuItem
                                key={event}
                                value={event}
                            >
                                {I18n.t(`sch_astro_${event}`)}
                            </MenuItem>
                        ))}
                    </Select>
                )}
                {this.state.schedule.time.exactTime && !isAstro && (
                    <div style={styles.settingsDiv}>
                        <TextField
                            variant="standard"
                            style={styles.inputTime}
                            key="exactTimeValue"
                            value={this.state.schedule.time.start}
                            type="time"
                            sx={(theme: Theme) => ({
                                '& input[type="time"]::-webkit-calendar-picker-indicator': {
                                    filter: theme.palette.mode === 'dark' ? 'invert(80%)' : undefined,
                                },
                            })}
                            onChange={e => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.time.start = e.target.value;
                                this.onChange(_schedule);
                            }}
                            slotProps={{
                                inputLabel: { shrink: true },
                            }}
                            margin="normal"
                        />
                    </div>
                )}
            </div>
        );
    }

    static getDivider(): JSX.Element {
        return <hr style={styles.hr} />;
    }

    getPeriodModes(): JSX.Element[] {
        const schedule = this.state.schedule;
        const isOnce =
            !schedule.period.dows &&
            !schedule.period.months &&
            !schedule.period.dates &&
            !schedule.period.years &&
            !schedule.period.days &&
            !schedule.period.weeks;

        if (isOnce && !schedule.period.once) {
            schedule.period.once = Schedule.now2string(true);
        }

        return [
            // ----- once ---
            <div
                key="once"
                style={{ ...styles.rowDiv, ...styles.rowOnce }}
            >
                <div style={styles.modeDiv}>
                    <FormControlLabel
                        control={
                            <Radio
                                style={styles.inputRadio}
                                checked={!!isOnce}
                                onClick={() => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    _schedule.period.once = _schedule.period.once || Schedule.now2string(true);
                                    _schedule.period.dows = '';
                                    _schedule.period.months = '';
                                    _schedule.period.dates = '';
                                    _schedule.period.years = 0;
                                    _schedule.period.yearDate = 0;
                                    _schedule.period.yearMonth = 0;
                                    _schedule.period.weeks = 0;
                                    _schedule.period.days = 0;
                                    this.onChange(_schedule);
                                }}
                            />
                        }
                        label={I18n.t('sch_periodOnce')}
                    />
                </div>
                {isOnce && (
                    <div style={styles.settingsDiv}>
                        <TextField
                            variant="standard"
                            style={styles.inputDate}
                            type="date"
                            ref={this.refOnce}
                            key="exactDateAt"
                            defaultValue={string2USdate(schedule.period.once)}
                            // InputProps={{inputComponent: TextTime}}
                            onChange={e => {
                                this.timerOnce && clearTimeout(this.timerOnce);
                                this.timerOnce = null;

                                if (this.refOnce.current) {
                                    this.refOnce.current.style.background = '#ff000030';
                                }
                                this.timerOnce = setTimeout(
                                    value => {
                                        this.timerOnce = null;
                                        if (this.refOnce.current) {
                                            this.refOnce.current.style.background = '';
                                        }
                                        const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                        const date = Schedule.string2date(value);
                                        if (date.toString() !== 'Invalid Date') {
                                            _schedule.period.once = `${padding(date.getDate())}.${padding(date.getMonth() + 1)}.${date.getFullYear()}`;
                                            this.onChange(_schedule);
                                        }
                                    },
                                    1500,
                                    e.target.value,
                                );
                            }}
                            slotProps={{
                                inputLabel: { shrink: true },
                            }}
                            label={I18n.t('sch_at')}
                            margin="normal"
                        />
                    </div>
                )}
            </div>,

            // ----- days ---
            <Box
                component="div"
                key="days"
                sx={Utils.getStyle(this.props.theme, styles.rowDiv, styles.rowDays)}
            >
                <div style={styles.modeDiv}>
                    <FormControlLabel
                        control={
                            <Radio
                                style={styles.inputRadio}
                                checked={!!schedule.period.days}
                                onClick={() => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    _schedule.period.days = 1;
                                    _schedule.period.dows = '';
                                    _schedule.period.months = '';
                                    _schedule.period.dates = '';
                                    _schedule.period.years = 0;
                                    _schedule.period.yearDate = 0;
                                    _schedule.period.yearMonth = 0;
                                    _schedule.period.weeks = 0;
                                    _schedule.period.once = '';
                                    this.onChange(_schedule);
                                }}
                            />
                        }
                        label={I18n.t('sch_periodDaily')}
                    />
                </div>
                <div style={styles.settingsDiv}>
                    {this.getPeriodSettingsDaily()}
                    {schedule.period.days ? this.getPeriodSettingsWeekdays() : null}
                </div>
            </Box>,

            // ----- days of weeks ---
            /*
            !schedule.period.days && (
                <div key="dows" style={styles.rowDiv + ' ' + styles.rowDows}>
                    <div style={styles.modeDiv}>
                        <FormControlLabel control={<Radio style={styles.inputRadio} checked={!!schedule.period.dows} onClick={() => {
                            const schedule = JSON.parse(JSON.stringify(this.state.schedule));
                            schedule.period.dows = schedule.period.dows ? '' : '[0,1,2,3,4,5,6]';
                            this.onChange(schedule);
                        }}/>}
                        label={I18n.t('sch_periodWeekdays')} />
                    </div>
                    <div style={styles.settingsDiv}>
                        {this.getPeriodSettingsWeekdays()}
                    </div>
                </div>,
            */
            // ----- weeks ---
            <Box
                component="div"
                key="weeks"
                sx={Utils.getStyle(this.props.theme, styles.rowDiv, styles.rowDows)}
            >
                <div style={styles.modeDiv}>
                    <FormControlLabel
                        control={
                            <Radio
                                style={styles.inputRadio}
                                checked={!!schedule.period.weeks}
                                onClick={() => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    _schedule.period.weeks = schedule.period.weeks ? 0 : 1;
                                    _schedule.period.dows = schedule.period.dows || '[0]';
                                    _schedule.period.months = '';
                                    _schedule.period.dates = '';
                                    _schedule.period.years = 0;
                                    _schedule.period.yearDate = 0;
                                    _schedule.period.yearMonth = 0;
                                    _schedule.period.days = 0;
                                    _schedule.period.once = '';
                                    this.onChange(_schedule);
                                }}
                            />
                        }
                        label={I18n.t('sch_periodWeekly')}
                    />
                </div>
                <Box
                    component="div"
                    style={styles.settingsDiv}
                >
                    <div style={styles.settingsDiv}>{this.getPeriodSettingsWeekly()}</div>
                    <Box
                        component="div"
                        sx={Utils.getStyle(this.props.theme, styles.settingsDiv, styles.rowDowsDows)}
                    >
                        {this.state.schedule.period.weeks ? this.getPeriodSettingsWeekdays() : null}
                    </Box>
                </Box>
            </Box>,

            // ----- months ---
            <Box
                component="div"
                key="months"
                sx={Utils.getStyle(this.props.theme, styles.rowDiv, styles.rowMonths)}
            >
                <div style={styles.modeDiv}>
                    <FormControlLabel
                        control={
                            <Radio
                                style={styles.inputRadio}
                                checked={!!schedule.period.months}
                                onClick={() => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    _schedule.period.months = 1;
                                    _schedule.period.dows = '';
                                    _schedule.period.dates = '';
                                    _schedule.period.years = 0;
                                    _schedule.period.yearDate = 0;
                                    _schedule.period.yearMonth = 0;
                                    _schedule.period.weeks = 0;
                                    _schedule.period.days = 0;
                                    _schedule.period.once = '';
                                    this.onChange(_schedule);
                                }}
                            />
                        }
                        label={I18n.t('sch_periodMonthly')}
                    />
                </div>
                <div style={styles.settingsDiv}>
                    {this.getPeriodSettingsMonthly()}
                    {schedule.period.months ? (
                        <Box>
                            <Box
                                component="div"
                                sx={Utils.getStyle(this.props.theme, styles.settingsDiv, styles.rowMonthsDates)}
                            >
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            style={styles.inputRadio}
                                            checked={!!schedule.period.dates}
                                            onClick={() => {
                                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                                _schedule.period.months = _schedule.period.months || 1;
                                                const dates = [];
                                                for (let i = 1; i <= 31; i++) {
                                                    dates.push(i);
                                                }
                                                _schedule.period.dates =
                                                    _schedule.period.dates || JSON.stringify(dates);
                                                _schedule.period.dows = '';
                                                _schedule.period.years = 0;
                                                _schedule.period.yearDate = 0;
                                                _schedule.period.yearMonth = 0;
                                                _schedule.period.weeks = 0;
                                                _schedule.period.days = 0;
                                                _schedule.period.once = '';

                                                this.onChange(_schedule);
                                            }}
                                        />
                                    }
                                    label={I18n.t('sch_periodDates')}
                                />
                            </Box>
                            <Box
                                component="div"
                                sx={Utils.getStyle(this.props.theme, styles.settingsDiv, styles.rowMonthsDates)}
                            >
                                {this.getPeriodSettingsDates()}
                            </Box>
                        </Box>
                    ) : null}
                </div>
            </Box>,

            // ----- years ---
            <Box
                component="div"
                key="years"
                sx={Utils.getStyle(this.props.theme, styles.rowDiv, styles.rowYears)}
            >
                <div style={styles.modeDiv}>
                    <FormControlLabel
                        control={
                            <Radio
                                style={styles.inputRadio}
                                checked={!!schedule.period.years}
                                onClick={() => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    _schedule.period.years = 1;
                                    _schedule.period.yearDate = 1;
                                    _schedule.period.yearMonth = 1;
                                    _schedule.period.dows = '';
                                    _schedule.period.months = 0;
                                    _schedule.period.dates = '';
                                    _schedule.period.weeks = 0;
                                    _schedule.period.days = 0;
                                    _schedule.period.once = '';
                                    this.onChange(_schedule);
                                }}
                            />
                        }
                        label={I18n.t('sch_periodYearly')}
                    />
                </div>
                <div style={styles.settingsDiv}>
                    <div style={styles.settingsDiv}>{this.getPeriodSettingsYearly()}</div>
                    {!!schedule.period.years && (
                        <div style={styles.settingsDiv}>
                            <span>{I18n.t('sch_on')}</span>
                            <Input
                                key="input"
                                value={this.state.schedule.period.yearDate}
                                style={styles.inputEvery}
                                type="number"
                                inputProps={{ min: 1, max: 31 }}
                                onChange={e => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    _schedule.period.yearDate = parseInt(e.target.value, 10);
                                    if (_schedule.period.yearDate < 1) {
                                        _schedule.period.yearDate = 31;
                                    }
                                    if (_schedule.period.yearDate > 31) {
                                        _schedule.period.yearDate = 1;
                                    }
                                    this.onChange(_schedule);
                                }}
                            />
                            <Select
                                variant="standard"
                                value={schedule.period.yearMonth}
                                onChange={e => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    _schedule.period.yearMonth = e.target.value;
                                    this.onChange(_schedule);
                                }}
                            >
                                <MenuItem
                                    key="every"
                                    value={0}
                                >
                                    {I18n.t('sch_yearEveryMonth')}
                                </MenuItem>
                                {MONTHS.map((month, i) => (
                                    <MenuItem
                                        key={month}
                                        value={i + 1}
                                    >
                                        {I18n.t(month)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </div>
                    )}
                </div>
            </Box>,
        ];
    }

    getPeriodSettingsMinutes(fromTo: boolean): JSX.Element {
        return (
            <div style={{ display: 'inline-block', marginTop: fromTo ? 15 : 'inherit' }}>
                <label style={{ marginLeft: 4, marginRight: 4 }}>{I18n.t('sch_every')}</label>
                <Input
                    value={this.state.schedule.time.interval}
                    style={{
                        ...styles.inputEvery,
                        verticalAlign: 'bottom',
                    }}
                    type="number"
                    inputProps={{ min: 1 }}
                    onChange={e => {
                        const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                        _schedule.time.interval = parseInt(e.target.value, 10);
                        this.onChange(_schedule);
                    }}
                />
                <Select
                    variant="standard"
                    value={this.state.schedule.time.mode}
                    onChange={e => {
                        const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                        _schedule.time.mode = e.target.value;
                        this.onChange(_schedule);
                    }}
                >
                    <MenuItem value={PERIODS.minutes}>{I18n.t('sch_periodMinutes')}</MenuItem>
                    <MenuItem value={PERIODS.hours}>{I18n.t('sch_periodHours')}</MenuItem>
                </Select>
            </div>
        );
    }

    getPeriodSettingsWeekdays(): JSX.Element[] {
        // || this.state.schedule.period.dows === '[1, 2, 3, 4, 5]' || this.state.schedule.period.dows === '[0, 6]'
        const schedule = this.state.schedule;
        const isSpecific =
            schedule.period.dows && schedule.period.dows !== '[1, 2, 3, 4, 5]' && schedule.period.dows !== '[0, 6]';
        return [
            <div key="workdays">
                <FormControlLabel
                    control={
                        <Radio
                            style={styles.inputRadio}
                            checked={schedule.period.dows === '[1, 2, 3, 4, 5]'}
                            onClick={() => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.dows = '[1, 2, 3, 4, 5]';
                                if (_schedule.period.days) {
                                    _schedule.period.days = 1;
                                }
                                this.onChange(_schedule);
                            }}
                        />
                    }
                    label={I18n.t('sch_periodWorkdays')}
                />
            </div>,

            <div key="weekend">
                <FormControlLabel
                    control={
                        <Radio
                            style={styles.inputRadio}
                            checked={schedule.period.dows === '[0, 6]'}
                            onClick={() => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.dows = '[0, 6]';
                                if (_schedule.period.days) {
                                    _schedule.period.days = 1;
                                }
                                this.onChange(_schedule);
                            }}
                        />
                    }
                    label={I18n.t('sch_periodWeekend')}
                />
            </div>,

            <div
                key="specific"
                style={{ verticalAlign: 'top' }}
            >
                <FormControlLabel
                    style={{ verticalAlign: 'top' }}
                    control={
                        <Radio
                            style={styles.inputRadio}
                            checked={!!isSpecific}
                            onClick={() => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.dows = '[0, 1, 2, 3, 4, 5, 6]';
                                if (_schedule.period.days) {
                                    _schedule.period.days = 1;
                                }
                                this.onChange(_schedule);
                            }}
                        />
                    }
                    label={I18n.t('sch_periodWeekdays')}
                />
                {isSpecific && (schedule.period.days === 1 || schedule.period.weeks) && (
                    <FormGroup
                        row
                        style={{ ...styles.inputGroup, width: 150 }}
                    >
                        {[1, 2, 3, 4, 5, 6, 0].map(i => (
                            <FormControlLabel
                                key={`specific_${i}`}
                                style={styles.inputGroupElement}
                                control={
                                    <Checkbox
                                        style={styles.inputSmallCheck}
                                        checked={schedule.period.dows.includes(i.toString())}
                                        onChange={e => {
                                            const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                            let daysOfWeek: number[];
                                            try {
                                                daysOfWeek = JSON.parse(_schedule.period.dows);
                                            } catch {
                                                daysOfWeek = [];
                                            }
                                            if (e.target.checked && !daysOfWeek.includes(i)) {
                                                daysOfWeek.push(i);
                                            } else if (!e.target.checked && daysOfWeek.includes(i)) {
                                                daysOfWeek.splice(daysOfWeek.indexOf(i), 1);
                                            }
                                            daysOfWeek.sort((a: number, b: number) => a - b);
                                            _schedule.period.dows = JSON.stringify(daysOfWeek);
                                            if (_schedule.period.days) {
                                                _schedule.period.days = 1;
                                            }
                                            this.onChange(_schedule);
                                        }}
                                    />
                                }
                                label={I18n.t(WEEKDAYS[i])}
                            />
                        ))}
                    </FormGroup>
                )}
            </div>,
        ];
    }

    getPeriodSettingsDaily(): JSX.Element[] | null {
        if (!this.state.schedule.period.days) {
            return null;
        }
        const schedule = this.state.schedule;
        return [
            <div key="every_day">
                <FormControlLabel
                    control={
                        <Radio
                            style={styles.inputRadio}
                            checked={schedule.period.days === 1 && !schedule.period.dows}
                            onClick={() => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.days = 1;
                                _schedule.period.dows = '';
                                this.onChange(_schedule);
                            }}
                        />
                    }
                    label={I18n.t('sch_periodEveryDay')}
                />
            </div>,
            <div key="everyN_day">
                <FormControlLabel
                    control={
                        <Radio
                            style={styles.inputRadio}
                            checked={schedule.period.days > 1}
                            onClick={() => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.days = 2;
                                _schedule.period.dows = '';
                                this.onChange(_schedule);
                            }}
                        />
                    }
                    label={I18n.t('sch_periodEvery')}
                />
                {schedule.period.days > 1 && [
                    <Input
                        key="input"
                        value={this.state.schedule.period.days}
                        style={styles.inputEvery}
                        type="number"
                        inputProps={{ min: 2 }}
                        onChange={e => {
                            const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                            _schedule.period.days = parseInt(e.target.value, 10);
                            _schedule.period.dows = '';
                            this.onChange(_schedule);
                        }}
                    />,
                    <span
                        key="span"
                        style={{ paddingRight: 10 }}
                    >
                        {I18n.t('sch_periodDay')}
                    </span>,
                ]}
            </div>,
        ];
    }

    getPeriodSettingsWeekly(): JSX.Element[] | null {
        if (!this.state.schedule.period.weeks) {
            return null;
        }
        const schedule = this.state.schedule;
        return [
            <div
                key="radios"
                style={{ display: 'inline-block', verticalAlign: 'top' }}
            >
                <div>
                    <FormControlLabel
                        control={
                            <Radio
                                style={styles.inputRadio}
                                checked={schedule.period.weeks === 1}
                                onClick={() => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    _schedule.period.weeks = 1;
                                    this.onChange(_schedule);
                                }}
                            />
                        }
                        label={I18n.t('sch_periodEveryWeek')}
                    />
                </div>
                <div>
                    <FormControlLabel
                        control={
                            <Radio
                                style={styles.inputRadio}
                                checked={schedule.period.weeks > 1}
                                onClick={() => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    _schedule.period.weeks = 2;
                                    this.onChange(_schedule);
                                }}
                            />
                        }
                        label={I18n.t('sch_periodEvery')}
                    />
                    {schedule.period.weeks > 1 && [
                        <Input
                            key="input"
                            value={this.state.schedule.period.weeks}
                            style={styles.inputEvery}
                            type="number"
                            inputProps={{ min: 2 }}
                            onChange={e => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.weeks = parseInt(e.target.value, 10);
                                this.onChange(_schedule);
                            }}
                        />,
                        <span key="text">{I18n.t('sch_periodWeek')}</span>,
                    ]}
                </div>
            </div>,
        ];
    }

    getPeriodSettingsDates(): JSX.Element | null {
        if (!this.state.schedule.period.dates) {
            return null;
        }
        const schedule = this.state.schedule;

        const dates = [];
        for (let i = 1; i <= 31; i++) {
            dates.push(i);
        }

        const parsedDates = JSON.parse(schedule.period.dates);

        return (
            <FormGroup
                row
                style={{ ...styles.inputGroup, maxWidth: 620 }}
            >
                <FormControlLabel
                    style={styles.inputDateDay}
                    control={
                        <Checkbox
                            style={styles.inputDateDayCheck}
                            checked={parsedDates.length === 31}
                            onChange={() => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                const _dates = [];
                                for (let i = 1; i <= 31; i++) {
                                    _dates.push(i);
                                }
                                _schedule.period.dates = JSON.stringify(_dates);
                                this.onChange(_schedule);
                            }}
                        />
                    }
                    label={I18n.t('sch_all')}
                />
                <FormControlLabel
                    style={styles.inputDateDay}
                    control={
                        <Checkbox
                            style={styles.inputDateDayCheck}
                            checked={!parsedDates.length}
                            onChange={() => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.dates = '[]';
                                this.onChange(_schedule);
                            }}
                        />
                    }
                    label={I18n.t('sch_no_one')}
                />
                {parsedDates.length !== 31 && !!parsedDates.length && (
                    <FormControlLabel
                        style={styles.inputDateDay}
                        control={
                            <Checkbox
                                style={styles.inputDateDayCheck}
                                checked={false}
                                onChange={() => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    const result = [];
                                    const _parsedDates = JSON.parse(_schedule.period.dates);
                                    for (let i = 1; i <= 31; i++) {
                                        if (!_parsedDates.includes(i)) {
                                            result.push(i);
                                        }
                                    }
                                    result.sort((a, b) => a - b);
                                    _schedule.period.dates = JSON.stringify(result);
                                    this.onChange(_schedule);
                                }}
                            />
                        }
                        label={I18n.t('sch_invert')}
                    />
                )}
                <div />
                {dates.map(i => (
                    <FormControlLabel
                        key={`date_${i}`}
                        style={
                            !i
                                ? {
                                      ...styles.inputDateDay,
                                      opacity: 0,
                                      cursor: 'default',
                                      userSelect: 'none',
                                      pointerEvents: 'none',
                                  }
                                : styles.inputDateDay
                        }
                        control={
                            <Checkbox
                                style={styles.inputDateDayCheck}
                                checked={JSON.parse(schedule.period.dates).includes(i)}
                                onChange={e => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    let _dates;
                                    try {
                                        _dates = JSON.parse(_schedule.period.dates);
                                    } catch {
                                        _dates = [];
                                    }
                                    if (e.target.checked && !_dates.includes(i)) {
                                        _dates.push(i);
                                    } else if (!e.target.checked && _dates.includes(i)) {
                                        _dates.splice(_dates.indexOf(i), 1);
                                    }
                                    _dates.sort((a: number, b: number) => a - b);
                                    _schedule.period.dates = JSON.stringify(_dates);
                                    this.onChange(_schedule);
                                }}
                            />
                        }
                        label={
                            i < 10
                                ? [
                                      <span
                                          key="0"
                                          style={{ opacity: 0 }}
                                      >
                                          0
                                      </span>,
                                      <span key="num">{i}</span>,
                                  ]
                                : i
                        }
                    />
                ))}
            </FormGroup>
        );
    }

    getPeriodSettingsMonthly(): JSX.Element[] | null {
        if (!this.state.schedule.period.months) {
            return null;
        }
        const schedule = this.state.schedule;
        const parsedMonths = typeof schedule.period.months === 'string' ? JSON.parse(schedule.period.months) : [];

        return [
            <div key="every">
                <FormControlLabel
                    control={
                        <Radio
                            style={styles.inputRadio}
                            checked={typeof schedule.period.months === 'number' && schedule.period.months === 1}
                            onClick={() => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.months = 1;
                                this.onChange(schedule);
                            }}
                        />
                    }
                    label={I18n.t('sch_periodEveryMonth')}
                />
            </div>,
            <div key="everyN">
                <FormControlLabel
                    control={
                        <Radio
                            style={styles.inputRadio}
                            checked={typeof schedule.period.months === 'number' && schedule.period.months > 1}
                            onClick={() => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.months = 2;
                                this.onChange(_schedule);
                            }}
                        />
                    }
                    label={I18n.t('sch_periodEvery')}
                />
                {typeof schedule.period.months === 'number' &&
                    schedule.period.months > 1 && [
                        <Input
                            key="input"
                            value={schedule.period.months}
                            style={styles.inputEvery}
                            type="number"
                            inputProps={{ min: 2 }}
                            onChange={e => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.months = parseInt(e.target.value, 10);
                                if (_schedule.period.months < 1) {
                                    _schedule.period.months = 1;
                                }
                                this.onChange(_schedule);
                            }}
                        />,
                        <span key="text">{I18n.t('sch_periodMonth')}</span>,
                    ]}
            </div>,
            <div
                key="specific"
                style={{ verticalAlign: 'top' }}
            >
                <FormControlLabel
                    style={{ verticalAlign: 'top' }}
                    control={
                        <Radio
                            style={styles.inputRadio}
                            checked={typeof schedule.period.months === 'string'}
                            onClick={() => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.months = '[1,2,3,4,5,6,7,8,9,10,11,12]';
                                this.onChange(_schedule);
                            }}
                        />
                    }
                    label={I18n.t('sch_periodSpecificMonths')}
                />
                {typeof schedule.period.months === 'string' && (
                    <FormGroup
                        row
                        style={styles.inputGroup}
                    >
                        <FormControlLabel
                            style={styles.inputDateDay}
                            control={
                                <Checkbox
                                    style={styles.inputDateDayCheck}
                                    checked={parsedMonths.length === 12}
                                    onChange={() => {
                                        const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                        const months = [];
                                        for (let i = 1; i <= 12; i++) {
                                            months.push(i);
                                        }
                                        _schedule.period.months = JSON.stringify(months);
                                        this.onChange(_schedule);
                                    }}
                                />
                            }
                            label={I18n.t('sch_all')}
                        />
                        <FormControlLabel
                            style={styles.inputDateDay}
                            control={
                                <Checkbox
                                    style={styles.inputDateDayCheck}
                                    checked={!parsedMonths.length}
                                    onChange={() => {
                                        const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                        _schedule.period.months = '[]';
                                        this.onChange(_schedule);
                                    }}
                                />
                            }
                            label={I18n.t('sch_no_one')}
                        />
                        {parsedMonths.length !== 12 && !!parsedMonths.length && (
                            <FormControlLabel
                                style={styles.inputDateDay}
                                control={
                                    <Checkbox
                                        style={styles.inputDateDayCheck}
                                        checked={false}
                                        onChange={() => {
                                            const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                            const result = [];
                                            const _parsedMonths = JSON.parse(_schedule.period.months);
                                            for (let i = 1; i <= 12; i++) {
                                                if (!_parsedMonths.includes(i)) {
                                                    result.push(i);
                                                }
                                            }
                                            result.sort((a, b) => a - b);
                                            _schedule.period.months = JSON.stringify(result);
                                            this.onChange(_schedule);
                                        }}
                                    />
                                }
                                label={I18n.t('sch_invert')}
                            />
                        )}
                        <div />
                        {MONTHS.map((month, i) => (
                            <FormControlLabel
                                key={`month_${i}`}
                                style={styles.inputGroupElement}
                                control={
                                    <Checkbox
                                        style={styles.inputSmallCheck}
                                        checked={
                                            typeof schedule.period.months === 'string'
                                                ? JSON.parse(schedule.period.months).includes(i + 1)
                                                : schedule.period.months === i
                                        }
                                        onChange={e => {
                                            const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                            let months;
                                            try {
                                                months = JSON.parse(_schedule.period.months);
                                            } catch {
                                                months = [];
                                            }
                                            if (e.target.checked && !months.includes(i + 1)) {
                                                months.push(i + 1);
                                            } else if (!e.target.checked && months.includes(i + 1)) {
                                                months.splice(months.indexOf(i + 1), 1);
                                            }
                                            months.sort((a: number, b: number) => a - b);
                                            _schedule.period.months = JSON.stringify(months);
                                            this.onChange(_schedule);
                                        }}
                                    />
                                }
                                label={I18n.t(month)}
                            />
                        ))}
                    </FormGroup>
                )}
            </div>,
        ];
    }

    getPeriodSettingsYearly(): JSX.Element[] | null {
        if (!this.state.schedule.period.years) {
            return null;
        }
        const schedule = this.state.schedule;
        return [
            <div key="year">
                <FormControlLabel
                    control={
                        <Radio
                            style={styles.inputRadio}
                            checked={schedule.period.years === 1}
                            onClick={() => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.years = 1;
                                this.onChange(_schedule);
                            }}
                        />
                    }
                    label={I18n.t('sch_periodEveryYear')}
                />
            </div>,
            <div key="every">
                <FormControlLabel
                    control={
                        <Radio
                            style={styles.inputRadio}
                            checked={schedule.period.years > 1}
                            onClick={() => {
                                const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                _schedule.period.years = 2;
                                this.onChange(_schedule);
                            }}
                        />
                    }
                    label={I18n.t('sch_periodEvery')}
                />
                {schedule.period.years > 1 && [
                    <Input
                        key="input"
                        value={this.state.schedule.period.years}
                        style={styles.inputEvery}
                        type="number"
                        inputProps={{ min: 2 }}
                        onChange={e => {
                            const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                            _schedule.period.years = parseInt(e.target.value, 10);
                            if (_schedule.period.years < 1) {
                                _schedule.period.years = 1;
                            }
                            this.onChange(_schedule);
                        }}
                    />,
                    <span key="text">{I18n.t('sch_periodYear')}</span>,
                ]}
            </div>,
        ];
    }

    static now2string(isEnd?: boolean): string {
        const d = new Date();
        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);
        if (isEnd) {
            d.setDate(d.getDate() + 2);
            d.setMilliseconds(d.getMilliseconds() - 1);
        }

        return `${padding(d.getDate())}.${padding(d.getMonth() + 1)}.${padding(d.getFullYear())}`;
    }

    static string2date(str: string): Date {
        let parts = str.split('.'); // 31.12.2019
        if (parts.length === 1) {
            parts = str.split('-'); // 2018-12-31
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }

    getValidSettings(): JSX.Element {
        const schedule = this.state.schedule;
        // ----- from ---
        return (
            <div style={styles.rowDiv}>
                <div style={{ ...styles.modeDiv, verticalAlign: 'middle' }}>
                    <span style={{ fontWeight: 'bold', paddingRight: 10 }}>{I18n.t('sch_valid')}</span>
                    <span>{I18n.t('sch_validFrom')}</span>
                </div>
                <div style={styles.settingsDiv}>
                    <TextField
                        variant="standard"
                        style={{ ...styles.inputDate, marginRight: 10 }}
                        key="exactTimeFrom"
                        inputRef={this.refFrom}
                        defaultValue={string2USdate(schedule.valid.from)}
                        type="date"
                        // inputComponent={TextDate}
                        onChange={e => {
                            this.timerFrom && clearTimeout(this.timerFrom);

                            if (this.refFrom.current) {
                                this.refFrom.current.style.background = '#ff000030';
                            }

                            this.timerFrom = setTimeout(
                                value => {
                                    this.timerFrom = null;
                                    if (this.refFrom.current) {
                                        this.refFrom.current.style.background = '';
                                    }
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    const date = Schedule.string2date(value);
                                    if (date.toString() !== 'Invalid Date') {
                                        _schedule.valid.from = `${padding(date.getDate())}.${padding(date.getMonth() + 1)}.${date.getFullYear()}`;
                                        this.onChange(_schedule);
                                    }
                                },
                                1500,
                                e.target.value,
                            );
                        }}
                        slotProps={{
                            inputLabel: { shrink: true },
                        }}
                        margin="normal"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                style={styles.inputRadio}
                                checked={!!schedule.valid.to}
                                onClick={() => {
                                    const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                    _schedule.valid.to = _schedule.valid.to ? '' : Schedule.now2string(true);
                                    this.onChange(_schedule);
                                }}
                            />
                        }
                        label={I18n.t('sch_validTo')}
                    />
                    {!!schedule.valid.to && (
                        <TextField
                            variant="standard"
                            inputRef={this.refTo}
                            style={{ ...styles.inputDate, marginRight: 10 }}
                            key="exactTimeFrom"
                            type="date"
                            defaultValue={string2USdate(schedule.valid.to)}
                            // inputComponent={TextDate}
                            onChange={e => {
                                this.timerTo && clearTimeout(this.timerTo);

                                if (this.refTo.current) {
                                    this.refTo.current.style.background = '#ff000030';
                                }
                                this.timerTo = setTimeout(
                                    value => {
                                        this.timerTo = null;
                                        if (this.refTo.current) {
                                            this.refTo.current.style.background = '';
                                        }
                                        const _schedule = JSON.parse(JSON.stringify(this.state.schedule));
                                        const date = Schedule.string2date(value);
                                        if (date.toString() !== 'Invalid Date') {
                                            _schedule.valid.to = `${padding(date.getDate())}.${padding(date.getMonth() + 1)}.${date.getFullYear()}`;
                                            this.onChange(_schedule);
                                        }
                                    },
                                    1500,
                                    e.target.value,
                                );
                            }}
                            slotProps={{
                                inputLabel: { shrink: true },
                            }}
                            margin="normal"
                        />
                    )}
                </div>
            </div>
        );
    }

    render(): JSX.Element {
        return (
            <div style={{ height: 'calc(100% - 48px)', width: '100%', overflow: 'hidden' }}>
                <div>{this.state.desc}</div>
                <div style={styles.scrollWindow}>
                    <h5>{I18n.t('sch_time')}</h5>
                    {this.getTimePeriodElements()}
                    {this.getTimeExactElements()}
                    {Schedule.getDivider()}
                    <h5>{I18n.t('sch_period')}</h5>
                    {this.getPeriodModes()}
                    {!this.state.schedule.period.once && Schedule.getDivider()}
                    {!this.state.schedule.period.once && this.getValidSettings()}
                </div>
            </div>
        );
    }
}
