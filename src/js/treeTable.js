(function ($) {
    'use strict';

    var ICON_MINIMAL_BASE64_SIZE = 512;

    if ($.fn.treeTable) return;

    function nodeExpand() {
        var id = this.id;
        var $table = this.row.parent().parent(); // table > tbody > tr
        var options = $table.data('options');

        if (options.name) {
            options.expanded = options.expanded || [];
            if (options.expanded.indexOf(id) === -1) {
                options.expanded.push(id);
                if (typeof Storage !== 'undefined') {
                    window.localStorage.setItem(options.name + '-treetable', JSON.stringify(options.expanded));
                }
            }
        }

        var parentNode = $table.treetable('node', id);
    }

    function nodeCollapse() {
        var id = this.id;
        var $table = this.row.parent().parent(); // table > tbody > tr
        var options = $table.data('options');

        if (options.name && options.expanded) {
            var pos = options.expanded.indexOf(id);
            if (pos !== -1) {
                options.expanded.splice(pos, 1);
                if (typeof Storage !== 'undefined') {
                    window.localStorage.setItem(options.name + '-treetable', JSON.stringify(options.expanded));
                }
            }
        }

        var parentNode = $table.treetable('node', id);
    }

    function filter($table, word) {
        if (word) {
            word = word.toLowerCase();
            var options = $table.data('options');
            $table.find('tr').each(function () {
                if ($(this).hasClass('tree-table-main-header')) return;

                if (!$(this).data('tt-branch') && $(this).find('td:first-child').text().indexOf(word) === -1) {
                    $(this).addClass('filtered-out');
                } else {
                    $(this).removeClass('filtered-out');
                }
            });
            var branch = '';
            var isOneVisible = false;
            // hide branches without children
            $table.find('tr').each(function () {
                if ($(this).data('tt-branch')) {
                    if (branch) {
                        if (!isOneVisible) {
                            $table.find('tr[data-tt-id="' + branch + '"]').addClass('filtered-out');
                        } else {
                            $table.find('tr[data-tt-id="' + branch + '"]').removeClass('filtered-out');
                        }
                    }
                    isOneVisible = false;
                    branch = $(this).data('tt-id');
                } else if (branch) {
                    if (!$(this).hasClass('filtered-out')) isOneVisible = true;
                }
            });
            if (branch) {
                if (!isOneVisible) {
                    $table.find('tr[data-tt-id="' + branch + '"]').addClass('filtered-out');
                } else {
                    $table.find('tr[data-tt-id="' + branch + '"]').removeClass('filtered-out');
                }
            }
        } else {
            $table.find('tr').removeClass('filtered-out');
        }
    }

    function processMoveTasks(options, tasks, callback) {
        if (!tasks || !tasks.length) {
            callback && callback();
            return;
        }
        var task = tasks.shift();

        options.moveId && options.moveId(task.oldId, task.newId, function (err) {
            setTimeout(function () {
                processMoveTasks(options, tasks, callback);
            }, 50);
        });
    }

    function buildList(options, noButtons) {
        var table = noButtons ? '' : '<div class="treetablelist-buttons"><button class="treetable-list-btn-ok"></button><button class="treetable-list-btn-cancel"></button></div>';
        table += '<ul class="treetable-list">';
        var rows = options.rows;
        for (var i = 0; i < rows.length; i++) {
            var parents = 0;
            var current = rows[i];
            while (current.parent) {
                var found = false;
                for (var j = 0; j < rows.length; j++) {
                    if (rows[j].id === current.parent) {
                        current = rows[j];
                        found = true;
                        break;
                    }
                }
                if (!found) break;
                parents++;
            }
            var isNotFolder = rows[i].instance === undefined ? 0 : 1;
            table += '<li data-id="' + rows[i].id + '" class="' + (!isNotFolder ? 'treetable-list-folder' : 'treetable-list-item') + '" style="margin-left: ' + (parents * 19) + 'px; width: calc(100% - ' + (parents * 15 + 2 + isNotFolder * 7) + 'px);' +
            (rows[i].id === 'script.js.global' ? 'color: rgb(0, 128, 0);' : '') + '">' +
            (!isNotFolder ? '<span class="fancytree-expander"></span>' : '') + '<span class="fancytree-icon"></span>' + rows[i].title + '</li>';
        }
        table += '</ul>';
        var $dlg = $(this);
        var $table = $(table);

        $dlg.find('.treetablelist-buttons').remove();
        $dlg.find('.treetable-list').remove();
        $dlg.find('.tree-table-buttons').remove();
        $dlg.find('.tree-table-main').remove();
        $dlg.prepend($table);

        var $buttons = $($table).find('.treetablelist-buttons');
        var $list    = $($table).find('.treetable-list');

        $list.sortable({
            cancel: '.treetable-list-folder',
            axis:   'y'
        }).data('options', options);

        var that = this;

        $buttons.find('.treetable-list-btn-ok').button({
            icons: {primary: 'ui-icon-check'},
            text: false
        })
        .css({width: 24, height: 24})
        .click(function () {
            // analyse new structure
            var currentFolder = '';
            var tasks = [];
            $list.find('li').each(function () {
                var id = $(this).data('id');
                if ($(this).hasClass('treetable-list-folder')) {
                    currentFolder = id;
                } else {
                    var parts = id.split('.');
                    var name = parts.pop();
                    if (parts.join('.') !== currentFolder) {
                        tasks.push({oldId: id, newId: currentFolder + '.' + name});
                    }
                }
            });
            processMoveTasks(options, tasks, function () {
                buildTable.call(that, options);
            });
        });
        $buttons.find('.treetable-list-btn-cancel').button({
            icons: {primary: 'ui-icon-cancel'},
            text: false
        })
        .css({width: 24, height: 24})
        .click(function () {
            buildTable.call(that, options);
        });
    }

    function getIcon(objects, id, imgPath) {
        var icon     = '';
        var alt      = '';
        var obj      = objects[id];
        var isCommon = obj && obj.common;

        if (isCommon) {
            if (isCommon.icon) {
                if (isCommon.icon.length < ICON_MINIMAL_BASE64_SIZE) {
                    var instance;
                    if (obj.type === 'instance') {
                        icon = '/adapter/' + obj.common.name + '/' + obj.common.icon;
                    } else if (id.match(/^system\.adapter\./)) {
                        instance = node.key.split('.', 3);
                        if (obj.common.icon[0] === '/') {
                            instance[2] += obj.common.icon;
                        } else {
                            instance[2] += '/' + obj.common.icon;
                        }
                        icon = '/adapter/' + instance[2];
                    } else {
                        instance = id.split('.', 2);
                        if (obj.common.icon[0] === '/') {
                            instance[0] += obj.common.icon;
                        } else {
                            instance[0] += '/' + obj.common.icon;
                        }
                        icon = '/adapter/' + instance[0];
                    }
                } else {
                    icon = isCommon.icon;
                }
                alt = obj.type;
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

        if (icon) return '<img class="treetable-icon" src="' + icon + '" alt="' + alt + '" />';
        return '';
    }

    function buildTable(options) {
        var table = '';
        var buttonTag = typeof Materialize === 'undefined' ? 'button' : 'a';
        if (options.panelButtons) {
            table += '<div class="row tree-table-buttons m">';
            for (var z = 0; z < options.panelButtons.length; z++) {
                table += '<' + buttonTag + ' class="btn-floating waves-effect waves-light blue btn-custom-' + z + '" title="' + (options.panelButtons[z].title || '') + '" ' + (options.panelButtons[z].id ? 'id="' + options.panelButtons[z].id + '"' : '') + '>';
                if (typeof Materialize !== 'undefined') {
                    table += '<i class="material-icons">' + (options.panelButtons[z].icon || '') + '</i>';
                }
                table += '</' + buttonTag + '>';
            }
            if (options.moveId) {
                table += '<' + buttonTag + ' class="btn-floating waves-effect waves-light blue treetable-sort" title="' + _('reorder') + '">';
                if (typeof Materialize !== 'undefined') {
                    table += '<i class="material-icons">import_export</i>';
                }
                table += '</' + buttonTag + '>';
            }
            table += '</div>';
        }

        // build header
        table += '<div class="row tree-table-body"><table class="tree-table-main">';
        table += '  <thead>';
        table += '      <tr class="tree-table-main-header">';
        var withMembers = false;
        var withIcons   = false;
        var withColors  = false;
        for (var ch = 0; ch < options.columns.length; ch++) {
            if (options.columns[ch] === 'members' ) {
                withMembers = true;
                continue;
            }
            if (options.columns[ch] === 'icon' ) {
                withIcons = true;
                continue;
            }
            if (options.columns[ch] === 'color' ) {
                withColors = true;
                continue;
            }
            if (options.columns[ch] === 'name') {
                table += '      <th' + (options.widths && options.widths[ch] ? ' class="treetable-th-name" style="width: ' + options.widths[ch] + '"' : '') + '>';
                table += '          <input placeholder="' + _('name') + '" class="filter_name treetable-filter" />';
                table += '          <button data-id="filter_name" role="button" class="filter-clear"></button>';
                table += '      </th>';
            } else {
                table += '      <th' + (options.widths && options.widths[ch] ? ' style="width: ' + options.widths[ch] + '"' : '') + '>' + _(options.columns[ch]) + '</th>';
            }
        }
        if (options.buttons) {
            table += '      <th' + (options.buttonsWidth ? ' style="width: ' + options.buttonsWidth + '"' : '') + '></th>';
        }
        table += '  </tr>';
        table += '</thead>';
        // build body
        table += '<tbody>';

        // <tr data-tt-id="system.adapter.0" data-tt-branch='true'>
        var rows        = [];
        var rootEx      = options.root ? new RegExp('^' + options.root.replace(/\./g, '\\.') + '\\.') : null;
        var instances   = options.columns.indexOf('instance') !== -1 ? [] : null;

        for (var id in options.objects) {
            if (!options.objects.hasOwnProperty(id)) continue;
            var m;
            if (instances && options.objects[id].type === 'instance' &&
                (m = id.match(/^system\.adapter\.javascript\.(\d+)$/))) {
                instances.push(m[1]);
            }

            if (rootEx && !rootEx.test(id)) continue;
            var common = options.objects[id].common;

            var obj = {
                id:     id,
                parent: null,
                _class: 'treetable-' + options.objects[id].type
            };

            if (options.objects[id].type === 'channel') {
                obj.folder = true;
            }
            for (var cb = 0; cb < options.columns.length; cb++) {
                if (options.columns[cb] === 'icon') {
                    continue;
                }
                if (options.columns[cb] === 'instance') {
                    if (options.objects[id].type === 'script') {
                        obj.instance = common ? common.engine.split('.').pop() : 0;
                    }
                } else if (common && options.columns[cb] !== 'id') {
                    var val = common[options.columns[cb]];
                    if (val !== undefined) {
                        obj[options.columns[cb]] = val;
                    }
                }
            }

            rows.push(obj);
        }

        // sort
        rows.sort(function (a, b) {
            if (a.id > b.id) return 1;
            if (a.id < b.id) return -1;
            return 0;
        });

        // find parents and extend members
        for (var pp = 0; pp < rows.length; pp++) {
            // find parent:
            var parts  = rows[pp].id.split('.');
            var title  = parts.pop();
            var parent = parts.join('.');
            rows[pp].title = title;
            for (var p = 0; p < rows.length; p++) {
                if (rows[p].id === parent) {
                    rows[pp].parent = parent;
                    rows[p].children = rows[p].children || [];
                    rows[p].children.push(pp);
                    break;
                }
            }

            if (parts.length === 1) {
                rows[pp]._class += ' treetable-root'
            }

        }
        for (var ppp = 0; ppp < rows.length; ppp++) {
            rows[ppp].realChildren = rows[ppp].children ? !!rows[ppp].children.length : false;
        }

        if (withMembers) {
            for (var k = rows.length - 1; k >= 0; k--) {
                // extend members
                if (rows[k].members) {
                    rows[k].children = rows[k].children || [];
                    var members = Object.assign([], rows[k].members);
                    members.sort();
                    for (var mm = 0; mm < members.length; mm++) {
                        obj = {
                            id:     members[mm],
                            title:  members[mm],
                            parent: rows[k].id,
                            _class: 'treetable-member'
                        };
                        rows[k].children.push(members[mm]);

                        if (options.objects[obj.id]) {
                            var ccommon = options.objects[obj.id].common;
                            if (ccommon) {
                                for (var ccb = 0; ccb < options.columns.length; ccb++) {
                                    var attr = options.columns[ccb];
                                    if (attr === 'members' || attr === 'id' || attr === 'title' || attr === 'icon') continue;
                                    var vval = ccommon[options.columns[ccb]];
                                    if (vval !== undefined) {
                                        obj[attr] = vval;
                                    }
                                }
                            }
                        }
                        rows.splice(k + 1, 0, obj);
                    }
                    delete rows[k].members;
                }
            }
        }

        var instSelect = '';

        for (var i = 0; i < rows.length; i++) {
            // title
            table += '<tr data-tt-id="' + rows[i].id + '"' + (!!rows[i].children ? ' data-tt-branch="true"' : '') + (rows[i].parent ? ' data-tt-parent-id="' + rows[i].parent + '"' : '') + ' class="';
            if (rows[i]._class) {
                table += rows[i]._class + ' ';
            }
            if (rows[i].children && rows[i].children.length) {
                table += 'not-empty';
            } else {
                table += 'is-empty';
            }

            table += '">';
            for (var c = 0; c < options.columns.length; c++) {
                var aattr = options.columns[c];
                if (aattr === 'members' || aattr === 'icon' || aattr === 'color') {
                    continue;
                }
                var style = '';
                var _class = (options.classes && options.classes[c]) || '';
                if (!c && withColors && rows[i].color) {
                    style = 'background: ' + rows[i].color + ';';
                }
                if (!c && rows[i].hasOwnProperty('children')) {
                    _class += ' treetable-folder fancytree-exp-c fancytree-has-children fancytree-ico-cf';
                    if (rows[i].id === 'script.js.global') {
                        style += ' color: rgb(0, 128, 0);'
                    } else {
                        style += ' color: rgb(0, 0, 128);'
                    }
                    table += '<td style="' + style + '" class="' + _class + '">';
                    if (rows[i].children && rows[i].children.length) {
                        table += '<span class="treetable-counter">' + rows[i].children.length + '</span>';
                    }
                } else {
                    table += '<td style="' + style + '" class="' + _class + '">';
                }
                if (!c && withIcons) {
                    table += getIcon(options.objects, rows[i].id, options.imgPath);
                }
                // edit instance
                if (aattr === 'instance') {
                    if (rows[i].instance !== undefined && instances.length > 1) {
                        instSelect = '<select class="treetable-instance" data-id="' + rows[i].id + '">';
                        for (var ii = 0; ii < instances.length; ii++) {
                            instSelect += '<option value="' + instances[ii] + '" ' + (instances[ii] === rows[i].instance ? 'selected' : '') + '>' + instances[ii] + '</option>';
                        }
                        instSelect += '</select>';

                        table += instSelect;
                    } else {
                        table += '<span>' + (rows[i].instance === undefined ? '' : rows[i].instance) + '</span>';
                    }
                } else if (aattr === 'icon') {
                    table += getIcon(options.objects, rows[i].id, options.imgPath);
                } else {
                    table += '<span>' + (rows[i][aattr] || '') + '</span>';
                }
                table += '</td>';
            }
            // add buttons
            if (options.buttons) {
                table += '<td class="treetable-buttons" style="' + (options.buttonsStyle || '') + '">';
                var text = '';
                for (var jj = 0; jj < options.buttons.length; jj++) {
                    if (options.buttons[jj].match && !options.buttons[jj].match(rows[i].id)) {
                        text += '<div class="treetable-button-empty">&nbsp;</div>';
                    } else {
                        text += '<' + buttonTag + ' data-id="' + rows[i].id + '" class="select-button-' + jj + ' select-button-custom td-button"  style="margin-right: 3px;'+ '" data-parent="' + rows[i].parent + '" data-children="' + !!rows[i].realChildren + '" title="' + (options.buttons[jj].title || '') + '">';
                        if (typeof Materialize !== 'undefined') {
                            text += '<i class="material-icons">' + (options.buttons[jj].icon || '') + '</i>';
                        }
                        text += '</' + buttonTag + '>';
                    }
                }

                table += text + '</td>';
            }

            table += '</tr>';
        }
        table += '</body>';

        var $dlg = $(this);
        var $table = $(table);

        $dlg.find('span:first-child').remove();
        $dlg.find('.treetablelist-buttons').remove();
        $dlg.find('.treetable-list').remove();
        $dlg.find('.tree-table-buttons').remove();
        $dlg.find('.tree-table-main').remove();

        $dlg.prepend($table);
        options.rows = rows;
        var $treeTable = $($table[1]).find('>table');
        var $buttons   = $($table[0]);

        $treeTable.data('options', options);

        $treeTable.treetable({
            expandable:         true,
            clickableNodeNames: true,
            expanderTemplate:   '',
            indenterTemplate:   '<span class="fancytree-expander"></span><span class="fancytree-icon"></span>',
            onNodeExpand:       nodeExpand,
            onNodeCollapse:     nodeCollapse,
            stringCollapse:     _('collapse'),
            stringExpand:       _('expand')
        });

        var $tbody = $treeTable.find('tbody');

        $tbody.on('mousedown', 'tr', function() {
            $('.selected').not(this).removeClass('selected');
            $(this).addClass('selected');
            var $table = $(this).parent().parent();
            var options = $table.data('options');
            var id = $(this).data('tt-id');
            options.onChange && options.onChange($(this).data('tt-id'), options.oldId);
            options.oldId = id;
        });

        if (options.buttons) {
            for (var b = 0; b < options.buttons.length; b++) {
                var $btn = $tbody.find('.select-button-' + b).button(options.buttons[b]).click(function () {
                    var cb = $(this).data('callback');
                    if (cb) {
                        cb.call($(this), $(this).data('id'), $(this).data('children'), $(this).data('parent'));
                    }
                }).data('callback', options.buttons[b].click).attr('title', options.buttons[b].title || '');

                if ($btn.length === 0) continue;
                if (options.buttons[b].width)  $btn.css({width:  options.buttons[b].width});
                if (options.buttons[b].height) $btn.css({height: options.buttons[b].height});
                if (options.buttons[b].match) {
                    $btn.each(function () {
                        options.buttons[b].match.call($(this), $(this).data('id'));
                    });
                }
            }
        }

        if (options.panelButtons) {
            for (var zz = 0; zz < options.panelButtons.length; zz++) {
                var $zz = $buttons.find('.btn-custom-' + zz);
                $zz
                    .click(options.panelButtons[zz].click)
                    .attr('title', options.panelButtons[zz].title || '');

                if (typeof Materialize === 'undefined') {
                    $zz
                        .button(options.panelButtons[zz])
                        .css({width: 24, height: 24})
                }
            }
        }

        $treeTable.find('.filter_name').change(function () {
            var timer = $(this).data('timer');
            if (timer) {
                clearTimeout(timer);
            }
            var $this = $(this);
            $this.data('timer', setTimeout(function () {
                $this.data('timer', null);
                var val = $table.find('.filter_name').val();
                if (val) {
                    $this.addClass('input-not-empty');
                } else {
                    $this.removeClass('input-not-empty');
                }
                filter($($table[1]), $table.find('.filter_name').val());
            }));
        }).keyup(function () {
            $(this).trigger('change');
        });
        $treeTable.find('.filter-clear')
            .button({icons: {primary: 'ui-icon-close'}, text: false})
            .click(function () {
                var name = $(this).data('id');
                $table.find('.' + name).val('').trigger('change');
            });
        var that = this;
        $buttons.find('.treetable-sort')
            .button({icons: {primary: 'ui-icon-arrowthick-2-n-s'}, text: false})
            .css({width: 24, height: 24})
            .click(function () {
                buildList.call(that, options);
            });

        if (options.onEdit) {
            $treeTable.find('.treetable-instance').change(function () {
                options.onEdit($(this).data('id'), 'instance', $(this).val());
            });
        } else {
            $treeTable.find('.treetable-instance').prop('disabled', true)
        }
        if (typeof options.onReady === 'function') {
            options.onReady($treeTable);
        }
    }

    function reInit() {
        var $table = $(this).find('.tree-table-main');
        // remember selected
        var id = $table.find('.selected').data('tt-id');
        var expanded = $table.find('.expanded');
        var exIDs = [];
        expanded.each(function (el) {
            exIDs.push($(this).data('tt-id'));
        });
        var nameFilter = $table.find('.filter_name').val();
        var options = $table.data('options');
        buildTable.call(this, options);
        $table = $(this).find('.tree-table-main');
        for (var e = 0; e < exIDs.length; e++) {
			try {
                $table.treetable('expandNode', exIDs[e]);
			} catch (e) {
			}
        }
        if (id) {
            var node = $table.treetable('node', id);
            node && $table.treetable('reveal', id);
            node && node.row && node.row.addClass('selected');
        }
        if (nameFilter) $table.find('.filter_name').val(nameFilter).trigger('change');
    }

    var methods = {
        init: function (options) {
            options.imgPath = options.imgPath || 'lib/css/fancytree/';
            for (var i = 0; i < this.length; i++) {
                buildTable.call(this[i], options);

                if (typeof Storage !== 'undefined') {
                    var exIDs = window.localStorage.getItem(options.name + '-treetable');
                    if (exIDs) {
                        exIDs = JSON.parse(exIDs);
                        var $table = $(this[i]).find('.tree-table-main');
                        for (var e = 0; e < exIDs.length; e++) {
							try {
								$table.treetable('expandNode', exIDs[e]);
							} catch (e) {
							}
                        }
                    }
                }
            }
            return this;
        },
        destroy: function () {
            for (var i = 0; i < this.length; i++) {
                var $table = $(this[i]).find('.tree-table-main');
                if ($table.length && $table.data('options')) {
                    $table.data('options', null);
                    $(this[i]).html('');
                }
            }
        },
        expand: function (id) {
            for (var i = 0; i < this.length; i++) {
                var $table = $(this[i]).find('.tree-table-main');
                try {
                    if (id) {
                        $table.treetable('expandNode', id);
                    } else {
                        $table.treetable('expandAll', id);
                    }
                } catch (e) {
                }
            }
        },
        collapse: function (id) {
            for (var i = 0; i < this.length; i++) {
                var $table = $(this[i]).find('.tree-table-main');
                try {
                    if (id) {
                        $table.treetable('collapseNode', id);
                    } else {
                        $table.treetable('collapseAll');
                    }

                } catch (e) {
                }
            }
        },
        show: function (currentId, filter, onSuccess) {
            if (typeof filter === 'function') {
                onSuccess = filter;
                filter = undefined;
            }
            if (typeof currentId === 'function') {
                onSuccess = currentId;
                currentId = undefined;
            }
            for (var i = 0; i < this.length; i++) {
                var $table = $(this[i]).find('.tree-table-main');
                $table.find('.selected').removeClass('selected');
				try {
					$table.treetable('reveal', currentId);
				} catch (e) {
				}
                var node = $table.treetable('node', currentId);
                node && node.row.addClass('selected');
            }
            onSuccess && onSuccess();
            return this;
        },
        reinit: function () {
            for (var i = 0; i < this.length; i++) {
                reInit.call(this[i]);
            }
            return this;
        },
        'object': function (id, obj) {
            for (var i = 0; i < this.length; i++) {
                var $table = $(this[i]).find('.tree-table-main');
                if ($table.updateTimer) {
                    clearTimeout($table.updateTimer);
                }
                var options = $table.data('options');
                if (options && options.root && !id.match('^' + options.root.replace(/\./g, '\\.') + '\\.')) continue;

                var elem = this[i];
				// do not update too often. de-bounce it
                (function (_elem, _$table) {
                    _$table.updateTimer = setTimeout(function () {
                        reInit.call(_elem);
                    }, 300);
                })(elem, $table);
            }
            return this;
        }
    };

    $.fn.treeTable = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method "' +  method + '" not found in jQuery.treeTable');
        }
    };
})(jQuery);