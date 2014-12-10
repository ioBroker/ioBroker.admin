var _objTree            = {title: '', children: [], count: 0, inited: false};
var _enums              = [];
var _objRooms           = {};
var _regexSystemAdapter = new RegExp('^system.adapter.');
var _regexSystemHost    = new RegExp('^system.host.');
var _regexEnumRooms     = new RegExp('^enum.rooms.');
var _imgPath            = 'lib/css/fancytree/';

// TODO Convert seconds to Hours/days
// translate seconds
// use , or . for numbers

function _openDialog(elem, options, callback) {
    var $dialogSelectMember = $('#' + elem + '-dlg');
    if (!$dialogSelectMember.length) {
        var _domText = '<div id="'+ elem + '-dlg" style="display:none">';
        _domText += '<div id="'+ elem + '-div" style="width:100%; height:100%"></div>';
        _domText += '</div>';
        $('body').append(_domText);

        $dialogSelectMember = $('#' + elem + '-dlg');

        $dialogSelectMember[0]._buttons = [
            {
                id:   elem + '-button-ok',
                text: _('Select'),
                click: function () {
                    var $dlg = $('#' + elem + '-dlg');
                    if ($dlg[0] && $dlg[0]._callback) $dlg[0]._callback($dlg[0]._selectedID, $dlg[0].currentId);
                    $dialogSelectMember.dialog('close');
                }
            },
            {
                id:   elem + '-button-cancel',
                text: _('Cancel'),
                click: function () {
                    $(this).dialog('close');
                }
            }
        ];

        $dialogSelectMember.dialog({
            autoOpen: false,
            modal:    true,
            width:    '90%',
            height:   500,
            buttons:  $dialogSelectMember[0]._buttons
        });
    }

    $dialogSelectMember[0]._callback   = callback;
    $dialogSelectMember[0]._currentId  = options.currentId;
    $dialogSelectMember[0]._selectedID = options.currentId;

    $dialogSelectMember.dialog('option', 'title', _('Select ID') +  ' - ' + (options.title || ' '));

    selectID(elem + '-div', {currentId: options.currentId, objects: options.objects, states: options.states, filter: options.filter}, function (newId) {
        // On change
        var $dlg = $('#' + elem + '-dlg');
        $dlg[0]._selectedID = newId;
        if (options.objects[newId] && options.objects[newId].common && options.objects[newId].common.name) {
            $dlg.dialog('option', 'title', _('Select ID') +  ' - ' + (options.objects[newId].common.name || ' '));
        } else {
            $dlg.dialog('option', 'title', _('Select ID') +  ' - ' + (newId || ' '));
        }
        if (options.objects[newId] && options.objects[newId].type == 'state') {
            $('#' + elem + '-button-ok').removeClass('ui-state-disabled');
        } else {
            $('#' + elem + '-button-ok').addClass('ui-state-disabled');
        }
    });

    if (options.currentId) {
        if (options.objects[options.currentId] && options.objects[options.currentId].common && options.objects[options.currentId].common.name) {
            $dialogSelectMember.dialog('option', 'title', _('Select ID') +  ' - ' + (options.objects[options.currentId].common.name || ' '));
        } else {
            $dialogSelectMember.dialog('option', 'title', _('Select ID') +  ' - ' + (options.currentId || ' '));
        }
    } else {
        $('#' + elem + '-button-ok').addClass('ui-state-disabled');
    }

    $dialogSelectMember.dialog('open');
}

function selectID(elem, options, onChange) {
    /*var options =  {
     currentId: '',
     objects:   null,
     states:    null,
     filter:    null
     };*/

    if (elem == '__clear__') {
        _objTree  = {title: '', children: [], count: 0, inited: false};
        _objRooms = {};
        _enums    = [];

        return;
    }

    if (!elem) {
        _openDialog('tree-select', options, onChange);
        return;
    }

    var dom = document.getElementById(elem);
    if (!dom) {
        throw 'selectID: Cannot find ' + elem;
    }

    function _getAllStates(objects, currentId, filter) {
        var states = [];
        for (var id in objects) {
            if (objects[id].type == 'state') {
                states.push(id);
                if (filter && filter.common && filter.common.history && filter.common.history.enabled) {
                    if (!objects[id].common || !objects[id].common.history || !objects[id].common.history.enabled) continue;
                }

                __treeInsert(id, currentId == id);
            } else if (objects[id].type == 'enum' && _regexEnumRooms.test(id)) {
                _enums.push(id);
            }
        }
        _objTree.inited = true;
        return states;
    }

    function __treeSplit(id) {
        if (!id) {
            console.log('AAAA');
            return null;
        }
        var parts = id.split('.');
        if (_regexSystemAdapter.test(id)) {
            if (parts.length > 3) {
                parts[0] = 'system.adapter.' + parts[2] + '.' + parts[3];
                parts.splice(1, 3);
            } else {
                parts[0] = 'system.adapter.' + parts[2];
                parts.splice(1, 2);
            }
        } else if (_regexSystemHost.test(id)) {
            parts[0] = 'system.host.' + parts[2];
            parts.splice(1, 2);
        } else if (parts.length > 1) {
            parts[0] = parts[0] + '.' + parts[1];
            parts.splice(1, 1);
        }

        /*if (optimized) {
         parts = treeOptimizePath(parts);
         }*/

        return parts;
    }

    function __treeInsert(id, isExpanded) {
        ___treeInsert(_objTree, __treeSplit(id, false), id, 0, isExpanded);
    }

    function ___treeInsert(tree, parts, id, index, isExpanded) {
        if (!index) index = 0;

        var num = -1;
        var j;
        for (j = 0; j < tree.children.length; j++) {
            if (tree.children[j].title == parts[index]) {
                num = j;
                break;
            }
            if (tree.children[j].title > parts[index]) break;
        }

        if (num == -1) {
            tree.folder   = true;
            tree.expanded = isExpanded;

            var fullName = '';
            for (var i = 0; i <= index; i++) {
                fullName += ((fullName) ? '.' : '') + parts[i];
            }
            var obj = {
                key:      fullName,
                children: [],
                title:    parts[index],
                folder:   false,
                expanded: false
            };
            if (j == tree.children.length) {
                num = tree.children.length;
                tree.children.push(obj);
            } else {
                num = j;
                tree.children.splice(num, 0, obj);
            }
        }
        if (parts.length - 1 == index) {
            tree.children[num].id = id;
        } else {
            ___treeInsert(tree.children[num], parts, id, index + 1, isExpanded);
        }
    }

    var $tree = $('#selectID_' + elem);
    if ($tree.length) {
        // Re-init tree if filter or selectedID changed
        if (!$tree[0]._options || ($tree[0]._options.filter && !options.filter) ||
            (!$tree[0]._options.filter && options.filter) ||
            ($tree[0]._options.filter && options.filter && JSON.stringify($tree[0]._options.filter) != JSON.stringify(options.filter))) {
            _objTree.inited = false;
        }
        if (_objTree.inited && (!$tree[0]._options || $tree[0]._options.currentId != options.currentId)) _objTree.inited = false;

        $tree[0]._onChange = onChange;
        $tree[0]._options  = options;
    } else {
        _objTree.inited = false;
    }

    if (!_objTree.inited) {
        // Get all states
        _getAllStates(options.objects, options.currentId, options.filter);

        var rooms = [];
        var textRooms = '<select id="filter_room_' + elem + '" class="filter_' + elem + '"><option value="">' + _('All') + '</option>';
        for (var i = 0; i < _enums.length; i++) {
            rooms.push({title: options.objects[_enums[i]].common.name, key: _enums[i]});
            textRooms += '<option value="' + options.objects[_enums[i]].common.name + '">' + options.objects[_enums[i]].common.name + '</option>';
        }

        textRooms += '</select>';

        var text = '<table id="selectID_header_' + elem + '" style="width: 100%;padding:0; height: 50" cellspacing="0" cellpadding="0">';
        text += '<colgroup>';
        text += '            <col width="1px"/>';
        text += '            <col width="400px"/>';
        text += '            <col width="20px"/>';
        text += '            <col width="*"/>';
        text += '            <col width="150px"/>';
        text += '            <col width="150px"/>';
        text += '            <col width="150px"/>';
        text += '            <col width="18px"/>'; // TODO calculate width of scroll bar
        text += '        </colgroup>';
        text += '        <thead>';
        text += '            <tr><th></th><th><table style="width: 100%; padding:0" cellspacing="0" cellpadding="0"><tr><td><button id="btn_collapse_' + elem + '"></button></td><td><button id="btn_expand_' + elem + '"></button></td><td style="width: 100%; text-align: center; font-weight: bold">' + _('ID') + '</td></tr></table></th><th></th><th>' + _('Name') + '</th><th>' + _('Role') + '</th><th>' + _('Room') + '</th><th>' + _('Value') + '</th><th></th></tr>';
        text += '        </thead>';
        text += '        <tbody>';
        text += '            <tr><td></td>';
        text += '               <td><table style="width:100%"><tr><td style="width:100%"><input style="width:100%" type="text" id="filter_ID_'    + elem + '" class="filter_' + elem + '"/></td><td><button data-id="filter_ID_'    + elem + '" class="filter_btn_' + elem + '"></button></td></tr></table></td>';
        text += '               <td></td>';
        text += '               <td><table style="width:100%"><tr><td style="width:100%"><input style="width:100%" type="text" id="filter_name_'  + elem + '" class="filter_' + elem + '"/></td><td><button data-id="filter_name_'  + elem + '" class="filter_btn_' + elem + '"></button></td></tr></table></td>';
        text += '               <td><table style="width:100%"><tr><td style="width:100%"><input style="width:100%" type="text" id="filter_role_'  + elem + '" class="filter_' + elem + '"/></td><td><button data-id="filter_role_'  + elem + '" class="filter_btn_' + elem + '"></button></td></tr></table></td>';
        text += '               <td>' + textRooms /*<table style="width:100%"><tr><td style="width:100%"><input style="width:100%" type="text" id="filter_room_'  + elem + '" class="filter_' + elem + '"/></td><td><button data-id="filter_room_'  + elem + '" class="filter_btn_' + elem + '"></button></td></tr></table>*/ + '</td>';
        text += '               <td><table style="width:100%"><tr><td style="width:100%"><input style="width:100%" type="text" id="filter_value_' + elem + '" class="filter_' + elem + '"/></td><td><button data-id="filter_value_' + elem + '" class="filter_btn_' + elem + '"></button></td></tr></table></td>';
        text += '               <td></td></tr>';
        text += '        </tbody>';
        text += '    </table>';

        text += '<div style="width: 100%; height: 85% ;padding:0; overflow-y: scroll">';
        text +=' <table id="selectID_' + elem + '" style="width: 100%;padding:0;table-layout:fixed; overflow:hidden;white-space:nowrap" cellspacing="0" cellpadding="0">';
        text += '        <colgroup>';
        text += '            <col width="1px"/>';
        text += '            <col width="400px"/>';
        text += '            <col width="20px"/>';
        text += '            <col width="*"/>';
        text += '            <col width="150px"/>';
        text += '            <col width="150px"/>';
        text += '            <col width="150px"/>';
        text += '        </colgroup>';
        text += '        <thead>';
        text += '            <tr><th></th><th></th><th></th><th></th><th></th><th></th><th></th></tr>';
        text += '        </thead>';
        text += '        <tbody>';
        text += '        </tbody>';
        text += '    </table></div>';

        $(dom).html(text);


        $tree = $('#selectID_' + elem);
        $tree[0]._onChange = onChange;
        $tree[0]._options  = options;

        $tree.fancytree({
            titlesTabbable: true,     // Add all node titles to TAB chain
            quicksearch: true,
            source: _objTree.children,

            extensions: ["table", "gridnav", "filter"],

            table: {
                indentation: 20,
                nodeColumnIdx: 1
            },
            gridnav: {
                autofocusInput:   false,
                handleCursorKeys: true
            },
            filter: {
                mode: "hide",
                autoApply: true
            },
            activate: function(event, data){
                // A node was activated: display its title:
                var _onChange = $('#selectID_' + elem)[0]._onChange;
                if (typeof _onChange == 'function') _onChange(data.node.key);
            },
            renderColumns: function(event, data) {
                var node = data.node;
                var $tdList = $(node.tr).find(">td");

                var rooms = [];
                var isCommon = options.objects[node.key] && options.objects[node.key].common;

                // Try to find room
                if (!_objRooms[node.key]) {
                    for (var i = 0; i < _enums.length; i++) {
                        if (options.objects[_enums[i]].common.members.indexOf(node.key) != -1) {
                            rooms.push(options.objects[_enums[i]].common.name);
                        }
                        _objRooms[node.key] = rooms;
                    }
                } else {
                    rooms = _objRooms[node.key];
                }

                $tdList.eq(5).text(rooms.join(', '));
                var icon = '';
                var alt = '';
                if (isCommon) {
                    if (options.objects[node.key].common.icon) {
                        if (options.objects[node.key].type == 'instance') {
                            icon = '/adapter/' + options.objects[node.key].common.name + '/' + options.objects[node.key].common.icon;
                        }
                        else {
                            var instance = node.key.split('.', 2);
                            if (options.objects[node.key].common.icon[0] == '/') {
                                instance[0] += options.objects[node.key].common.icon;
                            } else {
                                instance[0] += '/' + options.objects[node.key].common.icon;
                            }
                            icon = '/adapter/' + instance[0];
                        }
                    } else if (options.objects[node.key].type == 'device') {
                        icon = _imgPath + 'device.png';
                        alt  = 'device';
                    } else if (options.objects[node.key].type == 'channel') {
                        icon = _imgPath + 'channel.png';
                        alt  = 'channel';
                    } else if (options.objects[node.key].type == 'state') {
                        icon = _imgPath + 'state.png';
                        alt  = 'state';
                    }
                }
                var _id_ = 'system.adapter.' + node.key;
                if (options.objects[_id_] && options.objects[_id_].common && options.objects[_id_].common.icon) {
                    icon = '/adapter/' + options.objects[_id_].common.name + '/' + options.objects[_id_].common.icon;
                }
                if (icon) $tdList.eq(2).html('<img width=20 height=20 src="' + icon + '" alt="' + alt + '"/>');

                // (index #1 is rendered by fancytree)
                if (isCommon) {
                    $tdList.eq(3).text(options.objects[node.key].common.name);
                    $tdList.eq(4).text(options.objects[node.key].common.role);
                }

                // (index #0 is rendered by fancytree by adding the checkbox)
                if(options.states[node.key]) {
                    var val = options.states[node.key].val;
                    if (val === undefined) val = '';
                    if (isCommon && options.objects[node.key].common.unit) val += ' ' + options.objects[node.key].common.unit;
                    $tdList.eq(6).text(val);
                    $tdList.eq(6).attr('title', val);
                }
            }
        }).on("nodeCommand", function(event, data){
            // Custom event handler that is triggered by keydown-handler and
            // context menu:
            var refNode, moveMode,
                tree = $(this).fancytree("getTree"),
                node = tree.getActiveNode();

            switch( data.cmd ) {
                case "moveUp":
                    node.moveTo(node.getPrevSibling(), "before");
                    node.setActive();
                    break;
                case "moveDown":
                    node.moveTo(node.getNextSibling(), "after");
                    node.setActive();
                    break;
                case "indent":
                    refNode = node.getPrevSibling();
                    node.moveTo(refNode, "child");
                    refNode.setExpanded();
                    node.setActive();
                    break;
                case "outdent":
                    node.moveTo(node.getParent(), "after");
                    node.setActive();
                    break;
                case "copy":
                    CLIPBOARD = {
                        mode: data.cmd,
                        data: node.toDict(function(n){
                            delete n.key;
                        })
                    };
                    break;
                case "clear":
                    CLIPBOARD = null;
                    break;
                default:
                    alert("Unhandled command: " + data.cmd);
                    return;
            }

        }).on("keydown", function(e) {
            var c = String.fromCharCode(e.which),
                cmd = null;

            if (e.which === 'c' && e.ctrlKey) {
                cmd = "copy";
            }else if (e.which === $.ui.keyCode.UP && e.ctrlKey) {
                cmd = "moveUp";
            } else if (e.which === $.ui.keyCode.DOWN && e.ctrlKey) {
                cmd = "moveDown";
            } else if (e.which === $.ui.keyCode.RIGHT && e.ctrlKey) {
                cmd = "indent";
            } else if (e.which === $.ui.keyCode.LEFT && e.ctrlKey) {
                cmd = "outdent";
            }
            if (cmd) {
                $(this).trigger("nodeCommand", {cmd: cmd});
                return false;
            }
        });

        function customFilter(node) {
            var id = $('#filter_ID_' + elem).val();
            if (id !== '' && node.key.indexOf(id) == -1) return false;
            var value = $('#filter_name_' + elem).val();
            if (value !== '' && (!options.objects[node.key] || !options.objects[node.key].common || options.objects[node.key].common.name === undefined || options.objects[node.key].common.name.indexOf(value) == -1)) return false;
            value = $('#filter_role_' + elem).val();
            if (value !== '' && (!options.objects[node.key] || !options.objects[node.key].common || options.objects[node.key].common.role === undefined || options.objects[node.key].common.role.indexOf(value) == -1)) return false;
            value = $('#filter_value_' + elem).val();
            if (value !== '' && (!options.states[node.key] || options.states[node.key].val === undefined || options.states[node.key].val.toString().indexOf(value) == -1)) return false;
            value = $('#filter_room_' + elem).val();
            if (value !== '') {
                if (!options.objects[node.key]) return false;
                var rooms = [];
                // Try to find room
                if (!_objRooms[node.key]) {
                    for (var i = 0; i < _enums.length; i++) {
                        if (options.objects[_enums[i]].common.members.indexOf(node.key) != -1) {
                            rooms.push(options.objects[_enums[i]].common.name);
                        }
                        _objRooms[node.key] = rooms;
                    }
                } else {
                    rooms = _objRooms[node.key];
                }
                if (rooms.indexOf(value) == -1) return false;
            }


            return true;
        }

        $('.filter_' + elem).change(function() {
            $('#selectID_' + elem).fancytree("getTree").filterNodes(customFilter, false);
        }).keyup(function(){
            var tree = $('#selectID_' + elem)[0];
            if (tree._timer) {
                tree._timer = clearTimeout(tree._timer);
            }
            var that = this;
            tree._timer = setTimeout(function (){
                $(that).trigger('change');
            }, 200);
        });

        $('.filter_btn_' + elem).button({icons:{primary: 'ui-icon-close'}, text: false}).css({width: 18, height: 18}).click(function() {
            $('#' + $(this).attr('data-id')).val('').trigger('change');
        });
        $('#btn_collapse_' + elem).button({icons:{primary: 'ui-icon-folder-collapsed'}, text: false}).css({width: 18, height: 18}).click(function() {
            $('#selectID_' + elem).fancytree("getRootNode").visit(function(node){
                node.setExpanded(false);
            });
        });
        $('#btn_expand_' + elem).button({icons:{primary: 'ui-icon-folder-open'}, text: false}).css({width: 18, height: 18}).click(function() {
            $('#selectID_' + elem).fancytree("getRootNode").visit(function(node){
                node.setExpanded(true);
            });
        });
    }
}