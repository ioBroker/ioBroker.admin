function Adapters(main) {
    var that = this;

    this.curRepository =         null;
    this.curRepoLastUpdate =     null;
    this.curInstalled =          null;
    this.list = [];
    this.$grid =  $('#grid-adapters');
    this.main = main;

    this.prepare = function () {
        this.$grid.jqGrid({
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
            pager:        $('#pager-adapters'),
            width:        964,
            height:       326,
            rowNum:       100,
            rowList:      [20, 50, 100],
            sortname:     "id",
            sortorder:    "desc",
            viewrecords:  true,
            caption:      _('ioBroker adapters'),
            ignoreCase:   true,
            loadComplete: function () {
                that.initButtons();
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false,
            afterSearch:   function () {
                that.initButtons();
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
                that.init(true, true);
            },
            position:      'first',
            id:            'add-object',
            title:         _('update adapter information'),
            cursor:        'pointer'
        });

        $('#gview_grid-adapters .ui-jqgrid-titlebar').append('<div style="padding-left: 120px; margin-bottom: -3px;"><span class="translate">Host: </span><select id="host-adapters"></select></div>');
    };

    this.getAdaptersInfo = function (host, update, updateRepo, callback) {
        if (!callback) throw 'Callback cannot be null or undefined';
        if (update) {
            // Do not update too offten
            if (!this.curRepoLastUpdate || ((new Date()).getTime() - this.curRepoLastUpdate > 1000)) {
                this.curRepository = null;
                this.curInstalled  = null;
            }
        }
        if (!this.curRepository) {
            this.main.socket.emit('sendToHost', host, 'getRepository', {repo: this.main.systemConfig.common.activeRepo, update: updateRepo}, function (_repository) {
                that.curRepository = _repository;
                if (that.curRepository && that.curInstalled) {
                    that.curRepoLastUpdate = (new Date()).getTime();
                    setTimeout(function () {
                        callback(that.curRepository, that.curInstalled);
                    }, 0);
                }
            });
        }
        if (!this.curInstalled) {
            this.main.socket.emit('sendToHost', host, 'getInstalled', null, function (_installed) {
                that.curInstalled = _installed;
                if (that.curRepository && that.curInstalled) {
                    that.curRepoLastUpdate = (new Date()).getTime();
                    setTimeout(function () {
                        callback(that.curRepository, that.curInstalled);
                    }, 0);
                }
            });
        }
        if (this.curInstalled && this.curRepository) {
            setTimeout(function () {
                callback(that.curRepository, that.curInstalled);
            }, 0);
        }
    };

    this.resize = function (width, height) {
        this.$grid.setGridHeight(height - 150).setGridWidth(width - 20);
    }

    // ----------------------------- Adpaters show and Edit ------------------------------------------------
    this.init = function (update, updateRepo) {
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }


        if (typeof this.$grid !== 'undefined' && (!this.$grid[0]._isInited || update)) {
            this.$grid[0]._isInited = true;

            this.$grid.jqGrid('clearGridData');
            $("#load_grid-adapters").show();
            $('a[href="#tab-adapters"]').removeClass('updateReady');

            $("#load_grid-adapters").show();

            this.getAdaptersInfo(main.currentHost, update, updateRepo, function (repository, installedList) {
                var id = 1;
                var obj;
                var version;
                var tmp;
                var adapter;

                var listInstalled = [];
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
                    var icon = obj.icon;
                    version = '';

                    if (repository[adapter] && repository[adapter].version) version = repository[adapter].version;

                    if (repository[adapter] && repository[adapter].extIcon) icon = repository[adapter].extIcon;

                    if (obj.version) {
                        installed = obj.version;

                        var _instances = 0;
                        var _enabled = 0;
                        // Show information about installed and enabled instances
                        for (var z = 0; z < that.main.instances.length; z++) {
                            if (main.objects[that.main.instances[z]].common.name == adapter) {
                                _instances++;
                                if (main.objects[that.main.instances[z]].common.enabled) _enabled++;
                            }
                        }
                        if (_instances) {
                            installed += '&nbsp;[<span title="' + _('Installed instances') + '">' + _instances + '</span>';
                            if (_enabled) installed += '/<span title="' + _('Active instances') + '" style="color: green">' + _enabled + '</span>';
                            installed += ']';
                        }

                        tmp = installed.split('.');
                        if (!that.main.upToDate(version, installed)) {
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

                    that.$grid.jqGrid('addRowData', 'adapter_' + adapter.replace(/ /g, '_'), {
                        _id: id++,
                        image: icon ? '<img src="' + icon + '" width="22px" height="22px" />' : '',
                        name: adapter,
                        title: obj.title,
                        desc: (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc,
                        keywords: obj.keywords ? obj.keywords.join(' ') : '',
                        version: version,
                        installed: installed,
                        install: '<button data-adapter-name="' + adapter + '" class="adapter-install-submit">' + _('add instance') + '</button>' +
                        '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" data-adapter-url="' + obj.readme + '" class="adapter-readme-submit">' + _('readme') + '</button>' +
                        '<button ' + (installed ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" class="adapter-delete-submit">' + _('delete adapter') + '</button>',
                        platform: obj.platform
                    });
                }

                for (i = 0; i < listUnsinstalled.length; i++) {
                    adapter = listUnsinstalled[i];

                    obj = repository[adapter];
                    if (!obj || obj.controller) continue;
                    version = '';
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

                    that.$grid.jqGrid('addRowData', 'adapter_' + adapter.replace(/ /g, '_'), {
                        _id: id++,
                        image: repository[adapter].extIcon ? '<img src="' + repository[adapter].extIcon + '" width="22px" height="22px" />' : '',
                        name: adapter,
                        title: obj.title,
                        desc: (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc,
                        keywords: obj.keywords ? obj.keywords.join(' ') : '',
                        version: version,
                        installed: '',
                        install: '<button data-adapter-name="' + adapter + '" class="adapter-install-submit">' + _('add instance') + '</button>' +
                        '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + ' data-adapter-name="' + adapter + '" data-adapter-url="' + obj.readme + '" class="adapter-readme-submit">' + _('readme') + '</button>' +
                        '<button disabled="disabled" data-adapter-name="' + adapter + '" class="adapter-delete-submit">' + _('delete adapter') + '</button>',
                        platform: obj.platform
                    });
                }

                that.$grid.trigger('reloadGrid');
            });
        }
    };
    
    this.initButtons = function () {
        $(".adapter-install-submit").button({
            text: false,
            icons: {
                primary: 'ui-icon-plusthick'
            }
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var adapter = $(this).attr('data-adapter-name');
            that.getAdaptersInfo(that.main.currentHost, false, false, function (repo, installed) {
                var obj = repo[adapter];

                if (!obj) obj = installed[adapter];

                if (!obj) return;

                if (obj.license && obj.license !== 'MIT') {
                    // TODO Show license dialog!
                    that.main.cmdExec(that.main.currentHost, 'add ' + adapter, function (exitCode) {
                        if (!exitCode) that.init(true);
                    });
                } else {
                    that.main.cmdExec(currentHost, 'add ' + adapter, function (exitCode) {
                        if (!exitCode) that.init(true);
                    });
                }
            });
        });

        $(".adapter-delete-submit").button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            that.main.cmdExec(currentHost, 'del ' + $(this).attr('data-adapter-name'), function (exitCode) {
                if (!exitCode) that.init(true);
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
            if (aName == 'admin') that.main.waitForRestart = true;

            that.main.cmdExec(currentHost, 'upgrade ' + aName, function (exitCode) {
                if (!exitCode) that.init(true);
            });
        });
    };
}