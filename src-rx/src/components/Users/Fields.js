import {useCallback} from 'react'
import {useDropzone} from 'react-dropzone';
import PropTypes from 'prop-types';

import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import ClearIcon from '@material-ui/icons/Clear';

import ColorPicker from './ColorPicker';

export function UsersTextField(props) {
    let Icon = props.icon;
    return <div>{Icon ? <Icon/> : null}
        <FormControl className={props.classes.formControl}>
            <InputLabel shrink>
                { props.t(props.label)}
            </InputLabel>
            <TextField
                autoComplete={props.autoComplete}
                label={ props.t(props.label)}
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

let UsersColorPicker = function (props) {
    let Icon = props.icon;
    return <div>{Icon ? <Icon/> : null}
        <ColorPicker
            variant="standard"
            label={props.t(props.label)}
            pickerClassName={props.className}
            inputProps={{
                style: {backgroundColor: props.value}
            }}
            InputProps={{
                endAdornment: !props.disabled && props.formData[props.name] ?
                    <IconButton
                        size="small"
                        onClick={() => props.updateValue(props.name, '')}>
                        <ClearIcon />
                    </IconButton>
                    : undefined,
            }}
            onChange={props.onChange}
            InputLabelProps={{shrink: true}}
            value={props.value || ''}
        />
    </div>;
};

UsersColorPicker.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.any,
    formData: PropTypes.object,
};
export {UsersColorPicker};

let UsersFileInput = function (props) {
    let Icon = props.icon;
    const onDrop = useCallback(acceptedFiles => {
        const reader = new FileReader();

        reader.addEventListener('load', () =>
            props.onChange(reader.result), false);

        if (acceptedFiles[0]) {
            reader.readAsDataURL(acceptedFiles[0]);
        }
      }, []); // eslint-disable-line react-hooks/exhaustive-deps
      const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

      return <div>{Icon ? <Icon/> : null}<FormControl className={props.classes.formControl}>
        <InputLabel shrink>
            { props.t(props.label)}
        </InputLabel>
        <div>
            {props.value ?
                <>
                    <img alt="" className={props.previewClassName} src={props.value}/>
                    <IconButton
                        size="small"
                        onClick={() => props.onChange('')}
                    >
                        <ClearIcon/>
                    </IconButton>
                </>
            :
                null
            }
            <div {...getRootProps()} style={{display: 'inline-block'}}>
            <input {...getInputProps()} />
            {
                isDragActive ?
                <p>Drop the files here ...</p> :
                <p>Drag 'n' drop some files here, or click to select files</p>
            }
            </div>
        </div>
    </FormControl></div>;
};

export {UsersFileInput};