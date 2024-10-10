/**
 * Copyright 2021-2024 ioBroker GmbH
 *
 * MIT License
 *
 */
import React, { useEffect } from 'react';

import type { ThemeType, ThemeName } from '../../types';

// import './PT.css'
const ptStyles = `
.logo-background-light, .logo-background-colored {
    background: white;
}
.logo-background-dark, .logo-background-blue {
    background: black;
}
.pt-logo-div {
    position: absolute;
    top: 50%;
    left: 50%;
    -ms-transform: translateX(-50%) translateY(-50%);
    -webkit-transform: translate(-50%,-50%);
    transform: translate(-50%,-50%);
    z-index: 2;
}
.pt-logo-border {
    border-style: solid;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    position: absolute;
}
.pt-loader-block {
    height: 65px;
    width: 74px;
    border-radius: 15px;
    position: absolute;
    box-sizing: content-box;
}
.pt-loader-blue {
    border: 9px solid #0F99DE;
    transform: rotate(5grad);
    left: 93px;
    top: 0;
    animation: spin-blue 5s ease-in-out infinite;
}
.pt-loader-green {
    border: 9px solid #88A536;
    transform: rotate(-6grad);
    left: 70px;
    top: 58px;
    animation: spin-green 5s ease-in-out infinite;
}
.pt-loader-red {
    border: 9px solid #BD1B24;
    transform: rotate(-15grad);
    left: 24px;
    top: 100px;
    animation: spin-red 5s ease-in-out infinite;
}

@keyframes spin-blue {
    0% {
        transform: rotate(5deg);
    }
    25% {
        transform: rotate(185deg);
    }
    50% {
        transform: rotate(185deg);
    }
    75% {
        transform: rotate(185deg);
    }
    100% {
        transform: rotate(185deg);
    }
}
@keyframes spin-green {
    0% {
        transform: rotate(-6deg);
    }
    25% {
        transform: rotate(-6deg);
    }
    50% {
        transform: rotate(174deg);
    }
    75% {
        transform: rotate(174deg);
    }
    100% {
        transform: rotate(-6deg);
    }
}
@keyframes spin-red {
    0% {
        transform: rotate(-15deg);
    }
    25% {
        transform: rotate(-15deg);
    }
    50% {
        transform: rotate(-15deg);
    }
    75% {
        transform: rotate(165deg);
    }
    100% {
        transform: rotate(165deg);
    }
}
`;

interface LoaderPTProps {
    /** The size in pixels of this loader. */
    size?: number;
    /** The chosen theme type. */
    themeType?: ThemeType;
    /** The chosen theme name. */
    themeName?: ThemeName;
    /** Background color */
    backgroundColor?: string;
    /** Background image URL */
    backgroundImage?: string;
}

/**
 * A loader component with the vendor-specific logo
 *
 * @param props Properties of the loader of type LoaderPTProps
 */
export function LoaderPT(props: LoaderPTProps): React.JSX.Element {
    const size = props.size || 200;
    useEffect(() => {
        if (!window.document.getElementById('pt-iobroker-component')) {
            const style = window.document.createElement('style');
            style.setAttribute('id', 'pt-iobroker-component');
            style.innerHTML = ptStyles;
            window.document.head.appendChild(style);
        }
    }, []);

    const themeName = props.themeType || props.themeName || 'light';
    return (
        <div
            className={`pt-logo-back logo-background-${themeName}`}
            style={{
                backgroundImage:
                    props.backgroundImage && props.backgroundImage !== '@@loginBackgroundImage@@'
                        ? props.backgroundImage
                        : window.loadingBackgroundImage && window.loadingBackgroundImage !== '@@loginBackgroundImage@@'
                          ? `url(${window.loadingBackgroundImage})`
                          : undefined,
                backgroundColor:
                    props.backgroundColor && props.backgroundColor !== '@@loginBackgroundColor@@'
                        ? props.backgroundColor
                        : window.loadingBackgroundColor && window.loadingBackgroundColor !== '@@loginBackgroundColor@@'
                          ? window.loadingBackgroundColor
                          : props.themeType === 'dark'
                            ? '#000'
                            : '#FFF',
                backgroundSize: 'cover',
            }}
        >
            <div
                className="pt-logo-div"
                style={{ width: size, height: size }}
            >
                <div style={{ width: 200, height: 200 }}>
                    <div className="pt-loader-blue pt-loader-block" />
                    <div className="pt-loader-green pt-loader-block" />
                    <div className="pt-loader-red pt-loader-block" />
                </div>
            </div>
        </div>
    );
}
