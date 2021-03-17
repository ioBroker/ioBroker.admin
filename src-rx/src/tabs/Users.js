import { Component } from 'react';

import PropTypes from 'prop-types';
// import LinearProgress from '@material-ui/core/LinearProgress';

import UsersList from '../components/Users/UsersList';

import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';

class Users extends Component {

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
            <TabContent overflow="auto">
                <div>
                    <UsersList {...this.props} />
                </div>
            </TabContent>
        </TabContainer>;
    }
}

Users.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    ready: PropTypes.bool,
    expertMode: PropTypes.bool,
};

export default Users;