import { createMuiTheme } from '@material-ui/core/styles';

import orange from '@material-ui/core/colors/orange';

const step = (16 - 5) / 23 / 100;

function toInt(hex) {

    const rgb = {
        r: 0,
        g: 0,
        b: 0
    };

    if(hex.length === 7) {
        rgb.r = parseInt(hex.substr(1, 2), 16);
        rgb.g = parseInt(hex.substr(3, 2), 16);
        rgb.b = parseInt(hex.substr(5, 2), 16);
    } else if (hex.length === 4) {

        const r = hex.substr(1, 1);
        const g = hex.substr(2, 1);
        const b = hex.substr(3, 1);

        rgb.r = parseInt(r + r, 16);
        rgb.g = parseInt(g + g, 16);
        rgb.b = parseInt(b + b, 16);
    }

    return rgb;
}

function toHex(int) {
    return '#' + Math.round(int.r).toString(16) + Math.round(int.g).toString(16) + Math.round(int.b).toString(16);
}

function getElevation(color, overlayColor, elevation) {

    const rgb = toInt(color);
    const overlay = toInt(overlayColor);

    rgb.r += overlay.r * (0.05 + step * (elevation - 1));
    rgb.g += overlay.g * (0.05 + step * (elevation - 1));
    rgb.b += overlay.b * (0.05 + step * (elevation - 1));

    return toHex(rgb);
}

function getElevations(color, overlay) {

    const elevations = {};

    for(let i = 1; i <= 24; i++) {
        elevations['elevation' + i] = {
            backgroundColor: getElevation(color, overlay, i)
        }
    }

    return elevations;
}

export default type => {
    if (type === 'dark') {
        return createMuiTheme({
            name: type,
            palette: {
                type: 'dark',
                background: {
                    paper: '#121212',
                    default: '#121212'
                },
                primary: {
                    main: '#4dabf5'
                },
                secondary: {
                    main: '#436a93'
                },
                text: {
                    primary: '#ffffff',
                    secondary: '#ffffff'
                }
            },
            overrides: {
                MuiAppBar: {
                    colorDefault: {
                        backgroundColor: '#272727'
                    }
                },
                MuiLink: {
                    root: {
                        textTransform: 'uppercase',
                        transition: 'color .3s ease',
                        color: orange[200],
                        '&:hover': {
                            color: orange[100]
                        }
                    }
                },
                MuiPaper: getElevations('#121212', '#fff')
            }
        });
    } else if (type === 'blue') {
        return createMuiTheme({
            name: type,
            palette: {
                type: 'dark',
                background: {
                    paper: '#151d21',
                    default: '#151d21'
                },
                primary: {
                    main: '#4dabf5'
                },
                secondary: {
                    main: '#436a93'
                },
                text: {
                    primary: '#ffffff',
                    secondary: '#ffffff'
                }
            },
            overrides: {
                MuiAppBar: {
                    colorDefault: {
                        backgroundColor: '#2a3135'
                    }
                },
                MuiLink: {
                    root: {
                        textTransform: 'uppercase',
                        transition: 'color .3s ease',
                        color: orange[200],
                        '&:hover': {
                            color: orange[100]
                        }
                    }
                },
                MuiPaper: getElevations('#151d21', '#fff')
            }
        });
    } else if (type === 'colored') {
        return createMuiTheme({
            name: type,
            palette: {
                type: 'light',
                primary: {
                    main: '#3499CC'
                },
                secondary: {
                    main: '#144578'
                }
            },
            overrides: {
                MuiAppBar: {
                    colorDefault: {
                        backgroundColor: '#3499CC'
                    }
                },
                MuiLink: {
                    root: {
                        textTransform: 'uppercase',
                        transition: 'color .3s ease',
                        color: orange[400],
                        '&:hover': {
                            color: orange[300]
                        }
                    }
                }
            }
        });
    } else {
        return createMuiTheme({
            name: type,
            palette: {
                type: 'light',
                primary: {
                    main: '#3499CC'
                },
                secondary: {
                    main: '#144578'
                }
            },
            overrides: {
                MuiLink: {
                    root: {
                        textTransform: 'uppercase',
                        transition: 'color .3s ease',
                        color: orange[400],
                        '&:hover': {
                            color: orange[300]
                        }
                    }
                }
            }
        });
    }
}