/* global jQuery */
/* global document */
/* jshint -W097 */
/* jshint strict: false */
/*
 MIT, Copyright 2014-2021 bluefox <dogafox@gmail.com>, soef <soef@gmx.net>

 version: 1.1.8 (2021.03.17)

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
             getObjects: null,     // null or function to read all objects anew on refresh (because of subscripitons): funsubscriptionsjects) {}
             states:     null,     // All states of objects. It can be empty if connCfg used. If objects are set and no states, states will no be shown.
             filter:     null,     // filter
             imgPath:    'lib/css/fancytree/', // Path to images device.png, channel.png and state.png
             connCfg:    null,     // configuration for dialog, to read objects itself: {socketUrl: socketUrl, socketSession: socketSession}
             onSuccess:  null,     // callback function to be called if user press "Select". Can be overwritten in "show" - function (newId, oldId, newObj)
             onChange:   null,     // called every time the new object selected - function (newId, oldId, newObj)
             noDialog:   false,    // do not make dialog
             stats:      false,    // show objects statistics
             noMultiselect: false, // do not make multiselect
             useValues:  false,    // show button to toggle objects<=>values
             buttons:    null,     // array with buttons, that should be shown in last column
                                   // if array is not empty it can has following fields
                                   // [{
                                   //   text: false, // same as jquery button
                                   //   icons: {     // same as jquery bdata.columnsutton
                                   //       primary: 'ui-icon-gear'
                                   //   },
                                   //   click: function (id) {
                                   //                // do on click
                                   //   },
                                   //   match: function (id) {
                                   //                // you have here object "this" pointing to $('button')
                                   //   },
                                   //   width: 26,   // same as jquery button
                                   //   height: 20   // same as jquery button
                                   // }],
             panelButtons: null,   // array with buttons, that should be shown at the top of dialog (near expand all)
             list:       false,    // tree view or list view
             name:       null,     // name of the dialog to store filter settings
             noCopyToClipboard: false, // do not show button for copy to clipboard
             root:       null,     // root node, e.g. "script.js"
             useNameAsId: false,   // use name of object as ID
             noColumnResize: false, // do not allow column resize
             firstMinWidth: null,  // width if ID column, default 400
             showButtonsForNotExistingObjects: false,
             allowSelectionOfNonExistingObjects: false, // allow select of e.g. "system.adapter" object, even it is not really exists
             webServer:    null,   // link to webserver, by default ":8082"
             filterPresets: null,  // Object with predefined filters, eg {role: 'level.dimmer'} or {type: 'state'}
             roleExactly:   false, // If the role must be equal or just content the filter value
             sortConfig: {
                     statesFirst: true,     // Show states before folders
                     ignoreSortOrder: false // Ignore standard sort order of fancytree
             },
             texts: {
                 select:   'Select',
                 cancel:   'Cancel',
                 all:      'All',
                 id:       'ID',
                 name:     'Name',
                 role:     'Role',
                 type:     'Type',
                 room:     'Room',
                 'function': 'Function',
                 enum:     'Members',
                 value:    'Value',
                 selectid: 'Select ID',
                 from:     'From',
                 user:     'user',
                 lc:       'Last changed',
                 ts:       'Time stamp',
                 ack:      'Acknowledged',
                 expand:   'Expand all nodes',
                 collapse: 'Collapse all nodes',
                 refresh:  'Rebuild tree',
                 edit:     'Edit',
                 ok:       'Ok',
                 push:     'Trigger event'
                 wait:     'Processing...',
                 list:     'Show list view',
                 tree:     'Show tree view',
                 selectAll: 'Select all',
                 unselectAll: 'Unselect all',
                 invertSelection: 'Invert selection',
                 copyToClipboard: 'Copy to clipboard',
                 expertMode: 'Toggle expert mode',
                 button:    'Settings',
                 noData:    'No data',
                 Objects:   'Objects',
                 States:    'States',
                 toggleValues: 'Toggle states view'
             },
             columns: ['image', 'name', 'type', 'role', 'enum', 'room', 'function', 'value', 'button', 'value.val', 'value.ts', 'value.lc', 'value.from', 'value.q'],
                                // some elements of columns could be an object {name: field, data: function (id, name){}, title: function (id, name) {}}
             widths:    null,   // array with width for every column
             editEnd:   null,   // function (id, newValues) for edit lines (only id and name can be edited)
             editStart: null,   // function (id, $inputs) called after edit start to correct input fields (inputs are jquery objects),
             zindex:    null,   // z-index of dialog or table
             customButtonFilter: null, // if in the filter over the buttons some specific button must be shown. It has type like {icons:{primary: 'ui-icon-close'}, text: false, callback: function ()}
             expertModeRegEx: null // list of regex with objects, that will be shown only in expert mode, like  /^system\.|^iobroker\.|^_|^[\w-]+$|^enum\.|^[\w-]+\.admin/
             quickEdit:  null,   // list of fields with edit on click. Elements can be just names from standard list or objects like:
                                 // {name: 'field', options: {a1: 'a111_Text', a2: 'a22_Text'}}, options can be a function (id, name), that give back such an object
             quickEditCallback: null, // function (id, attr, newValue, oldValue),
             readyCallback: null // called when objects and states are read from server (only if connCfg is not null). function (err, objects, states)
             expandedCallback: null, // called when some node was expanded. function (id, childrenCount, statesCount)
             collapsedCallback: null, // called when some node was expanded. function (id, childrenCount, statesCount)
        }
 +  show(currentId, filter, callback) - all arguments are optional if set by "init". Callback is like function (newId, oldId) {}. If multiselect, so the arguments are arrays.
 +  clear() - clear object tree to read and build anew (used only if objects set by "init")
 +  getInfo(id) - get information about ID
 +  getTreeInfo(id) - get {id, parent, children, object}
 +  state(id, val) - update states in tree
 +  object(id, obj) - update object info in tree
 +  reinit() - draw tree anew


 filter is like:
     common: {
         history: true
     }
  or
     type: "state"

 ## How to use
 ```
 <!-- Somewhere in HTML -->
    <div id="dialog-select-member" style="display: none"></div>
 ```

 ```
 // In Javascript
 // Name "dialog-select-member" is important, because for that exist the CSS classes
 // Important to have "admin/img/big-info.png" in too, because this icon will be loaded if no icon found, elsewise we have endless loop
 var selectId;
 function initSelectId (cb) {
     if (selectId) return cb ? cb(selectId) : selectId;
    socket.emit('getObjects', function (err, res) {
        if (!err && res) {
            selectId = $('#dialog-select-member').selectId('init',  {
                noMultiselect: true,
                objects: res,
                imgPath:       '../../lib/css/fancytree/',
                filter:        {type: 'state'},
                name:          'adapter-select-state',
                texts: {
                    select:          _('Select'),
                    cancel:          _('Cancel'),
                    all:             _('All'),
                    id:              _('ID'),
                    name:            _('Name'),
                    role:            _('Role'),
                    room:            _('Room'),
                    value:           _('Value'),
                    selectid:        _('Select ID'),
                    from:            _('From'),
                    lc:              _('Last changed'),
                    ts:              _('Time stamp'),
                    wait:            _('Processing...'),
                    ack:             _('Acknowledged'),
                    selectAll:       _('Select all'),
                    unselectAll:     _('Deselect all'),
                    invertSelection: _('Invert selection')
                },
                columns: ['image', 'name', 'role', 'room', 'value']
            });
            cb && cb(selectId);
        }
    });
}
  ```

 */

var addAll2FilterCombobox = false;

function tdp(x, decimals) {
    // TODO support of US format too
    return isNaN(x) ? '' : x.toFixed(decimals || 0).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function removeImageFromSettings(data) {
    if (!data || !data.columns) return;
    var idx = data.columns.indexOf('image');
    if (idx >= 0) data.columns.splice(idx, 1);
}

var lineIndent = '5px';

function span(txt, attr) {
    //if (txt === undefined) txt = '';
    //return txt;

    var style = 'padding-left: ' + lineIndent + ';';
    if (attr) style += attr;
    return '<span style="' + style + '">' + txt + '</span>';
}

function filterChanged(e) {
    var $e  = $(e);
    var val = $e.val();
    var td  = $e.parent();
    if (val) {
        td.addClass('filter-active');
    } else {
        td.removeClass('filter-active');
    }
}

(function ($) {
    'use strict';

    if ($.fn.selectId) return;

    var isMaterial;

    function getNameObj(obj, id) {
        if (obj && obj.common) {
            return getName(obj.common.name || (id || '').split('.').pop());
        } else {
            return (id || '').split('.').pop();
        }
    }

    function formatDate(dateObj) {
        //return dateObj.getFullYear() + '-' +
        //    ('0' + (dateObj.getMonth() + 1).toString(10)).slice(-2) + '-' +
        //    ('0' + (dateObj.getDate()).toString(10)).slice(-2) + ' ' +
        //    ('0' + (dateObj.getHours()).toString(10)).slice(-2) + ':' +
        //    ('0' + (dateObj.getMinutes()).toString(10)).slice(-2) + ':' +
        //    ('0' + (dateObj.getSeconds()).toString(10)).slice(-2);
        // Following implementation is 5 times faster
        if (!dateObj) return '';

        var text = dateObj.getFullYear();
        var v = dateObj.getMonth() + 1;
        if (v < 10) {
            text += '-0' + v;
        } else {
            text += '-' + v;
        }

        v = dateObj.getDate();
        if (v < 10) {
            text += '-0' + v;
        } else {
            text += '-' + v;
        }

        v = dateObj.getHours();
        if (v < 10) {
            text += ' 0' + v;
        } else {
            text += ' ' + v;
        }
        v = dateObj.getMinutes();
        if (v < 10) {
            text += ':0' + v;
        } else {
            text += ':' + v;
        }

        v = dateObj.getSeconds();
        if (v < 10) {
            text += ':0' + v;
        } else {
            text += ':' + v;
        }

        v = dateObj.getMilliseconds();
        if (v < 10) {
            text += '.00' + v;
        } else if (v < 100) {
            text += '.0' + v;
        } else {
            text += '.' + v;
        }

        return text;
    }

    function filterId(data, id) {
        if (data.rootExp) {
            if (!data.rootExp.test(id)) return false;
        }
        // ignore system objects in expert mode
        if (data.expertModeRegEx && !data.expertMode && data.expertModeRegEx.test(id)) {
            return false;
        }

        // ignore exeprt objects in expert mode
        if (!data.expertMode && data.objects[id] && data.objects[id].common && data.objects[id].common.expert) {
            return;
        }

        if (data.filter) {
            if (data.filter.type && data.filter.type !== data.objects[id].type) return false;

            if (data.filter.common && data.filter.common.custom) {
                if (!data.objects[id].common) return false;
                // todo: remove history sometime 09.2016
                var custom = data.objects[id].common.custom || data.objects[id].common.history;

                if (!custom) return false;
                if (data.filter.common.custom === true) {
                    return true;
                } else {
                    if (!custom[data.filter.common.custom]) return false;
                }
            }
        }
        return true;
    }

    function getExpandeds(data) {
        if (!data.$tree) return null;
        var expandeds = {};
        (function getIt(nodes) {
            if (!Array.isArray(nodes.children)) return;
            for (var i = 0, len = nodes.children.length; i < len; i++) {
                var node = nodes.children[i];
                if (node.expanded) {
                    expandeds[node.key] = true;
                }
                getIt(node);
            }
        })(data.$tree.fancytree('getRootNode'));
        return expandeds;
    }

    function restoreExpandeds(data, expandeds) {
        if (!expandeds || !data.$tree) return;
        (function setIt(nodes) {
            if (!Array.isArray(nodes.children)) return;
            for (var i = 0, len = nodes.children.length; i < len; i++) {
                var node = nodes.children[i];
                if (expandeds[node.key]) {
                    try {
                        node.setExpanded();
                    } catch (e) {
                        console.log('Cannot expand: ' + e);
                    }
                    //node.setActive();
                }
                setIt(node);
            }
        })(data.$tree.fancytree('getRootNode'));
        expandeds = null;
    }

    function sortTree(data) {
        var objects = data.objects;
        var checkStatesFirst;
        switch (data.sortConfig.statesFirst) {
            case undefined: checkStatesFirst = function () { return 0 }; break;
            case true:      checkStatesFirst = function (child1, child2) { return ((~~child2.folder) - (~~child1.folder))}; break;
            case false:     checkStatesFirst = function (child1, child2) { return ((~~child1.folder) - (~~child2.folder))}; break;
        }

        // function compAdapterAndInstance(c1, c2) {
        //     var s1 = c1.key.substr(0, c1.key.lastIndexOf('.'));
        //     var s2 = c2.key.substr(0, c2.key.lastIndexOf('.'));
        //
        //     if (s1 > s2) return 1;
        //     if (s1 < s2) return -1;
        //     return 0;
        // }

        function sortByName(child1, child2) {
            var ret = checkStatesFirst(child1, child2);
            if (ret) return ret;

            var o1 = objects[child1.key], o2 = objects[child2.key];
            if (o1 && o2) {
                var c1 = o1.common, c2 = o2.common;
                if (c1 && c2) {

                    // var s1 = child1.key.substr(0, child1.key.lastIndexOf('.')); // faster than regexp.
                    // var s2 = child2.key.substr(0, child2.key.lastIndexOf('.'));
                    // if (s1 > s2) return 1;
                    // if (s1 < s2) return -1;

                    if (!data.sortConfig.ignoreSortOrder && c1.sortOrder && c2.sortOrder) {
                        if (c1.sortOrder > c2.sortOrder) return 1;
                        if (c1.sortOrder < c2.sortOrder) return -1;
                        return 0;
                    }
                    var name1;
                    var name2;
                    if (c1.name) {
                        name1 = c1.name;
                        if (typeof name1 === 'object') {
                            name1 = (name1[systemLang] || name1.en).toLowerCase();
                        } else {
                            name1 = name1.toLowerCase();
                        }
                    } else {
                        name1 = child1.key;
                    }
                    if (c2.name) {
                        name2 = c2.name;
                        if (typeof name2 === 'object') {
                            name2 = (name2[systemLang] || name2.en).toLowerCase();
                        } else {
                            name2 = name2.toLowerCase();
                        }
                    } else {
                        name2 = child1.key;
                    }
                    if (name1 > name2) return 1;
                    if (name1 < name2) return -1;
                }
            }
            if (child1.key > child2.key) return 1;
            if (child1.key < child2.key) return -1;
            return 0;
        }

        function sortByKey(child1, child2) {
            var ret = checkStatesFirst(child1, child2);
            if (ret) return ret;
            if (!data.sortConfig.ignoreSortOrder) {
                var o1 = objects[child1.key], o2 = objects[child2.key];
                if (o1 && o2) {
                    var c1 = o1.common, c2 = o2.common;
                    if (c1 && c2 && c1.sortOrder && c2.sortOrder) {
                        // var s1 = child1.key.substr(0, child1.key.lastIndexOf('.'));  // faster than regexp.
                        // var s2 = child2.key.substr(0, child2.key.lastIndexOf('.'));
                        // if (s1 > s2) return 1;
                        // if (s1 < s2) return -1;

                        if (c1.sortOrder > c2.sortOrder) return 1;
                        if (c1.sortOrder < c2.sortOrder) return -1;
                        return 0;
                    }
                }
            }
            if (child1.key > child2.key) return 1;
            if (child1.key < child2.key) return -1;
            return 0;
        }

        var sortFunc = data.sort ? sortByName : sortByKey;
        var sfunc = sortByKey; // sort the root always by key
        return (function sort(tree) {
            if (!tree || !tree.children) return;
            try {
                tree.sortChildren(sfunc);
            } catch (e) {
                console.log(e);
            }
            sfunc = sortFunc;
            for (var i=tree.children.length-1; i>=0; i--) {
                sort(tree.children[i]);
            }
        })(data.$tree.fancytree('getRootNode'));

        // var sortFunc = data.sort ? sortByName : sortByKey;
        // var root = data.$tree.fancytree('getRootNode');
        // root.sortChildren(sortByKey, false);
        // return (function sort(tree) {
        //     if (!tree) return;
        //     for (var i=tree.children.length-1; i>=0; i--) {
        //         var child = tree.children[i];
        //         if (!child) return;
        //         child.sortChildren(sortFunc);
        //         sort(child.children);
        //     }
        // })(root.children);


        //data.$tree.fancytree('getRootNode').sortChildren(data.sort ? sortByName : sortByKey, true);
        //var tree = data.$tree.fancytree('getTree');
        //var node = tree.getActiveNode();
    }

    function getAllStates(data) {
        var stats   = data.stats ? {objs: 0, states: 0} : null;
        var objects = data.objects;
        var isType  = data.columns.indexOf('type') !== -1;
        var isRoom  = data.columns.indexOf('room') !== -1;
        var isFunc  = data.columns.indexOf('function') !== -1;
        var isRole  = data.columns.indexOf('role') !== -1;
        var isHist  = data.columns.indexOf('button') !== -1;

        data.tree = {title: '', children: [], count: 0, root: true};
        data.roomEnums = [];
        data.funcEnums = [];
        data.ids       = [];

        for (var id in objects) {
            if (!objects.hasOwnProperty(id)) continue;
            if (!id) {
                console.error('Invalid empty ID found! Please fix it');
                continue;
            }
            stats && stats.objs++;

            if (objects[id].type === 'state') {
                stats && stats.states++;
            } else if (data.valuesActive) {
                continue;
            }

            if (isRoom) {
                if (objects[id].type === 'enum' && data.regexEnumRooms.test(id) && data.roomEnums.indexOf(id) === -1) data.roomEnums.push(id);
                if (objects[id].enums) {
                    for (var e in objects[id].enums) {
                        if (data.regexEnumRooms.test(e) && data.roomEnums.indexOf(e) === -1) {
                            data.roomEnums.push(e);
                        }
                        data.objects[e] = data.objects[e] || {
                            _id: e,
                            common: {
                                name: objects[id].enums[e],
                                members: [id]
                            }
                        };
                        data.objects[e].common.members = data.objects[e].common.members || [];
                        if (data.objects[e].common.members.indexOf(id) === -1) {
                            data.objects[e].common.members.push(id);
                        }
                    }
                }
            }
            if (isFunc) {
                if (objects[id].type === 'enum' && data.regexEnumFuncs.test(id)  && data.funcEnums.indexOf(id) === -1) {
                    data.funcEnums.push(id);
                }
                if (objects[id].enums) {
                    for (var e in objects[id].enums) {
                        if (data.regexEnumFuncs.test(e) && data.funcEnums.indexOf(e) === -1) {
                            data.funcEnums.push(e);
                        }
                        data.objects[e] = data.objects[e] || {
                            _id: e,
                            common: {
                                name: objects[id].enums[e],
                                members: [id]
                            }
                        };
                        data.objects[e].common.members = data.objects[e].common.members || [];
                        if (data.objects[e].common.members.indexOf(id) === -1) {
                            data.objects[e].common.members.push(id);
                        }
                    }
                }
            }

            if (isType && objects[id].type && data.types.indexOf(objects[id].type) === -1) data.types.push(objects[id].type);

            if (isRole && objects[id].common && objects[id].common.role) {
                try {
                    var parts = objects[id].common.role.split('.');
                    var role = '';
                    for (var u = 0; u < parts.length; u++) {
                        role += (role ? '.' : '') + parts[u];
                        if (data.roles.indexOf(role) === -1) data.roles.push(role);
                    }
                } catch (e) {
                    console.error('Cannot parse role "' + objects[id].common.role + '" by ' + id);
                }
            }
            if (isHist && objects[id].type === 'instance' && (objects[id].common.type === 'storage' || objects[id].common.supportCustoms)) {
                var h = id.substring('system.adapter.'.length);
                if (data.histories.indexOf(h) === -1) {
                    data.histories.push(h);
                }
            }

            if (!filterId(data, id)) continue;

            treeInsert(data, id, data.currentId === id);

            if (objects[id].enums) {
                for (var ee in objects[id].enums) {
                    if (objects[id].enums.hasOwnProperty(ee) &&
                        objects[ee] &&
                        objects[ee].common &&
                        objects[ee].common.members &&
                        objects[ee].common.members.indexOf(id) === -1) {
                        objects[ee].common.members.push(id);
                    }
                }
            }

            // fill counters
            data.expertMode && data.ids.push(id);
        }
        data.inited = true;
        data.roles.sort();
        data.types.sort();
        data.roomEnums.sort();
        data.funcEnums.sort();
        data.histories.sort();
        data.ids.sort();
        if (stats) {
            data.stats = stats;
        }
    }

    function treeSplit(data, id) {
        if (!id) return null;
        if (data.root) {
            id = id.substring(data.root.length);
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
        } else if (parts.length > 1 && !data.root) {
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
            if (deletedNodes && node.id) {
                deletedNodes.push(node);
            }
            var p = node.parent;
            if (p.children.length <= 1) {
                _deleteTree(node.parent);
            } else {
                for (var z = 0; z < p.children.length; z++) {
                    if (node.key === p.children[z].key) {
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
        if (!node) {
            console.log('deleteTree: Id ' + id + ' not found');
            return;
        }
        _deleteTree(node, deletedNodes);
    }

    function findTree(data, id) {
        return (function find(tree) {
            if (!tree.children) return;
            for (var i = tree.children.length - 1; i >= 0; i--) {
                var child = tree.children[i];
                if (id === child.key) return child;
                if (id.startsWith(child.key + '.')) {
                    //if (id === child.key) return child;
                    return find(child);
                }
            }
            return null;
        })(data.tree);
    }

    // function xfindTree(data, id) {
    //     return _findTree(data.tree, treeSplit(data, id, false), 0);
    // }
    // function _findTree(tree, parts, index) {
    //     var num = -1;
    //     for (var j = 0; j < tree.children.length; j++) {
    //         if (tree.children[j].title === parts[index]) {
    //             num = j;
    //             break;
    //         }
    //         //if (tree.children[j].title > parts[index]) break;
    //     }
    //
    //     if (num === -1) return null;
    //
    //     if (parts.length - 1 === index) {
    //         return tree.children[num];
    //     } else {
    //         return _findTree(tree.children[num], parts, index + 1);
    //     }
    // }

    /*
    function treeInsert(data, id, isExpanded, addedNodes) {
        var idArr = data.list ? [id] : treeSplit(data, id);
        if (!idArr) return console.error('Empty object ID!');

        (function insert(tree, idx) {
            for ( ; idx < idArr.length; idx += 1) {
                for (var i = tree.children.length - 1; i >= 0; i--) {
                    var child = tree.children[i];
                    if (id === child.key) return child;
                    if (id.startsWith (child.key + '.')) {
                        //if (id === child.key) return child;
                        child.expanded = child.expanded || isExpanded;
                        return insert (child, idx + 1);
                    }
                }
                tree.folder = true;
                tree.expanded = isExpanded;

                var obj = {
                    key: (data.root || '') + idArr.slice (0, idx + 1).join ('.'),
                    children: [],
                    title: idArr[idx],
                    folder: false,
                    expanded: false,
                    parent: tree
                };
                //data.objects[obj.key].node = obj;
                tree.children.push (obj);
                if (addedNodes) {
                    addedNodes.push (obj);
                }
                tree = obj;
            }
            tree.id = id;
        })(data.tree, 0);
    } */

    function treeInsert(data, id, isExpanded, addedNodes) {
        return _treeInsert(data.tree, data.list ? [id] : treeSplit(data, id, false), id, 0, isExpanded, addedNodes, data);
    }
    function _treeInsert(tree, parts, id, index, isExpanded, addedNodes, data) {
        index = index || 0;

        if (!parts) {
            console.error('Empty object ID!');
            return;
        }

        var num = -1;
        var j;
        for (j = 0; j < tree.children.length; j++) {
            if (tree.children[j].title === parts[index]) {
                num = j;
                break;
            }
            //if (tree.children[j].title > parts[index]) break;
        }

        if (num === -1) {
            tree.folder   = true;
            tree.expanded = isExpanded;

            var fullName = '';
            for (var i = 0; i <= index; i++) {
                fullName += ((fullName) ? '.' : '') + parts[i];
            }
            var obj = {
                key:      (data.root || '') + fullName,
                children: [],
                title:    parts[index],
                folder:   false,
                expanded: false,
                parent:   tree
            };
            if (j === tree.children.length) {
                num = tree.children.length;
                tree.children.push(obj);
            } else {
                num = j;
                tree.children.splice(num, 0, obj);
            }
            if (addedNodes) {
                addedNodes.push(tree.children[num]);
            }
        }
        if (parts.length - 1 === index) {
            tree.children[num].id = id;
        } else {
            tree.children[num].expanded = tree.children[num].expanded || isExpanded;
            _treeInsert(tree.children[num], parts, id, index + 1, isExpanded, addedNodes, data);
        }
    }

    function showActive($dlg, scrollIntoView)  {
        var data = $dlg.data('selectId');
        // Select current element
        if (data.selectedID) {
            data.$tree.fancytree('getTree').visit(function (node) {
                if (node.key === data.selectedID) {
                    try {
                        node.setActive();
                        node.makeVisible({scrollIntoView: scrollIntoView || false});
                        //$(node).find('table.fancytree-ext-table tbody tr td') //xxx
                    } catch (err) {
                        console.error(err);
                    }
                    return false;
                }
            });
        }
    }

    function syncHeader($dlg) {
        var data = $dlg.data('selectId');
        if (!data) return;
        var $header = $dlg.find('.main-header-table');
        var thDest  = $header.find('>tbody>tr>th');	//if table headers are specified in its semantically correct tag, are obtained
        var thSrc   = data.$tree.find('>tbody>tr>td');

        var x, o;
        for (var i = 0; i < thDest.length - 1; i++) {
            if ((x = $(thSrc[i]).width())) {
                $(thDest[i]).attr('width', x);
                if ((o = $(thSrc[i + 1]).offset().left)) {
                    if ((o -= $(thDest[i + 1]).offset().left)) {
                        $(thDest[i]).attr('width', x + o);
                    }
                }
            }
        }
    }

    function getName(name) {
        if (name && typeof name === 'object') {
            return name[systemLang] || name.en;
        } else {
            return name || '';
        }
    }

    function findRoomsForObject(data, id, withParentInfo, rooms) {
        if (!id) {
            return [];
        }
        rooms = rooms || [];
        for (var i = 0; i < data.roomEnums.length; i++) {
            var common = data.objects[data.roomEnums[i]] && data.objects[data.roomEnums[i]].common;
            var name = getName(common.name);

            if (common.members && common.members.indexOf(id) !== -1 && rooms.indexOf(name) === -1) {
                if (!withParentInfo) {
                    rooms.push(name);
                } else {
                    rooms.push({name: name, origin: id});
                }
            }
        }
        var parts = id.split('.');
        parts.pop();
        id = parts.join('.');
        if (data.objects[id]) findRoomsForObject(data, id, withParentInfo, rooms);

        return rooms;
    }

    function findRoomsForObjectAsIds(data, id, rooms) {
        if (!id) {
            return [];
        }
        rooms = rooms || [];
        for (var i = 0; i < data.roomEnums.length; i++) {
            var common = data.objects[data.roomEnums[i]] && data.objects[data.roomEnums[i]].common;
            if (common && common.members && common.members.indexOf(id) !== -1 &&
                rooms.indexOf(data.roomEnums[i]) === -1) {
                rooms.push(data.roomEnums[i]);
            }
        }
        return rooms;
    }

    function findFunctionsForObject(data, id, withParentInfo, funcs) {
        if (!id) {
            return [];
        }
        funcs = funcs || [];
        for (var i = 0; i < data.funcEnums.length; i++) {
            var common = data.objects[data.funcEnums[i]] && data.objects[data.funcEnums[i]].common;
            var name = getName(common.name);
            if (common && common.members && common.members.indexOf(id) !== -1 && funcs.indexOf(name) === -1) {
                if (!withParentInfo) {
                    funcs.push(name);
                } else {
                    funcs.push({name: name, origin: id});
                }
            }
        }
        var parts = id.split('.');
        parts.pop();
        id = parts.join('.');
        if (data.objects[id]) findFunctionsForObject(data, id, withParentInfo, funcs);

        return funcs;
    }

    function findFunctionsForObjectAsIds(data, id, funcs) {
        if (!id) {
            return [];
        }
        funcs = funcs || [];
        for (var i = 0; i < data.funcEnums.length; i++) {
            var common = data.objects[data.funcEnums[i]] && data.objects[data.funcEnums[i]].common;
            if (common && common.members && common.members.indexOf(id) !== -1 &&
                funcs.indexOf(data.funcEnums[i]) === -1) {
                funcs.push(data.funcEnums[i]);
            }
        }

        return funcs;
    }

    function clippyCopy(e) {
        var $input = $('<input>');
        $(this).append($input);
        $input.val($(this).parent().data('clippy'));
        $input.trigger('select');
        document.execCommand('copy');
        $input.remove();
        e.preventDefault();
        e.stopPropagation();
    }

    function editValueDialog() {
        var data    = $(this).data('data');
        var $parent = $(this).parent();
        var value   = $parent.data('clippy');
        var id      = $parent.data('id');
        var $dlg    = $('#dialog-value-edit');
        if (typeof M !== 'undefined' && $dlg.length) {
            $dlg.find('textarea').val(value);
            $dlg.find('input[type="checkbox"]').prop('checked', false);

            // workaround for materialize checkbox problem
            $dlg.find('input[type="checkbox"]+span').off('click').on('click', function () {
                var $input = $(this).prev();
                if (!$input.prop('disabled')) {
                    $input.prop('checked', !$input.prop('checked')).trigger('change');
                }
            });

            $dlg.find('.btn-set').off('click').on('click', function () {
                var val = $dlg.find('textarea').val();
                var ack = $dlg.find('input[type="checkbox"]').prop('checked');
                if (val !== value || ack) {
                    data.quickEditCallback(id, 'value', val, value, ack);
                    value = '<span style="color: darkviolet; width: 100%;">' + value + '</span>';
                    $parent.html(value);
                }
                $dlg.modal('close');
            });
            $dlg.modal().modal('open');
        } else {
            $('<div style="position: absolute;left: 5px; top: 5px; right: 5px; bottom: 5px; border: 1px solid #CCC;">' +
                '<textarea style="margin: 0; border: 0;background: white; width: 100%; height: calc(100% - 50px); resize: none;" ></textarea><br>' +
                '<input type="checkbox" /><span>' + _('ack') + '</span></div>')
                .dialog({
                    autoOpen: true,
                    modal: true,
                    title: data.texts.edit,
                    width: '50%',
                    height: 200,
                    open: function (event) {
                        $(this).find('textarea').val(value);
                        $(this).find('input[type="checkbox"]').prop('checked', false);
                        $(event.target).parent().find('.ui-dialog-titlebar-close .ui-button-text').html('');
                    },
                    buttons: [
                        {
                            text: data.texts.select,
                            click: function () {
                                var val = $(this).find('textarea').val();
                                var ack = $(this).find('input[type="checkbox"]').prop('checked');
                                if (val !== value || ack) {
                                    data.quickEditCallback(id, 'value', val, value, ack);
                                    value = '<span style="color: darkviolet; width: 100%;">' + value + '</span>';
                                    $parent.html(value);
                                }
                                $(this).dialog('close').dialog('destroy').remove();
                            }
                        },
                        {
                            text: data.texts.cancel,
                            click: function () {
                                $(this).dialog('close').dialog('destroy').remove();
                            }
                        }
                    ]
                });
        }
    }

    function editEnumsDialog() {
        var data    = $(this).data('data');
        var $parent = $(this).parent();
        var id      = $parent.data('id');
        var oldVal  = $parent.data('old-value');
        var $dlg    = $('#dialog-enum-edit');
        var attr    = $parent.data('name');
        if (typeof M !== 'undefined' && $dlg.length) {
            var funcs = [];
            var text = '';
            $dlg.find('.name').html(getNameObj(data.objects[id], id));
            var enums = attr === 'function' ? data.funcEnums : data.roomEnums;
            for (var i = 0; i < enums.length; i++) {
                var common = data.objects[enums[i]] && data.objects[enums[i]].common;
                var name = getName(common.name);
                if (funcs.indexOf(name) === -1) {
                    funcs.push(name);
                    var checked = common && common.members && common.members.indexOf(id) !== -1;
                    text +=
                        '<li class="collection-item">' +
                        getSelectIdIcon(data, data.objects[enums[i]]) +
                        '   <span class="title">' + name + '<span class="dialog-enum-list-id">' + enums[i] + '</span></span>' +
                        '   ' +
                        '   <label class="secondary-content">' +
                        '       <input class="filled-in" type="checkbox" ' + (checked ? 'checked' : '') + ' data-id="' + enums[i] + '" data-name="' + name + '"/>' +
                        '       <span></span>' +
                        '   </label>' +
                        '</li>';
                }
            }

            $dlg.find('.collection').html(text);

            // workaround for materialize checkbox problem
            $dlg.find('input[type="checkbox"]').off('click').on('click', function () {
                var $input = $(this).prev();
                if (!$input.prop('disabled')) {
                    $input.prop('checked', !$input.prop('checked')).trigger('change');
                }
            });

            $dlg.find('.btn-set').off('click').on('click', function () {
                var checks = $dlg.find('input[type="checkbox"]');
                var val = [];
                var names = [];
                checks.each(function () {
                    if ($(this).prop('checked')) {
                        val.push($(this).data('id'));
                        names.push($(this).data('name'))
                    }
                });

                if (JSON.stringify(oldVal) !== JSON.stringify(val)) {
                    data.quickEditCallback(id, attr, val, oldVal);
                    var value = '<span style="color: darkviolet; width: 100%;">' + names.join(', ') + '</span>';
                    $parent.html(value);
                }
                $dlg.modal('close');
            });
            $dlg.modal().modal('open');
        } else {
            // todo
        }
    }
    function getSelectIdIcon(data, obj, key) {
        var icon = '';
        var alt  = '';
        var _id_ = 'system.adapter.' + key;
        if (key && data.objects[_id_] && data.objects[_id_].common && data.objects[_id_].common.icon) {
            // if not BASE64
            if (!data.objects[_id_].common.icon.match(/^data:image\//)) {
                if (data.objects[_id_].common.icon.indexOf('.') !== -1) {
                    icon = '/adapter/' + data.objects[_id_].common.name + '/' + data.objects[_id_].common.icon;
                } else {
                    return '<i class="material-icons iob-list-icon">' + data.objects[_id_].common.icon + '</i>';
                }
            } else {
                icon = data.objects[_id_].common.icon;
            }
        } else
        if (obj && obj.common) {
            if (obj.common.icon) {
                if (!obj.common.icon.match(/^data:image\//)) {
                    if (obj.common.icon.indexOf('.') !== -1) {
                        var instance;
                        if (obj.type === 'instance') {
                            icon = '/adapter/' + obj.common.name + '/' + obj.common.icon;
                        } else if (key && key.match(/^system\.adapter\./)) {
                            instance = key.split('.', 3);
                            if (obj.common.icon[0] === '/') {
                                instance[2] += obj.common.icon;
                            } else {
                                instance[2] += '/' + obj.common.icon;
                            }
                            icon = '/adapter/' + instance[2];
                        } else {
                            instance = key.split('.', 2);
                            if (obj.common.icon[0] === '/') {
                                instance[0] += obj.common.icon;
                            } else {
                                instance[0] += '/' + obj.common.icon;
                            }
                            icon = '/adapter/' + instance[0];
                        }
                    } else {
                        return '<i class="material-icons iob-list-icon">' + obj.common.icon + '</i>';
                    }
                } else {
                    // base 64 image
                    icon = obj.common.icon;
                }
            } else if (obj.type === 'device') {
                icon = data.imgPath + 'device.png';
                alt  = 'device';
            } else if (obj.type === 'channel') {
                icon = data.imgPath + 'channel.png';
                alt  = 'channel';
            } else if (obj.type === 'state') {
                icon = data.imgPath + 'state.png';
                alt  = 'state';
            }
        }

        if (icon) {
            return '<img class="iob-list-icon" onerror="this.src=\'img/info-big.png\';" src="' + icon + '" alt="' + alt + '"/>';
        } else {
            return '';
        }
    }

    function clippyShow(e) {
        var text;
        var data;
        if ($(this).hasClass('clippy') && !$(this).find('.clippy-button').length) {
            data = data || $(this).data('data');
            text = '<button class="clippy-button ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only td-button m" ' +
                'role="button" title="' + data.texts.copyToClipboard + '">';
            if (typeof M !== 'undefined') {
                text += '<i class="material-icons tiny">content_copy</i>'
            } else {
                text += '<span class="ui-button-icon-primary ui-icon ui-icon-clipboard"></span>'
            }
            text += '</button>';

            $(this).append(text);
            var $clippy = $(this).find('.clippy-button');
            $clippy.on('click', clippyCopy);
        }

        if ($(this).hasClass('edit-dialog') && !$(this).find('.edit-dialog-button').length) {
            data = data || $(this).data('data');
            text = '<button class="edit-dialog-button ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only td-button m" ' +
                'role="button" title="' + (data.texts.editDialog || '') + '">';
            if (typeof M !== 'undefined') {
                text += '<i class="material-icons tiny">edit</i>'
            } else {
                text += '<span class="ui-button-icon-primary ui-icon ui-icon-pencil"></span>';
            }
            text += '</button>';
            $(this).append(text);
            var name = $(this).data('name');
            if (name === 'function' || name === 'room') {
                $(this).find('.edit-dialog-button').on('click', editEnumsDialog).data('data', data);
            } else {
                $(this).find('.edit-dialog-button').on('click', editValueDialog).data('data', data);
            }
        }
    }

    function clippyHide(e) {
        $(this).find('.clippy-button').remove();
        $(this).find('.edit-dialog-button').remove();
    }

    function installColResize(data, $dlg) {
        if (data.noColumnResize || !$.fn.colResizable) return;

        if (data.$tree.is(':visible')) {
            data.$tree.colResizable({
                liveDrag:       true,
                //resizeMode:   'flex',
                resizeMode:     'fit',
                minWidth:       50,

                partialRefresh: true,
                marginLeft:     5,
                postbackSafe:   true,

                onResize: function (/* event */) {
                    syncHeader($dlg);
                }
            });
            syncHeader($dlg);
        } else {
            setTimeout(function () {
                installColResize(data, $dlg);
            }, 400)
        }
    }

    function getStates(data, id) {
        var states;
        if (data.objects[id] &&
            data.objects[id].common &&
            data.objects[id].common.states) {
            states = data.objects[id].common.states;
        }
        if (states) {
            if (typeof states === 'string' && states[0] === '{') {
                try {
                    states = JSON.parse(states);
                } catch (ex) {
                    console.error('Cannot parse states: ' + states);
                    states = null;
                }
            } else
            // if old format val1:text1;val2:text2
            if (typeof states === 'string') {
                var parts = states.split(';');
                states = {};
                for (var p = 0; p < parts.length; p++) {
                    var s = parts[p].split(':');
                    states[s[0]] = s[1];
                }
            }
        }
        return states;
    }

    function setFilterVal(data, field, val) {
        if (!field) return;
        data.$dlg.find('.filter[data-index="' + field + '"]').val(val).trigger('change');
    }

    function onQuickEditField(event) {
        var $this   = $(this);
        var id      = $this.data('id');
        var attr    = $this.data('name');
        var data    = $this.data('selectId');
        var type    = $this.data('type');
        var innerHTML = this.innerHTML;
        var $parentTR = $(event.currentTarget).parent();
        // actually $parentTR === $thisParent, but I dont know
        var $thisParent = $this.parent();
        var clippy  = $thisParent.hasClass('clippy');
        var editDialog = $thisParent.hasClass('edit-dialog');
        var options = $this.data('options');
        var oldVal  = $this.data('old-value');
        var states  = null;
        //var activeNode = $(this).fancytree('getTree').getActiveNode();

        if (clippy)  {
            $thisParent.removeClass('clippy');
            $thisParent.find('.clippy-button').remove(); // delete clippy buttons because they overlay the edit field
        }
        if (editDialog) {
            $thisParent.removeClass('edit-dialog');
            $thisParent.find('.edit-dialog-button').remove(); // delete edit buttons because they overlay the edit field
        }
        $thisParent.css({overflow: 'visible'});
        $this.css({overflow: 'visible'});
        $this.closest('td').css({overflow: 'visible'});
        $this.off('click').removeClass('select-id-quick-edit').css('position', 'relative');

        type = type === 'boolean' ? 'checkbox' : 'text';
        var text;
        var editType = type;
        data.editing = true; // ignore pressing of DEL button

        switch (attr) {
            case 'value':
                states = getStates(data, id);
                if (states) {
                    text = '<select style="width: calc(100% - 50px); z-index: 2">';
                    for (var s in states) {
                        if (!states.hasOwnProperty(s) || typeof states[s] !== 'string') continue;
                        text += '<option value="' + s + '">' + states[s] + '</option>';
                    }
                    text += '</select>';
                    editType = 'select';
                }
                break;
            case 'room':
                states = findRoomsForObjectAsIds (data, id) || [];
                text = '<select style="width: calc(100% - 50px); z-index: 2" multiple="multiple">';
                for (var ee = 0; ee < data.roomEnums.length; ee++) {
                    var room = data.objects[data.roomEnums[ee]];
                    var rName;
                    if (room && room.common && room.common.name) {
                        rName = getName(room.common.name);
                    } else {
                        rName = data.roomEnums[ee].split('.').pop();
                    }

                    text += '<option value="' + data.roomEnums[ee] + '" ' + (states.indexOf(data.roomEnums[ee]) !== -1 ? 'selected' : '') + '>' + rName + '</option>';
                }
                text += '</select>';
                editType = 'select';
                break;
            case 'function':
                states = findFunctionsForObjectAsIds (data, id) || [];
                text = '<select style="width: calc(100% - 50px); z-index: 2" multiple="multiple">';
                for (var e = 0; e < data.funcEnums.length; e++) {
                    var func = data.objects[data.funcEnums[e]];
                    var fName;
                    if (func && func.common && func.common.name) {
                        fName = getName(func.common.name);
                    } else {
                        fName = data.funcEnums[e].split('.').pop();
                    }
                    text += '<option value="' + data.funcEnums[e] + '" ' + (states.indexOf(data.funcEnums[e]) !== -1 ? 'selected' : '') + '>' + fName + '</option>';
                }
                text += '</select>';
                editType = 'select';
                break;
            default: if (options) {
                if (typeof options === 'function') {
                    states = options(id, attr);
                } else {
                    states = options;
                }
                if (states) {
                    text = '<select style="width: calc(100% - 50px); z-index: 2">';
                    for (var t in states) {
                        if (states.hasOwnProperty(t)) {
                            text += '<option value="' + t + '">' + states[t] + '</option>';
                        }
                    }
                    text += '</select>';
                    editType = 'select';
                } else if (states === false) {
                    return;
                }
            }
        }

        text = text || '<input style="z-index: 2" type="' + type + '"' + (type !== 'checkbox' ? 'class="objects-inline-edit"' : '') + '/>';

        var timeout = null;

        if (attr === 'room' || attr === 'function' || attr === 'role') {
            editType = 'select';
        }

        var oldLeftPadding = $this.css('padding-left');
        var oldWidth       = $this.css('width');
        var isTitleEdit    = $this.is('.objects-name-coll-title');

        $this.html(text +
            '<div class="select-id-quick-edit-buttons m ' + editType + '">' +
            '   <div class="ui-icon ui-icon-check select-id-quick-edit-ok"></div>' +
            '   <div class="cancel ui-icon ui-icon-close select-id-quick-edit-cancel" title="' + data.texts.cancel + '"></div>' +
            '</div>');

        $this.css({'padding-left': 2, width: isTitleEdit ? 'calc(100% - 28px)' : '100%'});

        var $input = (attr === 'function' || attr === 'room' || states) ? $this.find('select') : $this.find('input');

        if (attr === 'room' || attr === 'function') {
            $input.multiselect({
                autoOpen: true,
                close: function () {
                    $input.trigger('blur');
                }
            });
        } else if (attr === 'role')  {
            // remove jquery UI - todo
            $input.autocomplete({
                minLength:  0,
                source:     data.roles
            }).on('focus', function () {
                $(this).autocomplete('search', '');
            });
        }

        if (editType === 'select') {
            if ($input.width() > $this.width() - 34) {
                var x = Math.max($input.width() - ($this.width() - 34), 34);
                $input.css({'padding-right': x});
            }
        }
        function editDone(ot) {
            if (ot === undefined) ot = innerHTML;
            innerHTML = null;
            if (clippy) {
                $thisParent.addClass('clippy');
            }
            if (editDialog) {
                $thisParent.addClass('edit-dialog');
            }
            $thisParent.css({overflow: 'hidden'});
            $this.css({overflow: 'hidden'});
            $this.closest('td').css({overflow: 'hidden'});
            $this.css({'padding-left': oldLeftPadding, width: oldWidth ? oldWidth: null});
            $this.html(ot).off('click').on('click', onQuickEditField).addClass('select-id-quick-edit');
            //if (activeNode && activeNode.length) activeNode.setActive();
            setTimeout(function () {
                //$(event.currentTarget).parent().trigger('click'); // re-select the line so we can continue using the keyboard
                $parentTR.trigger('click'); // re-select the line so we can continue using the keyboard
            }, 50);

            data.editing = false;

            //var $parentTR = $(event.currentTarget).parent();
            $parentTR.focus().trigger('select');
        }

        function handleCancel(e) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            e.preventDefault();
            e.stopPropagation();
            editDone();
        }

        $this
            .find('.select-id-quick-edit-cancel')
            .on('click', handleCancel).on('mousedown', function (e) {
                handleCancel(e);
            });

        $this
            .find('.select-id-quick-edit-ok')
            .on('click', function ()  {
                var _$input = (attr === 'function' || attr === 'room' || states) ? $this.find('select') : $this.find('input');
                _$input.trigger('blur');
            });

        if (type === 'checkbox') {
            $input.prop('checked', oldVal);
        } else {
            if (attr !== 'room' && attr !== 'function') {
                $input.val(oldVal);
            }
        }

        $input.blur(function () {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(function () {
                var _oldText = $this.data('old-value');
                var val = $(this).attr('type') === 'checkbox' ? $(this).prop('checked') : $(this).val();
                if ((attr === 'room' || attr === 'function') && !val) {
                    val = [];
                }

                if (attr === 'value' || JSON.stringify(val) !== JSON.stringify(_oldText)) {
                    data.quickEditCallback(id, attr, val, _oldText);
                    _oldText = '<span style="color: rgb(192, 0, 1); width: 100%;">' + _oldText + '</span>';
                }
                editDone(_oldText);
            }.bind(this), 100);
        }).keyup(function (e) {
            if (e.which === 13) $(this).trigger('blur');
            if (e.which === 27) {
                handleCancel(e);
            }
        });

        if (typeof event === 'object') {
            event.preventDefault();
            event.stopPropagation();
        }

        setTimeout(function () {
            $input.focus().trigger('select');
        }, 100);
    }

    function quality2text(q) {
        if (!q) return 'ok';
        var custom = q & 0xFFFF0000;
        var text = '';
        if (q & 0x40) text += 'device';
        if (q & 0x80) text += 'sensor';
        if (q & 0x01) text += ' bad';
        if (q & 0x02) text += ' not connected';
        if (q & 0x04) text += ' error';

        return text + (custom ? '|0x' + (custom >> 16).toString(16).toUpperCase() : '') + ' [0x' + q.toString(16).toUpperCase() + ']';
    }

    function forEachColumn (data, cb) {
        for (var c = 0; c < data.columns.length; c++) {
            var name = data.columns[c];
            if (typeof name === 'object') {
                if (name.hasOwnProperty('name')) {
                    name = name.name;
                } else if (name.hasOwnProperty('en')) {
                    name = name[systemLang] || name.en;
                }
            }
            cb (name, c);
        }
    }

    function initTreeDialog($dlg) {
        var c;
        $dlg.addClass('dialog-select-object-ids');
        var data = $dlg.data('selectId');
        if (!data) {
            return;
        }

        if ($dlg.attr('id') !== 'dialog-select-member' && $dlg.attr('id') !== 'dialog-select-members') {
            $dlg.css({height: '100%', width: '100%'});
        } else {
            $dlg.css({height: 'calc(100% - 110px)', width: 'calc(100% - 20px)'});
        }

        //var noStates = (data.objects && !data.states);
        var multiselect = (!data.noDialog && !data.noMultiselect);

        // load expert mode flag
        if (typeof Storage !== 'undefined') {
            if (data.name) {
                if (data.expertModeRegEx) {
                    data.expertMode = window.localStorage.getItem(data.name + '-expert');
                    data.expertMode = (data.expertMode === true || data.expertMode === 'true');
                }
                data.sort = window.localStorage.getItem(data.name + '-sort');
                data.sort = (data.sort === true || data.sort === 'true');

                if (data.useValues) {
                    data.valuesActive = window.localStorage.getItem(data.name + '-values');
                    data.valuesActive = (data.valuesActive === true || data.valuesActive === 'true');
                }
            }
        }
        // switch columns
        if (data.useValues && data.valuesActive) {
            data._columns = data._columns || data.columns;
            data.columns = data.useValues === true ? ['ID', 'name', 'value.from', 'value.q', 'value.ts', 'value.lc', 'value.val', 'button'] : data.useValues;
        } else if (data._columns) {
            data.columns = data._columns;
        }

        if (data.columns && data.columns[0] !== 'ID') {
            data.columns.unshift('ID');
            if (data.widths) data.widths.unshift('200px');
        }

        removeImageFromSettings(data);

        // Get all states
        var expandeds = getExpandeds(data);
        getAllStates(data);

        var filter = {};
        forEachColumn(data, function (name) {
            filter[name] = $dlg.find('.filter[data-index="' + name + '"]').val();
        });

        function getComboBoxEnums(kind) {
            var i, ret = [];
            switch (kind) {
                case 'room':
                    for (i = 0; i < data.roomEnums.length; i++) {
                        ret.push(getNameObj(data.objects[data.roomEnums[i]], data.roomEnums[i]));
                    }
                    // if (data.rooms) delete data.rooms;
                    // if (data.roomsColored) delete data.roomsColored;
                    return ret;
                case 'function':
                    for (i = 0; i < data.funcEnums.length; i++) {
                        ret.push(getNameObj(data.objects[data.funcEnums[i]], data.funcEnums[i]));
                    }
                    // if (data.funcs) delete data.funcs;
                    // if (data.funcsColored) delete data.funcsColored;
                    return ret;
                case 'role':
                    for (var j = 0; j < data.roles.length; j++) {
                        ret.push(data.roles[j]);
                    }
                    return ret;
                case 'type':
                    for (var k = 0; k < data.types.length; k++) {
                        ret.push(data.types[k]);
                    }
                    return ret;
                case 'button':
                    ret.push([data.texts.all, '']);
                    ret.push([data.texts.with, 'true']);
                    ret.push([data.texts.without, 'false']);
                    for (var h = 0; h < data.histories.length; h++) {
                        ret.push(data.histories[h]);
                    }
                    return ret;
            }
            return ret;
        }

        // toolbar buttons
        var tds =
            '<button class="ui-button-icon-only panel-button btn-refresh"></button>\n' +
            '<button class="panel-button btn-list"></button>\n' +
            '<button class="panel-button btn-collapse"></button>\n'  +
            '<button class="panel-button btn-expand"></button>\n' +
            '<div class="select-id-custom-buttons"></div>\n';

        if (data.useValues) {
            tds += '<button class="panel-button btn-values"></button>\n';
        }

        if (data.filter && data.filter.type === 'state' && multiselect) {
            tds +=
                '<div class="iob-toolbar-sep"></div>\n' +
                '<button class="panel-button btn-select-all"></button>\n' +
                '<button class="panel-button btn-unselect-all"></button>\n' +
                '<button class="panel-button btn-invert-selection"></button>\n';
        }
        if (data.expertModeRegEx) {
            tds += '<div class="iob-toolbar-sep"></div><button class="panel-button btn-expert"></button>';
        }
        tds += '<button class="panel-button btn-sort"></button>';

        if (data.panelButtons) {
            tds += '<div class="iob-toolbar-sep"></div>\n';
            for (c = 0; c < data.panelButtons.length; c++) {
                tds += '<button class="panel-button btn-custom-' + c + '"></button>\n';
            }
        }

        if (data.useHistory) {
            tds += '<button class="panel-button btn-history"></button>\n';
        }
        if (typeof data.stats === 'object') {
            tds += '<div class="objects-info">' +
            '<span class="objects-title">' + data.texts['Objects'] + ': </span>' +
            '<span class="objects-val-objs">' + data.stats.objs + '</span>, ' +
            '<span class="objects-title">' + data.texts['States'] + ': </span>' +
            '<span class="objects-val-states">' + data.stats.states + '</span></div>';
        }

        var height = '100%';
        if (!data.noDialog && !isMaterial) {
            height = Math.round(window.innerHeight * 0.6) + 'px';
        }

        var text =
            '<div class="dialog-select-container' + (isMaterial ? ' material' : ' old-style') + '" style="width: 100%; height: ' + height + '">\n' +
            '    <div class="main-toolbar-table m">' + tds + '</div>\n' +
            '       <table class="main-header-table">\n'
        ;

        function textFilterText(filterNo, placeholder) {
            if (placeholder === undefined) {
                placeholder = data.texts[filterNo.toLowerCase()] || '';
            }
            return  '<input autocomplete="new-password" data-index="' + filterNo + '" placeholder="' + placeholder + '" class="filter">' +
                    '<button data-index="' + filterNo + '" class="filter-btn"></button>\n';
        }

        function textCombobox(filterNo, placeholder) {
            var txt = '';
            if (data.columns.indexOf(filterNo) !== -1) {
                if (placeholder === undefined) placeholder = data.texts[filterNo.toLowerCase()] || '';
                var cbEntries = getComboBoxEnums(filterNo);
                var cbText = '<select data-index="' + filterNo + '" class="filter">';

                var add = function (a, b) {
                    if (Array.isArray(a)) {
                        b = a[0];
                        a = a[1]
                    } else if (b === undefined) {
                        b = a;
                    }
                    cbText += '<option value="' + a + '">' + b + '</option>';
                };
                if (typeof addAll2FilterCombobox !== 'undefined' && addAll2FilterCombobox) {
                    add('', placeholder + ' (' + data.texts.all + ')');
                } else {
                    add('', placeholder);
                }
                for (var i = 0, len = cbEntries.length; i < len; i++) {
                    add (cbEntries[i]);
                }
                cbText += '</select>';

                txt = cbText + '<button data-index="' + filterNo + '" class="filter-btn"></button>\n';
            } else {
                if (filterNo === 'room') {
                    if (data.rooms) delete data.rooms;
                    if (data.roomsColored) delete data.roomsColored;
                } else if (filterNo === 'function') {
                    if (data.funcs) delete data.funcs;
                    if (data.funcsColored) delete data.funcsColored;
                }
            }
            return txt;
        }

        function detectStates(node, patterns) {
            if (node && node.children) {
                var hasStates = false;
                var someExpanded = false;
                for (var c = 0; c < node.children.length; c++) {
                    if (!node.children[c].expanded) {
                        if (data.objects[node.children[c].data.id] && data.objects[node.children[c].data.id].type === 'state') {
                            hasStates = true;
                            break;
                        }
                    } else {
                        someExpanded = true;
                    }
                }
                if (hasStates) {
                    patterns.push(node.data.id || node.key);
                } else if (someExpanded) {
                    for (var cc = 0; cc < node.children.length; cc++) {
                        if (node.children[cc].expanded) {
                            detectStates(node.children[cc], patterns);
                        }
                    }
                }
            }
        }

        text += '        <tbody>\n';
        text += '            <tr>\n'; //<td></td>';

        forEachColumn(data, function (name) {
            text += '<th>';
            // we may not search by value
            if (name === 'ID' || name === 'name' || name === 'enum') {
                text += textFilterText(name);
            } else if (name === 'type' || name === 'role' || name === 'room' || name === 'function') {
                text += textCombobox(name);
            } else if (name === 'button') {
                if (data.customButtonFilter) {
                    text += textCombobox(name);
                } else {
                    //if (name === 'buttons' || name === 'button') {
                        text += '<span style="padding-left: ' + lineIndent + '"></span>';
                    // } else {
                    //     text += '<table class="main-header-input-table"><tbody><tr><td style="padding-left: ' + lineIndent + '">' + _(name) + '</td></tr></tbody></table>';
                    // }
                }
            } else {
                text += '<span style="padding-left: ' + lineIndent + '">' + _(name) + '</span>';
            }
            text += '</th>';
        });

        text += '            </tr>\n';
        text += '        </tbody>\n';
        text += '    </table>\n';

        text += '<div class="' + (data.buttons ? 'grid-main-wh-div' : 'grid-main-wob-div') + '">\n';
        text += '   <table class="iob-list-font objects-list-table" cellspacing="0" cellpadding="0">\n';
        text += '        <colgroup>\n';

        var thead = '<thead class="grid-objects-head"><tr>\n';

        var widths = {
            ID: data.firstMinWidth ? data.firstMinWidth : '20%',
            name: '20%',
            type: '6%',
            role: '10%',
            room: '10%',
            'function': '10%',
            value: '10%',
            button: '9%',
            enum: '2%',
            'value.val': '10%',
            'value.ts': '15%',
            'value.lc': '15%',
            'value.from': '10%',
            'value.q': '10%',
            'value.ack': '2%',
        };

        forEachColumn(data, function (name, i) {
            var w = data.widths ? data.widths[i] : widths[name] || '2%';
            text  += '<col width="' + w + '"/>';
            thead += '<th style="width: ' + w + ';"></th>';
        });

        text += '        </colgroup>\n';
        text += thead + '</tr>\n</thead>\n';

        text += '        <tbody>\n';
        text += '        </tbody>\n';
        text += '    </table>\n</div>\n';
        if (isMaterial) {
            text += '<div class="objects-list-running loader"><svg class="spinner" width="100%" height="100%" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">\n' +
            '      <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>\n' +
            '</svg></div>\n'
        } else {
            text += '<div class="objects-list-running" style="display: none;">' + data.texts.wait + '</div>\n';
        }
        text += '</div>\n'
        ;

        function addClippyToElement($elem, key, objectId) {
            if (!data.noCopyToClipboard) {
                var name = $elem.data('name');
                if (name === 'function' || name === 'room') {
                    $elem.addClass('edit-enum edit-dialog');
                } else {
                    $elem.addClass('clippy' + (objectId ? ' edit-dialog' : ''));
                }

                if (key !== undefined) {
                    $elem.data('clippy', key);
                }

                if (objectId) {
                    $elem.data('id', objectId);
                }

                $elem.css({position: 'relative'})
                    .data('data', data)
                    .mouseenter(clippyShow)
                    .mouseleave(clippyHide);
            }
        }

        if (typeof M !== 'undefined' && (!data.noDialog || data.buttonsDlg)) {
            var $content = $dlg.find('.dialog-content');
            if (!$content.length) {
                $dlg.html('<div class="modal-content">\n' +
                    '                <div class="row">\n' +
                    '                    <div class="col s12 title"></div>\n' +
                    '                </div>\n' +
                    '                <div class="row">\n' +
                    '                    <div class="col s12 dialog-content">\n' +
                    '                    </div>\n' +
                    '                </div>\n' +
                    '            </div>\n' +
                    '            <div class="modal-footer">\n' +
                    '                <a class="modal-action modal-close waves-effect waves-green btn btn-set"  ><i class="large material-icons">check</i><span class="translate">Select</span></a>\n' +
                    '                <a class="modal-action modal-close waves-effect waves-green btn btn-close"><i class="large material-icons">close</i><span class="translate">Cancel</span></a>\n' +
                    '            </div>');
                $content = $dlg.find('.dialog-content');
                if (!$dlg.closest('.m').length) {
                    var $body = $('body');
                    $body.append('<div class="m material-dialogs"></div>');
                    $dlg.appendTo($body.find('.material-dialogs'));
                }
            }

            $content.html(text)
        } else {
            $dlg.html(text);
        }

        // Init dialog buttons
        if (!data.noDialog && !data.buttonsDlg) {
            if (typeof M !== 'undefined') {
                data.buttonsDlg = true;
                // following structure is expected
                // <div id="dialog-select-member" class="modal modal-fixed-footer">
                //     <div class="modal-content">
                //          <div class="row">
                //              <div class="col s12 title"></div>
                //          </div>
                //         <div class="row">
                //             <div class="col s12 dialog-content">
                //             </div>
                //         </div>
                //     </div>
                //     <div class="modal-footer">
                //         <a class="modal-action modal-close waves-effect waves-green btn btn-set"  ><i class="large material-icons">check</i><span class="translate">Ok</span></a>
                //         <a class="modal-action modal-close waves-effect waves-green btn btn-close"><i class="large material-icons">close</i><span class="translate">Cancel</span></a>
                //     </div>
                // </div>
                $dlg.find('.btn-set').off('click').on('click', function () {
                    var _data = $dlg.data('selectId');
                    if (_data && _data.onSuccess) _data.onSuccess(_data.selectedID, _data.currentId, _data.objects[_data.selectedID]);
                    _data.currentId = _data.selectedID;
                    storeSettings(_data);
                });
                $dlg.find('.btn-close').off('click').on('click', function () {
                    var _data = $dlg.data('selectId');
                    storeSettings(_data);
                });
                $dlg.modal({
                    dismissible: false
                });
            } else {
                data.buttonsDlg = [
                    {
                        id:     'button-ok',
                        text:   data.texts.select,
                        click:  function () {
                            var _data = $dlg.data('selectId');
                            if (_data && _data.onSuccess) _data.onSuccess(_data.selectedID, _data.currentId, _data.objects[_data.selectedID]);
                            _data.currentId = _data.selectedID;
                            storeSettings(_data);
                            $dlg.dialog('close');
                        }
                    },
                    {
                        text:   data.texts.cancel,
                        click:  function () {
                            var _data = $dlg.data('selectId');
                            storeSettings(_data);
                            $(this).dialog('close');
                        }
                    }
                ];

                $dlg.dialog ({
                    autoOpen: false,
                    modal: true,
                    resizable: false,
                    width: '90%',
                    left: '1rem',
                    open: function (event) {
                        $(event.target).parent().find('.ui-dialog-titlebar-close .ui-button-text').html('');
                    },
                    close: function () {
                        storeSettings (data);
                    },
                    buttons: data.buttonsDlg
                });
                if (data.zindex !== null) {
                    $('div[aria-describedby="' + $dlg.attr('id') + '"]').css({'z-index': data.zindex})
                }
            }
        }

        data.$tree = $dlg.find('.objects-list-table');
        if (!data.$tree.length) {

        }
        data.$tree[0]._onChange = data.onSuccess || data.onChange;

        var foptions = {
            titlesTabbable: true,     // Add all node titles to TAB chain
            quicksearch:    true,
            ///////////////////////////

            //autoScroll: true,

            ///////////////////////////////////////////

            source:         data.tree.children,
            extensions:     ['table', 'gridnav', 'filter', 'themeroller'],
            strings: {
                noData: data.texts.noData
            },
            themeroller: {
                addClass: '',  // no rounded corners
                selectedClass: 'iob-state-active'
            },

            checkbox:       multiselect,
            table: {
                //indentation: 20,
                indentation: 9,
                nodeColumnIdx: 0
            },
            gridnav: {
                autofocusInput:   false,
                handleCursorKeys: true
            },
            filter: {
                mode:      'hide',
                autoApply: true,
                counter:   false
            },

            // keydown: function (event, data){
            //     var KC = $.ui.keyCode;
            //
            //     if( $(event.originalEvent.target).is(':input') ){
            //
            //         // When inside an input, let the control handle the keys
            //         data.result = 'preventNav';
            //
            //         // But do the tree navigation on Ctrl + NAV_KEY
            //         switch( event.which ){
            //             case KC.LEFT:
            //             case KC.RIGHT:
            //             case KC.BACKSPACE:
            //             case KC.SPACE:
            //                 if( e.shiftKey ){
            //                     data.node.navigate(event.which);
            //                 }
            //         }
            //     }
            // },


            activate: function (event, data) {
                // A node was activated: display its title:
                // On change
                if (!multiselect) {
                    var _data = $dlg.data('selectId');
                    var newId = data.node.key;

                    if (_data.onChange) _data.onChange(newId, _data.selectedID, _data.objects[newId]);

                    _data.selectedID = newId;
                    if (!_data.noDialog) {
                        // Set title of dialog box
                        var title = _data.texts.selectid + ' - ' + getNameObj(_data.objects[newId], newId);
                        if (typeof M !== 'undefined') {
                            $dlg.find('.title').text(title);
                        } else {
                            $dlg.dialog('option', 'title', title);
                        }

                        // Enable/ disable 'Select' button
                        if (newId && (_data.objects[newId] || _data.allowSelectionOfNonExistingObjects)) { // && _data.objects[newId].type === 'state') {
                            $dlg.find('#button-ok').removeClass('ui-state-disabled');
                            $dlg.find('.btn-set').removeClass('disabled');
                        } else {
                            $dlg.find('#button-ok').addClass('ui-state-disabled');
                            $dlg.find('.btn-set').addClass('disabled');
                        }

                    }
                }
            },
            select: function (event, data) {
                var _data = $dlg.data('selectId');
                var newIds = [];
                var selectedNodes = data.tree.getSelectedNodes();
                for	(var i = 0; i < selectedNodes.length; i++) {
                    newIds.push(selectedNodes[i].key);
                }

                if (_data.onChange) {
                    _data.onChange(newIds, _data.selectedID);
                }

                _data.selectedID = newIds;

                // Enable/ disable 'Select' button
                if (newIds.length > 0) {
                    $dlg.find('#button-ok').removeClass('ui-state-disabled');
                    $dlg.find('.btn-set').removeClass('disabled');
                } else {
                    $dlg.find('#button-ok').addClass('ui-state-disabled');
                    $dlg.find('.btn-set').addClass('disabled');
                }
            },
            renderColumns: function (event, _data) {
                var node = _data.node;
                var key = node.key;
                var obj = data.objects[key];

                var $tr     = $(node.tr);
                var $tdList = $tr.find('>td');

                var isCommon = obj && obj.common;
                var $firstTD = $tdList.eq(0);
                $firstTD.css({'overflow': 'hidden'});
                var cnt = countChildren(key, data);

                if (isCommon && obj.type) {
                    $tr.addClass('fancytree-type-' + obj.type + (data.draggable && data.draggable.indexOf(obj.type) !== -1 ? ' fancytree-type-draggable' : ' fancytree-type-not-draggable'));
                    if (data.draggable && data.draggable.indexOf(obj.type) === -1) {
                        $tr.attr('data-nodrag', 'true');
                    }
                } else {
                    $tr.attr('data-nodrag', 'true');
                }
                $tr.attr('data-id', key);

                // Show number of all children as small grey number
                var $cnt = $firstTD.find('.select-id-cnt');
                // If node has some children
                if (cnt) {
                    if ($cnt.length) {
                        // modify it if span yet exists
                        $cnt.text('#' + cnt);
                    } else {
                        // create new span
                        $firstTD.append('<span class="select-id-cnt">#' + cnt + '</span>');
                    }
                } else {
                    // remove this span, because object may be was updated
                    $cnt.remove();
                }

                var base = 0;

                // hide checkbox if only states should be selected
                if (data.filter && data.filter.type === 'state' && (!obj || obj.type !== 'state')) {
                    $firstTD.find('.fancytree-checkbox').hide();
                }

                // special case for javascript scripts
                if (obj && (key.match(/^script\.js\./) || key.match(/^enum\.[\w\d_-]+$/))) {
                    if (obj.type !== 'script') {
                        // force folder icon and change color
                        if (node.key !== 'script.js.global') {
                            $firstTD.find('.fancytree-title').css({'font-weight': 'bold', color: '#000080'});
                        } else {
                            $firstTD.find('.fancytree-title').css({'font-weight': 'bold', color: '#078a0c'});
                        }
                        $firstTD.addClass('fancytree-force-folder');
                    }
                }

                if (!data.noCopyToClipboard) {
                    addClippyToElement($firstTD, node.key);
                }

                if (data.useNameAsId) {
                    $firstTD.find('.fancytree-title').html(getNameObj(obj, key));
                }

                var $elem;
                var val;
                for (var c = 0; c < data.columns.length; c++) {
                    var name = data.columns[c];
                    $elem = $tdList.eq(base);

                    var setText = function (txt) {
                        $elem.html(span(txt));
                    };

                    if (typeof name === 'object') {
                        if (name.hasOwnProperty('name')) {
                            name = name.name;
                        } else {
                            name = name[systemLang] || name.en;
                        }
                    }

                    switch (name) {
                        case 'id':
                        case 'ID':
                            break;

                        case 'name':
                            var icon = getSelectIdIcon(data, obj, key);
                            var t = isCommon ? getName(obj.common.name || '') : '';

                            $elem.html('<span style="padding-left: ' + (icon ? lineIndent : 0) + '; height: 100%; width: 100%">' +
                                (icon ? '<span class="objects-name-coll-icon" style="vertical-align: middle">' + icon + '</span>' : '') +
                                '<div class="objects-name-coll-title iob-ellipsis" style="border:0;">' + t + '</div>' +
                                '</span>');


                            var $e = $elem.find('.objects-name-coll-title');
                            if (!t) $e.css({'vertical-align': 'middle'});

                            $e.attr('title', t);
                            // why here was the obj commented ??
                            if (data.quickEdit && obj && data.quickEdit.indexOf('name') !== -1) {
                                $e.data('old-value', t);
                                $e.on('click', onQuickEditField).data('id', node.key).data('name', 'name').data('selectId', data).addClass('select-id-quick-edit');
                            }
                            break;

                        case 'type':
                            setText(obj ? obj.type || '' : '');
                            break;

                        case 'role':
                            val = isCommon ? obj.common.role || '' : '';
                            setText(val);

                            if (data.quickEdit && obj && data.quickEdit.indexOf('role') !== -1) {
                                $elem.data('old-value', val);
                                $elem.on('click', onQuickEditField).data('id', node.key).data('name', 'role').data('selectId', data).addClass('select-id-quick-edit');
                            }
                            break;

                        case 'room':
                            // Try to find room
                            if (data.roomsColored) {
                                var room = data.roomsColored[node.key];
                                if (!room) room = data.roomsColored[node.key] = findRoomsForObject(data, node.key, true);
                                val = room.map(function (e) {
                                    return getName(e.name);
                                }).join(', ');

                                if (room.length && room[0].origin !== node.key) {
                                    $elem.css({color: 'gray'}).attr('title', room[0].origin);
                                } else {
                                    $elem.css({color: 'inherit'}).attr('title', null);
                                }
                            } else {
                                val = '';
                            }
                            setText(val);

                            if (data.quickEdit && obj && data.quickEdit.indexOf('room') !== -1) {
                                $elem
                                    .data('old-value', val)
                                    .data('id', node.key)
                                    .data('name', 'room')
                                    .data('selectId', data);
                                addClippyToElement($elem, val, obj && data.quickEditCallback ? key : undefined);
                            }
                            break;

                        case 'function':
                            // Try to find function
                            if (data.funcsColored) {
                                if (!data.funcsColored[node.key]) data.funcsColored[node.key] = findFunctionsForObject(data, node.key, true);
                                val = data.funcsColored[node.key].map(function (e) {
                                    return getName(e.name);
                                }).join (', ');
                                if (data.funcsColored[node.key].length && data.funcsColored[node.key][0].origin !== node.key) {
                                    $elem.css({color: 'gray'}).attr('title', data.funcsColored[node.key][0].origin);
                                } else {
                                    $elem.css({color: 'inherit'}).attr('title', null);
                                }
                            } else {
                                val = '';
                            }
                            setText(val);

                            if (data.quickEdit && obj && data.quickEdit.indexOf('function') !== -1) {
                                $elem
                                    .data('old-value', val)
                                    .data('id', node.key)
                                    .data('name', 'function')
                                    .data('selectId', data);
                                addClippyToElement($elem, val, obj && data.quickEditCallback ? key : undefined);
                            }
                            break;

                        case 'value.ts':
                            if (data.states && obj && obj.type === 'state') {
                                var state = data.states[node.key];
                                state = state || {ts: data.states[node.key  + '.ts']};
                                var val = state.ts;

                                if (val === undefined) {
                                    val = '&nbsp;';
                                } else {
                                    val = val ? formatDate(new Date(val)) : '';
                                }

                                $elem.html('<span class="highlight select-value">' + val + '</span>');
                            } else {
                                $elem.text('');
                            }
                            break;

                        case 'value.lc':
                            if (data.states && obj && obj.type === 'state') {
                                var state = data.states[node.key] || {};
                                state = state || {lc: data.states[node.key  + '.lc']};
                                var val = state.lc;

                                if (val === undefined) {
                                    val = '&nbsp;';
                                } else {
                                    val = val ? formatDate(new Date(val)) : '';
                                }

                                $elem.html('<span class="highlight select-value">' + val + '</span>');
                            } else {
                                $elem.text('');
                            }
                            break;

                        case 'value.from':
                            if (data.states && obj && obj.type === 'state') {
                                var state = data.states[node.key] || {};
                                state = state || {from: data.states[node.key  + '.from'], user: data.states[node.key  + '.user']};
                                var val = state.from;


                                if (val === undefined) {
                                    val = '&nbsp;';
                                } else {
                                    val = val ? val.replace(/^system\.adapter\.|^system\./, '') : '';
                                }
                                if (state.user) {
                                    val += '/' + state.user.replace('system.user.', '');
                                }
                                $elem.html('<span class="highlight select-value">' + val + '</span>');
                            } else {
                                $elem.text('');
                            }
                            break;

                        case 'value.q':
                            if (data.states && obj && obj.type === 'state') {
                                var state = data.states[node.key] || {};
                                state = state || {q: data.states[node.key  + '.q']};
                                var q = state.q;
                                var val = q;

                                if (val === undefined) {
                                    val = '&nbsp;';
                                } else {
                                    val = quality2text(val);
                                }
                                $elem.html('<span class="highlight select-value" style="' + (q ? 'orange' : '') + '">' + val + '</span>');
                            } else {
                                $elem.text('');
                            }
                            break;

                        case 'value.val':
                            if (data.states && obj && obj.type === 'state') {
                                var state = data.states[node.key] || {};
                                if (!state) {
                                    state = {
                                        val:  data.states[node.key  + '.val'],
                                        ack:  (data.states[node.key + '.ack'] === undefined) ? '' : data.states[node.key + '.ack']
                                    };
                                }
                                var val = state.val;
                                var ack = state.ack;

                                var states = getStates(data, node.key);

                                if (isCommon && isCommon.role && isCommon.role.match(/^value\.time|^date/)) {
                                    val = val ? (new Date(val)).toString() : val;
                                }
                                if (states && states[val] !== undefined) {
                                    val = states[val] + '(' + val + ')';
                                }

                                if (val === undefined) {
                                    val = '&nbsp;';
                                } else
                                if (val === null || val === '') {
                                    val = '&nbsp;';
                                }
                                if (typeof val === 'string' && val !== '$nbsp;') {
                                    val = val.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                                }

                                $elem.html('<span class="highlight select-value" style="' + (ack ? '' : '#c00000') + '">' + val + '</span>');

                                if (obj && obj.type === 'state' && isCommon && isCommon.type !== 'file') {
                                    addClippyToElement($elem, state.val === undefined || state.val === null ? '' : state.val.toString(),
                                        obj && data.quickEditCallback &&
                                        obj.type === 'state' &&
                                        (data.expertMode || isCommon.write !== false) ? key : undefined);
                                }
                            } else {
                                $elem.text('')
                                    .removeClass('clippy');
                            }
                            $elem.dblclick (function (e) {
                                e.preventDefault ();
                            });

                            if (data.quickEdit &&
                                isCommon &&
                                obj.type === 'state' &&
                                data.quickEdit.indexOf('value') !== -1 &&
                                (data.expertMode || isCommon.write !== false)
                            ) {
                                if (isCommon.role && isCommon.role.match(/^button/) && !data.expertMode) {
                                    $elem.html('<button data-id="' + node.key + '" class="select-button-push"></button>');
                                } else if (!isCommon || isCommon.type !== 'file') {
                                    var val_    = data.states[node.key];
                                    val_        = val_ ? val_.val : '';
                                    var $span_  = $elem.find('span');
                                    $span_.data('old-value', val_).data('type', isCommon.type || typeof val_);

                                    $span_.on('click', onQuickEditField)
                                        .data('id', node.key)
                                        .data('name', 'value')
                                        .data('selectId', data)
                                        .addClass('select-id-quick-edit');
                                }

                                var $btnPush = $tr.find('.select-button-push[data-id="' + node.key + '"]');
                                $btnPush.on('click', function () {
                                    var id = $(this).data('id');
                                    data.quickEditCallback(id, 'value', true);
                                }).attr('title', data.texts.push);

                                if (!isMaterial) {
                                    $btnPush.button({
                                        text: false,
                                        icons: {
                                            primary: 'ui-icon-arrowthickstop-1-s'
                                        }
                                    });
                                } else {
                                    $btnPush.prepend('<i class="material-icons">room_service</i>')
                                }
                            }

                            if (isCommon && isCommon.type === 'file') {
                                data.webServer = data.webServer || (window.location.protocol + '//' + window.location.hostname + ':' + (window.location.port || 80));

                                // link
                                $elem.html('<a href="' + data.webServer + '/state/' + encodeURIComponent(node.key) + '" target="_blank">' + data.webServer + '/state/' + node.key + '</a>')
                                    .attr('title', data.texts.linkToFile);
                            }
                            break;

                        case 'value':
                            var state;
                            if (data.states && obj && obj.type === 'state') {
                                state = data.states[node.key];

                                var states = getStates(data, node.key);
                                if (!state) {
                                    state = {
                                        val:  data.states[node.key  + '.val'],
                                        ts:   data.states[node.key  + '.ts'],
                                        lc:   data.states[node.key  + '.lc'],
                                        from: data.states[node.key  + '.from'],
                                        user: data.states[node.key  + '.user'],
                                        ack:  (data.states[node.key + '.ack'] === undefined) ? '' : data.states[node.key + '.ack'],
                                        q:    (data.states[node.key + '.q']   === undefined) ? 0  : data.states[node.key + '.q']
                                    };
                                } else {
                                    state = Object.assign({}, state);
                                }

                                if (isCommon && isCommon.role && isCommon.role.match(/^value\.time|^date/)) {
                                    state.val = state.val ? (new Date(state.val)).toString() : state.val;
                                }

                                var originalVal = state.val;

                                if (states && states[state.val] !== undefined) {
                                    state.val = states[state.val] + '(' + state.val + ')';
                                }

                                var fullVal;
                                if (state.val === undefined) {
                                    state.val = '&nbsp;';
                                } else {
                                    // if less 2000.01.01 00:00:00
                                    if (state.ts < 946681200000) state.ts *= 1000;
                                    if (state.lc < 946681200000) state.lc *= 1000;

                                    if (isCommon && isCommon.unit) state.val += ' ' + isCommon.unit;
                                    fullVal = data.texts.value + ': ' + state.val;
                                    fullVal += '\x0A' + data.texts.ack     + ': ' + state.ack;
                                    fullVal += '\x0A' + data.texts.ts      + ': ' + (state.ts ? formatDate(new Date(state.ts)) : '');
                                    fullVal += '\x0A' + data.texts.lc      + ': ' + (state.lc ? formatDate(new Date(state.lc)) : '');
                                    fullVal += '\x0A' + data.texts.from    + ': ' + (state.from || '');
                                    if (state.user) fullVal += '\x0A' + data.texts.user    + ': ' + (state.user || '');
                                    fullVal += '\x0A' + data.texts.quality + ': ' + quality2text(state.q || 0);
                                }
                                if (state.val === null || state.val === '') {
                                    state.val = '&nbsp;';
                                }
                                if (typeof state.val === 'string' && state.val !== '&nbsp;') {
                                    state.val = state.val.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                                }

                                $elem.html('<span class="highlight select-value">' + state.val + '</span>')
                                    .attr('title', fullVal);

                                var $span = $elem.find('span');
                                $span.css({color: state.ack ? (state.q ? 'orange' : '') : '#c00000'});

                                if (obj && obj.type === 'state' && isCommon && isCommon.type !== 'file') {
                                    addClippyToElement($elem, originalVal === undefined || originalVal === null ? '' : originalVal.toString(),
                                        obj && data.quickEditCallback &&
                                        obj.type === 'state' &&
                                        (data.expertMode || isCommon.write !== false) ? key : undefined);
                                }
                            } else {
                                $elem
                                    .text('')
                                    .attr('title', '')
                                    .removeClass('clippy');
                            }
                            $elem.dblclick (function (e) {
                                e.preventDefault ();
                            });

                            if (data.quickEdit &&
                                isCommon &&
                                obj.type === 'state' &&
                                data.quickEdit.indexOf('value') !== -1 &&
                                (data.expertMode || isCommon.write !== false)
                            ) {
                                if (isCommon.role && isCommon.role.match(/^button/) && !data.expertMode) {
                                    $elem.html('<button data-id="' + node.key + '" class="select-button-push"></button>');
                                } else if (!isCommon || isCommon.type !== 'file') {
                                    var val_    = data.states[node.key];
                                    val_        = val_ ? val_.val : '';
                                    var $span_  = $elem.find('span');
                                    $span_.data('old-value', val_).data('type', isCommon.type || typeof val_);

                                    $span_.on('click', onQuickEditField)
                                        .data('id', node.key)
                                        .data('name', 'value')
                                        .data('selectId', data)
                                        .addClass('select-id-quick-edit');
                                }

                                var $btnPush = $tr.find('.select-button-push[data-id="' + node.key + '"]');
                                $btnPush.on('click', function () {
                                    var id = $(this).data('id');
                                    data.quickEditCallback(id, 'value', true);
                                }).attr('title', data.texts.push);

                                if (!isMaterial) {
                                    $btnPush.button({
                                        text: false,
                                        icons: {
                                            primary: 'ui-icon-arrowthickstop-1-s'
                                        }
                                    });
                                } else {
                                    $btnPush.prepend('<i class="material-icons">room_service</i>')
                                }
                            }

                            if (isCommon && isCommon.type === 'file') {
                                data.webServer = data.webServer || (window.location.protocol + '//' + window.location.hostname + ':' + (window.location.port || 80));

                                // link
                                $elem.html('<a href="' + data.webServer + '/state/' + encodeURIComponent(node.key) + '" target="_blank">' + data.webServer + '/state/' + node.key + '</a>')
                                    .attr('title', data.texts.linkToFile);
                            }
                            break;

                        case 'button':
                            // Show buttons
                            var text;
                            if (data.buttons) {
                                if (obj || data.showButtonsForNotExistingObjects) {
                                    text = '';
                                    if (data.editEnd) {
                                        text += '' +
                                            '<button data-id="' + node.key + '" class="m select-button-edit"></button>' +
                                            '<button data-id="' + node.key + '" class="m select-button-ok"></button>' +
                                            '<button data-id="' + node.key + '" class="m select-button-cancel"></button>';
                                    }

                                    for (var j = 0; j < data.buttons.length; j++) {
                                        text += '<button data-id="' + node.key + '" class="m select-button-' + j + ' select-button-custom td-button"></button>';
                                    }

                                    setText(text);

                                    for (var p = 0; p < data.buttons.length; p++) {
                                        var $btn = $tr.find('.select-button-' + p + '[data-id="' + node.key + '"]');

                                        if ($btn.length === 0) continue;

                                        $btn
                                            .on('click', function () {
                                                var cb = $(this).data('callback');
                                                if (cb) cb.call($(this), $(this).data('id'));
                                            })
                                            .data('callback', data.buttons[p].click)
                                            .attr('title', data.buttons[p].title || '');

                                        if (data.buttons[p].match)  data.buttons[p].match.call($btn, node.key);
                                        if (!isMaterial) {
                                            // if (data.buttons[p].width)  $btn.css({width: data.buttons[p].width});
                                            // if (data.buttons[p].height) $btn.css({height: data.buttons[p].height});
                                            $btn.button(data.buttons[p]);
                                        } else {
                                            $btn.addClass('custom-obj-btn').prepend('<i class="material-icons">' + data.buttons[p]['material-icon'] + '</i>');
                                        }
                                    }
                                } else {
                                    $elem.text('');
                                }
                            } else if (data.editEnd) {
                                text = '<button data-id="' + node.key + '" class="m select-button-edit"></button>' +
                                       '<button data-id="' + node.key + '" class="m select-button-ok"></button>' +
                                       '<button data-id="' + node.key + '" class="m select-button-cancel"></button>';
                            }

                            if (data.editEnd) {
                                var $btnEdit = $tr.find('.select-button-edit[data-id="' + node.key + '"]');
                                $btnEdit
                                    .on('click', function () {
                                        $(this).data('node').editStart();
                                    })
                                    .attr('title', data.texts.edit)
                                    .data('node', node);

                                if (!isMaterial) {
                                    $btnEdit.button({
                                        text: false,
                                        icons: {
                                            primary: 'ui-icon-pencil'
                                        }
                                    });
                                } else {
                                    $btnEdit.prepend('<i class="material-icons">edit</i>');
                                }

                                $btnEdit = $tr.find('.select-button-ok[data-id="' + node.key + '"]');
                                $btnEdit.on('click', function () {
                                    var node = $(this).data('node');
                                    node.editFinished = true;
                                    node.editEnd (true);
                                }).attr('title', data.texts.ok).data('node', node).hide();

                                if (!isMaterial) {
                                    $btnEdit.button({
                                        text: false,
                                        icons: {
                                            primary: 'ui-icon-check'
                                        }
                                    });
                                } else {
                                    $btnEdit.prepend('<i class="material-icons">done</i>');
                                }

                                $btnEdit = $tr.find('.select-button-cancel[data-id="' + node.key + '"]');
                                $btnEdit.on('click', function () {
                                    var node = $(this).data('node');
                                    node.editFinished = true;
                                    node.editEnd (false);
                                }).attr('title', data.texts.cancel).data('node', node).hide();

                                if (!isMaterial) {
                                    $btnEdit.button({
                                        text: false,
                                        icons: {
                                            primary: 'ui-icon-close'
                                        }
                                    });
                                } else {
                                    $btnEdit.prepend('<i class="material-icons">close</i>');
                                }
                            }
                            break;

                        case 'enum':
                            if (isCommon && obj.common.members && obj.common.members.length > 0) {
                                var te;
                                if (obj.common.members.length < 4) {
                                    te =  '#' + obj.common.members.length + ' ' + obj.common.members.join (', ');
                                } else {
                                    te = '#' + obj.common.members.length;
                                }
                                $elem.html('<div class="iob-ellipsis">' + te + '</div>');
                                $elem.attr('title', obj.common.members.join ('\x0A'));
                            } else {
                                $elem.text('');
                                $elem.attr('title', '');
                            }
                            break;

                        default:
                            if (typeof data.columns[c].data === 'function') {
                                //$elem = $tdList.eq(base);
                                var val = data.columns[c].data(node.key, data.columns[c].name);
                                var title = '';
                                if (data.columns[c].title) {
                                    title = data.columns[c].title(node.key, data.columns[c].name);
                                }
                                $elem.html(val).attr('title', title);
                                if (data.quickEdit && obj) {
                                    for (var q = 0; q < data.quickEdit.length; q++) {
                                        if (data.quickEdit[q] === data.columns[c].name ||
                                            data.quickEdit[q].name === data.columns[c].name) {
                                            $elem.data('old-value', val).data('type', typeof val);

                                            $elem.on('click', onQuickEditField)
                                                .data('id', node.key)
                                                .data('name', data.columns[c].name)
                                                .data('selectId', data)
                                                .data('options', data.quickEdit[q].options)
                                                .addClass('select-id-quick-edit');

                                            break;
                                        }
                                    }
                                }
                            }
                            break;
                    }
                    ///
                    base++;
                    ///
                }
            },
            dblclick: function (event, _data) {
                if (data.buttonsDlg && !data.quickEditCallback) {
                    if (_data && _data.node && !_data.node.folder) {
                        if (typeof M !== 'undefined') {
                            $dlg.find('.btn-set').trigger('click');
                            $dlg.modal('close');
                        } else {
                            $('#button-ok').trigger('click');
                        }
                    }
                } else if (data.dblclick) {
                    var tree = data.$tree.fancytree('getTree');

                    var node = tree.getActiveNode();
                    if (node) {
                        data.dblclick(node.key);
                    }
                }
            },
            beforeExpand: function (event, _data) {
                if (data.expandedCallback) {
                    if (_data && _data.node) {
                        // if will be expanded
                        if (!_data.node.expanded) {
                            var childrenCount = 0;
                            var hasStates = false;
                            var patterns  = [];
                            if (_data.node.children) {
                                childrenCount = _data.node.children.length;
                                detectStates(_data.node, patterns);
                                if (patterns.length) hasStates = true;
                            }

                            if (!patterns.length) {
                                patterns.push(_data.node.key);
                            }

                            data.expandedCallback(patterns, childrenCount, hasStates);

                        } else {
                            data.collapsedCallback(_data.node.key);
                        }
                    }
                }
            },
            collapse: function (event, _data) {
                /*if (data.collapsedCallback) {
                    if (_data && _data.node) {
                        data.collapsedCallback(_data.node.key);
                    }
                }*/
            }
        };

        if (data.editEnd) {
            foptions.extensions.push('edit');
            foptions.edit = {
                triggerStart: ['f2', 'dblclick', 'shift+click', 'mac+enter'],
                triggerStop:  ['esc'],
                beforeEdit: function (event, _data) {
                    // Return false to prevent edit mode
                    if (!data.objects[_data.node.key]) return false;
                },
                edit: function (event, _data) {
                    $dlg.find('.select-button-edit[data-id="'   + _data.node.key + '"]').hide();
                    $dlg.find('.select-button-cancel[data-id="' + _data.node.key + '"]').show();
                    $dlg.find('.select-button-ok[data-id="'     + _data.node.key + '"]').show();
                    $dlg.find('.select-button-custom[data-id="' + _data.node.key + '"]').hide();

                    var node = _data.node;
                    var $tdList = $(node.tr).find('>td');
                    // Editor was opened (available as data.input)
                    var inputs = {id: _data.input};

                    forEachColumn(data, function (name, c) {
                        if (name === 'name') {
                            inputs[name] = $('<input autocomplete="new-password" type="text" data-name="' + name + '" class="select-edit" value="' + data.objects[_data.node.key].common[name] + '" style="width: 100%"/>');
                            $tdList.eq(c).html(inputs[name]);
                        }
                    });

                    for (var i in inputs) {
                        inputs[i].keyup(function (e) {
                            var node;
                            if (e.which === 13) {
                                // end edit
                                node = $(this).data('node');
                                node.editFinished = true;
                                node.editEnd(true);
                            } else if (e.which === 27) {
                                // end edit
                                node = $(this).data('node');
                                node.editFinished = true;
                                node.editEnd(false);
                            }
                        }).data('node', node);
                    }

                    if (data.editStart) data.editStart(_data.node.key, inputs);
                    node.editFinished = false;
                },
                beforeClose: function (event, _data) {
                    // Return false to prevent cancel/save (data.input is available)
                    return _data.node.editFinished;
                },
                save: function (event, _data) {
                    var editValues = {id: _data.input.val()};

                    forEachColumn (data, function (name) {
                        if (name === 'name') {
                            editValues[name] = $dlg.find('.select-edit[data-name="' + name + '"]').val();
                        }
                    });

                    // Save data.input.val() or return false to keep editor open
                    if (data.editEnd) data.editEnd(_data.node.key, editValues);
                    _data.node.render(true);

                    // We return true, so ext-edit will set the current user input
                    // as title
                    return true;
                },
                close: function (event, _data) {
                    $dlg.find('.select-button-edit[data-id="' + _data.node.key + '"]').show();
                    $dlg.find('.select-button-cancel[data-id="' + _data.node.key + '"]').hide();
                    $dlg.find('.select-button-ok[data-id="' + _data.node.key + '"]').hide();
                    $dlg.find('.select-button-custom[data-id="' + _data.node.key + '"]').show();
                    if (_data.node.editFinished !== undefined) delete _data.node.editFinished;
                    // Editor was removed
                    if (data.save) {
                        // Since we started an async request, mark the node as preliminary
                        $(data.node.span).addClass('pending');
                    }
                }
            };
        }

        data.$tree.fancytree(foptions).on('nodeCommand', function (event, bData) {
            // Custom event handler that is triggered by keydown-handler and
            // context menu:
            var refNode;
            var tree = $(this).fancytree('getTree');
            var node = tree.getActiveNode();

            switch (bData.cmd) {
                case 'moveUp':
                    node.moveTo(node.getPrevSibling(), 'before');
                    node.setActive();
                    break;
                case 'moveDown':
                    node.moveTo(node.getNextSibling(), 'after');
                    node.setActive();
                    break;
                case 'indent':
                    refNode = node.getPrevSibling();
                    node.moveTo(refNode, 'child');
                    refNode.setExpanded();
                    node.setActive();
                    break;
                case 'outdent':
                    node.moveTo(node.getParent(), 'after');
                    node.setActive();
                    break;
                case 'delete':
                    var button = $(node.tr).find('.select-button-1');
                    if (button && button.length) {
                        button.trigger('click');
                    }
                    break;
                case 'rename':
                    var e = $(node.tr).find('.objects-name-coll-title');
                    if (e && e.length) {
                        e.trigger('click');
                    }
                    break;

                /*case 'copy':
                    CLIPBOARD = {
                        mode: data.cmd,
                        data: node.toDict(function (n) {
                            delete n.key;
                        })
                    };
                    break;
                case 'clear':
                    CLIPBOARD = null;
                    break;*/
                default:
                    alert('Unhandled command: ' + bData.cmd);
                    return;
            }

        }).on('keydown', function (e) {
            if (data.editing) {
                return;
            }
            var cmd = null;
            if (e.ctrlKey) {
                switch (e.which) {
                    case 'c':
                        cmd = 'copy';
                        break;
                    case $.ui.keyCode.UP:
                        cmd = 'moveUp';
                        break;
                    case $.ui.keyCode.DOWN:
                        cmd = 'moveDown';
                        break;
                    case $.ui.keyCode.RIGHT:
                        cmd = 'indent';
                        break;
                    case $.ui.keyCode.LEFT:
                        cmd = 'outdent';
                        break;
                }
            } else {
                switch (e.which) {
                    case $.ui.keyCode.DELETE:
                        cmd = 'delete';
                        break;
                    case 113: // F2
                        cmd = 'rename';
                        break;
                }
            }
            if (cmd) {
                $(this).trigger('nodeCommand', {cmd: cmd});
                return false;
            }
        });

        function customFilter(node) {
            if (node.parent && node.parent.match) return true;

            // Read all filter settings
            if (data.filterVals === null) {
                data.filterVals = {length: 0};
                var value_;

                forEachColumn (data, function (name) {
                    //if (name === 'image') return;
                    value_ = $dlg.find('.filter[data-index="' + name + '"]').val();
                    if (name !== 'role' && name !== 'type' && name !== 'room' && name !== 'function' && value_) {
                        value_ = value_.toLowerCase();
                    }
                    if (value_) {
                        data.filterVals[name] = value_;
                        data.filterVals.length++;
                    }
                });

                // if no clear "close" event => store on change
                if (data.noDialog) storeSettings(data);
            }

            var obj = data.objects[node.key];
            var isCommon = obj && obj.common;
            var value;

            for (var f in data.filterVals) {
                //if (f === 'length') continue;
                //if (isCommon === null) isCommon = obj && obj.common;
                if (!data.filterVals.hasOwnProperty(f)) continue;

                switch (f) {
                    case 'length':
                        continue;
                    case 'ID':
                        if (node.key.toLowerCase ().indexOf(data.filterVals[f]) === -1) return false;
                        break;
                    case 'name':
                    case 'enum':
                        if (!isCommon || obj.common[f] === undefined) return false;
                        value = obj.common[f];
                        if (typeof value === 'object') {
                            value = value[systemLang] || value.en || '';
                        }
                        if ((value || '').toLowerCase().indexOf(data.filterVals[f]) === -1) {
                            return false;
                        }
                        break;
                    case 'role':
                        if (data.roleExactly) {
                            if (!isCommon || obj.common[f] === undefined || obj.common[f] !== data.filterVals[f]) return false;
                        } else {
                            if (!isCommon || obj.common[f] === undefined || obj.common[f].indexOf(data.filterVals[f]) === -1) return false;
                        }
                        break;
                    case 'type':
                        if (!obj || obj[f] === undefined || obj[f] !== data.filterVals[f]) return false;
                        break;
                    /*case 'value':
                        if (!data.states[node.key] || data.states[node.key].val === undefined || data.states[node.key].val === null || data.states[node.key].val.toString ().toLowerCase ().indexOf(data.filterVals[f]) === -1) return false;
                        break;*/
                    case 'button':
                        if (data.filterVals[f] === 'true') {
                            if (!isCommon || !obj.common.custom || obj.common.custom.enabled === false) return false;
                        } else if (data.filterVals[f] === 'false') {
                            if (!isCommon || obj.type !== 'state' || obj.common.custom) return false;
                        } else if (data.filterVals[f]) {
                            if (!isCommon || !obj.common.custom || !obj.common.custom[data.filterVals[f]]) return false;
                        }
                        break;
                    case 'room':
                        if (!obj || !data.rooms) return false;

                        // Try to find room
                        if (!data.rooms[node.key]) data.rooms[node.key] = findRoomsForObject(data, node.key);
                        if (data.rooms[node.key].indexOf(data.filterVals[f]) === -1) return false;
                        break;
                    case 'function':
                        if (!obj || !data.funcs) return false;

                        // Try to find functions
                        if (!data.funcs[node.key]) data.funcs[node.key] = findFunctionsForObject(data, node.key);
                        if (data.funcs[node.key].indexOf(data.filterVals[f]) === -1) return false;
                        break;
                }
            }
            return true;
        }

        restoreExpandeds(data, expandeds);
        var resizeTimer;
        $(window).on('resize', function (/* x, y */) {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                syncHeader($dlg);
            }, 100);
        });
        $dlg.trigger('resize');

        var changeTimer;

        $dlg.find('.filter').change(function (event) {
            data.filterVals = null;
            if (changeTimer) clearTimeout(changeTimer);
            //changeTimer = setTimeout(function () {
            if (event && event.target) {
                filterChanged(event.target);
            }

            var $ee = $dlg.find('.objects-list-running');
            $ee.show();
            data.$tree.fancytree('getTree').filterNodes(customFilter, false);
            $ee.hide();
            //}, 0);
        }).keyup(function () {
            var tree = data.$tree[0];
            if (tree._timer) tree._timer = clearTimeout(tree._timer);

            var that = this;
            tree._timer = setTimeout(function () {
                $(that).trigger('change');
            }, 200);
        });

        var $btn = $dlg.find('.filter-btn');

        $btn.on('click', function () {
            $dlg.find('.filter[data-index="' + $(this).data('index') + '"]').val('').trigger('change');  //filter buttons action
        });
        if (!isMaterial) {
            $btn.button({icons: {primary: 'ui-icon-close'}, text: false});
        } else {
            $btn.prepend('<i class="material-icons">close</i>');
        }

        $btn = $dlg.find('.btn-collapse');
        $btn.on('click', function () {
            $dlg.find('.objects-list-running').show();
            setTimeout(function () {
                data.$tree.fancytree('getRootNode').visit(function (node) {
                    if (!data.filterVals.length || node.match || node.subMatchCount) {
                        node.setExpanded(false);
                    }
                });
                $dlg.find('.objects-list-running').hide();
            }, 100);
        }).attr('title', data.texts.collapse);

        if (!isMaterial) {
            $btn.button({icons: {primary: 'ui-icon-folder-collapsed'}, text: false});
        } else {
            $btn.prepend('<i class="material-icons">folder</i>');
        }

        $btn = $dlg.find('.btn-expand');
        $btn.on('click', function () {
            $dlg.find('.objects-list-running').show();
            setTimeout(function () {
                data.$tree.fancytree('getRootNode').visit(function (node) {
                    if (!data.filterVals.length || node.match || node.subMatchCount) {
                        node.setExpanded(true);
                    }
                });
                $dlg.find('.objects-list-running').hide();
            }, 100);
        }).attr('title', data.texts.expand);
        if (!isMaterial) {
            $btn.button({icons: {primary: 'ui-icon-folder-open'}, text: false});
        } else {
            $btn.prepend('<i class="material-icons">folder_open</i>');
        }

        $btn = $dlg.find('.btn-list');
        $btn.on('click', function () {
            $dlg.find('.objects-list-running').show();
            data.list = !data.list;
            if (data.list) {
                $dlg.find('.btn-list').addClass('ui-state-error red lighten-3');
                $dlg.find('.btn-collapse').hide();
                $(this).attr('title', data.texts.list);
            } else {
                $dlg.find('.btn-list').removeClass('ui-state-error red lighten-3');
                $dlg.find('.btn-expand').show();
                $dlg.find('.btn-collapse').show();
                $(this).attr('title', data.texts.tree);
            }
            $dlg.find('.objects-list-running').show();
            setTimeout(function () {
                data.inited = false;
                initTreeDialog(data.$dlg);
                $dlg.find('.objects-list-running').hide();
            }, 200);
        }).attr('title', data.texts.tree);

        if (!isMaterial) {
            $btn.button({icons: {primary: 'ui-icon-grip-dotted-horizontal'}, text: false});
        } else {
            $btn.prepend('<i class="material-icons">format_list_bulleted</i>');
        }

        if (data.list) {
            $dlg.find('.btn-list')
                .addClass('ui-state-error red lighten-3')
                .attr('title', data.texts.list);
            $dlg.find('.btn-expand').hide();
            $dlg.find('.btn-collapse').hide();
        }

        $btn = $dlg.find('.btn-refresh');
        $btn.on('click', function () {
            $dlg.find('.objects-list-running').show();
            setTimeout(function () {
                data.inited = false;
                // request all objects anew on refresh
                if (data.getObjects) {
                    data.getObjects(function (err, objs) {
                        data.objects = objs;
                        initTreeDialog(data.$dlg, false);
                        $dlg.find('.objects-list-running').hide();
                    });
                } else {
                    initTreeDialog(data.$dlg, false);
                    $dlg.find('.objects-list-running').hide();
                }
            }, 100);
        }).attr('title', data.texts.refresh);

        if (!isMaterial) {
            $btn.button({icons: {primary: 'ui-icon-refresh'}, text: false});
        } else {
            $btn.prepend('<i class="material-icons">refresh</i>');
        }

        $btn = $dlg.find('.btn-sort');
        $btn.on('click', function () {
            $dlg.find('.objects-list-running').show();

            data.sort = !data.sort;
            if (data.sort) {
                $dlg.find('.btn-sort').addClass('ui-state-error red lighten-3');
            } else {
                $dlg.find('.btn-sort').removeClass('ui-state-error red lighten-3');
            }
            storeSettings(data, true);

            setTimeout(function () {
                data.inited = false;
                sortTree(data);
                $dlg.find('.objects-list-running').hide();
            }, 100);
        }).attr('title', data.texts.sort);
        if (data.sort) $dlg.find('.btn-sort').addClass('ui-state-error red lighten-3');

        if (!isMaterial) {
            $btn.button({icons: {primary: 'ui-icon-bookmark'}, text: false});
        } else {
            $btn.prepend('<i class="material-icons">sort_by_alpha</i>');
        }

        $btn = $dlg.find('.btn-history');
        $btn.on('click', function () {
            $dlg.find('.objects-list-running').show();

            setTimeout(function () {
                data.customButtonFilter.callback();
                $dlg.find('.objects-list-running').hide();
            }, 1);
        }).attr('title', data.texts.history);

        if (!isMaterial) {
            $btn.button({icons: {primary: 'ui-icon-gear'}, text: false});
        } else {
            $btn.prepend('<i class="material-icons">build</i>');
        }

        $btn = $dlg.find('.btn-select-all');
        $btn.on('click', function () {
            $dlg.find('.objects-list-running').show();
            setTimeout(function () {
                data.$tree.fancytree('getRootNode').visit(function (node) {
                    if (!data.filterVals.length || node.match || node.subMatchCount) {
                        // hide checkbox if only states should be selected
                        if (data.objects[node.key] && data.objects[node.key].type === 'state') {
                            node.setSelected(true);
                        }
                    }
                });
                $dlg.find('.objects-list-running').hide();
            }, 100);
        }).attr('title', data.texts.selectAll);

        if (!isMaterial) {
            $btn.button({icons: {primary: 'ui-icon-circle-check'}, text: false});
        } else {
            $btn.prepend('<i class="material-icons">playlist_add_check</i>');
        }

        if (data.expertModeRegEx) {
            $btn = $dlg.find('.btn-expert');
            $btn.on('click', function () {
                $dlg.find('.objects-list-running').show();

                data.expertMode = !data.expertMode;
                if (data.expertMode) {
                    $dlg.find('.btn-expert').addClass('ui-state-error red lighten-3');
                } else {
                    $dlg.find('.btn-expert').removeClass('ui-state-error red lighten-3');
                }
                storeSettings(data, true);

                setTimeout(function () {
                    data.inited = false;
                    initTreeDialog(data.$dlg);
                    $dlg.find('.objects-list-running').hide();
                }, 200);
            }).attr('title', data.texts.expertMode);

            if (data.expertMode) $dlg.find('.btn-expert').addClass('ui-state-error red lighten-3');

            if (!isMaterial) {
                $btn.button({icons: {primary: 'ui-icon-person'}, text: false});
            } else {
                $btn.prepend('<img class="expert-mode-icon" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDM4NC43NTQgMzg0Ljc1NCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMzg0Ljc1NCAzODQuNzU0OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTIxNC44NiwzNzQuNTA4YzAsNC45NzEtNC4wMjksOS05LDloLTY1LjAxYy00Ljk3MSwwLTkuMjIzLTMuNTctOS4yMjMtOC41NDFWMjg4Ljg3YzAtNC45NzEsNC4yNTItOS4zNjEsOS4yMjMtOS4zNjENCgloOTkuNTg1YzQuOTcxLDAsOSw0LjAyOSw5LDlzLTQuMDI5LDktOSw5aC05MC44MDh2NjhoNTYuMjMyQzIxMC44MywzNjUuNTA4LDIxNC44NiwzNjkuNTM4LDIxNC44NiwzNzQuNTA4eiBNMTM2LjY1LDExNS41MDhoMTANCgljNC45NzEsMCw5LTQuMDI5LDktOXMtNC4wMjktOS05LTloLTEwYy00Ljk3MSwwLTksNC4wMjktOSw5UzEzMS42NzksMTE1LjUwOCwxMzYuNjUsMTE1LjUwOHogTTE4MC45NDcsMTE1LjUwOGgxMA0KCWM0Ljk3LDAsOS00LjAyOSw5LTlzLTQuMDI5LTktOS05aC0xMGMtNC45NzEsMC05LDQuMDI5LTksOVMxNzUuOTc2LDExNS41MDgsMTgwLjk0NywxMTUuNTA4eiBNMTUyLjA1NiwxNDIuNTA4YzAsNC45NzEsNC4wMjksOSw5LDkNCgloNWM0Ljk3MSwwLDktNC4wMjksOS05cy00LjAyOS05LTktOWgtNUMxNTYuMDg2LDEzMy41MDgsMTUyLjA1NiwxMzcuNTM4LDE1Mi4wNTYsMTQyLjUwOHogTTEyNy44NzUsMjIwLjk4Nw0KCWM2Ljk1MiwxMS4wNSwyMS4wNzIsMTguMzMsMzYuNjg5LDE4LjMzYzE1LjYxOSwwLDI5Ljc0LTcuMjgyLDM2LjY5MS0xOC4zMzJjMTIuMzI2LDAuOTYxLDI0LjUxLDYuMDA4LDMzLjI2NCwxMy45MDkNCgljMy42OSwzLjMyOSw5LjM4MSwzLjAzOCwxMi43MTItMC42NTFjMy4zMy0zLjY5LDMuMDM4LTkuNTM2LTAuNjUxLTEyLjg2NmMtMTIuOTg0LTExLjcxOC0zMS41MjYtMTguODY4LTQ5LjYtMTguODY4aC0xLjIzNw0KCWMtMy44NDUsMC03LjI2NSwyLjU5Ny04LjUxMyw2LjIzMmMtMi4xMTksNi4xNzMtMTAuNTg0LDEyLjQ5OS0yMi42NjYsMTIuNDk5Yy0xMi4wOCwwLTIwLjU0Ni02LjM2Ni0yMi42NjctMTIuNTM5DQoJYy0xLjI0OS0zLjYzNi00LjY2OC02LjE5My04LjUxMi02LjE5M2gtMS4yMzZjLTMwLjYwMSwwLTU5LjIwNywxOS4yMTYtNjUuMTIzLDQzLjU0OUw0MC42LDM1NC44NDENCgljLTAuMTE5LDAuNDQyLTAuMjA1LDAuOTM2LTAuMjU1LDEuNDAyYy0wLjEyNCwxLjExOS0wLjAzMywyLjI0NCwwLjI0MywzLjI4OWMwLjI0NSwwLjkzMiwwLjYzNSwxLjgxNCwxLjE0NSwyLjYwMg0KCWMxLjA1NiwxLjYzNSwyLjc3LDIuOTM2LDQuNzEzLDMuNjE1YzAuMzQyLDAuMTE5LDAuMTgxLDAuNDUsMS4xODEsMC41Mjh2MC4yM2MwLDAtMC4yNTgsMC0wLjI1NywwYzAuNjQ2LDAsMS4yOTMsMC4xMDcsMS45MywwLjEwNw0KCWMwLjA4OSwwLDAuMTc3LTAuMTA3LDAuMjY2LTAuMTA3aDU0LjAyNWM0Ljk3MSwwLDktNC4wMjksOS05cy00LjAyOS05LTktOUg2MC43NDNsMjMuNzczLTk3LjkyDQoJQzg4LjE3LDIzNS41NjUsMTA3LjQ3MiwyMjIuNTk2LDEyNy44NzUsMjIwLjk4N3ogTTE4OS45NywyNDguNTA4Yy00Ljk3MSwwLTksNC4wMjktOSw5czQuMDI5LDksOSw5aDMxLjc4YzQuOTcxLDAsOS00LjAyOSw5LTkNCglzLTQuMDI5LTktOS05SDE4OS45N3ogTTc0Ljg0MiwxMDAuNDc1Yy0wLjQxNy00Ljk1MiwzLjI1OS05LjMwNiw4LjIxMi05LjcyM2MxLjUxOS0wLjEyNiwyLjk4LDAuMTMsNC4yOTIsMC42OTINCgljMS40MjQtNi4zNzQsMy42NDEtMTIuNTE5LDYuNjI4LTE4LjMzNmMtMC4zNDQtMC4yODMtMC42ODEtMC41OTQtMC45ODItMC45M2MtMC4zMjktMC4zNjYtMC42NDgtMC43NTYtMC45MS0xLjE2NA0KCWMtMC44MTktMS4yNzUtMS40NTUtMi43NzItMS40NTUtNC4zOGMwLTAuMDAyLDAtMC4wMDUsMC0wLjAwOHMwLTAuMDA3LDAtMC4wMWMwLTAuMjE4LDAtMC40MzcsMC0wLjY1NmMwLTAuMDAzLDAtMC4wMDYsMC0wLjAwOQ0KCWMwLTAuMDAxLDAtMC4wMDMsMC0wLjAwNGMwLTAuMzAxLDAuMDctMC41MSwwLjEwNS0wLjgwMkM5NC43NzIsMjcuOTQ3LDEyNi4wNzcsMCwxNjMuNTU2LDBjMzQuNzc4LDAsNjQuMjAyLDIzLjUwOCw3MS40OTIsNTcuNTA4DQoJaDI0LjE0OWM0Ljk3MSwwLDksNC4wMjksOSw5cy00LjAyOSw5LTksOWgtMjUuMDU2YzIuNDgxLDUsNC4zNjIsMTAuNDgxLDUuNjIsMTYuMTFjMS4zMS0wLjU2MiwyLjc3MS0wLjk5Miw0LjI5My0wLjg2Ng0KCWM0Ljk1MywwLjQxNyw4LjYzMSw0Ljc3LDguMjE1LDkuNzIzbC0xLjE3LDEzLjkyYy0wLjQxNyw0Ljk1Mi00Ljc2Myw4LjYyMi05LjcyMyw4LjIxNWMtMC4zMjYtMC4wMjctMC42NDYtMC4wNzItMC45NjEtMC4xMzMNCgljLTYuNTQ5LDM2LjQ4MS0zOC41MjIsNjQuMjUtNzYuODYsNjQuMjVjLTM4LjMzNywwLTcwLjMxLTI3Ljc2OS03Ni44NTgtNjQuMjVjLTAuMzE0LDAuMDYxLTAuNjM1LDAuMTA0LTAuOTYxLDAuMTMzDQoJYy00Ljk0NSwwLjQyMS05LjMwNi0zLjI2MS05LjcyMy04LjIxNUw3NC44NDIsMTAwLjQ3NXogTTExMC42NDYsNTcuNTA4aDEwNS44MjJjLTYuODM4LTIzLTI4LjA2My0zOS4zMzQtNTIuOTEyLTM5LjMzNA0KCUMxMzguNzA4LDE4LjE3NCwxMTcuNDgzLDM0LjUwOCwxMTAuNjQ2LDU3LjUwOHogTTEwMy40NzEsMTA4Ljg1N2MwLDMzLjEzMiwyNi45NTUsNTkuOTU3LDYwLjA4Niw1OS45NTcNCgljMzMuMTMyLDAsNjAuMDg3LTI2Ljg2OCw2MC4wODctNjBjMC0xMi4wOTEtMy41MDgtMjMuMzA1LTEwLjE4My0zMy4zMDVoLTk5LjgwOUMxMDYuOTc3LDg1LjUwOCwxMDMuNDcxLDk2Ljc2NSwxMDMuNDcxLDEwOC44NTd6DQoJIE0zNDQuNDI4LDI1Ni41ODRjLTAuMTA3LTEuMjM5LTAuNDc1LTIuNDcxLTEuMTE0LTMuNjA5Yy0wLjE3NC0wLjMxMi0wLjM2Ny0wLjYxNC0wLjU3OS0wLjkwNWwtOC45MjEtMTIuNzM5DQoJYy0yLjg1MS00LjA3Mi04LjQ2MS01LjA2My0xMi41MzQtMi4yMWMtNC4wNzEsMi44NTEtNS4wNjIsOC40NjMtMi4yMSwxMi41MzRsNi4wMzksOC42MjVsLTUuNTEyLDExLjgxOQ0KCWMtMC4wMDMsMC4wMDgtMC4wMDcsMC4wMTUtMC4wMSwwLjAyMmwtNS41MjMsMTIuMDQ2bC0xMy4wMTYsMS4zNDFjLTAuMDAyLDAtMC4wMDQsMC0wLjAwNiwwbC0xMy4wMTIsMC45MzZsLTcuNDk0LTEwLjgwNQ0KCWMtMC4wMDQtMC4wMDUtMC4wMDctMC4wNTktMC4wMTEtMC4wNjRsLTcuNDg0LTEwLjcxNWwxMS4wNDQtMjMuNjk3bDEwLjQ5LTAuOTI0YzQuOTUyLTAuNDM0LDguNjE1LTQuODAyLDguMTgyLTkuNzUzDQoJYy0wLjQzNC00Ljk1Mi00LjgxMy04LjYwOS05Ljc1LTguMTgzbC0xNS40OTUsMS4zNTZjLTAuMzU1LDAuMDI0LTAuNzA4LDAuMDY5LTEuMDU3LDAuMTM1Yy0xLjI5NywwLjI0My0yLjQ4NywwLjc2MS0zLjUxNSwxLjQ4NQ0KCWMtMS4wMTQsMC43MTMtMS44OTMsMS42NDQtMi41NTYsMi43NjRjLTAuMTgyLDAuMzA2LTAuMzQ1LDAuNjIxLTAuNDksMC45NDdsLTE1LjI4OSwzMi43OWMtMC4xNiwwLjMyOC0wLjMsMC42NjQtMC40MTksMS4wMDYNCgljLTAuNDMsMS4yMzMtMC41NzUsMi41MS0wLjQ2NSwzLjc0OWMwLjEwOCwxLjIzNiwwLjQ3NCwyLjQ2MywxLjExLDMuNTk5YzAuMTc2LDAuMzE0LDAuMzcsMC42MiwwLjU4MywwLjkxMmwxMC4zNzYsMTQuODE3DQoJYzAuMDA1LDAuMDA3LDAuMDEsMC4wMTQsMC4wMTUsMC4wMjFsNy40NzksMTAuNjg1bC0zNi4wODMsNzcuMzgxYy0yLjEwMSw0LjUwNS0wLjE1MSw5Ljg2LDQuMzU0LDExLjk2MQ0KCWMxLjIzLDAuNTczLDIuNTI0LDAuODQ1LDMuNzk4LDAuODQ1YzMuMzksMCw2LjYzNi0xLjkyNCw4LjE2My01LjE5OGwzNi4wODItNzcuMTQ2bDEzLjAxMi0wLjkwMmMwLjAwMiwwLDAuMDA0LDAsMC4wMDYsMA0KCWwxOC4wMjEtMS44MTNjMC4zNTgtMC4wMjQsMC43MTQtMC4xODgsMS4wNjQtMC4yNTZjMS4yOTItMC4yNDMsMi40NzctMC44MTcsMy41MDEtMS41MzljMS4wMTQtMC43MTEsMS44OTEtMS42NjksMi41NTUtMi43ODYNCgljMC4xODUtMC4zMDksMC4zNTEtMC42NDQsMC40OTctMC45NzVsNy42NDQtMTYuMzk4YzAuMDAxLTAuMDAyLDAuMDAyLTAuMDA4LDAuMDAzLTAuMDA5bDcuNjQ0LTE2LjM5Ng0KCWMwLjE1OS0wLjMyNiwwLjI5OS0wLjY2LDAuNDE3LTEuMDAxQzM0NC4zOTIsMjU5LjEwMiwzNDQuNTM4LDI1Ny44MjUsMzQ0LjQyOCwyNTYuNTg0eiIvPg0KPC9zdmc+DQo=" alt="expert mode"/>');
            }
        }

        $btn = $dlg.find('.btn-unselectall');
        $btn.on('click', function () {
            $dlg.find('.objects-list-running').show();
            setTimeout(function () {
                data.$tree.fancytree('getRootNode').visit(function (node) {
                    node.setSelected(false);
                });
                $dlg.find('.objects-list-running').hide();
            }, 100);
        }).attr('title', data.texts.unselectAll);

        if (!isMaterial) {
            $btn.button({icons: {primary: 'ui-icon-circle-close'}, text: false});
        } else {
            $btn.prepend('<i class="material-icons">cancel</i>');// todo
        }

        $btn = $dlg.find('.btn-invert-selection');
        $btn.on('click', function () {
            $dlg.find('.objects-list-running').show();
            setTimeout(function () {
                data.$tree.fancytree('getRootNode').visit(function (node) {
                    if (!data.filterVals.length || node.match || node.subMatchCount){
                        if (data.objects[node.key] && data.objects[node.key].type === 'state') {
                            node.toggleSelected();
                        }
                    }
                });
                $dlg.find('.objects-list-running').hide();
            }, 100);
        }).attr('title', data.texts.invertSelection);

        if (!isMaterial) {
            $btn.button({icons: {primary: 'ui-icon-transferthick-e-w'}, text: false});
        } else {
            $btn.prepend('<i class="material-icons">invert_colors</i>'); // todo
        }

        if (data.useValues) {
            $btn = $dlg.find('.btn-values');
            $btn.on('click', function () {
                data.valuesActive = !data.valuesActive;
                updateValuesButton(data);
                window.localStorage && window.localStorage.setItem(data.name + '-values', data.valuesActive ? 'true' : 'false');

                $dlg.find('.objects-list-running').show();

                setTimeout(function () {
                    data.inited = false;
                    initTreeDialog(data.$dlg);
                    $dlg.find('.objects-list-running').hide();
                }, 100);

            }).attr('title', data.texts.toggleValues);
            updateValuesButton(data);
        }

        if (!isMaterial) {
            $btn.button({icons: {primary: 'ui-icon-tag'}, text: false});
        } else {
            $btn.prepend('<i class="material-icons">looks_one</i>');
        }

        for (var f in filter) {
            try {
                if (f) setFilterVal(data, f, filter[f]);
            } catch (err) {
                console.error('Cannot apply filter: ' + err)
            }
        }

        if (data.panelButtons) {
            for (var z = 0; z < data.panelButtons.length; z++) {
                $btn = $dlg.find('.btn-custom-' + z);
                $btn.attr('title', data.panelButtons[z].title || '');

                $btn.on('click', data.panelButtons[z].click);
                if (!isMaterial) {
                    $btn.button(data.panelButtons[z]);
                } else {
                    $btn.addClass('custom-toolbar-btn').prepend('<i class="material-icons">' + data.panelButtons[z]['material-icon'] + '</i>');
                }
            }
        }

        /*if (data.useHistory) {
            $dlg.find('.filter_button_' + data.instance + '_btn')
                .button(data.customButtonFilter)
                .on('click', data.customButtonFilter.callback);
        }*/

        showActive($dlg);
        installColResize(data, $dlg);
        loadSettings(data);
        if ($dlg.attr('id') !== 'dialog-select-member' && $dlg.attr('id') !== 'dialog-select-members') {
            setTimeout(function () {
                $dlg.css({height: '100%'}); //xxx
            }, 500);
        } else if ($dlg.attr('id') === 'dialog-select-members') {
            //$dlg.find('div:first-child').css({height: 'calc(100% - 50px)'});
        }

        // set preset filters
        for (var field in data.filterPresets) {
            if (!data.filterPresets.hasOwnProperty(field) || !data.filterPresets[field]) continue;
            if (typeof data.filterPresets[field] === 'object') {
                setFilterVal(data, field, data.filterPresets[field][0]);
            } else {
                setFilterVal(data, field, data.filterPresets[field]);
            }
        }
        sortTree(data);
    }

    function storeSettings(data, force) {
        if (typeof Storage === 'undefined' || !data.name) return;

        if (data.timer) clearTimeout(data.timer);

        if (force) {
            window.localStorage.setItem(data.name + '-filter', JSON.stringify(data.filterVals));
            window.localStorage.setItem(data.name + '-expert', JSON.stringify(data.expertMode));
            window.localStorage.setItem(data.name + '-sort', JSON.stringify(data.sort));
            window.localStorage.setItem(data.name + '-values', data.valuesActive ? 'true' : 'false');
            data.timer = null;
        } else {
            data.timer = setTimeout(function () {
                window.localStorage.setItem(data.name + '-filter', JSON.stringify(data.filterVals));
                window.localStorage.setItem(data.name + '-expert', JSON.stringify(data.expertMode));
                window.localStorage.setItem(data.name + '-sort', JSON.stringify(data.sort));
                window.localStorage.setItem(data.name + '-values', data.valuesActive ? 'true' : 'false');
            }, 500);
        }
    }

    function loadSettings(data) {
        if (typeof Storage !== 'undefined' && data.name) {
            var f = window.localStorage.getItem(data.name + '-filter');
            if (f) {
                try{
                    f = JSON.parse(f);
                    removeImageFromSettings(f);
                    //setTimeout(function () {
                    for (var field in f) {
                        if (!f.hasOwnProperty(field) || field === 'length') continue;
                        if (data.filterPresets[field]) continue;
                        setFilterVal(data, field, f[field]);
                    }
                    //}, 0);
                } catch (e) {
                    console.error('Cannot parse settings: ' + e);
                }
            } else if (!data.filter) {
                // set default filter: state
                setFilterVal(data, 'type', 'state');
            }
        }
    }

    function updateValuesButton(data) {
        if (data.valuesActive) {
            data.$dlg.find('.btn-values').addClass('ui-state-error red lighten-3');
        } else {
            data.$dlg.find('.btn-values').removeClass('ui-state-error red lighten-3');
        }
    }

    function countChildren(id, data) {
        var pos = data.ids.indexOf(id);
        var len = data.ids.length;
        var cnt = 0;
        if (id.indexOf('.') === -1 || (
                data.objects[id] && (data.objects[id].type === 'state' || data.objects[id].type === 'adapter'))) {
            return cnt;
        }
        if (pos === -1) {
            pos = 0;
            while (pos < len && data.ids[pos] < id) {
                pos++;
            }
            pos--;
        }
        if (pos !== -1) {
            pos++;
            while (pos < len && data.ids[pos].startsWith(id + '.')) {
                pos++;
                cnt++;
            }
        }
        return cnt;
    }

    function updateStats(data) {
        data.$dlg.find('.objects-info .objects-val-objs').html('<span class="highlight">' + data.stats.objs + '</span>');
        data.$dlg.find('.objects-info .objects-val-states').html('<span class="highlight">' + data.stats.states + '</span>');
    }

    function recalcChildrenCounters(node, data) {
        var id  = node.key;
        var $tr = $(node.tr);
        var $firstTD = $tr.find('>td').eq(0);
        var cnt = countChildren(id, data);
        if (cnt) {
            var $cnt = $firstTD.find('.select-id-cnt');
            if ($cnt.length) {
                $cnt.text('#' + cnt);
            } else {
                //$firstTD.append('<span class="select-id-cnt" style="position: absolute; top: 6px; right: 1px; font-size: smaller; color: lightslategray">#' + cnt + '</span>');
                $firstTD.append('<span class="select-id-cnt">#' + cnt + '</span>');
            }
        } else {
            $firstTD.find('.select-id-cnt').remove();
        }
        if (node.children && node.children.length) {
            for (var c = 0; c < node.children.length; c++) {
                recalcChildrenCounters(node.children[c], data);
            }
        }
    }

    var methods = {
        init: function (options) {
            isMaterial = typeof M !== 'undefined'; // is material UI
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
                zindex:     null,
                list:       false,
                name:       null,
                sortConfig:       {
                    statesFirst:     true,
                    ignoreSortOrder: false
                },
                //columns: ['image', 'name', 'type', 'role', 'enum', 'room', 'function', 'value', 'button']
                columns: ['name', 'type', 'role', 'enum', 'room', 'function', 'value', 'button']
            }, options);

            settings.texts = settings.texts || {};
            settings.texts = $.extend({
                select:   'Select',
                cancel:   'Cancel',
                all:      'All',
                id:       'ID',
                name:     'Name',
                role:     'Role',
                type:     'Type',
                room:     'Room',
                'function': 'Function',
                enum:     'Members',
                value:    'Value',
                selectid: 'Select ID',
                from:     'From',
                quality:  'Quality',
                lc:       'Last changed',
                ts:       'Time stamp',
                ack:      'Acknowledged',
                expand:   'Expand all nodes',
                collapse: 'Collapse all nodes',
                refresh:  'Rebuild tree',
                edit:     'Edit',
                ok:       'Ok',
                push:     'Trigger event',
                wait:     'Processing...',
                list:     'Show list view',
                tree:     'Show tree view',
                selectAll: 'Select all',
                unselectAll: 'Unselect all',
                invertSelection: 'Invert selection',
                copyToClipboard: 'Copy to clipboard',
                expertMode: 'Toggle expert mode',
                button:    'Settings',
                noData:   'No data',
                Objects:   'Objects',
                States:    'States',
                toggleValues: 'Toggle states view'
            }, settings.texts);

            var that = this;
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                // Init data
                if (!data) {
                    data = {
                        tree:               {title: '', children: [], count: 0, root: true},
                        roomEnums:          [],
                        rooms:              {},
                        roomsColored:       {},
                        funcEnums:          [],
                        funcs:              {},
                        funcsColored:       {},
                        roles:              [],
                        histories:          [],
                        types:              [],
                        regexSystemAdapter: new RegExp('^system\\.adapter\\.'),
                        regexSystemHost:    new RegExp('^system\\.host\\.'),
                        regexEnumRooms:     new RegExp('^enum\\.rooms\\.'),
                        regexEnumFuncs:     new RegExp('^enum\\.functions\\.'),
                        inited:             false,
                        filterPresets:      {}
                    };
                    $dlg.data('selectId', data);
                }
                if (data.inited) {
                    // Re-init tree if filter or selectedID changed
                    if ((data.filter && !settings.filter && settings.filter !== undefined) ||
                        (!data.filter && settings.filter) ||
                        (data.filter && settings.filter && JSON.stringify(data.filter) !== JSON.stringify(settings.filter))) {
                        data.inited = false;
                    }
                    if (data.inited && settings.currentId !== undefined && (data.currentId !== settings.currentId)) {
                        // Deactivate current line
                        var tree = data.$tree.fancytree('getTree');
                        tree.visit(function (node) {
                            if (node.key === data.currentId) {
                                node.setActive(false);
                                return false;
                            }
                        });
                    }
                }

                data = $.extend(data, settings);

                data.rootExp = data.root ? new RegExp('^' + data.root.replace('.', '\\.')) : null;

                data.selectedID = data.currentId;

                // make a copy of filter
                data.filter = JSON.parse(JSON.stringify(data.filter));

                if (!data.objects && data.connCfg) {
                    // Read objects and states
                    data.socketURL = '';
                    data.socketSESSION = '';
                    if (typeof data.connCfg.socketUrl !== 'undefined') {
                        data.socketURL = data.connCfg.socketUrl;
                        if (data.socketURL && data.socketURL[0] === ':') {
                            data.socketURL = location.protocol + '//' + location.hostname + data.socketURL;
                        }
                        data.socketSESSION          = data.connCfg.socketSession;
                        data.socketUPGRADE          = data.connCfg.upgrade;
                        data.socketRememberUpgrade  = data.connCfg.rememberUpgrade;
                        data.socketTransports       = data.connCfg.transports;
                    }

                    var connectTimeout = setTimeout(function () {
                        // noinspection JSJQueryEfficiency
                        var $dlg = $('#select-id-dialog');
                        if (!$dlg.length) {
                            $('body').append('<div id="select-id-dialog"><span class="ui-icon ui-icon-alert"></span><span>' + (data.texts.noconnection || 'No connection to server') + '</span></div>');
                            $dlg = $('#select-id-dialog');
                        }

                        if (typeof M !== 'undefined') {
                            $dlg.modal();
                        } else {
                            $dlg.dialog({
                                modal: true,
                                open: function (event) {
                                    $(event.target).parent().find('.ui-dialog-titlebar-close .ui-button-text').html('');
                                }
                            });
                        }
                    }, 5000);

                    data.socket = io.connect(data.socketURL, {
                        query:                          'key=' + data.socketSESSION,
                        'reconnection limit':           10000,
                        'max reconnection attempts':    Infinity,
                        upgrade:                        data.socketUPGRADE,
                        rememberUpgrade:                data.socketRememberUpgrade,
                        transports:                     data.socketTransports
                    });

                    data.socket.on('connect', function () {
                        if (connectTimeout) clearTimeout(connectTimeout);
                        this.emit('name', data.connCfg.socketName || 'selectId');
                        this.emit('getObjects', function (err, res) {
                            data.objects = res;
                            data.socket.emit('getStates', function (err, res) {
                                data.states = res;
                                if (data.readyCallback) {
                                    data.readyCallback(err, data.objects, data.states);
                                }
                            });
                        });
                    });
                    data.socket.on('stateChange', function (id, obj) {
                        that.selectId('state', id, obj);
                    });
                    data.socket.on('objectChange', function (id, obj) {
                        that.selectId('object', id, obj);
                    });
                }

                $dlg.data('selectId', data);
            }

            return this;
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
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                if (!data) continue;
                if (data.inited) {
                    // Re-init tree if filter or selectedID changed
                    if ((data.filter && !filter && filter !== undefined) ||
                        (!data.filter && filter) ||
                        (data.filter &&  filter && JSON.stringify(data.filter) !== JSON.stringify(filter))) {
                        data.inited = false;
                    }

                    if (data.inited && currentId !== undefined && (data.currentId !== currentId)) {
                        // Deactivate current line
                        var tree_ = data.$tree.fancytree('getTree');
                        tree_.visit(function (node) {
                            if (node.key === data.currentId) {
                                node.setActive(false);
                                return false;
                            }
                        });
                    }
                }
                if (currentId !== undefined) data.currentId = currentId;
                if (filter    !== undefined) data.filter    = JSON.parse(JSON.stringify(filter));
                if (onSuccess !== undefined) {
                    data.onSuccess  = onSuccess;
                    data.$tree = $dlg.find('.objects-list-table');
                    if (data.$tree[0]) data.$tree[0]._onSuccess = data.onSuccess;
                }
                data.selectedID = data.currentId;

                if (!data.inited || !data.noDialog) {
                    data.$dlg = $dlg;
                    initTreeDialog($dlg);
                } else {
                    if (data.selectedID) {
                        var tree__ = data.$tree.fancytree('getTree');
                        tree__.visit(function (node) {
                            if (node.key === data.selectedID) {
                                node.setActive();
                                node.makeVisible({scrollIntoView: false});
                                return false;
                            }
                        });
                    }
                }
                if (!data.noDialog) {
                    if (typeof M !== 'undefined') {
                        if (data.currentId) {
                            $dlg.find('.title').text(data.texts.selectid +  ' - ' + getNameObj(data.objects[data.currentId], data.currentId));
                            $dlg.find('.btn-set').removeClass('disabled');
                        } else {
                            $dlg.find('.title').text(data.texts.selectid);
                            $dlg.find('.btn-set').addClass('disabled');
                        }
                        $dlg.show().modal('open');
                    } else {
                        if (data.currentId) {
                            $dlg.dialog('option', 'title', data.texts.selectid +  ' - ' + getNameObj(data.objects[data.currentId], data.currentId));
                            $dlg.find('#button-ok').removeClass('ui-state-disabled');
                        } else {
                            $dlg.dialog('option', 'title', data.texts.selectid);
                            $dlg.find('#button-ok').addClass('ui-state-disabled');
                        }
                        $dlg.dialog('open');
                    }
                    showActive($dlg, true);
                } else {
                    $dlg.show();
                    showActive($dlg, true);
                }
            }

            return this;
        },
        hide: function () {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                if (data && !data.noDialog) {
                    $dlg.dialog('hide');
                } else {
                    $dlg.hide();
                }
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
                    data.tree      = {title: '', children: [], count: 0, root: true};
                    data.rooms     = {};
                    data.roomEnums = [];
                    data.funcs     = {};
                    data.funcEnums = [];
                    data.roles     = [];
                    data.types     = [];
                    data.histories = [];
                }
            }
            return this;
        },
        getInfo: function (id) {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                if (data && data.objects) {
                    return data.objects[id];
                }
            }
            return null;
        },
        getTreeInfo: function (id) {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                if (!data || !data.$tree) continue;

                var tree = data.$tree.fancytree('getTree');
                var node = tree && tree.getNodeByKey(id);
                // var node = null;
                // tree.visit(function (n) {
                //     if (n.key === id) {
                //         node = n;
                //         return false;
                //     }
                // });
                var result = {
                    id: id,
                    parent: (node && node.parent && node.parent.parent) ? node.parent.key : null,
                    children: null,
                    obj: data.objects ? data.objects[id] : null
                };
                if (node && node.children) {
                    result.children = [];
                    for (var t = 0; t < node.children.length; t++) {
                        result.children.push(node.children[t].key);
                    }
                    if (!result.children.length) delete result.children;

                }
                return result;
            }
            return null;
        },
        destroy: function () {
            for (var i = 0; i < this.length; i++) {
                var $dlg = $(this[i]);
                var data = $dlg.data('selectId');
                if (data) {
                    $dlg.data('selectId', null);
                    $dlg.find('.dialog-select-container').remove();
                }
            }
            return this;
        },
        reinit: function () {
            for (var i = 0; i < this.length; i++) {
                var dlg = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                if (data) {
                    data.inited = false;
                    initTreeDialog(data.$dlg);
                }
            }
            return this;
        },
        // update states
        state: function (id, state) {
            for (var i = 0; i < this.length; i++) {
                var dlg  = this[i];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                if (!data || !data.states || !data.$tree) continue;
                /*if (data.states[id] &&
                    state &&
                    data.states[id].val  === state.val  &&
                    data.states[id].ack  === state.ack  &&
                    data.states[id].q    === state.q    &&
                    data.states[id].from === state.from &&
                    data.states[id].ts   === state.ts
                ) return;*/

                data.states[id] = state;
                var tree = data.$tree.fancytree('getTree');
                var node = tree.getNodeByKey(id);
                // var node = null;
                // tree.visit(function (n) {
                //     if (n.key === id) {
                //         node = n;
                //         return false;
                //     }
                // });
                if (node) node.render(true);
            }
            return this;
        },
        // update objects
        object: function (id, obj, action) {
            for (var k = 0, len = this.length; k < len; k++) {
                var dlg = this[k];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                if (!data || !data.$tree || !data.objects) continue;

                if (id.match(/^enum\.rooms/))     {
                    data.rooms = {};
                    data.roomsColored = {};
                }
                if (id.match(/^enum\.functions/)) {
                    data.funcs = {};
                    data.funcsColored = {};
                }

                var tree = data.$tree.fancytree('getTree');
                var node = tree.getNodeByKey(id);
                // var node = null;
                // tree.visit(function (n) {
                //     if (n.key === id) {
                //         node = n;
                //         return false;
                //     }
                // });

                // If new node
                if (!node && obj) {
                    // Filter it
                    if (typeof data.stats === 'object' && action === 'add') {
                        data.stats.objs++;
                        if (obj.type === 'state') {
                            data.stats.states++;
                        }
                        updateStats(data);
                    }

                    data.objects[id] = obj;
                    var addedNodes = [];

                    if (!filterId(data, id)) {
                        return;
                    }
                    // add ID to IDS;
                    if (data.ids.length) {
                        var p = 0;
                        while (data.ids[p] < id) {
                            p++;
                        }
                        data.ids.splice(p, 0, id);
                    }
                    treeInsert(data, id, false, addedNodes);

                    for (var i = 0; i < addedNodes.length; i++) {
                        if (!addedNodes[i].parent.root) {
                            node = tree.getNodeByKey(addedNodes[i].parent.key);
                            // tree.visit(function (n) {
                            //     if (n.key === addedNodes[i].parent.key) {
                            //         node = n;
                            //         return false;
                            //     }
                            // });

                        } else {
                            node = data.$tree.fancytree('getRootNode');
                        }
                        // if no children
                        if (!node.children || !node.children.length) {
                            // add
                            node.addChildren(addedNodes[i]);
                            node.folder = true;
                            node.expanded = false;
                            node.render(true);
                            node.children[0].match = true;
                        } else {
                            var c;
                            for (c = 0; c < node.children.length; c++) {
                                if (node.children[c].key > addedNodes[i].key) break;
                            }
                            // if some found greater than new one
                            if (c !== node.children.length) {
                                node.addChildren(addedNodes[i], node.children[c]);
                                node.children[c].match = true;
                                node.render(true);
                            } else {
                                // just add
                                node.addChildren(addedNodes[i]);
                                node.children[node.children.length - 1].match = true;
                                node.render(true);
                            }
                        }
                    }
                } else if (!obj) {
                    if (typeof data.stats === 'object' && action === 'delete') {
                        data.stats.objs--;
                        if (data.objects[id] && data.objects[id].type === 'state') {
                            data.stats.states--;
                        }
                        updateStats(data);
                    }

                    // object deleted
                    delete data.objects[id];
                    deleteTree(data, id);

                    if (data.ids.length) {
                        var pos = data.ids.indexOf(id);
                        if (pos !== -1) {
                            data.ids.splice(pos, 1);
                        }
                    }

                    if (node) {
                        var prev = node.getPrevSibling();
                        var parent = node.parent;
                        node.removeChildren();
                        node.remove();
                        prev && prev.setActive();

                        while (parent && (!parent.children || !parent.children.length)) {
                            var _parent = parent.parent;
                            parent.remove();
                            if (_parent) {
                                _parent.setActive();
                            }
                            parent = _parent;
                        }

                        // recalculate numbers of all children
                        if (data.ids.length) {
                            recalcChildrenCounters(parent, data);
                        }
                        // if (node.children && node.children.length) {
                        //     if (node.children.length === 1) {
                        //         node.folder = false;
                        //         node.expanded = false;
                        //     }
                        //     node.render(true);
                        // } else {
                        //     if (node.parent && node.parent.children.length === 1) {
                        //         node.parent.folder = false;
                        //         node.parent.expanded = false;
                        //         node.parent.render(true);
                        //     }
                        //     node.remove();
                        // }
                    }
                } else {
                    // object updated
                    if (node) {
                        node.render(true);
                    }
                }
            }
            return this;
        },
        option: function (name, value) {
            for (var k = 0; k < this.length; k++) {
                var dlg = this[k];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                if (!data) continue;

                if (data[name] !== undefined) {
                    data[name] = value;
                } else {
                    console.error('Unknown options for selectID: ' + name);
                }
            }
        },
        objectAll: function (id, obj) {
            $('.select-id-dialog-marker').selectId('object', id, obj);
        },
        stateAll: function (id, state) {
            $('.select-id-dialog-marker').selectId('state', id, state);
        },
        getFilteredIds: function () {
            for (var k = 0; k < this.length; k++) {
                var dlg = this[k];
                var $dlg = $(dlg);
                var data = $dlg.data('selectId');
                if (!data || !data.$tree || !data.objects) continue;

                var tree = data.$tree.fancytree('getTree');
                var nodes = [];
                tree.visit(function (n) {
                    if (n.match) {
                        nodes.push(n.key);
                    }
                });
                return nodes;
            }
            return null;
        },
        getActual: function () {
            //for (var k = 0; k < this.length; k++) {
            //
            //}
            var dlg = this[0];
            var $dlg = $(dlg);
            var data = $dlg.data('selectId');
            return data ? data.selectedID : null;
        }
    };

    $.fn.selectId = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method "' +  method + '" not found in jQuery.selectId');
        }
    };
})(jQuery);
