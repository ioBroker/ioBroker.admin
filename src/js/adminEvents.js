function Events(main) {
    'use strict';

    var that     = this;
    this.main    = main;
    this.$tab    = $('#tab-events'); // body
    var isRemote = location.hostname === 'iobroker.net' || location.hostname === 'iobroker.pro';

    var list = {
        count: 0,
        start: 0,
        limit: 500 //const
    };
    var timeout = null;

    var pause = {
        list:           [],
        mode:           false,
        counter:        0,
        overflow:       false,
        $counterSpan:   null
    };

    var $header;
    var hdr;
    var $table;
    var $outer;
    var $pause;

    var columnResizeInit =  {
        done: false,
        timer: null
    };

    this.prepare = function () {
        $outer = this.$tab.find('#event-outer');
        $table = this.$tab.find('#event-table');
        $pause = this.$tab.find('#event-pause');

        // install header
        $header = this.$tab.find('#events-table-tr');
        hdr = new IobListHeader($header, {list: $outer, colWidthOffset: 1, prefix: 'event-filter'});
        hdr.doFilter = filterEvents;

        hdr.add('combobox', 'type');
        hdr.add('edit',     'id', 'ID');
        //hdr.add('edit',   'val', 'Value');
        hdr.add('edit',     'val', 'value');
        hdr.add('combobox', 'ack', 'ack', [
            {val: '',       name: 'all'},
            {val: 'true',   name: 'ack'},
            {val: 'false',  name: 'not ack'}
        ]);
        hdr.add('combobox', 'from', 'from');
        hdr.add('text',     'ts');
        hdr.add('text',     'lc');

        Object.defineProperty(hdr, 'getValues', {
            value: function () {
                hdr.ID.selectedVal = hdr.ID.selectedVal.toLocaleLowerCase();
                if (hdr.ack.selectedVal === 'true')  hdr.ack.selectedVal = true;
                if (hdr.ack.selectedVal === 'false') hdr.ack.selectedVal = false;
            },
            enumerateble: false
        });

        $pause.on('click', function () {
            that.pause();
        });

        // bind "clear events" button
        var $eventClear = this.$tab.find('#event-clear');
        $eventClear
            .off('click').on('click', function () {
                list.count = 0;
                list.start = 0;
                $('#event-table').html('');
            });
    };

    this.init    = function () {
        if (isRemote) {
            $('#grid-events').html(_('You can\'t see events via cloud') + '<br><i class="large material-icons">cloud_off</i>').addClass('no-cloud-events');
            return;
        }
        if (!hdr) return;

        if (this.inited) {
            return;
        }
        
        installColResize();

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

    function installColResize() {
        if (!$.fn.colResizable) return;
        if ($outer.is(':visible')) {
            $outer.colResizable({
                liveDrag: true,

                partialRefresh: true,
                marginLeft: 5,
                postbackSafe:true,

                onResize: function (event) {
                    return hdr.syncHeader();
                    // // read width of data.$tree and set the same width for header
                    // var thDest = $('#log-outer-header >thead>tr>th');	//if table headers are specified in its semantically correct tag, are obtained
                    // var thSrc = $outer.find('>tbody>tr:first>td');
                    // for (var i = 1; i < thSrc.length; i++) {
                    //     $(thDest[i]).attr('width', $(thSrc[i]).width());
                    // }
                }
            });
            hdr.syncHeader();
        } else {
            setTimeout(function () {
                installColResize();
            }, 200)
        }
    }

    function updateResizersHeight() {
        columnResizeInit.timer = null;
        $(window).trigger('resize.JColResizer');
    }

    // ----------------------------- Show events ------------------------------------------------
    this.add = function (id, stateOrObj, isMessage, isState) {
        if (isRemote) return;

        var type = isState ? 'stateChange' : (isMessage ? 'message' : 'objChange');
        var value;
        var ack;
        var from = '';
        var ts;
        var lc;
        if (hdr) {
            if (hdr.getValues) {
                hdr.getValues();
            }

            hdr.type.checkAddOption(type);
        }
        if (!columnResizeInit.done) {
            // if the height not 100%, the column resizer is too short. Wait till the table will be really full and reinit resizer.
            // update resizer once and remeber it if the table has full height
            if (!columnResizeInit.timer) {
                columnResizeInit.timer = setTimeout(updateResizersHeight, 1000);
            }

            if (list.count > 20) {
                columnResizeInit.done = true;
            }
        }

        if (!pause.mode) {
            if (list.count >= that.limit) {
                list.start++;
                var e = document.getElementById('event_' + list.start);
                if (e) e.outerHTML = '';
            } else {
                list.count++;
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


        var text = '<tr id="event_' + (list.start + list.count) + '" class="event-line event-type-' + type + ' event-from-' + from.replace('.', '-') + ' event-ack-' + ack + '" style="' + (visible ? '' : 'display:none') + '">';
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

        if (pause.mode) {
            pause.list.push(text);
            pause.counter++;

            if (pause.counter > list.limit) {
                if (!pause.overflow) {
                    $pause.addClass('red lighten3')
                        .attr('title', _('Message buffer overflow. Losing oldest'));
                    pause.overflow = true;
                }
                pause.list.shift();
            }
            pause.$counterSpan.html(pause.counter);
        } else if ($table) {
            $table.prepend(text);
            if (!widthSet && (window.location.hash === '#tab-events' || window.location.hash === '#events')) {
                hdr && hdr.syncHeader();
                widthSet = true;
            }
        }
    };

    /*this.onSelected = function () {
        hdr && hdr.syncHeader();
    };*/

    function filterEvents() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        if (hdr.getValues) {
            hdr.getValues();
        }

        $table && $table.find('.event-line').each(function (index) {
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
        if (!pause.mode) {
            $pause.addClass('yellow btn-pause-button-active');

            pause.$counterSpan = $pause;
            pause.$counterSpan.html('0');
            pause.counter     = 0;
            pause.mode        = true;
        } else {
            pause.mode        = false;
            for (var i = 0; i < pause.list.length; i++) {
                if (list.count >= 500) {
                    list.start++;
                    var e = document.getElementById('event_' + list.start);
                    if (e) e.outerHTML = '';
                } else {
                    list.count++;
                }
                $table.prepend(pause.list[i]);
            }
            pause.overflow = false;
            pause.list     = [];
            pause.counter  = 0;

            $pause
                .removeClass('yellow btn-pause-button-active')
                .html('<i class="material-icons">pause</i>');
        }
    };
}


