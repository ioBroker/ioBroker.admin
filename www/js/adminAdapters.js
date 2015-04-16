function Adapters(main) {
    var that = this;

    this.curRepository =         null;
    this.curRepoLastUpdate =     null;
    this.curInstalled =          null;
    this.list = [];
    this.$grid =  $('#grid-adapters');
    this.main = main;
    this.tree = [];
    this.data = {};
    this.groupImages = {
        'common adapters': '/img/common.png',
        'hardware': '/img/hardware.png',
        'script': '/img/script.png',
        'media': '/img/media.png',
        'communication': '/img/communication.png',
        'visualisation': '/img/visualisation.png'
    };

    this.isList = false;
    this.filterVals = {length: 0};
    this.onlyInstalled = false;
    this.onlyUpdatable = false;
    this.currentFilter = '';
    this.isCollapsed = {};

    this.prepare = function () {
        that.$grid.fancytree({
            extensions: ["table", "gridnav", "filter"/*, "themeroller"*/],
            checkbox: false,
            table: {
                indentation: 20      // indent 20px per node level
            },
            source: that.tree,
            renderColumns: function(event, data) {
                var node = data.node;
                var $tdList = $(node.tr).find(">td");

                if (!that.data[node.key]) {
                    $tdList.eq(0).css({'font-weight': 'bold'});
                    //$(node.tr).addClass('ui-state-highlight');
                    return;
                }
                $tdList.eq(0).css({'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(1).html(that.data[node.key].desc).css({'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(2).html(that.data[node.key].keywords).css({'overflow': 'hidden', "white-space": "nowrap"}).attr('title', that.data[node.key].keywords);

                $tdList.eq(3).html(that.data[node.key].version).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(4).html(that.data[node.key].installed).css({'padding-left': '10px', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(5).html(that.data[node.key].platform).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(6).html(that.data[node.key].license).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(7).html(that.data[node.key].install).css({'text-align': 'center'});
            },
            gridnav: {
                autofocusInput:   false,
                handleCursorKeys: true
            },
            filter: {
                mode: "hide",
                autoApply: true
            },
            expand: function(event, data) {
                that.isCollapsed[data.node.key] = false;
                that.main.saveConfig('adaptersIsCollapsed', JSON.stringify(that.isCollapsed));
                that.initButtons();
            },
            collapse: function(event, data) {
                that.isCollapsed[data.node.key] = true;
                that.main.saveConfig('adaptersIsCollapsed', JSON.stringify(that.isCollapsed));
            }
        });

        $('#btn_collapse_adapters').button({icons: {primary: 'ui-icon-folder-collapsed'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            setTimeout(function () {
                that.$grid.fancytree('getRootNode').visit(function (node) {
                    if (!that.filterVals.length || node.match || node.subMatch) node.setExpanded(false);
                });
                $('#process_running_adapters').hide();
            }, 100);
        });

        $('#btn_expand_adapters').button({icons: {primary: 'ui-icon-folder-open'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            setTimeout(function () {
                that.$grid.fancytree('getRootNode').visit(function (node) {
                    if (!that.filterVals.length || node.match || node.subMatch)
                        node.setExpanded(true);
                });
                $('#process_running_adapters').hide();
            }, 100);
        });

        $('#btn_list_adapters').button({icons: {primary: 'ui-icon-grip-dotted-horizontal'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            that.isList = !that.isList;
            if (that.isList) {
                $('#btn_list_adapters').addClass('ui-state-error');
                $('#btn_expand_adapters').hide();
                $('#btn_collapse_adapters').hide();
                $(this).attr('title', _('list'));
            } else {
                $('#btn_list_adapters').removeClass('ui-state-error');
                $('#btn_expand_adapters').show();
                $('#btn_collapse_adapters').show();
                $(this).attr('title', _('tree'));
            }
            that.main.saveConfig('adaptersIsList', that.isList);
            $('#process_running_adapters').show();

            setTimeout(function () {
                that.init(true);
                $('#process_running_adapters').hide();
            }, 200);
        });

        $('#btn_filter_adapters').button({icons: {primary: 'ui-icon-star'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            that.onlyInstalled = !that.onlyInstalled;
            if (that.onlyInstalled) {
                $('#btn_filter_adapters').addClass('ui-state-error');
            } else {
                $('#btn_filter_adapters').removeClass('ui-state-error');
            }
            that.main.saveConfig('adaptersOnlyInstalled', that.onlyInstalled);

            setTimeout(function () {
                that.init(true);
                $('#process_running_adapters').hide();
            }, 200);
        });

        $('#btn_filter_updates').button({icons: {primary: 'ui-icon-info'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            that.onlyUpdatable = !that.onlyUpdatable;
            if (that.onlyUpdatable) {
                $('#btn_filter_updates').addClass('ui-state-error');
            } else {
                $('#btn_filter_updates').removeClass('ui-state-error');
            }
            that.main.saveConfig('adaptersOnlyUpdatable', that.onlyUpdatable);

            setTimeout(function () {
                that.init(true);
                $('#process_running_adapters').hide();
            }, 200);
        });

        // Load settings
        that.isList = that.main.config.adaptersIsList || false;
        that.onlyInstalled = that.main.config.adaptersOnlyInstalled || false;
        that.onlyUpdatable = that.main.config.adaptersOnlyUpdatable || false;
        that.currentFilter = that.main.config.adaptersCurrentFilter || '';
        that.isCollapsed = that.main.config.adaptersIsCollapsed ? JSON.parse(that.main.config.adaptersIsCollapsed) : {};
        $('#adapters-filter').val(that.currentFilter)

        if (that.isList) {
            $('#btn_list_adapters').addClass('ui-state-error');
            $('#btn_expand_adapters').hide();
            $('#btn_collapse_adapters').hide();
            $('#btn_list_adapters').attr('title', _('tree'));
        }

        if (that.onlyInstalled) $('#btn_filter_adapters').addClass('ui-state-error');
        if (that.onlyUpdatable) $('#btn_filter_updates').addClass('ui-state-error');

        $('#btn_refresh_adapters').button({icons: {primary: 'ui-icon-refresh'}, text: false}).css({width: 18, height: 18}).click(function () {
            that.init(true, true);
        });


        // add filter processing
        $('#adapters-filter').keyup(function () {
            $(this).trigger('change');
        }).on('change', function () {
            if (that.filterTimer) {
                clearTimeout(that.filterTimer);
            }
            that.filterTimer = setTimeout(function () {
                that.filterTimer = null;
                that.currentFilter = $('#adapters-filter').val();
                that.main.saveConfig('adaptersCurrentFilter', that.currentFilter);
                that.$grid.fancytree('getTree').filterNodes(customFilter, false);
            }, 400);
        })

        $('#adapters-filter-clear').button({icons: {primary: 'ui-icon-close'}, text: false}).css({width: 16, height: 16}).click(function () {
            $('#adapters-filter').val('').trigger('change');
        });
    };

    function customFilter(node) {
        //if (node.parent && node.parent.match) return true;

        if (that.currentFilter) {
             if (!that.data[node.key]) return false;

             if ((that.data[node.key].name && that.data[node.key].name.toLowerCase().indexOf(that.currentFilter) != -1) ||
                 (that.data[node.key].title && that.data[node.key].title.toLowerCase().indexOf(that.currentFilter) != -1) ||
                 (that.data[node.key].keywords && that.data[node.key].keywords.toLowerCase().indexOf(that.currentFilter) != -1) ||
                 (that.data[node.key].desc && that.data[node.key].desc.toLowerCase().indexOf(that.currentFilter) != -1)){
                return true;
             } else {
                 return false;
             }
        } else {
            return true;
        }
    }

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
        $('#grid-adapters-div').height($(window).height() - $('#tabs .ui-tabs-nav').height() - 50);
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

            $('#process_running_adapters').show();

            this.$grid.find('tbody').html('');

            this.getAdaptersInfo(this.main.currentHost, update, updateRepo, function (repository, installedList) {
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

                that.tree = [];
                that.data = {};

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
                        installed = '<table style="border: 0px;border-collapse: collapse;" cellspacing="0" cellpadding="0"><tr><td style="border: 0px;padding: 0;width:50px">' + obj.version + '</td>';

                        var _instances = 0;
                        var _enabled   = 0;

                        // Show information about installed and enabled instances
                        for (var z = 0; z < that.main.instances.length; z++) {
                            if (main.objects[that.main.instances[z]].common.name == adapter) {
                                _instances++;
                                if (main.objects[that.main.instances[z]].common.enabled) _enabled++;
                            }
                        }
                        if (_instances) {
                            installed += '<td style="border: 0px;padding: 0;width:40px">[<span title="' + _('Installed instances') + '">' + _instances + '</span>';
                            if (_enabled) installed += '/<span title="' + _('Active instances') + '" style="color: green">' + _enabled + '</span>';
                            installed += ']</td>';
                        } else {
                            installed += '<td style="border: 0px;padding: 0;width:40px"></td>';
                        }

                        tmp = installed.split('.');
                        if (!that.main.upToDate(version, obj.version)) {
                            installed += '<td style="border: 0px;padding: 0;width:30px"><button class="adapter-update-submit" data-adapter-name="' + adapter + '">' + _('update') + '</button></td>';
                            version = version.replace('class="', 'class="updateReady ');
                            $('a[href="#tab-adapters"]').addClass('updateReady');
                        } else if (that.onlyUpdatable) {
                            continue;
                        }

                            installed += '</tr></table>';
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

                    that.data[adapter] = {
                        image:      icon ? '<img src="' + icon + '" width="22px" height="22px" />' : '',
                        name:       adapter,
                        title:      obj.title,
                        desc:       (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc,
                        keywords:   obj.keywords ? obj.keywords.join(' ') : '',
                        version:    version,
                        installed:  installed,
                        install: '<button data-adapter-name="' + adapter + '" class="adapter-install-submit">' + _('add instance') + '</button>' +
                            '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" data-adapter-url="' + obj.readme + '" class="adapter-readme-submit">' + _('readme') + '</button>' +
                            '<button ' + (installed ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" class="adapter-delete-submit">' + _('delete adapter') + '</button>',
                        platform:   obj.platform,
                        group:      obj.type ? obj.type : 'common adapters',
                        license:    obj.license || '',
                        licenseUrl: obj.licenseUrl || ''
                    };

                    if (!that.isList) {
                        var igroup = -1;
                        for (var j = 0; j < that.tree.length; j++){
                            if (that.tree[j].key == that.data[adapter].group) {
                                igroup = j;
                                break;
                            }
                        }
                        if (igroup < 0) {
                            that.tree.push({
                                title:    _(that.data[adapter].group),
                                key:      that.data[adapter].group,
                                folder:   true,
                                expanded: !that.isCollapsed[that.data[adapter].group],
                                children: [],
                                icon:     that.groupImages[that.data[adapter].group]
                            });
                            igroup = that.tree.length - 1;
                        }
                        that.tree[igroup].children.push({
                            icon:     icon,
                            title:    that.data[adapter].title || adapter,
                            key:      adapter,
                            folder:   false,
                            expanded: false
                        });
                    } else {
                        that.tree.push({
                            icon:     icon,
                            title:    that.data[adapter].title || adapter,
                            key:      adapter,
                            folder:   false,
                            expanded: false
                        });
                    }
                }

                if (!that.onlyInstalled && !that.onlyUpdatable) {
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

                        that.data[adapter] = {
                            image:      repository[adapter].extIcon ? '<img src="' + repository[adapter].extIcon + '" width="22px" height="22px" />' : '',
                            name:       adapter,
                            title:      obj.title,
                            desc:       (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc,
                            keywords:   obj.keywords ? obj.keywords.join(' ') : '',
                            version:    version,
                            installed:  '',
                            install: '<button data-adapter-name="' + adapter + '" class="adapter-install-submit">' + _('add instance') + '</button>' +
                                '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + ' data-adapter-name="' + adapter + '" data-adapter-url="' + obj.readme + '" class="adapter-readme-submit">' + _('readme') + '</button>' +
                                '<button disabled="disabled" data-adapter-name="' + adapter + '" class="adapter-delete-submit">' + _('delete adapter') + '</button>',
                            platform:   obj.platform,
                            license:    obj.license || '',
                            licenseUrl: obj.licenseUrl || '',
                            group:      obj.type ? obj.type : 'common adapters'
                        };
                        if (!that.isList) {
                            var igroup = -1;
                            for (var j = 0; j < that.tree.length; j++){
                                if (that.tree[j].key == that.data[adapter].group) {
                                    igroup = j;
                                    break;
                                }
                            }
                            if (igroup < 0) {
                                that.tree.push({
                                    title:    _(that.data[adapter].group),
                                    key:      that.data[adapter].group,
                                    folder:   true,
                                    expanded: !that.isCollapsed[that.data[adapter].group],
                                    children: [],
                                    icon:     that.groupImages[that.data[adapter].group]
                                });
                                igroup = that.tree.length - 1;
                            }
                            that.tree[igroup].children.push({
                                title:    that.data[adapter].title || adapter,
                                icon:     repository[adapter].extIcon,
                                key:      adapter,
                                folder:   false,
                                expanded: false
                            });
                        } else {
                            that.tree.push({
                                icon:     repository[adapter].extIcon,
                                title:    that.data[adapter].title || adapter,
                                key:      adapter,
                                folder:   false,
                                expanded: false
                            });
                        }
                    }
                }

                that.$grid.fancytree('getTree').reload(that.tree);
                $('#grid-adapters .fancytree-icon').each(function () {
                    if ($(this).attr('src')) $(this).css({width: 22, height: 22});
                });
                that.initButtons();
                $('#process_running_adapters').hide();
                if (that.currentFilter) that.$grid.fancytree('getTree').filterNodes(customFilter, false);
            });
        }
    };

    function showLicenseDialog(adapter, callback) {
        var $dialogLicense = $('#dialog-license');
        // Is adapter installed
        if (/*that.data[adapter].installed || */!that.data[adapter].licenseUrl) {
            callback(true);
            return;
        }
        $('#license_language').hide();
        $('#license_language_label').hide();

        var timeout = setTimeout(function () {
            timeout = null;
            callback(true);
        }, 10000);

        that.main.socket.emit('httpGet', that.data[adapter].licenseUrl, function (error, response, body) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;

                if (!error && body) {
                    $dialogLicense.css({'z-index': 200});
                    $('#license_text').html('<pre>' + body + '</pre>');
                    $dialogLicense.dialog({
                        autoOpen: true,
                        modal: true,
                        width: 600,
                        height: 400,
                        buttons: [
                            {
                                text: _('agree'),
                                click: function () {
                                    $dialogLicense.dialog('close');
                                    callback(true);
                                }
                            },
                            {
                                text: _('not agree'),
                                click: function () {
                                    $dialogLicense.dialog('close');
                                    callback(false);
                                }
                            }
                        ],
                        close: function () {
                            callback(false);
                        }
                    });
                } else {
                    callback(true);
                }
            }
        });
    }

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
                    // Show license dialog!
                    showLicenseDialog(adapter, function (isAgree) {
                        if (isAgree) {
                            that.main.cmdExec(null, 'add ' + adapter, function (exitCode) {
                                if (!exitCode) that.init(true);
                            });
                        }
                    });
                } else {
                    that.main.cmdExec(null, 'add ' + adapter, function (exitCode) {
                        if (!exitCode) that.init(true);
                    });
                }
            });
        });

        $(".adapter-delete-submit").button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            that.main.cmdExec(null, 'del ' + $(this).attr('data-adapter-name'), function (exitCode) {
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

            that.main.cmdExec(null, 'upgrade ' + aName, function (exitCode) {
                if (!exitCode) that.init(true);
            });
        });
    };
}