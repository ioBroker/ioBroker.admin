function Objects(main) {
    'use strict';

    var that = this;
    this.$dialog        = $('#dialog-object');
    this.$grid          = $('#grid-objects');
    this.subscribes     = {};

    this.main = main;

    //var selectId = this.$grid.selectId.bind(this.$grid);
    var selectId = function () {
        if (!that.$grid || !that.$grid.selectId) return;
        selectId = that.$grid.selectId.bind(that.$grid);
        return that.$grid.selectId.apply(that.$grid, arguments);
    };

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
            open: function (event, ui) {
                $(event.target).parent().find('.ui-dialog-titlebar-close .ui-button-text').html('');
            },
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
                if (ui.newPanel.selector === '#object-tab-raw') {
                    var obj = that.saveFromTabs();

                    if (!obj) return false;

                    that.editor.setValue(JSON.stringify(obj, null, 2));
                } else if (ui.oldPanel.selector === '#object-tab-raw') {
                    var _obj;
                    try {
                        _obj = JSON.parse(that.editor.getValue());
                    } catch (e) {
                        that.main.showMessage(e, _('Parse error'), 'error_outline');
                        $('#object-tabs').tabs({active: 4});
                        return false;
                    }
                    that.load(_obj);
                }
                return true;
            }
        });

        if (!that.editor) {
            that.editor = ace.edit('view-object-raw');
            that.editor.getSession().setMode('ace/mode/json');
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

                        if (!field || field.indexOf(' ') !== -1) {
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
            ],
            open: function (event, ui) {
                $(event.target).parent().find('.ui-dialog-titlebar-close .ui-button-text').html('');
            }
        });

        $('#dialog-new-object').dialog( {
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
                        if (type === 'state') {
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
                            if (stype === 'boolean') {
                                obj.common.def = false;
                            } else if (stype === 'switch') {
                                obj.common.type   = 'boolean';
                                obj.common.def    = false;
                                obj.common.states = 'false:no;true:yes';
                            } else if (stype === 'string') {
                                obj.common.def = '';
                            } else if (stype === 'number') {
                                obj.common.min  = 0;
                                obj.common.max  = 100;
                                obj.common.def  = 0;
                                obj.common.unit = '%';
                            } else if (stype === 'enum') {
                                obj.common.type   = 'number';
                                obj.common.min    = 0;
                                obj.common.max    = 5;
                                obj.common.def    = 0;
                                obj.common.states = '0:zero;1:one;2:two;3:three;4:four;5:five';
                            }
                        } else if (type === 'channel') {
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
                                    if (_obj.type === 'state') {
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
            ],
            open: function (event, ui) {
                $(event.target).parent().find('.ui-dialog-titlebar-close .ui-button-text').html('');
            }
        });

        $('#object-tab-new-object-type').change(function () {
            if ($(this).val() === 'state') {
                $('#object-tabe-new-object-tr').show();
            } else {
                $('#object-tabe-new-object-tr').hide();
            }
        });

        $('#object-tab-new-name').keydown(function (e) {
            if (e.keyCode === 13) {
                setTimeout(function () {
                    $('#dialog-object-tab-new').trigger('click');
                }, 100);
            }
        });

        $('#object-tab-new-common').button({
            label: _('New'),
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
            if (objectType === 'state' && part === 'common' && attr === 'type') {
                text += '<select class="object-tab-edit-string" data-attr="' + attr + '">' +
                    '<option value="boolean" ' + (object[attr] === 'boolean' ? 'selected' : '') + '>' + _('boolean') + '</option>' +
                    '<option value="string"  ' + (object[attr] === 'string'  ? 'selected' : '') + '>' + _('string')  + '</option>' +
                    '<option value="number"  ' + (object[attr] === 'number'  ? 'selected' : '') + '>' + _('number')  + '</option>' +
                    '<option value="array"   ' + (object[attr] === 'array'   ? 'selected' : '') + '>' + _('array')   + '</option>' +
                    '<option value="object"  ' + (object[attr] === 'object'  ? 'selected' : '') + '>' + _('object')  + '</option>' +
                    '<option value="mixed"   ' + (object[attr] === 'mixed'   ? 'selected' : '') + '>' + _('mixed')   + '</option>' +
                    '</select>';
            } else if (typeof object[attr] === 'string') {
                text += '<input type="text" class="object-tab-edit-string" style="width: 100%" data-attr="' + attr + '" value="' + object[attr] + '" />';
            } else if (typeof object[attr] === 'number') {
                text += '<input type="text" class="object-tab-edit-number" style="width: 100%" data-attr="' + attr + '" value="' + object[attr] + '" />';
            } else if (typeof object[attr] === 'boolean') {
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

        if (object.write !== undefined) {
            if (object.write === 'false' || object.write === '0' || object.write === 0) object.write = false;
            if (object.write === 'true'  || object.write === '1' || object.write === 1) object.write = true;
        }

        if (object.read !== undefined) {
            if (object.read === 'false' || object.read === '0' || object.read === 0) object.read = false;
            if (object.read === 'true'  || object.read === '1' || object.read === 1) object.read = true;
        }

        if (object.min !== undefined) {
            var f = parseFloat(object.min);
            if (f.toString() === object.min.toString()) object.min = f;

            if (object.min === 'false') object.min = false;
            if (object.min === 'true')  object.min = true;
        }
        if (object.max !== undefined) {
            var m = parseFloat(object.max);
            if (m.toString() === object.max.toString()) object.max = m;

            if (object.max === 'false') object.max = false;
            if (object.max === 'true')  object.max = true;
        }
        if (object.def !== undefined) {
            var d = parseFloat(object.def);
            if (d.toString() === object.def.toString()) object.def = d;

            if (object.def === 'false') object.def = false;
            if (object.def === 'true')  object.def = true;
        }

        return err;
    }

    this.stateChange = function (id, state) {
        if (this.$grid) selectId('state', id, state);
    };

    this.objectChange = function (id, obj) {
        if (this.$grid) selectId('object', id, obj);
    };

    this.reinit = function () {
        this.main.customsDialog.check();
        if (this.$grid) {
                selectId('reinit');
        }
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
                    that.main.socket.emit('setObject', enumId, that.main.objects[enumId], function (err) {
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
                that.main.socket.emit('setObject', enumId, that.main.objects[enumId], function (err) {
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
            if (enums[e].substring(0, 'enum.'.length + enumName.length + 1) === 'enum.' + enumName + '.') {
                toCheck.push(enums[e]);
            }
        }

        _syncEnum(id, toCheck, newArray, function (err) {
            if (err) that.main.showError(err);
            // force update of object
            selectId('object', id, that.main.objects[id]);
        });
    }

    function requestStates(pattern) {
        console.log('Subscribe: ' + pattern);
        that.main.subscribeStates(pattern);
        that.main.socket.emit('getForeignStates', pattern, function (err, states) {
            if (states) {
                for (var _id in states) {
                    console.log('Update ' + _id);
                    if (states.hasOwnProperty(_id) && (!that.main.states[_id] || that.main.states[_id].ts !== states[_id].ts)) {
                        that.main.states[_id] = states[_id];
                        that.stateChange(_id, states[_id]); // may be call main.stateChange
                    }
                }
            } else if (err) {
                console.error('requestStates error: ' + err);
            }
        });
    }

    function subscribe(ids) {
        if (typeof ids === 'string') {
            ids = [ids];
        }
        for (var i = 0; i < ids.length; i++) {
            console.log('Expanded: ' + ids[i]);
            if (that.subscribes[ids[i]]) {
                that.subscribes[ids[i]]++;
                return;
            }
            for (var pattern in that.subscribes) {
                if (that.subscribes.hasOwnProperty(pattern) && ids[i].substring(0, pattern.length) + '.' === pattern + '.') {
                    that.subscribes[pattern]++;
                    return;
                }
            }

            that.subscribes[ids[i]] = 1;
            var obj = that.main.objects[ids[i]];
            if (obj && obj.type === 'state') {
                requestStates(ids[i]);
            } else {
                requestStates(ids[i] + '.*');
            }
        }
    }
    function unsubscribe(id) {
        console.log('Collapsed: ' + id);
        if (!that.subscribes[id]) {
            for (var pattern in that.subscribes) {
                if (that.subscribes.hasOwnProperty(pattern) && pattern.substring(0, id.length) + '.' === id + '.') {
                    that.subscribes[pattern]--;
                    if (!that.subscribes[pattern]) {
                        var obj = that.main.objects[pattern];
                        if (obj && obj.type === 'state') {
                            that.main.unsubscribeStates(pattern);
                            console.log('Unsubscribe: ' + pattern);
                        } else {
                            that.main.unsubscribeStates(pattern + '.*');
                            console.log('Unsubscribe: ' + pattern + '.*');
                        }

                        delete that.subscribes[pattern]; // may be that.subscribes[id] = undefined; for speed up
                    }
                }
            }
        } else {
            that.subscribes[id]--;
            if (!that.subscribes[id]) {
                var _obj = that.main.objects[id];
                if (_obj && _obj.type === 'state') {
                    console.log('Unsubscribe: ' + id);
                    that.main.unsubscribeStates(id);
                } else {
                    console.log('Unsubscribe: ' + id + '.*');
                    that.main.unsubscribeStates(id + '.*');
                }

                delete that.subscribes[id]; // may be that.subscribes[id] = undefined; for speed up
            }
        }
    }

    function unsubscribeAll() {
        for (var pattern in that.subscribes) {
            if (that.subscribes.hasOwnProperty(pattern)) {
                var obj = that.main.objects[pattern];
                if (obj && that.main.objects[pattern].type === 'state') {
                    that.main.unsubscribeStates(pattern);
                    console.log('Unsubscribe: ' + pattern);
                } else {
                    that.main.unsubscribeStates(pattern + '.*');
                    console.log('Unsubscribe: ' + pattern + '.*');
                }
            }
        }
    }

    function subscribeAll() {
        for (var pattern in that.subscribes) {
            if (that.subscribes.hasOwnProperty(pattern)) {
                var obj = that.main.objects[pattern];
                if (obj && that.main.objects[pattern].type === 'state') {
                    requestStates(pattern);
                } else {
                    requestStates(pattern + '.*');
                }
            }
        }
    }

    this.init = function (update) {
        if (this.inited && !update) {
            return;
        }
        if (update) {
            unsubscribeAll();
            this.subscribes = {};
        }

        // may be it can be deleted
        /*if (!main.objectsLoaded) {
            setTimeout(function () {
                that.init(update);
            }, 250);
            return;
        }*/

        if (typeof this.$grid !== 'undefined') {
            if (this.main.customsDialog.customEnabled === null) {
                this.main.customsDialog.check();
            }

            // var x = $(window).width();
            // var y = $(window).height();
            // if (x < 720) x = 720;
            // if (y < 480) y = 480;
            //
            // that.$grid.height(y - 100).width(x - 20);

            var settings = {
                objects:  this.main.objects,
                states:   this.main.states,
                noDialog: true,
                name:     'admin-objects',
                useHistory: this.main.customsDialog.customEnabled,
                showButtonsForNotExistingObjects: true,
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
                //columns: ['image', 'name', 'type', 'role', 'room', 'function', 'value', 'button'],
                columns: ['ID', 'name', 'type', 'role', 'room', 'function', 'value', 'button'],
                expandedCallback: function (id, childrenCount, hasStates) {
                    // register this in subscription
                    if (hasStates) {
                        subscribe(id);
                    }
                },
                collapsedCallback: function (id, childrenCount, hasStates) {
                    // unregister this in subscription
                    unsubscribe(id);
                },
                buttons: [
                    {
                        text: false,
                        icons: {
                            primary: 'ui-icon-pencil'
                        },
                        click: function (id) {
                            that.edit(id);
                        },
                        match: function (id) {
                            if (!that.main.objects[id])  {
                                this[0].outerHTML = '<div class="td-button-placeholder"></div>';
                            }
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
                        match: function (id) {
                            if (that.main.objects[id] && that.main.objects[id].common && that.main.objects[id].common.dontDelete) {
                                this.hide();
                            }
                        },
                        width: 26,
                        height: 20
                    },
                    {
                        text: false,
                        icons: {
                            primary: 'ui-icon-gear'
                        },
                        click: function (id) {
                            that.main.customsDialog.init(id);
                        },
                        width:  26,
                        height: 20,
                        match: function (id) {
                            // Show special button only if one of supported adapters is enabled
                            if (that.main.objects[id] && that.main.customsDialog.customEnabled && !id.match(/\.messagebox$/) && that.main.objects[id].type === 'state') {
                                // Check if some custom settings enabled
                                var enabled = false;
                                if (that.main.objects[id] && that.main.objects[id].common && that.main.objects[id].common.custom) {
                                    var custom = that.main.objects[id].common.custom;
                                    // convert old structure
                                    // TODO: remove some day (08.2016)
                                    if (custom.enabled !== undefined) {
                                        custom = that.main.objects[id].common.custom = custom.enabled ? {'history.0': custom} : {};
                                    }

                                    for (var h in custom) {
                                        if (custom.hasOwnProperty(h)) {
                                            enabled = true;
                                            break;
                                        }
                                    }
                                }
                                if (enabled) {
                                    this.addClass('custom-enabled').removeClass('custom-disabled');
                                } else {
                                    delete that.main.objects[id].common.custom;
                                    this.addClass('custom-disabled').removeClass('custom-enabled');
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
                            var id = selectId('getActual') || '';
                            $('#object-tab-new-object-parent').val(id);
                            $('#object-tab-new-object-name').val(_('newObject'));

                            if (that.main.objects[id] && that.main.objects[id].type === 'device') {
                                $('#object-tab-new-object-type').val('channel');
                            } else if (that.main.objects[id] && that.main.objects[id].type === 'channel') {
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
                        title: _('Add Objecttree from JSON File'), // let Objecttree be (fixed in translation)
                        click: function () {
                            var id = selectId('getActual') || '';
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
                            var id = selectId('getActual') || '';
                            var result = {};
                            $.map(that.main.objects, function (val, key) {
                                if (!key.search(id)) result[key] = val;
                            });
                            if (result !== undefined) {
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
                        if (that.main.objects[id] && that.main.objects[id].common && that.main.objects[id].common.type) {
                            switch (that.main.objects[id].common.type) {
                                case 'number':
                                    var v = parseFloat(newValue);
                                    if (isNaN(v)) {
                                        v = newValue === 'false' ? 0 : ~~newValue;
                                    }
                                    newValue = v;
                                    break;

                                case 'boolean':
                                    if (newValue === 'true') newValue = true;
                                    if (newValue === 'false') newValue = false;
                                    break;

                                case 'string':
                                    newValue = newValue.toString();
                                    break;

                                default:
                                    if (newValue === 'true') newValue = true;
                                    if (newValue === 'false') newValue = false;
                                    // '4.0' !== parseFloat('4.0').toString()
                                    if (parseFloat(newValue).toString() === newValue.toString().replace(/[.,]0*$/, '')) newValue = parseFloat(newValue);
                                    break;
                            }
                        }
                        that.main.socket.emit('setState', id, newValue, function (err) {
                            if (err) return that.main.showError(err);
                        });
                    } else {
                        that.main.socket.emit('getObject', id, function (err, _obj) {
                            if (err) return that.main.showError(err);

                            if (!_obj) {
                                _obj = {
                                    type: 'meta',
                                    common: {
                                        typ: 'meta.user',
                                        role: ''
                                    },
                                    native: {},
                                    _id: id
                                }
                            }

                            _obj.common[attr] = newValue;
                            that.main.socket.emit('setObject', _obj._id, _obj, function (err) {
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

            if (this.main.customsDialog.customEnabled) {
                settings.customButtonFilter = {
                    icons:    {primary: 'ui-icon-gear'},
                    text:     false,
                    callback: function () {
                        var _ids = selectId('getFilteredIds');
                        var ids = [];
                        for (var i = 0; i < _ids.length; i++) {
                            if (that.main.objects[_ids[i]] && that.main.objects[_ids[i]].type === 'state') ids.push(_ids[i]);
                        }
                        if (ids && ids.length) {
                            that.openCustomsDlg(ids);
                        } else {
                            that.main.showMessage(_('No states selected!'), '', 'info_outline');
                        }
                    }
                }
            } else {
                settings.customButtonFilter = null;
            }

            selectId('init', settings)
                .selectId('show');
        }

        if (!this.inited) {
            this.inited = true;
            this.main.subscribeObjects('*');
            // resubscribe all
            subscribeAll();
        }
    };

    this.destroy = function () {
        if (this.inited) {
            that.main.unsubscribeObjects('*');
            this.inited = false;
            unsubscribeAll();
        }
    };

    this.edit = function (id, callback) {
        var obj = this.main.objects[id];
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
        for (u = 0; u < that.main.tabs.users.groups.length; u++) {
            text += '<option value="' + that.main.tabs.users.groups[u] + '">' + (that.main.objects[that.main.tabs.users.groups[u]].common.name || that.main.tabs.users.groups[u]) + '</option>';
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
            that.main.confirmMessage(_('Are you sure?'), _('Delete attribute'), 'error_outline', function (result) {
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

        if (obj.type !== 'state') {
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
        } catch (err) {
            that.main.showMessage(_('Cannot parse.'), _('Error in %s', err), 'error_outline');
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
            that.main.showMessage(_('Cannot parse.'), _('Error in %s', err), 'error_outline');
            return false;
        }
        err = saveObjectFields('object-tab-native-table', obj.native);
        if (err) {
            that.main.showMessage(_('Cannot parse.'), _('Error in %s', err), 'error_outline');
            return false;
        }
        obj.acl.object = 0;
        obj.acl.object |= $('#object-tab-acl-obj-owner-read').prop('checked')  ? 0x400 : 0;
        obj.acl.object |= $('#object-tab-acl-obj-owner-write').prop('checked') ? 0x200 : 0;
        obj.acl.object |= $('#object-tab-acl-obj-group-read').prop('checked')  ? 0x40  : 0;
        obj.acl.object |= $('#object-tab-acl-obj-group-write').prop('checked') ? 0x20  : 0;
        obj.acl.object |= $('#object-tab-acl-obj-every-read').prop('checked')  ? 0x4   : 0;
        obj.acl.object |= $('#object-tab-acl-obj-every-write').prop('checked') ? 0x2   : 0;

        obj.acl.owner = $('#object-tab-acl-owner').val();
        obj.acl.ownerGroup = $('#object-tab-acl-group').val();

        if (obj.type === 'state') {
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
            that.main.showMessage(e, _('Parse error'), 'error_outline');
            $('#object-tabs').tabs({active: 4});
            return false;
        }
        return obj;
    };

    this.save = function () {
        if ($('#object-tabs').tabs('option', 'active') === 4) {
            var _obj = that.saveFromRaw();
            if (!_obj) return;

            this.main.socket.emit('setObject', _obj._id, _obj, function (err) {
                if (err) {
                    that.main.showError(err);
                } else {
                    var cb = that.$dialog.data('cb');
                    if (cb) cb(_obj);
                }
            });
            this.$dialog.dialog('close');
        } else {
            var obj = that.saveFromTabs();
            if (!obj) return;
            this.main.socket.emit('getObject', obj._id, function (err, _obj) {
                if (err) {
                    return that.main.showError(err);
                }

                _obj.common = obj.common;
                _obj.native = obj.native;
                _obj.acl    = obj.acl;
                that.main.socket.emit('setObject', obj._id, _obj, function (err) {
                    if (err) {
                        that.main.showError(err);
                    } else {
                        var cb = that.$dialog.data('cb');
                        if (cb) cb(obj);
                    }
                });
            });


            this.$dialog.dialog('close');
        }
    };

    function handleFileSelect(evt) {
        var f = evt.target.files[0];
        if (f) {
            var r = new FileReader();
            r.onload = function(e) {
                var contents = e.target.result;
                var json = JSON.parse(contents);
                var len = Object.keys(json).length;
                var id = json._id;
                if (id === undefined && len > 1) {
                    for (var obj in (json)) {
                        id = json[obj]._id;
                        that.main.socket.emit('setObject', id, json[obj], function (err) {
                            if (err) {
                                that.main.showError(err);
                                return;
                            }
                            var _obj = json[obj];
                            //console.log(id + ' = ' + _obj.type);
                            if (json[obj].type === 'state') {
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
                        //console.log(id + ' = ' + _obj.type);
                        if (json[obj].type === 'state') {
                            that.main.socket.emit('setState', _obj._id, _obj.common.def === undefined ? null : _obj.common.def, true);
                        }
                    });
                }
            };
            r.readAsText(f);
        } else {
            alert('Failed to open JSON File');
        }
    }
}