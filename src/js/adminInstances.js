function Instances(main) {
    'use strict';

    var that = this;

    this.$tab          = $('#tab-instances');
    this.$grid         = $('#grid-instances');
    this.$gridHead     = $('#grid-instances-head');

    this.inited        = false;
    this.main          = main;
    this.list          = [];
    this.hostsText     = null;

    function getLinkVar(_var, obj, attr, link, instance) {
        if (attr === 'protocol') attr = 'secure';

        if (_var === 'ip') {
            link = link.replace('%' + _var + '%', location.hostname);
        } else
        if (_var === 'instance') {
            link = link.replace('%' + _var + '%', instance);
        } else {
            if (obj) {
                if (attr.match(/^native_/)) attr = attr.substring(7);

                var val = obj.native[attr];
                if (_var === 'bind' && (!val || val === '0.0.0.0')) val = location.hostname;

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

    function resolveLink(link, adapter, instance) {
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
                    link = getLinkVar(_var, that.main.objects['system.adapter.' + adapter + '.' + instance], _var, link, instance);
                    vars.splice(v, 1);
                } else
                if (parts.length === 1) {
                    link = getLinkVar(_var, that.main.objects['system.adapter.' + adapter + '.' + instance], parts[0], link, instance);
                    vars.splice(v, 1);
                } else
                // like "web.0_port"
                if (parts[0].match(/\.[0-9]+$/)) {
                    link = getLinkVar(_var, that.main.objects['system.adapter.' + parts[0]], parts[1], link, instance);
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
                        link: getLinkVar(_var, that.main.objects['system.adapter.' + adptr + '.' + i], parts[1], links[adptr + '.' + i] ? links[adptr + '.' + i].link : link, i)
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

    function replaceInLink(link, adapter, instance) {
        if (typeof link === 'object') {
            var links = JSON.parse(JSON.stringify(link));
            var first;
            for (var v in links) {
                if (links.hasOwnProperty (v)) {
                    links[v] = resolveLink (links[v], adapter, instance);
                    if (!first) first = links[v];
                }
            }
            links.__first = first;
            return links;
        } else {
            return resolveLink(link, adapter, instance);
        }
    }

    function updateLed(instanceId) {
        var tmp      = instanceId.split('.');
        var adapter  = tmp[2];
        var instance = tmp[3];

        var $led = $('.instance-led[data-instance-id="' + instanceId + '"]');

        var common   = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        var state = (common.mode === 'daemon') ? 'green' : 'blue';
        var title = '';
        if (common.enabled && (!common.webExtension || !that.main.objects[instanceId].native.webInstance)) {
            title = '<table style="border: 0">';
            title += '<tr style="border: 0"><td style="border: 0">' + _('Connected to host: ') + '</td><td style="border: 0">';

            if (!that.main.states[instanceId + '.connected'] || !that.main.states[instanceId + '.connected'].val) {
                title += ((common.mode === 'daemon') ? '<span style="color: red">' + _('false') + '</span>' : _('false'));
                state = (common.mode === 'daemon') ? 'red' : 'blue';
            } else {
                title += '<span style="color: green">' + _('true') + '</span>';
            }
            title += '</td></tr><tr style="border: 0"><td style="border: 0">' + _('Heartbeat: ') + '</td><td style="border: 0">';

            if (!that.main.states[instanceId + '.alive'] || !that.main.states[instanceId + '.alive'].val) {
                title += ((common.mode === 'daemon') ? '<span style="color: red">' + _('false') + '</span>' : _('false'));
                state = (common.mode === 'daemon') ? 'red' : 'blue';
            } else {
                title += '<span style="color: green">' + _('true') + '</span>';
            }
            title += '</td></tr>';

            if (that.main.states[adapter + '.' + instance + '.info.connection'] || that.main.objects[adapter + '.' + instance + '.info.connection']) {
                title += '<tr style="border: 0"><td style="border: 0">' + _('Connected to %s: ', adapter) + '</td><td>';
                var val = that.main.states[adapter + '.' + instance + '.info.connection'] ? that.main.states[adapter + '.' + instance + '.info.connection'].val : false;
                if (!val) {
                    state = state === 'red' ? 'red' : 'orange';
                    title += '<span style="color: red">' + _('false') + '</span>';
                } else {
                    if (val === true) {
                        title += '<span style="color: green">' + _('true') + '</span>';
                    } else {
                        title += '<span style="color: green">' + val + '</span>';
                    }
                }
                title += '</td></tr>';
            }
            title += '</table>';
        } else {
            state = (common.mode === 'daemon') ? 'gray' : 'blue';
            title = '<table style="border: 0">';
            title += '<tr style="border: 0"><td style="border: 0">' + _('Connected to host: ') + '</td><td style="border: 0">';

            if (!that.main.states[instanceId + '.connected'] || !that.main.states[instanceId + '.connected'].val) {
                title +=  _('false');
            } else {
                title += '<span style="color: green">' + _('true') + '</span>';
            }
            title += '</td></tr><tr style="border: 0">';

            title += '<td style="border: 0">' + _('Heartbeat: ') + '</td><td style="border: 0">';
            if (!that.main.states[instanceId + '.alive'] || !that.main.states[instanceId + '.alive'].val) {
                title +=  _('false');
            } else {
                title += '<span style="color: green">' + _('true') + '</span>';
            }
            title += '</td></tr>';

            if (that.main.states[adapter + '.' + instance + '.info.connection'] || that.main.objects[adapter + '.' + instance + '.info.connection']) {
                title += '<tr style="border: 0"><td style="border: 0">' + _('Connected to %s: ', adapter) + '</td><td>';
                var val = that.main.states[adapter + '.' + instance + '.info.connection'] ? that.main.states[adapter + '.' + instance + '.info.connection'].val : false;
                if (!val) {
                    title += _('false');
                } else {
                    if (val === true) {
                        title += '<span style="color: green">' + _('true') + '</span>';
                    } else {
                        title += '<span style="color: green">' + val + '</span>';
                    }
                }
                title += '</td></tr>';
            }
            title += '</table>';
        }

        state = (state === 'blue') ? '' : state;

        $led.removeClass('led-red led-green led-orange led-blue').addClass('led-' + state).data('title', title);

        if (!$led.data('inited') && state !== 'gray') {
            $led.data('inited', true);

            $led.hover(function () {
                var text = '<div class="instance-state-hover" style="' +
                    'left: ' + Math.round($(this).position().left + $(this).width() + 5) + 'px;">' + $(this).data('title') + '</div>';
                var $big = $(text);

                $big.insertAfter($(this));
                $(this).data('big', $big[0]);
                var h = parseFloat($big.height());
                var top = Math.round($(this).position().top - ((h - parseFloat($(this).height())) / 2));
                if (h + top > (window.innerHeight || document.documentElement.clientHeight)) {
                    top = (window.innerHeight || document.documentElement.clientHeight) - h;
                }
                if (top < 0) {
                    top = 0;
                }
                $big.css({top: top}).on('click', function () {
                    var big = $(this).data('big');
                    $(big).remove();
                    $(this).data('big', undefined);
                });
            }, function () {
                var big = $(this).data('big');
                $(big).remove();
                $(this).data('big', undefined);
            }).on('click', function () {
                $(this).trigger('hover');
            });
        }
    }

    function _createHead() {
        var text = '<tr>';
        // _('name'), _('instance'), _('title'), _('enabled'), _('host'), _('mode'), _('schedule'), '', _('platform'), _('loglevel'), _('memlimit'), _('alive'), _('connected')],
        text += '<th style="width: calc(2em - 6px)"></th>';
        //text += '<th style="width: 2em"></th>';
        text += '<th style="width: calc(2em - 6px)"></th>';
        text += '<th style="width: 14em">' + _('instance') + '</th>';
        text += '<th style="width: 15.1em"></th>';
        text += '<th style="text-align: left">' + _('title') + '</th>';

        if (that.main.tabs.hosts.list.length > 1) {
            text += '<th style="width: 10em">' + _('host') + '</th>';
        }

        text += '<th style="width: 8em">' + _('schedule_group') + '</th>';

        if (that.main.config.expertMode) {
            text += '<th style="width: 8em">' + _('restart')  + '</th>';
            text += '<th style="width: 8em">' + _('loglevel') + '</th>';
            text += '<th style="width: 8em">' + _('memlimit') + '</th>';
            text += '<th style="width: 8em">' + _('events') + '</th>';
        }
        text += '<th style="width: 8em">' + _('RAM usage') + '</th>';
        that.$gridHead.html(text);
    }

    function createHead() {
        var text = '<tr>';
        // _('name'), _('instance'), _('title'), _('enabled'), _('host'), _('mode'), _('schedule'), '', _('platform'), _('loglevel'), _('memlimit'), _('alive'), _('connected')],
        text += '<th style="width: calc(2em - 6px); border-right-color: transparent; overflow: visible">' +
            '<span style="overflow:visible;" >' + _('instance') + '</span>' +
            '</th>';
        text += '<th style="width: calc(2em - 6px); border-left-color: transparent; border-right-color: transparent;"></th>';
        text += '<th style="width: ' + (that.main.config.expertMode ? 10 : 14) + 'em; border-left-color: transparent;"></th>';
        text += '<th style="width: 15.8em">' + _('actions') + '</th>';
        text += '<th style="text-align: left">' + _('title') + '</th>';

        if (that.main.tabs.hosts.list.length > 1) {
            text += '<th style="width: 10em">' + _('host') + '</th>';
        }

        text += '<th style="width: 8em">' + _('schedule_group') + '</th>';

        if (that.main.config.expertMode) {
            text += '<th style="width: 8em">' + _('restart')  + '</th>';
            text += '<th style="width: 8em">' + _('loglevel') + '</th>';
            text += '<th style="width: 8em">' + _('memlimit') + '</th>';
            text += '<th style="width: 8em">' + _('events') + '</th>';
        }
        text += '<th style="width: 8em">' + _('RAM usage') + '</th>';
        that.$gridHead.html(text);
    }

    function calculateTotalRam() {
        var host      = that.main.states['system.host.' + that.main.currentHost + '.memRss'];
        var processes = 1;
        var mem = host ? host.val : 0;
        for (var i = 0; i < that.list.length; i++) {
            var obj = that.main.objects[that.list[i]];
            if (!obj || !obj.common) continue;
            if (obj.common.host !== that.main.currentHost) continue;
            if (obj.common.enabled && obj.common.mode === 'daemon') {
                var m = that.main.states[obj._id + '.memRss'];
                mem += m ? m.val : 0;
                processes++;
            }
        }
        mem = Math.round(mem);
        var $totalRam = $('#totalRam');
        if (mem.toString() !== $totalRam.text()) {
            $totalRam.html('<span class="highlight">' + mem + '</span>');
        }
        var text = _('%s processes', processes);
        var $running_processes = $('#running_processes');
        if (text !== $running_processes.text()) {
            $running_processes.html('<span class="highlight">' + text + '</span>')
        }
    }

    function calculateFreeMem() {
        var host = that.main.states['system.host.' + that.main.currentHost + '.freemem'];
        if (host) {
            that.totalmem = that.totalmem || that.main.objects['system.host.' + that.main.currentHost].native.hardware.totalmem / (1024 * 1024);
            var percent = Math.round((host.val / that.totalmem) * 100);
            var $freeMem = $('#freeMem');
            if (host.val.toString() !== $freeMem.text()) {
                $freeMem.html('<span class="highlight ' + (percent < 10 ? 'high-mem' : '') + '">' + tdp(host.val) + '</span>');
                //$('#freeMemPercent').html('<span class="highlight">(' + percent + '%)</span>');
                $('#freeMemPercent').html('<span class="highlight">' + percent + '%</span>');
            }
        } else {
            $('.free-mem-label').hide();
        }
    }

    function calculateRam(instanceId) {
        var mem;
        var common   = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        if (common.enabled && common.mode === 'daemon' && that.main.states[instanceId + '.memRss']) {
            mem = that.main.states[instanceId + '.memRss'].val;
            mem = parseFloat(mem) || 0;

            if (common.memoryLimitMB && common.memoryLimitMB <= mem) {
                mem = '<span class="high-mem">' + mem.toFixed(1) + ' MB</span>';
            } else {
                mem = mem.toFixed(1) + ' MB'
            }
        } else {
            mem = '';
        }
        return mem;
    }

    function showOneAdapter(rootElem, instanceId, form, justContent) {
        var text;
        var common   = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        var tmp      = instanceId.split('.');
        var adapter  = tmp[2];
        var instance = tmp[3];

        if (form === 'tile') {
            text = justContent ? '' : '<div class="instance-adapter" data-instance-id="' + instanceId + '">';
            text += justContent ? '' : '</div>';
        } else {
            // table
            text = justContent ? '' : '<tr class="instance-adapter" data-instance-id="' + instanceId + '">';

            var link = common.localLinks || common.localLink || '';
            var url  = link ? replaceInLink(link, adapter, instance) : '';
            if (link) {
                if (typeof url === 'object') {
                    link = '<a href="' + url.__first + '" target="_blank">';
                } else {
                    link = '<a href="' + url + '" target="_blank">';
                }
            }

            // State -
            //             red - adapter is not connected or not alive,
            //             orange - adapter is connected and alive, but device is not connected,
            //             green - adapter is connected and alive, device is connected or no device,
            text += '<td class="instance-state" style="text-align: center"><div class="instance-led" style="margin-left: 0.5em; width: 1em; height: 1em;" data-instance-id="' + instanceId + '"></div></td>';

            // icon
            text += '<td>' + (common.icon ? link + '<img src="adapter/' + adapter + '/' + common.icon + '" class="instance-image" data-instance-id="' + instanceId + '"/>' : '') + (link ? '</a>': '') + '</td>';

            // name and instance
            text += '<td style="padding-left: 0.5em" data-instance-id="' + instanceId + '" class="instance-name"><b>' + adapter + '.' + instance + '</b></td>';

            var isRun = common.onlyWWW || common.enabled;
            // buttons
            //text += '<td style="text-align: left; padding-left: 1em;">' +
            //text += '<td style="text-align: left; padding-left: 1px;">' +
            text += '<td style="text-align: left;">' +
                (!common.onlyWWW ? '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-stop-run"></button>' : '<div class="ui-button instance-empty">&nbsp;</div>') +
                '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-settings"></button>' +
                (!common.onlyWWW ? '<button ' + (isRun ? '' : 'disabled ') + 'style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-reload"></button>' : '<div class="ui-button instance-empty">&nbsp;</div>') +
                '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-issue"></button>' +
                '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-del"></button>' +
                (url ? '<button ' + (isRun ? '' : 'disabled ') + 'style="display: inline-block" data-link="' + (typeof url !== 'object' ? url : '') +'" data-instance-id="' + instanceId + '" class="instance-web"></button>' : '') +
                '</td>';

            var title = common.title;
            if (typeof title === 'object') {
                title = title[systemLang] || title.en;
            }

            // title
            text += '<td title="' + (link ? _('Click on icon') : '') + '" style="padding-left: 0.5em" data-name="title" data-value="' + (title || '') + '" class="instance-editable" data-instance-id="' + instanceId + '">' + (title || '') + '</td>';

            // host - hide it if only one host
            if (that.main.tabs.hosts.list.length > 1) {
                if (!that.hostsText) {
                    that.hostsText = '';
                    for (var h = 0; h < that.main.tabs.hosts.list.length; h++) {
                        var host = that.main.tabs.hosts.list[h] || '';
                        that.hostsText += (that.hostsText ? ';' : '') + host.name;
                    }
                }
                text += '<td  style="padding-left: 0.5em" data-name="host" data-value="' + (common.host || '') + '" class="instance-editable" data-instance-id="' + instanceId + '" data-options="' + that.hostsText + '">' + (common.host || '') + '</td>';
            }

            // schedule
            text += '<td data-name="schedule" data-value="' + (common.mode === 'schedule' ? (common.schedule || '') : '') + '" style="text-align: center" class="' + (common.mode === 'schedule' ? 'instance-schedule' : '') + '" data-instance-id="' + instanceId + '">' + (common.mode === 'schedule' ? (common.schedule || '') : '') + '</td>';

            // scheduled restart (only experts)
            if (that.main.config.expertMode) {
                text += '<td data-name="restartSchedule" data-value="' + (common.restartSchedule || '') + '"  style="text-align: center" class="instance-schedule" data-instance-id="' + instanceId + '">' + (common.restartSchedule || '') + '</td>';
                // debug level (only experts)
                text += '<td data-name="loglevel" data-value="' + (common.loglevel || '') + '"  style="text-align: center" class="instance-editable" data-instance-id="' + instanceId + '" data-options="silly:silly;debug:debug;info:info;warn:warn;error:error">' + (common.loglevel || '') + '</td>';
                // Max RAM  (only experts)
                text += '<td data-name="memoryLimitMB" data-value="' + (common.memoryLimitMB || '') + '" style="text-align: center" class="instance-editable" data-instance-id="' + instanceId + '">' + (common.memoryLimitMB || '') + '</td>';
                // Max RAM  (only experts)
                if (isRun && that.main.states[instanceId + '.inputCount'] && that.main.states[instanceId + '.outputCount']) {
                    text += '<td style="text-align: center"><span title="in" data-instance-id="' + instanceId + '" class="instance-in">&#x21E5;' + that.main.states[instanceId + '.inputCount'].val + '</span> / <span title="out" data-instance-id="' + instanceId + '" class="instance-out">&#x21A6;' + that.main.states[instanceId + '.outputCount'].val + '</span></td>';
                } else {
                    text += '<td style="text-align: center"><span title="in" data-instance-id="' + instanceId + '" class="instance-in"></span> / <span title="out" data-instance-id="' + instanceId + '" class="instance-out"></span></td>';
                }
            }

            text += '<td class="memUsage" style="text-align: center" data-instance-id="' + instanceId + '">' + calculateRam(instanceId) + '</td>';

            text += justContent ? '' : '</tr>';
        }
        if (!justContent) {
            rootElem.append(text);
        } else {
            $('.instance-adapter[data-instance-id="' + instanceId + '"]').html(text);
        }
        // init buttons
        that.initButtons(instanceId, url);
        updateLed(instanceId);
        // init links
        $('.instance-editable[data-instance-id="' + instanceId + '"]')
            .on('click', onQuickEditField)
            .addClass('select-id-quick-edit');

        // init schedule editor
        $('.instance-schedule[data-instance-id="' + instanceId + '"]').each(function () {
            if (!$(this).find('button').length) {
                $(this).append('<button class="instance-schedule-button" data-instance-id="' + instanceId + '" data-name="' + $(this).data('name') + '">...</button>');
                $(this).find('button').button().css('width', 16).on('click', function () {
                    var attr = $(this).data('name');
                    var _instanceId = $(this).data('instance-id');
                    showCronDialog(that.main.objects[_instanceId].common[attr] || '', function (newValue) {
                        if (newValue !== null) {
                            var obj = {common: {}};
                            obj.common[attr] = newValue;
                            that.main.socket.emit('extendObject', _instanceId, obj, function (err) {
                                if (err) that.main.showError(err);
                            });
                        }
                    })
                });
            }
        });

        $('.instance-name[data-instance-id="' + instanceId + '"]').on('click', function () {
            $('.instance-settings[data-instance-id="' + $(this).data('instance-id') + '"]').trigger('click');
        }).css('cursor', 'pointer');
    }

    function applyFilter(filter) {
        if (filter === undefined) {
            filter = that.$tab.find('.instances-filter').val();
        }
        var invisible = [];
        if (filter) {
            var reg = new RegExp(filter);

            for (var i = 0; i < that.list.length; i++) {
                var obj = that.main.objects[that.list[i]];
                if (!obj || !obj.common) {
                    that.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').hide();
                    continue;
                }
                var isShow = 'hide';
                var title = obj.common.title;
                if (typeof title === 'object') {
                    title = title[systemLang] || title.en;
                }

                if (obj.common.name && reg.test(obj.common.name)) {
                    isShow = 'show';
                } else
                if (title && reg.test(title)) {
                    isShow = 'show';
                } else
                if (filter === 'true') {
                    isShow = that.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').find('instance-led').hasClass('led-green') ? 'show' : 'hide';
                } else
                if (filter === 'false') {
                    isShow = that.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').find('instance-led').hasClass('led-green') ? 'hide' : 'show';
                }
                if (isShow === 'hide') invisible.push(that.list[i]);
                that.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]')[isShow]();
            }
        } else {
            that.$grid.find('.instance-adapter').show();
        }
    }

    function onQuickEditField(e) {
        var $this     = $(this);
        var id        = $this.data('instance-id');
        var attr      = $this.data('name');
        var options   = $this.data('options');
        var oldVal    = $this.data('value');
        var textAlign = $this.css('text-align');
        $this.css('text-align', 'left');

        $this.off('click').removeClass('select-id-quick-edit').css('position', 'relative');

        var css = 'cursor: pointer; position: absolute;width: 16px; height: 16px; top: 2px; border-radius: 6px; z-index: 3; background-color: lightgray';
        var type = 'text';
        var text;

        if (options) {
            var opt = options.split(';');
            text = '<select style="width: calc(100% - 50px); z-index: 2">';
            for (var i = 0; i < opt.length; i++) {
                var parts = opt[i].split(':');
                text += '<option value="' + parts[0] + '">' + (parts[1] || parts[0]) + '</option>';
            }
            text += '</select>';
        }
        text = text || '<input style="' + (type !== 'checkbox' ? 'width: 100%;' : '') + ' z-index: 2" type="' + type + '"/>';

        var timeout = null;

        $this.html(text +
            '<div class="ui-icon ui-icon-check        select-id-quick-edit-ok"     style="margin-top: 0.45em;' + css + ';right: 22px"></div>' +
            '<div class="cancel ui-icon ui-icon-close select-id-quick-edit-cancel" style="margin-top: 0.45em;' + css + ';right: 2px" title="' + _('cancel') + '" ></div>');

        var $input = (options) ? $this.find('select') : $this.find('input');

        $this.find('.select-id-quick-edit-cancel').on('click', function (e)  {
            if (timeout) clearTimeout(timeout);
            timeout = null;
            e.preventDefault();
            e.stopPropagation();
            if (oldVal === undefined) oldVal = '';
            $this.html(oldVal)
                .on('click', onQuickEditField)
                .addClass('select-id-quick-edit')
                .css('text-align', textAlign);
        });

        $this.find('.select-id-quick-edit-ok').on('click', function ()  {
            $this.trigger('blur');
        });

        $input.val(oldVal);

        $input.blur(function () {
            timeout = setTimeout(function () {
                var val = $(this).val();

                if (JSON.stringify(val) !== JSON.stringify(oldVal)) {
                    var obj = {common: {}};
                    obj.common[attr] = $(this).val();
                    that.main.socket.emit('extendObject', id, obj, function (err) {
                        if (err) that.main.showError(err);
                    });

                    oldVal = '<span style="color: pink">' + oldVal + '</span>';
                }
                $this.html(oldVal)
                    .on('click', onQuickEditField)
                    .addClass('select-id-quick-edit')
                    .css('text-align', textAlign);
            }.bind(this), 100);
        }).on('keyup', function (e) {
            if (e.which === 13) $(this).trigger('blur');
            if (e.which === 27) {
                if (oldVal === undefined) oldVal = '';
                $this.html(oldVal)
                    .on('click', onQuickEditField)
                    .addClass('select-id-quick-edit')
                    .css('text-align', textAlign);
            }
        });

        if (typeof e === 'object') {
            e.preventDefault();
            e.stopPropagation();
        }

        setTimeout(function () {
            $input.focus();
        }, 100);
    }

    function showCronDialog(value, cb) {
        value = (value || '').replace(/"/g, '').replace(/'/g, '');
        try {
            setupCron(value, cb);
        } catch (e) {
            alert(_('Cannot parse value as cron'));
        }
    }

    this.prepare            = function () {
        /*this.$dialogCron.dialog({
            autoOpen:   false,
            modal:      true,
            width:      700,
            height:     550,
            resizable:  false,
            title:      _('Cron expression'),
            buttons: [
                {
                    id:     'dialog_cron_insert',
                    text:   _('Insert'),
                    click:  function () {
                        var val = $('#div-cron').cron('value');
                        that.$dialogCron.dialog('close');
                        that.editor.insert('"' + val + '"');
                        that.editor.focus();
                    }
                },
                {
                    id:     'dialog_cron_clear',
                    text: _('Clear'),
                    click: function () {
                        $('#div-cron').cron('value', '');
                    }
                },
                {
                    id:     'dialog_cron_callback',
                    text:   _('Set CRON'),
                    click:  function () {
                    }
                },
                {
                    text: _('Cancel'),
                    click: function () {
                        that.$dialogCron.dialog('close');
                    }
                }
            ]
        });

        $('#div-cron').cron({value: ''});
*/
        var $filter      = that.$tab.find('.instances-filter');
        var $filterClear = that.$tab.find('.instances-filter-clear');

        $filter.on('change', function () {
            var val = $(this).val();
            if (val) {
                $(this).addClass('input-not-empty');
                $filterClear.show();
            } else {
                $(this).removeClass('input-not-empty');
                $filterClear.hide();
            }
            that.main.saveConfig('instancesFilter', val);
            applyFilter(val);
        }).on('keyup', function () {
            if (that.filterTimeout) clearTimeout(that.filterTimeout);
            that.filterTimeout = setTimeout(function () {
                $filter.trigger('change');
            }, 300);
        });
        if (that.main.config.instancesFilter && that.main.config.instancesFilter[0] !== '{') {
            $filter.addClass('input-not-empty').val(that.main.config.instancesFilter);
            $filterClear.show();
        } else {
            $filterClear.hide();
        }

        //$('#load_grid-instances').show();
        that.$tab.find('.btn-instances-expert-mode').on('click', function () {
            that.main.config.expertMode = !that.main.config.expertMode;
            that.main.saveConfig('expertMode', that.main.config.expertMode);
            that.updateExpertMode();
            that.main.tabs.adapters.updateExpertMode();
        });

        if (that.main.config.expertMode) {
            that.$tab.find('.btn-instances-expert-mode').addClass('red lighten-3');
        }

        that.$tab.find('.btn-instances-reload').on('click', function () {
            that.init(true);
        });

        /*that.$grid.find('#btn-instances-form').button({
            icons: {primary: 'ui-icon-refresh'},
            text:  false
        }).css({width: '1.5em', height: '1.5em'}).attr('title', _('reload')).on('click', function () {
            that.main.config.instanceForm = that.main.config.instanceForm === 'tile' ? 'list' : 'tile';
            that.main.saveCell('expertMode', that.main.config.expertMode);
            that.init(true);
        });*/

        $filterClear.on('click', function () {
            $filter.val('').trigger('change');
        });
    };

    this.updateExpertMode   = function () {
        that.init(true);
        if (that.main.config.expertMode) {
            that.$tab.find('.btn-instances-expert-mode').addClass('red lighten-3');
        } else {
            that.$tab.find('.btn-instances-expert-mode').removeClass('red lighten-3');
        }
    };

    this.replaceLink        = function (_var, adapter, instance, elem) {
        _var = _var.replace(/%/g, '');
        if (_var.match(/^native_/))  _var = _var.substring(7);
        // like web.0_port
        var parts;
        if (_var.indexOf('_') === -1) {
            parts = [
                adapter + '.' + instance,
                _var
            ]
        } else {
            parts = _var.split('_');
            // add .0 if not defined
            if (!parts[0].match(/\.[0-9]+$/)) parts[0] += '.0';
        }

        if (parts[1] === 'protocol') parts[1] = 'secure';

        if (_var === 'instance') {
            setTimeout(function () {
                var link;
                if (elem) {
                    link = $('#' + elem).data('src');
                } else {
                    link = $('#a_' + adapter + '_' + instance).attr('href');
                }

                link = link.replace('%instance%', instance);
                if (elem) {
                    $('#' + elem).data('src', link);
                } else {
                    $('#a_' + adapter + '_' + instance).attr('href', link);
                }
            }, 0);
            return;
        }

        this.main.socket.emit('getObject', 'system.adapter.' + parts[0], function (err, obj) {
            if (obj) {
                setTimeout(function () {
                    var link;
                    if (elem) {
                        link = $('#' + elem).data('src');
                    } else {
                        link = $('#a_' + adapter + '_' + instance).attr('href');
                    }
                    if (link) {
                        if (parts[1] === 'secure') {
                            link = link.replace('%' + _var + '%', obj.native[parts[1]] ? 'https' : 'http');
                        } else {
                            if (link.indexOf('%' + _var + '%') === -1) {
                                link = link.replace('%native_' + _var + '%', obj.native[parts[1]]);
                            } else {
                                link = link.replace('%' + _var + '%', obj.native[parts[1]]);
                            }
                        }
                        if (elem) {
                            $('#' + elem).data('src', link);
                        } else {
                            $('#a_' + adapter + '_' + instance).attr('href', link);
                        }
                    }
                }, 0);
            }
        });
    };

    /*this.replaceLinks = function (vars, adapter, instance, elem) {
        if (typeof vars !== 'object') vars = [vars];
        for (var t = 0; t < vars.length; t++) {
            this.replaceLink(vars[t], adapter, instance, elem);
        }
    };*/

    this._replaceLink       = function (link, _var, adapter, instance, callback) {
        // remove %%
        _var = _var.replace(/%/g, '');

        if (_var.match(/^native_/)) _var = _var.substring(7);
        // like web.0_port
        var parts;
        if (_var.indexOf('_') === -1) {
            parts = [adapter + '.' + instance, _var];
        } else {
            parts = _var.split('_');
            // add .0 if not defined
            if (!parts[0].match(/\.[0-9]+$/)) parts[0] += '.0';
        }

        if (parts[1] === 'protocol') parts[1] = 'secure';

        this.main.socket.emit('getObject', 'system.adapter.' + parts[0], function (err, obj) {
            if (obj && link) {
                if (parts[1] === 'secure') {
                    link = link.replace('%' + _var + '%', obj.native[parts[1]] ? 'https' : 'http');
                } else {
                    if (link.indexOf('%' + _var + '%') === -1) {
                        link = link.replace('%native_' + _var + '%', obj.native[parts[1]]);
                    } else {
                        link = link.replace('%' + _var + '%', obj.native[parts[1]]);
                    }
                }
            } else {
                console.log('Cannot get link ' + parts[1]);
                link = link.replace('%' + _var + '%', '');
            }
            setTimeout(function () {
                callback(link, adapter, instance);
            }, 0);
        });
    };

    this._replaceLinks      = function (link, adapter, instance, arg, callback) {
        if (!link) {
            return callback(link, adapter, instance, arg);
        }
        var vars = link.match(/%(\w+)%/g);
        if (!vars) {
            return callback(link, adapter, instance, arg);
        }
        if (vars[0] === '%ip%') {
            link = link.replace('%ip%', location.hostname);
            this._replaceLinks(link, adapter, instance, arg, callback);
            return;
        }
        if (vars[0] === '%instance%') {
            link = link.replace('%instance%', instance);
            this._replaceLinks(link, adapter, instance, arg, callback);
            return;
        }
        this._replaceLink(link, vars[0], adapter, instance, function (link, adapter, instance) {
            this._replaceLinks(link, adapter, instance, arg, callback);
        }.bind(this));
    };

    this._postInit          = function (update) {
        if (this.main.currentHost && typeof this.$grid !== 'undefined' && (!this.$grid.data('inited') || update)) {
            this.$grid.data('inited', true);
            this.list.sort();
            var onlyWWW = [];
            // move all adapters with not onlyWWW and noConfig to the bottom
            for (var l = this.list.length - 1; l >= 0; l--) {
                if (this.main.objects[this.list[l]] &&
                    this.main.objects[this.list[l]].common &&
                    !this.main.objects[this.list[l]].common.localLink &&
                    !this.main.objects[this.list[l]].common.localLinks &&
                    this.main.objects[this.list[l]].common.noConfig
                ) {
                    onlyWWW.push(this.list[l]);
                    this.list.splice(l, 1);
                }
            }
            this.list.sort();
            onlyWWW.sort();
            for (l = 0; l < onlyWWW.length; l++) {
                this.list.push(onlyWWW[l]);
            }

            createHead();
            this.$grid.html('');

            for (var i = 0; i < this.list.length; i++) {
                var obj = this.main.objects[this.list[i]];
                if (!obj) continue;
                showOneAdapter(this.$grid, this.list[i], this.main.config.instanceForm);
            }
            applyFilter();

            $('#currentHost').html(this.main.currentHost);
            calculateTotalRam();
            calculateFreeMem();
        }
    };

    this.getInstances       = function (callback) {
        this.main.socket.emit('getForeignObjects', 'system.adapter.*', 'state', function (err, res) {
            for (var id in res) {
                if (!res.hasOwnProperty(id)) continue;
                that.main.objects[id] = res[id];
            }
            that.main.socket.emit('getForeignStates', 'system.adapter.*',function (err, res) {
                for (var id in res) {
                    if (!res.hasOwnProperty(id)) continue;
                    that.main.states[id] = res[id];
                }

                that.main.socket.emit('getForeignObjects', 'system.adapter.*', 'instance', function (err, res) {
                    that.main.instances.splice(0, that.main.instances.length); // because of pointer in admin.main
                    for (var id in res) {
                        if (!res.hasOwnProperty(id)) continue;
                        var obj = res[id];
                        that.main.objects[id] = obj;

                        if (obj.type === 'instance') {
                            that.main.instances.push(id);
                        }
                    }
                    if (callback) callback();
                });

            });
        });
    };

    this.init               = function (update) {
        if (this.inited && !update) {
            return;
        }
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init(update);
            }, 250);
            return;
        }
        var count = 0;

        count++;
        this.getInstances(function () {
            if (!--count) that._postInit(update);
        });
        count++;
        this.main.tabs.hosts.getHosts(function () {
            if (!--count) that._postInit(update);
        });

        if (!this.inited) {
            this.inited = true;
            // subscribe objects and states
            this.main.subscribeObjects('system.adapter.*');
            this.main.subscribeStates('system.adapter.*');
            this.main.subscribeObjects('system.host.*');
            this.main.subscribeStates('system.host.*');
        }
    };

    this.destroy            = function () {
        if (this.inited) {
            this.inited = false;
            // subscribe objects and states
            this.main.unsubscribeObjects('system.adapter.*');
            this.main.unsubscribeStates('system.host.*');
            this.main.unsubscribeObjects('system.host.*');
            this.main.unsubscribeStates('system.adapter.*');
        }
    };

    this.stateChange        = function (id, state) {
        this.main.states[id] = state;
        if (this.$grid) {
            var parts = id.split('.');
            var last = parts.pop();
            id = parts.join('.');

            if (state) {
                if (last === 'freemem') {
                    // update total ram
                    calculateFreeMem();
                } else if (last === 'memRss') {
                    // update total ram
                    calculateTotalRam();
                    // update instance ram
                    var $mem = that.$tab.find('.memUsage[data-instance-id="' + id + '"]');
                    var mem = calculateRam(id);
                    if ($mem.length && $mem.text() !== mem) {
                        $mem.html('<span class="highlight">' + mem + '</span>');
                    }
                } else if (last === 'outputCount') {
                    // update total ram
                    that.$tab.find('.instance-out[data-instance-id="' + id + '"]').html('<span class="highlight">&#x21A6;' + state.val + '</span>');
                } else if (last === 'inputCount') {
                    that.$tab.find('.instance-in[data-instance-id="' + id + '"]').html('<span class="highlight">&#x21E5;' + state.val + '</span>');
                }

                if (this.list.indexOf(id) !== -1) {
                    if (last === 'alive' || last === 'connected') {
                        updateLed(id);
                    }
                    return;
                }
                id = 'system.adapter.' + parts[0] + '.' + parts[1];
                if (this.list.indexOf(id) !== -1 && last === 'connection') {
                    updateLed(id);
                }
            }
        }
    };

    this.objectChange       = function (id, obj) {
        // Update Instance Table
        if (id.match(/^system\.adapter\.[-\w]+\.[0-9]+$/)) {
            if (obj) {
                if (this.list.indexOf(id) === -1) {
                    // add new instance
                    this.list.push(id);

                    if (this.updateTimer) clearTimeout(this.updateTimer);

                    this.updateTimer = setTimeout(function () {
                        that.updateTimer = null;
                        that.init(true);
                    }, 200);

                    // open automatically config dialog
                    if (!obj.common.noConfig) {
                        setTimeout(function () {
                            if (window.location.hash.indexOf('/config/') === -1) {
                                // open configuration dialog
                                that.main.navigate({
                                    tab:    'instances',
                                    dialog: 'config',
                                    params:  id
                                });
                            }
                        }, 2000);
                    }
                } else {
                    if (id.indexOf('.web.') !== -1) {
                        if (this.updateTimer) clearTimeout(this.updateTimer);

                        this.updateTimer = setTimeout(function () {
                            that.updateTimer = null;
                            that.init(true);
                        }, 200);
                    } else {
                        debugger;
                        // update just one line or
                        this.$grid.find('.instance-adapter[data-instance-id="' + id + '"]').html(showOneAdapter(this.$grid, id, this.main.config.instanceForm, true));
                    }
                }
            } else {
                var i = this.list.indexOf(id);
                if (i !== -1) {
                    this.list.splice(i, 1);
                    this.$grid.find('.instance-adapter[data-instance-id="' + id + '"]').remove();
                }
            }
        } else
        // update list if some host changed
        if (id.match(/^system\.host\.[-\w]+$/)) {
            if (this.updateTimer) clearTimeout(this.updateTimer);

            this.updateTimer = setTimeout(function () {
                that.updateTimer = null;
                that.init(true);
            }, 200);
        }
    };

    this.initButtons        = function (id, url) {
        id = id ? '[data-instance-id="' + id + '"]' : '';

        var $e = that.$grid.find('.instance-edit' + id).off('click').on('click', function () {
            that.onEdit($(this).attr('data-instance-id'));
        });

        //var buttonSize = {width: '2em', height: '2em'}

        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({
                icons: {primary: 'ui-icon-pencil'},
                text:  false
            }).css({width: '2em', height: '2em'}).attr('title', _('edit'));
        }

        $e = that.$grid.find('.instance-settings' + id).off('click')
            .on('click', function () {
                that.main.navigate({
                    tab:    'instances',
                    dialog: 'config',
                    params:  $(this).data('instance-id')
                });
            });
        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({icons: {primary: 'ui-icon-note'}, text: false})./*css({width: '2em', height: '2em'}).*/attr('title', _('config'));
        }
        $e.each(function () {
            var _id = $(this).attr('data-instance-id');
            if (main.objects[_id] && main.objects[_id].common && main.objects[_id].common.noConfig) {
                $(this).button('disable');
            }
        });

        $e = that.$grid.find('.instance-reload' + id).off('click')
            .on('click', function () {
                that.main.socket.emit('extendObject', $(this).attr('data-instance-id'), {}, function (err) {
                    if (err) that.main.showError(err);
                });
            });
        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({icons: {primary: 'ui-icon-refresh'}, text: false}).attr('title', _('reload'));
        }

        $e = that.$grid.find('.instance-del' + id).off('click')
            .on('click', function () {
                var id = $(this).attr('data-instance-id');
                if (that.main.objects[id] && that.main.objects[id].common && that.main.objects[id].common.host) {
                    var name = id.replace(/^system\.adapter\./, '');
                    that.main.confirmMessage(_('Are you sure you want to delete the instance <b>%s</b>?', name), null, 'help', function (result) {
                        if (result) {
                            that.main.cmdExec(that.main.objects[id].common.host, 'del ' + id.replace('system.adapter.', ''), function (exitCode) {
                                if (!exitCode) that.main.tabs.adapters.init(true);
                            });
                        }
                    });
                }
            });

        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({icons: {primary: 'ui-icon-trash'}, text: false}).attr('title', _('delete'));
        } else {
            $e.button('enable');
        }
        
        $e = that.$grid.find('.instance-issue' + id).off('click')
            .on('click', function () {
                that.main.navigate({
                    tab:    'instances',
                    dialog: 'issue',
                    params:  $(this).data('instance-id')
                });
            });
        if (!$e.find('.ui-button-icon-primary').length) {
            //$e.button({icons: {primary: 'ui-icon-pin-s'}, text: false})./*css({width: '2em', height: '2em'}).*/attr('title', _('bug'));
            //Material-Hack
            $e.button().attr('title', _('bug')).empty().append('<i class="material-icons bug-report">bug_report</i>');
        }

        that.$grid.find('.instance-image' + id).each(function () {
            if (!$(this).data('installed')) {
                $(this).data('installed', true);
                $(this).hover(function () {
                    var text = '<div class="icon-large" style="' +
                        'left: ' + Math.round($(this).position().left + $(this).width() + 5) + 'px;"><img src="' + $(this).attr('src') + '"/></div>';
                    var $big = $(text);
                    $big.insertAfter($(this));
                    $(this).data('big', $big[0]);
                    var h = parseFloat($big.height());
                    var top = Math.round($(this).position().top - ((h - parseFloat($(this).height())) / 2));
                    if (h + top > (window.innerHeight || document.documentElement.clientHeight)) {
                        top = (window.innerHeight || document.documentElement.clientHeight) - h;
                    }
                    if (top < 0) {
                        top = 0;
                    }
                    $big.css({top: top});
                }, function () {
                    var big = $(this).data('big');
                    $(big).remove();
                    $(this).data('big', undefined);
                });
            }
        });
        $e = that.$grid.find('.instance-stop-run' + id).off('click')
            .on('click', function () {
                var id = $(this).attr('data-instance-id');
                $(this).button('disable');
                that.main.socket.emit('extendObject', id, {common: {enabled: !that.main.objects[id].common.enabled}}, function (err) {
                    if (err) that.main.showError(err);
                });
            });

        if (!$e.find('.ui-button-icon-primary').length) {
            $e.each(function () {
                var id = $(this).attr('data-instance-id');
                var enabled = that.main.objects[id].common.enabled;
                $e.button({icons: {primary: enabled ? 'ui-icon-pause': 'ui-icon-play'}, text: false})
                    //.css({'background-color': enabled ? 'lightgreen' : '#FF9999'})
                    //.css({'background-color': enabled ? 'rgba(0, 255, 0, 0.15)' : 'rgba(255, 0, 0, 0.15)'})
                    .css({'background-color': enabled ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'})
                    .attr('title', enabled ? _('Activated. Click to stop.') : _('Deactivated. Click to start.'));
            });
        }

        $e = that.$grid.find('.instance-web' + id).off('click')
            .on('click', function () {
                var _link = $(this).data('link');
                if (typeof _link === 'object') {
                    var menu = '';
                    for (var m in _link) {
                        if (!_link.hasOwnProperty(m)) continue;
                        if (m === '__first') continue;
                        var port  = _link[m].match(/^https?:\/\/[-.\w]+:(\d+)\/?/);
                        var https = _link[m].match(/^https:\/\//);

                        menu += '<li data-link="' + _link[m] + '" data-instance-id="' + $(this).data('instance-id') + '" class="instances-menu-link"><b>' + m + (port ? ' :' + port[1] : '') + (https ? ' - SSL' : '') + '</b></li>';
                    }
                    menu += '<li class="instances-menu-link">' + _('Close') + '</li>';

                    var $instancesMenu = $('#instances-menu');
                    if ($instancesMenu.data('inited')) $instancesMenu.menu('destroy');

                    var pos = $(this).position();
                    $instancesMenu.html(menu);
                    if (!$instancesMenu.data('inited')) {
                        $instancesMenu.data('inited', true);
                        $instancesMenu.mouseleave(function () {
                            $(this).hide();
                        });
                    }

                    $instancesMenu.menu().css({
                        left:   pos.left,
                        top:    pos.top
                    }).show();

                    $('.instances-menu-link').off('click').on('click', function () {
                        if ($(this).data('link')) window.open($(this).data('link'), $(this).data('instance-id'));
                        $('#instances-menu').hide();
                    });

                } else {
                    window.open($(this).data('link'), $(this).data('instance-id'));
                }
            });
        if (typeof url === 'object') $e.data('link', url);

        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({icons: {primary: 'ui-icon-image'}, text: false}).attr('title', _('open web page'));
        } else {
            $e.button('enable');
        }
    };

    this.resize             = function (width, height) {
        //this.$grid.setGridHeight(height - 150).setGridWidth(width);
    };
}
