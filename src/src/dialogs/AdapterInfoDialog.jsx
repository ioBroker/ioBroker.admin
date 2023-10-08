import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import {
    AppBar, Button, Grid, Toolbar,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';

import { Router, I18n, Loader } from '@iobroker/adapter-react-v5';

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
};

class AdapterInfoDialog extends Component {
    constructor(props) {
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
            const data = await fetch(link);
            let readme = await data.text();

            readme = readme.replace(/\(([-\w]+)\/adapterref\//g, '(https://www.iobroker.net/$1/adapterref/');
            readme = readme.replace(/src="([-\w]+)\/adapterref\//g, 'src="https://www.iobroker.net/zh-cn/adapterref/');

            this.setState({ text: readme });
        } catch (error) {
            window.alert(error);
        }
    }

    openTab(path) {
        const tab = window.open(path, '_blank');
        tab.focus();
    }

    static closeDialog() {
        Router.doNavigate('tab-adapters');
    }

    render() {
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
                link={this.props.link.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/')}
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

AdapterInfoDialog.propTypes = {
    adapter: PropTypes.string,
    link: PropTypes.string,
    t: PropTypes.func,
    theme: PropTypes.object,
    themeType: PropTypes.string,
    socket: PropTypes.object,
};

export default withStyles(styles)(AdapterInfoDialog);
