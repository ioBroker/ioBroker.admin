import React from 'react';

import { type AdminConnection, type Translate, type ThemeType, type ThemeName } from '@iobroker/adapter-react-v5';

import type { AdminGuiConfig } from '@/types';

export interface BaseSystemSettingsDialogProps {
    adminGuiConfig: AdminGuiConfig;
    onChange: (data: any, dataAux: any, cb: () => void) => void;
    data: any;
    dataAux: any;
    handle: (type: 'none' | 'extended' | 'no-city') => void;
    users: ioBroker.UserObject[];
    groups: ioBroker.GroupObject[];
    multipleRepos: boolean;
    activeRepo: string[];
    repoInfo: Record<string, ioBroker.RepoInfo>;
    histories: string[];
    themeName: ThemeName;
    themeType: ThemeType;
    host: string;
    t: Translate;
    socket: AdminConnection;
    saving: boolean;
}

abstract class BaseSystemSettingsDialog<P = undefined, S extends object = object> extends React.Component<
    P extends undefined ? BaseSystemSettingsDialogProps : P,
    S
> {}

export default BaseSystemSettingsDialog;
