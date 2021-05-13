import {useCallback} from 'react'
import {useDropzone} from 'react-dropzone';
import PropTypes from 'prop-types';

import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import ClearIcon from '@material-ui/icons/Clear';

import ColorPicker from './ColorPicker';
import IconSelector from './IconSelector';

import Icon from '@iobroker/adapter-react/Components/Icon';

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

let IOColorPicker = function (props) {
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
                endAdornment: !props.disabled && props.value
                    ?
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

    const onDrop = useCallback(acceptedFiles => {
        const reader = new FileReader();

        reader.addEventListener('load', () =>
            props.onChange(reader.result), false);

        if (acceptedFiles[0]) {
            reader.readAsDataURL(acceptedFiles[0]);
        }
      }, []); // eslint-disable-line react-hooks/exhaustive-deps

      const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

      return <div className={props.classes.formContainer}>
        {IconCustom ? <IconCustom className={ props.classes.formIcon }/> : null}
        <FormControl className={props.classes.formControl} style={{padding: 3}}>
            <InputLabel shrink>
                { props.t(props.label)}
            </InputLabel>
            <div className={ props.classes.formContainer }>
                {props.value ?
                    <div style={{width: 32 + 24, height: 32, whiteSpace: 'nowrap', lineHeight: '32px', marginRight: 8}}>
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
                    <IconSelector icons={props.icons} onSelect={base64 => props.onChange(base64)} t={props.t}/>
                }

                <div {...getRootProps()} style={Object.assign({textAlign: 'center', display: 'inline-block', height: 90, width: 240, border: '2px dashed #777', borderRadius: 10, marginTop: 12, padding: 4}, isDragActive ? {backgroundColor: 'rgba(0, 255, 0, 0.1)'} : {cursor: 'pointer'})}>
                    <input {...getInputProps()} />
                    {
                        isDragActive ?
                        <p>{props.t('Drop the files here ...')}</p> :
                        <p>{props.t(`Drag 'n' drop some files here, or click to select files`)}</p>
                    }
                </div>
            </div>
        </FormControl>
    </div>;
};

export {IOFileInput};