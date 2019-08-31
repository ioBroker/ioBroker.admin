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
/* global initGridLanguage, M, storage, decodeURI, States */
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
// for IE
if (!console.debug) {
    console.debug = console.log;
}
if (typeof Number === 'undefined') {
    console.log('define Number');
    Number = function (obj) {
        return parseFloat(obj);
    };
}
if (!Object.assign) {
    Object.assign = $.extend;
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array [index], index, array);
    }
}

var $iframeDialog = null; // used in adapter settings window
var configNotSaved = null; // used in adapter settings window
var showConfig = null; // used in adapter settings window
var defaults = {};
var customPostInits = {};
var customPostOnSave = {};
var FORBIDDEN_CHARS = /[\]\[*,;'"`<>\\\s?]/g;

// used in adapter settings window
var adapterRedirect = function (redirect, timeout) {
    if (redirect) {
        setTimeout(function () {
            redirect += document.location.pathname;
            redirect += document.location.hash;
            document.location.href = redirect;
        }, timeout || 5000);
    }
};
var gMain = null; // for google maps

function detectIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
}

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
        //ignoreJSupdate: false, // set to true after some global script updated and till system.adapter.javascript.x updated
        addEventMessage: function (id, stateOrObj, isMessage, isState) {
            // cannot directly use tabs.events.add, because to init time not available.
            tabs.events.add(id, stateOrObj, isMessage, isState);
        },
        saveConfig:     function (attr, value) {
            if (attr) main.config[attr] = value;

            if (typeof storage !== 'undefined') {
                storage.set('adminConfig', JSON.stringify(main.config));
            }
        },
        saveTabs:       function () {
            this.socket.emit ('setObject', 'system.config', this.systemConfig, function (err) {
                err && this.showError(err);
            });
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
            $adminSideMain.find('.button-command').removeClass('error').addClass('in-progress');
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
                $dialogConfirm.find('.modal-footer .modal-action').on('click', function () {
                    var cb = $dialogConfirm.data('callback');
                    cb && cb($(this).data('result'));
                });
            } else if (typeof buttons === 'object') {
                var tButtons = '';
                for (var b = buttons.length - 1; b >= 0; b--) {
                    tButtons += '<a class="modal-action modal-close waves-effect waves-green btn-flat translate" data-id="' + b + '">' + buttons[b] + '</a>';
                }
                $dialogConfirm.find('.modal-footer').html(tButtons);
                $dialogConfirm.find('.modal-footer .modal-action').on('click', function () {
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
                    })*/.on('click', function () {
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
                    name = translateName(obj.common.name);
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
                        groups.push(_(translateName(group.common.name)));
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

    gMain = main; // for google maps

    var tabs = {
        hosts:      new Hosts(main), // must be first to read the list of hosts
        objects:    new Objects(main),
        adapters:   new Adapters(main),
        instances:  new Instances(main),
        users:      new Users(main),
        enums:      new Enums(main),
        events:     new Events(main),
        logs:       new Logs(main),
        states:     null,
        intro:      new Intro(main),
        info:       new InfoAdapter(main)
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
    var $dialogLicense = $('#dialog-license-main');
    var $dialogMessage = $('#dialog-message');
    var $dialogConfirm = $('#dialog-confirm');
    var $dialogCommandProgress = $dialogCommand.find('.progress div');

    var $adminSideMenu = $('#admin_sidemenu_menu');
    var $adminSideMain = $('#admin_sidemenu_main');

    var firstConnect   = true;

    // detect touch devices
    if (!('ontouchstart' in window || navigator.maxTouchPoints)) {
        $('body').addClass('desktop-screen');
    }
    if (navigator.userAgent.indexOf('Safari') !== -1 &&
        navigator.userAgent.indexOf('Chrome') === -1 &&
        navigator.userAgent.indexOf('Android') === -1) {
        $('body').addClass('safari');
        main.browser = 'safari';
        main.noSelect = true;
    } else if (detectIE()) {
        $('body').addClass('ie');
        // workaround
        main.browser = 'ie';
        main.browserVersion = detectIE();
        main.noSelect = true;
        $('#host-adapters-btn').css('margin-top', '10px');
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

    function globalClickHandler(event){
        $('#admin_sidemenu_dialog').html('');
        $('html').off('click', globalClickHandler);
    }

    function initHtmlButtons() {
        main.socket.emit('getVersion', function (err, version) {
			var $versionBtn = $('.button-version');
	        if (!$versionBtn.hasClass('vendor')) {
	            $versionBtn.text('ioBroker.admin ' + version);
	        }
        });

        $('.choose-tabs-config-button').off('click').on('click', function(event) {
            var $dialog = $('#admin_sidemenu_dialog');
            var html = $dialog.html();
            if (html) {
                $dialog.html('');
                // disable global handler
                $('html').off('click', globalClickHandler);
                return;
            }
            setTimeout(function () {
                // enable global handler
                $('html').on('click', globalClickHandler);
            }, 100);
            var $e = $(event.target);
            var offs = $e.offset();
            offs.top += $e.height() - 2;

            var text =
                '<dialog open class="tab-selector m" style="top: ' + offs.top + 'px; left: ' + offs.left + 'px;">' + // style="overflow: visible; z-index: 999; ">'
                '<div>' +
                '<ul style="">';

            var $lis = $adminSideMenu;
            for (var tid in allTabs) {
                var name = allTabs[tid];
                var found = $adminSideMenu.find('.admin-sidemenu-items[data-tab="' + tid + '"]').length;
                // TABS
                /*$adminSideMenu.each(function (i, e) {
                    if (tid === $(e).attr('aria-controls')) {
                        found = $(e);
                        return false;
                    }
                });*/
                var id = 'chk-' + tid;
                text +=
                    '<li><input ' + (found ? 'checked' : 'unchecked') + ' class="chk-tab filled-in" type="checkbox" id="' + id + '" />' +
                    '<span for="' + id + '">' + _(name) + '</span></id>';
            }
            text += '' +
                '</ul>' +
                '</div>' +
                '</dialog>';
            $dialog.append(text);

            $dialog.find('.chk-tab').off('change').on('change', function (event) {
                var id = $(this).attr('id').substr(4);
                if ($(this).prop('checked')) {
                    main.systemConfig.common.tabs.push(id);
                } else {
                    var pos = main.systemConfig.common.tabs.indexOf(id);
                    if (id !== -1) {
                        main.systemConfig.common.tabs.splice(pos, 1);
                    }
                }
                main.saveTabs();
                initTabs();
            });
            // workaround for materialize checkbox problem
            $dialog.find('input[type="checkbox"]+span').off('click').on('click', function () {
                var $input = $(this).prev();
                if (!$input.prop('disabled')) {
                    $input.prop('checked', !$input.prop('checked')).trigger('change');
                }
            });
        });

        main.updateWizard();
        
        $('#button-logout').on('click', function () {
            window.location.href = '/logout/';
        });
        
        setTimeout(function () {
            main.tabs.info.init();
        }, 5000);

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

            $('#events_threshold').on('click', function () {
                main.socket.emit('eventsThreshold', false);
            });
        } else {
            var $menu = $adminSideMenu;
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
            // show current tab
            main.currentHash = null;
            main.navigateDo();
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
            if (tab.common.materializeTab) {
                link  = tab.common.adminTab.link || '/adapter/' + tab.common.name + '/tab_m.html';
            }

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
                    if (tab.common.materilizeTab) {
                        link = '/adapter/' + parts[2] + '/tab_m.html';
                    }
                } else {
                    isReplace = link.indexOf('%') !== -1;
                }

                text += '<li><a href="#' + name + '">' + buttonName + '</a></li>\n';

                // noinspection JSJQueryEfficiency
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
                            initHtmlTabs(/*showTabs*/);
                        }
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
            return;
        }

        $selHosts.data('inited', true);

        main.currentHost = main.currentHost || main.config.currentHost || '';

        var lines = [];
        var color;
        var curId;
        for (var i = 0; i < main.tabs.hosts.list.length; i++) {
            lines.push('<li><a data-value="' + main.tabs.hosts.list[i].name + '">' + main.getHostIcon(main.objects[main.tabs.hosts.list[i].id], 'imgHost left') + main.tabs.hosts.list[i].name + '</a></li>');
            if (!main.currentHost) {
                main.currentHost = main.tabs.hosts.list[i].name;
            }
            if (main.currentHost === main.tabs.hosts.list[i].name) {
                curId = main.tabs.hosts.list[i].id;
            }
        }
        $selHosts.html(lines);

        var $selBtn = $('#host-adapters-btn').show();
        $selBtn
            .text(_('Host:') + ' ' + main.currentHost)
            .dropdown();

        if (main.objects[curId] && main.objects[curId].common) {
            color = main.objects[curId].common.color;
        }

        $selBtn.append($(main.getHostIcon(main.objects[curId], 'imgHost left')));
        if (color) {
            // set color of button
        }

        if (main.tabs.hosts.list.length < 2) {
            $selBtn.addClass('disabled');
        } else {
            $selBtn.removeClass('disabled');
        }

        // host selector
        $selHosts.find('a').on('click', function () {
            var val = $(this).data('value');
            var id  = 'system.host.' + val + '.alive';
            if (!main.states[id] || !main.states[id].val || main.states[id].val === 'null') {
                main.showMessage(_('Host %s is offline', $(this).val()));
                return;
            }

            main.currentHost = val;

            $('#host-adapters-btn')
                .text(_('Host:') + ' ' + main.currentHost)
                .append($(this).find('.imgHost').clone());
            // destroy current view and load anew
            console.log(main.currentTab);
            if (tabsInfo['tab-' + main.currentTab] && tabsInfo['tab-' + main.currentTab].host) {
                // destroy actual tab
                if (main.tabs[main.currentTab] && typeof main.tabs[main.currentTab].destroy === 'function') {
                    main.tabs[main.currentTab].destroy();
                }

                // init new tab
                if (main.tabs[main.currentTab] && typeof main.tabs[main.currentTab].init === 'function') {
                    main.tabs[main.currentTab].init();
                }
            }

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

        $dialogCommand.find('.progress-show-more').off('change').on('change', function () {
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
        $dialogCommand.find('.progress-dont-close input').on('change', function () {
            main.saveConfig('progressClose', $(this).prop('checked'));
        });
        // workaround for materialize checkbox problem
        $dialogCommand.find('input[type="checkbox"]+span').off('click').on('click', function () {
            var $input = $(this).prev();
            // ignore switch
            if ($input.parent().parent().hasClass('switch')) return;

            if (!$input.prop('disabled')) {
                $input.prop('checked', !$input.prop('checked')).trigger('change');
            }
        });
        $dialogCommand.find('.progress-dont-close input').prop('checked', main.config.progressClose);
        $dialogCommand.find('.progress-show-more').prop('checked', !!main.config.progressMore).trigger('change');
        $dialogCommand.find('.btn').on('click', function () {
            if ($dialogCommand.data('finished')) {
                $adminSideMain.find('.button-command').hide();
            } else {
                $adminSideMain.find('.button-command').show();
            }
        });

        $adminSideMain.find('.button-command').on('click', function () {
            $dialogCommand.modal('open');
        });
    }

    function checkNodeJsVersions(hosts, index) {
        index = index || 0;
        if (hosts && index < hosts.length) {
            main.socket.emit('sendToHost', hosts[index].name, 'getHostInfo', null, function (result) {
                if (result && result['Node.js']) {
                    var major = parseInt(result['Node.js'].split('.').shift().replace('v', ''), 10);
                    if (major < 6 || major === 7 || major === 9  || major === 11 ) { // we allow 6, 8, 10 and 12+
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
            if (err) {
                // following errors are possible
                // permissionError
                // Admin is not enabled in cloud settings!
                window.alert(_(err));
                return;
            }

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
        id = id ? id.replace(/\s/g, '_') : '';

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
        var oldObj = null;
        var action = 'update';

        oldObj = main.objects[id];

        // update main.objects cache
        if (obj) {
            if (obj._rev && main.objects[id]) main.objects[id]._rev = obj._rev;
            if (!main.objects[id]) {
                action = 'add';
            }
            if (action === 'add' || JSON.stringify(main.objects[id]) !== JSON.stringify(obj)) {
                main.objects[id] = obj;
            }
        } else if (main.objects[id]) {
            action = 'delete';
            delete main.objects[id];
        }

        // update to event table
        main.addEventMessage(id, obj, false, false);

        tabs.objects.objectChange(id, obj, action);

        main.selectId && main.selectId.selectId('object', id, obj, action);

        tabs.enums.objectChange(id, obj, action);
        tabs.intro.objectChange(id, obj, action);

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

        tabs.instances.objectChange(id, obj, action);

        //if (id.match(/^script\.js\.global\..*/)) {
        //    main.ignoreJSupdate = true;
        //}

        if (obj && id.match(/^system\.adapter\.[\w-]+\.[0-9]+$/)) {
            if (obj.common &&
                obj.common.adminTab &&
                !obj.common.adminTab.ignoreConfigUpdate
            ) {
                // Detect enable/disable change and do not update tabs (To able to work with global scripts normally)
                var ignore = false;
                // try to detect if javascript just enabled or disabled
                if (oldObj && obj) {
                    if (oldObj.common && obj.common) {
                        var newObj = JSON.parse(JSON.stringify(obj));
                        newObj.common.enabled = oldObj.common.enabled;
                        newObj.ts = 0;
                        oldObj.ts = 0;
                        console.log(JSON.stringify(newObj));
                        console.log(JSON.stringify(oldObj));
                        if (JSON.stringify(newObj) === JSON.stringify(oldObj)) {
                            ignore = true;
                        }
                    }
                }
                !ignore && initTabs();
                /*} else {
                    main.ignoreJSupdate = false;
                }*/
            }

            if (obj && obj.type === 'instance' && obj.common.supportCustoms) {
                // Update all states if customs enabled or disabled
                tabs.objects.reinit();
            }
        }

        tabs.hosts.objectChange(id, obj, action);

        // Update users
        tabs.users.objectChange(id, obj, action);

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
                console.debug('Re-Subscribe: ' + pattern);
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
            console.debug('Subscribe LOG');
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
                    console.debug('Subscribe: ' + patterns[s]);
                    main.socket.emit('subscribe', patterns[s]);
                }
            }
        } else {
            main.subscribesStates[patterns] = main.subscribesStates[patterns] || 0;
            main.subscribesStates[patterns]++;
            if (main.subscribesStates[patterns] === 1) {
                console.debug('Subscribe: ' + patterns);
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
                    console.debug('Unsibscribe: ' + patterns[s]);
                    main.socket.emit('unsubscribe', patterns[s]);
                    delete main.subscribesStates[patterns[s]];
                }
            }
        } else {
            if (main.subscribesStates[patterns]) {
                main.subscribesStates[patterns]--;
            }
            if (main.subscribesStates[patterns] === 0) {
                console.debug('Unsibscribe: ' + patterns);
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
                console.debug('Subscribe Logs');
                main.socket.emit('requireLog', true);
            }
        } else {
            main.subscribesLogs--;
            if (main.subscribesLogs <= 0) {
                main.subscribesLogs = 0;
                console.debug('Unsubscribe Logs');
                main.socket.emit('requireLog', false);
            }
        }
    };

    // ---------------------------- Navigation ---------------------------------------------
    main.navigateCheckDialog = function (callback) {
        if (main.currentDialog && main.dialogs[main.currentDialog] && typeof main.dialogs[main.currentDialog].allStored === 'function') {
            if (main.dialogs[main.currentDialog].allStored() === false) {
                return main.confirmMessage(_('Some data are not stored. Discard?'), _('Please confirm'), null, function (result) {
                    callback(!result);
                });
            }
        } else {
            if (configNotSaved) {
                return main.confirmMessage(_('Some data are not stored. Discard?'), _('Please confirm'), null, function (result) {
                    callback(!result);
                });
            }
        }
        callback(false);
    };

    main.navigateGetParams = function () {
        var parts = decodeURI(window.location.hash).split('/');
        return parts[2] ? decodeURIComponent(parts[2]) : null;
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
            var parts   = decodeURI(window.location.hash).split('/');
            options.tab = parts[0].replace(/^#/, '').replace(/^tab-/, '');
        }

        window.location.hash = '#tab-' + encodeURIComponent(options.tab) + (options.dialog ? '/' + options.dialog + (options.params ? '/' + encodeURIComponent(options.params) : '') : '');
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
                configNotSaved = null;
                main.currentHash = window.location.hash;
                // hash has following structure => #tabName/dialogName/ids
                var parts  = main.currentHash.split('/');
                var tab    = parts[0].replace(/^#/, '').replace(/^tab-/, '');
                var dialog = parts[1];
                var params = decodeURIComponent(parts[2]);

                // set default page
                if (!tab || tab === '!') {
                    if (!main.systemConfig.common.tabs || main.systemConfig.common.tabs.indexOf('tab-intro') !== -1) {
                        tab = 'intro';
                    } else if (main.systemConfig.common.tabs.indexOf('tab-adapters') !== -1) {
                        tab = 'adapters';
                    } else {
                        tab = main.systemConfig.common.tabs[0].replace(/^#/, '').replace(/^tab-/, '');
                    }
                }
                // do tab is not found

                var $adminBody = $('.admin-sidemenu-body');
                var $actualTab = $adminBody.find('.admin-sidemenu-body-content');
                var $panel     = $('#tab-' + tab);

                $adminBody.find('.admin-preloader').remove();

                if (!$panel.length) {
                    tab = 'intro';
                }

                // if tab was changed
                if (main.currentTab !== tab || !$actualTab.length) {
                    var link;
                    // destroy actual tab
                    if (main.currentTab && tabs[main.currentTab] && typeof tabs[main.currentTab].destroy === 'function') {
                        tabs[main.currentTab].destroy();
                    } else if (main.currentTab) {
                        var $oldPanel = $('#tab-' + main.currentTab);
                        // destroy current iframe
                        if ($oldPanel.length && (link = $oldPanel.data('src'))) {
                            var $iframe_ = $oldPanel.find('>iframe');
                            if ($iframe_.attr('src')) {
                                console.log('clear');
                                $iframe_.attr('src', '');
                            }
                        }
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

                    // if iframe like node-red
                    if ($panel.length && (link = $panel.data('src'))) {
                        if (link.indexOf('%') === -1) {
                            var $iframe = $panel.find('>iframe');
                            if ($iframe.length && !$iframe.attr('src')) {
                                $iframe.attr('src', link);
                            }
                        } else {
                            $adminSideMenu.data('problem-link', 'tab-' + tab);
                        }
                    }
                }

                // select menu element
                var  $tab = $adminSideMenu.find('.admin-sidemenu-items[data-tab="tab-' + tab + '"]');
                $adminSideMenu.find('.admin-sidemenu-items').not($tab).removeClass('admin-sidemenu-active');
                $tab.addClass('admin-sidemenu-active');

                if (tabsInfo['tab-' + tab] && tabsInfo['tab-' + tab].host) {
                    $('#host-adapters-btn').css('opacity', 1);
                } else {
                    $('#host-adapters-btn').css('opacity', 0.3);
                }
                document.title = tab + ' - ioBroker';
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
                        tabs[main.currentTab] && tabs[main.currentTab].saveScroll && tabs[main.currentTab].saveScroll();
                        $actualTab.hide().appendTo('body');
                        $('#dialog-' + dialog).addClass('admin-sidemenu-body-content').show().appendTo($adminBody);
                    } else if ($actualTab.attr('id') !== $panel.attr('id')) {
                        $actualTab.hide().appendTo('body');
                        $panel.addClass('admin-sidemenu-body-content').show().appendTo($adminBody);
                        tabs[main.currentTab] && tabs[main.currentTab].restoreScroll && tabs[main.currentTab].restoreScroll();
                    }
                }
            } else {
                // restore hash link
                window.location.hash = main.currentHash || '';
            }
        });
    };

    function getIconHtml(obj, classes) {
        var icon;
        var alt;
        var isCommon = obj && obj.common;

        if (isCommon.icon) {
            if (!isCommon.icon.match(/^data:image\//)) {
                if (isCommon.icon.indexOf('.') !== -1) {
                    var instance;
                    if (obj.type === 'instance') {
                        icon = '/adapter/' + obj.common.name + '/' + obj.common.icon;
                    } else if (obj._id.match(/^system\.adapter\./)) {
                        instance = obj._id.split('.', 3);
                        if (isCommon.icon[0] === '/') {
                            instance[2] += isCommon.icon;
                        } else {
                            instance[2] += '/' + isCommon.icon;
                        }
                        icon = '/adapter/' + instance[2];
                    } else {
                        instance = obj._id.split('.', 2);
                        if (isCommon.icon[0] === '/') {
                            instance[0] += isCommon.icon;
                        } else {
                            instance[0] += '/' + isCommon.icon;
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
        }
        return {icon: icon, alt: alt};
    }

    main.getIconFromObj = function (obj, imgPath, classes) {
        var icon     = '';
        var alt      = '';
        if (obj && obj.common) {
            if (obj.common.icon) {
                var result = getIconHtml(obj);
                icon = result.icon;
                alt = result.alt;
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

        if (icon) return '<img class="' + (classes || 'treetable-icon') + '" src="' + icon + '" alt="' + (alt || '') + '" />';
        return '';
    };

    // static, just used from many places
    main.getIcon = function(id, imgPath, objects, classes) {
        return main.getIconFromObj((objects || main.objects)[id], imgPath, classes);
    };

    main.getHostIcon = function (obj, classes) {
        var icon     = '';
        var alt      = '';

        if (obj && obj.common && obj.common.icon) {
            var result = getIconHtml(obj);
            icon = result.icon;
            alt = result.alt;
        }
        icon = icon || 'img/no-image.png';
        alt  = alt  || '';

        return '<img class="' + (classes || 'treetable-icon') + '" src="' + icon + '" alt="' + alt + '" />';
    };

    main.formatBytes = function (bytes) {
        if (Math.abs(bytes) < 1024) {
            return bytes + ' B';
        }
        var units = ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
        var u = -1;
        do {
            bytes /= 1024;
            ++u;
        } while (Math.abs(bytes) >= 1024 && u < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[u];
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
        'tab-intro':            {order: 1,    icon: 'apps'},
        'tab-info':             {order: 5,    icon: 'info',              host: true},
        'tab-adapters':         {order: 10,   icon: 'store',             host: true},
        'tab-instances':        {order: 15,   icon: 'subtitles',         host: true},
        'tab-objects':          {order: 20,   icon: 'view_list'},
        'tab-enums':            {order: 25,   icon: 'art_track'},
        'tab-devices':          {order: 27,   icon: 'dvr',               host: true},
        'tab-logs':             {order: 30,   icon: 'view_headline',     host: true},
        'tab-scenes':           {order: 35,   icon: 'subscriptions'},
        'tab-events':           {order: 40,   icon: 'flash_on'},
        'tab-users':            {order: 45,   icon: 'person_outline'},
        'tab-javascript':       {order: 50,   icon: 'code'},
        'tab-text2command-0':   {order: 55,   icon: 'ac_unit'},
        'tab-text2command-1':   {order: 56,   icon: 'ac_unit'},
        'tab-text2command-2':   {order: 57,   icon: 'ac_unit'},
        'tab-node-red-0':       {order: 60,   icon: 'device_hub'},
        'tab-node-red-1':       {order: 61,   icon: 'device_hub'},
        'tab-node-red-2':       {order: 62,   icon: 'device_hub'},        
        'tab-fullcalendar-0':   {order: 65,   icon: 'perm_contact_calendar'},
        'tab-fullcalendar-1':   {order: 66,   icon: 'perm_contact_calendar'},
        'tab-fullcalendar-2':   {order: 67,   icon: 'perm_contact_calendar'},
        'tab-hosts':            {order: 100,  icon: 'storage'},
    };

    function initSideNav() {
        var lines = '';

        var elements = [];
        $('.admin-tab').each(function () {
            var id = $(this).attr('id');
            if (!main.systemConfig.common.tabs || main.systemConfig.common.tabs.indexOf(id) !== -1) {
                elements.push({
                    line: '<li class="admin-sidemenu-items" data-tab="' + id + '"><a href="#' + id + '">' +
                            (tabsInfo[id] && tabsInfo[id].icon ? '<i class="material-icons left">' + tabsInfo[id].icon + '</i>' : '<i class="material-icons left">live_help</i>') +
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
		    if (main.objects[_id] && main.objects[_id].common.adminTab && main.objects[_id].common.adminTab['fa-icon']) {
                        icon = main.objects[_id].common.adminTab['fa-icon'];
                    }
                }

                elements.push({
                    line: '<li class="admin-sidemenu-items" data-tab="' + id + '"><a href="#' + id + '">' +
                    (icon ? '<i class="material-icons left">' + icon + '</i>' : '<i class="material-icons left">live_help</i>') +
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
        $adminSideMenu.find('.admin-sidemenu-menu').html(lines);

        $('.admin-sidemenu-close').off('click').on('click', function () {
            $adminSideMain.toggleClass('admin-sidemenu-closed');
            $adminSideMenu.toggleClass('admin-sidemenu-closed');
            $('.admin-sidemenu-close i').toggleClass('hide');

            setTimeout(function () {
                //resizeGrids();
                $(window).trigger('resize');
            }, 400);
        });

        $('.admin-sidemenu-items').off('click').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.hash = '#' + $(this).data('tab');
        });
        $('.admin-sidemenu-items a').off('click').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.hash = '#' + $(this).parent().data('tab');
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
            var $backButton = $adminSideMain.find('.button-command');
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

                    // set logo and set branding
                    if (data && data.native && data.native.vendor) {
                        var vendor = data.native.vendor;
                        if (vendor.icon) {
                            $('.admin-sidemenu-header .button-icon img').attr('src', data.native.vendor.icon);
                        }
                        if (vendor.name) {
                            $('.admin-sidemenu-header .button-version').html(data.native.vendor.name).addClass('vendor');
                        }
                        if (vendor.admin && vendor.admin.noCustomInstall) {
                            $('#btn_filter_custom_url').hide();
                        }
                        if (vendor.admin && vendor.admin.css) {
                            if (vendor.admin.css.sideNavUser) {
                                $('.side-nav .user-view').css(vendor.admin.css.sideNavUser);
                            }
                            if (vendor.admin.css.sideNavMenu) {
                                $('.side-nav').css(vendor.admin.css.sideNavMenu);
                            }
                            if (vendor.admin.css.header) {
                                $adminSideMain.find('.admin-sidemenu-header nav').css(vendor.admin.css.header);
                            }
                            // apply rules
                            if (vendor.admin.css.rules) {
                                for (var r = 0; r < vendor.admin.css.rules.length; r++) {
                                    $(vendor.admin.css.rules[r].selector).css(vendor.admin.css.rules[r].css);
                                }
                            }
                            if (vendor.admin.styles) {
                                $('head').append('<style type="text/css">' + vendor.admin.styles + '</style>');
                            }
                        }
                    }

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
                                            var language = (main.systemConfig.common.language || window.navigator.userLanguage || window.navigator.language || '').substring(0, 2);
                                            if (language !== 'en' && language !== 'de' && language !== 'ru') language = 'en';

                                            systemLang = language;

                                            $dialogLicense.find('.license_text').html(license[language] || license.en);

                                            $dialogLicense.find('.license_checkbox').prop('checked', false);

                                            // on language change
                                            $dialogLicense.find('.license_language')
                                                .data('licenseConfirmed', false)
                                                .val(language)
                                                .on('change', function () {
                                                    language = $(this).val();
                                                    $dialogLicense.find('.license_language_label').html(translateWord('Select language', language));
                                                    $dialogLicense.find('.license_text').html(license[language] || license.en);
                                                    $dialogLicense.find('.license_checkbox').html(translateWord('license_checkbox', language));
                                                    $dialogLicense.find('.license_agree .translate').html(translateWord('agree', language));
                                                    $dialogLicense.find('.license_non_agree .translate').html(translateWord('not agree', language));
                                                    $dialogLicense.find('.license_terms').html(translateWord('License terms', language));
                                                    $dialogLicense.find('.license_agreement_label').html(translateWord('license agreement', language));
                                                }).select();

                                            $dialogLicense.find('.license_diag').on('change', function () {
                                                if ($(this).prop('checked')) {
                                                    $dialogLicense.find('.license_agree').removeClass('disabled');
                                                } else {
                                                    $dialogLicense.find('.license_agree').addClass('disabled');
                                                }
                                            });

                                            // workaround for materialize checkbox problem
                                            $dialogLicense.find('input[type="checkbox"]+span').off('click').on('click', function () {
                                                var $input = $(this).prev();
                                                if (!$input.prop('disabled')) {
                                                    $input.prop('checked', !$input.prop('checked')).trigger('change');
                                                }
                                            });

                                            $dialogLicense.modal({
                                                dismissible: false,
                                                complete: function () {
                                                    $dialogLicense.find('.license_text').html('');
                                                    location.reload();
                                                }
                                            }).modal('open');

                                            $dialogLicense.find('.license_agree').addClass('disabled').off('click').on('click', function (e) {
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
                                                        $dialogLicense.find('.license_agree').off('click');
                                                        $dialogLicense.find('.license_non_agree').off('click');
                                                    });
                                                });
                                            });
                                            $dialogLicense.find('.license_non_agree').off('click').on('click', function (e) {
                                                location.reload();
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
                                                infoAdapterInstall: false,      // Asked if user wants to install the info adapter
                                                defaultHistory:   '',           // Default history instance
                                                tabs: [                         // Show by default only these tabs
                                                    'tab-intro',
                                                    'tab-info',
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
                                // call prepare
                                for (var t in tabs) {
                                    if (tabs.hasOwnProperty(t) && tabs[t] && typeof tabs[t].prepare === 'function') {
                                        tabs[t].prepare();
                                    }
                                }
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

    });
})(jQuery);