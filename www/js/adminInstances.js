function Instances(main) {
    var that = this;

    this.$grid =          $('#grid-instances');
    this.$configFrame =   $('#config-iframe');
    this.$dialogConfig =  $('#dialog-config');

    this.main =   main;
    this.list =   [];
    this.lTrue =  '';
    this.lFalse = '';

    this.prepare = function () {
        this.$grid.jqGrid({
            datatype: 'local',
            colNames: ['id', 'availableModes',  '', _('name'), _('instance'), _('title'), _('enabled'), _('host'), _('mode'), _('schedule'), '', _('platform'), _('loglevel'), _('alive'), _('connected')],
            colModel: [
                {name: '_id',       index: '_id',       hidden: true},
                {name: 'availableModes', index:'availableModes', hidden: true},
                {name: 'image',     index: 'image',     width: 22,   editable: false, sortable: false, search: false, align: 'center'},
                {name: 'name',      index: 'name',      width: 130},
                {name: 'instance',  index: 'instance',  width: 70},
                {name: 'title',     index: 'title',     width: 220,  editable: true},
                {name: 'enabled',   index: 'enabled',   width: 60,   editable: true, edittype: 'checkbox', editoptions: {value: _('true') + ':' + _('false')}, align: 'center'},
                {name: 'host',      index: 'host',      width: 100,  editable: true, edittype: 'select', editoptions: ''},
                {name: 'mode',      index: 'mode',      width: 80,   editable: true, edittype: 'select', editoptions: {value: null}, align: 'center'},
                {name: 'schedule',  index: 'schedule',  width: 80,   align: 'center', editable: true},
                {name: 'buttons',   index: 'buttons',   width: 80,   align: 'center', sortable: false, search: false},
                {name: 'platform',  index: 'platform',  width: 60,   hidden: true},
                {name: 'loglevel',  index: 'loglevel',  width: 60,   align: 'center', editable: true, edittype: 'select', editoptions: {value: 'debug:debug;info:info;warn:warn;error:error'}},
                {name: 'alive',     index: 'alive',     width: 60,   align: 'center'},
                {name: 'connected', index: 'connected', width: 60,   align: 'center'}
            ],
            pager:         $('#pager-instances'),
            rowNum:        100,
            rowList:       [20, 50, 100],
            sortname:      "id",
            sortorder:     "desc",
            viewrecords:   true,
            caption:       _('ioBroker adapter instances'),
            ignoreCase:    true,
            ondblClickRow: function (rowId, e) {
                var rowData = that.$grid.jqGrid('getRowData', rowId);
                that.onEdit(rowData._id);
            },
            postData: that.main.config.instancesFilter ? { filters: that.main.config.instancesFilter} : undefined,
            search: !!that.main.config.instancesFilter
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false,
            afterSearch:   function () {
                that.initButtons();
                // Save filter
                that.main.saveConfig('instancesFilter', that.$grid.getGridParam("postData").filters);
            }
        }).navGrid('#pager-instances', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-instances', {
            caption: '',
            buttonicon: 'ui-icon-gear',
            onClickButton: function () {
                var objSelected = that.$grid.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var obj = that.$grid.jqGrid('getRowData', objSelected);
                that.main.tabs.objects.onEdit(obj._id);
            },
            position: 'first',
            id: 'edit-instance',
            title: _('edit instance'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-instances', {
            caption:    '',
            buttonicon: 'ui-icon-refresh',
            onClickButton: function () {
                that.init(true);
            },
            position:   'first',
            id:         'reload-instances',
            title:      _('reload instance'),
            cursor:     'pointer'
        });

        this.$dialogConfig.dialog({
            autoOpen:   false,
            modal:      true,
            width:      830, //$(window).width() > 920 ? 920: $(window).width(),
            height:     536, //$(window).height() - 100, // 480
            closeOnEscape: false,
            open: function (event, ui) {
                that.$dialogConfig.css('padding', '2px 0px');
            },
            beforeClose: function () {
                if (window.frames['config-iframe'].changed) {
                    return confirm(_('Are you sure? Changes are not saved.'));
                }
                var pos  = $(this).parent().position();
                var name = $(this).data('name');
                that.main.saveConfig('adapter-config-top-' + name,  pos.top);
                that.main.saveConfig('adapter-config-left-' + name, pos.left);

                return true;
            },
            close: function () {
                // Clear iframe
                that.$configFrame.attr('src', '');
            },
            resize: function () {
                var name = $(this).data('name');
                that.main.saveConfig('adapter-config-width-' + name, $(this).parent().width());
                that.main.saveConfig('adapter-config-height-' + name, $(this).parent().height() + 10);
            }
        });

        if (that.main.config.instancesFilter) {
            var filters = JSON.parse(that.main.config.instancesFilter);
            if (filters.rules) {
                for (var f = 0; f < filters.rules.length; f++) {
                    $('#gview_grid-instances #gs_' + filters.rules[f].field).val(filters.rules[f].data);
                }
            }
        }
    };

    this.onEdit = function (id, e) {
        var rowData = this.$grid.jqGrid('getRowData', 'instance_' + id);

        $('.instance-edit').hide();
        $('.instance-settings').hide();
        $('.instance-reload').hide();
        $('.instance-del').hide();
        $('.instance-ok-submit[data-instance-id="' + id + '"]').show();
        $('.instance-cancel-submit[data-instance-id="' + id + '"]').show();
        $('#reload-instances').addClass('ui-state-disabled');
        $('#edit-instance').addClass('ui-state-disabled');

        // Set the colors
        var a = $('td[aria-describedby="grid-instances_enabled"]');
        a.each(function (index) {
            var text = $(this).html();
            if (text == '<span style="color:green;font-weight:bold">' + _('true') + '</span>') {
                $(this).html(_('true'));
            } else if (text == '<span style="color:red">' + _('false') + '</span>') {
                $(this).html( _('false'));
            }
        });

        // Set the links
        var a = $('td[aria-describedby="grid-instances_title"]');
        a.each(function (index) {
            var text = $(this).html();
            var m = text.match(/\<a.*>(.*)\<\/a\>/);
            if (m) $(this).html(m[1]);
        });

        if (rowData.availableModes) {
            var list = {};
            var modes = rowData.availableModes.split(',');
            var editable = false;
            for (var i = 0; i < modes.length; i++) {
                list[modes[i]] = _(modes[i]);
                if (modes[i] == 'schedule') editable = true;
            }
            this.$grid.setColProp('mode', {
                editable:    true,
                edittype:    'select',
                editoptions: {value: list},
                align:       'center'
            });
            this.$grid.setColProp('schedule', {
                editable:    editable,
                align:       'center'
            });
        } else {
            this.$grid.setColProp('mode', {
                editable: false,
                align:    'center'
            });
            this.$grid.setColProp('schedule', {
                editable:    rowData.mode == 'schedule',
                align:       'center'
            });
        }
        this.$grid.jqGrid('editRow', 'instance_' + id, {"url": "clientArray"});
    };

    this.replaceLink = function (_var, adapter, instance) {
        _var = _var.replace(/\%/g, '');
        // like web.0_port
        var parts;
        if (_var.indexOf('_') == -1) {
            parts = [
                adapter + '.' + instance,
                _var
            ]
        } else {
            parts = _var.split('_');
            // add .0 if not defined
            if (!parts[0].match(/\.[0-9]+$/)) parts[0] += '.0';
        }

        this.main.socket.emit('getObject', 'system.adapter.' + parts[0], function (err, obj) {
            if (obj) {
                setTimeout(function () {
                    var link = $('#a_' + adapter + '_' + instance).attr('href').replace('%' + _var + '%', obj.native[parts[1]]);
                    $('#a_' + adapter + '_' + instance).attr('href', link);
                }, 0);
            }
        });
    };

    this.replaceLinks = function (vars, adapter, instance) {
        if (typeof vars != 'object') vars = [vars];
        for (var t = 0; t < vars.length; t++) {
            this.replaceLink(vars[t], adapter, instance);
        }
    };

    this.htmlBoolean = function (value) {
        if (value === 'true' || value === true) {
            if (!this.lTrue) this.lTrue = '<span style="color:green;font-weight:bold">' + _('true') + '</span>';
            return this.lTrue;
        } else if (value === 'false' || value === false) {
            if (!this.lFalse) this.lFalse = '<span style="color:red">' + _('false') + '</span>';
            return this.lFalse;
        } else {
            return value;
        }
    };

    this.init = function (update) {
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }

        if (typeof this.$grid !== 'undefined' && (!this.$grid[0]._isInited || update)) {
            this.$grid[0]._isInited = true;
            this.$grid.jqGrid('clearGridData');

            this.list.sort();

            for (var i = 0; i < this.list.length; i++) {
                var obj = this.main.objects[this.list[i]];
                if (!obj) continue;
                var tmp = obj._id.split('.');
                var adapter = tmp[2];
                var instance = tmp[3];
                var title = obj.common ? obj.common.title : '';
                var link  = obj.common.localLink || '';
                if (link && link.indexOf('%ip%') != -1) link = link.replace('%ip%', location.hostname);

                var vars = link.match(/\%(\w+)\%/g);
                if (vars) this.replaceLinks(vars, adapter, instance);

                this.$grid.jqGrid('addRowData', 'instance_' + this.list[i].replace(/ /g, '_'), {
                    _id:       obj._id,
                    availableModes: obj.common ? obj.common.availableModes : null,
                    image:     obj.common && obj.common.icon ? '<img src="/adapter/' + obj.common.name + '/' + obj.common.icon + '" width="22px" height="22px"/>' : '',
                    name:      obj.common ? obj.common.name : '',
                    instance:  obj._id.slice(15),
                    title:     obj.common ? (link ? '<a href="' + link + '" id="a_' + adapter + '_' + instance + '" target="_blank">' + title + '</a>': title): '',
                    enabled:   obj.common ? (obj.common.enabled ? "true": "false") : "false",
                    host:      obj.common ? obj.common.host : '',
                    mode:      obj.common.mode,
                    schedule:  obj.common.mode === 'schedule' ? obj.common.schedule : '',
                    buttons:   '<button data-instance-id="' + this.list[i] + '" class="instance-settings" data-instance-href="/adapter/' + adapter + '/?' + instance + '" >' + _('config') + '</button>' +
                    '<button data-instance-id="' + this.list[i] + '" class="instance-edit">'   + _('edit')   + '</button>' +
                    '<button data-instance-id="' + this.list[i] + '" class="instance-reload">' + _('reload') + '</button>' +
                    '<button data-instance-id="' + this.list[i] + '" class="instance-del">'    + _('delete') + '</button>' +
                    '<button data-instance-id="' + this.list[i] + '" class="instance-ok-submit"     style="display:none">' + _('ok')     + '</button>' +
                    '<button data-instance-id="' + this.list[i] + '" class="instance-cancel-submit" style="display:none">' + _('cancel') + '</button>',
                    platform:  obj.common ? obj.common.platform : '',
                    loglevel:  obj.common ? obj.common.loglevel : '',
                    alive:     this.main.states[obj._id + '.alive'] ? this.htmlBoolean(this.main.states[obj._id + '.alive'].val) : '',
                    connected: this.main.states[obj._id + '.connected'] ? this.htmlBoolean(this.main.states[obj._id + '.connected'].val) : ''
                });
            }
            this.$grid.trigger('reloadGrid');

            // Set the colors
            var a = $('td[aria-describedby="grid-instances_enabled"]');
            a.each(function (index) {
                var text = $(this).html();
                if (text == 'true' || text == 'false') {
                    $(this).html(that.htmlBoolean(text));
                }
            });

            $('.host-selector').each(function () {
                var id = $(this).attr('data-id');
                $(this).val((that.main.objects[id] && that.main.objects[id].common) ? obj.common.host || '': '').
                    change(function () {
                        that.main.socket.emit('extendObject', $(this).attr('data-id'), {common:{host: $(this).val()}});
                    });
            });

            this.initButtons();
        }
    };

    this.updateHosts = function (hosts) {
        var tmp = '';
        for (var k = 0; k < hosts.length; k++) {
            tmp += (k > 0 ? ';' : '') + hosts[k].name + ':' + hosts[k].name;
        }
        this.$grid.jqGrid('setColProp', 'host', {editoptions: {value: tmp}});
    };

    this.stateChange = function (id, state) {
        if (this.$grid) {
            var parts = id.split('.');
            var last = parts.pop();
            id = parts.join('.');
            if (last === 'alive' && this.list.indexOf(id) !== -1) {
                rowData = this.$grid.jqGrid('getRowData', 'instance_' + id);
                rowData.alive = (rowData.alive === true || rowData.alive === 'true' || rowData.alive == this.lTrue);
                var newVal = state ? state.val : false;
                newVal = (newVal === true || newVal === 'true');
                if (rowData.alive != newVal) {
                    rowData.alive = this.htmlBoolean(newVal);
                    this.$grid.jqGrid('setRowData', 'instance_' + id, rowData);
                    this.initButtons(id);
                }
            } else if (last === 'connected' && this.list.indexOf(id) !== -1) {
                rowData = this.$grid.jqGrid('getRowData', 'instance_' + id);
                rowData.connected = (rowData.connected === true || rowData.connected === 'true' || rowData.connected == this.lTrue);
                var newVal = state ? state.val : false;
                newVal = (newVal === true || newVal === 'true');
                if (rowData.connected != newVal) {
                    rowData.connected = this.htmlBoolean(newVal);
                    this.$grid.jqGrid('setRowData', 'instance_' + id, rowData);
                    this.initButtons(id);
                }
            }
        }

    };

    this.objectChange = function (id, obj) {
        if (this.$grid !== undefined && this.$grid[0]._isInited) {
            if (this.updateTimer) clearTimeout(this.updateTimer);

            this.updateTimer = setTimeout(function () {
                that.updateTimer = null;
                that.init(true);
            }, 200);
        }
    };

    this.initButtons = function (id) {
        if (id) {
            id = '[data-instance-id="' + id + '"]';
        } else {
            id = '';
        }

        $('.instance-edit' + id).unbind('click').button({
            icons: {primary: 'ui-icon-pencil'},
            text:  false
        }).css('width', '22px').css('height', '18px').click(function () {
            that.onEdit($(this).attr('data-instance-id'));
        });

        $('.instance-settings' + id).button({icons: {primary: 'ui-icon-note'}, text: false}).css('width', '22px').css('height', '18px').unbind('click')
            .click(function () {
                $iframeDialog = that.$dialogConfig;
                that.$configFrame.attr('src', $(this).attr('data-instance-href'));
                var name = $(this).attr('data-instance-id').replace(/^system\.adapter\./, '');
                var config = that.main.objects[$(this).attr('data-instance-id')];
                var width = 830;
                var height = 536;
                var minHeight = 0;
                var minWidth = 0;
                if (config.common.config) {
                    if (config.common.config.width) width   = config.common.config.width;
                    if (config.common.config.height) height = config.common.config.height;
                    if (config.common.config.minWidth) minWidth   = config.common.config.minWidth;
                    if (config.common.config.minHeight) minHeight = config.common.config.minHeight;
                }
                if (that.main.config['adapter-config-width-'  + name])  width = that.main.config['adapter-config-width-'  + name];
                if (that.main.config['adapter-config-height-' + name]) height = that.main.config['adapter-config-height-' + name];
                that.$dialogConfig.data('name', name);

                // Set minimal height and width
                that.$dialogConfig.dialog('option', 'minWidth',  minWidth).dialog('option', 'minHeight', minHeight);

                that.$dialogConfig
                    .dialog('option', 'title', _('Adapter configuration') + ': ' + name)
                    .dialog('option', 'width',  width)
                    .dialog('option', 'height', height)
                    .dialog('open');

                if (that.main.config['adapter-config-top-'  + name])   that.$dialogConfig.parent().css({top: that.main.config['adapter-config-top-' + name]});
                if (that.main.config['adapter-config-left-' + name])   that.$dialogConfig.parent().css({left: that.main.config['adapter-config-left-' + name]});
            });

        $('.instance-reload' + id).button({icons: {primary: 'ui-icon-refresh'}, text: false}).css({width: 22, height: 18}).unbind('click')
            .click(function () {
                that.main.socket.emit('extendObject', $(this).attr('data-instance-id'), {});
            });

        $('.instance-del' + id).button({icons: {primary: 'ui-icon-trash'}, text: false}).css('width', '22px').css('height', '18px').unbind('click')
            .click(function () {
                var id = $(this).attr('data-instance-id');
                if (that.main.objects[id] && that.main.objects[id].common && that.main.objects[id].common.host) {
                    that.main.confirmMessage(_('Are you sure?'), null, 'help', function (result) {
                        if (result) {
                            that.main.cmdExec(that.main.objects[id].common.host, 'del ' + id.replace('system.adapter.', ''), function (exitCode) {
                                if (!exitCode) that.main.tabs.adapters.init(true);
                            });
                        }
                    });
                }
            });

        $('.instance-ok-submit' + id).unbind('click').button({
            icons: {primary: 'ui-icon-check'},
            text:  false
        }).css('width', '22px').css('height', '18px').click(function () {
            var id = $(this).attr('data-instance-id');
            $('.instance-edit').show();
            $('.instance-settings').show();
            $('.instance-reload').show();
            $('.instance-del').show();
            $('.instance-ok-submit').hide();
            $('.instance-cancel-submit').hide();
            $('#reload-instances').removeClass('ui-state-disabled');
            $('#edit-instance').removeClass('ui-state-disabled');

            that.$grid.jqGrid('saveRow', 'instance_' + id, {"url": "clientArray"});
            // afterSave
            setTimeout(function () {
                var _obj = that.$grid.jqGrid('getRowData', 'instance_' + id);

                // Translate mode back
                var modes = that.$grid.jqGrid('getColProp', 'mode');
                if (modes) modes = modes.editoptions.value;
                for (var mode in modes) {
                    if (modes[mode] == _obj.mode) {
                        _obj.mode = mode;
                        break;
                    }
                }

                var obj = {common:{}};
                obj.common.host     = _obj.host;
                obj.common.loglevel = _obj.loglevel;
                obj.common.schedule = _obj.schedule;
                obj.common.enabled  = _obj.enabled;
                obj.common.mode     = _obj.mode;
                obj.common.title    = _obj.title;

                if (obj.common.enabled === _('true'))  obj.common.enabled = true;
                if (obj.common.enabled === _('false')) obj.common.enabled = false;

                that.main.socket.emit('extendObject', _obj._id, obj);
            }, 100);
        });

        $('.instance-cancel-submit' + id).unbind('click').button({
            icons: {primary: 'ui-icon-close'},
            text:  false
        }).css('width', '22px').css('height', '18px').click(function () {
            var id = $(this).attr('data-instance-id');
            $('.instance-edit').show();
            $('.instance-settings').show();
            $('.instance-reload').show();
            $('.instance-del').show();
            $('.instance-ok-submit').hide();
            $('.instance-cancel-submit').hide();
            $('#reload-instances').removeClass('ui-state-disabled');
            $('#edit-instance').removeClass('ui-state-disabled');
            that.$grid.jqGrid('restoreRow', 'instance_' + id, false);

            // Restore links
            for (var i = 0; i < that.list.length; i++) {
                var obj = that.main.objects[that.list[i]];
                if (!obj) continue;
                var tmp      = obj._id.split('.');
                var adapter  = tmp[2];
                var instance = tmp[3];

                var title = obj.common ? obj.common.title : '';
                var oldLink  = obj.common.localLink || '';
                var newLink  = oldLink;
                if (newLink && newLink.indexOf('%ip%') != -1) newLink = newLink.replace('%ip%', location.hostname);

                var vars = newLink.match(/\%(\w+)\%/g);
                if (newLink) {
                    if (vars) that.replaceLinks(vars, adapter, instance);
                    var _obj = that.$grid.jqGrid('getRowData', 'instance_' + obj._id);
                    _obj.title = obj.common ? (newLink ? '<a href="' + newLink + '" id="a_' + adapter + '_' + instance + '" target="_blank">' + title + '</a>' : title): '';
                    that.$grid.jqGrid('setRowData', 'instance_' + obj._id, _obj);
                    that.initButtons(obj._id);
                }
            }

            // Set the colors
            var a = $('td[aria-describedby="grid-instances_enabled"]');
            a.each(function (index) {
                var text = $(this).html();
                if (text == _('true')) {
                    $(this).html('<span style="color:green;font-weight:bold">' + _('true') + '</span>');
                } else if (text == _('false')) {
                    $(this).html('<span style="color:red">' + _('false') + '</span>');
                }
            });

        });
    };

    this.resize = function (width, height) {
        this.$grid.setGridHeight(height - 150).setGridWidth(width - 20);
    };
}
