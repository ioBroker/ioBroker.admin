import React, { Component, type JSX } from 'react';
import { ThemeProvider, StyledEngineProvider, createTheme, type Theme } from '@mui/material/styles';

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        grey: true;
    }
}

import langEn from '../../src/i18n/en.json';
import langDe from '../../src/i18n/de.json';
import langRu from '../../src/i18n/ru.json';
import langPt from '../../src/i18n/pt.json';
import langNl from '../../src/i18n/nl.json';
import langFr from '../../src/i18n/fr.json';
import langIt from '../../src/i18n/it.json';
import langEs from '../../src/i18n/es.json';
import langPl from '../../src/i18n/pl.json';
import langUk from '../../src/i18n/uk.json';
import langZhCn from '../../src/i18n/zh-cn.json';
import I18n from '../../src/i18n';
import Cron from '../../src/Dialogs/Cron';

class App extends Component {
    private theme: Theme;

    constructor(props: any) {
        super(props);
        const translations: Record<ioBroker.Languages, Record<string, string>> = {
            en: langEn,
            de: langDe,
            ru: langRu,
            pt: langPt,
            nl: langNl,
            fr: langFr,
            it: langIt,
            es: langEs,
            pl: langPl,
            uk: langUk,
            'zh-cn': langZhCn,
        };
        I18n.setTranslations(translations);
        I18n.setLanguage('en');
        this.theme = createTheme({
            palette: {
                mode: 'dark',
            },
        });
    }

    render(): JSX.Element {
        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.theme}>
                    <Cron
                        onClose={() => {}}
                        onOk={() => {}}
                        cron="0 0 * * *"
                        theme={this.theme}
                    />
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}

export default App;
