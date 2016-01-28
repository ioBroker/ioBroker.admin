function Logs(main) {
    var that =                 this;
    this.main =                main;
    this.logLimit =            2000; //const

    this.logLinesCount =       0;
    this.logLinesStart =       0;
    this.logHosts =            [];
    this.logFilterTimeout =    null;
    
    this.logPauseList =        [];
    this.logPauseMode =        false;
    this.logPauseOverflow =    false;
    this.logPauseCounterSpan = null;
    this.logPauseCounter =     [];


    this.prepare = function () {
        $('#log-filter-severity').change(this.filter);
        $('#log-filter-host').change(this.filter);
        $('#log-filter-message').change(function () {
            if (that.logFilterTimeout) clearTimeout(that.logFilterTimeout);
            that.logFilterTimeout = setTimeout(that.filter, 1000);
        }).keyup(function (e) {
            if (e.which == 13) {
                that.filter();
            } else {
                $(this).trigger('change');
            }
        });
        $('#log-filter-message-clear').button({icons:{primary: 'ui-icon-close'}, text: false}).css({height: 18, width: 18}).click(function () {
            var $log_filter = $('#log-filter-message');
            if ($log_filter.val() !== '') {
                $log_filter.val('').trigger('change');
            }
        });

        $('#log-clear-on-disk').button({icons:{primary: 'ui-icon-trash'}, text: false}).click(function () {
            that.main.confirmMessage(_('Log file will be deleted. Are you sure?'), null, null, function (result) {
                if (result) {
                    that.main.socket.emit('sendToHost', main.currentHost, 'delLogs', null, function (err) {
                        if (err) {
                            that.main.showError(err);
                        } else {
                            that.clear();
                        }
                    });
                }
            });
        }).css({width: 20, height: 20}).addClass('ui-state-error');

        $('#log-refresh').button({icons:{primary: 'ui-icon-refresh'}, text: false}).click(function () {
            that.clear();
        }).css({width: 20, height: 20});

        $('#log-pause')
            .button({icons:{primary: 'ui-icon-pause'}, text: false})
            .css({height: 20})
            .attr('title', _('Pause output'))
            .click(function () {
                that.pause();
            });

        this.logPauseCounterSpan = $('#log-pause .ui-button-text');

        $('#log-clear').button({icons:{primary: 'ui-icon-trash'}, text: false}).click(function () {
            that.clear(false);
        }).css({width: 20, height: 20});

        $('#log-copy-text').click(function () {
            $('#log-copy-text').hide().html('');
            $('#tabs').show();
        });

        $('#log-copy').button({icons:{primary: 'ui-icon-copy'}, text: false}).click(function () {
            var text = '<span class="error">' + _('copy note') + '</span>';
            $('#tabs').hide();
            $('#log-copy-text').show().html(text + '<br><table style="width: 100%; font-size:12px" id="log-copy-table">' + $('#log-table').html() + '</table>');
            var lines = $('#log-copy-table .log-column-4');
            for (var t = 0; t < lines.length; t++) {
                var q = $(lines[t]);
                q.html(q.attr('title'));
                q.attr('title', '');
            }
        }).css({width: 20, height: 20});
    };

    function installColResize() {
        if (!$.fn.colResizable) return;
        var $outer = $('#log-outer');

        if ($outer.is(':visible')) {
            $outer.colResizable({
                liveDrag: true,
                onResize: function (event) {
                    // read width of data.$tree and set the same width for header
                    var thDest = $('#log-outer-header >thead>tr>th');	//if table headers are specified in its semantically correct tag, are obtained
                    var thSrc = $outer.find('>tbody>tr:first>td');
                    for (var i = 1; i < thSrc.length; i++) {
                        $(thDest[i]).attr('width', $(thSrc[i]).width());
                    }
                }
            });
        } else {
            setTimeout(function () {
                installColResize();
            }, 400)
        }
    }

    // -------------------------------- Logs ------------------------------------------------------------
    this.init = function () {
        if (!this.main.currentHost) {
            setTimeout(function () {
                that.init();
            }, 500);
            return;
        }

        $('#log-table').html('');
        this.main.socket.emit('sendToHost', this.main.currentHost, 'getLogs', 200, function (lines) {
            setTimeout(function () {
                var message = {message: '', severity: 'debug', from: '', ts: ''};
                var size = lines ? lines.pop() : -1;
                if (size != -1) {
                    size = parseInt(size);
                    $('#log-size').html((_('Log size:') + ' ' + ((size / (1024 * 1024)).toFixed(2) + ' MB ')).replace(/ /g, '&nbsp;'));
                }
                for (var i = 0; i < lines.length; i++) {
                    if (!lines[i]) continue;
                    // 2014-12-05 14:47:10.739 - info: iobroker  ERR! network In most cases you are behind a proxy or have bad network settings.npm ERR! network
                    if (lines[i][4] == '-' && lines[i][7] == '-') {
                        lines[i]         = lines[i].replace(/(\[[0-9]+m)/g, '');
                        message.ts       = lines[i].substring(0, 23);
                        lines[i]         = lines[i].substring(27);

                        var pos          = lines[i].indexOf(':');
                        message.severity = lines[i].substring(0, pos);
                        if (message.severity.charCodeAt(message.severity.length - 1) == 27) message.severity = message.severity.substring(0, message.severity.length - 1);
                        if (message.severity.charCodeAt(0) == 27) message.severity = message.severity.substring(1);

                        lines[i]         = lines[i].substring(pos + 2);
                        pos              = lines[i].indexOf(' ');
                        message.from     = lines[i].substring(0, pos).replace(/\./g, '-');
                        message.message  = lines[i].substring(pos);
                    } else {
                        message.message = lines[i];
                    }
                    that.add(message);
                }

                installColResize();
            }, 0);
        });
    };

    this.add = function (message) {
        if (this.logPauseMode) {
            this.logPauseList.push(message);
            this.logPauseCounter++;

            if (this.logPauseCounter > this.logLimit) {
                if (!this.logPauseOverflow) {
                    $('#log-pause').addClass('ui-state-error')
                        .attr('title', _('Message buffer overflow. Losing oldest'));
                    this.logPauseOverflow = true;
                }
                this.logPauseList.shift();
            }
            this.logPauseCounterSpan.html(this.logPauseCounter);
            return;
        }

        //message = {message: msg, severity: level, from: this.namespace, ts: (new Date()).getTime()}
        if (this.logLinesCount >= this.logLimit) {
            var line = document.getElementById('log-line-' + (this.logLinesStart + 1));
            if (line) line.outerHTML = '';
            this.logLinesStart++;
        } else {
            this.logLinesCount++;
        }

        var $log_filter_host = $('#log-filter-host');
        var hostFilter = $log_filter_host.val();

        if (message.from && this.logHosts.indexOf(message.from) == -1) {
            this.logHosts.push(message.from);
            this.logHosts.sort();
            $log_filter_host.html('<option value="">' + _('all') + '</option>');
            for (var i = 0; i < this.logHosts.length; i++) {
                $log_filter_host.append('<option value="' + this.logHosts[i].replace(/\./g, '-') + '" ' + ((this.logHosts[i] == hostFilter) ? 'selected' : '') + '>' + this.logHosts[i] + '</option>');
            }
        }
        var visible = '';

        if (hostFilter && hostFilter != message.from) visible = 'display: none';

        var sevFilter = $('#log-filter-severity').val();
        if (!visible && sevFilter) {
            if (sevFilter == 'info' && message.severity == 'debug') {
                visible = 'display: none';
            } else if (sevFilter == 'warn' && message.severity != 'warn' && message.severity != 'error') {
                visible = 'display: none';
            } else if (sevFilter == 'error' && message.severity != 'error') {
                visible = 'display: none';
            }
        }

        if (message.severity == 'error') $('a[href="#tab-log"]').addClass('errorLog');

        var text = '<tr id="log-line-' + (this.logLinesStart + this.logLinesCount) + '" class="log-line log-severity-' + message.severity + ' ' + (message.from ? 'log-from-' + message.from : '') + '" style="' + visible + '">';
        text += '<td class="log-column-1">' + (message.from || '') + '</td>';
        text += '<td class="log-column-2">' + this.main.formatDate(message.ts) + '</td>';
        text += '<td class="log-column-3">' + message.severity + '</td>';
        text += '<td class="log-column-4" title="' + message.message.replace(/"/g, "'") + '">' + message.message.substring(0, 200) + '</td></tr>';

        $('#log-table').prepend(text);
    };

    this.filter = function () {
        if (this.logFilterTimeout) {
            clearTimeout(this.logFilterTimeout);
            this.logFilterTimeout = null;
        }
        var filterSev  = $('#log-filter-severity').val();
        var filterHost = $('#log-filter-host').val();
        var filterMsg  = $('#log-filter-message').val();
        if (filterSev == 'error') {
            $('#log-outer .log-severity-debug').hide();
            $('#log-outer .log-severity-info').hide();
            $('#log-outer .log-severity-warn').hide();
            $('#log-outer .log-severity-error').show();
        } else
        if (filterSev == 'warn') {
            $('#log-outer .log-severity-debug').hide();
            $('#log-outer .log-severity-info').hide();
            $('#log-outer .log-severity-warn').show();
            $('#log-outer .log-severity-error').show();
        }else
        if (filterSev == 'info') {
            $('#log-outer .log-severity-debug').hide();
            $('#log-outer .log-severity-info').show();
            $('#log-outer .log-severity-warn').show();
            $('#log-outer .log-severity-error').show();
        } else {
            $('#log-outer .log-severity-debug').show();
            $('#log-outer .log-severity-info').show();
            $('#log-outer .log-severity-warn').show();
            $('#log-outer .log-severity-error').show();
        }
        if (filterHost || filterMsg) {
            $('#log-outer .log-line').each(function () {
                if (filterHost && !$(this).hasClass('log-from-' + filterHost)) {
                    $(this).hide();
                } else
                if (filterMsg && $(this).html().indexOf(filterMsg) == -1) {
                    $(this).hide();
                }
            });
        }
    };

    this.clear = function (isReload) {
        if (isReload === undefined) isReload = true;
        $('#log-table').html('');
        this.logLinesCount = 0;
        this.logLinesStart = 0;
        $('a[href="#tab-log"]').removeClass('errorLog');

        if (isReload) {
            setTimeout(function () {
                that.init();
            }, 0);
        }
    };

    this.pause = function () {
        if (!this.logPauseMode) {
            $('#log-pause')
                .addClass('ui-state-focus')
                .button('option', 'text', true)
                .button('option', 'icons', {primary: null});

            this.logPauseCounterSpan = $('#log-pause .ui-button-text');
            this.logPauseCounterSpan.html('0').css({'padding-top': '1px', 'padding-bottom': '0px'});
            this.logPauseCounter  = 0;
            this.logPauseMode     = true;
        } else {
            this.logPauseMode     = false;
            for (var i = 0; i < this.logPauseList.length; i++) {
                this.add(this.logPauseList[i]);
            }
            this.logPauseOverflow = false;
            this.logPauseList     = [];
            this.logPauseCounter  = 0;

            $('#log-pause')
                .removeClass('ui-state-error ui-state-focus')
                .attr('title', _('Pause output'))
                .button('option', 'text', false).button('option', 'icons', {primary: 'ui-icon-pause'});
        }
    };
}
