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
        if (typeof save == 'undefined') {
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
                systemLang = res.common.language || systemLang;
            }
            socket.emit('getObject', 'system.certificates', function (err, res) {
                if (!err && res) {
                    if (res.native && res.native.certificates) {
                        certs = [];
                        for (var c in res.native.certificates) {
                            if (!res.native.certificates[c]) continue;
                            certs.push({
                                name: c,
                                type: (res.native.certificates[c].substring(0, '-----BEGIN RSA PRIVATE KEY'.length) == '-----BEGIN RSA PRIVATE KEY') ? 'private' : 'public'
                            });
                        }
                    }
                }
                if (callback) callback();
            });
        });
    }

    function loadSettings() {
        socket.emit('getObject', id, function (err, res) {
            if (!err && res && res.native) {
                $('.adapter-instance').html(adapter + '.' + instance);
                $('.adapter-config').html('system.adapter.' + adapter + '.' + instance);
                common = res.common;
                if (res.common && res.common.name) $('.adapter-name').html(res.common.name);
                if (typeof load == 'undefined') {
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
            var IPs4 = [{name: '[IPv4] 0.0.0.0', address: '0.0.0.0', family: 'ipv4'}];
            var IPs6 = [{name: '[IPv6] ::',      address: '::',      family: 'ipv6'}];
            if (host.native.hardware && host.native.hardware.networkInterfaces) {
                for (var eth in host.native.hardware.networkInterfaces) {
                    for (var num = 0; num < host.native.hardware.networkInterfaces[eth].length; num++) {
                        if (host.native.hardware.networkInterfaces[eth][num].family != "IPv6") {
                            IPs4.push({name: '[' + host.native.hardware.networkInterfaces[eth][num].family + '] ' + host.native.hardware.networkInterfaces[eth][num].address + ' - ' + eth, address: host.native.hardware.networkInterfaces[eth][num].address, family: 'ipv4'});
                        } else {
                            IPs6.push({name: '[' + host.native.hardware.networkInterfaces[eth][num].family + '] ' + host.native.hardware.networkInterfaces[eth][num].address + ' - ' + eth, address: host.native.hardware.networkInterfaces[eth][num].address, family: 'ipv6'});
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

function fillSelectIPs(id, actualAddr, noIPv4, noIPv6) {
    getIPs(function (ips) {
        var str = '';
        for (var i = 0; i < ips.length; i++) {
            if (noIPv4 && ips[i].family == 'ipv4') continue;
            if (noIPv6 && ips[i].family == 'ipv6') continue;
            str += '<option value="' + ips[i].address + '" ' + ((ips[i].address == actualAddr) ? 'selected' : '') + '>' + ips[i].name + '</option>';
        }

        $(id).html(str);
    });
}

function sendTo(adapter, command, message, callback) {
    socket.emit('sendTo', adapter, command, message, callback);
}

function showMessage(message, lang) {
    alert(message);
}

// fills select with names of the certificates and preselect it
function fillSelectCertificates(id, type, actualValued) {
    var str = '<option value="">' +_('none') + '</option>';
    for (var i = 0; i < certs.length; i++) {
        if (certs[i].type != type) continue;
        str += '<option value="' + certs[i].name + '" ' + ((certs[i].name == actualValued) ? 'selected' : '') + '>' + certs[i].name + '</option>';
    }

    $(id).html(str);
}

function getAdapterInstances(adapter, callback) {
    socket.emit('getObjectView', 'system', 'instance', {startkey: 'system.adapter.' + adapter, endkey: 'system.adapter.' + adapter + '.\u9999'}, function (err, doc) {
        if (err) {
            if (callback) callback ([]);
        } else {
            if (doc.rows.length === 0) {
                if (callback) callback ([]);
            } else {
                var res = [];
                for (var i = 0; i < doc.rows.length; i++) {
                    res.push(doc.rows[i].value);
                }
                if (callback) callback (res);
            }
        }

    });
}
