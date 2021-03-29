import { Component } from 'react';

import PropTypes from 'prop-types';
import LinearProgress from '@material-ui/core/LinearProgress';

import FileBrowser from '../components/FileBrowser';

import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';
import FileEditOfAccessControl from '../dialogs/FileEditOfAccessControl';

class Files extends Component {

    constructor(props) {
        super(props);

        this.state = {

        };
        this.t = this.translate;
        this.wordCache = {};
    }

    componentDidMount() {
        this.props.socket.getObjects(false,true).then(objects => {
            this.objects = objects;
        })
    }

    translate = (word, arg1, arg2) => {
        if (arg1 !== undefined) {
            return this.props.t(word, arg1, arg2);
        }

        if (!this.wordCache[word]) {
            this.wordCache[word] = this.props.t(word);
        }

        return this.wordCache[word];
    }

    render() {
        if (!this.props.ready) {
            return <LinearProgress />;
        }

        return <TabContainer>
            <TabContent overflow="auto">
                <FileBrowser
                    showViewTypeButton={true}
                    ready={this.props.ready}
                    socket={this.props.socket}
                    lang={this.props.lang}
                    t={this.props.t}
                    showToolbar={true}
                    allowUpload={true}
                    allowView={true}
                    allowDownload={true}
                    allowCreateFolder={true}
                    allowDelete={true}
                    expertMode={this.props.expertMode}
                    modalEditOfAccessControl={(context, objData) =>
                        <FileEditOfAccessControl
                            open={context.state.modalEditOfAccess}
                            extendObject={(id, data) => {
                                context.extendObject(id, data);
                                objData.aclTooltip = null;
                            }}
                            selected={context.state.selected}
                            folders={context.state.folders}
                            objects={this.objects}
                            t={this.t}
                            onClose={() => context.setState({ modalEditOfAccess: false, modalEditOfAccessObjData: null })}
                            onApply={() => context.setState({ modalEditOfAccess: false, modalEditOfAccessObjData: null })} />
                    }
                />
            </TabContent>
        </TabContainer>;
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