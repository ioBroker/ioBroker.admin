function initGridLanguage(lang) {
    $.jgrid = $.jgrid || {};

    lang = lang || 'en';

    var langs = {
        'en': /**
         * jqGrid English Translation
         * Tony Tomov tony@trirand.com
         * http://trirand.com/blog/
         * Dual licensed under the MIT and GPL licenses:
         * http://www.opensource.org/licenses/mit-license.php
         * http://www.gnu.org/licenses/gpl.html
         **/
        {
            defaults: {
                recordtext: "View {0} - {1} of {2}",
                emptyrecords: "No records to view",
                loadtext: "Loading...",
                pgtext: "Page {0} of {1}"
            },
            search: {
                caption: "Search...",
                Find: "Find",
                Reset: "Reset",
                odata: [
                    { oper: 'eq', text: 'equal'},
                    { oper: 'ne', text: 'not equal'},
                    { oper: 'lt', text: 'less'},
                    { oper: 'le', text: 'less or equal'},
                    { oper: 'gt', text: 'greater'},
                    { oper: 'ge', text: 'greater or equal'},
                    { oper: 'bw', text: 'begins with'},
                    { oper: 'bn', text: 'does not begin with'},
                    { oper: 'in', text: 'is in'},
                    { oper: 'ni', text: 'is not in'},
                    { oper: 'ew', text: 'ends with'},
                    { oper: 'en', text: 'does not end with'},
                    { oper: 'cn', text: 'contains'},
                    { oper: 'nc', text: 'does not contain'}
                ],
                groupOps: [
                    { op: "AND", text: "all" },
                    { op: "OR", text: "any" }
                ]
            },
            edit: {
                addCaption: "Add Record",
                editCaption: "Edit Record",
                bSubmit: "Submit",
                bCancel: "Cancel",
                bClose: "Close",
                saveData: "Data has been changed! Save changes?",
                bYes: "Yes",
                bNo: "No",
                bExit: "Cancel",
                msg: {
                    required: "Field is required",
                    number: "Please, enter valid number",
                    minValue: "value must be greater than or equal to ",
                    maxValue: "value must be less than or equal to",
                    email: "is not a valid e-mail",
                    integer: "Please, enter valid integer value",
                    date: "Please, enter valid date value",
                    url: "is not a valid URL. Prefix required ('http://' or 'https://')",
                    nodefined: " is not defined!",
                    novalue: " return value is required!",
                    customarray: "Custom function should return array!",
                    customfcheck: "Custom function should be present in case of custom checking!"

                }
            },
            view: {
                caption: "View Record",
                bClose: "Close"
            },
            del: {
                caption: "Delete",
                msg: "Delete selected record(s)?",
                bSubmit: "Delete",
                bCancel: "Cancel"
            },
            nav: {
                edittext: "",
                edittitle: "Edit selected row",
                addtext: "",
                addtitle: "Add new row",
                deltext: "",
                deltitle: "Delete selected row",
                searchtext: "",
                searchtitle: "Find records",
                refreshtext: "",
                refreshtitle: "Reload Grid",
                alertcap: "Warning",
                alerttext: "Please, select row",
                viewtext: "",
                viewtitle: "View selected row"
            },
            col: {
                caption: "Select columns",
                bSubmit: "Ok",
                bCancel: "Cancel"
            },
            errors: {
                errcap: "Error",
                nourl: "No url is set",
                norecords: "No records to process",
                model: "Length of colNames <> colModel!"
            },
            formatter: {
                integer: {thousandsSeparator: ",", defaultValue: '0'},
                number: {decimalSeparator: ".", thousandsSeparator: ",", decimalPlaces: 2, defaultValue: '0.00'},
                currency: {decimalSeparator: ".", thousandsSeparator: ",", decimalPlaces: 2, prefix: "", suffix: "", defaultValue: '0.00'},
                date: {
                    dayNames: [
                        "Sun", "Mon", "Tue", "Wed", "Thr", "Fri", "Sat",
                        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
                    ],
                    monthNames: [
                        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
                    ],
                    AmPm: ["am", "pm", "AM", "PM"],
                    S: function (j) {
                        return j < 11 || j > 13 ? ['st', 'nd', 'rd', 'th'][Math.min((j - 1) % 10, 3)] : 'th';
                    },
                    srcformat: 'Y-m-d',
                    newformat: 'n/j/Y',
                    parseRe: /[Tt\\\/:_;.,\t\s-]/,
                    masks: {
                        // see http://php.net/manual/en/function.date.php for PHP format used in jqGrid
                        // and see http://docs.jquery.com/UI/Datepicker/formatDate
                        // and https://github.com/jquery/globalize#dates for alternative formats used frequently
                        // one can find on https://github.com/jquery/globalize/tree/master/lib/cultures many
                        // information about date, time, numbers and currency formats used in different countries
                        // one should just convert the information in PHP format
                        ISO8601Long: "Y-m-d H:i:s",
                        ISO8601Short: "Y-m-d",
                        // short date:
                        //    n - Numeric representation of a month, without leading zeros
                        //    j - Day of the month without leading zeros
                        //    Y - A full numeric representation of a year, 4 digits
                        // example: 3/1/2012 which means 1 March 2012
                        ShortDate: "n/j/Y", // in jQuery UI Datepicker: "M/d/yyyy"
                        // long date:
                        //    l - A full textual representation of the day of the week
                        //    F - A full textual representation of a month
                        //    d - Day of the month, 2 digits with leading zeros
                        //    Y - A full numeric representation of a year, 4 digits
                        LongDate: "l, F d, Y", // in jQuery UI Datepicker: "dddd, MMMM dd, yyyy"
                        // long date with long time:
                        //    l - A full textual representation of the day of the week
                        //    F - A full textual representation of a month
                        //    d - Day of the month, 2 digits with leading zeros
                        //    Y - A full numeric representation of a year, 4 digits
                        //    g - 12-hour format of an hour without leading zeros
                        //    i - Minutes with leading zeros
                        //    s - Seconds, with leading zeros
                        //    A - Uppercase Ante meridiem and Post meridiem (AM or PM)
                        FullDateTime: "l, F d, Y g:i:s A", // in jQuery UI Datepicker: "dddd, MMMM dd, yyyy h:mm:ss tt"
                        // month day:
                        //    F - A full textual representation of a month
                        //    d - Day of the month, 2 digits with leading zeros
                        MonthDay: "F d", // in jQuery UI Datepicker: "MMMM dd"
                        // short time (without seconds)
                        //    g - 12-hour format of an hour without leading zeros
                        //    i - Minutes with leading zeros
                        //    A - Uppercase Ante meridiem and Post meridiem (AM or PM)
                        ShortTime: "g:i A", // in jQuery UI Datepicker: "h:mm tt"
                        // long time (with seconds)
                        //    g - 12-hour format of an hour without leading zeros
                        //    i - Minutes with leading zeros
                        //    s - Seconds, with leading zeros
                        //    A - Uppercase Ante meridiem and Post meridiem (AM or PM)
                        LongTime: "g:i:s A", // in jQuery UI Datepicker: "h:mm:ss tt"
                        SortableDateTime: "Y-m-d\\TH:i:s",
                        UniversalSortableDateTime: "Y-m-d H:i:sO",
                        // month with year
                        //    Y - A full numeric representation of a year, 4 digits
                        //    F - A full textual representation of a month
                        YearMonth: "F, Y" // in jQuery UI Datepicker: "MMMM, yyyy"
                    },
                    reformatAfterEdit: false
                },
                baseLinkUrl: '',
                showAction: '',
                target: '',
                checkbox: {disabled: true},
                idName: 'id'
            }
        },
        /**
         * jqGrid German Translation
         * Version 1.0.0 (developed for jQuery Grid 3.3.1)
         * Olaf Klöppel opensource@blue-hit.de
         * http://blue-hit.de/
         *
         * Updated for jqGrid 3.8
         * Andreas Flack
         * http://www.contentcontrol-berlin.de
         *
         * Updated for jQuery 4.4
         * Oleg Kiriljuk oleg.kiriljuk@ok-soft-gmbh.com
         * the format corresponds now the format from
         * https://github.com/jquery/globalize/blob/master/lib/cultures/globalize.culture.de.js
         *
         * Dual licensed under the MIT and GPL licenses:
         * http://www.opensource.org/licenses/mit-license.php
         * http://www.gnu.org/licenses/gpl.html
         **/
        "de": {
            defaults: {
                recordtext: "Zeige {0} - {1} von {2}",
                emptyrecords: "Keine Datensätze vorhanden",
                loadtext: "Lädt...",
                pgtext: "Seite {0} von {1}"
            },
            search: {
                caption: "Suche...",
                Find: "Suchen",
                Reset: "Zurücksetzen",
                odata: [
                    { oper: 'eq', text: "gleich"},
                    { oper: 'ne', text: "ungleich"},
                    { oper: 'lt', text: "kleiner"},
                    { oper: 'le', text: "kleiner gleich"},
                    { oper: 'gt', text: "größer"},
                    { oper: 'ge', text: "größer gleich"},
                    { oper: 'bw', text: "beginnt mit"},
                    { oper: 'bn', text: "beginnt nicht mit"},
                    { oper: 'in', text: "ist in"},
                    { oper: 'ni', text: "ist nicht in"},
                    { oper: 'ew', text: "endet mit"},
                    { oper: 'en', text: "endet nicht mit"},
                    { oper: 'cn', text: "enthält"},
                    { oper: 'nc', text: "enthält nicht"}
                ],
                groupOps: [
                    { op: "AND", text: "alle" },
                    { op: "OR", text: "mindestens eine" }
                ]
            },
            edit: {
                addCaption: "Datensatz hinzufügen",
                editCaption: "Datensatz bearbeiten",
                bSubmit: "Speichern",
                bCancel: "Abbrechen",
                bClose: "Schließen",
                saveData: "Daten wurden geändert! Änderungen speichern?",
                bYes: "ja",
                bNo: "nein",
                bExit: "abbrechen",
                msg: {
                    required: "Feld ist erforderlich",
                    number: "Bitte geben Sie eine Zahl ein",
                    minValue: "Wert muss größer oder gleich sein, als ",
                    maxValue: "Wert muss kleiner oder gleich sein, als ",
                    email: "ist keine gültige E-Mail-Adresse",
                    integer: "Bitte geben Sie eine Ganzzahl ein",
                    date: "Bitte geben Sie ein gültiges Datum ein",
                    url: "ist keine gültige URL. Präfix muss eingegeben werden ('http://' oder 'https://')",
                    nodefined: " ist nicht definiert!",
                    novalue: " Rückgabewert ist erforderlich!",
                    customarray: "Benutzerdefinierte Funktion sollte ein Array zurückgeben!",
                    customfcheck: "Benutzerdefinierte Funktion sollte im Falle der benutzerdefinierten Überprüfung vorhanden sein!"
                }
            },
            view: {
                caption: "Datensatz anzeigen",
                bClose: "Schließen"
            },
            del: {
                caption: "Löschen",
                msg: "Ausgewählte Datensätze löschen?",
                bSubmit: "Löschen",
                bCancel: "Abbrechen"
            },
            nav: {
                edittext: " ",
                edittitle: "Ausgewählte Zeile editieren",
                addtext: " ",
                addtitle: "Neue Zeile einfügen",
                deltext: " ",
                deltitle: "Ausgewählte Zeile löschen",
                searchtext: " ",
                searchtitle: "Datensatz suchen",
                refreshtext: "",
                refreshtitle: "Tabelle neu laden",
                alertcap: "Warnung",
                alerttext: "Bitte Zeile auswählen",
                viewtext: "",
                viewtitle: "Ausgewählte Zeile anzeigen"
            },
            col: {
                caption: "Spalten auswählen",
                bSubmit: "Speichern",
                bCancel: "Abbrechen"
            },
            errors: {
                errcap: "Fehler",
                nourl: "Keine URL angegeben",
                norecords: "Keine Datensätze zu bearbeiten",
                model: "colNames und colModel sind unterschiedlich lang!"
            },
            formatter: {
                integer: {thousandsSeparator: ".", defaultValue: '0'},
                number: {decimalSeparator: ",", thousandsSeparator: ".", decimalPlaces: 2, defaultValue: '0,00'},
                currency: {decimalSeparator: ",", thousandsSeparator: ".", decimalPlaces: 2, prefix: "", suffix: " €", defaultValue: '0,00'},
                date: {
                    dayNames: [
                        "So", "Mo", "Di", "Mi", "Do", "Fr", "Sa",
                        "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"
                    ],
                    monthNames: [
                        "Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
                        "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"
                    ],
                    AmPm: ["", "", "", ""],
                    S: function (j) {
                        return '.';
                    }, // one can also use 'er' instead of '.' but one have to use additional word like 'der' or 'den' before
                    srcformat: 'Y-m-d',
                    newformat: 'd.m.Y',
                    parseRe: /[Tt\\\/:_;.,\t\s-]/,
                    masks: {
                        // see http://php.net/manual/en/function.date.php for PHP format used in jqGrid
                        // and see http://docs.jquery.com/UI/Datepicker/formatDate
                        // and https://github.com/jquery/globalize#dates for alternative formats used frequently
                        ISO8601Long: "Y-m-d H:i:s",
                        ISO8601Short: "Y-m-d",
                        // short date:
                        //    d - Day of the month, 2 digits with leading zeros
                        //    m - Numeric representation of a month, with leading zeros
                        //    Y - A full numeric representation of a year, 4 digits
                        ShortDate: "d.m.Y",	// in jQuery UI Datepicker: "dd.MM.yyyy"
                        // long date:
                        //    l - A full textual representation of the day of the week
                        //    j - Day of the month without leading zeros
                        //    F - A full textual representation of a month
                        //    Y - A full numeric representation of a year, 4 digits
                        LongDate: "l, j. F Y", // in jQuery UI Datepicker: "dddd, d. MMMM yyyy"
                        // long date with long time:
                        //    l - A full textual representation of the day of the week
                        //    j - Day of the month without leading zeros
                        //    F - A full textual representation of a month
                        //    Y - A full numeric representation of a year, 4 digits
                        //    H - 24-hour format of an hour with leading zeros
                        //    i - Minutes with leading zeros
                        //    s - Seconds, with leading zeros
                        FullDateTime: "l, j. F Y H:i:s", // in jQuery UI Datepicker: "dddd, d. MMMM yyyy HH:mm:ss"
                        // month day:
                        //    d - Day of the month, 2 digits with leading zeros
                        //    F - A full textual representation of a month
                        MonthDay: "d F", // in jQuery UI Datepicker: "dd MMMM"
                        // short time (without seconds)
                        //    H - 24-hour format of an hour with leading zeros
                        //    i - Minutes with leading zeros
                        ShortTime: "H:i", // in jQuery UI Datepicker: "HH:mm"
                        // long time (with seconds)
                        //    H - 24-hour format of an hour with leading zeros
                        //    i - Minutes with leading zeros
                        //    s - Seconds, with leading zeros
                        LongTime: "H:i:s", // in jQuery UI Datepicker: "HH:mm:ss"
                        SortableDateTime: "Y-m-d\\TH:i:s",
                        UniversalSortableDateTime: "Y-m-d H:i:sO",
                        // month with year
                        //    F - A full textual representation of a month
                        //    Y - A full numeric representation of a year, 4 digits
                        YearMonth: "F Y" // in jQuery UI Datepicker: "MMMM yyyy"
                    },
                    reformatAfterEdit: false
                },
                baseLinkUrl: '',
                showAction: '',
                target: '',
                checkbox: {disabled: true},
                idName: 'id'
            }
        },
        /**
         * jqGrid Russian Translation v1.0 02.07.2009 (based on translation by Alexey Kanaev v1.1 21.01.2009, http://softcore.com.ru)
         * Sergey Dyagovchenko
         * http://d.sumy.ua
         * Dual licensed under the MIT and GPL licenses:
         * http://www.opensource.org/licenses/mit-license.php
         * http://www.gnu.org/licenses/gpl.html
         **/
        "ru": {
            defaults: {
                recordtext: "Просмотр {0} - {1} из {2}",
                emptyrecords: "Нет записей для просмотра",
                loadtext: "Загрузка...",
                pgtext: "Стр. {0} из {1}"
            },
            search: {
                caption: "Поиск...",
                Find: "Найти",
                Reset: "Сброс",
                odata: [
                    { oper: 'eq', text: "равно"},
                    { oper: 'ne', text: "не равно"},
                    { oper: 'lt', text: "меньше"},
                    { oper: 'le', text: "меньше или равно"},
                    { oper: 'gt', text: "больше"},
                    { oper: 'ge', text: "больше или равно"},
                    { oper: 'bw', text: "начинается с"},
                    { oper: 'bn', text: "не начинается с"},
                    { oper: 'in', text: "находится в"},
                    { oper: 'ni', text: "не находится в"},
                    { oper: 'ew', text: "заканчивается на"},
                    { oper: 'en', text: "не заканчивается на"},
                    { oper: 'cn', text: "содержит"},
                    { oper: 'nc', text: "не содержит"}
                ],
                groupOps: [
                    { op: "AND", text: "все" },
                    { op: "OR", text: "любой" }
                ]
            },
            edit: {
                addCaption: "Добавить запись",
                editCaption: "Редактировать запись",
                bSubmit: "Сохранить",
                bCancel: "Отмена",
                bClose: "Закрыть",
                saveData: "Данные были измененны! Сохранить изменения?",
                bYes: "Да",
                bNo: "Нет",
                bExit: "Отмена",
                msg: {
                    required: "Поле является обязательным",
                    number: "Пожалуйста, введите правильное число",
                    minValue: "значение должно быть больше либо равно",
                    maxValue: "значение должно быть меньше либо равно",
                    email: "некорректное значение e-mail",
                    integer: "Пожалуйста, введите целое число",
                    date: "Пожалуйста, введите правильную дату",
                    url: "неверная ссылка. Необходимо ввести префикс ('http://' или 'https://')",
                    nodefined: " не определено!",
                    novalue: " возвращаемое значение обязательно!",
                    customarray: "Пользовательская функция должна возвращать массив!",
                    customfcheck: "Пользовательская функция должна присутствовать в случаи пользовательской проверки!"
                }
            },
            view: {
                caption: "Просмотр записи",
                bClose: "Закрыть"
            },
            del: {
                caption: "Удалить",
                msg: "Удалить выбранную запись(и)?",
                bSubmit: "Удалить",
                bCancel: "Отмена"
            },
            nav: {
                edittext: " ",
                edittitle: "Редактировать выбранную запись",
                addtext: " ",
                addtitle: "Добавить новую запись",
                deltext: " ",
                deltitle: "Удалить выбранную запись",
                searchtext: " ",
                searchtitle: "Найти записи",
                refreshtext: "",
                refreshtitle: "Обновить таблицу",
                alertcap: "Внимание",
                alerttext: "Пожалуйста, выберите запись",
                viewtext: "",
                viewtitle: "Просмотреть выбранную запись"
            },
            col: {
                caption: "Показать/скрыть столбцы",
                bSubmit: "Сохранить",
                bCancel: "Отмена"
            },
            errors: {
                errcap: "Ошибка",
                nourl: "URL не установлен",
                norecords: "Нет записей для обработки",
                model: "Число полей не соответствует числу столбцов таблицы!"
            },
            formatter: {
                integer: {thousandsSeparator: " ", defaultValue: '0'},
                number: {decimalSeparator: ",", thousandsSeparator: " ", decimalPlaces: 2, defaultValue: '0,00'},
                currency: {decimalSeparator: ",", thousandsSeparator: " ", decimalPlaces: 2, prefix: "", suffix: "", defaultValue: '0,00'},
                date: {
                    dayNames: [
                        "Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб",
                        "Воскресение", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"
                    ],
                    monthNames: [
                        "Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
                        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
                    ],
                    AmPm: ["am", "pm", "AM", "PM"],
                    S: function (j) {
                        return j < 11 || j > 13 ? ['st', 'nd', 'rd', 'th'][Math.min((j - 1) % 10, 3)] : 'th'
                    },
                    srcformat: 'Y-m-d',
                    newformat: 'd.m.Y',
                    parseRe: /[Tt\\\/:_;.,\t\s-]/,
                    masks: {
                        ISO8601Long: "Y-m-d H:i:s",
                        ISO8601Short: "Y-m-d",
                        ShortDate: "n.j.Y",
                        LongDate: "l, F d, Y",
                        FullDateTime: "l, F d, Y G:i:s",
                        MonthDay: "F d",
                        ShortTime: "G:i",
                        LongTime: "G:i:s",
                        SortableDateTime: "Y-m-d\\TH:i:s",
                        UniversalSortableDateTime: "Y-m-d H:i:sO",
                        YearMonth: "F, Y"
                    },
                    reformatAfterEdit: false
                },
                baseLinkUrl: '',
                showAction: '',
                target: '',
                checkbox: {disabled: true},
                idName: 'id'
            }

        }
    };

    $.extend($.jgrid, langs[lang]);
}