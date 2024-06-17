/**
 * Notice: Some code was adapted from Material-UI's text field.
 *         Copyright (c) 2014 Call-Em-All (https://github.com/callemall/material-ui)
 */
import React, { type RefObject } from 'react';
import ReactDOM from 'react-dom';

import {
    Input,
    OutlinedInput,
    InputLabel,
    Chip,
    FormControl,
    FormHelperText, Box,
} from '@mui/material';
import FilledInput from '@mui/material/FilledInput/FilledInput';
import blue from '@mui/material/colors/blue';

import { type IobTheme, type ThemeType } from '@iobroker/adapter-react-v5';
import Utils from '../Utils';

const variantComponent = {
    standard: Input,
    filled: FilledInput,
    outlined: OutlinedInput,
};

const styles: Record<string, any> = (theme: IobTheme) => {
    const light = theme.palette.mode === 'light';
    const bottomLineColor = light ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.7)';

    return {
        root: {},
        inputRoot: {
            display: 'inline-flex',
            flexWrap: 'wrap',
            flex: 1,
            marginTop: 0,
            minWidth: 70,
            '&$outlined,&$filled': {
                boxSizing: 'border-box',
            },
            '&$outlined': {
                paddingTop: '14px',
            },
            '&$filled': {
                paddingTop: '28px',
            },
        },
        input: {
            display: 'inline-block',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            appearance: 'none', // Remove border in Safari, doesn't seem to break anything in other browsers
            WebkitTapHighlightColor: 'rgba(0,0,0,0)', // Remove mobile color flashing (deprecated style).
            float: 'left',
            flex: 1,
        },
        chipContainer: {
            display: 'flex',
            flexFlow: 'row wrap',
            cursor: 'text',
            marginBottom: '-2px',
            minHeight: 40,
            '&$labeled&$standard': {
                marginTop: '18px',
            },
        },
        outlined: {
            '& input': {
                height: 16,
                paddingTop: '4px',
                paddingBottom: '12px',
                marginTop: '4px',
                marginBottom: '4px',
            },
        },
        standard: {},
        filled: {
            '& input': {
                height: 22,
                marginBottom: '4px',
                marginTop: '4px',
                paddingTop: 0,
            },
            '$marginDense & input': {
                height: 26,
            },
        },
        labeled: {},
        label: {
            top: 4,
            '&$outlined&:not($labelShrink)': {
                top: 2,
                '$marginDense &': {
                    top: 5,
                },
            },
            '&$filled&:not($labelShrink)': {
                top: 15,
                '$marginDense &': {
                    top: 20,
                },
            },
        },
        labelShrink: {
            top: 0,
        },
        helperText: {
            marginBottom: -20,
        },
        focused: {},
        disabled: {},
        underline: {
            '&:after': {
                borderBottom: `2px solid ${theme.palette.primary[light ? 'dark' : 'light']}`,
                left: 0,
                bottom: 0,
                // Doing the other way around a crash on IE 11 "''" https://github.com/cssinjs/jss/issues/242
                content: '""',
                position: 'absolute',
                right: 0,
                transform: 'scaleX(0)',
                transition: theme.transitions.create('transform', {
                    duration: theme.transitions.duration.shorter,
                    easing: theme.transitions.easing.easeOut,
                }),
                pointerEvents: 'none', // Transparent to the hover style.
            },
            '&$focused:after': {
                transform: 'scaleX(1)',
            },
            '&$error:after': {
                borderBottomColor: theme.palette.error.main,
                transform: 'scaleX(1)', // error is always underlined in red
            },
            '&:before': {
                borderBottom: `1px solid ${bottomLineColor}`,
                left: 0,
                bottom: 0,
                // Doing the other way around a crash on IE 11 "''" https://github.com/cssinjs/jss/issues/242
                content: '"\\00a0"',
                position: 'absolute',
                right: 0,
                transition: theme.transitions.create('border-bottom-color', {
                    duration: theme.transitions.duration.shorter,
                }),
                pointerEvents: 'none', // Transparent to the hover style.
            },
            '&:hover:not($disabled):not($focused):not($error):before': {
                borderBottom: `2px solid ${theme.palette.text.primary}`,
                // Reset on touch devices, it doesn't add specificity
                '@media (hover: none)': {
                    borderBottom: `1px solid ${bottomLineColor}`,
                },
            },
            '&$disabled:before': {
                borderBottomStyle: 'dotted',
            },
        },
        error: {
            '&:after': {
                backgroundColor: theme.palette.error.main,
                transform: 'scaleX(1)', // error is always underlined in red
            },
        },
        chip: {
            margin: '0 8px 8px 0',
            float: 'left',
        },
        marginDense: {},
    };
};

const keyCodes = {
    BACKSPACE: 8,
    DELETE: 46,
    LEFT_ARROW: 37,
    RIGHT_ARROW: 39,
};

interface ChipRendererProps {
    value: string;
    isFocused: boolean;
    isDisabled: boolean;
    isReadOnly: boolean;
    handleClick: () => void;
    handleDelete: () => void;
    style: React.CSSProperties;
}

export const defaultChipRenderer = ({
    value,
    isFocused,
    isDisabled,
    isReadOnly,
    handleClick,
    handleDelete,
    style,
}: ChipRendererProps, key: string) =>
    <Chip
        key={key}
        style={{
            ...style,
            pointerEvents: isDisabled || isReadOnly ? 'none' : undefined,
            backgroundColor: isFocused ? blue[300] : undefined,
        }}
        onClick={handleClick}
        onDelete={handleDelete}
        label={value}
    />;

interface ChipInputProps {
    /** Allows duplicate chips if set to true. */
    allowDuplicates?: boolean;
    /** If true, the placeholder will always be visible. */
    alwaysShowPlaceholder?: boolean;
    /** Behavior when the chip input is blurred: `'clear'` clears the input, `'add'` creates a chip and `'ignore'` keeps the input. */
    blurBehavior?: 'clear' | 'add' | 'add-or-clear' | 'ignore';
    /** A function of the type `({ value, text, chip, isFocused, isDisabled, isReadOnly, handleClick, handleDelete, className }, key) => node` that returns a chip based on the given properties. This can be used to customize chip styles.  Each item in the `dataSource` array will be passed to `chipRenderer` as arguments `chip`, `value` and `text`. If `dataSource` is an array of objects and `dataSourceConfig` is present, then `value` and `text` will instead correspond to the object values defined in `dataSourceConfig`. If `dataSourceConfig` is not set and `dataSource` is an array of objects, then a custom `chipRenderer` must be set. `chip` is always the raw value from `dataSource`, either an object or a string. */
    chipRenderer?: (props: ChipRendererProps) => React.JSX.Element;
    /** Whether the input value should be cleared if the `value` prop is changed. */
    clearInputValueOnChange?: boolean;
    /** Data source for auto complete. This should be an array of strings or objects. */
    dataSource?: string[];
    /** The chips to display by default (for uncontrolled mode). */
    defaultValue?: string[];
    /** Whether to use `setTimeout` to delay adding chips in case other input events like `onSelection` need to fire first */
    delayBeforeAdd?: boolean;
    /** Disables the chip input if set to true. */
    disabled?: boolean;
    /** Disable the input underline. Only valid for 'standard' variant */
    disableUnderline?: boolean;
    /** Props to pass through to the `FormHelperText` component. */
    FormHelperTextProps?: Record<string, any>;
    /** If true, the chip input will fill the available width. */
    fullWidth?: boolean;
    /** If true, the input field will always be below the chips and fill the available space. By default, it will try to be beside the chips. */
    fullWidthInput?: boolean;
    /** Helper text that is displayed below the input. */
    helperText?: string | React.JSX.Element;
    /** Props to pass through to the `InputLabel`. */
    InputLabelProps?: Record<string, any>;
    /** Props to pass through to the `Input`. */
    InputProps?: Record<string, any>;
    /** Use this property to pass a ref callback to the native input component. */
    inputRef?: (el: HTMLInputElement) => void;
    /** The input value (enables controlled mode for the text input if set). */
    inputValue?: string;
    /* The content of the floating label. */
    label?: string | React.JSX.Element;
    /** The key codes (`KeyboardEvent.keyCode`) used to determine when to create a new chip. */
    newChipKeyCodes?: number[];
    /** The keys (`KeyboardEvent.key`) used to determine when to create a new chip. */
    newChipKeys?: string[];
    /** Callback function that is called when a new chip was added (in controlled mode). */
    onAdd?: (chip: string) => void;
    /** Callback function that is called with the chip to be added and should return true to add the chip or false to prevent the chip from being added without clearing the text input. */
    onBeforeAdd?: (chip: string) => boolean;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    /** Callback function that is called when the chips change (in uncontrolled mode). */
    onChange?: (chips: string[]) => void;
    /** Callback function that is called when a new chip was removed (in controlled mode). */
    onDelete: (chip: string, i: number) => void;
    /** Callback function that is called when the input changes. */
    onUpdateInput?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** A placeholder that is displayed if the input has no values. */
    placeholder?: string;
    /** Makes the chip input read-only if set to true. */
    readOnly?: boolean;
    /** The chips to display (enables controlled mode if set). */
    value?: string[];
    /** The variant of the Input component */
    variant?: 'outlined' | 'standard' | 'filled';
    className?: string;
    error?: boolean;
    id?: string;
    required?: boolean;
    rootRef?: RefObject<HTMLDivElement>;
    margin?: 'dense' | 'normal' | 'none';
    theme: IobTheme;
}

interface ChipInputState {
    chips: string[];
    focusedChip: number | null;
    inputValue: string;
    isFocused: boolean;
    chipsUpdated: boolean;
    prevPropsValue: string[];
    variant: 'outlined' | 'standard' | 'filled';
}

class ChipInput extends React.Component<ChipInputProps, ChipInputState> {
    private readonly labelRef: React.RefObject<HTMLLabelElement>;

    private labelNode: HTMLLabelElement | null = null;

    private readonly input: React.RefObject<HTMLInputElement>;

    private readonly newChipKeyCodes: number[];

    private readonly newChipKeys: string[];

    private actualInput: HTMLInputElement | null = null;

    private inputBlurTimeout: ReturnType<typeof setTimeout> | null = null;

    private _keyPressed: boolean;

    private _preventChipCreation: boolean;

    private styles: Record<string, any> = {};

    private styleTheme: ThemeType | null = null;

    constructor(props: ChipInputProps) {
        super(props);
        this.state = {
            chips: props.defaultValue || [],
            focusedChip: null,
            inputValue: '',
            isFocused: false,
            chipsUpdated: false,
            prevPropsValue: [],
            variant: this.props.variant || 'standard',
        };
        this.newChipKeyCodes = props.newChipKeyCodes || [13];
        this.newChipKeys = props.newChipKeys || ['Enter'];

        this.labelRef = React.createRef();
        this.input = React.createRef();
    }

    componentDidMount() {
        if (this.state.variant === 'outlined') {
            // eslint-disable-next-line react/no-find-dom-node
            this.labelNode = ReactDOM.findDOMNode(this.labelRef.current) as HTMLLabelElement;
            this.forceUpdate();
        }
    }

    componentWillUnmount() {
        this.inputBlurTimeout && clearTimeout(this.inputBlurTimeout);
    }

    static getDerivedStateFromProps(props: ChipInputProps, state: ChipInputState) {
        let newState: Partial<ChipInputState> | null = null;

        if (props.value && props.value.length !== state.prevPropsValue.length) {
            newState = { prevPropsValue: props.value };
            if (props.clearInputValueOnChange) {
                newState.inputValue = '';
            }
        }

        // if change detection is only needed for clearInputValueOnChange
        if (props.clearInputValueOnChange && props.value && props.value.length !== state.prevPropsValue.length) {
            newState = { prevPropsValue: props.value, inputValue: '' };
        }

        if (props.disabled) {
            newState = { ...newState, focusedChip: null };
        }

        if (!state.chipsUpdated && props.defaultValue) {
            newState = { ...newState, chips: props.defaultValue };
        }

        return newState;
    }

    /**
     * Blurs this component.
     * @public
     */
    // blur() {
    //     if (this.input) {
    //         this.actualInput.blur();
    //     }
    // }

    /**
     * Focuses this component.
     * @public
     */
    focus = () => {
        this.actualInput?.focus();
        if (this.state.focusedChip) {
            this.setState({ focusedChip: null });
        }
    };

    handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        if (this.props.onBlur) {
            this.props.onBlur(event);
        }
        this.setState({ isFocused: false });
        if (this.state.focusedChip) {
            this.setState({ focusedChip: null });
        }
        const value = event.target.value;
        let addChipOptions: { clearInputOnFail: boolean };
        switch (this.props.blurBehavior || 'clear') {
            case 'add-or-clear':
                addChipOptions = { clearInputOnFail: true };
            // falls through
            case 'add':
                if (this.props.delayBeforeAdd) {
                    // Let's assume that we only want to add the existing content as chip, when
                    // another event has not added a chip within 200ms.
                    // e.g., onSelection Callback in Autocomplete case
                    const numChipsBefore = (this.props.value || this.state.chips).length;
                    this.inputBlurTimeout = setTimeout(() => {
                        const numChipsAfter = (this.props.value || this.state.chips).length;
                        if (numChipsBefore === numChipsAfter) {
                            this.handleAddChip(value, addChipOptions);
                        } else {
                            this.clearInput();
                        }
                    }, 150);
                } else {
                    this.handleAddChip(value, addChipOptions);
                }
                break;

            case 'clear':
                this.clearInput();
                break;

            default:
                break;
        }
    };

    handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        this.setState({ isFocused: true });
        if (this.props.onFocus) {
            this.props.onFocus(event);
        }
    };

    handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const { focusedChip } = this.state;
        this._keyPressed = false;
        this._preventChipCreation = false;

        if (this.props.onKeyDown) {
            // Needed for arrow controls on a menu in autocomplete scenario
            this.props.onKeyDown(event);
            // Check if the callback marked the event as isDefaultPrevented() and skip further actions
            // enter key, for example, should not always add the current value of the inputField
            if (event.isDefaultPrevented()) {
                return;
            }
        }
        const chips = this.props.value || this.state.chips;
        if (this.newChipKeyCodes.includes(event.keyCode) || this.newChipKeys.includes(event.key)) {
            const result = this.handleAddChip((event.target as HTMLInputElement).value);
            if (result !== false) {
                event.preventDefault();
            }
            return;
        }

        switch (event.keyCode) {
            case keyCodes.BACKSPACE:
                if ((event.target as HTMLInputElement).value === '') {
                    if (focusedChip) {
                        this.handleDeleteChip(chips[focusedChip], focusedChip);
                        if (focusedChip) {
                            this.setState({ focusedChip: focusedChip - 1 });
                        }
                    } else {
                        this.setState({ focusedChip: chips.length - 1 });
                    }
                }
                break;
            case keyCodes.DELETE:
                if ((event.target as HTMLInputElement).value === '' && focusedChip) {
                    this.handleDeleteChip(chips[focusedChip], focusedChip);
                    if (focusedChip <= chips.length - 1) {
                        this.setState({ focusedChip });
                    }
                }
                break;
            case keyCodes.LEFT_ARROW:
                if (focusedChip === null && (event.target as HTMLInputElement).value === '' && chips.length) {
                    this.setState({ focusedChip: chips.length - 1 });
                } else if (focusedChip !== null && focusedChip > 0) {
                    this.setState({ focusedChip: focusedChip - 1 });
                }
                break;
            case keyCodes.RIGHT_ARROW:
                if (focusedChip !== null && focusedChip < chips.length - 1) {
                    this.setState({ focusedChip: focusedChip + 1 });
                } else {
                    this.setState({ focusedChip: null });
                }
                break;
            default:
                this.setState({ focusedChip: null });
                break;
        }
    };

    handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!this._preventChipCreation && (this.newChipKeyCodes.includes(event.keyCode) || this.newChipKeys.includes(event.key)) && this._keyPressed) {
            this.clearInput();
        } else {
            this.updateInput((event.target as HTMLInputElement).value);
        }
        if (this.props.onKeyUp) {
            this.props.onKeyUp(event);
        }
    };

    handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        this._keyPressed = true;
        if (this.props.onKeyPress) {
            this.props.onKeyPress(event);
        }
    };

    handleUpdateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (this.props.inputValue === null || this.props.inputValue === undefined) {
            this.updateInput(e.target.value);
        }

        if (this.props.onUpdateInput) {
            this.props.onUpdateInput(e);
        }
    };

    /**
     * Handles adding a chip.
     * @param {string|object} chip Value of the chip, either a string or an object (if dataSourceConfig is set)
     * @param {object=} options Additional options
     * @param {boolean=} options.clearInputOnFail If `true`, and `onBeforeAdd` returns `false`, clear the input
     * @returns True if the chip was added (or at least `onAdd` was called), false if adding the chip was prevented
     */
    handleAddChip(chip: string, options?: { clearInputOnFail: boolean }): boolean {
        if (this.props.onBeforeAdd && !this.props.onBeforeAdd(chip)) {
            this._preventChipCreation = true;
            if (options && options.clearInputOnFail) {
                this.clearInput();
            }
            return false;
        }
        this.clearInput();
        const chips = this.props.value || this.state.chips;

        if ((chip as string).trim().length) {
            if (this.props.allowDuplicates || !chips.includes(chip as string)) {
                if (this.props.value && this.props.onAdd) {
                    this.props.onAdd(chip);
                } else {
                    this.updateChips([...this.state.chips, chip]);
                }
            }
            return true;
        }
        return false;
    }

    handleDeleteChip(chip: string, i: number) {
        if (!this.props.value) {
            const chips = this.state.chips.slice();
            const changed = chips.splice(i, 1); // remove the chip at index i
            if (changed) {
                let focusedChip = this.state.focusedChip;
                if (this.state.focusedChip === i) {
                    focusedChip = null;
                } else if (this.state.focusedChip > i) {
                    focusedChip = this.state.focusedChip - 1;
                }
                this.updateChips(chips, { focusedChip });
            }
        } else if (this.props.onDelete) {
            this.props.onDelete(chip, i);
        }
    }

    updateChips(chips: string[], additionalUpdates = {}) {
        this.setState({ chips, chipsUpdated: true, ...additionalUpdates });
        if (this.props.onChange) {
            this.props.onChange(chips);
        }
    }

    /**
     * Clears the text field for adding new chips.
     * This only works in uncontrolled input mode, i.e., if the inputValue prop is not used.
     * @public
     */
    clearInput() {
        this.updateInput('');
    }

    updateInput(value: string) {
        this.setState({ inputValue: value });
    }

    /**
     * Set the reference to the actual input, that is the input of the Input.
     * @param {object} ref - The reference
     */
    setActualInputRef = (ref: HTMLInputElement) => {
        this.actualInput = ref;
        this.props.inputRef && this.props.inputRef(ref);
    };

    render() {
        const {
            alwaysShowPlaceholder,
            chipRenderer = defaultChipRenderer,
            className,
            disabled,
            disableUnderline,
            error,
            FormHelperTextProps,
            fullWidth,
            fullWidthInput,
            helperText,
            id,
            InputProps = {},
            InputLabelProps = {},
            inputValue,
            label,
            placeholder,
            readOnly,
            required,
            rootRef,
            value,
            margin,
        } = this.props;
        const variant = this.state.variant;

        if (this.styleTheme !== this.props.theme.palette.mode) {
            this.styleTheme = this.props.theme.palette.mode;
            this.styles = Utils.getStyle(this.props.theme, styles);
        }

        let chips = value || this.state.chips || [];
        if (!Array.isArray(chips)) {
            chips = (chips as string || '').toString().split(/[,\s]+/).map((c: string) => c.trim());
        }
        const actualInputValue = inputValue ?? this.state.inputValue;

        const hasInput = (this.props.value || actualInputValue).length || actualInputValue.length;
        const shrinkFloatingLabel = typeof InputLabelProps.shrink === 'boolean'
            ? InputLabelProps.shrink
            : (label !== null && (hasInput || this.state.isFocused || chips.length));

        const chipComponents = chips.map((chip, i) => chipRenderer(
            {
                value: chip,
                isDisabled: !!disabled,
                isReadOnly: readOnly,
                isFocused: this.state.focusedChip === i,
                handleClick: () => this.setState({ focusedChip: i }),
                handleDelete: () => this.handleDeleteChip(chip, i),
                style: this.styles.chip,
            },
            i.toString(),
        ));

        const InputMore: { notched?: boolean; labelWidth?: number; startAdornment?: React.JSX.Element[] } = {};
        if (variant === 'outlined') {
            InputMore.notched = !!shrinkFloatingLabel;
            InputMore.labelWidth =
                (shrinkFloatingLabel && this.labelNode && this.labelNode.offsetWidth) ||
                0;
        }

        if (variant !== 'standard') {
            InputMore.startAdornment = chipComponents;
        } else {
            InputProps.disableUnderline = true;
        }

        const InputComponent = variantComponent[variant];

        return <FormControl
            ref={rootRef}
            fullWidth={fullWidth}
            className={className}
            sx={{ ...this.styles.root, ...(margin === 'dense' ? this.styles.marginDense : {}) }}
            error={error}
            required={chips.length > 0 ? undefined : required}
            onClick={this.focus}
            disabled={disabled}
            variant={variant}
            component="div"
            margin={margin}
        >
            {label && <InputLabel
                htmlFor={id}
                sx={{
                    '& .MuiInputLabel-root': { ...this.styles[variant], ...this.styles.label },
                    '& .MuiInputLabel-shrink': this.styles.labelShrink,
                }}
                shrink={!!shrinkFloatingLabel}
                focused={this.state.isFocused}
                variant={variant}
                ref={this.labelRef}
                required={required}
                component="label"
                {...InputLabelProps}
            >
                {label}
            </InputLabel>}
            <Box
                component="div"
                sx={{
                    ...this.styles[variant],
                    ...this.styles.chipContainer,
                    ...(this.state.isFocused ? this.styles.focused : undefined),
                    ...(!disableUnderline && variant === 'standard' ? this.styles.underline : undefined),
                    ...(disabled ? this.styles.disabled : undefined),
                    ...(label ? this.styles.labeled : undefined),
                    ...(error ? this.styles.error : undefined),
                }}
            >
                {variant === 'standard' && chipComponents}
                <InputComponent
                    ref={this.input}
                    sx={{
                        '& .MuiInputComponent-input': { ...this.styles.input, ...this.styles[variant] },
                        '& .MuiInputComponent-root': { ...this.styles.inputRoot, ...this.styles[variant] },
                    }}
                    id={id}
                    value={actualInputValue}
                    onChange={this.handleUpdateInput}
                    onKeyDown={this.handleKeyDown}
                    onKeyPress={this.handleKeyPress}
                    onKeyUp={this.handleKeyUp}
                    onFocus={this.handleInputFocus}
                    onBlur={this.handleInputBlur}
                    inputRef={this.setActualInputRef}
                    disabled={disabled}
                    fullWidth={fullWidthInput}
                    placeholder={(!hasInput && (shrinkFloatingLabel || label === null || label === undefined)) || alwaysShowPlaceholder ? placeholder : null}
                    readOnly={readOnly}
                    {...InputProps}
                    {...InputMore}
                />
            </Box>
            {helperText && <FormHelperText
                {...FormHelperTextProps}
                className={FormHelperTextProps?.className}
                style={this.styles.helperText}
            >
                {helperText}
            </FormHelperText>}
        </FormControl>;
    }
}

export default ChipInput;
