function Enums(main) {
    'use strict';

    var that               = this;
    var $grid              = $('#tab-enums');

    this.main              = main;
    this.list              = [];
    this.$gridList         = $grid.find('.tab-enums-list');
    this.$grid             = $grid.find('.tab-enums-objects');
    this.$gridMembers      = $('#grid-enum-members');
    this.enumEdit          = null;
    this.updateTimers      = null;
    this.editMode          = false;

    var $dialogEnumMembers = $('#dialog-enum-members');
    var $dialogEnum        = $('#dialog-enum');
    var enumCurrentParent  = '';
    var tasks              = [];

    var selectId = function () {
        if (!that.$grid || !that.$grid.selectId) return;
        selectId = that.$grid.selectId.bind(that.$grid);
        return that.$grid.selectId.apply(that.$grid, arguments);
    };

    function enumRename(oldId, newId, newName, callback) {
        if (tasks.length) {
            var task = tasks.shift();
            if (task.name === 'delObject') {
                that.main.socket.emit(task.name, task.id, function () {
                    setTimeout(function () {
                        enumRename(undefined, undefined, undefined, callback);
                    }, 0);
                });
            } else {
                that.main.socket.emit(task.name, task.id, task.obj, function () {
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
        if (oldId !== newId && that.main.objects[newId]) {
            that.main.showMessage(_('Name yet exists!'), '', 'info');
            that.init(true);
            if (callback) callback();
        } else {
            if (oldId === newId) {
                if (newName !== undefined) {
                    tasks.push({name: 'extendObject', id:  oldId, obj: {common: {name: newName}}});
                    if (callback) callback();
                }
            } else if (that.main.objects[oldId] && that.main.objects[oldId].common && that.main.objects[oldId].common.nondeletable) {
                that.main.showMessage(_('Change of enum\'s id "%s" is not allowed!', oldId), '', 'notice');
                that.init(true);
                if (callback) callback();
            } else {
                var leaf = that.$grid.selectId('getTreeInfo', oldId);
                //var leaf = treeFindLeaf(oldId);
                if (leaf && leaf.children) {
                    that.main.socket.emit('getObject', oldId, function (err, obj) {
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
                    that.main.socket.emit('getObject', oldId, function (err, obj) {
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
        if (that.main.objects[newId]) {
            that.main.showMessage(_('Name yet exists!'), '', 'notice');
            return false;
        }

        that.main.socket.emit('setObject', newId, {
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
        $('#enum-name-edit').val(that.main.objects[id].common.name);
        var members = that.main.objects[id].common.members || [];
        that.$gridMembers.jqGrid('clearGridData');
        // Remove empty entries
        for (var i = members.length - 1; i >= 0; i--) {
            if (!members[i]) {
                members.splice(i, 1);
            }
        }

        for (i = 0; i < members.length; i++) {
            if (that.main.objects[members[i]]) {
                that.$gridMembers.jqGrid('addRowData', 'enum_member_' + members[i].replace(/ /g, '_'), {_id: members[i], name: that.main.objects[members[i]].common.name, type: that.main.objects[members[i]].type});
            } else if (members[i]) {
                that.$gridMembers.jqGrid('addRowData', 'enum_member_' + members[i].replace(/ /g, '_'), {
                    _id:  members[i],
                    //name: '<span style="color: red; font-weight: bold; font-style: italic;">object missing</span>',
                    name: '<span style="color: red; font-style: italic;">object missing</span>',
                    type: ''
                });
            }
        }
        $('#del-member').addClass('ui-state-disabled');
        $dialogEnumMembers.dialog('open');
    }

    function prepareEnumMembers() {
        /*that.$gridMembers.jqGrid({
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
                var obj = that.main.objects[that.enumEdit];
                var idx = obj.common.members.indexOf(id);
                if (idx !== -1) {
                    obj.common.members.splice(idx, 1);
                    that.main.objects[that.enumEdit] = obj;
                    that.main.socket.emit('setObject', that.enumEdit, obj, function () {
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
                var sid = that.main.initSelectId();

                sid.selectId('show', function (newId, oldId) {
                    var obj = that.main.objects[that.enumEdit];
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
                        that.main.socket.emit('setObject', that.enumEdit, obj, function () {
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
            open: function (event) {
                $(event.target).parent().find('.ui-dialog-titlebar-close .ui-button-text').html('');
                that.$gridMembers.setGridHeight($(this).height() - 100).setGridWidth($(this).width() - 5);
            }
        });

        $dialogEnumMembers.trigger('resize');*/
    }

    this.prepare = function () {
        prepareEnumMembers();

        /*$dialogEnum.dialog({
            autoOpen:   false,
            modal:      true,
            width:      600,
            height:     300,
            buttons: [
                {
                    text: _('Save'),
                    click: function () {
                        $dialogEnum.dialog('close');
                        var val = $('#enum-name').val();
                        var name = val.replace(/ /g, '_').toLowerCase();
                        if (!name) {
                            that.main.showMessage(_('Empty name!'), '', 'notice');
                            return;
                        }
                        if (that.main.objects[(enumCurrentParent || 'enum') + '.' + name]) {
                            that.main.showMessage(_('Name yet exists!'), '', 'notice');
                            return;
                        }

                        enumAddChild(enumCurrentParent,  (enumCurrentParent || 'enum') + '.' + name, val);
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

        $('#load_grid-enums').show();*/
    };

    this._initObjectTree = function () {
        var settings = {
            objects:  main.objects,
            noDialog: true,
            draggable: ['device', 'channel', 'state'],
            name:     'enum-objects',
            expertModeRegEx: /^system\.|^iobroker\.|^_|^[\w-]+$|^enum\.|^[\w-]+\.admin|^script\./,
            texts: {
                select:   _('Select'),
                cancel:   _('Cancel'),
                all:      _('All'),
                id:       _('ID'),
                ID:       _('ID'),
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
                push:     _('Trigger event'),
                ok:       _('Ok'),
                with:     _('With'),
                without:  _('Without'),
                copyToClipboard: _('Copy to clipboard'),
                expertMode: _('Toggle expert mode'),
                refresh:	_('Update'),
                sort:       _('Sort alphabetically'),
                button: 'History'
            },
            filter: {
                type: 'state'
            },
            columns: ['ID', 'name', 'type', 'role']
        };

        selectId('init', settings)
            .selectId('show');

        var $div = $('#tab-enums');
        $div.find('.fancytree-container>tbody')
            .sortable({
                connectWith: '#tab-enums .tab-enums-list .tree-table-main .treetable',
                items: '.fancytree-type-not-draggable',
                appendTo: $div,
                helper: "clone",
                zIndex: 999990,
                start: function(){ $div.addClass("dragging") },
                stop: function(){ $div.removeClass("dragging") }
            })
            .disableSelection()
        ;
    };

    function createNewEnum(isCategory) {
        var idChanged = false;
        var $dialog = $('#tab-enums-dialog-new');

        $dialog.find('.tab-enums-dialog-new-title').text(isCategory ? _('Create new category:') : _('Create new enum:'));
        $dialog.find('#tab-enums-dialog-new-name').val('').unbind('change').bind('change', function () {
            var $id = $('#tab-enums-dialog-new-id');
            var id = $id.val();
            var val = $(this).val();
            val = val.replace(/[.\s]/g, '_').trim().toLowerCase();
            if (!id || !idChanged) {
                $id.val(val);
                $dialog.find('#tab-enums-dialog-new-preview').val((isCategory ? 'enum' : that.enumEdit) + '.' + (val || '#'));
                Materialize.updateTextFields('#tab-enums-dialog-new');
            }
            if ($id.val() && !$id.val().match(/[.\s]/)) {
                $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                $id.removeClass('wrong');
            } else {
                $dialog.find('.tab-enums-dialog-create').addClass('disabled');
                $id.addClass('wrong');
            }
        }).unbind('keyup').bind('keyup', function () {
            $(this).trigger('change');
        });

        $dialog.find('#tab-enums-dialog-new-id').val('').unbind('change').bind('change', function () {
            idChanged = true;
            var val = $(this).val();
            $dialog.find('#tab-enums-dialog-new-preview').val((isCategory ? 'enum' : that.enumEdit) + '.' + ($(this).val() || '#'));
            Materialize.updateTextFields('#tab-enums-dialog-new');
            if (val && !val.match(/[.\s]/)) {
                $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                $(this).removeClass('wrong');
            } else {
                $dialog.find('.tab-enums-dialog-create').addClass('disabled');
                $(this).addClass('wrong');
            }
        }).unbind('keyup').bind('keyup', function () {
            $(this).trigger('change');
        });
        $dialog.find('.tab-enums-dialog-create').addClass('disabled').unbind('click').click(function () {
            enumAddChild(that.enumEdit, (isCategory ? 'enum' : that.enumEdit) + '.' + $('#tab-enums-dialog-new-id').val(), $('#tab-enums-dialog-new-name').val());
        });
        Materialize.updateTextFields('#tab-enums-dialog-new');

        $dialog.modal().modal('open');
    }

    this._postInit = function () {
        if (typeof this.$gridList !== 'undefined') {
            if (this.editMode) {
                this._initObjectTree();
            } else {
                selectId('destroy');
            }

            // extract all enums
            this.$gridList.treeTable({
                objects:    that.main.objects,
                root:       'enum',
                columns:    ['id', 'icon', 'name', 'members'],
                widths:     ['calc(100% - 190px)', '64px', '150px'],
                name:       'scripts',
                buttonsWidth: '40px',
                buttons:    [
                    {
                        text: false,
                        icons: {
                            primary:'ui-icon-trash'
                        },
                        click: function (id, children, parent) {
                            if (that.main.objects[id]) {
                                if (that.main.objects[id].type === 'enum') {
                                    if (children) {
                                        // ask if only object must be deleted or just this one
                                        that.main.confirmMessage(_('All sub-enums of %s will be deleted too?', id), null, 'help', function (result) {
                                            // If all
                                            if (result) {
                                                that.main._delObjects(id, true);
                                            } // else do nothing
                                        });
                                    } else {
                                        that.main.confirmMessage(_('Are you sure to delete %s?', id), null, 'help', function (result) {
                                            // If all
                                            if (result) that.main._delObjects(id, true);
                                        });
                                    }
                                } else {
                                    that.main.socket.emit('getObject', parent, function (err, obj) {
                                        if (obj && obj.common && obj.common.members) {
                                            var pos = obj.common.members.indexOf(id);
                                            if (pos !== -1) {
                                                obj.common.members.splice(pos, 1);
                                                that.main.socket.emit('setObject', obj._id, obj);
                                            }
                                        }
                                    });
                                }
                            } else {
                                that.main.showMessage(_('Object "<b>%s</b>" does not exists. Update the page.', id), null, 'alert');
                            }
                        },
                        width: 26,
                        height: 20
                    }
                ],
                panelButtons: [
                    {
                        id:   'tab-enums-list-new-enum',
                        title: _('New enum'),
                        icon:   'note_add',
                        click: function () {
                            createNewEnum(false);
                        }
                    },
                    {
                        id:   'tab-enums-list-new-category',
                        title:   _('New category'),
                        icon:   'library_add',
                        click: function () {
                            createNewEnum(true);
                        }
                    },
                    {
                        id:   'tab-enums-list-edit',
                        title: _('Edit'),
                        icon:   'edit',
                        click: function () {
                            that.editMode = !that.editMode;
                            var $tabEnums = $('#tab-enums');
                            if (that.editMode) {
                                $(this).removeClass('blue').addClass('red');
                                $tabEnums.addClass('tab-enums-edit');
                                that._initObjectTree();
                            } else {
                                selectId('destroy');
                                $(this).removeClass('red').addClass('blue');
                                $tabEnums.removeClass('tab-enums-edit');
                            }
                        }
                    }
                ],
                onChange:   function (id, oldId) {
                    if (id !== oldId) {
                        that.enumEdit = id;
                        var obj = that.main.objects[id];
                        if (obj && obj.type === 'enum') {
                            $('#tab-enums-list-new-enum').removeClass('disabled').attr('title', _('Create new enum, like %s', id + '.newEnum'));
                            var parts = id.split('.');
                            if (parts.length === 2) {
                                $('#tab-enums-list-new-category').removeClass('disabled').attr('title', _('Create new category, like %s', 'enum.newCategory'));
                            } else {
                                $('#tab-enums-list-new-category').addClass('disabled');
                            }
                        } else {
                            $('#tab-enums-list-new-enum').addClass('disabled');
                            $('#tab-enums-list-new-category').addClass('disabled');
                        }
                    }
                }
            });//.treeTable('show', currentEnum);
            $('#tab-enums-list-new-enum').addClass('disabled');
            $('#tab-enums-list-new-category').addClass('disabled');
            /*
            this.$grid.selectId('init', {
                objects:  that.main.objects,
                states:   that.main.states,
                noDialog: true,
                texts:    {
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
                filter:   {type: 'enum'},
                columns:  ['ID', 'name', 'enum', 'button'],
                widths:   ['170', '170', '*', '120'],
                quickEdit: ['name'],
                quickEditCallback: function (id, attr, newValue, oldValue) {
                    if (newValue !== oldValue) {
                        that.main.socket.emit('getObject', id, function (err, _obj) {
                            if (err) return that.main.showError(err);

                            if (_obj) {
                                _obj.common[attr] = newValue;

                                that.main.socket.emit('setObject', _obj._id, _obj, function (err) {
                                    if (err) that.main.showError(err);
                                });
                            }
                        });
                    }
                },
                buttons:  [
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
                    },

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
                            } while (that.main.objects[newId]);

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
                            that.main.delObject(that.$grid, id);
                        },
                        match: function (id) {
                            if (!that.main.objects[id] || !that.main.objects[id].common || that.main.objects[id].common.nondeletable) this.hide();
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
                // editEnd: function (id, newValues) {
                //     var pos = id.lastIndexOf('.');
                //     if (pos !== -1) {
                //         var original = id.substring(0, pos);
                //         // rename all children
                //         enumRename(id, original + '.' + newValues.id.replace(/ /g, '_').toLowerCase(), newValues.name);
                //     }
                // },
                // editStart: function (id, inputs) {
                //     var pos = id.lastIndexOf('.');
                //     if (pos !== -1) inputs.id.val(id.substring(pos + 1));
                // },
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
                            } while (that.main.objects[newId]);

                            $('#enum-name').val(name + idx);
                            var t = $('#enum-gen-id');
                            t[0]._original = (enumCurrentParent || 'enum');
                            t.html(newId);
                            $dialogEnum.dialog('open');
                        }
                    }
                ]
            }).selectId('show');*/
        }
    };

    this.init = function (update) {
        if (this.inited && !update) {
            return;
        }
        if (!this.main || !this.main.objectsLoaded) {
            setTimeout(function () {
                that.init(update);
            }, 250);
            return;
        }

        this._postInit();

        if (!this.inited) {
            this.inited = true;
            this.main.subscribeObjects('enum.*');
        }
    };

    this.destroy = function () {
        if (this.inited) {
            this.inited = false;
            // subscribe objects and states
            this.main.unsubscribeObjects('enum.*');
        }
    };

    this.objectChange = function (id, obj) {
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
                that._postInit();
            }, 200);
        }

        if (this.$grid) selectId('object', id, obj);
    };

    this.resize = function (width, height) {
        // if (this.$grid) {
        //     this.$grid.setGridHeight(height - 150).setGridWidth(width - 20);
        // }
    }
}