"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCommonObjects = checkCommonObjects;
exports.validateUserData0 = validateUserData0;
exports.updateIcons = updateIcons;
exports.updateDevicesObject = updateDevicesObject;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const adapter_core_1 = require("@iobroker/adapter-core");
// this function re-check if the common objects like '0_userdata.0' exist
async function checkCommonObjects(adapter) {
    // try to find js-controller directory
    let objects;
    try {
        const dir = require.resolve('iobroker.js-controller/io-package.json').replace(/\\/g, '/');
        // dir is something like ./node_modules/iobroker.js-controller/build/cjs/main.js
        if ((0, node_fs_1.existsSync)(dir)) {
            const data = JSON.parse((0, node_fs_1.readFileSync)(dir).toString());
            if (data.objects) {
                objects = data.objects;
            }
        }
    }
    catch {
        // ignore
    }
    if (objects) {
        for (let i = 0; i < objects.length; i++) {
            const obj = await adapter.getForeignObjectAsync(objects[i]._id);
            if (!obj) {
                await adapter.setForeignObjectAsync(objects[i]._id, objects[i]);
            }
        }
    }
    else {
        // check the meta-object 0_userdata.0 and create it if required
        let userData = await adapter.getForeignObjectAsync('0_userdata.0');
        if (!userData) {
            userData = {
                _id: '0_userdata.0',
                type: 'meta',
                common: {
                    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjRweCI+DQogICAgPGcgZmlsbD0iY3VycmVudENvbG9yIj4NCiAgICAgICAgPHBhdGggZD0iTTE5LDV2MTRINVY1SDE5IE0xOSwzSDVDMy45LDMsMywzLjksMyw1djE0YzAsMS4xLDAuOSwyLDIsMmgxNGMxLjEsMCwyLTAuOSwyLTJWNUMyMSwzLjksMjAuMSwzLDE5LDNMMTksM3oiLz4NCiAgICAgICAgPHBhdGggZD0iTTE0LDE3SDd2LTJoN1YxN3ogTTE3LDEzSDd2LTJoMTBWMTN6IE0xNyw5SDdWN2gxMFY5eiIvPg0KICAgIDwvZz4NCjwvc3ZnPg==',
                    name: {
                        en: 'User objects and files root folder',
                        de: 'Stammordner für Benutzerobjekte und Dateien',
                        ru: 'Корневая папка пользовательских объектов и файлов',
                        pt: 'Pasta raiz de objetos e arquivos do usuário',
                        nl: 'Hoofdmap van objecten en bestanden van gebruikers',
                        fr: 'Objets utilisateur et dossier racine des fichiers',
                        it: "Cartella principale di oggetti e file dell'utente",
                        es: 'Carpeta raíz de objetos y archivos de usuario',
                        pl: 'Folder główny obiektów i plików użytkownika',
                        uk: "Коренева папка об'єктів користувача та файлів",
                        'zh-cn': '用户对象和文件根文件夹',
                    },
                    desc: {
                        en: 'Here you can upload your files or create your private objects and states',
                        de: 'Hier können eigene Dateien hochgeladen oder private Objekte und Zustände erstellt werden',
                        ru: 'Здесь вы можете загрузить свои файлы или создать свои личные объекты и состояния',
                        pt: 'Aqui você pode enviar seus arquivos ou criar seus objetos e estados particulares',
                        nl: 'Hier kunt u uw bestanden uploaden of uw privé-objecten en statussen maken',
                        fr: 'Ici, vous pouvez télécharger vos fichiers ou créer vos objets et états privés',
                        it: 'Qui puoi caricare i tuoi file o creare oggetti e stati privati',
                        es: 'Aquí puede cargar sus archivos o crear sus objetos y estados privados',
                        pl: 'Tutaj możesz przesyłać pliki lub tworzyć prywatne obiekty i stany',
                        uk: "Тут ви можете завантажити свої файли або створити свої приватні об'єкти та стани",
                        'zh-cn': '在这里您可以上传文件或创建私有对象和状态',
                    },
                    type: 'meta.user',
                    dontDelete: true,
                },
                acl: {
                    owner: 'system.user.admin',
                    ownerGroup: 'system.group.administrator',
                    object: 1604,
                },
            };
            await adapter.setForeignObject(userData._id, userData);
        }
    }
}
/**
 * Create 0_userdata if it does not exist
 */
async function validateUserData0(adapter) {
    let obj;
    try {
        obj = await adapter.getForeignObjectAsync('0_userdata.0');
    }
    catch {
        // ignore
    }
    if (!obj) {
        try {
            const ioContent = (0, node_fs_1.readFileSync)(`${adapter_core_1.controllerDir}/io-package.json`).toString('utf8');
            const io = JSON.parse(ioContent);
            if (io.objects) {
                const userData = io.objects.find((obj) => obj._id === '0_userdata.0');
                if (userData) {
                    await adapter.setForeignObjectAsync(userData._id, userData);
                    adapter.log.info('Object 0_userdata.0 was re-created');
                }
            }
        }
        catch (e) {
            adapter.log.error(`Cannot read ${adapter_core_1.controllerDir}/io-package.json: ${e}`);
        }
    }
}
// update icons by all known default objects. Remove this function after 2 years (BF: 2021.04.20)
function updateIcons(adapter) {
    if ((0, node_fs_1.existsSync)(`${adapter_core_1.controllerDir}/io-package.json`)) {
        const ioPackage = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(adapter_core_1.controllerDir, 'io-package.json'), {
            encoding: 'utf-8',
        }));
        ioPackage.objects.forEach(async (obj) => {
            if (obj.common?.icon && obj.common.icon.length > 50) {
                const cObj = await adapter.getForeignObjectAsync(obj._id);
                if (cObj?.common && (!cObj.common.icon || cObj.common.icon.length < 50)) {
                    adapter.log.debug(`Update icon for ${cObj._id}`);
                    cObj.common.icon = obj.common.icon;
                    await adapter.setForeignObjectAsync(cObj._id, cObj);
                }
            }
        });
    }
}
// We have a problem that `devices` adapter changed the mode from 'none' to 'daemon' from version 2.x. This option will not be updated automatically
async function updateDevicesObject(adapter) {
    const res = await adapter.getObjectViewAsync('system', 'instance', {
        startkey: 'system.adapter.devices.',
        endkey: 'system.adapter.devices.\u9999',
    });
    if (res?.rows?.length) {
        for (const row of res.rows) {
            const obj = row.value;
            const majorVersion = parseInt(obj.common.version.split('.')[0], 10);
            if (obj.common.mode !== 'daemon' && majorVersion >= 2) {
                obj.common.mode = 'daemon';
                await adapter.setForeignObjectAsync(obj._id, obj);
            }
        }
    }
}
//# sourceMappingURL=objectFixes.js.map