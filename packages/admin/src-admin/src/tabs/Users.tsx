import React, { type JSX } from 'react';

import {
    type AdminConnection,
    type IobTheme,
    type ThemeType,
    type Translate,
    TabContainer,
    TabContent,
} from '@iobroker/adapter-react-v5';

import UsersList from '../components/Users/UsersList';

interface UsersProps {
    t: Translate;
    lang: ioBroker.Languages;
    socket: AdminConnection;
    ready: boolean;
    expertMode: boolean;
    themeType: ThemeType;
    theme: IobTheme;
}

export default function Users(props: UsersProps): JSX.Element {
    return (
        <TabContainer>
            <TabContent
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'auto',
                }}
            >
                <UsersList
                    t={props.t}
                    lang={props.lang}
                    socket={props.socket}
                    ready={props.ready}
                    expertMode={props.expertMode}
                    themeType={props.themeType}
                    theme={props.theme}
                />
            </TabContent>
        </TabContainer>
    );
}
