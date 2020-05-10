import React from 'react';

import PropTypes from 'prop-types';
import LinearProgress from '@material-ui/core/LinearProgress';

import FileBrowser from '../components/FileBrowser';

import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';

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

        return (
            <TabContainer>
                <TabContent overflow="auto">
                    <FileBrowser
                        ready={ this.props.ready }
                        socket={ this.props.socket }
                        lang={ this.props.lang }
                        t={ this.props.t }
                        showToolbar={ true }
                        allowUpload={ true }
                        allowView={ true }
                        allowDownload={ true }
                        allowCreateFolder={ true }
                        allowDelete={ true }
                        expertMode={ this.props.expertMode }
                    />
                </TabContent>
            </TabContainer>
        );
    }
}

Files.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    ready: PropTypes.bool,
    expertMode: PropTypes.bool,
};

export default Files;