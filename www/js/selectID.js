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
 */
(function( $ ) {
    var instance = 0;
    function getAllStates(data) {
        var objects = data.objects;
        var filter  = data.filter;
        for (var id in objects) {
            if (objects[id].type == 'state') {
                if (filter && filter.common &&
                    filter.common.history && filter.common.history.enabled) {
                    if (!objects[id].common ||
                        !objects[id].common.history ||
                        !objects[id].common.history.enabled) continue;
                }

                treeInsert(data, id, data.currentId == id);
            } else if (objects[id].type == 'enum' && data.regexEnumRooms.test(id)) {
                data.enums.push(id);
            }
        }
        data.inited = true;
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

    function treeInsert(data, id, isExpanded) {
        _treeInsert(data.tree, treeSplit(data, id, false), id, 0, isExpanded);
    }

    function _treeInsert(tree, parts, id, index, isExpanded) {
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
            _treeInsert(tree.children[num], parts, id, index + 1, isExpanded);
        }
    }

    function initTreeDialog($dlg) {
        var data = $dlg.data('selectId');
        // Get all states
        getAllStates(data);

        if (!data.buttons) {
            data.buttons = [
                {
                    id:   data.instance + '-button-ok',
                    text: _('Select'),
                    click: function () {
                        var _data = $dlg.data('selectId');
                        if (_data && _data.onSuccess) _data.onSuccess(_data.selectedID, _data.currentId);
                        $dlg.dialog('close');
                    }
                },
                {
                    id:   data.instance + '-button-cancel',
                    text: _('Cancel'),
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
                buttons:  data.buttons
            });
        }

        var rooms = [];
        var textRooms = '<select id="filter_room_' + data.instance + '" class="filter_' + data.instance + '"><option value="">' + _('All') + '</option>';
        for (var i = 0; i < data.enums.length; i++) {
            rooms.push({title: data.objects[data.enums[i]].common.name, key: data.enums[i]});
            textRooms += '<option value="' + data.objects[data.enums[i]].common.name + '">' + data.objects[data.enums[i]].common.name + '</option>';
        }

        textRooms += '</select>';

        var text = '<div id="'+ data.instance + '-div" style="width:100%; height:100%"><table id="selectID_header_' + data.instance + '" style="width: 100%;padding:0; height: 50" cellspacing="0" cellpadding="0">';
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
        text += '            <tr><th></th><th><table style="width: 100%; padding:0" cellspacing="0" cellpadding="0"><tr><td><button id="btn_collapse_' + data.instance + '"></button></td><td><button id="btn_expand_' + data.instance + '"></button></td><td style="width: 100%; text-align: center; font-weight: bold">' + _('ID') + '</td></tr></table></th><th></th><th>' + _('Name') + '</th><th>' + _('Role') + '</th><th>' + _('Room') + '</th><th>' + _('Value') + '</th><th></th></tr>';
        text += '        </thead>';
        text += '        <tbody>';
        text += '            <tr><td></td>';
        text += '               <td><table style="width:100%"><tr><td style="width:100%"><input style="width:100%" type="text" id="filter_ID_'    + data.instance + '" class="filter_' + data.instance + '"/></td><td><button data-id="filter_ID_'    + data.instance + '" class="filter_btn_' + data.instance + '"></button></td></tr></table></td>';
        text += '               <td></td>';
        text += '               <td><table style="width:100%"><tr><td style="width:100%"><input style="width:100%" type="text" id="filter_name_'  + data.instance + '" class="filter_' + data.instance + '"/></td><td><button data-id="filter_name_'  + data.instance + '" class="filter_btn_' + data.instance + '"></button></td></tr></table></td>';
        text += '               <td><table style="width:100%"><tr><td style="width:100%"><input style="width:100%" type="text" id="filter_role_'  + data.instance + '" class="filter_' + data.instance + '"/></td><td><button data-id="filter_role_'  + data.instance + '" class="filter_btn_' + data.instance + '"></button></td></tr></table></td>';
        text += '               <td>' + textRooms /*<table style="width:100%"><tr><td style="width:100%"><input style="width:100%" type="text" id="filter_room_'  + data.instance + '" class="filter_' + data.instance + '"/></td><td><button data-id="filter_room_'  + data.instance + '" class="filter_btn_' + data.instance + '"></button></td></tr></table>*/ + '</td>';
        text += '               <td><table style="width:100%"><tr><td style="width:100%"><input style="width:100%" type="text" id="filter_value_' + data.instance + '" class="filter_' + data.instance + '"/></td><td><button data-id="filter_value_' + data.instance + '" class="filter_btn_' + data.instance + '"></button></td></tr></table></td>';
        text += '               <td></td></tr>';
        text += '        </tbody>';
        text += '    </table>';

        text += '<div style="width: 100%; height: 85% ;padding:0; overflow-y: scroll">';
        text +=' <table id="selectID_' + data.instance + '" style="width: 100%;padding:0;table-layout:fixed; overflow:hidden;white-space:nowrap" cellspacing="0" cellpadding="0">';
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
        text += '    </table></div></div>';

        $dlg.append(text);

        data.$tree = $('#selectID_' + data.instance);
        data.$tree[0]._onChange = data.onSuccess;

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
                _data.selectedID = newId;
                if (_data.objects[newId] && _data.objects[newId].common && _data.objects[newId].common.name) {
                    $dlg.dialog('option', 'title', _('Select ID') +  ' - ' + (_data.objects[newId].common.name || ' '));
                } else {
                    $dlg.dialog('option', 'title', _('Select ID') +  ' - ' + (newId || ' '));
                }
                if (_data.objects[newId] && _data.objects[newId].type == 'state') {
                    $('#' + _data.instance + '-button-ok').removeClass('ui-state-disabled');
                } else {
                    $('#' + _data.instance + '-button-ok').addClass('ui-state-disabled');
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

                $tdList.eq(5).text(rooms.join(', '));
                var icon = '';
                var alt = '';
                if (isCommon) {
                    if (data.objects[node.key].common.icon) {
                        if (data.objects[node.key].type == 'instance') {
                            icon = '/adapter/' + data.objects[node.key].common.name + '/' + data.objects[node.key].common.icon;
                        }
                        else {
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
                if (data.objects[_id_] && data.objects[_id_].common && data.objects[_id_].common.icon) {
                    icon = '/adapter/' + data.objects[_id_].common.name + '/' + data.objects[_id_].common.icon;
                }
                if (icon) $tdList.eq(2).html('<img width=20 height=20 src="' + icon + '" alt="' + alt + '"/>');

                // (index #1 is rendered by fancytree)
                if (isCommon) {
                    $tdList.eq(3).text(data.objects[node.key].common.name);
                    $tdList.eq(4).text(data.objects[node.key].common.role);
                }

                // (index #0 is rendered by fancytree by adding the checkbox)
                if(data.states[node.key]) {
                    var val = data.states[node.key].val;
                    if (val === undefined) val = '';
                    if (isCommon && data.objects[node.key].common.unit) val += ' ' + data.objects[node.key].common.unit;
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
            var id = $('#filter_ID_' + data.instance).val();
            if (id !== '' && node.key.indexOf(id) == -1) return false;
            var value = $('#filter_name_' + data.instance).val();
            if (value !== '' && (!data.objects[node.key] || !data.objects[node.key].common || data.objects[node.key].common.name === undefined || data.objects[node.key].common.name.indexOf(value) == -1)) return false;
            value = $('#filter_role_' + data.instance).val();
            if (value !== '' && (!data.objects[node.key] || !data.objects[node.key].common || data.objects[node.key].common.role === undefined || data.objects[node.key].common.role.indexOf(value) == -1)) return false;
            value = $('#filter_value_' + data.instance).val();
            if (value !== '' && (!options.states[node.key] || options.states[node.key].val === undefined || options.states[node.key].val.toString().indexOf(value) == -1)) return false;
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
    }

    var methods = {
        init: function (options) {
            // done, just to show possible settings, this is not required
            var settings = $.extend({
                currentId: '',
                objects:   null,
                states:    null,
                filter:    null,
                imgPath:   'lib/css/fancytree/',
                connCfg:   null,
                onSuccess:  null,
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
                        regexSystemAdapter: new RegExp('^system.adapter.'),
                        regexSystemHost:    new RegExp('^system.host.'),
                        regexEnumRooms:     new RegExp('^enum.rooms.'),
                        currentId:          settings.currentId,
                        filter:             JSON.parse(JSON.stringify(settings.filter)),
                        objects:            settings.objects,
                        states:             settings.states,
                        imgPath:            settings.imgPath,
                        connCfg:            settings.connCfg,
                        onSuccess:           settings.onSuccess,
                        instance:           instance++,
                        inited:             false
                    }
                    $dlg.data('selectId', data);
                }
                if (data.inited) {
                    // Re-init tree if filter or selectedID changed
                    if ((data.filter && !settings.filter) ||
                        (!data.filter && settings.filter) ||
                        (data.filter && settings.filter && JSON.stringify(data.filter) != JSON.stringify(settings.filter))) {
                        data.inited = false;
                    }
                    if (data.inited && (data.currentId != settings.currentId)) data.inited = false;

                    data.currentId = settings.currentId;
                    data.filter =    JSON.parse(JSON.stringify(filter));
                    data.objects =   settings.objects;
                    data.states =    settings.states;
                    data.imgPath =   settings.imgPath;
                    data.connCfg =   settings.connCfg;
                    data.onSuccess =  settings.onSuccess;
                }

                if (!data.objects && data.connCfg) {
                    // Read objects and states
                    data.socketURL = '';
                    data.socketSESSION = '';
                    if (typeof data.connCfg.socketUrl != 'undefined') {
                        data.socketURL = data.connCfg.socketUrl;
                        if (data.socketURL && data.socketURL[0] == ':') {
                            data.socketURL = 'http://' + location.hostname + data.socketURL;
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
        show: function (currentId, filter, onSuccess) {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');

                if (data.inited) {
                    // Re-init tree if filter or selectedID changed
                    if ((data.filter && !filter) ||
                        (!data.filter && filter) ||
                        (data.filter &&  filter && JSON.stringify(data.filter) != JSON.stringify(filter))) {
                        data.inited = false;
                    }
                    if (data.inited && (data.currentId != currentId)) data.inited = false;
                }
                if (currentId !== undefined) data.currentId = currentId;
                if (filter    !== undefined) data.filter    = JSON.parse(JSON.stringify(filter));
                if (onSuccess  !== undefined) {
                    data.onSuccess  = onSuccess;
                    data.$tree = $('#selectID_' + data.instance);
                    if (data.$tree[0]) data.$tree[0]._onSuccess = data.onSuccess;
                }

                if (!data.inited) {
                    initTreeDialog($dlg);
                }
                $dlg.dialog('option', 'title', _('Select ID') +  ' - ' + (data.currentId || ' '));
                if (data.currentId) {
                    if (data.objects[data.currentId] && data.objects[data.currentId].common && data.objects[data.currentId].common.name) {
                        $dlg.dialog('option', 'title', _('Select ID') +  ' - ' + (data.objects[data.currentId].common.name || ' '));
                    } else {
                        $dlg.dialog('option', 'title', _('Select ID') +  ' - ' + (data.currentId || ' '));
                    }
                } else {
                    $('#' + data.instance + '-button-ok').addClass('ui-state-disabled');
                }

                $dlg.dialog('open');

            }

            return this;
        },
        hide: function () {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                $dlg.dialog('hide');
            }
            return this;
        },
        clear: function () {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                // Init data
                if (data) {
                    data.tree    = {title: '', children: [], count: 0, inited: false};
                    data.rooms   = {};
                    data.enums   = [];
                }
            }
            return this;
        },
        destroy: function () {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                $dlg.data('selectId', null);
                $('#' + data.instance + '-div')[0].innerHTML('');
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
