
var addAll2FilterCombobox = false;

function IobListHeader (header, options) {
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
            $tds = $tds.find('>thead>tr:first>th,>thead>tr:first>td');
            //if (!$tds.length) $tds = _list.find('>colgroup>col');
            if (!$tds.length) $tds = _list.find('>tbody>tr:first>th,>tr:first>th,>tbody>tr:first>td, >tr:first>td');
        }
        $listTds = $tds;
    };
    if (options.list) this.setList(options.list);

    // this.syncHeader = function () {
    //     if (typeof $listTds !== 'object') return;
    //
    //     this.syncHeader = function() {
    //         var offs = $header.selectID_Offset || 0;
    //         $listTds.each(function (i, o) {
    //             if (i >= $listTds.length - 1) return;
    //             var x = $(o).width();
    //             if (x) $ ($headerThs[i]).width(x + offs);
    //         });
    //         if ($header.selectID_Offset === undefined) {
    //             var x = $($listTds[1]).offset().left;
    //             if (x) {
    //                 $header.selectID_Offset = x - $($headerThs[1]).offset().left;
    //                 this.syncHeader();
    //             }
    //         }
    //     };
    //     this.syncHeader();
    // };

    this.syncHeader = function () {
        if (typeof $listTds !== 'object') return;
        let $dlg = $($headerThs[0]);
        this.syncHeader = function() {
            var offs = $dlg.selectID_Offset || 0;
            $listTds.each (function (i, o) {
                if (i >= $listTds.length - 1) return;
                let x = $(o).width();
                if (x) $ ($headerThs[i]).width (x + offs);
            });
            if ($dlg.selectID_Offset === undefined) {
                let x = $($listTds[1]).offset ().left;
                if (x) {
                    $dlg.selectID_Offset = x - $ ($headerThs[1]).offset ().left;
                    this.syncHeader($dlg);
                }
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
        if (addAll2FilterCombobox) name = name ? _(name) + ' ('+_('all') + ')' : _('all');
        return '<option value="" ' + ((selectedVal === "") ? 'selected' : '') + '>' + name + '</option>';
    }

    self.ids = [];
    self.add = function (what, title, _id, selectOptions) {
        if (_id === undefined) _id = title;
        var id = buildId(_id);
        title = _(title);

        var txt = '';
        switch (what) {
            case 'combobox':
                txt = '' +
                    //'<td style="width: 100%">' +
                    '<td>' +
                    '    <select id="' + id + '" title="${title}">'+'</select>' +
                    '</td>' +
                    '<td>' +
                    '    <button id="' + id + '-clear" role="button" title=""></button>' +
                    '</td>';
                break;
            case "edit":
                txt = '' +
                    //'<td style="width: 100%">' +
                    '<td>' +
                    '    <input id="' + id + '" placeholder="' + title + '" type="text" id="${id}" title="' + title + '">' +
                    '</td>' +
                    '<td>' +
                    '    <button id="' + id + '-clear" role="button" title="' + title + '"></button>' +
                    '</td>';
                break;
            case "text":
                txt = '' +
                    '<td style="width: 100%"><span>' + title +
                    '</span></td>';
                break;
        }

        $header.append (
            //'<td class="event-column-' + ++cnt + '">' +
            '<th>' +
            //'<table class="main-header-input-table" style="width: 100%;">' +
            '<table class="main-header-input-table">' +
            '    <tbody>' +
            //'    <tr style="background: #ffffff; ">' +
            '    <tr>' +
            txt +
            '    </tr>' +
            '    </tbody>' +
            '</table>' +
            '</th>'
        );

        var fisId = '#' + id;
        var $id = $(fisId);
        var elem = self[_id] = {
            $filter: $id,
            val: $id.val.bind($id),
            selectedVal: $id.val() || ''
        };
        self.ids.push(_id);

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
        $id.change(function (event) {
            if (eventFilterTimeout) clearTimeout(eventFilterTimeout);
            elem.selectedVal = $id.val();
            eventFilterTimeout = setTimeout(self.doFilter, what!=='combobox' ? 400 : 0);
            filterChanged($id);
            //elem.$filter.parent().parent()[elem.selectedVal ? 'addClass' : 'removeClass'] ('filter-active');
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




function patchPager (parent, view) {

    parent.$grid.parent ().parent ().addClass ('events-grid-div');


    var oldHeader = $ ('#tab-' + view).find ('.ui-jqgrid-htable');
    oldHeader.addClass ('main-header-table');
    var $oldTr = oldHeader.find ('thead>tr');
    var newInputTables = $oldTr.eq (1).find ('.ui-search-table');
    var newTh = $oldTr.eq (1).find ('th');
    newInputTables.addClass ('main-header-input-table');
    var newInput = newInputTables.find ('input');
    $oldTr.eq (0).find ('th').each (function (i, o) {
        $ (newInput[i]).attr ('placeholder', $ (o).text ().trim ()).attr ('style', 'position: relative; top: 2px;');
        //$(o).text('');
        // $(newTh[i]).attr('id', $(o).attr('id'));
        // $(o).removeAttr('id');

    });
    newInputTables.each (function (i, o) {
        $ (o).parent ().css ({padding: 0});  // div
        $ (o).parent ().parent ().css ({padding: 0}); // th
        var $a = $ ($ (o).find ('a'));
        $a.css ({display: 'block', padding: 0, position: 'relative', top: '1px'});
        $a.html ('<span style="height:16px;" class="ui-button-icon-primary ui-icon ui-icon-close"></span>')
    });

    $oldTr.first ().remove ();
    $ ($oldTr.eq (1)).attr ('style', 'border-top: 1px solid #c0c0c0 !important; margin-left: 1px;');
    $ ($oldTr.eq (1)).parent ().parent ().attr ('style', 'header: 0 !important');
    //$($(newHeader).find('tr')).attr('style', 'border: 1px solid #c0c0c0 !important');


    var $nav = $ ('#pager-' + view);
    $nav.addClass('iob-pager');
    $nav.removeClass('ui-jqgrid-pager');
    var mainToolbar = $nav.find ('table.ui-pg-table').first ();
    // mainToolbar.addClass('main-toolbar-table').css({'font-size': '12px'});
    // mainToolbar.find('tr').first().css({height: '23px'});

    mainToolbar.find ('td').css ({padding: 0});

    var syncHeader = function (cnt) {
        var header = $('#tab-' + view).find('table.main-header-table>thead>tr>th');
        var x, trs, tds, len=0;
        if (!(trs=parent.$grid[0].children) || !trs.length || !(trs=trs[0].children) || !(tds = trs[0].children) ) return;
        function doIt() {
            var offs = parent.$grid.selectID_Offset;
            $ (tds).each (function (i, o) {
                if (i >= $ (tds).length - 1) return;
                x = $ (o).outerWidth ();
                if (offs !== undefined) {
                    x += offs ; //- (~~(i===0));
                }
                if (x) $(header[i]).width (x);
                //console.log(view + ': ' + $(o).css('position') + ' offs=' + $(o).offset().left + '/' + $(header[i]).offset().left + ' o=' + $(o)[0].getBoundingClientRect().x + ' header=' + $(header[i])[0].getBoundingClientRect().x);
            });
        }
        doIt();
        if (parent.$grid.selectID_Offset === undefined) {
            x = $(tds[1]).offset().left;
            if (!x) return;  // offset only returns a value, if view is visible
            parent.$grid.selectID_Offset = x - $(header[1]).offset().left;
            syncHeader = doIt;
            //parent.$grid.selectID_Offset -= 1;
            doIt();
        }
    };

    var oldResize = parent.resize.bind(parent);
    var resizeTimer;
    parent.resize = function (x, y) {
        oldResize(x, y);
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(syncHeader, 100);
    };

    var $left = $('#pager-' + view + '_left').addClass('pager-left');
    var $center = $('#pager-' + view + '_center').addClass('pager-center');
    var $right = $('#pager-' + view + '_right').addClass('pager-right');
    $left.find('table').addClass('main-toolbar-table');
    $center.find('table').addClass('main-toolbar-table');

    var $ref = $('#_toolbar-button_');
    var $firstTds = $left.find('>table>tbody>tr>td');
    var width = (parseInt($left.find('>table').css('border-spacing')) + $ref.outerWidth()) * $firstTds.length;
    $left.width(width);

    var tbb = $ref.css(['height', 'width', 'border', 'background', 'padding', 'margin']);
    var css = '';
    Object.keys(tbb).forEach(function(n) {
        css += n + ': ' + tbb[n] + '!important; ';
    });
}
