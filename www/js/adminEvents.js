function Events(main) {
    "use strict";

    var that =                   this;
    this.main =                  main;
    this.$table =                $('#event-table'); // body

    var eventsLinesCount =       0;
    var eventsLinesStart =       0;
    var eventTypes =             [];
    var eventFroms =             [];
    var eventFilterTimeout =     null;

    this.eventLimit =            500;
    this.eventPauseList =        [];
    this.eventPauseMode =        false;
    this.eventPauseOverflow =    false;
    this.eventPauseCounterSpan = null;
    this.eventPauseCounter =     [];

    var filter = { type: {}, id: {}, val:{}, ack: {}, from: {} };
    var $header;


    this.prepare = function () {


        function clearHandler(id) {
            if (id[0] !== '#') id = '#' + id;
            //$(id + '-clear').button({icons:{primary: 'ui-icon-close'}, text: false}).css({height: 16, width: 16}).click(function () {
            $(id + '-clear').button({icons:{primary: 'ui-icon-close'}, text: false}).click(function () {
                if ($(id).val() !== '') {
                    $(id).val('').trigger('change');
                }
            });
        }

        function changeHandler(id) {
            if (id[0] !== '#') id = '#' + id;
            $(id).change(function () {
            if (eventFilterTimeout) clearTimeout(eventFilterTimeout);
            eventFilterTimeout = setTimeout(filterEvents, 1000);
        }).keyup(function (e) {
            if (e.which === 13) {
                filterEvents();
            } else {
                $(this).trigger('change');
            }
        });

            }

        var handlers = [];

        var html = '';

        var cnt = 0;
        function add(text) {
            html +=
                //'<td class="event-column-' + ++cnt + '">' +
                '<td>' +
                '<table class="main-header-input-table" style="width: 100%;">' +
                '    <tbody>' + text +
                '    </tbody>' +
                '</table>' +
                '</td>'
            }

        function addCombobox (id, title, options) {
            handlers.push(id);
            title = _(title);
            var opts = '';
            if (options) for (var i=0; i<options.length; i++) {
                var o = options[i];
                if (typeof o === 'string') {
                    o = { val: o, name: o }
            }
                var name = i===0 ? title + ' (' + _(o.name) + ')' : _(o.name);
                opts += '<option value="' + o.val + '">' + name + '</option>';
            }
            add(
                '    <tr style="background: #ffffff; ">' +
                '        <td style="width: 100%">\n' +
                '            <select id="' + id + '" title="' + title + '">' + opts + '</select>' +
                '        </td>' +
                '        <td>' +
                '            <button id="' + id + '-clear" role="button" title=""></button>' +
                '        </td>' +
                '    </tr>'
            );
        }


        function addEdit(id, placeholder) {
            handlers.push(id);
            placeholder = _(placeholder);
            add(
                '    <tr style="background: #ffffff; ">' +
                '        <td style="width: 100%">' +
                '            <input placeholder="' + placeholder + '" type="text" id="' + id + '" title="' + placeholder + '">' +
                '        </td>' +
                '        <td>' +
                '            <button id="' + id + '-clear" role="button" title="' + placeholder + '"></button>' +
                '        </td>' +
                '    </tr>'
            );
        }

        function addText(text) {
            add(
                '    <tr style="background: #ffffff; ">' +
                '        <td style="width: 100%"><span>' + _(text) +
                '        </span></td>' +
                '    </tr>'
            );
        }

        addCombobox('event-filter-type');
        addEdit('event-filter-id', 'ID');
        addEdit('event-filter-val', 'Value');
        addCombobox('event-filter-ack', 'ack', [
            { val: "", name: 'all' },
            { val: "true", name: 'ack' },
            { val: "false", name: 'not ack' }
        ]);
        addCombobox('event-filter-from', 'from');
        addText('ts');
        addText('lc');

        var header = '';
        // for (var i=0; i<handlers.length; i++) {
        //     header += '<th class="event-column-' + (i+1) + '"></th>';
        // }
        // header += '</tr><tr>';

        $header = $('#events-table-tr');
        $header.html(header + html);
        //$header.append(header + html);

        for (var i=0; i<handlers.length; i++) {
            clearHandler(handlers[i]);
            changeHandler(handlers[i]);
        }


        for (var n in filter) {
            var fi = filter[n], $fi = fi.$ = $('#event-filter-' + n);
            if (!$fi.length) return;
            fi.setAllOption = function () {
                $fi.html('<option value="">' + _(n) + ' ('+_('all') + ')</option>');
            };
            if ($fi[0].tagName === 'SELECT' && n !== 'ack') fi.setAllOption();
        }
        Object.defineProperty(filter, 'getValues', {
            value: function () {
                for (var n in filter) {
                    var fi = filter[n];
                    fi.val = fi.$.val();
                }
                filter.id.val = filter.id.val.toLocaleLowerCase();
                if (filter.ack.val === 'true')  filter.ack.val = true;
                if (filter.ack.val === 'false') filter.ack.val = false;
            },
            enumerateble: false
        });
//        $header.find('>tr>td').resize(function() {
        //$($header[0].children).resize(function(){
        $($header[0].children).each(function(i, o){
            $(o).resize(function() {
            //$(o).on ('resize', function() {
            //$(o).onresize = function() {
            //o.addEventListener('resize', function () {
                //$(this).width($(this).width() + 6);
            });
                //$(o).resize();
        });
        //filter.from.$.html('<option value="">' + _('all') + '</option>');

        // var headerTds = $header.find('td');
        // var tableTds = this.$table.find('>tr>td');
        // tableTds.each(function(i, o) {
        //     $(headerTds[i]).attr('width', $(o).width()+1);
        // });




        //$('#event-filter-type').change(filterEvents);


        // $('#event-filter-id').change(function () {
        //     if (eventFilterTimeout) clearTimeout(eventFilterTimeout);
        //     eventFilterTimeout = setTimeout(filterEvents, 1000);
        // }).keyup(function (e) {
        //     if (e.which === 13) {
        //         filterEvents();
        //     } else {
        //         $(this).trigger('change');
        //     }
        // });
        // $('#event-filter-val').change(function () {
        //     if (eventFilterTimeout) clearTimeout(eventFilterTimeout);
        //     eventFilterTimeout = setTimeout(filterEvents, 1000);
        // }).keyup(function (e) {
        //     if (e.which === 13) {
        //         filterEvents();
        //     } else {
        //         $(this).trigger('change');
        //     }
        // });

        //clearHandler('event-filter-type');

        // $('#event-filter-ack').change(filterEvents);
        // $('#event-filter-from').change(filterEvents);


        // $('#event-filter-val-clear').button({icons:{primary: 'ui-icon-close'}, text: false}).css({height: 18, width: 18}).click(function () {
        //     if ($('#event-filter-val').val() !== '') {
        //         $('#event-filter-val').val('').trigger('change');
        //     }
        // });
        // $('#event-filter-id-clear').button({icons:{primary: 'ui-icon-close'}, text: false}).css({height: 18, width: 18}).click(function () {
        //     if ($('#event-filter-id').val() !== '') {
        //         $('#event-filter-id').val('').trigger('change');
        //     }
        // });

        $('#event-pause')
            .button({icons:{primary: 'ui-icon-pause'}, text: false})
            //.css({height: 25})
            .attr('title', _('Pause output'))
            .click(function () {
                that.pause();
            });

        this.eventPauseCounterSpan = $('#event-pause .ui-button-text');

        // bind "clear events" button
        $('#event-clear').button({
            icons: {
                primary: 'ui-icon-trash'
            },
            label: _('clear')
        }).unbind('click').click(function () {
            eventsLinesCount = 0;
            eventsLinesStart = 0;
            $('#event-table').html('');
        }).css({ height: 24 }).find('span').last().css({position: 'relative', top: "-4px"/*, display: 'inline-flex'*/ });

        this.eventPauseCounterSpan.css({'padding-top': 1, 'padding-bottom' : 0});

    };


    var widthSet = false;

    function syncHeader() {
        var headerTds = $header.find('>td');
        //var tableTds = that.$table.find('>tr>td');
        var tableTds = that.$table.find('>tr>td');
        var trs, tds, len=0;
        if (!(trs=that.$table[0].children) || !trs.length || !(tds = trs[0].children) ) return;
        $(tds).each(function(i, o) {
            if (i >= $(tds).length-1) return;
            var x = $(o).width();
            len += x;
            if (x) $(headerTds[i]).width($(o).width()+6);
        });
        return len;
    }


    // ----------------------------- Show events ------------------------------------------------
    this.addEventMessage = function (id, state, rowData, obj) {
        //var typeFilter = $('#event-filter-type').val();
        //var fromFilter = $('#event-filter-from').val();
        var type = rowData ? 'stateChange' : 'message';
        var value;
        var ack;
        var from = '';
        var tc;
        var lc;
        filter.getValues();

        if (obj) {
            type = 'objectChange';
            value = JSON.stringify(obj, '\x0A', 2);
            if (value !== undefined && value.length > 30) value = '<span title="' + value.replace(/"/g, '\'') + '">' + value.substring(0, 30) + '...</span>';
            ack = '';
            tc = main.formatDate(new Date());
            lc = '';
        }

        if (eventTypes.indexOf(type) === -1) {
            eventTypes.push(type);
            eventTypes.sort();
            if (eventTypes.length > 1) {
                //$('#event-filter-type').html('<option value="">' + _('all') + '</option>');
                //filter.type.$.html('<option value="">' + _('all') + '</option>');
                filter.type.setAllOption();
                for (var i = 0; i < eventTypes.length; i++) {
                    //$('#event-filter-type').append('<option value="' + eventTypes[i] + '" ' + ((eventTypes[i] === filter.type.val) ? 'selected' : '') + '>' + eventTypes[i] + '</option>');
                    filter.type.$.append('<option value="' + eventTypes[i] + '" ' + ((eventTypes[i] === filter.type.val) ? 'selected' : '') + '>' + eventTypes[i] + '</option>');
                }
            }
        }

        if (!this.eventPauseMode) {
            if (eventsLinesCount >= that.eventLimit) {
                eventsLinesStart++;
                var e = document.getElementById('event_' + eventsLinesStart);
                if (e) e.outerHTML = '';
            } else {
                eventsLinesCount++;
            }
        }

        if (state) {
            state.from = state.from || '';
            state.from = state.from.replace('system.adapter.', '');
            state.from = state.from.replace('system.', '');

            if (eventFroms.indexOf(state.from) === -1) {
                eventFroms.push(state.from);
                eventFroms.sort();
                //$('#event-filter-from').html('<option value="">' + _('all') + '</option>');
                //filter.from.$.html('<option value="">' + _('all') + '</option>');
                filter.from.setAllOption();
                for (var i = 0; i < eventFroms.length; i++) {
                    var e = eventFroms[i].replace('.', '-');
                    //$('#event-filter-from').append('<option value="' + e + '" ' + ((e === fromFilter) ? 'selected' : '') + '>' + eventFroms[i] + '</option>');
                    $('#event-filter-from').append('<option value="' + e + '" ' + ((e === filter.from.val) ? 'selected' : '') + '>' + eventFroms[i] + '</option>');
                }
            }
            from = state.from;

            if (!rowData) {
                value = (state ? state.command : 'deleted');
                ack = (state ? (state.callback ? state.callback.ack : '') : 'deleted');
                tc = main.formatDate(new Date());
                lc = '';
            } else {
                value = state ? JSON.stringify(state.val) : 'deleted';
                if (value !== undefined && value.length > 30) value = '<div title="' + value.replace(/"/g, '') + '">' + value.substring(0, 30) + '...</div>';
                ack = (state ? state.ack : 'del');
                tc = rowData ? rowData.ts : '';
                lc = rowData ? rowData.lc : '';
            }
        }

        var visible = true;
        //var filterType = $('#event-filter-type').val();
        //var filterId   = $('#event-filter-id').val().toLocaleLowerCase();
        //var filterVal  = $('#event-filter-val').val();
        // var filterAck  = $('#event-filter-ack').val();
        // var filterFrom = $('#event-filter-from').val();
        // if (filterAck === 'true')  filterAck = true;
        // if (filterAck === 'false') filterAck = false;

        if (filter.type.val && filter.type.val !== type) {
            visible = false;
        } else if (filter.id.val && id.toLocaleLowerCase().indexOf(filter.id.val) === -1) {
            visible = false;
        } else if (filter.val.val !== '' && value !== null && value !== undefined && value.indexOf(filter.val.val) === -1) {
            visible = false;
        } else if (filter.ack.val !== '' && filter.ack.val !== ack) {
            visible = false;
        } else if (filter.from.val && filter.from.val !== from) {
            visible = false;
        }

        // var text = '<tr id="event_' + (eventsLinesStart + eventsLinesCount) + '" class="event-line event-type-' + type + ' event-from-' + from.replace('.', '-') + ' event-ack-' + ack + '" style="' + (visible ? '' : 'display:none') + '">';
        // text += '<td class="event-column-1">' + type  + '</td>';
        // text += '<td class="event-column-2 event-column-id">' + id    + '</td>';
        // text += '<td class="event-column-3 event-column-value">' + value + '</td>';
        // text += '<td class="event-column-4">' + ack   + '</td>';
        // text += '<td class="event-column-5">' + from  + '</td>';
        // text += '<td class="event-column-6">' + tc    + '</td>';
        // text += '<td class="event-column-7">' + lc    + '</td>';
        // text += '</tr>';

        var text = '<tr id="event_' + (eventsLinesStart + eventsLinesCount) + '" class="event-line event-type-' + type + ' event-from-' + from.replace('.', '-') + ' event-ack-' + ack + '" style="' + (visible ? '' : 'display:none') + '">';
        text += '<td>' + type  + '</td>';
        text += '<td class="event-column-id">' + id    + '</td>';
        if (isNaN(value)) text += '<td class="event-column-value">' + value + '</td>';
        else text += '<td class="event-column-value" style="text-align: right; padding-right: 5px;">' + value + '</td>';
        text += '<td>' + ack   + '</td>';
        text += '<td>' + from  + '</td>';
        text += '<td>' + tc    + '</td>';
        text += '<td>' + lc    + '</td>';
        text += '</tr>';

        if (this.eventPauseMode) {
            this.eventPauseList.push(text);
            this.eventPauseCounter++;

            if (this.eventPauseCounter > this.eventLimit) {
                if (!this.eventPauseOverflow) {
                    $('#event-pause').addClass('ui-state-error')
                        .attr('title', _('Message buffer overflow. Losing oldest'));
                    this.eventPauseOverflow = true;
                }
                this.eventPauseList.shift();
            }
            this.eventPauseCounterSpan.html(this.eventPauseCounter);
        } else {
            this.$table.prepend(text);
            if (!widthSet) {
                if (window.location.hash === '#events') {
                    if (syncHeader () > 0) widthSet = true;
                }
                // var headerTds = $header.find('>td');
                // var tableTds = this.$table.find('>tr>td');
                // tableTds.each(function(i, o) {
                //     if (i >= tableTds.length-1) return;
                //     $(headerTds[i]).width($(o).width()+6);
                // });
                //
            }
        }
    };

    this.onSelected = function () {
        syncHeader ();
    };

    // function filterEvents() {
    //     if (eventFilterTimeout) {
    //         clearTimeout(eventFilterTimeout);
    //         eventFilterTimeout = null;
    //     }
    //     var filterType = $('#event-filter-type').val();
    //     var filterId   = $('#event-filter-id').val().toLocaleLowerCase();
    //     var filterVal  = $('#event-filter-val').val();
    //     var filterAck  = $('#event-filter-ack').val();
    //     var filterFrom = $('#event-filter-from').val();
    //     if (filterAck === 'true')  filterAck = true;
    //     if (filterAck === 'false') filterAck = false;
    //
    //     $('.event-line').each(function (index) {
    //         var isShow = true;
    //         var $this = $(this);
    //         if (filterType && !$this.hasClass('event-type-' + filterType)) {
    //             isShow = false;
    //         } else
    //         if (filterFrom && !$this.hasClass('event-from-' + filterFrom)) {
    //             isShow = false;
    //         } else
    //         if (filterAck !== '' && !$this.hasClass('event-ack-' + filterAck)) {
    //             isShow = false;
    //         } else
    //         if (filterId && $(this).find('td.event-column-id').text().toLocaleLowerCase().indexOf(filterId) === -1) {
    //             isShow = false;
    //         } else
    //         if (filterVal !== '' && $(this).find('td.event-column-value').text().indexOf(filterVal) === -1) {
    //             isShow = false;
    //         }
    //
    //         if (isShow) {
    //             $this.show();
    //         } else {
    //             $this.hide();
    //         }
    //     });
    // }

    function filterEvents() {
        if (eventFilterTimeout) {
            clearTimeout(eventFilterTimeout);
            eventFilterTimeout = null;
        }
        filter.getValues();
        // var filterType = $('#event-filter-type').val();
        // var filterId   = $('#event-filter-id').val().toLocaleLowerCase();
        // var filterVal  = $('#event-filter-val').val();
        // var filterAck  = $('#event-filter-ack').val();
        // var filterFrom = $('#event-filter-from').val();
        // if (filterAck === 'true')  filterAck = true;
        // if (filterAck === 'false') filterAck = false;

        $('.event-line').each(function (index) {
            var isShow = true;
            var $this = $(this);
            if (filter.type.val && !$this.hasClass('event-type-' + filter.type.val)) {
                isShow = false;
            } else
            if (filter.from.val && !$this.hasClass('event-from-' + filter.from.val)) {
                isShow = false;
            } else
            if (filter.ack.val !== '' && !$this.hasClass('event-ack-' + filter.ack.val)) {
                isShow = false;
            } else
            if (filter.id.val && $(this).find('td.event-column-id').text().toLocaleLowerCase().indexOf(filter.id.val) === -1) {
                isShow = false;
            } else
            if (filter.val.val !== '' && $(this).find('td.event-column-value').text().indexOf(filter.val.val) === -1) {
                isShow = false;
            }

            if (isShow) {
                $this.show();
            } else {
                $this.hide();
            }
        });
    }


    var resizeTimer;
    this.resize = function (width, height) {
        //$('#grid-events-inner').css('height', (height - 130) + 'px');
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(syncHeader, 500);
    };

    this.pause = function () {
        if (!this.eventPauseMode) {
            $('#event-pause')
                .addClass('ui-state-focus')
                .button('option', 'text', true)
                .button('option', 'icons', {primary: null});

            this.eventPauseCounterSpan = $('#event-pause .ui-button-text');
            this.eventPauseCounterSpan.html('0').css({'padding-top': '1px', 'padding-bottom': '0px'});
            this.eventPauseCounter  = 0;
            this.eventPauseMode     = true;
        } else {
            this.eventPauseMode     = false;
            for (var i = 0; i < this.eventPauseList.length; i++) {
                if (eventsLinesCount >= 500) {
                    eventsLinesStart++;
                    var e = document.getElementById('event_' + eventsLinesStart);
                    if (e) e.outerHTML = '';
                } else {
                    eventsLinesCount++;
                }
                this.$table.prepend(this.eventPauseList[i]);
            }
            this.eventPauseOverflow = false;
            this.eventPauseList     = [];
            this.eventPauseCounter  = 0;

            $('#event-pause')
                .removeClass('ui-state-error ui-state-focus')
                .attr('title', _('Pause output'))
                .button('option', 'text', false).button('option', 'icons', {primary: 'ui-icon-pause'});
        }
    };
}

