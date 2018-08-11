function Customs(main) {
    'use strict';

    var STR_DIFFERENT   = '__different__';
    var that            = this;
    this.main           = main;
    this.$dialog        = $('#dialog-customs');
    this.customEnabled  = null;
    this.currentCustoms = null; // Id of the currently shown customs dialog

    var $table;
    var $outer;
    var hdr;
    var lastHistoryTimeStamp;

    var $tableDateFrom;
    var $tableDateTo;
    var $tableTimeFrom;
    var $tableTimeTo;

    var $chartDateFrom;
    var $chartDateTo;
    var $chartTimeFrom;
    var $chartTimeTo;

    var $historyTableInstance;
    var $historyChartInstance;

    // ----------------------------- CUSTOMS ------------------------------------------------
    this.check = function () {
        var found = false;
        for (var u = 0; u < this.main.instances.length; u++) {
            if (this.main.objects[this.main.instances[u]].common &&
                (this.main.objects[this.main.instances[u]].common.type === 'storage' || this.main.objects[this.main.instances[u]].common.supportCustoms) &&
                this.main.objects[this.main.instances[u]].common.enabled) {
                if (this.customEnabled !== null && this.customEnabled !== true) {
                    this.customEnabled = true;
                    // update customs buttons
                    this.init(true);
                } else {
                    this.customEnabled = true;
                }
                found = true;
                return;
            }
        }
        if (this.customEnabled !== null && this.customEnabled !== false) {
            this.customEnabled = false;
            // update custom button
            this.init(true);
        } else {
            this.customEnabled = false;
        }
    };

    this.stateChange = function (id /*, state */) {
        if (this.currentCustoms === id) {
            updateTable();
        }
    };

    this.initCustomsTabs = function (ids, instances) {
        var $customTabs = this.$dialog.find('#customs-tabs');
        ids = ids || [];
        $customTabs.html('');
        var wordDifferent = _(STR_DIFFERENT);
        this.defaults = {};
        var collapsed = this.main.config['object-customs-collapsed'];
        collapsed = collapsed ? collapsed.split(',') : [];

        var commons = {};
        var type = null;
        var role = null;
        // calculate common settings
        for (var i = 0; i < instances.length; i++) {
            var inst = instances[i].replace(/^system\.adapter\./, '');
            commons[inst] = {};
            for (var id = 0; id < ids.length; id++) {
                var custom = main.objects[ids[id]].common.custom;
                var sett   = custom ? custom[inst] : null;

                if (main.objects[ids[id]].common) {
                    if (type === null) {
                        type = main.objects[ids[id]].common.type;
                    } else if (type !== '' && type !== main.objects[ids[id]].common.type) {
                        type = '';
                    }
                    if (role === null) {
                        role = main.objects[ids[id]].common.role;
                    } else if (role !== '' && role !== main.objects[ids[id]].common.role) {
                        role = '';
                    }
                }

                if (sett) {
                    for (var _attr in sett) {
                        if (!sett.hasOwnProperty(_attr)) continue;
                        if (commons[inst][_attr] === undefined) {
                            commons[inst][_attr] = sett[_attr];
                        } else if (commons[inst][_attr] !== sett[_attr]) {
                            commons[inst][_attr] = STR_DIFFERENT;
                        }
                    }
                } else {
                    var a = inst.split('.')[0];
                    var _default = null;
                    // Try to get default values
                    if (defaults[a]) {
                        if (typeof defaults[a] === 'function') {
                            _default = defaults[a](that.main.objects[ids[id]], that.main.objects['system.adapter.' + inst]);
                        } else {
                            _default = defaults[a];
                        }
                    } else {
                        _default = this.defaults[a];
                    }

                    for (var attr in _default) {
                        if (!_default.hasOwnProperty(attr)) continue;
                        if (commons[inst][attr] === undefined) {
                            commons[inst][attr] = _default[attr];
                        } else if (commons[inst][attr] !== _default[attr]) {
                            commons[inst][attr] = STR_DIFFERENT;
                        }
                    }
                }
            }
        }

        // add all tabs to div
        for (var j = 0; j < instances.length; j++) {
            // try to find settings
            var parts    = instances[j].split('.');
            var adapter  = parts[2];
            var instance = parts[3];
            var data = adapter + '.' + instance;
            var img = this.main.objects['system.adapter.' + adapter].common.icon;
            img = '/adapter/' + adapter + '/' + img;
            var tab =
                '<li data-adapter="' + data + '" class="' + (collapsed.indexOf(data) === -1 ? 'active' : '') + '">' +
                '   <div class="collapsible-header">' +
                '       <img src="' + img + '" />' + _('Settings for %s', data) +
                '       <span class="activated" data-adapter="' + data + '" style="opacity: ' + (commons[data] && (commons[data].enabled === true || commons[data].enabled === STR_DIFFERENT) ? '1' : '0') + '">' + _('active') + '</span>' +
                '   </div>' +
                '   <div class="customs-settings collapsible-body">' +
                        $('script[data-template-name="' + adapter + '"]').html() +
                '   </div>' +
                '</li>';

            var $tab = $(tab);
            this.defaults[adapter] = {};
            // set values
            $tab.find('input, select').each(function() {
                var $this = $(this);
                $this.attr('data-instance', adapter + '.' + instance);
                var field = $this.attr('data-field');
                var def   = $this.attr('data-default');
                if (def === 'true')  def = true;
                if (def === 'false') def = false;
                if (def !== undefined && def.toString().replace(/\+/, '') === parseFloat(def).toString()) {
                    def = parseFloat(def);
                }

                that.defaults[adapter][field] = def;
                if (field === 'enabled') {
                    $this.on('click', function (event) {
                        event.stopPropagation();
                        if ($(this).prop('checked')) {

                        } else {

                        }
                    });
                }
            });

            $customTabs.append($tab);
            // post init => add custom logic
            if (customPostInits.hasOwnProperty(adapter) && typeof customPostInits[adapter] === 'function') {
                customPostInits[adapter]($tab, commons[adapter + '.' + instance], that.main.objects['system.adapter.' + adapter + '.' + instance], type, role);
            }
        }

        // set values
        $customTabs.find('input, select').each(function() {
            var $this    = $(this);
            var instance = $this.data('instance');
            var adapter  = instance.split('.')[0];
            var attr     = $this.data('field');

            if (commons[instance][attr] !== undefined) {
                if ($this.attr('type') === 'checkbox') {
                    if (commons[instance][attr] === STR_DIFFERENT) {
                        /*$('<select data-field="' + attr + '" data-instance="' + instance + '">\n' +
                         '   <option value="' + wordDifferent + '" selected>' + wordDifferent + '</option>\n' +
                         '   <option value="false">' + _('false') + '</option>\n' +
                         '   <option value="true">'  + _('true')  + '</option>\n' +
                         '</select>').insertBefore($this);
                         $this.hide().attr('data-field', '').data('field', '');*/
                        $this[0].indeterminate = true;
                    } else {
                        $this.prop('checked', commons[instance][attr]);
                    }
                } else {
                    if (commons[instance][attr] === STR_DIFFERENT) {
                        if ($this.attr('type') === 'number') {
                            $this.attr('type', 'text');
                        }
                        if ($this.prop('tagName').toUpperCase() === 'SELECT'){
                            $this.prepend('<option value="' + wordDifferent + '">' + wordDifferent + '</option>');
                            $this.val(wordDifferent);
                        } else {
                            $this.val('').attr('placeholder', wordDifferent);
                        }
                    } else {
                        $this.val(commons[instance][attr]);
                    }
                }
            } else {
                var def;
                if (that.defaults[adapter] && that.defaults[adapter][attr] !== undefined) {
                    def = that.defaults[adapter][attr];
                }
                if (def !== undefined) {
                    if ($this.attr('type') === 'checkbox') {
                        $this.prop('checked', def);
                    } else {
                        $this.val(def);
                    }
                }
            }

            if ($this.attr('type') === 'checkbox') {
                $this.on('change', function () {
                    that.$dialog.find('.dialog-system-buttons .btn-save').removeClass('disabled');
                    if ($(this).data('field') === 'enabled') {
                        var instance = $this.data('instance');
                        var $headerActive = $customTabs.find('.activated[data-adapter="' + instance + '"]');
                        if ($(this).prop('checked')) {
                            $headerActive.css('opacity', 1);
                        } else {
                            $headerActive.css('opacity', 0);
                        }
                    }
                });
            } else {
                $this.on('change', function () {
                    that.$dialog.find('.dialog-system-buttons .btn-save').removeClass('disabled');
                }).on('keyup', function () {
                    $(this).trigger('change');
                });
            }
        });

        this.showCustomsData(ids.length > 1 ? null : ids[0]);
        this.$dialog.find('.dialog-system-buttons .btn-save').addClass('disabled');
        translateAll('#dialog-customs');
        var $collapsible = that.$dialog.find('.collapsible');
        $collapsible.collapsible({
            onOpenEnd: function (el) {
                // store settings
                var _collapsed = that.main.config['object-customs-collapsed'];
                _collapsed = _collapsed ? _collapsed.split(',') : [];
                var id = $(el).data('adapter');
                var pos = _collapsed.indexOf(id);
                if (pos !== -1) _collapsed.splice(pos, 1);
                that.main.saveConfig('object-customs-collapsed', _collapsed.join(','));
            },
            onCloseEnd: function (el) {
                // store settings
                var _collapsed = that.main.config['object-customs-collapsed'];
                _collapsed = _collapsed ? _collapsed.split(',') : [];
                var id = $(el).data('adapter');
                var pos = _collapsed.indexOf(id);
                if (pos === -1) _collapsed.push(id);
                that.main.saveConfig('object-customs-collapsed', _collapsed.join(','));
            }
        });

        that.$dialog.find('input[type="checkbox"]+span').off('click').on('click', function () {
            var $input = $(this).prev();//.addClass('filled-in');
            if (!$input.prop('disabled')) {
                if ($input[0].indeterminate) {
                    $input[0].indeterminate = false;
                    $input.prop('checked', true).trigger('change');
                } else {
                    $input.prop('checked', !$input.prop('checked')).trigger('change');
                }
            }
        });
        $customTabs.find('select').select();
        M.updateTextFields('#dialog-customs');

        this.resizeHistory();
    };

    function installColResize() {
        if (!$.fn.colResizable) return;
        if ($outer.is(':visible')) {
            if (!$outer.data('inited')) {
                hdr = new IobListHeader('grid-history-header', {list: $outer, colWidthOffset: 1, prefix: 'log-filter'});

                // todo define somehow the width of every column
                hdr.add('text', 'val');
                hdr.add('text', 'ack');
                hdr.add('text', 'from');
                hdr.add('text', 'ts');
                hdr.add('text', 'lc');
            }

            // Fix somehow, that columns have different widths
            $outer.colResizable({
                liveDrag: true,

                partialRefresh: true,
                marginLeft: 5,
                postbackSafe:true,

                onResize: function (event) {
                    return hdr.syncHeader();
                }
            });

            hdr.syncHeader();
        } else {
            setTimeout(function () {
                installColResize();
            }, 200)
        }
    }

    function updateTable(delay) {
        // Load data again from adapter
        if (delay) {
            if (that.historyTimeout) {
                clearTimeout(that.historyTimeout)
            }
        } else if (that.historyTimeout) {
            return;
        }

        that.historyTimeout = setTimeout(function () {
            that.historyTimeout = null;
            if ($historyTableInstance) {
                that.loadHistoryTable($historyTableInstance.data('id'), true);
            }
        }, delay || 5000);
    }

    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    this.loadHistoryTable = function (id, isSilent, isDownload) {
        $outer    = $outer || that.$dialog.find('#grid-history');
        $table    = $table || that.$dialog.find('#grid-history-body');

        if (!isSilent) {
            $table.html('<tr><td colspan="5" style="text-align: center">' + _('Loading...') + '</td></tr>');
        }

        var request = {
            aggregate: 'none',
            instance:   $historyTableInstance.val(),
            from:       true,
            ack:        true,
            q:          true
        };

        if (!$tableDateFrom) {
            $tableDateFrom = this.$dialog.find('#tab-customs-table .datepicker.date-from');
            $tableDateTo   = this.$dialog.find('#tab-customs-table .datepicker.date-to');
            $tableTimeFrom = this.$dialog.find('#tab-customs-table .timepicker.time-from');
            $tableTimeTo   = this.$dialog.find('#tab-customs-table .timepicker.time-to');
        }

        var dateFrom = $tableDateFrom.val() ? M.Datepicker.getInstance($tableDateFrom).toString('yyyy.mm.dd') : '';
        var timeFrom = $tableTimeFrom.val();
        var dateTo   = $tableDateTo.val() ? M.Datepicker.getInstance($tableDateTo).toString('yyyy.mm.dd') : '';
        var timeTo   = $tableTimeTo.val();
        var empty = true;
        if (dateTo) {
            dateTo = new Date(dateTo);
            empty = false;
            dateTo.setHours(23);
            dateTo.setMinutes(59);
            dateTo.setSeconds(59);
            dateTo.setMilliseconds(999);
        } else {
            dateTo = new Date();
        }
        if (timeTo) {
            var parts = timeTo.split(':');
            dateTo.setHours(parts[0]);
            dateTo.setMinutes(parts[1]);
            dateTo.setSeconds(59);
            dateTo.setMilliseconds(999);
            empty = false;
        }
        dateTo = dateTo.getTime();
        if (empty) dateTo += 10000;
        request.end = dateTo;

        if (dateFrom || timeFrom) {
            dateFrom = new Date(dateFrom || dateTo);
            if (timeFrom) {
                var part__ = timeFrom.split(':');
                dateFrom.setHours(part__[0]);
                dateFrom.setMinutes(part__[1]);
            } else {
                dateFrom.setHours(0);
                dateFrom.setMinutes(0);
            }
            dateFrom.setSeconds(0);
            dateFrom.setMilliseconds(0);
            request.start = dateFrom.getTime();
        } else {
            request.count = 50;
        }
        var fileName;
        if (isDownload) {
            fileName = new Date(dateTo).toISOString() + '_' + (request.start ? new Date(request.start) : request.count + 'points') + '_' + id + '__' + request.instance + '.csv';
        }


        main.socket.emit('getHistory', id, request, function (err, res) {
            setTimeout(function () {
                var csv = 'value;acknowledged;from;timestamp;lastchanged;\n';
                if (!err) {
                    var text = '';
                    if (res && res.length) {
                        for (var i = res.length - 1; i >= 0; i--) {
                            var from = (res[i].from || '').replace('system.adapter.', '').replace('system.', '');
                            text += '<tr class="' + (res[i].ts > lastHistoryTimeStamp ? 'highlight' : '') + '">' +
                                '   <td>' + res[i].val  + '</td>' +
                                '   <td>' + res[i].ack  + '</td>' +
                                '   <td>' + from + '</td>' +
                                '   <td>' + main.formatDate(res[i].ts) + '</td>' +
                                '   <td>' + main.formatDate(res[i].lc) + '</td>' +
                                '</tr>\n';

                            if (isDownload) {
                                csv += res[i].val + ';' + res[i].ack + ';' + (from || '') + ';' + (res[i].ts ? new Date(res[i].ts).toISOString() : '') + ';' + (res[i].lc ? new Date(res[i].lc).toISOString() : '') + ';\n';
                            }
                        }
                        lastHistoryTimeStamp = res[res.length - 1].ts;
                    } else {
                        text = '<tr><td colspan="5" style="text-align: center">' + _('No data') + '</td></tr>'
                    }
                    $table.html(text);
                } else {
                    console.error(err);
                    $table.html('<tr><td colspan="5" style="text-align: center" class="error">' + err + '</td></tr>');
                }
                installColResize();
                if (isDownload) {
                    download(fileName, csv);
                }
            }, 0);
        });
    };

    this.loadHistoryChart = function (id) {
        if (!$chartDateFrom) {
            $chartDateFrom = this.$dialog.find('#tab-customs-chart .datepicker.date-from');
            $chartDateTo   = this.$dialog.find('#tab-customs-chart .datepicker.date-to');
        }

        if (id) {
            var port = 0;
            var chart = false;
            var isSecure = false;
            for (var i = 0; i < this.main.instances.length; i++) {
                if (this.main.objects[main.instances[i]].common.name === 'flot' && this.main.objects[this.main.instances[i]].common.enabled) {
                    chart = 'flot';
                } else
                if (!chart && this.main.objects[main.instances[i]].common.name === 'rickshaw' && this.main.objects[this.main.instances[i]].common.enabled) {
                    chart = 'rickshaw';
                } else
                if (this.main.objects[this.main.instances[i]].common.name === 'web' && this.main.objects[this.main.instances[i]].common.enabled) {
                    port = this.main.objects[this.main.instances[i]].native.port;
                    isSecure = this.main.objects[this.main.instances[i]].native.secure;
                }
                if (chart === 'flot' && port) break;
            }
            var $chart = this.$dialog.find('#iframe-history-chart');

            var linkTemplate = 'http{isSecure}://{hostname}:{port}/{chart}/index.html?range=1440&zoom=true&axeX=lines&axeY=inside&hoverDetail=true&aggregate=onchange&chartType=step&live=30&instance={instance}&l%5B0%5D%5Bid%5D={id}&l%5B0%5D%5Boffset%5D=0&l%5B0%5D%5Baggregate%5D=minmax&l%5B0%5D%5Bcolor%5D=%231868a8&l%5B0%5D%5Bthickness%5D=1&l%5B0%5D%5Bshadowsize%5D=1&l%5B0%5D%5Bsmoothing%5D=0&l%5B0%5D%5BafterComma%5D=0&l%5B0%5D%5BignoreNull%5D=false&aggregateType=step&aggregateSpan=300&relativeEnd=now&timeType=relative&noBorder=noborder&bg=rgba(0%2C0%2C0%2C0)&timeFormat=%25H%3A%25M&useComma={comma}&noedit=false&animation=0';
            linkTemplate = linkTemplate.replace('{isSecure}',   (isSecure ? 's' : ''));
            linkTemplate = linkTemplate.replace('{hostname}',   location.hostname);
            linkTemplate = linkTemplate.replace('{port}',       port);
            linkTemplate = linkTemplate.replace('{chart}',      chart);
            linkTemplate = linkTemplate.replace('{instance}',   that.$dialog.find('#tab-customs-chart .select-instance').val());
            linkTemplate = linkTemplate.replace('{id}',         encodeURI(id));
            linkTemplate = linkTemplate.replace('{comma}',      that.main.systemConfig && that.main.systemConfig.common && that.main.systemConfig.isFloatComma);

            // find out
            $chart.attr('src', linkTemplate);//'http' + (isSecure ? 's' : '') + '://' + location.hostname + ':' + port + '/' + chart + '/index.html?range=1440&zoom=true&axeX=lines&axeY=inside&_ids=' + encodeURI(id) + '&width=' + ($chart.width() - 50) + '&hoverDetail=true&height=' + ($chart.height() - 50) + '&aggregate=onchange&chartType=step&live=30&instance=' + that.$dialog.find('#tab-customs-chart .select-instance').val());
        } else {
            this.$dialog.find('#iframe-history-chart').attr('src', '');
        }
    };

    this.showCustomsData = function (id) {
        var $tabs = this.$dialog.find('#tabs-customs');

        var port  = 0;
        var chart = false;

        initTab('tab-customs-settings');

        if (id) {
            $tabs.data('id', id);

            // Check if chart enabled and set
            for (var i = 0; i < main.instances.length; i++) {
                if (main.objects[main.instances[i]].common.name === 'flot' && main.objects[main.instances[i]].common.enabled) {
                    chart = 'flot';
                } else
                if (!chart && main.objects[main.instances[i]].common.name === 'rickshaw' && main.objects[main.instances[i]].common.enabled) {
                    chart = 'rickshaw';
                } else
                if (main.objects[main.instances[i]].common.name === 'web'  && main.objects[main.instances[i]].common.enabled) {
                    port = main.objects[main.instances[i]].native.port;
                }
                if (chart === 'flot' && port) break;
            }
            that.loadHistoryTable(id);

            $tabs.find('.tabs .tab-table').removeClass('disabled');

            if (port && chart && that.currentCustoms) {
                $tabs.find('.tabs .tab-chart').removeClass('disabled');
            } else {
                $tabs.find('.tabs .tab-chart').addClass('disabled');
            }
        } else {
            $tabs.find('.tabs .tab-table').addClass('disabled');
            $tabs.find('.tabs .tab-chart').addClass('disabled');
        }
    };

    function getCustomTemplate(adapter, callback) {
        $.ajax({
            headers: {
                Accept: 'text/html'
            },
            cache: true,
            url:   '/adapter/' + adapter + '/custom_m.html',
            success: function (_data) {
                callback(null, _data);
            },
            error: function (jqXHR) {
                // todo: remove some days 2017.12.19 (for admin2)
                $.ajax({
                    headers: {
                        Accept: 'text/html'
                    },
                    cache: true,
                    url:   '/adapter/' + adapter + '/custom.html',
                    success: function (_data) {
                        callback(null, _data);
                    },
                    error: function (jqXHR) {
                        callback(jqXHR.responseText);
                    }
                });
            }
        });
    }

    // Set modified custom states
    this.setCustoms = function (ids, callback) {
        var id = ids.pop();
        if (id) {
            this.$dialog.find('#tab-customs-settings .title').html(_('Adapter settings for %s states', ids.length));

            that.main.socket.emit('setObject', id, this.main.objects[id], function (err) {
                if (err) {
                    that.main.showMessage(_(err), _('Error'), 'error_outline');
                } else {
                    setTimeout(function () {
                        that.setCustoms(ids, callback);
                    }, 50);
                }
            });
        } else {
            if (callback) callback();
        }
    };

    this.resizeHistory = function () {
        // resize only if chart is visible
        var $iFrame = this.$dialog.find('#iframe-history-chart');
        if ($iFrame.attr('src')) {
            var timeout = $iFrame.data('timeout');
            if (timeout) clearTimeout(timeout);

            $iFrame.data('timeout', setTimeout(function () {
                that.$dialog.find('#iframe-history-chart').data('timeout', null);
                that.loadHistoryChart(that.$dialog.find('#tabs-customs').data('id')); // reinit iframe
            }, 1000));
        }
    };

    function onButtonSave(e) {
        e.stopPropagation();
        e.preventDefault();

        var $tabs = that.$dialog.find('#customs-tabs');
        var ids = $tabs.data('ids');

        // do not update charts
        that.currentCustoms = null;
        var wordDifferent = _(STR_DIFFERENT);

        // collect default values
        var $inputs = $tabs.find('input, select');

        //that.historyIds = ids;
        $inputs.each(function () {
            var instance = $(this).data('instance');
            var field    = $(this).data('field');
            if (!field) return;

            var val;
            if ($(this).attr('type') === 'checkbox') {
                if (this.indeterminate) return;
                val = $(this).prop('checked');
            } else {
                val = $(this).val();
            }
            // if not changed
            if (val === wordDifferent) return;

            if (val === null) val = '';
            if (val === undefined) val = '';
            if (val === 'false') val = false;
            if (val === 'true')  val = true;
            var f = parseFloat(val);
            // replace trailing 0 and prefix +
            if (val.toString().replace(/^\+/, '').replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1') === f.toString()) {
                val = f;
            }

            for (var i = 0; i < ids.length; i++) {
                var custom = that.main.objects[ids[i]].common.custom;
                custom = that.main.objects[ids[i]].common.custom = custom || {};

                if (custom[instance] === undefined) {
                    var adapter = instance.split('.')[0];
                    var _default;
                    // Try to get default values
                    if (defaults[adapter]) {
                        if (typeof defaults[adapter] === 'function') {
                            _default = defaults[adapter](that.main.objects[ids[i]], that.main.objects['system.adapter.' + instance]);
                        } else {
                            _default = defaults[adapter];
                        }
                    } else {
                        _default = that.defaults[adapter];
                    }
                    custom[instance] = _default || {};
                }
                custom[instance][field] = val;
            }
        });


        if (ids) {
            that.$dialog.find('.dialog-system-buttons .btn-save').addClass('disabled');

            for (var i = 0; i < ids.length; i++) {
                var found = false;
                var custom_ = that.main.objects[ids[i]].common.custom;
                for (var inst in custom_) {
                    if (!custom_.hasOwnProperty(inst)) continue;
                    if (!custom_[inst].enabled) {
                        delete custom_[inst];
                    } else {
                        found = true;
                    }
                }
                if (!found) {
                    that.main.objects[ids[i]].common.custom = null;
                }
            }
            that.setCustoms(ids, function () {
                // disable iframe
                that.loadHistoryChart(); // disable iframe
                that.main.navigate();
            });
        }

    }

    // return true if all data are stored
    this.allStored = function () {
        return that.$dialog.find('.dialog-system-buttons .btn-save').hasClass('disabled');
    };

    function initTab(id) {
        switch (id) {
            case 'tab-customs-settings':
                that.loadHistoryChart(); // disable iframe
                break;

            case 'tab-customs-table':
                $historyTableInstance.select();
                that.loadHistoryChart(); // disable iframe
                break;

            case 'tab-customs-chart':
                that.$dialog.find('#tab-customs-chart .select-instance').select();
                var $tabs = that.$dialog.find('#tabs-customs');
                that.loadHistoryChart($tabs.data('id')); // init iframe
                break;
        }
    }

    this.init = function () {
        if (this.inited) {
            return;
        }
        this.inited = true;

        var ids = this.main.navigateGetParams();

        if (ids) {
            ids = ids.split(',');
        }
        // if the list of IDs is too long, it was saved into this.ids
        if (!ids || !ids.length) {
            ids = this.ids;
            this.ids = undefined;
        }
        var instances = [];

        // clear global defaults object
        this.defaults = {};

        // collect all custom instances
        var count = 0;
        var data = '';
        var urls = [];
        for (var u = 0; u < this.main.instances.length; u++) {
            var inst = this.main.objects[this.main.instances[u]];
            if (inst && inst.common && (inst.common.type === 'storage' || inst.common.supportCustoms)) {
                instances.push(this.main.instances[u]);
                var url = this.main.instances[u].split('.');
                if (urls.indexOf(url[2]) === -1) {
                    urls.push(url[2]);
                    count++;
                    getCustomTemplate(url[2], function (err, result) {
                        if (err) console.error(err);
                        if (result) data += result;
                        if (!--count) {
                            that.$dialog.find('#customs-templates').html(data);
                            that.initCustomsTabs(ids, instances);
                        }
                    });
                }
            }
        }
        var _instances = [];
        if (ids) {
            for (var i = ids.length - 1; i >= 0; i--) {
                if (!this.main.objects[ids[i]]) {
                    console.warn('Null object: ' + ids[i]);
                    ids.splice(i, 1);
                } else {
                    var custom = this.main.objects[ids[i]].common.custom;
                    if (custom) {
                        var found = false;
                        // delete disabled entries
                        for (var h in custom) {
                            if (!custom.hasOwnProperty(h)) continue;
                            if (custom[h].enabled === false) {
                                delete custom[h];
                            } else {
                                if (ids.length === 1) _instances.push(h);
                                found = true;
                            }
                        }
                        if (!found) {
                            delete this.main.objects[ids[i]].common.custom;
                        }
                    }
                }
            }
        }

        var title;
        $historyTableInstance    = this.$dialog.find('#tab-customs-table .select-instance');
        $historyChartInstance    = this.$dialog.find('#tab-customs-chart .select-instance');
        var $historyTableInstanceBtn = this.$dialog.find('#tab-customs-table .refresh');
        var $historyTableDownloadBtn = this.$dialog.find('#tab-customs-table .download');
        var $historyChartInstanceBtn = this.$dialog.find('#tab-customs-chart .refresh');

        if (ids && ids.length === 1) {
            title = _('Storage of %s', ids[0]);
            this.currentCustoms = _instances.length ? ids[0] : null;
            var text = '';
            for (var k = 0; k < _instances.length; k++) {
                var insta = this.main.objects['system.adapter.' + _instances[k]];
                if (insta && insta.common && (insta.common.enabled ||
                    (this.main.states['system.adapter.' + _instances[k] + '.alive'] && this.main.states['system.adapter.' + _instances[k] + '.alive'].val))) {
                    text += '<option value="' + _instances[k] + '" ' + (!k ? 'selected' : '') + ' >' + _instances[k] + '</option>\n';
                }
            }
            if (text) {
                $historyTableInstance
                    .data('id', ids[0])
                    .html(text)
                    .show()
                    .off('change')
                    .on('change', function () {
                        that.main.saveConfig('object-history-table', $historyTableInstance.val());
                        that.loadHistoryTable($(this).data('id'));
                    }).select();

                $historyChartInstance
                    .data('id', ids[0])
                    .html(text)
                    .show()
                    .off('change')
                    .on('change', function () {
                        that.main.saveConfig('object-history-chart', $historyChartInstance.val());
                        that.loadHistoryChart($(this).data('id')); // reinit iframe
                    }).select();

                if (this.main.config['object-history-table'] !== undefined) {
                    $historyTableInstance.val(this.main.config['object-history-table'])
                }
                if (this.main.config['object-history-chart'] !== undefined) {
                    $historyChartInstance.val(this.main.config['object-history-chart'])
                }
                $historyTableInstanceBtn
                    .data('id', ids[0])
                    .show()
                    .off('click')
                    .on('click', function () {
                        that.$dialog.find('#grid-history-body').html('');
                        that.loadHistoryTable($(this).data('id'));
                    });
                $historyChartInstanceBtn
                    .data('id', ids[0])
                    .show()
                    .off('click').on('click', function () {
                        that.loadHistoryChart($(this).data('id')); // reinit iframe
                    });

                $historyTableDownloadBtn
                    .data('id', ids[0])
                    .show()
                    .off('click')
                    .on('click', function () {
                        that.loadHistoryTable($(this).data('id'), false, true);
                    });

                var yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                var i18n = {
                    today: _('Today'),
                    clear: _('Clear'),
                    done: _('Ok'),
                    months        : [_('January'),_('February'),_('March'),_('April'),_('May'),_('June'),_('July'),_('August'),_('September'),_('October'),_('November'),_('December')],
                    monthsShort   : [_('Jan'),_('Feb'),_('Mar'),_('Apr'),_('May'),_('Jun'),_('Jul'),_('Aug'),_('Sep'),_('Oct'),_('Nov'),_('Dec')],
                    weekdaysShort : [_('Sun'),_('Mon'),_('Tue'),_('Wed'),_('Thu'),_('Fri'),_('Sat')],
                    weekdays      : [_('Sunday'),_('Monday'),_('Tuesday'),_('Wednesday'),_('Thursday'),_('Friday'),_('Saturday')],
                    weekdaysAbbrev : ['S','M','T','W','T','F','S']
                };
                for (var n = 0; n < i18n.weekdaysAbbrev.length; n++) {
                    i18n.weekdaysAbbrev[n] = i18n.weekdaysShort[n][0];
                }
                if (!$tableDateFrom) {
                    $tableDateFrom = this.$dialog.find('#tab-customs-table .datepicker.date-from');
                    $tableDateTo   = this.$dialog.find('#tab-customs-table .datepicker.date-to');
                    $tableTimeFrom = this.$dialog.find('#tab-customs-table .timepicker.time-from');
                    $tableTimeTo   = this.$dialog.find('#tab-customs-table .timepicker.time-to');

                    $chartDateFrom = this.$dialog.find('#tab-customs-chart .datepicker.date-from');
                    $chartDateTo   = this.$dialog.find('#tab-customs-chart .datepicker.date-to');
                }

                $tableDateFrom.datepicker({
                    defaultDate: yesterday,
                    showDaysInNextAndPreviousMonths: true,
                    minYear: 2014,
                    maxYear: 2032,
                    i18n: i18n,
                    setDefaultDate: true,
                    firstDay: 1,
                    onSelect: function (date) {
                        $tableDateFrom.datepicker('setInputValue');
                        $tableDateFrom.datepicker('close');
                    }
                });
                $tableDateFrom.on('change', function () {
                    updateTable(1000);
                });

                $tableTimeFrom.timepicker({
                    defaultTime: '00:00',
                    twelveHour: false, // TODO
                    doneText: _('Ok'),
                    clearText: _('Clear'),
                    cancelText: _('Cancel'),
                    autoClose: true
                });
                $tableTimeFrom.on('change', function () {
                    updateTable(1000);
                });

                $tableTimeTo.timepicker({
                    defaultTime: 'now',
                    twelveHour: false, // TODO
                    doneText: _('Ok'),
                    clearText: _('Clear'),
                    cancelText: _('Cancel'),
                    autoClose: true
                });
                $tableTimeTo.on('change', function () {
                    updateTable(1000);
                });

                $tableDateTo.datepicker({
                    defaultDate: new Date(),
                    showDaysInNextAndPreviousMonths: true,
                    minYear: 2014,
                    maxYear: 2032,
                    i18n: i18n,
                    setDefaultDate: true,
                    firstDay: 1,
                    onSelect: function (date) {
                        $tableDateTo.datepicker('setInputValue');
                        $tableDateTo.datepicker('close');
                    }
                });
                $tableDateTo.on('change', function () {
                    updateTable(1000);
                });


                $chartDateFrom.datepicker({
                    defaultDate: yesterday,
                    showDaysInNextAndPreviousMonths: true,
                    minYear: 2014,
                    maxYear: 2032,
                    i18n: i18n,
                    setDefaultDate: true,
                    firstDay: 1,
                    onSelect: function (date) {
                        $chartDateFrom.datepicker('setInputValue');
                        $chartDateFrom.datepicker('close');
                    }
                });
                $chartDateFrom.on('change', function () {
                    that.loadHistoryChart($historyChartInstance.data('id'));
                });
                $chartDateTo.datepicker({
                    defaultDate: new Date(),
                    showDaysInNextAndPreviousMonths: true,
                    minYear: 2014,
                    maxYear: 2032,
                    i18n: i18n,
                    setDefaultDate: true,
                    firstDay: 1,
                    onSelect: function (date) {
                        $chartDateTo.datepicker('setInputValue');
                        $chartDateTo.datepicker('close');
                    }
                });
                $chartDateTo.on('change', function () {
                    that.loadHistoryChart($historyChartInstance.data('id'));
                });
            } else {
                $historyTableInstance.hide();
                $historyChartInstance.hide();
                $historyTableInstanceBtn.hide();
                $historyChartInstanceBtn.hide();
                $historyTableDownloadBtn.hide();
            }
            if (this.currentCustoms) {
                that.main.subscribeStates(this.currentCustoms);
            }
            this.$dialog.find('#tab-customs-table .title').html(_('Values of %s', ids[0]));
            this.$dialog.find('#tab-customs-chart .title').html(_('Chart for %s', ids[0]));

        } else if (ids) {
            $historyTableInstance.hide();
            $historyChartInstance.hide();
            $historyTableInstanceBtn.hide();
            $historyChartInstanceBtn.hide();
            $historyTableDownloadBtn.hide();
            title = _('Storage of %s states', ids.length);
            this.currentCustoms = null;
        }

        this.$dialog.find('#tab-customs-settings .title').html(title);

        var $tabs = this.$dialog.find('#tabs-customs');
        $tabs.find('.tabs').mtabs({
            onShow: function (tab)  {
                if (!tab) return;
                initTab($(tab).attr('id'));
            }
        });
        this.$dialog.find('#customs-tabs').data('ids', ids);
        that.$dialog.find('.dialog-system-buttons .btn-save').off('click').on('click', onButtonSave);
        that.$dialog.find('.dialog-system-buttons .btn-cancel').off('click').on('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            if (!that.$dialog.find('.dialog-system-buttons .btn-save').hasClass('disabled')) {
                that.main.confirmMessage(_('Are you sure? Changes are not saved.'), _('Please confirm'), 'error_outline', function (result) {
                    if (result) {
                        // disable iframe
                        that.loadHistoryChart();
                        that.main.navigate();
                    }
                });
            } else {
                // disable iframe
                that.loadHistoryChart();
                that.main.navigate();
            }
        });
    };

    this.destroy = function () {
        if (this.inited) {
            this.$dialog.find('.collapsible').collapsible('destroy');
            this.inited = false;
            // disable iframe
            this.loadHistoryChart();
            if (this.currentCustoms) {
                that.main.unsubscribeStates(this.currentCustoms);
            }
        }
    };

    return this;
}
