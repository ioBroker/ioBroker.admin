import React from 'react';

import ReactMarkdown from 'react-markdown';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Toolbar from '@material-ui/core/Toolbar';

import Router from '@iobroker/adapter-react/Components/Router';

const styles = {
    root: {
        height: '100%'
    },
    scroll: {
        height: '100%',
        overflowY: 'auto'
    }
};

class AdapterInfoDialog extends React.Component {

    constructor(props) {

        super(props);

        let rawUri = this.props.link.replace('https://github.com', 'https://raw.githubusercontent.com').replace('blob/', '');
        rawUri = rawUri.substring(0, rawUri.lastIndexOf('/') + 1);

        this.state = {
            tab: 0,
            readme: '',
            rawUri
        };

        this.t = props.t;
    }

    async componentDidMount() {

        const link = this.props.link.replace('https://github.com', 'https://raw.githubusercontent.com').replace('blob/', '');

        const data = await fetch(link);
        const readme = await data.text();
        const splitted = this.splitReadMe(readme);

        this.setState(splitted);
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

    transformImageUri(uri) {
        return (uri.startsWith('http') ? '' : this.state.rawUri) + uri;
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
                            <Tab label="README" />
                            <Tab label="Changelog" />
                            <Tab label="License" />
                        </Tabs>
                    </AppBar>
                    <Box p={ 3 } className={ classes.scroll }>
                        <ReactMarkdown
                            source={ this.state[tab === 1 ? 'changelog' : tab === 2 ? 'license' : 'readme'] }
                            linkTarget="_blank"
                            transformLinkUri={ (uri) => console.log(uri) }
                            transformImageUri={ (uri) => this.transformImageUri(uri) }
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