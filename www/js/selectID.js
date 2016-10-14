/*
 Copyright 2014-2016 bluefox <dogafox@gmail.com>

 version: 1.0.1 (2016.10.14)

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
             onSuccess:  null,     // callback function to be called if user press "Select". Can be overwritten in "show" - function (newId, oldId, newObj)
             onChange:   null,     // called every time the new object selected - function (newId, oldId, newObj)
             noDialog:   false,    // do not make dialog
             noMultiselect: false, // do not make multiselect
             buttons:    null,     // array with buttons, that should be shown in last column
                                   // if array is not empty it can has following fields
                                   // [{
                                   //   text: false, // same as jquery button
                                   //   icons: {     // same as jquery button
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
             webServer:    null,   // link to webserver, by default ":8082"
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
                 lc:       'Last changed',
                 ts:       'Time stamp',
                 ack:      'Acknowledged',
                 expand:   'Expand all nodes',
                 collapse: 'Collapse all nodes',
                 refresh:  'Rebuild tree',
                 edit:     'Edit',
                 ok:       'Ok',
                 wait:     'Processing...',
                 list:     'Show list view',
                 tree:     'Show tree view',
                 selectAll: 'Select all',
                 unselectAll: 'Unselect all',
                 invertSelection: 'Invert selection',
                 copyToClipboard: 'Copy to clipboard',
                 expertMode: 'Toggle expert mode'
             },
             columns: ['image', 'name', 'type', 'role', 'enum', 'room', 'function', 'value', 'button'],
                                // some elements of columns could be an object {name: field, data: function (id, name){}, title: function (id, name) {}}
             widths:    null,   // array with width for every column
             editEnd:   null,   // function (id, newValues) for edit lines (only id and name can be edited)
             editStart: null,   // function (id, $inputs) called after edit start to correct input fields (inputs are jquery objects),
             zindex:    null,   // z-index of dialog or table
             customButtonFilter: null, // if in the filter over the buttons some specific button must be shown. It has type like {icons:{primary: 'ui-icon-close'}, text: false, callback: function ()}
             expertModeRegEx: null // list of regex with objects, that will be shown only in expert mode, like  /^system\.|^iobroker\.|^_|^[\w-]+$|^enum\.|^[\w-]+\.admin/
             quickEdit:  null,   // list of fields with edit on click. Elements can be just names from standard list or objects like:
                                 // {name: 'field', options: {a1: 'a111_Text', a2: 'a22_Text'}}, options can be a function (id, name), that give back such an object
             quickEditCallback: null // function (id, attr, newValue, oldValue)
     }
 +  show(currentId, filter, callback) - all arguments are optional if set by "init"
 +  clear() - clear object tree to read and build anew (used only if objects set by "init")
 +  getInfo(id) - get information about ID
 +  getTreeInfo(id) - get {id, parent, children, object}
 +  state(id, val) - update states in tree
 +  object(id, obj) - update object info in tree
 +  reinit() - draw tree anew
 */
(function ($) {
    'use strict';

    if ($.fn.selectId) return;

    var instance = 0;

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

    function getAllStates(data) {
        var objects = data.objects;
        var isType  = data.columns.indexOf('type') !== -1;
        var isRoom  = data.columns.indexOf('room') !== -1;
        var isFunc  = data.columns.indexOf('function') !== -1;
        var isRole  = data.columns.indexOf('role') !== -1;
        var isHist  = data.columns.indexOf('button') !== -1;
        data.tree = {title: '', children: [], count: 0, root: true};
        data.roomEnums = [];
        data.funcEnums = [];

        for (var id in objects) {

            if (isRoom && objects[id].type === 'enum' && data.regexEnumRooms.test(id)) data.roomEnums.push(id);
            if (isFunc && objects[id].type === 'enum' && data.regexEnumFuncs.test(id)) data.funcEnums.push(id);

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
                if (data.histories.indexOf(h) === -1) data.histories.push(h);
            }

            // ignore system objects in expert mode
            if (data.expertModeRegEx && !data.expertMode && data.expertModeRegEx.test(id)) continue;

            if (!filterId(data, id)) continue;

            treeInsert(data, id, data.currentId === id);

            if (objects[id].enums) {
                for (var e in objects[id].enums) {
                    if (objects[e] &&
                        objects[e].common &&
                        objects[e].common.members &&
                        objects[e].common.members.indexOf(id) === -1) {
                        objects[e].common.members.push(id);
                    }
                }
            }
        }
        data.inited = true;
        data.roles.sort();
        data.types.sort();
        data.roomEnums.sort();
        data.funcEnums.sort();
        data.histories.sort();
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
            if (deletedNodes && node.id) deletedNodes.push(node);
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
            console.log('Id ' + id + ' not found');
            return;
        }
        _deleteTree(node, deletedNodes);
    }

    function findTree(data, id) {
        return _findTree(data.tree, treeSplit(data, id, false), 0);
    }
    function _findTree(tree, parts, index) {
        var num = -1;
        for (var j = 0; j < tree.children.length; j++) {
            if (tree.children[j].title === parts[index]) {
                num = j;
                break;
            }
            if (tree.children[j].title > parts[index]) break;
        }

        if (num === -1) return null;

        if (parts.length - 1 === index) {
            return tree.children[num];
        } else {
            return _findTree(tree.children[num], parts, index + 1);
        }
    }

    function treeInsert(data, id, isExpanded, addedNodes) {
        return _treeInsert(data.tree, data.list ? [id] : treeSplit(data, id, false), id, 0, isExpanded, addedNodes, data);
    }
    function _treeInsert(tree, parts, id, index, isExpanded, addedNodes, data) {
        if (!index) index = 0;

        var num = -1;
        var j;
        for (j = 0; j < tree.children.length; j++) {
            if (tree.children[j].title === parts[index]) {
                num = j;
                break;
            }
            if (tree.children[j].title > parts[index]) break;
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
                    } catch (err) {
                        console.error(err);
                    }
                    return false;
                }
            });
        }
    }

    function syncHeader($dlg) {
        // read width of data.$tree and set the same width for header
        var data = $dlg.data('selectId');
        var $header = $('#selectID_header_' + data.instance);
        var thDest = $header.find('>colgroup>col');	//if table headers are specified in its semantically correct tag, are obtained
        var thSrc = data.$tree.find('>thead>tr>th');
        for (var i = 1; i < thSrc.length; i++) {
            $(thDest[i]).attr('width', $(thSrc[i]).width());
        }
    }

    function findRoomsForObject(data, id, withParentInfo, rooms) {
        rooms = rooms || [];
        for (var i = 0; i < data.roomEnums.length; i++) {
            if (data.objects[data.roomEnums[i]].common.members.indexOf(id) !== -1 &&
                rooms.indexOf(data.objects[data.roomEnums[i]].common.name) === -1) {
                if (!withParentInfo) {
                    rooms.push(data.objects[data.roomEnums[i]].common.name);
                } else {
                    rooms.push({name: data.objects[data.roomEnums[i]].common.name, origin: id});
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
        rooms = rooms || [];
        for (var i = 0; i < data.roomEnums.length; i++) {
            if (data.objects[data.roomEnums[i]].common.members.indexOf(id) !== -1 &&
                rooms.indexOf(data.roomEnums[i]) === -1) {
                rooms.push(data.roomEnums[i]);
            }
        }
        return rooms;
    }

    function findFunctionsForObject(data, id, withParentInfo, funcs) {
        funcs = funcs || [];
        for (var i = 0; i < data.funcEnums.length; i++) {
            if (data.objects[data.funcEnums[i]].common.members.indexOf(id) !== -1 &&
                funcs.indexOf(data.objects[data.funcEnums[i]].common.name) === -1) {
                if (!withParentInfo) {
                    funcs.push(data.objects[data.funcEnums[i]].common.name);
                } else {
                    funcs.push({name: data.objects[data.funcEnums[i]].common.name, origin: id});
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
        funcs = funcs || [];
        for (var i = 0; i < data.funcEnums.length; i++) {
            if (data.objects[data.funcEnums[i]].common.members.indexOf(id) !== -1 &&
                funcs.indexOf(data.funcEnums[i]) === -1) {
                funcs.push(data.funcEnums[i]);
            }
        }

        return funcs;
    }

    function clippyCopy(e) {
        var $temp = $('<input>');
        //$('body').append($temp);
        $(this).append($temp);
        $temp.val($(this).parent().data('clippy')).select();
        document.execCommand('copy');
        $temp.remove();
        e.preventDefault();
        e.stopPropagation();
    }

    function clippyShow(e) {
        if ($(this).hasClass('clippy')) {
            var text = '<button class="clippy-button ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only" ' +
                'role="button" title="' + $(this).data('copyToClipboard') + '" ' +
                'style="position: absolute; right: 0; top: 0; width: 36px; height: 18px;z-index: 1">' +
                '<span class="ui-button-icon-primary ui-icon ui-icon-clipboard"></span></button>';

            $(this).append(text);
            $(this).find('.clippy-button').click(clippyCopy);
        }
    }

    function clippyHide(e) {
        $(this).find('.clippy-button').remove();
    }

    function installColResize(data, $dlg) {
        if (data.noColumnResize || !$.fn.colResizable) return;

        var data = $dlg.data('selectId');
        if (data.$tree.is(':visible')) {
            data.$tree.colResizable({
                liveDrag: true,
                onResize: function (event) {
                    syncHeader($dlg);
                }
            });
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
            // if odl format val1:text1;val2:text2
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

    function onQuickEditField(e) {
        var $this   = $(this);
        var id      = $this.data('id');
        var attr    = $this.data('name');
        var data    = $this.data('selectId');
        var type    = $this.data('type');
        var clippy  = $this.hasClass('clippy');
        var options = $this.data('options');
        var oldVal  = $this.data('old-value');
        var states  = null;

        if (clippy)  $this.removeClass('clippy');

        $this.unbind('click').removeClass('select-id-quick-edit').css('position', 'relative');

        var css = 'cursor: pointer; position: absolute;width: 16px; height: 16px; top: 2px; border-radius: 6px; z-index: 3; background-color: lightgray';
        if (type === 'boolean') {
            type = 'checkbox';
        } else {
            type = 'text';
        }
        var text;

        if (attr === 'value') {
            states = getStates(data, id);
            if (states) {
                text = '<select style="width: calc(100% - 50px); z-index: 2">';
                for (var t in states) {
                    if (typeof states[t] !== 'string') continue;
                    text += '<option value="' + t + '">' + states[t] + '</option>';
                }
                text += '</select>';
            }
        } else if (attr === 'room') {
            states = findRoomsForObjectAsIds(data, id) || [];
            text = '<select style="width: calc(100% - 50px); z-index: 2" multiple="multiple">';
            for (var e = 0; e < data.roomEnums.length; e++) {
                text += '<option value="' + data.roomEnums[e] + '" ' + (states.indexOf(data.roomEnums[e]) !== -1 ? 'selected' : '') + '>' + data.objects[data.roomEnums[e]].common.name + '</option>';
            }
            text += '</select>';
        } else if (attr === 'function') {
            states = findFunctionsForObjectAsIds(data, id) || [];
            text = '<select style="width: calc(100% - 50px); z-index: 2" multiple="multiple">';
            for (var e = 0; e < data.funcEnums.length; e++) {
                text += '<option value="' + data.funcEnums[e] + '" ' + (states.indexOf(data.funcEnums[e]) !== -1 ? 'selected' : '') + '>' + data.objects[data.funcEnums[e]].common.name + '</option>';
            }
            text += '</select>';
        } else if (options) {
            if (typeof options === 'function') {
                states = options(id, attr);
            } else {
                states = options;
            }
            if (states) {
                text = '<select style="width: calc(100% - 50px); z-index: 2">';
                for (var t in states) {
                    text += '<option value="' + t + '">' + states[t] + '</option>';
                }
                text += '</select>';
            } else if (states === false) {
                return;
            }
        }
        text = text || '<input style="' + (type !== 'checkbox' ? 'width: 100%;' : '') + ' z-index: 2" type="' + type + '"/>';

        var timeout = null;

        $this.html(text +
            '<div class="ui-icon ui-icon-check        select-id-quick-edit-ok"     style="' + css + ';right: 22px"></div>' +
            '<div class="cancel ui-icon ui-icon-close select-id-quick-edit-cancel" title="' + data.texts.cancel + '" style="' + css + ';right: 2px"></div>');

        var $input = (attr === 'function' || attr === 'room' || states) ? $this.find('select') : $this.find('input');

        if (attr === 'room' || attr === 'function') {
            $input.multiselect({
                autoOpen: true,
                close: function () {
                    $input.trigger('blur');
                }
            });
        } else if (attr === 'role')  {
            $input.autocomplete({
                minLength: 0,
                source: data.roles
            }).on('focus', function () {
                $(this).autocomplete('search', '');
            });
        }

        $this.find('.select-id-quick-edit-cancel').click(function (e)  {
            if (timeout) clearTimeout(timeout);
            timeout = null;
            e.preventDefault();
            e.stopPropagation();
            var old = $this.data('old-value');
            if (old === undefined) old = '';
            $this.html(old).click(onQuickEditField).addClass('select-id-quick-edit');
            if (clippy) $this.addClass('clippy');
        });

        $this.find('.select-id-quick-edit-ok').click(function ()  {
            var _$input = (attr === 'function' || attr === 'room' || states) ? $this.find('select') : $this.find('input');
            _$input.trigger('blur');
        });
        if (type === 'checkbox') {
            $input.prop('checked', oldVal);
        } else {
            if (attr !== 'room' && attr !== 'function') $input.val(oldVal);
        }

        $input.blur(function () {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(function () {
                var _oldText = $this.data('old-value');
                var val = $(this).attr('type') === 'checkbox' ? $(this).prop('checked') : $(this).val();
                if ((attr === 'room' || attr === 'function') && !val) val = [];

                if (attr === 'value' || JSON.stringify(val) !== JSON.stringify(_oldText)) {
                    data.quickEditCallback(id, attr, val, _oldText);

                    _oldText = '<span style="color: pink">' + _oldText + '</span>';
                }
                if (clippy) $this.addClass('clippy');
                $this.html(_oldText).click(onQuickEditField).addClass('select-id-quick-edit');
            }.bind(this), 100);
        }).keyup(function (e) {
            if (e.which == 13) $(this).trigger('blur');
            if (e.which == 27) {
                if (clippy) $this.addClass('clippy');
                var old = $this.data('old-value');
                if (old === undefined) old = '';
                $this.html(old).click(onQuickEditField).addClass('select-id-quick-edit');
            }
        });

        if (typeof e === 'object') {
            e.preventDefault();
            e.stopPropagation();
        }

        setTimeout(function () {
            $input.focus().select();
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

    function initTreeDialog($dlg) {
        var c;
        var data = $dlg.data('selectId');
        //var noStates = (data.objects && !data.states);
        var multiselect = (!data.noDialog && !data.noMultiselect);

        // load expert mode flag
        if (typeof Storage !== 'undefined' && data.name && data.expertModeRegEx) {
            data.expertMode = window.localStorage.getItem(data.name + '-expert');
            data.expertMode = (data.expertMode === true || data.expertMode === 'true');
        }

        // Get all states
        getAllStates(data);

        if (!data.noDialog && !data.buttonsDlg) {
            data.buttonsDlg = [
                {
                    id:   data.instance + '-button-ok',
                    text: data.texts.select,
                    click: function () {
                        var _data = $dlg.data('selectId');
                        if (_data && _data.onSuccess) _data.onSuccess(_data.selectedID, _data.currentId, _data.objects[_data.selectedID]);
                        _data.currentId = _data.selectedID;
                        storeSettings(data);
                        $dlg.dialog('close');
                    }
                },
                {
                    id:   data.instance + '-button-cancel',
                    text: data.texts.cancel,
                    click: function () {
                        storeSettings(data);
                        $(this).dialog('close');
                    }
                }
            ];

            $dlg.dialog({
                autoOpen: false,
                modal:    true,
                width:    '90%',
                close:    function () {
                    storeSettings(data);
                },
                height:   500,
                buttons:  data.buttonsDlg
            });
            if (data.zindex !== null) {
                $('div[aria-describedby="' + $dlg.attr('id') + '"]').css({'z-index': data.zindex})
            }
        }

        // Store current filter
        var filter = {ID: $('#filter_ID_' + data.instance).val()};
        for (var u = 0; u < data.columns.length; u++) {
            var name = data.columns[u];
            if (typeof name === 'object') name = name.name;
            filter[name] = $('#filter_' + name + '_' + data.instance).val();
        }

        var textRooms;
        if (data.columns.indexOf('room') !== -1) {
            textRooms = '<select id="filter_room_' + data.instance + '" class="filter_' + data.instance + '" style="padding: 0; width: 150px"><option value="">' + data.texts.all + '</option>';
            for (var i = 0; i < data.roomEnums.length; i++) {
                textRooms += '<option value="' + data.objects[data.roomEnums[i]].common.name + '">' + data.objects[data.roomEnums[i]].common.name + '</option>';
            }
            textRooms += '</select>';
        } else {
            if (data.rooms)        delete data.rooms;
            if (data.roomsColored) delete data.roomsColored;
        }

        var textFuncs;
        if (data.columns.indexOf('function') !== -1) {
            textFuncs = '<select id="filter_function_' + data.instance + '" class="filter_' + data.instance + '" style="padding: 0; width: 150px"><option value="">' + data.texts.all + '</option>';
            for (var i = 0; i < data.funcEnums.length; i++) {
                textFuncs += '<option value="' + data.objects[data.funcEnums[i]].common.name + '">' + data.objects[data.funcEnums[i]].common.name + '</option>';
            }
            textFuncs += '</select>';
        } else {
            if (data.funcs)        delete data.funcs;
            if (data.funcsColored) delete data.funcsColored;
        }

        var textRoles;
        if (data.columns.indexOf('role') !== -1) {
            textRoles = '<select id="filter_role_' + data.instance + '" class="filter_' + data.instance + '" style="padding:0;width:150px"><option value="">' + data.texts.all + '</option>';
            for (var j = 0; j < data.roles.length; j++) {
                textRoles += '<option value="' + data.roles[j] + '">' + data.roles[j] + '</option>';
            }
            textRoles += '</select>';
        }

        var textTypes;
        if (data.columns.indexOf('type') !== -1) {
            textTypes = '<select id="filter_type_' + data.instance + '" class="filter_' + data.instance + '" style="padding:0;width:150px"><option value="">' + data.texts.all + '</option>';
            for (var k = 0; k < data.types.length; k++) {
                textTypes += '<option value="' + data.types[k] + '">' + data.types[k] + '</option>';
            }
            textTypes += '</select>';
        }

        var text = '<div id="' + data.instance + '-div" style="width:100%; height:100%"><table id="selectID_header_' + data.instance + '" style="width: 100%; padding: 0; height: 50px" cellspacing="0" cellpadding="0">';
        text += '<colgroup>';
        text += '            <col width="1px"/>';
        text += '            <col width="400px"/>';

        for (c = 0; c < data.columns.length; c++) {
            var name = data.columns[c];
            if (typeof name === 'object') name = name.name;
            if (name === 'image') {
                text += '<col width="' + (data.widths ? data.widths[c] : '20px') + '"/>';
            } else if (name === 'name') {
                text += '<col width="' + (data.widths ? data.widths[c] : '*') + '"/>';
            } else if (name === 'type') {
                text += '<col width="' + (data.widths ? data.widths[c] : '150px') + '"/>';
            } else if (name === 'role') {
                text += '<col width="' + (data.widths ? data.widths[c] : '150px') + '"/>';
            } else if (name === 'room') {
                text += '<col width="' + (data.widths ? data.widths[c] : '150px') + '"/>';
            } else if (name === 'function') {
                text += '<col width="' + (data.widths ? data.widths[c] : '150px') + '"/>';
            } else if (name === 'value') {
                text += '<col width="' + (data.widths ? data.widths[c] : '150px') + '"/>';
            } else if (name === 'button') {
                text += '<col width="' + (data.widths ? data.widths[c] : '100px') + '"/>';
            } else if (name === 'enum') {
                text += '<col width="' + (data.widths ? data.widths[c] : '*') + '"/>';
            } else {
                text += '<col width="' + (data.widths ? data.widths[c] : '*') + '"/>';
            }
        }

        text += '            <col width="18px"/>'; // TODO calculate width of scroll bar
        text += '        </colgroup>';
        text += '        <thead>';
        text += '            <tr><th></th><th><table style="width: 100%; padding:0" cellspacing="0" cellpadding="0"><tr>';
        text += '<td><button id="btn_refresh_'  + data.instance + '"></button></td>';
        text += '<td><button id="btn_list_'     + data.instance + '"></button></td>';
        text += '<td><button id="btn_collapse_' + data.instance + '"></button></td>';
        text += '<td><button id="btn_expand_'   + data.instance + '"></button></td><td class="select-id-custom-buttons"></td>';
        if (data.filter && data.filter.type === 'state' && multiselect) {
            text += '<td style="padding-left: 10px"><button id="btn_select_all_' + data.instance + '"></button></td>';
            text += '<td><button id="btn_unselect_all_' + data.instance + '"></button></td>';
            text += '<td><button id="btn_invert_selection_' + data.instance + '"></button></td>';
        }
        if (data.expertModeRegEx) {
            text += '<td style="padding-left: 10px"><button id="btn_expert_' + data.instance + '"></button></td>';
        }

        if (data.panelButtons) {
            text += '<td style="width: 20px">&nbsp;&nbsp;</td>';
            for (c = 0; c < data.panelButtons.length; c++) {
                text += '<td><button id="btn_custom_' + data.instance + '_' + c + '"></button></td>';
            }
        }

        text += '<td class="ui-widget" style="width: 100%; text-align: center; font-weight: bold; font-size: medium">' + data.texts.id + '</td></tr></table></th>';

        for (c = 0; c < data.columns.length; c++) {
            var _name = data.columns[c];
            if (typeof _name === 'object') _name = name.name;
            text += '<th class="ui-widget" style="font-size: medium">' + (data.texts[_name] || '') + '</th>';
        }

        text += '<th></th></tr>';
        text += '        </thead>';
        text += '        <tbody>';
        text += '            <tr><td></td>';
        text += '               <td><table style="width: 100%"><tr><td style="width: 100%"><input style="width: 100%; padding: 0" type="text" id="filter_ID_'    + data.instance + '" class="filter_' + data.instance + '"/></td><td style="vertical-align: top;"><button data-id="filter_ID_'    + data.instance + '" class="filter_btn_' + data.instance + '"></button></td></tr></table></td>';

        for (c = 0; c < data.columns.length; c++) {
            var name = data.columns[c];
            if (typeof name === 'object') name = name.name;
            if (name === 'image') {
                text += '<td></td>';
            } else if (name === 'name' || name === 'value' || name === 'enum') {
                text += '<td><table style="width: 100%"><tr><td style="width: 100%"><input style="width: 100%; padding: 0" type="text" id="filter_' + data.columns[c] + '_'  + data.instance + '" class="filter_' + data.instance + '"/></td><td style="vertical-align: top;"><button data-id="filter_' + data.columns[c] + '_'  + data.instance + '" class="filter_btn_' + data.instance + '"></button></td></tr></table></td>';
            } else if (name === 'type') {
                text += '<td>' + textTypes + '</td>';
            } else if (name== 'role') {
                text += '<td>' + textRoles + '</td>';
            } else if (name === 'room') {
                text += '<td>' + textRooms + '</td>';
            } else if (name === 'function') {
                text += '<td>' + textFuncs + '</td>';
            } else if (name === 'button') {
                text += '<td style="text-align: center">';
                if (data.customButtonFilter) {
                    var t = '<select id="filter_' + name + '_'  + data.instance + '" class="filter_' + data.instance + '">';
                    t += '<option value="">'      + data.texts.all     + '</option>';
                    t += '<option value="true">'  + data.texts.with    + '</option>';
                    t += '<option value="false">' + data.texts.without + '</option>';
                    for (var h = 0; h < data.histories.length; h++) {
                        t += '<option value="' + data.histories[h] + '">' + data.histories[h] + '</option>';
                    }

                    t += '</select>';

                    text += '<table cellpadding="0" cellspacing="0" style="border-spacing: 0 0"><tr><td>' + t + '</td>' + '<td><button id="filter_' + data.columns[c] + '_'  + data.instance + '_btn"></button></td></tr></table>'
                }
                text += '</td>';
            } else {
                text += '<td></td>';
            }
        }

        text += '               <td></td></tr>';
        text += '        </tbody>';
        text += '    </table>';

        //text += '<div style="width: 100%; height: ' + (data.buttons ? 100 : 85) + '%; padding:0; overflow-y: scroll">';
        text += '<div style="width: 100%; height: ' + (data.buttons ? 'calc(100% - 50px)' : 'calc(100% - 50px)') + '; padding:0; overflow-y: scroll">';
        text +=' <table id="selectID_' + data.instance + '" style="width: calc(100% - 5px);padding:0;table-layout:fixed; overflow:hidden;white-space:nowrap" cellspacing="0" cellpadding="0">';
        text += '        <colgroup>';
        text += '            <col width="1px"/>';
        text += '            <col ' + (data.firstMinWidth ? ('width="' + data.firstMinWidth + '"') : 'width="400px"') + '/>';

        for (c = 0; c < data.columns.length; c++) {
            var name = data.columns[c];
            if (typeof name === 'object') name = name.name;
            if (name === 'image') {
                text += '<col width="' + (data.widths ? data.widths[c] : '20px') + '"/>';
            } else if (name === 'name') {
                text += '<col width="' + (data.widths ? data.widths[c] : '*') + '"/>';
            } else if (name === 'type') {
                text += '<col width="' + (data.widths ? data.widths[c] : '150px') + '"/>';
            } else if (name === 'role') {
                text += '<col width="' + (data.widths ? data.widths[c] : '150px') + '"/>';
            } else if (name === 'room') {
                text += '<col width="' + (data.widths ? data.widths[c] : '150px') + '"/>';
            } else if (name === 'function') {
                text += '<col width="' + (data.widths ? data.widths[c] : '150px') + '"/>';
            } else if (name === 'value') {
                text += '<col width="' + (data.widths ? data.widths[c] : '150px') + '"/>';
            } else if (name === 'button') {
                text += '<col width="' + (data.widths ? data.widths[c] : '100px') + '"/>';
            } else if (name === 'enum') {
                text += '<col width="' + (data.widths ? data.widths[c] : '*') + '"/>';
            } else {
                text += '<col width="' + (data.widths ? data.widths[c] : '*') + '"/>';
            }
        }

        text += '        </colgroup>';
        text += '        <thead>';
        text += '            <tr><th></th><th></th>';
        for (c = 0; c < data.columns.length; c++) {
            text += '<th></th>';
        }
        text += '</tr>';
        text += '        </thead>';
        text += '        <tbody>';
        text += '        </tbody>';
        text += '    </table></div><div id="process_running_' + data.instance + '" style="position: absolute; top: 50%; left: 50%; width: 150px; height: 25px; padding: 12px; background: rgba(30, 30, 30, 0.5); display: none; text-align:center; font-size: 1.2em; color: white; font-weight: bold; border-radius: 5px">' + data.texts.wait + '</div>';

        $dlg.html(text);

        data.$tree = $('#selectID_' + data.instance);
        data.$tree[0]._onChange = data.onSuccess || data.onChange;

        var foptions = {
            titlesTabbable: true,     // Add all node titles to TAB chain
            quicksearch:    true,
            source:         data.tree.children,
            extensions:     ["table", "gridnav", "filter", "themeroller"],
            checkbox:       multiselect,
            table: {
                indentation: 20,
                nodeColumnIdx: 1
            },
            gridnav: {
                autofocusInput:   false,
                handleCursorKeys: true
            },
            filter: {
                mode: 'hide',
                autoApply: true
            },
            activate: function (event, data) {
                // A node was activated: display its title:
                // On change
                //var $dlg = $('#' + data.instance + '-dlg');
                if (!multiselect) {
                    var _data = $dlg.data('selectId');
                    var newId = data.node.key;

                    if (_data.onChange) _data.onChange(newId, _data.selectedID, _data.objects[newId]);

                    _data.selectedID = newId;
                    if (!_data.noDialog) {
                        // Set title of dialog box
                        if (_data.objects[newId] && _data.objects[newId].common && _data.objects[newId].common.name) {
                            $dlg.dialog('option', 'title', _data.texts.selectid + ' - ' + (_data.objects[newId].common.name || ' '));
                        } else {
                            $dlg.dialog('option', 'title', _data.texts.selectid + ' - ' + (newId || ' '));
                        }
                        // Enable/ disable "Select" button
                        if (_data.objects[newId]) { // && _data.objects[newId].type === 'state') {
                            $('#' + _data.instance + '-button-ok').removeClass('ui-state-disabled');
                        } else {
                            $('#' + _data.instance + '-button-ok').addClass('ui-state-disabled');
                        }

                    }
                }
            },
            select: function(event, data) {
                var _data = $dlg.data('selectId');
                var newIds = [];
                var selectedNodes = data.tree.getSelectedNodes();
                for	(var i = 0; i < selectedNodes.length; i++) {
                    newIds.push(selectedNodes[i].key);
                }

                if (_data.onChange) _data.onChange(newIds, _data.selectedID);

                _data.selectedID = newIds;

                // Enable/ disable "Select" button
                if (newIds.length > 0) {
                    $('#' + _data.instance + '-button-ok').removeClass('ui-state-disabled');
                } else {
                    $('#' + _data.instance + '-button-ok').addClass('ui-state-disabled');
                }
            },
            renderColumns: function (event, _data) {
                var node = _data.node;
                var $tdList = $(node.tr).find('>td');

                var isCommon = data.objects[node.key] && data.objects[node.key].common;
                var $firstTD = $tdList.eq(1);
                $firstTD.css({'overflow': 'hidden'});
                var base = 2;

                // hide checkbox if only states should be selected
                if (data.filter && data.filter.type === 'state' && (!data.objects[node.key] || data.objects[node.key].type !== 'state')) {
                    $firstTD.find('.fancytree-checkbox').hide();
                }

                // special case for javascript sctipts
                if (data.objects[node.key] && node.key.match(/^script\.js\./)) {
                    if (data.objects[node.key].type !== 'script') {
                        // force folder icon and change color
                        if (node.key !== 'script.js.global') {
                            $firstTD.find('.fancytree-title').css({'font-weight': 'bold', color: '#000080'});
                        } else {
                            $firstTD.find('.fancytree-title').css({'font-weight': 'bold', color: '#078a0c'});
                        }
                        $firstTD.addClass('fancytree-force-folder');
                        //node.hasChildren = function () { return true; };
                    }
                }

                if (!data.noCopyToClipboard) {
                    $firstTD
                        .addClass('clippy')
                        .data('clippy', node.key)
                        .css({position: 'relative'})
                        .data('copyToClipboard', data.texts.copyToClipboard || data.texts.copyTpClipboard)
                        .mouseenter(clippyShow)
                        .mouseleave(clippyHide);
                }

                if (data.useNameAsId && data.objects[node.key] && data.objects[node.key].common && data.objects[node.key].common.name) {
                    $firstTD.find('.fancytree-title').html(data.objects[node.key].common.name);
                }
                var $elem;
                var val;
                for (var c = 0; c < data.columns.length; c++) {
                    var name = data.columns[c];
                    if (typeof name === 'object') name = name.name;
                    if (name === 'image') {
                        var icon = '';
                        var alt = '';
                        var _id_ = 'system.adapter.' + node.key;
                        if (data.objects[_id_] && data.objects[_id_].common && data.objects[_id_].common.icon) {
                            icon = '/adapter/' + data.objects[_id_].common.name + '/' + data.objects[_id_].common.icon;
                        } else
                        if (isCommon) {
                            if (data.objects[node.key].common.icon) {
                                var instance;
                                if (data.objects[node.key].type === 'instance') {
                                    icon = '/adapter/' + data.objects[node.key].common.name + '/' + data.objects[node.key].common.icon;
                                } else if (node.key.match(/^system\.adapter\./)) {
                                    instance = node.key.split('.', 3);
                                    if (data.objects[node.key].common.icon[0] === '/') {
                                        instance[2] += data.objects[node.key].common.icon;
                                    } else {
                                        instance[2] += '/' + data.objects[node.key].common.icon;
                                    }
                                    icon = '/adapter/' + instance[2];
                                } else {
                                    instance = node.key.split('.', 2);
                                    if (data.objects[node.key].common.icon[0] === '/') {
                                        instance[0] += data.objects[node.key].common.icon;
                                    } else {
                                        instance[0] += '/' + data.objects[node.key].common.icon;
                                    }
                                    icon = '/adapter/' + instance[0];
                                }
                            } else if (data.objects[node.key].type === 'device') {
                                icon = data.imgPath + 'device.png';
                                alt  = 'device';
                            } else if (data.objects[node.key].type === 'channel') {
                                icon = data.imgPath + 'channel.png';
                                alt  = 'channel';
                            } else if (data.objects[node.key].type === 'state') {
                                icon = data.imgPath + 'state.png';
                                alt  = 'state';
                            }
                        }
                        if (icon) {
                            $tdList.eq(base).html('<img width="20px" height="20px" src="' + icon + '" alt="' + alt + '"/>');
                        } else {
                            $tdList.eq(base).text('');
                        }
                        base++;
                    } else
                    if (name === 'name') {
                        $elem = $tdList.eq(base);
                        $elem.text(isCommon ? data.objects[node.key].common.name : '').css({overflow: 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis'}).attr('title', isCommon ? data.objects[node.key].common.name : '');
                        if (data.quickEdit && data.objects[node.key] && data.quickEdit.indexOf('name') !== -1) {
                            $elem.data('old-value', isCommon ? data.objects[node.key].common.name : '');
                            $elem.click(onQuickEditField).data('id', node.key).data('name', 'name').data('selectId', data).addClass('select-id-quick-edit');
                        }
                        base++;
                    } else
                    if (name === 'type') {
                        $tdList.eq(base++).text(data.objects[node.key] ? data.objects[node.key].type: '');
                    } else
                    if (name === 'role') {
                        $elem = $tdList.eq(base);
                        val = isCommon ? data.objects[node.key].common.role : '';
                        $elem.text(val);

                        if (data.quickEdit && data.objects[node.key] && data.quickEdit.indexOf('role') !== -1) {
                            $elem.data('old-value', val);
                            $elem.click(onQuickEditField).data('id', node.key).data('name', 'role').data('selectId', data).addClass('select-id-quick-edit');
                        }
                        base++;
                    } else
                    if (name === 'room') {
                        $elem = $tdList.eq(base);
                        // Try to find room
                        if (data.roomsColored) {
                            if (!data.roomsColored[node.key]) data.roomsColored[node.key] = findRoomsForObject(data, node.key, true);
                            val = data.roomsColored[node.key].map(function (e) {return e.name;}).join(', ');
                            if (data.roomsColored[node.key].length && data.roomsColored[node.key][0].origin !== node.key) {
                                $elem.css({color: 'gray'}).attr('title', data.roomsColored[node.key][0].origin);
                            } else {
                                $elem.css({color: 'inherit'}).attr('title', null);
                            }
                        } else {
                            val = '';
                        }
                        $elem.text(val);

                        if (data.quickEdit && data.objects[node.key] && data.quickEdit.indexOf('room') !== -1) {
                            $elem.data('old-value', val);
                            $elem.click(onQuickEditField)
                                .data('id', node.key)
                                .data('name', 'room')
                                .data('selectId', data)
                                .addClass('select-id-quick-edit');
                        }
                        base++;
                    } else
                    if (name === 'function') {
                        $elem = $tdList.eq(base);
                        // Try to find function
                        if (data.funcsColored) {
                            if (!data.funcsColored[node.key]) data.funcsColored[node.key] = findFunctionsForObject(data, node.key, true);
                            val = data.funcsColored[node.key].map(function (e) {return e.name;}).join(', ');
                            if (data.funcsColored[node.key].length && data.funcsColored[node.key][0].origin !== node.key) {
                                $elem.css({color: 'gray'}).attr('title', data.funcsColored[node.key][0].origin);
                            } else {
                                $elem.css({color: 'inherit'}).attr('title', null);
                            }
                        } else {
                            val = '';
                        }
                        $elem.text(val);

                        if (data.quickEdit && data.objects[node.key] && data.quickEdit.indexOf('function') !== -1) {
                            $elem.data('old-value', val);
                            $elem.click(onQuickEditField)
                                .data('id', node.key)
                                .data('name', 'function')
                                .data('selectId', data)
                                .addClass('select-id-quick-edit');
                        }
                        base++;
                    } else
                    if (name === 'value') {
                        $elem = $tdList.eq(base);
                        var common = data.objects[node.key] ? data.objects[node.key].common || {} : {};
                        if (data.states && (data.states[node.key] || data.states[node.key + '.val'] !== undefined)) {
                            var $elem = $tdList.eq(base);
                            var state = data.states[node.key];
                            var states = getStates(data, node.key);
                            if (!state) {
                                state = {
                                    val:  data.states[node.key + '.val'],
                                    ts:   data.states[node.key + '.ts'],
                                    lc:   data.states[node.key + '.lc'],
                                    from: data.states[node.key + '.from'],
                                    ack: (data.states[node.key + '.ack'] === undefined) ? '' : data.states[node.key + '.ack'],
                                    q:   (data.states[node.key + '.q']   === undefined) ? 0  : data.states[node.key + '.q']
                                };
                            } else {
                                state = JSON.parse(JSON.stringify(state));
                            }

                            if (common.role === 'value.time') {
                                state.val = state.val ? (new Date(state.val)).toString() : state.val;
                            }
                            if (states && states[state.val] !== undefined) {
                                state.val = states[state.val]  + '(' + state.val + ')';
                            }

                            var fullVal;
                            if (state.val === undefined) {
                                state.val = '';
                            } else {
                                // if less 2000.01.01 00:00:00
                                if (state.ts < 946681200000)  state.ts *= 1000;
                                if (state.lc < 946681200000)  state.lc *= 1000;

                                if (isCommon && common.unit) state.val += ' ' + common.unit;
                                fullVal  =          data.texts.value   + ': ' + state.val;
                                fullVal += '\x0A' + data.texts.ack     + ': ' + state.ack;
                                fullVal += '\x0A' + data.texts.ts      + ': ' + (state.ts ? formatDate(new Date(state.ts)) : '');
                                fullVal += '\x0A' + data.texts.lc      + ': ' + (state.lc ? formatDate(new Date(state.lc)) : '');
                                fullVal += '\x0A' + data.texts.from    + ': ' + (state.from || '');
                                fullVal += '\x0A' + data.texts.quality + ': ' + quality2text(state.q || 0);
                            }

                            $elem.html('<span class="highlight">' + state.val + '</span>')
                                .attr('title', fullVal)
                                .css({position: 'relative'});

                            $elem.css({color: state.ack ? (state.q ? 'orange' : '') : 'red'});

                            if (!data.noCopyToClipboard && data.objects[node.key] && data.objects[node.key].type === 'state' && common.type !== 'file') {
                                $elem.data('clippy', state.val)
                                    .addClass('clippy')
                                    .data('copyToClipboard', data.texts.copyToClipboard || data.texts.copyTpClipboard)
                                    .mouseenter(clippyShow)
                                    .mouseleave(clippyHide);
                            }

                        } else {
                            $elem.text('')
                                .attr('title', '')
                                .removeClass('clippy');
                        }
                        $elem.dblclick(function (e) {
                            e.preventDefault();
                        });

                        if (data.quickEdit && data.objects[node.key] && data.objects[node.key].type === 'state' && data.quickEdit.indexOf('value') !== -1) {
                            if (!data.objects[node.key].common || data.objects[node.key].common.type !== 'file') {
                                var val = data.states[node.key];
                                val = val ? val.val : '';
                                $elem.data('old-value', val).data('type', common.type || typeof val);

                                $elem.click(onQuickEditField)
                                    .data('id', node.key)
                                    .data('name', 'value')
                                    .data('selectId', data)
                                    .addClass('select-id-quick-edit');
                            }
                        }

                        if (common.type === 'file') {
                            data.webServer = data.webServer || (window.location.protocol + '//' + window.location.hostname + ':8082');

                            // link
                            $elem.html('<a href="' + data.webServer + '/state/' + node.key + '" target="_blank">' + data.webServer + '/state/' + node.key + '</a>')
                                .attr('title', data.texts.linkToFile);
                        }

                        base++;
                    } else
                    if (name === 'button') {
                        // Show buttons
                        var text;
                        if (data.buttons) {
                            if (data.objects[node.key] || data.showButtonsForNotExistingObjects) {
                                text = '';
                                if (data.editEnd) {
                                    text += '<button data-id="' + node.key + '" class="select-button-edit"></button>' +
                                        '<button data-id="' + node.key + '" class="select-button-ok"></button>' +
                                        '<button data-id="' + node.key + '" class="select-button-cancel"></button>';
                                }

                                for (var j = 0; j < data.buttons.length; j++) {
                                    text += '<button data-id="' + node.key + '" class="select-button-' + j + ' select-button-custom"></button>';
                                }

                                $tdList.eq(base).html(text);

                                for (var p = 0; p < data.buttons.length; p++) {
                                    var btn = $('.select-button-' + p + '[data-id="' + node.key + '"]').button(data.buttons[p]).click(function () {
                                        var cb = $(this).data('callback');
                                        if (cb) cb.call($(this), $(this).attr('data-id'));
                                    }).data('callback', data.buttons[p].click).attr('title', data.buttons[p].title || '');
                                    if (data.buttons[p].width) btn.css({width: data.buttons[p].width});
                                    if (data.buttons[p].height) btn.css({height: data.buttons[p].height});
                                    if (data.buttons[p].match) data.buttons[p].match.call(btn, node.key);
                                }
                            } else {
                                $tdList.eq(base).text('');
                            }
                        } else if (data.editEnd) {
                            text = '<button data-id="' + node.key + '" class="select-button-edit"></button>' +
                            '<button data-id="' + node.key + '" class="select-button-ok"></button>' +
                            '<button data-id="' + node.key + '" class="select-button-cancel"></button>';
                        }

                        if (data.editEnd) {
                            $('.select-button-edit[data-id="' + node.key + '"]').button({
                                text: false,
                                icons: {
                                    primary:'ui-icon-pencil'
                                }
                            }).click(function () {
                                $(this).data('node').editStart();
                            }).attr('title', data.texts.edit).data('node', node).css({width: 26, height: 20});

                            $('.select-button-ok[data-id="' + node.key + '"]').button({
                                text: false,
                                icons: {
                                    primary:'ui-icon-check'
                                }
                            }).click(function () {
                                var node = $(this).data('node');
                                node.editFinished = true;
                                node.editEnd(true);
                            }).attr('title', data.texts.ok).data('node', node).hide().css({width: 26, height: 20});

                             $('.select-button-cancel[data-id="' + node.key + '"]').button({
                                text: false,
                                icons: {
                                    primary:'ui-icon-close'
                                }
                            }).click(function () {
                                var node = $(this).data('node');
                                node.editFinished = true;
                                node.editEnd(false);
                            }).attr('title', data.texts.cancel).data('node', node).hide().css({width: 26, height: 20});
                        }

                        base++;
                    } else
                    if (name === 'enum') {
                        if (isCommon && data.objects[node.key].common.members && data.objects[node.key].common.members.length > 0) {
                            if (data.objects[node.key].common.members.length < 4) {
                                $tdList.eq(base).text('(' + data.objects[node.key].common.members.length + ')' + data.objects[node.key].common.members.join(', '));
                            } else {
                                $tdList.eq(base).text(data.objects[node.key].common.members.length);
                            }
                            $tdList.eq(base).attr('title', data.objects[node.key].common.members.join('\x0A'));
                        } else {
                            $tdList.eq(base).text('');
                            $tdList.eq(base).attr('title', '');
                        }
                        base++;
                    } else
                    if (typeof data.columns[c].data === 'function') {
                        $elem = $tdList.eq(base);
                        var val = data.columns[c].data(node.key, data.columns[c].name);
                        var title = '';
                        if (data.columns[c].title) title = data.columns[c].title(node.key, data.columns[c].name);
                        $elem.html(val).attr('title', title);
                        if (data.quickEdit && data.objects[node.key]) {
                            for (var q = 0; q < data.quickEdit.length; q++) {
                                if (data.quickEdit[q] === data.columns[c].name ||
                                    data.quickEdit[q].name === data.columns[c].name) {
                                    $elem.data('old-value', val).data('type', typeof val);

                                    $elem.click(onQuickEditField)
                                        .data('id', node.key)
                                        .data('name', data.columns[c].name)
                                        .data('selectId', data)
                                        .data('options', data.quickEdit[q].options)
                                        .addClass('select-id-quick-edit');

                                    break;
                                }
                            }
                        }
                        base++;
                    }
                }
            },
            dblclick: function (event, _data) {
                if (data.buttonsDlg && !data.quickEditCallback) {
                    if (_data && _data.node && !_data.node.folder) {
                        data.buttonsDlg[0].click();
                    }
                } else if (data.dblclick) {
                    var tree = data.$tree.fancytree('getTree');

                    var node = tree.getActiveNode();
                    if (node) {
                        data.dblclick(node.key);
                    }
                }
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
                    $('.select-button-edit[data-id="' + _data.node.key + '"]').hide();
                    $('.select-button-cancel[data-id="' + _data.node.key + '"]').show();
                    $('.select-button-ok[data-id="' + _data.node.key + '"]').show();
                    $('.select-button-custom[data-id="' + _data.node.key + '"]').hide();

                    var node = _data.node;
                    var $tdList = $(node.tr).find('>td');
                    // Editor was opened (available as data.input)
                    var inputs = {id: _data.input};

                    for (var c = 0; c < data.columns.length; c++) {
                        var name = data.columns[c];
                        if (typeof name === 'object') name = name.name;

                        if (name === 'name') {
                            $tdList.eq(2 + c).html('<input type="text" id="select_edit_' + name + '" value="' + data.objects[_data.node.key].common[name] + '" style="width: 100%"/>');
                            inputs[name] = $('#select_edit_' + name);
                        }
                    }
                    for (var i in inputs) {
                        inputs[i].keyup(function (e) {
                            var node;
                            if (e.which == 13) {
                                // end edit
                                node = $(this).data('node');
                                node.editFinished = true;
                                node.editEnd(true);
                            } else if (e.which == 27) {
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

                    for (var c = 0; c < data.columns.length; c++) {
                        var name = data.columns[c];
                        if (typeof name === 'object') name = name.name;
                        if (name === 'name') {
                            editValues[name] = $('#select_edit_' + name).val();
                        }
                    }

                    // Save data.input.val() or return false to keep editor open
                    if (data.editEnd) data.editEnd(_data.node.key, editValues);
                    _data.node.render(true);

                    // We return true, so ext-edit will set the current user input
                    // as title
                    return true;
                },
                close: function (event, _data) {
                    $('.select-button-edit[data-id="' + _data.node.key + '"]').show();
                    $('.select-button-cancel[data-id="' + _data.node.key + '"]').hide();
                    $('.select-button-ok[data-id="' + _data.node.key + '"]').hide();
                    $('.select-button-custom[data-id="' + _data.node.key + '"]').show();
                    if (_data.node.editFinished !== undefined) delete _data.node.editFinished;
                    // Editor was removed
                    if (data.save) {
                        // Since we started an async request, mark the node as preliminary
                        $(data.node.span).addClass('pending');
                    }
                }
            };
        }

        data.$tree.fancytree(foptions).on('nodeCommand', function (event, data) {
            // Custom event handler that is triggered by keydown-handler and
            // context menu:
            var refNode;
            var tree = $(this).fancytree('getTree');
            var node = tree.getActiveNode();

            switch (data.cmd) {
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
                    alert('Unhandled command: ' + data.cmd);
                    return;
            }

        }).on('keydown', function (e) {
            var c   = String.fromCharCode(e.which);
            var cmd = null;

            if (e.which === 'c' && e.ctrlKey) {
                cmd = 'copy';
            }else if (e.which === $.ui.keyCode.UP && e.ctrlKey) {
                cmd = 'moveUp';
            } else if (e.which === $.ui.keyCode.DOWN && e.ctrlKey) {
                cmd = 'moveDown';
            } else if (e.which === $.ui.keyCode.RIGHT && e.ctrlKey) {
                cmd = 'indent';
            } else if (e.which === $.ui.keyCode.LEFT && e.ctrlKey) {
                cmd = 'outdent';
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
                var value = $('#filter_ID_' + data.instance).val().toLowerCase();
                if (value) {
                    data.filterVals.ID = value;
                    data.filterVals.length++;
                }

                for (var c = 0; c < data.columns.length; c++) {
                    var name = data.columns[c];
                    if (typeof name === 'object') name = name.name;
                    if (name === 'image') {
                        //continue;
                    } else if (name === 'role' || name === 'type' || name === 'room' || name === 'function') {
                        value = $('#filter_' + name + '_' + data.instance).val();
                        if (value) {
                            data.filterVals[name] = value;
                            data.filterVals.length++;
                        }
                    } else {
                        value = $('#filter_' + name + '_' + data.instance).val();
                        if (value) {
                            value = value.toLowerCase();
                            data.filterVals[name] = value;
                            data.filterVals.length++;
                        }
                    }
                }
                // if no clear "close" event => store on change
                if (data.noDialog) storeSettings(data);
            }

            var isCommon = null;

            for (var f in data.filterVals) {
                if (f === 'length') continue;

                if (isCommon === null) isCommon = data.objects[node.key] && data.objects[node.key].common;

                if (f === 'ID') {
                    if (node.key.toLowerCase().indexOf(data.filterVals[f]) === -1) return false;
                } else
                if (f === 'name' || f === 'enum') {
                    if (!isCommon || data.objects[node.key].common[f] === undefined || data.objects[node.key].common[f].toLowerCase().indexOf(data.filterVals[f]) === -1) return false;
                } else
                if (f === 'role') {
                    if (!isCommon || data.objects[node.key].common[f] === undefined || data.objects[node.key].common[f].indexOf(data.filterVals[f]) === -1) return false;
                } else
                if (f === 'type') {
                    if (!data.objects[node.key] || data.objects[node.key][f] === undefined || data.objects[node.key][f] !== data.filterVals[f]) return false;
                } else
                if (f === 'value') {
                    if (!data.states[node.key] || data.states[node.key].val === undefined || data.states[node.key].val === null || data.states[node.key].val.toString().toLowerCase().indexOf(data.filterVals[f]) === -1) return false;
                } else
                if (f === 'button') {
                    if (data.filterVals[f] === 'true') {
                        if (!isCommon || !data.objects[node.key].common.custom || data.objects[node.key].common.custom.enabled === false) return false;
                    } else if (data.filterVals[f] === 'false') {
                        if (!isCommon || data.objects[node.key].type !== 'state' || data.objects[node.key].common.custom) return false;
                    } else if (data.filterVals[f]) {
                        if (!isCommon || !data.objects[node.key].common.custom || !data.objects[node.key].common.custom[data.filterVals[f]]) return false;
                    }
                } else
                if (f === 'room') {
                    if (!data.objects[node.key]) return false;

                    // Try to find room
                    if (!data.rooms[node.key]) data.rooms[node.key] = findRoomsForObject(data, node.key);
                    if (data.rooms[node.key].indexOf(data.filterVals[f]) === -1) return false;
                } else
                if (f === 'function') {
                    if (!data.objects[node.key]) return false;

                    // Try to find functions
                    if (!data.funcs[node.key]) data.funcs[node.key] = findFunctionsForObject(data, node.key);
                    if (data.funcs[node.key].indexOf(data.filterVals[f]) === -1) return false;
                }
            }

            return true;
        }

        $('.filter_' + data.instance).change(function () {
            data.filterVals = null;
            $('#process_running_' + data.instance).show();
            data.$tree.fancytree('getTree').filterNodes(customFilter, false);
            $('#process_running_' + data.instance).hide();
        }).keyup(function () {
            var tree = data.$tree[0];
            if (tree._timer) tree._timer = clearTimeout(tree._timer);
            
            var that = this;
            tree._timer = setTimeout(function () {
                $(that).trigger('change');
            }, 200);
        });

        $('.filter_btn_' + data.instance).button({icons: {primary: 'ui-icon-close'}, text: false}).css({width: 18, height: 18}).click(function () {
            $('#' + $(this).attr('data-id')).val('').trigger('change');
        });

        $('#btn_collapse_' + data.instance).button({icons: {primary: 'ui-icon-folder-collapsed'}, text: false}).css({width: 18, height: 18}).click(function () {
            $('#process_running_' + data.instance).show();
            setTimeout(function () {
                data.$tree.fancytree('getRootNode').visit(function (node) {
                    if (!data.filterVals.length || node.match || node.subMatch) node.setExpanded(false);
                });
                $('#process_running_' + data.instance).hide();
            }, 100);
        }).attr('title', data.texts.collapse);

        $('#btn_expand_' + data.instance).button({icons: {primary: 'ui-icon-folder-open'}, text: false}).css({width: 18, height: 18}).click(function () {
            $('#process_running_' + data.instance).show();
            setTimeout(function () {
                data.$tree.fancytree('getRootNode').visit(function (node) {
                    if (!data.filterVals.length || node.match || node.subMatch)
                        node.setExpanded(true);
                });
                $('#process_running_' + data.instance).hide();
            }, 100);
        }).attr('title', data.texts.expand);

        $('#btn_list_' + data.instance).button({icons: {primary: 'ui-icon-grip-dotted-horizontal'}, text: false}).css({width: 18, height: 18}).click(function () {
            $('#process_running_' + data.instance).show();
            data.list = !data.list;
            if (data.list) {
                $('#btn_list_' + data.instance).addClass('ui-state-error');
                $('#btn_expand_' + data.instance).hide();
                $('#btn_collapse_' + data.instance).hide();
                $(this).attr('title', data.texts.list);
            } else {
                $('#btn_list_' + data.instance).removeClass('ui-state-error');
                $('#btn_expand_' + data.instance).show();
                $('#btn_collapse_' + data.instance).show();
                $(this).attr('title', data.texts.tree);
            }
            $('#process_running_' + data.instance).show();
            setTimeout(function () {
                data.inited = false;
                initTreeDialog(data.$dlg);
                $('#process_running_' + data.instance).hide();
            }, 200);
        }).attr('title', data.texts.tree);

        if (data.list) {
            $('#btn_list_' + data.instance).addClass('ui-state-error');
            $('#btn_expand_' + data.instance).hide();
            $('#btn_collapse_' + data.instance).hide();
            $('#btn_list_' + data.instance).attr('title', data.texts.list);
        }

        $('#btn_refresh_' + data.instance).button({icons: {primary: 'ui-icon-refresh'}, text: false}).css({width: 18, height: 18}).click(function () {
            $('#process_running_' + data.instance).show();
            setTimeout(function () {
                data.inited = false;
                initTreeDialog(data.$dlg);
                $('#process_running_' + data.instance).hide();
            }, 100);
        }).attr('title', data.texts.refresh);

        $('#btn_select_all_' + data.instance).button({icons: {primary: 'ui-icon-circle-check'}, text: false}).css({width: 18, height: 18}).click(function () {
            $('#process_running_' + data.instance).show();
            setTimeout(function () {
                data.$tree.fancytree('getRootNode').visit(function (node) {
                    if (!data.filterVals.length || node.match || node.subMatch) {
                        // hide checkbox if only states should be selected
                        if (data.objects[node.key] && data.objects[node.key].type === 'state') {
                            node.setSelected(true);
                        }
                    }
                });
                $('#process_running_' + data.instance).hide();
            }, 100);
        }).attr('title', data.texts.selectAll);

        if (data.expertModeRegEx) {
            $('#btn_expert_' + data.instance).button({icons: {primary: 'ui-icon-person'}, text: false}).css({width: 18, height: 18}).click(function () {
                $('#process_running_' + data.instance).show();

                data.expertMode = !data.expertMode;
                if (data.expertMode) {
                    $('#btn_expert_' + data.instance).addClass('ui-state-error');
                } else {
                    $('#btn_expert_' + data.instance).removeClass('ui-state-error');
                }
                storeSettings(data, true);

                setTimeout(function () {
                    data.inited = false;
                    initTreeDialog(data.$dlg);
                    $('#process_running_' + data.instance).hide();
                }, 200);
            }).attr('title', data.texts.expertMode);

            if (data.expertMode) $('#btn_expert_' + data.instance).addClass('ui-state-error');
        }

        $('#btn_unselect_all_' + data.instance).button({icons: {primary: 'ui-icon-circle-close'}, text: false}).css({width: 18, height: 18}).click(function () {
            $('#process_running_' + data.instance).show();
            setTimeout(function () {
                data.$tree.fancytree('getRootNode').visit(function (node) {
                    node.setSelected(false);
                });
                $('#process_running_' + data.instance).hide();
            }, 100);
        }).attr('title', data.texts.unselectAll);

        $('#btn_invert_selection_' + data.instance).button({icons: {primary: 'ui-icon-transferthick-e-w'}, text: false}).css({width: 18, height: 18}).click(function () {
            $('#process_running_' + data.instance).show();
            setTimeout(function () {
                data.$tree.fancytree('getRootNode').visit(function (node) {
                    if (!data.filterVals.length || node.match || node.subMatch){
                        if (data.objects[node.key] && data.objects[node.key].type === 'state') {
                            node.toggleSelected();
                        }
                    }
                });
                $('#process_running_' + data.instance).hide();
            }, 100);
        }).attr('title', data.texts.invertSelection);

        for (var f in filter) {
            try {
                if (f) $('#filter_' + f + '_' + data.instance).val(filter[f]).trigger('change');
            } catch (err) {
                console.error('Cannot apply filter: ' + err)
            }
        }

        if (data.panelButtons) {
            for (var z = 0; z < data.panelButtons.length; z++) {
                $('#btn_custom_' + data.instance + '_' + z).button(data.panelButtons[z]).css({width: 18, height: 18}).click(data.panelButtons[z].click).attr('title', data.panelButtons[z].title || '');
                text += '<td><button id="btn_custom_' + data.instance + '_' + z + '"></button></td>';
            }
        }

        if (data.customButtonFilter) {
            $('#filter_button_' + data.instance + '_btn').button(data.customButtonFilter).css({width: 18, height: 18}).click(data.customButtonFilter.callback);
        }

        showActive($dlg);
        loadSettings(data);
        installColResize(data, $dlg);

        // set preset filters
        for (var field in data.filterPresets) {
            if (!data.filterPresets[field]) continue;
            if (typeof data.filterPresets[field] === 'object') {
                $('#filter_' + field + '_' + data.instance).val(data.filterPresets[field][0]).trigger('change');
            } else {
                $('#filter_' + field + '_' + data.instance).val(data.filterPresets[field]).trigger('change');
            }
        }
    }

    function storeSettings(data, force) {
        if (typeof Storage === 'undefined' || !data.name) return;

        if (data.timer) clearTimeout(data.timer);

        if (force) {
            window.localStorage.setItem(data.name + '-filter', JSON.stringify(data.filterVals));
            window.localStorage.setItem(data.name + '-expert', JSON.stringify(data.expertMode));
            data.timer = null;
        } else {
            data.timer = setTimeout(function () {
                window.localStorage.setItem(data.name + '-filter', JSON.stringify(data.filterVals));
                window.localStorage.setItem(data.name + '-expert', JSON.stringify(data.expertMode));
            }, 500);
        }
    }

    function loadSettings(data) {
        if (typeof Storage !== 'undefined' && data.name) {
            var f = window.localStorage.getItem(data.name + '-filter');
            if (f) {
                try{
                    f = JSON.parse(f);
                    for (var field in f) {
                        if (field === 'length') continue;
                        if (data.filterPresets[field]) continue;
                        $('#filter_' + field + '_' + data.instance).val(f[field]).trigger('change');
                    }
                } catch(e) {
                    console.error('Cannot parse settings: ' + e);
                }
            } else if (!data.filter) {
                // set default filter: state
                $('#filter_type_' + data.instance).val('state').trigger('change');
            }
        }
    }

    var methods = {
        init: function (options) {
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
                columns: ['image', 'name', 'type', 'role', 'enum', 'room', 'function', 'value', 'button']
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
                wait:     'Processing...',
                list:     'Show list view',
                tree:     'Show tree view',
                selectAll: 'Select all',
                unselectAll: 'Unselect all',
                invertSelection: 'Invert selection',
                copyToClipboard: 'Copy to clipboard'
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
                        instance:           instance++,
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
                        if (!$('#select-id-dialog').length) {
                            $('body').append('<div id="select-id-dialog"><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 50px 0;"></span><span>' + (data.texts.noconnection || 'No connection to server') + '</span></div>');
                        }
                        $('#select-id-dialog').dialog({
                            modal: true
                        });
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
                        var tree = data.$tree.fancytree('getTree');
                        tree.visit(function (node) {
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
                    data.$tree = $('#selectID_' + data.instance);
                    if (data.$tree[0]) data.$tree[0]._onSuccess = data.onSuccess;
                }
                data.selectedID = data.currentId;

                if (!data.inited || !data.noDialog) {
                    data.$dlg = $dlg;
                    initTreeDialog($dlg);
                } else {
                    if (data.selectedID) {
                        var tree = data.$tree.fancytree('getTree');
                        tree.visit(function (node) {
                            if (node.key === data.selectedID) {
                                node.setActive();
                                node.makeVisible({scrollIntoView: false});
                                return false;
                            }
                        });
                    }
                }
                if (!data.noDialog) {
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
                var node = null;
                tree.visit(function (n) {
                    if (n.key === id) {
                        node = n;
                        return false;
                    }
                });
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
                var dlg = this[i];
                var $dlg = $(dlg);
                $dlg.data('selectId', null);
                $('#' + data.instance + '-div')[0].innerHTML('');
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
                if (data.states[id] &&
                    state &&
                    data.states[id].val  === state.val  &&
                    data.states[id].ack  === state.ack  &&
                    data.states[id].q    === state.q    &&
                    data.states[id].from === state.from &&
                    data.states[id].ts   === state.ts
                    ) return;

                data.states[id] = state;
                var tree = data.$tree.fancytree('getTree');
                var node = null;
                tree.visit(function (n) {
                    if (n.key === id) {
                        node = n;
                        return false;
                    }
                });
                if (node) node.render(true);
            }
            return this;
        },
        // update objects
        object: function (id, obj) {
            for (var k = 0; k < this.length; k++) {
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
                var node = null;
                tree.visit(function (n) {
                    if (n.key === id) {
                        node = n;
                        return false;
                    }
                });

                // If new node
                if (!node && obj) {
                    // Filter it

                    data.objects[id] = obj;
                    var addedNodes = [];

                    if (!filterId(data, id)) return;

                    treeInsert(data, id, false, addedNodes);

                    for (var i = 0; i < addedNodes.length; i++) {
                        if (!addedNodes[i].parent.root) {
                            tree.visit(function (n) {
                                if (n.key === addedNodes[i].parent.key) {
                                    node = n;
                                    return false;
                                }
                            });

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
                    // object deleted
                    delete data.objects[id];
                    deleteTree(data, id);
                    if (node) {
                        if (node.children && node.children.length) {
                            if (node.children.length === 1) {
                                node.folder = false;
                                node.expanded = false;
                            }
                            node.render(true);
                        } else {
                            if (node.parent && node.parent.children.length === 1) {
                                node.parent.folder = false;
                                node.parent.expanded = false;
                                node.parent.render(true);
                            }
                            node.remove();
                        }
                    }
                } else {
                    // object updated
                    if (node) node.render(true);
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
                    if (n.match) nodes.push(n.key);
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
