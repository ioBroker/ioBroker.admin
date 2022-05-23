import { Component } from 'react';
import PropTypes from 'prop-types';

import EnumsMain from '../components/Enums/EnumsMain';
import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';

class Enums extends Component {
    render() {
        return <TabContainer>
            <TabContent style={{display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                <EnumsMain {...this.props} />
            </TabContent>
        </TabContainer>;
    }
}

Enums.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    ready: PropTypes.bool,
    expertMode: PropTypes.bool,
    themeType: PropTypes.string,
};

export default Enums;