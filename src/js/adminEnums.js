function Enums(main) {
    'use strict';

    // enum is first level like enum.function or enum.rooms
    // category is second level like enum.function.light or enum.room.living_room

    var that          = this;

    this.main         = main;
    this.list         = [];
    this.$gridEnum    = $('#tab-enums');
    this.$gridList    = this.$gridEnum.find('.tab-enums-list');
    this.$grid        = this.$gridEnum.find('.tab-enums-objects');
    //this.enumEdit     = null;
    this.updateTimers = null;
    this.editMode     = false;

    var tasks         = [];
    var standardEnums = [
        {
            "_id": "enum.rooms",
            "common": {
                "name": {
                    "en": "Rooms",
                    "de": "Räume",
                    "ru": "Комнаты",
                    "pt": "Quartos",
                    "nl": "Kamers",
                    "fr": "Pièces",
                    "it": "Camere",
                    "es": "Habitaciones"
                },
                "desc": {
                    "en": "List of the rooms",
                    "de": "Liste der Räumen",
                    "ru": "Список комнат",
                    "pt": "Lista dos quartos",
                    "nl": "Lijst met kamers",
                    "fr": "Liste des chambres",
                    "it": "Elenco delle stanze",
                    "es": "Lista de las habitaciones"
                },
                "members": [],
                "object-non-deletable": true
            },
            "type": "enum",
            "acl": {
                "owner": "system.user.admin",
                "ownerGroup": "system.group.administrator",
                "permissions": 1911
            }
        },
        {
            "_id": "enum.functions",
            "common": {
                "name": {
                    "en": "Functions",
                    "de": "Funktionen",
                    "ru": "функции",
                    "pt": "Funções",
                    "nl": "functies",
                    "fr": "Les fonctions",
                    "it": "funzioni",
                    "es": "Funciones"
                },
                "desc": {
                    "en": "List of the functions",
                    "de": "Liste der Funktionen",
                    "ru": "Список функций",
                    "pt": "Lista das funções",
                    "nl": "Lijst met functies",
                    "fr": "Liste des fonctions",
                    "it": "Elenco delle funzioni",
                    "es": "Lista de las funciones"
                },
                "members": [],
                "object-non-deletable": true
            },
            "type": "enum",
            "acl": {
                "owner": "system.user.admin",
                "ownerGroup": "system.group.administrator",
                "permissions": 1911
            }
        }
    ];

    var selectId = function () {
        if (!that.$grid || !that.$grid.selectId) return;
        selectId = that.$grid.selectId.bind(that.$grid);
        return that.$grid.selectId.apply(that.$grid, arguments);
    };

    function enumRename(oldId, newId, newCommon, callback) {
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
            _enumRename(oldId, newId, newCommon, function () {
                if (tasks.length) {
                    enumRename(undefined, undefined, undefined, callback);
                } else {
                    if (callback) callback();
                }
            });
        }
    }

    function _enumRename(oldId, newId, newCommon, callback) {
        //Check if this name exists
        if (oldId !== newId && that.main.objects[newId]) {
            showMessage(_('Name yet exists!'), true);
            that.init(true);
            if (callback) callback();
        } else {
            if (oldId === newId) {
                if (newCommon && (newCommon.name !== undefined || newCommon.icon !== undefined || newCommon.color !== undefined)) {
                    tasks.push({name: 'extendObject', id:  oldId, obj: {common: newCommon}});
                }
                if (callback) callback();
            } else if (that.main.objects[oldId] && that.main.objects[oldId].common && that.main.objects[oldId].common.nondeletable) {
                showMessage(_('Change of enum\'s id "%s" is not allowed!', oldId), true);
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
                                if (newCommon && newCommon.name  !== undefined) obj.common.name  = newCommon.name;
                                if (newCommon && newCommon.icon  !== undefined) obj.common.icon  = newCommon.icon;
                                if (newCommon && newCommon.color !== undefined) obj.common.color = newCommon.color;
                                tasks.push({name: 'delObject', id: oldId});
                                tasks.push({name: 'setObject', id: newId, obj: obj});
                                // Rename all children
                                var count = 0;
                                for (var i = 0; i < leaf.children.length; i++) {
                                    var n = leaf.children[i].replace(oldId, newId);
                                    count++;
                                    _enumRename(leaf.children[i], n, null, function () {
                                        if (!--count && callback) callback();
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
                                if (newCommon && newCommon.name  !== undefined) obj.common.name  = newCommon.name;
                                if (newCommon && newCommon.icon  !== undefined) obj.common.icon  = newCommon.icon;
                                if (newCommon && newCommon.color !== undefined) obj.common.color = newCommon.color;
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

    function enumAddChild(parent, newId, common, callback) {
        if (that.main.objects[newId]) {
            showMessage(_('Name yet exists!'), true);
            return false;
        }

        that.main.socket.emit('setObject', newId, {
            _id:            newId,
            common:   {
                name:       common.name,
                members:    [],
                icon:       common.icon,
                color:      common.color
            },
            type: 'enum'
        }, callback);
        return true;
    }

    function prepareNewEnum() {
        var text = '';
        for (var e = 0; e < standardEnums.length; e++) {
            if (that.list.indexOf(standardEnums[e]._id) === -1) {
                text += '<li class="new-enum-item" data-id="' + standardEnums[e]._id + '"><a>' + getName(standardEnums[e]) + '</a></li>';
            }
        }

        if (text) {
            text += '<li class="divider"></li>';
        }
        text += '<li class="new-enum-item"><a><i class="material-icons">view_module</i><span class="translate">custom enum</span></a></li>';
        that.$gridEnum.find('#btn-new-enum').html(text);
        that.$gridEnum.find('.btn-new-enum-btn').dropdown();
        that.$gridEnum.find('.new-enum-item').click(function () {

        });
    }

    this.prepare = function () {
    };

    function getName(objects, id) {
        var name;
        if (!id) {
            name = objects;
        } else {
            name = objects[id];
        }
        if (name && name.common && name.common.name) {
            name = name.common.name;
            if (typeof name === 'object') {
                name = name[systemLang] || name.en;
            }
        } else {
            var parts = id.split('.');
            name = parts.pop();
            name = name[0].toUpperCase() + name.substring(1).toLowerCase();
        }
        return name;
    }

    function drawChip(id, group) {
        var text = '';
        text += '<div class="chip" title="' + id + '">' +
            that.main.getIcon(id) +
            '<span>' +
            '<span class="chip-name">' + getName(that.main.objects, id) + '</span>' +
//            '<span class="chip-id">' + id + '</span>' +
            '</span>' +
            '<i class="close material-icons" data-enum="' + group + '" data-id="' + id +'">close</i>' +
            '</div>';
        return text;
    }

    function drawEnum(id, $page) {
        var obj = that.main.objects[id];
        var text =
            '<div class="raw enum-buttons">' +
            '   <div class="col s12">' +
            '       <a class="btn-floating waves-effect waves-light blue btn-new-category" title="' + _('New category') + '" data-id="' + id + '">' +
            '           <i class="material-icons">library_add</i>' +
            '       </a>' +
            '       <a class="btn-floating waves-effect waves-light btn-edit-category" title="' + _('Edit category') + '" data-id="' + id + '">' +
            '           <i class="material-icons">edit</i>' +
            '       </a>' +
            '       <a class="btn-floating waves-effect waves-light red lighten-2 btn-del-category ' + (obj && obj.common && obj.common['object-non-deletable'] ? 'disabled' : '') + '" title="' + _('Delete category') + '" data-id="' + id + '">' +
            '           <i class="material-icons">delete</i>' +
            '       </a>' +
            '   </div>' +
            '</div>';

        text += '<div class="raw"><div class="col s12"><ul class="collection">';

        for (var se = 0; se < that.list.length; se++) {
            if (that.list[se].substring(0, id.length + 1) === id + '.') {
                var en = that.main.objects[that.list[se]];
                var inverted;
                var style;
                if (en && en.common && en.common.color) {
                    style = 'background: ' + en.common.color  + '; ';
                    if (that.main.invertColor(en.common.color)) {
                        inverted = true;
                        style += 'color: white;';
                    }
                }

                text += '<li class="collection-item avatar" data-id="' + that.list[se] + '" style="' + style + '">' +
                    that.main.getIcon(that.list[se], null, null, 'circle') +
                    '<span class="title">' + getName(that.main.objects, that.list[se]) + '</span>' +
                    '<p>' + that.list[se] + '</p>';

                if (en && en.common && en.common.members && en.common.members.length) {
                    for (var m = 0; m < en.common.members.length; m++) {
                        text += drawChip(en.common.members[m], that.list[se]);
                    }
                }
                text += '<a class="edit-content"   data-id="' + that.list[se] + '"><i class="material-icons">edit</i></a>';
                text += '<a class="delete-content ' + (en && en.common && en.common['object-non-deletable'] ? 'disabled' : '') + '" data-id="' + that.list[se] + '"><i class="material-icons">delete</i></a>';
                text += '</li>';
            }
        }
        text += '</ul></div></div>';
        $page.html(text);
    }

    function drawEnums() {
        var $tableBody = that.$gridList.find('.tree-table-body');
        var text = '<div class="col s12 cron-main-tab">';
        text += '<ul class="tabs">';
        for (var e = 0; e < that.list.length; e++) {
            var parts = that.list[e].split('.');
            if (parts.length !== 2) continue;
            var name = getName(that.main.objects, that.list[e]);
            var id = that.list[e].replace(/[#.\s_]/g, '-');
            text += '<li class="tab col"><a href="#enum-' + id + '" class="translate">' + name + '</a></li>';
        }
        text += '</ul>';
        text += '</div>';
        for (var se = 0; se < that.list.length; se++) {
            var parts = that.list[se].split('.');
            if (parts.length !== 2) continue;

            var id = that.list[se].replace(/[#.\s_]/g, '-');
            text += '<div id="enum-' + id + '" class="col s12 page" data-id="' + that.list[se] + '" data-type="second">';
            text += '</div>';
        }
        $tableBody.html(text);

        $tableBody.find('.tabs').mtabs({
            onShow: function (tab) {
                that.main.saveConfig('enums-active', $(tab).attr('id'));
            }
        });

        if (that.main.config['enums-active']) {
            $tableBody.find('.tabs').mtabs('select', that.main.config['enums-active']);
        }

        $tableBody.find('.page').each(function () {
            drawEnum($(this).data('id'), $(this));
        });
        $tableBody.find('.btn-new-category').click(function () {
            createOrEditEnum(null, $(this).data('id'));
        });
        $tableBody.find('.btn-edit-category').click(function () {
            createOrEditEnum($(this).data('id'));
        });
        $tableBody.find('.btn-del-category').click(function () {
            deleteEnum($(this).data('id'));
        });
        $tableBody.find('.edit-content').click(function () {
            createOrEditEnum($(this).data('id'));
        });
        $tableBody.find('.delete-content').click(function () {
            deleteEnum($(this).data('id'));
        });
        $tableBody.find('.close').click(function () {
            removeMember($(this).data('id'), $(this).data('enum'));
        });
    }

    function getEnumsChildren(id) {
        var parts = id.split('.');
        var items = [];
        var regex = new RegExp('^' + id.replace(/\./g, '\\.') + '\\.');
        for (var se = 0; se < that.list.length; se++) {
            var _parts = that.list[se].split('.');
            if (_parts.length === parts.length + 1 && regex.test(that.list[se])) {
                items.push(that.list[se]);
            }
        }
        return items;
    }
    
    function deleteEnum(id) {
        if (that.main.objects[id].type === 'enum') {
            var children = getEnumsChildren(id);
            
            if (children && children.length) {
                // ask if only object must be deleted or just this one
                that.main.confirmMessage(_('All sub-enums of %s will be deleted too?', id), null, 'help', function (result) {
                    // If all
                    if (result) {
                        that.main._delObjects(id, true, function (err) {
                            if (!err) {
                                showMessage(_('Deleted'));
                            } else {
                                showMessage(_('Error: %s', err), true);
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
                            showMessage(_('Error: %s', err), true);
                        }
                    });
                });
            }
        }
    }
    
    function removeMember(id, parent) {
        that.main.socket.emit('getObject', parent, function (err, obj) {
            if (obj && obj.common && obj.common.members) {
                var pos = obj.common.members.indexOf(id);
                if (pos !== -1) {
                    obj.common.members.splice(pos, 1);
                    that.main.socket.emit('setObject', obj._id, obj, function (err) {
                        if (!err) {
                            showMessage(_('Removed'));
                        } else {
                            showMessage(_('Error: %s', err), true);
                        }
                    });
                } else {
                    showMessage(_('%s is not in the list'));
                }
            }
        });
        
    }
    
    function showMessage(text, duration, isError) {
        if (typeof duration === 'boolean') {
            isError = duration;
            duration = 3000;
        }
        that.main.showToast(that.$gridEnum.find('.tree-table-buttons'), text, null, duration, isError);
    }

    function setupDraggable() {
        that.$gridEnum.find('.fancytree-container>tbody')
            .sortable({
                connectWith:    '#tab-enums .tab-enums-list .tree-table-main.treetable',
                items:          '.fancytree-type-draggable',
                appendTo:       that.$gridEnum,
                refreshPositions: true,
                helper:         function (e, $target) {
                    return $('<div class="fancytree-drag-helper">' + $target.find('.fancytree-title').text() + '</div>');
                },
                zIndex:         999990,
                revert:         false,
                scroll:         false,
                start:          function (e, ui) {
                    var $prev = ui.item.prev();
                    // place this item back where it was
                    ui.item.data('prev', $prev);
                    that.$gridEnum.addClass('dragging');
                },
                stop:           function (e, ui) {
                    that.$gridEnum.removeClass('dragging');
                },
                update: function (event, ui) {
                    // place this item back where it was
                    var $prev = ui.item.data('prev');
                    if (!$prev || !$prev.length) {
                        $(this).prepend(ui.item);
                    } else {
                        $($prev).after(ui.item);
                    }
                }
            })
            .disableSelection();
    }

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

        setupDraggable();

        var $collection = this.$gridEnum.find('.tree-table-body .collection');
        setupDroppable($collection);
    };

    /*function setupDroppable($treetable) {
        if (!that.editMode) return;

        $treetable.find('tbody>tr.treetable-enum').droppable({
            accept: '.fancytree-type-draggable',
            over: function (e, ui) {
                $(this).addClass('tab-accept-item');
                if ($(this).hasClass('not-empty') && !$(this).hasClass('expanded')) {
                    var id = $(this).data('tt-id');
                    var timer;
                    if ((timer = $(this).data('timer'))) {
                        clearTimeout(timer);
                    }
                    $(this).data('timer', setTimeout(function () {
                        that.$gridList.treeTable('expand', $(this).data('tt-id'));
                    }, 1000));
                }
            },
            out: function (e, ui) {
                $(this).removeClass('tab-accept-item');
                var timer;
                if ((timer = $(this).data('timer'))) {
                    clearTimeout(timer);
                    $(this).data('timer', null);
                }
            },
            tolerance: 'pointer',
            drop: function (e, ui) {
                $(this).removeClass('tab-accept-item');
                var id = ui.draggable.data('id');
                var enumId = $(this).data('tt-id');

                that.main.socket.emit('getObject', enumId, function (err, obj) {
                    if (obj && obj.common) {
                        obj.common.members = obj.common.members || [];
                        var pos = obj.common.members.indexOf(id);
                        if (pos === -1) {
                            obj.common.members.push(id);
                            obj.common.members.sort();
                            that.main.socket.emit('setObject', obj._id, obj, function (err) {
                                if (!err) {
                                    showMessage(_('%s added to %s', id, obj._id));
                                } else {
                                    showMessage(_('Error: %s', err), true);
                                }
                            });
                        } else {
                            showMessage(_('Is yet in the list'));
                        }
                    }
                });
            }
        });
    }*/
    function setupDroppable($collection) {
        if (!that.editMode) return;

        $collection.find('.collection-item').droppable({
            accept: '.fancytree-type-draggable',
            over: function (e, ui) {
                $(this).addClass('tab-accept-item');
                /*if ($(this).hasClass('not-empty') && !$(this).hasClass('expanded')) {
                    var id = $(this).data('tt-id');
                    var timer;
                    if ((timer = $(this).data('timer'))) {
                        clearTimeout(timer);
                    }
                    $(this).data('timer', setTimeout(function () {
                        that.$gridList.treeTable('expand', $(this).data('tt-id'));
                    }, 1000));
                }*/
            },
            out: function (e, ui) {
                $(this).removeClass('tab-accept-item');
                /*var timer;
                if ((timer = $(this).data('timer'))) {
                    clearTimeout(timer);
                    $(this).data('timer', null);
                }*/
            },
            tolerance: 'pointer',
            drop: function (e, ui) {
                $(this).removeClass('tab-accept-item');
                var id = ui.draggable.data('id');
                var enumId = $(this).data('id');

                that.main.socket.emit('getObject', enumId, function (err, obj) {
                    if (obj && obj.common) {
                        obj.common.members = obj.common.members || [];
                        var pos = obj.common.members.indexOf(id);
                        if (pos === -1) {
                            obj.common.members.push(id);
                            obj.common.members.sort();
                            that.main.socket.emit('setObject', obj._id, obj, function (err) {
                                if (!err) {
                                    showMessage(_('%s added to %s', id, obj._id));
                                } else {
                                    showMessage(_('Error: %s', err), true);
                                }
                            });
                        } else {
                            showMessage(_('Is yet in the list'));
                        }
                    }
                });
            }
        });
    }

    function createOrEditEnum(id, parentId) {
        var idChanged = false;
        var $dialog = that.$gridEnum.find('#tab-enums-dialog-new');
        var oldId   = '';

        var nameVal  = '';
        var idVal    = '';
        var iconVal  = '';
        var colorVal = '';

        var isIdEditable = true;

        installFileUpload($dialog, 50000, function (err, text) {
            if (err) {
                showMessage(err, true);
            } else {
                if (!text.match(/^data:image\//)) {
                    showMessage(_('Unsupported image format'), true);
                    return;
                }
                $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                iconVal   = text;

                $dialog.find('.tab-enums-dialog-new-icon').show().html('<img class="treetable-icon" />');
                $dialog.find('.tab-enums-dialog-new-icon .treetable-icon').attr('src', text);
                $dialog.find('.tab-enums-dialog-new-icon-clear').show();
            }
        });

        if (id) {
            if (that.main.objects[id] && that.main.objects[id].common) {
                nameVal      = that.main.objects[id].common.name;
                if (typeof nameVal === 'object') {
                    nameVal = nameVal[systemLang] || nameVal.en;
                }
                iconVal      = that.main.objects[id].common.icon;
                colorVal     = that.main.objects[id].common.color;
                isIdEditable = !that.main.objects[id].common['object-non-deletable'];
            }
            oldId = id;
            idVal = id;
        }

        $dialog.find('.tab-enums-dialog-new-title').text(parentId ? _('Create new category') : (idVal ? _('Rename') : _('Create new enum')));

        if (idVal) {
            var parts = idVal.split('.');
            if (parts.length <= 2) {
                id = true;
            }
            idVal = parts.pop();
            parentId = parts.join('.');
        }

        $dialog.find('#tab-enums-dialog-new-name')
            .val(nameVal)
            .unbind('change')
            .bind('change', function () {
                var $id = $('#tab-enums-dialog-new-id');
                var id = $id.val();
                var val = $(this).val();
                val = val.replace(/[.\s]/g, '_').trim().toLowerCase();
                if (isIdEditable && (!id || !idChanged)) {
                    $id.val(val);
                    $dialog.find('#tab-enums-dialog-new-preview').val((parentId || 'enum') + '.' + (val || '#'));
                    // detect materialize
                    M.updateTextFields('#tab-enums-dialog-new');
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

        $dialog.find('#tab-enums-dialog-new-id')
            .val(idVal)
            .unbind('change')
            .bind('change', function () {
                idChanged = true;
                var val = $(this).val();
                $dialog.find('#tab-enums-dialog-new-preview').val((parentId || 'enum') + '.' + ($(this).val() || '#'));
                M.updateTextFields('#tab-enums-dialog-new');

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

        $dialog.find('#tab-enums-dialog-new-id').prop('disabled', !isIdEditable);

        $dialog.find('.tab-enums-dialog-create')
            .addClass('disabled')
            .unbind('click')
            .text(oldId ? _('Change') : _('Create'))
            .click(function () {
                if (oldId) {
                    enumRename(
                        oldId,
                        parentId + '.' + $('#tab-enums-dialog-new-id').val(),
                        {
                            name:  $('#tab-enums-dialog-new-name').val(),
                            icon:  iconVal,
                            color: colorVal
                        },
                        function (err) {
                        if (err) {
                            showMessage(_('Error: %s', err), true);
                        } else {
                            showMessage(_('Updated'));
                        }
                    });
                } else {
                    enumAddChild(
                        parentId,
                        (parentId || 'enum') + '.' + $('#tab-enums-dialog-new-id').val(),
                        {
                            name:  $dialog.find('#tab-enums-dialog-new-name').val(),
                            icon:  iconVal,
                            color: colorVal
                        },
                        function (err) {
                        if (err) {
                            showMessage(_('Error: %s', err), true, 5000);
                        } else {
                            showMessage(_('Updated'));
                        }
                    });
                }
            });

        $dialog.find('#tab-enums-dialog-new-preview').val((parentId || 'enum') + '.' + (idVal || '#'));

        if (iconVal) {
            $dialog.find('.tab-enums-dialog-new-icon').show().html(that.main.getIcon(oldId));
            $dialog.find('.tab-enums-dialog-new-icon-clear').show();
        } else {
            $dialog.find('.tab-enums-dialog-new-icon').hide();
            $dialog.find('.tab-enums-dialog-new-icon-clear').hide();
        }
        colorVal = colorVal || false;
        if (colorVal) {
            $dialog.find('.tab-enums-dialog-new-color').val(colorVal);
        } else {
            $dialog.find('.tab-enums-dialog-new-color').val();
        }

        M.updateTextFields('#tab-enums-dialog-new');
        that.main.showToast($dialog, _('Drop the icons here'));

        $dialog.find('.tab-enums-dialog-new-upload').unbind('click').click(function () {
            $dialog.find('.drop-file').trigger('click');
        });
        $dialog.find('.tab-enums-dialog-new-icon-clear').unbind('click').click(function () {
            if (iconVal) {
                iconVal = '';
                $dialog.find('.tab-enums-dialog-new-icon').hide();
                $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                $dialog.find('.tab-enums-dialog-new-icon-clear').hide();
            }
        });
        $dialog.find('.tab-enums-dialog-new-color-clear').unbind('click').click(function () {
            if (colorVal) {
                $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                $dialog.find('.tab-enums-dialog-new-color-clear').hide();
                $dialog.find('.tab-enums-dialog-new-colorpicker').colorpicker({
                    component: '.btn',
                    color: colorVal,
                    container: $dialog.find('.tab-enums-dialog-new-colorpicker')
                }).colorpicker('setValue', '');
                colorVal = '';
            }
        });
        var time = Date.now();
        try {
            $dialog.find('.tab-enums-dialog-new-colorpicker').colorpicker('destroy');
        } catch (e) {

        }
        $dialog.find('.tab-enums-dialog-new-colorpicker').colorpicker({
            component: '.btn',
            color: colorVal,
            container: $dialog.find('.tab-enums-dialog-new-colorpicker')
        }).colorpicker('setValue', colorVal).on('showPicker.colorpicker', function (/* event */) {
            //$dialog.find('.tab-enums-dialog-new-colorpicker')[0].scrollIntoView(false);
            var $modal = $dialog.find('.modal-content');
            $modal[0].scrollTop = $modal[0].scrollHeight;
        }).on('changeColor.colorpicker', function (event){
            if (Date.now() - time > 100) {
                colorVal = event.color.toHex();
                $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                $dialog.find('.tab-enums-dialog-new-icon-clear').show();
            }
        });
        if (colorVal) {
            $dialog.find('.tab-enums-dialog-new-color-clear').show();
        } else {
            $dialog.find('.tab-enums-dialog-new-color-clear').hide();
        }

        $dialog.modal().modal('open');
    }

    function switchEditMode(isEnabled) {
        that.editMode = isEnabled;
        var $editButton = that.$gridEnum.find('#tab-enums-list-edit');

        if (that.editMode) {
            $editButton.removeClass('blue').addClass('red');
            that.$gridEnum.addClass('tab-enums-edit');
            that._initObjectTree();
            showMessage(_('You can drag&drop the devices, channels and states to enums'));
        } else {
            selectId('destroy');
            try {
                that.$gridEnum.find('.treetable-list').droppable('destroy');
            } catch (e) {
                console.error(e);
            }

            $editButton.removeClass('red').addClass('blue');
            that.$gridEnum.removeClass('tab-enums-edit');
        }
    }

    this._postInit = function () {
        if (typeof this.$gridList !== 'undefined') {
            prepareNewEnum();
            drawEnums();
            if (this.editMode) {
                this._initObjectTree();
            } else {
                selectId('destroy');
            }
            this.$gridList.find('.btn-new-enum').unbind('click').click(function () {
                createOrEditEnum(null, $(this).data('id'));
            });

            this.$gridList.find('.btn-edit').unbind('click').click(function () {
                switchEditMode(!that.editMode);
            });

            // extract all enums
            /*
            this.$gridList.treeTable({
                objects:    this.main.objects,
                root:       'enum',
                columns:    ['title', 'name'],
                members:    true,
                colors:     true,
                icons:      true,
                widths:     ['calc(100% - 250px)', '250px'],
                //classes:    ['', 'treetable-center'],
                name:       'enums',
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
                                                that.main._delObjects(id, true, function (err) {
                                                    if (!err) {
                                                        showMessage(_('Deleted'));
                                                    } else {
                                                        showMessage(_('Error: %s', err), true);
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
                                                    showMessage(_('Error: %s', err), true);
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
                                                        showMessage(_('Error: %s', err), true);
                                                    }
                                                });
                                            } else {
                                                showMessage(_('%s is not in the list'));
                                            }
                                        }
                                    });
                                }
                            } else {
                                showMessage(_('Object "<b>%s</b>" does not exists. Update the page.', id));
                            }
                        },
                        width: 26,
                        height: 20
                    }, {
                        text: false,
                        icons: {
                            primary:'ui-icon-pencil'
                        },
                        match: function (id) {
                            return that.main.objects[id] && that.main.objects[id].type === 'enum';
                        },
                        click: function (id, children, parent) {
                            createOrEditEnum(id);
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
                            createOrEditEnum(false);
                        }
                    },
                    {
                        id:   'tab-enums-list-new-category',
                        title:   _('New category'),
                        icon:   'library_add',
                        click: function () {
                            createOrEditEnum(true);
                        }
                    },
                    {
                        id:   'tab-enums-list-edit',
                        title: _('Edit'),
                        icon:   'edit',
                        click: function () {
                            switchEditMode(!that.editMode);
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
                },
                onReady:    setupDroppable
            });//.treeTable('show', currentEnum);
            $('#tab-enums-list-new-enum').addClass('disabled');
            $('#tab-enums-list-new-category').addClass('disabled');
            */
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
        switchEditMode(false);
        this.$gridList.treeTable('destroy');
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
}