import cronstrue from 'cronstrue';
import 'cronstrue/locales/fr';
import 'cronstrue/locales/es';
import 'cronstrue/locales/de';
import 'cronstrue/locales/it';
import 'cronstrue/locales/ru';
import 'cronstrue/locales/zh_CN';
import 'cronstrue/locales/uk';
import 'cronstrue/locales/pt_BR';
import 'cronstrue/locales/pl';

function convertCronToText(cron: string, lang?: ioBroker.Languages): string {
    return cronstrue.toString(cron, { locale: lang });
}

export default convertCronToText;
