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
var adapterRedirect = function (redirect, timeout) {
    if (redirect) {
        setTimeout(function () {
            redirect += document.location.pathname;
            redirect += document.location.hash;
            document.location.href = redirect;
        }, timeout || 5000);
    }
};

(function ($) {
$(document).ready(function () {
    var main = {
        objects:        {},
        states:         {},
        currentHost:    '',
        socket:         io.connect('/', {path: location.pathname + 'socket.io'}),
        systemConfig:   null,
        instances:      null,
        objectsLoaded:  false,
        waitForRestart: false,
        tabs:           null,
        selectId:       null,
        config:         {},
        addEventMessage: function (id, state, rowData) {
            tabs.events.addEventMessage(id, state, rowData);
        },
        saveConfig:     function (attr, value) {
            if (attr) main.config[attr] = value;

            if (typeof storage !=='undefined') {
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
        confirmMessage: function (message, title, icon, buttons, callback) {
            if (typeof buttons === 'function') {
                callback = buttons;
                $dialogConfirm.dialog('option', 'buttons', [
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

                ]);
            } else if (typeof buttons === 'object') {
                for (var b = 0; b < buttons.length; b++) {
                    buttons[b] = {
                        text: buttons[b],
                        id: 'dialog-confirm-button-' + b,
                        click: function (e) {
                            var id = parseInt(e.currentTarget.id.substring('dialog-confirm-button-'.length), 10);
                            var cb = $(this).data('callback');
                            $(this).dialog('close');
                            if (cb) cb(id);
                        }
                    }
                }
                $dialogConfirm.dialog('option', 'buttons', buttons);
            }

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
        formatDate:     function (dateObj, justTime) {
            //return dateObj.getFullYear() + '-' +
            //    ("0" + (dateObj.getMonth() + 1).toString(10)).slice(-2) + '-' +
            //    ("0" + (dateObj.getDate()).toString(10)).slice(-2) + ' ' +
            //    ("0" + (dateObj.getHours()).toString(10)).slice(-2) + ':' +
            //    ("0" + (dateObj.getMinutes()).toString(10)).slice(-2) + ':' +
            //    ("0" + (dateObj.getSeconds()).toString(10)).slice(-2);
            // Following implementation is 5 times faster
            if (!dateObj) return '';
            var text = typeof dateObj;
            if (text === 'string') {
                if (justTime) {
                    return dateObj.substring(8);
                } else {
                    return dateObj;
                }
            }
            // if less 2000.01.01 00:00:00
            if (text !=='object') dateObj = dateObj < 946681200000 ? new Date(dateObj * 1000) : new Date(dateObj);

            var v;
            if (!justTime) {
                text = dateObj.getFullYear();
                v = dateObj.getMonth() + 1;
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
            } else {
                v = dateObj.getDate();
                if (v < 10) {
                    text = '0' + v;
                } else {
                    text = v;
                }
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

            v = dateObj.getMilliseconds();
            if (v < 10) {
                text += '.00' + v;
            } else if (v < 100) {
                text += '.0' + v;
            } else {
                text += '.' + v;
            }

            return text;
        },

        _delObject: function (idOrList, callback) {
            var id;
            if (typeof idOrList === 'object') {
                if (!idOrList || !idOrList.length) {
                    if (callback) callback(null);
                    return;
                }
                id = idOrList.pop();
            } else {
                id = idOrList;
            }

            if (main.objects[id] && main.objects[id].common && main.objects[id].common['object-non-deletable']) {
                main.showMessage(_('Cannot delete "%s" because not allowed', id), '', 'notice');
                if (typeof idOrList === 'object') {
                    setTimeout(function () {
                        this._delObject(idOrList, callback);
                    }.bind(this), 0);
                } else {
                    if (callback) {
                        setTimeout(function () {
                            callback(null, idOrList);
                        }, 0);
                    }
                }
            } else {
                var obj = main.objects[id];
                main.socket.emit('delObject', id, function (err) {
                    if (err && err !=='Not exists') {
                        main.showError(err);
                        return;
                    }
                    if (obj && obj.type === 'state') {
                        main.socket.emit('delState', id, function (err) {
                            if (err && err !=='Not exists') {
                                main.showError(err);
                                return;
                            }
                            if (typeof idOrList === 'object') {
                                setTimeout(function () {
                                    this._delObject(idOrList, callback);
                                }.bind(this), 0);
                            } else {
                                if (callback) {
                                    setTimeout(function () {
                                        callback(null, idOrList);
                                    }, 0);
                                }
                            }
                        }.bind(this));
                    } else {
                        if (typeof idOrList === 'object') {
                            setTimeout(function () {
                                this._delObject(idOrList, callback);
                            }.bind(this), 0);
                        } else {
                            if (callback) {
                                setTimeout(function () {
                                    callback(null, idOrList);
                                }, 0);
                            }
                        }
                    }
                }.bind(this));
            }
        },
        _delObjects: function (rootId, isAll, callback) {
            if (!isAll) {
                this._delObject(rootId, callback);
            } else {
                var list = [];
                for (var id in main.objects) {
                    if (id.substring(0, rootId.length + 1) === rootId + '.') {
                        list.push(id);
                    }
                }
                list.push(rootId);
                list.sort();
                var len = list.length;
                this._delObject(list, function () {
                    if (callback) callback();
                });
            }
        },

        __delObject:    function ($tree, id, callback) {
            var leaf = $tree ? $tree.selectId('getTreeInfo', id) : null;
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
                        if (err && err !=='Not exists') {
                            main.showError(err);
                            return;
                        }
                        main.socket.emit('delState', id, function (err) {
                            if (err && err !=='Not exists') {
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
        delObject:      function ($tree, id, callback) {
            var leaf = $tree ? $tree.selectId('getTreeInfo', id) : null;
            if (main.objects[id]) {
                if (leaf && leaf.children) {
                    // ask if only object must be deleted or just this one
                    main.confirmMessage(_('Do you want to delete just <span style="color: blue">one object</span> or <span style="color: red">all</span> children of %s too?', id), null, 'help', [_('_All'), _('Only one'), _('Cancel')], function (result) {
                        // If all
                        if (result === 0) {
                            main._delObjects(id, true, callback);
                        } else
                        // if only one object
                        if (result === 1) {
                            main._delObjects(id, false, callback);
                        } // else do nothing
                    });
                } else {
                    main.confirmMessage(_('Are you sure to delete %s?', id), null, 'help', function (result) {
                        // If all
                        if (result) main._delObjects(id, true, callback);
                    });
                }
            } else if (leaf && leaf.children) {
                main.confirmMessage(_('Are you sure to delete all children of %s?', id), null, 'help', function (result) {
                    // If all
                    if (result) main._delObjects(id, true, callback);
                });
            } else {
                main.showMessage(_('Object "<b>%s</b>" does not exists. Update the page.', id), null, 'help', function (result) {
                    // If all
                    if (result) main._delObjects(id, true, callback);
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
        },
        updateWizard: function () {
            var $wizard = $('#button-wizard');
            if (main.objects['system.adapter.discovery.0']) {
                if (!$wizard.data('inited')) {
                    $wizard.data('inited', true);
                    $wizard.button({
                        icons: {primary: ' ui-icon-search'},
                        text: false
                    }).click(function () {
                        $('#tabs').tabs('option', 'active', 1);
                        // open configuration dialog
                        main.tabs.instances.showConfigDialog('system.adapter.discovery.0');
                    }).attr('title', _('Device discovery'));
                }
                $wizard.show();
            } else {
                $wizard.hide();
            }
        }
    };

    var tabs = {
        adapters:   new Adapters(main),
        instances:  new Instances(main),
        logs:       new Logs(main),
        states:     new States(main),
        objects:    new Objects(main),
        events:     new Events(main),
        hosts:      new Hosts(main),
        users:      new Users(main),
        groups:     new Groups(main),
        enums:      new Enums(main)
    };

    main.instances = tabs.instances.list;
    main.tabs      = tabs;
    main.systemDialog = new System(main);

    var children =              {};

    var cmdCallback =           null;
    var stdout;
    var activeCmdId =           null;

    var $stdout =               $('#stdout');

    var $dialogCommand =        $('#dialog-command');
    var $dialogLicense =        $('#dialog-license');
    var $dialogMessage =        $('#dialog-message');
    var $dialogConfirm =        $('#dialog-confirm');

    var firstConnect =          true;

    // Read all positions, selected widgets for every view,
    // Selected view, selected menu page,
    // Selected widget or view page
    // Selected filter
    if (typeof storage !== 'undefined') {
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

    function initHtmlTabs(showTabs) {
        // jQuery UI initializations
        var $tabs = $('#tabs');
        if (!$tabs.data('inited')) {
            $tabs.data('inited', true);
            $tabs.show().tabs({
                activate: function (event, ui) {
                    window.location.hash = '#' + ui.newPanel.selector.slice(5);

                    var $panel = $(ui.newPanel.selector);
                    // Init source for iframe
                    if ($panel.length) {
                        var link = $panel.data('src');
                        if (link && link.indexOf('%') === -1) {
                            var $iframe = $panel.find('iframe');
                            if ($iframe.length && !$iframe.attr('src')) {
                                $iframe.attr('src', link);
                            }
                        } else {
                            $tabs.data('problem-link', ui.newPanel.selector);
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
                            tabs.enums.init();
                            break;

                        case '#tab-log':
                            tabs.logs.init();
                            break;
                    }
                },
                create: function () {
                    $('#tabs ul.ui-tabs-nav').prepend('<li class="header">ioBroker.admin</li>');

                    var buttons = '<button class="menu-button" id="button-logout" title="' + _('Logout') + '"></button>';
                    buttons += '<button class="menu-button" id="button-system" title="' + _('System') + '"></button>';
                    buttons += '<div id="current-user" class="menu-button" style="padding-right: 10px; padding-top: 5px; height: 16px"></div>';
                    buttons += '<button class="menu-button" id="button-edit-tabs"></button>';
                    buttons += '<button class="menu-button" id="button-wizard"></button>';
                    buttons += '<select id="tabs-show"></select>';

                    $('#tabs ul.ui-tabs-nav').append(buttons);

                    if (showTabs) {
                        $('#tabs-show').html('<option value="">' + _('Show...') + '</option>' + showTabs).show();

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

                    main.updateWizard();

                    if (!main.editTabs) {
                        $('.tab-close').hide();
                        $('#tabs-show-button').hide();
                    } else {
                        $('#button-edit-tabs').addClass('ui-state-error');
                    }

                    $('#button-logout').button({
                        text: false
                    }).click(function () {
                        window.location.href = '/logout/';
                    });

                    main.systemDialog.init();

                    window.onhashchange = navigation;
                    navigation();
                }
            });
            main.socket.emit('authEnabled', function (auth, user) {
                if (!auth) $('#button-logout').remove();
                $('#current-user').html(user ? user[0].toUpperCase() + user.substring(1).toLowerCase() : '');
            });
            resizeGrids();

            $('#events_threshold').click(function () {
                main.socket.emit('eventsThreshold', false);
            });
        } else {
            var panelSelector = $tabs.data('problem-link');
            if (panelSelector) {
                var $panel = $(panelSelector);
                // Init source for iframe
                if ($panel.length) {
                    var link = $panel.data('src');
                    if (link && link.indexOf('%') === -1) {
                        var $iframe = $panel.find('iframe');
                        if ($iframe.length && !$iframe.attr('src')) {
                            $iframe.attr('src', link);
                            $tabs.data('problem-link', null);
                        }
                    }
                }
            }
        }
    }

    function initTabs() {
        // extract all additional instances
        var text     = '';
        var list     = [];
        var showTabs = '';

        var addTabs = [];
        for (var i = 0; i < main.instances.length; i++) {
            if (!main.objects[main.instances[i]].common ||
                !main.objects[main.instances[i]].common.adminTab) continue;

            if (main.objects[main.instances[i]].common.adminTab.singleton) {
                var isFound = false;
                var inst1 = main.instances[i].replace(/\.(\d+)$/, '.');
                for (var j = 0; j < addTabs.length; j++) {
                    var inst2 = addTabs[j].replace(/\.(\d+)$/, '.');
                    if (inst1 === inst2) {
                        isFound = true;
                        break;
                    }
                }
                if (!isFound) addTabs.push(main.instances[i]);
            } else {
                addTabs.push(main.instances[i]);
            }
        }

        // Build the standard tabs together
        $('.admin-tab').each(function () {
            list.push($(this).attr('id'));
            if (!main.systemConfig.common.tabs || main.systemConfig.common.tabs.indexOf($(this).attr('id')) !==-1) {
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
            var link = main.objects[addTabs[a]].common.adminTab.link || '/adapter/' + main.objects[addTabs[a]].common.name + '/tab.html';
            var parts = addTabs[a].split('.');
            var buttonName;

            if (main.objects[addTabs[a]].common.adminTab.name) {
                if (typeof main.objects[addTabs[a]].common.adminTab.name === 'object') {
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
                if (link.indexOf('?') !==-1) {
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

            if (!main.systemConfig.common.tabs || main.systemConfig.common.tabs.indexOf(name) !==-1) {
                var isReplace = false;
                if (!link) {
                    link = '/adapter/' + parts[2] + '/tab.html';
                } else {
                    // convert "http://%ip%:%port%" to "http://localhost:1880"
                    /*main.tabs.instances._replaceLinks(link, parts[2], parts[3], name, function (link, adapter, instance, arg) {
                        $('#' + arg).data('src', link);
                    });*/
                    isReplace = link.indexOf('%') !== -1;
                }

                text += '<li><a href="#' + name + '">' + buttonName + '</a><button class="tab-close" data-tab="' + name + '"></button></li>\n';

                if (!$('#' + name).length) {
                    var div = '<div id="' + name + '" class="tab-custom ' + (isReplace ? 'link-replace': '') + '" data-adapter="' + parts[2] + '" data-instance="' + parts[3] + '" data-src="' + link + '">' +
                        '<iframe class="iframe-in-tab" style="border: 0; solid #FFF; display:block; left: 0; top: 0; width: 100%;"></iframe></div>';
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
            if (list.indexOf($(this).attr('id')) === -1) {
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
            if (pos !==-1) {
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

        var $tabs = $('#tabs');
        $tabs.hide();
        if ($tabs.tabs('instance')) {
            $tabs.tabs('destroy');
            $tabs.data('inited', false);
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
                    if (!--countLink) {
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

        $dialogCommand.dialog({
            autoOpen:      false,
            modal:         true,
            width:         920,
            height:        480,
            closeOnEscape: false,
            open: function (event, ui) {
                $(event.target).parent().find('.ui-dialog-titlebar-close .ui-button-text').html('');
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
            width:    450,
            height:   200,
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

    tabs.logs.prepare();

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
                    if (obj.type === 'enum')     tabs.enums.list.push(id);
                    if (obj.type === 'user')     tabs.users.list.push(id);
                    if (obj.type === 'group')    tabs.groups.list.push(id);
                    if (obj.type === 'adapter')  tabs.adapters.list.push(id);
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
                        if (addr) {
                            tabs.hosts.list.push({name: obj.common.hostname, address: addr, id: obj._id});
                        } else {
                            tabs.hosts.list.push({name: obj.common.hostname, address: '127.0.0.1', id: obj._id});
                        }                    
                    }
                    
                    // convert obj.history into obj.custom
                    if (obj.common && obj.common.history) {
                        obj.common.custom = JSON.parse(JSON.stringify(obj.common.history));
                        delete obj.common.history;
                    }
                    //treeInsert(id);
                }
                main.objectsLoaded = true;

                initTabs();

                // If customs enabled
                tabs.objects.checkCustoms();

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

    function stateChange(id, state) {
        id = id ? id.replace(/ /g, '_') : '';

        if (id && id.match(/\.messagebox$/)) {
            main.addEventMessage(id, state);
        } else {
            tabs.states.stateChange(id, state);
            tabs.objects.stateChange(id, state);
            tabs.hosts.stateChange(id, state);

            if (main.selectId) main.selectId.selectId('state', id, state);
        }

        // Update alive and connected of main.instances
        tabs.instances.stateChange(id, state);
        tabs.objects.stateChangeHistory(id, state);
        tabs.adapters.stateChange(id, state);
    }

    function objectChange(id, obj) {
        //var changed = false;
        //var oldObj = null;
        var isNew = false;

        // update main.objects cache
        if (obj) {
            if (obj._rev && main.objects[id]) main.objects[id]._rev = obj._rev;
            if (!main.objects[id]) {
                isNew = true;
                //treeInsert(id);
            }
            if (isNew || JSON.stringify(main.objects[id]) !== JSON.stringify(obj)) {
                main.objects[id] = obj;
                //changed = true;
            }
        } else if (main.objects[id]) {
            //changed = true;
            //oldObj = {_id: id, type: main.objects[id].type};
            delete main.objects[id];
        }

        // update to event table
        main.addEventMessage(id, null, null, obj);

        tabs.objects.objectChange(id, obj);

        if (main.selectId) main.selectId.selectId('object', id, obj);

        tabs.enums.objectChange(id, obj);

        // If system config updated
        if (id === 'system.config') {
            // Check language
            if (main.systemConfig.common.language !== obj.common.language) {
                window.location.reload();
            }

            main.systemConfig = obj;
            initTabs();
        }

        if (id === 'system.adapter.discovery.0') main.updateWizard();

        //tabs.adapters.objectChange(id, obj);
        tabs.instances.objectChange(id, obj);

        if (obj && id.match(/^system\.adapter\.[\w-]+\.[0-9]+$/)) {
            if (obj.common && 
                obj.common.adminTab && 
                !obj.common.adminTab.ignoreConfigUpdate
            ) {
                initTabs();
            }
            
            if (obj && obj.type === 'instance') {
                if (obj.common.supportCustoms ||
                    id.match(/^system\.adapter\.history\.[0-9]+$/) ||
                    id.match(/^system\.adapter\.influxdb\.[0-9]+$/) ||
                    id.match(/^system\.adapter\.sql\.[0-9]+$/)) {
                    // Update all states if customs enabled or disabled
                    tabs.objects.reinit();
                }
            }
        }

        tabs.hosts.objectChange(id, obj);

        // Update groups
        tabs.groups.objectChange(id, obj);

        // Update users
        tabs.users.objectChange(id, obj);
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
        if (activeCmdId === _id) {
            stdout += '\n' + text;
            $stdout.val(stdout);
            $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
        }
    });
    main.socket.on('cmdStderr', function (_id, text) {
        if (activeCmdId === _id) {
            stdout += '\nERROR: ' + text;
            $stdout.val(stdout);
            $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
        }
    });
    main.socket.on('cmdExit', function (_id, exitCode) {
        if (activeCmdId === _id) {
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
    main.socket.on('eventsThreshold', function (isActive) {
        if (isActive) {
            $('#events_threshold').show();
        } else {
            $('#events_threshold').hide();
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
                        main.systemDialog.systemRepos = repo;
                        main.socket.emit('getObject', 'system.certificates', function (errCerts, certs) {
                            setTimeout(function () {
                                main.systemDialog.systemCerts = certs;
                                if (errConfig === 'permissionError') {
                                    main.systemConfig = {common: {language: systemLang}, error: 'permissionError'};
                                } else {
                                    if (!errConfig && main.systemConfig && main.systemConfig.common) {
                                        systemLang = main.systemConfig.common.language || systemLang;
                                        if (!main.systemConfig.common.licenseConfirmed) {
                                            // Show license agreement
                                            var language = main.systemConfig.common.language || window.navigator.userLanguage || window.navigator.language;
                                            if (language !=='en' && language !=='de' && language !=='ru') language = 'en';

                                            $('#license_text').html(license[language] || license.en);
                                            $('#license_language_label').html(translateWord('Select language', language));

                                            $('#license_checkbox')
                                                .show()
                                                .html(translateWord('license_checkbox', language));

                                            $('#license_agree .ui-button-text').html(translateWord('agree', language));
                                            $('#license_non_agree .ui-button-text').html(translateWord('not agree', language));
                                            $('#license_terms').html(translateWord('License terms', language));

                                            $('#license_language')
                                                .data('licenseConfirmed', false)
                                                .val(language)
                                                .show()
                                                .change(function () {
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
                                                            $('#license_language').data('licenseConfirmed', true);

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
                                                beforeClose: function (event, ui) {
                                                    return $('#license_language').data('licenseConfirmed');
                                                },
                                                open: function (event) {
                                                    $(event.target).parent().find('.ui-dialog-titlebar-close .ui-button-text').html('');
                                                    $(event.target).parent().find('.ui-dialog-titlebar-close').hide();
                                                    $('#license_checkbox').prop('checked', false);
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
                                                defaultHistory:   '',           // Default history instance
                                                tabs: [                         // Show by default only these tabs
                                                    'tab-adapters',
                                                    'tab-instances',
                                                    'tab-objects',
                                                    'tab-log',
                                                    'tab-scenes',
                                                    'tab-javascript',
                                                    'tab-text2command-0'
                                                ]
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
                                tabs.hosts.prepare();
                                tabs.objects.prepare();
                                tabs.states.prepare();
                                tabs.adapters.prepare();
                                tabs.instances.prepare();
                                tabs.users.prepare();
                                tabs.groups.prepare();
                                tabs.enums.prepare();
                                tabs.objects.prepareCustoms();
                                tabs.events.prepare();
                                main.systemDialog.prepare();
                                resizeGrids();

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
    });

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
        tabs.events.resize(x, y);
        tabs.states.resize(x, y);
        tabs.enums.resize(x, y);
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
            var $tabs = $('#tabs');
            var index = $tabs.find('a[href="#' + tab + '"]').parent().index() - 1;
            $tabs.tabs('option', 'active', index);
            if (tab === 'tab-hosts') tabs.hosts.init();
        } else {
            tabs.hosts.init();
        }
    }

    $(window).resize(resizeGrids);

});
})(jQuery);
