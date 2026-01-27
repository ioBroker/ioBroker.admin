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
        console.log('"' + text + '": {"en": "' + text + '", "de": "' + text + '", "ru": "' + text + '", "pt": "' + text + '", "nl": "' + text + '", "fr": "' + text + '", "es": "' + text + '", "pl": "' + text + '", "it": "' + text + '", "zh-cn": "' + text + '"},');
    } else if (typeof text !== 'string') {
        console.warn('Trying to translate non-text:' + text);
    }
    return text;
}

function translateAll(selector, lang, dictionary) {
    lang       = lang       || systemLang;
    dictionary = dictionary || systemDictionary;
    if (!selector) {
        selector = 'body';
    }
    var $selector = $(selector);

    // translate <div class="translate">textToTranslate</div>
    $selector.find('.translate').each(function (idx) {
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
    $selector.find('.translateV').each(function (idx) {
        var text = $(this).attr('data-lang-value');
        if (!text) {
            text = $(this).attr('value');
            $(this).attr('data-lang-value', text);
        }

        var transText = translateWord(text, lang, dictionary);
        if (transText) {
            $(this).attr('value', transText);
        }
    });
    $selector.find('.translateT').each(function (idx) {
        //<span class="ui-button-text translateT" title="TextToTranslate">Save</span>
        var text = $(this).attr('data-lang-title');
        if (!text) {
            text = $(this).attr('title');
            $(this).attr('data-lang-title', text);
        }
        var transText = translateWord(text, lang, dictionary);
        if (transText) {
            $(this).attr('title', transText);
        }
    });
    $selector.find('.translateP').each(function (idx) {
        //<span class="ui-button-text translateP" placeholder="TextToTranslate">Save</span>
        var text = $(this).attr('data-lang-placeholder');
        if (!text) {
            text = $(this).attr('placeholder');
            $(this).attr('data-lang-placeholder', text);
        }
        var transText = translateWord(text, lang, dictionary);
        if (transText) {
            $(this).attr('placeholder', transText);
        }
    });
}

function translateName(name) {
    if (name && typeof name === 'object') {
        return name[systemLang] || name.en;
    } else {
        return name;
    }
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

