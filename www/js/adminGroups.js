function Groups(main) {
    "use strict";

    var that     = this;
    this.list    = [];
    this.$grid   = $('#grid-groups');
    this.$dialog = $('#dialog-group');
    this.main    = main;
    this.groupLastSelected = null;

    function onFilterChanged() {
        var inputs = $('#gview_grid-groups').find('.main-header-input-table>tbody>tr>td>input');
        inputs.each(function (i, o) {
            filterChanged(o);
        })
    }

    this.prepare = function () {
        that.$grid.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('desc'), _('users'), ''],
            colModel: [
                {name: '_id',         index: '_id',                          width: 250},
                {name: 'name',        index: 'name',        editable: false, width: 150},
                {name: 'description', index: 'description', editable: false, width: 200},
                {name: 'users',       index: 'users',       editable: false, width: 400},
                {name: 'buttons',     index: 'buttons',     editable: false, width: 80,  align: 'center', sortable: false, search: false}
            ],
            pager:      $('#pager-groups'),
            rowNum:     100,
            rowList:    [20, 50, 100],
            sortname:   'id',
            sortorder:  'desc',
            viewrecords: true,
            //caption: _('ioBroker groups'),
            gridComplete: function () {
                $('.group-users-edit').multiselect({
                    selectedList: 4,
                    close: function () {
                        var obj = {common: {members: $(this).val()}};
                        var id  = $(this).attr('data-id');
                        that.main.socket.emit('extendObject', id, obj, function (err, obj) {
                            if (err) {
                                // Cannot modify
                                that.main.showMessage(_('Cannot change group'), '', 'alert');
                                that.init(true);
                            }
                        });
                    },
                    checkAllText:     _('Check all'),
                    uncheckAllText:   _('Uncheck All'),
                    noneSelectedText: _('Select options')
                });
            },
            loadComplete: function () {
                that.initButtons();
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false,
            afterSearch:   function () {
                that.initButtons();
            },
            beforeSearch: onFilterChanged,
            beforeClear: onFilterChanged

        }).navGrid('#pager-groups', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-groups', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                editGroup();
            },
            position: 'first',
            id: 'add-group',
            title: _('new group'),
            cursor: 'pointer'
        });

        that.$dialog.dialog({
            autoOpen: false,
            modal:    true,
            width:    512,
            height:   830,
            buttons:  [
                {
                    text: _('Save'),
                    click: saveGroup
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        that.$dialog.dialog('close');
                    }
                }
            ]
        });

        patchPager(this, 'groups');

        $('#edit-group-name').keydown(function (event) {
            if (event.which == 13) $('#edit-group-desc').focus();
        });
        $('#edit-group-desc').keydown(function (event) {
            if (event.which == 13) saveGroup();
        });
        $("#load_grid-groups").show();
        onFilterChanged();

        var operations = [
            'http',
            'sendto',
            'list',
            'read',
            'write',
            'create',
            'delete'
        ];
        function sortFunction(a, b){
            var a = operations.indexOf(a);
            var b = operations.indexOf(b);
            if (a == -1) a = 1000;
            if (b == -1) a = 1000;

            if (a < b) return -1;

            if (a > b) return 1;

            return 0
        }

        this.main.socket.emit('listPermissions', function (permissions) {
            that.groups = {};

            var text = "";
            for (var p in permissions) {
                if (!permissions[p].type) continue;
                that.groups[permissions[p].type] = that.groups[permissions[p].type] || [];
                if (that.groups[permissions[p].type].indexOf(permissions[p].operation) == -1) {
                    that.groups[permissions[p].type].push(permissions[p].operation);
                }
            }

            for (var g in that.groups) {
                that.groups[g].sort(sortFunction);

                text += '<tr><td colspan="2" style="padding-top: 10px"></td></tr>\n<tr class="ui-widget-header"><td></td><td>' + _(g + ' permissions') + '</td></tr>\n';
                for (var i = 0; i < that.groups[g].length; i++) {
                    text += '<tr><td>' + _(that.groups[g][i] + ' operation') + '</td>' +
                            '<td><input data-type="' + g + '" data-operation="' + that.groups[g][i] + '" class="edit-group-permissions" type="checkbox"></td>' +
                            '</tr>';
                }
            }
            $('#edit-group-table').html(text);
        });
    };

    this.init = function (update) {

        if (!that.main.objectsLoaded) {
            setTimeout(function () {
                that.init(update);
            }, 500);
            return;
        }

        if (typeof that.$grid != 'undefined' && (update || !that.$grid[0]._isInited)) {
            that.$grid[0]._isInited = true;
            that.$grid.jqGrid('clearGridData');
            for (var i = 0; i < this.list.length; i++) {
                var obj = that.main.objects[this.list[i]];
                var select = '<select class="group-users-edit" multiple="multiple" data-id="' + this.list[i] + '">';

                var users = this.main.tabs.users.list;
                for (var j = 0; j < users.length; j++) {
                    var name = users[j].substring('system.user.'.length);
                    select += '<option value="' + users[j] + '"';
                    if (obj.common && obj.common.members && obj.common.members.indexOf(users[j]) != -1) select += ' selected';
                    select += '>' + name + '</option>';
                }

                this.$grid.jqGrid('addRowData', 'group_' + this.list[i].replace(/ /g, '_'), {
                    _id:         obj._id,
                    name:        obj.common ? obj.common.name : '',
                    description: obj.common ? obj.common.desc : '',
                    users:       select,
                    buttons:   '<button data-group-id="' + this.list[i] + '" class="group-edit">'     + _('edit')   + '</button>' +
                                (!obj.common.dontDelete ? ('<button data-group-id="' + this.list[i] + '" class="group-del">' + _('delete') + '</button>')  : '')
                });
            }
            that.$grid.trigger('reloadGrid');
        }
    };

    function editGroup(id) {
        if (id) {
            var obj = that.main.objects[id];
            that.$dialog.dialog('option', 'title', id);
            $('#edit-group-id').val(obj._id);
            $('#edit-group-name').val(obj.common.name);
            $('#edit-group-name').prop('disabled', true);
            $('#edit-group-desc').val(obj.common.desc);

            if (!obj.common.acl) obj.common.acl = {};

            if (id == 'system.group.administrator') {
                obj.common.acl = {};
                for (var g in that.groups) {
                    obj.common.acl[g] = {};
                    for (var i = 0; i < that.groups[g].length; i++) {
                        obj.common.acl[g][that.groups[g][i]] = true;
                    }
                }
            }
            $('.edit-group-permissions').prop('disabled', (id == 'system.group.administrator')).each(function () {
                var type      = $(this).data('type');
                var operation = $(this).data('operation');
                $(this).prop('checked', obj.common.acl[type] ? obj.common.acl[type][operation] : false);
            });

            that.$dialog.dialog('open');
        } else {
            that.$dialog.dialog('option', 'title', _('new group'));
            $('#edit-group-id').val('');
            $('#edit-group-name').val('');
            $('#edit-group-name').prop('disabled', false);
            $('#edit-group-desc').val('');
            that.$dialog.dialog('open');
        }
    }
    function saveGroup() {
        var id    = $('#edit-group-id').val();
        var group = $('#edit-group-name').val();
        var desc  = $('#edit-group-desc').val();
        var acl = {};

        $('.edit-group-permissions').each(function () {
            var type      = $(this).data('type');
            var operation = $(this).data('operation');
            acl[type] = acl[type] || {};
            acl[type][operation] = $(this).prop('checked');
        });

        if (!id) {
            that.main.socket.emit('addGroup', group, desc, acl, function (err) {
                if (err) {
                    that.main.showMessage(_('Cannot create group: ') + err, '', 'alert');
                } else {
                    that.$dialog.dialog('close');
                    setTimeout(function () {
                        that.init(true);
                    }, 0);
                }
            });
        } else {
            var obj = {common: {desc: desc, acl: acl}};
            // If description changed
            that.main.socket.emit('extendObject', id, obj, function (err, res) {
                if (err) {
                    that.main.showMessage(_('Cannot change group: ') + err, '', 'alert');
                } else {
                    that.$dialog.dialog('close');
                }
            });
        }
    }

    this.initButtons = function (id) {
        if (id) {
            id = '[data-group-id="' + id + '"]';
        } else {
            id = '';
        }

        $('.group-edit' + id).unbind('click').button({
            icons: {primary: 'ui-icon-pencil'},
            text:  false
        }).css('width', '22px').css('height', '18px').click(function () {
            editGroup($(this).attr('data-group-id'));
        });

        $('.group-del' + id).button({icons: {primary: 'ui-icon-trash'}, text: false}).css('width', '22px').css('height', '18px').unbind('click')
            .click(function () {
                var id = $(this).attr('data-group-id');
                that.main.confirmMessage(_('Are you sure?'), null, 'help', function (result) {
                    if (result) {
                        that.main.socket.emit('delGroup', id.replace("system.group.", ""), function (err) {
                            if (err) {
                                that.main.showMessage(_('Cannot delete group: %s', err), '', 'alert');
                            }
                        });
                    }
                });
            });
    };

    this.synchronizeUser = function (userId, userGroups, callback) {
        var obj;
        userGroups = userGroups || [];
        for (var i = 0; i < this.list.length; i++) {
            // If user has no group, but group has user => delete user from group
            if (userGroups.indexOf(this.list[i]) == -1 &&
                that.main.objects[this.list[i]].common.members && that.main.objects[this.list[i]].common.members.indexOf(userId) != -1) {
                var members = JSON.parse(JSON.stringify(that.main.objects[this.list[i]].common.members));
                members.splice(members.indexOf(userId), 1);
                obj = {common: {members: members}};
                that.main.socket.emit('extendObject', this.list[i], obj, function (err) {
                    if (err) {
                        that.main.showError(err);
                        if (callback) callback(err);
                    } else {
                        if (callback) callback();
                    }
                });
            }
            if (userGroups.indexOf(this.list[i]) != -1 &&
                (!that.main.objects[this.list[i]].common.members || that.main.objects[this.list[i]].common.members.indexOf(userId) == -1)) {
                that.main.objects[this.list[i]].common.members = that.main.objects[this.list[i]].common.members || [];
                var _members = JSON.parse(JSON.stringify(that.main.objects[this.list[i]].common.members));
                _members.push(userId);
                obj = {common: {members: _members}};
                that.main.socket.emit('extendObject', this.list[i], obj, function (err) {
                    if (err) {
                        that.main.showError(err);
                        if (callback) callback(err);
                    } else {
                        if (callback) callback();
                    }
                });
            }
        }
    };

    this.delUser = function (id) {
        for (var i = 0; i < this.list.length; i++) {
            // If user has no group, but group has user => delete user from group
            if (that.main.objects[this.list[i]].common.members && that.main.objects[this.list[i]].common.members.indexOf(id) != -1) {
                that.main.objects[this.list[i]].common.members.splice(that.main.objects[this.list[i]].common.members.indexOf(id), 1);
                that.main.socket.emit('extendObject', this.list[i], {
                    common: {
                        members: that.main.objects[this.list[i]].common.members
                    }
                });
            }
        }
    };

    this.objectChange = function (id, obj) {
        if (id.match(/^system\.group\./)) {
            if (obj) {
                if (this.list.indexOf(id) == -1) this.list.push(id);
            } else {
                var j = this.list.indexOf(id);
                if (j != -1) this.list.splice(j, 1);
            }

            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
            }
            this.updateTimer = setTimeout(function () {
                that.updateTimer = null;
                that.main.tabs.users.init(true);
                that.init(true);
            }, 200);
        }
    }

    this.resize = function (width, height) {
        this.$grid.setGridHeight(height - 150).setGridWidth(width - 20);
    }
}

