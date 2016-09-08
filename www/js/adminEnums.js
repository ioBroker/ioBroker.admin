function Enums(main) {
    'use strict';
    
    var that               = this;
    this.main              = main;
    this.list              = [];
    this.$grid             = $('#grid-enums');
    this.$gridMembers      = $('#grid-enum-members');
    this.enumEdit          = null;
    this.updateTimers      = null;

    var $dialogEnumMembers = $('#dialog-enum-members');
    var $dialogEnum        = $('#dialog-enum');
    var enumCurrentParent  = '';
    var tasks              = [];

    function enumRename(oldId, newId, newName, callback) {
        if (tasks.length) {
            var task = tasks.shift();
            if (task.name === 'delObject') {
                main.socket.emit(task.name, task.id, function () {
                    setTimeout(function () {
                        enumRename(undefined, undefined, undefined, callback);
                    }, 0);
                });
            } else {
                main.socket.emit(task.name, task.id, task.obj, function () {
                    setTimeout(function () {
                        enumRename(undefined, undefined, undefined, callback);
                    }, 0);
                });
            }
        } else {
            _enumRename(oldId, newId, newName, function () {
                if (tasks.length) {
                    enumRename(undefined, undefined, undefined, callback);
                } else {
                    if (callback) callback();
                }
            });
        }
    }
    function _enumRename(oldId, newId, newName, callback) {
        //Check if this name exists
        if (oldId !== newId && main.objects[newId]) {
            main.showMessage(_('Name yet exists!'), '', 'info');
            that.init(true);
            if (callback) callback();
        } else {
            if (oldId === newId) {
                if (newName !== undefined) {
                    tasks.push({name: 'extendObject', id:  oldId, obj: {common: {name: newName}}});
                    if (callback) callback();
                }
            } else if (main.objects[oldId] && main.objects[oldId].common && main.objects[oldId].common.nondeletable) {
                main.showMessage(_('Change of enum\'s id "%s" is not allowed!', oldId), '', 'notice');
                that.init(true);
                if (callback) callback();
            } else {
                var leaf = that.$grid.selectId('getTreeInfo', oldId);
                //var leaf = treeFindLeaf(oldId);
                if (leaf && leaf.children) {
                    main.socket.emit('getObject', oldId, function (err, obj) {
                        setTimeout(function () {
                            if (obj) {
                                obj._id = newId;
                                if (obj._rev) delete obj._rev;
                                if (newName !== undefined) obj.common.name = newName;
                                tasks.push({name: 'delObject', id: oldId});
                                tasks.push({name: 'setObject', id: newId, obj: obj});
                                // Rename all children
                                var count = 0;
                                for (var i = 0; i < leaf.children.length; i++) {
                                    var n = leaf.children[i].replace(oldId, newId);
                                    count++;
                                    _enumRename(leaf.children[i], n, undefined, function () {
                                        count--;
                                        if (!count && callback) callback();
                                    });
                                }

                            }
                        }, 0);
                    });
                } else {
                    main.socket.emit('getObject', oldId, function (err, obj) {
                        if (obj) {
                            setTimeout(function () {
                                obj._id = newId;
                                if (obj._rev) delete obj._rev;
                                if (newName !== undefined) obj.common.name = newName;
                                tasks.push({name: 'delObject', id: oldId});
                                tasks.push({name: 'setObject', id: newId, obj: obj});
                                if (callback) callback();
                            }, 0);
                        }
                    });
                }
            }
        }
    }

    function enumAddChild(parent, newId, name) {
        if (main.objects[newId]) {
            main.showMessage(_('Name yet exists!'), '', 'notice');
            return false;
        }

        main.socket.emit('setObject', newId, {
            _id: newId,
            common:   {
                name: name,
                members: []
            },
            type: 'enum'
        });
        return true;
    }

    function enumMembers(id) {
        that.enumEdit = id;
        $dialogEnumMembers.dialog('option', 'title', id);
        $('#enum-name-edit').val(main.objects[id].common.name);
        var members = main.objects[id].common.members || [];
        that.$gridMembers.jqGrid('clearGridData');
        // Remove empty entries
        for (var i = members.length - 1; i >= 0; i--) {
            if (!members[i]) {
                members.splice(i, 1);
            }
        }

        for (i = 0; i < members.length; i++) {
            if (main.objects[members[i]]) {
                that.$gridMembers.jqGrid('addRowData', 'enum_member_' + members[i].replace(/ /g, '_'), {_id: members[i], name: main.objects[members[i]].common.name, type: main.objects[members[i]].type});
            } else if (members[i]) {
                that.$gridMembers.jqGrid('addRowData', 'enum_member_' + members[i].replace(/ /g, '_'), {
                    _id:  members[i],
                    name: '<span style="color: red; font-weight: bold; font-style: italic;">object missing</span>',
                    type: ''
                });
            }
        }
        $('#del-member').addClass('ui-state-disabled');
        $dialogEnumMembers.dialog('open');
    }

    function prepareEnumMembers() {
        that.$gridMembers.jqGrid({
            datatype:   'local',
            colNames:   ['id', _('name'), _('type')],
            colModel:   [
                {name: '_id',  index:'_id',  width: 240},
                {name: 'name', index:'name', width: 400},
                {name: 'type', index:'type', width: 100, fixed: true}
            ],
            pager:      $('#pager-enum-members'),
            width:      768,
            height:     370,
            rowNum:     100,
            rowList:    [20, 50, 100],
            sortname:   'id',
            sortorder:  'desc',
            viewrecords: true,
            caption:    _('members'),
            onSelectRow: function (rowid, e) {
                $('#del-member').removeClass('ui-state-disabled');
            }
        }).navGrid('#pager-enum-members', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-enum-members', {
            caption: '',
            buttonicon: 'ui-icon-trash',
            onClickButton: function () {
                var _obj = that.$gridMembers.jqGrid('getRowData', that.$gridMembers.jqGrid('getGridParam', 'selrow'));
                var id = _obj._id;
                var obj = main.objects[that.enumEdit];
                var idx = obj.common.members.indexOf(id);
                if (idx !== -1) {
                    obj.common.members.splice(idx, 1);
                    main.objects[that.enumEdit] = obj;
                    main.socket.emit('setObject', that.enumEdit, obj, function () {
                        setTimeout(function () {
                            enumMembers(that.enumEdit);
                        }, 0);
                    });
                }
            },
            position: 'first',
            id: 'del-member',
            title: _('Delete member'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-enum-members', {
            caption:        '',
            buttonicon:     'ui-icon-plus',
            onClickButton:  function () {
                var sid = main.initSelectId();

                sid.selectId('show', function (newId, oldId) {
                    var obj = main.objects[that.enumEdit];
                    var changed = false;
                    if (Array.isArray(newId)) {
                        for (var id = 0; id < newId.length; id++) {
                            if (obj.common.members.indexOf(newId[id]) === -1) {
                                obj.common.members.push(newId[id]);
                                changed = true;
                            }
                        }
                    } else {
                        if (obj.common.members.indexOf(newId) === -1) {
                            obj.common.members.push(newId);
                            changed = true;
                        }
                    }
                    if (changed) {
                        main.socket.emit('setObject', that.enumEdit, obj, function () {
                            setTimeout(function () {
                                enumMembers(that.enumEdit);
                            }, 0);
                        });
                    }
                });
            },
            position:       'first',
            id:             'add-member',
            title:          _('Add member'),
            cursor:         'pointer'
        });

        var _dialogEnumMembersButtons = {};
        _dialogEnumMembersButtons[_('Ok')] = function () {
            $(this).dialog('close');
        };

        $dialogEnumMembers.dialog({
            autoOpen:   false,
            modal:      true,
            width:      800,
            height:     500,
            buttons:    _dialogEnumMembersButtons,
            resize:     function () {
                that.$gridMembers.setGridHeight($(this).height() - 100).setGridWidth($(this).width() - 5);
            },
            open: function () {
                that.$gridMembers.setGridHeight($(this).height() - 100).setGridWidth($(this).width() - 5);
            }
        });

        $dialogEnumMembers.trigger('resize');
    }

    this.prepare = function () {
        prepareEnumMembers();
        
        $dialogEnum.dialog({
            autoOpen:   false,
            modal:      true,
            width:      500,
            height:     300,
            buttons: [
                {
                    text: _('Save'),
                    click: function () {
                        $dialogEnum.dialog('close');

                        var name = $('#enum-name').val().replace(/ /g, '_').toLowerCase();
                        if (!name) {
                            main.showMessage(_('Empty name!'), '', 'notice');
                            return;
                        }
                        if (main.objects[(enumCurrentParent || 'enum') + '.' + name]) {
                            main.showMessage(_('Name yet exists!'), '', 'notice');
                            return;
                        }

                        enumAddChild(enumCurrentParent,  (enumCurrentParent || 'enum') + '.' + name, $('#enum-name').val());
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        $dialogEnum.dialog('close');
                    }
                }
            ]
        });

        $('#enum-name').keyup(function () {
            var t = $('#enum-gen-id');
            t.html(t[0]._original + '.' + $(this).val().replace(/ /, '_').toLowerCase());
        });
        
        $("#load_grid-enums").show();
    };
    
    this.init = function (update, expandId) {
        if (!this.main || !this.main.objectsLoaded) {
            setTimeout(that.init, 250);
            return;
        }

        if (typeof this.$grid !== 'undefined' && (!this.$grid.data('inited') || update)) {
            this.$grid.data('inited', true);

            var x = $(window).width();
            var y = $(window).height();
            if (x < 720) x = 720;
            if (y < 480) y = 480;

            this.$grid.height(y - 100).width(x - 20);

            this.$grid.selectId('init', {
                objects: main.objects,
                states: main.states,
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
                    enum:     _('Members')
                },
                filter: {type: 'enum'},
                columns: ['name', 'enum', 'button'],
                widths:  ['150', '*', '120'],
                buttons: [
                    {
                        text: false,
                        icons: {
                            primary:'ui-icon-plus'
                        },
                        click: function (id) {
                            enumCurrentParent = id;
                            // Find unused name
                            var name = _('enum');
                            var idx = 0;
                            var newId;
                            do {
                                idx++;
                                newId = (enumCurrentParent || 'enum')  + '.' + name + idx;
                            } while (main.objects[newId]);

                            $('#enum-name').val(name + idx);
                            // Store prefix in DOM to show generated ID
                            var t = $('#enum-gen-id');
                            t[0]._original = (enumCurrentParent || 'enum');
                            t.html(newId);

                            $dialogEnum.dialog('open');
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
                            main.delObject(that.$grid, id);
                        },
                        match: function (id) {
                            if (!main.objects[id] || !main.objects[id].common || main.objects[id].common.nondeletable) this.hide();
                        },
                        width: 26,
                        height: 20
                    },
                    {
                        text: false,
                        icons: {
                            primary:'ui-icon-note'
                        },
                        click: function (id) {
                            enumMembers(id);
                        },
                        match: function (id) {
                            if (id.split('.').length <= 2) this.hide();
                        },
                        width: 26,
                        height: 20
                    }
                ],
                editEnd: function (id, newValues) {
                    var pos = id.lastIndexOf('.');
                    if (pos !== -1) {
                        var original = id.substring(0, pos);
                        // rename all children
                        enumRename(id, original + '.' + newValues.id.replace(/ /g, '_').toLowerCase(), newValues.name);
                    }
                },
                editStart: function (id, inputs) {
                    var pos = id.lastIndexOf('.');
                    if (pos !== -1) inputs.id.val(id.substring(pos + 1));
                },
                panelButtons: [
                    {
                        text: false,
                        title: _('New enum'),
                        icons: {
                            primary:'ui-icon-plus'
                        },
                        click: function () {
                            // Find unused name
                            enumCurrentParent = '';
                            var name = _('enum');
                            var idx = 0;
                            var newId;
                            do {
                                idx++;
                                newId = (enumCurrentParent || 'enum')  + '.' + name + idx;
                            } while (main.objects[newId]);

                            $('#enum-name').val(name + idx);
                            var t = $('#enum-gen-id');
                            t[0]._original = (enumCurrentParent || 'enum');
                            t.html(newId);
                            $dialogEnum.dialog('open');
                        }
                    }
                ]
            }).selectId('show');
        }
    };

    this.objectChange = function (id, obj) {
        if (this.$grid) this.$grid.selectId('object', id, obj);

        //Update enums
        if (id.match(/^enum\./)) {
            if (obj) {
                if (this.list.indexOf(id) === -1) this.list.push(id);
            } else {
                var j = this.list.indexOf(id);
                if (j !== -1) this.list.splice(j, 1);
            }

            if (this.updateTimers) clearTimeout(this.updateTimers);
            
            this.updateTimers = setTimeout(function () {
                that.updateTimers = null;
                that.init(true);
            }, 200);
        }
    };
    
    this.resize = function (width, height) {
        if (this.$grid) {
            this.$grid.setGridHeight(height - 150).setGridWidth(width - 20);
        }
    }
}