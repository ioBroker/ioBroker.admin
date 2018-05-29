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
    this.isTiles      = false;

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
                "dontDelete": true
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
                "dontDelete": true
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
            },
            "enum.rooms.sleeping_room": {
                "_id": "enum.rooms.sleeping_room",
                "common": {
                    "icon": "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNDgwIDQ4MCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDgwIDQ4MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPHBhdGggZD0iTTQ2NCwyNjRWODhIMTZ2MTc2SDB2ODBoNDh2NDhoNjR2LTQ4aDI1NnY0OGg2NHYtNDhoNDh2LTgwSDQ2NHogTTMyLDEwNGg0MTZ2MTYwaC0xNnYtMjRjMC0yMi4wOTEtMTcuOTA5LTQwLTQwLTQwDQoJCWgtMTIuNDhjMi45MDgtNC44MzIsNC40NTYtMTAuMzYsNC40OC0xNmMwLTE3LjY3My0xNC4zMjctMzItMzItMzJoLTY0Yy0xNy42NzMsMC0zMiwxNC4zMjctMzIsMzINCgkJYzAuMDI0LDUuNjQsMS41NzIsMTEuMTY4LDQuNDgsMTZoLTQwLjk2YzIuOTA4LTQuODMyLDQuNDU2LTEwLjM2LDQuNDgtMTZjMC0xNy42NzMtMTQuMzI3LTMyLTMyLTMyaC02NA0KCQljLTE3LjY3MywwLTMyLDE0LjMyNy0zMiwzMmMwLjAyNCw1LjY0LDEuNTcyLDExLjE2OCw0LjQ4LDE2SDg4Yy0yMi4wOTEsMC00MCwxNy45MDktNDAsNDB2MjRIMzJWMTA0eiBNMzkyLDIxNg0KCQljMTMuMjU1LDAsMjQsMTAuNzQ1LDI0LDI0djI0SDY0di0yNGMwLTEzLjI1NSwxMC43NDUtMjQsMjQtMjRIMzkyeiBNMTEyLDE4NGMwLTguODM3LDcuMTYzLTE2LDE2LTE2aDY0YzguODM3LDAsMTYsNy4xNjMsMTYsMTYNCgkJcy03LjE2MywxNi0xNiwxNmgtNjRDMTE5LjE2MywyMDAsMTEyLDE5Mi44MzcsMTEyLDE4NHogTTI3MiwxODRjMC04LjgzNyw3LjE2My0xNiwxNi0xNmg2NGM4LjgzNywwLDE2LDcuMTYzLDE2LDE2DQoJCXMtNy4xNjMsMTYtMTYsMTZoLTY0QzI3OS4xNjMsMjAwLDI3MiwxOTIuODM3LDI3MiwxODR6IE05NiwzNzZINjR2LTMyaDMyVjM3NnogTTQxNiwzNzZoLTMydi0zMmgzMlYzNzZ6IE00NjQsMzI4SDE2di00OGg0NDhWMzI4DQoJCXoiLz4NCjwvZz4NCjxnPg0KCTxyZWN0IHg9IjQ4IiB5PSIxMjAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIvPg0KPC9nPg0KPGc+DQoJPHJlY3QgeD0iNDE2IiB5PSIxMjAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIvPg0KPC9nPg0KPGc+DQoJPHJlY3QgeD0iODAiIHk9IjEyMCIgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxNiIvPg0KPC9nPg0KPGc+DQoJPHJlY3QgeD0iNDgiIHk9IjE1MiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjQwIi8+DQo8L2c+DQo8Zz4NCgk8cmVjdCB4PSI0MTYiIHk9IjE1MiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjQwIi8+DQo8L2c+DQoNCjwvc3ZnPg0K",
                    "name": {
                        "en": "Sleeping room",
                        "de": "Schlafzimmer",
                        "ru": "Спальня",
                        "pt": "Quarto de dormir",
                        "nl": "Slaapkamer",
                        "fr": "Chambre à coucher",
                        "it": "Camera da letto",
                        "es": "Dormitorio",
                        "pl": "Sypialnia"
                    },
                    "members": []
                },
                "type": "enum"
            },
            "enum.rooms.kitchen": {
                "_id": "enum.rooms.kitchen",
                "common": {
                    "icon": "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNDgwIDQ4MCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDgwIDQ4MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPHBhdGggZD0iTTAsMjA4djQ4aDE2djIyNGg0NDhWMjU2aDE2di00OEgweiBNMjA4LDQ2NEgzMlYyNTZoMTc2VjQ2NHogTTI4OCw0NjRoLTY0VjMyMGg2NFY0NjR6IE0zNjgsNDY0aC02NFYzMjBoNjRWNDY0eg0KCQkgTTQ0OCw0NjRoLTY0VjMyMGg2NFY0NjR6IE00NDgsMzA0SDIyNHYtNDhoMjI0VjMwNHogTTQ2NCwyNDBIMTZ2LTE2aDQ0OFYyNDB6Ii8+DQo8L2c+DQo8Zz4NCgk8cGF0aCBkPSJNNDgsMzM2djExMmgxNDRWMzM2SDQ4eiBNMTc2LDQzMkg2NHYtODBoMTEyVjQzMnoiLz4NCjwvZz4NCjxnPg0KCTxwYXRoIGQ9Ik03MiwyNzJjLTEzLjI1NSwwLTI0LDEwLjc0NS0yNCwyNHMxMC43NDUsMjQsMjQsMjRzMjQtMTAuNzQ1LDI0LTI0Uzg1LjI1NSwyNzIsNzIsMjcyeiBNNzIsMzA0Yy00LjQxOCwwLTgtMy41ODItOC04DQoJCQlzMy41ODItOCw4LThzOCwzLjU4Miw4LDhTNzYuNDE4LDMwNCw3MiwzMDR6Ii8+DQo8L2c+DQo8Zz4NCgk8cGF0aCBkPSJNMTY4LDI3MmMtMTMuMjU1LDAtMjQsMTAuNzQ1LTI0LDI0czEwLjc0NSwyNCwyNCwyNHMyNC0xMC43NDUsMjQtMjRTMTgxLjI1NSwyNzIsMTY4LDI3MnogTTE2OCwzMDRjLTQuNDE4LDAtOC0zLjU4Mi04LTgNCgkJczMuNTgyLTgsOC04czgsMy41ODIsOCw4UzE3Mi40MTgsMzA0LDE2OCwzMDR6Ii8+DQo8L2c+DQo8Zz4NCgk8cmVjdCB4PSIzMDQiIHk9IjI3MiIgd2lkdGg9IjY0IiBoZWlnaHQ9IjE2Ii8+DQo8L2c+DQo8Zz4NCgk8cmVjdCB4PSIyNTYiIHk9IjMzNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+DQo8L2c+DQo8Zz4NCgk8cmVjdCB4PSIzMzYiIHk9IjM2OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjMyIi8+DQo8L2c+DQo8Zz4NCgk8cmVjdCB4PSI0MDAiIHk9IjM2OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjMyIi8+DQo8L2c+DQo8Zz4NCgk8cGF0aCBkPSJNMjA4LDB2ODYuMDhsLTI0LTQ4VjBINDB2MzguMDhMMC44OCwxMTYuNGMtMS45ODgsMy45NDYtMC40MDEsOC43NTYsMy41NDQsMTAuNzQ0QzUuNTM0LDEyNy43MDMsNi43NTgsMTI3Ljk5Niw4LDEyOGg0NzINCgkJVjBIMjA4eiBNNTYsMTZoMTEydjE2SDU2VjE2eiBNMjAuOTYsMTEybDMyLTY0aDExOC4wOGwzMiw2NEgyMC45NnogTTMzNiwxMTJIMjI0VjE2aDExMlYxMTJ6IE00NjQsMTEySDM1MlYxNmgxMTJWMTEyeiIvPg0KPC9nPg0KPGc+DQoJPHJlY3QgeD0iMzA0IiB5PSI4MCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+DQo8L2c+DQo8Zz4NCgk8cmVjdCB4PSIzNjgiIHk9IjgwIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiLz4NCjwvZz4NCjxnPg0KCTxyZWN0IHg9Ijk2IiB5PSIzNjgiIHdpZHRoPSI0OCIgaGVpZ2h0PSIxNiIvPg0KPC9nPg0KPC9zdmc+DQo=",
                    "name": {
                        "en": "Kitchen",
                        "de": "Küche",
                        "ru": "Кухня",
                        "pt": "Cozinha",
                        "nl": "Keuken",
                        "fr": "Cuisine",
                        "it": "Cucina",
                        "es": "Cocina",
                        "pl": "Kuchnia"
                    },
                    "members": []
                },
                "type": "enum"
            },
            "enum.rooms.office": {
                "_id": "enum.rooms.office",
                "common": {
                    "icon": "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNDgwIDQ4MCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDgwIDQ4MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJCTxwYXRoIGQ9Ik0yMjQsMTIwdjExMmgyMjRWMTIwSDIyNHogTTQzMiwyMTZIMjQwdi04MGgxOTJWMjE2eiIvPg0KPC9nPg0KPGc+DQoJCTxwYXRoIGQ9Ik0zMzYsMTUyYy0xMy4yNTUsMC0yNCwxMC43NDUtMjQsMjRzMTAuNzQ1LDI0LDI0LDI0czI0LTEwLjc0NSwyNC0yNFMzNDkuMjU1LDE1MiwzMzYsMTUyeiBNMzM2LDE4NGMtNC40MTgsMC04LTMuNTgyLTgtOA0KCQkJczMuNTgyLTgsOC04czgsMy41ODIsOCw4UzM0MC40MTgsMTg0LDMzNiwxODR6Ii8+DQo8L2c+DQo8Zz4NCgkJPHBhdGggZD0iTTE3Niw4OFY0OGMwLTQuNDE4LTMuNTgyLTgtOC04aC04VjE2YzAtNC40MTgtMy41ODItOC04LThINDBjLTQuNDE4LDAtOCwzLjU4Mi04LDh2MjRoLThjLTQuNDE4LDAtOCwzLjU4Mi04LDh2NDBIMHYzODQNCgkJCWgyMDhWMjY0aDIwOHYyMDhoNjRWODhIMTc2eiBNNDgsMjRoOTZ2MTZINDhWMjR6IE0zMiw1NmgxMjh2MzJIMzJWNTZ6IE0xOTIsNDU2SDE2VjIwMGgxNzZWNDU2eiBNMTkyLDE4NEgxNnYtODBoMTc2VjE4NHoNCgkJCSBNNDY0LDQ1NmgtMzJWMjY0aDMyVjQ1NnogTTQ2NCwyNDhIMjA4VjEwNGgyNTZWMjQ4eiIvPg0KPC9nPg0KPGc+DQoJCTxyZWN0IHg9IjgwIiB5PSIxMzYiIHdpZHRoPSI0OCIgaGVpZ2h0PSIxNiIvPg0KPC9nPg0KPGc+DQoJCTxwYXRoIGQ9Ik0xNTIsMjE2Yy0xMy4yNTUsMC0yNCwxMC43NDUtMjQsMjRzMTAuNzQ1LDI0LDI0LDI0czI0LTEwLjc0NSwyNC0yNFMxNjUuMjU1LDIxNiwxNTIsMjE2eiBNMTUyLDI0OGMtNC40MTgsMC04LTMuNTgyLTgtOA0KCQkJczMuNTgyLTgsOC04czgsMy41ODIsOCw4UzE1Ni40MTgsMjQ4LDE1MiwyNDh6Ii8+DQo8L2c+DQo8L3N2Zz4NCg==",
                    "name": {
                        "en": "Office",
                        "de": "Büro",
                        "ru": "офис",
                        "pt": "Escritório",
                        "nl": "Kantoor",
                        "fr": "Bureau",
                        "it": "Ufficio",
                        "es": "Oficina",
                        "pl": "Gabinet"
                    },
                    "members": []
                },
                "type": "enum"
            },
            "enum.rooms.nursery": {
                "_id": "enum.rooms.nursery",
                "common": {
                    "icon": "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNDgwIDQ4MCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDgwIDQ4MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPHBhdGggZD0iTTQwLDQzMmMtMTMuMjU1LDAtMjQsMTAuNzQ1LTI0LDI0czEwLjc0NSwyNCwyNCwyNHMyNC0xMC43NDUsMjQtMjRTNTMuMjU1LDQzMiw0MCw0MzJ6IE00MCw0NjRjLTQuNDE4LDAtOC0zLjU4Mi04LTgNCgkJczMuNTgyLTgsOC04czgsMy41ODIsOCw4UzQ0LjQxOCw0NjQsNDAsNDY0eiIvPg0KPC9nPg0KPGc+DQoJPHBhdGggZD0iTTQ0MCw0MzJjLTEzLjI1NSwwLTI0LDEwLjc0NS0yNCwyNHMxMC43NDUsMjQsMjQsMjRzMjQtMTAuNzQ1LDI0LTI0UzQ1My4yNTUsNDMyLDQ0MCw0MzJ6IE00NDAsNDY0Yy00LjQxOCwwLTgtMy41ODItOC04DQoJCXMzLjU4Mi04LDgtOHM4LDMuNTgyLDgsOFM0NDQuNDE4LDQ2NCw0NDAsNDY0eiIvPg0KPC9nPg0KPGc+DQoJPHBhdGggZD0iTTQxNiwxMTJ2NDhINjR2LTQ4SDE2djMyMGg0OHYtNDhoMzUydjQ4aDQ4VjExMkg0MTZ6IE00OCw0MTZIMzJWMTI4aDE2VjQxNnogTTY0LDIwOGgyNHY4MEg2NFYyMDh6IE02NCwzMDRoMjR2MzJINjRWMzA0DQoJCXogTTQxNiwzNjhINjR2LTE2aDM1MlYzNjh6IE0xMjAsMzA0djMyaC0xNnYtMzJIMTIweiBNMTA0LDI4OHYtODBoMTZ2ODBIMTA0eiBNMTUyLDMwNHYzMmgtMTZ2LTMySDE1MnogTTEzNiwyODh2LTgwaDE2djgwSDEzNnoNCgkJIE0xODQsMzA0djMyaC0xNnYtMzJIMTg0eiBNMTY4LDI4OHYtODBoMTZ2ODBIMTY4eiBNMjE2LDMwNHYzMmgtMTZ2LTMySDIxNnogTTIwMCwyODh2LTgwaDE2djgwSDIwMHogTTI0OCwzMDR2MzJoLTE2di0zMkgyNDh6DQoJCSBNMjMyLDI4OHYtODBoMTZ2ODBIMjMyeiBNMjgwLDMwNHYzMmgtMTZ2LTMySDI4MHogTTI2NCwyODh2LTgwaDE2djgwSDI2NHogTTMxMiwzMDR2MzJoLTE2di0zMkgzMTJ6IE0yOTYsMjg4di04MGgxNnY4MEgyOTZ6DQoJCSBNMzQ0LDMwNHYzMmgtMTZ2LTMySDM0NHogTTMyOCwyODh2LTgwaDE2djgwSDMyOHogTTM3NiwzMDR2MzJoLTE2di0zMkgzNzZ6IE0zNjAsMjg4di04MGgxNnY4MEgzNjB6IE00MTYsMzM2aC0yNHYtMzJoMjRWMzM2eg0KCQkgTTQxNiwyODhoLTI0di04MGgyNFYyODh6IE00MTYsMTkySDY0di0xNmgzNTJWMTkyeiBNNDQ4LDQxNmgtMTZWMTI4aDE2VjQxNnoiLz4NCjwvZz4NCjxnPg0KCTxwYXRoIGQ9Ik0yOTYsNTAuNzJjLTQuNTA5LDAuMDM0LTguOTE3LDEuMzM3LTEyLjcyLDMuNzZjLTEwLjMxMy03LjY4MS0yMi40OTUtMTIuNDYtMzUuMjgtMTMuODRWMGgtMTZ2NDAuNjQNCgkJYy0xMi43ODUsMS4zOC0yNC45NjcsNi4xNTktMzUuMjgsMTMuODRjLTMuODAzLTIuNDIzLTguMjExLTMuNzI2LTEyLjcyLTMuNzZjLTEzLjI1NSwwLTI0LDEwLjc0NS0yNCwyNGMwLDEzLjI1NSwxMC43NDUsMjQsMjQsMjQNCgkJczI0LTEwLjc0NSwyNC0yNGMtMC4wMTUtMi43MjMtMC40NzUtNS40MjUtMS4zNi04YzE5Ljg1NS0xNC41NjUsNDYuODY1LTE0LjU2NSw2Ni43MiwwYy0wLjg4NSwyLjU3NS0xLjM0NSw1LjI3Ny0xLjM2LDgNCgkJYzAsMTMuMjU1LDEwLjc0NSwyNCwyNCwyNHMyNC0xMC43NDUsMjQtMjRDMzIwLDYxLjQ2NSwzMDkuMjU1LDUwLjcyLDI5Niw1MC43MnogTTE4NCw4Mi43MmMtNC40MTgsMC04LTMuNTgyLTgtOA0KCQljMC00LjQxOCwzLjU4Mi04LDgtOHM4LDMuNTgyLDgsOEMxOTIsNzkuMTM4LDE4OC40MTgsODIuNzIsMTg0LDgyLjcyeiBNMjk2LDgyLjcyYy00LjQxOCwwLTgtMy41ODItOC04YzAtNC40MTgsMy41ODItOCw4LTgNCgkJczgsMy41ODIsOCw4QzMwNCw3OS4xMzgsMzAwLjQxOCw4Mi43MiwyOTYsODIuNzJ6Ii8+DQo8L2c+DQoNCjwvc3ZnPg0K",
                    "name": {
                        "en": "Nursery",
                        "de": "Kinderzimmer",
                        "ru": "Детская",
                        "pt": "Berçário",
                        "nl": "Kwekerij",
                        "fr": "Garderie",
                        "it": "Asilo nido",
                        "es": "Guardería",
                        "pl": "Żłobek"
                    },
                    "members": []
                },
                "type": "enum"
            },
            "enum.rooms.wc": {
                "_id": "enum.rooms.wc",
                "common": {
                    "icon": "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMjU2cHgiIGhlaWdodD0iMjU2cHgiPgo8Zz4KCTxnPgoJCTxwYXRoIGQ9Ik00NTEsMzE3di0zMGMwLTI0LjgxMy0yMC4xODctNDUtNDUtNDVIMjI2Yy01LjI1OSwwLTEwLjMwNSwwLjkxNS0xNSwyLjU4Vjg3LjQyYzE3LjQ1OS02LjE5MiwzMC0yMi44NjUsMzAtNDIuNDIgICAgYzAtMjQuODEzLTIwLjE4Ny00NS00NS00NUg3NmMtOC4yODQsMC0xNSw2LjcxNi0xNSwxNWMwLDI3LjcxLDAsMjQ2LjM4NSwwLDI3MmMwLDE5LjU1NSwxMi41NDEsMzYuMjI4LDMwLDQyLjQyVjM3NyAgICBjMCwyNy41MTksMTAuODU1LDUzLjkyNywzMCw3My40ODJWNDk3YzAsOC4yODQsNi43MTYsMTUsMTUsMTVjMTcuMzMsMCwyNTQuODQ2LDAsMjcwLDBjOC4yODQsMCwxNS02LjcxNiwxNS0xNXMtNi43MTYtMTUtMTUtMTUgICAgaC00NXYtMTcuOTkxQzQxNS45ODgsNDM1Ljk0Myw0NTEsMzc5LjI4Myw0NTEsMzE3eiBNMjI2LDI3MmgxODBjOC4yNzEsMCwxNSw2LjcyOSwxNSwxNXYxNUgyMTF2LTE1ICAgIEMyMTEsMjc4LjcyOSwyMTcuNzI5LDI3MiwyMjYsMjcyeiBNOTEsMzBoMTA1YzguMjcxLDAsMTUsNi43MjksMTUsMTVzLTYuNzI5LDE1LTE1LDE1SDkxVjMweiBNMTA2LDMwMmMtOC4yNzEsMC0xNS02LjcyOS0xNS0xNSAgICBWOTBoOTBjMCwxNy4zOSwwLDIwMC4yNzEsMCwyMTJIMTA2eiBNMzM5Ljk5NCw0NDAuNzczYy01LjQ2MywyLjM4Ny04Ljk5NCw3Ljc4My04Ljk5NCwxMy43NDVWNDgySDE1MXYtMzcuOTE3ICAgIGMwLTQuMjY3LTEuODE3LTguMzMyLTQuOTk2LTExLjE3N0MxMzAuMTEzLDQxOC42ODQsMTIxLDM5OC4zMDcsMTIxLDM3N3YtNDUuMWMzNC41MzUsMCwyOTYuNTQ1LDAsMjk5LjE2OCwwICAgIEM0MTQuODY0LDM3OS40OTMsMzg0LjU3NSw0MjEuMjk1LDMzOS45OTQsNDQwLjc3M3oiIGZpbGw9IiMwMDAwMDAiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K",
                    "name": {
                        "en": "WC",
                        "de": "Toilette",
                        "ru": "Туалет",
                        "pt": "Banheiro",
                        "nl": "WC",
                        "fr": "Toilettes",
                        "it": "Bagno",
                        "es": "Baño",
                        "pl": "Toaleta"
                    },
                    "members": []
                },
                "type": "enum"
            },
            "enum.rooms.garage": {
                "_id": "enum.rooms.kitchen",
                "common": {
                    "icon": "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ4MC4wMTMgNDgwLjAxMyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDgwLjAxMyA0ODAuMDEzOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjI1NnB4IiBoZWlnaHQ9IjI1NnB4Ij4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNMzkwLjk5OSwzMTYuOTUybC0zMC4yOTYtMjQuMjMyYy0xLjExMy0wLjg4Ny0xLjk2OS0yLjA1NS0yLjQ4LTMuMzg0bC0xMS42OC01NC40ICAgIGMtMi40MzItMTEuMDItMTIuMTc5LTE4Ljg4My0yMy40NjQtMTguOTI4SDE1Ni44MDdjLTExLjI2OC0wLjA1Mi0yMS4wMzYsNy43ODgtMjMuNDI0LDE4LjhsLTEyLDUzLjk1MiAgICBjLTAuNDAzLDEuNzgzLTEuMzk5LDMuMzc2LTIuODI0LDQuNTJsLTI5LjYsMjMuNjhjLTUuNjg3LDQuNTUyLTguOTg0LDExLjQ1Mi04Ljk1MiwxOC43MzZ2ODAuMzEyICAgIGMwLjAyMSw2Ljc4OCwyLjkzLDEzLjI0Niw4LDE3Ljc2djMwLjI0YzAsOC44MzcsNy4xNjMsMTYsMTYsMTZoMzJjOC44MzcsMCwxNi03LjE2MywxNi0xNnYtMjRoMTc2djI0YzAsOC44MzcsNy4xNjMsMTYsMTYsMTZoMzIgICAgYzguODM3LDAsMTYtNy4xNjMsMTYtMTZ2LTMwLjI0YzUuMDctNC41MTQsNy45NzktMTAuOTcyLDgtMTcuNzZ2LTgwLjMxMkM0MDAuMDI0LDMyOC40LDM5Ni43MDcsMzIxLjQ5NiwzOTAuOTk5LDMxNi45NTJ6ICAgICBNMjE4LjE0MywyMzguMzI4bDAtMC4wMDhsNC4yMDgtNi4zMmgxMDAuNzI4YzMuNzcyLTAuMDAxLDcuMDMyLDIuNjMyLDcuODI0LDYuMzJsMTAuNzA0LDQ5LjY4OEgyMjQuNzAzICAgIGM1Ljg4OC0xMS4wOTgsMy44NzEtMjQuNzM2LTQuOTc2LTMzLjY1NkMyMTUuNDYxLDI1MC4wNjQsMjE0Ljc5OSwyNDMuMzY4LDIxOC4xNDMsMjM4LjMyOHogTTE4NC4wNzksMjM4LjMyOHYtMC4wMDhsNC4yMDgtNi4zMiAgICBoMTUuMTQ0Yy01Ljg4LDExLjEwMS0zLjg2MSwyNC43MzYsNC45ODQsMzMuNjU2YzQuMjU4LDQuMjgsNC45MjYsMTAuOTYyLDEuNiwxNmwtNC4yMDgsNi4zMmgtMTUuMTYgICAgYzUuODgtMTEuMTAxLDMuODYxLTI0LjczNi00Ljk4NC0zMy42NTZDMTgxLjQxNCwyNTAuMDM3LDE4MC43NTMsMjQzLjM2MSwxODQuMDc5LDIzOC4zMjh6IE0xNDkuMDM5LDIzOC4yNjQgICAgYzAuNzkyLTMuNjU1LDQuMDI4LTYuMjYyLDcuNzY4LTYuMjU2aDEyLjU2Yy01Ljg4LDExLjEwMS0zLjg2MSwyNC43MzYsNC45ODQsMzMuNjU2YzQuMjU4LDQuMjgsNC45MjYsMTAuOTYyLDEuNiwxNmwtNC4yMDgsNi4zMiAgICBoLTMzLjc2TDE0OS4wMzksMjM4LjI2NHogTTEzNi4wMDcsNDY0LjAwOGgtMzJ2LTI0aDMyVjQ2NC4wMDh6IE0zNzYuMDA3LDQ2NC4wMDhoLTMydi0yNGgzMlY0NjQuMDA4eiBNMzg0LjAwNyw0MTYuMDA4ICAgIGMwLDQuNDE4LTMuNTgyLDgtOCw4aC0yNzJjLTQuNDE4LDAtOC0zLjU4Mi04LTh2LThoMjg4VjQxNi4wMDh6IE0zODQuMDA3LDM5Mi4wMDhoLTI4OHYtNTYuMzEyICAgIGMtMC4wMDYtMi40MzEsMS4xMDMtNC43MywzLjAwOC02LjI0bDI5LjYtMjMuNjhjMC42NDktMC41NTYsMS4yNjktMS4xNDYsMS44NTYtMS43NjhoMjE4LjkyOGMwLjQzMiwwLjQsMC44LDAuOCwxLjI5NiwxLjIgICAgbDMwLjMwNCwyNC4yNGMxLjksMS41MTcsMy4wMDcsMy44MTYsMy4wMDgsNi4yNDhWMzkyLjAwOHoiIGZpbGw9IiMwMDAwMDAiLz4KCTwvZz4KPC9nPgo8Zz4KCTxnPgoJCTxwYXRoIGQ9Ik0xMzIuMDA3LDMyOC4wMDhjLTE1LjQ2NCwwLTI4LDEyLjUzNi0yOCwyOGMwLDE1LjQ2NCwxMi41MzYsMjgsMjgsMjhzMjgtMTIuNTM2LDI4LTI4ICAgIEMxNjAuMDA3LDM0MC41NDQsMTQ3LjQ3MSwzMjguMDA4LDEzMi4wMDcsMzI4LjAwOHogTTEzMi4wMDcsMzY4LjAwOGMtNi42MjcsMC0xMi01LjM3My0xMi0xMmMwLTYuNjI3LDUuMzczLTEyLDEyLTEyICAgIGM2LjYyNywwLDEyLDUuMzczLDEyLDEyQzE0NC4wMDcsMzYyLjYzNSwxMzguNjM0LDM2OC4wMDgsMTMyLjAwNywzNjguMDA4eiIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTM0OC4wMDcsMzI4LjAwOGMtMTUuNDY0LDAtMjgsMTIuNTM2LTI4LDI4YzAsMTUuNDY0LDEyLjUzNiwyOCwyOCwyOGMxNS40NjQsMCwyOC0xMi41MzYsMjgtMjggICAgQzM3Ni4wMDcsMzQwLjU0NCwzNjMuNDcxLDMyOC4wMDgsMzQ4LjAwNywzMjguMDA4eiBNMzQ4LjAwNywzNjguMDA4Yy02LjYyNywwLTEyLTUuMzczLTEyLTEyYzAtNi42MjcsNS4zNzMtMTIsMTItMTIgICAgYzYuNjI3LDAsMTIsNS4zNzMsMTIsMTJDMzYwLjAwNywzNjIuNjM1LDM1NC42MzQsMzY4LjAwOCwzNDguMDA3LDM2OC4wMDh6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8L2c+CjwvZz4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNMjg4LjAwNywzMjguMDA4aC05NmMtOC44MzcsMC0xNiw3LjE2My0xNiwxNnYyNGMwLDguODM3LDcuMTYzLDE2LDE2LDE2aDk2YzguODM3LDAsMTYtNy4xNjMsMTYtMTZ2LTI0ICAgIEMzMDQuMDA3LDMzNS4xNzEsMjk2Ljg0NCwzMjguMDA4LDI4OC4wMDcsMzI4LjAwOHogTTI4OC4wMDcsMzY4LjAwOGgtOTZ2LTI0aDk2VjM2OC4wMDh6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8L2c+CjwvZz4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNDc1Ljg3MSwxMjlsLTIzMi0xMjhjLTIuNDA1LTEuMzI3LTUuMzIzLTEuMzI3LTcuNzI4LDBsLTIzMiwxMjhjLTMuODcsMi4xMzEtNS4yODEsNi45OTYtMy4xNSwxMC44NjYgICAgYzEuNDA3LDIuNTU2LDQuMDk1LDQuMTQ0LDcuMDEzLDQuMTQyaDh2MzM2aDQ4di0yOTZoMzUydjI5Nmg0OHYtMzM2aDhjNC40MTgsMC4wMDMsOC4wMDMtMy41NzYsOC4wMDYtNy45OTUgICAgQzQ4MC4wMTUsMTMzLjA5NSw0NzguNDI3LDEzMC40MDcsNDc1Ljg3MSwxMjl6IE0yNDAuMDA3LDE3LjE1MmwyMDAuOTM2LDExMC44NTZIMzkuMDcxTDI0MC4wMDcsMTcuMTUyeiBNNDQ4LjAwNyw0NjQuMDA4aC0xNiAgICB2LTI5NmgtMzg0djI5NmgtMTZ2LTMyMGg0MTZWNDY0LjAwOHoiIGZpbGw9IiMwMDAwMDAiLz4KCTwvZz4KPC9nPgo8Zz4KCTxnPgoJCTxwYXRoIGQ9Ik0xNjguMDA3LDc1LjA2NHY0NC45NDRoNjRWNDMuMDY0TDE2OC4wMDcsNzUuMDY0eiBNMjE2LjAwNywxMDQuMDA4aC0zMlY4NC45NTJsMzItMTZWMTA0LjAwOHoiIGZpbGw9IiMwMDAwMDAiLz4KCTwvZz4KPC9nPgo8Zz4KCTxnPgoJCTxwYXRoIGQ9Ik0yNDguMDA3LDQzLjA2NHY3Ni45NDRoNjRWNzUuMDY0TDI0OC4wMDcsNDMuMDY0eiBNMjk2LjAwNywxMDQuMDA4aC0zMlY2OC45NTJsMzIsMTZWMTA0LjAwOHoiIGZpbGw9IiMwMDAwMDAiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K",
                    "name": {
                        "en": "Garage",
                        "de": "Garage",
                        "ru": "Гараж",
                        "pt": "Garagem",
                        "nl": "Garage",
                        "fr": "Garage",
                        "it": "Box auto",
                        "es": "Garaje",
                        "pl": "Garaż"
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
                var len = oldId.length + 1;
                var children = [];
                for (var e = 0; e < that.list.length; e++) {
                    if (that.list[e].substring(0, len) === oldId + '.') {
                        children.push(that.list[e]);
                    }
                }

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
                            for (var i = 0; i < children.length; i++) {
                                var n = children[i].replace(oldId + '.', newId + '.');
                                count++;
                                _enumRename(children[i], n, null, function () {
                                    if (!--count && callback) callback();
                                });
                            }
                            if (!children.length && callback) {
                                callback();
                            }
                        }
                    }, 0);
                });
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
            that.$gridEnum.find('#btn-new-group-' + name).find('.new-group-item').off('click').on('click', function () {
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
            that.$gridEnum.find('.new-enum-item').off('click').on('click', function () {
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
        this.isTiles = (this.main.config.enumIsTiles !== undefined && this.main.config.enumIsTiles !== null) ? this.main.config.enumIsTiles : true;
    };

    function getName(objects, id) {
        var name;
        if (!id) {
            name = objects;
        } else {
            name = objects[id];
        }
        if (name && name.common && name.common.name) {
            name = translateName(name.common.name);
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
            '       <a class="btn-floating waves-effect waves-light blue btn-small dropdown-trigger btn-new-group-btn" title="' + _('New enum') + '" data-target="btn-new-group-' + name + '"><i class="material-icons">library_add</i></a>' +
            '       <ul id="btn-new-group-' + name + '" class="dropdown-content" data-id="' + id + '"></ul>' +
            '       <a class="btn-floating waves-effect waves-light btn-small btn-edit-category" title="' + _('Edit category') + '" data-id="' + id + '">' +
            '           <i class="material-icons">edit</i>' +
            '       </a>' +
            '       <a class="btn-floating waves-effect btn-small waves-light red lighten-2 btn-del-category ' + (obj && obj.common && (obj.common.dontDelete || obj.common['object-non-deletable']) ? 'disabled' : '') + '" title="' + _('Delete category') + '" data-id="' + id + '">' +
            '           <i class="material-icons">delete</i>' +
            '       </a>' +
            '   </div>' +
            '</div>';

        text += '<div class="row enum-body"><div class="col s12 enum-collection" data-id="' + id + '"><ul class="collection">';

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
                    that.main.getIcon(that.list[se], null, null, 'icon') +
                    '<span class="title">' + getName(that.main.objects, that.list[se]) + '</span>' +
                    '<p>' + that.list[se] + '</p><br>';

                if (en && en.common && en.common.members && en.common.members.length) {
                    for (var m = 0; m < en.common.members.length; m++) {
                        text += drawChip(en.common.members[m], that.list[se]);
                    }
                }
                text += '<a class="edit-content"   data-id="' + that.list[se] + '"><i class="material-icons">edit</i></a>';
                text += '<a class="delete-content ' + (en && en.common && (en.common.dontDelete || en.common['object-non-deletable']) ? 'disabled' : '') + '" data-id="' + that.list[se] + '"><i class="material-icons">delete</i></a>';
                text += '</li>';
            }
        }
        text += '</ul></div></div>';
        $page.html(text);
        prepareNewEnum(id);
        scrollTop && $page.find('.enum-collection').scrollTop(scrollTop);
    }

    function drawEnumsTiles() {
        var $tableBody = that.$gridList.find('.tree-table-body');
        that.$gridList.removeClass('tree-table-list').addClass('tree-table-tiles');
        that.$gridList.find('.tree-table-buttons').remove();

        // create buttons for panels
        that.$gridList.prepend('<div class="row tree-table-buttons">\n' +
            '           <a class="btn-floating btn-small translateT btn-switch-tiles" title="change view mode"><i class="material-icons">view_list</i></a>\n' +
            '           <a class="btn-floating waves-effect waves-light btn-small blue dropdown-trigger btn-new-enum-btn translationT" title="New enum" data-target="btn-new-enum"><i class="material-icons">note_add</i></a>\n' +
            '           <ul id="btn-new-enum" class="dropdown-content"></ul>\n' +
            '           <a class="btn-floating waves-effect waves-light blue btn-small btn-edit translateT" title="Edit" id="tab-enums-list-edit">\n' +
            '               <i class="material-icons">edit</i>\n' +
            '           </a>\n' +
            '        </div>');


        var text = '<div class="col s12 cron-main-tab">';
        text += '<ul class="tabs">';
        var parts;
        var id;
        for (var e = 0; e < that.list.length; e++) {
            parts = that.list[e].split('.');
            if (parts.length !== 2) continue;
            var name = getName(that.main.objects, that.list[e]);
            id = that.list[e].replace(/[#.\s_]/g, '-');
            text += '<li class="tab col"><a href="#enum-' + id + '">' + that.main.getIcon(that.list[e]) + '<span class="name">' + name + '</span></a></li>';
        }
        text += '</ul>';
        text += '</div>';
        for (var se = 0; se < that.list.length; se++) {
            parts = that.list[se].split('.');
            if (parts.length !== 2) continue;

            id = that.list[se].replace(/[#.\s_]/g, '-');
            text += '<div id="enum-' + id + '" class="col s12 page" data-id="' + that.list[se] + '" data-type="second">';
            text += '</div>';
        }
        var scrollTop = {};
        $tableBody.find('.enum-collection').each(function () {
            // remember actual offset
            scrollTop[$(this).data('id')] = $(this).scrollTop();
        });
        $tableBody.html(text);

        if ($tableBody.find('.tabs li').length > 0) {
            $tableBody.find('.tabs').mtabs({
                onShow: function (tab) {
                    that.main.saveConfig('enums-active', $(tab).attr('id'));
                }
            });
            if (that.main.config['enums-active'] && !that.main.noSelect) {
                $tableBody.find('.tabs').mtabs('select', that.main.config['enums-active']);
            }
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

        that.$gridList.find('.btn-edit').off('click').on('click', function () {
            switchEditMode(!that.editMode);
        });

        that.$gridList.find('.btn-switch-tiles').off('click').on('click', function () {
            that.isTiles = false;
            that.main.saveConfig('enumIsTiles', that.isTiles);

            setTimeout(function () {
                drawEnumsTable();
            }, 50);
        });
        prepareNewEnum();

        var $collection = that.$gridEnum.find('.tree-table-body .collection');
        setupDroppableTiles($collection);
    }

    function drawEnumsTable() {
        // extract all enums
        that.$gridList.html('').removeClass('tree-table-tiles').addClass('tree-table-list');


        that.$gridList.treeTable({
            objects:    that.main.objects,
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
                                removeMember(id, parent);
                            }
                        } else {
                            if (that.main.objects[parent] && that.main.objects[parent].type === 'enum') {
                                removeMember(id, parent);
                            } else {
                                showMessage(_('Object "<b>%s</b>" does not exists. Update the page.', id));
                            }
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
                    id:   'tab-enums-btn-switch-tiles',
                    title: _('change view mode'),
                    icon:   'view_module',
                    click: function () {
                        that.isTiles = true;
                        that.main.saveConfig('enumIsTiles', that.isTiles);
                        setTimeout(function () {
                            drawEnumsTiles();
                        }, 50);
                    }
                },
                {
                    id:   'tab-enums-list-new-enum',
                    title: _('New enum'),
                    icon:   'note_add',
                    click: function () {
                        createOrEditEnum(null);
                    }
                },
                {
                    id:   'tab-enums-list-new-category',
                    title:   _('New category'),
                    icon:   'library_add',
                    click: function () {
                        createOrEditEnum(null, that.enumEdit);
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
                        $('#tab-enums-list-new-enum').removeClass('disabled').attr('title', _('Create new enum, like %s', 'enum.newCategory'));
                        var parts = id.split('.');
                        if (parts.length === 2) {
                            that.$gridList.find('#tab-enums-list-new-category').removeClass('disabled').attr('title', _('Create new category, like %s', id + '.newEnum'));
                        } else {
                            that.$gridList.find('#tab-enums-list-new-category').addClass('disabled');
                        }
                    } else {
                        that.$gridList.find('#tab-enums-list-new-enum').addClass('disabled');
                        that.$gridList.find('#tab-enums-list-new-category').addClass('disabled');
                    }
                }
            },
            onReady:    setupDroppableTable
        });//.treeTable('show', currentEnum);
        that.$gridList.find('.tree-table-buttons a').addClass('btn-small');
        that.$gridList.find('#tab-enums-list-new-enum').addClass('disabled');
        that.$gridList.find('#tab-enums-list-new-category').addClass('disabled');
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

    function addMember(id, parent) {
        that.main.socket.emit('getObject', parent, function (err, obj) {
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
    };

    function setupDroppableTable($treetable) {
        if (!that.editMode) return;

        if (!$treetable) {
            $treetable = that.$gridEnum.find('.tree-table-main');
        }

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

                addMember(id, enumId);
            }
        });
    }

    function setupDroppableTiles($collection) {
        if (!that.editMode) return;

        $collection = $collection || that.$gridEnum.find('.tree-table-body .collection');

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
                addMember(id, enumId);
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
                $dialog.find('.tab-enums-dialog-new-icon img').attr('src', text);
                $dialog.find('.tab-enums-dialog-new-icon-clear').show();
            }
        });

        if (id) {
            if (that.main.objects[id] && that.main.objects[id].common) {
                nameVal      = translateName(that.main.objects[id].common.name);
                iconVal      = that.main.objects[id].common.icon;
                colorVal     = that.main.objects[id].common.color;
                isIdEditable = !that.main.objects[id].common['object-non-deletable'] && !that.main.objects[id].common.dontDelete;
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
            if (that.isTiles) {
                setupDroppableTiles();
            } else {
                setupDroppableTable();
            }
        } else {
            selectId('destroy');
            try {
                that.$gridEnum.find('.treetable-list').droppable('destroy');
            } catch (e) {
                console.error(e);
            }
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
            if (!this.main.objects['enum.rooms']) {
                this.main.objects['enum.rooms'] = {
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
                            "es": "Habitaciones",
                            "pl": "Pokoje"
                        },
                        "desc": {
                            "en": "List of the rooms",
                            "de": "Liste der Räumen",
                            "ru": "Список комнат",
                            "pt": "Lista dos quartos",
                            "nl": "Lijst met kamers",
                            "fr": "Liste des chambres",
                            "it": "Elenco delle stanze",
                            "es": "Lista de las habitaciones",
                            "pl": "Lista pokoi"
                        },
                        "members": [],
                        "dontDelete": true
                    },
                    "type": "enum",
                    "acl": {
                        "owner": "system.user.admin",
                        "ownerGroup": "system.group.administrator",
                        "permissions": 1911
                    }
                };
                this.list.unshift('enum.rooms');
            }
            if (!this.main.objects['enum.functions']) {
                this.main.objects['enum.functions'] = {
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
                            "es": "Funciones",
                            "pl": "Funkcje"
                        },
                        "desc": {
                            "en": "List of the functions",
                            "de": "Liste der Funktionen",
                            "ru": "Список функций",
                            "pt": "Lista das funções",
                            "nl": "Lijst met functies",
                            "fr": "Liste des fonctions",
                            "it": "Elenco delle funzioni",
                            "es": "Lista de las funciones",
                            "pl": "Lista funkcji"
                        },
                        "members": [],
                        "dontDelete": true
                    },
                    "type": "enum",
                    "acl": {
                        "owner": "system.user.admin",
                        "ownerGroup": "system.group.administrator",
                        "permissions": 1911
                    }
                };
                this.list.unshift('enum.functions');
            }

            if (this.isTiles) {
                drawEnumsTiles();
            } else {
                drawEnumsTable();
            }
            if (this.editMode) {
                this._initObjectTree();
            } else {
                selectId('destroy');
            }
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

    this.objectChange = function (id, obj, action) {
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

        if (this.$grid) selectId('object', id, obj, action);
    };
}
