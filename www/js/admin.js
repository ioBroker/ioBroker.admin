/* jshint -W097 */// jshint strict:false
/* global io:false */
/* global jQuery:false */
/* jslint browser:true */
'use strict';


var $iframeDialog = null;

(function ($) {
$(document).ready(function () {

    var toplevel  =     [];
    var instances =     [];
    var enums =         [];
    var scripts =       [];
    var users =         [];
    var groups =        [];
    var adapters =      [];
    var children =      {};
    var objects =       {};
    var updateTimers =  {};
    var adapterWindow;
    var hosts =         [];
    var states =        {};
    var settingsChanged;

    var $stdout = $('#stdout');

    function navigation() {
        var tab = 'tab-' + window.location.hash.slice(1);
        var index = $('#tabs a[href="#' + tab + '"]').parent().index() - 1;
        $('#tabs').tabs('option', 'active', index);
    }


    var editor = ace.edit("script-editor");
    //editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");
    editor.resize();

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

                case '#tab-adapters':
                    initAdapters();
                    break;

                case '#tab-instances':
                    initInstances();
                    break;

                case '#tab-users':
                    initUsers();
                    break;
                
                case '#tab-groups':
                    initGroups();
                    break;
            }
        },
        create: function () {
            $('#tabs ul.ui-tabs-nav').prepend('<li class="header">ioBroker.admin</li>');

            $(".ui-tabs-nav").
                append("<button class='menu-button translateB' id='button-logout'>Logout</button>");
            $("#button-logout").button().click(function () {
                window.location.href = "/logout/";
            });

            window.onhashchange = navigation;
            navigation();
        }
    });

    var cmdCode;
    var cmdCallback = null;
    var stdout;

    function cmdExec(cmd) {
        $stdout.val('');
        $dialogCommand.dialog('open');
        stdout = '$ ./iobroker ' + cmd;
        $stdout.val(stdout);
        socket.emit('cmdExec', cmd, function (code) {
            cmdCode = code;
        });
    }

    var $dialogCommand = $('#dialog-command');
    $dialogCommand.dialog({
        autoOpen:      false,
        modal:         true,
        width:         920,
        height:        480,
        closeOnEscape: false,
        open: function(event, ui) { $(".ui-dialog-titlebar-close", ui.dialog || ui).hide(); }
    });

    var $configFrame = $('#config-iframe');
    var $dialogConfig = $('#dialog-config');
    $dialogConfig.dialog({
        autoOpen:   false,
        modal:      true,
        width:      830, //$(window).width() > 920 ? 920: $(window).width(),
        height:     536, //$(window).height() - 100, // 480
        closeOnEscape: false,
        open: function(event, ui) {
            $('#dialog-config').css('padding', '2px 0px');
        },
        close: function () {
            // Clear iframe
            $configFrame.attr('src', '');
        }
    });

    $(document).on('click', '.jump', function (e) {
        editObject($(this).attr('data-jump-to'));
        e.preventDefault();
        return false;
    });


    var $dialogObject;
    var $gridObjects;

    function prepareObjects () {
        $dialogObject = $('#dialog-object');
        $dialogObject.dialog({
            autoOpen:   false,
            modal:      true,
            width: 800,
            height: 540,
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

        $gridObjects = $('#grid-objects');
        $gridObjects.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('type')],
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
            buttonicon: 'ui-icon-gear',
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
            title: _('Edit object'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-objects', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                alert('TODO add object'); //TODO
            },
            position: 'first',
            id: 'add-object',
            title: _('New objekt'),
            cursor: 'pointer'
        });

    };
    function subGridObjects(grid, row, level) {
        var id = $('tr#' + row.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
        var subgridTableId = grid + '_t';
        $('[id="' + grid + '"]').html('<table class="subgrid-level-' + level + '" id="' + subgridTableId + '"></table>');
        var $subgrid = $('table[id="' + subgridTableId + '"]');
        var gridConf = {
            datatype: 'local',
            colNames: ['id', _('name'), _('type')],
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

    var $gridEnums;
    function prepareEnums () {
        $gridEnums = $('#grid-enums');
        $gridEnums.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('members'), ''],
            colModel: [
                {name: '_id',       index: '_id', width: 450, fixed: true},
                {name: 'name',      index: 'name'},
                {name: 'count',     index: 'count'},
                {name: 'buttons',   index: 'buttons'}
            ],
            pager: $('#pager-enums'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker Enums'),
            subGrid: true,
            subGridRowExpanded: function (grid, row) {
                subGridEnums(grid, row, 1);
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
                $('[id^="grid-enums"][id$="_t"]').not('[id="' + this.id + '"]').jqGrid('resetSelection');
                $('#del-enum').removeClass('ui-state-disabled');
                $('#edit-enum').removeClass('ui-state-disabled');
            },
            gridComplete: function () {
                $('#del-enum').addClass('ui-state-disabled');
                $('#edit-enum').addClass('ui-state-disabled');
            },
            subGridRowColapsed: function (grid, id) {
                var objSelected = $gridEnums.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-enums"][id$="_t"]').not('[id="' + grid + '_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                if (!objSelected) {
                    $('#del-enum').addClass('ui-state-disabled');
                    $('#edit-enum').addClass('ui-state-disabled');
                }
                return true;
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch: true,
            searchOnEnter: false,
            enableClear: false
        }).navGrid('#pager-enums', {
            search: false,
            edit: false,
            add: false,
            del: false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-enums', {
            caption: '',
            buttonicon: 'ui-icon-trash',
            onClickButton: function () {
                var objSelected = $gridEnums.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-enums"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
                alert('TODO delete ' + id); //TODO
            },
            position: 'first',
            id: 'del-enum',
            title: _('Delete enum'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-enums', {
            caption: '',
            buttonicon: 'ui-icon-gear',
            onClickButton: function () {
                var objSelected = $gridEnums.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-enums"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
                editObject(id);
            },
            position: 'first',
            id: 'edit-enum',
            title: _('Edit enum'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-enums', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                alert('TODO add enum'); //TODO
            },
            position: 'first',
            id: 'add-enum',
            title: _('New objekt'),
            cursor: 'pointer'
        });
    };
    function subGridEnums(grid, row, level) {
        var id = $('tr#' + row.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
        var subgridTableId = grid + '_t';
        $('[id="' + grid + '"]').html('<table class="subgrid-level-' + level + '" id="' + subgridTableId + '"></table>');
        var $subgrid = $('table[id="' + subgridTableId + '"]');
        var gridConf = {
            datatype: 'local',
            colNames: ['id', _('name'), _('members'), ''],
            colModel: [
                {name: '_id',  index: '_id', width: 450 - (level * 27), fixed: true},
                {name: 'name', index: 'name'},
                {name: 'members', index: 'members'},
                {name: 'buttons', index: 'buttons'}
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
                subGridEnums(grid, row, level + 1);
            },
            subGridRowColapsed: function (grid, id) {
                // Check if there is still a row selected
                var objSelected = $gridObjects.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-enum"][id$="_t"]').not('[id="' + grid + '_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                // Disable buttons if no row is selected
                if (!objSelected) {
                    $('#del-enum').addClass('ui-state-disabled');
                    $('#edit-enum').addClass('ui-state-disabled');
                }
                return true;
            },
            afterInsertRow: function (rowid) {
                // Remove icon and click handler if no children available
                if (!children[rowid.slice(5)]) {
                    $('td.sgcollapsed', '[id="' + rowid + '"').empty().removeClass('ui-sgcollapsed sgcollapsed');
                }
            },
            gridComplete: function () {
                // Hide header
                $subgrid.parent().parent().parent().find('table.ui-jqgrid-htable').hide();
            },
            onSelectRow: function (rowid, e) {
                // unselect other subgrids but not myself
                $('[id^="grid-enums"][id$="_t"]').not('[id="' + this.id + '"]').jqGrid('resetSelection');

                // unselect objects grid
                $gridEnums.jqGrid('resetSelection');

                // enable buttons
                $('#del-enum').removeClass('ui-state-disabled');
                $('#edit-enum').removeClass('ui-state-disabled');
            }
        };
        $subgrid.jqGrid(gridConf);

        for (var i = 0; i < children[id].length; i++) {
            $subgrid.jqGrid('addRowData', 'enum_' + objects[children[id][i]]._id.replace(/ /g, '_'), {
                _id: objects[children[id][i]]._id,
                name: objects[children[id][i]].common ? objects[children[id][i]].common.name : '',
                members: objects[children[id][i]].common.members ? objects[children[id][i]].common.members.length : '',
                buttons: '<button data-enum-id="' + objects[children[id][i]]._id + '" class="enum-edit">members</button>'

            });
        }
        $subgrid.trigger('reloadGrid');
    }

    // Grid states
    var $gridStates;
    function prepareStates() {
        var stateEdit = false;
        var stateLastSelected;

        $gridStates = $('#grid-states');
        $gridStates.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('val'), _('ack'), _('from'), _('ts'), _('lc')],
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
            caption: _('ioBroker States'),
            // TODO Inline Edit on dblClick only
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
    }

    // Grid adapters
    var $gridAdapter;
    function prepareAdapters() {
        var adapteLastSelected;
        var adapteEdit;

        $gridAdapter = $('#grid-adapters');
        $gridAdapter.jqGrid({
            datatype: 'local',
            colNames: ['id', '', _('name'), _('title'), _('desc'), _('keywords'), _('available'), _('installed'), _('platform'), ''],
            colModel: [
                {name: '_id',       index: '_id',       hidden: true},
                {name: 'image',     index: 'image',     width: 22,   editable: false, sortable: false, search: false, align: 'center'},
                {name: 'name',      index: 'name',      width:  64},
                {name: 'title',     index: 'title',     width: 180},
                {name: 'desc',      index: 'desc',      width: 360},
                {name: 'keywords',  index: 'keywords',  width: 120},
                {name: 'version',   index: 'version',   width:  70, align: 'center'},
                {name: 'installed', index: 'installed', width: 110, align: 'center'},
                {name: 'platform',  index: 'platform',  hidden: true},
                {name: 'install',   index: 'install',   width: 160}
            ],
            pager: $('#pager-adapters'),
            width: 964,
            height: 326,
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker adapters'),
            gridComplete: function () {

            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch: true,
            searchOnEnter: false,
            enableClear: false
        }).navGrid('#pager-adapters', {
            search: false,
            edit: false,
            add: false,
            del: false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-adapters', {
            caption: '',
            buttonicon: 'ui-icon-refresh',
            onClickButton: function () {
                cmdExec('update');
            },
            position: 'first',
            id: 'add-object',
            title: _('New objekt'),
            cursor: 'pointer'
        });

    }
    
    // Grid instances
    var $gridInstance;
    function prepareInstances() {
        var instanceLastSelected;
        var instanceEdit;


        $gridInstance = $('#grid-instances');
        $gridInstance.jqGrid({
            datatype: 'local',
            colNames: ['id', '', _('name'), _('instance'), _('title'), _('enabled'), _('host'), _('mode'), _('schedule'), '', _('platform'), _('loglevel'), _('alive'), _('connected')],
            colModel: [
                {name: '_id',       index: '_id',       hidden: true},
                {name: 'image',     index: 'image',     width: 22,   editable: false, sortable: false, search: false, align: 'center'},
                {name: 'name',      index: 'name',      width: 130,  editable: true},
                {name: 'instance',  index: 'instance',  width: 70},
                {name: 'title',     index: 'title',     width: 220},
                {name: 'enabled',   index: 'enabled',   width: 60,   editable: true, edittype: 'checkbox', editoptions: {value: "true:false"}, align: 'center'},
                {name: 'host',      index: 'host',      width: 100,  editable: true, edittype: 'select', editoptions: ''},
                {name: 'mode',      index: 'mode',      width: 80,   align: 'center'},
                {name: 'schedule',  index: 'schedule',  width: 80,   align: 'center', editable: true},
                {name: 'config',    index: 'config',    width: 60,   align: 'center', sortable: false, search: false},
                {name: 'platform',  index: 'platform',  width: 60,   hidden: true},
                {name: 'loglevel',  index: 'loglevel',  width: 60,   align: 'center',   editable: true, edittype: 'select', editoptions: {value: 'debug:debug;info:info;warn:warn;error:error'}},
                {name: 'alive',     index: 'alive',     width: 60,   align: 'center'},
                {name: 'connected', index: 'connected', width: 60,   align: 'center'}
            ],
            pager: $('#pager-instances'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker adapter instances'),
            // TODO Inline Edit on dblClick only
            onSelectRow: function (id, e) {
                $('#del-instance').removeClass('ui-state-disabled');
                $('#edit-instance').removeClass('ui-state-disabled');
                $('#config-instance').removeClass('ui-state-disabled');
                $('#reload-instance').removeClass('ui-state-disabled');

            },
            ondblClickRow: configInstance,
            gridComplete: function () {
                $('#del-instance').addClass('ui-state-disabled');
                $('#edit-instance').addClass('ui-state-disabled');
                $('#config-instance').addClass('ui-state-disabled');
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
                var objSelected = $gridInstance.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
                if (confirm('Are you sure?')) {
                    cmdExec('del ' + id.replace('system.adapter.', ''));
                }
            },
            position: 'first',
            id: 'del-instance',
            title: _('delete instance'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-instances', {
            caption: '',
            buttonicon: 'ui-icon-gear',
            onClickButton: function () {
                var objSelected = $gridInstance.jqGrid('getGridParam', 'selrow');
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
            title: _('edit instance'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-instances', {
            caption: '',
            buttonicon: 'ui-icon-pencil',
            onClickButton: function () {
                configInstance($gridInstance.jqGrid('getGridParam', 'selrow'));
            },
            position: 'first',
            id: 'config-instance',
            title: _('config instance'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-instances', {
            caption: '',
            buttonicon: 'ui-icon-refresh',
            onClickButton: function () {
                var objSelected = $gridInstance.jqGrid('getGridParam', 'selrow');
                var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
                socket.emit('extendObject', id, {});
            },
            position: 'first',
            id: 'reload-instance',
            title: _('reload instance'),
            cursor: 'pointer'
        });

        function configInstance(id, e) {
            var rowData = $gridInstance.jqGrid('getRowData', id);
            rowData.ack = false;
            rowData.from = '';
            $gridInstance.jqGrid('setRowData', id, rowData);

            if (id && id !== instanceLastSelected) {
                $gridInstance.restoreRow(instanceLastSelected);
                instanceLastSelected = id;
            }
            $gridInstance.editRow(id, true, function () {
                // onEdit
                instanceEdit = true;
            }, function (obj) {
                // success
            }, "clientArray", null, function () {
                // afterSave
                instanceEdit = false;
                var obj = {common:{}};
                obj.common.host     = $gridInstance.jqGrid("getCell", instanceLastSelected, "host");
                obj.common.loglevel = $gridInstance.jqGrid("getCell", instanceLastSelected, "loglevel");
                obj.common.schedule = $gridInstance.jqGrid("getCell", instanceLastSelected, "schedule");
                obj.common.enabled  = $gridInstance.jqGrid("getCell", instanceLastSelected, "enabled");
                if (obj.common.enabled === 'true') obj.common.enabled = true;
                if (obj.common.enabled === 'false') obj.common.enabled = false;

                var id = $('tr#' + instanceLastSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();

                socket.emit('extendObject', id, obj);
            });
        }


    }


    // Grid users
    var $gridUsers;
    var $dialogUser;
    function prepareUsers() {
        var userLastSelected;
        $gridUsers = $('#grid-users');
        $gridUsers.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('enabled'), _('groups')],
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
            caption: _('ioBroker users'),
            onSelectRow: function (id, e) {
                if (id && id !== userLastSelected) {
                    $gridUsers.restoreRow(userLastSelected);
                    userLastSelected = id;
                }

                id = $('tr#' + userLastSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();

                if (!users[id] || !users[id].common || !users[id].common.dontDelete) {
                    $('#del-user').removeClass('ui-state-disabled');
                }
                $('#edit-user').removeClass('ui-state-disabled');

                var rowData = $gridUsers.jqGrid('getRowData', id);
                rowData.ack = false;
                rowData.from = '';
                $gridUsers.jqGrid('setRowData', id, rowData);
            },
            gridComplete: function () {
                $('#del-user').addClass('ui-state-disabled');
                $('#edit-user').addClass('ui-state-disabled');
                $(".user-groups-edit").multiselect({
                    selectedList: 4,
                    close: function () {
                        synchronizeUser($(this).attr('data-id'), $(this).val());
                    },
                    checkAllText:     _('Check all'),
                    uncheckAllText:	  _('Uncheck All'),
                    noneSelectedText: _('Select options')
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
                if (window.confirm("Are you sure?")) {
                    socket.emit('delUser', id.replace("system.user.", ""), function (err) {
                        if (err) {
                            window.alert("Cannot delete user: " + err);
                        } else {
                            delUser(id);
                        }
                    });
                }
            },
            position: 'first',
            id: 'del-user',
            title: _('delete user'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-users', {
            caption: '',
            buttonicon: 'ui-icon-pencil',
            onClickButton: function () {
                var objSelected = $gridUsers.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-scripts"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                if (objSelected) {
                    var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
                    editUser(id);
                } else {
                    window.alert("Invalid object " + objSelected);
                }
            },
            position: 'first',
            id: 'edit-user',
            title: _('edit user'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-users', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                editUser();
            },
            position: 'first',
            id: 'add-user',
            title: _('new user'),
            cursor: 'pointer'
        });

        $dialogUser = $('#dialog-user');
        $dialogUser.dialog({
            autoOpen: false,
            modal:    true,
            width:    340,
            height:   220,
            buttons:  [
                {
                    text: 'Save',
                    click: saveUser
                },
                {
                    text: 'Cancel',
                    click: function () {
                        $dialogUser.dialog('close');

                    }
                }
            ]
        });
        $('#edit-user-name').keydown(function (event) {
            if (event.which == 13) $('#edit-user-pass').focus();
        });
        $('#edit-user-pass').keydown(function (event) {
            if (event.which == 13) $('#edit-user-passconf').focus();
        });
        $('#edit-user-passconf').keydown(function (event) {
            if (event.which == 13) saveUser();
        });
    }

    // Grid groups
    var $gridGroups;
    var $dialogGroup;
    function prepareGroups() {
        var groupLastSelected;
        $gridGroups = $('#grid-groups');
        $gridGroups.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('desc'), _('users')],
            colModel: [
                {name: '_id',         index: '_id',         width: 250},
                {name: 'name',        index: 'name',        editable: false, width: 150},
                {name: 'description', index: 'description', editable: false, width: 200},
                {name: 'users',       index: 'users',       editable: false, width: 400}
            ],
            pager: $('#pager-groups'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker groups'),
            onSelectRow: function (id, e) {
                if (id && id !== groupLastSelected) {
                    $gridGroups.restoreRow(groupLastSelected);
                    groupLastSelected = id;
                }

                id = $('tr#' + groupLastSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();

                if (!groups[id] || !groups[id].common || !groups[id].common.dontDelete) {
                    $('#del-group').removeClass('ui-state-disabled');
                }
                $('#edit-group').removeClass('ui-state-disabled');

                var rowData = $gridGroups.jqGrid('getRowData', id);
                rowData.ack = false;
                rowData.from = '';
                $gridGroups.jqGrid('setRowData', id, rowData);
            },
            gridComplete: function () {
                $('#del-group').addClass('ui-state-disabled');
                $('#edit-group').addClass('ui-state-disabled');
                $(".group-users-edit").multiselect({
                    selectedList: 4,
                    close: function () {
                        var obj = {common: {members: $(this).val()}};
                        var id  = $(this).attr('data-id');
                        socket.emit('extendObject', id, obj, function (err, obj) {
                            if (err) {
                                // Cannot modify
                                window.alert("Cannot change group");
                            }
                        });
                    },
                    checkAllText:     _('Check all'),
                    uncheckAllText:	  _('Uncheck All'),
                    noneSelectedText: _('Select options')
                });
            }
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch: true,
            searchOnEnter: false,
            enableClear: false
        }).navGrid('#pager-groups', {
            search: false,
            edit: false,
            add: false,
            del: false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-groups', {
            caption: '',
            buttonicon: 'ui-icon-trash',
            onClickButton: function () {
                var objSelected = $gridGroups.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
                if (window.confirm("Are you sure?")) {
                    socket.emit('delGroup', id.replace("system.group.", ""), function (err) {
                        if (err) {
                            window.alert("Cannot delete group: " + err);
                        }
                    });
                }
            },
            position: 'first',
            id: 'del-group',
            title: _('delete group'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-groups', {
            caption: '',
            buttonicon: 'ui-icon-pencil',
            onClickButton: function () {
                var objSelected = $gridGroups.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-scripts"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                if (objSelected) {
                    var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
                    editGroup(id);
                } else {
                    window.alert("Invalid object " + objSelected);
                }
            },
            position: 'first',
            id: 'edit-group',
            title: _('edit group'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-groups', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                editGroup();
            },
            position: 'first',
            id: 'add-group',
            title: _('new group'),
            cursor: 'pointer'
        });

        $dialogGroup = $('#dialog-group');
        $dialogGroup.dialog({
            autoOpen: false,
            modal:    true,
            width:    430,
            height:   205,
            buttons:  [
                {
                    text: 'Save',
                    click: saveGroup
                },
                {
                    text: 'Cancel',
                    click: function () {
                        $dialogGroup.dialog('close');

                    }
                }
            ]
        });
        $('#edit-group-name').keydown(function (event) {
            if (event.which == 13) $('#edit-group-desc').focus();
        });
        $('#edit-group-desc').keydown(function (event) {
            if (event.which == 13) saveGroup();
        });
    }
    
    // Grid scripts
    var $gridScripts;
    function prepareScripts() {
        var scriptLastSelected;
        var scriptEdit;

        $gridScripts = $('#grid-scripts');
        $gridScripts.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('platform'), _('enabled'), _('engine')],
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
            caption: _('ioBroker adapter scripts'),
            // TODO Inline Edit on dblClick only
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
                if (objSelected) {
                    var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
                    alert('TODO delete ' + id); //TODO
                }
            },
            position: 'first',
            id: 'del-script',
            title: _('delete script'),
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
                if (objSelected) {
                    var id = $('tr#' + objSelected.replace(/\./g, '\\.').replace(/\:/g, '\\:')).find('td[aria-describedby$="_id"]').html();
                    editScript(id);
                } else {
                    window.alert("Invalid object " + objSelected);
                }
            },
            position: 'first',
            id: 'edit-script',
            title: _('edit script'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-scripts', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                editScript();
            },
            position: 'first',
            id: 'add-script',
            title: _('new script'),
            cursor: 'pointer'
        });

        var $dialogScript = $('#dialog-script');
        $dialogScript.dialog({
            autoOpen:   false,
            modal:      true,
            width: 800,
            height: 540,
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
    }

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
                    if (obj.type === 'script')  scripts.push(id);
                    if (obj.type === 'user')    users.push(id);
                    if (obj.type === 'group')   groups.push(id);
                    if (obj.type === 'adapter') adapters.push(id);
                    if (obj.type === 'host') {
                        var addr = null;
                        // Find first non internal IP and use it as identifier
                        if (obj.native.hardware && obj.native.hardware.networkInterfaces) {
                            for (var eth in obj.native.hardware.networkInterfaces) {
                                for (var num = 0; num < obj.native.hardware.networkInterfaces[eth].length; num++) {
                                    if (!obj.native.hardware.networkInterfaces[eth][num].internal) {
                                        addr = obj.native.hardware.networkInterfaces[eth][num].address;
                                        break;
                                    }
                                }
                                if (addr) break;
                            }
                        }
                        if (addr) hosts.push({name: obj.common.hostname, address: addr});
                    }
                }
            }
            objectsLoaded = true;

            // Change editoptions for gridInstances column host
            var tmp = '';
            for (var j = 0; j < hosts.length; j++) {
                tmp += (j > 0 ? ';' : '') + hosts[j].name + ':' + hosts[j].name;
            }
            $gridInstance.jqGrid('setColProp', 'host', {editoptions: {value: tmp}});


            for (var i = 0; i < toplevel.length; i++) {
                if (objects[toplevel[i]].type === 'enum') {
                    $gridEnums.jqGrid('addRowData', 'enum_' + toplevel[i].replace(/ /g, '_'), {
                        _id:  objects[toplevel[i]]._id,
                        name: objects[toplevel[i]].common ? objects[toplevel[i]].common.name : '',
                        members: objects[toplevel[i]].common.members ? objects[toplevel[i]].common.members.length : '',
                        buttons: '<button data-enum-id="' + objects[toplevel[i]]._id + '" class="enum-edit">members</button>'
                    });
                }
                $gridObjects.jqGrid('addRowData', 'object_' + toplevel[i].replace(/ /g, '_'), {
                    _id:  objects[toplevel[i]]._id,
                    name: objects[toplevel[i]].common ? objects[toplevel[i]].common.name : '',
                    type: objects[toplevel[i]].type
                });

            }
            $gridObjects.trigger('reloadGrid');
            $gridEnums.trigger('reloadGrid');


            if (typeof callback === 'function') callback();
        });
    }

    function getStates(callback) {
        $gridStates.jqGrid('clearGridData');
        socket.emit('getStates', function (err, res) {
            var i = 0;
            states = res;
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
        console.log(obj);
        $dialogObject.dialog('option', 'title', id);
        $('#edit-object-id').val(obj._id);
        $('#edit-object-parent-old').val(obj.parent);
        $('#edit-object-name').val(obj.common.name);
        $('#edit-object-type').val(obj.type);
        $('#edit-object-parent').val(obj.parent);
        $('#jump-parent').attr('data-jump-to', obj.parent);
        var childs = '<div style="font-size: 10px">';
        // childs += '<table style="font-size: 11px">';
        if (obj.children) {

            for (var i = 0; i < obj.children.length; i++) {
                //childs += '<tr><td>' + obj.children[i] + '</td><td><button data-jump-to="' + obj.children[i] + '" class="jump">-></button></td></tr>';
                childs += '<a style="text-decoration: underline; cursor: pointer;" class="jump" data-jump-to="' + obj.children[i] + '">' + obj.children[i] + '</a><br>';
            }
        }

        childs += '</div>';
        //childs += '</table>';
        $('#edit-object-children').html(childs);
        $('#edit-object-common').val(JSON.stringify(obj.common, null, '  '));
        $('#edit-object-native').val(JSON.stringify(obj.native, null, '  '));
        $dialogObject.dialog('open');
    }

    function editScript(id) {
        if (id) {
            var obj = objects[id];
            $dialogScript.dialog('option', 'title', id);
            $('#edit-script-id').val(obj._id);
            $('#edit-script-name').val(obj.common.name);
            $('#edit-script-platform').val(obj.common.platform);
            if (obj.common.platform.match(/^[jJ]ava[sS]cript/)) {
                editor.getSession().setMode("ace/mode/javascript");
            } else if (obj.common.platform.match(/^[cC]offee[sS]cript/)) {
                editor.getSession().setMode("ace/mode/coffee");
            }
            //$('#edit-script-source').val(obj.common.source);
            editor.setValue(obj.common.source);
            $dialogScript.dialog('open');
        } else {
            $dialogScript.dialog('option', 'title', 'new script');
            $('#edit-script-id').val('');
            $('#edit-script-name').val('');
            $('#edit-script-platform').val('Javascript/Node.js');
            //$('#edit-script-source').val('');
            editor.setValue('');
            $dialogScript.dialog('open');
        }
    }

    function saveScript() {
        var obj = {common: {}};
        obj._id = $('#edit-script-id').val();
        obj.type = 'script';
        obj.common.name = $('#edit-script-name').val();
        obj.common.source = editor.getValue();
        obj.common.platform = $('#edit-script-platform').val() || '';
        var extension;

        if (!obj._id) {
            if (obj.common.platform.match(/^[jJ]ava[sS]cript/)) {
                extension = 'js.';
                obj.common.engine = 'system.adapter.javascript.0';
            } else if (obj.common.platform.match(/^[cC]offee[sS]cript/)) {
                extension = 'coffee.';
                obj.common.engine = 'system.adapter.javascript.0';
            }
            obj._id = 'script.' + extension + obj.common.name;
        }

        socket.emit('extendObject', obj._id, obj);
        $dialogScript.dialog('close');
    }

    function editUser(id) {
        if (id) {
            var obj = objects[id];
            $dialogUser.dialog('option', 'title', id);
            $('#edit-user-id').val(obj._id);
            $('#edit-user-name').val(obj.common.name);
            $('#edit-user-name').prop('disabled', true);
            $('#edit-user-pass').val('__pass_not_set__');
            $('#edit-user-passconf').val('__pass_not_set__');
            $dialogUser.dialog('open');
        } else {
            $dialogUser.dialog('option', 'title', 'new user');
            $('#edit-user-id').val('');
            $('#edit-user-name').val('');
            $('#edit-user-name').prop('disabled', false);
            $('#edit-user-pass').val('');
            $('#edit-user-passconf').val('');
            $dialogUser.dialog('open');
        }
    }
    
    function saveUser() {
        var pass = $('#edit-user-pass').val();
        var passconf = $('#edit-user-passconf').val();

        if (pass != passconf) {
            window.alert("Password and confirmation are not equal!");
            return;
        }
        var id = $('#edit-user-id').val();
        var user = $('#edit-user-name').val();

        if (!id) {
            socket.emit('addUser', user, pass, function (err) {
                if (err) {
                    window.alert("Cannot set password: " + err);
                } else {
                    $dialogUser.dialog('close');
                    initUsers(true);
                }
            });
        } else {
            // If password changed
            if (pass != '__pass_not_set__') {
                socket.emit('changePassword', user, pass, function (err) {
                    if (err) {
                        window.alert("Cannot set password: " + err);
                    } else {
                        $dialogUser.dialog('close');
                    }
                });
            }
        }
    }

    function editGroup(id) {
        if (id) {
            var obj = objects[id];
            $dialogGroup.dialog('option', 'title', id);
            $('#edit-group-id').val(obj._id);
            $('#edit-group-name').val(obj.common.name);
            $('#edit-group-name').prop('disabled', true);
            $('#edit-group-desc').val(obj.common.desc);
            $dialogGroup.dialog('open');
        } else {
            $dialogGroup.dialog('option', 'title', 'new group');
            $('#edit-group-id').val('');
            $('#edit-group-name').val('');
            $('#edit-group-name').prop('disabled', false);
            $('#edit-group-desc').val('');
            $dialogGroup.dialog('open');
        }
    }

    function saveGroup() {
        var id    = $('#edit-group-id').val();
        var group = $('#edit-group-name').val();
        var desc  = $('#edit-group-desc').val();

        if (!id) {
            socket.emit('addGroup', group, desc, function (err) {
                if (err) {
                    window.alert("Cannot create group: " + err);
                } else {
                    $dialogGroup.dialog('close');
                    initGroups(true);
                }
            });
        } else {
            var obj = {common: {desc: desc}};
            // If description changed
            socket.emit('extendObject', id, obj, function (err, res) {
                if (err) {
                    window.alert("Cannot change group: " + err);
                } else {
                    $dialogGroup.dialog('close');
                }
            });
        }
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
            window.alert('common ' + e);
            return false;
        }
        try {
            obj.native = JSON.parse($('#edit-object-native').val());
        } catch (e) {
            window.alert('native ' + e);
            return false;
        }

        socket.emit('extendObject', obj._id, obj);


        $dialogObject.dialog('close');
    }

    function initAdapters(update) {

        if (!objectsLoaded) {
            setTimeout(initAdapters, 250);
            return;
        }

        if (typeof $gridAdapter !== 'undefined' && (!$gridAdapter[0]._isInited || update)) {
            console.log('adapters', adapters);
            $gridAdapter.jqGrid('clearGridData');
            $gridAdapter[0]._isInited = true;
            for (var i = 0; i < adapters.length; i++) {
                var obj = objects[adapters[i]];
                var installed = '';
                if (obj.common && obj.common.installedVersion) {
                    installed = obj.common.installedVersion;
                    if (!upToDate(obj.common.version, obj.common.installedVersion)) {
                        installed += ' <button class="adapter-update-submit" data-adapter-name="' + obj.common.name + '">' + _('update') + '</button>';
                    }
                }
                $gridAdapter.jqGrid('addRowData', 'adapter_' + adapters[i].replace(/ /g, '_'), {
                    _id:      obj._id,
                    image:    obj.common && obj.common.extIcon ? '<img src="' + obj.common.extIcon+ '" width="22px" height="22px" />' : '',
                    name:     obj.common.name,
                    title:    obj.common ? obj.common.title : '',
                    desc:     obj.common ? (typeof obj.common.desc === 'object' ? obj.common.desc.en : obj.common.desc) : '',
                    keywords: obj.common && obj.common.keywords ? obj.common.keywords.join(' ') : '',
                    version:  obj.common ? obj.common.version : '',
                    installed: installed,
                    install:  '<button data-adapter-name="' + obj.common.name + '" class="adapter-install-submit">' + _('add instance') + '</button>' +
                              '<button data-adapter-name="' + obj.common.name + '" data-adapter-url="' + obj.common.readme + '" class="adapter-readme-submit">' + _('readme') + '</button>',
                    platform: obj.common ? obj.common.platform : ''
                });
            }
            $gridAdapter.trigger('reloadGrid');

            $(document).on('click', '.adapter-install-submit', function () {
                cmdExec('add ' + $(this).attr('data-adapter-name'));
            });
            $(document).on('click', '.adapter-update-submit', function () {
                cmdExec('upgrade ' + $(this).attr('data-adapter-name'));
            });
            $(document).on('click', '.adapter-readme-submit', function () {
                window.open($(this).attr('data-adapter-url'), $(this).attr('data-adapter-name') + ' ' + _('readme'));
            });
        }
    }

    function initInstances(update) {

        if (!objectsLoaded) {
            setTimeout(initInstances, 250);
            return;
        }

        if (typeof $gridInstance !== 'undefined' && (!$gridInstance[0]._isInited || update)) {
            $gridInstance[0]._isInited = true;
            $gridInstance.jqGrid('clearGridData');

            for (var i = 0; i < instances.length; i++) {
                var obj = objects[instances[i]];
                var tmp = obj._id.split('.');
                var adapter = tmp[2];
                var instance = tmp[3];
                $gridInstance.jqGrid('addRowData', 'instance_' + instances[i].replace(/ /g, '_'), {
                    _id:       obj._id,
                    image:     obj.common && obj.common.icon ? '<img src="/adapter/' + obj.common.name + '/' + obj.common.icon + '" width="22px" height="22px"/>' : '',
                    name:      obj.common ? obj.common.name : '',
                    instance:  obj._id.slice(15),
                    title:     obj.common ? obj.common.title : '',
                    enabled:   obj.common ? obj.common.enabled : '',
                    host:      obj.common ? obj.common.host : '',
                    mode:      obj.common.mode,
                    schedule:  obj.common.mode === 'schedule' ? obj.common.schedule : '',
                    config:    '<button data-adapter-href="/adapter/' + adapter + '/?' + instance + '" data-adapter-name="' + adapter + '.' + instance + '" class="adapter-settings">' + _('config') + '</button>',
                    platform:  obj.common ? obj.common.platform : '',
                    loglevel:  obj.common ? obj.common.loglevel : '',
                    alive:     states[obj._id + '.alive'] ? states[obj._id + '.alive'].val : '',
                    connected: states[obj._id + '.connected'] ? states[obj._id + '.connected'].val : ''
                });
            }
            $gridInstance.trigger('reloadGrid');

            $('.host-selector').each(function () {
                var id = $(this).attr('data-id');
                $(this).val((objects[id] && objects[id].common) ? obj.common.host || '': '').
                    change(function () {
                        socket.emit('extendObject', $(this).attr('data-id'), {common:{host: $(this).val()}});
                    });
            });

            $(document).on('click', '.adapter-settings', function () {
                $iframeDialog = $dialogConfig;
                $configFrame.attr('src', $(this).attr('data-adapter-href'));
                $dialogConfig.dialog('option', 'title', _('Adapter configuration') + ': ' + $(this).attr('data-adapter-name')).dialog('open');

                return false;
            });
        }


    }

    function initUsers(update) {

        if (!objectsLoaded) {
            setTimeout(initUsers, 500);
            return;
        }

        if (typeof $gridUsers != 'undefined' && (update || !$gridUsers[0]._isInited)) {
            $gridUsers[0]._isInited = true;
            $gridUsers.jqGrid('clearGridData');
            for (var i = 0; i < users.length; i++) {
                var obj = objects[users[i]];
                var select = '<select class="user-groups-edit" multiple="multiple" data-id="' + users[i] + '">';
                for (var j = 0; j < groups.length; j++) {
                    var name = groups[j].substring('system.group.'.length);
                    name = name.substring(0, 1).toUpperCase() + name.substring(1);
                    select += '<option value="' + groups[j] + '"';
                    if (objects[groups[j]].common && objects[groups[j]].common.members && objects[groups[j]].common.members.indexOf(users[i]) != -1) select += ' selected';
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

    function initGroups(update) {

        if (!objectsLoaded) {
            setTimeout(initGroups, 500);
            return;
        }

        if (typeof $gridGroups != 'undefined' && (update || !$gridGroups[0]._isInited)) {
            $gridGroups[0]._isInited = true;
            $gridGroups.jqGrid('clearGridData');
            for (var i = 0; i < groups.length; i++) {
                var obj = objects[groups[i]];
                var select = '<select class="group-users-edit" multiple="multiple" data-id="' + groups[i] + '">';
                for (var j = 0; j < users.length; j++) {
                    var name = users[j].substring('system.user.'.length);
                    select += '<option value="' + users[j] + '"';
                    if (obj.common && obj.common.members && obj.common.members.indexOf(users[j]) != -1) select += ' selected';
                    select += '>' + name + '</option>';
                }

                $gridGroups.jqGrid('addRowData', 'group_' + groups[i].replace(/ /g, '_'), {
                    _id:         obj._id,
                    name:        obj.common ? obj.common.name : '',
                    description: obj.common ? obj.common.desc : '',
                    users:       select
                });
            }
            $gridGroups.trigger('reloadGrid');
        }
    }

    function initScripts() {

        if (!objectsLoaded) {
            setTimeout(initScripts, 250);
            return;
        }

        if (typeof $gridScripts != 'undefined' && !$gridScripts[0]._isInited) {
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

    function synchronizeUser(userId, userGroups) {
        var obj;
        userGroups = userGroups || [];
        for (var i = 0; i < groups.length; i++) {
            // If user has no group, but group has user => delete user from group
            if (userGroups.indexOf(groups[i]) == -1 &&
                objects[groups[i]].common.members && objects[groups[i]].common.members.indexOf(userId) != -1) {
                objects[groups[i]].common.members.splice(objects[groups[i]].common.members.indexOf(userId), 1);
                obj = {common: {members: objects[groups[i]].common.members}};
                socket.emit('extendObject', groups[i], obj);
            }
            if (userGroups.indexOf(groups[i]) != -1 &&
                (!objects[groups[i]].common.members || objects[groups[i]].common.members.indexOf(userId) == -1)) {
                objects[groups[i]].common.members = objects[groups[i]].common.members || [];
                objects[groups[i]].common.members.push(userId);
                obj = {common: {members: objects[groups[i]].common.members}};
                socket.emit('extendObject', groups[i], obj);
            }
        }
    }

    function delUser(id) {
        for (var i = 0; i < groups.length; i++) {
            // If user has no group, but group has user => delete user from group
            if (objects[groups[i]].common.members && objects[groups[i]].common.members.indexOf(id) != -1) {
                objects[groups[i]].common.members.splice(objects[groups[i]].common.members.indexOf(id), 1);
                socket.emit('extendObject', groups[i], {
                    common: {
                        members: objects[groups[i]].common.members
                    }
                });
            }
        }
    }

    function loadSettings(systemSettings) {
        $('#save-system').button().button("disable").click(function() {
            var common = {};
            var languageChanged = false;
            $('.value').each(function () {
                var $this = $(this);
                var id = $this.attr('id').substring('system_'.length);

                if ($this.attr('type') == 'checkbox') {
                    common[id] = $this.prop('checked');
                } else {
                    if (id == 'language' && common[id] != $this.val()) languageChanged = true;
                    common[id] = $this.val();
                }
            });

            socket.emit('extendObject', 'system.config', {common: common}, function (err) {
                if (!err) {
                    settingsChanged = false;
                    $('#save-system').button("disable");
                    if (languageChanged) {
                        translateAll();
                    }
                }
            });
        });

        $('.value').each(function () {
            var $this = $(this);
            var id = $this.attr('id').substring('system_'.length);

            if ($this.attr('type') == 'checkbox') {
                $this.prop('checked', systemSettings.common[id]).change(function () {
                    settingsChanged = true;
                    $('#save-system').button("enable");
                });
            } else {
                $this.val(systemSettings.common[id]).change(function() {
                    settingsChanged = true;
                    $('#save-system').button("enable");
                }).keyup(function() {
                    settingsChanged = true;
                    $('#save-system').button("enable");
                });
            }

        });

        /*for (var param in systemSettings.common) {
            var $param = $('#system_'  + param + '.value');
            if ($param.length) {
                if ($param.attr('type') == 'checkbox') {
                    $param.prop('checked', systemSettings.common[param]).change(function () {
                        settingsChanged = true;
                        $('#save-system').button("enable");
                    });
                } else {
                    $param.val(systemSettings.common[param]).change(function() {
                        settingsChanged = true;
                        $('#save-system').button("enable");
                    }).keyup(function() {
                        settingsChanged = true;
                        $('#save-system').button("enable");
                    });
                }
            }
        }*/
    }

    var socket = io.connect();

    socket.on('cmdStdout', function (code, text) {
        stdout += '\n' + text;
        $stdout.val(stdout);
        $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
    });

    socket.on('cmdExit', function (code, exitCode) {
        exitCode = parseInt(exitCode, 10);
        stdout += '\n' + (exitCode !== 0 ? 'ERROR: ' : '') + 'process exited with code ' + exitCode;
        $stdout.val(stdout);
        $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
        cmdCode = null;
        if (exitCode == 0) {
            setTimeout(function () {
                $dialogCommand.dialog('close');
            }, 1500);
        }
        if (cmdCallback) {
            cmdCallback(exitCode);
            cmdCallback = null;
        }
    });

    socket.on('stateChange', function (id, obj) {
        if (!$gridStates) return;

        // Update gridStates
        var rowData = $gridStates.jqGrid('getRowData', 'state_' + id);
        rowData.val = obj.val;
        rowData.ack = obj.ack;
        if (obj.ts) rowData.ts = formatDate(new Date(obj.ts * 1000));
        if (obj.lc) rowData.lc = formatDate(new Date(obj.lc * 1000));
        rowData.from = obj.from;
        $gridStates.jqGrid('setRowData', 'state_' + id.replace(/ /g, '_'), rowData);

        $('#event-table').prepend('<tr><td class="event-column-1">stateChange</td><td class="event-column-2">' + id +
            '</td><td class="event-column-3">' + obj.val +
            '</td><td class="event-column-4">' + obj.ack + '</td>' +
            '<td class="event-column-5">' + obj.from + '</td><td class="event-column-6">' + rowData.ts + '</td><td class="event-column-7">' +
            rowData.lc + '</td></tr>');

        var parts = id.split('.');
        var last = parts.pop();
        id = parts.join('.');
        if (last === 'alive' && instances.indexOf(id) !== -1) {
            rowData = $gridStates.jqGrid('getRowData', 'state_' + id);
            rowData.alive = obj.val;
            $gridAdapter.jqGrid('setRowData', 'instance_' + id.replace(/ /g, '_'), rowData);

        } else if (last === 'connected' && instances.indexOf(id) !== -1) {
            rowData = $gridStates.jqGrid('getRowData', 'state_' + id);
            rowData.connected = obj.val;
            $gridAdapter.jqGrid('setRowData', 'instance_' + id.replace(/ /g, '_'), rowData);
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
        if (id.match(/^system\.adapter\.[a-zA-Z0-9-_]+\.[0-9]+$/)) {
            if (obj) {
                if (instances.indexOf(id) == -1) instances.push(id);
            } else {
                var i = instances.indexOf(id);
                if (i != -1) {
                    instances.splice(i, 1);
                }
            }

            if (typeof $gridInstance !== 'undefined' && $gridInstance[0]._isInited) {
                initInstances(true);
            }
        }

        // Update Adapter Table
        if (id.match(/^system\.adapter\.[a-zA-Z0-9-_]+$/)) {
            if (obj) {
                if (adapters.indexOf(id) == -1) adapters.push(id);
            } else {
                var j = adapters.indexOf(id);
                if (j != -1) {
                    adapters.splice(j, 1);
                }
            }
            if (typeof $gridAdapter != 'undefined' && $gridAdapter[0]._isInited) {
                initAdapters(true);
            }

        }


        // Update users
        if (id.substring(0, "system.user.".length) == "system.user.") {
            if (obj) {
                if (users.indexOf(id) == -1) users.push(id);
            } else {
                var k = users.indexOf(id);
                if (k != -1) {
                    users.splice(k, 1);
                }
            }
            if (!updateTimers.initUsersGroups) {
                clearTimeout(updateTimers.initUsersGroups);
            }
            updateTimers.initUsersGroups = setTimeout(function () {
                updateTimers.initUsersGroups = null;
                initUsers(true);
                initGroups(true);
            }, 200);
        }
        // Update groups
        if (id.substring(0, "system.group.".length) == "system.group.") {
            if (obj) {
                if (groups.indexOf(id) == -1) groups.push(id);
            } else {
                var j = groups.indexOf(id);
                if (j != -1) {
                    groups.splice(j, 1);
                }
            }
            setTimeout(function () {
                initGroups(true);
            }, 0);
            if (!updateTimers.initUsersGroups) {
                clearTimeout(updateTimers.initUsersGroups);
            }
            updateTimers.initUsersGroups = setTimeout(function () {
                updateTimers.initUsersGroups = null;
                initGroups(true);
                initUsers(true);
            }, 200);
        }
    });

    var firstConnect = true;
    socket.on('connect', function () {
        $('#connecting').hide();
        if (firstConnect) {
            firstConnect = false;

            // Read system configuration
            socket.emit('getObject', 'system.config', function (err, systemConfig) {
                if (!err && systemConfig && systemConfig.common) {
                    systemLang = systemConfig.common.language || systemLang;
                    if (!systemConfig.common.licenseConfirmed) {
                        // Show license agreement
                        var language = systemConfig.common.language || window.navigator.userLanguage || window.navigator.language;
                        if (language != 'en' && language != 'de' && language != 'ru') language = 'en';

                        $('#license_text').html(license[language] || license['en']);
                        $('#license_language').val(language).show();

                        $('#license_language').change(function () {
                            language = $(this).val();
                            $('#license_text').html(license[language] || license['en']);
                        });

                        var $dialogLicense = $('#dialog-license').css({'z-index': 200});
                        $dialogLicense.dialog({
                            autoOpen: true,
                            modal:    true,
                            width:    600,
                            height:   400,
                            buttons:  [
                                {
                                    text: _('agree'),
                                    click: function () {
                                        socket.emit('extendObject', 'system.config', {common: {
                                            licenseConfirmed: true,
                                            language: language
                                        }});
                                        $dialogLicense.dialog('close');
                                        $('#license_language').hide();
                                    }
                                },
                                {
                                    text: _('not agree'),
                                    click: function () {
                                        location.reload();
                                    }
                                }
                            ],
                            close: function () {
                                location.reload();
                            }
                        });
                        $('#edit-user-name').keydown(function (event) {
                            if (event.which == 13) $('#edit-user-pass').focus();
                        });
                        $('#edit-user-pass').keydown(function (event) {
                            if (event.which == 13) $('#edit-user-passconf').focus();
                        });
                        $('#edit-user-passconf').keydown(function (event) {
                            if (event.which == 13) saveUser();
                        });

                    }
                } else {
                    systemConfig = {
                        type: 'config',
                        common: {
                            language:        '',           // Default language for adapters. Adapters can use different values.
                            tempUnit:        '°C',         // Default temperature units.
                            currency:        '€',          // Default currency sign.
                            dateFormat:      'DD.MM.YYYY', // Default date format.
                            isFloatComma:     true,         // Default float divider ('.' - false, ',' - true)
                            licenseConfirmed: false         // If license agreement confirmed
                        }
                    };
                    systemConfig.common.language = window.navigator.userLanguage || window.navigator.language;

                    if (systemConfig.common.language != 'en' &&
                        systemConfig.common.language != 'de' &&
                        systemConfig.common.language != 'ru') systemConfig.common.language = 'en';
                }
                translateAll();

                loadSettings(systemConfig);

                // Here we go!
                $('#tabs').show();
                prepareObjects();
                prepareEnums();
                prepareStates();
                prepareAdapters();
                prepareInstances();
                prepareUsers();
                prepareGroups();
                prepareScripts();
                resizeGrids();

                $("#load_grid-objects").show();
                $("#load_grid-enums").show();
                $("#load_grid-states").show();
                $("#load_grid-scripts").show();
                $("#load_grid-adapters").show();
                $("#load_grid-instances").show();
                $("#load_grid-users").show();
                $("#load_grid-groups").show();

                //$("#load_grid-enums").show();
                getStates(getObjects());

            });
        }
    });

    socket.on('disconnect', function () {
        $('#connecting').show();
    });

    socket.on('reconnect', function () {
        $('#connecting').hide();
    });

    function upToDate(a, b) {
        var a = a.split('.');
        var b = b.split('.');
        a[0] = parseInt(a[0], 10);
        b[0] = parseInt(b[0], 10);
        if (a[0] > b[0]) {
            return false;
        } else if (a[0] === b[0]) {
            a[1] = parseInt(a[1], 10);
            b[1] = parseInt(b[1], 10);
            if (a[1] > b[1]) {
                return false;
            } else if (a[1] === b[1]) {
                a[2] = parseInt(a[2], 10);
                b[2] = parseInt(b[2], 10);
                if (a[2] > b[2]) {
                    return false;
                } else  {
                    return true;
                }
            }
        } else {
            return true;
        }
    }

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
        $('#grid-events-inner').css('height', (y - 130) + 'px');
        $('#grid-states').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-objects').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-enums').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-adapters').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-instances').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-scripts').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-users').setGridHeight(y - 150).setGridWidth(x - 20);
        $('#grid-groups').setGridHeight(y - 150).setGridWidth(x - 20);
        $('.subgrid-level-1').setGridWidth(x - 67);
        $('.subgrid-level-2').setGridWidth(x - 94);
    }

    $(window).resize(resizeGrids);

});
})(jQuery);

