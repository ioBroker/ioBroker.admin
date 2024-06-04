import React from 'react';

import {
    TextField,
    FormControl,
    InputAdornment,
    IconButton,
} from '@mui/material';

import { Close as CloseIcon } from '@mui/icons-material';

import { ColorPicker, type Translate } from '@iobroker/adapter-react-v5';

interface IOTextFieldProps {
    label: string;
    value: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    error?: string;
    type?: string;
    icon?: React.FC<{ className: string }>;
    classes: Record<string, string>;
    autoComplete?: string;
    t: Translate;
}

export function IOTextField(props: IOTextFieldProps) {
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
                onChange={e => props.onChange(e.target.value)}
                disabled={props.disabled}
                InputLabelProps={{ shrink: true }}
                type={props.type}
                InputProps={{
                    readOnly: false,
                    endAdornment: props.value ? <InputAdornment position="end">
                        <IconButton
                            size="small"
                            onClick={() => props.onChange('')}
                        >
                            <CloseIcon />
                        </IconButton>
                    </InputAdornment> : null,
                }}
            />
        </FormControl>
    </div>;
}

interface IOColorPickerProps {
    label: string;
    value: string;
    onChange: (color: string) => void;
    icon?: React.FC<{ className: string }>;
    previewClassName?: string;
    className?: string;
    classes: Record<string, string>;
    t: Translate;
}

function IOColorPicker(props: IOColorPickerProps): React.JSX.Element {
    const IconCustom = props.icon;

    return <div style={{ width: '100%' }}>
        {IconCustom ? <IconCustom className={props.previewClassName || props.classes.formIcon} /> : null}
        <ColorPicker
            style={{ width: IconCustom ? 'calc(100% - 45px)' : '100%', display: 'inline-block', verticalAlign: 'top' }}
            label={props.t(props.label)}
            onChange={props.onChange}
            openAbove
            value={props.value || ''}
            className={props.className}
        />
    </div>;
}

export { IOColorPicker };
