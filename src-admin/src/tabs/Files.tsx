import React, { Component, type JSX } from 'react';

import { LinearProgress } from '@mui/material';

import {
    type AdminConnection,
    type IobTheme,
    type ThemeType,
    type Translate,
    Router,
    TabContainer,
    TabContent,
    FileBrowser,
    type FileBrowserClass,
    type MetaObject,
} from '@iobroker/gui-components';

import FileEditor from '../components/FileEditor';
import FileEditOfAccessControl from '../dialogs/FileEditOfAccessControl';

/** Modes of the file browser in the URL (`#tab-files/<mode>/<id>`). Other names there, e.g. "system", are dialogs of the App */
const FILE_BROWSER_MODES = ['select', 'view'];

type FilesNavigation = { mode: 'select' | 'view'; id: string };

interface FilesProps {
    t: Translate;
    lang: ioBroker.Languages;
    socket: AdminConnection;
    ready: boolean;
    expertMode: boolean;
    themeType: ThemeType;
    theme: IobTheme;
}

export default class Files extends Component<FilesProps> {
    private readonly t: Translate;

    private readonly wordCache: Record<string, string>;

    private objects: Record<string, ioBroker.Object>;

    /** The last navigation target from the URL, it is kept while a dialog of the App is open */
    private navigateTo: FilesNavigation | null = null;

    constructor(props: FilesProps) {
        super(props);
        this.t = this.translate;
        this.wordCache = {};
        this.objects = {};
    }

    componentDidMount(): void {
        void this.props.socket.getObjects(true, true).then(objects => (this.objects = objects));
    }

    /** The URL shows a dialog of the App (e.g., the system settings) and not a route of the file browser */
    private static isAppDialogOpen(): boolean {
        const dialog = Router.getLocation().dialog;
        return !!dialog && !FILE_BROWSER_MODES.includes(dialog);
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
                applyChangesToFile={async (adapter: string, file: string, _data?: Partial<ioBroker.FileACL>) => {
                    const data = _data || {};
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

        // Derive the browser's navigation from the URL hash `#tab-files/<mode>/<encoded-id>`.
        // File IDs contain "/" (e.g. "email.admin/custom/assets/x.js"), so the id segment is
        // URL-encoded (the Router decodes it again in getLocation). The FileBrowser stays URL-agnostic.
        // A dialog of the App (e.g., the system settings) replaces the route of the browser in the URL.
        // Meanwhile, the last target is kept and nothing is reported, otherwise the browser would write
        // its selection back into the URL and close the dialog immediately.
        if (!Files.isAppDialogOpen()) {
            const location = Router.getLocation();
            this.navigateTo =
                location.tab === 'tab-files' && location.id
                    ? { mode: location.dialog === 'view' ? 'view' : 'select', id: location.id }
                    : null;
        }
        const navigateTo = this.navigateTo;

        return (
            <TabContainer>
                <TabContent overflow="auto">
                    <FileBrowser
                        navigateTo={navigateTo}
                        onNavigateTo={(nav: FilesNavigation | null) => {
                            if (Files.isAppDialogOpen()) {
                                return;
                            }
                            if (!nav?.id) {
                                Router.doNavigate('tab-files');
                            } else {
                                Router.doNavigate('tab-files', nav.mode, encodeURIComponent(nav.id));
                            }
                        }}
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
