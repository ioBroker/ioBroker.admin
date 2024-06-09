import React from 'react';

import type { AdminConnection, ThemeType, Translate } from '@iobroker/adapter-react-v5';

import UsersList from '../components/Users/UsersList';
import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';

interface UsersProps {
    t: Translate;
    lang: ioBroker.Languages;
    socket: AdminConnection;
    ready: boolean;
    expertMode: boolean;
    themeType: ThemeType;
}

export default function Users(props: UsersProps) {
    return <TabContainer>
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
            />
        </TabContent>
    </TabContainer>;
}
