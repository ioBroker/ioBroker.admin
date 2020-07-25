/* global socket, systemLang */

function InfoAdapter(main) {

    var that = this;
    
    this.systemData = {"node": null, "npm": null, "os": null, "uuid": null};
    this.main = main;

    this.checkVersion = function (smaller, bigger) {
        if (smaller === undefined || bigger === undefined) {
            return false;
        }
        smaller = smaller.split('.');
        bigger = bigger.split('.');
        smaller[0] = parseInt(smaller[0], 10);
        bigger[0] = parseInt(bigger[0], 10);

        if (smaller[0] > bigger[0]) {
            return false;
        } else if (smaller[0] === bigger[0]) {
            smaller[1] = parseInt(smaller[1], 10);
            bigger[1] = parseInt(bigger[1], 10);
            if (smaller[1] > bigger[1]) {
                return false;
            } else if (smaller[1] === bigger[1]) {
                smaller[2] = parseInt(smaller[2], 10);
                bigger[2] = parseInt(bigger[2], 10);
                return (smaller[2] < bigger[2]);
            } else {
                return true;
            }
        } else {
            return true;
        }
    };

    this.checkVersionBetween = function (inst, vers1, vers2) {
        return inst === vers1 || inst === vers2 || (that.checkVersion(vers1, inst) && that.checkVersion(inst, vers2));
    };

    this.showPopup = function (obj) {
        if (sessionStorage.getItem('ioBroker.info.lastPopup')) {
            that.checkAndSetData(obj, sessionStorage.getItem('ioBroker.info.lastPopup'));
        } else {
            that.main.socket.emit('getState', 'info.0.last_popup', function (err, dateObj) {
                if (!err && dateObj) {
                    sessionStorage.setItem('ioBroker.info.lastPopup', dateObj.val);
                    that.checkAndSetData(obj, dateObj.val);
                }
            });
        }
    };

    this.checkAndSetData = async function (messagesObj, date) {
        const messages = await that.checkMessages(messagesObj, date);
        if (messages.length === 1) {
            const message = messages[0];
            that.main.showMessage(message.content, message.title, message.class);
        } else if (messages.length > 1) {
            let content = "<ol>";
            const idArray = [];
            messages.forEach(function (message) {
                if (idArray.indexOf(message.id) === -1) {
                    content += "<li>";
                    content += "<h5>" + message.title + "</h5>";
                    content += "<p>" + message.content + "</p>";
                    content += "</li>";
                    idArray.push(message.id);
                }
            });
            content += "</ol>";
            that.main.showMessage(content, _("Please read these important notes:"), "error");
        }
        if (messages.length > 0) {
            sessionStorage.setItem('ioBroker.info.lastPopup', new Date().toISOString());
            that.main.socket.emit('setState', 'info.0.last_popup', {val: new Date().toISOString(), ack: true});
        }
    };
    
    this.checkActive = function (adapterName) {
        const instances = that.main.instances;
        if (!instances) {
            return false;
        }
        const instCreated = instances.filter(function (str) {
            return str.includes("." + adapterName + ".");
        });
        if (instCreated.length === 0) {
            return false;
        }
        let i;
        for (i = 0; i < instCreated.length; i++) {
            if (that.main.objects[instCreated[i]].common.enabled) {
                return true;
            }
        }
        return false;
    }

    this.checkConditions = function (condition, installedVersion) {
        if (condition.startsWith("equals")) {
            const vers = condition.substring(7, condition.length - 1).trim();
            return (installedVersion === vers);
        } else if (condition.startsWith("bigger")) {
            const vers = condition.substring(7, condition.length - 1).trim();
            return that.checkVersion(vers, installedVersion);
        } else if (condition.startsWith("smaller")) {
            const vers = condition.substring(8, condition.length - 1).trim();
            return that.checkVersion(installedVersion, vers);
        } else if (condition.startsWith("between")) {
            const vers1 = condition.substring(8, condition.indexOf(',')).trim();
            const vers2 = condition.substring(condition.indexOf(',') + 1, condition.length - 1).trim();
            return that.checkVersionBetween(installedVersion, vers1, vers2);
        } else {
            return true;
        }
    };

    this.checkMessages = async function (obj, date) {
        const messagesToShow = [];

        try {
            const messages = JSON.parse(obj);
            const today = new Date().getTime();
            let lastMessage = 0;
            if (date) {
                lastMessage = new Date(date).getTime();
            }
            if (messages.length > 0) {
                await asyncForEach(messages, async function (message) {
                    let showIt = true;

                    if (showIt && message['created'] && new Date(message['created']).getTime() < lastMessage) {
                        showIt = false;
                    } else if (showIt && message['date-start'] && new Date(message['date-start']).getTime() > today) {
                        showIt = false;
                    } else if (showIt && message['date-end'] && new Date(message['date-end']).getTime() < today) {
                        showIt = false;
                    } else if (showIt && message.conditions && Object.keys(message.conditions).length > 0) {
                        const adapters = that.main.tabs.adapters.curInstalled;
                        await asyncForEach(Object.keys(message.conditions), function (key) {
                            if(showIt) {
                                const adapter = adapters[key];
                                const condition = message.conditions[key];

                                if (!adapter && condition !== "!installed") {
                                    showIt = false;
                                } else if (adapter && condition === "!installed") {
                                    showIt = false;
                                } else if (adapter && condition === "active") {
                                    showIt = that.checkActive(key);
                                } else if (adapter && condition === "!active") {
                                    showIt = !that.checkActive(key);
                                } else if (adapter) {
                                    showIt = that.checkConditions(condition, adapter.version);
                                }
                            }
                        });
                    }

                    if (showIt && message['node-version']) {
                        const condition = message['node-version'];
                        showIt = that.systemData.node !== null && that.checkConditions(condition, that.systemData.node);
                    }
                    if (showIt && message['npm-version']) {
                        const condition = message['npm-version'];
                        showIt = that.systemData.npm !== null && that.checkConditions(condition, that.systemData.npm);
                    }
                    if (showIt && message['os']) {
                        showIt = that.systemData.os !== null && that.systemData.os === message['os'];
                    }
                    if (showIt && message['repo']) {
                        showIt = that.main.systemConfig.common.activeRepo === message['repo'];
                    }                    
                    if (showIt && message['uuid']) {
                        if (Array.isArray(message['uuid'])) {
                            let oneMustBe = false;
                            if(that.systemData.uuid){
                                await asyncForEach(message['uuid'], function(uuid){
                                    if (!oneMustBe) {
                                        oneMustBe = that.systemData.uuid === uuid;
                                    }
                                });
                            }
                            showIt = oneMustBe;
                        } else {
                            showIt = that.systemData.uuid && that.systemData.uuid === message['uuid'];
                        }
                    }

                    if (showIt) {
                        messagesToShow.push({"id": message.id, "title": message.title[systemLang], "content": message.content[systemLang], "class": message.class, "icon": message['fa-icon'], "created": message.created});
                    }
                });
            }

        } catch (err) {
        }

        return messagesToShow;
    };

    this.init = function () {

        that.main.socket.emit('getState', 'info.0.sysinfo.os.versions.node', function (err, data) {
            if (!err && data) {
                that.systemData.node = data.val;
            }
        });
        that.main.socket.emit('getState', 'info.0.sysinfo.os.versions.npm', function (err, data) {
            if (!err && data) {
                that.systemData.npm = data.val;
            }
        });
        that.main.socket.emit('getState', 'info.0.sysinfo.os.info.platform', function (err, data) {
            if (!err && data) {
                that.systemData.os = data.val;
            }
        });
        that.main.socket.emit('getState', 'info.0.uuid', function (err, data) {
            if (!err && data) {
                that.systemData.uuid = data.val;
            }
        });

        if (that.main.objects["info.0.newsfeed"] && that.main.objects["info.0.last_popup"]) {
            that.main.socket.emit('subscribe', 'info.0.newsfeed');

            that.main.socket.on('stateChange', function (id, obj) {
                if (id === "info.0.newsfeed") {
                    that.showPopup(obj.val);
                }
            });

            that.main.socket.emit('getState', 'info.0.newsfeed', async function (err, obj) {
                if (!err && obj) {
                    that.showPopup(obj.val);
                }
            });
        } else if (!that.main.systemConfig.common.infoAdapterInstall) {

            if (that.main.objects['system.adapter.info.0']) {
                // if installed version too old
                that.main.confirmMessage(_('<p>Your version of the info adapter is outdated. It is strongly recommended to update this to get on the enjoyment of the innovations. Only with the new version, for example, messages from the ioBroker team can be displayed directly.</p><p>Would you like to update the info adapter?</p>'), _('Update info adapter'), 'info', function (result) {
                    if (result) {
                        that.main.cmdExec(null, 'upgrade info', function (exitCode) {
                            if (!exitCode) {
                                location.reload(true);
                            }
                        });
                    }
                });
            } else {
                // if info adapter is not installed
                that.main.confirmMessage(_('<p>You have not installed an Info Adapter. The adapter shows you information about the system and is required to display important messages from the ioBroker team.</p><p>Do you want to install the info adapter?</p>'), _('Info adapter not found'), 'info', function (result) {
                    if (result) {
                        that.main.cmdExec(null, 'add info 0', function (exitCode) {
                            if (!exitCode) {
                                location.reload(true);
                            }
                        });
                    }
                });
            }

            main.socket.emit('getObject', 'system.config', function (err, obj) {
                //ask only one time
                if (err || !obj) {
                    main.showError(_('Cannot confirm: ' + err));
                    return;
                }
                obj.common = obj.common || {};
                obj.common.infoAdapterInstall = true;
                main.socket.emit('setObject', 'system.config', obj, function (err) {
                    if (err) {
                        main.showError(err);
                    }
                });
            });
        }
    };

}
