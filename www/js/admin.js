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
var defaults = {};

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
            $dialogCommand.parent().find('.ui-widget-header button .ui-button-text').html('');
            stdout = '$ ./iobroker ' + cmd;
            $stdout.val(stdout);
            // genereate the unique id to coordinate the outputs
            activeCmdId = Math.floor(Math.random() * 0xFFFFFFE) + 1;
            cmdCallback = callback;
            main.socket.emit('cmdExec', host, activeCmdId, cmd, function (err) {
                if (err) {
                    stdout += '\n' + _(err);
                    $stdout.val(stdout);
                    cmdCallback = null;
                    callback(err);
                } else {
                    if (callback) callback();
                }
            });
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
        showError:    function (error) {
            main.showMessage(_(error),  _('Error'), 'alert');
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
                    if (callback) callback(null, id);
                } else {
                    main.socket.emit('delObject', id, function (err) {
                        if (err) {
                            main.showError(err);
                            return;
                        }
                        main.socket.emit('delState', id, function (err) {
                            if (err) {
                                main.showError(err);
                                return;
                            }
                            if (callback) {
                                setTimeout(function () {
                                    callback(null, id);
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
                name:   'admin-select-member',
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
//        scripts:    new Scripts(main),
        hosts:      new Hosts(main),
        users:      new Users(main),
        groups:     new Groups(main)
    };

    main.instances = tabs.instances.list;
    main.tabs      = tabs;

    var enums =                 [];
//    var scripts =               [];
    var children =              {};
    var updateTimers =          {};
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
    var $dialogLicense =        $('#dialog-license');
    var $dialogSystem =         $('#dialog-system');
    var $dialogMessage =        $('#dialog-message');
    var $dialogConfirm =        $('#dialog-confirm');

    var $gridEnums =            $('#grid-enums');
    var $gridEnumMembers =      $('#grid-enum-members');
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
        } else if (str.substring(0, '-----BEGIN PRIVATE KEY-----'.length) == '-----BEGIN PRIVATE KEY-----') {
            if (str.substring(str.length -  '-----END PRIVATE KEY-----'.length) != '-----END PRIVATE KEY-----') {
                main.showMessage(_('Certificate "%s" must end with "-----BEGIN PRIVATE KEY-----".', name), '', 'notice');
                return '';
            }
            str = str.substring('-----BEGIN PRIVATE KEY-----'.length);
            str = str.substring(0, str.length - '-----END PRIVATE KEY-----'.length);
            str = str.replace(/ /g, '');
            while (str.length) {
                lines.push(str.substring(0, 64));
                str = str.substring(64);
            }
            return '-----BEGIN PRIVATE KEY-----\r\n' + lines.join('\r\n') + '\r\n-----END PRIVATE KEY-----\r\n';
        }else {
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

    function initHtmlTabs(showTabs) {
        // jQuery UI initializations
        $('#tabs').show().tabs({
            activate: function (event, ui) {
                window.location.hash = '#' + ui.newPanel.selector.slice(5);

                // Init source for iframe
                if ($(ui.newPanel.selector).length && $(ui.newPanel.selector).data('src')) {
                    var $iframe = $(ui.newPanel.selector).find('iframe');
                    if ($iframe.length && !$iframe.attr('src')) {
                        $iframe.attr('src', $(ui.newPanel.selector).data('src'));
                    }
                }

                switch (ui.newPanel.selector) {
                    case '#tab-objects':
                        tabs.objects.init();
                        break;

                    case '#tab-hosts':
                        tabs.hosts.init();
                        break;

                    case '#tab-states':
                        tabs.states.init();
                        break;

                    case '#tab-scripts':
                        break;

                    case '#tab-adapters':
                        tabs.hosts.initList();
                        tabs.adapters.enableColResize();
                        break;

                    case '#tab-instances':
                        tabs.instances.init();
                        break;

                    case '#tab-users':
                        tabs.users.init();
                        break;

                    case '#tab-groups':
                        tabs.groups.init();
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

                $('#tabs ul.ui-tabs-nav')
                    .append('<button class="menu-button" id="button-logout" title="' + _('Logout') + '"></button>' +
                        '<button class="menu-button" id="button-system" title="' + _('System') + '"></button>' +
                        '<div id="current-user" class="menu-button" style="padding-right: 10px; padding-top: 5px; height: 16px"></div>' +
                        '<button class="menu-button" id="button-edit-tabs"></button>' +
                        '<select id="tabs-show"></select>');

                if (showTabs) {
                    $('#tabs-show').html('<option value="">' + _('Show...') + '</option>' + showTabs).show()

                    $('#tabs-show').selectmenu({
                        width: 150,
                        change: function () {
                            if ($(this).val()) {
                                main.systemConfig.common.tabs.push($(this).val());
                                // save
                                main.socket.emit('setObject', 'system.config', main.systemConfig, function (err) {
                                    if (err) {
                                        main.showError(err);
                                        return;
                                    }
                                });
                                initTabs();
                            }
                        }
                    });
                } else {
                    $('#tabs-show').html('').hide();
                }

                $('#button-edit-tabs').button({
                    icons: {primary: 'ui-icon-pencil'},
                    text: false
                }).click(function () {
                    if (main.editTabs) {
                        $('.tab-close').hide();
                        $('#tabs-show-button').hide();
                        main.editTabs = false;
                        $(this).removeClass('ui-state-error');
                    } else {
                        $('.tab-close').show();
                        $('#tabs-show-button').show();
                        $(this).addClass('ui-state-error');
                        main.editTabs = true;
                    }
                });
                if (!main.editTabs) {
                    $('.tab-close').hide();
                    $('#tabs-show-button').hide();
                } else {
                    $('#button-edit-tabs').addClass('ui-state-error');
                }


                $('#button-logout').button().click(function () {
                    window.location.href = '/logout/';
                });

                if (!main.systemConfig.error) {
                    $('#button-system').button({
                        icons: {primary: 'ui-icon-gear'},
                        text: false
                    }).click(function () {
                        $('#system_activeRepo').html('');
                        if (systemRepos && systemRepos.native.repositories) {
                            for (var repo in systemRepos.native.repositories) {
                                $('#system_activeRepo').append('<option value="' + repo + '">' + repo + '</option>');
                            }
                        } else {
                            $('#tab-system-repo').html(_('permissionError'));
                        }

                        $('#diagMode').val(main.systemConfig.common.diag).change(function () {
                            main.socket.emit('sendToHost', main.currentHost, 'getDiagData', $(this).val(), function (obj) {
                                $('#diagSample').html(JSON.stringify(obj, null, 2));
                            });
                        });
                        $('#diagMode').trigger('change');

                        // collect all history instances
                        $('#system_defaultHistory').html('<option value=""></option>');
                        for (var id = 0; id < main.instances.length; id++) {
                            if (main.objects[main.instances[id]].common.type === 'storage') {
                                $('#system_defaultHistory').append('<option value="' + main.instances[id].substring('system.adapter.'.length) + '">' + main.instances[id].substring('system.adapter.'.length) + '</option>');
                            }
                        }

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
                                        $this.val(main.systemConfig.common[id] ? 'true' : 'false');
                                    } else {
                                        $this.val(main.systemConfig.common[id]);
                                    }
                                }

                            });
                        });
                        $('#tabs-system').tabs({
                            activate: function (event, ui)  {
                                if (ui.newPanel.selector == '#tab-system-certs') {
                                    $('#drop-zone').show().css({opacity: 1}).animate({opacity: 0}, 2000, function () {
                                        $('#drop-zone').hide().css({opacity: 1});
                                    });
                                }
                            }
                        });

                        $dialogSystem.dialog('open');
                    });
                } else {
                    $('#button-system').hide();
                }

                window.onhashchange = navigation;
                navigation();
            }
        });
        main.socket.emit('authEnabled', function (auth, user) {
            if (!auth) $('#button-logout').remove();
            $('#current-user').html(user ? user[0].toUpperCase() + user.substring(1).toLowerCase() : '');
        });
        resizeGrids();
    }

    function initTabs() {
        // extract all additional instances
        var text     = '';
        var list     = [];
        var showTabs = '';

        var addTabs = [];
        for (var i = 0; i < main.instances.length; i++) {
            if (!main.objects[main.instances[i]].common ||
                !main.objects[main.instances[i]].common.adminTab ||
                !(main.objects[main.instances[i]].common.enabled || main.objects[main.instances[i]].common.adminTab.singleton)) continue;

            if (main.objects[main.instances[i]].common.adminTab.singleton) {
                addTabs.indexOf() == -1
                var isFound = false;
                var inst1 = main.instances[i].replace(/\.(\d+)$/, '.');
                for (var j = 0; j < addTabs.length; j++) {
                    var inst2 = addTabs[j].replace(/\.(\d+)$/, '.');
                    if (inst1 == inst2) {
                        isFound = true;
                        break;
                    }
                }
                if (!isFound) addTabs.push(main.instances[i]);
            } else {
                addTabs.push(main.instances[i]);
            }
        }

        // Build the standart tabs together
        $('.admin-tab').each(function () {
            list.push($(this).attr('id'));
            if (!main.systemConfig.common.tabs || main.systemConfig.common.tabs.indexOf($(this).attr('id')) != -1) {
                text += '<li><a href="#' + $(this).attr('id') + '">' + _($(this).data('name')) + '</a><button class="tab-close" data-tab="' + $(this).attr('id') + '"></button></li>\n';
                $(this).show().appendTo($('#tabs'));
            } else {
                if ($(this).parent().prop('tagName') !== 'BODY') {
                    $(this).appendTo($('body'));
                    var $t = $(this);
                    setTimeout(function () {
                        $t.hide()
                    }, 100);
                }
                showTabs += '<option value="' + $(this).attr('id') + '">' + _($(this).data('name')) + '</option>';
            }
        });

        // Look for adapter tabs
        for (var a = 0; a < addTabs.length; a++) {
            var name = 'tab-' + main.objects[addTabs[a]].common.name;
            var link = main.objects[addTabs[a]].common.adminTab.link || '';
            var parts = addTabs[a].split('.');
            var buttonName;

            if (main.objects[addTabs[a]].common.adminTab.name) {
                if (typeof main.objects[addTabs[a]].common.adminTab.name == 'object') {
                    if (main.objects[addTabs[a]].common.adminTab.name[systemLang]) {
                        buttonName = main.objects[addTabs[a]].common.adminTab.name[systemLang];
                    } else if (main.objects[addTabs[a]].common.adminTab.name.en) {
                        buttonName = _(main.objects[addTabs[a]].common.adminTab.name.en);
                    } else {
                        buttonName = _(main.objects[addTabs[a]].common.name);
                    }
                } else {
                    buttonName = _(main.objects[addTabs[a]].common.adminTab.name);
                }
            } else {
                buttonName = _(main.objects[addTabs[a]].common.name);
            }

            if (!main.objects[addTabs[a]].common.adminTab.singleton) {
                if (link.indexOf('?') != -1) {
                    link += '&instance=' + parts[3];
                } else {
                    link += '?instance=' + parts[3];
                }
                buttonName += '.' + parts[3];
                name += '-' + parts[3];
            } else {
                parts[3] = 0;
            }

            list.push(name);

            if (!main.systemConfig.common.tabs || main.systemConfig.common.tabs.indexOf(name) != -1) {
                var isReplace = false;
                if (!link) {
                    link = '/adapter/' + parts[2] + '/tab.html';
                } else {
                    // convert "http://%ip%:%port%" to "http://localhost:1880"
                    /*main.tabs.instances._replaceLinks(link, parts[2], parts[3], name, function (link, adapter, instance, arg) {
                        $('#' + arg).data('src', link);
                    });*/
                    isReplace = (link.indexOf('%') != -1);
                }

                text += '<li><a href="#' + name + '">' + buttonName + '</a><button class="tab-close" data-tab="' + name + '"></button></li>\n';

                if (!$('#' + name).length) {
                    var div = '<div id="' + name + '" class="tab-custom ' + (isReplace ? 'link-replace': '') + '" data-adapter="' + parts[2] + '" data-instance="' + parts[3] + '" data-src="' + link + '">' +
                        '<iframe class="iframe-in-tab" style="border:0 solid #FFF; display:block; left:0; top:0; width: 100%;"></iframe></div>';
                    $(div).appendTo($('#tabs'));
                } else {
                    $('#' + name).show().appendTo($('#tabs'));
                }
            } else {
                $('#' + name).hide().appendTo($('body'));
                showTabs += '<option value="' + name + '">' + buttonName + '</option>';
            }
        }
        $('.tab-custom').each(function () {
            if (list.indexOf($(this).attr('id')) == -1) {
                $('#' + $(this).attr('id')).remove();
            }
        });


        if (!main.systemConfig.common.tabs) main.systemConfig.common.tabs = list;
        $('#tabs-ul').html(text);

        $('.tab-close').button({
            icons: {primary: 'ui-icon-close'},
            text: false
        }).unbind('click').click(function () {
            var pos = main.systemConfig.common.tabs.indexOf($(this).data('tab'));
            if (pos != -1) {
                main.systemConfig.common.tabs.splice(pos, 1);
                // save
                main.socket.emit('setObject', 'system.config', main.systemConfig, function (err) {
                    if (err) {
                        main.showError(err);
                        return;
                    }
                });
            }
            initTabs();
        }).css({width: 16, height: 16});

        $('#tabs').hide();
        if ($('#tabs').tabs('instance')) {
            $('#tabs').tabs('destroy');
        }
        if ($('.link-replace').length) {
            var countLink = 0;

            // If some objects cannot be read => go by timeout
            var loadTimeout = setTimeout(function() {
                loadTimeout = null;
                initHtmlTabs(showTabs);
            }, 1000);

            $('.link-replace').each(function () {
                // convert "http://%ip%:%port%" to "http://localhost:1880"
                countLink++;
                main.tabs.instances._replaceLinks($(this).data('src'), $(this).data('adapter'), $(this).data('instance'), $(this).attr('id'), function (link, adapter, instance, arg) {
                    $('#' + arg).data('src', link).removeClass('link-replace');
                    if (!(--countLink)) {
                        if (loadTimeout) {
                            clearTimeout(loadTimeout);
                            loadTimeout = null;
                        }
                        initHtmlTabs(showTabs);
                    }
                });
            });
        } else {
            initHtmlTabs(showTabs);
        }
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
                                if (id == 'isFloatComma') common[id] = (common[id] === 'true' || common[id] === true);
                            }
                        });

                        // Fill the repositories list
                        var links = {};
                        if (systemRepos) {
                            for (var r in systemRepos.native.repositories) {
                                if (typeof systemRepos.native.repositories[r] == 'object' && systemRepos.native.repositories[r].json) {
                                    links[systemRepos.native.repositories[r].link] = systemRepos.native.repositories[r].json;
                                }
                            }
                            systemRepos.native.repositories = {};
                        }

                        var data = $gridRepo.jqGrid('getRowData');
                        if (systemRepos) {
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
                        }
                        common.diag = $('#diagMode').val();

                        if (systemCerts) {
                            // Fill the certificates list
                            systemCerts.native.certificates = {};
                            data = $gridCerts.jqGrid('getRowData');
                            for (var j = 0; j < data.length; j++) {
                                systemCerts.native.certificates[data[j].name] = string2cert(data[j].name, data[j].certificate);
                            }
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
                            } else {
                                main.showError(err);
                                return;
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
                    var changed = false;
                    if (Array.isArray(newId)) {
                        for (var id = 0; id < newId.length; id++) {
                            if (obj.common.members.indexOf(newId[id]) === -1) {
                                obj.common.members.push(newId[id]);
                                changed = true;
                            }
                        }
                    } else {
                        if (obj.common.members.indexOf(newId) === -1) {
                            obj.common.members.push(newId);
                            changed = true;
                        }
                    }
                    if (changed) {
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
            loadComplete: function () {
                initRepoButtons();
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

    function addCert(name, text) {
        // Find last id;
        var id = 1;
        var ids = $gridCerts.jqGrid('getDataIDs');
        while (ids.indexOf('cert_' + id) != -1) {
            id++;
        }
        // Find new unique name
        var found;
        var newText = name || _('New');
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
            certificate: text || '',
            commands:
                '<button data-cert-id="' + id + '" class="cert-edit-submit">'   + _('edit')   + '</button>' +
                '<button data-cert-id="' + id + '" class="cert-delete-submit">' + _('delete') + '</button>' +
                '<button data-cert-id="' + id + '" class="cert-ok-submit" style="display:none">' + _('ok') + '</button>' +
                '<button data-cert-id="' + id + '" class="cert-cancel-submit" style="display:none">' + _('cancel') + '</button>'
        });

        initCertButtons();
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
            loadComplete: function () {
                initCertButtons();
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
                addCert();
            },
            position: 'first',
            id:       'add-cert',
            title:    _('new certificate'),
            cursor:   'pointer'
        }).jqGrid('navButtonAdd', '#pager-certs', {
            caption: '',
            buttonicon: 'ui-icon-disk',
            onClickButton: function () {
                $("#drop-file").trigger('click');
            },
            position: 'second',
            id:       'add-cert-from-file',
            title:    _('Add certificate from file'),
            cursor:   'pointer'
        });
    }

    // Grids content

    // ----------------------------- Repositories show and Edit ------------------------------------------------
    function initRepoGrid(update) {
        $gridRepo.jqGrid('clearGridData');

        if (systemRepos && systemRepos.native.repositories) {
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
        } else {
            $('#tab-system-repo').html(_('permissionError'));
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

    function fileHandler(event) {
        event.preventDefault();
        var file = event.dataTransfer ? event.dataTransfer.files[0] : event.target.files[0];

        if (file.size > 10000) {
            $('#drop-text').html(_('File is too big!'));
            $dz.addClass('dropZone-error').animate({opacity: 0}, 1000, function () {
                $dz.hide().removeClass('dropZone-error').css({opacity: 1});
                main.showError(_('File is too big!'));
                $('#drop-text').html(_('Drop the files here'));
            });
            return false;
        }
        var $dz = $('#drop-zone').show();
        var reader = new FileReader();
        reader.onload = function (evt) {
            var text;
            try {
                text = atob(evt.target.result.split(',')[1]); // string has form data:;base64,TEXT==
            } catch(err) {
                $('#drop-text').html(_('Cannot read file!'));
                $dz.addClass('dropZone-error').animate({opacity: 0}, 1000, function () {
                    $dz.hide().removeClass('dropZone-error').css({opacity: 1});
                    main.showError(_('Cannot read file!'));
                    $('#drop-text').html(_('Drop the files here'));
                });
                return;
            }
            text = text.replace(/(\r\n|\n|\r)/gm, '');
            if (text.indexOf('BEGIN RSA PRIVATE KEY') != -1) {
                $dz.hide();
                addCert('private', text);
            } else if (text.indexOf('BEGIN CERTIFICATE') != -1) {
                $dz.hide();
                addCert('public', text);
            } else {
                $('#drop-text').html(_('Unknown file format!'));
                $dz.addClass('dropZone-error').animate({opacity: 0}, 1000, function () {
                    $dz.hide().removeClass('dropZone-error').css({opacity: 1});
                    main.showError(_('Unknown file format!'));
                    $('#drop-text').html(_('Drop the files here'));
                });
            }
        };
        reader.readAsDataURL(file);
    }

    // ----------------------------- Certificates show and Edit ------------------------------------------------
    function initCertsGrid(update) {
        $gridCerts.jqGrid('clearGridData');
        if (systemCerts && systemCerts.native.certificates) {
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
        } else {
            $('#tab-system-certs').html(_('permissionError'));
        }


        $gridCerts.trigger('reloadGrid');

        var $dropZone = $('#tab-system-certs');
        if (typeof(window.FileReader) !== 'undefined' && !$dropZone.data('installed')) {
            $dropZone.data('installed', true);
            var $dz = $('#drop-zone');
            $('#drop-text').html(_('Drop the files here'));
            $dropZone[0].ondragover = function() {
                $dz.unbind('click');
                $dz.show();
                return false;
            };
            $dz.click(function () {
                $dz.hide();
            })

            $dz[0].ondragleave = function() {
                $dz.hide();
                return false;
            };

            $dz[0].ondrop = fileHandler;
        }

        $("#drop-file").change(fileHandler);
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

    // ----------------------------- Objects show and Edit ------------------------------------------------
    function getObjects(callback) {
        main.socket.emit('getObjects', function (err, res) {
            setTimeout(function () {
                var obj;
                main.objects = res;
                for (var id in main.objects) {
                    if (id.slice(0, 7) === '_design') continue;

                    obj = main.objects[id];

                    if (obj.type === 'instance') {
                        main.instances.push(id);
                    }
                    if (obj.type === 'enum')     enums.push(id);
//                    if (obj.type === 'script')   tabs.scripts.list.push(id);
                    if (obj.type === 'user')     tabs.users.list.push(id);
                    if (obj.type === 'group')    tabs.groups.list.push(id);
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
                        if (addr) tabs.hosts.list.push({name: obj.common.hostname, address: addr, id: obj._id});
                    }
                    //treeInsert(id);
                }
                main.objectsLoaded = true;

                initTabs();

                // If history enabled
                tabs.objects.checkHistory();

                // Detect if some script engine instance installed
//                var engines = tabs.scripts.fillEngines();

                // Disable scripts tab if no one script engine instance found
//              if (!engines || !engines.length) $('#tabs').tabs('option', 'disabled', [4]);

                // Show if update available
                tabs.hosts.initList();

                if (typeof callback === 'function') callback();
            }, 0);
        });
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
        tabs.adapters.stateChange(id, state);
    }

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

        if ($gridEnums) $gridEnums.selectId('object', id, obj);

        // If system config updated
        if (id == 'system.config') {
            // Check language
            if (main.systemConfig.common.language != obj.common.language) {
                window.location.reload();
            }

            main.systemConfig = obj;
            initTabs();
        }

        //tabs.adapters.objectChange(id, obj);
        tabs.instances.objectChange(id, obj);

        if (id.match(/^system\.adapter\.[\w-]+\.[0-9]+$/)) {
            if (obj && obj.common && obj.common.adminTab) {
                initTabs();
            }
        }

        if (id.match(/^system\.adapter\.history\.[0-9]+$/)) {
            // Update all states if history enabled or disabled
            tabs.objects.reinit();
        }

        /*if (id.match(/^system\.adapter\.[-\w]+\.[0-9]+$/)) {
            // Disable scripts tab if no one script engine instance found
            var engines = tabs.scripts.fillEngines();
            $('#tabs').tabs('option', 'disabled', (engines && engines.length) ? [] : [4]);
        }*/

        tabs.hosts.objectChange(id, obj);

        //tabs.scripts.objectChange(id, obj);

        // Update groups
        tabs.groups.objectChange(id, obj);

        // Update users
        tabs.users.objectChange(id, obj);

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

    function monitor () {
        if (main._timer) return;
        var ts = (new Date()).getTime();
        if (ts - main._lastTimer > 30000) {
            // It seems, that PC was in a sleep => Reload page to request authentication anew
            location.reload();
        } else {
            main._lastTimer = ts;
        }
        main._timer = setTimeout(function () {
            main._timer = null;
            monitor();
        }, 10000);
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

    main.socket.on('permissionError', function (err) {
        main.showMessage(_('Has no permission to %s %s %s', err.operation, err.type, (err.id || '')));
    });
    main.socket.on('stateChange', function (id, obj) {
        setTimeout(stateChange, 0, id, obj);
    });
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

            main.socket.emit('authEnabled', function (auth, user) {
                if (!auth) $('#button-logout').remove();
                $('#current-user').html(user ? user[0].toUpperCase() + user.substring(1).toLowerCase() : '');
                if (auth) {
                    main._lastTimer = (new Date()).getTime();
                    monitor();
                }
            });
            main.socket.emit('getUserPermissions', function (err, acl) {
                main.acl = acl;
                // Read system configuration
                main.socket.emit('getObject', 'system.config', function (errConfig, data) {
                    main.systemConfig = data;
                    main.socket.emit('getObject', 'system.repositories', function (errRepo, repo) {
                        systemRepos = repo;
                        main.socket.emit('getObject', 'system.certificates', function (errCerts, certs) {
                            setTimeout(function () {
                                systemCerts = certs;
                                if (errConfig == 'permissionError') {
                                    main.systemConfig = {common: {language: systemLang}, error: 'permissionError'};
                                } else {
                                    if (!errConfig && main.systemConfig && main.systemConfig.common) {
                                        systemLang = main.systemConfig.common.language || systemLang;
                                        if (!main.systemConfig.common.licenseConfirmed) {
                                            // Show license agreement
                                            var language = main.systemConfig.common.language || window.navigator.userLanguage || window.navigator.language;
                                            if (language != 'en' && language != 'de' && language != 'ru') language = 'en';

                                            $('#license_text').html(license[language] || license.en);
                                            $('#license_language_label').html(translateWord('Select language', language));
                                            $('#license_language').val(language).show();
                                            $('#license_checkbox').show();
                                            $('#license_checkbox').html(translateWord('license_checkbox', language));
                                            $('#license_agree .ui-button-text').html(translateWord('agree', language));
                                            $('#license_non_agree .ui-button-text').html(translateWord('not agree', language));
                                            $('#license_terms').html(translateWord('License terms', language));

                                            $('#license_language').change(function () {
                                                language = $(this).val();
                                                $('#license_language_label').html(translateWord('Select language', language));
                                                $('#license_text').html(license[language] || license.en);
                                                $('#license_checkbox').html(translateWord('license_checkbox', language));
                                                $('#license_agree .ui-button-text').html(translateWord('agree', language));
                                                $('#license_non_agree .ui-button-text').html(translateWord('not agree', language));
                                                $('#license_terms').html(translateWord('License terms', language));
                                                $dialogLicense.dialog('option', 'title', translateWord('license agreement', language));
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
                                                title: translateWord('license agreement', language),
                                                buttons: [
                                                    {
                                                        text: translateWord('agree', language),
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
                                                        text: translateWord('not agree', language),
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
                                                licenseConfirmed: false,        // If license agreement confirmed,
                                                defaultHistory:   ''            // Default history instance
                                            }
                                        };
                                        main.systemConfig.common.language = window.navigator.userLanguage || window.navigator.language;

                                        if (main.systemConfig.common.language !== 'en' && main.systemConfig.common.language !== 'de' && main.systemConfig.common.language !== 'ru') {
                                            main.systemConfig.common.language = 'en';
                                        }
                                    }
                                }

                                translateAll();

                                // Here we go!
                                initAllDialogs();
                                prepareEnumMembers();
                                tabs.hosts.prepare();
                                tabs.objects.prepare();
                                tabs.states.prepare();
                                tabs.adapters.prepare();
                                tabs.instances.prepare();
                                tabs.users.prepare();
                                tabs.groups.prepare();
                                //tabs.scripts.prepare();
                                tabs.objects.prepareHistory();
                                prepareRepos();
                                prepareCerts();
                                resizeGrids();

                                $("#load_grid-enums").show();

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
    main.socket.on('repoUpdated', function () {
        setTimeout(function () {
            tabs.adapters.init(true);
        }, 0);
    })

    main.socket.on('reauthenticate', function () {
        location.reload();
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
        tabs.hosts.resize(x, y);
        tabs.users.resize(x, y);
        tabs.groups.resize(x, y);
        $('.iframe-in-tab').height(y - 55);
    }
    function navigation() {
        if (window.location.hash) {
            var tab = 'tab-' + window.location.hash.slice(1);
            var index = $('#tabs a[href="#' + tab + '"]').parent().index() - 1;
            $('#tabs').tabs('option', 'active', index);
            if (tab == 'tab-hosts') tabs.hosts.init();
        } else {
            tabs.hosts.init();
        }
    }

    $(window).resize(resizeGrids);

});
})(jQuery);
