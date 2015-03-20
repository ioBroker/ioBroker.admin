function States(main) {
    var that = this;

    this.$grid = $('#grid-states');
    this.main = main;

    function convertState(key, _obj) {
        var obj = JSON.parse(JSON.stringify(_obj));
        if (!obj) {
            console.log(key);
        }
        obj = obj || {};
        obj._id = key;
        obj.id = 'state_' + key;
        obj.name = main.objects[obj._id] ? (main.objects[obj._id].common.name || obj._id) : obj._id;

        if (that.main.objects[key] && that.main.objects[key].parent && that.main.objects[that.main.objects[key].parent]) {
            obj.pname = that.main.objects[that.main.objects[key].parent].common.name;
            // Add instance
            var parts = that.main.objects[key].parent.split('.');
            if (obj.pname.indexOf('.' + parts[parts.length - 1]) == -1) {
                obj.pname += '.' + parts[parts.length - 1];
            }
        } else if (obj.name.indexOf('.messagebox') != -1) {
            var p = obj.name.split('.');
            p.splice(-1);
            obj.pname = p.join('.');
        } else {
            var b = obj.name.split('.');
            b.splice(2);
            obj.pname = b.join('.');
        }

        obj.type = that.main.objects[obj._id] && that.main.objects[obj._id].common ? that.main.objects[obj._id].common.type : '';
        if (obj.ts) obj.ts = that.main.formatDate(obj.ts, true);
        if (obj.lc) obj.lc = that.main.formatDate(obj.lc, true);

        if (typeof obj.val == 'object') obj.val = JSON.stringify(obj.val);

        obj.gridId = 'state_' + key.replace(/ /g, '_');
        obj.from = obj.from ? obj.from.replace('system.adapter.', '').replace('system.', '') : '';
        return obj;
    }

    this.prepare = function () {
        var stateEdit = false;
        var stateLastSelected;

        // TODO hide column history if no instance of history-adapter enabled
        this.$grid.jqGrid({
            datatype: 'local',
            colNames: ['id', _('parent name'), _('name'), _('val'), _('ack'), _('from'), _('ts'), _('lc')],
            colModel: [
                {name: '_id', index: '_id', width: 250, fixed: false},
                {name: 'pname', index: 'pname', width: 250, fixed: false},
                {name: 'name', index: 'name', width: 250, fixed: false},
                {name: 'val', index: 'val', width: 160, editable: true},
                {
                    name: 'ack',
                    index: 'ack',
                    width: 60,
                    fixed: false,
                    editable: true,
                    edittype: 'checkbox',
                    editoptions: {value: "true:false"}
                },
                {name: 'from', index: 'from', width: 80, fixed: false},
                {name: 'ts', index: 'ts', width: 140, fixed: false},
                {name: 'lc', index: 'lc', width: 140, fixed: false}
            ],
            pager: $('#pager-states'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            viewrecords: true,
            caption: _('ioBroker States'),
            ignoreCase: true,
            ondblClickRow: function (id) {
                var rowData = that.$grid.jqGrid('getRowData', id);
                rowData.ack = false;
                rowData.from = '';
                that.$grid.jqGrid('setRowData', id, rowData);

                if (id && id !== stateLastSelected) {
                    that.$grid.restoreRow(stateLastSelected);
                    stateLastSelected = id;
                }
                var _id = id.substring(6);//'state_'.length
                if (main.objects[_id] && main.objects[_id].common && main.objects[_id].common.type == 'boolean') {
                    that.$grid.setColProp('val', {
                        editable: true,
                        edittype: 'checkbox',
                        editoptions: {value: 'true:false'}
                    });
                } else if (main.objects[_id] && main.objects[_id].common && main.objects[_id].common.type == 'number' && main.objects[_id].common.states) {
                    that.$grid.setColProp('val', {
                        editable: true,
                        edittype: 'select',
                        editoptions: {value: main.objects[_id].common.states.join(':')},
                        align: 'center'
                    });
                } else {
                    that.$grid.setColProp('val', {
                        editable: true,
                        edittype: 'text',
                        editoptions: null,
                        align: 'center'
                    });
                }

                that.$grid.editRow(id, true, function () {
                    // onEdit
                    stateEdit = true;
                }, function (obj) {
                    // success
                }, 'clientArray', null, function () {
                    // afterSave
                    stateEdit = false;
                    var val = that.$grid.jqGrid('getCell', stateLastSelected, 'val');

                    if (val === 'true')  val = true;
                    if (val === 'false') val = false;

                    if (parseFloat(val) == val) val = parseFloat(val);

                    var ack = that.$grid.jqGrid('getCell', stateLastSelected, 'ack');

                    if (ack === 'true')  ack = true;
                    if (ack === 'false') ack = false;

                    var id = $('tr[id="' + stateLastSelected + '"]').find('td[aria-describedby$="_id"]').html();
                    that.main.socket.emit('setState', id, {val: val, ack: ack});
                    stateLastSelected = null;
                });
            },
            postData: that.main.config.statesFilter ? { filters: that.main.config.statesFilter} : undefined,
            search: !!that.main.config.statesFilter
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch: true,
            searchOnEnter: false,
            enableClear: false,
            afterSearch: function () {
                //initStateButtons();
                // Save filter
                that.main.saveConfig('statesFilter', that.$grid.getGridParam("postData").filters);
            }
        }).navGrid('#pager-states', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-states', {
            caption: '',
            buttonicon: 'ui-icon-refresh',
            onClickButton: function () {
                that.init(true);
            },
            position: 'first',
            id: 'update-states',
            title: _('Update states'),
            cursor: 'pointer'
        });

        if (this.main.config.statesFilter) {
            var filters = JSON.parse(this.main.config.statesFilter);
            if (filters.rules) {
                for (var f = 0; f < filters.rules.length; f++) {
                    $('#gview_grid-states #gs_' + filters.rules[f].field).val(filters.rules[f].data);
                }
            }
        }
    };

    this.init = function (update) {
        if (!this.main.objectsLoaded || !this.main.states) {
            setTimeout(function () {
                that.init(update);
            }, 250);
            return;
        }

        if (typeof this.$grid !== 'undefined' && (!this.$grid[0]._isInited || update)) {
            this.$grid.jqGrid('clearGridData');
            this.$grid[0]._isInited = true;
            var data = [];

            for (var key in main.states) {
                //this.$grid.jqGrid('addRowData', 'state_' + key, convertState(key, main.states[key]));
                var obj = convertState(key, main.states[key]);
                data.push(obj);
            }
            this.$grid.jqGrid().setGridParam({'data': data}).trigger('reloadGrid');
        }
    };

    this.clear = function () {
        this.$grid.jqGrid('clearGridData');
    };

    this.stateChange = function (id, state) {
        if (this.$grid && this.main.objectsLoaded) {
            var rowData;
            // Update gridStates
            if (state) {
                if (this.main.states[id]) {
                    var data = this.$grid.jqGrid('getGridParam', 'data');
                    var index = this.$grid.jqGrid('getGridParam', '_index');
                    rowData = data[index['state_' + id]];
                    if (rowData) {
                        rowData.val = state.val;
                        rowData.ack = state.ack;
                        if (state.ts) rowData.ts = main.formatDate(state.ts, true);
                        if (state.lc) rowData.lc = main.formatDate(state.lc, true);
                        rowData.from = state.from ? state.from.replace('system.adapter.', '').replace('system.', '') : '';
                        var a = this.$grid.jqGrid('getRowData', 'state_' + id, rowData);
                        if (a && a._id) this.$grid.jqGrid('setRowData', 'state_' + id, rowData);
                    } else {
                        rowData = convertState(id, state);
                        this.$grid.jqGrid('addRowData', 'state_' + id, rowData);
                    }
                } else {
                    rowData = convertState(id, state);
                    this.$grid.jqGrid('addRowData', 'state_' + id, rowData);
                }
            } else {
                this.$grid.jqGrid('delRowData', 'state_' + id);
            }
            this.main.addEventMessage(id, state, rowData);
        }
    };

    this.resize = function (x, y) {
        this.$grid.setGridHeight(y - 150).setGridWidth(x - 20);
    };
}
