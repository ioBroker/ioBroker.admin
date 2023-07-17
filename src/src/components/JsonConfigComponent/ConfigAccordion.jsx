import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import FormHelperText from '@mui/material/FormHelperText';
import {
    Accordion, AccordionSummary, AccordionDetails,
    IconButton, Paper,
    Toolbar, Tooltip,
    Typography,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UpIcon from '@mui/icons-material/ArrowUpward';
import DownIcon from '@mui/icons-material/ArrowDownward';
import CopyContentIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import I18n from './wrapper/i18n';
import Utils from './wrapper/Components/Utils';

import ConfigGeneric from './ConfigGeneric';
import ConfigPanel from './ConfigPanel';

const styles = theme => ({
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

class ConfigAccordion extends ConfigGeneric {
    constructor(props) {
        super(props)
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
            order: 'asc',
            iteration: 0,
            filterOn: [],
        });
    }

    componentWillUnmount() {
        this.typingTimer && clearTimeout(this.typingTimer)
        this.typingTimer = null;
        super.componentWillUnmount();
    }

    itemAccordion(data, idx) {
        const { value } = this.state;
        const { schema } = this.props;

        const schemaItem = {
            items: schema.items.reduce((accumulator, currentValue) => {
                accumulator[currentValue.attr] = currentValue;
                return accumulator;
            }, {}),
            style: { marginLeft: -8, marginTop: 10, marginBottom: 10 }
        };

        return <ConfigPanel
            index={idx + this.state.iteration}
            arrayIndex={idx}
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
            onChange={(attr, valueChange) => {
                const newObj = JSON.parse(JSON.stringify(value));
                newObj[idx][attr] = valueChange;
                this.setState({ value: newObj }, () =>
                    this.onChangeWrapper(newObj,true));
            }}
            onError={(error, attr) => this.onError(error, attr)}
        />;
    }
    onDelete = index => () => {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        newValue.splice(index, 1);

        this.setState({ value: newValue, iteration: this.state.iteration + 10000 }, () => this.onChangeWrapper(newValue));
    };

    onClone = index => () => {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
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
            while (newValue.find(it => it[this.props.schema.clone] === text + i.toString())) {
                i++;
            }
            cloned[this.props.schema.clone] = `${cloned[this.props.schema.clone]}_${i}`;
        }

        newValue.splice(index, 0, cloned);

        this.setState({ value: newValue, activeIndex: -1, iteration: this.state.iteration + 10000 }, () => this.onChangeWrapper(newValue));
    }

    onChangeWrapper = (newValue) => {
        this.typingTimer && clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout((value) => {
            this.typingTimer = null;

            this.onChange(this.props.attr, value);
        }, 300, newValue);
    }

    onAdd = () => {
        const { schema } = this.props;
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const newItem = schema.items && schema.items.reduce((accumulator, currentValue) => {
            let defaultValue;
            if (currentValue.defaultFunc) {
                if (this.props.custom) {
                    defaultValue = currentValue.defaultFunc ? this.executeCustom(currentValue.defaultFunc, this.props.schema.default, this.props.data, this.props.instanceObj, newValue.length, this.props.data) : this.props.schema.default;
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

        this.setState({ value: newValue, activeIndex: newValue.length -1 }, () => this.onChangeWrapper(newValue));
    }

    onMoveUp(idx) {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const item = newValue[idx];
        newValue.splice(idx, 1);
        newValue.splice(idx - 1, 0, item);

        const newIndex = this.state.activeIndex - 1;
        this.setState({ value: newValue, activeIndex: newIndex, iteration: this.state.iteration + 10000 }, () => this.onChangeWrapper(newValue));
    }

    onMoveDown(idx) {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const item = newValue[idx];
        newValue.splice(idx, 1);
        newValue.splice(idx + 1, 0, item);

        const newIndex = this.state.activeIndex + 1;
        this.setState({ value: newValue, activeIndex: newIndex, iteration: this.state.iteration + 10000 }, () => this.onChangeWrapper(newValue));
    }

    renderItem(error, disabled, defaultValue) {
        const { classes, schema } = this.props;
        let { value } = this.state;

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
                <Accordion key={`${idx}_${i}`} expanded={this.state.activeIndex === i} onChange={(e, expanded) => { this.setState({ activeIndex: expanded ? i : -1 }) }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        className={Utils.clsx(classes.fullWidth, classes.accordionSummary)}>
                        <Typography className={classes.accordionTitle} >{idx[schema.titleAttr]}</Typography>
                    </AccordionSummary>
                    <AccordionDetails style={Object.assign({}, schema.style, this.props.themeType ? schema.darkStyle : {})}>
                        {this.itemAccordion(value[i], i)}
                        <Toolbar className={classes.toolbar}>
                            {i ? <Tooltip title={I18n.t('ra_Move up')}>
                                <IconButton size="small" onClick={() => this.onMoveUp(i)}>
                                    <UpIcon />
                                </IconButton>
                            </Tooltip> : <div className={classes.buttonEmpty}/>}
                            {i < value.length - 1 ? <Tooltip title={I18n.t('ra_Move down')}>
                                <IconButton size="small" onClick={() => this.onMoveDown(i)}>
                                    <DownIcon />
                                </IconButton>
                            </Tooltip> : <div className={classes.buttonEmpty}/>}
                            <Tooltip title={I18n.t('ra_Delete current row')}>
                                <IconButton size="small" onClick={this.onDelete(i)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                            {this.props.schema.clone ? <Tooltip title={I18n.t('ra_Clone current row')}>
                                <IconButton size="small" onClick={this.onClone(i)}>
                                    <CopyContentIcon />
                                </IconButton>
                            </Tooltip> : null}
                        </Toolbar>
                    </AccordionDetails>
                </Accordion>
            )}
            {!schema.noDelete ? <Toolbar variant="dense" className={classes.rootTool}>
                <IconButton size="small" color="primary" onClick={this.onAdd}>
                    <AddIcon />
                </IconButton>
            </Toolbar> : null}
            {schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </Paper>;
    }
}

ConfigAccordion.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(ConfigAccordion);
