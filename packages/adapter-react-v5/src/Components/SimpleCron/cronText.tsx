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

/**
 * Enhanced cron to text conversion that handles edge cases better than cronstrue alone
 */
export function convertCronToText(cron: string, lang?: ioBroker.Languages): string {
    const cronParts = cron.trim().split(/\s+/);
    
    // Handle 5-part cron expressions (without seconds)
    if (cronParts.length === 5) {
        const [minutes, hours, date, months, dow] = cronParts;
        
        // Handle edge case: */n * * * * where n creates misleading "every n minutes" description
        if (minutes.indexOf('*/') === 0 && hours === '*' && date === '*' && months === '*' && dow === '*') {
            const interval = parseInt(minutes.substring(2), 10);
            
            // For intervals >= 30 minutes, the description becomes misleading
            // because */59 runs at minute 0 and 59, creating 1-minute gaps
            if (interval >= 30) {
                const minutesList: number[] = [];
                for (let i = 0; i < 60; i += interval) {
                    minutesList.push(i);
                }
                
                // Generate more accurate description - use padStart-like logic
                const minutesText = minutesList.map(m => {
                    const str = m.toString();
                    return str.length === 1 ? '0' + str : str;
                }).join(', ');
                
                // Localized text for "at minute(s) X of every hour"
                const translations: Record<string, string> = {
                    'en': `at minute ${minutesText} of every hour`,
                    'de': `zur Minute ${minutesText} jeder Stunde`,
                    'fr': `à la minute ${minutesText} de chaque heure`,
                    'es': `en el minuto ${minutesText} de cada hora`,
                    'it': `al minuto ${minutesText} di ogni ora`,
                    'ru': `в минуту ${minutesText} каждого часа`,
                    'pl': `w minucie ${minutesText} każdej godziny`,
                    'pt': `no minuto ${minutesText} de cada hora`,
                    'zh': `每小时的第 ${minutesText} 分钟`,
                    'uk': `на хвилині ${minutesText} кожної години`,
                };
                
                return translations[lang || 'en'] || translations['en'];
            }
        }
    }
    
    // For all other cases, use cronstrue as before
    try {
        return cronstrue.toString(cron, { locale: lang });
    } catch {
        return cron; // Fallback to raw cron expression if parsing fails
    }
}
