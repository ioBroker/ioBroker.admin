function Objects(main) {
    'use strict';

    var that            = this;
    this.$grid          = $('#grid-objects');
    this.subscribes     = {};
    this.main           = main;

    var selectId = function () {
        if (!that.$grid || !that.$grid.selectId) return;
        selectId = that.$grid.selectId.bind(that.$grid);
        return that.$grid.selectId.apply(that.$grid, arguments);
    };

    this.prepare = function () {
        $(document).on('click', '.jump', function (e) {
            that.main.navigate({
                dialog: 'editobject',
                params: $(this).attr('data-jump-to')
            });

            e.preventDefault();
            return false;
        });

        $('#load_grid-objects').show();

        // Init "new object" dialog
        var $dialogNewObject = $('#dialog-new-object');
        $dialogNewObject.modal();

        $dialogNewObject.find('.btn-add').unbind('click').click(function () {
            var name  = $dialogNewObject.find('#object-tab-new-object-name').val();
            var id    = name.trim();
            var parent = $dialogNewObject.find('#object-tab-new-object-parent').val();
            id = parent ? parent + '.' + id : id;

            var type  = $dialogNewObject.find('#object-tab-new-object-type').val();
            var stype = $dialogNewObject.find('#object-tab-new-state-type').val();
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
                    that.main.navigate({
                        dialog: 'editobject',
                        params: id + ',def'
                    });
                }, 1000);
            });
        });
        $dialogNewObject.find('#object-tab-new-object-type').select();
        $dialogNewObject.find('#object-tab-new-state-type').select();
        $dialogNewObject.find('#object-tab-new-object-name').keyup(function () {
            $(this).trigger('change');
        }).change(function () {
            var parent = $dialogNewObject.find('#object-tab-new-object-parent').val();
            var id     = $dialogNewObject.find('#object-tab-new-object-name').val();
            id = parent ? parent + '.' + id : id;

            $dialogNewObject.find('.title').html(_('Add new object: %s', id));
        });

        $dialogNewObject.find('#object-tab-new-object-type').change(function () {
            if ($(this).val() === 'state') {
                $dialogNewObject.find('.object-tabe-new-object-tr').show();
            } else {
                $dialogNewObject.find('.object-tab-new-object-tr').hide();
            }
        });

        $dialogNewObject.find('.btn-add').keydown(function (e) {
            if (e.keyCode === 13) {
                setTimeout(function () {
                    $('#dialog-object-tab-new').trigger('click');
                }, 100);
            }
        });
    };

    this.stateChange = function (id, state) {
        if (this.$grid) selectId('state', id, state);
    };

    this.objectChange = function (id, obj) {
        if (this.$grid) selectId('object', id, obj);
    };

    this.reinit = function () {
        this.main.dialogs.customs.check();
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
                    if (!states.hasOwnProperty(_id)) continue;

                    if (!states[_id] && that.main.states[_id]) {
                        that.main.states[_id] = {val: null};
                        that.stateChange(_id, that.main.states[_id]); // may be call main.stateChange
                    } else
                    if (!that.main.states[_id] || that.main.states[_id].ts !== states[_id].ts) {
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
            if (this.main.dialogs.customs.customEnabled === null) {
                this.main.dialogs.customs.check();
            }

            var settings = {
                objects:  this.main.objects,
                states:   this.main.states,
                noDialog: true,
                name:     'admin-objects',
                useHistory: this.main.dialogs.customs.customEnabled,
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
                            that.main.navigate({
                                dialog: 'editobject',
                                params: id
                            });
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
                            that.main.dialogs.customs.ids = null;
                            that.main.navigate({dialog: 'customs', params: id});
                        },
                        width:  26,
                        height: 20,
                        match: function (id) {
                            // Show special button only if one of supported adapters is enabled
                            if (that.main.objects[id] && that.main.dialogs.customs.customEnabled && !id.match(/\.messagebox$/) && that.main.objects[id].type === 'state') {
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

                            var $dialog = $('#dialog-new-object');
                            $dialog.modal('open');
                            $dialog.find('h6').html(_('Add new object: %s', (id ? id + '.' : '') + _('newObject')));
                            $dialog.find('#object-tab-new-object-name').focus();
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

            if (this.main.dialogs.customs.customEnabled) {
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
                            if (ids.length < 10) {
                                that.main.dialogs.customs.ids = null;
                                that.main.navigate({dialog: 'customs', params: ids.join(',')});
                            } else {
                                that.main.dialogs.customs.ids = ids;
                                that.main.navigate({dialog: 'customs'});
                            }
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