

function selectID(elem, currentId, objects, states, onChange) {
    var dom = document.getElementById(elem);
    if (!dom) {
        throw 'selectID: Cannot find ' + elem;
    }
    var _objTree = {title: '', children: [], count: 0};

    var regexSystemAdapter = new RegExp('^system.adapter.');
    var regexSystemHost    = new RegExp('^system.host.');

    function _getAllStates(objects) {
        var states = [];
        for (var id in objects) {
            if (objects[id].type == 'state') {
                states.push(id);
                __treeInsert(id);
            }
        }
        return states;
    }

    function __treeSplit(id, optimized) {
        if (!id) {
            console.log('AAAA');
            return null;
        }
        var parts = id.split('.');
        if (regexSystemAdapter.test(id)) {
            if (parts.length > 3) {
                parts[0] = 'system.adapter.' + parts[2] + '.' + parts[3];
                parts.splice(1, 3);
            } else {
                parts[0] = 'system.adapter.' + parts[2];
                parts.splice(1, 2);
            }
        } else if (regexSystemHost.test(id)) {
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

    function __treeInsert(id) {
        ___treeInsert(_objTree, __treeSplit(id, false), id, 0);
    }

    function ___treeInsert(tree, parts, id, index) {
        if (!index) index = 0;

        var num = -1;
        for (var i = 0; i < tree.children.length; i++) {
            if (tree.children[i].name == parts[index]) {
                num = i;
                break;
            }
        }

        if (num == -1) {
            tree.count++;
            tree.folder = true;
            tree.expanded = false;
            var fullName = '';
            for (var i = 0; i <= index; i++) {
                fullName += ((fullName) ? '.' : '') + parts[i];
            }
            tree.children.push({name: parts[index], children: [], count: 0, parent: tree, title: fullName, folder: false, expanded: false});
            num = tree.children.length - 1;
        }
        if (parts.length - 1 == index) {
            tree.children[num].id = id;
        } else {
            ___treeInsert(tree.children[num], parts, id, index + 1);
        }
    }

    var text = '<table id="selectID_header_' + elem + '" style="width: 100%;padding:0; height: 30"  cellspacing="0" cellpadding="0">';
    text += '<colgroup>';
    text += '            <col width="1px"/>';
    text += '            <col width="40px"/>';
    text += '            <col width="400px"/>';
    text += '            <col width="*"/>';
    text += '            <col width="150px"/>';
    text += '            <col width="150px"/>';
    text += '            <col width="150px"/>';
    text += '            <col width="18px"/>'; // TODO calculate width of scrollbar
    text += '        </colgroup>';
    text += '        <thead>';
    text += '            <tr><th></th><th>#</th> <th>ID</th> <th>Name</th> <th>Role</th> <th>Room</th> <th>Value</th><th></th></tr>';
    text += '        </thead>';
    text += '    </table>';

    text += '<div style="width: 100%; height: 90%;padding:0; overflow-y: scroll">';
    text +=' <table id="selectID_' + elem + '" style="width: 100%;padding:0"  cellspacing="0" cellpadding="0">';
    text += '        <colgroup>';
    text += '            <col width="1px"/>';
    text += '            <col width="40px"/>';
    text += '            <col width="400px"/>';
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

    var SOURCE = [
        {title: "node 1", folder: true, expanded: true, children: [
            {title: "node 1.1", refKey: "node 1/node 1.1", extraClasses: "1"},
            {title: "node 1.2", refKey: "node 1/node 1.2", extraClasses: "2"}
        ]},
        {title: "node 2", folder: true, expanded: false, children: [
            {title: "node 2.1", refKey: "node 2/node 1.1", extraClasses: "3"},
            {title: "node 2.2", refKey: "node 2/node 1.2", extraClasses: "4"}
        ]}
    ];

    $('#selectID_' + elem).fancytree({
        titlesTabbable: true,     // Add all node titles to TAB chain
        quicksearch: true,
        source: _objTree.children,

        // extensions: ["edit", "table", "gridnav"],
        extensions: ["table", "gridnav"],

        table: {
            indentation: 20,
            nodeColumnIdx: 2,
            checkboxColumnIdx: 0
        },
        gridnav: {
            autofocusInput: false,
            handleCursorKeys: true
        },
        /*lazyLoad: function(event, data) {
            data.result = {url: "../demo/ajax-sub2.json"};
        },*/
        activate: function(event, data){
            // A node was activated: display its title:
            if (typeof onChange == 'function') onChange(data.node.title);
        },
        renderColumns: function(event, data) {
            var node = data.node;
                //$select = $("<select />"),
            var $tdList = $(node.tr).find(">td");

            // (index #0 is rendered by fancytree by adding the checkbox)
            if( node.isFolder() ) {
                // make the title cell span the remaining columns, if it is a folder:
                if (node.data.parent && node.data.parent.children) {
                    for (var t = 0; t < node.data.parent.children.length; t++) {
                        if (node.data.name == node.data.parent.children[t].name) {
                            $tdList.eq(1).html(t + 1).css({'text-align': 'right', height: 20});
                            break;
                        }
                    }
                }
                $tdList.eq(4).text(objects[node.title].common.role);
                /*$tdList.eq(2)
                    .prop("colspan", 5)
                    .nextAll().remove();*/
            } else {
                $tdList.eq(1).text(node.getIndexHier()).css({'text-align': 'right', height: 20});
                // (index #2 is rendered by fancytree)
                var $spans = $tdList.eq(2).find(">span");
                $spans.eq(2).html(objects[node.title].common.name);
                $tdList.eq(3).text(objects[node.title].common.name);
                $tdList.eq(4).text(objects[node.title].common.role);
                /*$tdList.eq(4).html("<input type='input' value='" + "" + "'>");
                $tdList.eq(5).html("<input type='checkbox' value='" + "" + "'>");
                $tdList.eq(6).html("<input type='checkbox' value='" + "" + "'>");*/
                //$("<option />", {text: "a", value: "a"}).appendTo($select);
                //$("<option />", {text: "b"}).appendTo($select);
                //$tdList.eq(7).html($select);
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

        if (e.which === $.ui.keyCode.UP && e.ctrlKey) {
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