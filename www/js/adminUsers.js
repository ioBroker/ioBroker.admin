function Users(main) {
    var that     = this;
    this.list    = [];
    this.$grid   = $('#grid-users');
    this.$dialog = $('#dialog-user');
    this.main    = main;
    this.userLastSelected = null;


    this.prepare = function () {
        that.$grid.jqGrid({
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
            caption: _('ioBroker users'),
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
                        that.main.tabs.groups.synchronizeUser($(this).attr('data-id'), $(this).val());
                    },
                    checkAllText:     _('Check all'),
                    uncheckAllText:   _('Uncheck All'),
                    noneSelectedText: _('Select options')
                });
                $(".user-enabled-edit").change(function () {
                    var obj = {common: {enabled: $(this).is(':checked')}};
                    var id  = $(this).attr('data-id');
                    that.main.socket.emit('extendObject', id, obj);
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
        $('#edit-user-name').keydown(function (event) {
            if (event.which == 13) $('#edit-user-pass').focus();
        });
        $('#edit-user-pass').keydown(function (event) {
            if (event.which == 13) $('#edit-user-passconf').focus();
        });
        $('#edit-user-passconf').keydown(function (event) {
            if (event.which == 13) saveUser();
        });
        $("#load_grid-users").show();
    };

    // ----------------------------- Users show and Edit ------------------------------------------------
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
            for (var i = 0; i < that.list.length; i++) {
                var obj = that.main.objects[that.list[i]];
                var select = '<select class="user-groups-edit" multiple="multiple" data-id="' + that.list[i] + '">';

                var groups = that.main.tabs.groups.list;
                for (var j = 0; j < groups.length; j++) {
                    var name = groups[j].substring('system.group.'.length);
                    name = name.substring(0, 1).toUpperCase() + name.substring(1);
                    select += '<option value="' + groups[j] + '"';
                    if (that.main.objects[groups[j]].common && that.main.objects[groups[j]].common.members && that.main.objects[groups[j]].common.members.indexOf(that.list[i]) != -1) select += ' selected';
                    select += '>' + name + '</option>';
                }

                that.$grid.jqGrid('addRowData', 'user_' + that.list[i].replace(/ /g, '_'), {
                    _id:     obj._id,
                    name:    obj.common ? obj.common.name : '',
                    enabled: '<input class="user-enabled-edit" type="checkbox" data-id="' + that.list[i] + '" ' + (obj.common && obj.common.enabled ? 'checked' : '') + '/>',
                    groups:  select
                });
            }
            that.$grid.trigger('reloadGrid');
        }
    };

    function editUser(id) {
        if (id) {
            var obj = that.main.objects[id];
            that.$dialog.dialog('option', 'title', id);
            $('#edit-user-id').val(obj._id);
            $('#edit-user-name').val(obj.common.name);
            $('#edit-user-name').prop('disabled', true);
            $('#edit-user-pass').val('__pass_not_set__');
            $('#edit-user-passconf').val('__pass_not_set__');
            that.$dialog.dialog('open');
        } else {
            that.$dialog.dialog('option', 'title', 'new user');
            $('#edit-user-id').val('');
            $('#edit-user-name').val('');
            $('#edit-user-name').prop('disabled', false);
            $('#edit-user-pass').val('');
            $('#edit-user-passconf').val('');
            that.$dialog.dialog('open');
        }
    }

    function saveUser() {
        var pass     = $('#edit-user-pass').val();
        var passconf = $('#edit-user-passconf').val();

        if (pass != passconf) {
            that.main.showMessage(_('Password and confirmation are not equal!'), '', 'notice');
            return;
        }
        var id   = $('#edit-user-id').val();
        var user = $('#edit-user-name').val();

        if (!id) {
            that.main.socket.emit('addUser', user, pass, function (err) {
                if (err) {
                    that.main.showMessage(_('Cannot set password: ') + err, '', 'alert');
                } else {
                    that.$dialog.dialog('close');
                    setTimeout(function () {
                        that.init(true);
                    }, 0);
                }
            });
        } else {
            // If password changed
            if (pass != '__pass_not_set__') {
                that.main.socket.emit('changePassword', user, pass, function (err) {
                    if (err) {
                        that.main.showMessage(_('Cannot set password: ') + err, '', 'alert');
                    } else {
                        that.$dialog.dialog('close');
                    }
                });
            }
        }
    }

    this.objectChange = function (id, obj) {
        if (id.match(/^system\.user\./)) {
            if (obj) {
                if (this.list.indexOf(id) == -1) this.list.push(id);
            } else {
                var j = this.list.indexOf(id);
                if (j != -1) this.list.splice(j, 1);
            }

            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.timer = setTimeout(function () {
                that.timer = null;
                that.main.tabs.groups.init(true);
                that.init(true);
            }, 200);
        }
    };
    
    this.resize = function (width, height) {
        this.$grid.setGridHeight(height - 150).setGridWidth(width - 20);
    };

}

