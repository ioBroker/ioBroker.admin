function Intro(main) {
    'use strict';

    var that = this;

    this.$tab      = $('#tab-intro');
    this.$tiles    = this.$tab.find('.tab-intro-cards');
    this.main      = main;
    this.inited    = false;
    this.$template = $('#intro-template');

    function readInstances(callback) {
        that.main.socket.emit('getObjectView', 'system', 'instance', {startkey: 'system.adapter.', endkey: 'system.adapter.\u9999'}, function (err, doc) {
            if (err) {
                if (callback) callback (err, []);
            } else {
                if (doc.rows.length === 0) {
                    if (callback) callback (err, []);
                } else {
                    that.main.instances = [];
                    for (var i = 0; i < doc.rows.length; i++) {
                        that.main.instances.push(doc.rows[i].id);
                        that.main.objects[doc.rows[i].id] = doc.rows[i].value;
                    }
                    if (callback) callback(err, that.main.instances);
                }
            }
        });
    }

    /**
     * Format number in seconds to time text
     * @param {!number} seconds
     * @returns {String}
     */
    function formatSeconds(seconds) {
        var days = Math.floor(seconds / (3600 * 24));
        seconds %= 3600 * 24;
        var hours = Math.floor(seconds / 3600);
        if (hours < 10) {
            hours = '0' + hours;
        }
        seconds %= 3600;
        var minutes = Math.floor(seconds / 60);
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        seconds %= 60;
        seconds = Math.floor(seconds);
        if (seconds < 10) {
            seconds = '0' + seconds;
        }
        var text = '';
        if (days) {
            text += days + ' ' + _('daysShortText') + ' ';
        }
        text += hours + ':' + minutes + ':' + seconds;

        return text;
    }

    /**
     * Format bytes to MB or GB
     * @param {!number} bytes
     * @returns {String}
     */
    function formatRam(bytes) {
        var GB = Math.floor(bytes / (1024 * 1024 * 1024) * 10) / 10;
        bytes %= (1024 * 1024 * 1024);
        var MB = Math.floor(bytes / (1024 * 1024) * 10) / 10;
        var text = '';
        if (GB > 1) {
            text += GB + ' GB ';
        } else {
            text += MB + ' MB ';
        }

        return text;
    }

    function formatSpeed(mhz) {
        return mhz + ' MHz';
    }

    /**
     * FormatObject for host informations
     * @type type
     */
    var formatInfo = {
        'Uptime': formatSeconds,
        'System uptime': formatSeconds,
        'RAM': formatRam,
        'Speed': formatSpeed
    };

    function buildInfoCard(host) {
        var $card = that.$template.clone();
        $card.removeAttr('id');
        $card.addClass('card-system-info');
        $card.find('.card-title').text(host.name);
        $card.find('.btn-card-enabled').data('host', host.id);

        // button enabled
        if (that.main.systemConfig.common.intro[host.id] === false) {
            if (that.$tab.hasClass('edit-active')) {
                $card.addClass('card-disabled').find('.btn-card-enabled').removeClass('blue').addClass('gray').find('i').text('close');
            } else {
                return null;
            }
        }
        $card.find('.card-content-text').html('<div class="preloader-wrapper small active">\n' +
            '    <div class="spinner-layer spinner-green-only">\n' +
            '      <div class="circle-clipper left">\n' +
            '        <div class="circle"></div>\n' +
            '      </div><div class="gap-patch">\n' +
            '        <div class="circle"></div>\n' +
            '      </div><div class="circle-clipper right">\n' +
            '        <div class="circle"></div>\n' +
            '      </div>\n' +
            '    </div>\n' +
            '  </div>');
        that.main.socket.emit('sendToHost', host.id, 'getHostInfo', null, function (data) {
            if (data === 'permissionError') {
                console.error('May not read "getHostInfo"');
            } else if (!data) {
                console.error('Cannot read "getHostInfo"');
            }

            var text = '<div class="card-content-text">';
            if (data) {
                text += '<ul>';
                for (var item in data) {
                    if (data.hasOwnProperty(item)) {
                        text += '<li><b>' + _(item) + ':</b> ';
                        text += '<span class="system-info" data-attribute="' + item + '">' + (formatInfo[item] ? formatInfo[item](data[item]) : data[item]) + '</span></li>';
                    }
                }
                text += '</ul>';
            }
            text += '</div>';
            $card.find('.card-content-text').replaceWith($(text));
        });
        return $card;
    }

    function buildOneCard(adapter, instance, common, url, web, enabled) {
        var $card = that.$template.clone();
        $card.removeAttr('id');
        var urlText = url.replace(/^https?:\/\//, '');
        var pos = urlText.indexOf('/');
        if (pos !== -1) {
            urlText = urlText.substring(0, pos);
        }
        if (adapter === 'admin' && urlText === location.host) return null;
        if (adapter === 'web') return null;

        $card.find('.btn-card-enabled').data('instance', adapter + '.' + instance).data('web', web);

        // button enabled
        if (!enabled) {
            $card.addClass('card-disabled').find('.btn-card-enabled').removeClass('blue').addClass('gray').find('i').text('close');
        } else {
            $card.on('click', function () {
                var editActive = that.$tab.hasClass('edit-active');
                if (editActive) return;
                window.open($(this).find('.url').attr('href'));
            })
        }

        // link
        $card.find('.url').attr('href', typeof url === 'object' ? url._first : url || '').text(urlText + (web ? ' (' + web + ')' : ''));
        // icon
        $card.find('.card-image-img').attr('src', common.icon ? 'adapter/' + adapter + '/' + common.icon : 'img/no-image.png');
        // title
        var title = common.titleLang || common.title;
        if (typeof title === 'object') {
            title = title[systemLang] || title.en;
        }
        $card.find('.card-title').text(title || adapter);

        var desc = common.desc;
        if (typeof desc === 'object') {
            desc = desc[systemLang] || desc.en;
        }
        $card.find('.card-content-text').text(desc || '');
        return $card;
    }

    function getCards(instances, callback) {
        var list = JSON.parse(JSON.stringify(instances));
        var a;
        var $cards = [];
        var enabled;
        var $card;
        list.sort(function (a, b) {
            a = that.main.objects[a] && that.main.objects[a].common;
            b = that.main.objects[b] && that.main.objects[b].common;
            a = a || {};
            b = b || {};
            if (a.order === undefined && b.order === undefined) {
                if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                return 0;
            } else if (a.order === undefined) {
                return -1;
            } else if (b.order === undefined) {
                return 1;
            } else {
                if (a.order > b.order) return 1;
                if (a.order < b.order) return -1;
                if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                return 0;
            }
        });

        var editActive = that.$tab.hasClass('edit-active');

        for (a = 0; a < list.length; a++) {
            var obj = that.main.objects[list[a]];
            var common = obj && obj.common;

            if (common && (common.enabled || common.onlyWWW) && (common.localLinks || common.localLink)) {
                var link = common.localLinks || common.localLink || '';
                var adapter = list[a].substring('system.adapter.'.length).split('.');
                var instance = adapter[1];
                adapter = adapter[0];
                var url = link ? that.main.tabs.instances.replaceInLink(link, adapter, instance) : '';
                $card = null;
                var intro = that.main.systemConfig.common.intro[adapter + '.' + instance];
                if (typeof url === 'object') {
                    var first = true;
                    for (var inst in url) {
                        if (url.hasOwnProperty(inst)) {
                            enabled = true;
                            if (intro !== undefined) {
                                if (first && typeof intro !== 'object') {
                                    var val = intro;
                                    intro = {};
                                    that.main.systemConfig.common.intro[adapter + '.' + instance] = intro;
                                    intro[inst] = val;
                                }
                                if (intro[inst] === false) {
                                    enabled = false;
                                }
                            }
                            first = false;

                            if (!editActive && !enabled) continue;

                            $card = buildOneCard(adapter, instance, common, url[inst], inst, enabled);
                            $card && $cards.push($card);
                        }
                    }
                } else {
                    enabled = true;
                    if (!editActive && intro !== undefined) {
                        if (typeof intro === 'object') {
                            for (var aa in intro) {
                                if (intro.hasOwnProperty(aa)) {
                                    intro = intro[aa];
                                    that.main.systemConfig.common.intro[adapter + '.' + instance] = intro;
                                    break;
                                }
                            }
                        }
                        if (intro === false) {
                            enabled = false;
                        }
                    }
                    if (!editActive && !enabled) continue;
                    $card = buildOneCard(adapter, instance, common, url, null, enabled);
                    $card && $cards.push($card);
                }
            }
        }

        for (var i = 0; i < that.main.tabs.hosts.list.length; i++) {
            $card = buildInfoCard(that.main.tabs.hosts.list[i]);
            $card && $cards.push($card);
        }

        callback(null, $cards);
    }

    function updateConfig(callback) {
        var values = [];
        that.$tiles.find('.btn-card-enabled').each(function () {
            var inst = $(this).data('instance');
            if (inst) {
                values.push({
                    id: inst,
                    enabled: !$(this).hasClass('gray'),
                    web: $(this).data('web')
                });
            } else {
                values.push({
                    id: $(this).data('host'),
                    enabled: !$(this).hasClass('gray')
                });
            }
        });

        // update all values
        var intro = that.main.systemConfig.common.intro;
        var changed = true;
        for (var i = 0; i < values.length; i++) {
            var actual;
            var id = values[i].id;
            if (values[i].web) {
                if (intro[id] !== undefined && typeof intro[id] !== 'object') {
                    var val = intro[id];
                    intro[id] = {};
                    intro[id][values[i].web] = val;
                }
                actual = intro[id] && intro[id][values[i].web] !== undefined ? intro[id][values[i].web] : true;
            } else {
                if (intro[id] !== undefined && typeof intro[id] === 'object') {
                    for (var aa in intro[id]) {
                        if (intro[id].hasOwnProperty(aa)) {
                            intro[id] = intro[id][aa];
                            break;
                        }
                    }
                }
                actual = intro[id] !== undefined ? intro[id] : true;
            }
            if (values[i].enabled !== actual) {
                changed = true;
                if (values[i].web) {
                    intro[id] = intro[id] || {};
                    intro[id][values[i].web] = values[i].enabled;
                } else {
                    intro[id] = values[i].enabled;
                }
            }
        }

        if (changed) {
            that.main.socket.emit('getObject', 'system.config', function (err, obj) {
                if (obj) {
                    obj.common.intro = that.main.systemConfig.common.intro;
                    that.main.socket.emit('setObject', obj._id, obj, function (err) {
                        callback && callback();
                    });
                } else {
                    callback && callback();
                }
            });
        } else {
            callback && callback();
        }
    }

    this.prepare = function () {
        this.$tab.find('.btn-edit').off('click').on('click', function () {
            that.$tab.addClass('edit-active');
            showTiles();
        });
        this.$tab.find('.btn-edit-ok').off('click').on('click', function () {
            updateConfig(function () {
                that.$tab.removeClass('edit-active');
                showTiles();
                that.main.showToast(that.$tiles, _('Updated'));
            });
        });
        this.$tab.find('.btn-edit-cancel').off('click').on('click', function () {
            that.$tab.removeClass('edit-active');
            showTiles();
        });
    };

    function showTiles(instances) {
        instances = instances || that.main.instances;

        getCards(instances, function (err, $cards) {
            that.$tiles.html('');
            for (var c = 0; c < $cards.length; c++) {
                that.$tiles.append($cards[c]);
            }

            if (that.$tab.hasClass('edit-active')) {
                that.$tiles.find('.btn-card-enabled').on('click', function () {
                    var enabled = !$(this).hasClass('gray');
                    if (enabled) {
                        $(this).removeClass('blue').addClass('gray').find('i').text('close');
                        $(this).parent().addClass('card-disabled');
                    } else {
                        $(this).addClass('blue').removeClass('gray').find('i').text('check');
                        $(this).parent().removeClass('card-disabled')
                    }
                });
            }
        });
    }
    // ----------------------------- Site cards show and Edit ------------------------------------------------
    this.init = function (update) {
        if (this.inited && !update) {
            return;
        }

        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init(update);
            }, 250);
            return;
        }

        that.main.systemConfig.common.intro = that.main.systemConfig.common.intro || {};

        // update info
        readInstances(function (err, instances) {
            showTiles(instances);
        });

        // Required is list of hosts and repository (done in getAdaptersInfo)
        if (!this.inited) {
            this.inited = true;
            this.main.subscribeObjects('system.adapter.*');
            this.main.subscribeObjects('system.host.*');
        }
    };

    this.destroy = function () {
        if (this.inited) {
            this.inited = false;
            this.main.unsubscribeObjects('system.adapter.*');
            this.main.unsubscribeObjects('system.host.*');
        }
    };

    this.objectChange = function (id) {
        // Update Adapter Table
        if (this.inited && (id.match(/^system\.adapter\.[a-zA-Z0-9-_]+\.\d+$/) || id.match(/^system\.host\./))) {
            if (this.updateTimeout) {
                this.updateTimeout = clearTimeout(this.updateTimeout);
            }
            this.updateTimeout = setTimeout(function () {
                showTiles();
            }, 1000);
        }
    };
}
