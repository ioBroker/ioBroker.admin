var _objTree = {title: '', children: [], count: 0, inited: false};
var _enums = [];
var _regexSystemAdapter = new RegExp('^system.adapter.');
var _regexSystemHost    = new RegExp('^system.host.');
var _regexEnumRooms     = new RegExp('^enum.rooms.');
var _imgPath = 'lib/css/fancytree/';

function selectID(elem, currentId, objects, states, filter, onChange) {
    var dom = document.getElementById(elem);
    if (!dom) {
        throw 'selectID: Cannot find ' + elem;
    }
    if (elem == '__clear__') {
        _objTree = {title: '', children: [], count: 0, inited: false};
        _enums   = [];
        return;
    }
    function _getAllStates(objects) {
        var states = [];
        for (var id in objects) {
            if (objects[id].type == 'state') {
                states.push(id);
                __treeInsert(id, currentId == id);
            } else if (objects[id].type == 'enum' && _regexEnumRooms.test(id)) {
                _enums.push(id);
            }
        }
        _objTree.inited = true;
        return states;
    }

    function __treeSplit(id, optimized) {
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

    if (!_objTree.inited || currentId) {
        var text = '<table id="selectID_header_' + elem + '" style="width: 100%;padding:0; height: 30"  cellspacing="0" cellpadding="0">';
        text += '<colgroup>';
        text += '            <col width="1px"/>';
        text += '            <col width="400px"/>';
        text += '            <col width="20px"/>';
        text += '            <col width="*"/>';
        text += '            <col width="150px"/>';
        text += '            <col width="150px"/>';
        text += '            <col width="150px"/>';
        text += '            <col width="18px"/>'; // TODO calculate width of scrollbar
        text += '        </colgroup>';
        text += '        <thead>';
        text += '            <tr><th></th><th>ID</th><th></th><th>Name</th><th>Role</th><th>Room</th><th>Value</th><th></th></tr>';
        text += '        </thead>';
        text += '    </table>';

        text += '<div style="width: 100%; height: 90%;padding:0; overflow-y: scroll">';
        text +=' <table id="selectID_' + elem + '" style="width: 100%;padding:0;table-layout:fixed; border:1px solid #f00;overflow:hidden;white-space:nowrap" cellspacing="0" cellpadding="0">';
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
        var $table = $('#selectID_' + elem);

        // Get all states
        var allStates = _getAllStates(objects);

        $('#selectID_' + elem).fancytree({
            titlesTabbable: true,     // Add all node titles to TAB chain
            quicksearch: true,
            source: _objTree.children,

            extensions: ["table", "gridnav"],

            table: {
                indentation: 20,
                nodeColumnIdx: 1
            },
            gridnav: {
                autofocusInput:   false,
                handleCursorKeys: true
            },
            activate: function(event, data){
                // A node was activated: display its title:
                if (typeof onChange == 'function') onChange(data.node.key);
            },
            renderColumns: function(event, data) {
                var node = data.node;
                var $tdList = $(node.tr).find(">td");

                var rooms = [];
                var isCommon = objects[node.key] && objects[node.key].common;
                // Try to find room
                for (var i = 0; i < _enums.length; i++) {
                    if (objects[_enums[i]].common.members.indexOf(node.key) != -1) {
                        rooms.push(objects[_enums[i]].common.name);
                    }
                }

                $tdList.eq(5).text(rooms.join(', '));
                if (isCommon) {
                    if (objects[node.key].common.icon) {
                        if (objects[node.key].type == 'instance') {
                            $tdList.eq(2).html('<img width=20 height=20 src="/adapter/' + objects[node.key].common.name + '/' + objects[node.key].common.icon + '" alt="device"/>');
                        }
                        else {
                            $tdList.eq(2).html('<img width=20 height=20 src="' + objects[node.key].common.icon + '" alt="device"/>');
                        }
                    } else if (objects[node.key].type == 'device') {
                        $tdList.eq(2).html('<img width=20 height=20 src="' + _imgPath + 'device.png" alt="device"/>');
                    } else if (objects[node.key].type == 'channel') {
                        $tdList.eq(2).html('<img width=20 height=30 src="' + _imgPath + 'channel.png" alt="device"/>');
                    } else if (objects[node.key].type == 'state') {
                        $tdList.eq(2).html('<img width=20 height=20 src="' + _imgPath + 'state.png" alt="device"/>');
                    } else if (objects[node.key].type == 'device') {

                    }
                }
                // (index #0 is rendered by fancytree by adding the checkbox)
                if(node.isFolder()) {
                    // make the title cell span the remaining columns, if it is a folder:
                    if (isCommon) {
                        $tdList.eq(4).text(objects[node.key].common.role);
                    }
                } else {
                    // (index #1 is rendered by fancytree)
                    if (isCommon) {
                        $tdList.eq(3).text(objects[node.key].common.name);
                        $tdList.eq(4).text(objects[node.key].common.role);
                    }
                    if (states[node.key]) {
                        var val = states[node.key].val;
                        if (val === undefined) val = '';
                        if (isCommon && objects[node.key].common.unit) val += ' ' + objects[node.key].common.unit;
                        $tdList.eq(6).text(val);
                        $tdList.eq(6).attr('title', val);
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
    }
}