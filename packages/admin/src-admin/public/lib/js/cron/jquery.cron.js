function translateCron() {
    if (typeof systemDictionary !== 'undefined' && !systemDictionary['CRON Every %s seconds']) {
        for (var w in jQueryCronWords) {
            if (jQueryCronWords.hasOwnProperty(w)) {
                systemDictionary[w] = jQueryCronWords[w];
            }
        }
        //translateAll('#dialog-cron');
    }
}

function setupCron(value, callback) {
    var $el      = $('#dialog-cron');
    var $input   = $el.find('.cron-input');
    var $seconds = $el.find('.cron-checkbox-seconds');
    $el.data('callback', callback);

    if (value !== undefined) {
        $input.val(value);
    }

    $el.find('.btn-clear').off('click').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        $input.val('').trigger('change');
    });
    $el.find('.btn-apply').off('click').click(function () {
        var cb = $el.data('callback');
        $el.data('callback', null);
        cb($input.val());
    });
    $el.find('.btn-cancel').off('click').click(function () {
        var cb = $el.data('callback');
        $el.data('callback', null);
        cb();
    });
    var types = [
        'second',
        'minute',
        'hour',
        'day',
        'month',
        'week'
    ];

    var everyText = [
        'CRON Every %s seconds',
        'CRON Every %s minutes',
        'CRON Every %s hours',
        'CRON Every %s days',
        'CRON Every %s months'
    ];

    var cronArr;
    var updateInput = false;

    var value = $input.val();
    if (!value) {
        $seconds.prop('checked', false);
        cronArr = null;
    } else {
        cronArr = value.split(' ');
        if (cronArr.length === 5) {
            $seconds.prop('checked', false);
            cronArr.unshift('*');
        } else {
            $seconds.prop('checked', true);
        }
    }

    var drawEach = {
        second: drawEachSecond,
        minute: drawEachMinute,
        hour:   drawEachHour,
        day:    drawEachDay,
        month:  drawEachMonth,
        week:   drawEachWeekday
    };

    function enableSeconds(isEnabled) {
        if (isEnabled === undefined) {
            isEnabled =  $seconds.prop('checked');
        }

        if (isEnabled) {
            $el.find('.cron-tab-second').show();
        } else {
            $el.find('.cron-tab-second').hide();
            if (getActiveTab() === 'cron-tabs-second') {
                $el.find('.tabs').mtabs('select', 'cron-tabs-minute');
            }
        }
    }

    function getActiveTab() {
        return M.Tabs.getInstance($el.find('.tabs')).$activeTabLink.attr('href').replace(/^#/, '');
    }

    $el.find('.tabs').mtabs();
    $el.find('.cron-type-selector').select().off('change').change(function () {
        if ($input.is(':focus') || updateInput) return;
        cronArr = cronArr || ['*', '*', '*', '*', '*', '*'];
        var type = $(this).data('type');
        var val  = $(this).val();
        var cronVal;
        var $tab = $el.find('.page[data-type="' + type + '"]');
        if (val === 'every') {
            cronVal = '*';
            $tab.find('.n').hide();
            $tab.find('.each').hide();
        } else if (val === 'n') {
            var sliderVal = $tab.find('.cron-slider').val();
            cronVal = '*/' + sliderVal;
            $tab.find('.n').show();
            $tab.find('.each').hide();
            updateSliderText(type, sliderVal);
        } else if (val === 'each') {
            $tab.find('.n').hide();
            $tab.find('.each').show();
            drawEach[type]();
            cronVal = '*';
        }
        cronArr[types.indexOf(type)] = cronVal;

        drawCron();
    });
    $el.find('.cron-slider').change(processSlider);
    M.Range.init($el.find('.cron-slider'));

    // workaround for materialize checkbox problem
    $el.find('.cron-checkbox-seconds+span').off('click').click(function () {
        var $input = $(this).prev();
        if (!$input.prop('disabled')) {
            $input.prop('checked', !$input.prop('checked')).trigger('change');
        }
    });

    $seconds.off('change').change(function () {
        enableSeconds($(this).prop('checked'));
        drawCron();
    });

    // init of seconds (whithout drawCron)
    enableSeconds();

    $input.off('change').change(function () {
        $(this).focus();
        cronArr = text2cron($(this).val());
        detectSettings($(this).val());
    }).off('keyup').keyup(function () {
        $(this).trigger('change');
    });

    function text2cron(value) {
        if (value === undefined) {
            value = $input.val();
        }
        value = value.trim();
        if (!value) {
            enableSeconds(false);
            return null;
        }

        var arr = value.split(' ');

        if (arr.length === 5) {
            arr.unshift('*');
            enableSeconds(false);
        } else {
            enableSeconds(true);
        }

        return arr;
    }

    function cron2text(arr) {
        if (!arr) arr = cronArr;

        if (!arr) {
            return '';
        }

        arr = JSON.parse(JSON.stringify(arr || ['*', '*', '*', '*', '*', '*']));
        if (!$seconds.prop('checked')) {
            arr.shift();
        }
        for (var a = 0; a < arr.length; a++) {
            if (arr[a] === '*/1') arr[a] = '*';
        }

        return arr.join(' ');
    }

    function correctCasus(text, seconds) {
        text = text.replace('Каждую(ый) минуту',    'Каждую минуту');
        text = text.replace('Каждую(ый) минут(у)',  'Каждую минуту');
        text = text.replace('Каждую(ый) час',       'Каждый час');
        text = text.replace('Каждую(ый) секунду',   'Каждую секунду');
        text = text.replace(/ (\d{1,2}) числа/,     ' $1го числа');

        text = text.replace(/ (\d{1,2}) в Январе/,  ' $1го числа в Январе');
        text = text.replace(/ (\d{1,2}) в Феврале/, ' $1го числа в Феврале');
        text = text.replace(/ (\d{1,2}) в Марте/,   ' $1го числа в Марте');
        text = text.replace(/ (\d{1,2}) в Апреле/,  ' $1го числа в Апреле');
        text = text.replace(/ (\d{1,2}) в Майе/,    ' $1го числа в Майе');
        text = text.replace(/ (\d{1,2}) в Июне/,    ' $1го числа в Июне');
        text = text.replace(/ (\d{1,2}) в Июле/,    ' $1го числа в Июле');
        text = text.replace(/ (\d{1,2}) в Августе/,  ' $1го числа в Августе');
        text = text.replace(/ (\d{1,2}) в Сентябре/,  ' $1го числа в Сентябре');
        text = text.replace(/ (\d{1,2}) в Октябре/,  ' $1го числа в Октябре');
        text = text.replace(/ (\d{1,2}) в Ноябре/,  ' $1го числа в Ноябре');
        text = text.replace(/ (\d{1,2}) в Декабре/,  ' $1го числа в Декабре');

        text = text.replace('Каждую(ый) 0 минуту',   'Каждые ноль минут');
        text = text.replace(/Каждую\(ый\) ([\d\sи,]+) минуту/, 'Каждую $1 минуту');

        text = text.replace(/каждой\(го\) ([\d\sи,]+) минуту/, 'каждой $1 минуты');
        text = text.replace('каждой(го) минут(у)',  'каждой минуты');

        text = text.replace(' 0 часа(ов)',           ' 0 часов');
        text = text.replace(' 1 часа(ов)',           ' 1 час');
        text = text.replace(' 2 часа(ов)',           ' 2 часа');
        text = text.replace(' 3 часа(ов)',           ' 3 часа');
        text = text.replace(' 4 часа(ов)',           ' 4 часа');
        text = text.replace(/ (\d{1,2}) часа\(ов\)/, ' $1 часов');

        text = text.replace('Jede(r) Sekunde',      'Jede Sekunde');
        text = text.replace(/Jede\(r\) ([\d\sund,]+) Sekunde/, 'Jede $1 Sekunde');
        text = text.replace('Jede(r) Minute',       'Jede Minute');
        text = text.replace('Jede Minuten',         'Jede Minute');
        text = text.replace('Jede Stunde',          'Jede Stunde');
        text = text.replace('Jede(r) Stunde',       'Jede Stunde');
        text = text.replace(/Jede\(r\) ([\d\sund,]+) Minute/, 'Jede $1 Minute');
        text = text.replace('Jede Sekunde in Minuten', 'Jede Sekunde in jeder Minute');
        
        return text
    }

    function drawCron() {
        var newCron = cron2text();
        $input.val(newCron);
        updateDescription(newCron);
    }

    function updateDescription(value) {
        if (!value) {
            $el.find('.cron-text').html(_('never'));
            return;
        }
        var isSeconds = $seconds.prop('checked');
        var text = cronToText(value, isSeconds, JQUERY_CRON_LOCALE[systemLang]);
        text = correctCasus(text, isSeconds ? cronArr[0] : null);

        $el.find('.cron-text').html(text);
    }

    function detectSettings(value) {
        updateInput = true;
        cronArr = text2cron(value);

        for (var c = 0; c < (cronArr ? cronArr.length : 6); c++) {
            detect(cronArr, c);
        }

        updateDescription(value);
        updateInput = false;
    }

    // 5-7,9-11 => 5,6,7,9,10,11
    function convertMinusIntoArray(value) {
        var parts = value.toString().split(',');
        for (var p = 0; p < parts.length; p++) {
            var items = parts[p].trim().split('-');
            if (items.length > 1) {
                parts[p] = [];
                for (var i = parseInt(items[0], 10); i <= parseInt(items[1], 10); i++) {
                    parts[p].push(i);
                }
                parts[p] = parts[p].join(',');
            }
        }
        var value = parts.join(',');
        var values = value.split(',');
        values.sort(function (a, b) {
            a = parseInt(a, 10);
            b = parseInt(b, 10);
            return a - b;
        });
        // remove double entries
        for (p = values.length - 1; p >= 0; p--) {
            if (values[p] === values[p + 1]) {
                values.splice(p + 1, 1);
            }
        }

        return values.join(',');
    }

    // 5,6,7,9,10,11 => 5-7,9-11
    function convertArrayIntoMinus(value) {
        value = convertMinusIntoArray(value);

        var parts = value.split(',');
        var newParts = [];
        var start = parts[0];
        var end   = parts[0];
        for (var p = 1; p < parts.length; p++) {
            if (parts[p] - 1 !== parseInt(parts[p - 1], 10)) {
                if (start === end) {
                    newParts.push(start)
                } else if (end - 1 == start) {
                    newParts.push(start + ',' + end);
                }else {
                    newParts.push(start + '-' + end);
                }
                start = parts[p];
                end   = parts[p];
            } else {
                end = parts[p];
            }
        }

        if (start === end) {
            newParts.push(start)
        } else if (end - 1 == start) {
            newParts.push(start + ',' + end);
        } else {
            newParts.push(start + '-' + end);
        }

        return newParts.join(',');
    }

    function detect(values, index) {
        var $tab = $el.find('.page[data-type="' + types[index] + '"]');

        if (!values) {
            if ($tab.find('.cron-type-selector').val() !== 'every') {
                $tab.find('.cron-type-selector').val('every');
                console.log($tab.find('.n').length);
                $tab.find('.n').hide();
                $tab.find('.each').hide();
                changed = true;
            } else {
                $tab.find('.n').hide();
                $tab.find('.each').hide();
            }
            $tab.find('.cron-slider').val(1);
            return;
        }

        values[index] = values[index] || '*';
        var changed   = true;
        var $selector = $tab.find('.cron-type-selector');
        var cronType  = $selector.val();

        if (values[index].indexOf('/') !== -1) {
            var parts_ = values[index].split('/');
            var value  = parseInt(parts_[1], 10) || 1;
            if ($tab.find('.cron-slider').val() !== value.toString()) {
                $tab.find('.cron-slider').val(value);
                changed = true;
            }
            if (cronType !== 'n') {
                $selector.val('n');
                changed = true;
            }
            updateSliderText(types[index], value);

        } else if (values[index].indexOf('*') !== -1) {
            $tab.find('.cron-slider').val(1);
            if ($selector.val() !== 'every') {
                $selector.val('every');
                changed = true;
            }
        } else {
            $tab.find('.cron-slider').val(1);
            // each
            var parts = convertMinusIntoArray(values[index]).split(',');
            if ($selector.val() !== 'each') {
                $selector.val('each');
                changed = true;
            }
            var selected = false;

            $tab.find('.cron-number').each(function () {
                var index = $(this).data('index').toString();
                var value = parts.indexOf(index.toString()) !== -1;
                if (value && !$(this).hasClass('selected')) {
                    $(this).addClass('selected');
                    changed = true;
                } else if (!value && $(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                    changed = true;
                }
                if (value) selected = true;
            });

            if (!selected) {
                if ($selector.val() !== 'every') {
                    $selector.val('every');
                    changed = true;
                }
            }
            if (changed) {
                $el.find('.tabs').mtabs('select', 'cron-tabs-' + types[index]);
            }
        }
        cronType = $selector.val();

        if (cronType === 'n') {
            $tab.find('.n').show();
            $tab.find('.each').hide();
        } else if (cronType === 'each') {
            $tab.find('.n').hide();
            $tab.find('.each').show();
        } else {
            $tab.find('.n').hide();
            $tab.find('.each').hide();
        }

        $selector.select();
    }

    function updateSliderText(type, val) {
        var $selector = $el.find('.page[data-type="' + type + '"] .cron-type-selector');
        $selector.find('option[value="n"]').html(val === 1 ? _('CRON Every ' + type) : _('CRON Every') + ' ' + val + ' ' + _('CRON ' + type + 's'));
        $selector.select();

    }

    function processSlider() {
        var arg  = $(this).data('arg');
        var type = $(this).data('type');
        var val  = $(this).val();
        if (!cronArr) {
            cronArr = ['*', '*', '*', '*', '*', '*'];
        }

        cronArr[arg] = '*/' + val;
        updateSliderText(type, val);
        drawCron();
    }

    function processEachChange() {
        var val;
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            val = false;
        } else {
            $(this).addClass('selected');
            val = true;
        }

        var newItem = $(this).data('index').toString();
        var arg     = $(this).data('arg');

        if (!cronArr) {
            cronArr = ['*', '*', '*', '*', '*', '*'];
        }

        if (cronArr[arg] === '*') {
            cronArr[arg] = newItem;
        } else {
            // if value already in list, toggle it off
            var list = convertMinusIntoArray(cronArr[arg]).split(',');
            var pos = list.indexOf(newItem);
            if (!val) {
                if (pos !== -1) {
                    list.splice(pos, 1);
                }
                cronArr[arg] = list.join(',');
            } else {
                // else toggle it on
                if (pos === -1) {
                    cronArr[arg] = cronArr[arg] + ',' + newItem;
                }
            }
            cronArr[arg] = convertArrayIntoMinus(cronArr[arg]);
            if(cronArr[arg] === '') cronArr[arg] = '*';
        }
        drawCron();
    }

    function padded(val) {
        if (typeof val === 'string' && val.length === 1) {
            val = '0' + val;
        } else if (val < 10) {
            val = '0' + val;
        } else {
            val = val.toString();
        }
        return val;
    }

    function draw(type, drawFunc) {
        var $format = $el.find('.page[data-type="' + type + '"] .cron-tabs-format');
        $format.html(drawFunc());

        if (!cronArr) {
            cronArr = ['*', '*', '*', '*', '*', '*'];
        }
        var arg = types.indexOf(type);
        var list = convertMinusIntoArray(cronArr[arg]).split(',');

        $format.find('.cron-number').off('click').click(processEachChange).each(function () {
            if (list.indexOf($(this).data('index').toString()) !== -1) {
                $(this).addClass('selected')
            }
        });
    }

    function drawEachSecond() {
        draw('second', function () {
            var text = '';
            // seconds
            for (var i = 0; i < 60; i++) {
                text += '<div data-index="' + i + '" data-type="second" data-arg="0" class="cron-number">' + padded(i) + '</div>';
                if (i !== 0 && ((i + 1) % 10 === 0)) text += '<br/>';
            }
            return text;
        });
    }

    function drawEachMinute () {
        draw('minute', function () {
            var text = '';
            // minutes
            for (var i = 0; i < 60; i++) {
                text += '<div data-index="' + i + '" data-type="minute" data-arg="1" class="cron-number">' + padded(i) + '</div>';
                if (i !== 0 && (((i + 1) % 10) === 0)) text += '<br/>';
            }
            return text;
        });
    }

    function drawEachHour() {
        draw('hour', function () {
            var text = '';
            // hours
            for (var i = 0; i < 24; i++) {
                text += '<div data-index="' + i + '" data-type="hour" data-arg="2" class="cron-number">' + padded(i) + '</div>';
                if (i !== 0 && (((i + 1) % 12) === 0)) text += '<br/>';
            }
            return text;
        });
    }

    function drawEachDay () {
        draw('day', function () {
            var text = '';
            // days
            for (var i = 1; i < 36; i++) {
                if (i > 31) {
                    text += '<div class="cron-number-empty">&nbsp;</div>';
                } else {
                    text += '<div data-index="' + i + '" data-type="day" data-arg="3" class="cron-number">' + padded(i) + '</div>';
                }

                if (i !== 0 && ((i % 7) === 0)) text += '<br/>';
            }
            return text;
        });
    }
    
    function drawEachMonth () {
        draw('month', function () {
            var text = '';
            // months
            var months = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

            for (var i = 0; i < months.length; i++) {
                text += '<div data-index="' + (i + 1) + '" data-type="month" data-arg="4" class="cron-number">' + _(months[i]) + '</div>';
            }
            return text;
        });
    }

    function drawEachWeekday () {
        draw('week', function () {
            var text = '';
            // weeks
            var days = [
                {id: 1, name: 'Monday'},
                {id: 2, name: 'Tuesday'},
                {id: 3, name: 'Wednesday'},
                {id: 4, name: 'Thursday'},
                {id: 5, name: 'Friday'},
                {id: 6, name: 'Saturday'},
                {id: 0, name: 'Sunday'}
            ];

            for (var i = 0; i < days.length; i++) {
                text += '<div data-index="' + days[i].id + '" data-type="week" data-arg="5" class="cron-number">' + _(days[i].name) + '</div>';
            }
            return text;
        });
    }

    drawEachSecond();
    drawEachMinute();
    drawEachHour();
    drawEachDay();
    drawEachMonth();
    drawEachWeekday();
    drawCron();
    detectSettings($input.val());
    $el.modal({
        dismissible: false
    }).modal('open');
}