'use strict';

var systemLang = 'en';
var systemDictionary = {};

function translateWord(text, lang, dictionary) {
    if (!text) return '';
    lang       = lang       || systemLang;
    dictionary = dictionary || systemDictionary;

    text = text.toString();

    if (dictionary[text]) {
        var newText = dictionary[text][lang];
        if (newText) {
            return newText;
        } else if (lang !== 'en') {
            newText = dictionary[text].en;
            if (newText) {
                return newText;
            }
        }
    } else if (typeof text === 'string' && !text.match(/_tooltip$/)) {
        console.log('"' + text + '": {"en": "' + text + '", "de": "' + text + '", "ru": "' + text + '", "pt": "' + text + '", "nl": "' + text + '", "fr": "' + text + '"},');
    } else if (typeof text !== 'string') {
        console.warn('Trying to translate non-text:' + text);
    }
    return text;
}

function translateAll(lang, dictionary) {
    lang       = lang       || systemLang;
    dictionary = dictionary || systemDictionary;

    // translate <div class="translate">textToTranslate</div>
    $('.translate').each(function (idx) {
        var text = $(this).attr('data-lang');
        if (!text) {
            text = $(this).html();
            $(this).attr('data-lang', text);
        }

        var transText = translateWord(text, lang, dictionary);
        if (transText) {
            $(this).html(transText);
        }
    });
    // translate <input type="button" class="translateV" value="textToTranslate">
    $('.translateV').each(function (idx) {
        var text = $(this).attr('data-lang');
        if (!text) {
            text = $(this).attr('value');
            $(this).attr('data-lang', text);
        }

        var transText = translateWord(text, lang, dictionary);
        if (transText) {
            $(this).attr('value', transText);
        }
    });
    $('.translateB').each(function (idx) {
        //<span class="ui-button-text" >Save</span>
        var text = $(this).attr('data-lang');
        if (!text) {
            text = $(this).html().match(/\>([\w ]+)\</);
            if (text && text.length > 1) {
                text = text[1];
            } else {
                text = $(this).html();
                $(this).attr('data-lang-pure', true);
            }
            $(this).attr('data-lang', text);
        }
        var transText = translateWord(text, lang, dictionary);
        if (transText) {
            if ($(this).attr('data-lang-pure')) {
                $(this).html(transText);
            } else {
                $(this).html($(this).html().replace(/>[\w ]+</, '>' + transText + '<'));
            }
        }
    });
    $('.translateT').each(function (idx) {
        //<span class="ui-button-text translateT" title="TextToTranslate">Save</span>
        var text = $(this).attr('data-lang');
        if (!text) {
            text = $(this).attr('title');
            $(this).attr('data-lang', text);
        }
        var transText = translateWord(text, lang, dictionary);
        if (transText) {
            $(this).attr('title', transText);
        }
    });
}

// make possible _('words to translate')
var _ = function (text, arg1, arg2, arg3) {
    text = translateWord(text);

    var pos = text.indexOf('%s');
    if (pos !== -1) {
        text = text.replace('%s', arg1);
    } else {
        return text;
    }

    pos = text.indexOf('%s');
    if (pos !== -1)  {
        text = text.replace('%s', arg2);
    } else {
        return text;
    }

    pos = text.indexOf('%s');
    if (pos !== -1)  {
        text = text.replace('%s', arg3);
    }

    return text;
};

