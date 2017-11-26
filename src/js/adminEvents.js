function Events(main) {
    'use strict';

    var that =                   this;
    this.main =                  main;
    this.$table =                $('#event-table'); // body

    var eventsLinesCount =       0;
    var eventsLinesStart =       0;
//    var eventTypes =             [];
//    var eventFroms =             [];
    var eventFilterTimeout =     null;

    this.eventLimit =            500;
    this.eventPauseList =        [];
    this.eventPauseMode =        false;
    this.eventPauseOverflow =    false;
    this.eventPauseCounterSpan = null;
    this.eventPauseCounter =     [];

    var filter = {
        type: {},
        id:   {},
        val:  {},
        ack:  {},
        from: {}
    };
    var $header;
    var hdr;

    this.prepare = function () {
        var $eventOuter = $('#event-outer');
        $header = $('#events-table-tr');

        hdr = IobListHeader ($header, { list: $eventOuter, colWidthOffset: 1, prefix: 'event-filter' });
        hdr.doFilter = that.filter;

        hdr.add('combobox', 'type');
        hdr.add('edit', 'id', 'ID');
        //hdr.add('edit', 'val', 'Value');
        hdr.add('edit', 'val', 'value');
        hdr.add('combobox', 'ack', 'ack', [
            { val: "", name: 'all' },
            { val: "true", name: 'ack' },
            { val: "false", name: 'not ack' }
        ]);
        hdr.add('combobox', 'from', 'from');
        hdr.add('text', 'ts');
        hdr.add('text', 'lc');

        Object.defineProperty(hdr, 'getValues', {
            value: function () {
                hdr.ID.selectedVal = hdr.ID.selectedVal.toLocaleLowerCase();
                if (hdr.ack.selectedVal === 'true')  hdr.ack.selectedVal = true;
                if (hdr.ack.selectedVal === 'false') hdr.ack.selectedVal = false;
            },
            enumerateble: false
        });

        // $($header[0].children).each(function(i, o){
        //     $(o).resize(function() {
        // });
        // });

        $('#event-pause')
            .button({icons:{primary: 'ui-icon-pause'}, text: false})
            .attr('title', _('Pause output'))
            .click(function () {
                that.pause();
            });

        this.eventPauseCounterSpan = $('#event-pause .ui-button-text');

        // bind "clear events" button
        var $eventClear = $('#event-clear');
        $eventClear.button({
            icons: {
                primary: 'ui-icon-close'
            },
            text: false,
            //label: _('clear')
        })
            .attr('title', _('clear'))
            .unbind('click').click(function () {
                eventsLinesCount = 0;
                eventsLinesStart = 0;
                $('#event-table').html('');
            })
            .prepend(_('Clear list'))
            .attr('style', 'width: 100% !important; padding-left: 20px !important; font-size: 12px; vertical-align: middle; padding-top: 3px !important; padding-right: 5px !important; color:#000')
            .find('span').css({left: '10px'})
        ;
        this.eventPauseCounterSpan.css({'padding-top': 1, 'padding-bottom' : 0});

    };


    var widthSet = false;

    // ----------------------------- Show events ------------------------------------------------
    this.addEventMessage = function (id, state, rowData, obj) {
        var type = rowData ? 'stateChange' : 'message';
        var value;
        var ack;
        var from = '';
        var tc;
        var lc;
        if (hdr.getValues) hdr.getValues();

        if (obj) {
            type = 'objectChange';
            value = JSON.stringify(obj, '\x0A', 2);
            if (value !== undefined && value.length > 30) value = '<span title="' + value.replace(/"/g, '\'') + '">' + value.substring(0, 30) + '...</span>';
            ack = '';
            tc = main.formatDate(new Date());
            lc = '';
        }

        hdr.type.checkAddOption (type);

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


            hdr.from.checkAddOption (state.from, function (o) {
                return {val: o.replace (/\./g, '-'), name: o};
            });

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
        if (hdr.type.selectedVal && hdr.type.selectedVal !== type) {
            visible = false;
        } else if (hdr.ID.selectedVal && id.toLocaleLowerCase().indexOf(hdr.ID.selectedVal) === -1) {
            visible = false;
        } else if (hdr.value.selectedVal !== '' && value !== null && value !== undefined && value.indexOf(hdr.value.selectedVal) === -1) {
            visible = false;
        } else if (hdr.ack.selectedVal !== '' && hdr.ack.selectedVal !== ack) {
            visible = false;
        } else if (hdr.from.selectedVal && hdr.from.selectedVal !== from) {
            visible = false;
        }

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
                    //if (syncHeader () > 0) widthSet = true;
                    hdr.syncHeader();
                    widthSet = true;
                }
            }
        }
    };

    this.onSelected = function () {
        //syncHeader ();
        hdr.syncHeader();
    };


    function filterEvents() {
        if (eventFilterTimeout) {
            clearTimeout(eventFilterTimeout);
            eventFilterTimeout = null;
        }
        if (hdr.getValues) hdr.getValues();

        $('.event-line').each(function (index) {
            var isShow = true;
            var $this = $(this);
            if (hdr.type.selectedVal && !$this.hasClass('event-type-' + hdr.type.selectedVal)) {
                isShow = false;
            } else
            if (hdr.from.selectedVal && !$this.hasClass('event-from-' + hdr.from.selectedVal)) {
                isShow = false;
            } else
            if (hdr.ack.selectedVal !== '' && !$this.hasClass('event-ack-' + hdr.ack.selectedVal)) {
                isShow = false;
            } else
            if (hdr.ID.selectedVal && $(this).find('td.event-column-id').text().toLocaleLowerCase().indexOf(hdr.ID.selectedVal) === -1) {
                isShow = false;
            } else
            if (hdr.value.selectedVal !== '' && $(this).find('td.event-column-value').text().indexOf(hdr.value.selectedVal) === -1) {
                isShow = false;
            }

            if (isShow) {
                $this.show();
            } else {
                $this.hide();
            }
        });
    }


    // var resizeTimer;
    this.resize = function (width, height) {
    //     if (resizeTimer) clearTimeout(resizeTimer);
    //     resizeTimer = setTimeout(syncHeader, 500);
    };

    this.pause = function () {
        var $eventPause = $('#event-pause');
        if (!this.eventPauseMode) {
            $eventPause
                .addClass('ui-state-focus')
                .button('option', 'text', true)
                .button('option', 'icons', {primary: null});

            this.eventPauseCounterSpan = $eventPause.find('.ui-button-text');
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

            $eventPause
                .removeClass('ui-state-error ui-state-focus')
                .attr('title', _('Pause output'))
                .button('option', 'text', false).button('option', 'icons', {primary: 'ui-icon-pause'});
        }
    };
}


