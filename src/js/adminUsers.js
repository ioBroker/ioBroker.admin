'use strict';

function Users(main) {
    var that          = this;
    this.groups       = [];
    this.list         = [];
    this.$grid        = $('#tab-users');
    this.$dialog      = $('#dialog-user');
    this.$gridUsers   = this.$grid.find('.tab-users-list-users .tab-users-body');
    this.$gridGroups  = this.$grid.find('.tab-users-list-groups .tab-users-body');
    this.main         = main;
    this.currentGroup = '';
    this.currentUser  = '';

    this.synchronizeUser = function (userId, userGroups, callback) {
        var obj;
        userGroups = userGroups || [];
        for (var i = 0; i < this.groups.length; i++) {
            // If user has no group, but group has user => delete user from group
            if (userGroups.indexOf(this.groups[i]) === -1 &&
                that.main.objects[this.groups[i]].common.members && that.main.objects[this.groups[i]].common.members.indexOf(userId) !== -1) {
                var members = JSON.parse(JSON.stringify(that.main.objects[this.groups[i]].common.members));
                members.splice(members.indexOf(userId), 1);
                obj = {common: {members: members}};
                that.main.socket.emit('extendObject', this.groups[i], obj, function (err) {
                    if (err) {
                        that.main.showError(err);
                        if (callback) callback(err);
                    } else {
                        if (callback) callback();
                    }
                });
            }
            if (userGroups.indexOf(this.groups[i]) !== -1 &&
                (!that.main.objects[this.groups[i]].common.members || that.main.objects[this.groups[i]].common.members.indexOf(userId) === -1)) {
                that.main.objects[this.groups[i]].common.members = that.main.objects[this.groups[i]].common.members || [];
                var _members = JSON.parse(JSON.stringify(that.main.objects[this.groups[i]].common.members));
                _members.push(userId);
                obj = {common: {members: _members}};
                that.main.socket.emit('extendObject', this.groups[i], obj, function (err) {
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

    this.prepare = function () {
        /*that.$grid.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('enabled'), _('groups')],
            colModel: [
                {name: '_id',       index: '_id', width: 250},
                {name: 'name',      index: 'name',    editable: false, width: 150},
                {name: 'enabled',   index: 'enabled', editable: false, width: 70, edittype: 'checkbox', editoptions: {value: "true:false"}},
                {name: 'groups',    index: 'groups',  editable: false, width: 400}
            ],
            pager: $('#pager-users'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            //caption: _('ioBroker users'),
            ignoreCase: true,
            onSelectRow: function (id, e) {
                if (id && id !== that.userLastSelected) {
                    that.$grid.restoreRow(that.userLastSelected);
                    that.userLastSelected = id;
                }

                id = $('tr[id="' + id + '"]').find('td[aria-describedby$="_id"]').html();

                if (!that.list[id] || !that.list[id].common || !that.list[id].common.dontDelete) {
                    $('#del-user').removeClass('ui-state-disabled');
                }
                $('#edit-user').removeClass('ui-state-disabled');

                var rowData = that.$grid.jqGrid('getRowData', id);
                rowData.ack = false;
                rowData.from = '';
                that.$grid.jqGrid('setRowData', id, rowData);
            },
            gridComplete: function () {
                $('#del-user').addClass('ui-state-disabled');
                $('#edit-user').addClass('ui-state-disabled');
                $(".user-groups-edit").multiselect({
                    selectedList: 4,
                    close: function () {
                        that.main.tabs.groups.synchronizeUser($(this).attr('data-id'), $(this).val(), function (err) {
                            if (err) that.init(true);
                        });
                    },
                    checkAllText:     _('Check all'),
                    uncheckAllText:   _('Uncheck All'),
                    noneSelectedText: _('Select options')
                });
                $(".user-enabled-edit").change(function () {
                    var obj = {common: {enabled: $(this).is(':checked')}};
                    var id  = $(this).attr('data-id');
                    that.main.socket.emit('extendObject', id, obj, function (err) {
                        if (err) {
                            that.main.showError(err);
                            that.init(true);
                        }
                    });
                });
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false,
            afterSearch:   function () {
                //initUserButtons();
            }
        }).navGrid('#pager-users', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-users', {
            caption: '',
            buttonicon: 'ui-icon-trash',
            onClickButton: function () {
                var objSelected = that.$grid.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                that.main.confirmMessage(_('Are you sure?'), null, 'help', function (result) {
                    if (result) {
                        that.main.socket.emit('delUser', id.replace('system.user.', ''), function (err) {
                            if (err) {
                                that.main.showMessage(_('Cannot delete user: ') + err, '', 'alert');
                            } else {
                                setTimeout(function () {
                                    that.main.tabs.groups.delUser(id);
                                }, 0);
                            }
                        });

                    }
                });
            },
            position:   'first',
            id:         'del-user',
            title:      _('delete user'),
            cursor:     'pointer'
        }).jqGrid('navButtonAdd', '#pager-users', {
            caption:        '',
            buttonicon:     'ui-icon-pencil',
            onClickButton:  function () {
                var objSelected = that.$grid.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-scripts"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                if (objSelected) {
                    var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                    editUser(id);
                } else {
                    that.main.showMessage(_('Invalid object %s', objSelected), '', 'alert');
                }
            },
            position: 'first',
            id: 'edit-user',
            title: _('edit user'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-users', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                editUser();
            },
            position: 'first',
            id: 'add-user',
            title: _('new user'),
            cursor: 'pointer'
        });

        that.$dialog.dialog({
            autoOpen: false,
            modal:    true,
            width:    340,
            height:   220,
            buttons:  [
                {
                    text: _('Save'),
                    click: saveUser
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        that.$dialog.dialog('close');
                    }
                }
            ]
        });

        patchPager(this, 'users');

        $('#edit-user-name').keydown(function (event) {
            if (event.which == 13) $('#edit-user-pass').focus();
        });
        $('#edit-user-pass').keydown(function (event) {
            if (event.which == 13) $('#edit-user-passconf').focus();
        });
        $('#edit-user-passconf').keydown(function (event) {
            if (event.which == 13) saveUser();
        });
        $("#load_grid-users").show();*/
    };

    function showMessage(text, duration, _class) {
        if (typeof Materialize !== 'undefined') {
            Materialize.toast(that.$grid[0], text, duration|| 3000, _class);
        }
    }

    function firstUpper (str) {
        if (!str) return str;
        return str[0].toUpperCase() + str.substring(1).toLowerCase();
    }

    function delUserFromGroups(id, callback) {
        var someDeleted = false;
        for (var i = 0; i < that.groups.length; i++) {
            // If user has no group, but group has user => delete user from group
            if (that.main.objects[that.groups[i]].common.members && that.main.objects[that.groups[i]].common.members.indexOf(id) !== -1) {
                that.main.objects[that.groups[i]].common.members.splice(that.main.objects[that.groups[i]].common.members.indexOf(id), 1);
                that.main.socket.emit('extendObject', that.groups[i], {
                    common: {
                        members: that.main.objects[that.groups[i]].common.members
                    }
                }, function (err) {
                    if (err) {
                        showMessage(_('Cannot modify groups: %s', err));
                    } else {
                        setTimeout(delUserFromGroups, 0, id);
                    }
                });
                someDeleted = true;
                return;
            }
        }
        callback && callback();
    }

    function deleteUser(id) {
        if (that.main.objects[id] && that.main.objects[id].type === 'user') {
            if (that.main.objects[id].common && that.main.objects[id].common.dontDelete) {
                showMessage(_('Object may not be deleted'), 3000, 'dropZone-error');
            } else {
                delUserFromGroups(id, function () {
                    that.main.socket.emit('delObject', id, function (err) {
                        if (err) {
                            showMessage(_('User may not be deleted: %s', err), 3000, 'dropZone-error');
                        } else {
                            showMessage(_('User deleted'));
                        }
                    });
                });
            }
        } else {
            showMessage(_('Invalid object: %s', id), 3000, 'dropZone-error');
        }
    }

    function createOrEdit(isGroupOrId) {
        var idChanged = false;
        var $dialog = that.$grid.find('#tab-users-dialog-new');
        var options = {
            name:  '',
            icon:  '',
            color: '',
            desc:  '',
            id:    ''
        };
        var parent = isGroupOrId === true ? 'system.group' : 'system.user';
        var oldId = '';

        installFileUpload($dialog, 50000, function (err, text) {
            if (err) {
                showMessage(err, 3000, 'dropZone-error');
            } else {
                if (!text.match(/^data:image\//)) {
                    showMessage(_('Unsupported image format'), 3000, 'dropZone-error');
                    return;
                }
                $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                options.icon = text;

                $dialog.find('.tab-enums-dialog-new-icon').show().html('<img class="treetable-icon" />');
                $dialog.find('.tab-enums-dialog-new-icon .treetable-icon').attr('src', text);
                $dialog.find('.tab-enums-dialog-new-icon-clear').show();
            }
        });
        if (typeof isGroupOrId === 'string') {
            if (that.main.objects[isGroupOrId] && that.main.objects[isGroupOrId].common) {
                options.name  = that.main.objects[isGroupOrId].common.name;
                options.icon  = that.main.objects[isGroupOrId].common.icon;
                options.color = that.main.objects[isGroupOrId].common.color;
            }
            oldId = isGroupOrId;
            options.id = isGroupOrId;
        }
        $dialog.find('.tab-dialog-new-title').text(isGroupOrId === true ? _('Create new group:') : (options.id ? _('Change:') : _('Create new user:')));

        if (options.id) {
            var parts = options.id.split('.');
            options.id = parts.pop();
            parent = parts.join('.');
        }
        $dialog.find('#tab-users-dialog-new-name')
            .val(options.name)
            .unbind('change')
            .bind('change', function () {
                var $id = $('#tab-users-dialog-new-id');
                var id = $id.val();
                var val = $(this).val();
                val = val.replace(/[.\s]/g, '_').trim().toLowerCase();
                if (!id || !idChanged) {
                    $id.val(val);
                    $dialog.find('#tab-users-dialog-new-preview').val(parent + '.' + (val || '#'));
                    Materialize.updateTextFields('#tab-users-dialog-new');
                }
                if ($id.val() && !$id.val().match(/[.\s]/)) {
                    $dialog.find('.tab-dialog-create').removeClass('disabled');
                    $id.removeClass('wrong');
                } else {
                    $dialog.find('.tab-dialog-create').addClass('disabled');
                    $id.addClass('wrong');
                }
            }).unbind('keyup').bind('keyup', function () {
            $(this).trigger('change');
        });

        $dialog.find('#tab-users-dialog-new-id')
            .val(options.id)
            .unbind('change')
            .bind('change', function () {
                idChanged = true;
                var val = $(this).val();
                $dialog.find('#tab-users-dialog-new-preview').val(parent + '.' + ($(this).val() || '#'));
                Materialize.updateTextFields('#tab-users-dialog-new');
                if (val && !val.match(/[.\s]/)) {
                    $dialog.find('.tab-dialog-create').removeClass('disabled');
                    $(this).removeClass('wrong');
                } else {
                    $dialog.find('.tab-dialog-create').addClass('disabled');
                    $(this).addClass('wrong');
                }
            }).unbind('keyup').bind('keyup', function () {
            $(this).trigger('change');
        });

        $dialog.find('.tab-dialog-create')
            .addClass('disabled')
            .unbind('click')
            .text(oldId ? _('Change') : _('Create'))
            .click(function () {
                options.name = $('#tab-enums-dialog-new-name').val();
                if (oldId) {
                    enumRename(
                        oldId,
                        that.enumEdit + '.' + $('#tab-enums-dialog-new-id').val(),
                        options,
                        function (err) {
                            if (err) {
                                showMessage(_('Error: %s', err), 5000, 'dropZone-error');
                            } else {
                                showMessage(_('Updated'));
                            }
                        });
                } else {
                    enumAddChild(
                        parent,
                        parent + '.' + $('#tab-enums-dialog-new-id').val(),
                        options,
                        function (err) {
                            if (err) {
                                showMessage(_('Error: %s', err), 5000, 'dropZone-error');
                            } else {
                                showMessage(_('Updated'));
                            }
                        });
                }
            });

        $dialog.find('#tab-users-dialog-new-preview').val(parent + '.' + (options.id || '#'));

        if (options.icon) {
            $dialog.find('.tab-dialog-new-icon').show().html(that.main.getIcon(oldId));
            $dialog.find('.tab-dialog-new-icon-clear').show();
        } else {
            $dialog.find('.tab-dialog-new-icon').hide();
            $dialog.find('.tab-dialog-new-icon-clear').hide();
        }
        options.color = options.color || false;
        if (options.color) {
            $dialog.find('.tab-dialog-new-color').val(options.color);
        } else {
            $dialog.find('.tab-dialog-new-color').val();
        }

        Materialize.updateTextFields('#tab-users-dialog-new');

        if (typeof Materialize !== 'undefined') {
            Materialize.toast($dialog[0], _('Drop the icons here'), 3000);
        }

        $dialog.find('.tab-dialog-new-upload').unbind('click').click(function () {
            $dialog.find('.drop-file').trigger('click');
        });
        $dialog.find('.tab-dialog-new-icon-clear').unbind('click').click(function () {
            if (options.icon) {
                options.icon = '';
                $dialog.find('.tab-dialog-new-icon').hide();
                $dialog.find('.tab-dialog-create').removeClass('disabled');
                $dialog.find('.tab-dialog-new-icon-clear').hide();
            }
        });
        $dialog.find('.tab-dialog-new-color-clear').unbind('click').click(function () {
            if (options.color) {
                $dialog.find('.tab-dialog-create').removeClass('disabled');
                $dialog.find('.tab-dialog-new-color-clear').hide();
                $dialog.find('.tab-dialog-new-colorpicker').colorpicker({
                    component: '.btn',
                    color: options.color,
                    container: $dialog.find('.tab-dialog-new-colorpicker')
                }).colorpicker('setValue', '');
                options.color = '';
            }
        });
        var time = Date.now();
        try {
            $dialog.find('.tab-dialog-new-colorpicker').colorpicker('destroy');
        } catch (e) {

        }
        $dialog.find('.tab-dialog-new-colorpicker').colorpicker({
            component: '.btn',
            color: options.color,
            container: $dialog.find('.tab-dialog-new-colorpicker')
        }).colorpicker('setValue', options.color).on('showPicker.colorpicker', function (/* event */) {
            var $modal = $dialog.find('.modal-content');
            $modal[0].scrollTop = $modal[0].scrollHeight;
        }).on('changeColor.colorpicker', function (event) {
            if (Date.now() - time > 100) {
                options.color = event.color.toHex();
                $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                $dialog.find('.tab-enums-dialog-new-icon-clear').show();
            }
        });
        if (options.color) {
            $dialog.find('.tab-dialog-new-color-clear').show();
        } else {
            $dialog.find('.tab-dialog-new-color-clear').hide();
        }

        $dialog.modal().modal('open');
    }

    this._postInit = function () {
        /*var text = '';
        for (var i = 0; i < this.list.length; i++) {
            var obj = this.main.objects[this.list[i]];

            var userGroups = [];

            var groups = this.main.tabs.groups.list;
            for (var j = 0; j < groups.length; j++) {
                var gObj = this.main.objects[groups[j]];
                if (gObj && gObj.common && gObj.common.members && gObj.common.members.indexOf(this.list[i]) !== -1) {
                    userGroups.push({id: groups[j], name: gObj.common.name || firstUpper(groups[j].replace(/^system\.group\./, ''))})
                }
            }
            // ID
            text += '<tr><td>' + this.list[i] + '</td>';
            // Name
            text += '<td>' + ((obj.common && obj.common.name) || '') + '</td>';
            text += '<td><input type="checkbox" class="filled-in" id="user_' + this.list[i] + '" checked="checked" /><label for="user_' + this.list[i] + '">Filled in</label></td>';
            text += '<td><select multiple><option value="" disabled selected>' + _('Select groups') + '</option>';
            for (var g = 0; g < userGroups.length; g++) {
                text += '<option value="' + userGroups[g].id + '">' + userGroups[g].name + '</option>';
            }
            text += '</select>';
            text += '<label></label>';
        }
        this.$grid.find('tbody').html(text);*/

        // extract all groups
        this.$gridUsers.treeTable({
            objects:    this.main.objects,
            root:       'system.user',
            columns:    ['title', 'name', 'enabled', 'groups', 'icon', 'color'],
            widths:     ['calc(100% - 250px)', '250px'],
            //classes:    ['', 'treetable-center'],
            name:       'users',
            buttonsWidth: '40px',
            buttons:    [
                {
                    text: false,
                    icons: {
                        primary:'ui-icon-trash'
                    },
                    click: function (id, children, parent) {
                        if (that.main.objects[id] && that.main.objects[id].type === 'user') {
                            that.main.confirmMessage(_('Are you sure to delete %s?', id), null, 'help', function (result) {
                                // If all
                                if (result) {
                                    deleteUser(id);
                                }
                            });
                        } else {
                            showMessage(_('Object "<b>%s</b>" does not exists. Update the page.', id));
                        }
                    },
                    match: function (id) {
                        return !(that.main.objects[id] && that.main.objects[id].common && that.main.objects[id].common.dontDelete);
                    },
                    width: 26,
                    height: 20
                }, {
                    text: false,
                    icons: {
                        primary:'ui-icon-pencil'
                    },
                    match: function (id) {
                        return !!that.main.objects[id];
                    },
                    click: function (id, children, parent) {
                        createOrEdit(id);
                    },
                    width: 26,
                    height: 20
                }
            ],
            panelButtons: [
                {
                    id:   'tab-users-btn-new-user',
                    title: _('New user'),
                    icon:   'person_add',
                    click: function () {
                        createOrEdit(false);
                    }
                }
            ],
            onChange:   function (id, oldId) {
                if (id !== oldId) {
                    that.currentUser = id;
                }
            },
            //onReady:    setupDraggable
        });
        //$('#tab-enums-list-new-enum').addClass('disabled');
        //$('#tab-enums-list-new-category').addClass('disabled');
        this.$gridGroups.treeTable({
            objects:    this.main.objects,
            root:       'system.group',
            columns:    ['title', 'name', 'desc', 'members', 'icon', 'color'],
            widths:     ['calc(100% - 250px)', '250px'],
            //classes:    ['', 'treetable-center'],
            name:       'groups',
            buttonsWidth: '40px',
            buttons:    [
                {
                    text: false,
                    icons: {
                        primary:'ui-icon-trash'
                    },
                    click: function (id, children, parent) {
                        if (that.main.objects[id]) {
                            /*if (that.main.objects[id].type === 'enum') {
                                if (children) {
                                    // ask if only object must be deleted or just this one
                                    that.main.confirmMessage(_('All sub-enums of %s will be deleted too?', id), null, 'help', function (result) {
                                        // If all
                                        if (result) {
                                            that.main._delObjects(id, true, function (err) {
                                                if (!err) {
                                                    showMessage(_('Deleted'));
                                                } else {
                                                    showMessage(_('Error: %s', err));
                                                }
                                            });
                                        } // else do nothing
                                    });
                                } else {
                                    that.main.confirmMessage(_('Are you sure to delete %s?', id), null, 'help', function (result) {
                                        // If all
                                        if (result) that.main._delObjects(id, true, function (err) {
                                            if (!err) {
                                                showMessage(_('Deleted'));
                                            } else {
                                                showMessage(_('Error: %s', err));
                                            }
                                        });
                                    });
                                }
                            } else {
                                that.main.socket.emit('getObject', parent, function (err, obj) {
                                    if (obj && obj.common && obj.common.members) {
                                        var pos = obj.common.members.indexOf(id);
                                        if (pos !== -1) {
                                            obj.common.members.splice(pos, 1);
                                            that.main.socket.emit('setObject', obj._id, obj, function (err) {
                                                if (!err) {
                                                    showMessage(_('Removed'));
                                                } else {
                                                    showMessage(_('Error: %s', err));
                                                }
                                            });
                                        } else {
                                            showMessage(_('%s is not in the list'));
                                        }
                                    }
                                });
                            }
                            */
                        } else {
                            showMessage(_('Object "<b>%s</b>" does not exists. Update the page.', id));
                        }
                    },
                    match: function (id, parent) {
                        if (!parent && that.main.objects[id] && that.main.objects[id].common && that.main.objects[id].common.dontDelete) return false;
                        // you may not delete admin from administrators
                        return !(parent === 'system.group.administrator' && id === 'system.user.admin');
                    },
                    width: 26,
                    height: 20
                }, {
                    text: false,
                    icons: {
                        primary:'ui-icon-pencil'
                    },
                    match: function (id) {
                        return that.main.objects[id] && that.main.objects[id].type === 'group';
                    },
                    click: function (id, children, parent) {
                        createOrEdit(id);
                    },
                    width: 26,
                    height: 20
                }
            ],
            panelButtons: [
                {
                    id:   'tab-users-btn-new-group',
                    title: _('New enum'),
                    icon:   'group_add',
                    click: function () {
                        createOrEdit(true);
                    }
                }
            ],
            //onReady:    setupDraggable
        });
    };

    // ----------------------------- Users show and Edit ------------------------------------------------
    this.init = function (update) {
        if (this.inited && !update) {
            return;
        }

        if (typeof this.$gridUsers !== 'undefined') {
            this._postInit();
            /*this.$grid.jqGrid('clearGridData');
            for (var i = 0; i < this.list.length; i++) {
                var obj = this.main.objects[this.list[i]];
                var select = '<select class="user-groups-edit" multiple="multiple" data-id="' + this.list[i] + '">';

                var groups = this.main.tabs.groups.list;
                for (var j = 0; j < groups.length; j++) {
                    var name = groups[j].substring('system.group.'.length);
                    name = name.substring(0, 1).toUpperCase() + name.substring(1);
                    select += '<option value="' + groups[j] + '"';
                    if (this.main.objects[groups[j]].common && this.main.objects[groups[j]].common.members && this.main.objects[groups[j]].common.members.indexOf(this.list[i]) !== -1) {
                        select += ' selected';
                    }
                    select += '>' + name + '</option>';
                }

                this.$grid.jqGrid('addRowData', 'user_' + this.list[i].replace(/ /g, '_'), {
                    _id:     obj._id,
                    name:    obj.common ? obj.common.name : '',
                    enabled: '<input class="user-enabled-edit" type="checkbox" data-id="' + this.list[i] + '" ' + (obj.common && obj.common.enabled ? 'checked' : '') + '/>',
                    groups:  select
                });
            }
            this.$grid.trigger('reloadGrid');*/
        }
        if (!this.inited) {
            this.inited = true;
            this.main.subscribeObjects('system.user.*');
            this.main.subscribeObjects('system.group.*');
        }
    };

    this.destroy = function () {
        if (this.inited) {
            this.inited = false;
            this.main.unsubscribeObjects('system.user.*');
            this.main.unsubscribeObjects('system.group.*');
        }
    };

    function editUser(id) {
        if (id) {
            var obj = that.main.objects[id];
            that.$dialog.dialog('option', 'title', id);
            $('#edit-user-id').val(obj._id);
            $('#edit-user-name').prop('disabled', true).val(obj.common.name);
            $('#edit-user-pass').val('__pass_not_set__');
            $('#edit-user-passconf').val('__pass_not_set__');
            that.$dialog.dialog('open');
        } else {
            that.$dialog.dialog('option', 'title', _('new user'));
            $('#edit-user-id').val('');
            $('#edit-user-name').prop('disabled', false).val('');
            $('#edit-user-pass').val('');
            $('#edit-user-passconf').val('');
            that.$dialog.dialog('open');
        }
    }

    function saveUser() {
        var pass     = $('#edit-user-pass').val();
        var passconf = $('#edit-user-passconf').val();

        if (pass !== passconf) {
            that.main.showMessage(_('Password and confirmation are not equal!'), '', 'notice');
            return;
        }
        if (!pass) {
            that.main.showMessage(_('Password cannot be empty!'), '', 'notice');
            return;
        }
        var id   = $('#edit-user-id').val();
        var user = $('#edit-user-name').val();

        if (!id) {
            that.main.socket.emit('addUser', user, pass, function (err) {
                if (err) {
                    that.main.showMessage(_('Cannot create user: ') + _(err), '', 'alert');
                } else {
                    that.$dialog.dialog('close');
                    setTimeout(function () {
                        that.init(true);
                    }, 0);
                }
            });
        } else {
            // If password changed
            if (pass !== '__pass_not_set__') {
                that.main.socket.emit('changePassword', user, pass, function (err) {
                    if (err) {
                        that.main.showMessage(_('Cannot set password: ') + _(err), '', 'alert');
                    } else {
                        that.$dialog.dialog('close');
                    }
                });
            } else {
                that.$dialog.dialog('close');
            }
        }
    }

    this.objectChange = function (id, obj) {
        if (id.match(/^system\.user\./)) {
            if (obj) {
                if (this.list.indexOf(id) === -1) this.list.push(id);
            } else {
                var j = this.list.indexOf(id);
                if (j !== -1) this.list.splice(j, 1);
            }

            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.timer = setTimeout(function () {
                that.timer = null;
                that._postInit();
            }, 200);
        } else
        if (id.match(/^system\.group\./)) {
            if (obj) {
                if (this.groups.indexOf(id) === -1) this.groups.push(id);
            } else {
                var i = this.groups.indexOf(id);
                if (i !== -1) this.groups.splice(j, 1);
            }
            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.timer = setTimeout(function () {
                that.timer = null;
                that._postInit();
            }, 200);
        }
    };
}

