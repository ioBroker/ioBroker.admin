function Logs(main) {                                                                       'use strict';

    var that                  = this;
    this.main                 = main;
    this.logLimit             = 2000; //const

    this.logLinesCount        = 0;
    this.logLinesStart        = 0;

    var $logTable, $logOuter, $logPause;
    var logFilterHost = '', logFilterSeverity = '', logFilterMessage = '';
    var pause = {
        list: [],
        mode: false,
        counter: 0,
        overflow: false,
        $counterSpan: null
    };

    var hdr;

    this.prepare = function () {
        $logOuter = $('#log-outer');
        $logTable = $('#log-table');
        $logPause = $('#log-pause');

        hdr = IobListHeader('log-outer-header', {list: $logOuter, colWidthOffset: 1, prefix: 'log-filter'});
        hdr.doFilter = that.filter;

        hdr.add('combobox', 'from', 'host');
        hdr.add('text', 'Time');
        hdr.add('combobox', '', 'severity', [
            { val: "", name: 'debug' },
            { val: "silly", name: 'silly' },
            { val: "info", name: 'info' },
            { val: "warn", name: 'warn' },
            { val: "error", name: 'error' }
        ]).$filter.attr('title', _('severity'));
        hdr.add('edit', 'Message', 'message');

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
        })/*.css({width: 20, height: 20})*/.addClass('ui-state-error');

        $('#log-refresh').button({icons:{primary: 'ui-icon-refresh'}, text: false}).click(function () {
            that.clear();
        });

        $logPause
            .button({icons:{primary: 'ui-icon-pause'}, text: false})
            //.css({height: 20})
            .attr('title', _('Pause output'))
            .click(function () {
                that.pause();
            });

        pause.$counterSpan = $logPause.find('ui-button-text');

        $('#log-clear').button({icons:{primary: 'ui-icon-close'}, text: false}).click(function () {
            that.clear(false);
        });

        $('#log-copy-text').click(function () {
            $('#log-copy-text').hide().html('');
            $('#tabs').show();
        });

        $('#log-copy').button({icons:{primary: 'ui-icon-copy'}, text: false}).click(function () {
            var text = '<span class="error">' + _('copy note') + '</span>';
            $('#tabs').hide();
            $('#log-copy-text').show().html(text + '<br><table style="width: 100%; font-size:12px" id="log-copy-table">' + $logTable.html() + '</table>');
            var lines = $('#log-copy-table').find('.log-column-4');
            for (var t = 0; t < lines.length; t++) {
                var q = $(lines[t]);
                q.html(q.attr('title'));
                q.attr('title', '');
            }
        });
    };

    function installColResize() {
        if (!$.fn.colResizable) return;
        if ($logOuter.is(':visible')) {
            $logOuter.colResizable({
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

    this.resize = function (width, height) {
        //width = width;
    };

    // -------------------------------- Logs ------------------------------------------------------------
    this.init = function () {
        if (!this.main.currentHost) {
            setTimeout(function () {
                that.init();
            }, 100);
            return;
        }

        $logTable.html('');
        this.main.socket.emit('sendToHost', this.main.currentHost, 'getLogs', 200, function (lines) {
            setTimeout(function () {
                var message = {message: '', severity: 'debug', from: '', ts: ''};
                var size = lines ? lines.pop() : -1;
                if (size !== -1) {
                    size = parseInt(size);
                    $('#log-size').html((_('Log size:') + ' ' + ((size / (1024 * 1024)).toFixed(2) + ' MB ')).replace(/ /g, '&nbsp;'));
                }
                for (var i = 0, len = lines.length; i < len; i++) {
                    if (!lines[i]) continue;
                    var line = lines[i];
                    // 2014-12-05 14:47:10.739 - info: iobroker  ERR! network In most cases you are behind a proxy or have bad network settings.npm ERR! network
                    if (line[4] === '-' && line[7] === '-') {
                        line             = line.replace(/(\[[0-9]+m)/g, '');
                        message.ts       = line.substring(0, 23);
                        line             = line.substring(27);

                        var pos          = line.indexOf(':');
                        message.severity = line.substring(0, pos);
                        if (message.severity.charCodeAt(message.severity.length - 1) === 27) message.severity = message.severity.substring(0, message.severity.length - 1);
                        if (message.severity.charCodeAt(0) === 27) message.severity = message.severity.substring(1);

                        line             = line.substring(pos + 2);
                        pos              = line.indexOf(' ');
                        message.from     = line.substring(0, pos);
                        message.message  = line.substring(pos);
                    } else {
                        message.message = line;
                    }
                    that.add(message);
                }

                installColResize();

                logFilterHost     = hdr.host.val();
                logFilterMessage  = hdr.message.val();
                logFilterSeverity = hdr.severity.val();
            }, 0);
        });
    };

    this.add = function (message) {
        // remove instance name from text
        if (message.message.substring(0, message.from.length) === message.from) {
            message.message = message.message.substring(message.from.length + 1);
        }

        if (pause.mode) {
            pause.list.push(message);
            pause.counter++;

            if (pause.counter > this.logLimit) {
                if (!pause.overflow) {
                    $logPause.addClass('ui-state-error')
                        .attr('title', _('Message buffer overflow. Losing oldest'));
                    pause.overflow = true;
                }
                pause.list.shift();
            }
            pause.$counterSpan.html(tdp(pause.counter));
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

        // if (message.from && this.logHosts.indexOf(message.from) === -1) {
        //     this.logHosts.push(message.from);
        //     this.logHosts.sort();
        //     this.$logFilterHost.html('<option value="">' + _('all') + '</option>');
        //     for (var i = 0; i < this.logHosts.length; i++) {
        //         this.$logFilterHost.append('<option value="' + this.logHosts[i].replace(/\./g, '-') + '" ' + ((this.logHosts[i] === this.logFilterHost) ? 'selected' : '') + '>' + this.logHosts[i] + '</option>');
        //     }
        // }

        if (message.from) {
            hdr.host.checkAddOption(message.from, function (o) {
                return { val: o.replace(/\./g, '-'), name: o };
            })
        }

        var visible = '';
        var from = message.from ? message.from.replace(/\./g, '-') : '';

        if (this.logFilterHost && this.logFilterHost !== from) visible = 'display: none';

        if (!visible && logFilterSeverity) {
            if (this.logFilterSeverity === 'debug' && message.severity === 'silly') {
                visible = 'display: none';
            } else if (this.logFilterSeverity === 'info' && (message.severity === 'debug' || message.severity === 'silly')) {
                visible = 'display: none';
            } else if (logFilterSeverity === 'warn' && message.severity !== 'warn' && message.severity !== 'error') {
                visible = 'display: none';
            } else if (logFilterSeverity === 'error' && message.severity !== 'error') {
                visible = 'display: none';
            }
        }

        if (!visible && logFilterMessage && message.message.indexOf(logFilterMessage) === -1) {
            visible = 'display: none';
        }

        if (message.severity === 'error') $('a[href="#tab-log"]').addClass('errorLog');

        var text = '<tr id="log-line-' + (this.logLinesStart + this.logLinesCount) + '" class="log-line log-severity-' + message.severity + ' ' + (from ? 'log-from-' + from : '') + '" style="' + visible + '">';
        text += '<td class="log-column-1">' + (message.from || '') + '</td>';
        text += '<td class="log-column-2">' + this.main.formatDate(message.ts) + '</td>';
        text += '<td class="log-column-3">' + message.severity + '</td>';
        text += '<td class="log-column-4" title="' + message.message.replace(/"/g, "'") + '">' + message.message.substring(0, 200) + '</td></tr>';

        $logTable.prepend(text);
    };

    this.filter = function () {
        logFilterHost     = hdr.host.val();
        logFilterMessage  = hdr.message.val();
        logFilterSeverity = hdr.severity.val();

        if (logFilterSeverity === 'error') {
            $logOuter.find('.log-severity-silly').hide();
            $logOuter.find('.log-severity-debug').hide();
            $logOuter.find('.log-severity-info').hide();
            $logOuter.find('.log-severity-warn').hide();
            $logOuter.find('.log-severity-error').show();
        } else
        if (logFilterSeverity === 'warn') {
            $logOuter.find('.log-severity-silly').hide();
            $logOuter.find('.log-severity-debug').hide();
            $logOuter.find('.log-severity-info').hide();
            $logOuter.find('.log-severity-warn').show();
            $logOuter.find('.log-severity-error').show();
        } else
        if (that.logFilterSeverity === 'info') {
            $logOuter.find('.log-severity-silly').hide();
            $logOuter.find('.log-severity-debug').hide();
            $logOuter.find('.log-severity-info').show();
            $logOuter.find('.log-severity-warn').show();
            $logOuter.find('.log-severity-error').show();
        } else
        if (logFilterSeverity === 'silly') {
            $logOuter.find('.log-severity-silly').show();
            $logOuter.find('.log-severity-debug').show();
            $logOuter.find('.log-severity-info').show();
            $logOuter.find('.log-severity-warn').show();
            $logOuter.find('.log-severity-error').show();
        } else {
            $logOuter.find('.log-severity-silly').hide();
            $logOuter.find('.log-severity-debug').show();
            $logOuter.find('.log-severity-info').show();
            $logOuter.find('.log-severity-warn').show();
            $logOuter.find('.log-severity-error').show();
        }

        if (logFilterHost || logFilterMessage) {
            $logOuter.find('.log-line').each(function () {
                if (logFilterHost && !$(this).hasClass('log-from-' + logFilterHost)) {
                    $(this).hide();
                } else if (logFilterMessage && $(this).html().indexOf(logFilterMessage) === -1) {
                    $(this).hide();
                }
            });
        }
    };

    this.clear = function (isReload) {
        if (isReload === undefined) isReload = true;
        $logTable.html('');
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
        if (!pause.mode) {
            $logPause
                .addClass('ui-state-focus ui-state-error log-pause-button-active')
                .button('option', 'text', true)
                .button('option', 'icons', {primary: null});

            pause.$counterSpan = $logPause.find('.ui-button-text');
            pause.$counterSpan.addClass().html('0');
            pause.counter  = 0;
            pause.mode     = true;
        } else {
            pause.mode     = false;
            for (var i = 0; i < pause.list.length; i++) {
                this.add(pause.list[i]);
            }
            pause.overflow = false;
            pause.list.length = 0;
            pause.counter  = 0;

            $logPause
                .removeClass('ui-state-error ui-state-focus')
                .removeClass('log-pause-button-active')
                .attr('title', _('Pause output'))
                .button('option', 'text', false).button('option', 'icons', {primary: 'ui-icon-pause'});
        }
    };
}
