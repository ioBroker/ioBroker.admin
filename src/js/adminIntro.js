function Intro(main) {
    'use strict';

    var that = this;

    this.$tab   = $('#tab-intro');
    this.$tiles = this.$tab.find('.tab-intro-cards');
    this.main   = main;
    this.inited = false;
    this.list   = this.main.instances;

    function getLinkVar(_var, obj, attr, link) {
        if (attr === 'protocol') attr = 'secure';

        if (_var === 'ip') {
            link = link.replace('%' + _var + '%', '$host$');
        } else
        if (_var === 'instance') {
            var instance = obj._id.split('.').pop();
            link = link.replace('%' + _var + '%', instance);
        } else {
            if (obj) {
                if (attr.match(/^native_/)) attr = attr.substring(7);

                var val = obj.native[attr];
                if (_var === 'bind' && (!val || val === '0.0.0.0')) val = '$host$';

                if (attr === 'secure') {
                    link = link.replace('%' + _var + '%', val ? 'https' : 'http');
                } else {
                    if (link.indexOf('%' + _var + '%') === -1) {
                        link = link.replace('%native_' + _var + '%', val);
                    } else {
                        link = link.replace('%' + _var + '%', val);
                    }
                }
            } else {
                if (attr === 'secure') {
                    link = link.replace('%' + _var + '%', 'http');
                } else {
                    if (link.indexOf('%' + _var + '%') === -1) {
                        link = link.replace('%native_' + _var + '%', '');
                    } else {
                        link = link.replace('%' + _var + '%', '');
                    }
                }
            }
        }
        return link;
    }

    function resolveLink(link, instanceObj, instancesMap) {
        var vars = link.match(/%(\w+)%/g);
        var _var;
        var v;
        var parts;
        if (vars) {
            // first replace simple patterns
            for (v = vars.length - 1; v >= 0; v--) {
                _var = vars[v];
                _var = _var.replace(/%/g, '');

                parts = _var.split('_');
                // like "port"
                if (_var.match(/^native_/)) {
                    link = getLinkVar(_var, instanceObj, _var, link);
                    vars.splice(v, 1);
                } else
                if (parts.length === 1) {
                    link = getLinkVar(_var, instanceObj, parts[0], link);
                    vars.splice(v, 1);
                } else
                // like "web.0_port"
                if (parts[0].match(/\.[0-9]+$/)) {
                    link = getLinkVar(_var, instancesMap['system.adapter.' + parts[0]], parts[1], link);
                    vars.splice(v, 1);
                }
            }
            var links = {};
            var instances;
            var adptr = parts[0];
            // process web_port
            for (v = 0; v < vars.length; v++) {
                _var = vars[v];
                _var = _var.replace(/%/g, '');
                if (_var.match(/^native_/)) _var = _var.substring(7);

                parts = _var.split('_');
                if (!instances) {
                    instances = [];
                    for (var inst = 0; inst < 10; inst++) {
                        if (that.main.objects['system.adapter.' + adptr + '.' + inst]) instances.push(inst);
                    }
                }

                for (var i = 0; i < instances.length; i++) {
                    links[adptr + '.' + i] = {
                        instance: adptr + '.' + i,
                        link: getLinkVar(_var, instancesMap['system.adapter.' + adptr + '.' + i], parts[1], links[adptr + '.' + i] ? links[adptr + '.' + i].link : link)
                    };
                }
            }
            var result;
            if (instances) {
                result = [];
                var count = 0;
                var firtsLink = '';
                for (var d in links) {
                    result[links[d].instance] = links[d].link;
                    if (!firtsLink) firtsLink = links[d].link;
                    count++;
                }
                if (count < 2) {
                    link = firtsLink;
                    result = null;
                }
            }
        }
        return result || link;
    }

    function readInstances(callback) {
        that.main.socket.emit('getForeignObjects', 'system.instance.*', function (err, instances) {
            if (instances) {
                that.list.splice(0, that.list.length);

                for (var id in instances) {
                    if (!instances.hasOwnProperty(id)) continue;
                    that.main.objects[id] = instances[id];
                    that.list.push(id);
                }
            }
            callback(err, that.list);
        });
    }

    function getListOfAllAdapters(instances, callback) {
        var list = [];
        var a;

        for (a = 0; a < that.list.length; a++) {
            var obj = that.main.objects[that.list[a]];
            if (obj && obj.common && (obj.common.enabled || obj.common.onlyWWW)) {
                if (obj.common.welcomeScreen || obj.common.welcomeScreenPro) {
                    if (obj.common.welcomeScreen) {
                        if (obj.common.welcomeScreen instanceof Array) {
                            for (var w = 0; w < obj.common.welcomeScreen.length; w++) {
                                // temporary disabled
                                if (obj.common.welcomeScreen[w].name === 'vis editor') {
                                    continue;
                                }
                                if (obj.common.welcomeScreen[w].localLink && typeof obj.common.welcomeScreen[w].localLink === 'boolean') {
                                    obj.common.welcomeScreen[w].localLink = obj.common.localLink;
                                }
                                if (obj.common.welcomeScreen[w].localLink) {
                                    obj.common.welcomeScreen[w].id = found;
                                }
                                list.push(obj.common.welcomeScreen[w]);
                            }
                        } else {
                            if (obj.common.welcomeScreen.localLink && typeof obj.common.welcomeScreen.localLink === 'boolean') {
                                obj.common.welcomeScreen.localLink = obj.common.localLink;
                            }
                            if (obj.common.welcomeScreen.localLink) {
                                obj.common.welcomeScreen.id = found;
                            }
                            list.push(obj.common.welcomeScreen);
                        }
                    }
                    if (obj.common.welcomeScreenPro) {
                        if (obj.common.welcomeScreenPro instanceof Array) {
                            for (var ww = 0; ww < obj.common.welcomeScreenPro.length; ww++) {
                                var tile = Object.assign({}, obj.common.welcomeScreenPro[ww]);
                                tile.pro = true;
                                if (tile.localLink && typeof tile.localLink === 'boolean') {
                                    tile.localLink = obj.common.localLink;
                                }
                                if (tile.localLink) {
                                    tile.id = found;
                                }
                                list.push(tile);
                            }
                        } else {
                            var tile_ = Object.assign({}, obj.common.welcomeScreenPro);
                            tile_.pro = true;
                            if (tile_.localLink && typeof tile_.localLink === 'boolean') {
                                tile_.localLink = obj.common.localLink;
                            }
                            if (tile_.localLink) {
                                tile_.id = found;
                            }
                            list.push(tile_);
                        }
                    }
                }
            }
        }

        var indexHtml = '';

        list.sort(function (a, b) {
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

        // calculate localLinks
        for (var t = 0; t < list.length; t++) {
            if (list[t].localLink) {
                list[t].localLink = resolveLink(list[t].localLink, mapInstance[list[t].id], mapInstance);
            }
        }

        callback(null, indexHtml);
    }

    this.prepare = function () {

    };

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

        // update info
        readInstances(function (instances) {
            getListOfAllAdapters(instances, function (text) {

            });
        });

        // Required is list of hosts and repository (done in getAdaptersInfo)
        if (!this.inited) {
            this.inited = true;
            this.main.subscribeObjects('system.adapter.*');
        }
    };

    this.destroy = function () {
        if (this.inited) {
            this.inited = false;
            this.main.unsubscribeObjects('system.adapter.*');
        }
    };

    this.objectChange = function (id, obj) {
        // Update Adapter Table
        if (this.inited && id.match(/^system\.adapter\.[a-zA-Z0-9-_]+\.\d+$/)) {

        }
    };
}
