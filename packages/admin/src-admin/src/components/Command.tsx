import React, { Component, type JSX } from 'react';

import { amber, blue, red } from '@mui/material/colors';

import { Grid2, LinearProgress, Paper, Switch, Typography } from '@mui/material';

import { Router, type AdminConnection, type Translate } from '@iobroker/adapter-react-v5';

import AdminUtils, { type Style } from '../AdminUtils';

const styles: Record<string, React.CSSProperties> = {
    log: {
        height: 400,
        width: 860,
        padding: 8,
        overflowY: 'auto',
    },
    logNoSpacing: {
        height: '100%',
        width: 'calc(100% - 8px)',
        marginLeft: 8,
        padding: 8,
        overflowY: 'auto',
    },
    error: {
        color: red[500],
    },
    info: {
        color: blue[500],
    },
    warn: {
        color: amber[500],
    },
};

interface CommandProps {
    noSpacing?: boolean;
    host: string;
    callback?: (exitCode: number) => void;
    socket: AdminConnection;
    onFinished: (exitCode: number, log: string[]) => void;
    ready: boolean;
    t: Translate;
    inBackground?: boolean;
    commandError?: boolean;
    errorFunc?: (exitCode: number, log: string[]) => void;
    performed?: () => void;
    cmd: string;
    onSetCommandRunning?: (running: boolean) => void;
    showElement?: boolean;
    logsRead?: string[];
}

interface CommandState {
    log: string[];
    init: boolean;
    max: number | null;
    value: number | null;
    // progressText: string;
    moreChecked: boolean;
    stopped: boolean;
    activeCmdId?: number;
    // closeOnReady: boolean;
}

class Command extends Component<CommandProps, CommandState> {
    private readonly logRef: React.RefObject<HTMLDivElement>;

    private static pattern = ['error', 'warn', 'info'];

    private readonly regExp: RegExp;

    constructor(props: CommandProps) {
        super(props);

        this.state = {
            log: [`$ iobroker ${props.cmd || ''}`],
            init: false,
            max: null,
            value: null,
            // progressText: '',
            moreChecked: true,
            stopped: false,
        };

        this.logRef = React.createRef();

        this.regExp = new RegExp(Command.pattern.join('|'), 'i');
    }

    componentDidMount(): void {
        if (this.props.ready && this.props.cmd) {
            console.log(`STARTED: ${this.props.cmd}`);
            this.executeCommand();
        }
        // try {
        //     const closeOnReady = JSON.parse((window._localStorage || window.localStorage).getItem('CommandDialog.closeOnReady')) || false;
        //     this.setState({ closeOnReady });
        // } catch (error) {
        //     this.setState({ closeOnReady: false });
        // }
    }

    componentDidUpdate(): void {
        if (!this.state.init && this.props.ready && this.props.cmd) {
            this.executeCommand();
        }
        if (this.props.logsRead && JSON.stringify(this.props.logsRead) !== JSON.stringify(this.state.log)) {
            this.setState({ log: this.props.logsRead });
        }
        this.logRef.current?.scrollIntoView();
    }

    executeCommand(): void {
        this.setState({ init: true }, () => this.props.onSetCommandRunning && this.props.onSetCommandRunning(true));

        this.props.socket.registerCmdStdoutHandler(this.cmdStdoutHandler.bind(this));
        this.props.socket.registerCmdStderrHandler(this.cmdStderrHandler.bind(this));
        this.props.socket.registerCmdExitHandler(this.cmdExitHandler.bind(this));

        const activeCmdId = Math.floor(Math.random() * 0xffffffe) + 1;

        this.setState({ activeCmdId });

        this.props.socket
            .cmdExec(
                this.props.host.startsWith('system.host.') ? this.props.host : `system.host.${this.props.host}`,
                this.props.cmd,
                activeCmdId,
            )
            .catch(error => console.log(error));
    }

    cmdStdoutHandler(id: number, text: string): void {
        if (this.state.activeCmdId && this.state.activeCmdId === id) {
            const log = this.state.log.slice();
            log.push(text);

            const upload = text.match(/^upload \[(\d+)]/);
            const gotAdmin = !upload ? text.match(/^got [-_:/\\.\w\d]+\/admin$/) : null;
            const gotWww = !gotAdmin ? text.match(/^got [-_:/\\.\w\d]+\/www$/) : null;

            let max = this.state.max;
            let value = null;
            // let progressText = '';

            if (upload) {
                max = max || parseInt(upload[1], 10);
                value = parseInt(upload[1], 10);
            } else if (gotAdmin) {
                // upload of admin
                // progressText = this.t('Upload admin started');
                max = null;
            } else if (gotWww) {
                // upload of www
                // progressText = this.t('Upload www started');
                max = null;
            }

            this.setState({
                log,
                max,
                value,
                // progressText,
            });

            console.log('cmdStdout');
        }
    }

    cmdStderrHandler(id: number, text: string): void {
        if (this.state.activeCmdId && this.state.activeCmdId === id) {
            const log = this.state.log.slice();
            log.push(text);

            this.setState({ log });

            console.log('cmdStderr');
            console.log(id);
            console.log(text);
        }
    }

    cmdExitHandler(id: number, exitCode: number): void {
        if (this.state.activeCmdId && this.state.activeCmdId === id) {
            const log = this.state.log.slice();
            if (
                !window.document.hidden &&
                exitCode === 0 &&
                log.length &&
                log[log.length - 1].endsWith('created') &&
                this.props.callback
            ) {
                const newArr = log[log.length - 1].split(' ');
                const adapter = newArr.find(el => el.startsWith('system'));
                if (adapter) {
                    // it takes some time to creat the object
                    setTimeout(
                        _adapter => {
                            this.props.socket.getObject(_adapter).then(obj => {
                                AdminUtils.fixAdminUI(obj);
                                if (obj && obj.common?.adminUI?.config !== 'none') {
                                    Router.doNavigate('tab-instances', 'config', _adapter);
                                }
                            });
                        },
                        1000,
                        adapter,
                    );
                }
            }
            log.push(`${exitCode !== 0 ? 'ERROR: ' : ''}Process exited with code ${exitCode}`);

            this.setState({ log, stopped: true }, () => {
                if (this.props.onSetCommandRunning) {
                    this.props.onSetCommandRunning(false);
                }
                if (exitCode !== 0 || this.state.log[this.state.log.length - 1].toLowerCase().includes('error')) {
                    if (this.props.errorFunc) {
                        this.props.errorFunc(exitCode, this.state.log);
                    }
                } else {
                    if (this.props.performed) {
                        this.props.performed();
                    }
                    this.props.onFinished(exitCode, this.state.log);
                }
                console.log('cmdExit');
                console.log(id);
                console.log(exitCode);

                if (typeof this.props.callback === 'function') {
                    this.props.callback(exitCode);
                }
            });
        }
    }

    colorize(text: string, maxLength?: number): JSX.Element[] | string {
        if (maxLength) {
            text = text.substring(0, maxLength);
        }

        if (text.search(this.regExp) !== -1) {
            const result = [];

            while (text.search(this.regExp) >= 0) {
                const [match] = text.match(this.regExp);
                const pos = text.search(this.regExp);

                if (pos > 0) {
                    const part = text.substring(0, pos);
                    const message = AdminUtils.parseColorMessage(part);
                    result.push(
                        <span key={result.length}>
                            {typeof message === 'object'
                                ? message.parts.map((item, i) => (
                                      <span
                                          key={i}
                                          style={item.style}
                                      >
                                          {item.text}
                                      </span>
                                  ))
                                : message}
                        </span>,
                    );
                    text = text.replace(part, '');
                }

                const part = text.substring(0, match.length);
                if (part) {
                    const message = AdminUtils.parseColorMessage(part);
                    result.push(
                        <span
                            key={result.length}
                            style={styles[match.toLowerCase()]}
                        >
                            {typeof message === 'object'
                                ? message.parts.map((item, i) => (
                                      <span
                                          key={i}
                                          style={item.style}
                                      >
                                          {item.text}
                                      </span>
                                  ))
                                : message}
                        </span>,
                    );
                    text = text.replace(part, '');
                }
            }

            if (text) {
                const message = AdminUtils.parseColorMessage(text);
                result.push(
                    <span key={result.length}>
                        {typeof message === 'object'
                            ? (message as { original: string; parts: { text: string; style: Style }[] }).parts.map(
                                  (item, i) => (
                                      <span
                                          key={i}
                                          style={item.style}
                                      >
                                          {item.text}
                                      </span>
                                  ),
                              )
                            : message}
                    </span>,
                );
            }

            return result;
        }

        return text;
    }

    getLog(): JSX.Element[] {
        return this.state.log.map((value, index) => (
            <Typography
                ref={index === this.state.log.length - 1 ? this.logRef : undefined}
                key={index}
                component="p"
                variant="body2"
            >
                {this.colorize(value)}
            </Typography>
        ));
    }

    render(): JSX.Element {
        return (
            <Grid2
                style={this.props.noSpacing ? { height: '100%', width: '100%' } : {}}
                container
                direction="column"
                spacing={this.props.noSpacing ? 0 : 2}
            >
                {this.props.showElement === undefined || this.props.showElement === true ? (
                    <Grid2>
                        {!this.state.stopped && (
                            <LinearProgress
                                style={this.props.commandError ? { backgroundColor: '#f44336' } : null}
                                variant={this.props.inBackground ? 'determinate' : 'indeterminate'}
                                value={
                                    this.state.max && this.state.value
                                        ? 100 - Math.round((this.state.value / this.state.max) * 100)
                                        : this.props.commandError
                                          ? 0
                                          : 100
                                }
                            />
                        )}
                    </Grid2>
                ) : null}
                <div
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: this.props.inBackground ? 'space-between' : 'flex-end',
                    }}
                >
                    <Typography
                        style={
                            this.props.inBackground
                                ? {
                                      width: 'calc(100% - 180px)',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                  }
                                : { display: 'none' }
                        }
                        component="div"
                    >
                        {this.colorize(this.state.log[this.state.log.length - 1])}
                    </Typography>
                    {this.props.showElement === undefined || this.props.showElement === true ? (
                        <Typography
                            component="div"
                            style={{ width: 250 }}
                        >
                            <Grid2
                                component="label"
                                container
                                alignItems="center"
                                spacing={1}
                            >
                                <Grid2>{this.props.t('less')}</Grid2>
                                <Grid2>
                                    <Switch
                                        checked={this.state.moreChecked}
                                        onChange={event => this.setState({ moreChecked: event.target.checked })}
                                        color="primary"
                                    />
                                </Grid2>
                                <Grid2>{this.props.t('more')}</Grid2>
                            </Grid2>
                        </Typography>
                    ) : null}
                </div>
                <Grid2 style={this.props.noSpacing ? { height: 'calc(100% - 45px)', width: '100%' } : {}}>
                    {this.state.moreChecked && (
                        <Paper style={this.props.noSpacing ? styles.logNoSpacing : styles.log}>{this.getLog()}</Paper>
                    )}
                </Grid2>
            </Grid2>
        );
    }
}

export default Command;
