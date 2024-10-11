import React, { Component } from 'react';

import { Checkbox, Button, MenuItem, Select, FormControlLabel, AppBar, Tabs, Tab, TextField } from '@mui/material';

import { I18n } from '../i18n';
import convertCronToText from './SimpleCron/cronText';

const styles: Record<string, React.CSSProperties> = {
    mainDiv: {
        width: '100%',
        height: '100%',
    },
    periodSelect: {
        // margin: '0 10px 60px 10px',
        display: 'block',
        width: 250,
    },
    slider: {
        marginTop: 20,
        display: 'block',
        width: '100%',
    },
    tabContent: {
        padding: 20,
        height: 'calc(100% - 240px)',
        overflow: 'auto',
    },
    numberButton: {
        padding: 4,
        minWidth: 40,
        margin: 5,
    },
    numberButtonBreak: {
        display: 'block',
    },
    appBar: {
        color: 'white',
    },
    warning: {
        marginLeft: 16,
        color: 'red',
        fontSize: 12,
    },
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

// 5-7,9-11 => [5,6,7,9,10,11]
function convertMinusIntoArray(value: string | false | undefined, max: number): number[] {
    const result: number[] = [];

    if (value === '*') {
        if (max === 24 || max === 60 || max === 7) {
            for (let i = 0; i < max; i++) {
                result.push(i);
            }
        } else {
            for (let i = 1; i <= max; i++) {
                result.push(i);
            }
        }
        return result; // array with entries max
    }

    const parts = (value || '').toString().split(',');

    for (let p = 0; p < parts.length; p++) {
        if (!parts[p].trim().length) {
            continue;
        }
        const items = parts[p].trim().split('-');
        if (items.length > 1) {
            const iMax = parseInt(items[1], 10);
            for (let i = parseInt(items[0], 10); i <= iMax; i++) {
                result.push(i);
            }
        } else {
            result.push(parseInt(parts[p], 10));
        }
    }

    result.sort();

    // remove double entries
    for (let p = result.length - 1; p >= 0; p--) {
        if (result[p] === result[p + 1]) {
            result.splice(p + 1, 1);
        }
    }

    return result;
}

// [5,6,7,9,10,11] => 5-7,9-11
function convertArrayIntoMinus(value: number | number[], max: number): string {
    if (typeof value !== 'object') {
        value = [value];
    }
    if (value.length === max) {
        return '*';
    }
    const newParts = [];
    if (!value.length) {
        return '-';
    }
    value = value.map(a => parseInt(a as any as string, 10));

    value.sort((a, b) => a - b);

    let start = value[0];
    let end = value[0];
    for (let p = 1; p < value.length; p++) {
        if (value[p] - 1 !== parseInt(value[p - 1] as any as string, 10)) {
            if (start === end) {
                newParts.push(start);
            } else if (end - 1 === start) {
                newParts.push(`${start},${end}`);
            } else {
                newParts.push(`${start}-${end}`);
            }
            start = value[p];
        }
        end = value[p];
    }

    if (start === end) {
        newParts.push(start);
    } else if (end - 1 === start) {
        newParts.push(`${start},${end}`);
    } else {
        newParts.push(`${start}-${end}`);
    }

    return newParts.join(',');
}

type CronNames = 'seconds' | 'minutes' | 'hours' | 'dates' | 'months' | 'dow';

interface CronProps {
    seconds: string | false | null;
    minutes: string | null;
    hours: string | null;
    dates: string | null;
    months: string | null;
    dow: string | null;
}

interface ComplexCronProps {
    cronExpression: string;
    onChange: (cron: string) => void;
    language: ioBroker.Languages;
}

// type CronModes = 'every' | 'everyN' | 'specific';

interface ComplexCronState {
    extended: boolean;
    tab: number;
    cron: string;
    seconds?: string | false;
    minutes?: string;
    hours?: string;
    dates?: string;
    months?: string;
    dow?: string;
    modes: CronProps;
}

export class ComplexCron extends Component<ComplexCronProps, ComplexCronState> {
    constructor(props: ComplexCronProps) {
        super(props);
        let cron =
            typeof this.props.cronExpression === 'string'
                ? this.props.cronExpression.replace(/^["']/, '').replace(/["']\n?$/, '')
                : '';
        if (cron[0] === '{') {
            cron = '';
        }
        const state = ComplexCron.cron2state(cron || '* * * * *');

        this.state = {
            extended: false,
            tab: state.seconds !== false ? 1 : 0,
            cron: ComplexCron.state2cron(state),
            modes: {
                seconds: null,
                minutes: null,
                hours: null,
                dates: null,
                months: null,
                dow: null,
            },
        };
        Object.assign(this.state, state);
        if (this.state.cron !== this.props.cronExpression) {
            setTimeout(() => this.props.onChange && this.props.onChange(this.state.cron), 100);
        }
    }

    static cron2state(cron: string): CronProps {
        cron = cron.replace(/['"]/g, '').trim();
        const cronParts = cron.split(' ').map(p => p.trim());
        let options: CronProps;

        if (cronParts.length === 6) {
            options = {
                seconds: cronParts[0] || '*',
                minutes: cronParts[1] || '*',
                hours: cronParts[2] || '*',
                dates: cronParts[3] || '*',
                months: cronParts[4] || '*',
                dow: cronParts[5] || '*',
            };
        } else {
            options = {
                seconds: false,
                minutes: cronParts[0] || '*',
                hours: cronParts[1] || '*',
                dates: cronParts[2] || '*',
                months: cronParts[3] || '*',
                dow: cronParts[4] || '*',
            };
        }
        return options;
    }

    static state2cron(state: ComplexCronState | CronProps): string {
        let text = `${state.minutes} ${state.hours} ${state.dates} ${state.months} ${state.dow}`;
        if (state.seconds !== false) {
            text = `${state.seconds} ${text}`;
        }
        return text;
    }

    recalcCron(): void {
        const cron = ComplexCron.state2cron(this.state);
        if (cron !== this.state.cron) {
            this.setState({ cron }, () => this.props.onChange && this.props.onChange(this.state.cron));
        }
    }

    onToggle(i: boolean | number, type: CronNames, max: number): void {
        if (i === true) {
            this.setCronAttr(type, '*');
        } else if (i === false) {
            if (max === 60 || max === 24) {
                this.setCronAttr(type, '0');
            } else {
                this.setCronAttr(type, '1');
            }
        } else {
            const nums = convertMinusIntoArray(this.state[type], max);
            const pos = nums.indexOf(i);
            if (pos !== -1) {
                nums.splice(pos, 1);
            } else {
                nums.push(i);
                nums.sort();
            }
            this.setCronAttr(type, convertArrayIntoMinus(nums, max));
        }
    }

    getDigitsSelector(type: CronNames, max: number): React.JSX.Element[] {
        let values = [];
        if (max === 7) {
            values = [1, 2, 3, 4, 5, 6, 0];
        } else if (max === 60 || max === 24) {
            for (let i = 0; i < max; i++) {
                values.push(i);
            }
        } else {
            for (let i = 1; i <= max; i++) {
                values.push(i);
            }
        }

        const parts = convertMinusIntoArray(this.state[type], max);

        return [
            <Button
                key="removeall"
                variant="outlined"
                style={styles.numberButton}
                // style={{paddingBottom: 20}}
                color="primary"
                onClick={() => this.onToggle(false, type, max)}
            >
                {I18n.t('ra_Deselect all')}
            </Button>,
            <Button
                key="addall"
                variant="contained"
                // style={{paddingBottom: 20}}
                style={styles.numberButton}
                color="secondary"
                onClick={() => this.onToggle(true, type, max)}
            >
                {I18n.t('ra_Select all')}
            </Button>,
            <div key="all">
                {values.map(i => [
                    (max === 7 && i === 4) ||
                    (max === 12 && i === 7) ||
                    (max === 31 && !((i - 1) % 10)) ||
                    (max === 60 && i && !(i % 10)) ||
                    (max === 24 && i && !(i % 6)) ? (
                        <div
                            key={`allInner${i}`}
                            style={{ width: '100%' }}
                        />
                    ) : null,
                    <Button
                        key={`_${i}`}
                        variant={parts.indexOf(i) !== -1 ? 'contained' : 'outlined'}
                        style={styles.numberButton}
                        color={parts.indexOf(i) !== -1 ? 'secondary' : 'primary'}
                        onClick={() => this.onToggle(i, type, max)}
                    >
                        {max === 7 ? I18n.t(WEEKDAYS[i]) : max === 12 ? MONTHS[i - 1] : i}
                    </Button>,
                ])}
            </div>,
        ];
    }

    getPeriodsTab(type: CronNames, max: number): React.JSX.Element | null {
        const value = this.state[type];
        let every = value === '*';
        let everyN = value === undefined || value === null ? false : value.toString().includes('/');
        let select;
        if (this.state.modes[type] === null) {
            select = every ? 'every' : everyN ? 'everyN' : 'specific';
            const modes = JSON.parse(JSON.stringify(this.state.modes));
            modes[type] = select;
            setTimeout(() => this.setState({ modes }, () => this.recalcCron()), 100);
            return null;
        }

        every = this.state.modes[type] === 'every';
        everyN = this.state.modes[type] === 'everyN';
        select = this.state.modes[type];

        let valueNumber = 1;
        if (everyN && value) {
            valueNumber = parseInt(value.replace('*/', ''), 10) || 1;
        }

        return (
            <div>
                <Select
                    variant="standard"
                    style={{ ...styles.periodSelect, verticalAlign: 'bottom' }}
                    value={select}
                    onChange={e => {
                        const modes = JSON.parse(JSON.stringify(this.state.modes));
                        modes[type] = e.target.value;
                        if (e.target.value === 'every') {
                            this.setCronAttr(type, '*', modes);
                        } else if (e.target.value === 'everyN') {
                            const num = parseInt((this.state[type] || '').toString().replace('*/', ''), 10) || 1;
                            this.setCronAttr(type, `*/${num}`, modes);
                        } else if (e.target.value === 'specific') {
                            let num = parseInt((this.state[type] || '').toString().split(',')[0], 10) || 0;
                            if (!num && (type === 'months' || type === 'dates')) {
                                num = 1;
                            }
                            this.setCronAttr(type, convertArrayIntoMinus(num, max), modes);
                        }
                    }}
                >
                    <MenuItem
                        key="every"
                        value="every"
                    >
                        {I18n.t(`sc_every_${type}`)}
                    </MenuItem>
                    <MenuItem
                        key="everyN"
                        value="everyN"
                    >
                        {I18n.t(`sc_everyN_${type}`)}
                    </MenuItem>
                    <MenuItem
                        key="specific"
                        value="specific"
                    >
                        {I18n.t(`sc_specific_${type}`)}
                    </MenuItem>
                </Select>
                {/* everyN && false && <span>{value}</span> */}
                {everyN && (
                    <TextField
                        variant="standard"
                        key="interval"
                        label={I18n.t(`sc_${type}`)}
                        value={valueNumber}
                        slotProps={{
                            htmlInput: {
                                min: 1,
                                max,
                            },
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        onChange={e => {
                            // @ts-expect-error is allowed
                            this.setState({ [type]: `*/${e.target.value}` }, () => this.recalcCron());
                        }}
                        type="number"
                        margin="normal"
                    />
                )}
                {!every && !everyN && this.getDigitsSelector(type, max)}
            </div>
        );
    }

    static convertCronToText(cron: string, lang: ioBroker.Languages): string {
        if (cron.split(' ').includes('-')) {
            return I18n.t('ra_Invalid CRON');
        }
        return convertCronToText(cron, lang);
    }

    setCronAttr(attr: CronNames, value: string, modes?: CronProps): void {
        if (modes) {
            if (attr === 'seconds') {
                this.setState({ seconds: value, modes }, () => this.recalcCron());
            } else if (attr === 'minutes') {
                this.setState({ minutes: value, modes }, () => this.recalcCron());
            } else if (attr === 'hours') {
                this.setState({ hours: value, modes }, () => this.recalcCron());
            } else if (attr === 'dates') {
                this.setState({ dates: value, modes }, () => this.recalcCron());
            } else if (attr === 'months') {
                this.setState({ months: value, modes }, () => this.recalcCron());
            } else if (attr === 'dow') {
                this.setState({ dow: value, modes }, () => this.recalcCron());
            } else {
                this.setState({ modes }, () => this.recalcCron());
            }
        } else if (attr === 'seconds') {
            this.setState({ seconds: value }, () => this.recalcCron());
        } else if (attr === 'minutes') {
            this.setState({ minutes: value }, () => this.recalcCron());
        } else if (attr === 'hours') {
            this.setState({ hours: value }, () => this.recalcCron());
        } else if (attr === 'dates') {
            this.setState({ dates: value }, () => this.recalcCron());
        } else if (attr === 'months') {
            this.setState({ months: value }, () => this.recalcCron());
        } else if (attr === 'dow') {
            this.setState({ dow: value }, () => this.recalcCron());
        }
    }

    render(): React.JSX.Element {
        const tab = this.state.seconds !== false ? this.state.tab : this.state.tab + 1;

        // Detect if every minute or every second is activated
        const everyMinute = this.state.minutes === '*' || this.state.minutes === '*/1';
        const everySecond = this.state.seconds === '*' || this.state.seconds === '*/1';

        return (
            <div style={styles.mainDiv}>
                <div style={{ paddingLeft: 8, width: 'calc(100% - px)' }}>
                    <TextField
                        variant="standard"
                        style={{ width: '100%' }}
                        value={this.state.cron}
                        disabled
                    />
                </div>
                <div style={{ paddingLeft: 8, width: 'calc(100% - px)', height: 60 }}>
                    {ComplexCron.convertCronToText(this.state.cron, this.props.language || 'en')}
                    <span style={styles.warning}>
                        {everySecond
                            ? I18n.t('ra_warning_every_second')
                            : everyMinute
                              ? I18n.t('ra_warning_every_minute')
                              : ''}
                    </span>
                </div>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={!!this.state.seconds}
                            onChange={e =>
                                this.setState({ seconds: e.target.checked ? '*' : false }, () => this.recalcCron())
                            }
                        />
                    }
                    label={I18n.t('ra_use seconds')}
                />
                <AppBar
                    position="static"
                    sx={{ '&.MuiAppBar-root': styles.appBar }}
                    color="secondary"
                >
                    <Tabs
                        value={this.state.tab}
                        style={styles.appBar}
                        color="secondary"
                        onChange={(_active, _tab) => this.setState({ tab: _tab })}
                    >
                        {this.state.seconds !== false && (
                            <Tab
                                id="sc_seconds"
                                label={I18n.t('sc_seconds')}
                            />
                        )}
                        <Tab
                            id="minutes"
                            label={I18n.t('sc_minutes')}
                        />
                        <Tab
                            id="hours"
                            label={I18n.t('sc_hours')}
                        />
                        <Tab
                            id="dates"
                            label={I18n.t('sc_dates')}
                        />
                        <Tab
                            id="months"
                            label={I18n.t('sc_months')}
                        />
                        <Tab
                            id="dow"
                            label={I18n.t('sc_dows')}
                        />
                    </Tabs>
                </AppBar>
                {tab === 0 && <div style={styles.tabContent}>{this.getPeriodsTab('seconds', 60)}</div>}
                {tab === 1 && <div style={styles.tabContent}>{this.getPeriodsTab('minutes', 60)}</div>}
                {tab === 2 && <div style={styles.tabContent}>{this.getPeriodsTab('hours', 24)}</div>}
                {tab === 3 && <div style={styles.tabContent}>{this.getPeriodsTab('dates', 31)}</div>}
                {tab === 4 && <div style={styles.tabContent}>{this.getPeriodsTab('months', 12)}</div>}
                {tab === 5 && <div style={styles.tabContent}>{this.getPeriodsTab('dow', 7)}</div>}
            </div>
        );
    }
}
