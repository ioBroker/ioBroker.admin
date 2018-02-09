function Enums(main) {
    'use strict';

    // enum is first level like enum.function or enum.rooms
    // category is second level like enum.function.light or enum.room.living_room

    var that          = this;

    this.main         = main;
    this.list         = [];
    this.$gridEnum    = $('#tab-enums');
    this.$gridList    = this.$gridEnum.find('.tab-enums-list');
    this.$grid        = this.$gridEnum.find('.tab-enums-objects');
    //this.enumEdit     = null;
    this.updateTimers = null;
    this.editMode     = false;

    var tasks         = [];
    var standardEnums = {
        'enum.rooms': {
            "_id": "enum.rooms",
            "common": {
                "icon": "home",
                "name": {
                    "en": "Rooms",
                    "de": "Räume",
                    "ru": "Комнаты",
                    "pt": "Quartos",
                    "nl": "Kamers",
                    "fr": "Pièces",
                    "it": "Camere",
                    "es": "Habitaciones"
                },
                "desc": {
                    "en": "List of the rooms",
                    "de": "Liste der Räumen",
                    "ru": "Список комнат",
                    "pt": "Lista dos quartos",
                    "nl": "Lijst met kamers",
                    "fr": "Liste des chambres",
                    "it": "Elenco delle stanze",
                    "es": "Lista de las habitaciones"
                },
                "members": [],
                "object-non-deletable": true
            },
            "type": "enum"
        },
        'enum.functions': {
            "_id": "enum.functions",
            "common": {
                "icon": "lightbulb_outline",
                "name": {
                    "en": "Functions",
                    "de": "Funktionen",
                    "ru": "функции",
                    "pt": "Funções",
                    "nl": "functies",
                    "fr": "Les fonctions",
                    "it": "funzioni",
                    "es": "Funciones"
                },
                "desc": {
                    "en": "List of the functions",
                    "de": "Liste der Funktionen",
                    "ru": "Список функций",
                    "pt": "Lista das funções",
                    "nl": "Lijst met functies",
                    "fr": "Liste des fonctions",
                    "it": "Elenco delle funzioni",
                    "es": "Lista de las funciones"
                },
                "members": [],
                "object-non-deletable": true
            },
            "type": "enum"
        },
        'enum.favorites': {
            "_id": "enum.favorites",
            "common": {
                "icon": "favorite_border",
                "name": {
                    "en": "Favorites",
                    "de": "Favoriten",
                    "ru": "Избранные",
                    "pt": "Favoritos",
                    "nl": "favorieten",
                    "fr": "Favoris",
                    "it": "Preferiti",
                    "es": "Favoritos"
                },
                "desc": {
                    "en": "List of favorites objects",
                    "de": "Liste der Favoritenobjekte",
                    "ru": "Список избранных объектов",
                    "pt": "Lista de objetos favoritos",
                    "nl": "Lijst met favorietenobjecten",
                    "fr": "Liste des objets favoris",
                    "it": "Elenco di oggetti preferiti",
                    "es": "Lista de objetos favoritos"
                },
                "members": []
            },
            "type": "enum"
        }
    };

    var standardGroups = {
        'enum.rooms': {
            "enum.rooms.living_room": {
                "_id": "enum.rooms.living_room",
                "common": {
                    "icon": "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/PjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ4MC4wNDYgNDgwLjA0NiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDgwLjA0NiA0ODAuMDQ2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PGc+PGc+PHBhdGggZD0iTTMyOC4wMzQsMzIwLjA0NmgtMjR2LTg4YzAtNC40MTgtMy41ODItOC04LThoLTI1NmMtNC40MTgsMC04LDMuNTgyLTgsOHY4OGgtMjRjLTQuNDE4LDAtOCwzLjU4Mi04LDh2MTI4YzAsNC40MTgsMy41ODIsOCw4LDhoMjR2MTZoMTZ2LTE2aDI0MHYxNmgxNnYtMTZoMjRjNC40MTgsMCw4LTMuNTgyLDgtOHYtMTI4QzMzNi4wMzQsMzIzLjYyOCwzMzIuNDUyLDMyMC4wNDYsMzI4LjAzNCwzMjAuMDQ2eiBNODAuMDM0LDQ0OC4wNDZoLTY0di0xMTJoNjRWNDQ4LjA0NnogTTI0MC4wMzQsNDQ4LjA0NmgtMTQ0di02NGgxNDRWNDQ4LjA0NnogTTI0MC4wMzQsMzI4LjA0NnY0MGgtMTQ0di00MGMwLTQuNDE4LTMuNTgyLTgtOC04aC00MHYtODBoMjQwdjgwaC00MEMyNDMuNjE1LDMyMC4wNDYsMjQwLjAzNCwzMjMuNjI4LDI0MC4wMzQsMzI4LjA0NnogTTMyMC4wMzQsNDQ4LjA0NmgtNjR2LTExMmg2NFY0NDguMDQ2eiIvPjwvZz48L2c+PGc+PGc+PHBhdGggZD0iTTQ3OS45NTQsMTUxLjE2NmwtMTYtMTQ0Yy0wLjQ0Ny00LjA0MS0zLjg1NC03LjEwNC03LjkyLTcuMTJoLTExMmMtNC4wOTYtMC4wMjUtNy41NDksMy4wNDktOCw3LjEybC0xNiwxNDRjLTAuMjc2LDIuMjU4LDAuNDIyLDQuNTI4LDEuOTIsNi4yNGMxLjU1LDEuNzE4LDMuNzY3LDIuNjgsNi4wOCwyLjY0aDY0djI3MmgtMzJjLTQuNDE4LDAtOCwzLjU4Mi04LDh2MzJjMCw0LjQxOCwzLjU4Miw4LDgsOGg4MGM0LjQxOCwwLDgtMy41ODIsOC04di0zMmMwLTQuNDE4LTMuNTgyLTgtOC04aC0zMnYtMjcyaDY0YzIuMjg1LDAuMDE3LDQuNDY5LTAuOTQzLDYtMi42NEM0NzkuNTMyLDE1NS42OTQsNDgwLjIzLDE1My40MjUsNDc5Ljk1NCwxNTEuMTY2eiBNNDMyLjAzNCw0NDguMDQ2djE2aC02NHYtMTZINDMyLjAzNHogTTMzNi45OTQsMTQ0LjA0NmwxNC4yNC0xMjhoOTcuNmwxNC4yNCwxMjhIMzM2Ljk5NHoiLz48L2c+PC9nPjxnPjxnPjxwYXRoIGQ9Ik0yNzIuMDM0LDQ4LjA0NmgtNTIuNzJsLTQ1LjYtNDUuNjhjLTMuMTExLTMuMTM3LTguMTc3LTMuMTU4LTExLjMxNC0wLjA0NmMtMC4wMTYsMC4wMTUtMC4wMzEsMC4wMzEtMC4wNDYsMC4wNDZsLTQ1LjYsNDUuNjhoLTUyLjcyYy00LjQxOCwwLTgsMy41ODItOCw4djEyOGMwLDQuNDE4LDMuNTgyLDgsOCw4aDIwOGM0LjQxOCwwLDgtMy41ODIsOC04di0xMjhDMjgwLjAzNCw1MS42MjgsMjc2LjQ1Miw0OC4wNDYsMjcyLjAzNCw0OC4wNDZ6IE0xNjguMDM0LDE5LjMyNmwyOC43MiwyOC43MmgtNTcuNDRMMTY4LjAzNCwxOS4zMjZ6IE0yNjQuMDM0LDE3Ni4wNDZoLTE5MnYtMTEyaDE5MlYxNzYuMDQ2eiIvPjwvZz48L2c+PGc+PGc+PHBhdGggZD0iTTg4LjAzNCw4MC4wNDZ2ODBoMTYwdi04MEg4OC4wMzR6IE0yMzIuMDM0LDE0NC4wNDZoLTEyOHYtNDhoMTI4VjE0NC4wNDZ6Ii8+PC9nPjwvZz48L3N2Zz4=",
                    "name": {
                        "en": "Living room",
                        "de": "Wohnzimmer",
                        "ru": "Гостиная",
                        "pt": "Sala de estar",
                        "nl": "Woonkamer",
                        "fr": "Salon",
                        "it": "Soggiorno",
                        "es": "Sala"
                    },
                    "members": []
                },
                "type": "enum"
            }
            // todo
            //
        },
        'enum.functions': {
            "enum.functions.light": {
                "_id": "enum.functions.light",
                "common": {
                    "icon": "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0ndXRmLTgnPz4KPCFET0NUWVBFIHN2ZyBQVUJMSUMgJy0vL1czQy8vRFREIFNWRyAxLjEvL0VOJyAnaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkJz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA1MTIgNTEyIj4KICA8Zz4KICAgIDxnPgogICAgICA8cGF0aCBkPSJtMjU2LDkyLjNjLTc0LjIsMC0xMjcuOCw1NS4zLTEzNi4zLDExNC43LTUuMywzOS42IDcuNSw3OC4yIDM0LjEsMTA3LjQgMjMuNCwyNSAzNi4yLDU4LjQgMzYuMiw5Mi44bC0uMSw1NC4yYzAsMjEuOSAxOC4xLDM5LjYgNDAuNSwzOS42aDUyLjJjMjIuNCwwIDQwLjUtMTcuNyA0MC41LTM5LjZsLjEtNTQuMmMwLTM1LjQgMTEuNy02Ny44IDM0LjEtOTAuNyAyNC41LTI1IDM3LjMtNTcuMyAzNy4zLTkwLjctMC4xLTc0LjEtNjMtMTMzLjUtMTM4LjYtMTMzLjV6bTQ2LjgsMzY5LjFjMCwxMC40LTguNSwxOC44LTE5LjIsMTguOGgtNTIuMmMtMTAuNywwLTE5LjItOC4zLTE5LjItMTguOHYtMjRoOTAuNXYyNHptMzkuNi0xNTkuNWMtMjYuNiwyNy4xLTQwLjUsNjQuNi00MC41LDEwNS4zdjkuNGgtOTAuNXYtOS40YzAtMzguNi0xNi03Ny4xLTQyLjYtMTA2LjMtMjMuNC0yNS0zMy01Ny4zLTI4LjgtOTAuNyA3LjUtNTAgNTQtOTcgMTE2LjEtOTcgNjUsMCAxMTcuMiw1MS4xIDExNy4yLDExMi42IDAsMjguMS0xMC43LDU1LjItMzAuOSw3Ni4xeiIvPgogICAgICA8cmVjdCB3aWR0aD0iMjEuMyIgeD0iMjQ1LjMiIHk9IjExIiBoZWlnaHQ9IjUwIi8+CiAgICAgIDxwb2x5Z29uIHBvaW50cz0iMzg1LjEsMTA3LjQgNDAwLDEyMi4zIDQzNi41LDg3LjIgNDIxLjUsNzIuMyAgICIvPgogICAgICA8cmVjdCB3aWR0aD0iNTIuMiIgeD0iNDQ4LjgiIHk9IjIzNi4yIiBoZWlnaHQ9IjIwLjkiLz4KICAgICAgPHJlY3Qgd2lkdGg9IjUyLjIiIHg9IjExIiB5PSIyMzYuMiIgaGVpZ2h0PSIyMC45Ii8+CiAgICAgIDxwb2x5Z29uIHBvaW50cz0iOTAuMSw3Mi4yIDc1LjEsODcuMSAxMTEuNiwxMjIuMiAxMjYuNSwxMDcuMyAgICIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==",
                    "name": {
                        "en": "Light",
                        "de": "Licht",
                        "ru": "Свет",
                        "pt": "Luz",
                        "nl": "Licht",
                        "fr": "Lumière",
                        "it": "Soggiorno",
                        "es": "Luz"
                    },
                    "members": []
                },
                "type": "enum"
            }
            // todo
            // Blinds
            // Weather
            // Heating
            // Backlight
            // Household
            //

        }
    };

    var selectId = function () {
        if (!that.$grid || !that.$grid.selectId) return;
        selectId = that.$grid.selectId.bind(that.$grid);
        return that.$grid.selectId.apply(that.$grid, arguments);
    };

    function enumRename(oldId, newId, newCommon, callback) {
        if (tasks.length) {
            var task = tasks.shift();
            if (task.name === 'delObject') {
                that.main.socket.emit(task.name, task.id, function () {
                    setTimeout(function () {
                        enumRename(undefined, undefined, undefined, callback);
                    }, 0);
                });
            } else {
                that.main.socket.emit(task.name, task.id, task.obj, function () {
                    setTimeout(function () {
                        enumRename(undefined, undefined, undefined, callback);
                    }, 0);
                });
            }
        } else {
            _enumRename(oldId, newId, newCommon, function () {
                if (tasks.length) {
                    enumRename(undefined, undefined, undefined, callback);
                } else {
                    if (callback) callback();
                }
            });
        }
    }

    function _enumRename(oldId, newId, newCommon, callback) {
        //Check if this name exists
        if (oldId !== newId && that.main.objects[newId]) {
            showMessage(_('Name yet exists!'), true);
            that.init(true);
            if (callback) callback();
        } else {
            if (oldId === newId) {
                if (newCommon && (newCommon.name !== undefined || newCommon.icon !== undefined || newCommon.color !== undefined)) {
                    tasks.push({name: 'extendObject', id:  oldId, obj: {common: newCommon}});
                }
                if (callback) callback();
            } else if (that.main.objects[oldId] && that.main.objects[oldId].common && that.main.objects[oldId].common.nondeletable) {
                showMessage(_('Change of enum\'s id "%s" is not allowed!', oldId), true);
                that.init(true);
                if (callback) callback();
            } else {
                var leaf = that.$grid.selectId('getTreeInfo', oldId);
                //var leaf = treeFindLeaf(oldId);
                if (leaf && leaf.children) {
                    that.main.socket.emit('getObject', oldId, function (err, obj) {
                        setTimeout(function () {
                            if (obj) {
                                obj._id = newId;
                                if (obj._rev) delete obj._rev;
                                if (newCommon && newCommon.name  !== undefined) obj.common.name  = newCommon.name;
                                if (newCommon && newCommon.icon  !== undefined) obj.common.icon  = newCommon.icon;
                                if (newCommon && newCommon.color !== undefined) obj.common.color = newCommon.color;
                                tasks.push({name: 'delObject', id: oldId});
                                tasks.push({name: 'setObject', id: newId, obj: obj});
                                // Rename all children
                                var count = 0;
                                for (var i = 0; i < leaf.children.length; i++) {
                                    var n = leaf.children[i].replace(oldId, newId);
                                    count++;
                                    _enumRename(leaf.children[i], n, null, function () {
                                        if (!--count && callback) callback();
                                    });
                                }
                            }
                        }, 0);
                    });
                } else {
                    that.main.socket.emit('getObject', oldId, function (err, obj) {
                        if (obj) {
                            setTimeout(function () {
                                obj._id = newId;
                                if (obj._rev) delete obj._rev;
                                if (newCommon && newCommon.name  !== undefined) obj.common.name  = newCommon.name;
                                if (newCommon && newCommon.icon  !== undefined) obj.common.icon  = newCommon.icon;
                                if (newCommon && newCommon.color !== undefined) obj.common.color = newCommon.color;
                                tasks.push({name: 'delObject', id: oldId});
                                tasks.push({name: 'setObject', id: newId, obj: obj});
                                if (callback) callback();
                            }, 0);
                        }
                    });
                }
            }
        }
    }

    function enumAddChild(parent, newId, common, callback) {
        if (that.main.objects[newId]) {
            showMessage(_('Name yet exists!'), true);
            return false;
        }

        that.main.socket.emit('setObject', newId, {
            _id:            newId,
            common:   {
                name:       common.name,
                members:    [],
                icon:       common.icon,
                color:      common.color
            },
            type: 'enum'
        }, callback);
        return true;
    }

    function prepareNewEnum(parent) {
        var text = '';
        var id;
        if (parent) {
            var name = parent.replace(/[.#\\\/&?]+/g, '-');

            if (standardGroups[parent]) {
                for (id in standardGroups[parent]) {
                    if (standardGroups[parent].hasOwnProperty(id) && that.list.indexOf(id) === -1) {
                        text += '<li class="new-group-item" data-id="' + id + '" data-enum="' + parent + '"><a>' + that.main.getIconFromObj(standardGroups[parent][id]) + getName(standardGroups[parent][id]) + '</a></li>';
                    }
                }
            }
            if (text) {
                text += '<li class="divider"></li>';
            }
            text += '<li class="new-group-item" data-enum="' + parent + '"><a><i class="material-icons">control_point</i><span>' + _('custom group') + '</span></a></li>';

            that.$gridEnum.find('#btn-new-group-' + name).html(text);
            that.$gridEnum.find('.btn-new-group-btn[data-target="btn-new-group-' + name + '"]').dropdown({
                constrainWidth: false
            });
            that.$gridEnum.find('#btn-new-group-' + name).find('.new-group-item').on('click', function () {
                var id = $(this).data('id');
                var parent = $(this).data('enum');
                if (!id) {
                    createOrEditEnum(null, parent);
                } else {
                    var name = parent.replace(/[.#\\\/&?]+/g, '-');
                    that.main.saveConfig('enums-active', 'enum-' + name);
                    that.main.socket.emit('setObject', id, standardGroups[parent][id], function (err) {
                        if (err) {
                            that.main.showError(err);
                        }
                    });
                }
            });
        } else {
            for (id in standardEnums) {
                if (standardEnums.hasOwnProperty(id) && that.list.indexOf(id) === -1) {
                    text += '<li class="new-enum-item" data-id="' + id + '"><a>' + that.main.getIconFromObj(standardEnums[id]) + getName(standardEnums[id]) + '</a></li>';
                }
            }

            if (text) {
                text += '<li class="divider"></li>';
            }
            text += '<li class="new-enum-item"><a><i class="material-icons">control_point</i><span>' + _('custom enum') + '</span></a></li>';
            that.$gridEnum.find('#btn-new-enum').html(text);
            that.$gridEnum.find('.btn-new-enum-btn').dropdown({
                constrainWidth: false
            });
            that.$gridEnum.find('.new-enum-item').on('click', function () {
                var id = $(this).data('id');
                if (!id) {
                    createOrEditEnum(null);
                } else {
                    var name = id.replace(/[.#\\\/&?]+/g, '-');
                    that.main.saveConfig('enums-active', 'enum-' + name);
                    that.main.socket.emit('setObject', id, standardEnums[id], function (err) {
                        if (err) {
                            that.main.showError(err);
                        }
                    });
                }
            });
        }
    }

    this.prepare = function () {
    };

    function getName(objects, id) {
        var name;
        if (!id) {
            name = objects;
        } else {
            name = objects[id];
        }
        if (name && name.common && name.common.name) {
            name = name.common.name;
            if (typeof name === 'object') {
                name = name[systemLang] || name.en;
            }
        } else {
            var parts = id.split('.');
            name = parts.pop();
            name = name[0].toUpperCase() + name.substring(1).toLowerCase();
        }
        return name;
    }

    function drawChip(id, group) {
        var text = '';
        text += '<div class="chip" title="' + id + '">' +
            that.main.getIcon(id) +
            '<span>' +
            '<span class="chip-name">' + getName(that.main.objects, id) + '</span>' +
//            '<span class="chip-id">' + id + '</span>' +
            '</span>' +
            '<i class="close material-icons" data-enum="' + group + '" data-id="' + id +'">close</i>' +
            '</div>';
        return text;
    }

    function drawEnum(id, $page, scrollTop) {
        var obj = that.main.objects[id];
        var name = id.replace(/[.#\\\/&?]+/g, '-');
        var text =
            '<div class="row enum-buttons">' +
            '   <div class="col s12">' +
            '       <a class="btn-floating waves-effect waves-light blue btn-small dropdown-trigger btn-new-group-btn" title="' + _('New enum') + '" href="#" data-target="btn-new-group-' + name + '"><i class="material-icons">library_add</i></a>' +
            '       <ul id="btn-new-group-' + name + '" class="dropdown-content" data-id="' + id + '"></ul>' +
            '       <a class="btn-floating waves-effect waves-light btn-small btn-edit-category" title="' + _('Edit category') + '" data-id="' + id + '">' +
            '           <i class="material-icons">edit</i>' +
            '       </a>' +
            '       <a class="btn-floating waves-effect btn-small waves-light red lighten-2 btn-del-category ' + (obj && obj.common && obj.common['object-non-deletable'] ? 'disabled' : '') + '" title="' + _('Delete category') + '" data-id="' + id + '">' +
            '           <i class="material-icons">delete</i>' +
            '       </a>' +
            '   </div>' +
            '</div>';

        text += '<div class="row"><div class="col s12 enum-collection" data-id="' + id + '"><ul class="collection">';

        for (var se = 0; se < that.list.length; se++) {
            if (that.list[se].substring(0, id.length + 1) === id + '.') {
                var en = that.main.objects[that.list[se]];
                var inverted;
                var style = '';
                if (en && en.common && en.common.color) {
                    style = 'background: ' + en.common.color  + '; ';
                    if (that.main.invertColor(en.common.color)) {
                        inverted = true;
                        style += 'color: white;';
                    }
                }

                text += '<li class="collection-item avatar" data-id="' + that.list[se] + '" style="' + style + '">' +
                    that.main.getIcon(that.list[se], null, null, 'circle') +
                    '<span class="title">' + getName(that.main.objects, that.list[se]) + '</span>' +
                    '<p>' + that.list[se] + '</p>';

                if (en && en.common && en.common.members && en.common.members.length) {
                    for (var m = 0; m < en.common.members.length; m++) {
                        text += drawChip(en.common.members[m], that.list[se]);
                    }
                }
                text += '<a class="edit-content"   data-id="' + that.list[se] + '"><i class="material-icons">edit</i></a>';
                text += '<a class="delete-content ' + (en && en.common && en.common['object-non-deletable'] ? 'disabled' : '') + '" data-id="' + that.list[se] + '"><i class="material-icons">delete</i></a>';
                text += '</li>';
            }
        }
        text += '</ul></div></div>';
        $page.html(text);
        prepareNewEnum(id);
        scrollTop && $page.find('.enum-collection').scrollTop(scrollTop);
    }

    function drawEnums() {
        var $tableBody = that.$gridList.find('.tree-table-body');

        var text = '<div class="col s12 cron-main-tab">';
        text += '<ul class="tabs">';
        for (var e = 0; e < that.list.length; e++) {
            var parts = that.list[e].split('.');
            if (parts.length !== 2) continue;
            var name = getName(that.main.objects, that.list[e]);
            var id = that.list[e].replace(/[#.\s_]/g, '-');
            text += '<li class="tab col"><a href="#enum-' + id + '">' + that.main.getIcon(that.list[e]) + '<span>' + name + '</span></a></li>';
        }
        text += '</ul>';
        text += '</div>';
        for (var se = 0; se < that.list.length; se++) {
            var parts = that.list[se].split('.');
            if (parts.length !== 2) continue;

            var id = that.list[se].replace(/[#.\s_]/g, '-');
            text += '<div id="enum-' + id + '" class="col s12 page" data-id="' + that.list[se] + '" data-type="second">';
            text += '</div>';
        }
        var scrollTop = {};
        $tableBody.find('.enum-collection').each(function () {
            // remember actual offset
            scrollTop[$(this).data('id')] = $(this).scrollTop();
        });
        $tableBody.html(text);

        $tableBody.find('.tabs').mtabs({
            onShow: function (tab) {
                that.main.saveConfig('enums-active', $(tab).attr('id'));
            }
        });

        if (that.main.config['enums-active'] && !that.main.noSelect) {
            $tableBody.find('.tabs').mtabs('select', that.main.config['enums-active']);
        }

        $tableBody.find('.page').each(function () {
            drawEnum($(this).data('id'), $(this), scrollTop[$(this).data('id')]);
        });
        $tableBody.find('.btn-new-category').on('click', function () {
            createOrEditEnum(null, $(this).data('id'));
        });
        $tableBody.find('.btn-edit-category').on('click', function () {
            createOrEditEnum($(this).data('id'));
        });
        $tableBody.find('.btn-del-category').on('click', function () {
            deleteEnum($(this).data('id'));
        });
        $tableBody.find('.edit-content').on('click', function () {
            createOrEditEnum($(this).data('id'));
        });
        $tableBody.find('.delete-content').on('click', function () {
            deleteEnum($(this).data('id'));
        });
        $tableBody.find('.close').on('click', function () {
            removeMember($(this).data('id'), $(this).data('enum'));
        });
    }

    function getEnumsChildren(id) {
        var parts = id.split('.');
        var items = [];
        var regex = new RegExp('^' + id.replace(/\./g, '\\.') + '\\.');
        for (var se = 0; se < that.list.length; se++) {
            var _parts = that.list[se].split('.');
            if (_parts.length === parts.length + 1 && regex.test(that.list[se])) {
                items.push(that.list[se]);
            }
        }
        return items;
    }
    
    function deleteEnum(id) {
        if (that.main.objects[id].type === 'enum') {
            var children = getEnumsChildren(id);
            
            if (children && children.length) {
                // ask if only object must be deleted or just this one
                that.main.confirmMessage(_('All sub-enums of %s will be deleted too?', id), null, 'help', function (result) {
                    // If all
                    if (result) {
                        that.main._delObjects(id, true, function (err) {
                            if (!err) {
                                showMessage(_('Deleted'));
                            } else {
                                showMessage(_('Error: %s', err), true);
                            }
                        });
                    } // else do nothing
                });
            } else {
                that.main.confirmMessage(_('Are you sure to delete %s?', id), null, 'help', function (result) {
                    // If all
                    if (result) that.main._delObjects(id, true, function (err) {
                        if (!err) {
                            showMessage(_('Deleted'));
                        } else {
                            showMessage(_('Error: %s', err), true);
                        }
                    });
                });
            }
        }
    }
    
    function removeMember(id, parent) {
        that.main.socket.emit('getObject', parent, function (err, obj) {
            if (obj && obj.common && obj.common.members) {
                var pos = obj.common.members.indexOf(id);
                if (pos !== -1) {
                    obj.common.members.splice(pos, 1);
                    that.main.socket.emit('setObject', obj._id, obj, function (err) {
                        if (!err) {
                            showMessage(_('Removed'));
                        } else {
                            showMessage(_('Error: %s', err), true);
                        }
                    });
                } else {
                    showMessage(_('%s is not in the list'));
                }
            }
        });
        
    }
    
    function showMessage(text, duration, isError) {
        if (typeof duration === 'boolean') {
            isError = duration;
            duration = 3000;
        }
        that.main.showToast(that.$gridEnum.find('.tree-table-buttons'), text, null, duration, isError);
    }

    function setupDraggable() {
        that.$gridEnum.find('.fancytree-container>tbody')
            .sortable({
                connectWith:    '#tab-enums .tab-enums-list .tree-table-main.treetable',
                items:          '.fancytree-type-draggable',
                appendTo:       that.$gridEnum,
                refreshPositions: true,
                helper:         function (e, $target) {
                    return $('<div class="fancytree-drag-helper">' + $target.find('.fancytree-title').text() + '</div>');
                },
                zIndex:         999990,
                revert:         false,
                scroll:         false,
                start:          function (e, ui) {
                    var $prev = ui.item.prev();
                    // place this item back where it was
                    ui.item.data('prev', $prev);
                    that.$gridEnum.addClass('dragging');
                },
                stop:           function (e, ui) {
                    that.$gridEnum.removeClass('dragging');
                },
                update: function (event, ui) {
                    // place this item back where it was
                    var $prev = ui.item.data('prev');
                    if (!$prev || !$prev.length) {
                        $(this).prepend(ui.item);
                    } else {
                        $($prev).after(ui.item);
                    }
                }
            })
            .disableSelection();
    }

    this._initObjectTree = function () {
        var settings = {
            objects:  main.objects,
            noDialog: true,
            draggable: ['device', 'channel', 'state'],
            name:     'enum-objects',
            expertModeRegEx: /^system\.|^iobroker\.|^_|^[\w-]+$|^enum\.|^[\w-]+\.admin|^script\./,
            texts: {
                select:   _('Select'),
                cancel:   _('Cancel'),
                all:      _('All'),
                id:       _('ID'),
                ID:       _('ID'),
                name:     _('Name'),
                role:     _('Role'),
                room:     _('Room'),
                'function': _('Function'),
                value:    _('Value'),
                type:     _('Type'),
                selectid: _('Select ID'),
                from:     _('From'),
                lc:       _('Last changed'),
                ts:       _('Time stamp'),
                wait:     _('Processing...'),
                ack:      _('Acknowledged'),
                edit:     _('Edit'),
                push:     _('Trigger event'),
                ok:       _('Ok'),
                with:     _('With'),
                without:  _('Without'),
                copyToClipboard: _('Copy to clipboard'),
                expertMode: _('Toggle expert mode'),
                refresh:	_('Update'),
                sort:       _('Sort alphabetically'),
                button:     _('Settings'),
                noData:     _('No data')
            },
            filter: {
                type: 'state'
            },
            columns: ['ID', 'name', 'type', 'role']
        };

        selectId('init', settings)
            .selectId('show');

        setupDraggable();

        var $collection = this.$gridEnum.find('.tree-table-body .collection');
        setupDroppable($collection);
    };

    /*function setupDroppable($treetable) {
        if (!that.editMode) return;

        $treetable.find('tbody>tr.treetable-enum').droppable({
            accept: '.fancytree-type-draggable',
            over: function (e, ui) {
                $(this).addClass('tab-accept-item');
                if ($(this).hasClass('not-empty') && !$(this).hasClass('expanded')) {
                    var id = $(this).data('tt-id');
                    var timer;
                    if ((timer = $(this).data('timer'))) {
                        clearTimeout(timer);
                    }
                    $(this).data('timer', setTimeout(function () {
                        that.$gridList.treeTable('expand', $(this).data('tt-id'));
                    }, 1000));
                }
            },
            out: function (e, ui) {
                $(this).removeClass('tab-accept-item');
                var timer;
                if ((timer = $(this).data('timer'))) {
                    clearTimeout(timer);
                    $(this).data('timer', null);
                }
            },
            tolerance: 'pointer',
            drop: function (e, ui) {
                $(this).removeClass('tab-accept-item');
                var id = ui.draggable.data('id');
                var enumId = $(this).data('tt-id');

                that.main.socket.emit('getObject', enumId, function (err, obj) {
                    if (obj && obj.common) {
                        obj.common.members = obj.common.members || [];
                        var pos = obj.common.members.indexOf(id);
                        if (pos === -1) {
                            obj.common.members.push(id);
                            obj.common.members.sort();
                            that.main.socket.emit('setObject', obj._id, obj, function (err) {
                                if (!err) {
                                    showMessage(_('%s added to %s', id, obj._id));
                                } else {
                                    showMessage(_('Error: %s', err), true);
                                }
                            });
                        } else {
                            showMessage(_('Is yet in the list'));
                        }
                    }
                });
            }
        });
    }*/
    function setupDroppable($collection) {
        if (!that.editMode) return;

        $collection.find('.collection-item').droppable({
            accept: '.fancytree-type-draggable',
            over: function (e, ui) {
                $(this).addClass('tab-accept-item');
                /*if ($(this).hasClass('not-empty') && !$(this).hasClass('expanded')) {
                    var id = $(this).data('tt-id');
                    var timer;
                    if ((timer = $(this).data('timer'))) {
                        clearTimeout(timer);
                    }
                    $(this).data('timer', setTimeout(function () {
                        that.$gridList.treeTable('expand', $(this).data('tt-id'));
                    }, 1000));
                }*/
            },
            out: function (e, ui) {
                $(this).removeClass('tab-accept-item');
                /*var timer;
                if ((timer = $(this).data('timer'))) {
                    clearTimeout(timer);
                    $(this).data('timer', null);
                }*/
            },
            tolerance: 'pointer',
            drop: function (e, ui) {
                $(this).removeClass('tab-accept-item');
                var id = ui.draggable.data('id');
                var enumId = $(this).data('id');

                that.main.socket.emit('getObject', enumId, function (err, obj) {
                    if (obj && obj.common) {
                        obj.common.members = obj.common.members || [];
                        var pos = obj.common.members.indexOf(id);
                        if (pos === -1) {
                            obj.common.members.push(id);
                            obj.common.members.sort();
                            that.main.socket.emit('setObject', obj._id, obj, function (err) {
                                if (!err) {
                                    showMessage(_('%s added to %s', id, obj._id));
                                } else {
                                    showMessage(_('Error: %s', err), true);
                                }
                            });
                        } else {
                            showMessage(_('Is yet in the list'));
                        }
                    }
                });
            }
        });
    }

    function createOrEditEnum(id, parentId) {
        var idChanged = false;
        var $dialog = that.$gridEnum.find('#tab-enums-dialog-new');
        var oldId   = '';

        var nameVal  = '';
        var idVal    = '';
        var iconVal  = '';
        var colorVal = '';

        var isIdEditable = true;

        installFileUpload($dialog, 50000, function (err, text) {
            if (err) {
                showMessage(err, true);
            } else {
                if (!text.match(/^data:image\//)) {
                    showMessage(_('Unsupported image format'), true);
                    return;
                }
                $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                iconVal   = text;

                $dialog.find('.tab-enums-dialog-new-icon').show().html('<img class="" />');
                $dialog.find('.tab-enums-dialog-new-icon').attr('src', text);
                $dialog.find('.tab-enums-dialog-new-icon-clear').show();
            }
        });

        if (id) {
            if (that.main.objects[id] && that.main.objects[id].common) {
                nameVal      = that.main.objects[id].common.name;
                if (typeof nameVal === 'object') {
                    nameVal = nameVal[systemLang] || nameVal.en;
                }
                iconVal      = that.main.objects[id].common.icon;
                colorVal     = that.main.objects[id].common.color;
                isIdEditable = !that.main.objects[id].common['object-non-deletable'];
            }
            oldId = id;
            idVal = id;
        }

        $dialog.find('.tab-enums-dialog-new-title').text(parentId ? _('Create new category') : (idVal ? _('Rename') : _('Create new enum')));

        if (idVal) {
            var parts = idVal.split('.');
            if (parts.length <= 2) {
                id = true;
            }
            idVal = parts.pop();
            parentId = parts.join('.');
        }

        $dialog.find('#tab-enums-dialog-new-name')
            .val(nameVal)
            .off('change')
            .on('change', function () {
                var $id = $('#tab-enums-dialog-new-id');
                var id = $id.val();
                var val = $(this).val();
                val = val.replace(/[.\s]/g, '_').trim().toLowerCase();
                if (isIdEditable && (!id || !idChanged)) {
                    $id.val(val);
                    $dialog.find('#tab-enums-dialog-new-preview').val((parentId || 'enum') + '.' + (val || '#'));
                    // detect materialize
                    M.updateTextFields('#tab-enums-dialog-new');
                }
                if ($id.val() && !$id.val().match(/[.\s]/)) {
                    $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                    $id.removeClass('wrong');
                } else {
                    $dialog.find('.tab-enums-dialog-create').addClass('disabled');
                    $id.addClass('wrong');
                }
            }).off('keyup').on('keyup', function () {
                $(this).trigger('change');
            });

        $dialog.find('#tab-enums-dialog-new-id')
            .val(idVal)
            .off('change')
            .on('change', function () {
                idChanged = true;
                var val = $(this).val();
                $dialog.find('#tab-enums-dialog-new-preview').val((parentId || 'enum') + '.' + ($(this).val() || '#'));
                M.updateTextFields('#tab-enums-dialog-new');

                if (val && !val.match(/[.\s]/)) {
                    $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                    $(this).removeClass('wrong');
                } else {
                    $dialog.find('.tab-enums-dialog-create').addClass('disabled');
                    $(this).addClass('wrong');
                }
            }).off('keyup').on('keyup', function () {
                $(this).trigger('change');
            });

        $dialog.find('#tab-enums-dialog-new-id').prop('disabled', !isIdEditable);

        $dialog.find('.tab-enums-dialog-create')
            .addClass('disabled')
            .off('click')
            .text(oldId ? _('Change') : _('Create'))
            .on('click', function () {
                if (oldId) {
                    enumRename(
                        oldId,
                        parentId + '.' + $('#tab-enums-dialog-new-id').val(),
                        {
                            name:  $('#tab-enums-dialog-new-name').val(),
                            icon:  iconVal,
                            color: colorVal
                        },
                        function (err) {
                        if (err) {
                            showMessage(_('Error: %s', err), true);
                        } else {
                            showMessage(_('Updated'));
                        }
                    });
                } else {
                    enumAddChild(
                        parentId,
                        (parentId || 'enum') + '.' + $('#tab-enums-dialog-new-id').val(),
                        {
                            name:  $dialog.find('#tab-enums-dialog-new-name').val(),
                            icon:  iconVal,
                            color: colorVal
                        },
                        function (err) {
                        if (err) {
                            showMessage(_('Error: %s', err), true, 5000);
                        } else {
                            showMessage(_('Updated'));
                        }
                    });
                }
            });

        $dialog.find('#tab-enums-dialog-new-preview').val((parentId || 'enum') + '.' + (idVal || '#'));

        if (iconVal) {
            $dialog.find('.tab-enums-dialog-new-icon').show().html(that.main.getIcon(oldId));
            $dialog.find('.tab-enums-dialog-new-icon-clear').show();
        } else {
            $dialog.find('.tab-enums-dialog-new-icon').hide();
            $dialog.find('.tab-enums-dialog-new-icon-clear').hide();
        }
        colorVal = colorVal || false;
        if (colorVal) {
            $dialog.find('.tab-enums-dialog-new-color').val(colorVal);
        } else {
            $dialog.find('.tab-enums-dialog-new-color').val();
        }

        M.updateTextFields('#tab-enums-dialog-new');
        that.main.showToast($dialog, _('Drop the icons here'));

        $dialog.find('.tab-enums-dialog-new-upload').off('click').on('click', function () {
            $dialog.find('.drop-file').trigger('click');
        });
        $dialog.find('.tab-enums-dialog-new-icon-clear').off('click').on('click', function () {
            if (iconVal) {
                iconVal = '';
                $dialog.find('.tab-enums-dialog-new-icon').hide();
                $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                $dialog.find('.tab-enums-dialog-new-icon-clear').hide();
            }
        });
        $dialog.find('.tab-enums-dialog-new-color-clear').off('click').on('click', function () {
            if (colorVal) {
                $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                $dialog.find('.tab-enums-dialog-new-color-clear').hide();
                $dialog.find('.tab-enums-dialog-new-colorpicker').colorpicker({
                    component: '.btn',
                    color: colorVal,
                    container: $dialog.find('.tab-enums-dialog-new-colorpicker')
                }).colorpicker('setValue', '');
                colorVal = '';
            }
        });
        var time = Date.now();
        try {
            $dialog.find('.tab-enums-dialog-new-colorpicker').colorpicker('destroy');
        } catch (e) {

        }
        $dialog.find('.tab-enums-dialog-new-colorpicker').colorpicker({
            component: '.btn',
            color: colorVal,
            container: $dialog.find('.tab-enums-dialog-new-colorpicker')
        }).colorpicker('setValue', colorVal).on('showPicker.colorpicker', function (/* event */) {
            //$dialog.find('.tab-enums-dialog-new-colorpicker')[0].scrollIntoView(false);
            var $modal = $dialog.find('.modal-content');
            $modal[0].scrollTop = $modal[0].scrollHeight;
        }).on('changeColor.colorpicker', function (event){
            if (Date.now() - time > 100) {
                colorVal = event.color.toHex();
                $dialog.find('.tab-enums-dialog-create').removeClass('disabled');
                $dialog.find('.tab-enums-dialog-new-icon-clear').show();
            }
        });
        if (colorVal) {
            $dialog.find('.tab-enums-dialog-new-color-clear').show();
        } else {
            $dialog.find('.tab-enums-dialog-new-color-clear').hide();
        }

        $dialog.modal().modal('open');
    }

    function switchEditMode(isEnabled) {
        that.editMode = isEnabled;
        var $editButton = that.$gridEnum.find('#tab-enums-list-edit');

        if (that.editMode) {
            $editButton.removeClass('blue').addClass('red');
            that.$gridEnum.addClass('tab-enums-edit');
            that._initObjectTree();
            showMessage(_('You can drag&drop the devices, channels and states to enums'));
        } else {
            selectId('destroy');
            try {
                that.$gridEnum.find('.treetable-list').droppable('destroy');
            } catch (e) {
                console.error(e);
            }

            $editButton.removeClass('red').addClass('blue');
            that.$gridEnum.removeClass('tab-enums-edit');
        }
    }

    this._postInit = function () {
        if (typeof this.$gridList !== 'undefined') {
            prepareNewEnum();
            drawEnums();
            if (this.editMode) {
                this._initObjectTree();
            } else {
                selectId('destroy');
            }

            this.$gridList.find('.btn-edit').off('click').on('click', function () {
                switchEditMode(!that.editMode);
            });

            // extract all enums
            /*
            this.$gridList.treeTable({
                objects:    this.main.objects,
                root:       'enum',
                columns:    ['title', 'name'],
                members:    true,
                colors:     true,
                icons:      true,
                widths:     ['calc(100% - 250px)', '250px'],
                //classes:    ['', 'treetable-center'],
                name:       'enums',
                buttonsWidth: '40px',
                buttons:    [
                    {
                        text: false,
                        icons: {
                            primary:'ui-icon-trash'
                        },
                        click: function (id, children, parent) {
                            if (that.main.objects[id]) {
                                if (that.main.objects[id].type === 'enum') {
                                    if (children) {
                                        // ask if only object must be deleted or just this one
                                        that.main.confirmMessage(_('All sub-enums of %s will be deleted too?', id), null, 'help', function (result) {
                                            // If all
                                            if (result) {
                                                that.main._delObjects(id, true, function (err) {
                                                    if (!err) {
                                                        showMessage(_('Deleted'));
                                                    } else {
                                                        showMessage(_('Error: %s', err), true);
                                                    }
                                                });
                                            } // else do nothing
                                        });
                                    } else {
                                        that.main.confirmMessage(_('Are you sure to delete %s?', id), null, 'help', function (result) {
                                            // If all
                                            if (result) that.main._delObjects(id, true, function (err) {
                                                if (!err) {
                                                    showMessage(_('Deleted'));
                                                } else {
                                                    showMessage(_('Error: %s', err), true);
                                                }
                                            });
                                        });
                                    }
                                } else {
                                    that.main.socket.emit('getObject', parent, function (err, obj) {
                                        if (obj && obj.common && obj.common.members) {
                                            var pos = obj.common.members.indexOf(id);
                                            if (pos !== -1) {
                                                obj.common.members.splice(pos, 1);
                                                that.main.socket.emit('setObject', obj._id, obj, function (err) {
                                                    if (!err) {
                                                        showMessage(_('Removed'));
                                                    } else {
                                                        showMessage(_('Error: %s', err), true);
                                                    }
                                                });
                                            } else {
                                                showMessage(_('%s is not in the list'));
                                            }
                                        }
                                    });
                                }
                            } else {
                                showMessage(_('Object "<b>%s</b>" does not exists. Update the page.', id));
                            }
                        },
                        width: 26,
                        height: 20
                    }, {
                        text: false,
                        icons: {
                            primary:'ui-icon-pencil'
                        },
                        match: function (id) {
                            return that.main.objects[id] && that.main.objects[id].type === 'enum';
                        },
                        click: function (id, children, parent) {
                            createOrEditEnum(id);
                        },
                        width: 26,
                        height: 20
                    }
                ],
                panelButtons: [
                    {
                        id:   'tab-enums-list-new-enum',
                        title: _('New enum'),
                        icon:   'note_add',
                        click: function () {
                            createOrEditEnum(false);
                        }
                    },
                    {
                        id:   'tab-enums-list-new-category',
                        title:   _('New category'),
                        icon:   'library_add',
                        click: function () {
                            createOrEditEnum(true);
                        }
                    },
                    {
                        id:   'tab-enums-list-edit',
                        title: _('Edit'),
                        icon:   'edit',
                        click: function () {
                            switchEditMode(!that.editMode);
                        }
                    }
                ],
                onChange:   function (id, oldId) {
                    if (id !== oldId) {
                        that.enumEdit = id;
                        var obj = that.main.objects[id];
                        if (obj && obj.type === 'enum') {
                            $('#tab-enums-list-new-enum').removeClass('disabled').attr('title', _('Create new enum, like %s', id + '.newEnum'));
                            var parts = id.split('.');
                            if (parts.length === 2) {
                                $('#tab-enums-list-new-category').removeClass('disabled').attr('title', _('Create new category, like %s', 'enum.newCategory'));
                            } else {
                                $('#tab-enums-list-new-category').addClass('disabled');
                            }
                        } else {
                            $('#tab-enums-list-new-enum').addClass('disabled');
                            $('#tab-enums-list-new-category').addClass('disabled');
                        }
                    }
                },
                onReady:    setupDroppable
            });//.treeTable('show', currentEnum);
            $('#tab-enums-list-new-enum').addClass('disabled');
            $('#tab-enums-list-new-category').addClass('disabled');
            */
        }
    };

    this.init = function (update) {
        if (this.inited && !update) {
            return;
        }
        if (!this.main || !this.main.objectsLoaded) {
            setTimeout(function () {
                that.init(update);
            }, 250);
            return;
        }

        this._postInit();

        if (!this.inited) {
            this.inited = true;
            this.main.subscribeObjects('enum.*');
        }
    };

    this.destroy = function () {
        if (this.inited) {
            this.inited = false;
            // subscribe objects and states
            this.main.unsubscribeObjects('enum.*');
        }
        switchEditMode(false);
        this.$gridList.treeTable('destroy');
    };

    this.objectChange = function (id, obj) {
        //Update enums
        if (id.match(/^enum\./)) {
            if (obj) {
                if (this.list.indexOf(id) === -1) this.list.push(id);
            } else {
                var j = this.list.indexOf(id);
                if (j !== -1) this.list.splice(j, 1);
            }

            if (this.updateTimers) clearTimeout(this.updateTimers);

            this.updateTimers = setTimeout(function () {
                that.updateTimers = null;
                that._postInit();
            }, 200);
        }

        if (this.$grid) selectId('object', id, obj);
    };
}
