function Events(main) {
    'use strict';

    var that =                   this;
    this.main =                  main;
    this.$tab =                  $('#tab-events'); // body
    this.$table =                $('#event-table'); // body
    var isRemote =               location.hostname === 'iobroker.net' || location.hostname === 'iobroker.pro';

    var eventsLinesCount =       0;
    var eventsLinesStart =       0;
    var eventFilterTimeout =     null;

    this.eventLimit =            500;
    this.eventPauseList =        [];
    this.eventPauseMode =        false;
    this.eventPauseOverflow =    false;
    this.eventPauseCounterSpan = null;
    this.eventPauseCounter =     [];

    /*var filter = {
        type: {},
        id:   {},
        val:  {},
        ack:  {},
        from: {}
    };*/
    var $header;
    var hdr;

    this.prepare = function () {
        var $eventOuter = this.$tab.find('#event-outer');
        $header = this.$tab.find('#events-table-tr');

        hdr = new IobListHeader($header, {list: $eventOuter, colWidthOffset: 1, prefix: 'event-filter'});
        hdr.doFilter = filterEvents;

        hdr.add('combobox', 'type');
        hdr.add('edit', 'id', 'ID');
        //hdr.add('edit', 'val', 'Value');
        hdr.add('edit', 'val', 'value');
        hdr.add('combobox', 'ack', 'ack', [
            {val: '',       name: 'all'},
            {val: 'true',   name: 'ack'},
            {val: 'false',  name: 'not ack'}
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

        var $eventPause = this.$tab.find('#event-pause');
        $eventPause
            .on('click', function () {
                that.pause();
            });

        this.eventPauseCounterSpan = $eventPause.find('.ui-button-text');

        // bind "clear events" button
        var $eventClear = this.$tab.find('#event-clear');
        $eventClear
            .off('click').on('click', function () {
                eventsLinesCount = 0;
                eventsLinesStart = 0;
                $('#event-table').html('');
            });
            //.prepend(_('Clear list'));
//            .attr('style', 'width: 100% !important; padding-left: 20px !important; font-size: 12px; vertical-align: middle; padding-top: 3px !important; padding-right: 5px !important; color:#000')
//            .find('span').css({left: '10px'})

        this.eventPauseCounterSpan.css({'padding-top': 1, 'padding-bottom': 0});
    };

    this.init    = function () {
        if (isRemote) {
            $('#grid-events').html(_('You can\'t see events via cloud'));
            return;
        }
        hdr && hdr.syncHeader();
        if (this.inited) {
            return;
        }

        this.inited = true;
        this.main.subscribeObjects('*');
        this.main.subscribeStates('*');
    };

    this.destroy = function () {
        if (this.inited) {
            this.inited = false;
            this.main.unsubscribeObjects('*');
            this.main.unsubscribeStates('*');
        }
    };

    var widthSet = false;

    // ----------------------------- Show events ------------------------------------------------
    this.addEventMessage = function (id, stateOrObj, isMessage, isState) {
        if (isRemote) return;

        var type = isState ? 'stateChange' : (isMessage ? 'message' : 'objChange');
        var value;
        var ack;
        var from = '';
        var ts;
        var lc;
        if (hdr) {
            if (hdr.getValues) hdr.getValues();

            hdr.type.checkAddOption(type);
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

        // if Object
        if (!isMessage && !isState) {
            if (!stateOrObj) {
                value = 'deleted';
                ts = main.formatDate(new Date());
            } else {
                value = JSON.stringify(stateOrObj, '\x0A', 2);
                if (value !== undefined && value.length > 30) {
                    value = '<span title="' + value.replace(/"/g, '\'') + '">' + value.substring(0, 30) + '...</span>';
                }
                ts = main.formatDate(stateOrObj.ts);
            }
        } else
        // if state
        if (isState) {
            if (!stateOrObj) {
                value = 'deleted';
                ts = main.formatDate(new Date());
            } else {
                stateOrObj.from = stateOrObj.from || '';
                stateOrObj.from = stateOrObj.from.replace('system.adapter.', '');
                stateOrObj.from = stateOrObj.from.replace('system.', '');

                hdr && hdr.from.checkAddOption(stateOrObj.from, function (o) {
                    return {val: o.replace(/\./g, '-'), name: o};
                });

                from = stateOrObj.from;

                value = JSON.stringify(stateOrObj.val);
                if (value !== undefined && value.length > 30) {
                    value = '<div title="' + value.replace(/"/g, '') + '">' + value.substring(0, 30) + '...</div>';
                }
                ack = stateOrObj.ack ? 'true' : 'false';
                ts  = main.formatDate(stateOrObj.ts);
                lc  = main.formatDate(stateOrObj.lc);
            }
        } else
        // if message
        if (isMessage) {
            // todo
        }

        var visible = true;
        if (hdr) {
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
        }


        var text = '<tr id="event_' + (eventsLinesStart + eventsLinesCount) + '" class="event-line event-type-' + type + ' event-from-' + from.replace('.', '-') + ' event-ack-' + ack + '" style="' + (visible ? '' : 'display:none') + '">';
        text += '<td>' + type  + '</td>';
        text += '<td class="event-column-id">' + id + '</td>';
        if (isNaN(value)) {
            text += '<td class="event-column-value">' + (value || '') + '</td>';
        } else {
            text += '<td class="event-column-value" style="text-align: right; padding-right: 5px;">' + (value || '') + '</td>';
        }
        text += '<td>' + (ack  || '') + '</td>';
        text += '<td>' + (from || '') + '</td>';
        text += '<td>' + (ts   || '') + '</td>';
        text += '<td>' + (lc   || '') + '</td>';
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
            if (!widthSet && window.location.hash === '#events') {
                hdr && hdr.syncHeader();
                widthSet = true;
            }
        }
    };

    this.onSelected = function () {
        hdr && hdr.syncHeader();
    };

    function filterEvents() {
        if (eventFilterTimeout) {
            clearTimeout(eventFilterTimeout);
            eventFilterTimeout = null;
        }
        if (hdr.getValues) {
            hdr.getValues();
        }

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

    this.pause = function () {
        var $eventPause = $('#event-pause');
        if (!this.eventPauseMode) {
            $eventPause
                .addClass('yellow btn-pause-button-active');

            this.eventPauseCounterSpan = $eventPause;
            this.eventPauseCounterSpan.html('0');
            this.eventPauseCounter     = 0;
            this.eventPauseMode        = true;
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
                .removeClass('yellow btn-pause-button-active')
                .html('<i class="material-icons">pause</i>');
        }
    };
}


