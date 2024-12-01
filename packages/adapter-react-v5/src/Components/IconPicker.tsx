import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

import { InputLabel, FormControl, IconButton } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';

import { IconSelector } from './IconSelector';
import { Icon } from './Icon';
import { I18n } from '../i18n';
import { Utils } from './Utils';

const styles: Record<string, React.CSSProperties> = {
    formContainer: {
        display: 'flex',
        justifyContent: 'left',
        alignItems: 'center',
    },
    formControl: {
        display: 'flex',
        padding: 24,
        flexGrow: 1000,
    },
    divContainer: {
        width: 32 + 32,
        height: 32,
        whiteSpace: 'nowrap',
        lineHeight: '32px',
        marginRight: 8,
    },
    dragField: {
        textAlign: 'center',
        display: 'table',
        minHeight: 90,
        width: 'calc(100% - 60px)',
        border: '2px dashed #777',
        borderRadius: 10,
        padding: 4,
    },
    formIcon: {
        margin: 10,
        opacity: 0.6,
    },
    text: {
        display: 'table-cell',
        verticalAlign: 'middle',
    },
};

interface IconPickerProps {
    previewStyle?: React.CSSProperties;
    previewClassName?: string;
    /** Custom icon element. */
    icon?: React.FC<{ style?: React.CSSProperties }>;
    customStyles?: Record<string, React.CSSProperties>;
    customClasses?: Record<string, string>;
    /** The label. */
    label?: string;
    /** The value. */
    value?: any;
    /** Set to true to disable the icon picker. */
    disabled?: boolean;
    /** The icon change callback. */
    onChange: (icon: string) => void;
    icons?: {
        icon?: string;
        src?: string;
        href?: string;
        name?: ioBroker.StringOrTranslated;
        _id?: string;
    }[];
    onlyRooms?: boolean;
    onlyDevices?: boolean;
}

export function IconPicker(props: IconPickerProps): React.JSX.Element {
    const IconCustom = props.icon;

    const onChange = props.onChange;

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const reader = new FileReader();

            reader.addEventListener('load', () => onChange(reader.result as string), false);

            if (acceptedFiles[0]) {
                reader.readAsDataURL(acceptedFiles[0]);
            }
        },
        [onChange],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div style={styles.formContainer}>
            {IconCustom ? <IconCustom style={styles.formIcon} /> : null}
            <FormControl
                variant="standard"
                style={{ ...styles.formControl, padding: 3 }}
            >
                <InputLabel
                    shrink
                    sx={props.customStyles?.label ? { '&.MuiInputLabel-root': props.customStyles.label } : undefined}
                    classes={{ root: props.customClasses?.label }}
                >
                    {props.label}
                </InputLabel>
                <div style={styles.formContainer}>
                    {props.value ? (
                        <div style={styles.divContainer}>
                            <Icon
                                style={{ ...props.previewStyle, ...(props.customStyles?.icon || undefined) }}
                                src={props.value}
                                className={Utils.clsx(props.previewClassName, props.customClasses?.icon)}
                            />
                            {!props.disabled && (
                                <IconButton
                                    style={{ verticalAlign: 'top' }}
                                    title={I18n.t('ra_Clear icon')}
                                    size="small"
                                    onClick={() => props.onChange('')}
                                >
                                    <ClearIcon />
                                </IconButton>
                            )}
                        </div>
                    ) : (
                        !props.disabled && (
                            <IconSelector
                                icons={props.icons}
                                onlyRooms={props.onlyRooms}
                                onlyDevices={props.onlyDevices}
                                onSelect={(base64: string) => props.onChange(base64)}
                                t={I18n.t}
                                lang={I18n.getLanguage()}
                            />
                        )
                    )}

                    {!props.disabled && (
                        <div
                            {...getRootProps()}
                            style={{
                                ...styles.dragField,
                                ...(isDragActive ? { backgroundColor: 'rgba(0, 255, 0, 0.1)' } : { cursor: 'pointer' }),
                            }}
                        >
                            <input {...getInputProps()} />
                            {isDragActive ? (
                                <span style={styles.text}>{I18n.t('ra_Drop the files here...')}</span>
                            ) : (
                                <span style={styles.text}>
                                    {I18n.t("ra_Drag 'n' drop some files here, or click to select files")}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </FormControl>
        </div>
    );
}
