function Customs(main) {
    'use strict';

    var that            = this;
    this.main           = main;
    this.$dialog        = $('#dialog-customs');
    this.customEnabled  = null;
    this.currentCustoms = null; // Id of the currently shown customs dialog

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
            // Load data again from adapter
            if (this.historyTimeout) return;

            this.historyTimeout = setTimeout(function () {
                that.historyTimeout = null;
                that.loadHistoryTable(that.$dialog.find('#history-table-instance').data('id'), true);
            }, 5000);
        }
    };

    this.initCustomsTabs = function (ids, instances) {
        var $customTabs = this.$dialog.find('#customs-tabs');
        $customTabs.html('');
        var wordDifferent = _('__different__');
        this.defaults = {};
        var collapsed = this.main.config['object-customs-collapsed'];
        collapsed = collapsed ? collapsed.split(',') : [];

                var commons = {};
        // calculate common settings
        for (var i = 0; i < instances.length; i++) {
            var inst = instances[i].replace('system.adapter.', '');
            commons[inst] = {};
            for (var id = 0; id < ids.length; id++) {
                var custom = main.objects[ids[id]].common.custom;
                // convert old structure
                // TODO: remove some day (08.2016)
                if (custom && custom.enabled !== undefined) {
                    custom = main.objects[ids[id]].common.custom = custom.enabled ? {'history.0': custom} : {};
                }
                var sett = custom ? custom[inst] : null;

                if (sett) {
                    for (var _attr in sett) {
                        if (!sett.hasOwnProperty(_attr)) continue;
                        if (commons[inst][_attr] === undefined) {
                            commons[inst][_attr] = sett[_attr];
                        } else if (commons[inst][_attr] !== sett[_attr]) {
                            commons[inst][_attr] = '__different__';
                        }
                    }
                } else {
                    var a = inst.split('.')[0];
                    var _default = null;
                    // Try to get default values
                    if (typeof that.defaults[a] === 'function') {
                        _default = that.defaults[a](that.main.objects[ids[id]], that.main.objects['system.adapter.' + inst]);
                    } else {
                        _default = this.defaults[a];
                    }

                    for (var attr in _default) {
                        if (!_default.hasOwnProperty(attr)) continue;
                        if (commons[inst][attr] === undefined) {
                            commons[inst][attr] = _default[attr];
                        } else if (commons[inst][attr] !== _default[attr]) {
                            commons[inst][attr] = '__different__';
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
            img = '/adapter/' + adapter + '/' +img;
            var tab =
                '<li data-adapter="' + data + '" class="' + (collapsed.indexOf(data) === -1 ? 'active' : '') + '">' +
                '   <div class="collapsible-header">' +
                '       <img src="' + img + '" />' + _('Settings for %s', data) +
                '       <span class="activated" data-adapter="' + data + '" style="' + (!commons[data] || commons[data] === false ? 'display: none' : '') + '">' + _('active') + '</span>' +
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
                    $this.click(function (event) {
                        event.stopPropagation();
                        if ($(this).prop('checked')) {

                        } else {

                        }
                    });
                }
            });
            $customTabs.append($tab);
        }

        // set values
        $customTabs.find('input, select').each(function() {
            var $this    = $(this);
            var instance = $this.data('instance');
            var adapter  = instance.split('.')[0];
            var attr     = $this.data('field');

            if (commons[instance][attr] !== undefined) {
                if ($this.attr('type') === 'checkbox') {
                    if (commons[instance][attr] === '__different__') {
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
                    if (commons[instance][attr] === '__different__') {
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
                $this.change(function () {
                    that.$dialog.find('.dialog-system-buttons .btn-save').removeClass('disabled');
                    if ($(this).data('field') === 'enabled') {
                        var instance = $this.data('instance');
                        var $headerActive = $customTabs.find('.activated[data-adapter="' + instance + '"]');
                        if ($(this).prop('checked')) {
                            $headerActive.show();
                        } else {
                            $headerActive.hide();
                        }
                    }
                });
            } else {
                $this.change(function () {
                    that.$dialog.find('.dialog-system-buttons .btn-save').removeClass('disabled');
                }).keyup(function () {
                    $(this).trigger('change');
                });
            }
        });

        this.showCustomsData(ids.length > 1 ? null : ids[0]);
        this.$dialog.find('.dialog-system-buttons .btn-save').addClass('disabled');
        translateAll();
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
        that.$dialog.find('input[type="checkbox"]+span').unbind('click').click(function () {
            var $input = $(this).prev();//.addClass('filled-in');
            if (!$input.prop('disabled')) {
                $input.prop('checked', !$input.prop('checked')).trigger('change');
            }
        });
        that.$dialog.find('select').select();

/*
        $collapsible.find('li').each(function (i) {
            var id = $(this).data('adapter');
            if (collapsed.indexOf(id) === -1) {
                $collapsible.collapsible('open', i);
            }
        });*/

        this.resizeHistory();
    };

    this.loadHistoryTable = function (id, isSilent) {
        var end = (new Date()).getTime() + 10000; // now
        if (!isSilent) {
            this.$dialog.find('#grid-history-body').html('<tr><td colspan="5" style="text-align: center">' + _('Loading...') + '</td></tr>');
        }

        main.socket.emit('getHistory', id, {
            end:        end,
            count:      50,
            aggregate: 'none',
            instance:   this.$dialog.find('#history-table-instance').val(),
            from:       true,
            ack:        true,
            q:          true
        }, function (err, res) {
            setTimeout(function () {
                if (!err) {
                    var text = '';
                    if (res && res.length) {
                        for (var i = res.length - 1; i >= 0; i--) {
                            text += '<tr class="grid-history-' + ((i % 2) ? 'odd' : 'even') + '">' +
                                '<td>' + res[i].val  + '</td>' +
                                '<td>' + res[i].ack  + '</td>' +
                                '<td>' + (res[i].from || '').replace('system.adapter.', '').replace('system.', '') + '</td>' +
                                '<td>' + main.formatDate(res[i].ts) + '</td>' +
                                '<td>' + main.formatDate(res[i].lc) + '</td>' +
                                '</tr>\n'
                        }
                    } else {
                        text = '<tr><td colspan="5" style="text-align: center">' + _('No data') + '</td></tr>'
                    }
                    that.$dialog.find('#grid-history-body').html(text)
                        .data('odd', true);
                } else {
                    console.error(err);
                    that.$dialog.find('#grid-history-body').html('<tr><td colspan="5" style="text-align: center" class="error">' + err + '</td></tr>');
                }
            }, 0);
        });
    };

    this.loadHistoryChart = function (id) {
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

            // find out
            $chart.attr('src', 'http' + (isSecure ? 's' : '') + '://' + location.hostname + ':' + port + '/' + chart + '/index.html?range=1440&zoom=true&axeX=lines&axeY=inside&_ids=' + encodeURI(id) + '&width=' + ($chart.width() - 50) + '&hoverDetail=true&height=' + ($chart.height() - 50) + '&aggregate=onchange&chartType=step&live=30&instance=' + $('#history-chart-instance').val());
        } else {
            this.$dialog.find('#iframe-history-chart').attr('src', '');
        }
    };

    this.showCustomsData = function (id) {
        var $tabs = this.$dialog.find('#tabs-customs');

        var port  = 0;
        var chart = false;
        $tabs.find('.tabs').mtabs('select', 'tab-customs-settings');
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
                if (main.objects[main.instances[i]].common.name === 'web'      && main.objects[main.instances[i]].common.enabled) {
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
                // todo: remove some days 2017.12.19
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
        var $iFrame = this.$dialog.find('#iframe-history-chart');
        var timeout = $iFrame.data('timeout');
        if (timeout) clearTimeout(timeout);

        $iFrame.data('timeout', setTimeout(function () {
            that.loadHistoryChart(that.$dialog.find('#tabs-customs').data('id'));
        }, 1000));
    };

    function onButtonSave(e) {
        e.stopPropagation();
        e.preventDefault();


        var $tabs = that.$dialog.find('#customs-tabs');
        var ids = $tabs.data('ids');

        // do not update charts
        that.currentCustoms = null;
        var wordDifferent = _('__different__');

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
                    if (typeof that.defaults[adapter] === 'function') {
                        _default = that.defaults[adapter](that.main.objects[ids[i]], that.main.objects['system.adapter.' + instance]);
                    } else {
                        _default = that.defaults[adapter];
                    }
                    custom[instance] = _default || {};
                }
                custom[instance][field] = val;
            }
        });

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
            that.loadHistoryChart();
            that.main.hideBuildInWindow();
        });
    }

    this.init = function (ids) {
        if (this.inited) {
            return;
        }
        this.inited = true;

        if (typeof ids !== 'object') {
            ids = [ids];
        }
        var instances = [];

        // clear global defaults object
        that.defaults = {};

        // collect all custom instances
        var count = 0;
        var data = '';
        var urls = [];
        for (var u = 0; u < this.main.instances.length; u++) {
            if (this.main.objects[this.main.instances[u]].common &&
                (this.main.objects[this.main.instances[u]].common.type === 'storage' || this.main.objects[this.main.instances[u]].common.supportCustoms)
            ) {
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
        for (var i = ids.length - 1; i >= 0; i--) {
            if (!this.main.objects[ids[i]]) {
                console.warn('Null object: ' + ids[i]);
                ids.splice(i, 1);
            } else {
                var custom = this.main.objects[ids[i]].common.custom;
                if (custom) {
                    // convert old structure
                    // TODO: TODO: remove some day (08.2016)
                    if (custom.enabled !== undefined) {
                        custom = this.main.objects[ids[i]].common.custom = custom.enabled ? {'history.0': custom} : {};
                    }
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

        var title;
        var $historyTableInstance    = this.$dialog.find('#history-table-instance');
        var $historyChartInstance    = this.$dialog.find('#history-chart-instance');
        var $historyTableInstanceBtn = this.$dialog.find('#history-table-instance-refresh');
        var $historyChartInstanceBtn = this.$dialog.find('#history-chart-instance-refresh');

        if (ids.length === 1) {
            title = _('Storage of %s', ids[0]);
            this.currentCustoms = _instances.length ? ids[0] : null;
            var text = '';
            for (var k = 0; k < _instances.length; k++) {
                if (this.main.objects['system.adapter.' + _instances[k]].common.enabled ||
                    (this.main.states['system.adapter.' + _instances[k] + '.alive'] && this.main.states['system.adapter.' + _instances[k] + '.alive'].val)) {
                    text += '<option value="' + _instances[k] + '" ' + (!k ? 'selected' : '') + ' >' + _instances[k] + '</option>\n';
                }
            }
            if (text) {
                $historyTableInstance
                    .data('id', ids[0])
                    .html(text)
                    .show()
                    .unbind('change').bind('change', function () {
                        that.main.saveConfig('object-history-table', $historyTableInstance.val());
                        that.loadHistoryTable($(this).data('id'));
                    });

                $historyChartInstance
                    .data('id', ids[0])
                    .html(text)
                    .show()
                    .unbind('change')
                    .bind('change', function () {
                        that.main.saveConfig('object-history-chart', $historyChartInstance.val());
                        that.loadHistoryChart($(this).data('id'));
                    });

                if (this.main.config['object-history-table'] !== undefined) {
                    $historyTableInstance.val(this.main.config['object-history-table'])
                }
                if (this.main.config['object-history-chart'] !== undefined) {
                    $historyChartInstance.val(this.main.config['object-history-chart'])
                }
                $historyTableInstanceBtn
                    .button({
                        icons: {primary: 'ui-icon-refresh'},
                        text: false
                    })
                    .css({width: 18, height: 18, 'margin-left': 5})
                    .data('id', ids[0])
                    .show()
                    .unbind('click').bind('click', function () {
                        that.$dialog.find('#grid-history-body').html('');
                        that.loadHistoryTable($(this).data('id'));
                    });
                $historyChartInstanceBtn
                    .button({
                        icons: {primary: 'ui-icon-refresh'},
                        text: false
                    })
                    .css({width: 18, height: 18, 'margin-left': 5})
                    .data('id', ids[0])
                    .show()
                    .unbind('click').bind('click', function () {
                        that.loadHistoryChart($(this).data('id'));
                    });
            } else {
                $historyTableInstance.hide();
                $historyChartInstance.hide();
                $historyTableInstanceBtn.hide();
                $historyChartInstanceBtn.hide();
            }
            if (this.currentCustoms) {
                that.main.subscribeStates(this.currentCustoms);
            }
        } else {
            $historyTableInstance.hide();
            $historyChartInstance.hide();
            $historyTableInstanceBtn.hide();
            $historyChartInstanceBtn.hide();
            title = _('Storage of %s states', ids.length);
            this.currentCustoms = null;
        }

        this.$dialog.find('#tab-customs-settings .title').html(title);

        var $tabs = this.$dialog.find('#tabs-customs');
        $tabs.find('.tabs').mtabs({
            onShow: function (tab)  {
                if (!tab) return;
                var id = $(tab).attr('id');
                switch (id) {
                    case 'tab-customs-table':
                        that.loadHistoryChart();
                        break;

                    case 'tab-customs-chart':
                        that.loadHistoryChart($tabs.data('id'));
                        break;
                }
            }
        });
        this.$dialog.find('#customs-tabs').data('ids', ids);
        this.main.showBuildInWindow(this.$dialog, this);

        that.$dialog.find('.dialog-system-buttons .btn-save').unbind('click').click(onButtonSave);
        that.$dialog.find('.dialog-system-buttons .btn-cancel').unbind('click').click(function (e) {
            e.stopPropagation();
            e.preventDefault();
            if (!that.$dialog.find('.dialog-system-buttons .btn-save').hasClass('disabled')) {
                that.main.confirmMessage(_('Are you sure? Changes are not saved.'), _('Question'), 'error_outline', function (result) {
                    if (result) {
                        // disable iframe
                        that.loadHistoryChart();
                        that.main.hideBuildInWindow();
                    }
                });
            } else {
                // disable iframe
                that.loadHistoryChart();
                that.main.hideBuildInWindow();
            }
        });
    };

    this.destroy = function () {
        if (this.inited) {
            that.$dialog.find('.collapsible').collapsible('destroy');
            this.inited = false;
            if (this.currentCustoms) {
                that.main.unsubscribeStates(this.currentCustoms);
            }
        }
    };

    return this;
}
