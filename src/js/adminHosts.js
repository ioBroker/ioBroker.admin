function Hosts(main) {
    'use strict';

    var that      = this;
    this.main     = main;
    this.list     = [];
    this.$tab     = $('#tab-hosts');
    this.$grid    = this.$tab.find('#grid-hosts');
    this.inited   = false;

    this.prepare  = function () {
        this.$tab.find('.btn-reload')
            .attr('title', _('Update'))
            .on('click', function () {
                that.init();
            });

        this.$tab.find('.filter-clear').on('click', function () {
            that.$tab.find('.filter-input').val('').trigger('change');
        });

        var $hostsFilter = that.$tab.find('.filter-input');
        $hostsFilter.on('change', function () {
            var filter = $(this).val();
            if (filter) {
                $(this).addClass('input-not-empty');
                that.$tab.find('.filter-clear').show();
            } else {
                that.$tab.find('.filter-clear').hide();
                $(this).removeClass('input-not-empty');
            }

            that.main.saveConfig('hostsFilter', filter);
            applyFilter(filter);
        }).on('keyup', function () {
            if (that.filterTimeout) clearTimeout(that.filterTimeout);
            that.filterTimeout = setTimeout(function () {
                that.$tab.find('.filter-input').trigger('change');
            }, 300);
        });

        if (that.main.config.hostsFilter && that.main.config.hostsFilter[0] !== '{') {
            $hostsFilter.val(that.main.config.hostsFilter).addClass('input-not-empty');
            that.$tab.find('.filter-clear').show();
        } else {
            that.$tab.find('.filter-clear').hide();
        }
    };

    // ----------------------------- Hosts show and Edit ------------------------------------------------
    this.initButtons = function (id) {
        var selector = id ? '[data-host-id="' + id + '"]' : '';

        $('.host-update-submit' + selector).off('click').on('click', function () {
            that.main.cmdExec($(this).attr('data-host-name'), 'upgrade self', function (exitCode) {
                if (!exitCode) that.init();
            });
        });

        $('.host-restart-submit' + selector).off('click').on('click', function () {
            that.main.waitForRestart = true;
            that.main.cmdExec($(this).attr('data-host-name'), '_restart');
        });

        $('.host-update-hint-submit' + selector).off('click').on('click', function () {
            var infoTimeout = setTimeout(function () {
                showUpdateInfo();
                infoTimeout = null;
            }, 1000);

            that.main.socket.emit('sendToHost', $(this).attr('data-host-name'), 'getLocationOnDisk', null, function (data) {
                if (infoTimeout) clearTimeout(infoTimeout);
                infoTimeout = null;
                showUpdateInfo(data);
            });
        });

    };

    function showUpdateInfo(data) {
        var $dialog = $('#dialog-host-update');
        if (data) {
            var path = data.path;
            path = path.replace(/\\/g, '/');
            var parts = path.split('/');
            parts.pop(); // js-controller
            parts.pop(); // node_modules

            if (data.platform === 'linux' || data.platform === 'darwin' || data.platform === 'freebsd' || data.platform === 'lin') {
                // linux
                $dialog.find('#dialog-host-update-instructions').val('cd ' + parts.join('/') + '\nsudo iobroker stop\nsudo iobroker update\nsudo iobroker upgrade self\nsudo iobroker start')
            } else {
                // windows
                $dialog.find('#dialog-host-update-instructions').val('cd ' + parts.join('\\') + '\niobroker stop\niobroker update\niobroker upgrade self\niobroker start')
            }
        } else {
            $dialog.find('#dialog-host-update-instructions').val('cd /opt/iobroker\nsudo iobroker stop\nsudo iobroker update\nsudo iobroker upgrade self\nsudo iobroker start')
        }

        if (!$dialog.data('inited')) {
            $dialog.data('inited', true);
            $dialog.modal();
        }
        $dialog.modal('open');
    }

    function applyFilter(filter) {
        filter = (filter || '').toLowerCase().trim();

        if (!filter) {
            $('.hosts-host').show();
        } else {
            $('.hosts-host').each(function () {
                var $this = $(this);
                var found = false;
                $this.find('td').each(function () {
                    var text = $(this).text();
                    if (text.toLowerCase().indexOf(filter) !== -1) {
                        found = true;
                        return false;
                    }
                });
                if (!found) {
                    $this.hide();
                } else {
                    $this.show();
                }
            });
        }
    }

    function showOneHost(index) {
        var obj   = that.main.objects[that.list[index].id];
        var alive = that.main.states[obj._id + '.alive'] && that.main.states[obj._id + '.alive'].val && that.main.states[obj._id + '.alive'].val !== 'null';
        obj.common = obj.common || {};
        obj.native = obj.native || {};

        var text = '<tr class="hosts-host " data-host-id="' + obj._id + '">';
        //LED
        text += '<td><div class="hosts-led ' + (alive ? 'led-green' : 'led-red') + '" data-host-id="' + obj._id + '"></div></td>';
        // name
        text += '<td class="hosts-name" style="font-weight: bold">' + obj.common.hostname +
                '<button class="small-button host-restart-submit" style="float: right; ' + (alive ? '' : 'display: none') + '" data-host-id="' + obj._id + '" title="' + _('restart') + '"><i class="material-icons">power_settings_new</i></button></td>' +
            + '</td>';
        // type
        text += '<td>' + obj.common.type + '</td>';
        var title = obj.common.titleLang || obj.common.title;
        if (typeof title === 'object') {
            title = title[systemLang] || title.en;
        }
        // description
        text += '<td>' + title + '</td>';
        // platform
        // text += '<td>' + obj.common.platform + '</td>'; // actually only one platform
        // OS
        text += '<td>' + (obj.native.os ? obj.native.os.platform : _('unknown')) + '</td>';
        // Available
        text += '<td><span data-host-id="' + obj._id + '" data-type="' + obj.common.type + '" class="hosts-version-available"></span>' +
            '<button class="small-button host-update-submit"      data-host-name="' + obj.common.hostname + '" style="display: none; float: right; opacity: 0;" title="' + _('update') + '"><i class="material-icons">refresh</i></button>' +
            '<button class="small-button host-update-hint-submit" data-host-name="' + obj.common.hostname + '" style="display: none; float: right"              title="' + _('update') + '"><i class="material-icons">refresh</i></button>' +
            '</td>';

        // installed
        text += '<td class="hosts-version-installed" data-host-id="' + obj._id + '">' + obj.common.installedVersion + '</td>';

        // event rates
        if (that.main.states[obj._id + '.inputCount']) {
            text += '<td style="text-align: center"><span title="in" data-host-id="' + obj._id + '" class="host-in">&#x21E5;' + that.main.states[obj._id + '.inputCount'].val + '</span> / <span title="out" data-host-id="' + obj._id + '"  class="host-out">&#x21A6;' + that.main.states[obj._id + '.outputCount'].val + '</span></td>';
        } else {
            text += '<td style="text-align: center"><span title="in" data-host-id="' + obj._id + '" class="host-in"></span> / <span title="out" data-host-id="' + obj._id + '" class="host-out"></span></td>';
        }

        text += '</tr>';

        return text;
    }

    function showHosts() {
        var text = '';
        for (var i = 0; i < that.list.length; i++) {
            text += showOneHost(i);
        }
        that.$grid.html(text);
    }

    this.updateCounter = function (counter) {
        if (counter === undefined) {
            this.main.tabs.adapters.getAdaptersInfo(this.main.currentHost, false, false, function (repository, installedList) {
                var hostsToUpdate = 0;
                if (!installedList || !installedList.hosts) return;

                for (var id in installedList.hosts) {
                    if (!installedList.hosts.hasOwnProperty(id)) continue;
                    var obj = that.main.objects['system.host.' + id];
                    if (!obj || !obj.common) continue;
                    var installedVersion = obj.common.installedVersion;
                    var availableVersion = obj.common ? (repository && repository[obj.common.type] ? repository[obj.common.type].version : '') : '';

                    if (installedVersion && availableVersion && !that.main.upToDate(availableVersion, installedVersion)) {
                        id = 'system.host.' + id.replace(/\s/g, '_');
                        if (that.main.states[id + '.alive'] && that.main.states[id + '.alive'].val && that.main.states[id + '.alive'].val !== 'null') {
                            hostsToUpdate++;
                        }
                    }
                }

                that.updateCounter(hostsToUpdate);
            });
        } else if (counter) {
            var $updates = $('#updates-for-hosts');
            if ($updates.length) {
                $updates.text(counter);
            } else {
                $('<span id="updates-for-hosts" title="' + _('updates') + '" class="new badge updates-for-hosts" data-badge-caption="">' + counter + '</span>').appendTo('.admin-sidemenu-items[data-tab="tab-hosts"] a');
            }
        } else {
            $('#updates-for-hosts').remove();
        }
    };

    this._postInit = function () {
        if (typeof that.$grid !== 'undefined') {
            showHosts();
            applyFilter($('#hosts-filter').val());

            var timer = setTimeout(function () {
                console.warn('Timeout for repository');
                timer = null;
                that.initButtons();
            }, 2000);

            var host = that.main.currentHost;
            if (!host) {
                // find alive host
                for (var i = 0; i < that.list.length; i++) {
                    if (that.main.states[that.list[i].id + '.alive'] && that.main.states[that.list[i].id + '.alive'].val) {
                        host = that.list[i].id;
                        break;
                    }
                }
            }

            that.main.tabs.adapters.getAdaptersInfo(host, true, false, function (repository, installedList) {
                if (!installedList || !installedList.hosts) return;

                for (var id in installedList.hosts) {
                    if (!installedList.hosts.hasOwnProperty(id)) continue;
                    var obj = that.main.objects['system.host.' + id];
                    var installed = installedList.hosts[id].version;
                    if (installed !== installedList.hosts[id].runningVersion)   installed += '(' + _('Running: ') + installedList.hosts[id].runningVersion + ')';
                    if (!installed && obj.common && obj.common.installedVersion) installed = obj.common.installedVersion;

                    id = 'system.host.' + id.replace(/ /g, '_');
                    $('.hosts-version-installed[data-host-id="' + id + '"]').html(installed);
                }

                $('.hosts-host').each(function () {
                    var id = $(this).data('host-id');
                    var obj = that.main.objects[id];
                    var installedVersion = obj.common.installedVersion;
                    var availableVersion = obj.common ? (repository && repository[obj.common.type] ? repository[obj.common.type].version : '') : '';
                    if (installedVersion && availableVersion) {
                        if (!that.main.upToDate(availableVersion, installedVersion)) {
                            // show button
                            if (that.main.states[id + '.alive'] && that.main.states[id + '.alive'].val && that.main.states[id + '.alive'].val !== 'null') {
                                $(this).find('.host-update-submit').show();
                                $(this).find('.host-update-hint-submit').show();
                                $(this).find('.hosts-version-installed').addClass('updateReady');
                            }
                        }
                    }
                    if (availableVersion) {
                        $(this).find('.hosts-version-available').html(availableVersion);
                    }
                });

                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                that.initButtons();
            });
        }
    };

    this.init = function () {
        if (this.inited) {
            return;
        }
        this.inited = true;
        this.main.subscribeObjects('system.host.*');
        this.main.subscribeStates('system.host.*');

        this.getHosts(function () {
            that._postInit();
        });
    };

    this.destroy = function () {
        if (this.inited) {
            this.inited = false;
            this.main.unsubscribeObjects('system.host.*');
            this.main.unsubscribeStates('system.host.*');
        }
    };

    this.addHost = function (obj) {
        var addr = null;
        // Find first non internal IP and use it as identifier
        if (obj.native.hardware && obj.native.hardware.networkInterfaces) {
            for (var eth in obj.native.hardware.networkInterfaces) {
                if (!obj.native.hardware.networkInterfaces.hasOwnProperty(eth)) continue;
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
            this.list.push({name: obj.common.hostname, address: addr,        id: obj._id});
        } else {
            this.list.push({name: obj.common.hostname, address: '127.0.0.1', id: obj._id});
        }
    };

    this.getHosts = function (callback) {
        this.main.socket.emit('getForeignObjects', 'system.host.*',  'state', function (err, res) {
            for (var id in res) {
                if (!res.hasOwnProperty(id)) continue;
                that.main.objects[id] = res[id];
            }
            that.main.socket.emit('getForeignStates', 'system.host.*',function (err, res) {
                for (var id in res) {
                    if (!res.hasOwnProperty(id)) continue;
                    that.main.states[id] = res[id];
                }
                that.main.socket.emit('getForeignObjects', 'system.host.*', 'host', function (err, res) {
                    that.list = [];
                    for (var id in res) {
                        if (!res.hasOwnProperty(id)) continue;
                        var obj = res[id];

                        that.main.objects[id] = obj;

                        if (obj.type === 'host') {
                            that.addHost(obj);
                        }
                    }
                    main.initHostsList();
                    if (callback) callback();
                });
            });
        });
    };

    this.objectChange = function (id, obj) {
        // Update hosts
        if (id.match(/^system\.host\.[-\w]+$/)) {
            var found = false;
            var i;
            for (i = 0; i < this.list.length; i++) {
                if (this.list[i].id === id) {
                    found = true;
                    break;
                }
            }

            if (obj) {
                if (!found) this.list.push({id: id, address: obj.common.address ? obj.common.address[0] : '', name: obj.common.name});
            } else {
                if (found) this.list.splice(i, 1);
            }
            
            if (this.updateTimer) clearTimeout(this.updateTimer);

            this.updateTimer = setTimeout(function () {
                that.updateTimer = null;
                that._postInit();
            }, 200);
        }
    };

    this.stateChange = function (id, state) {
        if (id.match(/^system\.host\..+\.alive$/)) {
            id = id.substring(0, id.length - 6);
            if (state && state.val) {
                $('.hosts-led[data-host-id="' + id + '"]').removeClass('led-red').addClass('led-green');
            } else {
                $('.hosts-led[data-host-id="' + id + '"]').removeClass('led-green').addClass('led-red');
                $('.host-update-submit[data-host-id="' + id + '"]').hide();
                $('.host-update-hint-submit[data-host-id="' + id + '"]').hide();
                $('.host-restart-submit[data-host-id="' + id + '"]').hide();
            }
        } else if (id.match(/^system\.host\..+\.outputCount$/)) {
            id = id.substring(0, id.length - 12);

            $('.host-out[data-host-id="' + id + '"]').html('<span class="highlight">&#x21A6;' + state.val + '</span>');
        } else if (id.match(/^system\.host\..+\.inputCount$/)) {
            id = id.substring(0, id.length - 11);

            $('.host-in[data-host-id="' + id + '"]').html('<span class="highlight">&#x21A6;' + state.val + '</span>');
        }
    };
}

