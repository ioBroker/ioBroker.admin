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
        this.t = this.translate;
        this.wordCache = {};
        this.objects = {};
    }

    componentDidMount() {
        this.props.socket.getObjects(true, true)
            .then(objects =>
                this.objects = objects)
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
                    themeName={this.props.themeName}
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
                            themeType={this.props.themeType}
                            extendObject={async (adapter, file, data) => {
                                let promise;
                                if (file && typeof file === 'object') {
                                    const obj = file;
                                    // it is setObject
                                    promise = this.props.socket.getObject(obj._id)
                                        .then(oldObj => {
                                            oldObj.acl = obj.acl;
                                            return this.props.socket.setObject(oldObj._id, oldObj)
                                                .then(() => oldObj);
                                        });
                                } else if (file) {
                                    if ((data.owner || data.ownerGroup) && data.permissions) {
                                        promise = this.props.socket.chownFile(adapter, file, {owner: data.owner, ownerGroup: data.ownerGroup})
                                            .then(() => this.props.socket.chmodFile(adapter, file, {mode: data.permissions}));
                                    } else
                                    if (data.permissions) {
                                        promise = this.props.socket.chmodFile(adapter, file, {mode: data.permissions});
                                    } else if (data.owner || data.ownerGroup) {
                                        promise = this.props.socket.chownFile(adapter, file, {owner: data.owner, ownerGroup: data.ownerGroup});
                                    }
                                }

                                if (promise) {
                                    const result = await promise;
                                    if (result.entries) {
                                        if (result?.entries) {
                                            for ( let i = 0; i < result?.entries.length; i++) {
                                                await context.updateItemsAcl([{id: adapter + '/' + (result.entries[i].path ? result.entries[i].path + '/' : '') + result.entries[i].file, acl: result.entries[i].acl}]);
                                            }
                                        }
                                    } else if (result) {
                                        await context.updateItemsAcl([{id: result._id, acl: result.acl}]);
                                    }
                                }
                            }}
                            selected={context.state.selected}
                            folders={context.state.folders}
                            objects={this.objects}
                            socket={this.props.socket}
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
    themeType: PropTypes.string,
};

export default Files;