import React from 'react';
import { withStyles } from '@mui/styles';

import {
    FormHelperText,
    Accordion, AccordionSummary, AccordionDetails,
    IconButton, Paper,
    Toolbar, Tooltip,
    Typography, type Theme,
} from '@mui/material';

import {
    Add as AddIcon,
    Delete as DeleteIcon,
    ArrowUpward as UpIcon,
    ArrowDownward as DownIcon,
    ContentCopy as CopyContentIcon,
    ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

import { Utils, I18n } from '@iobroker/adapter-react-v5';

import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';
// eslint-disable-next-line import/no-cycle
import ConfigPanel from './ConfigPanel';
import type {ConfigItemAccordion, ConfigItemIndexed, ConfigItemPanel} from "#JC/types";

const styles: Record<string, any> = (theme: Theme) => ({
    fullWidth: {
        width: '100%',
    },
    accordionSummary: {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    accordionTitle: {
        // fontWeight: 'bold',
    },
    toolbar: {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        borderRadius: 3,
    },
});

interface ConfigAccordionProps extends ConfigGenericProps {
    schema: ConfigItemAccordion;
}

interface ConfigAccordionState extends ConfigGenericState {
    value: Record<string, any>[];
    activeIndex: number;
    iteration: number;
}

class ConfigAccordion extends ConfigGeneric<ConfigAccordionProps, ConfigAccordionState> {
    private typingTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(props: ConfigAccordionProps) {
        super(props);
        this.props.schema.items = this.props.schema.items || [];
    }

    async componentDidMount() {
        super.componentDidMount();

        let value = ConfigGeneric.getValue(this.props.data, this.props.attr) || [];

        if (!Array.isArray(value)) {
            value = [];
        }

        this.setState({
            value,
            activeIndex: -1,
            iteration: 0,
        });
    }

    componentWillUnmount() {
        this.typingTimer && clearTimeout(this.typingTimer);
        this.typingTimer = null;
        super.componentWillUnmount();
    }

    itemAccordion(data: Record<string, any>, idx: number) {
        const { value } = this.state;
        const { schema } = this.props;

        const schemaItem: ConfigItemPanel = {
            type: 'panel',
            items: schema.items.reduce((accumulator: Record<string, ConfigItemIndexed>, currentValue: ConfigItemIndexed) => {
                accumulator[currentValue.attr] = currentValue;
                return accumulator;
            }, {}),
            style: { marginLeft: -8, marginTop: 10, marginBottom: 10 },
        };

        return <ConfigPanel
            index={idx + this.state.iteration}
            arrayIndex={idx}
            changed={this.props.changed}
            globalData={this.props.data}
            socket={this.props.socket}
            adapterName={this.props.adapterName}
            instance={this.props.instance}
            common={this.props.common}
            alive={this.props.alive}
            themeType={this.props.themeType}
            themeName={this.props.themeName}
            data={data}
            custom
            schema={schemaItem}
            systemConfig={this.props.systemConfig}
            originalData={this.props.originalData}
            customs={this.props.customs}
            dateFormat={this.props.dateFormat}
            isFloatComma={this.props.isFloatComma}
            forceUpdate={this.props.forceUpdate}
            imagePrefix={this.props.imagePrefix}
            onCommandRunning={this.props.onCommandRunning}
            onChange={(attr, valueChange) => {
                const newObj = JSON.parse(JSON.stringify(value));
                (newObj[idx] as Record<string, any>)[attr as string] = valueChange;
                this.setState({ value: newObj }, () =>
                    this.onChangeWrapper(newObj));
            }}
            onError={(error, attr) => this.onError(error, attr)}
            table={this.props.table}
        />;
    }

    onDelete = (index: number) => () => {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        newValue.splice(index, 1);

        this.setState({ value: newValue, iteration: this.state.iteration + 10000 }, () => this.onChangeWrapper(newValue));
    };

    onClone = (index: number) => () => {
        const newValue = JSON.parse(JSON.stringify(this.state.value)) as Record<string, any>[];
        const cloned = JSON.parse(JSON.stringify(newValue[index]));
        if (typeof this.props.schema.clone === 'string' && typeof cloned[this.props.schema.clone] === 'string') {
            let i = 1;
            let text = cloned[this.props.schema.clone];
            const pattern = text.match(/(\d+)$/);
            if (pattern) {
                text = text.replace(pattern[0], '');
                i = parseInt(pattern[0], 10) + 1;
            } else {
                text += '_';
            }
            // eslint-disable-next-line no-loop-func
            while (newValue.find(it => it[this.props.schema.clone as string] === text + i.toString())) {
                i++;
            }
            cloned[this.props.schema.clone] = `${cloned[this.props.schema.clone]}_${i}`;
        }

        newValue.splice(index, 0, cloned);

        this.setState({ value: newValue, activeIndex: -1, iteration: this.state.iteration + 10000 }, () => this.onChangeWrapper(newValue));
    };

    onChangeWrapper = (newValue: any) => {
        this.typingTimer && clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout(value => {
            this.typingTimer = null;

            this.onChange(this.props.attr, value);
        }, 300, newValue);
    };

    onAdd = () => {
        const { schema } = this.props;
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const newItem: Record<string, any> = schema.items && schema.items.reduce((accumulator: Record<string, any>, currentValue: ConfigItemIndexed) => {
            let defaultValue;
            if (currentValue.defaultFunc) {
                if (this.props.custom) {
                    defaultValue = currentValue.defaultFunc ? this.executeCustom(currentValue.defaultFunc, this.props.data, this.props.customObj, this.props.instanceObj, newValue.length, this.props.data) : this.props.schema.default;
                } else {
                    defaultValue = currentValue.defaultFunc ? this.execute(currentValue.defaultFunc, this.props.schema.default, this.props.data, newValue.length, this.props.data) : this.props.schema.default;
                }
            } else {
                defaultValue = currentValue.default === undefined ? null : currentValue.default;
            }

            accumulator[currentValue.attr] = defaultValue;
            return accumulator;
        }, {});

        newValue.push(newItem);

        this.setState({ value: newValue, activeIndex: newValue.length - 1 }, () => this.onChangeWrapper(newValue));
    };

    onMoveUp(idx: number) {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const item = newValue[idx];
        newValue.splice(idx, 1);
        newValue.splice(idx - 1, 0, item);

        const newIndex = this.state.activeIndex - 1;
        this.setState({ value: newValue, activeIndex: newIndex, iteration: this.state.iteration + 10000 }, () => this.onChangeWrapper(newValue));
    }

    onMoveDown(idx: number) {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const item = newValue[idx];
        newValue.splice(idx, 1);
        newValue.splice(idx + 1, 0, item);

        const newIndex = this.state.activeIndex + 1;
        this.setState({ value: newValue, activeIndex: newIndex, iteration: this.state.iteration + 10000 }, () => this.onChangeWrapper(newValue));
    }

    renderItem(/* error, disabled, defaultValue */) {
        const { classes, schema } = this.props;
        const { value } = this.state;

        if (!value) {
            return null;
        }

        return <Paper>
            {schema.label || !schema.noDelete ? <Toolbar variant="dense">
                {schema.label ? <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
                    {this.getText(schema.label)}
                </Typography> : null}
                {!schema.noDelete ? <IconButton size="small" color="primary" onClick={this.onAdd}>
                    <AddIcon />
                </IconButton> : null}
            </Toolbar> : null}
            {value.map((idx, i) =>
                <Accordion key={`${idx}_${i}`} expanded={this.state.activeIndex === i} onChange={(e, expanded) => { this.setState({ activeIndex: expanded ? i : -1 }); }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        className={Utils.clsx(classes.fullWidth, classes.accordionSummary)}
                    >
                        <Typography className={classes.accordionTitle}>{idx[schema.titleAttr]}</Typography>
                    </AccordionSummary>
                    <AccordionDetails style={({ ...schema.style, ...(this.props.themeType ? schema.darkStyle : {}) })}>
                        {this.itemAccordion(value[i], i)}
                        <Toolbar className={classes.toolbar}>
                            {i ? <Tooltip title={I18n.t('ra_Move up')}>
                                <IconButton size="small" onClick={() => this.onMoveUp(i)}>
                                    <UpIcon />
                                </IconButton>
                            </Tooltip> : <div className={classes.buttonEmpty} />}
                            {i < value.length - 1 ? <Tooltip title={I18n.t('ra_Move down')}>
                                <IconButton size="small" onClick={() => this.onMoveDown(i)}>
                                    <DownIcon />
                                </IconButton>
                            </Tooltip> : <div className={classes.buttonEmpty} />}
                            {!schema.noDelete ? <Tooltip title={I18n.t('ra_Delete current row')}>
                                <IconButton size="small" onClick={this.onDelete(i)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip> : null}
                            {schema.clone ? <Tooltip title={I18n.t('ra_Clone current row')}>
                                <IconButton size="small" onClick={this.onClone(i)}>
                                    <CopyContentIcon />
                                </IconButton>
                            </Tooltip> : null}
                        </Toolbar>
                    </AccordionDetails>
                </Accordion>)}
            {!schema.noDelete && value.length > 0 ? <Toolbar variant="dense" className={classes.rootTool}>
                <IconButton size="small" color="primary" onClick={this.onAdd}>
                    <AddIcon />
                </IconButton>
            </Toolbar> : null}
            {schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </Paper>;
    }
}

export default withStyles(styles)(ConfigAccordion);