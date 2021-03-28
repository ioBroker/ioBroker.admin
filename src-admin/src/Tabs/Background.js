import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';

import I18n from '@iobroker/adapter-react/i18n';

import CustomCheckbox from '../Components/CustomCheckbox';
import CustomInput from '../Components/CustomInput';
import CustomButtonUpload from '../Components/CustomButtonUpload';
import Toast from '../Components/Toast';

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
        width: 'calc(100% - 10px)',
    },
    dropZone: {
        marginTop: 30,
        width: 600,
        border: '2px dashed #bbb',
        borderRadius: 5,
        padding: 25,
        textAlign: 'center',
        fontSize: '20pt',
        fontWeight: 'bold',
        fontFamily: 'Arial',
        color: '#bbb',
        minWidth: 320,
        minHeight: 200,
        transition: 'background 1s',
        '&:focus': {
            outline: 'inherit'
        }
    },
    dropZoneActive: {
        background: '#d6d6d69c'
    },
    imgStyle: {
        maxWidth: 500,
        maxHeight: 500
    },
    '@media screen and (max-width: 680px)': {
        dropZone: {
            width: 'calc(100% - 45px)',
            minWidth: 200,
        },
        imgStyle: {
            width: '100%',
        }
    }
});

class Background extends Component {
    constructor(props) {
        super(props);
        this.state = {
            imgSRC: '',
            toast: ''
        };
    }

    componentDidMount() {
        this.readFile();
    }

    readFile() {
        const { socket, instance } = this.props;

        socket.getRawSocket().emit('readFile', `admin.${instance}`, 'login-bg.png', (err, data) => {
            if (!err && data) {
                let arrayBufferView = new Uint8Array(data);
                if (!arrayBufferView.length) {
                    this.setState({ imgSRC: `../../files/admin.${instance}/login-bg.png?ts=` + Date.now() });
                } else {
                    let blob = new Blob([arrayBufferView], { type: 'image/png' });
                    let urlCreator = window.URL || window.webkitURL;
                    let imgSRC = urlCreator.createObjectURL(blob);
                    this.setState({ imgSRC });
                }
            } else {
                this.setState({ imgSRC: '' });
            }
        });
    }

    uploadFile(file, callback) {
        const { socket, instance } = this.props;
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            this.setState({ toast: `File ${file.name} is too big. Maximum 5MB` });
            this.setState({ imgSRC: '' });
            callback && callback('');
            return;
        }
        let reader = new FileReader();
        reader.onload = ({ target: { result } }) => {
            socket.getRawSocket().emit('writeFile', `admin.${instance}`, 'login-bg.png', result, () => {
                this.readFile();
            });
        };
        callback && callback(file.name);
        reader.readAsArrayBuffer(file);
    }

    render() {
        const { classes, native, onChange } = this.props;
        const { imgSRC, toast } = this.state;
        return <form className={classes.tab}>
            <Toast message={toast} onClose={() => this.setState({ toast: '' })} />
            <div className={`${classes.column} ${classes.columnSettings}`}>
                <div>
                    <CustomInput
                        styleComponentBlock={{ height: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        component={<CustomInput
                            attr='loginBackgroundColorHelper'
                            type='Background color of the login screen'
                            style={{ marginTop: -1, marginLeft: 10, minWidth: 60 }}
                            native={native}
                            onChange={async (e, value) => {
                                await onChange('loginBackgroundColorHelper', value);
                                await onChange('loginBackgroundColor', value);
                            }}
                            variant="outlined"
                            size="small"
                        />}
                        title='color'
                        attr='loginBackgroundColor'
                        style={{ marginTop: -1, marginBottom: 20 }}
                        native={native}
                        onChange={async (e, value) => {
                            await onChange('loginBackgroundColorHelper', value);
                            await onChange('loginBackgroundColor', value);
                        }}
                    />
                </div>
                <div>
                    <CustomCheckbox
                        title='Background image'
                        attr='loginBackgroundImage'
                        native={native}
                        onChange={onChange}
                    />
                </div>
                <div>
                    <CustomCheckbox
                        title='Hide logo'
                        attr='loginHideLogo'
                        native={native}
                        onChange={onChange}
                    />
                </div>
                <div>
                    <CustomInput
                        title='Own motto'
                        attr='loginMotto'
                        native={native}
                        onChange={onChange}
                    />
                </div>
                <div style={native['loginBackgroundImage'] ? { display: 'block' } : { display: 'none' }}>
                    <div>
                        <CustomButtonUpload
                            title="Upload image"
                            attr="files"
                            native={native}
                            onChange={(e, callback) => this.uploadFile(e, callback)}
                        />
                    </div>
                    <Dropzone
                        accept="image/*"
                        onDrop={acceptedFiles => this.uploadFile(acceptedFiles[0])}>
                        {({ getRootProps, getInputProps, isDragActive }) => (
                            <section>
                                <div
                                    className={`${classes.dropZone} ${isDragActive ? classes.dropZoneActive : null}`}
                                    {...getRootProps()}>
                                    <input {...getInputProps()}/>
                                    <p>{I18n.t('place here')}</p>
                                    {imgSRC ? <img className={classes.imgStyle} src={imgSRC} alt="img" /> : null}
                                </div>
                            </section>
                        )}
                    </Dropzone>
                </div>
            </div>
        </form>;
    }
}

Background.propTypes = {
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

export default withStyles(styles)(Background);
