var addAll2FilterCombobox = false;

function IobListHeader(header, options) {
    if (!(this instanceof IobListHeader)) return new IobListHeader(header, options);

    if (options === undefined) options = {};
    if (options.colWidthOffset === undefined) options.colWidthOffset = 0;

    var $headerThs;
    var $listTds;
    var $header;
    $header = typeof header === 'object' ? $(header) : $('#' + header);
    if ($header[0].tagName === 'TABLE') $header = $header.find('tr:first');
    header = $header[0];

    var that = this;
    that.selectIdOffset = [];

    $header.html('');

    this.setList = function (_list) {
        var $tds;
        if (typeof _list === 'string') {
            if (_list[0] !== '#') {
                _list = '#' + _list;
            }
            $tds = $(_list)
        } else {
            $tds = _list;
        }
        if (!$tds || !$tds.length) return;
        if ($tds[0].tagName !== 'TD' && $tds[0].tagName !== 'TH') {
            $tds = $tds.find('>thead>tr:first>th,>thead>tr:first>td');
            if (!$tds.length) $tds = _list.find('>tbody>tr:first>th,>tr:first>th,>tbody>tr:first>td, >tr:first>td');
        }
        $listTds = $tds;
    };
    if (options.list) {
        this.setList(options.list);
    }

    this.syncHeader = function () {
        if (typeof $listTds !== 'object') return;
        var syncHeader = function () {
            $listTds.each(function (i, o) {
                if (i >= $listTds.length - 1) return;
                var x = $(o).width();
                var offset = that.selectIdOffset[i] || 0;
                if (x + offset) {
                    $($headerThs[i]).width(Math.round(x + offset));
                }
            });
            if ($listTds.length && !that.selectIdOffset.length) {
                that.selectIdOffset[0] = 0;
                $listTds.each(function (i, o) {
                    //if (i >= $listTds.length - 1) return;
                    var x = $($listTds[i]).offset().left;
                    if (x) {
                        that.selectIdOffset[i] = x - $($headerThs[i]).offset().left;
                    }
                });
                syncHeader();
            }
        };
        syncHeader();
    };

    var resizeTimer;
    $(window).on('resize', function (x, y) {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(that.syncHeader.bind(that), 100);
    });

    function buildId(id, fis) {
        if (!id || (fis && id[0] === '#')) return id;
        if (options.prefix && id.substr(0, options.prefix.length) !== options.prefix) {
            id = options.prefix + '-' + id;
        }
        return (fis ? '#' : '') + id;
    }

    this.doFilter = function () {};

    function allOption(name, selectedVal) {
        if (addAll2FilterCombobox) {
            name = name ? _(name) + ' ('+_('all') + ')' : _('all');
        }
        return '<option value="" ' + ((selectedVal === '') ? 'selected' : '') + '>' + name + '</option>';
    }

    that.ids = [];
    that.add = function (what, title, _id, selectOptions) {
        if (_id === undefined) _id = title;
        var id = buildId(_id);
        title = _(title);

        var txt = '';
        switch (what) {
            case 'combobox':
                txt =
                    '    <select class="list-header-input" id="' + id + '" title="' + title + '"></select>' +
                    '    <button class="list-header-clear" id="' + id + '-clear" role="button" title=""></button>';
                break;
            case 'edit':
                txt =
                    '    <input  class="list-header-input" autocomplete="new-password" placeholder="' + title + '" id="' + id + '" title="' + title + '">' +
                    '    <button class="list-header-clear" id="' + id + '-clear" role="button" title="' + title + '"></button>';
                break;
            case 'text':
                txt =
                    '<span class="list-header-text">' + title + '</span>';
                break;
        }

        $header.append('<th>' + txt + '</th>');

        var fisId   = '#' + id;
        var $id     = $(fisId);
        var elem    = that[_id] = {
            $filter:     $id,
            val:         $id.val.bind($id),
            selectedVal: $id.val() || ''
        };
        that.ids.push(_id);

        if (what === 'combobox') {
            elem.options = [];
            elem.checkAddOption = function (text, cb, noAll) {
                if (this.options.indexOf(text) !== -1) return;
                this.options.push(text);
                this.options.sort();
                var selectedVal = $id.val();
                var txt = noAll ? '' : allOption(title, selectedVal);

                function addOption(val, name) {
                    txt += '<option value="' + val + '" ' + ((name === selectedVal) ? 'selected' : '') + '>' + name + '</option>'
                }
                for (var i = 0, len = this.options.length; i < len; i++) {
                    var option = this.options[i];
                    if (cb) {
                        var v = cb(option, i);
                        if (typeof v === 'object') {
                            addOption(v.val, v.name);
                        } else {
                            txt += v;
                        }
                    } else {
                        addOption(option, option);
                    }
                }
                $id.html(txt);
            };

            if (selectOptions) {
                for (var i = 0; i < selectOptions.length; i++) {
                    elem.checkAddOption(selectOptions[i].name, function (o, i) {
                        return selectOptions [i];
                    }, true);
                }
            }
        }

        var $btnClear =  $(fisId + '-clear');
        $btnClear.on('click', function () {
            if ($id.val() !== '') {
                $id.val('').trigger('change');
            }
        });

        if (typeof M === 'undefined') {
            $btnClear.button({icons: {primary: 'ui-icon-close'}, text: false})
        } else {
            $btnClear.prepend('<i class="material-icons">close</i>');
        }

        var eventFilterTimeout;
        $id.on('change', function (event) {
            if (eventFilterTimeout) clearTimeout(eventFilterTimeout);
            elem.selectedVal = $id.val();
            eventFilterTimeout = setTimeout(that.doFilter, what !== 'combobox' ? 400 : 0);
            //_filterChanged($id);
            if (elem.selectedVal) {
                $id.parent().addClass('filter-active');
            } else {
                $id.parent().removeClass('filter-active');
            }
        }).on('keyup', function (event) {
            if (event.which === 13) {
                that.doFilter();
            } else {
                $id.trigger('change');
            }
        });
        $headerThs = $header.find('>th');
        return elem;
    };
}
