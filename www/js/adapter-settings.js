var socket =   io.connect();
var instance = window.location.search.slice(1);
var common =   null; // common information of adapter
var host =     null; // host object on which the adapter runs
var changed =  false;
var certs =    [];
var adapter =  '';

$(document).ready(function () {

    var tmp = window.location.pathname.split('/');
    var onChangeSupported = false;
    adapter = tmp[2];
    var id = 'system.adapter.' + adapter + '.' + instance;

    // Extend dictionary with standard words for adapter
    if (typeof systemDictionary === 'undefined') systemDictionary = {};
    systemDictionary.save =           {"en": "Save",        "de": "Speichern",   "ru": "Сохранить"};
    systemDictionary.saveclose =      {"en": "Save and close", "de": "Speichern und zumachen", "ru": "Сохранить и выйти"};
    systemDictionary.none =           {"en": "none",        "de": "keins",       "ru": ""};
    systemDictionary.all =            {"en": "all",         "de": "alle",        "ru": "все"};
    systemDictionary['Device list'] = {"en": "Device list", "de": "Gerätelist",  "ru": "Список устройств"};
    systemDictionary['new device'] =  {"en": "new device",  "de": "Neues Gerät", "ru": "Новое устройство"};
    systemDictionary.edit =           {"en": "edit",        "de": "Ändern",      "ru": "Изменить"};
    systemDictionary.delete =         {"en": "delete",      "de": "Löschen",     "ru": "Удалить"};
    systemDictionary.ok =             {"en": "Ok",          "de": "Ok",          "ru": "Ok"};
    systemDictionary.cancel =         {"en": "Cancel",      "de": "Abbrechen",   "ru": "Отмена"};
    systemDictionary.Message =        {"en": "Message",     "de": "Mitteilung",  "ru": "Сообщение"};


    loadSystemConfig(function () {
        if (typeof translateAll === 'function') translateAll();
        loadSettings();
    });

    $('body').prepend('<div class="header ui-tabs-nav ui-widget ui-widget-header ui-corner-all" >' +
        '<button id="save" class="translateB">save</button>&nbsp;' +
        '<button id="saveclose" class="translateB">saveclose</button>&nbsp;' +
        '<button id="close" class="translateB">cancel</button>&nbsp;' +
        '</div>');

    $('button#save').button({icons: {primary: 'ui-icon-disk'}}).click(function () {
        if (typeof save == 'undefined') {
            alert("Please implement save function in your admin/index.html");
            return;
        }
        save(function (obj, common) {
            saveSettings(obj, common);
        });
    });
    $('button#saveclose').button({icons: {
        primary: 'ui-icon-disk',
        secondary: "ui-icon-close"
    }}).click(function () {
        if (typeof save == 'undefined') {
            alert("Please implement save function in your admin/index.html");
            return;
        }
        save(function (obj, common) {
            saveSettings(obj, common, function () {
                window.close();
                if (parent && parent.$iframeDialog) {
                    parent.$iframeDialog.dialog('close');
                }
            });
        });
    });
    $('button#close').button({icons: {primary: 'ui-icon-close'}}).click(function () {
        window.close();
        if (parent && parent.$iframeDialog) {
            parent.$iframeDialog.dialog('close');
        }
    });

    function saveSettings(obj, common, callback) {
        var newObj = {native: obj};
        if (common) newObj.common = common;
        socket.emit('extendObject', id, newObj, function () {
            changed = false;
            if (onChangeSupported) {
                $('#save').button('disable');
                $('#saveclose').button('disable');
            }
            if (callback) callback();
        });
    }

    // Read language settings
    function loadSystemConfig(callback) {
        socket.emit('getObject', 'system.config', function (err, res) {
            if (!err && res && res.common) {
                systemLang = res.common.language || systemLang;
            }
            socket.emit('getObject', 'system.certificates', function (err, res) {
                if (!err && res) {
                    if (res.native && res.native.certificates) {
                        certs = [];
                        for (var c in res.native.certificates) {
                            if (!res.native.certificates[c]) continue;
                            certs.push({
                                name: c,
                                type: (res.native.certificates[c].substring(0, '-----BEGIN RSA PRIVATE KEY'.length) == '-----BEGIN RSA PRIVATE KEY') ? 'private' : 'public'
                            });
                        }
                    }
                }
                if (callback) callback();
            });
        });
    }

    // callback if something changed
    function onChange(isChanged) {
        onChangeSupported = true;
        if (typeof isChanged == 'boolean' && isChanged === false) {
            changed = false;
            $('#save').button('disable');
            $('#saveclose').button('disable');
        } else {
            changed = true;
            $('#save').button('enable');
            $('#saveclose').button('enable');
        }
    }

    function loadSettings() {
        socket.emit('getObject', id, function (err, res) {
            if (!err && res && res.native) {
                $('.adapter-instance').html(adapter + '.' + instance);
                $('.adapter-config').html('system.adapter.' + adapter + '.' + instance);
                common = res.common;
                if (res.common && res.common.name) $('.adapter-name').html(res.common.name);
                if (typeof load == 'undefined') {
                    alert("Please implement save function in your admin/index.html");
                } else {
                    load(res.native, onChange);
                }
            } else {
                alert('error loading settings for ' + id + '\n\n' + err);
            }
        });
    }
});


function showMessage(message, title, icon) {
    var $dialogMessage = $('#dialog-message-settings');
    if (!$dialogMessage.length) {
        $('body').append('<div id="dialog-message-settings" title="Message" style="display: none">\n' +
            '<p>' +
                '<span id="dialog-message-icon-settings" class="ui-icon ui-icon-circle-check" style="float :left; margin: 0 7px 50px 0;"></span>\n' +
                '<span id="dialog-message-text-settings"></span>\n' +
            '</p>\n' +
        '</div>');
        $dialogMessage = $('#dialog-message-settings');
        $dialogMessage.dialog({
            autoOpen: false,
            modal:    true,
            buttons: [
                {
                    text: _('Ok'),
                    click: function () {
                        $(this).dialog("close");
                    }
                }
            ]
        });
    }

    if (typeof _ != 'undefined') {
        $dialogMessage.dialog('option', 'title', title || _('Message'));
    } else {
        $dialogMessage.dialog('option', 'title', title || 'Message');
    }
    $('#dialog-message-text-settings').html(message);
    if (icon) {
        $('#dialog-message-icon-settings').show();
        $('#dialog-message-icon-settings').attr('class', '');
        $('#dialog-message-icon-settings').addClass('ui-icon ui-icon-' + icon);
    } else {
        $('#dialog-message-icon-settings').hide();
    }
    $dialogMessage.dialog('open');
}

function getObject(id, callback) {
    socket.emit('getObject', id, function (err, res) {
        if (!err && res) {
            if (callback) callback(err, res);
        } else {
            if (callback) callback(null);
        }
    });
}

function getState(id, callback) {
    socket.emit('getState', id, function (err, res) {
        if (!err && res) {
            if (callback) callback(err, res);
        } else {
            if (callback) callback(null);
        }
    });
}

function getEnums(_enum, callback) {
    socket.emit('getObjectView', 'system', 'enum', {startkey: 'enum.' + _enum, endkey: 'enum.' + _enum + '.\u9999'}, function (err, res) {
        if (!err && res) {
            var _res   = {};
            for (var i = 0; i < res.rows.length; i++) {
                if (res.rows[i].id == 'enum.' + _enum) continue;
                _res[res.rows[i].id] = res.rows[i].value;
            }
            if (callback) callback(null, _res);
        } else {
            if (callback) callback(err, []);
        }
    });
}

function getIPs(host, callback) {
    if (typeof host == 'function') {
        callback = host;
        host = null;
    }

    socket.emit('getHostByIp', host || common.host, function (ip, _host) {
        if (_host) {
            host = _host;
            var IPs4 = [{name: '[IPv4] 0.0.0.0', address: '0.0.0.0', family: 'ipv4'}];
            var IPs6 = [{name: '[IPv6] ::',      address: '::',      family: 'ipv6'}];
            if (host.native.hardware && host.native.hardware.networkInterfaces) {
                for (var eth in host.native.hardware.networkInterfaces) {
                    for (var num = 0; num < host.native.hardware.networkInterfaces[eth].length; num++) {
                        if (host.native.hardware.networkInterfaces[eth][num].family != "IPv6") {
                            IPs4.push({name: '[' + host.native.hardware.networkInterfaces[eth][num].family + '] ' + host.native.hardware.networkInterfaces[eth][num].address + ' - ' + eth, address: host.native.hardware.networkInterfaces[eth][num].address, family: 'ipv4'});
                        } else {
                            IPs6.push({name: '[' + host.native.hardware.networkInterfaces[eth][num].family + '] ' + host.native.hardware.networkInterfaces[eth][num].address + ' - ' + eth, address: host.native.hardware.networkInterfaces[eth][num].address, family: 'ipv6'});
                        }
                    }
                }
            }
            for (var i = 0; i < IPs6.length; i++) {
                IPs4.push(IPs6[i]);
            }
            callback(IPs4);
        }
    });
}

function fillSelectIPs(id, actualAddr, noIPv4, noIPv6) {
    getIPs(function (ips) {
        var str = '';
        for (var i = 0; i < ips.length; i++) {
            if (noIPv4 && ips[i].family == 'ipv4') continue;
            if (noIPv6 && ips[i].family == 'ipv6') continue;
            str += '<option value="' + ips[i].address + '" ' + ((ips[i].address == actualAddr) ? 'selected' : '') + '>' + ips[i].name + '</option>';
        }

        $(id).html(str);
    });
}

function sendTo(_adapter_instance, command, message, callback) {
    socket.emit('sendTo', (_adapter_instance || adapter + '.' + instance), command, message, callback);
}

function sendToHost(host, command, message, callback) {
    socket.emit('sendToHost', host || common.host, command, message, callback);
}

// fills select with names of the certificates and preselect it
function fillSelectCertificates(id, type, actualValued) {
    var str = '<option value="">' + _('none') + '</option>';
    for (var i = 0; i < certs.length; i++) {
        if (certs[i].type != type) continue;
        str += '<option value="' + certs[i].name + '" ' + ((certs[i].name == actualValued) ? 'selected' : '') + '>' + certs[i].name + '</option>';
    }

    $(id).html(str);
}

function getAdapterInstances(_adapter, callback) {
    if (typeof _adapter == 'function') {
        callback = _adapter;
        _adapter = null;
    }

    socket.emit('getObjectView', 'system', 'instance', {startkey: 'system.adapter.' + (_adapter || adapter), endkey: 'system.adapter.' + (_adapter || adapter) + '.\u9999'}, function (err, doc) {
        if (err) {
            if (callback) callback ([]);
        } else {
            if (doc.rows.length === 0) {
                if (callback) callback ([]);
            } else {
                var res = [];
                for (var i = 0; i < doc.rows.length; i++) {
                    res.push(doc.rows[i].value);
                }
                if (callback) callback (res);
            }
        }

    });
}

function getIsAdapterAlive(_adapter, callback) {
    if (typeof _adapter == 'function') {
        callback = _adapter;
        _adapter = null;
    }
    getState('system.adapter.' + (_adapter || adapter) + '.' + instance + '.alive', function (err, obj) {
        if (!obj || !obj.val) {
            callback(false);
        } else {
            callback(true);
        }
    });
}

// Adds one entry to the created with editTable table
//  tabId - the id of the table used by editTable
//  value - is one object to add in form {ip: '3.3.3.3', room: 'enum.room.bla3', desc: 'Bla3'}
// $grid  - [optional] - object returned by editTable to speed up the addition
// _isInitial - [optional] - if it is initial fill of the table. To not trigger the onChange
function addToTable(tabId, value, $grid, _isInitial) {
    $grid = $grid || $('#' + tabId);
    var obj  = {_id: $grid[0]._maxIdx++};
    var cols = $grid[0]._cols;

    for (var i = 0; i < cols.length; i++) {
        if (cols[i] == 'room') {
            obj[cols[i]] = ($grid[0]._rooms[value[cols[i]]]) ? $grid[0]._rooms[value[cols[i]]].common.name : value[cols[i]];
        } else {
            obj[cols[i]] = value[cols[i]];
        }
    }
    obj._commands =
        '<button data-' + tabId + '-id="' + obj._id + '" class="' + tabId + '-edit-submit">'                        + _('edit')   + '</button>' +
        '<button data-' + tabId + '-id="' + obj._id + '" class="' + tabId + '-delete-submit">'                      + _('delete') + '</button>' +
        '<button data-' + tabId + '-id="' + obj._id + '" class="' + tabId + '-ok-submit" style="display:none">'     + _('ok')     + '</button>' +
        '<button data-' + tabId + '-id="' + obj._id + '" class="' + tabId + '-cancel-submit" style="display:none">' + _('cancel') + '</button>';

    $grid.jqGrid('addRowData', tabId + '_' + obj._id, obj);

    _editInitButtons($grid, tabId, obj._id);

    if (!_isInitial && $grid[0]._onChange) $grid[0]._onChange('add', value);
}

function _editInitButtons($grid, tabId, objId) {
    var search = objId ? '[data-' + tabId + '-id="' + objId + '"]' : '';

    $('.' + tabId + '-edit-submit' + search).unbind('click').button({
        icons: {primary: 'ui-icon-pencil'},
        text:  false
    }).click(function () {
        var id = $(this).attr('data-' + tabId + '-id');

        $('.' + tabId + '-edit-submit').hide();
        $('.' + tabId + '-delete-submit').hide();
        $('.' + tabId + '-ok-submit[data-' + tabId + '-id="' + id + '"]').show();
        $('.' + tabId + '-cancel-submit[data-' + tabId + '-id="' + id + '"]').show();

        $grid.jqGrid('editRow', tabId + '_' + id, {"url": "clientArray"});
        if ($grid[0]._edited.indexOf(id) == -1) {
            $grid[0]._edited.push(id);
        }
        changed = true;
        $('#save').button("enable");
        $('#saveclose').button("enable");
    }).css('height', '18px');

    $('.' + tabId + '-delete-submit' + search).unbind('click').button({
        icons: {primary: 'ui-icon-trash'},
        text:  false
    }).click(function () {
        var id = $(this).attr('data-' + tabId + '-id');
        $grid.jqGrid('delRowData', tabId + '_' + id);
        changed = true;
        $('#save').button("enable");
        $('#saveclose').button("enable");
        var pos = $grid[0]._edited.indexOf(id);
        if (pos != -1) {
            $grid[0]._edited.splice(pos, 1);
        }
        if ($grid[0]._onChange) $grid[0]._onChange('del', id);
    }).css('height', '18px');

    $('.' + tabId + '-ok-submit' + search).unbind('click').button({
        icons: {primary: 'ui-icon-check'},
        text:  false
    }).click(function () {
        var id = $(this).attr('data-' + tabId + '-id');

        $('.' + tabId + '-edit-submit').show();
        $('.' + tabId + '-delete-submit').show();
        $('.' + tabId + '-ok-submit').hide();
        $('.' + tabId + '-cancel-submit').hide();

        $grid.jqGrid('saveRow', tabId + '_' + id, {"url": "clientArray"});

        changed = true;
        $('#save').button("enable");
        $('#saveclose').button("enable");

        var pos = $grid[0]._edited.indexOf(id);
        if (pos != -1) {
            $grid[0]._edited.splice(pos, 1);
        }
        if ($grid[0]._onChange) $grid[0]._onChange('changed', $grid.jqGrid('getRowData', tabId + '_' + id));
    }).css('height', '18px');

    $('.' + tabId + '-cancel-submit' + search).unbind('click').button({
        icons: {primary: 'ui-icon-close'},
        text:  false
    }).click(function () {
        var id = $(this).attr('data-' + tabId + '-id');

        $('.' + tabId + '-edit-submit').show();
        $('.' + tabId + '-delete-submit').show();
        $('.' + tabId + '-ok-submit').hide();
        $('.' + tabId + '-cancel-submit').hide();

        $grid.jqGrid('restoreRow', tabId + '_' + id, false);
        var pos = $grid[0]._edited.indexOf(id);
        if (pos != -1) {
            $grid[0]._edited.splice(pos, 1);
        }
    }).css('height', '18px');
}

function _editTable(tabId, cols, values, rooms, top, onChange) {
    initGridLanguage(systemLang);
    var colNames = [];
    var colModel = [];
    var $grid = $('#' + tabId);
    var room;

    colNames.push('id');
    colModel.push({
        name:    '_id',
        index:   '_id',
        hidden:  true
    });
    for (var i = 0; i < cols.length; i++) {
        colNames.push(_(cols[i]));
        var _obj = {
            name:     cols[i],
            index:    cols[i],
//                width:    160,
            editable: true
        };
        if (cols[i] == 'room') {
            var list = {'': _('none')};
            for (room in rooms) {
                list[room] = _(rooms[room].common.name);
            }
            _obj.stype =         'select';
            _obj.edittype =      'select';
            _obj.editoptions =   {value: list};
            _obj.searchoptions = {
                sopt:  ['eq'],
                value: ':' + _('all')
            };
            for (room in rooms) {
                _obj.searchoptions.value += ';' + _(rooms[room].common.name) + ':' + _(rooms[room].common.name);
            }
        }
        colModel.push(_obj);
    }
    colNames.push('');
    colModel.push({name: '_commands',    index: '_commands',    width: 60,  editable: false, align: 'center', search:false});

    $grid[0]._cols     = cols;
    $grid[0]._rooms    = rooms;
    $grid[0]._maxIdx   = 0;
    $grid[0]._top      = top;
    $grid[0]._edited   = [];
    $grid[0]._onChange = onChange;

    $grid.jqGrid({
        datatype:  'local',
        colNames:  colNames,
        colModel:  colModel,
        width:     800,
        height:    330,
        pager:     $('#pager-' + tabId),
        rowNum:    20,
        rowList:   [20, 50, 100],
        ondblClickRow: function (rowid) {
            var id = rowid.substring((tabId + '_').length);
            $('.' + tabId + '-edit-submit').hide();
            $('.' + tabId + '-delete-submit').hide();
            $('.' + tabId + '-ok-submit[data-' + tabId + '-id="' + id + '"]').show();
            $('.' + tabId + '-cancel-submit[data-' + tabId + '-id="' + id + '"]').show();
            $grid.jqGrid('editRow', rowid, {"url": "clientArray"});
            if ($grid[0]._edited.indexOf(id) == -1) {
                $grid[0]._edited.push(id);
            }
            changed = true;
            $('#save').button("enable");
            $('#saveclose').button("enable");
        },
        sortname:  "id",
        sortorder: "desc",
        viewrecords: false,
        pgbuttons: false,
        pginput: false,
        pgtext: false,
        caption: _('Device list'),
        ignoreCase: true
    }).jqGrid('filterToolbar', {
        defaultSearch: 'cn',
        autosearch:    true,
        searchOnEnter: false,
        enableClear:   false,
        afterSearch:   function () {
            _editInitButtons($grid, tabId);
        }
    });
    if ($('#pager-' + tabId).length) {
        $grid.navGrid('#pager-' + tabId, {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-' + tabId, {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                // Find new unique name
                var found;
                var newText = _("New");
                var ids = $grid.jqGrid('getDataIDs');
                var idx = 1;
                var obj;
                do {
                    found = true;
                    for (var _id = 0; _id < ids.length; _id++) {
                        obj = $grid.jqGrid('getRowData', ids[_id]);
                        if (obj && obj[$grid[0]._cols[0]] == newText + idx)  {
                            idx++;
                            found = false;
                            break;
                        }
                    }
                } while (!found);

                obj = {};
                for (var t = 0; t < $grid[0]._cols.length; t++) {
                    obj[$grid[0]._cols[t]] = '';
                }
                obj[$grid[0]._cols[0]] = newText + idx;

                changed = true;
                $('#save').button("enable");
                $('#saveclose').button("enable");
                addToTable(tabId, obj, $grid);
            },
            position: 'first',
            id:       'add-cert',
            title:    _('new device'),
            cursor:   'pointer'
        });
    }

    if (values) {
        for (var u = 0; u < values.length; u++) {
            addToTable(tabId, values[u], $grid, true);
        }
    }
    $(window).resize(function () {
        $grid.setGridHeight($(this).height() - top).setGridWidth($(this).width() - 10);
    });
    $(window).trigger('resize');

    return $grid;
}

// converts "enum.room.Sleeping_room" to "Sleeping room"
// As input gets the list from getEnum
function enumName2Id(enums, name) {
    for (var enumId in enums) {
        if (enums[enumId].common.name == name) return enumId;
        if (enums[enumId].name && enums[enumId].name == name) return enumId;
    }
    return '';
}

// Creates edit table for any configuration array
//   tabId  - is id of table where the jqGrid must be created. E.g: <table id="devices"></table><div id="pager-devices"></div>
//   cols   - array with names of the properties of entry. E.g: ['ip', 'room', 'desc']
//           if column has name room, for that will be automatically the room enums loaded and shown
//   values - array with values in form [{ip: '1.1.1.1', room: 'enum.room.bla1', desc: 'Bla1'},  {ip: '2.2.2.2', room: 'enum.room.bla2', desc: 'Bla2'}
//   top    - top position of the table to set the height of the table automatically. Table must be always as last on the page.
//   onChange - callback called if something is changed in the table
//
// returns the jquery object of $('#tabId')
// To extract data from table
function editTable(tabId, cols, values, top, onChange) {
    if (cols.indexOf('room') != -1) {
        getEnums("rooms", function (err, list) {
            return _editTable(tabId, cols, values, list, top, onChange);
        });
    } else {
        return _editTable(tabId, cols, values, null, top, onChange);
    }
}

// Extract edited array from table
//   tabId  - is id of table where the jqGrid must be created. E.g: <table id="devices"></table><div id="pager-devices"></div>
//   cols   - array with names of the properties of entry. E.g: ['ip', 'room', 'desc']
//
// Returns array with values
function getTableResult(tabId, cols) {
    var $grid = $('#' + tabId);
    for (var j = 0; j < $grid[0]._edited.length; j++) {
        $grid.jqGrid('saveRow', tabId + '_' + $grid[0]._edited[j], {"url": "clientArray"});
    }

    $('.' + tabId + '-edit-submit').show();
    $('.' + tabId + '-delete-submit').show();
    $('.' + tabId + '-ok-submit').hide();
    $('.' + tabId + '-cancel-submit').hide();

    var data = $grid.jqGrid('getRowData');
    var res = [];
    for (var i = 0; i < data.length; i++) {
        var obj = {};
        for (var z = 0; z < cols.length; z++) {
            if (cols[z] == 'room') {
                obj[cols[z]] = enumName2Id($grid[0]._rooms, data[i][cols[z]]);
            } else {
                obj[cols[z]] = data[i][cols[z]];
            }
        }
        res.push(obj);
    }
    return res;
}
