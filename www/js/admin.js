/* jshint -W097 */// jshint strict:false
'use strict';

/*global io:false */
/*global jQuery:false */
/*jslint browser:true */

(function ($) {
$(document).ready(function () {

    var toplevel  = [];
    var instances = [];
    var enums =     [];
    var scripts =   [];
    var users =     [];
    var groups =    [];
    var children =  {};
    var objects =   {};

    function navigation() {
        var tab = 'tab-' + window.location.hash.slice(1);
        var index = $('#tabs a[href="#' + tab + '"]').parent().index() - 1;
        $('#tabs').tabs('option', 'active', index);
    }

    $('#tabs').tabs({
        activate: function (event, ui) {
            window.location.hash = '#' + ui.newPanel.selector.slice(5);
            switch (ui.newPanel.selector) {
                case '#tab-objects':
                    break;

                case '#tab-states':
                    break;

                case '#tab-scripts':
                    initScripts();
                    break;

                case '#tab-instances':
                    initInstances();
                    break;

                case '#tab-users':
                    initUsers();
                    break;
            }
        },
        create: function () {
            $('#tabs ul.ui-tabs-nav').prepend('<li class="header">ioBroker.admin</li>');

            $(".ui-tabs-nav").
                append("<button title='Logout' value='Logout' class='menu-button' id='button-logout'>Logout</button>");
            $("#button-logout").button().click(function () {
                window.location.href = "/logout/";
            });

            window.onhashchange = navigation;
            navigation();

        }
    });





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
        colNames: ['id', 'name', 'type'],
        colModel: [
            {name: '_id',  index:'_id', width: 450, fixed: true},
            {name: 'name', index:'name'},
            {name: 'type', index:'type', width: 120, fixed: true,
                //formatter:'select',
                stype: 'select',
                searchoptions: {
                    sopt: ['eq'], value: ":All;device:device;channel:channel;state:state;enum:enum;host:host;adapter:adapter;meta:meta;path:path;config:config"
                }
            }
        ],
        pager: $('#pager-objects'),
        rowNum: 100,
        rowList: [20, 50, 100],
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
            var id = $('tr#' + rowid.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
            if (!children[id]) {
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
                    if ($(this).jqGrid('getGridParam', 'selrow')) {
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
            var objSelected = $gridObjects.jqGrid('getGridParam', 'selrow');
            if (!objSelected) {
                $('[id^="grid-objects"][id$="_t"]').each(function () {
                    if ($(this).jqGrid('getGridParam', 'selrow')) {
                        objSelected = $(this).jqGrid('getGridParam', 'selrow');
                    }
                });
            }
            var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
            alert('TODO delete ' + id); //TODO
        },
        position: 'first',
        id: 'del-object',
        title: 'Delete object',
        cursor: 'pointer'
    }).jqGrid('navButtonAdd', '#pager-objects', {
        caption: '',
        buttonicon: 'ui-icon-pencil',
        onClickButton: function () {
            var objSelected = $gridObjects.jqGrid('getGridParam', 'selrow');
            if (!objSelected) {
                $('[id^="grid-objects"][id$="_t"]').each(function () {
                    if ($(this).jqGrid('getGridParam', 'selrow')) {
                        objSelected = $(this).jqGrid('getGridParam', 'selrow');
                    }
                });
            }
            var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
            editObject(id);
        },
        position: 'first',
        id: 'edit-object',
        title: 'Edit object',
        cursor: 'pointer'
    }).jqGrid('navButtonAdd', '#pager-objects', {
        caption: '',
        buttonicon: 'ui-icon-plus',
        onClickButton: function () {
            alert('TODO add object'); //TODO
        },
        position: 'first',
        id: 'add-object',
        title: 'New objekt',
        cursor: 'pointer'
    });

    function subGridObjects(grid, row, level) {
        var id = $('tr#' + row.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
        var subgridTableId = grid + '_t';
        $('[id="' + grid + '"]').html('<table class="subgrid-level-' + level + '" id="' + subgridTableId + '"></table>');
        var $subgrid = $('table[id="' + subgridTableId + '"]');
        var gridConf = {
            datatype: 'local',
            colNames: ['id', 'name', 'type'],
            colModel: [
                {name: '_id',  index: '_id', width: 450 - (level * 27), fixed: true},
                {name: 'name', index: 'name'},
                {name: 'type', index: 'type', width: 120 - (level * 2), fixed: true}
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
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
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
            $subgrid.jqGrid('addRowData', 'object_' + objects[children[id][i]]._id.replace(/ /g, '_'), {
                _id: objects[children[id][i]]._id,
                name: objects[children[id][i]].common ? objects[children[id][i]].common.name : '',
                type: objects[children[id][i]].type
            });
        }
        $subgrid.trigger('reloadGrid');
    }

    var stateEdit = false;
    var stateLastSelected;


    var $gridStates = $('#grid-states');
    $gridStates.jqGrid({
        datatype: 'local',
        colNames: ['id', 'name', 'val', 'ack', 'from', 'ts', 'lc'],
        colModel: [
            {name: '_id',  index: '_id',  width: 475, fixed: true},
            {name: 'name', index: 'name', width: 200, fixed: false},
            {name: 'val',  index: 'ack',  width: 160, editable: true},
            {name: 'ack',  index: 'ack',  width: 80,  fixed: false, editable: true, edittype: 'checkbox', editoptions: {value: "true:false"}},
            {name: 'from', index: 'from', width: 80,  fixed: false},
            {name: 'ts',   index: 'ts',   width: 138, fixed: false},
            {name: 'lc',   index: 'lc',   width: 138, fixed: false}
        ],
        pager: $('#pager-states'),
        rowNum: 100,
        rowList: [20, 50, 100],
        sortname: "id",
        sortorder: "desc",
        viewrecords: true,
        caption: 'ioBroker States',
        onSelectRow: function (id) {
            var rowData = $gridStates.jqGrid('getRowData', id);
            rowData.ack = false;
            rowData.from = '';
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
                var id = $('tr#' + stateLastSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
                socket.emit('setState', id, {val:val, ack:ack});
            });
        }
    }).jqGrid('filterToolbar', {
        defaultSearch: 'cn',
        autosearch: true,
        searchOnEnter: false,
        enableClear: false
    });

    var instanceLastSelected;
    var instanceEdit;



    var $gridInstances = $('#grid-instances');
    $gridInstances.jqGrid({
        datatype: 'local',
        colNames: ['id', 'name', 'title', 'version', 'enabled', 'host', 'mode', 'platform', 'loglevel', 'alive', 'connected'],
        colModel: [
            {name: '_id',       index: '_id'},
            {name: 'name',      index: 'name', editable: true},
            {name: 'title',     index: 'title'},
            {name: 'version',   index: 'version'},
            {name: 'enabled',   index: 'enabled', editable: true, edittype: 'checkbox', editoptions: {value: "true:false"}},
            {name: 'host',      index: 'host', editable: true},
            {name: 'mode',      index: 'mode'},
            {name: 'platform',  index: 'platform'},
            {name: 'loglevel',  index: 'loglevel', editable: true, edittype: 'select', editoptions: {value: 'debug:debug;info:info;warn:warn;error:error'}},
            {name: 'alive',     index: 'alive'},
            {name: 'connected', index: 'connected'}
        ],
        pager: $('#pager-instances'),
        rowNum: 100,
        rowList: [20, 50, 100],
        sortname: "id",
        sortorder: "desc",
        viewrecords: true,
        caption: 'ioBroker adapter instances',
        onSelectRow: function (id, e) {
            $('#del-instance').removeClass('ui-state-disabled');
            $('#edit-instance').removeClass('ui-state-disabled');
            $('#reload-instance').removeClass('ui-state-disabled');

            var rowData = $gridInstances.jqGrid('getRowData', id);
            rowData.ack = false;
            rowData.from = '';
            $gridInstances.jqGrid('setRowData', id, rowData);

            if (id && id !== instanceLastSelected) {
                $gridInstances.restoreRow(instanceLastSelected);
                instanceLastSelected = id;
            }
            $gridInstances.editRow(id, true, function () {
                // onEdit
                instanceEdit = true;
            }, function (obj) {
                // success
            }, "clientArray", null, function () {
                // afterSave
                instanceEdit = false;
                var obj = {common:{}};
                obj.common.host = $gridInstances.jqGrid("getCell", instanceLastSelected, "host");
                obj.common.loglevel = $gridInstances.jqGrid("getCell", instanceLastSelected, "loglevel");
                obj.common.enabled = $gridInstances.jqGrid("getCell", instanceLastSelected, "enabled");
                if (obj.common.enabled === 'true') obj.common.enabled = true;
                if (obj.common.enabled === 'false') obj.common.enabled = false;



                var id = $('tr#' + instanceLastSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();

                socket.emit('extendObject', id, obj);
            });

        },
        gridComplete: function () {
            $('#del-instance').addClass('ui-state-disabled');
            $('#edit-instance').addClass('ui-state-disabled');
            $('#reload-instance').addClass('ui-state-disabled');
        }
    }).jqGrid('filterToolbar', {
        defaultSearch: 'cn',
        autosearch: true,
        searchOnEnter: false,
        enableClear: false
    }).navGrid('#pager-instances', {
        search: false,
        edit: false,
        add: false,
        del: false,
        refresh: false
    }).jqGrid('navButtonAdd', '#pager-instances', {
        caption: '',
        buttonicon: 'ui-icon-trash',
        onClickButton: function () {
            var objSelected = $gridInstances.jqGrid('getGridParam', 'selrow');
            if (!objSelected) {
                $('[id^="grid-objects"][id$="_t"]').each(function () {
                    if ($(this).jqGrid('getGridParam', 'selrow')) {
                        objSelected = $(this).jqGrid('getGridParam', 'selrow');
                    }
                });
            }
            var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
            alert('TODO delete ' + id); //TODO
        },
        position: 'first',
        id: 'del-object',
        title: 'delete instance',
        cursor: 'pointer'
    }).jqGrid('navButtonAdd', '#pager-instances', {
        caption: '',
        buttonicon: 'ui-icon-pencil',
        onClickButton: function () {
            var objSelected = $gridInstances.jqGrid('getGridParam', 'selrow');
            if (!objSelected) {
                $('[id^="grid-objects"][id$="_t"]').each(function () {
                    if ($(this).jqGrid('getGridParam', 'selrow')) {
                        objSelected = $(this).jqGrid('getGridParam', 'selrow');
                    }
                });
            }
            var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
            editObject(id);
        },
        position: 'first',
        id: 'edit-instance',
        title: 'edit instance',
        cursor: 'pointer'
    }).jqGrid('navButtonAdd', '#pager-instances', {
        caption: '',
        buttonicon: 'ui-icon-plus',
        onClickButton: function () {
            alert('TODO add instance'); //TODO
        },
        position: 'first',
        id: 'add-instance',
        title: 'new instance',
        cursor: 'pointer'
    }).jqGrid('navButtonAdd', '#pager-instances', {
        caption: '',
        buttonicon: 'ui-icon-refresh',
        onClickButton: function () {
            var objSelected = $gridInstances.jqGrid('getGridParam', 'selrow');
            var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
            socket.emit('extendObject', id, {});
        },
        position: 'first',
        id: 'reload-instance',
        title: 'reload instance',
        cursor: 'pointer'
    });



    var userLastSelected;
    var userEdit;

    var $gridUsers = $('#grid-users');
    $gridUsers.jqGrid({
        datatype: 'local',
        colNames: ['id', 'name', 'enabled', 'groups'],
        colModel: [
            {name: '_id',       index: '_id', width: 250},
            {name: 'name',      index: 'name',    editable: false, width: 150},
            {name: 'enabled',   index: 'enabled', editable: false, width: 70, edittype: 'checkbox', editoptions: {value: "true:false"}},
            {name: 'groups',    index: 'groups',  editable: false, width: 400}
        ],
        pager: $('#pager-users'),
        rowNum: 100,
        rowList: [20, 50, 100],
        sortname: "id",
        sortorder: "desc",
        viewrecords: true,
        caption: 'ioBroker users',
        gridComplete: function () {
            $('#del-user').addClass('ui-state-disabled');
            $('#edit-user').addClass('ui-state-disabled');
            $(".user-group-edit").multiselect({
                selectedList: 4,
                close: function () {
                    var obj = {native: {groups: $(this).val()}};
                    var id  = $(this).attr('data-id');
                    socket.emit('extendObject', id, obj);
                }
            });
            $(".user-enabled-edit").change(function () {
                var obj = {common: {enabled: $(this).is(':checked')}};
                var id  = $(this).attr('data-id');
                socket.emit('extendObject', id, obj);
            });
        }
    }).jqGrid('filterToolbar', {
        defaultSearch: 'cn',
        autosearch: true,
        searchOnEnter: false,
        enableClear: false
    }).navGrid('#pager-users', {
        search: false,
        edit: false,
        add: false,
        del: false,
        refresh: false
    }).jqGrid('navButtonAdd', '#pager-users', {
        caption: '',
        buttonicon: 'ui-icon-trash',
        onClickButton: function () {
            var objSelected = $gridUsers.jqGrid('getGridParam', 'selrow');
            if (!objSelected) {
                $('[id^="grid-objects"][id$="_t"]').each(function () {
                    if ($(this).jqGrid('getGridParam', 'selrow')) {
                        objSelected = $(this).jqGrid('getGridParam', 'selrow');
                    }
                });
            }
            var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
            alert('TODO delete ' + id); //TODO
        },
        position: 'first',
        id: 'del-user',
        title: 'delete instance',
        cursor: 'pointer'
    }).jqGrid('navButtonAdd', '#pager-users', {
        caption: '',
        buttonicon: 'ui-icon-plus',
        onClickButton: function () {
            alert('TODO add user'); //TODO
        },
        position: 'first',
        id: 'add-user',
        title: 'new user',
        cursor: 'pointer'
    });



    var $dialogScript = $('#dialog-script');
    $dialogScript.dialog({
        autoOpen:   false,
        modal:      true,
        width: 640,
        height: 480,
        buttons: [
            {
                text: 'Save',
                click: saveScript
            },
            {
                text: 'Cancel',
                click: function () {
                    $dialogScript.dialog('close');

                }
            }
        ]
    });


    var scriptLastSelected;
    var scriptEdit;

    var $gridScripts = $('#grid-scripts');
    $gridScripts.jqGrid({
        datatype: 'local',
        colNames: ['id', 'name', 'platform', 'enabled', 'engine'],
        colModel: [
            {name: '_id',       index: '_id'},
            {name: 'name',      index: 'name', editable: true},
            {name: 'platform',  index: 'platform'},
            {name: 'enabled',   index: 'enabled', editable: true, edittype: 'checkbox', editoptions: {value: "true:false"}},
            {name: 'engine',    index: 'engine', editable: true}
        ],
        pager: $('#pager-scripts'),
        rowNum: 100,
        rowList: [20, 50, 100],
        sortname: "id",
        sortorder: "desc",
        viewrecords: true,
        caption: 'ioBroker adapter scripts',
        onSelectRow: function (id, e) {
            $('#del-script').removeClass('ui-state-disabled');
            $('#edit-script').removeClass('ui-state-disabled');

            var rowData = $gridScripts.jqGrid('getRowData', id);
            rowData.ack = false;
            rowData.from = '';
            $gridScripts.jqGrid('setRowData', id, rowData);

            if (id && id !== scriptLastSelected) {
                $gridScripts.restoreRow(scriptLastSelected);
                scriptLastSelected = id;
            }
            $gridScripts.editRow(id, true, function () {
                // onEdit
                scriptEdit = true;
            }, function (obj) {
                // success
            }, "clientArray", null, function () {
                // afterSave
                scriptEdit = false;
                var obj = {common:{}};
                obj.common.engine = $gridScripts.jqGrid("getCell", scriptLastSelected, "engine");
                obj.common.enabled = $gridScripts.jqGrid("getCell", scriptLastSelected, "enabled");
                if (obj.common.enabled === 'true') obj.common.enabled = true;
                if (obj.common.enabled === 'false') obj.common.enabled = false;
                var id = $('tr#' + scriptLastSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
                socket.emit('extendObject', id, obj);
            });

        },
        gridComplete: function () {
            $('#del-script').addClass('ui-state-disabled');
            $('#edit-script').addClass('ui-state-disabled');
        }
    }).jqGrid('filterToolbar', {
        defaultSearch: 'cn',
        autosearch: true,
        searchOnEnter: false,
        enableClear: false
    }).navGrid('#pager-scripts', {
        search: false,
        edit: false,
        add: false,
        del: false,
        refresh: false
    }).jqGrid('navButtonAdd', '#pager-scripts', {
        caption: '',
        buttonicon: 'ui-icon-trash',
        onClickButton: function () {
            var objSelected = $gridScripts.jqGrid('getGridParam', 'selrow');
            if (!objSelected) {
                $('[id^="grid-scripts"][id$="_t"]').each(function () {
                    if ($(this).jqGrid('getGridParam', 'selrow')) {
                        objSelected = $(this).jqGrid('getGridParam', 'selrow');
                    }
                });
            }
            var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
            alert('TODO delete ' + id); //TODO
        },
        position: 'first',
        id: 'del-script',
        title: 'delete script',
        cursor: 'pointer'
    }).jqGrid('navButtonAdd', '#pager-scripts', {
        caption: '',
        buttonicon: 'ui-icon-pencil',
        onClickButton: function () {
            var objSelected = $gridScripts.jqGrid('getGridParam', 'selrow');
            if (!objSelected) {
                $('[id^="grid-scripts"][id$="_t"]').each(function () {
                    if ($(this).jqGrid('getGridParam', 'selrow')) {
                        objSelected = $(this).jqGrid('getGridParam', 'selrow');
                    }
                });
            }
            var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
            editScript(id);
        },
        position: 'first',
        id: 'edit-script',
        title: 'edit script',
        cursor: 'pointer'
    }).jqGrid('navButtonAdd', '#pager-scripts', {
        caption: '',
        buttonicon: 'ui-icon-plus',
        onClickButton: function () {
            editScript();
        },
        position: 'first',
        id: 'add-script',
        title: 'new script',
        cursor: 'pointer'
    });


    var objectsLoaded = false;

    function getObjects(callback) {
        $gridObjects.jqGrid('clearGridData');
        socket.emit('getObjects', function (err, res) {
            var obj;
            objects = res;
            for (var id in objects) {
                if (id.slice(0, 7) === '_design') continue;
                obj = objects[id];
                if (obj.parent) {
                    if (!children[obj.parent]) children[obj.parent] = [];
                    children[obj.parent].push(id);

                    if (obj.type === 'instance') instances.push(id);
                } else {
                    toplevel.push(id);
                    if (obj.type === 'script') scripts.push(id);
                    if (obj.type === 'user') users.push(id);
                    if (obj.type === 'group') groups.push(id);
                }
            }
            objectsLoaded = true;
            for (var i = 0; i < toplevel.length; i++) {
                $gridObjects.jqGrid('addRowData', 'object_' + toplevel[i].replace(/ /g, '_'), {
                    _id: objects[toplevel[i]]._id,
                    name: objects[toplevel[i]].common ? objects[toplevel[i]].common.name : '',
                    type: objects[toplevel[i]].type
                });
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
                obj.name = objects[obj._id] ? objects[obj._id].common.name : '';
                obj.type = objects[obj._id] && objects[obj._id].common ? objects[obj._id].common.type : '';
                if (obj.ts) obj.ts = formatDate(new Date(obj.ts * 1000));
                if (obj.lc) obj.lc = formatDate(new Date(obj.lc * 1000));
                $gridStates.jqGrid('addRowData', 'state_' + key.replace(/ /g, '_'), obj);
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
        $('#edit-object-name').val(obj.common.name);
        $('#edit-object-type').val(obj.type);
        $('#edit-object-parent').val(obj.parent);
        $('#edit-object-common').val(JSON.stringify(obj.common, null, '  '));
        $('#edit-object-native').val(JSON.stringify(obj.native, null, '  '));
        $dialogObject.dialog('open');
    }

    function editScript(id) {
        if (id) {
            $dialogScript.dialog('option', 'title', id);
            $('#edit-script-id').val(obj._id);
            $('#edit-script-name').val(obj.common.name);
            $('#edit-script-platform').val(obj.common.platform);
            $('#edit-script-source').val(obj.common.source);
            $dialogScript.dialog('open');
        } else {
            $dialogScript.dialog('option', 'title', 'new script');
            $('#edit-script-id').val('');
            $('#edit-script-name').val('');
            $('#edit-script-platform').val('Javascript/Node.js');
            $('#edit-script-source').val('');
            $dialogScript.dialog('open');
        }
    }

    function saveScript() {
        var obj = {common: {}};
        obj._id = $('#edit-script-id').val();
        obj.type = 'script';
        obj.common.name = $('#edit-script-name').val();
        obj.common.source = $('#edit-script-source').val();
        obj.common.platform = $('#edit-script-platform').val() || '';
        var extension;

        if (!obj._id) {
            if (obj.common.platform.match(/^[jJ]avascript/)) {
                extension = 'js.';
                obj.common.engine = 'system.adapter.javascript.0';
            }
            obj._id = 'script.' + extension + obj.common.name;
        }

        socket.emit('extendObject', obj._id, obj);
        $dialogScript.dialog('close');
    }

    function saveObject() {
        var obj = {common: {}, native: {}};
        obj._id = $('#edit-object-id').val();
        obj.parent = $('#edit-object-parent-old').val();
        obj.common.name = $('#edit-object-name').val();
        obj.type = $('#edit-object-type').val();
        obj.parent = $('#edit-object-parent').val();

        try {
            obj.common = JSON.parse($('#edit-object-common').val());
        } catch (e) {
            alert('common ' + e);
            return false;
        }
        try {
            obj.native = JSON.parse($('#edit-object-native').val());
        } catch (e) {
            alert('native ' + e);
            return false;
        }

        socket.emit('extendObject', obj._id, obj);


        $dialogObject.dialog('close');
    }

    function initInstances() {


        if (!objectsLoaded) {
            setTimeout(initInstances, 250);
            return;
        }

        if (typeof $gridInstances !== 'undefined' && !$gridInstances[0]._isInited) {
            $("#load_grid-instances").show()
            $gridInstances[0]._isInited = true;
            for (var i = 0; i < instances.length; i++) {
                var obj = objects[instances[i]];
                $gridInstances.jqGrid('addRowData', 'instance_' + instances[i].replace(/ /g, '_'), {
                    _id:      obj._id,
                    name:     obj.common ? obj.common.name : '',
                    title:    obj.common ? obj.common.title : '',
                    version:  obj.common ? obj.common.version + ' <input type="button" value="check"/>' : '',
                    enabled:  obj.common ? obj.common.enabled : '',
                    host:     obj.common ? obj.common.host : '',
                    mode:     obj.common.mode === 'schedule' ? 'schedule ' + obj.common.schedule : obj.common.mode,
                    platform: obj.common ? obj.common.platform : '',
                    loglevel: obj.common ? obj.common.loglevel : '',
                    alive:    '',
                    connected: ''
                });
            }
            $gridInstances.trigger('reloadGrid');
        }
    }

    function initUsers() {
        if (typeof $gridUsers != 'undefined' && !$gridUsers[0]._isInited) {
            $gridUsers[0]._isInited = true;
            for (var i = 0; i < users.length; i++) {
                var obj = objects[users[i]];
                var select = '<select class="user-group-edit" multiple="multiple" data-id="' + users[i] + '">';
                for (var j = 0; j < groups.length; j++) {
                    var name = groups[j].substring('system.group.'.length);
                    name = name.substring(0, 1).toUpperCase() + name.substring(1);
                    select += '<option value="' + groups[j] + '"';
                    if (obj.native && obj.native.groups && obj.native.groups.indexOf(groups[j]) != -1) select += ' selected';
                    select += '>' + name + '</option>';
                }

                $gridUsers.jqGrid('addRowData', 'user_' + users[i].replace(/ /g, '_'), {
                    _id:     obj._id,
                    name:    obj.common ? obj.common.name : '',
                    enabled: '<input class="user-enabled-edit" type="checkbox" data-id="' + users[i] + '" ' + (obj.common && obj.common.enabled ? 'checked' : '') + '/>',
                    groups:  select
                });
            }
            $gridUsers.trigger('reloadGrid');
        }
    }

    function initScripts() {



        if (!objectsLoaded) {
            setTimeout(initScripts, 250);
            return;
        }

        if (typeof $gridScripts != 'undefined' && !$gridScripts[0]._isInited) {
            $("#load_grid-scripts").show();
            $gridScripts[0]._isInited = true;

            for (var i = 0; i < scripts.length; i++) {
                var obj = objects[scripts[i]];
                $gridScripts.jqGrid('addRowData', 'script_' + instances[i].replace(/ /g, '_'), {
                    _id: obj._id,
                    name: obj.common ? obj.common.name : '',
                    platform: obj.common ? obj.common.platform : '',
                    enabled: obj.common ? obj.common.enabled : '',
                    engine: obj.common ? obj.common.engine : ''
                });
            }
            $gridScripts.trigger('reloadGrid');
        }
    }

    var socket = io.connect();

    socket.on('stateChange', function (id, obj) {

        // Update gridStates
        var rowData = $gridStates.jqGrid('getRowData', 'state_' + id);
        rowData.val = obj.val;
        rowData.ack = obj.ack;
        if (obj.ts) rowData.ts = formatDate(new Date(obj.ts * 1000));
        if (obj.lc) rowData.lc = formatDate(new Date(obj.lc * 1000));
        rowData.from = obj.from;
        $gridStates.jqGrid('setRowData', 'state_' + id.replace(/ /g, '_'), rowData);

        $('#events').prepend('<tr><td>stateChange</td><td>' + id + '</td><td>' + JSON.stringify(obj) + '</td></tr>');

        var parts = id.split('.');
        var last = parts.pop();
        id = parts.join('.');
        if (last === 'alive' && instances.indexOf(id) !== -1) {
            rowData = $gridStates.jqGrid('getRowData', 'state_' + id);
            rowData.alive = obj.val;
            $gridInstances.jqGrid('setRowData', 'instance_' + id.replace(/ /g, '_'), rowData);

        } else if (last === 'connected' && instances.indexOf(id) !== -1) {
            rowData = $gridStates.jqGrid('getRowData', 'state_' + id);
            rowData.connected = obj.val;
            $gridInstances.jqGrid('setRowData', 'instance_' + id.replace(/ /g, '_'), rowData);
        }

    });

    socket.on('objectChange', function (id, obj) {
        // Todo handle deleted objects

        // update objects cache
        objects[id] = obj;

        // prepend to event table
        var row = '<tr><td>objectChange</td><td>' + id + '</td><td>' + JSON.stringify(obj) + '</td></tr>';
        $('#events').prepend(row);

        // TODO update gridObjects


        // Update Instance Table
        if (instances.indexOf(id) !== -1 && typeof $gridInstances != 'undefined' && $gridInstances[0]._isInited) {
            var rowData = $gridInstances.jqGrid('getRowData', 'state_' + id);
            $gridInstances.jqGrid('setRowData', 'instance_' + id.replace(/ /g, '_'), {
                _id: obj._id,
                name: obj.common ? obj.common.name : '',
                title: obj.common ? obj.common.title : '',
                enabled: obj.common ? obj.common.enabled : '',
                host: obj.common ? obj.common.host : '',
                mode: obj.common.mode === 'schedule' ? 'schedule ' + obj.common.schedule : obj.common.mode,
                platform: obj.common ? obj.common.platform : '',
                loglevel: obj.common ? obj.common.loglevel : '',
                alive: rowData.alive,
                connected: rowData.connected
            });
        }
    });

    var firstConnect = true;
    socket.on('connect', function () {
        if (firstConnect) {
            firstConnect = false;
            // Here we go!
            $("#load_grid-objects").show();
            $("#load_grid-states").show();
            //$("#load_grid-enums").show();
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
        if (x < 720) {
            x = 720;
        }
        if (y < 480) {
            y = 480;
        }
        $('#grid-states').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-objects').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-enums').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-instances').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-scripts').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-users').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-groups').setGridHeight(y - 150).setGridWidth(x - 20);
        $('.subgrid-level-1').setGridWidth(x - 67);
        $('.subgrid-level-2').setGridWidth(x - 94);
    }

    resizeGrids();
    $(window).resize(resizeGrids);

});
})(jQuery);

