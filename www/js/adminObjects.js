function Objects(main) {
    var that = this;
    this.$dialog        = $('#dialog-object');
    this.$dialogHistory = $('#dialog-history');

    this.$grid          = $('#grid-objects');
    this.$gridHistory   = $('#grid-history');

    this.main = main;
    this.historyEnabled = null;
    this.currentHistory =        null; // Id of the currently shown history dialog
    //this.historyIds =            [];
    // Todo put this in adapter instance config
    this.historyMaxAge =         86400; // Maxmimum datapoint age to be shown in gridHistory (seconds)

    this.prepare = function () {
        this.$dialog.dialog({
            autoOpen:   false,
            modal:      true,
            width: 870,
            height: 640,
            buttons: [
                {
                    text: _('Save'),
                    click: that.save
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        that.$dialog.dialog('close');
                        $('#json-object').val('');
                    }
                }
            ],
            close: function () {
                that.main.saveConfig('object-edit-active',  $('#object-tabs').tabs('option', 'active'));
            },
            resize: function () {
                that.main.saveConfig('object-edit-width',  $(this).parent().width());
                that.main.saveConfig('object-edit-height', $(this).parent().height() + 10);
                that.editor.resize();
            }
        });

        $(document).on('click', '.jump', function (e) {
            that.edit($(this).attr('data-jump-to'));
            e.preventDefault();
            return false;
        });

        $("#load_grid-objects").show();

        $('#object-tabs').tabs({
            activate: function (event, ui) {
                if (ui.newPanel.selector == '#object-tab-raw') {
                    var obj = that.saveFromTabs();
                    if (!obj) {
                        return false;
                    }
                    that.editor.setValue(JSON.stringify(obj, null, 2));
                } else if (ui.oldPanel.selector == '#object-tab-raw') {
                    var obj;
                    try {
                        obj = JSON.parse(that.editor.getValue());
                    } catch (e) {
                        that.main.showMessage(e, _('Parse error'), 'alert');
                        $('#object-tabs').tabs({active: 4});
                        return false;
                    }
                    that.load(obj);
                }
                return true;
            }
        });

        if (!that.editor) {
            that.editor = ace.edit("view-object-raw");
            that.editor.getSession().setMode("ace/mode/json");
        }
    };

    function loadObjectFields(htmlId, object, readonly) {
        var text = '';
        for (var attr in object) {
            text += '<tr><td>' + attr + '</td><td>';
            if (typeof object[attr] == 'string') {
                text += '<input type="text" class="object-tab-edit-string" style="width: 100%" data-attr="' + attr + '" value="' + object[attr] + '" />';
            } else if (typeof object[attr] == 'number') {
                text += '<input type="text" class="object-tab-edit-number" style="width: 100%" data-attr="' + attr + '" value="' + object[attr] + '" />';
            } else if (typeof object[attr] == 'boolean') {
                text += '<input type="checkbox" class="object-tab-edit-boolean" data-attr="' + attr + '" ' + (object[attr] ? 'checked' : '') + ' />';
            } else {
                text += '<textarea type="text" class="object-tab-edit-object"  style="width: 100%" rows="3" data-attr="' + attr + '">' + JSON.stringify(object[attr], null, 2) + '</textarea>';
            }
            text += '</td></tr>';
        }

        $('#' + htmlId).html(text);
    }
    
    function saveObjectFields(htmlId, object) {
        $('#' + htmlId).find('.object-tab-edit-string').each(function () {
            object[$(this).data('attr')] = $(this).val();
        });
        $('#' + htmlId).find('.object-tab-edit-number').each(function () {
            object[$(this).data('attr')] = parseFloat($(this).val());
        });
        $('#' + htmlId).find('.object-tab-edit-boolean').each(function () {
            object[$(this).data('attr')] = $(this).prop('checked');
        });
        var err = null;
        $('#' + htmlId).find('.object-tab-edit-object').each(function () {
            try {
                object[$(this).data('attr')] = JSON.parse($(this).val());
            } catch (e) {
                err = $(this).data('attr');
                return false;
            }
        });
        return err;
    }

    this.stateChange = function (id, state) {
        if (this.$grid) this.$grid.selectId('state', id, state);
    };

    this.objectChange = function (id, obj) {
        if (this.$grid) this.$grid.selectId('object', id, obj);
    };
    this.reinit = function () {
        this.checkHistory();
        if (this.$grid) this.$grid.selectId('reinit');
    };
    this.resize = function (width, height) {
        if (this.$grid) this.$grid.height(height - 100).width(width - 20);
    };

    this.init = function (update) {
        if (!main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }

        if (typeof this.$grid !== 'undefined' && (!this.$grid[0]._isInited || update)) {
            this.$grid[0]._isInited = true;

            var x = $(window).width();
            var y = $(window).height();
            if (x < 720) x = 720;
            if (y < 480) y = 480;

            that.$grid.height(y - 100).width(x - 20);

            var settings = {
                objects:  main.objects,
                states:   main.states,
                noDialog: true,
                texts: {
                    select:   _('Select'),
                    cancel:   _('Cancel'),
                    all:      _('All'),
                    id:       _('ID'),
                    name:     _('Name'),
                    role:     _('Role'),
                    room:     _('Room'),
                    value:    _('Value'),
                    type:     _('Type'),
                    selectid: _('Select ID'),
                    from:     _('From'),
                    lc:       _('Last changed'),
                    ts:       _('Time stamp'),
                    wait:     _('Processing...'),
                    ack:      _('Acknowledged'),
                    edit:     _('Edit'),
                    ok:       _('Ok'),
                    with:     _('With'),
                    without:  _('Without')
                },
                columns: ['image', 'name', 'type', 'role', 'room', 'value', 'button'],
                buttons: [
                    {
                        text: false,
                        icons: {
                            primary:'ui-icon-gear'
                        },
                        click: function (id) {
                            that.edit(id);
                        },
                        width: 26,
                        height: 20
                    },
                    {
                        text: false,
                        icons: {
                            primary:'ui-icon-trash'
                        },
                        click: function (id) {
                            // Delete all children
                            if (id) {
                                that.main.delObject(that.$grid, id, function (err) {
                                    if (err) that.main.showError(err);
                                });
                            }
                        },
                        width: 26,
                        height: 20
                    },
                    {
                        text: false,
                        icons: {
                            primary:'ui-icon-clock'
                        },
                        click: function (id) {
                            that.openHistoryDlg(id);
                        },
                        width: 26,
                        height: 20,
                        match: function (id) {
                            // Show history button only if history adapter enabled
                            if (main.objects[id] && that.historyEnabled && !id.match(/\.messagebox$/) && main.objects[id].type == 'state') {
                                // Check if history enabled
                                if (main.objects[id] && main.objects[id].common && main.objects[id].common.history && main.objects[id].common.history.enabled) {
                                    this.addClass('history-enabled').removeClass('history-disabled').css({'background': 'lightgreen'});
                                } else {
                                    this.addClass('history-disabled').removeClass('history-enabled').css({'background': ''});
                                }
                            } else {
                                this.hide();
                            }
                        }
                    }
                ],
                dblclick: function (id) {
                    that.edit(id);
                }
            };
            if (this.historyEnabled) {
                settings.customButtonFilter = {
                    icons:    {primary: 'ui-icon-clock'},
                    text:     false,
                    callback: function () {
                        var _ids = that.$grid.selectId('getFilteredIds');
                        var ids = [];
                        for (var i = 0; i < _ids.length; i++) {
                            if (that.main.objects[_ids[i]] && that.main.objects[_ids[i]].type == 'state') ids.push(_ids[i]);
                        }
                        if (ids && ids.length) {
                            that.openHistoryDlg(ids);
                        } else {
                            that.main.showMessage(_('No states selected!'), '', 'info');
                        }
                    }
                }
            } else {
                settings.customButtonFilter = null;
            }

            that.$grid.selectId('init', settings).selectId('show');
        }
    };

    this.edit = function (id) {
        var obj = main.objects[id];
        if (!obj) return;

        var width = 870;
        var height = 640;

        if (this.main.config['object-edit-width'])  width  = this.main.config['object-edit-width'];
        if (this.main.config['object-edit-height']) height = this.main.config['object-edit-height'];
        if (this.main.config['object-edit-active'] !== undefined) {
            $('#object-tabs').tabs({active: this.main.config['object-edit-active']});
        }

        that.$dialog.dialog('option', 'title', id);

        // fill users
        var text = 0;
        for (var u = 0; u < that.main.tabs.users.list.length; u++) {
            text += '<option value="' + that.main.tabs.users.list[u] + '">' + (that.main.objects[that.main.tabs.users.list[u]].common.name || that.main.tabs.users.list[u]) + '</option>';
        }
        $('#object-tab-acl-owner').html(text);

        // fill groups
        var text = 0;
        for (u = 0; u < that.main.tabs.groups.list.length; u++) {
            text += '<option value="' + that.main.tabs.groups.list[u] + '">' + (that.main.objects[that.main.tabs.groups.list[u]].common.name || that.main.tabs.groups.list[u]) + '</option>';
        }
        $('#object-tab-acl-group').html(text);
        that.load(obj);

        that.$dialog
            .dialog('option', 'width',  width)
            .dialog('option', 'height', height)
            .dialog('open');
    };

    this.load = function (obj) {
        if (!obj) return;
        obj.common = obj.common || {};
        obj.native = obj.native || {};
        obj.acl    = obj.acl || {};
        $('#edit-object-id').val(obj._id);
        $('#edit-object-name').val(obj.common ? obj.common.name : obj._id);
        $('#edit-object-type').val(obj.type);
        $('#object-tab-acl-owner').val(obj.acl.owner || 'system.user.admin');
        $('#object-tab-acl-group').val(obj.acl.ownerGroup || 'system.group.administrator');

        loadObjectFields('object-tab-common-table', obj.common || {}, 'common');
        loadObjectFields('object-tab-native-table', obj.native || {}, 'native');

        obj.acl = obj.acl || {};
        if (obj.acl.object === undefined) obj.acl.object = 0x666;

        $('#object-tab-acl-obj-owner-read') .prop('checked', obj.acl.object & 0x400);
        $('#object-tab-acl-obj-owner-write').prop('checked', obj.acl.object & 0x200);
        $('#object-tab-acl-obj-group-read'). prop('checked', obj.acl.object & 0x40);
        $('#object-tab-acl-obj-group-write').prop('checked', obj.acl.object & 0x20);
        $('#object-tab-acl-obj-every-read'). prop('checked', obj.acl.object & 0x4);
        $('#object-tab-acl-obj-every-write').prop('checked', obj.acl.object & 0x2);

        if (obj.type != 'state') {
            $('#object-tab-acl-state').hide();
        } else {
            $('#object-tab-acl-state').show();
            if (obj.acl.state === undefined) obj.acl.state = 0x666;

            $('#object-tab-acl-state-owner-read') .prop('checked', obj.acl.state & 0x400);
            $('#object-tab-acl-state-owner-write').prop('checked', obj.acl.state & 0x200);
            $('#object-tab-acl-state-group-read'). prop('checked', obj.acl.state & 0x40);
            $('#object-tab-acl-state-group-write').prop('checked', obj.acl.state & 0x20);
            $('#object-tab-acl-state-every-read'). prop('checked', obj.acl.state & 0x4);
            $('#object-tab-acl-state-every-write').prop('checked', obj.acl.state & 0x2);
        }

        var _obj = JSON.parse(JSON.stringify(obj));
        //$('#view-object-raw').val(JSON.stringify(_obj, null, '  '));
        that.editor.setValue(JSON.stringify(_obj, null, 2));
        if (_obj._id)    delete _obj._id;
        if (_obj.common) delete _obj.common;
        if (_obj.type)   delete _obj.type;
        if (_obj.native) delete _obj.native;
        if (_obj.acl)    delete _obj.acl;
        $('#view-object-rest').val(JSON.stringify(_obj, null, '  '));
    }

    this.saveFromTabs = function () {
        var obj;
        try {
            obj = $('#view-object-rest').val();
            if (!obj) {
                obj = {};
            } else {
                obj = JSON.parse(obj);
            }
        } catch (e) {
            that.main.showMessage(_('Cannot parse.'), 'Error in ' + e, 'alert');
            return false;
        }

        obj.common = {};
        obj.native = {};
        obj.acl    = {};
        obj._id =         $('#edit-object-id').val();
        obj.common.name = $('#edit-object-name').val();
        obj.type =        $('#edit-object-type').val();
        var err = saveObjectFields('object-tab-common-table', obj.common);
        if (err) {
            that.main.showMessage(_('Cannot parse.'), 'Error in ' + err, 'alert');
            return false;
        }
        err = saveObjectFields('object-tab-native-table', obj.native);
        if (err) {
            that.main.showMessage(_('Cannot parse.'), 'Error in ' + err, 'alert');
            return false;
        }
        obj.acl.object = 0;
        obj.acl.object |= $('#object-tab-acl-obj-owner-read').prop('checked') ? 0x400 : 0;
        obj.acl.object |= $('#object-tab-acl-obj-owner-write').prop('checked') ? 0x200 : 0;
        obj.acl.object |= $('#object-tab-acl-obj-group-read').prop('checked') ? 0x40 : 0;
        obj.acl.object |= $('#object-tab-acl-obj-group-write').prop('checked') ? 0x20 : 0;
        obj.acl.object |= $('#object-tab-acl-obj-every-read').prop('checked') ? 0x4 : 0;
        obj.acl.object |= $('#object-tab-acl-obj-every-write').prop('checked') ? 0x2 : 0;

        obj.acl.owner = $('#object-tab-acl-owner').val();
        obj.acl.ownerGroup = $('#object-tab-acl-group').val();

        if (obj.type == 'state') {
            obj.acl.state = 0;
            obj.acl.state |= $('#object-tab-acl-state-owner-read').prop('checked') ? 0x400 : 0;
            obj.acl.state |= $('#object-tab-acl-state-owner-write').prop('checked') ? 0x200 : 0;
            obj.acl.state |= $('#object-tab-acl-state-group-read').prop('checked') ? 0x40 : 0;
            obj.acl.state |= $('#object-tab-acl-state-group-write').prop('checked') ? 0x20 : 0;
            obj.acl.state |= $('#object-tab-acl-state-every-read').prop('checked') ? 0x4 : 0;
            obj.acl.state |= $('#object-tab-acl-state-every-write').prop('checked') ? 0x2 : 0;
        }

        return obj;
    };

    this.saveFromRaw = function () {
        var obj;
        try {
            obj = JSON.parse(that.editor.getValue());
            //obj = JSON.parse($('#view-object-raw').val());
        } catch (e) {
            that.main.showMessage(e, _('Parse error'), 'alert');
            $('#object-tabs').tabs({active: 4});
            return false;
        }
        return obj;
    };

    this.save = function () {
        if ($("#object-tabs").tabs('option', 'active') == 4) {
            var obj = that.saveFromRaw();
            if (!obj) return;

            main.socket.emit('setObject', obj._id, obj, function (err) {
                if (err) {
                    that.main.showError(err);
                }
            });
            that.$dialog.dialog('close');
        } else {
            var obj = that.saveFromTabs();
            if (!obj) return;
            main.socket.emit('getObject', obj._id, function (err, _obj) {
                if (err) {
                    return that.main.showError(err);
                }

                _obj.common = obj.common;
                _obj.native = obj.native;
                _obj.acl    = obj.acl;
                main.socket.emit('setObject', obj._id, _obj, function (err) {
                    if (err) {
                        that.main.showError(err);
                    }
                });
            });


            that.$dialog.dialog('close');
        }
    };

    // ----------------------------- HISTORY ------------------------------------------------
    this.checkHistory = function () {
        if (main.objects && main.objects['system.adapter.history.0'] && main.objects['system.adapter.history.0'].common.enabled) {
            if (this.historyEnabled !== null && this.historyEnabled != true) {
                this.historyEnabled = true;
                // update history buttons
                that.init(true);
            } else {
                this.historyEnabled = true;
            }
        } else {
            if (this.historyEnabled !== null && this.historyEnabled != false) {
                this.historyEnabled = false;
                // update history buttons
                that.init(true);
            } else {
                this.historyEnabled = false;
            }
        }
    };

    this.stateChangeHistory = function (id, state) {
        if (this.currentHistory == id) {
            var gid = this.$gridHistory[0]._maxGid++;
            this.$gridHistory.jqGrid('addRowData', gid, {
                gid: gid,
                id:  id,
                ack: state.ack,
                val: state.val,
                ts:  main.formatDate(state.ts, true),
                lc:  main.formatDate(state.lc, true)
            });
        }
    };

    this.openHistoryDlg = function (ids) {
        if (typeof ids != 'object') ids = [ids];

        for (var i = 0; i < ids.length; i++) {
            if (!main.objects[ids[i]]) {
                var p = ids[i].split('.');
                p.splice(2);
                main.objects[ids[i]] = {
                    type:   'state',
                    parent: p.join('.'),
                    common: {
                        // TODO define role somehow
                        type: main.states[ids[i]] ? getType(main.states[ids[i]].val) : 'mixed',
                        name: ids[i]
                    }
                };
            }
            if (!main.objects[ids[i]].common.history) {
                main.objects[ids[i]].common.history = {
                    enabled:        false,
                    changesOnly:    true,
                    debounce:       10000, // de-bounce interval
                    // use default value from history-adadpter config
                    minLength:      (main.objects['system.adapter.history.0'] && main.objects['system.adapter.history.0'].native) ? main.objects['system.adapter.history.0'].native.minLength || 480 : 480,
                    retention:      604800 // one week by default
                };
            }
        }

        var title;
        if (ids.length == 1) {
            title = _('History of %s', ids[0]);
            currentHistory = main.objects[ids[0]].common.history.enabled ? ids[0]: null;
        } else {
            title = _('History of %s states', ids.length);
            currentHistory = null;
        }
        $('#edit-history-ids').val(JSON.stringify(ids));

        $('#edit-history-enabled').prop('checked', main.objects[ids[0]].common.history.enabled);
        $('#edit-history-changesOnly').prop('checked', main.objects[ids[0]].common.history.changesOnly);

        $('#edit-history-minLength').val(main.objects[ids[0]].common.history.minLength);
        $('#edit-history-debounce').val(main.objects[ids[0]].common.history.debounce);
        $('#edit-history-retention').val(main.objects[ids[0]].common.history.retention);
        this.$dialogHistory.dialog('option', 'title', title);
        this.$gridHistory.jqGrid('clearGridData');
        $("#load_grid-history").show();

        var start = Math.round((new Date()).getTime() / 1000) - this.historyMaxAge;
        var end =   Math.round((new Date()).getTime() / 1000) + 5000;
        //console.log('getStateHistory', id, start, end)
        var _tabs = $('#tabs-history');

        var port = 0;
        var chart = false;
        if (ids.length == 1) {
            this.$dialogHistory.dialog('option', 'height', 600);
            this.$dialogHistory.dialog('open');
            _tabs[0]._id = ids[0];
            _tabs.show();
            if (!_tabs[0]._inited) {
                _tabs[0]._inited = true;
                _tabs.tabs({
                    activate: function (event, ui) {
                        switch (ui.newPanel.selector) {
                            case '#tab-history-table':
                                $('#iframe-history-chart').attr('src', '');
                                break;

                            case '#tab-history-chart':
                                var port = 0;
                                var chart = false;
                                var _id = this._id;
                                for (var i = 0; i < main.instances.length; i++) {
                                    if (main.objects[main.instances[i]].common.name == 'rickshaw' && main.objects[main.instances[i]].common.enabled) {
                                        chart = 'rickshaw';
                                    } else
                                    if (main.objects[main.instances[i]].common.name == 'web' && main.objects[main.instances[i]].common.enabled) {
                                        port = main.objects[main.instances[i]].native.port;
                                    }
                                    if (chart && port) break;
                                }
                                var $chart = $('#iframe-history-chart');

                                $chart.attr('src', 'http://' + location.hostname + ':' + port + '/' + chart + '/index.html?axeX=lines&axeY=inside&_ids=' + encodeURI(_id) + '&width=' + ($chart.width() - 10) + '&hoverDetail=true&height=' + ($chart.height() - 10));
                                break;

                        }
                    },
                    create: function () {
                    }
                });
            } else {
                _tabs.tabs({active: 0});
            }

            // Check if chart enabled and set
            for (var i = 0; i < main.instances.length; i++) {
                if (main.objects[main.instances[i]].common.name == 'rickshaw' && main.objects[main.instances[i]].common.enabled) {
                    chart = 'rickshaw';
                } else
                if (main.objects[main.instances[i]].common.name == 'web'      && main.objects[main.instances[i]].common.enabled) {
                    port = main.objects[main.instances[i]].native.port;
                }
                if (chart && port) break;
            }

            main.socket.emit('getStateHistory', ids[0], start, end, function (err, res) {
                setTimeout(function () {
                    if (!err) {
                        var rows = [];
                        //console.log('got ' + res.length + ' history datapoints for ' + id);
                        for (var i = 0; i < res.length; i++) {
                            rows.push({
                                gid: i,
                                id:  res[i].id,
                                ack: res[i].ack,
                                val: res[i].val,
                                ts:  main.formatDate(res[i].ts, true),
                                lc:  main.formatDate(res[i].lc, true)
                            });
                        }
                        that.$gridHistory[0]._maxGid = res.length;
                        that.$gridHistory.jqGrid('addRowData', 'gid', rows);
                        that.$gridHistory.trigger('reloadGrid');
                    } else {
                        console.log(err);
                    }
                }, 0);
            });
            _tabs.tabs('option', 'disabled', (port && chart && currentHistory) ? [] : [1]);
        } else {
            this.$dialogHistory.dialog('option', 'height', 175);
            _tabs.hide();
            this.$dialogHistory.dialog('open');
        }
    };

    // Set modified history states
    this.setHistory = function (ids, callback) {
        var id = ids.pop();
        if (id) {
            this.$dialogHistory.dialog('option', 'title', _('History of %s states', ids.length));

            that.main.socket.emit('setObject', id, this.main.objects[id], function (err) {
                if (err) {
                    that.main.showMessage(_(err));
                } else {
                    setTimeout(function () {
                        that.setHistory(ids, callback);
                    }, 50);
                }
            });
        } else {
            if (callback) callback();
        }
    }

    this.prepareHistory = function () {
        this.$gridHistory.jqGrid({
            datatype: 'local',
            colNames: [_('val'), _('ack'), _('from'), _('ts'), _('lc')],
            colModel: [
                {name: 'val',  index: 'val',  width: 160, editable: true},
                {name: 'ack',  index: 'ack',  width: 60,  fixed: false},
                {name: 'from', index: 'from', width: 80,  fixed: false},
                {name: 'ts',   index: 'ts',   width: 140, fixed: false},
                {name: 'lc',   index: 'lc',   width: 140, fixed: false}
            ],
            width: 750,
            height: 300,
            pager: $('#pager-history'),
            rowNum: 100,
            rowList: [15, 100, 1000],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('history data'),
            ignoreCase: true

        });

        $(document).on('click', '.history', function () {
            that.openHistoryDlg($(this).attr('data-id'));
        });

        this.$dialogHistory.dialog({
            autoOpen:      false,
            modal:         true,
            width:         830,
            height:        575,
            closeOnEscape: false,
            buttons: [
                {
                    text: _('Save'),
                    click: function () {
                        var ids =       JSON.parse($('#edit-history-ids').val());
                        var minLength = parseInt($('#edit-history-minLength').val(), 10) || 480;

                        // do not update charts
                        that.currentHistory = null;
                        //that.historyIds = ids;

                        for (var i = 0; i < ids.length; i++) {
                            main.objects[ids[i]].common.history = {
                                enabled:     $('#edit-history-enabled').is(':checked'),
                                changesOnly: $('#edit-history-changesOnly').is(':checked'),
                                minLength:   minLength,
                                maxLength:   minLength * 2,
                                retention:   parseInt($('#edit-history-retention').val(), 10) || 0,
                                debounce:    parseInt($('#edit-history-debounce').val(),  10) || 1000
                            };
                        }
                        that.setHistory(ids, function () {
                            that.$dialogHistory.dialog('close');
                        });
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        that.$dialogHistory.dialog('close');
                    }
                }
            ],
            open: function (event, ui) {
                that.$gridHistory.setGridHeight($(this).height() - 180).setGridWidth($(this).width() - 30);
                $('#iframe-history-chart').css({height: $(this).height() - 115, width: $(this).width() - 30});
            },
            close: function () {
                $('#iframe-history-chart').attr('src', '');
            },
            resize: function () {
                that.$gridHistory.setGridHeight($(this).height() - 180).setGridWidth($(this).width() - 30);
                $('#iframe-history-chart').css({height: $(this).height() - 115, width: $(this).width() - 30});
            }
        });
    };
}