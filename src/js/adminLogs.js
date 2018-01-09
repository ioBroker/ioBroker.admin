function Logs(main) {                                                                       'use strict';

    var that   = this;
    this.main  = main;
    this.$tab  = $('#tab-logs');

    var list = {
        count: 0,
        start: 0,
        limit: 2000 //const
    };

    var $table;
    var $outer;
    var $pause;
    
    var filters = {
        host: '',
        severity: '',
        message: ''
    };
    
    var pause = {
        list:           [],
        mode:           false,
        counter:        0,
        overflow:       false,
        $counterSpan:   null
    };

    var hdr;

    this.prepare = function () {
        $outer = this.$tab.find('#log-outer');
        $table = this.$tab.find('#log-table');
        $pause = this.$tab.find('#log-pause');

        hdr = new IobListHeader('log-outer-header', {list: $outer, colWidthOffset: 1, prefix: 'log-filter'});
        hdr.doFilter = that.filter;

        hdr.add('combobox', 'from', 'host');
        hdr.add('text', 'Time');
        hdr.add('combobox', '', 'severity', [
            {val: '',       name: 'debug'},
            {val: 'silly',  name: 'silly'},
            {val: 'info',   name: 'info'},
            {val: 'warn',   name: 'warn'},
            {val: 'error',  name: 'error'}
        ]).$filter.attr('title', _('severity'));
        hdr.add('edit', 'Message', 'message');

        this.$tab.find('#log-clear-on-disk').on('click', function () {
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
        }).addClass('ui-state-error');

        this.$tab.find('#log-refresh').on('click', function () {
            that.clear();
        });

        $pause
            .attr('title', _('Pause output'))
            .on('click', function () {
                that.pause();
            });

        pause.$counterSpan = $pause.find('ui-button-text');

        this.$tab.find('#log-clear').on('click', function () {
            that.clear(false);
        });

        $('#log-copy-text').on('click', function () {
            $(this).hide().html('');
        });

        this.$tab.find('#log-copy').on('click', function () {
            var text = '<span class="error">' + _('copy note') + '</span>';
            $('#log-copy-text').show().html(text + '<br><table style="width: 100%; font-size: 12px" id="log-copy-table">' + $table.html() + '</table>');
            var lines = that.$tab.find('#log-copy-table').find('.log-column-4');
            for (var t = 0; t < lines.length; t++) {
                var q = $(lines[t]);
                q.html(q.attr('title'));
                q.attr('title', '');
            }
        });
    };

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
                }
            });
            hdr && hdr.syncHeader();
        } else {
            setTimeout(function () {
                installColResize();
            }, 200)
        }
    }

    // -------------------------------- Logs ------------------------------------------------------------
    this.init = function (update) {
        if (this.inited && !update) {
            return;
        }
        if (!this.main.currentHost) {
            setTimeout(function () {
                that.init(update);
            }, 100);
            return;
        }

        $table.html('');

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

                filters.host     = hdr.host.val();
                filters.message  = hdr.message.val();
                filters.severity = hdr.severity.val();
                if (!that.inited) {
                    that.inited = true;
                    that.main.subscribeLogs(true);
                }

                // prepare log list
                that.main.socket.emit('readLogs', function (err, list) {
                    if (list && list.length) {
                        var html = '';
                        list.reverse();
                        // first 2018-01-01
                        for (var l = 0; l < list.length; l++) {
                            var parts = list[l].split('/');
                            var name = parts.pop().replace(/iobroker\.?/, '').replace('.log', '');
                            if (name[0] <= '9') {
                                html += '<li><a data-value="' + list[l] + '">' + name + '</a></li>';
                            }
                        }
                        // then restart.log ans so on
                        list.sort();
                        for (var ll = 0; ll < list.length; ll++) {
                            var parts_ = list[ll].split('/');
                            var name_ = parts_.pop().replace(/iobroker\.?/, '').replace('.log', '');
                            if (name_[0] > '9') {
                                html += '<li><a data-value="' + list[ll] + '">' + name_ + '</a></li>';
                            }
                        }

                        that.$tab.find('#log-files-btn').show().dropdown();
                        that.$tab.find('#log-files')
                            .html(html)
                                .find('a').on('click', function () {
                                    var val = $(this).data('value');
                                    if (val) {
                                        $(this).val('');
                                        var win = window.open(val, '_blank');
                                        win.focus();
                                    }
                                });
                    } else {
                        that.$tab.find('#log-files').hide();
                        that.$tab.find('#log-files-btn').hide();
                    }
                });
            }, 0);
        });
    };

    this.destroy = function () {
        if (this.inited) {
            this.inited = false;
            this.main.subscribeLogs(false);
        }
    };

    this.add = function (message) {
        if (!$table) return;
        // remove instance name from text
        if (message.message.substring(0, message.from.length) === message.from) {
            message.message = message.message.substring(message.from.length + 1);
        }

        if (pause.mode) {
            pause.list.push(message);
            pause.counter++;

            if (pause.counter > list.limit) {
                if (!pause.overflow) {
                    $pause.addClass('ui-state-error')
                        .attr('title', _('Message buffer overflow. Losing oldest'));
                    pause.overflow = true;
                }
                pause.list.shift();
            }
            pause.$counterSpan.html(tdp(pause.counter));
            return;
        }

        //message = {message: msg, severity: level, from: this.namespace, ts: (new Date()).getTime()}
        if (list.count >= list.limit) {
            var line = document.getElementById('log-line-' + (list.start + 1));
            if (line) line.outerHTML = '';
            list.start++;
        } else {
            list.count++;
        }

        // if (message.from && this.logHosts.indexOf(message.from) === -1) {
        //     this.logHosts.push(message.from);
        //     this.logHosts.sort();
        //     this.$logFilterHost.html('<option value="">' + _('all') + '</option>');
        //     for (var i = 0; i < this.logHosts.length; i++) {
        //         this.$logFilterHost.append('<option value="' + this.logHosts[i].replace(/\./g, '-') + '" ' + ((this.logHosts[i] === filters.host) ? 'selected' : '') + '>' + this.logHosts[i] + '</option>');
        //     }
        // }

        if (message.from && hdr) {
            hdr.host.checkAddOption(message.from, function (o) {
                return { val: o.replace(/\./g, '-'), name: o };
            });
        }

        var visible = '';
        var from = message.from ? message.from.replace(/\./g, '-') : '';

        if (filters.host && filters.host !== from) visible = 'display: none';

        if (!visible && filters.severity) {
            if (filters.severity === 'debug' && message.severity === 'silly') {
                visible = 'display: none';
            } else if (filters.severity === 'info' && (message.severity === 'debug' || message.severity === 'silly')) {
                visible = 'display: none';
            } else if (filters.severity === 'warn' && message.severity !== 'warn' && message.severity !== 'error') {
                visible = 'display: none';
            } else if (filters.severity === 'error' && message.severity !== 'error') {
                visible = 'display: none';
            }
        }

        if (!visible && filters.message && message.message.indexOf(filters.message) === -1) {
            visible = 'display: none';
        }

        if (message.severity === 'error') $('a[href="#tab-logs"]').addClass('errorLog');

        var text = '<tr id="log-line-' + (list.start + list.count) + '" class="log-line log-severity-' + message.severity + ' ' + (from ? 'log-from-' + from : '') + '" style="' + visible + '">';
        text += '<td class="log-column-1">' + (message.from || '') + '</td>';
        text += '<td class="log-column-2">' + this.main.formatDate(message.ts) + '</td>';
        text += '<td class="log-column-3">' + message.severity + '</td>';
        text += '<td class="log-column-4" title="' + message.message.replace(/"/g, "'") + '">' + message.message.substring(0, 200) + '</td></tr>';

        $table.prepend(text);
    };

    this.filter = function () {
        filters.host     = hdr.host.val();
        filters.message  = hdr.message.val();
        filters.severity = hdr.severity.val();

        if (filters.severity === 'error') {
            $outer.find('.log-severity-silly').hide();
            $outer.find('.log-severity-debug').hide();
            $outer.find('.log-severity-info').hide();
            $outer.find('.log-severity-warn').hide();
            $outer.find('.log-severity-error').show();
        } else
        if (filters.severity === 'warn') {
            $outer.find('.log-severity-silly').hide();
            $outer.find('.log-severity-debug').hide();
            $outer.find('.log-severity-info').hide();
            $outer.find('.log-severity-warn').show();
            $outer.find('.log-severity-error').show();
        } else
        if (that.filters.severity === 'info') {
            $outer.find('.log-severity-silly').hide();
            $outer.find('.log-severity-debug').hide();
            $outer.find('.log-severity-info').show();
            $outer.find('.log-severity-warn').show();
            $outer.find('.log-severity-error').show();
        } else
        if (filters.severity === 'silly') {
            $outer.find('.log-severity-silly').show();
            $outer.find('.log-severity-debug').show();
            $outer.find('.log-severity-info').show();
            $outer.find('.log-severity-warn').show();
            $outer.find('.log-severity-error').show();
        } else {
            $outer.find('.log-severity-silly').hide();
            $outer.find('.log-severity-debug').show();
            $outer.find('.log-severity-info').show();
            $outer.find('.log-severity-warn').show();
            $outer.find('.log-severity-error').show();
        }

        if (filters.host || filters.message) {
            $outer.find('.log-line').each(function () {
                if (filters.host && !$(this).hasClass('log-from-' + filters.host)) {
                    $(this).hide();
                } else if (filters.message && $(this).html().indexOf(filters.message) === -1) {
                    $(this).hide();
                }
            });
        }
    };

    this.clear = function (isReload) {
        if (isReload === undefined) isReload = true;
        $table.html('');
        list.count = 0;
        list.start = 0;
        $('a[href="#tab-logs"]').removeClass('errorLog');

        if (isReload) {
            setTimeout(function () {
                that.init(isReload);
            }, 0);
        }
    };

    this.pause = function () {
        if (!pause.mode) {
            $pause
                .addClass('yellow btn-pause-button-active');

            pause.$counterSpan = $pause;
            pause.$counterSpan.html('0');
            pause.counter  = 0;
            pause.mode     = true;
        } else {
            pause.mode     = false;
            for (var i = 0; i < pause.list.length; i++) {
                this.add(pause.list[i]);
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
