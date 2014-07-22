(function ($) {
$(document).ready(function () {

    var toplevel = [];
    var children = {};
    var objects = {};

    $('#tabs').tabs();
    $('#tabs ul.ui-tabs-nav').prepend('<li class="header">ioBroker</li>');

    var $dialogObject = $('#dialog-object');
    $dialogObject.dialog({
        autoOpen:   false,
        modal:      true,
        width: 640,
        height: 480,
        buttons: [
            {
                text: 'Save',
                click: saveObject
            },
            {
                text: 'Cancel',
                click: function () {
                    $dialogObject.dialog('close');
                    $('#json-object').val('');
                }
            }
        ]
    });

    var $gridObjects = $('#grid-objects');
    $gridObjects.jqGrid({
        datatype: 'local',
        colNames:['id','name', 'type'],
        colModel :[
            {name:'_id', index:'_id', width: 450, fixed: true},
            {name:'name', index:'name'},
            {name:'type', index:'type', width: 120, fixed: true,
                //formatter:'select',
                stype: 'select',
                searchoptions: {
                    sopt: ['eq'], value: ":All;device:device;channel:channel;state:state;enum:enum;host:host;adapter:adapter;meta:meta;path:path;config:config"
                }
            }
        ],
        pager: $('#pager-objects'),
        rowNum: 100,
        rowList: [20,50,100],
        sortname: "id",
        sortorder: "desc",
        viewrecords: true,
        caption: 'ioBroker Objects',
        subGrid: true,
        subGridRowExpanded: function (grid, row) {
            subGridObjects(grid, row, 1);
        },
        afterInsertRow: function (rowid) {
            // Remove icon and click handler if no children available
            if (!children[rowid.slice(7)]) {
                $('td.sgcollapsed', '[id="' + rowid + '"').empty().removeClass('ui-sgcollapsed sgcollapsed');
            }
        },
        onSelectRow: function (rowid, e) {
            // unselect other subgrids but not myself
            $('[id^="grid-objects"][id$="_t"]').not('[id="' + this.id + '"]').jqGrid('resetSelection');
            $('#del-object').removeClass('ui-state-disabled');
            $('#edit-object').removeClass('ui-state-disabled');
        },
        gridComplete: function () {
            $('#del-object').addClass('ui-state-disabled');
            $('#edit-object').addClass('ui-state-disabled');
        },
        subGridRowColapsed: function (grid, id) {
            var objSelected = $gridObjects.jqGrid('getGridParam', 'selrow');
            if (!objSelected) {
                $('[id^="grid-objects"][id$="_t"]').not('[id="' + grid + '_t"]').each(function () {
                    if ($(this).jqGrid('getGridParam','selrow')) {
                        objSelected = $(this).jqGrid('getGridParam', 'selrow');
                    }
                });
            }
            if (!objSelected) {
                $('#del-object').addClass('ui-state-disabled');
                $('#edit-object').addClass('ui-state-disabled');
            }
            return true;
        }
    }).jqGrid('filterToolbar', {
        defaultSearch: 'cn',
        autosearch: true,
        searchOnEnter: false,
        enableClear: false
    }).navGrid('#pager-objects', {
        search: false,
        edit: false,
        add: false,
        del: false,
        refresh: false
    }).jqGrid('navButtonAdd', '#pager-objects', {
        caption: '',
        buttonicon: 'ui-icon-trash',
        onClickButton: function () {
            var objSelected = $gridObjects.jqGrid('getGridParam','selrow');
            if (!objSelected) {
                $('[id^="grid-objects"][id$="_t"]').each(function () {
                    if ($(this).jqGrid('getGridParam','selrow')) {
                        objSelected = $(this).jqGrid('getGridParam','selrow');
                    }
                });
            }
            alert('TODO delete ' + objSelected.slice(7)); //TODO
        },
        position: 'first',
        id: 'del-object',
        title: 'Object löschen',
        cursor: 'pointer'
    }).jqGrid('navButtonAdd', '#pager-objects', {
        caption: '',
        buttonicon: 'ui-icon-pencil',
        onClickButton: function () {
            var objSelected = $gridObjects.jqGrid('getGridParam','selrow');
            if (!objSelected) {
                $('[id^="grid-objects"][id$="_t"]').each(function () {
                    if ($(this).jqGrid('getGridParam','selrow')) {
                        objSelected = $(this).jqGrid('getGridParam','selrow');
                    }
                });
            }
            editObject(objSelected.slice(7));
        },
        position: 'first',
        id: 'edit-object',
        title: 'Object bearbeiten',
        cursor: 'pointer'
    }).jqGrid('navButtonAdd', '#pager-objects', {
        caption: '',
        buttonicon: 'ui-icon-plus',
        onClickButton: function () {
            alert('TODO add object'); //TODO
        },
        position: 'first',
        id: 'add-object',
        title: 'neues Objekt',
        cursor: 'pointer'
    });

    function subGridObjects(grid, row, level) {
        var id = row.slice(7);
        var subgridTableId = grid + '_t';
        $('[id="' + grid + '"]').html('<table class="subgrid-level-' + level + '" id="' + subgridTableId + '"></table>');
        var $subgrid = $('table[id="' + subgridTableId + '"]');
        var gridConf = {
            datatype: 'local',
            colNames:['id','name', 'type'],
            colModel :[
                {name:'_id', index:'_id', width: 450 - (level * 27), fixed: true},
                {name:'name', index:'name'},
                {name:'type', index:'type', width: 120 - (level * 2), fixed: true}
            ],
            rowNum: 1000000,
            autowidth: true,
            height: 'auto',
            width: 1200,
            //sortname: '_id',
            //sortorder: 'desc',
            viewrecords: true,
            sortorder: 'desc',
            ignoreCase: true,
            subGrid: true,
            subGridRowExpanded: function (grid, row) {
                subGridObjects(grid, row, level + 1);
            },
            subGridRowColapsed: function (grid, id) {
                // Check if there is still a row selected
                var objSelected = $gridObjects.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').not('[id="' + grid + '_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam','selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                // Disable buttons if no row is selected
                if (!objSelected) {
                    $('#del-object').addClass('ui-state-disabled');
                    $('#edit-object').addClass('ui-state-disabled');
                }
                return true;
            },
            afterInsertRow: function (rowid) {
                // Remove icon and click handler if no children available
                if (!children[rowid.slice(7)]) {
                    $('td.sgcollapsed', '[id="' + rowid + '"').empty().removeClass('ui-sgcollapsed sgcollapsed');
                }
            },
            gridComplete: function () {
                // Hide header
                $subgrid.parent().parent().parent().find('table.ui-jqgrid-htable').hide();
            },
            onSelectRow: function (rowid, e) {
                // unselect other subgrids but not myself
                $('[id^="grid-objects"][id$="_t"]').not('[id="' + this.id + '"]').jqGrid('resetSelection');

                // unselect objects grid
                $gridObjects.jqGrid('resetSelection');

                // enable buttons
                $('#del-object').removeClass('ui-state-disabled');
                $('#edit-object').removeClass('ui-state-disabled');
            }
        };
        $subgrid.jqGrid(gridConf);

        for (var i = 0; i < children[id].length; i++) {
            $subgrid.jqGrid('addRowData', 'object_' + objects[children[id][i]]._id, objects[children[id][i]]);
        }
        $subgrid.trigger('reloadGrid');
    }

    var stateEdit = false;
    var stateLastSelected;

    var $gridStates = $('#grid-states');
    $gridStates.jqGrid({
        datatype: 'local',
        colNames:['id', 'name', 'val', 'ack', 'ts', 'lc'],
        colModel :[
            {name:'_id', index:'_id', width: 475, fixed: true},
            {name:'name', index:'name', width: 200, fixed: false},
            {name:'val', index:'ack', width: 160, editable: true},
            {name:'ack', index:'ack', width: 80, fixed: false, editable: true, edittype: 'checkbox', editoptions: {value: "true:false"}},
            {name:'ts', index:'ts', width: 138, fixed: false},
            {name:'lc', index:'lc', width: 138, fixed: false}
        ],
        pager: $('#pager-states'),
        rowNum: 100,
        rowList: [20,50,100],
        sortname: "id",
        sortorder: "desc",
        viewrecords: true,
        caption: 'ioBroker States',
        onSelectRow: function (id) {
            var rowData = $gridStates.jqGrid('getRowData', id);
            rowData.ack = false;
            $gridStates.jqGrid('setRowData', id, rowData);

            if (id && id !== stateLastSelected) {
                $gridStates.restoreRow(stateLastSelected);
                stateLastSelected = id;
            }
            $gridStates.editRow(id, true, function () {
                // onEdit
                stateEdit = true;
            }, function (obj) {
                // success
            }, "clientArray", null, function () {
                // afterSave
                stateEdit = false;
                var val = $gridStates.jqGrid("getCell", stateLastSelected, "val");
                if (val === 'true') val = true;
                if (val === 'false') val = false;
                if (parseFloat(val) == val) val = parseFloat(val);
                var ack = $gridStates.jqGrid("getCell", stateLastSelected, "ack");
                if (ack === 'true') ack = true;
                if (ack === 'false') ack = false;
                var id = stateLastSelected.slice(6);
                socket.emit('setState', id, {val:val, ack:ack});
            });
        }
    }).jqGrid('filterToolbar', {
        defaultSearch: 'cn',
        autosearch: true,
        searchOnEnter: false,
        enableClear: false
    });

    function getObjects(callback) {
        $gridObjects.jqGrid('clearGridData');
        socket.emit('getObjects', function (err, res) {
            objects = res;
            for (var id in objects) {
                if (id.slice(0, 7) === '_design') continue;
                var obj = objects[id];
                if (obj.parent) {
                    if (!children[obj.parent]) children[obj.parent] = [];
                    children[obj.parent].push(id);
                } else {
                    toplevel.push(id);
                }
            }
            for (var i = 0; i < toplevel.length; i++) {
                $gridObjects.jqGrid('addRowData', 'object_' + toplevel[i], objects[toplevel[i]]);
            }
            $gridObjects.trigger('reloadGrid');
            if (typeof callback === 'function') callback();
        });
    }

    function getStates(callback) {
        $gridStates.jqGrid('clearGridData');
        socket.emit('getStates', function (err, res) {
            var i = 0;
            for (var key in res) {
                var obj = res[key];
                obj._id = key;
                obj.name = objects[obj._id] ? objects[obj._id].name : '';
                obj.type = objects[obj._id] && objects[obj._id].common ? objects[obj._id].common.type : '';
                if (obj.ts) obj.ts = formatDate(new Date(obj.ts * 1000));
                if (obj.lc) obj.lc = formatDate(new Date(obj.lc * 1000));
                $gridStates.jqGrid('addRowData', 'state_' + key, obj);
            }
            $gridStates.trigger('reloadGrid');
            if (typeof callback === 'function') callback();
        });
    }

    function editObject(id) {
        var obj = objects[id];
        $dialogObject.dialog('option', 'title', id);
        $('#edit-object-id').val(obj._id);
        $('#edit-object-parent-old').val(obj.parent);
        $('#edit-object-name').val(obj.name);
        $('#edit-object-type').val(obj.type);
        $('#edit-object-parent').val(obj.parent);
        $('#edit-object-common').val(JSON.stringify(obj.common, null, '  '));
        $('#edit-object-native').val(JSON.stringify(obj.native, null, '  '));
        $dialogObject.dialog('open');
    }

    function saveObject() {

    }

    var socket = io.connect();

    socket.on('stateChange', function (id, obj) {

        // Update gridStates
        var rowData = $gridStates.jqGrid('getRowData', 'state_' + id);
        rowData.val = obj.val;
        rowData.ack = obj.ack;
        if (obj.ts) rowData.ts = formatDate(new Date(obj.ts * 1000));
        if (obj.lc) rowData.lc = formatDate(new Date(obj.lc * 1000));
        $gridStates.jqGrid('setRowData', 'state_' + id, rowData);

        // prepend to Event-Table
        $('#events').prepend('<tr><td>stateChange</td><td>' + id + '</td><td>' + JSON.stringify(obj) + '</td></tr>');

    });

    socket.on('objectChange', function (id, obj) {
        var row = '<tr><td>objectChange</td><td>' + id + '</td><td>' + JSON.stringify(obj) + '</td></tr>';
        $('#events').prepend(row);
        // TODO insert/update/delete object in gridObjects
    });

    var firstConnect = true;
    socket.on('connect', function () {
        if (firstConnect) {
            firstConnect = false;
            // Here we go!
            $("#load_grid-objects").show();
            $("#load_grid-states").show();
            getObjects(getStates);
        }
    });

    function formatDate(dateObj) {
        return dateObj.getFullYear() + '-' +
            ("0" + (dateObj.getMonth() + 1).toString(10)).slice(-2) + '-' +
            ("0" + (dateObj.getDate()).toString(10)).slice(-2) + ' ' +
            ("0" + (dateObj.getHours()).toString(10)).slice(-2) + ':' +
            ("0" + (dateObj.getMinutes()).toString(10)).slice(-2) + ':' +
            ("0" + (dateObj.getSeconds()).toString(10)).slice(-2);
    }

    function resizeGrids() {
        var x = $(window).width();
        var y = $(window).height();
        if (x < 720) { x = 720; }
        if (y < 480) { y = 480; }
        $('#grid-states').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-objects').setGridHeight(y - 150).setGridWidth(x - 20);
        $('.subgrid-level-1').setGridWidth(x - 67);
        $('.subgrid-level-2').setGridWidth(x - 94);
    }
    resizeGrids();
    $(window).resize(resizeGrids);

});
})(jQuery);

