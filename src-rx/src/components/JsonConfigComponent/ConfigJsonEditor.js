import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import { Button } from '@material-ui/core';

import ConfigGeneric from './ConfigGeneric';
import I18n from '@iobroker/adapter-react/i18n';
import CustomModal from '../CustomModal';

import AceEditor from 'react-ace';
import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/ext-language_tools';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    },
    flex: {
        display: 'flex'
    },
    button: {
        height: 48,
        // marginLeft: 4,
        minWidth: 48,
    },
    wrapper: {
        width: 'calc(100vw - 40px)',
        height: 'calc(100vh - 188px)',
    }
});

class ConfigJsonEditor extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        const { data, attr } = this.props;
        const value = ConfigGeneric.getValue(data, attr) || {};
        this.setState({ value, initialized: true });
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.initialized) {
            return null;
        }
        const { classes, schema, data, attr } = this.props;
        const { value, showSelectId } = this.state;
        return <FormControl className={classes.fullWidth}>
            <div className={classes.flex}>
                <Button
                    className={classes.button}
                    size="small"
                    variant="outlined"
                    onClick={() => this.setState({ showSelectId: true })}
                >{I18n.t('Json editor')}</Button>
            </div>
            {showSelectId ? <CustomModal
                title={this.getText(schema.label)}
                open={showSelectId}
                overflowHidden
                onClose={() => this.setState({ showSelectId: false, value: ConfigGeneric.getValue(data, attr) || {} })}
                onApply={() => this.setState({ showSelectId: false }, () => this.onChange(attr, value))}
            >
                <div className={classes.wrapper}>
                    <AceEditor
                        mode="json"
                        theme={this.props.themeName === 'dark' ? 'clouds_midnight' : 'chrome'}
                        value={value}
                        width="100%"
                        height="100%"
                        onChange={newValue => this.setState({ value: newValue })}
                        name="ConfigJsonEditor"
                        fontSize={14}
                        setOptions={{
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                            enableSnippets: true
                        }}
                        editorProps={{ $blockScrolling: true }}
                    />
                </div>
            </CustomModal> : null}
            {schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

ConfigJsonEditor.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(ConfigJsonEditor);