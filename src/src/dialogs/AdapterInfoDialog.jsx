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

        // const uri = `https://www.iobroker.net/${I18n.getLanguage()}/adapterref/iobroker.${props.adapter}/README.md`;
        // this.props.link.replace('https://github.com', 'https://raw.githubusercontent.com').replace('blob/', '');
        // const uriGithub = this.props.link.replace('https://github.com', 'https://raw.githubusercontent.com').replace('blob/', '');
        // const rawUri = uriGithub.replace('blob/', '').substring(0, uriGithub.lastIndexOf('/') + 1);

        this.state = {
        //     tab: 0,
        //     readme: '',
        //     uri,
        //     rawUri,
        //     uriGithub,
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
            /*
            const lines = readme.split('\n');
            if (lines[0].trim() === '---') {
                let i = 1;
                while(lines[i] !== '---') i++;
                lines.splice(0, i + 1);
                readme = lines.join('\n');
                lines.unshift(`![Logo](admin/${this.props.adapter}.png)`);
                lines.unshift('# ioBroker.' + this.props.adapter);
                lines.unshift('');
            }
            const split = this.splitReadMe(readme);
            */
            readme = readme.replace(/\(([-\w]+)\/adapterref\//g, '(https://www.iobroker.net/$1/adapterref/');
            /*
            readme = readme.replace(/\(en\/adapterref\//g, '(https://www.iobroker.net/en/adapterref/');
            readme = readme.replace(/\(de\/adapterref\//g, '(https://www.iobroker.net/de/adapterref/');
            readme = readme.replace(/\(zh-cn\/adapterref\//g, '(https://www.iobroker.net/zh-cn/adapterref/');
            readme = readme.replace(/\(zh-cn\/adapterref\//g, '(https://www.iobroker.net/zh-cn/adapterref/');
            */
            readme = readme.replace(/src="([-\w]+)\/adapterref\//g, 'src="https://www.iobroker.net/zh-cn/adapterref/');
            // readme = readme.replace(/(<meta[^>]+>)/g, '\\$1');

            this.setState({ text: readme });
        } catch (error) {
            window.alert(error);
        }
    }

    // static trimArr(lines) {
    //     let j = lines.length - 1;
    //
    //     while (j >= 0 && !lines[j]) {
    //         j--;
    //     }
    //
    //     if (j !== lines.length - 1) {
    //         lines.splice(j + 1);
    //     }
    //
    //     return lines;
    // }

    // static splitReadMe(html, link) {
    //     const result = {
    //         logo: '', readme: [], changelog: [], license: [],
    //     };
    //     const lines = html.trim().split(/\r\n|\n/);
    //
    //     // second line is main title
    //     if (lines[2].match(/^#\sio/)) {
    //         lines.splice(2, 1);
    //     }
    //
    //     if (lines[1].match(/^#\sio/)) {
    //         lines.splice(1, 1);
    //     }
    //     // first line is logo
    //     if (lines[0].match(/!\[[-_\w\d]*]\([-._\w\d/]+\.png\)/)) {
    //         result.logo = link + lines[0].match(/\((.+)\)/)[1];
    //         lines.splice(0, 1);
    //     }
    //
    //     let part = 'readme';
    //
    //     for (let i = 0; i < lines.length; i++) {
    //         if (lines[i].match(/^====/)) {
    //             continue;
    //         }
    //
    //         if (lines[i].match(/^###?\s+Changelog/)) {
    //             part = 'changelog';
    //             continue;
    //         } else if (lines[i].match(/^###?\s+License/)) {
    //             part = 'license';
    //             continue;
    //         } else if (lines[i].match(/^##?\s+.+/)) {
    //             part = 'readme';
    //         }
    //
    //         if (!result[part].length && !lines[i]) {
    //             continue;
    //         }
    //
    //         result[part].push(lines[i]);
    //     }
    //
    //     if (result.logo) {
    //         // that.$divLogo.html('<img src="' + result.logo + '" />').show();
    //     } else {
    //         // that.$divLogo.html('').hide();
    //     }
    //
    //     this.trimArr(result.readme);
    //     this.trimArr(result.changelog);
    //     this.trimArr(result.license);
    //
    //     if (result.readme.length) {
    //         result.readme = result.readme.join('\n');
    //     } else {
    //         result.readme = '';
    //     }
    //     if (result.changelog.length) {
    //         result.changelog = result.changelog.join('\n');
    //     } else {
    //         delete result.changelog;
    //     }
    //     if (result.license.length) {
    //         result.license[0] = `## ${result.license[0]}`;
    //         result.license = result.license.join('\n');
    //     } else {
    //         delete result.license;
    //     }
    //
    //     return result;
    // }

    // changeTab(event, newValue) {
    //     this.setState({ tab: newValue });
    // }

    // openTab(path) {
    //     const tab = window.open(path, '_blank');
    //     tab.focus();
    // }

    static closeDialog() {
        Router.doNavigate('tab-adapters');
    }
    //
    // transformUri(uri) {
    //     return (uri && uri.startsWith('http') ? '' : this.state.rawUri) + uri;
    // }

    render() {
        if (!this.state.text) {
            return <Loader theme={this.props.theme} />;
        }
        const { classes } = this.props;
        // const { tab } = this.state;

        return <Grid
            item
            container
            direction="column"
            wrap="nowrap"
            className={classes.root}
        >
            {/* <AppBar color="default" position="static">
                <Tabs value={ this.state.tab } onChange={ (event, newValue) => this.changeTab(event, newValue) }>
                    <Tab label="README" disabled={ !this.state.readme }/>
                    <Tab label="Changelog" disabled={ !this.state.changelog }/>
                    <Tab label="License" disabled={ !this.state.license }/>
                </Tabs>
            </AppBar>
            <Box p={ 3 } className={ classes.scroll }>
                <ReactMarkdown
                    source={ this.state[tab === 1 ? 'changelog' : tab === 2 ? 'license' : 'readme'] }
                    linkTarget="_blank"
                    transformLinkUri={ (uri) => this.transformUri(uri) }
                    transformImageUri={ (uri) => this.transformUri(uri) }
                    escapeHtml={ false }
                />
            </Box> */}
            <Markdown
                className={classes.scroll}
                text={this.state.text}
                language={I18n.getLanguage()}
                theme={this.props.theme}
                themeName={this.props.themeName}
                themeType={this.props.themeType}
                mobile={this.props.mobile}
                editMode={false}
                socket={this.props.socket}
                adapter={this.props.adapter}
                //                https://github.com/ioBroker/ioBroker.admin/blob/master/README.md =>
                // https://raw.githubusercontent.com/ioBroker/ioBroker.admin/master/README.md
                link={this.props.link.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/')}
                // onNavigate={(language, tab, page, chapter) => this.onNavigate(language, tab, page, chapter)}
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
    themeName: PropTypes.string,
    themeType: PropTypes.string,
    socket: PropTypes.object,
};

export default withStyles(styles)(AdapterInfoDialog);
