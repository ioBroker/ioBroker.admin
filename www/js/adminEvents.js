function Events(main) {
    var that      = this;
    this.main     =   main;
    this.list     = [];
    this.$table   = $('#event-table');

    var eventsLinesCount =      0;
    var eventsLinesStart =      0;
    var eventTypes =            [];
    var eventFroms =            [];
    var eventFilterTimeout =    null;



    this.prepare = function () {
        $('#event-filter-type').change(filterEvents);
        $('#event-filter-id').change(function () {
            if (eventFilterTimeout) clearTimeout(eventFilterTimeout);
            eventFilterTimeout = setTimeout(filterEvents, 1000);
        }).keyup(function (e) {
            if (e.which == 13) {
                filterEvents();
            } else {
                $(this).trigger('change');
            }
        });
        $('#event-filter-val').change(function () {
            if (eventFilterTimeout) clearTimeout(eventFilterTimeout);
            eventFilterTimeout = setTimeout(filterEvents, 1000);
        }).keyup(function (e) {
            if (e.which == 13) {
                filterEvents();
            } else {
                $(this).trigger('change');
            }
        });
        $('#event-filter-ack').change(filterEvents);
        $('#event-filter-from').change(filterEvents);
        $('#event-filter-val-clear').button({icons:{primary: 'ui-icon-close'}, text: false}).css({height: 18, width: 18}).click(function () {
            if ($('#event-filter-val').val() !== '') {
                $('#event-filter-val').val('').trigger('change');
            }
        });
        $('#event-filter-id-clear').button({icons:{primary: 'ui-icon-close'}, text: false}).css({height: 18, width: 18}).click(function () {
            if ($('#event-filter-id').val() !== '') {
                $('#event-filter-id').val('').trigger('change');
            }
        });

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
        }).css({height: 28});

    };

    // ----------------------------- Show events ------------------------------------------------
    this.addEventMessage = function (id, state, rowData, obj) {
        var typeFilter = $('#event-filter-type').val();
        var fromFilter = $('#event-filter-from').val();
        var type = rowData ? 'stateChange' : 'message';
        var value;
        var ack;
        var from = '';
        var tc;
        var lc;

        if (obj) {
            type = 'objectChange';
            value = JSON.stringify(obj, '\x0A', 2);
            if (value !== undefined && value.length > 30) value = '<span title="' + value.replace(/"/g, '\'') + '">' + value.substring(0, 30) + '...</span>';
            ack = '';
            tc = main.formatDate(new Date());
            lc = '';
        }

        if (eventTypes.indexOf(type) == -1) {
            eventTypes.push(type);
            eventTypes.sort();
            if (eventTypes.length > 1) {
                $('#event-filter-type').html('<option value="">' + _('all') + '</option>');
                for (var i = 0; i < eventTypes.length; i++) {
                    $('#event-filter-type').append('<option value="' + eventTypes[i] + '" ' + ((eventTypes[i] == typeFilter) ? 'selected' : '') + '>' + eventTypes[i] + '</option>');
                }
            }
        }
        if (eventsLinesCount >= 500) {
            eventsLinesStart++;
            var e = document.getElementById('event_' + eventsLinesStart);
            if (e) e.outerHTML = '';
        } else {
            eventsLinesCount++;
        }

        if (state) {
            state.from = state.from || '';
            state.from = state.from.replace('system.adapter.', '');
            state.from = state.from.replace('system.', '');

            if (eventFroms.indexOf(state.from) == -1) {
                eventFroms.push(state.from);
                eventFroms.sort();
                $('#event-filter-from').html('<option value="">' + _('all') + '</option>');
                for (var i = 0; i < eventFroms.length; i++) {
                    var e = eventFroms[i].replace('.', '-')
                    $('#event-filter-from').append('<option value="' + e + '" ' + ((e == fromFilter) ? 'selected' : '') + '>' + eventFroms[i] + '</option>');
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
        var filterType = $('#event-filter-type').val();
        var filterId   = $('#event-filter-id').val().toLocaleLowerCase();
        var filterVal  = $('#event-filter-val').val();
        var filterAck  = $('#event-filter-ack').val();
        var filterFrom = $('#event-filter-from').val();
        if (filterAck === 'true')  filterAck = true;
        if (filterAck === 'false') filterAck = false;

        if (filterType && filterType != type) {
            visible = false;
        } else if (filterId && id.toLocaleLowerCase().indexOf(filterId) == -1) {
            visible = false;
        } else if (filterVal !== '' && value.indexOf(filterVal) == -1) {
            visible = false;
        } else if (filterAck !== '' && filterAck != ack) {
            visible = false;
        } else if (filterFrom && filterFrom != from) {
            visible = false;
        }

        var text = '<tr id="event_' + (eventsLinesStart + eventsLinesCount) + '" class="event-line event-type-' + type + ' event-from-' + from.replace('.', '-') + ' event-ack-' + ack + '" style="' + (visible ? '' : 'display:none') + '">';
        text += '<td class="event-column-1">' + type  + '</td>';
        text += '<td class="event-column-2 event-column-id">' + id    + '</td>';
        text += '<td class="event-column-3 event-column-value">' + value + '</td>';
        text += '<td class="event-column-4">' + ack   + '</td>';
        text += '<td class="event-column-5">' + from  + '</td>';
        text += '<td class="event-column-6">' + tc    + '</td>';
        text += '<td class="event-column-7">' + lc    + '</td>';
        text += '</tr>';

        this.$table.prepend(text);
    }

    function filterEvents() {
        if (eventFilterTimeout) {
            clearTimeout(eventFilterTimeout);
            eventFilterTimeout = null;
        }
        var filterType = $('#event-filter-type').val();
        var filterId   = $('#event-filter-id').val().toLocaleLowerCase();
        var filterVal  = $('#event-filter-val').val();
        var filterAck  = $('#event-filter-ack').val();
        var filterFrom = $('#event-filter-from').val();
        if (filterAck === 'true')  filterAck = true;
        if (filterAck === 'false') filterAck = false;

        $('.event-line').each(function (index) {
            var isShow = true;
            var $this = $(this);
            if (filterType && !$this.hasClass('event-type-' + filterType)) {
                isShow = false;
            } else
            if (filterFrom && !$this.hasClass('event-from-' + filterFrom)) {
                isShow = false;
            } else
            if (filterAck !== '' && !$this.hasClass('event-ack-' + filterAck)) {
                isShow = false;
            } else
            if (filterId && $(this).find('td.event-column-id').text().toLocaleLowerCase().indexOf(filterId) == -1) {
                isShow = false;
            } else
            if (filterVal !== '' && $(this).find('td.event-column-value').text().indexOf(filterVal) == -1) {
                isShow = false;
            }

            if (isShow) {
                $this.show();
            } else {
                $this.hide();
            }
        });
    }

    this.resize = function (width, height) {
        $('#grid-events-inner').css('height', (height - 130) + 'px');
    };
}

