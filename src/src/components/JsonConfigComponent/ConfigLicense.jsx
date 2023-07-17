import React from 'react';
import PropTypes from 'prop-types';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    FormControlLabel,
    Checkbox,
} from '@mui/material';

import { Check, Close } from '@mui/icons-material';

import I18n from './wrapper/i18n';

import ConfigGeneric from './ConfigGeneric';

class ConfigLicense extends ConfigGeneric {
    constructor(props) {
        super(props);
        this.scrollRef = React.createRef();
        this.noPlaceRequired = true;
    }

    scrolledDown() {
        if (!this.scrollRef.current) {
            return false;
        }
        return this.scrollRef.current.offsetHeight + this.scrollRef.current.scrollTop >= this.scrollRef.current.scrollHeight;
    }

    componentDidMount() {
        super.componentDidMount();
        if (!ConfigGeneric.getValue(this.props.data, this.props.attr)) {
            if (this.props.schema.licenseUrl) {
                this.setState({ showLicenseDialog: true, loading: true, scrolledDown: false });
                fetch(this.props.schema.licenseUrl)
                    .then(res => res.text())
                    .then(text => this.setState({ license: text, loading: false }))
                    .catch(e => this.setState({ license: e.toString(), loading: false, error: true, scrolledDown: false }));
            } else {
                this.setState({ showLicenseDialog: true, scrolledDown: false });
            }
            setTimeout(() => {
                // install scroll handler
                if (this.scrollRef.current) {
                    const scrolledDown = this.scrolledDown();
                    if (!scrolledDown) {
                        this.scrollRef.current.addEventListener('scroll', () => {
                            if (!this.state.scrolledDown && this.scrolledDown()) {
                                this.setState({ scrolledDown: true });
                            }
                        });
                    } else {
                        this.setState({ scrolledDown: true });
                    }
                }
            }, 1000);
        }
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.showLicenseDialog) {
            return null;
        }

        return <Dialog
            maxWidth="lg"
            open={!0}
            onClose={(e, reason) => {
                if (reason !== 'escapeKeyDown' && reason !== 'backdropClick') {
                    this.setState({ showLicenseDialog: false });
                }
            }}
        >
            <DialogTitle>{this.props.schema.title ? I18n.t(this.props.schema.title) : I18n.t('ra_License agreement')}</DialogTitle>
            <DialogContent>
                    {this.props.schema.licenseUrl ? <>
                        {this.state.loading ? <LinearProgress /> : null}
                        <pre
                            ref={this.scrollRef}
                            style={{ width: '100%', height: '100%', overflowY: 'auto', fontSize: 14 }}
                        >
                            {this.state.license}
                        </pre>
                    </> : null}
                    {!this.props.schema.licenseUrl && this.props.schema.texts ? <div
                        ref={this.scrollRef}
                        style={{ width: '100%', height: '100%', overflowY: 'auto', fontSize: 14 }}
                    >
                        {this.props.schema.texts.map(text => this.props.schema.noTranslation ? <p>{text}</p> : <p>{I18n.t(text)}</p>)}
                    </div> : null}
            </DialogContent>
            <DialogActions>
                {this.props.schema.checkBox ? <FormControlLabel
                    control={<Checkbox checked={!!this.state.licenseChecked} onClick={() => this.setState({ licenseChecked: !this.state.licenseChecked })}/>}
                    label={I18n.t(this.props.schema.checkBox)}
                /> : null}
                <Button
                    disabled={this.state.loading || this.state.error || (this.props.schema.checkBox && !this.state.licenseChecked) || !this.state.scrolledDown}
                    onClick={() => {
                        this.setState({ showLicenseDialog: null });
                        this.onChange(this.props.attr, true);
                    }}
                    color="primary"
                    variant="contained"
                    startIcon={<Check />}
                >
                    {this.props.schema.agreeText ? I18n.t(this.props.schema.agreeText) : I18n.t('ra_Accept license')}
                </Button>
                <Button
                    onClick={() => {
                        this.setState({ showLicenseDialog: false });
                        setTimeout(() => this.setState({ showLicenseDialog: true }), 2000);
                    }}
                    color="grey"
                    variant="contained"
                    startIcon={<Close />}
                >
                    {I18n.t('ra_Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

ConfigLicense.propTypes = {
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

export default ConfigLicense;