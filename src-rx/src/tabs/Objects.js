import withWidth from '@material-ui/core/withWidth';

import React from 'react';
import PropTypes from 'prop-types';

import ObjectBrowser from '../components/ObjectBrowser';
import ObjectCustomDialog from '../dialogs/ObjectCustomDialog';
import Router from '@iobroker/adapter-react/Components/Router';
import ObjectBrowserValue from '../components/ObjectBrowserValue';
import ObjectBrowserEditObject from '../components/ObjectBrowserEditObject';

class Objects extends React.Component {

    constructor(props) {

        super(props);

        this.filters = window.localStorage.getItem(this.dialogName) || '{}';

        try {
            this.filters = JSON.parse(this.filters);
        } catch (e) {
            this.filters = {};
        }

        this.state =  {
            selected: this.props.selected || '',
            name:     ''
        };
    }

    render() {
        return (
            <ObjectBrowser
                prefix={ this.props.prefix }
                defaultFilters={ this.filters }
                statesOnly={ this.props.statesOnly }
                style={ {width: '100%', height: '100%'} }
                socket={ this.props.socket }
                selected={ this.state.selected }
                name={ this.state.name }
                expertMode={ this.props.expertMode }
                t={ this.props.t }
                lang={ this.props.lang }
                themeName={ this.props.themeName }
                objectCustomDialog={ ObjectCustomDialog }
                objectBrowserValue={ ObjectBrowserValue }
                objectBrowserEditObject={ ObjectBrowserEditObject }
                router={ Router }
                onFilterChanged={ filterConfig => {
                    this.filters = filterConfig;
                    window.localStorage.setItem(this.dialogName, JSON.stringify(filterConfig));
                }}
            />
        );
    }
}

Objects.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    themeName: PropTypes.string,
    expertMode: PropTypes.bool,
};

export default withWidth()(Objects);