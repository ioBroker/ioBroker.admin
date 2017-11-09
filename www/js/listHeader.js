function IobListHeader(header, options) {
    if (!(this instanceof IobListHeader)) return new IobListHeader(header, options);

    if (options === undefined) options = {};
    if (options.colWidthOffset === undefined) options.colWidthOffset = 0;

    var $headerThs, $listTds, $header;
    $header = typeof header === 'object' ? $(header) : $('#' + header);
    if ($header[0].tagName === 'TABLE') $header = $header.find('tr:first');

    var self = this;

    $header.html('');

    this.setList = function (_list) {
        var $tds;
        if (typeof _list === 'string') {
            if (_list[0] !== '#') _list = '#' + _list;
            $tds = $(_list)
        } else {
            $tds = _list;
        }
        if (!$tds || !$tds.length) return;
        if ($tds[0].tagName !== 'TD' && $tds[0].tagName !== 'TH') {
            $tds = $tds.find (">thead>tr:first>th,>thead>tr:first>td");
            if (!$tds.length) $tds = _list.find (">tbody>tr:first>th,>tr:first>th,>tbody>tr:first>td, >tr:first>td");
        }
        $listTds = $tds;
    };
    if (options.list) this.setList(options.list);


    // this.syncHeader = function () {
    //     if (typeof $listTds !== 'object') return;
    //
    //     this.syncHeader = function() {
    //         var px = $listTds.parent().width();
    //         $listTds.each (function (i, o) {
    //             if (i >= $listTds.length - 1) return;
    //             //$ ($headerThs[i]).css({ width: $(o).css('width')});
    //             //$ ($headerThs[i]).width ($(o).width());
    //             //return;
    //             // var x = $ (o).width ();
    //             // if (x) $ ($headerThs[i]).width ($ (o).width () + options.colWidthOffset);
    //             o = $(o);
    //             var x, xs = o.css('width');
    //             if (xs.indexOf('%') >= 0) {
    //                 x = parseInt(xs) * px / 100;
    //             } else {
    //                 x =$(o).width();
    //             }
    //             if (x) $ ($headerThs[i]).width (x + options.colWidthOffset);
    //         });
    //     };
    //     this.syncHeader();
    // };

    this.syncHeader = function () {
        if (typeof $listTds !== 'object') return;

        this.syncHeader = function() {
            var offs = $dlg.selectID_Offset || 0;
            $listTds.each (function (i, o) {
                if (i >= $listTds.length - 1) return;
                var x = $(o).width();
                if (x) $ ($headerThs[i]).width (x + offs);
            });
            if ($dlg.selectID_Offset === undefined) {
                $dlg.selectID_Offset = $ ($listTds[1]).offset ().left - $ ($headerThs[1]).offset ().left;
                this.syncHeader($dlg);
            }
        };
        this.syncHeader();
    };

    var resizeTimer;
    $(window).resize(function (x, y) {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(self.syncHeader.bind(self), 100);
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
        name = name ? _(name) + ' ('+_('all') + ')' : _('all');
        return '<option value="" ' + ((selectedVal === "") ? 'selected' : '') + '>' + name + '</option>';
    }

    self.add = function (what, title, _id, selectOptions) {
        var id = buildId(_id);
        title = _(title);

        var txt = '';
        switch (what) {
            case 'combobox':
                txt =
                    '<td style="width: 100%">' +
                    '    <select id="' + id + '" title="' + title + '">'+'</select>' +
                    '</td>' +
                    '<td>' +
                    '   <button id="' + id + '-clear" role="button" title=""></button>' +
                    '</td>';
                break;
            case 'edit':
                txt =
                    '<td style="width: 100%">' +
                    '    <input placeholder="' + title + '" type="text" id="' + id + '" title="' + title + '">' +
                    '</td>' +
                    '<td>' +
                    '    <button id="' + id + '-clear" role="button" title="${title}"></button>' +
                    '</td>';
                break;
            case 'text':
                txt =
                    '<td style="width: 100%"><span>' + title +
                    '</span></td>';
                break;
        }

        $header.append (
            //'<td class="event-column-' + ++cnt + '">' +
            '<th>' +
            '   <table class="main-header-input-table" style="width: 100%;">' +
            '       <tbody>' +
            '        <tr style="background: #ffffff; ">' +
            txt +
            '       </tr>' +
            '       </tbody>' +
            '   </table>' +
            '</th>'
        );

        var fisId = '#' + id;
        var $id = $(fisId);
        var elem = self[_id] = {
            $filter: $id,
            val: $id.val.bind($id)
        };

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
                for (var i=0, len=this.options.length; i<len; i++) {
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

        $(fisId + '-clear').button({icons:{primary: 'ui-icon-close'}, text: false}).click(function () {
            if ($id.val() !== '') {
                $id.val('').trigger('change');
            }
        });

        var eventFilterTimeout;
        $id.change(function () {
            if (eventFilterTimeout) clearTimeout(eventFilterTimeout);
            elem.selectedVal = $id.val();
            eventFilterTimeout = setTimeout(self.doFilter, what!=='combobox' ? 400 : 0);
        }).keyup(function (event) {
            if (event.which === 13) {
                self.doFilter();
            } else {
                $id.trigger('change');
            }
        });
        $headerThs = $header.find('>th');
        return elem;
    };
}

