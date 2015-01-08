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

    // Todo put this in adapter instance config
    var historyMaxAge =         86400; // Maxmimum datapoint age to be shown in gridHistory (seconds)

    var objectTree =            {name: '', children:{}, count: 0};
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
    var enumCurrentParent =     '';
    var historyEnabled =        null;

    var systemConfig;
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

    var logLinesCount =         0;
    var logLinesStart =         0;
    var logHosts =              [];
    var logFilterTimeout =      null;

    var $stdout =               $('#stdout');
    var $configFrame =          $('#config-iframe');
    var $selectId =             null;

    var $dialogCommand =        $('#dialog-command');
    var $dialogEnumMembers =    $('#dialog-enum-members');
    var $dialogEnum =           $('#dialog-enum');
    var $dialogConfig =         $('#dialog-config');
    var $dialogScript =         $('#dialog-script');
    var $dialogObject =         $('#dialog-object');
    var $dialogUser =           $('#dialog-user');
    var $dialogGroup =          $('#dialog-group');
    var $dialogLicense =        $('#dialog-license');
    var $dialogHistory =        $('#dialog-history');
    var $dialogSystem =         $('#dialog-system');
    var $dialogMessage =        $('#dialog-message');

    var $gridUsers =            $('#grid-users');
    var $gridGroups =           $('#grid-groups');
    var $gridEnums =            $('#grid-enums');
    var $gridEnumMembers =      $('#grid-enum-members');
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
    var waitForRestart =        false;
    var objectsLoaded =         false;

    var enumEdit =              null;
    var currentHost =           '';
    var curRepository =         null;
    var curInstalled =          null;
    var currentHistory =        null; // Id of the currently shown history dialog
    var historyIds =            [];

    var editor =                null;

    // jQuery UI initializations
    $('#tabs').tabs({
        activate: function (event, ui) {
            window.location.hash = '#' + ui.newPanel.selector.slice(5);
            switch (ui.newPanel.selector) {
                case '#tab-objects':
                    initObjects();
                    break;

                case '#tab-hosts':
                    initHosts();
                    break;

                case '#tab-states':
                    initStates();
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

                case '#tab-log':
                    initLogs();
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
            showMessage(_('Invalid certificate "%s". To short.', name));
            return '';
        }
        var lines = [];
        if (str.substring(0, '-----BEGIN RSA PRIVATE KEY-----'.length) == '-----BEGIN RSA PRIVATE KEY-----') {
            if (str.substring(str.length -  '-----END RSA PRIVATE KEY-----'.length) != '-----END RSA PRIVATE KEY-----') {
                showMessage(_('Certificate "%s" must end with "-----END RSA PRIVATE KEY-----".', name), '', 'notice');
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
                showMessage(_('Certificate "%s" must start with "-----BEGIN CERTIFICATE-----".', name), '', 'notice');
                return '';
            }
            if (str.substring(str.length -  '-----END CERTIFICATE-----'.length) != '-----END CERTIFICATE-----') {
                showMessage(_('Certificate "%s" must end with "-----END CERTIFICATE-----".', name), '', 'notice');
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

    // Set modified history states
    function setHistory(ids, callback) {
        var id = ids.pop();
        if (id) {
            $dialogHistory.dialog('option', 'title', _('History of %s states', ids.length));

            socket.emit('setObject', id, objects[id], function () {
                setTimeout(setHistory, 50, ids, callback);
            });
        } else {
            if (callback) callback();
        }
    }

    // Use the function for this because it must be done after the language was read
    function initAllDialogs() {

        initGridLanguage(systemConfig.common.language);

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
                                    if (activeRepoChanged) {
                                        setTimeout(function () {
                                            initAdapters(true);
                                        }, 0);
                                    }
                                }
                            }

                            socket.emit('extendObject', 'system.repositories', systemRepos, function (err) {
                                if (activeRepoChanged) {
                                    setTimeout(function () {
                                        initAdapters(true);
                                    }, 0);
                                }

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
                            showMessage(_('Empty name!'), '', 'notice');
                            return;
                        }
                        if (objects[(enumCurrentParent || 'enum') + '.' + name]) {
                            showMessage(_('Name yet exists!'), '', 'notice');
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
                    text: _('Save'),
                    click: function () {
                        var ids =           JSON.parse($('#edit-history-ids').val());
                        var minLength =     parseInt($('#edit-history-minLength').val(), 10) || 480;

                        // do not update charts
                        currentHistory = null;
                        historyIds = ids;

                        for(var i = 0; i < ids.length; i++) {
                            objects[ids[i]].common.history = {
                                enabled:     $('#edit-history-enabled').is(':checked'),
                                changesOnly: $('#edit-history-changesOnly').is(':checked'),
                                minLength:   minLength,
                                maxLength:   minLength * 2,
                                retention:   parseInt($('#edit-history-retention').val(), 10) || 0,
                                debounce:    parseInt($('#edit-history-debounce').val(),  10) || 1000
                            };
                        }
                        setHistory(ids, function () {
                            $dialogHistory.dialog('close');
                        });
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        $dialogHistory.dialog('close');
                    }
                }
            ],
            open: function (event, ui) {
                $gridHistory.setGridHeight($(this).height() - 180).setGridWidth($(this).width() - 30);
                $('#iframe-history-chart').css({height: $(this).height() - 115, width: $(this).width() - 30});
            },
            close: function () {
                $('#iframe-history-chart').attr('src', '');
            },
            resize: function () {
                $gridHistory.setGridHeight($(this).height() - 180).setGridWidth($(this).width() - 30);
                $('#iframe-history-chart').css({height: $(this).height() - 115, width: $(this).width() - 30});
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
    }

    function showMessage(message, title, icon) {
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
    }

    $('#enum-name').keyup(function () {
        var t = $('#enum-gen-id');
        t.html(t[0]._original + '.' + $(this).val().replace(/ /, '_').toLowerCase());
    });

    $('#log-filter-severity').change(filterLog);
    $('#log-filter-host').change(filterLog);
    $('#log-filter-message').change(function () {
        if (logFilterTimeout) clearTimeout(logFilterTimeout);
        logFilterTimeout = setTimeout(filterLog, 1000);
    }).keyup(function (e) {
        if (e.which == 13) {
            filterLog();
        } else {
            $(this).trigger('change');
        }
    });
    $('#log-filter-message-clear').button({icons:{primary: 'ui-icon-close'}, text: false}).css({height: 18, width: 18}).click(function () {
        if ($('#log-filter-message').val() !== '') {
            $('#log-filter-message').val('').trigger('change');
        }
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
    $('#log-clear-on-disk').button({icons:{primary: 'ui-icon-trash'}, text: false}).click(function () {
        if (confirm(_('Log file will be deleted. Are you sure?'))) {
            socket.emit('sendToHost', currentHost, 'delLogs', null, function () {
                $('#log-table').html('');
                logLinesCount = 0;
                logLinesStart = 0;
                $('a[href="#tab-log"]').removeClass('errorLog');
                setTimeout(function () {
                    initLogs();
                }, 0);
            });
        }
    }).css({width: 20, height: 20}).addClass("ui-state-error");

    $('#log-refresh').button({icons:{primary: 'ui-icon-refresh'}, text: false}).click(function () {
        $('#log-table').html('');
        logLinesCount = 0;
        logLinesStart = 0;
        $('a[href="#tab-log"]').removeClass('errorLog');
        initLogs();
    }).css({width: 20, height: 20});

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

    function initSelectId() {
        if ($selectId) return;
        $selectId = $('#dialog-select-member').selectId('init',
            {
                objects: objects,
                states:  states,
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
    }

    function checkHistory() {
        if (objects['system.adapter.history.0'] && objects['system.adapter.history.0'].common.enabled) {
            if (historyEnabled !== null && historyEnabled != true) {
                historyEnabled = true;
                // update history buttons
                initObjects(true);
            } else {
                historyEnabled = true;
            }
        } else {
            if (historyEnabled !== null && historyEnabled != false) {
                historyEnabled = false;
                // update history buttons
                initObjects(true);
            } else {
                historyEnabled = false;
            }
        }
    }

    // ----------------------------- Grids and Dialog inits ------------------------------------------------
    function openHistoryDlg(ids) {
        if (typeof ids != 'object') ids = [ids];

        for (var i = 0; i < ids.length; i++) {
            if (!objects[ids[i]]) {
                var p = ids[i].split('.');
                p.splice(2);
                objects[ids[i]] = {
                    type:   'state',
                    parent: p.join('.'),
                    common: {
                        // TODO define role somehow
                        type: states[ids[i]] ? getType(states[ids[i]].val) : 'mixed',
                        name: ids[i]
                    }
                };
            }
            if (!objects[ids[i]].common.history) {
                objects[ids[i]].common.history = {
                    enabled:        false,
                    changesOnly:    true,
                    debounce:       10000, // de-bounce interval
                    // use default value from history-adadpter config
                    minLength:      (objects['system.adapter.history.0'] && objects['system.adapter.history.0'].native) ? objects['system.adapter.history.0'].native.minLength || 480 : 480,
                    retention:      604800 // one week by default
                };
            }
        }

        var title;
        if (ids.length == 1) {
            title = _('History of %s', ids[0]);
            currentHistory = objects[ids[0]].common.history.enabled ? ids[0]: null;
        } else {
            title = _('History of %s states', ids.length);
            currentHistory = null;
        }
        $('#edit-history-ids').val(JSON.stringify(ids));

        $('#edit-history-enabled').prop('checked', objects[ids[0]].common.history.enabled);
        $('#edit-history-changesOnly').prop('checked', objects[ids[0]].common.history.changesOnly);

        $('#edit-history-minLength').val(objects[ids[0]].common.history.minLength);
        $('#edit-history-debounce').val(objects[ids[0]].common.history.debounce);
        $('#edit-history-retention').val(objects[ids[0]].common.history.retention);
        $dialogHistory.dialog('option', 'title', title);
        $gridHistory.jqGrid('clearGridData');
        $("#load_grid-history").show();

        var start = Math.round((new Date()).getTime() / 1000) - historyMaxAge;
        var end =   Math.round((new Date()).getTime() / 1000) + 5000;
        //console.log('getStateHistory', id, start, end)
        var tabs = $('#tabs-history');

        var port = 0;
        var chart = false;
        if (ids.length == 1) {
            $dialogHistory.dialog('option', 'height', 575);
            $dialogHistory.dialog('open');
            tabs[0]._id = ids[0];
            tabs.show();
            if (!tabs[0]._inited) {
                tabs[0]._inited = true;
                tabs.tabs({
                    activate: function (event, ui) {
                        switch (ui.newPanel.selector) {
                            case '#tab-history-table':
                                $('#iframe-history-chart').attr('src', '');
                                break;

                            case '#tab-history-chart':
                                var port = 0;
                                var chart = false;
                                var _id = this._id;
                                for (var i = 0; i < instances.length; i++) {
                                    if (objects[instances[i]].common.name == 'rickshaw' && objects[instances[i]].common.enabled) {
                                        chart = 'rickshaw';
                                    } else
                                    if (objects[instances[i]].common.name == 'web' && objects[instances[i]].common.enabled) {
                                        port = objects[instances[i]].native.port;
                                    }
                                    if (chart && port) break;
                                }
                                var $chart = $('#iframe-history-chart');

                                $chart.attr('src', 'http://' + location.hostname + ':' + port + '/' + chart + '/index.html?axeX=lines&axeY=inside&_ids=' + encodeURI(_id) + '&width=' + ($chart.width() - 10) + '&hoverDetail=true&height=' + ($chart.height() - 10));
                                break;

                        }
                    },
                    create: function () {
                    }
                });
            } else {
                tabs.tabs({active: 0});
            }

            // Check if chart enabled and set
            for (var i = 0; i < instances.length; i++) {
                if (objects[instances[i]].common.name == 'rickshaw' && objects[instances[i]].common.enabled) {
                    chart = 'rickshaw';
                } else
                if (objects[instances[i]].common.name == 'web'      && objects[instances[i]].common.enabled) {
                    port = objects[instances[i]].native.port;
                }
                if (chart && port) break;
            }

            socket.emit('getStateHistory', ids[0], start, end, function (err, res) {
                setTimeout(function () {
                    if (!err) {
                        var rows = [];
                        //console.log('got ' + res.length + ' history datapoints for ' + id);
                        for (var i = 0; i < res.length; i++) {
                            rows.push({
                                gid: i,
                                id:  res[i].id,
                                ack: res[i].ack,
                                val: res[i].val,
                                ts:  formatDate(res[i].ts, true),
                                lc:  formatDate(res[i].lc, true)
                            });
                        }
                        $gridHistory[0]._maxGid = res.length;
                        $gridHistory.jqGrid('addRowData', 'gid', rows);
                        $gridHistory.trigger('reloadGrid');
                    } else {
                        console.log(err);
                    }
                }, 0);
            });
            tabs.tabs('option', 'disabled', (port && chart && currentHistory) ? [] : [1]);
        } else {
            $dialogHistory.dialog('option', 'height', 150);
            tabs.hide();
            $dialogHistory.dialog('open');
        }
    }
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
            width: 750,
            height: 300,
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
            openHistoryDlg($(this).attr('data-id'));
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
                var obj = objects[enumEdit];
                var idx = obj.common.members.indexOf(id);
                if (idx !== -1) {
                    obj.common.members.splice(idx, 1);
                    objects[enumEdit] = obj;
                    socket.emit('setObject', enumEdit, obj, function () {
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
                initSelectId();

                $selectId.selectId('show', function (newId, oldId) {
                    var obj = objects[enumEdit];
                    if (obj.common.members.indexOf(newId) === -1) {
                        obj.common.members.push(newId);

                        socket.emit('setObject', enumEdit, obj, function () {
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

    function prepareObjects() {
        $dialogObject.dialog({
            autoOpen:   false,
            modal:      true,
            width: 800,
            height: 640,
            buttons: [
                {
                    text: _('Save'),
                    click: saveObject
                },
                {
                    text: _('Cancel'),
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
    }

    function prepareEnums() {
        /*$gridEnums.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('members'), ''],
            colModel: [
                {name: '_id',       index: '_id', width: 450, fixed: true, editable: true},
                {name: 'name',      index: 'name', editable: true},
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
                var leaf = treeFindLeaf(rowid.substring(5));//"enum.".length
                if (!leaf || !leaf.count) {
                    $('td.sgcollapsed', '[id="' + rowid + '"]').empty().removeClass('ui-sgcollapsed sgcollapsed');
                }
            },
            loadComplete: function () {
                initEnumButtons();
            },
            ondblClickRow: function (rowid) {
                onEditEnum($gridEnums, rowid.substring('enum_'.length));
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:     true,
            searchOnEnter:  false,
            enableClear:    false,
            afterSearch: function () {
                initEnumButtons();
            }
        }).navGrid('#pager-enums', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
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
                var t = $('#enum-gen-id');
                t[0]._original = (enumCurrentParent || 'enum');
                t.html(newId);
                $dialogEnum.dialog('open');
            },
            position: 'first',
            id:       'add-enum',
            title:    _('New enum'),
            cursor:  'pointer'
        });*/
    }

    function prepareStates() {
        var stateEdit = false;
        var stateLastSelected;

        // TODO hide column history if no instance of history-adapter enabled
        $gridStates.jqGrid({
            datatype: 'local',
            colNames: ['id', _('parent name'), _('name'), _('val'), _('ack'), _('from'), _('ts'), _('lc')],
            colModel: [
                {name: '_id',       index: '_id',       width: 250, fixed: false},
                {name: 'pname',     index: 'pname',     width: 250, fixed: false},
                {name: 'name',      index: 'name',      width: 250, fixed: false},
                {name: 'val',       index: 'val',       width: 160, editable: true},
                {name: 'ack',       index: 'ack',       width: 60,  fixed: false, editable: true, edittype: 'checkbox', editoptions: {value: "true:false"}},
                {name: 'from',      index: 'from',      width: 80,  fixed: false},
                {name: 'ts',        index: 'ts',        width: 140, fixed: false},
                {name: 'lc',        index: 'lc',        width: 140, fixed: false}
            ],
            pager: $('#pager-states'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker States'),
            ignoreCase: true,
            ondblClickRow: function (id) {
                var rowData = $gridStates.jqGrid('getRowData', id);
                rowData.ack = false;
                rowData.from = '';
                $gridStates.jqGrid('setRowData', id, rowData);

                if (id && id !== stateLastSelected) {
                    $gridStates.restoreRow(stateLastSelected);
                    stateLastSelected = id;
                }
                var _id = id.substring(6);//'state_'.length
                if (objects[_id] && objects[_id].common && objects[_id].common.type == 'boolean') {
                    $gridStates.setColProp('val', {
                        editable:    true,
                        edittype:    'checkbox',
                        editoptions: {value: 'true:false'}
                    });
                } else if (objects[_id] && objects[_id].common && objects[_id].common.type == 'number' && objects[_id].common.states) {
                    $gridStates.setColProp('val', {
                        editable:    true,
                        edittype:    'select',
                        editoptions: {value: objects[_id].common.states.join(':')},
                        align:       'center'
                    });
                } else {
                    $gridStates.setColProp('val', {
                        editable:    true,
                        edittype:    'text',
                        editoptions: null,
                        align:       'center'
                    });
                }

                $gridStates.editRow(id, true, function () {
                    // onEdit
                    stateEdit = true;
                }, function (obj) {
                    // success
                }, 'clientArray', null, function () {
                    // afterSave
                    stateEdit = false;
                    var val = $gridStates.jqGrid('getCell', stateLastSelected, 'val');

                    if (val === 'true')  val = true;
                    if (val === 'false') val = false;

                    if (parseFloat(val) == val) val = parseFloat(val);

                    var ack = $gridStates.jqGrid('getCell', stateLastSelected, 'ack');

                    if (ack === 'true')  ack = true;
                    if (ack === 'false') ack = false;

                    var id = $('tr[id="' + stateLastSelected + '"]').find('td[aria-describedby$="_id"]').html();
                    socket.emit('setState', id, {val: val, ack: ack});
                    stateLastSelected = null;
                });
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false,
            afterSearch:   function () {
                //initStateButtons();
            }
        }).navGrid('#pager-states', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-states', {
            caption: '',
            buttonicon: 'ui-icon-refresh',
            onClickButton: function () {
                initStates(true);
            },
            position: 'first',
            id:       'update-states',
            title:    _('Update states'),
            cursor:   'pointer'
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
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false,
            afterSearch:   function () {
                initAdapterButtons();
            }
        }).navGrid('#pager-adapters', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
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
                {name: 'enabled',   index: 'enabled',   width: 60,   editable: true, edittype: 'checkbox', editoptions: {value: 'true:false'}, align: 'center'},
                {name: 'host',      index: 'host',      width: 100,  editable: true, edittype: 'select', editoptions: ''},
                {name: 'mode',      index: 'mode',      width: 80,   editable: true, edittype: 'select', editoptions: {value: null}, align: 'center'},
                {name: 'schedule',  index: 'schedule',  width: 80,   align: 'center', editable: true},
                {name: 'buttons',   index: 'buttons',   width: 80,   align: 'center', sortable: false, search: false},
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
            ondblClickRow: function (rowId, e) {
                var rowData = $gridInstance.jqGrid('getRowData', rowId);
                onEditInstance(rowData._id);
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false,
            afterSearch:   function () {
                initInstanceButtons();
            }
        }).navGrid('#pager-instances', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
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
                var obj = $gridInstance.jqGrid('getRowData', objSelected);
                editObject(obj._id);
            },
            position: 'first',
            id: 'edit-instance',
            title: _('edit instance'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-instances', {
            caption:    '',
            buttonicon: 'ui-icon-refresh',
            onClickButton: function () {
                initInstances(true);
            },
            position:   'first',
            id:         'reload-instances',
            title:      _('reload instance'),
            cursor:     'pointer'
        });
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
                if (window.confirm("Are you sure?")) {
                    socket.emit('delUser', id.replace("system.user.", ""), function (err) {
                        if (err) {
                            showMessage(_('Cannot delete user: ') + err, '', 'alert');
                        } else {
                            setTimeout(function () {
                                delUser(id);
                            }, 0);
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
                    showMessage(_('Invalid object %s', objSelected), '', 'alert');
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
                        socket.emit('extendObject', id, obj, function (err, obj) {
                            if (err) {
                                // Cannot modify
                                showMessage(_('Cannot change group'), '', 'alert');
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
                if (window.confirm("Are you sure?")) {
                    socket.emit('delGroup', id.replace("system.group.", ""), function (err) {
                        if (err) {
                            showMessage(_('Cannot delete group: %s', err), '', 'alert');
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
                    showMessage(_('Invalid object %s', objSelected), '', 'alert');
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
    
    function prepareScripts() {
        $gridScripts.jqGrid({
            datatype: 'local',
            colNames: ['_id', 'id', _('name'), _('engine type'), _('enabled'), _('engine'), ''],
            colModel: [
                {name: '_id',        index: '_id', hidden: true},
                {name: '_obj_id',    index: '_obj_id'},
                {name: 'name',       index: 'name',     editable: true},
                {name: 'engineType', index: 'engineType'},
                {name: 'enabled',    index: 'enabled',  editable: true, edittype: 'checkbox', editoptions: {value: "true:false"}},
                {name: 'engine',     index: 'engine',   editable: true, edittype: 'select', editoptions: ''},
                {name: 'commands',   index: 'commands', editable: false, width: 80, align: 'center'}
            ],
            pager: $('#pager-scripts'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker adapter scripts'),
            ignoreCase: true,
            ondblClickRow: function (rowid) {
                onEditScript(rowid.substring('script_'.length));
            },
            gridComplete: function () {
                /*$('#del-script').addClass('ui-state-disabled');
                $('#edit-script').addClass('ui-state-disabled');*/
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false,
            afterSearch:   function () {
                initScriptButtons();
            }
        }).navGrid('#pager-scripts', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-scripts', {
                caption: '',
                buttonicon: 'ui-icon-plus',
                onClickButton: function () {
                    // Find last id;
                    var id = 1;
                    var ids = $gridScripts.jqGrid('getDataIDs');
                    while (ids.indexOf('script_' + id) != -1) {
                        id++;
                    }
                    // Find new unique name
                    var found;
                    var newText = _("Script");
                    var idx = 1;
                    do {
                        found = true;
                        for (var _id = 0; _id < ids.length; _id++) {
                            var obj = $gridScripts.jqGrid('getRowData', ids[_id]);
                            if (obj && obj.name == newText + idx)  {
                                idx++;
                                found = false;
                                break;
                            }
                        }
                    } while (!found);
                    var name = newText + idx;
                    var instance = '';
                    var engineType = '';

                    // find first instance
                    for (var i = 0; i < instances.length; i++) {
                        if (objects[instances[i]] && objects[instances[i]] && objects[instances[i]].common.engineTypes) {
                            instance = instances[i];
                            if (typeof objects[instances[i]].common.engineTypes == 'string') {
                                engineType = objects[instances[i]].common.engineTypes;
                            } else {
                                engineType = objects[instances[i]].common.engineTypes[0];
                            }
                            break;
                        }
                    }

                    socket.emit('setObject', 'script.js.' + name.replace(/ /g, '_').replace(/\./g, '_'), {
                        common: {
                            name:       name,
                            engineType: engineType,
                            source:     '',
                            enabled:    false,
                            engine:     instance
                        },
                        type: 'script'
                    });
                },
                position: 'first',
                id:       'add-script',
                title:    _('new script'),
                cursor:   'pointer'
            });

        $dialogScript.dialog({
            autoOpen:   false,
            modal:      true,
            width: 800,
            height: 540,
            buttons: [
                {
                    text: _('Save'),
                    click: saveScript
                },
                {
                    text: _('Cancel'),
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
                    initAdapters(true, false);
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

    // ----------------------------- Adpaters show and Edit ------------------------------------------------
    function initAdapters(update, updateRepo) {
        $gridAdapter.jqGrid('clearGridData');
        $("#load_grid-adapters").show();
        $('a[href="#tab-adapters"]').removeClass('updateReady');

        $("#load_grid-adapters").show();

        getAdaptersInfo(currentHost, update, updateRepo, function (repository, installedList) {
            var id = 1;
            var obj;
            var version;
            var tmp;
            var adapter;

            var listInstalled    = [];
            var listUnsinstalled = [];

            if (installedList) {
                for (adapter in installedList) {
                    obj = installedList[adapter];
                    if (!obj || obj.controller || adapter == 'hosts') continue;
                    listInstalled.push(adapter);
                }
                listInstalled.sort();
            }

            // List of adapters for repository
            for (adapter in repository) {
                obj = repository[adapter];
                if (!obj || obj.controller) continue;
                version = '';
                if (installedList && installedList[adapter]) continue;
                listUnsinstalled.push(adapter);
            }
            listUnsinstalled.sort();

            // list of the installed adapters
            for (var i = 0; i < listInstalled.length; i++) {
                adapter = listInstalled[i];
                obj = installedList ? installedList[adapter] : null;
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
                if (installedList && installedList[adapter]) continue;

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
            getAdaptersInfo(currentHost, false, false, function (repo, installed) {
                var obj = repo[adapter];

                if (!obj) obj = installed[adapter];

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
            var aName = $(this).attr('data-adapter-name');
            if (aName == 'admin') waitForRestart = true;

            cmdExec(currentHost, 'upgrade ' + aName, function (exitCode) {
                if (!exitCode) initAdapters(true);
            });
        });
    }

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


        $gridAdapter.trigger('reloadGrid');
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


        $gridAdapter.trigger('reloadGrid');
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

    // -------------------------------- Logs ------------------------------------------------------------
    function initLogs() {
        if (!currentHost) {
            setTimeout(initLogs, 500);
            return;
        }

        $('#log-table').html('');
        socket.emit('sendToHost', currentHost, 'getLogs', 200, function (lines) {
            setTimeout(function () {
                var message = {message: '', severity: 'debug', from: '', ts: ''};
                var size = lines ? lines.pop() : -1;
                if (size != -1) {
                    size = parseInt(size);
                    $('#log-size').html((_('Log size:') + ' ' + ((size / (1024 * 1024)).toFixed(2) + ' MB ')).replace(/ /g, '&nbsp;'));
                }
                for (var i = 0; i < lines.length; i++) {
                    if (!lines[i]) continue;
                    // 2014-12-05 14:47:10.739 - info: iobroker  ERR! network In most cases you are behind a proxy or have bad network settings.npm ERR! network
                    if (lines[i][4] == '-' && lines[i][7] == '-') {
                        message.ts = lines[i].substring(0, 23);
                        var pos = lines[i].indexOf('[39m:');
                        message.severity = lines[i].substring(32, pos - 1);
                        lines[i] = lines[i].substring(pos + 6);
                        pos = lines[i].indexOf(' ');
                        message.from = lines[i].substring(0, pos);
                        message.message = lines[i].substring(pos);
                    } else {
                        message.message = lines[i];
                    }
                    addMessageLog(message);
                }
            }, 0);
        });
    }
    function addMessageLog(message) {
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
                $('#log-filter-host').append('<option value="' + logHosts[i] + '" ' + ((logHosts[i] == hostFilter) ? 'selected' : '') + '>' + logHosts[i] + '</option>');
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

        var text = '<tr id="log-line-' + (logLinesStart + logLinesCount) + '" class="log-line log-severity-' + message.severity + ' log-from-' + (message.from || '') + '" style="' + visible + '">';
        text += '<td class="log-column-1">' + (message.from || '') + '</td>';
        text += '<td class="log-column-2">' + formatDate(message.ts) + '</td>';
        text += '<td class="log-column-3">' + message.severity + '</td>';
        text += '<td class="log-column-4" title="' + message.message.replace(/"/g, "'") + '">' + message.message.substring(0, 200) + '</td></tr>';

        $('#log-table').prepend(text);
    }
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
                if (filterHost && !$(this).hasClass('log-from-' + filterHost)) {
                    $(this).hide();
                } else 
                if (filterMsg && $(this).html().indexOf(filterMsg) == -1) {
                    $(this).hide();
                }
            });
        }
    }


    // ----------------------------- Scripts show and Edit ------------------------------------------------

    // Find all script engines
    function fillEngines(id) {
        var engines = [];
        for (var t = 0; t < instances.length; t++) {
            if (objects[instances[t]] && objects[instances[t]].common && objects[instances[t]].common.engineTypes) {
                var engineTypes = objects[instances[t]].common.engineTypes;
                if (typeof engineTypes == 'string') {
                    if (engines.indexOf(engineTypes) == -1) engines.push(engineTypes);
                } else {
                    for (var z = 0; z < engineTypes.length; z++) {
                        if (engines.indexOf(engineTypes[z]) == -1) engines.push(engineTypes[z]);
                    }
                }
            }
        }
        if (id) {
            var text = '';
            for (var u = 0; u < engines.length; u++) {
                text += '<option value="' + engines[u] + '">' + engines[u] + '</option>';
            }
            $('#' + id).html(text);
        }
        return engines;
    }
    function onEditScript(id) {
        $('#add-script').addClass('ui-state-disabled');
        $('.script-edit-submit').hide();
        $('.script-edit-file-submit').hide();
        $('.script-delete-submit').hide();
        $('.script-reload-submit').hide();
        $('.script-ok-submit[data-script-id="' + id + '"]').show();
        $('.script-cancel-submit[data-script-id="' + id + '"]').show();

        var list = {};
        for (var i = 0; i < instances.length; i++) {
            if (instances[i].indexOf('.javascript.') != -1) {
                list[instances[i]] = instances[i];
            }
        }

        $gridScripts.setColProp('engine', {
            editable:    true,
            edittype:    'select',
            editoptions: {value: list},
            align:       'center'
        });

        $gridScripts.jqGrid('editRow', 'script_' + id, {"url": "clientArray"});
    }
    function updateScript(id, newCommon) {
        socket.emit('getObject', id, function (err, _obj) {
            setTimeout(function () {
                var obj = {common: {}};

                if (newCommon.engine  !== undefined) obj.common.engine  = newCommon.engine;
                if (newCommon.enabled !== undefined) obj.common.enabled = newCommon.enabled;

                if (obj.common.enabled === 'true')  obj.common.enabled = true;
                if (obj.common.enabled === 'false') obj.common.enabled = false;

                if (newCommon.source !== undefined) obj.common.source = newCommon.source;

                if (_obj && _obj.common && newCommon.name == _obj.common.name && (newCommon.engineType === undefined || newCommon.engineType == _obj.common.engineType)) {
                    socket.emit('extendObject', id, obj);
                } else {
                    var prefix;

                    _obj.common.engineType = newCommon.engineType || _obj.common.engineType || 'Javascript/js';
                    var parts = _obj.common.engineType.split('/');

                    prefix = 'script.' + (parts[1] || parts[0]) + '.';

                    if (_obj) {
                        socket.emit('delObject', _obj._id);
                        if (obj.common.engine  !== undefined) _obj.common.engine  = obj.common.engine;
                        if (obj.common.enabled !== undefined) _obj.common.enabled = obj.common.enabled;
                        if (obj.common.source  !== undefined) _obj.common.source  = obj.common.source;
                        if (obj.common.name    !== undefined) _obj.common.name    = obj.common.name;
                        delete _obj._rev;
                    } else {
                        _obj = obj;
                    }
                    // Name must always exist
                    _obj.common.name = newCommon.name;

                    _obj._id = prefix + newCommon.name.replace(/ /g, '_').replace(/\./g, '_');
                    socket.emit('setObject', _obj._id, _obj);
                }
            }, 0);
        });
    }
    function initScripts(update) {

        if (!objectsLoaded) {
            setTimeout(initScripts, 250);
            return;
        }
        if (!editor) {
            editor = ace.edit("script-editor");
            //editor.setTheme("ace/theme/monokai");
            editor.getSession().setMode("ace/mode/javascript");
            editor.resize();
            $('#edit-insert-id').button({
                icons: {primary: 'ui-icon-note'}
            }).css('height', '30px').click(function () {
                initSelectId();
                $selectId.selectId('show', function (newId) {
                    editor.insert('"' + newId + '"' + ((objects[newId] && objects[newId].common && objects[newId].common.name) ? ('/*' + objects[newId].common.name + '*/') : ''));
                });
            });
        }

        if (update || typeof $gridScripts != 'undefined' && !$gridScripts[0]._isInited) {
            $gridScripts[0]._isInited = true;
            $gridScripts.jqGrid('clearGridData');
            var id = 1;

            scripts.sort();
            for (var i = 0; i < scripts.length; i++) {
                var obj = objects[scripts[i]];
                if (!obj) continue;

                $gridScripts.jqGrid('addRowData', 'script_' + id, {
                    _id:        id,
                    _obj_id:    obj._id,
                    name:       obj.common ? obj.common.name     : '',
                    engineType: obj.common ? obj.common.engineType : '',
                    enabled:    obj.common ? obj.common.enabled  : '',
                    engine:     obj.common ? obj.common.engine   : '',
                    commands:
                        '<button data-script-id="' + id + '" class="script-edit-submit">'      + _('edit')   + '</button>' +
                        '<button data-script-id="' + id + '" class="script-edit-file-submit">' + _('edit file') + '</button>' +
                        '<button data-script-id="' + id + '" class="script-reload-submit">'    + _('restart script') + '</button>' +
                        '<button data-script-id="' + id + '" class="script-delete-submit">'    + _('delete') + '</button>' +
                        '<button data-script-id="' + id + '" class="script-ok-submit"     style="display:none">' + _('ok')     + '</button>' +
                        '<button data-script-id="' + id + '" class="script-cancel-submit" style="display:none">' + _('cancel') + '</button>'
                });
                id++;
            }
            $gridScripts.trigger('reloadGrid');
            initScriptButtons();
        }
    }
    function initScriptButtons() {
        $('.script-edit-submit').unbind('click').button({
            icons: {primary: 'ui-icon-pencil'},
            text:  false
        }).click(function () {
            onEditScript($(this).attr('data-script-id'));
        });

        $('.script-edit-file-submit').unbind('click').button({
            icons: {primary: 'ui-icon-note'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-script-id');
            var objSelected = $gridScripts.jqGrid('getRowData', 'script_' + id);
            if (objSelected) {
                editScript(objSelected._obj_id);
            }
        });

        $('.script-reload-submit').unbind('click').button({
            icons: {primary: 'ui-icon-refresh'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-script-id');
            var objSelected = $gridScripts.jqGrid('getRowData', 'script_' + id);
            socket.emit('extendObject', objSelected._obj_id, {});
        });

        $('.script-delete-submit').unbind('click').button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-script-id');
            var objNew = $gridScripts.jqGrid('getRowData', 'script_' + id);
            socket.emit('delObject', objNew._obj_id);

            //$gridScripts.jqGrid('delRowData', 'script_' + id);
        });

        $('.script-ok-submit').unbind('click').button({
            icons: {primary: 'ui-icon-check'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-script-id');
            $('.script-edit-submit').show();
            $('.script-edit-file-submit').show();
            $('.script-delete-submit').show();
            $('.script-reload-submit').show();
            $('.script-ok-submit').hide();
            $('.script-cancel-submit').hide();
            $('#add-script').removeClass('ui-state-disabled');

            $gridScripts.jqGrid('saveRow', 'script_' + id, {"url": "clientArray"});
            // afterSave
            setTimeout(function () {
                var objNew = $gridScripts.jqGrid('getRowData', 'script_' + id);
                updateScript(objNew._obj_id, objNew);

               /* socket.emit('getObject', objNew._obj_id, function (err, _obj) {
                    var obj = {common:{}};
                    obj.common.engine  = objNew.engine;
                    obj.common.enabled = objNew.enabled;
                    if (obj.common.enabled === 'true')  obj.common.enabled = true;
                    if (obj.common.enabled === 'false') obj.common.enabled = false;

                    if (_obj && _obj.common && objNew.name == _obj.common.name) {
                        socket.emit('extendObject', objNew._obj_id, obj);
                    } else {
                        var prefix = 'script.js.';
                        if (_obj) {
                            var parts = _obj._id.split('.', 3);
                            prefix = 'script.' + parts[1] + '.';
                            socket.emit('delObject', _obj._id);
                            _obj.common.engine  = obj.common.engine;
                            _obj.common.enabled = obj.common.enabled;
                            delete _obj._rev;
                        } else {
                            _obj = obj;
                        }
                        _obj.common.name = objNew.name;
                        _obj.common.platform = _obj.common.platform || 'Javascript/Node.js';

                        _obj._id         = prefix + objNew.name.replace(/ /g, '_').replace(/\./g, '_');
                        socket.emit('setObject', _obj._id, _obj)
                    }
                });*/
            }, 100);
        });

        $('.script-cancel-submit').unbind('click').button({
            icons: {primary: 'ui-icon-close'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-script-id');
            $('.script-edit-submit').show();
            $('.script-edit-file-submit').show();
            $('.script-reload-submit').show();
            $('.script-delete-submit').show();
            $('.script-ok-submit').hide();
            $('.script-cancel-submit').hide();
            $('#add-script').removeClass('ui-state-disabled');
            $gridScripts.jqGrid('restoreRow', 'script_' + id, false);
        });
    }
    function editScript(id) {

        var engines = fillEngines('edit-script-engine-type');

        if (id) {
            var obj = objects[id];
            $dialogScript.dialog('option', 'title', id);
            $('#edit-script-id').val(obj._id);
            $('#edit-script-name').val(obj.common.name);
            // Add engine even if it is not installed
            if (engines.indexOf(obj.common.engineType) == -1) $('#edit-script-engine-type').append('<option value="' + obj.common.engineType + '">' + obj.common.engineType + '</option>');
            $('#edit-script-engine-type').val(obj.common.engineType);

            if (obj.common.engineType.match(/^[jJ]ava[sS]cript/)) {
                editor.getSession().setMode("ace/mode/javascript");
            } else if (obj.common.engineType.match(/^[cC]offee[sS]cript/)) {
                editor.getSession().setMode("ace/mode/coffee");
            }
            //$('#edit-script-source').val(obj.common.source);
            editor.setValue(obj.common.source);
            $dialogScript.dialog('open');
        } else {
            showMessage(_('This should never come!'), '', 'alert');
             /*// Should never come
             $dialogScript.dialog('option', 'title', 'new script');
             $('#edit-script-id').val('');
             $('#edit-script-name').val('');
             $('#edit-script-engine-type').val('Javascript');
             //$('#edit-script-source').val('');
             editor.setValue('');
             $dialogScript.dialog('open');*/
         }
    }
    function saveScript() {
        var obj = {};

        obj._id        = $('#edit-script-id').val();
        obj.name       = $('#edit-script-name').val();
        obj.source     = editor.getValue();
        obj.engineType = $('#edit-script-engine-type').val() || '';

        updateScript(obj._id, obj);
        $dialogScript.dialog('close');
    }

    // ----------------------------- Hosts show and Edit ------------------------------------------------
    function initHostsList() {

        if (!objectsLoaded) {
            setTimeout(initHostsList, 250);
            return;
        }

        // fill the host list (select) on adapter tab
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

        // Change editoptions for gridInstances column host
        var tmp = '';
        for (var k = 0; k < hosts.length; k++) {
            tmp += (k > 0 ? ';' : '') + hosts[k].name + ':' + hosts[k].name;
        }
        $gridInstance.jqGrid('setColProp', 'host', {editoptions: {value: tmp}});

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
    function initHostButtons() {

        $('.host-update-submit').button({icons: {primary: 'ui-icon-refresh'}}).unbind('click').on('click', function () {
            cmdExec($(this).attr('data-host-name'), 'upgrade self', function (exitCode) {
                if (!exitCode) initHosts(true);
            });
        });

        $('.host-restart-submit').button({icons: {primary: 'ui-icon-refresh'}, text: false}).css({width: 22, height: 18}).unbind('click').on('click', function () {
            waitForRestart = true;
            cmdExec($(this).attr('data-host-name'), '_restart');
        });
    }
    function initHosts(update, updateRepo, callback) {

        if (!objectsLoaded) {
            setTimeout(initHosts, 250);
            return;
        }

        if (typeof $gridHosts !== 'undefined' && (!$gridHosts[0]._isInited || update)) {
            $('a[href="#tab-hosts"]').removeClass('updateReady');

            $gridHosts.jqGrid('clearGridData');
            $("#load_grid-hosts").show();

            getAdaptersInfo(currentHost, update, updateRepo, function (repository, installedList) {
                // Do it one more time
                $gridHosts.jqGrid('clearGridData');

                $gridHosts[0]._isInited = true;
                for (var i = 0; i < hosts.length; i++) {
                    var obj = objects[hosts[i].id];
                    var installed = '';
                    var version = obj.common ? (repository[obj.common.type] ? repository[obj.common.type].version : '') : '';
                    if (installedList && installedList.hosts && installedList.hosts[obj.common.hostname]) {
                        installed = installedList.hosts[obj.common.hostname].version;
                        if (installed != installedList.hosts[obj.common.hostname].runningVersion) installed += '(' + _('Running: ') + installedList.hosts[obj.common.hostname].runningVersion + ')';
                    }

                    if (!installed && obj.common && obj.common.installedVersion) installed = obj.common.installedVersion;

                    if (installed && version) {
                        if (!upToDate(version, installed)) {
                            installed += ' <button class="host-update-submit" data-host-name="' + obj.common.hostname + '">' + _('update') + '</button>';
                            version = '<span class="updateReady">' + version + '<span>';
                            $('a[href="#tab-hosts"]').addClass('updateReady');
                        }
                    }

                    var __hostname = '<table style="width:100%; padding: 0; border: 0; border-spacing: 0; border-color: rgba(0, 0, 0, 0)" cellspacing="0" cellpadding="0"><tr><td style="width:100%">' + obj.common.hostname + '</td><td><button class="host-restart-submit" data-host-name="' + obj.common.hostname + '">' + _('restart') + '</button></td></tr></table>';

                    $gridHosts.jqGrid('addRowData', 'host_' + hosts[i].id.replace(/ /g, '_'), {
                        _id:       obj._id,
                        name:      __hostname,
                        type:      obj.common.type,
                        title:     obj.common.title,
                        platform:  obj.common.platform,
                        os:        obj.native.os.platform,
                        available: version,
                        installed: installed
                    });
                }
                $gridHosts.trigger('reloadGrid');

                initHostButtons();
                if (callback) callback();
            });
        }
    }

    // ----------------------------- Instances show and Edit ------------------------------------------------
    function onEditInstance(id, e) {
        var rowData = $gridInstance.jqGrid('getRowData', 'instance_' + id);

        $('.instance-edit').hide();
        $('.instance-settings').hide();
        $('.instance-reload').hide();
        $('.instance-del').hide();
        $('.instance-ok-submit[data-instance-id="' + id + '"]').show();
        $('.instance-cancel-submit[data-instance-id="' + id + '"]').show();
        $('#reload-instances').addClass('ui-state-disabled');
        $('#edit-instance').addClass('ui-state-disabled');

        // Set the colors
        var a = $('td[aria-describedby="grid-instances_enabled"]');
        a.each(function (index) {
            var text = $(this).html();
            if (text == '<span style="color:green;font-weight:bold">true</span>') {
                $(this).html('true');
            } else if (text == '<span style="color:red">false</span>') {
                $(this).html('false');
            }
        });

        if (rowData.availableModes) {
            var list = {};
            var modes = rowData.availableModes.split(',');
            var editable = false;
            for (var i = 0; i < modes.length; i++) {
                list[modes[i]] = _(modes[i]);
                if (modes[i] == 'schedule') editable = true;
            }
            $gridInstance.setColProp('mode', {
                editable:    true,
                edittype:    'select',
                editoptions: {value: list},
                align:       'center'
            });
            $gridInstance.setColProp('schedule', {
                editable:    editable,
                align:       'center'
            });
        } else {
            $gridInstance.setColProp('mode', {
                editable: false,
                align:    'center'
            });
            $gridInstance.setColProp('schedule', {
                editable:    rowData.mode == 'schedule',
                align:       'center'
            });
        }
        $gridInstance.jqGrid('editRow', 'instance_' + id, {"url": "clientArray"});
    }
    function replaceLink(vars, adapter, instance) {
        // like web_port
        var parts = vars.split('_');
        socket.emit('getObject', 'system.adapter.' + parts[0] + '.0', function (err, obj) {
            if (obj) {
                setTimeout(function () {
                    var link = $('#a_' + adapter + '_' + instance).attr('href').replace('%' + vars + '%', obj.native[parts[1]]);
                    $('#a_' + adapter + '_' + instance).attr('href', link);
                }, 0);
            }
        });
    }

    function htmlBoolean(value) {
        if (value === 'true' || value === true) {
            return '<span style="color:green;font-weight:bold">true</span>';
        } else if (value === 'false' || value === false) {
            return '<span style="color:red">false</span>';
        } else {
            return value;
        }
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
                if (!obj) continue;
                var tmp = obj._id.split('.');
                var adapter = tmp[2];
                var instance = tmp[3];
                var title = obj.common ? obj.common.title : '';
                var link  = obj.common.localLink || '';
                if (link && link.indexOf('%ip%') != -1) link = link.replace('%ip%', location.hostname);
                if (link && link.indexOf('%') != -1) {
                    // TODO Get vars
                    var vars = 'web_port';
                    replaceLink(vars, adapter, instance);
                }

                $gridInstance.jqGrid('addRowData', 'instance_' + instances[i].replace(/ /g, '_'), {
                    _id:       obj._id,
                    availableModes: obj.common ? obj.common.availableModes : null,
                    image:     obj.common && obj.common.icon ? '<img src="/adapter/' + obj.common.name + '/' + obj.common.icon + '" width="22px" height="22px"/>' : '',
                    name:      obj.common ? obj.common.name : '',
                    instance:  obj._id.slice(15),
                    title:     obj.common ? (link ? '<a href="' + link + '" id="a_' + adapter + '_' + instance + '" target="_blank">' + title + '</a>': title): '',
                    enabled:   obj.common ? (obj.common.enabled ? "true": "false") : "false",
                    host:      obj.common ? obj.common.host : '',
                    mode:      obj.common.mode,
                    schedule:  obj.common.mode === 'schedule' ? obj.common.schedule : '',
                    buttons:   '<button data-instance-id="' + instances[i] + '" class="instance-settings" data-instance-href="/adapter/' + adapter + '/?' + instance + '" >' + _('config') + '</button>' +
                               '<button data-instance-id="' + instances[i] + '" class="instance-edit">'   + _('edit')   + '</button>' +
                               '<button data-instance-id="' + instances[i] + '" class="instance-reload">' + _('reload') + '</button>' +
                               '<button data-instance-id="' + instances[i] + '" class="instance-del">'    + _('delete') + '</button>' +
                               '<button data-instance-id="' + instances[i] + '" class="instance-ok-submit"     style="display:none">' + _('ok')     + '</button>' +
                               '<button data-instance-id="' + instances[i] + '" class="instance-cancel-submit" style="display:none">' + _('cancel') + '</button>',
                    platform:  obj.common ? obj.common.platform : '',
                    loglevel:  obj.common ? obj.common.loglevel : '',
                    alive:     states[obj._id + '.alive'] ? htmlBoolean(states[obj._id + '.alive'].val) : '',
                    connected: states[obj._id + '.connected'] ? htmlBoolean(states[obj._id + '.connected'].val) : ''
                });
            }
            $gridInstance.trigger('reloadGrid');

            // Set the colors
            var a = $('td[aria-describedby="grid-instances_enabled"]');
            a.each(function (index) {
                var text = $(this).html();
                if (text == 'true' || text == 'false') {
                    $(this).html(htmlBoolean(text));
                }
            });

            $('.host-selector').each(function () {
                var id = $(this).attr('data-id');
                $(this).val((objects[id] && objects[id].common) ? obj.common.host || '': '').
                    change(function () {
                        socket.emit('extendObject', $(this).attr('data-id'), {common:{host: $(this).val()}});
                    });
            });

            initInstanceButtons();
        }
    }
    function initInstanceButtons() {
        $('.instance-edit').unbind('click').button({
            icons: {primary: 'ui-icon-pencil'},
            text:  false
        }).css('width', '22px').css('height', '18px').click(function () {
            onEditInstance($(this).attr('data-instance-id'));
        });

        $('.instance-settings').button({icons: {primary: 'ui-icon-note'}, text: false}).css('width', '22px').css('height', '18px').unbind('click')
            .click(function () {
                $iframeDialog = $dialogConfig;
                $configFrame.attr('src', $(this).attr('data-instance-href'));
                var name = $(this).attr('data-instance-id').replace(/^system\.adapter\./, '');
                $dialogConfig.dialog('option', 'title', _('Adapter configuration') + ': ' + name).dialog('open');
            });

        $('.instance-reload').button({icons: {primary: 'ui-icon-refresh'}, text: false}).css({width: 22, height: 18}).unbind('click')
            .click(function () {
                socket.emit('extendObject', $(this).attr('data-instance-id'), {});
            });

        $('.instance-del').button({icons: {primary: 'ui-icon-trash'}, text: false}).css('width', '22px').css('height', '18px').unbind('click')
            .click(function () {
                var id = $(this).attr('data-instance-id');
                if (objects[id] && objects[id].common && objects[id].common.host) {
                    if (confirm(_('Are you sure?'))) {
                        cmdExec(objects[id].common.host, 'del ' + id.replace('system.adapter.', ''), function (exitCode) {
                            if (!exitCode) initAdapters(true);
                        });
                    }
                }
            });

        $('.instance-ok-submit').unbind('click').button({
            icons: {primary: 'ui-icon-check'},
            text:  false
        }).css('width', '22px').css('height', '18px').click(function () {
            var id = $(this).attr('data-instance-id');
            $('.instance-edit').show();
            $('.instance-settings').show();
            $('.instance-reload').show();
            $('.instance-del').show();
            $('.instance-ok-submit').hide();
            $('.instance-cancel-submit').hide();
            $('#reload-instances').removeClass('ui-state-disabled');
            $('#edit-instance').removeClass('ui-state-disabled');

            $gridInstance.jqGrid('saveRow', 'instance_' + id, {"url": "clientArray"});
            // afterSave
            setTimeout(function () {
                var _obj = $gridInstance.jqGrid('getRowData', 'instance_' + id);

                var obj = {common:{}};
                obj.common.host     = _obj.host;
                obj.common.loglevel = _obj.loglevel;
                obj.common.schedule = _obj.schedule;
                obj.common.enabled  = _obj.enabled;
                obj.common.mode     = _obj.mode;

                if (obj.common.enabled === 'true')  obj.common.enabled = true;
                if (obj.common.enabled === 'false') obj.common.enabled = false;

                socket.emit('extendObject', _obj._id, obj);
            }, 100);
        });

        $('.instance-cancel-submit').unbind('click').button({
            icons: {primary: 'ui-icon-close'},
            text:  false
        }).css('width', '22px').css('height', '18px').click(function () {
            var id = $(this).attr('data-instance-id');
            $('.instance-edit').show();
            $('.instance-settings').show();
            $('.instance-reload').show();
            $('.instance-del').show();
            $('.instance-ok-submit').hide();
            $('.instance-cancel-submit').hide();
            $('#reload-instances').removeClass('ui-state-disabled');
            $('#edit-instance').removeClass('ui-state-disabled');
            $gridInstance.jqGrid('restoreRow', 'instance_' + id, false);

            // Set the colors
            var a = $('td[aria-describedby="grid-instances_enabled"]');
            a.each(function (index) {
                var text = $(this).html();
                if (text == 'true') {
                    $(this).html('<span style="color:green;font-weight:bold">true</span>');
                } else if (text == 'false') {
                    $(this).html('<span style="color:red">false</span>');
                }
            });
        });
    }

    // ----------------------------- Users show and Edit ------------------------------------------------
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
            showMessage(_('Password and confirmation are not equal!'), '', 'notice');
            return;
        }
        var id = $('#edit-user-id').val();
        var user = $('#edit-user-name').val();

        if (!id) {
            socket.emit('addUser', user, pass, function (err) {
                if (err) {
                    showMessage(_('Cannot set password: ') + err, '', 'alert');
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
                socket.emit('changePassword', user, pass, function (err) {
                    if (err) {
                        showMessage(_('Cannot set password: ') + err, '', 'alert');
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

    // ----------------------------- Groups show and Edit ------------------------------------------------
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
                    showMessage(_('Cannot create group: ') + err, '', 'alert');
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
            socket.emit('extendObject', id, obj, function (err, res) {
                if (err) {
                    showMessage(_('Cannot change group: ') + err, '', 'alert');
                } else {
                    $dialogGroup.dialog('close');
                }
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
                if (curRepository && curInstalled) {
                    setTimeout(function () {
                        callback(curRepository, curInstalled);
                    }, 0);
                }
            });
        }
        if (!curInstalled) {
            socket.emit('sendToHost', host, 'getInstalled', null, function (_installed) {
                curInstalled = _installed;
                if (curRepository && curInstalled) {
                    setTimeout(function () {
                        callback(curRepository, curInstalled);
                    }, 0);
                }
            });
        }
        if (curInstalled && curRepository) {
            setTimeout(function () {
                callback(curRepository, curInstalled);
            }, 0);
        }
    }

    // ----------------------------- Objects show and Edit ------------------------------------------------
    function getObjects(callback) {
        socket.emit('getObjects', function (err, res) {
            setTimeout(function () {
                var obj;
                objects = res;
                for (var id in objects) {
                    if (id.slice(0, 7) === '_design') continue;

                    obj = objects[id];

                    if (obj.type === 'instance') instances.push(id);
                    if (obj.type === 'enum')     enums.push(id);
                    if (obj.type === 'script')   scripts.push(id);
                    if (obj.type === 'user')     users.push(id);
                    if (obj.type === 'group')    groups.push(id);
                    if (obj.type === 'adapter')  adapters.push(id);
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
                        $("#a-tab-node-red").show();
                        if ($('#tabs').tabs("option", "active") == 8) $("#tab-node-red").show();
                        $('#iframe-node-red').height($(window).height() - 55);
                        $('#iframe-node-red').attr('src', 'http://' + location.hostname + ':' + obj.native.port);
                    }
                    //treeInsert(id);
                }
                //benchmark('finished getObjects loop');
                objectsLoaded = true;

                // If history enabled
                checkHistory();

                // Detect if some script engine instance installed
                var engines = fillEngines();

                // Disable scripts tab if no one script engine instance found
                if (!engines || !engines.length) $('#tabs').tabs('option', 'disabled', [7]);

                // Show if update available
                initHostsList();


                if (typeof callback === 'function') callback();
            }, 0);
        });
    }
    function initObjects(update) {
        if (!objectsLoaded) {
            setTimeout(initObjects, 250);
            return;
        }

        if (typeof $gridObjects !== 'undefined' && (!$gridObjects[0]._isInited || update)) {
            //$gridObjects.jqGrid('clearGridData');
            $gridObjects[0]._isInited = true;

            var x = $(window).width();
            var y = $(window).height();
            if (x < 720) x = 720;
            if (y < 480) y = 480;

            $gridObjects.height(y - 100).width(x - 20);

            var settings = {
                objects: objects,
                states: states,
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
                    with:     _('With'),
                    without:  _('Without')
                },
                columns: ['image', 'name', 'type', 'role', 'room', 'value', 'button'],
                buttons: [
                    {
                        text: false,
                        icons: {
                            primary:'ui-icon-gear'
                        },
                        click: function (id) {
                            editObject(id);
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
                            if (id) delObject($gridObjects, id);
                        },
                        width: 26,
                        height: 20
                    },
                    {
                        text: false,
                        icons: {
                            primary:'ui-icon-clock'
                        },
                        click: function (id) {
                            openHistoryDlg(id);
                        },
                        width: 26,
                        height: 20,
                        match: function (id) {
                            // Show history button only if history adapter enabled
                            if (objects[id] && historyEnabled && !id.match(/\.messagebox$/) && objects[id].type == 'state') {
                                // Check if history enabled
                                if (objects[id] && objects[id].common && objects[id].common.history && objects[id].common.history.enabled) {
                                    this.addClass('history-enabled').removeClass('history-disabled').css({'background': 'lightgreen'});
                                } else {
                                    this.addClass('history-disabled').removeClass('history-enabled').css({'background': ''});
                                }
                            } else {
                                this.hide();
                            }
                        }
                    }
                ]
            };
            if (historyEnabled) {
                settings.customButtonFilter = {
                    icons:    {primary: 'ui-icon-clock'},
                    text:     false,
                    callback: function () {
                        var _ids = $gridObjects.selectId('getFilteredIds');
                        var ids = [];
                        for (var i = 0; i < _ids.length; i++) {
                            if (objects[_ids[i]] && objects[_ids[i]].type == 'state') ids.push(_ids[i]);
                        }
                        if (ids && ids.length) {
                            openHistoryDlg(ids);
                        } else {
                            showMessage(_('No states selected!'), '', 'info');
                        }
                    }
                }
            } else {
                settings.customButtonFilter = null;
            }

            $gridObjects.selectId('init', settings).selectId('show');
        }
    }
    function editObject(id) {
        var obj = objects[id];
        if (!obj) return;
        $dialogObject.dialog('option', 'title', id);
        $('#edit-object-id').val(obj._id);
        $('#edit-object-parent-old').val(obj.parent);
        $('#edit-object-name').val(obj.common ? obj.common.name : id);
        $('#edit-object-type').val(obj.type);
        //$('#edit-object-parent').val(obj.parent);
        $('#jump-parent').attr('data-jump-to', obj.parent);
        /*var childs = '<div style="font-size: 10px">';
        // childs += '<table style="font-size: 11px">';
        if (obj.children) {
            for (var i = 0; i < obj.children.length; i++) {
                //childs += '<tr><td>' + obj.children[i] + '</td><td><button data-jump-to="' + obj.children[i] + '" class="jump">-></button></td></tr>';
                childs += '<a style="text-decoration: underline; cursor: pointer;" class="jump" data-jump-to="' + obj.children[i] + '">' + obj.children[i] + '</a><br>';
            }
        }

        childs += '</div>';*/
        //childs += '</table>';
        //$('#edit-object-children').html(childs);
        $('#edit-object-common').val(JSON.stringify(obj.common, null, '  '));
        $('#edit-object-native').val(JSON.stringify(obj.native, null, '  '));
        var _obj = JSON.parse(JSON.stringify(obj));
        if (_obj._id)    delete _obj._id;
        if (_obj.common) delete _obj.common;
        if (_obj.type)   delete _obj.type;
        if (_obj.native) delete _obj.native;
        $('#view-object-full').val(JSON.stringify(_obj, null, '  '));
        $dialogObject.dialog('open');
    }
    function saveObject() {
        var obj = {common: {}, native: {}};
        obj._id =         $('#edit-object-id').val();
        obj.parent =      $('#edit-object-parent-old').val();
        obj.common.name = $('#edit-object-name').val();
        obj.type =        $('#edit-object-type').val();
        obj.parent =      $('#edit-object-parent').val();

        try {
            obj.common = JSON.parse($('#edit-object-common').val());
        } catch (e) {
            showMessage('common ' + e, '', 'alert');
            return false;
        }
        try {
            obj.native = JSON.parse($('#edit-object-native').val());
        } catch (e) {
            showMessage('native ' + e, '', 'alert');
            return false;
        }

        socket.emit('extendObject', obj._id, obj);


        $dialogObject.dialog('close');
    }
    function delObject($tree, id, callback, hideConfirm) {
        if (hideConfirm || confirm(_('Are you sure to delete %s and all children?', id))) {
            var leaf = $tree.selectId('getTreeInfo', id);
            //var leaf = treeFindLeaf(id);
            if (leaf && leaf.children) {
                for (var e = 0; e < leaf.children.length; e++) {
                    delObject($tree, leaf.children[e], function () {
                        delObject($tree, id, callback, true);
                    }, true);
                    break;
                }
            } else {
                if (objects[id] && objects[id].common && objects[id].common['object-non-deletable']) {
                    showMessage(_('Cannot delete "%s" because not allowed', id), '', 'notice');
                    if (callback) callback(id);
                } else {
                    socket.emit('delObject', id, function () {
                        socket.emit('delState', id, function () {
                            if (callback) {
                                setTimeout(function () {
                                    callback(id);
                                }, 0);
                            }
                        });
                    });
                }
            }
        }
    }

    // ----------------------------- Enum show and Edit ------------------------------------------------
    var tasks = [];
    function enumRename(oldId, newId, newName, callback) {
        if (tasks.length) {
            var task = tasks.shift();
            if (task.name == 'delObject') {
                socket.emit(task.name, task.id, function () {
                    setTimeout(enumRename, 0, undefined, undefined, undefined, callback);
                });
            } else {
                socket.emit(task.name, task.id, task.obj, function () {
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
        if (oldId != newId && objects[newId]) {
            showMessage(_('Name yet exists!'), '', 'info');
            initEnums(true);
            if (callback) callback();
        } else {
            if (oldId == newId) {
                if (newName !== undefined) {
                    tasks.push({name: 'extendObject', id:  oldId, obj: {common: {name: newName}}});
                    if (callback) callback();
                }
            } else if (objects[oldId] && objects[oldId].common && objects[oldId].common.nondeletable) {
                showMessage(_('Change of enum\'s id "%s" is not allowed!', oldId), '', 'notice');
                initEnums(true);
                if (callback) callback();
            } else {
                var leaf = $gridEnums.selectId('getTreeInfo', oldId);
                //var leaf = treeFindLeaf(oldId);
                if (leaf && leaf.children) {
                    socket.emit('getObject', oldId, function (err, obj) {
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
                    socket.emit('getObject', oldId, function (err, obj) {
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
        if (objects[newId]) {
            showMessage(_('Name yet exists!'), '', 'notice');
            return false;
        }

        socket.emit('setObject', newId, {
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
        $('#enum-name-edit').val(objects[id].common.name);
        var members = objects[id].common.members || [];
        $gridEnumMembers.jqGrid('clearGridData');
        // Remove empty entries
        for (var i = members.length - 1; i >= 0; i--) {
            if (!members[i]) {
                members.splice(i, 1);
            }
        }

        for (i = 0; i < members.length; i++) {
            if (objects[members[i]]) {
                $gridEnumMembers.jqGrid('addRowData', 'enum_member_' + members[i].replace(/ /g, '_'), {_id: members[i], name: objects[members[i]].common.name, type: objects[members[i]].type});
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
    /*function onEditEnum($grid, id) {
        var obj = $grid.jqGrid('getRowData', 'enum_' + id);
        if (obj && obj._id) {
            var full;
            var original;
            var pos = obj._id.lastIndexOf('.');
            if (pos != -1) {
                full = obj._id;
                original = obj._id.substring(0, pos);
                obj._id  = obj._id.substring(pos + 1);
            }

            $grid.jqGrid('setRowData', 'enum_' + id, obj);
            initEnumButtons();
            if (pos != -1) {
                var o = $('.enum-ok-submit[data-enum-id="' + id + '"]')[0];
                o._full = full;
                o._original = original;
            }
            $('.enum-edit').hide();
            $('.enum-members').hide();
            $('.enum-add-children').hide();
            $('.enum-del').hide();
            $('.enum-ok-submit[data-enum-id="' + id + '"]').show();
            $('.enum-cancel-submit[data-enum-id="' + id + '"]').show();
            $('#add-enum').addClass('ui-state-disabled');
            $('#edit-enum').addClass('ui-state-disabled');

            $grid.jqGrid('editRow', 'enum_' + id, {"url": "clientArray"});
        }
    }
    function initEnumButtons() {
        $('.enum-edit').unbind('click').button({
            icons: {primary: 'ui-icon-pencil'},
            text:  false
        }).css('width', '22px').css('height', '18px').click(function () {
            var subgrid = $(this).attr('data-enum-subgrid');
            onEditEnum(subgrid ? $(document.getElementById(subgrid)) : $gridEnums, $(this).attr('data-enum-id'));
        });

        $('.enum-members').button({icons: {primary: 'ui-icon-note'}, text: false}).css('width', '22px').css('height', '18px').unbind('click')
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
                // Store prefix in DOM to show generated ID
                var t = $('#enum-gen-id');
                t[0]._original = (enumCurrentParent || 'enum');
                t.html(newId);

                $dialogEnum.dialog('open');
            });

        $('.enum-del').button({icons: {primary: 'ui-icon-trash'}, text: false}).css('width', '22px').css('height', '18px').unbind('click')
            .click(function () {
     delObject($(this).attr('data-enum-id'));
            });

        $('.enum-ok-submit').unbind('click').button({
            icons: {primary: 'ui-icon-check'},
            text:  false
        }).css('width', '22px').css('height', '18px').click(function () {
            var id = $(this).attr('data-enum-id');
            $('.enum-edit').show();
            $('.enum-members').show();
            $('.enum-add-children').show();
            $('.enum-del').show();
            $('.enum-ok-submit').hide();
            $('.enum-cancel-submit').hide();
            $('#add-enum').removeClass('ui-state-disabled');
            $('#edit-enum').removeClass('ui-state-disabled');

            var subgrid = $(this).attr('data-enum-subgrid');
            var $grid = subgrid ? $(document.getElementById(subgrid)) : $gridEnums;

            $grid.jqGrid('saveRow', 'enum_' + id, {"url": "clientArray"});
            // afterSave
            setTimeout(function () {
                var obj = $grid.jqGrid('getRowData', 'enum_' + id);
                var o = $('.enum-ok-submit[data-enum-id="' + id + '"]')[0];
                obj._id = o._original + '.' + obj._id.replace(/ /g, '_').toLowerCase();
                // rename all children
                enumRename(o._full, obj._id, obj.name);
                delete o._full;
                delete o._original;
            }, 100);
        });

        $('.enum-cancel-submit').unbind('click').button({
            icons: {primary: 'ui-icon-close'},
            text:  false
        }).css('width', '22px').css('height', '18px').click(function () {
            var id = $(this).attr('data-enum-id');
            $('.enum-members').show();
            $('.enum-edit').show();
            $('.enum-add-children').show();
            $('.enum-del').show();
            $('.enum-ok-submit').hide();
            $('.enum-cancel-submit').hide();
            $('#add-enum').removeClass('ui-state-disabled');
            $('#edit-enum').removeClass('ui-state-disabled');
            var subgrid = $(this).attr('data-enum-subgrid');
            var $grid = subgrid ? $(document.getElementById(subgrid)) : $gridEnums;
            $grid.jqGrid('restoreRow', 'enum_' + id, false);
            var obj = $grid.jqGrid('getRowData', 'enum_' + id);
            var o = $('.enum-ok-submit[data-enum-id="' + id + '"]')[0];
            obj._id = o._full;

            $grid.jqGrid('setRowData', 'enum_' + id, obj);

            delete o._full;
            delete o._original;

        });
    }*/
    /*var regexSystemAdapter = new RegExp('^system.adapter.');
    var regexSystemHost = new RegExp('^system.host.');

    function treeOptimizePath(parts, tree, index) {
        if (!tree) tree = objectTree;
        if (index === undefined) index = 0;
        if (tree.children[parts[index]]) {
            if (index == parts.length - 1) {
                return parts;
            } else {
                return treeOptimizePath(parts, tree.children[parts[index]], index + 1);
            }
        } else {
            var i = index + 1;
            var name = parts[index] + '.' + parts[i];
            while (!tree.children[name] && i < parts.length) {
                i++;
                name += '.' + parts[i];
            }
            parts[index] = name;
            parts.splice(i, i - index);
            if (index == parts.length - 1) {
                return parts;
            } else {
                return treeOptimizePath(parts, tree.children[parts[index]], index + 1);
            }
        }
    }
    function treeSplit(id, optimized) {
        if (!id) {
            console.log('AAAA');
            return null;
        }
        var parts = id.split('.');
        if (regexSystemAdapter.test(id)) {
            if (parts.length > 3) {
                parts[0] = 'system.adapter.' + parts[2] + '.' + parts[3];
                parts.splice(1, 3);
            } else {
                parts[0] = 'system.adapter.' + parts[2];
                parts.splice(1, 2);
            }
        } else if (regexSystemHost.test(id)) {
            parts[0] = 'system.host.' + parts[2];
            parts.splice(1, 2);
        } else if (parts.length > 1) {
            parts[0] = parts[0] + '.' + parts[1];
            parts.splice(1, 1);
        }

        if (optimized) {
            parts = treeOptimizePath(parts);
        }

        return parts;
    }

    function treeInsert(id) {
        var parts = treeSplit(id, false);
        var isUpdate = false;
        if (objectTree.children[parts[0]]) isUpdate = true;
        _treeInsert(objectTree, parts, id, 0);
        return isUpdate;
    }
    function _treeInsert(tree, parts, id, index) {
        if (!index) index = 0;

        if (!tree.children[parts[index]]) {
            tree.count++;
            var fullName = '';
            for (var i = 0; i <= index; i++) {
                fullName += ((fullName) ? '.' : '') + parts[i];
            }
            tree.children[parts[index]] = {name: parts[index], children: {}, count: 0, parent: tree, fullName: fullName};
        }
        if (parts.length - 1 == index) {
            tree.children[parts[index]].id = id;
        } else {
            _treeInsert(tree.children[parts[index]], parts, id, index + 1);
        }
    }

    function treeFindLeaf(id) {
        return _treeFindLeaf(objectTree, treeSplit(id, true), 0);
    }
    function _treeFindLeaf(tree, parts, index) {
        if (!index) index = 0;

        if (tree.children[parts[index]]) {
            if (parts.length - 1 == index) return tree.children[parts[index]];

            return _treeFindLeaf(tree.children[parts[index]], parts, index + 1);
        } else {
            return null;
        }
    }

    function treeRemove(id) {
        return _treeRemove(objectTree, treeSplit(id, true));
    }
    function _treeRemove(tree, parts) {
        var leaf = _treeFindLeaf(tree, parts, 0);
        if (leaf) {
            var parent = leaf.parent;
            delete parent.children[leaf.name];
            parent.count--;
            if (parent.parent)
                treeOptimize(parent.parent);
        }
    }

    // Remove empty leafs with only one child leaf
    function treeOptimize(tree) {
        var modified;
        var i;
        if (!tree) tree = objectTree;
        do {
            modified = false;
            for (i in tree.children) {
                if (!tree.children[i].id) {
                    if (!tree.children[i].count) {
                        console.log('Dead leaf ' + tree.children[i].fullName);
                        delete tree.children[i];
                        modified = true;
                    } else if (tree.children[i].count == 1) {
                        var p;
                        for (var t in tree.children[i].children) {
                            p = tree.children[i].name + '.' + t;
                            tree.children[p] = {};
                            tree.children[p].name      = p;
                            tree.children[p].fullName  = tree.children[i].fullName + '.' + t;
                            tree.children[p].id        = tree.children[i].children[t].id;
                            tree.children[p].count     = tree.children[i].children[t].count;
                            tree.children[p].children  = tree.children[i].children[t].children;
                        }
                        for (t in tree.children[p].children) {
                            tree.children[p].children[t].parent = tree.children[p];
                        }
                        delete tree.children[i];
                        modified = true;
                    }
                }
            }
        } while (modified);

        //Sort attributes
        var arr = [];
        for (i in tree.children) {
            arr.push(i);
        }
        arr.sort();
        var children = tree.children;
        tree.children = {};

        for (i = 0; i < arr.length; i++) {
            tree.children[arr[i]] = children[arr[i]];
        }

        // optimize children
        for (i in tree.children) {
            treeOptimize(tree.children[i]);
        }
    }*/

    function initEnums(update, expandId) {
        if (!objectsLoaded) {
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
            /*var tree = objectTree.children.enum;
            if (!tree) tree = objectTree;

            if (tree && tree.count) {
                for (i in tree.children) {
                    var id = tree.children[i].id;
                    if (id && objects[id].type === 'enum') {
                        if (!objects[id].common) objects[id].common = {};
                        gridEnumsData.push({
                            gridId:  'enum_' + id.replace(/ /g, '_'),
                            _id:     objects[id]._id,
                            name:    objects[id].common.name || '',
                            members: objects[id].common.members ? objects[id].common.members.length : '',
                            buttons: '<button data-enum-id="' + objects[id]._id + '" class="enum-edit">'         + _('edit')         + '</button>' +
                                //'<button data-enum-id="' + objects[id]._id + '" class="enum-members">'      + _('members')      + '</button>' +
                                (objects[id].common.nondeletable ? '' : '<button data-enum-id="' + objects[id]._id + '" class="enum-del">' + _('delete') + '</button>') +
                                '<button data-enum-id="' + objects[id]._id + '" class="enum-add-children">' + _('add children') + '</button>' +
                                '<button data-enum-id="' + objects[id]._id + '" class="enum-ok-submit"     style="display:none">' + _('ok')     + '</button>' +
                                '<button data-enum-id="' + objects[id]._id + '" class="enum-cancel-submit" style="display:none">' + _('cancel') + '</button>'
                        });
                    }
                }
            }
            $gridEnums.jqGrid('addRowData', 'gridId', gridEnumsData);
            $gridEnums.trigger('reloadGrid');
            if (expandId) $gridEnums.jqGrid('expandSubGridRow', 'enum_' + expandId);

            for (i = 0; i < enumExpanded.length; i++) {
                $gridEnums.jqGrid('expandSubGridRow', 'enum_' + enumExpanded[i]);
            }

            initEnumButtons();*/
            $gridEnums.selectId('init', {
                objects: objects,
                states: states,
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
                            } while (objects[newId]);

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
                            delObject($gridEnums, id);
                        },
                        match: function (id) {
                            if (!objects[id] || !objects[id].common || objects[id].common.nondeletable) this.hide();
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
                            } while (objects[newId]);

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
    function convertState(key, _obj) {
        var obj = JSON.parse(JSON.stringify(_obj));
		if (!obj) {
			console.log(key);
		}
		obj = obj || {};
        obj._id = key;
        obj.id = key;
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
        if (obj.ts) obj.ts = formatDate(obj.ts, true);
        if (obj.lc) obj.lc = formatDate(obj.lc, true);

        if (typeof obj.val == 'object') obj.val = JSON.stringify(obj.val);

        obj.gridId = 'state_' + key.replace(/ /g, '_');
        if (obj.from) obj.from = obj.from.replace('system.adapter.', '').replace('system.', '');
        return obj;
    }
    function initStates(update) {
        if (!objectsLoaded || !states) {
            setTimeout(initStates, 250);
            return;
        }

        if (typeof $gridStates !== 'undefined' && (!$gridStates[0]._isInited || update)) {
            $gridStates.jqGrid('clearGridData');
            $gridStates[0]._isInited = true;

            for (var key in states) {
                $gridStates.jqGrid('addRowData', 'state_' + key, convertState(key, states[key]));
            }
            $gridStates.trigger('reloadGrid');
        }
    }
    function getStates(callback) {
        $gridStates.jqGrid('clearGridData');
        socket.emit('getStates', function (err, res) {
            states = res;
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
            tc = formatDate(new Date());
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
            document.getElementById('event_' + eventsLinesStart).outerHTML = '';
        } else {
            eventsLinesCount++;
        }

        if (state) {
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
                tc = formatDate(new Date());
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
    socket.on('log', function (message) {
        //message = {message: msg, severity: level, from: this.namespace, ts: (new Date()).getTime()}
        addMessageLog(message);
    });
    socket.on('error', function (error) {
        //message = {message: msg, severity: level, from: this.namespace, ts: (new Date()).getTime()}
        //addMessageLog({message: msg, severity: level, from: this.namespace, ts: (new Date()).getTime()});
        console.log(error);
    });

    function stateChange(id, state) {
        var rowData;
        id = id ? id.replace(/ /g, '_') : '';

        if (currentHistory == id) {
            var gid = $gridHistory[0]._maxGid++;
            $gridHistory.jqGrid('addRowData', gid, {
                gid: gid,
                id:  id,
                ack: state.ack,
                val: state.val,
                ts:  formatDate(state.ts, true),
                lc:  formatDate(state.lc, true)
            });
        }

        if (id && id.match(/\.messagebox$/)) {
            addEventMessage(id, state);
        } else {
            if ($gridStates && objectsLoaded) {
                // Update gridStates
                if (state) {
                    if (states[id]) {
                        var data  = $gridStates.jqGrid('getGridParam', 'data');
                        var index = $gridStates.jqGrid('getGridParam', '_index');
                        var rowData = data[index['state_' + id]];
                        if (rowData) {
                            rowData.val = state.val;
                            rowData.ack = state.ack;
                            if (state.ts) rowData.ts = formatDate(state.ts, true);
                            if (state.lc) rowData.lc = formatDate(state.lc, true);
                            rowData.from = state.from.replace('system.adapter.', '').replace('system.', '');
                            var a = $gridStates.jqGrid('getRowData', 'state_' + id, rowData);
                            if (a && a._id) $gridStates.jqGrid('setRowData', 'state_' + id, rowData);
                        } else {
                            $gridStates.jqGrid('addRowData', 'state_' + id, convertState(id, state));
                        }
                    } else {
                        $gridStates.jqGrid('addRowData', 'state_' + id, convertState(id, state));
                    }
                } else {
                    $gridStates.jqGrid('delRowData', 'state_' + id);
                }
                addEventMessage(id, state, rowData);
            }

            if ($gridObjects) $gridObjects.selectId('state', id, state);
            if ($selectId) $selectId.selectId('state', id, state);
        }

        // Update alive and connecetd of instances
        if ($gridInstance) {
            var parts = id.split('.');
            var last = parts.pop();
            id = parts.join('.');
            if (last === 'alive' && instances.indexOf(id) !== -1) {
                rowData = $gridInstance.jqGrid('getRowData', 'instance_' + id);
                rowData.alive = (rowData.alive === true || rowData.alive === 'true');
                var newVal = state ? state.val : false;
                newVal = (newVal === true || newVal === 'true');
                if (rowData.alive != newVal) {
                    rowData.alive = htmlBoolean(newVal);
                    $gridInstance.jqGrid('setRowData', 'instance_' + id, rowData);
                    initInstanceButtons();
                }
            } else if (last === 'connected' && instances.indexOf(id) !== -1) {
                rowData = $gridInstance.jqGrid('getRowData', 'instance_' + id);
                rowData.connected = (rowData.connected === true || rowData.connected === 'true');
                var newVal = state ? state.val : false;
                newVal = (newVal === true || newVal === 'true');
                if (rowData.connected != newVal) {
                    rowData.connected = htmlBoolean(newVal);
                    $gridInstance.jqGrid('setRowData', 'instance_' + id, rowData);
                    initInstanceButtons();
                }
            }
        }
    }

    socket.on('stateChange', function (id, obj) {
        setTimeout(stateChange, 0, id, obj);
    });

    function objectChange(id, obj) {
        var changed = false;
        var i;
        var j;
        var oldObj = null;
        var isNew = false;
        var isUpdate = false;

        // update objects cache
        if (obj) {
            if (obj._rev && objects[id]) objects[id]._rev = obj._rev;
            if (!objects[id]) {
                isNew = true;
                //treeInsert(id);
            }
            if (isNew || JSON.stringify(objects[id]) != JSON.stringify(obj)) {
                objects[id] = obj;
                changed = true;
            }
        } else if (objects[id]) {
            changed = true;
            oldObj = {_id: id, type: objects[id].type};
            delete objects[id];
        }

        // update to event table
        addEventMessage(id, null, null, obj);

        if ($gridObjects) $gridObjects.selectId('object', id, obj);
        if ($selectId) $selectId.selectId('object', id, obj);
        if ($gridEnums) $gridEnums.selectId('object', id, obj);

        // If system config updated
        if (id == 'system.config') {
            // Check language
            if (systemConfig.common.language != obj.common.language) {
                window.location.reload();
            }

            systemConfig = obj;
        }

        // Update Instance Table
        if (id.match(/^system\.adapter\.[-\w]+\.[0-9]+$/)) {
            if (obj) {
                if (instances.indexOf(id) == -1) instances.push(id);
            } else {
                i = instances.indexOf(id);
                if (i != -1) instances.splice(i, 1);
            }
            if (id.match(/^system\.adapter\.history\.[0-9]+$/)) {
                checkHistory();
                // Update all states if history enabled or disabled
                $gridObjects.selectId('reinit');
            }

            if (id.match(/^system\.adapter\.node-red\.[0-9]+$/)) {
                if (obj && obj.common && obj.common.enabled) {
                    $("#a-tab-node-red").show();
                    if ($('#tabs').tabs("option", "active") == 8) $("#tab-node-red").show();
                    $('#iframe-node-red').height($(window).height() - 55);
                    $('#iframe-node-red').attr('src', 'http://' + location.hostname + ':' + obj.native.port);
                } else {
                    $("#a-tab-node-red").hide();
                    $("#tab-node-red").hide();
                }
            }

            // Disable scripts tab if no one script engine instance found
            var engines = fillEngines();
            $('#tabs').tabs('option', 'disabled', (engines && engines.length) ? [] : [7]);

            if (typeof $gridInstance !== 'undefined' && $gridInstance[0]._isInited) {
                if (updateTimers.initInstances) {
                    clearTimeout(updateTimers.initInstances);
                }
                updateTimers.initInstances = setTimeout(function () {
                    updateTimers.initInstances = null;
                    initInstances(true);
                }, 200);
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
                initHostsList();
            }, 200);
        }

        // Update scripts
        if (id.match(/^script\./)) {
            if (obj) {
                if (scripts.indexOf(id) == -1) scripts.push(id);
            } else {
                j = scripts.indexOf(id);
                if (j != -1) scripts.splice(j, 1);
            }

            if (updateTimers.initScripts) {
                clearTimeout(updateTimers.initScripts);
            }
            updateTimers.initScripts = setTimeout(function () {
                updateTimers.initScripts = null;
                initScripts(true);
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

    socket.on('objectChange', function (id, obj) {
        setTimeout(objectChange, 0, id, obj);
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
                        setTimeout(function () {
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
                                        name:             'system.config',
                                        language:         '',           // Default language for adapters. Adapters can use different values.
                                        tempUnit:         '°C',         // Default temperature units.
                                        currency:         '€',          // Default currency sign.
                                        dateFormat:       'DD.MM.YYYY', // Default date format.
                                        isFloatComma:     true,         // Default float divider ('.' - false, ',' - true)
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
                            initAllDialogs();
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
                            $("#load_grid-hosts").show();
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
        if (waitForRestart) {
            location.reload();
        }
    });
    socket.on('disconnect', function () {
        $('#connecting').show();
    });
    socket.on('reconnect', function () {
        $('#connecting').hide();
        if (waitForRestart) {
            location.reload();
        }
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
    function formatDate(dateObj, isSeconds) {
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
        //$gridObjects.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridObjects.height(y - 100).width(x - 20);

        $gridEnums.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridAdapter.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridInstance.setGridHeight(y - 150).setGridWidth(x - 20);
        $gridScripts.setGridHeight(y - 150).setGridWidth(x - 20);
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

