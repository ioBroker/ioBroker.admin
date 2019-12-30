function EditObject(main) {
    'use strict';

    var that             = this;
    this.$dialog         = $('#dialog-editobject');
    this.$dialogNewField = $('#dialog-new-field');
    this.main            = main;
    this.prepared        = false;
    this.inited          = false;
    this.$dialogSave     = this.$dialog.find('.dialog-editobject-buttons .btn-save');
    this.iconVal         = null;

    function loadObjectFields(selector, object, part, objectType) {
        var text = '';
        for (var attr in object) {
            if (!object.hasOwnProperty(attr) || (part === 'common' && (attr === 'name' || attr === 'icon'))) continue;

            if (false && objectType === 'state' && part === 'common' && attr === 'role') { // autocomplete is temporally disabled because buggy
                text += '<div class="input-field col s11">' +
                    '<i class="material-icons prefix">textsms</i>' +
                    '<input type="text" class="object-tab-edit-string autocomplete" data-attr="' + attr + '" value="' + object[attr] + '"/>';
            } else {
                text += '<div class="row">\n<div class="col s11">\n';
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
                    text += '<input type="text" class="object-tab-edit-string" data-attr="' + attr + '" value="' + object[attr] + '" />\n';
                } else if (typeof object[attr] === 'number') {
                    text += '<input type="text" class="object-tab-edit-number" data-attr="' + attr + '" value="' + object[attr] + '" />\n';
                } else if (typeof object[attr] === 'boolean') {
                    text += '<input type="checkbox" class="object-tab-edit-boolean filled-in" data-attr="' + attr + '" ' + (object[attr] ? 'checked' : '') + ' />\n';
                } else {
                    text += '<textarea class="object-tab-edit-object"  style="width: 100%" rows="3" data-attr="' + attr + '">' + JSON.stringify(object[attr], null, 2) + '</textarea>\n';
                }
            }

            var title = attr;
            // translations
            if (part === 'common' && systemDictionary['common_' + attr] && systemDictionary['common_' + attr][systemLang]) {
                title = _('common_' + attr);
            }

            // workaround for materialize
            if (typeof object[attr] === 'boolean') {
                text += '<span>' + title + '</span>\n';
            } else {
                text += '<label>' + title + '</label>\n';
            }

            text += '</div>\n<div class="col s1"><a class="btn-floating waves-effect waves-light red object-tab-field-delete" data-attr="' + attr + '" data-part="' + part + '"><i class="material-icons">delete</i></a></div>\n';
            text += '</div>\n';
        }

        that.$dialog.find(selector).html(text);
        /*that.$dialog.find(selector).find('.autocomplete').each(function () {
            $(this).mautocomplete({
                data: {
                    'state': null,
                    'switch': null,
                    'button': null,
                    'value': null,
                    'level': null,
                    'indicator': null,
                    'value.temperature': null,
                    'value.humidity': null,
                    'level.temperature': null,
                    'level.dimmer': null
                },
                minLength: 0 // The minimum length of the input for the autocomplete to start. Default: 1.
            });
        });*/
    }

    function saveObjectFields(selector, object) {
        var $htmlId = that.$dialog.find(selector);
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

        if (object.min === null) {
            delete object.min;
        }
        if (object.min !== undefined) {
            var f = parseFloat(object.min);
            if (f.toString() === object.min.toString()) object.min = f;

            if (object.min === 'false') object.min = false;
            if (object.min === 'true')  object.min = true;
        }
        if (object.max === null) {
            delete object.max;
        }
        if (object.max !== undefined) {
            var m = parseFloat(object.max);
            if (m.toString() === object.max.toString()) object.max = m;

            if (object.max === 'false') object.max = false;
            if (object.max === 'true')  object.max = true;
        }
        if (object.def === null) {
            delete object.def;
        }

        if (object.def !== undefined) {
            var d = parseFloat(object.def);
            if (d.toString() === object.def.toString()) object.def = d;

            if (object.def === 'false') object.def = false;
            if (object.def === 'true')  object.def = true;
        }

        // common part cannot have "true" or "false". Only true and false.
        if (selector.indexOf('common') !== -1) {
            for (var attr in object) {
                if (object.hasOwnProperty(attr)) {
                    if (object[attr] === 'true') {
                        object[attr] = true;
                    }
                    if (object[attr] === 'false') {
                        object[attr] = false;
                    }
                    if (parseFloat(object[attr]).toString() === object[attr]) {
                        object[attr] = parseFloat(object[attr]);
                    }
                }
            }
        }

        return err;
    }

    function showMessage(text, duration, isError) {
        if (typeof duration === 'boolean') {
            isError = duration;
            duration = 3000;
        }
        that.main.showToast(that.$dialog, text, null, duration, isError);
    }

    // only init if required
    this._prepare       = function () {
        if (this.prepared) {
            return;
        }
        this.prepared = true;
        this.$dialogSave.on('click', function () {
            that.save();
        });
        this.$dialog.find('.dialog-editobject-buttons .btn-cancel').on('click', function () {
            that.editor.setValue('');
            that.$dialogSave.addClass('disabled');
            that.main.navigate();
        });

        this.$dialog.find('.btn-add-common').on('click', function () {
            that.$dialogNewField.find('.object-tab-new-icon').show();
            that.$dialogNewField.modal('open');
            var $name = that.$dialogNewField.find('.object-tab-new-name');
            $name.data('type', 'common').focus();
            if (!$name.hasClass('autocomplete')) {
                $name.addClass('autocomplete');
                $name.mautocomplete({
                    data: {
                        type:     null,
                        desc:     null,
                        min:      null,
                        max:      null,
                        def:      null,
                        role:     null,
                        unit:     null,
                        read:     null,
                        write:    null,
                        states:   null
                    },
                    minLength: 0 // The minimum length of the input for the autocomplete to start. Default: 1.
                });
            }
            $name.focus()
        });

        this.$dialog.find('.btn-add-native').on('click', function () {
            that.$dialogNewField.find('.object-tab-new-icon').hide();
            that.$dialogNewField.modal('open');
            var $name = that.$dialogNewField.find('.object-tab-new-name');
            if ($name.hasClass('autocomplete')) {
                $name.mautocomplete('destroy');
                $name.removeClass('autocomplete');
            }
            M.updateTextFields('#dialog-new-field');
            $name.data('type', 'native').focus();
        });
        this.$dialogNewField.find('.object-tab-new-name').keypress(function (e) {
            if (e.which === 13) {
                that.$dialogNewField.find('.btn-add').trigger('click');
            }
        });

        if (!this.editor) {
            this.editor = ace.edit('view-object-raw');
            this.editor.getSession().setMode('ace/mode/json');
            this.editor.$blockScrolling = true;
            this.editor.getSession().on('change', function() {
                that.$dialogSave.removeClass('disabled');
            });
        }
        this.$dialogNewField.modal();

        this.$dialog.find('.tabs').mtabs({
            onShow: function (tab)  {
                if (!tab) return;
                var id = $(tab).attr('id');
                if (id === 'object-tab-common') {
                    showMessage(_('Drop the icons here'));
                } else 
                if (id === 'object-tab-raw') {
                    var obj = that.saveFromTabs();

                    if (!obj) return false;

                    that.editor.setValue(JSON.stringify(obj, null, 2));
                } else if (id === 'object-tab-raw') {
                    var _obj;
                    try {
                        _obj = JSON.parse(that.editor.getValue());
                    } catch (e) {
                        that.main.showMessage(e, _('Parse error'), 'error_outline');
                        if (!that.main.noSelect) {
                            that.$dialog.find('.tabs').mtabs('select', 'object-tab-raw');
                        }
                        return false;
                    }
                    that.load(_obj);
                }
                that.main.saveConfig('object-edit-active', id);
                return true;
            }
        });

        this.$dialogNewField.find('.btn-add').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var $tab  = that.$dialogNewField.find('.object-tab-new-name');
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
            that.$dialogNewField.find('.object-tab-new-name').val('');
            that.$dialogNewField.modal('close');
            that.$dialogSave.removeClass('disabled');
        });
        this.$dialogNewField.find('.btn-cancel').on('click', function (e) {
            that.$dialogNewField.find('.object-tab-new-name').val('');
        });
        this.$dialog.find('.edit-object-name').on('change', function () {
            that.$dialogSave.removeClass('disabled');
        }).on('keyup', function () {
            $(this).trigger('change');
        });
        this.$dialog.find('.edit-object-type').on('change', function () {
            that.$dialogSave.removeClass('disabled');
        });
        this.$dialog.find('.object-tab-rights input').on('change', function () {
            that.$dialogSave.removeClass('disabled');
        });

        installFileUpload(this.$dialog.find('#object-tab-common'), 50000, function (err, text) {
            if (err) {
                showMessage(err, true);
            } else {
                if (!text.match(/^data:image\//)) {
                    showMessage(_('Unsupported image format'), true);
                    return;
                }

                that.$dialogSave.removeClass('disabled');
                that.iconVal = text;

                var $tab = that.$dialog.find('.icon-editor');
                $tab.find('.icon').show().html('<img class="treetable-icon" />');
                $tab.find('.icon .treetable-icon').attr('src', text);
            }
        });
        this.$dialog.find('.icon-editor .icon-upload').off('click').on('click', function () {
            that.$dialog.find('.drop-file').trigger('click');
        });
        this.$dialog.find('.icon-editor .icon-clear').off('click').on('click', function () {
            if (that.iconVal) {
                that.iconVal = null;
                that.$dialog.find('.icon-editor').hide().appendTo(that.$dialog);
                that.$dialogSave.removeClass('disabled');
            }
        });
    };

    this.init           = function () {
        this._prepare();
        if (this.inited) {
            return;
        }
        this.inited = true;
        var id = that.main.navigateGetParams();
        var isSetDefaultState = !!(id || '').match(/,def$/);
        id = id.replace(/,def$/, '');

        var obj = this.main.objects[id];
        if (!obj) return;

        if (this.main.config['object-edit-active'] !== undefined && !that.main.noSelect) {
            this.$dialog.find('.tabs').mtabs('select', this.main.config['object-edit-active']);
        }

        // fill users
        var text = '';
        var name;
        for (var u = 0; u < this.main.tabs.users.list.length; u++) {
            name = translateName(this.main.objects[this.main.tabs.users.list[u]].common.name);
            text += '<option value="' + this.main.tabs.users.list[u] + '">' + (name || this.main.tabs.users.list[u]) + '</option>';
        }
        this.$dialog.find('.object-tab-acl-owner').html(text);

        // fill groups
        text = '';
        for (u = 0; u < this.main.tabs.users.groups.length; u++) {
            name = translateName(this.main.objects[this.main.tabs.users.groups[u]].common.name);
            text += '<option value="' + this.main.tabs.users.groups[u] + '">' + (name || this.main.tabs.users.groups[u]) + '</option>';
        }
        this.$dialog.find('.object-tab-acl-group').html(text);
        this.load(obj);

        if (isSetDefaultState) {
            this.$dialog.data('cb', function (_obj) {
                if (_obj.type === 'state') {
                    // create state
                    that.main.socket.emit('getState', _obj._id, function (err, state) {
                        if (!state || state.val === null || state.val === undefined) {
                            that.main.socket.emit('setState', _obj._id, _obj.common.def === undefined ? null : _obj.common.def, true);
                        }
                    });
                }
            });
        } else {
            this.$dialog.data('cb', null);
        }
        that.$dialogSave.addClass('disabled');
    };

    this.destroy        = function () {
        if (this.inited) {
            this.inited = false;
        }
    };

    this.load           = function (obj) {
        if (!obj) return;
        obj.common = obj.common || {};
        obj.native = obj.native || {};
        obj.acl    = obj.acl || {};
        this.$dialog.find('.title-id').text(obj._id);
        this.$dialog.find('.edit-object-name').val(obj.common ? translateName(obj.common.name) : obj._id);
        this.$dialog.find('.edit-object-type').val(obj.type);
        this.$dialog.find('.object-tab-acl-owner').val(obj.acl.owner      || 'system.user.admin');
        this.$dialog.find('.object-tab-acl-group').val(obj.acl.ownerGroup || 'system.group.administrator');

        this.$dialog.find('.icon-editor').hide().appendTo(this.$dialog);

        loadObjectFields('.object-tab-common-table', obj.common || {}, 'common', obj.type);
        loadObjectFields('.object-tab-native-table', obj.native || {}, 'native', obj.type);

        if (obj.common.icon !== undefined) {
            this.iconVal = obj.common.icon;
            this.$dialog.find('.object-tab-common-table').prepend(this.$dialog.find('.icon-editor').show());
            this.$dialog.find('.icon-editor .icon').html(that.main.getIconFromObj(obj));
        } else {
            this.iconVal = null;
        }

        this.$dialog.find('.object-tab-field-delete').on('click', function () {
            var part  = $(this).data('part');
            var field = $(this).data('attr');
            that.main.confirmMessage(_('Delete attribute'), _('Please confirm'), 'error_outline', function (result) {
                if (result) {
                    var _obj  = that.saveFromTabs();
                    delete _obj[part][field];
                    that.load(_obj);
                }
            });
        });

        obj.acl = obj.acl || {};
        if (obj.acl.object === undefined) {
            obj.acl.object = 0x666;
        }

        this.$dialog.find('#object-tab-acl-obj-owner-read') .prop('checked', obj.acl.object & 0x400);
        this.$dialog.find('#object-tab-acl-obj-owner-write').prop('checked', obj.acl.object & 0x200);
        this.$dialog.find('#object-tab-acl-obj-group-read'). prop('checked', obj.acl.object & 0x40);
        this.$dialog.find('#object-tab-acl-obj-group-write').prop('checked', obj.acl.object & 0x20);
        this.$dialog.find('#object-tab-acl-obj-every-read'). prop('checked', obj.acl.object & 0x4);
        this.$dialog.find('#object-tab-acl-obj-every-write').prop('checked', obj.acl.object & 0x2);

        if (obj.type !== 'state') {
            this.$dialog.find('.object-tab-acl-state').hide();
        } else {
            this.$dialog.find('.object-tab-acl-state').show();
            if (obj.acl.state === undefined) obj.acl.state = 0x666;

            this.$dialog.find('#object-tab-acl-state-owner-read') .prop('checked', obj.acl.state & 0x400);
            this.$dialog.find('#object-tab-acl-state-owner-write').prop('checked', obj.acl.state & 0x200);
            this.$dialog.find('#object-tab-acl-state-group-read'). prop('checked', obj.acl.state & 0x40);
            this.$dialog.find('#object-tab-acl-state-group-write').prop('checked', obj.acl.state & 0x20);
            this.$dialog.find('#object-tab-acl-state-every-read'). prop('checked', obj.acl.state & 0x4);
            this.$dialog.find('#object-tab-acl-state-every-write').prop('checked', obj.acl.state & 0x2);
        }

        var _obj = JSON.parse(JSON.stringify(obj));
        this.editor.setValue(JSON.stringify(_obj, null, 2));
        if (_obj._id)    delete _obj._id;
        if (_obj.common) delete _obj.common;
        if (_obj.type)   delete _obj.type;
        if (_obj.native) delete _obj.native;
        if (_obj.acl)    delete _obj.acl;
        this.$dialog.find('#view-object-rest').val(JSON.stringify(_obj, null, '  '));
        this.$dialog.find('select').select();

        // workaround for materialize checkbox problem
        this.$dialog.find('input[type="checkbox"]+span').off('click').on('click', function () {
            var $input = $(this).prev();
            if (!$input.prop('disabled')) {
                $input.prop('checked', !$input.prop('checked')).trigger('change');
            }
        });
        // enable save
        this.$dialog.find('input').on('change', function () {
            that.$dialogSave.removeClass('disabled');
        }).on('keyup', function () {
            $(this).trigger('change');
        });

        this.$dialog.find('select').on('change', function () {
            that.$dialogSave.removeClass('disabled');
        });

        this.$dialog.find('textarea').on('change', function () {
            that.$dialogSave.removeClass('disabled');
        }).on('keyup', function () {
            $(this).trigger('change');
        });

        if (obj.common.color !== undefined) {
            var time = Date.now();

            var $color = this.$dialog.find('.object-tab-edit-string[data-attr="color"]').parent();
            $color.prepend('<i class="material-icons prefix tab-enums-dialog-new-color-icon">color_lens</i><a class="btn edit-color translate">' + _('Color') + '</a>');
            $color.colorpicker({
                component: '.btn',
                color: $color,
                container: true
            }).colorpicker('setValue', obj.common.color || '#fff').on('showPicker.colorpicker', function (/* event */) {
            }).on('changeColor.colorpicker', function (event){
                if (Date.now() - time > 100) {
                    $color.find('input').val(event.color.toHex()).trigger('change');
                }
            });
        }

    };

    this.saveFromTabs   = function () {
        var obj;
        try {
            obj = this.$dialog.find('#view-object-rest').val();
            if (!obj) {
                obj = {};
            } else {
                obj = JSON.parse(obj);
            }
        } catch (err) {
            this.main.showMessage(_('Cannot parse.'), _('Error in %s', err), 'error_outline');
            return false;
        }

        obj.common = {};
        obj.native = {};
        obj.acl    = {};
        obj._id    = this.$dialog.find('.title-id').text();
        obj.common.name = this.$dialog.find('.edit-object-name').val(); // no support of multilanguage if edited
        obj.type   = this.$dialog.find('.edit-object-type').val();
        var err = saveObjectFields('.object-tab-common-table', obj.common);
        if (err) {
            this.main.showMessage(_('Cannot parse.'), _('Error in %s', err), 'error_outline');
            return false;
        }
        err = saveObjectFields('.object-tab-native-table', obj.native);
        if (err) {
            this.main.showMessage(_('Cannot parse.'), _('Error in %s', err), 'error_outline');
            return false;
        }
        obj.acl.object = 0;
        obj.acl.object |= this.$dialog.find('#object-tab-acl-obj-owner-read').prop('checked')  ? 0x400 : 0;
        obj.acl.object |= this.$dialog.find('#object-tab-acl-obj-owner-write').prop('checked') ? 0x200 : 0;
        obj.acl.object |= this.$dialog.find('#object-tab-acl-obj-group-read').prop('checked')  ? 0x40  : 0;
        obj.acl.object |= this.$dialog.find('#object-tab-acl-obj-group-write').prop('checked') ? 0x20  : 0;
        obj.acl.object |= this.$dialog.find('#object-tab-acl-obj-every-read').prop('checked')  ? 0x4   : 0;
        obj.acl.object |= this.$dialog.find('#object-tab-acl-obj-every-write').prop('checked') ? 0x2   : 0;

        obj.acl.owner = this.$dialog.find('.object-tab-acl-owner').val();
        obj.acl.ownerGroup = this.$dialog.find('.object-tab-acl-group').val();

        if (obj.type === 'state') {
            obj.acl.state = 0;
            obj.acl.state |= this.$dialog.find('#object-tab-acl-state-owner-read').prop('checked') ? 0x400 : 0;
            obj.acl.state |= this.$dialog.find('#object-tab-acl-state-owner-write').prop('checked') ? 0x200 : 0;
            obj.acl.state |= this.$dialog.find('#object-tab-acl-state-group-read').prop('checked') ? 0x40 : 0;
            obj.acl.state |= this.$dialog.find('#object-tab-acl-state-group-write').prop('checked') ? 0x20 : 0;
            obj.acl.state |= this.$dialog.find('#object-tab-acl-state-every-read').prop('checked') ? 0x4 : 0;
            obj.acl.state |= this.$dialog.find('#object-tab-acl-state-every-write').prop('checked') ? 0x2 : 0;
        }

        if (this.iconVal !== null && this.iconVal !== undefined) {
            obj.common.icon = this.iconVal;
        }

        return obj;
    };

    this.saveFromRaw    = function () {
        var obj;
        try {
            obj = JSON.parse(this.editor.getValue());
        } catch (e) {
            this.main.showMessage(e, _('Parse error'), 'error_outline');
            if (!that.main.noSelect) {
                this.$dialog.find('.tabs').mtabs('select', 'object-tab-raw');
            }
            return false;
        }
        return obj;
    };

    this.save           = function () {
        if (this.main.config['object-edit-active'] === 'object-tab-raw') {
            var _obj = this.saveFromRaw();
            if (!_obj) return;

            this.main.socket.emit('setObject', _obj._id, _obj, function (err) {
                if (err) {
                    that.main.showError(err);
                } else {
                    var cb = that.$dialog.data('cb');
                    if (cb) cb(_obj);
                    that.$dialogSave.addClass('disabled');
                    that.main.navigate();
                }
            });
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
                        that.$dialogSave.addClass('disabled');
                        that.main.navigate();
                    }
                });
            });
        }
    };

    this.allStored      = function () {
        return that.$dialogSave.hasClass('disabled');
    };

}