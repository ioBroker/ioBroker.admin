import React from 'react';

import type {
    AdminConnection, ThemeType, Translate,
} from '@iobroker/adapter-react-v5';

import EnumsMain from '../components/Enums/EnumsMain';
import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';

interface EnumsProps {
    t: Translate;
    lang: ioBroker.Languages;
    socket: AdminConnection;
    themeType: ThemeType;
}

function Enums(props: EnumsProps): React.JSX.Element {
    return <TabContainer>
        <TabContent style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <EnumsMain
                socket={props.socket}
                t={props.t}
                lang={props.lang}
                themeType={props.themeType}
            />
        </TabContent>
    </TabContainer>;
}

export default Enums;
