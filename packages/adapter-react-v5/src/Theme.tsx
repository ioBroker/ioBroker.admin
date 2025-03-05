import { type CSSProperties } from 'react';
import { createTheme, alpha, type PaletteOptions as PaletteOptionsMui } from '@mui/material/styles';
import { orange, grey } from '@mui/material/colors';

import type { SimplePaletteColorOptions } from '@mui/material/styles/createPalette';
import type { ThemeOptions as ThemeOptionsMui } from '@mui/material/styles/createTheme';
import type { IobTheme, ThemeName, ThemeType } from './types';

const step = (16 - 5) / 23 / 100;

/**
 * Convert hex color in the format '#rrggbb' or '#rgb' to an RGB object.
 */
function toInt(hex: string): { r: number; g: number; b: number } {
    const rgb: { r: number; g: number; b: number } = {
        r: 0,
        g: 0,
        b: 0,
    };

    if (hex.length === 7) {
        rgb.r = parseInt(hex.substring(1, 3), 16);
        rgb.g = parseInt(hex.substring(3, 5), 16);
        rgb.b = parseInt(hex.substring(5, 7), 16);
    } else if (hex.length === 4) {
        const r = hex[1];
        const g = hex[2];
        const b = hex[3];

        rgb.r = parseInt(r + r, 16);
        rgb.g = parseInt(g + g, 16);
        rgb.b = parseInt(b + b, 16);
    }

    return rgb;
}

/**
 * Convert an RGB object to a hex color string in the format '#rrggbb'.
 */
function toHex(int: { r: number; g: number; b: number }): string {
    return `#${Math.round(int.r).toString(16)}${Math.round(int.g).toString(16)}${Math.round(int.b).toString(16)}`;
}

/** Returns the hex color string in the format '#rrggbb' */
function getElevation(
    /** color in the format '#rrggbb' or '#rgb' */
    color: string,
    /** overlay color in the format '#rrggbb' or '#rgb' */
    overlayColor: string,
    /** elevation as an integer starting with 1 */
    elevation: number,
): string {
    const rgb: { r: number; g: number; b: number } = toInt(color);
    const overlay: { r: number; g: number; b: number } = toInt(overlayColor);

    rgb.r += overlay.r * (0.05 + step * (elevation - 1));
    rgb.g += overlay.g * (0.05 + step * (elevation - 1));
    rgb.b += overlay.b * (0.05 + step * (elevation - 1));

    return toHex(rgb);
}

/**
 * Get all 24 elevations of the given color and overlay.
 *
 * @param color color in the format '#rrggbb' or '#rgb'
 * @param overlay overlay color in the format '#rrggbb' or '#rgb'
 */
function getElevations(color: string, overlay: string): Record<string, CSSProperties> {
    const elevations: Record<string, CSSProperties> = {};

    for (let i = 1; i <= 24; i++) {
        elevations[`elevation${i}`] = {
            backgroundColor: getElevation(color, overlay, i),
        };
    }

    return elevations;
}

// const buttonsPalette = () => ({
//     palette: {
//         // mode: "dark",
//         grey: {
//             main: grey[300],
//             dark: grey[400],
//         },
//     },
// });

// const buttonsTheme = theme => ({
//     components: {
//         MuiButton: {
//             variants: [
//                 {
//                     props: { variant: 'contained', color: 'grey' },
//                     style: {
//                         color: theme.palette.getContrastText(theme.palette.grey[300]),
//                     },
//                 },
//                 {
//                     props: { variant: 'outlined', color: 'grey' },
//                     style: {
//                         color: theme.palette.text.primary,
//                         borderColor:
//                             theme.palette.mode === 'light'
//                                 ? 'rgba(0, 0, 0, 0.23)'
//                                 : 'rgba(255, 255, 255, 0.23)',
//                         '&.Mui-disabled': {
//                             border: `1px solid ${theme.palette.action.disabledBackground}`,
//                         },
//                         '&:hover': {
//                             borderColor:
//                                 theme.palette.mode === 'light'
//                                     ? 'rgba(0, 0, 0, 0.23)'
//                                     : 'rgba(255, 255, 255, 0.23)',
//                             backgroundColor: alpha(
//                                 theme.palette.text.primary,
//                                 theme.palette.action.hoverOpacity,
//                             ),
//                         },
//                     },
//                 },
//                 {
//                     props: { color: 'grey', variant: 'text' },
//                     style: {
//                         color: 'black',
//                         '&:hover': {
//                             backgroundColor: alpha(
//                                 theme.palette.text.primary,
//                                 theme.palette.action.hoverOpacity,
//                             ),
//                         },
//                     },
//                 },
//             ],
//         },
//     },
// });

interface PaletteOptions extends PaletteOptionsMui {
    mode: ThemeType;
    expert: string;
    grey?: {
        main?: string;
        dark?: string;
        50?: string;
        100?: string;
        200?: string;
        300?: string;
        400?: string;
        500?: string;
        600?: string;
        700?: string;
        800?: string;
        900?: string;
        A100?: string;
        A200?: string;
        A400?: string;
        A700?: string;
    };
}

interface ThemeOptions extends ThemeOptionsMui {
    name: ThemeName;
    palette?: PaletteOptions;
    toolbar?: CSSProperties;
    saveToolbar?: {
        background: string;
        button: CSSProperties;
    };
}

/**
 * The theme creation factory function.
 */
export function Theme(type: ThemeName, overrides?: Record<string, any>): IobTheme {
    let options: ThemeOptions;
    let localOverrides: Record<string, any>;

    if (type === 'dark') {
        localOverrides = {
            MuiAppBar: {
                colorDefault: {
                    backgroundColor: '#272727',
                },
            },
            MuiLink: {
                root: {
                    textTransform: 'uppercase',
                    transition: 'color .3s ease',
                    color: orange[200],
                    '&:hover': {
                        color: orange[100],
                    },
                },
            },
            MuiPaper: getElevations('#121212', '#fff'),
        };

        options = {
            name: type,
            palette: {
                mode: 'dark',
                background: {
                    paper: '#121212',
                    default: '#121212',
                },
                primary: {
                    main: '#4dabf5',
                },
                secondary: {
                    main: '#436a93',
                },
                expert: '#14bb00',
                text: {
                    primary: '#ffffff',
                    secondary: '#ffffff',
                },
            },
        };
    } else if (type === 'blue') {
        localOverrides = {
            MuiAppBar: {
                colorDefault: {
                    backgroundColor: '#3399CC',
                },
            },
            MuiLink: {
                root: {
                    textTransform: 'uppercase',
                    transition: 'color .3s ease',
                    color: orange[400],
                    '&:hover': {
                        color: orange[300],
                    },
                },
            },
        };

        options = {
            name: type,
            palette: {
                mode: 'dark',
                background: {
                    paper: '#151d21',
                    default: '#151d21',
                },
                primary: {
                    main: '#4dabf5',
                },
                secondary: {
                    main: '#436a93',
                },
                expert: '#14bb00',
                text: {
                    primary: '#ffffff',
                    secondary: '#ffffff',
                },
            },
        };
    } else if (type === 'colored') {
        localOverrides = {
            MuiAppBar: {
                colorDefault: {
                    backgroundColor: '#2a3135',
                },
            },
            MuiLink: {
                root: {
                    textTransform: 'uppercase',
                    transition: 'color .3s ease',
                    color: orange[200],
                    '&:hover': {
                        color: orange[100],
                    },
                },
            },
            MuiPaper: getElevations('#151d21', '#fff'),
        };

        options = {
            name: type,
            palette: {
                mode: 'light',
                primary: {
                    main: '#3399CC',
                },
                secondary: {
                    main: '#164477',
                },
                expert: '#96fc96',
            },
        };
    } else if (type === 'PT') {
        localOverrides = {
            MuiAppBar: {
                colorDefault: {
                    backgroundColor: '#0F99DE',
                },
            },
            MuiLink: {
                root: {
                    textTransform: 'uppercase',
                    transition: 'color .3s ease',
                    color: orange[400],
                    '&:hover': {
                        color: orange[300],
                    },
                },
            },
        };

        options = {
            name: type,
            palette: {
                mode: 'light',
                primary: {
                    main: '#0F99DE',
                },
                secondary: {
                    main: '#88A536',
                },
                expert: '#BD1B24',
            },
        };
    } else if (type === 'DX') {
        localOverrides = {
            MuiAppBar: {
                colorDefault: {
                    backgroundColor: '#a9a9a9',
                },
            },
            MuiLink: {
                root: {
                    textTransform: 'uppercase',
                    transition: 'color .3s ease',
                    color: orange[400],
                    '&:hover': {
                        color: orange[300],
                    },
                },
            },
        };

        options = {
            name: type,
            palette: {
                mode: 'light',
                primary: {
                    main: '#F5F5F7',
                },
                secondary: {
                    main: '#a9a9a9',
                },
                expert: '#BD1B24',
                text: {
                    primary: '#007AFE',
                    secondary: '#007AFE',
                    disabled: '#007AFEAA',
                },
            },
        };
    } else {
        localOverrides = {
            MuiLink: {
                root: {
                    textTransform: 'uppercase',
                    transition: 'color .3s ease',
                    color: orange[400],
                    '&:hover': {
                        color: orange[300],
                    },
                },
            },
        };

        options = {
            name: type,
            palette: {
                mode: 'light',
                primary: {
                    main: '#3399CC',
                    dark: '#256c97',
                    light: '#76d0fd',
                },
                secondary: {
                    main: '#164477',
                },
                expert: '#14bb00',
            },
        };
    }

    options.toolbar = {
        height: 48,
    };

    options.saveToolbar = {
        background: (options.palette?.primary as SimplePaletteColorOptions)?.main,
        button: {
            borderRadius: 3,
            height: 32,
        },
    };

    if (options.palette) {
        options.palette.grey = {
            main: grey[300],
            dark: grey[400],
        };
    }

    const theme: IobTheme = createTheme(options) as IobTheme;

    const palette: PaletteOptions = theme.palette as PaletteOptions;

    return createTheme(theme, {
        ...(overrides || undefined),
        components: {
            ...localOverrides,
            MuiButton: {
                variants: [
                    {
                        props: { variant: 'contained', color: 'grey' },
                        style: {
                            backgroundColor: palette.grey?.[300],
                            color:
                                palette.getContrastText && palette.grey?.[300]
                                    ? palette.getContrastText(palette.grey[300])
                                    : undefined,
                        },
                    },
                    {
                        props: { variant: 'outlined', color: 'grey' },
                        style: {
                            color: palette.text?.primary,
                            borderColor: palette.mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)',
                            '&.Mui-disabled': {
                                border: `1px solid ${palette.action?.disabledBackground}`,
                            },
                            '&:hover': {
                                borderColor:
                                    palette.mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)',
                                backgroundColor: alpha(
                                    palette.text?.primary || '',
                                    palette.action?.hoverOpacity || 0.04,
                                ),
                            },
                        },
                    },
                    {
                        props: { variant: 'text', color: 'grey' },
                        style: {
                            color: palette.text?.primary,
                            '&:hover': {
                                backgroundColor: alpha(
                                    palette.text?.primary || '',
                                    palette.action?.hoverOpacity || 0.04,
                                ),
                            },
                        },
                    },
                ],
            },
            ...(overrides?.components || undefined),
        },
    }) as IobTheme;
}
