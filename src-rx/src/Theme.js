import { createMuiTheme } from '@material-ui/core/styles';

import orange from '@material-ui/core/colors/orange';

export default type => {
    if(type === 'dark') {
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
                MuiPaper: {
                    elevation1: {
                        backgroundColor: '#1d1d1d'
                    },
                    elevation2: {
                        backgroundColor: '#212121'
                    },
                    elevation3: {
                        backgroundColor: '#242424'
                    },
                    elevation4: {
                        backgroundColor: '#272727'
                    }
                }
            }
        });
    } else if(type === 'blue') {
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
                MuiPaper: {
                    elevation1: {
                        backgroundColor: '#21282c'
                    },
                    elevation2: {
                        backgroundColor: '#252d31'
                    },
                    elevation3: {
                        backgroundColor: '#272f32'
                    },
                    elevation4: {
                        backgroundColor: '#2a3135'
                    }
                }
            }
        });
    } else if(type === 'colored') {
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