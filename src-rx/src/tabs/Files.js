import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import React from 'react';
import PropTypes from 'prop-types';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';

import FileBrowser from "../components/FileBrowser";

const styles = theme => ({
    root: {
        paddingTop: 5,
        paddingLeft: 5,
        width: 'calc(100% - 10px)',
        height: 'calc(100% - 10px)',
        overflow: 'hidden',
        position: 'relative',
    }
});


class Files extends React.Component {
    constructor(props) {
        super(props);

        this.state = {

        };
    }

    render() {
        if (!this.props.ready) {
            return (
                <LinearProgress />
            );
        }

        return <Paper className={ this.props.classes.root }>
            <FileBrowser
                ready={ this.props.ready }
                socket={ this.props.socket }
                lang={ this.props.lang }
                t={ this.props.t }
                showToolbar={ true }
                allowUpload={ true }
                allowDownload={ true }
                allowCreateFolder={ true }
                allowDelete={ true }
                expertMode={ this.props.expertMode }
            />
        </Paper>;
    }
}

Files.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    ready: PropTypes.bool,
    expertMode: PropTypes.bool,
};

export default withWidth()(withStyles(styles)(Files));