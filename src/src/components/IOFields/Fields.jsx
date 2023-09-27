import PropTypes from 'prop-types';

import {
    TextField,
    FormControl,
} from '@mui/material';

import { ColorPicker } from '@iobroker/adapter-react-v5';

export function IOTextField(props) {
    const IconCustom = props.icon;
    return <div className={props.classes.formContainer}>
        {IconCustom ? <IconCustom className={props.classes.formIcon} /> : null}
        <FormControl className={props.classes.formControl} variant="standard">
            <TextField
                variant="standard"
                label={props.t(props.label)}
                autoComplete={props.autoComplete}
                error={!!props.error}
                helperText={props.error || ''}
                value={props.value}
                onChange={props.onChange}
                disabled={props.disabled}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: false }}
                type={props.type}
            />
        </FormControl>
    </div>;
}

const IOColorPicker = props => {
    const IconCustom = props.icon;
    return <div style={{ width: '100%' }}>
        {IconCustom ? <IconCustom className={props.classes.formIcon} /> : null}
        <ColorPicker
            style={{ width: IconCustom ? 'calc(100% - 45px)' : '100%', display: 'inline-block', verticalAlign: 'top' }}
            name={props.t(props.label)}
            onChange={props.onChange}
            openAbove
            color={props.value || ''}
        />
    </div>;
};

IOColorPicker.propTypes = {
    label: PropTypes.string,
    value: PropTypes.any,
};
export { IOColorPicker };
