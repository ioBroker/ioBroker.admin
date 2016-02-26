function Hosts(main) {
    var that      = this;
    this.main     =   main;
    this.list     = [];
    this.$grid    = $('#grid-hosts');


    this.prepare = function () {
        that.$grid.jqGrid({
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
            loadComplete: function () {
                that.initButtons();
            },
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

        $("#load_grid-hosts").show();
    };

    // ----------------------------- Hosts show and Edit ------------------------------------------------
    this.initList = function (isUpdate) {

        if (!that.main.objectsLoaded) {
            setTimeout(function () {
                that.initList(isUpdate);
            }, 250);
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
            for (j = 0; j < that.list.length; j++) {
                if (that.list[j] == myOpts[i].value) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                selHosts.remove(i);
            }
        }

        for (i = 0; i < that.list.length; i++) {
            found = false;
            for (j = 0; j < myOpts.length; j++) {
                if (that.list[i].name == myOpts[j].value) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                $selHosts.append('<option value="' + that.list[i].name + '">' + that.list[i].name + '</option>');
            }
        }
        if ($selHosts.val() != that.main.currentHost) {
            that.main.currentHost = $selHosts.val();
            that.main.tabs.adapters.init(true);
        }
        $selHosts.unbind('change').change(function () {
            if (!that.main.states['system.host.' + $(this).val() + '.alive'] ||
                !that.main.states['system.host.' + $(this).val() + '.alive'].val) {
                that.main.showMessage(_('Host %s is offline', $(this).val()));
                $(this).val(that.main.currentHost);
                return;
            }

            that.main.currentHost = $(this).val();

            that.main.tabs.adapters.init(true);
        });
        that.init();
    };
    
    this.initButtons = function () {

        $('.host-update-submit').button({icons: {primary: 'ui-icon-refresh'}}).unbind('click').on('click', function () {
            that.main.cmdExec($(this).attr('data-host-name'), 'upgrade self', function (exitCode) {
                if (!exitCode) that.init(true);
            });
        });

        $('.host-restart-submit').button({icons: {primary: 'ui-icon-refresh'}, text: false}).css({width: 22, height: 18}).unbind('click').on('click', function () {
            main.waitForRestart = true;
            main.cmdExec($(this).attr('data-host-name'), '_restart');
        });
    };
    
    this.init = function(update, updateRepo, callback) {

        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init(update, updateRepo, callback)
            }, 250);
            return;
        }

        if (typeof that.$grid !== 'undefined' && (!that.$grid[0]._isInited || update)) {
            $('a[href="#tab-hosts"]').removeClass('updateReady');

            that.$grid.jqGrid('clearGridData');
            $("#load_grid-hosts").show();

            for (var i = 0; i < that.list.length; i++) {
                var obj = main.objects[that.list[i].id];

                that.$grid.jqGrid('addRowData', 'host_' + that.list[i].id.replace(/ /g, '_'), {
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
            that.$grid.trigger('reloadGrid');

            that.main.tabs.adapters.getAdaptersInfo(that.main.currentHost, update, updateRepo, function (repository, installedList) {
                var data  = that.$grid.jqGrid('getGridParam', 'data');
                var index = that.$grid.jqGrid('getGridParam', '_index');

                that.$grid[0]._isInited = true;
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
                that.$grid.trigger('reloadGrid');

                that.initButtons();
                if (callback) callback();
            });
        }
    };
    
    this.resize = function (width, height) {
        this.$grid.setGridHeight(height - 150).setGridWidth(width - 20);
    };

    this.objectChange = function (id, obj) {
        // Update hosts
        if (id.match(/^system\.host\.[-\w]+$/)) {
            var found = false;
            for (i = 0; i < this.list.length; i++) {
                if (this.list[i].id == id) {
                    found = true;
                    break;
                }
            }

            if (obj) {
                if (!found) this.list.push({id: id, address: obj.common.address ? obj.common.address[0]: '', name: obj.common.name});
            } else {
                if (found) this.list.splice(i, 1);
            }
            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
            }
            this.updateTimer = setTimeout(function () {
                that.updateTimer = null;
                that.init(true);
                that.initList(true);
            }, 200);
        }
    };
}

