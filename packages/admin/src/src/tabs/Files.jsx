import { Component } from 'react';

import PropTypes from 'prop-types';
import {
    LinearProgress,
} from '@mui/material';

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
                this.objects = objects);
    }

    translate = (word, arg1, arg2) => {
        if (arg1 !== undefined) {
            return this.props.t(word, arg1, arg2);
        }

        if (!this.wordCache[word]) {
            this.wordCache[word] = this.props.t(word);
        }

        return this.wordCache[word];
    };

    render() {
        if (!this.props.ready) {
            return <LinearProgress />;
        }

        return <TabContainer>
            <TabContent overflow="auto">
                <FileBrowser
                    showViewTypeButton
                    ready={this.props.ready}
                    socket={this.props.socket}
                    themeType={this.props.themeType}
                    lang={this.props.lang}
                    t={this.props.t}
                    showToolbar
                    allowUpload
                    allowView
                    allowDownload
                    allowCreateFolder
                    allowDelete
                    expertMode={this.props.expertMode}
                    // eslint-disable-next-line react/no-unstable-nested-components
                    modalEditOfAccessControl={context =>
                        <FileEditOfAccessControl
                            themeType={this.props.themeType}
                            extendObject={async (adapter, file, data) => {
                                let result;
                                if (file && typeof file === 'object') {
                                    const obj = file;
                                    // it is setObject
                                    const oldObj = await this.props.socket.getObject(obj._id);
                                    oldObj.acl = obj.acl;
                                    await this.props.socket.setObject(oldObj._id, oldObj);
                                    result = oldObj;
                                } else if (file) {
                                    if ((data.owner || data.ownerGroup) && data.permissions) {
                                        await this.props.socket.chownFile(adapter, file, { owner: data.owner, ownerGroup: data.ownerGroup });
                                        result = await this.props.socket.chmodFile(adapter, file, { mode: data.permissions });
                                    } else if (data.permissions) {
                                        result = await this.props.socket.chmodFile(adapter, file, { mode: data.permissions });
                                    } else if (data.owner || data.ownerGroup) {
                                        result = await this.props.socket.chownFile(adapter, file, { owner: data.owner, ownerGroup: data.ownerGroup });
                                    }
                                }

                                if (Array.isArray(result)) {
                                    for (let i = 0; i < result.length; i++) {
                                        const item = result[i];
                                        if (item && item.file && item.acl) {
                                            await context.updateItemsAcl([{ id: `${adapter}/${item.path ? `${item.path}/` : ''}${item.file}`, acl: item.acl }]);
                                        }
                                    }
                                } else if (result?.entries) {
                                    for (let i = 0; i < result.entries.length; i++) {
                                        const item =  result.entries[i];
                                        if (item && item.file && item.acl) {
                                            await context.updateItemsAcl([{ id: `${adapter}/${item.path ? `${item.path}/` : ''}${item.file}`, acl: item.acl }]);
                                        }
                                    }
                                } else if (result?.acl) {
                                    await context.updateItemsAcl([{ id: result._id, acl: result.acl }]);
                                }
                            }}
                            selected={context.state.selected}
                            folders={context.state.folders}
                            objects={this.objects}
                            socket={this.props.socket}
                            t={this.t}
                            onClose={() => context.setState({ modalEditOfAccess: false, modalEditOfAccessObjData: null })}
                            onApply={() => context.setState({ modalEditOfAccess: false, modalEditOfAccessObjData: null })}
                        />}
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
