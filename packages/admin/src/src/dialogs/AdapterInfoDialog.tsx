import React, { Component } from 'react';
import { type Styles, withStyles } from '@mui/styles';

import {
    AppBar, Button, Grid, Toolbar,
} from '@mui/material';

import {
    Close as CloseIcon,
    Link as LinkIcon,
} from '@mui/icons-material';

import {
    Router, I18n, Loader, type Connection,
} from '@iobroker/adapter-react-v5';

import Markdown from '../components/Markdown';

const styles = {
    root: {
        height: '100%',
    },
    scroll: {
        height: '100%',
        overflowY: 'auto',
        '& img': {
            maxWidth: '100%',
        },
        fontSize: 14,
    },
} satisfies Styles<any, any>;

interface AdapterInfoDialogProps {
    adapter: string;
    link: string;
    t: typeof I18n.t;
    theme: string;
    themeType: string;
    socket: Connection;
    classes: Record<string, any>;
    mobile: unknown;
}

interface AdapterInfoDialogState {
    text: string | null;
}

class AdapterInfoDialog extends Component<AdapterInfoDialogProps, AdapterInfoDialogState> {
    private readonly t: typeof I18n.t;

    constructor(props: AdapterInfoDialogProps) {
        super(props);

        this.state = {
            text: null,
        };

        this.t = props.t;
    }

    async componentDidMount() {
        // https://github.com/iobroker-community-adapters/ioBroker.acme/blob/main/README.md =>
        // https://raw.githubusercontent.com/iobroker-community-adapters/ioBroker.acme/main/README.md
        const link = this.props.link.replace('github.com', 'raw.githubusercontent.com').replace('blob/', '');

        try {
            console.log(link);
            const data = await fetch(link);
            let readme = await data.text();

            readme = readme.replace(/\(([-\w]+)\/adapterref\//g, '(https://www.iobroker.net/$1/adapterref/');
            readme = readme.replace(/src="([-\w]+)\/adapterref\//g, 'src="https://www.iobroker.net/zh-cn/adapterref/');

            this.setState({ text: readme });
        } catch (error) {
            window.alert(error);
        }
    }

    openTab(path: string): void {
        const tab = window.open(path, '_blank');
        tab.focus();
    }

    static closeDialog():void {
        Router.doNavigate('tab-adapters');
    }

    /**
     * Transform the link prop to point to the raw file
     */
    transformLink(): string {
        return this.props.link.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/');
    }

    render() {
        const link = this.transformLink();

        if (!this.state.text) {
            return <Loader theme={this.props.theme} />;
        }
        const { classes } = this.props;

        return <Grid
            item
            container
            direction="column"
            wrap="nowrap"
            className={classes.root}
        >
            <Markdown
                className={classes.scroll}
                text={this.state.text}
                language={I18n.getLanguage()}
                theme={this.props.theme}
                themeType={this.props.themeType}
                mobile={this.props.mobile}
                editMode={false}
                socket={this.props.socket}
                adapter={this.props.adapter}
                // https://github.com/ioBroker/ioBroker.admin/blob/master/README.md =>
                // https://raw.githubusercontent.com/ioBroker/ioBroker.admin/master/README.md
                link={link}
            />
            <AppBar color="default" position="static">
                <Toolbar>
                    <Grid container spacing={1}>
                        <Grid item>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => this.openTab(this.props.link)}
                                startIcon={<LinkIcon />}
                            >
                                {this.t('Open original')}
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                variant="contained"
                                /** @ts-expect-error is ok */
                                color="grey"
                                onClick={() => AdapterInfoDialog.closeDialog()}
                                startIcon={<CloseIcon />}
                            >
                                {this.t('Close')}
                            </Button>
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>
        </Grid>;
    }
}

export default withStyles(styles)(AdapterInfoDialog);
