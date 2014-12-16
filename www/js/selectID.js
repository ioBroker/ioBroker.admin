/*
 Copyright 2014 bluefox <bluefox@ccu.io>

 To use this dialog as standalone in ioBroker environment include:
 <link type="text/css" rel="stylesheet" href="lib/css/redmond/jquery-ui.min.css">
 <link rel="stylesheet" type="text/css" href="lib/css/fancytree/ui.fancytree.min.css"/>

 <script type="text/javascript" src="lib/js/jquery-1.11.1.min.js"></script>
 <script type="text/javascript" src="lib/js/jquery-ui-1.10.3.full.min.js"></script>
 <script type="text/javascript" src="lib/js/jquery.fancytree-all.min.js"></script>
 <script type="text/javascript" src="js/translate.js"></script>
 <script type="text/javascript" src="js/words.js"></script><!--this file must be after translate.js -->

 <script type="text/javascript" src="js/selectID.js"></script>

 <script src="lib/js/socket.io.js"></script>
 <script src="/_socket/info.js"></script>

 To use as part, just
 <link rel="stylesheet" type="text/css" href="lib/css/fancytree/ui.fancytree.min.css"/>
 <script type="text/javascript" src="lib/js/jquery.fancytree-all.min.js"></script>
 <script type="text/javascript" src="js/selectID.js"></script>

 Interface:
 +  init(options) - init select ID dialog. Following options are supported
         {
             currentId:  '',       // Current ID or empty if nothing preselected
             objects:    null,     // All objects that should be shown. It can be empty if connCfg used.
             states:     null,     // All states of objects. It can be empty if connCfg used. If objects are set and no states, states will no be shown.
             filter:     null,     // filter
             imgPath:    'lib/css/fancytree/', // Path to images device.png, channel.png and state.png
             connCfg:    null,     // configuration for dialog, ti read objects itself: {socketUrl: socketUrl, socketSession: socketSession}
             onSuccess:  null,     // callback function to be called if user press "Select". Can be overwritten in "show"
             noImg:      false,    // do not show column with images
             texts: {
                 select:   'Select',
                 cancel:   'Cancel',
                 all:      'All',
                 id:       'ID',
                 name:     'Name',
                 role:     'Role',
                 room:     'Room',
                 value:    'Value',
                 selectid: 'Select ID'
             }
         }
 +  show(currentId, filter, callback) - all arguments are optional if set by "init"
 +  clear() - clear object tree to read and buildit anew (used only if objects set by "init")
 +  getInfo (id) - get information about ID
 */
(function( $ ) {
    if ($.fn.selectId) return;

    var instance = 0;
    function getAllStates(data) {
        var objects = data.objects;
        var filter  = data.filter;
        for (var id in objects) {
            if (data.onChange || objects[id].type == 'state') {
                if (filter && filter.common &&
                    filter.common.history && filter.common.history.enabled) {
                    if (!objects[id].common ||
                        !objects[id].common.history ||
                        !objects[id].common.history.enabled) continue;
                }

                treeInsert(data, id, data.currentId == id);
            }
            if (objects[id].type == 'enum' && data.regexEnumRooms.test(id)) data.enums.push(id);

            if (data.types.indexOf(objects[id].type) == -1) data.types.push(objects[id].type);

            if (objects[id].common && objects[id].common.role) {
                var parts = objects[id].common.role.split('.');
                var role = '';
                for (var u = 0; u < parts.length; u++) {
                    role += (role ? '.' : '') + parts[u];
                    if (data.roles.indexOf(role) == -1) data.roles.push(role)
                }
            }
        }
        data.inited = true;
        data.roles.sort();
        data.types.sort();
    }

    function treeSplit(data, id) {
        if (!id) {
            console.log('AAAA');
            return null;
        }
        var parts = id.split('.');
        if (data.regexSystemAdapter.test(id)) {
            if (parts.length > 3) {
                parts[0] = 'system.adapter.' + parts[2] + '.' + parts[3];
                parts.splice(1, 3);
            } else {
                parts[0] = 'system.adapter.' + parts[2];
                parts.splice(1, 2);
            }
        } else if (data.regexSystemHost.test(id)) {
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

    function _deleteTree(node, deletedNodes) {
        if (node.parent) {
            if (deletedNodes && node.id) deletedNodes.push(node);
            var p = node.parent;
            if (p.children.length <= 1) {
                _deleteTree(node.parent);
            } else {
                for (var z = 0; z < p.children.length; z++) {
                    if (node.key == p.children[z].key) {
                        p.children.splice(z, 1);
                        break;
                    }
                }
            }
        } else {
            //error
        }
    }
    function deleteTree(data, id, deletedNodes) {
        var node = findTree(data, id);
        if (!node) return;
        _deleteTree(node, deletedNodes);
    }

    function findTree(data, id) {
        return _findTree(data.tree, treeSplit(data, id, false), 0);
    }
    function _findTree(tree, parts, index) {
        for (j = 0; j < tree.children.length; j++) {
            if (tree.children[j].title == parts[index]) {
                num = j;
                break;
            }
            if (tree.children[j].title > parts[index]) break;
        }

        if (num == -1) {
            return null;
        }
        if (parts.length - 1 == index) {
            return tree.children[num];
        } else {
            return _findTree(tree.children[num], parts, index + 1);
        }
    }

    function treeInsert(data, id, isExpanded, addedNodes) {
        return _treeInsert(data.tree, treeSplit(data, id, false), id, 0, isExpanded, addedNodes);
    }
    function _treeInsert(tree, parts, id, index, isExpanded, addedNodes) {
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
                expanded: false,
                parent:   tree
            };
            if (j == tree.children.length) {
                num = tree.children.length;
                tree.children.push(obj);
            } else {
                num = j;
                tree.children.splice(num, 0, obj);
            }
            if (addedNodes) addedNodes.push(tree.children[num]);
        }
        if (parts.length - 1 == index) {
            tree.children[num].id = id;
        } else {
            tree.children[num].expanded = tree.children[num].expanded || isExpanded;
            _treeInsert(tree.children[num], parts, id, index + 1, isExpanded, addedNodes);
        }
    }

    function initTreeDialog($dlg) {
        var data = $dlg.data('selectId');
        var noStates = (data.objects && !data.states);
        // Get all states
        getAllStates(data);

        if (!data.onChange && !data.buttonsDlg) {
            data.buttonsDlg = [
                {
                    id:   data.instance + '-button-ok',
                    text: data.texts.select,
                    click: function () {
                        var _data = $dlg.data('selectId');
                        if (_data && _data.onSuccess) _data.onSuccess(_data.selectedID, _data.currentId);
                        _data.currentId = _data.selectedID;
                        $dlg.dialog('close');
                    }
                },
                {
                    id:   data.instance + '-button-cancel',
                    text: data.texts.cancel,
                    click: function () {
                        $(this).dialog('close');
                    }
                }
            ];

            $dlg.dialog({
                autoOpen: false,
                modal:    true,
                width:    '90%',
                height:   500,
                buttons:  data.buttonsDlg
            });
        }

        //var rooms = [];
        var textRooms = '<select id="filter_room_' + data.instance + '" class="filter_' + data.instance + '" style="padding:0;width:150px"><option value="">' + data.texts.all + '</option>';
        for (var i = 0; i < data.enums.length; i++) {
            //rooms.push({title: data.objects[data.enums[i]].common.name, key: data.enums[i]});
            textRooms += '<option value="' + data.objects[data.enums[i]].common.name + '">' + data.objects[data.enums[i]].common.name + '</option>';
        }
        textRooms += '</select>';

        var textRoles = '<select id="filter_role_' + data.instance + '" class="filter_' + data.instance + '" style="padding:0;width:150px"><option value="">' + data.texts.all + '</option>';
        for (i = 0; i < data.roles.length; i++) {
            textRoles += '<option value="' + data.roles[i] + '">' + data.roles[i] + '</option>';
        }
        textRoles += '</select>';

        var textTypes = '<select id="filter_type_' + data.instance + '" class="filter_' + data.instance + '" style="padding:0;width:150px"><option value="">' + data.texts.all + '</option>';
        for (i = 0; i < data.types.length; i++) {
            textTypes += '<option value="' + data.types[i] + '">' + data.types[i] + '</option>';
        }
        textTypes += '</select>';

        var text = '<div id="'+ data.instance + '-div" style="width:100%; height:100%"><table id="selectID_header_' + data.instance + '" style="width: 100%;padding:0; height: 50" cellspacing="0" cellpadding="0">';
        text += '<colgroup>';
        text += '            <col width="1px"/>';
        text += '            <col width="400px"/>';
        if (data.noImg) {
            text += '            <col width="1px"/>';
        } else {
            text += '            <col width="20px"/>';
        }
        text += '            <col width="*"/>';
        if (data.showTypes) text += '            <col width="150px"/>';
        text += '            <col width="150px"/>';
        text += '            <col width="150px"/>';
        if (!noStates)  text += '        <col width="150px"/>';
        if (data.buttons) text += '<col width="100px"/>';
        text += '            <col width="18px"/>'; // TODO calculate width of scroll bar
        text += '        </colgroup>';
        text += '        <thead>';
        text += '            <tr><th></th><th><table style="width: 100%; padding:0" cellspacing="0" cellpadding="0"><tr><td><button id="btn_collapse_' + data.instance + '"></button></td><td><button id="btn_expand_' + data.instance + '"></button></td><td><button id="btn_refresh_' + data.instance + '"></button></td><td style="width: 100%; text-align: center; font-weight: bold">' + data.texts.id + '</td></tr></table></th><th></th><th>' + data.texts.name + '</th>';
        if (data.showTypes) text += '<th>' + data.texts.type + '</th>';
        text += '<th>' + data.texts.role + '</th><th>' + data.texts.room + '</th>';
        if (!noStates) text += '<th>' + data.texts.value + '</th>';
        if (data.buttons) text += '<th></th>';
        text += '<th></th></tr>';
        text += '        </thead>';
        text += '        <tbody>';
        text += '            <tr><td></td>';
        text += '               <td><table style="width:100%"><tr><td style="width:100%"><input style="width:100%;padding:0" type="text" id="filter_ID_'    + data.instance + '" class="filter_' + data.instance + '"/></td><td style="vertical-align: top;"><button data-id="filter_ID_'    + data.instance + '" class="filter_btn_' + data.instance + '"></button></td></tr></table></td>';
        text += '               <td></td>';
        text += '               <td><table style="width:100%"><tr><td style="width:100%"><input style="width:100%;padding:0" type="text" id="filter_name_'  + data.instance + '" class="filter_' + data.instance + '"/></td><td style="vertical-align: top;"><button data-id="filter_name_'  + data.instance + '" class="filter_btn_' + data.instance + '"></button></td></tr></table></td>';
        if (data.showTypes) text += '               <td>' + textTypes + '</td>';
        text += '               <td>' + textRoles /* + '<table style="width:100%"><tr><td style="width:100%"><input style="width:100%;padding:0" type="text" id="filter_role_'  + data.instance + '" class="filter_' + data.instance + '"/></td><td style="vertical-align: top;"><button data-id="filter_role_'  + data.instance + '" class="filter_btn_' + data.instance + '"></button></td></tr></table>'*/ + '</td>';
        text += '               <td>' + textRooms /* + '<table style="width:100%"><tr><td style="width:100%"><input style="width:100%" type="text" id="filter_room_'  + data.instance + '" class="filter_' + data.instance + '"/></td><td><button data-id="filter_room_'  + data.instance + '" class="filter_btn_' + data.instance + '"></button></td></tr></table>'*/ + '</td>';
        if (!noStates) text += '           <td><table style="width:100%"><tr><td style="width:100%"><input style="width:100%;padding:0" type="text" id="filter_value_' + data.instance + '" class="filter_' + data.instance + '"/></td><td style="vertical-align: top;"><button data-id="filter_value_' + data.instance + '" class="filter_btn_' + data.instance + '"></button></td></tr></table></td>';
        if (data.buttons) text += '<td></td>';
        text += '               <td></td></tr>';
        text += '        </tbody>';
        text += '    </table>';

        text += '<div style="width: 100%; ';
         if (data.buttons) {
            text +=   'height: 100%; ';
        } else {
            text +=   'height: 85%; ';
        }
        text +=   'padding:0; overflow-y: scroll">';

        text +=' <table id="selectID_' + data.instance + '" style="width: 100%;padding:0;table-layout:fixed; overflow:hidden;white-space:nowrap" cellspacing="0" cellpadding="0">';
        text += '        <colgroup>';
        text += '            <col width="1px"/>';
        text += '            <col width="400px"/>';
        if (data.noImg) {
            text += '            <col width="1px"/>';
        } else {
            text += '            <col width="20px"/>';
        }
        text += '            <col width="*"/>';
        if (data.showTypes) text += '        <col width="150px"/>';
        text += '            <col width="150px"/>';
        if (!noStates) text += '        <col width="150px"/>';
        text += '            <col width="150px"/>';
        if (data.buttons) text += '<col width="100px"/>';
        text += '        </colgroup>';
        text += '        <thead>';
        text += '            <tr><th></th><th></th><th></th>';
        if (data.showTypes) text += '         <th></th>';
        text += '<th></th><th></th>';
        if (!noStates) text += '         <th></th>';
        if (data.buttons) text += '<th></th>';
        text += '             <th></th></tr>';
        text += '        </thead>';
        text += '        <tbody>';
        text += '        </tbody>';
        text += '    </table></div></div>';

        $dlg.html(text);

        data.$tree = $('#selectID_' + data.instance);
        data.$tree[0]._onChange = data.onSuccess || data.onChange;

        data.$tree.fancytree({
            titlesTabbable: true,     // Add all node titles to TAB chain
            quicksearch: true,
            source: data.tree.children,
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
                // On change
                //var $dlg = $('#' + data.instance + '-dlg');
                var _data = $dlg.data('selectId');
                var newId = data.node.key;
                if (_data.onChange) _data.onChange(newId, _data.selectedID);
                _data.selectedID = newId;
                if (!_data.onChange) {
                    // Set title of dialog box
                if (_data.objects[newId] && _data.objects[newId].common && _data.objects[newId].common.name) {
                    $dlg.dialog('option', 'title', _data.texts.selectid +  ' - ' + (_data.objects[newId].common.name || ' '));
                } else {
                    $dlg.dialog('option', 'title', _data.texts.selectid +  ' - ' + (newId || ' '));
                }
                    // Enable/ disable "Select" button
                if (_data.objects[newId] && _data.objects[newId].type == 'state') {
                    $('#' + _data.instance + '-button-ok').removeClass('ui-state-disabled');
                } else {
                    $('#' + _data.instance + '-button-ok').addClass('ui-state-disabled');
                }
                }
            },
            renderColumns: function(event, _data) {
                var node = _data.node;
                var $tdList = $(node.tr).find(">td");

                var rooms = [];
                var isCommon = data.objects[node.key] && data.objects[node.key].common;

                // Try to find room
                if (!data.rooms[node.key]) {
                    for (var i = 0; i < data.enums.length; i++) {
                        if (data.objects[data.enums[i]].common.members.indexOf(node.key) != -1) {
                            rooms.push(data.objects[data.enums[i]].common.name);
                        }
                        data.rooms[node.key] = rooms;
                    }
                } else {
                    rooms = data.rooms[node.key];
                }
                var base = 4;
                if (data.showTypes) {
                    base ++;
                    $tdList.eq(4).text(data.objects[node.key] ? data.objects[node.key].type: '');
                }

                $tdList.eq(base + 1).text(rooms.join(', '));
                var icon = '';
                var alt = '';
                if (isCommon && !data.noImg) {
                    if (data.objects[node.key].common.icon) {
                        if (data.objects[node.key].type == 'instance') {
                            icon = '/adapter/' + data.objects[node.key].common.name + '/' + data.objects[node.key].common.icon;
                        } else if (node.key.match(/^system\.adapter\./)) {
                            var instance = node.key.split('.', 3);
                            if (data.objects[node.key].common.icon[0] == '/') {
                                instance[2] += data.objects[node.key].common.icon;
                            } else {
                                instance[2] += '/' + data.objects[node.key].common.icon;
                            }
                            icon = '/adapter/' + instance[2];
                        } else {
                            var instance = node.key.split('.', 2);
                            if (data.objects[node.key].common.icon[0] == '/') {
                                instance[0] += data.objects[node.key].common.icon;
                            } else {
                                instance[0] += '/' + data.objects[node.key].common.icon;
                            }
                            icon = '/adapter/' + instance[0];
                        }
                    } else if (data.objects[node.key].type == 'device') {
                        icon = data.imgPath + 'device.png';
                        alt  = 'device';
                    } else if (data.objects[node.key].type == 'channel') {
                        icon = data.imgPath + 'channel.png';
                        alt  = 'channel';
                    } else if (data.objects[node.key].type == 'state') {
                        icon = data.imgPath + 'state.png';
                        alt  = 'state';
                    }
                }
                var _id_ = 'system.adapter.' + node.key;
                if (!data.noImg && data.objects[_id_] && data.objects[_id_].common && data.objects[_id_].common.icon) {
                    icon = '/adapter/' + data.objects[_id_].common.name + '/' + data.objects[_id_].common.icon;
                }
                if (icon) {
                    $tdList.eq(2).html('<img width=20 height=20 src="' + icon + '" alt="' + alt + '"/>');
                } else {
                    $tdList.eq(2).text('');
                }

                // (index #1 is rendered by fancytree)
                if (isCommon) {
                    $tdList.eq(3).text(data.objects[node.key].common.name);
                    $tdList.eq(base).text(data.objects[node.key].common.role);
                } else {
                    $tdList.eq(3).text('');
                    $tdList.eq(base).text('');
                }

                // (index #0 is rendered by fancytree by adding the checkbox)
                if(data.states && data.states[node.key]) {
                    var val = data.states[node.key].val;
                    if (val === undefined) val = '';
                    if (isCommon && data.objects[node.key].common.unit) val += ' ' + data.objects[node.key].common.unit;
                    $tdList.eq(base + 2).text(val);
                    $tdList.eq(base + 2).attr('title', val);
                } else {
                    $tdList.eq(base + 2).text('');
                    $tdList.eq(base + 2).attr('title', '');
                }
                if (data.buttons) {
                    if (data.objects[node.key]) {
                        var text = '';
                        for(var i = 0; i < data.buttons.length; i++) {
                            text += '<button data-id="' + node.key + '" class="button-' + i + '"></button>';
                        }
                        $tdList.eq(base + 3).html(text);
                        for(var i = 0; i < data.buttons.length; i++) {
                            $('.button-' + i + '[data-id="' + node.key + '"]').button(data.buttons[i]).click(function () {
                                var cb = $(this).data('callback');
                                if (cb) cb($(this).attr('data-id'));
                            }).data('callback', data.buttons[i].click);
                        }
                    } else {
                        $tdList.eq(base + 3).text('');
                    }
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
            var id = $('#filter_ID_' + data.instance).val().toLowerCase();
            if (id !== '' && node.key.indexOf(id) == -1) return false;

            var value = $('#filter_name_' + data.instance).val().toLowerCase();
            if (value !== '' && (!data.objects[node.key] || !data.objects[node.key].common || data.objects[node.key].common.name === undefined || data.objects[node.key].common.name.toLowerCase().indexOf(value) == -1)) return false;

            value = $('#filter_role_' + data.instance).val();
            if (value !== '' && (!data.objects[node.key] || !data.objects[node.key].common || data.objects[node.key].common.role === undefined || data.objects[node.key].common.role.indexOf(value) == -1)) return false;

            if (data.showTypes) {
                value = $('#filter_type_' + data.instance).val();
                if (value !== '' && (!data.objects[node.key] || data.objects[node.key].type === undefined || data.objects[node.key].type != value)) return false;
            }

            if (data.states) {
                value = $('#filter_value_' + data.instance).val().toLowerCase();
                if (value !== '' && (!data.states[node.key] || data.states[node.key].val === undefined || data.states[node.key].val.toString().toLowerCase().indexOf(value) == -1)) return false;
            }

            value = $('#filter_room_' + data.instance).val();
            if (value !== '') {
                if (!data.objects[node.key]) return false;
                var rooms = [];
                // Try to find room
                if (!data.rooms[node.key]) {
                    for (var i = 0; i < data.enums.length; i++) {
                        if (data.objects[data.enums[i]].common.members.indexOf(node.key) != -1) {
                            rooms.push(data.objects[data.enums[i]].common.name);
                        }
                        data.rooms[node.key] = rooms;
                    }
                } else {
                    rooms = data.rooms[node.key];
                }
                if (rooms.indexOf(value) == -1) return false;
            }

            return true;
        }

        $('.filter_' + data.instance).change(function() {
            $('#selectID_' + data.instance).fancytree("getTree").filterNodes(customFilter, false);
        }).keyup(function(){
            var tree = $('#selectID_' + data.instance)[0];
            if (tree._timer) {
                tree._timer = clearTimeout(tree._timer);
            }
            var that = this;
            tree._timer = setTimeout(function (){
                $(that).trigger('change');
            }, 200);
        });

        $('.filter_btn_' + data.instance).button({icons:{primary: 'ui-icon-close'}, text: false}).css({width: 18, height: 18}).click(function() {
            $('#' + $(this).attr('data-id')).val('').trigger('change');
        });
        $('#btn_collapse_' + data.instance).button({icons:{primary: 'ui-icon-folder-collapsed'}, text: false}).css({width: 18, height: 18}).click(function() {
            $('#selectID_' + data.instance).fancytree("getRootNode").visit(function(node){
                node.setExpanded(false);
            });
        });
        $('#btn_expand_' + data.instance).button({icons:{primary: 'ui-icon-folder-open'}, text: false}).css({width: 18, height: 18}).click(function() {
            $('#selectID_' + data.instance).fancytree("getRootNode").visit(function(node){
                node.setExpanded(true);
            });
        });
        $('#btn_refresh_' + data.instance).button({icons:{primary: 'ui-icon-refresh'}, text: false}).css({width: 18, height: 18}).click(function() {
            data.inited = false;
            initTreeDialog(data.$dlg);
        });
    }

    var methods = {
        "init": function (options) {
            // done, just to show possible settings, this is not required
            var settings = $.extend({
                currentId:  '',
                objects:    null,
                states:     null,
                filter:     null,
                imgPath:    'lib/css/fancytree/',
                connCfg:    null,
                onSuccess:  null,
                onChange:   null,
                noImg:      false,
                texts: {
                    select:   'Select',
                    cancel:   'Cancel',
                    all:      'All',
                    id:       'ID',
                    name:     'Name',
                    role:     'Role',
                    room:     'Room',
                    value:    'Value',
                    selectid: 'Select ID'
                }
            }, options);

            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                // Init data
                if (!data) {
                    data = {
                        tree:               {title: '', children: [], count: 0, inited: false},
                        enums:              [],
                        rooms:              {},
                        roles:              [],
                        types:              [],
                        regexSystemAdapter: new RegExp('^system.adapter.'),
                        regexSystemHost:    new RegExp('^system.host.'),
                        regexEnumRooms:     new RegExp('^enum.rooms.'),
                        /*                        filter:             JSON.parse(JSON.stringify(settings.filter)),
                      objects:            settings.objects,
                        currentId:          settings.currentId,
                        states:             settings.states,
                        imgPath:            settings.imgPath,
                        connCfg:            settings.connCfg,
                        noImg:              settings.noImg,
                        onSuccess:          settings.onSuccess,*/
                        instance:           instance++,
                        inited:             false
                    };
                    $dlg.data('selectId', data);
                }
                if (data.inited) {
                    // Re-init tree if filter or selectedID changed
                    if ((data.filter && !settings.filter && settings.filter !== undefined) ||
                        (!data.filter && settings.filter) ||
                        (data.filter && settings.filter && JSON.stringify(data.filter) != JSON.stringify(settings.filter))) {
                        data.inited = false;
                    }
                    if (data.inited && settings.currentId !== undefined && (data.currentId != settings.currentId)) data.inited = false;

                }
                data = $.extend(data, settings);
                // make a copy of filter
                data.filter = JSON.parse(JSON.stringify(data.filter));

                if (!data.objects && data.connCfg) {
                    // Read objects and states
                    data.socketURL = '';
                    data.socketSESSION = '';
                    if (typeof data.connCfg.socketUrl != 'undefined') {
                        data.socketURL = data.connCfg.socketUrl;
                        if (data.socketURL && data.socketURL[0] == ':') {
                            data.socketURL = jQuery(location).attr('protocol') + '://' + location.hostname + data.socketURL;
                        }
                        data.socketSESSION = data.connCfg.socketSession;
                    }

                    data.socket = io.connect(data.socketURL, {
                        'query': 'key=' + data.socketSESSION,
                        'reconnection limit': 10000,
                        'max reconnection attempts': Infinity
                    });

                    data.socket.on('connect', function () {
                        data.socket.emit('getObjects', function (err, res) {
                            data.objects = res;
                            data.socket.emit('getStates', function (err, res) {
                                data.states = res;
                            });
                        });
                    });
                }


                $dlg.data('selectId', data);

            }

            return this;
        },
        "show": function (currentId, filter, onSuccess) {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');

                if (data.inited) {
                    // Re-init tree if filter or selectedID changed
                    if ((data.filter && !filter && filter !== undefined) ||
                        (!data.filter && filter) ||
                        (data.filter &&  filter && JSON.stringify(data.filter) != JSON.stringify(filter))) {
                        data.inited = false;
                    }
                    if (data.inited && currentId !== undefined && (data.currentId != currentId)) data.inited = false;
                }
                if (currentId !== undefined) data.currentId = currentId;
                if (filter    !== undefined) data.filter    = JSON.parse(JSON.stringify(filter));
                if (onSuccess  !== undefined) {
                    data.onSuccess  = onSuccess;
                    data.$tree = $('#selectID_' + data.instance);
                    if (data.$tree[0]) data.$tree[0]._onSuccess = data.onSuccess;
                }

                if (!data.inited) {
                    data.$dlg = $dlg;
                    initTreeDialog($dlg);
                }
                if (!data.onChange) {
                    $dlg.dialog('option', 'title', data.texts.selectid +  ' - ' + (data.currentId || ' '));
                    if (data.currentId) {
                        if (data.objects[data.currentId] && data.objects[data.currentId].common && data.objects[data.currentId].common.name) {
                            $dlg.dialog('option', 'title', data.texts.selectid +  ' - ' + (data.objects[data.currentId].common.name || ' '));
                        } else {
                            $dlg.dialog('option', 'title', data.texts.selectid +  ' - ' + (data.currentId || ' '));
                        }
                    } else {
                        $('#' + data.instance + '-button-ok').addClass('ui-state-disabled');
                    }

                    $dlg.dialog('open');
                } else {
                    $dlg.show();
                }
 
            }

            return this;
        },
        "hide": function () {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                $dlg.dialog('hide');
            }
            return this;
        },
        "clear": function () {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                // Init data
                if (data) {
                    data.tree    = {title: '', children: [], count: 0, inited: false};
                    data.rooms   = {};
                    data.enums   = [];
                    data.roles   = [];
                    data.typse   = [];
                }
            }
            return this;
        },
        "getInfo": function (id) {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                if (data.objects) {
                    return data.objects[id];
                }
            }
            return null;
        },
        "destroy": function () {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                $dlg.data('selectId', null);
                $('#' + data.instance + '-div')[0].innerHTML('');
            }
            return this;
        },
        // update states
        "state": function (id, state) {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                if (!data || !data.states) continue;
                if (data.states[id] && state && data.states[id].val == state.val) return;
                data.states[id] = state;
                var tree = data.$tree.fancytree("getTree")
                var node = null;
                tree.visit(function(n){
                    if (n.key == id) {
                        node = n;
                        return false;
                    }
                });
                if (node) node.render(true);
            }
            return this;
        },
        // update objects
        "object": function (id, obj) {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                if (!data || !data.objects) continue;

                var tree = data.$tree.fancytree("getTree")
                var node = null;
                tree.visit(function(n){
                    if (n.key == id) {
                        node = n;
                        return false;
                    }
                });

                // If new node
                if (!node && obj) {
                    data.objects[id] = obj;
                    var addedNodes = [];
                    treeInsert(data, id, false, addedNodes);

                    for (var i = 0; i < addedNodes.length; i++) {
                        if (addedNodes[i].parent.key !== undefined) {
                            tree.visit(function(n){
                                if (n.key == addedNodes[i].parent.key) {
                                    node = n;
                                    return false;
                                }
                            });

                        } else {
                            node = data.$tree.fancytree("getRootNode");
                        }
                        // if no children
                        if (!node.children || !node.children.length) {
                            // add
                            node.addChildren(addedNodes[i]);
                        } else {
                            var c;
                            for (c = 0; c < node.children.length; c++) {
                                if (node.children[c].key > addedNodes[i].key) break;
                            }
                            // if some found greater than new one
                            if (c != node.children.length) {
                                node.addChildren(addedNodes[i], node.children[c]);
                            } else {
                                // just add
                                node.addChildren(addedNodes[i]);
                            }
                        }
                    }
                } else if (!obj) {
                    // object deleted
                    delete data.objects[id];
                    deleteTree(data, id);
                    if (node) {
                        if (node.children) {
                            //node.setTitle('');
                            node.render(true);
                        } else {
                            node.remove();
                        }
                    }
                } else {
                    // object updated
                    if (node) node.render(true);
                }
            }
            return this;
        }
    };

    $.fn.selectId = function (method) {
        if ( methods[method] ) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || ! method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method "' +  method + '" not found in jQuery.selectId');
        }
    };
})(jQuery);
