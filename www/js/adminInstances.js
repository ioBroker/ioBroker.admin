function Instances(main) {
    "use strict";

    var that = this;

    this.$grid         = $('#grid-instances');
    this.$gridhead     = $('#grid-instances-head');
    this.$configFrame  = $('#config-iframe');
    this.$dialogConfig = $('#dialog-config');

    this.main          = main;
    this.list          = [];
    this.hostsText     = null;

    function replaceInLink(link, adapter, instance) {
        var vars = link.match(/\%(\w+)\%/g);
        if (vars) {
            for (var v = 0; v < vars.length; v++) {
                var _var = vars[v].replace(/\%/g, '');
                if (_var.match(/^native_/))  _var = _var.substring(7);

                // like web.0_port
                var parts;
                if (_var.indexOf('_') == -1) {
                    parts = [adapter + '.' + instance, _var];
                } else {
                    parts = _var.split('_');
                    // add .0 if not defined
                    if (!parts[0].match(/\.[0-9]+$/)) {
                        var inst = 0;
                        while (inst < 10 && !that.main.objects['system.adapter.' + parts[0] + '.' + inst]) {
                            inst++;
                        }

                        if (that.main.objects['system.adapter.' + parts[0] + '.' + inst]) parts[0] += '.' + inst;
                    }
                }
                if (parts[1] == 'protocol') parts[1] = 'secure';

                if (_var == 'ip') {
                    link = link.replace('%' + _var + '%', location.hostname);
                } else
                if (_var == 'instance') {
                    link = link.replace('%' + _var + '%', instance);
                } else {
                    var obj = that.main.objects['system.adapter.' + parts[0]];

                    if (obj) {
                        var val = obj.native[parts[1]];
                        if (_var == 'bind' && (!val || val == '0.0.0.0')) val = location.hostname;

                        if (parts[1] == 'secure') {
                            link = link.replace('%' + _var + '%', val ? 'https' : 'http');
                        } else {
                            if (link.indexOf('%' + _var + '%') == -1) {
                                link = link.replace('%native_' + _var + '%', val);
                            } else {
                                link = link.replace('%' + _var + '%', val);
                            }
                        }
                    } else {
                        if (parts[1] == 'secure') {
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
            }
        }

        return link;
    }

    function updateLed(instanceId) {
        var tmp      = instanceId.split('.');
        var adapter  = tmp[2];
        var instance = tmp[3];

        var $led = $('.instance-led[data-instance-id="' + instanceId + '"]');

        var common   = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        var state = (common.mode === 'daemon') ? 'green' : 'blue';
        var title = '';
        if (common.enabled) {
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

        state = (state == 'blue') ? '' : state;

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
                $big.css({top: top}).click(function () {
                    var big = $(this).data('big');
                    $(big).remove();
                    $(this).data('big', undefined);
                });
            }, function () {
                var big = $(this).data('big');
                $(big).remove();
                $(this).data('big', undefined);
            }).click(function () {
                $(this).trigger('hover');
            });
        }
    }

    function createHead() {
        var text = '<tr>';
        // _('name'), _('instance'), _('title'), _('enabled'), _('host'), _('mode'), _('schedule'), '', _('platform'), _('loglevel'), _('memlimit'), _('alive'), _('connected')],
        text += '<th style="width: 2em"></th>';
        text += '<th style="width: 2em"></th>';
        text += '<th style="width: 14em">' + _('instance') + '</th>';
        text += '<th style="width: 12em"></th>';
        text += '<th style="text-align: left">' + _('title') + '</th>';

        if (that.main.tabs.hosts.list.length > 1) {
            text += '<th style="width: 10em">' + _('host') + '</th>';
        }
        text += '<th style="width: 8em">' + _('schedule_group') + '</th>';
        if (that.main.config.expertMode) {
            text += '<th style="width: 8em">' + _('loglevel') + '</th>';
            text += '<th style="width: 8em">' + _('memlimit') + '</th>';
        }
        text += '<th style="width: 8em">' + _('RAM usage') + '</th>';
        that.$gridhead.html(text);
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
        if (mem.toString() !== $('#totalRam').text()) {
            $('#totalRam').html('<span class="highlight">' + mem + '</span>');
        }
        var text = _('%s processes', processes);
        if (text !== $('#running_processes').text()) {
            $('#running_processes').html('<span class="highlight">' + text + '</span>')
        }
    }
    function calculateFreeMem() {
        var host = that.main.states['system.host.' + that.main.currentHost + '.freemem'];
        if (host) {
            that.totalmem = that.totalmem || that.main.objects['system.host.' + that.main.currentHost].native.hardware.totalmem / (1024 * 1024);
            var percent = Math.round((host.val / that.totalmem) * 100);

            if (host.val.toString() !== $('#freeMem').text()) {
                $('#freeMem').html('<span class="highlight ' + (percent < 10 ? 'high-mem' : '') + '">' + host.val + '</span>');
                $('#freeMemPercent').html('<span class="highlight">(' + percent + '%)</span>');
            }
        } else {
            $('.free-mem-label').hide();
        }
    }

    function calculateRam(instanceId) {
        var mem;
        var common   = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        if (common.enabled && common.mode === 'daemon') {
            mem = that.main.states[instanceId + '.memRss'].val;
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

            var link = common.localLink || '';
            var url  = link ? replaceInLink(link, adapter, instance) : '';
            if (link) link = '<a href="' + url + '" target="_blank">';

            // State -
            //             red - adapter is not connected or not alive,
            //             orange - adapter is connected and alive, but device is not connected,
            //             green - adapter is connected and alive, device is connected or no device,
            text += '<td class="instance-state" style="text-align: center"><div class="instance-led" style="margin-left: 0.5em; width: 1em; height: 1em;" data-instance-id="' + instanceId + '"></div></td>';

            // icon
            text += '<td>' + (common.icon ? link + '<img src="/adapter/' + adapter + '/' + common.icon + '" style="width: 2em; height: 2em" class="instance-image" data-instance-id="' + instanceId + '"/>' : '') + (link ? '</a>': '') + '</td>';

            // name and instance
            text += '<td style="padding-left: 0.5em" data-instance-id="' + instanceId + '" class="instance-name"><b>' + adapter + '.' + instance + '</b></td>';

            // buttons
            text += '<td style="text-align: left; padding-left: 1em;">' +
                (!common.onlyWWW ? '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-stop-run"></button>' : '<div class="ui-button" style="display: inline-block; width: 2em">&nbsp;</div>') +
                '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-settings" data-instance-href="/adapter/' + adapter + '/?' + instance + '" ></button>' +
                '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-reload"></button>' +
                '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-del"></button>'+
                (url ? '<button style="display: inline-block" data-link="' + url +'" data-instance-id="' + instanceId + '" class="instance-web"></button>' : '') +
                '</td>';

            // title
            text += '<td title="' + (link ? _('Click on icon') : '') + '" style="padding-left: 0.5em" data-name="title" data-value="' + (common.title || '') + '" class="instance-editable" data-instance-id="' + instanceId + '">' + (common.title || '') + '</td>';


            // host - hide it if only one host
            if (that.main.tabs.hosts.list.length > 1) {
                if (!that.hostsText) {
                    that.hostsText = '';
                    for(var h = 0; h < that.main.tabs.hosts.list.length;h++) {
                        var host = that.main.tabs.hosts.list[h] || '';
                        that.hostsText += (that.hostsText ? ';' : '') + host.name;
                    }
                }
                text += '<td  style="padding-left: 0.5em" data-name="host" data-value="' + (common.host || '') + '" class="instance-editable" data-instance-id="' + instanceId + '" data-options="' + that.hostsText + '">' + (common.host || '') + '</td>';
            }

            // schedule
            text += '<td data-name="schedule" data-value="' + (common.mode === 'schedule' ? (common.schedule || '') : '') + '" style="text-align: center" class="' + (common.mode === 'schedule' ? 'instance-editable' : '') + '" data-instance-id="' + instanceId + '">' + (common.mode === 'schedule' ? (common.schedule || '') : '') + '</td>';

            // debug level (only experts)
            if (that.main.config.expertMode) {
                text += '<td data-name="loglevel" data-value="' + (common.loglevel || '') + '"  style="text-align: center" class="instance-editable" data-instance-id="' + instanceId + '" data-options="debug:debug;info:info;warn:warn;error:error">' + (common.loglevel || '') + '</td>';
            }

            // Max RAM  (only experts)
            if (that.main.config.expertMode) {
                text += '<td data-name="memoryLimitMB" data-value="' + (common.memoryLimitMB || '') + '" style="text-align: center" class="instance-editable" data-instance-id="' + instanceId + '">' + (common.memoryLimitMB || '') + '</td>';
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
        that.initButtons(instanceId);
        updateLed(instanceId);
        // init links
        $('.instance-editable[data-instance-id="' + instanceId + '"]')
            .click(onQuickEditField)
            .addClass('select-id-quick-edit');

        $('.instance-name[data-instance-id="' + instanceId + '"]').click(function () {
            $('.instance-settings[data-instance-id="' + $(this).data('instance-id') + '"]').trigger('click');
        }).css('cursor', 'pointer');
    }

    function applyFilter(filter) {
        if (filter === undefined) filter = $('#instances-filter').val();
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
                if (obj.common.name && reg.test(obj.common.name)) {
                    isShow = 'show';
                } else
                if (obj.common.title && reg.test(obj.common.title)) {
                    isShow = 'show';
                } else
                if (filter === 'true') {
                    isShow = this.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').find('instance-led').hasClass('led-green') ? 'show' : 'hide';
                } else
                if (filter === 'false') {
                    isShow = this.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').find('instance-led').hasClass('led-green') ? 'hide' : 'show';
                }
                if (isShow === 'hide') invisible.push(that.list[i]);
                that.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]')[isShow]();
            }
        } else {
            that.$grid.find('.instance-adapter').show();
        }

        // set odd and even
        var count = 0;
        for (var i = 0; i < that.list.length; i++) {
            var obj = that.main.objects[that.list[i]];
            if (!obj) continue;
            if (invisible.indexOf(that.list[i]) !== -1) continue;
            that.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').removeClass('instance-odd instance-even').addClass((count % 2) ? 'instance-odd' : 'instance-even');
            count++;
        }
    }

    function onQuickEditField(e) {
        var $this   = $(this);
        var id      = $this.data('instance-id');
        var attr    = $this.data('name');
        var options = $this.data('options');
        var oldVal  = $this.data('value');
        var textAlign = $this.css('text-align');
        $this.css('text-align', 'left');
        var states  = null;

        $this.unbind('click').removeClass('select-id-quick-edit').css('position', 'relative');

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

        $this.find('.select-id-quick-edit-cancel').click(function (e)  {
            if (timeout) clearTimeout(timeout);
            timeout = null;
            e.preventDefault();
            e.stopPropagation();
            if (oldVal === undefined) oldVal = '';
            $this.html(oldVal)
                .click(onQuickEditField)
                .addClass('select-id-quick-edit')
                .css('text-align', textAlign);
        });

        $this.find('.select-id-quick-edit-ok').click(function ()  {
            $this.trigger('blur');
        });

        $input.val(oldVal);

        $input.blur(function () {
            timeout = setTimeout(function () {
                var val = $(this).val();

                if (JSON.stringify(val) != JSON.stringify(oldVal)) {
                    var obj = {common: {}};
                    obj.common[attr] = $(this).val()
                    that.main.socket.emit('extendObject', id, obj, function (err) {
                        if (err) that.main.showError(err);
                    });


                    oldVal = '<span style="color: pink">' + oldVal + '</span>';
                }
                $this.html(oldVal)
                    .click(onQuickEditField)
                    .addClass('select-id-quick-edit')
                    .css('text-align', textAlign);
            }.bind(this), 100);
        }).keyup(function (e) {
            if (e.which == 13) $(this).trigger('blur');
            if (e.which == 27) {
                if (oldVal === undefined) oldVal = '';
                $this.html(oldVal)
                    .click(onQuickEditField)
                    .addClass('select-id-quick-edit')
                    .css('text-align', textAlign);
            }
        });

        if (typeof e === 'object') {
            e.preventDefault();
            e.stopPropagation();
        }

        setTimeout(function () {
            $input.focus().select();
        }, 100);
    }

    this.prepare = function () {
        this.$dialogConfig.dialog({
            autoOpen:   false,
            modal:      true,
            width:      830, //$(window).width() > 920 ? 920: $(window).width(),
            height:     536, //$(window).height() - 100, // 480
            closeOnEscape: false,
            open: function (event, ui) {
                that.$dialogConfig.css('padding', '2px 0px');
            },
            beforeClose: function () {
                if (window.frames['config-iframe'].changed) {
                    return confirm(_('Are you sure? Changes are not saved.'));
                }
                var pos  = $(this).parent().position();
                var name = $(this).data('name');
                that.main.saveConfig('adapter-config-top-' + name,  pos.top);
                that.main.saveConfig('adapter-config-left-' + name, pos.left);

                return true;
            },
            close: function () {
                // Clear iframe
                that.$configFrame.attr('src', '');
            },
            resize: function () {
                var name = $(this).data('name');
                that.main.saveConfig('adapter-config-width-'  + name, $(this).parent().width());
                that.main.saveConfig('adapter-config-height-' + name, $(this).parent().height() + 10);
            }
        });
        $('#instances-filter').change(function () {
            that.main.saveConfig('instancesFilter', $(this).val());
            applyFilter($(this).val());
        }).keyup(function () {
            if (that.filterTimeout) clearTimeout(that.filterTimeout);
            that.filterTimeout = setTimeout(function () {
                $('#instances-filter').trigger('change');
            }, 300);
        });
        if (that.main.config.instancesFilter && that.main.config.instancesFilter[0] != '{') {
            $('#instances-filter').val(that.main.config.instancesFilter);
        }

        //$('#load_grid-instances').show();
        $('#btn-instances-expert-mode').button({
            icons: {primary: 'ui-icon-person'},
            text:  false
        }).css({width: '1.5em', height: '1.5em'}).attr('title', _('_Toggle expert mode')).click(function () {
            that.main.config.expertMode = !that.main.config.expertMode;
            that.main.saveConfig('expertMode', that.main.config.expertMode);
            that.init(true);
            if (that.main.config.expertMode) {
                $('#btn-instances-expert-mode').addClass('ui-state-error');
            } else {
                $('#btn-instances-expert-mode').removeClass('ui-state-error');
            }
        });
        if (that.main.config.expertMode) $('#btn-instances-expert-mode').addClass('ui-state-error');

        $('#btn-instances-reload').button({
            icons: {primary: 'ui-icon-refresh'},
            text:  false
        }).css({width: '1.5em', height: '1.5em'}).attr('title', _('Update')).click(function () {
            that.init(true);
        });
        $('#btn-instances-form').button({
            icons: {primary: 'ui-icon-refresh'},
            text:  false
        }).css({width: '1.5em', height: '1.5em'}).attr('title', _('reload')).click(function () {
            that.main.config.instanceForm = that.main.config.instanceForm === 'tile' ? 'list' : 'tile';
            that.main.saveCell('expertMode', that.main.config.expertMode);
            that.init(true);
        });

        $('#instances-filter-clear').button({icons: {primary: 'ui-icon-close'}, text: false}).css({width: '1em', height: '1em'}).click(function () {
            $('#instances-filter').val('').trigger('change');
        });
    };

    this.replaceLink = function (_var, adapter, instance, elem) {
        _var = _var.replace(/\%/g, '');
        if (_var.match(/^native_/))  _var = _var.substring(7);
        // like web.0_port
        var parts;
        if (_var.indexOf('_') == -1) {
            parts = [
                adapter + '.' + instance,
                _var
            ]
        } else {
            parts = _var.split('_');
            // add .0 if not defined
            if (!parts[0].match(/\.[0-9]+$/)) parts[0] += '.0';
        }

        if (parts[1] == 'protocol') parts[1] = 'secure';

        if (_var == 'instance') {
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
                        if (parts[1] == 'secure') {
                            link = link.replace('%' + _var + '%', obj.native[parts[1]] ? 'https' : 'http');
                        } else {
                            if (link.indexOf('%' + _var + '%') == -1) {
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

    this.replaceLinks = function (vars, adapter, instance, elem) {
        if (typeof vars != 'object') vars = [vars];
        for (var t = 0; t < vars.length; t++) {
            this.replaceLink(vars[t], adapter, instance, elem);
        }
    };

    this._replaceLink = function (link, _var, adapter, instance, callback) {
        // remove %%
        _var = _var.replace(/\%/g, '');

        if (_var.match(/^native_/)) _var = _var.substring(7);
        // like web.0_port
        var parts;
        if (_var.indexOf('_') == -1) {
            parts = [adapter + '.' + instance, _var];
        } else {
            parts = _var.split('_');
            // add .0 if not defined
            if (!parts[0].match(/\.[0-9]+$/)) parts[0] += '.0';
        }

        if (parts[1] == 'protocol') parts[1] = 'secure';

        this.main.socket.emit('getObject', 'system.adapter.' + parts[0], function (err, obj) {
            if (obj && link) {
                if (parts[1] == 'secure') {
                    link = link.replace('%' + _var + '%', obj.native[parts[1]] ? 'https' : 'http');
                } else {
                    if (link.indexOf('%' + _var + '%') == -1) {
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

    this._replaceLinks = function (link, adapter, instance, arg, callback) {
        if (!link) {
            return callback(link, adapter, instance, arg);
        }
        var vars = link.match(/\%(\w+)\%/g);
        if (!vars) {
            return callback(link, adapter, instance, arg);
        }
        if (vars[0] == '%ip%') {
            link = link.replace('%ip%', location.hostname);
            this._replaceLinks(link, adapter, instance, arg, callback);
            return;
        }
        if (vars[0] == '%instance%') {
            link = link.replace('%instance%', instance);
            this._replaceLinks(link, adapter, instance, arg, callback);
            return;
        }
        this._replaceLink(link, vars[0], adapter, instance, function (link, adapter, instance) {
            this._replaceLinks(link, adapter, instance, arg, callback);
        }.bind(this));
    };

    this.init = function (update) {
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }

        if (this.main.currentHost && typeof this.$grid !== 'undefined' && (!this.$grid.data('inited') || update)) {
            this.$grid.data('inited', true);
            this.list.sort();
            var onlyWWW = [];
            // move all adapters with not onlyWWW and noConfig to the bottom
            for (var l = this.list.length - 1; l >= 0; l--) {
                if (this.main.objects[this.list[l]] &&
                    this.main.objects[this.list[l]].common &&
                    !this.main.objects[this.list[l]].common.localLink &&
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

    this.stateChange = function (id, state) {
        this.main.states[id] = state;
        if (this.$grid) {
            var parts = id.split('.');
            var last = parts.pop();
            id = parts.join('.');

            if (last === 'freemem') {
                // update total ram
                calculateFreeMem();
            } else if (last === 'memRss') {
                // update total ram
                calculateTotalRam();
                // update instance ram
                var $mem = $('.memUsage[data-instance-id="' + id + '"]');
                var mem = calculateRam(id);
                if ($mem.length && $mem.text() !== mem) {
                    $('.memUsage[data-instance-id="' + id + '"]').html('<span class="highlight">' + mem + '</span>');
                }
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
    };

    this.objectChange = function (id, obj) {
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
                } else {
                    if (id.indexOf('.web.') !== -1) {
                        if (this.updateTimer) clearTimeout(this.updateTimer);

                        this.updateTimer = setTimeout(function () {
                            that.updateTimer = null;
                            that.init(true);
                        }, 200);
                    } else {
                        // update just one line or
                        this.$grid.find('.instance-adapter[data-instance-id="' + id + '"]').html(showOneAdapter(this.$grid, id, this.main.config.instanceForm, true));
                    }
                }
            } else {
                var i = this.list.indexOf(id);
                if (i != -1) {
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

    this.initButtons = function (id) {
        id = id ? '[data-instance-id="' + id + '"]' : '';

        var $e = $('.instance-edit' + id).unbind('click').click(function () {
            that.onEdit($(this).attr('data-instance-id'));
        });

        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({
                icons: {primary: 'ui-icon-pencil'},
                text:  false
            }).css({width: '2em', height: '2em'}).attr('title', _('edit'));
        }

        $e = $('.instance-settings' + id).unbind('click')
            .click(function () {
                $iframeDialog = that.$dialogConfig;
                that.$configFrame.attr('src', $(this).attr('data-instance-href'));
                var name = $(this).attr('data-instance-id').replace(/^system\.adapter\./, '');
                var config = that.main.objects[$(this).attr('data-instance-id')];
                var width = 830;
                var height = 536;
                var minHeight = 0;
                var minWidth = 0;
                if (config.common.config) {
                    if (config.common.config.width)     width     = config.common.config.width;
                    if (config.common.config.height)    height    = config.common.config.height;
                    if (config.common.config.minWidth)  minWidth  = config.common.config.minWidth;
                    if (config.common.config.minHeight) minHeight = config.common.config.minHeight;
                }
                if (that.main.config['adapter-config-width-'  + name])  width = that.main.config['adapter-config-width-'  + name];
                if (that.main.config['adapter-config-height-' + name]) height = that.main.config['adapter-config-height-' + name];
                that.$dialogConfig.data('name', name);

                // Set minimal height and width
                that.$dialogConfig.dialog('option', 'minWidth',  minWidth).dialog('option', 'minHeight', minHeight);

                that.$dialogConfig
                    .dialog('option', 'title', _('Adapter configuration') + ': ' + name)
                    .dialog('option', 'width',  width)
                    .dialog('option', 'height', height)
                    .dialog('open');
                that.$dialogConfig.parent().find('.ui-widget-header button .ui-button-text').html('');

                if (that.main.config['adapter-config-top-'  + name])   that.$dialogConfig.parent().css({top:  that.main.config['adapter-config-top-' + name]});
                if (that.main.config['adapter-config-left-' + name])   that.$dialogConfig.parent().css({left: that.main.config['adapter-config-left-' + name]});
            });
        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({icons: {primary: 'ui-icon-note'}, text: false}).css({width: '2em', height: '2em'}).attr('title', _('config'));
        }
        $e.each(function () {
            var _id = $(this).attr('data-instance-id');
            if (main.objects[_id] && main.objects[_id].common && main.objects[_id].common.noConfig) {
                $(this).button('disable');
            }
        });

        $e = $('.instance-reload' + id).unbind('click')
            .click(function () {
                that.main.socket.emit('extendObject', $(this).attr('data-instance-id'), {}, function (err) {
                    if (err) that.main.showError(err);
                });
            });
        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({icons: {primary: 'ui-icon-refresh'}, text: false}).css({width: '2em', height: '2em'}).attr('title', _('reload'));
        }

        $e = $('.instance-del' + id).unbind('click')
            .click(function () {
                var id = $(this).attr('data-instance-id');
                if (that.main.objects[id] && that.main.objects[id].common && that.main.objects[id].common.host) {
                    that.main.confirmMessage(_('Are you sure?'), null, 'help', function (result) {
                        if (result) {
                            that.main.cmdExec(that.main.objects[id].common.host, 'del ' + id.replace('system.adapter.', ''), function (exitCode) {
                                if (!exitCode) that.main.tabs.adapters.init(true);
                            });
                        }
                    });
                }
            });
        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({icons: {primary: 'ui-icon-trash'}, text: false}).css({width: '2em', height: '2em'}).attr('title', _('delete'));
        } else {
            $e.button('enable');
        }

        $('.instance-image' + id).each(function () {
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
        $e = $('.instance-stop-run' + id).unbind('click')
            .click(function () {
                var id = $(this).attr('data-instance-id');
                $(this).button('disable');
                that.main.socket.emit('extendObject', id, {common: {enabled: !that.main.objects[id].common.enabled}}, function (err) {
                    if (err) that.main.showError(err);
                });
            });

        if (!$e.find('.ui-button-icon-primary').length) {
            $e.each(function () {
                var id = $(this).attr('data-instance-id');
                $e.button({icons: {primary: that.main.objects[id].common.enabled ? 'ui-icon-pause': 'ui-icon-play'}, text: false})
                    .css({width: '2em', height: '2em', 'background-color': that.main.objects[id].common.enabled ? 'lightgreen' : '#FF9999'})
                    .attr('title', that.main.objects[id].common.enabled ? _('Activated. Click to stop.') : _('Deactivated. Click to start.'));
            });
        }

        $e = $('.instance-web' + id).unbind('click')
            .click(function () {
                window.open($(this).attr('data-link'), $(this).attr('data-instance-id'));
            });
        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({icons: {primary: 'ui-icon-image'}, text: false}).css({width: '2em', height: '2em'}).attr('title', _('open web page'));
        } else {
            $e.button('enable');
        }
    };

    this.resize = function (width, height) {
        //this.$grid.setGridHeight(height - 150).setGridWidth(width);
    };
}
