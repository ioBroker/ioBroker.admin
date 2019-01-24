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
                            {oper: 'eq', text: 'equal'},
                            {oper: 'ne', text: 'not equal'},
                            {oper: 'lt', text: 'less'},
                            {oper: 'le', text: 'less or equal'},
                            {oper: 'gt', text: 'greater'},
                            {oper: 'ge', text: 'greater or equal'},
                            {oper: 'bw', text: 'begins with'},
                            {oper: 'bn', text: 'does not begin with'},
                            {oper: 'in', text: 'is in'},
                            {oper: 'ni', text: 'is not in'},
                            {oper: 'ew', text: 'ends with'},
                            {oper: 'en', text: 'does not end with'},
                            {oper: 'cn', text: 'contains'},
                            {oper: 'nc', text: 'does not contain'}
                        ],
                        groupOps: [
                            {op: "AND", text: "all"},
                            {op: "OR", text: "any"}
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
                    {oper: 'eq', text: "gleich"},
                    {oper: 'ne', text: "ungleich"},
                    {oper: 'lt', text: "kleiner"},
                    {oper: 'le', text: "kleiner gleich"},
                    {oper: 'gt', text: "größer"},
                    {oper: 'ge', text: "größer gleich"},
                    {oper: 'bw', text: "beginnt mit"},
                    {oper: 'bn', text: "beginnt nicht mit"},
                    {oper: 'in', text: "ist in"},
                    {oper: 'ni', text: "ist nicht in"},
                    {oper: 'ew', text: "endet mit"},
                    {oper: 'en', text: "endet nicht mit"},
                    {oper: 'cn', text: "enthält"},
                    {oper: 'nc', text: "enthält nicht"}
                ],
                groupOps: [
                    {op: "AND", text: "alle"},
                    {op: "OR", text: "mindestens eine"}
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
                        ShortDate: "d.m.Y", // in jQuery UI Datepicker: "dd.MM.yyyy"
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
                    {oper: 'eq', text: "равно"},
                    {oper: 'ne', text: "не равно"},
                    {oper: 'lt', text: "меньше"},
                    {oper: 'le', text: "меньше или равно"},
                    {oper: 'gt', text: "больше"},
                    {oper: 'ge', text: "больше или равно"},
                    {oper: 'bw', text: "начинается с"},
                    {oper: 'bn', text: "не начинается с"},
                    {oper: 'in', text: "находится в"},
                    {oper: 'ni', text: "не находится в"},
                    {oper: 'ew', text: "заканчивается на"},
                    {oper: 'en', text: "не заканчивается на"},
                    {oper: 'cn', text: "содержит"},
                    {oper: 'nc', text: "не содержит"}
                ],
                groupOps: [
                    {op: "AND", text: "все"},
                    {op: "OR", text: "любой"}
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

        },
        /**
         * jqGrid Spanish Translation
         * Traduccion jqGrid en Español por Yamil Bracho
         * Traduccion corregida y ampliada por Faserline, S.L. 
         * http://www.faserline.com
         * Traduccion corregida y ampliada por Fernán Castro Asensio
         * Traducción corregida y ampliada por Luis Sánchez
         * Dual licensed under the MIT and GPL licenses:
         * http://www.opensource.org/licenses/mit-license.php
         * http://www.gnu.org/licenses/gpl.html
         **/
        "es": {
            defaults: {
                recordtext: "Mostrando {0} - {1} de {2}",
                emptyrecords: "Sin registros que mostrar",
                loadtext: "Cargando...",
                savetext: "Guardando...",
                pgtext: "Página {0} de {1}",
                pgfirst: "Primera Página",
                pglast: "Última Página",
                pgnext: "Página Siguiente",
                pgprev: "Página Anterior",
                pgrecs: "Registros por página",
                showhide: "Alternar Contraer Expandir Grid",
                // mobile
                pagerCaption: "Grid::Configurar página",
                pageText: "Página:",
                recordPage: "Registros por página",
                nomorerecs: "No más registros...",
                scrollPullup: "Arrastrar arriba para cargar más...",
                scrollPulldown: "Arrastrar arriba para refrescar...",
                scrollRefresh: "Soltar para refrescar..."
            },
            search: {
                caption: "Búsqueda...",
                Find: "Buscar",
                Reset: "Limpiar",
                odata: [{oper: 'eq', text: "igual "}, {oper: 'ne', text: "no igual a"}, {oper: 'lt', text: "menor que"}, {oper: 'le', text: "menor o igual que"}, {oper: 'gt', text: "mayor que"}, {oper: 'ge', text: "mayor o igual a"}, {oper: 'bw', text: "empiece por"}, {oper: 'bn', text: "no empiece por"}, {oper: 'in', text: "está en"}, {oper: 'ni', text: "no está en"}, {oper: 'ew', text: "termina por"}, {oper: 'en', text: "no termina por"}, {oper: 'cn', text: "contiene"}, {oper: 'nc', text: "no contiene"}, {oper: 'nu', text: 'es nulo'}, {oper: 'nn', text: 'no es nulo'}, {oper: 'bt', text: 'entre'}],
                groupOps: [{op: "AND", text: "todo"}, {op: "OR", text: "cualquier"}],
                operandTitle: "Clic para seleccionar la operación de búsqueda.",
                resetTitle: "Reiniciar valores de búsqueda",
                addsubgrup: "Agregar subgrupo",
                addrule: "Agregar regla",
                delgroup: "Borrar grupo",
                delrule: "Borrar regla"
            },
            edit: {
                addCaption: "Agregar registro",
                editCaption: "Modificar registro",
                bSubmit: "Guardar",
                bCancel: "Cancelar",
                bClose: "Cerrar",
                saveData: "Se han modificado los datos, ¿guardar cambios?",
                bYes: "Si",
                bNo: "No",
                bExit: "Cancelar",
                msg: {
                    required: "Campo obligatorio",
                    number: "Introduzca un número",
                    minValue: "El valor debe ser mayor o igual a ",
                    maxValue: "El valor debe ser menor o igual a ",
                    email: "no es una dirección de correo válida",
                    integer: "Introduzca un valor entero",
                    date: "Introduzca una fecha correcta ",
                    url: "no es una URL válida. Prefijo requerido ('http://' or 'https://')",
                    nodefined: " no está definido.",
                    novalue: " valor de retorno es requerido.",
                    customarray: "La función personalizada debe devolver un array.",
                    customfcheck: "La función personalizada debe estar presente en el caso de validación personalizada."
                }
            },
            view: {
                caption: "Consultar registro",
                bClose: "Cerrar"
            },
            del: {
                caption: "Eliminar",
                msg: "¿Desea eliminar los registros seleccionados?",
                bSubmit: "Eliminar",
                bCancel: "Cancelar"
            },
            nav: {
                edittext: " ",
                edittitle: "Modificar fila seleccionada",
                addtext: " ",
                addtitle: "Agregar nueva fila",
                deltext: " ",
                deltitle: "Eliminar fila seleccionada",
                searchtext: " ",
                searchtitle: "Buscar información",
                refreshtext: "",
                refreshtitle: "Recargar datos",
                alertcap: "Aviso",
                alerttext: "Seleccione una fila",
                viewtext: "",
                viewtitle: "Ver fila seleccionada",
                savetext: "",
                savetitle: "Guardar fila",
                canceltext: "",
                canceltitle: "Cancelar edición de fila",
                selectcaption: "Acciones..."
            },
            col: {
                caption: "Mostrar/ocultar columnas",
                bSubmit: "Enviar",
                bCancel: "Cancelar"
            },
            errors: {
                errcap: "Error",
                nourl: "No se ha especificado una URL",
                norecords: "No hay datos para procesar",
                model: "Las columnas de nombres son diferentes de las columnas del modelo"
            },
            formatter: {
                integer: {thousandsSeparator: ".", defaultValue: '0'},
                number: {decimalSeparator: ",", thousandsSeparator: ".", decimalPlaces: 2, defaultValue: '0,00'},
                currency: {decimalSeparator: ",", thousandsSeparator: ".", decimalPlaces: 2, prefix: "", suffix: "", defaultValue: '0,00'},
                date: {
                    dayNames: [
                        "Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa",
                        "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
                    ],
                    monthNames: [
                        "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
                        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                    ],
                    AmPm: ["am", "pm", "AM", "PM"],
                    S: function (j) {
                        return j < 11 || j > 13 ? ['st', 'nd', 'rd', 'th'][Math.min((j - 1) % 10, 3)] : 'th'
                    },
                    srcformat: 'Y-m-d',
                    newformat: 'd-m-Y',
                    parseRe: /[#%\\\/:_;.,\t\s-]/,
                    masks: {
                        ISO8601Long: "Y-m-d H:i:s",
                        ISO8601Short: "Y-m-d",
                        ShortDate: "n/j/Y",
                        LongDate: "l, F d, Y",
                        FullDateTime: "l, F d, Y g:i:s A",
                        MonthDay: "F d",
                        ShortTime: "g:i A",
                        LongTime: "g:i:s A",
                        SortableDateTime: "Y-m-d\\TH:i:s",
                        UniversalSortableDateTime: "Y-m-d H:i:sO",
                        YearMonth: "F, Y"
                    },
                    reformatAfterEdit: false,
                    userLocalTime: false
                },
                baseLinkUrl: '',
                showAction: '',
                target: '',
                checkbox: {disabled: true},
                idName: 'id'
            },
            colmenu: {
                sortasc: "Orden Ascendente",
                sortdesc: "Orden Descendente",
                columns: "Columnas",
                filter: "Filtrar",
                grouping: "Agrupar por",
                ungrouping: "Desagrupar",
                searchTitle: "Obtener elementos con un valor que:",
                freeze: "Inmovilizar",
                unfreeze: "Movilizar",
                reorder: "Mover para reordenar"
            }
        },
        /**
         * jqGrid French Translation
         * Tony Tomov tony@trirand.com
         * http://trirand.com/blog/ 
         * Dual licensed under the MIT and GPL licenses:
         * http://www.opensource.org/licenses/mit-license.php
         * http://www.gnu.org/licenses/gpl.html
         **/
        "fr": {
            defaults: {
                recordtext: "Enregistrements {0} - {1} sur {2}",
                emptyrecords: "Aucun enregistrement à afficher",
                loadtext: "Chargement...",
                savetext: "Sauvegarde en cours...",
                pgtext: "Page {0} de {1}",
                pgfirst: "Première page",
                pglast: "Dernière page",
                pgnext: "Page suivante",
                pgprev: "Page précédente",
                pgrecs: "Enregistrements par page",
                showhide: "Réduire/Agrandir la grille",
                // mobile
                pagerCaption: "Grille::Options de pagination",
                pageText: "Page:",
                recordPage: "Enregistrements par page",
                nomorerecs: "Plus de données...",
                scrollPullup: "Glisser vers le haut pour charger plus de données...",
                scrollPulldown: "Glisser vers le bas pour rafraîchir...",
                scrollRefresh: "Relâcher pour rafraîchir..."
            },
            search: {
                caption: "Recherche...",
                Find: "Chercher",
                Reset: "Réinitialiser",
                odata: [{oper: 'eq', text: "égal"}, {oper: 'ne', text: "différent"}, {oper: 'lt', text: "inférieur"}, {oper: 'le', text: "inférieur ou égal"}, {oper: 'gt', text: "supérieur"}, {oper: 'ge', text: "supérieur ou égal"}, {oper: 'bw', text: "commence par"}, {oper: 'bn', text: "ne commence pas par"}, {oper: 'in', text: "est dans"}, {oper: 'ni', text: "n'est pas dans"}, {oper: 'ew', text: "finit par"}, {oper: 'en', text: "ne finit pas par"}, {oper: 'cn', text: "contient"}, {oper: 'nc', text: "ne contient pas"}, {oper: 'nu', text: 'is null'}, {oper: 'nn', text: 'is not null'}, {oper: 'bt', text: 'entre'}],
                groupOps: [{op: "AND", text: "tous"}, {op: "OR", text: "au moins un"}],
                operandTitle: "Cliquer pour sélectionner l'opérateur.",
                resetTitle: "Réinitialiser la valeur de recherche",
                addsubgrup: "Add subgroup",
                addrule: "Add rule",
                delgroup: "Delete group",
                delrule: "Delete rule"
            },
            edit: {
                addCaption: "Ajouter",
                editCaption: "Éditer",
                bSubmit: "Valider",
                bCancel: "Annuler",
                bClose: "Fermer",
                saveData: "Les données ont changé ! Enregistrer les modifications ?",
                bYes: "Oui",
                bNo: "Non",
                bExit: "Annuler",
                msg: {
                    required: "Champ obligatoire",
                    number: "Saisissez un nombre correct",
                    minValue: "La valeur doit être supérieure ou égale à",
                    maxValue: "La valeur doit être inférieure ou égale à",
                    email: "n'est pas un email valide",
                    integer: "Saisissez un entier valide",
                    url: "n'est pas une adresse valide. Préfixe requis ('http://' or 'https://')",
                    nodefined: " n'est pas défini!",
                    novalue: " la valeur de retour est requise!",
                    customarray: "Une fonction personnalisée devrait retourner un tableau (array)!",
                    customfcheck: "Une fonction personnalisée devrait être présente dans le cas d'une vérification personnalisée!"
                }
            },
            view: {
                caption: "Voir les enregistrements",
                bClose: "Fermer"
            },
            del: {
                caption: "Supprimer",
                msg: "Supprimer les enregistrements sélectionnés ?",
                bSubmit: "Supprimer",
                bCancel: "Annuler"
            },
            nav: {
                edittext: " ",
                edittitle: "Editer la ligne sélectionnée",
                addtext: " ",
                addtitle: "Ajouter une ligne",
                deltext: " ",
                deltitle: "Supprimer la ligne sélectionnée",
                searchtext: " ",
                searchtitle: "Chercher un enregistrement",
                refreshtext: "",
                refreshtitle: "Recharger le tableau",
                alertcap: "Avertissement",
                alerttext: "Veuillez sélectionner une ligne",
                viewtext: "",
                viewtitle: "Afficher la ligne sélectionnée",
                savetext: "",
                savetitle: "Sauvegarder la ligne",
                canceltext: "",
                canceltitle: "Annuler l'édition de la ligne",
                selectcaption: "Actions..."
            },
            col: {
                caption: "Afficher/Masquer les colonnes",
                bSubmit: "Valider",
                bCancel: "Annuler"
            },
            errors: {
                errcap: "Erreur",
                nourl: "Aucune adresse n'est paramétrée",
                norecords: "Aucun enregistrement à traiter",
                model: "Nombre de titres (colNames) <> Nombre de données (colModel)!"
            },
            formatter: {
                integer: {thousandsSeparator: " ", defaultValue: '0'},
                number: {decimalSeparator: ",", thousandsSeparator: " ", decimalPlaces: 2, defaultValue: '0,00'},
                currency: {decimalSeparator: ",", thousandsSeparator: " ", decimalPlaces: 2, prefix: "", suffix: "", defaultValue: '0,00'},
                date: {
                    dayNames: [
                        "Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam",
                        "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"
                    ],
                    monthNames: [
                        "Jan", "Fév", "Mar", "Avr", "Mai", "Jui", "Jul", "Aou", "Sep", "Oct", "Nov", "Déc",
                        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Décembre"
                    ],
                    AmPm: ["am", "pm", "AM", "PM"],
                    S: function (j) {
                        return j == 1 ? 'er' : 'e';
                    },
                    srcformat: 'Y-m-d',
                    newformat: 'd/m/Y',
                    parseRe: /[#%\\\/:_;.,\t\s-]/,
                    masks: {
                        ISO8601Long: "Y-m-d H:i:s",
                        ISO8601Short: "Y-m-d",
                        ShortDate: "n/j/Y",
                        LongDate: "l, F d, Y",
                        FullDateTime: "l, F d, Y g:i:s A",
                        MonthDay: "F d",
                        ShortTime: "g:i A",
                        LongTime: "g:i:s A",
                        SortableDateTime: "Y-m-d\\TH:i:s",
                        UniversalSortableDateTime: "Y-m-d H:i:sO",
                        YearMonth: "F, Y"
                    },
                    reformatAfterEdit: false,
                    userLocalTime: false
                },
                baseLinkUrl: '',
                showAction: '',
                target: '',
                checkbox: {disabled: true},
                idName: 'id'
            },
            colmenu: {
                sortasc: "Trier en ordre croissant",
                sortdesc: "Trier en ordre décroissant",
                columns: "Colonnes",
                filter: "Filtrer",
                grouping: "Grouper par",
                ungrouping: "Séparer",
                searchTitle: "Prendre les items avec la valeur:",
                freeze: "Figer",
                unfreeze: "Relâcher",
                reorder: "Déplacer pour changer l'ordre"
            }
        },
        /**
         * jqGrid Portuguese Translation
         * Traduçã da jqGrid em Portugues por Frederico Carvalho, http://www.eyeviewdesign.pt
         * Dual licensed under the MIT and GPL licenses:
         * http://www.opensource.org/licenses/mit-license.php
         * http://www.gnu.org/licenses/gpl.html
         **/
        "pt": {
            defaults: {
                recordtext: "View {0} - {1} of {2}",
                emptyrecords: "No records to view",
                loadtext: "A carregar...",
                pgtext: "Página {0} de {1}",
                savetext: "Saving...",
                pgfirst: "First Page",
                pglast: "Last Page",
                pgnext: "Next Page",
                pgprev: "Previous Page",
                pgrecs: "Records per Page",
                showhide: "Toggle Expand Collapse Grid",
                // mobile
                pagerCaption: "Grid::Page Settings",
                pageText: "Page:",
                recordPage: "Records per Page",
                nomorerecs: "No more records...",
                scrollPullup: "Pull up to load more...",
                scrollPulldown: "Pull down to refresh...",
                scrollRefresh: "Release to refresh..."
            },
            search: {
                caption: "Busca...",
                Find: "Procurar",
                Reset: "Limpar",
                odata: [{oper: 'eq', text: 'igual'}, {oper: 'ne', text: 'desigual'}, {oper: 'lt', text: 'menor'}, {oper: 'le', text: 'menor ou igual'}, {oper: 'gt', text: 'maior'}, {oper: 'ge', text: 'maior ou igual'}, {oper: 'bw', text: 'comecacom'}, {oper: 'bn', text: 'nao comeca com'}, {oper: 'in', text: 'estadentro'}, {oper: 'ni', text: 'nao esta dentro'}, {oper: 'ew', text: 'finalizacom'}, {oper: 'en', text: 'nao finaliza com'}, {oper: 'cn', text: 'contem'}, {oper: 'nc', text: 'nao contem'}],
                groupOps: [{op: "AND", text: "tudo"}, {op: "OR", text: "qualquer"}],
                operandTitle: "Click to select search operation.",
                resetTitle: "Reset Search Value",
                addsubgrup: "Add subgroup",
                addrule: "Add rule",
                delgroup: "Delete group",
                delrule: "Delete rule"
            },
            edit: {
                addCaption: "Adicionar Registo",
                editCaption: "Modificar Registo",
                bSubmit: "Submeter",
                bCancel: "Cancelar",
                bClose: "Fechar",
                saveData: "Dados foram alterados. Guardar?",
                bYes: "Sim",
                bNo: "Nao",
                bExit: "Cancelar",
                msg: {
                    required: "Campo obrigatório",
                    number: "Por favor, introduza um numero",
                    minValue: "O valor deve ser maior ou igual que",
                    maxValue: "O valor deve ser menor ou igual a",
                    email: "Não é um email válid",
                    integer: "Por favor, introduza um numero inteiro",
                    date: "Introduza una fecha correcta ",
                    url: "nao e um URL valido. Requerido prefixo ('http://' or 'https://')",
                    nodefined: " nao esta definido!",
                    novalue: " valor requerido!",
                    customarray: "Funcao customizada deve entrar!",
                    customfcheck: "Funcao customizada deve estar presente em caso deconfirmar customizacao!"
                }
            },
            view: {
                caption: "View Record",
                bClose: "Close"
            },
            del: {
                caption: "Eliminar",
                msg: "Deseja eliminar o(s) registo(s) seleccionado(s)?",
                bSubmit: "Eliminar",
                bCancel: "Cancelar"
            },
            nav: {
                edittext: " ",
                edittitle: "Modificar registo seleccionado",
                addtext: " ",
                addtitle: "Adicionar novo registo",
                deltext: " ",
                deltitle: "Eliminar registo seleccionado",
                searchtext: " ",
                searchtitle: "Procurar",
                refreshtext: "",
                refreshtitle: "Actualizar",
                alertcap: "Aviso",
                alerttext: "Por favor, seleccione um registo",
                viewtext: "",
                viewtitle: "Ver coluna selecionada",
                savetext: "",
                savetitle: "Save row",
                canceltext: "",
                canceltitle: "Cancel row editing",
                selectcaption: "Actions..."
            },
            col: {
                caption: "Mostrar/Ocultar Colunas",
                bSubmit: "Enviar",
                bCancel: "Cancelar"
            },
            errors: {
                errcap: "Erro",
                nourl: "Não especificou um url",
                norecords: "Não existem dados para processar",
                model: "Tamanho do colNames <> colModel!"
            },
            formatter: {
                integer: {thousandsSeparator: " ", defaultValue: '0'},
                number: {decimalSeparator: ".", thousandsSeparator: " ", decimalPlaces: 2, defaultValue: '0.00'},
                currency: {decimalSeparator: ".", thousandsSeparator: " ", decimalPlaces: 2, prefix: "", suffix: "", defaultValue: '0.00'},
                date: {
                    dayNames: [
                        "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab",
                        "Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"
                    ],
                    monthNames: [
                        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
                        "Janeiro", "Fevereiro", "Mar�o", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                    ],
                    AmPm: ["am", "pm", "AM", "PM"],
                    S: function (j) {
                        return j < 11 || j > 13 ? ['�', '�', '�', '�'][Math.min((j - 1) % 10, 3)] : '�'
                    },
                    srcformat: 'Y-m-d',
                    newformat: 'd/m/Y',
                    parseRe: /[#%\\\/:_;.,\t\s-]/,
                    masks: {
                        ISO8601Long: "Y-m-d H:i:s",
                        ISO8601Short: "Y-m-d",
                        ShortDate: "n/j/Y",
                        LongDate: "l, F d, Y",
                        FullDateTime: "l, F d, Y g:i:s A",
                        MonthDay: "F d",
                        ShortTime: "g:i A",
                        LongTime: "g:i:s A",
                        SortableDateTime: "Y-m-d\\TH:i:s",
                        UniversalSortableDateTime: "Y-m-d H:i:sO",
                        YearMonth: "F, Y"
                    },
                    reformatAfterEdit: false,
                    userLocalTime: false
                },
                baseLinkUrl: '',
                showAction: '',
                target: '',
                checkbox: {disabled: true},
                idName: 'id'
            },
            colmenu: {
                sortasc: "Sort Ascending",
                sortdesc: "Sort Descending",
                columns: "Columns",
                filter: "Filter",
                grouping: "Group By",
                ungrouping: "Ungroup",
                searchTitle: "Get items with value that:",
                freeze: "Freeze",
                unfreeze: "Unfreeze",
                reorder: "Move to reorder"
            }
        },
        /**
         * jqGrid Polish Translation
         * Łukasz Schab lukasz@freetree.pl
         * http://FreeTree.pl
         *
         * Updated names, abbreviations, currency and date/time formats for Polish norms (also corresponding with CLDR v21.0.1 --> http://cldr.unicode.org/index) 
         * Tomasz Pęczek tpeczek@gmail.com
         * http://tpeczek.blogspot.com; http://tpeczek.codeplex.com
         *
         * Dual licensed under the MIT and GPL licenses:
         * http://www.opensource.org/licenses/mit-license.php
         * http://www.gnu.org/licenses/gpl.html
         **/
        "pl": {
            defaults: {
                recordtext: "Pokaż {0} - {1} z {2}",
                emptyrecords: "Brak rekordów do pokazania",
                loadtext: "Ładowanie...",
                pgtext: "Strona {0} z {1}",
                savetext: "Saving...",
                pgfirst: "First Page",
                pglast: "Last Page",
                pgnext: "Next Page",
                pgprev: "Previous Page",
                pgrecs: "Records per Page",
                showhide: "Toggle Expand Collapse Grid",
                // mobile
                pagerCaption: "Grid::Page Settings",
                pageText: "Page:",
                recordPage: "Records per Page",
                nomorerecs: "No more records...",
                scrollPullup: "Pull up to load more...",
                scrollPulldown: "Pull down to refresh...",
                scrollRefresh: "Release to refresh..."
            },
            search: {
                caption: "Wyszukiwanie...",
                Find: "Szukaj",
                Reset: "Czyść",
                odata: [{oper: 'eq', text: "dokładnie"}, {oper: 'ne', text: "różne od"}, {oper: 'lt', text: "mniejsze od"}, {oper: 'le', text: "mniejsze lub równe"}, {oper: 'gt', text: "większe od"}, {oper: 'ge', text: "większe lub równe"}, {oper: 'bw', text: "zaczyna się od"}, {oper: 'bn', text: "nie zaczyna się od"}, {oper: 'in', text: "jest w"}, {oper: 'ni', text: "nie jest w"}, {oper: 'ew', text: "kończy się na"}, {oper: 'en', text: "nie kończy się na"}, {oper: 'cn', text: "zawiera"}, {oper: 'nc', text: "nie zawiera"}, {oper: 'nu', text: 'is null'}, {oper: 'nn', text: 'is not null'}, {oper: 'bt', text: 'between'}],
                groupOps: [{op: "AND", text: "oraz"}, {op: "OR", text: "lub"}],
                operandTitle: "Click to select search operation.",
                resetTitle: "Reset Search Value",
                addsubgrup: "Add subgroup",
                addrule: "Add rule",
                delgroup: "Delete group",
                delrule: "Delete rule"
            },
            edit: {
                addCaption: "Dodaj rekord",
                editCaption: "Edytuj rekord",
                bSubmit: "Zapisz",
                bCancel: "Anuluj",
                bClose: "Zamknij",
                saveData: "Dane zostały zmienione! Zapisać zmiany?",
                bYes: "Tak",
                bNo: "Nie",
                bExit: "Anuluj",
                msg: {
                    required: "Pole jest wymagane",
                    number: "Proszę wpisać poprawną liczbę",
                    minValue: "wartość musi być większa lub równa od",
                    maxValue: "wartość musi być mniejsza lub równa od",
                    email: "nie jest poprawnym adresem e-mail",
                    integer: "Proszę wpisać poprawną liczbę",
                    date: "Proszę podaj poprawną datę",
                    url: "jest niewłaściwym adresem URL. Pamiętaj o prefiksie ('http://' lub 'https://')",
                    nodefined: " niezdefiniowane!",
                    novalue: " wymagana jest wartość zwracana!",
                    customarray: "Funkcja niestandardowa powinna zwracać tablicę!",
                    customfcheck: "Funkcja niestandardowa powinna być obecna w przypadku niestandardowego sprawdzania!"
                }
            },
            view: {
                caption: "Pokaż rekord",
                bClose: "Zamknij"
            },
            del: {
                caption: "Usuń",
                msg: "Czy usunąć wybrany rekord(y)?",
                bSubmit: "Usuń",
                bCancel: "Anuluj"
            },
            nav: {
                edittext: "",
                edittitle: "Edytuj wybrany wiersz",
                addtext: "",
                addtitle: "Dodaj nowy wiersz",
                deltext: "",
                deltitle: "Usuń wybrany wiersz",
                searchtext: "",
                searchtitle: "Wyszukaj rekord",
                refreshtext: "",
                refreshtitle: "Przeładuj",
                alertcap: "Uwaga",
                alerttext: "Proszę wybrać wiersz",
                viewtext: "",
                viewtitle: "Pokaż wybrany wiersz",
                savetext: "",
                savetitle: "Save row",
                canceltext: "",
                canceltitle: "Cancel row editing",
                selectcaption: "Actions..."
            },
            col: {
                caption: "Pokaż/Ukryj kolumny",
                bSubmit: "Zatwierdź",
                bCancel: "Anuluj"
            },
            errors: {
                errcap: "Błąd",
                nourl: "Brak adresu url",
                norecords: "Brak danych",
                model: "Długość colNames <> colModel!"
            },
            formatter: {
                integer: {thousandsSeparator: " ", defaultValue: '0'},
                number: {decimalSeparator: ",", thousandsSeparator: " ", decimalPlaces: 2, defaultValue: '0,00'},
                currency: {decimalSeparator: ",", thousandsSeparator: " ", decimalPlaces: 2, prefix: "", suffix: " zł", defaultValue: '0,00'},
                date: {
                    dayNames: [
                        "niedz.", "pon.", "wt.", "śr.", "czw.", "pt.", "sob.",
                        "niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"
                    ],
                    monthNames: [
                        "sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru",
                        "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"
                    ],
                    AmPm: ["", "", "", ""],
                    S: function (j) {
                        return '';
                    },
                    srcformat: 'Y-m-d',
                    newformat: 'd.m.Y',
                    parseRe: /[#%\\\/:_;.,\t\s-]/,
                    masks: {
                        ISO8601Long: "Y-m-d H:i:s",
                        ISO8601Short: "Y-m-d",
                        ShortDate: "d.m.y",
                        LongDate: "l, j F Y",
                        FullDateTime: "l, j F Y H:i:s",
                        MonthDay: "j F",
                        ShortTime: "H:i",
                        LongTime: "H:i:s",
                        SortableDateTime: "Y-m-d\\TH:i:s",
                        UniversalSortableDateTime: "Y-m-d H:i:sO",
                        YearMonth: "F Y"
                    },
                    reformatAfterEdit: false,
                    userLocalTime: false
                },
                baseLinkUrl: '',
                showAction: '',
                target: '',
                checkbox: {disabled: true},
                idName: 'id'
            },
            colmenu: {
                sortasc: "Sort Ascending",
                sortdesc: "Sort Descending",
                columns: "Columns",
                filter: "Filter",
                grouping: "Group By",
                ungrouping: "Ungroup",
                searchTitle: "Get items with value that:",
                freeze: "Freeze",
                unfreeze: "Unfreeze",
                reorder: "Move to reorder"
            }
        },
        "nl": {
            defaults:
                    {
                        recordtext: "regels {0} - {1} van {2}",
                        emptyrecords: "Geen data gevonden.",
                        loadtext: "Laden...",
                        pgtext: "pagina  {0}  van {1}",
                        savetext: "Saving...",
                        pgfirst: "Eerste Pagina",
                        pglast: "Laatste Pagina",
                        pgnext: "Volgende Pagina",
                        pgprev: "Vorige Pagina",
                        pgrecs: "Records per Pagina",
                        showhide: "Schakelen Uitklappen Inklappen Grid",
                        // mobile
                        pagerCaption: "Grid::Page Settings",
                        pageText: "Page:",
                        recordPage: "Records per Page",
                        nomorerecs: "No more records...",
                        scrollPullup: "Pull up to load more...",
                        scrollPulldown: "Pull down to refresh...",
                        scrollRefresh: "Release to refresh..."
                    },
            search:
                    {
                        caption: "Zoeken...",
                        Find: "Zoek",
                        Reset: "Herstellen",
                        odata: [{oper: 'eq', text: "gelijk aan"}, {oper: 'ne', text: "niet gelijk aan"}, {oper: 'lt', text: "kleiner dan"}, {oper: 'le', text: "kleiner dan of gelijk aan"}, {oper: 'gt', text: "groter dan"}, {oper: 'ge', text: "groter dan of gelijk aan"}, {oper: 'bw', text: "begint met"}, {oper: 'bn', text: "begint niet met"}, {oper: 'in', text: "is in"}, {oper: 'ni', text: "is niet in"}, {oper: 'ew', text: "eindigt met"}, {oper: 'en', text: "eindigt niet met"}, {oper: 'cn', text: "bevat"}, {oper: 'nc', text: "bevat niet"}, {oper: 'nu', text: 'is null'}, {oper: 'nn', text: 'is not null'}, {oper: 'bt', text: 'between'}],
                        groupOps: [{op: "AND", text: "alle"}, {op: "OR", text: "een van de"}],
                        operandTitle: "Klik om de zoekterm te selecteren.",
                        resetTitle: "Herstel zoekterm",
                        addsubgrup: "Add subgroup",
                        addrule: "Add rule",
                        delgroup: "Delete group",
                        delrule: "Delete rule"
                    },
            edit:
                    {
                        addCaption: "Nieuw",
                        editCaption: "Bewerken",
                        bSubmit: "Opslaan",
                        bCancel: "Annuleren",
                        bClose: "Sluiten",
                        saveData: "Er is data aangepast! Wijzigingen opslaan?",
                        bYes: "Ja",
                        bNo: "Nee",
                        bExit: "Sluiten",
                        msg:
                                {
                                    required: "Veld is verplicht",
                                    number: "Voer a.u.b. geldig nummer in",
                                    minValue: "Waarde moet groter of gelijk zijn aan ",
                                    maxValue: "Waarde moet kleiner of gelijk zijn aan",
                                    email: "is geen geldig e-mailadres",
                                    integer: "Voer a.u.b. een geldig getal in",
                                    date: "Voer a.u.b. een geldige waarde in",
                                    url: "is geen geldige URL. Prefix is verplicht ('http://' or 'https://')",
                                    nodefined: " is niet gedefineerd!",
                                    novalue: " return waarde is verplicht!",
                                    customarray: "Aangepaste functie moet array teruggeven!",
                                    customfcheck: "Aangepaste function moet aanwezig zijn in het geval van aangepaste controle!"
                                }
                    },
            view:
                    {
                        caption: "Tonen",
                        bClose: "Sluiten"
                    },
            del:
                    {
                        caption: "Verwijderen",
                        msg: "Verwijder geselecteerde regel(s)?",
                        bSubmit: "Verwijderen",
                        bCancel: "Annuleren"
                    },
            nav:
                    {
                        edittext: "",
                        edittitle: "Bewerken",
                        addtext: "",
                        addtitle: "Nieuw",
                        deltext: "",
                        deltitle: "Verwijderen",
                        searchtext: "",
                        searchtitle: "Zoeken",
                        refreshtext: "",
                        refreshtitle: "Vernieuwen",
                        alertcap: "Waarschuwing",
                        alerttext: "Selecteer a.u.b. een regel",
                        viewtext: "",
                        viewtitle: "Openen",
                        savetext: "",
                        savetitle: "Save row",
                        canceltext: "",
                        canceltitle: "Cancel row editing",
                        selectcaption: "Actions..."
                    },
            col:
                    {
                        caption: "Tonen/verbergen kolommen",
                        bSubmit: "OK",
                        bCancel: "Annuleren"
                    },
            errors:
                    {
                        errcap: "Fout",
                        nourl: "Er is geen URL gedefinieerd",
                        norecords: "Geen data om te verwerken",
                        model: "Lengte van 'colNames' is niet gelijk aan 'colModel'!"
                    },
            formatter:
                    {
                        integer:
                                {
                                    thousandsSeparator: ".",
                                    defaultValue: "0"
                                },
                        number:
                                {
                                    decimalSeparator: ",",
                                    thousandsSeparator: ".",
                                    decimalPlaces: 2,
                                    defaultValue: "0.00"
                                },
                        currency:
                                {
                                    decimalSeparator: ",",
                                    thousandsSeparator: ".",
                                    decimalPlaces: 2,
                                    prefix: "EUR ",
                                    suffix: "",
                                    defaultValue: "0.00"
                                },
                        date:
                                {
                                    dayNames: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za", "Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
                                    monthNames: ["Jan", "Feb", "Maa", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "October", "November", "December"],
                                    AmPm: ["am", "pm", "AM", "PM"],
                                    S: function (b) {
                                        return b < 11 || b > 13 ? ["st", "nd", "rd", "th"][Math.min((b - 1) % 10, 3)] : "th"
                                    },
                                    srcformat: "Y-m-d",
                                    newformat: "d/m/Y",
                                    parseRe: /[#%\\\/:_;.,\t\s-]/,
                                    masks:
                                            {
                                                ISO8601Long: "Y-m-d H:i:s",
                                                ISO8601Short: "Y-m-d",
                                                ShortDate: "n/j/Y",
                                                LongDate: "l, F d, Y",
                                                FullDateTime: "l d F Y G:i:s",
                                                MonthDay: "d F",
                                                ShortTime: "G:i",
                                                LongTime: "G:i:s",
                                                SortableDateTime: "Y-m-d\\TH:i:s",
                                                UniversalSortableDateTime: "Y-m-d H:i:sO",
                                                YearMonth: "F, Y"
                                            },
                                    reformatAfterEdit: false,
                                    userLocalTime: false
                                },
                        baseLinkUrl: "",
                        showAction: "",
                        target: "",
                        checkbox:
                                {
                                    disabled: true
                                },
                        idName: "id"
                    },
            colmenu: {
                sortasc: "Sort Ascending",
                sortdesc: "Sort Descending",
                columns: "Columns",
                filter: "Filter",
                grouping: "Group By",
                ungrouping: "Ungroup",
                searchTitle: "Get items with value that:",
                freeze: "Freeze",
                unfreeze: "Unfreeze",
                reorder: "Move to reorder"
            }
        },
        /**
         * jqGrid Chinese Translation
         * 咖啡兔 yanhonglei@gmail.com 
         * http://www.kafeitu.me 
         * 
         * 花岗岩 marbleqi@163.com
         * 
         * Dual licensed under the MIT and GPL licenses:
         * http://www.opensource.org/licenses/mit-license.php
         * http://www.gnu.org/licenses/gpl.html 
         **/
        "zh-cn": {
            defaults: {
                recordtext: "第{0}到第{1}条\u3000共 {2} 条", // 共字前是全角空格
                emptyrecords: "没有记录！",
                loadtext: "读取中...",
                savetext: "保存中...",
                pgtext: "第{0}页\u3000共{1}页",
                pgfirst: "第一页",
                pglast: "最后一页",
                pgnext: "下一页",
                pgprev: "上一页",
                pgrecs: "每页记录数",
                showhide: "切换 展开 折叠 表格",
                // mobile
                pagerCaption: "表格::页面设置",
                pageText: "Page:",
                recordPage: "每页记录数",
                nomorerecs: "没有更多记录...",
                scrollPullup: "加载更多...",
                scrollPulldown: "刷新...",
                scrollRefresh: "滚动刷新..."
            },
            search: {
                caption: "搜索...",
                Find: "查找",
                Reset: "重置",
                odata: [{oper: 'eq', text: '等于\u3000\u3000'}, {oper: 'ne', text: '不等于\u3000'}, {oper: 'lt', text: '小于\u3000\u3000'}, {oper: 'le', text: '小于等于'}, {oper: 'gt', text: '大于\u3000\u3000'}, {oper: 'ge', text: '大于等于'}, {oper: 'bw', text: '开头是'}, {oper: 'bn', text: '开头不是'}, {oper: 'in', text: '属于\u3000\u3000'}, {oper: 'ni', text: '不属于'}, {oper: 'ew', text: '结尾是'}, {oper: 'en', text: '结尾不是'}, {oper: 'cn', text: '包含\u3000\u3000'}, {oper: 'nc', text: '不包含'}, {oper: 'nu', text: '为空'}, {oper: 'nn', text: '不为空'}, {oper: 'bt', text: '区间'}],
                groupOps: [{op: "AND", text: "满足所有条件"}, {op: "OR", text: "满足任一条件"}],
                operandTitle: "单击进行搜索。",
                resetTitle: "重置搜索条件",
                addsubgrup: "添加条件组",
                addrule: "添加条件",
                delgroup: "删除条件组",
                delrule: "删除条件"
            },
            edit: {
                addCaption: "添加记录",
                editCaption: "编辑记录",
                bSubmit: "提交",
                bCancel: "取消",
                bClose: "关闭",
                saveData: "数据已修改，是否保存？",
                bYes: "是",
                bNo: "否",
                bExit: "取消",
                msg: {
                    required: "此字段必需",
                    number: "请输入有效数字",
                    minValue: "输值必须大于等于 ",
                    maxValue: "输值必须小于等于 ",
                    email: "这不是有效的e-mail地址",
                    integer: "请输入有效整数",
                    date: "请输入有效时间",
                    url: "无效网址。前缀必须为 ('http://' 或 'https://')",
                    nodefined: " 未定义！",
                    novalue: " 需要返回值！",
                    customarray: "自定义函数需要返回数组！",
                    customfcheck: "必须有自定义函数!"
                }
            },
            view: {
                caption: "查看记录",
                bClose: "关闭"
            },
            del: {
                caption: "删除",
                msg: "删除所选记录？",
                bSubmit: "删除",
                bCancel: "取消"
            },
            nav: {
                edittext: "",
                edittitle: "编辑所选记录",
                addtext: "",
                addtitle: "添加新记录",
                deltext: "",
                deltitle: "删除所选记录",
                searchtext: "",
                searchtitle: "查找",
                refreshtext: "",
                refreshtitle: "刷新表格",
                alertcap: "注意",
                alerttext: "请选择记录",
                viewtext: "",
                viewtitle: "查看所选记录",
                savetext: "",
                savetitle: "保存记录",
                canceltext: "",
                canceltitle: "取消编辑记录",
                selectcaption: "操作..."
            },
            col: {
                caption: "选择列",
                bSubmit: "确定",
                bCancel: "取消"
            },
            errors: {
                errcap: "错误",
                nourl: "没有设置url",
                norecords: "没有需要处理的记录",
                model: "colNames 和 colModel 长度不等！"
            },
            formatter: {
                integer: {thousandsSeparator: ",", defaultValue: '0'},
                number: {decimalSeparator: ".", thousandsSeparator: ",", decimalPlaces: 2, defaultValue: '0.00'},
                currency: {decimalSeparator: ".", thousandsSeparator: ",", decimalPlaces: 2, prefix: "", suffix: "", defaultValue: '0.00'},
                date: {
                    dayNames: [
                        "日", "一", "二", "三", "四", "五", "六",
                        "星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六",
                    ],
                    monthNames: [
                        "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二",
                        "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"
                    ],
                    AmPm: ["am", "pm", "上午", "下午"],
                    S: function (j) {
                        return j < 11 || j > 13 ? ['st', 'nd', 'rd', 'th'][Math.min((j - 1) % 10, 3)] : 'th';
                    },
                    srcformat: 'Y-m-d',
                    newformat: 'Y-m-d',
                    parseRe: /[#%\\\/:_;.,\t\s-]/,
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
                    reformatAfterEdit: false,
                    userLocalTime: false
                },
                baseLinkUrl: '',
                showAction: '',
                target: '',
                checkbox: {disabled: true},
                idName: 'id'
            },
            colmenu: {
                sortasc: "升序排序",
                sortdesc: "降序排序",
                columns: "列",
                filter: "筛选",
                grouping: "分类",
                ungrouping: "取消分类",
                searchTitle: "查找:",
                freeze: "冻结",
                unfreeze: "取消冻结",
                reorder: "重新排序"
            }
        },
        "it": {
            defaults: {
                recordtext: "Mostra {0} - {1} di {2}",
                emptyrecords: "Non ci sono record da mostrare",
                loadtext: "Caricamento...",
                savetext: "Salvataggio...",
                pgtext: "Pagina {0} di {1}",
                pgfirst: "Prima Pagina",
                pglast: "Ultima Pagina",
                pgnext: "Pagina Successiva",
                pgprev: "Pagina Precedente",
                pgrecs: "Records per Pagina",
                showhide: "Espandi o collassa griglia",
                // mobile
                pagerCaption: "Griglia::Impostaioni della pagina",
                pageText: "Pagina:",
                recordPage: "Records per Pagina",
                nomorerecs: "Non ci sono altri record...",
                scrollPullup: "Trascina verso l'alto per altri...",
                scrollPulldown: "Trascina verso il basso per aggiornare...",
                scrollRefresh: "Rilascia per aggiornare..."
            },
            search: {
                caption: "Cerca...",
                Find: "Trova",
                Reset: "Reset",
                odata: [{oper: 'eq', text: 'uguale'}, {oper: 'ne', text: 'diverso'}, {oper: 'lt', text: 'minore'}, {oper: 'le', text: 'minore o uguale'}, {oper: 'gt', text: 'maggiore'}, {oper: 'ge', text: 'maggiore o uguale'}, {oper: 'bw', text: 'inizia per'}, {oper: 'bn', text: 'non inizia per'}, {oper: 'in', text: 'è in'}, {oper: 'ni', text: 'non è in'}, {oper: 'ew', text: 'finisce per'}, {oper: 'en', text: 'non finisce per'}, {oper: 'cn', text: 'contiene'}, {oper: 'nc', text: 'non contiene'}, {oper: 'nu', text: 'è null'}, {oper: 'nn', text: 'non è null'}, {oper: 'bt', text: 'between'}],
                groupOps: [{op: "AND", text: "tutti"}, {op: "OR", text: "ciascuno"}],
                operandTitle: "Clicca sull'opzione di ricerca scelta.",
                resetTitle: "Resetta valori di ricerca",
                addsubgrup: "Add subgroup",
                addrule: "Add rule",
                delgroup: "Delete group",
                delrule: "Delete rule"
            },
            edit: {
                addCaption: "Aggiungi Record",
                editCaption: "Modifica Record",
                bSubmit: "Invia",
                bCancel: "Annulla",
                bClose: "Chiudi",
                saveData: "I dati sono stati modificati! Salvare le modifiche?",
                bYes: "Si",
                bNo: "No",
                bExit: "Annulla",
                msg: {
                    required: "Campo obbligatorio",
                    number: "Per favore, inserisci un numero valido",
                    minValue: "il valore deve essere maggiore o uguale a ",
                    maxValue: "il valore deve essere minore o uguale a ",
                    email: "non è una e-mail valida",
                    integer: "Per favore, inserisci un intero valido",
                    date: "Per favore, inserisci una data valida",
                    url: "non è un URL valido. Prefissi richiesti ('http://' o 'https://')",
                    nodefined: " non è definito!",
                    novalue: " valore di ritorno richiesto!",
                    customarray: "La funzione personalizzata deve restituire un array!",
                    customfcheck: "La funzione personalizzata deve essere presente in caso di controlli personalizzati!"

                }
            },
            view: {
                caption: "Visualizza Record",
                bClose: "Chiudi"
            },
            del: {
                caption: "Cancella",
                msg: "Cancellare i record selezionati?",
                bSubmit: "Canella",
                bCancel: "Annulla"
            },
            nav: {
                edittext: "",
                edittitle: "Modifica riga selezionata",
                addtext: "",
                addtitle: "Aggiungi riga",
                deltext: "",
                deltitle: "Cancella riga",
                searchtext: "",
                searchtitle: "Trova record",
                refreshtext: "",
                refreshtitle: "Ricarica tabella",
                alertcap: "Attenzione",
                alerttext: "Per favore, seleziona un record",
                viewtext: "",
                viewtitle: "Visualizza riga selezionata",
                savetext: "",
                savetitle: "Salva riga",
                canceltext: "",
                canceltitle: "Annulla modifica riga",
                selectcaption: "Actions..."
            },
            col: {
                caption: "Seleziona colonne",
                bSubmit: "Ok",
                bCancel: "Annulla"
            },
            errors: {
                errcap: "Errore",
                nourl: "Nessun url impostato",
                norecords: "Non ci sono record da elaborare",
                model: "Lunghezza dei colNames <> colModel!"
            },
            formatter: {
                integer: {
                    thousandsSeparator: ".",
                    defaultValue: "0"
                },
                number: {
                    decimalSeparator: ",",
                    thousandsSeparator: ".",
                    decimalPlaces: 2,
                    defaultValue: "0,00"
                },
                currency: {
                    decimalSeparator: ",",
                    thousandsSeparator: ".",
                    decimalPlaces: 2,
                    prefix: "€ ",
                    suffix: "",
                    defaultValue: "0,00"
                },
                date: {
                    dayNames: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
                    monthNames: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic", "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
                    AmPm: ["am", "pm", "AM", "PM"],
                    S: function (b) {
                        return b < 11 || b > 13 ? ["st", "nd", "rd", "th"][Math.min((b - 1) % 10, 3)] : "th"
                    },
                    srcformat: "Y-m-d",
                    newformat: "d/m/Y",
                    parseRe: /[#%\\\/:_;.,\t\s-]/,
                    masks: {
                        ISO8601Long: "Y-m-d H:i:s",
                        ISO8601Short: "Y-m-d",
                        ShortDate: "d/m/Y",
                        LongDate: "l d F Y",
                        FullDateTime: "l d F Y G:i:s",
                        MonthDay: "F d",
                        ShortTime: "H:i",
                        LongTime: "H:i:s",
                        SortableDateTime: "Y-m-d\\TH:i:s",
                        UniversalSortableDateTime: "Y-m-d H:i:sO",
                        YearMonth: "F, Y"
                    },
                    reformatAfterEdit: false,
                    userLocalTime: false
                },
                baseLinkUrl: "",
                showAction: "",
                target: "",
                checkbox: {disabled: true},
                idName: "id"
            },
            colmenu: {
                sortasc: "Sort Ascending",
                sortdesc: "Sort Descending",
                columns: "Columns",
                filter: "Filter",
                grouping: "Group By",
                ungrouping: "Ungroup",
                searchTitle: "Get items with value that:",
                freeze: "Freeze",
                unfreeze: "Unfreeze",
                reorder: "Move to reorder"
            }
        }
    };

    $.extend($.jgrid, langs[lang]);
}