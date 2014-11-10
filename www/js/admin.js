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

var $iframeDialog = null;

(function ($) {
$(document).ready(function () {

    // Todo put this in adapter instance config
    var historyMaxAge =         86400; // Maxmimum datapoint age to be shown in gridHistory (seconds)

    var toplevel  =             [];
    var instances =             [];
    var enums =                 [];
    var scripts =               [];
    var users =                 [];
    var groups =                [];
    var adapters =              [];
    var children =              {};
    var objects =               {};
    var updateTimers =          {};
    var hosts =                 [];
    var states =                {};
    var enumExpanded =          [];
    var enumCurrentParent =     '';

    var systemConfig;
    var systemRepos;
    var systemCerts;

    var cmdCallback =           null;
    var stdout;
    var activeCmdId =           null;

    var logLinesCount =         0;
    var logLinesStart =         0;
    var logHosts =              [];
    var logFilterTimeout =      null;

    var $stdout =               $('#stdout');
    var $configFrame =          $('#config-iframe');

    var $dialogCommand =        $('#dialog-command');
    var $dialogEnumMembers =    $('#dialog-enum-members');
    var $dialogEnum =           $('#dialog-enum');
    var $dialogSelectMember =   $('#dialog-select-member');
    var $dialogConfig =         $('#dialog-config');
    var $dialogScript =         $('#dialog-script');
    var $dialogObject =         $('#dialog-object');
    var $dialogUser =           $('#dialog-user');
    var $dialogGroup =          $('#dialog-group');
    var $dialogLicense =        $('#dialog-license');
    var $dialogHistory =        $('#dialog-history');
    var $dialogSystem =         $('#dialog-system');

    var $gridUsers =            $('#grid-users');
    var $gridGroups =           $('#grid-groups');
    var $gridEnums =            $('#grid-enums');
    var $gridEnumMembers =      $('#grid-enum-members');
    var $gridSelectMember =     $('#grid-select-member');
    var $gridObjects =          $('#grid-objects');
    var $gridStates =           $('#grid-states');
    var $gridAdapter =          $('#grid-adapters');
    var $gridInstance =         $('#grid-instances');
    var $gridScripts =          $('#grid-scripts');
    var $gridHosts =            $('#grid-hosts');
    var $gridHistory =          $('#grid-history');
    var $gridRepo =             $('#grid-repos');
    var $gridCerts =            $('#grid-certs');

    var socket =                io.connect();
    var firstConnect =          true;
    var objectsLoaded =         false;

    var enumEdit =              null;
    var currentHost =           '';
    var curRepository =         null;
    var curInstalled =          null;
    var currentHistory =        null; // Id of the currently shown history dialog

    // TODO hide tab scripts and don't initialize ace if no instance of adapter javascript enabled
    var editor = ace.edit("script-editor");
    //editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");
    editor.resize();

    // jQuery UI initializations
    $('#tabs').tabs({
        activate: function (event, ui) {
            window.location.hash = '#' + ui.newPanel.selector.slice(5);
            switch (ui.newPanel.selector) {
                case '#tab-objects':
                    break;

                case '#tab-hosts':
                    initHosts();
                    break;

                case '#tab-states':
                    break;

                case '#tab-scripts':
                    initScripts();
                    break;

                case '#tab-adapters':
                    initHostsList();
                    break;

                case '#tab-instances':
                    initInstances();
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

                $('#diagMode').val(systemConfig.common.diag).change(function () {
                    socket.emit('sendToHost', currentHost, 'getDiagData', $(this).val(), function (obj) {
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
                            $this.prop('checked', systemConfig.common[id]);
                        } else {
                            if (id == 'isFloatComma') {
                                $this.val(systemConfig.common[id] ? "true" : "false");
                            } else {
                                $this.val(systemConfig.common[id]);
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
            alert(_('Invalid certificate "%s". To short.', name));
            return '';
        }
        var lines = [];
        if (str.substring(0, '-----BEGIN RSA PRIVATE KEY-----'.length) == '-----BEGIN RSA PRIVATE KEY-----') {
            if (str.substring(str.length -  '-----END RSA PRIVATE KEY-----'.length) != '-----END RSA PRIVATE KEY-----') {
                alert(_('Certificate "%s" must end with "-----END RSA PRIVATE KEY-----".', name));
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
                alert(_('Certificate "%s" must start with "-----BEGIN CERTIFICATE-----".', name));
                return '';
            }
            if (str.substring(str.length -  '-----END CERTIFICATE-----'.length) != '-----END CERTIFICATE-----') {
                alert(_('Certificate "%s" must end with "-----END CERTIFICATE-----".', name));
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

    $dialogSystem.dialog({
        autoOpen:   false,
        modal:      true,
        width:      800,
        height:     480,
        buttons: [
            {
                text: _('Save'),
                click: function () {
                    var common = systemConfig.common;
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

                    socket.emit('extendObject', 'system.config', {common: common}, function (err) {
                        if (!err) {
                            if (languageChanged) {
                                window.location.reload();
                            } else {
                                if (activeRepoChanged) initAdapters(true);
                            }
                        }

                        socket.emit('extendObject', 'system.repositories', systemRepos, function (err) {
                            if (activeRepoChanged) initAdapters(true);

                            socket.emit('extendObject', 'system.certificates', systemCerts, function (err) {
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
            $gridRepo.setGridHeight($(this).height() - 150).setGridWidth($(this).width() - 40);
            $gridCerts.setGridHeight($(this).height() - 150).setGridWidth($(this).width() - 40);
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
                        alert(_('Invalid name!'));
                        return;
                    }
                    if (objects[(enumCurrentParent || 'enum') + '.' + name]) {
                        alert(_('Name yet exists!'));
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
        }
    });

    $dialogConfig.dialog({
        autoOpen:   false,
        modal:      true,
        width:      830, //$(window).width() > 920 ? 920: $(window).width(),
        height:     536, //$(window).height() - 100, // 480
        closeOnEscape: false,
        open: function (event, ui) {
            $('#dialog-config').css('padding', '2px 0px');
        },
        beforeClose: function () {
            if (window.frames['config-iframe'].changed) {
                return confirm(_('Are you sure? Changes are not saved.'));
            }
            return true;
        },
        close: function () {
            // Clear iframe
            $configFrame.attr('src', '');
        }
    });

    $dialogHistory.dialog({
        autoOpen:      false,
        modal:         true,
        width:         830,
        height:        575,
        closeOnEscape: false,
        buttons: [
            {
                text: 'Save',
                click: function () {
                    var id =            $('#edit-history-id').val();
                    var enabled =       $('#edit-history-enabled').is(':checked');
                    var changesOnly =   $('#edit-history-changesOnly').is(':checked');
                    var minLength =     parseInt($('#edit-history-minLength').val(), 10) || 480;
                    var retention =     parseInt($('#edit-history-retention').val(), 10) || 0;

                    objects[id].common.history = {
                        enabled:     enabled,
                        changesOnly: changesOnly,
                        minLength:   minLength,
                        maxLength:   minLength * 2,
                        retention:   retention
                    };

                    currentHistory =    null;

                    socket.emit('setObject', id, objects[id], function () {
                        $dialogHistory.dialog('close');
                    });

                }
            },
            {
                text: 'Cancel',
                click: function () {
                    $dialogHistory.dialog('close');
                }
            }
        ],
        open: function (event, ui) {

        },
        close: function () {

        }
    });

    $('#enum-name').keyup(function () {
        $('#enum-gen-id').html('enum.' + $(this).val().replace(/ /, '_').toLowerCase());
    });

    function filterLog() {
        if (logFilterTimeout) {
            clearTimeout(logFilterTimeout);
            logFilterTimeout = null;
        }
        var filterSev  = $('#log-filter-severity').val();
        var filterHost = $('#log-filter-host').val();
        var filterMsg  = $('#log-filter-message').val();
        if (filterSev == 'error') {
            $('.log-severity-debug').hide();
            $('.log-severity-info').hide();
            $('.log-severity-warn').hide();
            $('.log-severity-error').show();
        } else
        if (filterSev == 'warn') {
            $('.log-severity-debug').hide();
            $('.log-severity-info').hide();
            $('.log-severity-warn').show();
            $('.log-severity-error').show();
        }else
        if (filterSev == 'info') {
            $('.log-severity-debug').hide();
            $('.log-severity-info').show();
            $('.log-severity-warn').show();
            $('.log-severity-error').show();
        } else {
            $('.log-severity-debug').show();
            $('.log-severity-info').show();
            $('.log-severity-warn').show();
            $('.log-severity-error').show();
        }
        if (filterHost || filterMsg) {
            $('.log-line').each(function (index) {
                if (filterHost && !$(this).hasClass('log-from-' + filterHost)) $(this).hide();
                if (filterMsg && $(this).html().indexOf(filterMsg) == -1)$(this).hide();
            });
        }
    }

    $('#log-filter-severity').change(filterLog);
    $('#log-filter-host').change(filterLog);
    $('#log-filter-message').change(function () {
        if (logFilterTimeout) clearTimeout(logFilterTimeout);
        logFilterTimeout = setTimeout(filterLog, 1000);
    }).keyup(function (e){
        if (e.which == 13) {
            filterLog();
        } else {
            $(this).trigger('change');
        }
    });

    $('#log-clear').button({icons:{primary: 'ui-icon-trash'}, text: false}).click(function () {
        $('#log-table').html('');
        logLinesCount = 0;
        logLinesStart = 0;
        $('a[href="#tab-log"]').removeClass('errorLog');
    }).css({width: 20, height: 20});
    $('#log-copy-text').click(function () {
        $('#log-copy-text').hide().html('');
        $('#tabs').show();
    });
    $('#log-copy').button({icons:{primary: 'ui-icon-copy'}, text: false}).click(function () {
        var text = '<span style="color: red">' + _('copy note') + '</span>';
        $('#tabs').hide();
        $('#log-copy-text').show().html(text + '<br><table style="width: 100%; font-size:12px" id="log-copy-table">' + $('#log-table').html() + '</table>');
        var lines = $('#log-copy-table .log-column-4');
        for (var t = 0; t < lines.length; t++) {
            var q = $(lines[t]);
            q.html(q.attr('title'));
            q.attr('title', '');
        }
    }).css({width: 20, height: 20});

    // detect type of state
    function getType(val) {
        if (val === true || val === 'true' || val === false || val === 'false') return 'bool';
        if (parseFloat(val).toString() == val) return 'number';
        return typeof val;
    }

    // Grids and Dialog inits
    function prepareHistory() {
        $gridHistory.jqGrid({
            datatype: 'local',
            colNames: [_('val'), _('ack'), _('from'), _('ts'), _('lc')],
            colModel: [
                {name: 'val',  index: 'val',  width: 160, editable: true},
                {name: 'ack',  index: 'ack',  width: 60,  fixed: false},
                {name: 'from', index: 'from', width: 80,  fixed: false},
                {name: 'ts',   index: 'ts',   width: 140, fixed: false},
                {name: 'lc',   index: 'lc',   width: 140, fixed: false}
            ],
            width: 800,
            height: 330,
            pager: $('#pager-history'),
            rowNum: 100,
            rowList: [15, 100, 1000],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('history data'),
            ignoreCase: true

        });

        $(document).on('click', '.history', function () {
            var id = $(this).attr('data-id');
            $('#edit-history-id').val(id);
            if (!objects[id]) {
                var p = id.split('.');
                p.splice(2);
                objects[id] = {
                    type: 'state',
                    parent: p.join('.'),
                    common: {
                        // TODO define role somehow
                        type: states[id] ? getType(states[id].val) : 'mixed',
                        name: id
                    }
                };
            }

            if (!objects[id].common.history) {
                objects[id].common.history = {
                    enabled:        false,
                    changesOnly:    false,
                    // use default value from history-adadpter config
                    minLength:      (objects['system.adapter.history.0'] && objects['system.adapter.history.0'].native) ? objects['system.adapter.history.0'].native.minLength || 480 : 480,
                    retention:      ''
                };
            }
            currentHistory = objects[id].common.history.enabled ? id: null;

            $('#edit-history-enabled').prop('checked', objects[id].common.history.enabled);
            $('#edit-history-changesOnly').prop('checked', objects[id].common.history.changesOnly);

            $('#edit-history-minLength').val(objects[id].common.history.minLength);
            $('#edit-history-retention').val(objects[id].common.history.retention);
            $dialogHistory.dialog('option', 'title', 'history ' + id);
            $dialogHistory.dialog('open');
            $gridHistory.jqGrid('clearGridData');
            $("#load_grid-history").show();
            var start = Math.round((new Date()).getTime() / 1000) - historyMaxAge;
            var end =   Math.round((new Date()).getTime() / 1000) + 5000;
            //console.log('getStateHistory', id, start, end)
            socket.emit('getStateHistory', id, start, end, function (err, res) {
                if (!err) {
                    var rows = [];
                    //console.log('got ' + res.length + ' history datapoints for ' + id);
                    for (var i = 0; i < res.length; i++) {
                        rows.push({
                            gid: i,
                            id:  res[i].id,
                            ack: res[i].ack,
                            val: res[i].val,
                            ts:  formatDate(new Date(res[i].ts * 1000)),
                            lc:  formatDate(new Date(res[i].lc * 1000))
                        });
                    }
                    $gridHistory[0]._maxGid = res.length;
                    $gridHistory.jqGrid('addRowData', 'gid', rows);
                    $gridHistory.trigger('reloadGrid');
                } else {
                    console.log(err);
                }
            });


        });

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
            search: false,
            edit: false,
            add: false,
            del: false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-enum-members', {
            caption: '',
            buttonicon: 'ui-icon-trash',
            onClickButton: function () {
                var memberSelected = $gridEnumMembers.jqGrid('getGridParam', 'selrow');
                var id = $('tr[id="' + memberSelected + '"]').find('td[aria-describedby$="_id"]').html();
                var obj = objects[enumEdit];
                var idx = obj.common.members.indexOf(id);
                if (idx !== -1) {
                    obj.common.members.splice(idx, 1);
                }
                objects[enumEdit] = obj;
                socket.emit('setObject', enumEdit, obj, function () {
                    enumMembers(enumEdit);
                    // TODO update member count in subGridEnum
                });
            },
            position: 'first',
            id: 'del-member',
            title: _('Delete member'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-enum-members', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                $dialogSelectMember.dialog('open');
            },
            position: 'first',
            id: 'add-member',
            title: _('Add member'),
            cursor: 'pointer'
        });

        $dialogEnumMembers.dialog({
            autoOpen:   false,
            modal:      true,
            width:      800,
            height:     500,
            buttons:    [],
            resize:     function () {
                $gridEnumMembers.setGridHeight($(this).height() - 100).setGridWidth($(this).width() - 5);
            },
            open: function () {
                $gridEnumMembers.setGridHeight($(this).height() - 100).setGridWidth($(this).width() - 5);
                var name = $dialogEnumMembers.dialog('option', 'title');
                $('#enum-name-button').button({icons:{primary: 'ui-icon-check'}, text: false});
                $('#enum-name-button').hide().unbind('click').click(function () {
                    if (!enumRename(name, $('#enum-name-edit').val())) {
                        $('#enum-name-edit').val(objects[name].common.name);
                    }
                    $('#enum-name-button').hide();
                });
                $('#enum-name-edit').val(objects[name].common.name).unbind('change').change(function () {
                    if (objects[name].common.name != $(this).val()) {
                        $('#enum-name-button').show();
                    } else {
                        $('#enum-name-button').hide();
                    }
                }).keyup(function () {
                    if (objects[name].common.name != $(this).val()) {
                        $('#enum-name-button').show();
                    } else {
                        $('#enum-name-button').hide();
                    }
                });
            }
        });

        $dialogEnumMembers.trigger('resize');

        $gridSelectMember.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('type')],
            colModel: [
                {name: '_id',  index:'_id',  width: 240},
                {name: 'name', index:'name', width: 400},
                {name: 'type', index:'type', width: 100, fixed: true,
                    stype: 'select',
                    searchoptions: {
                        sopt: ['eq'], value: ':' + _('all') + ';device:' + _('device') + ';channel:' + _('channel') + ';state:' + _('state')
                    }
                }

            ],
            width: 768,
            height: 370,
            rowNum: 1000000,
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('select member by double click'),
            ignoreCase: true,
            onSelectRow: function (rowid, e) {
                $('#del-member').removeClass('ui-state-disabled');
            },
            ondblClickRow: function (rowid, e) {
                var memberSelected = rowid;
                var id = $('tr[id="' + memberSelected + '"]').find('td[aria-describedby$="_id"]').html();
                var obj = objects[enumEdit];
                if (obj.common.members.indexOf(id) === -1) {
                    obj.common.members.push(id);
                }
                objects[enumEdit] = obj;
                socket.emit('setObject', enumEdit, obj, function () {
                    $dialogSelectMember.dialog('close');
                    enumMembers(enumEdit);
                    // TODO update member count in subGridEnum
                });
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false
        });

        $dialogSelectMember.dialog({
            autoOpen:   false,
            modal:      true,
            width:      800,
            height:     500,
            buttons: []
        });
    }

    function prepareObjects() {

        $dialogObject.dialog({
            autoOpen:   false,
            modal:      true,
            width: 800,
            height: 540,
            buttons: [
                {
                    text: 'Save',
                    click: saveObject
                },
                {
                    text: 'Cancel',
                    click: function () {
                        $dialogObject.dialog('close');
                        $('#json-object').val('');
                    }
                }
            ]
        });

        $(document).on('click', '.jump', function (e) {
            editObject($(this).attr('data-jump-to'));
            e.preventDefault();
            return false;
        });

        $gridObjects.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('role'), _('type')],
            colModel: [
                {name: '_id',  index:'_id',  width: 450, fixed: true},
                {name: 'name', index:'name'},
                {name: 'role', index:'role', width: 120, fixed: true},
                {name: 'type', index:'type', width: 120, fixed: true,
                    //formatter:'select',
                    stype: 'select',
                    searchoptions: {
                        sopt: ['eq'], value: ":All;device:device;channel:channel;state:state;enum:enum;host:host;adapter:adapter;meta:meta;config:config"
                    }
                }
            ],
            pager: $('#pager-objects'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: 'ioBroker Objects',
            subGrid: true,
            ignoreCase: true,
            subGridRowExpanded: function (grid, row) {
                subGridObjects(grid, row, 1);
            },
            afterInsertRow: function (rowid) {
                // Remove icon and click handler if no children available
                var id = $('tr[id="' + rowid + '"]').find('td[aria-describedby$="_id"]').html();
                if (!children[id]) {
                    $('td.sgcollapsed', '[id="' + rowid + '"]').empty().removeClass('ui-sgcollapsed sgcollapsed');
                }

            },
            onSelectRow: function (rowid, e) {
                // unselect other subgrids but not myself
                $('[id^="grid-objects"][id$="_t"]').not('[id="' + this.id + '"]').jqGrid('resetSelection');
                $('#del-object').removeClass('ui-state-disabled');
                $('#edit-object').removeClass('ui-state-disabled');
            },
            gridComplete: function () {
                $('#del-object').addClass('ui-state-disabled');
                $('#edit-object').addClass('ui-state-disabled');
            },
            subGridRowColapsed: function (grid, id) {
                var objSelected = $gridObjects.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').not('[id="' + grid + '_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                if (!objSelected) {
                    $('#del-object').addClass('ui-state-disabled');
                    $('#edit-object').addClass('ui-state-disabled');
                }
                return true;
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch: true,
            searchOnEnter: false,
            enableClear: false
        }).navGrid('#pager-objects', {
            search: false,
            edit: false,
            add: false,
            del: false,
            refresh: false
        })/* TODO .jqGrid('navButtonAdd', '#pager-objects', {
            caption: '',
            buttonicon: 'ui-icon-trash',
            onClickButton: function () {
                var objSelected = $gridObjects.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
                alert('TODO delete ' + id); //TODO
            },
            position: 'first',
            id: 'del-object',
            title: 'Delete object',
            cursor: 'pointer'
        })*/.jqGrid('navButtonAdd', '#pager-objects', {
            caption: '',
            buttonicon: 'ui-icon-gear',
            onClickButton: function () {
                var objSelected = $gridObjects.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                editObject(id);
            },
            position: 'first',
            id: 'edit-object',
            title: _('Edit object'),
            cursor: 'pointer'
        })/*.jqGrid('navButtonAdd', '#pager-objects', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                alert('TODO add object'); //TODO
            },
            position: 'first',
            id: 'add-object',
            title: _('New object'),
            cursor: 'pointer'
        })*/;

    }
    function subGridObjects(grid, row, level) {
        var id = $('tr[id="' + row + '"]').find('td[aria-describedby$="_id"]').html();
        var subgridTableId = grid + '_t';
        $('[id="' + grid + '"]').html('<table class="subgrid-level-' + level + '" id="' + subgridTableId + '"></table>');
        var $subgrid = $('table[id="' + subgridTableId + '"]');
        var gridConf = {
            datatype: 'local',
            colNames: ['id', _('name'), _('role'), _('type')],
            colModel: [
                {name: '_id',  index: '_id',  width: 450 - (level * 27), fixed: true},
                {name: 'name', index: 'name'},
                {name: 'role', index: 'role', width: 120 - (level * 2),  fixed: true},
                {name: 'type', index: 'type', width: 120 - (level * 2),  fixed: true}
            ],
            rowNum: 1000000,
            autowidth: true,
            height: 'auto',
            width: 1200,
            //sortname: '_id',
            //sortorder: 'desc',
            viewrecords: true,
            sortorder: 'desc',
            ignoreCase: true,
            subGrid: true,
            subGridRowExpanded: function (grid, row) {
                subGridObjects(grid, row, level + 1);
            },
            subGridRowColapsed: function (grid, id) {
                // Check if there is still a row selected
                var objSelected = $gridObjects.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').not('[id="' + grid + '_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                // Disable buttons if no row is selected
                if (!objSelected) {
                    $('#del-object').addClass('ui-state-disabled');
                    $('#edit-object').addClass('ui-state-disabled');
                }
                return true;
            },
            afterInsertRow: function (rowid) {
                // Remove icon and click handler if no children available
                if (!children[rowid.slice(7)]) {
                    $('td.sgcollapsed', '[id="' + rowid + '"]').empty().removeClass('ui-sgcollapsed sgcollapsed');
                }
            },
            gridComplete: function () {
                // Hide header
                $subgrid.parent().parent().parent().find('table.ui-jqgrid-htable').hide();
            },
            onSelectRow: function (rowid, e) {
                // unselect other subgrids but not myself
                $('[id^="grid-objects"][id$="_t"]').not('[id="' + this.id + '"]').jqGrid('resetSelection');

                // unselect objects grid
                $gridObjects.jqGrid('resetSelection');

                // enable buttons
                $('#del-object').removeClass('ui-state-disabled');
                $('#edit-object').removeClass('ui-state-disabled');
            }
        };
        $subgrid.jqGrid(gridConf);

        if (children[id]) {
            for (var i = 0; i < children[id].length; i++) {
                $subgrid.jqGrid('addRowData', 'object_' + objects[children[id][i]]._id.replace(/ /g, '_'), {
                    _id:  objects[children[id][i]]._id,
                    name: objects[children[id][i]].common ? objects[children[id][i]].common.name : '',
                    type: objects[children[id][i]].type
                });
            }
        }
        $subgrid.trigger('reloadGrid');
    }

    function prepareEnums() {
        $gridEnums.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('members'), ''],
            colModel: [
                {name: '_id',       index: '_id', width: 450, fixed: true},
                {name: 'name',      index: 'name'},
                {name: 'count',     index: 'count'},
                {name: 'buttons',   index: 'buttons'}
            ],
            pager: $('#pager-enums'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker Enums'),
            subGrid: true,
            ignoreCase: true,
            subGridRowExpanded: function (grid, row) {
                subGridEnums(grid, row, 1);
            },
            afterInsertRow: function (rowid) {
                // Remove icon and click handler if no children available
                var id = $('tr[id="' + rowid + '"]').find('td[aria-describedby$="_id"]').html();
                if (!children[id]) {
                    $('td.sgcollapsed', '[id="' + rowid + '"]').empty().removeClass('ui-sgcollapsed sgcollapsed');
                }

            },
            onSelectRow: function (rowid, e) {
                // unselect other subgrids but not myself
                $('[id^="grid-enums"][id$="_t"]').not('[id="' + this.id + '"]').jqGrid('resetSelection');
                $('#del-enum').removeClass('ui-state-disabled');
                $('#edit-enum').removeClass('ui-state-disabled');
            },
            gridComplete: function () {
                $('#del-enum').addClass('ui-state-disabled');
                $('#edit-enum').addClass('ui-state-disabled');
            },
            loadComplete: function () {
                initEnumButtons();
            },
            subGridRowColapsed: function (grid, id) {
                var objSelected = $gridEnums.jqGrid('getGridParam', 'selrow');
                var pos = enumExpanded.indexOf(id);
                if (pos != -1) {
                    enumExpanded.splice(pos, 1);
                }
                if (!objSelected) {
                    $('[id^="grid-enums"][id$="_t"]').not('[id="' + grid + '_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                if (!objSelected) {
                    $('#del-enum').addClass('ui-state-disabled');
                    $('#edit-enum').addClass('ui-state-disabled');
                }
                return true;
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch: true,
            searchOnEnter: false,
            enableClear: false
        }).navGrid('#pager-enums', {
            search: false,
            edit: false,
            add: false,
            del: false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-enums', {
            caption: '',
            buttonicon: 'ui-icon-trash',
            onClickButton: function () {
                var objSelected = $gridEnums.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-enums"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                alert('TODO delete ' + id); //TODO
            },
            position: 'first',
            id: 'del-enum',
            title: _('Delete enum'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-enums', {
            caption: '',
            buttonicon: 'ui-icon-gear',
            onClickButton: function () {
                var objSelected = $gridEnums.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-enums"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                editObject(id);
            },
            position: 'first',
            id: 'edit-enum',
            title: _('Edit enum'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-enums', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                // Find unused name
                enumCurrentParent = '';
                var name = _('enum');
                var idx = 0;
                var newId;
                do {
                    idx++;
                    newId = (enumCurrentParent || 'enum')  + '.' + name + idx;
                } while (objects[newId]);

                $('#enum-name').val(name + idx);
                $('#enum-gen-id').html(newId);
                $dialogEnum.dialog('open');
            },
            position: 'first',
            id: 'add-enum',
            title: _('New enum'),
            cursor: 'pointer'
        });


        $(document).on('click', '.enum-members', function () {
            enumMembers($(this).attr('data-enum-id'));
        });
        $(document).on('click', '.enum-add-children', function () {
            enumAddChild($(this).attr('data-enum-id'));
        });
        $(document).on('click', '.enum-del', function () {
            var id = $(this).attr('data-enum-id');
            enumDelete(id, function (parent) {
                initEnums(true, parent);
            });
        });
    }
    function subGridEnums(grid, row, level) {
        var id = $('tr[id="' + row + '"]').find('td[aria-describedby$="_id"]').html();
        if (enumExpanded.indexOf(id) == -1) enumExpanded.push(id);

        var subgridTableId = grid + '_t';
        $('[id="' + grid + '"]').html('<table class="subgrid-level-' + level + '" id="' + subgridTableId + '"></table>');
        var $subgrid = $('table[id="' + subgridTableId + '"]');
        var gridConf = {
            datatype: 'local',
            colNames: ['id', _('name'), _('members'), ''],
            colModel: [
                {name: '_id',  index: '_id', width: 450 - (level * 27), fixed: true},
                {name: 'name', index: 'name'},
                {name: 'members', index: 'members'},
                {name: 'buttons', index: 'buttons'}
            ],
            rowNum: 1000000,
            autowidth: true,
            height: 'auto',
            width: 1200,
            //sortname: '_id',
            //sortorder: 'desc',
            viewrecords: true,
            sortorder: 'desc',
            ignoreCase: true,
            subGrid: true,
            subGridRowExpanded: function (grid, row) {
                subGridEnums(grid, row, level + 1);
            },
            subGridRowColapsed: function (grid, id) {
                // Check if there is still a row selected
                var objSelected = $gridObjects.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-enum"][id$="_t"]').not('[id="' + grid + '_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                // Disable buttons if no row is selected
                if (!objSelected) {
                    $('#del-enum').addClass('ui-state-disabled');
                    $('#edit-enum').addClass('ui-state-disabled');
                }
                return true;
            },
            afterInsertRow: function (rowid) {
                // Remove icon and click handler if no children available
                if (!children[rowid.slice(5)]) {
                    $('td.sgcollapsed', '[id="' + rowid + '"]').empty().removeClass('ui-sgcollapsed sgcollapsed');
                }
            },
            gridComplete: function () {
                // Hide header
                $subgrid.parent().parent().parent().find('table.ui-jqgrid-htable').hide();
            },
            onSelectRow: function (rowid, e) {
                // unselect other subgrids but not myself
                $('[id^="grid-enums"][id$="_t"]').not('[id="' + this.id + '"]').jqGrid('resetSelection');

                // unselect objects grid
                $gridEnums.jqGrid('resetSelection');

                // enable buttons
                $('#del-enum').removeClass('ui-state-disabled');
                $('#edit-enum').removeClass('ui-state-disabled');
            }
        };
        $subgrid.jqGrid(gridConf);

        for (var i = 0; i < children[id].length; i++) {
            $subgrid.jqGrid('addRowData', 'enum_' + objects[children[id][i]]._id.replace(/ /g, '_'), {
                _id: objects[children[id][i]]._id,
                name: objects[children[id][i]].common ? objects[children[id][i]].common.name : '',
                members: objects[children[id][i]].common.members ? objects[children[id][i]].common.members.length : '',
                buttons: '<button data-enum-id="' + objects[children[id][i]]._id + '" class="enum-members">'      + _('members')  + '</button>' +
                         '<button data-enum-id="' + objects[children[id][i]]._id + '" class="enum-del">'          + _('delete')   + '</button>' +
                         '<button data-enum-id="' + objects[children[id][i]]._id + '" class="enum-add-children">' + _('children') + '</button>'

            });
        }
        $subgrid.trigger('reloadGrid');
        initEnumButtons();
    }

    function prepareHistoryButton(btn) {
        $(btn).button({
            text: false,
            icons: {
                primary:'ui-icon-clock'
            }
        })
            .css({
                'height':     '18px',
                'width':      '22px'});

        if ($(btn).hasClass('history-enabled')) $(btn).css({'background': 'lightgreen'});
    }
    function prepareStates() {
        var stateEdit = false;
        var stateLastSelected;

        // TODO hide column history if no instance of history-adapter enabled
        $gridStates.jqGrid({
            datatype: 'local',
            colNames: ['id', _('parent name'), _('name'), _('val'), _('ack'), _('from'), _('ts'), _('lc'), _('history')],
            colModel: [
                {name: '_id',       index: '_id',       width: 250, fixed: false},
                {name: 'pname',     index: 'pname',     width: 250, fixed: false},
                {name: 'name',      index: 'name',      width: 250, fixed: false},
                {name: 'val',       index: 'ack',       width: 160, editable: true},
                {name: 'ack',       index: 'ack',       width: 60,  fixed: false, editable: true, edittype: 'checkbox', editoptions: {value: "true:false"}},
                {name: 'from',      index: 'from',      width: 80,  fixed: false},
                {name: 'ts',        index: 'ts',        width: 140, fixed: false},
                {name: 'lc',        index: 'lc',        width: 140, fixed: false},
                {name: 'history',   index: 'history',   width: 80, fixed: false}
            ],
            pager: $('#pager-states'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker States'),
            ignoreCase: true,
            loadComplete: function () {
                $('.history').each(function (id) {
                    prepareHistoryButton(this);
                });
            },
            ondblClickRow: function (id) {
                var rowData = $gridStates.jqGrid('getRowData', id);
                rowData.ack = false;
                rowData.from = '';
                $gridStates.jqGrid('setRowData', id, rowData);

                if (id && id !== stateLastSelected) {
                    $gridStates.restoreRow(stateLastSelected);
                    stateLastSelected = id;
                }
                $gridStates.editRow(id, true, function () {
                    // onEdit
                    stateEdit = true;
                }, function (obj) {
                    // success
                }, "clientArray", null, function () {
                    // afterSave
                    stateEdit = false;
                    var val = $gridStates.jqGrid('getCell', stateLastSelected, "val");
                    if (val === 'true') val = true;
                    if (val === 'false') val = false;
                    if (parseFloat(val) == val) val = parseFloat(val);
                    var ack = $gridStates.jqGrid('getCell', stateLastSelected, "ack");
                    if (ack === 'true') ack = true;
                    if (ack === 'false') ack = false;
                    var id = $('tr[id="' + stateLastSelected + '"]').find('td[aria-describedby$="_id"]').html();
                    socket.emit('setState', id, {val:val, ack:ack});
                });
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch: true,
            searchOnEnter: false,
            enableClear: false
        });
    }

    function prepareAdapters() {
        $gridAdapter.jqGrid({
            datatype: 'local',
            colNames: ['id', '', _('name'), _('title'), _('desc'), _('keywords'), _('available'), _('installed'), _('platform'), _('license'), ''],
            colModel: [
                {name: '_id',       index: '_id',       hidden: true},
                {name: 'image',     index: 'image',     width: 22,   editable: false, sortable: false, search: false, align: 'center'},
                {name: 'name',      index: 'name',      width:  64},
                {name: 'title',     index: 'title',     width: 180},
                {name: 'desc',      index: 'desc',      width: 360},
                {name: 'keywords',  index: 'keywords',  width: 120},
                {name: 'version',   index: 'version',   width:  70, align: 'center'},
                {name: 'installed', index: 'installed', width: 110, align: 'center'},
                {name: 'platform',  index: 'platform',  hidden: true},
                {name: 'license',   index: 'license',   hidden: true},
                {name: 'install',   index: 'install',   width: 72}
            ],
            pager: $('#pager-adapters'),
            width: 964,
            height: 326,
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker adapters'),
            ignoreCase: true,
            loadComplete: function () {
                initAdapterButtons();
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch: true,
            searchOnEnter: false,
            enableClear: false
        }).navGrid('#pager-adapters', {
            search: false,
            edit: false,
            add: false,
            del: false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-adapters', {
            caption:       '',
            buttonicon:    'ui-icon-refresh',
            onClickButton: function () {
                initAdapters(true, true);
            },
            position:      'first',
            id:            'add-object',
            title:         _('update adapter information'),
            cursor:        'pointer'
        });

        $('#gview_grid-adapters .ui-jqgrid-titlebar').append('<div style="padding-left: 120px; margin-bottom: -3px;"><span class="translate">Host: </span><select id="host-adapters"></select></div>');

    }

    function prepareInstances() {
        var instanceLastSelected;
        var instanceEdit;


        $gridInstance.jqGrid({
            datatype: 'local',
            colNames: ['id', 'availableModes',  '', _('name'), _('instance'), _('title'), _('enabled'), _('host'), _('mode'), _('schedule'), '', _('platform'), _('loglevel'), _('alive'), _('connected')],
            colModel: [
                {name: '_id',       index: '_id',       hidden: true},
                {name: 'availableModes', index:'availableModes', hidden: true},
                {name: 'image',     index: 'image',     width: 22,   editable: false, sortable: false, search: false, align: 'center'},
                {name: 'name',      index: 'name',      width: 130,  editable: true},
                {name: 'instance',  index: 'instance',  width: 70},
                {name: 'title',     index: 'title',     width: 220},
                {name: 'enabled',   index: 'enabled',   width: 60,   editable: true, edittype: 'checkbox', editoptions: {value: "true:false"}, align: 'center'},
                {name: 'host',      index: 'host',      width: 100,  editable: true, edittype: 'select', editoptions: ''},
                {name: 'mode',      index: 'mode',      width: 80,   editable: true, edittype: 'select', editoptions: {value: null}, align: 'center'},
                {name: 'schedule',  index: 'schedule',  width: 80,   align: 'center', editable: true},
                {name: 'config',    index: 'config',    width: 60,   align: 'center', sortable: false, search: false},
                {name: 'platform',  index: 'platform',  width: 60,   hidden: true},
                {name: 'loglevel',  index: 'loglevel',  width: 60,   align: 'center', editable: true, edittype: 'select', editoptions: {value: 'debug:debug;info:info;warn:warn;error:error'}},
                {name: 'alive',     index: 'alive',     width: 60,   align: 'center'},
                {name: 'connected', index: 'connected', width: 60,   align: 'center'}
            ],
            pager: $('#pager-instances'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker adapter instances'),
            ignoreCase: true,
            onSelectRow: function (id, e) {
                $('#del-instance').removeClass('ui-state-disabled');
                $('#edit-instance').removeClass('ui-state-disabled');
                $('#config-instance').removeClass('ui-state-disabled');
                $('#reload-instance').removeClass('ui-state-disabled');
            },
            ondblClickRow: configInstance,
            gridComplete: function () {
                $('#del-instance').addClass('ui-state-disabled');
                $('#edit-instance').addClass('ui-state-disabled');
                $('#config-instance').addClass('ui-state-disabled');
                $('#reload-instance').addClass('ui-state-disabled');
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch: true,
            searchOnEnter: false,
            enableClear: false
        }).navGrid('#pager-instances', {
            search: false,
            edit: false,
            add: false,
            del: false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-instances', {
            caption: '',
            buttonicon: 'ui-icon-trash',
            onClickButton: function () {
                var objSelected = $gridInstance.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                if (objects[id] && objects[id].common && objects[id].common.host) {
                    if (confirm(_('Are you sure?'))) {
                        cmdExec(objects[id].common.host, 'del ' + id.replace('system.adapter.', ''), function (exitCode) {
                            if (!exitCode) initAdapters(true);
                        });
                    }
                }
            },
            position: 'first',
            id: 'del-instance',
            title: _('delete instance'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-instances', {
            caption: '',
            buttonicon: 'ui-icon-gear',
            onClickButton: function () {
                var objSelected = $gridInstance.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                editObject(id);
            },
            position: 'first',
            id: 'edit-instance',
            title: _('edit instance'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-instances', {
            caption:    '',
            buttonicon: 'ui-icon-pencil',
            onClickButton: function () {
                configInstance($gridInstance.jqGrid('getGridParam', 'selrow'));
            },
            position: 'first',
            id:       'config-instance',
            title:    _('config instance'),
            cursor:   'pointer'
        }).jqGrid('navButtonAdd', '#pager-instances', {
            caption:    '',
            buttonicon: 'ui-icon-refresh',
            onClickButton: function () {
                var objSelected = $gridInstance.jqGrid('getGridParam', 'selrow');
                var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                socket.emit('extendObject', id, {});
            },
            position:   'first',
            id:         'reload-instance',
            title:      _('reload instance'),
            cursor:     'pointer'
        });

        function configInstance(id, e) {
            var rowData = $gridInstance.jqGrid('getRowData', id);
            rowData.ack = false;
            rowData.from = '';
            $gridInstance.jqGrid('setRowData', id, rowData);

            if (rowData.availableModes) {
                var list = {};
                var modes = rowData.availableModes.split(',');
                for (var i = 0; i < modes.length; i++) {
                    list[modes[i]] = _(modes[i]);
                }
                $gridInstance.setColProp('mode', {
                    editable:    true,
                    edittype:    'select',
                    editoptions: {value: list},
                    align:       'center'
                });
            } else {
                $gridInstance.setColProp('mode', {
                    editable: false,
                    align: 'center'
                });
            }

            if (id && id !== instanceLastSelected) {
                $gridInstance.restoreRow(instanceLastSelected);
                instanceLastSelected = id;
            }
            $gridInstance.editRow(id, true, function () {
                // onEdit
                instanceEdit = true;
            }, function (obj) {
                // success
            }, "clientArray", null, function () {
                // afterSave
                instanceEdit = false;
                var obj = {common:{}};
                obj.common.host     = $gridInstance.jqGrid('getCell', instanceLastSelected, "host");
                obj.common.loglevel = $gridInstance.jqGrid('getCell', instanceLastSelected, "loglevel");
                obj.common.schedule = $gridInstance.jqGrid('getCell', instanceLastSelected, "schedule");
                obj.common.enabled  = $gridInstance.jqGrid('getCell', instanceLastSelected, "enabled");
                obj.common.mode     = $gridInstance.jqGrid('getCell', instanceLastSelected, "mode");
                if (obj.common.enabled === 'true')  obj.common.enabled = true;
                if (obj.common.enabled === 'false') obj.common.enabled = false;

                var id = $('tr[id="' + instanceLastSelected + '"]').find('td[aria-describedby$="_id"]').html();

                socket.emit('extendObject', id, obj);
            });
        }


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
                    socket.emit('extendObject', id, obj);
                });
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch: true,
            searchOnEnter: false,
            enableClear: false
        }).navGrid('#pager-users', {
            search: false,
            edit: false,
            add: false,
            del: false,
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
                if (window.confirm("Are you sure?")) {
                    socket.emit('delUser', id.replace("system.user.", ""), function (err) {
                        if (err) {
                            window.alert("Cannot delete user: " + err);
                        } else {
                            delUser(id);
                        }
                    });
                }
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
                    window.alert("Invalid object " + objSelected);
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
                    text: 'Save',
                    click: saveUser
                },
                {
                    text: 'Cancel',
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
                        socket.emit('extendObject', id, obj, function (err, obj) {
                            if (err) {
                                // Cannot modify
                                window.alert("Cannot change group");
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
            autosearch: true,
            searchOnEnter: false,
            enableClear: false
        }).navGrid('#pager-groups', {
            search: false,
            edit: false,
            add: false,
            del: false,
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
                if (window.confirm("Are you sure?")) {
                    socket.emit('delGroup', id.replace("system.group.", ""), function (err) {
                        if (err) {
                            window.alert("Cannot delete group: " + err);
                        }
                    });
                }
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
                    window.alert("Invalid object " + objSelected);
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
                    text: 'Save',
                    click: saveGroup
                },
                {
                    text: 'Cancel',
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
    
    function prepareScripts() {
        var scriptLastSelected;
        var scriptEdit;

        $gridScripts.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('platform'), _('enabled'), _('engine')],
            colModel: [
                {name: '_id',       index: '_id'},
                {name: 'name',      index: 'name', editable: true},
                {name: 'platform',  index: 'platform'},
                {name: 'enabled',   index: 'enabled', editable: true, edittype: 'checkbox', editoptions: {value: "true:false"}},
                {name: 'engine',    index: 'engine', editable: true}
            ],
            pager: $('#pager-scripts'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker adapter scripts'),
            ignoreCase: true,
            // TODO Inline Edit on dblClick only
            onSelectRow: function (id, e) {
                $('#del-script').removeClass('ui-state-disabled');
                $('#edit-script').removeClass('ui-state-disabled');

                var rowData = $gridScripts.jqGrid('getRowData', id);
                rowData.ack = false;
                rowData.from = '';
                $gridScripts.jqGrid('setRowData', id, rowData);

                if (id && id !== scriptLastSelected) {
                    $gridScripts.restoreRow(scriptLastSelected);
                    scriptLastSelected = id;
                }
                $gridScripts.editRow(id, true, function () {
                    // onEdit
                    scriptEdit = true;
                }, function (obj) {
                    // success
                }, "clientArray", null, function () {
                    // afterSave
                    scriptEdit = false;
                    var obj = {common:{}};
                    obj.common.engine = $gridScripts.jqGrid('getCell', scriptLastSelected, "engine");
                    obj.common.enabled = $gridScripts.jqGrid('getCell', scriptLastSelected, "enabled");
                    if (obj.common.enabled === 'true') obj.common.enabled = true;
                    if (obj.common.enabled === 'false') obj.common.enabled = false;
                    var id = $('tr[id="' + scriptLastSelected + '"]').find('td[aria-describedby$="_id"]').html();
                    socket.emit('extendObject', id, obj);
                });

            },
            gridComplete: function () {
                $('#del-script').addClass('ui-state-disabled');
                $('#edit-script').addClass('ui-state-disabled');
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch: true,
            searchOnEnter: false,
            enableClear: false
        }).navGrid('#pager-scripts', {
            search: false,
            edit: false,
            add: false,
            del: false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-scripts', {
            caption: '',
            buttonicon: 'ui-icon-trash',
            onClickButton: function () {
                var objSelected = $gridScripts.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-scripts"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                if (objSelected) {
                    var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                    var obj = {
                        id: id,
                        _deleted: true
                    };
                    socket.emit('setObject', id, obj, function () {
                        scripts.remove(id);
                        delete objects[id];
                        initScripts(true);
                    });

                }
            },
            position: 'first',
            id: 'del-script',
            title: _('delete script'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-scripts', {
            caption: '',
            buttonicon: 'ui-icon-pencil',
            onClickButton: function () {
                var objSelected = $gridScripts.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-scripts"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                if (objSelected) {
                    var id = $('tr[id="' + objSelected + '"]').find('td[aria-describedby$="_id"]').html();
                    editScript(id);
                } else {
                    window.alert("Invalid object " + objSelected);
                }
            },
            position: 'first',
            id: 'edit-script',
            title: _('edit script'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-scripts', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                editScript();
            },
            position: 'first',
            id: 'add-script',
            title: _('new script'),
            cursor: 'pointer'
        });

        $dialogScript.dialog({
            autoOpen:   false,
            modal:      true,
            width: 800,
            height: 540,
            buttons: [
                {
                    text: 'Save',
                    click: saveScript
                },
                {
                    text: 'Cancel',
                    click: function () {
                        $dialogScript.dialog('close');

                    }
                }
            ]
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
            autosearch: true,
            searchOnEnter: false,
            enableClear: false
        }).navGrid('#pager-hosts', {
            search: false,
            edit: false,
            add: false,
            del: false,
            refresh: false
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
    function initAdapters(update, updateRepo) {
        $gridAdapter.jqGrid('clearGridData');
        $("#load_grid-adapters").show();
        $('a[href="#tab-adapters"]').removeClass('updateReady');

        getAdaptersInfo(currentHost, update, updateRepo, function (repository, installedList) {
            var id = 1;
            var obj;
            var version;
            var tmp;

            var listInstalled    = [];
            var listUnsinstalled = [];

            for (var adapter in installedList) {
                obj = installedList[adapter];
                if (!obj || obj.controller || adapter == 'hosts') continue;
                listInstalled.push(adapter);
            }
            listInstalled.sort();

            // List of adapters for repository
            for (adapter in repository) {
                obj = repository[adapter];
                if (!obj || obj.controller) continue;
                version = '';
                if (installedList[adapter]) continue;
                listUnsinstalled.push(adapter);
            }
            listUnsinstalled.sort();

            // list of the installed adapters
            for (var i = 0; i < listInstalled.length; i++) {
                adapter = listInstalled[i];
                obj = installedList[adapter];
                if (!obj || obj.controller || adapter == 'hosts') continue;
                var installed = '';
                var icon =      obj.icon;
                version =   '';
                if (repository[adapter] && repository[adapter].version) {
                    version = repository[adapter].version;
                }

                if (repository[adapter] && repository[adapter].extIcon) icon = repository[adapter].extIcon;

                if (obj.version) {
                    installed = obj.version;
                    tmp = installed.split('.');
                    if (!upToDate(version, installed)) {
                        installed += ' <button class="adapter-update-submit" data-adapter-name="' + adapter + '">' + _('update') + '</button>';
                        version = version.replace('class="', 'class="updateReady ');
                        $('a[href="#tab-adapters"]').addClass('updateReady');
                    }
                }
                if (version) {
                    tmp = version.split('.');
                    if (tmp[0] === '0' && tmp[1] === '0' && tmp[2] === '0') {
                        version = '<span class="planned" title="' + _("planned") + '">' + version + '</span>';
                    } else if (tmp[0] === '0' && tmp[1] === '0') {
                        version = '<span class="alpha" title="' + _("alpha") + '">' + version + '</span>';
                    } else if (tmp[0] === '0') {
                        version = '<span class="beta" title="' + _("beta") + '">' + version + '</span>';
                    } else {
                        version = '<span class="stable" title="' + _("stable") + '">' + version + '</span>';
                    }
                }

                $gridAdapter.jqGrid('addRowData', 'adapter_' + adapter.replace(/ /g, '_'), {
                    _id:       id++,
                    image:     icon ? '<img src="' + icon + '" width="22px" height="22px" />' : '',
                    name:      adapter,
                    title:     obj.title,
                    desc:      (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc,
                    keywords:  obj.keywords ? obj.keywords.join(' ') : '',
                    version:   version,
                    installed: installed,
                    install:  '<button data-adapter-name="' + adapter + '" class="adapter-install-submit">' + _('add instance') + '</button>' +
                        '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" data-adapter-url="' + obj.readme + '" class="adapter-readme-submit">' + _('readme') + '</button>' +
                        '<button ' + (installed ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" class="adapter-delete-submit">' + _('delete adapter') + '</button>',
                    platform: obj.platform
                });
            }

            for (i = 0; i < listUnsinstalled.length; i++) {
                adapter = listUnsinstalled[i];

                obj = repository[adapter];
                if (!obj || obj.controller) continue;
                version =   '';
                if (installedList[adapter]) continue;

                if (repository[adapter] && repository[adapter].version) {
                    version = repository[adapter].version;
                    tmp = version.split('.');
                    if (tmp[0] === '0' && tmp[1] === '0' && tmp[2] === '0') {
                        version = '<span class="planned" title="' + _("planned") + '">' + version + '</span>';
                    } else if (tmp[0] === '0' && tmp[1] === '0') {
                        version = '<span class="alpha" title="' + _("alpha") + '">' + version + '</span>';
                    } else if (tmp[0] === '0') {
                        version = '<span class="beta" title="' + _("beta") + '">' + version + '</span>';
                    } else {
                        version = '<span class="stable" title="' + _("stable") + '">' + version + '</span>';
                    }
                }

                $gridAdapter.jqGrid('addRowData', 'adapter_' + adapter.replace(/ /g, '_'), {
                    _id:       id++,
                    image:     repository[adapter].extIcon ? '<img src="' + repository[adapter].extIcon + '" width="22px" height="22px" />' : '',
                    name:      adapter,
                    title:     obj.title,
                    desc:      (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc,
                    keywords:  obj.keywords ? obj.keywords.join(' ') : '',
                    version:   version,
                    installed: '',
                    install:  '<button data-adapter-name="' + adapter + '" class="adapter-install-submit">' + _('add instance') + '</button>' +
                        '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + ' data-adapter-name="' + adapter + '" data-adapter-url="' + obj.readme + '" class="adapter-readme-submit">' + _('readme') + '</button>' +
                        '<button disabled="disabled" data-adapter-name="' + adapter + '" class="adapter-delete-submit">' + _('delete adapter') + '</button>',
                    platform: obj.platform
                });
            }

            $gridAdapter.trigger('reloadGrid');
        });
    }

    function initAdapterButtons() {
        $(".adapter-install-submit").button({
            text: false,
            icons: {
                primary: 'ui-icon-plusthick'
            }
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var adapter = $(this).attr('data-adapter-name');
            getAdaptersInfo(currentHost, false, false, function (repo) {
                var obj = repo[adapter];
                if (!obj) return;
                if (obj.license && obj.license !== 'MIT') {
                    // TODO Show license dialog!
                    cmdExec(currentHost, 'add ' + adapter, function (exitCode) {
                        if (!exitCode) initAdapters(true);
                    });
                } else {
                    cmdExec(currentHost, 'add ' + adapter, function (exitCode) {
                        if (!exitCode) initAdapters(true);
                    });
                }
            });
        });

        $(".adapter-delete-submit").button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            cmdExec(currentHost, 'del ' + $(this).attr('data-adapter-name'), function (exitCode) {
                if (!exitCode) initAdapters(true);
            });
        });

        $(".adapter-readme-submit").button({
            icons: {primary: 'ui-icon-help'},
            text: false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            window.open($(this).attr('data-adapter-url'), $(this).attr('data-adapter-name') + ' ' + _('readme'));
        });

        $(".adapter-update-submit").button({
            icons: {primary: 'ui-icon-refresh'},
            text:  false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            cmdExec(currentHost, 'upgrade ' + $(this).attr('data-adapter-name'), function (exitCode) {
                if (!exitCode) initAdapters(true);
            });
        });
    }

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


        $gridAdapter.trigger('reloadGrid');
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


        $gridAdapter.trigger('reloadGrid');
    }

    function updateCertListSelect() {
        // todo
    }

    function initRepoButtons() {
        var editedId = null;

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

    function initCertButtons() {
        var editedId = null;

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

    function initHostsList() {

        if (!objectsLoaded) {
            setTimeout(initHostsList, 250);
            return;
        }

        // fill the host list on adapter tab
        var selHosts = document.getElementById('host-adapters');
        var myOpts   = selHosts.options;
        var $selHosts = $(selHosts);
        var found;
        var j;
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
        if ($selHosts.val() != currentHost) {
            currentHost = $selHosts.val();
            initAdapters(true);
        }
        $selHosts.unbind('change').change(function () {
            currentHost = $(this).val();
            initAdapters(true);
        });
    }

    function initInstances(update) {

        if (!objectsLoaded) {
            setTimeout(initInstances, 250);
            return;
        }

        if (typeof $gridInstance !== 'undefined' && (!$gridInstance[0]._isInited || update)) {
            $gridInstance[0]._isInited = true;
            $gridInstance.jqGrid('clearGridData');

            instances.sort();

            for (var i = 0; i < instances.length; i++) {
                var obj = objects[instances[i]];
                var tmp = obj._id.split('.');
                var adapter = tmp[2];
                var instance = tmp[3];
                var title = obj.common ? obj.common.title : '';
                var link  = obj.common.localLink || '';
                if (link && link.indexOf('%ip%') != -1) link = link.replace('%ip%', location.hostname);

                $gridInstance.jqGrid('addRowData', 'instance_' + instances[i].replace(/ /g, '_'), {
                    _id:       obj._id,
                    availableModes: obj.common ? obj.common.availableModes : null,
                    image:     obj.common && obj.common.icon ? '<img src="/adapter/' + obj.common.name + '/' + obj.common.icon + '" width="22px" height="22px"/>' : '',
                    name:      obj.common ? obj.common.name : '',
                    instance:  obj._id.slice(15),
                    title:     obj.common ? (link ? '<a href="' + link + '" target="_blank">' + title + '</a>': title): '',
                    enabled:   obj.common ? (obj.common.enabled ? '<span style="color:green;font-weight:bold">true</span>' : '<span style="color:red">false</span>') : '',
                    host:      obj.common ? obj.common.host : '',
                    mode:      obj.common.mode,
                    schedule:  obj.common.mode === 'schedule' ? obj.common.schedule : '',
                    config:    '<button data-adapter-href="/adapter/' + adapter + '/?' + instance + '" data-adapter-name="' + adapter + '.' + instance + '" class="adapter-settings">' + _('config') + '</button>',
                    platform:  obj.common ? obj.common.platform : '',
                    loglevel:  obj.common ? obj.common.loglevel : '',
                    alive:     states[obj._id + '.alive'] ? states[obj._id + '.alive'].val : '',
                    connected: states[obj._id + '.connected'] ? states[obj._id + '.connected'].val : ''
                });
            }
            $gridInstance.trigger('reloadGrid');

            $('.host-selector').each(function () {
                var id = $(this).attr('data-id');
                $(this).val((objects[id] && objects[id].common) ? obj.common.host || '': '').
                    change(function () {
                        socket.emit('extendObject', $(this).attr('data-id'), {common:{host: $(this).val()}});
                    });
            });

            $(document).unbind('click.adapter-settings').on('click', '.adapter-settings', function () {
                $iframeDialog = $dialogConfig;
                $configFrame.attr('src', $(this).attr('data-adapter-href'));
                $dialogConfig.dialog('option', 'title', _('Adapter configuration') + ': ' + $(this).attr('data-adapter-name')).dialog('open');

                return false;
            });
        }


    }

    function initUsers(update) {

        if (!objectsLoaded) {
            setTimeout(initUsers, 500);
            return;
        }

        if (typeof $gridUsers != 'undefined' && (update || !$gridUsers[0]._isInited)) {
            $gridUsers[0]._isInited = true;
            $gridUsers.jqGrid('clearGridData');
            for (var i = 0; i < users.length; i++) {
                var obj = objects[users[i]];
                var select = '<select class="user-groups-edit" multiple="multiple" data-id="' + users[i] + '">';
                for (var j = 0; j < groups.length; j++) {
                    var name = groups[j].substring('system.group.'.length);
                    name = name.substring(0, 1).toUpperCase() + name.substring(1);
                    select += '<option value="' + groups[j] + '"';
                    if (objects[groups[j]].common && objects[groups[j]].common.members && objects[groups[j]].common.members.indexOf(users[i]) != -1) select += ' selected';
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

    function initGroups(update) {

        if (!objectsLoaded) {
            setTimeout(initGroups, 500);
            return;
        }

        if (typeof $gridGroups != 'undefined' && (update || !$gridGroups[0]._isInited)) {
            $gridGroups[0]._isInited = true;
            $gridGroups.jqGrid('clearGridData');
            for (var i = 0; i < groups.length; i++) {
                var obj = objects[groups[i]];
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

    function initScripts(update) {

        if (!objectsLoaded) {
            setTimeout(initScripts, 250);
            return;
        }

        if (update || typeof $gridScripts != 'undefined' && !$gridScripts[0]._isInited) {
            $gridScripts[0]._isInited = true;
            $gridScripts.jqGrid('clearGridData');

            for (var i = 0; i < scripts.length; i++) {
                var obj = objects[scripts[i]];
                if (!obj) continue;
                $gridScripts.jqGrid('addRowData', 'script_' + instances[i].replace(/ /g, '_'), {
                    _id: obj._id,
                    name: obj.common ? obj.common.name : '',
                    platform: obj.common ? obj.common.platform : '',
                    enabled: obj.common ? obj.common.enabled : '',
                    engine: obj.common ? obj.common.engine : ''
                });
            }
            $gridScripts.trigger('reloadGrid');
        }
    }

    function initHosts(update) {

        if (!objectsLoaded) {
            setTimeout(initHosts, 250);
            return;
        }

        if (typeof $gridHosts !== 'undefined' && (!$gridHosts[0]._isInited || update)) {
            $('a[href="#tab-hosts"]').removeClass('updateReady');

            $gridHosts.jqGrid('clearGridData');

            getAdaptersInfo(currentHost, update, false, function (repository, installedList) {

                $gridHosts[0]._isInited = true;
                for (var i = 0; i < hosts.length; i++) {
                    var obj = objects[hosts[i].id];
                    var installed = '';
                    var version = obj.common ? (repository[obj.common.type] ? repository[obj.common.type].version : '') : '';
                    if (installedList && installedList.hosts && installedList.hosts[obj.common.hostname]) {
                        installed = installedList.hosts[obj.common.hostname].version;
                    }

                    if (!installed && obj.common && obj.common.installedVersion) installed = obj.common.installedVersion;

                    if (installed && version) {
                        if (!upToDate(version, installed)) {
                            installed += ' <button class="host-update-submit" data-host-name="' + obj.common.hostname + '">' + _('update') + '</button>';
                            version = '<span class="updateReady">' + version + '<span>';
                            $('a[href="#tab-hosts"]').addClass('updateReady');
                        }
                    }

                    $gridHosts.jqGrid('addRowData', 'host_' + hosts[i].id.replace(/ /g, '_'), {
                        _id:       obj._id,
                        name:      obj.common.hostname,
                        type:      obj.common.type,
                        title:     obj.common.title,
                        platform:  obj.common.platform,
                        os:        obj.native.os.platform,
                        available: version,
                        installed: installed
                    });
                }
                $gridHosts.trigger('reloadGrid');

                $('.host-update-submit').button({icons: {primary: 'ui-icon-refresh'}}).unbind('click').on('click', function () {
                    cmdExec($(this).attr('data-host-name'), 'upgrade self', function (exitCode) {
                        if (!exitCode) initHosts(true);
                    });
                });
            });
        }
    }

    // Methods
    function cmdExec(host, cmd, callback) {
        $stdout.val('');
        $dialogCommand.dialog('open');
        stdout = '$ ./iobroker ' + cmd;
        $stdout.val(stdout);
        // genereate the unique id to coordinate the outputs
        activeCmdId = Math.floor(Math.random() * 0xFFFFFFE) + 1;
        cmdCallback = callback;
        socket.emit('cmdExec', host, activeCmdId, cmd);
    }

    function getAdaptersInfo(host, update, updateRepo, callback) {
        if (!callback) throw 'Callback cannot be null or undefined';
        if (update) {
            curRepository = null;
            curInstalled  = null;
        }
        if (!curRepository) {
            socket.emit('sendToHost', host, 'getRepository', {repo: systemConfig.common.activeRepo, update: updateRepo}, function (_repository) {
                curRepository = _repository;
                if (curRepository && curInstalled) callback(curRepository, curInstalled);
            });
        }
        if (!curInstalled) {
            socket.emit('sendToHost', host, 'getInstalled', null, function (_installed) {
                curInstalled = _installed;
                if (curRepository && curInstalled) callback(curRepository, curInstalled);
            });
        }
        if (curInstalled && curRepository) callback(curRepository, curInstalled);
    }

    function getObjects(callback) {
        $gridObjects.jqGrid('clearGridData');
        socket.emit('getObjects', function (err, res) {
            var obj;
            objects = res;
//benchmark('starting getObjects loop');
            for (var id in objects) {
                if (id.slice(0, 7) === '_design') continue;

                obj = objects[id];

                if (obj.type === 'device' || obj.type === 'channel' || obj.type === 'state') {
                    $gridSelectMember.jqGrid('addRowData', 'select_obj_' + id.replace(/ /g, '_'), {
                        _id: id,
                        name: obj.common.name,
                        type: obj.type
                    });
                }

                if (obj.parent) {
                    if (!children[obj.parent]) children[obj.parent] = [];
                    children[obj.parent].push(id);
                    if (obj.type === 'instance')    instances.push(id);
                    if (obj.type === 'enum')        enums.push(id);
                } else {
                    toplevel.push(id);
                    if (obj.type === 'script')      scripts.push(id);
                    if (obj.type === 'user')        users.push(id);
                    if (obj.type === 'group')       groups.push(id);
                    if (obj.type === 'adapter')     adapters.push(id);
                    if (obj.type === 'enum')        enums.push(id);
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
                }


            }
            //benchmark('finished getObjects loop');
            objectsLoaded = true;

            // Change editoptions for gridInstances column host
            var tmp = '';
            for (var j = 0; j < hosts.length; j++) {
                tmp += (j > 0 ? ';' : '') + hosts[j].name + ':' + hosts[j].name;
            }
            $gridInstance.jqGrid('setColProp', 'host', {editoptions: {value: tmp}});

            var gridObjectsData = [];
            for (var i = 0; i < toplevel.length; i++) {
                try {
                    gridObjectsData.push({
                        gridId: 'object_' + toplevel[i].replace(/ /g, '_'),
                        _id:  objects[toplevel[i]]._id,
                        name: objects[toplevel[i]].common ? (objects[toplevel[i]].common.name || '') : '',
                        role: objects[toplevel[i]].common ? (objects[toplevel[i]].common.role || '') : '',
                        type: objects[toplevel[i]].type
                    });
                } catch (e) {
                    console.log(e.toString());
                }
            }
            $gridObjects.jqGrid('addRowData', 'gridId', gridObjectsData);
            $gridObjects.trigger('reloadGrid');

            $gridSelectMember.trigger('reloadGrid');

            if (typeof callback === 'function') callback();

            // Show if update available
            initHostsList();
        });
    }

    function initEnums(update, expandId) {
        if (!objectsLoaded) {
            setTimeout(initEnums, 250);
            return;
        }

        if (typeof $gridEnums !== 'undefined' && (!$gridEnums[0]._isInited || update)) {
            var gridEnumsData = [];
            $gridEnums.jqGrid('clearGridData');
            $gridEnums[0]._isInited = true;
            for (var i = 0; i < toplevel.length; i++) {
                if (objects[toplevel[i]] && objects[toplevel[i]].type === 'enum') {
                    gridEnumsData.push({
                        gridId:  'enum_' + toplevel[i].replace(/ /g, '_'),
                        _id:     objects[toplevel[i]]._id,
                        name:    objects[toplevel[i]].common ? objects[toplevel[i]].common.name : '',
                        members: objects[toplevel[i]].common.members ? objects[toplevel[i]].common.members.length : '',
                        buttons: '<button data-enum-id="' + objects[toplevel[i]]._id + '" class="enum-members">' + _('members')  + '</button>' +
                            '<button data-enum-id="' + objects[toplevel[i]]._id + '" class="enum-del">'          + _('delete')   + '</button>' +
                            '<button data-enum-id="' + objects[toplevel[i]]._id + '" class="enum-add-children">' + _('children') + '</button>'
                    });
                }
            }
            $gridEnums.jqGrid('addRowData', 'gridId', gridEnumsData);
            $gridEnums.trigger('reloadGrid');
            if (expandId) {
                $gridEnums.jqGrid('expandSubGridRow', 'enum_' + expandId);
            }
            for (i = 0; i < enumExpanded.length; i++) {
                $gridEnums.jqGrid('expandSubGridRow', 'enum_' + enumExpanded[i]);
            }

            initEnumButtons();
        }
    }

    function initEnumButtons() {
        $('.enum-members').button({icons: {primary: 'ui-icon-pencil'}, text: false}).css('width', '22px').css('height', '18px').unbind('click')
            .click(function () {
                enumMembers($(this).attr('data-enum-id'));
            });
        $('.enum-add-children').button({icons: {primary: 'ui-icon-plus'}, text: false}).css('width', '22px').css('height', '18px').unbind('click')
            .click(function () {
                enumCurrentParent = $(this).attr('data-enum-id');
                // Find unused name
                var name = _('enum');
                var idx = 0;
                var newId;
                do {
                    idx++;
                    newId = (enumCurrentParent || 'enum')  + '.' + name + idx;
                } while (objects[newId]);

                $('#enum-name').val(name + idx);
                $('#enum-gen-id').html(newId);

                $dialogEnum.dialog('open');
            });

        $('.enum-del').button({icons: {primary: 'ui-icon-trash'}, text: false}).css('width', '22px').css('height', '18px').unbind('click')
            .click(function () {
                var id = $(this).attr('data-enum-id');
                enumDelete(id, function (parent) {
                    //initEnums(true, parent);
                });
            });
    }

    function enumDelete(id, callback, hideConfirm) {
        if (hideConfirm || confirm(_('Are you sure? ' + id))) {
            if (objects[id] && objects[id].children && objects[id].children.length) {
                if (objects[objects[id].children[0]]) {
                    enumDelete(objects[id].children[0], function () {
                        enumDelete(id, callback, true);
                    }, true);
                } else {
                    objects[id].children.splice(0, 1);
                    enumDelete(id, callback, true);
                }
            } else {
                var pos;
                var parent;
                if (objects[id]) {
                    parent = objects[id].parent;

                    if (objects[id].common.nondeletable) {
                        alert(_('Cannot delete ' + id + ' because not allowed'));
                        if (callback) callback(parent);
                        return;
                    }

                    if (parent) {
                        pos = objects[parent].children.indexOf(id);
                        if (pos != -1) {
                            objects[parent].children.splice(pos, 1);
                        }

                        if (children[parent]) {
                            pos = children[parent].indexOf(id);
                            if (pos != -1) {
                                children[parent].splice(pos, 1);
                            }
                            if (!children[parent].length) delete children[parent];
                        }

                        socket.emit('setObject', parent, objects[parent]);
                    }
                }

                pos = enums.indexOf(id);
                if (pos != -1) {
                    enums.splice(pos, 1);
                }

                if (toplevel[id]) {
                    pos = toplevel.indexOf(id);
                    if (pos != -1) {
                        toplevel.splice(pos, 1);
                    }
                }

                delete objects[id];
                socket.emit('delObject', id, function () {
                    if (callback) callback(parent);
                });
            }
        }
    }

    function enumAddChild(parent, newId, name) {
        if (objects[newId]) {
            alert(_('Name yet exists!'));
            return false;
        }

        enums.push(newId);
        objects[newId] = {
            _id: newId,
            children: [],
            parent:   parent,
            common:   {
                name: name,
                members: []
            },
            type:     "enum"
        };
        if (parent) {
            children[parent] = children[parent] || [];
            children[parent].push(newId);
        } else {
            toplevel.push(newId);
        }

        socket.emit('setObject', newId, objects[newId], function () {
            if (parent) {
                objects[parent].children = objects[parent].children || [];
                objects[parent].children.push(newId);
                socket.emit('setObject', parent, objects[parent]);
            }
        });
        return true;
    }

    function enumRename(oldId, newName) {
        var newId = newName.replace(/ /g, '_').toLowerCase();
        //Check if this name exists
        if (objects[newName]) {
            alert(_('Name yet exists!'));
            return false;
        }
        socket.emit('extendObject', oldId, {common: {name: newId}}, function () {
            $('#enum-name-button').hide();
        });

    }
    function enumMembers(id) {
        enumEdit = id;
        $dialogEnumMembers.dialog('option', 'title', id);
        $dialogSelectMember.dialog('option', 'title', id);
        var members = objects[id].common.members || [];
        $gridEnumMembers.jqGrid('clearGridData');
        for (var i = 0; i < members.length; i++) {
            if (objects[members[i]]) {
                $gridEnumMembers.jqGrid('addRowData', 'enum_member_' + members[i].replace(/ /g, '_'), {_id: members[i], name: objects[members[i]].common.name, type: objects[members[i]].type});
            } else {
                $gridEnumMembers.jqGrid('addRowData', 'enum_member_' + members[i].replace(/ /g, '_'), {
                    _id: members[i],
                    name: '<span style="color:red; font-weight:bold; font-style:italic;">object missing</span>',
                    type: ''
                });
            }
        }
        $('#del-member').addClass('ui-state-disabled');
        $dialogEnumMembers.dialog('open');
    }

    function convertState(key, _obj) {
        var obj = JSON.parse(JSON.stringify(_obj));
        obj._id = key;
        obj.name = objects[obj._id] ? (objects[obj._id].common.name || obj._id) : obj._id;

        if (objects[key] && objects[key].parent && objects[objects[key].parent]) {
            obj.pname = objects[objects[key].parent].common.name;
            // Add instance
            var parts = objects[key].parent.split('.');
            if (obj.pname.indexOf('.' + parts[parts.length - 1]) == -1) {
                obj.pname += '.' + parts[parts.length - 1];
            }
        } else if (obj.name.indexOf('.messagebox') != -1) {
            var p = obj.name.split('.');
            p.splice(-1);
            obj.pname = p.join('.');
        } else {
            var b = obj.name.split('.');
            b.splice(2);
            obj.pname = b.join('.');
        }

        obj.type = objects[obj._id] && objects[obj._id].common ? objects[obj._id].common.type : '';
        if (obj.ts) obj.ts = formatDate(new Date(obj.ts * 1000));
        if (obj.lc) obj.lc = formatDate(new Date(obj.lc * 1000));

        // Show history button only if history adapter enabled
        if (/*objects[key] && */
            objects['system.adapter.history.0'] && objects['system.adapter.history.0'].common.enabled &&
            key.substring(key.length - '.messagebox'.length) != '.messagebox') {

            // Check if history enabled
            var historyEnabled = '';
            if (objects[key] && objects[key].common && objects[key].common.history && objects[key].common.history.enabled) historyEnabled = ' history-enabled';
            obj.history = '<button data-id="' + obj._id + '" class="history' + historyEnabled + '" id="history_' + obj._id + '">' + _('history') + '</button>';

        } else {
            obj.history = '';
        }
        obj.gridId = 'state_' + key.replace(/ /g, '_');
        return obj;
    }

    function getStates(callback) {
        $gridStates.jqGrid('clearGridData');
        socket.emit('getStates', function (err, res) {
            states = res;
//benchmark('starting getStates loop');
            var gridData = [];
            for (var key in res) {
                gridData.push(convertState(key, res[key]));
            }
            $gridStates.jqGrid('addRowData', 'gridId', gridData);
//benchmark('finished getStates loop');
            $gridStates.trigger('reloadGrid');


            if (typeof callback === 'function') callback();
        });
    }

    function editObject(id) {
        var obj = objects[id];
        console.log(obj);
        $dialogObject.dialog('option', 'title', id);
        $('#edit-object-id').val(obj._id);
        $('#edit-object-parent-old').val(obj.parent);
        $('#edit-object-name').val(obj.common.name);
        $('#edit-object-type').val(obj.type);
        $('#edit-object-parent').val(obj.parent);
        $('#jump-parent').attr('data-jump-to', obj.parent);
        var childs = '<div style="font-size: 10px">';
        // childs += '<table style="font-size: 11px">';
        if (obj.children) {

            for (var i = 0; i < obj.children.length; i++) {
                //childs += '<tr><td>' + obj.children[i] + '</td><td><button data-jump-to="' + obj.children[i] + '" class="jump">-></button></td></tr>';
                childs += '<a style="text-decoration: underline; cursor: pointer;" class="jump" data-jump-to="' + obj.children[i] + '">' + obj.children[i] + '</a><br>';
            }
        }

        childs += '</div>';
        //childs += '</table>';
        $('#edit-object-children').html(childs);
        $('#edit-object-common').val(JSON.stringify(obj.common, null, '  '));
        $('#edit-object-native').val(JSON.stringify(obj.native, null, '  '));
        $dialogObject.dialog('open');
    }

    function editScript(id) {
        if (id) {
            var obj = objects[id];
            $dialogScript.dialog('option', 'title', id);
            $('#edit-script-id').val(obj._id);
            $('#edit-script-name').val(obj.common.name);
            $('#edit-script-platform').val(obj.common.platform);
            if (obj.common.platform.match(/^[jJ]ava[sS]cript/)) {
                editor.getSession().setMode("ace/mode/javascript");
            } else if (obj.common.platform.match(/^[cC]offee[sS]cript/)) {
                editor.getSession().setMode("ace/mode/coffee");
            }
            //$('#edit-script-source').val(obj.common.source);
            editor.setValue(obj.common.source);
            $dialogScript.dialog('open');
        } else {
            $dialogScript.dialog('option', 'title', 'new script');
            $('#edit-script-id').val('');
            $('#edit-script-name').val('');
            $('#edit-script-platform').val('Javascript/Node.js');
            //$('#edit-script-source').val('');
            editor.setValue('');
            $dialogScript.dialog('open');
        }
    }

    function saveScript() {
        var obj = {common: {}};
        obj._id = $('#edit-script-id').val();
        obj.type = 'script';
        obj.common.name = $('#edit-script-name').val();
        obj.common.source = editor.getValue();
        obj.common.platform = $('#edit-script-platform').val() || '';
        var extension;

        if (!obj._id) {
            if (obj.common.platform.match(/^[jJ]ava[sS]cript/)) {
                extension = 'js.';
                obj.common.engine = 'system.adapter.javascript.0';
            } else if (obj.common.platform.match(/^[cC]offee[sS]cript/)) {
                extension = 'coffee.';
                obj.common.engine = 'system.adapter.javascript.0';
            }
            obj._id = 'script.' + extension + obj.common.name;
        }

        if (scripts.indexOf(obj._id) === -1) scripts.push(obj._id);
        objects[obj._id] = obj;

        socket.emit('extendObject', obj._id, obj, function () {
            initScripts(true);

        });
        $dialogScript.dialog('close');
    }

    function editUser(id) {
        if (id) {
            var obj = objects[id];
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
            window.alert("Password and confirmation are not equal!");
            return;
        }
        var id = $('#edit-user-id').val();
        var user = $('#edit-user-name').val();

        if (!id) {
            socket.emit('addUser', user, pass, function (err) {
                if (err) {
                    window.alert("Cannot set password: " + err);
                } else {
                    $dialogUser.dialog('close');
                    initUsers(true);
                }
            });
        } else {
            // If password changed
            if (pass != '__pass_not_set__') {
                socket.emit('changePassword', user, pass, function (err) {
                    if (err) {
                        window.alert("Cannot set password: " + err);
                    } else {
                        $dialogUser.dialog('close');
                    }
                });
            }
        }
    }

    function editGroup(id) {
        if (id) {
            var obj = objects[id];
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
            socket.emit('addGroup', group, desc, function (err) {
                if (err) {
                    window.alert("Cannot create group: " + err);
                } else {
                    $dialogGroup.dialog('close');
                    initGroups(true);
                }
            });
        } else {
            var obj = {common: {desc: desc}};
            // If description changed
            socket.emit('extendObject', id, obj, function (err, res) {
                if (err) {
                    window.alert("Cannot change group: " + err);
                } else {
                    $dialogGroup.dialog('close');
                }
            });
        }
    }
    
    function saveObject() {
        var obj = {common: {}, native: {}};
        obj._id = $('#edit-object-id').val();
        obj.parent = $('#edit-object-parent-old').val();
        obj.common.name = $('#edit-object-name').val();
        obj.type = $('#edit-object-type').val();
        obj.parent = $('#edit-object-parent').val();

        try {
            obj.common = JSON.parse($('#edit-object-common').val());
        } catch (e) {
            window.alert('common ' + e);
            return false;
        }
        try {
            obj.native = JSON.parse($('#edit-object-native').val());
        } catch (e) {
            window.alert('native ' + e);
            return false;
        }

        socket.emit('extendObject', obj._id, obj);


        $dialogObject.dialog('close');
    }

    function synchronizeUser(userId, userGroups) {
        var obj;
        userGroups = userGroups || [];
        for (var i = 0; i < groups.length; i++) {
            // If user has no group, but group has user => delete user from group
            if (userGroups.indexOf(groups[i]) == -1 &&
                objects[groups[i]].common.members && objects[groups[i]].common.members.indexOf(userId) != -1) {
                objects[groups[i]].common.members.splice(objects[groups[i]].common.members.indexOf(userId), 1);
                obj = {common: {members: objects[groups[i]].common.members}};
                socket.emit('extendObject', groups[i], obj);
            }
            if (userGroups.indexOf(groups[i]) != -1 &&
                (!objects[groups[i]].common.members || objects[groups[i]].common.members.indexOf(userId) == -1)) {
                objects[groups[i]].common.members = objects[groups[i]].common.members || [];
                objects[groups[i]].common.members.push(userId);
                obj = {common: {members: objects[groups[i]].common.members}};
                socket.emit('extendObject', groups[i], obj);
            }
        }
    }

    function delUser(id) {
        for (var i = 0; i < groups.length; i++) {
            // If user has no group, but group has user => delete user from group
            if (objects[groups[i]].common.members && objects[groups[i]].common.members.indexOf(id) != -1) {
                objects[groups[i]].common.members.splice(objects[groups[i]].common.members.indexOf(id), 1);
                socket.emit('extendObject', groups[i], {
                    common: {
                        members: objects[groups[i]].common.members
                    }
                });
            }
        }
    }

    // Socket.io methods
    socket.on('log', function (message) {
        //message = {message: msg, severity: level, from: this.namespace, ts: (new Date()).getTime()}

        if (logLinesCount >= 2000) {
            var line = document.getElementById('log-line-' + (logLinesStart + 1));
            if (line) line.outerHTML = '';
            logLinesStart++;
        } else {
            logLinesCount++;
        }

        var hostFilter = $('#log-filter-host').val();

        if (logHosts.indexOf(message.from) == -1) {
            logHosts.push(message.from);
            logHosts.sort();
            $('#log-filter-host').html('<option value="">' + _('all') + '</option>');
            for (var i = 0; i < logHosts.length; i++) {
                $('#log-filter-host').append('<option value="' + logHosts[i] + '" ' + ((logHosts[i] == hostFilter) ? 'selected' : '') + '">' + logHosts[i] + '</option>');
            }
        }
        var visible = '';
        if (hostFilter && hostFilter != message.from) {
            visible = 'display: none';
        }
        var sevFilter = $('#log-filter-severity').val();
        if (!visible && sevFilter) {
            if (sevFilter == 'info' && message.severity == 'debug') {
                visible = 'display: none';
            } else if (sevFilter == 'warn' && message.severity != 'warn' && message.severity != 'error') {
                visible = 'display: none';
            } else if (sevFilter == 'error' && message.severity != 'error') {
                visible = 'display: none';
            }
        }

        if (message.severity == 'error')         $('a[href="#tab-log"]').addClass('errorLog');

        var text = '<tr id="log-line-' + (logLinesStart + logLinesCount) + '" class="log-line log-severity-' + message.severity + ' log-from-' + message.from + '" style="' + visible + '">';
        text += '<td class="log-column-1">' + message.from + '</td>';
        text += '<td class="log-column-2">' + formatDate(new Date(message.ts)) + '</td>';
        text += '<td class="log-column-3">' + message.severity + '</td>';
        text += '<td class="log-column-4" title="' + message.message.replace(/"/g, "'") + '">' + message.message.substring(0, 200) + '</td></tr>';

        $('#log-table').prepend(text);
    });

    socket.on('stateChange', function (id, obj) {
        var rowData;
        if (currentHistory == id) {
            var gid = $gridHistory[0]._maxGid++;
            $gridHistory.jqGrid('addRowData', gid, {
                gid: gid,
                id:  id,
                ack: obj.ack,
                val: obj.val,
                ts:  formatDate(new Date(obj.ts * 1000)),
                lc:  formatDate(new Date(obj.lc * 1000))
            });
        }

        if (id && id.length > '.messagebox'.length && id.substring(id.length - '.messagebox'.length) == '.messagebox') {
            var time = new Date();
            time =        time.getFullYear()           + '-' +
                   ("0" + time.getMonth()).slice(-2)   + '-' +
                   ("0" + time.getDay()).slice(-2)     + ' ' +
                   ("0" + time.getHours()).slice(-2)   + ':' +
                   ("0" + time.getMinutes()).slice(-2) + ':' +
                   ("0" + time.getSeconds()).slice(-2);

            $('#event-table').prepend('<tr><td class="event-column-1">message</td><td class="event-column-2">' + id +
                '</td><td class="event-column-3">' + obj.command +
                '</td><td class="event-column-4">' + (obj.callback ? obj.callback.ack : '') + '</td>' +
                '<td class="event-column-5">' + obj.from + '</td><td class="event-column-6">' + time + '</td><td class="event-column-7"></td></tr>');
        } else {
            if (!$gridStates) return;

            // Update gridStates
            rowData = $gridStates.jqGrid('getRowData', 'state_' + id);
            rowData.val = obj.val;
            rowData.ack = obj.ack;
            if (obj.ts) rowData.ts = formatDate(new Date(obj.ts * 1000));
            if (obj.lc) rowData.lc = formatDate(new Date(obj.lc * 1000));
            rowData.from = obj.from;
            $gridStates.jqGrid('setRowData', 'state_' + id.replace(/ /g, '_'), rowData);

            var value = JSON.stringify(obj.val);
            if (value.length > 30)
                value = '<div title="' + value.replace(/"/g, '') + '">' + value.substring(0, 30) + '...</div>';

            $('#event-table').prepend('<tr><td class="event-column-1">stateChange</td><td class="event-column-2">' + id +
                '</td><td class="event-column-3">' + value +
                '</td><td class="event-column-4">' + obj.ack + '</td>' +
                '<td class="event-column-5">' + obj.from + '</td><td class="event-column-6">' + rowData.ts + '</td><td class="event-column-7">' +
                rowData.lc + '</td></tr>');
        }

        if ($gridAdapter) {
            var parts = id.split('.');
            var last = parts.pop();
            id = parts.join('.');
            if (last === 'alive' && instances.indexOf(id) !== -1) {
                rowData = $gridStates.jqGrid('getRowData', 'state_' + id);
                rowData.alive = obj.val;
                $gridAdapter.jqGrid('setRowData', 'instance_' + id.replace(/ /g, '_'), rowData);

            } else if (last === 'connected' && instances.indexOf(id) !== -1) {
                rowData = $gridStates.jqGrid('getRowData', 'state_' + id);
                rowData.connected = obj.val;
                $gridAdapter.jqGrid('setRowData', 'instance_' + id.replace(/ /g, '_'), rowData);
            }
        }
    });

    socket.on('objectChange', function (id, obj) {
        var changed = false;
        var i;
        var j;
        var historyEnabled;
        var oldObj = null;
        // update objects cache
        if (obj) {
            if (obj._rev && objects[id]) objects[id]._rev = obj._rev;
            if (!objects[id] || JSON.stringify(objects[id]) != JSON.stringify(obj)) {
                objects[id] = obj;
                changed = true;
            }
        } else if (objects[id]) {
            changed = true;
            oldObj = {_id: id, type: objects[id].type};
            delete objects[id];
        }

        // prepend to event table
        var value = JSON.stringify(obj);
        if (value.length > 30) value = '<span title="' + value + '">' + value.substring(0, 30) + '...</span>';
        var row = '<tr><td>objectChange</td><td>' + id + '</td><td>' + value + '</td></tr>';
        $('#events').prepend(row);

        //if (!changed) return;

        // TODO update gridObjects

        // Update Instance Table
        if (id.match(/^system\.adapter\.[a-zA-Z0-9-_]+\.[0-9]+$/)) {
            if (obj) {
                if (instances.indexOf(id) == -1) instances.push(id);
            } else {
                i = instances.indexOf(id);
                if (i != -1) {
                    instances.splice(i, 1);
                }
            }
            if (obj && id.match(/^system\.adapter\.history\.[0-9]+$/)) {
                // Update all states if history enabled or disabled
                // Update history button
                var enabled = obj.common.enabled;
                var rowsData = $gridStates.jqGrid('getRowData');
                for (i = 0; i < rowsData.length; i++) {
                    if (enabled && id.substring(id.length - '.messagebox'.length) != '.messagebox') {
                        // Check if history enabled
                        historyEnabled = '';
                        if (objects[rowsData[i]._id] &&
                            objects[rowsData[i]._id].common &&
                            objects[rowsData[i]._id].common.history &&
                            objects[rowsData[i]._id].common.history.enabled) historyEnabled = ' history-enabled';
                        rowsData[i].history = '<button data-id="' + id + '" class="history' + historyEnabled + '" id="history_' + rowsData[i]._id + '">' + _('history') + '</button>';
                    } else {
                        rowsData[i].history = '';
                    }
                    $gridStates.jqGrid('setRowData', 'state_' + rowsData[i]._id.replace(/ /g, '_'), rowsData[i]);
                }
                $('.history').each(function (id) {
                    prepareHistoryButton(this);
                });
            }

            if (typeof $gridInstance !== 'undefined' && $gridInstance[0]._isInited) {
                initInstances(true);
            }
        }

        // Update Adapter Table
        /*if (id.match(/^system\.adapter\.[a-zA-Z0-9-_]+$/)) {
            if (obj) {
                if (adapters.indexOf(id) == -1) adapters.push(id);
            } else {
                var j = adapters.indexOf(id);
                if (j != -1) {
                    adapters.splice(j, 1);
                }
            }
            if (typeof $gridAdapter != 'undefined' && $gridAdapter[0]._isInited) {
                initAdapters(true);
            }
        }*/
        // Update users
        if (id.substring(0, "system.user.".length) == "system.user.") {
            if (obj) {
                if (users.indexOf(id) == -1) users.push(id);
            } else {
                var k = users.indexOf(id);
                if (k != -1) {
                    users.splice(k, 1);
                }
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
        if (id.substring(0, "system.host.".length) == "system.host.") {
            var found = false;
            for (i = 0; i < hosts.length; i++) {
                if (hosts[i].id == id) {
                    found = true;
                    break;
                }
            }

            if (obj) {
                if (!found) hosts.push({id: id, address: obj.common.address[0], name: obj.common.name});
            } else {
                if (found) hosts.splice(i, 1);
            }
            if (updateTimers.initHosts) {
                clearTimeout(updateTimers.initHosts);
            }
            updateTimers.initHosts = setTimeout(function () {
                updateTimers.initHosts = null;
                initHosts(true);
                initHostsList();
            }, 200);
        }

        // Update groups
        if (id.substring(0, "system.group.".length) == "system.group.") {
            if (obj) {
                if (groups.indexOf(id) == -1) groups.push(id);
            } else {
                j = groups.indexOf(id);
                if (j != -1) {
                    groups.splice(j, 1);
                }
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
        if (id.substring(0, 'enum.'.length) == 'enum.') {
            if (obj) {
                if (enums.indexOf(id) == -1) enums.push(id);
            } else {
                j = enums.indexOf(id);
                if (j != -1) {
                    enums.splice(j, 1);
                }
            }

            if (updateTimers.initEnums) {
                clearTimeout(updateTimers.initEnums);
            }
            updateTimers.initEnums = setTimeout(function () {
                updateTimers.initEnums = null;
                initEnums(true);
            }, 200);
        }

        // Update states
        if (obj && obj.type == 'state') {
            // Update history button
            var rowData = $gridStates.jqGrid('getRowData', 'state_' + id);
            if (!rowData || !rowData._id) {
                $gridStates.jqGrid('addRowData', 'state_' + id.replace(/ /g, '_'), convertState(id, obj));
            } else {
                if (objects['system.adapter.history.0'] && objects['system.adapter.history.0'].common.enabled &&
                    id.substring(id.length - '.messagebox'.length) != '.messagebox') {

                    // Check if history enabled
                    historyEnabled = '';
                    if (obj && obj.common && obj.common.history && obj.common.history.enabled) historyEnabled = ' history-enabled';
                    rowData.history = '<button data-id="' + id + '" class="history' + historyEnabled + '" id="history_' + id + '">' + _('history') + '</button>';
                } else {
                    rowData.history = '';
                }
                $gridStates.jqGrid('setRowData', 'state_' + id.replace(/ /g, '_'), rowData);
            }
            $('.history').each(function (id) {
                prepareHistoryButton(this);
            });
        } else if (oldObj && oldObj.type == 'state') {
            // Delete state line
            $gridStates.jqGrid('delRowData', 'state_' + id);
        }
    });

    socket.on('cmdStdout', function (_id, text) {
        if (activeCmdId == _id) {
            stdout += '\n' + text;
            $stdout.val(stdout);
            $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
        }
    });

    socket.on('cmdStderr', function (_id, text) {
        if (activeCmdId == _id) {
            stdout += '\nERROR: ' + text;
            $stdout.val(stdout);
            $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
        }
    });

    socket.on('cmdExit', function (_id, exitCode) {
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

    socket.on('connect', function () {
        $('#connecting').hide();
        if (firstConnect) {
            firstConnect = false;

            socket.emit('authEnabled', function (auth) {
                if (!auth) $('#button-logout').remove();
            });

            // Read system configuration
            socket.emit('getObject', 'system.config', function (err, data) {
                systemConfig = data;
                socket.emit('getObject', 'system.repositories', function (err, repo) {
                    systemRepos = repo;
                    socket.emit('getObject', 'system.certificates', function (err, certs) {
                        systemCerts = certs;
                        if (!err && systemConfig && systemConfig.common) {
                            systemLang = systemConfig.common.language || systemLang;
                            if (!systemConfig.common.licenseConfirmed) {
                                // Show license agreement
                                var language = systemConfig.common.language || window.navigator.userLanguage || window.navigator.language;
                                if (language != 'en' && language != 'de' && language != 'ru') language = 'en';

                                $('#license_text').html(license[language] || license.en);
                                $('#license_language').val(language).show();

                                $('#license_language').change(function () {
                                    language = $(this).val();
                                    $('#license_text').html(license[language] || license.en);
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
                                                socket.emit('extendObject', 'system.config', {
                                                    common: {
                                                        licenseConfirmed: true,
                                                        language: language
                                                    }
                                                }, function () {
                                                    $dialogLicense.dialog('close');
                                                    $('#license_language').hide();
                                                });

                                            }
                                        },
                                        {
                                            text: _('not agree'),
                                            click: function () {
                                                location.reload();
                                            }
                                        }
                                    ],
                                    close: function () {

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
                            systemConfig = {
                                type: 'config',
                                common: {
                                    name: 'system.config',
                                    language: '',           // Default language for adapters. Adapters can use different values.
                                    tempUnit: '°C',         // Default temperature units.
                                    currency: '€',          // Default currency sign.
                                    dateFormat: 'DD.MM.YYYY', // Default date format.
                                    isFloatComma: true,         // Default float divider ('.' - false, ',' - true)
                                    licenseConfirmed: false         // If license agreement confirmed
                                }
                            };
                            systemConfig.common.language = window.navigator.userLanguage || window.navigator.language;

                            if (systemConfig.common.language !== 'en' && systemConfig.common.language !== 'de' && systemConfig.common.language !== 'ru') {
                                systemConfig.common.language = 'en';
                            }
                        }

                        translateAll();

                        // Here we go!
                        $('#tabs').show();
                        prepareEnumMembers();
                        prepareHosts();
                        prepareObjects();
                        prepareEnums();
                        prepareStates();
                        prepareAdapters();
                        prepareInstances();
                        prepareUsers();
                        prepareGroups();
                        prepareScripts();
                        prepareHistory();
                        prepareRepos();
                        prepareCerts();
                        resizeGrids();

                        $("#load_grid-select-member").show();
                        $("#load_grid-objects").show();
                        $("#load_grid-enums").show();
                        $("#load_grid-states").show();
                        $("#load_grid-scripts").show();
                        $("#load_grid-adapters").show();
                        $("#load_grid-instances").show();
                        $("#load_grid-users").show();
                        $("#load_grid-groups").show();

                        // bind "clear events" button
                        $('#event-clear').button({
                            icons: {
                                primary: 'ui-icon-trash'
                            }
                        }).unbind('click').click(function () {
                            $('#event-table').html('');
                        });

                        getStates(getObjects());
                    });
                });
            });
        }
    });

    socket.on('disconnect', function () {
        $('#connecting').show();
    });

    socket.on('reconnect', function () {
        $('#connecting').hide();
    });


    // Helper methods
    function upToDate(_new, old) {
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
    }

    function formatDate(dateObj) {
        return dateObj.getFullYear() + '-' +
            ("0" + (dateObj.getMonth() + 1).toString(10)).slice(-2) + '-' +
            ("0" + (dateObj.getDate()).toString(10)).slice(-2) + ' ' +
            ("0" + (dateObj.getHours()).toString(10)).slice(-2) + ':' +
            ("0" + (dateObj.getMinutes()).toString(10)).slice(-2) + ':' +
            ("0" + (dateObj.getSeconds()).toString(10)).slice(-2);
    }

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
        $gridStates.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridObjects.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridEnums.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridAdapter.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridInstance.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridScripts.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridUsers.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridGroups.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridHosts.setGridHeight(y - 150).setGridWidth(x - 20);
        $('.subgrid-level-1').setGridWidth(x - 67);
        $('.subgrid-level-2').setGridWidth(x - 94);
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

