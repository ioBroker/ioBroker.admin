import React, { type JSX } from 'react';

import {
    type AdminConnection,
    type IobTheme,
    type ThemeType,
    type Translate,
    TabContainer,
    TabContent,
} from '@iobroker/adapter-react-v5';

import EnumsMain from '../components/Enums/EnumsMain';

interface EnumsProps {
    t: Translate;
    lang: ioBroker.Languages;
    socket: AdminConnection;
    themeType: ThemeType;
    theme: IobTheme;
}

export default function Enums(props: EnumsProps): JSX.Element {
    return (
        <TabContainer>
            <TabContent style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                <EnumsMain
                    socket={props.socket}
                    t={props.t}
                    lang={props.lang}
                    themeType={props.themeType}
                    theme={props.theme}
                />
            </TabContent>
        </TabContainer>
    );
}
