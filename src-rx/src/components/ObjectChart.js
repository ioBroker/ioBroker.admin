import React from "react";
import PropTypes from "prop-types";
import withWidth from "@material-ui/core/withWidth";
import {withStyles} from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import LinearProgress from "@material-ui/core/LinearProgress";
const styles = theme => ({
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
});

class ObjectChart extends React.Component {
    constructor(props) {
        super(props);
        let from = new Date();
        from.setHours(from.getHours() - 24);

        this.state = {
            loaded: false,
            from,
            to: new Date(),
            chartValues: null,
            historyInstance: '',
            historyInstances: [],
            defaultHistory: '',
        };

        this.prepareData()
            .then(() =>
                this.readHistory(this.props.obj._id, this.state.from, this.state.to));
    }

    prepareData() {
        let list;
        return this.getHistoryInstances()
            .then(_list => {
                list = _list;
                // read default history
                return this.props.socket.getSystemConfig();
            })
            .then(config => {
                const defaultHistory = config && config.common && config.common.defaultHistory;

                // find current history
                // first read from localstorage
                let historyInstance = window.localStorage.getItem('App.historyInstance') || '';
                if (!historyInstance || !list.find(it => it.id === historyInstance && it.alive)) {
                    // try default history
                    historyInstance = defaultHistory;
                }
                if (!historyInstance || !list.find(it => it.id === historyInstance && it.alive)) {
                    // find first alive history
                    historyInstance = list.find(it => it.alive) || '';
                }
                // get first entry
                if (!historyInstance && list.length) {
                    historyInstance = defaultHistory;
                }
                this.setState( {
                    historyInstances: list,
                    defaultHistory,
                    historyInstance
                });
            });
    }

    getHistoryInstances() {
        const list = [];
        const ids = [];
        this.props.customsInstances.forEach(instance => {
            const instObj = this.props.objects['system.adapter.' + instance];
            if (instObj && instObj.common && instObj.common.getHistory) {
                let listObj = {id: instance, alive: false};
                list.push(listObj);
                ids.push('system.adapter.' + instance + '.alive');
            }
        });

        if (ids.length) {
            return this.props.socket.getForeignStates(ids)
                .then(alives => {
                    Object.keys(alives).forEach(id => {
                        const item = list.find(it => id.endsWith(it.id + '.alive'));
                        if (item) {
                            item.alive = alives[id] && alives[id].val;
                        }
                    });
                    return list;
                });
        } else {
            return Promise.resolve(list);
        }
    }

    readHistory(id, from, to) {
        /*interface GetHistoryOptions {
            instance?: string;
            start?: number;
            end?: number;
            step?: number;
            count?: number;
            from?: boolean;
            ack?: boolean;
            q?: boolean;
            addID?: boolean;
            limit?: number;
            ignoreNull?: boolean;
            sessionId?: any;
            aggregate?: 'minmax' | 'min' | 'max' | 'average' | 'total' | 'count' | 'none';
        }*/
        const now = new Date();
        now.setHours(now.getHours() - 24);
        now.setMinutes(0);
        now.setSeconds(0);
        now.setMilliseconds(0);
        let nowMs = now.getTime();

        this.props.socket.getHistory(id, {
            instance: this.defaultHistory,
            start: nowMs,
            end: Date.now(),
            step: 3600000,
            from: false,
            ack: false,
            q: false,
            addID: false,
            aggregate: 'minmax'
        })
            .then(values => {
                this.setState( { chartValues: values });
            });
    }

    render() {
        if (!this.state.chartValues) {
            return <LinearProgress/>;
        }
        return <Paper className={ this.props.classes.paper }>

        </Paper>;
    }
}

ObjectChart.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    socket: PropTypes.object,
    obj: PropTypes.object,
    customsInstances: PropTypes.array,
    theme: PropTypes.string,
    objects: PropTypes.object,
};

export default withWidth()(withStyles(styles)(ObjectChart));