function Objects(main) {
    "use strict";

    var that = this;
    this.$dialog        = $('#dialog-object');
    this.$dialogHistory = $('#dialog-history');
    this.$dialogSyncClient = $('#dialog-sync-client');

    this.$grid          = $('#grid-objects');

    this.main = main;
    this.historyEnabled = null;
    this.syncClientEnabled = null;
    this.currentHistory = null; // Id of the currently shown history dialog

    this.prepare = function () {
        this.$dialog.dialog({
            autoOpen:   false,
            modal:      true,
            width:      870,
            height:     640,
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

                    if (!obj) return false;

                    that.editor.setValue(JSON.stringify(obj, null, 2));
                } else if (ui.oldPanel.selector == '#object-tab-raw') {
                    var _obj;
                    try {
                        _obj = JSON.parse(that.editor.getValue());
                    } catch (e) {
                        that.main.showMessage(e, _('Parse error'), 'alert');
                        $('#object-tabs').tabs({active: 4});
                        return false;
                    }
                    that.load(_obj);
                }
                return true;
            }
        });

        if (!that.editor) {
            that.editor = ace.edit("view-object-raw");
            that.editor.getSession().setMode("ace/mode/json");
            that.editor.$blockScrolling = true;
        }

        $('#dialog-new-field').dialog({
            autoOpen:   false,
            modal:      true,
            width:      400,
            height:     160,
            buttons: [
                {
                    id: 'dialog-object-tab-new',
                    text: _('Ok'),
                    click: function () {
                        var $tab = $('#object-tab-new-name');
                        var type  = $tab.data('type') || 'common';
                        var field = $tab.val().trim();
                        var obj   = that.saveFromTabs();

                        if (!field || field.indexOf(' ') != -1) {
                            that.main.showError(_('Invalid field name: %s', field));
                            return;
                        }
                        if (obj[type][field] !== undefined) {
                            that.main.showError(_('Field %s yet exists!', field));
                            return;
                        }

                        obj[type][field] = '';

                        that.load(obj);

                        $('#dialog-new-field').dialog('close');
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        $('#dialog-new-field').dialog('close');
                        $('#object-tab-new-name').val('');
                    }
                }
            ]
        });

        $('#dialog-new-object').dialog({
            autoOpen:   false,
            modal:      true,
            width:      520,
            height:     250,
            buttons: [
                {
                    id: 'dialog-object-tab-new',
                    text: _('Ok'),
                    click: function () {
                        var name  = $('#object-tab-new-object-name').val();
                        var id    = name.trim();
                        var parent = $('#object-tab-new-object-parent').val();
                        id = parent ? parent + '.' + id : id;

                        var type  = $('#object-tab-new-object-type').val();
                        var stype = $('#object-tab-new-state-type').val();
                        id = id.replace(/\s/g, '_');

                        if (that.main.objects[id]) {
                            that.main.showError(_('Object "%s" yet exists!', id));
                            return;
                        }

                        var obj;
                        // = name.split('.').pop();
                        if (type == 'state') {
                            obj = {
                                _id:   id,
                                type: 'state',
                                common: {
                                    name: name,
                                    role: '',
                                    type: stype,
                                    read: true,
                                    write: true,
                                    desc: _('Manually created')
                                },
                                native: {}
                            };
                            if (stype == 'boolean') {
                                obj.common.def = false;
                            } else if (stype == 'switch') {
                                obj.common.type   = 'boolean';
                                obj.common.def    = false;
                                obj.common.states = 'false:no;true:yes';
                            } else if (stype == 'string') {
                                obj.common.def = '';
                            } else if (stype == 'number') {
                                obj.common.min  = 0;
                                obj.common.max  = 100;
                                obj.common.def  = 0;
                                obj.common.unit = '%';
                            } else if (stype == 'enum') {
                                obj.common.type   = 'number';
                                obj.common.min    = 0;
                                obj.common.max    = 5;
                                obj.common.def    = 0;
                                obj.common.states = '0:zero;1:one;2:two;3:three;4:four;5:five';
                            }
                        } else if (type == 'channel') {
                            obj = {
                                _id:   id,
                                type: 'channel',
                                common: {
                                    name: name,
                                    role: '',
                                    icon: '',
                                    desc: _('Manually created')
                                },
                                native: {}
                            };
                        } else {
                            obj = {
                                _id:   id,
                                type: 'device',
                                common: {
                                    name: name,
                                    role: '',
                                    icon: '',
                                    desc: _('Manually created')
                                },
                                native: {}
                            };
                        }

                        that.main.socket.emit('setObject', id, obj, function (err) {
                            if (err) {
                                that.main.showError(err);
                                return;
                            }
                            setTimeout(function () {
                                that.edit(id, function (_obj) {
                                    if (_obj.type == 'state') {
                                        // create state
                                        that.main.socket.emit('setState', _obj._id, _obj.common.def === undefined ? null : _obj.common.def, true);
                                    }
                                });
                            }, 1000);
                        });

                        $('#dialog-new-object').dialog('close');
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        $('#dialog-new-object').dialog('close');
                        $('#object-tab-new-object-name').val('');
                    }
                }
            ]
        });

        $('#object-tab-new-object-type').change(function () {
            if ($(this).val() == state) {
                $('#object-tabe-new-object-tr').show();
            } else {
                $('#object-tabe-new-object-tr').hide();
            }
        });

        $('#object-tab-new-name').keydown(function (e) {
            if (e.keyCode == 13) {
                $('#dialog-object-tab-new').trigger('click');
            }
        });

        $('#object-tab-new-common').button({
            icons: {primary: 'ui-icon-plus'}
        }).click(function () {
            $('#object-tab-new-name').data('type', 'common');
            $('#dialog-new-field').dialog('open');
        });

        $('#object-tab-new-native').button({
            icons: {primary: 'ui-icon-plus'}
        }).click(function () {
            $('#object-tab-new-name').data('type', 'native');
            $('#dialog-new-field').dialog('open');
        });
    };

    function loadObjectFields(htmlId, object, part, objectType) {
        var text = '';
        for (var attr in object) {
            text += '<tr><td>' + attr + '</td><td>';
            if (objectType == 'state' && part == 'common' && attr == 'type') {
                text += '<select class="object-tab-edit-string" data-attr="' + attr + '">' +
                    '<option value="boolean" ' + (object[attr] == 'boolean' ? 'selected' : '') + '>' + _('boolean') + '</option>' +
                    '<option value="string"  ' + (object[attr] == 'string'  ? 'selected' : '') + '>' + _('string')  + '</option>' +
                    '<option value="number"  ' + (object[attr] == 'number'  ? 'selected' : '') + '>' + _('number')  + '</option>' +
                    '<option value="array"   ' + (object[attr] == 'array'   ? 'selected' : '') + '>' + _('array')   + '</option>' +
                    '<option value="object"  ' + (object[attr] == 'object'  ? 'selected' : '') + '>' + _('object')  + '</option>' +
                    '<option value="mixed"   ' + (object[attr] == 'mixed'   ? 'selected' : '') + '>' + _('mixed')   + '</option>' +
                    '</select>';
            } else if (typeof object[attr] == 'string') {
                text += '<input type="text" class="object-tab-edit-string" style="width: 100%" data-attr="' + attr + '" value="' + object[attr] + '" />';
            } else if (typeof object[attr] == 'number') {
                text += '<input type="text" class="object-tab-edit-number" style="width: 100%" data-attr="' + attr + '" value="' + object[attr] + '" />';
            } else if (typeof object[attr] == 'boolean') {
                text += '<input type="checkbox" class="object-tab-edit-boolean" data-attr="' + attr + '" ' + (object[attr] ? 'checked' : '') + ' />';
            } else {
                text += '<textarea class="object-tab-edit-object"  style="width: 100%" rows="3" data-attr="' + attr + '">' + JSON.stringify(object[attr], null, 2) + '</textarea>';
            }
            text += '</td><td><button class="object-tab-field-delete" data-attr="' + attr + '" data-part="' + part + '"></button></td></tr>';
        }

        $('#' + htmlId).html(text);
    }

    function saveObjectFields(htmlId, object) {
        var $htmlId = $('#' + htmlId);
        $htmlId.find('.object-tab-edit-string').each(function () {
            object[$(this).data('attr')] = $(this).val();
        });
        $htmlId.find('.object-tab-edit-number').each(function () {
            object[$(this).data('attr')] = parseFloat($(this).val());
        });
        $htmlId.find('.object-tab-edit-boolean').each(function () {
            object[$(this).data('attr')] = $(this).prop('checked');
        });
        var err = null;
        $htmlId.find('.object-tab-edit-object').each(function () {
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

    function _syncEnum(id, enumIds, newArray, cb) {
        if (!enumIds || !enumIds.length) {
            cb && cb();
            return;
        }

        var enumId = enumIds.pop();
        if (that.main.objects[enumId] && that.main.objects[enumId].common) {
            var count = 0;
            if (that.main.objects[enumId].common.members && that.main.objects[enumId].common.members.length) {
                var pos = that.main.objects[enumId].common.members.indexOf(id);
                if (pos !== -1 && newArray.indexOf(enumId) === -1) {
                    // delete from members
                    that.main.objects[enumId].common.members.splice(pos, 1);
                    count++;
                    main.socket.emit('setObject', enumId, that.main.objects[enumId], function (err) {
                        if (err) that.main.showError(err);
                        if (!--count) {
                            setTimeout(function () {
                                _syncEnum(id, enumIds, newArray, cb);
                            }, 0);
                        }
                    });
                }
            }

            // add to it
            if (newArray.indexOf(enumId) !== -1 && (!that.main.objects[enumId].common.members || that.main.objects[enumId].common.members.indexOf(id) === -1)) {
                // add to object
                that.main.objects[enumId].common.members = that.main.objects[enumId].common.members || [];
                that.main.objects[enumId].common.members.push(id);
                count++;
                main.socket.emit('setObject', enumId, that.main.objects[enumId], function (err) {
                    if (err) that.main.showError(err);
                    if (!--count) {
                        setTimeout(function () {
                            _syncEnum(id, enumIds, newArray, cb);
                        }, 0);
                    }
                });
            }
        }

        if (!count) {
            setTimeout(function () {
                _syncEnum(id, enumIds, newArray, cb);
            }, 0);
        }
    }

    function syncEnum(id, enumName, newArray) {
        var enums = that.main.tabs.enums.list;
        var toCheck = [];
        for (var e = 0; e < enums.length; e++) {
            if (enums[e].substring(0, 'enum.'.length + enumName.length + 1) == 'enum.' + enumName + '.') {
                toCheck.push(enums[e]);
            }
        }

        _syncEnum(id, toCheck, newArray, function (err) {
            if (err) that.main.showError(err);
            // force update of object
            that.$grid.selectId('object', id, that.main.objects[id]);
        });
    }

    this.init = function (update) {
        if (!main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }

        if (typeof this.$grid !== 'undefined' && (!this.$grid[0]._isInited || update)) {
            this.$grid[0]._isInited = true;
            if (this.historyEnabled === null) this.checkHistory();
            if (this.syncClientEnabled === null) this.checkSyncClient();

            var x = $(window).width();
            var y = $(window).height();
            if (x < 720) x = 720;
            if (y < 480) y = 480;

            that.$grid.height(y - 100).width(x - 20);

            var settings = {
                objects:  main.objects,
                states:   main.states,
                noDialog: true,
                name:     'admin-objects',
                showButtonsForNotExistingObjects: true,
                expertModeRegEx: /^system\.|^iobroker\.|^_|^[\w-]+$|^enum\.|^[\w-]+\.admin|^script\./,
                texts: {
                    select:   _('Select'),
                    cancel:   _('Cancel'),
                    all:      _('All'),
                    id:       _('ID'),
                    name:     _('Name'),
                    role:     _('Role'),
                    room:     _('Room'),
                    'function': _('Function'),
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
                    without:  _('Without'),
                    copyToClipboard: _('Copy to clipboard'),
                    expertMode: _('Toggle expert mode'),
                    refresh:	_('Update')
                },
                columns: ['image', 'name', 'type', 'role', 'room', 'function', 'value', 'button'],
                buttons: [
                    {
                        text: false,
                        icons: {
                            primary:'ui-icon-gear'
                        },
                        click: function (id) {
                            that.edit(id);
                        },
                        match: function (id) {
                            if (!that.main.objects[id]) this[0].outerHTML = '<div style="width: 26px; height: 1px; display: inline-block;"></div>';
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
                        width:  26,
                        height: 20,
                        match: function (id) {
                            // Show history button only if history adapter enabled
                            if (main.objects[id] && that.historyEnabled && !id.match(/\.messagebox$/) && main.objects[id].type == 'state') {
                                // Check if history enabled
                                var enabled = false;
                                if (main.objects[id] && main.objects[id].common && main.objects[id].common.history) {
                                    if (main.objects[id].common.history.enabled !== undefined) {
                                        main.objects[id].common.history = main.objects[id].common.history.enabled ? {'history.0': main.objects[id].common.history} : {};
                                    }
                                    for (var h in main.objects[id].common.history) {
                                        enabled = true;
                                        break;
                                    }
                                }
                                if (enabled) {
                                    this.addClass('history-enabled').removeClass('history-disabled');
                                } else {
                                    delete main.objects[id].common.history;
                                    this.addClass('history-disabled').removeClass('history-enabled');
                                }
                            } else {
                                this.hide();
                            }
                        }
                    },
                    {
                        text: false,
                        icons: {
                            primary:'ui-icon-transferthick-e-w'
                        },
                        click: function (id) {
                            that.openSyncClientDlg(id);
                        },
                        width:  26,
                        height: 20,
                        match: function (id) {
                            // Show sync-client button only if sync-client adapter enabled
                            if (main.objects[id] && that.syncClientEnabled && !id.match(/\.messagebox$/) && main.objects[id].type == 'state') {
                                // Check if sync-client enabled
                                var enabled = false;
                                if (main.objects[id] && main.objects[id].common && main.objects[id].common.sync) {
                                    for (var h in main.objects[id].common.sync) {
                                        enabled = true;
                                        break;
                                    }
                                }
                                if (enabled) {
                                    this.addClass('sync-client-enabled').removeClass('sync-client-disabled');
                                } else {
                                    delete main.objects[id].common.sync;
                                    this.addClass('sync-client-disabled').removeClass('sync-client-enabled');
                                }
                            } else {
                                this.hide();
                            }
                        }
                    }

                ],
                panelButtons: [
                    {
                        text: false,
                        icons: {
                            primary: 'ui-icon-plus'
                        },
                        title: _('Add new child object to selected parent'),
                        click: function () {
                            var id = that.$grid.selectId('getActual') || '';
                            $('#object-tab-new-object-parent').val(id);
                            $('#object-tab-new-object-name').val(_('newObject'));

                            if (that.main.objects[id] && that.main.objects[id].type == 'device') {
                                $('#object-tab-new-object-type').val('channel');
                            } else if (that.main.objects[id] && that.main.objects[id].type == 'channel') {
                                $('#object-tab-new-object-type').val('state');
                            } else {
                                $('#object-tab-new-object-type').val('state');
                            }

                            $('#dialog-new-object')
                                .dialog('open')
                                .dialog('option', 'title', _('Add new object: %s', (id ? id + '.' : '') + _('newObject')));
                        }
                    },
                    {
                        text: false,
                        id:   'add_object_tree',
                        icons: {
                            primary: 'ui-icon-arrowthickstop-1-n'
                        },
                        title: _('Add Objecttree from JSON File'),
                        click: function () {
                            var id = that.$grid.selectId('getActual') || '';
                            var input = document.createElement('input');
                            input.setAttribute('type', 'file');
                            input.setAttribute('id', 'files');
                            input.setAttribute('opacity', 0);
                            input.addEventListener('change', function (e) {
                                handleFileSelect(e, function () {});
                            }, false);
                            (input.click)();
                        }
                    },
                    {
                        text: false,
                        id:   'save_object_tree',
                        icons: {
                            primary: 'ui-icon-arrowthickstop-1-s'
                        },
                        title: _('Save Objecttree as JSON File'),
                        click: function () {
                            var id = that.$grid.selectId('getActual') || '';
                            var result = {};
                            $.map(that.main.objects, function (val, key) {
                                if (key.search(id) == 0) result[key] = val;
                            });
                            if (result != undefined) {
                                window.open('data:application/iobroker; content-disposition=attachment; filename=' + id + '.json,' + JSON.stringify(result));
                            } else {
                                alert(_('Save of objects-tree is not possible'));
                            }
                        }
                    }
                ],
                 /*dblclick: function (id) {
                    that.edit(id);
                },*/
                quickEdit: ['name', 'value', 'role', 'function', 'room'],
                quickEditCallback: function (id, attr, newValue, oldValue) {
                    if (attr === 'room') {
                        syncEnum(id, 'rooms', newValue);
                    } else if (attr === 'function') {
                        syncEnum(id, 'functions', newValue);
                    } else
                    if (attr === 'value') {
                        if (newValue === 'true') newValue = true;
                        if (newValue === 'false') newValue = false;
                        if (parseFloat(newValue).toString() == newValue) newValue = parseFloat(newValue);

                        main.socket.emit('setState', id, newValue, function (err) {
                            if (err) return that.main.showError(err);
                        });
                    } else {
                        main.socket.emit('getObject', id, function (err, _obj) {
                            if (err) return that.main.showError(err);

                            _obj.common[attr] = newValue;
                            main.socket.emit('setObject', _obj._id, _obj, function (err) {
                                if (err) that.main.showError(err);
                            });
                        });
                    }
                }
            };

            $('#object-tab-new-object-name').keyup(function () {
                $(this).trigger('change');
            }).change(function () {
                var parent = $('#object-tab-new-object-parent').val();
                var id = $('#object-tab-new-object-name').val();
                id = parent ? parent + '.' + id : id;

                $('#dialog-new-object').dialog('option', 'title', _('Add new object: %s', id));
            });

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
                };
            } else {
                settings.customButtonFilter = null;
            }

            that.$grid.selectId('init', settings).selectId('show');
        }
    };

    this.edit = function (id, callback) {
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
        var text = '';
        for (var u = 0; u < that.main.tabs.users.list.length; u++) {
            text += '<option value="' + that.main.tabs.users.list[u] + '">' + (that.main.objects[that.main.tabs.users.list[u]].common.name || that.main.tabs.users.list[u]) + '</option>';
        }
        $('#object-tab-acl-owner').html(text);

        // fill groups
        text = '';
        for (u = 0; u < that.main.tabs.groups.list.length; u++) {
            text += '<option value="' + that.main.tabs.groups.list[u] + '">' + (that.main.objects[that.main.tabs.groups.list[u]].common.name || that.main.tabs.groups.list[u]) + '</option>';
        }
        $('#object-tab-acl-group').html(text);
        that.load(obj);

        that.$dialog.data('cb', callback);

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

        loadObjectFields('object-tab-common-table', obj.common || {}, 'common', obj.type);
        loadObjectFields('object-tab-native-table', obj.native || {}, 'native', obj.type);

        $('.object-tab-field-delete').button({
            icons: {primary: 'ui-icon-trash'},
            text: false
        }).click(function () {
            var part  = $(this).data('part');
            var field = $(this).data('attr');
            that.main.confirmMessage(_('Are you sure?'), _('Delete attribute'), 'alert', function (result) {
                if (result) {
                    var _obj  = that.saveFromTabs();
                    delete _obj[part][field];
                    that.load(_obj);
                }
            });
        }).css({width: 22, height: 22});

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
    };

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
            var _obj = that.saveFromRaw();
            if (!_obj) return;

            main.socket.emit('setObject', _obj._id, _obj, function (err) {
                if (err) {
                    that.main.showError(err);
                } else {
                    var cb = that.$dialog.data('cb');
                    if (cb) cb(_obj);
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
                    } else {
                        var cb = that.$dialog.data('cb');
                        if (cb) cb(obj);
                    }
                });
            });


            that.$dialog.dialog('close');
        }
    };

    // ----------------------------- Sync-Client ------------------------------------------------
    this.checkSyncClient = function () {
        var found = false;
        for (var u = 0; u < this.main.instances.length; u++) {
            if (this.main.objects[this.main.instances[u]].common &&
                this.main.objects[this.main.instances[u]].common.type === 'sync' &&
                this.main.objects[this.main.instances[u]].common.enabled) {
                if (this.syncClientEnabled !== null && this.syncClientEnabled !== true) {
                    this.syncClientEnabled = true;
                    // update sync-client buttons
                    this.init(true);
                } else {
                    this.syncClientEnabled = true;
                }
                found = true;
                return;
            }
        }
        if (this.syncClientEnabled !== null && this.syncClientEnabled !== false) {
            this.syncClientEnabled = false;
            // update sync-client buttons
            this.init(true);
        } else {
            this.syncClientEnabled = false;
        }
    };

    this.prepareSyncClient = function () {
        $(document).on('click', '.sync-client', function () {
            that.openSyncClientDlg($(this).attr('data-id'));
        });

        this.$dialogSyncClient.dialog({
            autoOpen:      false,
            modal:         true,
            width:         830,
            height:        575,
            closeOnEscape: false,
            buttons: [
                {
                    id: 'sync-client-button-save',
                    text: _('Save'),
                    click: function () {
                        var $tabs = $('#sync-client-tabs');
                        var ids = $tabs.data('ids');

                        var wordDifferent = _('__different__');
                        // collect default values
                        var $inputs = $tabs.find('input, select');

                        $inputs.each(function () {
                            var instance = $(this).data('instance');
                            var field    = $(this).data('field');
                            if (!field) return;

                            var val;
                            if ($(this).attr('type') == 'checkbox') {
                                if (this.indeterminate) return;
                                val = $(this).prop('checked');
                            } else {
                                val = $(this).val();
                            }
                            // if not changed
                            if (val == wordDifferent) return;

                            if (val === 'false') val = false;
                            if (val === 'true')  val = true;
                            if (val == parseFloat(val).toString()) val = parseFloat(val);

                            for (var i = 0; i < ids.length; i++) {
                                that.main.objects[ids[i]].common.sync = that.main.objects[ids[i]].common.sync || {};
                                if (that.main.objects[ids[i]].common.sync[instance] === undefined) {
                                    var adapter = instance.split('.')[0];
                                    var _default;
                                    // Try to get default values
                                    if (defaults[adapter]) {
                                        _default = defaults[adapter](that.main.objects[ids[i]], that.main.objects['system.adapter.' + instance]);
                                    } else {
                                        _default = that.defaults[adapter];
                                    }
                                    that.main.objects[ids[i]].common.sync[instance] = _default || {};
                                }
                                that.main.objects[ids[i]].common.sync[instance][field] = val;
                            }
                        });

                        for (var i = 0; i < ids.length; i++) {
                            var found = false;
                            for (var inst in main.objects[ids[i]].common.sync) {
                                if (!main.objects[ids[i]].common.sync[inst].enabled) {
                                    delete main.objects[ids[i]].common.sync[inst];
                                } else {
                                    found = true;
                                }
                            }
                            if (!found) {
                                main.objects[ids[i]].common.sync = null;
                            }
                        }

                        that.setSyncClient(ids, function () {
                            that.$dialogSyncClient.dialog('close');
                        });
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        if (!$('#sync-client-button-save').is(":disabled")) {
                            that.main.confirmMessage(_('Are you sure? Changes are not saved.'), _('Question'), 'alert', function (result) {
                                if (result) {
                                    that.$dialogSyncClient.dialog('close');
                                }
                            });
                        } else {
                            that.$dialogSyncClient.dialog('close');
                        }
                    }
                }
            ]
        });
    };

    // Set modified sync-client states
    this.setSyncClient = function (ids, callback) {
        var id = ids.pop();
        if (id) {
            this.$dialogSyncClient.dialog('option', 'title', _('Sync settings of %s states', ids.length));

            that.main.socket.emit('setObject', id, this.main.objects[id], function (err) {
                if (err) {
                    that.main.showMessage(_(err));
                } else {
                    setTimeout(function () {
                        that.setSyncClient(ids, callback);
                    }, 50);
                }
            });
        } else {
            if (callback) callback();
        }
    };

    this.initSyncClientTabs = function (ids, instances) {
        var $syncClientTabs = $('#sync-client-tabs');
        $syncClientTabs.html('');
        this.defaults = {};
        var wordDifferent = _('__different__');
        // add all tabs to div
        for (var j = 0; j < instances.length; j++) {
            // try to find settings
            var parts    = instances[j].split('.');
            var adapter  = parts[2];
            var instance = parts[3];
            var tab = '<div class="sync-client-row-title ui-widget-header">' + _('Settings for %s', adapter + '.' + instance) + '</div><div class="sync-client-settings">' +
                $("script[data-template-name='" + adapter + "']").html() +
                '</div>';

            var $tab = $(tab);
            this.defaults[adapter] = {};

            // set values
            $tab.find('input, select').each(function () {
                var $this = $(this);
                $this.attr('data-instance', adapter + '.' + instance);
                var field = $this.attr('data-field');
                var def   = $this.attr('data-default');
                if (def === 'true')  def = true;
                if (def === 'false') def = false;
                if (def == parseFloat(def).toString()) def = parseFloat(def);

                that.defaults[adapter][field] = def;
            });
            $syncClientTabs.append($tab);
        }

        var commons = {};
        // calculate common settings
        for (var i = 0; i < instances.length; i++) {
            var inst = instances[i].replace('system.adapter.', '');
            commons[inst] = {};
            for (var id = 0; id < ids.length; id++) {
                var sett = main.objects[ids[id]].common.sync ? main.objects[ids[id]].common.sync[inst] : null;
                if (sett) {
                    for (var _attr in sett) {
                        if (commons[inst][_attr] === undefined) {
                            commons[inst][_attr] = sett[_attr];
                        } else if (commons[inst][_attr] != sett[_attr]) {
                            commons[inst][_attr] = '__different__';
                        }
                    }
                } else {
                    var a = inst.split('.')[0];
                    var _default = null;
                    // Try to get default values
                    if (defaults[a]) {
                        _default = defaults[a](that.main.objects[ids[id]], that.main.objects['system.adapter.' + inst]);
                    } else {
                        _default = this.defaults[a];
                    }

                    for (var attr in _default) {
                        if (commons[inst][attr] === undefined) {
                            commons[inst][attr] = _default[attr];
                        } else if (commons[inst][attr] != _default[attr]) {
                            commons[inst][attr] = '__different__';
                        }
                    }
                }
            }
        }

        // set values
        $syncClientTabs.find('input, select').each(function () {
            var $this    = $(this);
            var instance = $this.attr('data-instance');
            var adapter  = instance.split('.')[0];
            var attr     = $this.attr('data-field');

            if (commons[instance][attr] !== undefined) {
                if ($this.attr('type') == 'checkbox') {
                    if (commons[instance][attr] === '__different__') {
                        $this[0].indeterminate = true;
                    } else {
                        $this.prop('checked', commons[instance][attr]);
                    }
                } else {
                    if (commons[instance][attr] === '__different__') {
                        if ($this.attr('type') == 'number') {
                            $this.attr('type', 'text');
                        }
                        if ($this.prop('tagName').toUpperCase() == 'SELECT') {
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
                    if ($this.attr('type') == 'checkbox') {
                        $this.prop('checked', def);
                    } else {
                        $this.val(def);
                    }
                }
            }

            if ($this.attr('type') == 'checkbox') {
                $this.change(function () {
                    $('#sync-client-button-save').button('enable');
                });
            } else {
                $this.change(function () {
                    $('#sync-client-button-save').button('enable');
                }).keyup(function () {
                    $(this).trigger('change');
                });
            }
        });

        $('.sync-client-row-title').click(function () {
            var $form = $(this).next();
            if ($form.is(':visible')) {
                $form.hide();
            } else {
                $form.show();
            }
        });
        this.showSyncClientData(ids.length > 1 ? null : ids[0]);
        $('#sync-client-button-save').button('disable');
        translateAll();
    };

    this.openSyncClientDlg = function (ids) {
        if (typeof ids != 'object') ids = [ids];
        var instances = [];

        // clear global defaults object
        defaults = {};

        // collect all sync-client instances
        var count = 0;
        var data = '';
        var urls = [];
        for (var u = 0; u < this.main.instances.length; u++) {
            if (this.main.objects[this.main.instances[u]].common &&
                this.main.objects[this.main.instances[u]].common.type === 'sync') {
                instances.push(this.main.instances[u]);
                var url = this.main.instances[u].split('.');
                if (urls.indexOf(url[2]) == -1) {
                    urls.push(url[2]);
                    count++;
                    $.ajax({
                        headers: {
                            Accept: 'text/html'
                        },
                        cache: true,
                        url:   '/adapter/' + url[2] + '/sync.html',
                        success: function (_data) {
                            data += _data;
                            if (!--count) {
                                $('#sync-client-templates').html(data);
                                that.initSyncClientTabs(ids, instances);
                            }
                            //$("script[data-template-name='"+type+"']").html());
                        },
                        error: function (jqXHR) {
                            console.error(jqXHR.responseText);
                            if (!--count) {
                                $('#sync-client-templates').html(data);
                                that.initSyncClientTabs(ids, instances);
                            }
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
                if (this.main.objects[ids[i]].common.sync) {
                    var found = false;
                    // delete disabled entries
                    for (var h in this.main.objects[ids[i]].common.sync) {
                        if (this.main.objects[ids[i]].common.sync[h].enabled === false) {
                            delete this.main.objects[ids[i]].common.sync[h];
                        } else {
                            if (ids.length == 1) _instances.push(h);
                            found = true;
                        }
                    }
                    if (!found) {
                        delete this.main.objects[ids[i]].common.sync;
                    }
                }
            }
        }
        var title;
        if (ids.length == 1) {
            title = _('Sync settings of %s', ids[0]);
        } else {
            title = _('Sync settings of %s states', ids.length);
        }
        $('#sync-client-tabs').data('ids', ids);
        this.$dialogSyncClient.dialog('option', 'title', title);
    };

    this.showSyncClientData = function (id) {
        if (id) {
            this.$dialogSyncClient.dialog('option', 'height', 600);
            this.$dialogSyncClient.dialog('open');
        } else {
            this.$dialogSyncClient.dialog('option', 'height', 600);
            this.$dialogHistory.dialog('open');
        }
    };

    // ----------------------------- HISTORY ------------------------------------------------
    this.checkHistory = function () {
        var found = false;
        for (var u = 0; u < this.main.instances.length; u++) {
            if (this.main.objects[this.main.instances[u]].common &&
                this.main.objects[this.main.instances[u]].common.type === 'storage' &&
                this.main.objects[this.main.instances[u]].common.enabled) {
                if (this.historyEnabled !== null && this.historyEnabled !== true) {
                    this.historyEnabled = true;
                    // update history buttons
                    this.init(true);
                } else {
                    this.historyEnabled = true;
                }
                found = true;
                return;
            }
        }
        if (this.historyEnabled !== null && this.historyEnabled !== false) {
            this.historyEnabled = false;
            // update history buttons
            this.init(true);
        } else {
            this.historyEnabled = false;
        }
    };

    this.stateChangeHistory = function (id, state) {
        if (this.currentHistory === id) {
            // Load data again from adapter
            if (this.historyTimeout) return;

            this.historyTimeout = setTimeout(function () {
                that.historyTimeout = null;
                that.loadHistoryTable($('#history-table-instance').data('id'), true);
            }, 5000);
        }
    };

    this.initStorageTabs = function (ids, instances) {
        var $storageTabs = $('#storage-tabs');
        $storageTabs.html('');
        this.defaults = {};
        var wordDifferent = _('__different__');
        // add all tabs to div
        for (var j = 0; j < instances.length; j++) {
            // try to find settings
            var parts    = instances[j].split('.');
            var adapter  = parts[2];
            var instance = parts[3];
            var tab = '<div class="storage-row-title ui-widget-header">' + _('Settings for %s', adapter + '.' + instance) + '</div><div class="storage-settings">' +
                $("script[data-template-name='" + adapter + "']").html() +
                '</div>';

            var $tab = $(tab);
            this.defaults[adapter] = {};

            // set values
            $tab.find('input, select').each(function () {
                var $this = $(this);
                $this.attr('data-instance', adapter + '.' + instance);
                var field = $this.attr('data-field');
                var def   = $this.attr('data-default');
                if (def === 'true')  def = true;
                if (def === 'false') def = false;
                if (def == parseFloat(def).toString()) def = parseFloat(def);

                that.defaults[adapter][field] = def;
            });
            $storageTabs.append($tab);
        }

        var commons = {};
        // calculate common settings
        for (var i = 0; i < instances.length; i++) {
            var inst = instances[i].replace('system.adapter.', '');
            commons[inst] = {};
            for (var id = 0; id < ids.length; id++) {
                // convert old format of storage
                if (main.objects[ids[id]].common.history && main.objects[ids[id]].common.history.enabled !== undefined) {
                    main.objects[ids[id]].common.history[inst] = main.objects[ids[id]].common.history.enabled ? {'history.0': main.objects[ids[id]].common.history} : {};
                }
                var sett = main.objects[ids[id]].common.history ? main.objects[ids[id]].common.history[inst] : null;
                if (sett) {
                    for (var _attr in sett) {
                        if (commons[inst][_attr] === undefined) {
                            commons[inst][_attr] = sett[_attr];
                        } else if (commons[inst][_attr] != sett[_attr]) {
                            commons[inst][_attr] = '__different__';
                        }
                    }
                } else {
                    var a = inst.split('.')[0];
                    var _default = null;
                    // Try to get default values
                    if (defaults[a]) {
                        _default = defaults[a](that.main.objects[ids[id]], that.main.objects['system.adapter.' + inst]);
                    } else {
                        _default = this.defaults[a];
                    }

                    for (var attr in _default) {
                        if (commons[inst][attr] === undefined) {
                            commons[inst][attr] = _default[attr];
                        } else if (commons[inst][attr] != _default[attr]) {
                            commons[inst][attr] = '__different__';
                        }
                    }
                }
            }
        }

        // set values
        $storageTabs.find('input, select').each(function () {
            var $this    = $(this);
            var instance = $this.attr('data-instance');
            var adapter  = instance.split('.')[0];
            var attr     = $this.attr('data-field');

            if (commons[instance][attr] !== undefined) {
                if ($this.attr('type') == 'checkbox') {
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
                        if ($this.attr('type') == 'number') {
                            $this.attr('type', 'text');
                        }
                        if ($this.prop('tagName').toUpperCase() == 'SELECT') {
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
                    if ($this.attr('type') == 'checkbox') {
                        $this.prop('checked', def);
                    } else {
                        $this.val(def);
                    }
                }
            }

            if ($this.attr('type') == 'checkbox') {
                $this.change(function () {
                    $('#history-button-save').button('enable');
                });
            } else {
                $this.change(function () {
                    $('#history-button-save').button('enable');
                }).keyup(function () {
                    $(this).trigger('change');
                });
            }
        });

        $('.storage-row-title').click(function () {
            var $form = $(this).next();
            if ($form.is(':visible')) {
                $form.hide();
            } else {
                $form.show();
            }
            that.resizeHistory();
        });
        this.showHistoryData(ids.length > 1 ? null : ids[0]);
        $('#history-button-save').button('disable');
        translateAll();
        this.resizeHistory();
    };

    this.loadHistoryTable = function (id, isSilent) {
        var end = (new Date()).getTime() + 10000; // now
        if (!isSilent) {
            $('#grid-history-body').html('<tr><td colspan="5" style="text-align: center">' + _('Loading...') + '</td></tr>');
        }

        main.socket.emit('getHistory', id, {
            end:        end,
            count:      50,
            aggregate: 'none',
            instance:   $('#history-table-instance').val(),
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
                                '</tr>\n';
                        }
                    } else {
                        text = '<tr><td colspan="5" style="text-align: center">' + _('No data') + '</td></tr>';
                    }
                    $('#grid-history-body').html(text)
                        .data('odd', true);
                } else {
                    console.error(err);
                    $('#grid-history-body').html('<tr><td colspan="5" style="text-align: center" class="error">' + err + '</td></tr>');
                }
            }, 0);
        });
    };

    this.loadHistoryChart = function (id) {
        if (id) {
            var port = 0;
            var chart = false;
            for (var i = 0; i < this.main.instances.length; i++) {
                if (this.main.objects[main.instances[i]].common.name == 'flot' && this.main.objects[this.main.instances[i]].common.enabled) {
                    chart = 'flot';
                } else
                if (!chart && this.main.objects[main.instances[i]].common.name == 'rickshaw' && this.main.objects[this.main.instances[i]].common.enabled) {
                    chart = 'rickshaw';
                } else
                if (this.main.objects[this.main.instances[i]].common.name == 'web' && this.main.objects[this.main.instances[i]].common.enabled) {
                    port = this.main.objects[this.main.instances[i]].native.port;
                }
                if (chart === 'flot' && port) break;
            }
            var $chart = $('#iframe-history-chart');

            $chart.attr('src', 'http://' + location.hostname + ':' + port + '/' + chart + '/index.html?range=1440&zoom=true&axeX=lines&axeY=inside&_ids=' + encodeURI(id) + '&width=' + ($chart.width() - 50) + '&hoverDetail=true&height=' + ($chart.height() - 50) + '&aggregate=onchange&chartType=step&live=30&instance=' + $('#history-chart-instance').val());
        } else {
            $('#iframe-history-chart').attr('src', '');
        }
    };

    this.showHistoryData = function (id) {
        var $tabs = $('#tabs-history');

        var port  = 0;
        var chart = false;
        if (id) {
            this.$dialogHistory.dialog('option', 'height', 600);
            this.$dialogHistory.dialog('open');
            $tabs.data('id', id);

            if (!$tabs.data('inited')) {
                $tabs.data('inited', true);
                $tabs.tabs({
                    activate: function (event, ui) {
                        switch (ui.newPanel.selector) {
                            case '#tab-history-table':
                                that.loadHistoryChart();
                                break;
                            case '#tab-history-chart':
                                that.loadHistoryChart($tabs.data('id'));
                                break;
                        }
                    }
                });
            } else {
                $tabs.tabs('option', 'enabled', [1, 2]);
                $tabs.tabs({active: 0});
            }

            // Check if chart enabled and set
            for (var i = 0; i < main.instances.length; i++) {
                if (main.objects[main.instances[i]].common.name == 'flot' && main.objects[main.instances[i]].common.enabled) {
                    chart = 'flot';
                } else
                if (!chart && main.objects[main.instances[i]].common.name == 'rickshaw' && main.objects[main.instances[i]].common.enabled) {
                    chart = 'rickshaw';
                } else
                if (main.objects[main.instances[i]].common.name == 'web'      && main.objects[main.instances[i]].common.enabled) {
                    port = main.objects[main.instances[i]].native.port;
                }
                if (chart === 'flot' && port) break;
            }
            that.loadHistoryTable(id);
            $tabs.tabs('option', 'disabled', (port && chart && that.currentHistory) ? [] : [2]);
        } else {
            $tabs.tabs({active: 0});
            $tabs.tabs('option', 'disabled', [1, 2]);
            this.$dialogHistory.dialog('open');
        }
    };

    this.openHistoryDlg = function (ids) {
        if (typeof ids != 'object') ids = [ids];
        var instances = [];

        // clear global defaults object
        defaults = {};

        // collect all storage instances
        var count = 0;
        var data = '';
        var urls = [];
        for (var u = 0; u < this.main.instances.length; u++) {
            if (this.main.objects[this.main.instances[u]].common &&
                this.main.objects[this.main.instances[u]].common.type === 'storage') {
                instances.push(this.main.instances[u]);
                var url = this.main.instances[u].split('.');
                if (urls.indexOf(url[2]) == -1) {
                    urls.push(url[2]);
                    count++;
                    $.ajax({
                        headers: {
                            Accept: 'text/html'
                        },
                        cache: true,
                        url:   '/adapter/' + url[2] + '/storage.html',
                        success: function (_data) {
                            data += _data;
                            if (!--count) {
                                $('#storage-templates').html(data);
                                that.initStorageTabs(ids, instances);
                            }
                            //$("script[data-template-name='"+type+"']").html());
                        },
                        error: function (jqXHR) {
                            console.error(jqXHR.responseText);
                            if (!--count) {
                                $('#storage-templates').html(data);
                                that.initStorageTabs(ids, instances);
                            }
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
                if (this.main.objects[ids[i]].common.history) {
                    // convert old structure
                    if (this.main.objects[ids[i]].common.history.enabled !== undefined) {
                        this.main.objects[ids[i]].common.history = this.main.objects[ids[i]].common.history.enabled ? {'history.0': this.main.objects[ids[i]].common.history} : {};
                    }
                    var found = false;

                    // delete disabled entries
                    for (var h in this.main.objects[ids[i]].common.history) {
                        if (this.main.objects[ids[i]].common.history[h].enabled === false) {
                            delete this.main.objects[ids[i]].common.history[h];
                        } else {
                            if (ids.length == 1) _instances.push(h);
                            found = true;
                        }
                    }
                    if (!found) {
                        delete this.main.objects[ids[i]].common.history;
                    }
                }
            }
        }

        var title;
        if (ids.length == 1) {
            title = _('Storage of %s', ids[0]);
            this.currentHistory = _instances.length ? ids[0]: null;
            var text = '';
            for (var k = 0; k < _instances.length; k++) {
                if (this.main.objects['system.adapter.' + _instances[k]].common.enabled ||
                    (this.main.states['system.adapter.' + _instances[k] + '.alive'] && this.main.states['system.adapter.' + _instances[k] + '.alive'].val)) {
                    text += '<option value="' + _instances[k] + '" ' + (!k ? 'selected' : '') + ' >' + _instances[k] + '</option>\n';
                }
            }
            if (text) {
                $('#history-table-instance')
                    .data('id', ids[0])
                    .html(text)
                    .show()
                    .unbind('change').bind('change', function () {
                        that.main.saveConfig('object-history-table',  $('#history-table-instance').val());
                        that.loadHistoryTable($(this).data('id'));
                    });
                $('#history-chart-instance')
                    .data('id', ids[0])
                    .html(text)
                    .show()
                    .unbind('change')
                    .bind('change', function () {
                        that.main.saveConfig('object-history-chart',  $('#history-chart-instance').val());
                        that.loadHistoryChart($(this).data('id'));
                    });
                if (this.main.config['object-history-table'] !== undefined) {
                    $('#history-table-instance').val(this.main.config['object-history-table']);
                }
                if (this.main.config['object-history-chart'] !== undefined) {
                    $('#history-chart-instance').val(this.main.config['object-history-chart']);
                }

            } else {
                $('#history-table-instance').hide();
                $('#history-chart-instance').hide();
            }
        } else {
            $('#history-table-instance').hide();
            $('#history-chart-instance').hide();
            title = _('Storage of %s states', ids.length);
            this.currentHistory = null;
        }
        $('#storage-tabs').data('ids', ids);
        this.$dialogHistory.dialog('option', 'title', title);
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
    };

    this.resizeHistory = function () {
        var $iFrame = $('#iframe-history-chart');
        $iFrame.css({height: this.$dialogHistory.height() - 70, width: this.$dialogHistory.width() - 10});
        var timeout = $iFrame.data('timeout');
        if (timeout) clearTimeout(timeout);

        $iFrame.data('timeout', setTimeout(function () {
            that.loadHistoryChart($('#tabs-history').data('id'));
        }, 1000));
    };

    this.prepareHistory = function () {
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
                    id: 'history-button-save',
                    text: _('Save'),
                    click: function () {
                        var $tabs = $('#storage-tabs');
                        var ids = $tabs.data('ids');

                        // do not update charts
                        that.currentHistory = null;
                        var wordDifferent = _('__different__');

                        // collect default values
                        var $inputs = $tabs.find('input, select');

                        //that.historyIds = ids;
                        $inputs.each(function () {
                            var instance = $(this).data('instance');
                            var field    = $(this).data('field');
                            if (!field) return;

                            var val;
                            if ($(this).attr('type') == 'checkbox') {
                                if (this.indeterminate) return;
                                val = $(this).prop('checked');
                            } else {
                                val = $(this).val();
                            }
                            // if not changed
                            if (val == wordDifferent) return;

                            if (val === 'false') val = false;
                            if (val === 'true')  val = true;
                            if (val == parseFloat(val).toString()) val = parseFloat(val);

                            for (var i = 0; i < ids.length; i++) {
                                that.main.objects[ids[i]].common.history = that.main.objects[ids[i]].common.history || {};
                                if (that.main.objects[ids[i]].common.history[instance] === undefined) {
                                    var adapter = instance.split('.')[0];
                                    var _default;
                                    // Try to get default values
                                    if (defaults[adapter]) {
                                        _default = defaults[adapter](that.main.objects[ids[i]], that.main.objects['system.adapter.' + instance]);
                                    } else {
                                        _default = that.defaults[adapter];
                                    }
                                    that.main.objects[ids[i]].common.history[instance] = _default || {};
                                }
                                that.main.objects[ids[i]].common.history[instance][field] = val;
                            }
                        });

                        for (var i = 0; i < ids.length; i++) {
                            var found = false;
                            for (var inst in main.objects[ids[i]].common.history) {
                                if (!main.objects[ids[i]].common.history[inst].enabled) {
                                    delete main.objects[ids[i]].common.history[inst];
                                } else {
                                    found = true;
                                }
                            }
                            if (!found) {
                                main.objects[ids[i]].common.history = null;
                            }
                        }

                        that.setHistory(ids, function () {
                            // disable iframe
                            that.loadHistoryChart();
                            that.$dialogHistory.dialog('close');
                        });
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        if (!$('#history-button-save').is(":disabled")) {
                            that.main.confirmMessage(_('Are you sure? Changes are not saved.'), _('Question'), 'alert', function (result) {
                                if (result) {
                                    // disable iframe
                                    that.loadHistoryChart();
                                    that.$dialogHistory.dialog('close');
                                }
                            });
                        } else {
                            // disable iframe
                            that.loadHistoryChart();
                            that.$dialogHistory.dialog('close');
                        }
                    }
                }
            ],
            open: function (event, ui) {
                $('#iframe-history-chart').css({height: $(this).height() - 120, width: $(this).width() - 30});
            },
            close: function () {
                if (that.historyTimeout) {
                    clearTimeout(that.historyTimeout);
                    that.historyTimeout = null;
                }
                that.currentHistory = null;
                $('#iframe-history-chart').attr('src', '');
            },
            resize: function () {
                that.resizeHistory();
            }
        });
    };

    function handleFileSelect(evt) {
        var f = evt.target.files[0];
        if (f) {
            var r = new FileReader();
            r.onload = function (e) {
                var contents = e.target.result;
                var json = JSON.parse(contents);
                var len = Object.keys(json).length;
                var id = json._id;
                if (id == undefined && len > 1) {
                    for (var obj in (json)) {
                        id = json[obj]._id;
                        that.main.socket.emit('setObject', id, json[obj], function (err) {
                            if (err) {
                                that.main.showError(err);
                                return;
                            }
                            var _obj = json[obj];
                            console.log(id + ' = ' + _obj.type);
                            if (json[obj].type == 'state') {
                                that.main.socket.emit('setState', _obj._id, _obj.common.def === undefined ? null : _obj.common.def, true);
                            }
                        });
                    }
                } else {
                    that.main.socket.emit('setObject', id, json, function (err) {
                        if (err) {
                            that.main.showError(err);
                            return;
                        }
                        var _obj = json[obj];
                        console.log(id + ' = ' + _obj.type);
                        if (json[obj].type == 'state') {
                            that.main.socket.emit('setState', _obj._id, _obj.common.def === undefined ? null : _obj.common.def, true);
                        }
                    });
                }
            };
            r.readAsText(f);
        } else {
            alert("Failed to open JSON File");
        }
    }
}