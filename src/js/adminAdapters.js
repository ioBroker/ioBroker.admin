function Adapters(main) {
    'use strict';

    const that = this;

    this.curRepository     = null;
    this.curRepoLastUpdate = null;
    this.curInstalled      = null;
    this.curRepoLastHost   = null;

    this.list   = [];
    this.$tab   = $('#tab-adapters');
    this.$grid  = this.$tab.find('#grid-adapters');
    this.$tiles = this.$tab.find('#grid-adapters-tiles');
    this.$installDialog = $('#dialog-install-url');
    this.main   = main;
    this.tree   = [];
    this.data   = {};
    this.urls   = {};
    this.groupImages = {
        'common adapters_group':  'img/common.png',
        'general_group':          'img/common.png',
        'hardware_group':         'img/hardware.png',
        'lighting_group':         'img/hardware.png',
        'energy_group':           'img/hardware.png',
        'household_group':        'img/hardware.png',
        'iot-systems_group':      'img/hardware.png',
        'climate-control_group':  'img/hardware.png',
        'infrastructure_group':   'img/hardware.png',
        'garden_group':           'img/hardware.png',
        'alarm_group':            'img/hardware.png',
        'script_group':           'img/script.png',
        'logic_group':            'img/script.png',
        'media_group':            'img/media.png',
        'multimedia_group':       'img/media.png',
        'communication_group':    'img/communication.png',
        'protocols_group':        'img/communication.png',
        'network_group':          'img/communication.png',
        'messaging_group':        'img/communication.png',
        'visualisation_group':    'img/visualisation.png',
        'visualization_group':    'img/visualisation.png',
        'visualization-icons_group': 'img/visualisation.png',
        'visualization-widgets_group': 'img/visualisation.png',
        'storage_group':          'img/storage.png',
        'weather_group':          'img/weather.png',
        'schedule_group':         'img/schedule.png',
        'vis_group':              'img/vis.png',
        'date-and-time_group':    'img/service.png',
        'geoposition_group':      'img/service.png',
        'utility_group':          'img/service.png',
        'misc-data_group':        'img/service.png',
        'service_group':          'img/service.png',
        'third-party_group':      'img/service.png'
    };
    this.inited = false;

    this.isList        = false;
    this.filterVals    = {length: 0};
    this.onlyInstalled = false;
    this.onlyUpdatable = false;
    this.currentFilter = '';
    this.currentType   = '';
    this.isCollapsed   = {};
    this.isTiles       = true;

    this.types = {
        occ:          'schedule'
    };

    function getVersionClass(version) {
        if (version) {
            const tmp = version.split ('.');
            if (tmp[0] === '0' && tmp[1] === '0' && tmp[2] === '0') {
                version = 'planned';
            } else if (tmp[0] === '0' && tmp[1] === '0') {
                version = 'alpha';
            } else if (tmp[0] === '0') {
                version = 'beta'
            } else if (version === 'npm error') {
                version = 'error';
            } else {
                version = 'stable';
            }
        }
        return version;
    }

    function prepareTable() {
        that.$grid.show();
        that.$tiles.html('').hide();
        that.$tab.find('#main-toolbar-table-types-btn').hide();

        if (!that.$grid.data('inited')) {
            that.$grid.data('inited', true);
            that.$grid.fancytree({
                extensions: ['table', 'gridnav', 'filter', 'themeroller'],
                checkbox:   false,
                strings: {
                    noData: _('No data')
                },
                table: {
                    indentation: 5      // indent 20px per node level
                },
                show: function (currentId, filter, onSuccess) {
                    that.sortTree();
                },
                source:     that.tree,
                renderColumns: function(event, data) {
                    const node = data.node;
                    const $tdList = $(node.tr).find('>td');
                    const obj = that.data[node.key];

                    function ellipsis(txt) {
                        return '<div class="text-ellipsis">' + txt + '</div>';
                    }

                    if (!obj) {
                        $tdList.eq(0).css({'font-weight': 'bold'});
                        $tdList.eq(0).find('img').remove();
                        $tdList.eq(0).find('span.fancytree-title').attr('style', 'padding-left: 0px !important');

                        // Calculate total count of adapter and count of installed adapter
                        for (let c = 0; c < that.tree.length; c++) {
                            if (that.tree[c].key === node.key) {
                                $tdList.eq(1).html(that.tree[c].desc || '').css({'overflow': 'hidden', 'white-space': 'nowrap', position: 'relative'});
                                let installed = 0;
                                for (let k = 0; k < that.tree[c].children.length; k++) {
                                    if (that.data[that.tree[c].children[k].key].installed) {
                                        installed++;
                                    }
                                }
                                that.tree[c].installed = installed;
                                node.data.installed = installed;
                                let title = '[<span title="' + _('Installed from group') + '">' + installed + '</span> / <span title="' + _('Total count in group') + '">' + that.tree[c].children.length + '</span>]';
                                $tdList.eq(1).html(ellipsis('<span class="dark-green">' + installed + '</span> ' + _('of') + '<span class="dark-blue"> ' + that.tree[c].children.length + '</span> ' + _('Adapters from this Group installed')));
                                break;
                            }
                        }
                        return;
                    }

                    $tdList.eq(0).css({'overflow': 'hidden', 'white-space': 'nowrap'});

                    function setHtml(no, html) {
                        return $tdList.eq(no).html(ellipsis(html));
                    }

                    const idx = obj.desc.indexOf('<div');
                    const desc = idx >= 0 ? obj.desc.substr(0, idx) : obj.desc;
                    $tdList.eq(1).html(ellipsis(obj.desc))
                        .attr('title', desc)
                        .css({'white-space': 'nowrap', position: 'relative', 'font-weight': obj.bold ? 'bold' : null}).find('>div>div')
                        .css('height: 22px !important')
                    ;

                    setHtml(2, obj.keywords).attr('title', obj.keywords);

                    $tdList.eq(3).html(obj.installed);
                    $tdList.eq(4).html(obj.version); //.css({ position: 'relative'});

                    // setHtml(5, obj.platform);// actually there is only one platform
                    setHtml(5, obj.license);
                    setHtml(6, obj.install);

                    that.initButtons(node.key);
                    // If we render this element, that means it is expanded
                    if (that.isCollapsed[obj.group]) {
                        that.isCollapsed[obj.group] = false;
                        that.main.saveConfig('adaptersIsCollapsed', JSON.stringify(that.isCollapsed));
                    }
                },
                gridnav: {
                    autofocusInput:   false,
                    handleCursorKeys: true
                },
                filter: {
                    mode: 'hide',
                    autoApply: true
                },
                collapse: function(event, data) {
                    if (that.isCollapsed[data.node.key]) return;
                    that.isCollapsed[data.node.key] = true;
                    that.main.saveConfig('adaptersIsCollapsed', JSON.stringify(that.isCollapsed));
                }
            });

            that.$tab.find('#btn_collapse_adapters').show().off('click').on('click', function () {
                that.$tab.find('.process-adapters').show();
                setTimeout(function () {
                    that.$grid.fancytree('getRootNode').visit(function (node) {
                        if (!that.filterVals.length || node.match || node.subMatch) node.setExpanded(false);
                    });
                    that.$tab.find('.process-adapters').hide();
                }, 100);
            });

            that.$tab.find('#btn_expand_adapters').show().off('click').on('click', function () {
                that.$tab.find('.process-adapters').show();
                setTimeout(function () {
                    that.$grid.fancytree('getRootNode').visit(function (node) {
                        if (!that.filterVals.length || node.match || node.subMatch)
                            node.setExpanded(true);
                    });
                    that.$tab.find('.process-adapters').hide();
                }, 100);
            });

            that.$tab.find('#btn_list_adapters').show().off('click').on('click', function () {
                const $processAdapters = that.$tab.find('.process-adapters');
                $processAdapters.show();
                that.isList = !that.isList;
                if (that.isList) {
                    that.$tab.find('#btn_list_adapters').addClass('red lighten-3');
                    that.$tab.find('#btn_expand_adapters').hide();
                    that.$tab.find('#btn_collapse_adapters').hide();
                    $(this).attr('title', _('list'));
                } else {
                    that.$tab.find('#btn_list_adapters').removeClass('red lighten-3');
                    that.$tab.find('#btn_expand_adapters').show();
                    that.$tab.find('#btn_collapse_adapters').show();
                    $(this).attr('title', _('tree'));
                }
                that.main.saveConfig('adaptersIsList', that.isList);
                $processAdapters.show();

                setTimeout(function () {
                    that._postInit(true);
                    $processAdapters.hide();
                }, 200);
            });
        } else {
            that.$tab.find('#btn_collapse_adapters').show();
            that.$tab.find('#btn_expand_adapters').show();
            that.$tab.find('#btn_list_adapters').show();
        }

        if (that.isList) {
            that.$tab.find('#btn_list_adapters').addClass('red lighten-3').attr('title', _('tree'));
            that.$tab.find('#btn_expand_adapters').hide();
            that.$tab.find('#btn_collapse_adapters').hide();
        } else {
            that.$tab.find('#btn_list_adapters').removeClass('red lighten-3').attr('title', _('list'));
            that.$tab.find('#btn_expand_adapters').show();
            that.$tab.find('#btn_collapse_adapters').show();
        }

        that.$tab.find('.filter-input').trigger('change');
    }

    function prepareTiles() {
        that.$grid.hide();
        that.$tiles.show();
        that.$tab.find('#main-toolbar-table-types-btn').show();
        that.$tab.find('#btn_list_adapters').hide();
        that.$tab.find('#btn_collapse_adapters').hide();
        that.$tab.find('#btn_expand_adapters').hide();
        that.$tab.find('.filter-input').trigger('change');
    }

    function onOnlyUpdatableChanged() {
        if (that.onlyUpdatable) {
            that.$tab.find('#btn_filter_updates').addClass('red lighten-3');
            that.$tab.find('#btn_upgrade_all').show();
        } else {
            that.$tab.find('#btn_upgrade_all').hide();
            that.$tab.find('#btn_filter_updates').removeClass('red lighten-3');
        }
    }

    function onExpertmodeChanged() {
        if (that.main.config.expertMode) {
            that.$tab.find('#btn_adapters_expert_mode').addClass('red lighten-3');
            that.$tab.find('#btn_upgrade_all').show();
        } else {
            that.$tab.find('#btn_adapters_expert_mode').removeClass('red lighten-3');
            onOnlyUpdatableChanged();
        }
    }

    function filterTiles() {
        let anyVisible = false;
        // filter
        if (that.currentFilter) {
            that.$tiles.find('.tile').each(function () {
                const $this = $(this);
                if (that.currentType && !$this.hasClass('class-' + that.currentType)) {
                    $this.hide();
                    return;
                }

                if (customFilter({key: $this.data('id')})) {
                    anyVisible = true;
                    $this.show();
                } else {
                    $this.hide();
                }
            });
        } else {
            if (!that.currentType) {
                that.$tiles.find('.tile')
                    .show()
                    .each(function () {
                        if ($(this).is(':visible')) {
                            anyVisible = true;
                            return false;
                        }
                    });
            } else {
                that.$tiles.find('.tile').hide();
                that.$tiles.find('.class-' + that.currentType).show();
                that.$tiles.find('.tile').each(function () {
                    if ($(this).is(':visible')) {
                        anyVisible = true;
                        return false;
                    }
                });
            }
        }

        if (anyVisible) {
            that.$tiles.find('.filtered-out').hide();
        } else {
            that.$tiles.find('.filtered-out').show();
        }
    }

    this.prepare = function () {
        this.$tab.find('#btn_switch_adapters').off('click').on('click', function () {
            that.$tab.find('.process-adapters').show();
            that.isTiles = !that.isTiles;

            if (that.isTiles) {
                that.$tab.removeClass('view-table').addClass('view-tiles');
                $(this).find('i').text('view_list');
            } else {
                $(this).find('i').text('view_module');
                that.$tab.removeClass('view-tiles').addClass('view-table');
            }

            that.main.saveConfig('adaptersIsTiles', that.isTiles);

            setTimeout(function () {
                if (that.isTiles) {
                    prepareTiles();
                } else {
                    prepareTable();
                }
                that._postInit(true);
                that.$tab.find('.process-adapters').hide();
            }, 50);
        });

        this.$tab.find('#btn_filter_adapters').off('click').on('click', function () {
            that.$tab.find('.process-adapters').show();
            that.onlyInstalled = !that.onlyInstalled;
            if (that.onlyInstalled) {
                that.$tab.find('#btn_filter_adapters').addClass('red lighten-3');
            } else {
                that.$tab.find('#btn_filter_adapters').removeClass('red lighten-3');
            }
            that.main.saveConfig('adaptersOnlyInstalled', that.onlyInstalled);

            setTimeout(function () {
                that._postInit(true);
                that.$tab.find('.process-adapters').hide();
            }, 50);
        });

        this.$tab.find('#btn_filter_updates').off('click').on('click', function () {
            that.$tab.find('.process-adapters').show();
            that.onlyUpdatable = !that.onlyUpdatable;
            onOnlyUpdatableChanged();

            that.main.saveConfig('adaptersOnlyUpdatable', that.onlyUpdatable);

            setTimeout(function () {
                that._postInit(true);
                that.$tab.find('.process-adapters').hide();
            }, 200);
        });

        this.$tab.find('#btn_filter_custom_url')
            .off('click')
            .on('click', function () {
                // prepare adapters
                const data = {};
                const order = [];
                let url;
                for (url in that.urls) {
                    if (that.urls.hasOwnProperty(url)) {
                        order.push(url);
                    }
                }
                order.sort();

                for (let o = 0; o < order.length; o++) {
                    const user = that.urls[order[o]].match(/\.com\/([-_$§A-Za-z0-9]+)\/([-._$§A-Za-z0-9]+)\//);
                    if (user && user.length >= 2 && (that.main.config.expertMode || order[o].indexOf('js-controller') === -1)) {
                        //text += '<option value="https://github.com/' + user[1] + '/ioBroker.' + order[o] + '/tarball/master ' + order[o] + '">' + order[o] + '</option>';
                        data[order[o] + ' [' + user[1] + ']'] = null;

                    }
                }
                that.$installDialog.find('#install-github-link').mautocomplete({
                    data: data,
                    minLength: 0,
                    sortFunction: function (a, b, inputString) {
                        return a.indexOf(inputString) - b.indexOf(inputString);
                    }
                });

                that.$installDialog.modal();

                that.$installDialog.find('.btn-install').off('click').on('click', function () {
                    const isCustom = !that.$installDialog.find('a[href="#tabs-install-github"]').hasClass('active');//!!that.$installDialog.find('#tabs-install').tabs('option', 'active');
                    let url;
                    let debug;
                    let adapter;
                    if (isCustom) {
                        url     = that.$installDialog.find('#install-url-link').val();
                        debug   = that.$installDialog.find('#install-url-debug').prop('checked') ? ' --debug' : '';
                        adapter = '';
                    } else {
                        const parts = that.$installDialog.find('#install-github-link').val().split(' ');
                        url     = 'https://github.com/' + parts[1].replace(/^\[|]$/g, '') + '/ioBroker.' + parts[0] + '/tarball/master';
                        debug   = that.$installDialog.find('#install-github-debug').prop('checked') ? ' --debug' : '';
                        adapter = ' ' + parts[0];
                    }

                    if (!url) {
                        that.main.showError(_('Invalid link'));
                        return;
                    }

                    that.main.cmdExec(null, 'url "' + url + '"' + adapter + debug, function (exitCode) {
                        if (!exitCode) {
                            that.init(true, true);
                        }
                    });
                });
                // workaround for materialize checkbox problem
                that.$installDialog.find('input[type="checkbox"]+span').off('click').on('click', function () {
                    const $input = $(this).prev();
                    if (!$input.prop('disabled')) {
                        $input.prop('checked', !$input.prop('checked')).trigger('change');
                    }
                });
                that.$installDialog.modal('open');
                that.$installDialog.find('.tabs').mtabs({
                    nShow: function (tab)  {
                        if (!tab) return;
                        that.main.saveConfig('adaptersInstallTab', $(tab).attr('id'));
                    }
                });

                if (that.main.config.adaptersInstallTab && !that.main.noSelect) {
                    that.$installDialog.find('.tabs').mtabs('select', that.main.config.adaptersInstallTab);
                }
            });

        this.$tab.find('#btn_upgrade_all').off('click').on('click', function () {
            that.main.confirmMessage(_('Do you want to upgrade all adapters?'), _('Please confirm'), 'help', function (result) {
                if (result) {
                    that.main.cmdExec(null, 'upgrade', function (exitCode) {
                        if (!exitCode) that._postInit(true);
                    });
                }
            });
        });

        this.$tab.find('#btn_adapters_expert_mode').on('click', function () {
            that.main.config.expertMode = !that.main.config.expertMode;
            that.main.saveConfig('expertMode', that.main.config.expertMode);
            that.updateExpertMode();
            that.main.tabs.instances.updateExpertMode();
        });

        if (that.main.config.expertMode) {
            that.$tab.find('#btn_adapters_expert_mode').addClass('red lighten-3');
        }

        // save last selected adapter
        this.$installDialog.find('#install-github-link').on('change', function () {
            that.main.saveConfig('adaptersGithub', $(this).val());
        });
        this.$installDialog.find('#install-url-link').on('keyup', function (event) {
            if (event.which === 13) {
                that.$installDialog.find('#dialog-install-url-button').trigger('click');
            }
        });

        // Load settings
        this.isTiles       = (this.main.config.adaptersIsTiles !== undefined && this.main.config.adaptersIsTiles !== null) ? this.main.config.adaptersIsTiles : true;
        this.isList        = this.main.config.adaptersIsList        || false;
        this.onlyInstalled = this.main.config.adaptersOnlyInstalled || false;
        this.onlyUpdatable = this.main.config.adaptersOnlyUpdatable || false;
        this.currentFilter = this.main.config.adaptersCurrentFilter || '';
        this.currentType   = this.main.config.adaptersCurrentType   || '';
        this.currentOrder  = this.main.config.adaptersCurrentOrder  || 'a-z';
        this.isCollapsed   = this.main.config.adaptersIsCollapsed ? JSON.parse(this.main.config.adaptersIsCollapsed) : {};
        if (this.currentFilter) {
            this.$tab.find('.filter-input').addClass('input-not-empty').val(that.currentFilter);
            this.$tab.find('.filter-clear').show();
        } else {
            this.$tab.find('.filter-clear').hide();
        }

        if (this.onlyInstalled) {
            this.$tab.find('#btn_filter_adapters').addClass('red lighten-3');
        } else {
            this.$tab.find('#btn_filter_adapters').removeClass('red lighten-3');
        }

        if (this.onlyUpdatable) {
            this.$tab.find('#btn_filter_updates').addClass('red lighten-3');
        } else {
            this.$tab.find('#btn_filter_updates').removeClass('red lighten-3');
        }

        // fix for IE
        if (this.main.browser === 'ie' && this.main.browserVersion <= 10) {
            this.isTiles = false;
            this.$tab.find('#btn_switch_adapters').hide();
        }

        onExpertmodeChanged();

        this.$tab.find('#btn_refresh_adapters').on('click', function () {
            that.init(true, true);
        });

        // add filter processing
        this.$tab.find('.filter-input').on('keyup', function () {
            $(this).trigger('change');
        }).on('change', function (event) {
            if (that.filterTimer) {
                clearTimeout(that.filterTimer);
            }
            that.filterTimer = setTimeout(function () {
                that.filterTimer = null;
                that.currentFilter = that.$tab.find('.filter-input').val().toLowerCase();
                event && event.target && $(event.target)[that.currentFilter ? 'addClass' : 'removeClass']('input-not-empty');
                if (that.currentFilter) {
                    that.$tab.find('.filter-clear').show();
                } else {
                    that.$tab.find('.filter-clear').hide();
                }

                that.main.saveConfig('adaptersCurrentFilter', that.currentFilter);
                if (that.isTiles) {
                    filterTiles();
                } else {
                    that.$grid.fancytree('getTree').filterNodes(customFilter, false);
                }
            }, 400);
        });

        this.$tab.find('.filter-clear').on('click', function () {
            that.$tab.find('.filter-input').val('').trigger('change');
        });

        if (this.isTiles) {
            this.$tab.find('#btn_switch_adapters').find('i').text('view_list');
            that.$tab.removeClass('view-table').addClass('view-tiles');
            prepareTiles();
        } else {
            that.$tab.removeClass('view-tiles').addClass('view-table');
            prepareTable();
        }
    };

    this.updateExpertMode = function () {
        this.init(true);
        onExpertmodeChanged();
    };

    function customFilter(node) {
        //if (node.parent && node.parent.match) return true;

        if (that.currentFilter) {
            if (!that.data[node.key]) return false;

            let title = that.data[node.key].title;
            if (title && typeof title === 'object') {
                 title = title[systemLang] || title.en;
            }
            let desc = that.data[node.key].desc;
            if (desc && typeof desc === 'object') {
               desc = desc[systemLang] || desc.en;
            }

            if ((that.data[node.key].name     && that.data[node.key].name.toLowerCase().indexOf(that.currentFilter)     !== -1) ||
                (title                        && title.toLowerCase().indexOf(that.currentFilter)                        !== -1) ||
                (that.data[node.key].keywords && that.data[node.key].keywords.toLowerCase().indexOf(that.currentFilter) !== -1) ||
                (desc                         && desc.toLowerCase().indexOf(that.currentFilter)                         !== -1)){
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }

    this.getAdaptersInfo = function (host, update, updateRepo, callback) {
        if (!host) return;

        if (!callback) throw 'Callback cannot be null or undefined';
        if (update) {
            // Do not update too often
            if (!this.curRepoLastUpdate || ((new Date()).getTime() - this.curRepoLastUpdate > 1000)) {
                this.curRepository = null;
                this.curInstalled  = null;
            }
        }

        if (this.curRunning) {
            this.curRunning.push(callback);
            return;
        }

        if (!this.curRepository || this.curRepoLastHost !== host) {
            this.curRepository = null;
            this.main.socket.emit('sendToHost', host, 'getRepository', {repo: this.main.systemConfig.common.activeRepo, update: updateRepo}, _repository => {
                if (_repository === 'permissionError') {
                    console.error('May not read "getRepository"');
                    _repository = {};
                }

                this.curRepository = _repository || {};

                if (this.curRepository && that.curInstalled && that.curRunning) {
                    this.curRepoLastUpdate = Date.now();
                    setTimeout(() => {
                        this.curRunning.forEach(cb =>
                            cb(this.curRepository, this.curInstalled));

                        this.curRunning = null;
                    }, 0);
                }
            });
        }
        if (!this.curInstalled || this.curRepoLastHost !== host) {
            this.curInstalled = null;
            this.main.socket.emit('sendToHost', host, 'getInstalled', null, _installed => {
                if (_installed === 'permissionError') {
                    console.error('May not read "getInstalled"');
                    _installed = {};
                }

                this.curInstalled = _installed || {};

                if (this.curRepository && that.curInstalled) {
                    this.curRepoLastUpdate = Date.now();
                    setTimeout(() => {
                        this.curRunning.forEach(cb =>
                            cb(this.curRepository, this.curInstalled));

                        this.curRunning = null;
                    }, 0);
                }
            });
        }

        this.curRepoLastHost = host;

        if (this.curInstalled && this.curRepository) {
            setTimeout(() => {
                if (this.curRunning) {
                    this.curRunning.forEach(cb =>
                        cb(this.curRepository, this.curInstalled));

                    this.curRunning = null;
                }
                callback && callback(this.curRepository, this.curInstalled);
            }, 0);
        } else {
            this.curRunning = [callback];
        }
    };

    this.enableColResize = function () {
        if (!$.fn.colResizable) return;
        if (this.$grid.is(':visible')) {
            this.$grid.colResizable({liveDrag: true});
        }
    };

    function getNews(actualVersion, adapter) {
        let text = '';
        if (adapter.news) {
            for (const v in adapter.news) {
                if (adapter.news.hasOwnProperty(v)) {
                    if (systemLang === v) text += (text ? '\n' : '') + adapter.news[v];
                    if (v === 'en' || v === 'ru'  || v === 'de') continue;
                    if (v === actualVersion) break;
                    text += (text ? '\n' : '') + (adapter.news[v][systemLang] || adapter.news[v].en);
                }
            }
        }
        return text;
    }

    function checkDependencies(dependencies) {
        if (!dependencies) return '';
        // like [{"js-controller": ">=0.10.1"}]
        let adapters;
        if (dependencies instanceof Array) {
            adapters = {};
            for (let a = 0; a < dependencies.length; a++) {
                if (typeof dependencies[a] === 'string') continue;
                for (const b in dependencies[a]) {
                    if (dependencies[a].hasOwnProperty(b)) {
                        adapters[b] = dependencies[a][b];
                    }
                }
            }
        } else {
            adapters = dependencies;
        }

        for (const adapter in adapters) {
            if (adapters.hasOwnProperty(adapter)) {
                if (adapter === 'js-controller') {
                    if (!semver.satisfies(that.main.objects['system.host.' + that.main.currentHost].common.installedVersion, adapters[adapter])) return _('Invalid version of %s. Required %s', adapter, adapters[adapter]);
                } else {
                    if (!that.main.objects['system.adapter.' + adapter] || !that.main.objects['system.adapter.' + adapter].common || !that.main.objects['system.adapter.' + adapter].common.installedVersion) return _('No version of %s', adapter);
                    if (!semver.satisfies(that.main.objects['system.adapter.' + adapter].common.installedVersion, adapters[adapter])) return _('Invalid version of %s', adapter);
                }
            }
        }
        return '';
    }

    this.sortTree = function() {
        function sort(c1, c2) {
            //const d1 = that.data[c1.key], d2 = that.data[c1.key];
            const inst1 = c1.data.installed || 0, inst2 = c2.data.installed || 0;
            const ret = inst2 - inst1;
            if (ret) return ret;
            let t1 = c1.titleLang || c1.title || '';
            if (typeof t1 === 'object') {
                t1 = t1[systemLang] || t1.en;
            }
            let t2 = c2.titleLang || c2.title || '';
            if (typeof t2 === 'object') {
                t2 = t2[systemLang] || t2.en;
            }

            t1 = t1.toLowerCase();
            t2 = t2.toLowerCase();
            if (t1 > t2) return 1;
            if (t1 < t2) return -1;
            return 0;
        }
        that.$grid.fancytree('getRootNode').sortChildren(sort, true);
    };

    function getInterval(time, todayText, yesterdayText, x1DayAgoText, x2DaysAgoText, x5DaysAgoText, now) {
        now = now || Date.now();
        if (!time) return '';
        if (typeof time === 'string' || typeof time === 'number') {
            time = new Date(time);
        }
        const interval = now.getTime() - time.getTime();
        const days = Math.floor(interval / (24 * 3600000));
        if (days === 0) {
            if (now.getDate() === time.getDate()) {
                return todayText;
            } else {
                return yesterdayText;
            }
        } else if (days === 1) {
            if (now.getDate() - time.getDate() === 1) {
                return yesterdayText;
            } else {
                return x2DaysAgoText.replace('%d', days + 1);
            }
        } else {
            const t  = days % 10;
            const tt = days % 100;
            // 2, 3, 4, 22, 23, 24, 32, 33, 34, 111, ...x2, x3, h4
            if ((tt < 10 || tt > 20) && t >= 2 && t <= 4) {
                return x2DaysAgoText.replace('%d', days);
            } else
            // 1, 21, 31, 41, 121....
            if ((tt < 10 || tt > 20) && t === 1) {
                return x1DayAgoText.replace('%d', days);
            } else {
                return x5DaysAgoText.replace('%d', days);
            }
        }
    }

    this._postInit = function (update, updateRepo) {
        if (typeof this.$grid !== 'undefined') {

            that.$tab.find('.process-adapters').show();

            this.$grid.find('tbody').html('');

            this.getAdaptersInfo(this.main.currentHost, update, updateRepo, function (repository, installedList) {
                let obj;
                let version;
                let rawVersion;
                let adapter;
                let adaptersToUpdate = 0;

                const listInstalled = [];
                const listNonInstalled = [];
                const nowObj = new Date();
                const localTexts = {
                    'add instance':             _('add instance'),
                    'update':                   _('update'),
                    'upload':                   _('upload'),
                    'Available version:':       _('Available version:'),
                    'Active instances':         _('Active instances'),
                    'Installed version':        _('Installed version'),
                    'readme':                   _('readme'),
                    'delete adapter':           _('delete adapter'),
                    'install specific version': _('install specific version'),
                    'all':                      _('all'),
                    'Last update':              _('Last update'),
                    'Installations counter':    _('Installation counter'),
                    'today':                    _('today'),
                    'yesterday':                _('yesterday'),
                    '1 %d days ago':            _('1 %d days ago'),
                    '2 %d days ago':            _('2 %d days ago'),
                    '5 %d days ago':            _('5 %d days ago')
                };

                if (installedList) {
                    for (adapter in installedList) {
                        if (!installedList.hasOwnProperty(adapter)) continue;
                        obj = installedList[adapter];
                        if (!obj || obj.controller || adapter === 'hosts') continue;
                        listInstalled.push(adapter);
                    }
                    listInstalled.sort();
                }

                that.urls = {};
                // List of adapters for repository
                for (adapter in repository) {
                    if (!repository.hasOwnProperty(adapter)) continue;
                    if (installedList && installedList[adapter] && !installedList[adapter].versionDate) {
                        installedList[adapter].versionDate = repository[adapter].versionDate;
                    }

                    // it is not possible to install this adapter from git
                    if (!repository[adapter].nogit) {
                        that.urls[adapter] = repository[adapter].meta;
                    }
                    obj = repository[adapter];
                    if (!obj || obj.controller) continue;
                    version = '';
                    if (installedList && installedList[adapter]) continue;
                    listNonInstalled.push(adapter);
                }
                listNonInstalled.sort();

                function getVersionString(version, updatable, news, updatableError) {
                    //const span = getVersionSpan(version);
                    const color = getVersionClass(version);
                    const title = color + '\n\r' + (news || '');
                    //version = '<table style="min-width: 80px; width: 100%; text-align: center; border: 0; border-spacing: 0px;' + (news ? 'font-weight: bold;' : '') + '" cellspacing="0" cellpadding="0" class="ui-widget">' +
                    version = //'<div style="height: 100% !important;">' +
                        '<table style="cursor: alias; width: 100%; text-align: center; border: 0; border-spacing: 0;' + (news ? 'color: blue;' : '') + '" cellspacing="0" cellpadding="0" class="ui-widget">' +
                        '<tr class="' + color + 'Bg">' +
                        '<td title="' + localTexts['Available version:'] + ' ' + title + '" class="actual-version">' + version + '</td>' +
                        '<td style="border: 0; padding: 0; width: 30px" class="update-version">';
                    if (updatable) {    //xxx
                        version += '<button class="adapter-update-submit small-button m" data-adapter-name="' + adapter + '" ' + (updatableError ? ' disabled title="' + updatableError + '"' : 'title="' + localTexts['update'] + '"') + '><i class="material-icons">refresh</i></button>';
                    }
                    version += '</td></tr></table>';
                    return version;
                }

                that.tree = [];
                that.data = {};

                // list of the installed adapters
                for (const i = 0; i < listInstalled.length; i++) {
                    adapter = listInstalled[i];

                    obj = installedList ? installedList[adapter] : null;

                    if (!obj || obj.controller || adapter === 'hosts') continue;
                    let installed = '';
                    let rawInstalled = '';
                    let icon = obj.icon;
                    version = '';

                    if (repository[adapter] && repository[adapter].version) version = repository[adapter].version;

                    if (repository[adapter] && repository[adapter].extIcon) icon = repository[adapter].extIcon;

                    let _instances = 0;
                    let _enabled   = 0;
                    if (obj.version) {
                        let news = '';
                        let updatable = false;
                        let updatableError = '';

                        if (!that.main.upToDate(version, obj.version)) {
                            news = getNews(obj.version, repository[adapter]);
                            // check if version is compatible with current adapters and js-controller
                            updatable = true;
                            updatableError = checkDependencies(repository[adapter].dependencies);
                            adaptersToUpdate++;
                        }
                        // TODO: move style to class
                        installed = '<table style="min-width: 80px; text-align: center; border: 0; border-spacing: 0;" cellspacing="0" cellpadding="0" class="ui-widget">' +
                            '<tr>';

                        // Show information about installed and enabled instances
                        for (const z = 0; z < that.main.instances.length; z++) {
                            if (that.main.objects[that.main.instances[z]] &&
                                that.main.objects[that.main.instances[z]].common.name === adapter) {
                                _instances++;
                                if (that.main.objects[that.main.instances[z]].common.enabled) _enabled++;
                            }
                        }

                        if (_instances) {
                            // TODO: move style to class
                            installed += '<td style="border: 0; text-align: center; padding: 0; width: 40px">';
                            if (_enabled !== _instances) {
                                installed += '<span title="' + _ ('Installed instances') + '">' + _instances + '</span>';
                                if (_enabled) installed += ' ~ ';
                            }
                            if (_enabled) installed += '<span title="' + localTexts['Active instances'] + '" class="true">' + _enabled + '</span>';
                            installed += '</td>';
                        } else {
                            // TODO: move style to class
                            installed += '<td style="border: 0; padding: 0; width: 40px"></td>';
                        }
                        // TODO: move style to class
                        installed += '<td style="border: 0; padding: 0; width: 50px" title="' + localTexts['Installed version'] + '">' + obj.version + '</td>';
                        rawInstalled = '<span class="installed" title="' + localTexts['Installed version'] + '">' + obj.version + '</span>';

                        //tmp = installed.split('.');
                        // if (updatable) {    //xxx
                        //     //TODO
                        //     // installed += '<td style="border: 0; padding: 0; width: 30px"><button class="adapter-update-submit" data-adapter-name="' + adapter + '" ' + (updatableError ? ' disabled title="' + updatableError + '"' : 'title="' + _('update') + '"')+ '></button></td>';
                        //     // version = version.replace('class="', 'class="updateReady ');
                        //     // $('a[href="#tab-adapters"]').addClass('updateReady');
                        // } else if (that.onlyUpdatable) {
                        //     continue;
                        // }


                        // Use different pathes for installed and non installed adapters
                        icon = obj.localIcon || icon;

                        installed += '</tr></table>';
                        if (!updatable && that.onlyUpdatable) continue;
                    }
                    rawVersion = version;
                    version = getVersionString(version, updatable, news, updatableError);

                    const group = (obj.type || that.types[adapter] || 'common adapters') + '_group';
                    let desc  = (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc;
                    desc = desc || '';
                    desc += showUploadProgress(group, adapter, that.main.states['system.adapter.' + adapter + '.upload'] ? that.main.states['system.adapter.' + adapter + '.upload'].val : 0);
                    let title = obj.titleLang || obj.title;
                    title = (typeof title === 'object') ? (title[systemLang] || title.en) : title;

                    that.data[adapter] = {
                        image:      icon ? '<img onerror="this.src=\'img/info-big.png\';" src="' + icon + '" class="adapter-table-icon" />' : '',
                        icon:       icon || '',
                        stat:        repository[adapter] ? repository[adapter].stat : 0,
                        name:       adapter,
                        title:      (title || '').replace('ioBroker Visualisation - ', ''),
                        desc:       desc,
                        news:       news,
                        updatableError: updatableError,
                        keywords:   obj.keywords ? obj.keywords.join(' ') : '',
                        version:    version,
                        installed:  installed,
                        rawVersion: rawVersion,
                        instances:  _instances,
                        rawInstalled: rawInstalled,
                        versionDate: obj.versionDate,
                        updatable:  updatable,
                        bold:       obj.highlight || false,
                        install: '<button data-adapter-name="' + adapter + '" class="adapter-install-submit small-button m" title="' + localTexts['add instance'] + '" data-adapter-desc="' + desc + '"><i class="material-icons">add_circle_outline</i></button>' +
                        '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" data-adapter-url="' + (obj.readme || '') + '" class="adapter-readme-submit small-button" title="' + localTexts['readme'] + '"><i class="material-icons">help_outline</i></button>' +
                        ((that.main.config.expertMode) ? '<button data-adapter-name="' + adapter + '" class="adapter-upload-submit small-button" title="' + localTexts['upload'] + '"><i class="material-icons">file_upload</i></button>' : '') +
                        '<button ' + (installed ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" class="adapter-delete-submit small-button" title="' + localTexts['delete adapter'] + '"><i class="material-icons">delete_forever</i></button>' +
                        ((that.main.config.expertMode) ? '<button data-adapter-name="' + adapter + '" data-target="adapters-menu" class="adapter-update-custom-submit small-button" title="' + localTexts['install specific version'] + '"><i class="material-icons">add_to_photos</i></button>' : ''),
                        // platform:   obj.platform, actually there is only one platform
                        group:      group,
                        license:    obj.license || '',
                        licenseUrl: obj.licenseUrl || ''
                    };

                    if (!obj.type) console.log('"' + adapter + '": "common adapters",');
                    if (obj.type && that.types[adapter]) console.log('Adapter "' + adapter + '" has own type. Remove from admin.');

                    if (!that.isList) {
                        let iGroup = -1;
                        for (const jj = 0; jj < that.tree.length; jj++) {
                            if (that.tree[jj].key === that.data[adapter].group) {
                                iGroup = jj;
                                break;
                            }
                        }
                        if (iGroup < 0) {
                            if (!localTexts[that.data[adapter].group]) localTexts[that.data[adapter].group] = _(that.data[adapter].group);
                            that.tree.push({
                                title:    localTexts[that.data[adapter].group],
                                desc:     showUploadProgress(group),
                                key:      that.data[adapter].group,
                                folder:   true,
                                expanded: !that.isCollapsed[that.data[adapter].group],
                                children: [],
                                icon:     that.groupImages[that.data[adapter].group]
                            });
                            iGroup = that.tree.length - 1;
                        }
                        that.tree[iGroup].children.push({
                            icon:     icon,
                            title:    that.data[adapter].title || adapter,
                            key:      adapter
                        });
                    } else {
                        that.tree.push({
                            icon:     icon,
                            title:    that.data[adapter].title || adapter,
                            key:      adapter
                        });
                    }
                }
                //that.sortTree();

                if (!that.onlyInstalled && !that.onlyUpdatable) {
                    for (let i = 0; i < listNonInstalled.length; i++) {
                        adapter = listNonInstalled[i];

                        obj = repository[adapter];
                        if (!obj || obj.controller) continue;
                        version = '';
                        if (installedList && installedList[adapter]) continue;

                        if (obj && obj.version) {
                            version = obj.version;
                            rawVersion = version;
                            version = getVersionString(version);
                        }

                        const group = (obj.type || that.types[adapter] || 'common adapters') + '_group';
                        let desc = (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc;
                        desc = desc || '';
                        desc += showUploadProgress(group, adapter, that.main.states['system.adapter.' + adapter + '.upload'] ? that.main.states['system.adapter.' + adapter + '.upload'].val : 0);

                        let title = obj.titleLang || obj.title;
                        title = (typeof title === 'object') ? (title[systemLang] || title.en) : title;

                        that.data[adapter] = {
                            image:      obj.extIcon ? '<img onerror="this.src=\'img/info-big.png\';" src="' + obj.extIcon + '" class="adapter-table-icon" />' : '',
                            icon:       obj.extIcon,
                            stat:       obj.stat,
                            name:       adapter,
                            title:      (title || '').replace('ioBroker Visualisation - ', ''),
                            desc:       desc,
                            keywords:   obj.keywords ? obj.keywords.join(' ') : '',
                            rawVersion: rawVersion,
                            version:    version,
                            bold:       obj.highlight,
                            installed:  '',
                            versionDate: obj.versionDate,
                            install: '<button data-adapter-name="' + adapter + '" class="adapter-install-submit small-button" title="' + localTexts['add instance'] + '" data-adapter-desc="' + desc + '"><i class="material-icons">add_circle_outline</i></button>' +
                            '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + ' data-adapter-name="' + adapter + '" data-adapter-url="' + (obj.readme || '') + '" class="adapter-readme-submit small-button" title="' + localTexts['readme'] + '"><i class="material-icons">help_outline</i></button>' +
                            '<button data-adapter-name="' + adapter + '" class="adapter-delete-submit small-button hide" title="' + localTexts['delete adapter'] + '"><i class="material-icons">delete_forever</i></button>' +
                            ((that.main.config.expertMode) ? '<button data-adapter-name="' + adapter + '" data-target="adapters-menu" class="adapter-update-custom-submit small-button" title="' + localTexts['install specific version'] + '"><i class="material-icons">add_to_photos</i></button>' : ''),
                            // TODO do not show adapters not for this platform
                            // platform:   obj.platform, // actually there is only one platform
                            license:    obj.license    || '',
                            licenseUrl: obj.licenseUrl || '',
                            group:      group
                        };

                        if (!obj.type) console.log('"' + adapter + '": "common adapters",');
                        if (obj.type && that.types[adapter]) console.log('Adapter "' + adapter + '" has own type. Remove from admin.');

                        if (!that.isList) {
                            let igroup = -1;
                            for (const j = 0; j < that.tree.length; j++){
                                if (that.tree[j].key === that.data[adapter].group) {
                                    igroup = j;
                                    break;
                                }
                            }
                            if (igroup < 0) {
                                if (!localTexts[that.data[adapter].group]) localTexts[that.data[adapter].group] = _(that.data[adapter].group);
                                that.tree.push({
                                    title:    localTexts[that.data[adapter].group],
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
                                icon:     obj.extIcon,
                                desc:     showUploadProgress(group),
                                key:      adapter
                            });
                        } else {
                            that.tree.push({
                                icon:     obj.extIcon,
                                title:    that.data[adapter].title || adapter,
                                key:      adapter
                            });
                        }
                    }
                }

                if (that.currentOrder === 'popular' || that.currentOrder === 'updated') {
                    const akeys = Object.keys(that.data);

                    if (that.currentOrder === 'popular') {
                        akeys.sort(function (a, b) {
                            if (that.data[a].stat > that.data[b].stat) return -1;
                            if (that.data[a].stat < that.data[b].stat) return 1;
                            return 0;
                        });
                    } else if (that.currentOrder === 'updated') {
                        akeys.sort(function (a, b) {
                            if (that.data[a].versionDate && !that.data[b].versionDate) return -1;
                            if (!that.data[a].versionDate && that.data[b].versionDate) return 1;
                            if (that.data[a].versionDate > that.data[b].versionDate) return -1;
                            if (that.data[a].versionDate < that.data[b].versionDate) return 1;
                            if (a > b) return -1;
                            if (a < b) return 1;
                            return 0;
                        });
                    }
                    const newData = {};
                    for (let u = 0; u < akeys.length; u++) {
                        newData[akeys[u]] = that.data[akeys[u]];
                    }
                    that.data = newData;
                }

                // build tiles
                if (that.isTiles && (that.main.browser !== 'ie' || that.main.browserVersion > 10)) {
                    let text = '';
                    const types = [];
                    for (const a in that.data) {
                        if (!that.data.hasOwnProperty(a)) continue;
                        const ad = that.data[a];
                        if (types.indexOf(ad.group) === -1) {
                            types.push(ad.group);
                        }
//                        text += '<div class="tile class-' + ad.group + '" data-id="' + ad.name + '">';
//                        text += '   <div class="card-header">';
//                        text += '       <div class="title">' + ad.title + '</div>';
//                        if (that.currentOrder === 'popular' && ad.stat) {
//                            text += '   <div class="stat" title="' + localTexts['Installations counter'] + '">' + ad.stat + '</div>';
//                        } else if (that.currentOrder === 'updated' && ad.versionDate) {
//                            text += '   <div class="last-update" title="' + localTexts['Last update'] + '">' + getInterval(ad.versionDate, localTexts['today'], localTexts['yesterday'], localTexts['1 %d days ago'], localTexts['2 %d days ago'], localTexts['5 %d days ago'], nowObj) + '</div>';
//                        }
//                        text += '    </div>';
//                        text += '    <div class="card-body">';
//                        text += '       <img onerror="this.src=\'img/info-big.png\';" class="icon" src="' + ad.icon + '" />';
//                        text += '       <div class="desc">' + ad.desc + '</div>';
//                        text += '    </div>';
//                        text += '    <div class="card-action">';
//                        text += '       <div class="version"><table><tr><td>' + ad.version + (ad.installed ? '</td><td class="installed">' + ad.rawInstalled : '')  + '</td></tr></table></div>';
//                        text += '       <div class="buttons">' + ad.install + '</div>';
//                        text += '    </div>';
//                        text += '</div>';

                        text += '<div class="col s12 m6 l4 xl3 tile class-' + ad.group + '" data-id="' + ad.name + '">';
                        text += '   <div class="card hoverable card-adapters">';
                        text += '       <div class="card-header ' + (ad.updatable ? 'updatable' : (ad.installed ? 'installed' : '')) + '"></div>';
                        text += '       <div class="card-content">';
                        text += '           <img onerror="this.src=\'img/info-big.png\';" class="card-profile-image" src="' + ad.icon + '">';
                        text += '           <span class="card-title grey-text text-darken-4">' + ad.title + '</span>';
                        text += '           <a title="info" class="btn-floating activator btnUp blue lighten-2 z-depth-3"><i class="material-icons">more_vert</i></a>';
                        text += '           <ul class="ver">';
                        text += '               <li>' + localTexts['Available version:']  + ' <span class="data ' + (ad.updatable ? 'updatable' : '') + '" ' + (ad.news ? ' title="' + ad.news + '"' : '') + '>' + ad.rawVersion + '</span>' +
                            (ad.updatable ? '<button class="adapter-update-submit small-button" data-adapter-name="' + a + '" ' + (updatableError ? ' disabled title="' + ad.updatableError + '"' : 'title="' + localTexts['update'] + '"') + '><i class="material-icons">refresh</i></button>' : '') +
                            '</li>';
                        if (ad.installed) {
                            text += '           <li>' + localTexts['Installed version'] + ': <span class="data">'+ ad.rawInstalled + '</span></li>';
                        }
                        if (ad.instances) {
                            text += '           <li>' + _('Installed instances') + ': <span class="data">' + ad.instances + '</span></li>';
                        }
                        text += '           </ul>';
                        text += '       </div>';
                        text += '       <div class="footer right-align"></div>';
                        text += '       <div class="card-reveal">';
                        text += '           <i class="card-title material-icons right">close</i>';
                        text += '           <p>' + ad.desc + '</p>';
                        text += '           <div class="card-reveal-buttons">';
                        text += ad.install;
                        text += '           </div>';
                        text += '       </div>';

                        if (that.currentOrder === 'popular' && ad.stat) {
                            text += '   <div class="stat" title="' + localTexts['Installations counter'] + '">' + ad.stat + '</div>';
                        } else if (that.currentOrder === 'updated' && ad.versionDate) {
                            text += '   <div class="last-update" title="' + localTexts['Last update'] + '">' + getInterval(ad.versionDate, localTexts['today'], localTexts['yesterday'], localTexts['1 %d days ago'], localTexts['2 %d days ago'], localTexts['5 %d days ago'], nowObj) + '</div>';
                        }


                        text += '   </div>';
                        text += '</div>';
                    }


                    // Add filtered out tile
                    text += '<div class="col s12 m6 l4 xl3 filtered-out">';
                    text += '   <div class="card hoverable card-adapters">';
                    text += '       <div class="card-header"></div>';
                    text += '       <div class="card-content">';
                    //text += '           <img onerror="this.src=\'img/info-big.png\';" class="card-profile-image" src="' + ad.icon + '">';
                    text += '           <span class="card-title grey-text text-darken-4">' + _('Filtered out') + '</span>';
                    text += '       </div>';
                    text += '       <div class="footer right-align"></div>';
                    text += '   </div>';
                    text += '</div>';

                    that.$tiles.html(text);
                    // init buttons
                    for (const b in that.data) {
                        if (that.data.hasOwnProperty(b)) {
                            that.initButtons(b);
                        }
                    }

                    let tTypes = '<li class="main-toolbar-table-types-item" data-type=""><a>' + localTexts['all'] + '</a></li>\n';
                    for (let g = 0; g < types.length; g++) {
                        tTypes += '<li class="main-toolbar-table-types-item" data-type="' + types[g] + '"><a>' + _(types[g]) + '</a></li>\n';
                    }
                    const $types = that.$tab.find('#main-toolbar-table-types');
                    $types.html(tTypes);
                    $types.find('.main-toolbar-table-types-item').show().off('click').on('click', function () {
                        that.currentType = $(this).data('type') || '';
                        filterTiles();
                        that.$tab.find('#main-toolbar-table-types-btn').html(_(that.currentType || 'all'));
                        that.main.saveConfig('adaptersCurrentType', that.currentType);
                    });
                    if (that.currentType && !localTexts[that.currentType]) localTexts[that.currentType] = _(that.currentType);
                    that.$tab.find('#main-toolbar-table-types-btn').html(localTexts[that.currentType || 'all']).dropdown({
                        constrainWidth: false, // Does not change width of dropdown to that of the activator
                        // hover: true, // Activate on hover
                        gutter: 0
                    });

                    $types = that.$tab.find('#main-toolbar-table-order');
                    $types.find('.main-toolbar-table-order-item').off('click').on('click', function () {
                        that.currentOrder = $(this).data('type') || '';
                        //filterTiles();
                        that.$tab.find('#main-toolbar-table-order-btn').html(_(that.currentOrder || 'a-z'));
                        that.main.saveConfig('adaptersCurrentOrder', that.currentOrder);
                        that._postInit();
                    });
                    if (that.currentOrder && !localTexts[that.currentOrder]) localTexts[that.currentOrder] = _(that.currentOrder);
                    that.$tab.find('#main-toolbar-table-order-btn').show().html(localTexts[that.currentOrder || 'a-z']).dropdown({
                        constrainWidth: false, // Does not change width of dropdown to that of the activator
                        // hover: true, // Activate on hover
                        gutter: 0
                    });

                    filterTiles();
                } else {
                    that.$tab.find('#main-toolbar-table-types-btn').hide();
                    that.$tab.find('#main-toolbar-table-order-btn').hide();
                    // build tree
                    that.$grid.fancytree('getTree').reload(that.tree);
                    that.$grid.find('.fancytree-icon').each(function () {
                        if ($(this).attr('src')) {
                            $(this).css({width: 18, height: 18});
                        }

                        $(this).on('hover', function () {
                            const text = '<div class="icon-large" style="' +
                                'left: ' + Math.round($(this).position().left + $(this).width() + 5) + 'px;"><img onerror="this.src=\'img/info-big.png\';" src="' + $(this).attr('src') + '"/></div>';
                            const $big = $(text);
                            $big.insertAfter($(this));
                            $(this).data('big', $big[0]);
                            const h = parseFloat($big.height());
                            let top = Math.round($(this).position().top - ((h - parseFloat($(this).height())) / 2));
                            if (h + top > (window.innerHeight || document.documentElement.clientHeight)) {
                                top = (window.innerHeight || document.documentElement.clientHeight) - h;
                            }
                            $big.css({top: top});

                        }, function () {
                            const big = $(this).data('big');
                            $(big).remove();
                            $(this).data('big', undefined);
                        });
                    });

                    if (that.currentFilter) {
                        that.$grid.fancytree('getTree').filterNodes(customFilter, false);
                    }

                    that.sortTree();
                    that.enableColResize();
                    const classes = [
                        'tab-adapters-table-name',
                        'tab-adapters-table-description',
                        'tab-adapters-table-keywords',
                        'tab-adapters-table-installed',
                        'tab-adapters-table-available',
                        'tab-adapters-table-license',
                        'tab-adapters-table-install'
                    ];
                    that.$grid.find('tbody tr').each(function () {
                        const i = 0;
                        $(this).find('td').each(function () {
                            $(this).addClass(classes[i]);
                            i++;
                        });
                    })
                }
                that.$tab.find('.grid-main-div').removeClass('order-a-z order-popular order-updated').addClass(that.currentOrder ? 'order-' + that.currentOrder : '');
                that.$tab.find('.process-adapters').hide();
                that.updateCounter(adaptersToUpdate);
            });
        } else {
            this.enableColResize();
        }
        this.restoreScroll();
    };
    this.saveScroll         = function () {
        this.scrollTop = this.$tab.find('.grid-main-div').scrollTop();
    };
    this.restoreScroll         = function () {
        if (this.scrollTop) {
            this.$tab.find('.grid-main-div').scrollTop(this.scrollTop);
        }
    };

    this.updateCounter = function (counter) {
        if (counter === undefined) {
            this.getAdaptersInfo(this.main.currentHost, false, false, function (repository, installedList) {
                let adaptersToUpdate = 0;

                for (const adapter in installedList) {
                    if (!installedList.hasOwnProperty(adapter)) continue;
                    const obj = installedList ? installedList[adapter] : null;
                    if (!obj || obj.controller || adapter === 'hosts') continue;

                    let version = '';
                    if (repository[adapter] && repository[adapter].version) {
                        version = repository[adapter].version;
                    }

                    if (obj.version && !that.main.upToDate(version, obj.version)) {
                        adaptersToUpdate++;
                    }
                }
                that.updateCounter(adaptersToUpdate);
            });
        } else if (counter) {
            const $updates = $('#updates-for-adapters');
            if ($updates.length) {
                $updates.text(counter);
            } else {
                $('<span id="updates-for-adapters" title="' + _('updates') + '" class="new badge updates-for-adapters" data-badge-caption="">' + counter + '</span>').appendTo('.admin-sidemenu-items[data-tab="tab-adapters"] a');
            }
        } else {
            $('#updates-for-adapters').remove();
        }
    };

    // ----------------------------- Adapters show and Edit ------------------------------------------------
    this.init = function (update, updateRepo) {
        if (this.inited && !update) {
            return;
        }

        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init(update, updateRepo);
            }, 250);
            return;
        }

        // update info
        // Required is list of hosts and repository (done in getAdaptersInfo)
        if (!this.inited) {
            this.inited = true;
            this.main.subscribeObjects('system.host.*');
            this.main.subscribeStates('system.host.*');
        }
        this.main.tabs.hosts.getHosts(function () {
            that._postInit(update, updateRepo);
        });
    };

    this.destroy = function () {
        if (this.inited) {
            this.saveScroll();
            this.inited = false;
            this.main.unsubscribeObjects('system.host.*');
            this.main.unsubscribeStates('system.host.*');
        }
    };

    function showAddInstanceDialog(adapter, desc, callback) {
        if (that.main.tabs.hosts.list.length <= 1 && !that.main.config.expertMode) {
            return callback(true, that.main.currentHost, '');
        }

        const $dialogAddInstance = $('#dialog-add-instance');
        $dialogAddInstance.find('.dialog-add-instance-name').html(adapter);
        $dialogAddInstance.find('.dialog-add-description').html(desc);

        // fill the hosts
        let text = '';
        for (const h = 0; h < that.main.tabs.hosts.list.length; h++) {
            const host = that.main.tabs.hosts.list[h];
            text += '<option ' + (host.name === that.main.currentHost ? 'selected' : '') + ' value="' + host.name + '">' + host.name + '</option>';
        }

        if (that.main.tabs.hosts.list.length <= 1) {
            $dialogAddInstance.find('.dialog-add-instance-host').addClass('disabled').prop('disabled', true);
        } else {
            $dialogAddInstance.find('.dialog-add-instance-host').removeClass('disabled').prop('disabled', false);
        }
        $dialogAddInstance.find('.dialog-add-instance-host').html(text).select();

        // find free instance numbers
        let min = -1;
        const used = [];
        for (const i = 0; i < that.main.tabs.instances.list.length; i++) {
            const parts = that.main.tabs.instances.list[i].split('.');
            if (parts[parts.length - 2] === adapter) {
                const index = parseInt(parts[parts.length - 1], 10);
                used.push(index);
                if (index > min) {
                    min = index;
                }
            }
        }
        min += 10;
        text = '<option selected value="">' + _('auto') + '</option>';
        for (const m = 0; m < min; m++) {
            if (used.indexOf(m) !== -1) continue;
            text += '<option value="' + m + '">' + m + '</option>';
        }
        $dialogAddInstance.find('.dialog-add-instance-number').html(text).select();
        $dialogAddInstance.find('.dialog-add-install-btn').off('click').on('click', function (e) {
            if (callback) {
                callback(true, $dialogAddInstance.find('.dialog-add-instance-host').val(), $dialogAddInstance.find('.dialog-add-instance-number').val());
                callback = null;
            }
            $dialogAddInstance.find('.dialog-add-cancel-btn').off('click');
            $dialogAddInstance.find('.dialog-add-instance-number').off('click');
        });

        $dialogAddInstance.find('.dialog-add-cancel-btn').off('click').on('click', function (e) {
            if (callback) {
                callback(false);
                callback = null;
            }
            $dialogAddInstance.find('.dialog-add-cancel-btn').off('click');
            $dialogAddInstance.find('.dialog-add-instance-number').off('click');
        });
        $dialogAddInstance.modal({
            dismissible: false,
            complete: function () {
                $dialogAddInstance.find('.dialog-add-instance-name').html('');
            }
        }).modal('open');
    }

    function showLicenseDialog(adapter, callback) {
        const $dialogLicense = $('#dialog-license');
        // Is adapter installed
        if (that.data[adapter].installed || !that.data[adapter].licenseUrl) {
            callback(true);
            return;
        }

        let timeout = setTimeout(function () {
            timeout = null;
            callback(true);
        }, 10000);

        if (!that.data[adapter].licenseUrl) {
            that.data[adapter].licenseUrl = 'https://raw.githubusercontent.com/ioBroker/ioBroker.' + (that.data[adapter].name || adapter) + '/master/LICENSE';
        }
        if (typeof that.data[adapter].licenseUrl === 'object') {
            that.data[adapter].licenseUrl = that.data[adapter].licenseUrl[systemLang] || that.data[adapter].licenseUrl.en;
        }
        // Workaround
        // https://github.com/ioBroker/ioBroker.vis/blob/master/LICENSE =>
        // https://raw.githubusercontent.com/ioBroker/ioBroker.vis/master/LICENSE
        if (that.data[adapter].licenseUrl.indexOf('github.com') !== -1) {
            that.data[adapter].licenseUrl = that.data[adapter].licenseUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }

        that.main.socket.emit('httpGet', that.data[adapter].licenseUrl, function (error, response, body) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;

                if (!error && body) {
                    $dialogLicense.css({'z-index': 200});
                    body = body.toString().replace(/\r\n/g, '<br>');
                    body = body.replace(/\n/g, '<br>');
                    $dialogLicense.find('.license_text').html(body);
                    $dialogLicense.find('.license_agreement_name').text(_(' for %s', adapter));

                    $dialogLicense.modal({
                        dismissible: false,
                        complete: function () {
                            $dialogLicense.find('.license_text').html('');
                        }
                    }).modal('open');

                    $dialogLicense.find('.license_agree').off('click').on('click', function (e) {
                        if (callback) {
                            callback(true);
                            callback = null;
                        }
                        $dialogLicense.find('.license_agree').off('click');
                        $dialogLicense.find('.license_non_agree').off('click');
                    });

                    $dialogLicense.find('.license_non_agree').off('click').on('click', function (e) {
                        if (callback) {
                            callback(false);
                            callback = null;
                        }
                        $dialogLicense.find('.license_agree').off('click');
                        $dialogLicense.find('.license_non_agree').off('click');
                    });
                } else {
                    callback && callback(true);
                    callback = null;
                }
            }
        });
    }

    this.initButtons = function (adapter) {
        this.$tab.find('.adapter-install-submit[data-adapter-name="' + adapter + '"]').off('click').on('click', function () {
            const adapter = $(this).attr('data-adapter-name');
            const desc = $(this).attr('data-adapter-desc');

            // show config dialog
            showAddInstanceDialog(adapter, desc, function (result, host, index) {
                if (!result) return;

                that.getAdaptersInfo(host, false, false, function (repo, installed) {
                    let obj = repo[adapter];

                    obj = obj || installed[adapter];

                    if (!obj) {
                        return;
                    }

                    if (obj.license && obj.license !== 'MIT') {
                        // Show license dialog!
                        showLicenseDialog(adapter, isAgree =>
                            isAgree && that.main.cmdExec(null, 'add ' + adapter + ' ' + index + ' --host ' + host, exitCode =>
                                !exitCode && that._postInit(true)));
                    } else {
                        that.main.cmdExec(null, 'add ' + adapter + ' ' + index + ' --host ' + host, exitCode =>
                            !exitCode && that._postInit(true));
                    }
                });
            });
        });

        this.$tab.find('.adapter-delete-submit[data-adapter-name="' + adapter + '"]').off('click').on('click', function () {
            const name = $(this).attr('data-adapter-name');
            that.main.confirmMessage(_('Are you sure you want to delete adapter %s?', name), _('Please confirm'), 'help', function (result) {
                if (result) {
                    that.main.cmdExec(null, 'del ' + name, function (exitCode) {
                        if (!exitCode) that._postInit(true);
                    });
                }
            });
        });

        this.$tab.find('.adapter-readme-submit[data-adapter-name="' + adapter + '"]').off('click').on('click', function () {
            that.main.navigate({
                tab:    'adapters',
                dialog: 'readme',
                params:  $(this).data('adapter-name')
            });
        });

        this.$tab.find('.adapter-update-submit[data-adapter-name="' + adapter + '"]').off('click').on('click', function () {
            const aName = $(this).attr('data-adapter-name');
            if (aName === 'admin') that.main.waitForRestart = true;

            that.main.cmdExec(null, 'upgrade ' + aName, function (exitCode) {
                if (!exitCode) that._postInit(true);
            });
        });

        this.$tab.find('.adapter-upload-submit[data-adapter-name="' + adapter + '"]').off('click').on('click', function () {
            const aName = $(this).attr('data-adapter-name');

            that.main.cmdExec(null, 'upload ' + aName, function (exitCode) {
                if (!exitCode) that._postInit(true);
            });
        });

        const $button = this.$tab.find('.adapter-update-custom-submit[data-adapter-name="' + adapter + '"]');
        $button.off('click').on('click', function () {
            const versions = [];
            if (that.main.objects['system.adapter.' + adapter].common.news) {
                const news = that.main.objects['system.adapter.' + adapter].common.news;
                for (const id in news) {
                    if (news.hasOwnProperty(id)) {
                        versions.push(id);
                    }
                }
            } else {
                versions.push(that.main.objects['system.adapter.' + adapter].common.version);
            }
            const menu = '<div class="collection">';
            for (const v = 0; v < versions.length; v++) {
                const nnews = (news[versions[v]] ? news[versions[v]][systemLang] || news[versions[v]].en : '');
                menu += '<a data-version="' + versions[v] + '" data-position="left" data-delay="50" title="' + nnews + '" data-adapter-name="' + $(this).data('adapter-name') + '" class="collection-item adapters-versions-link tooltipped"><span class="adapters-versions-link-version">' + versions[v] + '</span> - <div class="adapters-versions-link-history">' + nnews + '</div></a>';
            }
            menu += '</div>';

            const $adaptersMenu = $('#adapters-menu');
            if (!$adaptersMenu.length) {
                //$adaptersMenu = $('<div id="adapters-menu" class="dropdown-content m"></div>');
                $adaptersMenu = $('<div id="adapters-menu" class="modal modal-fixed-footer"><div class="modal-content">' +
                    '<h4>Modal Header</h4><p></p></div><div class="modal-footer">' +
                    '<a class="modal-action modal-close waves-effect waves-green btn-flat ">' + _('Close') + '</a></div></div>');
                $adaptersMenu.appendTo($('.materialize-dialogs').first());
                $adaptersMenu.modal();
            }
            $adaptersMenu.data('trigger', this);

            $adaptersMenu.find('p').html(menu);
            $adaptersMenu.find('h4').html(_('Versions of %s', adapter));

            $adaptersMenu.find('.adapters-versions-link').off('click').on('click', function () {
                //if ($(this).data('link')) window.open($(this).data('link'), $(this).data('instance-id'));
                $adaptersMenu.modal('close');
                const adapter = $(this).data('adapter-name');
                const version = $(this).data('version');
                if (version && adapter) {
                    that.main.cmdExec(null, 'upgrade ' + adapter + '@' + version, function (exitCode) {
                        if (!exitCode) that._postInit(true);
                    });
                }
            });

            /*$(this).dropdown({
                onCloseEnd: function () {
                    const $adaptersMenu = $('#adapters-menu');
                    const trigger = $adaptersMenu.data('trigger');
                    $(trigger).dropdown('close').dropdown('destroy');
                    $adaptersMenu.data('trigger', null).hide();
                    $adaptersMenu.remove();
                }
            }).dropdown('open');*/
            $adaptersMenu.modal('open');


            // does not work... must be fixed.
            //$adaptersMenu.find('.tooltipped').tooltip();
        });

        if (!that.main.objects['system.adapter.' + adapter]) {
            $button.hide();//addClass('disabled');
        }
    };

    this.objectChange = function (id, obj) {
        // Update Adapter Table
        if (id.match(/^system\.adapter\.[a-zA-Z0-9-_]+$/)) {
            if (obj) {
                if (this.list.indexOf(id) === -1) this.list.push(id);
            } else {
                const j = this.list.indexOf(id);
                if (j !== -1) {
                    this.list.splice(j, 1);
                }
            }

            if (typeof this.$grid !== 'undefined' && this.$grid[0]._isInited) {
                this.init(true);
            }
        }
    };

    function showUploadProgress(group, adapter, percent) {
        let text = '';
        let opened;
        if (adapter || typeof group === 'string') {
            if (adapter) {
               // text += '<div class="adapter-upload-progress" data-adapter-name="' + adapter + '"';
            } else {
                text += '<div class="group-upload-progress"';
            }
            //text += ' data-adapter-group="' + group + '" style="position: absolute; width: 100%; height: 100%; opacity: ' + (percent ? 0.7 : 0) + '; top: 0; left: 0">';
            opened = true;
        } else {
            percent = group;
            group = null;
        }
        //percent = 80;
        if (percent) {
            text +=
                '<table style="height: 3px; " title="' + _('Upload') + ' ' + percent + '%" class="no-space" style="width:100%; height: 100%; opacity: 0.7">' +
                    '<tr style="height: 100%" class="no-space">' +
                        '<td class="no-space" style="width:' + percent + '%;background: blue"></td>' +
                        '<td style="width:' + (100 - percent) + '%;opacity: 0.1" class="no-space"></td>' +
                    '</tr>' +
                '</table>'
            ;
        }
        //text += percent ? '<table title="' + _('Upload') + ' ' + percent + '%" class="no-space" style="width:100%; height: 100%; opacity: 0.7"><tr style="height: 100%" class="no-space"><td class="no-space" style="width:' + percent + '%;background: blue"></td><td style="width:' + (100 - percent) + '%;opacity: 0.1" class="no-space"></td></tr></table>' : '';

        if (opened) {
            //text += '</div>';
        }
        return text;
    }

    this.stateChange = function (id, state) {
        if (id && state) {
            const adapter = id.match(/^system\.adapter\.([\w\d-]+)\.upload$/);
            if (adapter) {
                const $adapter = this.$tab.find('.adapter-upload-progress[data-adapter-name="' + adapter[1] + '"]');
                const text = showUploadProgress(state.val);
                $adapter.html(text).css({opacity: state.val ? 0.7 : 0});
                this.$tab.find('.group-upload-progress[data-adapter-group="' + $adapter.data('adapter-group') + '"]').html(text).css({opacity: state.val ? 0.7 : 0});
            }
        }
    };
}
