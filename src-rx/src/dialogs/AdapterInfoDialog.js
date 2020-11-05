import { Component } from 'react';

import ReactMarkdown from 'react-markdown';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import { AppBar } from '@material-ui/core';
import { Box } from '@material-ui/core';
import { Button } from '@material-ui/core';
import { Grid } from '@material-ui/core';
import { Tab } from '@material-ui/core';
import { Tabs } from '@material-ui/core';
import { Toolbar } from '@material-ui/core';

import Router from '@iobroker/adapter-react/Components/Router';

const styles = {
    root: {
        height: '100%'
    },
    scroll: {
        height: '100%',
        overflowY: 'auto',
        '& img': {
            maxWidth: '100%'
        }
    }
};

class AdapterInfoDialog extends Component {

    constructor(props) {

        super(props);

        const uri = this.props.link.replace('https://github.com', 'https://raw.githubusercontent.com').replace('blob/', '');
        const rawUri = uri.substring(0, uri.lastIndexOf('/') + 1);

        this.state = {
            tab: 0,
            readme: '',
            uri,
            rawUri
        };

        this.t = props.t;
    }

    async componentDidMount() {
        try {
            const data = await fetch(this.state.uri);
            const readme = await data.text();
            const splitted = this.splitReadMe(readme);

            this.setState(splitted);
        } catch(error) {
            window.alert(error);
        }
    }

    trimArr(lines) {

        let j = lines.length - 1;

        while (j >= 0 && !lines[j]) {
            j--;
        }

        if (j !== lines.length - 1) {
            lines.splice(j + 1);
        }

        return lines;
    }

    splitReadMe(html, link) {

        const result = {logo: '', readme: [], changelog: [], license: []};
        let lines = html.trim().split(/\r\n|\n/);

        // second line is main title
        if (lines[2].match(/^#\sio/)) {
            lines.splice(2, 1);
        }

        if (lines[1].match(/^#\sio/)) {
            lines.splice(1, 1);
        }
        // first line is logo
        if (lines[0].match(/!\[[-_\w\d]*]\([-._\w\d/]+\.png\)/)) {
            result.logo = link + lines[0].match(/\((.+)\)/)[1];
            lines.splice(0, 1);
        }

        let part = 'readme';

        for (let i = 0; i < lines.length; i++) {
            
            if (lines[i].match(/^====/)) {
                continue;
            }

            if (lines[i].match(/^###?\s+Changelog/)) {
                part = 'changelog';
                continue;

            } else if (lines[i].match(/^###?\s+License/)) {
                part = 'license';
                continue;
            } else if (lines[i].match(/^##?\s+.+/)) {
                part = 'readme';
            }

            if (!result[part].length && !lines[i]) {
                continue;
            }

            result[part].push(lines[i]);
        }

        

        if (result.logo) {
           // that.$divLogo.html('<img src="' + result.logo + '" />').show();
        } else {
           // that.$divLogo.html('').hide();
        }

        this.trimArr(result.readme);
        this.trimArr(result.changelog);
        this.trimArr(result.license);

        if (result.readme.length) {
            result.readme = result.readme.join('\n');
        } else {
            result.readme = '';
        }
        if (result.changelog.length) {
            result.changelog = result.changelog.join('\n');
        } else {
            delete result.changelog;
        }
        if (result.license.length) {
            result.license[0] = '## ' + result.license[0];
            result.license = result.license.join('\n');
        } else {
            delete result.license;
        }

        return result;
    }

    changeTab(event, newValue) {
        this.setState({
            tab: newValue
        });
    }

    openTab(path) {
        const tab = window.open(path, '_blank');
        tab.focus();
    }

    closeDialog() {
        Router.doNavigate('tab-adapters');
    }

    transformUri(uri) {
        return (uri && uri.startsWith('http') ? '' : this.state.rawUri) + uri;
    }

    render() {

        const { classes } = this.props;
        const { tab } = this.state;

        return (
            <Grid
                item
                container
                direction="column"
                wrap="nowrap"
                className={ classes.root }
            >
                <AppBar color="default" position="static">
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
                </Box>
                <AppBar  color="default" position="static">
                    <Toolbar>
                        <Grid container spacing={ 1 }>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={ () => this.openTab(this.props.link) }
                                >
                                    { this.t('Open original') }
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={ () => this.closeDialog() }
                                >
                                    { this.t('Close') }
                                </Button>
                            </Grid>
                        </Grid>
                    </Toolbar>
                </AppBar>
            </Grid>
        );
    }
}

AdapterInfoDialog.propTypes = {
    link: PropTypes.string,
    t: PropTypes.func
};

export default withStyles(styles)(AdapterInfoDialog);