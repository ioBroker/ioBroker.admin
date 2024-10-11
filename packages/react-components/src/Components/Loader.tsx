/**
 * Copyright 2018-2024 Denis Haev (bluefox) <dogafox@gmail.com>
 *
 * MIT License
 *
 */
import React, { useEffect } from 'react';
import type { ThemeName, ThemeType } from '../types';
// import './loader.css'

declare global {
    interface Window {
        loadingBackgroundImage: undefined | string;
        loadingBackgroundColor: undefined | string;
        loadingHideLogo: undefined | 'true';
    }
}

const loaderStyles = `
/**
 * Copyright 2018-2024 Denis Haev (bluefox) <dogafox@gmail.com>
 *
 * MIT License
 *
 **/

.logo-background-light, .logo-background-colored {
    background: white;
}
.logo-background-dark, .logo-background-blue {
    background: black;
}
.logo-div {
    position: absolute;
    top: 50%;
    left: 50%;
    -ms-transform: translateX(-50%) translateY(-50%);
    -webkit-transform: translate(-50%,-50%);
    transform: translate(-50%,-50%);
    overflow: hidden;
    border-radius: 50%;
    z-index: 2;
}
.logo-border {
    /*border-color: #164477;*/
    border-top-color: #3399CC;
    border-left-color: #164477;
    border-bottom-color: #164477;
    border-right-color: #164477;
    border-radius: 50%;
    border-style: solid;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    position: absolute;
}
.logo-top {
    position: absolute;
    width: 4.5%;
    height: 16%;
    top: 0;
    z-index: 2;
}
.logo-i {
    position: absolute;
    width: 14.5%;
    height: 60%;
    top: 20%;
    left: 42%;
    background: #3399CC;
}
.logo-i-top {
    position: absolute;
    width: 14.5%;
    height: 4%;
    left: 42%;
    background: #3399CC;
    border-radius: 100%;
}
.logo-back {
    width: 100%;
    height: 100%;
    z-index: 0;
    overflow: hidden;
}
@keyframes logo-grow {
    0% {
        width: 230px;
        height: 230px;
        transform: translate(-50%,-50%) scale(1);
        opacity: 1
    }
    99% {
        width: 230px;
        height: 230px;
        transform: translate(-50%,-50%) scale(10);
        opacity: 0;
    }
    100% {
        width: 0;
        height: 0;
        opacity: 0;
    }
}
@keyframes logo-spin { 100% { -webkit-transform: rotate(360deg); transform: rotate(360deg); } }
@keyframes logo-color-inside-light {
    0% {
        background: #FEFEFE;
    }
    100% {
        background: #3399CC;
    }
}
@keyframes logo-color-inside-dark {
    0% {
        background: #030303;
    }
    100% {
        background: #3399CC;
    }
}
@keyframes logo-color-inside-colored {
    0% {
        background: #FEFEFE;
    }
    100% {
        background: #3399CC;
    }
}
@keyframes logo-color-inside-blue {
    0% {
        background: #030303;
    }
    100% {
        background: #3399CC;
    }
}

@keyframes logo-color-outside-light {
    0% {
        border-color: #FEFEFE;
    }
    100% {
        border-top-color: #3399CC;
        border-left-color: #164477;
        border-bottom-color: #164477;
        border-right-color: #164477;
    }
}
@keyframes logo-color-outside-dark  {
    0% {
        border-color: #040404;
    }
    100% {
        border-top-color: #3399CC;
        border-left-color: #164477;
        border-bottom-color: #164477;
        border-right-color: #164477;
    }
}
@keyframes logo-color-outside-colored {
    0% {
        border-color: #FEFEFE;
    }
    100% {
        border-top-color: #3399CC;
        border-left-color: #164477;
        border-bottom-color: #164477;
        border-right-color: #164477;
    }
}
@keyframes logo-color-outside-blue  {
    0% {
        border-color: #040404;
    }
    100% {
        border-top-color: #3399CC;
        border-left-color: #164477;
        border-bottom-color: #164477;
        border-right-color: #164477;
    }
}

.logo-animate-wait {
    animation: logo-color-outside 1.5s, logo-spin 1.5s linear infinite;
}

.logo-animate-grow-light {
    background: #DDD;
}
.logo-animate-grow-dark {
    background: #1d1d1d;
}
.logo-animate-grow-colored {
    background: #DDD;
}
.logo-animate-grow-blue {
    background: #1d1d1d;
}

.logo-animate-grow {
    display: inline-block;
    text-align: center;
    z-index: 1;
    top: 50%;
    left: 50%;
    -ms-transform: translateX(-50%) translateY(-50%);
    -webkit-transform: translate(-50%,-50%);
    transform: translate(-50%,-50%);
    width: 245px;
    height: 245px;
    border-radius: 50%;
    position: absolute;
    animation: logo-grow 1s 1 ease forwards;
}

.logo-animate-color-inside-light {
    animation: logo-color-inside-light 2.5s;
}
.logo-animate-color-inside-dark {
    animation: logo-color-inside-dark 2.5s;
}
.logo-animate-color-inside-colored {
    animation: logo-color-inside-colored 2.5s;
}
.logo-animate-color-inside-blue {
    animation: logo-color-inside-blue 2.5s;
}

.logo-animate-color-outside-light {
    animation: logo-color-outside-light 1.5s;
}
.logo-animate-color-outside-dark {
    animation: logo-color-outside-dark 1.5s;
}
.logo-animate-color-outside-colored {
    animation: logo-color-outside-colored 1.5s;
}
.logo-animate-color-outside-blue {
    animation: logo-color-outside-blue 1.5s;
}
`;

interface LoaderProps {
    /** The size in pixels of this loader. */
    size?: number;
    /** The chosen theme type. */
    themeType?: ThemeType;
    /** Theme name */
    themeName?: ThemeName;
    /** @deprecated Theme name. use themeName instead */
    theme?: ThemeName;
    /** Background color */
    backgroundColor?: string;
    /** Background image URL */
    backgroundImage?: string;
}

export function Loader(props: LoaderProps): React.JSX.Element {
    useEffect(() => {
        if (!window.document.getElementById('loader-iobroker-component')) {
            const style = window.document.createElement('style');
            style.setAttribute('id', 'loader-iobroker-component');
            style.innerHTML = loaderStyles;
            window.document.head.appendChild(style);
        }
    }, []);

    const size = props.size || 234;
    const theme = props.themeName || props.theme || props.themeType || 'light';
    return (
        <div
            className={`logo-back logo-background-${theme}`}
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
                          : undefined,
                backgroundSize: 'cover',
            }}
        >
            {window.loadingHideLogo === 'true' ? null : (
                <>
                    <div
                        className="logo-div"
                        style={{ width: size, height: size }}
                    >
                        <div
                            className={`logo-top logo-background-${theme}`}
                            style={{ left: '37%' }}
                        />
                        <div
                            className={`logo-top logo-background-${theme}`}
                            style={{ left: '57%' }}
                        />
                        <div
                            className={`logo-border logo-background-${theme} logo-animate-wait`}
                            style={{ borderWidth: size * 0.132 }}
                        />
                        <div className={`logo-i logo-animate-color-inside-${theme}`} />
                        <div
                            className={`logo-i-top logo-animate-color-inside-${theme}`}
                            style={{ top: '18%' }}
                        />
                        <div
                            className={`logo-i-top logo-animate-color-inside-${theme}`}
                            style={{ bottom: '18%' }}
                        />
                    </div>
                    <div
                        className={`logo-animate-grow logo-animate-grow-${theme}`}
                        style={{ width: size + 11, height: size + 11 }}
                    />
                </>
            )}
        </div>
    );
}
