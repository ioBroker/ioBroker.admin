/**
 * Create edit table from javascript array.
 *
 * This function creates a html edit table.
 *
 * <pre><code>
 *   <div id="values" style="width: 100%; height: calc(100% - 205px)">
 *      <button class="table-button-add" style="margin-left: 10px"></button>
 *      <div style="width: 100%; height: calc(100% - 30px); overflow: auto;">
 *          <table class="table-values" style="width: 100%;">
 *              <thead>
 *                  <tr>
 *                      <th data-name="_index" style="30px" data-style="width: 100%; text-align: right">Context</th>
 *                      <th data-name="regex"     class="translate" style="width: 30%" data-style="text-align: right">Context</th>
 *                      <th data-name="room"      class="translate" data-type="select">Room</th>
 *                      <th data-name="aaa"       class="translate" data-options="1/A;2/B;3/C;4" data-type="select">Room</th>
 *                      <th data-name="enabled"   class="translate" data-type="checkbox">Enabled</th>
 *                      <th data-buttons="delete up down" style="width: 32px"></th>
 *                  </tr>
 *              </thead>
 *          </table>
 *      </div>
 *   </div>
 * </pre></code>
 *
 * @param {string} divId name of the html element (or empty).
 * @param {string} values data array
 * @param {object} options settings
 *  <pre><code>
 *      {
 *          onChange: this function will be called if something changed. function (attr, index) {}
 *          onReady: called, when the table is ready (may be to modify some elements of it),
 *          maxRaw: maximal number of rows
 *      }
 *  </pre></code>
 * @return {object} array with values
 */
function values2table(divId, values, options) {
    if (typeof divId === 'object') {
        options = values;
        values = divId;
        divId    = '';
    }
    var maxRaw   = (options && options.maxRaw) || null;
    var onChange = (options && options.onChange) || null;
    var onReady  = (options && options.onReady) || null;

    values = values || [];
    var names = [];
    var $div;
    if (!divId) {
        $div = $('body');
    } else {
        $div = $('#' + divId);
    }
    var $add = $div.find('.table-button-add');
    $add.data('raw', values.length);

    if (maxRaw) {
        $add.data('maxRaw', maxRaw);
    }

    if (!$add.data('inited')) {
        $add.data('inited', true);

        // var addText = $add.text();

        $add.on('click', function () {
            if (!$add.data('maxRaw') || ($add.data('raw') < $add.data('maxRaw'))) {
                var $table = $div.find('.table-values');
                var values = $table.data('values');
                var names  = $table.data('names');
                var maxRaw = $table.data('maxRaw');
                var obj = {};
                for (var i = 0; i < names.length; i++) {
                    if (!names[i]) continue;
                    obj[names[i].name] = names[i].def;
                }
                values.push(obj);
                onChange && onChange();
                setTimeout(function () {
                    values2table(divId, values, onChange, onReady, maxRaw);
                }, 100);
                $add.data('raw', $add.data('raw') + 1);
            } else {
                confirmMessage(_('maxTableRaw') + ': ' + $add.data('maxRaw'), _('maxTableRawInfo'), 'alert', ['Ok']);
            }
        });
    }

    if (values) {
        var buttons = [];
        var $table = $div.find('.table-values');
        $table.data('values', values);

        // load rooms
        if (!$table.data('rooms') && $table.find('th[data-name="room"]').length) {
            getEnums('rooms', function (err, list) {
                var result = {};
                var trRooms = _('nonerooms');
                if (trRooms !== 'nonerooms') {
                    result[_('none')] = trRooms;
                } else {
                    result[_('none')] = '';
                }
                var nnames = [];
                for (var n in list) {
                    if (list.hasOwnProperty(n)) {
                        nnames.push(n);
                    }
                }
                nnames.sort(function (a, b) {
                    a = a.toLowerCase();
                    b = b.toLowerCase();
                    if (a > b) return 1;
                    if (a < b) return -1;
                    return 0;
                });

                for (var l = 0; l < nnames.length; l++) {
                    result[nnames[l]] = list[nnames[l]].common.name || l;
                }
                $table.data('rooms', result);
                values2table(divId, values, onChange, onReady, maxRaw);
            });
            return;
        }
        // load functions
        if (!$table.data('functions') && $table.find('th[data-name="func"]').length) {
            getEnums('functions', function (err, list) {
                var result = {};
                var trFuncs = _('nonefunctions');
                if (trFuncs !== 'nonefunctions') {
                    result[_('none')] = trFuncs;
                } else {
                    result[_('none')] = '';
                }

                var nnames = [];
                for (var n in list) {
                    if (list.hasOwnProperty(n)) {
                        nnames.push(n);
                    }
                }
                nnames.sort(function (a, b) {
                    a = a.toLowerCase();
                    b = b.toLowerCase();
                    if (a > b) return 1;
                    if (a < b) return -1;
                    return 0;
                });

                for (var l = 0; l < nnames.length; l++) {
                    result[nnames[l]] = list[nnames[l]].common.name || l;
                }
                $table.data('functions', result);
                values2table(divId, values, onChange, onReady, maxRaw);
            });
            return;
        }
        $table.find('th').each(function () {
            var name = $(this).data('name');
            if (name) {
                var obj = {
                    name:    name,
                    type:     $(this).data('type') || 'text',
                    def:      $(this).data('default'),
                    'class':  ($(this).attr('class') || '').replace('translate', ''),
                    style:    $(this).data('style'),
                    readOnly: $(this).data('readOnly'),
                    tdstyle:  $(this).data('tdstyle')
                };
                if (obj.type === 'checkbox') {
                    if (obj.def === 'false') obj.def = false;
                    if (obj.def === 'true')  obj.def = true;
                    obj.def = !!obj.def;
                } else if (obj.type === 'select' || obj.type === 'select multiple') {
                    var vals = ($(this).data('options') || '').split(';');
                    obj.options = {};
                    for (var v = 0; v < vals.length; v++) {
                        var parts = vals[v].split('/');
                        obj.options[parts[0]] = _(parts[1] || parts[0]);
                        if (v === 0) obj.def = (obj.def === undefined) ? parts[0] : obj.def;
                    }
                } else {
                    obj.def = obj.def || '';
                }
                names.push(obj);
            } else {
                names.push(null);
            }

            name = $(this).data('buttons');

            if (name) {
                buttons.push({
                    btn:        name.split(' '),
                    'class':    ($(this).attr('class') || '').replace('translate', ''),
                    style:      $(this).data('style'),
                    tdstyle:    $(this).data('tdstyle')
                });
            } else {
                buttons.push(null);
            }
        });

        $table.data('names', names);

        var text = '';
        for (var v = 0; v < values.length; v++) {
            var idName = values[v] && values[v].id;
            if (!idName && values[v]) {
                if (names[0] === '_index') {
                    idName = values[v][names[1]];
                } else {
                    idName = values[v][names[0]];
                }
            }
            text += '<tr data-id="' + idName + '" data-index="' + v + '">';

            for (var i = 0; i < names.length; i++) {
                text += '<td';
                var line    = '';
                var style   = '';
                var tdstyle = '';
                if (names[i]) {
                    if (names[i]['class']) {
                        text += ' class="' + names[i]['class'] + '" ';
                    }
                    if (names[i].name !== '_index') {
                        tdstyle = names[i].tdstyle || '';
                        if (tdstyle && tdstyle[0] !== ';') tdstyle = ';' + tdstyle;
                    }
                    if (names[i].name === '_index') {
                        style = (names[i].style ? names[i].style : 'text-align: right;');
                        line += (v + 1);
                    } else if (names[i].type === 'checkbox') {
                        line += '<input style="' + (names[i].style || '') + '" class="values-input" type="checkbox" data-index="' + v + '" data-name="' + names[i].name + '" ' + (values[v][names[i].name] ? 'checked' : '') + '" data-old-value="' + (values[v][names[i].name] === undefined ? '' : values[v][names[i].name]) + '"/>';
                    } else if (names[i].type.substring(0, 6) === 'select') {
                        line += (names[i].type.substring(7, 16) === 'multiple' ? '<select multiple style="' : '<select style="') + (names[i].style ? names[i].style : 'width: 100%') + '" class="values-input" data-index="' + v + '" data-name="' + names[i].name + '">';
                        var options;
                        if (names[i].name === 'room') {
                            options = $table.data('rooms');
                        } else if (names[i].name === 'func') {
                            options = $table.data('functions');
                            if (names[i].type === 'select multiple') delete options[_('none')];
                        } else {
                            options = names[i].options;
                        }

                        var val = (values[v][names[i].name] === undefined ? '' : values[v][names[i].name]);
                        if (typeof val !== 'object') val = [val];
                        for (var p in options) {
                            line += '<option value="' + p + '" ' + (val.indexOf(p) !== -1 ? ' selected' : '') + '>' + options[p] + '</option>';
                        }
                        line += '</select>';
                    } else {
                        line += '<input class="values-input" style="' + (names[i].style ? names[i].style : 'width: 100%') + '" type="' + names[i].type + '" data-index="' + v + '" data-name="' + names[i].name + '"/>';
                    }
                }

                if (buttons[i]) {
                    style = 'text-align: center; ' + (buttons[i].style || '') + (buttons[i].tdstyle || '');
                    for (var b = 0; b < buttons[i].btn.length; b++) {
                        if ((!v && buttons[i].btn[b] === 'up') || v === values.length - 1 && buttons[i].btn[b] === 'down') {
                            line += '<a class="btn-floating disabled" data-command="' + buttons[i].btn[b] + '" class="values-buttons"><i class="material-icons"></i></a>';
                            continue;
                        }
                        line += '<a class="btn-floating" data-index="' + v + '" data-command="' + buttons[i].btn[b] + '" class="values-buttons"><i class="material-icons"></i></a>';
                    }
                    if (buttons[i]['class']) {
                        text += ' class="' + buttons[i]['class'] + '" ';
                    }
                }
                if (style.length || tdstyle.length) {
                    text += ' style="' + style + tdstyle + '">' + line + '</td>';
                } else {
                    text += '>' + line + '</td>';
                }
            }

            text += '</tr>';
        }
        var $lines = $table.find('.table-lines');
        if (!$lines.length) {
            $table.append('<tbody class="table-lines"></tbody>');
            $lines = $table.find('.table-lines');
        }

        $lines.html(text);

        $lines.find('.values-input').each(function () {
            var $this = $(this);
            var type = $this.attr('type');
            var name = $this.data('name');
            var id   = $this.data('index');
            $this.data('old-value', values[id][name]);
            if (type === 'checkbox') {
                $this.prop('checked', values[id][name]);
            } else {
                $this.val(values[id][name]);
            }
        });
        $lines.find('a[data-command]').each(function () {
            var command = $(this).data('command');
            if (command === 'delete') {
                $(this).on('click', function () {
                    var id = $(this).data('index');
                    var elem = values[id];
                    values.splice(id, 1);
                    onChange && onChange();

                    setTimeout(function () {
                        if (typeof tableEvents === 'function') {
                            tableEvents(id, elem, 'delete');
                        }

                        values2table(divId, values, onChange, onReady, maxRaw);
                    }, 100);

                    if ($add.data('maxRaw')) {
                        $add.data('raw', $add.data('raw') - 1);
                    }
                })
                .addClass('red')
                    .find('.material-icons')
                    .html('delete');
            } else if (command === 'up') {
                $(this).on('click', function () {
                        var id = $(this).data('index');
                        var elem = values[id];
                        values.splice(id, 1);
                        values.splice(id - 1, 0, elem);
                        onChange && onChange();
                        setTimeout(function () {
                            values2table(id, values, onChange, onReady, maxRaw);
                        }, 100);
                    }).find('i').html('arrow_upward');
            } else if (command === 'down') {
                $(this).on('click', function () {
                        var id = $(this).data('index');
                        var elem = values[id];
                        values.splice(id, 1);
                        values.splice(id + 1, 0, elem);
                        onChange && onChange();
                        setTimeout(function () {
                            values2table(id, values, onChange, onReady, maxRaw);
                        }, 100);
                    }).find('i').html('arrow_downward');
            } else if (command === 'pair') {
                $(this).on('click', function () {
                        if (typeof tableEvents === 'function') {
                            var id = $(this).data('index');
                            var elem = values[id];
                            tableEvents(id, elem, 'pair');
                        }
                    }).attr('title', _('pair')).find('i').html('insert_link');
            } else if (command === 'unpair') {
                $(this).on('click', function () {
                        if (typeof tableEvents === 'function') {
                            var id = $(this).data('index');
                            var elem = values[id];
                            tableEvents(id, elem, 'unpair');
                        }
                    }).attr('title', _('unpair')).find('i').html('not_interested');
            }
        });

        $lines.find('.values-input').on('change.adaptersettings', function () {
            var index = $(this).data('index');
            var name  = $(this).data('name');
            if ($(this).attr('type') === 'checkbox') {
                if ($(this).prop('checked').toString() !== $(this).data('old-value') && onChange) onChange(name, index);
                values[index][name] = $(this).prop('checked');
            } else {
                if ($(this).val() !== $(this).data('old-value') && onChange) onChange(name, index);
                values[index][name] = $(this).val();

            }
        }).on('keyup', function () {
            $(this).trigger('change.adaptersettings');
        });
    }
    if (typeof onReady === 'function') onReady();
}

/**
 * Extract the values from table.
 *
 * This function extracts the values from edit table, that was generated with values2table function.
 *
 * @param {string} divId name of the html element (or nothing).
 * @return {object} array with values
 */
function table2values(divId) {
    var $div;
    if (!divId) {
        $div = $('body');
    } else {
        $div = $('#' + divId);
    }
    var names = [];
    $div.find('.table-values th').each(function () {
        var name = $(this).data('name');
        if (name) {
            names.push(name);
        } else {
            names.push('___ignore___');
        }
    });

    var values = [];
    var j = 0;
    $div.find('.table-lines tr').each(function () {
        values[j] = {};

        $(this).find('td').each(function () {
            var $input = $(this).find('input');
            if ($input.length) {
                var name = $input.data('name');
                if ($input.attr('type') === 'checkbox') {
                    values[j][name] = $input.prop('checked');
                } else {
                    values[j][name] = $input.val();
                }
            }
            var $select = $(this).find('select');
            if ($select.length) {
                var name = $select.data('name');
                values[j][name] = $select.val() || '';
            }
        });
        j++;
    });

    return values;
}