import React from 'react';

import { type AdminConnection, type Translate, type ThemeType, type ThemeName } from '@iobroker/adapter-react-v5';

import type { AdminGuiConfig } from '@/types';

export interface BaseSystemSettingsDialogProps {
    t: Translate;
    saving: boolean;
    onChange: (data: any, dataAux: any, cb: () => void) => void;

    data?: any;
    activeRepo?: string[];
    users?: ioBroker.UserObject[];
    adminGuiConfig?: AdminGuiConfig;
    dataAux?: any;
    handle?: (type: 'none' | 'extended' | 'no-city') => void;
    groups?: ioBroker.GroupObject[];
    multipleRepos?: boolean;
    activeRep?: string[];
    repoInfo?: Record<string, ioBroker.RepoInfo>;
    histories?: string[];
    themeName?: ThemeName;
    themeType?: ThemeType;
    host?: string;
    socket?: AdminConnection;
}

abstract class BaseSystemSettingsDialog<P = undefined, S extends object = object> extends React.Component<
    P extends undefined ? BaseSystemSettingsDialogProps : P,
    S
> {}

export default BaseSystemSettingsDialog;
