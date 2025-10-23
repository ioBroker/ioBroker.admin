import React, { Component, type JSX } from 'react';

import { LinearProgress } from '@mui/material';

import {
    type AdminConnection,
    type IobTheme,
    type ThemeType,
    type Translate,
    TabContainer,
    TabContent,
    FileBrowser,
    type FileBrowserClass,
    type MetaObject,
} from '@iobroker/adapter-react-v5';

import { FileEditor } from '../components/FileEditor';
import FileEditOfAccessControl from '../dialogs/FileEditOfAccessControl';

interface FilesProps {
    t: Translate;
    lang: ioBroker.Languages;
    socket: AdminConnection;
    ready: boolean;
    expertMode: boolean;
    themeType: ThemeType;
    theme: IobTheme;
}

class Files extends Component<FilesProps> {
    private readonly t: Translate;

    private readonly wordCache: Record<string, string>;

    private objects: Record<string, ioBroker.Object>;

    constructor(props: FilesProps) {
        super(props);
        this.t = this.translate;
        this.wordCache = {};
        this.objects = {};
    }

    componentDidMount(): void {
        void this.props.socket.getObjects(true, true).then(objects => (this.objects = objects));
    }

    translate = (word: string, arg1?: any, arg2?: any): string => {
        if (arg1 !== undefined) {
            return this.props.t(word, arg1, arg2);
        }

        if (!this.wordCache[word]) {
            this.wordCache[word] = this.props.t(word);
        }

        return this.wordCache[word];
    };

    renderAclDialog(context: FileBrowserClass): JSX.Element {
        return (
            <FileEditOfAccessControl
                theme={this.props.theme}
                themeType={this.props.themeType}
                applyChangesToObject={async (fileObj: MetaObject) => {
                    // it is setObject
                    const oldObj = (await this.props.socket.getObject(fileObj._id)) as MetaObject;
                    oldObj.acl = fileObj.acl;
                    await this.props.socket.setObject(oldObj._id, oldObj);
                    const result: MetaObject = oldObj;

                    if (result?.acl) {
                        context.updateItemsAcl([
                            {
                                id: result._id,
                                acl: result.acl,
                                level: 0, // not used
                                name: result._id, // not used
                                folder: false, // not used
                            },
                        ]);
                    }
                }}
                applyChangesToFile={async (adapter: string, file: string, data: Partial<ioBroker.FileACL>) => {
                    let result: ioBroker.ChownFileResult[] | undefined;
                    if ((data.owner || data.ownerGroup) && data.permissions) {
                        await this.props.socket.chownFile(adapter, file, {
                            owner: data.owner,
                            ownerGroup: data.ownerGroup,
                        });
                        result = await this.props.socket.chmodFile(adapter, file, { mode: data.permissions });
                    } else if (data.permissions) {
                        result = await this.props.socket.chmodFile(adapter, file, { mode: data.permissions });
                    } else if (data.owner || data.ownerGroup) {
                        result = await this.props.socket.chownFile(adapter, file, {
                            owner: data.owner,
                            ownerGroup: data.ownerGroup,
                        });
                    }

                    if (Array.isArray(result)) {
                        for (let i = 0; i < result.length; i++) {
                            const item = result[i];
                            if (item && item.file && item.acl) {
                                context.updateItemsAcl([
                                    {
                                        id: `${adapter}/${item.path ? `${item.path}/` : ''}${item.file}`,
                                        acl: item.acl as ioBroker.EvaluatedFileACL,
                                        level: 0, // not used
                                        name: '', // not used
                                        folder: false, // not used
                                    },
                                ]);
                            }
                        }
                    }
                    // deprecated
                    // } else if (result?.entries) {
                    //     for (let i = 0; i < result.entries.length; i++) {
                    //         const item =  result.entries[i];
                    //         if (item && item.file && item.acl) {
                    //             context.updateItemsAcl([{ id: `${adapter}/${item.path ? `${item.path}/` : ''}${item.file}`, acl: item.acl }]);
                    //         }
                    //     }
                    // }
                }}
                selected={context.state.selected}
                folders={context.state.folders}
                objects={this.objects}
                socket={this.props.socket}
                t={this.t}
                onClose={() => context.setState({ modalEditOfAccess: false })}
                onApply={() => context.setState({ modalEditOfAccess: false })}
            />
        );
    }

    render(): JSX.Element {
        if (!this.props.ready) {
            return <LinearProgress />;
        }

        return (
            <TabContainer>
                <TabContent overflow="auto">
                    <FileBrowser
                        showViewTypeButton
                        ready={this.props.ready}
                        socket={this.props.socket}
                        themeType={this.props.themeType}
                        theme={this.props.theme}
                        lang={this.props.lang}
                        t={this.props.t}
                        showToolbar
                        allowUpload
                        allowView
                        allowDownload
                        allowCreateFolder
                        allowDelete
                        expertMode={this.props.expertMode}
                        modalEditOfAccessControl={(context: FileBrowserClass) => this.renderAclDialog(context)}
                        FileViewer={FileEditor}
                    />
                </TabContent>
            </TabContainer>
        );
    }
}

export default Files;
