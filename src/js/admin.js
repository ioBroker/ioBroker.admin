/* jshint -W097 */
/* jshint strict:true */
/* jslint vars: true */
/* global io:false */
/* global jQuery:false */
/* jslint browser:true */
/* jshint browser:true */
/* global _ */
/* global ace */
/* global console */
/* global alert */
/* global confirm */
/* global systemLang: true */
/* global license */
/* global translateAll */
/* global initGridLanguage */
/* global systemLang */
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
var showConfig = null; // used in adapter settings window
var defaults = {};
var adapterRedirect = function (redirect, timeout) { // used in adapter settings window
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
    var path = location.pathname + 'socket.io';
    if (location.pathname.match(/^\/admin\//)) {
        path = '/socket.io';
    }

    var allTabs = {};

    var main = {
        objects:        {},
        states:         {},
        currentHost:    '',
        currentTab:     null,
        currentDialog:  null,
        currentUser:    '',
        subscribesStates: {},
        subscribesObjects: {},
        subscribesLogs: 0,
        socket:         io.connect('/', {path: path}),
        systemConfig:   null,
        instances:      null,
        objectsLoaded:  false,
        waitForRestart: false,
        tabs:           null,
        dialogs:        {},
        selectId:       null,
        config:         {},
        addEventMessage: function (id, stateOrObj, isMessage, isState) {
            tabs.events.addEventMessage(id, stateOrObj, isMessage, isState);
        },
        saveConfig:     function (attr, value) {
            if (attr) main.config[attr] = value;

            if (typeof storage !== 'undefined') {
                storage.set('adminConfig', JSON.stringify(main.config));
            }
        },
        saveTabs:       function () {
            this.socket.emit ('setObject', 'system.config', this.systemConfig, function (err) {
                if (err) {
                    this.showError (err);
                }
            })
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
                    return (_new[2] <= old[2]);
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

            $dialogCommand.modal('open');

            stdout = '$ ./iobroker ' + cmd;
            $dialogCommand.data('finished', false).find('.btn').html(_('In background'));
            $dialogCommand.find('.command').html(stdout);
            $dialogCommand.find('.progress-dont-close').removeClass('disabled');
            $('#admin_sidemenu_main').find('.button-command').removeClass('error').addClass('in-progress');
            $dialogCommand.data('max', null);
            $dialogCommand.data('error', '');
            $dialogCommandProgress.addClass('indeterminate').removeClass('determinate');

            if (cmd.match(/^upload /)) {
                $dialogCommand.find('.progress-text').html(_('Upload started...')).removeClass('error');
            } else if (cmd.match(/^del [-_\w\d]+\.[\d]+$/)) {
                $dialogCommand.find('.progress-text').html(_('Removing of instance...')).removeClass('error');
            } else if (cmd.match(/^del /)) {
                $dialogCommand.find('.progress-text').html(_('Removing of adapter...')).removeClass('error');
            } else if (cmd.match(/^url /)) {
                $dialogCommand.find('.progress-text').html(_('Install or update from URL...')).removeClass('error');
            }  else if (cmd.match(/^add /)) {
                $dialogCommand.find('.progress-text').html(_('Add instance...')).removeClass('error');
            } else{
                $dialogCommand.find('.progress-text').html(_('Started...')).removeClass('error');
            }

            $stdout.val(stdout);
            // generate the unique id to coordinate the outputs
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
            // if standard buttons
            if (typeof buttons === 'function') {
                callback = buttons;
                $dialogConfirm.find('.modal-footer').html(
                    '<a class="modal-action modal-close waves-effect waves-green btn-flat translate" data-result="true">' + _('Ok') + '</a>' +
                    '<a class="modal-action modal-close waves-effect waves-green btn-flat translate">' + _('Cancel') + '</a>');
                $dialogConfirm.find('.modal-footer .modal-action').click(function () {
                    var cb = $dialogConfirm.data('callback');
                    cb && cb($(this).data('result'));
                });
            } else if (typeof buttons === 'object') {
                var tButtons = '';
                for (var b = buttons.length - 1; b >= 0; b--) {
                    tButtons += '<a class="modal-action modal-close waves-effect waves-green btn-flat translate" data-id="' + b + '">' + buttons[b] + '</a>';
                }
                $dialogConfirm.find('.modal-footer').html(tButtons);
                $dialogConfirm.find('.modal-footer .modal-action').click(function () {
                    var cb = $dialogConfirm.data('callback');
                    cb && cb($(this).data('id'));
                });
            }

            $dialogConfirm.find('.dialog-title').text(title || _('Please confirm'));
            if (icon) {
                $dialogConfirm.find('.dialog-icon')
                    .show()
                    .html(icon);
            } else {
                $dialogConfirm.find('.dialog-icon').hide();
            }
            $dialogConfirm.find('.dialog-text').html(message);
            $dialogConfirm.data('callback', callback);
            $dialogConfirm.modal('open');
        },
        showMessage:    function (message, title, icon) {
            $dialogMessage.find('.dialog-title').text(title || _('Message'));
            if (icon) {
                $dialogMessage.find('.dialog-icon')
                    .show()
                    .html(icon);
            } else {
                $dialogMessage.find('.dialog-icon').hide();
            }
            $dialogMessage.find('.dialog-text').html(message);
            $dialogMessage.modal('open');
        },
        showError:      function (error) {
            main.showMessage(_(error),  _('Error'), 'error_outline');
        },
        showToast:      function (parent, message, icon, duration, isError, classes) {
            if (parent && parent instanceof jQuery) {
                parent = parent[0];
            }
            classes = classes || [];

            if (typeof classes === 'string') {
                classes = [classes];
            }
            isError && classes.push('dropZone-error');

            M.toast({
                parentSelector: parent || $('body')[0],
                html:           message + (icon ? '<i class="material-icons">' + icon + '</i>' : ''),
                displayLength:  duration || 3000,
                classes:        classes
            });
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
            if (text !== 'object') dateObj = dateObj < 946681200000 ? new Date(dateObj * 1000) : new Date(dateObj);

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
        /*initSelectId:   function () {
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
        },*/
        updateWizard:   function () {
            var $wizard = $('#button-wizard');
            if (main.objects['system.adapter.discovery.0']) {
                if (!$wizard.data('inited')) {
                    $wizard.data('inited', true);
                    $wizard/*.button({
                        icons: {primary: ' ui-icon-search'},
                        text: false
                    })*/.click(function () {
                        // open configuration dialog
                        main.navigate({
                            tab: 'instances',
                            dialog: 'config',
                            params: 'system.adapter.discovery.0'
                        });
                    }).attr('title', _('Device discovery'));
                }
                $wizard.show();

                // Show wizard dialog
                if (!main.systemConfig.common.wizard && main.systemConfig.common.licenseConfirmed) {
                    $wizard.trigger('click');
                }
            } else {
                $wizard.hide();
            }
        },
        getUser:        function () {
            if (!main.currentUser) {
                main.socket.emit('authEnabled', function (auth, user) {
                    main.currentUser = 'system.user.' + user;
                    if (!auth) {
                        $('#button-logout').remove();
                    } else {
                        main._lastTimer = (new Date()).getTime();
                        monitor();
                    }
                });
            } else if (main.objects[main.currentUser]) {
                var obj = main.objects[main.currentUser];
                var name = '';
                if (!obj || !obj.common || !obj.common.name) {
                    name = main.currentUser.replace(/^system\.user\./);
                    name = name[0].toUpperCase() + name.substring(1).toLowerCase();
                } else {
                    name = obj.common.name;
                }
                if (obj && obj.common && obj.common.icon) {
                    var objs = {};
                    objs[main.currentUser] = obj;
                    $('#current-user-icon').html(main.getIcon(main.currentUser, null, objs));
                } else {
                    $('#current-user-icon').html('<i class="large material-icons">account_circle</i>');
                }
                $('#current-user').html(name);
                var groups = [];
                for (var i = 0; i < tabs.users.groups.length; i++) {
                    var group = main.objects[tabs.users.groups[i]];
                    if (group && group.common && group.common.members && group.common.members.indexOf(main.currentUser) !== -1) {
                        groups.push(_(group.common.name));
                    }
                }
                $('#current-group').html(groups.join(', '));
            }
        },

        // Delete objects
        _delObject:     function (idOrList, callback) {
            var id;
            if (!Array.isArray(idOrList)) {
                if (typeof idOrList !== 'string') return callback && callback('invalid idOrList parameter');
                idOrList = [idOrList];
            }

            function doIt() {
                if (idOrList.length === 0) {
                    return callback && setTimeout(callback, 0, null, id);
                }
                id = idOrList.pop();
                if (main.objects[id] && main.objects[id].common && (main.objects[id].common['object-non-deletable'] || main.objects[id].common.dontDelete)) {
                    main.showMessage (_ ('Cannot delete "%s" because not allowed', id), '', 'notifications');
                    setTimeout(doIt, 0);
                } else {
                    var obj = main.objects[id];
                    main.socket.emit('delObject', id, function (err) {
                        if (err && err !== 'Not exists') {
                            main.showError (err);
                            return callback(err);
                        }
                        if (obj && obj.type === 'state') {
                            main.socket.emit ('delState', id, function (err) {
                                if (err && err !== 'Not exists') {
                                    main.showError (err);
                                    return callback(err);
                                }
                                setTimeout(doIt, 0);
                            });
                        } else {
                            setTimeout(doIt, 0);
                        }
                    });
                }
            }
            doIt();
        },
        /*_delObject_old: function (idOrList, callback) {*
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
        },*/
        _delObjects:    function (rootId, isAll, callback) {
            if (!isAll) {
                this._delObject(rootId, callback);
            } else {
                var list = [];
                for (var id in main.objects) {
                    if (main.objects.hasOwnProperty(id) && id.substring(0, rootId.length + 1) === rootId + '.') {
                        list.push(id);
                    }
                }
                list.push(rootId);
                list.sort();

                this._delObject(list, function () {
                    if (callback) callback();
                });
            }
        },
        delObject:      function ($tree, id, callback) {
            var leaf = $tree ? $tree.selectId('getTreeInfo', id) : null;
            if (main.objects[id]) {
                if (leaf && leaf.children) {
                    // ask if only object must be deleted or just this one
                    main.confirmMessage(_('Do you want to delete just <span style="color: blue">one object</span> or <span style="color: red">all</span> children of %s too?', id), null, 'help_outline', [_('_All'), _('Only one'), _('Cancel')], function (result) {
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
                    main.confirmMessage(_('Are you sure to delete %s?', id), null, 'help_outline', function (result) {
                        // If all
                        if (result) main._delObjects(id, true, callback);
                    });
                }
            } else if (leaf && leaf.children) {
                main.confirmMessage(_('Are you sure to delete all children of %s?', id), null, 'help_outline', function (result) {
                    // If all
                    if (result) main._delObjects(id, true, callback);
                });
            } else {
                main.showMessage(_('Object "<b>%s</b>" does not exists. Update the page.', id), _('Error'), 'help_outline', function (result) {
                    // If all
                    if (result) main._delObjects(id, true, callback);
                });
            }
        }
    };

    var tabs = {
        adapters:   new Adapters(main),
        instances:  new Instances(main),
        logs:       new Logs(main),
        states:     null,
        objects:    new Objects(main),
        events:     new Events(main),
        hosts:      new Hosts(main),
        users:      new Users(main),
        //groups:     new Groups(main),
        enums:      new Enums(main)
    };
    if (typeof States !== 'undefined') {
        tabs.states = new States(main);
    }

    main.instances     = tabs.instances.list;
    main.tabs          = tabs;
    main.dialogs       = {
        system:     new System(main),
        customs:    new Customs(main),
        config:     new Config(main),
        editobject: new EditObject(main),
        issue:      new Issue(main),
        readme:     new Readme(main)
    };

    var stdout;
    var cmdCallback    = null;
    var activeCmdId    = null;
    var $stdout        = $('#stdout');

    var $dialogCommand = $('#dialog-command');
    var $dialogLicense = $('#dialog-license');
    var $dialogMessage = $('#dialog-message');
    var $dialogConfirm = $('#dialog-confirm');
    var $dialogCommandProgress = $dialogCommand.find('.progress div');

    var firstConnect   = true;

    // detect touch devices
    if (!('ontouchstart' in window || navigator.maxTouchPoints)) {
        $('body').addClass('desktop-screen');
    }

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

    function initHtmlButtons() {
        $('.button-version').text('ioBroker.admin ' + (main.objects['system.adapter.admin'] && main.objects['system.adapter.admin'].common && main.objects['system.adapter.admin'].common.version));

        $('.choose-tabs-config-button').unbind('click').click(function(event) {
            var $dialog = $('#admin_sidemenu_dialog');
            var html = $dialog.html();
            if (html) {
                $dialog.html('');
                $('html').unbind('click');
                return;
            }
            setTimeout(function () {
                $('html').bind('click', function (event){
                    $dialog.html('');
                    $('html').unbind('click');
                });
            }, 100);
            var $e = $(event.target);
            var offs = $e.offset();
            offs.top += $e.height() - 2;

            var text = '' +
                '<dialog open style="margin: 0; font-family: Tahoma; font-size: 12px; white-space: nowrap; background: #fff; position: absolute; top: ' + offs.top + 'px; left: ' + offs.left + 'px;">' + // style="overflow: visible; z-index: 999; ">'
                '<div style="overflow: visible; z-index: 999; position: absolute; left:0; top: 0;">' +
                '<ul style="border: 1px solid #909090; line-height: 24px; padding:8px; margin: 0; list-style: none; float: left; background:#fff; color:#000">';

            var $lis = $('#admin_sidemenu_menu');
            for (var tid in allTabs) {
                var name = allTabs[tid];
                var found = $lis.find('.admin-sidemenu-items[data-tab="' + tid + '"]').length;
                // TABS
                /*$lis.each(function (i, e) {
                    if (tid === $(e).attr('aria-controls')) {
                        found = $(e);
                        return false;
                    }
                });*/
                var id = 'chk-' + tid;
                text += '' +
                    '<li><input ' + (found ? 'checked' : 'unchecked') + ' style="vertical-align: middle;" class="chk-tab" type="checkbox" id="' + id + '" />' +
                    '<label style="padding-left: 4px;" for="' + id + '">' + _(name) + '</label></id>';
            }
            text += '' +
                '</ul>' +
                '</div>' +
                '</dialog>';
            $dialog.append (text);

            $('.chk-tab').click(function(event) {
                var id = $(event.currentTarget).attr('id').substr(4);
                if (event.toElement.checked) {
                    main.systemConfig.common.tabs.push(id);
                } else {
                    var pos = main.systemConfig.common.tabs.indexOf(id);
                    if (id !== -1) main.systemConfig.common.tabs.splice(pos, 1);
                }
                main.saveTabs();
                initTabs();
            });
        });

        main.updateWizard();

        $('#button-logout').click(function () {
            window.location.href = '/logout/';
        });

        window.onhashchange = function () {
            main.navigateDo();
        };
        main.navigateDo();
    }

    function initHtmlTabs() {
        // jQuery UI initializations
        initSideNav();

        if (!main.tabsInited) {
            main.tabsInited = true;

            initHtmlButtons();

            $('#events_threshold').click(function () {
                main.socket.emit('eventsThreshold', false);
            });
        } else {
            var $menu = $('#admin_sidemenu_menu');
            var panelSelector = $menu.data('problem-link');
            if (panelSelector) {
                var $panel = $(panelSelector);
                // Init source for iframe
                if ($panel.length) {
                    var link = $panel.data('src');
                    if (link && link.indexOf('%') === -1) {
                        var $iframe = $panel.find('iframe');
                        if ($iframe.length && !$iframe.attr('src')) {
                            $iframe.attr('src', link);
                            $menu.data('problem-link', null);
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
        var addTabs = [];

        allTabs = {};
        for (var i = 0; i < main.instances.length; i++) {
            var instance = main.instances[i];
            var instanceObj = main.objects[instance];
            if (!instanceObj.common || !instanceObj.common.adminTab) continue;
            if (instanceObj.common.adminTab.singleton) {
                var isFound = false;
                var inst1 = instance.replace(/\.(\d+)$/, '.');
                for (var j = 0; j < addTabs.length; j++) {
                    var inst2 = addTabs[j].replace(/\.(\d+)$/, '.');
                    if (inst1 === inst2) {
                        isFound = true;
                        break;
                    }
                }
                if (!isFound) addTabs.push(instance);
            } else {
                addTabs.push(instance);
            }
        }

        // Build the standard tabs together
        $('.admin-tab').each(function () {
            var $this = $(this);
            var id = $this.attr('id');
            list.push(id);
            allTabs[id] = $this.data('name');
        });

        // Look for adapter tabs
        for (var a = 0; a < addTabs.length; a++) {
            var tab   = main.objects[addTabs[a]];
            var name  = 'tab-' + tab.common.name;
            var link  = tab.common.adminTab.link || '/adapter/' + tab.common.name + '/tab.html';
            var parts = addTabs[a].split('.');
            var buttonName;

            if (tab.common.adminTab.name) {
                if (typeof tab.common.adminTab.name === 'object') {
                    if (tab.common.adminTab.name[systemLang]) {
                        buttonName = tab.common.adminTab.name[systemLang];
                    } else if (tab.common.adminTab.name.en) {
                        buttonName = _(tab.common.adminTab.name.en);
                    } else {
                        buttonName = _(tab.common.name);
                    }
                } else {
                    buttonName = _(tab.common.adminTab.name);
                }
            } else {
                buttonName = _(tab.common.name);
            }

            // if (main.objects[addTabs[a]].common.adminTab.name) {
            //     if (typeof main.objects[addTabs[a]].common.adminTab.name === 'object') {
            //         if (main.objects[addTabs[a]].common.adminTab.name[systemLang]) {
            //             buttonName = main.objects[addTabs[a]].common.adminTab.name[systemLang];
            //         } else if (main.objects[addTabs[a]].common.adminTab.name.en) {
            //             buttonName = _(main.objects[addTabs[a]].common.adminTab.name.en);
            //         } else {
            //             buttonName = _(main.objects[addTabs[a]].common.name);
            //         }
            //     } else {
            //         buttonName = _(main.objects[addTabs[a]].common.adminTab.name);
            //     }
            // } else {
            //     buttonName = _(main.objects[addTabs[a]].common.name);
            // }

            if (!tab.common.adminTab.singleton) {
                if (link.indexOf('?') !== -1) {
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
            allTabs[name] = buttonName;

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

                text += '<li><a href="#' + name + '">' + buttonName + '</a></li>\n';

                if (!$('#' + name).length) {
                    var div = '<div id="' + name + '" data-name="' + buttonName + '" class="tab-custom ' + (isReplace ? 'link-replace' : '') + '" data-adapter="' + parts[2] + '" data-instance="' + parts[3] + '" data-src="' + link + '">' +
                        '<iframe class="iframe-in-tab" style="border: 0; solid #FFF; display: block; left: 0; top: 0; width: 100%; height: 100%"' +
                        '></iframe></div>';
                    $(div).hide().appendTo($('body'));

                    // TODO: temporary, until other tab will be adapted
                    $('#' + name).find ('.iframe-in-tab').on('load', function () {
                        var elem = $ (this).contents ().find('body>header');
                        if (!elem || !elem.length) elem = $(this).contents ().find('head');
                        if (elem && elem.length) elem.append('<link rel="stylesheet" type="text/css" href="../../lib/css/iob/selectID.css"/>');
                    });
                } else {
                    $('#' + name).hide().appendTo($('body'));
                }
            } else {
                $('#' + name).hide().appendTo($('body'));
            }
        }
        $('.tab-custom').each(function () {
            if (list.indexOf($(this).attr('id')) === -1) {
                $('#' + $(this).attr('id')).remove();
            }
        });

        if (!main.systemConfig.common.tabs) main.systemConfig.common.tabs = list;

        if ($('.link-replace').length) {
            var countLink = 0;

            // If some objects cannot be read => go by timeout
            var loadTimeout = setTimeout(function() {
                loadTimeout = null;
                initHtmlTabs(/*showTabs*/);
            }, 100);

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
                        initHtmlTabs(/*showTabs*/);
                    }
                });
            });
        } else {
            initHtmlTabs();
        }
    }

    main.initHostsList = function (isFirstInit) {
        // fill the host list (select) on adapter tab
        var $selHosts = $('#host-adapters');
        if (isFirstInit && $selHosts.data('inited')) {
            return
        }

        $selHosts.data('inited', true);

        main.currentHost = main.currentHost || main.config.currentHost || '';

        var lines = [];
        for (var i = 0; i < main.tabs.hosts.list.length; i++) {
            lines.push('<li><a href="#!" data-value="' + main.tabs.hosts.list[i].name + '">' + main.tabs.hosts.list[i].name + '</a></li>');
            if (!main.currentHost) {
                main.currentHost = main.tabs.hosts.list[i].name;
            }
        }
        $selHosts.html(lines);

        var $selBtn = $('#host-adapters-btn').show();
        $selBtn
            .text(_('Host:') + ' ' + main.currentHost)
            .dropdown();

        if (main.tabs.hosts.list.length < 2) {
            $selBtn.addClass('disabled');
        } else {
            $selBtn.removeClass('disabled');
        }

        // host selector
        $selHosts.find('a').click(function () {
            var val = $(this).data('value');
            var id  = 'system.host.' + val + '.alive';
            if (!main.states[id] || !main.states[id].val || main.states[id].val === 'null') {
                main.showMessage(_('Host %s is offline', $(this).val()));
                return;
            }

            main.currentHost = val;

            $('#host-adapters-btn').text(_('Host:') + ' ' + main.currentHost);
            main.saveConfig('currentHost', main.currentHost);
        });
    };

    // Use the function for this because it must be done after the language was read
    function initAllDialogs() {
        // todo delete it because jqgrid does not used any more
        if (typeof initGridLanguage === 'function') {
            initGridLanguage(main.systemConfig.common.language);
        }

        $dialogCommand.modal({
            dismissible: false
        });
        $dialogMessage.modal();
        $dialogConfirm.modal({
            dismissible: false
        });

        $dialogCommand.find('.progress-show-more').change(function () {
            var val = $(this).prop('checked');
            main.saveConfig('progressMore', val);
            if (val) {
                $dialogCommand.find('.textarea').show();
            } else {
                $dialogCommand.find('.textarea').hide();
            }
        });
        if (main.config.progressClose === undefined) {
            main.config.progressClose = true;
        }
        $dialogCommand.find('.progress-dont-close input').change(function () {
            main.saveConfig('progressClose', $(this).prop('checked'));
        });
        // workaround for materialize checkbox problem
        $dialogCommand.find('input[type="checkbox"]+span').unbind('click').click(function () {
            var $input = $(this).prev();
            if (!$input.prop('disabled')) {
                $input.prop('checked', !$input.prop('checked')).trigger('change');
            }
        });
        $dialogCommand.find('.progress-dont-close input').prop('checked', main.config.progressClose);
        $dialogCommand.find('.progress-show-more').prop('checked', !!main.config.progressMore).trigger('change');
        $dialogCommand.find('.btn').click(function () {
            if ($dialogCommand.data('finished')) {
                $('#admin_sidemenu_main').find('.button-command').hide();
            } else {
                $('#admin_sidemenu_main').find('.button-command').show();
            }
        });

        $('#admin_sidemenu_main').find('.button-command').click(function () {
            $dialogCommand.modal('open');
        });
    }

    function checkNodeJsVersions(hosts, index) {
        index = index || 0;
        if (hosts && index < hosts.length) {
            main.socket.emit('sendToHost', hosts[index].name, 'getHostInfo', null, function (result) {
                if (result && result['Node.js']) {
                    var major = parseInt(result['Node.js'].split('.').shift().replace('v', ''), 10);
                    if (major !== 4 && major !== 6 && major !== 8) {
                        main.showMessage(_('This version of node.js "%s" on "%s" is deprecated. Please install node.js 6, 8 or newer', result['Node.js'], hosts[index].name), _('Suggestion'), 'error_outline');
                    }
                }
                setTimeout(function () {
                    checkNodeJsVersions(hosts, index + 1);
                }, 100);
            });
        }
    }

    // ----------------------------- Objects show and Edit ------------------------------------------------
    function getObjects(callback) {
        main.socket.emit('getAllObjects', function (err, res) {
            setTimeout(function () {
                var obj;
                main.objects = res;
                for (var id in main.objects) {
                    if (!main.objects.hasOwnProperty(id) || id.slice(0, 7) === '_design') continue;

                    obj = main.objects[id];

                    if (obj.type === 'instance') main.instances.push(id);
                    if (obj.type === 'enum')     tabs.enums.list.push(id);
                    if (obj.type === 'user')     tabs.users.list.push(id);
                    if (obj.type === 'group')    tabs.users.groups.push(id);
                    if (obj.type === 'adapter')  tabs.adapters.list.push(id);
                    if (obj.type === 'host')     tabs.hosts.addHost(obj);

                    // convert obj.history into obj.custom
                    if (obj.common && obj.common.history) {
                        obj.common.custom = JSON.parse(JSON.stringify(obj.common.history));
                        delete obj.common.history;
                    }
                }
                main.objectsLoaded = true;
                main.initHostsList(true);

                initTabs();
                // init dialogs
                for (var dialog in main.dialogs) {
                    if (main.dialogs.hasOwnProperty(dialog) && typeof main.dialogs[dialog].prepare === 'function') {
                        main.dialogs[dialog].prepare();
                    }
                }

                // Detect node.js version
                checkNodeJsVersions(tabs.hosts.list);

                main.getUser();

                if (typeof callback === 'function') callback();
            }, 0);
        });
    }
    // ----------------------------- States show and Edit ------------------------------------------------

    function getStates(callback) {
        if (tabs.states) tabs.states.clear();
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

        if (!id || !id.match(/\.messagebox$/)) {
            if (tabs.states) {
                tabs.states.stateChange(id, state);
            }
            tabs.objects.stateChange(id, state);
            tabs.hosts.stateChange(id, state);

            // Update alive and connected of main.instances
            tabs.instances.stateChange(id, state);
            tabs.adapters.stateChange(id, state);
            main.dialogs.customs.stateChange(id, state);

            if (main.selectId) {
                main.selectId.selectId('state', id, state);
            }
            main.addEventMessage(id, state, false, true);
        } else {
            main.addEventMessage(id, state, true, true);
        }
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
        main.addEventMessage(id, obj, false, false);

        tabs.objects.objectChange(id, obj);

        if (main.selectId) {
            main.selectId.selectId('object', id, obj);
        }

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

        if (id === 'system.adapter.discovery.0') {
            main.updateWizard();
        }

        if (id.match(/^system\.host\.[-\w]+$/)) {
            main.initHostsList();
        }

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

        // Update users
        tabs.users.objectChange(id, obj);

        // update user in side menu
        if (id === main.currentUser) {
            main.getUser();
        }
    }

    function monitor() {
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

    // ---------------------------- Subscribes ---------------------------------------------
    main.resubscribeStates = function () {
        for (var pattern in main.subscribesStates) {
            if (main.subscribesStates.hasOwnProperty(pattern) && main.subscribesStates[pattern]) {
                main.socket.emit('subscribe', pattern);
            }
        }
    };

    main.resubscribeObjects = function () {
        for (var pattern in main.subscribesObjects) {
            if (main.subscribesObjects.hasOwnProperty(pattern) && main.subscribesObjects[pattern]) {
                main.socket.emit('subscribeObjects', pattern);
            }
        }
    };

    main.resubscribeLogs = function () {
        if (main.subscribesLogs) {
            main.socket.emit('requireLog', true);
        }
    };

    main.subscribeStates = function (patterns) {
        if (!patterns) return;
        if (typeof patterns === 'object') {
            for (var s = 0; s < patterns.length; s++) {
                main.subscribesStates[patterns[s]] = main.subscribesStates[patterns[s]] || 0;
                main.subscribesStates[patterns[s]]++;
                if (main.subscribesStates[patterns[s]] === 1) {
                    main.socket.emit('subscribe', patterns[s]);
                }
            }
        } else {
            main.subscribesStates[patterns] = main.subscribesStates[patterns] || 0;
            main.subscribesStates[patterns]++;
            if (main.subscribesStates[patterns] === 1) {
                main.socket.emit('subscribe', patterns);
            }
        }
    };

    main.unsubscribeStates = function (patterns) {
        if (!patterns) return;
        if (typeof patterns === 'object') {
            for (var s = 0; s < patterns.length; s++) {
                if (main.subscribesStates[patterns[s]]) {
                    main.subscribesStates[patterns[s]]--;
                }
                if (main.subscribesStates[patterns[s]] === 0) {
                    main.socket.emit('unsubscribe', patterns[s]);
                    delete main.subscribesStates[patterns[s]];
                }
            }
        } else {
            if (main.subscribesStates[patterns]) {
                main.subscribesStates[patterns]--;
            }
            if (main.subscribesStates[patterns] === 0) {
                main.socket.emit('unsubscribe', patterns);
                delete main.subscribesStates[patterns];
            }
        }
    };

    main.subscribeObjects = function (patterns) {
        if (!patterns) return;
        if (typeof patterns === 'object') {
            for (var s = 0; s < patterns.length; s++) {
                main.subscribesObjects[patterns[s]] = main.subscribesObjects[patterns[s]] || 0;
                main.subscribesObjects[patterns[s]]++;
                if (main.subscribesObjects[patterns[s]] === 1) {
                    main.socket.emit('subscribeObjects', patterns[s]);
                }
            }
        } else {
            main.subscribesObjects[patterns] = main.subscribesObjects[patterns] || 0;
            main.subscribesObjects[patterns]++;
            if (main.subscribesObjects[patterns] === 1) {
                main.socket.emit('subscribeObjects', patterns);
            }
        }
    };

    main.unsubscribeObjects = function (patterns) {
        if (!patterns) return;
        if (typeof patterns === 'object') {
            for (var s = 0; s < patterns.length; s++) {
                if (main.subscribesObjects[patterns[s]]) {
                    main.subscribesObjects[patterns[s]]--;
                }
                if (main.subscribesObjects[patterns[s]] === 0) {
                    main.socket.emit('unsubscribeObjects', patterns[s]);
                    delete main.subscribesObjects[patterns[s]];
                }
            }
        } else {
            if (main.subscribesObjects[patterns]) {
                main.subscribesObjects[patterns]--;
            }
            if (main.subscribesObjects[patterns] === 0) {
                main.socket.emit('unsubscribeObjects', patterns);
                delete main.subscribesObjects[patterns];
            }
        }
    };

    main.subscribeLogs = function (isSubscribe) {
        if (isSubscribe) {
            main.subscribesLogs++;
            if (main.subscribesLogs === 1) {
                main.socket.emit('requireLog', true);
            }
        } else {
            main.subscribesLogs--;
            if (main.subscribesLogs <= 0) {
                main.subscribesLogs = 0;
                main.socket.emit('requireLog', false);
            }
        }

    };

    // ---------------------------- Navigation ---------------------------------------------
    main.navigateCheckDialog = function (callback) {
        if (main.currentDialog && main.dialogs[main.currentDialog] && typeof main.dialogs[main.currentDialog].allStored === 'function') {
            if (main.dialogs[main.currentDialog].allStored() === false) {
                main.confirmMessage(_('Some data are not stored. Discard?'), _('Please confirm'), null, function (result) {
                    callback(!result);
                });
                return;
            }
        }
        callback(false);
    };

    main.navigateGetParams = function () {
        var parts = window.location.hash.split('/');
        return parts[2];
    };

    main.navigate = function (options) {
        if (!options) {
            options = {};
        }
        if (typeof options === 'string') {
            options = {
                tab:    options,
                dialog: '',
                params: ''
            };
        }

        // get actual tab
        if (!options.tab) {
            var parts   = window.location.hash.split('/');
            options.tab = parts[0].replace(/^#/, '').replace(/^tab-/, '');
        }

        window.location.hash = '#tab-' + options.tab + (options.dialog ? '/' + options.dialog + (options.params ? '/' + options.params : '') : '');
    };

    // Router
    main.navigateDo = function () {
        // ignore if hash not changed
        if (window.location.hash === main.currentHash) {
            return;
        }
        // if config dialog opened and has some unsaved data
        main.navigateCheckDialog(function (err) {
            if (!err) {
                main.currentHash = window.location.hash;
                // hash has following structure => #tabName/dialogName/ids
                var parts  = main.currentHash.split('/');
                var tab    = parts[0].replace(/^#/, '').replace(/^tab-/, '');
                var dialog = parts[1];
                var params = parts[2];

                // set default page
                if (!tab) {
                    tab = 'adapters';
                }
                var $adminBody = $('.admin-sidemenu-body');
                var $actualTab = $adminBody.find('.admin-sidemenu-body-content');
                var $panel     = $('#tab-' + tab);
                if (!$panel.length) {
                     tab = 'adapters';
                }

                // if tab was changed
                if (main.currentTab !== tab) {
                    // destroy actual tab
                    if (tabs[main.currentTab] && typeof tabs[main.currentTab].destroy === 'function') {
                        tabs[main.currentTab].destroy();
                    }
                    main.currentTab = tab;

                    $actualTab.hide().appendTo('body');
                    if (!dialog) {
                        $panel.addClass('admin-sidemenu-body-content').show().appendTo($adminBody);
                        $actualTab = $panel;
                    }

                    // init new tab
                    if (tabs[tab] && typeof tabs[tab].init === 'function') {
                        tabs[tab].init();
                    }

                    var link;
                    // if iframe like node-red
                    if ($panel.length && (link = $panel.data('src'))) {
                        if (link.indexOf('%') === -1) {
                            var $iframe = $panel.find('>iframe');
                            if ($iframe.length && !$iframe.attr('src')) {
                                $iframe.attr('src', link);
                            }
                        } else {
                            $('#admin_sidemenu_menu').data('problem-link', 'tab-' + tab);
                        }
                    }

                    // trigger resize
                    /*var func;
                    if ((func = tabs[tab.substr(4)]) && func.resize) {
                        func.onSelected && func.onSelected();

                        setTimeout(function () {
                            var x = $(window).width();
                            var y = $(window).height();
                            if (x < 720) {
                                x = 720;
                            }
                            if (y < 480) {
                                y = 480;
                            }
                            func.resize(x,y);
                        }, 10);
                    }*/
                }

                // select menu element
                var  $tab = $('.admin-sidemenu-items[data-tab="tab-' + tab + '"]');
                $('.admin-sidemenu-items').not($tab).removeClass('admin-sidemenu-active');
                $tab.addClass('admin-sidemenu-active');

                // if some dialog opened or must be shown
                if (main.currentDialog !== dialog) {
                    // destroy it
                    if (main.dialogs[main.currentDialog] && typeof main.dialogs[main.currentDialog].destroy === 'function') {
                        main.dialogs[main.currentDialog].destroy();
                    }
                    main.currentDialog = dialog;
                    if (dialog && main.dialogs[dialog]) {
                        if (typeof main.dialogs[dialog].init === 'function') {
                            main.dialogs[dialog].init(params ? params.split(',') : undefined);
                        }
                        $actualTab.hide().appendTo('body');
                        $('#dialog-' + dialog).addClass('admin-sidemenu-body-content').show().appendTo($adminBody);
                    } else if ($actualTab.attr('id') !== $panel.attr('id')) {
                        $actualTab.hide().appendTo('body');
                        $panel.addClass('admin-sidemenu-body-content').show().appendTo($adminBody);
                    }
                }
            } else {
                // restore hash link
                window.location.hash = main.currentHash || '';
            }
        });
    };

    main.getIconFromObj = function (obj, imgPath, classes) {
        var icon     = '';
        var alt      = '';
        var isCommon = obj && obj.common;

        if (isCommon) {
            if (isCommon.icon) {
                if (!isCommon.icon.match(/^data:image\//)) {
                    if (isCommon.icon.indexOf('.') !== -1) {
                        var instance;
                        if (obj.type === 'instance') {
                            icon = '/adapter/' + obj.common.name + '/' + obj.common.icon;
                        } else if (obj._id.match(/^system\.adapter\./)) {
                            instance = node.key.split('.', 3);
                            if (obj.common.icon[0] === '/') {
                                instance[2] += obj.common.icon;
                            } else {
                                instance[2] += '/' + obj.common.icon;
                            }
                            icon = '/adapter/' + instance[2];
                        } else {
                            instance = obj._id.split('.', 2);
                            if (obj.common.icon[0] === '/') {
                                instance[0] += obj.common.icon;
                            } else {
                                instance[0] += '/' + obj.common.icon;
                            }
                            icon = '/adapter/' + instance[0];
                        }
                    } else {
                        return '<i class="material-icons ' + (classes || 'treetable-icon') + '">' + isCommon.icon + '</i>';
                    }

                } else {
                    icon = isCommon.icon;
                }
                alt = obj.type;
            } else {
                imgPath = imgPath || 'lib/css/fancytree/';
                if (obj.type === 'device') {
                    icon = imgPath + 'device.png';
                    alt  = 'device';
                } else if (obj.type === 'channel') {
                    icon = imgPath + 'channel.png';
                    alt  = 'channel';
                } else if (obj.type === 'state') {
                    icon = imgPath + 'state.png';
                    alt  = 'state';
                }
            }
        }

        if (icon) return '<img class="' + (classes || 'treetable-icon') + '" src="' + icon + '" alt="' + alt + '" />';
        return '';
    };

    // static, just used from many places
    main.getIcon = function(id, imgPath, objects, classes) {
        return main.getIconFromObj((objects || main.objects)[id], imgPath, classes);
    };
    // https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
    main.invertColor = function (hex) {
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            return false;
        }
        var r = parseInt(hex.slice(0, 2), 16),
            g = parseInt(hex.slice(2, 4), 16),
            b = parseInt(hex.slice(4, 6), 16);
        // http://stackoverflow.com/a/3943023/112731
        return (r * 0.299 + g * 0.587 + b * 0.114) <= 186;
    };

    var tabsInfo = {
        'tab-adapters':         {order: 1,   icon: 'store'},
        'tab-instances':        {order: 2,   icon: 'subtitles'},
        'tab-objects':          {order: 3,   icon: 'view_list'},
        'tab-enums':            {order: 4,   icon: 'art_track'},
        'tab-logs':             {order: 5,   icon: 'view_headline'},
        'tab-scenes':           {order: 6,   icon: 'subscriptions'},
        'tab-events':           {order: 7,   icon: 'flash_on'},
        'tab-users':            {order: 9,   icon: 'person_outline'},
        'tab-javascript':       {order: 10,  icon: 'code'},
        'tab-text2command-0':   {order: 11,  icon: 'ac_unit'},
        'tab-text2command-1':   {order: 11,  icon: 'ac_unit'},
        'tab-text2command-2':   {order: 11,  icon: 'ac_unit'},
        'tab-node-red-0':       {order: 20,  icon: 'device_hub'},
        'tab-node-red-1':       {order: 21,  icon: 'device_hub'},
        'tab-node-red-2':       {order: 22,  icon: 'device_hub'},
        'tab-hosts':            {order: 100, icon: 'storage'},
        'tab-fullcalendar-0':   {order: 30, icon: 'perm_contact_calendar'},
        'tab-fullcalendar-1':   {order: 31, icon: 'perm_contact_calendar'},
        'tab-fullcalendar-2':   {order: 32, icon: 'perm_contact_calendar'}
    };

    function initSideNav() {
        var lines = '';

        var elements = [];
        $('.admin-tab').each(function () {
            var id = $(this).attr('id');
            if (!main.systemConfig.common.tabs || main.systemConfig.common.tabs.indexOf(id) !==-1) {
                elements.push({
                    line: '<li class="admin-sidemenu-items" data-tab="' + id + '"><a>' +
                            (tabsInfo[id] && tabsInfo[id].icon ? '<i class="material-icons">' + tabsInfo[id].icon + '</i>' : '<div class="icon-empty">&nbsp;</div>') +
                            _($(this).data('name')) + '</a></li>',
                    id: id
                });
            }
        });
        $('.tab-custom').each(function () {
            var id = $(this).attr('id');
            if (!main.systemConfig.common.tabs || main.systemConfig.common.tabs.indexOf(id) !== -1) {
                var icon;
                if (tabsInfo[id] && tabsInfo[id].icon) {
                    icon = tabsInfo[id].icon;
                } else {
                    var _id = 'system.adapter.' + id.substring(4);
                    if (main.objects[_id] && main.objects[_id].adminTab && main.objects[_id]['fa-icon']) {
                        icon = main.objects[_id]['fa-icon'];
                    }
                }

                elements.push({
                    line: '<li class="admin-sidemenu-items" data-tab="' + id + '"><a>' +
                    (icon ? '<i class="material-icons">' + icon + '</i>' : '<div class="icon-empty">&nbsp;</div>') +
                    $(this).data('name') + '</a></li>',
                    id: id
                });
            }
        });

        elements.sort(function (a, b) {
            if (!tabsInfo[a.id] && !tabsInfo[b.id]) return 0;
            if (!tabsInfo[a.id]) return 1;
            if (!tabsInfo[b.id]) return -1;
            if (tabsInfo[a.id].order < tabsInfo[b.id].order) return -1;
            if (tabsInfo[a.id].order > tabsInfo[b.id].order) return 1;
            return 0;
        });

        for (var e = 0; e < elements.length; e++) {
            lines += elements[e].line;
        }
        $('#admin_sidemenu_menu').find('.admin-sidemenu-menu').html(lines);

        $('.admin-sidemenu-close').unbind('click').click(function () {
            $('#admin_sidemenu_main').toggleClass('admin-sidemenu-closed');
            $('#admin_sidemenu_menu').toggleClass('admin-sidemenu-closed');

            setTimeout(function () {
                resizeGrids();
                $(window).trigger('resize');
            }, 400);
        });

        $('.admin-sidemenu-items').unbind('click').click(function () {
            window.location.hash = '#' + $(this).data('tab');
        });

        // Show if update available
        tabs.hosts.updateCounter();
        tabs.adapters.updateCounter();
    }

    // ---------------------------- Socket.io methods ---------------------------------------------
    main.socket.on('log',               function (message) {
        tabs.logs.add(message);
    });
    main.socket.on('error',             function (error) {
        console.log(error);
    });
    main.socket.on('permissionError',   function (err) {
        main.showMessage(_('Has no permission to %s %s %s', err.operation, err.type, (err.id || '')));
    });
    main.socket.on('stateChange',       function (id, obj) {
        setTimeout(stateChange, 0, id, obj);
    });
    main.socket.on('objectChange',      function (id, obj) {
        setTimeout(objectChange, 0, id, obj);
    });
    main.socket.on('cmdStdout',         function (_id, text) {
        if (activeCmdId === _id) {
            var m = text.match(/^upload \[(\d+)]/);
            if (m) {
                if ($dialogCommand.data('max') === null) {
                    $dialogCommand.data('max', parseInt(m[1], 10));
                    $dialogCommandProgress.removeClass('indeterminate').addClass('determinate');
                }
                var max = $dialogCommand.data('max');
                var value = parseInt(m[1], 10);
                $dialogCommandProgress.css('width', (100 - Math.round((value / max) * 100)) + '%');
            } else {
                m = text.match(/^got [-_:\/\\.\w\d]+\/admin$/);
                if (m) {
                    // upload of admin
                    $dialogCommand.find('.progress-text').html(_('Upload admin started'));
                    $dialogCommand.data('max', null);
                } else {
                    // got ..../www
                    m = text.match(/^got [-_:\/\\.\w\d]+\/www$/);
                    if (m) {
                        // upload of www
                        $dialogCommand.find('.progress-text').html(_('Upload www started'));
                        $dialogCommand.data('max', null);
                    } else {

                    }
                }
            }

            stdout += '\n' + text;
            $stdout.val(stdout);
            $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
        }
    });
    main.socket.on('cmdStderr',         function (_id, text) {
        if (activeCmdId === _id) {
            if (!$dialogCommand.data('error')) {
                $dialogCommand.data('error', text);
            }
            stdout += '\nERROR: ' + text;
            $stdout.val(stdout);
            $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
        }
    });
    main.socket.on('cmdExit',           function (_id, exitCode) {
        if (activeCmdId === _id) {

            exitCode = parseInt(exitCode, 10);
            stdout += '\n' + (exitCode !== 0 ? 'ERROR: ' : '') + 'process exited with code ' + exitCode;
            $stdout.val(stdout);
            $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());

            $dialogCommand.find('.progress-dont-close').addClass('disabled');
            $dialogCommandProgress.removeClass('indeterminate').css({'width': '100%'});
            $dialogCommand.find('.btn').html(_('Close'));
            $dialogCommand.data('finished', true);
            $dialogCommand.data('max', true);
            var $backButton = $('#admin_sidemenu_main').find('.button-command');
            $backButton.removeClass('in-progress');

            if (!exitCode) {
                $dialogCommand.find('.progress-text').html(_('Success!'));
                $backButton.hide();
                if ($dialogCommand.find('.progress-dont-close input').prop('checked')) {
                    setTimeout(function () {
                        $dialogCommand.modal('close');
                    }, 1500);
                }
            } else {
                var error = $dialogCommand.data('error');
                if (error) {
                    var m = error.match(/error: (.*)$/);
                    if (m) {
                        error = m[1];
                    }

                    $dialogCommand.find('.progress-text').html(_('Done with error: %s', _(error))).addClass('error');
                } else {
                    $dialogCommand.find('.progress-text').html(_('Done with error')).addClass('error');
                }
                $backButton.addClass('error');
                $backButton.show();
            }
            if (cmdCallback) {
                cmdCallback(exitCode);
                cmdCallback = null;
            }
        }
    });
    main.socket.on('eventsThreshold',   function (isActive) {
        if (isActive) {
            $('#events_threshold').show();
        } else {
            $('#events_threshold').hide();
        }
    });
    main.socket.on('connect',           function () {
        $('#connecting').hide();
        if (firstConnect) {
            firstConnect = false;

            main.getUser();

            main.socket.emit('getUserPermissions', function (err, acl) {
                main.acl = acl;
                // Read system configuration
                main.socket.emit('getObject', 'system.config', function (errConfig, data) {
                    main.systemConfig = data;

                    // rename log => logs (back compatibility)
                    if (main.systemConfig && main.systemConfig.common && main.systemConfig.common.tabs) {
                        var pos = main.systemConfig.common.tabs.indexOf('tab-log');
                        if (pos !== -1) {
                            main.systemConfig.common.tabs[pos] = 'tab-logs';
                        }
                    }

                    main.socket.emit('getObject', 'system.repositories', function (errRepo, repo) {
                        main.dialogs.system.systemRepos = repo;
                        main.socket.emit('getObject', 'system.certificates', function (errCerts, certs) {
                            setTimeout(function () {
                                main.dialogs.system.systemCerts = certs;
                                if (errConfig === 'permissionError') {
                                    main.systemConfig = {common: {language: systemLang}, error: 'permissionError'};
                                } else {
                                    if (!errConfig && main.systemConfig && main.systemConfig.common) {
                                        systemLang = main.systemConfig.common.language || systemLang;
                                        main.systemConfig.common.city      = main.systemConfig.common.city      || '';
                                        main.systemConfig.common.country   = main.systemConfig.common.country   || '';
                                        main.systemConfig.common.longitude = main.systemConfig.common.longitude || '';
                                        main.systemConfig.common.latitude  = main.systemConfig.common.latitude  || '';

                                        if (!main.systemConfig.common.licenseConfirmed) {
                                            // Show license agreement
                                            var language = main.systemConfig.common.language || window.navigator.userLanguage || window.navigator.language;
                                            if (language !=='en' && language !=='de' && language !=='ru') language = 'en';

                                            $('#license_text').html(license[language] || license.en);

                                            $('#license_checkbox')
                                                .show()
                                                .prop('checked', false);

                                            // on language change
                                            $('#license_language')
                                                .data('licenseConfirmed', false)
                                                .val(language)
                                                .show()
                                                .change(function () {
                                                    language = $(this).val();
                                                    $('#license_language_label').html(translateWord('Select language', language));
                                                    $('#license_text').html(license[language] || license.en);
                                                    $('#license_checkbox').html(translateWord('license_checkbox', language));
                                                    $('#license_agree').html(translateWord('agree', language));
                                                    $('#license_non_agree').html(translateWord('not agree', language));
                                                    $('#license_terms').html(translateWord('License terms', language));
                                                    $('#license_agreement_label').html(translateWord('license agreement', language));
                                                });

                                            $('#license_diag').change(function () {
                                                if ($(this).prop('checked')) {
                                                    $('#license_agree').removeClass('disabled');
                                                } else {
                                                    $('#license_agree').addClass('disabled');
                                                }
                                            });

                                            // workaround for materialize checkbox problem
                                            $dialogLicense.find('input[type="checkbox"]+span').unbind('click').click(function () {
                                                var $input = $(this).prev();
                                                if (!$input.prop('disabled')) {
                                                    $input.prop('checked', !$input.prop('checked')).trigger('change');
                                                }
                                            });

                                            $dialogLicense.modal({
                                                dismissible: false,
                                                complete: function () {
                                                    $('#license_text').html('');
                                                    location.reload();
                                                }
                                            }).modal('open');

                                            $('#license_agree').addClass('disabled').unbind('click').click(function (e) {
                                                e.preventDefault();
                                                e.stopPropagation();

                                                main.socket.emit('getObject', 'system.config', function (err, obj) {
                                                    if (err || !obj) {
                                                        main.showError(_('Cannot confirm: ' + err));
                                                        return;
                                                    }
                                                    obj.common = obj.common || {};
                                                    obj.common.licenseConfirmed = true;
                                                    obj.common.language = language;
                                                    main.socket.emit('setObject', 'system.config', obj, function (err) {
                                                        if (err) {
                                                            main.showError(err);
                                                        }
                                                        $dialogLicense.modal('close');
                                                        $('#license_agree').unbind('click');
                                                        $('#license_non_agree').unbind('click');
                                                    });
                                                });
                                            });
                                        }
                                    } else {
                                        main.systemConfig = {
                                            type: 'config',
                                            common: {
                                                name:             'system.config',
                                                city:             '',           // City for weather
                                                country:          '',           // Country for weather
                                                longitude:        '',           // longitude for javascript
                                                latitude:         '',           // longitude for javascript
                                                language:         '',           // Default language for adapters. Adapters can use different values.
                                                tempUnit:         '°C',         // Default temperature units.
                                                currency:         '',           // Default currency sign.
                                                dateFormat:       'DD.MM.YYYY', // Default date format.
                                                isFloatComma:     true,         // Default float divider ('.' - false, ',' - true)
                                                licenseConfirmed: false,        // If license agreement confirmed,
                                                defaultHistory:   '',           // Default history instance
                                                tabs: [                         // Show by default only these tabs
                                                    'tab-adapters',
                                                    'tab-instances',
                                                    'tab-objects',
                                                    'tab-logs',
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

                                translateCron();
                                translateAll();

                                // Here we go!
                                initAllDialogs();
                                tabs.hosts.prepare();
                                tabs.objects.prepare();
                                // if (tabs.states) tabs.states.prepare();
                                tabs.adapters.prepare();
                                tabs.instances.prepare();
                                tabs.users.prepare();
                                //tabs.groups.prepare();
                                tabs.enums.prepare();
                                tabs.events.prepare();
                                tabs.logs.prepare();
                                // TABS
                                // resizeGrids();

                                getStates(getObjects);
                            }, 0);
                        });
                    });
                });
            });
        } else {
            main.resubscribeStates();
            main.resubscribeObjects();
            main.resubscribeLogs();
        }
        if (main.waitForRestart) {
            location.reload();
        }
    });
    main.socket.on('disconnect',        function () {
        $('#connecting').show();
    });
    main.socket.on('reconnect',         function () {
        $('#connecting').hide();
        if (main.waitForRestart) {
            location.reload();
        }
    });
    main.socket.on('repoUpdated',       function () {
        setTimeout(function () {
            tabs.adapters.init(true);
        }, 0);
    });
    main.socket.on('reauthenticate',    function () {
        location.reload();
    });

    /*function resizeGrids() {
        var x = $(window).width();
        var y = $(window).height();
        if (x < 720) {
            x = 720;
        }
        if (y < 480) {
            y = 480;
        }
        for (var tab in tabs.events) {
            if (tabs.events.hasOwnProperty(tab) && tabs[tab] && tabs[tab].resize) {
                tabs[tab].resize(x, y);
            }
        }
    }

    $(window).resize(resizeGrids);
    */
});
})(jQuery);

