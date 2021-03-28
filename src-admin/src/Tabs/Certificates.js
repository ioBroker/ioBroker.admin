import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import CustomCheckbox from '../Components/CustomCheckbox';
import CustomInput from '../Components/CustomInput';
import HintComponent from '../Components/HintComponent';
import logo from '../assets/le.png';

import I18n from '@iobroker/adapter-react/i18n';

const styles = theme => ({
    tab: {
        width: '100%',
        minHeight: '100%'
    },
    column: {
        display: 'inline-block',
        verticalAlign: 'top',
        marginRight: 20
    },
    columnSettings: {
        width: 'calc(100% - 10px)'
    },
    logoWidth: {
        width: 200
    },
    fontSize: {
        '@media screen and (max-width: 460px)': {
            '& > *': {
                fontSize: '3.2vw',
            }
        }
    }

});

class Certificates extends Component {
    render() {
        const { classes, native, onChange, common: { readme } } = this.props;
        return <form className={classes.tab}>
            <img className={classes.logoWidth} alt='logo' src={logo} />
            <div className={`${classes.column} ${classes.columnSettings}`}>
                <div>
                    <CustomCheckbox
                        title='Use Lets Encrypt certificates'
                        attr='leEnabled'
                        className={classes.fontSize}
                        native={native}
                        onChange={onChange}
                    />
                    <HintComponent openLink={() =>
                        window.open(`${readme}#lets-encrypt-certificates`, '_blank')} />
                </div>
                <div style={native['leEnabled'] ? { display: 'block' } : { display: 'none' }}>
                    <CustomCheckbox
                        title='Use this instance for automatic update'
                        attr='leUpdate'
                        className={classes.fontSize}
                        native={native}
                        onChange={onChange}
                    />
                </div>
                <div style={native['leUpdate'] && native['leEnabled'] ? { display: 'block' } : { display: 'none' }}>
                    <CustomInput
                        title='Port to check the domain'
                        attr='lePort'
                        type='number'
                        style={{ marginTop: -1 }}
                        native={native}
                        onChange={onChange}
                    />
                </div>
            </div>
        </form>;
    }
}

Certificates.propTypes = {
    common: PropTypes.object.isRequired,
    native: PropTypes.object.isRequired,
    instance: PropTypes.number.isRequired,
    adapterName: PropTypes.string.isRequired,
    onError: PropTypes.func,
    onLoad: PropTypes.func,
    onChange: PropTypes.func,
    changed: PropTypes.bool,
    socket: PropTypes.object.isRequired,
};

export default withStyles(styles)(Certificates);
