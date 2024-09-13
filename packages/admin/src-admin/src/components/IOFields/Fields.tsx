import React from 'react';

import { TextField, FormControl, InputAdornment, IconButton } from '@mui/material';

import { Close as CloseIcon } from '@mui/icons-material';

import { ColorPicker, type Translate } from '@iobroker/adapter-react-v5';

interface IOTextFieldProps {
    label: string;
    value: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    error?: string;
    type?: string;
    icon?: React.FC<{ style: React.CSSProperties }>;
    autoComplete?: string;
    styles: Record<string, React.CSSProperties>;
    t: Translate;
}

export function IOTextField(props: IOTextFieldProps) {
    const IconCustom = props.icon;

    return (
        <div style={props.styles.formContainer}>
            {IconCustom ? <IconCustom style={props.styles.formIcon} /> : null}
            <FormControl style={props.styles.formControl} variant="standard">
                <TextField
                    variant="standard"
                    label={props.t(props.label)}
                    autoComplete={props.autoComplete}
                    error={!!props.error}
                    helperText={props.error || ''}
                    value={props.value}
                    onChange={e => props.onChange(e.target.value)}
                    disabled={props.disabled}
                    type={props.type}
                    slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                        input: {
                            readOnly: false,
                            endAdornment: props.value ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => props.onChange('')}>
                                        <CloseIcon />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        },
                    }}
                />
            </FormControl>
        </div>
    );
}

interface IOColorPickerProps {
    label: string;
    value: string;
    onChange: (color: string) => void;
    icon?: React.FC<{ style: React.CSSProperties }>;
    previewStyle?: React.CSSProperties;
    style?: React.CSSProperties;
    styles: Record<string, React.CSSProperties>;
    t: Translate;
}

function IOColorPicker(props: IOColorPickerProps): React.JSX.Element {
    const IconCustom = props.icon;

    return (
        <div style={{ width: '100%' }}>
            {IconCustom ? <IconCustom style={props.previewStyle || props.styles.formIcon} /> : null}
            <ColorPicker
                style={{
                    ...(props.style || undefined),
                    width: IconCustom ? 'calc(100% - 45px)' : '100%',
                    display: 'inline-block',
                    verticalAlign: 'top',
                }}
                label={props.t(props.label)}
                onChange={props.onChange}
                value={props.value || ''}
            />
        </div>
    );
}

export { IOColorPicker };
