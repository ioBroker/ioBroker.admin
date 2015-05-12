/* jshint -W097 */// jshint strict:true
/* jslint vars: true */
/* global io:false */
/* global jQuery:false */
/* jslint browser:true */
/* jshint browser:true */
/*global _ */
/*global ace */
/*global console */
/*global alert */
/*global confirm */
/*global systemLang: true */
/*global license */
/*global translateAll */
/*global initGridLanguage */
/*global systemLang */
'use strict';

//if (typeof Worker === 'undefined') alert('your browser does not support WebWorkers :-(');

Array.prototype.remove = function () {
    var what;
    var a = arguments;
    var L = a.length;
    var ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

var $iframeDialog = null; // used in adapter settings window

(function ($) {
$(document).ready(function () {
    var main = {
        objects:        {},
        states:         {},
        currentHost:    '',
        socket:         io.connect(),
        systemConfig:   null,
        instances:      null,
        objectsLoaded:  false,
        waitForRestart: false,
        tabs:           null,
        selectId:       null,
        config:         {},
        addEventMessage: function (id, state, rowData) {
            addEventMessage(id, state, rowData);
        },
        saveConfig:     function (attr, value) {
            if (attr) main.config[attr] = value;

            if (typeof storage != 'undefined') {
                storage.set('adminConfig', JSON.stringify(main.config));
            }
        },
        // Helper methods
        upToDate:       function (_new, old) {
            _new = _new.split('.');
            old = old.split('.');
            _new[0] = parseInt(_new[0], 10);
            old[0] = parseInt(old[0], 10);
            if (_new[0] > old[0]) {
                return false;
            } else if (_new[0] === old[0]) {
                _new[1] = parseInt(_new[1], 10);
                old[1] = parseInt(old[1], 10);
                if (_new[1] > old[1]) {
                    return false;
                } else if (_new[1] === old[1]) {
                    _new[2] = parseInt(_new[2], 10);
                    old[2] = parseInt(old[2], 10);
                    if (_new[2] > old[2]) {
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    return true;
                }
            } else {
                return true;
            }
        },
        // Methods
        cmdExec:        function (host, cmd, callback) {
            host = host || main.currentHost;
            $stdout.val('');
            $dialogCommand.dialog('open');
            stdout = '$ ./iobroker ' + cmd;
            $stdout.val(stdout);
            // genereate the unique id to coordinate the outputs
            activeCmdId = Math.floor(Math.random() * 0xFFFFFFE) + 1;
            cmdCallback = callback;
            main.socket.emit('cmdExec', host, activeCmdId, cmd);
        },
        confirmMessage: function (message, title, icon, callback) {
            $dialogConfirm.dialog('option', 'title', title || _('Message'));
            $('#dialog-confirm-text').html(message);
            if (icon) {
                $('#dialog-confirm-icon').show();
                $('#dialog-confirm-icon').attr('class', '');
                $('#dialog-confirm-icon').addClass('ui-icon ui-icon-' + icon);
            } else {
                $('#dialog-confirm-icon').hide();
            }
            $dialogConfirm.data('callback', callback);
            $dialogConfirm.dialog('open');
        },
        showMessage:    function (message, title, icon) {
        $dialogMessage.dialog('option', 'title', title || _('Message'));
            $('#dialog-message-text').html(message);
            if (icon) {
                $('#dialog-message-icon').show();
                $('#dialog-message-icon').attr('class', '');
                $('#dialog-message-icon').addClass('ui-icon ui-icon-' + icon);
            } else {
                $('#dialog-message-icon').hide();
            }
            $dialogMessage.dialog('open');
        },
        formatDate:     function (dateObj, isSeconds) {
            //return dateObj.getFullYear() + '-' +
            //    ("0" + (dateObj.getMonth() + 1).toString(10)).slice(-2) + '-' +
            //    ("0" + (dateObj.getDate()).toString(10)).slice(-2) + ' ' +
            //    ("0" + (dateObj.getHours()).toString(10)).slice(-2) + ':' +
            //    ("0" + (dateObj.getMinutes()).toString(10)).slice(-2) + ':' +
            //    ("0" + (dateObj.getSeconds()).toString(10)).slice(-2);
            // Following implementation is 5 times faster
            if (!dateObj) return '';
            var text = typeof dateObj;
            if (text == 'string') {
                var pos = dateObj.indexOf('.');
                if (pos != -1) dateObj = dateObj.substring(0, pos);
                return dateObj;
            }
            if (text != 'object') dateObj = isSeconds ? new Date(dateObj * 1000) : new Date(dateObj);

            text = dateObj.getFullYear();
            var v = dateObj.getMonth() + 1;
            if (v < 10) {
                text += '-0' + v;
            } else {
                text += '-' + v;
            }

            v = dateObj.getDate();
            if (v < 10) {
                text += '-0' + v;
            } else {
                text += '-' + v;
            }

            v = dateObj.getHours();
            if (v < 10) {
                text += ' 0' + v;
            } else {
                text += ' ' + v;
            }
            v = dateObj.getMinutes();
            if (v < 10) {
                text += ':0' + v;
            } else {
                text += ':' + v;
            }

            v = dateObj.getSeconds();
            if (v < 10) {
                text += ':0' + v;
            } else {
                text += ':' + v;
            }

            return text;
        },
        _delObject:     function ($tree, id, callback) {
            var leaf = $tree.selectId('getTreeInfo', id);
            //var leaf = treeFindLeaf(id);
            if (leaf && leaf.children) {
                for (var e = 0; e < leaf.children.length; e++) {
                    main.delObject($tree, leaf.children[e], function () {
                        main.delObject($tree, id, callback, true);
                    }, true);
                    break;
                }
            } else {
                if (main.objects[id] && main.objects[id].common && main.objects[id].common['object-non-deletable']) {
                    main.showMessage(_('Cannot delete "%s" because not allowed', id), '', 'notice');
                    if (callback) callback(id);
                } else {
                    main.socket.emit('delObject', id, function () {
                        main.socket.emit('delState', id, function () {
                            if (callback) {
                                setTimeout(function () {
                                    callback(id);
                                }, 0);
                            }
                        });
                    });
                }
            }
        },
        delObject:      function ($tree, id, callback, hideConfirm) {
            if (hideConfirm) {
                main._delObject($tree, id, callback);
            } else {
                main.confirmMessage(_('Are you sure to delete %s and all children?', id), null, 'help', function (result) {
                    if (result) main._delObject($tree, id, callback);
                });
            }
        },
        initSelectId: function () {
            if (main.selectId) return main.selectId;
            main.selectId = $('#dialog-select-member').selectId('init',  {
                objects: main.objects,
                states:  main.states,
                filter: {type: 'state'},
                texts: {
                    select:   _('Select'),
                    cancel:   _('Cancel'),
                    all:      _('All'),
                    id:       _('ID'),
                    name:     _('Name'),
                    role:     _('Role'),
                    room:     _('Room'),
                    value:    _('Value'),
                    selectid: _('Select ID'),
                    from:     _('From'),
                    lc:       _('Last changed'),
                    ts:       _('Time stamp'),
                    wait:     _('Processing...'),
                    ack:      _('Acknowledged')
                },
                columns: ['image', 'name', 'role', 'room', 'value']
            });
            return main.selectId;
        }
    };
    
    var tabs = {
        adapters:   new Adapters(main),
        instances:  new Instances(main),
        logs:       new Logs(main),
        states:     new States(main),
        objects:    new Objects(main),
        scripts:    new Scripts(main)
    };
    main.instances = tabs.instances.list;
    main.tabs      = tabs;

    var enums =                 [];
    var scripts =               [];
    var users =                 [];
    var groups =                [];
    var children =              {};
    var updateTimers =          {};
    var hosts =                 [];
    var enumCurrentParent =     '';

    var systemRepos;
    var systemCerts;

    var cmdCallback =           null;
    var stdout;
    var activeCmdId =           null;

    var eventsLinesCount =      0;
    var eventsLinesStart =      0;
    var eventTypes =            [];
    var eventFroms =            [];
    var eventFilterTimeout =    null;

    var $stdout =               $('#stdout');

    var $dialogCommand =        $('#dialog-command');
    var $dialogEnumMembers =    $('#dialog-enum-members');
    var $dialogEnum =           $('#dialog-enum');
    var $dialogUser =           $('#dialog-user');
    var $dialogGroup =          $('#dialog-group');
    var $dialogLicense =        $('#dialog-license');
    var $dialogSystem =         $('#dialog-system');
    var $dialogMessage =        $('#dialog-message');
    var $dialogConfirm =        $('#dialog-confirm');

    var $gridUsers =            $('#grid-users');
    var $gridGroups =           $('#grid-groups');
    var $gridEnums =            $('#grid-enums');
    var $gridEnumMembers =      $('#grid-enum-members');
    var $gridHosts =            $('#grid-hosts');
    var $gridRepo =             $('#grid-repos');
    var $gridCerts =            $('#grid-certs');

    var firstConnect =          true;

    var enumEdit =              null;

    // Read all positions, selected widgets for every view,
    // Selected view, selected menu page,
    // Selected widget or view page
    // Selected filter
    if (typeof storage != 'undefined') {
        try {
            main.config = storage.get('adminConfig');
            if (main.config) {
                main.config = JSON.parse(main.config);
            } else {
                main.config = {};
            }
        } catch (e) {
            console.log('Cannot load edit config');
            main.config = {};
        }
    }

    // jQuery UI initializations
    $('#tabs').tabs({
        activate: function (event, ui) {
            window.location.hash = '#' + ui.newPanel.selector.slice(5);
            switch (ui.newPanel.selector) {
                case '#tab-objects':
                    tabs.objects.init();
                    break;

                case '#tab-hosts':
                    initHosts();
                    break;

                case '#tab-states':
                    tabs.states.init();
                    break;

                case '#tab-scripts':
                    tabs.scripts.init();
                    break;

                case '#tab-adapters':
                    initHostsList();
                    break;

                case '#tab-instances':
                    tabs.instances.init();
                    break;

                case '#tab-users':
                    initUsers();
                    break;

                case '#tab-groups':
                    initGroups();
                    break;

                case '#tab-enums':
                    initEnums();
                    break;

                case '#tab-log':
                    tabs.logs.init();
                    break;
            }
        },
        create: function () {
            $('#tabs ul.ui-tabs-nav').prepend('<li class="header">ioBroker.admin</li>');

            $('.ui-tabs-nav')
                .append('<button class="menu-button" id="button-logout">' + _('Logout') + '</button>')
                .append('<button class="menu-button" id="button-system">' + _('System') + '</button>');
            $('#button-logout').button().click(function () {
                window.location.href = '/logout/';
            });
            $('#button-system').button({
                icons: {primary: 'ui-icon-gear'},
                text: false
            }).click(function () {
                $('#system_activeRepo').html('');
                if (systemRepos.native.repositories) {
                    for (var repo in systemRepos.native.repositories) {
                        $('#system_activeRepo').append('<option value="' + repo + '">' + repo + '</option>');
                    }
                }

                $('#diagMode').val(main.systemConfig.common.diag).change(function () {
                    main.socket.emit('sendToHost', main.currentHost, 'getDiagData', $(this).val(), function (obj) {
                        $('#diagSample').html(JSON.stringify(obj, null, 2));
                    });
                });
                $('#diagMode').trigger('change');


                $('.system-settings.value').each(function () {
                    var $this = $(this);
                    var id = $this.attr('id').substring('system_'.length);

                    $('.system-settings.value').each(function () {
                        var $this = $(this);
                        var id = $this.attr('id').substring('system_'.length);

                        if ($this.attr('type') == 'checkbox') {
                            $this.prop('checked', main.systemConfig.common[id]);
                        } else {
                            if (id == 'isFloatComma') {
                                $this.val(main.systemConfig.common[id] ? "true" : "false");
                            } else {
                                $this.val(main.systemConfig.common[id]);
                            }
                        }

                    });
                });
                $('#tabs-system').tabs();

                $dialogSystem.dialog('open');
            });
            window.onhashchange = navigation;
            navigation();
        }
    });

    function string2cert(name, str) {
        // expected format: -----BEGIN CERTIFICATE-----certif...icate==-----END CERTIFICATE-----
        if (str.length < '-----BEGIN CERTIFICATE-----==-----END CERTIFICATE-----'.length) {
            main.showMessage(_('Invalid certificate "%s". To short.', name));
            return '';
        }
        var lines = [];
        if (str.substring(0, '-----BEGIN RSA PRIVATE KEY-----'.length) == '-----BEGIN RSA PRIVATE KEY-----') {
            if (str.substring(str.length -  '-----END RSA PRIVATE KEY-----'.length) != '-----END RSA PRIVATE KEY-----') {
                main.showMessage(_('Certificate "%s" must end with "-----END RSA PRIVATE KEY-----".', name), '', 'notice');
                return '';
            }
            str = str.substring('-----BEGIN RSA PRIVATE KEY-----'.length);
            str = str.substring(0, str.length - '-----END RSA PRIVATE KEY-----'.length);
            str = str.replace(/ /g, '');
            while (str.length) {
                lines.push(str.substring(0, 64));
                str = str.substring(64);
            }
            return '-----BEGIN RSA PRIVATE KEY-----\r\n' + lines.join('\r\n') + '\r\n-----END RSA PRIVATE KEY-----\r\n';
        } else {
            if (str.substring(0, '-----BEGIN CERTIFICATE-----'.length) != '-----BEGIN CERTIFICATE-----') {
                main.showMessage(_('Certificate "%s" must start with "-----BEGIN CERTIFICATE-----".', name), '', 'notice');
                return '';
            }
            if (str.substring(str.length -  '-----END CERTIFICATE-----'.length) != '-----END CERTIFICATE-----') {
                main.showMessage(_('Certificate "%s" must end with "-----END CERTIFICATE-----".', name), '', 'notice');
                return '';
            }
            str = str.substring('-----BEGIN CERTIFICATE-----'.length);
            str = str.substring(0, str.length - '-----END CERTIFICATE-----'.length);
            str = str.replace(/ /g, '');
            while (str.length) {
                lines.push(str.substring(0, 64));
                str = str.substring(64);
            }
            return '-----BEGIN CERTIFICATE-----\r\n' + lines.join('\r\n') + '\r\n-----END CERTIFICATE-----\r\n';
        }
    }

    function cert2string(cert) {
        var res = cert.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
        return res;
    }

    // Use the function for this because it must be done after the language was read
    function initAllDialogs() {

        initGridLanguage(main.systemConfig.common.language);

        $dialogSystem.dialog({
            autoOpen:   false,
            modal:      true,
            width:      800,
            height:     480,
            buttons: [
                {
                    text: _('Save'),
                    click: function () {
                        var common = main.systemConfig.common;
                        var languageChanged   = false;
                        var activeRepoChanged = false;

                        $('.system-settings.value').each(function () {
                            var $this = $(this);
                            var id = $this.attr('id').substring('system_'.length);

                            if ($this.attr('type') == 'checkbox') {
                                common[id] = $this.prop('checked');
                            } else {
                                if (id == 'language'   && common.language   != $this.val()) languageChanged   = true;
                                if (id == 'activeRepo' && common.activeRepo != $this.val()) activeRepoChanged = true;
                                common[id] = $this.val();
                                if (id == 'isFloatComma') common[id] = (common[id] === "true" || common[id] === true);
                            }
                        });

                        // Fill the repositories list
                        var links = {};
                        for (var r in systemRepos.native.repositories) {
                            if (typeof systemRepos.native.repositories[r] == 'object' && systemRepos.native.repositories[r].json) {
                                links[systemRepos.native.repositories[r].link] = systemRepos.native.repositories[r].json;
                            }
                        }
                        systemRepos.native.repositories = {};
                        var data = $gridRepo.jqGrid('getRowData');
                        var first = null;
                        for (var i = 0; i < data.length; i++) {
                            systemRepos.native.repositories[data[i].name] = {link: data[i].link, json: null};
                            if (links[data[i].link]) systemRepos.native.repositories[data[i].name].json = links[data[i].link];
                            if (!first) first = data[i].name;
                        }
                        // Check if the active repository still exist in the list
                        if (!first) {
                            if (common.activeRepo) {
                                activeRepoChanged = true;
                                common.activeRepo = '';
                            }
                        } else if (!systemRepos.native.repositories[common.activeRepo]) {
                            activeRepoChanged = true;
                            common.activeRepo = first;
                        }
                        common.diag = $('#diagMode').val();

                        // Fill the certificates list
                        systemCerts.native.certificates = {};
                        data = $gridCerts.jqGrid('getRowData');
                        for (var j = 0; j < data.length; j++) {
                            systemCerts.native.certificates[data[j].name] = string2cert(data[j].name, data[j].certificate);
                        }

                        main.socket.emit('extendObject', 'system.config', {common: common}, function (err) {
                            if (!err) {
                                if (languageChanged) {
                                    window.location.reload();
                                } else {
                                    if (activeRepoChanged) {
                                        setTimeout(function () {
                                            tabs.adapters.init(true);
                                        }, 0);
                                    }
                                }
                            }

                            main.socket.emit('extendObject', 'system.repositories', systemRepos, function (err) {
                                if (activeRepoChanged) {
                                    setTimeout(function () {
                                        tabs.adapters.init(true);
                                    }, 0);
                                }

                                main.socket.emit('extendObject', 'system.certificates', systemCerts, function (err) {
                                    $dialogSystem.dialog('close');
                                });
                            });
                        });
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        $dialogSystem.dialog('close');
                    }
                }
            ],
            open: function (event, ui) {
                $gridRepo.setGridHeight($(this).height() - 150).setGridWidth($(this).width() - 40);
                $gridCerts.setGridHeight($(this).height() - 150).setGridWidth($(this).width() - 40);
                initRepoGrid();
                initCertsGrid();
            },
            resize: function () {
                $gridRepo.setGridHeight($(this).height() - 160).setGridWidth($(this).width() - 40);
                $gridCerts.setGridHeight($(this).height() - 160).setGridWidth($(this).width() - 40);
            }
        });

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

        $dialogCommand.dialog({
            autoOpen:      false,
            modal:         true,
            width:         920,
            height:        480,
            closeOnEscape: false,
            open: function (event, ui) {
                $(".ui-dialog-titlebar-close", ui.dialog || ui).hide();
                $('#stdout').width($(this).width() - 10).height($(this).height() - 20);
            },
            resize: function (event, ui) {
                $('#stdout').width($(this).width() - 10).height($(this).height() - 20);
            }
        });

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

        $dialogConfirm.dialog({
            autoOpen: false,
            modal:    true,
            buttons: [
                {
                    text: _('Ok'),
                    click: function () {
                        var cb = $(this).data('callback');
                        $(this).dialog('close');
                        if (cb) cb(true);
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        var cb = $(this).data('callback');
                        $(this).dialog('close');
                        if (cb) cb(false);
                    }
                }

            ]
        });
    }

    $('#enum-name').keyup(function () {
        var t = $('#enum-gen-id');
        t.html(t[0]._original + '.' + $(this).val().replace(/ /, '_').toLowerCase());
    });

    $('#event-filter-type').change(filterEvents);
    $('#event-filter-id').change(function () {
        if (eventFilterTimeout) clearTimeout(eventFilterTimeout);
        eventFilterTimeout = setTimeout(filterEvents, 1000);
    }).keyup(function (e) {
        if (e.which == 13) {
            filterEvents();
        } else {
            $(this).trigger('change');
        }
    });
    $('#event-filter-val').change(function () {
        if (eventFilterTimeout) clearTimeout(eventFilterTimeout);
        eventFilterTimeout = setTimeout(filterEvents, 1000);
    }).keyup(function (e) {
        if (e.which == 13) {
            filterEvents();
        } else {
            $(this).trigger('change');
        }
    });
    $('#event-filter-ack').change(filterEvents);
    $('#event-filter-from').change(filterEvents);
    $('#event-filter-val-clear').button({icons:{primary: 'ui-icon-close'}, text: false}).css({height: 18, width: 18}).click(function () {
        if ($('#event-filter-val').val() !== '') {
            $('#event-filter-val').val('').trigger('change');
        }
    });
    $('#event-filter-id-clear').button({icons:{primary: 'ui-icon-close'}, text: false}).css({height: 18, width: 18}).click(function () {
        if ($('#event-filter-id').val() !== '') {
            $('#event-filter-id').val('').trigger('change');
        }
    });

    tabs.logs.prepare();

    // detect type of state
    function getType(val) {
        if (val === true || val === 'true' || val === false || val === 'false') return 'bool';
        if (parseFloat(val).toString() == val) return 'number';
        return typeof val;
    }

    function prepareEnumMembers() {
        $gridEnumMembers.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('type')],
            colModel: [
                {name: '_id',  index:'_id',  width: 240},
                {name: 'name', index:'name', width: 400},
                {name: 'type', index:'type', width: 100, fixed: true}
            ],
            pager: $('#pager-enum-members'),
            width: 768,
            height: 370,
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('members'),
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
                var _obj = $gridEnumMembers.jqGrid('getRowData', $gridEnumMembers.jqGrid('getGridParam', 'selrow'));
                var id = _obj._id;
                var obj = main.objects[enumEdit];
                var idx = obj.common.members.indexOf(id);
                if (idx !== -1) {
                    obj.common.members.splice(idx, 1);
                    main.objects[enumEdit] = obj;
                    main.socket.emit('setObject', enumEdit, obj, function () {
                        setTimeout(function () {
                            enumMembers(enumEdit);
                        }, 0);
                    });
                }
            },
            position: 'first',
            id: 'del-member',
            title: _('Delete member'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-enum-members', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                var sid = main.initSelectId();

                sid.selectId('show', function (newId, oldId) {
                    var obj = main.objects[enumEdit];
                    if (obj.common.members.indexOf(newId) === -1) {
                        obj.common.members.push(newId);

                        main.socket.emit('setObject', enumEdit, obj, function () {
                            setTimeout(function () {
                                enumMembers(enumEdit);
                            }, 0);
                        });
                    }
                });
            },
            position: 'first',
            id:       'add-member',
            title:    _('Add member'),
            cursor:   'pointer'
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
                $gridEnumMembers.setGridHeight($(this).height() - 100).setGridWidth($(this).width() - 5);
            },
            open: function () {
                $gridEnumMembers.setGridHeight($(this).height() - 100).setGridWidth($(this).width() - 5);
            }
        });

        $dialogEnumMembers.trigger('resize');
    }

    function prepareUsers() {
        var userLastSelected;
        $gridUsers.jqGrid({
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
                if (id && id !== userLastSelected) {
                    $gridUsers.restoreRow(userLastSelected);
                    userLastSelected = id;
                }

                id = $('tr[id="' + userLastSelected + '"]').find('td[aria-describedby$="_id"]').html();

                if (!users[id] || !users[id].common || !users[id].common.dontDelete) {
                    $('#del-user').removeClass('ui-state-disabled');
                }
                $('#edit-user').removeClass('ui-state-disabled');

                var rowData = $gridUsers.jqGrid('getRowData', id);
                rowData.ack = false;
                rowData.from = '';
                $gridUsers.jqGrid('setRowData', id, rowData);
            },
            gridComplete: function () {
                $('#del-user').addClass('ui-state-disabled');
                $('#edit-user').addClass('ui-state-disabled');
                $(".user-groups-edit").multiselect({
                            selectedList: 4,
                    close: function () {
                        synchronizeUser($(this).attr('data-id'), $(this).val());
                    },
                    checkAllText:     _('Check all'),
                    uncheckAllText:   _('Uncheck All'),
                    noneSelectedText: _('Select options')
                });
                $(".user-enabled-edit").change(function () {
                    var obj = {common: {enabled: $(this).is(':checked')}};
                    var id  = $(this).attr('data-id');
                    main.socket.emit('extendObject', id, obj);
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
                var objSelected = $gridUsers.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                main.confirmMessage(_('Are you sure?'), null, 'help', function (result) {
                    if (result) {
                        main.socket.emit('delUser', id.replace('system.user.', ''), function (err) {
                            if (err) {
                                main.showMessage(_('Cannot delete user: ') + err, '', 'alert');
                            } else {
                                setTimeout(function () {
                                    delUser(id);
                                }, 0);
                            }
                        });

                    }
                });
            },
            position: 'first',
            id: 'del-user',
            title: _('delete user'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-users', {
            caption: '',
            buttonicon: 'ui-icon-pencil',
            onClickButton: function () {
                var objSelected = $gridUsers.jqGrid('getGridParam', 'selrow');
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
                    main.showMessage(_('Invalid object %s', objSelected), '', 'alert');
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

        $dialogUser.dialog({
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
                        $dialogUser.dialog('close');

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
    }

    function prepareGroups() {
        var groupLastSelected;
        $gridGroups.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('desc'), _('users')],
            colModel: [
                {name: '_id',         index: '_id',         width: 250},
                {name: 'name',        index: 'name',        editable: false, width: 150},
                {name: 'description', index: 'description', editable: false, width: 200},
                {name: 'users',       index: 'users',       editable: false, width: 400}
            ],
            pager: $('#pager-groups'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker groups'),
            onSelectRow: function (id, e) {
                if (id && id !== groupLastSelected) {
                    $gridGroups.restoreRow(groupLastSelected);
                    groupLastSelected = id;
                }

                id = $('tr[id="' + groupLastSelected + '"]').find('td[aria-describedby$="_id"]').html();

                if (!groups[id] || !groups[id].common || !groups[id].common.dontDelete) {
                    $('#del-group').removeClass('ui-state-disabled');
                }
                $('#edit-group').removeClass('ui-state-disabled');

                var rowData = $gridGroups.jqGrid('getRowData', id);
                rowData.ack = false;
                rowData.from = '';
                $gridGroups.jqGrid('setRowData', id, rowData);
            },
            gridComplete: function () {
                $('#del-group').addClass('ui-state-disabled');
                $('#edit-group').addClass('ui-state-disabled');
                $(".group-users-edit").multiselect({
                    selectedList: 4,
                    close: function () {
                        var obj = {common: {members: $(this).val()}};
                        var id  = $(this).attr('data-id');
                        main.socket.emit('extendObject', id, obj, function (err, obj) {
                            if (err) {
                                // Cannot modify
                                main.showMessage(_('Cannot change group'), '', 'alert');
                            }
                        });
                    },
                    checkAllText:     _('Check all'),
                    uncheckAllText:   _('Uncheck All'),
                    noneSelectedText: _('Select options')
                });
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false,
            afterSearch:   function () {
                //initGroupButtons();
            }
        }).navGrid('#pager-groups', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-groups', {
            caption: '',
            buttonicon: 'ui-icon-trash',
            onClickButton: function () {
                var objSelected = $gridGroups.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                main.confirmMessage(_('Are you sure?'), null, 'help', function (result) {
                    if (result) {
                        main.socket.emit('delGroup', id.replace("system.group.", ""), function (err) {
                            if (err) {
                                main.showMessage(_('Cannot delete group: %s', err), '', 'alert');
                            }
                        });
                    }
                });
            },
            position: 'first',
            id: 'del-group',
            title: _('delete group'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-groups', {
            caption: '',
            buttonicon: 'ui-icon-pencil',
            onClickButton: function () {
                var objSelected = $gridGroups.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-scripts"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                if (objSelected) {
                    var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                    editGroup(id);
                } else {
                    main.showMessage(_('Invalid object %s', objSelected), '', 'alert');
                }
            },
            position: 'first',
            id: 'edit-group',
            title: _('edit group'),
            cursor: 'pointer'
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

        $dialogGroup.dialog({
            autoOpen: false,
            modal:    true,
            width:    430,
            height:   205,
            buttons:  [
                {
                    text: _('Save'),
                    click: saveGroup
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        $dialogGroup.dialog('close');

                    }
                }
            ]
        });
        $('#edit-group-name').keydown(function (event) {
            if (event.which == 13) $('#edit-group-desc').focus();
        });
        $('#edit-group-desc').keydown(function (event) {
            if (event.which == 13) saveGroup();
        });
    }

    function prepareHosts() {
        $gridHosts.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('type'), _('description'), _('platform'), _('os'), _('available'), _('installed')],
            colModel: [
                {name: '_id',       index: '_id',       hidden: true},
                {name: 'name',      index: 'name',      width:  64},
                {name: 'type',      index: 'type',      width:  70},
                {name: 'title',     index: 'title',     width: 180},
                {name: 'platform',  index: 'platform',  hidden: true},
                {name: 'os',        index: 'os',        width: 360},
                {name: 'available', index: 'available', width:  70, align: 'center'},
                {name: 'installed', index: 'installed', width: 160}
            ],
            pager: $('#pager-hosts'),
            width: 964,
            height: 326,
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker hosts'),
            ignoreCase: true,
            gridComplete: function () {

            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false,
            afterSearch:   function () {
                initHostButtons();
            }
        }).navGrid('#pager-hosts', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-hosts', {
            caption:       '',
            buttonicon:    'ui-icon-refresh',
            onClickButton: function () {
                initHosts(true, true, function () {
                    tabs.adapters.init(true, false);
                });
            },
            position:      'first',
            id:            'add-object',
            title:         _('update adapter information'),
            cursor:        'pointer'
        });
    }

    function prepareRepos() {
        $gridRepo.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('link'), ''],
            colModel: [
                {name: '_id',       index: '_id',       hidden: true},
                {name: 'name',      index: 'name',      width: 60,  editable: true},
                {name: 'link',      index: 'link',      width: 300, editable: true},
                {name: 'commands',  index: 'commands',  width: 60,  editable: false, align: 'center'}
            ],
            pager: $('#pager-repos'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            ondblClickRow: function (rowid) {
                var id = rowid.substring('repo_'.length);
                $('.repo-edit-submit').hide();
                $('.repo-delete-submit').hide();
                $('.repo-ok-submit[data-repo-id="' + id + '"]').show();
                $('.repo-cancel-submit[data-repo-id="' + id + '"]').show();
                $gridRepo.jqGrid('editRow', rowid, {"url":"clientArray"});
            },
            viewrecords: false,
            pgbuttons: false,
            pginput: false,
            pgtext: false,
            caption: _('ioBroker repositories'),
            ignoreCase: true
        }).navGrid('#pager-repos', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-repos', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                // Find last id;
                var id = 1;
                var ids = $gridRepo.jqGrid('getDataIDs');
                while (ids.indexOf('repo_' + id) != -1) {
                    id++;
                }
                // Find new unique name
                var found;
                var newText = _("New");
                var idx = 1;
                do {
                    found = true;
                    for (var _id = 0; _id < ids.length; _id++) {
                        var obj = $gridRepo.jqGrid('getRowData', ids[_id]);
                        if (obj && obj.name == newText + idx)  {
                            idx++;
                            found = false;
                            break;
                        }
                    }
                } while (!found);

                $gridRepo.jqGrid('addRowData', 'repo_' + id, {
                    _id:     id,
                    name:    newText + idx,
                    link:    '',
                    commands:
                        '<button data-repo-id="' + id + '" class="repo-edit-submit">'   + _('edit')   + '</button>' +
                        '<button data-repo-id="' + id + '" class="repo-delete-submit">' + _('delete') + '</button>' +
                        '<button data-repo-id="' + id + '" class="repo-ok-submit" style="display:none">' + _('ok') + '</button>' +
                        '<button data-repo-id="' + id + '" class="repo-cancel-submit" style="display:none">' + _('cancel') + '</button>'
                    });

                initRepoButtons();
            },
            position: 'first',
            id:       'add-repo',
            title:    _('add repository'),
            cursor:   'pointer'
        });
    }

    function prepareCerts() {
        $gridCerts.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('certificate'), ''],
            colModel: [
                {name: '_id',         index: '_id',         hidden: true},
                {name: 'name',        index: 'name',        width: 60,  editable: true},
                {name: 'certificate', index: 'certificate', width: 300, editable: true},
                {name: 'commands',    index: 'commands',    width: 60,  editable: false, align: 'center'}
            ],
            pager:     $('#pager-certs'),
            rowNum:    100,
            rowList:   [20, 50, 100],
            sortname:  "id",
            sortorder: "desc",
            ondblClickRow: function (rowid) {
                var id = rowid.substring('cert_'.length);
                $('.cert-edit-submit').hide();
                $('.cert-delete-submit').hide();
                $('.cert-ok-submit[data-cert-id="' + id + '"]').show();
                $('.cert-cancel-submit[data-cert-id="' + id + '"]').show();
                $gridCerts.jqGrid('editRow', rowid, {"url": "clientArray"});
            },
            viewrecords: false,
            pgbuttons: false,
            pginput: false,
            pgtext: false,
            caption: _('ioBroker certificates'),
            ignoreCase: true
        }).navGrid('#pager-certs', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-certs', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                // Find last id;
                var id = 1;
                var ids = $gridCerts.jqGrid('getDataIDs');
                while (ids.indexOf('cert_' + id) != -1) {
                    id++;
                }
                // Find new unique name
                var found;
                var newText = _("New");
                var idx = 1;
                do {
                    found = true;
                    for (var _id = 0; _id < ids.length; _id++) {
                        var obj = $gridCerts.jqGrid('getRowData', ids[_id]);
                        if (obj && obj.name == newText + idx)  {
                            idx++;
                            found = false;
                            break;
                        }
                    }
                } while (!found);

                $gridCerts.jqGrid('addRowData', 'cert_' + id, {
                    _id:         id,
                    name:        newText + idx,
                    certificate: '',
                    commands:
                        '<button data-cert-id="' + id + '" class="cert-edit-submit">'   + _('edit')   + '</button>' +
                        '<button data-cert-id="' + id + '" class="cert-delete-submit">' + _('delete') + '</button>' +
                        '<button data-cert-id="' + id + '" class="cert-ok-submit" style="display:none">' + _('ok') + '</button>' +
                        '<button data-cert-id="' + id + '" class="cert-cancel-submit" style="display:none">' + _('cancel') + '</button>'
                });

                initCertButtons();
            },
            position: 'first',
            id:       'add-cert',
            title:    _('new certificate'),
            cursor:   'pointer'
        });
    }

    // Grids content

    // ----------------------------- Repositories show and Edit ------------------------------------------------
    function initRepoGrid(update) {
        $gridRepo.jqGrid('clearGridData');
        if (systemRepos.native.repositories) {
            var id = 1;
            // list of the repositories
            for (var repo in systemRepos.native.repositories) {

                var obj = systemRepos.native.repositories[repo];

                $gridRepo.jqGrid('addRowData', 'repo_' + id, {
                    _id:     id,
                    name:    repo,
                    link:    (typeof systemRepos.native.repositories[repo] == 'object') ? systemRepos.native.repositories[repo].link : systemRepos.native.repositories[repo],
                    commands:
                        '<button data-repo-id="' + id + '" class="repo-edit-submit">'   + _('edit')   + '</button>' +
                        '<button data-repo-id="' + id + '" class="repo-delete-submit">' + _('delete') + '</button>' +
                        '<button data-repo-id="' + id + '" class="repo-ok-submit" style="display:none">' + _('ok') + '</button>' +
                        '<button data-repo-id="' + id + '" class="repo-cancel-submit" style="display:none">' + _('cancel') + '</button>'
                });
                id++;
            }

            initRepoButtons();
        }


        $gridRepo.trigger('reloadGrid');
    }
    function initRepoButtons() {
        $('.repo-edit-submit').unbind('click').button({
            icons: {primary: 'ui-icon-pencil'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-repo-id');
            $('.repo-edit-submit').hide();
            $('.repo-delete-submit').hide();
            $('.repo-ok-submit[data-repo-id="' + id + '"]').show();
            $('.repo-cancel-submit[data-repo-id="' + id + '"]').show();
            $gridRepo.jqGrid('editRow', 'repo_' + id, {"url":"clientArray"});
        });

        $('.repo-delete-submit').unbind('click').button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-repo-id');
            $gridRepo.jqGrid('delRowData', 'repo_' + id);
            updateRepoListSelect();
        });

        $('.repo-ok-submit').unbind('click').button({
            icons: {primary: 'ui-icon-check'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-repo-id');
            $('.repo-edit-submit').show();
            $('.repo-delete-submit').show();
            $('.repo-ok-submit').hide();
            $('.repo-cancel-submit').hide();
            $gridRepo.jqGrid('saveRow', 'repo_' + id, {"url":"clientArray"});
            updateRepoListSelect();
        });
        $('.repo-cancel-submit').unbind('click').button({
            icons: {primary: 'ui-icon-close'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-repo-id');
            $('.repo-edit-submit').show();
            $('.repo-delete-submit').show();
            $('.repo-ok-submit').hide();
            $('.repo-cancel-submit').hide();
            $gridRepo.jqGrid('restoreRow', 'repo_' + id, false);
        });
    }
    function updateRepoListSelect() {
        var selectedRepo = $('#system_activeRepo').val();
        var isFound = false;
        $('#system_activeRepo').html('');
        var data = $gridRepo.jqGrid('getRowData');
        for (var i = 0; i < data.length; i++) {
            $('#system_activeRepo').append('<option value="' + data[i].name + '">' + data[i].name + '</option>');
            if (selectedRepo == data[i].name) {
                isFound = true;
            }
        }
        if (isFound) $('#system_activeRepo').val(selectedRepo);
    }

    // ----------------------------- Certificates show and Edit ------------------------------------------------
    function initCertsGrid(update) {
        $gridCerts.jqGrid('clearGridData');
        if (systemCerts.native.certificates) {
            var id = 1;
            // list of the repositories
            for (var cert in systemCerts.native.certificates) {

                var obj = systemCerts.native.certificates[cert];

                $gridCerts.jqGrid('addRowData', 'cert_' + id, {
                    _id:         id,
                    name:        cert,
                    certificate: cert2string(systemCerts.native.certificates[cert]),
                    commands:
                        '<button data-cert-id="' + id + '" class="cert-edit-submit">'   + _('edit')   + '</button>' +
                        '<button data-cert-id="' + id + '" class="cert-delete-submit">' + _('delete') + '</button>' +
                        '<button data-cert-id="' + id + '" class="cert-ok-submit"     style="display:none">' + _('ok')     + '</button>' +
                        '<button data-cert-id="' + id + '" class="cert-cancel-submit" style="display:none">' + _('cancel') + '</button>'
                });
                id++;
            }

            initCertButtons();
        }


        $gridCerts.trigger('reloadGrid');
    }
    function initCertButtons() {
        $('.cert-edit-submit').unbind('click').button({
            icons: {primary: 'ui-icon-pencil'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-cert-id');
            $('.cert-edit-submit').hide();
            $('.cert-delete-submit').hide();
            $('.cert-ok-submit[data-cert-id="' + id + '"]').show();
            $('.cert-cancel-submit[data-cert-id="' + id + '"]').show();
            $gridCerts.jqGrid('editRow', 'cert_' + id, {"url": "clientArray"});
        });

        $('.cert-delete-submit').unbind('click').button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-cert-id');
            $gridCerts.jqGrid('delRowData', 'cert_' + id);
            updateCertListSelect();
        });

        $('.cert-ok-submit').unbind('click').button({
            icons: {primary: 'ui-icon-check'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-cert-id');
            $('.cert-edit-submit').show();
            $('.cert-delete-submit').show();
            $('.cert-ok-submit').hide();
            $('.cert-cancel-submit').hide();
            $gridCerts.jqGrid('saveRow', 'cert_' + id, {"url": "clientArray"});
            updateCertListSelect();
        });
        $('.cert-cancel-submit').unbind('click').button({
            icons: {primary: 'ui-icon-close'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-cert-id');
            $('.cert-edit-submit').show();
            $('.cert-delete-submit').show();
            $('.cert-ok-submit').hide();
            $('.cert-cancel-submit').hide();
            $gridCerts.jqGrid('restoreRow', 'cert_' + id, false);
        });
    }
    function updateCertListSelect() {
        // todo
    }

    // ----------------------------- Hosts show and Edit ------------------------------------------------
    function initHostsList(isUpdate) {

        if (!main.objectsLoaded) {
            setTimeout(initHostsList, 250);
            return;
        }

        // fill the host list (select) on adapter tab
        var selHosts = document.getElementById('host-adapters');
        var myOpts   = selHosts.options;
        var $selHosts = $(selHosts);
        if (!isUpdate && $selHosts.data('inited')) return;

        $selHosts.data('inited', true);
        var found;
        var j;
        // first remove non-existing hosts
        for (var i = 0; i < myOpts.length; i++) {
            found = false;
            for (j = 0; j < hosts.length; j++) {
                if (hosts[j] == myOpts[i].value) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                selHosts.remove(i);
            }
        }

        // Change editoptions for gridInstances column host
        tabs.instances.updateHosts(hosts);

        for (i = 0; i < hosts.length; i++) {
            found = false;
            for (j = 0; j < myOpts.length; j++) {
                if (hosts[i].name == myOpts[j].value) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                $selHosts.append('<option value="' + hosts[i].name + '">' + hosts[i].name + '</option>');
            }
        }
        if ($selHosts.val() != main.currentHost) {
            main.currentHost = $selHosts.val();
            tabs.adapters.init(true);
        }
        $selHosts.unbind('change').change(function () {
            if (!main.states['system.host.' + $(this).val() + '.alive'] || !main.states['system.host.' + $(this).val() + '.alive'].val) {
                main.showMessage(_('Host %s is offline', $(this).val()));
                $(this).val(main.currentHost);
                return;
            }

            main.currentHost = $(this).val();

            tabs.adapters.init(true);
        });
    }
    function initHostButtons() {

        $('.host-update-submit').button({icons: {primary: 'ui-icon-refresh'}}).unbind('click').on('click', function () {
            main.cmdExec($(this).attr('data-host-name'), 'upgrade self', function (exitCode) {
                if (!exitCode) initHosts(true);
            });
        });

        $('.host-restart-submit').button({icons: {primary: 'ui-icon-refresh'}, text: false}).css({width: 22, height: 18}).unbind('click').on('click', function () {
            main.waitForRestart = true;
            main.cmdExec($(this).attr('data-host-name'), '_restart');
        });
    }
    function initHosts(update, updateRepo, callback) {

        if (!main.objectsLoaded) {
            setTimeout(initHosts, 250);
            return;
        }

        if (typeof $gridHosts !== 'undefined' && (!$gridHosts[0]._isInited || update)) {
            $('a[href="#tab-hosts"]').removeClass('updateReady');

            $gridHosts.jqGrid('clearGridData');
            $("#load_grid-hosts").show();

            for (var i = 0; i < hosts.length; i++) {
                var obj = main.objects[hosts[i].id];

                $gridHosts.jqGrid('addRowData', 'host_' + hosts[i].id.replace(/ /g, '_'), {
                    _id:       obj._id,
                    name:      obj.common.hostname,
                    type:      obj.common.type,
                    title:     obj.common.title,
                    platform:  obj.common.platform,
                    os:        obj.native.os.platform,
                    available: '',
                    installed: ''
                });
            }
            $gridHosts.trigger('reloadGrid');

            tabs.adapters.getAdaptersInfo(main.currentHost, update, updateRepo, function (repository, installedList) {
                var data  = $gridHosts.jqGrid('getGridParam', 'data');
                var index = $gridHosts.jqGrid('getGridParam', '_index');

                $gridHosts[0]._isInited = true;
                if (!installedList || !installedList.hosts) return;

                for (var id in installedList.hosts) {
                    var obj = main.objects['system.host.' + id];
                    var installed = '';
                    var version = obj.common ? (repository[obj.common.type] ? repository[obj.common.type].version : '') : '';
                    installed = installedList.hosts[id].version;
                    if (installed != installedList.hosts[id].runningVersion) installed += '(' + _('Running: ') + installedList.hosts[id].runningVersion + ')';

                    if (!installed && obj.common && obj.common.installedVersion) installed = obj.common.installedVersion;

                    if (installed && version) {
                        if (!main.upToDate(version, installed)) {
                            installed += ' <button class="host-update-submit" data-host-name="' + obj.common.hostname + '">' + _('update') + '</button>';
                            version = '<span class="updateReady">' + version + '<span>';
                            $('a[href="#tab-hosts"]').addClass('updateReady');
                        }
                    }

                    id = 'system.host.' + id.replace(/ /g, '_');

                    var rowData = data[index['host_' + id]];
                    if (rowData) {
                        rowData.name =      '<table style="width:100%; padding: 0; border: 0; border-spacing: 0; border-color: rgba(0, 0, 0, 0)" cellspacing="0" cellpadding="0"><tr><td style="width:100%">' + obj.common.hostname + '</td><td><button class="host-restart-submit" data-host-name="' + obj.common.hostname + '">' + _('restart') + '</button></td></tr></table>';
                        rowData.available = version;
                        rowData.installed = installed;
                    } else {
                        console.log('Unknown host found: ' + id);
                    }
                }
                $gridHosts.trigger('reloadGrid');

                initHostButtons();
                if (callback) callback();
            });
        }
    }
    
    // ----------------------------- Users show and Edit ------------------------------------------------
    function initUsers(update) {

        if (!main.objectsLoaded) {
            setTimeout(initUsers, 500);
            return;
        }

        if (typeof $gridUsers != 'undefined' && (update || !$gridUsers[0]._isInited)) {
            $gridUsers[0]._isInited = true;
            $gridUsers.jqGrid('clearGridData');
            for (var i = 0; i < users.length; i++) {
                var obj = main.objects[users[i]];
                var select = '<select class="user-groups-edit" multiple="multiple" data-id="' + users[i] + '">';
                for (var j = 0; j < groups.length; j++) {
                    var name = groups[j].substring('system.group.'.length);
                    name = name.substring(0, 1).toUpperCase() + name.substring(1);
                    select += '<option value="' + groups[j] + '"';
                    if (main.objects[groups[j]].common && main.objects[groups[j]].common.members && main.objects[groups[j]].common.members.indexOf(users[i]) != -1) select += ' selected';
                    select += '>' + name + '</option>';
                }

                $gridUsers.jqGrid('addRowData', 'user_' + users[i].replace(/ /g, '_'), {
                    _id:     obj._id,
                    name:    obj.common ? obj.common.name : '',
                    enabled: '<input class="user-enabled-edit" type="checkbox" data-id="' + users[i] + '" ' + (obj.common && obj.common.enabled ? 'checked' : '') + '/>',
                    groups:  select
                });
            }
            $gridUsers.trigger('reloadGrid');
        }
    }
    function editUser(id) {
        if (id) {
            var obj = main.objects[id];
            $dialogUser.dialog('option', 'title', id);
            $('#edit-user-id').val(obj._id);
            $('#edit-user-name').val(obj.common.name);
            $('#edit-user-name').prop('disabled', true);
            $('#edit-user-pass').val('__pass_not_set__');
            $('#edit-user-passconf').val('__pass_not_set__');
            $dialogUser.dialog('open');
        } else {
            $dialogUser.dialog('option', 'title', 'new user');
            $('#edit-user-id').val('');
            $('#edit-user-name').val('');
            $('#edit-user-name').prop('disabled', false);
            $('#edit-user-pass').val('');
            $('#edit-user-passconf').val('');
            $dialogUser.dialog('open');
        }
    }
    function saveUser() {
        var pass = $('#edit-user-pass').val();
        var passconf = $('#edit-user-passconf').val();

        if (pass != passconf) {
            main.showMessage(_('Password and confirmation are not equal!'), '', 'notice');
            return;
        }
        var id = $('#edit-user-id').val();
        var user = $('#edit-user-name').val();

        if (!id) {
            main.socket.emit('addUser', user, pass, function (err) {
                if (err) {
                    main.showMessage(_('Cannot set password: ') + err, '', 'alert');
                } else {
                    $dialogUser.dialog('close');
                    setTimeout(function () {
                        initUsers(true);
                    }, 0);
                }
            });
        } else {
            // If password changed
            if (pass != '__pass_not_set__') {
                main.socket.emit('changePassword', user, pass, function (err) {
                    if (err) {
                        main.showMessage(_('Cannot set password: ') + err, '', 'alert');
                    } else {
                        $dialogUser.dialog('close');
                    }
                });
            }
        }
    }
    function synchronizeUser(userId, userGroups) {
        var obj;
        userGroups = userGroups || [];
        for (var i = 0; i < groups.length; i++) {
            // If user has no group, but group has user => delete user from group
            if (userGroups.indexOf(groups[i]) == -1 &&
                main.objects[groups[i]].common.members && main.objects[groups[i]].common.members.indexOf(userId) != -1) {
                main.objects[groups[i]].common.members.splice(main.objects[groups[i]].common.members.indexOf(userId), 1);
                obj = {common: {members: main.objects[groups[i]].common.members}};
                main.socket.emit('extendObject', groups[i], obj);
            }
            if (userGroups.indexOf(groups[i]) != -1 &&
                (!main.objects[groups[i]].common.members || main.objects[groups[i]].common.members.indexOf(userId) == -1)) {
                main.objects[groups[i]].common.members = main.objects[groups[i]].common.members || [];
                main.objects[groups[i]].common.members.push(userId);
                obj = {common: {members: main.objects[groups[i]].common.members}};
                main.socket.emit('extendObject', groups[i], obj);
            }
        }
    }
    function delUser(id) {
        for (var i = 0; i < groups.length; i++) {
            // If user has no group, but group has user => delete user from group
            if (main.objects[groups[i]].common.members && main.objects[groups[i]].common.members.indexOf(id) != -1) {
                main.objects[groups[i]].common.members.splice(main.objects[groups[i]].common.members.indexOf(id), 1);
                main.socket.emit('extendObject', groups[i], {
                    common: {
                        members: main.objects[groups[i]].common.members
                    }
                });
            }
        }
    }

    // ----------------------------- Groups show and Edit ------------------------------------------------
    function initGroups(update) {

        if (!main.objectsLoaded) {
            setTimeout(initGroups, 500);
            return;
        }

        if (typeof $gridGroups != 'undefined' && (update || !$gridGroups[0]._isInited)) {
            $gridGroups[0]._isInited = true;
            $gridGroups.jqGrid('clearGridData');
            for (var i = 0; i < groups.length; i++) {
                var obj = main.objects[groups[i]];
                var select = '<select class="group-users-edit" multiple="multiple" data-id="' + groups[i] + '">';
                for (var j = 0; j < users.length; j++) {
                    var name = users[j].substring('system.user.'.length);
                    select += '<option value="' + users[j] + '"';
                    if (obj.common && obj.common.members && obj.common.members.indexOf(users[j]) != -1) select += ' selected';
                    select += '>' + name + '</option>';
                }

                $gridGroups.jqGrid('addRowData', 'group_' + groups[i].replace(/ /g, '_'), {
                    _id:         obj._id,
                    name:        obj.common ? obj.common.name : '',
                    description: obj.common ? obj.common.desc : '',
                    users:       select
                });
            }
            $gridGroups.trigger('reloadGrid');
        }
    }
    function editGroup(id) {
        if (id) {
            var obj = main.objects[id];
            $dialogGroup.dialog('option', 'title', id);
            $('#edit-group-id').val(obj._id);
            $('#edit-group-name').val(obj.common.name);
            $('#edit-group-name').prop('disabled', true);
            $('#edit-group-desc').val(obj.common.desc);
            $dialogGroup.dialog('open');
        } else {
            $dialogGroup.dialog('option', 'title', 'new group');
            $('#edit-group-id').val('');
            $('#edit-group-name').val('');
            $('#edit-group-name').prop('disabled', false);
            $('#edit-group-desc').val('');
            $dialogGroup.dialog('open');
        }
    }
    function saveGroup() {
        var id    = $('#edit-group-id').val();
        var group = $('#edit-group-name').val();
        var desc  = $('#edit-group-desc').val();

        if (!id) {
            main.socket.emit('addGroup', group, desc, function (err) {
                if (err) {
                    main.showMessage(_('Cannot create group: ') + err, '', 'alert');
                } else {
                    $dialogGroup.dialog('close');
                    setTimeout(function () {
                        initGroups(true);
                    }, 0);
                }
            });
        } else {
            var obj = {common: {desc: desc}};
            // If description changed
            main.socket.emit('extendObject', id, obj, function (err, res) {
                if (err) {
                    main.showMessage(_('Cannot change group: ') + err, '', 'alert');
                } else {
                    $dialogGroup.dialog('close');
                }
            });
        }
    }

    // ----------------------------- Objects show and Edit ------------------------------------------------
    function getObjects(callback) {
        main.socket.emit('getObjects', function (err, res) {
            setTimeout(function () {
                var obj;
                main.objects = res;
                for (var id in main.objects) {
                    if (id.slice(0, 7) === '_design') continue;

                    obj = main.objects[id];

                    if (obj.type === 'instance') main.instances.push(id);
                    if (obj.type === 'enum')     enums.push(id);
                    if (obj.type === 'script')   tabs.scripts.list.push(id);
                    if (obj.type === 'user')     users.push(id);
                    if (obj.type === 'group')    groups.push(id);
                    if (obj.type === 'adapter')  tabs.adapters.list.push(id);
                    if (obj.type === 'enum')     enums.push(id);
                    if (obj.type === 'host') {
                        var addr = null;
                        // Find first non internal IP and use it as identifier
                        if (obj.native.hardware && obj.native.hardware.networkInterfaces) {
                            for (var eth in obj.native.hardware.networkInterfaces) {
                                for (var num = 0; num < obj.native.hardware.networkInterfaces[eth].length; num++) {
                                    if (!obj.native.hardware.networkInterfaces[eth][num].internal) {
                                        addr = obj.native.hardware.networkInterfaces[eth][num].address;
                                        break;
                                    }
                                }
                                if (addr) break;
                            }
                        }
                        if (addr) hosts.push({name: obj.common.hostname, address: addr, id: obj._id});
                    }

                    if (id.match(/^system\.adapter\.node-red\.[0-9]+$/) && obj && obj.common && obj.common.enabled) {
                        showNodeRed(obj, 0);
                    }
                    //treeInsert(id);
                }
                //benchmark('finished getObjects loop');
                main.objectsLoaded = true;

                // If history enabled
                tabs.objects.checkHistory();

                // Detect if some script engine instance installed
                var engines = tabs.scripts.fillEngines();

                // Disable scripts tab if no one script engine instance found
                if (!engines || !engines.length) $('#tabs').tabs('option', 'disabled', [4]);

                // Show if update available
                initHostsList();

                if (typeof callback === 'function') callback();
            }, 0);
        });
    }
    // Give to node-red some time to start up the WEB server
    function showNodeRed (obj, timeout) {
        setTimeout(function () {
            $("#a-tab-node-red").show();
            if ($('#tabs').tabs('option', 'active') == 5) $("#tab-node-red").show();
            $('#iframe-node-red').height($(window).height() - 55);
            $('#iframe-node-red').attr('src', 'http://' + location.hostname + ':' + obj.native.port);
        }, timeout);
    }
    // ----------------------------- Enum show and Edit ------------------------------------------------
    var tasks = [];
    function enumRename(oldId, newId, newName, callback) {
        if (tasks.length) {
            var task = tasks.shift();
            if (task.name == 'delObject') {
                main.socket.emit(task.name, task.id, function () {
                    setTimeout(enumRename, 0, undefined, undefined, undefined, callback);
                });
            } else {
                main.socket.emit(task.name, task.id, task.obj, function () {
                    setTimeout(enumRename, 0, undefined, undefined, undefined, callback);
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
        if (oldId != newId && main.objects[newId]) {
            main.showMessage(_('Name yet exists!'), '', 'info');
            initEnums(true);
            if (callback) callback();
        } else {
            if (oldId == newId) {
                if (newName !== undefined) {
                    tasks.push({name: 'extendObject', id:  oldId, obj: {common: {name: newName}}});
                    if (callback) callback();
                }
            } else if (main.objects[oldId] && main.objects[oldId].common && main.objects[oldId].common.nondeletable) {
                main.showMessage(_('Change of enum\'s id "%s" is not allowed!', oldId), '', 'notice');
                initEnums(true);
                if (callback) callback();
            } else {
                var leaf = $gridEnums.selectId('getTreeInfo', oldId);
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
            type: "enum"
        });
        return true;
    }
    function enumMembers(id) {
        enumEdit = id;
        $dialogEnumMembers.dialog('option', 'title', id);
        $('#enum-name-edit').val(main.objects[id].common.name);
        var members = main.objects[id].common.members || [];
        $gridEnumMembers.jqGrid('clearGridData');
        // Remove empty entries
        for (var i = members.length - 1; i >= 0; i--) {
            if (!members[i]) {
                members.splice(i, 1);
            }
        }

        for (i = 0; i < members.length; i++) {
            if (main.objects[members[i]]) {
                $gridEnumMembers.jqGrid('addRowData', 'enum_member_' + members[i].replace(/ /g, '_'), {_id: members[i], name: main.objects[members[i]].common.name, type: main.objects[members[i]].type});
            } else if (members[i]) {
                $gridEnumMembers.jqGrid('addRowData', 'enum_member_' + members[i].replace(/ /g, '_'), {
                    _id:  members[i],
                    name: '<span style="color:red; font-weight:bold; font-style:italic;">object missing</span>',
                    type: ''
                });
            }
        }
        $('#del-member').addClass('ui-state-disabled');
        $dialogEnumMembers.dialog('open');
    }

    function initEnums(update, expandId) {
        if (!main.objectsLoaded) {
            setTimeout(initEnums, 250);
            return;
        }

        if (typeof $gridEnums !== 'undefined' && (!$gridEnums[0]._isInited || update)) {
            //var gridEnumsData = [];
            //var i;
            //$gridEnums.jqGrid('clearGridData');
            $gridEnums[0]._isInited = true;

            var x = $(window).width();
            var y = $(window).height();
            if (x < 720) x = 720;
            if (y < 480) y = 480;

            $gridEnums.height(y - 100).width(x - 20);

            $gridEnums.selectId('init', {
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
                            main.delObject($gridEnums, id);
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
                    if (pos != -1) {
                        var original = id.substring(0, pos);
                        // rename all children
                        enumRename(id, original + '.' + newValues.id.replace(/ /g, '_').toLowerCase(), newValues.name);
                    }
                },
                editStart: function (id, inputs) {
                    var pos = id.lastIndexOf('.');
                    if (pos != -1) inputs.id.val(id.substring(pos + 1));
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
    }

    // ----------------------------- States show and Edit ------------------------------------------------

    function getStates(callback) {
        tabs.states.clear();
        main.socket.emit('getStates', function (err, res) {
            main.states = res;
            if (typeof callback === 'function') {
                setTimeout(function () {
                    callback();
                }, 0);
            }
        });
    }

    // ----------------------------- Show events ------------------------------------------------
    function addEventMessage(id, state, rowData, obj) {
        var typeFilter = $('#event-filter-type').val();
        var fromFilter = $('#event-filter-from').val();
        var type = rowData ? 'stateChange' : 'message';
        var value;
        var ack;
        var from = '';
        var tc;
        var lc;

        if (obj) {
            type = 'objectChange';
            value = JSON.stringify(obj, '\x0A', 2);
            if (value !== undefined && value.length > 30) value = '<span title="' + value.replace(/"/g, '\'') + '">' + value.substring(0, 30) + '...</span>';
            ack = '';
            tc = main.formatDate(new Date());
            lc = '';
        }

        if (eventTypes.indexOf(type) == -1) {
            eventTypes.push(type);
            eventTypes.sort();
            if (eventTypes.length > 1) {
                $('#event-filter-type').html('<option value="">' + _('all') + '</option>');
                for (var i = 0; i < eventTypes.length; i++) {
                    $('#event-filter-type').append('<option value="' + eventTypes[i] + '" ' + ((eventTypes[i] == typeFilter) ? 'selected' : '') + '>' + eventTypes[i] + '</option>');
                }
            }
        }
        if (eventsLinesCount >= 500) {
            eventsLinesStart++;
            var e = document.getElementById('event_' + eventsLinesStart);
            if (e) e.outerHTML = '';
        } else {
            eventsLinesCount++;
        }

        if (state) {
            state.from = state.from || '';
            state.from = state.from.replace('system.adapter.', '');
            state.from = state.from.replace('system.', '');

            if (eventFroms.indexOf(state.from) == -1) {
                eventFroms.push(state.from);
                eventFroms.sort();
                $('#event-filter-from').html('<option value="">' + _('all') + '</option>');
                for (var i = 0; i < eventFroms.length; i++) {
                    var e = eventFroms[i].replace('.', '-')
                    $('#event-filter-from').append('<option value="' + e + '" ' + ((e == fromFilter) ? 'selected' : '') + '>' + eventFroms[i] + '</option>');
                }
            }
            from = state.from;

            if (!rowData) {
                value = (state ? state.command : 'deleted');
                ack = (state ? (state.callback ? state.callback.ack : '') : 'deleted');
                tc = main.formatDate(new Date());
                lc = '';
            } else {
                value = state ? JSON.stringify(state.val) : 'deleted';
                if (value !== undefined && value.length > 30) value = '<div title="' + value.replace(/"/g, '') + '">' + value.substring(0, 30) + '...</div>';
                ack = (state ? state.ack : 'del');
                tc = rowData ? rowData.ts : '';
                lc = rowData ? rowData.lc : '';
            }
        }

        var visible = true;
        var filterType = $('#event-filter-type').val();
        var filterId   = $('#event-filter-id').val().toLocaleLowerCase();
        var filterVal  = $('#event-filter-val').val();
        var filterAck  = $('#event-filter-ack').val();
        var filterFrom = $('#event-filter-from').val();
        if (filterAck === 'true')  filterAck = true;
        if (filterAck === 'false') filterAck = false;

        if (filterType && filterType != type) {
            visible = false;
        } else if (filterId && id.toLocaleLowerCase().indexOf(filterId) == -1) {
            visible = false;
        } else if (filterVal !== '' && value.indexOf(filterVal) == -1) {
            visible = false;
        } else if (filterAck !== '' && filterAck != ack) {
            visible = false;
        } else if (filterFrom && filterFrom != from) {
            visible = false;
        }

        var text = '<tr id="event_' + (eventsLinesStart + eventsLinesCount) + '" class="event-line event-type-' + type + ' event-from-' + from.replace('.', '-') + ' event-ack-' + ack + '" style="' + (visible ? '' : 'display:none') + '">';
        text += '<td class="event-column-1">' + type  + '</td>';
        text += '<td class="event-column-2 event-column-id">' + id    + '</td>';
        text += '<td class="event-column-3 event-column-value">' + value + '</td>';
        text += '<td class="event-column-4">' + ack   + '</td>';
        text += '<td class="event-column-5">' + from  + '</td>';
        text += '<td class="event-column-6">' + tc    + '</td>';
        text += '<td class="event-column-7">' + lc    + '</td>';
        text += '</tr>';

        $('#event-table').prepend(text);
    }

    function filterEvents() {
        if (eventFilterTimeout) {
            clearTimeout(eventFilterTimeout);
            eventFilterTimeout = null;
        }
        var filterType = $('#event-filter-type').val();
        var filterId   = $('#event-filter-id').val().toLocaleLowerCase();
        var filterVal  = $('#event-filter-val').val();
        var filterAck  = $('#event-filter-ack').val();
        var filterFrom = $('#event-filter-from').val();
        if (filterAck === 'true')  filterAck = true;
        if (filterAck === 'false') filterAck = false;

        $('.event-line').each(function (index) {
            var isShow = true;
            var $this = $(this);
            if (filterType && !$this.hasClass('event-type-' + filterType)) {
                isShow = false;
            } else
            if (filterFrom && !$this.hasClass('event-from-' + filterFrom)) {
                isShow = false;
            } else
            if (filterAck !== '' && !$this.hasClass('event-ack-' + filterAck)) {
                isShow = false;
            } else
            if (filterId && $(this).find('td.event-column-id').text().toLocaleLowerCase().indexOf(filterId) == -1) {
                isShow = false;
            } else
            if (filterVal !== '' && $(this).find('td.event-column-value').text().indexOf(filterVal) == -1) {
                isShow = false;
            }

            if (isShow) {
                $this.show();
            } else {
                $this.hide();
            }
        });
    }


    // ---------------------------- Socket.io methods ---------------------------------------------
    main.socket.on('log', function (message) {
        //message = {message: msg, severity: level, from: this.namespace, ts: (new Date()).getTime()}
        tabs.logs.add(message);
    });
    main.socket.on('error', function (error) {
        //message = {message: msg, severity: level, from: this.namespace, ts: (new Date()).getTime()}
        //addMessageLog({message: msg, severity: level, from: this.namespace, ts: (new Date()).getTime()});
        console.log(error);
    });

    function stateChange(id, state) {
        var rowData;
        id = id ? id.replace(/ /g, '_') : '';

        if (id && id.match(/\.messagebox$/)) {
            addEventMessage(id, state);
        } else {
            tabs.states.stateChange(id, state);
            tabs.objects.stateChange(id, state);

            if (main.selectId) main.selectId.selectId('state', id, state);
        }

        // Update alive and connecetd of main.instances
        tabs.instances.stateChange(id, state);
        tabs.objects.stateChangeHistory(id, state);
    }

    main.socket.on('stateChange', function (id, obj) {
        setTimeout(stateChange, 0, id, obj);
    });

    function objectChange(id, obj) {
        var changed = false;
        var i;
        var j;
        var oldObj = null;
        var isNew = false;
        var isUpdate = false;

        // update main.objects cache
        if (obj) {
            if (obj._rev && main.objects[id]) main.objects[id]._rev = obj._rev;
            if (!main.objects[id]) {
                isNew = true;
                //treeInsert(id);
            }
            if (isNew || JSON.stringify(main.objects[id]) != JSON.stringify(obj)) {
                main.objects[id] = obj;
                changed = true;
            }
        } else if (main.objects[id]) {
            changed = true;
            oldObj = {_id: id, type: main.objects[id].type};
            delete main.objects[id];
        }

        // update to event table
        addEventMessage(id, null, null, obj);

        tabs.objects.objectChange(id, obj);
        if (main.selectId) main.selectId.selectId('object', id, obj);
        if ($gridEnums)    $gridEnums.selectId('object', id, obj);

        // If system config updated
        if (id == 'system.config') {
            // Check language
            if (main.systemConfig.common.language != obj.common.language) {
                window.location.reload();
            }

            main.systemConfig = obj;
        }

        // Update Instance Table
        if (id.match(/^system\.adapter\.[-\w]+\.[0-9]+$/)) {
            if (obj) {
                if (main.instances.indexOf(id) == -1) main.instances.push(id);
            } else {
                i = main.instances.indexOf(id);
                if (i != -1) main.instances.splice(i, 1);
            }
            if (id.match(/^system\.adapter\.history\.[0-9]+$/)) {
                // Update all states if history enabled or disabled
                tabs.objects.reinit();
            }

            if (id.match(/^system\.adapter\.node-red\.[0-9]+$/)) {
                if (obj && obj.common && obj.common.enabled) {
                    showNodeRed(obj, 7000);
                } else {
                    $("#a-tab-node-red").hide();
                    $("#tab-node-red").hide();
                }
            }

            // Disable scripts tab if no one script engine instance found
            var engines = tabs.scripts.fillEngines();
            $('#tabs').tabs('option', 'disabled', (engines && engines.length) ? [] : [4]);

            tabs.instances.objectChange(id, obj);
        }

        // Update Adapter Table
        /*if (id.match(/^system\.adapter\.[a-zA-Z0-9-_]+$/)) {
         if (obj) {
         if (tabs.adapters.list.indexOf(id) == -1) tabs.adapters.list.push(id);
         } else {
         var j = tabs.adapters.list.indexOf(id);
         if (j != -1) {
         tabs.adapters.list.splice(j, 1);
         }
         }
         if (typeof $gridAdapter != 'undefined' && $gridAdapter[0]._isInited) {
         tabs.adapters.init(true);
         }
         }*/
        // Update users
        if (id.match(/^system\.user\./)) {
            if (obj) {
                if (users.indexOf(id) == -1) users.push(id);
            } else {
                var k = users.indexOf(id);
                if (k != -1) users.splice(k, 1);
            }
            if (updateTimers.initUsersGroups) {
                clearTimeout(updateTimers.initUsersGroups);
            }
            updateTimers.initUsersGroups = setTimeout(function () {
                updateTimers.initUsersGroups = null;
                initUsers(true);
                initGroups(true);
            }, 200);
        }

        // Update hosts
        if (id.match(/^system\.host\.[-\w]+$/)) {
            var found = false;
            for (i = 0; i < hosts.length; i++) {
                if (hosts[i].id == id) {
                    found = true;
                    break;
                }
            }

            if (obj) {
                if (!found) hosts.push({id: id, address: obj.common.address ? obj.common.address[0]: '', name: obj.common.name});
            } else {
                if (found) hosts.splice(i, 1);
            }
            if (updateTimers.initHosts) {
                clearTimeout(updateTimers.initHosts);
            }
            updateTimers.initHosts = setTimeout(function () {
                updateTimers.initHosts = null;
                initHosts(true);
                initHostsList(true);
            }, 200);
        }

        // Update scripts
        if (id.match(/^script\./)) {
            if (obj) {
                if (tabs.scripts.list.indexOf(id) == -1) tabs.scripts.list.push(id);
            } else {
                j = tabs.scripts.list.indexOf(id);
                if (j != -1) tabs.scripts.list.splice(j, 1);
            }

            if (updateTimers.initScripts) {
                clearTimeout(updateTimers.initScripts);
            }
            updateTimers.initScripts = setTimeout(function () {
                updateTimers.initScripts = null;
                tabs.scripts.init(true);
            }, 200);
        }

        // Update groups
        if (id.match(/^system\.group\./)) {
            if (obj) {
                if (groups.indexOf(id) == -1) groups.push(id);
            } else {
                j = groups.indexOf(id);
                if (j != -1) groups.splice(j, 1);
            }

            if (updateTimers.initUsersGroups) {
                clearTimeout(updateTimers.initUsersGroups);
            }
            updateTimers.initUsersGroups = setTimeout(function () {
                updateTimers.initUsersGroups = null;
                initGroups(true);
                initUsers(true);
            }, 200);
        }

        //Update enums
        if (id.match(/^enum\./)) {
            if (obj) {
                if (enums.indexOf(id) == -1) enums.push(id);
            } else {
                j = enums.indexOf(id);
                if (j != -1) enums.splice(j, 1);
            }

            if (updateTimers.initEnums) {
                clearTimeout(updateTimers.initEnums);
            }
            updateTimers.initEnums = setTimeout(function () {
                updateTimers.initEnums = null;
                initEnums(true);
            }, 200);
        }
    }

    main.socket.on('objectChange', function (id, obj) {
        setTimeout(objectChange, 0, id, obj);
    });
    main.socket.on('cmdStdout', function (_id, text) {
        if (activeCmdId == _id) {
            stdout += '\n' + text;
            $stdout.val(stdout);
            $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
        }
    });
    main.socket.on('cmdStderr', function (_id, text) {
        if (activeCmdId == _id) {
            stdout += '\nERROR: ' + text;
            $stdout.val(stdout);
            $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
        }
    });
    main.socket.on('cmdExit', function (_id, exitCode) {
        if (activeCmdId == _id) {
            exitCode = parseInt(exitCode, 10);
            stdout += '\n' + (exitCode !== 0 ? 'ERROR: ' : '') + 'process exited with code ' + exitCode;
            $stdout.val(stdout);
            $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
            if (!exitCode) {
                setTimeout(function () {
                    $dialogCommand.dialog('close');
                }, 1500);
            }
            if (cmdCallback) {
                cmdCallback(exitCode);
                cmdCallback = null;
            }
        }
    });
    main.socket.on('connect', function () {
        $('#connecting').hide();
        if (firstConnect) {
            firstConnect = false;

            main.socket.emit('authEnabled', function (auth) {
                if (!auth) $('#button-logout').remove();
            });

            // Read system configuration
            main.socket.emit('getObject', 'system.config', function (err, data) {
                main.systemConfig = data;
                main.socket.emit('getObject', 'system.repositories', function (err, repo) {
                    systemRepos = repo;
                    main.socket.emit('getObject', 'system.certificates', function (err, certs) {
                        setTimeout(function () {
                            systemCerts = certs;
                            if (!err && main.systemConfig && main.systemConfig.common) {
                                systemLang = main.systemConfig.common.language || systemLang;
                                if (!main.systemConfig.common.licenseConfirmed) {
                                    // Show license agreement
                                    var language = main.systemConfig.common.language || window.navigator.userLanguage || window.navigator.language;
                                    if (language != 'en' && language != 'de' && language != 'ru') language = 'en';

                                    $('#license_text').html(license[language] || license.en);
                                    $('#license_language').val(language).show();
                                    $('#license_checkbox').show();
                                    $('#license_checkbox').html(translateWord('license_checkbox', language));
                                    $('#license_agree .ui-button-text').html(translateWord('agree', language));
                                    $('#license_non_agree .ui-button-text').html(translateWord('not agree', language));

                                    $('#license_language').change(function () {
                                        language = $(this).val();
                                        $('#license_text').html(license[language] || license.en);
                                        $('#license_checkbox').html(translateWord('license_checkbox', language));
                                        $('#license_agree .ui-button-text').html(translateWord('agree', language));
                                        $('#license_non_agree .ui-button-text').html(translateWord('not agree', language));
                                    });
                                    $('#license_diag').change(function () {
                                        if ($(this).prop('checked')) {
                                            $('#license_agree').button('enable');
                                        } else {
                                            $('#license_agree').button('disable');
                                        }
                                    });
                                    $dialogLicense.css({'z-index': 200});
                                    $dialogLicense.dialog({
                                        autoOpen: true,
                                        modal: true,
                                        width: 600,
                                        height: 400,
                                        buttons: [
                                            {
                                                text: _('agree'),
                                                click: function () {
                                                    main.socket.emit('extendObject', 'system.config', {
                                                        common: {
                                                            licenseConfirmed: true,
                                                            language: language
                                                        }
                                                    }, function () {
                                                        $dialogLicense.dialog('close');
                                                        $('#license_language').hide();
                                                    });
                                                },
                                                id: 'license_agree'
                                            },
                                            {
                                                text: _('not agree'),
                                                click: function () {
                                                    location.reload();
                                                },
                                                id: 'license_non_agree'
                                            }
                                        ],
                                        close: function () {

                                        },
                                        open: function () {
                                            $('#license_agree').button('disable');
                                        }
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
                                }
                            } else {
                                main.systemConfig = {
                                    type: 'config',
                                    common: {
                                        name:             'system.config',
                                        language:         '',           // Default language for adapters. Adapters can use different values.
                                        tempUnit:         '°C',         // Default temperature units.
                                        currency:         '€',          // Default currency sign.
                                        dateFormat:       'DD.MM.YYYY', // Default date format.
                                        isFloatComma:     true,         // Default float divider ('.' - false, ',' - true)
                                        licenseConfirmed: false         // If license agreement confirmed
                                    }
                                };
                                main.systemConfig.common.language = window.navigator.userLanguage || window.navigator.language;

                                if (main.systemConfig.common.language !== 'en' && main.systemConfig.common.language !== 'de' && main.systemConfig.common.language !== 'ru') {
                                    main.systemConfig.common.language = 'en';
                                }
                            }

                            translateAll();

                            // Here we go!
                            $('#tabs').show();
                            initAllDialogs();
                            prepareEnumMembers();
                            prepareHosts();
                            tabs.objects.prepare();
                            tabs.states.prepare();
                            tabs.adapters.prepare();
                            tabs.instances.prepare();
                            prepareUsers();
                            prepareGroups();
                            tabs.scripts.prepare();
                            tabs.objects.prepareHistory();
                            prepareRepos();
                            prepareCerts();
                            resizeGrids();

                            $("#load_grid-hosts").show();
                            $("#load_grid-enums").show();
                            $("#load_grid-users").show();
                            $("#load_grid-groups").show();

                            // bind "clear events" button
                            $('#event-clear').button({
                                icons: {
                                    primary: 'ui-icon-trash'
                                }
                            }).unbind('click').click(function () {
                                eventsLinesCount = 0;
                                eventsLinesStart = 0;
                                $('#event-table').html('');
                            });

                            getStates(getObjects);
                        }, 0);
                    });
                });
            });
        }
        if (main.waitForRestart) {
            location.reload();
        }
    });
    main.socket.on('disconnect', function () {
        $('#connecting').show();
    });
    main.socket.on('reconnect', function () {
        $('#connecting').hide();
        if (main.waitForRestart) {
            location.reload();
        }
    });

    function resizeGrids() {
        var x = $(window).width();
        var y = $(window).height();
        if (x < 720) {
            x = 720;
        }
        if (y < 480) {
            y = 480;
        }
        $('#grid-events-inner').css('height', (y - 130) + 'px');
        tabs.states.resize(x, y);
        $gridEnums.setGridHeight(y - 150).setGridWidth(x - 20);
        tabs.adapters.resize(x, y);
        tabs.instances.resize(x, y);
        tabs.objects.resize(x, y);
        tabs.scripts.resize(x, y);
        $gridUsers.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridGroups.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridHosts.setGridHeight(y - 150).setGridWidth(x - 20);
        $('.subgrid-level-1').setGridWidth(x - 67);
        $('.subgrid-level-2').setGridWidth(x - 94);
        $('.subgrid-level-3').setGridWidth(x - 121);
        $('.subgrid-level-4').setGridWidth(x - 148);
        $('#iframe-node-red').height(y - 55);
    }
    function navigation() {
        if (window.location.hash) {
            var tab = 'tab-' + window.location.hash.slice(1);
            var index = $('#tabs a[href="#' + tab + '"]').parent().index() - 1;
            $('#tabs').tabs('option', 'active', index);
            if (tab == 'tab-hosts') initHosts();
        } else {
            initHosts();
        }
    }

    $(window).resize(resizeGrids);

});
})(jQuery);

var benchTime = (new Date()).getTime();

function benchmark(text) {
    var ts = (new Date()).getTime();
    console.log('-- execution time: ' + (ts - benchTime) + 'ms');
    benchTime = ts;
    console.log('-- ' + text);
}

