import { Component } from 'react';

import PropTypes from 'prop-types';
// import LinearProgress from '@material-ui/core/LinearProgress';

import EnumsMain from '../components/Enums/EnumsMain';

import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';

class Enums extends Component {

    constructor(props) {
        super(props);

        this.state = {

        };
    }

    render() {

        if (!this.props.ready) {
            // return (
            //     <LinearProgress />
            // );
        }

        return <TabContainer>
            <TabContent style={{display: 'flex', flexDirection: 'column', overflow:"auto" }}>
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
};

export default Enums;