import PropTypes from 'prop-types';

import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';

import ColorPicker from '@iobroker/adapter-react/Components/ColorPicker';

export function IOTextField(props) {
    let IconCustom = props.icon;
    return <div className={props.classes.formContainer}>
        {IconCustom ? <IconCustom className={ props.classes.formIcon } /> : null}
        <FormControl className={props.classes.formControl}>
            <TextField
                label={props.t(props.label)}
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
    return <div style={{width: '100%'}}>
        {IconCustom ? <IconCustom className={ props.classes.formIcon } /> : null}
        <ColorPicker
            style={{width: IconCustom ? 'calc(100% - 45px)' : '100%', display: 'inline-block', verticalAlign: 'top'}}
            name={props.t(props.label)}
            onChange={props.onChange}
            openAbove={true}
            color={props.value || ''}
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
