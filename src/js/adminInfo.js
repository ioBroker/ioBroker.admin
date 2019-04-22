/* global socket, systemLang */

function InfoAdapter(main) {

    var that = this;
    this.main = main;

    this.checkVersion = function (smaller, bigger) {
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
        that.main.socket.emit('getState', 'info.0.last_popup', function (err, dateObj) {
            if (!err && dateObj) {
                that.checkAndSetData(obj, dateObj.val);
            }
        });
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
        that.main.socket.emit('setState', 'info.0.last_popup', {val: new Date().toISOString(), ack: true});
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
                            const adapter = adapters[key];
                            const condition = message.conditions[key];
                            if (!adapter && condition !== "!installed") {
                                showIt = false;
                            } else if (adapter && condition === "!installed") {
                                showIt = false;
                            } else if (adapter && condition.startsWith("equals")) {
                                const vers = condition.substring(7, condition.length - 1).trim();
                                showIt = (adapter.version === vers);
                            } else if (adapter && condition.startsWith("bigger")) {
                                const vers = condition.substring(7, condition.length - 1).trim();
                                showIt = that.checkVersion(vers, adapter.version);
                            } else if (adapter && condition.startsWith("smaller")) {
                                const vers = condition.substring(8, condition.length - 1).trim();
                                showIt = that.checkVersion(adapter.version, vers);
                            } else if (adapter && condition.startsWith("between")) {
                                const vers1 = condition.substring(8, condition.indexOf(',')).trim();
                                const vers2 = condition.substring(condition.indexOf(',') + 1, condition.length - 1).trim();
                                showIt = that.checkVersionBetween(adapter.version, vers1, vers2);
                            }
                        });
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
        }
    };

}