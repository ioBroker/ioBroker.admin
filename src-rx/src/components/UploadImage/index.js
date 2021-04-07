import { Component } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';

import { withStyles } from '@material-ui/core/styles';
import { Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';

import IconClose from '@material-ui/icons/Close';
import { FaFileUpload as UploadIcon } from 'react-icons/fa';


const styles = theme => ({
    dropZone: {
        width: '100%',
        height: 100,
        position: 'relative',
    },
    dropZoneEmpty: {

    },
    image: {
        objectFit: 'contain',
        margin: 'auto',
        display: 'flex',
        width: '100%',
        height: '100%',
    },

    uploadDiv: {
        position: 'relative',
        width: '100%',
        height: 300,
        opacity: 0.9,
        marginTop: 30
    },
    uploadDivDragging: {
        opacity: 1,
        background: 'rgba(128,255,128,0.1)'
    },

    uploadCenterDiv: {
        margin: 5,
        border: '3px dashed grey',
        borderRadius: 5,
        width: 'calc(100% - 10px)',
        height: 'calc(100% - 10px)',
        position: 'relative',
        display: 'flex'
    },
    uploadCenterIcon: {
        paddingTop: 10,
        width: 48,
        height: 48,
    },
    uploadCenterText: {
        fontSize: 16,
    },
    uploadCenterTextAndIcon: {
        textAlign: 'center',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'

    },
    disabledOpacity: {
        opacity: 0.3
    },
    buttonRemoveWrapper: {
        position: 'absolute',
        zIndex: 222,
        right: 0
    },
});

class UploadImage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            uploadFile: false
        };
    }

    onDrop(acceptedFiles) {
        const { maxSize, t, onChange } = this.props;

        const file = acceptedFiles[0];
        const reader = new FileReader();

        reader.onabort = () => console.log('file reading was aborted');
        reader.onerror = () => console.log('file reading has failed');
        reader.onload = () => {
            let ext = 'image/' + file.name.split('.').pop().toLowerCase();
            if (ext === 'image/jpg') {
                ext = 'image/jpeg';
            } else if (ext.includes('svg')) {
                ext = 'image/svg+xml';
            }
            if (file.size > maxSize) {
                return window.alert(t('File is too big. Max %sk allowed. Try use SVG.', Math.round(maxSize / 1024)));
            }
            const base64 = `data:${ext};base64,${btoa(
                new Uint8Array(reader.result)
                    .reduce((data, byte) => data + String.fromCharCode(byte), ''))}`;

            onChange(base64);
        };
        reader.readAsArrayBuffer(file);
    }

    render() {
        const { disabled, maxSize, classes, icon, t, removeIconFunc } = this.props;
        const { uploadFile } = this.state;
        return <Dropzone
            disabled={disabled}
            key="dropzone"
            multiple={false}
            accept="image/*"
            maxSize={maxSize}
            onDragEnter={() => this.setState({ uploadFile: 'dragging' })}
            onDragLeave={() => this.setState({ uploadFile: true })}
            onDrop={(acceptedFiles, errors) => {
                this.setState({ uploadFile: false });
                if (!acceptedFiles.length) {
                    window.alert((errors && errors[0] && errors[0].errors && errors[0].errors[0] && errors[0].errors[0].message) || t('Cannot upload'));
                } else {
                    return this.onDrop(acceptedFiles);
                }
            }}
        >
            {({ getRootProps, getInputProps }) => (
                <div className={clsx(
                    classes.uploadDiv,
                    uploadFile === 'dragging' && classes.uploadDivDragging,
                    classes.dropZone,
                    disabled && classes.disabledOpacity,
                    !icon && classes.dropZoneEmpty
                )}
                    {...getRootProps()}>
                    <input {...getInputProps()} />
                    <div className={classes.uploadCenterDiv}>
                        {!icon ? <div className={classes.uploadCenterTextAndIcon}>
                            <UploadIcon className={classes.uploadCenterIcon} />
                            <div className={classes.uploadCenterText}>{
                                uploadFile === 'dragging' ? t('Drop file here') :
                                    t('Place your files here or click here to open the browse dialog')}</div>
                        </div>
                            :
                            removeIconFunc && <div className={classes.buttonRemoveWrapper}>
                                <Tooltip title={t('Clear %s', 'icon')}>
                                    <IconButton onClick={e => {
                                        removeIconFunc && removeIconFunc();
                                        e.stopPropagation();
                                    }}><IconClose />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        }
                        {icon ? <img src={icon} className={classes.image} alt="icon" /> : null}
                    </div>

                </div>)}
        </Dropzone>;
    }
}

UploadImage.defaultProps = {
    disabled: false,
    maxSize: 10 * 1024,
    icon: null,
    removeIconFunc: undefined,
    onChange: base64 => console.log(base64),
    t: el => el
}

UploadImage.propTypes = {
    classes: PropTypes.object,
    maxSize: PropTypes.number,
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    t: PropTypes.func,
};

export default withStyles(styles)(UploadImage);
