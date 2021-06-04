import {useCallback} from 'react'
import {useDropzone} from 'react-dropzone';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';

import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import ClearIcon from '@material-ui/icons/Clear';

import IconSelector from '@iobroker/adapter-react/Components/IconSelector';
import Icon from '@iobroker/adapter-react/Components/Icon';

import ColorPicker from './ColorPicker';

export function IOTextField(props) {
    let IconCustom = props.icon;
    return <div className={props.classes.formContainer}>
        {IconCustom ? <IconCustom className={ props.classes.formIcon } /> : null}
        <FormControl className={props.classes.formControl}>
            <InputLabel shrink>
                { props.t(props.label)}
            </InputLabel>
            <TextField
                autoComplete={props.autoComplete}
                error={!!props.error}
                helperText={props.error || ''}
                value={props.value}
                onChange={props.onChange}
                disabled={props.disabled}
                InputLabelProps={{
                    readOnly: false,
                    shrink: true,
                }}
                type={props.type}
            />
        </FormControl>
    </div>;
}

let IOColorPicker = props => {
    let IconCustom = props.icon;
    return <div className="">
        {IconCustom ? <IconCustom className={ props.classes.formIcon } /> : null}
        <ColorPicker
            variant="standard"
            label={props.t(props.label)}
            pickerClassName={props.className}
            inputProps={{
                style: {backgroundColor: props.value}
            }}
            InputProps={{
                endAdornment: !props.disabled && props.value ?
                    <IconButton
                        size="small"
                        onClick={() => props.onChange('')}>
                        <ClearIcon />
                    </IconButton>
                    :
                    undefined,
            }}
            onChange={props.onChange}
            InputLabelProps={{shrink: true}}
            value={props.value || ''}
        />
    </div>;
};
IOColorPicker.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    formData: PropTypes.object,
};
export {IOColorPicker};

let IOFileInput = function (props) {
    let IconCustom = props.icon;

    const useStyles = makeStyles(theme => ({
        formContainer : {
            display: 'flex',
            justifyContent:'center',
            alignItems:'center'
        },
        formControl : {
            display: 'flex',
            padding: 24,
            flexGrow: 1000
        },
        divContainer: {
            width: 32 + 24,
            height: 32,
            whiteSpace: 'nowrap',
            lineHeight: '32px',
            marginRight: 8
        },
        dragField: {
            textAlign: 'center',
            display: 'inline-block',
            height: 90,
            width: 240,
            border: '2px dashed #777',
            borderRadius: 10,
            marginTop: 12,
            padding: 4
        },
        formIcon : {
            margin: 10,
            opacity: 0.6
        },
    }));

    const classes = useStyles();

    const onDrop = useCallback(acceptedFiles => {
        const reader = new FileReader();

        reader.addEventListener('load', () =>
            props.onChange(reader.result), false);

        if (acceptedFiles[0]) {
            reader.readAsDataURL(acceptedFiles[0]);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

    return <div className={classes.formContainer}>
        {IconCustom ? <IconCustom className={ classes.formIcon }/> : null}
        <FormControl className={classes.formControl} style={{padding: 3}}>
            <InputLabel shrink>
                { props.t(props.label)}
            </InputLabel>
            <div className={ classes.formContainer }>
                {props.value ?
                    <div className={ classes.divContainer }>
                        <Icon alt="" className={props.previewClassName} src={props.value}/>
                        <IconButton
                            style={{verticalAlign: 'top'}}
                            size="small"
                            onClick={() => props.onChange('')}
                        >
                            <ClearIcon/>
                        </IconButton>
                    </div>
                    :
                    <IconSelector
                        icons={props.icons}
                        onlyRooms={props.onlyRooms}
                        onlyDevices={props.onlyDevices}
                        onSelect={base64 => props.onChange(base64)}
                        t={props.t}
                        lang={props.lang}
                    />
                }

                <div {...getRootProps()}
                     className={classes.dragField}
                     style={isDragActive ? {backgroundColor: 'rgba(0, 255, 0, 0.1)'} : {cursor: 'pointer'}}>
                    <input {...getInputProps()} />
                    {
                        isDragActive ?
                            <p>{props.t('ra_Drop the files here ...')}</p> :
                            <p>{props.t(`ra_Drag 'n' drop some files here, or click to select files`)}</p>
                    }
                </div>
            </div>
        </FormControl>
    </div>;
};

IOFileInput.propTypes = {
    t: PropTypes.func.isRequired,
    lang: PropTypes.string.isRequired,
    previewClassName: PropTypes.string,
    icon: PropTypes.object,
    classes: PropTypes.object,
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    onChange: PropTypes.func,

    icons: PropTypes.array,
    onlyRooms: PropTypes.bool,
    onlyDevices: PropTypes.bool,
};

export {IOFileInput};