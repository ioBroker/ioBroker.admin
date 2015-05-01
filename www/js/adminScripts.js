function Scripts(main) {
    var that      = this;
    this.list     = [];
    this.$grid    = $('#grid-scripts');
    this.$dialog  = $('#dialog-script');
    this.editor   = null;
    this.changed  = false;

    this.main     = main;

    this.prepare = function () {
        this.$grid.jqGrid({
            datatype: 'local',
            colNames: ['_id', 'id', _('name'), _('engine type'), _('enabled'), _('engine'), ''],
            colModel: [
                {name: '_id',        index: '_id', hidden: true},
                {name: '_obj_id',    index: '_obj_id'},
                {name: 'name',       index: 'name',     editable: true},
                {name: 'engineType', index: 'engineType'},
                {name: 'enabled',    index: 'enabled',  editable: true, edittype: 'checkbox', editoptions: {value: "true:false"}},
                {name: 'engine',     index: 'engine',   editable: true, edittype: 'select', editoptions: ''},
                {name: 'commands',   index: 'commands', editable: false, width: 80, align: 'center'}
            ],
            pager: $('#pager-scripts'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker adapter scripts'),
            ignoreCase: true,
            ondblClickRow: function (rowid) {
                that.onEditLine(rowid.substring('script_'.length));
            },
            gridComplete: function () {
                /*$('#del-script').addClass('ui-state-disabled');
                 $('#edit-script').addClass('ui-state-disabled');*/
            },
            postData: that.main.config.scriptsFilter ? { filters: that.main.config.scriptsFilter} : undefined,
            search: !!that.main.config.scriptsFilter
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false,
            afterSearch:   function () {
                that.initButtons();
                // Save filter
                that.main.saveConfig('scriptsFilter', that.$grid.getGridParam("postData").filters);
            }
        }).navGrid('#pager-scripts', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-scripts', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                // Find last id;
                var id = 1;
                var ids = that.$grid.jqGrid('getDataIDs');
                while (ids.indexOf('script_' + id) != -1) {
                    id++;
                }
                // Find new unique name
                var found;
                var newText = _("Script");
                var idx = 1;
                do {
                    found = true;
                    for (var _id = 0; _id < ids.length; _id++) {
                        var obj = that.$grid.jqGrid('getRowData', ids[_id]);
                        if (obj && obj.name == newText + idx)  {
                            idx++;
                            found = false;
                            break;
                        }
                    }
                } while (!found);
                var name = newText + idx;
                var instance = '';
                var engineType = '';

                // find first instance
                for (var i = 0; i < that.main.instances.length; i++) {
                    if (that.main.objects[that.main.instances[i]] && that.main.objects[that.main.instances[i]] && that.main.objects[that.main.instances[i]].common.engineTypes) {
                        instance = that.main.instances[i];
                        if (typeof that.main.objects[main.instances[i]].common.engineTypes == 'string') {
                            engineType = that.main.objects[that.main.instances[i]].common.engineTypes;
                        } else {
                            engineType = that.main.objects[that.main.instances[i]].common.engineTypes[0];
                        }
                        break;
                    }
                }

                that.main.socket.emit('setObject', 'script.js.' + name.replace(/ /g, '_').replace(/\./g, '_'), {
                    common: {
                        name:       name,
                        engineType: engineType,
                        source:     '',
                        enabled:    false,
                        engine:     instance
                    },
                    type: 'script'
                });
            },
            position: 'first',
            id:       'add-script',
            title:    _('new script'),
            cursor:   'pointer'
        });

        this.$dialog.dialog({
            autoOpen:   false,
            modal:      true,
            width: 800,
            height: 540,
            buttons: [
                {
                    id: 'script-edit-button-save',
                    text: _('Save'),
                    click: function () {
                        that.saveScript();
                    }
                },
                {
                    id: 'script-edit-button-cancel',
                    text: _('Cancel'),
                    click: function () {
                        that.$dialog.dialog('close');
                    }
                }
            ],
            beforeClose: function () {
                if (that.changed) {
                    return confirm(_('Are you sure? Changes are not saved.'));
                }
                var pos = $(this).parent().position();
                that.main.saveConfig('scripts-edit-top',  pos.top);
                that.main.saveConfig('scripts-edit-left', pos.left);

                return true;
            },
            resize: function () {
                that.main.saveConfig('scripts-edit-width',  $(this).parent().width());
                that.main.saveConfig('scripts-edit-height', $(this).parent().height() + 10);
                that.editor.resize();
            }
        });

        $("#load_grid-scripts").show();
    };

    this.resize = function (width, height) {
        //if (this.$grid) this.$grid.height(height - 150).width(width - 20);
        if (this.$grid) this.$grid.setGridHeight(height - 150).setGridWidth(width - 20);
    };

    // Find all script engines
    this.fillEngines = function (id) {
        var engines = [];
        for (var t = 0; t < main.instances.length; t++) {
            if (main.objects[main.instances[t]] && main.objects[main.instances[t]].common && main.objects[main.instances[t]].common.engineTypes) {
                var engineTypes = main.objects[main.instances[t]].common.engineTypes;
                if (typeof engineTypes == 'string') {
                    if (engines.indexOf(engineTypes) == -1) engines.push(engineTypes);
                } else {
                    for (var z = 0; z < engineTypes.length; z++) {
                        if (engines.indexOf(engineTypes[z]) == -1) engines.push(engineTypes[z]);
                    }
                }
            }
        }
        if (id) {
            var text = '';
            for (var u = 0; u < engines.length; u++) {
                text += '<option value="' + engines[u] + '">' + engines[u] + '</option>';
            }
            $('#' + id).html(text);
        }
        return engines;
    }

    this.onEditLine = function (id) {
        $('#add-script').addClass('ui-state-disabled');
        $('.script-edit-submit').hide();
        $('.script-edit-file-submit').hide();
        $('.script-delete-submit').hide();
        $('.script-reload-submit').hide();
        $('.script-ok-submit[data-script-id="' + id + '"]').show();
        $('.script-cancel-submit[data-script-id="' + id + '"]').show();

        var list = {};
        for (var i = 0; i < this.main.instances.length; i++) {
            if (this.main.instances[i].indexOf('.javascript.') != -1) {
                list[this.main.instances[i]] = this.main.instances[i];
            }
        }

        this.$grid.setColProp('engine', {
            editable:    true,
            edittype:    'select',
            editoptions: {value: list},
            align:       'center'
        });

        this.$grid.jqGrid('editRow', 'script_' + id, {"url": "clientArray"});
    }

    this.updateScript = function (id, newCommon) {
        this.main.socket.emit('getObject', id, function (err, _obj) {
            setTimeout(function () {
                var obj = {common: {}};

                if (newCommon.engine  !== undefined) obj.common.engine  = newCommon.engine;
                if (newCommon.enabled !== undefined) obj.common.enabled = newCommon.enabled;

                if (obj.common.enabled === 'true')  obj.common.enabled = true;
                if (obj.common.enabled === 'false') obj.common.enabled = false;

                if (newCommon.source !== undefined) obj.common.source = newCommon.source;

                if (_obj && _obj.common && newCommon.name == _obj.common.name && (newCommon.engineType === undefined || newCommon.engineType == _obj.common.engineType)) {
                    that.main.socket.emit('extendObject', id, obj);
                } else {
                    var prefix;

                    _obj.common.engineType = newCommon.engineType || _obj.common.engineType || 'Javascript/js';
                    var parts = _obj.common.engineType.split('/');

                    prefix = 'script.' + (parts[1] || parts[0]) + '.';

                    if (_obj) {
                        that.main.socket.emit('delObject', _obj._id);
                        if (obj.common.engine  !== undefined) _obj.common.engine  = obj.common.engine;
                        if (obj.common.enabled !== undefined) _obj.common.enabled = obj.common.enabled;
                        if (obj.common.source  !== undefined) _obj.common.source  = obj.common.source;
                        if (obj.common.name    !== undefined) _obj.common.name    = obj.common.name;
                        delete _obj._rev;
                    } else {
                        _obj = obj;
                    }
                    // Name must always exist
                    _obj.common.name = newCommon.name;

                    _obj._id = prefix + newCommon.name.replace(/ /g, '_').replace(/\./g, '_');
                    that.main.socket.emit('setObject', _obj._id, _obj);
                }
            }, 0);
        });
    }

    this.init = function (update) {
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init(update);
            }, 250);
            return;
        }

        if (!this.editor) {
            this.editor = ace.edit("script-editor");
            //this.editor.setTheme("ace/theme/monokai");
            this.editor.getSession().setMode("ace/mode/javascript");
            $('#edit-insert-id').button({
                icons: {primary: 'ui-icon-note'}
            }).css('height', '30px').click(function () {
                var sid = that.main.initSelectId();
                sid.selectId('show', function (newId) {
                    that.editor.insert('"' + newId + '"' + ((that.main.objects[newId] && that.main.objects[newId].common && that.main.objects[newId].common.name) ? ('/*' + that.main.objects[newId].common.name + '*/') : ''));
                    that.editor.focus();
                });
            });
            this.editor.on('input', function() {
                that.changed = true;
                $('#script-edit-button-save').button('enable');
            });
        }

        if (update || typeof this.$grid != 'undefined' && !this.$grid[0]._isInited) {
            this.$grid[0]._isInited = true;
            this.$grid.jqGrid('clearGridData');
            var id = 1;

            this.list.sort();
            for (var i = 0; i < this.list.length; i++) {
                var obj = main.objects[this.list[i]];
                if (!obj) continue;

                this.$grid.jqGrid('addRowData', 'script_' + id, {
                    _id:        id,
                    _obj_id:    obj._id,
                    name:       obj.common ? obj.common.name     : '',
                    engineType: obj.common ? obj.common.engineType : '',
                    enabled:    obj.common ? obj.common.enabled  : '',
                    engine:     obj.common ? obj.common.engine   : '',
                    commands:
                        '<button data-script-id="' + id + '" class="script-edit-submit">'      + _('edit')   + '</button>' +
                        '<button data-script-id="' + id + '" class="script-edit-file-submit">' + _('edit file') + '</button>' +
                        '<button data-script-id="' + id + '" class="script-reload-submit">'    + _('restart script') + '</button>' +
                        '<button data-script-id="' + id + '" class="script-delete-submit">'    + _('delete') + '</button>' +
                        '<button data-script-id="' + id + '" class="script-ok-submit"     style="display:none">' + _('ok')     + '</button>' +
                        '<button data-script-id="' + id + '" class="script-cancel-submit" style="display:none">' + _('cancel') + '</button>'
                });
                id++;
            }
            this.$grid.trigger('reloadGrid');
            this.initButtons();
        }
    }

    this.initButtons = function () {
        $('.script-edit-submit').unbind('click').button({
            icons: {primary: 'ui-icon-pencil'},
            text:  false
        }).click(function () {
            that.onEditLine($(this).attr('data-script-id'));
        });

        $('.script-edit-file-submit').unbind('click').button({
            icons: {primary: 'ui-icon-note'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-script-id');
            var objSelected = that.$grid.jqGrid('getRowData', 'script_' + id);
            if (objSelected) that.editScript(objSelected._obj_id);
        });

        $('.script-reload-submit').unbind('click').button({
            icons: {primary: 'ui-icon-refresh'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-script-id');
            var objSelected = that.$grid.jqGrid('getRowData', 'script_' + id);
            that.main.socket.emit('extendObject', objSelected._obj_id, {});
        });

        $('.script-delete-submit').unbind('click').button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-script-id');
            var objNew = that.$grid.jqGrid('getRowData', 'script_' + id);

            that.main.confirmMessage(_('Are you sure to delete script %s?', objNew.name), null, 'help', function (result) {
                if (result) that.main.socket.emit('delObject', objNew._obj_id);
            });

            //that.$grid.jqGrid('delRowData', 'script_' + id);
        });

        $('.script-ok-submit').unbind('click').button({
            icons: {primary: 'ui-icon-check'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-script-id');
            $('.script-edit-submit').show();
            $('.script-edit-file-submit').show();
            $('.script-delete-submit').show();
            $('.script-reload-submit').show();
            $('.script-ok-submit').hide();
            $('.script-cancel-submit').hide();
            $('#add-script').removeClass('ui-state-disabled');

            that.$grid.jqGrid('saveRow', 'script_' + id, {"url": "clientArray"});
            // afterSave
            setTimeout(function () {
                var objNew = that.$grid.jqGrid('getRowData', 'script_' + id);
                that.updateScript(objNew._obj_id, objNew);

                /* main.socket.emit('getObject', objNew._obj_id, function (err, _obj) {
                 var obj = {common:{}};
                 obj.common.engine  = objNew.engine;
                 obj.common.enabled = objNew.enabled;
                 if (obj.common.enabled === 'true')  obj.common.enabled = true;
                 if (obj.common.enabled === 'false') obj.common.enabled = false;

                 if (_obj && _obj.common && objNew.name == _obj.common.name) {
                 main.socket.emit('extendObject', objNew._obj_id, obj);
                 } else {
                 var prefix = 'script.js.';
                 if (_obj) {
                 var parts = _obj._id.split('.', 3);
                 prefix = 'script.' + parts[1] + '.';
                 main.socket.emit('delObject', _obj._id);
                 _obj.common.engine  = obj.common.engine;
                 _obj.common.enabled = obj.common.enabled;
                 delete _obj._rev;
                 } else {
                 _obj = obj;
                 }
                 _obj.common.name = objNew.name;
                 _obj.common.platform = _obj.common.platform || 'Javascript/Node.js';

                 _obj._id         = prefix + objNew.name.replace(/ /g, '_').replace(/\./g, '_');
                 main.socket.emit('setObject', _obj._id, _obj)
                 }
                 });*/
            }, 100);
        });

        $('.script-cancel-submit').unbind('click').button({
            icons: {primary: 'ui-icon-close'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-script-id');
            $('.script-edit-submit').show();
            $('.script-edit-file-submit').show();
            $('.script-reload-submit').show();
            $('.script-delete-submit').show();
            $('.script-ok-submit').hide();
            $('.script-cancel-submit').hide();
            $('#add-script').removeClass('ui-state-disabled');
            that.$grid.jqGrid('restoreRow', 'script_' + id, false);
        });
    }

    this.editScript = function (id) {

        var engines = this.fillEngines('edit-script-engine-type');

        if (id) {
            var obj = main.objects[id];
            var width = 800;
            var height = 540;

            if (this.main.config['scripts-edit-width'])  width  = this.main.config['scripts-edit-width'];
            if (this.main.config['scripts-edit-height']) height = this.main.config['scripts-edit-height'];

            this.$dialog.dialog('option', 'title', id);
            $('#edit-script-id').val(obj._id);
            $('#edit-script-name').val(obj.common.name);
            // Add engine even if it is not installed
            if (engines.indexOf(obj.common.engineType) == -1) $('#edit-script-engine-type').append('<option value="' + obj.common.engineType + '">' + obj.common.engineType + '</option>');
            $('#edit-script-engine-type').val(obj.common.engineType);

            if (obj.common.engineType.match(/^[jJ]ava[sS]cript/)) {
                this.editor.getSession().setMode("ace/mode/javascript");
            } else if (obj.common.engineType.match(/^[cC]offee[sS]cript/)) {
                this.editor.getSession().setMode("ace/mode/coffee");
            }

            this.changed = false;

            //$('#edit-script-source').val(obj.common.source);
            this.editor.setValue(obj.common.source);
            this.$dialog
                .dialog('option', 'width',  width)
                .dialog('option', 'height', height)
                .dialog('open');

            if (this.main.config['scripts-edit-top'])  this.$dialog.parent().css({top:  this.main.config['scripts-edit-top']});
            if (this.main.config['scripts-edit-left']) this.$dialog.parent().css({left: this.main.config['scripts-edit-left']});
            this.editor.resize();
            setTimeout(function () {
                that.changed = false;
                $('#script-edit-button-save').button('disable');
            }, 100);
        } else {
            that.main.showMessage(_('This should never come!'), '', 'alert');
            /*// Should never come
             that.$dialog.dialog('option', 'title', 'new script');
             $('#edit-script-id').val('');
             $('#edit-script-name').val('');
             $('#edit-script-engine-type').val('Javascript');
             //$('#edit-script-source').val('');
             this.editor.setValue('');
             that.$dialog.dialog('open');*/
        }
    }

    this.saveScript = function () {
        that.changed = false;
        $('#script-edit-button-save').button('disable');
        var obj = {};
        obj._id        = $('#edit-script-id').val();
        obj.name       = $('#edit-script-name').val();
        obj.source     = this.editor.getValue();
        obj.engineType = $('#edit-script-engine-type').val() || '';

        this.updateScript(obj._id, obj);
        that.$dialog.dialog('close');
    }
}