import type { Translate } from '@/types';
import type { AdminConnection } from '@iobroker/socket-client';
import React, { Component } from 'react';

interface BaseSystemSettingsDialogProps {
    adminGuiConfig: ioBroker.Object;
    onChange: (data: any, dataAux: any, cb: () => void) => void;
    data: any;
    dataAux: any;
    handle: (type: string) => void;
    users: ioBroker.UserObject[];
    groups: ioBroker.GroupObject[];
    multipleRepos: boolean;
    activeRepo: string[];
    repoInfo: Record<string, ioBroker.RepoInfo>;
    histories: string[];
    themeName: string;
    themeType: string;
    host: string;
    t: Translate;
    socket: AdminConnection;
    saving: boolean;
}

class BaseSystemSettingsDialog<P = undefined, S extends object = object> extends React.Component<P extends undefined ? BaseSystemSettingsDialogProps : P, S> {
}

export default BaseSystemSettingsDialog;
