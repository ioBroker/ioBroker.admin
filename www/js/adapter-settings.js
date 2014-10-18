var socket =   io.connect();
var instance = window.location.search.slice(1);
var common =   null; // common information of adapter
var host =     null; // host object on which the adapter runs
var changed =  false;
var certs =    [];

$(document).ready(function () {

    var tmp = window.location.pathname.split('/');
    var adapter = tmp[2];
    var id = 'system.adapter.' + adapter + '.' + instance;

    // Extend dictionary with standard words for adapter
    if (typeof systemDictionary === 'undefined') systemDictionary = {};
    systemDictionary.save = {"en": "Save", "de": "Speichern", "ru": "Сохранить"};


    loadSystemConfig(function () {
        if (typeof translateAll === 'function') translateAll();
        loadSettings();
    });

    $('body').prepend('<div class="header ui-tabs-nav ui-widget ui-widget-header ui-corner-all" >' +
        '<input type="button" id="save" class="translateV" value="save"/></div>');
         /*+
        '<input type="button" id="saveclose" class="translateV" value="save and close"/>' +
        '<input type="button" id="close" class="translateV" value="close"/>' +
        '</div>')*/

    $('input[type="button"]').button();
    $('input#save').click(function () {
        if (!save) {
            alert("Please implement save function in your admin/index.html");
            return;
        }
        save(function (obj) {
            saveSettings(obj);
        });
    });
    $('input#saveclose').click(function () {
        if (!save) {
            alert("Please implement save function in your admin/index.html");
            return;
        }
        save(function (obj) {
            saveSettings(obj);
            window.close();
            if (parent && parent.$iframeDialog) {
                parent.$iframeDialog.dialog('close');
            }
        });
    });
    $('input#close').click(function () {
        window.close();
        if (parent && parent.$iframeDialog) {
            parent.$iframeDialog.dialog('close');
        }
    });

    function saveSettings(obj) {
        socket.emit('extendObject', id, {native: obj});
    }

    // Read language settings
    function loadSystemConfig(callback) {
        socket.emit('getObject', 'system.config', function (err, res) {
            if (!err && res && res.common) {
                if (res.common.certificates) {
                    certs = [];
                    for (var c in res.common.certificates) {
                        certs.push(c);
                    }
                }
                systemLang = res.common.language || systemLang;
            }
            if (callback) callback();
        });
    }

    function loadSettings() {
        socket.emit('getObject', id, function (err, res) {
            if (!err && res && res.native) {
                $('.adapter-instance').html(adapter + '.' + instance);
                $('.adapter-config').html('system.adapter.' + adapter + '.' + instance);
                common = res.common;
                if (res.common && res.common.name) $('.adapter-name').html(res.common.name);
                if (!load) {
                    alert("Please implement save function in your admin/index.html");
                } else {
                    load(res.native);
                }
            } else {
                alert('error loading settings for ' + id + '\n\n' + err);
            }
        });
    }
});

function getObject(id, callback) {
    socket.emit('getObject', id, function (err, res) {
        if (!err && res) {
            if (callback) callback(err, res);
        } else {
            if (callback) callback(null);
        }
    });
}

function getState(id, callback) {
    socket.emit('getState', id, function (err, res) {
        if (!err && res) {
            if (callback) callback(err, res);
        } else {
            if (callback) callback(null);
        }
    });
}

function getEnums(enums, callback) {
   if (callback) callback(null, ['Whonzimmer', 'Küche', 'WC']);
}

function getIPs(callback) {
    socket.emit('getHostByIp', common.host, function (ip, _host) {
        if (_host) {
            host = _host;
            var IPs4 = [{name: '[IPv4] 0.0.0.0', address: '0.0.0.0'}];
            var IPs6 = [{name: '[IPv6] ::',      address: '::'}];
            if (host.native.hardware && host.native.hardware.networkInterfaces) {
                for (var eth in host.native.hardware.networkInterfaces) {
                    for (var num = 0; num < host.native.hardware.networkInterfaces[eth].length; num++) {
                        if (host.native.hardware.networkInterfaces[eth][num].family != "IPv6") {
                            IPs4.push({name: '[' + host.native.hardware.networkInterfaces[eth][num].family + '] ' + host.native.hardware.networkInterfaces[eth][num].address + ' - ' + eth, address: host.native.hardware.networkInterfaces[eth][num].address});
                        } else {
                            IPs6.push({name: '[' + host.native.hardware.networkInterfaces[eth][num].family + '] ' + host.native.hardware.networkInterfaces[eth][num].address + ' - ' + eth, address: host.native.hardware.networkInterfaces[eth][num].address});
                        }
                    }
                }
            }
            for (var i = 0; i < IPs6.length; i++) {
                IPs4.push(IPs6[i]);
            }
            callback(IPs4);
        }
    });
}

function sendTo(adapter, command, message, callback) {
    socket.emit('sendTo', adapter, command, message, callback);
}

function showMessage(message, lang) {
    alert(message);
}

// fills select with names of the certificates and preselect it
function fillSelectCertificates(id, value) {
    var str = '';
    for (var i = 0; i < certs.length; i++) {
        str += '<option value="' + certs[i] + '" ' + ((certs[i] == value) ? 'selected' : '') + '>' + certs[i] + '</option>';
    }

    $(id).html(str);
}


